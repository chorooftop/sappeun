import { ALL_CELLS, CELLS_BY_CATEGORY, FREE_CELL, getCellById } from '@/data/sheet'
import type { CellMaster } from '@/types/cell'
import type { BoardMode } from '@/types/bingo'
import type { MissionSnapshot } from '@/types/mission'
import { pickRandom, shuffle } from './shuffle'

interface ComposeResult {
  cells: CellMaster[]
  freePosition: number
}

interface Recipe {
  size: number
  freePosition: number
  picks: {
    nature: number
    manmade: number
    animal: number
    time: number
    self: number
    color: number
  }
}

const RECIPES: Record<BoardMode, Recipe> = {
  '5x5': {
    size: 25,
    freePosition: 12,
    picks: { nature: 6, manmade: 6, animal: 4, time: 2, self: 3, color: 3 },
  },
  '3x3': {
    size: 9,
    freePosition: 4,
    picks: { nature: 3, manmade: 2, animal: 1, time: 0, self: 1, color: 1 },
  },
}

export function getBoardRecipe(mode: BoardMode): Pick<Recipe, 'size' | 'freePosition'> {
  const recipe = RECIPES[mode]
  return { size: recipe.size, freePosition: recipe.freePosition }
}

export function missionSnapshotToCell(snapshot: MissionSnapshot): CellMaster {
  return {
    id: snapshot.id,
    category: snapshot.category,
    label: snapshot.label,
    caption: snapshot.caption,
    captureLabel: snapshot.captureLabel,
    hint: snapshot.hint,
    icon: snapshot.icon,
    variant: snapshot.variant,
    textOnly: snapshot.textOnly,
    fontSize: snapshot.fontSize,
    swatch: snapshot.swatch,
    swatchLabel: snapshot.swatchLabel,
    camera: snapshot.camera,
    difficulty: snapshot.difficulty,
    noPhoto: snapshot.noPhoto,
    fixedPosition: snapshot.fixedPosition,
  }
}

export function composeBoard(mode: BoardMode, rng?: () => number): ComposeResult {
  const recipe = RECIPES[mode]
  const picks: CellMaster[] = [
    ...pickRandom(CELLS_BY_CATEGORY.nature, recipe.picks.nature, rng),
    ...pickRandom(CELLS_BY_CATEGORY.manmade, recipe.picks.manmade, rng),
    ...pickRandom(CELLS_BY_CATEGORY.animal, recipe.picks.animal, rng),
    ...pickRandom(CELLS_BY_CATEGORY.time, recipe.picks.time, rng),
    ...pickRandom(CELLS_BY_CATEGORY.self, recipe.picks.self, rng),
    ...pickRandom(CELLS_BY_CATEGORY.color, recipe.picks.color, rng),
  ]

  const shuffled = shuffle(picks, rng)
  const cells: CellMaster[] = []

  for (let i = 0; i < recipe.size; i++) {
    if (i === recipe.freePosition) {
      cells.push(FREE_CELL)
    } else {
      const next = shuffled.shift()
      if (!next) throw new Error('composeBoard: ran out of picks')
      cells.push(next)
    }
  }

  return { cells, freePosition: recipe.freePosition }
}

export function composeBoardFromCellIds(
  mode: BoardMode,
  cellIds: readonly string[],
  freePosition: number,
  missionSnapshots: readonly MissionSnapshot[] = [],
): ComposeResult | null {
  const recipe = RECIPES[mode]
  if (cellIds.length !== recipe.size) return null
  if (freePosition !== recipe.freePosition) return null

  const snapshotsById = new Map(missionSnapshots.map((snapshot) => [snapshot.id, snapshot]))
  const cells: CellMaster[] = []
  for (const id of cellIds) {
    const snapshot = snapshotsById.get(id)
    const cell = getCellById(id) ?? (snapshot ? missionSnapshotToCell(snapshot) : null)
    if (!cell) return null
    cells.push(cell)
  }

  return { cells, freePosition }
}

function isReplaceCandidate(
  cell: CellMaster,
  currentIds: ReadonlySet<string>,
  targetCell: CellMaster,
): boolean {
  return (
    cell.id !== FREE_CELL.id &&
    cell.id !== targetCell.id &&
    cell.fixedPosition !== 'center' &&
    cell.category !== 'special' &&
    !currentIds.has(cell.id)
  )
}

function prioritizeReplacementCandidates(
  candidates: readonly CellMaster[],
  targetCell: CellMaster,
  rng: () => number,
): CellMaster[] {
  const shuffled = shuffle(candidates, rng)
  if (targetCell.difficulty !== 'hard') return shuffled

  const easier = shuffled.filter((cell) => cell.difficulty !== 'hard')
  const hard = shuffled.filter((cell) => cell.difficulty === 'hard')
  return [...easier, ...hard]
}

export function pickReplacementCell(
  currentCells: readonly CellMaster[],
  targetCell: CellMaster,
  rng: () => number = Math.random,
): CellMaster | null {
  const currentIds = new Set(currentCells.map((cell) => cell.id))
  const categoryCandidates = CELLS_BY_CATEGORY[targetCell.category].filter((cell) =>
    isReplaceCandidate(cell, currentIds, targetCell),
  )
  const sameCategory = prioritizeReplacementCandidates(
    categoryCandidates,
    targetCell,
    rng,
  )
  if (sameCategory[0]) return sameCategory[0]

  const fallbackCandidates = ALL_CELLS.filter((cell) =>
    isReplaceCandidate(cell, currentIds, targetCell),
  )
  const fallback = prioritizeReplacementCandidates(
    fallbackCandidates,
    targetCell,
    rng,
  )
  return fallback[0] ?? null
}
