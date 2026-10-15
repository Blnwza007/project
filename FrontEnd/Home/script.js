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
const loadingMessages = isEnglish
    ? ['Preparing the field...', 'Loading characters...', 'Ready to run!']
    : ['กำลังเตรียมสนาม...', 'กำลังเรียกตัวละคร...', 'พร้อมวิ่งแล้ว!'];
const loadingCompleteText = isEnglish ? 'Loading complete!' : 'โหลดเสร็จแล้ว!';

document.documentElement.lang = isEnglish ? 'en' : 'th';
document.getElementById('loadingScreen')?.setAttribute(
    'aria-label',
    isEnglish ? 'Loading game' : 'กำลังโหลดเกม'
);
if (loadingText) loadingText.textContent = loadingMessages[0];

let loadingFinished = false;

// ── Toast: เตือนถ้ายังไม่มีชื่อ ──
const showNameToast = () => {
    if (currentSettings.playerName?.trim()) return; // มีชื่อแล้ว → ไม่โชว์

    const toastMsg = isEnglish
        ? 'You haven\'t set a name yet!'
        : 'คุณยังไม่ได้ตั้งชื่อ!';
    const toastSub = isEnglish
        ? 'Go to Settings to add your name.'
        : 'ไปที่การตั้งค่าเพื่อใส่ชื่อของคุณ';
    const toastGoText = isEnglish ? 'Go to Settings →' : 'ไปที่การตั้งค่า →';

    const toast = document.createElement('div');
    toast.className = 'name-toast';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <span class="name-toast-icon">✏️</span>
        <div class="name-toast-body">
            <strong>${toastMsg}</strong><br>
            <span>${toastSub}</span><br>
            <button class="name-toast-link" onclick="location.href='./setting/index.html'">${toastGoText}</button>
        </div>
        <button class="name-toast-close" aria-label="ปิด">✕</button>
    `;
    document.body.appendChild(toast);

    // โผล่หลัง loading fade ออกหมด
    window.setTimeout(() => toast.classList.add('is-visible'), 500);

    // ปุ่มปิด
    toast.querySelector('.name-toast-close').addEventListener('click', () => {
        toast.classList.remove('is-visible');
        window.setTimeout(() => toast.remove(), 450);
    });

    // ปิดอัตโนมัติหลัง 8 วินาที
    window.setTimeout(() => {
        if (toast.isConnected) {
            toast.classList.remove('is-visible');
            window.setTimeout(() => toast.remove(), 450);
        }
    }, 8000);
};

const finishLoading = () => {
    if (loadingFinished || !loadingScreen) return;
    loadingFinished = true;
    if (loadingText) loadingText.textContent = loadingCompleteText;
    if (loadingProgress) loadingProgress.style.width = '100%';
    loadingScreen.classList.add('is-hidden');
    window.setTimeout(() => {
        loadingScreen.remove();
        showNameToast();
    }, 450);
};


const API_URL = 'https://project-vw4a.onrender.com';
const backendWakeupText = isEnglish ? 'Connecting to server...' : 'กำลังเชื่อมต่อเซิร์ฟเวอร์...';

if (loadingScreen) {
    // แสดงข้อความ loading ตามลำดับ
    loadingMessages.forEach((message, index) => {
        window.setTimeout(() => {
            if (!loadingFinished && loadingText) loadingText.textContent = message;
        }, index * 1000);
    });

    // รวบรวม assets ทั้งหมดที่ต้องรอ
    const imageUrls = [
        '../picture/Cloud.png',
        '../picture/sun.png',
        '../picture/boy_running1.png',
        '../picture/girl_running.png',
        '../picture/setting.png',
        '../picture/trophy.png',
    ];

    const imagePromises = imageUrls.map(src => new Promise(resolve => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve; // ถ้าโหลดไม่ได้ก็ไม่ค้าง
        img.src = src;
    }));

    // รอ Service Worker ลงทะเบียน (ถ้ารองรับ)
    const swPromise = ('serviceWorker' in navigator)
        ? navigator.serviceWorker.register('./sw.js')
            .then(() => {})
            .catch(() => {})
        : Promise.resolve();

    // 🔌 Ping backend (Render cold start อาจใช้เวลา ~30-60 วิ)
    // ใช้ AbortController เพื่อไม่ให้รอนาน > 60 วิ
    const backendPromise = new Promise(resolve => {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => {
            controller.abort();
            resolve(); // server ไม่ตอบ → ไม่ค้างรอตลอด
        }, 60_000);

        fetch(`${API_URL}/scores?limit=1`, { signal: controller.signal })
            .then(() => { window.clearTimeout(timeout); resolve(); })
            .catch(() => { window.clearTimeout(timeout); resolve(); });
    });

    // แสดงข้อความ "กำลังเชื่อมต่อเซิร์ฟเวอร์..." หลัง assets โหลดเสร็จ
    Promise.all([...imagePromises, swPromise]).then(() => {
        if (!loadingFinished && loadingText) loadingText.textContent = backendWakeupText;
    });

    // รอทุกอย่าง (assets + SW + backend) ก่อนปิด
    const allReady = Promise.all([...imagePromises, swPromise, backendPromise]);

    // อัปเดต progress bar:
    //  - 0–80%  = assets + SW  (เร็ว)
    //  - 80–99% = รอ backend wake up (อาจนาน)
    const loadingStartedAt = Date.now();
    const ASSET_MS = 2000;
    let assetsLoaded = false;
    Promise.all([...imagePromises, swPromise]).then(() => { assetsLoaded = true; });

    const progressTimer = window.setInterval(() => {
        if (loadingFinished) { window.clearInterval(progressTimer); return; }
        const elapsed = Date.now() - loadingStartedAt;
        let progress;
        if (!assetsLoaded) {
            // 0 → 80% ตามเวลา assets
            progress = Math.min(80, (elapsed / ASSET_MS) * 80);
        } else {
            // 80 → 99% ค่อยๆ คืบ (จะไม่ถึง 100% จนกว่า backend จะตอบ)
            const backendElapsed = elapsed - ASSET_MS;
            progress = Math.min(99, 80 + (backendElapsed / 60_000) * 19);
        }
        if (loadingProgress) loadingProgress.style.width = `${progress}%`;
    }, 100);

    allReady.then(() => {
        window.clearInterval(progressTimer);
        finishLoading();
    });
}

if (!('serviceWorker' in navigator)) {
    // sw.js ถูก register ใน allReady แล้ว ถ้าไม่รองรับก็ข้ามไป
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