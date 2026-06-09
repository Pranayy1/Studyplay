let totalSeconds = 0;
let studyTimerInterval = null;

export function initStudyTimer() {
    const studyTimeEl = document.getElementById('study-time');

    const savedTime = localStorage.getItem('studyTimeSeconds');
    const savedDate = localStorage.getItem('studyTimeDate');
    const today = new Date().toDateString();

    if (savedTime && savedDate === today) {
        totalSeconds = parseInt(savedTime, 10);
    }

    function saveTime() {
        localStorage.setItem('studyTimeSeconds', totalSeconds.toString());
        localStorage.setItem('studyTimeDate', today);
    }

    function updateDisplay() {
        if (!studyTimeEl) return;
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        studyTimeEl.textContent = `${h}h ${String(m).padStart(2, '0')}m`;
    }

    let last = Date.now();
    studyTimerInterval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - last) / 1000);
        if (elapsed >= 1) {
            totalSeconds += elapsed;
            last = now;
            updateDisplay();
            saveTime();
        }
    }, 1000);

    updateDisplay();

    return {
        get totalSeconds() { return totalSeconds; },
        stop: () => { clearInterval(studyTimerInterval); studyTimerInterval = null; }
    };
}
