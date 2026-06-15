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
            li.className = 'todo-item' + (todo.completed ? ' completed' : '');
            if (currentGoalIndex === i) li.style.borderLeft = '3px solid var(--primary)';
            li.dataset.index = i;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'todo-checkbox';
            checkbox.checked = todo.completed;
            checkbox.onclick = () => toggleTodo(i);

            const span = document.createElement('span');
            span.textContent = todo.text;

            const btnGroup = document.createElement('div');
            btnGroup.style.cssText = 'display:flex;gap:4px;flex-shrink:0;';

            const setGoalBtn = document.createElement('button');
            setGoalBtn.innerHTML = currentGoalIndex === i ? '⭐' : '☆';
            setGoalBtn.className = 'todo-star';
            setGoalBtn.title = currentGoalIndex === i ? 'Current goal' : 'Set as goal';
            setGoalBtn.onclick = () => setGoal(i);

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '✕';
            deleteBtn.className = 'todo-delete';
            deleteBtn.title = 'Delete task';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deleteTodo(i);
            };

            btnGroup.appendChild(setGoalBtn);
            btnGroup.appendChild(deleteBtn);

            li.appendChild(checkbox);
            li.appendChild(span);
            li.appendChild(btnGroup);
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
        currentGoalIndex = currentGoalIndex === index ? null : index;
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

    function deleteTodo(index) {
        if (index >= 0 && index < todos.length) {
            todos.splice(index, 1);
            if (currentGoalIndex === index) {
                currentGoalIndex = null;
            } else if (currentGoalIndex !== null && index < currentGoalIndex) {
                currentGoalIndex--;
            }
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

    return { updateUI, setGoal, addTodo, toggleTodo, deleteTodo, getTodos: () => todos };
}
