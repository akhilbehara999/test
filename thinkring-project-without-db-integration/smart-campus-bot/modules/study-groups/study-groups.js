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

    let groups = JSON.parse(localStorage.getItem('study-groups')) || [];
    let currentGroupId = null;

    const urlParams = new URLSearchParams(window.location.search);
    const isAdminView = urlParams.get('view') === 'admin';

    if (isAdminView) {
        userViews.style.display = 'none';
        adminView.style.display = 'block';
        document.querySelector('.back-link').href = '../../admin.html';
        document.querySelector('h1').textContent = 'Manage Study Groups';
        renderGroupsTable();
    }

    function renderGroupList() {
        groupList.innerHTML = '';
        groups.forEach(group => {
            const groupCard = document.createElement('div');
            groupCard.className = 'group-card';
            groupCard.innerHTML = `<h3>${sanitizeInput(group.name)}</h3><p>${sanitizeInput(group.description)}</p>`;
            groupCard.dataset.groupId = group.id;
            groupCard.addEventListener('click', () => openChat(group.id));
            groupList.appendChild(groupCard);
        });
    }

    function openChat(groupId) {
        currentGroupId = groupId;
        const group = groups.find(g => g.id === groupId);
        currentGroupName.textContent = group.name;

        showView(groupChatView);
        renderChatMessages();
    }

    function renderChatMessages() {
        const group = groups.find(g => g.id === currentGroupId);
        chatMessages.innerHTML = '';
        if (!group.messages) group.messages = [];

        group.messages.forEach(msg => {
            const msgElement = document.createElement('div');
            if (msg.sender === 'ANNOUNCEMENT') {
                msgElement.className = 'message announcement-message';
                msgElement.innerHTML = `<strong>📢 ANNOUNCEMENT:</strong> ${sanitizeInput(msg.text)}`;
            } else {
                msgElement.className = 'message user-message'; // Assuming a default class
                msgElement.textContent = `${sanitizeInput(msg.sender)}: ${sanitizeInput(msg.text)}`;
            }
            chatMessages.appendChild(msgElement);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showView(view) {
        groupListView.style.display = 'none';
        createGroupView.style.display = 'none';
        groupChatView.style.display = 'none';
        view.style.display = 'block';
    }

    createGroupBtn.addEventListener('click', () => showView(createGroupView));
    cancelCreateBtn.addEventListener('click', () => showView(groupListView));
    backToGroupsBtn.addEventListener('click', () => showView(groupListView));

    const groupNameInput = document.getElementById('group-name');

    if(groupNameInput) groupNameInput.addEventListener('input', () => validateField(groupNameInput));

    createGroupForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!validateField(groupNameInput)) {
            speak("Please provide a group name.");
            return;
        }

        const groupName = groupNameInput.value;
        const groupDescription = document.getElementById('group-description').value;
        const newGroup = {
            id: Date.now(),
            name: groupName,
            description: groupDescription,
            messages: [],
            members: [localStorage.getItem('username') || 'Anonymous'], // Add the creator as the first member
            status: 'active' // 'active' or 'archived'
        };
        groups.push(newGroup);
        localStorage.setItem('study-groups', JSON.stringify(groups));
        renderGroupList();
        showView(groupListView);
        createGroupForm.reset();
    });

    sendMessageBtn.addEventListener('click', () => {
        const text = chatInput.value.trim();
        if (text === '' || !currentGroupId) return;

        const groupIndex = groups.findIndex(g => g.id === currentGroupId);
        if (groupIndex > -1) {
            groups[groupIndex].messages.push({ sender: 'User', text: text }); // Assuming 'User' for simplicity
            localStorage.setItem('study-groups', JSON.stringify(groups));

            renderChatMessages();
            chatInput.value = '';
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessageBtn.click();
        }
    });

    renderGroupList();

    /**
     * Renders the groups into the admin management table.
     */
    function renderGroupsTable() {
        if (!groupsTableBody) return;
        groupsTableBody.innerHTML = '';

        groups.forEach(group => {
            const row = groupsTableBody.insertRow();
            // Ensure members and status exist for older group data
            const members = group.members || [];
            const status = group.status || 'active';

            row.innerHTML = `
                <td>${sanitizeInput(group.name)}</td>
                <td>${members.length}</td>
                <td><span class="status-badge status-${status}">${status}</span></td>
                <td>
                    <button class="action-btn archive-btn" data-id="${group.id}">${status === 'active' ? 'Archive' : 'Activate'}</button>
                    <button class="action-btn delete-btn" data-id="${group.id}">Delete</button>
                </td>
            `;
        });
    }

    if (groupsTableBody) {
        groupsTableBody.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('action-btn')) {
                const groupId = parseInt(target.dataset.id);

                if (target.classList.contains('delete-btn')) {
                    if (confirm('Are you sure you want to permanently delete this group?')) {
                        groups = groups.filter(g => g.id !== groupId);
                        localStorage.setItem('study-groups', JSON.stringify(groups));
                        renderGroupsTable();
                    }
                } else if (target.classList.contains('archive-btn')) {
                    const groupIndex = groups.findIndex(g => g.id === groupId);
                    if (groupIndex > -1) {
                        const newStatus = groups[groupIndex].status === 'active' ? 'archived' : 'active';
                        groups[groupIndex].status = newStatus;
                        localStorage.setItem('study-groups', JSON.stringify(groups));
                        renderGroupsTable();
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

            localStorage.setItem('study-groups', JSON.stringify(groups));
            alert('Announcement sent to all groups!');
            announcementForm.reset();
        });
    }
});
