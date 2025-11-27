// Level configuration for increasing difficulty
class LevelConfig {
    static getLevelConfig(level) {
        const configs = {
            1: {
                wordCount: 4,
                categoriesCount: 5,
                timeLimit: null,
                description: "Level 1 - Easy Words"
            },
            2: {
                wordCount: 5,
                categoriesCount: 5,
                timeLimit: null,
                description: "Level 2 - Easy-Medium Words"
            },
            3: {
                wordCount: 6,
                categoriesCount: 5,
                timeLimit: null,
                description: "Level 3 - Medium Words"
            },
            4: {
                wordCount: 7,
                categoriesCount: 5,
                timeLimit: null,
                description: "Level 4 - Medium-Hard Words"
            },
            5: {
                wordCount: 8,
                categoriesCount: 5,
                timeLimit: null,
                description: "Level 5 - Hard Words"
            }
        };
        
        return configs[level] || configs[1];
    }
    
    // Get available categories for specific level - always return all 5 categories
    static getAvailableCategories(level, allCategories) {
        // Always return all 5 categories, shuffled for variety
        return this.shuffleArray([...allCategories]);
    }
    
    // Get words for specific level with increasing difficulty
    static getWordsForLevel(level, allWords, usedWords = new Set()) {
        const config = this.getLevelConfig(level);
        
        // Filter out already used words and sort by difficulty
        const availableWords = allWords.filter(word => !usedWords.has(word.word));
        
        // If not enough unique words, reset used words
        if (availableWords.length < config.wordCount) {
            console.warn(`Not enough unique words available for level ${level}. Reusing words.`);
            usedWords.clear();
            return this.getWordsByDifficulty(level, allWords, config.wordCount);
        }
        
        // Get words based on level difficulty
        return this.getWordsByDifficulty(level, availableWords, config.wordCount);
    }
    
    // Get words based on level difficulty
    static getWordsByDifficulty(level, wordPool, count) {
        // Calculate difficulty range for this level
        const difficultyRanges = {
            1: { min: 1, max: 2 },  // Level 1: Very easy words (difficulty 1-2)
            2: { min: 2, max: 3 },  // Level 2: Easy-medium words (difficulty 2-3)
            3: { min: 3, max: 4 },  // Level 3: Medium words (difficulty 3-4)
            4: { min: 4, max: 5 },  // Level 4: Medium-hard words (difficulty 4-5)
            5: { min: 4, max: 5 }   // Level 5: Hard words (difficulty 4-5, more challenging selection)
        };
        
        const range = difficultyRanges[level] || difficultyRanges[1];
        
        // Filter words by difficulty range
        let suitableWords = wordPool.filter(word => {
            const difficulty = this.getWordDifficulty(word.word);
            return difficulty >= range.min && difficulty <= range.max;
        });
        
        // If not enough words in the target difficulty range, expand the range
        if (suitableWords.length < count) {
            console.warn(`Not enough words in difficulty range ${range.min}-${range.max}. Expanding search.`);
            suitableWords = wordPool.filter(word => {
                const difficulty = this.getWordDifficulty(word.word);
                return difficulty >= Math.max(1, range.min - 1) && difficulty <= Math.min(5, range.max + 1);
            });
        }
        
        // If still not enough, use all available words
        if (suitableWords.length < count) {
            console.warn(`Still not enough words. Using all available words.`);
            suitableWords = [...wordPool];
        }
        
        // For level 5, prioritize harder words by sorting in descending difficulty
        if (level === 5) {
            suitableWords.sort((a, b) => 
                this.getWordDifficulty(b.word) - this.getWordDifficulty(a.word)
            );
        }
        
        // Shuffle and select the required number of words
        const selected = this.shuffleArray(suitableWords).slice(0, count);
        
        console.log(`Level ${level}: Selected ${selected.length} words with difficulties:`, 
            selected.map(w => `${w.word} (${this.getWordDifficulty(w.word)})`));
        
        return selected;
    }
    
    // Enhanced word difficulty estimation
    static getWordDifficulty(word) {
        const wordStr = word.toLowerCase();
        const length = wordStr.length;
        
        // Difficulty factors
        let difficulty = 1; // Base difficulty
        
        // Length-based difficulty
        if (length <= 4) difficulty = 1;
        else if (length <= 6) difficulty = 2;
        else if (length <= 8) difficulty = 3;
        else if (length <= 10) difficulty = 4;
        else difficulty = 5;
        
        // Complexity factors that increase difficulty
        const complexPatterns = [
            /[^a-z]/, // Non-letter characters
            /(.)\1/, // Double letters
            /[aeiou]{3,}/, // Multiple vowels together
            /[^aeiou]{3,}/, // Multiple consonants together
            /(ing|tion|ment|ness|able|ible)$/, // Common suffixes
            /(un|dis|mis|re|pre)/ // Common prefixes
        ];
        
        complexPatterns.forEach(pattern => {
            if (pattern.test(wordStr)) {
                difficulty = Math.min(difficulty + 1, 5);
            }
        });
        
        // Specific hard word patterns
        const hardWords = ['elephant', 'watermelon', 'pineapple', 'helicopter', 'firefighter', 'astronaut', 'submarine', 'kangaroo', 'giraffe', 'engineer', 'scientist', 'avocado', 'coconut', 'papaya', 'motorcycle'];
        if (hardWords.includes(wordStr)) {
            difficulty = Math.max(difficulty, 4);
        }
        
        return difficulty;
    }
    
    // Fisher-Yates shuffle algorithm
    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}