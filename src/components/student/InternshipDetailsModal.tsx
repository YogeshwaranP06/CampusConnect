import React, { useEffect, useState } from 'react';
import { CampusInternship } from '../../types/internship';
import { EventPoster } from '../common/EventPoster';
import { sanitizeExternalUrl } from '../../utils/driveUrl';
import {
  X,
  ExternalLink,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  Bookmark,
  Share2,
  Building,
  GraduationCap,
  Sparkles,
  Globe,
  Briefcase,
  IndianRupee,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface InternshipDetailsModalProps {
  internship: CampusInternship | null;
  onClose: () => void;
  isSaved?: boolean;
  onToggleSave?: (internshipId: string) => void;
}

export const InternshipDetailsModal: React.FC<InternshipDetailsModalProps> = ({
  internship,
  onClose,
  isSaved = false,
  onToggleSave,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (internship) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [internship, onClose]);

  if (!internship) return null;

  const now = new Date();
  let deadlineStatus: 'closed' | 'closing_soon' | 'open' = 'open';
  let formattedDeadline = '';

  if (internship.application_deadline) {
    const deadlineDate = new Date(internship.application_deadline);
    if (!isNaN(deadlineDate.getTime())) {
      const diffHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (diffHours < 0) {
        deadlineStatus = 'closed';
        formattedDeadline = 'Applications Closed';
      } else if (diffHours <= 72) {
        deadlineStatus = 'closing_soon';
        formattedDeadline = `Closes in ${Math.ceil(diffHours / 24)} days`;
      } else {
        formattedDeadline = `Deadline: ${deadlineDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}`;
      }
    }
  }

  const safeApplyUrl = sanitizeExternalUrl(internship.application_url);
  const safeOfficialUrl = sanitizeExternalUrl(internship.official_url);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const stipendDisplay = internship.stipend_details
    ? internship.stipend_details
    : typeof internship.stipend_amount === 'number'
      ? internship.stipend_amount === 0
        ? 'Unpaid / Academic Credit'
        : `₹${internship.stipend_amount.toLocaleString('en-IN')}/month`
      : internship.stipend_amount
        ? `₹${internship.stipend_amount}`
        : 'Performance / Certificate based';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Actions */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {onToggleSave && (
            <button
              onClick={() => onToggleSave(internship.internship_id || internship.id)}
              className="p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-indigo-600 shadow-md transition-all cursor-pointer border border-slate-200/80"
              title={isSaved ? 'Remove Bookmark' : 'Bookmark Opportunity'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
          )}

          <button
            onClick={handleShare}
            className="p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-indigo-600 shadow-md transition-all cursor-pointer border border-slate-200/80"
            title="Share Link"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-rose-600 shadow-md transition-all cursor-pointer border border-slate-200/80"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero Banner / Poster Area */}
          <div className="relative w-full aspect-21/9 sm:aspect-3/1 bg-slate-900 overflow-hidden flex items-center justify-center">
            <EventPoster
              bannerUrl={internship.banner_url}
              driveRef={internship.drive_file_ref}
              category={'Internships'}
              name={internship.name}
              aspectRatio="video"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
            
            <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-indigo-600/90 font-medium backdrop-blur-md">
                  {internship.category || 'Internship'}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md">
                  {internship.internship_type || 'Opportunity'}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/80 font-medium backdrop-blur-md">
                  {stipendDisplay}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
                {internship.name}
              </h1>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-indigo-500" /> Organization
                </span>
                <p className="font-semibold text-slate-900 truncate">{internship.organizer_name}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Mode &amp; Venue
                </span>
                <p className="font-semibold text-slate-900 truncate">
                  {internship.mode} {internship.location ? `· ${internship.location}` : ''}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Duration
                </span>
                <p className="font-semibold text-slate-900">
                  {internship.internship_type || 'Flexible'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" /> Deadline
                </span>
                <p className={`font-semibold ${deadlineStatus === 'closed' ? 'text-rose-600' : deadlineStatus === 'closing_soon' ? 'text-amber-600' : 'text-slate-900'}`}>
                  {formattedDeadline || 'Open Registration'}
                </p>
              </div>
            </div>

            {/* Eligibility & Branches Card */}
            {(internship.eligibility || internship.eligible_departments) && (
              <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100/80 space-y-3">
                <div className="flex items-center gap-2 text-indigo-900 font-semibold text-sm">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span>Student Eligibility &amp; Branches</span>
                </div>
                {internship.eligibility && (
                  <p className="text-xs text-indigo-950 leading-relaxed">
                    <strong className="font-semibold">Criteria:</strong> {internship.eligibility}
                  </p>
                )}
                {internship.eligible_departments && (
                  <p className="text-xs text-indigo-950 leading-relaxed">
                    <strong className="font-semibold">Eligible Streams:</strong> {internship.eligible_departments}
                  </p>
                )}
              </div>
            )}

            {/* Role Overview */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-slate-900">About the Opportunity</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line font-normal">
                {internship.description}
              </p>
            </div>

            {/* Contact Information */}
            {(internship.contact_email || internship.contact_phone) && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Organizer Contact
                </h4>
                <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600">
                  {internship.contact_email && (
                    <a
                      href={`mailto:${internship.contact_email}`}
                      className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{internship.contact_email}</span>
                    </a>
                  )}
                  {internship.contact_phone && (
                    <a
                      href={`tel:${internship.contact_phone}`}
                      className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{internship.contact_phone}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {copied && <span className="text-emerald-600 font-medium">Link copied to clipboard!</span>}
            {!copied && <span>ID: <code className="font-mono">{internship.internship_id || internship.id}</code></span>}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {safeOfficialUrl && (
              <a
                href={safeOfficialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-full border border-slate-200 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Official Site</span>
              </a>
            )}

            {safeApplyUrl && deadlineStatus !== 'closed' ? (
              <a
                href={safeApplyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-7 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-full shadow-sm hover:shadow transition-all cursor-pointer active:scale-98"
              >
                <span>Apply on Official Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <button
                disabled
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-slate-200 text-slate-500 text-xs font-medium rounded-full cursor-not-allowed"
              >
                <span>Applications Closed</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
