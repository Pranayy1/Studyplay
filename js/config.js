// config.js - Configuration and constants
const CONFIG = {
    API: {
        BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models/',
        MODEL: 'gemini-2.5-flash-preview-05-20',
        STORAGE_KEY: 'gemini_api_key'
    },
    POMODORO: {
        DEFAULT_SESSION: 25,
        DEFAULT_BREAK: 5,
        DEFAULT_LONG_BREAK: 15,
        SESSIONS_BEFORE_LONG_BREAK: 4
    },
    STORAGE: {
        TODOS: 'studyTodos',
        CURRENT_GOAL: 'studyCurrentGoal',
        ANALYTICS: 'studyAnalytics'
    },
    LIMITS: {
        MAX_TODO_LENGTH: 200,
        MAX_TITLE_LENGTH: 50,
        MAX_SESSION_DURATION: 120,
        MIN_SESSION_DURATION: 1
    }
};

// API Configuration
let apiKey = localStorage.getItem(CONFIG.API.STORAGE_KEY);

function getApiUrl() {
    return apiKey ? `${CONFIG.API.BASE_URL}${CONFIG.API.MODEL}:generateContent?key=${apiKey}` : null;
}

function getApiKey() {
    return apiKey;
}

function setApiKey(key) {
    const trimmedKey = key.trim();
    if (trimmedKey) {
        localStorage.setItem(CONFIG.API.STORAGE_KEY, trimmedKey);
        apiKey = trimmedKey;
        const apiKeyModal = document.getElementById('api-key-modal');
        if (apiKeyModal) {
            apiKeyModal.classList.remove('show');
        }
        return true;
    }
    return false;
}

function ensureApiKey() {
    if (!apiKey) {
        const apiKeyModal = document.getElementById('api-key-modal');
        if (apiKeyModal) {
            apiKeyModal.classList.add('show');
        }
        return false;
    }
    return true;
}

export { CONFIG, getApiKey, getApiUrl, setApiKey, ensureApiKey };
