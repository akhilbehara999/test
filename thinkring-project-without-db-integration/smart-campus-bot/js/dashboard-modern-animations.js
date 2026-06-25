// Dashboard Modern Animations and Enhanced Interactions

document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard animations
    initDashboardAnimations();
});

function initDashboardAnimations() {
    // Add body class for modern styling
    document.body.classList.add('dashboard-modern');
    
    // Add ripple effects to module cards
    addRippleEffects();
    
    // Add hover effects to module cards
    const moduleCards = document.querySelectorAll('.module-card');
    moduleCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
            this.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(99, 102, 241, 0.3)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
        });
    });
    
    // Add floating animation to header
    const header = document.querySelector('.dashboard-header');
    if (header) {
        setInterval(() => {
            header.style.transform = 'translateY(-2px)';
            setTimeout(() => {
                header.style.transform = 'translateY(0)';
            }, 1000);
        }, 6000);
    }
    
    // Add pulse animation to logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        setInterval(() => {
            logoutBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3), 0 0 15px rgba(239, 68, 68, 0.7)';
            setTimeout(() => {
                logoutBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
            }, 1000);
        }, 4000);
    }
    
    // Add entrance animations to module cards
    animateModuleCards();
}

// Add ripple effect to module cards
function addRippleEffects() {
    const moduleCards = document.querySelectorAll('.module-card');
    moduleCards.forEach(card => {
        card.addEventListener('click', function(e) {
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

// Animate module cards entrance
function animateModuleCards() {
    const moduleCards = document.querySelectorAll('.module-card');
    moduleCards.forEach((card, index) => {
        // Reset styles for animation
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        // Trigger animation with staggered delays
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 + (index * 100));
    });
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

// Export functions for use in dashboard.js
window.dashboardAnimations = {
    addPulseAnimation,
    removePulseAnimation
};