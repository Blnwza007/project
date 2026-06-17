const STORAGE_KEY = 'mathrunner_settings';

// ── ค่าเริ่มต้น ──────────────────────
const defaults = {
  playerName: '',
  character: 1, // เริ่มต้นด้วย 1 (ผู้หญิง)
  language: 'th',
};

// ── โหลดค่าจากเครื่อง ───────────────────
function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
  } catch {
    return { ...defaults };
  }
}

// ── บันทึกค่าลงเครื่อง ─────────────────────────
function saveSettings(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Could not save settings:', e);
  }
}

// ── Elements ──────────────────────────────
const nameInput   = document.getElementById('player-name');
const clearBtn    = document.getElementById('clear-name-btn');
const nameCount   = document.getElementById('name-count');
const charCards   = document.querySelectorAll('.char-card');
const langBtns    = document.querySelectorAll('.lang-btn');
const saveBtn     = document.getElementById('save-btn');
const toast       = document.getElementById('toast');
const tabButtons  = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

let currentSettings = loadSettings();

// ── แสดงผล UI จากค่าที่บันทึกไว้ ───────────
function initUI() {
  nameInput.value = currentSettings.playerName;
  nameCount.textContent = currentSettings.playerName.length;

  // เช็กตัวละคร: ถ้าค่าคือ 1 เลือกการ์ดหญิง (girl) / ถ้าค่าคือ 2 เลือกการ์ดชาย (boy)
  charCards.forEach(card => {
    const isGirl = (currentSettings.character === 1 && card.dataset.char === 'girl');
    const isBoy  = (currentSettings.character === 2 && card.dataset.char === 'boy');
    card.classList.toggle('selected', isGirl || isBoy);
  });

  langBtns.forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.lang === currentSettings.language);
  });
}

// ── ระบบสลับ Tabs ──────────────────────────
tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    tabButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    const targetTabId = button.dataset.target;
    tabContents.forEach(content => {
      content.classList.toggle('active', content.id === targetTabId);
    });
  });
});

// ── Name input ────────────────────────────
nameInput.addEventListener('input', () => {
  nameCount.textContent = nameInput.value.length;
});

clearBtn.addEventListener('click', () => {
  nameInput.value = '';
  nameCount.textContent = '0';
  nameInput.focus();
});

// ── ตอนคลิกเลือกตัวละคร ──────────────────────
charCards.forEach(card => {
  card.addEventListener('click', () => {
    charCards.forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    
    // บันทึกเป็นเลข 1 (ผู้หญิง) หรือ 2 (ผู้ชาย)
    currentSettings.character = card.dataset.char === 'girl' ? 1 : 2;

    syncRunningCharacter(currentSettings.character);
  });
});

// ── เลือกภาษา ───────────────────────
langBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    langBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    currentSettings.language = btn.dataset.lang;
  });
});

// ── ปุ่มกด บันทึก ───────────────────────────
saveBtn.addEventListener('click', () => {
  currentSettings.playerName = nameInput.value.trim();
  saveSettings(currentSettings);
  showToast();
});

// ── แจ้งเตือน Toast ─────────────────────────────────
let toastTimer;
function showToast() {
  clearTimeout(toastTimer);
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ── ตัวละครวิ่งฉากหลังในหน้าตั้งค่า ───────────
const boy  = document.getElementById('boyRun');
const girl = document.getElementById('girlRun');
let posX = -350;

function syncRunningCharacter(charNum) {
  if (charNum === 2) { // 2 = ผู้ชาย
    boy.style.display  = 'block';
    girl.style.display = 'none';
  } else {             // 1 = ผู้หญิง
    girl.style.display = 'block';
    boy.style.display  = 'none';
  }
}

function animateSetting() {
  const activeEl = currentSettings.character === 2 ? boy : girl;
  activeEl.style.left = posX + 'px';
  posX += 2;
  if (posX > window.innerWidth) posX = -activeEl.offsetWidth;
  requestAnimationFrame(animateSetting);
}

// เรียกทำงานหน้าตั้งค่า
initUI();
syncRunningCharacter(currentSettings.character);
animateSetting();