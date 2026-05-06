// main.js - Main initialization file
import { CONFIG, apiKey, setApiKey, ensureApiKey, apiUrl } from './config.js';
import { log, escapeHtml, fetchWithExponentialBackoff } from './utils.js';
import { initModals, showModal } from './modals.js';
import { initChatbot } from './chatbot.js';
import { initTodo } from './todo.js';
import { initAnalytics } from './analytics.js';
import { initPomodoro } from './pomodoro.js';
import { initStudyTimer } from './study-timer.js';

// Make functions available globally for inline event handlers
window.showModal = showModal;
window.ensureApiKey = ensureApiKey;
window.setApiKey = setApiKey;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize all modules
    initModals();
    initChatbot();
    const todoModule = initTodo();
    const analyticsModule = initAnalytics();
    initPomodoro();
    initStudyTimer();

    // Make analytics functions available for other modules
    window.addStudyTime = analyticsModule.addStudyTime;
    window.saveAnalytics = analyticsModule.saveAnalytics;
    window.analyticsData = analyticsModule.analyticsData;

    // Study Plan Generation
    const generatePlanBtn = document.getElementById('generate-plan-btn');
    if (generatePlanBtn) {
        generatePlanBtn.addEventListener('click', async () => {
            if (!apiKey) {
                showModal('llm-modal', 'API Configuration Required',
                    '<div class="text-center text-red-600">API key is not configured. Please add your API key to enable this feature.</div>');
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

            showModal('llm-modal', 'Generating Study Plan...',
                '<div class="text-center text-gray-500">Please wait, your personalized study plan is being generated...</div>');

            try {
                const response = await fetchWithExponentialBackoff(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();

                if (!result.candidates || !result.candidates[0] || !result.candidates[0].content || !result.candidates[0].content.parts || !result.candidates[0].content.parts[0]) {
                    throw new Error('Invalid API response format');
                }

                const planData = JSON.parse(result.candidates[0].content.parts[0].text);

                let planHtml = `<div class="p-4 bg-gray-100 rounded-lg">
                    <p class="font-semibold text-lg mb-2">Topic: ${escapeHtml(topic)}</p>
                    <p class="font-semibold text-lg">Goal: ${escapeHtml(goal)}</p>
                </div>`;

                if (planData.plan && Array.isArray(planData.plan)) {
                    planData.plan.forEach(dayPlan => {
                        if (dayPlan.day && dayPlan.focus && Array.isArray(dayPlan.tasks)) {
                            planHtml += `<div class="mt-6 border-b pb-4">
                                <h4 class="text-lg font-bold text-indigo-600">${escapeHtml(dayPlan.day)}</h4>
                                <p class="text-md font-semibold text-gray-800">${escapeHtml(dayPlan.focus)}</p>
                                <ul class="list-disc list-inside mt-2 space-y-1">`;
                            dayPlan.tasks.forEach(task => {
                                planHtml += `<li class="text-sm text-gray-600">${escapeHtml(task)}</li>`;
                            });
                            planHtml += `</ul></div>`;
                        }
                    });
                }

                showModal('llm-modal', 'Personalized Study Plan', planHtml);

            } catch (error) {
                showModal('llm-modal', 'Error',
                    `<p class="text-red-600">Failed to generate study plan. Please try again later.</p><p class="text-sm text-gray-500 mt-2">${escapeHtml(error.message)}</p>`);
                log('error', 'Error generating study plan: ' + error.message);
            }
        });
    }

    // Analytics button
    const analyticsBtn = document.getElementById('analytics-btn');
    if (analyticsBtn) {
        analyticsBtn.addEventListener('click', () => {
            const analyticsModal = document.getElementById('analytics-modal');
            if (analyticsModal) {
                analyticsModule.updateAnalyticsDisplay();
                analyticsModal.classList.add('show');
            }
        });
    }

    // Schedule Review button
    const scheduleReviewBtn = Array.from(document.querySelectorAll('.action-btn')).find(btn =>
        btn.textContent.includes('Schedule Review')
    );
    if (scheduleReviewBtn) {
        scheduleReviewBtn.addEventListener('click', () => {
            showModal('llm-modal', 'Schedule Review', `
                <div class="space-y-4">
                    <p class="text-gray-700">Schedule your study sessions for optimal learning:</p>
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <h4 class="font-semibold text-blue-800 mb-2">Tips for Effective Scheduling:</h4>
                        <ul class="list-disc list-inside text-sm text-blue-700 space-y-1">
                            <li>Study difficult subjects when you're most alert</li>
                            <li>Use Pomodoro technique (25min focus + 5min break)</li>
                            <li>Review material within 24 hours of learning</li>
                            <li>Plan breaks to avoid burnout</li>
                        </ul>
                    </div>
                    <p class="text-sm text-gray-600">Use the Pomodoro timer above to structure your study sessions!</p>
                </div>
            `);
        });
    }

    log('info', 'StudyPlay application initialized successfully');
}
