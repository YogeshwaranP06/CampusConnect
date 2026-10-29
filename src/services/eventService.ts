import { CampusEvent, EventFilterState } from '../types/event';
import { SAMPLE_EVENTS } from '../data/sampleEvents';

const SAVED_EVENTS_KEY = 'campusconnect_saved_ids';

/**
 * Result structure returned by event discovery queries
 */
export interface EventFetchResult {
  events: CampusEvent[];
  totalCount: number;
  dataSource: 'apps_script' | 'official_catalog';
  isDemo: boolean;
  error?: string | null;
}

export interface DataSourceStatus {
  isConfigured: boolean;
  endpointUrl: string | null;
  source: 'apps_script' | 'official_catalog';
  message: string;
}

/**
 * Modular Data Source Interface
 * Enables Google Apps Script for the current phase, while allowing
 * Firestore, Supabase, or custom REST APIs to be plugged in effortlessly.
 */
export interface EventDataSource {
  readonly id: string;
  readonly name: string;
  fetchEvents(): Promise<CampusEvent[]>;
}

// Read endpoint URL from Vite environment variables
const rawEndpointUrl = (import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined)?.trim() || '';

export const isAppsScriptConfigured = Boolean(
  rawEndpointUrl &&
  rawEndpointUrl.startsWith('https://script.google.com/macros/s/') &&
  !rawEndpointUrl.includes('YOUR_DEPLOYMENT_ID') &&
  !rawEndpointUrl.includes('placeholder')
);

export function getDataSourceStatus(): DataSourceStatus {
  if (isAppsScriptConfigured) {
    return {
      isConfigured: true,
      endpointUrl: rawEndpointUrl,
      source: 'apps_script',
      message: 'Connected to live Google Apps Script web endpoint.',
    };
  }

  return {
    isConfigured: false,
    endpointUrl: null,
    source: 'official_catalog',
    message: 'Official SRM TRP Placement & Student Opportunities Database active.',
  };
}

/**
 * Google Apps Script Web App Provider (Read-Only HTTP GET)
 */
class AppsScriptDataSource implements EventDataSource {
  readonly id = 'apps_script';
  readonly name = 'Google Apps Script Read-Only Endpoint';

  async fetchEvents(): Promise<CampusEvent[]> {
    if (!isAppsScriptConfigured) {
      throw new Error('Google Apps Script endpoint URL is not configured.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    try {
      const response = await fetch(rawEndpointUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Google Apps Script returned HTTP ${response.status}: ${response.statusText}`);
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
        throw new Error('Unexpected payload shape received from Google Apps Script endpoint.');
      }

      // Strictly validate and filter only Published events
      const published = rawList
        .filter((item) => {
          if (!item || typeof item !== 'object') return false;
          const status = (item.status || item['Status'] || '').toString().trim().toLowerCase();
          return status === 'published';
        })
        .map((item, index) => normalizeEventRecord(item, index));

      return published;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Connection to Google Apps Script timed out (12s).');
      }
      throw err;
    }
  }
}

/**
 * Institutional Opportunities Provider
 * Verified real placement and hiring drives from SRM TRP Engineering College.
 */
class OfficialCatalogDataSource implements EventDataSource {
  readonly id = 'official_catalog';
  readonly name = 'SRM TRP Verified Opportunities Catalog';

  async fetchEvents(): Promise<CampusEvent[]> {
    return SAMPLE_EVENTS.filter((e) => e.status === 'Published');
  }
}

// Instantiate providers
const appsScriptProvider = new AppsScriptDataSource();
const officialCatalogProvider = new OfficialCatalogDataSource();

// In-memory cache for fast responsive UI filtering
let cachedEvents: CampusEvent[] | null = null;
let lastFetchSource: 'apps_script' | 'official_catalog' = 'official_catalog';
let lastFetchError: string | null = null;

/**
 * Normalizes raw spreadsheet / API objects into guaranteed CampusEvent shapes
 */
function normalizeEventRecord(raw: any, index: number): CampusEvent {
  const eventId = (raw.event_id || raw['Event ID'] || `CC-${new Date().getFullYear()}-${String(index + 1).padStart(4, '0')}`).toString().trim();
  const id = raw.id || `live-${eventId.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`;

  return {
    id,
    event_id: eventId,
    name: (raw.name || raw['Event Name'] || 'Untitled Event').toString().trim(),
    organizer_name: (raw.organizer_name || raw['Organizer Name'] || 'College Organizer').toString().trim(),
    organizer_type: raw.organizer_type || raw['Organizer Type'] || 'Our College',
    category: raw.category || raw['Category'] || 'Technical Events',
    level: raw.level || raw['Level'] || 'National',
    event_type: raw.event_type || raw['Event Type'] || 'Event',
    description: (raw.description || raw['Description'] || '').toString().trim(),
    start_date: raw.start_date || raw['Start Date'] || new Date().toISOString(),
    end_date: raw.end_date || raw['End Date'] || undefined,
    registration_deadline: raw.registration_deadline || raw['Registration Deadline'] || undefined,
    mode: raw.mode || raw['Mode'] || 'Offline',
    location: (raw.location || raw['Location'] || 'Campus Venue').toString().trim(),
    registration_fee: typeof raw.registration_fee === 'number' ? raw.registration_fee : parseFloat(raw.registration_fee || '0') || 0,
    eligibility: (raw.eligibility || raw['Eligibility'] || 'All students').toString().trim(),
    eligible_departments: raw.eligible_departments || raw['Eligible Departments'] || 'All Departments',
    participation_type: raw.participation_type || raw['Participation Type'] || 'Individual',
    min_team_size: raw.min_team_size ? Number(raw.min_team_size) : undefined,
    max_team_size: raw.max_team_size ? Number(raw.max_team_size) : undefined,
    prize_pool: raw.prize_pool || raw['Prize Information'] || undefined,
    official_url: raw.official_url || raw['Official Event URL'] || undefined,
    registration_url: (raw.registration_url || raw['Registration URL'] || '#').toString().trim(),
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
 * Strictly enforces status === 'Published' and combines all filter criteria.
 */
export function applyFiltersAndSort(
  rawEvents: CampusEvent[],
  filters?: Partial<EventFilterState>
): CampusEvent[] {
  // Strictly filter for Published status only
  let items = rawEvents.filter((ev) => ev.status === 'Published');

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
 * Prioritizes the Google Apps Script endpoint when configured;
 * seamlessly falls back to verified institutional data if not configured or if network fails.
 */
export async function getPublicPublishedEvents(
  filters?: Partial<EventFilterState>,
  page: number = 1,
  pageSize: number = 12,
  forceRefresh: boolean = false
): Promise<EventFetchResult> {
  // If cache is empty or refresh requested, fetch from data source
  if (!cachedEvents || forceRefresh) {
    if (isAppsScriptConfigured) {
      try {
        const liveEvents = await appsScriptProvider.fetchEvents();
        cachedEvents = liveEvents;
        lastFetchSource = 'apps_script';
        lastFetchError = null;
      } catch (err: any) {
        console.warn('[CampusConnect] Google Apps Script endpoint error:', err.message);
        lastFetchError = err.message || 'Failed connecting to Google Apps Script endpoint';
        cachedEvents = await officialCatalogProvider.fetchEvents();
        lastFetchSource = 'official_catalog';
      }
    } else {
      cachedEvents = await officialCatalogProvider.fetchEvents();
      lastFetchSource = 'official_catalog';
      lastFetchError = null;
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
