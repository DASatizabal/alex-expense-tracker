// Configuration for Alex's Expense Tracker

const APP_VERSION = '2.10.2';

// Supported currencies
const CURRENCIES = {
    USD: { symbol: '$', code: 'USD', name: 'US Dollar', locale: 'en-US' },
    EUR: { symbol: '€', code: 'EUR', name: 'Euro', locale: 'de-DE' },
    GBP: { symbol: '£', code: 'GBP', name: 'British Pound', locale: 'en-GB' },
    CAD: { symbol: '$', code: 'CAD', name: 'Canadian Dollar', locale: 'en-CA' },
    AUD: { symbol: '$', code: 'AUD', name: 'Australian Dollar', locale: 'en-AU' },
    MXN: { symbol: '$', code: 'MXN', name: 'Mexican Peso', locale: 'es-MX' },
    JPY: { symbol: '¥', code: 'JPY', name: 'Japanese Yen', locale: 'ja-JP' },
    INR: { symbol: '₹', code: 'INR', name: 'Indian Rupee', locale: 'en-IN' },
    BRL: { symbol: 'R$', code: 'BRL', name: 'Brazilian Real', locale: 'pt-BR' },
    CHF: { symbol: 'CHF', code: 'CHF', name: 'Swiss Franc', locale: 'de-CH' }
};

const DEFAULT_CURRENCY = 'USD';

const CONFIG = {
    // Encryption settings for password protection
    ENCRYPTION: {
        ALGORITHM: 'AES-GCM',
        KEY_LENGTH: 256,
        PBKDF2_ITERATIONS: 100000,
        AUTO_LOCK_MINUTES: 5
    },

    // Exchange rate API (Open Exchange Rates)
    EXCHANGE_RATE_URL: 'https://openexchangerates.org/api/latest.json',
    EXCHANGE_RATE_API_KEY: '4df6530bf55348d8a952d0c4c4e4ccd2',
    EXCHANGE_RATE_CACHE_HOURS: 6,  // Refresh rates every 6 hours

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
        amount: 1371.50,
        type: 'goal',
        dueDate: new Date(2026, 6, 23), // Due July 23, 2026 (month is 0-indexed)
        description: 'Cruise savings goal - $1,371.50 by July 23, 2026'
    },
    {
        id: 'electric',
        name: 'Electric',
        icon: '\u{26A1}',
        amount: 100,       // Estimated monthly amount
        type: 'variable',
        dueDay: 15,
        description: 'Electric bill (varies by usage)'
    }
];

// Calculate total monthly expenses (recurring + loan + variable payments)
const MONTHLY_TOTAL = EXPENSES
    .filter(e => e.type === 'recurring' || e.type === 'loan' || e.type === 'variable')
    .reduce((sum, e) => sum + e.amount, 0);
