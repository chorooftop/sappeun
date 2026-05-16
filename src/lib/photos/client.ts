'use client'

import { createClient } from '@/lib/supabase/client'
import { PHOTO_BUCKET } from '@/lib/storage/photos'
import type {
  ConfirmPhotoUploadResponse,
  PhotoOwnerKind,
  PhotoPreviewRequest,
  PhotoPreviewResponse,
  PresignedUploadRequest,
  PresignedUploadResponse,
} from '@/types/photo'

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Photo request failed with ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function uploadBoardPhoto(
  input: PresignedUploadRequest,
  blob: Blob,
): Promise<ConfirmPhotoUploadResponse> {
  const presign = await readJson<PresignedUploadResponse>(
    await fetch('/api/photos/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  )

  const supabase = createClient()
  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .uploadToSignedUrl(presign.path, presign.token, blob, {
      contentType: input.contentType,
    })

  if (uploadError) throw uploadError

  return readJson<ConfirmPhotoUploadResponse>(
    await fetch('/api/photos/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoId: presign.photoId,
        ownerKind: presign.ownerKind,
      }),
    }),
  )
}

export async function refreshPhotoPreviews(
  photos: PhotoPreviewRequest['photos'],
): Promise<PhotoPreviewResponse> {
  return readJson<PhotoPreviewResponse>(
    await fetch('/api/photos/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos }),
    }),
  )
}

export async function deleteStoredPhoto(
  photoId: string,
  ownerKind: PhotoOwnerKind,
): Promise<void> {
  const qs = new URLSearchParams({ ownerKind })
  const response = await fetch(`/api/photos/${photoId}?${qs.toString()}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(`Photo delete failed with ${response.status}`)
  }
}
