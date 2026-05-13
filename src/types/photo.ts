export interface Photo {
  id: string
  userId: string
  r2Key: string
  contentType: string
  sizeBytes: number
  createdAt: string
}

export interface PresignedUploadResponse {
  uploadUrl: string
  r2Key: string
  photoId: string
  expiresAt: string
}
