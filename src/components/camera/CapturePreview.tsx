'use client'

import { Check, RefreshCw } from 'lucide-react'

interface CapturePreviewProps {
  url: string
  onUse: () => void
  onRetake: () => void
}

export function CapturePreview({ url, onUse, onRetake }: CapturePreviewProps) {
  return (
    <div className="flex w-full flex-col items-center gap-6 px-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="촬영 미리보기"
        className="aspect-square w-full max-w-md rounded-card object-cover"
      />
      <div className="flex w-full max-w-md items-center gap-3">
        <button
          type="button"
          onClick={onRetake}
          className="flex flex-1 items-center justify-center gap-2 rounded-pill bg-paper/10 px-6 py-3 text-paper hover:bg-paper/20"
        >
          <RefreshCw size={20} aria-hidden />
          다시 찍기
        </button>
        <button
          type="button"
          onClick={onUse}
          className="flex flex-1 items-center justify-center gap-2 rounded-pill bg-brand-primary px-6 py-3 font-semibold text-paper shadow-cell-glow hover:brightness-95"
        >
          <Check size={20} aria-hidden />
          사용
        </button>
      </div>
    </div>
  )
}
