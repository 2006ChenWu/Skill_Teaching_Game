const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Load words data - fixed path for your structure
const wordsDataPath = path.join(__dirname, '../data/words.json');

// Helper function to load data
const loadWordsData = () => {
    try {
        const data = fs.readFileSync(wordsDataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading words data:', error);
        return { categories: [], words: [] };
    }
};

// Get all words and categories
router.get('/words', (req, res) => {
    try {
        const wordsData = loadWordsData();
        console.log('Sending words data:', wordsData);
        res.json(wordsData);
    } catch (error) {
        console.error('Error in /words endpoint:', error);
        res.status(500).json({ error: 'Failed to load words data' });
    }
});

// Verify word classification
router.post('/verify', (req, res) => {
    try {
        const { word, category } = req.body;
        console.log('Verifying:', word, 'in category:', category);
        
        const wordsData = loadWordsData();
        const wordData = wordsData.words.find(w => w.word === word);
        
        if (!wordData) {
            return res.status(404).json({ error: 'Word not found' });
        }
        
        const isCorrect = wordData.category === category;
        
        const result = {
            word,
            selectedCategory: category,
            correctCategory: wordData.category,
            isCorrect
        };
        
        console.log('Verification result:', result);
        res.json(result);
    } catch (error) {
        console.error('Error in /verify endpoint:', error);
        res.status(500).json({ error: 'Failed to verify classification' });
    }
});

module.exports = router;