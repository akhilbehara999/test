/**
 * @file Voice Commands Module
 * Handles speech recognition and synthesis functionality
 */

/**
 * Voice Commands Manager
 * Provides centralized voice command functionality
 */
class VoiceCommandsManager {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.voiceEnabled = localStorage.getItem('voice-enabled') !== 'false';
        this.commandHandlers = new Map();
        this.globalCommands = new Map();
        
        this.initializeRecognition();
        this.setupGlobalCommands();
    }

    /**
     * Initialize speech recognition
     * @private
     */
    initializeRecognition() {
        if (!('webkitSpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser');
            return;
        }

        this.recognition = new webkitSpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const command = event.results[last][0].transcript.trim().toLowerCase();
            this.handleCommand(command);
        };

        this.recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            this.handleError(event.error);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            if (this.voiceEnabled) {
                // Auto-restart if voice is enabled
                setTimeout(() => this.startListening(), 1000);
            }
        };
    }

    /**
     * Setup global voice commands
     * @private
     */
    setupGlobalCommands() {
        this.registerGlobalCommand('go to dashboard', () => {
            if (window.location.pathname !== '/dashboard.html') {
                window.location.href = 'dashboard.html';
            }
        });

        this.registerGlobalCommand('go home', () => {
            window.location.href = 'dashboard.html';
        });

        this.registerGlobalCommand('logout', () => {
            this.performLogout();
        });

        this.registerGlobalCommand('help', () => {
            this.showVoiceCommands();
        });

        this.registerGlobalCommand('scroll up', () => {
            window.scrollBy(0, -200);
        });

        this.registerGlobalCommand('scroll down', () => {
            window.scrollBy(0, 200);
        });

        this.registerGlobalCommand('go to top', () => {
            window.scrollTo(0, 0);
        });
    }

    /**
     * Register a global voice command
     * @param {string} command - Command phrase
     * @param {Function} handler - Command handler function
     */
    registerGlobalCommand(command, handler) {
        this.globalCommands.set(command.toLowerCase(), handler);
    }

    /**
     * Register a context-specific voice command
     * @param {string} context - Context identifier (e.g., 'lost-found', 'quiz')
     * @param {string} command - Command phrase
     * @param {Function} handler - Command handler function
     */
    registerCommand(context, command, handler) {
        if (!this.commandHandlers.has(context)) {
            this.commandHandlers.set(context, new Map());
        }
        this.commandHandlers.get(context).set(command.toLowerCase(), handler);
    }

    /**
     * Set the current context for voice commands
     * @param {string} context - Current context
     */
    setContext(context) {
        this.currentContext = context;
    }

    /**
     * Handle voice command
     * @param {string} command - Recognized command
     * @private
     */
    handleCommand(command) {
        console.log('Voice command received:', command);

        // Try global commands first
        for (const [globalCommand, handler] of this.globalCommands) {
            if (command.includes(globalCommand)) {
                this.speak(`Executing: ${globalCommand}`);
                handler();
                return;
            }
        }

        // Try context-specific commands
        if (this.currentContext && this.commandHandlers.has(this.currentContext)) {
            const contextCommands = this.commandHandlers.get(this.currentContext);
            for (const [contextCommand, handler] of contextCommands) {
                if (command.includes(contextCommand)) {
                    this.speak(`Executing: ${contextCommand}`);
                    handler();
                    return;
                }
            }
        }

        // No command found
        console.log('No matching voice command found for:', command);
    }

    /**
     * Handle recognition errors
     * @param {string} error - Error type
     * @private
     */
    handleError(error) {
        switch (error) {
            case 'no-speech':
                console.log('No speech detected');
                break;
            case 'audio-capture':
                console.error('Audio capture failed');
                this.speak('Audio capture failed. Please check your microphone.');
                break;
            case 'not-allowed':
                console.error('Speech recognition not allowed');
                this.speak('Speech recognition permission denied.');
                break;
            default:
                console.error('Speech recognition error:', error);
        }
    }

    /**
     * Start listening for voice commands
     */
    startListening() {
        if (!this.voiceEnabled || !this.recognition || this.isListening) {
            return;
        }

        try {
            this.recognition.start();
            this.isListening = true;
            console.log('Voice recognition started');
        } catch (error) {
            console.error('Failed to start voice recognition:', error);
        }
    }

    /**
     * Stop listening for voice commands
     */
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            console.log('Voice recognition stopped');
        }
    }

    /**
     * Enable or disable voice commands
     * @param {boolean} enabled - Whether to enable voice commands
     */
    setEnabled(enabled) {
        this.voiceEnabled = enabled;
        localStorage.setItem('voice-enabled', enabled);
        
        if (enabled) {
            this.startListening();
        } else {
            this.stopListening();
        }
        
        this.updateGlobalVoiceButton();
    }

    /**
     * Check if voice commands are enabled
     * @returns {boolean} True if voice commands are enabled
     */
    isEnabled() {
        return this.voiceEnabled;
    }

    /**
     * Speak text using speech synthesis
     * @param {string} text - Text to speak
     * @param {object} options - Speech options
     */
    speak(text, options = {}) {
        if (!this.voiceEnabled || !('speechSynthesis' in window)) {
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply options
        if (options.rate) utterance.rate = options.rate;
        if (options.pitch) utterance.pitch = options.pitch;
        if (options.volume) utterance.volume = options.volume;
        if (options.voice) utterance.voice = options.voice;

        speechSynthesis.speak(utterance);
    }

    /**
     * Update the global voice control button
     * @private
     */
    updateGlobalVoiceButton() {
        const voiceBtn = document.getElementById('global-voice-btn');
        if (voiceBtn) {
            if (this.voiceEnabled) {
                voiceBtn.textContent = '🎤';
                voiceBtn.title = 'Voice Features ON';
                voiceBtn.classList.remove('off');
            } else {
                voiceBtn.textContent = '🔇';
                voiceBtn.title = 'Voice Features OFF';
                voiceBtn.classList.add('off');
            }
        }
    }

    /**
     * Show available voice commands
     * @private
     */
    showVoiceCommands() {
        const commands = [
            'Global commands:',
            '• \"Go to dashboard\" - Navigate to main dashboard',
            '• \"Go home\" - Navigate to dashboard',
            '• \"Logout\" - Sign out of the application',
            '• \"Help\" - Show this help',
            '• \"Scroll up/down\" - Scroll the page',
            '• \"Go to top\" - Scroll to top of page'
        ];

        if (this.currentContext && this.commandHandlers.has(this.currentContext)) {
            commands.push(`\n${this.currentContext} commands:`);
            const contextCommands = this.commandHandlers.get(this.currentContext);
            for (const command of contextCommands.keys()) {
                commands.push(`• \"${command}\"`);
            }
        }

        this.speak('Available voice commands');
        alert(commands.join('\n'));
    }

    /**
     * Perform logout action
     * @private
     */
    performLogout() {
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        this.speak('Logging out');
        window.location.href = 'index.html';
    }

    /**
     * Get available voices
     * @returns {SpeechSynthesisVoice[]} Array of available voices
     */
    getAvailableVoices() {
        return speechSynthesis.getVoices();
    }

    /**
     * Set the voice for speech synthesis
     * @param {SpeechSynthesisVoice} voice - Voice to use
     */
    setVoice(voice) {
        this.selectedVoice = voice;
    }
}

// Global voice commands manager instance
const voiceManager = new VoiceCommandsManager();

// Export for global use
window.voiceManager = voiceManager;
window.speak = voiceManager.speak.bind(voiceManager);

// Auto-start when module loads
document.addEventListener('DOMContentLoaded', () => {
    if (voiceManager.isEnabled()) {
        voiceManager.startListening();
    }
});

console.log('Voice Commands module loaded');