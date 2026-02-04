// Google Apps Script API integration with localStorage fallback

const SheetsAPI = {
    // Session cache for payments data (in memory)
    _sessionCache: null,

    // Sync status: 'synced', 'offline', 'syncing', 'error'
    _syncStatus: 'synced',
    _lastSyncTime: null,
    _syncListeners: [],

    // Subscribe to sync status changes
    onSyncStatusChange(callback) {
        this._syncListeners.push(callback);
    },

    // Update sync status and notify listeners
    _setSyncStatus(status) {
        this._syncStatus = status;
        if (status === 'synced') {
            this._lastSyncTime = new Date();
        }
        this._syncListeners.forEach(cb => cb(status, this._lastSyncTime));
    },

    // Get current sync status
    getSyncStatus() {
        return { status: this._syncStatus, lastSync: this._lastSyncTime };
    },

    // Check if Apps Script is configured (either global or user-specific)
    isConfigured() {
        const userUrl = this.getUserAppsScriptUrl();
        return (userUrl && userUrl !== '') ||
               (CONFIG.APPS_SCRIPT_URL && CONFIG.APPS_SCRIPT_URL !== 'YOUR_APPS_SCRIPT_URL_HERE');
    },

    // Get user-specific Apps Script URL (if configured)
    getUserAppsScriptUrl() {
        const prefix = this._getStoragePrefix();
        return localStorage.getItem(prefix + 'apps_script_url') || '';
    },

    // Set user-specific Apps Script URL
    setUserAppsScriptUrl(url) {
        const prefix = this._getStoragePrefix();
        if (url) {
            localStorage.setItem(prefix + 'apps_script_url', url);
        } else {
            localStorage.removeItem(prefix + 'apps_script_url');
        }
    },

    // Get the active Apps Script URL (user-specific takes priority over global)
    getActiveAppsScriptUrl() {
        const userUrl = this.getUserAppsScriptUrl();
        if (userUrl && userUrl !== '') {
            return userUrl;
        }
        return CONFIG.APPS_SCRIPT_URL;
    },

    // Get storage key prefix (user-specific if signed in)
    _getStoragePrefix() {
        if (typeof FirebaseAuth !== 'undefined' && FirebaseAuth.isSignedIn()) {
            return FirebaseAuth.getUserStoragePrefix();
        }
        return '';
    },

    // Get user-scoped localStorage key
    _getStorageKey(key) {
        return this._getStoragePrefix() + key;
    },

    // Get all payments from storage
    async getPayments() {
        if (this.isConfigured() && !CONFIG.USE_LOCAL_STORAGE) {
            return await this.getPaymentsFromSheets();
        }
        return this.getPaymentsFromLocalStorage();
    },

    // Save a new payment
    async savePayment(payment) {
        if (this.isConfigured() && !CONFIG.USE_LOCAL_STORAGE) {
            return await this.savePaymentToSheets(payment);
        }
        return this.savePaymentToLocalStorage(payment);
    },

    // ============ Google Apps Script Methods ============

    async getPaymentsFromSheets() {
        this._setSyncStatus('syncing');
        try {
            const url = this.getActiveAppsScriptUrl();
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Failed to fetch from Apps Script');
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            this._setSyncStatus('synced');
            return data.payments || [];
        } catch (error) {
            console.error('Error fetching from Apps Script:', error);
            this._setSyncStatus('offline');
            // Fallback to localStorage
            return this.getPaymentsFromLocalStorage();
        }
    },

    async savePaymentToSheets(payment) {
        this._setSyncStatus('syncing');
        try {
            // Add unique ID
            payment.id = this.generateId();
            payment.timestamp = new Date().toISOString();

            const url = this.getActiveAppsScriptUrl();
            // Use text/plain to avoid CORS preflight (Apps Script limitation)
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify(payment),
                redirect: 'follow'
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Also save to localStorage for offline access
            this.addToLocalStorage(payment);

            this._setSyncStatus('synced');
            return data.payment;
        } catch (error) {
            console.error('Error saving to Apps Script:', error);
            this._setSyncStatus('offline');
            // Fallback to localStorage
            return this.savePaymentToLocalStorage(payment);
        }
    },

    async deletePaymentFromSheets(paymentId) {
        try {
            const url = this.getActiveAppsScriptUrl();
            // Use text/plain to avoid CORS preflight (Apps Script limitation)
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify({
                    action: 'delete',
                    id: paymentId
                }),
                redirect: 'follow'
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            return data.success;
        } catch (error) {
            console.error('Error deleting from Apps Script:', error);
            throw error;
        }
    },

    // ============ Session Management ============

    // Set session with payments data
    setSession(payments) {
        this._sessionCache = payments;
    },

    // Clear session
    clearSession() {
        this._sessionCache = null;
    },

    // Check if session is active
    hasSession() {
        return this._sessionCache !== null;
    },

    // ============ LocalStorage Methods ============

    getPaymentsFromLocalStorage() {
        // If session is active, return cached data
        if (this._sessionCache !== null) {
            return this._sessionCache;
        }

        // Try user-scoped key first
        const userKey = this._getStorageKey('alex_expense_payments');
        const userData = localStorage.getItem(userKey);
        if (userData) {
            try {
                const payments = JSON.parse(userData);
                this._sessionCache = payments;
                return payments;
            } catch (e) {
                console.error('Error parsing user localStorage:', e);
            }
        }

        // Fall back to legacy unscoped key (for migration)
        const legacyData = localStorage.getItem('alex_expense_payments');
        if (legacyData) {
            try {
                const payments = JSON.parse(legacyData);
                // Migrate to user-scoped key if signed in
                if (this._getStoragePrefix()) {
                    this._savePaymentsToStorage(payments);
                    // Don't delete legacy data in case other users need it
                }
                this._sessionCache = payments;
                return payments;
            } catch (e) {
                console.error('Error parsing legacy localStorage:', e);
            }
        }

        return [];
    },

    async savePaymentToLocalStorage(payment) {
        const payments = this.getPaymentsFromLocalStorage();

        // Add unique ID and timestamp
        payment.id = this.generateId();
        payment.timestamp = new Date().toISOString();

        payments.push(payment);

        // Sort by date, newest first
        payments.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Update session cache and save to localStorage
        this._sessionCache = payments;
        this._savePaymentsToStorage(payments);

        return payment;
    },

    // Add payment to localStorage without generating new ID (for syncing from cloud)
    addToLocalStorage(payment) {
        const payments = this.getPaymentsFromLocalStorage();
        payments.push(payment);
        payments.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Update session cache and save to localStorage
        this._sessionCache = payments;
        this._savePaymentsToStorage(payments);
    },

    // Delete a payment
    async deletePayment(paymentId) {
        if (this.isConfigured() && !CONFIG.USE_LOCAL_STORAGE) {
            await this.deletePaymentFromSheets(paymentId);
        }
        // Always update localStorage too (for offline fallback)
        const payments = this.getPaymentsFromLocalStorage();
        const filtered = payments.filter(p => p.id !== paymentId);

        // Update session cache and save to localStorage
        this._sessionCache = filtered;
        this._savePaymentsToStorage(filtered);
    },

    // Update an existing payment
    async updatePayment(paymentId, updates) {
        if (this.isConfigured() && !CONFIG.USE_LOCAL_STORAGE) {
            await this.updatePaymentInSheets(paymentId, updates);
        }
        // Always update localStorage too
        const payments = this.getPaymentsFromLocalStorage();
        const index = payments.findIndex(p => p.id === paymentId);
        if (index !== -1) {
            payments[index] = { ...payments[index], ...updates };
            payments.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        // Update session cache and save to localStorage
        this._sessionCache = payments;
        this._savePaymentsToStorage(payments);
        return payments[index];
    },

    async updatePaymentInSheets(paymentId, updates) {
        this._setSyncStatus('syncing');
        try {
            const url = this.getActiveAppsScriptUrl();
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify({
                    action: 'update',
                    id: paymentId,
                    updates: updates
                }),
                redirect: 'follow'
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            this._setSyncStatus('synced');
            return data.success;
        } catch (error) {
            console.error('Error updating in Apps Script:', error);
            this._setSyncStatus('offline');
            // Continue with localStorage update
        }
    },

    // Internal: Save payments to localStorage (user-scoped)
    _savePaymentsToStorage(payments) {
        const key = this._getStorageKey('alex_expense_payments');
        localStorage.setItem(key, JSON.stringify(payments));
    },

    // Clear all payments for current user (use with caution)
    clearAllPayments() {
        const key = this._getStorageKey('alex_expense_payments');
        localStorage.removeItem(key);
        this.clearSession();
    },

    // ============ Utility Methods ============

    generateId() {
        return 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // Export payments to CSV (for backup or importing to Google Sheets)
    exportToCSV() {
        const payments = this.getPaymentsFromLocalStorage();
        if (payments.length === 0) {
            alert(I18n.t('history.noPayments'));
            return;
        }

        const headers = [
            I18n.t('csv.date'),
            I18n.t('csv.category'),
            I18n.t('csv.amount'),
            I18n.t('csv.notes'),
            I18n.t('csv.id')
        ];
        const rows = payments.map(p => [
            p.date,
            p.category,
            p.amount,
            p.notes || '',
            p.id
        ]);

        const csv = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alex_expenses_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
};
