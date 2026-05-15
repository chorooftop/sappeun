'use client'

import { Shuffle, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { IconButton } from '@/components/ui'
import type { CellMaster } from '@/types/cell'

interface MissionReplaceSheetProps {
  cell: CellMaster
  error?: string | null
  onClose: () => void
  onReplace: () => void
}

export function MissionReplaceSheet({
  cell,
  error,
  onClose,
  onReplace,
}: MissionReplaceSheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

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
      aria-label={`${cell.label} 미션 교체`}
      className="fixed inset-0 z-50 flex items-end justify-center bg-overlay-scrim sm:items-center sm:p-6"
    >
      <div className="w-full max-w-[430px] overflow-hidden rounded-t-lg bg-paper text-ink-900 shadow-card sm:rounded-lg">
        <header className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-[15px] font-semibold">미션 바꾸기</p>
            <p className="text-[12px] text-ink-500">
              아직 완료하지 않은 칸만 다른 미션으로 바꿀 수 있어요.
            </p>
          </div>
          <IconButton
            ref={closeRef}
            icon={X}
            variant="ghost"
            aria-label="미션 교체 닫기"
            onClick={onClose}
          />
        </header>

        <div className="px-4 pb-4">
          <div className="rounded-md border border-ink-100 bg-ink-50 p-4">
            <p className="text-[12px] font-semibold text-ink-500">현재 미션</p>
            <p className="mt-1 text-[18px] font-bold">{cell.label}</p>
            {cell.hint && (
              <p className="mt-1 text-[13px] leading-normal text-ink-600">
                {cell.hint}
              </p>
            )}
          </div>

          <p className="mt-3 text-[12px] leading-normal text-ink-500">
            어려운 미션은 같은 카테고리의 쉬운 후보를 먼저 찾고, 없을 때만
            다른 카테고리에서 후보를 찾아요.
          </p>

          {error && (
            <p role="alert" className="mt-3 text-[12px] font-semibold text-danger">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onReplace}
            className="flex min-h-12 items-center justify-center gap-2 rounded-pill bg-brand-primary px-5 font-semibold text-paper shadow-cell-glow"
          >
            <Shuffle size={18} aria-hidden />
            이 미션 바꾸기
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 rounded-pill bg-ink-100 px-5 font-semibold text-ink-700"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
