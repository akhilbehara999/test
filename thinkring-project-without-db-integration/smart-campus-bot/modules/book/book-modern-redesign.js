// Book Tools Modern Redesign - Optimized JavaScript Implementation with Smooth Animations

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the module
    initBookTools();
});

// Main initialization function
function initBookTools() {
    // Get DOM elements
    const elements = {
        textInput: document.getElementById('text-input'),
        summarizeBtn: document.getElementById('summarize-btn'),
        expandBtn: document.getElementById('expand-btn'),
        rephraseBtn: document.getElementById('rephrase-btn'),
        speakBtn: document.getElementById('speak-btn'),
        stopBtn: document.getElementById('stop-btn'),
        copyBtn: document.getElementById('copy-btn'),
        exportBtn: document.getElementById('export-btn'),
        saveBtn: document.getElementById('save-btn'),
        statusDiv: document.getElementById('status'),
        outputTextDiv: document.getElementById('output-text'),
        loader: document.getElementById('loader-wrapper'),
        apiKeyInput: document.getElementById('api-key-input'),
        modelSelect: document.getElementById('model-select'),
        saveApiConfigBtn: document.getElementById('save-api-config-btn')
    };
    
    // State management
    const state = {
        isProcessing: false,
        currentText: '',
        currentOutput: '',
        isSpeaking: false
    };
    
    // Load saved API configuration
    loadApiConfig(elements);
    
    // Event listeners
    setupEventListeners(elements, state);
    
    // Initialize UI
    updateUIState(elements, state);
    
    // Add ripple effects to buttons
    addRippleEffects();
    
    console.log('Book Tools Modern Redesign initialized');
}

// Load saved API configuration
function loadApiConfig(elements) {
    const apiKey = localStorage.getItem('book-tools-api-key');
    const model = localStorage.getItem('book-tools-model');
    
    if (elements.apiKeyInput && apiKey) {
        elements.apiKeyInput.value = apiKey;
    }
    
    if (elements.modelSelect && model) {
        elements.modelSelect.value = model;
    }
}

// Set up event listeners
function setupEventListeners(elements, state) {
    // Text input with debounce
    let inputTimeout;
    elements.textInput.addEventListener('input', function() {
        clearTimeout(inputTimeout);
        inputTimeout = setTimeout(() => {
            state.currentText = this.value;
        }, 300);
    });
    
    // Drag and drop functionality
    setupDragAndDrop(elements, state);
    
    // Operation buttons
    elements.summarizeBtn.addEventListener('click', () => performOperation('summarize', elements, state));
    elements.expandBtn.addEventListener('click', () => performOperation('expand', elements, state));
    elements.rephraseBtn.addEventListener('click', () => performOperation('rephrase', elements, state));
    
    // Utility buttons
    elements.speakBtn.addEventListener('click', () => speakText(elements, state));
    elements.stopBtn.addEventListener('click', () => stopSpeaking(elements, state));
    elements.copyBtn.addEventListener('click', () => copyText(elements, state));
    elements.exportBtn.addEventListener('click', () => exportText(elements, state));
    elements.saveBtn.addEventListener('click', () => saveText(elements, state));
    
    // API configuration
    if (elements.saveApiConfigBtn) {
        elements.saveApiConfigBtn.addEventListener('click', () => saveApiConfig(elements));
    }
}

// Save API configuration
function saveApiConfig(elements) {
    if (elements.apiKeyInput && elements.modelSelect) {
        const apiKey = elements.apiKeyInput.value;
        const model = elements.modelSelect.value;
        
        if (apiKey) {
            localStorage.setItem('book-tools-api-key', apiKey);
            localStorage.setItem('book-tools-model', model);
            showStatus('API configuration saved successfully!', 'success', elements);
        } else {
            showStatus('Please enter an API key', 'error', elements);
        }
    }
}

// Setup drag and drop functionality
function setupDragAndDrop(elements, state) {
    elements.textInput.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.textInput.classList.add('dragover');
    });

    elements.textInput.addEventListener('dragleave', () => {
        elements.textInput.classList.remove('dragover');
    });

    elements.textInput.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.textInput.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileDrop(files[0], elements, state);
        }
    });
}

// Handle file drop
function handleFileDrop(file, elements, state) {
    showStatus(`Reading file: ${file.name}...`, 'processing', elements);

    if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
            elements.textInput.value = e.target.result;
            state.currentText = e.target.result;
            showStatus('File loaded successfully.', 'success', elements);
        };
        reader.readAsText(file);
    } else if (file.name.endsWith('.docx')) {
        // For docx files, we would need the mammoth library
        showStatus('DOCX support requires additional library. Please use .txt files.', 'error', elements);
    } else {
        showStatus(`Unsupported file type: ${file.type}`, 'error', elements);
    }
}

// Perform text operations with optimized performance
async function performOperation(operation, elements, state) {
    // Prevent multiple operations
    if (state.isProcessing) {
        showStatus('Please wait for the current operation to complete', 'error', elements);
        return;
    }
    
    // Validate input
    if (!state.currentText || state.currentText.trim() === '') {
        showStatus('Please enter some text first', 'error', elements);
        elements.textInput.focus();
        return;
    }
    
    // Set processing state
    state.isProcessing = true;
    updateUIState(elements, state);
    
    // Add processing class to button
    const button = elements[`${operation}Btn`];
    button.classList.add('processing');
    
    try {
        // Show status
        showStatus(`Processing: ${operation}...`, 'processing', elements);
        
        // Process text based on operation (using AI API)
        const result = await processTextWithAI(operation, state.currentText);
        
        // Update output with smooth animation
        updateOutputWithAnimation(elements.outputTextDiv, result);
        state.currentOutput = result;
        
        // Show success
        showStatus(`${operation.charAt(0).toUpperCase() + operation.slice(1)} completed successfully!`, 'success', elements);
    } catch (error) {
        console.error('Operation failed:', error);
        if (error.message === 'API_KEY_MISSING') {
            // Show popup for missing API key
            showApiKeyPopup(elements);
        } else {
            showStatus(`Error: ${error.message}`, 'error', elements);
        }
    } finally {
        // Reset processing state
        state.isProcessing = false;
        button.classList.remove('processing');
        updateUIState(elements, state);
    }
}

// Process text with AI API
async function processTextWithAI(operation, text) {
    // Check if API key is configured
    const apiKey = localStorage.getItem('book-tools-api-key');
    if (!apiKey) {
        throw new Error('API_KEY_MISSING');
    }
    
    // Get model from localStorage or use default
    const model = localStorage.getItem('book-tools-model') || 'openai/gpt-3.5-turbo';
    
    // Define system prompts based on operation
    let systemPrompt = '';
    switch(operation) {
        case 'summarize':
            systemPrompt = "You are an expert text summarizer. Take the user's text and provide a concise summary formatted as a list of bullet points.";
            break;
        case 'expand':
            systemPrompt = "You are a text expander. Take the user's text and elaborate on it, providing a more detailed and descriptive version.";
            break;
        case 'rephrase':
            systemPrompt = "You are a rephrasing tool. Rewrite the user's text in a different style or with different vocabulary while preserving the core meaning.";
            break;
        default:
            systemPrompt = "You are a helpful assistant.";
    }
    
    // Call OpenRouter API
    const response = await callOpenRouterAPI(systemPrompt, text, apiKey, model);
    return response;
}

// Call OpenRouter API
async function callOpenRouterAPI(systemPrompt, userContent, apiKey, model) {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Smart Campus Book Tools'
            },
            body: JSON.stringify({
                'model': model,
                'messages': [
                    { 'role': 'system', 'content': systemPrompt },
                    { 'role': 'user', 'content': userContent }
                ],
                'temperature': 0.7,
                'max_tokens': 3000
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('API call failed:', error);
        throw new Error(`Failed to connect to AI service: ${error.message}`);
    }
}

// Show API key popup
function showApiKeyPopup(elements) {
    // Create popup element
    const popup = document.createElement('div');
    popup.id = 'api-key-popup';
    popup.innerHTML = `
        <div class="popup-overlay">
            <div class="popup-content">
                <h3>API Configuration Required</h3>
                <p>To use AI-powered features, an admin must configure the OpenRouter API key.</p>
                <p>Please contact your administrator to set up the API key for these features.</p>
                <button id="close-popup-btn">Close</button>
            </div>
        </div>
    `;
    
    // Add event listener to close button
    popup.addEventListener('click', function(e) {
        if (e.target.id === 'close-popup-btn' || e.target.id === 'api-key-popup') {
            document.body.removeChild(popup);
        }
    });
    
    document.body.appendChild(popup);
}

// Update output with smooth animation
function updateOutputWithAnimation(outputElement, newText) {
    // Fade out
    outputElement.style.opacity = '0';
    outputElement.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
        // Update content
        outputElement.textContent = newText;
        
        // Fade in
        outputElement.style.opacity = '1';
        outputElement.style.transform = 'translateY(0)';
    }, 150);
}

// Speak text with enhanced functionality
function speakText(elements, state) {
    if (state.isProcessing) {
        showStatus('Please wait for the current operation to complete', 'error', elements);
        return;
    }
    
    const text = state.currentOutput || state.currentText;
    if (!text || text.trim() === '') {
        showStatus('No text to speak', 'error', elements);
        return;
    }
    
    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onstart = () => {
            state.isSpeaking = true;
            showStatus('Speaking...', 'processing', elements);
            updateUIState(elements, state);
        };
        
        utterance.onend = () => {
            state.isSpeaking = false;
            showStatus('Finished speaking', 'success', elements);
            updateUIState(elements, state);
        };
        
        utterance.onerror = (event) => {
            state.isSpeaking = false;
            showStatus(`Speech error: ${event.error}`, 'error', elements);
            updateUIState(elements, state);
        };
        
        speechSynthesis.speak(utterance);
    } else {
        showStatus('Text-to-speech not supported in your browser', 'error', elements);
    }
}

// Stop speaking
function stopSpeaking(elements, state) {
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        state.isSpeaking = false;
        showStatus('Speech stopped', 'success', elements);
        updateUIState(elements, state);
    }
}

// Copy text with visual feedback
function copyText(elements, state) {
    if (state.isProcessing) {
        showStatus('Please wait for the current operation to complete', 'error', elements);
        return;
    }
    
    const text = state.currentOutput || state.currentText;
    if (!text || text.trim() === '') {
        showStatus('No text to copy', 'error', elements);
        return;
    }
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showStatus('Text copied to clipboard!', 'success', elements);
            
            // Visual feedback animation
            const originalText = elements.copyBtn.innerHTML;
            elements.copyBtn.innerHTML = '✓ Copied!';
            elements.copyBtn.style.background = 'linear-gradient(135deg, var(--success), #6ee7b7)';
            
            setTimeout(() => {
                elements.copyBtn.innerHTML = originalText;
                elements.copyBtn.style.background = '';
            }, 2000);
        }).catch(err => {
            console.error('Copy failed:', err);
            showStatus('Failed to copy text', 'error', elements);
        });
    } else {
        showStatus('Clipboard not supported in your browser', 'error', elements);
    }
}

// Export text
function exportText(elements, state) {
    if (state.isProcessing) {
        showStatus('Please wait for the current operation to complete', 'error', elements);
        return;
    }
    
    const text = state.currentOutput || state.currentText;
    if (!text || text.trim() === '') {
        showStatus('No text to export', 'error', elements);
        return;
    }
    
    try {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `book-tools-output-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showStatus('Text exported successfully!', 'success', elements);
    } catch (error) {
        console.error('Export failed:', error);
        showStatus('Failed to export text', 'error', elements);
    }
}

// Save text
function saveText(elements, state) {
    if (state.isProcessing) {
        showStatus('Please wait for the current operation to complete', 'error', elements);
        return;
    }
    
    const text = state.currentOutput || state.currentText;
    if (!text || text.trim() === '') {
        showStatus('No text to save', 'error', elements);
        return;
    }
    
    try {
        // Get existing saved items
        let savedItems = JSON.parse(localStorage.getItem('book-tools-saved')) || [];
        
        // Add new item
        savedItems.push({
            id: Date.now(),
            text: text,
            timestamp: new Date().toISOString(),
            length: text.length
        });
        
        // Save to localStorage
        localStorage.setItem('book-tools-saved', JSON.stringify(savedItems));
        
        showStatus('Text saved successfully!', 'success', elements);
        
        // Visual feedback
        elements.saveBtn.innerHTML = '✓ Saved!';
        setTimeout(() => {
            elements.saveBtn.innerHTML = '<span>💾</span> Save';
        }, 2000);
    } catch (error) {
        console.error('Save failed:', error);
        showStatus('Failed to save text', 'error', elements);
    }
}

// Update UI state
function updateUIState(elements, state) {
    // Update button states
    const operationButtons = [
        elements.summarizeBtn, 
        elements.expandBtn, 
        elements.rephraseBtn
    ];
    
    const utilityButtons = [
        elements.speakBtn,
        elements.copyBtn,
        elements.exportBtn,
        elements.saveBtn
    ];
    
    // Disable operation buttons during processing
    operationButtons.forEach(button => {
        button.disabled = state.isProcessing;
    });
    
    // Disable utility buttons during processing
    utilityButtons.forEach(button => {
        button.disabled = state.isProcessing;
    });
    
    // Special handling for stop button
    elements.stopBtn.disabled = !state.isSpeaking;
}

// Show status message with animation
function showStatus(message, type, elements) {
    if (!elements.statusDiv) return;
    
    elements.statusDiv.textContent = message;
    elements.statusDiv.className = `show ${type}`;
    
    // Trigger animation
    elements.statusDiv.style.animation = 'none';
    setTimeout(() => {
        elements.statusDiv.style.animation = 'bounce 0.6s ease';
    }, 10);
    
    // Auto hide after delay
    setTimeout(() => {
        elements.statusDiv.classList.remove('show');
    }, 5000);
}

// Add ripple effects to buttons
function addRippleEffects() {
    const buttons = document.querySelectorAll('.controls button, #save-api-config-btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            addRippleEffect(this, e);
        });
    });
}

// Add ripple effect to element
function addRippleEffect(element, event) {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Debounce function for input optimization
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction() {
        const context = this;
        const args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}