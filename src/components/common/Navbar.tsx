import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  Bookmark, 
  Cpu
} from 'lucide-react';

export type NavViewType = 'home' | 'events' | 'internships' | 'core' | 'saved';

interface NavbarProps {
  activeView: NavViewType;
  onNavigate: (view: NavViewType, category?: string) => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeView, onNavigate, savedCount }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (view: NavViewType, category?: string) => {
    onNavigate(view, category);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-6 h-18">
            {/* SRM TRP Engineering College Logo */}
            <div className="flex items-center shrink-0">
              <button
                onClick={() => handleNavClick('home')}
                className="flex items-center text-left group cursor-pointer focus-visible:outline-none"
                aria-label="SRM TRP Engineering College Home"
              >
                <img
                  src="/srm-trp-logo.png"
                  alt="SRM TRP Engineering College"
                  className="h-10 sm:h-11 w-auto object-contain shrink-0"
                />
              </button>
            </div>

            {/* Navigation Links in Muted Slate (#475569) */}
            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#475569]">
              <button
                onClick={() => handleNavClick('home')}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${activeView === 'home'
                    ? 'text-indigo-600 font-semibold'
                    : 'hover:text-[#111827]'
                  }`}
              >
                Home
              </button>
              <button
                onClick={() => handleNavClick('events')}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${activeView === 'events'
                    ? 'text-indigo-600 font-semibold'
                    : 'hover:text-[#111827]'
                  }`}
              >
                Contests
              </button>
              <button
                onClick={() => handleNavClick('internships')}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${activeView === 'internships'
                    ? 'text-indigo-600 font-semibold'
                    : 'hover:text-[#111827]'
                  }`}
              >
                Internships
              </button>
              <button
                onClick={() => handleNavClick('core')}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'core'
                    ? 'text-indigo-600 font-semibold'
                    : 'hover:text-[#111827]'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Contest + Internship</span>
              </button>
              <button
                onClick={() => handleNavClick('saved')}
                className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
                  activeView === 'saved'
                    ? 'text-indigo-600 font-semibold'
                    : 'hover:text-[#111827]'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Saved</span>
                {savedCount > 0 && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-100 text-[#111827] font-semibold border border-slate-200">
                    {savedCount}
                  </span>
                )}
              </button>
            </nav>

            {/* Mobile hamburger button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => handleNavClick('saved')}
                className="p-2 text-[#475569] hover:text-[#111827]"
                aria-label="View Saved Contests"
              >
                <Bookmark className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-[#475569] hover:bg-slate-100 focus:outline-none"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
            <button
              onClick={() => handleNavClick('home')}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${activeView === 'home' ? 'bg-slate-100 text-indigo-600 font-semibold' : 'text-[#475569]'
                }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('events')}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${activeView === 'events' ? 'bg-slate-100 text-indigo-600 font-semibold' : 'text-[#475569]'
                }`}
            >
              Contests
            </button>
            <button
              onClick={() => handleNavClick('internships')}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${activeView === 'internships' ? 'bg-slate-100 text-indigo-600 font-semibold' : 'text-[#475569]'
                }`}
            >
              Internships
            </button>
            <button
              onClick={() => handleNavClick('core')}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                activeView === 'core' ? 'bg-slate-100 text-indigo-600 font-semibold' : 'text-[#475569]'
              }`}
            >
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>Contest + Internship</span>
            </button>
            <button
              onClick={() => handleNavClick('saved')}
              className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium ${
                activeView === 'saved' ? 'bg-slate-100 text-indigo-600 font-semibold' : 'text-[#475569]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#64748b]" />
                <span>Saved Contests</span>
              </span>
              <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded-full text-[#111827]">
                {savedCount}
              </span>
            </button>
          </div>
        )}
      </header>
    </>
  );
};
