import type { BoardKind, BoardMode } from './bingo'
import type { ClipOwnerKind, ClipUploadStatus } from './clip'
import type { MissionSnapshot } from './mission'
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

export interface PersistedBoardClipV3 {
  position: number
  cellId: string
  clipId: string
  ownerKind: ClipOwnerKind
  clipUrl?: string
  clipUrlExpiresAt?: string
  posterUrl?: string
  posterUrlExpiresAt?: string
  durationMs: number
  description?: string
  pendingKey?: string
  uploadStatus: ClipUploadStatus
}

export interface PersistedBoardSessionV3 {
  version: 3
  sessionId: string
  boardId?: string
  mode: BoardMode
  nickname: string
  createdAt: string
  updatedAt: string
  freePosition: number
  cellIds: string[]
  markedPositions: number[]
  clips: PersistedBoardClipV3[]
  endedAt: string | null
}

export interface PersistedBoardSessionV4 {
  version: 4
  sessionId: string
  boardId?: string
  mode: BoardMode
  boardKind: BoardKind
  nickname: string
  title: string
  description?: string
  createdAt: string
  updatedAt: string
  freePosition: number
  cellIds: string[]
  missionSnapshots: MissionSnapshot[]
  markedPositions: number[]
  clips: PersistedBoardClipV3[]
  endedAt: string | null
}

export type PersistedBoardSession =
  | PersistedBoardSessionV1
  | PersistedBoardSessionV2
  | PersistedBoardSessionV3
  | PersistedBoardSessionV4
