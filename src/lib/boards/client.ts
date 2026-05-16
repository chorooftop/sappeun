'use client'

import type { PersistedBoardSessionV2 } from '@/types/persisted-board'

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Board request failed with ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function ensureBoardSession(
  session: PersistedBoardSessionV2,
): Promise<string | null> {
  const response = await fetch('/api/boards/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  })

  if (response.status === 401) return null
  const payload = await readJson<{ boardId: string | null }>(response)
  return payload.boardId
}

export async function adoptGuestBoardSession(
  session: PersistedBoardSessionV2,
): Promise<PersistedBoardSessionV2 | null> {
  const response = await fetch('/api/boards/adopt-guest-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  })

  if (response.status === 401) return null
  const payload = await readJson<{ session: PersistedBoardSessionV2 | null }>(
    response,
  )
  return payload.session
}

export async function endBoardSession(boardId: string): Promise<void> {
  const response = await fetch(`/api/boards/${boardId}/end`, {
    method: 'POST',
  })

  if (!response.ok && response.status !== 401) {
    throw new Error(`Board end failed with ${response.status}`)
  }
}

export async function deleteBoardSession(boardId: string): Promise<void> {
  const response = await fetch(`/api/boards/${boardId}`, {
    method: 'DELETE',
  })

  if (!response.ok && response.status !== 401 && response.status !== 404) {
    throw new Error(`Board delete failed with ${response.status}`)
  }
}

export async function deleteCurrentBoardSessions(): Promise<void> {
  const response = await fetch('/api/boards/current', {
    method: 'DELETE',
  })

  if (!response.ok && response.status !== 401) {
    throw new Error(`Active board delete failed with ${response.status}`)
  }
}

export async function markBoardCell(
  boardId: string,
  position: number,
  cellId: string,
  marked: boolean,
): Promise<void> {
  const response = await fetch(`/api/boards/${boardId}/cells/${position}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cellId, marked }),
  })

  if (!response.ok && response.status !== 401) {
    throw new Error(`Board cell update failed with ${response.status}`)
  }
}

export async function replaceBoardCell(
  boardId: string,
  position: number,
  cellId: string,
): Promise<void> {
  const response = await fetch(`/api/boards/${boardId}/cells/${position}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cellId }),
  })

  if (!response.ok && response.status !== 401) {
    throw new Error(`Board cell replace failed with ${response.status}`)
  }
}

export async function updateProfileNickname(nickname: string): Promise<void> {
  const response = await fetch('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
  })

  if (!response.ok && response.status !== 401) {
    throw new Error(`Profile update failed with ${response.status}`)
  }
}
