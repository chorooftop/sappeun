import type { BoardMode } from '@/types/bingo'
import type { CellMaster } from '@/types/cell'
import type { MissionSnapshot } from '@/types/mission'
import type { PersistedBoardSessionV4 } from '@/types/persisted-board'
import { createMissionSnapshot } from './missionSnapshot'

interface CreateBoardSessionInput {
  sessionId?: string
  mode: BoardMode
  nickname: string
  cells: readonly CellMaster[]
  freePosition: number
  markedPositions?: Iterable<number>
  boardKind?: PersistedBoardSessionV4['boardKind']
  title?: string
  description?: string
  missionSnapshots?: readonly MissionSnapshot[]
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
  sessionId,
  mode,
  nickname,
  cells,
  freePosition,
  markedPositions = [],
  boardKind = 'mission',
  title,
  description,
  missionSnapshots,
}: CreateBoardSessionInput): PersistedBoardSessionV4 {
  const now = new Date().toISOString()
  const snapshots = missionSnapshots?.length
    ? [...missionSnapshots]
    : cells.map((cell) => createMissionSnapshot(cell.id) ?? {
        id: cell.id,
        category: cell.category,
        label: cell.label,
        ...(cell.caption ? { caption: cell.caption } : {}),
        ...(cell.captureLabel ? { captureLabel: cell.captureLabel } : {}),
        ...(cell.hint ? { hint: cell.hint } : {}),
        icon: cell.icon,
        variant: cell.variant,
        ...(cell.textOnly !== undefined ? { textOnly: cell.textOnly } : {}),
        ...(cell.fontSize !== undefined ? { fontSize: cell.fontSize } : {}),
        ...(cell.swatch ? { swatch: cell.swatch } : {}),
        ...(cell.swatchLabel ? { swatchLabel: cell.swatchLabel } : {}),
        ...(cell.camera ? { camera: cell.camera } : {}),
        ...(cell.difficulty ? { difficulty: cell.difficulty } : {}),
        ...(cell.noPhoto !== undefined ? { noPhoto: cell.noPhoto } : {}),
        ...(cell.fixedPosition ? { fixedPosition: cell.fixedPosition } : {}),
      })

  return {
    version: 4,
    sessionId: sessionId ?? createSessionId(),
    mode,
    boardKind,
    nickname,
    title: title?.trim() || nickname,
    ...(description?.trim() ? { description: description.trim() } : {}),
    createdAt: now,
    updatedAt: now,
    freePosition,
    cellIds: cells.map((cell) => cell.id),
    missionSnapshots: snapshots,
    markedPositions: filterPersistableMarkedPositions(
      markedPositions,
      cells,
    ),
    clips: [],
    endedAt: null,
  }
}
