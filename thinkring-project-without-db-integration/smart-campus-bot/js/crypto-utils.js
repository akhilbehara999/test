/**
 * @file Secure cryptographic utilities for the Smart Campus Bot application.
 * Provides secure password hashing and API key management functions.
 */

/**
 * Generates a cryptographically secure salt using Web Crypto API
 * @returns {Promise<string>} Base64 encoded salt
 */
async function generateSalt() {
    try {
        const saltBytes = new Uint8Array(16);
        crypto.getRandomValues(saltBytes);
        return btoa(String.fromCharCode(...saltBytes));
    } catch (error) {
        console.error('Error generating salt:', error);
        // Fallback to timestamp-based salt (less secure but functional)
        return btoa(Date.now().toString() + Math.random().toString());
    }
}

/**
 * Hashes a password using PBKDF2 with Web Crypto API
 * @param {string} password - The password to hash
 * @param {string} salt - Base64 encoded salt
 * @returns {Promise<string>} Base64 encoded hash
 */
async function hashPassword(password, salt) {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
        
        // Import password as key
        const key = await crypto.subtle.importKey(
            'raw',
            data,
            { name: 'PBKDF2' },
            false,
            ['deriveBits']
        );
        
        // Derive hash using PBKDF2
        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: saltBytes,
                iterations: 100000, // Industry standard
                hash: 'SHA-256'
            },
            key,
            256 // 32 bytes
        );
        
        const hashArray = new Uint8Array(derivedBits);
        return btoa(String.fromCharCode(...hashArray));
    } catch (error) {
        console.error('Error hashing password:', error);
        // Fallback to enhanced simple hash
        return enhancedSimpleHash(password + salt);
    }
}

/**
 * Verifies a password against a stored hash
 * @param {string} password - The password to verify
 * @param {string} storedHash - The stored hash to verify against
 * @param {string} salt - The salt used for hashing
 * @returns {Promise<boolean>} True if password matches
 */
async function verifyPassword(password, storedHash, salt) {
    try {
        const computedHash = await hashPassword(password, salt);
        return computedHash === storedHash;
    } catch (error) {
        console.error('Error verifying password:', error);
        return false;
    }
}

/**
 * Enhanced simple hash function as fallback (more secure than original)
 * @param {string} str - String to hash
 * @returns {string} Hash string
 */
function enhancedSimpleHash(str) {
    let hash = 5381; // djb2 algorithm base
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    
    // Additional mixing for better distribution
    hash = hash ^ (hash >>> 16);
    hash = hash * 0x85ebca6b;
    hash = hash ^ (hash >>> 13);
    hash = hash * 0xc2b2ae35;
    hash = hash ^ (hash >>> 16);
    
    return Math.abs(hash).toString(36);
}

/**
 * Secure API key storage and retrieval
 */
class SecureAPIKeyManager {
    constructor() {
        this.keyPrefix = 'secure_api_';
        this.encryptionKey = null;
        this.initializeEncryption();
    }
    
    /**
     * Initialize encryption for API keys
     */
    async initializeEncryption() {
        try {
            // Generate or retrieve encryption key
            let keyData = localStorage.getItem('app_encryption_key');
            if (!keyData) {
                const key = await crypto.subtle.generateKey(
                    { name: 'AES-GCM', length: 256 },
                    true,
                    ['encrypt', 'decrypt']
                );
                const exportedKey = await crypto.subtle.exportKey('raw', key);
                keyData = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
                localStorage.setItem('app_encryption_key', keyData);
            }
            
            const keyBytes = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
            this.encryptionKey = await crypto.subtle.importKey(
                'raw',
                keyBytes,
                { name: 'AES-GCM' },
                false,
                ['encrypt', 'decrypt']
            );
        } catch (error) {
            console.warn('Encryption not available, using base64 encoding:', error);
            this.encryptionKey = null;
        }
    }
    
    /**
     * Store an API key securely
     * @param {string} keyName - Name/identifier for the key
     * @param {string} apiKey - The API key to store
     */
    async storeAPIKey(keyName, apiKey) {
        try {
            if (this.encryptionKey) {
                const encoder = new TextEncoder();
                const data = encoder.encode(apiKey);
                const iv = crypto.getRandomValues(new Uint8Array(12));
                
                const encryptedData = await crypto.subtle.encrypt(
                    { name: 'AES-GCM', iv: iv },
                    this.encryptionKey,
                    data
                );
                
                const combined = new Uint8Array(iv.length + encryptedData.byteLength);
                combined.set(iv);
                combined.set(new Uint8Array(encryptedData), iv.length);
                
                const encryptedBase64 = btoa(String.fromCharCode(...combined));
                localStorage.setItem(this.keyPrefix + keyName, encryptedBase64);
            } else {
                // Fallback to base64 encoding
                const encoded = btoa(apiKey);
                localStorage.setItem(this.keyPrefix + keyName, 'b64:' + encoded);
            }
        } catch (error) {
            console.error('Error storing API key:', error);
            // Last resort: store directly (not recommended for production)
            localStorage.setItem(this.keyPrefix + keyName, 'plain:' + apiKey);
        }
    }
    
    /**
     * Retrieve an API key
     * @param {string} keyName - Name/identifier for the key
     * @returns {Promise<string|null>} The API key or null if not found
     */
    async retrieveAPIKey(keyName) {
        try {
            const stored = localStorage.getItem(this.keyPrefix + keyName);
            if (!stored) return null;
            
            if (stored.startsWith('plain:')) {
                return stored.substring(6);
            }
            
            if (stored.startsWith('b64:')) {
                return atob(stored.substring(4));
            }
            
            if (this.encryptionKey) {
                const combined = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
                const iv = combined.slice(0, 12);
                const encryptedData = combined.slice(12);
                
                const decryptedData = await crypto.subtle.decrypt(
                    { name: 'AES-GCM', iv: iv },
                    this.encryptionKey,
                    encryptedData
                );
                
                const decoder = new TextDecoder();
                return decoder.decode(decryptedData);
            }
            
            return null;
        } catch (error) {
            console.error('Error retrieving API key:', error);
            return null;
        }
    }
    
    /**
     * Remove an API key
     * @param {string} keyName - Name/identifier for the key
     */
    removeAPIKey(keyName) {
        localStorage.removeItem(this.keyPrefix + keyName);
    }
    
    /**
     * List all stored API key names
     * @returns {string[]} Array of key names
     */
    listAPIKeys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.keyPrefix)) {
                keys.push(key.substring(this.keyPrefix.length));
            }
        }
        return keys;
    }
}

// Global instance for use throughout the application
const apiKeyManager = new SecureAPIKeyManager();

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with score and feedback
 */
function validatePasswordStrength(password) {
    const result = {
        score: 0,
        strength: 'Very Weak',
        feedback: []
    };
    
    if (password.length >= 8) {
        result.score += 1;
    } else {
        result.feedback.push('Use at least 8 characters');
    }
    
    if (/[a-z]/.test(password)) result.score += 1;
    else result.feedback.push('Include lowercase letters');
    
    if (/[A-Z]/.test(password)) result.score += 1;
    else result.feedback.push('Include uppercase letters');
    
    if (/\d/.test(password)) result.score += 1;
    else result.feedback.push('Include numbers');
    
    if (/[^a-zA-Z\d]/.test(password)) result.score += 1;
    else result.feedback.push('Include special characters');
    
    const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    result.strength = strengthLevels[Math.min(result.score, 4)] || 'Very Weak';
    
    return result;
}

/**
 * Generates a secure random password
 * @param {number} length - Password length (default: 12)
 * @returns {string} Generated password
 */
function generateSecurePassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    return Array.from(array, byte => charset[byte % charset.length]).join('');
}