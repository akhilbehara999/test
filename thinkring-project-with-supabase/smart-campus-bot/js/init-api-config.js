/**
 * @file Utility script to initialize API configurations in Supabase
 */

/**
 * Initialize default API configurations in Supabase
 * @returns {Promise<object>} Initialization result
 */
async function initializeApiConfigurations() {
    try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
            return { success: false, error: 'This script must be run in a browser environment' };
        }
        
        // Check if Supabase is available
        if (!window.supabaseClient) {
            return { success: false, error: 'Supabase client not available' };
        }
        
        const supabase = window.supabaseClient;
        
        // Check if user is authenticated as admin
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return { success: false, error: 'User not authenticated. Please log in as admin first.' };
        }
        
        // Get user info to check if they're admin
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
            
        if (userError) {
            return { success: false, error: 'Error fetching user info: ' + userError.message };
        }
        
        if (user.role !== 'admin') {
            return { success: false, error: 'Only administrators can initialize API configurations' };
        }
        
        console.log('✅ User authenticated as admin, initializing API configurations...');
        
        // Default configurations
        const defaultConfigs = [
            {
                module_name: 'quiz',
                api_provider: 'OpenRouter',
                api_endpoint: 'https://openrouter.ai/api/v1/chat/completions',
                api_key_encrypted: '', // Will be set by admin later
                model_name: 'openai/gpt-oss-20b:free',
                is_active: true,
                created_by: session.user.id
            },
            {
                module_name: 'code-explainer',
                api_provider: 'OpenRouter',
                api_endpoint: 'https://openrouter.ai/api/v1/chat/completions',
                api_key_encrypted: '',
                model_name: 'openai/gpt-oss-20b:free',
                is_active: true,
                created_by: session.user.id
            },
            {
                module_name: 'book',
                api_provider: 'OpenRouter',
                api_endpoint: 'https://openrouter.ai/api/v1/chat/completions',
                api_key_encrypted: '',
                model_name: 'openai/gpt-oss-20b:free',
                is_active: true,
                created_by: session.user.id
            }
        ];
        
        // Insert default configurations
        const { data, error } = await supabase
            .from('api_configs')
            .upsert(defaultConfigs, {
                onConflict: 'module_name,api_provider'
            })
            .select();
            
        if (error) {
            return { success: false, error: 'Error inserting configurations: ' + error.message };
        }
        
        console.log('✅ Successfully initialized API configurations');
        console.log('📝 Please update the API keys in the admin panel');
        
        return { 
            success: true, 
            message: 'Successfully initialized API configurations',
            data: data
        };
    } catch (error) {
        console.error('Initialization error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Runs the initialization and provides user feedback
 */
async function runInitialization() {
    console.log('🚀 Starting API configuration initialization...');
    
    const result = await initializeApiConfigurations();
    
    if (result.success) {
        console.log('🎉 Initialization completed successfully!');
        console.log('📝 Message:', result.message);
        if (result.data) {
            console.log('📄 Configurations created:', result.data.length);
        }
    } else {
        console.error('❌ Initialization failed:', result.error);
    }
    
    return result;
}

// If running in a browser environment and this script is loaded directly
if (typeof window !== 'undefined' && typeof module === 'undefined') {
    // Make functions available globally
    window.initializeApiConfigurations = initializeApiConfigurations;
    window.runApiConfigInitialization = runInitialization;
}

// Export for use in other modules (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeApiConfigurations,
        runInitialization
    };
}