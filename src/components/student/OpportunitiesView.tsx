import React, { useState } from 'react';
import { CampusEvent } from '../../types/event';
import { EventCard } from './EventCard';
import { SRM_TRP_DEPARTMENTS } from '../../utils/validation';
import { Search, GraduationCap } from 'lucide-react';

interface OpportunitiesViewProps {
  events: CampusEvent[];
  onSelectEvent: (event: CampusEvent) => void;
  savedIds: string[];
  onToggleSave: (eventId: string, e: React.MouseEvent) => void;
}

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({
  events = [],
  onSelectEvent,
  savedIds = [],
  onToggleSave,
}) => {
  const [opportunityType, setOpportunityType] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Opportunities include Internships, Training Programs, Career Opportunities, and Fellowship/R&D programs
  const opportunityEvents = events.filter((e) => {
    if (!e) return false;

    const cat = (e.category || '').toLowerCase();
    const eventType = (e.event_type || '').toLowerCase();
    const name = (e.name || '').toLowerCase();
    const tags = Array.isArray(e.tags) ? e.tags.map((t) => (t || '').toLowerCase()) : [];

    const isOpp =
      cat === 'internships' ||
      cat === 'training programs' ||
      cat === 'career opportunities' ||
      eventType.includes('fellowship') ||
      eventType.includes('internship') ||
      eventType.includes('training') ||
      name.includes('internship') ||
      name.includes('recruitment') ||
      name.includes('hiring') ||
      tags.some((t) => t.includes('internship') || t.includes('hiring') || t.includes('ppo') || t.includes('fte'));

    if (!isOpp) return false;

    if (opportunityType !== 'all') {
      if (opportunityType === 'Internships') {
        const isInternship =
          cat === 'internships' ||
          name.includes('internship') ||
          eventType.includes('internship') ||
          tags.some((t) => t.includes('internship'));
        if (!isInternship) return false;
      } else if (opportunityType === 'Career Opportunities') {
        const isCareer =
          cat === 'career opportunities' ||
          name.includes('recruitment') ||
          name.includes('hiring') ||
          tags.some((t) => t.includes('recruitment') || t.includes('hiring'));
        if (!isCareer) return false;
      }
    }

    // Department filter
    if (departmentFilter !== 'all') {
      const targetDept = departmentFilter.toLowerCase();
      const eligDepts = (e.eligible_departments || '').toLowerCase();
      const dept = (e.department || '').toLowerCase();
      const elig = (e.eligibility || '').toLowerCase();
      const desc = (e.description || '').toLowerCase();
      const fullText = `${eligDepts} ${dept} ${elig} ${desc} ${name} ${tags.join(' ')}`;

      if (!eligDepts.includes('all') && !elig.includes('all students') && !elig.includes('all engineering')) {
        let match = false;
        if (targetDept.includes('civil') && fullText.includes('civil')) match = true;
        else if ((targetDept.includes('computer science') || targetDept.includes('cse')) && (fullText.includes('computer') || fullText.includes('cs') || fullText.includes('cse') || fullText.includes('software'))) match = true;
        else if ((targetDept.includes('electronics and communication') || targetDept.includes('ece')) && (fullText.includes('ece') || fullText.includes('electronics') || fullText.includes('communication'))) match = true;
        else if ((targetDept.includes('electrical and electronics') || targetDept.includes('eee')) && (fullText.includes('eee') || fullText.includes('electrical'))) match = true;
        else if (targetDept.includes('mechanical') && fullText.includes('mech')) match = true;
        else if ((targetDept.includes('artificial intelligence and data science') || targetDept.includes('ai&ds')) && (fullText.includes('ai') || fullText.includes('data science') || fullText.includes('artificial intelligence'))) match = true;
        else if ((targetDept.includes('artificial intelligence and machine learning') || targetDept.includes('aiml')) && (fullText.includes('ai') || fullText.includes('machine learning') || fullText.includes('aiml'))) match = true;
        else if ((targetDept.includes('information technology') || targetDept.includes('(it)')) && (fullText.includes('information technology') || fullText.includes(' it ') || fullText.includes('/it') || fullText.includes('software'))) match = true;
        else if (fullText.includes(targetDept)) match = true;

        if (!match) return false;
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const org = (e.organizer_name || '').toLowerCase();
      const desc = (e.description || '').toLowerCase();
      const elig = (e.eligibility || '').toLowerCase();

      return (
        name.includes(q) ||
        org.includes(q) ||
        desc.includes(q) ||
        elig.includes(q) ||
        tags.some((t) => t.includes(q))
      );
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 bg-transparent">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 block">
          SRM TRP Career Development &amp; Placements
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-light text-[#111827] tracking-tight">
          Internships, Research Fellowships &amp; Industrial Training
        </h1>
        <p className="text-sm text-[#475569] leading-relaxed font-normal">
          Verified paid internships, corporate recruitment drives, technical training programs, and innovation challenges from partner enterprises.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs">
        {/* Left: Type Switcher & Department Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented Type Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-full border border-slate-200 overflow-x-auto">
            <button
              type="button"
              onClick={() => setOpportunityType('all')}
              className={`px-4 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-all cursor-pointer ${
                opportunityType === 'all'
                  ? 'bg-white text-indigo-600 font-semibold shadow-xs'
                  : 'text-[#475569] hover:text-[#111827]'
              }`}
            >
              All Opportunities
            </button>
            <button
              type="button"
              onClick={() => setOpportunityType('Internships')}
              className={`px-4 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-all cursor-pointer ${
                opportunityType === 'Internships'
                  ? 'bg-white text-indigo-600 font-semibold shadow-xs'
                  : 'text-[#475569] hover:text-[#111827]'
              }`}
            >
              Paid Internships
            </button>
            <button
              type="button"
              onClick={() => setOpportunityType('Career Opportunities')}
              className={`px-4 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-all cursor-pointer ${
                opportunityType === 'Career Opportunities'
                  ? 'bg-white text-indigo-600 font-semibold shadow-xs'
                  : 'text-[#475569] hover:text-[#111827]'
              }`}
            >
              Recruitment Drives
            </button>
          </div>

          {/* Department Filter Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-[#111827]">
            <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-medium text-[#111827] focus:outline-none cursor-pointer pr-1"
            >
              <option value="all">All Departments</option>
              {SRM_TRP_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search opportunities..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs text-[#111827] placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>
      </div>

      {/* Grid */}
      {opportunityEvents.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
          <p className="font-serif text-base font-normal text-[#111827]">No opportunities match this filter.</p>
          <p className="text-xs text-[#475569] mt-1">Try selecting "All Departments" or reset your search term.</p>
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
