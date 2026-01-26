// Google Apps Script API integration with localStorage fallback

const SheetsAPI = {
    // Session cache for decrypted data (only in memory, never in localStorage)
    _sessionCache: null,
    _sessionPassword: null,

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

    // Check if Apps Script is configured
    isConfigured() {
        return CONFIG.APPS_SCRIPT_URL &&
               CONFIG.APPS_SCRIPT_URL !== 'YOUR_APPS_SCRIPT_URL_HERE';
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
            const response = await fetch(CONFIG.APPS_SCRIPT_URL);

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

            // Use text/plain to avoid CORS preflight (Apps Script limitation)
            const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
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
            // Use text/plain to avoid CORS preflight (Apps Script limitation)
            const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
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

    // Set session with decrypted data and password
    setSession(payments, password) {
        this._sessionCache = payments;
        this._sessionPassword = password;
    },

    // Clear session (for locking)
    clearSession() {
        this._sessionCache = null;
        this._sessionPassword = null;
    },

    // Check if session is active
    hasSession() {
        return this._sessionCache !== null && this._sessionPassword !== null;
    },

    // Get session password (for re-encryption)
    getSessionPassword() {
        return this._sessionPassword;
    },

    // ============ LocalStorage Methods ============

    getPaymentsFromLocalStorage() {
        // If session is active, return cached data
        if (this._sessionCache !== null) {
            return this._sessionCache;
        }

        // Check for unencrypted data (backwards compatibility)
        const unencrypted = localStorage.getItem('alex_expense_payments');
        if (unencrypted) {
            try {
                return JSON.parse(unencrypted);
            } catch (e) {
                console.error('Error parsing localStorage:', e);
                return [];
            }
        }

        // No session and no unencrypted data
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

        // Update session cache
        this._sessionCache = payments;

        // Encrypt and save to localStorage
        await this._saveEncryptedPayments(payments);

        return payment;
    },

    // Add payment to localStorage without generating new ID (for syncing from cloud)
    async addToLocalStorage(payment) {
        const payments = this.getPaymentsFromLocalStorage();
        payments.push(payment);
        payments.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Update session cache
        this._sessionCache = payments;

        // Encrypt and save to localStorage
        await this._saveEncryptedPayments(payments);
    },

    // Delete a payment
    async deletePayment(paymentId) {
        if (this.isConfigured() && !CONFIG.USE_LOCAL_STORAGE) {
            await this.deletePaymentFromSheets(paymentId);
        }
        // Always update localStorage too (for offline fallback)
        const payments = this.getPaymentsFromLocalStorage();
        const filtered = payments.filter(p => p.id !== paymentId);

        // Update session cache
        this._sessionCache = filtered;

        // Encrypt and save to localStorage
        await this._saveEncryptedPayments(filtered);
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

        // Update session cache
        this._sessionCache = payments;

        // Encrypt and save to localStorage
        await this._saveEncryptedPayments(payments);
        return payments[index];
    },

    async updatePaymentInSheets(paymentId, updates) {
        this._setSyncStatus('syncing');
        try {
            const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
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

    // Internal: Save encrypted payments to localStorage
    async _saveEncryptedPayments(payments) {
        if (this._sessionPassword) {
            const encrypted = await Encryption.encrypt(payments, this._sessionPassword);
            Encryption.storeEncryptedData(encrypted);
        }
    },

    // Clear all payments (use with caution)
    clearAllPayments() {
        localStorage.removeItem('alex_expense_payments');
        Encryption.clearAllData();
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
