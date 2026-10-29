# CampusConnect — Google Sheets & Google Apps Script Setup Guide

This guide explains how to connect your **Google Sheet** as the master event data source for the **CampusConnect** student website using a read-only **Google Apps Script Web App** endpoint, test the endpoint, and deploy the website to **Vercel**.

---

## 1. Architectural Overview

```
┌───────────────────────────────────────┐
│     Master Google Sheet ("Events")    │
│  (Managed by Event Coordinating Team) │
└──────────────────┬────────────────────┘
                   │
                   ▼ (Reads rows & filters Status == "Published")
┌───────────────────────────────────────┐
│ Google Apps Script Web App (doGet)    │
│  - Executes as sheet owner ("Me")     │
│  - Read-only public access ("Anyone") │
│  - Returns sanitized public JSON      │
│  - Strips private notes & columns     │
└──────────────────┬────────────────────┘
                   │
                   ▼ HTTPS GET (CORS enabled)
┌───────────────────────────────────────┐
│     CampusConnect Website (Vite/React)│
│  - Deployed on Vercel Edge CDN        │
│  - Zero secrets or credentials stored │
│  - Client-side search, filters, saves │
│  - Demo Data fallback if unconfigured │
└───────────────────────────────────────┘
```

### Security & Privacy Guarantees
1. **Zero Frontend Secrets**: No database passwords, private API keys, or service account credentials exist in client-side code.
2. **Strict Publishing Gate**: Only events marked with `Status = "Published"` are output by the endpoint. Records with `Draft`, `Archived`, `Cancelled`, or empty statuses are never exposed.
3. **Column Whitelisting**: Any extra team columns (e.g. internal review notes, coordinator personal mobile numbers, budget calculations) are stripped.
4. **Honest Data Transparency**: If the endpoint URL is not configured or network fails, the website displays a labeled `Demo Data Mode` badge. It never pretends live data is connected.

---

## 2. Step-by-Step Google Sheet & Apps Script Setup

### Step 1: Create the Master Google Sheet
1. Open [Google Sheets](https://sheets.new) and name the document:
   ```
   CampusConnect Master Events Database
   ```
2. Name the first sheet tab: **`Events`**.
3. Row 1 contains the 28 standard headers:

| Col | Header Name | Validation / Format | Example |
|---|---|---|---|
| A | `Event ID` | Unique ID (auto-generated if empty) | `CC-2026-0001` |
| B | `Event Name` | Mandatory event title (min 3 chars) | `National AI Hackathon 2026` |
| C | `Organizer Name` | Host department / society / company | `Department of AI & Data Science` |
| D | `Organizer Type` | Our College, Other College, University, Company, Startup, Government, Society | `Our College` |
| E | `Category` | Hackathons, Symposiums, Workshops, Competitions, Conferences, etc. | `Hackathons` |
| F | `Level` | National, International, State Level, College Level, Inter-Collegiate | `National` |
| G | `Event Type` | Build sprint, conference, paper presentation, expo | `36h Hackathon` |
| H | `Description` | Full event description | `Build generative AI prototypes...` |
| I | `Start Date` | ISO format `YYYY-MM-DDTHH:mm:ssZ` or standard date | `2026-11-20T09:00:00Z` |
| J | `End Date` | Optional end timestamp | `2026-11-21T21:00:00Z` |
| K | `Registration Deadline` | Registration cutoff timestamp | `2026-11-15T23:59:59Z` |
| L | `Mode` | `Online`, `Offline`, or `Hybrid` | `Offline` |
| M | `Location` | Campus venue, auditorium, or virtual link | `Innovation Quadrangle` |
| N | `Registration Fee` | Non-negative number (`0` for Free) | `0` |
| O | `Eligibility` | Target audience criteria | `Undergraduate students` |
| P | `Eligible Departments` | Eligible branches | `CSE, IT, ECE, AI/DS` |
| Q | `Participation Type` | `Individual`, `Team`, or `Both` | `Team` |
| R | `Minimum Team Size` | Minimum members (e.g. `2`) | `2` |
| S | `Maximum Team Size` | Maximum members (e.g. `4`) | `4` |
| T | `Prize Information` | Prize awards and incentives | `$5,000 Cash Pool + Cloud Credits` |
| U | `Official Event URL` | Institutional website | `https://example.edu/hackathon` |
| V | `Registration URL` | Mandatory registration form link | `https://example.edu/register` |
| W | `Banner URL` | Direct image URL or poster link | `https://...` |
| X | `Google Drive File Reference`| Google Drive share link | `https://drive.google.com/file/d/...` |
| Y | `Contact Email` | Public contact email | `events@example.edu` |
| Z | `Contact Phone` | Public contact phone | `+1 (555) 019-2834` |
| AA | `Status` | `Published`, `Draft`, `Archived`, or `Cancelled` | `Published` |
| AB | `Featured` | `TRUE` or `FALSE` | `TRUE` |
| AC | `Last Updated` | Populated timestamp | `2026-10-29T12:00:00Z` |

*(Tip: You can also use the built-in `initializeEventsSheet()` helper function described in Step 2 to generate this tab and headers automatically!)*

---

### Step 2: Add the Apps Script Code
1. In your Google Sheet, click **Extensions → Apps Script**.
2. Delete any existing template code in `Code.gs`.
3. Copy and paste the entire contents of [`google-apps-script/Code.gs`](../google-apps-script/Code.gs).
4. Save the project (click the disk icon or press `Ctrl + S`).
5. (Optional) Run `initializeEventsSheet()` once to automatically create sample rows if starting from an empty spreadsheet.

---

### Step 3: Test the Script Locally
1. In the Apps Script toolbar, select `testDoGet` from the function dropdown.
2. Click **Run**.
3. If prompted for authorization:
   - Click **Review permissions**.
   - Choose your Google account.
   - Click **Advanced** → **Go to CampusConnect (unsafe)**.
   - Click **Allow**.
4. Check the **Execution Log** at the bottom:
   - It will display `Total published events found: X` and print sample event JSON.

---

### Step 4: Deploy as a Read-Only Web App
1. In the top-right of Apps Script, click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Configure the deployment settings:
   - **Description**: `CampusConnect Events Read-Only API`
   - **Execute as**: **`Me (your email)`** *(The script runs with your sheet read permissions)*
   - **Who has access**: **`Anyone`** *(Allows students to fetch published event data without logging into Google)*
4. Click **Deploy**.
5. Copy the generated **Web app URL**. It will have the following shape:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

---

## 3. How to Test the Endpoint

### Method A: In Your Browser
Paste your Web App URL into your browser address bar. You will receive a clean JSON response:
```json
{
  "status": "success",
  "count": 2,
  "data": [
    {
      "id": "apps-script-cc-2026-0001",
      "event_id": "CC-2026-0001",
      "name": "National AI & Autonomous Robotics Hackathon 2026",
      "organizer_name": "Department of AI & Data Science",
      "category": "Hackathons",
      "level": "National",
      "status": "Published",
      "featured": true,
      ...
    }
  ],
  "generated_at": "2026-10-29T12:00:00.000Z"
}
```

### Method B: In Terminal via cURL
Run the following command (Google Apps Script redirects `302` to `script.googleusercontent.com`, so the `-L` flag is required):
```bash
curl -L "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
```

---

## 4. Connect Endpoint to CampusConnect

### Local Development
In the project root, create or edit `.env`:
```env
VITE_APPS_SCRIPT_URL="https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
```
Run the development server:
```bash
npm run dev
```
Open `http://localhost:5173` (or Vite's printed URL). The top navigation bar will display a green **● Google Sheets Live** badge.

---

## 5. Deploying the Website to Vercel

Vercel natively supports Vite React single-page applications with instant global CDN distribution.

### Step 1: Push Project to GitHub
```bash
git add .
git commit -m "Configure Google Apps Script endpoint and lightweight Vite architecture"
git push origin main
```

### Step 2: Import Project in Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New… → Project**.
3. Import your GitHub repository.

### Step 3: Configure Project Settings
- **Framework Preset**: `Vite`
- **Root Directory**: `./`
- **Build Command**: `vite build` (or `npm run build`)
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 4: Add Environment Variable
Under **Environment Variables**, add:
- **Key**: `VITE_APPS_SCRIPT_URL`
- **Value**: Your Google Apps Script Web App URL (`https://script.google.com/macros/s/.../exec`)

### Step 5: Deploy
Click **Deploy**. Within 60 seconds, your site is live with a secure HTTPS URL (e.g. `https://campusconnect-srm.vercel.app`).

### Automatic Updates
Whenever the Event Coordinating Team updates the Google Sheet:
- Newly changed rows with `Status = Published` appear on the live site automatically upon student refresh.
- Any event changed to `Draft` or `Cancelled` vanishes from student listings immediately.
