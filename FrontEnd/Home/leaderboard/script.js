const lbLoading    = document.getElementById("lbLoading");
const lbEmpty      = document.getElementById("lbEmpty");
const lbError      = document.getElementById("lbError");
const lbErrorMsg   = document.getElementById("lbErrorMsg");
const lbPodium     = document.getElementById("lbPodium");
const lbTableWrap  = document.getElementById("lbTableWrap");
const lbTableBody  = document.getElementById("lbTableBody");
const myRankBar    = document.getElementById("myRank");
const myRankNum    = document.getElementById("myRankNum");
const myRankScore  = document.getElementById("myRankScore");
const retryBtn     = document.getElementById("retryBtn");
const lbTabs       = document.getElementById("lbTabs");

const lbBackBtn     = document.getElementById("lbBackBtn");
const lbTitle       = document.getElementById("lbTitle");
const lbSubtitle    = document.getElementById("lbSubtitle");
const lbLoadingText = document.getElementById("lbLoadingText");
const lbEmptyText   = document.getElementById("lbEmptyText");
const thRank        = document.getElementById("thRank");
const thName        = document.getElementById("thName");
const thScore       = document.getElementById("thScore");
const thLevel       = document.getElementById("thLevel");
const myRankLabel   = document.getElementById("myRankLabel");

const SETTINGS_KEY    = "mathrunner_settings";
const LEADERBOARD_KEY = "mathRunnerLeaderboard";
const DEVICE_ID_KEY   = "mathrunner_deviceId";

const savedSettings = (() => {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch { return {}; }
})();

const currentLang = savedSettings.language === "en" ? "en" : "th";
const myName = savedSettings.playerName || null;

// Same device-identity helper as settings/play — this, not the name,
// is what determines which row on the leaderboard is actually "me".
function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}
const myDeviceId = getDeviceId();

// ── Multi-language dictionary (Usernames are NEVER translated) ────────────
const LB_I18N = {
  th: {
    pageTitle: "กระดานอันดับ — Math Runner",
    backBtn: "← กลับ",
    title: "กระดานอันดับ",
    subtitle: "Math Runner",
    loading: "กำลังโหลด...",
    empty: "ยังไม่มีข้อมูลในกระดานนี้",
    error: "เกิดข้อผิดพลาด กรุณาลองใหม่",
    retry: "ลองใหม่",
    thRank: "อันดับ",
    thName: "ชื่อผู้เล่น",
    thScore: "คะแนน",
    thLevel: "Level",
    meTag: "ฉัน",
    unknownPlayer: "ไม่ระบุ",
    ptsPodium: "แต้ม",
    myRankLabel: "อันดับของคุณ",
    ptsMyRank: "คะแนน"
  },
  en: {
    pageTitle: "Leaderboard — Math Runner",
    backBtn: "← Back",
    title: "LEADERBOARD",
    subtitle: "Math Runner",
    loading: "Loading...",
    empty: "No leaderboard data yet",
    error: "An error occurred, please try again",
    retry: "Retry",
    thRank: "Rank",
    thName: "Player",
    thScore: "Score",
    thLevel: "Level",
    meTag: "YOU",
    unknownPlayer: "Anonymous",
    ptsPodium: "PTS",
    myRankLabel: "YOUR RANK",
    ptsMyRank: "PTS"
  }
};

const t = LB_I18N[currentLang] || LB_I18N.th;

function applyLanguage(lang) {
  const trans = LB_I18N[lang] || LB_I18N.th;
  document.documentElement.lang = lang;
  document.title = trans.pageTitle;
  if (lbBackBtn)     lbBackBtn.textContent     = trans.backBtn;
  if (lbTitle)       lbTitle.textContent       = trans.title;
  if (lbSubtitle)    lbSubtitle.textContent    = trans.subtitle;
  if (lbLoadingText) lbLoadingText.textContent = trans.loading;
  if (lbEmptyText)   lbEmptyText.textContent   = trans.empty;
  if (retryBtn)      retryBtn.textContent      = trans.retry;
  if (thRank)        thRank.textContent        = trans.thRank;
  if (thName)        thName.textContent        = trans.thName;
  if (thScore)       thScore.textContent       = trans.thScore;
  if (thLevel)       thLevel.textContent       = trans.thLevel;
  if (myRankLabel)   myRankLabel.textContent   = trans.myRankLabel;
}

applyLanguage(currentLang);

// ── State helpers ─────────────────────────────────────────────────────────
function showOnly(...visible) {
  [lbLoading, lbEmpty, lbError, lbPodium, lbTableWrap].forEach(el => {
    el.classList.toggle("hidden", !visible.includes(el));
  });
}

function setState(state) {
  switch (state) {
    case "loading": showOnly(lbLoading); break;
    case "empty":   showOnly(lbEmpty);   break;
    case "error":   showOnly(lbError);   break;
    case "data":    showOnly(lbPodium, lbTableWrap); break;
  }
}

// ── Avatar helper (custom vector medal by rank) ───────────────────────────
function getAvatar(rank, entry) {
  if (entry && entry.avatar) {
    return `<img src="${entry.avatar}" class="avatar-img" alt="${rank}">`;
  }
  const medalSvgs = {
    1: `<svg class="rank-medal-svg" viewBox="0 0 36 36">
          <path d="M12 2 L9 16 L14 14 L18 16 L16 2 Z" fill="#E53935" stroke="#000" stroke-width="1.2"/>
          <path d="M24 2 L27 16 L22 14 L18 16 L20 2 Z" fill="#1E88E5" stroke="#000" stroke-width="1.2"/>
          <circle cx="18" cy="22" r="11.5" fill="#FFC700" stroke="#000" stroke-width="2"/>
          <circle cx="18" cy="22" r="9" fill="none" stroke="#FFE57F" stroke-width="1.2" stroke-dasharray="2 1"/>
          <text x="18" y="26.5" font-family="'Russo One', sans-serif" font-size="13" font-weight="bold" fill="#6B4E00" text-anchor="middle">1</text>
        </svg>`,
    2: `<svg class="rank-medal-svg" viewBox="0 0 36 36">
          <path d="M12 2 L9 16 L14 14 L18 16 L20 2 Z" fill="#1E88E5" stroke="#000" stroke-width="1.2"/>
          <path d="M24 2 L27 16 L22 14 L18 16 L16 2 Z" fill="#E53935" stroke="#000" stroke-width="1.2"/>
          <circle cx="18" cy="22" r="11.5" fill="#D6D6D6" stroke="#000" stroke-width="2"/>
          <circle cx="18" cy="22" r="9" fill="none" stroke="#F5F5F5" stroke-width="1.2" stroke-dasharray="2 1"/>
          <text x="18" y="26.5" font-family="'Russo One', sans-serif" font-size="13" font-weight="bold" fill="#3E3E3E" text-anchor="middle">2</text>
        </svg>`,
    3: `<svg class="rank-medal-svg" viewBox="0 0 36 36">
          <path d="M12 2 L9 16 L14 14 L18 16 L20 2 Z" fill="#43A047" stroke="#000" stroke-width="1.2"/>
          <path d="M24 2 L27 16 L22 14 L18 16 L16 2 Z" fill="#FB8C00" stroke="#000" stroke-width="1.2"/>
          <circle cx="18" cy="22" r="11.5" fill="#CD7F32" stroke="#000" stroke-width="2"/>
          <circle cx="18" cy="22" r="9" fill="none" stroke="#FFCC99" stroke-width="1.2" stroke-dasharray="2 1"/>
          <text x="18" y="26.5" font-family="'Russo One', sans-serif" font-size="13" font-weight="bold" fill="#4A2604" text-anchor="middle">3</text>
        </svg>`
  };
  return medalSvgs[rank] || `<span class="default-avatar">#${rank}</span>`;
}

// ── Render podium (top 3) ─────────────────────────────────────────────────
function renderPodium(entries) {
  [1, 2, 3].forEach(rank => {
    const entry = entries[rank - 1];
    const avatar = document.getElementById(`avatar${rank}`);
    const name   = document.getElementById(`name${rank}`);
    const score  = document.getElementById(`score${rank}`);
    const level  = document.getElementById(`level${rank}`);

    if (avatar) avatar.innerHTML   = entry ? getAvatar(rank, entry) : "—";
    // Keep username intact (no translation)
    if (name)   name.textContent   = entry ? (entry.name || t.unknownPlayer) : "—";
    if (score)  score.textContent  = entry ? `${entry.score.toLocaleString()} ${t.ptsPodium}` : "";
    if (level)  level.textContent  = entry ? `Level ${entry.level ?? "—"}` : "Level —";
  });
}

// ── Render table (rank 4+) ────────────────────────────────────────────────
function renderTable(entries, myDeviceId) {
  lbTableBody.innerHTML = "";
  const rest = entries.slice(3);

  if (rest.length === 0) return;

  rest.forEach(entry => {
    const rank  = entry.rank  ?? "—";
    // Keep username intact (no translation)
    const name  = entry.name  || t.unknownPlayer;
    const score = entry.score ?? 0;
    const level = entry.level ?? "—";

    // "Me" is determined by this device's id, never by the name string —
    // two different devices can pick the same display name.
    const isMe = Boolean(myDeviceId && entry.deviceId && entry.deviceId === myDeviceId);

    const tr = document.createElement("tr");
    if (isMe) tr.classList.add("is-me");

    let badgeClass = "";
    if (rank === 4)                    badgeClass = "top4";
    else if (rank === 5)               badgeClass = "top5";
    else if (rank >= 6 && rank <= 10)  badgeClass = "top10";

    const starIcon = `<span class="star-badge"><svg width="15" height="15" viewBox="0 0 24 24" fill="#FFC700" stroke="#000" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></span>`;
    const meTag = ` <span class="me-tag">${t.meTag}</span>`;

    tr.innerHTML = `
      <td class="col-rank"><span class="rank-badge ${badgeClass}">${rank}</span></td>
      <td class="col-name">${isMe ? starIcon : ""}${name}${isMe ? meTag : ""}</td>
      <td class="col-score td-score">${score.toLocaleString()}</td>
      <td class="col-level">${level}</td>
    `;
    lbTableBody.appendChild(tr);
  });
}

// ── Render my-rank bar ────────────────────────────────────────────────────
function renderMyRank(entries, myDeviceId) {
  if (!myDeviceId) { myRankBar.classList.add("hidden"); return; }

  const found = entries.find(e => e.deviceId && e.deviceId === myDeviceId);
  if (!found) { myRankBar.classList.add("hidden"); return; }

  myRankBar.classList.remove("hidden");
  myRankNum.textContent   = `#${found.rank ?? "—"}`;
  myRankScore.textContent = `${(found.score ?? 0).toLocaleString()} ${t.ptsMyRank}`;
}

// ── Public: load data ─────────────────────────────────────────────────────
/**
 * @param {Array<{rank:number, name:string, score:number, level:number|string, deviceId?:string}>} data
 * @param {string} [myDeviceIdOverride] - optional, highlights the player owning this device id
 */
window.loadLeaderboard = function (data, myDeviceIdOverride) {
  const idToMatch = myDeviceIdOverride ?? myDeviceId;

  if (!Array.isArray(data) || data.length === 0) {
    setState("empty");
    return;
  }

  setState("data");
  renderPodium(data);
  renderTable(data, idToMatch);
  renderMyRank(data, idToMatch);
};

// ── Public: show error ────────────────────────────────────────────────────
window.showLeaderboardError = function (message) {
  lbErrorMsg.textContent = message || t.error;
  setState("error");
};

let currentFilter = "all";
if (lbTabs) {
  lbTabs.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      lbTabs.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;

      if (typeof window.onFilterChange === "function") {
        setState("loading");
        window.onFilterChange(currentFilter);
      }
    });
  });
}

// ── Retry button ──────────────────────────────────────────────────────────
retryBtn.addEventListener("click", () => {
  fetchAndRender();
});

// ── Load Leaderboard: Backend API → fallback localStorage ─────────────────
const API_URL = "https://project-vw4a.onrender.com";

async function fetchAndRender() {
  setState("loading");

  // 1) พยายามดึงจาก Backend
  try {
    const res = await fetch(`${API_URL}/scores`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const apiData = (json.data || []).map((item, i) => ({
      rank:  i + 1,
      name:  item.playerName,
      score: item.score  || 0,
      level: item.level  || 1,
      deviceId: item.deviceId || null,
    }));

    if (apiData.length > 0) {
      window.loadLeaderboard(apiData, myDeviceId);
      return;
    }
  } catch (err) {
    console.warn("⚠️ ดึงข้อมูลจาก Backend ไม่ได้:", err.message);
  }

  // 2) Fallback: localStorage + mock
  let savedList = [];
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) savedList = parsed;
    }
  } catch (_) {}

  const fallbackMock = [
    { name: "kuaitun",       score: 9500, level: 50 },
    { name: "boom",          score: 8200, level: 42 },
    { name: "pansa",         score: 7100, level: 35 },
    { name: "BeemTheGoat",   score: 6500, level: 30 },
    { name: "GotLoveFemboy", score: 5400, level: 25 },
    { name: "Tim",           score: 4300, level: 18 },
    { name: "kingofnok",     score: 3200, level: 12 },
  ];

  const combined = [...savedList, ...fallbackMock];
  combined.sort((a, b) => (b.score || 0) - (a.score || 0));

  const rankedData = combined.slice(0, 20).map((item, i) => ({
    rank:  i + 1,
    name:  item.name || item.playerName,
    score: item.score || 0,
    level: item.level || 1,
    deviceId: item.deviceId || null,
  }));

  window.loadLeaderboard(rankedData, myDeviceId);
}

fetchAndRender();
