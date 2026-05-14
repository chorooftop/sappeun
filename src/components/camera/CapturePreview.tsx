'use client'

import { Check, RefreshCw } from 'lucide-react'

interface CapturePreviewProps {
  url: string
  onUse: () => void
  onRetake: () => void
}

export function CapturePreview({ url, onUse, onRetake }: CapturePreviewProps) {
  return (
    <div className="absolute inset-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="촬영 미리보기"
        className="h-full w-full object-cover"
      />
      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onRetake}
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-pill bg-ink-900/70 px-5 text-paper backdrop-blur-sm hover:bg-ink-900"
        >
          <RefreshCw size={20} aria-hidden />
          다시 찍기
        </button>
        <button
          type="button"
          onClick={onUse}
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-pill bg-brand-primary px-5 font-semibold text-paper shadow-cell-glow hover:brightness-95"
        >
          <Check size={20} aria-hidden />
          사용
        </button>
      </div>
    </div>
  )
}
