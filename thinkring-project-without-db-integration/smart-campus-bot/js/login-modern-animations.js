// Login Modern Animations and Enhanced Interactions

document.addEventListener('DOMContentLoaded', function() {
    // Initialize login animations
    initLoginAnimations();
});

function initLoginAnimations() {
    // Add body class for modern styling
    document.body.classList.add('login-modern');
    
    // Add floating animation to login box
    const loginBox = document.querySelector('.login-box');
    if (loginBox) {
        setInterval(() => {
            loginBox.style.transform = 'translateY(-5px)';
            setTimeout(() => {
                loginBox.style.transform = 'translateY(0)';
            }, 1000);
        }, 5000);
    }
    
    // Add focus effects to input fields
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });
    
    // Add hover effects to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Add pulse animation to login button when form is valid
    const loginForm = document.getElementById('login-form');
    const loginBtn = document.querySelector('.login-btn');
    
    if (loginForm && loginBtn) {
        loginForm.addEventListener('input', function() {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (username.length > 0 && password.length > 0) {
                loginBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3), 0 0 20px rgba(99, 102, 241, 0.7)';
            } else {
                loginBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
            }
        });
    }
    
    // Create floating particles
    createFloatingParticles();
}

// Create floating particles for background
function createFloatingParticles() {
    const particleContainer = document.getElementById('particle-container');
    if (!particleContainer) return;
    
    // Create 30 particles
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random properties
        const size = Math.random() * 5 + 2;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const animationDuration = Math.random() * 10 + 10;
        const animationDelay = Math.random() * 5;
        const opacity = Math.random() * 0.5 + 0.1;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.animationDuration = `${animationDuration}s`;
        particle.style.animationDelay = `${animationDelay}s`;
        particle.style.opacity = opacity;
        particle.style.background = getRandomGradient();
        
        particleContainer.appendChild(particle);
    }
}

// Generate random gradient for particles
function getRandomGradient() {
    const colors = [
        'linear-gradient(135deg, #6366f1, #818cf8)',
        'linear-gradient(135deg, #0ea5e9, #38bdf8)',
        'linear-gradient(135deg, #ec4899, #f472b6)',
        'linear-gradient(135deg, #10b981, #34d399)'
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
}

// Add pulse animation to elements
function addPulseAnimation(element) {
    if (!element) return;
    
    element.style.animation = 'pulseGlow 2s infinite';
}

// Remove pulse animation
function removePulseAnimation(element) {
    if (!element) return;
    
    element.style.animation = 'none';
}

// Show login message with animation
function showLoginMessage(message, isError = true) {
    const messageElement = document.getElementById('login-message');
    if (!messageElement) return;
    
    messageElement.textContent = message;
    messageElement.style.color = isError ? '#ef4444' : '#10b981';
    messageElement.style.opacity = '0';
    messageElement.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
        messageElement.style.transition = 'all 0.3s ease-out';
        messageElement.style.opacity = '1';
        messageElement.style.transform = 'translateY(0)';
    }, 10);
}

// Export functions for use in login.js
window.loginAnimations = {
    showLoginMessage,
    addPulseAnimation,
    removePulseAnimation
};