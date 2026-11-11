import { CampusInternship, InternshipFilterState, InternshipFetchResult } from '../types/internship';
import { isValidHttpUrl } from '../utils/driveUrl';

const SAVED_INTERNSHIPS_KEY = 'campusconnect_saved_internship_ids';
const API_ENDPOINT = '/api/internships';
const CLIENT_CACHE_TTL_MS = 60_000; // 60 seconds memory cache

// In-memory cache for fast navigation without repeated network requests
let cachedInternships: CampusInternship[] | null = null;
let lastFetchTimestamp = 0;
let lastFetchSource: 'api_proxy' | 'apps_script' | 'empty' = 'api_proxy';
let lastFetchError: string | null = null;
let isLastFetchStale = false;

// In-flight promise deduplication: concurrent calls share a single request
let inFlightFetchPromise: Promise<{ internships: CampusInternship[]; isStale: boolean }> | null = null;

/**
 * Safe date parser: checks whether string/number/Date can be resolved to a valid Date
 */
export function parseDateSafe(val: unknown): Date | null {
  if (!val) return null;
  const d = new Date(val as string | number | Date);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Validates start_date, application_deadline, and end_date.
 */
export function validateInternshipDates(
  startDateRaw?: unknown,
  deadlineRaw?: unknown,
  endDateRaw?: unknown
): {
  startDate?: string;
  applicationDeadline?: string;
  endDate?: string;
} {
  const parsedStart = parseDateSafe(startDateRaw);
  const startDate = parsedStart ? parsedStart.toISOString() : undefined;

  const parsedDeadline = parseDateSafe(deadlineRaw);
  const applicationDeadline = parsedDeadline ? parsedDeadline.toISOString() : undefined;

  const parsedEnd = parseDateSafe(endDateRaw);
  const endDate = parsedEnd ? parsedEnd.toISOString() : undefined;

  return {
    startDate,
    applicationDeadline,
    endDate,
  };
}

/**
 * Deduplicate internship list by normalized internship_id.
 * Prefers the most recently updated record when duplicates occur.
 */
export function deduplicateInternships(items: CampusInternship[]): CampusInternship[] {
  const byId = new Map<string, CampusInternship>();

  for (const item of items) {
    const key = (item.internship_id || item.id).trim().toLowerCase();
    const existing = byId.get(key);

    if (!existing) {
      byId.set(key, item);
    } else {
      console.warn(
        `[CampusConnect] Duplicate Internship ID "${item.internship_id}" detected for "${item.name}". Merging with newest row.`
      );
      const existingTime = new Date(existing.last_updated || existing.updated_at || 0).getTime();
      const newTime = new Date(item.last_updated || item.updated_at || 0).getTime();

      if (newTime >= existingTime) {
        byId.set(key, item);
      }
    }
  }

  return Array.from(byId.values());
}

/**
 * Normalizes raw spreadsheet / API objects into guaranteed CampusInternship shapes
 */
export function normalizeInternshipRecord(raw: any, index: number): CampusInternship {
  const internshipId = (
    raw.internship_id ||
    raw['internship_id'] ||
    raw['Internship ID'] ||
    `INT-${new Date().getFullYear()}-${String(index + 1).padStart(4, '0')}`
  ).toString().trim();

  const id = raw.id || `live-int-${internshipId.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`;
  const name = (raw.name || raw['name'] || raw['Internship Title'] || raw['Title'] || 'Untitled Internship').toString().trim();

  const dates = validateInternshipDates(
    raw.start_date || raw['start_date'] || raw['Start Date'],
    raw.application_deadline || raw['application_deadline'] || raw['Application Deadline'] || raw['Deadline'],
    raw.end_date || raw['end_date'] || raw['End Date']
  );

  const rawAppUrl = (
    raw.application_url ||
    raw['application_url'] ||
    raw['Application URL'] ||
    raw.registration_url ||
    raw['Registration URL'] ||
    ''
  ).toString().trim();

  const rawOfficialUrl = (
    raw.official_url ||
    raw['official_url'] ||
    raw['Official Event URL'] ||
    raw['Website'] ||
    ''
  ).toString().trim();

  const hasValidAppUrl = isValidHttpUrl(rawAppUrl);
  const applicationUrl = hasValidAppUrl ? rawAppUrl : '';
  const officialUrl = isValidHttpUrl(rawOfficialUrl) ? rawOfficialUrl : undefined;

  // Safe fee normalization
  const regFee = typeof raw.registration_fee === 'number'
    ? raw.registration_fee
    : parseFloat(raw.registration_fee || raw.fee_amount || '0') || 0;

  // Safe stipend normalization
  const stipendAmount = raw.stipend_amount ?? raw['stipend_amount'] ?? raw['Stipend Amount'] ?? '';
  const stipendDetails = (
    raw.stipend_details ||
    raw['stipend_details'] ||
    raw['Stipend Details'] ||
    raw.prizes_summary ||
    ''
  ).toString().trim();

  return {
    id,
    internship_id: internshipId,
    event_slug: raw.event_slug || raw['event_slug'] || undefined,
    name,
    organizer_name: (
      raw.organizer_name ||
      raw['organizer_name'] ||
      raw['Organizer Name'] ||
      raw.company ||
      'Partner Organization'
    ).toString().trim(),
    organizer_type: (
      raw.organizer_type ||
      raw['organizer_type'] ||
      raw['Organizer Type'] ||
      'Company'
    ).toString().trim(),
    category: (
      raw.category ||
      raw['category'] ||
      raw['Category'] ||
      'Internships'
    ).toString().trim(),
    level: (raw.level || raw['level'] || raw['Level'] || 'National').toString().trim(),
    internship_type: (
      raw.internship_type ||
      raw['internship_type'] ||
      raw['Internship Type'] ||
      raw.event_type ||
      'Internship'
    ).toString().trim(),
    description: (raw.description || raw['description'] || raw['Description'] || '').toString().trim(),
    start_date: dates.startDate,
    end_date: dates.endDate,
    application_deadline: dates.applicationDeadline,
    mode: (raw.mode || raw['mode'] || raw['Mode'] || 'Offline').toString().trim(),
    location: (raw.location || raw['location'] || raw['Location'] || 'Campus / Office').toString().trim(),
    registration_fee: regFee,
    fee_amount: regFee,
    fee_type: raw.fee_type || raw['fee_type'] || (regFee > 0 ? 'Paid' : 'Free'),
    department: raw.department || raw['department'] || raw['Department'] || undefined,
    tags: Array.isArray(raw.tags)
      ? raw.tags.map((t: unknown) => String(t))
      : typeof raw.tags === 'string'
        ? raw.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : typeof raw['Tags'] === 'string'
          ? raw['Tags'].split(',').map((t: string) => t.trim()).filter(Boolean)
          : [],
    eligibility: (
      raw.eligibility ||
      raw['eligibility'] ||
      raw['Eligibility'] ||
      'Pre-final and final year engineering students'
    ).toString().trim(),
    eligible_departments: (
      raw.eligible_departments ||
      raw['eligible_departments'] ||
      raw['Eligible Departments'] ||
      'All Departments'
    ).toString().trim(),
    participation_type: (
      raw.participation_type ||
      raw['participation_type'] ||
      'Individual'
    ).toString().trim(),
    min_team_size: raw.min_team_size ? Number(raw.min_team_size) : undefined,
    max_team_size: raw.max_team_size ? Number(raw.max_team_size) : undefined,
    max_participants: raw.max_participants ? Number(raw.max_participants) : undefined,
    stipend_amount: stipendAmount,
    stipend_details: stipendDetails || undefined,
    official_url: officialUrl,
    application_url: applicationUrl,
    has_valid_application_url: hasValidAppUrl,
    banner_url: raw.banner_url || raw['banner_url'] || raw['Banner URL'] || undefined,
    drive_file_ref: raw.drive_file_ref || raw['drive_file_ref'] || raw['Google Drive File Reference'] || undefined,
    contact_email: raw.contact_email || raw['contact_email'] || raw['Contact Email'] || undefined,
    contact_phone: raw.contact_phone || raw['contact_phone'] || raw['Contact Phone'] || undefined,
    status: 'Published',
    featured: Boolean(
      raw.featured === true ||
      raw['featured'] === true ||
      raw['Featured'] === true ||
      String(raw.featured).toLowerCase() === 'true'
    ),
    last_updated: raw.last_updated || raw['last_updated'] || new Date().toISOString(),
    source_row_id: raw.source_row_id || raw['source_row_id'],
    created_at: raw.created_at || raw['created_at'] || new Date().toISOString(),
    updated_at: raw.updated_at || raw['updated_at'] || new Date().toISOString(),
  };
}

/**
 * Fetches internships from /api/internships proxy
 */
async function fetchFromApiProxy(): Promise<{ internships: CampusInternship[]; isStale: boolean }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
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
        // fallback
      }
      throw new Error(errMessage);
    }

    const json = await response.json();
    let rawList: any[] = [];
    if (Array.isArray(json)) {
      rawList = json;
    } else if (json && Array.isArray(json.data)) {
      rawList = json.data;
    } else if (json && Array.isArray(json.internships)) {
      rawList = json.internships;
    } else {
      throw new Error('Unexpected payload shape received from internships endpoint.');
    }

    const isStale = Boolean(json.is_stale || response.headers.get('X-CampusConnect-Stale') === 'true');

    // Filter strictly for status === Published
    const publishedRows = rawList
      .filter((item) => {
        if (!item || typeof item !== 'object') return false;
        const status = (item.status || item['Status'] || '').toString().trim().toLowerCase();
        return status === 'published';
      })
      .map((item, index) => normalizeInternshipRecord(item, index));

    const deduplicated = deduplicateInternships(publishedRows);

    return {
      internships: deduplicated,
      isStale,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request to internships endpoint timed out.');
    }
    throw err;
  }
}

/**
 * Filter and sort internships list
 */
export function applyInternshipFilters(
  rawList: CampusInternship[],
  filters?: Partial<InternshipFilterState>
): CampusInternship[] {
  let items = rawList.filter((item) => (item.status || '').trim().toLowerCase() === 'published');
  items = deduplicateInternships(items);

  // 1. Text Search
  if (filters?.searchQuery && filters.searchQuery.trim() !== '') {
    const q = filters.searchQuery.toLowerCase().trim();
    items = items.filter((item) => {
      const tagsStr = Array.isArray(item.tags) ? item.tags.join(' ') : String(item.tags || '');
      return (
        item.name.toLowerCase().includes(q) ||
        item.organizer_name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        tagsStr.toLowerCase().includes(q) ||
        item.eligibility.toLowerCase().includes(q) ||
        item.eligible_departments.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      );
    });
  }

  // 2. Category Filter (e.g. Internships, Research Fellowships, Industrial Training)
  if (filters?.category && filters.category !== 'all') {
    const targetCat = filters.category.toLowerCase();
    items = items.filter((item) => {
      const cat = (item.category || '').toLowerCase();
      const type = (item.internship_type || '').toLowerCase();
      return cat === targetCat || type === targetCat || cat.includes(targetCat) || type.includes(targetCat);
    });
  }

  // 3. Department Filter
  if (filters?.department && filters.department !== 'all') {
    const normalize = (value: string) =>
      value
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

    const targetDept = normalize(filters.department);

    items = items.filter((item) => {
      const eligibleDepartments = normalize(item.eligible_departments || '');
      const eligibility = normalize(item.eligibility || '');
      const dept = normalize(item.department || '');

      const allowsAll =
        /\ball departments\b|\ball branches\b|\ball engineering branches\b|\ball engineering students\b|\ball students\b/.test(
          `${eligibleDepartments} ${eligibility}`
        );

      if (allowsAll) return true;

      const source = `${eligibleDepartments} ${eligibility} ${dept}`.trim();
      if (!source) return false;

      const aliases: Record<string, string[]> = {
        'b e civil engineering': ['civil', 'civil engineering'],
        'b e computer science and engineering': ['cse', 'computer science', 'computer science and engineering'],
        'b e electronics and communications engineering': ['ece', 'electronics and communication'],
        'b e electrical and electronics engineering': ['eee', 'electrical and electronics'],
        'b e mechanical engineering': ['mechanical', 'mechanical engineering'],
        'b e cse artificial intelligence and machine learning': ['aiml', 'artificial intelligence and machine learning'],
        'b tech artificial intelligence and data science': ['ai and ds', 'artificial intelligence and data science'],
        'b tech information technology': ['information technology', 'it'],
        'm e vlsi design': ['vlsi', 'vlsi design', 'm e vlsi', 'me vlsi', 'm e vlsi design'],
        'm e thermal engineering': [
          'thermal',
          'thermal engineering',
          'm e thermal',
          'me thermal',
          'm e thermal engineering',
        ],
        mba: ['mba', 'master of business administration', 'business administration', 'management'],
      };

      const terms = aliases[targetDept] || [targetDept];
      return terms.some((term) => {
        const normTerm = normalize(term);
        return source.includes(normTerm);
      });
    });
  }

  // 4. Mode Filter (Online, Offline, Hybrid)
  if (filters?.mode && filters.mode !== 'all') {
    items = items.filter((item) => item.mode.toLowerCase() === filters.mode!.toLowerCase());
  }

  // 5. Stipend Type Filter (paid vs unpaid)
  if (filters?.stipendType === 'paid') {
    items = items.filter((item) => {
      const amount = String(item.stipend_amount || '').replace(/[^0-9]/g, '');
      const num = parseInt(amount, 10);
      const details = (item.stipend_details || '').toLowerCase();
      return (num > 0) || details.includes('paid') || details.includes('stipend') || details.includes('lpa');
    });
  } else if (filters?.stipendType === 'unpaid') {
    items = items.filter((item) => {
      const amount = String(item.stipend_amount || '').replace(/[^0-9]/g, '');
      const num = parseInt(amount, 10);
      const details = (item.stipend_details || '').toLowerCase();
      return (!num || num === 0) && (details.includes('unpaid') || details.includes('academic credit') || !item.stipend_amount);
    });
  }

  // 6. Sorting
  if (filters?.sortBy === 'deadline') {
    items.sort((a, b) => {
      const da = a.application_deadline ? new Date(a.application_deadline).getTime() : Infinity;
      const db = b.application_deadline ? new Date(b.application_deadline).getTime() : Infinity;
      return da - db;
    });
  } else if (filters?.sortBy === 'recently_added') {
    items.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  } else if (filters?.sortBy === 'name_asc') {
    items.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    // Default: Featured first, then upcoming deadline
    items.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      const da = a.application_deadline ? new Date(a.application_deadline).getTime() : Infinity;
      const db = b.application_deadline ? new Date(b.application_deadline).getTime() : Infinity;
      return da - db;
    });
  }

  return items;
}

/**
 * Fetch public published internships with in-flight deduplication and 60s memory caching.
 */
export async function getPublicPublishedInternships(
  filters?: Partial<InternshipFilterState>,
  page: number = 1,
  pageSize: number = 12,
  forceRefresh: boolean = false
): Promise<InternshipFetchResult> {
  const now = Date.now();
  const isCacheExpired = !cachedInternships || (now - lastFetchTimestamp > CLIENT_CACHE_TTL_MS);

  if (isCacheExpired || forceRefresh) {
    if (!inFlightFetchPromise) {
      inFlightFetchPromise = fetchFromApiProxy()
        .then((result) => {
          cachedInternships = result.internships;
          lastFetchTimestamp = Date.now();
          lastFetchSource = 'api_proxy';
          lastFetchError = null;
          isLastFetchStale = result.isStale;
          inFlightFetchPromise = null;
          return result;
        })
        .catch((err: unknown) => {
          inFlightFetchPromise = null;
          console.error('[CampusConnect] Proxy internships fetch failed:', err);
          lastFetchError = err instanceof Error ? err.message : 'Unable to connect to internships data source.';

          if (!cachedInternships) {
            cachedInternships = [];
          }
          lastFetchSource = 'api_proxy';
          return { internships: cachedInternships, isStale: false };
        });
    }

    await inFlightFetchPromise;
  }

  const rawList = cachedInternships || [];
  const filtered = applyInternshipFilters(rawList, filters);
  const totalCount = filtered.length;
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  return {
    internships: paginated,
    totalCount,
    dataSource: lastFetchSource,
    isDemo: false,
    isStale: isLastFetchStale,
    error: lastFetchError,
  };
}

/* -------------------------------------------------------------------------- */
/* Dedicated Internship Bookmarking (localStorage)                            */
/* -------------------------------------------------------------------------- */

export function getSavedInternshipIds(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_INTERNSHIPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleSavedInternshipId(id: string): string[] {
  try {
    const current = getSavedInternshipIds();
    const exists = current.includes(id);
    const updated = exists ? current.filter((item) => item !== id) : [...current, id];
    localStorage.setItem(SAVED_INTERNSHIPS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function isInternshipSaved(id: string): boolean {
  return getSavedInternshipIds().includes(id);
}

