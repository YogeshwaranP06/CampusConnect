import React, { useState, useEffect } from 'react';
import { CampusEvent } from '../../types/event';
import { EventPoster } from '../common/EventPoster';
import { sanitizeExternalUrl } from '../../utils/driveUrl';
import { 
  X, 
  ExternalLink, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Trophy, 
  Mail, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Bookmark, 
  Share2, 
  Building,
  GraduationCap,
  ArrowLeft,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Sparkles,
  Globe
} from 'lucide-react';

interface EventDetailsModalProps {
  event: CampusEvent | null;
  onClose: () => void;
  isSaved?: boolean;
  onToggleSave?: (eventId: string) => void;
  relatedEvents?: CampusEvent[];
  onSelectRelated?: (event: CampusEvent) => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  onClose,
  isSaved = false,
  onToggleSave,
  relatedEvents = [],
  onSelectRelated,
}) => {
  // Full-screen view state (defaults to true as requested)
  const [isFullScreen, setIsFullScreen] = useState(true);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (event) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [event]);

  if (!event) return null;

  const startDate = new Date(event.start_date);
  const formattedStart = !isNaN(startDate.getTime())
    ? startDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : event.start_date;

  const endDate = event.end_date ? new Date(event.end_date) : null;
  const formattedEnd = endDate && !isNaN(endDate.getTime())
    ? endDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : event.end_date;

  const now = new Date();
  const deadlineDate = event.registration_deadline ? new Date(event.registration_deadline) : null;
  const isPastDeadline = deadlineDate && !isNaN(deadlineDate.getTime()) && deadlineDate.getTime() < now.getTime();
  
  const formattedDeadline = deadlineDate && !isNaN(deadlineDate.getTime())
    ? deadlineDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      })
    : event.registration_deadline;

  const safeRegUrl = sanitizeExternalUrl(event.registration_url);
  const safeOfficialUrl = sanitizeExternalUrl(event.official_url);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.name,
        text: `Check out ${event.name} organized by ${event.organizer_name} on SRM TRP CampusConnect`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Event URL copied to clipboard!');
    }
  };

  /* -------------------------------------------------------------------------- */
  /* FULL SCREEN VIEW                                                           */
  /* -------------------------------------------------------------------------- */
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#f7f1e8] overflow-y-auto flex flex-col selection:bg-[#1a4ca1] selection:text-white">
        {/* Sticky Fullscreen Navigation Header */}
        <header className="sticky top-0 z-40 bg-[#f7f1e8]/95 backdrop-blur-md border-b border-[#e1dcd3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 h-16">
              {/* Back to Events CTA */}
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#4a4741] bg-white border border-[#e1dcd3] hover:bg-[#ece6dc] hover:text-[#1c1b1a] rounded-full transition-all shadow-xs cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Events</span>
                </button>

                <div className="hidden sm:flex items-center gap-2 text-xs text-[#838280] font-medium pl-3 border-l border-[#e1dcd3]">
                  {event.level && (
                    <>
                      <span className="text-[#132450] font-bold">{event.level}</span>
                      <span aria-hidden="true" className="text-[#e1dcd3]">·</span>
                    </>
                  )}
                  <span className="text-[#a81c24] font-semibold">{event.category}</span>
                  <span aria-hidden="true" className="text-[#e1dcd3]">·</span>
                  <span className="text-[#4a4741]">{event.mode}</span>
                  <span aria-hidden="true" className="text-[#e1dcd3]">·</span>
                  <span className="font-mono text-[#838280]">{event.event_id}</span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2">
                {onToggleSave && (
                  <button
                    onClick={() => onToggleSave(event.id)}
                    className="p-2 text-[#4a4741] hover:text-[#1c1b1a] hover:bg-[#ece6dc] rounded-full transition-colors cursor-pointer"
                    title={isSaved ? 'Remove from saved' : 'Save for later'}
                  >
                    <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#c59b27] text-[#c59b27]' : ''}`} />
                  </button>
                )}
                <button
                  onClick={handleShare}
                  className="p-2 text-[#4a4741] hover:text-[#1c1b1a] hover:bg-[#ece6dc] rounded-full transition-colors cursor-pointer"
                  title="Share event link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsFullScreen(false)}
                  className="hidden md:flex p-2 text-[#4a4741] hover:text-[#1c1b1a] hover:bg-[#ece6dc] rounded-full transition-colors cursor-pointer"
                  title="Switch to Compact Modal"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-[#838280] hover:text-[#1c1b1a] hover:bg-[#ece6dc] rounded-full transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Expansive Full Screen Content Grid */}
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Main Column (8 cols): Poster, Title, Description, Guidelines, Related */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Full Width Hero Poster Display */}
              <div className="rounded-3xl overflow-hidden border border-[#e1dcd3] shadow-sm bg-white">
                <EventPoster
                  bannerUrl={event.banner_url}
                  driveRef={event.drive_file_ref}
                  category={event.category}
                  name={event.name}
                  aspectRatio="wide"
                />
              </div>

              {/* Title & Host Meta Header */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {event.level && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#132450] text-white">
                      {event.level}
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#a81c24]/10 text-[#a81c24] border border-[#a81c24]/20">
                    {event.category}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#ece6dc] text-[#4a4741]">
                    {event.mode} Event
                  </span>
                  {event.featured && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#c59b27]/15 text-[#925f12] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Flagship Feature</span>
                    </span>
                  )}
                </div>

                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-[#1c1b1a] tracking-tight leading-tight">
                  {event.name}
                </h1>

                <div className="flex flex-wrap items-center gap-3 text-sm text-[#4a4741] pt-1">
                  <div className="flex items-center gap-1.5 font-medium text-[#1c1b1a]">
                    <Building className="w-4 h-4 text-[#132450]" />
                    <span>{event.organizer_name}</span>
                  </div>
                  <span className="text-[#e1dcd3]">|</span>
                  <span className="text-[#4a4741]">{event.organizer_type}</span>
                  <span className="text-[#e1dcd3]">|</span>
                  <span className="flex items-center gap-1 text-[#132450] text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#c59b27]" />
                    <span>Verified Academic Listing</span>
                  </span>
                </div>
              </div>

              {/* About & Detailed Description */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#e1dcd3] shadow-xs space-y-4">
                <h2 className="font-display text-xl sm:text-2xl font-light text-[#1c1b1a]">
                  About This Event
                </h2>
                <div className="text-sm text-[#4a4741] leading-relaxed space-y-4 whitespace-pre-line font-normal">
                  {event.description}
                </div>
              </div>

              {/* Eligibility & Departments Card */}
              {(event.eligibility || event.eligible_departments) && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#e1dcd3] shadow-xs space-y-5">
                  <h2 className="font-display text-xl sm:text-2xl font-light text-[#1c1b1a] flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-[#132450]" />
                    <span>Eligibility & Target Audience</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {event.eligibility && (
                      <div className="p-5 rounded-2xl bg-[#f7f1e8] border border-[#e1dcd3] space-y-1.5">
                        <span className="text-[#838280] block font-bold uppercase tracking-wider text-[11px]">
                          Criteria & Academic Year
                        </span>
                        <p className="text-sm font-medium text-[#1c1b1a] leading-normal">
                          {event.eligibility}
                        </p>
                      </div>
                    )}

                    {event.eligible_departments && (
                      <div className="p-5 rounded-2xl bg-[#f7f1e8] border border-[#e1dcd3] space-y-1.5">
                        <span className="text-[#838280] block font-bold uppercase tracking-wider text-[11px]">
                          Eligible Engineering Streams
                        </span>
                        <p className="text-sm font-medium text-[#1c1b1a] leading-normal">
                          {event.eligible_departments}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Host Contacts */}
              {(event.contact_email || event.contact_phone) && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#e1dcd3] shadow-xs space-y-4">
                  <h2 className="font-display text-xl sm:text-2xl font-light text-[#1c1b1a]">
                    Host Contact & Coordinator Support
                  </h2>
                  <div className="flex flex-wrap items-center gap-6 text-sm">
                    {event.contact_email && (
                      <a
                        href={`mailto:${event.contact_email}`}
                        className="flex items-center gap-2 text-[#1a4ca1] hover:text-[#132450] font-medium"
                      >
                        <Mail className="w-4 h-4 text-[#838280]" />
                        <span>{event.contact_email}</span>
                      </a>
                    )}
                    {event.contact_phone && (
                      <div className="flex items-center gap-2 text-[#4a4741] font-medium">
                        <Phone className="w-4 h-4 text-[#838280]" />
                        <span>{event.contact_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Related Events Showcase */}
              {relatedEvents.length > 0 && (
                <div className="space-y-4 pt-4">
                  <h3 className="font-display text-2xl font-light text-[#1c1b1a]">
                    Related Events in {event.category}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {relatedEvents.slice(0, 2).map((rel) => (
                      <div
                        key={rel.id}
                        onClick={() => onSelectRelated && onSelectRelated(rel)}
                        className="p-6 rounded-2xl bg-white border border-[#e1dcd3] hover:border-[#132450] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold text-[#a81c24]">
                            {rel.organizer_name}
                          </span>
                          <h4 className="font-serif text-base font-normal text-[#1c1b1a] line-clamp-1">
                            {rel.name}
                          </h4>
                          <p className="text-xs text-[#4a4741] line-clamp-2 mt-1">
                            {rel.description}
                          </p>
                        </div>
                        <div className="mt-5 pt-3.5 border-t border-[#e1dcd3] flex items-center justify-between text-xs text-[#838280]">
                          <span>{new Date(rel.start_date).toLocaleDateString()}</span>
                          <span className="font-semibold text-[#1a4ca1]">View Details →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sticky Column (4 cols): Action Card, Schedule, Deadline, Links */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              <div className="bg-white rounded-3xl border border-[#e1dcd3] shadow-xs p-6 sm:p-8 space-y-6">
                
                {/* Registration Fee & Mode Tag */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-[#838280] block font-medium">Registration Fee</span>
                    <span className="text-3xl font-extrabold text-[#1c1b1a] font-mono">
                      {event.registration_fee === 0 ? 'Free' : `$${event.registration_fee}`}
                    </span>
                  </div>
                  <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-[#ece6dc] text-[#132450]">
                    {event.mode} Event
                  </span>
                </div>

                {/* Primary Registration Action CTA */}
                <div className="space-y-3">
                  {safeRegUrl ? (
                    <a
                      href={isPastDeadline ? undefined : safeRegUrl}
                      target={isPastDeadline ? undefined : '_blank'}
                      rel={isPastDeadline ? undefined : 'noopener noreferrer'}
                      className={`w-full py-4 px-6 text-sm font-medium rounded-full transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98 ${
                        isPastDeadline
                          ? 'bg-[#ece6dc] text-[#838280] cursor-not-allowed'
                          : 'bg-[#1a4ca1] hover:bg-[#132450] text-white'
                      }`}
                      onClick={(e) => {
                        if (isPastDeadline) e.preventDefault();
                      }}
                    >
                      <span>{isPastDeadline ? 'Registration Closed' : 'Register on Official Website'}</span>
                      {!isPastDeadline && <ExternalLink className="w-4 h-4" />}
                    </a>
                  ) : (
                    <button
                      disabled
                      className="w-full py-4 px-6 text-sm font-medium rounded-full bg-[#ece6dc] text-[#838280] cursor-not-allowed"
                    >
                      Registration Unavailable
                    </button>
                  )}

                  {safeOfficialUrl && (
                    <a
                      href={safeOfficialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-5 text-xs font-medium text-[#4a4741] bg-transparent hover:bg-[#4a4741] hover:text-white border border-[#4a4741] rounded-full transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <span>View Official Event Website</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Deadline Alert Notice */}
                <div className={`p-4 rounded-2xl text-xs flex items-start gap-3 ${
                  isPastDeadline 
                    ? 'bg-[#a81c24]/10 text-[#a81c24] border border-[#a81c24]/20' 
                    : 'bg-[#f7f1e8] text-[#4a4741] border border-[#e1dcd3]'
                }`}>
                  <Clock className="w-4 h-4 shrink-0 mt-0.5 text-[#a81c24]" />
                  <div>
                    <span className="font-semibold block text-[#1c1b1a]">Registration Cutoff</span>
                    <span>
                      {isPastDeadline
                        ? `Deadline has passed (${formattedDeadline})`
                        : formattedDeadline || 'Registration currently open'}
                    </span>
                  </div>
                </div>

                {/* Key Facts List */}
                <div className="space-y-4 pt-4 border-t border-[#e1dcd3] text-xs">
                  {event.level && (
                    <div className="flex items-start gap-3">
                      <Globe className="w-4 h-4 text-[#132450] mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[#838280] block font-medium">Event Level</span>
                        <span className="font-bold text-[#132450] leading-normal block">
                          {event.level}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-[#132450] mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[#838280] block font-medium">Event Date</span>
                      <span className="font-semibold text-[#1c1b1a] text-sm">
                        {formattedStart}
                        {formattedEnd && formattedEnd !== formattedStart && ` – ${formattedEnd}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#838280] mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[#838280] block font-medium">Venue / Platform</span>
                      <span className="font-medium text-[#1c1b1a] leading-normal block">
                        {event.location}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-[#838280] mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[#838280] block font-medium">Participation Type</span>
                      <span className="font-medium text-[#1c1b1a]">
                        {event.participation_type}
                        {event.min_team_size && event.max_team_size && (
                          <span className="text-[#4a4741] ml-1">
                            ({event.min_team_size}–{event.max_team_size} members)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {event.prize_pool && (
                    <div className="flex items-start gap-3">
                      <Trophy className="w-4 h-4 text-[#c59b27] mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[#838280] block font-medium">Prize Pool & Awards</span>
                        <span className="font-bold text-[#925f12] leading-normal block">
                          {event.prize_pool}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Verification Assurance */}
                <div className="pt-4 border-t border-[#e1dcd3] flex items-center gap-2 text-[11px] text-[#838280]">
                  <CheckCircle2 className="w-4 h-4 text-[#224228] shrink-0" />
                  <span>External registration opens safely on host portal.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fullscreen Footer Copyright */}
        <div className="py-6 border-t border-[#e1dcd3] bg-[#f2ece1] text-center text-xs text-[#838280]">
          © {new Date().getFullYear()} SRM TRP Engineering College. All Rights Reserved. · CampusConnect Event Portal
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* COMPACT MODAL VIEW (Toggleable via Maximize/Minimize button)                */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-4xl bg-[#f7f1e8] rounded-3xl shadow-2xl border border-[#e1dcd3] overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar with Modal Controls */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-[#f7f1e8]/95 backdrop-blur-md border-b border-[#e1dcd3]">
          <div className="flex items-center gap-2 text-xs text-[#838280] font-medium">
            {event.level && (
              <>
                <span className="text-[#132450] font-bold">{event.level}</span>
                <span aria-hidden="true" className="text-[#e1dcd3]">·</span>
              </>
            )}
            <span className="text-[#a81c24] font-semibold">{event.category}</span>
            <span aria-hidden="true" className="text-[#e1dcd3]">·</span>
            <span className="text-[#4a4741]">{event.mode}</span>
            <span aria-hidden="true" className="text-[#e1dcd3]">·</span>
            <span className="font-mono text-[#838280]">{event.event_id}</span>
          </div>

          <div className="flex items-center gap-2">
            {onToggleSave && (
              <button
                onClick={() => onToggleSave(event.id)}
                className="p-2 text-[#4a4741] hover:text-[#1c1b1a] hover:bg-[#ece6dc] rounded-full transition-colors cursor-pointer"
                title={isSaved ? 'Remove from saved' : 'Save for later'}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#c59b27] text-[#c59b27]' : ''}`} />
              </button>
            )}
            <button
              onClick={handleShare}
              className="p-2 text-[#4a4741] hover:text-[#1c1b1a] hover:bg-[#ece6dc] rounded-full transition-colors cursor-pointer"
              title="Share event"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsFullScreen(true)}
              className="p-2 text-[#4a4741] hover:text-[#1c1b1a] hover:bg-[#ece6dc] rounded-full transition-colors cursor-pointer"
              title="Expand to Full Screen View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#838280] hover:text-[#1c1b1a] hover:bg-[#ece6dc] rounded-full transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          <div className="rounded-2xl overflow-hidden shadow-xs border border-[#e1dcd3] bg-white">
            <EventPoster
              bannerUrl={event.banner_url}
              driveRef={event.drive_file_ref}
              category={event.category}
              name={event.name}
              aspectRatio="wide"
            />
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl font-light text-[#1c1b1a] leading-tight">
              {event.name}
            </h2>
            <div className="flex items-center gap-2 text-sm text-[#4a4741]">
              <Building className="w-4 h-4 text-[#132450] shrink-0" />
              <span className="font-medium text-[#1c1b1a]">{event.organizer_name}</span>
              <span className="text-[#e1dcd3]">·</span>
              <span className="text-[#838280]">{event.organizer_type}</span>
            </div>
          </div>

          {/* Key Facts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 p-5 rounded-2xl bg-white border border-[#e1dcd3] text-xs">
            <div className="space-y-1">
              <span className="text-[#838280] block font-medium">Dates & Timing</span>
              <div className="flex items-start gap-1.5 font-semibold text-[#1c1b1a]">
                <Calendar className="w-3.5 h-3.5 text-[#132450] shrink-0 mt-0.5" />
                <span>
                  {formattedStart}
                  {formattedEnd && formattedEnd !== formattedStart && ` – ${formattedEnd}`}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[#838280] block font-medium">Registration Deadline</span>
              <div className="flex items-start gap-1.5 font-semibold">
                <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#a81c24]" />
                {isPastDeadline ? (
                  <span className="text-[#a81c24]">Passed ({formattedDeadline})</span>
                ) : formattedDeadline ? (
                  <span className="text-[#1c1b1a]">{formattedDeadline}</span>
                ) : (
                  <span className="text-[#838280]">Not specified</span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[#838280] block font-medium">Format & Fee</span>
              <div className="font-semibold text-[#1c1b1a]">
                {event.level && (
                  <>
                    <span className="text-[#132450] font-bold">{event.level}</span>
                    <span className="mx-1.5 text-[#e1dcd3]">·</span>
                  </>
                )}
                <span>{event.mode}</span>
                <span className="mx-1.5 text-[#e1dcd3]">·</span>
                <span className={event.registration_fee === 0 ? 'text-[#224228]' : 'font-mono'}>
                  {event.registration_fee === 0 ? 'Free' : `$${event.registration_fee}`}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[#838280] block font-medium">Venue / Platform</span>
              <div className="flex items-start gap-1.5 font-semibold text-[#1c1b1a]">
                <MapPin className="w-3.5 h-3.5 text-[#838280] shrink-0 mt-0.5" />
                <span className="line-clamp-2">{event.location}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[#838280] block font-medium">Participation</span>
              <div className="flex items-start gap-1.5 font-semibold text-[#1c1b1a]">
                <Users className="w-3.5 h-3.5 text-[#838280] shrink-0 mt-0.5" />
                <span>
                  {event.participation_type}
                  {event.min_team_size && event.max_team_size && (
                    <span className="text-[#4a4741] font-normal ml-1">
                      ({event.min_team_size}–{event.max_team_size} members)
                    </span>
                  )}
                </span>
              </div>
            </div>

            {event.prize_pool && (
              <div className="space-y-1">
                <span className="text-[#838280] block font-medium">Awards & Prizes</span>
                <div className="flex items-start gap-1.5 font-semibold text-[#925f12]">
                  <Trophy className="w-3.5 h-3.5 text-[#c59b27] shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{event.prize_pool}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 bg-white p-5 rounded-2xl border border-[#e1dcd3]">
            <h3 className="font-display text-base font-light text-[#1c1b1a]">
              About This Event
            </h3>
            <p className="text-sm text-[#4a4741] leading-relaxed whitespace-pre-line font-normal">
              {event.description}
            </p>
          </div>

          {(event.eligibility || event.eligible_departments) && (
            <div className="p-5 rounded-2xl bg-white border border-[#e1dcd3] space-y-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-[#132450]">
                <GraduationCap className="w-4 h-4 text-[#132450]" />
                <span>Eligibility & Departments</span>
              </div>
              {event.eligibility && (
                <p className="text-[#4a4741] leading-normal">
                  <strong className="font-semibold text-[#1c1b1a]">Criteria:</strong> {event.eligibility}
                </p>
              )}
              {event.eligible_departments && (
                <p className="text-[#4a4741] leading-normal">
                  <strong className="font-semibold text-[#1c1b1a]">Eligible Streams:</strong> {event.eligible_departments}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="sticky bottom-0 z-30 p-4 sm:p-5 bg-[#f7f1e8] border-t border-[#e1dcd3] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#838280] text-center sm:text-left">
            {isPastDeadline ? (
              <span className="text-[#a81c24] font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Registration deadline has passed.
              </span>
            ) : (
              <span>Registration handled directly on the host institution portal.</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {safeOfficialUrl && (
              <a
                href={safeOfficialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 text-xs font-medium text-[#4a4741] bg-white border border-[#e1dcd3] hover:bg-[#ece6dc] rounded-full transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-none cursor-pointer"
              >
                <span>Event Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {safeRegUrl ? (
              <a
                href={isPastDeadline ? undefined : safeRegUrl}
                target={isPastDeadline ? undefined : '_blank'}
                rel={isPastDeadline ? undefined : 'noopener noreferrer'}
                className={`px-6 py-2.5 text-xs font-medium rounded-full transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-none cursor-pointer active:scale-98 ${
                  isPastDeadline
                    ? 'bg-[#ece6dc] text-[#838280] cursor-not-allowed'
                    : 'bg-[#1a4ca1] hover:bg-[#132450] text-white shadow-xs'
                }`}
                onClick={(e) => {
                  if (isPastDeadline) e.preventDefault();
                }}
              >
                <span>{isPastDeadline ? 'Registration Closed' : 'Register on Official Website'}</span>
                {!isPastDeadline && <ExternalLink className="w-3.5 h-3.5" />}
              </a>
            ) : (
              <button
                disabled
                className="px-6 py-2.5 text-xs font-medium rounded-full bg-[#ece6dc] text-[#838280] cursor-not-allowed"
              >
                Registration Unavailable
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
