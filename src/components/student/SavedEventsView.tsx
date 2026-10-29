import React from 'react';
import { CampusEvent } from '../../types/event';
import { EventCard } from './EventCard';
import { Bookmark, Compass } from 'lucide-react';

interface SavedEventsViewProps {
  events: CampusEvent[];
  savedIds: string[];
  onSelectEvent: (event: CampusEvent) => void;
  onToggleSave: (eventId: string, e: React.MouseEvent) => void;
  onExploreEvents: () => void;
}

export const SavedEventsView: React.FC<SavedEventsViewProps> = ({
  events,
  savedIds,
  onSelectEvent,
  onToggleSave,
  onExploreEvents,
}) => {
  const savedEvents = events.filter((e) => savedIds.includes(e.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 bg-[#f7f1e8]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#a81c24] block mb-1">
            Personal Shortlist
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-light text-[#1c1b1a] tracking-tight flex items-center gap-2">
            <span>Saved Events & Opportunities</span>
            <span className="font-mono text-base font-normal text-[#838280]">
              ({savedEvents.length})
            </span>
          </h1>
          <p className="text-xs text-[#4a4741] mt-1 font-normal">
            Stored locally in your browser. No account or student registration required.
          </p>
        </div>

        <button
          onClick={onExploreEvents}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-medium text-white bg-[#132450] hover:bg-[#1a4ca1] rounded-full transition-colors cursor-pointer shadow-xs active:scale-98"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Discover More Events</span>
        </button>
      </div>

      {savedEvents.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-[#e1dcd3] space-y-4 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#f2ece1] flex items-center justify-center text-[#4a4741]">
            <Bookmark className="w-6 h-6 text-[#132450]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-normal text-[#1c1b1a]">No saved events yet</h3>
            <p className="text-xs text-[#4a4741] max-w-sm mx-auto">
              Click the bookmark icon on any event card to save interesting hackathons, workshops, and symposiums to your personal shortlist.
            </p>
          </div>
          <button
            onClick={onExploreEvents}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-medium text-white bg-[#1a4ca1] hover:bg-[#132450] rounded-full transition-all shadow-xs cursor-pointer active:scale-98"
          >
            <span>Explore Events Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onSelect={onSelectEvent}
              isSaved={true}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
};
