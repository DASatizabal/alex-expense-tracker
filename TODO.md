# Alex Expense Tracker - Expansion Roadmap

## 🎯 Vision Statement

Transform this single-user expense tracker into a **multi-tenant personal finance platform** with intelligent automation, cross-platform access, and seamless onboarding.

---

## 📍 Phase 1: Foundation (1-2 weeks)
*Low effort, high impact — get the basics right*

### Authentication & Security

| Feature | Implementation | Notes |
|---------|---------------|-------|
| **Simple PIN/Password** | localStorage encrypted with Web Crypto API | ✅ **DONE v2.4.0** - AES-GCM + PBKDF2 |
| **Google OAuth** | Firebase Auth or Supabase | ✅ **DONE v2.12.0** - Firebase Auth with Google Sign-In |
| **Session timeout** | Auto-lock after X minutes of inactivity | ✅ **DONE v2.4.0** - 5 min auto-lock |
| **Data encryption** | Encrypt localStorage payload | ✅ **DONE v2.4.0** - Full encryption |

### User Experience Quick Wins

- [x] Dark/Light theme toggle — ✅ **DONE v2.5.2** - CSS override approach, exact v2.4.1 dark + traditional light
- [x] Currency selector — **DONE v2.7.0** - 10 currencies with localStorage persistence
- [x] Language i18n skeleton — **DONE v2.9.0** - full translation system with English, Spanish, Haitian Creole
- [x] Language selector — **DONE v2.9.0** - switch languages with browser auto-detection
- [x] PWA manifest — **DONE v2.6.0** - installable on home screen with service worker
- [x] Offline indicator — **DONE v2.8.0** - sync status indicator (synced/syncing/offline)

### User Admin Panel

- [x] **Admin link in header** — Settings/gear icon next to lock button ✅ **DONE v2.10.0**
- [x] **Expense management** — Add, edit, delete expense cards (stored in localStorage) ✅ **DONE v2.10.0**
- [x] **Default currency setting** — Choose base currency for all expenses ✅ **DONE v2.10.0**
- [x] **Real-time currency conversion** — Convert amounts using previous day's exchange rates ✅ **DONE v2.11.0** - Open Exchange Rates API with 6hr cache

**Currency Conversion Implementation:**
```javascript
// Use free API like exchangerate-api.com or frankfurter.app
// Store base currency in localStorage
// On display: convert from base currency to selected display currency
// Rate source: Previous day's closing rate (standard practice)

const CurrencyConverter = {
    baseRate: null,  // Cached rates
    lastFetch: null,

    async getRates() {
        // Fetch once per session, cache for 24h
        // GET https://api.frankfurter.app/latest?from=USD
    },

    convert(amount, from, to) {
        // amount * (rates[to] / rates[from])
    }
};
```

**Admin Panel UI:**
```
┌─────────────────────────────────────────────────┐
│  ⚙️ Settings                              [X]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  Default Currency: [USD ▼]                      │
│  (All expenses stored in this currency)         │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  📋 Manage Expenses                             │
│                                                 │
│  🏠 Rent              $300    Due: 1st   [✏️][🗑️]│
│  🚗 Car Insurance     $150    Due: 15th  [✏️][🗑️]│
│  📱 Phone             $50     Due: 22nd  [✏️][🗑️]│
│  🚢 Cruise (Goal)     $1800   Jul 2026   [✏️][🗑️]│
│                                                 │
│  [+ Add New Expense]                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📍 Phase 2: Multi-User & Templates (2-4 weeks)
*Enable scaling to multiple users*

### Multi-Tenant Architecture

```
Current:  Browser → Google Sheet (single user)
Future:   Browser → Auth → API → User's Sheet OR shared DB
```

**Option A: Google Sheets per user**
- Each user gets their own Sheet (created on signup)
- Pros: Free, users own their data
- Cons: Harder to manage, slower

**Option B: Centralized database**
- Supabase/Firebase/PlanetScale
- Pros: Fast, easier analytics, real multi-tenancy
- Cons: Hosting costs, you hold user data

**Recommendation:** Start with Option A for privacy-conscious users, offer Option B as "premium cloud sync"

### User Template System

**Config Template Generator:**
```javascript
// templates/college-student.js
{
  name: "College Student",
  expenses: [
    { id: 'rent', name: 'Rent', type: 'recurring', dueDay: 1 },
    { id: 'tuition', name: 'Tuition', type: 'goal', icon: '🎓' },
    { id: 'student-loan', name: 'Student Loan', type: 'loan' },
    { id: 'phone', name: 'Phone', type: 'recurring' },
    { id: 'spotify', name: 'Spotify', type: 'recurring', amount: 5.99 },
  ],
  payPeriod: 'biweekly', // or 'monthly', 'weekly'
  paycheckStart: null // user sets during onboarding
}
```

### Pre-built Templates

| Template | Target User | Key Expenses |
|----------|-------------|--------------|
| College Student | 18-24, part-time job | Rent, tuition, subscriptions, student loans |
| Young Professional | 25-35, steady income | Rent, car, 401k, emergency fund, vacation |
| Family Household | 30-50, dual income | Mortgage, daycare, car x2, college savings |
| Freelancer | Variable income | Quarterly taxes, health insurance, retirement |
| Debt Payoff | Anyone | Snowball/avalanche debt strategy focused |
| Minimalist | Simple needs | Rent, utilities, food budget, one savings goal |

### Onboarding Wizard

**Step-by-step flow:**

```
┌─────────────────────────────────────────┐
│  Step 1: Welcome                        │
│  "Let's set up your expense tracker"    │
│  [Start Fresh] [Use Template] [Import]  │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  Step 2: Pay Schedule                   │
│  How often do you get paid?             │
│  ○ Weekly  ○ Biweekly  ○ Monthly        │
│  ○ 1st & 15th  ○ Irregular/Freelance    │
│  When is your next payday? [Date Picker]│
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  Step 3: Choose Template (optional)     │
│  [College Student] [Young Professional] │
│  [Family] [Freelancer] [Debt Payoff]    │
│  [Start from scratch]                   │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  Step 4: Customize Expenses             │
│  ✓ Rent............... $____  Due: __  │
│  ✓ Car Payment........ $____  Due: __  │
│  ☐ Student Loan....... $____  Due: __  │
│  [+ Add Custom Expense]                 │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  Step 5: Notifications                  │
│  How should we remind you?              │
│  ☐ Email  ☐ SMS  ☐ Push  ☐ None        │
│  Remind me ___ days before due          │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  Step 6: You're all set! 🎉            │
│  Monthly total: $1,247                  │
│  Next due: Rent in 3 days               │
│  [Go to Dashboard]                      │
└─────────────────────────────────────────┘
```

---

## 📍 Phase 3: Smart Expense Types (2-3 weeks)
*More flexible than just recurring/loan/goal*

### Expanded Expense Type System

```javascript
const EXPENSE_TYPES = {
  // ═══ RECURRING ═══
  'monthly': {
    label: 'Monthly Bill',
    icon: '📅',
    fields: ['amount', 'dueDay'],
    recurrence: 'monthly',
    examples: ['Rent', 'Insurance', 'Subscriptions']
  },
  
  'weekly': {
    label: 'Weekly Expense',
    icon: '🔄',
    fields: ['amount', 'dayOfWeek'],
    recurrence: 'weekly',
    examples: ['Groceries', 'Gas', 'Allowance']
  },
  
  'per-paycheck': {
    label: 'Per Paycheck',
    icon: '💵',
    fields: ['amount', 'paycheckNumber'], // 1st, 2nd, or both
    recurrence: 'paycheck',
    examples: ['Savings transfer', '401k contribution']
  },
  
  'quarterly': {
    label: 'Quarterly',
    icon: '📊',
    fields: ['amount', 'months'], // e.g., [3, 6, 9, 12]
    recurrence: 'quarterly',
    examples: ['Estimated taxes', 'Insurance premium']
  },
  
  'annual': {
    label: 'Annual',
    icon: '🎂',
    fields: ['amount', 'dueDate'],
    recurrence: 'yearly',
    examples: ['Amazon Prime', 'Car registration', 'Property tax']
  },
  
  // ═══ GOALS ═══
  'goal-by-date': {
    label: 'Save by Date',
    icon: '🎯',
    fields: ['targetAmount', 'dueDate'],
    calculates: 'perPaycheckAmount',
    examples: ['Vacation', 'Wedding', 'Down payment']
  },
  
  'goal-ongoing': {
    label: 'Ongoing Savings',
    icon: '🐷',
    fields: ['targetAmount'], // no end date
    examples: ['Emergency fund', 'Retirement']
  },
  
  // ═══ DEBT ═══
  'loan-fixed': {
    label: 'Fixed Loan',
    icon: '🏦',
    fields: ['amount', 'dueDay', 'totalPayments', 'interestRate'],
    tracks: ['paymentCount', 'remainingBalance', 'payoffDate'],
    examples: ['Car loan', 'Personal loan']
  },
  
  'loan-revolving': {
    label: 'Credit Card',
    icon: '💳',
    fields: ['currentBalance', 'minimumPayment', 'interestRate', 'dueDay'],
    tracks: ['balance', 'interestPaid'],
    examples: ['Credit cards', 'HELOC']
  },
  
  'loan-student': {
    label: 'Student Loan',
    icon: '🎓',
    fields: ['amount', 'dueDay', 'interestRate', 'servicer'],
    tracks: ['principal', 'interest', 'forgiveness eligibility'],
    examples: ['Federal loans', 'Private loans']
  },
  
  // ═══ IRREGULAR ═══
  'variable': {
    label: 'Variable Amount',
    icon: '📈',
    fields: ['estimatedAmount', 'dueDay'],
    tracks: ['averageAmount', 'history'],
    examples: ['Utilities', 'Electric bill']
  },
  
  'one-time': {
    label: 'One-Time Expense',
    icon: '📌',
    fields: ['amount', 'dueDate'],
    examples: ['Medical bill', 'Repair', 'Tax payment']
  }
};
```

### Smart Calculations

| Type | Auto-calculates |
|------|-----------------|
| `goal-by-date` | Per-paycheck amount needed, progress % |
| `loan-fixed` | Remaining balance, payments left, payoff date |
| `loan-revolving` | Interest cost, payoff timeline at current rate |
| `variable` | 3-month average, trend (↑↓) |
| `annual` | Monthly "set aside" amount |

---

## 📍 Phase 4: Notifications & Automation (2-3 weeks)
*n8n, webhooks, and smart reminders*

### n8n Integration Architecture

```
┌──────────────┐     webhook      ┌──────────────┐
│ Expense App  │ ──────────────→ │     n8n      │
│              │                  │              │
│ Events:      │                  │ Workflows:   │
│ - Due soon   │                  │ - Send SMS   │
│ - Overdue    │                  │ - Send email │
│ - Goal hit   │                  │ - Slack msg  │
│ - Paid       │                  │ - Log to DB  │
└──────────────┘                  └──────────────┘
```

### Webhook Events

```javascript
// Events the app can emit
const WEBHOOK_EVENTS = {
  'expense.due_soon': {
    triggers: '3 days before due',
    payload: { expense, daysUntil, amount }
  },
  'expense.due_today': {
    triggers: 'Day of due date',
    payload: { expense, amount }
  },
  'expense.overdue': {
    triggers: '1 day after due',
    payload: { expense, daysOverdue, amount }
  },
  'expense.paid': {
    triggers: 'When marked paid',
    payload: { expense, payment, remainingBalance }
  },
  'goal.milestone': {
    triggers: '25%, 50%, 75%, 100%',
    payload: { goal, milestone, currentAmount, targetAmount }
  },
  'goal.achieved': {
    triggers: 'Target reached',
    payload: { goal, totalSaved, daysAhead }
  },
  'loan.payoff': {
    triggers: 'Final payment',
    payload: { loan, totalPaid, monthsToPayoff }
  },
  'summary.weekly': {
    triggers: 'Every Sunday',
    payload: { paidThisWeek, dueNextWeek, savingsProgress }
  },
  'summary.payday': {
    triggers: 'On payday',
    payload: { dueThisPeriod, totalNeeded, discretionary }
  }
};
```

### n8n Workflow Examples

**1. SMS Reminder (Twilio)**
```
Trigger: Webhook (expense.due_soon)
    ↓
IF: expense.amount > $100
    ↓
Twilio: Send SMS
  "💰 Reminder: {{expense.name}} (${{expense.amount}}) 
   is due in {{daysUntil}} days"
```

**2. Payday Summary (Email)**
```
Trigger: Schedule (every payday)
    ↓
HTTP Request: GET /api/summary
    ↓
Gmail: Send email with template
  Subject: "Payday Breakdown - ${{totalDue}} due this period"
```

**3. Goal Celebration (Slack + Confetti)**
```
Trigger: Webhook (goal.achieved)
    ↓
Slack: Post to #wins channel
  "🎉 {{userName}} just hit their {{goal.name}} goal!"
    ↓
HTTP Request: POST /api/confetti (trigger in-app animation)
```

**4. Overdue Escalation**
```
Trigger: Webhook (expense.overdue)
    ↓
Wait: 2 days
    ↓
IF: Still unpaid
    ↓
Send: More urgent reminder + partner notification
```

### Notification Preferences UI

```
┌─────────────────────────────────────────────────┐
│  🔔 Notification Settings                       │
├─────────────────────────────────────────────────┤
│                                                 │
│  Remind me before due dates:                    │
│  [▼ 3 days before]                              │
│                                                 │
│  Channels:                                      │
│  ☑ Push notifications (this device)            │
│  ☑ Email: alex@email.com                        │
│  ☐ SMS: +1 (555) 123-4567                       │
│  ☐ Slack webhook: [Configure]                   │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  Special Alerts:                                │
│  ☑ Payday summary                               │
│  ☑ Weekly recap (Sundays)                       │
│  ☑ Goal milestones (25%, 50%, 75%, 100%)        │
│  ☑ Overdue warnings                             │
│  ☐ Partner notifications (invite someone)       │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  Quiet Hours:                                   │
│  Don't notify between [10 PM] and [8 AM]        │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📍 Phase 5: Mobile Apps (4-8 weeks)
*Cross-platform with code reuse*

### Technology Options

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **PWA (current + enhanced)** | No app store, instant updates, works now | No push on iOS, limited native features | Quick MVP |
| **React Native** | True native, one codebase, huge ecosystem | Learning curve, build complexity | Serious app |
| **Flutter** | Beautiful UI, fast, growing | Dart language, larger app size | Polish matters |
| **Capacitor + Current Code** | Reuse existing JS/HTML, native wrapper | Performance limits, hybrid feel | Fastest path |
| **Kotlin/Swift Native** | Best performance, full platform access | Two codebases, expensive | Enterprise |

**Recommendation:** **Capacitor** for v1 (wrap current web app), then **React Native** for v2 if traction proves out.

### Mobile-Specific Features

| Feature | Why It Matters |
|---------|---------------|
| **Biometric unlock** | Face ID / fingerprint instead of PIN |
| **Push notifications** | Real reminders, not just email |
| **Widgets** | Glanceable "next due" on home screen |
| **Quick actions** | Long-press icon → "Mark rent paid" |
| **Apple Pay / Google Pay** | One-tap to actual payment (future) |
| **Siri / Google Assistant** | "Hey Siri, mark my rent as paid" |
| **Offline-first** | Full functionality without internet |
| **Share sheet** | Share receipt image → auto-log expense |

### Widget Designs

**iOS Widget (Small):**
```
┌─────────────────┐
│  💰 Next Due    │
│  ─────────────  │
│  🏠 Rent        │
│  $300 • 3 days  │
└─────────────────┘
```

**iOS Widget (Medium):**
```
┌─────────────────────────────────┐
│  📊 This Pay Period             │
│  ─────────────────────────────  │
│  Due: $650    Paid: $350        │
│  ████████░░░░░░░  54%           │
│  ─────────────────────────────  │
│  🏠 Rent $300 (3d) │ 📱 Phone ✓ │
└─────────────────────────────────┘
```

---

## 📍 Phase 6: Intelligence & Analytics (4-6 weeks)
*Make the app smarter*

### Dashboard Analytics

```
┌─────────────────────────────────────────────────┐
│  📈 Insights                                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  Monthly Trends (last 6 months)                 │
│  ┌─────────────────────────────────────────┐   │
│  │     $1,400 ─┐     ┌─── $1,350          │   │
│  │  $1,200 ─┐  │  ┌──┘                     │   │
│  │          └──┴──┘                        │   │
│  │  Aug  Sep  Oct  Nov  Dec  Jan           │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Category Breakdown                             │
│  ████████████████████  Housing    45%          │
│  ████████████         Transport   28%          │
│  ██████               Savings     15%          │
│  ████                 Other       12%          │
│                                                 │
│  💡 Insights                                    │
│  • You've paid rent on time 8 months in a row! │
│  • Car loan: 12 of 84 payments (14%) complete  │
│  • Cruise goal: On track, $45/paycheck needed  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Smart Predictions

| Prediction | How It Works |
|------------|--------------|
| **"You'll be short $127 this period"** | Compare due amounts vs typical income pattern |
| **"Consider paying car early"** | Detect surplus and suggest extra payment |
| **"Electric bill usually higher in summer"** | Historical pattern matching |
| **"Goal at risk"** | Missed 2 contributions, recalculate needed amount |
| **"Loan payoff: Oct 2028"** | Project based on current pace |

### Gamification

| Element | Implementation |
|---------|---------------|
| **Streaks** | "🔥 14-day streak: All bills paid on time" |
| **Badges** | "🏆 Debt Slayer: Paid off 3 loans" |
| **Progress rings** | Apple Watch-style completion rings |
| **Milestones** | Celebrate every $1,000 saved |
| **Leaderboard** | Optional: compare with friends/family |

---

## 📍 Phase 7: Integrations (Ongoing)
*Connect to the financial ecosystem*

### Bank Connections (Plaid)

```
┌─────────────────────────────────────────────────┐
│  🏦 Connected Accounts                          │
├─────────────────────────────────────────────────┤
│  Chase Checking ••••4521          $2,847.23    │
│  Last synced: 2 min ago           [Refresh]    │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  Auto-detect payments:                          │
│  ☑ Match transactions to expenses              │
│  ☑ Auto-mark paid when detected                │
│  ☐ Import new recurring transactions            │
│                                                 │
│  [+ Connect Another Account]                    │
└─────────────────────────────────────────────────┘
```

**Value:** Auto-detect when rent clears → mark as paid automatically.

### Other Integrations

| Integration | Purpose |
|-------------|---------|
| **Plaid** | Bank account sync, transaction matching |
| **Google Calendar** | Due dates as calendar events |
| **Apple Reminders** | Sync with native reminders |
| **YNAB / Mint import** | Migrate from other apps |
| **Venmo/PayPal** | Track person-to-person payments |
| **Receipt scanning** | OCR receipts → auto-fill amount |
| **Zapier/Make** | Broader automation ecosystem |
| **Home Assistant** | "Rent is due" announcement on smart speaker |

---

## 📍 Phase 8: Monetization (When Ready)
*Sustainable business model*

### Freemium Tiers

| Feature | Free | Pro ($3/mo) | Family ($6/mo) |
|---------|------|-------------|----------------|
| Expenses tracked | 10 | Unlimited | Unlimited |
| History | 3 months | Forever | Forever |
| Templates | Basic | All + custom | All + custom |
| Notifications | Email only | All channels | All channels |
| Bank sync | ✗ | ✓ | ✓ |
| Analytics | Basic | Advanced | Advanced |
| Users | 1 | 1 | Up to 5 |
| Shared expenses | ✗ | ✗ | ✓ |
| Export | CSV | CSV + PDF | CSV + PDF |
| Support | Community | Email | Priority |

### Alternative Models

| Model | Pros | Cons |
|-------|------|------|
| **Freemium** | Wide adoption, upsell path | Most users stay free |
| **One-time purchase** | Simple, user-friendly | No recurring revenue |
| **Affiliate** | Earn from bank/card referrals | Conflict of interest feel |
| **White-label** | B2B licensing to employers/banks | Sales complexity |
| **Open source + hosted** | Community goodwill, hosted premium | Support burden |

---

## 🗺️ Roadmap Summary

```
NOW (Week 1-2)
├── [x] PIN/password protection (v2.4.0)
├── [x] Dark/light theme toggle (v2.5.2)
├── [x] PWA manifest (v2.6.0)
├── [x] Currency selector (v2.7.0)
├── [x] Offline indicator (v2.8.0)
├── [x] Edit payment (v2.8.0)
├── [x] Basic export to CSV (v2.8.0)
├── [x] Language i18n skeleton (v2.9.0)
├── [x] Spanish & Haitian Creole translations (v2.9.0)
└── [x] User admin panel (v2.10.0)

SHORT-TERM (Month 1-2)
├── [x] Real-time currency conversion (v2.11.0)
├── [x] Google OAuth (v2.12.0)
├── [ ] Onboarding wizard
├── [ ] 3-5 user templates
├── [ ] Expanded expense types
└── [ ] n8n webhook integration

MEDIUM-TERM (Month 3-4)
├── [ ] Multi-user (each user → own Sheet)
├── [ ] Push notifications (web)
├── [ ] Mobile app v1 (Capacitor wrap)
├── [ ] Basic analytics dashboard
└── [ ] Email notification system

LONG-TERM (Month 5+)
├── [ ] React Native rewrite
├── [ ] Bank sync (Plaid)
├── [ ] Advanced predictions
├── [ ] Family/shared accounts
├── [ ] iOS/Android widgets
└── [ ] Monetization launch
```

---

## 💡 Bonus Ideas

| Idea | Description |
|------|-------------|
| **"What if" simulator** | "What if I paid $50 extra on car loan?" → show new payoff date |
| **Debt snowball/avalanche** | Built-in debt payoff strategies |
| **Couples mode** | Shared view, split expenses, "who owes who" |
| **Receipt vault** | Photo storage linked to payments |
| **Tax prep export** | Categorize deductible expenses for tax time |
| **Currency travel mode** | Track expenses in foreign currency while traveling |
| **Voice logging** | "Paid rent today" → logged via speech |
| **AI categorization** | Auto-suggest category based on name/amount |
| **Bill negotiation prompts** | "Your insurance is higher than average. Negotiate?" |
| **Financial health score** | Simple score based on on-time payments, savings rate |

---

## 📋 Quick Reference

### Current Tech Stack
- **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS (CDN), Lucide Icons
- **Backend**: Google Apps Script (serverless)
- **Storage**: Google Sheets (primary), localStorage (fallback)
- **Hosting**: GitHub Pages

### File Structure
```
alex-expense-tracker/
├── index.html              # Main HTML page
├── google-apps-script.js   # Backend script
├── css/
│   └── styles.css          # Custom styling
├── js/
│   ├── config.js           # Configuration (expenses, Firebase, auth roles)
│   ├── firebase-auth.js    # Google OAuth via Firebase Authentication
│   ├── i18n.js             # Internationalization (EN, ES, HT)
│   ├── sheets-api.js       # API layer (cloud + localStorage, per-user)
│   └── app.js              # Main application logic
├── README.md
├── SETUP.md
└── RESUME.md
```

---

*Last updated: February 2026*
