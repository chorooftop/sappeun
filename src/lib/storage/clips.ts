import type { BoardKind, BoardMode } from '@/types/bingo'
import type { MissionSnapshot } from '@/types/mission'

export const CLIP_BUCKET = 'clips-private'
export const GUEST_SESSION_COOKIE_NAME = 'sappeun_guest_session'
export const GUEST_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 3
export const MAX_CLIP_DURATION_MS = 3000
export const MAX_CLIP_DURATION_GRACE_MS = 3500
export const MAX_CLIP_SIZE_BYTES = 12 * 1024 * 1024
export const MAX_POSTER_SIZE_BYTES = 500 * 1024
export const SIGNED_UPLOAD_EXPIRES_SECONDS = 60 * 60 * 2
export const SIGNED_PREVIEW_EXPIRES_SECONDS = 60 * 10

export const SUPPORTED_CLIP_CONTENT_TYPES = [
  'video/mp4',
  'video/webm',
] as const

export const SUPPORTED_POSTER_CONTENT_TYPES = [
  'image/jpeg',
  'image/webp',
] as const

export type SupportedClipContentType =
  (typeof SUPPORTED_CLIP_CONTENT_TYPES)[number]

export type SupportedPosterContentType =
  (typeof SUPPORTED_POSTER_CONTENT_TYPES)[number]

export interface ClipPathInput {
  id: string
  ext: string
  position: number
}

export interface UserClipPathInput extends ClipPathInput {
  userId: string
  boardId: string
}

export interface GuestClipPathInput extends ClipPathInput {
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

export function isSupportedClipContentType(
  value: string,
): value is SupportedClipContentType {
  return SUPPORTED_CLIP_CONTENT_TYPES.includes(
    value as SupportedClipContentType,
  )
}

export function isSupportedPosterContentType(
  value: string,
): value is SupportedPosterContentType {
  return SUPPORTED_POSTER_CONTENT_TYPES.includes(
    value as SupportedPosterContentType,
  )
}

export function clipExtFromContentType(
  contentType: SupportedClipContentType,
): string {
  return contentType === 'video/mp4' ? 'mp4' : 'webm'
}

export function posterExtFromContentType(
  contentType: SupportedPosterContentType,
): string {
  return contentType === 'image/webp' ? 'webp' : 'jpg'
}

export function normalizeClipContentType(value: string): SupportedClipContentType | null {
  const base = value.split(';', 1)[0]?.trim().toLowerCase()
  if (base === 'video/mp4' || base === 'video/webm') return base
  return null
}

export function codecFromMimeType(value: string): string | null {
  const codecs = value
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.toLowerCase().startsWith('codecs='))
  return codecs?.slice('codecs='.length).replace(/^"|"$/g, '') || null
}

export function userClipPath({
  userId,
  boardId,
  position,
  id,
  ext,
}: UserClipPathInput): string {
  return `users/${userId}/boards/${boardId}/cells/${position}/clips/${id}.${ext}`
}

export function userPosterPath({
  userId,
  boardId,
  position,
  id,
  ext,
}: UserClipPathInput): string {
  return `users/${userId}/boards/${boardId}/cells/${position}/posters/${id}.${ext}`
}

export function guestClipPath({
  guestSessionId,
  clientBoardSessionId,
  position,
  id,
  ext,
}: GuestClipPathInput): string {
  return `temp/${guestSessionId}/boards/${clientBoardSessionId}/cells/${position}/clips/${id}.${ext}`
}

export function guestPosterPath({
  guestSessionId,
  clientBoardSessionId,
  position,
  id,
  ext,
}: GuestClipPathInput): string {
  return `temp/${guestSessionId}/boards/${clientBoardSessionId}/cells/${position}/posters/${id}.${ext}`
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
