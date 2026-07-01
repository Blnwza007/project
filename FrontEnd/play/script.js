export const input = document.getElementById('answerInput');
export const submit = document.getElementById('submitAnswer');
export const scoreDisplay = document.getElementById('scoreDisplay');
export const tierDisplay = document.getElementById('tierDisplay');
export const heartsDisplay = document.getElementById('heartsDisplay');
export const gameOverScreen = document.getElementById('gameOverScreen');
export const finalScore = document.getElementById('finalScore');
export const finalCorrect = document.getElementById('finalCorrect');
export const finalTier = document.getElementById('finalTier');
export const restartBtn = document.getElementById('restartBtn');
export const menuButton = document.getElementById('menuBtn');
export const menuLink = document.getElementById('menuLink');

let hearts = 3;

const STORAGE_KEY = 'mathrunner_settings';
const savedData = localStorage.getItem(STORAGE_KEY);
const currentSettings = savedData ? JSON.parse(savedData) : { character: 1 }; 

const boy = document.getElementById('boyRun');
const girl = document.getElementById('girlRun');

let positionBoy = -350;
let positionGirl = -350;
const screenWidth = window.innerWidth;

const currentCharacter = () => {
    if (currentSettings.character === 1) {       
        boy.style.display = 'none';
        girl.style.display = 'block';
    } else if (currentSettings.character === 2) { 
        girl.style.display = 'none';
        boy.style.display = 'block';
    }
}

const animate = () => {
    
    if (currentSettings.character === 2) { 
        boy.style.left = positionBoy + "px";
        positionBoy += 2;
        if (positionBoy > screenWidth) {
            positionBoy = -boy.offsetWidth;  
        }
    } else { 
        girl.style.left = positionGirl + "px";
        positionGirl += 2;
        if (positionGirl > screenWidth) {
            positionGirl = -girl.offsetWidth;
        }
    }
    
    requestAnimationFrame(animate);
}

currentCharacter();
animate();



const updateHeartsUI = () => {
  if (!heartsDisplay) return;

  const heartsList = Array.from(heartsDisplay.querySelectorAll('.heart'));
  heartsList.forEach((heart, index) => {
    heart.textContent = index < hearts ? '❤️' : '🤍';
    heart.style.opacity = index < hearts ? '1' : '0.3';
  });
};

export const resetHearts = () => {
  hearts = 3;
  updateHeartsUI();
};

export const loseLife = () => {
  hearts = Math.max(0, hearts - 1);
  updateHeartsUI();

  if (hearts === 0) {
    gameOverScreen?.classList.remove('hidden');
    finalScore.textContent = scoreDisplay?.textContent || '0';
    finalCorrect.textContent = scoreDisplay?.textContent || '0';
    finalTier.textContent = tierDisplay?.textContent || '1';
  }

  return hearts;
};

resetHearts();

menuLink?.addEventListener('click', () => {
  localStorage.removeItem('mathRunner');
  resetHearts();
});
