import { z } from 'zod'
import {
  MAX_CLIP_DURATION_GRACE_MS,
  MAX_CLIP_SIZE_BYTES,
  MAX_POSTER_SIZE_BYTES,
} from '@/lib/storage/clips'
import { MAX_CLIP_DESCRIPTION_LENGTH } from '@/lib/clips/description'
import { boardModeSchema } from '@/lib/photos/validation'

export const boardKindSchema = z.enum(['mission', 'custom'])

export const missionSnapshotSchema = z.object({
  id: z.string().min(1).max(80),
  category: z.enum(['nature', 'manmade', 'animal', 'time', 'self', 'color', 'special']),
  label: z.string().trim().min(1).max(40),
  caption: z.string().max(120).optional(),
  captureLabel: z.string().max(40).optional(),
  hint: z.string().max(160).optional(),
  icon: z.string().nullable(),
  variant: z.enum(['QeQCU', 'k4Srv', 'rAdyJ']),
  textOnly: z.boolean().optional(),
  fontSize: z.number().optional(),
  swatch: z.string().optional(),
  swatchLabel: z.string().optional(),
  camera: z.enum(['front', 'back', 'timer']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  noPhoto: z.boolean().optional(),
  fixedPosition: z.literal('center').optional(),
})

export const clipOwnerKindSchema = z.enum(['guest', 'user'])

export const clipContentTypeSchema = z.enum(['video/mp4', 'video/webm'])

export const posterContentTypeSchema = z.enum(['image/jpeg', 'image/webp'])

export const clipOrientationSchema = z.enum(['portrait', 'landscape', 'square'])

export const presignClipUploadSchema = z.object({
  clientBoardSessionId: z.string().min(1).max(120),
  mode: boardModeSchema,
  boardKind: boardKindSchema.optional(),
  nickname: z.string().trim().min(1).max(40),
  title: z.string().trim().min(1).max(24).optional(),
  description: z.string().trim().max(120).optional(),
  clipDescription: z.string().trim().max(MAX_CLIP_DESCRIPTION_LENGTH).optional(),
  freePosition: z.number().int().min(0).max(24),
  cellIds: z.array(z.string().min(1).max(80)).min(9).max(25),
  missionSnapshots: z.array(missionSnapshotSchema).min(9).max(25).optional(),
  position: z.number().int().min(0).max(24),
  cellId: z.string().min(1).max(80),
  contentType: clipContentTypeSchema,
  recorderMimeType: z.string().min(1).max(160),
  sizeBytes: z.number().int().min(1).max(MAX_CLIP_SIZE_BYTES),
  durationMs: z.number().min(1).max(MAX_CLIP_DURATION_GRACE_MS),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  orientation: clipOrientationSchema.optional(),
  posterContentType: posterContentTypeSchema,
  posterSizeBytes: z.number().int().min(1).max(MAX_POSTER_SIZE_BYTES),
  posterWidth: z.number().int().positive().optional(),
  posterHeight: z.number().int().positive().optional(),
})

export const confirmClipUploadSchema = z.object({
  clipId: z.uuid(),
  ownerKind: clipOwnerKindSchema,
})

export const updateClipDescriptionSchema = z.object({
  ownerKind: clipOwnerKindSchema,
  description: z.string().trim().max(MAX_CLIP_DESCRIPTION_LENGTH).optional(),
  boardSnapshot: z
    .object({
      boardKind: boardKindSchema,
      title: z.string().trim().min(1).max(24),
      description: z.string().trim().max(120).optional(),
      freePosition: z.number().int().min(0).max(24),
      cellIds: z.array(z.string().min(1).max(80)).min(9).max(25),
      missionSnapshots: z.array(missionSnapshotSchema).min(9).max(25),
    })
    .optional(),
})

export const clipPreviewSchema = z.object({
  clips: z
    .array(
      z.object({
        clipId: z.uuid(),
        ownerKind: clipOwnerKindSchema,
      }),
    )
    .min(1)
    .max(50),
})
