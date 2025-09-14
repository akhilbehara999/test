document.addEventListener('DOMContentLoaded', () => {
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
     * Redirect to admin panel with authentication check
     */
    function redirectToAdminPanel() {
        if (isAuthenticatedAdmin()) {
            window.location.href = 'code-explainer.html?view=admin';
        } else {
            // Redirect to login page with return URL
            window.location.href = '../../index.html?returnUrl=' + encodeURIComponent('modules/code-explainer/code-explainer.html?view=admin');
        }
    }

    // --- DOM Elements ---
    const userView = document.getElementById('user-view');
    const adminView = document.getElementById('admin-view');
    const languageSelect = document.getElementById('language-select');
    const codeInput = document.getElementById('code-input');
    const analyzeBtn = document.getElementById('analyze-btn');
    const explainBtn = document.getElementById('explain-btn');
    const outputBtn = document.getElementById('output-btn');
    const resultOutput = document.getElementById('result-output');
    const analysisOutput = document.getElementById('analysis-output');
    const explanationOutput = document.getElementById('explanation-output');
    const learningModeToggle = document.getElementById('learning-mode-toggle');
    const aiStatus = document.getElementById('ai-status');
    const aiConfigStatus = document.getElementById('ai-config-status');

    // Tab management
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Result actions
    const copyResultBtn = document.getElementById('copy-result-btn');
    const clearResultBtn = document.getElementById('clear-result-btn');

    // --- Admin View Logic ---
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminView = urlParams.get('view') === 'admin';

    let currentActiveTab = 'output';
    let isProcessing = false;

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

    /**
     * Simple bar chart drawer for analytics
     * @param {string} canvasId - Canvas element ID
     * @param {Object} data - Chart data with labels and values
     * @param {Object} options - Chart options
     */
    function drawBarChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const { labels, values } = data;
        const { barColor = '#48ca9b' } = options;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (values.length === 0) return;
        
        // Calculate dimensions
        const padding = 40;
        const chartWidth = canvas.width - (padding * 2);
        const chartHeight = canvas.height - (padding * 2);
        const barWidth = chartWidth / labels.length;
        const maxValue = Math.max(...values) || 1;
        
        // Draw bars
        values.forEach((value, index) => {
            const barHeight = (value / maxValue) * chartHeight;
            const x = padding + (index * barWidth) + (barWidth * 0.1);
            const y = canvas.height - padding - barHeight;
            const width = barWidth * 0.8;
            
            // Draw bar
            ctx.fillStyle = barColor;
            ctx.fillRect(x, y, width, barHeight);
            
            // Draw label
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(labels[index], x + width/2, canvas.height - padding + 15);
            
            // Draw value
            ctx.fillText(value.toString(), x + width/2, y - 5);
        });
    }

    /**
     * OpenRouter AI Integration for Code Analysis
     */
    class CodeAIAnalyzer {
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
                    const result = await getApiConfig('code-explainer', 'OpenRouter');
                    
                    if (result.success) {
                        this.apiKey = result.data.api_key;
                        this.model = result.data.model_name;
                        this.baseUrl = result.data.api_endpoint;
                        return true;
                    } else {
                        console.warn('No API configuration found in Supabase:', result.error);
                        // Fallback to localStorage for backward compatibility
                        this.apiKey = localStorage.getItem('code-explainer-api-key') || '';
                        this.model = localStorage.getItem('code-explainer-model') || 'openai/gpt-oss-20b:free';
                        this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
                        return false;
                    }
                } else {
                    // Fallback to localStorage if Supabase functions are not available
                    console.warn('Supabase API functions not available, using localStorage');
                    this.apiKey = localStorage.getItem('code-explainer-api-key') || '';
                    this.model = localStorage.getItem('code-explainer-model') || 'openai/gpt-oss-20b:free';
                    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
                    return false;
                }
            } catch (error) {
                console.error('Error initializing AI config:', error);
                // Fallback to localStorage for backward compatibility
                this.apiKey = localStorage.getItem('code-explainer-api-key') || '';
                this.model = localStorage.getItem('code-explainer-model') || 'openai/gpt-oss-20b:free';
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
                const response = await this.analyzeCode('console.log("test");', 'javascript', 'analysis');
                
                if (response && response.length > 0) {
                    this.updateStatus('success', 'Connection successful!');
                    return true;
                } else {
                    this.updateStatus('error', 'No response from AI');
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
            if (!aiStatus) return;
            
            aiStatus.className = `ai-status ${type}`;
            
            const icons = {
                idle: '⚪',
                testing: '🔄',
                success: '✅',
                error: '❌'
            };
            
            aiStatus.innerHTML = `${icons[type] || '⚪'} ${message}`;
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
         * @param {string} mode The mode of analysis (analysis, explanation, output).
         * @returns {Promise<string>} The AI's response content or an error message.
         */
        async analyzeCode(userContent, language, mode) {
            // Initialize config if not already done
            if (!this.apiKey) {
                await this.initConfig();
            }
            
            if (!this.apiKey) {
                return "Error: API Key not set. Please configure it in the admin panel.";
            }

            try {
                // Track AI requests
                const currentRequests = parseInt(localStorage.getItem('code-explainer-ai-requests') || '0');
                localStorage.setItem('code-explainer-ai-requests', (currentRequests + 1).toString());

                // Mode-specific system prompts
                let systemPrompt = "";
                switch (mode) {
                    case 'analysis':
                        systemPrompt = `You are a code analysis expert. Analyze the following ${language} code for syntax errors, best practices, and potential improvements. Provide your response in a clear, structured format with bullet points.`;
                        break;
                    case 'explanation':
                        systemPrompt = `You are a code explanation expert. Explain the following ${language} code step by step in a beginner-friendly way. Break down complex concepts and explain the logic flow.`;
                        break;
                    case 'output':
                        systemPrompt = `You are a code execution expert. Predict the output of the following ${language} code and explain what it does. If there are any errors, explain them as well.`;
                        break;
                    default:
                        systemPrompt = `You are a helpful coding assistant. Analyze the following ${language} code.`;
                }

                const response = await fetch(this.baseUrl, {
                    method: "POST",
                    headers: {
                      "Authorization": `Bearer ${this.apiKey}`,
                      "Content-Type": "application/json",
                      "HTTP-Referer": window.location.origin,
                      "X-Title": "Smart Campus Code Explainer"
                    },
                    body: JSON.stringify({
                      "model": this.model,
                      "messages": [
                        { "role": "system", "content": systemPrompt },
                        { "role": "user", "content": userContent }
                      ],
                      "temperature": 0.7,
                      "max_tokens": 2000
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
                let userMessage = `Failed to generate ${mode} for your code. `;
                
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

    const aiAnalyzer = new CodeAIAnalyzer();

    // Initialize AI configuration when the page loads
    document.addEventListener('DOMContentLoaded', async function() {
        await aiAnalyzer.initConfig();
        // Test connection after a short delay to allow UI to load
        setTimeout(() => {
            aiAnalyzer.testConnection();
        }, 1000);
    });

    // Show model restriction notice for non-admin users
    if (!isAdminView && !isAuthenticatedAdmin()) {
        showModelRestrictionNotice();
    }

    /**
     * Show model restriction notice for non-admin users
     */
    function showModelRestrictionNotice() {
        const aiStatus = document.getElementById('ai-status');
        if (aiStatus && !isAuthenticatedAdmin()) {
            // Add restriction notice
            const notice = document.createElement('div');
            notice.className = 'model-restriction-notice';
            notice.innerHTML = `
                <span class="notice-icon">⚠️</span>
                <span>Students are limited to free AI models only. Premium models available for admin use.</span>
            `;
            
            const explainerContainer = document.querySelector('.explainer-container');
            if (explainerContainer) {
                explainerContainer.insertBefore(notice, explainerContainer.firstChild);
            }
            
            // Update AI status to show restriction
            aiStatus.classList.add('restricted');
            aiStatus.innerHTML = '⚠️ Free Models Only';
        }
    }

    if (isAdminView) {
        // Code Explainer: Admin view detected, initializing admin interface
        
        userView.style.display = 'none';
        adminView.style.display = 'block';
        document.querySelector('.back-link').href = '../../admin.html';
        document.querySelector('h1').textContent = 'Manage Code Explainer';
        
        // Ensure URL parameters persist
        const currentUrl = new URL(window.location);
        if (!currentUrl.searchParams.has('view')) {
            currentUrl.searchParams.set('view', 'admin');
            window.history.replaceState(null, '', currentUrl.toString());
        }
        
        renderAnalytics();
        
        // Code Explainer: Admin view initialization complete
    }

    /**
     * Enhanced analytics with AI tracking
     */
    function renderAnalytics() {
        const usage = JSON.parse(localStorage.getItem('code-explainer-usage')) || {};
        const totalAnalyses = localStorage.getItem('code-explainer-total-analyses') || '0';
        const aiRequests = localStorage.getItem('code-explainer-ai-requests') || '0';
        
        // Update stat cards
        const totalAnalysisEl = document.getElementById('total-analysis');
        const popularLanguageEl = document.getElementById('popular-language');
        const aiRequestsEl = document.getElementById('ai-requests');
        
        if (totalAnalysisEl) totalAnalysisEl.textContent = totalAnalyses;
        if (aiRequestsEl) aiRequestsEl.textContent = aiRequests;
        
        // Find most popular language
        const mostPopular = Object.keys(usage).reduce((a, b) => usage[a] > usage[b] ? a : b, 'JavaScript');
        if (popularLanguageEl) popularLanguageEl.textContent = mostPopular;
        
        // Render chart
        const chartData = {
            labels: Object.keys(usage),
            values: Object.values(usage)
        };

        if (chartData.labels.length === 0) {
            chartData.labels = ['No Data'];
            chartData.values = [0];
        }

        drawBarChart('language-chart', chartData, { barColor: '#48ca9b' });
    }

    // --- Template Form Logic ---
    const templateForm = document.getElementById('template-form');
    if (templateForm) {
        templateForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newTemplate = {
                id: Date.now(),
                title: document.getElementById('template-title').value,
                language: document.getElementById('template-language').value,
                code: document.getElementById('template-code').value
            };

            const templates = JSON.parse(localStorage.getItem('code-templates')) || [];
            templates.push(newTemplate);
            localStorage.setItem('code-templates', JSON.stringify(templates));

            showNotification('Template saved successfully!', 'success');
            templateForm.reset();
        });
    }

    /**
     * Perform AI analysis with comprehensive error handling
     */
    async function performAnalysis(mode) {
        // 🚀 Starting ${mode} analysis...
        
        const code = codeInput?.value?.trim();
        const language = languageSelect?.value;

        // 📝 Code length: ${code?.length || 0} characters
        // 🗺 Language: ${language}

        if (!code) {
            // ⚠️ No code provided for analysis
            showNotification('Please enter some code to analyze.', 'warning');
            codeInput?.focus();
            return;
        }

        // Check if API key is configured by initializing the AI analyzer
        await aiAnalyzer.initConfig();
        if (!aiAnalyzer.apiKey || aiAnalyzer.apiKey.trim() === '') {
            // 🚨 Showing API configuration modal
            showErrorModal();
            return;
        }

        if (isProcessing) {
            // ⏳ Analysis already in progress, skipping...
            return;
        }
        
        isProcessing = true;
        // 🔄 Processing started

        try {
            // Update button states
            const activeBtn = mode === 'analysis' ? analyzeBtn : mode === 'explanation' ? explainBtn : outputBtn;
            // 🔘 Updating button state for: ${mode}
            
            activeBtn.disabled = true;
            activeBtn.innerHTML = `<span class="btn-icon">🔄</span><div class="btn-content"><div class="btn-title">Processing...</div></div>`;

            // Switch to appropriate tab
            const targetTab = mode === 'analysis' ? 'analysis' : mode === 'explanation' ? 'explanation' : 'output';
            // 📋 Switching to tab: ${targetTab}
            switchTab(targetTab);

            // Show loading state
            const outputElement = mode === 'analysis' ? analysisOutput : mode === 'explanation' ? explanationOutput : resultOutput;
            // 📺 Output element found: ${outputElement ? '✅' : '❌'}
            
            outputElement.innerHTML = '<div class="loading-state"><div class="loading-icon">🧠</div><div class="loading-text">AI is analyzing your code...</div></div>';

            // Update AI status
            // 🤖 Updating AI status...
            aiAnalyzer.updateStatus('testing', `Performing ${mode}...`);

            // Perform AI analysis
            // 💬 Calling AI analysis...
            const result = await aiAnalyzer.analyzeCode(code, language, mode);
            // ✅ AI analysis completed, result length: ${result?.length || 0}

            // Check if result is an error message
            if (result.startsWith('Failed to generate') || result.startsWith('Error:') || result.startsWith('API Error:')) {
                outputElement.innerHTML = `<div class="error-state"><div class="error-icon">❌</div><div class="error-text">${result}</div></div>`;
                aiAnalyzer.updateStatus('error', `${mode} failed`);
                showNotification(result, 'error');
                return;
            }

            // Display results with typewriter effect
            outputElement.innerHTML = '';
            // ⌨️ Starting typewriter effect...
            await typewriterEffect(outputElement, result);
            // ✅ Typewriter effect completed

            aiAnalyzer.updateStatus('success', `${mode} completed!`);
            showNotification(`${mode.charAt(0).toUpperCase() + mode.slice(1)} completed successfully!`, 'success');

        } catch (error) {
            // ❌ ${mode} Error: ${error}
            console.error(`Code ${mode} Error:`, error);
            
            // Provide user-friendly error messages based on the mode
            let userMessage = `Failed to generate ${mode} for your code. `;
            
            if (error.message.includes('429') || error.message.includes('rate limit')) {
                userMessage += 'The AI is busy right now. Please wait a few seconds and try again.';
            } else if (error.message.includes('API key')) {
                userMessage += 'Please check your API key configuration in the admin panel.';
            } else if (error.message.includes('privacy') || error.message.includes('data policy')) {
                userMessage += 'Please check your OpenRouter privacy settings.';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                userMessage += 'Network error. Please check your internet connection and try again.';
            } else {
                userMessage += 'An unexpected error occurred. Please try again later.';
            }
            
            const outputElement = mode === 'analysis' ? analysisOutput : mode === 'explanation' ? explanationOutput : resultOutput;
            outputElement.innerHTML = `<div class="error-state"><div class="error-icon">❌</div><div class="error-text">${userMessage}</div></div>`;
            aiAnalyzer.updateStatus('error', `${mode} failed: ${error.message}`);
            showNotification(userMessage, 'error');
        } finally {
            // 🏁 Cleaning up and resetting button states...
            
            // Reset button states
            const activeBtn = mode === 'analysis' ? analyzeBtn : mode === 'explanation' ? explainBtn : outputBtn;
            activeBtn.disabled = false;
            
            const buttonConfigs = {
                'analysis': { icon: '🔍', title: 'Analysis', subtitle: 'Syntax & Error Check' },
                'explanation': { icon: '🧠', title: 'Explainer', subtitle: 'Step-by-Step Breakdown' },
                'output': { icon: '⚡', title: 'Output', subtitle: 'Execution & Trace' }
            };
            
            const config = buttonConfigs[mode];
            activeBtn.innerHTML = `<span class="btn-icon">${config.icon}</span><div class="btn-content"><div class="btn-title">${config.title}</div><div class="btn-subtitle">${config.subtitle}</div></div>`;
            
            isProcessing = false;
            // ✅ Analysis complete and cleanup finished
        }
    }

    // --- Main Analysis Functions ---
    if (analyzeBtn) {
        // ✅ Code Explainer: Analyze button found and event listener attached
        analyzeBtn.addEventListener('click', async () => {
            // 🔍 Code Explainer: Analyze button clicked
            await performAnalysis('analysis');
        });
    } else {
        // ❌ Code Explainer: Analyze button not found!
    }

    if (explainBtn) {
        // ✅ Code Explainer: Explain button found and event listener attached
        explainBtn.addEventListener('click', async () => {
            // 🧠 Code Explainer: Explain button clicked
            await performAnalysis('explanation');
        });
    } else {
        // ❌ Code Explainer: Explain button not found!
    }

    if (outputBtn) {
        // ✅ Code Explainer: Output button found and event listener attached
        outputBtn.addEventListener('click', async () => {
            // ⚡ Code Explainer: Output button clicked
            await performAnalysis('output');
        });
    } else {
        // ❌ Code Explainer: Output button not found!
    }

    // --- Tab Switching Logic ---
    function switchTab(tabName) {
        // Update tab buttons
        tabBtns.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update tab content
        tabContents.forEach(content => {
            if (content.dataset.tab === tabName) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });

        currentActiveTab = tabName;
    }

    // Add event listeners to tab buttons
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    // --- Result Actions ---
    if (copyResultBtn) {
        copyResultBtn.addEventListener('click', () => {
            const activeTabContent = document.querySelector('.tab-content.active');
            if (!activeTabContent) {
                showNotification('No content to copy.', 'warning');
                return;
            }

            const textToCopy = activeTabContent.textContent.trim();
            if (!textToCopy) {
                showNotification('No content to copy.', 'warning');
                return;
            }

            navigator.clipboard.writeText(textToCopy).then(() => {
                showNotification('Content copied to clipboard!', 'success');
                // Update button text temporarily
                const originalText = copyResultBtn.innerHTML;
                copyResultBtn.innerHTML = '✅ Copied!';
                setTimeout(() => {
                    copyResultBtn.innerHTML = originalText;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                showNotification('Failed to copy content.', 'error');
            });
        });
    }

    if (clearResultBtn) {
        clearResultBtn.addEventListener('click', () => {
            // Clear all output areas
            if (resultOutput) resultOutput.innerHTML = '<div class="empty-state"><div class="empty-icon">💻</div><div class="empty-text">Ready to analyze your code</div></div>';
            if (analysisOutput) analysisOutput.innerHTML = '';
            if (explanationOutput) explanationOutput.innerHTML = '';
            
            // Reset to output tab
            switchTab('output');
            
            showNotification('Results cleared.', 'info');
        });
    }

    // --- Character Count ---
    if (codeInput) {
        const charCount = document.querySelector('.char-count');
        if (charCount) {
            codeInput.addEventListener('input', () => {
                charCount.textContent = `${codeInput.value.length} characters`;
            });
        }
    }

    // --- Learning Mode Toggle ---
    if (learningModeToggle) {
        learningModeToggle.addEventListener('change', () => {
            const isChecked = learningModeToggle.checked;
            localStorage.setItem('code-explainer-learning-mode', isChecked);
            showNotification(isChecked ? 'Learning mode enabled' : 'Learning mode disabled', 'info');
        });
        
        // Load saved state
        const savedState = localStorage.getItem('code-explainer-learning-mode') === 'true';
        learningModeToggle.checked = savedState;
    }

    // --- Error Modal Functions ---
    function showErrorModal() {
        const modal = document.getElementById('error-modal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    const closeErrorBtn = document.getElementById('close-error-btn');
    if (closeErrorBtn) {
        closeErrorBtn.addEventListener('click', () => {
            const modal = document.getElementById('error-modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    }

    const gotoAdminBtn = document.getElementById('goto-admin-btn');
    if (gotoAdminBtn) {
        gotoAdminBtn.addEventListener('click', redirectToAdminPanel);
    }

    // Close modal when clicking outside
    const errorModal = document.getElementById('error-modal');
    if (errorModal) {
        errorModal.addEventListener('click', (e) => {
            if (e.target === errorModal) {
                errorModal.classList.remove('active');
            }
        });
    }

    // --- Typewriter Effect ---
    async function typewriterEffect(element, text, speed = 20) {
        if (!element) return;
        
        element.innerHTML = '';
        let i = 0;
        
        // Add a blinking cursor
        element.style.borderRight = '2px solid var(--code-primary)';
        element.style.animation = 'blink 0.7s step-end infinite';
        
        return new Promise(resolve => {
            const type = () => {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    setTimeout(type, speed);
                } else {
                    // Make cursor solid after typing is done
                    setTimeout(() => {
                        element.style.animation = 'none';
                        element.style.borderRight = 'none';
                        resolve();
                    }, 500);
                }
            };
            
            type();
        });
    }

    // Add CSS for blink animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes blink {
            from, to { border-color: transparent; }
            50% { border-color: var(--code-primary); }
        }
    `;
    document.head.appendChild(style);
});