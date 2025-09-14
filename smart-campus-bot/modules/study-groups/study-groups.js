document.addEventListener('DOMContentLoaded', () => {
    const groupListView = document.getElementById('group-list-view');
    const createGroupView = document.getElementById('create-group-view');
    const groupChatView = document.getElementById('group-chat-view');

    const createGroupBtn = document.getElementById('create-group-btn');
    const createGroupForm = document.getElementById('create-group-form');
    const cancelCreateBtn = document.getElementById('cancel-create-btn');
    const groupList = document.getElementById('group-list');

    const currentGroupName = document.getElementById('current-group-name');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendMessageBtn = document.getElementById('send-message-btn');
    const backToGroupsBtn = document.getElementById('back-to-groups-btn');

    const userViews = document.getElementById('user-views');
    const adminView = document.getElementById('admin-view');
    const groupsTableBody = document.querySelector('#groups-table tbody');

    // Initialize groups array - will be populated from Supabase
    let groups = [];
    let currentGroupId = null;
    let currentUserRole = null;

    const urlParams = new URLSearchParams(window.location.search);
    const isAdminView = urlParams.get('view') === 'admin';

    // Load groups from Supabase
    async function loadGroups() {
        console.log('Loading groups...');
        // First get current user
        let currentUser = null;
        const supabase = initStudyGroupsSupabase();
        if (supabase) {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (!error && user) {
                    currentUser = user;
                } else if (error) {
                    // Handle authentication errors
                    if (error.message.includes('JWT expired') || error.message.includes('Invalid JWT')) {
                        alert('Your session has expired. Please log in again.');
                        // Redirect to login page
                        window.location.href = '../../index.html';
                        return;
                    }
                    console.error('Error getting current user:', error);
                }
            } catch (error) {
                console.error('Error getting current user:', error);
            }
        }
        
        const result = await getAllGroups();
        if (result.success) {
            groups = result.data;
            // Add isAdmin flag to groups created by current user
            if (currentUser) {
                groups = groups.map(group => ({
                    ...group,
                    isAdmin: group.created_by === currentUser.id
                }));
            }
            
            // Check membership status for each group (only for non-admin groups)
            if (currentUser) {
                for (let i = 0; i < groups.length; i++) {
                    // If user is the creator, they are automatically a member
                    if (groups[i].isAdmin) {
                        groups[i].isMember = true;
                    } else {
                        // Check if user is explicitly a member
                        const membershipResult = await isGroupMember(groups[i].id);
                        if (membershipResult.success) {
                            groups[i].isMember = membershipResult.data;
                        }
                    }
                }
            }
        } else {
            // Handle authentication errors specifically
            if (result.error && (result.error.includes('JWT expired') || result.error.includes('Invalid JWT') || result.error.includes('Unauthorized'))) {
                alert('Your session has expired. Please log in again.');
                // Redirect to login page
                window.location.href = '../../index.html';
                return;
            }
            
            // Fallback to localStorage if Supabase fails
            groups = JSON.parse(localStorage.getItem('study-groups')) || [];
        }
        // Only re-render if groups have actually changed
        const oldGroupsJSON = JSON.stringify(groups.map(g => ({
            id: g.id,
            name: g.name,
            description: g.description,
            visibility: g.visibility,
            isAdmin: g.isAdmin,
            isMember: g.isMember,
            created_by_email: g.created_by_email
        })));
        
        const oldGroupsElement = groupList.querySelector('[data-groups-hash]');
        const oldHash = oldGroupsElement ? oldGroupsElement.dataset.groupsHash : null;
        const newHash = btoa(oldGroupsJSON);
        
        if (!oldHash || oldHash !== newHash) {
            console.log('Groups have changed, re-rendering group list');
            renderGroupList();
            groupList.setAttribute('data-groups-hash', newHash);
        } else {
            console.log('Groups have not changed, skipping re-render');
        }
        
        if (isAdminView) {
            renderGroupsTable();
        }
    }

    if (isAdminView) {
        userViews.style.display = 'none';
        adminView.style.display = 'block';
        document.querySelector('.back-link').href = '../../admin.html';
        document.querySelector('h1').textContent = 'Manage Study Groups';
    }

    function renderGroupList() {
        groupList.innerHTML = '';
        groups.forEach(group => {
            const groupCard = document.createElement('div');
            groupCard.className = 'group-card';
            
            // Display creator information
            const creatorInfo = group.created_by_email ? 
                `<div class="group-creator">Created by: ${sanitizeInput(group.created_by_email)}</div>` : 
                '';
            
            // Add admin badge if the current user is the group creator
            const adminBadge = group.isAdmin ? 
                `<span class="admin-badge">Admin</span>` : 
                '';
            
            // Add visibility indicator
            const visibilityIndicator = group.visibility === 'private' ? 
                `<div class="visibility-indicator">🔒 Private</div>` : 
                `<div class="visibility-indicator">🌐 Public</div>`;
            
            // Add membership status
            let membershipStatus = '';
            if (group.isAdmin) {
                membershipStatus = '<div class="membership-status member">You are the admin</div>';
            } else if (group.isMember) {
                membershipStatus = '<div class="membership-status member">You are a member</div>';
            } else {
                membershipStatus = '<div class="membership-status not-member">Not a member</div>';
            }
            
            // Add admin pencil icon (only visible to admins)
            const adminIcon = group.isAdmin ? 
                `<div class="admin-icon" data-group-id="${group.id}" title="Manage Group">
                    <span class="pencil-icon">✏️</span>
                </div>` : 
                '';
            
            // Add settings icon for admins
            const settingsIcon = group.isAdmin ? 
                `<div class="settings-icon" data-group-id="${group.id}" title="Group Settings">
                    <span class="gear-icon">⚙️</span>
                </div>` : 
                '';
            
            groupCard.innerHTML = `
                <div class="group-header">
                    <h3>${sanitizeInput(group.name)} ${adminBadge}</h3>
                    <div class="group-icons">
                        ${adminIcon}
                        ${settingsIcon}
                    </div>
                </div>
                <p>${sanitizeInput(group.description)}</p>
                ${visibilityIndicator}
                ${membershipStatus}
                ${creatorInfo}
                <div class="group-actions">
                    ${group.isAdmin ? '' : `<button class="join-leave-btn btn btn-primary" data-group-id="${group.id}">
                        ${group.isMember ? 'Leave Group' : (group.visibility === 'private' ? 'Request to Join' : 'Join Group')}
                    </button>`}
                </div>
            `;
            groupCard.dataset.groupId = group.id;
            groupCard.addEventListener('click', (e) => {
                // Only open chat if not clicking the join/leave button or admin icons
                if (!e.target.classList.contains('join-leave-btn') && 
                    !e.target.classList.contains('admin-icon') && 
                    !e.target.classList.contains('pencil-icon') &&
                    !e.target.classList.contains('settings-icon') &&
                    !e.target.classList.contains('gear-icon') &&
                    !e.target.classList.contains('btn')) {
                    openChat(group.id);
                }
            });
            
            groupList.appendChild(groupCard);
        });
        
        // Attach event listeners to all interactive elements
        // Use requestAnimationFrame for better timing
        requestAnimationFrame(() => {
            setTimeout(() => {
                attachGroupListEventListeners();
            }, 100); // Increased timeout to ensure DOM is fully rendered
        });
    }

    // Helper function to attach event listeners to group list elements
    function attachGroupListEventListeners() {
        // Add event listeners to join/leave buttons
        document.querySelectorAll('.join-leave-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const groupId = parseInt(button.dataset.groupId);
                const group = groups.find(g => g.id === groupId);
                
                if (group.isMember) {
                    // Leave group
                    const result = await leaveGroup(groupId);
                    if (result.success) {
                        group.isMember = false;
                        // No need to update member count since we're not displaying it
                        renderGroupList();
                    } else {
                        alert('Error leaving group: ' + result.error);
                    }
                } else {
                    // Join group or request to join
                    if (group.visibility === 'private') {
                        // For private groups, send a request
                        const result = await requestToJoinGroup(groupId);
                        if (result.success) {
                            alert('Request to join group sent successfully. Please wait for admin approval.');
                            // Refresh the group list to update the button state
                            await loadGroups();
                        } else {
                            alert('Error requesting to join group: ' + result.error);
                        }
                    } else {
                        // For public groups, join directly
                        const result = await joinGroup(groupId);
                        if (result.success) {
                            group.isMember = true;
                            // No need to update member count since we're not displaying it
                            renderGroupList();
                        } else {
                            alert('Error joining group: ' + result.error);
                        }
                    }
                }
            });
        });
        
        // Add event listeners to admin icons (pencil icons)
        document.querySelectorAll('.admin-icon').forEach(icon => {
            // Remove any existing event listeners to prevent duplicates
            const clone = icon.cloneNode(true);
            icon.parentNode.replaceChild(clone, icon);
            
            clone.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('Admin icon clicked, group ID:', clone.dataset.groupId);
                const groupId = parseInt(clone.dataset.groupId);
                openAdminPanel(groupId);
            });
        });
        
        // Add event listeners to settings icons
        const settingsIcons = document.querySelectorAll('.settings-icon');
        console.log('Found', settingsIcons.length, 'settings icons');
        settingsIcons.forEach(icon => {
            // Remove any existing event listeners to prevent duplicates
            const clone = icon.cloneNode(true);
            icon.parentNode.replaceChild(clone, icon);
            
            clone.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('Settings icon clicked, group ID:', clone.dataset.groupId);
                const groupId = parseInt(clone.dataset.groupId);
                if (groupId) {
                    openGroupSettings(groupId);
                } else {
                    console.error('Invalid group ID for settings icon');
                }
            });
        });
        
        // Add event listeners to delete group buttons
        document.querySelectorAll('.delete-group-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const groupId = parseInt(button.dataset.groupId);
                
                if (confirm('Are you sure you want to delete this group? This action cannot be undone and will remove all group data including messages and members.')) {
                    const result = await deleteGroup(groupId);
                    if (result.success) {
                        // Remove the group from our local array
                        groups = groups.filter(g => g.id !== groupId);
                        
                        // Reload groups to reflect changes
                        await loadGroups();
                        
                        // Show success message
                        alert('Group deleted successfully.');
                    } else {
                        alert('Error deleting group: ' + result.error);
                    }
                }
            });
        });
    }

    async function openChat(groupId) {
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        currentGroupId = groupId;
        currentGroupName.textContent = sanitizeInput(group.name);
        currentGroupName.title = sanitizeInput(group.name); // Set title for tooltip on long names
        
        // Set button texts
        sendMessageBtn.textContent = '📤 Send';
        
        // Show chat view immediately for better UX
        groupListView.style.display = 'none';
        groupChatView.style.display = 'flex'; // Changed to flex for better layout
        
        // Set up message sending
        sendMessageBtn.onclick = sendMessage;
        chatInput.onkeypress = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        };
        
        // Clear any existing message refresh interval to prevent multiple intervals
        if (window.messageRefreshInterval) {
            clearInterval(window.messageRefreshInterval);
            window.messageRefreshInterval = null;
        }
        
        // Set up periodic message refresh only if we're in a chat view
        if (currentGroupId) {
            window.messageRefreshInterval = setInterval(loadGroupMessages, 5000);
        }
        
        // Show loading indicator while messages load
        showChatLoadingIndicator();
        
        // Load messages in background
        await loadGroupMessages();
        
        // Focus the input field for better UX
        setTimeout(() => {
            if (chatInput) {
                chatInput.focus();
            }
        }, 300);
    }

    // Function to show loading indicator in chat
    function showChatLoadingIndicator() {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        // Clear existing content and show loading
        chatMessages.innerHTML = `
            <div class="chat-loading">
                <div class="loading-spinner"></div>
                <p>Loading messages...</p>
            </div>
        `;
    }

    // Function to hide loading indicator
    function hideChatLoadingIndicator() {
        const loadingIndicator = document.querySelector('.chat-loading');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }

    async function loadGroupMembers(groupId) {
        // Show loading indicator for admin users
        if (currentUserRole === 'admin') {
            // Remove any existing members container or error message
            const existingContainer = document.querySelector('.group-members-container');
            const existingError = document.querySelector('.members-error-message');
            if (existingContainer) existingContainer.remove();
            if (existingError) existingError.remove();
            
            // Create loading indicator
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'members-loading';
            loadingIndicator.innerHTML = `
                <p style="color: #FF8C00; padding: 15px; text-align: center;">
                    <span style="display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(255, 140, 0, 0.3); border-top: 3px solid #FF8C00; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px;"></span>
                    Loading group members...
                </p>
            `;
            
            // Insert after chat messages
            chatMessages.parentNode.insertBefore(loadingIndicator, chatMessages.nextSibling);
        }
        
        const result = await getGroupMembers(groupId);
        
        // Remove loading indicator
        const loadingIndicator = document.querySelector('.members-loading');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
        
        if (result.success) {
            await renderGroupMembers(result.data);
        } else {
            console.error('Failed to load group members:', result.error);
            // Show error message to admin users only
            if (currentUserRole === 'admin') {
                // Create error message element
                const errorMessage = document.createElement('div');
                errorMessage.className = 'members-error-message';
                errorMessage.innerHTML = `
                    <p style="color: #ff6b6b; padding: 15px; border: 1px solid #ff6b6b; border-radius: 8px; background: rgba(255, 107, 107, 0.1);">
                        <strong>Error loading group members:</strong> ${sanitizeInput(result.error)}<br>
                        Please try refreshing the page or contact an administrator if this issue persists.
                    </p>
                `;
                
                // Insert after chat messages
                chatMessages.parentNode.insertBefore(errorMessage, chatMessages.nextSibling);
            }
        }
    }

    async function renderGroupMembers(members) {
        // Only show member management to admins
        if (currentUserRole !== 'admin') return;
        
        // Remove any existing members container
        const existingContainer = document.querySelector('.group-members-container');
        if (existingContainer) {
            existingContainer.remove();
        }
        
        // Don't render if no members
        if (!members || members.length === 0) return;
        
        const membersContainer = document.createElement('div');
        membersContainer.className = 'group-members-container';
        membersContainer.innerHTML = '<h3>Group Members</h3>';
        
        const membersList = document.createElement('ul');
        membersList.className = 'group-members-list';
        
        // Get current user ID synchronously
        const currentUserId = await getCurrentUserId();
        
        members.forEach(member => {
            const memberItem = document.createElement('li');
            memberItem.className = 'group-member-item';
            
            // Create buttons container
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'member-actions';
            
            // Only show action buttons for other members (not current user)
            if (member.user_id !== currentUserId) {
                if (member.role === 'member') {
                    const promoteBtn = document.createElement('button');
                    promoteBtn.className = 'promote-btn';
                    promoteBtn.textContent = 'Promote to Admin';
                    promoteBtn.dataset.userId = member.user_id;
                    promoteBtn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const result = await promoteMember(currentGroupId, member.user_id);
                        if (result.success) {
                            loadGroupMembers(currentGroupId);
                        } else {
                            alert('Error promoting member: ' + result.error);
                        }
                    });
                    buttonsContainer.appendChild(promoteBtn);
                } else if (member.role === 'admin') {
                    const demoteBtn = document.createElement('button');
                    demoteBtn.className = 'demote-btn';
                    demoteBtn.textContent = 'Demote to Member';
                    demoteBtn.dataset.userId = member.user_id;
                    demoteBtn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const result = await demoteAdmin(currentGroupId, member.user_id);
                        if (result.success) {
                            loadGroupMembers(currentGroupId);
                        } else {
                            alert('Error demoting admin: ' + result.error);
                        }
                    });
                    buttonsContainer.appendChild(demoteBtn);
                }
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.textContent = 'Remove';
                removeBtn.dataset.userId = member.user_id;
                removeBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to remove this member from the group?')) {
                        const result = await removeMember(currentGroupId, member.user_id);
                        if (result.success) {
                            loadGroupMembers(currentGroupId);
                        } else {
                            alert('Error removing member: ' + result.error);
                        }
                    }
                });
                buttonsContainer.appendChild(removeBtn);
            }
            
            memberItem.innerHTML = `
                <span class="member-info">${sanitizeInput(member.user.email || member.user_id)} <span class="member-role">(${member.role})</span></span>
            `;
            memberItem.appendChild(buttonsContainer);
            membersList.appendChild(memberItem);
        });
        
        membersContainer.appendChild(membersList);
        // Insert after chat messages
        chatMessages.parentNode.insertBefore(membersContainer, chatMessages.nextSibling);
    }

    // Helper function to get current user ID
    async function getCurrentUserId() {
        const supabase = initStudyGroupsSupabase();
        if (supabase) {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (!error && user) {
                    return user.id;
                }
            } catch (error) {
                console.error('Error getting current user:', error);
            }
        }
        return null;
    }

    // Function to render messages in the chat with improved styling
    function renderMessages(messages) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        // Show empty state if no messages
        if (!messages || messages.length === 0) {
            // Only update if not already showing empty state
            if (!chatMessages.querySelector('.chat-empty-state')) {
                chatMessages.innerHTML = '';
                const emptyState = document.createElement('div');
                emptyState.className = 'chat-empty-state';
                emptyState.innerHTML = `
                    <div class="chat-empty-state-icon">💬</div>
                    <div class="chat-empty-state-text">
                        <strong>No messages yet!</strong><br>
                        Be the first to start a conversation in this study group.
                    </div>
                `;
                chatMessages.appendChild(emptyState);
            }
            return;
        }
        
        // Create a document fragment to build messages efficiently
        const fragment = document.createDocumentFragment();
        
        messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            
            // Check if this message is from the current user
            const currentUserId = getCurrentUserIdSync();
            const isOwnMessage = msg.user_id === currentUserId;
            
            if (isOwnMessage) {
                messageElement.classList.add('own');
            }
            
            // Format the timestamp
            const messageTime = new Date(msg.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            // Get user display name
            const userDisplayName = msg.user_name || msg.user_email || 'Anonymous';
            
            messageElement.innerHTML = `
                <div class="message-header">
                    <span class="message-user">${sanitizeInput(userDisplayName)}</span>
                    <span class="message-time">${messageTime}</span>
                </div>
                <div class="message-content">${sanitizeInput(msg.message)}</div>
            `;
            fragment.appendChild(messageElement);
        });
        
        // Only update the DOM if the content has actually changed to prevent flickering
        const newContentHTML = Array.from(fragment.children).map(el => el.outerHTML).join('');
        const oldContentHTML = chatMessages.innerHTML;
        
        // Clear loading indicator if present
        const loadingIndicator = chatMessages.querySelector('.chat-loading');
        if (loadingIndicator) {
            chatMessages.innerHTML = '';
            chatMessages.appendChild(fragment);
        } else if (newContentHTML !== oldContentHTML) {
            // Only update if content is different
            chatMessages.innerHTML = '';
            chatMessages.appendChild(fragment);
        }
        
        // Scroll to bottom smoothly only if user is near the bottom
        const isNearBottom = chatMessages.scrollTop + chatMessages.clientHeight >= chatMessages.scrollHeight - 100;
        if (isNearBottom) {
            chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        }
    }

    // Helper function to get current user ID synchronously
    function getCurrentUserIdSync() {
        // Try to get from Supabase auth first
        const supabase = initStudyGroupsSupabase();
        if (supabase && supabase.auth && typeof supabase.auth.getUser === 'function') {
            // In a real implementation, you would get the current user ID from Supabase
            // For now, we'll use a more reliable method
            const storedUserId = localStorage.getItem('currentUserId');
            if (storedUserId) return storedUserId;
        }
        // Fallback to localStorage
        return localStorage.getItem('currentUserId') || null;
    }

    // Function to show typing indicator
    function showTypingIndicator() {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        // Remove existing typing indicator if any
        const existingIndicator = document.querySelector('.typing-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Create new typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = `
            <div class="typing-text">Someone is typing...</div>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        
        chatMessages.appendChild(typingIndicator);
        
        // Scroll to bottom to show the indicator
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Function to hide typing indicator
    function hideTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Enhanced function to send a message
    async function sendMessage() {
        const chatInput = document.getElementById('chat-input');
        const message = chatInput.value.trim();
        if (!message || !currentGroupId) return;

        // Add message to UI immediately for better UX
        const tempMessage = {
            message: message,
            user_id: getCurrentUserIdSync(),
            user_name: 'You',
            created_at: new Date().toISOString()
        };
        
        // Clear input first
        chatInput.value = '';
        
        // Render the temporary message
        const messages = JSON.parse(localStorage.getItem(`group-messages-${currentGroupId}`) || '[]');
        messages.push(tempMessage);
        renderMessages(messages);
        
        try {
            // Send to backend
            const result = await sendGroupMessage(currentGroupId, message);
            if (result.success) {
                // Reload messages to show the confirmed message
                await loadGroupMessages();
            } else {
                // Remove the temporary message and show error
                const index = messages.findIndex(m => m.message === message && m.user_id === tempMessage.user_id);
                if (index > -1) {
                    messages.splice(index, 1);
                    renderMessages(messages);
                }
                console.error('Error sending message:', result.error);
            }
        } catch (error) {
            // Handle network errors
            const index = messages.findIndex(m => m.message === message && m.user_id === tempMessage.user_id);
            if (index > -1) {
                messages.splice(index, 1);
                renderMessages(messages);
            }
            console.error('Network error sending message:', error);
        }
    }

    // Enhanced function to load group messages
    async function loadGroupMessages() {
        if (!currentGroupId) return;

        try {
            const result = await getGroupMessages(currentGroupId);
            if (result.success) {
                hideChatLoadingIndicator();
                renderMessages(result.data);
            } else {
                // Handle authentication errors specifically
                if (result.error && (result.error.includes('JWT expired') || result.error.includes('Invalid JWT') || result.error.includes('Unauthorized'))) {
                    alert('Your session has expired. Please log in again.');
                    window.location.href = '../../index.html';
                    return;
                }
                console.error('Error loading messages:', result.error);
                
                // Show error in chat
                const chatMessages = document.getElementById('chat-messages');
                if (chatMessages) {
                    hideChatLoadingIndicator();
                    chatMessages.innerHTML = `
                        <div class="chat-empty-state">
                            <div class="chat-empty-state-icon">⚠️</div>
                            <div class="chat-empty-state-text">
                                <strong>Error loading messages</strong><br>
                                ${sanitizeInput(result.error)}<br>
                                Please try refreshing the page.
                            </div>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Network error loading messages:', error);
            
            // Show network error in chat
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                hideChatLoadingIndicator();
                chatMessages.innerHTML = `
                    <div class="chat-empty-state">
                        <div class="chat-empty-state-icon">🌐</div>
                        <div class="chat-empty-state-text">
                            <strong>Network Error</strong><br>
                            Unable to load messages. Please check your connection and try again.
                        </div>
                    </div>
                `;
            }
        }
    }

    // Function to open group settings modal
    function openGroupSettings(groupId) {
        const group = groups.find(g => g.id === groupId);
        if (!group) {
            console.error('Group not found for ID:', groupId);
            return;
        }

        // Remove any existing modals to prevent duplicates
        const existingModals = document.querySelectorAll('.modal');
        existingModals.forEach(modal => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        });

        // Create settings modal with improved structure
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Group Settings</h2>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="group-settings-form">
                        <div class="form-group">
                            <label for="group-name">Group Name</label>
                            <input type="text" id="group-name" value="${sanitizeInput(group.name)}" required placeholder="Enter group name">
                        </div>
                        
                        <div class="form-group">
                            <label for="group-description">Description</label>
                            <textarea id="group-description" placeholder="Enter group description">${sanitizeInput(group.description || '')}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="group-visibility">Visibility</label>
                            <select id="group-visibility">
                                <option value="public" ${group.visibility === 'public' ? 'selected' : ''}>Public - Anyone can join</option>
                                <option value="private" ${group.visibility === 'private' ? 'selected' : ''}>Private - Request to join</option>
                            </select>
                        </div>
                        
                        <button type="submit" class="btn btn-primary">💾 Save Changes</button>
                        <button type="button" id="delete-group-btn" class="btn btn-danger">🗑️ Delete Group</button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Improve modal positioning for better responsiveness
        function adjustModalPosition() {
            const modalContent = modal.querySelector('.modal-content');
            if (!modalContent) return;
            
            // Reset any previous styles that might interfere with flexbox centering
            modalContent.style.margin = '';
            modalContent.style.maxHeight = '';
            modalContent.style.width = '';
            
            // Get viewport dimensions
            const viewportWidth = window.innerWidth;
            
            // Set max width based on viewport to prevent overflow
            if (viewportWidth <= 480) {
                modalContent.style.width = 'calc(100vw - 20px)';
            } else if (viewportWidth <= 768) {
                modalContent.style.width = 'calc(100vw - 30px)';
            }
            
            // Set max height based on viewport
            if (viewportWidth <= 480) {
                modalContent.style.maxHeight = 'calc(100vh - 10px)';
            } else if (viewportWidth <= 768) {
                modalContent.style.maxHeight = 'calc(100vh - 20px)';
            } else {
                modalContent.style.maxHeight = '90vh';
            }
        }

        // Adjust modal position immediately and then again after a short delay to ensure proper rendering
        adjustModalPosition();
        
        // Add a small delay to ensure content is fully rendered before final positioning
        setTimeout(adjustModalPosition, 50);
        
        window.addEventListener('resize', adjustModalPosition);

        // Add event listeners
        const closeBtn = modal.querySelector('.close');
        const closeModal = () => {
            window.removeEventListener('resize', adjustModalPosition);
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        };
        closeBtn.addEventListener('click', closeModal);

        const form = modal.querySelector('#group-settings-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form values directly from the input elements within the modal
            const nameInput = modal.querySelector('#group-name');
            const descriptionInput = modal.querySelector('#group-description');
            const visibilityInput = modal.querySelector('#group-visibility');
            
            const name = nameInput && nameInput.value ? nameInput.value.trim() : '';
            const description = descriptionInput && descriptionInput.value ? descriptionInput.value.trim() : '';
            const visibility = visibilityInput ? visibilityInput.value : 'public';
            
            // Validate that name is not empty
            if (!name) {
                alert('Please enter a group name.');
                if (nameInput) nameInput.focus();
                return;
            }

            const result = await updateGroupSettings(groupId, { name, description, visibility });
            if (result.success) {
                // Find the group in our local array and update it immediately
                const groupIndex = groups.findIndex(g => g.id === groupId);
                if (groupIndex !== -1) {
                    // Update the specific group with the returned data
                    groups[groupIndex] = { ...groups[groupIndex], ...result.data };
                }
                
                // Also reload groups from database to ensure we have the latest data
                await loadGroups();
                
                // Close the modal
                closeModal();
                
                // Show success message
                alert('Group settings updated successfully!');
            } else {
                alert('Error updating group settings: ' + result.error);
            }
        });

        // Add delete group functionality
        const deleteGroupBtn = modal.querySelector('#delete-group-btn');
        deleteGroupBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this group? This action cannot be undone and will remove all group data including messages and members.')) {
                const result = await deleteGroup(groupId);
                if (result.success) {
                    // Remove the group from our local array
                    groups = groups.filter(g => g.id !== groupId);
                    
                    // Reload groups to reflect changes
                    await loadGroups();
                    
                    // Close the modal
                    closeModal();
                    
                    // Show success message
                    alert('Group deleted successfully.');
                } else {
                    alert('Error deleting group: ' + result.error);
                }
            }
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });
        
        // Close modal when pressing Escape key
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    // Function to open admin panel for group management
    async function openAdminPanel(groupId) {
        const group = groups.find(g => g.id === groupId);
        if (!group) {
            console.error('Group not found for ID:', groupId);
            return;
        }
        
        // Remove any existing admin modals
        const existingModals = document.querySelectorAll('.admin-modal');
        existingModals.forEach(modal => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        });
        
        // Create modal for admin features
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.innerHTML = `
            <div class="admin-modal-content">
                <div class="admin-modal-header">
                    <h2>Manage Group: ${sanitizeInput(group.name)}</h2>
                    <span class="admin-modal-close">&times;</span>
                </div>
                <div class="admin-modal-body">
                    <div class="admin-loading">🔄 Loading group members and requests...</div>
                </div>
            </div>
        `;
        
        // Ensure modal is added to body
        if (document.body) {
            document.body.appendChild(modal);
        } else {
            console.error('Document body not found');
            return;
        }
        
        // Improve modal positioning for better responsiveness
        function adjustAdminModalPosition() {
            const modalContent = modal.querySelector('.admin-modal-content');
            if (!modalContent) return;
            
            // Reset any previous styles
            modalContent.style.margin = '';
            modalContent.style.maxHeight = '';
            modalContent.style.width = '';
            
            // Get viewport dimensions
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Set max width based on viewport to prevent overflow
            if (viewportWidth <= 480) {
                modalContent.style.width = 'calc(100vw - 20px)';
            } else if (viewportWidth <= 768) {
                modalContent.style.width = 'calc(100vw - 30px)';
            }
            
            // Force a reflow to ensure the width is applied before measuring
            modalContent.offsetHeight;
            
            // Get modal dimensions after potential width adjustment
            const modalRect = modalContent.getBoundingClientRect();
            const modalWidth = modalRect.width;
            const modalHeight = modalRect.height;
            
            // Calculate margins to center the modal
            const horizontalMargin = Math.max(0, (viewportWidth - modalWidth) / 2);
            const verticalMargin = Math.max(0, (viewportHeight - modalHeight) / 2);
            
            // Apply margins for centering, ensuring minimum margins for small screens
            const minHorizontalMargin = viewportWidth <= 480 ? 5 : 10;
            const minVerticalMargin = viewportWidth <= 480 ? 5 : 10;
            
            modalContent.style.margin = `${Math.max(minVerticalMargin, verticalMargin)}px ${Math.max(minHorizontalMargin, horizontalMargin)}px`;
            
            // Set max height based on viewport
            if (viewportWidth <= 480) {
                modalContent.style.maxHeight = 'calc(100vh - 10px)';
            } else if (viewportWidth <= 768) {
                modalContent.style.maxHeight = 'calc(100vh - 20px)';
            } else {
                modalContent.style.maxHeight = '90vh';
            }
        }

        // Adjust modal position immediately and then again after a short delay to ensure proper rendering
        adjustAdminModalPosition();
        
        // Add a small delay to ensure content is fully rendered before final positioning
        setTimeout(adjustAdminModalPosition, 50);
        
        window.addEventListener('resize', adjustAdminModalPosition);
        
        // Add close functionality
        const closeModal = modal.querySelector('.admin-modal-close');
        const closeHandler = () => {
            window.removeEventListener('resize', adjustAdminModalPosition);
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        };
        closeModal.addEventListener('click', closeHandler);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeHandler();
            }
        });
        
        // Close modal when pressing Escape key
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                closeHandler();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        // Load group members and requests
        const membersResult = await getGroupMembers(groupId);
        const requestsResult = await getGroupRequests(groupId);
        
        const modalBody = modal.querySelector('.admin-modal-body');
        modalBody.innerHTML = '';
        
        // Create members section
        const membersContainer = document.createElement('div');
        membersContainer.className = 'admin-members-list';
        
        if (membersResult.success) {
            if (membersResult.data.length > 0) {
                membersContainer.innerHTML = '<h3>Group Members</h3>';
                const membersList = document.createElement('div');
                membersList.className = 'admin-members-items';
                
                // Get current user ID
                const currentUserId = await getCurrentUserId();
                
                membersResult.data.forEach(member => {
                    const memberItem = document.createElement('div');
                    memberItem.className = 'admin-member-item';
                    
                    // Create buttons container
                    const buttonsContainer = document.createElement('div');
                    buttonsContainer.className = 'admin-member-actions';
                    
                    // Only show action buttons for other members (not current user)
                    if (member.user_id !== currentUserId) {
                        if (member.role === 'member') {
                            const promoteBtn = document.createElement('button');
                            promoteBtn.className = 'promote-btn';
                            promoteBtn.textContent = 'Promote to Admin';
                            promoteBtn.dataset.userId = member.user_id;
                            promoteBtn.addEventListener('click', async (e) => {
                                e.stopPropagation();
                                const result = await promoteMember(groupId, member.user_id);
                                if (result.success) {
                                    openAdminPanel(groupId); // Refresh the panel
                                } else {
                                    alert('Error promoting member: ' + result.error);
                                }
                            });
                            buttonsContainer.appendChild(promoteBtn);
                        } else if (member.role === 'admin') {
                            const demoteBtn = document.createElement('button');
                            demoteBtn.className = 'demote-btn';
                            demoteBtn.textContent = 'Demote to Member';
                            demoteBtn.dataset.userId = member.user_id;
                            demoteBtn.addEventListener('click', async (e) => {
                                e.stopPropagation();
                                const result = await demoteAdmin(groupId, member.user_id);
                                if (result.success) {
                                    openAdminPanel(groupId); // Refresh the panel
                                } else {
                                    alert('Error demoting admin: ' + result.error);
                                }
                            });
                            buttonsContainer.appendChild(demoteBtn);
                        }
                        
                        const removeBtn = document.createElement('button');
                        removeBtn.className = 'remove-btn';
                        removeBtn.textContent = 'Remove';
                        removeBtn.dataset.userId = member.user_id;
                        removeBtn.addEventListener('click', async (e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to remove this member from the group?')) {
                                const result = await removeMember(groupId, member.user_id);
                                if (result.success) {
                                    openAdminPanel(groupId); // Refresh the panel
                                } else {
                                    alert('Error removing member: ' + result.error);
                                }
                            }
                        });
                        buttonsContainer.appendChild(removeBtn);
                    }
                    
                    memberItem.innerHTML = `
                        <div class="member-info">
                            <span class="member-name">${sanitizeInput(member.user.name || member.user.email || member.user_id)}</span>
                            <span class="member-role">(${member.role})</span>
                        </div>
                    `;
                    memberItem.appendChild(buttonsContainer);
                    membersList.appendChild(memberItem);
                });
                
                membersContainer.appendChild(membersList);
            } else {
                membersContainer.innerHTML = '<h3>Group Members</h3><p>No members found in this group.</p>';
            }
        } else {
            membersContainer.innerHTML = `<h3>Group Members</h3><p>Error loading members: ${sanitizeInput(membersResult.error)}</p>`;
        }
        
        modalBody.appendChild(membersContainer);
        
        // Create requests section
        const requestsContainer = document.createElement('div');
        requestsContainer.className = 'admin-requests-list';
        
        if (requestsResult.success) {
            if (requestsResult.data.length > 0) {
                requestsContainer.innerHTML = '<h3>Pending Requests</h3>';
                const requestsList = document.createElement('div');
                requestsList.className = 'admin-requests-items';
                
                requestsResult.data.forEach(request => {
                    const requestItem = document.createElement('div');
                    requestItem.className = 'admin-request-item';
                    
                    const buttonsContainer = document.createElement('div');
                    buttonsContainer.className = 'admin-request-actions';
                    
                    const approveBtn = document.createElement('button');
                    approveBtn.className = 'approve-btn';
                    approveBtn.textContent = 'Approve';
                    approveBtn.dataset.requestId = request.id;
                    approveBtn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const result = await processGroupRequest(request.id, 'approved');
                        if (result.success) {
                            openAdminPanel(groupId); // Refresh the panel
                        } else {
                            alert('Error approving request: ' + result.error);
                        }
                    });
                    buttonsContainer.appendChild(approveBtn);
                    
                    const rejectBtn = document.createElement('button');
                    rejectBtn.className = 'reject-btn';
                    rejectBtn.textContent = 'Reject';
                    rejectBtn.dataset.requestId = request.id;
                    rejectBtn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const result = await processGroupRequest(request.id, 'rejected');
                        if (result.success) {
                            openAdminPanel(groupId); // Refresh the panel
                        } else {
                            alert('Error rejecting request: ' + result.error);
                        }
                    });
                    buttonsContainer.appendChild(rejectBtn);
                    
                    requestItem.innerHTML = `
                        <div class="request-info">
                            <span class="request-name">${sanitizeInput(request.user_name || request.user_email || 'Unknown User')}</span>
                            <span class="request-date">Requested on: ${new Date(request.created_at).toLocaleDateString()}</span>
                        </div>
                    `;
                    requestItem.appendChild(buttonsContainer);
                    requestsList.appendChild(requestItem);
                });
                
                requestsContainer.appendChild(requestsList);
            } else {
                requestsContainer.innerHTML = '<h3>Pending Requests</h3><p>No pending requests for this group.</p>';
            }
        } else {
            requestsContainer.innerHTML = `<h3>Pending Requests</h3><p>Error loading requests: ${sanitizeInput(requestsResult.error)}</p>`;
        }
        
        modalBody.appendChild(requestsContainer);
    }

    /**
     * Renders the groups into the admin management table.
     */
    function renderGroupsTable() {
        if (!groupsTableBody) return;
        groupsTableBody.innerHTML = '';

        groups.forEach(group => {
            const row = groupsTableBody.insertRow();
            // Ensure members and status exist for older group data
            const members = group.member_count || 1;
            const status = group.status || 'active';
            const creator = group.created_by_email || 'Anonymous';

            row.innerHTML = `
                <td>${sanitizeInput(group.name)}</td>
                <td>${members}</td>
                <td>${sanitizeInput(creator)}</td>
                <td><span class="status-badge status-${status}">${status}</span></td>
                <td>
                    <button class="action-btn archive-btn" data-id="${group.id}">${status === 'active' ? 'Archive' : 'Activate'}</button>
                    <button class="action-btn delete-btn" data-id="${group.id}">Delete</button>
                </td>
            `;
        });
    }

    if (groupsTableBody) {
        groupsTableBody.addEventListener('click', async (e) => {
            const target = e.target;
            if (target.classList.contains('action-btn')) {
                const groupId = parseInt(target.dataset.id);

                if (target.classList.contains('delete-btn')) {
                    if (confirm('Are you sure you want to permanently delete this group?')) {
                        const result = await deleteGroup(groupId);
                        if (result.success) {
                            groups = groups.filter(g => g.id !== groupId);
                            renderGroupsTable();
                        } else {
                            console.error('Error deleting group:', result.error);
                            alert('Error deleting group. Please try again.');
                        }
                    }
                } else if (target.classList.contains('archive-btn')) {
                    const group = groups.find(g => g.id === groupId);
                    if (group) {
                        const newStatus = group.status === 'active' ? 'archived' : 'active';
                        const result = await updateGroupStatus(groupId, newStatus);
                        if (result.success) {
                            group.status = newStatus;
                            renderGroupsTable();
                        } else {
                            console.error('Error updating group status:', result.error);
                            alert('Error updating group status. Please try again.');
                        }
                    }
                }
            }
        });
    }

    // --- Announcement Logic ---
    const announcementForm = document.getElementById('announcement-form');
    if (announcementForm) {
        announcementForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const messageText = document.getElementById('announcement-message').value.trim();
            if (messageText === '') {
                alert('Please enter an announcement message.');
                return;
            }

            // Add the announcement to every group's chat
            groups.forEach(group => {
                if (!group.messages) {
                    group.messages = [];
                }
                group.messages.push({
                    sender: 'ANNOUNCEMENT',
                    text: messageText
                });
            });

            // In a full implementation, this would also save to Supabase
            alert('Announcement sent to all groups!');
            announcementForm.reset();
        });
    }

    // Load groups when page loads
    loadGroups();

    // Add event listeners for create group functionality
    if (createGroupBtn) {
        createGroupBtn.addEventListener('click', () => {
            groupListView.style.display = 'none';
            createGroupView.style.display = 'block';
        });
    }

    if (cancelCreateBtn) {
        cancelCreateBtn.addEventListener('click', () => {
            createGroupView.style.display = 'none';
            groupListView.style.display = 'block';
            if (createGroupForm) {
                createGroupForm.reset();
            }
        });
    }

    if (createGroupForm) {
        createGroupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const groupName = document.getElementById('group-name').value.trim();
            const groupDescription = document.getElementById('group-description').value.trim();
            
            if (!groupName) {
                alert('Please enter a group name.');
                return;
            }
            
            const result = await createGroup({
                name: groupName,
                description: groupDescription
            });
            
            if (result.success) {
                // Reset form and switch views
                createGroupForm.reset();
                createGroupView.style.display = 'none';
                groupListView.style.display = 'block';
                
                // Reload groups to show the new one
                await loadGroups();
            } else {
                alert('Error creating group: ' + result.error);
            }
        });
    }

    // Add event listener for back to groups button
    if (backToGroupsBtn) {
        backToGroupsBtn.addEventListener('click', () => {
            console.log('Back to groups button clicked');
            groupChatView.style.display = 'none';
            groupListView.style.display = 'block';
            currentGroupId = null;
            // Clear message refresh interval when leaving chat
            if (window.messageRefreshInterval) {
                console.log('Clearing message refresh interval');
                clearInterval(window.messageRefreshInterval);
                window.messageRefreshInterval = null;
            }
            // Also clear any existing modals
            const existingModals = document.querySelectorAll('.admin-modal, .modal');
            existingModals.forEach(modal => {
                console.log('Removing modal:', modal.className);
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            });
        });
    }

});