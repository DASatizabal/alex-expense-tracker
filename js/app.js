// Main Application Logic for Alex's Expense Tracker

// Theme Management
function initTheme() {
    // Theme is global (not user-scoped) for instant loading before auth
    const savedTheme = localStorage.getItem('alex_expense_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Default is dark (no class). Light mode adds 'light-mode' class.
    if (savedTheme === 'light' || (!savedTheme && !prefersDark)) {
        document.body.classList.add('light-mode');
        updateThemeIcon(false);
    } else {
        document.body.classList.remove('light-mode');
        updateThemeIcon(true);
    }
}

function toggleTheme() {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('alex_expense_theme', isLight ? 'light' : 'dark');
    updateThemeIcon(!isLight);
}

function updateThemeIcon(isDark) {
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.innerHTML = `<i data-lucide="${isDark ? 'moon' : 'sun'}" class="w-4 h-4 text-slate-500 group-hover:text-violet-400"></i>`;
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// Currency Management
let currentCurrency = DEFAULT_CURRENCY;
let defaultCurrency = DEFAULT_CURRENCY;

// Currency Converter Module - handles exchange rate fetching and conversion
const CurrencyConverter = {
    rates: null,           // { base: 'USD', rates: { EUR: 0.92, ... } }
    lastFetch: null,       // Timestamp of last successful fetch
    STORAGE_KEY: 'alex_exchange_rates',

    /**
     * Fetch exchange rates from Open Exchange Rates API
     * Caches rates to localStorage with timestamp
     */
    async fetchRates() {
        // Check if API key is configured
        if (!CONFIG.EXCHANGE_RATE_API_KEY || CONFIG.EXCHANGE_RATE_API_KEY === 'YOUR_API_KEY_HERE') {
            console.warn('Exchange rate API key not configured');
            this.loadFromCache();
            return false;
        }

        // Skip fetch if rates are still fresh
        if (!this.shouldRefresh()) {
            return true;
        }

        try {
            const url = `${CONFIG.EXCHANGE_RATE_URL}?app_id=${CONFIG.EXCHANGE_RATE_API_KEY}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            // Store rates in memory and localStorage
            this.rates = {
                base: data.base,
                rates: data.rates
            };
            this.lastFetch = Date.now();

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
                base: data.base,
                rates: data.rates,
                timestamp: this.lastFetch
            }));

            return true;
        } catch (error) {
            console.error('Failed to fetch exchange rates:', error);
            // Fall back to cached rates
            this.loadFromCache();
            return false;
        }
    },

    /**
     * Load rates from localStorage cache
     */
    loadFromCache() {
        try {
            const cached = localStorage.getItem(this.STORAGE_KEY);
            if (cached) {
                const data = JSON.parse(cached);
                this.rates = {
                    base: data.base,
                    rates: data.rates
                };
                this.lastFetch = data.timestamp;
                return true;
            }
        } catch (error) {
            console.error('Failed to load cached rates:', error);
        }
        return false;
    },

    /**
     * Get current rates (from memory or cache)
     */
    getRates() {
        if (!this.rates) {
            this.loadFromCache();
        }
        return this.rates;
    },

    /**
     * Convert amount from one currency to another
     * Open Exchange Rates free tier uses USD as base, so all conversions go through USD
     * @param {number} amount - Amount to convert
     * @param {string} fromCurrency - Source currency code
     * @param {string} toCurrency - Target currency code
     * @returns {number|null} - Converted amount or null if rates unavailable
     */
    convert(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) {
            return amount;
        }

        const rates = this.getRates();
        if (!rates || !rates.rates) {
            return null;
        }

        // Open Exchange Rates uses USD as base
        // To convert: amount * (rates[toCurrency] / rates[fromCurrency])
        const fromRate = fromCurrency === 'USD' ? 1 : rates.rates[fromCurrency];
        const toRate = toCurrency === 'USD' ? 1 : rates.rates[toCurrency];

        if (!fromRate || !toRate) {
            return null;
        }

        return amount * (toRate / fromRate);
    },

    /**
     * Check if rates should be refreshed (older than cache duration)
     */
    shouldRefresh() {
        if (!this.lastFetch) {
            this.loadFromCache();
        }

        if (!this.lastFetch) {
            return true;
        }

        const cacheMs = (CONFIG.EXCHANGE_RATE_CACHE_HOURS || 6) * 60 * 60 * 1000;
        return (Date.now() - this.lastFetch) > cacheMs;
    },

    /**
     * Get formatted date string of last successful fetch
     */
    getLastFetchTime() {
        if (!this.lastFetch) {
            this.loadFromCache();
        }

        if (!this.lastFetch) {
            return null;
        }

        const date = new Date(this.lastFetch);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    },

    /**
     * Check if rates are available (either fresh or cached)
     */
    hasRates() {
        return this.getRates() !== null;
    }
};

// Expense Management - load from localStorage or use defaults
let userExpenses = null;

// Get user-scoped storage key
function getUserStorageKey(key) {
    if (typeof FirebaseAuth !== 'undefined' && FirebaseAuth.isSignedIn()) {
        return FirebaseAuth.getUserStoragePrefix() + key;
    }
    return key;
}

function loadExpenses() {
    const storageKey = getUserStorageKey('alex_expense_config');
    const saved = localStorage.getItem(storageKey);
    if (saved) {
        try {
            const config = JSON.parse(saved);
            userExpenses = config.expenses || [];
            defaultCurrency = config.defaultCurrency || DEFAULT_CURRENCY;
            // Convert date strings back to Date objects for goals
            userExpenses = userExpenses.map(e => {
                if (e.type === 'goal' && e.dueDate) {
                    e.dueDate = new Date(e.dueDate);
                }
                return e;
            });
        } catch (e) {
            console.error('Error loading expense config:', e);
            userExpenses = [...EXPENSES];
        }
    } else {
        // Check for legacy unscoped key (migration)
        const legacySaved = localStorage.getItem('alex_expense_config');
        if (legacySaved) {
            try {
                const config = JSON.parse(legacySaved);
                userExpenses = config.expenses || [];
                defaultCurrency = config.defaultCurrency || DEFAULT_CURRENCY;
                userExpenses = userExpenses.map(e => {
                    if (e.type === 'goal' && e.dueDate) {
                        e.dueDate = new Date(e.dueDate);
                    }
                    return e;
                });
                // Save to user-scoped key
                saveExpenseConfig();
            } catch (e) {
                console.error('Error loading legacy expense config:', e);
                userExpenses = [...EXPENSES];
            }
        } else {
            // First time - use default expenses from config.js
            userExpenses = [...EXPENSES];
        }
    }
    return userExpenses;
}

function saveExpenseConfig() {
    const config = {
        expenses: userExpenses,
        defaultCurrency: defaultCurrency
    };
    const storageKey = getUserStorageKey('alex_expense_config');
    localStorage.setItem(storageKey, JSON.stringify(config));
}

function getExpenses() {
    if (!userExpenses) {
        loadExpenses();
    }
    return userExpenses;
}

// Settings Modal Management
function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    renderExpenseList();
    populateDefaultCurrencySelector();
    populateSheetsUrlInput();
    initLucideIcons();
}

// Populate and handle Sheets URL input
function populateSheetsUrlInput() {
    const input = document.getElementById('sheets-url-input');
    if (!input) return;

    // Load current URL
    const currentUrl = SheetsAPI.getUserAppsScriptUrl();
    input.value = currentUrl || '';

    // Handle changes with debounce
    let debounceTimer;
    input.onchange = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const newUrl = input.value.trim();
            SheetsAPI.setUserAppsScriptUrl(newUrl);

            if (newUrl) {
                showToast(I18n.t('toast.sheetsUrlSaved'), 'success');
            } else {
                showToast(I18n.t('toast.sheetsUrlCleared'), 'info');
            }
        }, 500);
    };
}

function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function populateDefaultCurrencySelector() {
    const selector = document.getElementById('default-currency-selector');
    if (!selector) return;

    selector.innerHTML = Object.values(CURRENCIES).map(c =>
        `<option value="${c.code}">${c.code} - ${c.name}</option>`
    ).join('');

    selector.value = defaultCurrency;

    selector.onchange = async (e) => {
        defaultCurrency = e.target.value;
        saveExpenseConfig();

        // Refresh rates since base currency changed
        if (currentCurrency !== defaultCurrency) {
            await CurrencyConverter.fetchRates();
        }
        updateRateStatus();

        // Re-render to reflect new default currency
        renderExpenseCards();
        renderPaymentHistory();
        updateSummary();
        renderExpenseList();

        showToast(I18n.t('toast.defaultCurrencyChanged', { currency: CURRENCIES[defaultCurrency].name }), 'success');
    };
}

function renderExpenseList() {
    const list = document.getElementById('expense-list');
    if (!list) return;

    const expenses = getExpenses();

    if (expenses.length === 0) {
        list.innerHTML = `<p class="text-center text-slate-500 py-4">${I18n.t('history.noPayments')}</p>`;
        return;
    }

    list.innerHTML = expenses.map(expense => {
        const typeLabel = {
            'recurring': I18n.t('settings.typeRecurring'),
            'loan': I18n.t('settings.typeLoan'),
            'goal': I18n.t('settings.typeGoal'),
            'variable': I18n.t('settings.typeVariable')
        }[expense.type] || expense.type;

        return `
            <div class="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <span class="text-2xl">${expense.icon}</span>
                <div class="flex-1 min-w-0">
                    <div class="font-medium text-white truncate">${expense.name}</div>
                    <div class="text-xs text-slate-400">${typeLabel} · ${getCurrencySymbol()}${formatCurrency(expense.amount)}</div>
                </div>
                <button onclick="editExpense('${expense.id}')" class="p-2 hover:bg-violet-500/20 rounded-lg transition-colors group" title="${I18n.t('settings.editExpense')}">
                    <i data-lucide="pencil" class="w-4 h-4 text-slate-500 group-hover:text-violet-400"></i>
                </button>
                <button onclick="deleteExpense('${expense.id}')" class="p-2 hover:bg-red-500/20 rounded-lg transition-colors group" title="${I18n.t('settings.deleteExpense')}">
                    <i data-lucide="trash-2" class="w-4 h-4 text-slate-500 group-hover:text-red-400"></i>
                </button>
            </div>
        `;
    }).join('');

    initLucideIcons();
}

// Expense Form Modal
let editingExpenseId = null;

function openExpenseForm(expenseId = null) {
    editingExpenseId = expenseId;
    const modal = document.getElementById('expense-form-modal');
    const title = document.getElementById('expense-form-title');
    const form = document.getElementById('expense-form');

    // Reset form
    form.reset();
    document.getElementById('expense-edit-id').value = '';

    if (expenseId) {
        // Edit mode
        title.textContent = I18n.t('settings.editExpense');
        const expense = getExpenses().find(e => e.id === expenseId);
        if (expense) {
            document.getElementById('expense-edit-id').value = expense.id;
            document.getElementById('expense-name').value = expense.name;
            document.getElementById('expense-icon').value = expense.icon;
            document.getElementById('expense-type').value = expense.type;
            document.getElementById('expense-amount').value = expense.amount;
            if (expense.dueDay) {
                document.getElementById('expense-due-day').value = expense.dueDay;
            }
            if (expense.dueDate) {
                const date = new Date(expense.dueDate);
                document.getElementById('expense-due-date').value = date.toISOString().split('T')[0];
            }
            if (expense.totalPayments) {
                document.getElementById('expense-total-payments').value = expense.totalPayments;
            }
        }
    } else {
        // Add mode
        title.textContent = I18n.t('settings.addExpense');
    }

    updateExpenseFormFields();
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    initLucideIcons();
}

function closeExpenseForm() {
    const modal = document.getElementById('expense-form-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    editingExpenseId = null;
}

function updateExpenseFormFields() {
    const type = document.getElementById('expense-type').value;
    const dueDayGroup = document.getElementById('due-day-group');
    const dueDateGroup = document.getElementById('due-date-group');
    const totalPaymentsGroup = document.getElementById('total-payments-group');

    // Show/hide fields based on type
    dueDayGroup.classList.toggle('hidden', type === 'goal');
    dueDateGroup.classList.toggle('hidden', type !== 'goal');
    totalPaymentsGroup.classList.toggle('hidden', type !== 'loan');

    // Update required attributes
    document.getElementById('expense-due-day').required = type !== 'goal';
    document.getElementById('expense-due-date').required = type === 'goal';
    document.getElementById('expense-total-payments').required = type === 'loan';
}

function handleExpenseFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('expense-edit-id').value || 'exp_' + Date.now();
    const name = document.getElementById('expense-name').value.trim();
    const icon = document.getElementById('expense-icon').value.trim();
    const type = document.getElementById('expense-type').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);

    const expense = { id, name, icon, type, amount };

    if (type === 'goal') {
        const dueDateStr = document.getElementById('expense-due-date').value;
        expense.dueDate = new Date(dueDateStr);
    } else {
        expense.dueDay = parseInt(document.getElementById('expense-due-day').value);
    }

    if (type === 'loan') {
        expense.totalPayments = parseInt(document.getElementById('expense-total-payments').value);
    }

    // Update or add expense
    const expenses = getExpenses();
    const existingIndex = expenses.findIndex(e => e.id === id);
    if (existingIndex >= 0) {
        expenses[existingIndex] = expense;
    } else {
        expenses.push(expense);
    }

    userExpenses = expenses;
    saveExpenseConfig();

    closeExpenseForm();
    renderExpenseList();
    renderExpenseCards();
    updateSummary();
    showToast(I18n.t('toast.expenseSaved'), 'success');
}

function editExpense(expenseId) {
    openExpenseForm(expenseId);
}

function deleteExpense(expenseId) {
    if (!confirm(I18n.t('settings.confirmDelete'))) {
        return;
    }

    userExpenses = getExpenses().filter(e => e.id !== expenseId);
    saveExpenseConfig();

    renderExpenseList();
    renderExpenseCards();
    updateSummary();
    showToast(I18n.t('toast.expenseDeleted'), 'success');
}

// Language Management
function initLanguage() {
    const selector = document.getElementById('language-selector');
    if (!selector) return;

    // Initialize I18n
    I18n.init();

    // Populate dropdown
    selector.innerHTML = I18n.getAvailableLanguages().map(lang =>
        `<option value="${lang.code}">${lang.nativeName}</option>`
    ).join('');

    selector.value = I18n.currentLanguage;

    // Handle changes
    selector.addEventListener('change', (e) => {
        const newLang = e.target.value;
        I18n.setLanguage(newLang);
        // Re-render dynamic content
        renderExpenseCards();
        renderPaymentHistory();
        updateSummary();
        showToast(I18n.t('toast.languageChanged', { language: I18n.LANGUAGES[newLang].name }), 'info');
    });

    // Translate static page elements
    I18n.translatePage();
}

function initCurrency() {
    const selector = document.getElementById('currency-selector');
    if (!selector) return;

    // Populate dropdown
    selector.innerHTML = Object.entries(CURRENCIES).map(([code, currency]) =>
        `<option value="${code}">${currency.symbol} ${code}</option>`
    ).join('');

    // Load saved preference
    const savedCurrency = localStorage.getItem('alex_expense_currency');
    if (savedCurrency && CURRENCIES[savedCurrency]) {
        currentCurrency = savedCurrency;
    }
    selector.value = currentCurrency;

    // Handle changes
    selector.addEventListener('change', async (e) => {
        currentCurrency = e.target.value;
        localStorage.setItem('alex_expense_currency', currentCurrency);

        // Fetch exchange rates if switching to a different currency
        if (currentCurrency !== defaultCurrency) {
            await CurrencyConverter.fetchRates();
        }

        updateRateStatus();
        renderExpenseCards();
        renderPaymentHistory();
        updateSummary();
        showToast(I18n.t('toast.currencyChanged', { currency: CURRENCIES[currentCurrency].name }), 'info');
    });
}

function getCurrencySymbol() {
    return CURRENCIES[currentCurrency]?.symbol || '$';
}

// Sync Status Indicator
function initSyncIndicator() {
    SheetsAPI.onSyncStatusChange(updateSyncIndicator);
    // Set initial state based on config
    if (CONFIG.USE_LOCAL_STORAGE) {
        updateSyncIndicator('offline');
    }
}

function updateSyncIndicator(status, lastSync) {
    const indicator = document.getElementById('sync-indicator');
    const statusText = document.getElementById('sync-status-text');
    if (!indicator || !statusText) return;

    // Remove all status classes
    indicator.classList.remove('text-emerald-400', 'text-yellow-400', 'text-red-400', 'text-slate-500', 'animate-pulse');

    let icon, text, colorClass;
    switch (status) {
        case 'synced':
            icon = 'cloud-check';
            text = I18n.t('sync.synced');
            colorClass = 'text-emerald-400';
            break;
        case 'syncing':
            icon = 'cloud-upload';
            text = I18n.t('sync.syncing');
            colorClass = 'text-yellow-400';
            indicator.classList.add('animate-pulse');
            break;
        case 'offline':
            icon = 'cloud-off';
            text = I18n.t('sync.offline');
            colorClass = 'text-slate-500';
            break;
        case 'error':
            icon = 'cloud-alert';
            text = I18n.t('sync.error');
            colorClass = 'text-red-400';
            break;
        default:
            icon = 'cloud';
            text = I18n.t('sync.unknown');
            colorClass = 'text-slate-500';
    }

    indicator.classList.add(colorClass);
    indicator.innerHTML = `
        <i data-lucide="${icon}" class="w-3 h-3"></i>
        <span id="sync-status-text">${text}</span>
    `;

    if (lastSync && status === 'synced') {
        indicator.title = I18n.t('sync.lastSynced', { time: lastSync.toLocaleTimeString() });
    } else {
        indicator.title = text;
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Update exchange rate status indicator
function updateRateStatus() {
    const indicator = document.getElementById('rate-status');
    if (!indicator) return;

    // Only show rate status when display currency differs from default
    if (currentCurrency === defaultCurrency) {
        indicator.classList.add('hidden');
        return;
    }

    indicator.classList.remove('hidden');

    const lastFetchTime = CurrencyConverter.getLastFetchTime();
    const hasRates = CurrencyConverter.hasRates();

    if (!hasRates) {
        indicator.textContent = I18n.t('rates.unavailable');
        indicator.title = I18n.t('rates.unavailable');
        indicator.classList.add('text-red-400');
        indicator.classList.remove('text-slate-500', 'text-emerald-400');
    } else if (CurrencyConverter.shouldRefresh()) {
        // Rates are cached but stale
        indicator.textContent = I18n.t('rates.offline');
        indicator.title = I18n.t('tooltip.rateStatus');
        indicator.classList.add('text-slate-500');
        indicator.classList.remove('text-red-400', 'text-emerald-400');
    } else {
        // Fresh rates
        indicator.textContent = I18n.t('rates.lastUpdated', { date: lastFetchTime });
        indicator.title = I18n.t('tooltip.rateStatus');
        indicator.classList.add('text-emerald-400');
        indicator.classList.remove('text-red-400', 'text-slate-500');
    }
}

// Edit Payment State
let editingPaymentId = null;

let payments = [];

// DOM Elements
const expensesContainer = document.getElementById('expenses-container');
const paymentHistory = document.getElementById('payment-history');
const monthlyTotalEl = document.getElementById('monthly-total');
const nextDueEl = document.getElementById('next-due');
const paymentModal = document.getElementById('payment-modal');
const paymentForm = document.getElementById('payment-form');
const closeModalBtn = document.getElementById('close-modal');
const loadingOverlay = document.getElementById('loading');

// Bulk Payment DOM Elements (initialized after DOM ready)
let bulkPaymentBtn;
let bulkPaymentModal;
let bulkPaymentForm;
let closeBulkModalBtn;
let expenseCheckboxList;

// Auth DOM Elements (initialized after DOM ready)
let authModal;
let googleSignInBtn;
let authError;
let authErrorText;
let userInfo;
let userAvatar;
let userName;
let signOutBtn;
let setupModal;
let setupLaterBtn;
let setupContinueBtn;

// Toast notification system
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');

    const bgColor = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-violet-600';
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info';

    toast.className = `flex items-center gap-3 px-4 py-3 ${bgColor} text-white rounded-xl shadow-lg backdrop-blur-sm toast-enter`;
    toast.innerHTML = `
        <i data-lucide="${icon}" class="w-5 h-5"></i>
        <span class="font-medium">${message}</span>
    `;

    container.appendChild(toast);
    lucide.createIcons({ nodes: [toast] });

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Initialize Lucide icons
function initLucideIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ============ Firebase Auth Functions ============

// Show auth modal (Google Sign-In)
function showAuthModal() {
    if (!authModal) return;

    hideAuthError();
    authModal.classList.remove('hidden');
    authModal.classList.add('flex');
    initLucideIcons();
}

// Hide auth modal
function hideAuthModal() {
    if (!authModal) return;
    authModal.classList.add('hidden');
    authModal.classList.remove('flex');
}

// Show auth error message
function showAuthError(message) {
    if (!authError || !authErrorText) return;
    authErrorText.textContent = message;
    authError.classList.remove('hidden');
}

// Hide auth error message
function hideAuthError() {
    if (!authError) return;
    authError.classList.add('hidden');
}

// Handle Google Sign-In button click
async function handleGoogleSignIn() {
    hideAuthError();
    showLoading(true);

    try {
        const user = await FirebaseAuth.signIn();

        if (user) {
            hideAuthModal();
            await handleSignedIn(user);
        }
    } catch (error) {
        console.error('Sign-in error:', error);

        if (error.message === 'popup-blocked') {
            showAuthError(I18n.t('auth.popupBlocked'));
        } else {
            showAuthError(I18n.t('auth.signInFailed'));
        }
    } finally {
        showLoading(false);
    }
}

// Handle successful sign-in
async function handleSignedIn(user) {
    // Update user info display
    updateUserDisplay(user);

    // Known users (primary + admin) skip setup and use the default Google Sheet
    if (FirebaseAuth.isKnownUser()) {
        // Mark as initialized
        localStorage.setItem(FirebaseAuth.getUserStoragePrefix() + 'alex_expense_initialized', 'true');

        // Show admin user switcher if admin
        if (FirebaseAuth.isAdmin()) {
            showAdminUserSwitcher();
        }

        await init();
        showToast(I18n.t('toast.welcomeBack'), 'success');
        return;
    }

    // Check if this is a new user (first sign-in)
    const isNewUser = !localStorage.getItem(FirebaseAuth.getUserStoragePrefix() + 'alex_expense_initialized');

    if (isNewUser) {
        // Show setup modal for new users
        showSetupModal(user);
    } else {
        // Existing user, initialize app
        await init();
        showToast(I18n.t('toast.welcomeBack'), 'success');
    }
}

// Update user display in header
function updateUserDisplay(user) {
    if (!userInfo) return;

    if (user) {
        userInfo.classList.remove('hidden');
        userInfo.classList.add('flex');

        if (userAvatar) {
            const photoURL = FirebaseAuth.getUserPhotoURL();
            if (photoURL) {
                userAvatar.src = photoURL;
                userAvatar.classList.remove('hidden');
            } else {
                userAvatar.classList.add('hidden');
            }
        }

        if (userName) {
            userName.textContent = FirebaseAuth.getUserFirstName();
        }
    } else {
        userInfo.classList.add('hidden');
        userInfo.classList.remove('flex');
    }
}

// Handle sign out
async function handleSignOut() {
    showLoading(true);

    try {
        await FirebaseAuth.signOut();
        payments = [];

        // Clear UI
        expensesContainer.innerHTML = '';
        paymentHistory.innerHTML = '';
        monthlyTotalEl.textContent = `${getCurrencySymbol()}0`;
        nextDueEl.textContent = '-';

        // Update user display
        updateUserDisplay(null);

        // Show auth modal
        showAuthModal();

        showToast(I18n.t('toast.signedOut'), 'info');
    } catch (error) {
        console.error('Sign-out error:', error);
        showToast(I18n.t('auth.signOutFailed'), 'error');
    } finally {
        showLoading(false);
    }
}

// Show setup modal for new users
function showSetupModal(user) {
    if (!setupModal) return;

    // Set greeting with user's name
    const setupGreeting = document.getElementById('setup-user-greeting');
    if (setupGreeting) {
        setupGreeting.textContent = I18n.t('setup.greeting', { name: FirebaseAuth.getUserFirstName() });
    }

    setupModal.classList.remove('hidden');
    setupModal.classList.add('flex');
    initLucideIcons();
}

// Hide setup modal
function hideSetupModal() {
    if (!setupModal) return;
    setupModal.classList.add('hidden');
    setupModal.classList.remove('flex');
}

// Handle "Setup Later" - continue without sheet setup
async function handleSetupLater() {
    hideSetupModal();

    // Mark user as initialized
    localStorage.setItem(FirebaseAuth.getUserStoragePrefix() + 'alex_expense_initialized', 'true');

    await init();
    showToast(I18n.t('setup.usingOffline'), 'info');
}

// Handle "Continue" - open settings for sheet URL
async function handleSetupContinue() {
    hideSetupModal();

    // Mark user as initialized
    localStorage.setItem(FirebaseAuth.getUserStoragePrefix() + 'alex_expense_initialized', 'true');

    await init();

    // Open settings modal so user can configure their sheet
    setTimeout(() => {
        openSettingsModal();
    }, 500);
}

// ============ Admin User Switcher ============

// Show admin user switcher in the header
function showAdminUserSwitcher() {
    // Only show for admins
    if (!FirebaseAuth.isAdmin()) return;

    // Check if switcher already exists
    if (document.getElementById('admin-user-switcher')) return;

    const allUsers = FirebaseAuth.getAllUserPrefixes();

    const switcher = document.createElement('select');
    switcher.id = 'admin-user-switcher';
    switcher.className = 'px-2 py-1.5 text-xs bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 hover:border-amber-500/50 focus:outline-none focus:border-amber-500 cursor-pointer transition-colors';
    switcher.title = 'Switch user view (Admin)';

    switcher.innerHTML = allUsers.map(u =>
        `<option value="${u.prefix}">${u.label}</option>`
    ).join('');

    // Set current value
    switcher.value = FirebaseAuth.getViewingUserPrefix() || '';

    switcher.addEventListener('change', async (e) => {
        const prefix = e.target.value;
        FirebaseAuth.setViewingUser(prefix === '' ? null : prefix);

        // Reload data for the selected user
        userExpenses = null; // Reset cached expenses
        loadExpenses();
        payments = await SheetsAPI.getPayments();
        renderExpenseCards();
        renderPaymentHistory();
        updateSummary();

        const label = allUsers.find(u => u.prefix === prefix)?.label || 'Unknown';
        showToast(`Viewing: ${label}`, 'info');
    });

    // Insert before sign-out button
    const signOutButton = document.getElementById('sign-out-btn');
    if (signOutButton) {
        signOutButton.parentNode.insertBefore(switcher, signOutButton);
    }
}

// Initialize Firebase and check auth state
async function initFirebaseAuth() {
    // Check if Firebase is configured
    if (!FirebaseAuth.isConfigured()) {
        console.log('Firebase not configured. Running in demo/offline mode.');
        // In demo mode, just show the app without auth
        await init();
        return;
    }

    showLoading(true);

    try {
        // Initialize Firebase
        const initialized = await FirebaseAuth.init();

        if (!initialized) {
            console.warn('Firebase initialization failed. Running in offline mode.');
            await init();
            return;
        }

        // Wait for auth state to be determined
        const user = await FirebaseAuth.waitForAuthState();

        if (user) {
            // User is already signed in
            hideAuthModal();
            await handleSignedIn(user);
        } else {
            // No user, show sign-in modal
            showAuthModal();
        }
    } catch (error) {
        console.error('Firebase auth initialization error:', error);
        // Fall back to offline mode
        await init();
    } finally {
        showLoading(false);
    }
}

// Sync cruise payments to the cruise-payment-tracker's localStorage
function syncCruisePaymentsToTracker() {
    try {
        const cruisePayments = payments.filter(p => p.category === 'cruise');

        const stored = localStorage.getItem('cruise-payments');
        let trackerPayments = stored ? JSON.parse(stored) : [];

        // Remove all alex entries (both seeded and previously synced)
        trackerPayments = trackerPayments.filter(p => p.person !== 'alex');

        // Add current cruise payments as alex entries
        cruisePayments.forEach(p => {
            trackerPayments.push({
                id: 'sync_' + p.id,
                person: 'alex',
                amount: p.amount,
                date: p.date,
                note: p.notes || '',
                source: 'alex-expense-tracker'
            });
        });

        localStorage.setItem('cruise-payments', JSON.stringify(trackerPayments));
    } catch (e) {
        console.error('Error syncing cruise payments to tracker:', e);
    }
}

// Initialize the app
async function init() {
    showLoading(true);

    try {
        // Load payments from storage
        payments = await SheetsAPI.getPayments();

        // Sync cruise payments to the cruise-payment-tracker
        syncCruisePaymentsToTracker();

        // Fetch exchange rates (non-blocking, shows cached if fails)
        const ratesFetched = await CurrencyConverter.fetchRates();
        if (ratesFetched && CurrencyConverter.hasRates() && !CurrencyConverter.shouldRefresh()) {
            // Only show toast if rates were freshly fetched (not from cache)
            if (currentCurrency !== defaultCurrency) {
                showToast(I18n.t('toast.ratesFetched'), 'info');
            }
        } else if (!ratesFetched && CurrencyConverter.hasRates()) {
            // Using cached rates
            if (currentCurrency !== defaultCurrency) {
                showToast(I18n.t('toast.ratesFetchFailed'), 'info');
            }
        }

        // Update rate status indicator
        updateRateStatus();

        // Render the UI
        renderExpenseCards();
        renderPaymentHistory();
        updateSummary();

        // Initialize Lucide icons for dynamically rendered content
        initLucideIcons();
    } catch (error) {
        console.error('Error initializing app:', error);
        showToast(I18n.t('toast.loadFailed'), 'error');
    } finally {
        showLoading(false);
    }
}

// Show/hide loading overlay
function showLoading(show) {
    if (show) {
        loadingOverlay.classList.remove('hidden');
        loadingOverlay.classList.add('flex');
    } else {
        loadingOverlay.classList.add('hidden');
        loadingOverlay.classList.remove('flex');
    }
}

// Get the current month and year
function getCurrentMonthYear() {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
}

// Parse date string as local date (fixes timezone issue with "YYYY-MM-DD" format)
function parseLocalDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

// Get today's date as YYYY-MM-DD string in local timezone
function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format currency with comma separators (hide .00 cents)
function formatCurrency(amount, includeSymbol = false) {
    // Convert from default currency to display currency if they differ
    if (currentCurrency !== defaultCurrency) {
        const converted = CurrencyConverter.convert(amount, defaultCurrency, currentCurrency);
        if (converted !== null) {
            amount = converted;
        }
        // If conversion fails, show unconverted amount (user sees default currency amount)
    }

    const currency = CURRENCIES[currentCurrency] || CURRENCIES.USD;
    const hasCents = amount % 1 !== 0;

    // JPY doesn't use decimal places
    const noDecimals = currentCurrency === 'JPY';

    const formatted = amount.toLocaleString(currency.locale, {
        minimumFractionDigits: noDecimals ? 0 : (hasCents ? 2 : 0),
        maximumFractionDigits: noDecimals ? 0 : (hasCents ? 2 : 0)
    });

    return includeSymbol ? `${currency.symbol}${formatted}` : formatted;
}

// Check if a payment exists for an expense in a given month
function hasPaymentForMonth(expenseId, month, year) {
    return payments.some(payment => {
        const paymentDate = parseLocalDate(payment.date);
        return payment.category === expenseId &&
               paymentDate.getMonth() === month &&
               paymentDate.getFullYear() === year;
    });
}

// Get the current pay period (14-day cycles starting 1/22/2026)
function getCurrentPayPeriod() {
    const paycheckStart = new Date(2026, 0, 22); // Jan 22, 2026
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate how many complete 14-day periods have passed
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysSinceStart = Math.floor((today - paycheckStart) / msPerDay);
    const periodNumber = Math.floor(daysSinceStart / 14);

    // Calculate start and end of current period
    const periodStart = new Date(paycheckStart);
    periodStart.setDate(periodStart.getDate() + (periodNumber * 14));

    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 13); // 14 days inclusive
    periodEnd.setHours(23, 59, 59, 999);

    return { start: periodStart, end: periodEnd };
}

// Check if a payment exists for an expense in the current pay period
function hasPaymentForPayPeriod(expenseId) {
    const { start, end } = getCurrentPayPeriod();

    return payments.some(payment => {
        const paymentDate = parseLocalDate(payment.date);
        return payment.category === expenseId &&
               paymentDate >= start &&
               paymentDate <= end;
    });
}

// Get total payments for a category (for loans and goals)
function getTotalPaymentsForCategory(expenseId) {
    return payments
        .filter(p => p.category === expenseId)
        .reduce((sum, p) => sum + p.amount, 0);
}

// Get payment count for a category (for loans)
function getPaymentCountForCategory(expenseId) {
    return payments.filter(p => p.category === expenseId).length;
}

// Calculate credit or past due amount for recurring expenses
// Based on months elapsed since Jan 2026
function getCreditOrPastDue(expense) {
    if (expense.type !== 'recurring') return { credit: 0, pastDue: 0 };

    const today = new Date();
    const startYear = 2026;
    const startMonth = 0; // January

    // Calculate months where payment is expected (only count current month if due day has passed)
    const fullMonthsElapsed = (today.getFullYear() - startYear) * 12 + (today.getMonth() - startMonth);
    const dueDayPassedThisMonth = today.getDate() >= (expense.dueDay || 1);
    const monthsElapsed = fullMonthsElapsed + (dueDayPassedThisMonth ? 1 : 0);

    // Expected total based on months elapsed
    const expectedTotal = monthsElapsed * expense.amount;

    // Actual total paid
    const actualTotal = getTotalPaymentsForCategory(expense.id);

    // Calculate difference
    const difference = actualTotal - expectedTotal;

    if (difference > 0) {
        return { credit: difference, pastDue: 0 };
    } else if (difference < 0) {
        return { credit: 0, pastDue: Math.abs(difference) };
    }
    return { credit: 0, pastDue: 0 };
}

// Calculate status for an expense
function getExpenseStatus(expense) {
    const { month, year } = getCurrentMonthYear();
    const today = new Date();
    const currentDay = today.getDate();

    if (expense.type === 'goal') {
        // For goals, check progress
        const totalSaved = getTotalPaymentsForCategory(expense.id);
        if (totalSaved >= expense.amount) {
            return { status: 'paid', label: I18n.t('status.goalReached') };
        }
        // Check if paid this pay period
        if (hasPaymentForPayPeriod(expense.id)) {
            return { status: 'paid', label: I18n.t('status.paidPayperiod') };
        }
        const daysUntilDue = Math.ceil((expense.dueDate - today) / (1000 * 60 * 60 * 24));
        if (daysUntilDue < 0) {
            return { status: 'overdue', label: I18n.t('status.pastDue') };
        }
        if (daysUntilDue <= 30) {
            return { status: 'due-soon', label: I18n.plural('status.daysLeft', daysUntilDue) };
        }
        return { status: 'pending', label: I18n.plural('status.daysLeft', daysUntilDue) };
    }

    if (expense.type === 'loan') {
        // For loans, check if paid this month
        const paymentCount = getPaymentCountForCategory(expense.id);
        if (paymentCount >= expense.totalPayments) {
            return { status: 'paid', label: I18n.t('status.paidOff') };
        }
        if (hasPaymentForMonth(expense.id, month, year)) {
            return { status: 'paid', label: I18n.t('status.paid') };
        }
    } else if (expense.type === 'variable') {
        // For variable expenses, check if paid this month
        if (hasPaymentForMonth(expense.id, month, year)) {
            return { status: 'paid', label: I18n.t('status.paid') };
        }
    } else {
        // For recurring expenses - check if still past due before marking as paid
        const { pastDue } = getCreditOrPastDue(expense);
        if (pastDue > 0) {
            // Still past due, don't mark as paid even if payment made this month
            return { status: 'overdue', label: I18n.t('status.pastDue') };
        }
        if (hasPaymentForMonth(expense.id, month, year)) {
            return { status: 'paid', label: I18n.t('status.paid') };
        }
    }

    // Check if due soon or overdue
    const dueDay = expense.dueDay;
    const daysUntilDue = dueDay - currentDay;

    if (daysUntilDue < 0) {
        return { status: 'overdue', label: I18n.t('status.overdue') };
    }
    if (daysUntilDue <= 7) {
        return { status: 'due-soon', label: I18n.plural('status.dueSoon', daysUntilDue) };
    }
    return { status: 'pending', label: I18n.t('status.dueOnThe', { ordinal: I18n.getOrdinal(dueDay) }) };
}

// Get ordinal suffix for a number
function getOrdinalSuffix(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}

// Get payments for a specific expense category
function getPaymentsForExpense(expenseId) {
    return payments.filter(p => p.category === expenseId);
}

// Calculate 3-month average for variable expenses
function calculateAverage(expenseId) {
    const expensePayments = getPaymentsForExpense(expenseId);
    if (expensePayments.length === 0) return null;

    // Sort by date descending, take last 3
    const recent = expensePayments
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);

    const sum = recent.reduce((acc, p) => acc + p.amount, 0);
    return sum / recent.length;
}

// Calculate trend for variable expenses
function calculateTrend(expenseId) {
    const expensePayments = getPaymentsForExpense(expenseId);
    if (expensePayments.length < 2) return 'none';

    const sorted = expensePayments
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);

    if (sorted.length < 2) return 'stable';

    const recent = sorted[0].amount;
    const previous = sorted[1].amount;
    const diff = recent - previous;
    const threshold = previous * 0.1; // 10% threshold

    if (diff > threshold) return 'up';
    if (diff < -threshold) return 'down';
    return 'stable';
}

// Sort expenses by: paid status (unpaid first), due date (soonest first), amount (highest first)
function getSortedExpenses() {
    const today = new Date();
    const currentDay = today.getDate();

    return [...getExpenses()].sort((a, b) => {
        // Get paid status for each expense
        const statusA = getExpenseStatus(a);
        const statusB = getExpenseStatus(b);
        const isPaidA = statusA.status === 'paid';
        const isPaidB = statusB.status === 'paid';

        // Paid expenses go to the bottom
        if (isPaidA !== isPaidB) {
            return isPaidA ? 1 : -1;
        }

        // Calculate days until due for each expense
        const getDaysUntilDue = (expense) => {
            if (expense.type === 'goal') {
                return Math.ceil((expense.dueDate - today) / (1000 * 60 * 60 * 24));
            }
            const daysUntil = expense.dueDay - currentDay;
            // If already past due this month, treat as most urgent (negative)
            return daysUntil;
        };

        const daysA = getDaysUntilDue(a);
        const daysB = getDaysUntilDue(b);

        // Sort by days until due (soonest first, overdue at top)
        if (daysA !== daysB) {
            return daysA - daysB;
        }

        // If same due date, sort by amount (highest first)
        return b.amount - a.amount;
    });
}

// Render all expense cards
function renderExpenseCards() {
    expensesContainer.innerHTML = '';

    getSortedExpenses().forEach(expense => {
        const card = createExpenseCard(expense);
        expensesContainer.appendChild(card);
    });

    initLucideIcons();
}

// Create an expense card element
function createExpenseCard(expense) {
    const { status, label } = getExpenseStatus(expense);
    const card = document.createElement('div');

    // Status-based border color class
    const borderColorClass = status === 'paid' ? 'expense-card-paid' :
                             status === 'due-soon' ? 'expense-card-due-soon' :
                             status === 'overdue' ? 'expense-card-overdue' : 'expense-card-pending';

    card.className = `expense-card group relative bg-white/5 backdrop-blur-xl rounded-2xl p-5 border-l-4 border border-white/10 hover:bg-white/10 transition-all duration-300 ${borderColorClass}`;

    let progressHTML = '';
    let actionButton = '';

    // Status badge colors
    const statusColors = {
        'paid': 'bg-emerald-500/20 text-emerald-400',
        'due-soon': 'bg-yellow-500/20 text-yellow-400',
        'overdue': 'bg-red-500/20 text-red-400',
        'pending': 'bg-violet-500/20 text-violet-400'
    };

    if (expense.type === 'loan') {
        const paymentCount = getPaymentCountForCategory(expense.id);
        const percentage = Math.round((paymentCount / expense.totalPayments) * 100);
        progressHTML = `
            <div class="mt-4">
                <div class="flex justify-between text-sm text-slate-400 mb-2">
                    <span>${I18n.t('progress.paymentsOf', { current: paymentCount, total: expense.totalPayments })}</span>
                    <span>${percentage}%</span>
                </div>
                <div class="h-2 bg-white/10 rounded-full overflow-hidden progress-bar-bg">
                    <div class="h-full progress-gradient rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
        if (paymentCount < expense.totalPayments && status !== 'paid') {
            actionButton = `<button class="w-full mt-4 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-medium rounded-xl transition-all duration-300" onclick="openPaymentModal('${expense.id}', ${expense.amount})">${I18n.t('button.markAsPaid')}</button>`;
        }
    } else if (expense.type === 'goal') {
        const totalSaved = getTotalPaymentsForCategory(expense.id);
        const remainingBalance = expense.amount - totalSaved;
        const percentage = Math.min(100, Math.round((totalSaved / expense.amount) * 100));

        // Calculate paychecks remaining (every 2 weeks starting 1/22/2026)
        // Pay periods: 1/22-2/4, 2/5-2/18, ..., 7/9-7/22 (13 total before 7/23 due date)
        const paycheckStart = new Date(2026, 0, 22); // Jan 22, 2026
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day
        const dueDate = new Date(expense.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        // Use UTC to avoid Daylight Saving Time issues in date math
        const startUTC = Date.UTC(2026, 0, 22);
        const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
        const dueUTC = Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const msPerDay = 24 * 60 * 60 * 1000;

        // Total pay periods from start to due date (not including due date itself)
        const totalDays = Math.floor((dueUTC - startUTC) / msPerDay);
        const totalPeriods = Math.floor(totalDays / 14);

        // Current pay period number (1-indexed, 0 if before start)
        const daysSinceStart = Math.max(0, Math.floor((todayUTC - startUTC) / msPerDay));
        const currentPeriod = Math.floor(daysSinceStart / 14) + 1;

        // Paychecks remaining = total periods minus completed periods
        let paychecksRemaining = Math.max(0, totalPeriods - currentPeriod + 1);

        // If paid this pay period, decrement paychecks remaining (current paycheck is done)
        const paidThisPayPeriod = hasPaymentForPayPeriod(expense.id);
        if (paidThisPayPeriod && paychecksRemaining > 0) {
            paychecksRemaining--;
        }

        const perPaycheck = paychecksRemaining > 0 ? remainingBalance / paychecksRemaining : remainingBalance;

        let paycheckBreakdown = '';
        if (remainingBalance > 0 && paychecksRemaining > 0) {
            paycheckBreakdown = `<div class="text-xs text-slate-500 mt-1">${I18n.t('progress.paychecksLeft', { count: paychecksRemaining })} · ${I18n.t('progress.perPaycheck', { amount: getCurrencySymbol() + formatCurrency(perPaycheck) })}</div>`;
        }

        // Show remaining amount prominently
        const remainingHTML = remainingBalance > 0
            ? `<div class="text-sm font-medium text-cyan-400 mt-2">${I18n.t('progress.remaining', { amount: getCurrencySymbol() + formatCurrency(remainingBalance) })}</div>`
            : '';

        progressHTML = `
            <div class="mt-4">
                <div class="flex justify-between text-sm text-slate-400 mb-2">
                    <span>${I18n.t('progress.savedOf', { saved: getCurrencySymbol() + formatCurrency(totalSaved), total: getCurrencySymbol() + formatCurrency(expense.amount) })}</span>
                    <span>${percentage}%</span>
                </div>
                <div class="h-2 bg-white/10 rounded-full overflow-hidden progress-bar-bg">
                    <div class="h-full progress-gradient rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
                </div>
                ${remainingHTML}
                ${paycheckBreakdown}
            </div>
        `;
        if (totalSaved < expense.amount) {
            actionButton = `<button class="w-full mt-4 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-medium rounded-xl transition-all duration-300" onclick="openPaymentModal('${expense.id}', null, true)">${I18n.t('button.addToSavings')}</button>`;
        }
    } else if (expense.type === 'variable') {
        // Variable expense - show estimated, average, and trend
        const average = calculateAverage(expense.id);
        const trend = calculateTrend(expense.id);

        // Build average and trend display
        let averageHTML = '';
        if (average !== null) {
            averageHTML = `<div class="text-sm text-slate-400">${I18n.t('expense.average', { amount: getCurrencySymbol() + formatCurrency(average) })}</div>`;
        } else {
            averageHTML = `<div class="text-sm text-slate-500">${I18n.t('expense.noHistory')}</div>`;
        }

        progressHTML = `
            <div class="mt-2">
                ${averageHTML}
            </div>
        `;

        if (status !== 'paid') {
            // Pre-fill with average if available, else estimated amount
            const prefillAmount = average !== null ? average.toFixed(2) : expense.amount;
            actionButton = `<button class="w-full mt-4 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-medium rounded-xl transition-all duration-300" onclick="openPaymentModal('${expense.id}', ${prefillAmount})">${I18n.t('button.markAsPaid')}</button>`;
        }
    } else {
        // Recurring expense
        if (status !== 'paid') {
            actionButton = `<button class="w-full mt-4 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-medium rounded-xl transition-all duration-300" onclick="openPaymentModal('${expense.id}', ${expense.amount})">${I18n.t('button.markAsPaid')}</button>`;
        }
    }

    const dueText = expense.type === 'goal'
        ? I18n.t('expense.dueDate', { date: expense.dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) })
        : I18n.t('expense.dueDay', { ordinal: I18n.getOrdinal(expense.dueDay) });

    const amountText = expense.type === 'goal'
        ? I18n.t('expense.total', { amount: getCurrencySymbol() + formatCurrency(expense.amount) })
        : expense.type === 'variable'
        ? I18n.t('expense.estimated', { amount: getCurrencySymbol() + formatCurrency(expense.amount) })
        : I18n.t('expense.perMonth', { amount: getCurrencySymbol() + formatCurrency(expense.amount) });

    // Calculate credit or past due for recurring expenses
    let creditPastDueHTML = '';
    if (expense.type === 'recurring') {
        const { credit, pastDue } = getCreditOrPastDue(expense);
        if (credit > 0) {
            creditPastDueHTML = `<div class="text-xs text-emerald-400">${I18n.t('expense.credit', { amount: getCurrencySymbol() + formatCurrency(credit) })}</div>`;
        } else if (pastDue > 0) {
            creditPastDueHTML = `<div class="text-xs text-red-400">${I18n.t('expense.pastDue', { amount: getCurrencySymbol() + formatCurrency(pastDue) })}</div>`;
        }
    }

    // Calculate trend badge for variable expenses
    let trendBadgeHTML = '';
    if (expense.type === 'variable') {
        const trend = calculateTrend(expense.id);
        if (trend !== 'none') {
            const trendColors = {
                'up': 'text-red-400',
                'down': 'text-emerald-400',
                'stable': 'text-slate-400'
            };
            trendBadgeHTML = `<span class="text-lg ${trendColors[trend]}">${I18n.t('expense.trend.' + trend)}</span>`;
        }
    }

    card.innerHTML = `
        <div class="flex justify-between items-start mb-3">
            <div class="flex items-center gap-3">
                <span class="text-2xl">${expense.icon}</span>
                <span class="font-semibold text-white">${expense.name}</span>
                ${trendBadgeHTML}
            </div>
            <div class="text-right">
                <span class="text-lg font-bold text-violet-400">${amountText}</span>
                ${creditPastDueHTML}
            </div>
        </div>
        <div class="flex items-center gap-3">
            <span class="text-sm text-slate-400">${dueText}</span>
            <span class="px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[status]}">${label}</span>
        </div>
        ${progressHTML}
        ${actionButton}
    `;

    return card;
}

// Render payment history
function renderPaymentHistory() {
    paymentHistory.innerHTML = '';

    if (payments.length === 0) {
        paymentHistory.innerHTML = `<li class="px-6 py-8 text-center text-slate-500">${I18n.t('history.noPayments')}</li>`;
        return;
    }

    // Show last 10 payments
    const recentPayments = payments.slice(0, 10);

    recentPayments.forEach(payment => {
        const expense = getExpenses().find(e => e.id === payment.category);
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors';

        const date = parseLocalDate(payment.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        li.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-xl">${expense ? expense.icon : ''}</span>
                <div>
                    <div class="font-medium text-white">${expense ? expense.name : payment.category}</div>
                    <div class="text-sm text-slate-500">${formattedDate}${payment.notes ? ' · ' + payment.notes : ''}</div>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <span class="font-semibold text-emerald-400">${getCurrencySymbol()}${formatCurrency(payment.amount)}</span>
                <button class="p-2 hover:bg-violet-500/20 rounded-lg transition-colors group" onclick="handleEditPayment('${payment.id}')" title="${I18n.t('history.editPayment')}">
                    <i data-lucide="pencil" class="w-4 h-4 text-slate-500 group-hover:text-violet-400"></i>
                </button>
                <button class="p-2 hover:bg-red-500/20 rounded-lg transition-colors group" onclick="handleDeletePayment('${payment.id}')" title="${I18n.t('history.deletePayment')}">
                    <i data-lucide="trash-2" class="w-4 h-4 text-slate-500 group-hover:text-red-400"></i>
                </button>
            </div>
        `;

        paymentHistory.appendChild(li);
    });

    initLucideIcons();
}

// Update summary section
function updateSummary() {
    const today = new Date();
    const currentDay = today.getDate();
    const { month, year } = getCurrentMonthYear();

    // Calculate remaining amount to pay (including past due)
    let remainingAmount = 0;
    getExpenses().forEach(expense => {
        // Skip goals
        if (expense.type === 'goal') return;

        // For recurring expenses, include past due amounts
        if (expense.type === 'recurring') {
            const { pastDue } = getCreditOrPastDue(expense);
            if (pastDue > 0) {
                remainingAmount += pastDue;
            } else if (!hasPaymentForMonth(expense.id, month, year)) {
                remainingAmount += expense.amount;
            }
            return;
        }

        // For loans, skip if fully paid or paid this month
        if (expense.type === 'loan') {
            const paymentCount = getPaymentCountForCategory(expense.id);
            if (paymentCount >= expense.totalPayments) return;
            if (hasPaymentForMonth(expense.id, month, year)) return;
            remainingAmount += expense.amount;
            return;
        }

        // For variable expenses, use average or estimated amount
        if (expense.type === 'variable') {
            if (hasPaymentForMonth(expense.id, month, year)) return;
            const average = calculateAverage(expense.id);
            remainingAmount += average !== null ? average : expense.amount;
        }
    });

    monthlyTotalEl.textContent = `${getCurrencySymbol()}${formatCurrency(remainingAmount)}`;

    // Find next due expense
    let nextDue = null;
    let minDaysUntil = Infinity;

    // Track if any expense has past due balance
    let hasPastDue = false;
    let pastDueExpense = null;

    getExpenses().forEach(expense => {
        if (expense.type === 'goal') return;

        // For recurring expenses, check past due status
        if (expense.type === 'recurring') {
            const { pastDue } = getCreditOrPastDue(expense);
            if (pastDue > 0) {
                hasPastDue = true;
                if (!pastDueExpense) pastDueExpense = expense;
                return; // Don't process further, it's past due
            }
        }

        // Skip if already paid this month (and not past due)
        if (hasPaymentForMonth(expense.id, month, year)) return;

        // For loans, skip if fully paid
        if (expense.type === 'loan') {
            const paymentCount = getPaymentCountForCategory(expense.id);
            if (paymentCount >= expense.totalPayments) return;
        }

        let daysUntil = expense.dueDay - currentDay;
        if (daysUntil < 0) {
            // Already past due this month, consider it urgent
            daysUntil = -1;
        }

        if (daysUntil < minDaysUntil) {
            minDaysUntil = daysUntil;
            nextDue = expense;
        }
    });

    if (hasPastDue && pastDueExpense) {
        nextDueEl.textContent = `${pastDueExpense.name} ${I18n.t('summary.pastDue')}`;
        nextDueEl.className = 'text-xl font-semibold text-red-400 truncate';
    } else if (nextDue) {
        if (minDaysUntil < 0) {
            nextDueEl.textContent = `${nextDue.name} ${I18n.t('summary.overdue')}`;
            nextDueEl.className = 'text-xl font-semibold text-red-400 truncate';
        } else if (minDaysUntil === 0) {
            nextDueEl.textContent = `${nextDue.name} ${I18n.t('summary.today')}`;
            nextDueEl.className = 'text-xl font-semibold text-yellow-400 truncate';
        } else {
            nextDueEl.textContent = `${nextDue.name} ${I18n.plural('summary.inDays', minDaysUntil)}`;
            nextDueEl.className = 'text-xl font-semibold text-white truncate';
        }
    } else {
        nextDueEl.textContent = I18n.t('summary.allPaid');
        nextDueEl.className = 'text-xl font-semibold text-emerald-400 truncate';
    }
}

// Open payment modal
function openPaymentModal(categoryId, defaultAmount = null, isSavings = false) {
    const expense = getExpenses().find(e => e.id === categoryId);
    if (!expense) return;

    document.getElementById('modal-title').textContent = isSavings
        ? I18n.t('modal.addToSavings', { name: expense.name })
        : I18n.t('modal.recordPaymentFor', { name: expense.name });

    document.getElementById('payment-category').value = categoryId;

    // For goals/savings, calculate suggested per-paycheck amount
    let suggestedAmount = defaultAmount;
    if (isSavings && expense.type === 'goal') {
        const totalSaved = getTotalPaymentsForCategory(expense.id);
        const remainingBalance = expense.amount - totalSaved;

        // Calculate paychecks remaining using pay period logic (UTC to avoid DST issues)
        const today = new Date();
        const dueDate = new Date(expense.dueDate);
        const startUTC = Date.UTC(2026, 0, 22);
        const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
        const dueUTC = Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const msPerDay = 24 * 60 * 60 * 1000;
        const totalDays = Math.floor((dueUTC - startUTC) / msPerDay);
        const totalPeriods = Math.floor(totalDays / 14);
        const daysSinceStart = Math.max(0, Math.floor((todayUTC - startUTC) / msPerDay));
        const currentPeriod = Math.floor(daysSinceStart / 14) + 1;
        let paychecksRemaining = Math.max(0, totalPeriods - currentPeriod + 1);

        // If paid this pay period, decrement paychecks remaining
        if (hasPaymentForPayPeriod(expense.id) && paychecksRemaining > 0) {
            paychecksRemaining--;
        }

        if (paychecksRemaining > 0 && remainingBalance > 0) {
            suggestedAmount = (remainingBalance / paychecksRemaining).toFixed(2);
        }
    }

    const amountInput = document.getElementById('payment-amount');
    amountInput.value = suggestedAmount || '';

    // Set max limit for goals based on remaining balance
    if (expense.type === 'goal') {
        const totalSaved = getTotalPaymentsForCategory(expense.id);
        const remainingBalance = Math.max(0, expense.amount - totalSaved);
        amountInput.max = remainingBalance.toFixed(2);
    } else {
        amountInput.removeAttribute('max');
    }

    document.getElementById('payment-date').value = getTodayDateString();
    document.getElementById('payment-notes').value = '';

    paymentModal.classList.remove('hidden');
    paymentModal.classList.add('flex');
}

// Close payment modal
function closePaymentModal() {
    paymentModal.classList.add('hidden');
    paymentModal.classList.remove('flex');
    editingPaymentId = null; // Reset edit mode
}

// Handle editing a payment
function handleEditPayment(paymentId) {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;

    const expense = getExpenses().find(e => e.id === payment.category);

    editingPaymentId = paymentId;

    document.getElementById('modal-title').textContent = expense
        ? I18n.t('modal.editPaymentFor', { name: expense.name })
        : I18n.t('modal.editPayment');

    document.getElementById('payment-category').value = payment.category;
    document.getElementById('payment-amount').value = payment.amount;
    document.getElementById('payment-date').value = payment.date;
    document.getElementById('payment-notes').value = payment.notes || '';

    // Remove max limit when editing
    document.getElementById('payment-amount').removeAttribute('max');

    paymentModal.classList.remove('hidden');
    paymentModal.classList.add('flex');
}

// Handle payment form submission
async function handlePaymentSubmit(e) {
    e.preventDefault();

    const payment = {
        category: document.getElementById('payment-category').value,
        amount: parseFloat(document.getElementById('payment-amount').value),
        date: document.getElementById('payment-date').value,
        notes: document.getElementById('payment-notes').value
    };

    if (!payment.amount || payment.amount <= 0) {
        showToast(I18n.t('toast.invalidAmount'), 'error');
        return;
    }

    // Validate goal payments don't exceed remaining balance (only for new payments)
    const expense = getExpenses().find(e => e.id === payment.category);
    if (!editingPaymentId && expense && expense.type === 'goal') {
        const totalSaved = getTotalPaymentsForCategory(expense.id);
        const remainingBalance = expense.amount - totalSaved;
        if (payment.amount > remainingBalance) {
            showToast(I18n.t('toast.exceedsBalance', { amount: getCurrencySymbol() + formatCurrency(remainingBalance) }), 'error');
            return;
        }
    }

    showLoading(true);

    try {
        if (editingPaymentId) {
            // Update existing payment
            await SheetsAPI.updatePayment(editingPaymentId, payment);
            showToast(I18n.t('toast.paymentUpdated'), 'success');
        } else {
            // Save new payment
            await SheetsAPI.savePayment(payment);
            showToast(I18n.t('toast.paymentSaved'), 'success');
        }

        payments = await SheetsAPI.getPayments();
        syncCruisePaymentsToTracker();

        renderExpenseCards();
        renderPaymentHistory();
        updateSummary();

        closePaymentModal();
    } catch (error) {
        console.error('Error saving payment:', error);
        showToast(I18n.t('toast.paymentsFailed'), 'error');
    } finally {
        showLoading(false);
    }
}

// Handle payment deletion
async function handleDeletePayment(paymentId) {
    if (!confirm(I18n.t('confirm.deletePayment'))) {
        return;
    }

    showLoading(true);

    try {
        await SheetsAPI.deletePayment(paymentId);
        payments = await SheetsAPI.getPayments();
        syncCruisePaymentsToTracker();

        renderExpenseCards();
        renderPaymentHistory();
        updateSummary();
        showToast(I18n.t('toast.paymentDeleted'), 'success');
    } catch (error) {
        console.error('Error deleting payment:', error);
        showToast(I18n.t('toast.paymentsFailed'), 'error');
    } finally {
        showLoading(false);
    }
}

// Open bulk payment modal
function openBulkPaymentModal() {
    const { month, year } = getCurrentMonthYear();

    // Set date to today
    document.getElementById('bulk-payment-date').value = getTodayDateString();
    document.getElementById('bulk-payment-notes').value = '';

    // Build checkbox list of unpaid recurring/loan expenses
    expenseCheckboxList.innerHTML = '';

    getSortedExpenses().forEach(expense => {
        // Skip goals - they have variable amounts
        if (expense.type === 'goal') return;

        // For recurring expenses, include if past due OR not paid this month
        if (expense.type === 'recurring') {
            const { pastDue } = getCreditOrPastDue(expense);
            // Skip only if no past due AND paid this month
            if (pastDue === 0 && hasPaymentForMonth(expense.id, month, year)) return;
        } else if (expense.type === 'loan') {
            // For loans, skip if fully paid or paid this month
            const paymentCount = getPaymentCountForCategory(expense.id);
            if (paymentCount >= expense.totalPayments) return;
            if (hasPaymentForMonth(expense.id, month, year)) return;
        } else if (expense.type === 'variable') {
            // For variable expenses, skip if paid this month
            if (hasPaymentForMonth(expense.id, month, year)) return;
        }

        // Calculate default amount: past due amount if past due, else monthly/average amount
        let defaultAmount = expense.amount;
        let isPastDue = false;
        if (expense.type === 'recurring') {
            const { pastDue } = getCreditOrPastDue(expense);
            if (pastDue > 0) {
                defaultAmount = pastDue;
                isPastDue = true;
            }
        } else if (expense.type === 'variable') {
            // For variable expenses, use 3-month average if available
            const average = calculateAverage(expense.id);
            if (average !== null) {
                defaultAmount = average;
            }
        }

        const checkItem = document.createElement('div');
        checkItem.className = 'flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors';
        checkItem.innerHTML = `
            <input type="checkbox" name="expense" value="${expense.id}" id="bulk-check-${expense.id}" class="w-5 h-5 rounded border-white/20 bg-white/5 text-violet-600 focus:ring-violet-500 focus:ring-offset-0">
            <label for="bulk-check-${expense.id}" class="flex items-center gap-2 flex-1 cursor-pointer">
                <span class="text-lg">${expense.icon}</span>
                <span class="text-white">${expense.name}</span>
                ${isPastDue ? `<span class="text-xs text-red-400">${I18n.t('bulk.pastDue')}</span>` : ''}
            </label>
            <div class="flex items-center gap-1">
                <span class="text-violet-400">${getCurrencySymbol()}</span>
                <input type="number" step="0.01" min="0.01" value="${defaultAmount.toFixed(2)}" data-expense-id="${expense.id}" class="bulk-amount-input w-20 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-right text-violet-400 font-semibold focus:outline-none focus:border-violet-500">
            </div>
        `;
        expenseCheckboxList.appendChild(checkItem);
    });

    // Show message if no unpaid expenses
    if (expenseCheckboxList.children.length === 0) {
        expenseCheckboxList.innerHTML = `<p class="text-center text-slate-500 py-4">${I18n.t('bulk.allPaid')}</p>`;
    }

    bulkPaymentModal.classList.remove('hidden');
    bulkPaymentModal.classList.add('flex');
}

// Close bulk payment modal
function closeBulkPaymentModal() {
    bulkPaymentModal.classList.add('hidden');
    bulkPaymentModal.classList.remove('flex');
}

// Handle bulk payment form submission
async function handleBulkPaymentSubmit(e) {
    e.preventDefault();

    const date = document.getElementById('bulk-payment-date').value;
    const notes = document.getElementById('bulk-payment-notes').value;
    const checkboxes = expenseCheckboxList.querySelectorAll('input[type="checkbox"]:checked');

    if (checkboxes.length === 0) {
        showToast(I18n.t('toast.selectExpense'), 'error');
        return;
    }

    showLoading(true);

    try {
        // Save each selected payment
        for (const checkbox of checkboxes) {
            const expenseId = checkbox.value;
            const amountInput = expenseCheckboxList.querySelector(`input[data-expense-id="${expenseId}"]`);
            const amount = parseFloat(amountInput.value);

            if (!amount || amount <= 0) {
                showToast(I18n.t('toast.invalidAmountFor', { name: expenseId }), 'error');
                showLoading(false);
                return;
            }

            const payment = {
                category: expenseId,
                amount: amount,
                date: date,
                notes: notes
            };
            await SheetsAPI.savePayment(payment);
        }

        // Refresh payments data
        payments = await SheetsAPI.getPayments();
        syncCruisePaymentsToTracker();

        renderExpenseCards();
        renderPaymentHistory();
        updateSummary();

        closeBulkPaymentModal();
        showToast(I18n.plural('toast.bulkPaymentsSaved', checkboxes.length), 'success');
    } catch (error) {
        console.error('Error saving bulk payments:', error);
        showToast(I18n.t('toast.paymentsFailed'), 'error');
    } finally {
        showLoading(false);
    }
}

// Event Listeners
closeModalBtn.addEventListener('click', closePaymentModal);
paymentModal.addEventListener('click', (e) => {
    if (e.target === paymentModal || e.target.id === 'payment-modal-backdrop') {
        closePaymentModal();
    }
});
paymentForm.addEventListener('submit', handlePaymentSubmit);

// Keyboard shortcut to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePaymentModal();
        if (bulkPaymentModal) closeBulkPaymentModal();
    }
});

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme first (before any UI shows)
    initTheme();

    // Initialize language selector (must be before currency for translations)
    initLanguage();

    // Initialize currency selector
    initCurrency();

    // Add theme toggle listener
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

    // Load user expenses from localStorage
    loadExpenses();

    // Initialize settings modal
    document.getElementById('settings-btn')?.addEventListener('click', openSettingsModal);
    document.getElementById('close-settings-modal')?.addEventListener('click', closeSettingsModal);
    document.getElementById('settings-modal-backdrop')?.addEventListener('click', closeSettingsModal);
    document.getElementById('add-expense-btn')?.addEventListener('click', () => openExpenseForm());

    // Initialize expense form modal
    document.getElementById('close-expense-form')?.addEventListener('click', closeExpenseForm);
    document.getElementById('expense-form-backdrop')?.addEventListener('click', closeExpenseForm);
    document.getElementById('expense-form')?.addEventListener('submit', handleExpenseFormSubmit);
    document.getElementById('expense-type')?.addEventListener('change', updateExpenseFormFields);

    // Initialize sync status indicator
    initSyncIndicator();

    // Set up export CSV button
    document.getElementById('export-csv-btn')?.addEventListener('click', () => {
        SheetsAPI.exportToCSV();
        showToast(I18n.t('toast.paymentsExported'), 'success');
    });

    // Initialize bulk payment DOM elements
    bulkPaymentBtn = document.getElementById('bulk-payment-btn');
    bulkPaymentModal = document.getElementById('bulk-payment-modal');
    bulkPaymentForm = document.getElementById('bulk-payment-form');
    closeBulkModalBtn = document.getElementById('close-bulk-modal');
    expenseCheckboxList = document.getElementById('expense-checkbox-list');

    // Initialize Firebase auth DOM elements
    authModal = document.getElementById('auth-modal');
    googleSignInBtn = document.getElementById('google-sign-in-btn');
    authError = document.getElementById('auth-error');
    authErrorText = document.getElementById('auth-error-text');
    userInfo = document.getElementById('user-info');
    userAvatar = document.getElementById('user-avatar');
    userName = document.getElementById('user-name');
    signOutBtn = document.getElementById('sign-out-btn');
    setupModal = document.getElementById('setup-modal');
    setupLaterBtn = document.getElementById('setup-later-btn');
    setupContinueBtn = document.getElementById('setup-continue-btn');

    // Set up bulk payment event listeners
    if (bulkPaymentBtn) {
        bulkPaymentBtn.addEventListener('click', openBulkPaymentModal);
    }
    if (closeBulkModalBtn) {
        closeBulkModalBtn.addEventListener('click', closeBulkPaymentModal);
    }
    if (bulkPaymentModal) {
        bulkPaymentModal.addEventListener('click', (e) => {
            if (e.target === bulkPaymentModal || e.target.id === 'bulk-modal-backdrop') {
                closeBulkPaymentModal();
            }
        });
    }
    if (bulkPaymentForm) {
        bulkPaymentForm.addEventListener('submit', handleBulkPaymentSubmit);
    }

    // Set up Firebase auth event listeners
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', handleGoogleSignIn);
    }
    if (signOutBtn) {
        signOutBtn.addEventListener('click', handleSignOut);
    }
    if (setupLaterBtn) {
        setupLaterBtn.addEventListener('click', handleSetupLater);
    }
    if (setupContinueBtn) {
        setupContinueBtn.addEventListener('click', handleSetupContinue);
    }

    // Auto-select amount fields on focus (event delegation for dynamic inputs)
    document.addEventListener('focus', (e) => {
        if (e.target.type === 'number') {
            e.target.select();
        }
    }, true);

    // Initialize Lucide icons
    initLucideIcons();

    // Display version
    document.getElementById('version-tag').textContent = 'v' + APP_VERSION;

    // Initialize Firebase auth and check sign-in state
    initFirebaseAuth();
});
