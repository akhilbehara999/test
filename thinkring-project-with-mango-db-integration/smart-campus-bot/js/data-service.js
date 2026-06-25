/**
 * @file Data Service for Smart Campus Bot
 * Handles communication with the backend API for user management
 */

class DataService {
    constructor() {
        this.baseURL = 'http://127.0.0.1:3000/api';
        this.token = localStorage.getItem('authToken');
    }

    /**
     * Set authentication token
     * @param {string} token - JWT token
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    /**
     * Clear authentication token
     */
    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    /**
     * Make API request
     * @param {string} endpoint - API endpoint
     * @param {string} method - HTTP method
     * @param {object} data - Request data
     * @returns {Promise<object>} API response
     */
    async makeRequest(endpoint, method = 'GET', data = null) {
        const url = `${this.baseURL}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (this.token) {
            options.headers['Authorization'] = `Bearer ${this.token}`;
        }

        if (data) {
            options.body = JSON.stringify(data);
        }

        console.log(`Making API request to ${url}`, { method, data });

        try {
            const response = await fetch(url, options);
            console.log(`Received response from ${url}`, { 
                status: response.status, 
                statusText: response.statusText,
                headers: [...response.headers.entries()]
            });
            
            // Check if response is empty
            const responseText = await response.text();
            
            // Don't log the full response text if it contains sensitive data
            if (endpoint.includes('/aiconfig') && responseText.includes('apiKey')) {
                console.log(`Response text from ${url}: [SENSITIVE DATA REDACTED]`);
            } else {
                console.log(`Response text from ${url}:`, responseText);
            }
            
            if (!responseText) {
                throw new Error('Empty response from server');
            }
            
            // Parse JSON
            const result = JSON.parse(responseText);
            
            if (!response.ok) {
                throw new Error(result.message || 'API request failed');
            }
            
            // Don't log the full result if it contains sensitive data
            if (endpoint.includes('/aiconfig') && result.config && result.config.apiKey) {
                const safeResult = { ...result };
                safeResult.config = { ...result.config };
                safeResult.config.apiKey = '[REDACTED]';
                console.log(`Successful response from ${url}:`, safeResult);
            } else {
                console.log(`Successful response from ${url}:`, result);
            }
            
            return result;
        } catch (error) {
            console.error(`API request error (${endpoint}):`, error);
            throw error;
        }
    }

    /**
     * User authentication
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise<object>} Authentication result
     */
    async authenticateUser(username, password) {
        try {
            const result = await this.makeRequest('/auth/login', 'POST', { username, password });
            
            if (result.success && result.token) {
                this.setToken(result.token);
            }
            
            return result;
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Authentication failed'
            };
        }
    }

    /**
     * Register a new user (public endpoint)
     * @param {object} userData - User data including username and password
     * @returns {Promise<object>} Registration result
     */
    async registerUserPublic(userData) {
        try {
            const result = await this.makeRequest('/users/register', 'POST', userData);
            return result;
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Registration failed'
            };
        }
    }

    /**
     * Change user password
     * @param {number} userId - User ID
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<object>} Change password result
     */
    async changeUserPassword(userId, currentPassword, newPassword) {
        try {
            const result = await this.makeRequest('/auth/change-password', 'POST', {
                userId,
                currentPassword,
                newPassword
            });
            
            return result;
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Password change failed'
            };
        }
    }

    /**
     * Get all users (admin only)
     * @returns {Promise<object>} Users list
     */
    async getUsers() {
        try {
            const result = await this.makeRequest('/users');
            return result.users || [];
        } catch (error) {
            console.error('Get users error:', error);
            return [];
        }
    }

    /**
     * Create new user (admin only)
     * @param {object} userData - User data
     * @returns {Promise<object>} Creation result
     */
    async createUser(userData) {
        try {
            const result = await this.makeRequest('/users', 'POST', userData);
            return result;
        } catch (error) {
            return {
                success: false,
                message: error.message || 'User creation failed'
            };
        }
    }

    /**
     * Get all lost and found items
     * @returns {Promise<object>} Items list
     */
    async getLostFoundItems() {
        try {
            console.log('Loading lost/found items');
            const result = await this.makeRequest('/lostfound');
            console.log('Items loaded:', result);
            return result.items || [];
        } catch (error) {
            console.error('Get lost and found items error:', error);
            return [];
        }
    }

    /**
     * Create a new lost or found item
     * @param {object} itemData - Item data
     * @returns {Promise<object>} Creation result
     */
    async createLostFoundItem(itemData) {
        try {
            console.log('Creating lost/found item:', itemData);
            const result = await this.makeRequest('/lostfound', 'POST', itemData);
            console.log('Item creation result:', result);
            return result;
        } catch (error) {
            console.error('Error creating lost/found item:', error);
            return {
                success: false,
                message: error.message || 'Failed to create item'
            };
        }
    }

    /**
     * Delete a lost or found item (admin only)
     * @param {string} itemId - Item ID
     * @returns {Promise<object>} Deletion result
     */
    async deleteLostFoundItem(itemId) {
        try {
            const result = await this.makeRequest(`/lostfound/${itemId}`, 'DELETE');
            return result;
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to delete item'
            };
        }
    }

    /**
     * Search lost and found items
     * @param {string} query - Search query
     * @returns {Promise<object>} Search result
     */
    async searchLostFoundItems(query) {
        try {
            const result = await this.makeRequest(`/lostfound/search?query=${encodeURIComponent(query)}`);
            return result.items || [];
        } catch (error) {
            console.error('Search lost and found items error:', error);
            return [];
        }
    }

    /**
     * Get global AI configuration
     * @returns {Promise<object>} AI configuration
     */
    async getAIConfig() {
        try {
            const result = await this.makeRequest('/aiconfig');
            // Don't log the actual config to prevent API key exposure
            console.log('Data Service: AI config retrieved');
            return result.config || null;
        } catch (error) {
            console.error('Get AI config error:', error);
            return null;
        }
    }

    /**
     * Update global AI configuration (admin only)
     * @param {object} configData - Configuration data including apiKey and model
     * @returns {Promise<object>} Update result
     */
    async updateAIConfig(configData) {
        try {
            const result = await this.makeRequest('/aiconfig', 'PUT', configData);
            return result;
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to update AI configuration'
            };
        }
    }

    /**
     * Delete global AI configuration (admin only)
     * @returns {Promise<object>} Deletion result
     */
    async deleteAIConfig() {
        try {
            const result = await this.makeRequest('/aiconfig', 'DELETE');
            return result;
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to delete AI configuration'
            };
        }
    }

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {object} Validation result
     */
    validatePasswordStrength(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        const requirements = [
            password.length >= minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasSpecialChar
        ];
        
        const score = requirements.filter(req => req).length;
        
        return {
            score,
            feedback: {
                length: password.length >= minLength,
                uppercase: hasUpperCase,
                lowercase: hasLowerCase,
                number: hasNumbers,
                special: hasSpecialChar
            }
        };
    }
}

// Global data service instance
const dataService = new DataService();

// Export for global use
window.dataService = dataService;

console.log('Data Service module loaded');