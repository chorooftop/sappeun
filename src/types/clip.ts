import type { BoardKind } from './bingo'
import type { MissionSnapshot } from './mission'

export interface Clip {
  clipId: string
  ownerKind: ClipOwnerKind
  clipUrl: string
  clipUrlExpiresAt: string
  posterUrl: string
  posterUrlExpiresAt: string
  durationMs: number
  description?: string
}

export type ClipOwnerKind = 'guest' | 'user'

export type ClipUploadStatus =
  | 'local_pending'
  | 'uploading'
  | 'uploaded'
  | 'failed'

export type ClipOrientation = 'portrait' | 'landscape' | 'square'

export interface PresignedClipUploadRequest {
  clientBoardSessionId: string
  mode: '5x5' | '3x3'
  boardKind?: BoardKind
  nickname: string
  title?: string
  description?: string
  clipDescription?: string
  freePosition: number
  cellIds: string[]
  missionSnapshots?: MissionSnapshot[]
  position: number
  cellId: string
  contentType: 'video/mp4' | 'video/webm'
  recorderMimeType: string
  sizeBytes: number
  durationMs: number
  width?: number
  height?: number
  orientation?: ClipOrientation
  posterContentType: 'image/jpeg' | 'image/webp'
  posterSizeBytes: number
  posterWidth?: number
  posterHeight?: number
}

export interface PresignedClipUploadResponse {
  clipId: string
  ownerKind: ClipOwnerKind
  clip: {
    path: string
    uploadUrl: string
    token: string
  }
  poster: {
    path: string
    uploadUrl: string
    token: string
  }
  expiresAt: string
}

export interface ConfirmClipUploadRequest {
  clipId: string
  ownerKind: ClipOwnerKind
}

export interface ConfirmClipUploadResponse {
  clipId: string
  ownerKind: ClipOwnerKind
  clipUrl: string
  clipUrlExpiresAt: string
  posterUrl: string
  posterUrlExpiresAt: string
  durationMs: number
  description?: string
  requestedClipId?: string
  requestedOwnerKind?: ClipOwnerKind
}

export interface ClipPreviewRequest {
  clips: Array<{
    clipId: string
    ownerKind: ClipOwnerKind
  }>
}

export interface ClipPreviewResponse {
  clips: Array<{
    clipId: string
    ownerKind: ClipOwnerKind
    clipUrl: string
    clipUrlExpiresAt: string
    posterUrl: string
    posterUrlExpiresAt: string
    durationMs: number
    description?: string
    requestedClipId?: string
    requestedOwnerKind?: ClipOwnerKind
  }>
}
