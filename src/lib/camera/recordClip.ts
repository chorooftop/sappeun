import {
  MAX_CLIP_DURATION_MS,
  normalizeClipContentType,
} from '@/lib/storage/clips'
import {
  selectRecordingMimeType,
  type RecordingMimeType,
} from './selectRecordingMimeType'

export interface RecordedClip {
  blob: Blob
  durationMs: number
  width?: number
  height?: number
  mime: RecordingMimeType
}

export function recordClip(
  stream: MediaStream,
  video: HTMLVideoElement | null,
): Promise<RecordedClip> {
  return new Promise((resolve, reject) => {
    if (typeof MediaRecorder === 'undefined') {
      reject(new Error('MediaRecorder is not available.'))
      return
    }

    const mime = selectRecordingMimeType()
    const chunks: BlobPart[] = []
    const startedAt = performance.now()
    let recorder: MediaRecorder

    try {
      recorder = new MediaRecorder(stream, {
        mimeType: mime.recorderMimeType,
        videoBitsPerSecond: 2_500_000,
      })
    } catch (error) {
      reject(error)
      return
    }

    const stopTimer = window.setTimeout(() => {
      if (recorder.state !== 'inactive') recorder.stop()
    }, MAX_CLIP_DURATION_MS)

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }

    recorder.onerror = (event) => {
      window.clearTimeout(stopTimer)
      const error =
        'error' in event && event.error instanceof Error
          ? event.error
          : new Error('Clip recording failed.')
      reject(error)
    }

    recorder.onstop = () => {
      window.clearTimeout(stopTimer)
      const durationMs = Math.max(1, performance.now() - startedAt)
      const contentType =
        normalizeClipContentType(recorder.mimeType) ?? mime.contentType
      const blob = new Blob(chunks, { type: contentType })

      if (!chunks.length || blob.size <= 0) {
        reject(new Error('Recorded clip is empty.'))
        return
      }

      resolve({
        blob,
        durationMs,
        mime: {
          ...mime,
          recorderMimeType: recorder.mimeType || mime.recorderMimeType,
          contentType,
        },
        width: video?.videoWidth || undefined,
        height: video?.videoHeight || undefined,
      })
    }

    recorder.start(250)
  })
}
