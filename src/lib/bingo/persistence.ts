import type { BoardMode } from '@/types/bingo'
import type { PersistedBoardSessionV1 } from '@/types/persisted-board'

const ACTIVE_SESSION_KEY = 'sappeun-active-board-v1'
const SESSION_PREFIX = 'sappeun-board-v1:'

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

function isBoardMode(value: unknown): value is BoardMode {
  return value === '5x5' || value === '3x3'
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => Number.isInteger(item))
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

export function saveBoardSession(session: PersistedBoardSessionV1): void {
  const storage = getLocalStorage()
  if (!storage) return

  try {
    storage.setItem(getSessionKey(session.sessionId), JSON.stringify(session))
    storage.setItem(ACTIVE_SESSION_KEY, session.sessionId)
  } catch (error) {
    console.warn('Unable to save board session', error)
  }
}

export function loadActiveBoardSession(): PersistedBoardSessionV1 | null {
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
    if (!isPersistedBoardSessionV1(parsed) || parsed.endedAt !== null) {
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
  } catch (error) {
    console.warn('Unable to clear board session', error)
  }
}
