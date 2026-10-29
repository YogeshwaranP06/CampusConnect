import type { IncomingMessage, ServerResponse } from 'http';

interface UpstreamResult {
  data: any[];
  timestamp: number;
}

// In-memory module cache for the serverless instance
let cachedResult: UpstreamResult | null = null;
let inFlightPromise: Promise<UpstreamResult> | null = null;

const UPSTREAM_TIMEOUT_MS = 10_000;
const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024; // 5 MB safety cap

/**
 * Validates and normalizes upstream payload from Google Apps Script.
 * Expects an array or an object containing a data / events array.
 */
function validateUpstreamPayload(json: unknown): any[] {
  let list: unknown[] | null = null;

  if (Array.isArray(json)) {
    list = json;
  } else if (json && typeof json === 'object') {
    const obj = json as Record<string, unknown>;
    if (obj.status === 'error') {
      throw new Error(`Upstream reported error: ${String(obj.message || 'Unknown error')}`);
    }
    if (Array.isArray(obj.data)) {
      list = obj.data;
    } else if (Array.isArray(obj.events)) {
      list = obj.events;
    }
  }

  if (!list) {
    throw new Error('Upstream payload does not contain an array of events.');
  }

  // Ensure entries are valid objects
  const validObjects = list.filter((item): item is Record<string, unknown> => {
    return Boolean(item && typeof item === 'object');
  });

  return validObjects;
}

/**
 * Performs upstream fetch with timeout, size safety, and request coalescing.
 */
async function fetchFromAppsScript(endpointUrl: string): Promise<UpstreamResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const response = await fetch(endpointUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CampusConnect-ServerProxy/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`Upstream returned HTTP ${response.status}: ${response.statusText}`);
    }

    // Safety check content-length if available
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
      throw new Error(`Upstream response exceeded 5MB safety limit (${contentLength} bytes).`);
    }

    const text = await response.text();
    if (text.length > MAX_PAYLOAD_BYTES) {
      throw new Error('Upstream response body exceeded 5MB size limit.');
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(text);
    } catch {
      // Check if upstream returned an HTML redirect (e.g. Google login page)
      if (text.includes('<html') || text.includes('accounts.google.com')) {
        throw new Error('Google Apps Script returned an authentication redirect. Ensure "Who has access" is set to "Anyone" in deployment settings.');
      }
      throw new Error('Upstream returned non-JSON response.');
    }

    const validatedList = validateUpstreamPayload(parsedJson);

    return {
      data: validatedList,
      timestamp: Date.now(),
    };
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Upstream Google Apps Script request timed out after 10 seconds.');
    }
    throw err;
  }
}

/**
 * Vercel Serverless Function Handler
 * GET /api/events
 */
export default async function handler(req: any, res: any) {
  // 1. Method verification
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      status: 'error',
      message: 'Method Not Allowed. Use GET.',
    });
  }

  // 2. Read upstream endpoint URL (server-side only)
  const upstreamUrl = (
    process.env.APPS_SCRIPT_URL ||
    process.env.VITE_APPS_SCRIPT_URL ||
    ''
  ).trim();

  if (!upstreamUrl || !upstreamUrl.startsWith('https://script.google.com/macros/s/')) {
    return res.status(500).json({
      status: 'error',
      message: 'Server configuration error: APPS_SCRIPT_URL is missing or invalid.',
    });
  }

  // 3. Fetch data with in-flight request coalescing to prevent cache stampedes
  try {
    if (!inFlightPromise) {
      inFlightPromise = fetchFromAppsScript(upstreamUrl)
        .then((result) => {
          cachedResult = result;
          inFlightPromise = null;
          return result;
        })
        .catch((err) => {
          inFlightPromise = null;
          throw err;
        });
    }

    const result = await inFlightPromise;

    // Vercel CDN Edge Caching header
    // s-maxage=60: Shared CDN cache for 60 seconds
    // stale-while-revalidate=300: Serve stale content up to 5 min while refreshing in background
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-CampusConnect-Source', 'upstream_live');

    return res.status(200).json({
      status: 'success',
      count: result.data.length,
      data: result.data,
      is_stale: false,
      fetched_at: new Date(result.timestamp).toISOString(),
    });
  } catch (upstreamError: unknown) {
    console.error('[CampusConnect Proxy] Upstream error:', upstreamError);

    // If an in-memory stale dataset is available, serve it with explicit stale headers
    if (cachedResult && cachedResult.data.length > 0) {
      res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('X-CampusConnect-Source', 'stale_fallback');
      res.setHeader('X-CampusConnect-Stale', 'true');

      return res.status(200).json({
        status: 'stale',
        message: 'Serving cached dataset due to temporary upstream unavailability.',
        count: cachedResult.data.length,
        data: cachedResult.data,
        is_stale: true,
        upstream_error: upstreamError instanceof Error ? upstreamError.message : 'Unknown upstream error',
        fetched_at: new Date(cachedResult.timestamp).toISOString(),
      });
    }

    // No stale data available — return descriptive 502/504 error
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(502).json({
      status: 'error',
      message: upstreamError instanceof Error ? upstreamError.message : 'Failed to retrieve events from upstream.',
      data: [],
      is_stale: false,
    });
  }
}
