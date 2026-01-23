// Google Apps Script API integration with localStorage fallback

const SheetsAPI = {
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
        try {
            const response = await fetch(CONFIG.APPS_SCRIPT_URL);

            if (!response.ok) {
                throw new Error('Failed to fetch from Apps Script');
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            return data.payments || [];
        } catch (error) {
            console.error('Error fetching from Apps Script:', error);
            // Fallback to localStorage
            return this.getPaymentsFromLocalStorage();
        }
    },

    async savePaymentToSheets(payment) {
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

            return data.payment;
        } catch (error) {
            console.error('Error saving to Apps Script:', error);
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

    // ============ LocalStorage Methods ============

    getPaymentsFromLocalStorage() {
        const stored = localStorage.getItem('alex_expense_payments');
        if (!stored) return [];

        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing localStorage:', e);
            return [];
        }
    },

    savePaymentToLocalStorage(payment) {
        const payments = this.getPaymentsFromLocalStorage();

        // Add unique ID and timestamp
        payment.id = this.generateId();
        payment.timestamp = new Date().toISOString();

        payments.push(payment);

        // Sort by date, newest first
        payments.sort((a, b) => new Date(b.date) - new Date(a.date));

        localStorage.setItem('alex_expense_payments', JSON.stringify(payments));
        return payment;
    },

    // Add payment to localStorage without generating new ID (for syncing from cloud)
    addToLocalStorage(payment) {
        const payments = this.getPaymentsFromLocalStorage();
        payments.push(payment);
        payments.sort((a, b) => new Date(b.date) - new Date(a.date));
        localStorage.setItem('alex_expense_payments', JSON.stringify(payments));
    },

    // Delete a payment
    async deletePayment(paymentId) {
        if (this.isConfigured() && !CONFIG.USE_LOCAL_STORAGE) {
            await this.deletePaymentFromSheets(paymentId);
        }
        // Always update localStorage too (for offline fallback)
        const payments = this.getPaymentsFromLocalStorage();
        const filtered = payments.filter(p => p.id !== paymentId);
        localStorage.setItem('alex_expense_payments', JSON.stringify(filtered));
    },

    // Clear all payments (use with caution)
    clearAllPayments() {
        localStorage.removeItem('alex_expense_payments');
    },

    // ============ Utility Methods ============

    generateId() {
        return 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // Export payments to CSV (for backup or importing to Google Sheets)
    exportToCSV() {
        const payments = this.getPaymentsFromLocalStorage();
        if (payments.length === 0) {
            alert('No payments to export');
            return;
        }

        const headers = ['Date', 'Category', 'Amount', 'Notes', 'ID'];
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
