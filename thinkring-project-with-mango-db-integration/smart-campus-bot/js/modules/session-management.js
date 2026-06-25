/**
 * @file Session Management Module
 * Handles user sessions, authentication state, and session security
 */

/**
 * Session Manager
 * Manages user authentication sessions with enhanced security
 */
class SessionManager {
    constructor() {
        this.sessionKey = 'sessionToken';
        this.userRoleKey = 'userRole';
        this.usernameKey = 'username';
        this.sessionTimeoutKey = 'sessionTimeout';
        this.lastActivityKey = 'lastActivity';
        
        // Session configuration
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.inactivityWarning = 5 * 60 * 1000; // 5 minutes before timeout
        this.checkInterval = 60 * 1000; // Check every minute
        
        this.activityTimer = null;
        this.warningShown = false;
        
        this.initializeSessionMonitoring();
    }

    /**
     * Initialize session monitoring and activity tracking
     * @private
     */
    initializeSessionMonitoring() {
        // Track user activity
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        const updateActivity = () => {
            this.updateLastActivity();
            this.warningShown = false;
        };
        
        activityEvents.forEach(event => {
            document.addEventListener(event, updateActivity, true);
        });
        
        // Start session monitoring
        this.startSessionMonitoring();
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.updateLastActivity();
            }
        });
    }

    /**
     * Start monitoring session timeout
     * @private
     */
    startSessionMonitoring() {
        if (this.activityTimer) {
            clearInterval(this.activityTimer);
        }
        
        this.activityTimer = setInterval(() => {
            this.checkSessionTimeout();
        }, this.checkInterval);
    }

    /**
     * Check if session has timed out
     * @private
     */
    checkSessionTimeout() {
        if (!this.hasValidSession()) {
            return;
        }
        
        const lastActivity = this.getLastActivity();
        const now = Date.now();
        const timeSinceActivity = now - lastActivity;
        
        if (timeSinceActivity >= this.sessionTimeout) {
            this.expireSession('Session expired due to inactivity');
        } else if (timeSinceActivity >= (this.sessionTimeout - this.inactivityWarning) && !this.warningShown) {
            this.showInactivityWarning();
        }
    }

    /**
     * Show inactivity warning
     * @private
     */
    showInactivityWarning() {
        this.warningShown = true;
        
        const remainingTime = Math.ceil((this.sessionTimeout - (Date.now() - this.getLastActivity())) / 60000);
        
        if (window.voiceManager) {
            window.voiceManager.speak(`Session will expire in ${remainingTime} minutes due to inactivity`);
        }
        
        // Show notification
        if (window.notificationManager) {
            window.notificationManager.show({
                type: 'warning',
                title: 'Session Expiring',
                message: `Your session will expire in ${remainingTime} minutes due to inactivity.`,
                duration: 10000,
                actions: [
                    {
                        text: 'Stay Logged In',
                        action: () => this.extendSession()
                    }
                ]
            });
        } else {
            // Fallback to alert
            if (confirm(`Your session will expire in ${remainingTime} minutes due to inactivity. Click OK to stay logged in.`)) {
                this.extendSession();
            }
        }
    }

    /**
     * Create a new session
     * @param {object} user - User object
     * @param {boolean} rememberMe - Whether to persist session
     * @returns {string} Session token
     */
    createSession(user, rememberMe = false) {
        const sessionToken = this.generateSessionToken();
        const expirationTime = Date.now() + this.sessionTimeout;
        
        // Store session data
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem(this.sessionKey, sessionToken);
        storage.setItem(this.userRoleKey, user.role);
        storage.setItem(this.usernameKey, user.username);
        storage.setItem(this.sessionTimeoutKey, expirationTime.toString());
        
        this.updateLastActivity();
        
        // Start monitoring
        this.startSessionMonitoring();
        
        console.log('Session created for user:', user.username);
        return sessionToken;
    }

    /**
     * Generate a cryptographically secure session token
     * @returns {string} Session token
     * @private
     */
    generateSessionToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Check if user has a valid session
     * @returns {boolean} True if session is valid
     */
    hasValidSession() {
        const token = this.getSessionToken();
        if (!token) return false;
        
        const timeout = localStorage.getItem(this.sessionTimeoutKey) || sessionStorage.getItem(this.sessionTimeoutKey);
        if (!timeout) return false;
        
        const expirationTime = parseInt(timeout);
        return Date.now() < expirationTime;
    }

    /**
     * Get current session token
     * @returns {string|null} Session token or null
     */
    getSessionToken() {
        return localStorage.getItem(this.sessionKey) || sessionStorage.getItem(this.sessionKey);
    }

    /**
     * Get current user role
     * @returns {string|null} User role or null
     */
    getUserRole() {
        return localStorage.getItem(this.userRoleKey) || sessionStorage.getItem(this.userRoleKey);
    }

    /**
     * Get current username
     * @returns {string|null} Username or null
     */
    getUsername() {
        return localStorage.getItem(this.usernameKey) || sessionStorage.getItem(this.usernameKey);
    }

    /**
     * Update last activity timestamp
     */
    updateLastActivity() {
        const now = Date.now();
        localStorage.setItem(this.lastActivityKey, now.toString());
        sessionStorage.setItem(this.lastActivityKey, now.toString());
    }

    /**
     * Get last activity timestamp
     * @returns {number} Last activity timestamp
     */
    getLastActivity() {
        const activity = localStorage.getItem(this.lastActivityKey) || sessionStorage.getItem(this.lastActivityKey);
        return activity ? parseInt(activity) : Date.now();
    }

    /**
     * Extend current session
     */
    extendSession() {
        if (!this.hasValidSession()) {
            return false;
        }
        
        const newExpirationTime = Date.now() + this.sessionTimeout;
        
        // Update in both storage types
        if (localStorage.getItem(this.sessionKey)) {
            localStorage.setItem(this.sessionTimeoutKey, newExpirationTime.toString());
        }
        if (sessionStorage.getItem(this.sessionKey)) {
            sessionStorage.setItem(this.sessionTimeoutKey, newExpirationTime.toString());
        }
        
        this.updateLastActivity();
        this.warningShown = false;
        
        console.log('Session extended');
        return true;
    }

    /**
     * Expire the current session
     * @param {string} reason - Reason for expiration
     */
    expireSession(reason = 'Session expired') {
        console.log('Expiring session:', reason);
        
        if (window.voiceManager) {
            window.voiceManager.speak(reason);
        }
        
        this.clearSession();
        
        // Redirect to login
        if (window.location.pathname !== '/index.html') {
            window.location.href = 'index.html?expired=true';
        }
    }

    /**
     * Clear session data
     */
    clearSession() {
        // Clear from both storage types
        [localStorage, sessionStorage].forEach(storage => {
            storage.removeItem(this.sessionKey);
            storage.removeItem(this.userRoleKey);
            storage.removeItem(this.usernameKey);
            storage.removeItem(this.sessionTimeoutKey);
            storage.removeItem(this.lastActivityKey);
        });
        
        // Stop monitoring
        if (this.activityTimer) {
            clearInterval(this.activityTimer);
            this.activityTimer = null;
        }
        
        console.log('Session cleared');
    }

    /**
     * Check if user has specific role
     * @param {string} requiredRole - Required role
     * @returns {boolean} True if user has required role
     */
    hasRole(requiredRole) {
        const userRole = this.getUserRole();
        return userRole === requiredRole;
    }

    /**
     * Check if user is admin
     * @returns {boolean} True if user is admin
     */
    isAdmin() {
        return this.hasRole('admin');
    }

    /**
     * Require authentication for current page
     * @param {string} requiredRole - Required role (optional)
     */
    requireAuth(requiredRole = null) {
        if (!this.hasValidSession()) {
            window.location.href = 'index.html?redirect=' + encodeURIComponent(window.location.pathname);
            return false;
        }
        
        if (requiredRole && !this.hasRole(requiredRole)) {
            if (window.notificationManager) {
                window.notificationManager.show({
                    type: 'error',
                    title: 'Access Denied',
                    message: 'You do not have permission to access this page.'
                });
            }
            
            // Redirect based on role
            const userRole = this.getUserRole();
            const redirectUrl = userRole === 'admin' ? 'admin.html' : 'dashboard.html';
            window.location.href = redirectUrl;
            return false;
        }
        
        return true;
    }

    /**
     * Get session info
     * @returns {object} Session information
     */
    getSessionInfo() {
        if (!this.hasValidSession()) {
            return null;
        }
        
        const timeout = localStorage.getItem(this.sessionTimeoutKey) || sessionStorage.getItem(this.sessionTimeoutKey);
        const expirationTime = parseInt(timeout);
        const lastActivity = this.getLastActivity();
        
        return {
            token: this.getSessionToken(),
            username: this.getUsername(),
            role: this.getUserRole(),
            expiresAt: new Date(expirationTime),
            lastActivity: new Date(lastActivity),
            timeRemaining: Math.max(0, expirationTime - Date.now())
        };
    }

    /**
     * Set session timeout duration
     * @param {number} timeout - Timeout in milliseconds
     */
    setSessionTimeout(timeout) {
        this.sessionTimeout = timeout;
        
        // Update current session if active
        if (this.hasValidSession()) {
            this.extendSession();
        }
    }
}

// Global session manager instance
const sessionManager = new SessionManager();

// Export for global use
window.sessionManager = sessionManager;

// Auto-check authentication on protected pages
document.addEventListener('DOMContentLoaded', () => {
    const protectedPages = ['dashboard.html', 'admin.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage)) {
        const requiredRole = currentPage === 'admin.html' ? 'admin' : null;
        sessionManager.requireAuth(requiredRole);
    }
});

console.log('Session Management module loaded');