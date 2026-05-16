import type { BoardMode } from './bingo'
import type { MissionSnapshot } from './mission'

export interface BoardHistoryPhoto {
  photoId: string
  previewUrl: string
  previewUrlExpiresAt: string
  uploadedAt: string | null
  capturedAt: string | null
}

export interface BoardHistoryCell {
  position: number
  cellId: string
  mission: MissionSnapshot
  markedAt: string | null
  completedAt: string | null
  completionType: 'photo' | 'no_photo' | 'free' | null
  photo: BoardHistoryPhoto | null
}

export interface BoardHistoryItem {
  id: string
  mode: BoardMode
  nickname: string
  createdAt: string
  updatedAt: string
  endedAt: string | null
  photoCount: number
  completedCount: number
}

export interface BoardHistoryDetail extends BoardHistoryItem {
  sessionId: string
  freePosition: number
  cellIds: string[]
  cells: BoardHistoryCell[]
}
