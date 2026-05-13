export async function cropSquareFromVideo(
  video: HTMLVideoElement,
  size: number,
  quality: number,
): Promise<Blob> {
  const { videoWidth, videoHeight } = video
  if (!videoWidth || !videoHeight) {
    throw new Error('Video frame not ready')
  }

  const min = Math.min(videoWidth, videoHeight)
  const sx = (videoWidth - min) / 2
  const sy = (videoHeight - min) / 2

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2d context unavailable')

  ctx.drawImage(video, sx, sy, min, min, 0, 0, size, size)

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
