const API_BASE_URL = 'http://localhost:4001/api';
let currentLevelId = 1;
let currentLevelData = null;
let currentActiveWord = null;
let currentWordDirection = null;
let currentCellIndex = 0;
let levelHistory = [];
let completedLevels = new Set(); 


const boardEl = document.getElementById('board');
const acrossCluesEl = document.getElementById('across-clues');
const downCluesEl = document.getElementById('down-clues');
const verifyBtn = document.getElementById('verify-btn');
const nextLevelBtn = document.getElementById('next-level-btn');
const currentLevelEl = document.getElementById('current-level');
const levelThemeEl = document.getElementById('level-theme');
const levelDifficultyEl = document.getElementById('level-difficulty');
const successModal = document.getElementById('success-modal');
const successLevelEl = document.getElementById('success-level');
const modalNextBtn = document.getElementById('modal-next-btn');
const prevLevelBtn = document.getElementById('prev-level-btn');
const backToDirectoryBtn = document.getElementById('back-to-directory-btn');


async function init() {
  await loadLevel(currentLevelId);
  bindEvents();
}


async function loadLevel(levelId) {
  try {
    const response = await fetch(`${API_BASE_URL}/level/${levelId}`);
    if (!response.ok) throw new Error('Level not found');
    
    currentLevelData = await response.json();
    console.log('Level data loaded successfully:', currentLevelData);

    if (levelId !== currentLevelId) {
      levelHistory.push(currentLevelId);
    }

    currentLevelId = levelId;
    

    currentLevelEl.textContent = currentLevelId;
    levelThemeEl.textContent = currentLevelData.theme;
    levelDifficultyEl.textContent = currentLevelData.difficulty;
    

    renderBoard();
    renderClues();
    

    successModal.style.display = 'none';
    currentActiveWord = null;
    currentWordDirection = null;
    currentCellIndex = 0;


     nextLevelBtn.disabled = !completedLevels.has(currentLevelId);
    

    if (levelId > 1) {
      prevLevelBtn.style.display = 'inline-block';
    } else {
      prevLevelBtn.style.display = 'none';
    }
    
  } catch (error) {
    console.error('Failed to load level:', error);
    alert('Failed to load level: ' + error.message);
  }
}


function loadPreviousLevel() {
  if (levelHistory.length > 0) {

    const previousLevel = levelHistory.pop();
    loadLevel(previousLevel);
  } else if (currentLevelId > 1) {
    loadLevel(currentLevelId - 1);
  }
}


function loadNextLevel() {
  loadLevel(currentLevelId + 1);
}

function backToDirectory() {

  window.location.href = 'http://localhost:3000';
}


function renderBoard() {
  const { board, words } = currentLevelData;
  

  boardEl.innerHTML = '';
  
 
  const offsetX = -board.bounds.minX;
  const offsetY = -board.bounds.minY;
  

  boardEl.style.gridTemplateRows = `repeat(${board.height}, 40px)`;
  boardEl.style.gridTemplateColumns = `repeat(${board.width}, 40px)`;
  
 
  for (let y = board.bounds.minY; y <= board.bounds.maxY; y++) {
    for (let x = board.bounds.minX; x <= board.bounds.maxX; x++) {
      const cellKey = `${x},${y}`;
      const cellData = board.cells.find(cell => cell.x === x && cell.y === y);
      
      const cellContainer = document.createElement('div');
      cellContainer.className = 'cell-container';
      
      const cell = document.createElement('input');
      cell.type = 'text';
      cell.maxLength = 1;
      cell.className = 'cell';
      
      if (cellData) {
        cell.dataset.x = x;
        cell.dataset.y = y;
        cell.dataset.cellKey = cellKey;
        cell.dataset.wordIds = cellData.wordIds.join(',');
        cell.dataset.isCross = cellData.isCross;
        
        const startWordIds = [];
        words.forEach(word => {
          if (word.startPos.x === x && word.startPos.y === y) {
            startWordIds.push(word.id);
          }
        });
        
        if (startWordIds.length > 0) {
          cell.dataset.startWordIds = startWordIds.join(',');

          const numberLabel = document.createElement('div');
          numberLabel.className = 'word-number';
          numberLabel.textContent = startWordIds.join('/');
          cellContainer.appendChild(numberLabel);
        }
      } else {

        cell.disabled = true;
        cell.style.backgroundColor = '#f0f0f0';
        cell.style.visibility = 'hidden';
      }
      

      const gridRow = y + offsetY + 1;
      const gridCol = x + offsetX + 1;
      cellContainer.style.gridRow = gridRow;
      cellContainer.style.gridColumn = gridCol;
      
      cellContainer.appendChild(cell);
      boardEl.appendChild(cellContainer);
    }
  }
}


function renderClues() {
  const { words } = currentLevelData;
  acrossCluesEl.innerHTML = '';
  downCluesEl.innerHTML = '';
  
  words.forEach(word => {
    const li = document.createElement('li');
    li.textContent = `${word.direction === 'Across' ? 'Across ' : 'Down '}${word.id}. ${word.clue}`;
    li.dataset.wordId = word.id;
    li.dataset.direction = word.direction;
    
    li.addEventListener('click', () => {
      highlightWordCells(word.id);
      activateWordInput(word.id, word.direction);
    });
    
    if (word.direction === 'Across') {
      acrossCluesEl.appendChild(li);
    } else {
      downCluesEl.appendChild(li);
    }
  });
}


function highlightWordCells(wordId) {
  document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('highlighted'));
  document.querySelectorAll('.clues-section li').forEach(li => li.classList.remove('active'));
  
  document.querySelectorAll('.cell').forEach(cell => {
    const wordIds = cell.dataset.wordIds;
    if (wordIds && wordIds.split(',').includes(wordId.toString())) {
      cell.classList.add('highlighted');
    }
  });
  
  const clueItem = document.querySelector(`.clues-section li[data-word-id="${wordId}"]`);
  if (clueItem) {
    clueItem.classList.add('active');
  }
}

function activateWordInput(wordId, direction) {
  const { words } = currentLevelData;
  const word = words.find(w => w.id === wordId);
  
  if (!word) return;
  
  currentActiveWord = wordId;
  currentWordDirection = direction;
  currentCellIndex = 0;
  
  const wordCells = [];
  for (let i = 0; i < word.length; i++) {
    const x = direction === 'Across' ? word.startPos.x + i : word.startPos.x;
    const y = direction === 'Down' ? word.startPos.y + i : word.startPos.y;
    const cellKey = `${x},${y}`;
    const cell = document.querySelector(`[data-cell-key="${cellKey}"]`);
    if (cell) {
      wordCells.push(cell);
    }
  }
  
  if (wordCells.length > 0) {
    wordCells[0].focus();
    wordCells.forEach((cell, index) => {
      cell.dataset.wordIndex = index;
    });
  }
}


function handleCellInput(event) {
  const cell = event.target;
  const wordIds = cell.dataset.wordIds;
  const wordIndex = parseInt(cell.dataset.wordIndex) || 0;
  
  if (!wordIds) return;
  
  if (!currentActiveWord) {
    const firstWordId = wordIds.split(',')[0];
    const word = currentLevelData.words.find(w => w.id == firstWordId);
    if (word) {
      currentActiveWord = word.id;
      currentWordDirection = word.direction;
      currentCellIndex = wordIndex;
    }
  }
  
  const value = cell.value.toUpperCase();
  
  if (value && /[A-Z]/.test(value)) {
    moveToNextCell();
  }
}


function handleCellKeyDown(event) {
  const cell = event.target;
  const wordIds = cell.dataset.wordIds;
  
  if (event.key === 'Backspace' && !cell.value) {
    event.preventDefault();
    moveToPreviousCell();
  } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft' || 
             event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
    navigateWithArrows(event.key);
  }
}


function moveToNextCell() {
  if (!currentActiveWord || !currentWordDirection) return;
  
  const word = currentLevelData.words.find(w => w.id === currentActiveWord);
  if (!word) return;
  
  currentCellIndex++;
  
  if (currentCellIndex < word.length) {
    const x = currentWordDirection === 'Across' ? word.startPos.x + currentCellIndex : word.startPos.x;
    const y = currentWordDirection === 'Down' ? word.startPos.y + currentCellIndex : word.startPos.y;
    const cellKey = `${x},${y}`;
    const nextCell = document.querySelector(`[data-cell-key="${cellKey}"]`);
    
    if (nextCell) {
      nextCell.focus();
    }
  }
}

function moveToPreviousCell() {
  if (!currentActiveWord || !currentWordDirection) return;
  
  const word = currentLevelData.words.find(w => w.id === currentActiveWord);
  if (!word) return;
  
  currentCellIndex--;
  
  if (currentCellIndex >= 0) {
    const x = currentWordDirection === 'Across' ? word.startPos.x + currentCellIndex : word.startPos.x;
    const y = currentWordDirection === 'Down' ? word.startPos.y + currentCellIndex : word.startPos.y;
    const cellKey = `${x},${y}`;
    const prevCell = document.querySelector(`[data-cell-key="${cellKey}"]`);
    
    if (prevCell) {
      prevCell.focus();
      prevCell.select();
    }
  } else {
    currentCellIndex = 0;
  }
}


function navigateWithArrows(key) {
  const cell = document.activeElement;
  if (!cell.classList.contains('cell')) return;
  
  const x = parseInt(cell.dataset.x);
  const y = parseInt(cell.dataset.y);
  
  let targetX = x, targetY = y;
  
  switch (key) {
    case 'ArrowRight': targetX++; break;
    case 'ArrowLeft': targetX--; break;
    case 'ArrowDown': targetY++; break;
    case 'ArrowUp': targetY--; break;
  }
  
  const targetCell = document.querySelector(`[data-x="${targetX}"][data-y="${targetY}"]`);
  if (targetCell && !targetCell.disabled) {
    targetCell.focus();
    
    const wordIds = targetCell.dataset.wordIds;
    if (wordIds) {
      const firstWordId = wordIds.split(',')[0];
      const word = currentLevelData.words.find(w => w.id == firstWordId);
      if (word) {
        currentActiveWord = word.id;
        currentWordDirection = word.direction;
        
        if (word.direction === 'Across') {
          currentCellIndex = targetX - word.startPos.x;
        } else {
          currentCellIndex = targetY - word.startPos.y;
        }
      }
    }
  }
}

function collectUserAnswers() {
  const userAnswers = {};
  document.querySelectorAll('.cell:not([disabled])').forEach(cell => {
    const cellKey = cell.dataset.cellKey;
    const value = cell.value.trim();
    if (value && cellKey) {
      userAnswers[cellKey] = value;
    }
  });
  return userAnswers;
}

async function verifyAnswer() {
  try {
    const userAnswers = collectUserAnswers();
    const response = await fetch(`${API_BASE_URL}/level/${currentLevelId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userAnswers)
    });
    
    const result = await response.json();
    
    document.querySelectorAll('.cell').forEach(cell => {
      cell.classList.remove('correct', 'incorrect');
    });
    
    if (result.message && result.message.includes('Please fill all required cells')) {
      alert(result.message);
      return;
    }
    
    Object.entries(result.details).forEach(([cellKey, detail]) => {
      const cell = document.querySelector(`[data-cell-key="${cellKey}"]`);
      if (cell) {
        cell.classList.add(detail.correct ? 'correct' : 'incorrect');
      }
    });
    
    if (result.correct) {
      completedLevels.add(currentLevelId);

      successLevelEl.textContent = currentLevelId;
      successModal.style.display = 'flex';
      nextLevelBtn.disabled = false;
    } else {
      alert('Some answers are wrong! Please check again.');
    }
  } catch (error) {
    alert('Failed to verify answer: ' + error.message);
  }
}

function bindEvents() {
  verifyBtn.addEventListener('click', verifyAnswer);
  nextLevelBtn.addEventListener('click', loadNextLevel);
  prevLevelBtn.addEventListener('click', loadPreviousLevel);
  modalNextBtn.addEventListener('click', loadNextLevel);
  backToDirectoryBtn.addEventListener('click', backToDirectory);
  
  document.addEventListener('click', (event) => {
    if (event.target.classList.contains('cell')) {
      const cell = event.target;
      const wordIds = cell.dataset.wordIds;
      
      if (wordIds) {
        const firstWordId = wordIds.split(',')[0];
        const word = currentLevelData.words.find(w => w.id == firstWordId);
        if (word) {
          highlightWordCells(word.id);
          
          let index = 0;
          if (word.direction === 'Across') {
            index = parseInt(cell.dataset.x) - word.startPos.x;
          } else {
            index = parseInt(cell.dataset.y) - word.startPos.y;
          }
          
          currentActiveWord = word.id;
          currentWordDirection = word.direction;
          currentCellIndex = index;
        }
      }
    }
  });
  
  document.addEventListener('input', handleCellInput);
  document.addEventListener('keydown', handleCellKeyDown);
}


init();