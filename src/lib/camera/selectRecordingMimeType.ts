import {
  clipExtFromContentType,
  normalizeClipContentType,
  type SupportedClipContentType,
} from '@/lib/storage/clips'

export interface RecordingMimeType {
  recorderMimeType: string
  contentType: SupportedClipContentType
  extension: string
}

const CANDIDATES = [
  'video/mp4;codecs=avc1.42E01E',
  'video/mp4',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
] as const

export function selectRecordingMimeType(): RecordingMimeType {
  const supported = CANDIDATES.find((candidate) => {
    if (typeof MediaRecorder === 'undefined') return false
    if (typeof MediaRecorder.isTypeSupported !== 'function') return true
    return MediaRecorder.isTypeSupported(candidate)
  })

  const recorderMimeType = supported ?? 'video/webm'
  const contentType = normalizeClipContentType(recorderMimeType) ?? 'video/webm'

  return {
    recorderMimeType,
    contentType,
    extension: clipExtFromContentType(contentType),
  }
}
