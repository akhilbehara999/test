document.addEventListener('DOMContentLoaded', async () => {
    // Hide loader and show content
    const loader = document.getElementById('loader-wrapper');
    if (loader) {
        loader.classList.add('hidden');
    }
    document.body.classList.add('loaded');
    
    // Check for session token and admin role
    if (!localStorage.getItem('sessionToken') || localStorage.getItem('userRole') !== 'admin') {
        window.location.href = 'index.html';
        return; // Stop execution if not an admin
    }

    const logoutBtn = document.getElementById('logout-btn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('sessionToken');
            localStorage.removeItem('userRole');
            localStorage.removeItem('username');
            window.location.href = 'index.html';
        });
    }

    // Removed AI Configuration button functionality

    /**
     * Populates the overview cards with real and simulated data.
     */
    async function populateOverviewCards() {
        // Total Users
        const totalUsersEl = document.getElementById('total-users');
        if (totalUsersEl) {
            const users = await getUsers();
            totalUsersEl.textContent = users.length;
        }

        // System Usage (Simulated)
        const systemUsageEl = document.getElementById('system-usage');
        if (systemUsageEl) {
            systemUsageEl.textContent = `${(Math.random() * 20 + 70).toFixed(1)}%`;
        }

        // Recent Alerts (Simulated)
        const recentAlertsEl = document.getElementById('recent-alerts');
        if (recentAlertsEl) {
            recentAlertsEl.textContent = '2'; // Placeholder value
        }
    }

    /**
     * Populates the admin insights with real and calculated data.
     */
    async function populateAdminInsights() {
        // System Analytics
        const activeSessionsEl = document.getElementById('active-sessions');
        const dailyLoginsEl = document.getElementById('daily-logins');
        const moduleUsageEl = document.getElementById('module-usage');
        
        if (activeSessionsEl) {
            // Simulate active sessions based on recent activity
            const users = await getUsers();
            const activeSessions = users.filter(user => user.lastLogin !== 'N/A').length;
            activeSessionsEl.textContent = activeSessions;
        }
        
        if (dailyLoginsEl) {
            // Simulate daily logins (could be enhanced with real tracking)
            const dailyLogins = Math.floor(Math.random() * 15) + 5;
            dailyLoginsEl.textContent = dailyLogins;
        }
        
        if (moduleUsageEl) {
            // Calculate module usage based on stored data
            const moduleData = {
                'lost-found': JSON.parse(localStorage.getItem('lost-found-items') || '[]').length,
                'quiz': JSON.parse(localStorage.getItem('quiz-results') || '[]').length,
                'storage': Object.keys(localStorage).filter(key => key.startsWith('file-')).length
            };
            const totalUsage = Object.values(moduleData).reduce((sum, count) => sum + count, 0);
            moduleUsageEl.textContent = totalUsage;
        }
        
        // Performance Metrics
        const loadTimeEl = document.getElementById('load-time');
        const errorRateEl = document.getElementById('error-rate');
        const cacheRateEl = document.getElementById('cache-rate');
        
        if (loadTimeEl && window.performanceOptimizer) {
            const metrics = window.performanceOptimizer.getPerformanceMetrics();
            const loadTime = metrics.loadComplete ? (metrics.loadComplete / 1000).toFixed(2) + 's' : '< 1s';
            loadTimeEl.textContent = loadTime;
            loadTimeEl.className = 'perf-value ' + (metrics.loadComplete > 3000 ? 'warning' : 'good');
        } else if (loadTimeEl) {
            loadTimeEl.textContent = '< 2s';
            loadTimeEl.className = 'perf-value good';
        }
        
        if (errorRateEl && window.errorHandler) {
            const errorStats = window.errorHandler.getErrorStats();
            const errorRate = errorStats.total > 0 ? ((errorStats.total / 100) * 100).toFixed(1) + '%' : '0%';
            errorRateEl.textContent = errorRate;
            errorRateEl.className = 'perf-value ' + (errorStats.total > 5 ? 'warning' : 'good');
        } else if (errorRateEl) {
            errorRateEl.textContent = '< 1%';
            errorRateEl.className = 'perf-value good';
        }
        
        if (cacheRateEl && window.performanceOptimizer) {
            const cacheStats = window.performanceOptimizer.getCacheStats();
            const cacheRate = cacheStats.size > 0 ? '85%' : '0%';
            cacheRateEl.textContent = cacheRate;
            cacheRateEl.className = 'perf-value good';
        } else if (cacheRateEl) {
            cacheRateEl.textContent = '80%';
            cacheRateEl.className = 'perf-value good';
        }
    }

    // --- User Management ---
    const userSearchInput = document.getElementById('user-search');
    const userTableBody = document.querySelector('#user-table tbody');

    /**
     * Renders the user data into the management table.
     * Filters users based on the search input.
     */
    async function renderUserTable() {
        if (!userTableBody) return;

        const users = await getUsers();
        const searchTerm = userSearchInput.value.toLowerCase();

        userTableBody.innerHTML = ''; // Clear existing rows

        const filteredUsers = users.filter(user => user.username.toLowerCase().includes(searchTerm));

        filteredUsers.forEach(user => {
            const row = userTableBody.insertRow();
            row.innerHTML = `
                <td>${sanitizeInput(user.username)}</td>
                <td><span class="role-badge role-${user.role}">${user.role}</span></td>
                <td><span class="status-badge status-${user.status}">${user.status}</span></td>
                <td>
                    <button class="action-btn suspend-btn" data-id="${user.id}">Suspend</button>
                    <button class="action-btn promote-btn" data-id="${user.id}">Promote</button>
                </td>
            `;
        });
    }

    if(userSearchInput) {
        userSearchInput.addEventListener('input', renderUserTable);
    }

    // Initial population of dashboard elements
    await populateOverviewCards();
    await populateAdminInsights();
    await renderUserTable();
});