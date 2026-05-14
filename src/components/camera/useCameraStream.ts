'use client'

import { useEffect, useState } from 'react'

export type FacingMode = 'environment' | 'user'

export type CameraError =
  | 'permission-denied'
  | 'not-found'
  | 'insecure-context'
  | 'unknown'

interface UseCameraStreamResult {
  stream: MediaStream | null
  error: CameraError | null
}

function classifyError(err: unknown): CameraError {
  if (typeof err !== 'object' || err === null) return 'unknown'
  const name = (err as { name?: string }).name
  if (name === 'NotAllowedError') return 'permission-denied'
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'not-found'
  if (name === 'NotSupportedError' || name === 'SecurityError') return 'insecure-context'
  return 'unknown'
}

function isSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  )
}

export function useCameraStream(facingMode: FacingMode): UseCameraStreamResult {
  const [supported] = useState<boolean>(isSupported)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<CameraError | null>(null)

  useEffect(() => {
    if (!supported) return
    let cancelled = false
    let activeStream: MediaStream | null = null

    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1920 },
        },
      })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        activeStream = s
        setStream(s)
        setError(null)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(classifyError(e))
      })

    return () => {
      cancelled = true
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [supported, facingMode])

  if (!supported) {
    return { stream: null, error: 'insecure-context' }
  }
  return { stream, error }
}
