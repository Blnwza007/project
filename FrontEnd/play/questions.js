import { input, submit, loseLife, resetHearts } from "./script.js"
import { randomPick, rand, randNeg, shuffle, triples } from "./helperFunc.js"

const raw = localStorage.getItem('mathRunner')
const states = raw ? JSON.parse(raw) : { currentLevel: 1 }
let currentLevel = Number(states.currentLevel) || 1
let currentQuestion = null;
let timerId = null;
let timeLeft = 30;
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
    const exp1 = rand(2, 3)
    const exp2 = rand(2, 3)
    return { q: `${base}^${exp1} × ${base}^${exp2} = ?`, ans: (`${base}^${(exp1 + exp2)}`), type: 'string' }
  }
}

const genInteger = (level) => {
  const type = randomPick(['multiply', 'divide', 'absolute'])
  const scale = 3 + level * 2
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
    const num = rand(10, 20 + level * 10) * 10  
    return { q: `${p}% ของ ${num} = ?`, ans: (p / 100) * num }
  }
}

const genStats = (level) => {
  const type = randomPick(['mean', 'median', 'mode'])
  const size = 5  

  if (type === 'mean') {
    const data = Array.from({ length: size }, () => rand(1, 20))
    const mean = data.reduce((a, b) => a + b, 0) / data.length
    if (!Number.isInteger(mean)) return genStats(level)  
    return { q: `{${data.join(', ')}} → ค่าเฉลี่ยเลขคณิต = ?`, ans: mean }
  }

  if (type === 'median') {
    const data = Array.from({ length: size }, () => rand(1, 20)).sort((a,b) => a - b)
    const mid  = Math.floor(data.length / 2)
    const median = data[mid]
    return { q: `{${data.join(', ')}} → มัธยฐาน = ?`, ans: median }
  }

  if (type === 'mode') {
    const data  = Array.from({ length: size }, () => rand(1, 15))
    const modeVal = randomPick(data)
    data.push(modeVal, modeVal)  
    const shuffled = shuffle(data)
    return { q: `{${shuffled.join(', ')}} → ฐานนิยม = ?`, ans: modeVal }
  }
}

const genGeometry = (level) => {
  const type = randomPick(['circle', 'triangle', 'cylinder'])

  if (type === 'circle') {
    const r   = rand(1, 5 + Math.floor(level / 3))
    const ans = Math.round(Math.PI * r * r * 100) / 100  
    return { q: `วงกลม r=${r} → พื้นที่=? (ปัด 2 ตำแหน่ง)`, ans }
  }

  if (type === 'triangle') {
    const b   = rand(2, 10 + level) * 2  
    const h   = rand(2, 10 + level) * 2
    const ans = (b * h) / 2
    return { q: `สามเหลี่ยม ฐาน=${b} สูง=${h} → พื้นที่=?`, ans }
  }

  if (type === 'cylinder') {
    const r   = rand(1, 5 + Math.floor(level / 5))
    const h   = rand(1, 10 + level)
    const ans = Math.round(Math.PI * r * r * h * 100) / 100
    return { q: `ทรงกระบอก r=${r} h=${h} → ปริมาตร=? (ปัด 2 ตำแหน่ง)`, ans }
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

  if (timerBar) {
    const percent = Math.max(0, (timeLeft / 30) * 100)
    timerBar.style.width = `${percent}%`
  }
}

const startTimer = () => {
  clearTimer()
  timeLeft = 30
  updateTimerDisplay()
  console.log('timer start', timeLeft)

  timerId = setInterval(() => {
    timeLeft -= 1
    updateTimerDisplay()
    console.log('timeLeft', timeLeft)

    if (timeLeft <= 0) {
      clearTimer()
      loseLife()
      showQuestion()
    }
  }, 1000)
}

const showQuestion = () => {
  let question;

  if (currentLevel <= 10) {
    question = genTier1(currentLevel)
  } else if (currentLevel <= 25) {
    question = genTier2(currentLevel)
  } else if (currentLevel <= 40) {
    question = genLinear(currentLevel)
  } else if (currentLevel <= 60) {
    question = genSystem(currentLevel)
  }

  const { q, ans } = question
  const answerType = typeof ans === 'string' ? 'string' : 'number'
  currentQuestion = { q, ans, type: answerType }
  input.value = ''
  console.log('currentLevel', currentLevel, 'ans', ans)
  document.getElementById('questionDisplay').textContent = q
  document.getElementById('tierBadge').textContent = `LEVEL ${currentLevel}`
  document.getElementById('tierDisplay').textContent = currentLevel
  startTimer()
}

const checkAnswer = () => {
  if (!currentQuestion) {
    console.log('ยังไม่มีคำถาม')
    return
  }

  const rawInput = input.value.trim()

  if (currentQuestion.type === 'string') {
    if (rawInput.toLowerCase() === String(currentQuestion.ans).trim().toLowerCase()) {
      score.innerText = `${Number(score.innerText) + 1}`
      advanceLevel()
      console.log('nice')
      input.value = '';
    } else {
      loseLife()
      showQuestion()
      console.log('kuy')
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
    score.innerText = `${Number(score.innerText) + 1}`
    advanceLevel()
    console.log('nice')
  } else {
    console.log('kuy')
    loseLife()
    showQuestion()
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