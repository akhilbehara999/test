/**
 * @file Manages user data for the application with enhanced security.
 */

// Initialize Supabase
let supabase;

// Function to initialize Supabase client
function initSupabase() {
    // If we already have a Supabase client, return it
    if (supabase) return supabase;
    
    // Try to use the global Supabase client first
    if (typeof window !== 'undefined' && window.supabaseClient) {
        supabase = window.supabaseClient;
        return supabase;
    }
    
    // Check if Supabase library is available
    if (typeof window !== 'undefined' && window.supabase) {
        // Try to use the Supabase client from supabase.js
        if (window.SUPABASE_URL && window.SUPABASE_KEY) {
            try {
                supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
                window.supabaseClient = supabase; // Set global client to avoid duplicates
                return supabase;
            } catch (error) {
                console.error('Error initializing Supabase with supabase.js credentials:', error);
            }
        }
        
        // Fallback to configuration from supabase-config.js
        if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && window.SUPABASE_CONFIG.anonKey) {
            try {
                // Check if URL is valid
                new URL(window.SUPABASE_CONFIG.url);
                supabase = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
                window.supabaseClient = supabase; // Set global client to avoid duplicates
                return supabase;
            } catch (error) {
                console.error('Invalid Supabase URL in configuration:', window.SUPABASE_CONFIG.url);
                return null;
            }
        } else {
            console.error('Supabase configuration not found or incomplete');
            return null;
        }
    }
    
    console.error('Supabase client library not found');
    return null;
}

/**
 * Initializes the user database in Supabase if it doesn't exist.
 * This function is kept for backward compatibility but will not be used with Supabase.
 */
async function initializeUsers() {
    // With Supabase, we don't need to initialize users in localStorage
    // The users table should be created in Supabase directly
    console.log('Using Supabase for user management. LocalStorage initialization skipped.');
    return [];
}

/**
 * Authenticates a user with Supabase
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} Authentication result
 */
async function authenticateUser(email, password) {
    // Initialize Supabase if not already done
    const supabaseClient = initSupabase();
    if (!supabaseClient) {
        return {
            success: false,
            user: null,
            message: 'Supabase client not initialized',
            lockout: false
        };
    }
    
    try {
        // Sign in with Supabase
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            return {
                success: false,
                user: null,
                message: error.message,
                lockout: error.status === 401
            };
        }
        
        // Get user profile from users table
        const userProfile = await getUserProfile(data.user.id);
        
        // Determine user role
        let role = 'student'; // default role
        
        // Check if this is the admin user
        if (email === 'akhilbehara97@gmail.com') {
            role = 'admin';
        } else if (userProfile?.role) {
            role = userProfile.role;
        }
        
        return {
            success: true,
            user: {
                id: data.user.id,
                email: data.user.email,
                username: userProfile?.username || data.user.email.split('@')[0],
                role: role
            },
            message: 'Authentication successful'
        };
    } catch (error) {
        console.error('Authentication error:', error);
        return {
            success: false,
            user: null,
            message: 'Authentication service temporarily unavailable.',
            lockout: false
        };
    }
}

/**
 * Creates a new user with Supabase
 * @param {object} userData - User data including email, password, username
 * @returns {Promise<object>} Creation result
 */
async function createUser(userData) {
    // Initialize Supabase if not already done
    const supabaseClient = initSupabase();
    if (!supabaseClient) {
        return { success: false, message: 'Supabase client not initialized' };
    }
    
    try {
        // Sign up with Supabase Auth
        const { data, error } = await supabaseClient.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    username: userData.username,
                    role: userData.role || 'student'
                }
            }
        });
        
        if (error) {
            console.error('Supabase signup error:', error);
            return { success: false, message: error.message };
        }
        
        // For Supabase, the user profile is automatically created in the users table
        // via a trigger or we can create it manually after signup
        // The user ID is in data.user.id if signup was successful
        
        if (data.user) {
            // User created successfully
            return { 
                success: true, 
                message: 'User created successfully. Please check your email for confirmation.', 
                userId: data.user.id 
            };
        } else {
            // Signup successful but no user object (email confirmation required)
            return { 
                success: true, 
                message: 'Signup successful. Please check your email for confirmation.', 
                userId: null 
            };
        }
    } catch (error) {
        console.error('Signup error:', error);
        return { success: false, message: 'Account creation failed. Please try again.' };
    }
}

/**
 * Creates a user profile in the users table
 * @param {object} userProfile - User profile data
 * @returns {Promise<object>} Creation result
 */
async function createUserProfile(userProfile) {
    const supabaseClient = initSupabase();
    if (!supabaseClient) return { success: false, message: 'Supabase client not initialized' };
    
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .insert([userProfile]);
        
        if (error) {
            console.error('Error creating user profile:', error);
            return { success: false, message: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        console.error('Error creating user profile:', error);
        return { success: false, message: 'Failed to create user profile' };
    }
}

/**
 * Gets user profile from the users table
 * @param {string} userId - User ID
 * @returns {Promise<object>} User profile data
 */
async function getUserProfile(userId) {
    const supabaseClient = initSupabase();
    if (!supabaseClient) return null;
    
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
        
        return data;
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
}

/**
 * Retrieves all users from Supabase (admin function)
 * @returns {Promise<Array>} An array of user objects.
 */
async function getUsers() {
    const supabaseClient = initSupabase();
    if (!supabaseClient) return [];
    
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*');
        
        if (error) {
            console.error('Error getting users:', error);
            return [];
        }
        
        return data || [];
    } catch (error) {
        console.error('Error getting users:', error);
        return [];
    }
}

/**
 * Updates a specific user's data in Supabase
 * @param {string} userId The ID of the user to update.
 * @param {object} updatedData An object containing the fields to update.
 */
async function updateUser(userId, updatedData) {
    const supabaseClient = initSupabase();
    if (!supabaseClient) return;
    
    try {
        const { error } = await supabaseClient
            .from('users')
            .update(updatedData)
            .eq('id', userId);
        
        if (error) {
            console.error('Error updating user:', error);
        }
    } catch (error) {
        console.error('Error updating user:', error);
    }
}

// The following functions are kept for backward compatibility but may not be used with Supabase

async function migrateUserPasswords(users) {
    console.log('Password migration not needed with Supabase authentication.');
    return users;
}

// Initialize Supabase when the script loads
initSupabase();