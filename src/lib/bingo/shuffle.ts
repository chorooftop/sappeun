export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

export function pickRandom<T>(items: readonly T[], n: number, rng?: () => number): T[] {
  return shuffle(items, rng).slice(0, n)
}
