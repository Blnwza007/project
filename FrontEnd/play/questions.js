import { input, submit, loseLife, resetHearts, updateChaserDistance } from "./script.js"
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
  if (streakWrap) streakWrap.style.display = 'none';
  input.disabled = false
  document.getElementById('gameOverScreen')?.classList.add('hidden')
  showQuestion()
}

document.getElementById('restartBtn')?.addEventListener('click', restartGame)

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
    return { q: `${base}^${exp1} × ${base}^${exp2} = ?`, ans: (`${base}^${(exp1 + exp2)}`), type: 'string' }
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

  if (type === 'mean') {
    const data = Array.from({ length: size }, () => rand(1, 10))
    const mean = data.reduce((a, b) => a + b, 0) / data.length
    if (!Number.isInteger(mean)) return genStats(level)  
    return { q: `{${data.join(', ')}} → ค่าเฉลี่ยเลขคณิต = ?`, ans: mean }
  }

  if (type === 'median') {
    const data = Array.from({ length: size }, () => rand(1, 10)).sort((a,b) => a - b)
    const mid  = Math.floor(data.length / 2)
    const median = data[mid]
    return { q: `{${data.join(', ')}} → มัธยฐาน = ?`, ans: median }
  }

  if (type === 'mode') {
    const modeVal = rand(1, 5)
    const others = Array.from({ length: size - 1 }, () => {
      let v
      do { v = rand(1, 10) } while (v === modeVal)
      return v
    })
    const data = shuffle([modeVal, modeVal, modeVal, ...others])
    return { q: `{${data.join(', ')}} → ฐานนิยม = ?`, ans: modeVal }
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

const showQuestion = () => {
  let question;
  const isBoss = currentLevel % 5 === 0;
  
  if (isBoss) {
    document.body.classList.add('boss-active');
    document.getElementById('bossEntity').classList.remove('hidden');
    document.getElementById('tierBadge').textContent = `💀 BOSS LEVEL ${currentLevel} 💀`;
  } else {
    document.body.classList.remove('boss-active');
    document.getElementById('bossEntity').classList.add('hidden');
    document.getElementById('tierBadge').textContent = `LEVEL ${currentLevel}`;
  }

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
  const answerType = typeof ans === 'string' ? 'string' : 'number'
  currentQuestion = { q, ans, type: answerType }
  input.value = ''
  console.log('currentLevel', currentLevel, 'ans', ans)
  document.getElementById('questionDisplay').textContent = q
  document.getElementById('tierDisplay').textContent = currentLevel
  
  // Boss gets less time
  startTimer(isBoss ? 15 : 30)
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
    streakText.textContent = `ตอบถูก ${currentStreak} ข้อติดต่อกัน`;
    totalPoints += 1; // +1 extra point for being on fire
  }
  
  score.innerText = `${Number(score.innerText) + totalPoints}`;
  showFloatingScore(totalPoints);
  
  advanceLevel();
  console.log('nice');
  input.value = '';
}

const handleWrongAnswer = () => {
  currentStreak = 0;
  streakWrap.style.display = 'none';
  console.log('kuy');
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