/**
 * @file Manages API configuration storage and retrieval with Supabase
 */

// Initialize Supabase client
let supabaseClient = null;

// Function to initialize Supabase client
function initSupabaseClient() {
    // If client is already initialized, return it
    if (supabaseClient) {
        return supabaseClient;
    }
    
    // If window.supabaseClient exists (already initialized elsewhere), use it
    if (typeof window !== 'undefined' && window.supabaseClient) {
        supabaseClient = window.supabaseClient;
        return supabaseClient;
    }
    
    // If Supabase library is available but client not initialized, initialize it
    if (typeof window !== 'undefined' && window.supabase && 
        window.SUPABASE_URL && window.SUPABASE_KEY) {
        try {
            supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
            window.supabaseClient = supabaseClient; // Store in window for reuse
            return supabaseClient;
        } catch (error) {
            console.error('Error initializing Supabase client:', error);
            return null;
        }
    }
    
    console.error('Supabase client not initialized - missing configuration or library');
    return null;
}

/**
 * Store API configuration in Supabase
 * @param {object} config - API configuration object
 * @param {string} config.moduleName - Module name (e.g., 'quiz')
 * @param {string} config.apiProvider - API provider (e.g., 'OpenRouter')
 * @param {string} config.apiEndpoint - API endpoint URL
 * @param {string} config.apiKey - API key (will be encrypted)
 * @param {string} config.modelName - Model name
 * @returns {Promise<object>} Result of the operation
 */
async function storeApiConfig(config) {
    const supabase = initSupabaseClient();
    if (!supabase) {
        return { success: false, error: 'Supabase client not initialized' };
    }
    
    try {
        // Simple encryption for API key (in a real app, use proper encryption)
        let encryptedApiKey = '';
        if (config.apiKey && typeof config.apiKey === 'string') {
            try {
                encryptedApiKey = btoa(config.apiKey); // Base64 encoding as placeholder
            } catch (encodeError) {
                console.error('Error encoding API key:', encodeError);
                // If encoding fails, store as-is (not recommended for production)
                encryptedApiKey = config.apiKey;
            }
        }
        
        const configData = {
            module_name: config.moduleName,
            api_provider: config.apiProvider,
            api_endpoint: config.apiEndpoint,
            api_key_encrypted: encryptedApiKey,
            model_name: config.modelName,
            is_active: true,
            created_by: config.createdBy || null
        };
        
        const { data, error } = await supabase
            .from('api_configs')
            .insert([configData])
            .select();
        
        if (error) throw error;
        
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error storing API config:', error);
        // Provide more specific error messages
        if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
            return { success: false, error: 'Network error: Unable to connect to Supabase. Please check your internet connection.' };
        }
        return { success: false, error: error.message };
    }
}

/**
 * Update API configuration in Supabase
 * @param {string} configId - Configuration ID
 * @param {object} config - Updated configuration object
 * @returns {Promise<object>} Result of the operation
 */
async function updateApiConfig(configId, config) {
    const supabase = initSupabaseClient();
    if (!supabase) {
        return { success: false, error: 'Supabase client not initialized' };
    }
    
    try {
        // Simple encryption for API key (in a real app, use proper encryption)
        let encryptedApiKey = undefined;
        if (config.apiKey) {
            try {
                encryptedApiKey = btoa(config.apiKey); // Base64 encoding as placeholder
            } catch (encodeError) {
                console.error('Error encoding API key:', encodeError);
                // If encoding fails, store as-is (not recommended for production)
                encryptedApiKey = config.apiKey;
            }
        }
        
        const updateData = {
            ...(config.moduleName && { module_name: config.moduleName }),
            ...(config.apiProvider && { api_provider: config.apiProvider }),
            ...(config.apiEndpoint && { api_endpoint: config.apiEndpoint }),
            ...(encryptedApiKey !== undefined && { api_key_encrypted: encryptedApiKey }),
            ...(config.modelName && { model_name: config.modelName }),
            ...(config.isActive !== undefined && { is_active: config.isActive }),
            updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('api_configs')
            .update(updateData)
            .eq('id', configId)
            .select();
        
        if (error) throw error;
        
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error updating API config:', error);
        // Provide more specific error messages
        if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
            return { success: false, error: 'Network error: Unable to connect to Supabase. Please check your internet connection.' };
        }
        return { success: false, error: error.message };
    }
}

/**
 * Get API configuration from Supabase
 * @param {string} moduleName - Module name (e.g., 'quiz')
 * @param {string} apiProvider - API provider (e.g., 'OpenRouter')
 * @returns {Promise<object>} API configuration
 */
async function getApiConfig(moduleName, apiProvider = 'OpenRouter') {
    const supabase = initSupabaseClient();
    if (!supabase) {
        return { success: false, error: 'Supabase client not initialized' };
    }
    
    try {
        // First check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.warn('User not authenticated, falling back to localStorage');
            return { success: false, error: 'User not authenticated' };
        }
        
        const { data, error } = await supabase
            .from('api_configs')
            .select('*')
            .eq('module_name', moduleName)
            .eq('api_provider', apiProvider)
            .eq('is_active', true)
            .limit(1);
        
        if (error) {
            console.error('Supabase query error:', error);
            // If it's a network error, provide a more specific message
            if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
                return { success: false, error: 'Network error: Unable to connect to Supabase. Please check your internet connection.' };
            }
            throw error;
        }
        
        if (!data || data.length === 0) {
            return { success: false, error: 'No active API configuration found' };
        }
        
        // Decrypt API key (in a real app, use proper decryption)
        const config = data[0];
        try {
            // Try to decode the API key, but handle cases where it might not be properly encoded
            if (config.api_key_encrypted && typeof config.api_key_encrypted === 'string') {
                // Check if it's already a valid Base64 string
                try {
                    config.api_key = atob(config.api_key_encrypted);
                } catch (decodeError) {
                    // If decoding fails, the key might be stored in plain text
                    console.warn('API key not properly Base64 encoded, using as-is');
                    config.api_key = config.api_key_encrypted;
                }
            } else {
                config.api_key = '';
            }
        } catch (decodeError) {
            console.error('Error decoding API key:', decodeError);
            config.api_key = '';
        }
        
        return { success: true, data: config };
    } catch (error) {
        console.error('Error getting API config:', error);
        // Provide more specific error messages
        if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
            return { success: false, error: 'Network error: Unable to connect to Supabase. Please check your internet connection.' };
        }
        return { success: false, error: error.message };
    }
}

/**
 * Get all API configurations for a module from Supabase
 * @param {string} moduleName - Module name (e.g., 'quiz')
 * @returns {Promise<object>} API configurations
 */
async function getAllApiConfigs(moduleName) {
    const supabase = initSupabaseClient();
    if (!supabase) {
        return { success: false, error: 'Supabase client not initialized' };
    }
    
    try {
        const { data, error } = await supabase
            .from('api_configs')
            .select('*')
            .eq('module_name', moduleName)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Decrypt API keys (in a real app, use proper decryption)
        const configs = data.map(config => {
            try {
                // Try to decode the API key, but handle cases where it might not be properly encoded
                if (config.api_key_encrypted && typeof config.api_key_encrypted === 'string') {
                    // Check if it's already a valid Base64 string
                    try {
                        config.api_key = atob(config.api_key_encrypted);
                    } catch (decodeError) {
                        // If decoding fails, the key might be stored in plain text
                        console.warn('API key not properly Base64 encoded, using as-is');
                        config.api_key = config.api_key_encrypted;
                    }
                } else {
                    config.api_key = '';
                }
            } catch (decodeError) {
                console.error('Error decoding API key:', decodeError);
                config.api_key = '';
            }
            return config;
        });
        
        return { success: true, data: configs };
    } catch (error) {
        console.error('Error getting API configs:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete API configuration from Supabase
 * @param {string} configId - Configuration ID
 * @returns {Promise<object>} Result of the operation
 */
async function deleteApiConfig(configId) {
    const supabase = initSupabaseClient();
    if (!supabase) {
        return { success: false, error: 'Supabase client not initialized' };
    }
    
    try {
        const { error } = await supabase
            .from('api_configs')
            .delete()
            .eq('id', configId);
        
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
        console.error('Error deleting API config:', error);
        return { success: false, error: error.message };
    }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        storeApiConfig,
        updateApiConfig,
        getApiConfig,
        getAllApiConfigs,
        deleteApiConfig
    };
}