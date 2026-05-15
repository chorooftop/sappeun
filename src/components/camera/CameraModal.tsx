'use client'

import { ImageIcon, Package, RefreshCw, X, ZapOff } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { IconButton } from '@/components/ui'
import { cropSquareFromVideo } from '@/lib/camera/cropSquare'
import { getCategoryVisual, getSwatchVisual } from '@/lib/bingo/cellVisual'
import { DynamicIcon } from '@/lib/icons/dynamic-icon'
import { cn } from '@/lib/utils/cn'
import type { CellMaster } from '@/types/cell'
import { CapturePreview } from './CapturePreview'
import {
  useCameraStream,
  type CameraError,
  type FacingMode,
} from './useCameraStream'

interface CameraModalProps {
  facingMode: FacingMode
  cell: CellMaster
  onCapture: (blob: Blob) => void
  onClose: () => void
}

const CAPTURE_TARGET_SIZE = 1024
const CAPTURE_QUALITY = 0.92
const ZOOM_LEVELS = [1, 1.5, 2] as const
const MIN_ZOOM = 1
const MAX_ZOOM = 2

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

interface CameraZoomRange {
  min: number
  max: number
  step?: number
}

type ZoomCapabilities = MediaTrackCapabilities & {
  zoom?: CameraZoomRange
}

function getZoomRange(track: MediaStreamTrack | undefined): CameraZoomRange | null {
  if (!track || typeof track.getCapabilities !== 'function') return null
  const capabilities = track.getCapabilities() as ZoomCapabilities
  const zoom = capabilities.zoom
  if (
    !zoom ||
    typeof zoom.min !== 'number' ||
    typeof zoom.max !== 'number' ||
    zoom.max <= zoom.min
  ) {
    return null
  }
  return zoom
}

function clampZoom(value: number, range: CameraZoomRange): number {
  return Math.min(Math.max(value, range.min), range.max)
}

function clampViewfinderZoom(value: number): number {
  return Math.min(Math.max(value, MIN_ZOOM), MAX_ZOOM)
}

function getTouchDistance(touches: TouchList): number {
  const first = touches[0]
  const second = touches[1]
  if (!first || !second) return 0
  return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY)
}

function getSoftwareZoom(selectedZoom: number, nativeZoomValue: number | null): number {
  if (!nativeZoomValue || nativeZoomValue <= 0) return selectedZoom
  return clampViewfinderZoom(selectedZoom / nativeZoomValue)
}

export function CameraModal({
  facingMode,
  cell,
  onCapture,
  onClose,
}: CameraModalProps) {
  const label = cell.captureLabel ?? cell.label
  const hint = cell.hint
  const visual = getCategoryVisual(cell.category)
  const dialogRef = useRef<HTMLDivElement>(null)
  const viewfinderRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const zoomRef = useRef<number>(MIN_ZOOM)
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null)
  const [currentFacingMode, setCurrentFacingMode] =
    useState<FacingMode>(facingMode)
  const [retryToken, setRetryToken] = useState(0)
  const { stream, error } = useCameraStream(currentFacingMode, retryToken)
  const [videoReady, setVideoReady] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const [zoom, setZoom] = useState(MIN_ZOOM)
  const [nativeZoomValue, setNativeZoomValue] = useState<number | null>(null)
  const videoTrack = useMemo(() => stream?.getVideoTracks()[0], [stream])
  const zoomRange = useMemo(() => getZoomRange(videoTrack), [videoTrack])

  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

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
    if (!videoTrack || !zoomRange) return

    let cancelled = false
    const nextNativeZoom = clampZoom(zoom, zoomRange)
    videoTrack
      .applyConstraints({
        advanced: [{ zoom: nextNativeZoom } as MediaTrackConstraintSet],
      })
      .then(() => {
        if (!cancelled) setNativeZoomValue(nextNativeZoom)
      })
      .catch(() => {
        if (!cancelled) setNativeZoomValue(null)
      })

    return () => {
      cancelled = true
    }
  }, [videoTrack, zoom, zoomRange])

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

  useEffect(() => {
    const viewfinder = viewfinderRef.current
    if (!viewfinder) return

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length < 2) return
      e.preventDefault()
      pinchRef.current = {
        distance: getTouchDistance(e.touches),
        zoom: zoomRef.current,
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length < 2) return
      e.preventDefault()

      const distance = getTouchDistance(e.touches)
      const start = pinchRef.current
      if (!start || start.distance <= 0 || distance <= 0) {
        pinchRef.current = { distance, zoom: zoomRef.current }
        return
      }

      setZoom(clampViewfinderZoom(start.zoom * (distance / start.distance)))
    }

    function onTouchEnd(e: TouchEvent) {
      if (e.touches.length < 2) {
        pinchRef.current = null
      }
    }

    viewfinder.addEventListener('touchstart', onTouchStart, { passive: false })
    viewfinder.addEventListener('touchmove', onTouchMove, { passive: false })
    viewfinder.addEventListener('touchend', onTouchEnd)
    viewfinder.addEventListener('touchcancel', onTouchEnd)

    return () => {
      viewfinder.removeEventListener('touchstart', onTouchStart)
      viewfinder.removeEventListener('touchmove', onTouchMove)
      viewfinder.removeEventListener('touchend', onTouchEnd)
      viewfinder.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [])

  async function handleCapture() {
    const video = videoRef.current
    if (!video) return
    try {
      const softwareZoom = getSoftwareZoom(
        zoom,
        zoomRange ? nativeZoomValue : null,
      )
      const blob = await cropSquareFromVideo(
        video,
        CAPTURE_TARGET_SIZE,
        CAPTURE_QUALITY,
        { softwareZoom },
      )
      if (process.env.NODE_ENV === 'development') {
        const sourceWidth = video.videoWidth
        const sourceHeight = video.videoHeight
        const outputSize = Math.min(
          CAPTURE_TARGET_SIZE,
          sourceWidth,
          sourceHeight,
        )
        console.info('[camera:capture]', {
          sourceWidth,
          sourceHeight,
          outputSize,
          blobSize: blob.size,
          softwareZoom,
          selectedZoom: zoom,
          nativeZoomValue,
          trackSettings: stream?.getVideoTracks()[0]?.getSettings(),
        })
      }
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
    setZoom(1)
    setNativeZoomValue(null)
    setRetryToken((value) => value + 1)
  }

  function handleSwitchCamera() {
    setCurrentFacingMode((prev) =>
      prev === 'environment' ? 'user' : 'environment',
    )
    setPreviewBlob(null)
    setPreviewUrl(null)
    setVideoReady(false)
    setZoom(1)
    setNativeZoomValue(null)
  }

  const showHint = !previewUrl && (!stream || !videoReady)
  const canCapture = Boolean(stream && videoReady)
  const softwareZoom = getSoftwareZoom(
    zoom,
    zoomRange ? nativeZoomValue : null,
  )

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${label} 촬영`}
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
            <CameraTargetVisual cell={cell} iconClassName={visual.iconClassName} />
            <span className="text-[length:var(--text-micro)] font-medium leading-normal text-camera-muted">
              찾기
            </span>
            <span className="line-clamp-1 text-[length:var(--text-body-1)] font-semibold leading-normal text-camera-foreground">
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
            className="text-camera-foreground hover:bg-camera-foreground/10"
            onClick={handleSwitchCamera}
          />
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          <section
            ref={viewfinderRef}
            className="relative aspect-square w-full shrink-0 touch-none select-none overflow-hidden overscroll-contain bg-camera-surface md:mx-auto md:max-h-[min(58dvh,500px)] md:max-w-[min(100%,500px)]"
            style={{ touchAction: 'none' }}
          >
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
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onCanPlay={() => setVideoReady(true)}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-200"
                style={
                  previewUrl
                    ? { display: 'none' }
                    : {
                        transform: `scale(${softwareZoom})`,
                        transformOrigin: 'center',
                      }
                }
              />
            )}

            {showHint && !error && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
                <Package
                  size={96}
                  strokeWidth={1.6}
                  className="text-camera-icon-muted"
                  aria-hidden
                />
                <p className="text-[length:var(--text-body-2)] leading-normal text-camera-muted">
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
              <p className="px-8 pb-4 pt-5 text-center text-[13px] leading-normal text-camera-muted">
                {hint ?? '사물을 화면 중앙에 두고 셔터를 눌러주세요'}
              </p>
              <div
                role="group"
                aria-label="카메라 확대"
                className="mx-auto mb-4 flex rounded-pill bg-camera-control p-1"
              >
                {ZOOM_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setZoom(level)}
                    aria-pressed={Math.abs(zoom - level) < 0.05}
                    className={cn(
                      'min-h-8 rounded-pill px-3 text-[12px] font-semibold transition-colors',
                      Math.abs(zoom - level) < 0.05
                        ? 'bg-camera-foreground text-camera-button-text'
                        : 'text-camera-muted hover:bg-camera-foreground/10',
                    )}
                  >
                    {level}x
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between px-10 pb-6 pt-1">
                <button
                  type="button"
                  disabled
                  aria-label="갤러리에서 선택"
                  className="flex h-12 w-12 items-center justify-center rounded-md bg-camera-control text-camera-foreground disabled:opacity-70"
                >
                  <ImageIcon size={24} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={handleCapture}
                  disabled={!canCapture}
                  aria-label="촬영"
                  className={cn(
                    'flex h-20 w-20 items-center justify-center rounded-pill border-4 border-camera-foreground transition-opacity',
                    !canCapture && 'opacity-50',
                  )}
                >
                  <span className="h-[60px] w-[60px] rounded-pill bg-camera-foreground" />
                </button>
                <button
                  type="button"
                  disabled
                  aria-label="플래시"
                  className="flex h-12 w-12 items-center justify-center text-camera-foreground disabled:opacity-70"
                >
                  <ZapOff size={24} aria-hidden />
                </button>
              </div>
              <div className="flex h-6 items-center justify-center">
                <span className="h-[5px] w-[134px] rounded-[3px] bg-camera-foreground" />
              </div>
            </>
          )}

          {error && (
            <div className="mt-auto flex flex-col gap-3 px-8 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-6">
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
          )}
        </div>
      </div>
    </div>
  )
}

interface CameraTargetVisualProps {
  cell: CellMaster
  iconClassName: string
}

function CameraTargetVisual({ cell, iconClassName }: CameraTargetVisualProps) {
  if (cell.swatch) {
    const swatch = getSwatchVisual(cell.swatch)
    return (
      <span
        aria-hidden
        className={cn(
          'mb-0.5 h-7 w-7 rounded-pill border-2 shadow-swatch',
          swatch.className,
        )}
        style={swatch.style}
      />
    )
  }

  if (cell.textOnly) {
    return (
      <span className="mb-0.5 flex h-7 min-w-7 items-center justify-center rounded-pill bg-camera-foreground/10 px-2 text-[15px] font-bold leading-none text-camera-foreground">
        {cell.label}
      </span>
    )
  }

  if (!cell.icon) return null
  return (
    <DynamicIcon
      name={cell.icon}
      size={26}
      strokeWidth={1.9}
      className={cn('mb-0.5', iconClassName)}
      aria-hidden
    />
  )
}
