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

    // Use backend API instead of localStorage
    let items = [];

    // Check for admin view
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminView = urlParams.get('view') === 'admin';

    // Debugging: Check if dataService is available
    console.log('Data service available:', !!window.dataService);
    if (window.dataService) {
        console.log('Data service baseURL:', window.dataService.baseURL);
    } else {
        console.warn('Data service not available, will use localStorage fallback');
    }

    // Load items from backend
    loadItems();

    if (isAdminView) {
        document.body.classList.add('admin-mode');
        userView.style.display = 'none';
        adminView.style.display = 'block';
        document.querySelector('.back-link').href = '../../admin.html';
        document.querySelector('h1').textContent = 'Manage Lost & Found';
        // Admin table will be rendered after items are loaded
    } else {
        document.body.classList.add('user-mode');
        userView.style.display = 'block';
        adminView.style.display = 'none';
        // User items will be rendered after items are loaded
    }

    if(itemNameInput) itemNameInput.addEventListener('input', () => validateField(itemNameInput));
    if(itemDescriptionInput) itemDescriptionInput.addEventListener('input', () => validateField(itemDescriptionInput));

    if (itemImageInput) {
        itemImageInput.addEventListener('change', () => {
            const file = itemImageInput.files[0];
            if (file) {
                // Check file size (max 2MB)
                if (file.size > 2 * 1024 * 1024) {
                    alert('Image size should be less than 2MB');
                    itemImageInput.value = '';
                    return;
                }
                
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
        reportForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const isNameValid = validateField(itemNameInput);
            const isDescriptionValid = validateField(itemDescriptionInput);

            if (!isNameValid || !isDescriptionValid) {
                speak("Please fill out all required fields.");
                return;
            }

            // Show loading state
            const submitButton = reportForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Submitting...';
            submitButton.disabled = true;

            const newItem = {
                name: itemNameInput.value,
                description: itemDescriptionInput.value,
                type: document.getElementById('item-type').value,
                category: document.getElementById('item-category').value,
                date: document.getElementById('item-date').value,
                location: document.getElementById('item-location').value,
                contact: document.getElementById('item-contact').value,
                image: imagePreview.src.startsWith('data:image') ? imagePreview.src : null
            };

            try {
                console.log('Attempting to submit item:', newItem);
                console.log('Data service available:', !!window.dataService);
                
                if (window.dataService) {
                    console.log('Using data service to create item');
                    const result = await window.dataService.createLostFoundItem(newItem);
                    console.log('API response:', result);
                    
                    if (result.success) {
                        alert('Your report has been submitted successfully!');
                        reportForm.reset();
                        imagePreview.style.display = 'none';
                        // Reload items to show the new one
                        await loadItems();
                    } else {
                        alert(result.message || 'Failed to submit your report. Please try again.');
                    }
                } else {
                    console.log('Falling back to localStorage');
                    // Fallback to localStorage
                    newItem.id = Date.now();
                    newItem.reportedAt = new Date();
                    newItem.reportedBy = localStorage.getItem('username') || 'anonymous';
                    newItem.status = 'pending';
                    
                    let items = JSON.parse(localStorage.getItem('lost-found-items')) || [];
                    items.push(newItem);
                    localStorage.setItem('lost-found-items', JSON.stringify(items));
                    alert('Your report has been submitted for review.');
                    reportForm.reset();
                    imagePreview.style.display = 'none';
                    loadItems(); // Re-render the user's view
                }
            } catch (error) {
                console.error('Error submitting report:', error);
                alert('An error occurred while submitting your report. Please try again.');
            } finally {
                // Restore button state
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    }

    if(searchBar) searchBar.addEventListener('input', handleSearch);
    if(filterStatusEl) filterStatusEl.addEventListener('change', loadItems);
    if(sortByEl) sortByEl.addEventListener('change', loadItems);


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
            // Here, we'll just simulate it and log to console.
            const messageData = {
                toItemId: contactItemIdInput.value,
                from: document.getElementById('user-contact-info').value,
                message: document.getElementById('contact-message').value,
                sentAt: new Date()
            };
            console.log("Simulated Message Sent:", messageData);
            alert('Message sent successfully! The item reporter has been notified.');
            closeModal();
        });
    }

    // Load items from backend or localStorage
    async function loadItems() {
        try {
            console.log('Loading items, data service available:', !!window.dataService);
            
            if (window.dataService) {
                // For search, use search endpoint
                if (searchBar && searchBar.value.trim() !== '') {
                    console.log('Searching items with query:', searchBar.value);
                    items = await window.dataService.searchLostFoundItems(searchBar.value);
                } else {
                    console.log('Loading all items from API');
                    items = await window.dataService.getLostFoundItems();
                }
                console.log('Items loaded from API:', items);
            } else {
                console.log('Loading items from localStorage');
                // Fallback to localStorage
                items = JSON.parse(localStorage.getItem('lost-found-items')) || [];
                console.log('Items loaded from localStorage:', items);
            }
            
            // Apply filters and sorting
            renderItems();
            
            // If in admin view, also render admin table
            if (isAdminView) {
                renderAdminTable();
                renderAdminAnalytics();
            }
        } catch (error) {
            console.error('Error loading items:', error);
            // Fallback to localStorage
            items = JSON.parse(localStorage.getItem('lost-found-items')) || [];
            renderItems();
            if (isAdminView) {
                renderAdminTable();
                renderAdminAnalytics();
            }
        }
    }

    function handleSearch() {
        // Debounce search to avoid too many API calls
        clearTimeout(handleSearch.timeout);
        handleSearch.timeout = setTimeout(() => {
            loadItems();
        }, 300);
    }

    function renderItems() {
        if(!itemList) return;

        let itemsToRender = [...items];

        // 1. Filter by status
        const filterValue = filterStatusEl.value;
        if (filterValue !== 'all') {
            itemsToRender = itemsToRender.filter(item => item.type === filterValue);
        }

        // 2. Filter by search term (if not using search API)
        if (!window.dataService && searchBar) {
            const searchTerm = searchBar.value.toLowerCase();
            if (searchTerm) {
                itemsToRender = itemsToRender.filter(item =>
                    item.name.toLowerCase().includes(searchTerm) ||
                    item.description.toLowerCase().includes(searchTerm) ||
                    item.category.toLowerCase().includes(searchTerm) ||
                    item.location.toLowerCase().includes(searchTerm)
                );
            }
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
            itemCard.innerHTML = `
                <div class="card-image-container">
                    ${item.image ? `<img src="${item.image}" alt="${sanitizeInput(item.name)}">` : '<div class="no-image">No Image</div>'}
                </div>
                <h3>${sanitizeInput(item.name)}</h3>
                <p class="item-meta">
                    <span class="badge category-${item.category}">${sanitizeInput(item.category)}</span>
                    <span class="badge type-${item.type}">${item.type}</span>
                </p>
                <p>${sanitizeInput(item.description)}</p>
                <small>Last Seen/Found: ${item.location} on ${item.date}</small>
                <button class="contact-btn" data-id="${item.id || item._id}">Contact</button>
            `;
            itemList.appendChild(itemCard);
        });
    }

function findMatches(currentItem, allItems) {
    if (currentItem.status === 'resolved') return false;

    const currentNameWords = currentItem.name.toLowerCase().split(' ');

    for (const otherItem of allItems) {
        if ((otherItem.id === currentItem.id || otherItem._id === currentItem._id) || 
            otherItem.status === 'resolved' || otherItem.type === currentItem.type) {
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
                    <button class="action-btn approve-btn" data-id="${item.id || item._id}" title="Approve">✔️</button>
                    <button class="action-btn resolve-btn" data-id="${item.id || item._id}" title="Mark Resolved">🏁</button>
                    <button class="action-btn flag-btn" data-id="${item.id || item._id}" title="Flag Item">🚩</button>
                    <button class="action-btn delete-btn" data-id="${item.id || item._id}" title="Delete">🗑️</button>
                </td>
            `;
        });
    }

    /**
     * Updates the status of a specific item.
     * @param {number} itemId The ID of the item to update.
     * @param {string} newStatus The new status ('pending', 'approved', 'resolved').
     */
    async function updateItemStatus(itemId, newStatus) {
        // This would need to be implemented with backend API calls
        // For now, we'll keep the localStorage implementation as a fallback
        if (window.dataService) {
            // TODO: Implement update status API call
            console.log('Update status API call needed for item:', itemId, 'status:', newStatus);
        } else {
            // Fallback to localStorage
            let items = JSON.parse(localStorage.getItem('lost-found-items')) || [];
            const itemIndex = items.findIndex(item => item.id == itemId);
            if (itemIndex > -1) {
                items[itemIndex].status = newStatus;
                localStorage.setItem('lost-found-items', JSON.stringify(items));
                loadItems();
            }
        }
    }

    /**
     * Draws the analytics chart for the admin view.
     */
    function renderAdminAnalytics() {
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
            console.log('Voice commands disabled by user setting.');
            return;
        }

        const recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const command = event.results[last][0].transcript.trim().toLowerCase();
            console.log('Voice command received:', command);

            if (command.includes('report') && command.includes('item')) {
                speak('Opening the report form for you.');
                document.getElementById('report-form').scrollIntoView({ behavior: 'smooth' });
            } else if (command.includes('show found items')) {
                speak('Filtering to show found items.');
                filterStatusEl.value = 'found';
                loadItems();
            } else if (command.includes('show lost items')) {
                speak('Filtering to show lost items.');
                filterStatusEl.value = 'lost';
                loadItems();
            } else if (command.includes('show all items')) {
                speak('Showing all items.');
                filterStatusEl.value = 'all';
                loadItems();
            }

            // Admin-specific commands
            if (isAdminView && command.includes('delete flagged items')) {
                if (confirm('Are you sure you want to delete all flagged items?')) {
                    speak('Deleting all flagged items.');
                    // This would need to be implemented with backend API calls
                    if (window.dataService) {
                        // TODO: Implement delete flagged items API call
                        console.log('Delete flagged items API call needed');
                    } else {
                        // Fallback to localStorage
                        items = items.filter(item => !item.isFlagged);
                        localStorage.setItem('lost-found-items', JSON.stringify(items));
                        loadItems();
                    }
                }
            }
        };

        recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
        };

        // Start listening
        try {
            recognition.start();
        } catch(e) {
            console.warn("Voice recognition could not be started automatically.", e.message);
        }
    }


    // --- Admin Table Action Logic ---
    const adminTableBody = document.querySelector('#admin-items-table tbody');
    if (adminTableBody) {
        adminTableBody.addEventListener('click', async (e) => {
            if (e.target.classList.contains('action-btn')) {
                const itemId = e.target.dataset.id;
                
                if (e.target.classList.contains('delete-btn')) {
                    if (confirm('Are you sure you want to delete this item?')) {
                        try {
                            if (window.dataService) {
                                const result = await window.dataService.deleteLostFoundItem(itemId);
                                if (result.success) {
                                    alert('Item deleted successfully');
                                    loadItems(); // Reload items
                                } else {
                                    alert(result.message || 'Failed to delete item');
                                }
                            } else {
                                // Fallback to localStorage
                                let items = JSON.parse(localStorage.getItem('lost-found-items')) || [];
                                const itemIndex = items.findIndex(item => item.id == itemId || item._id == itemId);
                                if (itemIndex !== -1) {
                                    items.splice(itemIndex, 1);
                                    localStorage.setItem('lost-found-items', JSON.stringify(items));
                                    loadItems();
                                }
                            }
                        } catch (error) {
                            console.error('Error deleting item:', error);
                            alert('Failed to delete item. Please try again.');
                        }
                    }
                } else if (e.target.classList.contains('approve-btn')) {
                    // Update status to approved
                    if (window.dataService) {
                        // TODO: Implement update status API call
                        console.log('Approve item API call needed for item:', itemId);
                    } else {
                        // Fallback to localStorage
                        let items = JSON.parse(localStorage.getItem('lost-found-items')) || [];
                        const itemIndex = items.findIndex(item => item.id == itemId || item._id == itemId);
                        if (itemIndex !== -1) {
                            items[itemIndex].status = 'approved';
                            localStorage.setItem('lost-found-items', JSON.stringify(items));
                            loadItems();
                        }
                    }
                } else if (e.target.classList.contains('resolve-btn')) {
                    // Update status to resolved
                    if (window.dataService) {
                        // TODO: Implement update status API call
                        console.log('Resolve item API call needed for item:', itemId);
                    } else {
                        // Fallback to localStorage
                        let items = JSON.parse(localStorage.getItem('lost-found-items')) || [];
                        const itemIndex = items.findIndex(item => item.id == itemId || item._id == itemId);
                        if (itemIndex !== -1) {
                            items[itemIndex].status = 'resolved';
                            localStorage.setItem('lost-found-items', JSON.stringify(items));
                            loadItems();
                        }
                    }
                } else if (e.target.classList.contains('flag-btn')) {
                    // Toggle flag
                    if (window.dataService) {
                        // TODO: Implement flag toggle API call
                        console.log('Flag item API call needed for item:', itemId);
                    } else {
                        // Fallback to localStorage
                        let items = JSON.parse(localStorage.getItem('lost-found-items')) || [];
                        const itemIndex = items.findIndex(item => item.id == itemId || item._id == itemId);
                        if (itemIndex !== -1) {
                            items[itemIndex].isFlagged = !items[itemIndex].isFlagged;
                            localStorage.setItem('lost-found-items', JSON.stringify(items));
                            loadItems();
                        }
                    }
                }
            }
        });
    }
});