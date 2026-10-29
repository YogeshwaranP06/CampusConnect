# CampusConnect — College Events & Opportunities Discovery Platform

A modern, fast, responsive web platform engineered for college event coordinators and undergraduate/postgraduate student communities.

CampusConnect provides a student-facing discovery experience for college symposiums, hackathons, workshops, competitions, conferences, research fellowships, and internships without requiring student accounts or passwords.

The primary event-management interface is **Google Sheets**, which provides approved published event data directly to the website via a read-only **Google Apps Script Web App endpoint**.

---

## Architecture Overview

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

### Key Architectural Benefits
- **Zero Backend Overhead**: No Firebase, Supabase, database servers, or custom sync endpoints required for the current phase.
- **Privacy & Security**: Read-only web app returns only public fields of approved published events. No API keys, secrets, or write privileges exist in frontend code.
- **Data Integrity**: Only events with `Status = "Published"` are displayed. Drafts, archived events, and internal notes never reach students.
- **Demo Data Transparency**: If the Google Apps Script endpoint is not configured, CampusConnect automatically runs in clearly labelled **Demo Data Mode** with verified collegiate sample events. It never pretends live data is connected.
- **Modular Data Service**: `src/services/eventService.ts` is designed around a modular provider interface (`EventDataSource`), allowing Firestore, Supabase, or another backend to be added later without refactoring UI components.

---

## Features

- **No Student Login Barrier**: Students browse, filter, search, and bookmark events without registration or account barriers.
- **Comprehensive Search & Filters**: Search across titles, organizers, descriptions, categories, venues, and engineering departments.
- **Category & Stream Navigation**: Quick filters for Hackathons, Symposiums, Workshops, Competitions, and Conferences.
- **Core Engineering Track**: Curated view for VLSI, Robotics, Mechatronics, Embedded IoT, Aerospace, and CleanTech events.
- **Internships & Opportunities View**: Filterable view for paid research fellowships, industrial internships, and corporate boot camps.
- **Client-Side Saved Events**: Bookmarked shortlist saved directly to browser storage.
- **Direct Institutional Registration**: Verifies registration deadlines and safely routes students to official event registration portals.
- **Zero-Broken-Image Policy**: Automatic Google Drive link resolution with category-tailored graphical fallback containers.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Add your deployed Google Apps Script Web App URL:
```env
VITE_APPS_SCRIPT_URL="https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
```
*(If `VITE_APPS_SCRIPT_URL` is left blank, CampusConnect automatically runs in **Demo Data Mode** with verified sample collegiate events.)*

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## Google Sheets & Apps Script Setup

For the step-by-step guide on creating the Google Sheet, installing `google-apps-script/Code.gs`, testing the endpoint, and deploying as a Web App, see:
👉 [Google Apps Script Setup Guide](docs/GOOGLE_APPS_SCRIPT_SETUP.md)

---

## Vercel Deployment

CampusConnect is a standard Vite React application and deploys to Vercel with zero server configuration:
1. Push repository to GitHub.
2. In [Vercel](https://vercel.com), click **Add New… → Project** and import the repository.
3. Framework Preset: **Vite**, Build Command: `vite build`, Output Directory: `dist`.
4. Under **Environment Variables**, add `VITE_APPS_SCRIPT_URL` with your Apps Script URL.
5. Click **Deploy**.
