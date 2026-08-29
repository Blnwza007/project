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
    // เปิดแสดงตัววิ่งไล่
    if (chaser) chaser.style.display = 'block';
}

const animate = () => {
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
    
    // อัปเดตตำแหน่งบอสให้ตามหลังผู้เล่น
    if (chaser) {
        // แกล้งเพิ่มแกว่งๆ (bobbing) ด้วย Math.sin
        const bob = Math.sin(Date.now() / 150) * 5; 
        chaser.style.left = (currentPlayerPos - currentChaserDistance) + "px";
        chaser.style.transform = `translateY(${bob}px)`;
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
