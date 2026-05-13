'use client'

import { Flag, MoreHorizontal, Shuffle, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
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

export function BingoBoard({ mode, nickname, cells, freePosition }: BoardProps) {
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

  const lines = useMemo(() => checkBingoLines(marked, size), [marked, size])

  const todayLabel = useMemo(() => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}.${mm}.${dd}`
  }, [])

  const fillPct = (marked.size / size) * 100

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

  function handleShuffle() {
    const ok = window.confirm('칸을 다시 섞을까요? 현재 진행이 사라집니다.')
    if (ok) window.location.reload()
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-3">
      <header className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleEnd}
          aria-label="산책 종료"
          className="flex h-10 w-10 items-center justify-center rounded-pill text-ink-900 transition-colors hover:bg-ink-100"
        >
          <X size={22} aria-hidden />
        </button>
        <div className="flex flex-1 flex-col items-center text-center">
          <span className="text-[15px] font-semibold text-ink-900">
            {nickname}
          </span>
          <span className="text-[11px] text-ink-500">
            오늘 산책 · {todayLabel}
          </span>
        </div>
        <button
          type="button"
          aria-label="메뉴"
          disabled
          className="flex h-10 w-10 items-center justify-center rounded-pill text-ink-500 disabled:opacity-40"
        >
          <MoreHorizontal size={22} aria-hidden />
        </button>
      </header>

      <section aria-label="진행도" className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-ink-500">
            {`채움 ${marked.size}/${size}`}
          </span>
          <span className="font-semibold text-brand-primary">
            {lines.total > 0 ? `빙고 ${lines.total}줄 완성!` : '아직 빙고 없음'}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-pill bg-ink-100">
          <div
            className="h-full rounded-pill bg-brand-primary transition-all duration-200"
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </section>

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

      <footer className="mt-auto flex items-center gap-2">
        <button
          type="button"
          onClick={handleShuffle}
          className="flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-pill border border-ink-100 bg-paper px-4 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50"
        >
          <Shuffle size={16} aria-hidden />
          셔플
        </button>
        <button
          type="button"
          onClick={handleEnd}
          className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-pill bg-brand-primary px-6 text-sm font-semibold text-paper shadow-cell-glow transition-colors hover:brightness-95"
        >
          <Flag size={16} aria-hidden />
          산책 종료
        </button>
      </footer>

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
