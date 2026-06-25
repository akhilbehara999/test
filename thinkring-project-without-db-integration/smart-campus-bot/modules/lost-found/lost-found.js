document.addEventListener('DOMContentLoaded', () => {
    const reportForm = document.getElementById('report-form');
    const itemList = document.getElementById('item-list');
    const adminItemList = document.getElementById('admin-item-list');
    const searchBar = document.getElementById('search-bar');
    const filterStatusEl = document.getElementById('filter-status');
    const sortByEl = document.getElementById('sort-by');
    const itemNameInput = document.getElementById('item-name');
    const itemDescriptionInput = document.getElementById('item-description');
    const itemImageInput = document.getElementById('item-image');
    const imagePreview = document.getElementById('image-preview');

    const userView = document.getElementById('user-view');
    const adminView = document.getElementById('admin-view');
    const reportItemSection = document.getElementById('report-item');
    const reportFormContainer = document.getElementById('report-form');

    let items = JSON.parse(localStorage.getItem('lost-found-items')) || [];

    // Check for admin view
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminView = urlParams.get('view') === 'admin';

    if (isAdminView) {
        document.body.classList.add('admin-mode');
        userView.style.display = 'none';
        adminView.style.display = 'block';
        document.querySelector('.back-link').href = '../../admin.html';
        document.querySelector('h1').textContent = 'Manage Lost & Found';
        renderAdminItems(); // Use renderAdminItems for card-based display
        renderAdminAnalytics();
        
        // Attach event listener after rendering
        attachAdminClickListener();
    } else {
        document.body.classList.add('user-mode');
        userView.style.display = 'block';
        adminView.style.display = 'none';
        renderItems();
    }

    // Toggle form visibility when clicking the section header
    const reportHeader = document.querySelector('#report-item h2');
    if (reportHeader) {
        reportHeader.style.cursor = 'pointer';
        reportHeader.addEventListener('click', () => {
            reportFormContainer.style.display = reportFormContainer.style.display === 'none' ? 'grid' : 'none';
        });
    }

    if(itemNameInput) itemNameInput.addEventListener('input', () => validateField(itemNameInput));
    if(itemDescriptionInput) itemDescriptionInput.addEventListener('input', () => validateField(itemDescriptionInput));

    if (itemImageInput) {
        itemImageInput.addEventListener('change', () => {
            const file = itemImageInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                imagePreview.style.display = 'none';
            }
        });
    }

    if(reportForm) {
        reportForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const isNameValid = validateField(itemNameInput);
            const isDescriptionValid = validateField(itemDescriptionInput);

            if (!isNameValid || !isDescriptionValid) {
                speak("Please fill out all required fields.");
                return;
            }

            const newItem = {
                id: Date.now(),
                name: itemNameInput.value,
                description: itemDescriptionInput.value,
                type: document.getElementById('item-type').value,
                category: document.getElementById('item-category').value,
                date: document.getElementById('item-date').value,
                location: document.getElementById('item-location').value,
                contact: document.getElementById('item-contact').value,
                image: imagePreview.src.startsWith('data:image') ? imagePreview.src : null,
                reportedAt: new Date(),
                reportedBy: localStorage.getItem('username') || 'anonymous',
                status: 'pending'
            };

            items.push(newItem);
            localStorage.setItem('lost-found-items', JSON.stringify(items));
            alert('Your report has been submitted for review.');

            reportForm.reset();
            imagePreview.style.display = 'none';
            
            // Check if we're in admin mode to call the correct render function
            const urlParams = new URLSearchParams(window.location.search);
            const isAdminView = urlParams.get('view') === 'admin';
            
            if (isAdminView) {
                renderAdminItems(); // Re-render the admin view
                renderAdminAnalytics(); // Update charts
                attachAdminClickListener(); // Re-attach the listener
            } else {
                renderItems(); // Re-render the user's view
            }
            
            // Hide the form after submission
            reportFormContainer.style.display = 'none';
        });
    }

    if(searchBar) searchBar.addEventListener('input', renderItems);
    if(filterStatusEl) filterStatusEl.addEventListener('change', renderItems);
    if(sortByEl) sortByEl.addEventListener('change', renderItems);


    // --- Modal Logic ---
    const contactModal = document.getElementById('contact-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const contactForm = document.getElementById('contact-form');
    const contactItemIdInput = document.getElementById('contact-item-id');

    function openModal(itemId) {
        contactItemIdInput.value = itemId;
        contactModal.classList.add('visible');
    }

    function closeModal() {
        contactModal.classList.remove('visible');
        contactForm.reset();
    }

    if(itemList) {
        itemList.addEventListener('click', (e) => {
            if (e.target.classList.contains('contact-btn')) {
                const itemId = e.target.dataset.id;
                openModal(itemId);
            }
        });
    }

    if(closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if(contactModal) contactModal.addEventListener('click', (e) => {
        if (e.target === contactModal) {
            closeModal();
        }
    });

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // In a real app, this would send an email or an in-app message.
            // Here, we'll just simulate it
            const messageData = {
                toItemId: contactItemIdInput.value,
                from: document.getElementById('user-contact-info').value,
                message: document.getElementById('contact-message').value,
                sentAt: new Date()
            };
            alert('Message sent successfully! The item reporter has been notified.');
            closeModal();
        });
    }


    function renderItems() {
        if(!itemList) return;

        let itemsToRender = [...items];

        // 1. Filter by status
        const filterValue = filterStatusEl.value;
        if (filterValue !== 'all') {
            itemsToRender = itemsToRender.filter(item => item.type === filterValue);
        }

        // 2. Filter by search term
        const searchTerm = searchBar.value.toLowerCase();
        if (searchTerm) {
            itemsToRender = itemsToRender.filter(item =>
                item.name.toLowerCase().includes(searchTerm) ||
                item.description.toLowerCase().includes(searchTerm) ||
                item.category.toLowerCase().includes(searchTerm) ||
                item.location.toLowerCase().includes(searchTerm)
            );
        }

        // 3. Sort
        const sortByValue = sortByEl.value;
        itemsToRender.sort((a, b) => {
            const dateA = new Date(a.reportedAt);
            const dateB = new Date(b.reportedAt);
            return sortByValue === 'newest' ? dateB - dateA : dateA - dateB;
        });

        itemList.innerHTML = '';
        if (itemsToRender.length === 0) {
            itemList.innerHTML = '<p class="empty-message">No items match your criteria.</p>';
            return;
        }

        itemsToRender.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'item-card';
            
            // Determine status class for the indicator
            const statusClass = item.type === 'lost' ? 'status-lost' : 'status-found';
            
            itemCard.innerHTML = `
                <div class="item-status ${statusClass}"></div>
                <div class="card-image-container">
                    ${item.image ? `<img src="${item.image}" alt="${sanitizeInput(item.name)}">` : '<div class="no-image">No Image</div>'}
                </div>
                <div class="item-content">
                    <h3>${sanitizeInput(item.name)}</h3>
                    <p>${sanitizeInput(item.description)}</p>
                    <div class="item-meta">
                        <span class="badge category-${item.category}">${sanitizeInput(item.category)}</span>
                        <span class="badge type-${item.type}">${item.type}</span>
                    </div>
                    <div class="item-footer">
                        <div class="item-location">📍 ${item.location} on ${item.date}</div>
                        <button class="contact-btn" data-id="${item.id}">Contact</button>
                    </div>
                </div>
            `;
            itemList.appendChild(itemCard);
        });
    }

function findMatches(currentItem, allItems) {
    if (currentItem.status === 'resolved') return false;

    const currentNameWords = currentItem.name.toLowerCase().split(' ');

    for (const otherItem of allItems) {
        if (otherItem.id === currentItem.id || otherItem.status === 'resolved' || otherItem.type === currentItem.type) {
            continue;
        }

        if (otherItem.category === currentItem.category) {
            const otherNameWords = otherItem.name.toLowerCase().split(' ');
            if (currentNameWords.some(word => word.length > 2 && otherNameWords.includes(word))) {
                return true;
            }
        }
    }
    return false;
}

    function renderAdminTable() {
        const adminTableBody = document.querySelector('#admin-items-table tbody');
        if (!adminTableBody) return;

        adminTableBody.innerHTML = '';

        if (items.length === 0) {
            const row = adminTableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 7; // Span all columns
            cell.innerHTML = '<p class="empty-message">No items have been reported.</p>';
            return;
        }

        items.forEach(item => {
            const row = adminTableBody.insertRow();
            row.className = item.isFlagged ? 'flagged' : '';
            if (findMatches(item, items)) {
                row.classList.add('match-highlight');
            }
            row.innerHTML = `
                <td>${sanitizeInput(item.name)}</td>
                <td>${sanitizeInput(item.category)}</td>

                <td>${sanitizeInput(item.reportedBy)}</td>
                <td>${sanitizeInput(item.contact)}</td>
                <td>${item.date}</td>
                <td><span class="status-badge status-${item.status}">${item.status}</span></td>
                <td>
                    <button class="action-btn approve-btn" data-id="${item.id}" title="Approve">✔️</button>
                    <button class="action-btn resolve-btn" data-id="${item.id}" title="Mark Resolved">🏁</button>
                    <button class="action-btn flag-btn" data-id="${item.id}" title="Flag Item">🚩</button>
                    <button class="action-btn delete-btn" data-id="${item.id}" title="Delete">🗑️</button>
                </td>
            `;
        });
    }

    /**
     * Render admin items in card format
     */
    function renderAdminItems() {
        const adminItemList = document.getElementById('admin-item-list');
        if (!adminItemList) return;

        // Clear existing content
        adminItemList.innerHTML = '';

        if (items.length === 0) {
            adminItemList.innerHTML = '<p class="empty-message">No items have been reported.</p>';
            return;
        }

        // Create a container for the cards
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'admin-cards-container';

        items.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'admin-item-card';
            
            // Add status indicator
            const statusClass = item.type === 'lost' ? 'status-lost' : 'status-found';
            itemCard.innerHTML = `
                <div class="item-status ${statusClass}"></div>
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                    <h3>${sanitizeInput(item.name)}</h3>
                    <span class="status-badge status-${item.status}">
                        ${item.status}
                    </span>
                </div>
                
                <p>${sanitizeInput(item.description)}</p>
                
                <div style="display: flex; flex-wrap: wrap; gap: 10px; margin: 15px 0;">
                    <span class="badge category-${item.category}">
                        ${sanitizeInput(item.category)}
                    </span>
                    <span class="badge type-${item.type}">
                        ${item.type === 'lost' ? 'Lost' : 'Found'}
                    </span>
                </div>
                
                <div style="margin: 15px 0; font-size: 0.9rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>Reported by:</span>
                        <span>${sanitizeInput(item.reportedBy)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>Contact:</span>
                        <span>${sanitizeInput(item.contact)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Date:</span>
                        <span>${item.date}</span>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap;">
                    <button class="action-btn approve-btn" data-id="${item.id}" title="Approve">
                        ✔️ Approve
                    </button>
                    <button class="action-btn resolve-btn" data-id="${item.id}" title="Mark Resolved">
                        🏁 Resolve
                    </button>
                    <button class="action-btn flag-btn" data-id="${item.id}" title="Flag Item">
                        ${item.isFlagged ? '🚩 Unflag' : '🚩 Flag'}
                    </button>
                    <button class="action-btn delete-btn" data-id="${item.id}" title="Delete">
                        🗑️ Delete
                    </button>
                </div>
            `;
            
            cardsContainer.appendChild(itemCard);
        });
        
        adminItemList.appendChild(cardsContainer);
    }

    /**
     * Updates the status of a specific item.
     * @param {number} itemId The ID of the item to update.
     * @param {string} newStatus The new status ('pending', 'approved', 'resolved').
     */
    function updateItemStatus(itemId, newStatus) {
        const itemIndex = items.findIndex(item => item.id === itemId);
        if (itemIndex > -1) {
            items[itemIndex].status = newStatus;
            localStorage.setItem('lost-found-items', JSON.stringify(items));
            
            // Check if we're in admin mode to call the correct render function
            const urlParams = new URLSearchParams(window.location.search);
            const isAdminView = urlParams.get('view') === 'admin';
            
            if (isAdminView) {
                renderAdminItems();
                attachAdminClickListener(); // Re-attach the listener
            } else {
                renderItems();
            }
        }
    }

    /**
     * Draws the analytics chart for the admin view.
     */
    function renderAdminAnalytics() {
        // Only render charts if we're in admin view and charts exist
        const isAdminView = new URLSearchParams(window.location.search).get('view') === 'admin';
        if (!isAdminView) return;
        
        // Make sure the canvas elements exist
        const lostFoundChart = document.getElementById('lost-found-admin-chart');
        const categoryChart = document.getElementById('category-chart');
        const trendChart = document.getElementById('trend-chart');
        
        if (!lostFoundChart || !categoryChart || !trendChart) return;
        
        // Chart 1: Lost vs Found
        const lostCount = items.filter(item => item.type === 'lost').length;
        const foundCount = items.filter(item => item.type === 'found').length;
        drawBarChart('lost-found-admin-chart', {
            labels: ['Lost', 'Found'],
            values: [lostCount, foundCount]
        }, { barColor: '#ffd700' });

        // Chart 2: By Category
        const categoryCounts = items.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + 1;
            return acc;
        }, {});
        drawBarChart('category-chart', {
            labels: Object.keys(categoryCounts),
            values: Object.values(categoryCounts)
        }, { barColor: '#9c88ff' });

        // Chart 3: Reports this week
        const today = new Date();
        const last7Days = Array(7).fill(0).map((_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - i);
            return d.toISOString().split('T')[0]; // Get YYYY-MM-DD
        }).reverse();

        const reportCounts = last7Days.map(dateStr => {
            return items.filter(item => {
                const itemDate = new Date(item.reportedAt).toISOString().split('T')[0];
                return itemDate === dateStr;
            }).length;
        });

        drawBarChart('trend-chart', {
            labels: last7Days.map(d => new Date(d).toLocaleDateString(undefined, {weekday: 'short'})),
            values: reportCounts
        }, { barColor: '#e84118' });
    }


    // --- Voice Command Logic ---
    if ('webkitSpeechRecognition' in window) {
        const voiceEnabled = localStorage.getItem('voice-enabled') !== 'false';
        if (!voiceEnabled) {
            return;
        }

        const recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const command = event.results[last][0].transcript.trim().toLowerCase();

            if (command.includes('report') && command.includes('item')) {
                speak('Opening the report form for you.');
                document.getElementById('report-form').scrollIntoView({ behavior: 'smooth' });
            } else if (command.includes('show found items')) {
                speak('Filtering to show found items.');
                filterStatusEl.value = 'found';
                renderItems();
            } else if (command.includes('show lost items')) {
                speak('Filtering to show lost items.');
                filterStatusEl.value = 'lost';
                renderItems();
            } else if (command.includes('show all items')) {
                speak('Showing all items.');
                filterStatusEl.value = 'all';
                renderItems();
            }

            // Admin-specific commands
            const isAdminView = new URLSearchParams(window.location.search).get('view') === 'admin';
            if (isAdminView && command.includes('delete flagged items')) {
                if (confirm('Are you sure you want to delete all flagged items?')) {
                    speak('Deleting all flagged items.');
                    items = items.filter(item => !item.isFlagged);
                    localStorage.setItem('lost-found-items', JSON.stringify(items));
                    renderAdminItems();
                }
            }
        };

        recognition.onerror = (event) => {
            // Silent error handling
        };

        // Start listening
        try {
            recognition.start();
        } catch(e) {
            // Silent error handling
        }
    }


    // Function to attach admin click listener
    function attachAdminClickListener() {
        // --- Admin Card Action Logic ---
        // Use event delegation on the admin item list container
        const adminItemList = document.getElementById('admin-item-list');
        if (adminItemList) {
            // Remove any existing listener to avoid duplicates
            adminItemList.removeEventListener('click', handleAdminClick);
            // Add the listener
            adminItemList.addEventListener('click', handleAdminClick);
        }
    }
    
    // Handler function for admin clicks
    function handleAdminClick(e) {
        // Check if we're in admin view
        const urlParams = new URLSearchParams(window.location.search);
        const isAdminView = urlParams.get('view') === 'admin';
        
        if (!isAdminView) {
            return;
        }
        
        // Find the closest action button (to handle clicks on button content)
        const actionButton = e.target.closest('.action-btn');
        if (actionButton) {
            e.preventDefault(); // Prevent any default action
            e.stopPropagation(); // Stop event from bubbling up
            const itemId = parseInt(actionButton.dataset.id, 10);
            const itemIndex = items.findIndex(item => item.id === itemId);

            if (itemIndex === -1) {
                return;
            }

            let shouldUpdate = false;
            
            if (actionButton.classList.contains('delete-btn')) {
                if (confirm('Are you sure you want to delete this item?')) {
                    items.splice(itemIndex, 1);
                    shouldUpdate = true;
                }
            } else if (actionButton.classList.contains('approve-btn')) {
                items[itemIndex].status = 'approved';
                shouldUpdate = true;
            } else if (actionButton.classList.contains('resolve-btn')) {
                items[itemIndex].status = 'resolved';
                shouldUpdate = true;
            } else if (actionButton.classList.contains('flag-btn')) {
                items[itemIndex].isFlagged = !items[itemIndex].isFlagged; // Toggle flag
                shouldUpdate = true;
            }

            // Save the updated items to localStorage and re-render only if changes were made
            if (shouldUpdate) {
                localStorage.setItem('lost-found-items', JSON.stringify(items));
                
                // Re-render the admin view
                renderAdminItems(); // Render cards instead of table
                renderAdminAnalytics(); // Update charts when items change
            }
        }
    }
    
    // Attach the listener initially if in admin view
    if (isAdminView) {
        attachAdminClickListener();
    }
});