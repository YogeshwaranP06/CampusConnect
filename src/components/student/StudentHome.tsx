import React from 'react';
import { CampusEvent } from '../../types/event';
import { HeroSection } from './HeroSection';
import { EventCard } from './EventCard';
import { 
  Code2, 
  Presentation, 
  Wrench, 
  Trophy, 
  BookOpen, 
  Cpu, 
  Sparkles, 
  Briefcase, 
  ArrowRight,
  Building2
} from 'lucide-react';

interface StudentHomeProps {
  events: CampusEvent[];
  onSelectEvent: (event: CampusEvent) => void;
  onNavigate: (view: 'home' | 'events' | 'internships' | 'core' | 'saved', category?: string, organizerType?: string) => void;
  onSearch: (query: string) => void;
  savedIds: string[];
  onToggleSave: (eventId: string, e: React.MouseEvent) => void;
}

const CATEGORY_ITEMS = [
  { name: 'Hackathons', desc: 'Build sprints & team coding', icon: Code2, count: '36h - 48h', accent: 'bg-indigo-50 text-indigo-700' },
  { name: 'Symposiums', desc: 'Technical tracks & papers', icon: Presentation, count: 'State & National', accent: 'bg-blue-50 text-blue-700' },
  { name: 'Workshops', desc: 'VLSI, AI, Drone & Robotics', icon: Wrench, count: 'Hands-on Labs', accent: 'bg-emerald-50 text-emerald-700' },
  { name: 'Competitions', desc: 'Speed coding & CTF wars', icon: Trophy, count: 'Cash & Awards', accent: 'bg-amber-50 text-amber-700' },
  { name: 'Conferences', desc: 'Peer-reviewed research', icon: BookOpen, count: 'Publications', accent: 'bg-slate-100 text-slate-700' },
  { name: 'Career Opportunities', desc: 'Fellowships & Placements', icon: Briefcase, count: 'Stipends', accent: 'bg-purple-50 text-purple-700' },
  { name: 'Technical Events', desc: 'Webinars, expos & panels', icon: Cpu, count: 'Virtual & Live', accent: 'bg-cyan-50 text-cyan-700' },
  { name: 'Cultural Events', desc: 'Arts, music & stage fests', icon: Sparkles, count: 'Inter-College', accent: 'bg-rose-50 text-rose-700' },
];

const ORGANIZER_TYPES = [
  'Our College',
  'Other College',
  'University',
  'Company',
  'Startup',
  'Government Organization',
  'Research Institution',
  'Professional Society',
];

export const StudentHome: React.FC<StudentHomeProps> = ({
  events,
  onSelectEvent,
  onNavigate,
  onSearch,
  savedIds,
  onToggleSave,
}) => {
  const upcomingEvents = [...events]
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 6);

  return (
    <div className="bg-white space-y-16 pb-20">
      {/* Hero Section: Pure White Background (#FFFFFF) */}
      <HeroSection
        onSearch={onSearch}
        onExploreEvents={() => onNavigate('events')}
        onExploreOpportunities={() => onNavigate('internships')}
        totalEventsCount={events.length}
      />

      {/* Explore by Category: Very Light Cool Grey Background (#F7F9FC) */}
      <section className="bg-[#F7F9FC] border-y border-slate-200/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#64748b] block mb-1">
                Field Focus Areas
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-light text-[#111827] tracking-tight">
                Explore by Category
              </h2>
            </div>
            <p className="text-xs text-[#475569] max-w-md">
              Eight official tracks curated across computing, hardware, technical research, and creative arts.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {CATEGORY_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.name}
                  onClick={() => onNavigate('events', item.name)}
                  className="group p-6 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl ${item.accent} group-hover:bg-indigo-600 group-hover:text-white transition-colors`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono text-[#64748b]">
                      {item.count}
                    </span>
                  </div>
                  <div className="mt-5">
                    <h3 className="text-sm font-semibold text-[#111827] group-hover:text-indigo-600 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-[#475569] mt-1 line-clamp-1">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Upcoming Events Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-slate-200">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748b] block mb-1">
              Timeline & Deadlines
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-light text-[#111827] tracking-tight">
              Upcoming Opportunities & Events
            </h2>
          </div>
          <button
            onClick={() => onNavigate('events')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer pb-1"
          >
            <span>See full calendar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onSelect={onSelectEvent}
              isSaved={savedIds.includes(event.id)}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      </section>

      {/* Verified Host Directory */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0f172a] rounded-3xl p-8 sm:p-12 text-white overflow-hidden relative border border-slate-800">
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Verified Host Directory
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-light tracking-tight text-white">
              Institutional Hosts & Enterprise Partners
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every listing originates from accredited collegiate institutions, tier-1 tech enterprises, or recognized engineering bodies. Click any host tier to browse matching symposiums.
            </p>
          </div>

          <div className="relative z-10 mt-8 flex flex-wrap gap-3">
            {ORGANIZER_TYPES.map((orgType) => {
              const count = events.filter(
                (e) => e.organizer_type?.toLowerCase() === orgType.toLowerCase()
              ).length;
              return (
                <button
                  key={orgType}
                  type="button"
                  onClick={() => onNavigate('events', undefined, orgType)}
                  className="group px-4 py-2.5 rounded-full bg-slate-800 hover:bg-indigo-600 active:scale-95 text-xs font-medium text-slate-200 hover:text-white transition-all duration-150 border border-slate-700 hover:border-indigo-600 flex items-center gap-2.5 cursor-pointer shadow-xs"
                >
                  <Building2 className="w-3.5 h-3.5 text-indigo-400 group-hover:text-white transition-colors shrink-0" />
                  <span>{orgType}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700 group-hover:bg-white/20 text-slate-300 group-hover:text-white transition-colors">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Closing Call to Action: Clean Light-Grey Card with Purple Accent Button */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-2 max-w-xl">
            <h3 className="font-display text-2xl sm:text-3xl font-light text-[#111827]">
              Are you an Event Coordinator or Club Lead?
            </h3>
            <p className="text-sm text-[#475569] leading-relaxed">
              Submit your symposiums, competitions, or workshops to the official SRM TRP student coordinating council via Google Sheets. Verified listings appear on CampusConnect automatically.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('events')}
              className="px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-full transition-all cursor-pointer shadow-sm active:scale-98"
            >
              Browse All Events
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
