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

interface CameraStreamState extends UseCameraStreamResult {
  requestKey: string
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

export function useCameraStream(
  facingMode: FacingMode,
  retryToken = 0,
): UseCameraStreamResult {
  const [supported] = useState<boolean>(isSupported)
  const [state, setState] = useState<CameraStreamState>({
    requestKey: '',
    stream: null,
    error: null,
  })
  const requestKey = `${facingMode}:${retryToken}`

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
        setState({ requestKey, stream: s, error: null })
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setState({ requestKey, stream: null, error: classifyError(e) })
        }
      })

    return () => {
      cancelled = true
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [supported, facingMode, requestKey])

  if (!supported) {
    return { stream: null, error: 'insecure-context' }
  }
  if (state.requestKey !== requestKey) {
    return { stream: null, error: null }
  }
  return { stream: state.stream, error: state.error }
}
