import { z } from 'zod'
import { boardModeSchema, photoOwnerKindSchema } from '@/lib/photos/validation'

export const persistedBoardPhotoSchema = z.object({
  position: z.number().int().min(0).max(24),
  cellId: z.string().min(1).max(80),
  photoId: z.uuid(),
  ownerKind: photoOwnerKindSchema,
  previewUrl: z.string().optional(),
  previewUrlExpiresAt: z.string().optional(),
  uploadStatus: z.enum(['uploading', 'uploaded', 'failed']),
})

export const boardSessionSchema = z.object({
  version: z.literal(2),
  sessionId: z.string().min(1).max(120),
  boardId: z.uuid().optional(),
  mode: boardModeSchema,
  nickname: z.string().trim().min(1).max(40),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  freePosition: z.number().int().min(0).max(24),
  cellIds: z.array(z.string().min(1).max(80)).min(9).max(25),
  markedPositions: z.array(z.number().int().min(0).max(24)).max(25),
  photos: z.array(persistedBoardPhotoSchema).max(25),
  endedAt: z.string().nullable(),
})

export const markBoardCellSchema = z.object({
  cellId: z.string().min(1).max(80),
  marked: z.boolean(),
})

export const replaceBoardCellSchema = z.object({
  cellId: z.string().min(1).max(80),
})
