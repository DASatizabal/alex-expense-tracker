// Firebase Authentication Module for Alex's Expense Tracker
// Handles Google OAuth sign-in with Firebase

const FirebaseAuth = {
    // Firebase app and auth instances
    _app: null,
    _auth: null,
    _user: null,
    _authStateListeners: [],
    _initialized: false,

    /**
     * Check if Firebase is properly configured
     */
    isConfigured() {
        return FIREBASE_CONFIG &&
               FIREBASE_CONFIG.apiKey &&
               FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY' &&
               FIREBASE_CONFIG.projectId &&
               FIREBASE_CONFIG.projectId !== 'YOUR_PROJECT_ID';
    },

    /**
     * Initialize Firebase with config
     * Must be called before any other Firebase operations
     */
    async init() {
        if (this._initialized) {
            return true;
        }

        if (!this.isConfigured()) {
            console.warn('Firebase not configured. Using offline mode.');
            return false;
        }

        try {
            // Initialize Firebase app
            this._app = firebase.initializeApp(FIREBASE_CONFIG);
            this._auth = firebase.auth();

            // Set up auth state listener
            this._auth.onAuthStateChanged((user) => {
                this._user = user;
                this._notifyListeners(user);
            });

            // Enable persistence for offline support
            await this._auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

            this._initialized = true;
            return true;
        } catch (error) {
            console.error('Firebase initialization error:', error);
            return false;
        }
    },

    /**
     * Sign in with Google popup
     * @returns {Promise<Object|null>} User object or null if cancelled/failed
     */
    async signIn() {
        if (!this._initialized) {
            console.error('Firebase not initialized');
            return null;
        }

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            // Request additional scopes if needed
            provider.addScope('email');
            provider.addScope('profile');

            const result = await this._auth.signInWithPopup(provider);
            return result.user;
        } catch (error) {
            if (error.code === 'auth/popup-closed-by-user') {
                console.log('Sign-in cancelled by user');
                return null;
            }
            if (error.code === 'auth/popup-blocked') {
                console.error('Popup blocked. Please allow popups for this site.');
                throw new Error('popup-blocked');
            }
            console.error('Sign-in error:', error);
            throw error;
        }
    },

    /**
     * Sign out current user
     */
    async signOut() {
        if (!this._initialized || !this._auth) {
            return;
        }

        try {
            await this._auth.signOut();
            this._user = null;
        } catch (error) {
            console.error('Sign-out error:', error);
            throw error;
        }
    },

    /**
     * Register a callback for auth state changes
     * @param {Function} callback - Called with user object (or null when signed out)
     * @returns {Function} Unsubscribe function
     */
    onAuthStateChanged(callback) {
        this._authStateListeners.push(callback);

        // Immediately call with current state if already initialized
        if (this._initialized) {
            callback(this._user);
        }

        // Return unsubscribe function
        return () => {
            const index = this._authStateListeners.indexOf(callback);
            if (index > -1) {
                this._authStateListeners.splice(index, 1);
            }
        };
    },

    /**
     * Notify all auth state listeners
     * @private
     */
    _notifyListeners(user) {
        this._authStateListeners.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('Auth state listener error:', error);
            }
        });
    },

    /**
     * Get the current user
     * @returns {Object|null} Current user or null if not signed in
     */
    getCurrentUser() {
        return this._user;
    },

    /**
     * Check if user is currently signed in
     * @returns {boolean}
     */
    isSignedIn() {
        return this._user !== null;
    },

    /**
     * Get user's display name
     * @returns {string}
     */
    getUserDisplayName() {
        if (!this._user) return '';
        return this._user.displayName || this._user.email?.split('@')[0] || 'User';
    },

    /**
     * Get user's first name (for short display)
     * @returns {string}
     */
    getUserFirstName() {
        const displayName = this.getUserDisplayName();
        return displayName.split(' ')[0];
    },

    /**
     * Get user's photo URL
     * @returns {string|null}
     */
    getUserPhotoURL() {
        return this._user?.photoURL || null;
    },

    /**
     * Get user's email
     * @returns {string|null}
     */
    getUserEmail() {
        return this._user?.email || null;
    },

    /**
     * Get user's unique ID (for localStorage prefixing)
     * @returns {string|null}
     */
    getUserId() {
        return this._user?.uid || null;
    },

    /**
     * Check if current user is the primary user
     * @returns {boolean}
     */
    isPrimaryUser() {
        const email = this.getUserEmail();
        return email && email === AUTH_ROLES.PRIMARY_USER;
    },

    /**
     * Check if current user is an admin
     * @returns {boolean}
     */
    isAdmin() {
        const email = this.getUserEmail();
        return email && AUTH_ROLES.ADMINS.includes(email);
    },

    /**
     * Check if current user is a known user (primary or admin)
     * Known users skip the setup wizard and use the default Google Sheet
     * @returns {boolean}
     */
    isKnownUser() {
        return this.isPrimaryUser() || this.isAdmin();
    },

    /**
     * For admin: currently viewed user's storage prefix
     * Allows admin to switch between users' data
     */
    _viewingUserPrefix: null,

    /**
     * Set which user's data the admin is viewing
     * @param {string|null} prefix - User storage prefix, or null for own data
     */
    setViewingUser(prefix) {
        this._viewingUserPrefix = prefix;
    },

    /**
     * Get the currently viewed user prefix (for admin switching)
     * @returns {string|null}
     */
    getViewingUserPrefix() {
        return this._viewingUserPrefix;
    },

    /**
     * Get storage key prefix for current user
     * Admins viewing another user get that user's prefix
     * Primary user and admins use no prefix (shared default data)
     * @returns {string}
     */
    getUserStoragePrefix() {
        // If admin is viewing a specific user, use that prefix
        if (this.isAdmin() && this._viewingUserPrefix !== null) {
            return this._viewingUserPrefix;
        }

        // Known users (primary + admin) share the default storage (no prefix)
        if (this.isKnownUser()) {
            return '';
        }

        // Other users get isolated storage
        const uid = this.getUserId();
        return uid ? `user_${uid}_` : '';
    },

    /**
     * Get all user prefixes stored in localStorage (for admin user switcher)
     * @returns {Array<{prefix: string, label: string}>}
     */
    getAllUserPrefixes() {
        const prefixes = new Set();
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const match = key.match(/^(user_[^_]+_)/);
            if (match) {
                prefixes.add(match[1]);
            }
        }
        return [
            { prefix: '', label: 'Primary (Alex)' },
            ...[...prefixes].map(p => ({ prefix: p, label: p.replace(/_$/, '') }))
        ];
    },

    /**
     * Wait for initial auth state to be determined
     * Useful for app initialization
     * @returns {Promise<Object|null>} Current user or null
     */
    waitForAuthState() {
        return new Promise((resolve) => {
            if (!this._initialized) {
                resolve(null);
                return;
            }

            // If we already have determined auth state, resolve immediately
            const unsubscribe = this._auth.onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user);
            });
        });
    }
};
