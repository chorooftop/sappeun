'use client'

import { ImageIcon, Package, RefreshCw, X, ZapOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { IconButton } from '@/components/ui'
import { cropSquareFromVideo } from '@/lib/camera/cropSquare'
import { cn } from '@/lib/utils/cn'
import { CapturePreview } from './CapturePreview'
import {
  useCameraStream,
  type CameraError,
  type FacingMode,
} from './useCameraStream'

interface CameraModalProps {
  facingMode: FacingMode
  label: string
  hint?: string
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

function withObjectParticle(value: string) {
  const trimmed = value.trim()
  const lastChar = trimmed.charCodeAt(trimmed.length - 1)
  if (lastChar < 0xac00 || lastChar > 0xd7a3) return `${trimmed}를`
  return (lastChar - 0xac00) % 28 === 0 ? `${trimmed}를` : `${trimmed}을`
}

export function CameraModal({
  facingMode,
  label,
  hint,
  onCapture,
  onClose,
}: CameraModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const [currentFacingMode, setCurrentFacingMode] =
    useState<FacingMode>(facingMode)
  const [retryToken, setRetryToken] = useState(0)
  const { stream, error } = useCameraStream(currentFacingMode, retryToken)
  const [videoReady, setVideoReady] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return
    setVideoReady(false)
    video.srcObject = stream
    return () => {
      video.srcObject = null
    }
  }, [stream])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      const dialog = dialogRef.current
      if (!dialog) return

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute('disabled'))

      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
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

  function handleRetry() {
    setPreviewBlob(null)
    setPreviewUrl(null)
    setVideoReady(false)
    setRetryToken((value) => value + 1)
  }

  function handleSwitchCamera() {
    setCurrentFacingMode((prev) =>
      prev === 'environment' ? 'user' : 'environment',
    )
    setPreviewBlob(null)
    setPreviewUrl(null)
    setVideoReady(false)
  }

  const showHint = !previewUrl && (!stream || !videoReady)
  const canCapture = Boolean(stream && videoReady)

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${label} 촬영`}
      className="fixed inset-0 z-50 bg-[#0A0A0A]"
    >
      <div className="mx-auto flex h-full w-full max-w-[390px] flex-col overflow-hidden bg-[#0A0A0A] text-paper">
        <header className="flex items-center justify-between gap-3 px-4 py-3">
          <IconButton
            ref={closeBtnRef}
            icon={X}
            variant="ghost"
            aria-label="닫기"
            className="text-paper hover:bg-paper/10"
            onClick={onClose}
          />
          <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5 text-center">
            <span className="text-[length:var(--text-micro)] font-medium leading-normal text-ink-300">
              찾기
            </span>
            <span className="line-clamp-1 text-[length:var(--text-body-1)] font-semibold leading-normal text-paper">
              {label}
            </span>
          </div>
          <IconButton
            icon={RefreshCw}
            variant="ghost"
            aria-label={
              currentFacingMode === 'environment'
                ? '전면 카메라로 전환'
                : '후면 카메라로 전환'
            }
            iconSize={22}
            className="text-paper hover:bg-paper/10"
            onClick={handleSwitchCamera}
          />
        </header>

        <section className="relative aspect-square w-full bg-[#0F0F0F]">
          {error ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
              <Package
                size={72}
                strokeWidth={1.8}
                className="text-[#2A2F35]"
                aria-hidden
              />
              <p className="text-[length:var(--text-body-1)] font-semibold">
                카메라를 열 수 없어요
              </p>
              <p className="text-[length:var(--text-body-2)] leading-normal text-ink-500">
                {ERROR_MESSAGE[error]}
              </p>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onCanPlay={() => setVideoReady(true)}
              className="absolute inset-0 h-full w-full object-cover"
              style={previewUrl ? { display: 'none' } : undefined}
            />
          )}

          {showHint && !error && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
              <Package
                size={96}
                strokeWidth={1.6}
                className="text-[#2A2F35]"
                aria-hidden
              />
              <p className="text-[length:var(--text-body-2)] leading-normal text-[#5A626A]">
                {withObjectParticle(label)} 화면에 맞춰주세요
              </p>
            </div>
          )}

          {previewUrl && (
            <CapturePreview
              url={previewUrl}
              onUse={handleUse}
              onRetake={handleRetake}
            />
          )}
        </section>

        {!previewUrl && !error && (
          <>
            <p className="px-8 pb-4 pt-5 text-center text-[13px] leading-normal text-ink-300">
              {hint ?? '사물을 화면 중앙에 두고 셔터를 눌러주세요'}
            </p>
            <div className="flex items-center justify-between px-10 pb-6 pt-1">
              <button
                type="button"
                disabled
                aria-label="갤러리에서 선택"
                className="flex h-12 w-12 items-center justify-center rounded-md bg-[#252A30] text-paper disabled:opacity-70"
              >
                <ImageIcon size={24} aria-hidden />
              </button>
              <button
                type="button"
                onClick={handleCapture}
                disabled={!canCapture}
                aria-label="촬영"
                className={cn(
                  'flex h-20 w-20 items-center justify-center rounded-pill border-4 border-paper transition-opacity',
                  !canCapture && 'opacity-50',
                )}
              >
                <span className="h-[60px] w-[60px] rounded-pill bg-paper" />
              </button>
              <button
                type="button"
                disabled
                aria-label="플래시"
                className="flex h-12 w-12 items-center justify-center text-paper disabled:opacity-70"
              >
                <ZapOff size={24} aria-hidden />
              </button>
            </div>
            <div className="flex h-6 items-center justify-center">
              <span className="h-[5px] w-[134px] rounded-[3px] bg-paper" />
            </div>
          </>
        )}

        {error && (
          <div className="mt-auto flex flex-col gap-3 px-8 pb-10 pt-6">
            <button
              type="button"
              onClick={handleRetry}
              className="min-h-12 rounded-pill border border-paper/20 px-6 font-semibold text-paper"
            >
              다시 시도
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-12 rounded-pill bg-paper px-6 font-semibold text-ink-900"
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
