const fs = require('fs');
const path = require('path');

const getLevelsData = () => {
  const filePath = path.join(__dirname, '../data/levels.json');
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data).levels;
};

// 计算棋盘大小和生成格子数据
function calculateBoard(level) {
  const cells = new Map(); // 存储所有格子 {key: {x, y, letters: [], wordIds: []}}
  const allWords = [];
  
  // 处理每个单词
  level.words.forEach(word => {
    const { startPos, direction, length, answer, id } = word;
    const letters = answer.split('');
    
    // 验证答案长度是否匹配
    if (letters.length !== length) {
      throw new Error(`单词 ${answer} 的长度 ${letters.length} 与声明的长度 ${length} 不匹配`);
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
      
      // 如果同一个格子有多个字母（交叉点），验证是否相同
      if (cell.letters.length > 1) {
        const allSame = cell.letters.every(letter => letter === cell.letters[0]);
        if (!allSame) {
          throw new Error(`字母不匹配在位置 (${x},${y}): ${cell.letters.join(', ')}`);
        }
        cell.isCross = true;
      }
    }
    
    // 重新构建cells数组用于前端
    allWords.push({
      ...word,
      cells: Array.from({length}, (_, i) => ({
        x: direction === 'Across' ? startPos.x + i : startPos.x,
        y: direction === 'Down' ? startPos.y + i : startPos.y
      }))
    });
  });
  
  // 计算棋盘边界
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  cells.forEach((cell) => {
    minX = Math.min(minX, cell.x);
    minY = Math.min(minY, cell.y);
    maxX = Math.max(maxX, cell.x);
    maxY = Math.max(maxY, cell.y);
  });
  
  // 确保边界有效
  if (!isFinite(minX) || !isFinite(minY)) {
    throw new Error('无法计算棋盘边界，请检查单词位置数据');
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
    console.error('获取关卡列表错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
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
    console.error('获取关卡详情错误:', error);
    res.status(500).json({ 
      message: '生成棋盘时出错: ' + error.message 
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
    
    // 构建正确答案映射
    boardData.cells.forEach(cell => {
      const cellKey = `${cell.x},${cell.y}`;
      correctAnswers[cellKey] = cell.letters[0].toLowerCase();
      requiredCellKeys.add(cellKey);
    });
    
    // 检查是否填写了所有必填格子
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
        message: `请填写所有必需的格子! 缺失的格子: ${missingCells.join(', ')}`,
        details: {}
      });
    }
    
    // 对比用户答案和正确答案
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
    console.error('验证答案错误:', error);
    res.status(500).json({ 
      message: '验证答案时出错: ' + error.message 
    });
  }
};