import React, { useState } from 'react';
import { resolveEventPosterUrl } from '../../utils/driveUrl';
import { EventCategory } from '../../types/event';
import { 
  Code2, 
  Presentation, 
  Wrench, 
  Trophy, 
  BookOpen, 
  Cpu, 
  Sparkles, 
  Briefcase, 
  GraduationCap, 
  Lightbulb, 
  Calendar 
} from 'lucide-react';

interface EventPosterProps {
  bannerUrl?: string;
  driveRef?: string;
  category: EventCategory;
  name: string;
  className?: string;
  aspectRatio?: 'video' | 'square' | 'wide' | 'auto';
}

const CATEGORY_STYLES: Record<
  EventCategory,
  { bgGradient: string; accentColor: string; icon: React.ComponentType<{ className?: string }> }
> = {
  Hackathons: {
    bgGradient: 'from-indigo-900 via-slate-900 to-blue-950',
    accentColor: 'text-indigo-400',
    icon: Code2,
  },
  Symposiums: {
    bgGradient: 'from-blue-900 via-slate-900 to-cyan-950',
    accentColor: 'text-cyan-400',
    icon: Presentation,
  },
  Workshops: {
    bgGradient: 'from-emerald-950 via-slate-900 to-teal-950',
    accentColor: 'text-emerald-400',
    icon: Wrench,
  },
  Competitions: {
    bgGradient: 'from-amber-950 via-slate-900 to-yellow-950',
    accentColor: 'text-amber-400',
    icon: Trophy,
  },
  Conferences: {
    bgGradient: 'from-slate-900 via-slate-800 to-zinc-900',
    accentColor: 'text-blue-300',
    icon: BookOpen,
  },
  'Technical Events': {
    bgGradient: 'from-blue-950 via-slate-900 to-sky-950',
    accentColor: 'text-sky-400',
    icon: Cpu,
  },
  'Cultural Events': {
    bgGradient: 'from-rose-950 via-slate-900 to-pink-950',
    accentColor: 'text-rose-400',
    icon: Sparkles,
  },
  'Career Opportunities': {
    bgGradient: 'from-slate-900 via-blue-950 to-indigo-950',
    accentColor: 'text-indigo-300',
    icon: Briefcase,
  },
  Internships: {
    bgGradient: 'from-teal-950 via-slate-900 to-emerald-950',
    accentColor: 'text-teal-300',
    icon: GraduationCap,
  },
  'Training Programs': {
    bgGradient: 'from-slate-900 via-slate-900 to-stone-900',
    accentColor: 'text-amber-300',
    icon: Lightbulb,
  },
  Other: {
    bgGradient: 'from-slate-900 via-slate-800 to-slate-950',
    accentColor: 'text-slate-400',
    icon: Calendar,
  },
};

export const EventPoster: React.FC<EventPosterProps> = ({
  bannerUrl,
  driveRef,
  category,
  name,
  className = '',
  aspectRatio = 'video',
}) => {
  const [imageError, setImageError] = useState(false);
  const resolvedUrl = resolveEventPosterUrl(bannerUrl, driveRef);

  const styleConfig = CATEGORY_STYLES[category] || CATEGORY_STYLES['Other'];
  const IconComponent = styleConfig.icon;

  const aspectClass =
    aspectRatio === 'video'
      ? 'aspect-video'
      : aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'wide'
      ? 'aspect-[21/9]'
      : '';

  if (resolvedUrl && !imageError) {
    return (
      <div className={`relative overflow-hidden bg-slate-900 ${aspectClass} ${className}`}>
        <img
          src={resolvedUrl}
          alt={`${name} poster`}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Resilient Styled Fallback Container (Zero-Broken-Image Policy)
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${styleConfig.bgGradient} ${aspectClass} ${className} flex flex-col justify-between p-5 border border-slate-800/80 text-white select-none`}
    >
      {/* Subtle geometric pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Top headroom spacer for card action badges (Featured & Bookmark) */}
      <div className="h-6" aria-hidden="true" />

      <div className="relative z-10 my-auto py-1">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-md bg-white/10 border border-white/10 ${styleConfig.accentColor} shrink-0`}>
            <IconComponent className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-300">
            {category}
          </span>
        </div>
        <p className="text-base font-semibold leading-snug line-clamp-2 text-white/95">
          {name}
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-2.5">
        <span className="tracking-wide">Official Event Poster</span>
        <span className="font-mono text-[11px] text-slate-400">CampusConnect</span>
      </div>
    </div>
  );
};
