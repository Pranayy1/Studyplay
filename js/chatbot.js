// chatbot.js - Chatbot functionality
import { getApiKey, ensureApiKey, getApiUrl } from './config.js';
import { log, fetchWithExponentialBackoff } from './utils.js';

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

export function initChatbot() {
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
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function sendMessage() {
        const message = chatInput?.value.trim();
        if (!message || !message.length) return;

        const currentApiKey = getApiKey();
        if (!currentApiKey) {
            addMessage('API key is not configured. Please add your API key to enable chat functionality.', 'bot');
            return;
        }

        addMessage(message, 'user');
        if (chatInput) chatInput.value = '';

        const loadingDots = document.createElement('div');
        loadingDots.classList.add('loading-dots', 'bot-message');
        loadingDots.innerHTML = '<div></div><div></div><div></div>';
        chatMessages.appendChild(loadingDots);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const fullMessage = `${CHATBOT_INSTRUCTIONS}\n\nUser question: ${message}`;

            const payload = {
                contents: [{ parts: [{ text: fullMessage }] }]
            };

            const currentApiUrl = getApiUrl();
            const response = await fetchWithExponentialBackoff(currentApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (!result.candidates || !result.candidates[0] || !result.candidates[0].content || !result.candidates[0].content.parts || !result.candidates[0].content.parts[0]) {
                throw new Error('Invalid API response format');
            }

            const botResponse = result.candidates[0].content.parts[0].text;

            chatMessages.removeChild(loadingDots);
            addMessage(botResponse, 'bot');
        } catch (error) {
            chatMessages.removeChild(loadingDots);
            addMessage('Sorry, I am unable to provide a response at this time.', 'bot');
            log('error', 'Error in chatbot API call: ' + error.message);
        }
    }

    if (chatSendBtn) chatSendBtn.addEventListener('click', sendMessage);
    if (chatInput) chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    window.toggleChatbot = toggleChatbot;
}
