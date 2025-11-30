let currentCategory = '';
let currentWords = [];
let currentWordIndex = 0;
let fragments = [];
let correctOrder = [];
let wordCount = 2;

//category Selection
const categorySelection = document.getElementById('categorySelection');
const categoryButtons = document.querySelectorAll('.category-btn');

//wordCountSelector
const wordCountSelector = document.getElementById('wordCountSelector');
const wordCountInput = document.getElementById('wordCount');
const decreaseBtn = document.getElementById('decreaseBtn');
const increaseBtn = document.getElementById('increaseBtn');

//gameArea
const gameArea = document.getElementById('gameArea');

//Word and phonetic
const currentWordElement = document.getElementById('currentWord');
const phoneticDisplay = document.getElementById('phoneticDisplay');

//target area and fragments
const targetSlots = document.getElementById('targetSlots');
const fragmentsContainer = document.getElementById('fragmentsContainer');

//Button: Submit, Reset, New game
const checkBtn = document.getElementById('checkBtn');
const resetBtn = document.getElementById('resetBtn');
const newGameBtn = document.getElementById('newGameBtn');

//id="message"
const messageElement = document.getElementById('message');



// init wordCountSelector: decreaseBtn and increaseBtn
decreaseBtn.addEventListener('click', () => {
  if (wordCount > 1) {
    wordCount--;
    wordCountInput.value = wordCount;
  }
});

increaseBtn.addEventListener('click', () => {
  if (wordCount < 10) {
    wordCount++;
    wordCountInput.value = wordCount;
  }
});

// load data
async function loadData(category) {
  try {
    const response = await fetch(`/data/${category}.json`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('loading error', error);
  }
}

// get Words
function getRandomWords(data, count) {
  const actualCount = Math.min(count, data.length);
  const shuffled = [...data].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, actualCount);
}

// start game
function startGame() {
  if (currentWordIndex >= currentWords.length) {
    currentWordIndex = 0;
    currentWords = getRandomWords(currentWords, wordCount);
  }
  
  // init progress bar
  if (newprocess) {
    initProgressBar();
    newprocess = false;
  }
  
  const currentWord = currentWords[currentWordIndex];
  currentWordElement.classList.add('hidden');
  wordCountSelector.classList.add('hidden');
  pronunciationBtn.classList.remove('hidden');
  currentWordElement.textContent = `${currentWord.word}`;
  phoneticDisplay.textContent = `${currentWord.phonetic}`;
  
  // set fragments
  fragments = [...currentWord.fragments];
  correctOrder = [...currentWord.fragments];
  
  // random fragments Order
  randomOrder(fragments);
  
  // game loading
  gameloading();
  
  // clear message
  messageElement.textContent = '';
  messageElement.className = 'message';
}

// random fragments Order
function randomOrder(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// game loading
function gameloading() {
  targetSlots.innerHTML = '';
  fragmentsContainer.innerHTML = '';
  
  // create target
  for (let i = 0; i < correctOrder.length; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.dataset.index = i;
    targetSlots.appendChild(slot);
  }
  
  // set fragments
  fragments.forEach((fragment, index) => {
    const fragmentElement = document.createElement('div');
    fragmentElement.className = 'fragment';
    fragmentElement.textContent = fragment;
    fragmentElement.draggable = true;
    fragmentElement.dataset.fragment = fragment;
    fragmentElement.dataset.index = index;
    
    addDragEvents(fragmentElement);
    
    fragmentsContainer.appendChild(fragmentElement);
  });
  
  // add drop events to targetSlots
  addDropEvents(targetSlots);
}

// check answer
function checkAnswer() {
  const slots = targetSlots.querySelectorAll('.slot');
  let userAnswer = [];
  
  // get anser
  slots.forEach(slot => {
    if (slot.children.length > 0) {
      userAnswer.push(slot.children[0].dataset.fragment);
    } else {
      userAnswer.push('');
    }
  });
  
  const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctOrder);
  
  if (isCorrect) {
    currentWordElement.classList.remove('hidden');
    showMessage('Perfect!', 'success');

    incrementProgress();
    
    // if complete all words
    if (totalWords > 0 && completedWords === totalWords) {

      setTimeout(() => {
        checkBtn.classList.add('hidden');
        resetBtn.classList.add('hidden');
      }, 100);
    } else {
      // next word
      setTimeout(() => {
        currentWordIndex++;
        startGame();
      }, 1500);
    }
  } else {
    showMessage('Spelling error, please try again!', 'error');
    
    highlightErrors(userAnswer);
  }
}

// highlight error
function highlightErrors(userAnswer) {
  const slots = targetSlots.querySelectorAll('.slot');
  
  slots.forEach((slot, index) => {
    if (slot.children.length > 0) {
      const fragment = slot.children[0];
      if (userAnswer[index] === correctOrder[index]) {
        fragment.classList.add('correct');
      } else {
        fragment.classList.add('incorrect');
      }
    }
  });
}

// show message
function showMessage(text, type) {
  messageElement.textContent = text;
  messageElement.className = `message ${type}`;
}

// reset current word
function resetGame() {
  startGame();
}

// new game
function newGame() {
  newprocess = true;
  gameArea.classList.add('hidden');
  wordCountSelector.classList.remove('hidden');
  categorySelection.classList.remove('hidden');
  checkBtn.classList.remove('hidden');
  resetBtn.classList.remove('hidden');
}

// init game events
function initGameEvents() {
  // category button
  categoryButtons.forEach(button => {
    button.addEventListener('click', async () => {
      currentCategory = button.getAttribute('data-category');
      const data = await loadData(currentCategory);
      
      if (data.length === 0) {
        alert('Error, please reflesh.');
        return;
      }
      
      // get Word Count
      currentWords = getRandomWords(data, wordCount);
      currentWordIndex = 0;
      
      //hide categorySelection
      categorySelection.classList.add('hidden');

      //show gameArea
      gameArea.classList.remove('hidden');
      
      startGame();
    });
  });

  // listen button: Submit, Reset, New game
  checkBtn.addEventListener('click', checkAnswer);
  resetBtn.addEventListener('click', resetGame);
  newGameBtn.addEventListener('click', newGame);
}

// game loading
document.addEventListener('DOMContentLoaded', () => {
  initGameEvents();
  console.log('Game Ready!');
});