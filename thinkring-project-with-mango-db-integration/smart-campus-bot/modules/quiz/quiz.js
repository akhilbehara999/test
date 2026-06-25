document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const startScreen = document.getElementById('start-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultsScreen = document.getElementById('results-screen');
    const progressScreen = document.getElementById('progress-screen');
    const adminView = document.getElementById('admin-view');

    // Student Progress Elements
    const viewProgressStartBtn = document.getElementById('view-progress-start-btn');
    const viewProgressBtn = document.getElementById('view-progress-btn');
    const backToQuizBtn = document.getElementById('back-to-quiz-btn');

    // Quiz Configuration Elements
    const categorySelect = document.getElementById('category-select');
    const difficultySelect = document.getElementById('difficulty-select');
    const timedModeCheckbox = document.getElementById('timed-mode');
    const startBtn = document.getElementById('start-btn');
    const aiQuizBtn = document.getElementById('ai-quiz-btn');
    const topicInput = document.getElementById('quiz-topic');
    const aiQuestionCount = document.getElementById('ai-question-count');
    const aiDifficulty = document.getElementById('ai-difficulty');

    // Quiz Interface Elements
    const questionContainer = document.getElementById('question-container');
    const optionsContainer = document.getElementById('options-container');
    const currentQuestionSpan = document.getElementById('current-question');
    const totalQuestionsSpan = document.getElementById('total-questions');
    const progressFill = document.getElementById('progress-fill');
    const quizModeIndicator = document.getElementById('quiz-mode-indicator');
    
    // Timer Elements
    const quizTimer = document.getElementById('quiz-timer');
    const timerMinutes = document.getElementById('timer-minutes');
    const timerSeconds = document.getElementById('timer-seconds');
    const timerWarning = document.getElementById('timer-warning');
    
    // Control Elements
    const hintBtn = document.getElementById('hint-btn');
    const nextBtn = document.getElementById('next-btn');
    const finishBtn = document.getElementById('finish-btn');

    // Results Elements
    const resultsIcon = document.getElementById('results-icon');
    const resultsTitle = document.getElementById('results-title');
    const resultsQuizType = document.getElementById('results-quiz-type');
    const scoreSpan = document.getElementById('score');
    const scorePercentage = document.getElementById('score-percentage');
    const correctCount = document.getElementById('correct-count');
    const incorrectCount = document.getElementById('incorrect-count');
    const timeTaken = document.getElementById('time-taken');
    const timeBreakdown = document.getElementById('time-breakdown');
    const performanceContent = document.getElementById('performance-content');
    const questionReviewContainer = document.getElementById('question-review-container');
    const achievementsSpan = document.getElementById('achievements');
    const playAgainBtn = document.getElementById('play-again-btn');

    // Admin Elements
    const addQuestionForm = document.getElementById('add-question-form');
    const questionIdInput = document.getElementById('question-id');
    const formSubmitBtn = document.getElementById('form-submit-btn');
    const formCancelBtn = document.getElementById('form-cancel-btn');

    // AI Configuration elements
    const aiStatusIndicator = document.getElementById('ai-status');

    // Quiz State Variables
    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let isAiMode = false;
    let isTimedMode = false;
    let currentQuestionStartTime = 0;
    let totalQuizStartTime = 0;
    let timerInterval = null;
    let timePerQuestion = 120; // 2 minutes in seconds
    let timeRemaining = 0;
    let questionAnswers = []; // Store detailed answer tracking
    let currentQuizId = null;

    // Data Storage
    let localQuestions = JSON.parse(localStorage.getItem('quiz-questions')) || [];
    
    // Achievement System
    const achievements = {
        'perfect_score': { name: 'Perfect Score!', icon: '🏆', description: 'Got 100% on a quiz' },
        'ai_explorer': { name: 'AI Explorer', icon: '🤖', description: 'Completed first AI quiz' },
        'speed_demon': { name: 'Speed Demon', icon: '⚡', description: 'Completed quiz under time limit' },
        'persistent': { name: 'Persistent Learner', icon: '💪', description: 'Completed 5 quizzes' },
        'scholar': { name: 'Scholar', icon: '🎓', description: 'Maintained 80%+ average' },
        'quiz_master': { name: 'Quiz Master', icon: '👑', description: 'Completed 20 quizzes' }
    };

    // URL Parameters and Admin View Detection
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminView = urlParams.get('view') === 'admin';
    const questionsTableBody = document.querySelector('#questions-table tbody');

    /**
     * Check if user has admin authentication
     * @returns {boolean} True if user is authenticated admin
     */
    function isAuthenticatedAdmin() {
        const sessionToken = localStorage.getItem('authToken');
        const userRole = localStorage.getItem('userRole');
        return sessionToken && userRole === 'admin';
    }

    /**
     * Redirect to admin panel with authentication check
     */
    function redirectToAdminPanel() {
        if (isAuthenticatedAdmin()) {
            window.location.href = 'quiz.html?view=admin';
        } else {
            // Redirect to login page with return URL
            window.location.href = '../../index.html?returnUrl=' + encodeURIComponent('modules/quiz/quiz.html?view=admin');
        }
    }

    /**
     * OpenRouter AI Integration for Question Generation
     */
    class AIQuestionGenerator {
        constructor() {
            // We'll initialize these values when needed
            this.apiKey = '';
            this.model = '';
            this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
        }

        /**
         * Initialize AI configuration
         */
        async initConfig() {
            try {
                // Use the global AI configuration function
                const config = await getGlobalAIConfig();
                console.log('Quiz: Retrieved AI config');
                this.apiKey = config.quiz.apiKey || '';
                this.model = config.quiz.model || 'openai/gpt-3.5-turbo';
                // Don't log the actual API key to prevent exposure
                console.log('Quiz: Using API Key: ' + (this.apiKey ? 'YES' : 'NO'));
                console.log('Quiz: Using Model:', this.model);
                return !!this.apiKey;
            } catch (error) {
                console.error('Error initializing AI config:', error);
                // Fallback to localStorage
                this.apiKey = localStorage.getItem('openrouter-api-key') || '';
                this.model = localStorage.getItem('ai-model') || 'openai/gpt-3.5-turbo';
                return !!this.apiKey;
            }
        }

        /**
         * Test AI connection and update status
         */
        async testConnection() {
            const hasConfig = await this.initConfig();
            if (!hasConfig) {
                this.updateStatus('error', 'API key not configured');
                return false;
            }

            try {
                this.updateStatus('testing', 'Testing connection...');
                const response = await this.generateQuestions('Test topic', 1);
                
                if (response && response.length > 0) {
                    this.updateStatus('success', 'Connection successful!');
                    return true;
                } else {
                    this.updateStatus('error', 'No response from AI');
                    return false;
                }
            } catch (error) {
                console.error('AI Test Error:', error);
                this.updateStatus('error', `Connection failed: ${error.message}`);
                return false;
            }
        }

        /**
         * Generate quiz questions using OpenRouter AI
         * @param {string} topic - The topic for questions
         * @param {number} count - Number of questions to generate
         * @param {string} difficulty - Difficulty level
         */
        async generateQuestions(topic, count = 5, difficulty = 'medium') {
            const hasConfig = await this.initConfig();
            if (!hasConfig) {
                throw new Error('OpenRouter API key not configured');
            }

            const prompt = `Generate ${count} multiple-choice quiz questions about "${topic}" with ${difficulty} difficulty level.

Format each question as JSON with this exact structure:
{
  "question": "Question text here?",
  "correct_answer": "Correct answer",
  "incorrect_answers": ["Wrong answer 1", "Wrong answer 2", "Wrong answer 3"]
}

Return ONLY a JSON array of questions, no other text. Make questions educational and accurate.`;

            try {
                // Don't log the actual API key to prevent exposure
                console.log('Quiz: Making API call with model:', this.model);
                
                const response = await fetch(this.baseUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': window.location.origin,
                        'X-Title': 'Smart Campus Quiz Bot'
                    },
                    body: JSON.stringify({
                        model: this.model,
                        messages: [{
                            role: 'user',
                            content: prompt
                        }],
                        temperature: 0.7,
                        max_tokens: 2000
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Quiz: API Error Response:', errorData);
                    throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
                }

                const data = await response.json();
                console.log('Quiz: API Response received');
                const content = data.choices[0].message.content;
                
                // Extract JSON from response
                const jsonStart = content.indexOf('[');
                const jsonEnd = content.lastIndexOf(']') + 1;
                const jsonString = content.substring(jsonStart, jsonEnd);
                
                return JSON.parse(jsonString);
            } catch (error) {
                console.error('AI Generation Error:', error);
                throw error;
            }
        }

        /**
         * Update AI status indicator
         */
        updateStatus(type, message) {
            if (!aiStatusIndicator) return;
            
            aiStatusIndicator.className = `ai-status ${type}`;
            aiStatusIndicator.textContent = message;
            
            const icons = {
                'success': '✅',
                'error': '❌', 
                'testing': '🔄',
                'idle': '⚪'
            };
            
            aiStatusIndicator.innerHTML = `${icons[type] || ''} ${message}`;
        }

        /**
         * Save configuration
         */
        saveConfig(apiKey, model) {
            this.apiKey = apiKey;
            this.model = model;
            localStorage.setItem('openrouter-api-key', apiKey);
            localStorage.setItem('ai-model', model);
        }
    }

    const aiGenerator = new AIQuestionGenerator();

    // Show model restriction notice for non-admin users
    if (!isAdminView && !isAuthenticatedAdmin()) {
        showModelRestrictionNotice();
    }

    /**
     * Show model restriction notice for non-admin users
     */
    function showModelRestrictionNotice() {
        const aiStatus = document.getElementById('ai-status');
        if (aiStatus && !isAuthenticatedAdmin()) {
            // Add restriction notice
            const notice = document.createElement('div');
            notice.className = 'model-restriction-notice';
            notice.innerHTML = `
                <span class="notice-icon">⚠️</span>
                <span>Students are limited to free AI models only. Premium models available for admin use.</span>
            `;
            
            const aiSection = document.querySelector('.ai-section');
            if (aiSection) {
                aiSection.appendChild(notice);
            }
            
            // Update AI status to show restriction
            aiStatus.classList.add('restricted');
            aiStatus.innerHTML = '⚠️ Free Models Only';
        }
    }

    /**
     * Timer Management System
     */
    class QuizTimer {
        constructor() {
            this.timeRemaining = 0;
            this.interval = null;
            this.isRunning = false;
        }

        start(timeInSeconds) {
            this.timeRemaining = timeInSeconds;
            this.isRunning = true;
            this.updateDisplay();
            
            this.interval = setInterval(() => {
                this.timeRemaining--;
                this.updateDisplay();
                
                // Warning at 30 seconds
                if (this.timeRemaining === 30) {
                    this.showWarning();
                }
                
                // Time up
                if (this.timeRemaining <= 0) {
                    this.stop();
                    this.onTimeUp();
                }
            }, 1000);
        }

        stop() {
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
            this.isRunning = false;
            this.hideWarning();
        }

        pause() {
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
            this.isRunning = false;
        }

        resume() {
            if (this.timeRemaining > 0 && !this.isRunning) {
                this.start(this.timeRemaining);
            }
        }

        updateDisplay() {
            if (!timerMinutes || !timerSeconds) return;
            
            const minutes = Math.floor(this.timeRemaining / 60);
            const seconds = this.timeRemaining % 60;
            
            timerMinutes.textContent = minutes.toString().padStart(2, '0');
            timerSeconds.textContent = seconds.toString().padStart(2, '0');
            
            // Change color based on time remaining
            if (this.timeRemaining <= 30) {
                quizTimer.classList.add('warning');
            } else if (this.timeRemaining <= 60) {
                quizTimer.classList.add('caution');
            } else {
                quizTimer.classList.remove('warning', 'caution');
            }
        }

        showWarning() {
            if (timerWarning) {
                timerWarning.style.display = 'block';
                timerWarning.classList.add('pulse');
            }
        }

        hideWarning() {
            if (timerWarning) {
                timerWarning.style.display = 'none';
                timerWarning.classList.remove('pulse');
            }
        }

        onTimeUp() {
            // Auto-select random answer if no answer selected
            if (!nextBtn.style.display || nextBtn.style.display === 'none') {
                const optionBtns = optionsContainer.querySelectorAll('.option-btn:not(:disabled)');
                if (optionBtns.length > 0) {
                    const randomBtn = optionBtns[Math.floor(Math.random() * optionBtns.length)];
                    randomBtn.click();
                }
            }
            
            // Auto-advance after 2 seconds
            setTimeout(() => {
                if (currentQuestionIndex < questions.length - 1) {
                    nextQuestion();
                } else {
                    finishQuiz();
                }
            }, 2000);
        }

        getElapsedTime() {
            return timePerQuestion - this.timeRemaining;
        }
    }

    const quizTimerNew = new QuizTimer();

    /**
     * Progress Tracking System
     */
    function updateQuizProgress() {
        if (currentQuestionSpan) {
            currentQuestionSpan.textContent = (currentQuestionIndex + 1).toString();
        }
        if (totalQuestionsSpan) {
            totalQuestionsSpan.textContent = questions.length.toString();
        }
        if (progressFill) {
            const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;
            progressFill.style.width = progressPercent + '%';
        }
    }

    /**
     * Student Progress Analytics
     */
    function getStudentProgress() {
        const results = JSON.parse(localStorage.getItem('quiz-results')) || [];
        const userResults = results.filter(r => r.username === (localStorage.getItem('username') || 'Anonymous'));
        
        const totalQuizzes = userResults.length;
        const aiQuizzes = userResults.filter(r => r.isAiGenerated).length;
        
        let totalScore = 0;
        let bestScore = 0;
        
        userResults.forEach(result => {
            const [correct, total] = result.score.split(' / ').map(Number);
            const percentage = (correct / total) * 100;
            totalScore += percentage;
            bestScore = Math.max(bestScore, percentage);
        });
        
        const avgScore = totalQuizzes > 0 ? totalScore / totalQuizzes : 0;
        
        return {
            totalQuizzes,
            aiQuizzes,
            avgScore,
            bestScore,
            recentResults: userResults.slice(-10)
        };
    }

    /**
     * Achievement System
     */
    function checkAchievements(quizData) {
        const earnedAchievements = [];
        const savedAchievements = JSON.parse(localStorage.getItem('earned-achievements')) || [];
        const progress = getStudentProgress();
        
        // Perfect Score Achievement
        if (quizData.percentage === 100 && !savedAchievements.includes('perfect_score')) {
            earnedAchievements.push('perfect_score');
        }
        
        // AI Explorer Achievement
        if (quizData.isAiGenerated && !savedAchievements.includes('ai_explorer')) {
            earnedAchievements.push('ai_explorer');
        }
        
        // Speed Demon Achievement (finished with time remaining)
        if (quizData.isTimedMode && quizData.timeRemaining > 0 && !savedAchievements.includes('speed_demon')) {
            earnedAchievements.push('speed_demon');
        }
        
        // Persistent Learner Achievement
        if (progress.totalQuizzes >= 5 && !savedAchievements.includes('persistent')) {
            earnedAchievements.push('persistent');
        }
        
        // Scholar Achievement
        if (progress.avgScore >= 80 && progress.totalQuizzes >= 3 && !savedAchievements.includes('scholar')) {
            earnedAchievements.push('scholar');
        }
        
        // Quiz Master Achievement
        if (progress.totalQuizzes >= 20 && !savedAchievements.includes('quiz_master')) {
            earnedAchievements.push('quiz_master');
        }
        
        // Save new achievements
        if (earnedAchievements.length > 0) {
            const updatedAchievements = [...savedAchievements, ...earnedAchievements];
            localStorage.setItem('earned-achievements', JSON.stringify(updatedAchievements));
        }
        
        return earnedAchievements;
    }

    /**
     * Enhanced Question Analytics
     */
    function trackQuestionPerformance(questionId, isCorrect, timeTaken) {
        const questionStats = JSON.parse(localStorage.getItem('question-stats')) || {};
        
        if (!questionStats[questionId]) {
            questionStats[questionId] = {
                attempts: 0,
                correct: 0,
                totalTime: 0
            };
        }
        
        questionStats[questionId].attempts++;
        if (isCorrect) questionStats[questionId].correct++;
        questionStats[questionId].totalTime += timeTaken;
        
        localStorage.setItem('question-stats', JSON.stringify(questionStats));
    }

    // Admin View Logic
    if (isAdminView) {
        console.log('Quiz: Admin view detected, initializing admin interface');
        
        // Hide quiz container and show admin view
        document.getElementById('quiz-container').style.display = 'none';
        if (adminView) {
            adminView.style.display = 'block';
            console.log('Quiz: Admin view displayed');
        }
        
        // Fix admin back button redirection
        const headerBackLink = document.getElementById('header-back-link');
        if (headerBackLink) {
            headerBackLink.href = '../../admin.html';
            headerBackLink.textContent = 'Back to Admin Panel';
        }
        
        // Ensure URL parameters persist
        const currentUrl = new URL(window.location);
        if (!currentUrl.searchParams.has('view')) {
            currentUrl.searchParams.set('view', 'admin');
            window.history.replaceState(null, '', currentUrl.toString());
        }
        
        document.querySelector('h1').textContent = 'Manage Quiz';
        renderQuestionTable();
        renderQuizAnalytics();
        
        console.log('Quiz: Admin view initialization complete');
    }

    /**
     * Enhanced Admin Analytics with Comprehensive Dashboard
     */
    function renderQuizAnalytics() {
        const results = JSON.parse(localStorage.getItem('quiz-results')) || [];
        const questionStats = JSON.parse(localStorage.getItem('question-stats')) || {};
        const questionUsage = JSON.parse(localStorage.getItem('question-usage')) || {};
        
        // Overview Statistics
        updateOverviewStats(results);
        
        // Performance Distribution Chart
        renderPerformanceChart(results);
        
        // AI vs Offline Usage Chart
        renderUsageChart(results);
        
        // Difficult Questions Analysis
        renderDifficultQuestions(questionStats, questionUsage);
        
        // Student Performance Insights
        renderStudentInsights(results);
        
        // Recent Activity
        renderRecentActivity(results);
    }
    
    function updateOverviewStats(results) {
        // Calculate metrics
        let totalPercentage = 0;
        let aiQuizCount = 0;
        const uniqueStudents = new Set();
        
        results.forEach(result => {
            totalPercentage += result.percentage || 0;
            if (result.isAiGenerated) aiQuizCount++;
            uniqueStudents.add(result.username);
        });
        
        const averageScore = results.length > 0 ? totalPercentage / results.length : 0;
        const aiQuestionsGenerated = localStorage.getItem('ai-questions-count') || '0';
        
        // Update stat cards
        const avgScoreEl = document.getElementById('avg-score');
        const totalQuizzesEl = document.getElementById('total-quizzes');
        const aiQuestionsEl = document.getElementById('ai-questions-generated');
        const activeStudentsEl = document.getElementById('active-students');
        
        if (avgScoreEl) avgScoreEl.textContent = `${averageScore.toFixed(1)}%`;
        if (totalQuizzesEl) totalQuizzesEl.textContent = results.length.toString();
        if (aiQuestionsEl) aiQuestionsEl.textContent = aiQuestionsGenerated;
        if (activeStudentsEl) activeStudentsEl.textContent = uniqueStudents.size.toString();
        
        // Calculate trends (simple comparison with previous period)
        updateTrends(results);
    }
    
    function updateTrends(results) {
        const now = new Date();
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const recentResults = results.filter(r => new Date(r.date) > lastWeek);
        const olderResults = results.filter(r => new Date(r.date) <= lastWeek);
        
        const recentAvg = recentResults.length > 0 ? 
            recentResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / recentResults.length : 0;
        const olderAvg = olderResults.length > 0 ? 
            olderResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / olderResults.length : 0;
        
        const scoreTrend = document.getElementById('score-trend');
        const quizTrend = document.getElementById('quiz-trend');
        
        if (scoreTrend) {
            const improvement = recentAvg - olderAvg;
            scoreTrend.textContent = improvement > 0 ? `+${improvement.toFixed(1)}%` : `${improvement.toFixed(1)}%`;
            scoreTrend.className = `stat-trend ${improvement >= 0 ? 'positive' : 'negative'}`;
        }
        
        if (quizTrend) {
            const quizIncrease = recentResults.length - olderResults.length;
            quizTrend.textContent = quizIncrease > 0 ? `+${quizIncrease}` : `${quizIncrease}`;
            quizTrend.className = `stat-trend ${quizIncrease >= 0 ? 'positive' : 'negative'}`;
        }
    }
    
    function renderPerformanceChart(results) {
        const scoreDistribution = { '0-25%': 0, '26-50%': 0, '51-75%': 0, '76-100%': 0 };
        
        results.forEach(result => {
            const percentage = result.percentage || 0;
            if (percentage <= 25) scoreDistribution['0-25%']++;
            else if (percentage <= 50) scoreDistribution['26-50%']++;
            else if (percentage <= 75) scoreDistribution['51-75%']++;
            else scoreDistribution['76-100%']++;
        });
        
        const chartData = {
            labels: Object.keys(scoreDistribution),
            values: Object.values(scoreDistribution)
        };
        
        drawBarChart('quiz-analytics-chart', chartData, { barColor: '#8A2BE2' });
    }
    
    function renderUsageChart(results) {
        const aiQuizzes = results.filter(r => r.isAiGenerated).length;
        const offlineQuizzes = results.length - aiQuizzes;
        
        const chartData = {
            labels: ['AI Quizzes', 'Offline Quizzes'],
            values: [aiQuizzes, offlineQuizzes]
        };
        
        drawBarChart('quiz-mode-chart', chartData);
    }
    
    function renderDifficultQuestions(questionStats, questionUsage) {
        const difficultQuestionsList = document.getElementById('difficult-questions-list');
        if (!difficultQuestionsList) return;
        
        const questionDifficulty = [];
        
        Object.entries(questionUsage).forEach(([questionId, usage]) => {
            if (usage.used > 0) {
                const successRate = (usage.correct / usage.used) * 100;
                if (successRate < 60) {  // Questions with less than 60% success rate
                    questionDifficulty.push({
                        id: questionId,
                        successRate,
                        attempts: usage.used
                    });
                }
            }
        });
        
        questionDifficulty.sort((a, b) => a.successRate - b.successRate);
        const topDifficult = questionDifficulty.slice(0, 5);
        
        if (topDifficult.length === 0) {
            difficultQuestionsList.innerHTML = '<div class="no-data">No difficulty patterns identified yet.</div>';
            return;
        }
        
        const listHTML = topDifficult.map(q => `
            <div class="analysis-item">
                <div class="question-id">Question ID: ${q.id}</div>
                <div class="success-rate">${q.successRate.toFixed(1)}% success rate</div>
                <div class="attempt-count">${q.attempts} attempts</div>
            </div>
        `).join('');
        
        difficultQuestionsList.innerHTML = listHTML;
    }
    
    function renderStudentInsights(results) {
        const topPerformersList = document.getElementById('top-performers-list');
        const strugglingStudentsList = document.getElementById('struggling-students-list');
        const popularTopicsList = document.getElementById('popular-topics-list');
        
        // Top Performers
        if (topPerformersList) {
            const studentStats = {};
            results.forEach(result => {
                if (!studentStats[result.username]) {
                    studentStats[result.username] = { total: 0, sum: 0, quizzes: 0 };
                }
                studentStats[result.username].sum += result.percentage || 0;
                studentStats[result.username].quizzes++;
            });
            
            const topPerformers = Object.entries(studentStats)
                .map(([username, stats]) => ({
                    username,
                    average: stats.sum / stats.quizzes,
                    quizzes: stats.quizzes
                }))
                .filter(student => student.quizzes >= 3)  // At least 3 quizzes
                .sort((a, b) => b.average - a.average)
                .slice(0, 5);
            
            if (topPerformers.length > 0) {
                topPerformersList.innerHTML = topPerformers.map(student => `
                    <div class="performer-item">
                        <span class="student-name">${student.username}</span>
                        <span class="student-average">${student.average.toFixed(1)}%</span>
                    </div>
                `).join('');
            } else {
                topPerformersList.innerHTML = '<div class="no-data">Not enough data yet.</div>';
            }
        }
        
        // Popular AI Topics
        if (popularTopicsList) {
            const topicCount = {};
            results.filter(r => r.isAiGenerated && r.topic).forEach(result => {
                topicCount[result.topic] = (topicCount[result.topic] || 0) + 1;
            });
            
            const popularTopics = Object.entries(topicCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            
            if (popularTopics.length > 0) {
                popularTopicsList.innerHTML = popularTopics.map(([topic, count]) => `
                    <div class="topic-item">
                        <span class="topic-name">${topic}</span>
                        <span class="topic-count">${count} quizzes</span>
                    </div>
                `).join('');
            } else {
                popularTopicsList.innerHTML = '<div class="no-data">No AI quiz topics yet.</div>';
            }
        }
    }
    
    function renderRecentActivity(results) {
        const recentActivityList = document.getElementById('recent-activity-list');
        if (!recentActivityList) return;
        
        const recentResults = results
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);
        
        if (recentResults.length === 0) {
            recentActivityList.innerHTML = '<div class="no-data">No quiz activity yet.</div>';
            return;
        }
        
        const activityHTML = recentResults.map(result => {
            const date = new Date(result.date);
            const timeAgo = getTimeAgo(date);
            
            return `
                <div class="activity-item">
                    <div class="activity-user">${result.username}</div>
                    <div class="activity-details">
                        <span class="activity-type">${result.isAiGenerated ? '🤖' : '📚'}</span>
                        <span class="activity-topic">${result.topic || 'Quiz'}</span>
                        <span class="activity-score">${result.score}</span>
                    </div>
                    <div class="activity-time">${timeAgo}</div>
                </div>
            `;
        }).join('');
        
        recentActivityList.innerHTML = activityHTML;
    }
    
    function getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }

    /**
     * Enhanced Question Bank Management
     */
    function renderQuestionTable() {
        if (!questionsTableBody) return;
        
        // Update question bank statistics
        updateQuestionBankStats();
        
        // Get filter values
        const searchTerm = document.getElementById('question-search')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('question-category-filter')?.value || 'all';
        const difficultyFilter = document.getElementById('question-difficulty-filter')?.value || 'all';
        
        // Filter questions
        let filteredQuestions = localQuestions.filter(q => {
            const matchesSearch = !searchTerm || q.question.toLowerCase().includes(searchTerm);
            const matchesCategory = categoryFilter === 'all' || q.category === categoryFilter;
            const matchesDifficulty = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
            
            return matchesSearch && matchesCategory && matchesDifficulty;
        });
        
        // Get question usage statistics
        const questionUsage = JSON.parse(localStorage.getItem('question-usage')) || {};
        
        // Clear and populate table
        questionsTableBody.innerHTML = '';
        
        if (filteredQuestions.length === 0) {
            const row = questionsTableBody.insertRow();
            row.innerHTML = `
                <td colspan="6" class="no-questions">
                    ${localQuestions.length === 0 ? 'No questions available. Add some questions to get started.' : 'No questions match the current filters.'}
                </td>
            `;
            return;
        }
        
        filteredQuestions.forEach(q => {
            const usage = questionUsage[q.id] || { used: 0, correct: 0 };
            const successRate = usage.used > 0 ? ((usage.correct / usage.used) * 100).toFixed(1) : 'N/A';
            
            const row = questionsTableBody.insertRow();
            row.innerHTML = `
                <td class="question-cell">
                    <div class="question-text">${sanitizeInput(q.question)}</div>
                    <div class="question-preview">
                        <strong>Correct:</strong> ${sanitizeInput(q.correct_answer)}<br>
                        <strong>Options:</strong> ${q.incorrect_answers.map(a => sanitizeInput(a)).join(', ')}
                    </div>
                </td>
                <td class="category-cell">
                    <span class="category-badge">${q.category || 'Custom'}</span>
                </td>
                <td class="difficulty-cell">
                    <span class="difficulty-badge ${q.difficulty || 'medium'}">${q.difficulty || 'Medium'}</span>
                </td>
                <td class="usage-cell">
                    <div class="usage-count">${usage.used}</div>
                    <div class="usage-label">times used</div>
                </td>
                <td class="success-cell">
                    <div class="success-rate ${usage.used > 0 ? (parseFloat(successRate) >= 70 ? 'high' : parseFloat(successRate) >= 50 ? 'medium' : 'low') : 'no-data'}">
                        ${successRate}${successRate !== 'N/A' ? '%' : ''}
                    </div>
                </td>
                <td class="actions-cell">
                    <button class="action-btn edit-btn" data-id="${q.id}" title="Edit Question">
                        <span class="btn-icon">✏️</span>
                        Edit
                    </button>
                    <button class="action-btn delete-btn" data-id="${q.id}" title="Delete Question">
                        <span class="btn-icon">🗑️</span>
                        Delete
                    </button>
                </td>
            `;
        });
    }
    
    function updateQuestionBankStats() {
        const totalQuestionsEl = document.getElementById('total-questions-count');
        const customQuestionsEl = document.getElementById('custom-questions-count');
        const categoriesEl = document.getElementById('question-categories-count');
        
        if (totalQuestionsEl) {
            totalQuestionsEl.textContent = localQuestions.length.toString();
        }
        
        if (customQuestionsEl) {
            const customQuestions = localQuestions.filter(q => q.category === 'custom').length;
            customQuestionsEl.textContent = customQuestions.toString();
        }
        
        if (categoriesEl) {
            const categories = new Set(localQuestions.map(q => q.category || 'custom'));
            categoriesEl.textContent = categories.size.toString();
        }
    }
    
    // Add search and filter event listeners
    const questionSearch = document.getElementById('question-search');
    const categoryFilter = document.getElementById('question-category-filter');
    const difficultyFilter = document.getElementById('question-difficulty-filter');
    
    if (questionSearch && isAdminView) {
        questionSearch.addEventListener('input', renderQuestionTable);
    }
    
    if (categoryFilter && isAdminView) {
        categoryFilter.addEventListener('change', renderQuestionTable);
    }
    
    if (difficultyFilter && isAdminView) {
        difficultyFilter.addEventListener('change', renderQuestionTable);
    }

    function renderQuizResults() {
        const resultsTableBody = document.querySelector('#results-table tbody');
        if (!resultsTableBody) return;
        const results = JSON.parse(localStorage.getItem('quiz-results')) || [];
        resultsTableBody.innerHTML = '';
        results.forEach(result => {
            const row = resultsTableBody.insertRow();
            row.innerHTML = `
                <td>${sanitizeInput(result.username)}</td>
                <td>${sanitizeInput(result.score)}</td>
                <td>${result.date}</td>
            `;
        });
    }

    // AI Quiz Generation
    if (aiQuizBtn) {
        console.log('Quiz: AI Quiz button found and event listener attached');
        aiQuizBtn.addEventListener('click', async () => {
            console.log('Quiz: AI Quiz button clicked');
            const topic = topicInput?.value?.trim();
            if (!topic) {
                alert('Please enter a topic for the AI quiz');
                topicInput?.focus();
                return;
            }

            // Check if API key is configured using the global configuration function
            try {
                const config = await getGlobalAIConfig();
                const apiKey = config.quiz.apiKey || '';
                if (!apiKey || apiKey.trim() === '') {
                    console.log('Quiz: No API key found, showing error modal');
                    showErrorModal();
                    return;
                }
            } catch (error) {
                console.error('Error getting AI config:', error);
                console.log('Quiz: No API key found, showing error modal');
                showErrorModal();
                return;
            }

            await startAiQuiz(topic);
        });
    } else {
        console.warn('Quiz: AI Quiz button not found!');
    }

    /**
     * Start AI-powered quiz
     */
    async function startAiQuiz(topic) {
        try {
            // Show loading state
            if (aiQuizBtn) {
                aiQuizBtn.disabled = true;
                aiQuizBtn.innerHTML = `
                    <span class="btn-icon">🔄</span>
                    Generating Questions...
                `;
            }

            aiGenerator.updateStatus('testing', 'Generating AI questions...');
            
            // Generate questions
            const aiQuestions = await aiGenerator.generateQuestions(topic, 5, 'medium');
            
            if (aiQuestions && aiQuestions.length > 0) {
                questions = aiQuestions;
                score = 0;
                currentQuestionIndex = 0;
                isAiMode = true;
                
                startScreen.style.display = 'none';
                quizScreen.style.display = 'block';
                resultsScreen.style.display = 'none';
                
                // Update quiz container with AI branding
                const quizContainer = document.getElementById('quiz-container');
                if (quizContainer) {
                    quizContainer.classList.add('ai-quiz-mode');
                }
                
                showQuestion();
                aiGenerator.updateStatus('success', `Generated ${aiQuestions.length} AI questions!`);
            } else {
                throw new Error('No questions were generated');
            }
        } catch (error) {
            console.error('AI Quiz Error:', error);
            aiGenerator.updateStatus('error', `Failed: ${error.message}`);
            alert(`Failed to generate AI quiz: ${error.message}\n\nPlease check your API key and try again.`);
        } finally {
            // Reset button state
            if (aiQuizBtn) {
                aiQuizBtn.disabled = false;
                aiQuizBtn.innerHTML = `
                    <span class="btn-icon">🧠</span>
                    Generate AI Quiz
                `;
            }
        }
    }

    // Student Progress Navigation Event Listeners
    if (viewProgressStartBtn) {
        viewProgressStartBtn.addEventListener('click', showStudentProgress);
    }
    
    if (viewProgressBtn) {
        viewProgressBtn.addEventListener('click', showStudentProgress);
    }
    
    if (backToQuizBtn) {
        backToQuizBtn.addEventListener('click', () => {
            progressScreen.style.display = 'none';
            startScreen.style.display = 'block';
        });
    }

    // Enhanced Quiz Control Event Listeners
    if (startBtn) {
        console.log('Quiz: Start button found and event listener attached');
        startBtn.addEventListener('click', startQuiz);
    } else {
        console.warn('Quiz: Start button not found!');
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', nextQuestion);
    }
    
    if (finishBtn) {
        finishBtn.addEventListener('click', finishQuiz);
    }
    
    if (hintBtn) {
        hintBtn.addEventListener('click', () => {
            // Simple hint system - highlight difficulty or show category
            const question = questions[currentQuestionIndex];
            alert(`Hint: This is a ${question.difficulty || 'medium'} difficulty ${question.category || 'general'} question.`);
        });
    }
    
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            // Reset quiz state
            score = 0;
            currentQuestionIndex = 0;
            questionAnswers = [];
            isAiMode = false;
            isTimedMode = false;
            
            // Reset timer
            if (quizTimerNew) {
                quizTimerNew.stop();
            }
            
            // Show start screen
            resultsScreen.style.display = 'none';
            progressScreen.style.display = 'none';
            startScreen.style.display = 'block';
            
            // Remove AI mode styling
            const quizContainer = document.getElementById('quiz-container');
            if (quizContainer) {
                quizContainer.classList.remove('ai-quiz-mode');
            }
        });
    }

    // Admin Form Event Listeners (only in admin view)
    if (addQuestionForm && isAdminView) {
        addQuestionForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const questionId = parseInt(questionIdInput.value);
            const questionData = {
                category: 'custom',
                type: 'multiple',
                difficulty: 'custom',
                question: document.getElementById('question-text').value,
                correct_answer: document.getElementById('correct-answer').value,
                incorrect_answers: [
                    document.getElementById('incorrect-answer-1').value,
                    document.getElementById('incorrect-answer-2').value,
                    document.getElementById('incorrect-answer-3').value,
                ]
            };

            if (questionId) {
                // Update existing question
                const questionIndex = localQuestions.findIndex(q => q.id === questionId);
                if (questionIndex > -1) {
                    localQuestions[questionIndex] = { ...localQuestions[questionIndex], ...questionData };
                }
            } else {
                // Add new question
                questionData.id = Date.now();
                localQuestions.push(questionData);
            }

            localStorage.setItem('quiz-questions', JSON.stringify(localQuestions));
            alert(`Question ${questionId ? 'updated' : 'added'} successfully!`);
            resetForm();
            renderQuestionTable();
        });
    }

    function resetForm() {
        if (addQuestionForm) addQuestionForm.reset();
        if (questionIdInput) questionIdInput.value = '';
        if (formSubmitBtn) formSubmitBtn.textContent = 'Add Question';
        if (formCancelBtn) formCancelBtn.style.display = 'none';
    }

    if (questionsTableBody && isAdminView) {
        questionsTableBody.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('action-btn')) {
                const questionId = parseInt(target.dataset.id);

                if (target.classList.contains('delete-btn')) {
                    if (confirm('Are you sure you want to delete this question?')) {
                        localQuestions = localQuestions.filter(q => q.id !== questionId);
                        localStorage.setItem('quiz-questions', JSON.stringify(localQuestions));
                        renderQuestionTable();
                    }
                } else if (target.classList.contains('edit-btn')) {
                    const questionToEdit = localQuestions.find(q => q.id === questionId);
                    if (questionToEdit) {
                        questionIdInput.value = questionToEdit.id;
                        document.getElementById('question-text').value = questionToEdit.question;
                        document.getElementById('correct-answer').value = questionToEdit.correct_answer;
                        document.getElementById('incorrect-answer-1').value = questionToEdit.incorrect_answers[0];
                        document.getElementById('incorrect-answer-2').value = questionToEdit.incorrect_answers[1];
                        document.getElementById('incorrect-answer-3').value = questionToEdit.incorrect_answers[2];

                        formSubmitBtn.textContent = 'Update Question';
                        formCancelBtn.style.display = 'inline-block';
                        addQuestionForm.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            }
        });
    }

    if (formCancelBtn && isAdminView) {
        formCancelBtn.addEventListener('click', resetForm);
    }

    // --- JSON Upload (Admin only) ---
    const jsonUploadInput = document.getElementById('json-upload');
    const uploadBtn = document.getElementById('upload-btn');

    if (uploadBtn && isAdminView) {
        uploadBtn.addEventListener('click', () => {
            const file = jsonUploadInput?.files[0];
            if (!file) {
                alert('Please select a JSON file to upload.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const newQuestions = JSON.parse(event.target.result);

                    // Basic validation
                    if (!Array.isArray(newQuestions)) {
                        throw new Error('JSON must be an array of questions.');
                    }

                    const validatedQuestions = newQuestions.filter(q => q.question && q.correct_answer && Array.isArray(q.incorrect_answers) && q.incorrect_answers.length >= 3);

                    if (validatedQuestions.length !== newQuestions.length) {
                        alert('Some questions in the file were invalid and have been skipped.');
                    }

                    validatedQuestions.forEach(q => {
                        q.id = Date.now() + Math.random(); // Ensure unique ID
                        q.category = 'custom';
                        q.type = 'multiple';
                        q.difficulty = 'custom';
                        localQuestions.push(q);
                    });

                    localStorage.setItem('quiz-questions', JSON.stringify(localQuestions));
                    renderQuestionTable();
                    alert(`${validatedQuestions.length} questions uploaded successfully!`);
                    if (jsonUploadInput) jsonUploadInput.value = ''; // Reset file input

                } catch (error) {
                    alert(`Error parsing JSON file: ${error.message}`);
                }
            };
            reader.readAsText(file);
        });
    }


    async function startQuiz() {
        const category = categorySelect.value;
        const difficulty = difficultySelect.value;
        score = 0;
        currentQuestionIndex = 0;
        isTimedMode = timedModeCheckbox.checked;
        totalQuizStartTime = Date.now();

        // Check for available offline questions
        const availableOfflineQuestions = localQuestions.filter(q => 
            !difficulty || q.difficulty === difficulty || q.difficulty === 'custom'
        );

        try {
            const response = await fetch(`https://opentdb.com/api.php?amount=10&category=${category}&difficulty=${difficulty}&type=multiple`);
            const data = await response.json();
            questions = [...data.results, ...availableOfflineQuestions];
            
            // If we have questions, start the quiz
            if (questions.length > 0) {
                startScreen.style.display = 'none';
                quizScreen.style.display = 'block';
                resultsScreen.style.display = 'none';
                showQuestion();
            } else {
                showOfflineErrorModal();
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
            // Fallback to local questions only
            if (availableOfflineQuestions.length > 0) {
                questions = availableOfflineQuestions;
                startScreen.style.display = 'none';
                quizScreen.style.display = 'block';
                resultsScreen.style.display = 'none';
                showQuestion();
            } else {
                // Show styled error modal instead of alert
                showOfflineErrorModal();
            }
        }
    }

    /**
     * Enhanced Quiz Display Functions
     */
    function showQuestion() {
        const question = questions[currentQuestionIndex];
        if (!question) return;
        
        // Update progress
        updateQuizProgress();
        
        // Display question
        questionContainer.innerHTML = `
            <div class="question-header">
                <span class="question-difficulty">${question.difficulty || 'Medium'}</span>
                <span class="question-category">${question.category || 'General'}</span>
            </div>
            <div class="question-text">${sanitizeInput(question.question)}</div>
        `;

        // Prepare and shuffle options
        const options = [...question.incorrect_answers, question.correct_answer];
        options.sort(() => Math.random() - 0.5);

        // Display options
        optionsContainer.innerHTML = '';
        options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.innerHTML = `
                <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                <span class="option-text">${sanitizeInput(option)}</span>
            `;
            button.addEventListener('click', () => selectOption(button, option));
            optionsContainer.appendChild(button);
        });
        
        // Reset controls
        nextBtn.style.display = 'none';
        finishBtn.style.display = 'none';
        
        // Show hint button for difficult questions
        if (question.difficulty === 'hard' && hintBtn) {
            hintBtn.style.display = 'block';
        } else if (hintBtn) {
            hintBtn.style.display = 'none';
        }
        
        // Start timer for this question
        currentQuestionStartTime = Date.now();
        if (isTimedMode && quizTimerNew) {
            quizTimerNew.start(timePerQuestion);
            if (quizTimer) quizTimer.style.display = 'flex';
        }
    }

    function selectOption(selectedButton, selectedAnswer) {
        const question = questions[currentQuestionIndex];
        const isCorrect = selectedAnswer === question.correct_answer;
        const timeTaken = Date.now() - currentQuestionStartTime;
        
        // Stop timer
        if (isTimedMode) {
            quizTimerNew.stop();
        }
        
        // Track detailed answer data
        const answerData = {
            questionIndex: currentQuestionIndex,
            question: question.question,
            selectedAnswer,
            correctAnswer: question.correct_answer,
            isCorrect,
            timeTaken,
            difficulty: question.difficulty || 'medium',
            category: question.category || 'general'
        };
        
        questionAnswers.push(answerData);
        
        // Track question performance
        trackQuestionPerformance(question.id || currentQuestionIndex, isCorrect, timeTaken);
        
        // Update score
        if (isCorrect) {
            score++;
            selectedButton.classList.add('correct');
        } else {
            selectedButton.classList.add('incorrect');
        }

        // Disable all options and show correct answer
        Array.from(optionsContainer.children).forEach(button => {
            button.disabled = true;
            const optionText = button.querySelector('.option-text').textContent;
            if (optionText === question.correct_answer) {
                button.classList.add('correct');
            }
        });

        // Show next/finish button based on progress
        if (currentQuestionIndex < questions.length - 1) {
            nextBtn.style.display = 'block';
        } else {
            finishBtn.style.display = 'block';
        }
    }

    function nextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            showQuestion();
        } else {
            finishQuiz();
        }
    }

    function finishQuiz() {
        // Stop any running timer
        if (isTimedMode) {
            quizTimerNew.stop();
        }
        
        // Calculate total time
        const totalTime = Date.now() - totalQuizStartTime;
        
        // Show results
        showEnhancedResults(totalTime);
    }

    /**
     * Enhanced Results Display
     */
    function showEnhancedResults(totalTime) {
        quizScreen.style.display = 'none';
        resultsScreen.style.display = 'block';
        
        const percentage = Math.round((score / questions.length) * 100);
        const correctAnswers = score;
        const incorrectAnswers = questions.length - score;
        
        // Update basic score display
        scoreSpan.textContent = `${score} / ${questions.length}`;
        scorePercentage.textContent = `${percentage}%`;
        correctCount.textContent = correctAnswers;
        incorrectCount.textContent = incorrectAnswers;
        
        // Update quiz type indicator
        if (resultsQuizType) {
            resultsQuizType.textContent = isAiMode ? '🤖 AI Quiz' : '📚 Offline Quiz';
        }
        
        // Show time if timed mode
        if (isTimedMode && timeBreakdown) {
            timeBreakdown.style.display = 'flex';
            const minutes = Math.floor(totalTime / 60000);
            const seconds = Math.floor((totalTime % 60000) / 1000);
            timeTaken.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Update results icon and title based on performance
        updateResultsHeader(percentage);
        
        // Generate performance analysis
        generatePerformanceAnalysis();
        
        // Show detailed question review
        showQuestionReview();
        
        // Check and display achievements
        const quizData = {
            percentage,
            isAiGenerated: isAiMode,
            isTimedMode,
            timeRemaining: isTimedMode ? quizTimer.timeRemaining : 0,
            totalTime
        };
        
        const earnedAchievements = checkAchievements(quizData);
        displayAchievements(earnedAchievements);
        
        // Save quiz results with enhanced data
        saveQuizResults(quizData, totalTime);
    }
    
    function updateResultsHeader(percentage) {
        if (percentage === 100) {
            resultsIcon.textContent = '🏆';
            resultsTitle.textContent = 'Perfect Score!';
        } else if (percentage >= 80) {
            resultsIcon.textContent = '🎉';
            resultsTitle.textContent = 'Excellent Work!';
        } else if (percentage >= 60) {
            resultsIcon.textContent = '😊';
            resultsTitle.textContent = 'Good Job!';
        } else if (percentage >= 40) {
            resultsIcon.textContent = '💪';
            resultsTitle.textContent = 'Keep Practicing!';
        } else {
            resultsIcon.textContent = '📝';
            resultsTitle.textContent = 'Room for Improvement';
        }
    }
    
    function generatePerformanceAnalysis() {
        if (!performanceContent) return;
        
        const analysis = [];
        const avgTime = questionAnswers.reduce((sum, ans) => sum + ans.timeTaken, 0) / questionAnswers.length;
        const correctAnswers = questionAnswers.filter(ans => ans.isCorrect);
        
        // Time analysis
        if (isTimedMode) {
            if (avgTime < timePerQuestion * 1000 * 0.5) {
                analysis.push('⚡ You answered questions quickly! Consider taking more time to read carefully.');
            } else if (avgTime > timePerQuestion * 1000 * 0.8) {
                analysis.push('🕒 You took time to think through answers. Good strategy!');
            }
        }
        
        // Difficulty analysis
        const hardQuestions = questionAnswers.filter(ans => ans.difficulty === 'hard');
        const hardCorrect = hardQuestions.filter(ans => ans.isCorrect).length;
        if (hardQuestions.length > 0) {
            const hardPercentage = (hardCorrect / hardQuestions.length) * 100;
            if (hardPercentage >= 70) {
                analysis.push('🧠 Excellent performance on difficult questions!');
            } else if (hardPercentage < 30) {
                analysis.push('📚 Consider reviewing challenging topics for better understanding.');
            }
        }
        
        // Category analysis
        const categories = {};
        questionAnswers.forEach(ans => {
            if (!categories[ans.category]) {
                categories[ans.category] = { total: 0, correct: 0 };
            }
            categories[ans.category].total++;
            if (ans.isCorrect) categories[ans.category].correct++;
        });
        
        Object.entries(categories).forEach(([category, stats]) => {
            const catPercentage = (stats.correct / stats.total) * 100;
            if (catPercentage === 100) {
                analysis.push(`🎯 Perfect score in ${category}!`);
            } else if (catPercentage < 50) {
                analysis.push(`📜 Consider studying more ${category} topics.`);
            }
        });
        
        if (analysis.length === 0) {
            analysis.push('🙌 Good effort! Keep practicing to improve your skills.');
        }
        
        performanceContent.innerHTML = analysis.map(text => 
            `<div class="analysis-item">${text}</div>`
        ).join('');
    }
    
    function showQuestionReview() {
        if (!questionReviewContainer) return;
        
        // Add filter event listeners
        const toggleBtns = document.querySelectorAll('.toggle-btn');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                toggleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                filterQuestionReview(btn.dataset.filter);
            });
        });
        
        // Initial display - show all
        filterQuestionReview('all');
    }
    
    function filterQuestionReview(filter) {
        let filteredAnswers = questionAnswers;
        
        if (filter === 'correct') {
            filteredAnswers = questionAnswers.filter(ans => ans.isCorrect);
        } else if (filter === 'incorrect') {
            filteredAnswers = questionAnswers.filter(ans => !ans.isCorrect);
        }
        
        const reviewHTML = filteredAnswers.map((ans, index) => `
            <div class="review-item ${ans.isCorrect ? 'correct' : 'incorrect'}">
                <div class="review-header">
                    <span class="review-number">Q${ans.questionIndex + 1}</span>
                    <span class="review-status">${ans.isCorrect ? '✅' : '❌'}</span>
                    <span class="review-time">${Math.round(ans.timeTaken / 1000)}s</span>
                </div>
                <div class="review-question">${sanitizeInput(ans.question)}</div>
                <div class="review-answers">
                    <div class="review-answer your-answer ${ans.isCorrect ? 'correct' : 'incorrect'}">
                        <strong>Your Answer:</strong> ${sanitizeInput(ans.selectedAnswer)}
                    </div>
                    ${!ans.isCorrect ? `
                        <div class="review-answer correct-answer">
                            <strong>Correct Answer:</strong> ${sanitizeInput(ans.correctAnswer)}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
        
        if (questionReviewContainer) {
            questionReviewContainer.innerHTML = reviewHTML || '<div class="no-results">No questions match this filter.</div>';
        }
    }
    
    function displayAchievements(earnedAchievements) {
        if (!achievementsSpan) return;
        
        if (earnedAchievements.length === 0) {
            achievementsSpan.innerHTML = '<div class="no-achievements">Complete more quizzes to earn achievements!</div>';
            return;
        }
        
        const achievementHTML = earnedAchievements.map(achId => {
            const achievement = achievements[achId];
            return `
                <div class="achievement-badge new">
                    <span class="achievement-icon">${achievement.icon}</span>
                    <div class="achievement-info">
                        <div class="achievement-name">${achievement.name}</div>
                        <div class="achievement-desc">${achievement.description}</div>
                    </div>
                </div>
            `;
        }).join('');
        achievementsSpan.innerHTML = achievementHTML;
    }
    function showStudentProgress() {
        startScreen.style.display = 'none';
        resultsScreen.style.display = 'none';
        quizScreen.style.display = 'none';
        progressScreen.style.display = 'block';
        
        const progress = getStudentProgress();
        
        // Update progress statistics
        document.getElementById('student-total-quizzes').textContent = progress.totalQuizzes;
        document.getElementById('student-avg-score').textContent = `${Math.round(progress.avgScore)}%`;
        document.getElementById('student-best-score').textContent = `${Math.round(progress.bestScore)}%`;
        document.getElementById('student-ai-quizzes').textContent = progress.aiQuizzes;
        
        // Display quiz history
        displayQuizHistory(progress.recentResults);
        
        // Display earned achievements
        displayAllAchievements();
    }
    
    function displayQuizHistory(results) {
        const historyContainer = document.getElementById('quiz-history-container');
        if (!historyContainer) return;
        
        if (results.length === 0) {
            historyContainer.innerHTML = '<div class="no-history">No quiz history yet. Take your first quiz!</div>';
            return;
        }
        
        const historyHTML = results.reverse().map((result, index) => {
            const [correct, total] = result.score.split(' / ').map(Number);
            const percentage = Math.round((correct / total) * 100);
            const date = new Date(result.date).toLocaleDateString();
            
            return `
                <div class="history-item">
                    <div class="history-header">
                        <span class="history-type">${result.isAiGenerated ? '🤖' : '📚'}</span>
                        <span class="history-topic">${result.topic || 'Quiz'}</span>
                        <span class="history-date">${date}</span>
                    </div>
                    <div class="history-score">
                        <div class="score-bar">
                            <div class="score-fill" style="width: ${percentage}%"></div>
                        </div>
                        <span class="score-text">${result.score} (${percentage}%)</span>
                    </div>
                </div>
            `;
        }).join('');
        
        historyContainer.innerHTML = historyHTML;
    }
    
    function displayAllAchievements() {
        const achievementsContainer = document.getElementById('achievements-container');
        if (!achievementsContainer) return;
        
        const earnedAchievements = JSON.parse(localStorage.getItem('earned-achievements')) || [];
        
        const achievementHTML = Object.entries(achievements).map(([achId, achievement]) => {
            const isEarned = earnedAchievements.includes(achId);
            return `
                <div class="achievement-item ${isEarned ? 'earned' : 'locked'}">
                    <span class="achievement-icon">${isEarned ? achievement.icon : '🔒'}</span>
                    <div class="achievement-details">
                        <div class="achievement-name">${achievement.name}</div>
                        <div class="achievement-desc">${achievement.description}</div>
                    </div>
                    ${isEarned ? '<span class="earned-badge">✓</span>' : ''}
                </div>
            `;
        }).join('');
        
        achievementsContainer.innerHTML = achievementHTML;
    }
    
    /**
     * Save Quiz Results with Enhanced Analytics
     */
    function saveQuizResults(quizData, totalTime) {
        const username = localStorage.getItem('username') || 'Anonymous';
        const results = JSON.parse(localStorage.getItem('quiz-results')) || [];
        
        const resultData = {
            id: Date.now() + Math.random(),
            username: username,
            score: `${score} / ${questions.length}`,
            percentage: quizData.percentage,
            date: new Date().toISOString(),
            isAiGenerated: isAiMode,
            topic: isAiMode ? topicInput?.value || 'AI Quiz' : 'Offline Quiz',
            difficulty: isAiMode ? aiDifficulty?.value || 'medium' : difficultySelect?.value || 'medium',
            category: isAiMode ? 'ai-generated' : categorySelect?.value || 'general',
            totalTime: totalTime,
            isTimedMode: isTimedMode,
            questionCount: questions.length,
            questionAnswers: questionAnswers,
            achievements: quizData.achievements || []
        };
        
        results.push(resultData);
        localStorage.setItem('quiz-results', JSON.stringify(results));
        
        // Update AI questions count if in AI mode
        if (isAiMode) {
            const currentCount = parseInt(localStorage.getItem('ai-questions-count') || '0');
            localStorage.setItem('ai-questions-count', (currentCount + questions.length).toString());
        }
        
        // Update question usage counts for admin analytics
        questions.forEach((question, index) => {
            const questionId = question.id || `question_${index}`;
            const usageStats = JSON.parse(localStorage.getItem('question-usage')) || {};
            
            if (!usageStats[questionId]) {
                usageStats[questionId] = { used: 0, correct: 0 };
            }
            
            usageStats[questionId].used++;
            if (questionAnswers[index] && questionAnswers[index].isCorrect) {
                usageStats[questionId].correct++;
            }
            
            localStorage.setItem('question-usage', JSON.stringify(usageStats));
        });
    }

    /**
     * Show error modal with animation when API is not configured
     */
    function showErrorModal() {
        const errorModal = document.getElementById('error-modal');
        if (errorModal) {
            errorModal.style.display = 'flex';
            // Trigger animation after display
            setTimeout(() => {
                errorModal.classList.add('show');
            }, 10);
        }
    }

    /**
     * Hide error modal with animation
     */
    function hideErrorModal() {
        const errorModal = document.getElementById('error-modal');
        if (errorModal) {
            errorModal.classList.remove('show');
            // Hide after animation completes
            setTimeout(() => {
                errorModal.style.display = 'none';
            }, 300);
        }
    }

    /**
     * Show offline error modal with animation when no offline questions are available
     */
    function showOfflineErrorModal() {
        const offlineErrorModal = document.getElementById('offline-error-modal');
        if (offlineErrorModal) {
            offlineErrorModal.style.display = 'flex';
            // Trigger animation after display
            setTimeout(() => {
                offlineErrorModal.classList.add('show');
            }, 10);
        }
    }

    /**
     * Hide offline error modal with animation
     */
    function hideOfflineErrorModal() {
        const offlineErrorModal = document.getElementById('offline-error-modal');
        if (offlineErrorModal) {
            offlineErrorModal.classList.remove('show');
            // Hide after animation completes
            setTimeout(() => {
                offlineErrorModal.style.display = 'none';
            }, 300);
        }
    }

    // Error Modal Event Listeners
    const closeErrorBtn = document.getElementById('close-error-btn');
    const gotoAdminBtn = document.getElementById('goto-admin-btn');
    const errorModal = document.getElementById('error-modal');

    if (closeErrorBtn) {
        closeErrorBtn.addEventListener('click', hideErrorModal);
    }

    if (gotoAdminBtn) {
        gotoAdminBtn.addEventListener('click', () => {
            hideErrorModal();
            // Check authentication before redirecting to admin panel
            redirectToAdminPanel();
        });
    }

    // Close modal when clicking outside the content
    if (errorModal) {
        errorModal.addEventListener('click', (e) => {
            if (e.target === errorModal) {
                hideErrorModal();
            }
        });
    }

    // Offline Error Modal Event Listeners
    const closeOfflineErrorBtn = document.getElementById('close-offline-error-btn');
    const tryAiQuizBtn = document.getElementById('try-ai-quiz-btn');
    const offlineErrorModal = document.getElementById('offline-error-modal');

    if (closeOfflineErrorBtn) {
        closeOfflineErrorBtn.addEventListener('click', hideOfflineErrorModal);
    }

    if (tryAiQuizBtn) {
        tryAiQuizBtn.addEventListener('click', () => {
            hideOfflineErrorModal();
            // Switch to AI quiz mode by focusing on the topic input
            if (topicInput) {
                topicInput.focus();
                topicInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }

    // Close offline modal when clicking outside the content
    if (offlineErrorModal) {
        offlineErrorModal.addEventListener('click', (e) => {
            if (e.target === offlineErrorModal) {
                hideOfflineErrorModal();
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideErrorModal();
            hideOfflineErrorModal();
        }
    });

    // Page initialization - ensure content is visible
    setTimeout(() => {
        const loaderWrapper = document.getElementById('loader-wrapper');
        if (loaderWrapper) {
            loaderWrapper.style.display = 'none';
        }
        document.body.classList.add('loaded');
        console.log('Quiz: Page initialization complete');
    }, 100);

});
