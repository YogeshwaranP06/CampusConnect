import React, { useState } from 'react';
import { Search, ArrowRight, Compass, Briefcase } from 'lucide-react';

interface HeroSectionProps {
  onSearch: (query: string) => void;
  onExploreEvents: () => void;
  onExploreOpportunities: () => void;
  totalEventsCount: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSearch,
  onExploreEvents,
  onExploreOpportunities,
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
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="max-w-3xl space-y-7">
          {/* Eyebrow Label with subtle purple/indigo accent */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold tracking-wider uppercase text-slate-800">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            <span>SRM TRP Engineering College · Event & Career Directory</span>
          </div>

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
      </div>
    </section>
  );
};
