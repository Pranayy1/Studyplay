// study-timer.js - Study timer functionality

let studyTimerInterval = null;
let totalSeconds = 0;

export function initStudyTimer() {
    const studyTimeEl = document.getElementById('study-time');

    function startStudyTimer() {
        if (studyTimerInterval) return;

        studyTimerInterval = setInterval(() => {
            if (document.hidden) return;

            totalSeconds++;
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            if (studyTimeEl) {
                studyTimeEl.textContent = `${hours}h ${minutes.toString().padStart(2, '0')}m`;
            }
        }, 1000);
    }

    function stopStudyTimer() {
        if (studyTimerInterval) {
            clearInterval(studyTimerInterval);
            studyTimerInterval = null;
        }
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopStudyTimer();
        } else {
            startStudyTimer();
        }
    });

    if (studyTimeEl) studyTimeEl.textContent = '0h 00m';
    startStudyTimer();

    return { totalSeconds, startStudyTimer, stopStudyTimer };
}
