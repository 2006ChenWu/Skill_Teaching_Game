const API_BASE_URL = 'http://localhost:4001/api';
let currentLevelId = 1;
let currentLevelData = null;
let currentActiveWord = null;
let currentWordDirection = null;
let currentCellIndex = 0;
let levelHistory = [];
let completedLevels = new Set(); 

// DOM元素
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

// 初始化：加载第一关
async function init() {
  console.log('初始化游戏...');
  await loadLevel(currentLevelId);
  bindEvents();
}

// 加载指定关卡
async function loadLevel(levelId) {
  console.log('加载关卡:', levelId);
  try {
    const response = await fetch(`${API_BASE_URL}/level/${levelId}`);
    if (!response.ok) throw new Error('Level not found');
    
    currentLevelData = await response.json();
    console.log('关卡数据加载成功:', currentLevelData);

    // 只有在关卡变化时才添加到历史记录
    if (levelId !== currentLevelId) {
      levelHistory.push(currentLevelId);
    }

    currentLevelId = levelId;
    
    // 更新页面信息
    currentLevelEl.textContent = currentLevelId;
    levelThemeEl.textContent = currentLevelData.theme;
    levelDifficultyEl.textContent = currentLevelData.difficulty;
    
    // 渲染棋盘和线索
    renderBoard();
    renderClues();
    
    // 重置状态
    successModal.style.display = 'none';
    currentActiveWord = null;
    currentWordDirection = null;
    currentCellIndex = 0;

     // 恢复下一关按钮状态：如果这个关卡已经完成过，就启用下一关按钮
     nextLevelBtn.disabled = !completedLevels.has(currentLevelId);
    
    // 控制"上一关"按钮显示
    if (levelId > 1) {
      prevLevelBtn.style.display = 'inline-block';
    } else {
      prevLevelBtn.style.display = 'none';
    }
    
  } catch (error) {
    console.error('加载关卡失败:', error);
    alert('Failed to load level: ' + error.message);
  }
}

// 加载上一关
function loadPreviousLevel() {
  if (levelHistory.length > 0) {
    // 从历史记录中获取上一关
    const previousLevel = levelHistory.pop();
    loadLevel(previousLevel);
  } else if (currentLevelId > 1) {
    // 如果没有历史记录，但当前关卡大于1，则回到上一关
    loadLevel(currentLevelId - 1);
  }
}

// 加载下一关
function loadNextLevel() {
  loadLevel(currentLevelId + 1);
}

function backToDirectory() {
  // 跳转到主目录
  window.location.href = 'http://localhost:3000';
}

// 渲染棋盘
function renderBoard() {
  console.log('渲染棋盘...');
  const { board, words } = currentLevelData;
  
  // 清空棋盘
  boardEl.innerHTML = '';
  
  // 计算偏移量，确保棋盘从(0,0)开始显示
  const offsetX = -board.bounds.minX;
  const offsetY = -board.bounds.minY;
  
  // 设置棋盘网格
  boardEl.style.gridTemplateRows = `repeat(${board.height}, 40px)`;
  boardEl.style.gridTemplateColumns = `repeat(${board.width}, 40px)`;
  
  // 创建所有格子
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
        // 有单词经过的格子
        cell.dataset.x = x;
        cell.dataset.y = y;
        cell.dataset.cellKey = cellKey;
        cell.dataset.wordIds = cellData.wordIds.join(',');
        cell.dataset.isCross = cellData.isCross;
        
        // 检查是否是某个单词的起始格子
        const startWordIds = [];
        words.forEach(word => {
          if (word.startPos.x === x && word.startPos.y === y) {
            startWordIds.push(word.id);
          }
        });
        
        if (startWordIds.length > 0) {
          cell.dataset.startWordIds = startWordIds.join(',');
          // 添加序号标记
          const numberLabel = document.createElement('div');
          numberLabel.className = 'word-number';
          numberLabel.textContent = startWordIds.join('/');
          cellContainer.appendChild(numberLabel);
        }
      } else {
        // 空白格子，设置为不可编辑
        cell.disabled = true;
        cell.style.backgroundColor = '#f0f0f0';
        cell.style.visibility = 'hidden';
      }
      
      // 计算在网格中的位置
      const gridRow = y + offsetY + 1;
      const gridCol = x + offsetX + 1;
      cellContainer.style.gridRow = gridRow;
      cellContainer.style.gridColumn = gridCol;
      
      cellContainer.appendChild(cell);
      boardEl.appendChild(cellContainer);
    }
  }
}

// 渲染线索
function renderClues() {
  console.log('渲染线索...');
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

// 高亮指定单词的所有格子
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

// 激活单词输入模式
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

// 处理键盘输入
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

// 处理删除键
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

// 移动到下一个格子
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

// 移动到上一个格子
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

// 使用方向键导航
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

// 收集用户答案
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

// 验证答案
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

// 绑定事件
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

// 启动游戏
init();