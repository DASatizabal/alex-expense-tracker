// Encryption module using Web Crypto API
// Provides password-based encryption for localStorage data

const Encryption = {
    // Storage keys
    KEYS: {
        ENCRYPTED_DATA: 'alex_expense_encrypted',
        PASSWORD_HASH: 'alex_password_hash',
        ENCRYPTION_SALT: 'alex_encryption_salt'
    },

    // Convert string to ArrayBuffer
    stringToBuffer(str) {
        return new TextEncoder().encode(str);
    },

    // Convert ArrayBuffer to string
    bufferToString(buffer) {
        return new TextDecoder().decode(buffer);
    },

    // Convert ArrayBuffer to base64
    bufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    },

    // Convert base64 to ArrayBuffer
    base64ToBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    },

    // Generate random bytes
    getRandomBytes(length) {
        return crypto.getRandomValues(new Uint8Array(length));
    },

    // Derive encryption key from password using PBKDF2
    async deriveKey(password, salt) {
        const passwordBuffer = this.stringToBuffer(password);

        // Import password as key material
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        // Derive AES key
        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: CONFIG.ENCRYPTION.PBKDF2_ITERATIONS,
                hash: 'SHA-256'
            },
            keyMaterial,
            {
                name: CONFIG.ENCRYPTION.ALGORITHM,
                length: CONFIG.ENCRYPTION.KEY_LENGTH
            },
            false,
            ['encrypt', 'decrypt']
        );
    },

    // Encrypt data with password
    async encrypt(data, password) {
        const salt = this.getRandomBytes(16);
        const iv = this.getRandomBytes(12);
        const key = await this.deriveKey(password, salt);

        const dataBuffer = this.stringToBuffer(JSON.stringify(data));

        const encrypted = await crypto.subtle.encrypt(
            {
                name: CONFIG.ENCRYPTION.ALGORITHM,
                iv: iv
            },
            key,
            dataBuffer
        );

        return {
            salt: this.bufferToBase64(salt),
            iv: this.bufferToBase64(iv),
            ciphertext: this.bufferToBase64(encrypted)
        };
    },

    // Decrypt data with password
    async decrypt(encryptedData, password) {
        const salt = this.base64ToBuffer(encryptedData.salt);
        const iv = this.base64ToBuffer(encryptedData.iv);
        const ciphertext = this.base64ToBuffer(encryptedData.ciphertext);

        const key = await this.deriveKey(password, new Uint8Array(salt));

        try {
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: CONFIG.ENCRYPTION.ALGORITHM,
                    iv: new Uint8Array(iv)
                },
                key,
                ciphertext
            );

            return JSON.parse(this.bufferToString(decrypted));
        } catch (error) {
            // Decryption failed - wrong password
            throw new Error('Incorrect password');
        }
    },

    // Hash password for verification (without storing plaintext)
    async hashPassword(password, salt = null) {
        // Use a different salt for password hashing than encryption
        const hashSalt = salt || this.getRandomBytes(16);
        const passwordBuffer = this.stringToBuffer(password);

        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveBits']
        );

        const hashBuffer = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: hashSalt instanceof Uint8Array ? hashSalt : new Uint8Array(hashSalt),
                iterations: CONFIG.ENCRYPTION.PBKDF2_ITERATIONS,
                hash: 'SHA-256'
            },
            keyMaterial,
            256
        );

        return {
            hash: this.bufferToBase64(hashBuffer),
            salt: this.bufferToBase64(hashSalt instanceof Uint8Array ? hashSalt : hashSalt)
        };
    },

    // Verify password against stored hash
    async verifyPassword(password, storedHash, storedSalt) {
        const salt = this.base64ToBuffer(storedSalt);
        const { hash } = await this.hashPassword(password, new Uint8Array(salt));
        return hash === storedHash;
    },

    // Check if password is set up
    isPasswordSet() {
        return localStorage.getItem(this.KEYS.PASSWORD_HASH) !== null;
    },

    // Get stored password hash and salt
    getStoredCredentials() {
        const stored = localStorage.getItem(this.KEYS.PASSWORD_HASH);
        if (!stored) return null;

        try {
            return JSON.parse(stored);
        } catch (e) {
            return null;
        }
    },

    // Store password hash
    storePasswordHash(hash, salt) {
        localStorage.setItem(this.KEYS.PASSWORD_HASH, JSON.stringify({ hash, salt }));
    },

    // Get encrypted data from localStorage
    getEncryptedData() {
        const stored = localStorage.getItem(this.KEYS.ENCRYPTED_DATA);
        if (!stored) return null;

        try {
            return JSON.parse(stored);
        } catch (e) {
            return null;
        }
    },

    // Store encrypted data to localStorage
    storeEncryptedData(encryptedData) {
        localStorage.setItem(this.KEYS.ENCRYPTED_DATA, JSON.stringify(encryptedData));
    },

    // Clear all encryption-related data (for password reset)
    clearAllData() {
        localStorage.removeItem(this.KEYS.ENCRYPTED_DATA);
        localStorage.removeItem(this.KEYS.PASSWORD_HASH);
        localStorage.removeItem(this.KEYS.ENCRYPTION_SALT);
        localStorage.removeItem('alex_expense_payments'); // Old unencrypted data
    },

    // Migrate unencrypted data to encrypted format
    async migrateToEncrypted(password) {
        const oldData = localStorage.getItem('alex_expense_payments');
        if (oldData) {
            try {
                const payments = JSON.parse(oldData);
                const encrypted = await this.encrypt(payments, password);
                this.storeEncryptedData(encrypted);
                localStorage.removeItem('alex_expense_payments'); // Remove old unencrypted data
                return true;
            } catch (e) {
                console.error('Migration error:', e);
                return false;
            }
        }
        return true; // No data to migrate
    }
};
