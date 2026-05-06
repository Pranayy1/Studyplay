// todo.js - To-Do List and Goal Functionality
import { CONFIG } from './config.js';
import { log } from './utils.js';

let todos = [];
let currentGoalIndex = null;

export function initTodo() {
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

    try {
        const savedTodos = localStorage.getItem(CONFIG.STORAGE.TODOS);
        if (savedTodos) {
            todos = JSON.parse(savedTodos) || [];
        }
        const savedGoal = localStorage.getItem(CONFIG.STORAGE.CURRENT_GOAL);
        if (savedGoal !== null) {
            currentGoalIndex = JSON.parse(savedGoal);
        }
    } catch (e) {
        log('error', 'Failed to load todos: ' + e.message);
    }

    function updateUI() {
        if (!todoList) return;

        todoList.innerHTML = '';

        todos.forEach((todo, i) => {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between p-3 rounded-2xl glass-strong transition duration-300 ease-in-out hover:bg-white hover:bg-opacity-20';
            li.dataset.index = i;

            const leftDiv = document.createElement('div');
            leftDiv.className = 'flex items-center space-x-3';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = todo.completed;
            checkbox.className = 'w-5 h-5 text-sky-500 bg-white bg-opacity-20 border-2 border-sky-400 rounded cursor-pointer focus:ring-2 focus:ring-sky-500';
            checkbox.onclick = () => toggleTodo(i);

            const span = document.createElement('span');
            span.textContent = todo.text;
            span.className = `flex-grow text-slate-800 ${todo.completed ? 'line-through text-opacity-60' : ''}`;

            leftDiv.appendChild(checkbox);
            leftDiv.appendChild(span);
            li.appendChild(leftDiv);

            const setGoalBtn = document.createElement('button');
            setGoalBtn.textContent = 'Set Goal';
            setGoalBtn.className = 'bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-full hover:from-sky-600 hover:to-blue-700 transition duration-300 transform hover:scale-105';
            setGoalBtn.onclick = () => setGoal(i);
            li.appendChild(setGoalBtn);

            todoList.appendChild(li);
        });

        const completedCount = todos.filter(t => t.completed).length;
        const totalGoals = todos.length;

        if (goalsCompletedEl) goalsCompletedEl.textContent = `${completedCount}/${totalGoals}`;
        if (completionRateEl) {
            const completionRate = totalGoals > 0 ? Math.round((completedCount / totalGoals) * 100) : 0;
            completionRateEl.textContent = `${completionRate}% completion rate`;
        }

        if (currentGoalIndex !== null && todos[currentGoalIndex]) {
            const currentGoal = todos[currentGoalIndex];
            if (goalTitleEl) goalTitleEl.textContent = currentGoal.text;
            if (goalDescriptionEl) goalDescriptionEl.textContent = 'Currently tracking this goal.';

            const progress = currentGoal.completed ? 100 : 0;
            if (goalProgressFillEl) {
                goalProgressFillEl.style.width = `${progress}%`;
                goalProgressFillEl.style.backgroundColor = currentGoal.completed ? '#10B981' : '#3b82f6';
            }
            if (goalProgressTextEl) goalProgressTextEl.textContent = `Progress: ${progress}%`;

            if (goalStatusEl) {
                goalStatusEl.textContent = currentGoal.completed ? 'Completed' : 'In Progress';
                goalStatusEl.className = `text-sm font-medium px-3 py-1 rounded-full glass-strong ${currentGoal.completed ? 'text-green-600' : 'text-blue-600'}`;
            }
        } else {
            if (goalTitleEl) goalTitleEl.textContent = 'No Goal Set';
            if (goalDescriptionEl) goalDescriptionEl.textContent = 'Select a task from your to-do list to set a goal.';
            if (goalProgressFillEl) {
                goalProgressFillEl.style.width = '0%';
                goalProgressFillEl.style.backgroundColor = '#e2e8f0';
            }
            if (goalProgressTextEl) goalProgressTextEl.textContent = '';
            if (goalStatusEl) {
                goalStatusEl.textContent = 'No Goal Set';
                goalStatusEl.className = 'text-sm font-medium px-3 py-1 rounded-full glass-strong text-gray-600';
            }
        }
    }

    function setGoal(index) {
        currentGoalIndex = index;
        updateUI();
        saveTodos();
    }

    function addTodo() {
        const text = todoInput?.value.trim();
        if (!text || text.length === 0) return;
        if (text.length > CONFIG.LIMITS.MAX_TODO_LENGTH) {
            console.warn('Task is too long. Please keep it under 200 characters.');
            return;
        }
        todos.push({ text, completed: false });
        if (todoInput) todoInput.value = '';
        updateUI();
        saveTodos();
    }

    function toggleTodo(index) {
        if (index >= 0 && index < todos.length) {
            todos[index].completed = !todos[index].completed;
            updateUI();
            saveTodos();
        }
    }

    function saveTodos() {
        try {
            localStorage.setItem(CONFIG.STORAGE.TODOS, JSON.stringify(todos));
            localStorage.setItem(CONFIG.STORAGE.CURRENT_GOAL, JSON.stringify(currentGoalIndex));
        } catch (e) {
            log('error', 'Failed to save todos: ' + e.message);
        }
    }

    if (addTodoBtn) addTodoBtn.addEventListener('click', addTodo);
    if (todoInput) todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });

    updateUI();

    return { updateUI, setGoal, addTodo, toggleTodo, getTodos: () => todos };
}
