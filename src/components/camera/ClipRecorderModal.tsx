'use client'

import { Clapperboard, Loader2, Package, RefreshCw, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { IconButton } from '@/components/ui'
import { extractVideoPoster, type VideoPoster } from '@/lib/camera/extractVideoPoster'
import { recordClip, type RecordedClip } from '@/lib/camera/recordClip'
import { getCategoryVisual } from '@/lib/bingo/cellVisual'
import { MAX_CLIP_DESCRIPTION_LENGTH } from '@/lib/clips/description'
import { DynamicIcon } from '@/lib/icons/dynamic-icon'
import { cn } from '@/lib/utils/cn'
import type { CellMaster } from '@/types/cell'
import {
  useCameraStream,
  type CameraError,
  type FacingMode,
} from './useCameraStream'

export interface ClipCaptureResult {
  clip: RecordedClip
  poster: VideoPoster
  description?: string
}

interface ClipRecorderModalProps {
  facingMode: FacingMode
  cell: CellMaster
  onCapture: (result: ClipCaptureResult) => void
  onClose: () => void
}

const ERROR_MESSAGE: Record<CameraError, string> = {
  'permission-denied': '카메라 권한이 거부되었어요. 브라우저 설정에서 허용해주세요.',
  'not-found': '카메라 디바이스를 찾을 수 없어요.',
  'insecure-context': 'HTTPS 환경에서만 카메라를 쓸 수 있어요.',
  unknown: '예기치 못한 오류가 발생했어요.',
}

export function ClipRecorderModal({
  facingMode,
  cell,
  onCapture,
  onClose,
}: ClipRecorderModalProps) {
  const label = cell.captureLabel ?? cell.label
  const visual = getCategoryVisual(cell.category)
  const dialogRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const [currentFacingMode, setCurrentFacingMode] =
    useState<FacingMode>(facingMode)
  const [retryToken, setRetryToken] = useState(0)
  const { stream, error } = useCameraStream(currentFacingMode, retryToken)
  const [videoReady, setVideoReady] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)
  const [capture, setCapture] = useState<ClipCaptureResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [clipDescription, setClipDescription] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream || capture) return
    setVideoReady(false)
    video.srcObject = stream
    return () => {
      video.srcObject = null
    }
  }, [capture, stream])

  useEffect(() => {
    closeBtnRef.current?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (!previewUrl) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  async function handleRecord() {
    if (!stream || isRecording || isPreparing) return
    setMessage(null)
    setIsRecording(true)
    try {
      const clip = await recordClip(stream, videoRef.current)
      setIsPreparing(true)
      const poster = await extractVideoPoster(clip.blob)
      setClipDescription('')
      setCapture({ clip, poster })
      setPreviewUrl(URL.createObjectURL(clip.blob))
    } catch (recordError) {
      console.warn('Clip recording failed', recordError)
      setMessage('클립 저장에 실패했어요. 다시 시도해주세요.')
    } finally {
      setIsRecording(false)
      setIsPreparing(false)
    }
  }

  function handleRetake() {
    setCapture(null)
    setPreviewUrl(null)
    setClipDescription('')
    setMessage(null)
  }

  function handleRetry() {
    handleRetake()
    setVideoReady(false)
    setRetryToken((value) => value + 1)
  }

  function handleSwitchCamera() {
    setCurrentFacingMode((prev) =>
      prev === 'environment' ? 'user' : 'environment',
    )
    handleRetake()
    setVideoReady(false)
  }

  const canRecord = Boolean(stream && videoReady && !isRecording && !isPreparing)
  const busy = isRecording || isPreparing

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${label} 클립 촬영`}
      className="fixed inset-0 z-50 bg-camera-shell md:flex md:items-center md:justify-center md:bg-overlay-scrim md:p-6"
    >
      <div className="mx-auto flex h-full w-full max-w-[430px] flex-col overflow-hidden bg-camera-shell text-camera-foreground md:h-[min(100dvh-48px,900px)] md:max-w-[640px] md:rounded-lg">
        <header className="flex items-center justify-between gap-3 px-4 py-3">
          <IconButton
            ref={closeBtnRef}
            icon={X}
            variant="ghost"
            aria-label="닫기"
            className="text-camera-foreground hover:bg-camera-foreground/10"
            onClick={onClose}
          />
          <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5 text-center">
            <span className={cn('flex h-8 w-8 items-center justify-center rounded-pill bg-camera-control', visual.iconClassName)}>
              {cell.icon ? (
                <DynamicIcon name={cell.icon} size={18} strokeWidth={1.9} aria-hidden />
              ) : (
                <Clapperboard size={18} strokeWidth={1.9} aria-hidden />
              )}
            </span>
            <span className="text-[length:var(--text-micro)] font-medium leading-normal text-camera-muted">
              3초 클립
            </span>
            <span className="line-clamp-1 text-[length:var(--text-body-1)] font-semibold leading-normal text-camera-foreground">
              {label}
            </span>
          </div>
          <IconButton
            icon={RefreshCw}
            variant="ghost"
            aria-label="카메라 전환"
            iconSize={22}
            className="text-camera-foreground hover:bg-camera-foreground/10"
            onClick={handleSwitchCamera}
          />
        </header>

        <section className="relative aspect-square w-full shrink-0 overflow-hidden bg-camera-surface md:mx-auto md:max-h-[min(58dvh,500px)] md:max-w-[min(100%,500px)]">
          {error ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
              <Package
                size={72}
                strokeWidth={1.8}
                className="text-camera-icon-muted"
                aria-hidden
              />
              <p className="text-[length:var(--text-body-1)] font-semibold text-camera-foreground">
                카메라를 열 수 없어요
              </p>
              <p className="text-[length:var(--text-body-2)] leading-normal text-camera-muted">
                {ERROR_MESSAGE[error]}
              </p>
            </div>
          ) : previewUrl ? (
            <video
              src={previewUrl}
              controls
              loop
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onCanPlay={() => setVideoReady(true)}
                className="absolute inset-0 h-full w-full object-cover"
              />
              {!videoReady && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
                  <Package
                    size={96}
                    strokeWidth={1.6}
                    className="text-camera-icon-muted"
                    aria-hidden
                  />
                  <p className="text-[length:var(--text-body-2)] leading-normal text-camera-muted">
                    미션 대상을 화면에 맞춰주세요
                  </p>
                </div>
              )}
              {isRecording && (
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 overflow-hidden bg-camera-control">
                  <span className="block h-full origin-left animate-[recording-progress_3s_linear_forwards] bg-brand-primary" />
                </div>
              )}
            </>
          )}
        </section>

        <div className="flex min-h-0 flex-1 flex-col">
          <p className="px-8 pb-4 pt-5 text-center text-[13px] leading-normal text-camera-muted">
            {message ?? cell.hint ?? '움직임이 보이도록 3초 동안 짧게 담아주세요'}
          </p>

          {previewUrl && capture ? (
            <div className="mt-auto flex flex-col gap-3 px-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
              <label
                htmlFor="clip-description"
                className="flex flex-col gap-2 text-[13px] font-semibold text-camera-foreground"
              >
                영상 소개
                <span className="rounded-md border border-camera-foreground/20 bg-camera-foreground/5 px-3 py-2">
                  <textarea
                    id="clip-description"
                    value={clipDescription}
                    maxLength={MAX_CLIP_DESCRIPTION_LENGTH}
                    rows={3}
                    placeholder="이 장면을 한 줄로 남겨보세요"
                    onChange={(event) => setClipDescription(event.target.value)}
                    className="min-h-16 w-full resize-none bg-transparent text-[13px] font-medium leading-normal text-camera-foreground outline-none placeholder:text-camera-muted"
                  />
                  <span className="block text-right text-[11px] font-medium text-camera-muted">
                    {clipDescription.length}/{MAX_CLIP_DESCRIPTION_LENGTH}
                  </span>
                </span>
              </label>
              <button
                type="button"
                onClick={() =>
                  onCapture({
                    ...capture,
                    description: clipDescription.trim() || undefined,
                  })
                }
                className="min-h-12 rounded-pill bg-camera-foreground px-6 font-semibold text-camera-button-text"
              >
                이 클립 사용
              </button>
              <button
                type="button"
                onClick={handleRetake}
                className="min-h-12 rounded-pill border border-camera-foreground/20 px-6 font-semibold text-camera-foreground"
              >
                다시 찍기
              </button>
            </div>
          ) : error ? (
            <div className="mt-auto flex flex-col gap-3 px-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={handleRetry}
                className="min-h-12 rounded-pill border border-camera-foreground/20 px-6 font-semibold text-camera-foreground"
              >
                다시 시도
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-12 rounded-pill bg-camera-foreground px-6 font-semibold text-camera-button-text"
              >
                닫기
              </button>
            </div>
          ) : (
            <div className="mt-auto flex items-center justify-center px-10 pb-[max(2rem,env(safe-area-inset-bottom))] pt-1">
              <button
                type="button"
                onClick={handleRecord}
                disabled={!canRecord}
                aria-label="3초 클립 촬영"
                className={cn(
                  'flex h-20 w-20 items-center justify-center rounded-pill border-4 border-camera-foreground transition-opacity',
                  !canRecord && 'opacity-50',
                )}
              >
                <span className="flex h-[60px] w-[60px] items-center justify-center rounded-pill bg-camera-foreground text-camera-button-text">
                  {busy ? (
                    <Loader2 size={24} className="animate-spin" aria-hidden />
                  ) : (
                    <span className="h-7 w-7 rounded-pill bg-danger shadow-[0_0_0_6px_rgba(229,72,77,0.18)]" />
                  )}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
