/**
 * @file Supabase integration for the Chatbot module
 */

// Import required functions
if (typeof module !== 'undefined' && module.exports) {
    // In Node.js environment
    const { initSupabaseClient } = require('../../js/supabase.js');
    const { getApiConfig } = require('../../js/api-config-supabase.js');
    global.initSupabaseClient = initSupabaseClient;
    global.getApiConfig = getApiConfig;
}

/**
 * Initialize Supabase client
 * @returns {object} Supabase client instance
 */
function initChatbotSupabase() {
    // If in browser environment, use window functions
    if (typeof window !== 'undefined' && window.initSupabaseClient) {
        return window.initSupabaseClient();
    }
    
    // If in Node.js environment, use imported functions
    if (typeof initSupabaseClient !== 'undefined') {
        return initSupabaseClient();
    }
    
    console.error('Supabase client not available');
    return null;
}

/**
 * Get API configuration for chatbot from Supabase
 * @returns {Promise<object>} API configuration
 */
async function getChatbotApiConfig() {
    // If in browser environment, use window functions
    if (typeof window !== 'undefined' && window.getApiConfig) {
        return await window.getApiConfig('chatbot', 'OpenRouter');
    }
    
    // If in Node.js environment, use imported functions
    if (typeof getApiConfig !== 'undefined') {
        return await getApiConfig('chatbot', 'OpenRouter');
    }
    
    return { success: false, error: 'API config function not available' };
}

/**
 * Get knowledge base entries from Supabase
 * @returns {Promise<object>} Knowledge base entries
 */
async function getKnowledgeBase() {
    const supabase = initChatbotSupabase();
    if (!supabase) {
        return { success: false, error: 'Supabase client not initialized' };
    }
    
    try {
        // NOTE: We're removing the authentication check here because knowledge base entries
        // should be publicly accessible for the chatbot to function properly
        
        const { data, error } = await supabase
            .from('chatbot_kb')
            .select('*')
            .eq('is_active', true)
            .order('category', { ascending: true })
            .order('question', { ascending: true });
        
        if (error) {
            console.error('Supabase query error:', error);
            // If it's a network error, provide a more specific message
            if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
                return { success: false, error: 'Network error: Unable to connect to Supabase. Please check your internet connection.' };
            }
            throw error;
        }
        
        // Convert array to object for easier lookup
        const kb = {};
        data.forEach(item => {
            kb[item.question.toLowerCase().trim()] = item.answer; // Trim whitespace from keys
        });
        
        return { success: true, data: kb };
    } catch (error) {
        console.error('Error getting knowledge base:', error);
        // Provide more specific error messages
        if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
            return { success: false, error: 'Network error: Unable to connect to Supabase. Please check your internet connection.' };
        }
        return { success: false, error: error.message };
    }
}

/**
 * Add or update a knowledge base entry in Supabase
 * @param {string} question - The question
 * @param {string} answer - The answer
 * @param {string} category - The category (optional)
 * @param {string} userId - The user ID of the creator (optional)
 * @returns {Promise<object>} Result of the operation
 */
async function upsertKnowledgeBaseEntry(question, answer, category = 'general', userId = null) {
    const supabase = initChatbotSupabase();
    if (!supabase) {
        return { success: false, error: 'Supabase client not initialized' };
    }
    
    try {
        // Check if entry already exists
        const { data: existingData, error: fetchError } = await supabase
            .from('chatbot_kb')
            .select('id')
            .eq('question', question)
            .limit(1);
        
        if (fetchError) throw fetchError;
        
        let result;
        if (existingData && existingData.length > 0) {
            // Update existing entry
            const { data, error } = await supabase
                .from('chatbot_kb')
                .update({
                    answer: answer,
                    category: category,
                    updated_at: new Date().toISOString(),
                    created_by: userId || undefined
                })
                .eq('question', question)
                .select();
            
            if (error) throw error;
            result = { success: true, data: data[0], operation: 'updated' };
        } else {
            // Insert new entry
            const { data, error } = await supabase
                .from('chatbot_kb')
                .insert([{
                    question: question,
                    answer: answer,
                    category: category,
                    is_active: true,
                    created_by: userId || null
                }])
                .select();
            
            if (error) throw error;
            result = { success: true, data: data[0], operation: 'created' };
        }
        
        return result;
    } catch (error) {
        console.error('Error upserting knowledge base entry:', error);
        // Provide more specific error messages
        if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
            return { success: false, error: 'Network error: Unable to connect to Supabase. Please check your internet connection.' };
        }
        return { success: false, error: error.message };
    }
}

/**
 * Delete a knowledge base entry from Supabase
 * @param {string} question - The question to delete
 * @returns {Promise<object>} Result of the operation
 */
async function deleteKnowledgeBaseEntry(question) {
    const supabase = initChatbotSupabase();
    if (!supabase) {
        return { success: false, error: 'Supabase client not initialized' };
    }
    
    try {
        const { error } = await supabase
            .from('chatbot_kb')
            .delete()
            .eq('question', question);
        
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
        console.error('Error deleting knowledge base entry:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all knowledge base entries (for admin view)
 * @returns {Promise<object>} All knowledge base entries
 */
async function getAllKnowledgeBaseEntries() {
    const supabase = initChatbotSupabase();
    if (!supabase) {
        return { success: false, error: 'Supabase client not initialized' };
    }
    
    try {
        const { data, error } = await supabase
            .from('chatbot_kb')
            .select('*')
            .order('category', { ascending: true })
            .order('question', { ascending: true });
        
        if (error) throw error;
        
        return { success: true, data: data };
    } catch (error) {
        console.error('Error getting all knowledge base entries:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send question to AI API using configuration from Supabase
 * @param {string} question - The question to send to the AI
 * @returns {Promise<object>} AI response
 */
async function askAI(question) {
    try {
        // Get API configuration from Supabase
        const apiConfigResult = await getChatbotApiConfig();
        
        if (!apiConfigResult.success) {
            return { success: false, error: apiConfigResult.error };
        }
        
        const config = apiConfigResult.data;
        
        // Validate required fields
        if (!config.api_endpoint || !config.api_key || !config.model_name) {
            return { success: false, error: 'API configuration is incomplete' };
        }
        
        // Send request to AI API
        const response = await fetch(config.api_endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${config.api_key}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": config.model_name,
                "messages": [
                    { "role": "system", "content": "You are a helpful AI assistant for a university campus." },
                    { "role": "user", "content": question }
                ]
            })
        });
        
        if (!response.ok) {
            return { success: false, error: `AI service error: ${response.status} ${response.statusText}` };
        }
        
        const data = await response.json();
        return { success: true, data: data.choices[0].message.content };
    } catch (error) {
        console.error('Error calling AI API:', error);
        return { success: false, error: `Error connecting to AI service: ${error.message}` };
    }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getKnowledgeBase,
        upsertKnowledgeBaseEntry,
        deleteKnowledgeBaseEntry,
        getAllKnowledgeBaseEntries,
        askAI
    };
} else if (typeof window !== 'undefined') {
    // Export to window object for browser use
    window.chatbotSupabase = {
        getKnowledgeBase,
        upsertKnowledgeBaseEntry,
        deleteKnowledgeBaseEntry,
        getAllKnowledgeBaseEntries,
        askAI
    };
}