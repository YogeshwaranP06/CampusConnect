import { CampusEvent, EventCategory, EventMode, EventStatus, OrganizerType, ParticipationType, EventLevel } from '../types/event';
import { isValidHttpUrl } from './driveUrl';

export const VALID_ORGANIZER_TYPES: OrganizerType[] = [
  'Our College',
  'Other College',
  'University',
  'Company',
  'Startup',
  'Government Organization',
  'Research Institution',
  'Professional Society',
  'Other',
];

export const VALID_EVENT_LEVELS: EventLevel[] = [
  'National',
  'International',
  'State Level',
  'College Level',
  'Inter-Collegiate',
];

export const VALID_CATEGORIES: EventCategory[] = [
  'Hackathons',
  'Symposiums',
  'Workshops',
  'Competitions',
  'Conferences',
  'Technical Events',
  'Cultural Events',
  'Career Opportunities',
  'Internships',
  'Training Programs',
  'Other',
];

export const SRM_TRP_DEPARTMENTS = [
  'B.E.-Civil Engineering',
  'B.E.-Computer Science and Engineering',
  'B.E.-Electronics and Communications Engineering',
  'B.E.-Electrical and Electronics Engineering',
  'B.E.-Mechanical Engineering',
  'B.E CSE (Artificial Intelligence and Machine Learning)',
  'B.Tech-Artificial Intelligence and Data Science',
  'B.Tech (Information Technology)',
] as const;

export type DepartmentName = typeof SRM_TRP_DEPARTMENTS[number];

export const VALID_MODES: EventMode[] = ['Online', 'Offline', 'Hybrid'];
export const VALID_STATUSES: EventStatus[] = ['Published', 'Draft', 'Archived', 'Cancelled'];
export const VALID_PARTICIPATION: ParticipationType[] = ['Individual', 'Team', 'Both'];

export interface ValidationErrorItem {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrorItem[];
  sanitized?: Partial<CampusEvent>;
}

/**
 * Validates a single event record (from spreadsheet row or payload)
 */
export function validateEventRecord(raw: Record<string, any>, rowNumber?: number): ValidationResult {
  const errors: ValidationErrorItem[] = [];

  // 1. Event ID
  let eventId = (raw.event_id || raw['Event ID'] || '').toString().trim();
  if (!eventId) {
    // Generate fallback event ID if absent
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    eventId = `CC-${new Date().getFullYear()}-${randomSuffix}`;
  } else if (eventId.length < 3) {
    errors.push({ field: 'event_id', message: 'Event ID must be at least 3 characters long.' });
  }

  // 2. Event Name
  const name = (raw.name || raw['Event Name'] || '').toString().trim();
  if (!name || name.length < 3) {
    errors.push({ field: 'name', message: 'Event Name is required (minimum 3 characters).' });
  }

  // 3. Organizer Name
  const organizerName = (raw.organizer_name || raw['Organizer Name'] || '').toString().trim();
  if (!organizerName) {
    errors.push({ field: 'organizer_name', message: 'Organizer Name is required.' });
  }

  // 4. Organizer Type
  const organizerTypeRaw = (raw.organizer_type || raw['Organizer Type'] || 'Other').toString().trim();
  const organizerType = VALID_ORGANIZER_TYPES.find(
    (t) => t.toLowerCase() === organizerTypeRaw.toLowerCase()
  ) || 'Other';

  // 5. Category
  const categoryRaw = (raw.category || raw['Category'] || 'Other').toString().trim();
  const matchedCategory = VALID_CATEGORIES.find(
    (c) => c.toLowerCase() === categoryRaw.toLowerCase()
  );
  if (!matchedCategory && categoryRaw) {
    errors.push({
      field: 'category',
      message: `Invalid category "${categoryRaw}". Must be one of: ${VALID_CATEGORIES.join(', ')}`,
    });
  }
  const category = matchedCategory || 'Other';

  // 6. Event Type
  const eventType = (raw.event_type || raw['Event Type'] || category).toString().trim();

  // 7. Description
  const description = (raw.description || raw['Description'] || '').toString().trim();

  // 8. Start Date
  const startDateRaw = (raw.start_date || raw['Start Date'] || '').toString().trim();
  if (!startDateRaw) {
    errors.push({ field: 'start_date', message: 'Start Date is required.' });
  } else {
    const parsedStart = Date.parse(startDateRaw);
    if (isNaN(parsedStart)) {
      errors.push({ field: 'start_date', message: `Invalid Start Date format: "${startDateRaw}". Use YYYY-MM-DD or standard ISO date.` });
    }
  }

  // 9. End Date
  const endDateRaw = (raw.end_date || raw['End Date'] || '').toString().trim();
  if (endDateRaw) {
    const parsedEnd = Date.parse(endDateRaw);
    if (isNaN(parsedEnd)) {
      errors.push({ field: 'end_date', message: `Invalid End Date format: "${endDateRaw}".` });
    } else if (startDateRaw) {
      const parsedStart = Date.parse(startDateRaw);
      if (!isNaN(parsedStart) && parsedEnd < parsedStart) {
        errors.push({ field: 'end_date', message: 'End Date cannot be earlier than Start Date.' });
      }
    }
  }

  // 10. Registration Deadline
  const deadlineRaw = (raw.registration_deadline || raw['Registration Deadline'] || '').toString().trim();
  if (deadlineRaw) {
    const parsedDeadline = Date.parse(deadlineRaw);
    if (isNaN(parsedDeadline)) {
      errors.push({ field: 'registration_deadline', message: `Invalid Registration Deadline format: "${deadlineRaw}".` });
    }
  }

  // 11. Mode
  const modeRaw = (raw.mode || raw['Mode'] || 'Offline').toString().trim();
  const matchedMode = VALID_MODES.find((m) => m.toLowerCase() === modeRaw.toLowerCase());
  if (!matchedMode) {
    errors.push({ field: 'mode', message: `Invalid mode "${modeRaw}". Must be Online, Offline, or Hybrid.` });
  }
  const mode = matchedMode || 'Offline';

  // 12. Location
  const location = (raw.location || raw['Location'] || (mode === 'Online' ? 'Online / Virtual Platform' : 'Campus Venue')).toString().trim();

  // 13. Registration Fee
  const feeRaw = raw.registration_fee !== undefined ? raw.registration_fee : raw['Registration Fee'];
  let fee = 0;
  if (feeRaw !== undefined && feeRaw !== null && feeRaw !== '') {
    const parsedFee = Number(feeRaw);
    if (isNaN(parsedFee) || parsedFee < 0) {
      errors.push({ field: 'registration_fee', message: 'Registration Fee must be a non-negative number.' });
    } else {
      fee = parsedFee;
    }
  }

  // 14. Eligibility
  const eligibility = (raw.eligibility || raw['Eligibility'] || 'Open to all college students').toString().trim();

  // 15. Eligible Departments
  const eligibleDepts = (raw.eligible_departments || raw['Eligible Departments'] || '').toString().trim();

  // 16. Participation Type
  const participationRaw = (raw.participation_type || raw['Participation Type'] || 'Individual').toString().trim();
  const matchedParticipation = VALID_PARTICIPATION.find((p) => p.toLowerCase() === participationRaw.toLowerCase()) || 'Individual';

  // 17 & 18. Min and Max Team Size
  const minTeamRaw = raw.min_team_size !== undefined ? raw.min_team_size : raw['Minimum Team Size'];
  const maxTeamRaw = raw.max_team_size !== undefined ? raw.max_team_size : raw['Maximum Team Size'];
  let minTeam: number | undefined = undefined;
  let maxTeam: number | undefined = undefined;

  if (minTeamRaw !== undefined && minTeamRaw !== null && minTeamRaw !== '') {
    const parsedMin = parseInt(minTeamRaw, 10);
    if (isNaN(parsedMin) || parsedMin < 1) {
      errors.push({ field: 'min_team_size', message: 'Minimum team size must be at least 1.' });
    } else {
      minTeam = parsedMin;
    }
  }

  if (maxTeamRaw !== undefined && maxTeamRaw !== null && maxTeamRaw !== '') {
    const parsedMax = parseInt(maxTeamRaw, 10);
    if (isNaN(parsedMax) || parsedMax < 1) {
      errors.push({ field: 'max_team_size', message: 'Maximum team size must be at least 1.' });
    } else {
      maxTeam = parsedMax;
    }
  }

  if (minTeam !== undefined && maxTeam !== undefined && minTeam > maxTeam) {
    errors.push({ field: 'team_size', message: 'Minimum team size cannot be greater than maximum team size.' });
  }

  // 19. Prize Information
  const prizePool = (raw.prize_pool || raw['Prize Information'] || '').toString().trim();

  // 20. Official URL
  const officialUrl = (raw.official_url || raw['Official Event URL'] || '').toString().trim();
  if (officialUrl && !isValidHttpUrl(officialUrl)) {
    errors.push({ field: 'official_url', message: 'Official Event URL must be a valid HTTP or HTTPS URL.' });
  }

  // 21. Registration URL (Required)
  const registrationUrl = (raw.registration_url || raw['Registration URL'] || '').toString().trim();
  if (!registrationUrl) {
    errors.push({ field: 'registration_url', message: 'Registration URL is mandatory.' });
  } else if (!isValidHttpUrl(registrationUrl)) {
    errors.push({ field: 'registration_url', message: 'Registration URL must be a valid HTTP or HTTPS URL (no unsafe schemes).' });
  }

  // 22. Banner URL
  const bannerUrl = (raw.banner_url || raw['Banner URL'] || '').toString().trim();
  if (bannerUrl && !isValidHttpUrl(bannerUrl)) {
    errors.push({ field: 'banner_url', message: 'Banner URL must be a valid HTTP or HTTPS URL.' });
  }

  // 23. Drive File Reference
  const driveRef = (raw.drive_file_ref || raw['Google Drive File Reference'] || '').toString().trim();

  // 24. Contact Email
  const contactEmail = (raw.contact_email || raw['Contact Email'] || '').toString().trim();
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    errors.push({ field: 'contact_email', message: 'Invalid Contact Email format.' });
  }

  // 25. Contact Phone
  const contactPhone = (raw.contact_phone || raw['Contact Phone'] || '').toString().trim();

  // 26. Status
  const statusRaw = (raw.status || raw['Status'] || 'Published').toString().trim();
  const matchedStatus = VALID_STATUSES.find((s) => s.toLowerCase() === statusRaw.toLowerCase());
  if (!matchedStatus) {
    errors.push({ field: 'status', message: `Invalid status "${statusRaw}". Must be Published, Draft, Archived, or Cancelled.` });
  }
  const status = matchedStatus || 'Draft';

  // 27. Featured
  const featuredRaw = raw.featured !== undefined ? raw.featured : raw['Featured'];
  let featured = false;
  if (typeof featuredRaw === 'boolean') {
    featured = featuredRaw;
  } else if (typeof featuredRaw === 'string') {
    const lower = featuredRaw.toLowerCase().trim();
    featured = lower === 'true' || lower === 'yes' || lower === '1';
  }

  // 28. Last Updated
  const lastUpdatedRaw = (raw.last_updated || raw['Last Updated'] || '').toString().trim();
  const lastUpdated = lastUpdatedRaw || new Date().toISOString();

  // Event Level (National, International, State Level, College Level)
  const rawLevel = (raw.level || raw['Event Level'] || raw['Level'] || '').toString().trim();
  let matchedLevel: EventLevel | undefined = VALID_EVENT_LEVELS.find(
    (lvl) => lvl.toLowerCase() === rawLevel.toLowerCase()
  );
  if (!matchedLevel) {
    const text = `${name} ${description}`.toLowerCase();
    if (text.includes('international') || text.includes('worldwide') || text.includes('global')) {
      matchedLevel = 'International';
    } else if (text.includes('state') || text.includes('inter-collegiate')) {
      matchedLevel = 'State Level';
    } else if (text.includes('intra') || text.includes('our college')) {
      matchedLevel = 'College Level';
    } else {
      matchedLevel = 'National';
    }
  }

  const sanitized: Partial<CampusEvent> = {
    event_id: eventId,
    name,
    organizer_name: organizerName,
    organizer_type: organizerType,
    category,
    level: matchedLevel,
    event_type: eventType,
    description,
    start_date: startDateRaw,
    end_date: endDateRaw || undefined,
    registration_deadline: deadlineRaw || undefined,
    mode,
    location,
    registration_fee: fee,
    eligibility,
    eligible_departments: eligibleDepts || undefined,
    participation_type: matchedParticipation,
    min_team_size: minTeam,
    max_team_size: maxTeam,
    prize_pool: prizePool || undefined,
    official_url: officialUrl || undefined,
    registration_url: registrationUrl,
    banner_url: bannerUrl || undefined,
    drive_file_ref: driveRef || undefined,
    contact_email: contactEmail || undefined,
    contact_phone: contactPhone || undefined,
    status,
    featured,
    last_updated: lastUpdated,
    source_row_id: rowNumber,
  };

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
}
