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
    const toggleFormBtn = document.getElementById('toggle-form-btn'); // New toggle button

    const userView = document.getElementById('user-view');
    const adminView = document.getElementById('admin-view');

    // Create image modal elements
    const imageModal = document.createElement('div');
    imageModal.className = 'image-modal';
    imageModal.innerHTML = `
        <div class="image-modal-content">
            <button class="image-modal-close">&times;</button>
            <img src="" alt="Full size image">
            <div class="image-modal-caption"></div>
        </div>
    `;
    document.body.appendChild(imageModal);

    // Add event listener for closing the modal
    imageModal.addEventListener('click', (e) => {
        if (e.target === imageModal || e.target.classList.contains('image-modal-close')) {
            imageModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // Use Supabase instead of localStorage
    let items = [];

    // Check for admin view
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminView = urlParams.get('view') === 'admin';

    // Add a flag to prevent multiple simultaneous calls to renderAdminAnalytics
    let isRenderingAnalytics = false;

    // Initialize the module
    initModule();

    // Add event listener for the toggle button
    if (toggleFormBtn) {
        toggleFormBtn.addEventListener('click', () => {
            if (reportForm.style.display === 'none') {
                reportForm.style.display = 'flex';
                toggleFormBtn.textContent = 'Hide Form';
            } else {
                reportForm.style.display = 'none';
                toggleFormBtn.textContent = 'Report an Item';
            }
        });
    }

    async function initModule() {
        if (isAdminView) {
            document.body.classList.add('admin-mode');
            userView.style.display = 'none';
            adminView.style.display = 'block';
            document.querySelector('.back-link').href = '../../admin.html';
            document.querySelector('h1').textContent = 'Manage Lost & Found';
            await renderAdminTable();
            await renderAdminAnalytics();
        } else {
            document.body.classList.add('user-mode');
            userView.style.display = 'block';
            adminView.style.display = 'none';
            await renderItems();
        }
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

            try {
                const newItem = {
                    name: itemNameInput.value,
                    description: itemDescriptionInput.value,
                    type: document.getElementById('item-type').value,
                    category: document.getElementById('item-category').value,
                    date: document.getElementById('item-date').value,
                    location: document.getElementById('item-location').value,
                    contact: document.getElementById('item-contact').value,
                    image_url: imagePreview.src.startsWith('data:image') ? imagePreview.src : null,
                    reported_by: localStorage.getItem('username') || 'anonymous'
                };

                const result = await addItem(newItem);
                
                if (result.success) {
                    alert('Your report has been submitted for review.');
                    reportForm.reset();
                    imagePreview.style.display = 'none';
                    // Hide the form after submission
                    reportForm.style.display = 'none';
                    toggleFormBtn.textContent = 'Report an Item';
                    await renderItems(); // Re-render the user's view
                } else {
                    alert('Error submitting report: ' + result.error);
                }
            } catch (error) {
                console.error('Error submitting report:', error);
                alert('Error submitting report. Please try again.');
            } finally {
                // Restore button state
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    }

    if(searchBar) searchBar.addEventListener('input', renderItems);
    if(filterStatusEl) filterStatusEl.addEventListener('change', renderItems);
    if(sortByEl) sortByEl.addEventListener('change', renderItems);


    async function renderItems() {
        if(!itemList) return;

        // Show loading state
        itemList.innerHTML = '<p class="empty-message">Loading items...</p>';

        try {
            // Get items from Supabase
            const filters = {
                type: filterStatusEl.value,
                searchTerm: searchBar.value
            };

            const result = await getFilteredItems(filters);
            
            if (!result.success) {
                itemList.innerHTML = '<p class="empty-message">Error loading items. Please try again.</p>';
                return;
            }

            items = result.data;

            // Sort items
            const sortByValue = sortByEl.value;
            items.sort((a, b) => {
                const dateA = new Date(a.reported_at);
                const dateB = new Date(b.reported_at);
                return sortByValue === 'newest' ? dateB - dateA : dateA - dateB;
            });

            itemList.innerHTML = '';
            if (items.length === 0) {
                itemList.innerHTML = '<p class="empty-message">No items match your criteria.</p>';
                return;
            }

            items.forEach(item => {
                const itemCard = document.createElement('div');
                itemCard.className = 'item-card';
                itemCard.innerHTML = `
                    <div class="card-image-container" data-image="${item.image_url || ''}" data-name="${sanitizeInput(item.name)}">
                        ${item.image_url ? `<img src="${item.image_url}" alt="${sanitizeInput(item.name)}">` : '<div class="no-image">No Image</div>'}
                    </div>
                    <div class="item-card-content">
                        <h3>${sanitizeInput(item.name)}</h3>
                        <p class="item-meta">
                            <span class="badge category-${item.category}">${sanitizeInput(item.category)}</span>
                            <span class="badge type-${item.type}">${item.type}</span>
                        </p>
                        <p>${sanitizeInput(item.description)}</p>
                        <small>Last Seen/Found: ${item.location} on ${item.date}</small>
                        <div class="contact-info">
                            <p><strong>Reported by:</strong> ${sanitizeInput(item.reported_by)}</p>
                            <p><strong>Contact:</strong> ${sanitizeInput(item.contact)}</p>
                        </div>
                    </div>
                `;
                itemList.appendChild(itemCard);
            });

            // Add event listeners to image containers
            document.querySelectorAll('.card-image-container').forEach(container => {
                container.addEventListener('click', function() {
                    const imageUrl = this.getAttribute('data-image');
                    const itemName = this.getAttribute('data-name');
                    
                    if (imageUrl) {
                        const modalImg = imageModal.querySelector('img');
                        const modalCaption = imageModal.querySelector('.image-modal-caption');
                        
                        modalImg.src = imageUrl;
                        modalImg.alt = itemName;
                        modalCaption.textContent = itemName;
                        
                        imageModal.classList.add('active');
                        document.body.style.overflow = 'hidden';
                    }
                });
            });
        } catch (error) {
            console.error('Error rendering items:', error);
            itemList.innerHTML = '<p class="empty-message">Error loading items. Please try again.</p>';
        }
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

    async function renderAdminTable() {
        const adminTableBody = document.querySelector('#admin-items-table tbody');
        if (!adminTableBody) return;

        // Show loading state
        adminTableBody.innerHTML = '<tr><td colspan="7"><p class="empty-message">Loading items...</p></td></tr>';

        try {
            const result = await getAllItems();
            
            if (!result.success) {
                adminTableBody.innerHTML = '<tr><td colspan="7"><p class="empty-message">Error loading items. Please try again.</p></td></tr>';
                return;
            }

            items = result.data;

            adminTableBody.innerHTML = '';

            if (items.length === 0) {
                const row = adminTableBody.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 7; // Span all columns
                cell.innerHTML = '<p class="empty-message">No items have been reported.</p>';
                return;
            }

            // Render table rows
            items.forEach(item => {
                const row = adminTableBody.insertRow();
                row.dataset.flagged = item.is_flagged;
                
                row.innerHTML = `
                    <td>${sanitizeInput(item.name)}</td>
                    <td>${sanitizeInput(item.category)}</td>
                    <td>${sanitizeInput(item.reported_by)}</td>
                    <td>${sanitizeInput(item.contact)}</td>
                    <td>${new Date(item.date).toLocaleDateString()}</td>
                    <td><span class="status-badge ${item.status}">${item.status}</span></td>
                    <td>
                        <button class="action-btn approve-btn" data-id="${item.id}" title="Approve">✔️</button>
                        <button class="action-btn resolve-btn" data-id="${item.id}" title="Mark Resolved">🏁</button>
                        <button class="action-btn flag-btn ${item.is_flagged ? 'flagged' : ''}" data-id="${item.id}" title="${item.is_flagged ? 'Unflag' : 'Flag'} Item">🚩</button>
                        <button class="action-btn delete-btn" data-id="${item.id}" title="Delete">🗑️</button>
                    </td>
                `;
            });

        } catch (error) {
            console.error('Error rendering admin table:', error);
            adminTableBody.innerHTML = '<tr><td colspan="7"><p class="empty-message">Error loading items. Please try again.</p></td></tr>';
        }
    }

    /**
     * Updates the status of a specific item.
     * @param {number} itemId The ID of the item to update.
     * @param {string} newStatus The new status ('pending', 'approved', 'resolved').
     */
    async function handleUpdateItemStatus(itemId, newStatus) {
        try {
            const result = await updateItemStatus(itemId, newStatus);
            
            if (result.success) {
                await renderAdminTable(); // Refresh the table
            } else {
                // Prevent page refresh by not using alert directly in event handlers
                showStatusMessage('Error updating item status: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error updating item status:', error);
            showStatusMessage('Error updating item status. Please try again.', 'error');
        }
    }

    /**
     * Shows a status message to the user
     * @param {string} message The message to display
     * @param {string} type The type of message ('success', 'error', 'warning')
     */
    function showStatusMessage(message, type) {
        // Create a temporary notification element
        const notification = document.createElement('div');
        notification.className = `status-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            background: ${type === 'error' ? '#e63946' : type === 'success' ? '#2a9d8f' : '#f4a261'};
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Draws the analytics chart for the admin view.
     */
    async function renderAdminAnalytics() {
        // Prevent multiple simultaneous calls
        if (isRenderingAnalytics) {
            console.log('Analytics rendering already in progress, skipping...');
            return;
        }
        
        isRenderingAnalytics = true;
        
        try {
            const result = await getAnalyticsData();
            
            if (!result.success) {
                console.error('Error fetching analytics data:', result.error);
                return;
            }

            // Get chart contexts
            const lostFoundCtx = document.getElementById('lost-found-admin-chart')?.getContext('2d');
            const categoryCtx = document.getElementById('category-chart')?.getContext('2d');
            const trendCtx = document.getElementById('trend-chart')?.getContext('2d');

            if (!lostFoundCtx || !categoryCtx || !trendCtx) return;

            // Clear existing charts
            if (window.lostFoundChart) window.lostFoundChart.destroy();
            if (window.categoryChart) window.categoryChart.destroy();
            if (window.trendChart) window.trendChart.destroy();

            // Create new charts
            window.lostFoundChart = new Chart(lostFoundCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Lost', 'Found'],
                    datasets: [{
                        data: [
                            result.data.lostFound.lost || 0,
                            result.data.lostFound.found || 0
                        ],
                        backgroundColor: ['#FF6B6B', '#4ECDC4'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    aspectRatio: 1, // Explicitly set aspect ratio
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#e0e0ff',
                                font: {
                                    size: 10
                                }
                            }
                        }
                    },
                    // Add explicit dimensions to prevent continuous growth
                    layout: {
                        padding: 10
                    },
                    animation: {
                        duration: 1000 // Limit animation duration
                    }
                }
            });

            // Category chart - using drawBarChart instead of Chart.js
            const categoryLabels = Object.keys(result.data.categories);
            const categoryData = Object.values(result.data.categories);

            // Clear existing chart
            const categoryCanvas = document.getElementById('category-chart');
            if (categoryCanvas) {
                const categoryCtx = categoryCanvas.getContext('2d');
                categoryCtx.clearRect(0, 0, categoryCanvas.width, categoryCanvas.height);
                
                // Cancel any existing animation before drawing new chart
                if (categoryCanvas.animationFrameId) {
                    cancelAnimationFrame(categoryCanvas.animationFrameId);
                }
                
                // Use drawBarChart from utils.js
                drawBarChart('category-chart', {
                    labels: categoryLabels,
                    values: categoryData
                }, {
                    barColor: '#FFA500',
                    labelColor: '#212529'
                });
            }

            // Trend chart - using drawBarChart instead of Chart.js
            const trendLabels = Object.keys(result.data.trend);
            const trendValues = Object.values(result.data.trend);

            // Clear existing chart
            const trendCanvas = document.getElementById('trend-chart');
            if (trendCanvas) {
                const trendCtx = trendCanvas.getContext('2d');
                trendCtx.clearRect(0, 0, trendCanvas.width, trendCanvas.height);
                
                // Cancel any existing animation before drawing new chart
                if (trendCanvas.animationFrameId) {
                    cancelAnimationFrame(trendCanvas.animationFrameId);
                }
                
                // Use drawBarChart from utils.js
                drawBarChart('trend-chart', {
                    labels: trendLabels,
                    values: trendValues
                }, {
                    barColor: '#2A9D8F',
                    labelColor: '#212529'
                });
            }

        } catch (error) {
            console.error('Error rendering admin analytics:', error);
        } finally {
            // Reset the flag when done
            isRenderingAnalytics = false;
        }
    }

    // --- Admin Event Listeners ---
    if(adminItemList) {
        adminItemList.addEventListener('click', async (e) => {
            const itemId = e.target.closest('.action-btn')?.dataset.id;
            if (!itemId) return;

            if (e.target.closest('.approve-btn')) {
                if (confirm('Approve this item?')) {
                    await handleUpdateItemStatus(itemId, 'approved');
                }
            } else if (e.target.closest('.resolve-btn')) {
                if (confirm('Mark this item as resolved?')) {
                    await handleUpdateItemStatus(itemId, 'resolved');
                }
            } else if (e.target.closest('.flag-btn')) {
                const itemRow = e.target.closest('tr');
                const isFlagged = itemRow.dataset.flagged === 'true';
                const result = await toggleItemFlag(itemId, !isFlagged);
                if (result.success) {
                    await renderAdminTable();
                    showStatusMessage(`Item ${!isFlagged ? 'flagged' : 'unflagged'} successfully`, 'success');
                } else {
                    showStatusMessage('Error toggling item flag: ' + result.error, 'error');
                }
            } else if (e.target.closest('.delete-btn')) {
                if (confirm('Delete this item? This cannot be undone.')) {
                    const result = await deleteItem(itemId);
                    if (result.success) {
                        await renderAdminTable();
                        showStatusMessage('Item deleted successfully', 'success');
                    } else {
                        showStatusMessage('Error deleting item: ' + result.error, 'error');
                    }
                }
            }
            
            // Prevent default behavior to avoid page refresh
            e.preventDefault();
        });
    }

    // --- Admin Analytics Toggle ---
    const analyticsToggle = document.createElement('button');
    analyticsToggle.className = 'form-toggle-btn';
    analyticsToggle.textContent = 'Toggle Analytics';
    analyticsToggle.style.marginTop = '20px';
    
    const analyticsPanel = document.querySelector('.analytics-panel');
    if (analyticsPanel) {
        analyticsPanel.parentNode.insertBefore(analyticsToggle, analyticsPanel.nextSibling);
        
        analyticsToggle.addEventListener('click', () => {
            analyticsPanel.style.display = analyticsPanel.style.display === 'none' ? 'block' : 'none';
        });
    }
});