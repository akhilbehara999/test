document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const userView = document.getElementById('user-view');
    const adminView = document.getElementById('admin-view');
    const textInput = document.getElementById('text-input');
    const summarizeBtn = document.getElementById('summarize-btn');
    const expandBtn = document.getElementById('expand-btn');
    const rephraseBtn = document.getElementById('rephrase-btn');
    const speakBtn = document.getElementById('speak-btn');
    const stopBtn = document.getElementById('stop-btn');
    const copyBtn = document.getElementById('copy-btn');
    const exportBtn = document.getElementById('export-btn');
    const saveBtn = document.getElementById('save-btn');
    const statusDiv = document.getElementById('status');
    const outputTextDiv = document.getElementById('output-text');

    // URL Parameters and Admin View Detection
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminView = urlParams.get('view') === 'admin';

    /**
     * Show a notification message to the user
     * @param {string} message - The message to display
     * @param {string} type - The type of message ('info', 'success', 'warning', 'error')
     */
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Remove after 5 seconds with fade out animation
        setTimeout(() => {
            notification.classList.add('fade-out');
            // Remove element after animation completes
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 5000);
    }

    // --- Drag and Drop Logic ---
    if (textInput) {
        textInput.addEventListener('dragover', (e) => {
            e.preventDefault();
            textInput.classList.add('dragover');
        });

        textInput.addEventListener('dragleave', () => {
            textInput.classList.remove('dragover');
        });

        textInput.addEventListener('drop', (e) => {
            e.preventDefault();
            textInput.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileDrop(files[0]);
            }
        });
    }

    /**
     * Handles the dropped file, reading its content based on type.
     * @param {File} file The file that was dropped.
     */
    function handleFileDrop(file) {
        statusDiv.textContent = `Reading file: ${file.name}...`;

        if (file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (e) => {
                textInput.value = e.target.result;
                statusDiv.textContent = 'File loaded successfully.';
                showNotification('File loaded successfully!', 'success');
            };
            reader.readAsText(file);
        } else if (file.name.endsWith('.docx')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const arrayBuffer = e.target.result;
                mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                    .then(result => {
                        textInput.value = result.value;
                        statusDiv.textContent = 'File loaded successfully.';
                        showNotification('File loaded successfully!', 'success');
                    })
                    .catch(err => {
                        console.error('Error parsing .docx file:', err);
                        statusDiv.textContent = 'Error: Could not read .docx file.';
                        showNotification('Error: Could not read .docx file.', 'error');
                    });
            };
            reader.readAsArrayBuffer(file);
        } else {
            statusDiv.textContent = `Error: Unsupported file type (${file.type}). Please use .txt or .docx.`;
            showNotification(`Unsupported file type: ${file.type}`, 'error');
        }
    }

    /**
     * Check if user has admin authentication
     * @returns {boolean} True if user is authenticated admin
     */
    function isAuthenticatedAdmin() {
        const sessionToken = localStorage.getItem('sessionToken');
        const userRole = localStorage.getItem('userRole');
        return sessionToken && userRole === 'admin';
    }

    /**
     * OpenRouter AI Integration for Book Tools
     */
    class BookAIProcessor {
        constructor() {
            this.apiKey = '';
            this.model = '';
            this.baseUrl = '';
        }

        /**
         * Initialize AI configuration from Supabase
         */
        async initConfig() {
            try {
                // Ensure Supabase is properly initialized
                if (typeof initSupabaseClient === 'function') {
                    // This will initialize the Supabase client if needed
                    const supabase = initSupabaseClient();
                    if (!supabase) {
                        console.warn('Supabase client could not be initialized');
                    }
                }
                
                // Try to get configuration from Supabase
                if (typeof getApiConfig === 'function') {
                    const result = await getApiConfig('book', 'OpenRouter');
                    
                    if (result.success) {
                        this.apiKey = result.data.api_key;
                        this.model = result.data.model_name;
                        this.baseUrl = result.data.api_endpoint;
                        return true;
                    } else {
                        console.warn('No API configuration found in Supabase:', result.error);
                        // Fallback to localStorage for backward compatibility
                        this.apiKey = localStorage.getItem('book-tools-api-key') || '';
                        this.model = localStorage.getItem('book-tools-model') || 'openai/gpt-oss-20b:free';
                        this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
                        return false;
                    }
                } else {
                    // Fallback to localStorage if Supabase functions are not available
                    console.warn('Supabase API functions not available, using localStorage');
                    this.apiKey = localStorage.getItem('book-tools-api-key') || '';
                    this.model = localStorage.getItem('book-tools-model') || 'openai/gpt-oss-20b:free';
                    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
                    return false;
                }
            } catch (error) {
                console.error('Error initializing AI config:', error);
                // Fallback to localStorage for backward compatibility
                this.apiKey = localStorage.getItem('book-tools-api-key') || '';
                this.model = localStorage.getItem('book-tools-model') || 'openai/gpt-oss-20b:free';
                this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
                return false;
            }
        }

        /**
         * Test AI connection and update status
         */
        async testConnection() {
            // Initialize config if not already done
            if (!this.apiKey) {
                await this.initConfig();
            }
            
            if (!this.apiKey) {
                this.updateStatus('error', 'API key not configured');
                return false;
            }

            try {
                this.updateStatus('testing', 'Testing connection...');
                const response = await this.callOpenRouter('You are a helpful assistant.', 'Hello, just testing the connection.');
                
                if (response && !response.startsWith('Error:')) {
                    this.updateStatus('success', 'Connection successful!');
                    return true;
                } else {
                    this.updateStatus('error', 'No valid response from AI');
                    return false;
                }
            } catch (error) {
                console.error('AI Test Error:', error);
                let errorMessage = `Connection failed: ${error.message}`;
                
                // Provide specific guidance for OpenRouter privacy policy errors
                if (error.message.includes('data policy') || error.message.includes('privacy')) {
                    errorMessage += ' - Please check your OpenRouter privacy settings.';
                }
                
                this.updateStatus('error', errorMessage);
                return false;
            }
        }

        /**
         * Update AI status display
         */
        updateStatus(type, message) {
            const statusElement = document.getElementById('ai-config-status');
            if (!statusElement) return;
            
            statusElement.className = `ai-status ${type}`;
            
            const icons = {
                idle: '⚪',
                testing: '🔄',
                success: '✅',
                error: '❌'
            };
            
            statusElement.innerHTML = `${icons[type] || '⚪'} ${message}`;
        }

        /**
         * Save configuration to localStorage (deprecated - now handled by Supabase)
         */
        saveConfig(apiKey, model) {
            console.warn('saveConfig is deprecated. Use Supabase API configuration instead.');
        }

        /**
         * A reusable function to call the OpenRouter API with dynamic model
         * @param {string} systemPrompt The system prompt to guide the AI.
         * @param {string} userContent The user's text to be processed.
         * @returns {Promise<string>} The AI's response content or an error message.
         */
        async callOpenRouter(systemPrompt, userContent) {
            // Initialize config if not already done
            if (!this.apiKey) {
                await this.initConfig();
            }
            
            if (!this.apiKey) {
                return "Error: API Key not set. Please configure it in the admin panel.";
            }

            try {
                // Track AI requests
                const currentRequests = parseInt(localStorage.getItem('book-tools-ai-requests') || '0');
                localStorage.setItem('book-tools-ai-requests', (currentRequests + 1).toString());

                const response = await fetch(this.baseUrl, {
                    method: "POST",
                    headers: {
                      "Authorization": `Bearer ${this.apiKey}`,
                      "Content-Type": "application/json",
                      "HTTP-Referer": window.location.origin,
                      "X-Title": "Smart Campus Book Tools"
                    },
                    body: JSON.stringify({
                      "model": this.model,
                      "messages": [
                        { "role": "system", "content": systemPrompt },
                        { "role": "user", "content": userContent }
                      ],
                      "temperature": 0.7,
                      "max_tokens": 3000
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                    
                    // Handle specific OpenRouter errors
                    if (errorData.error?.message) {
                        errorMessage = errorData.error.message;
                        
                        // Provide specific guidance for privacy policy errors
                        if (errorMessage.includes('data policy') || errorMessage.includes('privacy')) {
                            errorMessage += '\n\nPlease visit https://openrouter.ai/settings/privacy to configure your privacy settings for free models.';
                        }
                    }
                    
                    console.error("API Error:", errorData);
                    return `API Error: ${errorMessage}`;
                }

                const data = await response.json();
                return data.choices[0].message.content;

            } catch (error) {
                console.error("Network or fetch error:", error);
                
                // Provide user-friendly error messages
                let userMessage = "Failed to process your text. ";
                
                if (error.message.includes('429') || error.message.includes('rate limit')) {
                    userMessage += 'The AI is busy right now. Please wait a few seconds and try again.';
                } else if (error.message.includes('network') || error.message.includes('fetch')) {
                    userMessage += 'Network error. Please check your internet connection and try again.';
                } else {
                    userMessage += 'An unexpected error occurred. Please try again later.';
                }
                
                return userMessage;
            }
        }
    }

    const aiProcessor = new BookAIProcessor();

    // Initialize AI configuration when the page loads
    document.addEventListener('DOMContentLoaded', async function() {
        await aiProcessor.initConfig();
        // Test connection after a short delay to allow UI to load
        setTimeout(() => {
            aiProcessor.testConnection();
        }, 1000);
    });

    summarizeBtn.addEventListener('click', async () => {
        const text = textInput.value;
        if (text.trim() === '') {
            showNotification('Please enter some text to summarize.', 'warning');
            return;
        }
        statusDiv.textContent = 'Summarizing...';
        outputTextDiv.textContent = ''; // Clear previous output

        // Show loading state
        outputTextDiv.innerHTML = '<div class="loading-state"><div class="loading-icon">🧠</div><div class="loading-text">AI is summarizing your text...</div></div>';

        // Ensure AI processor is initialized with Supabase config
        await aiProcessor.initConfig();
        
        const systemPrompt = "You are an expert text summarizer. Take the user's text and provide a concise summary formatted as a list of bullet points.";
        const result = await aiProcessor.callOpenRouter(systemPrompt, text);
        
        // Check if result is an error message
        if (result.startsWith('Failed to process') || result.startsWith('Error:') || result.startsWith('API Error:')) {
            outputTextDiv.innerHTML = `<div class="error-state"><div class="error-icon">❌</div><div class="error-text">${result}</div></div>`;
            statusDiv.textContent = 'Summarization failed.';
            showNotification(result, 'error');
            return;
        }

        // Add fade-in animation
        outputTextDiv.innerHTML = `<div class="fade-in">${result}</div>`;
        statusDiv.textContent = 'Summary complete.';
        showNotification('Text summarized successfully!', 'success');
        
        // Track operation
        trackOperation('summarize');
    });

    expandBtn.addEventListener('click', async () => {
        const text = textInput.value;
        if (text.trim() === '') {
            showNotification('Please enter some text to expand.', 'warning');
            return;
        }
        statusDiv.textContent = 'Expanding...';
        outputTextDiv.textContent = ''; // Clear previous output

        // Show loading state
        outputTextDiv.innerHTML = '<div class="loading-state"><div class="loading-icon">📈</div><div class="loading-text">AI is expanding your text...</div></div>';

        // Ensure AI processor is initialized with Supabase config
        await aiProcessor.initConfig();
        
        const systemPrompt = "You are a text expander. Take the user's text and elaborate on it, providing a more detailed and descriptive version.";
        const result = await aiProcessor.callOpenRouter(systemPrompt, text);
        
        // Check if result is an error message
        if (result.startsWith('Failed to process') || result.startsWith('Error:') || result.startsWith('API Error:')) {
            outputTextDiv.innerHTML = `<div class="error-state"><div class="error-icon">❌</div><div class="error-text">${result}</div></div>`;
            statusDiv.textContent = 'Expansion failed.';
            showNotification(result, 'error');
            return;
        }

        // Add fade-in animation
        outputTextDiv.innerHTML = `<div class="fade-in">${result}</div>`;
        statusDiv.textContent = 'Expansion complete.';
        showNotification('Text expanded successfully!', 'success');
        
        // Track operation
        trackOperation('expand');
    });

    rephraseBtn.addEventListener('click', async () => {
        const text = textInput.value;
        if (text.trim() === '') {
            showNotification('Please enter some text to rephrase.', 'warning');
            return;
        }
        statusDiv.textContent = 'Rephrasing...';
        outputTextDiv.textContent = '';

        // Show loading state
        outputTextDiv.innerHTML = '<div class="loading-state"><div class="loading-icon">🔄</div><div class="loading-text">AI is rephrasing your text...</div></div>';

        // Ensure AI processor is initialized with Supabase config
        await aiProcessor.initConfig();
        
        const systemPrompt = "You are a rephrasing tool. Rewrite the user's text in a different style or with different vocabulary while preserving the core meaning.";
        const result = await aiProcessor.callOpenRouter(systemPrompt, text);
        
        // Check if result is an error message
        if (result.startsWith('Failed to process') || result.startsWith('Error:') || result.startsWith('API Error:')) {
            outputTextDiv.innerHTML = `<div class="error-state"><div class="error-icon">❌</div><div class="error-text">${result}</div></div>`;
            statusDiv.textContent = 'Rephrasing failed.';
            showNotification(result, 'error');
            return;
        }

        // Add fade-in animation
        outputTextDiv.innerHTML = `<div class="fade-in">${result}</div>`;
        statusDiv.textContent = 'Rephrasing complete.';
        showNotification('Text rephrased successfully!', 'success');
        
        // Track operation
        trackOperation('rephrase');
    });

    exportBtn.addEventListener('click', () => {
        const outputText = outputTextDiv.textContent;
        if (outputText.trim() === '') {
            showNotification('There is no output to export.', 'warning');
            return;
        }

        const blob = new Blob([outputText], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'ai_output.txt');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification('Output exported successfully!', 'success');
    });

    copyBtn.addEventListener('click', () => {
        const outputText = outputTextDiv.textContent;
        if (outputText.trim() === '') {
            showNotification('There is no output to copy.', 'warning');
            return;
        }

        navigator.clipboard.writeText(outputText).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✅ Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
            showNotification('Output copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            showNotification('Failed to copy text.', 'error');
        });
    });

    speakBtn.addEventListener('click', () => {
        const text = outputTextDiv.textContent || textInput.value;
        if (text.trim() === '') {
            showNotification('Nothing to speak.', 'warning');
            return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
        statusDiv.textContent = 'Speaking...';
        utterance.onend = () => {
            statusDiv.textContent = 'Speaking completed.';
        };
        showNotification('Text to speech started.', 'info');
    });

    stopBtn.addEventListener('click', () => {
        speechSynthesis.cancel();
        statusDiv.textContent = 'Speaking stopped.';
        showNotification('Text to speech stopped.', 'info');
    });

    // --- Admin View Logic ---
    
    if (isAdminView) {
        console.log('Book: Admin view detected, initializing admin interface');
        
        userView.style.display = 'none';
        adminView.style.display = 'block';
        document.querySelector('.back-link').href = '../../admin.html';
        document.querySelector('h1').textContent = 'Manage Book Tools';
        
        // Ensure URL parameters persist
        const currentUrl = new URL(window.location);
        if (!currentUrl.searchParams.has('view')) {
            currentUrl.searchParams.set('view', 'admin');
            window.history.replaceState(null, '', currentUrl.toString());
        }
        
        renderAnalytics();
        
        console.log('Book: Admin view initialization complete');
    }

    /**
     * Track operation usage for analytics
     */
    function trackOperation(operation) {
        const usage = JSON.parse(localStorage.getItem('book-tools-usage')) || {};
        usage[operation] = (usage[operation] || 0) + 1;
        localStorage.setItem('book-tools-usage', JSON.stringify(usage));
        
        const totalOps = parseInt(localStorage.getItem('book-tools-total-operations') || '0');
        localStorage.setItem('book-tools-total-operations', (totalOps + 1).toString());
    }

    /**
     * Render analytics dashboard
     */
    function renderAnalytics() {
        const usage = JSON.parse(localStorage.getItem('book-tools-usage')) || {};
        const totalOperations = localStorage.getItem('book-tools-total-operations') || '0';
        const aiRequests = localStorage.getItem('book-tools-ai-requests') || '0';
        
        // Update stat cards
        const totalOpsEl = document.getElementById('total-operations');
        const popularOpEl = document.getElementById('popular-operation');
        const aiRequestsEl = document.getElementById('ai-requests');
        
        if (totalOpsEl) totalOpsEl.textContent = totalOperations;
        if (aiRequestsEl) aiRequestsEl.textContent = aiRequests;
        
        // Find most popular operation
        const mostPopular = Object.keys(usage).reduce((a, b) => usage[a] > usage[b] ? a : b, 'Summarize');
        if (popularOpEl) popularOpEl.textContent = mostPopular.charAt(0).toUpperCase() + mostPopular.slice(1);
    }

    function renderSummariesTable() {
        const summariesTableBody = document.querySelector('#summaries-table tbody');
        if (!summariesTableBody) return;

        let savedSummaries = JSON.parse(localStorage.getItem('saved-summaries')) || [];
        summariesTableBody.innerHTML = '';

        savedSummaries.forEach(summary => {
            const row = summariesTableBody.insertRow();
            row.innerHTML = `
                <td>${sanitizeInput(summary.username)}</td>
                <td>${sanitizeInput(summary.text.substring(0, 50))}...</td>
                <td>${summary.savedAt}</td>
                <td><button class="action-btn delete-btn" data-id="${summary.id}">Delete</button></td>
            `;
        });
    }

    // --- Legacy API Key Logic (for backward compatibility) ---
    const apiKeyForm = document.getElementById('api-key-form');

    if (apiKeyForm) {
        // Hide legacy form if new form exists
        const newConfigForm = document.getElementById('ai-config-form');
        if (newConfigForm) {
            apiKeyForm.style.display = 'none';
        } else {
            apiKeyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const apiKey = document.getElementById('api-key-input').value;
                const model = document.getElementById('model-input').value || 'openai/gpt-oss-20b:free';
                
                if (apiKey) {
                    localStorage.setItem('book-tools-api-key', apiKey);
                    localStorage.setItem('book-tools-model', model);
                    alert('API Key saved successfully!');
                    apiKeyForm.reset();
                } else {
                    alert('Please enter an API key.');
                }
            });
        }
    }

    /**
     * Sanitize user input to prevent XSS
     * @param {string} input - User input to sanitize
     * @returns {string} Sanitized input
     */
    function sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }
});