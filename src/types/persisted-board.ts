import type { BoardMode } from './bingo'
import type { PhotoOwnerKind, PhotoUploadStatus } from './photo'

export interface PersistedBoardPhotoV2 {
  position: number
  cellId: string
  photoId: string
  ownerKind: PhotoOwnerKind
  previewUrl?: string
  previewUrlExpiresAt?: string
  uploadStatus: PhotoUploadStatus
}

export interface PersistedBoardSessionV1 {
  version: 1
  sessionId: string
  mode: BoardMode
  nickname: string
  createdAt: string
  updatedAt: string
  freePosition: number
  cellIds: string[]
  markedPositions: number[]
  endedAt: string | null
}

export interface PersistedBoardSessionV2 {
  version: 2
  sessionId: string
  boardId?: string
  mode: BoardMode
  nickname: string
  createdAt: string
  updatedAt: string
  freePosition: number
  cellIds: string[]
  markedPositions: number[]
  photos: PersistedBoardPhotoV2[]
  endedAt: string | null
}

export type PersistedBoardSession =
  | PersistedBoardSessionV1
  | PersistedBoardSessionV2
