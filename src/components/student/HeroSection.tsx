import React, { useState } from 'react';
import { Search, ArrowRight, Compass, Briefcase } from 'lucide-react';

interface HeroSectionProps {
  onSearch: (query: string) => void;
  onExploreEvents: () => void;
  onExploreOpportunities: () => void;
  onSelectDepartment?: (department: string) => void;
  totalEventsCount: number;
}

const DEPARTMENT_CARDS = [
  {
    code: 'CSE',
    title: 'CSE',
    fullName: 'Computer Science Engineering',
    filterTarget: 'B.E.-Computer Science and Engineering',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
  },
  {
    code: 'ECE',
    title: 'ECE',
    fullName: 'Electronics and Communication Engineering',
    filterTarget: 'B.E.-Electronics and Communications Engineering',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
  },
  {
    code: 'EEE',
    title: 'EEE',
    fullName: 'Electrical and Electronics Engineering',
    filterTarget: 'B.E.-Electrical and Electronics Engineering',
    image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80',
  },
  {
    code: 'AI&DS',
    title: 'AI&DS',
    fullName: 'Artificial Intelligence and Data Science',
    filterTarget: 'B.Tech-Artificial Intelligence and Data Science',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80',
  },
  {
    code: 'Mechanical',
    title: 'Mechanical',
    fullName: 'Mechanical Engineering',
    filterTarget: 'B.E.-Mechanical Engineering',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
  },
  {
    code: 'Civil',
    title: 'Civil',
    fullName: 'Civil Engineering',
    filterTarget: 'B.E.-Civil Engineering',
    image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=600&q=80',
  },
  {
    code: 'CSE (AIML)',
    title: 'CSE (AIML)',
    fullName: 'Computer Science and Engineering (Artificial Intelligence and Machine Learning)',
    filterTarget: 'B.E CSE (Artificial Intelligence and Machine Learning)',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80',
  },
  {
    code: 'CSBS',
    title: 'CSBS',
    fullName: 'Computer Science and Business Systems',
    filterTarget: 'Computer Science and Business Systems',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
  },
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSearch,
  onExploreEvents,
  onExploreOpportunities,
  onSelectDepartment,
  totalEventsCount,
}) => {
  const [searchInput, setSearchInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    } else {
      onExploreEvents();
    }
  };

  return (
    <section className="relative overflow-hidden bg-white border-b border-slate-200">
      {/* College Campus Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center sm:bg-right bg-no-repeat"
        style={{ backgroundImage: `url('/srm-trp-campus.jpg')` }}
      />
      {/* Light Gradient Overlay to maintain crystal-clear typography & contrast */}
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-white via-white/90 to-white/55 sm:to-white/40" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 lg:pt-20 lg:pb-16">
        <div className="max-w-3xl space-y-7">
          {/* High-Contrast Headline in Dark Navy (#111827) */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[62px] font-light tracking-tight text-[#111827] leading-[1.08] text-balance">
            Discover Events. Build Skills. <span className="italic font-normal text-indigo-600">Create Opportunities.</span>
          </h1>

          {/* Supporting Text in Muted Slate (#475569) */}
          <p className="text-base sm:text-lg text-[#475569] leading-relaxed max-w-2xl font-normal">
            A curated master catalog of collegiate hackathons, technical symposiums, research conferences, hands-on workshops, and paid fellowships. Verified by the SRM TRP student coordinating council.
          </p>

          {/* Search Bar Form with Purple Accent Button */}
          <form
            onSubmit={handleSubmit}
            className="pt-2 flex flex-col sm:flex-row items-stretch gap-2.5 max-w-2xl"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by topic, hackathon name, institution, or technology..."
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-full text-sm text-[#111827] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all shadow-xs"
              />
            </div>
            <button
              type="submit"
              className="px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-full transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0 shadow-sm active:scale-98 cursor-pointer"
            >
              <span>Search Events</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Action CTAs: Purple Primary Accent + Light-Grey Secondary */}
          <div className="pt-3 flex flex-wrap items-center gap-4 text-sm">
            <button
              onClick={onExploreEvents}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-full transition-all flex items-center gap-2 whitespace-nowrap shrink-0 shadow-xs cursor-pointer active:scale-98"
            >
              <Compass className="w-4 h-4" />
              <span>Explore All Events</span>
            </button>
            <button
              onClick={onExploreOpportunities}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-full transition-all border border-slate-200 flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer active:scale-98"
            >
              <Briefcase className="w-4 h-4" />
              <span>Browse Internships & Fellowships</span>
            </button>
          </div>
        </div>

        {/* 8 Academic Department Cards Grid matching reference (moved down with ample breathing room) */}
        <div className="pt-16 sm:pt-20 lg:pt-28">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DEPARTMENT_CARDS.map((dept) => (
              <div
                key={dept.code}
                onClick={() => onSelectDepartment?.(dept.filterTarget)}
                className="group relative h-28 sm:h-32 rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-400 transition-all duration-300 cursor-pointer bg-white"
              >
                {/* Photographic Subject Background */}
                <img
                  src={dept.image}
                  alt={dept.fullName}
                  className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />

                {/* Left-to-Right Gradient: Clear white backdrop for text that fades out toward the right */}
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent sm:via-white/80" />

                {/* Card Information */}
                <div className="relative z-10 h-full p-4 sm:p-4.5 flex flex-col justify-between max-w-[78%] sm:max-w-[72%]">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block">
                      DEPARTMENT
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors mt-0.5">
                      {dept.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 font-normal line-clamp-1 leading-tight">
                    {dept.fullName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
