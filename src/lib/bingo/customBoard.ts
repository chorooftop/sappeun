import { FREE_CELL } from '@/data/sheet'
import { createMissionSnapshot } from '@/lib/bingo/missionSnapshot'
import type { BoardMode } from '@/types/bingo'
import type { CellMaster } from '@/types/cell'
import type { MissionSnapshot } from '@/types/mission'
import { getBoardRecipe, missionSnapshotToCell } from './compose'

export const CUSTOM_BOARD_TITLE_MAX = 24
export const CUSTOM_BOARD_DESCRIPTION_MAX = 120
export const CUSTOM_CELL_TITLE_MAX = 20
export const CUSTOM_CELL_DESCRIPTION_MAX = 80

export interface CustomCellDraft {
  position: number
  title: string
  description: string
}

export function customCellId(sessionId: string, position: number) {
  return `custom:${sessionId}:${position}`
}

export function customCellFallbackLabel(position: number) {
  return `커스텀 ${position + 1}`
}

export function createCustomMissionSnapshot(input: {
  id: string
  position: number
  title?: string
  description?: string
}): MissionSnapshot {
  const description = input.description?.trim()
  const title = input.title?.trim() || customCellFallbackLabel(input.position)

  return {
    id: input.id,
    category: 'special',
    label: title,
    ...(description ? { caption: description, hint: description } : {}),
    captureLabel: title,
    icon: null,
    variant: 'rAdyJ',
  }
}

export function createFreeMissionSnapshot(): MissionSnapshot {
  return createMissionSnapshot(FREE_CELL.id) ?? {
    id: FREE_CELL.id,
    category: FREE_CELL.category,
    label: FREE_CELL.label,
    caption: FREE_CELL.caption,
    captureLabel: FREE_CELL.captureLabel,
    hint: FREE_CELL.hint,
    icon: FREE_CELL.icon,
    variant: FREE_CELL.variant,
    textOnly: FREE_CELL.textOnly,
    fontSize: FREE_CELL.fontSize,
    swatch: FREE_CELL.swatch,
    swatchLabel: FREE_CELL.swatchLabel,
    camera: FREE_CELL.camera,
    difficulty: FREE_CELL.difficulty,
    noPhoto: FREE_CELL.noPhoto,
    fixedPosition: FREE_CELL.fixedPosition,
  }
}

export function buildCustomBoardCells(params: {
  mode: BoardMode
  sessionId: string
  drafts: readonly CustomCellDraft[]
}): {
  cells: CellMaster[]
  freePosition: number
  missionSnapshots: MissionSnapshot[]
} {
  const recipe = getBoardRecipe(params.mode)
  const draftsByPosition = new Map(
    params.drafts.map((draft) => [draft.position, draft]),
  )
  const cells: CellMaster[] = []
  const missionSnapshots: MissionSnapshot[] = []

  for (let position = 0; position < recipe.size; position++) {
    if (position === recipe.freePosition) {
      const snapshot = createFreeMissionSnapshot()
      cells.push(missionSnapshotToCell(snapshot))
      missionSnapshots.push(snapshot)
      continue
    }

    const draft = draftsByPosition.get(position)
    const snapshot = createCustomMissionSnapshot({
      id: customCellId(params.sessionId, position),
      position,
      title: draft?.title ?? '',
      description: draft?.description,
    })
    cells.push(missionSnapshotToCell(snapshot))
    missionSnapshots.push(snapshot)
  }

  return {
    cells,
    freePosition: recipe.freePosition,
    missionSnapshots,
  }
}
