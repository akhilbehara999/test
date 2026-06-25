document.addEventListener('DOMContentLoaded', () => {
    // Hide loader and show content
    const loader = document.getElementById('loader-wrapper');
    if (loader) {
        loader.classList.add('hidden');
    }
    document.body.classList.add('loaded');
    
    // Check for session token
    if (!localStorage.getItem('sessionToken')) {
        window.location.href = 'index.html';
    }

    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('userRole');
        window.location.href = 'index.html';
    });

    const moduleCards = document.querySelectorAll('.module-card');
    moduleCards.forEach(card => {
        card.addEventListener('click', () => {
            const module = card.dataset.module;
            
            // Check if current user is admin and preserve admin context
            const userRole = localStorage.getItem('userRole');
            const isAdmin = userRole === 'admin';
            
            let targetUrl = `modules/${module}/${module}.html`;
            if (isAdmin) {
                targetUrl += '?view=admin';
            }
            
            window.location.href = targetUrl;
        });

        // 3D Holographic Tilt Effect
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -10; // Max rotation 10deg
            const rotateY = ((x - centerX) / centerX) * 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                card.click();
            }
        });
    });

    // Voice commands
    if ('webkitSpeechRecognition' in window) {
        const voiceEnabled = localStorage.getItem('voice-enabled') !== 'false';
        if (!voiceEnabled) {
            console.log('Voice commands disabled by user setting.');
            return;
        }

        recognition = new webkitSpeechRecognition(); // Use global var
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onstart = () => {
            console.log('Voice recognition started.');
            speak("I'm listening.");
        };

        recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const command = event.results[last][0].transcript.trim().toLowerCase();
            console.log('Voice command:', command);

            if (command.startsWith('open')) {
                const moduleName = command.substring(5).replace(/ /g, '-');
                const card = document.querySelector(`.module-card[data-module="${moduleName}"]`);
                if (card) {
                    speak(`Opening ${moduleName.replace(/-/g, ' ')}.`);
                    card.click();
                } else {
                    speak(`Module ${moduleName.replace(/-/g, ' ')} not found.`);
                }
            } else if (command === 'stop listening') {
                speak("Going back to sleep.");
                recognition.stop();
            }
        };

        recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
        };

        recognition.onend = () => {
            console.log('Voice recognition ended.');
            // Don't automatically restart, wait for wake word again.
        };

        // Listen for wake word instead of starting immediately
        listenForWakeWord(startVoiceCommands);

    } else {
        console.log('Speech recognition not supported in this browser.');
    }
});
