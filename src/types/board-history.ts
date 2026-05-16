import type { BoardKind, BoardMode } from './bingo'
import type { MissionSnapshot } from './mission'

export interface BoardHistoryPhoto {
  photoId: string
  previewUrl: string
  previewUrlExpiresAt: string
  uploadedAt: string | null
  capturedAt: string | null
}

export interface BoardHistoryClip {
  clipId: string
  clipUrl: string
  clipUrlExpiresAt: string
  posterUrl: string
  posterUrlExpiresAt: string
  uploadedAt: string | null
  recordedAt: string | null
  durationMs: number
  description?: string
}

export interface BoardHistoryCell {
  position: number
  cellId: string
  mission: MissionSnapshot
  markedAt: string | null
  completedAt: string | null
  completionType: 'photo' | 'no_photo' | 'clip' | 'no_media' | 'free' | null
  photo: BoardHistoryPhoto | null
  clip: BoardHistoryClip | null
}

export interface BoardHistoryItem {
  id: string
  mode: BoardMode
  boardKind: BoardKind
  nickname: string
  title: string
  description?: string
  createdAt: string
  updatedAt: string
  endedAt: string | null
  photoCount: number
  clipCount: number
  completedCount: number
}

export interface BoardHistoryDetail extends BoardHistoryItem {
  sessionId: string
  freePosition: number
  cellIds: string[]
  cells: BoardHistoryCell[]
}
