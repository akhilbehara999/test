// Dashboard Module Navigation Handler

document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard functionality
    initDashboard();
});

function initDashboard() {
    // Add click event listeners to all module cards
    const moduleCards = document.querySelectorAll('.module-card');
    moduleCards.forEach(card => {
        card.addEventListener('click', handleModuleClick);
        card.addEventListener('keydown', function(e) {
            // Allow activation with Enter or Space keys for accessibility
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleModuleClick.call(this, e);
            }
        });
    });
    
    // Add logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    console.log('Dashboard initialized with', moduleCards.length, 'modules');
}

function handleModuleClick(event) {
    // Get the module name from the data attribute
    const moduleCard = event.currentTarget;
    const moduleName = moduleCard.getAttribute('data-module');
    
    if (!moduleName) {
        console.error('Module name not found in data-module attribute');
        return;
    }
    
    // Add visual feedback
    moduleCard.style.transform = 'scale(0.95)';
    moduleCard.style.opacity = '0.7';
    
    // Navigate to the module after a short delay for visual feedback
    setTimeout(() => {
        navigateToModule(moduleName);
    }, 150);
}

function navigateToModule(moduleName) {
    // Map module names to their respective HTML files
    const modulePaths = {
        'lost-found': 'modules/lost-found/lost-found.html',
        'attendance': 'modules/attendance/attendance.html',
        'quiz': 'modules/quiz/quiz.html',
        'book': 'modules/book/book.html',
        'code-explainer': 'modules/code-explainer/code-explainer.html',
        'storage': 'modules/storage/storage.html',
        'chatbot': 'modules/chatbot/chatbot.html',
        'study-groups': 'modules/study-groups/study-groups.html'
    };
    
    // Get the path for the requested module
    const modulePath = modulePaths[moduleName];
    
    if (!modulePath) {
        console.error('Module path not found for:', moduleName);
        // Show error to user
        alert('Sorry, this module is not available.');
        // Reset visual feedback
        resetModuleCard(moduleName);
        return;
    }
    
    // Navigate to the module
    console.log('Navigating to module:', moduleName);
    window.location.href = modulePath;
}

function resetModuleCard(moduleName) {
    const moduleCard = document.querySelector(`.module-card[data-module="${moduleName}"]`);
    if (moduleCard) {
        moduleCard.style.transform = '';
        moduleCard.style.opacity = '';
    }
}

function handleLogout() {
    // Confirm logout
    if (confirm('Are you sure you want to logout?')) {
        // Clear any session data
        localStorage.removeItem('user-session');
        sessionStorage.clear();
        
        // Redirect to login page
        window.location.href = 'index.html';
    }
}

// Export functions for global access if needed
window.dashboard = {
    navigateToModule,
    handleLogout
};