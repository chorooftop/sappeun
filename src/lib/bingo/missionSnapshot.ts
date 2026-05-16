import { getCellById, SHEET } from '@/data/sheet'
import type { MissionSnapshot } from '@/types/mission'

export const MISSION_CATALOG_VERSION = SHEET.version

export function createMissionSnapshot(cellId: string): MissionSnapshot | null {
  const cell = getCellById(cellId)
  if (!cell) return null

  return {
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
  }
}

export function missionLabelFor(cellId: string) {
  return createMissionSnapshot(cellId)?.label ?? cellId
}
