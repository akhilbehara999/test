document.addEventListener('DOMContentLoaded', async () => {
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const adminView = document.getElementById('admin-view');
    const trainForm = document.getElementById('train-form');
    const userView = document.getElementById('user-view');
    const suggestionPillsContainer = document.querySelector('.suggestion-pills');

    let context = null;
    // Initialize knowledge base with lowercase keys for consistency
    let knowledgeBase = {};
    const defaultKb = {
        "library hours": "The library is open from 9 AM to 9 PM, Monday to Friday. What else would you like to know about the library?",
        "cafeteria": "The main cafeteria is located on the ground floor of the Student Union building.",
        "campus hours": "The campus is open 24/7 for students and staff with valid ID. Different buildings may have varying hours.",
        "reset password": "To reset your password, visit the IT Help Desk website or go to the Student Services building, room 105.",
        "where is the library": "The main library is located in the Academic Building, 2nd floor. You can access it through the main entrance.",
        "upcoming events": "Check the campus events calendar on the university website or the student portal for upcoming events."
    };
    
    // Convert default knowledge base keys to lowercase and trim for consistency
    for (const [key, value] of Object.entries(defaultKb)) {
        knowledgeBase[key.toLowerCase().trim()] = value;
    }
    
    // Merge with localStorage data (trim keys for consistency)
    const localStorageKb = JSON.parse(localStorage.getItem('chatbot-kb')) || {};
    for (const [key, value] of Object.entries(localStorageKb)) {
        knowledgeBase[key.toLowerCase().trim()] = value;
    }

    // Track frequently asked questions
    let interactions = JSON.parse(localStorage.getItem('chatbot-interactions')) || {};

    const urlParams = new URLSearchParams(window.location.search);
    const kbTableBody = document.querySelector('#kb-table tbody');
    const aiModeToggle = document.getElementById('ai-mode-toggle');

    // Initialize Supabase client
    if (typeof window.initSupabaseClient !== 'undefined') {
        window.initSupabaseClient();
    }

    // Initialize AI mode from sessionStorage or default to on
    if (sessionStorage.getItem('ai-mode-enabled') === 'false') {
        aiModeToggle.checked = false;
    } else {
        aiModeToggle.checked = true;
    }

    if (aiModeToggle) {
        aiModeToggle.addEventListener('change', () => {
            sessionStorage.setItem('ai-mode-enabled', aiModeToggle.checked);
        });
    }

    // Load knowledge base from Supabase if available
    async function loadKnowledgeBase() {
        try {
            if (typeof window.chatbotSupabase !== 'undefined') {
                const result = await window.chatbotSupabase.getKnowledgeBase();
                if (result.success) {
                    // Merge Supabase knowledge base with local defaults (trim keys for consistency)
                    const supabaseKb = result.data;
                    for (const [key, value] of Object.entries(supabaseKb)) {
                        knowledgeBase[key.toLowerCase().trim()] = value;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading knowledge base from Supabase:', error);
        }
    }

    // Initialize knowledge base and wait for it to complete
    await loadKnowledgeBase();

    if (urlParams.get('view') === 'admin') {
        if(userView) userView.style.display = 'none';
        if(adminView) adminView.style.display = 'block';
        document.querySelector('.back-link').href = '../../admin.html';
        document.querySelector('h1').textContent = 'Manage Chatbot';
        loadAdminData();
    } else {
        // Load suggestions for user view
        loadSuggestions();
    }

    /**
     * Load suggestions for the user view based on knowledge base and frequently asked questions
     */
    async function loadSuggestions() {
        try {
            // Get questions from knowledge base
            const kbQuestions = Object.keys(knowledgeBase);
            
            // Get frequently asked questions from interactions (excluding AI Fallback)
            const sortedInteractions = Object.entries(interactions)
                .filter(([question]) => question !== 'AI Fallback') // Exclude AI Fallback
                .sort(([,a],[,b]) => b-a)
                .slice(0, 3)
                .map(([question]) => question);
            
            // Combine frequently asked with knowledge base questions
            let suggestionQuestions = [...sortedInteractions];
            
            // Add knowledge base questions if we don't have enough
            for (const question of kbQuestions) {
                if (suggestionQuestions.length >= 6) break;
                if (!suggestionQuestions.includes(question) && question !== 'AI Fallback') {
                    suggestionQuestions.push(question);
                }
            }
            
            // Limit to 6 suggestions
            suggestionQuestions = suggestionQuestions.slice(0, 6);
            
            // Update suggestion pills
            if (suggestionPillsContainer) {
                suggestionPillsContainer.innerHTML = '';
                suggestionQuestions.forEach(question => {
                    const pill = document.createElement('div');
                    pill.className = 'suggestion-pill';
                    pill.textContent = question;
                    suggestionPillsContainer.appendChild(pill);
                });
            }
        } catch (error) {
            console.error('Error loading suggestions:', error);
        }
    }

    /**
     * Load admin data for the admin view
     */
    async function loadAdminData() {
        // Load knowledge base entries
        await renderKbTable();
        
        // Load analytics
        renderChatbotAnalytics();
        
        // Load satisfaction stats
        renderSatisfactionStats();
    }

    /**
     * Renders the knowledge base into the admin table.
     */
    async function renderKbTable() {
        if (!kbTableBody) return;
        
        // Show loading state
        kbTableBody.innerHTML = '<tr><td colspan="4">Loading knowledge base...</td></tr>';
        
        try {
            // Try to get knowledge base from Supabase
            if (typeof window.chatbotSupabase !== 'undefined') {
                const result = await window.chatbotSupabase.getAllKnowledgeBaseEntries();
                if (result.success) {
                    renderKbTableData(result.data);
                    return;
                }
            }
            
            // Fallback to localStorage
            const kbEntries = Object.entries(knowledgeBase).map(([question, answer]) => ({
                question,
                answer,
                category: 'general'
            }));
            renderKbTableData(kbEntries);
        } catch (error) {
            console.error('Error loading knowledge base:', error);
            kbTableBody.innerHTML = '<tr><td colspan="4">Error loading knowledge base</td></tr>';
        }
    }

    /**
     * Render knowledge base table data
     * @param {Array} entries - Knowledge base entries
     */
    function renderKbTableData(entries) {
        if (!kbTableBody) return;
        
        if (entries.length === 0) {
            kbTableBody.innerHTML = '<tr><td colspan="4">No knowledge base entries found</td></tr>';
            return;
        }
        
        kbTableBody.innerHTML = '';
        entries.forEach(entry => {
            const row = kbTableBody.insertRow();
            row.innerHTML = `
                <td>${sanitizeInput(entry.question)}</td>
                <td>${sanitizeInput(entry.answer)}</td>
                <td>${sanitizeInput(entry.category || 'general')}</td>
                <td>
                    <button class="action-btn edit-btn" data-question="${entry.question}">Edit</button>
                    <button class="action-btn delete-btn" data-question="${entry.question}">Delete</button>
                </td>
            `;
        });
    }

    if(sendBtn) sendBtn.addEventListener('click', sendMessage);
    if(chatInput) chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea
    if(chatInput) {
        chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    if (kbTableBody) {
        kbTableBody.addEventListener('click', async (e) => {
            const target = e.target;
            if (target.classList.contains('action-btn')) {
                const question = target.dataset.question;

                if (target.classList.contains('delete-btn')) {
                    if (confirm(`Are you sure you want to delete the Q&A for "${question}"?`)) {
                        try {
                            // Try to delete from Supabase
                            if (typeof window.chatbotSupabase !== 'undefined') {
                                const result = await window.chatbotSupabase.deleteKnowledgeBaseEntry(question);
                                if (result.success) {
                                    // Update local knowledge base as well (using lowercase key for consistency)
                                    delete knowledgeBase[question.toLowerCase().trim()]; // Trim whitespace
                                    localStorage.setItem('chatbot-kb', JSON.stringify(knowledgeBase));
                                    
                                    alert('Knowledge base entry deleted successfully!');
                                    await renderKbTable();
                                    return;
                                }
                            }
                            
                            // Fallback to localStorage (using lowercase key for consistency)
                            delete knowledgeBase[question.toLowerCase().trim()]; // Trim whitespace
                            localStorage.setItem('chatbot-kb', JSON.stringify(knowledgeBase));
                            renderKbTable();
                            alert('Knowledge base entry deleted successfully!');
                        } catch (error) {
                            console.error('Error deleting knowledge base entry:', error);
                            alert('Error deleting knowledge base entry: ' + error.message);
                        }
                    }
                } else if (target.classList.contains('edit-btn')) {
                    const questionInput = document.getElementById('new-question');
                    const answerInput = document.getElementById('new-answer');

                    // Try to get the answer from Supabase
                    if (typeof window.chatbotSupabase !== 'undefined') {
                        const result = await window.chatbotSupabase.getAllKnowledgeBaseEntries();
                        if (result.success) {
                            const entry = result.data.find(e => e.question === question);
                            if (entry) {
                                questionInput.value = entry.question;
                                answerInput.value = entry.answer;
                                questionInput.disabled = true; // Prevent question change during edit
                                trainForm.scrollIntoView({ behavior: 'smooth' });
                                return;
                            }
                        }
                    }
                    
                    // Fallback to localStorage (using lowercase key for consistency)
                    questionInput.value = question;
                    answerInput.value = knowledgeBase[question.toLowerCase().trim()]; // Trim whitespace
                    questionInput.disabled = true; // Prevent question change during edit
                    trainForm.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    const docUploadInput = document.getElementById('doc-upload');

    if(trainForm) {
        trainForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const questionInput = document.getElementById('new-question');
            const answerInput = document.getElementById('new-answer');

            const newQuestion = questionInput.value.trim(); // Trim whitespace
            const newAnswer = answerInput.value;

            try {
                // Try to save to Supabase
                if (typeof window.chatbotSupabase !== 'undefined') {
                    const result = await window.chatbotSupabase.upsertKnowledgeBaseEntry(newQuestion, newAnswer);
                    if (result.success) {
                        // Update local knowledge base as well (using lowercase key for consistency)
                        knowledgeBase[newQuestion.toLowerCase().trim()] = newAnswer; // Trim whitespace
                        localStorage.setItem('chatbot-kb', JSON.stringify(knowledgeBase));
                        
                        alert(`Knowledge base entry ${result.operation} successfully!`);
                        trainForm.reset();
                        questionInput.disabled = false; // Re-enable after submission
                        await renderKbTable();
                        return;
                    }
                }
                
                // Fallback to localStorage (using lowercase key for consistency)
                knowledgeBase[newQuestion.toLowerCase().trim()] = newAnswer; // Trim whitespace
                localStorage.setItem('chatbot-kb', JSON.stringify(knowledgeBase));

                alert('Knowledge base updated!');
                trainForm.reset();
                questionInput.disabled = false; // Re-enable after submission
                renderKbTable();
            } catch (error) {
                console.error('Error saving knowledge base entry:', error);
                alert('Error saving knowledge base entry: ' + error.message);
            }
        });
    }

    // Handle suggestion pills click
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('suggestion-pill')) {
            chatInput.value = e.target.textContent;
            chatInput.focus();
            // Trigger input event to resize textarea
            chatInput.dispatchEvent(new Event('input'));
        }
    });

    async function sendMessage() {
        const userInput = chatInput.value.trim();
        if (userInput === '') return;

        addMessage(userInput, 'user');
        chatInput.value = '';
        // Reset textarea height
        chatInput.style.height = 'auto';
        
        // Don't add typing indicator here anymore, it's handled in getBotResponse for AI calls only

        const botResponse = await getBotResponse(userInput);

        // Add typing indicator only for AI responses
        if (botResponse.startsWith('🌐') && aiModeToggle.checked) {
            addTypingIndicator();
            // Small delay to show typing indicator
            await new Promise(resolve => setTimeout(resolve, 1000));
            removeTypingIndicator();
        }

        addMessage(botResponse, 'bot');
    }

    function addMessage(text, sender) {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        
        if (sender === 'user') {
            messageElement.innerHTML = `
                <div class="message-header">
                    <span>👤 You</span>
                </div>
                <div class="message-content">${text}</div>
                <div class="message-timestamp">${timestamp}</div>
            `;
        } else if (sender === 'bot') {
            // Check if response contains AI indicator
            const isAIResponse = text.startsWith('🌐');
            const content = isAIResponse ? text.substring(1) : text;
            
            messageElement.innerHTML = `
                <div class="message-header">
                    <span>🤖 AI Assistant</span>
                </div>
                <div class="message-content">${content}</div>
                <div class="message-timestamp">${timestamp}</div>
            `;
        }

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addTypingIndicator() {
        // Remove any existing typing indicators
        removeTypingIndicator();
        
        const typingElement = document.createElement('div');
        typingElement.className = 'typing-indicator';
        typingElement.innerHTML = `
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
            <span>AI is typing...</span>
        `;
        
        chatMessages.appendChild(typingElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    if (chatMessages) {
        chatMessages.addEventListener('click', (e) => {
            const button = e.target.closest('.feedback-btn');
            if (button) {
                const parentContainer = button.parentElement;
                if (parentContainer.classList.contains('rated')) {
                    return; // Already rated
                }

                const messageId = button.dataset.id;
                const rating = button.dataset.rating;

                const ratings = JSON.parse(localStorage.getItem('chatbot-ratings')) || [];
                ratings.push({ messageId, rating });
                localStorage.setItem('chatbot-ratings', JSON.stringify(ratings));

                parentContainer.classList.add('rated');
                button.style.borderColor = 'var(--success-color)';
            }
        });
    }

    async function getBotResponse(input) {
        const lowerInput = input.toLowerCase().trim(); // Trim whitespace

        // 1. Check for contextual follow-up
        if (context === 'library' && (lowerInput.includes('weekend') || lowerInput.includes('saturday') || lowerInput.includes('sunday'))) {
            context = null; // Reset context
            return "The library is closed on weekends.";
        }

        // 2. Search local knowledge base (convert keys to lowercase for consistent matching)
        const lowerKnowledgeBase = {};
        for (const [key, value] of Object.entries(knowledgeBase)) {
            lowerKnowledgeBase[key.toLowerCase().trim()] = value; // Trim whitespace from keys
        }
        
        for (const question in lowerKnowledgeBase) {
            if (lowerInput.includes(question)) {
                logInteraction(question); // Log the matched keyword
                // Set context based on the question
                if (question.includes('library')) {
                    context = 'library';
                } else {
                    context = null; // Reset context for other questions
                }
                return lowerKnowledgeBase[question];
            }
        }

        // 3. Search Supabase knowledge base (this is the main fix - always check Supabase)
        try {
            if (typeof window.chatbotSupabase !== 'undefined') {
                const result = await window.chatbotSupabase.getKnowledgeBase();
                if (result.success) {
                    const supabaseKb = result.data;
                    // Trim whitespace from Supabase keys as well
                    const trimmedSupabaseKb = {};
                    for (const [key, value] of Object.entries(supabaseKb)) {
                        trimmedSupabaseKb[key.toLowerCase().trim()] = value;
                    }
                    
                    for (const question in trimmedSupabaseKb) {
                        if (lowerInput.includes(question)) {
                            logInteraction(question); // Log the matched keyword
                            // Set context based on the question
                            if (question.includes('library')) {
                                context = 'library';
                            } else {
                                context = null; // Reset context for other questions
                            }
                            return trimmedSupabaseKb[question];
                        }
                    }
                    // Update local knowledge base with Supabase data for future use (with trimmed keys)
                    for (const [key, value] of Object.entries(supabaseKb)) {
                        knowledgeBase[key.toLowerCase().trim()] = value;
                    }
                }
            }
        } catch (error) {
            console.error('Error searching Supabase knowledge base:', error);
        }

        // 4. Fallback to AI (only if no local match found)
        // Only check AI mode if we haven't found a match in the knowledge base
        if (aiModeToggle.checked) {
            logInteraction('AI Fallback'); // Log this interaction
            
            // Add typing indicator specifically for AI calls
            addTypingIndicator();
            
            try {
                // Try to get response from Supabase AI
                if (typeof window.chatbotSupabase !== 'undefined') {
                    const result = await window.chatbotSupabase.askAI(input);
                    if (result.success) {
                        removeTypingIndicator(); // Remove typing indicator before returning
                        return `🌐 ${result.data}`;
                    } else {
                        // If Supabase AI fails, fallback to original method
                        const aiResponse = await askChatbot(input);
                        removeTypingIndicator(); // Remove typing indicator before returning
                        return `🌐 ${aiResponse}`;
                    }
                } else {
                    // Fallback to original method
                    const aiResponse = await askChatbot(input);
                    removeTypingIndicator(); // Remove typing indicator before returning
                    return `🌐 ${aiResponse}`;
                }
            } catch (error) {
                console.error('Error getting AI response:', error);
                removeTypingIndicator(); // Remove typing indicator before returning
                return "Sorry, I'm having trouble connecting to the AI service. Please try again later.";
            }
        } else {
            return "AI Mode is disabled. I can only answer questions from my local knowledge base.";
        }
    }

    async function askChatbot(question) {
        const apiKey = localStorage.getItem('book-tools-api-key'); // Reuse shared key
        if (!apiKey) {
            return "Error: AI service is not configured. Please contact an administrator.";
        }

        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${apiKey}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  "model": "deepseek/deepseek-r1-0528:free",
                  "messages": [
                    { "role": "system", "content": "You are a helpful AI assistant for a university campus." },
                    { "role": "user", "content": question }
                  ]
                })
            });
            if (!response.ok) {
                return "Sorry, the AI service is currently unavailable.";
            }
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            return "Error connecting to AI service. Please check your network.";
        }
    }

    // --- Document Upload ---
    if (docUploadInput) {
        docUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file || file.type !== 'text/plain') {
                alert('Please select a valid .txt file.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target.result;
                const sentences = text.match( /[^.!?]+[.!?]+/g ) || [];
                handleSuggestions(sentences);
            };
            reader.readAsText(file);
        });
    }

    function handleSuggestions(suggestions) {
        const existingContainer = document.getElementById('suggestion-container');
        if (existingContainer) existingContainer.remove();

        let suggestionHTML = '<h3>Suggested Q&A Pairs</h3><p>Enter a question/keyword for each suggested answer and click save.</p>';
        suggestions.forEach((s, i) => {
            const cleanSentence = s.trim();
            if (cleanSentence) {
                suggestionHTML += `
                    <div class="suggestion-pair">
                        <input type="text" id="suggestion-q-${i}" placeholder="Enter question/keyword">
                        <p>${sanitizeInput(cleanSentence)}</p>
                    </div>
                `;
            }
        });
        suggestionHTML += '<button id="save-suggestions-btn">Save Approved Suggestions</button>';

        const suggestionContainer = document.createElement('div');
        suggestionContainer.id = 'suggestion-container';
        suggestionContainer.innerHTML = suggestionHTML;
        docUploadInput.parentElement.appendChild(suggestionContainer);

        document.getElementById('save-suggestions-btn').addEventListener('click', async () => {
            let addedCount = 0;
            const promises = [];
            const newEntries = []; // Track new entries for local knowledge base update
            
            suggestions.forEach((s, i) => {
                const question = document.getElementById(`suggestion-q-${i}`).value.trim(); // Trim whitespace
                if (question) {
                    // Try to save to Supabase
                    if (typeof window.chatbotSupabase !== 'undefined') {
                        promises.push(window.chatbotSupabase.upsertKnowledgeBaseEntry(question, s.trim()));
                        newEntries.push({question, answer: s.trim()}); // Track for local update
                    } else {
                        // Fallback to localStorage (using lowercase key for consistency)
                        knowledgeBase[question.toLowerCase().trim()] = s.trim(); // Trim whitespace
                    }
                    addedCount++;
                }
            });

            try {
                if (promises.length > 0) {
                    await Promise.all(promises);
                }
                
                if (addedCount > 0) {
                    // Update local knowledge base with new entries (using lowercase key for consistency)
                    newEntries.forEach(entry => {
                        knowledgeBase[entry.question.toLowerCase().trim()] = entry.answer; // Trim whitespace
                    });
                    
                    if (typeof window.chatbotSupabase === 'undefined') {
                        localStorage.setItem('chatbot-kb', JSON.stringify(knowledgeBase));
                    }
                    await renderKbTable();
                    alert(`${addedCount} new Q&A pairs added!`);
                }
            } catch (error) {
                console.error('Error saving suggestions:', error);
                alert('Error saving suggestions: ' + error.message);
            }
            
            suggestionContainer.remove();
        });
    }

    /**
     * Logs a successful keyword match for analytics.
     * @param {string} keyword The keyword that was matched.
     */
    function logInteraction(keyword) {
        // Don't log AI Fallback as a user interaction
        if (keyword === 'AI Fallback') return;
        
        interactions[keyword] = (interactions[keyword] || 0) + 1;
        localStorage.setItem('chatbot-interactions', JSON.stringify(interactions));
        
        // Update suggestions when a new interaction is logged
        loadSuggestions();
    }

    /**
     * Renders the chatbot analytics chart.
     */
    function renderChatbotAnalytics() {
        const sortedInteractions = Object.entries(interactions).sort(([,a],[,b]) => b-a).slice(0, 5);

        const chartData = {
            labels: sortedInteractions.map(item => item[0]),
            values: sortedInteractions.map(item => item[1])
        };

        if (chartData.labels.length === 0) {
            chartData.labels = ['No Data'];
            chartData.values = [0];
        }

        drawBarChart('chatbot-analytics-chart', chartData, { barColor: '#9D4EDD' });
    }

    /**
     * Renders the user satisfaction stats in the admin panel.
     */
    function renderSatisfactionStats() {
        const ratings = JSON.parse(localStorage.getItem('chatbot-ratings')) || [];
        const statsContainer = document.getElementById('satisfaction-stats');
        if (!statsContainer) return;

        const goodRatings = ratings.filter(r => r.rating === 'good').length;
        const badRatings = ratings.filter(r => r.rating === 'bad').length;
        const totalRatings = ratings.length;
        const satisfactionRate = totalRatings > 0 ? ((goodRatings / totalRatings) * 100).toFixed(1) : 'N/A';

        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${satisfactionRate}%</div>
                <div class="stat-label">Satisfaction Rate</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${totalRatings}</div>
                <div class="stat-label">Total Ratings</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${goodRatings}</div>
                <div class="stat-label">Positive Feedback</div>
            </div>
        `;
    }
    
    // Utility function for sanitizing input (if not defined elsewhere)
    function sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }
    
    // Utility function for drawing bar chart (if not defined elsewhere)
    function drawBarChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !canvas.getContext) return;
        
        const ctx = canvas.getContext('2d');
        const { labels, values } = data;
        const barColor = options.barColor || '#00d4ff';
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Chart dimensions
        const chartWidth = canvas.width - 60;
        const chartHeight = canvas.height - 40;
        const barWidth = chartWidth / labels.length * 0.6;
        const barSpacing = chartWidth / labels.length * 0.4;
        
        // Find max value for scaling
        const maxValue = Math.max(...values, 1);
        
        // Draw bars
        labels.forEach((label, i) => {
            const x = 40 + i * (barWidth + barSpacing);
            const barHeight = (values[i] / maxValue) * chartHeight;
            const y = canvas.height - 20 - barHeight;
            
            // Draw bar
            ctx.fillStyle = barColor;
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Draw label
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(label, x + barWidth/2, canvas.height - 5);
            
            // Draw value
            ctx.fillText(values[i], x + barWidth/2, y - 5);
        });
    }
});