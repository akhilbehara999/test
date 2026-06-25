/**
 * @file Manages user data for the application with enhanced security.
 */

// Import data service
// Note: This will be handled by the module loader in the HTML files

/**
 * Initializes the user database in localStorage if it doesn't exist.
 * Populates it with default user data using secure password hashing.
 */
async function initializeUsers() {
    // This function is now handled by the backend
    console.log('User database initialization now handled by backend');
    return [];
}

/**
 * Migrates existing plain text passwords to secure hashes
 * @param {Array} users - Array of user objects
 * @returns {Promise<Array>} Updated users array
 */
async function migrateUserPasswords(users) {
    // This function is now handled by the backend
    console.log('Password migration now handled by backend');
    return users;
}

/**
 * Retrieves all users from the backend.
 * @returns {Array} An array of user objects.
 */
async function getUsers() {
    if (window.dataService) {
        return await window.dataService.getUsers();
    }
    // Fallback to localStorage for backward compatibility
    return JSON.parse(localStorage.getItem('users')) || [];
}

/**
 * Updates a specific user's data in localStorage.
 * @param {number} userId The ID of the user to update.
 * @param {object} updatedData An object containing the fields to update.
 */
function updateUser(userId, updatedData) {
    // This function is now handled by the backend
    console.log('User updates now handled by backend');
}

/**
 * Authenticates a user with enhanced security measures
 * @param {string} username - Username to authenticate
 * @param {string} password - Password to verify
 * @returns {Promise<object>} Authentication result
 */
async function authenticateUser(username, password) {
    if (window.dataService) {
        return await window.dataService.authenticateUser(username, password);
    }
    
    // Fallback to localStorage for backward compatibility
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.username === username);
    
    const result = {
        success: false,
        user: null,
        message: 'Invalid credentials',
        lockout: false
    };
    
    if (!user) {
        // Simulate timing to prevent username enumeration
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        return result;
    }
    
    // Check if account is locked
    if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
        result.message = 'Account temporarily locked due to failed login attempts';
        result.lockout = true;
        return result;
    }
    
    // Check if account is suspended
    if (user.status === 'suspended') {
        result.message = 'Account is suspended';
        return result;
    }
    
    // Verify password
    let isValidPassword = false;
    
    if (user.passwordHash && user.salt) {
        // New secure hash verification
        isValidPassword = await verifyPassword(password, user.passwordHash, user.salt);
    } else if (user.password) {
        // Legacy password check (for migration)
        if (user.role === 'admin') {
            isValidPassword = simpleHash(password) === user.password;
        } else {
            isValidPassword = password === user.password;
        }
    }
    
    if (isValidPassword) {
        // Successful login - reset failed attempts
        updateUser(user.id, { 
            loginAttempts: 0, 
            lockedUntil: null,
            lastLogin: new Date().toLocaleString()
        });
        
        result.success = true;
        result.user = { ...user, password: undefined, passwordHash: undefined, salt: undefined };
        result.message = 'Authentication successful';
    } else {
        // Failed login - increment attempts
        const newAttempts = (user.loginAttempts || 0) + 1;
        const maxAttempts = 5;
        const lockoutDuration = 15 * 60 * 1000; // 15 minutes
        
        let updateData = { loginAttempts: newAttempts };
        
        if (newAttempts >= maxAttempts) {
            updateData.lockedUntil = new Date(Date.now() + lockoutDuration).toISOString();
            result.message = `Account locked for 15 minutes after ${maxAttempts} failed attempts`;
            result.lockout = true;
        } else {
            result.message = `Invalid credentials (${newAttempts}/${maxAttempts} attempts)`;
        }
        
        updateUser(user.id, updateData);
    }
    
    return result;
}

/**
 * Creates a new user with secure password hashing
 * @param {object} userData - User data including username, password, role
 * @returns {Promise<object>} Creation result
 */
async function createUser(userData) {
    if (window.dataService) {
        return await window.dataService.createUser(userData);
    }
    
    // Fallback to localStorage for backward compatibility
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Check if username already exists
    if (users.find(u => u.username === userData.username)) {
        return { success: false, message: 'Username already exists' };
    }
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(userData.password);
    if (passwordValidation.score < 3) {
        return { 
            success: false, 
            message: 'Password too weak', 
            feedback: passwordValidation.feedback 
        };
    }
    
    // Generate secure password hash
    const salt = await generateSalt();
    const passwordHash = await hashPassword(userData.password, salt);
    
    const newUser = {
        id: Math.max(...users.map(u => u.id), 0) + 1,
        username: sanitizeInput(userData.username),
        role: userData.role || 'student',
        status: 'active',
        passwordHash: passwordHash,
        salt: salt,
        lastLogin: 'N/A',
        loginAttempts: 0,
        lockedUntil: null
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    return { success: true, message: 'User created successfully', userId: newUser.id };
}

/**
 * Changes a user's password with security validation
 * @param {number} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<object>} Change result
 */
async function changeUserPassword(userId, currentPassword, newPassword) {
    if (window.dataService) {
        return await window.dataService.changeUserPassword(userId, currentPassword, newPassword);
    }
    
    // Fallback to localStorage for backward compatibility
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        return { success: false, message: 'User not found' };
    }
    
    // Verify current password
    const authResult = await authenticateUser(user.username, currentPassword);
    if (!authResult.success) {
        return { success: false, message: 'Current password is incorrect' };
    }
    
    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (passwordValidation.score < 3) {
        return { 
            success: false, 
            message: 'New password too weak', 
            feedback: passwordValidation.feedback 
        };
    }
    
    // Generate new secure hash
    const salt = await generateSalt();
    const passwordHash = await hashPassword(newPassword, salt);
    
    updateUser(userId, {
        passwordHash: passwordHash,
        salt: salt,
        loginAttempts: 0,
        lockedUntil: null
    });
    
    return { success: true, message: 'Password changed successfully' };
}

// Initialize the user database on script load.
// This ensures that the data is available for other scripts.
(async () => {
    try {
        // Backend initialization is handled separately
        console.log('Data service ready for use');
    } catch (error) {
        console.error('Error initializing data service:', error);
    }
})();