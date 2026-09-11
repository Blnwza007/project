const STORAGE_KEY = 'mathrunner_settings';
const LEADERBOARD_KEY = 'mathRunnerLeaderboard';
const DEVICE_ID_KEY = 'mathrunner_deviceId';
const API_URL = 'http://localhost:3000';

// ── Device identity ────────────────────────────────────────────────────
// A random id generated once per device/browser. This is what actually
// proves "this name belongs to me" — typing the same name on another
// device never gives that device the same deviceId, so it can't hijack
// someone else's spot on the leaderboard.
function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

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
    toastRenamed: name => `ชื่อซ้ำ เปลี่ยนเป็น "${name}" แล้ว!`,
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
    toastRenamed: name => `Name taken — changed to "${name}"!`,
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

// ── Duplicate-name helpers ──────────────────────────────────────────────
// Collects names already used by other players (local history + backend),
// so we don't rename against the player's own previously-saved name.
async function getExistingNames() {
  const names = new Set();

  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.forEach(item => {
          if (item?.name) names.add(String(item.name).trim().toLowerCase());
        });
      }
    }
  } catch (_) {}

  try {
    const res = await fetch(`${API_URL}/scores`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const json = await res.json();
      (json.data || []).forEach(item => {
        if (item?.playerName) names.add(String(item.playerName).trim().toLowerCase());
      });
    }
  } catch (_) {
    // offline or backend down — local history is good enough as a fallback
  }

  return names;
}

// Appends 1, 2, 3... to `base` until it no longer collides with `existingNames`.
// Leaves the name untouched if it's the player's own current saved name.
// Used only as an offline fallback — see reserveName() for the real check.
function makeUniqueName(base, existingNames, ownCurrentName) {
  const trimmed = base.trim();
  if (!trimmed) return trimmed;

  const trimmedLower = trimmed.toLowerCase();
  const ownLower = (ownCurrentName || '').trim().toLowerCase();

  if (trimmedLower === ownLower) return trimmed;
  if (!existingNames.has(trimmedLower)) return trimmed;

  let n = 1;
  let candidate = `${trimmed}${n}`;
  while (existingNames.has(candidate.toLowerCase())) {
    n++;
    candidate = `${trimmed}${n}`;
  }
  return candidate;
}

// ── Authoritative name reservation (via backend) ─────────────────────────
// Actually claims the name against the "users" collection, tied to this
// device's deviceId. If someone else already owns it, the backend replies
// 409 and we retry with a number appended until we find a free one.
async function reserveName(baseName, deviceId) {
  const trimmed = baseName.trim();
  if (!trimmed) return { name: trimmed, reserved: false, offline: false };

  let candidate = trimmed;
  let n = 0;
  const maxTries = 30;

  while (n <= maxTries) {
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: candidate, deviceId, score: 0 }),
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) return { name: candidate, reserved: true, offline: false };

      if (res.status === 409) {
        n++;
        candidate = `${trimmed}${n}`;
        continue;
      }

      // Some other server error — don't loop forever, just leave unverified
      return { name: candidate, reserved: false, offline: false };
    } catch (_) {
      // Backend unreachable (offline / server down)
      return { name: candidate, reserved: false, offline: true };
    }
  }

  return { name: candidate, reserved: false, offline: false };
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
// Live-typing: just save as-is, don't rename mid-typing.
nameInput.addEventListener('input', () => {
  nameCount.textContent = nameInput.value.length;
  currentSettings.playerName = nameInput.value.trim();
  saveSettings(currentSettings);
});

// Finalize name: reserve it with the backend (tied to this device's id)
// and auto-append 1, 2, 3... if someone else already owns it.
async function finalizeName() {
  const typed = nameInput.value.trim();
  if (!typed) {
    currentSettings.playerName = '';
    saveSettings(currentSettings);
    return;
  }

  const deviceId = getDeviceId();
  const result = await reserveName(typed, deviceId);
  let finalName = result.name;

  if (result.offline) {
    // Can't reach the backend right now — best-effort local check only
    const existingNames = await getExistingNames();
    finalName = makeUniqueName(typed, existingNames, currentSettings.playerName);
  }

  if (finalName !== typed) {
    nameInput.value = finalName;
    nameCount.textContent = finalName.length;
  }

  currentSettings.playerName = finalName;
  saveSettings(currentSettings);
  showToast(finalName !== typed ? finalName : null);
}

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    finalizeName();
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
  finalizeName();
});

let toastTimer;
function showToast(renamedTo) {
  const t = I18N[currentSettings.language] || I18N.th;
  clearTimeout(toastTimer);
  toast.textContent = renamedTo ? t.toastRenamed(renamedTo) : t.toast;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

initUI();
