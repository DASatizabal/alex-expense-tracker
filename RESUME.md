# Alex Expense Tracker - Project Resume

## Quick Links

| Resource | URL |
|----------|-----|
| GitHub Repo | https://github.com/DASatizabal/alex-expense-tracker |
| Live Website | https://dasatizabal.github.io/alex-expense-tracker/ |
| Google Sheet | https://docs.google.com/spreadsheets/d/1i5LozGG2aRrgEG-v17R4Ib15wlKe3dJzylAndFoHEnY |
| Apps Script | Open Sheet > Extensions > Apps Script |

---

## What This Project Is

A mobile-friendly expense tracker for Alex to manage:
- **Recurring bills**: Rent ($300), Insurance ($300), Phone ($50)
- **Car loan**: $300/month for 84 months (tracks payment count)
- **Cruise savings goal**: $1,500 by July 23, 2026

Data syncs to Google Sheets so it persists across devices.

---

## Current State (January 2026)

### Working
- App displays expense cards with status (paid/due/overdue)
- Payment modal for recording payments
- Payment history display
- GitHub Pages hosting live
- Google Sheets connected

### Pending Issue
**Payments may not sync to Google Sheets** - requires Apps Script redeployment.

To fix:
1. Open the Google Sheet
2. Go to **Extensions > Apps Script**
3. Replace code with: https://raw.githubusercontent.com/DASatizabal/alex-expense-tracker/master/google-apps-script.js
4. **Deploy > Manage deployments > Edit (pencil) > New version > Deploy**

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
APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbw.../exec'
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
- Verify Apps Script is deployed as "Anyone" access
- Redeploy Apps Script with new version

**Site not updating after push:**
- Wait 1-2 minutes for GitHub Pages to rebuild
- Hard refresh browser (Ctrl+Shift+R)

**CORS errors in console:**
- Apps Script must use `text/plain` content type (already fixed)
- Make sure Apps Script is redeployed

---

## Session History

1. Created expense tracker with localStorage
2. Added Google Sheets integration via Apps Script
3. Fixed CORS issue (Content-Type: text/plain)
4. Deployed to GitHub Pages
5. Pending: Redeploy Apps Script to apply fix
