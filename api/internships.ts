import type { IncomingMessage, ServerResponse } from 'http';

interface UpstreamResult {
  data: any[];
  timestamp: number;
}

let cachedResult: UpstreamResult | null = null;
let inFlightPromise: Promise<UpstreamResult> | null = null;

const UPSTREAM_TIMEOUT_MS = 15000;
const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024;

function validateUpstreamPayload(json: unknown): any[] {
  if (!json || typeof json !== 'object') {
    throw new Error('Invalid upstream JSON response.');
  }

  const obj = json as Record<string, unknown>;

  if (obj.success === false || obj.status === 'error') {
    throw new Error(
      `Apps Script error: ${String(obj.message || 'Unknown error')}`
    );
  }

  const list = Array.isArray(json)
    ? json
    : Array.isArray(obj.data)
      ? obj.data
      : Array.isArray(obj.internships)
        ? obj.internships
        : Array.isArray(obj.events)
          ? obj.events
          : null;

  if (!list) {
    throw new Error('Upstream JSON does not contain an internships array.');
  }

  return list.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item && typeof item === 'object' && !Array.isArray(item))
  );
}

async function fetchFromAppsScript(
  baseUrl: string
): Promise<UpstreamResult> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    UPSTREAM_TIMEOUT_MS
  );

  const separator = baseUrl.includes('?') ? '&' : '?';
  const endpointUrl = `${baseUrl}${separator}type=internships`;

  try {
    const response = await fetch(endpointUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'CampusConnect-InternshipProxy/1.0',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Google Apps Script returned HTTP ${response.status}.`
      );
    }

    const finalUrl = response.url || '';

    if (
      finalUrl.includes('accounts.google.com') ||
      finalUrl.includes('ServiceLogin')
    ) {
      throw new Error(
        'Google Apps Script redirected to Google sign-in. Check anonymous web app access.'
      );
    }

    const contentType = response.headers.get('content-type') || '';

    const contentLength = response.headers.get('content-length');
    if (
      contentLength &&
      Number(contentLength) > MAX_PAYLOAD_BYTES
    ) {
      throw new Error('Upstream response exceeded the 5 MB limit.');
    }

    const text = await response.text();

    if (new TextEncoder().encode(text).byteLength > MAX_PAYLOAD_BYTES) {
      throw new Error('Upstream response body exceeded the 5 MB limit.');
    }

    if (
      contentType.includes('text/html') ||
      text.trim().toLowerCase().startsWith('<!doctype html') ||
      text.trim().toLowerCase().startsWith('<html')
    ) {
      throw new Error(
        'Google returned an HTML page instead of JSON. Check the Apps Script deployment access.'
      );
    }

    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(text);
    } catch {
      throw new Error('Google Apps Script returned invalid JSON.');
    }

    const validatedList = validateUpstreamPayload(parsedJson);

    return {
      data: validatedList,
      timestamp: Date.now(),
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Google Apps Script request timed out.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  const request = req as IncomingMessage & { method?: string };

  const response = res as ServerResponse & {
    status: (code: number) => any;
    json: (body: unknown) => any;
  };

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({
      status: 'error',
      message: 'Method Not Allowed. Use GET.',
    });
  }

  const upstreamUrl = (
    process.env.APPS_SCRIPT_URL ||
    process.env.VITE_APPS_SCRIPT_URL ||
    ''
  ).trim();

  if (!upstreamUrl.startsWith('https://script.google.com/macros/s/')) {
    return response.status(500).json({
      status: 'error',
      message: 'APPS_SCRIPT_URL is missing or invalid.',
    });
  }

  try {
    if (!inFlightPromise) {
      inFlightPromise = fetchFromAppsScript(upstreamUrl)
        .then((result) => {
          cachedResult = result;
          return result;
        })
        .finally(() => {
          inFlightPromise = null;
        });
    }

    const result = await inFlightPromise;

    response.setHeader(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    );
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('X-CampusConnect-Source', 'upstream_live');

    return response.status(200).json({
      status: 'success',
      count: result.data.length,
      data: result.data,
      is_stale: false,
      fetched_at: new Date(result.timestamp).toISOString(),
    });
  } catch (error: unknown) {
    console.error('[CampusConnect Internship Proxy]', error);

    if (cachedResult && cachedResult.data.length > 0) {
      response.setHeader(
        'Cache-Control',
        'public, max-age=15, stale-while-revalidate=60'
      );
      response.setHeader('X-CampusConnect-Source', 'stale_fallback');
      response.setHeader('X-CampusConnect-Stale', 'true');

      return response.status(200).json({
        status: 'stale',
        message: 'Serving cached data due to upstream failure.',
        count: cachedResult.data.length,
        data: cachedResult.data,
        is_stale: true,
        upstream_error:
          error instanceof Error ? error.message : 'Unknown error',
        fetched_at: new Date(cachedResult.timestamp).toISOString(),
      });
    }

    return response.status(502).json({
      status: 'error',
      message:
        error instanceof Error
          ? error.message
          : 'Failed to retrieve internships.',
      data: [],
      is_stale: false,
    });
  }
}

