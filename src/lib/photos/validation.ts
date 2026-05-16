import { z } from 'zod'
import { MAX_PHOTO_SIZE_BYTES } from '@/lib/storage/photos'

export const photoOwnerKindSchema = z.enum(['guest', 'user'])

export const boardModeSchema = z.enum(['5x5', '3x3'])

export const presignPhotoUploadSchema = z.object({
  clientBoardSessionId: z.string().min(1).max(120),
  mode: boardModeSchema,
  nickname: z.string().trim().min(1).max(40),
  freePosition: z.number().int().min(0).max(24),
  cellIds: z.array(z.string().min(1).max(80)).min(9).max(25),
  position: z.number().int().min(0).max(24),
  cellId: z.string().min(1).max(80),
  contentType: z.string().min(1).max(120),
  sizeBytes: z.number().int().min(1).max(MAX_PHOTO_SIZE_BYTES),
})

export const confirmPhotoUploadSchema = z.object({
  photoId: z.uuid(),
  ownerKind: photoOwnerKindSchema,
})

export const photoPreviewSchema = z.object({
  photos: z
    .array(
      z.object({
        photoId: z.uuid(),
        ownerKind: photoOwnerKindSchema,
      }),
    )
    .min(1)
    .max(50),
})
