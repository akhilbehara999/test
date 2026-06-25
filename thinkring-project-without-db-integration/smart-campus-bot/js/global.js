// --- GLOBAL EVENT LISTENERS ---

/**
 * Handles the page load event to hide the loader and fade in the content.
 */
window.addEventListener('load', () => {
    const loader = document.getElementById('loader-wrapper');
    const body = document.body;

    if (loader) {
        // Add a small delay to let the user see the animation
        setTimeout(() => {
            loader.classList.add('hidden');
            // Allow the loader to fade out before the body fades in
            setTimeout(() => {
                body.classList.add('loaded');
            }, 50);
        }, 500);
    } else {
        // If there's no loader, just show the body
        body.classList.add('loaded');
    }
});


// --- GLOBAL UI ELEMENTS ---

/**
 * Creates and manages the global voice control button.
 */
function setupGlobalVoiceControl() {
    const voiceControlBtn = document.createElement('button');
    voiceControlBtn.id = 'global-voice-btn';
    voiceControlBtn.className = 'global-voice-btn';
    document.body.appendChild(voiceControlBtn);

    let voiceEnabled = localStorage.getItem('voice-enabled') !== 'false'; // Default to true

    function updateButtonState() {
        if (voiceEnabled) {
            voiceControlBtn.textContent = '🎤';
            voiceControlBtn.title = 'Voice Features ON';
            voiceControlBtn.classList.remove('off');
        } else {
            voiceControlBtn.textContent = '🔇';
            voiceControlBtn.title = 'Voice Features OFF';
            voiceControlBtn.classList.add('off');
        }
    }

    voiceControlBtn.addEventListener('click', () => {
        voiceEnabled = !voiceEnabled;
        localStorage.setItem('voice-enabled', voiceEnabled);
        updateButtonState();
        // If turning off, stop any ongoing recognition
        if (!voiceEnabled && recognition && recognition.abort) {
            recognition.abort();
        }
    });

    updateButtonState();
}

// Add the button as soon as the DOM is ready
document.addEventListener('DOMContentLoaded', setupGlobalVoiceControl);


// --- SPEECH SYNTHESIS & RECOGNITION ---

/**
 * Uses the Web Speech API to speak the given text.
 * @param {string} text The text to be spoken.
 */
function speak(text) {
    const voiceEnabled = localStorage.getItem('voice-enabled') !== 'false';
    if (!voiceEnabled) return;

    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        // You can customize the voice here
        speechSynthesis.speak(utterance);
    }
}

// --- UI Effects ---

let typingInterval; // Keep a global reference to stop it if a new animation starts

/**
 * Displays text in an element with a typewriter animation.
 * @param {HTMLElement} element The element to display the text in.
 * @param {string} text The text to be typed.
 * @param {number} [speed=30] The typing speed in milliseconds.
 */
function typewriterEffect(element, text, speed = 30) {
    if (!element) return;
    // Clear any ongoing typing animation
    if (typingInterval) {
        clearInterval(typingInterval);
    }

    element.textContent = '';
    let i = 0;

    // Add a blinking cursor
    element.style.borderRight = '3px solid var(--accent-color)';
    element.style.animation = 'blink 0.7s step-end infinite';

    typingInterval = setInterval(() => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(typingInterval);
            // Make cursor solid after typing is done
            setTimeout(() => {
                element.style.animation = 'none';
            }, 1500);
        }
    }, speed);
}

/**
 * A global variable to hold the speech recognition instance.
 * This allows it to be controlled from different parts of the application.
 */
let recognition;

/**
 * Simulates listening for a wake word. In a real application, this would
 * involve a dedicated speech recognition library.
 * @param {function} callback The function to call when the wake word is "detected".
 */
function listenForWakeWord(callback) {
    console.log("Wake word detection is not fully implemented in this demo.");
    console.log("To simulate, you can call the callback manually from the console: window.startVoiceCommands()");
    // In a real app, you would use a library like Porcupine or a custom speech model.
    window.startVoiceCommands = callback;
}

/**
 * Starts the speech recognition service if it has been initialized.
 */
function startVoiceCommands() {
    if (recognition) {
        try {
            recognition.start();
        } catch(e) {
            console.error("Voice recognition could not be started.", e);
        }
    } else {
        console.error("Voice recognition is not initialized.");
    }
}

// --- GLOBAL AI CONFIGURATION ---

/**
 * Sets OpenRouter API configuration across all modules
 * @param {string} apiKey - The OpenRouter API key
 * @param {string} model - The AI model to use (default: 'openai/gpt-oss-20b:free')
 */
function setGlobalAIConfig(apiKey, model = 'openai/gpt-oss-20b:free') {
    if (!apiKey || apiKey.trim() === '') {
        console.error('API key is required');
        return false;
    }

    try {
        // Set configuration for Quiz module
        localStorage.setItem('openrouter-api-key', apiKey);
        localStorage.setItem('ai-model', model);

        // Set configuration for Code Explainer module
        localStorage.setItem('code-explainer-api-key', apiKey);
        localStorage.setItem('code-explainer-model', model);

        // Set configuration for Book module
        localStorage.setItem('book-tools-api-key', apiKey);
        localStorage.setItem('book-tools-model', model);

        // Set configuration for Chatbot module
        localStorage.setItem('chatbot-api-key', apiKey);

        console.log(`✅ Global AI Configuration Set:`);
        console.log(`   API Key: ${apiKey.substring(0, 10)}...`);
        console.log(`   Model: ${model}`);
        console.log(`   Applied to: Quiz, Code Explainer, Book, Chatbot modules`);

        return true;
    } catch (error) {
        console.error('Error setting global AI configuration:', error);
        return false;
    }
}

/**
 * Gets the current global AI configuration
 * @returns {object} Object containing API key and model for each module
 */
function getGlobalAIConfig() {
    return {
        quiz: {
            apiKey: localStorage.getItem('openrouter-api-key'),
            model: localStorage.getItem('ai-model')
        },
        codeExplainer: {
            apiKey: localStorage.getItem('code-explainer-api-key'),
            model: localStorage.getItem('code-explainer-model')
        },
        book: {
            apiKey: localStorage.getItem('book-tools-api-key'),
            model: localStorage.getItem('book-tools-model')
        },
        chatbot: {
            apiKey: localStorage.getItem('book-tools-api-key'),
            model: 'deepseek/deepseek-r1-0528:free'
        }
    };
}

/**
 * Clears all AI configuration from localStorage
 */
function clearGlobalAIConfig() {
    const keys = [
        'openrouter-api-key', 'ai-model',
        'code-explainer-api-key', 'code-explainer-model',
        'book-tools-api-key', 'book-tools-model'
    ];
    
    keys.forEach(key => localStorage.removeItem(key));
    console.log('🗑️ All AI configuration cleared');
}
