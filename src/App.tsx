import React, { useState, useEffect } from 'react';
import { CampusEvent } from './types/event';
import { getPublicPublishedEvents, getSavedEventIds, toggleSavedEventId } from './services/eventService';
import { Navbar, NavViewType } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { StudentHome } from './components/student/StudentHome';
import { ExploreEvents } from './components/student/ExploreEvents';
import { OpportunitiesView } from './components/student/OpportunitiesView';
import { SavedEventsView } from './components/student/SavedEventsView';
import { EventDetailsModal } from './components/student/EventDetailsModal';

export type AppView = NavViewType;

export default function App() {
  // Navigation & View Routing State: Home, Events, Internships, Core Events, Saved
  const [activeView, setActiveView] = useState<AppView>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedOrganizerType, setSelectedOrganizerType] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Public Data State
  const [publicEvents, setPublicEvents] = useState<CampusEvent[]>([]);
  const [selectedModalEvent, setSelectedModalEvent] = useState<CampusEvent | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);

  // Load Published Events for Student Discovery
  const reloadData = () => {
    setIsDataLoading(true);
    getPublicPublishedEvents()
      .then((res) => {
        setPublicEvents(res.events);
        setIsDataLoading(false);
      })
      .catch((err) => {
        console.error('Failed loading public events:', err);
        setIsDataLoading(false);
      });

    setSavedIds(getSavedEventIds());
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Hash Routing Listener for URL sharing (#events, #internships, #core, #saved)
  useEffect(() => {
    const handleHash = () => {
      const fullHash = window.location.hash.replace('#', '');
      const [viewPart, queryPart] = fullHash.split('?');
      const params = new URLSearchParams(queryPart || '');
      const cat = params.get('cat') || undefined;
      const org = params.get('org') || undefined;
      const q = params.get('q') || '';

      if (viewPart.startsWith('events') || viewPart.startsWith('explore')) {
        setActiveView('events');
        setSelectedCategory(cat);
        setSelectedOrganizerType(org);
        setSearchQuery(q);
      } else if (viewPart.startsWith('internships') || viewPart.startsWith('opportunities')) {
        setActiveView('internships');
      } else if (viewPart.startsWith('core')) {
        setActiveView('core');
        setSelectedCategory(cat);
        setSelectedOrganizerType(org);
        setSearchQuery(q);
      } else if (viewPart.startsWith('saved')) {
        setActiveView('saved');
      } else {
        setActiveView('home');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleNavigate = (view: AppView, category?: string, organizerType?: string) => {
    setActiveView(view);
    setSelectedCategory(category);
    setSelectedOrganizerType(organizerType);
    if (view === 'events' || view === 'core') {
      const params = new URLSearchParams();
      if (category) params.set('cat', category);
      if (organizerType) params.set('org', organizerType);
      const str = params.toString();
      window.location.hash = str ? `${view}?${str}` : view;
    } else {
      window.location.hash = view === 'home' ? '' : view;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHeroSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedCategory(undefined);
    setSelectedOrganizerType(undefined);
    setActiveView('events');
    window.location.hash = `events?q=${encodeURIComponent(query)}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleSave = (eventId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    toggleSavedEventId(eventId);
    setSavedIds(getSavedEventIds());
  };

  // Related events for modal
  const relatedEvents = selectedModalEvent
    ? publicEvents.filter(
        (e) => e.id !== selectedModalEvent.id && e.category === selectedModalEvent.category
      )
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC] text-[#111827] selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar: Student Navigation & Database Status */}
      <Navbar
        activeView={activeView}
        onNavigate={handleNavigate}
        savedCount={savedIds.length}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeView === 'home' && (
          <StudentHome
            events={publicEvents}
            onSelectEvent={setSelectedModalEvent}
            onNavigate={handleNavigate}
            onSearch={handleHeroSearch}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
          />
        )}

        {activeView === 'events' && (
          <ExploreEvents
            initialCategory={selectedCategory}
            initialOrganizerType={selectedOrganizerType}
            initialQuery={searchQuery}
            isCoreOnly={false}
            onSelectEvent={setSelectedModalEvent}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
          />
        )}

        {activeView === 'internships' && (
          <OpportunitiesView
            events={publicEvents}
            onSelectEvent={setSelectedModalEvent}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
          />
        )}

        {activeView === 'core' && (
          <ExploreEvents
            initialCategory={selectedCategory}
            initialOrganizerType={selectedOrganizerType}
            initialQuery={searchQuery}
            isCoreOnly={true}
            onSelectEvent={setSelectedModalEvent}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
          />
        )}

        {activeView === 'saved' && (
          <SavedEventsView
            events={publicEvents}
            savedIds={savedIds}
            onSelectEvent={setSelectedModalEvent}
            onToggleSave={handleToggleSave}
            onExploreEvents={() => handleNavigate('events')}
          />
        )}
      </main>

      {/* Global Event Details Modal */}
      <EventDetailsModal
        event={selectedModalEvent}
        onClose={() => setSelectedModalEvent(null)}
        isSaved={selectedModalEvent ? savedIds.includes(selectedModalEvent.id) : false}
        onToggleSave={(id) => handleToggleSave(id)}
        relatedEvents={relatedEvents}
        onSelectRelated={(ev) => setSelectedModalEvent(ev)}
      />

      {/* Public Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
