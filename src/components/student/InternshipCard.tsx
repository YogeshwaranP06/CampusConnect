import React from 'react';
import { CampusInternship } from '../../types/internship';
import { EventPoster } from '../common/EventPoster';
import {
  Bookmark,
  MapPin,
  Calendar,
  Clock,
  ArrowUpRight,
  Sparkles,
  Building2,
  Briefcase
} from 'lucide-react';

interface InternshipCardProps {
  internship: CampusInternship;
  onSelect?: (internship: CampusInternship) => void;
  isSaved?: boolean;
  onToggleSave?: (internshipId: string, e: React.MouseEvent) => void;
}

export const InternshipCard: React.FC<InternshipCardProps> = ({
  internship,
  onSelect,
  isSaved = false,
  onToggleSave,
}) => {
  // Format Start Date or Duration
  const startDate = internship.start_date ? new Date(internship.start_date) : null;
  const formattedDate = startDate && !isNaN(startDate.getTime())
    ? startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : internship.internship_type || 'Flexible Start';

  // Deadline & Status Calculation
  const now = new Date();
  let deadlineStatus:
    | 'closed'
    | 'closing_soon'
    | 'apply_by'
    | 'open_application'
    | 'details_only' = 'open_application';

  let formattedDeadline = '';

  const hasValidLink = Boolean(
    internship.has_valid_application_url ??
    (
      internship.application_url &&
      internship.application_url !== '#' &&
      internship.application_url.startsWith('http')
    )
  );

  if (internship.application_deadline) {
    const deadlineDate = new Date(internship.application_deadline);
    if (!isNaN(deadlineDate.getTime())) {
      const diffHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (diffHours < 0) {
        deadlineStatus = 'closed';
        formattedDeadline = 'Applications Closed';
      } else if (diffHours <= 72) {
        deadlineStatus = 'closing_soon';
        formattedDeadline = `Closes in ${Math.ceil(diffHours / 24)}d`;
      } else {
        deadlineStatus = 'apply_by';
        formattedDeadline = `Apply by ${deadlineDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}`;
      }
    }
  } else if (!hasValidLink) {
    deadlineStatus = 'details_only';
    formattedDeadline = 'Details Only';
  } else {
    deadlineStatus = 'open_application';
    formattedDeadline = 'Open Application';
  }

  // Stipend Display formatting
  const stipendText = internship.stipend_details
    ? internship.stipend_details
    : typeof internship.stipend_amount === 'number'
      ? internship.stipend_amount === 0
        ? 'Unpaid / Credit'
        : `₹${internship.stipend_amount.toLocaleString('en-IN')}/mo`
      : internship.stipend_amount
        ? `₹${internship.stipend_amount}`
        : 'Performance Based';

  const handleApplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasValidLink && internship.application_url) {
      window.open(internship.application_url, '_blank', 'noopener,noreferrer');
    } else if (onSelect) {
      onSelect(internship);
    }
  };

  return (
    <article
      onClick={() => onSelect?.(internship)}
      className="group relative flex flex-col bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Poster Media Box (16:9 Aspect Ratio) */}
      <div className="relative w-full aspect-video overflow-hidden bg-slate-50 flex items-center justify-center [&_img]:!w-full [&_img]:!h-full [&_img]:!object-contain [&_img]:!object-center">
        <EventPoster
          bannerUrl={internship.banner_url}
          driveRef={internship.drive_file_ref}
          category={'Internships'}
          name={internship.name}
          aspectRatio="video"
        />

        {/* Bookmark Button */}
        {onToggleSave && (
          <button
            onClick={(e) => onToggleSave(internship.internship_id || internship.id, e)}
            aria-label={isSaved ? 'Remove bookmark' : 'Bookmark internship'}
            className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 cursor-pointer shadow-sm border border-white/10"
          >
            <Bookmark
              className={`w-4 h-4 ${
                isSaved ? 'fill-amber-400 text-amber-400' : 'text-white'
              }`}
            />
          </button>
        )}

        {/* Featured Badge */}
        {internship.featured && (
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md text-amber-300 text-[11px] font-semibold tracking-wide border border-white/10 shadow-sm">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Featured Opportunity</span>
          </div>
        )}
      </div>

      {/* Card Content Area */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Metadata Row: Category, Mode, Stipend */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="text-indigo-600 font-semibold">
              {internship.category || 'Internship'}
            </span>

            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>

            <span>{internship.mode || 'Online'}</span>

            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>

            <span
              className={
                stipendText.toLowerCase().includes('unpaid')
                  ? 'text-slate-600'
                  : 'font-semibold text-emerald-700'
              }
            >
              {stipendText}
            </span>
          </div>

          {/* Role / Internship Title */}
          <h3 className="text-base font-semibold text-[#111827] group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
            {internship.name}
          </h3>

          {/* Company / Organizer Info */}
          <div className="flex items-center gap-1.5 text-xs text-[#475569] line-clamp-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-[#111827]">
              {internship.organizer_name}
            </span>
            {internship.organizer_type && (
              <span className="text-slate-500">
                ({internship.organizer_type})
              </span>
            )}
          </div>

          {/* Location or Department */}
          {(internship.location || internship.department) && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-0.5 line-clamp-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                {internship.location || internship.department}
              </span>
            </div>
          )}

          {/* Eligibility Criteria Snippet */}
          {internship.eligibility && (
            <p className="text-xs text-indigo-900/90 bg-indigo-50/70 border border-indigo-100/80 px-2.5 py-1.5 rounded-lg line-clamp-1 leading-normal font-medium">
              Eligibility: {internship.eligibility}
            </p>
          )}

          {/* Description */}
          <p className="text-xs text-[#475569] line-clamp-2 leading-relaxed pt-0.5 font-normal">
            {internship.description}
          </p>
        </div>

        {/* Bottom Metadata & Application Actions */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
          {/* Timeline / Duration */}
          <div className="flex items-center gap-1.5 text-[#475569] shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formattedDate}</span>
          </div>

          {/* Deadline Status & Apply Action */}
          <div className="text-right text-xs truncate flex items-center gap-2">
            {deadlineStatus === 'closed' ? (
              <span className="text-rose-600 font-medium">
                Closed
              </span>
            ) : deadlineStatus === 'closing_soon' ? (
              <span className="text-amber-600 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{formattedDeadline}</span>
              </span>
            ) : deadlineStatus === 'apply_by' ? (
              <span className="text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{formattedDeadline}</span>
              </span>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                <span>{formattedDeadline}</span>
              </span>
            )}

            {hasValidLink && deadlineStatus !== 'closed' && (
              <button
                type="button"
                onClick={handleApplyClick}
                className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-full font-medium transition-colors cursor-pointer text-xs shrink-0"
              >
                <span>Apply</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
