// Study Groups Module - Modern Animations and Enhanced Interactions

document.addEventListener('DOMContentLoaded', function() {
    // Initialize study groups animations
    initStudyGroupsAnimations();
});

function initStudyGroupsAnimations() {
    // Add ripple effects to buttons
    addRippleEffects();
    
    // Add hover effects to action buttons
    const actionButtons = document.querySelectorAll('button, .btn');
    actionButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
            this.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(255, 140, 0, 0.5)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
        });
        
        button.addEventListener('click', function() {
            this.style.transform = 'translateY(1px)';
            setTimeout(() => {
                this.style.transform = 'translateY(-3px)';
            }, 150);
        });
    });
    
    // Add hover effects to group cards
    const groupCards = document.querySelectorAll('.group-card');
    groupCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
            this.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 140, 0, 0.4)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
        });
    });
    
    // Add typing animation to chat input
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.01)';
        });
        
        chatInput.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    }
    
    // Add glow effect to send button when input has text
    if (chatInput) {
        chatInput.addEventListener('input', function() {
            const sendBtn = document.getElementById('send-message-btn');
            if (this.value.trim() !== '') {
                sendBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3), 0 0 15px rgba(255, 140, 0, 0.7)';
            } else {
                sendBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
            }
        });
    }
    
    // Add floating animation to header
    const header = document.querySelector('header');
    if (header) {
        setInterval(() => {
            header.style.transform = 'translateY(-2px)';
            setTimeout(() => {
                header.style.transform = 'translateY(0)';
            }, 1000);
        }, 6000);
    }
    
    // Add pulse animation to create group button
    const createGroupBtn = document.getElementById('create-group-btn');
    if (createGroupBtn) {
        setInterval(() => {
            createGroupBtn.style.boxShadow = '0 0 20px rgba(255, 140, 0, 0.8)';
            setTimeout(() => {
                createGroupBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
            }, 1000);
        }, 4000);
    }
    
    // Add message entry animations
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.classList && node.classList.contains('chat-message')) {
                            node.style.opacity = '0';
                            node.style.transform = 'translateX(20px)';
                            setTimeout(() => {
                                node.style.transition = 'all 0.3s ease-out';
                                node.style.opacity = '1';
                                node.style.transform = 'translateX(0)';
                            }, 10);
                        }
                    });
                }
            });
        });
        
        observer.observe(chatMessages, { childList: true, subtree: true });
    }
    
    // Add view transition animations
    setupViewTransitions();
}

// Add ripple effect to buttons
function addRippleEffects() {
    const buttons = document.querySelectorAll('button, .btn');
    buttons.forEach(button => {
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

// Setup view transitions
function setupViewTransitions() {
    // Add fade transition when switching views
    const views = document.querySelectorAll('#group-list-view, #create-group-view, #group-chat-view');
    views.forEach(view => {
        view.style.transition = 'opacity 0.3s ease-out';
    });
}

// Show view with animation
function showView(viewId) {
    // Hide all views
    const views = document.querySelectorAll('#group-list-view, #create-group-view, #group-chat-view');
    views.forEach(view => {
        view.style.opacity = '0';
        setTimeout(() => {
            view.style.display = 'none';
        }, 300);
    });
    
    // Show target view
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.style.display = 'block';
        setTimeout(() => {
            targetView.style.opacity = '1';
        }, 50);
    }
}

// Add message with animation
function addAnimatedMessage(content, sender, isOwn = false) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message');
    if (isOwn) {
        messageDiv.classList.add('own');
    }
    
    const now = new Date();
    const timeString = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-sender">${sender}</span>
            <span class="message-time">${timeString}</span>
        </div>
        <div class="message-content">${content}</div>
    `;
    
    // Apply initial animation state
    messageDiv.style.opacity = '0';
    messageDiv.style.transform = 'translateX(20px)';
    
    chatMessages.appendChild(messageDiv);
    
    // Trigger animation
    setTimeout(() => {
        messageDiv.style.transition = 'all 0.3s ease-out';
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateX(0)';
    }, 10);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
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

// Create group card with animation
function createGroupCard(groupData) {
    const groupList = document.getElementById('group-list');
    if (!groupList) return;
    
    const groupCard = document.createElement('div');
    groupCard.classList.add('group-card');
    groupCard.setAttribute('data-group-id', groupData.id);
    
    // Apply initial animation state
    groupCard.style.opacity = '0';
    groupCard.style.transform = 'translateY(20px)';
    
    groupCard.innerHTML = `
        <h3>${groupData.name}</h3>
        <p class="group-description">${groupData.description || 'No description provided'}</p>
        <div class="group-meta">
            <span class="member-count">${groupData.memberCount || 0} members</span>
            <span class="created-date">${formatDate(groupData.createdAt)}</span>
        </div>
    `;
    
    groupList.appendChild(groupCard);
    
    // Trigger animation
    setTimeout(() => {
        groupCard.style.transition = 'all 0.3s ease-out';
        groupCard.style.opacity = '1';
        groupCard.style.transform = 'translateY(0)';
    }, 10);
    
    return groupCard;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
    });
}

// Export functions for use in main study-groups.js
window.studyGroupsAnimations = {
    showView,
    addAnimatedMessage,
    addPulseAnimation,
    removePulseAnimation,
    createGroupCard
};