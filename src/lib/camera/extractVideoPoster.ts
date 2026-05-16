export interface VideoPoster {
  blob: Blob
  width: number
  height: number
  contentType: 'image/jpeg'
}

const POSTER_SIZE = 512

function waitForEvent(target: EventTarget, event: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const onDone = () => {
      target.removeEventListener(event, onDone)
      target.removeEventListener('error', onError)
      resolve()
    }
    const onError = () => {
      target.removeEventListener(event, onDone)
      target.removeEventListener('error', onError)
      reject(new Error('Unable to read clip for poster.'))
    }
    target.addEventListener(event, onDone, { once: true })
    target.addEventListener('error', onError, { once: true })
  })
}

export async function extractVideoPoster(blob: Blob): Promise<VideoPoster> {
  const url = URL.createObjectURL(blob)
  const video = document.createElement('video')

  try {
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    video.src = url

    await waitForEvent(video, 'loadedmetadata')
    video.currentTime = Math.min(0.2, Math.max(0, video.duration / 3 || 0))
    await waitForEvent(video, 'seeked')

    const sourceWidth = video.videoWidth || POSTER_SIZE
    const sourceHeight = video.videoHeight || POSTER_SIZE
    const cropSize = Math.min(sourceWidth, sourceHeight)
    const sx = (sourceWidth - cropSize) / 2
    const sy = (sourceHeight - cropSize) / 2
    const canvas = document.createElement('canvas')
    canvas.width = POSTER_SIZE
    canvas.height = POSTER_SIZE
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas is not available.')

    context.drawImage(
      video,
      sx,
      sy,
      cropSize,
      cropSize,
      0,
      0,
      POSTER_SIZE,
      POSTER_SIZE,
    )

    const posterBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result)
          else reject(new Error('Unable to encode clip poster.'))
        },
        'image/jpeg',
        0.82,
      )
    })

    return {
      blob: posterBlob,
      width: POSTER_SIZE,
      height: POSTER_SIZE,
      contentType: 'image/jpeg',
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}
