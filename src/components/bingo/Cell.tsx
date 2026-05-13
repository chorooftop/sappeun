'use client'

import { Check } from 'lucide-react'
import { DynamicIcon, type IconName } from 'lucide-react/dynamic'
import { CATEGORY_STYLE } from '@/design/categories'
import { cn } from '@/lib/utils/cn'
import type { CellMaster } from '@/types/cell'

interface CellProps {
  cell: CellMaster
  marked: boolean
  isFree: boolean
  onToggle: () => void
}

export function Cell({ cell, marked, isFree, onToggle }: CellProps) {
  const style = CATEGORY_STYLE[cell.category]

  if (isFree) {
    return (
      <div
        className="relative flex aspect-square flex-col items-center justify-center rounded-cell bg-brand-accent px-1 py-1 text-center text-paper shadow-cell-glow"
        aria-label="중앙 자유 칸"
      >
        <span className="text-sm font-bold leading-tight">FREE</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={marked}
      className={cn(
        'relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-cell px-1 py-1 text-center transition-colors',
        marked
          ? 'bg-brand-primary text-paper shadow-cell-glow'
          : style.bgClass,
        !marked && style.strokeClass,
      )}
    >
      {cell.textOnly ? (
        <span
          className={cn(
            'font-bold leading-none',
            marked ? 'text-paper' : style.labelClass,
          )}
          style={{ fontSize: cell.fontSize ?? 24 }}
        >
          {cell.label}
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
          ) : (
            cell.icon && (
              <DynamicIcon
                name={cell.icon as IconName}
                size={28}
                strokeWidth={1.8}
                className={style.iconClass}
                aria-hidden
              />
            )
          )}
          <span
            className={cn(
              'line-clamp-2 text-[10px] font-semibold leading-tight',
              marked ? 'text-paper' : style.labelClass,
            )}
          >
            {cell.label}
          </span>
        </>
      )}
    </button>
  )
}
