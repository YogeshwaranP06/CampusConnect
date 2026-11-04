export interface CampusInternship {
  id: string;
  internship_id: string; // Col 2: Unique stable identifier (e.g., INT-2026-001)
  event_slug?: string; // Col 1: Optional slug
  name: string; // Col 3: Internship / Role Title
  organizer_name: string; // Col 4: Company / Organization Name
  organizer_type: string; // Col 5: Company, Startup, Research Institution, etc.
  category: string; // Col 6: Internships, Research Fellowships, Industrial Training, etc.
  level?: string; // Col 7: National, International, State Level, College Level
  internship_type: string; // Col 8: Summer Internship, 6-Month Paid, R&D Fellowship, etc.
  description: string; // Col 9: Full Job / Internship Description

  start_date?: string; // Col 10: Start Date (ISO or readable string)
  end_date?: string; // Col 11: End Date
  application_deadline?: string; // Col 12: Application Deadline

  mode: string; // Col 13: Online, Offline, Hybrid
  location: string; // Col 14: City, Office / Campus Venue / Remote

  registration_fee?: number; // Col 15: Application / Registration Fee (0 for Free)
  fee_amount?: number; // Col 16: Raw fee amount
  fee_type?: string; // Col 17: Free or Paid

  department?: string; // Col 18: Primary Department
  tags?: string[] | string; // Col 19: Skills, Technologies, Keywords
  eligibility: string; // Col 20: Target batch, degree, CGPA criteria
  eligible_departments: string; // Col 21: Eligible branches / disciplines

  participation_type: string; // Col 22: Individual or Team
  min_team_size?: number; // Col 23
  max_team_size?: number; // Col 24
  max_participants?: number; // Col 25

  stipend_amount?: number | string; // Col 26: Stipend value (e.g., 15000, "15,000/mo")
  stipend_details?: string; // Col 27: Full stipend description (e.g., "₹15,000/month + PPO")

  official_url?: string; // Col 28: Company / Official Website URL
  application_url?: string; // Col 29: Direct Application / Google Form URL
  has_valid_application_url?: boolean;

  banner_url?: string; // Col 30: Direct Poster Image URL
  drive_file_ref?: string; // Col 31: Google Drive File Link / ID
  contact_email?: string; // Col 32: Contact Email
  contact_phone?: string; // Col 33: Contact Phone

  status: string; // Col 34: Published, Draft, Archived, Cancelled
  featured: boolean; // Col 35: true / false
  last_updated?: string; // Col 36: Last Updated timestamp

  source_row_id?: number | string; // Col 37: Row index
  created_at?: string; // Col 38: Created timestamp
  updated_at?: string; // Col 39: Updated timestamp
}

export interface InternshipFilterState {
  searchQuery: string;
  category: string; // 'all' | 'Internships' | 'Research Fellowships' | 'Industrial Training'
  department: string; // 'all' | Specific department name
  mode: string; // 'all' | 'Online' | 'Offline' | 'Hybrid'
  stipendType: 'all' | 'paid' | 'unpaid';
  sortBy: 'deadline' | 'recently_added' | 'name_asc';
}

export interface InternshipFetchResult {
  internships: CampusInternship[];
  totalCount: number;
  dataSource: 'api_proxy' | 'apps_script' | 'empty';
  isDemo: boolean;
  isStale?: boolean;
  error?: string | null;
}

