let draggedElement = null;

//start drag
function handleDragStart(e) {
  draggedElement = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
}

//end drag
function handleDragEnd() {
  this.classList.remove('dragging');
  draggedElement = null;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  return false;
}

//
function handleDrop(e) {
  e.stopPropagation();
  e.preventDefault();
  
  if (draggedElement) {
    const slot = e.target.closest('.slot');
    if (slot && slot.children.length === 0) {
      slot.appendChild(draggedElement);
      draggedElement.classList.remove('dragging');
    }
  }
  
  return false;
}

// listen: DragStart and DragEnd
function addDragEvents(element) {
  element.addEventListener('dragstart', handleDragStart);
  element.addEventListener('dragend', handleDragEnd);
}

// listen: DragOver and DragEnd
function addDropEvents(targetElement) {
  targetElement.addEventListener('dragover', handleDragOver);
  targetElement.addEventListener('drop', handleDrop);
}