// pomodoro.js - Pomodoro Timer Functionality
import { CONFIG } from './config.js';
import { log, formatTime as fmtTime } from './utils.js';

let pomodoroSeconds = 1500;
let originalSeconds = 1500;
let isRunning = false;
let sessionCount = 0;
let currentMode = 'focus';
let pomodoroTimer;

const customSettings = {
    sessionDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionTitle: 'Focus Session'
};

export function initPomodoro() {
    const pomodoroModal = document.getElementById('pomodoro-modal');
    const timerDisplay = document.getElementById('timer-display');
    const timerMode = document.getElementById('timer-mode');
    const startTimerBtn = document.getElementById('start-timer');
    const pauseTimerBtn = document.getElementById('pause-timer');
    const resetTimerBtn = document.getElementById('reset-timer');
    const closePomodoroBtn = document.getElementById('close-pomodoro');
    const pomodoroBtn = document.getElementById('pomodoro-btn');

    const floatingTimer = document.getElementById('floating-timer');
    const floatingDisplay = document.getElementById('floating-display');
    const floatingTitle = document.getElementById('floating-title');
    const floatingStart = document.getElementById('floating-start');
    const floatingPause = document.getElementById('floating-pause');
    const floatingReset = document.getElementById('floating-reset');
    const closeFloating = document.getElementById('close-floating');

    const sessionTitleInput = document.getElementById('session-title');
    const sessionDurationInput = document.getElementById('session-duration');
    const breakDurationInput = document.getElementById('break-duration');
    const longBreakInput = document.getElementById('long-break');

    function updateTimerDisplay() {
        const t = fmtTime(pomodoroSeconds);
        if (timerDisplay) timerDisplay.textContent = t;
        if (floatingDisplay) floatingDisplay.textContent = t;
    }

    function updateCustomSettings() {
        const title = sessionTitleInput?.value?.trim() || 'Focus Session';
        customSettings.sessionTitle = title.substring(0, CONFIG.LIMITS.MAX_TITLE_LENGTH);

        const sessionDur = parseInt(sessionDurationInput?.value);
        customSettings.sessionDuration = (!isNaN(sessionDur) &&
            sessionDur >= CONFIG.LIMITS.MIN_SESSION_DURATION &&
            sessionDur <= CONFIG.LIMITS.MAX_SESSION_DURATION) ? sessionDur : CONFIG.POMODORO.DEFAULT_SESSION;

        const breakDur = parseInt(breakDurationInput?.value);
        customSettings.breakDuration = (!isNaN(breakDur) && breakDur >= 1 && breakDur <= 30) ? breakDur : CONFIG.POMODORO.DEFAULT_BREAK;

        const longBreak = parseInt(longBreakInput?.value);
        customSettings.longBreakDuration = (!isNaN(longBreak) && longBreak >= 5 && longBreak <= 60) ? longBreak : CONFIG.POMODORO.DEFAULT_LONG_BREAK;

        const timerInfoEl = document.getElementById('timer-info');
        if (timerInfoEl) {
            timerInfoEl.textContent =
                `${customSettings.sessionDuration}m focus • ${customSettings.breakDuration}m break • ${customSettings.longBreakDuration}m long break`;
        }
    }

    function playNotificationSound() {
        try {
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
        } catch (e) {
            log('error', 'Failed to play notification sound: ' + e.message);
        }
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
            const elapsedSeconds = originalSeconds - Math.max(0, pomodoroSeconds);
            const sessionMinutes = Math.floor(elapsedSeconds / 60);
            if (sessionMinutes > 0 && typeof window.addStudyTime === 'function') {
                window.addStudyTime(sessionMinutes);
            }
            if (typeof window.analyticsData !== 'undefined' && window.analyticsData) {
                window.analyticsData.weekSessions++;
            }

            if (sessionCount % CONFIG.POMODORO.SESSIONS_BEFORE_LONG_BREAK === 0) {
                currentMode = 'longBreak';
                pomodoroSeconds = customSettings.longBreakDuration * 60;
                if (timerMode) timerMode.textContent = '☕ Long Break';
                if (floatingTitle) floatingTitle.textContent = 'Long Break';
                showNotification('Time for a Long Break!', `Take a ${customSettings.longBreakDuration}-minute break. You've earned it!`);
            } else {
                currentMode = 'break';
                pomodoroSeconds = customSettings.breakDuration * 60;
                if (timerMode) timerMode.textContent = '🌿 Short Break';
                if (floatingTitle) floatingTitle.textContent = 'Short Break';
                showNotification('Time for a Break!', `Take a ${customSettings.breakDuration}-minute break to recharge.`);
            }
        } else {
            currentMode = 'focus';
            pomodoroSeconds = customSettings.sessionDuration * 60;
            originalSeconds = pomodoroSeconds;
            if (timerMode) timerMode.textContent = `🎯 ${customSettings.sessionTitle}`;
            if (floatingTitle) floatingTitle.textContent = customSettings.sessionTitle;
            showNotification('Back to Focus!', 'Time to get back to work. Stay focused!');
        }

        updateTimerDisplay();
        isRunning = false;
        if (startTimerBtn) startTimerBtn.textContent = 'Start';
        if (floatingStart) floatingStart.textContent = '▶';
        if (typeof window.saveAnalytics === 'function') window.saveAnalytics();
    }

    function startPomodoro() {
        updateCustomSettings();
        if (isRunning) return;
        isRunning = true;
        openFloatingTimer();
        if (startTimerBtn) startTimerBtn.textContent = 'Pause';
        if (floatingStart) floatingStart.textContent = '⏸';

        pomodoroTimer = setInterval(() => {
            pomodoroSeconds--;
            updateTimerDisplay();

            if (pomodoroSeconds <= 0) {
                clearInterval(pomodoroTimer);
                isRunning = false;
                switchMode();
            }
        }, 1000);
    }

    function pausePomodoro() {
        if (!isRunning) return;
        clearInterval(pomodoroTimer);
        isRunning = false;
        if (startTimerBtn) startTimerBtn.textContent = 'Start';
        if (floatingStart) floatingStart.textContent = '▶';
    }

    function resetPomodoro() {
        stopTimer();

        updateCustomSettings();

        if (currentMode === 'focus') {
            pomodoroSeconds = customSettings.sessionDuration * 60;
            originalSeconds = pomodoroSeconds;
            if (timerMode) timerMode.textContent = `🎯 ${customSettings.sessionTitle}`;
            if (floatingTitle) floatingTitle.textContent = customSettings.sessionTitle;
        } else if (currentMode === 'break') {
            pomodoroSeconds = customSettings.breakDuration * 60;
            if (timerMode) timerMode.textContent = '🌿 Short Break';
            if (floatingTitle) floatingTitle.textContent = 'Short Break';
        } else {
            pomodoroSeconds = customSettings.longBreakDuration * 60;
            if (timerMode) timerMode.textContent = '☕ Long Break';
            if (floatingTitle) floatingTitle.textContent = 'Long Break';
        }

        updateTimerDisplay();
    }

    function openPomodoroModal() {
        if (floatingTimer) floatingTimer.classList.remove('show');
        updateCustomSettings();
        stopTimer();
        pomodoroSeconds = customSettings.sessionDuration * 60;
        originalSeconds = pomodoroSeconds;
        if (timerMode) timerMode.textContent = `🎯 ${customSettings.sessionTitle}`;
        updateTimerDisplay();
        if (pomodoroModal) pomodoroModal.classList.add('show');

        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    function closePomodoroModal() {
        stopTimer();
        if (floatingTimer) floatingTimer.classList.remove('show');
        if (pomodoroModal) pomodoroModal.classList.remove('show');
    }

    function openFloatingTimer() {
        updateCustomSettings();
        if (floatingTitle) floatingTitle.textContent = customSettings.sessionTitle;
        if (floatingTimer) floatingTimer.classList.add('show');
        if (pomodoroModal) pomodoroModal.classList.remove('show');
    }

    function stopTimer() {
        clearInterval(pomodoroTimer);
        isRunning = false;
        if (startTimerBtn) startTimerBtn.textContent = 'Start';
        if (floatingStart) floatingStart.textContent = '▶';
    }

    function closeFloatingTimer() {
        stopTimer();
        if (floatingTimer) floatingTimer.classList.remove('show');
    }

    function makeDraggable(element) {
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        let mouseMoveHandler = null;

        const header = element.querySelector('.floating-timer-header');
        if (!header) return;

        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = element.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            element.style.cursor = 'grabbing';
            e.preventDefault();

            mouseMoveHandler = (e) => {
                if (!isDragging) return;

                const x = e.clientX - dragOffset.x;
                const y = e.clientY - dragOffset.y;

                const maxX = window.innerWidth - element.offsetWidth;
                const maxY = window.innerHeight - element.offsetHeight;

                element.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
                element.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
                element.style.right = 'auto';
                element.style.bottom = 'auto';
            };

            document.addEventListener('mousemove', mouseMoveHandler);
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            element.style.cursor = 'move';
            if (mouseMoveHandler) {
                document.removeEventListener('mousemove', mouseMoveHandler);
                mouseMoveHandler = null;
            }
        });
    }

    // Event Listeners
    if (pomodoroBtn) pomodoroBtn.addEventListener('click', openPomodoroModal);
    if (startTimerBtn) startTimerBtn.addEventListener('click', startPomodoro);
    if (pauseTimerBtn) pauseTimerBtn.addEventListener('click', pausePomodoro);
    if (resetTimerBtn) resetTimerBtn.addEventListener('click', resetPomodoro);
    if (closePomodoroBtn) closePomodoroBtn.addEventListener('click', closePomodoroModal);

    if (floatingStart) floatingStart.addEventListener('click', startPomodoro);
    if (floatingPause) floatingPause.addEventListener('click', pausePomodoro);
    if (floatingReset) floatingReset.addEventListener('click', resetPomodoro);
    if (closeFloating) closeFloating.addEventListener('click', closeFloatingTimer);

    if (sessionTitleInput) sessionTitleInput.addEventListener('input', updateCustomSettings);
    if (sessionDurationInput) sessionDurationInput.addEventListener('input', updateCustomSettings);
    if (breakDurationInput) breakDurationInput.addEventListener('input', updateCustomSettings);
    if (longBreakInput) longBreakInput.addEventListener('input', updateCustomSettings);

    if (floatingTimer) {
        makeDraggable(floatingTimer);
    }

    updateTimerDisplay();
    updateCustomSettings();

    return { openPomodoroModal, closePomodoroModal, startPomodoro, resetPomodoro };
}
