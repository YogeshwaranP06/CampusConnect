import React from 'react';
import { CampusEvent } from '../../types/event';
import { HeroSection } from './HeroSection';
import { 
  Code2, 
  Presentation, 
  Wrench, 
  Trophy, 
  BookOpen, 
  Cpu, 
  Sparkles, 
  Briefcase 
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

export const StudentHome: React.FC<StudentHomeProps> = ({
  events,
  onNavigate,
  onSearch,
}) => {
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
              const activeCount = events.filter((e) => e.category.toLowerCase() === item.name.toLowerCase()).length;
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
                      {activeCount > 0 ? `${activeCount} Active` : 'Upcoming'}
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
    </div>
  );
};
