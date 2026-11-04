/**
 * ============================================================================
 * CAMPUSCONNECT — GOOGLE APPS SCRIPT READ-ONLY EVENT API
 * ============================================================================
 *
 * This script turns your Google Sheet into a fast, read-only, secure JSON API
 * for the CampusConnect student-facing website.
 *
 * PRIVACY & SECURITY:
 * - Only rows with Status === 'Published' are exposed to the public API.
 * - Draft, Archived, and Cancelled events are strictly excluded.
 * - Only approved public columns are returned; any internal team notes,
 *   reviewer comments, or budget data columns are stripped.
 * - No API keys, credentials, or write privileges are required on the frontend.
 *
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Open your Google Sheet -> Click Extensions -> Apps Script.
 * 2. Replace all existing code with this file.
 * 3. Click "Deploy" (top right) -> "New deployment".
 * 4. Choose type: "Web app".
 * 5. Set configuration:
 *      - Description: "CampusConnect Read-Only Events API"
 *      - Execute as: "Me" (your Google account)
 *      - Who has access: "Anyone" (allows public read-only access for students)
 * 6. Click "Deploy", authorize permissions when prompted, and copy the Web app URL.
 * 7. Paste the URL into your project's .env file as:
 *      VITE_APPS_SCRIPT_URL="https://script.google.com/macros/s/.../exec"
 */

const CONFIG = {
  SHEET_NAME: "Events",
  INTERNSHIP_SHEET_NAME: "Internship",
  HEADER_ROW: 1,
  DATA_START_ROW: 2,
};

/**
 * HTTP GET Web Endpoint
 * Handles GET requests from the CampusConnect frontend and returns JSON.
 * Query Parameters:
 *   - ?type=events (default) -> returns Published events from Events tab
 *   - ?type=internships      -> returns Published internships from Internship tab
 *   - ?type=all              -> returns both datasets separately
 */
function doGet(e) {
  try {
    const typeParam = (e && e.parameter && e.parameter.type ? e.parameter.type : "events").toString().trim().toLowerCase();

    if (typeParam === "internships" || typeParam === "internship") {
      const internships = getPublishedInternships();
      const responsePayload = {
        status: "success",
        count: internships.length,
        data: internships,
        generated_at: new Date().toISOString(),
      };
      return ContentService.createTextOutput(JSON.stringify(responsePayload))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (typeParam === "all") {
      const events = getPublishedEvents();
      const internships = getPublishedInternships();
      const responsePayload = {
        status: "success",
        count_events: events.length,
        count_internships: internships.length,
        events: events,
        internships: internships,
        generated_at: new Date().toISOString(),
      };
      return ContentService.createTextOutput(JSON.stringify(responsePayload))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Default: ?type=events
    const events = getPublishedEvents();
    const responsePayload = {
      status: "success",
      count: events.length,
      data: events,
      generated_at: new Date().toISOString(),
    };

    return ContentService.createTextOutput(JSON.stringify(responsePayload))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    const errorPayload = {
      status: "error",
      message: error.toString(),
      data: [],
    };

    return ContentService.createTextOutput(JSON.stringify(errorPayload))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Core Reader: Fetches, validates, sanitizes, and filters only Published events.
 */
function getPublishedEvents() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getSheets()[0];

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow < CONFIG.DATA_START_ROW) {
    return [];
  }

  // Read headers and all data rows in bulk for high performance
  const headerValues = sheet.getRange(CONFIG.HEADER_ROW, 1, 1, lastCol).getValues()[0];
  const dataRange = sheet.getRange(CONFIG.DATA_START_ROW, 1, lastRow - (CONFIG.DATA_START_ROW - 1), lastCol);
  const rows = dataRange.getValues();

  // Create header lookup map (case-insensitive and trimmed)
  const headerMap = {};
  headerValues.forEach((header, index) => {
    if (header) {
      headerMap[header.toString().trim().toLowerCase()] = index;
    }
  });

  const getColValue = (row, ...candidateNames) => {
    for (let name of candidateNames) {
      const idx = headerMap[name.toLowerCase()];
      if (idx !== undefined && idx >= 0) {
        return row[idx];
      }
    }
    return "";
  };

  const eventsById = new Map();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + CONFIG.DATA_START_ROW;

    // Check if entire row is empty
    const isBlank = row.every(val => val === "" || val === null || val === undefined);
    if (isBlank) continue;

    // 1. Strict status check: MUST be 'Published'
    const statusRaw = (getColValue(row, "Status", "Event Status") || "").toString().trim();
    if (statusRaw.toLowerCase() !== "published") {
      // Exclude Drafts, Archived, Cancelled, and empty status rows
      continue;
    }

    // 2. Validate required student fields (do not discard valid events just because registration URL is pending)
    const name = (getColValue(row, "Event Name", "name", "Title") || "").toString().trim();
    const rawRegUrl = (getColValue(row, "Registration URL", "registration_url", "Register Link") || "").toString().trim();
    const rawOfficialUrl = (getColValue(row, "Official Event URL", "official_url", "Website") || "").toString().trim();
    const startDateRaw = getColValue(row, "Start Date", "start_date", "Date");

    if (!name || name.length < 2 || !startDateRaw) {
      // Skip empty or severely malformed rows
      continue;
    }

    // 3. Format dates safely to ISO strings and check consistency
    const parseDateSafe = (val) => {
      if (!val) return null;
      if (val instanceof Date && !isNaN(val.getTime())) {
        return val;
      }
      const parsed = new Date(val);
      return !isNaN(parsed.getTime()) ? parsed : null;
    };

    const parsedStart = parseDateSafe(startDateRaw);
    const startDate = parsedStart ? parsedStart.toISOString() : new Date().toISOString();
    const parsedEnd = parseDateSafe(getColValue(row, "End Date", "end_date"));
    const endDate = parsedEnd ? parsedEnd.toISOString() : undefined;
    const parsedDeadline = parseDateSafe(getColValue(row, "Registration Deadline", "registration_deadline", "Deadline"));
    const regDeadline = parsedDeadline ? parsedDeadline.toISOString() : undefined;

    const dateWarnings = [];
    if (parsedStart && parsedDeadline && parsedDeadline.getTime() > parsedStart.getTime()) {
      dateWarnings.push("Registration deadline is scheduled after the event start date.");
    }
    if (parsedStart && parsedEnd && parsedEnd.getTime() < parsedStart.getTime()) {
      dateWarnings.push("End date is scheduled earlier than the event start date.");
    }

    // 4. Validate registration & official URLs (accept HTTP/HTTPS; reject dead #)
    const isValidHttpUrl = (url) => {
      if (!url || typeof url !== "string") return false;
      const trimmed = url.trim();
      return (trimmed.indexOf("http://") === 0 || trimmed.indexOf("https://") === 0) && trimmed !== "#";
    };

    const hasValidRegUrl = isValidHttpUrl(rawRegUrl);
    const registrationUrl = hasValidRegUrl ? rawRegUrl : "";
    const officialUrl = isValidHttpUrl(rawOfficialUrl) ? rawOfficialUrl : undefined;

    // 5. Stable Event ID
    let eventId = (getColValue(row, "Event ID", "event_id", "ID") || "").toString().trim();
    if (!eventId) {
      eventId = "CC-" + new Date().getFullYear() + "-" + ("000" + rowNumber).slice(-4);
    }

    // 6. Registration fee normalization (number, 0 for free)
    const feeRaw = getColValue(row, "Registration Fee", "registration_fee", "Fee");
    let registrationFee = 0;
    if (feeRaw !== "" && feeRaw !== null && feeRaw !== undefined) {
      const parsedFee = parseFloat(feeRaw.toString().replace(/[^0-9.]/g, ""));
      if (!isNaN(parsedFee)) {
        registrationFee = parsedFee;
      }
    }

    // 7. Featured boolean
    const featuredRaw = getColValue(row, "Featured", "featured");
    const isFeatured = featuredRaw === true || 
                       String(featuredRaw).trim().toLowerCase() === "true" || 
                       String(featuredRaw).trim().toLowerCase() === "yes" || 
                       String(featuredRaw).trim() === "1";

    // 8. Team sizes
    const minSizeRaw = parseInt(getColValue(row, "Minimum Team Size", "min_team_size", "Min Team Size"), 10);
    const maxSizeRaw = parseInt(getColValue(row, "Maximum Team Size", "max_team_size", "Max Team Size"), 10);

    const lastUpdatedDate = parseDateSafe(getColValue(row, "Last Updated", "last_updated"));
    const lastUpdated = lastUpdatedDate ? lastUpdatedDate.toISOString() : new Date().toISOString();

    // 9. Construct clean, whitelisted public student event object
    const event = {
      id: "apps-script-" + eventId.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
      event_id: eventId,
      name: name,
      organizer_name: (getColValue(row, "Organizer Name", "organizer_name", "Host") || "College Department").toString().trim(),
      organizer_type: (getColValue(row, "Organizer Type", "organizer_type") || "Our College").toString().trim(),
      category: (getColValue(row, "Category", "category") || "Technical Events").toString().trim(),
      level: (getColValue(row, "Level", "level", "Event Level") || "National").toString().trim(),
      event_type: (getColValue(row, "Event Type", "event_type") || "Event").toString().trim(),
      description: (getColValue(row, "Description", "description") || "").toString().trim(),
      start_date: startDate,
      end_date: endDate,
      registration_deadline: regDeadline,
      date_warnings: dateWarnings.length > 0 ? dateWarnings : undefined,
      mode: (getColValue(row, "Mode", "mode") || "Offline").toString().trim(),
      location: (getColValue(row, "Location", "location", "Venue") || "Campus Venue").toString().trim(),
      registration_fee: registrationFee,
      eligibility: (getColValue(row, "Eligibility", "eligibility") || "All undergraduate and postgraduate students").toString().trim(),
      eligible_departments: (getColValue(row, "Eligible Departments", "eligible_departments") || "All Departments").toString().trim(),
      participation_type: (getColValue(row, "Participation Type", "participation_type") || "Individual").toString().trim(),
      min_team_size: !isNaN(minSizeRaw) ? minSizeRaw : undefined,
      max_team_size: !isNaN(maxSizeRaw) ? maxSizeRaw : undefined,
      prize_pool: (getColValue(row, "Prize Information", "prize_pool", "Prizes") || "").toString().trim() || undefined,
      official_url: officialUrl,
      registration_url: registrationUrl,
      has_valid_registration_url: hasValidRegUrl,
      banner_url: (getColValue(row, "Banner URL", "banner_url", "Poster URL") || "").toString().trim() || undefined,
      drive_file_ref: (getColValue(row, "Google Drive File Reference", "drive_file_ref", "Drive Link") || "").toString().trim() || undefined,
      contact_email: (getColValue(row, "Contact Email", "contact_email") || "").toString().trim() || undefined,
      contact_phone: (getColValue(row, "Contact Phone", "contact_phone") || "").toString().trim() || undefined,
      status: "Published",
      featured: isFeatured,
      last_updated: lastUpdated,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 10. Deduplicate by normalized event_id (prefer newest record)
    const dedupKey = eventId.toLowerCase();
    if (eventsById.has(dedupKey)) {
      const existing = eventsById.get(dedupKey);
      const existingTime = new Date(existing.last_updated || 0).getTime();
      const newTime = new Date(event.last_updated || 0).getTime();
      if (newTime >= existingTime) {
        eventsById.set(dedupKey, event);
      }
    } else {
      eventsById.set(dedupKey, event);
    }
  }

  return Array.from(eventsById.values());
}

/**
 * Internship Reader: Reads, validates, sanitizes, and deduplicates Published internships.
 * Reads from the dedicated 'Internship' tab (39 columns).
 */
function getPublishedInternships() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.INTERNSHIP_SHEET_NAME);

  if (!sheet) {
    Logger.log("Notice: Sheet tab '" + CONFIG.INTERNSHIP_SHEET_NAME + "' not found. Returning empty list.");
    return [];
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow < CONFIG.DATA_START_ROW) {
    return [];
  }

  const headerValues = sheet.getRange(CONFIG.HEADER_ROW, 1, 1, lastCol).getValues()[0];
  const dataRange = sheet.getRange(CONFIG.DATA_START_ROW, 1, lastRow - (CONFIG.DATA_START_ROW - 1), lastCol);
  const rows = dataRange.getValues();

  // Create header lookup map (case-insensitive and trimmed)
  const headerMap = {};
  headerValues.forEach((header, index) => {
    if (header) {
      headerMap[header.toString().trim().toLowerCase()] = index;
    }
  });

  const getColValue = (row, ...candidateNames) => {
    for (let name of candidateNames) {
      const idx = headerMap[name.toLowerCase()];
      if (idx !== undefined && idx >= 0) {
        return row[idx];
      }
    }
    return "";
  };

  const internshipsById = new Map();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + CONFIG.DATA_START_ROW;

    // Check if entire row is empty
    const isBlank = row.every(val => val === "" || val === null || val === undefined);
    if (isBlank) continue;

    // 1. Strict status check: MUST be 'Published'
    const statusRaw = (getColValue(row, "status", "Status") || "").toString().trim();
    if (statusRaw.toLowerCase() !== "published") {
      continue;
    }

    // 2. Validate required fields
    const name = (getColValue(row, "name", "Name", "Role Title", "Title") || "").toString().trim();
    if (!name || name.length < 2) {
      continue;
    }

    // 3. Date parsing and formatting
    const parseDateSafe = (val) => {
      if (!val) return null;
      if (val instanceof Date && !isNaN(val.getTime())) {
        return val;
      }
      const parsed = new Date(val);
      return !isNaN(parsed.getTime()) ? parsed : null;
    };

    const parsedStart = parseDateSafe(getColValue(row, "start_date", "Start Date"));
    const startDate = parsedStart ? parsedStart.toISOString() : undefined;
    const parsedEnd = parseDateSafe(getColValue(row, "end_date", "End Date"));
    const endDate = parsedEnd ? parsedEnd.toISOString() : undefined;
    const parsedDeadline = parseDateSafe(getColValue(row, "application_deadline", "Application Deadline", "deadline", "Deadline"));
    const appDeadline = parsedDeadline ? parsedDeadline.toISOString() : undefined;

    // 4. URL validation
    const isValidHttpUrl = (url) => {
      if (!url || typeof url !== "string") return false;
      const trimmed = url.trim();
      return (trimmed.indexOf("http://") === 0 || trimmed.indexOf("https://") === 0) && trimmed !== "#";
    };

    const rawAppUrl = (getColValue(row, "application_url", "Application URL", "Register Link") || "").toString().trim();
    const rawOfficialUrl = (getColValue(row, "official_url", "Official URL", "Website") || "").toString().trim();

    const hasValidAppUrl = isValidHttpUrl(rawAppUrl);
    const applicationUrl = hasValidAppUrl ? rawAppUrl : "";
    const officialUrl = isValidHttpUrl(rawOfficialUrl) ? rawOfficialUrl : undefined;

    // 5. Unique identifier (internship_id)
    let internshipId = (getColValue(row, "internship_id", "Internship ID", "ID") || "").toString().trim();
    if (!internshipId) {
      internshipId = "INT-" + new Date().getFullYear() + "-" + ("000" + rowNumber).slice(-4);
    }

    // 6. Fees
    const feeRaw = getColValue(row, "registration_fee", "Registration Fee");
    let registrationFee = 0;
    if (feeRaw !== "" && feeRaw !== null && feeRaw !== undefined) {
      const parsedFee = parseFloat(feeRaw.toString().replace(/[^0-9.]/g, ""));
      if (!isNaN(parsedFee)) registrationFee = parsedFee;
    }
    const feeAmountRaw = getColValue(row, "fee_amount", "Fee Amount");
    let feeAmount = 0;
    if (feeAmountRaw !== "" && feeAmountRaw !== null && feeAmountRaw !== undefined) {
      const parsed = parseFloat(feeAmountRaw.toString().replace(/[^0-9.]/g, ""));
      if (!isNaN(parsed)) feeAmount = parsed;
    }

    // 7. Featured boolean
    const featuredRaw = getColValue(row, "featured", "Featured");
    const isFeatured = featuredRaw === true || 
                       String(featuredRaw).trim().toLowerCase() === "true" || 
                       String(featuredRaw).trim().toLowerCase() === "yes" || 
                       String(featuredRaw).trim() === "1";

    // 8. Stipend handling
    const rawStipend = getColValue(row, "stipend_amount", "Stipend Amount");
    let stipendAmount = "";
    if (typeof rawStipend === "number") {
      stipendAmount = rawStipend;
    } else if (rawStipend) {
      stipendAmount = rawStipend.toString().trim();
    }

    const minSizeRaw = parseInt(getColValue(row, "min_team_size", "Minimum Team Size"), 10);
    const maxSizeRaw = parseInt(getColValue(row, "max_team_size", "Maximum Team Size"), 10);
    const maxParticipantsRaw = parseInt(getColValue(row, "max_participants", "Maximum Participants"), 10);

    const lastUpdatedDate = parseDateSafe(getColValue(row, "last_updated", "Last Updated"));
    const lastUpdated = lastUpdatedDate ? lastUpdatedDate.toISOString() : new Date().toISOString();

    const internship = {
      id: "apps-script-int-" + internshipId.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
      internship_id: internshipId,
      event_slug: (getColValue(row, "event_slug", "Event Slug") || "").toString().trim() || undefined,
      name: name,
      organizer_name: (getColValue(row, "organizer_name", "Organizer Name", "Company") || "Partner Organization").toString().trim(),
      organizer_type: (getColValue(row, "organizer_type", "Organizer Type") || "Company").toString().trim(),
      category: (getColValue(row, "category", "Category") || "Internships").toString().trim(),
      level: (getColValue(row, "level", "Level") || "National").toString().trim(),
      internship_type: (getColValue(row, "internship_type", "Internship Type") || "Internship").toString().trim(),
      description: (getColValue(row, "description", "Description") || "").toString().trim(),
      start_date: startDate,
      end_date: endDate,
      application_deadline: appDeadline,
      mode: (getColValue(row, "mode", "Mode") || "Offline").toString().trim(),
      location: (getColValue(row, "location", "Location") || "Campus / Office").toString().trim(),
      registration_fee: registrationFee,
      fee_amount: feeAmount,
      fee_type: (getColValue(row, "fee_type", "Fee Type") || (registrationFee > 0 ? "Paid" : "Free")).toString().trim(),
      department: (getColValue(row, "department", "Department") || "").toString().trim() || undefined,
      tags: (getColValue(row, "tags", "Tags") || "").toString().trim() || "",
      eligibility: (getColValue(row, "eligibility", "Eligibility") || "Pre-final and final year engineering students").toString().trim(),
      eligible_departments: (getColValue(row, "eligible_departments", "Eligible Departments") || "All Departments").toString().trim(),
      participation_type: (getColValue(row, "participation_type", "Participation Type") || "Individual").toString().trim(),
      min_team_size: !isNaN(minSizeRaw) ? minSizeRaw : undefined,
      max_team_size: !isNaN(maxSizeRaw) ? maxSizeRaw : undefined,
      max_participants: !isNaN(maxParticipantsRaw) ? maxParticipantsRaw : undefined,
      stipend_amount: stipendAmount,
      stipend_details: (getColValue(row, "stipend_details", "Stipend Details") || "").toString().trim() || undefined,
      official_url: officialUrl,
      application_url: applicationUrl,
      has_valid_application_url: hasValidAppUrl,
      banner_url: (getColValue(row, "banner_url", "Banner URL") || "").toString().trim() || undefined,
      drive_file_ref: (getColValue(row, "drive_file_ref", "Google Drive File Reference") || "").toString().trim() || undefined,
      contact_email: (getColValue(row, "contact_email", "Contact Email") || "").toString().trim() || undefined,
      contact_phone: (getColValue(row, "contact_phone", "Contact Phone") || "").toString().trim() || undefined,
      status: "Published",
      featured: isFeatured,
      last_updated: lastUpdated,
      source_row_id: rowNumber,
      created_at: (parseDateSafe(getColValue(row, "created_at", "Created At")) || new Date()).toISOString(),
      updated_at: (parseDateSafe(getColValue(row, "updated_at", "Updated At")) || new Date()).toISOString(),
    };

    // Deduplicate by internship_id (keep newest)
    const dedupKey = internshipId.toLowerCase();
    if (internshipsById.has(dedupKey)) {
      const existing = internshipsById.get(dedupKey);
      const existingTime = new Date(existing.last_updated || 0).getTime();
      const newTime = new Date(internship.last_updated || 0).getTime();
      if (newTime >= existingTime) {
        internshipsById.set(dedupKey, internship);
      }
    } else {
      internshipsById.set(dedupKey, internship);
    }
  }

  return Array.from(internshipsById.values());
}

/**
 * Diagnostic & Testing Function for Internships
 */
function testDoGetInternships() {
  const result = getPublishedInternships();
  Logger.log("=== CampusConnect Apps Script Internships Test ===");
  Logger.log("Total published internships found: " + result.length);
  if (result.length > 0) {
    Logger.log("Sample First Internship:");
    Logger.log(JSON.stringify(result[0], null, 2));
  } else {
    Logger.log("No published internships found. Check that row(s) in 'Internship' tab have Status = 'Published'.");
  }
}

/**
 * Diagnostic & Testing Function
 * Run this function in the Apps Script Editor to preview the output before deployment.
 */
function testDoGet() {
  const result = getPublishedEvents();
  Logger.log("=== CampusConnect Apps Script Test ===");
  Logger.log("Total published events found: " + result.length);
  if (result.length > 0) {
    Logger.log("Sample First Event:");
    Logger.log(JSON.stringify(result[0], null, 2));
  } else {
    Logger.log("No published events found. Check that row(s) have Status = 'Published'.");
  }
}

/**
 * Sheet Initializer Helper
 * Run this function once if starting from a brand new empty Google Sheet.
 * It creates the standard 'Events' sheet with the 28 columns and 2 sample rows.
 */
function initializeEventsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }

  const headers = [
    "Event ID",
    "Event Name",
    "Organizer Name",
    "Organizer Type",
    "Category",
    "Level",
    "Event Type",
    "Description",
    "Start Date",
    "End Date",
    "Registration Deadline",
    "Mode",
    "Location",
    "Registration Fee",
    "Eligibility",
    "Eligible Departments",
    "Participation Type",
    "Minimum Team Size",
    "Maximum Team Size",
    "Prize Information",
    "Official Event URL",
    "Registration URL",
    "Banner URL",
    "Google Drive File Reference",
    "Contact Email",
    "Contact Phone",
    "Status",
    "Featured",
    "Last Updated"
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#132450").setFontColor("#FFFFFF");
  sheet.setFrozenRows(1);

  // Add 1 Published sample row and 1 Draft sample row to test filtering
  const sampleRows = [
    [
      "CC-2026-0001",
      "National AI & Autonomous Robotics Hackathon 2026",
      "Department of AI & Data Science",
      "Our College",
      "Hackathons",
      "National",
      "36h Hackathon",
      "Flagship collegiate hackathon featuring agentic workflows, embedded robotics, and edge computing.",
      "2026-11-20T09:00:00Z",
      "2026-11-21T21:00:00Z",
      "2026-11-15T23:59:59Z",
      "Offline",
      "Innovation Quadrangle, Main Campus",
      0,
      "All undergraduate & postgraduate engineering students",
      "CSE, ECE, AI/DS, Robotics, Mech",
      "Team",
      2,
      4,
      "$5,000 Cash Pool + Cloud Credits",
      "https://example.edu/hackathon",
      "https://example.edu/register/hackathon",
      "",
      "",
      "events@example.edu",
      "+1 (555) 019-2834",
      "Published",
      true,
      new Date().toISOString()
    ],
    [
      "CC-2026-0002",
      "Internal Faculty Development Workshop (Draft)",
      "Dean Office",
      "Our College",
      "Workshops",
      "College Level",
      "Faculty Workshop",
      "Draft internal program not yet approved for public student viewing.",
      "2026-12-01T09:00:00Z",
      "2026-12-02T16:00:00Z",
      "2026-11-28T23:59:59Z",
      "Offline",
      "Seminar Hall 2",
      0,
      "Faculty Only",
      "All",
      "Individual",
      1,
      1,
      "",
      "",
      "https://example.edu/register/faculty",
      "",
      "",
      "faculty@example.edu",
      "",
      "Draft",
      false,
      new Date().toISOString()
    ]
  ];

  sheet.getRange(2, 1, sampleRows.length, headers.length).setValues(sampleRows);
  sheet.autoResizeColumns(1, headers.length);
  Logger.log("Initialized 'Events' sheet with 28 columns and sample rows.");
}
