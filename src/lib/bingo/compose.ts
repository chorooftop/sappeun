import { CELLS_BY_CATEGORY, FREE_CELL } from '@/data/sheet'
import type { CellMaster } from '@/types/cell'
import type { BoardMode } from '@/types/bingo'
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
    mission: number
  }
}

const RECIPES: Record<BoardMode, Recipe> = {
  '5x5': {
    size: 25,
    freePosition: 12,
    picks: { nature: 6, manmade: 7, animal: 5, time: 3, mission: 3 },
  },
  standard: {
    size: 25,
    freePosition: 12,
    picks: { nature: 6, manmade: 7, animal: 5, time: 3, mission: 3 },
  },
  '3x3': {
    size: 9,
    freePosition: 4,
    picks: { nature: 3, manmade: 3, animal: 1, time: 0, mission: 1 },
  },
}

export function composeBoard(mode: BoardMode, rng?: () => number): ComposeResult {
  const recipe = RECIPES[mode]
  const picks: CellMaster[] = [
    ...pickRandom(CELLS_BY_CATEGORY.nature, recipe.picks.nature, rng),
    ...pickRandom(CELLS_BY_CATEGORY.manmade, recipe.picks.manmade, rng),
    ...pickRandom(CELLS_BY_CATEGORY.animal, recipe.picks.animal, rng),
    ...pickRandom(CELLS_BY_CATEGORY.time, recipe.picks.time, rng),
    ...pickRandom(CELLS_BY_CATEGORY.mission, recipe.picks.mission, rng),
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
