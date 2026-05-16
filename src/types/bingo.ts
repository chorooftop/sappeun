export type BoardMode = '5x5' | '3x3'

export type CellState = 'idle' | 'marked' | 'free'

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
  markedAt: string | null
  completedAt?: string | null
  completionType?: 'photo' | 'no_photo' | 'free' | null
}

export interface BingoLines {
  total: number
  rows: number[]
  cols: number[]
  diagonals: number[]
}
