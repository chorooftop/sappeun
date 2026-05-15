'use client'

import { Camera, Trash2, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { IconButton } from '@/components/ui'
import type { CellMaster } from '@/types/cell'

interface PhotoViewerModalProps {
  cell: CellMaster
  photoUrl: string
  onClose: () => void
  onRetake: () => void
  onDelete: () => void
}

export function PhotoViewerModal({
  cell,
  photoUrl,
  onClose,
  onRetake,
  onDelete,
}: PhotoViewerModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const label = cell.captureLabel ?? cell.label

  useEffect(() => {
    closeRef.current?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${label} 사진 보기`}
      className="fixed inset-0 z-50 flex items-end justify-center bg-overlay-scrim px-0 sm:items-center sm:p-6"
    >
      <div className="w-full max-w-[430px] overflow-hidden rounded-t-lg bg-paper text-ink-900 shadow-card sm:rounded-lg">
        <header className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">{label}</p>
            <p className="text-[12px] text-ink-500">
              사진을 확인한 뒤 다시 찍거나 삭제할 수 있어요.
            </p>
          </div>
          <IconButton
            ref={closeRef}
            icon={X}
            variant="ghost"
            aria-label="사진 보기 닫기"
            onClick={onClose}
          />
        </header>

        <div className="px-4">
          <div className="aspect-square overflow-hidden rounded-md bg-ink-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt={`${label} 촬영 사진`}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
          <button
            type="button"
            onClick={onRetake}
            className="flex min-h-12 items-center justify-center gap-2 rounded-pill bg-brand-primary px-5 font-semibold text-paper shadow-cell-glow"
          >
            <Camera size={18} aria-hidden />
            다시 촬영
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex min-h-12 items-center justify-center gap-2 rounded-pill bg-danger/10 px-5 font-semibold text-danger"
          >
            <Trash2 size={18} aria-hidden />
            사진 삭제
          </button>
        </div>
      </div>
    </div>
  )
}
