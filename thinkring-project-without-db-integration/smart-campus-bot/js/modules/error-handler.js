/**
 * @file Error Handling Module
 * Provides comprehensive error handling, logging, and user feedback functionality
 */

/**
 * Error Handler
 * Manages application errors with user-friendly feedback and logging
 */
class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogEntries = 100;
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        
        this.setupGlobalErrorHandling();
        this.setupUnhandledRejectionHandling();
    }

    /**
     * Setup global error handling
     * @private
     */
    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                stack: event.error ? event.error.stack : null
            });
        });
    }

    /**
     * Setup unhandled promise rejection handling
     * @private
     */
    setupUnhandledRejectionHandling() {
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise',
                message: event.reason ? event.reason.message || event.reason : 'Unhandled promise rejection',
                error: event.reason,
                stack: event.reason ? event.reason.stack : null
            });
        });
    }

    /**
     * Handle an error with comprehensive logging and user feedback
     * @param {object} errorInfo - Error information
     * @param {string} errorInfo.type - Error type
     * @param {string} errorInfo.message - Error message
     * @param {Error} [errorInfo.error] - Error object
     * @param {string} [errorInfo.context] - Additional context
     * @param {boolean} [showToUser=true] - Whether to show error to user
     */
    handleError(errorInfo, showToUser = true) {
        const enhancedError = this.enhanceError(errorInfo);
        
        // Log the error
        this.logError(enhancedError);
        
        // Show user-friendly feedback
        if (showToUser) {
            this.showUserFeedback(enhancedError);
        }
        
        // Report to monitoring service (if configured)
        this.reportError(enhancedError);
        
        // Trigger recovery actions if possible
        this.attemptRecovery(enhancedError);
    }

    /**
     * Enhance error with additional information
     * @param {object} errorInfo - Basic error information
     * @returns {object} Enhanced error information
     * @private
     */
    enhanceError(errorInfo) {
        const timestamp = new Date().toISOString();
        const userAgent = navigator.userAgent;
        const url = window.location.href;
        const sessionInfo = window.sessionManager ? window.sessionManager.getSessionInfo() : null;
        
        return {
            ...errorInfo,
            id: this.generateErrorId(),
            timestamp,
            userAgent,
            url,
            sessionInfo,
            severity: this.determineSeverity(errorInfo),
            category: this.categorizeError(errorInfo)
        };
    }

    /**
     * Generate unique error ID
     * @returns {string} Unique error ID
     * @private
     */
    generateErrorId() {
        return 'err_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Determine error severity
     * @param {object} errorInfo - Error information
     * @returns {string} Severity level
     * @private
     */
    determineSeverity(errorInfo) {
        if (errorInfo.type === 'network' && errorInfo.status >= 500) {
            return 'high';
        }
        
        if (errorInfo.type === 'security') {
            return 'critical';
        }
        
        if (errorInfo.type === 'javascript' && errorInfo.message.includes('ReferenceError')) {
            return 'high';
        }
        
        if (errorInfo.type === 'validation') {
            return 'low';
        }
        
        return 'medium';
    }

    /**
     * Categorize error for better handling
     * @param {object} errorInfo - Error information
     * @returns {string} Error category
     * @private
     */
    categorizeError(errorInfo) {
        if (errorInfo.type === 'network') {
            return 'connectivity';
        }
        
        if (errorInfo.type === 'security') {
            return 'security';
        }
        
        if (errorInfo.type === 'validation') {
            return 'user_input';
        }
        
        if (errorInfo.message && errorInfo.message.includes('permission')) {
            return 'permissions';
        }
        
        return 'application';
    }

    /**
     * Log error to internal log and console
     * @param {object} enhancedError - Enhanced error information
     * @private
     */
    logError(enhancedError) {
        // Add to internal log
        this.errorLog.unshift(enhancedError);
        
        // Maintain log size
        if (this.errorLog.length > this.maxLogEntries) {
            this.errorLog = this.errorLog.slice(0, this.maxLogEntries);
        }
        
        // Console logging based on severity
        const logMethod = enhancedError.severity === 'critical' || enhancedError.severity === 'high' 
            ? console.error 
            : console.warn;
            
        logMethod('Error handled:', {
            id: enhancedError.id,
            type: enhancedError.type,
            message: enhancedError.message,
            severity: enhancedError.severity,
            category: enhancedError.category,
            stack: enhancedError.stack
        });
        
        // Store in localStorage for persistence (limited)
        this.persistErrorLog();
    }

    /**
     * Show user-friendly error feedback
     * @param {object} enhancedError - Enhanced error information
     * @private
     */
    showUserFeedback(enhancedError) {
        const userMessage = this.getUserFriendlyMessage(enhancedError);
        const actions = this.getErrorActions(enhancedError);
        
        if (window.notificationManager) {
            const notificationType = enhancedError.severity === 'critical' || enhancedError.severity === 'high' 
                ? 'error' 
                : 'warning';
                
            window.notificationManager.show({
                type: notificationType,
                title: this.getErrorTitle(enhancedError),
                message: userMessage,
                duration: enhancedError.severity === 'low' ? 5000 : 0,
                actions: actions,
                data: { errorId: enhancedError.id }
            });
        } else {
            // Fallback to alert
            alert(`Error: ${userMessage}`);
        }
        
        // Voice feedback if available
        if (window.voiceManager && enhancedError.severity !== 'low') {
            window.voiceManager.speak('An error occurred. Please check the notification for details.');
        }
    }

    /**
     * Get user-friendly error message
     * @param {object} enhancedError - Enhanced error information
     * @returns {string} User-friendly message
     * @private
     */
    getUserFriendlyMessage(enhancedError) {
        const messageMap = {
            connectivity: 'Network connection issue. Please check your internet connection.',
            security: 'Security validation failed. Please try again or contact support.',
            user_input: 'Invalid input provided. Please check your data and try again.',
            permissions: 'Permission denied. You may not have access to this feature.',
            application: 'Application error occurred. The issue has been logged.'
        };
        
        const baseMessage = messageMap[enhancedError.category] || 'An unexpected error occurred.';
        
        // Add specific guidance based on error type
        if (enhancedError.type === 'network' && enhancedError.status) {
            return `${baseMessage} (Status: ${enhancedError.status})`;
        }
        
        return baseMessage;
    }

    /**
     * Get error title based on severity
     * @param {object} enhancedError - Enhanced error information
     * @returns {string} Error title
     * @private
     */
    getErrorTitle(enhancedError) {
        const titleMap = {
            critical: 'Critical Error',
            high: 'Error',
            medium: 'Warning',
            low: 'Notice'
        };
        
        return titleMap[enhancedError.severity] || 'Error';
    }

    /**
     * Get available actions for error
     * @param {object} enhancedError - Enhanced error information
     * @returns {Array} Array of action objects
     * @private
     */
    getErrorActions(enhancedError) {
        const actions = [];
        
        // Retry action for certain error types
        if (this.canRetry(enhancedError)) {
            actions.push({
                text: 'Retry',
                action: () => this.retryOperation(enhancedError)
            });
        }
        
        // Refresh page action for critical errors
        if (enhancedError.severity === 'critical') {
            actions.push({
                text: 'Refresh Page',
                secondary: true,
                action: () => window.location.reload()
            });
        }
        
        // Report issue action
        actions.push({
            text: 'Report Issue',
            secondary: true,
            action: () => this.reportIssue(enhancedError)
        });
        
        return actions;
    }

    /**
     * Check if operation can be retried
     * @param {object} enhancedError - Enhanced error information
     * @returns {boolean} True if retryable
     * @private
     */
    canRetry(enhancedError) {
        const retryableTypes = ['network', 'timeout'];
        const currentAttempts = this.retryAttempts.get(enhancedError.context) || 0;
        
        return retryableTypes.includes(enhancedError.type) && 
               currentAttempts < this.maxRetries;
    }

    /**
     * Attempt error recovery
     * @param {object} enhancedError - Enhanced error information
     * @private
     */
    attemptRecovery(enhancedError) {
        switch (enhancedError.category) {
            case 'connectivity':
                this.recoverFromConnectivityIssue();
                break;
            case 'permissions':
                this.recoverFromPermissionIssue();
                break;
            case 'security':
                this.recoverFromSecurityIssue();
                break;
        }
    }

    /**
     * Recover from connectivity issues
     * @private
     */
    recoverFromConnectivityIssue() {
        // Check online status
        if (!navigator.onLine) {
            window.addEventListener('online', () => {
                if (window.notificationManager) {
                    window.notificationManager.success('Connection restored', 'Back Online');
                }
            }, { once: true });
        }
    }

    /**
     * Recover from permission issues
     * @private
     */
    recoverFromPermissionIssue() {
        // Check if session is still valid
        if (window.sessionManager && !window.sessionManager.hasValidSession()) {
            if (window.notificationManager) {
                window.notificationManager.warning(
                    'Your session has expired. Please log in again.',
                    'Session Expired',
                    {
                        actions: [{
                            text: 'Login',
                            action: () => window.location.href = 'index.html'
                        }]
                    }
                );
            }
        }
    }

    /**
     * Recover from security issues
     * @private
     */
    recoverFromSecurityIssue() {
        // Clear potentially compromised data
        if (window.sessionManager) {
            window.sessionManager.clearSession();
        }
        
        // Redirect to login
        setTimeout(() => {
            window.location.href = 'index.html?security=true';
        }, 2000);
    }

    /**
     * Retry a failed operation
     * @param {object} enhancedError - Enhanced error information
     */
    retryOperation(enhancedError) {
        const context = enhancedError.context || 'unknown';
        const currentAttempts = this.retryAttempts.get(context) || 0;
        
        if (currentAttempts >= this.maxRetries) {
            if (window.notificationManager) {
                window.notificationManager.error(
                    'Maximum retry attempts reached. Please try again later.',
                    'Retry Failed'
                );
            }
            return;
        }
        
        this.retryAttempts.set(context, currentAttempts + 1);
        
        if (window.notificationManager) {
            window.notificationManager.info(
                `Retrying operation... (Attempt ${currentAttempts + 1}/${this.maxRetries})`,
                'Retrying'
            );
        }
        
        // Trigger retry callback if available
        if (enhancedError.retryCallback) {
            setTimeout(() => {
                try {
                    enhancedError.retryCallback();
                } catch (error) {
                    this.handleError({
                        type: 'retry',
                        message: 'Retry operation failed',
                        error: error,
                        context: context
                    });
                }
            }, 1000 * currentAttempts); // Exponential backoff
        }
    }

    /**
     * Report error to monitoring service
     * @param {object} enhancedError - Enhanced error information
     * @private
     */
    reportError(enhancedError) {
        // Only report high and critical errors to reduce noise
        if (enhancedError.severity === 'high' || enhancedError.severity === 'critical') {
            try {
                // This would typically send to an error monitoring service
                // For now, we'll just log it locally
                const reportData = {
                    error: {
                        id: enhancedError.id,
                        type: enhancedError.type,
                        message: enhancedError.message,
                        stack: enhancedError.stack,
                        severity: enhancedError.severity,
                        category: enhancedError.category
                    },
                    context: {
                        url: enhancedError.url,
                        userAgent: enhancedError.userAgent,
                        timestamp: enhancedError.timestamp,
                        sessionInfo: enhancedError.sessionInfo
                    }
                };
                
                console.log('Error report:', reportData);
                
                // Store in localStorage for later sending
                const reports = JSON.parse(localStorage.getItem('error_reports') || '[]');
                reports.push(reportData);
                localStorage.setItem('error_reports', JSON.stringify(reports.slice(-10))); // Keep last 10
                
            } catch (reportError) {
                console.error('Failed to report error:', reportError);
            }
        }
    }

    /**
     * Report issue to support
     * @param {object} enhancedError - Enhanced error information
     */
    reportIssue(enhancedError) {
        const issueDetails = {
            errorId: enhancedError.id,
            message: enhancedError.message,
            timestamp: enhancedError.timestamp,
            url: enhancedError.url,
            severity: enhancedError.severity
        };
        
        // Create a simple issue report
        const reportText = `Error Report\n\nError ID: ${issueDetails.errorId}\nTime: ${issueDetails.timestamp}\nPage: ${issueDetails.url}\nSeverity: ${issueDetails.severity}\nMessage: ${issueDetails.message}`;
        
        // Copy to clipboard or show in modal
        if (navigator.clipboard) {
            navigator.clipboard.writeText(reportText).then(() => {
                if (window.notificationManager) {
                    window.notificationManager.success(
                        'Error details copied to clipboard. Please paste in your support request.',
                        'Report Copied'
                    );
                }
            });
        } else {
            // Fallback: show in alert
            alert('Please copy this error information for support:\n\n' + reportText);
        }
    }

    /**
     * Persist error log to localStorage
     * @private
     */
    persistErrorLog() {
        try {
            const recentErrors = this.errorLog.slice(0, 20); // Store only recent errors
            localStorage.setItem('error_log', JSON.stringify(recentErrors));
        } catch (error) {
            console.warn('Failed to persist error log:', error);
        }
    }

    /**
     * Get error statistics
     * @returns {object} Error statistics
     */
    getErrorStats() {
        const stats = {
            total: this.errorLog.length,
            bySeverity: {},
            byCategory: {},
            byType: {},
            recent: this.errorLog.slice(0, 5)
        };
        
        this.errorLog.forEach(error => {
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
            stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
        });
        
        return stats;
    }

    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
        this.retryAttempts.clear();
        localStorage.removeItem('error_log');
        console.log('Error log cleared');
    }

    /**
     * Wrap a function with error handling
     * @param {Function} fn - Function to wrap
     * @param {string} context - Context for error reporting
     * @returns {Function} Wrapped function
     */
    wrapFunction(fn, context) {
        return async (...args) => {
            try {
                return await fn.apply(this, args);
            } catch (error) {
                this.handleError({
                    type: 'wrapped_function',
                    message: error.message,
                    error: error,
                    context: context
                });
                throw error;
            }
        };
    }

    /**
     * Create a safe async wrapper
     * @param {Function} asyncFn - Async function to wrap
     * @param {string} context - Context for error reporting
     * @param {Function} fallback - Fallback function
     * @returns {Function} Safe async function
     */
    safeAsync(asyncFn, context, fallback = null) {
        return async (...args) => {
            try {
                return await asyncFn.apply(this, args);
            } catch (error) {
                this.handleError({
                    type: 'async_operation',
                    message: error.message,
                    error: error,
                    context: context,
                    retryCallback: fallback ? () => fallback(...args) : null
                });
                
                if (fallback) {
                    return fallback(...args);
                }
                
                throw error;
            }
        };
    }
}

// Global error handler instance
const errorHandler = new ErrorHandler();

// Export for global use
window.errorHandler = errorHandler;

// Convenience functions
window.handleError = errorHandler.handleError.bind(errorHandler);
window.safeAsync = errorHandler.safeAsync.bind(errorHandler);
window.wrapFunction = errorHandler.wrapFunction.bind(errorHandler);

console.log('Error Handling module loaded');"