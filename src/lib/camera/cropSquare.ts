interface CropSquareOptions {
  softwareZoom?: number
}

export async function cropSquareFromVideo(
  video: HTMLVideoElement,
  targetSize: number,
  quality: number,
  options: CropSquareOptions = {},
): Promise<Blob> {
  const { videoWidth, videoHeight } = video
  if (!videoWidth || !videoHeight) {
    throw new Error('Video frame not ready')
  }

  const min = Math.min(videoWidth, videoHeight)
  const outputSize = Math.min(targetSize, min)
  const requestedZoom = Math.max(1, options.softwareZoom ?? 1)
  const zoom = Math.min(requestedZoom, min)
  const sourceSize = min / zoom
  const sx = (videoWidth - sourceSize) / 2
  const sy = (videoHeight - sourceSize) / 2

  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2d context unavailable')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(video, sx, sy, sourceSize, sourceSize, 0, 0, outputSize, outputSize)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to encode JPEG blob'))
      },
      'image/jpeg',
      quality,
    )
  })
}
