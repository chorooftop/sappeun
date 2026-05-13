'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { checkBingoLines } from '@/lib/bingo/checkBingoLines'
import { cn } from '@/lib/utils/cn'
import type { BoardMode } from '@/types/bingo'
import type { CellMaster } from '@/types/cell'
import { Cell } from './Cell'

interface BoardProps {
  mode: BoardMode
  nickname: string
  cells: CellMaster[]
  freePosition: number
}

const MODE_LABEL: Record<BoardMode, string> = {
  standard: '스탠다드',
  '5x5': '5×5 사진',
  '3x3': '3×3 사진',
}

export function BingoBoard({
  mode,
  nickname,
  cells,
  freePosition,
}: BoardProps) {
  const router = useRouter()
  const size = cells.length
  const side = Math.sqrt(size)

  const [marked, setMarked] = useState<ReadonlySet<number>>(
    () => new Set([freePosition]),
  )

  const lines = checkBingoLines(marked, size)

  function handleCellTap(position: number) {
    if (position === freePosition) return
    setMarked((prev) => {
      const next = new Set(prev)
      if (next.has(position)) next.delete(position)
      else next.add(position)
      return next
    })
  }

  function handleEnd() {
    const ok = window.confirm('산책을 종료할까요?')
    if (ok) router.push('/')
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-6">
      <header className="flex flex-col gap-1 rounded-card bg-paper px-4 py-3 shadow-card">
        <div className="flex items-baseline justify-between">
          <span className="text-base font-semibold text-ink-900">
            {nickname}
          </span>
          <span className="text-xs text-ink-500">{MODE_LABEL[mode]}</span>
        </div>
        <span className="text-xs text-ink-500">
          {marked.size}/{size} · 빙고 {lines.total}줄
        </span>
      </header>

      <div
        className={cn(
          'grid w-full gap-2',
          side === 5 ? 'grid-cols-5' : 'grid-cols-3',
        )}
      >
        {cells.map((cell, i) => (
          <Cell
            key={`${cell.id}-${i}`}
            cell={cell}
            marked={marked.has(i)}
            isFree={i === freePosition}
            onToggle={() => handleCellTap(i)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleEnd}
        className="mt-auto rounded-pill bg-brand-primary px-6 py-4 text-base font-semibold text-paper shadow-cell-glow hover:brightness-95"
      >
        산책 종료
      </button>
    </main>
  )
}
