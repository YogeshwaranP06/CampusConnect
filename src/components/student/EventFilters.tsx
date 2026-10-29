import React from 'react';
import { EventFilterState } from '../../types/event';
import { VALID_CATEGORIES, VALID_ORGANIZER_TYPES, VALID_EVENT_LEVELS } from '../../utils/validation';
import { Search, RotateCcw, Sparkles } from 'lucide-react';

interface EventFiltersProps {
  filters: EventFilterState;
  onChange: (updated: Partial<EventFilterState>) => void;
  onReset: () => void;
  totalResults: number;
}

export const EventFilters: React.FC<EventFiltersProps> = ({
  filters,
  onChange,
  onReset,
  totalResults,
}) => {
  const isFiltered =
    filters.searchQuery !== '' ||
    filters.category !== 'all' ||
    filters.organizerType !== 'all' ||
    (filters.level && filters.level !== 'all') ||
    filters.mode !== 'all' ||
    filters.feeType !== 'all' ||
    filters.dateFilter !== 'all' ||
    filters.deadlineFilter !== 'all' ||
    filters.featuredOnly ||
    filters.sortBy !== 'upcoming';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-xs">
      {/* Top Search & Reset Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onChange({ searchQuery: e.target.value })}
            placeholder="Filter by keyword, topic, or department..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm text-[#111827] placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
          />
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
          <span className="text-xs font-semibold text-[#475569]">
            {totalResults} {totalResults === 1 ? 'event' : 'events'} found
          </span>

          {isFiltered && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-[#475569] hover:text-[#111827] hover:bg-slate-100 rounded-full transition-colors cursor-pointer border border-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 pt-2 border-t border-slate-100 text-xs">
        {/* Category */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => onChange({ category: e.target.value })}
            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[#111827] focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
          >
            <option value="all">All Categories</option>
            {VALID_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Event Level */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
            Event Level
          </label>
          <select
            value={filters.level || 'all'}
            onChange={(e) => onChange({ level: e.target.value })}
            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[#111827] focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 font-medium"
          >
            <option value="all">All Levels</option>
            {VALID_EVENT_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>

        {/* Organizer Type */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
            Organizer
          </label>
          <select
            value={filters.organizerType}
            onChange={(e) => onChange({ organizerType: e.target.value })}
            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[#111827] focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
          >
            <option value="all">All Organizers</option>
            {VALID_ORGANIZER_TYPES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        {/* Mode */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
            Mode
          </label>
          <select
            value={filters.mode}
            onChange={(e) => onChange({ mode: e.target.value })}
            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[#111827] focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
          >
            <option value="all">Any Mode</option>
            <option value="Online">Online / Remote</option>
            <option value="Offline">In-Person / On-Campus</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>

        {/* Fee */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
            Registration
          </label>
          <select
            value={filters.feeType}
            onChange={(e) => onChange({ feeType: e.target.value as any })}
            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[#111827] focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
          >
            <option value="all">Free & Paid</option>
            <option value="free">Free Events Only</option>
            <option value="paid">Paid Events</option>
          </select>
        </div>

        {/* Deadline */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
            Deadline
          </label>
          <select
            value={filters.deadlineFilter}
            onChange={(e) => onChange({ deadlineFilter: e.target.value as any })}
            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[#111827] focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
          >
            <option value="all">All Deadlines</option>
            <option value="open">Open for Registration</option>
            <option value="closing_soon">Closing in 72h</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
            Sort Order
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onChange({ sortBy: e.target.value as any })}
            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[#111827] focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
          >
            <option value="upcoming">Upcoming First</option>
            <option value="deadline">Deadline Closing Soon</option>
            <option value="recently_added">Recently Added</option>
            <option value="name_asc">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Quick toggle chips & Level shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#475569] pt-2">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.featuredOnly}
            onChange={(e) => onChange({ featuredOnly: e.target.checked })}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
          />
          <span className="flex items-center gap-1.5 font-medium text-[#111827]">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Featured events only</span>
          </span>
        </label>

        {/* Quick Level Filter Shortcuts as Pills */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium text-[11px] mr-1">Level:</span>
          {(['National', 'International', 'State Level', 'College Level'] as const).map((lvl) => {
            const active = filters.level === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => onChange({ level: active ? 'all' : lvl })}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-[#475569]'
                }`}
              >
                {lvl}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
