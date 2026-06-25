/**
 * Admin Modern Animations
 * Provides smooth animations and interactive effects for the modern admin panel
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all animations when DOM is loaded
    initAdminAnimations();
});

/**
 * Initialize all admin panel animations
 */
function initAdminAnimations() {
    initRippleEffects();
    initCardHoverEffects();
    initTableAnimations();
    initFloatingElements();
    initLoaderAnimation();
    initHeaderAnimations();
}

/**
 * Add ripple effect to buttons
 */
function initRippleEffects() {
    const buttons = document.querySelectorAll('.admin-config-btn, .logout-btn, .action-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

/**
 * Add hover effects to cards
 */
function initCardHoverEffects() {
    const cards = document.querySelectorAll('.overview-card, .insight-card, .module-link');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
            this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 30px rgba(99, 102, 241, 0.4)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
        });
    });
}

/**
 * Animate table rows when they appear
 */
function initTableAnimations() {
    const rows = document.querySelectorAll('#user-table tbody tr');
    
    rows.forEach((row, index) => {
        // Add delay for staggered animation
        row.style.animationDelay = `${index * 0.1}s`;
        row.classList.add('table-row-animate');
    });
}

/**
 * Add floating animation to key elements
 */
function initFloatingElements() {
    const floatingElements = document.querySelectorAll('.overview-card, .module-management-container, .user-management-container');
    
    floatingElements.forEach(element => {
        // Add floating animation class
        element.classList.add('floating-element');
        
        // Add continuous subtle floating effect
        let floatInterval;
        element.addEventListener('mouseenter', () => {
            let position = 0;
            floatInterval = setInterval(() => {
                position = (position + 1) % 360;
                const floatOffset = Math.sin(position * Math.PI / 180) * 5;
                element.style.transform = `translateY(${floatOffset}px)`;
            }, 50);
        });
        
        element.addEventListener('mouseleave', () => {
            clearInterval(floatInterval);
            element.style.transform = 'translateY(0)';
        });
    });
}

/**
 * Enhanced loader animation
 */
function initLoaderAnimation() {
    const loaderWrapper = document.getElementById('loader-wrapper');
    const loader = document.querySelector('.loader');
    const loaderText = document.querySelector('.loader-text');
    
    if (loaderWrapper && loader && loaderText) {
        // Add pulsing effect to loader
        loader.classList.add('pulsing-loader');
        
        // Add typewriter effect to loader text
        const text = loaderText.textContent;
        loaderText.textContent = '';
        
        let i = 0;
        const typing = setInterval(() => {
            if (i < text.length) {
                loaderText.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typing);
            }
        }, 100);
    }
}

/**
 * Animate header elements on load
 */
function initHeaderAnimations() {
    const header = document.querySelector('.admin-header');
    const title = document.querySelector('.admin-header h1');
    const buttons = document.querySelectorAll('.admin-config-btn, .logout-btn');
    
    if (header) {
        header.classList.add('slide-in-down');
    }
    
    if (title) {
        title.classList.add('fade-in');
    }
    
    buttons.forEach((button, index) => {
        button.style.animationDelay = `${index * 0.2 + 0.3}s`;
        button.classList.add('slide-in-up');
    });
}

/**
 * Animate metric values when they update
 */
function animateMetricValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        // Add pulse animation
        element.classList.add('pulse-value');
        
        // Update value with typewriter effect
        const text = value.toString();
        element.textContent = '';
        
        let i = 0;
        const typing = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typing);
                // Remove animation class after completion
                setTimeout(() => {
                    element.classList.remove('pulse-value');
                }, 1000);
            }
        }, 150);
    }
}

/**
 * Add notification animation
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} slide-in-right`;
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.add('slide-out-right');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Export functions for use in other modules
window.adminAnimations = {
    init: initAdminAnimations,
    animateMetric: animateMetricValue,
    showNotification: showNotification
};

// Re-initialize animations when new content is loaded
document.addEventListener('contentUpdated', initAdminAnimations);