/**
 * @file Migration script to move API configurations from localStorage to Supabase
 */

// Import required modules
// Note: In a browser environment, these would be available globally
// In a Node.js environment, you would need to import them differently

/**
 * Migrates API configurations from localStorage to Supabase
 * @returns {Promise<object>} Migration result
 */
async function migrateApiConfigToSupabase() {
    try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
            return { success: false, error: 'This script must be run in a browser environment' };
        }
        
        // Check if Supabase is available
        if (!window.supabaseClient) {
            return { success: false, error: 'Supabase client not available' };
        }
        
        // Get existing configuration from localStorage
        const apiKey = localStorage.getItem('openrouter-api-key');
        const model = localStorage.getItem('ai-model');
        
        // If no configuration exists in localStorage, nothing to migrate
        if (!apiKey && !model) {
            return { success: true, message: 'No configuration found in localStorage to migrate' };
        }
        
        console.log('Found existing configuration in localStorage, migrating to Supabase...');
        
        // Prepare configuration data
        const configData = {
            moduleName: 'quiz',
            apiProvider: 'OpenRouter',
            apiEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
            apiKey: apiKey,
            modelName: model || 'openai/gpt-oss-20b:free',
            createdBy: localStorage.getItem('userId') || null
        };
        
        // Check if configuration already exists in Supabase
        const existingConfig = await getApiConfig('quiz', 'OpenRouter');
        
        let result;
        if (existingConfig.success) {
            // Update existing configuration
            console.log('Updating existing configuration in Supabase...');
            result = await updateApiConfig(existingConfig.data.id, {
                apiKey: configData.apiKey,
                modelName: configData.modelName,
                isActive: true
            });
        } else {
            // Create new configuration
            console.log('Creating new configuration in Supabase...');
            result = await storeApiConfig(configData);
        }
        
        if (result.success) {
            console.log('✅ Successfully migrated API configuration to Supabase');
            
            // Optionally, clear localStorage values (commented out for safety)
            // localStorage.removeItem('openrouter-api-key');
            // localStorage.removeItem('ai-model');
            
            return { 
                success: true, 
                message: 'Successfully migrated API configuration to Supabase',
                data: result.data
            };
        } else {
            return { 
                success: false, 
                error: 'Failed to store configuration in Supabase: ' + result.error 
            };
        }
    } catch (error) {
        console.error('Migration error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Runs the migration and provides user feedback
 */
async function runMigration() {
    console.log('🚀 Starting API configuration migration...');
    
    const result = await migrateApiConfigToSupabase();
    
    if (result.success) {
        console.log('🎉 Migration completed successfully!');
        console.log('📝 Message:', result.message);
        if (result.data) {
            console.log('📄 Configuration ID:', result.data.id);
        }
    } else {
        console.error('❌ Migration failed:', result.error);
    }
    
    return result;
}

// If running in a browser environment and this script is loaded directly
if (typeof window !== 'undefined' && typeof module === 'undefined') {
    // Make functions available globally
    window.runApiConfigMigration = runMigration;
    
    // Optionally run automatically when loaded
    // Uncomment the next line if you want the migration to run automatically
    // runMigration();
}

// Export for use in other modules (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        migrateApiConfigToSupabase,
        runMigration
    };
}