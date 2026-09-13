import { input, submit, loseLife, resetHearts, updateChaserDistance, playLanguage, playText } from "./script.js"
import { randomPick, rand, randNeg, shuffle, triples } from "./helperFunc.js"

const raw = localStorage.getItem('mathRunner')
const states = raw ? JSON.parse(raw) : { currentLevel: 1 }
let currentLevel = Number(states.currentLevel) || 1
let currentQuestion = null;
let timerId = null;
let timeLeft = 30;
let maxTime = 30;
const timerText = document.getElementById('timerText');
const timerBar = document.getElementById('timerBar');
const score = document.getElementById('scoreDisplay');

const translateQuestion = (question) => {
  if (playLanguage !== 'en') return question;

  const translations = [
    ['วงกลม', 'Circle'], ['พื้นที่', 'area'], ['เส้นรอบวง', 'circumference'],
    ['สามเหลี่ยม', 'Triangle'], ['ฐาน', 'base'], ['สูง', 'height'],
    ['ทรงกระบอก', 'Cylinder'], ['ปริมาตร', 'volume'], ['ค่าเฉลี่ยเลขคณิต', 'mean'],
    ['มัธยฐาน', 'median'], ['ฐานนิยม', 'mode'], ['ผลบวกของ root', 'sum of roots'],
    ['จุดยอด อยู่ที่', 'vertex at'], ['ค่าหนึ่ง', 'one root'], ['ของ', 'of'],
    ['ใช้', 'use'], ['ด่านบอส!', 'BOSS LEVEL!']
  ];

  return translations.reduce((text, [thai, english]) => text.replaceAll(thai, english), question);
};

const advanceLevel = () => {
  currentLevel = Number(currentLevel) + 1
  const state = { currentLevel }
  localStorage.setItem('mathRunner', JSON.stringify(state))
  showQuestion()
}

const restartGame = () => {
  localStorage.removeItem('mathRunner')
  currentLevel = 1
  score.textContent = '0'
  clearTimer()
  resetHearts()
  currentStreak = 0
  _wasJustBoss = false;
  hideBossTaunt();
  if (streakWrap) streakWrap.style.display = 'none';
  input.disabled = false
  document.getElementById('gameOverScreen')?.classList.add('hidden')
  showQuestion()
}

const resetProgress = () => {
  localStorage.removeItem('mathRunner');
  currentLevel = 1;
  if (score) score.textContent = '0';
  clearTimer();
  resetHearts();
};

document.getElementById('restartBtn')?.addEventListener('click', restartGame);
document.getElementById('homeBtn')?.addEventListener('click', resetProgress);
document.getElementById('menuBtn')?.addEventListener('click', resetProgress);
document.getElementById('menuLink')?.addEventListener('click', resetProgress);

const genPythagorean = (level) => {
  const maxIndex = Math.min(level, triples.length - 1)
  const [a, b, c] = triples[Math.floor(Math.random() * (maxIndex + 1))]
  const hide = ['a','b','c'][Math.floor(Math.random() * 3)]

  if (hide === 'c') return { q: `${a}^2 + ${b}^2 = c^2`, ans: c }
  if (hide === 'b') return { q: `${a}^2 + b^2 = ${c}^2`, ans: b }
  if (hide === 'a') return { q: `a^2 + ${b}^2 = ${c}^2`, ans: a }
}

const genExponent = (level) => {
  const type = randomPick(['power', 'sqrt', 'law'])
  const base = rand(2, Math.min(10, level + 2))

  if (type === 'power') {
    const exp = rand(2, 3)
    return { q: `${base}^${exp} = ?`, ans: base ** exp }
  } else if (type === 'sqrt') {
    const value = base ** 2
    return { q: `√${value} = ?`, ans: base }
  } else {
    const exp1 = rand(2, 5)
    const exp2 = rand(2, 5)
    return { q: `${base}^${exp1} × ${base}^${exp2} = ? \n Ex: 1^2 x 1^2 = 1^4`, ans: (`${base}^${(exp1 + exp2)}`), type: 'string' }
  }
}

const genInteger = (level) => {
  const type = randomPick(['multiply', 'divide', 'absolute'])
  const scale = 3 + level
  const a = randNeg(scale)
  const b = randNeg(scale)

  if (type === 'multiply') {
    return { q: `(${a}) × (${b}) = ?`, ans: a * b }
  }

  if (type === 'divide') {
    let divisor = randNeg(scale)
    while (divisor === 0) divisor = randNeg(scale)
    const quotient = rand(1, Math.max(1, level))
    const dividend = divisor * quotient
    return { q: `(${dividend}) ÷ (${divisor}) = ?`, ans: quotient }
  }

  return { q: `|${a}| = ?`, ans: Math.abs(a) }
}

const genTier1 = (level) => {
  const topic = randomPick(['pythagorean', 'exponent', 'integer'])

  if (topic === 'pythagorean') return genPythagorean(level)
  if (topic === 'exponent')    return genExponent(level)
  if (topic === 'integer')     return genInteger(level)
}

const gcd = (a, b) => {
  while (b !== 0) {
    [a, b] = [b, a % b]
  }
  return a
}

const genProportion = (level) => {
  const type = randomPick(['ratio', 'percent'])

  if (type === 'ratio') {
    const b = rand(2, 5 + level)
    const d = rand(2, 5 + level)
    const x = rand(1, 10 + level)  
    const a = x * d / b            
    if (!Number.isInteger(a)) return genProportion(level)  
    return { q: `x/${b} = ${a}/${d} → x=?`, ans: x }
  }

  if (type === 'percent') {
    const percents = [10, 15, 20, 25, 30, 40, 50]
    const p   = randomPick(percents)
    const divisor = 100 / gcd(p, 100)
    const multiplier = rand(Math.ceil(10 / divisor), Math.floor((20 + level * 10) / divisor))
    const num = divisor * multiplier
    return { q: `${p}% ของ ${num} = ?`, ans: (p * num) / 100 }
  }
}

const genStats = (level) => {
  const type = randomPick(['mean', 'median', 'mode'])
  const size = 5  
  const labels = playLanguage === 'en'
    ? { mean: 'mean', median: 'median', mode: 'mode' }
    : { mean: 'ค่าเฉลี่ยเลขคณิต', median: 'มัธยฐาน', mode: 'ฐานนิยม' }

  if (type === 'mean') {
    const data = Array.from({ length: size }, () => rand(1, 10))
    const mean = data.reduce((a, b) => a + b, 0) / data.length
    if (!Number.isInteger(mean)) return genStats(level)  
    return { q: `{${data.join(', ')}} → ${labels.mean} = ?`, ans: mean }
  }

  if (type === 'median') {
    const data = Array.from({ length: size }, () => rand(1, 10)).sort((a,b) => a - b)
    const mid  = Math.floor(data.length / 2)
    const median = data[mid]
    return { q: `{${data.join(', ')}} → ${labels.median} = ?`, ans: median }
  }

  if (type === 'mode') {
    const modeVal = rand(1, 5)
    const others = Array.from({ length: size - 1 }, () => {
      let v
      do { v = rand(1, 10) } while (v === modeVal)
      return v
    })
    const data = shuffle([modeVal, modeVal, modeVal, ...others])
    return { q: `{${data.join(', ')}} → ${labels.mode} = ?`, ans: modeVal }
  }
}

const genGeometry = (level) => {
  const type = randomPick(['circle', 'triangle', 'cylinder'])

  if (type === 'circle') {
    const ask = randomPick(['area', 'circumference'])
    let multiple;
    
    if (ask === 'area') {
      multiple = 1; 
    } else {
      multiple = rand(1, Math.min(10, 1 + Math.floor(level / 3)))
    }
    
    const r = 7 * multiple
    if (ask === 'area') {
      const ans = (22 * r * r) / 7
      return { q: `วงกลม r=${r} → พื้นที่=? (ใช้ π=22/7)`, ans }
    } else {
      const ans = (2 * 22 * r) / 7
      return { q: `วงกลม r=${r} → เส้นรอบวง=? (ใช้ π=22/7)`, ans }
    }
  }

  if (type === 'triangle') {
    let b, h, ans;
    do {
      b = rand(2, Math.min(30, 5 + level))
      h = 2 * rand(1, Math.min(15, Math.floor((5 + level) / 2)))
      ans = (b * h) / 2
    } while (ans > 500)
    
    return { q: `สามเหลี่ยม ฐาน=${b} สูง=${h} → พื้นที่=?`, ans }
  }

  if (type === 'cylinder') {
    let r, h_mult, h, ans;
    do {
      r = rand(1, 3)
      h_mult = rand(1, Math.min(5, 1 + Math.floor(level / 10)))
      h = 7 * h_mult
      ans = (22 * r * r * h) / 7
    } while (ans > 500)
    
    return { q: `ทรงกระบอก r=${r} h=${h} → ปริมาตร=? (ใช้ π=22/7)`, ans }
  }
}

const genTier2 = (level) => {
  const topic = randomPick(['proportion', 'stats', 'geometry'])

  if (topic === 'proportion') return genProportion(level)
  if (topic === 'stats') return genStats(level)
  if (topic === 'geometry') return genGeometry(level)
}

const genLinear = (level) => {
  const type = randomPick(['basic', 'negative', 'fraction'])

  if (type === 'basic') {
    const x = rand(1, 5 + level)
    const a = rand(2, 5)
    const b = rand(1, 20)
    const c = a * x + b
    return { q: `${a}x + ${b} = ${c}  → x=?`, ans: x }
  }

  if (type === 'negative') {
    const x = rand(1, 5 + level)
    const a = rand(2, 5)
    const b = rand(1, 20)
    const c = a * x - b
    return { q: `${a}x - ${b} = ${c}  → x=?`, ans: x }
  }

  if (type === 'fraction') {
    const a = rand(2, 5)
    const x = rand(1, 10) * a   
    const b = rand(1, 10)
    const c = x / a + b
    return { q: `x/${a} + ${b} = ${c}  → x=?`, ans: x }
  }
}

const genSystem = (level) => {
  const type = randomPick(['findX', 'findY', 'both'])

  if (type === 'findX') {
    const x = rand(1, 5 + level)
    const y = rand(1, 5 + level)
    const a = rand(1, 4)
    const b = rand(1, 4)
    const c = a * x + b * y
    return { q: `${a}x + ${b*y} = ${c}  → x=?`, ans: x }
  }

  if (type === 'findY') {
    const x = rand(1, 5 + level)
    const y = rand(1, 5 + level)
    const a = rand(1, 4)
    const b = rand(1, 4)
    const c = a * x + b * y
    return { q: `${a*x} + ${b}y = ${c}  → y=?`, ans: y }
  }

  if (type === 'both') {
    const x = rand(1, 5 + level)
    const y = rand(1, 5 + level)
    const c1 = x + y
    const c2 = x - y
    return {
      q: `x + y = ${c1}\nx - y = ${c2}  → x=?`,
      ans: x
    }
  }
}

const genParabola = (level) => {
  const type = randomPick(['xIntercept', 'vertex', 'sumRoots'])
  const scale = 1 + Math.floor((level - 101) / 10)  

  if (type === 'xIntercept') {
    const r1 = rand(-4 * scale, 4 * scale)
    const r2 = rand(-4 * scale, 4 * scale)
    const a  = rand(1, 2 + scale)
    const b  = -a * (r1 + r2)
    const c  =  a * (r1 * r2)
    const bStr = b >= 0 ? `+${b}` : `${b}`
    const cStr = c >= 0 ? `+${c}` : `${c}`
    const askRoot = randomPick([r1, r2])
    return {
      q: `y = ${a}x²${bStr}x${cStr}\ny = 0 → x ค่าหนึ่ง = ?`,
      ans: askRoot
    }
  }

  if (type === 'vertex') {
    const r1 = rand(-4 * scale, 4 * scale)
    const r2 = rand(-4 * scale, 4 * scale)
    const a  = rand(1, 2 + scale)
    const b  = -a * (r1 + r2)
    const c  =  a * (r1 * r2)
    const vertexX = (r1 + r2) / 2  
    if (!Number.isInteger(vertexX)) return genParabola(level) 
    const bStr = b >= 0 ? `+${b}` : `${b}`
    const cStr = c >= 0 ? `+${c}` : `${c}`
    return {
      q: `y = ${a}x²${bStr}x${cStr}\nจุดยอด อยู่ที่ x = ?`,
      ans: vertexX
    }
  }

  if (type === 'sumRoots') {
    const r1 = rand(-4 * scale, 4 * scale)
    const r2 = rand(-4 * scale, 4 * scale)
    const a  = rand(1, 2 + scale)
    const b  = -a * (r1 + r2)
    const c  =  a * (r1 * r2)
    const bStr = b >= 0 ? `+${b}` : `${b}`
    const cStr = c >= 0 ? `+${c}` : `${c}`
    return {
      q: `y = ${a}x²${bStr}x${cStr}\nผลบวกของ root = ?`,
      ans: r1 + r2
    }
  }
}

const clearTimer = () => {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
}

const updateTimerDisplay = () => {
  if (timerText) {
    timerText.textContent = String(timeLeft)
  }

  const percent = Math.max(0, (timeLeft / maxTime));
  if (timerBar) {
    timerBar.style.width = `${percent * 100}%`
  }
  
  // อัปเดตระยะห่างของตัววิ่งไล่
  if (typeof updateChaserDistance === 'function') {
      updateChaserDistance(percent);
  }
}

const startTimer = (seconds = 30) => {
  clearTimer()
  timeLeft = seconds
  maxTime = seconds
  updateTimerDisplay()
  console.log('timer start', timeLeft)

  timerId = setInterval(() => {
    timeLeft -= 1
    updateTimerDisplay()
    console.log('timeLeft', timeLeft)

    if (timeLeft <= 0) {
      clearTimer()
      const remaining = loseLife()
      if (remaining > 0) showQuestion()
    }
  }, 1000)
}

// ── Boss FX ────────────────────────────────────────────────────────────────

const STORAGE_KEY_SETTINGS = 'mathrunner_settings';
const _settingsRaw = localStorage.getItem(STORAGE_KEY_SETTINGS);
const _settings = _settingsRaw ? JSON.parse(_settingsRaw) : { language: 'th' };
const bossLang = (_settings.language === 'en') ? 'en' : 'th';

const BOSS_TAUNT_LINES = {
  th: {
    start: ['ง่ายจัง!', 'มาเลย ถ้ากล้า!', '∑ นี่ยากไปไหมล่ะ?', 'เวลามีนิดเดียว...', 'π ≈ 3.14 จำได้ไหม?', 'คิดช้าแพ้แล้ว!', '∞ คะแนนไม่มีหรอก!'],
    wrong: ['ผิดอีกแล้ว!', 'แย่จัง~', 'ง่ายขนาดนี้ยังทำไม่ได้?', 'x ≠ คำตอบของเธอ!', 'ลองใหม่... ถ้ายังมีเวลา', 'ha! ผิด!', '∆ความรู้ = 0?'],
  },
  en: {
    start: ['Too easy!', 'Come on, if you dare!', 'Can you solve ∑?', 'Tick tock...', 'π ≈ 3.14, know it?', 'Think faster!', '∞ score? Not for you!'],
    wrong: ['Wrong again!', 'Pathetic~', "Can't solve this easy one?", 'x ≠ your answer!', 'Try again... if you have time', 'ha! Wrong!', '∆knowledge = 0?'],
  }
};

const MATH_SYMBOLS = ['∑', 'π', '∞', '√', 'Δ', '∫', '±', '×', '÷', 'θ', 'α', 'β', 'λ', '≠', '≈', '∂', '∇', '∈', '∏', 'φ'];
const MATH_EQUATIONS = ['2+2=4', 'x²+y²=r²', 'E=mc²', 'a²+b²=c²', 'f(x)=ax+b', '∑n=n(n+1)/2', 'sinθ/cosθ=tanθ', 'πr²', '∫f(x)dx', 'y=mx+c'];

let tauntTimer = null;
const bossTauntEl = document.getElementById('bossTaunt');
const bossTauntText = document.getElementById('bossTauntText');

const showBossTaunt = (type = 'start') => {
  if (!bossTauntEl) return;
  if (tauntTimer) clearTimeout(tauntTimer);

  const lines = BOSS_TAUNT_LINES[bossLang][type];
  const line = lines[Math.floor(Math.random() * lines.length)];
  bossTauntText.textContent = line;

  bossTauntEl.classList.remove('hidden', 'leaving');
  // Force reflow so animation restarts
  void bossTauntEl.offsetWidth;

  tauntTimer = setTimeout(() => {
    bossTauntEl.classList.add('leaving');
    bossTauntEl.addEventListener('animationend', () => {
      bossTauntEl.classList.add('hidden');
      bossTauntEl.classList.remove('leaving');
    }, { once: true });
  }, 2800);
};

const hideBossTaunt = () => {
  if (tauntTimer) clearTimeout(tauntTimer);
  bossTauntEl?.classList.add('hidden');
  bossTauntEl?.classList.remove('leaving');
};

// Math symbol rain background during countdown
const spawnCountdownSymbols = (container) => {
  const symbols = [...MATH_SYMBOLS];
  for (let i = 0; i < 18; i++) {
    const el = document.createElement('span');
    el.classList.add('countdown-math-symbol');
    el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    const size = 1.2 + Math.random() * 3;
    const dur = 3 + Math.random() * 3;
    const delay = Math.random() * 2;
    el.style.cssText = `
      left: ${Math.random() * 100}%;
      --sym-size: ${size}rem;
      --sym-dur: ${dur}s;
      --sym-delay: ${delay}s;
    `;
    container.appendChild(el);
  }
};

// Boss Victory — symbols burst out from boss image + equation rain
const triggerBossVictory = () => {
  const bossImg = document.getElementById('bossEntity');
  if (bossImg) {
    const rect = bossImg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    for (let i = 0; i < 14; i++) {
      const el = document.createElement('span');
      el.classList.add('boss-victory-symbol');
      el.textContent = MATH_SYMBOLS[Math.floor(Math.random() * MATH_SYMBOLS.length)];
      const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
      const dist = 80 + Math.random() * 140;
      const vx = Math.cos(angle) * dist;
      const vy = Math.sin(angle) * dist;
      const size = 1.2 + Math.random() * 2;
      el.style.cssText = `
        left: ${cx}px; top: ${cy}px;
        --vx: ${vx}px; --vy: ${vy}px;
        --vs-color: ${['#ffc700','#ff5252','#64ffda','#fff','#ff8c00'][i % 5]};
        --vs-size: ${size}rem;
        --vs-delay: ${Math.random() * 0.15}s;
      `;
      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }
  }

  // Equation rain
  const rainItems = [...MATH_EQUATIONS, ...MATH_SYMBOLS];
  for (let i = 0; i < 22; i++) {
    const el = document.createElement('span');
    el.classList.add('math-rain-symbol');
    el.textContent = rainItems[Math.floor(Math.random() * rainItems.length)];
    const dur = 1.2 + Math.random() * 1.5;
    const delay = Math.random() * 1.5;
    const size = 1 + Math.random() * 1.8;
    el.style.cssText = `
      left: ${Math.random() * 100}%;
      --rain-color: ${['#ffc700','#ff5252','#64ffda','#fff176','#ce93d8'][i % 5]};
      --rain-size: ${size}rem;
      --rain-dur: ${dur}s;
      --rain-delay: ${delay}s;
    `;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
};

// Boss Countdown (3...2...1...BOSS!) — returns Promise that resolves when done
const runBossCountdown = () => new Promise((resolve) => {
  const overlay = document.getElementById('bossCountdown');
  const numEl   = document.getElementById('bossCountdownNum');
  const labelEl = document.getElementById('bossCountdownLabel');
  const bgEl    = document.getElementById('bossCountdownBg');

  if (!overlay) { resolve(); return; }

  // Spawn math symbols in background
  bgEl.innerHTML = '';
  spawnCountdownSymbols(bgEl);

  overlay.classList.remove('hidden');
  let count = 3;

  const step = () => {
    if (count > 0) {
      // Force re-trigger animation by cloning
      numEl.style.animation = 'none';
      void numEl.offsetWidth;
      numEl.style.animation = '';
      numEl.textContent = String(count);
      labelEl.textContent = '';
      count--;
      setTimeout(step, 900);
    } else {
      // Show "BOSS!"
      numEl.style.animation = 'none';
      void numEl.offsetWidth;
      numEl.style.animation = '';
      numEl.innerHTML = `<svg class="boss-countdown-skull" viewBox="0 0 40 40" width="100" height="100" fill="none">
        <path d="M8 18C8 10.5 13.5 5 20 5s12 5.5 12 13c0 5-2.5 9-5 11v6H13v-6c-2.5-2-5-6-5-11z" fill="#FF2A2A" stroke="#000" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="14" cy="17" r="3.5" fill="#1A0000"/>
        <circle cx="26" cy="17" r="3.5" fill="#1A0000"/>
        <path d="M20 21l-1.5 3h3L20 21z" fill="#1A0000"/>
        <path d="M16 29v6M20 29v6M24 29v6" stroke="#000" stroke-width="2"/>
      </svg>`;
      numEl.style.fontSize = '';

      labelEl.style.animation = 'none';
      void labelEl.offsetWidth;
      labelEl.style.animation = '';
      labelEl.textContent = bossLang === 'en' ? 'BOSS LEVEL!' : 'ด่านบอส!';

      setTimeout(() => {
        // Fade out overlay
        overlay.style.transition = 'opacity 0.4s';
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.classList.add('hidden');
          overlay.style.opacity = '';
          overlay.style.transition = '';
          numEl.innerHTML = '';
          bgEl.innerHTML = '';
          resolve();
        }, 400);
      }, 900);
    }
  };

  step();
});

// Track if current level was a boss (so we can show victory on advance)
let _wasJustBoss = false;

const showQuestion = () => {
  let question;
  const isBoss = currentLevel % 5 === 0;
  const isNewBoss = isBoss && !_wasJustBoss;

  const _renderQuestion = (showStartTaunt = false) => {
    // Generate slightly harder question for boss
    const effectiveLevel = isBoss ? currentLevel + 5 : currentLevel;

    if (effectiveLevel <= 10) {
      question = genTier1(effectiveLevel)
    } else if (effectiveLevel <= 25) {
      question = genTier2(effectiveLevel)
    } else if (effectiveLevel <= 40) {
      question = genLinear(effectiveLevel)
    } else if (effectiveLevel <= 60) {
      question = genSystem(effectiveLevel)
    } else {
      question = genParabola(effectiveLevel)
    }

    const { q, ans } = question
    const displayQuestion = translateQuestion(q)
    const answerType = typeof ans === 'string' ? 'string' : 'number'
    currentQuestion = { q, ans, type: answerType }
    input.value = ''
    console.log('currentLevel', currentLevel, 'ans', ans)
    document.getElementById('questionDisplay').textContent = displayQuestion
    document.getElementById('tierDisplay').textContent = currentLevel

    // Boss gets less time
    startTimer(isBoss ? 15 : 30)

    // Show the opening taunt only once when entering a boss level.
    if (showStartTaunt) setTimeout(() => showBossTaunt('start'), 300);
  };

  if (isBoss) {
    // Only show countdown if this is a NEW boss level (not re-showing after wrong answer)
    _wasJustBoss = true;

    document.body.classList.add('boss-active');
    document.getElementById('bossEntity').classList.remove('hidden');
    document.getElementById('tierBadge').textContent = playText.boss(currentLevel);

    if (isNewBoss) {
      clearTimer(); // pause timer during countdown
      runBossCountdown().then(() => _renderQuestion(true));
    } else {
      _renderQuestion();
    }
  } else {
    _wasJustBoss = false;
    document.body.classList.remove('boss-active');
    document.getElementById('bossEntity').classList.add('hidden');
    document.getElementById('tierBadge').textContent = playText.levelBadge(currentLevel);
    hideBossTaunt();
    _renderQuestion();
  }
}

let currentStreak = 0;
const streakWrap = document.getElementById('streakWrap');
const streakText = document.getElementById('streakText');

const showFloatingScore = (amount) => {
  const floatEl = document.createElement('div');
  floatEl.classList.add('floating-score');
  floatEl.textContent = `+${amount}`;
  
  // Position it near the center/score area
  const scoreRect = score.getBoundingClientRect();
  floatEl.style.left = `${scoreRect.left}px`;
  floatEl.style.top = `${scoreRect.top + 30}px`;
  
  document.body.appendChild(floatEl);
  
  // Remove after animation (1s)
  setTimeout(() => floatEl.remove(), 1000);
}

const handleCorrectAnswer = (basePoints) => {
  currentStreak++;
  let totalPoints = basePoints;
  
  // Streak Bonus Logic
  if (currentStreak >= 3) {
    streakWrap.style.display = 'flex';
    streakText.textContent = playText.streak(currentStreak);
    totalPoints += 1; // +1 extra point for being on fire
  }
  
  score.innerText = `${Number(score.innerText) + totalPoints}`;
  showFloatingScore(totalPoints);

  // Boss victory FX before advancing
  const justBeatenBoss = currentLevel % 5 === 0;
  if (justBeatenBoss) {
    hideBossTaunt();
    triggerBossVictory();
  }
  
  advanceLevel();
  console.log('nice');
  input.value = '';
}

const handleWrongAnswer = () => {
  currentStreak = 0;
  streakWrap.style.display = 'none';
  console.log('kuy');
  // Show boss wrong taunt if in boss level
  if (currentLevel % 5 === 0) {
    showBossTaunt('wrong');
  }
  const remaining = loseLife();
  if (remaining > 0) showQuestion();
}

const checkAnswer = () => {
  if (!currentQuestion) {
    console.log('ยังไม่มีคำถาม')
    return
  }

  const rawInput = input.value.trim()
  const isBoss = currentLevel % 5 === 0;
  const points = isBoss ? 5 : 1;

  if (currentQuestion.type === 'string') {
    if (rawInput.toLowerCase() === String(currentQuestion.ans).trim().toLowerCase()) {
      handleCorrectAnswer(points);
    } else {
      handleWrongAnswer();
    }
    return
  }

  const userValue = Number(rawInput)
  const correctValue = Number(currentQuestion.ans)

  if (Number.isNaN(userValue)) {
    console.log('กรุณากรอกตัวเลข')
    return
  }

  if (userValue === correctValue) {
    handleCorrectAnswer(points);
  } else {
    handleWrongAnswer();
  }
}

submit.addEventListener('click', checkAnswer)

input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    checkAnswer()
  }
})

showQuestion()