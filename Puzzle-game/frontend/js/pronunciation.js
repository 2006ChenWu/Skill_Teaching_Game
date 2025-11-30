const pronunciationBtn = document.getElementById('pronunciationBtn');

pronunciationBtn.addEventListener('click', () => {
  const currentWord = currentWords[currentWordIndex]?.word;
  if (!currentWord) return;
  
  playWordPronunciation(currentWord);
});

//Text To Speech
function playWordPronunciation(word) {
  if (!('speechSynthesis' in window)) {
    return;
  }
  
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'en';
  utterance.rate = 1;
  
  speechSynthesis.speak(utterance);
}