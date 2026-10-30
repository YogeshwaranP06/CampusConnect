
import React from 'react';
import { CampusEvent } from '../../types/event';
import { EventPoster } from '../common/EventPoster';
import {
  Bookmark,
  MapPin,
  Calendar,
  Clock,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

interface EventCardProps {
  event: CampusEvent;
  onSelect: (event: CampusEvent) => void;
  isSaved?: boolean;
  onToggleSave?: (eventId: string, e: React.MouseEvent) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onSelect,
  isSaved = false,
  onToggleSave,
}) => {
  const startDate = new Date(event.start_date);

  const formattedDate = !isNaN(startDate.getTime())
    ? startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    : event.start_date;

  // Deadline & Registration Status calculation
  const now = new Date();

  let deadlineStatus:
    | 'closed'
    | 'closing_soon'
    | 'register_by'
    | 'open_registration'
    | 'details_only' = 'open_registration';

  let formattedDeadline = '';

  const hasValidLink = Boolean(
    event.has_valid_registration_url ??
    (
      event.registration_url &&
      event.registration_url !== '#' &&
      event.registration_url.startsWith('http')
    )
  );

  if (event.registration_deadline) {
    const deadlineDate = new Date(event.registration_deadline);

    if (!isNaN(deadlineDate.getTime())) {
      const diffHours =
        (deadlineDate.getTime() - now.getTime()) /
        (1000 * 60 * 60);

      if (diffHours < 0) {
        deadlineStatus = 'closed';
        formattedDeadline = 'Registration Closed';
      } else if (diffHours <= 72) {
        deadlineStatus = 'closing_soon';
        formattedDeadline = `Closes in ${Math.ceil(diffHours / 24)}d`;
      } else {
        deadlineStatus = 'register_by';
        formattedDeadline = `Register by ${deadlineDate.toLocaleDateString(
          'en-US',
          {
            month: 'short',
            day: 'numeric',
          }
        )}`;
      }
    }
  } else if (!hasValidLink) {
    deadlineStatus = 'details_only';
    formattedDeadline = 'Details Only';
  } else {
    deadlineStatus = 'open_registration';
    formattedDeadline = 'Open Registration';
  }

  const fee =
    typeof event.registration_fee === 'number'
      ? event.registration_fee
      : (event.fee_amount || 0);

  const feeDisplay = fee === 0 ? 'Free' : `₹${fee}`;

  return (
    <article
      onClick={() => onSelect(event)}
      className="group relative flex flex-col bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Poster Media Box */}
      <div
        className="relative w-full aspect-video overflow-hidden bg-slate-50 flex items-center justify-center [&_img]:!w-full [&_img]:!h-full [&_img]:!object-contain [&_img]:!object-center"
      >
        <EventPoster
          bannerUrl={event.banner_url}
          driveRef={event.drive_file_ref}
          category={event.category}
          name={event.name}
          aspectRatio="video"
        />

        {/* Bookmark Button */}
        {onToggleSave && (
          <button
            onClick={(e) => onToggleSave(event.id, e)}
            aria-label={isSaved ? 'Remove bookmark' : 'Bookmark event'}
            className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 cursor-pointer shadow-sm border border-white/10"
          >
            <Bookmark
              className={`w-4 h-4 ${isSaved
                ? 'fill-amber-400 text-amber-400'
                : 'text-white'
                }`}
            />
          </button>
        )}

        {/* Featured Marker */}
        {event.featured && (
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md text-amber-300 text-[11px] font-semibold tracking-wide border border-white/10 shadow-sm">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Featured</span>
          </div>
        )}
      </div>

      {/* Card Content Area */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div className="space-y-3">

          {/* Metadata: Level, Category, Mode and Fee */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
            {event.level && (
              <>
                <span className="text-[#111827] font-semibold">
                  {event.level}
                </span>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
              </>
            )}

            <span className="text-indigo-600 font-semibold">
              {event.category}
            </span>

            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>

            <span>{event.mode}</span>

            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>

            <span
              className={
                event.registration_fee === 0
                  ? 'text-emerald-700 font-semibold'
                  : 'font-mono text-[#111827]'
              }
            >
              {feeDisplay}
            </span>
          </div>

          {/* Event Title */}
          <h3 className="text-base font-semibold text-[#111827] group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
            {event.name}
          </h3>

          {/* Organizer Information */}
          <div className="text-xs text-[#475569] line-clamp-1">
            <span className="font-semibold text-[#111827]">
              {event.organizer_name}
            </span>

            <span className="text-slate-500">
              {' '}({event.organizer_type})
            </span>
          </div>

          {/* Location or Mode */}
          {(event.location || event.mode) && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-0.5 line-clamp-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />

              <span className="truncate">
                {event.location
                  ? `${event.location} (${event.mode})`
                  : event.mode}
              </span>
            </div>
          )}

          {/* Event Description */}
          <p className="text-xs text-[#475569] line-clamp-2 leading-relaxed pt-0.5 font-normal">
            {event.description}
          </p>
        </div>

        {/* Bottom Metadata & Status */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs gap-2">

          {/* Event Date */}
          <div className="flex items-center gap-1.5 text-[#475569] shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formattedDate}</span>
          </div>

          {/* Registration Deadline Status */}
          <div className="text-right text-xs truncate">
            {deadlineStatus === 'closed' ? (
              <span className="text-rose-600 font-medium">
                Closed
              </span>
            ) : deadlineStatus === 'closing_soon' ? (
              <span className="text-amber-600 font-semibold flex items-center justify-end gap-1">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{formattedDeadline}</span>
              </span>
            ) : deadlineStatus === 'register_by' ? (
              <span className="text-slate-500 flex items-center justify-end gap-1">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{formattedDeadline}</span>
              </span>
            ) : deadlineStatus === 'details_only' ? (
              <span className="text-slate-500 font-medium group-hover:text-indigo-600 transition-colors flex items-center justify-end gap-0.5">
                <span>Details Only</span>
                <ArrowUpRight className="w-3 h-3" />
              </span>
            ) : (
              <span className="text-emerald-600 font-medium group-hover:translate-x-0.5 transition-transform flex items-center justify-end gap-0.5">
                <span>Open Registration</span>
                <ArrowUpRight className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
