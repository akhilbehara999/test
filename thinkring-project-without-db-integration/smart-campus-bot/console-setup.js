// Quick AI Configuration Script for Smart Campus Bot
// Paste this in your browser console to set up all modules at once

// Instructions:
// 1. Replace 'YOUR_API_KEY_HERE' with your actual OpenRouter API key
// 2. Open browser developer tools (F12)
// 3. Go to Console tab
// 4. Paste this entire script and press Enter

(function quickAISetup() {
    // Configuration
    const API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your actual API key
    const MODEL = 'openai/gpt-oss-20b:free';
    
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        console.error('❌ Please replace YOUR_API_KEY_HERE with your actual OpenRouter API key!');
        return;
    }
    
    console.log('🚀 Starting AI Configuration...');
    
    try {
        // Configure Quiz Module
        localStorage.setItem('openrouter-api-key', API_KEY);
        localStorage.setItem('ai-model', MODEL);
        
        // Configure Code Explainer Module
        localStorage.setItem('code-explainer-api-key', API_KEY);
        localStorage.setItem('code-explainer-model', MODEL);
        
        // Configure Book Module
        localStorage.setItem('book-tools-api-key', API_KEY);
        localStorage.setItem('book-tools-model', MODEL);
        
        console.log('✅ Configuration Complete!');
        console.log('📊 Summary:');
        console.log(`   🔑 API Key: ${API_KEY.substring(0, 10)}...`);
        console.log(`   🤖 Model: ${MODEL}`);
        console.log('   📱 Modules Configured:');
        console.log('     • Quiz Module');
        console.log('     • Code Explainer Module');
        console.log('     • Book Tools Module');
        console.log('');
        console.log('🎉 All modules are now ready to use!');
        console.log('💡 You can now use AI features in all modules.');
        
        // Show a visual confirmation if possible
        if (typeof showStatus === 'function') {
            showStatus('✅ All modules configured successfully!', 'success');
        } else {
            alert('✅ AI Configuration Complete!\n\nAll modules are now ready to use your OpenRouter API.');
        }
        
    } catch (error) {
        console.error('❌ Configuration failed:', error);
        alert('❌ Configuration failed. Please check the console for details.');
    }
})();

// Additional helper functions available after running this script:

// Check current configuration
function checkAIConfig() {
    console.log('📋 Current AI Configuration:');
    console.log('Quiz Module:', {
        apiKey: localStorage.getItem('openrouter-api-key') ? '✅ Set' : '❌ Not Set',
        model: localStorage.getItem('ai-model') || 'Not Set'
    });
    console.log('Code Explainer:', {
        apiKey: localStorage.getItem('code-explainer-api-key') ? '✅ Set' : '❌ Not Set',
        model: localStorage.getItem('code-explainer-model') || 'Not Set'
    });
    console.log('Book Tools:', {
        apiKey: localStorage.getItem('book-tools-api-key') ? '✅ Set' : '❌ Not Set',
        model: localStorage.getItem('book-tools-model') || 'Not Set'
    });
}

// Clear all configuration
function clearAIConfig() {
    const keys = [
        'openrouter-api-key', 'ai-model',
        'code-explainer-api-key', 'code-explainer-model',
        'book-tools-api-key', 'book-tools-model'
    ];
    
    keys.forEach(key => localStorage.removeItem(key));
    console.log('🗑️ All AI configuration cleared');
}

console.log('💡 Helper functions available:');
console.log('   checkAIConfig() - Check current configuration');
console.log('   clearAIConfig() - Clear all configuration');