export const randomPick = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)]
}

export const rand = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const randNeg = (scale) => {
   const n = rand(1, scale)
  return Math.random() < 0.5 ? n : -n
}

export const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export const triples = [
  [3,4,5], [5,12,13], [8,15,17],
  [7,24,25], [9,40,41], [6,8,10],
  [12,16,20], [15,20,25]
]
