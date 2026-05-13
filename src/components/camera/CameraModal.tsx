'use client'

import { Camera, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cropSquareFromVideo } from '@/lib/camera/cropSquare'
import { CapturePreview } from './CapturePreview'
import {
  useCameraStream,
  type CameraError,
  type FacingMode,
} from './useCameraStream'

interface CameraModalProps {
  facingMode: FacingMode
  label: string
  onCapture: (blob: Blob) => void
  onClose: () => void
}

const CAPTURE_SIZE = 300
const CAPTURE_QUALITY = 0.85

const ERROR_MESSAGE: Record<CameraError, string> = {
  'permission-denied': '카메라 권한이 거부되었어요. 브라우저 설정에서 허용해주세요.',
  'not-found': '카메라 디바이스를 찾을 수 없어요.',
  'insecure-context': 'HTTPS 환경에서만 카메라를 쓸 수 있어요.',
  unknown: '예기치 못한 오류가 발생했어요.',
}

export function CameraModal({
  facingMode,
  label,
  onCapture,
  onClose,
}: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const { stream, error } = useCameraStream(facingMode)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return
    video.srcObject = stream
    return () => {
      video.srcObject = null
    }
  }, [stream])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    closeBtnRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!previewUrl) return
    return () => {
      URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function handleCapture() {
    if (!videoRef.current) return
    try {
      const blob = await cropSquareFromVideo(
        videoRef.current,
        CAPTURE_SIZE,
        CAPTURE_QUALITY,
      )
      setPreviewBlob(blob)
      setPreviewUrl(URL.createObjectURL(blob))
    } catch (e) {
      console.error('Capture failed:', e)
    }
  }

  function handleUse() {
    if (!previewBlob) return
    // previewUrl(이 모달 소유)은 effect cleanup이 revoke한다.
    // Board는 같은 blob에서 새 ObjectURL을 만들어 별도 라이프사이클로 관리한다.
    onCapture(previewBlob)
    setPreviewBlob(null)
    setPreviewUrl(null)
  }

  function handleRetake() {
    setPreviewBlob(null)
    setPreviewUrl(null)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${label} 촬영`}
      className="fixed inset-0 z-50 flex flex-col bg-ink-900"
    >
      <div className="flex items-center justify-between px-4 py-3 text-paper">
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="rounded-pill p-2 hover:bg-paper/10"
        >
          <X size={24} aria-hidden />
        </button>
        <span className="text-base font-semibold">{label}</span>
        <span aria-hidden className="w-10" />
      </div>

      <div className="relative flex flex-1 items-center justify-center">
        {error ? (
          <div className="flex flex-col items-center gap-3 px-6 text-center text-paper">
            <p className="text-base font-semibold">카메라를 열 수 없어요</p>
            <p className="text-sm text-ink-300">{ERROR_MESSAGE[error]}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-pill bg-paper px-6 py-3 text-ink-900"
            >
              닫기
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="aspect-square w-full max-w-md object-cover"
              style={previewUrl ? { display: 'none' } : undefined}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute aspect-square w-full max-w-md border-2 border-paper/60"
              style={previewUrl ? { display: 'none' } : undefined}
            />
            {previewUrl && (
              <CapturePreview
                url={previewUrl}
                onUse={handleUse}
                onRetake={handleRetake}
              />
            )}
          </>
        )}
      </div>

      {!previewUrl && !error && (
        <div className="flex items-center justify-center px-6 py-8">
          <button
            type="button"
            onClick={handleCapture}
            disabled={!stream}
            aria-label="촬영"
            className="flex h-16 w-16 items-center justify-center rounded-pill bg-paper text-ink-900 shadow-cell-glow disabled:opacity-50"
          >
            <Camera size={28} aria-hidden />
          </button>
        </div>
      )}
    </div>
  )
}
