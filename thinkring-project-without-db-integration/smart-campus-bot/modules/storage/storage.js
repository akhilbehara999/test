document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const searchStorage = document.getElementById('search-storage');
    const adminView = document.getElementById('admin-view');
    const storageStats = document.getElementById('storage-stats');
    const userView = document.getElementById('user-view');

    // --- IndexedDB Setup ---
    let db;
    const dbName = 'fileStorageDB';
    const request = indexedDB.open(dbName, 1);

    /**
     * Handles database errors.
     */
    request.onerror = (event) => {
        console.error('Database error:', event.target.errorCode);
    };

    /**
     * Handles database upgrades. This is where the schema is defined.
     */
    request.onupgradeneeded = (event) => {
        db = event.target.result;
        // Create an object store for our files.
        // We use 'id' as the keyPath and autoIncrement it.
        db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
    };

    /**
     * Handles database connection success.
     */
    request.onsuccess = (event) => {
        db = event.target.result;
        if (urlParams.get('view') === 'admin') {
            renderAdminView();
        } else {
            displayFiles();
        }
    };

    /**
     * Fetches all data and renders the entire admin dashboard.
     */
    function renderAdminView() {
        const transaction = db.transaction(['files'], 'readonly');
        const objectStore = transaction.objectStore('files');
        const allFilesRequest = objectStore.getAll();

        allFilesRequest.onsuccess = () => {
            const allFiles = allFilesRequest.result;

            // --- Process Data ---
            let totalSize = 0;
            const userUsage = {};
            allFiles.forEach(file => {
                totalSize += file.size;
                const username = file.username || 'anonymous';
                if (!userUsage[username]) {
                    userUsage[username] = 0;
                }
                userUsage[username] += file.size;
            });

            // --- Render Stats ---
            document.getElementById('total-files').textContent = allFiles.length;
            document.getElementById('total-usage').textContent = `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;

            // --- Render File Table ---
            const allFilesTableBody = document.querySelector('#all-files-table tbody');
            if (allFilesTableBody) {
                allFilesTableBody.innerHTML = '';
                allFiles.forEach(file => {
                    const row = allFilesTableBody.insertRow();
                    row.innerHTML = `
                        <td>${sanitizeInput(file.name)}</td>
                        <td>${(file.size / 1024).toFixed(2)}</td>
                        <td>${sanitizeInput(file.username || 'anonymous')}</td>
                        <td><button class="action-btn delete-btn" data-id="${file.id}">Delete</button></td>
                    `;
                });
            }

            // --- Prepare and Render Chart ---
            const sortedUsers = Object.entries(userUsage).sort(([, a], [, b]) => b - a);
            const top5Users = sortedUsers.slice(0, 5);
            const chartLabels = top5Users.map(user => user[0]);
            const chartValues = top5Users.map(user => (user[1] / (1024 * 1024)).toFixed(2)); // Convert to MB

            const chartData = {
                labels: chartLabels,
                values: chartValues
            };
            drawBarChart('top-users-chart', chartData, { barColor: '#4cd137' });
        };

        allFilesRequest.onerror = (event) => {
            console.error('Error fetching all files:', event.target.errorCode);
        };
    }

    // --- Admin Actions ---
    const allFilesTableBody = document.querySelector('#all-files-table tbody');
    if (allFilesTableBody) {
        allFilesTableBody.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const fileId = parseInt(e.target.dataset.id, 10);
                if (confirm(`Are you sure you want to delete file ID ${fileId}? This cannot be undone.`)) {
                    const transaction = db.transaction(['files'], 'readwrite');
                    const objectStore = transaction.objectStore('files');
                    const request = objectStore.delete(fileId);
                    request.onsuccess = () => {
                        console.log(`File ${fileId} deleted.`);
                        renderAdminView(); // Refresh the entire admin view
                    };
                    request.onerror = (event) => {
                        console.error('Error deleting file:', event.target.errorCode);
                    };
                }
            }
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('view') === 'admin') {
        if(userView) userView.style.display = 'none';
        if(adminView) adminView.style.display = 'block';
        document.querySelector('.back-link').href = '../../admin.html';
        document.querySelector('h1').textContent = 'Storage Management';
        // The main logic will be triggered by the DB connection success
    }

    // --- Event Listeners ---
    if(dropZone) {
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            handleFiles(files);
        });
    }
    if(fileInput) fileInput.addEventListener('change', () => handleFiles(fileInput.files));
    if(searchStorage) searchStorage.addEventListener('input', displayFiles);


    // --- Core Functions ---

    /**
     * Handles the uploaded files by adding them to the IndexedDB.
     * @param {FileList} files The files to be added.
     */
    function handleFiles(files) {
        const transaction = db.transaction(['files'], 'readwrite');
        const objectStore = transaction.objectStore('files');
        const username = localStorage.getItem('username') || 'anonymous';

        for (const file of files) {
            const fileRecord = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: file,
                username: username
            };
            objectStore.add(fileRecord);
        }
        transaction.oncomplete = () => {
            displayFiles();
        };
    }

    function displayFiles() {
        if(!db || !fileList) return;
        const searchTerm = searchStorage ? searchStorage.value.toLowerCase() : '';
        fileList.innerHTML = '';
        const objectStore = db.transaction('files').objectStore('files');
        objectStore.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                if (cursor.value.name.toLowerCase().includes(searchTerm)) {
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-item';
                    fileItem.innerHTML = `
                        <span>${cursor.value.name} (${(cursor.value.size / 1024).toFixed(2)} KB)</span>
                        <div>
                            <button class="download-btn" data-id="${cursor.key}">Download</button>
                            <button class="delete-btn" data-id="${cursor.key}">Delete</button>
                        </div>
                    `;
                    fileList.appendChild(fileItem);
                }
                cursor.continue();
            } else {
                attachActionListeners();
            }
        };
    }

    function attachActionListeners() {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                deleteFile(id);
            });
        });
        document.querySelectorAll('.download-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                downloadFile(id);
            });
        });
    }

    function deleteFile(id) {
        const request = db.transaction(['files'], 'readwrite').objectStore('files').delete(id);
        request.onsuccess = () => displayFiles();
    }

    function downloadFile(id) {
        const request = db.transaction(['files']).objectStore('files').get(id);
        request.onsuccess = (event) => {
            const fileRecord = event.target.result;
            const link = document.createElement('a');
            link.href = URL.createObjectURL(fileRecord.data);
            link.download = fileRecord.name;
            link.click();
            URL.revokeObjectURL(link.href);
        };
    }

    function displayStorageStats() {
        if(!db) return;
        let totalSize = 0;
        let fileCount = 0;
        const objectStore = db.transaction('files').objectStore('files');
        objectStore.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                fileCount++;
                totalSize += cursor.value.size;
                cursor.continue();
            } else {
                if(storageStats){
                    storageStats.innerHTML = `
                        <p>Total Files: ${fileCount}</p>
                        <p>Total Storage Used: ${(totalSize / (1024 * 1024)).toFixed(2)} MB</p>
                    `;
                }
            }
        };
    }
});
