// Web Push Notification Manager
// Uses standard Web Push API (PushManager) instead of Firebase Cloud Messaging
// Same public API as before — app.js requires zero changes

const FCMManager = {
    _firestore: null,
    _initialized: false,
    _subscription: null,

    async init() {
        if (this._initialized) return;

        // Only initialize for the primary user or admin
        if (!FirebaseAuth.isSignedIn() || (!FirebaseAuth.isPrimaryUser() && !FirebaseAuth.isAdmin())) return;

        try {
            this._firestore = firebase.firestore();
            this._initialized = true;

            // Listen for messages from service worker (foreground toasts)
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
                    this._handleForegroundMessage(event.data);
                }
            });

            // Update bell icon state
            this._updateBellIcon();
        } catch (err) {
            console.error('Push notification init error:', err);
        }
    },

    async requestPermissionAndRegister() {
        if (!this._initialized) await this.init();
        if (!this._firestore) return;

        // Check if notifications are supported
        if (!('Notification' in window) || !('PushManager' in window)) {
            console.warn('Push notifications not supported in this browser');
            showToast('Push notifications not supported in this browser', 'error');
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
            const swReg = await navigator.serviceWorker.ready;

            // Unsubscribe from any existing subscription (e.g. old FCM key)
            const existingSub = await swReg.pushManager.getSubscription();
            if (existingSub) {
                await existingSub.unsubscribe();
            }

            // Convert VAPID key from base64url to Uint8Array
            const applicationServerKey = this._urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

            // Subscribe using standard PushManager
            const subscription = await swReg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            });

            this._subscription = subscription;
            await this._saveSubscription(subscription);
            await this.syncExpenseConfig();
            this._updateBellIcon();
            console.log('Push subscription registered successfully');
        } catch (err) {
            console.error('Push subscription error:', err);
            showToast('Failed to enable notifications: ' + err.message, 'error');
        }
    },

    async _saveSubscription(subscription) {
        const user = FirebaseAuth.getCurrentUser();
        if (!user || !this._firestore) return;

        try {
            // Use endpoint hash as document ID for uniqueness
            const subJson = subscription.toJSON();
            const docId = btoa(subJson.endpoint).replace(/[/+=]/g, '_').substring(0, 128);

            await this._firestore.collection('push_subscriptions').doc(docId).set({
                uid: user.uid,
                email: user.email,
                endpoint: subJson.endpoint,
                keys: subJson.keys,
                userAgent: navigator.userAgent,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (err) {
            console.error('Error saving push subscription:', err);
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

    _handleForegroundMessage(data) {
        const title = data.title || 'Expense Reminder';
        const body = data.body || '';
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
    },

    // Convert base64url-encoded VAPID key to Uint8Array for PushManager
    _urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
};
