document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const adminView = document.getElementById('admin-view');
    const trainForm = document.getElementById('train-form');
    const userView = document.getElementById('user-view');
    const suggestionsContainer = document.getElementById('suggestions-container');
    const suggestionsList = document.getElementById('suggestions-list');

    let context = null;
    // Initialize knowledge base with default values and ensure they're saved to localStorage
    let defaultKnowledgeBase = {
        "hello": "Hi there! How can I help you today?",
        "library hours": "The library is open from 9 AM to 9 PM, Monday to Friday. What else would you like to know about the library?",
        "cafeteria": "The main cafeteria is located on the ground floor of the Student Union building."
    };
    
    let kb = JSON.parse(localStorage.getItem('chatbot-kb')) || defaultKnowledgeBase;
    
    // Ensure default entries are in localStorage
    let kbUpdated = false;
    for (const key in defaultKnowledgeBase) {
        if (!kb.hasOwnProperty(key)) {
            kb[key] = defaultKnowledgeBase[key];
            kbUpdated = true;
        }
    }
    
    if (kbUpdated) {
        localStorage.setItem('chatbot-kb', JSON.stringify(kb));
    }
    
    let knowledgeBase = kb;

    const urlParams = new URLSearchParams(window.location.search);
    const kbTableBody = document.querySelector('#kb-table tbody');
    const aiModeToggle = document.getElementById('ai-mode-toggle');

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

    // Populate suggestions from knowledge base
    function populateSuggestions() {
        if (!suggestionsList) return;
        
        suggestionsList.innerHTML = '';
        
        // Get up to 5 questions from the knowledge base
        const questions = Object.keys(knowledgeBase);
        const sampleQuestions = questions.slice(0, 5);
        
        sampleQuestions.forEach(question => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.textContent = question;
            suggestionItem.addEventListener('click', () => {
                chatInput.value = question;
                sendMessage();
                // Hide suggestions after clicking
                if (suggestionsContainer) suggestionsContainer.style.display = 'none';
            });
            suggestionsList.appendChild(suggestionItem);
        });
    }

    // Show suggestions when input is focused
    if (chatInput) {
        chatInput.addEventListener('focus', () => {
            if (suggestionsContainer) {
                suggestionsContainer.style.display = 'block';
                populateSuggestions();
            }
        });
        
        // Hide suggestions when input loses focus (with a small delay to allow clicking suggestions)
        chatInput.addEventListener('blur', () => {
            if (suggestionsContainer) {
                // Use a timeout to allow clicking on suggestions
                setTimeout(() => {
                    suggestionsContainer.style.display = 'none';
                }, 200);
            }
        });
    }

    if (urlParams.get('view') === 'admin') {
        if(userView) userView.style.display = 'none';
        if(adminView) adminView.style.display = 'block';
        document.querySelector('.back-link').href = '../../admin.html';
        document.querySelector('h1').textContent = 'Manage Chatbot';
        renderKbTable();
        renderChatbotAnalytics();
        renderSatisfactionStats();
    }

    /**
     * Renders the knowledge base into the admin table.
     */
    function renderKbTable() {
        if (!kbTableBody) return;
        kbTableBody.innerHTML = '';
        for (const key in knowledgeBase) {
            const row = kbTableBody.insertRow();
            row.innerHTML = `
                <td>${sanitizeInput(key)}</td>
                <td>${sanitizeInput(knowledgeBase[key])}</td>
                <td>
                    <button class="action-btn edit-btn" data-key="${key}">Edit</button>
                    <button class="action-btn delete-btn" data-key="${key}">Delete</button>
                </td>
            `;
        }
    }

    if(sendBtn) sendBtn.addEventListener('click', sendMessage);
    if(chatInput) chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    if (kbTableBody) {
        kbTableBody.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('action-btn')) {
                const key = target.dataset.key;

                if (target.classList.contains('delete-btn')) {
                    if (confirm(`Are you sure you want to delete the Q&A for "${key}"?`)) {
                        delete knowledgeBase[key];
                        localStorage.setItem('chatbot-kb', JSON.stringify(knowledgeBase));
                        renderKbTable();
                        
                        // Refresh suggestions if they are currently visible
                        if (suggestionsContainer && suggestionsContainer.style.display !== 'none') {
                            populateSuggestions();
                        }
                    }
                } else if (target.classList.contains('edit-btn')) {
                    const questionInput = document.getElementById('new-question');
                    const answerInput = document.getElementById('new-answer');

                    questionInput.value = key;
                    answerInput.value = knowledgeBase[key];
                    questionInput.disabled = true; // Prevent key change during edit
                    trainForm.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    const docUploadInput = document.getElementById('doc-upload');

    if(trainForm) {
        trainForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const questionInput = document.getElementById('new-question');
            const answerInput = document.getElementById('new-answer');

            const newQuestion = questionInput.value.toLowerCase();
            const newAnswer = answerInput.value;

            knowledgeBase[newQuestion] = newAnswer;
            localStorage.setItem('chatbot-kb', JSON.stringify(knowledgeBase));

            alert('Knowledge base updated!');
            trainForm.reset();
            questionInput.disabled = false; // Re-enable after submission
            renderKbTable();
            
            // Refresh suggestions if they are currently visible
            if (suggestionsContainer && suggestionsContainer.style.display !== 'none') {
                populateSuggestions();
            }
        });
    }


    async function sendMessage() {
        const userInput = chatInput.value.trim();
        if (userInput === '') return;

        addMessage(userInput, 'user');
        chatInput.value = '';
        
        // Hide suggestions after sending a message
        if (suggestionsContainer) suggestionsContainer.style.display = 'none';
        
        // Show typing indicator with a unique identifier
        const thinkingMessage = addMessage("Thinking...", 'bot-status');

        const botResponse = await getBotResponse(userInput);

        // Remove "Thinking..." and add the final response
        if(thinkingMessage) thinkingMessage.remove();

        addMessage(botResponse, 'bot');
    }

    function addMessage(text, sender) {
        const messageId = Date.now();
        const messageContainer = document.createElement('div');
        messageContainer.className = `message-container`;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;

        if (sender === 'bot' || sender === 'bot-status') {
            messageElement.innerHTML = text; // Use innerHTML for the emoji

            // Only add feedback buttons for actual bot responses, not status messages
            if (sender === 'bot') {
                const feedbackContainer = document.createElement('div');
                feedbackContainer.className = 'feedback-container';
                feedbackContainer.innerHTML = `
                    <button class="feedback-btn" data-id="${messageId}" data-rating="good">👍</button>
                    <button class="feedback-btn" data-id="${messageId}" data-rating="bad">👎</button>
                `;
                messageElement.appendChild(feedbackContainer);
            }
        } else {
            messageElement.textContent = text;
        }

        messageContainer.appendChild(messageElement);
        chatMessages.appendChild(messageContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Return the message element so it can be removed later
        return messageContainer;
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

async function askChatbot(question) {
    const apiKey = localStorage.getItem('chatbot-api-key'); // Use chatbot specific key
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

    async function getBotResponse(input) {
        const lowerInput = input.toLowerCase();

        // 1. Check for contextual follow-up
        if (context === 'library' && (lowerInput.includes('weekend') || lowerInput.includes('saturday') || lowerInput.includes('sunday'))) {
            context = null; // Reset context
            return "The library is closed on weekends.";
        }

        // 2. Search local knowledge base (case-insensitive)
        for (const question in knowledgeBase) {
            const lowerQuestion = question.toLowerCase();
            if (lowerInput.includes(lowerQuestion) || lowerQuestion.includes(lowerInput)) {
                logInteraction(question); // Log the matched keyword
                // Set context based on the question
                if (question.includes('library')) {
                    context = 'library';
                } else {
                    context = null; // Reset context for other questions
                }
                return knowledgeBase[question];
            }
        }

        // 3. Fallback to AI
        if (aiModeToggle.checked) {
            logInteraction('AI Fallback'); // Log this interaction
            const aiResponse = await askChatbot(input);
            return `🌐 ${aiResponse}`;
        } else {
            return "AI Mode is disabled. I can only answer questions from my local knowledge base.";
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

        document.getElementById('save-suggestions-btn').addEventListener('click', () => {
            let addedCount = 0;
            suggestions.forEach((s, i) => {
                const question = document.getElementById(`suggestion-q-${i}`).value.trim().toLowerCase();
                if (question) {
                    knowledgeBase[question] = s.trim();
                    addedCount++;
                }
            });

            if (addedCount > 0) {
                localStorage.setItem('chatbot-kb', JSON.stringify(knowledgeBase));
                renderKbTable();
                alert(`${addedCount} new Q&A pairs added!`);
            }
            suggestionContainer.remove();
        });
    }

    /**
     * Logs a successful keyword match for analytics.
     * @param {string} keyword The keyword that was matched.
     */
    function logInteraction(keyword) {
        let interactions = JSON.parse(localStorage.getItem('chatbot-interactions')) || {};
        interactions[keyword] = (interactions[keyword] || 0) + 1;
        localStorage.setItem('chatbot-interactions', JSON.stringify(interactions));
    }

    /**
     * Renders the chatbot analytics chart.
     */
    function renderChatbotAnalytics() {
        const interactions = JSON.parse(localStorage.getItem('chatbot-interactions')) || {};

        const sortedInteractions = Object.entries(interactions).sort(([,a],[,b]) => b-a).slice(0, 5);

        const chartData = {
            labels: sortedInteractions.map(item => item[0]),
            values: sortedInteractions.map(item => item[1])
        };

        if (chartData.labels.length === 0) {
            chartData.labels = ['No Data'];
            chartData.values = [0];
        }

        drawBarChart('chatbot-analytics-chart', chartData, { barColor: '#f0932b' });
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
            <p>Total Ratings: <strong>${totalRatings}</strong></p>
            <p>👍 Good: <strong>${goodRatings}</strong></p>
            <p>👎 Bad: <strong>${badRatings}</strong></p>
            <p>Satisfaction Rate: <strong>${satisfactionRate}%</strong></p>
        `;
    }
});
