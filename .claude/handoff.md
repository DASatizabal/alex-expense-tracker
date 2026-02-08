# Claude Code Handoff Prompt

> **START OF SESSION**: Read this file before proceeding. Also read without asking the following files: README.md, RESUME.md, and TODO.md for additional context.

## ⚠️ CRITICAL: Version Bump Required for EVERY Change
**EVERY commit MUST include a version bump. No exceptions.**
- Patch bump (x.y.Z) for bug fixes
- Minor bump (x.Y.0) for new features
- Update version in: `js/config.js`, `README.md`, `RESUME.md`, `.claude/handoff.md`
- Add version history entry in `RESUME.md`
- See "Version Bump Protocol" section below for full details

## What We're Building
Alex's Expense Tracker - a mobile-friendly web app for tracking recurring expenses, loan payments, and savings goals. Features a dark glassmorphism UI and syncs with Google Sheets for persistent cloud storage. Single-user application designed for Alex's personal expense management.

## Current State
**Version 2.13.0** - Multi-tenant centralized Apps Script with auto-provisioned per-user storage. Live at https://dasatizabal.github.io/alex-expense-tracker/

Working features:
- **Multi-tenant Apps Script** - centralized backend auto-provisions per-user storage tabs, no setup wizard needed
- **Google OAuth** - Firebase Authentication with Google Sign-In, admin access for master account
- **Real-time currency conversion** - fetches live exchange rates from Open Exchange Rates API, converts amounts when display currency differs from default
- **User admin panel** - settings gear icon, add/edit/delete expenses, default currency setting
- **Variable expense type** - for bills that change monthly
- **Internationalization (i18n)** - full translation system with English, Spanish, and Haitian Creole
- **Language selector** - switch languages with browser auto-detection and localStorage persistence
- **Prominent remaining balance** - goal cards now show remaining amount prominently
- **Sync status indicator** - real-time display of synced/syncing/offline status
- **Edit payments** - modify existing payments (amount, date, notes)
- **CSV export** - export payment history to CSV file for backup
- **Currency selector** - 10 currencies (USD, EUR, GBP, etc.) with localStorage persistence
- **PWA support** - installable app with service worker for offline caching
- **Dark/Light theme toggle** with localStorage persistence and system preference detection
- Recurring expenses with credit/past due tracking
- Loan payments with progress tracking (X of Y payments)
- Savings goals with per-paycheck breakdowns
- Bulk payment modal with editable amounts
- Payment history (last 10 with edit/delete)
- Smart sorting (unpaid first, then by due date)
- Color-coded status cards (green=paid, yellow=due soon, red=overdue, purple=pending)
- Google Sheets cloud sync with localStorage fallback
- Toast notifications and loading overlay
- Dark glassmorphism UI with Tailwind CSS

## Key Constraints
- **No frameworks** - Vanilla JavaScript, HTML, Tailwind CSS (CDN)
- **Google Sheets backend** - Apps Script deployed as public web app
- **Local timezone** - All dates use local timezone, not UTC (critical for due date calculations)
- **Single user** - Designed specifically for Alex (no auth/multi-user)
- **GitHub Pages** - Auto-deploys on git push

## What to Work on Next
See TODO.md for full roadmap. Near-term priorities:
1. Variable expense amounts
2. Google OAuth (building on existing password protection)
3. Onboarding wizard
4. More language translations

## Don't Touch
- **Date handling logic** in `app.js` - Uses `parseLocalDate()` and local timezone throughout; UTC causes off-by-one bugs
- **Pay period calculation** - Fixed 14-day cycle starting Jan 22, 2026; uses `Date.UTC()` to avoid DST issues
- **Apps Script CORS workaround** - Uses `Content-Type: text/plain` to avoid preflight requests

## File Structure
```
alex-expense-tracker/
├── index.html              # Main HTML page (entry point)
├── manifest.json           # PWA manifest for installability
├── sw.js                   # Service worker for offline caching
├── google-apps-script.js   # Backend code (deploy to Apps Script)
├── css/
│   └── styles.css          # Custom animations, scrollbars, dark theme
├── js/
│   ├── config.js           # Expenses array, API URL, version, encryption settings
│   ├── encryption.js       # Web Crypto API (AES-GCM, PBKDF2) for password protection
│   ├── i18n.js             # Internationalization with English, Spanish, Haitian Creole
│   ├── sheets-api.js       # Cloud + localStorage abstraction with session cache
│   └── app.js              # Main application logic (~1500 lines)
├── icons/
│   ├── icon-192.svg        # App icon 192x192
│   ├── icon-512.svg        # App icon 512x512
│   └── icon-maskable.svg   # Maskable icon for Android
├── README.md               # Full documentation
├── RESUME.md               # Quick reference for sessions
├── SETUP.md                # Google Sheets setup guide
├── TODO.md                 # Expansion roadmap
└── .claude/handoff.md      # This file
```

## How to Run
**Option 1: Local only**
- Open `index.html` in browser
- Data saves to localStorage

**Option 2: Cloud sync (current)**
- Already configured with working Google Sheet
- Open `index.html` or visit live site
- Payments sync to Google Sheets automatically

**To deploy changes:**
- Bump version per the **Version Bump Protocol** above
- Update README.md, RESUME.md, SETUP.md, TODO.md and Handoff.md with latest change including version update
```bash
git add .
git commit -m "Description of changes"
git push
```
GitHub Pages auto-deploys within 1-2 minutes.

## Configuration
Expenses are defined in `js/config.js`:
- **Rent**: $300/month, due 1st
- **Insurance**: $300/month, due 23rd
- **Phone**: $50/month, due 1st
- **Car**: $300/month loan, due 1st, 84 total payments
- **Cruise**: $1,371.50 savings goal, due July 23, 2026

Apps Script URL and cloud toggle also in `config.js`.

## Critical Date/Timezone Notes
- Use `parseLocalDate(dateStr)` to convert YYYY-MM-DD to local Date
- Use `getTodayDateString()` for today's date as YYYY-MM-DD
- Never use `new Date('YYYY-MM-DD')` directly - creates UTC midnight
- For multi-month calculations, use `Date.UTC()` to avoid DST bugs

## Expense Types
| Type | Tracked By | Example |
|------|------------|---------|
| recurring | Due day of month | Rent, Insurance, Phone |
| loan | Payment count vs total | Car (12 of 84 payments) |
| goal | Amount saved vs target by date | Cruise savings |

## Version Bump Protocol (IMPORTANT)
**Every commit & push MUST include a version bump.** Follow these steps:
1. Bump the patch version in `js/config.js` (`APP_VERSION` constant) — e.g., 2.10.2 → 2.10.3
2. Update the version in `README.md`, `RESUME.md`, and `.claude/handoff.md` to match
3. Add a version history entry in `RESUME.md` describing the change
4. Include the version bump in the same commit, or as an immediate follow-up commit before pushing
5. Use **patch** bumps (x.y.Z) for bug fixes, **minor** bumps (x.Y.0) for new features

## Session End Protocol
When user says "I'm done for now":
1. Commit all changes with descriptive message
2. Push to GitHub (triggers deployment)
3. Verify live site updated if needed
4. Update TODO.md if priorities changed
5. Update, commit, and push all relevant docs as needed

## Quick Reference

**Add new expense:** Edit `js/config.js` EXPENSES array

**Change amount/due date:** Edit expense object in `config.js`

**Update Apps Script:** Copy code to Sheet > Extensions > Apps Script > Deploy new version

**Export payments:** Run `SheetsAPI.exportToCSV()` in browser console

## Resources
- **Live Site**: https://dasatizabal.github.io/alex-expense-tracker/
- **GitHub**: https://github.com/DASatizabal/alex-expense-tracker
- **Google Sheet**: https://docs.google.com/spreadsheets/d/1i5LozGG2aRrgEG-v17R4Ib15wlKe3dJzylAndFoHEnY
