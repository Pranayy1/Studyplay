// analytics.js - Analytics and Tracking Data
import { CONFIG } from './config.js';
import { log } from './utils.js';

let analyticsData;

export function initAnalytics() {
    try {
        const stored = localStorage.getItem(CONFIG.STORAGE.ANALYTICS);
        analyticsData = stored ? JSON.parse(stored) : null;
    } catch (e) {
        log('error', 'Failed to parse analytics data: ' + e.message);
        analyticsData = null;
    }

    analyticsData = analyticsData || {
        dailyGoals: { studyTime: 300, tasks: 10, sessions: 8 },
        currentStreak: 0,
        longestStreak: 0,
        todayTime: 0,
        weekTime: 0,
        weekSessions: 0,
        totalTasks: 0,
        achievements: [
            { id: 'week_warrior', name: 'Week Warrior', desc: '7 days streak', icon: '🥇', unlocked: false },
            { id: 'speed_demon', name: 'Speed Demon', desc: '10 tasks in a day', icon: '⚡', unlocked: false }
        ],
        subjectBreakdown: {},
        weeklyHours: [0, 0, 0, 0, 0, 0, 0],
        lastStudyDate: null
    };

    function updateAnalyticsDisplay() {
        const currentStreakEl = document.getElementById('current-streak');
        const longestStreakEl = document.getElementById('longest-streak');
        if (currentStreakEl) currentStreakEl.textContent = analyticsData.currentStreak;
        if (longestStreakEl) longestStreakEl.textContent = `${analyticsData.longestStreak} days`;

        const todayHours = Math.floor(analyticsData.todayTime / 60);
        const todayMins = analyticsData.todayTime % 60;
        const todayTimeEl = document.getElementById('today-time');
        if (todayTimeEl) todayTimeEl.textContent = `${todayHours}h ${todayMins}m`;

        const todayProgress = (analyticsData.todayTime / analyticsData.dailyGoals.studyTime) * 100;
        const todayProgressEl = document.getElementById('today-progress');
        if (todayProgressEl) todayProgressEl.style.width = `${Math.min(todayProgress, 100)}%`;

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

    function addStudyTime(minutes) {
        if (minutes <= 0) return;

        analyticsData.todayTime += minutes;
        analyticsData.weekTime += minutes;

        const today = new Date().toDateString();
        if (analyticsData.lastStudyDate !== today) {
            if (analyticsData.lastStudyDate) {
                const lastDate = new Date(analyticsData.lastStudyDate);
                const todayDate = new Date();
                const diffTime = todayDate - lastDate;
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    analyticsData.currentStreak++;
                } else if (diffDays > 1) {
                    analyticsData.currentStreak = 1;
                }
            } else {
                analyticsData.currentStreak = 1;
            }

            analyticsData.lastStudyDate = today;
            if (analyticsData.currentStreak > analyticsData.longestStreak) {
                analyticsData.longestStreak = analyticsData.currentStreak;
            }
        }

        saveAnalytics();
    }

    function saveAnalytics() {
        localStorage.setItem(CONFIG.STORAGE.ANALYTICS, JSON.stringify(analyticsData));
    }

    updateAnalyticsDisplay();

    return { analyticsData, updateAnalyticsDisplay, addStudyTime, saveAnalytics };
}
