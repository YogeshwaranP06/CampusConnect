import React, { useState } from 'react';
import { CampusEvent } from '../../types/event';
import { EventCard } from './EventCard';
import { Search } from 'lucide-react';

interface OpportunitiesViewProps {
  events: CampusEvent[];
  onSelectEvent: (event: CampusEvent) => void;
  savedIds: string[];
  onToggleSave: (eventId: string, e: React.MouseEvent) => void;
}

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({
  events,
  onSelectEvent,
  savedIds,
  onToggleSave,
}) => {
  const [opportunityType, setOpportunityType] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Opportunities include Internships, Training Programs, Career Opportunities, and Fellowship/R&D programs
  const opportunityEvents = events.filter((e) => {
    const isOpp =
      e.category === 'Internships' ||
      e.category === 'Training Programs' ||
      e.category === 'Career Opportunities' ||
      e.event_type.toLowerCase().includes('fellowship') ||
      e.event_type.toLowerCase().includes('internship') ||
      e.event_type.toLowerCase().includes('training');

    if (!isOpp) return false;

    if (opportunityType !== 'all') {
      if (opportunityType === 'Internships' && e.category !== 'Internships') return false;
      if (opportunityType === 'Training Programs' && e.category !== 'Training Programs') return false;
      if (opportunityType === 'Career Opportunities' && e.category !== 'Career Opportunities') return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        e.organizer_name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.eligibility && e.eligibility.toLowerCase().includes(q))
      );
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 bg-[#f7f1e8]">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#a81c24] block">
          SRM TRP Career Development & Placements
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-light text-[#1c1b1a] tracking-tight">
          Internships, Research Fellowships & Industrial Training
        </h1>
        <p className="text-sm text-[#4a4741] leading-relaxed font-normal">
          Verified paid internships, government laboratory research grants, technical training boot camps, and recruitment challenges from top universities, enterprises, and research labs.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#e1dcd3] p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
        {/* Segmented Type Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#ece6dc] rounded-full border border-[#e1dcd3] overflow-x-auto">
          <button
            onClick={() => setOpportunityType('all')}
            className={`px-4 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-all cursor-pointer ${
              opportunityType === 'all'
                ? 'bg-white text-[#132450] font-semibold shadow-xs'
                : 'text-[#4a4741] hover:text-[#1c1b1a]'
            }`}
          >
            All Opportunities
          </button>
          <button
            onClick={() => setOpportunityType('Internships')}
            className={`px-4 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-all cursor-pointer ${
              opportunityType === 'Internships'
                ? 'bg-white text-[#132450] font-semibold shadow-xs'
                : 'text-[#4a4741] hover:text-[#1c1b1a]'
            }`}
          >
            Fellowships & Internships
          </button>
          <button
            onClick={() => setOpportunityType('Training Programs')}
            className={`px-4 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-all cursor-pointer ${
              opportunityType === 'Training Programs'
                ? 'bg-white text-[#132450] font-semibold shadow-xs'
                : 'text-[#4a4741] hover:text-[#1c1b1a]'
            }`}
          >
            Industrial Training
          </button>
          <button
            onClick={() => setOpportunityType('Career Opportunities')}
            className={`px-4 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-all cursor-pointer ${
              opportunityType === 'Career Opportunities'
                ? 'bg-white text-[#132450] font-semibold shadow-xs'
                : 'text-[#4a4741] hover:text-[#1c1b1a]'
            }`}
          >
            Corporate Programs
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#838280]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search opportunities..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#f7f1e8] border border-[#e1dcd3] rounded-full text-xs text-[#1c1b1a] placeholder-[#838280] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a4ca1]"
          />
        </div>
      </div>

      {/* Grid */}
      {opportunityEvents.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-[#e1dcd3] shadow-xs">
          <p className="font-serif text-base font-normal text-[#1c1b1a]">No opportunities match this filter.</p>
          <p className="text-xs text-[#4a4741] mt-1">Try selecting "All Opportunities" or reset your search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunityEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onSelect={onSelectEvent}
              isSaved={savedIds.includes(event.id)}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
};
