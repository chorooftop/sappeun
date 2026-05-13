export type Category =
  | 'nature'
  | 'manmade'
  | 'animal'
  | 'time'
  | 'mission'
  | 'special'

export type CellVariant = 'QeQCU' | 'k4Srv' | 'rAdyJ'

export type CameraMode = 'front' | 'back' | 'timer'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface CellMaster {
  id: string
  category: Category
  label: string
  icon: string | null
  variant: CellVariant
  textOnly?: boolean
  fontSize?: number
  camera?: CameraMode
  difficulty?: Difficulty
  fixedPosition?: 'center'
}

export interface SeedRecipe {
  size: number
  freePosition: number
  compose: string
  notes: string
}

export interface SheetData {
  $schema: string
  version: string
  updatedAt: string
  totalCells: number
  categories: Record<Category, { label: string; count: number; tone: string }>
  cells: CellMaster[]
  seedRecipes: Record<string, SeedRecipe>
  cameraModes: Record<CameraMode, string>
  stateVariants: Record<string, string>
}
