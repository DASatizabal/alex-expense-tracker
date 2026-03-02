// Firebase Cloud Messaging (FCM) Manager
// Handles push notification registration, token storage, and expense config sync

const FCMManager = {
    _messaging: null,
    _firestore: null,
    _initialized: false,
    _token: null,

    async init() {
        if (this._initialized) return;

        // Only initialize for the primary user
        if (!FirebaseAuth.isSignedIn() || !FirebaseAuth.isPrimaryUser()) return;

        // Check if Firebase Messaging is available
        if (typeof firebase.messaging !== 'function') {
            console.warn('Firebase Messaging SDK not loaded');
            return;
        }

        try {
            this._messaging = firebase.messaging();
            this._firestore = firebase.firestore();
            this._initialized = true;

            // Listen for foreground messages
            this._messaging.onMessage((payload) => {
                this._handleForegroundMessage(payload);
            });

            // Update bell icon state
            this._updateBellIcon();
        } catch (err) {
            console.error('FCM init error:', err);
        }
    },

    async requestPermissionAndRegister() {
        if (!this._initialized) await this.init();
        if (!this._messaging) return;

        // Check if notifications are supported
        if (!('Notification' in window)) {
            console.warn('Notifications not supported in this browser');
            showToast('Notifications not supported in this browser', 'error');
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            showToast('Notification permission denied', 'info');
            this._updateBellIcon();
            return;
        }

        try {
            // Get the service worker registration
            const swReg = await navigator.serviceWorker.getRegistration();
            if (!swReg) {
                console.error('No service worker registration found');
                return;
            }

            const token = await this._messaging.getToken({
                vapidKey: FCM_VAPID_KEY,
                serviceWorkerRegistration: swReg
            });

            if (token) {
                this._token = token;
                await this._saveToken(token);
                await this.syncExpenseConfig();
                this._updateBellIcon();
                console.log('FCM token registered successfully');
            }
        } catch (err) {
            console.error('FCM token registration error:', err);
            showToast('Failed to enable notifications', 'error');
        }
    },

    async _saveToken(token) {
        const user = FirebaseAuth.getCurrentUser();
        if (!user || !this._firestore) return;

        try {
            await this._firestore.collection('fcm_tokens').doc(token).set({
                uid: user.uid,
                email: user.email,
                token: token,
                userAgent: navigator.userAgent,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (err) {
            console.error('Error saving FCM token:', err);
        }
    },

    async syncExpenseConfig() {
        if (!this._firestore || !this._initialized) return;

        try {
            const expenses = getExpenses().map(e => ({
                id: e.id,
                name: e.name,
                amount: e.amount,
                type: e.type,
                dueDay: e.dueDay || null,
                dueDate: e.dueDate ? e.dueDate.toISOString() : null,
                totalPayments: e.totalPayments || null
            }));

            await this._firestore.collection('expense_config').doc('primary_user').set({
                expenses: expenses,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (err) {
            console.error('Error syncing expense config:', err);
        }
    },

    _handleForegroundMessage(payload) {
        const title = payload.notification?.title || 'Expense Reminder';
        const body = payload.notification?.body || '';
        showToast(`${title}: ${body}`, 'info');
    },

    _updateBellIcon() {
        const btn = document.getElementById('notification-bell');
        if (!btn) return;

        const isGranted = Notification.permission === 'granted';
        const iconName = isGranted ? 'bell' : 'bell-off';
        btn.innerHTML = `<i data-lucide="${iconName}" class="w-4 h-4 text-slate-500 group-hover:text-violet-400"></i>`;
        btn.title = isGranted ? 'Notifications enabled' : 'Enable notifications';

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    },

    isNotificationEnabled() {
        return 'Notification' in window && Notification.permission === 'granted';
    }
};
