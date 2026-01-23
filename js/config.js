// Configuration for Alex's Expense Tracker

const APP_VERSION = '2.1.0';

const CONFIG = {
    // Google Apps Script URL
    // To set up:
    // 1. Create a Google Sheet with a "Payments" tab
    // 2. Add headers: Date | Category | Amount | Notes | ID
    // 3. Copy google-apps-script.js to Extensions > Apps Script
    // 4. Update SHEET_ID in the script
    // 5. Deploy as Web app with "Anyone" access
    // 6. Paste the deployment URL below

    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwQI_sZ76ZvFCXOdndlyhvI0U2UR3CXdJo_m_1NlCuDAUPS26sYyzzLOl7ZIyKCf_aa/exec',

    // Set to true to use localStorage only (offline mode)
    USE_LOCAL_STORAGE: false
};

// Fixed expense categories
const EXPENSES = [
    {
        id: 'rent',
        name: 'Rent',
        icon: '\u{1F3E0}',
        amount: 300,
        type: 'recurring',
        dueDay: 1, // Due on the 1st of each month
        description: 'Monthly rent payment'
    },
    {
        id: 'insurance',
        name: 'Insurance',
        icon: '\u{1F6E1}',
        amount: 300,
        type: 'recurring',
        dueDay: 23, // Due on the 23rd of each month
        description: 'Monthly insurance payment'
    },
    {
        id: 'phone',
        name: 'Phone',
        icon: '\u{1F4F1}',
        amount: 50,
        type: 'recurring',
        dueDay: 1, // Due on the 1st of each month
        description: 'Monthly phone bill'
    },
    {
        id: 'car',
        name: 'Car Payment',
        icon: '\u{1F697}',
        amount: 300,
        type: 'loan',
        dueDay: 1, // Due on the 1st of each month
        totalPayments: 84, // 84 months total
        description: 'Car loan - $300/month for 84 months'
    },
    {
        id: 'cruise',
        name: 'Cruise',
        icon: '\u{1F6F3}',
        amount: 1371.33,
        type: 'goal',
        dueDate: new Date('2026-07-23'), // Due July 23, 2026
        description: 'Cruise savings goal - $1,371.33 by July 23, 2026'
    }
];

// Calculate total monthly expenses (recurring + loan payments)
const MONTHLY_TOTAL = EXPENSES
    .filter(e => e.type === 'recurring' || e.type === 'loan')
    .reduce((sum, e) => sum + e.amount, 0);
