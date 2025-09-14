// Supabase Configuration
// 
// To set up Supabase for this project:
// 1. Create a new project at https://app.supabase.com/
// 2. Copy your project URL and anon key from the project settings
// 3. Replace the placeholder values below with your actual Supabase project details
// 4. Run the SQL script in supabase-users-table.sql to create the users table
// 5. Set up authentication providers as needed in the Supabase dashboard

const SUPABASE_CONFIG = {
    // Your Supabase project URL (e.g., "https://your-project.supabase.co")
    url: 'https://ddayymyqxzfrmizlribp.supabase.co',
    
    // Your Supabase anon (public) key
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYXl5bXlxeHpmcm1pemxyaWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMTczNjAsImV4cCI6MjA3Mjc5MzM2MH0.Q44o0dmsU3FOpltDllacuDRWvPp8NfPEuQghE2ajSUo',
    
    // Your Supabase service role key (for server-side operations)
    serviceKey: 'YOUR_SUPABASE_SERVICE_KEY'
};

// Export the configuration to window object for use in data.js
if (typeof window !== 'undefined') {
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
}

// Export the configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SUPABASE_CONFIG };
}