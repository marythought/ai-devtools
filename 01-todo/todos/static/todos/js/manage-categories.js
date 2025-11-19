// Manage Categories JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initCategoryDragAndDrop();
    initDeleteConfirmations();
});

/**
 * Initialize drag and drop functionality for reordering categories
 */
function initCategoryDragAndDrop() {
    const categoryList = document.getElementById('category-list');
    if (!categoryList) return;

    let draggedElement = null;

    // Make items draggable
    document.querySelectorAll('.category-item').forEach(item => {
        item.setAttribute('draggable', 'true');
    });

    categoryList.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('category-item')) {
            draggedElement = e.target;
            e.target.style.opacity = '0.5';
        }
    });

    categoryList.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('category-item')) {
            e.target.style.opacity = '1';
        }
    });

    categoryList.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(categoryList, e.clientY);
        if (afterElement == null) {
            categoryList.appendChild(draggedElement);
        } else {
            categoryList.insertBefore(draggedElement, afterElement);
        }
    });

    categoryList.addEventListener('drop', (e) => {
        e.preventDefault();
        saveOrder();
    });

    /**
     * Get the element that should come after the dragged element
     */
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.category-item:not(.dragging)')];

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
        const items = document.querySelectorAll('.category-item');
        const categoryIds = Array.from(items).map(item => item.getAttribute('data-id'));

        const reorderUrl = categoryList.getAttribute('data-reorder-url');
        const csrfToken = categoryList.getAttribute('data-csrf-token');

        fetch(reorderUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({ category_ids: categoryIds })
        })
        .catch(error => {
            console.error('Error reordering categories:', error);
        });
    }
}

/**
 * Initialize delete confirmation dialogs
 */
function initDeleteConfirmations() {
    const deleteButtons = document.querySelectorAll('.delete-category-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!confirm('Are you sure you want to delete this category? This will not delete the TODOs.')) {
                e.preventDefault();
            }
        });
    });

    const deleteTodoButtons = document.querySelectorAll('.delete-todo-btn');
    deleteTodoButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!confirm('Are you sure you want to delete this TODO?')) {
                e.preventDefault();
            }
        });
    });
}
