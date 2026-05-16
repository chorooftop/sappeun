'use client'

import { createClient } from '@/lib/supabase/client'
import { CLIP_BUCKET } from '@/lib/storage/clips'
import type {
  ClipOwnerKind,
  ClipPreviewRequest,
  ClipPreviewResponse,
  ConfirmClipUploadResponse,
  PresignedClipUploadRequest,
  PresignedClipUploadResponse,
} from '@/types/clip'
import type { PersistedBoardSessionV4 } from '@/types/persisted-board'

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Clip request failed with ${response.status}`
    try {
      const body: unknown = await response.json()
      if (
        body &&
        typeof body === 'object' &&
        'error' in body &&
        typeof body.error === 'string'
      ) {
        message = body.error
      }
    } catch {
      // Keep the status-based fallback when the response is not JSON.
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export async function uploadBoardClip(
  input: PresignedClipUploadRequest,
  clipBlob: Blob,
  posterBlob: Blob,
): Promise<ConfirmClipUploadResponse> {
  const presign = await readJson<PresignedClipUploadResponse>(
    await fetch('/api/clips/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  )

  const supabase = createClient()
  const { error: clipUploadError } = await supabase.storage
    .from(CLIP_BUCKET)
    .uploadToSignedUrl(presign.clip.path, presign.clip.token, clipBlob, {
      contentType: input.contentType,
    })

  if (clipUploadError) throw clipUploadError

  const { error: posterUploadError } = await supabase.storage
    .from(CLIP_BUCKET)
    .uploadToSignedUrl(presign.poster.path, presign.poster.token, posterBlob, {
      contentType: input.posterContentType,
    })

  if (posterUploadError) throw posterUploadError

  return readJson<ConfirmClipUploadResponse>(
    await fetch('/api/clips/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clipId: presign.clipId,
        ownerKind: presign.ownerKind,
      }),
    }),
  )
}

export async function refreshClipPreviews(
  clips: ClipPreviewRequest['clips'],
): Promise<ClipPreviewResponse> {
  return readJson<ClipPreviewResponse>(
    await fetch('/api/clips/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clips }),
    }),
  )
}

export async function deleteStoredClip(
  clipId: string,
  ownerKind: ClipOwnerKind,
): Promise<void> {
  const qs = new URLSearchParams({ ownerKind })
  const response = await fetch(`/api/clips/${clipId}?${qs.toString()}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(`Clip delete failed with ${response.status}`)
  }
}

export async function updateStoredClipDescription(
  clipId: string,
  ownerKind: ClipOwnerKind,
  description: string | undefined,
  boardSnapshot?: PersistedBoardSessionV4,
): Promise<void> {
  const response = await fetch(`/api/clips/${clipId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ownerKind,
      description,
      ...(boardSnapshot
        ? {
            boardSnapshot: {
              boardKind: boardSnapshot.boardKind,
              title: boardSnapshot.title,
              description: boardSnapshot.description,
              freePosition: boardSnapshot.freePosition,
              cellIds: boardSnapshot.cellIds,
              missionSnapshots: boardSnapshot.missionSnapshots,
            },
          }
        : {}),
    }),
  })

  if (!response.ok && response.status !== 401 && response.status !== 404) {
    throw new Error(`Clip update failed with ${response.status}`)
  }
}
