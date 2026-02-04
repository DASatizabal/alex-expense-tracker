# Alex Expense Tracker - Project Resume

**Current Version: 2.12.4**

## Quick Links

| Resource | URL |
|----------|-----|
| Live Website | https://dasatizabal.github.io/alex-expense-tracker/ |
| GitHub Repo | https://github.com/DASatizabal/alex-expense-tracker |
| Google Sheet | https://docs.google.com/spreadsheets/d/1i5LozGG2aRrgEG-v17R4Ib15wlKe3dJzylAndFoHEnY |
| Apps Script | Open Sheet > Extensions > Apps Script |

---

## What This Project Is

A mobile-friendly expense tracker for Alex to manage:
- **Recurring bills**: Rent ($300), Insurance ($300), Phone ($50)
- **Car loan**: $300/month for 84 months (tracks payment count)
- **Cruise savings goal**: $1,371.33 by July 23, 2026

Data syncs to Google Sheets so it persists across devices.

---

## Current State (February 2026)

### Working Features
- **Real-time currency conversion** - fetches live exchange rates from Open Exchange Rates API, converts displayed amounts when display currency differs from default, caches rates for 6 hours
- **User admin panel** - settings gear icon, add/edit/delete expenses, default currency setting
- **Variable expense type** - for bills that change monthly (e.g., Electric)
- **Internationalization (i18n)** - full translation system with English, Spanish, and Haitian Creole
- **Language selector** - switch languages with browser auto-detection and localStorage persistence
- **Prominent remaining balance** - goal cards now show remaining amount prominently
- **Sync status indicator** - shows synced/syncing/offline status in real-time
- **Edit payments** - modify existing payments (amount, date, notes)
- **CSV export** - export payment history to CSV file
- **Currency selector** - 10 currencies (USD, EUR, GBP, etc.) with localStorage persistence
- **PWA support** - installable app with service worker for offline caching
- **Dark/Light theme toggle** with system preference detection and localStorage persistence
- **Google OAuth** via Firebase Authentication (Google Sign-In)
- **Per-user data isolation** with user-configurable Google Sheets URL
- **Admin access** for master account to view all users' data
- Dark/light glassmorphism UI with Tailwind CSS and Lucide icons
- Expense cards with status indicators (paid, due soon, overdue, pending)
- Single payment modal with custom amounts and notes
- Bulk payment modal to mark multiple expenses paid at once
- Payment history with delete functionality
- Smart sorting (unpaid first, by due date, by amount)
- Per-paycheck savings breakdown for goals
- Currency formatting with comma separators
- Progress bars for loans and savings goals
- Toast notifications for user feedback
- Loading overlay during API calls
- GitHub Pages hosting (live and working)
- Google Sheets sync (connected and functional)
- localStorage fallback for offline use

---

## Project Structure

```
alex-expense-tracker/
├── index.html              # Main page
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker for offline caching
├── google-apps-script.js   # Backend (copy to Google Apps Script)
├── css/styles.css          # Styling
├── js/
│   ├── config.js           # Settings + expense definitions + Firebase config + auth roles
│   ├── firebase-auth.js    # Google OAuth via Firebase Authentication
│   ├── i18n.js             # Internationalization (English, Spanish, Haitian Creole)
│   ├── sheets-api.js       # API layer (cloud + localStorage + per-user storage)
│   └── app.js              # UI logic + Firebase auth flow
├── icons/                  # PWA icons (192, 512, maskable)
├── README.md               # Full documentation
├── SETUP.md                # Google Sheets setup guide
├── RESUME.md               # This file
└── TODO.md                 # Expansion roadmap
```

---

## Key Configuration

**js/config.js** contains:
```javascript
APP_VERSION: '2.12.4'
FIREBASE_CONFIG: { apiKey, authDomain, projectId, ... }
AUTH_ROLES: {
    PRIMARY_USER: 'lalexcubilla@gmail.com',
    ADMINS: ['dasatizabal@gmail.com']
}
APPS_SCRIPT_URL: 'https://script.google.com/macros/s/...'
USE_LOCAL_STORAGE: false  // true = offline only, false = sync to Sheets
```

**google-apps-script.js** contains:
```javascript
SHEET_ID: '1i5LozGG2aRrgEG-v17R4Ib15wlKe3dJzylAndFoHEnY'
```

---

## How It Works

```
User clicks "Mark as Paid"
        ↓
js/app.js calls SheetsAPI.savePayment()
        ↓
js/sheets-api.js POSTs to Apps Script URL
        ↓
google-apps-script.js adds row to Google Sheet
        ↓
Response returns, UI updates
```

---

## Development Notes

**IMPORTANT: Date handling rules**
- Use `new Date(year, month, day)` (month is 0-indexed) - NOT `new Date('YYYY-MM-DD')`
- `new Date('2026-07-23')` creates UTC midnight, which becomes the PREVIOUS day in US timezones
- Use `getTodayDateString()` helper for form date fields
- Use `parseLocalDate()` to parse "YYYY-MM-DD" strings from storage
- **For date math spanning months, use `Date.UTC()` to avoid Daylight Saving Time bugs**
  - DST causes 1 hour shift, making `Math.floor(days)` off by 1 day

---

## To Make Changes

### Edit expenses (amounts, due dates):
Edit `js/config.js` → `EXPENSES` array

### Edit app behavior:
Edit `js/app.js`

### Edit backend/API:
1. Edit `google-apps-script.js`
2. Copy to Google Apps Script editor
3. **Redeploy** (new version required for changes to take effect)

### Push changes to live site:
```bash
cd "L:\David's Folder\Claude Projects\alex-expense-tracker"
git add .
git commit -m "Your message"
git push
```
GitHub Pages auto-deploys within 1-2 minutes.

---

## Git Basics Reminder

| Command | What it does |
|---------|--------------|
| `git status` | See what changed |
| `git add <file>` | Stage file for commit |
| `git commit -m "msg"` | Save snapshot locally |
| `git push` | Upload to GitHub |
| `git pull` | Download from GitHub |

---

## Troubleshooting

**Payments not saving to Sheet:**
- Check browser console (F12) for errors
- Verify Apps Script is deployed with "Anyone" access
- Redeploy Apps Script: Deploy > Manage deployments > Edit (pencil) > New version > Deploy

**Site not updating after push:**
- Wait 1-2 minutes for GitHub Pages to rebuild
- Hard refresh browser (Ctrl+Shift+R)

**CORS errors in console:**
- Apps Script uses `text/plain` content type to avoid CORS preflight
- If still occurring, redeploy Apps Script with new version

**Expense not showing as paid:**
- Check that payment date matches current month
- Verify payment was saved (check Payment History section)
- Hard refresh the page

---

## Roadmap

See **TODO.md** for expansion plans including multi-user support, templates, mobile apps, and integrations.

---

## Version History

| Version | Changes |
|---------|---------|
| v2.12.4 | Fix header overlapping with top controls bar on mobile |
| v2.12.3 | Add favicon, always show admin switcher, hide unknown UIDs from dropdown |
| v2.12.0 | **Google OAuth**: Firebase Auth with Google Sign-In replaces PIN/password, per-user data isolation, admin access for master account, user-configurable Google Sheets URL |
| v2.11.0 | **Real-time currency conversion**: Fetches live exchange rates from Open Exchange Rates API, converts amounts when display currency differs from default, caches rates for 6 hours, shows rate status indicator |
| v2.10.2 | **Bug fix**: Past due calculation no longer counts current month before due day has passed |
| v2.10.1 | **Bug fix**: Main page now reflects expense settings changes (was using hardcoded defaults instead of user config) |
| v2.10.0 | **User admin panel**: Settings gear icon, add/edit/delete expense cards, default currency setting, variable expense type |
| v2.9.0 | **Internationalization (i18n)**: Full translation system with English, Spanish, Haitian Creole; language selector with browser auto-detection; prominent remaining balance display on goal cards |
| v2.8.0 | **Offline indicator, Edit payment, CSV export**: Sync status indicator, edit existing payments, export to CSV button |
| v2.7.0 | **Currency selector**: 10 currencies (USD, EUR, GBP, CAD, AUD, MXN, JPY, INR, BRL, CHF) with localStorage persistence |
| v2.6.0 | **PWA support**: Installable app with manifest, service worker for offline caching, custom wallet icons |
| v2.5.2 | Fix theme: Restore exact v2.4.1 dark styling, use CSS overrides for light mode |
| v2.5.1 | Fix theme styling: Dark mode matches v2.4.1 glassmorphism, light mode uses traditional solid white cards |
| v2.5.0 | **Theme toggle**: Dark/light mode switch with system preference detection and localStorage persistence |
| v2.4.1 | Allow additional savings payments within same pay period |
| v2.4.0 | **Password protection**: AES-GCM encryption, PBKDF2 key derivation, 5-min auto-lock, manual lock button, forgot password reset |
| v2.3.6 | Hide number spinners, auto-select amount fields on focus |
| v2.3.5 | Editable amounts in bulk payment modal with smart defaults |
| v2.3.4 | Allow bulk payments to past due expenses |
| v2.3.3 | Show past due expense in "Next Due" instead of "All paid!" |
| v2.3.2 | Include past due amounts in "Remaining This Month" total |
| v2.3.1 | Keep past due expenses at top with payment button until caught up |
| v2.3.0 | Add credit/past due tracking for recurring expenses |
| v2.2.5 | Limit goal payments to remaining balance |
| v2.2.4 | Fix DST bug in paycheck calculation (use Date.UTC for math) |
| v2.2.3 | Ensure all dates use local timezone (not UTC) |
| v2.2.2 | Fix timezone bug in due date causing incorrect paycheck count |
| v2.2.1 | Fix paycheck count calculation (13 pay periods to due date) |
| v2.2.0 | Add pay period tracking for savings goals ("Paid this payperiod") |
| v2.1.1 | Fix loan button showing when already paid this month |
| v2.1.0 | Revert to dark-only theme, remove theme toggle |
| v2.0.2 | Fix light/dark mode colors throughout app |
| v2.0.1 | Fix theme toggle and currency formatting (hide .00 cents) |
| v2.0.0 | Major UI overhaul - Tailwind CSS, glassmorphism, Lucide icons, animations |
| v1.4.0 | Add dark mode as default with toggle |
| v1.3.1 | Add comma separators to currency |
| v1.3.0 | Pre-fill savings with per-paycheck suggestion |
| v1.2.1 | Fix cruise amount ($1,371.33) and paycheck count |
| v1.2.0 | Add paycheck breakdown for Cruise goal |
| v1.1.0 | Monthly Total shows remaining amount to pay |
| v1.0.0 | Initial release with version tag display |

---

## Development History

1. Created expense tracker with localStorage
2. Added Google Sheets integration via Apps Script
3. Fixed CORS issue (Content-Type: text/plain)
4. Deployed to GitHub Pages
5. Added savings goal paycheck breakdown
6. Major UI modernization (v2.0.0) with Tailwind + glassmorphism
7. Settled on dark-only theme after testing light/dark toggle
8. Added password protection (v2.4.0) with Web Crypto API encryption
9. Added PWA support (v2.6.0) with service worker and custom icons
10. Added currency selector (v2.7.0) with 10 currencies
11. Added sync indicator, edit payment, CSV export (v2.8.0)
12. Added internationalization with Spanish and Haitian Creole (v2.9.0)
13. Added user admin panel with expense management (v2.10.0)
14. Fixed main page not reflecting settings changes (v2.10.1)
15. Fixed past due calculation counting current month before due day (v2.10.2)
16. Added real-time currency conversion with Open Exchange Rates API (v2.11.0)
17. Replaced PIN/password with Google OAuth via Firebase Authentication (v2.12.0)
