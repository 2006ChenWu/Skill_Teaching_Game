const fs = require('fs');
const path = require('path');

const getLevelsData = () => {
  const filePath = path.join(__dirname, '../data/levels.json');
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data).levels;
};


function calculateBoard(level) {
  const cells = new Map(); 
  const allWords = [];
  

  level.words.forEach(word => {
    const { startPos, direction, length, answer, id } = word;
    const letters = answer.split('');
    

    if (letters.length !== length) {
      throw new Error(`word ${answer} length ${letters.length} Length does not match declaration ${length} `);
    }
    
    for (let i = 0; i < length; i++) {
      const x = direction === 'Across' ? startPos.x + i : startPos.x;
      const y = direction === 'Down' ? startPos.y + i : startPos.y;
      const cellKey = `${x},${y}`;
      
      if (!cells.has(cellKey)) {
        cells.set(cellKey, {
          x, y,
          letters: [],
          wordIds: [],
          isCross: false
        });
      }
      
      const cell = cells.get(cellKey);
      cell.letters.push(letters[i]);
      cell.wordIds.push(id);
      
  
      if (cell.letters.length > 1) {
        const allSame = cell.letters.every(letter => letter === cell.letters[0]);
        if (!allSame) {
          throw new Error(`Letter mismatch at position(${x},${y}): ${cell.letters.join(', ')}`);
        }
        cell.isCross = true;
      }
    }
    
    allWords.push({
      ...word,
      cells: Array.from({length}, (_, i) => ({
        x: direction === 'Across' ? startPos.x + i : startPos.x,
        y: direction === 'Down' ? startPos.y + i : startPos.y
      }))
    });
  });
  

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  cells.forEach((cell) => {
    minX = Math.min(minX, cell.x);
    minY = Math.min(minY, cell.y);
    maxX = Math.max(maxX, cell.x);
    maxY = Math.max(maxY, cell.y);
  });
  

  if (!isFinite(minX) || !isFinite(minY)) {
    throw new Error('Unable to calculate board boundaries, please check word position data');
  }
  
  return {
    cells: Array.from(cells.values()),
    words: allWords,
    bounds: { minX, minY, maxX, maxY },
    width: maxX - minX + 1,
    height: maxY - minY + 1
  };
}

exports.getLevelsList = (req, res) => {
  try {
    const levels = getLevelsData();
    const simplifiedLevels = levels.map(level => ({
      levelId: level.levelId,
      theme: level.theme,
      difficulty: level.difficulty
    }));
    res.json(simplifiedLevels);
  } catch (error) {
    console.error(' Error getting level list:', error);
    res.status(500).json({ message: ' Server internal error' });
  }
};

exports.getLevelDetail = (req, res) => {
  try {
    const levelId = parseInt(req.params.levelId);
    const levels = getLevelsData();
    const level = levels.find(l => l.levelId === levelId);
    
    if (!level) {
      return res.status(404).json({ message: 'Level not found' });
    }
    
    const boardData = calculateBoard(level);
    
    const levelDetail = {
      levelId: level.levelId,
      theme: level.theme,
      difficulty: level.difficulty,
      board: boardData,
      words: level.words.map(word => ({
        id: word.id,
        direction: word.direction,
        length: word.length,
        clue: word.clue,
        startPos: word.startPos
      }))
    };
    
    res.json(levelDetail);
  } catch (error) {
    console.error('Error getting level list:', error);
    res.status(500).json({ 
      message: ' Error generating board: ' + error.message 
    });
  }
};

exports.verifyAnswer = (req, res) => {
  try {
    const levelId = parseInt(req.params.levelId);
    const userAnswers = req.body;
    const levels = getLevelsData();
    const level = levels.find(l => l.levelId === levelId);
    
    if (!level) {
      return res.status(500).json({ message: 'Level not found' });
    }
    
    const boardData = calculateBoard(level);
    const correctAnswers = {};
    const requiredCellKeys = new Set();
    

    boardData.cells.forEach(cell => {
      const cellKey = `${cell.x},${cell.y}`;
      correctAnswers[cellKey] = cell.letters[0].toLowerCase();
      requiredCellKeys.add(cellKey);
    });
    

    const userFilledKeys = new Set(Object.keys(userAnswers));
    const missingCells = [];
    requiredCellKeys.forEach(key => {
      if (!userFilledKeys.has(key) || !userAnswers[key].trim()) {
        missingCells.push(key);
      }
    });
    
    if (missingCells.length > 0) {
      return res.json({
        correct: false,
        message: `Please fill in all required cells! Missing cells: ${missingCells.join(', ')}`,
        details: {}
      });
    }
    
  
    const verificationResult = {
      correct: true,
      details: {}
    };
    
    Object.entries(correctAnswers).forEach(([cellKey, correctChar]) => {
      const userChar = (userAnswers[cellKey] || '').toLowerCase().trim();
      const isCellCorrect = userChar === correctChar;
      
      verificationResult.details[cellKey] = {
        correct: isCellCorrect,
        expected: correctChar
      };
      
      if (!isCellCorrect) {
        verificationResult.correct = false;
      }
    });
    
    res.json(verificationResult);
  } catch (error) {
    console.error('Answer verification error:', error);
    res.status(500).json({ 
      message: 'Error verifying answer:' + error.message 
    });
  }
};