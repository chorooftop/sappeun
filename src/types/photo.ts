export interface Photo {
  id: string
  userId: string
  storagePath: string
  contentType: string
  sizeBytes: number
  createdAt: string
  uploadedAt: string | null
  deletedAt: string | null
  source: 'authenticated' | 'guest_promoted'
}

export type PhotoOwnerKind = 'guest' | 'user'

export type PhotoUploadStatus = 'uploading' | 'uploaded' | 'failed'

export interface PresignedUploadRequest {
  clientBoardSessionId: string
  mode: '5x5' | '3x3'
  nickname: string
  freePosition: number
  cellIds: string[]
  position: number
  cellId: string
  contentType: string
  sizeBytes: number
}

export interface PresignedUploadResponse {
  uploadUrl: string
  token: string
  path: string
  photoId: string
  ownerKind: PhotoOwnerKind
  expiresAt: string
}

export interface ConfirmPhotoUploadRequest {
  photoId: string
  ownerKind: PhotoOwnerKind
}

export interface ConfirmPhotoUploadResponse {
  photoId: string
  ownerKind: PhotoOwnerKind
  previewUrl: string
  previewUrlExpiresAt: string
  requestedPhotoId?: string
  requestedOwnerKind?: PhotoOwnerKind
}

export interface PhotoPreviewRequest {
  photos: Array<{
    photoId: string
    ownerKind: PhotoOwnerKind
  }>
}

export interface PhotoPreviewResponse {
  photos: Array<{
    photoId: string
    ownerKind: PhotoOwnerKind
    previewUrl: string
    previewUrlExpiresAt: string
    requestedPhotoId?: string
    requestedOwnerKind?: PhotoOwnerKind
  }>
}
