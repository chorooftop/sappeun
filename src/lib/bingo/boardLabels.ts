import type { BoardKind, BoardMode } from '@/types/bingo'

export function boardKindLabel(kind: BoardKind | undefined): string {
  return kind === 'custom' ? '커스텀 모드' : '미션 모드'
}

export function boardModeLabel(mode: BoardMode): string {
  return mode === '3x3' ? '3×3' : '5×5'
}

export function boardSummaryLabel(kind: BoardKind | undefined, mode: BoardMode) {
  return `${boardKindLabel(kind)} · ${boardModeLabel(mode)}`
}
