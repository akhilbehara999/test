// Import Supabase client library
// This will be loaded via CDN in the HTML files

// Supabase configuration - to be updated with your actual project details
window.SUPABASE_URL = 'https://ddayymyqxzfrmizlribp.supabase.co';
window.SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYXl5bXlxeHpmcm1pemxyaWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMTczNjAsImV4cCI6MjA3Mjc5MzM2MH0.Q44o0dmsU3FOpltDllacuDRWvPp8NfPEuQghE2ajSUo';

// Initialize Supabase client
window.supabaseClient = null;

// Function to initialize Supabase client
function initSupabase() {
    if (window.supabaseClient) {
        return window.supabaseClient;
    }
    
    if (typeof window !== 'undefined' && window.supabase) {
        window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
        return window.supabaseClient;
    }
    
    console.error('Supabase client library not found');
    return null;
}

// Function to sign up a new user
async function supabaseSignUp(email, password, userData = {}) {
    if (!window.supabaseClient) initSupabase();
    
    try {
        const { data, error } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    ...userData
                }
            }
        });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Supabase signup error:', error);
        return { success: false, error: error.message };
    }
}

// Function to sign in a user
async function supabaseSignIn(email, password) {
    if (!window.supabaseClient) initSupabase();
    
    try {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Supabase signin error:', error);
        return { success: false, error: error.message };
    }
}

// Function to sign out a user
async function supabaseSignOut() {
    if (!window.supabaseClient) initSupabase();
    
    try {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Supabase signout error:', error);
        return { success: false, error: error.message };
    }
}

// Function to get the current user
async function getCurrentUser() {
    if (!window.supabaseClient) initSupabase();
    
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        return user;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

// Function to get user profile from the users table
async function getUserProfile(userId) {
    if (!window.supabaseClient) initSupabase();
    
    try {
        const { data, error } = await window.supabaseClient
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error getting user profile:', error);
        return { success: false, error: error.message };
    }
}

// Function to create or update user profile in the users table
async function upsertUserProfile(userData) {
    if (!window.supabaseClient) initSupabase();
    
    try {
        const { data, error } = await window.supabaseClient
            .from('users')
            .upsert(userData, { onConflict: 'id' });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error upserting user profile:', error);
        return { success: false, error: error.message };
    }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initSupabase,
        supabaseSignUp,
        supabaseSignIn,
        supabaseSignOut,
        getCurrentUser,
        getUserProfile,
        upsertUserProfile
    };
}