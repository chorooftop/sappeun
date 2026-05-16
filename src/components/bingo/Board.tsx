'use client'

import { Flag, Shuffle, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ClipRecorderModal,
  type ClipCaptureResult,
} from '@/components/camera/ClipRecorderModal'
import { AppShell } from '@/components/layout/AppShell'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { ActionDialog } from '@/components/ui'
import type { FacingMode } from '@/components/camera/useCameraStream'
import type { AuthProfileSummary } from '@/lib/auth/session'
import { checkBingoLines } from '@/lib/bingo/checkBingoLines'
import {
  composeBoardFromCellIds,
  pickReplacementCell,
} from '@/lib/bingo/compose'
import { createCustomMissionSnapshot } from '@/lib/bingo/customBoard'
import { createMissionSnapshot } from '@/lib/bingo/missionSnapshot'
import {
  clearActiveBoardSession,
  loadActiveBoardSession,
  saveBoardSession,
} from '@/lib/bingo/persistence'
import {
  createBoardSession,
  filterPersistableMarkedPositions,
} from '@/lib/bingo/session'
import {
  deleteBoardSession,
  endBoardSession,
  ensureBoardSession,
  markBoardCell,
  replaceBoardCell,
} from '@/lib/boards/client'
import {
  deleteStoredClip,
  refreshClipPreviews,
  updateStoredClipDescription,
  uploadBoardClip,
} from '@/lib/clips/client'
import {
  createPendingClipKey,
  deletePendingClip,
  savePendingClip,
} from '@/lib/clips/pendingStore'
import { cn } from '@/lib/utils/cn'
import type { BoardKind, BoardMode } from '@/types/bingo'
import type { CellMaster } from '@/types/cell'
import type { MissionSnapshot } from '@/types/mission'
import type {
  PersistedBoardSession,
  PersistedBoardSessionV4,
} from '@/types/persisted-board'
import type {
  ClipOwnerKind,
  ClipUploadStatus,
  PresignedClipUploadRequest,
} from '@/types/clip'
import { Cell } from './Cell'
import { ClipViewerModal } from './ClipViewerModal'
import { MissionReplaceSheet } from './MissionReplaceSheet'

interface BoardProps {
  authSummary: AuthProfileSummary
  mode: BoardMode
  nickname: string
  cells: CellMaster[]
  freePosition: number
  boardKind?: BoardKind
  title?: string
  description?: string
  missionSnapshots?: MissionSnapshot[]
}

interface ClipEntry {
  clipBlob?: Blob
  posterBlob?: Blob
  ownerKind?: ClipOwnerKind
  clipId?: string
  clipUrlExpiresAt?: string
  posterUrlExpiresAt?: string
  uploadStatus: ClipUploadStatus
  clipUrl: string
  posterUrl: string
  durationMs: number
  description?: string
  pendingKey?: string
  pendingMetadata?: PresignedClipUploadRequest
  uploadError?: string
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

function isNoMediaCell(cell: CellMaster): boolean {
  return cell.noPhoto === true
}

function isObjectUrl(url: string): boolean {
  return url.startsWith('blob:')
}

function shouldRefreshPreviewUrl(expiresAt: string | undefined): boolean {
  if (!expiresAt) return true
  return new Date(expiresAt).getTime() - Date.now() < 60_000
}

function cellToMissionSnapshot(cell: CellMaster): MissionSnapshot {
  return createMissionSnapshot(cell.id) ?? {
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

function sessionBoardKind(session: PersistedBoardSession | null): BoardKind {
  return session?.version === 4 ? session.boardKind : 'mission'
}

export function BingoBoard({
  authSummary,
  mode,
  nickname,
  cells,
  freePosition,
  boardKind = 'mission',
  title,
  description,
  missionSnapshots,
}: BoardProps) {
  const [boardCells, setBoardCells] = useState<readonly CellMaster[]>(cells)
  const [boardFreePosition, setBoardFreePosition] = useState(freePosition)
  const [sessionChecked, setSessionChecked] = useState(false)
  const size = boardCells.length
  const side = Math.sqrt(size)
  const isDenseBoard = side === 5

  const [marked, setMarked] = useState<ReadonlySet<number>>(
    () => new Set(),
  )
  const [clips, setClips] = useState<ReadonlyMap<number, ClipEntry>>(
    () => new Map(),
  )
  const [cameraFor, setCameraFor] = useState<number | null>(null)
  const [clipViewerFor, setClipViewerFor] = useState<number | null>(null)
  const [replaceMode, setReplaceMode] = useState(false)
  const [replaceFor, setReplaceFor] = useState<number | null>(null)
  const [replaceError, setReplaceError] = useState<string | null>(null)
  const [celebration, setCelebration] = useState<string | null>(null)
  const [boardMeta, setBoardMeta] = useState({
    boardKind,
    title: title?.trim() || nickname,
    description: description?.trim() || undefined,
  })
  const [exitDialogOpen, setExitDialogOpen] = useState(false)
  const [exitPending, setExitPending] = useState(false)
  const [exitError, setExitError] = useState<string | null>(null)
  const [finishPending, setFinishPending] = useState(false)

  const urlsRef = useRef<Set<string>>(new Set())
  const sessionRef = useRef<PersistedBoardSession | null>(null)
  const boardCellsRef = useRef<readonly CellMaster[]>(cells)
  const boardFreePositionRef = useRef(freePosition)
  const boardMetaRef = useRef(boardMeta)
  const markedRef = useRef<ReadonlySet<number>>(new Set())
  const clipsRef = useRef<ReadonlyMap<number, ClipEntry>>(new Map())
  const uploadPromisesRef = useRef<Map<number, Promise<void>>>(new Map())
  const previousLineTotalRef = useRef(0)
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [sessionReady, setSessionReady] = useState(false)

  function updateBoardCells(nextCells: readonly CellMaster[]) {
    boardCellsRef.current = nextCells
    setBoardCells(nextCells)
  }

  function updateBoardFreePosition(nextFreePosition: number) {
    boardFreePositionRef.current = nextFreePosition
    setBoardFreePosition(nextFreePosition)
  }

  const updateBoardMeta = useCallback((nextMeta: typeof boardMeta) => {
    boardMetaRef.current = nextMeta
    setBoardMeta(nextMeta)
  }, [])

  function updateMarked(
    updater: (prev: ReadonlySet<number>) => ReadonlySet<number>,
  ) {
    setMarked((prev) => {
      const next = updater(prev)
      markedRef.current = next
      return next
    })
  }

  function updateClips(
    updater: (prev: ReadonlyMap<number, ClipEntry>) => ReadonlyMap<number, ClipEntry>,
  ) {
    setClips((prev) => {
      const next = updater(prev)
      clipsRef.current = next
      return next
    })
  }

  function buildCurrentSessionSnapshot(
    overrides: {
      clips?: ReadonlyMap<number, ClipEntry>
      marked?: ReadonlySet<number>
      boardCells?: readonly CellMaster[]
      boardFreePosition?: number
    } = {},
  ): PersistedBoardSessionV4 | null {
    const current = sessionRef.current
    if (!current || (current.version !== 2 && current.version !== 3 && current.version !== 4)) {
      return null
    }

    const nextBoardCells = overrides.boardCells ?? boardCellsRef.current
    const nextClips = overrides.clips ?? clipsRef.current
    const nextMarked = overrides.marked ?? markedRef.current
    const nextFreePosition =
      overrides.boardFreePosition ?? boardFreePositionRef.current

    const currentMeta = boardMetaRef.current
    const nextMissionSnapshots = nextBoardCells.map(cellToMissionSnapshot)

    const persistedClips = Array.from(nextClips.entries())
      .filter(([, clip]) => (
        clip.uploadStatus === 'uploaded' &&
        Boolean(clip.clipId) &&
        Boolean(clip.ownerKind)
      ))
      .map(([position, clip]) => ({
        position,
        cellId: nextBoardCells[position]?.id ?? '',
        clipId: clip.clipId!,
        ownerKind: clip.ownerKind!,
        clipUrl: clip.clipUrl,
        clipUrlExpiresAt: clip.clipUrlExpiresAt,
        posterUrl: clip.posterUrl,
        posterUrlExpiresAt: clip.posterUrlExpiresAt,
        durationMs: clip.durationMs,
        description: clip.description,
        pendingKey: clip.pendingKey,
        uploadStatus: clip.uploadStatus,
      }))

    return {
      ...current,
      version: 4,
      updatedAt: new Date().toISOString(),
      boardKind: currentMeta.boardKind,
      title: currentMeta.title,
      ...(currentMeta.description ? { description: currentMeta.description } : {}),
      freePosition: nextFreePosition,
      cellIds: nextBoardCells.map((cell) => cell.id),
      missionSnapshots: nextMissionSnapshots,
      markedPositions: filterPersistableMarkedPositions(
        nextMarked,
        nextBoardCells,
      ),
      clips: persistedClips,
      endedAt: current.endedAt,
    }
  }

  function saveCurrentSessionSnapshot(
    overrides: Parameters<typeof buildCurrentSessionSnapshot>[0] = {},
  ) {
    const nextSession = buildCurrentSessionSnapshot(overrides)
    if (!nextSession) return null
    sessionRef.current = nextSession
    saveBoardSession(nextSession)
    return nextSession
  }

  const syncBoardSession = useCallback(async (
    session: PersistedBoardSession,
    options: { force?: boolean } = {},
  ) => {
    if (session.version !== 2 && session.version !== 3 && session.version !== 4) return null
    if (session.boardId && !options.force) return session.boardId

    try {
      const boardId = await ensureBoardSession(session)
      if (!boardId) {
        if (authSummary.isAuthenticated) {
          throw new Error('Expected authenticated board sync.')
        }
        return null
      }

      const nextSession: PersistedBoardSession = {
        ...session,
        boardId,
        updatedAt: new Date().toISOString(),
      }
      sessionRef.current = nextSession
      saveBoardSession(nextSession)
      return boardId
    } catch (error) {
      console.warn('Unable to sync board session', error)
      if (authSummary.isAuthenticated) throw error
      return null
    }
  }, [authSummary.isAuthenticated])

  const revokeClipUrls = useCallback((entry: ClipEntry) => {
    if (isObjectUrl(entry.clipUrl)) {
      URL.revokeObjectURL(entry.clipUrl)
      urlsRef.current.delete(entry.clipUrl)
    }
    if (isObjectUrl(entry.posterUrl)) {
      URL.revokeObjectURL(entry.posterUrl)
      urlsRef.current.delete(entry.posterUrl)
    }
  }, [])

  const refreshStoredClipUrls = useCallback(
    async (
      storedClips: Array<{
        ownerKind: ClipOwnerKind
        clipId: string
        position: number
      }>,
    ) => {
      if (!storedClips.length) return

      try {
        const refreshed = await refreshClipPreviews(
          storedClips.map((clip) => ({
            ownerKind: clip.ownerKind,
            clipId: clip.clipId,
          })),
        )
        const byId = new Map(
          refreshed.clips.map((clip) => [
            clip.requestedClipId ?? clip.clipId,
            clip,
          ]),
        )
        const missingPositions = storedClips
          .filter((storedClip) => !byId.has(storedClip.clipId))
          .map((storedClip) => storedClip.position)

        updateClips((prev) => {
          const next = new Map(prev)
          storedClips.forEach((storedClip) => {
            const fresh = byId.get(storedClip.clipId)
            const current = next.get(storedClip.position)
            if (!current) return
            if (!fresh) {
              revokeClipUrls(current)
              next.delete(storedClip.position)
              return
            }
            next.set(storedClip.position, {
              ...current,
              ownerKind: fresh.ownerKind,
              clipId: fresh.clipId,
              clipUrlExpiresAt: fresh.clipUrlExpiresAt,
              posterUrlExpiresAt: fresh.posterUrlExpiresAt,
              uploadStatus: 'uploaded',
              clipUrl: fresh.clipUrl,
              posterUrl: fresh.posterUrl,
              durationMs: fresh.durationMs,
              description: fresh.description ?? current.description,
            })
          })
          return next
        })

        if (missingPositions.length) {
          updateMarked((prev) => {
            const next = new Set(prev)
            missingPositions.forEach((position) => next.delete(position))
            return next
          })
        }
      } catch (error) {
        console.warn('Unable to refresh clip previews', error)
      }
    },
    [revokeClipUrls],
  )

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
          activeSession.version === 4 ? activeSession.missionSnapshots : [],
        )

        if (restored) {
          updateBoardCells(restored.cells)
          updateBoardFreePosition(restored.freePosition)
          updateBoardMeta({
            boardKind: sessionBoardKind(activeSession),
            title: activeSession.version === 4
              ? activeSession.title
              : activeSession.nickname,
            description: activeSession.version === 4
              ? activeSession.description
              : undefined,
          })
          const restoredClips =
            activeSession.version === 3 || activeSession.version === 4
              ? activeSession.clips.filter(
                  (clip) => clip.uploadStatus === 'uploaded',
                )
              : []
          updateMarked(() =>
            new Set([
              ...filterPersistableMarkedPositions(
                activeSession.markedPositions,
                restored.cells,
              ),
              ...restoredClips.map((clip) => clip.position),
            ]),
          )
          updateClips(() =>
            new Map(
              restoredClips.map((clip) => [
                clip.position,
                {
                  ownerKind: clip.ownerKind,
                  clipId: clip.clipId,
                  clipUrlExpiresAt: clip.clipUrlExpiresAt,
                  posterUrlExpiresAt: clip.posterUrlExpiresAt,
                  uploadStatus: 'uploaded' as const,
                  clipUrl: clip.clipUrl ?? '',
                  posterUrl: clip.posterUrl ?? '',
                  durationMs: clip.durationMs,
                  description: clip.description,
                },
              ]),
            ),
          )
          sessionRef.current = activeSession
          setSessionReady(true)
          setSessionChecked(true)
          void syncBoardSession(activeSession).catch((error) => {
            console.warn('Unable to sync restored board session', error)
          })
          void refreshStoredClipUrls(restoredClips)
          return
        }

        clearActiveBoardSession()
      }

      const nextSession = createBoardSession({
        mode,
        nickname,
        cells,
        freePosition,
        boardKind,
        title,
        description,
        missionSnapshots,
      })
      updateBoardCells(cells)
      updateBoardFreePosition(freePosition)
      updateBoardMeta({
        boardKind,
        title: title?.trim() || nickname,
        description: description?.trim() || undefined,
      })
      updateMarked(() => new Set(nextSession.markedPositions))
      sessionRef.current = nextSession
      saveBoardSession(nextSession)
      setSessionReady(true)
      setSessionChecked(true)
      void syncBoardSession(nextSession).catch((error) => {
        console.warn('Unable to sync new board session', error)
      })
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [
    boardKind,
    cells,
    description,
    freePosition,
    missionSnapshots,
    mode,
    nickname,
    refreshStoredClipUrls,
    syncBoardSession,
    title,
    updateBoardMeta,
  ])

  useEffect(() => {
    if (!sessionReady || !sessionRef.current) return

    const persistedClips = Array.from(clips.entries())
      .filter(([, clip]) => (
        clip.uploadStatus === 'uploaded' &&
        Boolean(clip.clipId) &&
        Boolean(clip.ownerKind)
      ))
      .map(([position, clip]) => ({
        position,
        cellId: boardCells[position]?.id ?? '',
        clipId: clip.clipId!,
        ownerKind: clip.ownerKind!,
        clipUrl: clip.clipUrl,
        clipUrlExpiresAt: clip.clipUrlExpiresAt,
        posterUrl: clip.posterUrl,
        posterUrlExpiresAt: clip.posterUrlExpiresAt,
        durationMs: clip.durationMs,
        description: clip.description,
        pendingKey: clip.pendingKey,
        uploadStatus: clip.uploadStatus,
      }))

    const nextSession: PersistedBoardSession = {
      ...sessionRef.current,
      version: 4,
      updatedAt: new Date().toISOString(),
      boardKind: boardMeta.boardKind,
      title: boardMeta.title,
      ...(boardMeta.description ? { description: boardMeta.description } : {}),
      freePosition: boardFreePosition,
      cellIds: boardCells.map((cell) => cell.id),
      missionSnapshots: boardCells.map(cellToMissionSnapshot),
      markedPositions: filterPersistableMarkedPositions(
        marked,
        boardCells,
      ),
      clips: persistedClips,
    }

    sessionRef.current = nextSession
    saveBoardSession(nextSession)
  }, [boardCells, boardFreePosition, boardMeta, marked, clips, sessionReady])

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
        !clips.has(position) &&
        !bingoLinePositions.has(position)
      ) {
        positions.add(position)
      }
    })
    return positions
  }, [bingoLinePositions, boardCells, boardFreePosition, marked, clips])

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
  const headerSubtitle = boardMeta.boardKind === 'custom'
    ? boardMeta.description || '커스텀 빙고'
    : `오늘 산책 · ${todayLabel}`
  const canReplaceMissions = boardMeta.boardKind === 'mission'

  function goHomeWithFreshAuth() {
    window.location.assign('/')
  }

  function toggleMarked(position: number) {
    const cell = boardCells[position]
    const nextMarked = !marked.has(position)

    updateMarked((prev) => {
      const next = new Set(prev)
      if (next.has(position)) next.delete(position)
      else next.add(position)
      return next
    })

    const boardId =
      sessionRef.current?.version === 2 ||
      sessionRef.current?.version === 3 ||
      sessionRef.current?.version === 4
      ? sessionRef.current.boardId
      : undefined
    if (boardId && cell) {
      void markBoardCell(boardId, position, cell.id, nextMarked).catch((error) => {
        console.warn('Unable to sync board mark', error)
      })
    }
  }

  function handleCellTap(position: number) {
    if (replaceMode && canReplaceMissions) {
      if (position === boardFreePosition) return
      if (replaceablePositions.has(position)) {
        setReplaceFor(position)
        setReplaceError(null)
      }
      return
    }

    const cell = boardCells[position]
    if (clips.has(position)) {
      setClipViewerFor(position)
      return
    }

    if (!isNoMediaCell(cell)) {
      setCameraFor(position)
      return
    }
    toggleMarked(position)
  }

  useEffect(() => {
    if (!sessionReady) return

    const storedClips = Array.from(clips.entries())
      .filter(([, clip]) => (
        clip.uploadStatus === 'uploaded' &&
        Boolean(clip.ownerKind) &&
        Boolean(clip.clipId) &&
        (!clip.clipUrl ||
          !clip.posterUrl ||
          shouldRefreshPreviewUrl(clip.clipUrlExpiresAt) ||
          shouldRefreshPreviewUrl(clip.posterUrlExpiresAt))
      ))
      .map(([position, clip]) => ({
        position,
        ownerKind: clip.ownerKind!,
        clipId: clip.clipId!,
      }))

    if (!storedClips.length) return

    const timeout = window.setTimeout(() => {
      void refreshStoredClipUrls(storedClips)
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [clips, refreshStoredClipUrls, sessionReady])

  function getClipOrientation(
    width: number | undefined,
    height: number | undefined,
  ) {
    if (!width || !height) return undefined
    if (width === height) return 'square' as const
    return width > height ? 'landscape' as const : 'portrait' as const
  }

  function handleCapture(result: ClipCaptureResult) {
    if (cameraFor === null) return
    const position = cameraFor
    const clipUrl = URL.createObjectURL(result.clip.blob)
    const posterUrl = URL.createObjectURL(result.poster.blob)
    urlsRef.current.add(clipUrl)
    urlsRef.current.add(posterUrl)
    const existing = clips.get(position)

    updateClips((prev) => {
      const next = new Map(prev)
      const current = next.get(position)
      if (current) revokeClipUrls(current)
      next.set(position, {
        clipBlob: result.clip.blob,
        posterBlob: result.poster.blob,
        uploadStatus: 'uploading',
        clipUrl,
        posterUrl,
        durationMs: result.clip.durationMs,
        description: result.description,
      })
      return next
    })
    updateMarked((prev) => {
      if (prev.has(position)) return prev
      const next = new Set(prev)
      next.add(position)
      return next
    })
    setCameraFor(null)
    const uploadPromise = persistCapturedClip(
      position,
      result,
      clipUrl,
      posterUrl,
      existing,
    ).finally(() => {
      uploadPromisesRef.current.delete(position)
    })
    uploadPromisesRef.current.set(position, uploadPromise)
    void uploadPromise
  }

  async function persistCapturedClip(
    position: number,
    result: ClipCaptureResult,
    localClipUrl: string,
    localPosterUrl: string,
    previousClip: ClipEntry | undefined,
  ) {
    const session = sessionRef.current
    const cell = boardCells[position]
    if (!session || !cell) return

    const pendingKey = createPendingClipKey(session.sessionId, position)
    const currentMeta = boardMetaRef.current
    const metadata = {
      clientBoardSessionId: session.sessionId,
      mode,
      boardKind: currentMeta.boardKind,
      nickname,
      title: currentMeta.title,
      description: currentMeta.description,
      freePosition: boardFreePosition,
      cellIds: boardCells.map((boardCell) => boardCell.id),
      missionSnapshots: boardCells.map(cellToMissionSnapshot),
      position,
      cellId: cell.id,
      contentType: result.clip.mime.contentType,
      recorderMimeType: result.clip.mime.recorderMimeType,
      sizeBytes: result.clip.blob.size,
      durationMs: result.clip.durationMs,
      width: result.clip.width,
      height: result.clip.height,
      orientation: getClipOrientation(result.clip.width, result.clip.height),
      posterContentType: result.poster.contentType,
      posterSizeBytes: result.poster.blob.size,
      posterWidth: result.poster.width,
      posterHeight: result.poster.height,
      clipDescription: result.description,
    }

    try {
      await savePendingClip({
        key: pendingKey,
        clipBlob: result.clip.blob,
        posterBlob: result.poster.blob,
        metadata,
        createdAt: new Date().toISOString(),
      })

      const uploaded = await uploadBoardClip(
        metadata,
        result.clip.blob,
        result.poster.blob,
      )

      const currentClips = clipsRef.current
      const current = currentClips.get(position)
      if (current?.clipUrl === localClipUrl) {
        const latestDescription =
          current.description !== result.description
            ? current.description
            : result.description
        const nextClips = new Map(currentClips)
        nextClips.set(position, {
          ownerKind: uploaded.ownerKind,
          clipId: uploaded.clipId,
          clipUrlExpiresAt: uploaded.clipUrlExpiresAt,
          posterUrlExpiresAt: uploaded.posterUrlExpiresAt,
          uploadStatus: 'uploaded',
          clipUrl: uploaded.clipUrl,
          posterUrl: uploaded.posterUrl,
          durationMs: uploaded.durationMs,
          description: uploaded.description ?? latestDescription,
          pendingKey,
          pendingMetadata: undefined,
          uploadError: undefined,
        })
        clipsRef.current = nextClips
        setClips(nextClips)
        const latestSession = saveCurrentSessionSnapshot({ clips: nextClips })

        if (
          uploaded.clipId &&
          uploaded.ownerKind &&
          (latestDescription !== uploaded.description ||
            (uploaded.ownerKind === 'guest' && latestSession?.version === 4))
        ) {
          try {
            await updateStoredClipDescription(
              uploaded.clipId,
              uploaded.ownerKind,
              latestDescription,
              latestSession?.version === 4 ? latestSession : undefined,
            )
          } catch (error) {
            console.warn('Unable to sync clip metadata after upload', error)
          }
        }
      }

      URL.revokeObjectURL(localClipUrl)
      URL.revokeObjectURL(localPosterUrl)
      urlsRef.current.delete(localClipUrl)
      urlsRef.current.delete(localPosterUrl)
      await deletePendingClip(pendingKey)

      if (previousClip?.clipId && previousClip.ownerKind) {
        void deleteStoredClip(previousClip.clipId, previousClip.ownerKind)
      }
    } catch (error) {
      console.warn('Clip upload failed', error)
      const uploadError =
        error instanceof Error
          ? error.message
          : '업로드에 실패한 클립이 있어요. 다시 촬영하거나 삭제해주세요.'
      const currentClips = clipsRef.current
      const current = currentClips.get(position)
      if (current?.clipUrl === localClipUrl) {
        const next = new Map(currentClips)
        next.set(position, {
          ...current,
          clipBlob: result.clip.blob,
          posterBlob: result.poster.blob,
          pendingKey,
          pendingMetadata: metadata,
        uploadStatus: 'failed',
        uploadError,
        description: result.description,
      })
        clipsRef.current = next
        setClips(next)
      }
      if (markedRef.current.has(position)) {
        const nextMarked = new Set(markedRef.current)
        nextMarked.delete(position)
        markedRef.current = nextMarked
        setMarked(nextMarked)
      }
    }
  }

  async function retryFailedClipUpload(position: number, clip: ClipEntry) {
    if (!clip.clipBlob || !clip.posterBlob || !clip.pendingMetadata) return

    updateClips((prev) => {
      const current = prev.get(position)
      if (current !== clip) return prev
      const next = new Map(prev)
      next.set(position, {
        ...current,
        uploadStatus: 'uploading',
        uploadError: undefined,
      })
      return next
    })

    try {
      const uploaded = await uploadBoardClip(
        clip.pendingMetadata,
        clip.clipBlob,
        clip.posterBlob,
      )
      const currentClips = clipsRef.current
      const current = currentClips.get(position)
      if (!current || current.pendingKey !== clip.pendingKey) return

      const nextClips = new Map(currentClips)
      nextClips.set(position, {
        ownerKind: uploaded.ownerKind,
        clipId: uploaded.clipId,
        clipUrlExpiresAt: uploaded.clipUrlExpiresAt,
        posterUrlExpiresAt: uploaded.posterUrlExpiresAt,
        uploadStatus: 'uploaded',
        clipUrl: uploaded.clipUrl,
        posterUrl: uploaded.posterUrl,
        durationMs: uploaded.durationMs,
        description: uploaded.description ?? clip.description,
        pendingKey: clip.pendingKey,
        pendingMetadata: undefined,
        uploadError: undefined,
      })
      clipsRef.current = nextClips
      setClips(nextClips)
      saveCurrentSessionSnapshot({ clips: nextClips })

      revokeClipUrls(clip)
      if (clip.pendingKey) {
        await deletePendingClip(clip.pendingKey)
      }
    } catch (error) {
      console.warn('Clip retry failed', error)
      const uploadError =
        error instanceof Error
          ? error.message
          : '업로드에 실패한 클립이 있어요. 다시 촬영하거나 삭제해주세요.'
      updateClips((prev) => {
        const current = prev.get(position)
        if (!current || current.pendingKey !== clip.pendingKey) return prev
        const next = new Map(prev)
        next.set(position, {
          ...current,
          uploadStatus: 'failed',
          uploadError,
        })
        return next
      })
    }
  }

  function handleRemoveClip(position: number) {
    const clip = clips.get(position)
    updateClips((prev) => {
      const existing = prev.get(position)
      if (!existing) return prev
      revokeClipUrls(existing)
      const next = new Map(prev)
      next.delete(position)
      return next
    })
    if (clip?.clipId && clip.ownerKind) {
      void deleteStoredClip(clip.clipId, clip.ownerKind)
    }
    if (clip?.pendingKey) {
      void deletePendingClip(clip.pendingKey)
    }
    updateMarked((prev) => {
      if (!prev.has(position)) return prev
      const next = new Set(prev)
      next.delete(position)
      return next
    })
  }

  function openExitDialog() {
    setExitError(null)
    setExitDialogOpen(true)
  }

  async function handleSaveAndExit() {
    const session = sessionRef.current
    if (!session) {
      goHomeWithFreshAuth()
      return
    }

    setExitPending(true)
    setExitError(null)
    try {
      const pendingUploads = Array.from(uploadPromisesRef.current.values())
      if (pendingUploads.length) {
        await Promise.allSettled(pendingUploads)
      }

      const retryableFailedUploads = Array.from(clipsRef.current.entries())
        .filter(([, clip]) => (
          clip.uploadStatus === 'failed' &&
          Boolean(clip.clipBlob) &&
          Boolean(clip.posterBlob) &&
          Boolean(clip.pendingMetadata)
        ))
      if (retryableFailedUploads.length) {
        await Promise.allSettled(
          retryableFailedUploads.map(([position, clip]) =>
            retryFailedClipUpload(position, clip),
          ),
        )
      }

      const failedClip = Array.from(clipsRef.current.values()).find(
        (clip) => clip.uploadStatus === 'failed',
      )
      if (failedClip) {
        setExitError(
          failedClip.uploadError ??
            '업로드에 실패한 클립이 있어요. 다시 촬영하거나 삭제해주세요.',
        )
        return
      }

      const unfinishedClip = Array.from(clipsRef.current.values()).find(
        (clip) => clip.uploadStatus !== 'uploaded',
      )
      if (unfinishedClip) {
        setExitError('클립 저장이 아직 끝나지 않았어요. 잠시 후 다시 시도해주세요.')
        return
      }

      const latestSession = saveCurrentSessionSnapshot()
      if (!latestSession) {
        goHomeWithFreshAuth()
        return
      }
      await syncBoardSession(latestSession)
      goHomeWithFreshAuth()
    } catch (error) {
      console.warn('Unable to save board before exit', error)
      setExitError('저장 후 나가기를 완료하지 못했어요. 다시 시도해주세요.')
    } finally {
      setExitPending(false)
    }
  }

  async function handleDiscardAndExit() {
    const session = sessionRef.current
    let boardId =
      session?.version === 2 || session?.version === 3 || session?.version === 4
      ? session.boardId
      : undefined

    setExitPending(true)
    setExitError(null)
    try {
      if (!boardId && session) {
        boardId = (await syncBoardSession(session)) ?? undefined
      }
      if (boardId) await deleteBoardSession(boardId)
      clearActiveBoardSession()
      setExitDialogOpen(false)
      goHomeWithFreshAuth()
    } catch (error) {
      console.warn('Unable to discard board session', error)
      setExitError('진행 중인 미션 삭제를 완료하지 못했어요. 다시 시도해주세요.')
    } finally {
      setExitPending(false)
    }
  }

  async function handleEnd() {
    if (finishPending) return
    const pendingClip = Array.from(clips.values()).find(
      (clip) => clip.uploadStatus !== 'uploaded',
    )
    if (pendingClip) {
      window.alert('클립 업로드가 끝난 뒤 산책을 종료할 수 있어요.')
      return
    }
    const ok = window.confirm(
      '산책을 종료할까요? 계정에 저장되지 않은 임시 클립은 3일 뒤 사라집니다.',
    )
    if (!ok) return

    const session = sessionRef.current
    let boardId =
      session?.version === 2 || session?.version === 3 || session?.version === 4
      ? session.boardId
      : undefined

    setFinishPending(true)
    try {
      if (!boardId && session) {
        boardId = (await syncBoardSession(session)) ?? undefined
      }
      if (boardId) await endBoardSession(boardId)
      clearActiveBoardSession()
      goHomeWithFreshAuth()
    } catch (error) {
      console.warn('Unable to end board session', error)
      window.alert('산책 종료를 완료하지 못했어요. 다시 시도해주세요.')
    } finally {
      setFinishPending(false)
    }
  }

  function handleRetakeClip(position: number) {
    setClipViewerFor(null)
    setCameraFor(position)
  }

  async function handleSaveClipMetadata(
    position: number,
    input: {
      clipDescription?: string
      cellTitle?: string
      cellDescription?: string
    },
  ) {
    const currentClip = clipsRef.current.get(position)
    if (!currentClip) return

    let nextBoardCells = boardCellsRef.current
    if (boardMetaRef.current.boardKind === 'custom') {
      const currentCell = nextBoardCells[position]
      if (currentCell) {
        const snapshot = createCustomMissionSnapshot({
          id: currentCell.id,
          position,
          title: input.cellTitle,
          description: input.cellDescription,
        })
        nextBoardCells = nextBoardCells.map((cell, index) =>
          index === position
            ? {
                ...cell,
                category: snapshot.category,
                label: snapshot.label,
                caption: snapshot.caption,
                captureLabel: snapshot.captureLabel,
                hint: snapshot.hint,
                icon: snapshot.icon,
                variant: snapshot.variant,
              }
            : cell,
        )
        updateBoardCells(nextBoardCells)
      }
    }

    const nextClips = new Map(clipsRef.current)
    nextClips.set(position, {
      ...currentClip,
      description: input.clipDescription,
      pendingMetadata: currentClip.pendingMetadata
        ? {
            ...currentClip.pendingMetadata,
            clipDescription: input.clipDescription,
          }
        : undefined,
    })
    clipsRef.current = nextClips
    setClips(nextClips)

    const latestSession = saveCurrentSessionSnapshot({
      boardCells: nextBoardCells,
      clips: nextClips,
    })

    if (currentClip.clipId && currentClip.ownerKind) {
      await updateStoredClipDescription(
        currentClip.clipId,
        currentClip.ownerKind,
        input.clipDescription,
        latestSession?.version === 4 ? latestSession : undefined,
      )
    }

    if (latestSession?.version === 4 && authSummary.isAuthenticated) {
      await syncBoardSession(latestSession, { force: true })
    }
  }

  function handleReplaceCell(position: number) {
    const target = boardCells[position]
    const replacement = pickReplacementCell(boardCells, target)

    if (!replacement) {
      setReplaceError('지금 보드에서는 바꿀 수 있는 후보가 없어요.')
      return
    }

    updateBoardCells(
      boardCellsRef.current.map((cell, index) =>
        index === position ? replacement : cell,
      ),
    )
    updateMarked((prev) => {
      if (!prev.has(position)) return prev
      const next = new Set(prev)
      next.delete(position)
      return next
    })
    updateClips((prev) => {
      const existing = prev.get(position)
      if (!existing) return prev
      revokeClipUrls(existing)
      if (existing.clipId && existing.ownerKind) {
        void deleteStoredClip(existing.clipId, existing.ownerKind)
      }
      if (existing.pendingKey) {
        void deletePendingClip(existing.pendingKey)
      }
      const next = new Map(prev)
      next.delete(position)
      return next
    })
    setReplaceFor(null)
    setReplaceMode(false)
    setReplaceError(null)

    const boardId =
      sessionRef.current?.version === 2 ||
      sessionRef.current?.version === 3 ||
      sessionRef.current?.version === 4
      ? sessionRef.current.boardId
      : undefined
    if (boardId) {
      void replaceBoardCell(boardId, position, replacement.id).catch((error) => {
        console.warn('Unable to sync board cell replacement', error)
      })
    }
  }

  const activeCell = cameraFor !== null ? boardCells[cameraFor] : null
  const facingMode: FacingMode =
    activeCell?.camera === 'front' ? 'user' : 'environment'
  const viewerClip =
    clipViewerFor !== null ? clips.get(clipViewerFor) : undefined
  const viewerCell = clipViewerFor !== null ? boardCells[clipViewerFor] : null
  const replaceCell = replaceFor !== null ? boardCells[replaceFor] : null
  const exitDialog = exitDialogOpen ? (
    <ActionDialog
      title="산책을 저장하고 나갈까요?"
      description="저장하고 나가면 홈에서 이어하기로 돌아올 수 있어요. 삭제하고 나가면 진행 중인 미션과 임시 클립 기록이 지워져요."
      error={exitError}
      isPending={exitPending}
      pendingLabel="클립 저장 중"
      onClose={() => setExitDialogOpen(false)}
      actions={[
        {
          label: '저장하고 나가기',
          onClick: handleSaveAndExit,
        },
        {
          label: '삭제하고 나가기',
          onClick: handleDiscardAndExit,
          variant: 'destructive',
        },
        {
          label: '취소',
          onClick: () => setExitDialogOpen(false),
          variant: 'tertiary',
        },
      ]}
    />
  ) : null

  if (!sessionChecked) {
    return (
      <AppShell maxWidth="board" panelClassName="relative bg-canvas">
        <header className="flex items-center justify-between gap-3 bg-paper px-4 py-3">
          <button
            type="button"
            onClick={openExitDialog}
            aria-label="산책 나가기"
            className="flex h-11 w-11 items-center justify-center rounded-pill text-ink-900 transition-colors hover:bg-ink-100"
          >
            <X size={22} aria-hidden />
          </button>
          <div className="flex flex-1 flex-col items-center text-center">
            <span className="text-[15px] font-semibold text-ink-900">
              {boardMeta.title}
            </span>
            <span className="text-[11px] text-ink-500">
              {headerSubtitle}
            </span>
          </div>
          <ThemeToggle compact />
        </header>

        <div className="flex flex-1 items-center justify-center px-4 text-sm font-semibold text-ink-500">
          진행 중인 산책을 불러오는 중
        </div>
        {exitDialog}
      </AppShell>
    )
  }

  return (
    <AppShell maxWidth="board" panelClassName="relative bg-canvas">
      <header className="flex items-center justify-between gap-3 bg-paper px-4 py-3">
        <button
          type="button"
          onClick={openExitDialog}
          aria-label="산책 나가기"
          className="flex h-11 w-11 items-center justify-center rounded-pill text-ink-900 transition-colors hover:bg-ink-100"
        >
          <X size={22} aria-hidden />
        </button>
        <div className="flex flex-1 flex-col items-center text-center">
          <span className="text-[15px] font-semibold text-ink-900">
            {boardMeta.title}
          </span>
          <span className="text-[11px] text-ink-500">
            {headerSubtitle}
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
            noPhoto={isNoMediaCell(cell)}
            isFree={i === boardFreePosition}
            clipUrl={clips.get(i)?.clipUrl}
            clipPosterUrl={clips.get(i)?.posterUrl}
            replaceMode={replaceMode && canReplaceMissions}
            replaceable={canReplaceMissions && replaceablePositions.has(i)}
            onToggle={() => handleCellTap(i)}
          />
        ))}
      </div>

      <footer className="mt-auto flex items-center gap-3 border-t border-ink-100 bg-paper px-4 pb-7 pt-3">
        {canReplaceMissions && (
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
        )}
        <button
          type="button"
          onClick={handleEnd}
          disabled={finishPending}
          className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-pill bg-brand-primary px-6 text-base font-semibold text-paper shadow-cell-glow transition-colors hover:brightness-95"
        >
          <Flag size={16} aria-hidden />
          {finishPending ? '종료 중' : '산책 종료'}
        </button>
      </footer>

      {exitDialog}

      {cameraFor !== null && activeCell && (
        <ClipRecorderModal
          facingMode={facingMode}
          cell={activeCell}
          onCapture={handleCapture}
          onClose={() => setCameraFor(null)}
        />
      )}

      {viewerClip && viewerCell && clipViewerFor !== null && (
        <ClipViewerModal
          key={`${clipViewerFor}-${viewerClip.clipId ?? viewerClip.clipUrl}`}
          cell={viewerCell}
          clipUrl={viewerClip.clipUrl}
          posterUrl={viewerClip.posterUrl}
          boardKind={boardMeta.boardKind}
          clipDescription={viewerClip.description}
          onClose={() => setClipViewerFor(null)}
          onRetake={() => handleRetakeClip(clipViewerFor)}
          onDelete={() => {
            handleRemoveClip(clipViewerFor)
            setClipViewerFor(null)
          }}
          onSave={(input) => handleSaveClipMetadata(clipViewerFor, input)}
        />
      )}

      {canReplaceMissions && replaceCell && replaceFor !== null && (
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
