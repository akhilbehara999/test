/**
 * @file Manages user data for the application with enhanced security.
 */

/**
 * Initializes the user database in localStorage if it doesn't exist.
 * Populates it with default user data using secure password hashing.
 */
async function initializeUsers() {
    let users = JSON.parse(localStorage.getItem('users'));
    if (!users) {
        // Initialize with secure password hashes
        const studentSalt = await generateSalt();
        const adminSalt = await generateSalt();
        const testUserSalt = await generateSalt();
        
        users = [
            { 
                id: 1, 
                username: 'student', 
                role: 'student', 
                status: 'active', 
                passwordHash: await hashPassword('password123', studentSalt),
                salt: studentSalt,
                lastLogin: 'N/A'
            },
            { 
                id: 2, 
                username: 'KAB', 
                role: 'admin', 
                status: 'active', 
                passwordHash: await hashPassword('7013432177@akhil', adminSalt),
                salt: adminSalt,
                lastLogin: 'N/A'
            },
            { 
                id: 3, 
                username: 'testuser', 
                role: 'student', 
                status: 'suspended', 
                passwordHash: await hashPassword('password', testUserSalt),
                salt: testUserSalt,
                lastLogin: '2025-08-16'
            }
        ];
        
        // Remove old password field if it exists
        users.forEach(user => {
            if (user.password) {
                delete user.password;
            }
        });
        
        localStorage.setItem('users', JSON.stringify(users));
    } else {
        // Migrate existing users to new security model if needed
        let needsMigration = false;
        for (let user of users) {
            if (user.password && !user.passwordHash) {
                needsMigration = true;
                break;
            }
        }
        
        if (needsMigration) {
            users = await migrateUserPasswords(users);
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
    return users;
}

/**
 * Migrates existing plain text passwords to secure hashes
 * @param {Array} users - Array of user objects
 * @returns {Promise<Array>} Updated users array
 */
async function migrateUserPasswords(users) {
    console.log('Migrating user passwords to secure hashes...');
    
    for (let user of users) {
        if (user.password && !user.passwordHash) {
            const salt = await generateSalt();
            
            if (user.role === 'admin' && typeof user.password === 'string' && !user.password.startsWith('-')) {
                // Handle admin password that might already be hashed with simpleHash
                user.passwordHash = await hashPassword(user.password, salt);
            } else {
                user.passwordHash = await hashPassword(user.password, salt);
            }
            
            user.salt = salt;
            
            // Remove old password field
            delete user.password;
        }
    }
    
    return users;
}

/**
 * Retrieves all users from localStorage.
 * @returns {Array} An array of user objects.
 */
function getUsers() {
    return JSON.parse(localStorage.getItem('users')) || [];
}

/**
 * Updates a specific user's data in localStorage.
 * @param {number} userId The ID of the user to update.
 * @param {object} updatedData An object containing the fields to update.
 */
function updateUser(userId, updatedData) {
    let users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex > -1) {
        users[userIndex] = { ...users[userIndex], ...updatedData };
        localStorage.setItem('users', JSON.stringify(users));
    }
}

/**
 * Authenticates a user with enhanced security measures
 * @param {string} username - Username to authenticate
 * @param {string} password - Password to verify
 * @returns {Promise<object>} Authentication result
 */
async function authenticateUser(username, password) {
    const users = getUsers();
    const user = users.find(u => u.username === username);
    
    const result = {
        success: false,
        user: null,
        message: 'Invalid credentials'
    };
    
    if (!user) {
        // Simulate timing to prevent username enumeration
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        return result;
    }
    
    // Check if account is suspended (keeping this functionality)
    if (user.status === 'suspended') {
        result.message = 'Account is suspended';
        return result;
    }
    
    // Verify password
    let isValidPassword = false;
    
    // Check for secure password hash first (new method)
    if (user.passwordHash && user.salt) {
        // New secure hash verification
        isValidPassword = await verifyPassword(password, user.passwordHash, user.salt);
    } 
    // Check for legacy hashed password (admin with simpleHash)
    else if (user.password && user.role === 'admin' && !user.passwordHash) {
        // For admin users, check if it's a simpleHash
        if (user.password.startsWith('-') || !isNaN(user.password)) {
            // It's a hashed password
            isValidPassword = simpleHash(password) === user.password;
        } else {
            // It's a plain text password
            isValidPassword = password === user.password;
        }
    }
    // Check for plain text password (fallback/default)
    else if (user.password) {
        // Direct comparison for plain text passwords
        isValidPassword = password === user.password;
    }
    
    if (isValidPassword) {
        // Successful login - update last login
        updateUser(user.id, { 
            lastLogin: new Date().toLocaleString()
        });
        
        result.success = true;
        result.user = { ...user, password: undefined, passwordHash: undefined, salt: undefined };
        result.message = 'Authentication successful';
    } else {
        // Failed login - just return invalid credentials message
        result.message = 'Invalid credentials';
    }
    
    return result;
}

/**
 * Creates a new user with secure password hashing
 * @param {object} userData - User data including username, password, role
 * @returns {Promise<object>} Creation result
 */
async function createUser(userData) {
    const users = getUsers();
    
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
        lastLogin: 'N/A'
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
    const users = getUsers();
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
        salt: salt
    });
    
    return { success: true, message: 'Password changed successfully' };
}

// Initialize the user database on script load.
// This ensures that the data is available for other scripts.
(async () => {
    try {
        await initializeUsers();
        console.log('User database initialized with secure password hashing');
    } catch (error) {
        console.error('Error initializing user database:', error);
        // Fallback to basic initialization
        const users = JSON.parse(localStorage.getItem('users'));
        if (!users || users.length === 0) {
            console.log('Using fallback user initialization');
            const basicUsers = [
                { id: 1, username: 'student', role: 'student', status: 'active', password: 'password123', lastLogin: 'N/A' },
                { id: 2, username: 'KAB', role: 'admin', status: 'active', password: '7013432177@akhil', lastLogin: 'N/A' },
                { id: 3, username: 'testuser', role: 'student', status: 'suspended', password: 'password', lastLogin: '2025-08-16' }
            ];
            localStorage.setItem('users', JSON.stringify(basicUsers));
        }
    }
})();
