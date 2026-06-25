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

    // Create message display container if it doesn't exist
    let messageDisplay = document.getElementById('message-display');
    if (!messageDisplay) {
        messageDisplay = document.createElement('div');
        messageDisplay.id = 'message-display';
        document.body.appendChild(messageDisplay);
    }

    // Debug logging
    console.log('DOM Elements:', {
        groupListView: !!groupListView,
        createGroupView: !!createGroupView,
        groupChatView: !!groupChatView,
        backToGroupsBtn: !!backToGroupsBtn
    });

    let groups = [];
    let currentGroupId = null;
    let currentGroup = null;

    const urlParams = new URLSearchParams(window.location.search);
    const isAdminView = urlParams.get('view') === 'admin';

    // Check if user is admin
    function isAdmin() {
        return localStorage.getItem('userRole') === 'admin';
    }

    // Check if user is the creator of a group
    function isGroupCreator(group) {
        const username = localStorage.getItem('username') || 'Anonymous';
        return group.createdBy === username;
    }

    // Check if user is a member of a group
    function isGroupMember(group) {
        const username = localStorage.getItem('username') || 'Anonymous';
        return group.members && group.members.includes(username);
    }

    // Check if user has requested to join a group
    function hasRequestedToJoin(group) {
        const username = localStorage.getItem('username') || 'Anonymous';
        return group.requests && group.requests.includes(username);
    }

    // API base URL - using the backend server port (3000)
    const API_BASE_URL = 'http://localhost:3000';

    // API functions
    async function fetchGroups() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/studygroups`);
            const data = await response.json();
            if (data.success) {
                groups = data.groups;
                return groups;
            } else {
                console.error('Failed to fetch groups:', data.message);
                return [];
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
            return [];
        }
    }

    async function createGroup(groupData) {
        try {
            // Check if user is logged in
            const sessionToken = localStorage.getItem('authToken'); // Use the correct token key
            if (!sessionToken) {
                console.error('No session token found. User must be logged in to create a group.');
                alert('You must be logged in to create a study group. Please log in first.');
                // Redirect to login page
                window.location.href = '../../index.html?returnUrl=' + encodeURIComponent(window.location.href);
                return null;
            }
            
            console.log('Creating group with data:', groupData);
            console.log('Using session token:', sessionToken);
            
            const response = await fetch(`${API_BASE_URL}/api/studygroups`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify(groupData)
            });
            
            console.log('Response status:', response.status);
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error(`Server returned non-JSON response: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Response data:', data);
            
            if (data.success) {
                return data.group;
            } else {
                console.error('Failed to create group:', data.message);
                // If token is invalid, redirect to login
                if (data.message === 'Invalid or expired token') {
                    alert('Your session has expired. Please log in again.');
                    localStorage.removeItem('authToken');
                    window.location.href = '../../index.html?returnUrl=' + encodeURIComponent(window.location.href);
                }
                return null;
            }
        } catch (error) {
            console.error('Error creating group:', error);
            return null;
        }
    }

    async function deleteGroup(groupId) {
        try {
            const sessionToken = localStorage.getItem('authToken'); // Use the correct token key
            if (!sessionToken) {
                console.error('No session token found. User must be logged in to delete a group.');
                alert('You must be logged in to delete a study group. Please log in first.');
                // Redirect to login page
                window.location.href = '../../index.html?returnUrl=' + encodeURIComponent(window.location.href);
                return false;
            }
            
            const response = await fetch(`${API_BASE_URL}/api/studygroups/${groupId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${sessionToken}`
                }
            });
            
            const data = await response.json();
            if (data.success) {
                return true;
            } else {
                console.error('Failed to delete group:', data.message);
                // If token is invalid, redirect to login
                if (data.message === 'Invalid or expired token') {
                    alert('Your session has expired. Please log in again.');
                    localStorage.removeItem('authToken');
                    window.location.href = '../../index.html?returnUrl=' + encodeURIComponent(window.location.href);
                }
                return false;
            }
        } catch (error) {
            console.error('Error deleting group:', error);
            return false;
        }
    }

    async function fetchGroupById(groupId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/studygroups/${groupId}`);
            const data = await response.json();
            if (data.success) {
                return data.group;
            } else {
                console.error('Failed to fetch group:', data.message);
                return null;
            }
        } catch (error) {
            console.error('Error fetching group:', error);
            return null;
        }
    }

    async function addMessageToGroup(groupId, messageText) {
        try {
            const sessionToken = localStorage.getItem('authToken'); // Use the correct token key
            if (!sessionToken) {
                console.error('No session token found. User must be logged in to send a message.');
                alert('You must be logged in to send a message. Please log in first.');
                // Redirect to login page
                window.location.href = '../../index.html?returnUrl=' + encodeURIComponent(window.location.href);
                return false;
            }
            
            const response = await fetch(`${API_BASE_URL}/api/studygroups/${groupId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify({ text: messageText })
            });
            
            const data = await response.json();
            if (data.success) {
                return true;
            } else {
                console.error('Failed to add message:', data.message);
                // If token is invalid, redirect to login
                if (data.message === 'Invalid or expired token') {
                    alert('Your session has expired. Please log in again.');
                    localStorage.removeItem('authToken');
                    window.location.href = '../../index.html?returnUrl=' + encodeURIComponent(window.location.href);
                }
                return false;
            }
        } catch (error) {
            console.error('Error adding message:', error);
            return false;
        }
    }

    // New function to request to join a group
    async function requestToJoinGroup(groupId) {
        try {
            const sessionToken = localStorage.getItem('authToken');
            if (!sessionToken) {
                console.error('No session token found. User must be logged in to request to join a group.');
                alert('You must be logged in to request to join a study group. Please log in first.');
                window.location.href = '../../index.html?returnUrl=' + encodeURIComponent(window.location.href);
                return false;
            }
            
            const response = await fetch(`${API_BASE_URL}/api/studygroups/${groupId}/request`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sessionToken}`
                }
            });
            
            const data = await response.json();
            if (data.success) {
                return true;
            } else {
                console.error('Failed to request to join group:', data.message);
                if (data.message === 'Invalid or expired token') {
                    alert('Your session has expired. Please log in again.');
                    localStorage.removeItem('authToken');
                    window.location.href = '../../index.html?returnUrl=' + encodeURIComponent(window.location.href);
                }
                return false;
            }
        } catch (error) {
            console.error('Error requesting to join group:', error);
            return false;
        }
    }

    // New function to accept a join request
    async function acceptJoinRequest(groupId, username) {
        try {
            const sessionToken = localStorage.getItem('authToken');
            if (!sessionToken) {
                console.error('No session token found. User must be logged in to accept join requests.');
                alert('You must be logged in to accept join requests. Please log in first.');
                window.location.href = '../../index.html?returnUrl=' + encodeURIComponent(window.location.href);
                return false;
            }
            
            const response = await fetch(`${API_BASE_URL}/api/studygroups/${groupId}/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify({ username: username })
            });
            
            const data = await response.json();
            if (data.success) {
                return true;
            } else {
                console.error('Failed to accept join request:', data.message);
                if (data.message === 'Invalid or expired token') {
                    alert('Your session has expired. Please log in again.');
                    localStorage.removeItem('authToken');
                    window.location.href = '../../index.html?returnUrl=' + encodeURIComponent(window.location.href);
                }
                return false;
            }
        } catch (error) {
            console.error('Error accepting join request:', error);
            return false;
        }
    }

    // New function to reject a join request
    async function rejectJoinRequest(groupId, username) {
        try {
            const sessionToken = localStorage.getItem('authToken');
            if (!sessionToken) {
                console.error('No session token found. User must be logged in to reject join requests.');
                alert('You must be logged in to reject join requests. Please log in first.');
                window.location.href = '../../index.html?returnUrl=' + encodeURIComponent(window.location.href);
                return false;
            }
            
            const response = await fetch(`${API_BASE_URL}/api/studygroups/${groupId}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify({ username: username })
            });
            
            const data = await response.json();
            if (data.success) {
                return true;
            } else {
                console.error('Failed to reject join request:', data.message);
                if (data.message === 'Invalid or expired token') {
                    alert('Your session has expired. Please log in again.');
                    localStorage.removeItem('authToken');
                    window.location.href = '../../index.html?returnUrl=' + encodeURIComponent(window.location.href);
                }
                return false;
            }
        } catch (error) {
            console.error('Error rejecting join request:', error);
            return false;
        }
    }

    // New function to get user pending requests
    async function getUserPendingRequests() {
        try {
            const sessionToken = localStorage.getItem('authToken');
            if (!sessionToken) {
                console.error('No session token found. User must be logged in to get pending requests.');
                return [];
            }
            
            const response = await fetch(`${API_BASE_URL}/api/studygroups/requests`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${sessionToken}`
                }
            });
            
            const data = await response.json();
            if (data.success) {
                return data.requests;
            } else {
                console.error('Failed to get user pending requests:', data.message);
                return [];
            }
        } catch (error) {
            console.error('Error getting user pending requests:', error);
            return [];
        }
    }

    // New function to update group name
    async function updateGroupName(groupId, newName) {
        try {
            const sessionToken = localStorage.getItem('authToken');
            if (!sessionToken) {
                console.error('No session token found. User must be logged in to update group name.');
                alert('You must be logged in to update group name. Please log in first.');
                window.location.href = '../../index.html?returnUrl=' + encodeURIComponent(window.location.href);
                return false;
            }
            
            const response = await fetch(`${API_BASE_URL}/api/studygroups/${groupId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify({ name: newName })
            });
            
            const data = await response.json();
            if (data.success) {
                return true;
            } else {
                console.error('Failed to update group name:', data.message);
                if (data.message === 'Invalid or expired token') {
                    alert('Your session has expired. Please log in again.');
                    localStorage.removeItem('authToken');
                    window.location.href = '../../index.html?returnUrl=' + encodeURIComponent(window.location.href);
                }
                return false;
            }
        } catch (error) {
            console.error('Error updating group name:', error);
            return false;
        }
    }

    // New function to remove a user from a group
    async function removeUserFromGroup(groupId, username) {
        try {
            const sessionToken = localStorage.getItem('authToken');
            if (!sessionToken) {
                console.error('No session token found. User must be logged in to remove users from a group.');
                alert('You must be logged in to remove users from a group. Please log in first.');
                window.location.href = '../../index.html?returnUrl=' + encodeURIComponent(window.location.href);
                return false;
            }
            
            const response = await fetch(`${API_BASE_URL}/api/studygroups/${groupId}/members`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify({ username: username })
            });
            
            const data = await response.json();
            if (data.success) {
                return true;
            } else {
                console.error('Failed to remove user from group:', data.message);
                if (data.message === 'Invalid or expired token') {
                    alert('Your session has expired. Please log in again.');
                    localStorage.removeItem('authToken');
                    window.location.href = '../../index.html?returnUrl=' + encodeURIComponent(window.location.href);
                }
                return false;
            }
        } catch (error) {
            console.error('Error removing user from group:', error);
            return false;
        }
    }

    function renderGroupList() {
        groupList.innerHTML = '';
        groups.forEach(group => {
            const groupCard = document.createElement('div');
            groupCard.className = 'group-card';
            
            // Set initial styles for animation
            groupCard.style.opacity = '0';
            groupCard.style.transform = 'translateY(20px)';
            groupCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            
            const username = localStorage.getItem('username') || 'Anonymous';
            const isMember = isGroupMember(group);
            const hasRequested = hasRequestedToJoin(group);
            const isCreator = isGroupCreator(group);
            
            // Add edit button for all group members (shows member list for members, rename for creators)
            const editButton = (isCreator || isMember) ? 
                `<button class="edit-group-btn" data-group-id="${group.id}" title="${isCreator ? 'Edit Group' : 'View Group Members'}">${isCreator ? '✏️' : '✏️'}</button>` : '';
            
            // Add members button for all users
            const membersButton = isMember || isCreator ? 
                `<button class="view-members-btn" data-group-id="${group.id}" title="View Members">👥</button>` : '';
            
            let actionButton = '';
            if (isCreator) {
                actionButton = '<button class="member-btn" disabled>👑 Admin</button>';
            } else if (!isMember && !hasRequested) {
                actionButton = `<button class="request-btn" data-group-id="${group.id}">🚀 Join Group</button>`;
            } else if (!isMember && hasRequested) {
                actionButton = '<button class="requested-btn" disabled>⏳ Requested</button>';
            } else if (isMember) {
                actionButton = '<button class="member-btn" disabled>✅ Member</button>';
            }
            
            // Show pending requests count for group creators
            let requestsInfo = '';
            if (isCreator && group.requests && group.requests.length > 0) {
                requestsInfo = `
                    <div class="requests-info" data-group-id="${group.id}">
                        <strong>📬 ${group.requests.length} pending request(s)</strong>
                        <div class="pending-requests-list">
                            ${group.requests.map(request => `
                                <div class="request-item">
                                    <span>👤 ${sanitizeInput(request)}</span>
                                    <div class="request-actions">
                                        <button class="accept-btn small" data-group-id="${group.id}" data-username="${request}">✔️ Accept</button>
                                        <button class="reject-btn small" data-group-id="${group.id}" data-username="${request}">❌ Reject</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            
            groupCard.innerHTML = `
                <div class="group-card-header">
                    ${editButton}
                    ${membersButton}
                </div>
                <h3>📚 ${sanitizeInput(group.name)}</h3>
                <p>📝 ${sanitizeInput(group.description)}</p>
                <div class="group-meta">
                    <span>👤 Created by: ${sanitizeInput(group.createdBy)}</span>
                    <span>👥 Members: ${group.members ? group.members.length : 0}</span>
                </div>
                ${requestsInfo}
                <div class="group-actions">
                    ${actionButton}
                </div>
            `;
            groupCard.dataset.groupId = group.id;
            
            // Add a subtle pulse animation on hover for group cards
            groupCard.addEventListener('mouseenter', () => {
                groupCard.style.boxShadow = '0 15px 35px rgba(0, 212, 255, 0.5)';
            });
            
            groupCard.addEventListener('mouseleave', () => {
                groupCard.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
            });
            
            // Handle click events properly
            groupCard.addEventListener('click', (e) => {
                // Check if the click was on any of the action buttons
                if (e.target.classList.contains('edit-group-btn') || 
                    e.target.classList.contains('view-members-btn') ||
                    e.target.classList.contains('request-btn') ||
                    e.target.classList.contains('accept-btn') || 
                    e.target.classList.contains('reject-btn')) {
                    e.stopPropagation();
                    return;
                }
                
                // Check if the click was on the requests info area
                if (e.target.classList.contains('requests-info') || e.target.closest('.requests-info')) {
                    e.stopPropagation();
                    return;
                }
                
                // Only allow members to open chat
                if (isMember || isCreator) {
                    openChat(group.id);
                } else {
                    // Provide feedback for non-members
                    if (!hasRequested && !isCreator) {
                        showMessage('You need to join this group to access the chat.', 'info');
                    }
                }
            });
            
            // Append the group card to the group list
            groupList.appendChild(groupCard);
        });
        
        // Animate the group cards
        setTimeout(animateGroupCards, 100);
        
        // Add event listeners for edit group buttons
        document.querySelectorAll('.edit-group-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const groupId = button.dataset.groupId;
                const group = groups.find(g => g.id === groupId);
                if (group) {
                    // For both creators and members, show the group members list
                    showGroupMembers(group);
                }
            });
        });
        
        // Add event listeners for view members buttons
        document.querySelectorAll('.view-members-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const groupId = button.dataset.groupId;
                const group = groups.find(g => g.id === groupId);
                if (group) {
                    showGroupMembers(group);
                }
            });
        });
        
        // Add event listeners for request buttons
        document.querySelectorAll('.request-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const groupId = button.dataset.groupId;
                showMessage('Sending join request...', 'info');
                const success = await requestToJoinGroup(groupId);
                if (success) {
                    showMessage('🎉 Join request sent successfully!', 'success');
                    await fetchGroups();
                    renderGroupList();
                } else {
                    showMessage('❌ Failed to send join request. Please try again.', 'error');
                }
            });
        });
        
        // Add event listeners for accept buttons
        document.querySelectorAll('.accept-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const groupId = button.dataset.groupId;
                const username = button.dataset.username;
                
                showMessage('Accepting request...', 'info');
                const success = await acceptJoinRequest(groupId, username);
                if (success) {
                    showMessage(`🎉 ${username} has been added to the group!`, 'success');
                    await fetchGroups();
                    renderGroupList();
                } else {
                    showMessage('❌ Failed to accept join request. Please try again.', 'error');
                }
            });
        });
        
        // Add event listeners for reject buttons
        document.querySelectorAll('.reject-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const groupId = button.dataset.groupId;
                const username = button.dataset.username;
                
                showMessage('Rejecting request...', 'info');
                const success = await rejectJoinRequest(groupId, username);
                if (success) {
                    showMessage(`✅ Request from ${username} has been rejected.`, 'success');
                    await fetchGroups();
                    renderGroupList();
                } else {
                    showMessage('❌ Failed to reject join request. Please try again.', 'error');
                }
            });
        });
    }

    // Function to show group members in a modal
    function showGroupMembers(group) {
        const username = localStorage.getItem('username') || 'Anonymous';
        const isCreator = isGroupCreator(group);
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'members-modal';
        modal.innerHTML = `
            <div class="members-modal-content">
                <div class="members-modal-header">
                    <h2>👥 Members of ${sanitizeInput(group.name)}</h2>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="members-modal-body">
                    <div class="group-members-list">
                        ${group.members.map(member => {
                            const isSelf = member === username;
                            const isGroupCreator = member === group.createdBy;
                            const canRemove = isCreator && !isSelf && !isGroupCreator;
                            
                            return `
                                <div class="member-item">
                                    <span>${sanitizeInput(member)} ${isGroupCreator ? '👑' : ''} ${isSelf ? '(You)' : ''}</span>
                                    ${canRemove ? 
                                        `<button class="remove-member-btn small" data-group-id="${group.id}" data-username="${member}">🗑️ Remove</button>` : 
                                        ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to the document
        document.body.appendChild(modal);
        
        // Add event listener to close the modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Close modal when clicking outside of it
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Add event listeners for remove member buttons
        modal.querySelectorAll('.remove-member-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const groupId = button.dataset.groupId;
                const memberUsername = button.dataset.username;
                
                if (confirm(`Are you sure you want to remove ${memberUsername} from this group?`)) {
                    showMessage(`Removing ${memberUsername} from group...`, 'info');
                    const success = await removeUserFromGroup(groupId, memberUsername);
                    if (success) {
                        showMessage(`✅ ${memberUsername} has been removed from the group.`, 'success');
                        document.body.removeChild(modal);
                        await fetchGroups();
                        renderGroupList();
                    } else {
                        showMessage(`❌ Failed to remove ${memberUsername} from the group. Please try again.`, 'error');
                    }
                }
            });
        });
    }

    // Function to show rename group modal
    function showRenameGroupModal(group) {
        const username = localStorage.getItem('username') || 'Anonymous';
        const isCreator = isGroupCreator(group);
        
        // Generate member list HTML if user is creator
        let membersHTML = '';
        if (isCreator && group.members && group.members.length > 0) {
            membersHTML = `
                <div class="group-members-section">
                    <h3>👥 Group Members</h3>
                    <div class="group-members-list">
                        ${group.members.map(member => {
                            const isSelf = member === username;
                            const isGroupCreator = member === group.createdBy;
                            const canRemove = isCreator && !isSelf && !isGroupCreator;
                            
                            return `
                                <div class="member-item">
                                    <span>${sanitizeInput(member)} ${isGroupCreator ? '👑' : ''} ${isSelf ? '(You)' : ''}</span>
                                    ${canRemove ? 
                                        `<button class="remove-member-btn small" data-group-id="${group.id}" data-username="${member}">🗑️ Remove</button>` : 
                                        ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }
        
        const modal = document.createElement('div');
        modal.className = 'rename-modal';
        modal.innerHTML = `
            <div class="rename-modal-content">
                <div class="rename-modal-header">
                    <h2>✏️ Manage Group</h2>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="rename-modal-body">
                    <form class="rename-group-form">
                        <label for="new-group-name">Group Name</label>
                        <input type="text" id="new-group-name" value="${sanitizeInput(group.name)}" placeholder="Enter new group name" required>
                        <div class="rename-group-form-buttons">
                            <button type="button" class="cancel-btn">Cancel</button>
                            <button type="submit" class="save-btn">Save</button>
                        </div>
                    </form>
                    ${membersHTML}
                </div>
            </div>
        `;
        
        // Add modal to the document
        document.body.appendChild(modal);
        
        const form = modal.querySelector('.rename-group-form');
        const newNameInput = modal.querySelector('#new-group-name');
        const closeBtn = modal.querySelector('.close-modal');
        const cancelBtn = modal.querySelector('.cancel-btn');
        
        // Focus the input field
        newNameInput.focus();
        
        // Close modal functions
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        // Add event listeners to close the modal
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        // Close modal when clicking outside of it
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newName = newNameInput.value.trim();
            
            if (newName && newName !== group.name) {
                showMessage('Updating group name...', 'info');
                const success = await updateGroupName(group.id, newName);
                if (success) {
                    showMessage('🎉 Group name updated successfully!', 'success');
                    closeModal();
                    await fetchGroups();
                    renderGroupList();
                } else {
                    showMessage('❌ Failed to update group name. Please try again.', 'error');
                }
            } else {
                closeModal();
            }
        });
        
        // Add event listeners for remove member buttons if present
        modal.querySelectorAll('.remove-member-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const groupId = button.dataset.groupId;
                const memberUsername = button.dataset.username;
                
                if (confirm(`Are you sure you want to remove ${memberUsername} from this group?`)) {
                    showMessage(`Removing ${memberUsername} from group...`, 'info');
                    const success = await removeUserFromGroup(groupId, memberUsername);
                    if (success) {
                        showMessage(`✅ ${memberUsername} has been removed from the group.`, 'success');
                        closeModal();
                        await fetchGroups();
                        renderGroupList();
                    } else {
                        showMessage(`❌ Failed to remove ${memberUsername} from the group. Please try again.`, 'error');
                    }
                }
            });
        });
    }

    // Function to animate group cards with a fade-in effect
    function animateGroupCards() {
        const cards = document.querySelectorAll('.group-card');
        cards.forEach((card, index) => {
            // Add a staggered delay for each card
            setTimeout(() => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                
                // Trigger the animation
                requestAnimationFrame(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                });
            }, index * 70); // 70ms delay between each card for a smoother effect
        });
    }

    // Function to show pending requests for a group
    async function showPendingRequests(groupId) {
        const group = groups.find(g => g.id === groupId);
        if (!group || !group.requests || group.requests.length === 0) {
            alert('No pending requests for this group.');
            return;
        }
        
        // For group creators, show the requests in the group card
        const username = localStorage.getItem('username') || 'Anonymous';
        const isCreator = group.createdBy === username;
        
        if (isCreator) {
            // Refresh the group list to show the requests
            await fetchGroups();
            renderGroupList();
        } else {
            // For other users, show a simple modal
            const modal = document.createElement('div');
            modal.className = 'requests-modal';
            modal.innerHTML = `
                <div class="requests-modal-content">
                    <div class="requests-modal-header">
                        <h2>Pending Requests for ${sanitizeInput(group.name)}</h2>
                        <span class="close-modal">&times;</span>
                    </div>
                    <div class="requests-modal-body">
                        <ul class="requests-list">
                            ${group.requests.map(request => `<li>${sanitizeInput(request)}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="requests-modal-footer">
                        <p>Only the group creator can manage join requests.</p>
                    </div>
                </div>
            `;
            
            // Add modal to the document
            document.body.appendChild(modal);
            
            // Add event listener to close the modal
            modal.querySelector('.close-modal').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            // Close modal when clicking outside of it
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        }
    }

    async function openChat(groupId) {
        currentGroupId = groupId;
        currentGroup = await fetchGroupById(groupId);
        
        if (currentGroup) {
            // Check if user is a member before allowing chat access
            if (isGroupMember(currentGroup)) {
                currentGroupName.textContent = currentGroup.name;
                showView(groupChatView);
                renderChatMessages();
            } else {
                alert('You must be a member of this group to access the chat.');
                // Refresh group list to show current status
                await fetchGroups();
                renderGroupList();
            }
        } else {
            alert('Failed to load group chat. Please try again.');
        }
    }

    function renderChatMessages() {
        chatMessages.innerHTML = '';
        if (!currentGroup || !currentGroup.messages) return;

        const currentUser = localStorage.getItem('username') || 'Anonymous';
        let previousSender = null;

        currentGroup.messages.forEach((msg, index) => {
            // Determine if this message should be grouped with the previous one
            const isSameSender = previousSender === msg.sender;
            previousSender = msg.sender;

            const msgElement = document.createElement('div');
            
            if (msg.sender === 'ANNOUNCEMENT') {
                // Announcements are always centered
                msgElement.className = 'message announcement-message';
                msgElement.innerHTML = `<strong>📢 ANNOUNCEMENT:</strong> ${sanitizeInput(msg.text)}`;
            } else {
                // Regular messages - position based on sender
                const isCurrentUser = msg.sender === currentUser;
                const messageClass = isCurrentUser ? 'message outgoing-message' : 'message incoming-message';
                
                // Add grouping class if same sender as previous message
                const groupingClass = isSameSender ? 'grouped' : '';
                
                // Show sender name only for the first message in a group
                const senderName = !isSameSender ? `<div class="message-sender">${sanitizeInput(msg.sender)}</div>` : '';
                
                msgElement.className = `${messageClass} ${groupingClass}`;
                msgElement.innerHTML = `
                    ${senderName}
                    <div class="message-text">${sanitizeInput(msg.text)}</div>
                    <div class="message-time">${new Date(msg.timestamp).toLocaleString()}</div>
                `;
            }
            chatMessages.appendChild(msgElement);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showView(view) {
        console.log('Showing view:', view.id);
        groupListView.style.display = 'none';
        createGroupView.style.display = 'none';
        groupChatView.style.display = 'none';
        view.style.display = 'block';
    }

    createGroupBtn.addEventListener('click', () => showView(createGroupView));
    cancelCreateBtn.addEventListener('click', () => showView(groupListView));
    
    // Add event listener for back to groups button with existence check
    if (backToGroupsBtn) {
        backToGroupsBtn.addEventListener('click', async () => {
            console.log('Back to groups button clicked');
            try {
                await fetchGroups();
                renderGroupList();
                showView(groupListView);
                console.log('Successfully navigated back to groups');
            } catch (error) {
                console.error('Error navigating back to groups:', error);
            }
        });
    } else {
        console.error('Back to groups button not found in DOM');
    }

    const groupNameInput = document.getElementById('group-name');

    if(groupNameInput) groupNameInput.addEventListener('input', () => validateField(groupNameInput));

    createGroupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateField(groupNameInput)) {
            speak("Please provide a group name.");
            return;
        }

        const groupName = groupNameInput.value;
        const groupDescription = document.getElementById('group-description').value;
        
        const newGroup = await createGroup({
            name: groupName,
            description: groupDescription
        });
        
        if (newGroup) {
            await fetchGroups();
            renderGroupList();
            showView(groupListView);
            createGroupForm.reset();
            alert('Study group created successfully!');
        } else {
            alert('Failed to create study group. Please try again.');
        }
    });

    sendMessageBtn.addEventListener('click', async () => {
        const text = chatInput.value.trim();
        if (text === '' || !currentGroupId) return;

        const success = await addMessageToGroup(currentGroupId, text);
        if (success) {
            // Refresh the group to get the new message
            currentGroup = await fetchGroupById(currentGroupId);
            renderChatMessages();
            chatInput.value = '';
        } else {
            alert('Failed to send message. Please try again.');
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessageBtn.click();
        }
    });

    // Load groups on page load
    fetchGroups().then(async () => {
        renderGroupList();
        // If user is a group creator, also render pending requests
        const username = localStorage.getItem('username') || 'Anonymous';
        const userRole = localStorage.getItem('userRole') || 'user';
        const isGroupCreator = groups.some(group => group.createdBy === username);
        const isAdmin = userRole === 'admin';
        
        if (isGroupCreator || isAdmin) {
            // This will be handled in the admin view
        }
    });

    if (isAdminView) {
        userViews.style.display = 'none';
        adminView.style.display = 'block';
        document.querySelector('.back-link').href = '../../admin.html';
        document.querySelector('h1').textContent = 'Manage Study Groups';
        renderGroupsTable();
    }

    /**
     * Renders the groups into the admin management table.
     */
    async function renderGroupsTable() {
        if (!groupsTableBody) return;
        
        // Fetch fresh data for admin view
        await fetchGroups();
        groupsTableBody.innerHTML = '';

        groups.forEach(group => {
            const row = groupsTableBody.insertRow();
            // Ensure members and status exist
            const members = group.members || [];
            const status = group.status || 'active';

            row.innerHTML = `
                <td>${sanitizeInput(group.name)}</td>
                <td>${sanitizeInput(group.createdBy)}</td>
                <td>${members.length}</td>
                <td><span class="status-badge status-${status}">${status}</span></td>
                <td>
                    <button class="action-btn archive-btn" data-id="${group.id}">${status === 'active' ? 'Archive' : 'Activate'}</button>
                    <button class="action-btn delete-btn" data-id="${group.id}">Delete</button>
                </td>
            `;
        });
        
        // Render pending requests table
        renderRequestsTable();
    }

    /**
     * Renders the pending join requests into the admin management table.
     */
    async function renderRequestsTable() {
        const requestsTableBody = document.querySelector('#requests-table tbody');
        if (!requestsTableBody) return;
        
        // Fetch fresh data for admin view
        await fetchGroups();
        requestsTableBody.innerHTML = '';
        
        // Collect all pending requests
        groups.forEach(group => {
            // Only show requests for groups where current user is creator or admin
            const username = localStorage.getItem('username') || 'Anonymous';
            const userRole = localStorage.getItem('userRole') || 'user';
            const isGroupOwner = group.createdBy === username;
            const isAdmin = userRole === 'admin';
            
            if (group.requests && (isGroupOwner || isAdmin)) {
                group.requests.forEach(request => {
                    const row = requestsTableBody.insertRow();
                    row.innerHTML = `
                        <td>${sanitizeInput(group.name)}</td>
                        <td>${sanitizeInput(request)}</td>
                        <td>Pending</td>
                        <td>
                            <button class="action-btn accept-btn" data-group-id="${group.id}" data-username="${request}">Accept</button>
                            <button class="action-btn reject-btn" data-group-id="${group.id}" data-username="${request}">Reject</button>
                        </td>
                    `;
                });
            }
        });
        
        // Add event listeners for accept/reject buttons
        const requestsTable = document.getElementById('requests-table');
        if (requestsTable) {
            requestsTable.addEventListener('click', async (e) => {
                const target = e.target;
                if (target.classList.contains('accept-btn')) {
                    const groupId = target.dataset.groupId;
                    const username = target.dataset.username;
                    
                    const success = await acceptJoinRequest(groupId, username);
                    if (success) {
                        alert('Join request accepted successfully!');
                        await renderGroupsTable(); // Refresh both tables
                    } else {
                        alert('Failed to accept join request. Please try again.');
                    }
                } else if (target.classList.contains('reject-btn')) {
                    const groupId = target.dataset.groupId;
                    const username = target.dataset.username;
                    
                    const success = await rejectJoinRequest(groupId, username);
                    if (success) {
                        alert('Join request rejected successfully!');
                        await renderGroupsTable(); // Refresh both tables
                    } else {
                        alert('Failed to reject join request. Please try again.');
                    }
                }
            });
        }
    }

    if (groupsTableBody) {
        groupsTableBody.addEventListener('click', async (e) => {
            const target = e.target;
            if (target.classList.contains('action-btn')) {
                const groupId = target.dataset.id;

                if (target.classList.contains('delete-btn')) {
                    if (confirm('Are you sure you want to permanently delete this group?')) {
                        const success = await deleteGroup(groupId);
                        if (success) {
                            await renderGroupsTable();
                            alert('Group deleted successfully!');
                        } else {
                            alert('Failed to delete group. Please try again.');
                        }
                    }
                } else if (target.classList.contains('archive-btn')) {
                    // For now, we'll just show an alert since archiving isn't implemented in the backend yet
                    alert('Archiving is not implemented yet. Please contact admin.');
                }
            }
        });
    }

    // --- Announcement Logic --- (keeping this as is since it's admin-only)
    const announcementForm = document.getElementById('announcement-form');
    if (announcementForm) {
        announcementForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Announcement feature is not implemented yet with the new backend. Please contact admin.');
        });
    }

    // Function to show messages to the user
    function showMessage(text, type = 'info') {
        const messageBox = document.createElement('div');
        messageBox.className = `message-box ${type}`;
        messageBox.textContent = text;
        
        messageDisplay.appendChild(messageBox);
        
        // Remove message after 5 seconds
        setTimeout(() => {
            if (messageBox.parentNode) {
                messageBox.parentNode.removeChild(messageBox);
            }
        }, 5000);
    }
});