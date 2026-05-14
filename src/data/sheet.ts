import sheetJson from './sheet.json'
import type { CellMaster, Category, SheetData } from '@/types/cell'

export const SHEET = sheetJson as unknown as SheetData

export const ALL_CELLS: CellMaster[] = SHEET.cells

export const FREE_CELL = ALL_CELLS.find((c) => c.id === 'free')!

export function getCellById(id: string): CellMaster | undefined {
  return ALL_CELLS.find((c) => c.id === id)
}

export function getCellsByCategory(category: Category): CellMaster[] {
  return ALL_CELLS.filter((c) => c.category === category)
}

export const CELLS_BY_CATEGORY = {
  nature: getCellsByCategory('nature'),
  manmade: getCellsByCategory('manmade'),
  animal: getCellsByCategory('animal'),
  time: getCellsByCategory('time'),
  self: getCellsByCategory('self'),
  color: getCellsByCategory('color'),
  special: getCellsByCategory('special'),
} as const
