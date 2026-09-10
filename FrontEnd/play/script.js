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

const fullscreenBtn = document.getElementById('fullscreenBtn');
const enterFullscreen = async () => {
  if (document.fullscreenElement || !document.documentElement.requestFullscreen) return;
  try {
    await document.documentElement.requestFullscreen();
  } catch (error) {
    // Fullscreen can be unavailable in some mobile browsers.
  }
};

document.addEventListener('pointerdown', enterFullscreen, { once: true });

fullscreenBtn?.addEventListener('click', async () => {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
  } else {
    await enterFullscreen();
  }
});

let hearts = 3; let gameEnded = false;

const STORAGE_KEY = 'mathrunner_settings';
const LEADERBOARD_KEY = 'mathRunnerLeaderboard';
const savedData = localStorage.getItem(STORAGE_KEY);
const currentSettings = savedData ? JSON.parse(savedData) : { character: 1, language: 'th' };
export const playLanguage = currentSettings.language === 'en' ? 'en' : 'th';

const PLAY_I18N = {
  th: {
    home: 'หน้าหลัก', level: 'LEVEL', score: 'คะแนน', hearts: 'ชีวิต',
    streak: count => `ตอบถูก ${count} ข้อติดต่อกัน`, placeholder: 'พิมพ์คำตอบ...',
    submit: 'ส่งคำตอบ', loading: 'กำลังโหลดโจทย์...', gameOver: 'จบเกม!',
    correct: 'ตอบถูก', reached: 'ถึง Level', restart: 'เล่นอีกครั้ง',
    homeTitle: 'กลับหน้าหลัก', boss: level => `BOSS LEVEL ${level}`,
    levelBadge: level => `LEVEL ${level}`
  },
  en: {
    home: 'Home', level: 'LEVEL', score: 'Score', hearts: 'Lives',
    streak: count => `${count} correct in a row`, placeholder: 'Type your answer...',
    submit: 'Submit answer', loading: 'Loading question...', gameOver: 'Game Over!',
    correct: 'Correct', reached: 'Reached Level', restart: 'Play again',
    homeTitle: 'Back to home', boss: level => `BOSS LEVEL ${level}`,
    levelBadge: level => `LEVEL ${level}`
  }
};

export const playText = PLAY_I18N[playLanguage];

const setText = (id, text) => {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
};

const applyPlayLanguage = () => {
  document.documentElement.lang = playLanguage;
  setText('homeBtnText', playText.home);
  setText('hudLabelLevel', playText.level);
  setText('hudLabelScore', playText.score);
  setText('hudLabelHearts', playText.hearts);
  setText('streakText', playText.streak(3));
  setText('submitAnswer', playText.submit);
  setText('questionDisplay', playText.loading);
  setText('overTitle', playText.gameOver);
  setText('overLabelScore', playText.score);
  setText('overLabelCorrect', playText.correct);
  setText('overLabelLevel', playText.reached);
  setText('restartBtn', playText.restart);
  setText('menuBtn', playText.home);
  const homeButton = document.getElementById('homeBtn');
  if (homeButton) homeButton.title = playText.homeTitle;
  const answerInput = document.getElementById('answerInput');
  if (answerInput) answerInput.placeholder = playText.placeholder;
};

applyPlayLanguage();

const saveLeaderboardScore = () => {
  const scores = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]');
  scores.push({
    name: currentSettings.playerName || (currentSettings.language === 'en' ? 'Anonymous' : 'ผู้เล่นนิรนาม'),
    score: Number(scoreDisplay?.textContent) || 0,
    level: Number(tierDisplay?.textContent) || 1,
    date: new Date().toISOString()
  });
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(scores));
};

const boy = document.getElementById('boyRun');
const girl = document.getElementById('girlRun');
const chaser = document.getElementById('chaserRun'); // ตัววิ่งไล่

let positionBoy = -350;
let positionGirl = -350;
let currentChaserDistance = 400; // ระยะห่างเริ่มต้น (ไกลสุด)
const screenWidth = window.innerWidth;

// ฟังก์ชันสำหรับอัปเดตระยะห่างจากภายนอก (questions.js)
export const updateChaserDistance = (percent) => {
    // ให้ระยะห่างอยู่ระหว่าง 50px (ประชิดตัว) ถึง 500px (ไกลสุด)
    currentChaserDistance = 50 + (percent * 450);
}

const currentCharacter = () => {
    if (currentSettings.character === 1) {       
        boy.style.display = 'none';
        girl.style.display = 'block';
    } else if (currentSettings.character === 2) { 
        girl.style.display = 'none';
        boy.style.display = 'block';
    }
    if (chaser) chaser.style.display = 'block';
}

const animate = () => {
    // If the game has ended (player lost all hearts), stop moving characters and chaser.
    // Clouds and the sun are animated via CSS and will continue.
    if (gameEnded) {
        requestAnimationFrame(animate);
        return;
    }
    let currentPlayerPos = 0;
    
    if (currentSettings.character === 2) { 
        boy.style.left = positionBoy + "px";
        positionBoy += 2;
        currentPlayerPos = positionBoy;
        if (positionBoy > screenWidth) {
            positionBoy = -boy.offsetWidth;  
        }
    } else { 
        girl.style.left = positionGirl + "px";
        positionGirl += 2;
        currentPlayerPos = positionGirl;
        if (positionGirl > screenWidth) {
            positionGirl = -girl.offsetWidth;
        }
    }
    
    if (chaser) {
      const isBossLevel = document.body.classList.contains('boss-active');
      chaser.style.display = isBossLevel ? 'none' : 'block';

      if (isBossLevel) {
        requestAnimationFrame(animate);
        return;
      }

        const bob = Math.sin(Date.now() / 150) * 5; 
        chaser.style.left = (currentPlayerPos - currentChaserDistance) + "px";
        chaser.style.transform = `translateY(${bob}px)`;
    }
    
    requestAnimationFrame(animate);
}

currentCharacter();
animate();

// ── Explosion effect when game over ──
const explodeCharacter = () => {
  const activeChar = currentSettings.character === 2 ? boy : girl;
  if (!activeChar) return;

  // Get current position of the character
  const rect = activeChar.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // Add flash + shrink animation to the character
  activeChar.classList.add('exploding');

  // Hide chaser too
  if (chaser) chaser.style.display = 'none';

  // Create explosion particles
  const colors = ['#ff5252', '#ffc700', '#ff8c00', '#ff4081', '#ffffff', '#ffeb3b'];
  const particleCount = 20;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.classList.add('explosion-particle');

    // Random direction and distance
    const angle = (Math.PI * 2 * i) / particleCount + (Math.random() * 0.5);
    const distance = 80 + Math.random() * 120;
    const px = Math.cos(angle) * distance;
    const py = Math.sin(angle) * distance;
    const size = 6 + Math.random() * 12;
    const delay = Math.random() * 0.15;

    particle.style.cssText = `
      left: ${centerX}px;
      top: ${centerY}px;
      --px: ${px}px;
      --py: ${py}px;
      --size: ${size}px;
      --color: ${colors[Math.floor(Math.random() * colors.length)]};
      --delay: ${delay}s;
    `;

    document.body.appendChild(particle);

    // Clean up particle after animation
    particle.addEventListener('animationend', () => particle.remove());
  }
};



const HEART_ACTIVE_SVG = `<svg class="heart-svg" viewBox="0 0 24 24" width="24" height="24" fill="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#FF2A2A" stroke="#000" stroke-width="2" stroke-linejoin="round"/><path d="M7 6c-1.5 0-2.5 1-2.5 2.5" stroke="#FFF" stroke-width="1.2" stroke-linecap="round"/></svg>`;

const HEART_LOST_SVG = `<svg class="heart-svg lost" viewBox="0 0 24 24" width="24" height="24" fill="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#757575" stroke="#000" stroke-width="2" stroke-linejoin="round"/></svg>`;

const updateHeartsUI = () => {
  if (!heartsDisplay) return;

  const heartsList = Array.from(heartsDisplay.querySelectorAll('.heart'));
  heartsList.forEach((heart, index) => {
    heart.innerHTML = index < hearts ? HEART_ACTIVE_SVG : HEART_LOST_SVG;
    heart.style.opacity = index < hearts ? '1' : '0.35';
  });
};

export const resetHearts = () => {
  hearts = 3;
  gameEnded = false;
  // Reset character positions to start from the left
  positionBoy = -350;
  positionGirl = -350;
  // Remove explosion effect from characters
  boy?.classList.remove('exploding');
  girl?.classList.remove('exploding');
  currentCharacter();
  updateHeartsUI();
};

export const loseLife = () => {
  hearts = Math.max(0, hearts - 1);
  updateHeartsUI();

    if (hearts === 0) {
      gameEnded = true;
      explodeCharacter();
      saveLeaderboardScore();
      // Delay game over screen so explosion plays first
      setTimeout(() => {
        gameOverScreen?.classList.remove('hidden');
        finalScore.textContent = scoreDisplay?.textContent || '0';
        finalCorrect.textContent = scoreDisplay?.textContent || '0';
        finalTier.textContent = tierDisplay?.textContent || '1';
      }, 600);
    }

  return hearts;
};

resetHearts();

const handleExitHome = () => {
  localStorage.removeItem('mathRunner');
  resetHearts();
};

menuLink?.addEventListener('click', handleExitHome);
document.getElementById('homeBtn')?.addEventListener('click', handleExitHome);
