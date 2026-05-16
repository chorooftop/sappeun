'use client'

import { Camera, CheckCircle2, Clock3, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ActionDialog, Button } from '@/components/ui'
import { saveBoardSession } from '@/lib/bingo/persistence'
import { deleteBoardSession } from '@/lib/boards/client'
import type {
  BoardHistoryDetail,
  BoardHistoryItem,
} from '@/types/board-history'
import type { PersistedBoardSessionV2 } from '@/types/persisted-board'

interface WalksClientProps {
  initialBoards: BoardHistoryItem[]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function toSession(board: BoardHistoryDetail): PersistedBoardSessionV2 {
  return {
    version: 2,
    boardId: board.id,
    sessionId: board.sessionId,
    mode: board.mode,
    nickname: board.nickname,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
    freePosition: board.freePosition,
    cellIds: board.cellIds,
    markedPositions: board.cells
      .filter((cell) => cell.markedAt || cell.completedAt || cell.photo)
      .map((cell) => cell.position),
    photos: board.cells
      .filter((cell) => cell.photo)
      .map((cell) => ({
        position: cell.position,
        cellId: cell.cellId,
        photoId: cell.photo!.photoId,
        ownerKind: 'user' as const,
        previewUrl: cell.photo!.previewUrl,
        previewUrlExpiresAt: cell.photo!.previewUrlExpiresAt,
        uploadStatus: 'uploaded' as const,
      })),
    endedAt: board.endedAt,
  }
}

export function WalksClient({ initialBoards }: WalksClientProps) {
  const router = useRouter()
  const [boards, setBoards] = useState(initialBoards)
  const [deleteTarget, setDeleteTarget] = useState<BoardHistoryItem | null>(null)
  const [deletePending, setDeletePending] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [continuePendingId, setContinuePendingId] = useState<string | null>(null)

  async function handleContinue(board: BoardHistoryItem) {
    if (board.endedAt || continuePendingId) return

    setContinuePendingId(board.id)
    try {
      const response = await fetch(`/api/boards/${board.id}`, {
        cache: 'no-store',
      })
      if (!response.ok) {
        throw new Error(`Board detail failed with ${response.status}`)
      }
      const payload = (await response.json()) as {
        board: BoardHistoryDetail | null
      }
      if (!payload.board) {
        throw new Error('Board detail missing')
      }

      const session = toSession(payload.board)
      saveBoardSession(session)
      const qs = new URLSearchParams({
        mode: session.mode,
        nickname: session.nickname,
      })
      router.push(`/bingo?${qs.toString()}`)
    } catch (error) {
      console.warn('Unable to continue board session', error)
      window.alert('진행 중인 미션을 불러오지 못했어요. 다시 시도해주세요.')
    } finally {
      setContinuePendingId(null)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return

    setDeletePending(true)
    setDeleteError(null)
    try {
      await deleteBoardSession(deleteTarget.id)
      setBoards((prev) => prev.filter((board) => board.id !== deleteTarget.id))
      setDeleteTarget(null)
      router.refresh()
    } catch (error) {
      console.warn('Unable to delete board history', error)
      setDeleteError('기록을 삭제하지 못했어요. 다시 시도해주세요.')
    } finally {
      setDeletePending(false)
    }
  }

  if (boards.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-ink-300 bg-paper px-5 py-10 text-center">
        <Camera size={34} className="text-brand-primary" aria-hidden />
        <div className="flex flex-col gap-1">
          <p className="text-[length:var(--text-body-1)] font-semibold text-ink-900">
            아직 저장된 산책이 없어요
          </p>
          <p className="text-[length:var(--text-caption)] text-ink-500">
            사진을 찍고 산책을 마치면 여기에 쌓여요
          </p>
        </div>
        <Link
          href="/"
          className="mt-2 inline-flex min-h-12 items-center justify-center rounded-pill bg-brand-primary px-6 font-semibold text-paper shadow-cell-glow"
        >
          산책 시작하기
        </Link>
      </div>
    )
  }

  return (
    <>
      {boards.map((board) => {
        const total = board.mode === '3x3' ? 9 : 25
        const isActive = !board.endedAt
        return (
          <article
            key={board.id}
            className="group flex flex-col gap-3 rounded-lg border border-ink-100 bg-paper p-4 shadow-card transition-colors hover:border-brand-primary"
          >
            <div className="flex items-start justify-between gap-3">
              <Link href={`/walks/${board.id}`} className="min-w-0 flex-1">
                <p className="truncate text-[length:var(--text-body-1)] font-semibold text-ink-900">
                  {board.nickname}
                </p>
                <p className="mt-1 text-[length:var(--text-caption)] text-ink-500">
                  {formatDate(board.updatedAt)}
                </p>
              </Link>
              <span className="rounded-pill bg-brand-primary-soft px-3 py-1 text-[length:var(--text-caption)] font-semibold text-brand-primary">
                {isActive ? '진행중' : '종료된 미션'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[length:var(--text-caption)] font-semibold">
              <span className="flex items-center gap-1.5 rounded-md bg-ink-50 px-3 py-2 text-ink-700">
                <CheckCircle2 size={14} aria-hidden />
                {board.completedCount}/{total}
              </span>
              <span className="flex items-center gap-1.5 rounded-md bg-brand-primary-soft px-3 py-2 text-brand-primary">
                <Camera size={14} aria-hidden />
                사진 {board.photoCount}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[length:var(--text-caption)] text-ink-500">
                <Clock3 size={14} aria-hidden />
                {board.mode} 보드
              </span>
              <div className="flex items-center gap-2">
                {isActive && (
                  <Button
                    size="md"
                    className="min-h-10 px-4 py-2 text-[length:var(--text-body-2)]"
                    disabled={continuePendingId === board.id}
                    onClick={() => handleContinue(board)}
                  >
                    {continuePendingId === board.id ? '불러오는 중' : '이어하기'}
                  </Button>
                )}
                <button
                  type="button"
                  aria-label={`${board.nickname} 기록 삭제`}
                  onClick={() => {
                    setDeleteError(null)
                    setDeleteTarget(board)
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-pill text-ink-500 transition-colors hover:bg-ink-100 hover:text-danger"
                >
                  <Trash2 size={18} aria-hidden />
                </button>
              </div>
            </div>
          </article>
        )
      })}

      {deleteTarget && (
        <ActionDialog
          title="기록을 삭제할까요?"
          description="삭제한 기록은 산책 기록에서 사라지고 이어하기에도 나타나지 않아요."
          error={deleteError}
          isPending={deletePending}
          pendingLabel="삭제 중"
          onClose={() => setDeleteTarget(null)}
          actions={[
            {
              label: '삭제',
              onClick: handleDelete,
              variant: 'destructive',
            },
            {
              label: '취소',
              onClick: () => setDeleteTarget(null),
              variant: 'tertiary',
            },
          ]}
        />
      )}
    </>
  )
}
