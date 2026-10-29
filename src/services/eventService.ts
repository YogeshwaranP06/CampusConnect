import { CampusEvent, EventFilterState } from '../types/event';
import { SAMPLE_EVENTS } from '../data/sampleEvents';
import { isValidHttpUrl } from '../utils/driveUrl';

const SAVED_EVENTS_KEY = 'campusconnect_saved_ids';
const API_ENDPOINT = '/api/events';
const CLIENT_CACHE_TTL_MS = 60_000; // 60 seconds memory cache

/**
 * Result structure returned by event discovery queries
 */
export interface EventFetchResult {
  events: CampusEvent[];
  totalCount: number;
  dataSource: 'api_proxy' | 'apps_script' | 'official_catalog';
  isDemo: boolean;
  isStale?: boolean;
  error?: string | null;
}

export interface DataSourceStatus {
  isConfigured: boolean;
  endpointUrl: string | null;
  source: 'api_proxy' | 'apps_script' | 'official_catalog';
  message: string;
}

// In-memory cache for fast navigation without repeated network requests
let cachedEvents: CampusEvent[] | null = null;
let lastFetchTimestamp = 0;
let lastFetchSource: 'api_proxy' | 'official_catalog' = 'api_proxy';
let lastFetchError: string | null = null;
let isLastFetchStale = false;

// In-flight promise deduplication: concurrent calls share a single request
let inFlightFetchPromise: Promise<{ events: CampusEvent[]; isStale: boolean }> | null = null;

export const isAppsScriptConfigured = true;

export function getDataSourceStatus(): DataSourceStatus {
  return {
    isConfigured: true,
    endpointUrl: API_ENDPOINT,
    source: 'api_proxy',
    message: 'Connected to CampusConnect serverless event API.',
  };
}

/**
 * Safe date parser: checks whether string/number/Date can be resolved to a valid Date
 */
export function parseDateSafe(val: unknown): Date | null {
  if (!val) return null;
  const d = new Date(val as string | number | Date);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Validates start_date, registration_deadline, and end_date.
 * Logs warnings for suspicious sequences (e.g., deadline after start date) without deleting legitimate events.
 */
export function validateEventDates(
  startDateRaw: unknown,
  deadlineRaw?: unknown,
  endDateRaw?: unknown
): {
  startDate: string;
  registrationDeadline?: string;
  endDate?: string;
  warnings: string[];
} {
  const warnings: string[] = [];

  const parsedStart = parseDateSafe(startDateRaw);
  const startDate = parsedStart ? parsedStart.toISOString() : new Date().toISOString();
  if (!parsedStart && startDateRaw) {
    warnings.push(`Start date "${String(startDateRaw)}" is unrecognized; defaulting to current timestamp.`);
  }

  let registrationDeadline: string | undefined = undefined;
  if (deadlineRaw) {
    const parsedDeadline = parseDateSafe(deadlineRaw);
    if (parsedDeadline) {
      registrationDeadline = parsedDeadline.toISOString();
      if (parsedStart && parsedDeadline.getTime() > parsedStart.getTime()) {
        warnings.push(`Registration deadline is scheduled after the event start date.`);
      }
    } else {
      warnings.push(`Registration deadline "${String(deadlineRaw)}" could not be parsed as a valid date.`);
    }
  }

  let endDate: string | undefined = undefined;
  if (endDateRaw) {
    const parsedEnd = parseDateSafe(endDateRaw);
    if (parsedEnd) {
      endDate = parsedEnd.toISOString();
      if (parsedStart && parsedEnd.getTime() < parsedStart.getTime()) {
        warnings.push(`End date is set earlier than the event start date.`);
      }
    } else {
      warnings.push(`End date "${String(endDateRaw)}" could not be parsed as a valid date.`);
    }
  }

  return {
    startDate,
    registrationDeadline,
    endDate,
    warnings,
  };
}

/**
 * Deduplicate event list by normalized event_id.
 * Prefers the most recently updated record when duplicates occur.
 */
export function deduplicateEvents(events: CampusEvent[]): CampusEvent[] {
  const byId = new Map<string, CampusEvent>();

  for (const event of events) {
    const key = (event.event_id || event.id).trim().toLowerCase();
    const existing = byId.get(key);

    if (!existing) {
      byId.set(key, event);
    } else {
      console.warn(
        `[CampusConnect] Duplicate Event ID "${event.event_id}" detected for "${event.name}". Merging with newest row.`
      );
      const existingTime = new Date(existing.last_updated || existing.updated_at || 0).getTime();
      const newTime = new Date(event.last_updated || event.updated_at || 0).getTime();

      if (newTime >= existingTime) {
        byId.set(key, event);
      }
    }
  }

  return Array.from(byId.values());
}

/**
 * Fetches events from the same-origin API proxy (/api/events)
 * with timeout, response validation, and stale-data detection.
 * Manages its own timeout without being aborted by an individual unmounting component.
 */
async function fetchFromApiProxy(): Promise<{ events: CampusEvent[]; isStale: boolean }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson && errorJson.message) {
          errMessage = errorJson.message;
        }
      } catch {
        // use fallback statusText
      }
      throw new Error(errMessage);
    }

    const json = await response.json();
    let rawList: any[] = [];
    if (Array.isArray(json)) {
      rawList = json;
    } else if (json && Array.isArray(json.data)) {
      rawList = json.data;
    } else if (json && Array.isArray(json.events)) {
      rawList = json.events;
    } else {
      throw new Error('Unexpected payload shape received from events endpoint.');
    }

    const isStale = Boolean(json.is_stale || response.headers.get('X-CampusConnect-Stale') === 'true');

    // Strictly validate and filter only Published events (strip draft/archived/cancelled/empty)
    const publishedRows = rawList
      .filter((item) => {
        if (!item || typeof item !== 'object') return false;
        const status = (item.status || item['Status'] || '').toString().trim().toLowerCase();
        return status === 'published';
      })
      .map((item, index) => normalizeEventRecord(item, index));

    // Enforce duplicate protection
    const deduplicated = deduplicateEvents(publishedRows);

    return {
      events: deduplicated,
      isStale,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request to events endpoint timed out.');
    }
    throw err;
  }
}

/**
 * Normalizes raw spreadsheet / API objects into guaranteed CampusEvent shapes
 */
function normalizeEventRecord(raw: any, index: number): CampusEvent {
  const eventId = (raw.event_id || raw['Event ID'] || `CC-${new Date().getFullYear()}-${String(index + 1).padStart(4, '0')}`).toString().trim();
  const id = raw.id || `live-${eventId.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`;
  const name = (raw.name || raw['Event Name'] || 'Untitled Event').toString().trim();

  // Validate start date, deadline, end date
  const dateValidation = validateEventDates(
    raw.start_date || raw['Start Date'],
    raw.registration_deadline || raw['Registration Deadline'],
    raw.end_date || raw['End Date']
  );

  if (dateValidation.warnings.length > 0) {
    console.warn(`[CampusConnect] Date notice for "${name}":`, dateValidation.warnings.join(' | '));
  }

  // Validate URLs (prevent dead # links, accept valid HTTP/HTTPS)
  const rawRegUrl = (raw.registration_url || raw['Registration URL'] || '').toString().trim();
  const rawOffUrl = (raw.official_url || raw['Official Event URL'] || '').toString().trim();
  const hasValidRegUrl = isValidHttpUrl(rawRegUrl);
  const registration_url = hasValidRegUrl ? rawRegUrl : '';
  const official_url = isValidHttpUrl(rawOffUrl) ? rawOffUrl : undefined;

  return {
    id,
    event_id: eventId,
    name,
    organizer_name: (raw.organizer_name || raw['Organizer Name'] || 'College Organizer').toString().trim(),
    organizer_type: raw.organizer_type || raw['Organizer Type'] || 'Our College',
    category: raw.category || raw['Category'] || 'Technical Events',
    level: raw.level || raw['Level'] || 'National',
    event_type: raw.event_type || raw['Event Type'] || 'Event',
    description: (raw.description || raw['Description'] || '').toString().trim(),
    start_date: dateValidation.startDate,
    end_date: dateValidation.endDate,
    registration_deadline: dateValidation.registrationDeadline,
    date_warnings: dateValidation.warnings.length > 0 ? dateValidation.warnings : undefined,
    mode: raw.mode || raw['Mode'] || 'Offline',
    location: (raw.location || raw['Location'] || 'Campus Venue').toString().trim(),
    registration_fee: typeof raw.registration_fee === 'number' ? raw.registration_fee : parseFloat(raw.registration_fee || '0') || 0,
    fee_amount:
      typeof raw.fee_amount === 'number'
        ? raw.fee_amount
        : Number(raw.fee_amount ?? raw['Fee Amount'] ?? 0),

    department: raw.department || raw['Department'] || undefined,

    tags: Array.isArray(raw.tags)
      ? raw.tags.map((tag: unknown) => String(tag))
      : typeof raw['Tags'] === 'string'
        ? raw['Tags'].split(',').map((tag: string) => tag.trim()).filter(Boolean)
        : [],
    eligibility: (raw.eligibility || raw['Eligibility'] || 'All students').toString().trim(),
    eligible_departments: raw.eligible_departments || raw['Eligible Departments'] || 'All Departments',
    participation_type: raw.participation_type || raw['Participation Type'] || 'Individual',
    min_team_size: raw.min_team_size ? Number(raw.min_team_size) : undefined,
    max_team_size: raw.max_team_size ? Number(raw.max_team_size) : undefined,
    prize_pool: raw.prize_pool || raw['Prize Information'] || undefined,
    official_url,
    registration_url,
    has_valid_registration_url: hasValidRegUrl,
    banner_url: raw.banner_url || raw['Banner URL'] || undefined,
    drive_file_ref: raw.drive_file_ref || raw['Google Drive File Reference'] || undefined,
    contact_email: raw.contact_email || raw['Contact Email'] || undefined,
    contact_phone: raw.contact_phone || raw['Contact Phone'] || undefined,
    status: 'Published',
    featured: Boolean(raw.featured === true || raw['Featured'] === true || String(raw.featured).toLowerCase() === 'true'),
    last_updated: raw.last_updated || raw['Last Updated'] || new Date().toISOString(),
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
  };
}

/**
 * Filter and sort a list of CampusEvent records.
 * Strictly enforces status === 'Published', deduplicates, and combines all filter criteria.
 */
export function applyFiltersAndSort(
  rawEvents: CampusEvent[],
  filters?: Partial<EventFilterState>
): CampusEvent[] {
  // Strictly filter for Published status only and deduplicate
  const publishedOnly = rawEvents.filter(
    (ev) => (ev.status || '').trim().toLowerCase() === 'Published'.toLowerCase()
  );
  let items = deduplicateEvents(publishedOnly);

  // 1. Text Search across name, organizer, description, category, location, eligible departments, event type
  if (filters?.searchQuery && filters.searchQuery.trim() !== '') {
    const q = filters.searchQuery.toLowerCase().trim();
    items = items.filter(
      (ev) =>
        (ev.name && ev.name.toLowerCase().includes(q)) ||
        (ev.organizer_name && ev.organizer_name.toLowerCase().includes(q)) ||
        (ev.description && ev.description.toLowerCase().includes(q)) ||
        (ev.category && ev.category.toLowerCase().includes(q)) ||
        (ev.location && ev.location.toLowerCase().includes(q)) ||
        (ev.event_type && ev.event_type.toLowerCase().includes(q)) ||
        (ev.eligible_departments && ev.eligible_departments.toLowerCase().includes(q))
    );
  }

  // 2. Category Filter
  if (filters?.category && filters.category !== 'all') {
    items = items.filter((ev) => ev.category?.toLowerCase() === filters.category!.toLowerCase());
  }

  // 2b. Department Filter
  if (filters?.department && filters.department !== 'all') {
    const normalize = (value: string) =>
      value
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

    const targetDept = normalize(filters.department);

    items = items.filter((ev) => {
      const eligibleDepartments = normalize(ev.eligible_departments || '');
      const eligibility = normalize(ev.eligibility || '');

      // Only explicit, broad eligibility statements bypass department matching.
      const allowsAllDepartments =
        /\ball departments\b|\ball branches\b|\ball engineering branches\b|\ball engineering students\b|\ball students\b/.test(
          `${eligibleDepartments} ${eligibility}`
        );

      if (allowsAllDepartments) return true;

      // Prefer the explicit eligible-departments field.
      // Fall back to the eligibility statement only when that field is empty.
      const source = eligibleDepartments || eligibility;
      if (!source) return false;

      const aliases: Record<string, string[]> = {
        'b e civil engineering': ['civil', 'civil engineering'],
        'b e computer science and engineering': [
          'cse',
          'computer science',
          'computer science and engineering',
        ],
        'b e electronics and communications engineering': [
          'ece',
          'electronics and communication',
          'electronics and communications',
        ],
        'b e electrical and electronics engineering': [
          'eee',
          'electrical and electronics',
        ],
        'b e mechanical engineering': ['mechanical', 'mechanical engineering'],
        'b e cse artificial intelligence and machine learning': [
          'aiml',
          'artificial intelligence and machine learning',
        ],
        'b tech artificial intelligence and data science': [
          'ai and ds',
          'artificial intelligence and data science',
        ],
        'b tech information technology': ['information technology', 'it'],
        'computer science and business systems': [
          'csbs',
          'business systems',
          'computer science and business systems',
        ],
        'computer science and business systems csbs': [
          'csbs',
          'business systems',
          'computer science and business systems',
        ],
      };

      const terms = aliases[targetDept] || [targetDept];

      return terms.some((term) => {
        const normalizedTerm = normalize(term);
        return (
          source === normalizedTerm ||
          source.includes(` ${normalizedTerm} `) ||
          source.startsWith(`${normalizedTerm} `) ||
          source.endsWith(` ${normalizedTerm}`)
        );
      });
    });
  }

  // 3. Organizer Type Filter
  if (filters?.organizerType && filters.organizerType !== 'all') {
    items = items.filter(
      (ev) => ev.organizer_type?.toLowerCase() === filters.organizerType!.toLowerCase()
    );
  }

  // 4. Level Filter (National, International, State Level, College Level, Inter-Collegiate)
  if (filters?.level && filters.level !== 'all') {
    items = items.filter((ev) => ev.level?.toLowerCase() === filters.level!.toLowerCase());
  }

  // 5. Mode Filter (Online, Offline, Hybrid)
  if (filters?.mode && filters.mode !== 'all') {
    items = items.filter((ev) => ev.mode?.toLowerCase() === filters.mode!.toLowerCase());
  }

  // 6. Featured Only
  if (filters?.featuredOnly) {
    items = items.filter((ev) => ev.featured === true);
  }

  // 7. Fee Type Filter (Free vs Paid)
  if (filters?.feeType === 'free') {
    items = items.filter((ev) => Number(ev.registration_fee || 0) === 0);
  } else if (filters?.feeType === 'paid') {
    items = items.filter((ev) => Number(ev.registration_fee || 0) > 0);
  }

  // 8. Core Engineering Events filter
  if (filters?.coreOnly) {
    const coreKeywords = [
      'robot', 'vlsi', 'risc-v', 'embedded', 'mechatronic', 'semiconductor', 
      'scada', 'aero', 'space', 'satellit', 'drone', 'propulsion', 'cleantech', 
      'hydrogen', 'hardware', 'circuit', 'ece', 'eee', 'mech'
    ];
    items = items.filter((ev) => {
      const textToSearch = `${ev.name} ${ev.description} ${ev.eligible_departments || ''} ${ev.category} ${ev.event_type || ''}`.toLowerCase();
      return coreKeywords.some((kw) => textToSearch.includes(kw));
    });
  }

  // 9. Date Filter (Upcoming, This Week, This Month, Past)
  const now = new Date();
  if (filters?.dateFilter === 'upcoming') {
    items = items.filter((ev) => new Date(ev.start_date) >= now);
  } else if (filters?.dateFilter === 'this_week') {
    const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    items = items.filter((ev) => {
      const d = new Date(ev.start_date);
      return d >= now && d <= inSevenDays;
    });
  } else if (filters?.dateFilter === 'this_month') {
    const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    items = items.filter((ev) => {
      const d = new Date(ev.start_date);
      return d >= now && d <= inThirtyDays;
    });
  } else if (filters?.dateFilter === 'past') {
    items = items.filter((ev) => new Date(ev.start_date) < now);
  }

  // 10. Registration Deadline Filter
  if (filters?.deadlineFilter === 'open') {
    items = items.filter((ev) => !ev.registration_deadline || new Date(ev.registration_deadline) >= now);
  } else if (filters?.deadlineFilter === 'closing_soon') {
    const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    items = items.filter((ev) => {
      if (!ev.registration_deadline) return false;
      const d = new Date(ev.registration_deadline);
      return d >= now && d <= inThreeDays;
    });
  }

  // 11. Sorting
  if (filters?.sortBy === 'deadline') {
    items.sort((a, b) => {
      const da = a.registration_deadline ? new Date(a.registration_deadline).getTime() : Infinity;
      const db = b.registration_deadline ? new Date(b.registration_deadline).getTime() : Infinity;
      return da - db;
    });
  } else if (filters?.sortBy === 'recently_added') {
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (filters?.sortBy === 'name_asc') {
    items.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    // Default: upcoming first
    items.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  }

  return items;
}

/**
 * Fetch public published events for Student Discovery.
 * Routes through the same-origin proxy (/api/events) with in-flight deduplication,
 * navigation memory caching, and reliable error reporting.
 */
export async function getPublicPublishedEvents(
  filters?: Partial<EventFilterState>,
  page: number = 1,
  pageSize: number = 12,
  forceRefresh: boolean = false,
  signal?: AbortSignal
): Promise<EventFetchResult> {
  const now = Date.now();
  const isCacheExpired = !cachedEvents || (now - lastFetchTimestamp > CLIENT_CACHE_TTL_MS);

  // If cache is expired, empty, or a forced fresh request is triggered:
  if (isCacheExpired || forceRefresh) {
    if (!inFlightFetchPromise) {
      inFlightFetchPromise = fetchFromApiProxy()
        .then((result) => {
          cachedEvents = result.events;
          lastFetchTimestamp = Date.now();
          lastFetchSource = 'api_proxy';
          lastFetchError = null;
          isLastFetchStale = result.isStale;
          inFlightFetchPromise = null;
          return result;
        })
        .catch((err: unknown) => {
          inFlightFetchPromise = null;
          console.error('[CampusConnect] Proxy events fetch failed:', err);
          lastFetchError = err instanceof Error ? err.message : 'Unable to connect to events data source.';

          // Retain previously cached events for resilient offline/stale display if available
          if (!cachedEvents) {
            cachedEvents = [];
          }
          lastFetchSource = 'api_proxy';
          return { events: cachedEvents, isStale: false };
        });
    }

    if (signal) {
      // Allow caller to stop waiting without aborting the shared in-flight fetch for others
      await Promise.race([
        inFlightFetchPromise,
        new Promise((_, reject) => {
          if (signal.aborted) {
            reject(new Error('Operation aborted'));
          } else {
            signal.addEventListener('abort', () => reject(new Error('Operation aborted')), { once: true });
          }
        }),
      ]);
    } else {
      await inFlightFetchPromise;
    }
  }

  const rawList = cachedEvents || [];
  const filtered = applyFiltersAndSort(rawList, filters);
  const totalCount = filtered.length;
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  return {
    events: paginated,
    totalCount,
    dataSource: lastFetchSource,
    isDemo: false,
    isStale: isLastFetchStale,
    error: lastFetchError,
  };
}

/**
 * Fetch a single published event by ID
 */
export async function getPublicEventById(id: string): Promise<CampusEvent | null> {
  if (!cachedEvents) {
    await getPublicPublishedEvents();
  }

  const found = cachedEvents?.find((e) => e.id === id || e.event_id === id);
  if (found && found.status === 'Published') {
    return found;
  }
  return null;
}

/**
 * Manually bust the cache and refetch from source
 */
export function invalidateEventsCache(): void {
  cachedEvents = null;
}

/**
 * Client-side Bookmarking / Saved Events for Students (stored locally in browser)
 */
export function getSavedEventIds(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleSavedEventId(id: string): boolean {
  const current = getSavedEventIds();
  const exists = current.includes(id);
  const updated = exists ? current.filter((item) => item !== id) : [...current, id];
  try {
    localStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return !exists;
}
