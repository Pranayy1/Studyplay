// utils.js - Utility functions

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function log(level, message) {
    if (level === 'error') {
        console.error(message);
    } else if (level === 'info') {
        console.info(message);
    } else {
        console.log(message);
    }
}

export async function fetchWithExponentialBackoff(url, options, retries = 3) {
    try {
        const response = await fetch(url, options);
        if (response.status === 429 && retries > 0) {
            const delay = Math.pow(2, 3 - retries) * 1000;
            log('info', `Rate limit exceeded. Retrying in ${delay / 1000} seconds...`);
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
            log('error', `Fetch failed: ${error.message}. Retrying in ${delay / 1000} seconds...`);
            await new Promise(res => setTimeout(res, delay));
            return fetchWithExponentialBackoff(url, options, retries - 1);
        }
        throw error;
    }
}

export function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
