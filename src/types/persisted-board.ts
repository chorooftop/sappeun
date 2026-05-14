import type { BoardMode } from './bingo'

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
