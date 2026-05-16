import type { CameraMode, Category, CellVariant, Difficulty } from './cell'

export interface MissionSnapshot {
  id: string
  category: Category
  label: string
  caption?: string
  captureLabel?: string
  hint?: string
  icon: string | null
  variant: CellVariant
  textOnly?: boolean
  fontSize?: number
  swatch?: string
  swatchLabel?: string
  camera?: CameraMode
  difficulty?: Difficulty
  noPhoto?: boolean
  fixedPosition?: 'center'
}
