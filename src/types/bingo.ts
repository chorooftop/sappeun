export type BoardMode = '5x5' | '3x3'

export type BoardKind = 'mission' | 'custom'

export type CellState = 'idle' | 'marked' | 'free'

export type BoardCellCompletionType =
  | 'photo'
  | 'no_photo'
  | 'clip'
  | 'no_media'
  | 'free'

export interface Board {
  id: string
  userId: string
  mode: BoardMode
  seedRecipe: string
  createdAt: string
  updatedAt?: string
  endedAt: string | null
}

export interface BoardCell {
  boardId: string
  position: number
  cellId: string
  photoId: string | null
  clipId: string | null
  markedAt: string | null
  completedAt?: string | null
  completionType?: BoardCellCompletionType | null
}

export interface BingoLines {
  total: number
  rows: number[]
  cols: number[]
  diagonals: number[]
}
