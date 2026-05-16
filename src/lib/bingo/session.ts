import type { BoardMode } from '@/types/bingo'
import type { CellMaster } from '@/types/cell'
import type { PersistedBoardSessionV2 } from '@/types/persisted-board'

interface CreateBoardSessionInput {
  mode: BoardMode
  nickname: string
  cells: readonly CellMaster[]
  freePosition: number
  markedPositions?: Iterable<number>
}

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function canPersistMarkedCell(
  cell: CellMaster | undefined,
): boolean {
  return cell?.noPhoto === true
}

export function filterPersistableMarkedPositions(
  markedPositions: Iterable<number>,
  cells: readonly CellMaster[],
): number[] {
  const unique = new Set<number>()

  for (const position of markedPositions) {
    if (!Number.isInteger(position)) continue
    if (position < 0 || position >= cells.length) continue
    if (canPersistMarkedCell(cells[position])) {
      unique.add(position)
    }
  }

  return Array.from(unique).sort((a, b) => a - b)
}

export function createBoardSession({
  mode,
  nickname,
  cells,
  freePosition,
  markedPositions = [],
}: CreateBoardSessionInput): PersistedBoardSessionV2 {
  const now = new Date().toISOString()

  return {
    version: 2,
    sessionId: createSessionId(),
    mode,
    nickname,
    createdAt: now,
    updatedAt: now,
    freePosition,
    cellIds: cells.map((cell) => cell.id),
    markedPositions: filterPersistableMarkedPositions(
      markedPositions,
      cells,
    ),
    photos: [],
    endedAt: null,
  }
}
