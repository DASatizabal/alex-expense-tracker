# CLAUDE.md - AI Assistant Guide for Alex's Expense Tracker

## Project Overview

Alex's Expense Tracker is a Progressive Web App (PWA) for tracking recurring expenses, loan payments, and savings goals. It features a dark glassmorphism UI and syncs with Google Sheets for cloud storage.

**Current Version:** 2.8.0
**Live Site:** https://dasatizabal.github.io/alex-expense-tracker/

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, Vanilla JavaScript (ES6+), Tailwind CSS (CDN), Lucide Icons |
| Backend | Google Apps Script (serverless) |
| Storage | Google Sheets (primary), localStorage with AES-GCM encryption (fallback) |
| Hosting | GitHub Pages |

**No build tools or package manager** - this is a zero-dependency vanilla JS project that runs directly in the browser.

## Project Structure

```
alex-expense-tracker/
├── index.html              # Main HTML page with Tailwind config, modals, and UI structure
├── manifest.json           # PWA manifest for installability
├── sw.js                   # Service worker for offline support and caching
├── google-apps-script.js   # Backend script (deployed to Google Apps Script)
├── css/
│   └── styles.css          # Custom CSS: light mode overrides, animations, status colors
├── js/
│   ├── config.js           # App config: version, currencies, expenses, API URL
│   ├── encryption.js       # Web Crypto API encryption module (AES-GCM + PBKDF2)
│   ├── sheets-api.js       # Data layer: Google Sheets API + localStorage fallback
│   ├── i18n.js             # Internationalization: English, Spanish, Haitian Creole
│   └── app.js              # Main application logic (~1500 lines)
├── icons/                  # PWA icons (192x192, 512x512, maskable)
├── CLAUDE.md               # This file
├── README.md               # User documentation
├── SETUP.md                # Google Sheets setup guide
├── RESUME.md               # Project summary
└── TODO.md                 # Expansion roadmap
```

## Key Files Deep Dive

### `js/config.js`
- `APP_VERSION` - Update when releasing new features
- `CURRENCIES` - 10 supported currencies with symbols and locales
- `CONFIG.APPS_SCRIPT_URL` - Google Apps Script endpoint
- `CONFIG.USE_LOCAL_STORAGE` - Toggle between cloud sync and offline mode
- `CONFIG.ENCRYPTION` - AES-GCM settings, PBKDF2 iterations, auto-lock timeout
- `EXPENSES[]` - Array of expense objects (recurring, loan, goal types)

### `js/app.js`
Main application entry point. Key functions:
- `init()` - App initialization after password unlock
- `renderExpenseCards()` / `renderPaymentHistory()` - UI rendering
- `getExpenseStatus()` - Calculate paid/due-soon/overdue status
- `getSortedExpenses()` - Sort by status and due date
- `openPaymentModal()` / `handlePaymentSubmit()` - Payment CRUD
- `lockApp()` / `handleUnlock()` - Password protection flow
- Theme, currency, and language initialization

### `js/sheets-api.js`
Data abstraction layer with session management:
- `SheetsAPI.getPayments()` / `savePayment()` / `deletePayment()` / `updatePayment()`
- `setSession()` / `clearSession()` - In-memory decrypted data cache
- Sync status indicator (`synced`, `syncing`, `offline`, `error`)
- `exportToCSV()` - Export payments to CSV file

### `js/encryption.js`
Client-side encryption using Web Crypto API:
- `Encryption.encrypt()` / `decrypt()` - AES-GCM encryption
- `hashPassword()` / `verifyPassword()` - PBKDF2 password hashing
- `migrateToEncrypted()` - Migrate unencrypted localStorage data

### `js/i18n.js`
Internationalization module:
- `I18n.t(key, params)` - Get translation with interpolation
- `I18n.plural(key, count)` - Pluralization support
- `I18n.translatePage()` - Translate all `data-i18n` attributes
- Languages: `en` (English), `es` (Spanish), `ht` (Haitian Creole)

## Expense Types

| Type | Fields | Behavior |
|------|--------|----------|
| `recurring` | `amount`, `dueDay` | Monthly bills, tracks credit/past-due balance |
| `loan` | `amount`, `dueDay`, `totalPayments` | Fixed payment count, shows progress bar |
| `goal` | `amount`, `dueDate` | Savings target, calculates per-paycheck amounts |

## Data Flow

```
User Action → app.js → SheetsAPI
                          ├─→ Google Apps Script → Google Sheet (cloud mode)
                          └─→ Encryption → localStorage (offline/fallback)
```

## Development Workflow

### Running Locally
1. Open `index.html` directly in a browser, OR
2. Use a local server: `python -m http.server 8000` then visit `http://localhost:8000`

### Making Changes
1. Edit files directly - no build step required
2. Refresh browser to see changes
3. Service worker may cache assets - clear cache or use incognito for testing

### Testing
- **Manual testing** - No automated test suite currently
- Test across browsers (Chrome, Firefox, Safari, Edge)
- Test both cloud sync and localStorage modes
- Test password protection flow (setup, unlock, lock, reset)
- Test offline mode by disabling network

### Deploying
1. Commit changes to git
2. Push to GitHub - GitHub Pages auto-deploys from main branch
3. Service worker version (`CACHE_NAME` in `sw.js`) should be incremented for cache updates

## Coding Conventions

### JavaScript
- **Vanilla JS only** - No frameworks, no jQuery
- **ES6+ features** - async/await, template literals, arrow functions, destructuring
- **Global functions** - Functions are global for onclick handlers in HTML
- **DOM references** - Cached at module level (`const expensesContainer = document.getElementById(...)`)
- **Date handling** - Use `parseLocalDate()` for "YYYY-MM-DD" strings to avoid timezone issues

### CSS
- **Tailwind first** - Use Tailwind utility classes in HTML
- **Custom CSS** - Only for features Tailwind can't handle (animations, light mode overrides)
- **Light mode** - Implemented via `.light-mode` class overrides in `styles.css`
- **Status colors** - `.expense-card-paid` (green), `.expense-card-due-soon` (yellow), `.expense-card-overdue` (red), `.expense-card-pending` (violet)

### HTML
- **Semantic HTML5** - `<header>`, `<section>`, `<button>`, etc.
- **data-i18n attributes** - For translatable text content
- **data-i18n-placeholder** - For translatable placeholders
- **data-i18n-title** - For translatable tooltips
- **Lucide icons** - `<i data-lucide="icon-name">` (initialized by `lucide.createIcons()`)

### Naming Conventions
- **Functions**: camelCase (`renderExpenseCards`, `handlePaymentSubmit`)
- **Constants**: UPPER_SNAKE_CASE (`APP_VERSION`, `EXPENSES`, `CURRENCIES`)
- **DOM IDs**: kebab-case (`expenses-container`, `payment-modal`)
- **CSS classes**: Tailwind utilities or kebab-case custom classes

## Common Tasks

### Adding a New Expense
Edit `js/config.js` and add to the `EXPENSES` array:
```javascript
{
    id: 'unique-id',        // Used as payment category
    name: 'Display Name',
    icon: '\u{1F4B0}',      // Unicode emoji
    amount: 100,
    type: 'recurring',      // or 'loan' or 'goal'
    dueDay: 15,             // For recurring/loan
    // dueDate: new Date(), // For goal
    // totalPayments: 60,   // For loan
    description: 'Optional description'
}
```

### Adding a New Translation
1. Add key to all language objects in `js/i18n.js`:
```javascript
translations: {
    en: { 'new.key': 'English text' },
    es: { 'new.key': 'Spanish text' },
    ht: { 'new.key': 'Creole text' }
}
```
2. Use in code: `I18n.t('new.key')` or `I18n.t('new.key', { param: value })`
3. Use in HTML: `<span data-i18n="new.key">Fallback</span>`

### Adding a New Currency
Add to `CURRENCIES` in `js/config.js`:
```javascript
XXX: { symbol: 'X$', code: 'XXX', name: 'Currency Name', locale: 'xx-XX' }
```

### Modifying the Google Apps Script Backend
1. Edit `google-apps-script.js`
2. Copy code to Google Apps Script editor (Extensions > Apps Script)
3. Deploy new version (Deploy > Manage deployments > Edit > New version)

## Security Considerations

- **Password protection** - Uses PBKDF2 (100,000 iterations) + AES-GCM
- **No plaintext storage** - Encrypted data in localStorage, password hash only (no plaintext)
- **Auto-lock** - 5 minute inactivity timeout (configurable in `CONFIG.ENCRYPTION.AUTO_LOCK_MINUTES`)
- **CORS** - Google Apps Script uses `text/plain` Content-Type to avoid preflight
- **No API keys exposed** - Apps Script acts as secure proxy to Google Sheets

## Known Limitations

- **No automated tests** - Manual testing only
- **Single user** - Designed for personal use, not multi-tenant
- **iOS PWA limitations** - Push notifications not supported on iOS Safari
- **Pay period hardcoded** - Biweekly starting Jan 22, 2026 (in `getCurrentPayPeriod()`)

## Roadmap Reference

See `TODO.md` for the full expansion roadmap including:
- Multi-tenant architecture
- User templates (College Student, Young Professional, etc.)
- Expanded expense types (weekly, quarterly, annual, variable)
- n8n/webhook notifications
- Mobile apps (Capacitor, React Native)
- Bank sync (Plaid)
- Analytics and predictions

## Quick Reference

### File Loading Order (index.html)
```html
<script src="js/config.js"></script>      <!-- 1. Configuration -->
<script src="js/encryption.js"></script>  <!-- 2. Encryption module -->
<script src="js/sheets-api.js"></script>  <!-- 3. Data layer -->
<script src="js/i18n.js"></script>        <!-- 4. Translations -->
<script src="js/app.js"></script>         <!-- 5. Main app -->
```

### Key Global Objects
- `CONFIG` - App configuration
- `EXPENSES` - Expense definitions array
- `CURRENCIES` - Currency definitions object
- `SheetsAPI` - Data access layer
- `Encryption` - Crypto utilities
- `I18n` - Internationalization module

### localStorage Keys
- `alex_expense_encrypted` - Encrypted payment data
- `alex_password_hash` - Password hash + salt
- `alex_expense_theme` - "light" or "dark"
- `alex_expense_currency` - Currency code (USD, EUR, etc.)
- `alex_expense_language` - Language code (en, es, ht)
- `alex_expense_payments` - Legacy unencrypted data (migrated on password setup)

---

*Last updated: January 2026 (v2.8.0)*
