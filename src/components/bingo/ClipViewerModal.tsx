'use client'

import { Check, Clapperboard, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { IconButton } from '@/components/ui'
import {
  CUSTOM_CELL_DESCRIPTION_MAX,
  CUSTOM_CELL_TITLE_MAX,
} from '@/lib/bingo/customBoard'
import { MAX_CLIP_DESCRIPTION_LENGTH } from '@/lib/clips/description'
import type { BoardKind } from '@/types/bingo'
import type { CellMaster } from '@/types/cell'

interface ClipViewerModalProps {
  cell: CellMaster
  clipUrl: string
  posterUrl?: string
  boardKind: BoardKind
  clipDescription?: string
  onClose: () => void
  onRetake: () => void
  onDelete: () => void
  onSave: (input: {
    clipDescription?: string
    cellTitle?: string
    cellDescription?: string
  }) => Promise<void> | void
}

export function ClipViewerModal({
  cell,
  clipUrl,
  posterUrl,
  boardKind,
  clipDescription,
  onClose,
  onRetake,
  onDelete,
  onSave,
}: ClipViewerModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const label = cell.captureLabel ?? cell.label
  const [draftClipDescription, setDraftClipDescription] = useState(
    clipDescription ?? '',
  )
  const [draftCellTitle, setDraftCellTitle] = useState(label)
  const [draftCellDescription, setDraftCellDescription] = useState(
    cell.hint ?? cell.caption ?? '',
  )
  const [savePending, setSavePending] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    closeRef.current?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSave() {
    setSavePending(true)
    setSaveMessage(null)
    try {
      await onSave({
        clipDescription: draftClipDescription.trim() || undefined,
        ...(boardKind === 'custom'
          ? {
              cellTitle: draftCellTitle.trim() || undefined,
              cellDescription: draftCellDescription.trim() || undefined,
            }
          : {}),
      })
      setSaveMessage('저장됐어요')
    } catch (error) {
      console.warn('Unable to save clip metadata', error)
      setSaveMessage('저장하지 못했어요. 다시 시도해주세요.')
    } finally {
      setSavePending(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${label} 클립 보기`}
      className="fixed inset-0 z-50 flex items-end justify-center bg-overlay-scrim px-0 sm:items-center sm:p-6"
    >
      <div className="max-h-[92dvh] w-full max-w-[430px] overflow-y-auto rounded-t-lg bg-paper text-ink-900 shadow-card sm:rounded-lg">
        <header className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">{label}</p>
            <p className="text-[12px] text-ink-500">
              영상 소개를 남기고 필요하면 다시 찍을 수 있어요.
            </p>
          </div>
          <IconButton
            ref={closeRef}
            icon={X}
            variant="ghost"
            aria-label="클립 보기 닫기"
            onClick={onClose}
          />
        </header>

        <div className="px-4">
          <div className="aspect-square overflow-hidden rounded-md bg-ink-100">
            <video
              src={clipUrl}
              poster={posterUrl}
              autoPlay
              controls
              loop
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 px-4 pt-4">
          {boardKind === 'custom' && (
            <div className="grid gap-3">
              <label className="flex flex-col gap-2 text-caption font-semibold text-ink-700">
                칸 이름
                <input
                  value={draftCellTitle}
                  maxLength={CUSTOM_CELL_TITLE_MAX}
                  onChange={(event) => setDraftCellTitle(event.target.value)}
                  className="min-h-11 rounded-sm border-[1.5px] border-ink-300 bg-paper px-3 text-body-2 font-medium text-ink-900 outline-none focus:border-2 focus:border-brand-primary"
                  placeholder="예) 골목의 작은 꽃"
                />
              </label>
              <label className="flex flex-col gap-2 text-caption font-semibold text-ink-700">
                칸 설명
                <textarea
                  value={draftCellDescription}
                  maxLength={CUSTOM_CELL_DESCRIPTION_MAX}
                  rows={3}
                  onChange={(event) =>
                    setDraftCellDescription(event.target.value)
                  }
                  className="min-h-20 resize-none rounded-sm border-[1.5px] border-ink-300 bg-paper px-3 py-2 text-body-2 font-medium leading-normal text-ink-900 outline-none focus:border-2 focus:border-brand-primary"
                  placeholder="촬영 기준이나 기억하고 싶은 포인트"
                />
              </label>
            </div>
          )}
          <label className="flex flex-col gap-2 text-caption font-semibold text-ink-700">
            영상 소개
            <textarea
              value={draftClipDescription}
              maxLength={MAX_CLIP_DESCRIPTION_LENGTH}
              rows={3}
              onChange={(event) => setDraftClipDescription(event.target.value)}
              className="min-h-20 resize-none rounded-sm border-[1.5px] border-ink-300 bg-paper px-3 py-2 text-body-2 font-medium leading-normal text-ink-900 outline-none focus:border-2 focus:border-brand-primary"
              placeholder="이 클립에 대해 남기고 싶은 말을 적어주세요"
            />
            <span className="text-right text-caption font-medium text-ink-500">
              {draftClipDescription.length}/{MAX_CLIP_DESCRIPTION_LENGTH}
            </span>
          </label>
          {saveMessage && (
            <p className="text-caption font-medium text-ink-500">{saveMessage}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={savePending}
            className="flex min-h-12 items-center justify-center gap-2 rounded-pill bg-ink-900 px-5 font-semibold text-paper"
          >
            <Check size={18} aria-hidden />
            {savePending ? '저장 중' : '정보 저장'}
          </button>
          <button
            type="button"
            onClick={onRetake}
            className="flex min-h-12 items-center justify-center gap-2 rounded-pill bg-brand-primary px-5 font-semibold text-paper shadow-cell-glow"
          >
            <Clapperboard size={18} aria-hidden />
            다시 촬영
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex min-h-12 items-center justify-center gap-2 rounded-pill bg-danger/10 px-5 font-semibold text-danger"
          >
            <Trash2 size={18} aria-hidden />
            클립 삭제
          </button>
        </div>
      </div>
    </div>
  )
}
