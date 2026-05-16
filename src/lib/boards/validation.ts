import { z } from 'zod'
import {
  boardKindSchema,
  clipOwnerKindSchema,
  missionSnapshotSchema,
} from '@/lib/clips/validation'
import { MAX_CLIP_DESCRIPTION_LENGTH } from '@/lib/clips/description'
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

export const persistedBoardClipSchema = z.object({
  position: z.number().int().min(0).max(24),
  cellId: z.string().min(1).max(80),
  clipId: z.uuid(),
  ownerKind: clipOwnerKindSchema,
  clipUrl: z.string().optional(),
  clipUrlExpiresAt: z.string().optional(),
  posterUrl: z.string().optional(),
  posterUrlExpiresAt: z.string().optional(),
  durationMs: z.number().min(1).max(3500),
  description: z.string().trim().max(MAX_CLIP_DESCRIPTION_LENGTH).optional(),
  pendingKey: z.string().optional(),
  uploadStatus: z.enum(['local_pending', 'uploading', 'uploaded', 'failed']),
})

const boardSessionV2Schema = z.object({
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

const boardSessionV3Schema = z.object({
  version: z.literal(3),
  sessionId: z.string().min(1).max(120),
  boardId: z.uuid().optional(),
  mode: boardModeSchema,
  nickname: z.string().trim().min(1).max(40),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  freePosition: z.number().int().min(0).max(24),
  cellIds: z.array(z.string().min(1).max(80)).min(9).max(25),
  markedPositions: z.array(z.number().int().min(0).max(24)).max(25),
  clips: z.array(persistedBoardClipSchema).max(25),
  endedAt: z.string().nullable(),
})

const boardSessionV4Schema = z.object({
  version: z.literal(4),
  sessionId: z.string().min(1).max(120),
  boardId: z.uuid().optional(),
  mode: boardModeSchema,
  boardKind: boardKindSchema,
  nickname: z.string().trim().min(1).max(40),
  title: z.string().trim().min(1).max(24),
  description: z.string().trim().max(120).optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  freePosition: z.number().int().min(0).max(24),
  cellIds: z.array(z.string().min(1).max(80)).min(9).max(25),
  missionSnapshots: z.array(missionSnapshotSchema).min(9).max(25),
  markedPositions: z.array(z.number().int().min(0).max(24)).max(25),
  clips: z.array(persistedBoardClipSchema).max(25),
  endedAt: z.string().nullable(),
})

export const boardSessionSchema = z.discriminatedUnion('version', [
  boardSessionV2Schema,
  boardSessionV3Schema,
  boardSessionV4Schema,
])

export const markBoardCellSchema = z.object({
  cellId: z.string().min(1).max(80),
  marked: z.boolean(),
})

export const replaceBoardCellSchema = z.object({
  cellId: z.string().min(1).max(80),
})
