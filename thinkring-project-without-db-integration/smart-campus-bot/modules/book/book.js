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

    // --- Check if admin view is requested ---
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminView = urlParams.get('view') === 'admin';
    
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
                    })
                    .catch(err => {
                        statusDiv.textContent = 'Error: Could not read .docx file.';
                    });
            };
            reader.readAsArrayBuffer(file);
        } else {
            statusDiv.textContent = `Error: Unsupported file type (${file.type}). Please use .txt or .docx.`;
            alert(`Unsupported file type: ${file.type}`);
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
            this.apiKey = localStorage.getItem('book-tools-api-key') || '';
            
            // Allow any model - no restrictions
            this.model = localStorage.getItem('book-tools-model') || 'openai/gpt-oss-20b:free';
            
            this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
        }

        /**
         * Test AI connection and update status
         */
        async testConnection() {
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
                this.updateStatus('error', `Connection failed: ${error.message}`);
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
         * Save configuration to localStorage
         */
        saveConfig(apiKey, model) {
            this.apiKey = apiKey;
            this.model = model;
            localStorage.setItem('book-tools-api-key', apiKey);
            localStorage.setItem('book-tools-model', model);
        }

        /**
         * A reusable function to call the OpenRouter API with dynamic model
         * @param {string} systemPrompt The system prompt to guide the AI.
         * @param {string} userContent The user's text to be processed.
         * @returns {Promise<string>} The AI's response content or an error message.
         */
        async callOpenRouter(systemPrompt, userContent) {
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
                    const errorData = await response.json();
                    return `API Error: ${errorData.error?.message || 'Unknown error'}`;
                }

                const data = await response.json();
                return data.choices[0].message.content;

            } catch (error) {
                return "Error: Could not connect to the AI service. Check your network connection.";
            }
        }
    }

    const aiProcessor = new BookAIProcessor();

    // Add a flag to track if an operation is in progress
    let isOperationInProgress = false;

    summarizeBtn.addEventListener('click', async () => {
        // Prevent multiple simultaneous operations
        if (isOperationInProgress) {
            alert('An operation is already in progress. Please wait.');
            return;
        }
        
        const text = textInput.value;
        if (text.trim() === '') {
            alert('Please enter some text.');
            return;
        }
        
        isOperationInProgress = true;
        statusDiv.textContent = 'Summarizing...';
        outputTextDiv.textContent = ''; // Clear previous output

        try {
            const systemPrompt = "You are an expert text summarizer. Take the user's text and provide a concise summary formatted as a list of bullet points.";
            const result = await aiProcessor.callOpenRouter(systemPrompt, text);

            // Use direct text assignment instead of typewriter effect to prevent freezing
            outputTextDiv.textContent = result;
            statusDiv.textContent = 'Summary complete.';
        } catch (error) {
            statusDiv.textContent = 'Error: ' + error.message;
        } finally {
            isOperationInProgress = false;
        }
        
        // Track operation
        trackOperation('summarize');
    });

    expandBtn.addEventListener('click', async () => {
        // Prevent multiple simultaneous operations
        if (isOperationInProgress) {
            alert('An operation is already in progress. Please wait.');
            return;
        }
        
        const text = textInput.value;
        if (text.trim() === '') {
            alert('Please enter some text.');
            return;
        }
        
        isOperationInProgress = true;
        statusDiv.textContent = 'Expanding...';
        outputTextDiv.textContent = ''; // Clear previous output

        try {
            const systemPrompt = "You are a text expander. Take the user's text and elaborate on it, providing a more detailed and descriptive version.";
            const result = await aiProcessor.callOpenRouter(systemPrompt, text);

            // Use direct text assignment instead of typewriter effect to prevent freezing
            outputTextDiv.textContent = result;
            statusDiv.textContent = 'Expansion complete.';
        } catch (error) {
            statusDiv.textContent = 'Error: ' + error.message;
        } finally {
            isOperationInProgress = false;
        }
        
        // Track operation
        trackOperation('expand');
    });

    rephraseBtn.addEventListener('click', async () => {
        // Prevent multiple simultaneous operations
        if (isOperationInProgress) {
            alert('An operation is already in progress. Please wait.');
            return;
        }
        
        const text = textInput.value;
        if (text.trim() === '') {
            alert('Please enter some text.');
            return;
        }
        
        isOperationInProgress = true;
        statusDiv.textContent = 'Rephrasing...';
        outputTextDiv.textContent = '';

        try {
            const systemPrompt = "You are a rephrasing tool. Rewrite the user's text in a different style or with different vocabulary while preserving the core meaning.";
            const result = await aiProcessor.callOpenRouter(systemPrompt, text);

            // Use direct text assignment instead of typewriter effect to prevent freezing
            outputTextDiv.textContent = result;
            statusDiv.textContent = 'Rephrasing complete.';
        } catch (error) {
            statusDiv.textContent = 'Error: ' + error.message;
        } finally {
            isOperationInProgress = false;
        }
        
        // Track operation
        trackOperation('rephrase');
    });

    exportBtn.addEventListener('click', () => {
        if (isOperationInProgress) {
            alert('Please wait for the current operation to complete.');
            return;
        }
        const outputText = outputTextDiv.textContent;
        if (outputText.trim() === '') {
            alert('There is no output to export.');
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
    });

    copyBtn.addEventListener('click', () => {
        if (isOperationInProgress) {
            alert('Please wait for the current operation to complete.');
            return;
        }
        const outputText = outputTextDiv.textContent;
        if (outputText.trim() === '') {
            alert('There is no output to copy.');
            return;
        }

        navigator.clipboard.writeText(outputText).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.style.backgroundColor = 'var(--success-color)';
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.backgroundColor = '';
            }, 2000);
        }).catch(err => {
            alert('Failed to copy text.');
        });
    });

    speakBtn.addEventListener('click', () => {
        if (isOperationInProgress) {
            alert('Please wait for the current operation to complete.');
            return;
        }
        const text = outputTextDiv.textContent || textInput.value;
        if (text.trim() === '') {
            alert('Nothing to speak.');
            return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
        statusDiv.textContent = 'Speaking...';
        utterance.onend = () => {
            statusDiv.textContent = '';
        };
    });

    stopBtn.addEventListener('click', () => {
        if (isOperationInProgress) {
            // We still allow stopping speech even during operations
        }
        speechSynthesis.cancel();
        statusDiv.textContent = '';
    });

    // --- Admin View Logic ---
    
    if (isAdminView) {
        userView.style.display = 'none';
        adminView.style.display = 'block';
        document.querySelector('.back-link').href = '../../admin.html';
        document.querySelector('h1').textContent = 'Manage Book Tools';
        
        renderAnalytics();
        renderSummariesTable();
    } else {
        userView.style.display = 'block';
        adminView.style.display = 'none';
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
                localStorage.setItem('book-tools-api-key', apiKey);
                alert('API Key saved!');
            });
        }
    }

    function loadApiKey() {
        const apiKey = localStorage.getItem('book-tools-api-key');
        const apiKeyInput = document.getElementById('api-key-input');
        if (apiKey && apiKeyInput) {
            apiKeyInput.value = apiKey;
        }
    }

    // --- Delete Saved Summary Logic ---
    const summariesTableBody = document.querySelector('#summaries-table tbody');
    if (summariesTableBody) {
        summariesTableBody.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const summaryId = parseInt(e.target.dataset.id);
                let savedSummaries = JSON.parse(localStorage.getItem('saved-summaries')) || [];
                savedSummaries = savedSummaries.filter(s => s.id !== summaryId);
                localStorage.setItem('saved-summaries', JSON.stringify(savedSummaries));
                renderSummariesTable();
            }
        });
    }


    saveBtn.addEventListener('click', () => {
        if (isOperationInProgress) {
            alert('Please wait for the current operation to complete.');
            return;
        }
        const outputText = outputTextDiv.textContent;
        if (outputText.trim() === '') {
            alert('There is no output to save.');
            return;
        }

        const savedSummaries = JSON.parse(localStorage.getItem('saved-summaries')) || [];
        const username = localStorage.getItem('username') || 'anonymous';

        savedSummaries.push({
            id: Date.now(),
            username: username,
            text: outputText,
            savedAt: new Date().toLocaleString()
        });

        localStorage.setItem('saved-summaries', JSON.stringify(savedSummaries));
        alert('Output saved successfully!');
    });
});

/**
 * A safer typewriter effect implementation that won't freeze the page
 * @param {HTMLElement} element The element to display the text in.
 * @param {string} text The text to be typed.
 * @param {number} [speed=30] The typing speed in milliseconds.
 */
function safeTypewriterEffect(element, text, speed = 30) {
    if (!element) return;
    
    // Clear content first
    element.textContent = '';
    
    // If text is empty, return immediately
    if (!text || text.length === 0) {
        return;
    }
    
    let i = 0;
    
    // Use setTimeout instead of setInterval for better control
    function typeCharacter() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            
            // Schedule next character with setTimeout
            setTimeout(typeCharacter, speed);
        }
    }
    
    // Start typing
    typeCharacter();
}
