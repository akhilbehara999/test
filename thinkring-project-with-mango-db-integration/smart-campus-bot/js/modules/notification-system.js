/**
 * @file Notification System Module
 * Provides centralized notification and user feedback functionality
 */

/**
 * Notification Manager
 * Handles displaying notifications, alerts, and user feedback
 */
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.maxNotifications = 5;
        this.defaultDuration = 5000;
        
        this.initializeContainer();
        this.setupStyles();
    }

    /**
     * Initialize notification container
     * @private
     */
    initializeContainer() {
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    }

    /**
     * Setup notification styles
     * @private
     */
    setupStyles() {
        if (document.getElementById('notification-styles')) {
            return; // Already added
        }
        
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                pointer-events: none;
            }
            
            .notification {
                background: rgba(10, 14, 39, 0.95);
                border: 1px solid var(--accent-color);
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 10px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                transform: translateX(100%);
                transition: all 0.3s ease;
                pointer-events: auto;
                backdrop-filter: blur(10px);
                position: relative;
                overflow: hidden;
            }
            
            .notification.show {
                transform: translateX(0);
            }
            
            .notification.hide {
                transform: translateX(100%);
                opacity: 0;
            }
            
            .notification::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: var(--accent-color);
            }
            
            .notification.success {
                border-color: var(--success-color);
            }
            
            .notification.success::before {
                background: var(--success-color);
            }
            
            .notification.error {
                border-color: var(--error-color);
            }
            
            .notification.error::before {
                background: var(--error-color);
            }
            
            .notification.warning {
                border-color: #ffa726;
            }
            
            .notification.warning::before {
                background: #ffa726;
            }
            
            .notification.info {
                border-color: #42a5f5;
            }
            
            .notification.info::before {
                background: #42a5f5;
            }
            
            .notification-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 8px;
            }
            
            .notification-title {
                font-weight: bold;
                font-size: 14px;
                color: var(--text-color);
                margin: 0;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: var(--text-color);
                cursor: pointer;
                font-size: 18px;
                line-height: 1;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.7;
                transition: opacity 0.2s;
            }
            
            .notification-close:hover {
                opacity: 1;
            }
            
            .notification-message {
                color: var(--light-text-color);
                font-size: 13px;
                line-height: 1.4;
                margin-bottom: 12px;
            }
            
            .notification-actions {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
            
            .notification-action {
                background: var(--accent-color);
                color: var(--background-color);
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                transition: opacity 0.2s;
            }
            
            .notification-action:hover {
                opacity: 0.8;
            }
            
            .notification-action.secondary {
                background: transparent;
                color: var(--accent-color);
                border: 1px solid var(--accent-color);
            }
            
            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 2px;
                background: var(--accent-color);
                transition: width linear;
                opacity: 0.7;
            }
            
            .notification.success .notification-progress {
                background: var(--success-color);
            }
            
            .notification.error .notification-progress {
                background: var(--error-color);
            }
            
            .notification.warning .notification-progress {
                background: #ffa726;
            }
            
            .notification.info .notification-progress {
                background: #42a5f5;
            }
            
            @media (max-width: 480px) {
                .notification-container {
                    left: 10px;
                    right: 10px;
                    top: 10px;
                    max-width: none;
                }
                
                .notification {
                    transform: translateY(-100%);
                }
                
                .notification.show {
                    transform: translateY(0);
                }
                
                .notification.hide {
                    transform: translateY(-100%);
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Show a notification
     * @param {object} options - Notification options
     * @param {string} options.type - Notification type (success, error, warning, info)
     * @param {string} options.title - Notification title
     * @param {string} options.message - Notification message
     * @param {number} options.duration - Duration in milliseconds (0 for persistent)
     * @param {Array} options.actions - Array of action objects {text, action, secondary}
     * @param {boolean} options.closable - Whether notification can be closed
     * @returns {string} Notification ID
     */
    show(options = {}) {
        const {
            type = 'info',
            title = '',
            message = '',
            duration = this.defaultDuration,
            actions = [],
            closable = true
        } = options;
        
        const id = this.generateId();
        
        // Remove oldest notification if at max
        if (this.notifications.length >= this.maxNotifications) {
            this.remove(this.notifications[0].id);
        }
        
        const notification = {
            id,
            type,
            title,
            message,
            duration,
            actions,
            closable,
            element: this.createElement(id, type, title, message, actions, closable),
            timer: null
        };
        
        this.notifications.push(notification);
        this.container.appendChild(notification.element);
        
        // Trigger animation
        setTimeout(() => {
            notification.element.classList.add('show');
        }, 10);
        
        // Set auto-remove timer
        if (duration > 0) {
            this.setTimer(notification, duration);
        }
        
        return id;
    }

    /**
     * Create notification element
     * @private
     */
    createElement(id, type, title, message, actions, closable) {
        const element = document.createElement('div');
        element.className = `notification ${type}`;
        element.dataset.id = id;
        
        let html = '<div class=\"notification-header\">';
        
        if (title) {
            html += `<h4 class=\"notification-title\">${this.escapeHtml(title)}</h4>`;
        }
        
        if (closable) {
            html += '<button class=\"notification-close\" onclick=\"window.notificationManager.remove(\\'' + id + '\\')\">&times;</button>';
        }
        
        html += '</div>';
        
        if (message) {
            html += `<div class=\"notification-message\">${this.escapeHtml(message)}</div>`;
        }
        
        if (actions.length > 0) {
            html += '<div class=\"notification-actions\">';
            actions.forEach((action, index) => {
                const className = action.secondary ? 'notification-action secondary' : 'notification-action';
                html += `<button class=\"${className}\" onclick=\"window.notificationManager.executeAction('${id}', ${index})\">${this.escapeHtml(action.text)}</button>`;
            });
            html += '</div>';
        }
        
        element.innerHTML = html;
        
        return element;
    }

    /**
     * Set auto-remove timer with progress bar
     * @private
     */
    setTimer(notification, duration) {
        const progressBar = document.createElement('div');
        progressBar.className = 'notification-progress';
        progressBar.style.width = '100%';
        notification.element.appendChild(progressBar);
        
        // Animate progress bar
        progressBar.style.transition = `width ${duration}ms linear`;
        setTimeout(() => {
            progressBar.style.width = '0%';
        }, 10);
        
        notification.timer = setTimeout(() => {
            this.remove(notification.id);
        }, duration);
    }

    /**
     * Execute notification action
     * @param {string} id - Notification ID
     * @param {number} actionIndex - Action index
     */
    executeAction(id, actionIndex) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification && notification.actions[actionIndex]) {
            const action = notification.actions[actionIndex];
            if (typeof action.action === 'function') {
                action.action();
            }
            
            // Remove notification after action unless it's marked as persistent
            if (!action.persistent) {
                this.remove(id);
            }
        }
    }

    /**
     * Remove a notification
     * @param {string} id - Notification ID
     */
    remove(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (!notification) return;
        
        // Clear timer if exists
        if (notification.timer) {
            clearTimeout(notification.timer);
        }
        
        // Animate out
        notification.element.classList.add('hide');
        
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            
            this.notifications = this.notifications.filter(n => n.id !== id);
        }, 300);
    }

    /**
     * Clear all notifications
     */
    clear() {
        this.notifications.forEach(notification => {
            this.remove(notification.id);
        });
    }

    /**
     * Show success notification
     * @param {string} message - Success message
     * @param {string} title - Optional title
     * @param {object} options - Additional options
     */
    success(message, title = 'Success', options = {}) {
        return this.show({
            type: 'success',
            title,
            message,
            ...options
        });
    }

    /**
     * Show error notification
     * @param {string} message - Error message
     * @param {string} title - Optional title
     * @param {object} options - Additional options
     */
    error(message, title = 'Error', options = {}) {
        return this.show({
            type: 'error',
            title,
            message,
            duration: 0, // Persistent by default
            ...options
        });
    }

    /**
     * Show warning notification
     * @param {string} message - Warning message
     * @param {string} title - Optional title
     * @param {object} options - Additional options
     */
    warning(message, title = 'Warning', options = {}) {
        return this.show({
            type: 'warning',
            title,
            message,
            duration: 8000,
            ...options
        });
    }

    /**
     * Show info notification
     * @param {string} message - Info message
     * @param {string} title - Optional title
     * @param {object} options - Additional options
     */
    info(message, title = 'Info', options = {}) {
        return this.show({
            type: 'info',
            title,
            message,
            ...options
        });
    }

    /**
     * Show confirmation dialog
     * @param {string} message - Confirmation message
     * @param {Function} onConfirm - Callback for confirm action
     * @param {Function} onCancel - Callback for cancel action
     * @param {string} title - Optional title
     */
    confirm(message, onConfirm, onCancel = null, title = 'Confirm') {
        return this.show({
            type: 'warning',
            title,
            message,
            duration: 0,
            closable: false,
            actions: [
                {
                    text: 'Confirm',
                    action: onConfirm
                },
                {
                    text: 'Cancel',
                    secondary: true,
                    action: onCancel || (() => {})
                }
            ]
        });
    }

    /**
     * Generate unique ID
     * @private
     */
    generateId() {
        return 'notification-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Escape HTML to prevent XSS
     * @private
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Update notification settings
     * @param {object} settings - Settings object
     */
    updateSettings(settings) {
        if (settings.maxNotifications) {
            this.maxNotifications = settings.maxNotifications;
        }
        if (settings.defaultDuration) {
            this.defaultDuration = settings.defaultDuration;
        }
    }

    /**
     * Get current notifications
     * @returns {Array} Array of current notifications
     */
    getNotifications() {
        return this.notifications.map(n => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message
        }));
    }
}

// Global notification manager instance
const notificationManager = new NotificationManager();

// Export for global use
window.notificationManager = notificationManager;

console.log('Notification System module loaded');"