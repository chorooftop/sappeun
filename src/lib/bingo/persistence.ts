import type { BoardMode } from '@/types/bingo'
import type { MissionSnapshot } from '@/types/mission'
import type {
  PersistedBoardClipV3,
  PersistedBoardPhotoV2,
  PersistedBoardSession,
  PersistedBoardSessionV1,
  PersistedBoardSessionV2,
  PersistedBoardSessionV3,
  PersistedBoardSessionV4,
} from '@/types/persisted-board'

const ACTIVE_SESSION_KEY = 'sappeun-active-board-v1'
const SESSION_PREFIX = 'sappeun-board-v1:'
const SESSION_CHANGE_EVENT = 'sappeun-board-session-change'

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch (error) {
    console.warn('Unable to access localStorage', error)
    return null
  }
}

function getSessionKey(sessionId: string): string {
  return `${SESSION_PREFIX}${sessionId}`
}

function notifySessionChange(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT))
}

function isBoardMode(value: unknown): value is BoardMode {
  return value === '5x5' || value === '3x3'
}

function isBoardKind(value: unknown): value is PersistedBoardSessionV4['boardKind'] {
  return value === 'mission' || value === 'custom'
}

function isPhotoOwnerKind(value: unknown): value is PersistedBoardPhotoV2['ownerKind'] {
  return value === 'guest' || value === 'user'
}

function isPhotoUploadStatus(
  value: unknown,
): value is PersistedBoardPhotoV2['uploadStatus'] {
  return value === 'uploading' || value === 'uploaded' || value === 'failed'
}

function isClipOwnerKind(value: unknown): value is PersistedBoardClipV3['ownerKind'] {
  return value === 'guest' || value === 'user'
}

function isClipUploadStatus(
  value: unknown,
): value is PersistedBoardClipV3['uploadStatus'] {
  return (
    value === 'local_pending' ||
    value === 'uploading' ||
    value === 'uploaded' ||
    value === 'failed'
  )
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => Number.isInteger(item))
}

function isMissionSnapshot(value: unknown): value is MissionSnapshot {
  if (!value || typeof value !== 'object') return false
  const snapshot = value as Record<string, unknown>

  return (
    typeof snapshot.id === 'string' &&
    typeof snapshot.category === 'string' &&
    typeof snapshot.label === 'string' &&
    (snapshot.caption === undefined || typeof snapshot.caption === 'string') &&
    (snapshot.captureLabel === undefined ||
      typeof snapshot.captureLabel === 'string') &&
    (snapshot.hint === undefined || typeof snapshot.hint === 'string') &&
    (snapshot.icon === null || typeof snapshot.icon === 'string') &&
    typeof snapshot.variant === 'string'
  )
}

function isPersistedPhotoV2(value: unknown): value is PersistedBoardPhotoV2 {
  if (!value || typeof value !== 'object') return false
  const photo = value as Record<string, unknown>

  return (
    Number.isInteger(photo.position) &&
    typeof photo.cellId === 'string' &&
    typeof photo.photoId === 'string' &&
    isPhotoOwnerKind(photo.ownerKind) &&
    (photo.previewUrl === undefined || typeof photo.previewUrl === 'string') &&
    (photo.previewUrlExpiresAt === undefined ||
      typeof photo.previewUrlExpiresAt === 'string') &&
    isPhotoUploadStatus(photo.uploadStatus)
  )
}

function isPersistedClipV3(value: unknown): value is PersistedBoardClipV3 {
  if (!value || typeof value !== 'object') return false
  const clip = value as Record<string, unknown>

  return (
    Number.isInteger(clip.position) &&
    typeof clip.cellId === 'string' &&
    typeof clip.clipId === 'string' &&
    isClipOwnerKind(clip.ownerKind) &&
    (clip.clipUrl === undefined || typeof clip.clipUrl === 'string') &&
    (clip.clipUrlExpiresAt === undefined ||
      typeof clip.clipUrlExpiresAt === 'string') &&
    (clip.posterUrl === undefined || typeof clip.posterUrl === 'string') &&
    (clip.posterUrlExpiresAt === undefined ||
      typeof clip.posterUrlExpiresAt === 'string') &&
    (clip.description === undefined || typeof clip.description === 'string') &&
    (clip.pendingKey === undefined || typeof clip.pendingKey === 'string') &&
    typeof clip.durationMs === 'number' &&
    isClipUploadStatus(clip.uploadStatus)
  )
}

function isPersistedBoardSessionV1(
  value: unknown,
): value is PersistedBoardSessionV1 {
  if (!value || typeof value !== 'object') return false
  const session = value as Record<string, unknown>

  return (
    session.version === 1 &&
    typeof session.sessionId === 'string' &&
    isBoardMode(session.mode) &&
    typeof session.nickname === 'string' &&
    typeof session.createdAt === 'string' &&
    typeof session.updatedAt === 'string' &&
    Number.isInteger(session.freePosition) &&
    Array.isArray(session.cellIds) &&
    session.cellIds.every((id) => typeof id === 'string') &&
    isNumberArray(session.markedPositions) &&
    (session.endedAt === null || typeof session.endedAt === 'string')
  )
}

function isPersistedBoardSessionV2(
  value: unknown,
): value is PersistedBoardSessionV2 {
  if (!value || typeof value !== 'object') return false
  const session = value as Record<string, unknown>

  return (
    session.version === 2 &&
    typeof session.sessionId === 'string' &&
    (session.boardId === undefined || typeof session.boardId === 'string') &&
    isBoardMode(session.mode) &&
    typeof session.nickname === 'string' &&
    typeof session.createdAt === 'string' &&
    typeof session.updatedAt === 'string' &&
    Number.isInteger(session.freePosition) &&
    Array.isArray(session.cellIds) &&
    session.cellIds.every((id) => typeof id === 'string') &&
    isNumberArray(session.markedPositions) &&
    Array.isArray(session.photos) &&
    session.photos.every(isPersistedPhotoV2) &&
    (session.endedAt === null || typeof session.endedAt === 'string')
  )
}

function isPersistedBoardSessionV3(
  value: unknown,
): value is PersistedBoardSessionV3 {
  if (!value || typeof value !== 'object') return false
  const session = value as Record<string, unknown>

  return (
    session.version === 3 &&
    typeof session.sessionId === 'string' &&
    (session.boardId === undefined || typeof session.boardId === 'string') &&
    isBoardMode(session.mode) &&
    typeof session.nickname === 'string' &&
    typeof session.createdAt === 'string' &&
    typeof session.updatedAt === 'string' &&
    Number.isInteger(session.freePosition) &&
    Array.isArray(session.cellIds) &&
    session.cellIds.every((id) => typeof id === 'string') &&
    isNumberArray(session.markedPositions) &&
    Array.isArray(session.clips) &&
    session.clips.every(isPersistedClipV3) &&
    (session.endedAt === null || typeof session.endedAt === 'string')
  )
}

function isPersistedBoardSessionV4(
  value: unknown,
): value is PersistedBoardSessionV4 {
  if (!value || typeof value !== 'object') return false
  const session = value as Record<string, unknown>

  return (
    session.version === 4 &&
    typeof session.sessionId === 'string' &&
    (session.boardId === undefined || typeof session.boardId === 'string') &&
    isBoardMode(session.mode) &&
    isBoardKind(session.boardKind) &&
    typeof session.nickname === 'string' &&
    typeof session.title === 'string' &&
    (session.description === undefined ||
      typeof session.description === 'string') &&
    typeof session.createdAt === 'string' &&
    typeof session.updatedAt === 'string' &&
    Number.isInteger(session.freePosition) &&
    Array.isArray(session.cellIds) &&
    session.cellIds.every((id) => typeof id === 'string') &&
    Array.isArray(session.missionSnapshots) &&
    session.missionSnapshots.every(isMissionSnapshot) &&
    isNumberArray(session.markedPositions) &&
    Array.isArray(session.clips) &&
    session.clips.every(isPersistedClipV3) &&
    (session.endedAt === null || typeof session.endedAt === 'string')
  )
}

function isPersistedBoardSession(
  value: unknown,
): value is PersistedBoardSession {
  return (
    isPersistedBoardSessionV1(value) ||
    isPersistedBoardSessionV2(value) ||
    isPersistedBoardSessionV3(value) ||
    isPersistedBoardSessionV4(value)
  )
}

export function saveBoardSession(session: PersistedBoardSession): void {
  const storage = getLocalStorage()
  if (!storage) return

  try {
    storage.setItem(getSessionKey(session.sessionId), JSON.stringify(session))
    storage.setItem(ACTIVE_SESSION_KEY, session.sessionId)
    notifySessionChange()
  } catch (error) {
    console.warn('Unable to save board session', error)
  }
}

export function loadActiveBoardSession(): PersistedBoardSession | null {
  const storage = getLocalStorage()
  if (!storage) return null

  try {
    const sessionId = storage.getItem(ACTIVE_SESSION_KEY)
    if (!sessionId) return null

    const raw = storage.getItem(getSessionKey(sessionId))
    if (!raw) {
      storage.removeItem(ACTIVE_SESSION_KEY)
      return null
    }

    const parsed: unknown = JSON.parse(raw)
    if (!isPersistedBoardSession(parsed) || parsed.endedAt !== null) {
      clearActiveBoardSession()
      return null
    }

    return parsed
  } catch (error) {
    console.warn('Unable to load board session', error)
    clearActiveBoardSession()
    return null
  }
}

export function clearActiveBoardSession(): void {
  const storage = getLocalStorage()
  if (!storage) return

  try {
    const sessionId = storage.getItem(ACTIVE_SESSION_KEY)
    if (sessionId) {
      storage.removeItem(getSessionKey(sessionId))
    }
    storage.removeItem(ACTIVE_SESSION_KEY)
    notifySessionChange()
  } catch (error) {
    console.warn('Unable to clear board session', error)
  }
}

export { SESSION_CHANGE_EVENT }
