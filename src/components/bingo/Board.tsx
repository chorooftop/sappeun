'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { CameraModal } from '@/components/camera/CameraModal'
import type { FacingMode } from '@/components/camera/useCameraStream'
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

interface PhotoEntry {
  blob: Blob
  url: string
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
  const isPhotoMode = mode !== 'standard'

  const [marked, setMarked] = useState<ReadonlySet<number>>(
    () => new Set([freePosition]),
  )
  const [photos, setPhotos] = useState<ReadonlyMap<number, PhotoEntry>>(
    () => new Map(),
  )
  const [cameraFor, setCameraFor] = useState<number | null>(null)

  const urlsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const urls = urlsRef.current
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u))
      urls.clear()
    }
  }, [])

  const lines = checkBingoLines(marked, size)

  function handleCellTap(position: number) {
    if (isPhotoMode) {
      setCameraFor(position)
      return
    }
    setMarked((prev) => {
      const next = new Set(prev)
      if (next.has(position)) next.delete(position)
      else next.add(position)
      return next
    })
  }

  function handleCapture(blob: Blob) {
    if (cameraFor === null) return
    const position = cameraFor
    const url = URL.createObjectURL(blob)
    urlsRef.current.add(url)

    setPhotos((prev) => {
      const next = new Map(prev)
      const existing = next.get(position)
      if (existing) {
        URL.revokeObjectURL(existing.url)
        urlsRef.current.delete(existing.url)
      }
      next.set(position, { blob, url })
      return next
    })
    setMarked((prev) => {
      if (prev.has(position)) return prev
      const next = new Set(prev)
      next.add(position)
      return next
    })
    setCameraFor(null)
  }

  function handleRemovePhoto(position: number) {
    setPhotos((prev) => {
      const existing = prev.get(position)
      if (!existing) return prev
      URL.revokeObjectURL(existing.url)
      urlsRef.current.delete(existing.url)
      const next = new Map(prev)
      next.delete(position)
      return next
    })
    setMarked((prev) => {
      if (!prev.has(position)) return prev
      const next = new Set(prev)
      next.delete(position)
      return next
    })
  }

  function handleEnd() {
    const ok = window.confirm('산책을 종료할까요? 촬영한 사진은 사라집니다.')
    if (ok) router.push('/')
  }

  const activeCell = cameraFor !== null ? cells[cameraFor] : null
  const facingMode: FacingMode =
    activeCell?.camera === 'front' ? 'user' : 'environment'

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
            photoUrl={photos.get(i)?.url}
            onToggle={() => handleCellTap(i)}
            onRemovePhoto={
              photos.has(i) ? () => handleRemovePhoto(i) : undefined
            }
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

      {cameraFor !== null && activeCell && (
        <CameraModal
          facingMode={facingMode}
          label={activeCell.label}
          onCapture={handleCapture}
          onClose={() => setCameraFor(null)}
        />
      )}
    </main>
  )
}
