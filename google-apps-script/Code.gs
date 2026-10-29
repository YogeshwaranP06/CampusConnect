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
  HEADER_ROW: 1,
  DATA_START_ROW: 2,
};

/**
 * HTTP GET Web Endpoint
 * Handles GET requests from the CampusConnect frontend and returns JSON.
 */
function doGet(e) {
  try {
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
