        // Wait for DOM to be ready
        document.addEventListener('DOMContentLoaded', function() {
            initializeApp();
        });

        function initializeApp() {
            // API Configuration (DO NOT CHANGE)
            const apiKey = "AIzaSyBP7Tt1O3HyXO4e3DP2HXOxrXu_qhBdCHU";
            const apiUrl = apiKey ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}` : null;

            // ========================================
            // CHATBOT INSTRUCTIONS - CUSTOMIZE HERE
            // ========================================
            // Add your custom instructions for the chatbot here.
            // These instructions will guide how the chatbot responds to user messages.
            const CHATBOT_INSTRUCTIONS = `You are a helpful study assistant for students. 
Your role is to:
- Help students with their studies and academic questions
- Provide motivational support and study tips
- Explain concepts in a clear and friendly way
- Keep responses concise and to the point
- Be encouraging and supportive
- if someone ask who am i... simply say you are the students (creator of this website) of VITS college, Satna
- if i ask what is my/our name... simply say your is Pranay & Prabhat

Always maintain a friendly and professional tone.`;
            // ========================================

        // Utility function for exponential backoff
        async function fetchWithExponentialBackoff(url, options, retries = 3) {
            try {
                const response = await fetch(url, options);
                if (response.status === 429 && retries > 0) {
                    const delay = Math.pow(2, 3 - retries) * 1000;
                    console.log(`Rate limit exceeded. Retrying in ${delay / 1000} seconds...`);
                    await new Promise(res => setTimeout(res, delay));
                    return fetchWithExponentialBackoff(url, options, retries - 1);
                }
                if (!response.ok) {
                    throw new Error(`API call failed with status: ${response.status}`);
                }
                return response;
            } catch (error) {
                if (retries > 0) {
                    const delay = Math.pow(2, 3 - retries) * 1000;
                    console.error(`Fetch failed: ${error.message}. Retrying in ${delay / 1000} seconds...`);
                    await new Promise(res => setTimeout(res, delay));
                    return fetchWithExponentialBackoff(url, options, retries - 1);
                }
                throw error;
            }
        }

        const modal = document.getElementById('llm-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-content-body');

        function showModal(title, content) {
            if (!modal || !modalTitle || !modalBody) {
                console.error('Modal elements not found');
                return;
            }
            modalTitle.textContent = title;
            modalBody.innerHTML = content;
            modal.classList.add('show');
        }

        function closeModal() {
            if (modal) {
                modal.classList.remove('show');
            }
        }

        window.onclick = function(event) {
            if (event.target == modal) {
                closeModal();
            }
        }

        // --- LLM Functions ---

        document.getElementById('generate-plan-btn').addEventListener('click', async () => {
            if (!apiKey) {
                showModal('API Configuration Required', '<div class="text-center text-red-600">API key is not configured. Please add your API key to enable this feature.</div>');
                return;
            }

            const topic = 'Advanced Mathematics';
            const goal = 'Mastering Integration';
            const prompt = `Generate a detailed study plan for a college student in a university-level class. The topic is "${topic}" and the goal is "${goal}". The plan should be realistic and broken down by day over one week. Provide the response as a JSON object with a single "plan" array containing objects, each with "day", "focus", and "tasks" properties. Each "tasks" property should be an array of strings.`;

            const payload = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            plan: {
                                type: "ARRAY",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        day: { type: "STRING" },
                                        focus: { type: "STRING" },
                                        tasks: {
                                            type: "ARRAY",
                                            items: { type: "STRING" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            };

            showModal('Generating Study Plan...', '<div class="text-center text-gray-500">Please wait, your personalized study plan is being generated...</div>');

            try {
                const response = await fetchWithExponentialBackoff(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                const planData = JSON.parse(result.candidates[0].content.parts[0].text);

                let planHtml = `<div class="p-4 bg-gray-100 rounded-lg">
                    <p class="font-semibold text-lg mb-2">Topic: ${topic}</p>
                    <p class="font-semibold text-lg">Goal: ${goal}</p>
                </div>`;
                planData.plan.forEach(dayPlan => {
                    planHtml += `<div class="mt-6 border-b pb-4">
                        <h4 class="text-lg font-bold text-indigo-600">${dayPlan.day}</h4>
                        <p class="text-md font-semibold text-gray-800">${dayPlan.focus}</p>
                        <ul class="list-disc list-inside mt-2 space-y-1">`;
                    dayPlan.tasks.forEach(task => {
                        planHtml += `<li class="text-sm text-gray-600">${task}</li>`;
                    });
                    planHtml += `</ul></div>`;
                });

                showModal('Personalized Study Plan', planHtml);

            } catch (error) {
                showModal('Error', `<p class="text-red-600">Failed to generate study plan. Please try again later.</p><p class="text-sm text-gray-500 mt-2">${error.message}</p>`);
                console.error('Error generating study plan:', error);
            }
        });

        // --- Chatbot Logic ---
        const chatbotSphere = document.getElementById('chatbot-sphere');
        const chatbotPopup = document.getElementById('chatbot-popup');
        const chatMessages = document.getElementById('chat-messages');
        const chatInput = document.getElementById('chat-input');
        const chatSendBtn = document.getElementById('chat-send-btn');

        function toggleChatbot() {
            if (!chatbotPopup) return;
            if (chatbotPopup.style.display === 'flex') {
                chatbotPopup.style.display = 'none';
            } else {
                chatbotPopup.style.display = 'flex';
            }
        }

        if (chatbotSphere) chatbotSphere.addEventListener('click', toggleChatbot);

        function addMessage(text, sender) {
            if (!chatMessages) return;
            const bubble = document.createElement('div');
            bubble.classList.add('message-bubble', sender === 'user' ? 'user-message' : 'bot-message');
            bubble.textContent = text;
            chatMessages.appendChild(bubble);
            chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom
        }

        async function sendMessage() {
            const message = chatInput.value.trim();
            if (message === '') return;

            if (!apiKey) {
                addMessage('API key is not configured. Please add your API key to enable chat functionality.', 'bot');
                return;
            }

            addMessage(message, 'user');
            chatInput.value = '';

            const loadingDots = document.createElement('div');
            loadingDots.classList.add('loading-dots', 'bot-message');
            loadingDots.innerHTML = '<div></div><div></div><div></div>';
            chatMessages.appendChild(loadingDots);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            try {
                // Combine instructions with user message
                const fullMessage = `${CHATBOT_INSTRUCTIONS}\n\nUser question: ${message}`;
                
                const payload = {
                    contents: [{ parts: [{ text: fullMessage }] }]
                };
                const response = await fetchWithExponentialBackoff(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                const botResponse = result.candidates[0].content.parts[0].text;
                
                chatMessages.removeChild(loadingDots);
                addMessage(botResponse, 'bot');
            } catch (error) {
                chatMessages.removeChild(loadingDots);
                addMessage('Sorry, I am unable to provide a response at this time.', 'bot');
                console.error('Error in chatbot API call:', error);
            }
        }

        if (chatSendBtn) chatSendBtn.addEventListener('click', sendMessage);
        if (chatInput) chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        // --- To-Do List and Goal Functionality ---
        const todoInput = document.getElementById('new-todo-input');
        const addTodoBtn = document.getElementById('add-todo-btn');
        const todoList = document.getElementById('todo-list');
        const goalsCompletedEl = document.getElementById('goals-completed');
        const completionRateEl = document.getElementById('completion-rate');
        const goalTitleEl = document.getElementById('goal-title');
        const goalDescriptionEl = document.getElementById('goal-description');
        const goalStatusEl = document.getElementById('goal-status');
        const goalProgressFillEl = document.getElementById('goal-progress-fill');
        const goalProgressTextEl = document.getElementById('goal-progress-text');
        const studyTimeEl = document.getElementById('study-time');
        
        let todos = [];
        let currentGoalIndex = null;
        let totalSeconds = 0;
        let timerInterval;

        function updateUI() {
            todoList.innerHTML = '';
            let completedCount = 0;
            todos.forEach((todo, index) => {
                const li = document.createElement('li');
                li.className = 'flex items-center justify-between p-3 rounded-2xl glass-strong transition duration-300 ease-in-out hover:bg-white hover:bg-opacity-20';
                
                const leftDiv = document.createElement('div');
                leftDiv.className = 'flex items-center space-x-3';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = todo.completed;
                checkbox.className = 'w-5 h-5 text-sky-500 bg-white bg-opacity-20 border-2 border-sky-400 rounded cursor-pointer focus:ring-2 focus:ring-sky-500';
                checkbox.onclick = () => toggleTodo(index);
                
                const span = document.createElement('span');
                span.textContent = todo.text;
                span.className = `flex-grow text-slate-800 ${todo.completed ? 'line-through text-opacity-60' : ''}`;

                leftDiv.appendChild(checkbox);
                leftDiv.appendChild(span);
                
                li.appendChild(leftDiv);
                
                const setGoalBtn = document.createElement('button');
                setGoalBtn.textContent = 'Set Goal';
                setGoalBtn.className = 'bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-full hover:from-sky-600 hover:to-blue-700 transition duration-300 transform hover:scale-105';
                setGoalBtn.onclick = () => setGoal(index);

                li.appendChild(setGoalBtn);

                if (todo.completed) {
                    completedCount++;
                }

                todoList.appendChild(li);
            });
            
            // Update Goals Completed widget
            const totalGoals = todos.length;
            goalsCompletedEl.textContent = `${completedCount}/${totalGoals}`;
            const completionRate = totalGoals > 0 ? Math.round((completedCount / totalGoals) * 100) : 0;
            completionRateEl.textContent = `${completionRate}% completion rate`;
            
            // Update Today's Goal div
            if (currentGoalIndex !== null && todos[currentGoalIndex]) {
                const currentGoal = todos[currentGoalIndex];
                goalTitleEl.textContent = currentGoal.text;
                goalDescriptionEl.textContent = 'Currently tracking this goal.';
                
                const progress = currentGoal.completed ? 100 : 0;
                goalProgressFillEl.style.width = `${progress}%`;
                goalProgressFillEl.style.backgroundColor = currentGoal.completed ? '#10B981' : '#3b82f6';
                goalProgressTextEl.textContent = `Progress: ${progress}%`;
                
                goalStatusEl.textContent = currentGoal.completed ? 'Completed' : 'In Progress';
                goalStatusEl.className = `text-sm font-medium px-3 py-1 rounded-full ${currentGoal.completed ? 'text-green-600 bg-green-100' : 'text-blue-600 bg-blue-100'}`;
            } else {
                goalTitleEl.textContent = 'No Goal Set';
                goalDescriptionEl.textContent = 'Select a task from your to-do list to set a goal.';
                goalProgressFillEl.style.width = '0%';
                goalProgressFillEl.style.backgroundColor = '#e2e8f0';
                goalProgressTextEl.textContent = '';
                goalStatusEl.textContent = 'No Goal Set';
                goalStatusEl.className = 'text-sm font-medium text-gray-600 bg-gray-200 px-3 py-1 rounded-full';
            }
        }
        
        function setGoal(index) {
            currentGoalIndex = index;
            updateUI();
        }

        function addTodo() {
            const text = todoInput.value.trim();
            if (text) {
                todos.push({ text, completed: false });
                todoInput.value = '';
                updateUI();
            }
        }
        
        function toggleTodo(index) {
            todos[index].completed = !todos[index].completed;
            updateUI();
        }
        
        if (addTodoBtn) addTodoBtn.addEventListener('click', addTodo);
        if (todoInput) todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addTodo();
            }
        });

        // Analytics and Tracking Data
        let analyticsData = JSON.parse(localStorage.getItem('studyAnalytics')) || {
            dailyGoals: { studyTime: 300, tasks: 10, sessions: 8 }, // in minutes
            currentStreak: 7,
            longestStreak: 12,
            todayTime: 225, // in minutes
            weekTime: 1112, // in minutes
            weekSessions: 24,
            totalTasks: 147,
            achievements: [
                { id: 'week_warrior', name: 'Week Warrior', desc: '7 days streak', icon: '🥇', unlocked: true },
                { id: 'speed_demon', name: 'Speed Demon', desc: '10 tasks in a day', icon: '⚡', unlocked: true }
            ],
            subjectBreakdown: {
                'Mathematics': 90,
                'Physics': 75,
                'Chemistry': 60
            },
            weeklyHours: [2.5, 4.0, 2.2, 4.5, 3.5, 3.2, 2.8],
            lastStudyDate: new Date().toDateString()
        };

        // Pomodoro Timer Functionality with Customization
        let pomodoroTimer;
        let pomodoroSeconds = 1500; // 25 minutes in seconds
        let originalSeconds = 1500;
        let isRunning = false;
        let sessionCount = 0;
        let currentMode = 'focus'; // 'focus', 'break', 'longBreak'
        let customSettings = {
            sessionDuration: 25,
            breakDuration: 5,
            longBreakDuration: 15,
            sessionTitle: 'Focus Session'
        };

        // DOM Elements
        const pomodoroModal = document.getElementById('pomodoro-modal');
        const timerDisplay = document.getElementById('timer-display');
        const timerMode = document.getElementById('timer-mode');
        const startTimerBtn = document.getElementById('start-timer');
        const pauseTimerBtn = document.getElementById('pause-timer');
        const resetTimerBtn = document.getElementById('reset-timer');
        const closePomodoroBtn = document.getElementById('close-pomodoro');
        const pomodoroBtn = document.getElementById('pomodoro-btn');
        
        // Floating Timer Elements
        const floatingTimer = document.getElementById('floating-timer');
        const floatingDisplay = document.getElementById('floating-display');
        const floatingTitle = document.getElementById('floating-title');
        const floatingStart = document.getElementById('floating-start');
        const floatingPause = document.getElementById('floating-pause');
        const floatingReset = document.getElementById('floating-reset');
        const closeFloating = document.getElementById('close-floating');
        
        // Custom Input Elements
        const sessionTitleInput = document.getElementById('session-title');
        const sessionDurationInput = document.getElementById('session-duration');
        const breakDurationInput = document.getElementById('break-duration');
        const longBreakInput = document.getElementById('long-break');
        
        // Analytics Elements
        const analyticsModal = document.getElementById('analytics-modal');
        const analyticsBtn = document.getElementById('analytics-btn');

        // Analytics Functions
        function updateAnalyticsDisplay() {
            // Update streak
            const currentStreakEl = document.getElementById('current-streak');
            const longestStreakEl = document.getElementById('longest-streak');
            if (currentStreakEl) currentStreakEl.textContent = analyticsData.currentStreak;
            if (longestStreakEl) longestStreakEl.textContent = `${analyticsData.longestStreak} days`;
            
            // Update today's time
            const todayHours = Math.floor(analyticsData.todayTime / 60);
            const todayMins = analyticsData.todayTime % 60;
            const todayTimeEl = document.getElementById('today-time');
            if (todayTimeEl) todayTimeEl.textContent = `${todayHours}h ${todayMins}m`;
            
            // Update today's progress
            const todayProgress = (analyticsData.todayTime / analyticsData.dailyGoals.studyTime) * 100;
            const todayProgressEl = document.getElementById('today-progress');
            if (todayProgressEl) todayProgressEl.style.width = `${Math.min(todayProgress, 100)}%`;
            
            // Update weekly stats
            const weekHours = Math.floor(analyticsData.weekTime / 60);
            const weekMins = analyticsData.weekTime % 60;
            const weekTimeEl = document.getElementById('week-time');
            const weekSessionsEl = document.getElementById('week-sessions');
            if (weekTimeEl) weekTimeEl.textContent = `${weekHours}h ${weekMins}m`;
            if (weekSessionsEl) weekSessionsEl.textContent = analyticsData.weekSessions;
            
            const avgDaily = analyticsData.weekTime / 7;
            const avgHours = Math.floor(avgDaily / 60);
            const avgMinutes = Math.floor(avgDaily % 60);
            const avgDailyEl = document.getElementById('avg-daily');
            if (avgDailyEl) avgDailyEl.textContent = `${avgHours}h ${avgMinutes}m`;
        }

        function openAnalytics() {
            updateAnalyticsDisplay();
            analyticsModal.classList.add('show');
        }

        function closeAnalytics() {
            analyticsModal.classList.remove('show');
        }

        function addStudyTime(minutes) {
            analyticsData.todayTime += minutes;
            analyticsData.weekTime += minutes;
            
            // Check if it's a new day
            const today = new Date().toDateString();
            if (analyticsData.lastStudyDate !== today) {
                analyticsData.currentStreak++;
                analyticsData.lastStudyDate = today;
                if (analyticsData.currentStreak > analyticsData.longestStreak) {
                    analyticsData.longestStreak = analyticsData.currentStreak;
                }
            }
            
            saveAnalytics();
        }

        function saveAnalytics() {
            localStorage.setItem('studyAnalytics', JSON.stringify(analyticsData));
        }

        // Draggable Functionality
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };

        function makeDraggable(element) {
            const header = element.querySelector('.floating-timer-header');
            
            header.addEventListener('mousedown', (e) => {
                isDragging = true;
                const rect = element.getBoundingClientRect();
                dragOffset.x = e.clientX - rect.left;
                dragOffset.y = e.clientY - rect.top;
                element.style.cursor = 'grabbing';
                e.preventDefault();
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                
                const x = e.clientX - dragOffset.x;
                const y = e.clientY - dragOffset.y;
                
                // Keep within screen bounds
                const maxX = window.innerWidth - element.offsetWidth;
                const maxY = window.innerHeight - element.offsetHeight;
                
                element.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
                element.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
                element.style.right = 'auto';
                element.style.bottom = 'auto';
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
                element.style.cursor = 'move';
            });
        }

        function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }

        function updateTimerDisplay() {
            if (timerDisplay) timerDisplay.textContent = formatTime(pomodoroSeconds);
            if (floatingDisplay) floatingDisplay.textContent = formatTime(pomodoroSeconds);
        }

        function updateCustomSettings() {
            customSettings.sessionTitle = sessionTitleInput?.value || 'Focus Session';
            customSettings.sessionDuration = parseInt(sessionDurationInput?.value) || 25;
            customSettings.breakDuration = parseInt(breakDurationInput?.value) || 5;
            customSettings.longBreakDuration = parseInt(longBreakInput?.value) || 15;
            
            // Update timer info
            const timerInfoEl = document.getElementById('timer-info');
            if (timerInfoEl) {
                timerInfoEl.textContent = 
                    `${customSettings.sessionDuration}m focus • ${customSettings.breakDuration}m break • ${customSettings.longBreakDuration}m long break`;
            }
        }

        function playNotificationSound() {
            // Create a simple beep sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        }

        function showNotification(title, message) {
            if (Notification.permission === 'granted') {
                new Notification(title, {
                    body: message,
                    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%230ea5e9"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
                });
            }
            playNotificationSound();
        }

        function switchMode() {
            sessionCount++;
            
            if (currentMode === 'focus') {
                // Add completed session time to analytics
                const sessionMinutes = Math.floor((originalSeconds - pomodoroSeconds) / 60);
                addStudyTime(sessionMinutes);
                analyticsData.weekSessions++;
                
                if (sessionCount % 4 === 0) {
                    currentMode = 'longBreak';
                    pomodoroSeconds = customSettings.longBreakDuration * 60;
                    timerMode.textContent = `☕ Long Break`;
                    floatingTitle.textContent = 'Long Break';
                    showNotification('Time for a Long Break!', `Take a ${customSettings.longBreakDuration}-minute break. You've earned it!`);
                } else {
                    currentMode = 'break';
                    pomodoroSeconds = customSettings.breakDuration * 60;
                    timerMode.textContent = `🌿 Short Break`;
                    floatingTitle.textContent = 'Short Break';
                    showNotification('Time for a Break!', `Take a ${customSettings.breakDuration}-minute break to recharge.`);
                }
            } else {
                currentMode = 'focus';
                pomodoroSeconds = customSettings.sessionDuration * 60;
                originalSeconds = pomodoroSeconds;
                timerMode.textContent = `🎯 ${customSettings.sessionTitle}`;
                floatingTitle.textContent = customSettings.sessionTitle;
                showNotification('Back to Focus!', 'Time to get back to work. Stay focused!');
            }
            
            updateTimerDisplay();
            isRunning = false;
            startTimerBtn.textContent = 'Start';
            floatingStart.textContent = '▶';
            saveAnalytics();
        }

        function startPomodoro() {
            updateCustomSettings();
            
            if (isRunning) {
                clearInterval(pomodoroTimer);
                isRunning = false;
                startTimerBtn.textContent = 'Start';
                floatingStart.textContent = '▶';
            } else {
                isRunning = true;
                startTimerBtn.textContent = 'Pause';
                floatingStart.textContent = '⏸';
                
                pomodoroTimer = setInterval(() => {
                    pomodoroSeconds--;
                    updateTimerDisplay();
                    
                    if (pomodoroSeconds <= 0) {
                        clearInterval(pomodoroTimer);
                        switchMode();
                    }
                }, 1000);
            }
        }

        function resetPomodoro() {
            clearInterval(pomodoroTimer);
            isRunning = false;
            startTimerBtn.textContent = 'Start';
            floatingStart.textContent = '▶';
            
            updateCustomSettings();
            
            if (currentMode === 'focus') {
                pomodoroSeconds = customSettings.sessionDuration * 60;
                originalSeconds = pomodoroSeconds;
                timerMode.textContent = `🎯 ${customSettings.sessionTitle}`;
                floatingTitle.textContent = customSettings.sessionTitle;
            } else if (currentMode === 'break') {
                pomodoroSeconds = customSettings.breakDuration * 60;
                timerMode.textContent = '🌿 Short Break';
                floatingTitle.textContent = 'Short Break';
            } else {
                pomodoroSeconds = customSettings.longBreakDuration * 60;
                timerMode.textContent = '☕ Long Break';
                floatingTitle.textContent = 'Long Break';
            }
            
            updateTimerDisplay();
        }

        function openPomodoroModal() {
            updateCustomSettings();
            pomodoroSeconds = customSettings.sessionDuration * 60;
            originalSeconds = pomodoroSeconds;
            timerMode.textContent = `🎯 ${customSettings.sessionTitle}`;
            updateTimerDisplay();
            pomodoroModal.classList.add('show');
            
            // Request notification permission
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }

        function closePomodoroModal() {
            pomodoroModal.classList.remove('show');
        }

        function openFloatingTimer() {
            updateCustomSettings();
            floatingTitle.textContent = customSettings.sessionTitle;
            floatingTimer.classList.add('show');
            makeDraggable(floatingTimer);
            closePomodoroModal();
        }

        function closeFloatingTimer() {
            floatingTimer.classList.remove('show');
            if (isRunning) {
                clearInterval(pomodoroTimer);
                isRunning = false;
                startTimerBtn.textContent = 'Start';
                floatingStart.textContent = '▶';
            }
        }

        // Floating Timer Controls
        function floatingStartPause() {
            startPomodoro();
        }

        function floatingResetTimer() {
            resetPomodoro();
        }

        // Event Listeners
        if (pomodoroBtn) pomodoroBtn.addEventListener('click', openPomodoroModal);
        if (startTimerBtn) startTimerBtn.addEventListener('click', () => {
            startPomodoro();
            // Auto-switch to floating timer when started
            setTimeout(openFloatingTimer, 500);
        });
        if (pauseTimerBtn) pauseTimerBtn.addEventListener('click', startPomodoro);
        if (resetTimerBtn) resetTimerBtn.addEventListener('click', resetPomodoro);
        if (closePomodoroBtn) closePomodoroBtn.addEventListener('click', closePomodoroModal);

        // Floating Timer Event Listeners
        if (floatingStart) floatingStart.addEventListener('click', floatingStartPause);
        if (floatingPause) floatingPause.addEventListener('click', floatingStartPause);
        if (floatingReset) floatingReset.addEventListener('click', floatingResetTimer);
        if (closeFloating) closeFloating.addEventListener('click', closeFloatingTimer);

        // Analytics Event Listeners
        if (analyticsBtn) analyticsBtn.addEventListener('click', openAnalytics);

        // Input Change Listeners
        if (sessionTitleInput) sessionTitleInput.addEventListener('input', updateCustomSettings);
        if (sessionDurationInput) sessionDurationInput.addEventListener('input', updateCustomSettings);
        if (breakDurationInput) breakDurationInput.addEventListener('input', updateCustomSettings);
        if (longBreakInput) longBreakInput.addEventListener('input', updateCustomSettings);

        // Close modals when clicking outside
        if (pomodoroModal) {
            pomodoroModal.addEventListener('click', (e) => {
                if (e.target === pomodoroModal) {
                    closePomodoroModal();
                }
            });
        }

        if (analyticsModal) {
            analyticsModal.addEventListener('click', (e) => {
                if (e.target === analyticsModal) {
                    closeAnalytics();
                }
            });
        }

        // Initialize
        updateTimerDisplay();
        updateAnalyticsDisplay();
        
        function startStudyTimer() {
            totalSeconds = 0;
            timerInterval = setInterval(() => {
                totalSeconds++;
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;
                studyTimeEl.textContent = `${hours}h ${minutes < 10 ? '0' : ''}${minutes}m`;
            }, 1000);
        }

        // Initialize on page load
        updateUI();
        startStudyTimer();
        
        } // End of initializeApp function
