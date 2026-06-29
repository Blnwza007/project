const STORAGE_KEY = 'mathrunner_settings';

const defaults = {
  playerName: '',
  character: 1, 
  language: 'th',
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
const toast       = document.getElementById('toast');
const tabButtons  = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

let currentSettings = loadSettings();

function initUI() {
  nameInput.value = currentSettings.playerName;
  nameCount.textContent = currentSettings.playerName.length;

  charCards.forEach(card => {
    const isGirl = (currentSettings.character === 1 && card.dataset.char === 'girl');
    const isBoy  = (currentSettings.character === 2 && card.dataset.char === 'boy');
    card.classList.toggle('selected', isGirl || isBoy);
  });

  langBtns.forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.lang === currentSettings.language);
  });
}

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

nameInput.addEventListener('input', () => {
  nameCount.textContent = nameInput.value.length;
});

clearBtn.addEventListener('click', () => {
  nameInput.value = '';
  nameCount.textContent = '0';
  nameInput.focus();
});

charCards.forEach(card => {
  card.addEventListener('click', () => {
    charCards.forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    
    currentSettings.character = card.dataset.char === 'girl' ? 1 : 2;

    syncRunningCharacter(currentSettings.character);
  });
});

langBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    langBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    currentSettings.language = btn.dataset.lang;
  });
});

saveBtn.addEventListener('click', () => {
  currentSettings.playerName = nameInput.value.trim();
  saveSettings(currentSettings);
  showToast();
});

let toastTimer;
function showToast() {
  clearTimeout(toastTimer);
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

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
  activeEl.style.left = posX + 'px';
  posX += 2;
  if (posX > window.innerWidth) posX = -activeEl.offsetWidth;
  requestAnimationFrame(animateSetting);
}

initUI();
syncRunningCharacter(currentSettings.character);
animateSetting();