# Alex's Expense Tracker

**Version 2.2.4** | [Live Site](https://dasatizabal.github.io/alex-expense-tracker/)

A modern, mobile-friendly web app for tracking recurring expenses, loan payments, and savings goals. Features a dark glassmorphism UI and syncs with Google Sheets for cloud storage.

## Features

- **Recurring Expenses** - Track monthly bills like rent, insurance, and phone
- **Loan Tracking** - Monitor progress on loans with payment counts (e.g., "12 of 84 payments")
- **Savings Goals** - Track progress toward financial goals with target dates and per-paycheck breakdowns
- **Bulk Payments** - Mark multiple expenses as paid in one action
- **Visual Status** - Color-coded cards show paid, due soon, overdue, and pending items
- **Smart Sorting** - Unpaid items first, sorted by due date and amount
- **Payment History** - View and delete recent payments with dates and notes
- **Cloud Sync** - Data stored in Google Sheets via Apps Script backend
- **Offline Fallback** - Works with localStorage when offline
- **Modern UI** - Dark glassmorphism theme with animations (Tailwind CSS + Lucide icons)

## Quick Start

### Option 1: Local Storage Only (No Setup)

1. Open `index.html` in a browser
2. Start tracking expenses (data saved to browser)

### Option 2: Google Sheets Sync

See [SETUP.md](SETUP.md) for detailed instructions to connect to Google Sheets.

**Summary:**
1. Create a Google Sheet with a "Payments" tab
2. Add headers: Date | Category | Amount | Notes | ID
3. Copy `google-apps-script.js` to Extensions > Apps Script
4. Deploy as Web app with "Anyone" access
5. Paste the deployment URL into `js/config.js`
6. Set `USE_LOCAL_STORAGE: false`

## Project Structure

```
alex-expense-tracker/
├── index.html              # Main HTML page (Tailwind + Lucide icons via CDN)
├── google-apps-script.js   # Backend script (copy to Google Apps Script)
├── css/
│   └── styles.css          # Custom styling (animations, scrollbars)
├── js/
│   ├── config.js           # Configuration (expenses, API URL, version)
│   ├── sheets-api.js       # API layer (cloud + localStorage)
│   └── app.js              # Main application logic
├── README.md               # This file
├── SETUP.md                # Google Sheets setup guide
└── RESUME.md               # Project summary for quick reference
```

## Configuration

Edit `js/config.js` to customize expenses and settings:

```javascript
const CONFIG = {
    APPS_SCRIPT_URL: 'https://script.google.com/...',  // Your Apps Script URL
    USE_LOCAL_STORAGE: false  // true = offline mode, false = cloud sync
};

const EXPENSES = [
    {
        id: 'rent',
        name: 'Rent',
        icon: '\u{1F3E0}',      // Unicode emoji
        amount: 300,
        type: 'recurring',      // recurring, loan, or goal
        dueDay: 1,              // Day of month (1-31)
        description: 'Monthly rent payment'
    },
    {
        id: 'car',
        name: 'Car Payment',
        icon: '\u{1F697}',
        amount: 300,
        type: 'loan',
        dueDay: 1,
        totalPayments: 84,      // Total loan payments
        description: 'Car loan'
    },
    {
        id: 'savings',
        name: 'Vacation',
        icon: '\u{1F3D6}',
        amount: 1000,
        type: 'goal',
        dueDate: new Date(2026, 11, 1),  // Target date (month is 0-indexed)
        description: 'Vacation fund'
    }
];
```

### Expense Types

| Type | Description | Required Fields |
|------|-------------|-----------------|
| `recurring` | Monthly bills | `amount`, `dueDay` |
| `loan` | Tracked payment count | `amount`, `dueDay`, `totalPayments` |
| `goal` | Savings target | `amount`, `dueDate` |

## Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS (CDN), Lucide Icons
- **Backend**: Google Apps Script (serverless)
- **Storage**: Google Sheets (primary), localStorage (fallback)
- **Hosting**: GitHub Pages

## How It Works

1. **Frontend** (`index.html`, `app.js`) - Renders expense cards and handles user interaction
2. **API Layer** (`sheets-api.js`) - Abstracts storage, supports both cloud and localStorage
3. **Backend** (`google-apps-script.js`) - Runs on Google's servers, reads/writes to your Sheet

Data flows:
```
Browser → Apps Script URL → Google Sheet
Browser ← Apps Script URL ← Google Sheet
```

No API keys are exposed in the frontend. The Apps Script acts as a secure proxy.

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). Requires JavaScript enabled.

## License

MIT
