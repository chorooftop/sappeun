'use client'

import { Flag, Shuffle, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CameraModal } from '@/components/camera/CameraModal'
import { AppShell } from '@/components/layout/AppShell'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import type { FacingMode } from '@/components/camera/useCameraStream'
import { checkBingoLines } from '@/lib/bingo/checkBingoLines'
import {
  composeBoardFromCellIds,
  pickReplacementCell,
} from '@/lib/bingo/compose'
import {
  clearActiveBoardSession,
  loadActiveBoardSession,
  saveBoardSession,
} from '@/lib/bingo/persistence'
import {
  createBoardSession,
  filterPersistableMarkedPositions,
} from '@/lib/bingo/session'
import { cn } from '@/lib/utils/cn'
import type { BoardMode } from '@/types/bingo'
import type { CellMaster } from '@/types/cell'
import type { PersistedBoardSessionV1 } from '@/types/persisted-board'
import { Cell } from './Cell'
import { MissionReplaceSheet } from './MissionReplaceSheet'
import { PhotoViewerModal } from './PhotoViewerModal'

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

function collectBingoLinePositions(
  lines: ReturnType<typeof checkBingoLines>,
  side: number,
): ReadonlySet<number> {
  const positions = new Set<number>()

  for (const row of lines.rows) {
    for (let col = 0; col < side; col++) positions.add(row * side + col)
  }

  for (const col of lines.cols) {
    for (let row = 0; row < side; row++) positions.add(row * side + col)
  }

  if (lines.diagonals.includes(0)) {
    for (let i = 0; i < side; i++) positions.add(i * side + i)
  }

  if (lines.diagonals.includes(1)) {
    for (let i = 0; i < side; i++) positions.add(i * side + (side - 1 - i))
  }

  return positions
}

function isNoPhotoCell(cell: CellMaster): boolean {
  return cell.noPhoto === true
}

export function BingoBoard({
  mode,
  nickname,
  cells,
  freePosition,
}: BoardProps) {
  const router = useRouter()
  const [boardCells, setBoardCells] = useState<readonly CellMaster[]>(cells)
  const [boardFreePosition, setBoardFreePosition] = useState(freePosition)
  const [sessionChecked, setSessionChecked] = useState(false)
  const size = boardCells.length
  const side = Math.sqrt(size)
  const isDenseBoard = side === 5

  const [marked, setMarked] = useState<ReadonlySet<number>>(
    () => new Set(),
  )
  const [photos, setPhotos] = useState<ReadonlyMap<number, PhotoEntry>>(
    () => new Map(),
  )
  const [cameraFor, setCameraFor] = useState<number | null>(null)
  const [photoViewerFor, setPhotoViewerFor] = useState<number | null>(null)
  const [replaceMode, setReplaceMode] = useState(false)
  const [replaceFor, setReplaceFor] = useState<number | null>(null)
  const [replaceError, setReplaceError] = useState<string | null>(null)
  const [celebration, setCelebration] = useState<string | null>(null)

  const urlsRef = useRef<Set<string>>(new Set())
  const sessionRef = useRef<PersistedBoardSessionV1 | null>(null)
  const previousLineTotalRef = useRef(0)
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    const urls = urlsRef.current
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u))
      urls.clear()
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const activeSession = loadActiveBoardSession()
      if (
        activeSession &&
        activeSession.mode === mode &&
        activeSession.nickname === nickname
      ) {
        const restored = composeBoardFromCellIds(
          activeSession.mode,
          activeSession.cellIds,
          activeSession.freePosition,
        )

        if (restored) {
          setBoardCells(restored.cells)
          setBoardFreePosition(restored.freePosition)
          setMarked(
            new Set(
              filterPersistableMarkedPositions(
                activeSession.markedPositions,
                restored.cells,
              ),
            ),
          )
          sessionRef.current = activeSession
          setSessionReady(true)
          setSessionChecked(true)
          return
        }

        clearActiveBoardSession()
      }

      const nextSession = createBoardSession({
        mode,
        nickname,
        cells,
        freePosition,
      })
      setBoardCells(cells)
      setBoardFreePosition(freePosition)
      setMarked(new Set(nextSession.markedPositions))
      sessionRef.current = nextSession
      saveBoardSession(nextSession)
      setSessionReady(true)
      setSessionChecked(true)
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [cells, freePosition, mode, nickname])

  useEffect(() => {
    if (!sessionReady || !sessionRef.current) return

    const nextSession: PersistedBoardSessionV1 = {
      ...sessionRef.current,
      updatedAt: new Date().toISOString(),
      freePosition: boardFreePosition,
      cellIds: boardCells.map((cell) => cell.id),
      markedPositions: filterPersistableMarkedPositions(
        marked,
        boardCells,
      ),
    }

    sessionRef.current = nextSession
    saveBoardSession(nextSession)
  }, [boardCells, boardFreePosition, marked, sessionReady])

  const lines = useMemo(() => checkBingoLines(marked, size), [marked, size])
  const bingoLinePositions = useMemo(
    () => collectBingoLinePositions(lines, side),
    [lines, side],
  )
  const replaceablePositions = useMemo(() => {
    const positions = new Set<number>()
    boardCells.forEach((_, position) => {
      if (
        position !== boardFreePosition &&
        !marked.has(position) &&
        !photos.has(position) &&
        !bingoLinePositions.has(position)
      ) {
        positions.add(position)
      }
    })
    return positions
  }, [bingoLinePositions, boardCells, boardFreePosition, marked, photos])

  useEffect(() => {
    const previous = previousLineTotalRef.current
    if (lines.total > previous) {
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current)
      }
      setCelebration(lines.total === 1 ? '빙고 완성!' : `${lines.total}줄 완성!`)
      celebrationTimerRef.current = setTimeout(() => {
        setCelebration(null)
        celebrationTimerRef.current = null
      }, 800)
    }
    previousLineTotalRef.current = lines.total
  }, [lines.total])

  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current)
      }
    }
  }, [])

  const todayLabel = useMemo(() => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}.${mm}.${dd}`
  }, [])

  const fillPct = (marked.size / size) * 100

  function toggleMarked(position: number) {
    setMarked((prev) => {
      const next = new Set(prev)
      if (next.has(position)) next.delete(position)
      else next.add(position)
      return next
    })
  }

  function handleCellTap(position: number) {
    if (replaceMode) {
      if (position === boardFreePosition) return
      if (replaceablePositions.has(position)) {
        setReplaceFor(position)
        setReplaceError(null)
      }
      return
    }

    const cell = boardCells[position]
    if (photos.has(position)) {
      setPhotoViewerFor(position)
      return
    }

    if (!isNoPhotoCell(cell)) {
      setCameraFor(position)
      return
    }
    toggleMarked(position)
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

  function revokePhotoUrl(entry: PhotoEntry) {
    URL.revokeObjectURL(entry.url)
    urlsRef.current.delete(entry.url)
  }

  function handleRemovePhoto(position: number) {
    setPhotos((prev) => {
      const existing = prev.get(position)
      if (!existing) return prev
      revokePhotoUrl(existing)
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
    if (ok) {
      clearActiveBoardSession()
      router.push('/')
    }
  }

  function handleRetakePhoto(position: number) {
    setPhotoViewerFor(null)
    setCameraFor(position)
  }

  function handleReplaceCell(position: number) {
    const target = boardCells[position]
    const replacement = pickReplacementCell(boardCells, target)

    if (!replacement) {
      setReplaceError('지금 보드에서는 바꿀 수 있는 후보가 없어요.')
      return
    }

    setBoardCells((prev) =>
      prev.map((cell, index) => (index === position ? replacement : cell)),
    )
    setMarked((prev) => {
      if (!prev.has(position)) return prev
      const next = new Set(prev)
      next.delete(position)
      return next
    })
    setPhotos((prev) => {
      const existing = prev.get(position)
      if (!existing) return prev
      revokePhotoUrl(existing)
      const next = new Map(prev)
      next.delete(position)
      return next
    })
    setReplaceFor(null)
    setReplaceMode(false)
    setReplaceError(null)
  }

  const activeCell = cameraFor !== null ? boardCells[cameraFor] : null
  const facingMode: FacingMode =
    activeCell?.camera === 'front' ? 'user' : 'environment'
  const viewerPhoto =
    photoViewerFor !== null ? photos.get(photoViewerFor) : undefined
  const viewerCell = photoViewerFor !== null ? boardCells[photoViewerFor] : null
  const replaceCell = replaceFor !== null ? boardCells[replaceFor] : null

  if (!sessionChecked) {
    return (
      <AppShell maxWidth="board" panelClassName="relative bg-canvas">
        <header className="flex items-center justify-between gap-3 bg-paper px-4 py-3">
          <button
            type="button"
            onClick={handleEnd}
            aria-label="산책 종료"
            className="flex h-11 w-11 items-center justify-center rounded-pill text-ink-900 transition-colors hover:bg-ink-100"
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
          <ThemeToggle compact />
        </header>

        <div className="flex flex-1 items-center justify-center px-4 text-sm font-semibold text-ink-500">
          진행 중인 산책을 불러오는 중
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell maxWidth="board" panelClassName="relative bg-canvas">
      <header className="flex items-center justify-between gap-3 bg-paper px-4 py-3">
        <button
          type="button"
          onClick={handleEnd}
          aria-label="산책 종료"
          className="flex h-11 w-11 items-center justify-center rounded-pill text-ink-900 transition-colors hover:bg-ink-100"
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
        <ThemeToggle compact />
      </header>

      <section
        aria-label="진행도"
        className="flex flex-col gap-1.5 bg-paper px-4 pb-2 pt-1"
      >
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
          'mx-auto grid w-full max-w-[430px] gap-1.5 px-3 py-4 min-[390px]:px-4 md:max-w-[520px] md:gap-2 md:px-5',
          side === 5 ? 'grid-cols-5' : 'grid-cols-3',
        )}
      >
        {celebration && (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute left-1/2 top-[94px] z-10 -translate-x-1/2 rounded-pill bg-ink-900 px-4 py-2 text-sm font-semibold text-paper shadow-card animate-bingo-pop"
          >
            {celebration}
          </div>
        )}
        {boardCells.map((cell, i) => (
          <Cell
            key={`${cell.id}-${i}`}
            cell={cell}
            marked={marked.has(i)}
            inBingoLine={bingoLinePositions.has(i)}
            dense={isDenseBoard}
            noPhoto={isNoPhotoCell(cell)}
            isFree={i === boardFreePosition}
            photoUrl={photos.get(i)?.url}
            replaceMode={replaceMode}
            replaceable={replaceablePositions.has(i)}
            onToggle={() => handleCellTap(i)}
          />
        ))}
      </div>

      <footer className="mt-auto flex items-center gap-3 border-t border-ink-100 bg-paper px-4 pb-7 pt-3">
        <button
          type="button"
          onClick={() => {
            setReplaceMode((prev) => !prev)
            setReplaceFor(null)
            setReplaceError(null)
          }}
          aria-pressed={replaceMode}
          className={cn(
            'flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-pill border px-4 text-sm font-semibold transition-colors',
            replaceMode
              ? 'border-brand-primary bg-brand-primary-soft text-brand-primary'
              : 'border-ink-100 bg-paper text-ink-700 hover:bg-ink-50',
          )}
        >
          <Shuffle size={16} aria-hidden />
          {replaceMode ? '선택 중' : '미션 바꾸기'}
        </button>
        <button
          type="button"
          onClick={handleEnd}
          className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-pill bg-brand-primary px-6 text-base font-semibold text-paper shadow-cell-glow transition-colors hover:brightness-95"
        >
          <Flag size={16} aria-hidden />
          산책 종료
        </button>
      </footer>

      {cameraFor !== null && activeCell && (
        <CameraModal
          facingMode={facingMode}
          cell={activeCell}
          onCapture={handleCapture}
          onClose={() => setCameraFor(null)}
        />
      )}

      {viewerPhoto && viewerCell && photoViewerFor !== null && (
        <PhotoViewerModal
          cell={viewerCell}
          photoUrl={viewerPhoto.url}
          onClose={() => setPhotoViewerFor(null)}
          onRetake={() => handleRetakePhoto(photoViewerFor)}
          onDelete={() => {
            handleRemovePhoto(photoViewerFor)
            setPhotoViewerFor(null)
          }}
        />
      )}

      {replaceCell && replaceFor !== null && (
        <MissionReplaceSheet
          cell={replaceCell}
          error={replaceError}
          onClose={() => {
            setReplaceFor(null)
            setReplaceError(null)
          }}
          onReplace={() => handleReplaceCell(replaceFor)}
        />
      )}
    </AppShell>
  )
}
