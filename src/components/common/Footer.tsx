import React, { useState } from 'react';
import { Sheet, FileSpreadsheet, HelpCircle, CheckCircle2 } from 'lucide-react';
import { getDataSourceStatus } from '../../services/eventService';
import { DataSourceSetupModal } from './DataSourceSetupModal';

interface FooterProps {
  onNavigate: (view: 'home' | 'events' | 'internships' | 'core' | 'saved', category?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const status = getDataSourceStatus();

  return (
    <>
      <footer className="bg-[#19191c] text-[#a8a5a0] border-t border-[#2a292e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand & Mission */}
            <div className="space-y-4 md:col-span-1">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#a81c24] shrink-0" />
                  <h3 className="font-display text-2xl font-light tracking-tight text-white">
                    CampusConnect
                  </h3>
                </div>
                <span className="block text-[10px] tracking-wider uppercase font-semibold text-[#ddaa61] pl-4.5 mt-0.5">
                  SRM TRP Engineering College
                </span>
              </div>
              <p className="text-sm text-[#a8a5a0] leading-relaxed font-normal">
                The open student discovery portal for collegiate symposiums, hackathons, workshops, technical competitions, and career programs.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center gap-2 text-xs text-[#a8a5a0]">
                  <Sheet className="w-3.5 h-3.5 text-[#5c6f5d] shrink-0" />
                  <span>Google Sheets Master Source</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#a8a5a0]">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#ddaa61] shrink-0" />
                  <span>Google Apps Script Read-Only API</span>
                </div>
              </div>
            </div>

            {/* Quick Discovery */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#ddaa61]">
                Discover Events
              </h4>
              <ul className="space-y-2.5 text-sm text-[#a8a5a0]">
                <li>
                  <button
                    onClick={() => onNavigate('events', 'Hackathons')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Hackathons & Build Sprints
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('events', 'Symposiums')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Technical Symposiums
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('events', 'Workshops')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Hands-on Workshops
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('core')}
                    className="hover:text-[#ddaa61] text-white font-medium transition-colors cursor-pointer text-left"
                  >
                    Core Engineering Challenges
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('events', 'Competitions')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Competitions & Expos
                  </button>
                </li>
              </ul>
            </div>

            {/* Opportunities & Internships */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#ddaa61]">
                Internships & Careers
              </h4>
              <ul className="space-y-2.5 text-sm text-[#a8a5a0]">
                <li>
                  <button
                    onClick={() => onNavigate('internships')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Paid Research Fellowships
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('internships')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Summer & Industrial Internships
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('internships')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Corporate Training Programs
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('events', 'Cultural Events')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Cultural Festivals & Arts
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('events', 'Technical Events')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Webinars & Keynotes
                  </button>
                </li>
              </ul>
            </div>

            {/* Architecture & Google Sheets Info */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#ddaa61]">
                Event Coordination System
              </h4>
              <p className="text-xs text-[#a8a5a0] leading-relaxed font-normal">
                Authorized student event coordinators manage master records directly in Google Sheets. Published entries stream to students via read-only Apps Script without exposing credentials.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSetupModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#242429] hover:bg-[#1a4ca1] rounded-full border border-[#38373d] hover:border-[#1a4ca1] transition-all cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#ddaa61]" />
                  <span>
                    {status.isConfigured ? 'Google Sheets: Live' : 'Integration Guide & Status'}
                  </span>
                </button>
              </div>
              <div className="text-[11px] text-[#838280] pt-1">
                Student privacy guaranteed: No login or student credentials required.
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-14 pt-8 border-t border-[#2a292e] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#838280]">
            <p>
              © {new Date().getFullYear()} CampusConnect · SRM TRP Engineering College. All rights belong to respective institutions.
            </p>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[11px]">
                {status.isConfigured ? 'Live Google Sheets Feed' : 'Demo Dataset Mode'}
              </span>
              <span>·</span>
              <span>Open Student Access</span>
            </div>
          </div>
        </div>
      </footer>

      <DataSourceSetupModal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
      />
    </>
  );
};
