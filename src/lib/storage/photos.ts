import type { BoardKind, BoardMode } from '@/types/bingo'
import type { MissionSnapshot } from '@/types/mission'

export const PHOTO_BUCKET = 'photos-private'
export const GUEST_SESSION_COOKIE_NAME = 'sappeun_guest_session'
export const GUEST_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 3
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024
export const SIGNED_UPLOAD_EXPIRES_SECONDS = 60 * 60 * 2
export const SIGNED_PREVIEW_EXPIRES_SECONDS = 60 * 10

export const SUPPORTED_PHOTO_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
] as const

export type SupportedPhotoContentType =
  (typeof SUPPORTED_PHOTO_CONTENT_TYPES)[number]

export interface PhotoPathInput {
  id: string
  ext: string
  position: number
}

export interface UserPhotoPathInput extends PhotoPathInput {
  userId: string
  boardId: string
}

export interface GuestPhotoPathInput extends PhotoPathInput {
  guestSessionId: string
  clientBoardSessionId: string
}

export interface BoardSnapshotInput {
  clientBoardSessionId: string
  mode: BoardMode
  boardKind?: BoardKind
  nickname: string
  title?: string
  description?: string
  freePosition: number
  cellIds: string[]
  missionSnapshots?: MissionSnapshot[]
}

export function isSupportedPhotoContentType(
  value: string,
): value is SupportedPhotoContentType {
  return SUPPORTED_PHOTO_CONTENT_TYPES.includes(
    value as SupportedPhotoContentType,
  )
}

export function extFromContentType(
  contentType: SupportedPhotoContentType,
): string {
  if (contentType === 'image/jpeg') return 'jpg'
  if (contentType === 'image/png') return 'png'
  if (contentType === 'image/webp') return 'webp'
  return 'heic'
}

export function userPhotoPath({
  userId,
  boardId,
  position,
  id,
  ext,
}: UserPhotoPathInput): string {
  return `users/${userId}/boards/${boardId}/cells/${position}/${id}.${ext}`
}

export function guestPhotoPath({
  guestSessionId,
  clientBoardSessionId,
  position,
  id,
  ext,
}: GuestPhotoPathInput): string {
  return `temp/${guestSessionId}/boards/${clientBoardSessionId}/cells/${position}/${id}.${ext}`
}

export function signedUrlExpiresAt(
  expiresInSeconds: number,
  now = Date.now(),
): string {
  return new Date(now + expiresInSeconds * 1000).toISOString()
}

export function storageErrorMessage(error: { message?: string } | null) {
  return error?.message ?? 'Storage request failed.'
}
