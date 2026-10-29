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
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface StudentHomeProps {
  events: CampusEvent[];
  onSelectEvent: (event: CampusEvent) => void;
  onNavigate: (view: 'home' | 'events' | 'internships' | 'core' | 'saved', category?: string, organizerType?: string, department?: string) => void;
  onSearch: (query: string) => void;
  savedIds: string[];
  onToggleSave: (eventId: string, e: React.MouseEvent) => void;
}

const CATEGORY_ITEMS = [
  { name: 'Hackathons', desc: 'Build sprints & team coding', icon: Code2, accent: 'bg-indigo-50 text-indigo-700' },
  { name: 'Symposiums', desc: 'Technical tracks & papers', icon: Presentation, accent: 'bg-blue-50 text-blue-700' },
  { name: 'Workshops', desc: 'VLSI, AI, Drone & Robotics', icon: Wrench, accent: 'bg-emerald-50 text-emerald-700' },
  { name: 'Competitions', desc: 'Speed coding & CTF wars', icon: Trophy, accent: 'bg-amber-50 text-amber-700' },
  { name: 'Conferences', desc: 'Peer-reviewed research', icon: BookOpen, accent: 'bg-slate-100 text-slate-700' },
  { name: 'Career Opportunities', desc: 'Fellowships & Placements', icon: Briefcase, accent: 'bg-purple-50 text-purple-700' },
  { name: 'Technical Events', desc: 'Webinars, expos & panels', icon: Cpu, accent: 'bg-cyan-50 text-cyan-700' },
  { name: 'Cultural Events', desc: 'Arts, music & stage fests', icon: Sparkles, accent: 'bg-rose-50 text-rose-700' },
];

export const StudentHome: React.FC<StudentHomeProps> = ({
  events,
  onSelectEvent,
  onNavigate,
  onSearch,
  savedIds,
  onToggleSave,
}) => {
  const publishedEvents = events.filter((e) => e.status === 'Published');

  return (
    <div className="bg-white space-y-16 pb-20">
      {/* 1. Hero Section: College Campus Background + Gradient Overlay + Department Cards */}
      <HeroSection
        onSearch={onSearch}
        onExploreEvents={() => onNavigate('events')}
        onExploreOpportunities={() => onNavigate('internships')}
        onSelectDepartment={(dept) => onNavigate('events', undefined, undefined, dept)}
        totalEventsCount={publishedEvents.length}
      />

      {/* 2. Explore by Category: Very Light Cool Grey Background (#F7F9FC) */}
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
              const activeCount = publishedEvents.filter(
                (e) => e.category.toLowerCase() === item.name.toLowerCase()
              ).length;

              return (
                <div
                  key={item.name}
                  onClick={() => onNavigate('events', item.name)}
                  className="group p-6 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl ${item.accent} group-hover:bg-indigo-600 group-hover:text-white transition-colors`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono font-medium text-[#64748b]">
                      {activeCount > 0 ? `${activeCount} Active` : 'Open'}
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

      {/* 4. Active Recruitment & Innovation Drives Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <Calendar className="w-3.5 h-3.5" />
              Verified Master Registry
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-light text-[#111827] tracking-tight">
              Featured Opportunities &amp; Drives
            </h2>
            <p className="text-xs text-[#475569] mt-1">
              Active enterprise hiring programs, national CTF contests, and paid industrial internships.
            </p>
          </div>

          <button
            onClick={() => onNavigate('events')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer pb-1"
          >
            <span>View all opportunities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {publishedEvents.map((event) => (
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

      {/* 5. Student Guide: 3-Step Process */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 rounded-3xl p-8 sm:p-12 border border-slate-200">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
              Seamless Student Journey
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-light text-[#111827] mt-1">
              How CampusConnect Works for Students
            </h3>
            <p className="text-xs text-[#475569] mt-2">
              Designed for SRM TRP Engineering College students to discover verified events and apply with confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm mb-4">
                01
              </div>
              <h4 className="text-sm font-bold text-[#111827]">Discover Opportunities</h4>
              <p className="text-xs text-[#475569] mt-2 leading-relaxed">
                Browse verified campus recruitment challenges, national CTF hackathons, and paid internships from premier companies.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm mb-4">
                02
              </div>
              <h4 className="text-sm font-bold text-[#111827]">Filter by Branch &amp; Domain</h4>
              <p className="text-xs text-[#475569] mt-2 leading-relaxed">
                Use the department filter to find drives tailored to your engineering discipline, from CSE, ECE, EEE to AI&amp;DS.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm mb-4">
                03
              </div>
              <h4 className="text-sm font-bold text-[#111827]">Apply Directly</h4>
              <p className="text-xs text-[#475569] mt-2 leading-relaxed">
                Access official corporate links, college feedback spreadsheets, or registration forms with zero intermediaries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Training & Placement Cell Hub Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#0f172a] p-8 sm:p-12 text-white border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Department of Training &amp; Placement
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-light text-white">
              Ready to Advance Your Technical Career?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Stay ahead of placement deadlines, competitive coding challenges, and corporate fellowships through the SRM TRP campus registry.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('events')}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-full transition-all cursor-pointer shadow-sm active:scale-98"
            >
              Browse All Events
            </button>
            <button
              onClick={() => onNavigate('internships')}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-full transition-all border border-slate-700 cursor-pointer active:scale-98"
            >
              Explore Internships
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
