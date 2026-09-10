const STORAGE_KEY = 'mathrunner_settings';
const savedData = localStorage.getItem(STORAGE_KEY);
const currentSettings = savedData ? JSON.parse(savedData) : { character: 1 }; 
const isEnglish = currentSettings.language === 'en';

const startBtn = document.getElementById('start-btn');
if (startBtn && isEnglish) {
    startBtn.textContent = 'START GAME';
}

startBtn?.addEventListener('click', async (event) => {
    event.preventDefault();
    try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
        }
    } catch (error) {
        // Continue to Play when fullscreen is not supported.
    }
    window.location.href = startBtn.closest('a')?.href || '../play/index.html';
});

const loadingScreen = document.getElementById('loadingScreen');
const loadingProgress = document.getElementById('loadingProgress');
const loadingText = document.getElementById('loadingText');
const loadingSkip = document.getElementById('loadingSkip');
const loadingMessages = isEnglish
    ? ['Preparing the field...', 'Loading characters...', 'Ready to run!']
    : ['กำลังเตรียมสนาม...', 'กำลังเรียกตัวละคร...', 'พร้อมวิ่งแล้ว!'];
const loadingCompleteText = isEnglish ? 'Loading complete!' : 'โหลดเสร็จแล้ว!';
const loadingSkipText = isEnglish ? 'Skip loading' : 'ข้ามการโหลด';
const loadingFinishText = isEnglish ? 'Finish loading' : 'เสร็จสิ้นการโหลด';

document.documentElement.lang = isEnglish ? 'en' : 'th';
document.getElementById('loadingScreen')?.setAttribute(
    'aria-label',
    isEnglish ? 'Loading game' : 'กำลังโหลดเกม'
);
if (loadingText) loadingText.textContent = loadingMessages[0];
if (loadingSkip) loadingSkip.textContent = loadingSkipText;
let loadingFinished = false;
let loadingComplete = false;
const loadingStartedAt = Date.now();

const finishLoading = () => {
    if (loadingFinished || !loadingScreen) return;
    loadingFinished = true;
    loadingScreen.classList.add('is-hidden');
    window.setTimeout(() => loadingScreen.remove(), 450);
};

if (loadingScreen) {
    loadingMessages.forEach((message, index) => {
        window.setTimeout(() => {
            if (!loadingFinished && loadingText) loadingText.textContent = message;
        }, index * 1300);
    });

    const loadingTimer = window.setInterval(() => {
        if (loadingFinished || loadingComplete) {
            window.clearInterval(loadingTimer);
            return;
        }
        const progress = Math.min(100, (Date.now() - loadingStartedAt) / 4200 * 100);
        if (loadingProgress) loadingProgress.style.width = `${progress}%`;

        if (progress >= 100) {
            loadingComplete = true;
            if (loadingText) loadingText.textContent = loadingCompleteText;
            if (loadingSkip) loadingSkip.textContent = loadingFinishText;
        }
    }, 50);

    loadingSkip?.addEventListener('click', async () => {
        try {
            if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            }
        } catch (error) {
            // Some mobile browsers do not allow fullscreen; continue normally.
        }
        finishLoading();
    });
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
}

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