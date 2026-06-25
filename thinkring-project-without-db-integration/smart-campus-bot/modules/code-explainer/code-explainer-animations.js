// Code Explainer Module - Enhanced Animations and Transitions

document.addEventListener('DOMContentLoaded', function() {
    // Initialize animations
    initCodeAnimations();
});

function initCodeAnimations() {
    // Add hover effects to control buttons
    const controlButtons = document.querySelectorAll('.control-btn');
    controlButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
            this.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(139, 92, 246, 0.3)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(139, 92, 246, 0.2)';
        });
        
        button.addEventListener('click', function() {
            this.style.transform = 'translateY(-2px) scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'translateY(-5px) scale(1.02)';
            }, 150);
        });
    });
    
    // Add tab switching animation
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all tab content
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            // Show corresponding tab content with animation
            const tabId = this.getAttribute('data-tab');
            const targetContent = document.querySelector(`.tab-content[data-tab="${tabId}"]`);
            if (targetContent) {
                setTimeout(() => {
                    targetContent.classList.add('active');
                }, 10);
            }
        });
    });
    
    // Add character count animation to code input
    const codeInput = document.getElementById('code-input');
    if (codeInput) {
        codeInput.addEventListener('input', function() {
            const charCount = this.value.length;
            const charCountElement = document.querySelector('.char-count');
            if (charCountElement) {
                charCountElement.textContent = charCount + ' characters';
                
                // Add a subtle animation when character count changes significantly
                if (charCount % 50 === 0 && charCount > 0) {
                    charCountElement.style.animation = 'none';
                    setTimeout(() => {
                        charCountElement.style.animation = 'pulse 0.3s';
                    }, 10);
                }
            }
        });
    }
    
    // Add glow effect to AI status
    const aiStatus = document.getElementById('ai-status');
    if (aiStatus) {
        setInterval(() => {
            aiStatus.style.opacity = aiStatus.style.opacity === '0.7' ? '1' : '0.7';
        }, 2000);
    }
    
    // Add ripple effect to action buttons
    addActionRippleEffect();
    
    // Add floating animation to explainer container
    const explainerContainer = document.querySelector('.explainer-container');
    if (explainerContainer) {
        let floatInterval = setInterval(() => {
            explainerContainer.style.transform = 'translateY(-3px)';
            setTimeout(() => {
                explainerContainer.style.transform = 'translateY(0)';
            }, 1000);
        }, 5000);
        
        // Pause animation on hover
        explainerContainer.addEventListener('mouseenter', () => {
            clearInterval(floatInterval);
        });
        
        explainerContainer.addEventListener('mouseleave', () => {
            floatInterval = setInterval(() => {
                explainerContainer.style.transform = 'translateY(-3px)';
                setTimeout(() => {
                    explainerContainer.style.transform = 'translateY(0)';
                }, 1000);
            }, 5000);
        });
    }
}

// Add ripple effect to action buttons
function addActionRippleEffect() {
    const actionButtons = document.querySelectorAll('.action-btn, button[type="submit"]');
    actionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            this.appendChild(ripple);
            
            const d = Math.max(this.clientWidth, this.clientHeight);
            ripple.style.width = ripple.style.height = d + 'px';
            
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left - d/2;
            const y = e.clientY - rect.top - d/2;
            
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Show error modal with animation
function showErrorModal() {
    const modal = document.getElementById('error-modal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

// Hide error modal with animation
function hideErrorModal() {
    const modal = document.getElementById('error-modal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Export functions for use in main code-explainer.js
window.codeAnimations = {
    showErrorModal,
    hideErrorModal
};