// Todo List JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initShowCompletedToggle();
    initDragAndDrop();
    initDeleteConfirmations();
});

/**
 * Initialize the show/hide completed toggle functionality
 */
function initShowCompletedToggle() {
    const showCompletedToggle = document.getElementById('show-completed-toggle');
    if (!showCompletedToggle) return;

    showCompletedToggle.addEventListener('change', function() {
        const urlParams = new URLSearchParams(window.location.search);
        if (this.checked) {
            urlParams.set('show_completed', 'true');
        } else {
            urlParams.set('show_completed', 'false');
        }
        window.location.search = urlParams.toString();
    });
}

/**
 * Initialize drag and drop functionality for reordering todos
 */
function initDragAndDrop() {
    const todoList = document.getElementById('todo-list');
    if (!todoList) return;

    let draggedElement = null;

    // Make incomplete items draggable
    document.querySelectorAll('.todo-item').forEach(item => {
        if (item.getAttribute('data-completed') === 'false') {
            item.setAttribute('draggable', 'true');
        }
    });

    todoList.addEventListener('dragstart', (e) => {
        const todoItem = e.target.closest('.todo-item');
        if (todoItem && todoItem.getAttribute('data-completed') === 'false') {
            draggedElement = todoItem;
            todoItem.style.opacity = '0.5';
        }
    });

    todoList.addEventListener('dragend', (e) => {
        const todoItem = e.target.closest('.todo-item');
        if (todoItem) {
            todoItem.style.opacity = '1';
        }
    });

    todoList.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!draggedElement) return;

        const afterElement = getDragAfterElement(todoList, e.clientY);

        // Don't allow dragging incomplete items after completed items
        if (afterElement && afterElement.getAttribute('data-completed') === 'true') {
            return;
        }

        if (afterElement == null) {
            // Check if the last element is completed
            const lastElement = todoList.lastElementChild;
            if (lastElement && lastElement.getAttribute('data-completed') === 'true') {
                return;
            }
            todoList.appendChild(draggedElement);
        } else {
            todoList.insertBefore(draggedElement, afterElement);
        }
    });

    todoList.addEventListener('drop', (e) => {
        e.preventDefault();
        saveOrder();
    });

    /**
     * Get the element that should come after the dragged element
     */
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.todo-item:not([style*="opacity: 0.5"])')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    /**
     * Save the new order to the server
     */
    function saveOrder() {
        const items = document.querySelectorAll('.todo-item');
        const todoIds = Array.from(items).map(item => parseInt(item.getAttribute('data-id')));

        const reorderUrl = todoList.getAttribute('data-reorder-url');
        const csrfToken = todoList.getAttribute('data-csrf-token');

        fetch(reorderUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({ todo_ids: todoIds })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'error') {
                alert('Error reordering todos: ' + (data.message || 'Unknown error'));
                location.reload();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            location.reload();
        });
    }
}

/**
 * Initialize delete confirmation dialogs
 */
function initDeleteConfirmations() {
    const deleteTodoButtons = document.querySelectorAll('.delete-todo-btn');
    deleteTodoButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!confirm('Are you sure you want to delete this TODO?')) {
                e.preventDefault();
            }
        });
    });
}
