export type OrganizerType =
  | 'Our College'
  | 'Other College'
  | 'University'
  | 'Company'
  | 'Startup'
  | 'Government Organization'
  | 'Research Institution'
  | 'Professional Society'
  | 'Other';

export type EventCategory =
  | 'Hackathons'
  | 'Symposiums'
  | 'Workshops'
  | 'Competitions'
  | 'Conferences'
  | 'Technical Events'
  | 'Cultural Events'
  | 'Career Opportunities'
  | 'Internships'
  | 'Training Programs'
  | 'Other';

export type EventMode = 'Online' | 'Offline' | 'Hybrid';

export type EventStatus = 'Published' | 'Draft' | 'Archived' | 'Cancelled';

export type ParticipationType = 'Individual' | 'Team' | 'Both';

export type EventLevel = 'National' | 'International' | 'State Level' | 'College Level' | 'Inter-Collegiate';

export interface CampusEvent {
  // Database internal ID
  id: string;

  // 28 Google Sheet Columns + Level Classification
  event_id: string; // Col 1: Unique stable identifier (e.g., CC-2026-001)
  name: string; // Col 2: Event Name
  organizer_name: string; // Col 3: Organizer Name
  organizer_type: OrganizerType; // Col 4: Organizer Type
  category: EventCategory; // Col 5: Category
  level?: EventLevel; // Event Scale: National, International, State Level, College Level
  event_type: string; // Col 6: Event Type (e.g. Technical, Hackathon, Expo)
  description: string; // Col 7: Description
  start_date: string; // Col 8: Start Date (ISO YYYY-MM-DD or YYYY-MM-DDTHH:mm)
  end_date?: string; // Col 9: End Date
  registration_deadline?: string; // Col 10: Registration Deadline
  mode: EventMode; // Col 11: Mode (Online, Offline, Hybrid)
  location: string; // Col 12: Venue / City / Platform
  registration_fee: number; // Col 13: Registration Fee (0 for Free)
  eligibility: string; // Col 14: Eligibility (e.g., All UG/PG students)
  eligible_departments?: string; // Col 15: Eligible Departments
  participation_type: ParticipationType; // Col 16: Participation Type
  min_team_size?: number; // Col 17: Min Team Size
  max_team_size?: number; // Col 18: Max Team Size
  prize_pool?: string; // Col 19: Prize Information
  official_url?: string; // Col 20: Official Website URL
  registration_url: string; // Col 21: Official Registration URL
  banner_url?: string; // Col 22: Direct Poster Image URL
  drive_file_ref?: string; // Col 23: Google Drive File Link / ID
  contact_email?: string; // Col 24: Contact Email
  contact_phone?: string; // Col 25: Contact Phone
  status: EventStatus; // Col 26: Status (Published, Draft, Archived, Cancelled)
  featured: boolean; // Col 27: Featured (true/false)
  last_updated?: string; // Col 28: Last Updated from sheet

  // System timestamps & tracking
  source_row_id?: number;
  synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EventFilterState {
  searchQuery: string;
  category: string;
  organizerType: string;
  level: string; // 'all' | 'National' | 'International' | 'State Level' | 'College Level'
  mode: string;
  feeType: 'all' | 'free' | 'paid';
  dateFilter: 'all' | 'upcoming' | 'this_week' | 'this_month' | 'past';
  deadlineFilter: 'all' | 'open' | 'closing_soon';
  sortBy: 'upcoming' | 'deadline' | 'recently_added' | 'name_asc';
  featuredOnly: boolean;
  coreOnly?: boolean;
}
