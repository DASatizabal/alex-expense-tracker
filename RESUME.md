# Alex Expense Tracker - Project Resume

**Current Version: 2.2.0**

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

## Current State (January 2026)

### Working Features
- Dark glassmorphism UI with Tailwind CSS and Lucide icons
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
├── google-apps-script.js   # Backend (copy to Google Apps Script)
├── css/styles.css          # Styling
├── js/
│   ├── config.js           # Settings + expense definitions
│   ├── sheets-api.js       # API layer (cloud + localStorage)
│   └── app.js              # UI logic
├── README.md               # Full documentation
├── SETUP.md                # Google Sheets setup guide
└── RESUME.md               # This file
```

---

## Key Configuration

**js/config.js** contains:
```javascript
APP_VERSION: '2.2.0'
APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwQI_sZ76ZvFCXOdndlyhvI0U2UR3CXdJo_m_1NlCuDAUPS26sYyzzLOl7ZIyKCf_aa/exec'
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

## Version History

| Version | Changes |
|---------|---------|
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
