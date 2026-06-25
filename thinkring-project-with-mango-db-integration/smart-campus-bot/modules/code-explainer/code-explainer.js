document.addEventListener('DOMContentLoaded', () => {
    /**
     * Check if user has admin authentication
     * @returns {boolean} True if user is authenticated admin
     */
    function isAuthenticatedAdmin() {
        const sessionToken = localStorage.getItem('authToken');
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
            // We'll initialize these values when needed
            this.apiKey = '';
            this.model = '';
            this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
        }

        /**
         * Initialize AI configuration
         */
        async initConfig() {
            try {
                // Use the global AI configuration function
                const config = await getGlobalAIConfig();
                console.log('Code Explainer: Retrieved AI config');
                this.apiKey = config.codeExplainer.apiKey || '';
                this.model = config.codeExplainer.model || 'openai/gpt-3.5-turbo';
                // Don't log the actual API key to prevent exposure
                console.log('Code Explainer: Using API Key: ' + (this.apiKey ? 'YES' : 'NO'));
                console.log('Code Explainer: Using Model:', this.model);
                return !!this.apiKey;
            } catch (error) {
                console.error('Error initializing AI config:', error);
                // Fallback to localStorage
                this.apiKey = localStorage.getItem('code-explainer-api-key') || '';
                this.model = localStorage.getItem('code-explainer-model') || 'openai/gpt-3.5-turbo';
                return !!this.apiKey;
            }
        }

        /**
         * Test AI connection and update status
         */
        async testConnection() {
            const hasConfig = await this.initConfig();
            if (!hasConfig) {
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
                this.updateStatus('error', `Connection failed: ${error.message}`);
                return false;
            }
        }

        /**
         * Analyze code using OpenRouter AI with specific functions
         * @param {string} code - The code to analyze
         * @param {string} language - Programming language
         * @param {string} mode - 'analysis', 'explanation', or 'output'
         */
        async analyzeCode(code, language, mode) {
            const hasConfig = await this.initConfig();
            if (!hasConfig) {
                throw new Error('OpenRouter API key not configured');
            }

            const prompts = {
                analysis: `As an expert ${language} code analyzer, perform a comprehensive syntax and logic check on the following code:

\`\`\`${language}
${code}
\`\`\`

Provide:
1. **Syntax & Logic Check**: Scan for typos, missing semicolons, incorrect function names
2. **Error Highlighting**: Pinpoint exact lines with errors and explain what's wrong
3. **Variable & Import Validation**: Check for undefined variables or missing imports

Format your response with clear sections and line numbers where applicable.`,

                explanation: `As an expert ${language} teacher, provide a comprehensive step-by-step explanation of this code:

\`\`\`${language}
${code}
\`\`\`

Provide:
1. **Step-by-Step Breakdown**: Break code into logical chunks (loops, functions, conditionals)
2. **Algorithm Logic**: Describe the overall goal and algorithm used
3. **Concept Highlighting**: Identify and explain key programming concepts

Translate complex code into plain, easy-to-understand English. Make it educational and perfect for studying.`,

                output: `Execute the following ${language} code and provide ONLY the direct output that would be produced when the program runs:

\`\`\`${language}
${code}
\`\`\`

Provide ONLY the exact output that would be printed to the console or returned by the program. If there are syntax errors or runtime errors that would prevent the code from running, simply respond with "Error: [brief description of the error]". Do not provide any additional analysis, explanation, or trace information. Just the direct output.`
            };

            try {
                // Don't log the actual API key to prevent exposure
                console.log('Code Explainer: Making API call with model:', this.model);

                const response = await fetch(this.baseUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': window.location.origin,
                        'X-Title': 'Smart Campus Code Explainer'
                    },
                    body: JSON.stringify({
                        model: this.model,
                        messages: [
                            {
                                role: 'system',
                                content: 'You are an expert programming tutor.'
                            },
                            {
                                role: 'user',
                                content: prompts[mode]
                            }
                        ],
                        temperature: 0.5,
                        max_tokens: 3000
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
                }

                const data = await response.json();
                console.log('Code Explainer: API Response received');
                return data.choices[0].message.content;
            } catch (error) {
                console.error('AI Analysis Error:', error);
                throw error;
            }
        }

        /**
         * Update AI status indicator
         */
        updateStatus(type, message) {
            const statusElement = aiConfigStatus || aiStatus;
            if (!statusElement) return;
            
            statusElement.className = `ai-status ${type}`;
            
            const icons = {
                'success': '✅',
                'error': '❌', 
                'testing': '🔄',
                'idle': '🤖'
            };
            
            statusElement.innerHTML = `${icons[type] || ''} ${message}`;
        }

        /**
         * Save API configuration
         * @param {string} apiKey - OpenRouter API key
         * @param {string} model - AI model to use
         */
        saveConfig(apiKey, model) {
            this.apiKey = apiKey;
            this.model = model;
            localStorage.setItem('code-explainer-api-key', apiKey);
            localStorage.setItem('code-explainer-model', model);
        }

        /**
         * Log analytics usage
         */
        logAnalyticsUsage(language, mode) {
            // Log language usage
            let usage = JSON.parse(localStorage.getItem('code-explainer-usage')) || {};
            usage[language] = (usage[language] || 0) + 1;
            localStorage.setItem('code-explainer-usage', JSON.stringify(usage));

            // Log AI requests
            const currentRequests = parseInt(localStorage.getItem('code-explainer-ai-requests') || '0');
            localStorage.setItem('code-explainer-ai-requests', (currentRequests + 1).toString());

            // Log total analyses
            const currentAnalyses = parseInt(localStorage.getItem('code-explainer-total-analyses') || '0');
            localStorage.setItem('code-explainer-total-analyses', (currentAnalyses + 1).toString());
        }
    }

    const aiAnalyzer = new CodeAIAnalyzer();

    // Show model restriction notice for non-admin users
    if (!isAdminView && !isAuthenticatedAdmin()) {
        showModelRestrictionNotice();
    }

    /**
     * Show model restriction notice for non-admin users
     */
    function showModelRestrictionNotice() {
        const statusElement = aiConfigStatus || aiStatus;
        if (statusElement && !isAuthenticatedAdmin()) {
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
            statusElement.classList.add('restricted');
            statusElement.innerHTML = '⚠️ Free Models Only';
        }
    }

    if (isAdminView) {
        console.log('Code Explainer: Admin view detected, initializing admin interface');
        
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
        
        console.log('Code Explainer: Admin view initialization complete');
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

            alert('Template saved successfully!');
            templateForm.reset();
        });
    }

    /**
     * Perform AI analysis with comprehensive error handling
     */
    async function performAnalysis(mode) {
        console.log(`🚀 Starting ${mode} analysis...`);
        
        const code = codeInput?.value?.trim();
        const language = languageSelect?.value;

        console.log(`📝 Code length: ${code?.length || 0} characters`);
        console.log(`🗺 Language: ${language}`);

        if (!code) {
            console.warn('⚠️ No code provided for analysis');
            alert('Please enter some code to analyze.');
            codeInput?.focus();
            return;
        }

        // Check if API key is configured using the global configuration function
        let apiKey = '';
        try {
            const config = await getGlobalAIConfig();
            apiKey = config.codeExplainer.apiKey || '';
            console.log(`🔑 API Key configured: ${apiKey ? '✅ Yes' : '❌ No'}`);
        } catch (error) {
            console.error('Error getting AI config:', error);
            console.log('🚨 Showing API configuration modal');
            showErrorModal();
            return;
        }
        
        if (!apiKey || apiKey.trim() === '') {
            console.log('🚨 Showing API configuration modal');
            showErrorModal();
            return;
        }

        if (isProcessing) {
            console.warn('⏳ Analysis already in progress, skipping...');
            return;
        }
        
        isProcessing = true;
        console.log('🔄 Processing started');

        try {
            // Update button states
            const activeBtn = mode === 'analysis' ? analyzeBtn : mode === 'explanation' ? explainBtn : outputBtn;
            console.log(`🔘 Updating button state for: ${mode}`);
            
            activeBtn.disabled = true;
            activeBtn.innerHTML = `<span class="btn-icon">🔄</span><div class="btn-content"><div class="btn-title">Processing...</div></div>`;

            // Switch to appropriate tab
            const targetTab = mode === 'analysis' ? 'analysis' : mode === 'explanation' ? 'explanation' : 'output';
            console.log(`📋 Switching to tab: ${targetTab}`);
            switchTab(targetTab);

            // Show loading state
            const outputElement = mode === 'analysis' ? analysisOutput : mode === 'explanation' ? explanationOutput : resultOutput;
            console.log(`📺 Output element found: ${outputElement ? '✅' : '❌'}`);
            
            outputElement.innerHTML = '<div class="loading-state"><div class="loading-icon">🧠</div><div class="loading-text">AI is analyzing your code...</div></div>';

            // Update AI status
            console.log('🤖 Updating AI status...');
            aiAnalyzer.updateStatus('testing', `Performing ${mode}...`);

            // Perform AI analysis
            console.log('💬 Calling AI analysis...');
            const result = await aiAnalyzer.analyzeCode(code, language, mode);
            console.log(`✅ AI analysis completed, result length: ${result?.length || 0}`);

            // Display results with typewriter effect
            outputElement.innerHTML = '';
            console.log('⌨️ Starting typewriter effect...');
            await typewriterEffect(outputElement, result);
            console.log('✅ Typewriter effect completed');

            aiAnalyzer.updateStatus('success', `${mode} completed!`);

        } catch (error) {
            console.error(`❌ ${mode} Error:`, error);
            const outputElement = mode === 'analysis' ? analysisOutput : mode === 'explanation' ? explanationOutput : resultOutput;
            outputElement.innerHTML = `<div class="error-state"><div class="error-icon">❌</div><div class="error-text">Error: ${error.message}</div></div>`;
            aiAnalyzer.updateStatus('error', `${mode} failed: ${error.message}`);
        } finally {
            console.log('🏁 Cleaning up and resetting button states...');
            
            // Reset button states
            const activeBtn = mode === 'analysis' ? analyzeBtn : mode === 'explanation' ? explainBtn : outputBtn;
            activeBtn.disabled = false;
            
            const buttonConfigs = {
                'analysis': { icon: '🔍', title: 'Analysis', subtitle: 'Syntax & Error Check' },
                'explanation': { icon: '🧠', title: 'Explainer', subtitle: 'Step-by-Step Breakdown' },
                'output': { icon: '⚡', title: 'Output', subtitle: 'Direct Program Output' }
            };
            
            const config = buttonConfigs[mode];
            activeBtn.innerHTML = `<span class="btn-icon">${config.icon}</span><div class="btn-content"><div class="btn-title">${config.title}</div><div class="btn-subtitle">${config.subtitle}</div></div>`;
            
            isProcessing = false;
            console.log('✅ Analysis complete and cleanup finished');
        }
    }

    // --- Main Analysis Functions ---
    if (analyzeBtn) {
        console.log('✅ Code Explainer: Analyze button found and event listener attached');
        analyzeBtn.addEventListener('click', async () => {
            console.log('🔍 Code Explainer: Analyze button clicked');
            await performAnalysis('analysis');
        });
    } else {
        console.error('❌ Code Explainer: Analyze button not found!');
    }

    if (explainBtn) {
        console.log('✅ Code Explainer: Explain button found and event listener attached');
        explainBtn.addEventListener('click', async () => {
            console.log('🧠 Code Explainer: Explain button clicked');
            await performAnalysis('explanation');
        });
    } else {
        console.error('❌ Code Explainer: Explain button not found!');
    }

    if (outputBtn) {
        console.log('✅ Code Explainer: Output button found and event listener attached');
        outputBtn.addEventListener('click', async () => {
            console.log('⚡ Code Explainer: Output button clicked');
            await performAnalysis('output');
        });
    } else {
        console.error('❌ Code Explainer: Output button not found!');
    }

    // Debug: Check if all required elements are found
    console.log('🔧 Code Explainer Debug Info:');
    console.log('  - codeInput:', codeInput ? '✅ Found' : '❌ Missing');
    console.log('  - languageSelect:', languageSelect ? '✅ Found' : '❌ Missing');
    console.log('  - aiAnalyzer:', typeof aiAnalyzer !== 'undefined' ? '✅ Created' : '❌ Missing');
    console.log('  - performAnalysis function:', typeof performAnalysis === 'function' ? '✅ Defined' : '❌ Missing');

    // --- Tab Management ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            switchTab(targetTab);
        });
    });

    function switchTab(tabName) {
        // Update tab buttons
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab contents
        tabContents.forEach(content => {
            content.classList.toggle('active', content.dataset.tab === tabName);
        });

        currentActiveTab = tabName;
    }

    // --- Result Actions ---
    if (copyResultBtn) {
        copyResultBtn.addEventListener('click', async () => {
            const activeContent = document.querySelector('.tab-content.active');
            if (activeContent && activeContent.textContent.trim()) {
                try {
                    await navigator.clipboard.writeText(activeContent.textContent);
                    copyResultBtn.textContent = '✅ Copied!';
                    setTimeout(() => {
                        copyResultBtn.innerHTML = '📋 Copy';
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy:', err);
                }
            }
        });
    }

    if (clearResultBtn) {
        clearResultBtn.addEventListener('click', () => {
            tabContents.forEach(content => {
                content.innerHTML = '<div class="empty-state"><div class="empty-icon">💻</div><div class="empty-text">Ready to analyze your code</div></div>';
            });
        });
    }

    // --- Character Counter ---
    if (codeInput) {
        const charCount = document.querySelector('.char-count');
        console.log('📝 Character Counter:');
        console.log('  - codeInput found:', codeInput ? '✅' : '❌');
        console.log('  - charCount element found:', charCount ? '✅' : '❌');
        
        if (charCount) {
            // Initialize counter
            charCount.textContent = `${codeInput.value.length} characters`;
            
            // Add input event listener
            codeInput.addEventListener('input', () => {
                const length = codeInput.value.length;
                charCount.textContent = `${length} characters`;
                console.log(`⌨️ Character count updated: ${length}`);
            });
            
            console.log('✅ Character counter initialized successfully');
        } else {
            console.error('❌ Character counter element not found!');
        }
    } else {
        console.error('❌ Code input element not found for character counter!');
    }

    /**
     * Show error modal with animation when API is not configured
     */
    function showErrorModal() {
        const errorModal = document.getElementById('error-modal');
        if (errorModal) {
            errorModal.style.display = 'flex';
            setTimeout(() => {
                errorModal.classList.add('show');
            }, 10);
        }
    }

    /**
     * Hide error modal with animation
     */
    function hideErrorModal() {
        const errorModal = document.getElementById('error-modal');
        if (errorModal) {
            errorModal.classList.remove('show');
            setTimeout(() => {
                errorModal.style.display = 'none';
            }, 300);
        }
    }

    // Error Modal Event Listeners
    const closeErrorBtn = document.getElementById('close-error-btn');
    const gotoAdminBtn = document.getElementById('goto-admin-btn');
    const errorModal = document.getElementById('error-modal');

    if (closeErrorBtn) {
        closeErrorBtn.addEventListener('click', hideErrorModal);
    }

    if (gotoAdminBtn) {
        gotoAdminBtn.addEventListener('click', () => {
            hideErrorModal();
            // Check authentication before redirecting to admin panel
            redirectToAdminPanel();
        });
    }

    if (errorModal) {
        errorModal.addEventListener('click', (e) => {
            if (e.target === errorModal) {
                hideErrorModal();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideErrorModal();
        }
    });

    /**
     * Typewriter effect for displaying AI responses
     */
    async function typewriterEffect(element, text, speed = 30) {
        element.innerHTML = '';
        const lines = text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineElement = document.createElement('div');
            element.appendChild(lineElement);
            
            for (let j = 0; j < line.length; j++) {
                lineElement.textContent += line[j];
                await new Promise(resolve => setTimeout(resolve, speed));
            }
        }
    }

    // --- Learning Mode Logic ---
    function highlightKeywords() {
        if (!learningModeToggle?.checked) return;

        const lang = languageSelect?.value;
        const code = codeInput?.value;
        
        const keywords = {
            javascript: ['function', 'let', 'const', 'var', 'return', 'if', 'else', 'for', 'while', 'async', 'await', 'new'],
            python: ['def', 'return', 'if', 'elif', 'else', 'for', 'while', 'import', 'from', 'class'],
            java: ['public', 'private', 'protected', 'static', 'void', 'int', 'String', 'new', 'return', 'if', 'else', 'for'],
            c: ['int', 'char', 'void', 'return', 'if', 'else', 'for', 'while', '#include']
        };
        
        const langKeywords = keywords[lang] || [];
        if (langKeywords.length === 0 || !code) return;

        const regex = new RegExp(`\\b(${langKeywords.join('|')})\\b`, 'g');
        const highlightedCode = sanitizeInput(code).replace(regex, '<span class="highlight-keyword">$1</span>');

        resultOutput.innerHTML = highlightedCode;
    }

    if (learningModeToggle) {
        learningModeToggle.addEventListener('change', highlightKeywords);
    }
    
    if (codeInput) {
        codeInput.addEventListener('keyup', highlightKeywords);
    }

    // Initialize AI status
    aiAnalyzer.updateStatus('idle', 'AI Ready');

    // Page initialization - ensure content is visible
    setTimeout(() => {
        const loaderWrapper = document.getElementById('loader-wrapper');
        if (loaderWrapper) {
            loaderWrapper.style.display = 'none';
        }
        document.body.classList.add('loaded');
        console.log('✅ Code Explainer: Page initialization complete');
    }, 100);
});