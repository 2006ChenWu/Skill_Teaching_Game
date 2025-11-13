// Drag and drop functionality
class DragDropManager {
    constructor() {
        this.draggedWord = null;
        this.init();
    }

    init() {
        this.initializeEventDelegation();
    }

    initializeEventDelegation() {
        // Single event delegation for all drag and drop events
        document.addEventListener('dragstart', this.handleDragStart.bind(this));
        document.addEventListener('dragover', this.handleDragOver.bind(this));
        document.addEventListener('dragenter', this.handleDragEnter.bind(this));
        document.addEventListener('dragleave', this.handleDragLeave.bind(this));
        document.addEventListener('drop', this.handleDrop.bind(this));
        document.addEventListener('dragend', this.handleDragEnd.bind(this));

        console.log('Drag and drop manager initialized');
    }

    handleDragStart(e) {
        if (e.target.classList.contains('word')) {
            this.draggedWord = e.target;
            e.dataTransfer.setData('text/plain', e.target.textContent);
            e.target.classList.add('dragging');
            console.log('Dragging word:', e.target.textContent);
        }
    }

    handleDragOver(e) {
        // Allow drop on any part of the category (container or its children)
        if (this.isCategoryElement(e.target)) {
            e.preventDefault(); // Necessary to allow drop
        }
    }

    handleDragEnter(e) {
        // Add drag-over style to the category container when dragging over any part of it
        const categoryElement = this.getCategoryContainer(e.target);
        if (categoryElement) {
            e.preventDefault();
            categoryElement.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        // Remove drag-over style when leaving the category container
        const categoryElement = this.getCategoryContainer(e.target);
        if (categoryElement && !categoryElement.contains(e.relatedTarget)) {
            categoryElement.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        // Allow drop on any part of the category
        const categoryElement = this.getCategoryContainer(e.target);
        if (categoryElement && this.draggedWord) {
            e.preventDefault();
            categoryElement.classList.remove('drag-over');
            
            const word = this.draggedWord.textContent;
            const categoryId = categoryElement.getAttribute('data-category-id');
            
            console.log('Dropped word:', word, 'into category:', categoryId);
            
            if (window.app && categoryId) {
                // Pass the dragged word element to the verification function
                window.app.verifyClassification(word, categoryId, this.draggedWord);
            } else {
                console.error('App not initialized or category ID missing');
            }
            
            // Reset dragged word reference
            this.draggedWord = null;
        }
    }

    handleDragEnd(e) {
        // Clean up dragging state for all words
        const words = document.querySelectorAll('.word');
        words.forEach(word => {
            word.classList.remove('dragging');
        });
        
        // Remove drag-over style from all categories
        const categories = document.querySelectorAll('.category');
        categories.forEach(category => {
            category.classList.remove('drag-over');
        });
        
        this.draggedWord = null;
    }

    // Helper function to check if element is part of a category
    isCategoryElement(element) {
        return element.classList.contains('category') || 
               element.classList.contains('classified-words') ||
               element.classList.contains('classified-word') ||
               element.closest('.category');
    }

    // Helper function to get the category container from any child element
    getCategoryContainer(element) {
        if (element.classList.contains('category')) {
            return element;
        }
        return element.closest('.category');
    }
}

// Initialize drag and drop manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dragDropManager = new DragDropManager();
});