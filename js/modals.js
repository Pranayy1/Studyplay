// modals.js - Modal management

const MODAL_SELECTORS = {
    'llm-modal': {
        title: '#modal-title',
        body: '#modal-content-body'
    },
    'analytics-modal': {
        title: '.modal-header h2',
        body: '.modal-body'
    },
    'pomodoro-modal': {
        title: '.timer-mode',
        body: '.pomodoro-container'
    }
};

export function showModal(modalId, title, content) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`Modal #${modalId} not found`);
        return;
    }

    const selectors = MODAL_SELECTORS[modalId];
    let modalTitle, modalBody;

    if (selectors) {
        modalTitle = modal.querySelector(selectors.title) || document.getElementById('modal-title');
        modalBody = modal.querySelector(selectors.body) || document.getElementById('modal-content-body');
    } else {
        modalTitle = modal.querySelector('.modal-title') || document.getElementById('modal-title');
        modalBody = modal.querySelector('.modal-body') || document.getElementById('modal-content-body');
    }

    if (!modalTitle || !modalBody) {
        console.error(`Title or body element not found in modal #${modalId}`);
        return;
    }

    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    modal.classList.add('show');
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

export function closeAnalytics() {
    closeModal('analytics-modal');
}

export function openAnalytics() {
    const analyticsModal = document.getElementById('analytics-modal');
    if (analyticsModal) {
        analyticsModal.classList.add('show');
    }
}

export function setupModalClickOutside(modalId, closeFunction) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeFunction();
            }
        });
    }
}

export function initModals() {
    window.onclick = function(event) {
        const modal = document.getElementById('llm-modal');
        if (event.target == modal) {
            closeModal('llm-modal');
        }
    };

    setupModalClickOutside('pomodoro-modal', () => closeModal('pomodoro-modal'));
    setupModalClickOutside('analytics-modal', closeAnalytics);

    window.closeModal = () => closeModal('llm-modal');
    window.closeAnalytics = closeAnalytics;
}
