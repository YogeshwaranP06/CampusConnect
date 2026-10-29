import React, { useState, useEffect } from 'react';
import { CampusEvent, EventFilterState } from '../../types/event';
import { getPublicPublishedEvents } from '../../services/eventService';
import { EventFilters } from './EventFilters';
import { EventCard } from './EventCard';
import { 
  LayoutGrid, 
  List, 
  Inbox, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  Info
} from 'lucide-react';
import { DataSourceSetupModal } from '../common/DataSourceSetupModal';

interface ExploreEventsProps {
  initialCategory?: string;
  initialOrganizerType?: string;
  initialQuery?: string;
  isCoreOnly?: boolean;
  onSelectEvent: (event: CampusEvent) => void;
  savedIds: string[];
  onToggleSave: (eventId: string, e: React.MouseEvent) => void;
}

const DEFAULT_FILTERS: EventFilterState = {
  searchQuery: '',
  category: 'all',
  organizerType: 'all',
  level: 'all',
  mode: 'all',
  feeType: 'all',
  dateFilter: 'all',
  deadlineFilter: 'all',
  sortBy: 'upcoming',
  featuredOnly: false,
  coreOnly: false,
};

export const ExploreEvents: React.FC<ExploreEventsProps> = ({
  initialCategory,
  initialOrganizerType,
  initialQuery,
  isCoreOnly = false,
  onSelectEvent,
  savedIds,
  onToggleSave,
}) => {
  const [filters, setFilters] = useState<EventFilterState>({
    ...DEFAULT_FILTERS,
    category: initialCategory || 'all',
    organizerType: initialOrganizerType || 'all',
    searchQuery: initialQuery || '',
    coreOnly: isCoreOnly,
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isDemo, setIsDemo] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [setupModalOpen, setSetupModalOpen] = useState(false);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, coreOnly: isCoreOnly }));
    setPage(1);
  }, [isCoreOnly]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, category: initialCategory || 'all' }));
    setPage(1);
  }, [initialCategory]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, organizerType: initialOrganizerType || 'all' }));
    setPage(1);
  }, [initialOrganizerType]);

  useEffect(() => {
    if (initialQuery !== undefined) {
      setFilters((prev) => ({ ...prev, searchQuery: initialQuery }));
      setPage(1);
    }
  }, [initialQuery]);

  const loadEvents = (forceRefresh: boolean = false) => {
    setLoading(true);

    getPublicPublishedEvents(filters, page, pageSize, forceRefresh)
      .then((res) => {
        setEvents(res.events);
        setTotalCount(res.totalCount);
        setIsDemo(res.isDemo);
        setFetchError(res.error || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching events:', err);
        setFetchError(err.message || 'Error connecting to events data source');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadEvents(false);
  }, [filters, page]);

  const handleFilterChange = (updated: Partial<EventFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Network / Endpoint Warning Banner if endpoint failed */}
      {fetchError && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Endpoint notice:</strong> {fetchError}. Serving verified offline demo data catalog.
            </span>
          </div>
          <button
            type="button"
            onClick={() => loadEvents(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-amber-300 text-amber-900 font-medium hover:bg-amber-100 transition-colors text-xs shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Demo Transparency Banner (Never pretend live data is connected) */}
      {isDemo && !fetchError && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-100 border border-slate-200 rounded-2xl text-xs text-[#475569] shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase font-bold tracking-wider bg-white border border-slate-200 text-[#111827]">
              Demo Data Mode
            </span>
            <span>Google Apps Script endpoint is not yet configured. Displaying verified sample collegiate events for preview.</span>
          </div>
          <button
            type="button"
            onClick={() => setSetupModalOpen(true)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>Google Sheets Setup Guide</span>
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {/* Page Title & View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748b] block mb-1">
            {isCoreOnly ? 'Core Engineering Track' : 'Student Opportunity Directory'}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-light text-[#111827] tracking-tight">
            {isCoreOnly
              ? 'Core Engineering Events & Technical Challenges'
              : 'Explore College Events & Competitions'}
          </h1>
          {isCoreOnly && (
            <p className="text-xs text-[#475569] mt-1.5 max-w-2xl font-normal">
              Curated symposiums, hackathons, and workshops in VLSI & Semiconductor Design, Autonomous Robotics, Aerospace Systems, Embedded IoT, Mechatronics, and CleanTech.
            </p>
          )}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-full shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-[#111827] shadow-xs'
                : 'text-slate-400 hover:text-[#111827]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            aria-label="List view"
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-[#111827] shadow-xs'
                : 'text-slate-400 hover:text-[#111827]'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Comprehensive Filter Bar */}
      <EventFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        totalResults={totalCount}
      />

      {/* Results Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500">Querying published catalog...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Inbox className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No matching events found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search criteria, clearing selected filters, or browsing other categories.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear all filters</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onSelect={onSelectEvent}
              isSaved={savedIds.includes(event.id)}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {events.map((event) => {
            const startDate = new Date(event.start_date);
            const formattedDate = !isNaN(startDate.getTime())
              ? startDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : event.start_date;

            return (
              <div
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className="group p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span className="text-indigo-600 font-semibold">{event.category}</span>
                    <span>·</span>
                    <span>{event.organizer_type}</span>
                    <span>·</span>
                    <span>{event.mode}</span>
                    {event.featured && (
                      <span className="flex items-center gap-1 text-amber-600 font-semibold ml-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Featured</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {event.name}
                  </h3>
                  <div className="text-xs text-slate-600">
                    <span>{event.organizer_name}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-slate-500">{event.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0 text-xs">
                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">Event Date</span>
                    <span className="font-semibold text-slate-800">{formattedDate}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">Registration</span>
                    <span className={event.registration_fee === 0 ? 'text-emerald-600 font-semibold' : 'font-mono text-slate-800'}>
                      {event.registration_fee === 0 ? 'Free' : `$${event.registration_fee}`}
                    </span>
                  </div>
                  <button
                    onClick={(e) => onToggleSave(event.id, e)}
                    className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-slate-200">
          <span className="text-xs text-slate-500 font-mono">
            Page {page} of {totalPages} ({totalCount} total)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2">{page}</span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Setup Guide Modal */}
      <DataSourceSetupModal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
      />
    </div>
  );
};
