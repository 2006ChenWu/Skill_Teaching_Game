let progressFill = document.getElementById('progressFill');
let progressText = document.getElementById('progressText');
let totalWords = 0;
let completedWords = 0;
let newprocess = true;

function initProgressBar() {
    completedWords = 0;
    totalWords = currentWords.length;
    updateProgressBar();
}

function updateProgressBar() {
    const percentage = totalWords > 0 ? (completedWords / totalWords) * 100 : 0;
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `${percentage.toFixed(0)}% (${completedWords}/${totalWords})`;
}

function incrementProgress() {
    if (completedWords < totalWords) {
        completedWords++;
        updateProgressBar();
    }
}