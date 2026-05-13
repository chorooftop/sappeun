import type { BingoLines } from '@/types/bingo'

function sideFromSize(size: number): number {
  const side = Math.sqrt(size)
  if (!Number.isInteger(side)) {
    throw new Error(`Board size ${size} is not a perfect square`)
  }
  return side
}

export function checkBingoLines(
  markedPositions: ReadonlySet<number>,
  size: number,
): BingoLines {
  const side = sideFromSize(size)
  const rows: number[] = []
  const cols: number[] = []
  const diagonals: number[] = []

  for (let r = 0; r < side; r++) {
    let allMarked = true
    for (let c = 0; c < side; c++) {
      if (!markedPositions.has(r * side + c)) {
        allMarked = false
        break
      }
    }
    if (allMarked) rows.push(r)
  }

  for (let c = 0; c < side; c++) {
    let allMarked = true
    for (let r = 0; r < side; r++) {
      if (!markedPositions.has(r * side + c)) {
        allMarked = false
        break
      }
    }
    if (allMarked) cols.push(c)
  }

  let diag1 = true
  let diag2 = true
  for (let i = 0; i < side; i++) {
    if (!markedPositions.has(i * side + i)) diag1 = false
    if (!markedPositions.has(i * side + (side - 1 - i))) diag2 = false
  }
  if (diag1) diagonals.push(0)
  if (diag2) diagonals.push(1)

  return {
    total: rows.length + cols.length + diagonals.length,
    rows,
    cols,
    diagonals,
  }
}
