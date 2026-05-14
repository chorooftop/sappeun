'use client'

import { Check, Lock, X } from 'lucide-react'
import type { MouseEvent } from 'react'
import { DynamicIcon } from '@/lib/icons/dynamic-icon'
import { cn } from '@/lib/utils/cn'
import type { CellMaster } from '@/types/cell'

const BINGO_GLOW_CLASS =
  'shadow-[0_0_14px_1px_#FFC857]'

interface CellProps {
  cell: CellMaster
  marked: boolean
  inBingoLine?: boolean
  noPhoto?: boolean
  isFree: boolean
  photoUrl?: string
  onToggle: () => void
  onRemovePhoto?: () => void
}

export function Cell({
  cell,
  marked,
  inBingoLine = false,
  noPhoto = false,
  isFree,
  photoUrl,
  onToggle,
  onRemovePhoto,
}: CellProps) {
  const accessibleLabel = cell.captureLabel ?? cell.label

  if (photoUrl) {
    function handleRemoveClick(e: MouseEvent<HTMLButtonElement>) {
      e.stopPropagation()
      onRemovePhoto?.()
    }
    return (
      <div className="relative aspect-square">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={marked}
          aria-label={`${accessibleLabel} (촬영됨, 다시 찍기)`}
          className={cn(
            'absolute inset-0 overflow-hidden rounded-cell border-2 transition-all',
            marked
              ? 'border-brand-primary shadow-cell-glow'
              : 'border-transparent',
            inBingoLine && BINGO_GLOW_CLASS,
          )}
        >
          <span
            className="pointer-events-none absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${photoUrl})` }}
            aria-hidden
          />
          <span className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-ink-900/70 via-transparent to-transparent px-1 pb-1">
            <span className="line-clamp-1 text-[10px] font-medium text-paper">
              {accessibleLabel}
            </span>
          </span>
          {marked && (
            <span className="pointer-events-none absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-pill bg-brand-primary text-paper shadow">
              <Check size={14} strokeWidth={3} aria-hidden />
            </span>
          )}
        </button>
        {onRemovePhoto && (
          <button
            type="button"
            onClick={handleRemoveClick}
            aria-label={`${accessibleLabel} 사진 삭제`}
            className="absolute left-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-pill bg-ink-900/70 text-paper hover:bg-ink-900"
          >
            <X size={12} strokeWidth={3} aria-hidden />
          </button>
        )}
      </div>
    )
  }

  if (isFree) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={marked}
        aria-label={marked ? '중앙 자유 칸 (완료)' : '중앙 자유 칸 (여기서 시작)'}
        className={cn(
          'relative flex aspect-square flex-col items-center justify-center rounded-cell px-1 py-1 text-center transition-all',
          marked
            ? 'bg-brand-accent text-paper shadow-cell-glow'
            : 'border-2 border-brand-accent bg-brand-accent-soft text-brand-accent',
          inBingoLine && BINGO_GLOW_CLASS,
        )}
      >
        <span
          className={cn(
            'font-bold leading-tight',
            marked ? 'text-sm' : 'text-[11px]',
          )}
        >
          {marked ? 'FREE' : '여기서 시작!'}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={marked}
      aria-label={
        noPhoto ? `${accessibleLabel} (사진 없이 마킹)` : accessibleLabel
      }
      className={cn(
        'relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-cell border-[1.5px] px-1 py-1 text-center transition-all',
        marked
          ? 'border-brand-primary bg-brand-primary text-paper shadow-cell-glow'
          : noPhoto
            ? 'border-ink-300 bg-ink-50 text-ink-500'
            : 'border-ink-300 bg-paper text-ink-700',
        inBingoLine && BINGO_GLOW_CLASS,
      )}
    >
      {cell.textOnly ? (
        <span className="flex flex-col items-center gap-0.5">
          <span
            className={cn(
              'font-bold leading-none',
              marked ? 'text-paper' : 'text-ink-700',
            )}
            style={{ fontSize: cell.fontSize ?? 24 }}
          >
            {cell.label}
          </span>
          {cell.caption && (
            <span
              className={cn(
                'text-[10px] font-semibold leading-tight',
                marked ? 'text-paper/90' : 'text-ink-500',
              )}
            >
              {cell.caption}
            </span>
          )}
        </span>
      ) : (
        <>
          {marked ? (
            <Check
              size={32}
              strokeWidth={3}
              className="text-paper"
              aria-hidden
            />
          ) : noPhoto ? (
            <Lock
              size={24}
              strokeWidth={2}
              className="text-ink-500"
              aria-hidden
            />
          ) : (
            cell.icon && (
              <DynamicIcon
                name={cell.icon}
                size={30}
                strokeWidth={1.8}
                className="text-ink-700"
                aria-hidden
              />
            )
          )}
          <span
            className={cn(
              'line-clamp-2 text-[10px] font-semibold leading-tight',
              marked ? 'text-paper' : 'text-ink-700',
            )}
          >
            {cell.label}
          </span>
        </>
      )}
    </button>
  )
}
