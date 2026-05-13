export function photoKey(params: {
  userId: string
  boardId: string
  position: number
  ext: string
}): string {
  const { userId, boardId, position, ext } = params
  return `${userId}/${boardId}/${position}.${ext}`
}

export function extFromContentType(contentType: string): string {
  if (contentType === 'image/jpeg') return 'jpg'
  if (contentType === 'image/png') return 'png'
  if (contentType === 'image/webp') return 'webp'
  if (contentType === 'image/heic') return 'heic'
  throw new Error(`Unsupported content type: ${contentType}`)
}
