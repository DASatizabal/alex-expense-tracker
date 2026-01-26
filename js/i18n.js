// Internationalization (i18n) Module for Alex's Expense Tracker

const I18n = {
    currentLanguage: 'en',

    // Available languages
    LANGUAGES: {
        en: { code: 'en', name: 'English', nativeName: 'English' }
    },

    // Translations organized by key category
    translations: {
        en: {
            // App header
            'app.title': "Alex's Expense Tracker",
            'app.subtitle': 'Track expenses, manage payments, reach your goals',

            // Summary section
            'summary.remaining': 'Remaining This Month',
            'summary.nextDue': 'Next Due',
            'summary.allPaid': 'All paid!',
            'summary.today': '(Today!)',
            'summary.overdue': '(Overdue!)',
            'summary.pastDue': '(Past Due!)',
            'summary.inDays_one': '(in {{count}} day)',
            'summary.inDays_other': '(in {{count}} days)',

            // Buttons
            'button.bulkPayment': 'Bulk Payment',
            'button.markAsPaid': 'Mark as Paid',
            'button.addToSavings': 'Add to Savings',
            'button.savePayment': 'Save Payment',
            'button.paySelected': 'Pay Selected',
            'button.unlock': 'Unlock',
            'button.createPassword': 'Create Password',
            'button.cancel': 'Cancel',
            'button.reset': 'Reset',
            'button.export': 'Export',

            // Labels
            'label.amount': 'Amount',
            'label.date': 'Date',
            'label.paymentDate': 'Payment Date',
            'label.notes': 'Notes (optional)',
            'label.password': 'Password',
            'label.confirmPassword': 'Confirm Password',
            'label.selectExpenses': 'Select Expenses to Pay',

            // Placeholders
            'placeholder.notes': 'e.g., Paid to Mom, Paid to David, etc.',
            'placeholder.bulkNotes': 'Paid to Mom, Paid to David, etc.',
            'placeholder.password': 'Enter password',
            'placeholder.confirmPassword': 'Confirm password',

            // Modal titles
            'modal.recordPayment': 'Record Payment',
            'modal.recordPaymentFor': 'Record {{name}} Payment',
            'modal.addToSavings': 'Add to {{name}} Savings',
            'modal.editPayment': 'Edit Payment',
            'modal.editPaymentFor': 'Edit {{name}} Payment',
            'modal.bulkPayment': 'Bulk Payment',
            'modal.unlockApp': 'Unlock App',
            'modal.createPassword': 'Create Password',
            'modal.resetData': 'Reset App Data?',

            // Modal subtitles
            'modal.unlockSubtitle': 'Enter your password to continue',
            'modal.createPasswordSubtitle': 'Set a password to protect your data',
            'modal.resetSubtitle': 'This will delete all local payment data and password. Cloud data (Google Sheets) will remain safe.',

            // Status labels
            'status.paid': 'Paid this month',
            'status.paidPayperiod': 'Paid this payperiod',
            'status.goalReached': 'Goal Reached!',
            'status.paidOff': 'Paid Off!',
            'status.overdue': 'Overdue!',
            'status.pastDue': 'Past Due!',
            'status.dueToday': 'Due today',
            'status.dueSoon_one': 'Due in {{count}} day',
            'status.dueSoon_other': 'Due in {{count}} days',
            'status.daysLeft_one': '{{count}} day left',
            'status.daysLeft_other': '{{count}} days left',
            'status.dueOnThe': 'Due on the {{ordinal}} of month',

            // Sync indicator
            'sync.synced': 'Synced',
            'sync.syncing': 'Syncing...',
            'sync.offline': 'Offline',
            'sync.error': 'Sync Error',
            'sync.unknown': 'Unknown',
            'sync.lastSynced': 'Last synced: {{time}}',

            // Toast notifications
            'toast.paymentSaved': 'Payment saved successfully!',
            'toast.paymentUpdated': 'Payment updated successfully!',
            'toast.paymentDeleted': 'Payment deleted',
            'toast.paymentsFailed': 'Failed to save payment',
            'toast.loadFailed': 'Failed to load data',
            'toast.currencyChanged': 'Currency changed to {{currency}}',
            'toast.languageChanged': 'Language changed to {{language}}',
            'toast.passwordCreated': 'Password created successfully!',
            'toast.welcomeBack': 'Welcome back!',
            'toast.incorrectPassword': 'Incorrect password',
            'toast.noPasswordFound': 'No password found',
            'toast.setupFailed': 'Failed to set up password',
            'toast.passwordTooShort': 'Password must be at least 4 characters',
            'toast.passwordsMismatch': 'Passwords do not match',
            'toast.dataCleared': 'Data cleared. Create a new password.',
            'toast.selectExpense': 'Please select at least one expense',
            'toast.invalidAmount': 'Please enter a valid amount',
            'toast.invalidAmountFor': 'Invalid amount for {{name}}',
            'toast.exceedsBalance': 'Amount exceeds remaining balance ({{amount}})',
            'toast.paymentsExported': 'Payments exported to CSV',
            'toast.bulkPaymentsSaved_one': '{{count}} payment saved!',
            'toast.bulkPaymentsSaved_other': '{{count}} payments saved!',

            // Progress text
            'progress.paymentsOf': '{{current}} of {{total}} payments',
            'progress.savedOf': '{{saved}} of {{total}}',
            'progress.paychecksLeft': '{{count}} paychecks left',
            'progress.perPaycheck': '{{amount}}/paycheck',
            'progress.remaining': '{{amount}} remaining',

            // Expense card text
            'expense.perMonth': '{{amount}}/month',
            'expense.total': '{{amount}} total',
            'expense.dueDate': 'Due: {{date}}',
            'expense.dueDay': 'Due: {{ordinal}} of month',
            'expense.credit': '{{amount}} Credit',
            'expense.pastDue': '{{amount}} Past Due!',

            // Payment history
            'history.title': 'Recent Payments',
            'history.noPayments': 'No payments recorded yet',
            'history.editPayment': 'Edit payment',
            'history.deletePayment': 'Delete payment',

            // Confirmation dialogs
            'confirm.deletePayment': 'Are you sure you want to delete this payment?',
            'confirm.forgotPassword': 'Forgot password? Reset app data',

            // Loading
            'loading.text': 'Loading...',

            // CSV export headers
            'csv.date': 'Date',
            'csv.category': 'Category',
            'csv.amount': 'Amount',
            'csv.notes': 'Notes',
            'csv.id': 'ID',

            // Tooltips
            'tooltip.syncStatus': 'Sync status',
            'tooltip.selectCurrency': 'Select currency',
            'tooltip.selectLanguage': 'Select language',
            'tooltip.toggleTheme': 'Toggle theme',
            'tooltip.lockApp': 'Lock App',
            'tooltip.exportCSV': 'Export to CSV',

            // Bulk payment
            'bulk.allPaid': 'All expenses are paid and current!',
            'bulk.pastDue': '(Past Due)',

            // Ordinals
            'ordinal.st': 'st',
            'ordinal.nd': 'nd',
            'ordinal.rd': 'rd',
            'ordinal.th': 'th'
        }
    },

    /**
     * Initialize i18n - load saved language or detect from browser
     */
    init() {
        const savedLanguage = localStorage.getItem('alex_expense_language');
        if (savedLanguage && this.LANGUAGES[savedLanguage]) {
            this.currentLanguage = savedLanguage;
        } else {
            // Auto-detect from browser
            const browserLang = navigator.language.split('-')[0];
            if (this.LANGUAGES[browserLang]) {
                this.currentLanguage = browserLang;
            }
        }
    },

    /**
     * Set the current language
     * @param {string} code - Language code (e.g., 'en', 'es')
     */
    setLanguage(code) {
        if (this.LANGUAGES[code]) {
            this.currentLanguage = code;
            localStorage.setItem('alex_expense_language', code);
            this.translatePage();
            return true;
        }
        return false;
    },

    /**
     * Get a translation by key with optional parameter interpolation
     * @param {string} key - Translation key (e.g., 'toast.paymentSaved')
     * @param {Object} params - Parameters for interpolation (e.g., {name: 'Rent'})
     * @returns {string} - Translated string or key if not found
     */
    t(key, params = {}) {
        const translations = this.translations[this.currentLanguage] || this.translations.en;
        let text = translations[key];

        if (text === undefined) {
            console.warn(`Missing translation: ${key}`);
            return key;
        }

        // Interpolate parameters: {{name}} -> value
        Object.keys(params).forEach(param => {
            text = text.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
        });

        return text;
    },

    /**
     * Get a pluralized translation
     * @param {string} key - Base translation key (e.g., 'status.daysLeft')
     * @param {number} count - The count for pluralization
     * @param {Object} params - Additional parameters
     * @returns {string} - Pluralized translated string
     */
    plural(key, count, params = {}) {
        // Determine suffix based on count (English rules: 1 = _one, else = _other)
        const suffix = count === 1 ? '_one' : '_other';
        const pluralKey = key + suffix;

        return this.t(pluralKey, { count, ...params });
    },

    /**
     * Translate all elements with data-i18n attributes
     */
    translatePage() {
        // Translate text content
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.t(key);
        });

        // Translate placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });

        // Translate titles (tooltips)
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.title = this.t(key);
        });

        // Update HTML lang attribute
        document.documentElement.lang = this.currentLanguage;
    },

    /**
     * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
     * @param {number} n - The number
     * @returns {string} - Number with ordinal suffix
     */
    getOrdinal(n) {
        const s = [
            this.t('ordinal.th'),
            this.t('ordinal.st'),
            this.t('ordinal.nd'),
            this.t('ordinal.rd')
        ];
        const v = n % 100;
        const suffix = s[(v - 20) % 10] || s[v] || s[0];
        return n + suffix;
    },

    /**
     * Get list of available languages for selector
     * @returns {Array} - Array of {code, name, nativeName}
     */
    getAvailableLanguages() {
        return Object.values(this.LANGUAGES);
    }
};
