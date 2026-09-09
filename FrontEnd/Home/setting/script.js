const STORAGE_KEY = 'mathrunner_settings';

const defaults = {
  playerName: '',
  character: 1, // 1 = girl, 2 = boy
  language: 'th',
};

const I18N = {
  th: {
    headerTitle: 'ตั้งค่า',
    tabName: 'ชื่อผู้เล่น',
    tabChar: 'ตัวละคร',
    tabLang: 'ภาษา',
    nameLabel: 'ชื่อผู้เล่น',
    namePlaceholder: 'ใส่ชื่อที่นี่...',
    charLabel: 'ตัวละคร',
    charGirl: 'หญิง',
    charBoy: 'ชาย',
    langLabel: 'ภาษา',
    backBtn: '← กลับ',
    saveBtn: 'บันทึก',
    toast: 'บันทึกแล้ว!',
  },
  en: {
    headerTitle: 'Settings',
    tabName: 'Player Name',
    tabChar: 'Character',
    tabLang: 'Language',
    nameLabel: 'Player Name',
    namePlaceholder: 'Enter name here...',
    charLabel: 'Character',
    charGirl: 'Girl',
    charBoy: 'Boy',
    langLabel: 'Language',
    backBtn: '← Back',
    saveBtn: 'Save',
    toast: 'Saved!',
  }
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
  } catch {
    return { ...defaults };
  }
}

function saveSettings(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Could not save settings:', e);
  }
}

const nameInput   = document.getElementById('player-name');
const clearBtn    = document.getElementById('clear-name-btn');
const nameCount   = document.getElementById('name-count');
const charCards   = document.querySelectorAll('.char-card');
const langBtns    = document.querySelectorAll('.lang-btn');
const saveBtn     = document.getElementById('save-btn');
const backBtn     = document.getElementById('btn-back');
const toast       = document.getElementById('toast');
const tabButtons  = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Elements to translate
const txtHeaderTitle = document.getElementById('txt-header-title');
const tabBtnName     = document.getElementById('tab-btn-name');
const tabBtnChar     = document.getElementById('tab-btn-char');
const tabBtnLang     = document.getElementById('tab-btn-lang');
const lblName        = document.getElementById('lbl-name');
const lblChar        = document.getElementById('lbl-char');
const lblLang        = document.getElementById('lbl-lang');
const txtCharGirl    = document.getElementById('txt-char-girl');
const txtCharBoy     = document.getElementById('txt-char-boy');

let currentSettings = loadSettings();

function applyLanguage(lang) {
  const t = I18N[lang] || I18N.th;
  if (txtHeaderTitle) txtHeaderTitle.textContent = t.headerTitle;
  if (tabBtnName)     tabBtnName.textContent     = t.tabName;
  if (tabBtnChar)     tabBtnChar.textContent     = t.tabChar;
  if (tabBtnLang)     tabBtnLang.textContent     = t.tabLang;
  if (lblName)        lblName.textContent        = t.nameLabel;
  if (lblChar)        lblChar.textContent        = t.charLabel;
  if (lblLang)        lblLang.textContent        = t.langLabel;
  if (txtCharGirl)    txtCharGirl.textContent    = t.charGirl;
  if (txtCharBoy)     txtCharBoy.textContent     = t.charBoy;
  if (nameInput)      nameInput.placeholder      = t.namePlaceholder;
  if (backBtn)        backBtn.textContent        = t.backBtn;
  if (saveBtn)        saveBtn.textContent        = t.saveBtn;
  if (toast)          toast.textContent          = t.toast;
}

function initUI() {
  nameInput.value = currentSettings.playerName || '';
  nameCount.textContent = nameInput.value.length;

  charCards.forEach(card => {
    const isGirl = (currentSettings.character === 1 && card.dataset.char === 'girl');
    const isBoy  = (currentSettings.character === 2 && card.dataset.char === 'boy');
    card.classList.toggle('selected', isGirl || isBoy);
  });

  langBtns.forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.lang === currentSettings.language);
  });

  applyLanguage(currentSettings.language);
}

// ── Tab switching ────────────────────────────────────────────────────────
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

// ── Player Name ──────────────────────────────────────────────────────────
nameInput.addEventListener('input', () => {
  nameCount.textContent = nameInput.value.length;
  currentSettings.playerName = nameInput.value.trim();
  saveSettings(currentSettings);
});

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    currentSettings.playerName = nameInput.value.trim();
    saveSettings(currentSettings);
    showToast();
  }
});

clearBtn.addEventListener('click', () => {
  nameInput.value = '';
  nameCount.textContent = '0';
  currentSettings.playerName = '';
  saveSettings(currentSettings);
  nameInput.focus();
});

// ── Character Selection ──────────────────────────────────────────────────
charCards.forEach(card => {
  card.addEventListener('click', () => {
    charCards.forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    
    currentSettings.character = card.dataset.char === 'girl' ? 1 : 2;
    saveSettings(currentSettings);
    syncRunningCharacter(currentSettings.character);
    showToast();
  });
});

// ── Language Selection ───────────────────────────────────────────────────
langBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    langBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    currentSettings.language = btn.dataset.lang;
    saveSettings(currentSettings);
    applyLanguage(currentSettings.language);
    showToast();
  });
});

// ── Save Button ──────────────────────────────────────────────────────────
saveBtn.addEventListener('click', () => {
  currentSettings.playerName = nameInput.value.trim();
  saveSettings(currentSettings);
  showToast();
});

let toastTimer;
function showToast() {
  clearTimeout(toastTimer);
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

// ── Running background sprite ────────────────────────────────────────────
const boy  = document.getElementById('boyRun');
const girl = document.getElementById('girlRun');
let posX = -350;

function syncRunningCharacter(charNum) {
  if (charNum === 2) { 
    boy.style.display  = 'block';
    girl.style.display = 'none';
  } else {             
    girl.style.display = 'block';
    boy.style.display  = 'none';
  }
}

function animateSetting() {
  const activeEl = currentSettings.character === 2 ? boy : girl;
  if (activeEl) {
    activeEl.style.left = posX + 'px';
    posX += 2;
    if (posX > window.innerWidth) posX = -activeEl.offsetWidth;
  }
  requestAnimationFrame(animateSetting);
}

initUI();
syncRunningCharacter(currentSettings.character);
animateSetting();