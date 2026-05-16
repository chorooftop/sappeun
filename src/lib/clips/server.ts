import type { SupabaseClient, User } from '@supabase/supabase-js'
import { ensureUserBoard } from '@/lib/boards/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isMissingColumnError } from '@/lib/supabase/errors'
import {
  CLIP_BUCKET,
  GUEST_SESSION_MAX_AGE_SECONDS,
  SIGNED_PREVIEW_EXPIRES_SECONDS,
  SIGNED_UPLOAD_EXPIRES_SECONDS,
  clipExtFromContentType,
  codecFromMimeType,
  guestClipPath,
  guestPosterPath,
  isSupportedClipContentType,
  isSupportedPosterContentType,
  posterExtFromContentType,
  signedUrlExpiresAt,
  storageErrorMessage,
  userClipPath,
  userPosterPath,
  type BoardSnapshotInput,
  type SupportedClipContentType,
  type SupportedPosterContentType,
} from '@/lib/storage/clips'
import type { BoardKind, BoardMode } from '@/types/bingo'
import type {
  ClipOwnerKind,
  ClipOrientation,
  ConfirmClipUploadResponse,
  PresignedClipUploadRequest,
  PresignedClipUploadResponse,
} from '@/types/clip'
import type { MissionSnapshot } from '@/types/mission'

const GUEST_CLIP_BOARD_METADATA_COLUMNS = [
  'board_kind',
  'title',
  'description',
  'mission_snapshots',
] as const

const CLIP_DESCRIPTION_COLUMNS = ['description', 'clip_description'] as const

interface GuestClipUploadRow {
  id: string
  guest_session_id: string
  client_board_session_id: string
  mode: BoardMode
  board_kind?: BoardKind | null
  nickname: string
  title?: string | null
  description?: string | null
  clip_description?: string | null
  free_position: number
  cell_ids: string[]
  mission_snapshots?: MissionSnapshot[] | null
  position: number
  cell_id: string
  storage_path: string
  poster_storage_path: string | null
  content_type: SupportedClipContentType
  recorder_mime_type: string
  codec: string | null
  size_bytes: number
  duration_ms: number
  width: number | null
  height: number | null
  orientation: ClipOrientation | null
  poster_content_type: SupportedPosterContentType | null
  poster_size_bytes: number | null
  poster_width: number | null
  poster_height: number | null
  upload_status: 'presigned' | 'uploaded' | 'failed' | 'promoted' | 'expired' | 'deleted'
  expires_at: string
  promoted_user_id: string | null
  promoted_clip_id: string | null
  deleted_at: string | null
}

interface ClipRow {
  id: string
  user_id: string
  board_id: string
  position: number
  cell_id: string
  storage_path: string
  poster_storage_path: string | null
  content_type: SupportedClipContentType
  recorder_mime_type: string
  codec: string | null
  size_bytes: number
  duration_ms: number
  width: number | null
  height: number | null
  orientation: ClipOrientation | null
  poster_content_type: SupportedPosterContentType | null
  poster_size_bytes: number | null
  poster_width: number | null
  poster_height: number | null
  uploaded_at: string | null
  poster_uploaded_at: string | null
  recorded_at: string | null
  description?: string | null
  deleted_at: string | null
}

interface StorageObjectInfo {
  size?: number
  mimetype?: string
  metadata?: {
    size?: number
    mimetype?: string
    contentLength?: number
    contentType?: string
  }
}

interface PrepareClipInput extends BoardSnapshotInput {
  position: number
  cellId: string
  contentType: SupportedClipContentType
  recorderMimeType: string
  sizeBytes: number
  durationMs: number
  width?: number
  height?: number
  orientation?: ClipOrientation
  posterContentType: SupportedPosterContentType
  posterSizeBytes: number
  posterWidth?: number
  posterHeight?: number
}

export function getClipSchemaErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('message' in error)) {
    return null
  }

  const message = String(error.message)
  if (
    message.includes("Could not find the table 'public.clips'") ||
    message.includes("Could not find the table 'public.guest_clip_uploads'") ||
    message.includes("Could not find the 'clip_id' column")
  ) {
    return '클립 저장소 설정이 아직 완료되지 않았어요. Supabase 0009_video_clips 마이그레이션을 적용한 뒤 다시 시도해주세요.'
  }

  if (
    message.includes("Could not find the 'board_kind' column") ||
    message.includes("Could not find the 'mission_snapshots' column")
  ) {
    return '커스텀 빙고 저장소 설정이 아직 완료되지 않았어요. Supabase 0010_custom_boards 마이그레이션을 적용한 뒤 다시 시도해주세요.'
  }

  return null
}

function assertSupportedClipContentType(
  contentType: string,
): asserts contentType is SupportedClipContentType {
  if (!isSupportedClipContentType(contentType)) {
    throw new Error(`Unsupported clip content type: ${contentType}`)
  }
}

function assertSupportedPosterContentType(
  contentType: string,
): asserts contentType is SupportedPosterContentType {
  if (!isSupportedPosterContentType(contentType)) {
    throw new Error(`Unsupported poster content type: ${contentType}`)
  }
}

async function createSignedUpload(admin: SupabaseClient, path: string) {
  const { data, error } = await admin.storage
    .from(CLIP_BUCKET)
    .createSignedUploadUrl(path)

  if (error || !data) throw new Error(storageErrorMessage(error))
  return data
}

async function createSignedUrl(admin: SupabaseClient, path: string) {
  const { data, error } = await admin.storage
    .from(CLIP_BUCKET)
    .createSignedUrl(path, SIGNED_PREVIEW_EXPIRES_SECONDS)

  if (error || !data) throw new Error(storageErrorMessage(error))

  return {
    signedUrl: data.signedUrl,
    expiresAt: signedUrlExpiresAt(SIGNED_PREVIEW_EXPIRES_SECONDS),
  }
}

async function assertStoredObjectMatches(
  admin: SupabaseClient,
  path: string,
  expected: { contentType: string; sizeBytes: number },
) {
  const { data, error } = await admin.storage.from(CLIP_BUCKET).info(path)
  if (error || !data) throw new Error(storageErrorMessage(error))

  const info = data as StorageObjectInfo
  const actualSize =
    typeof info.size === 'number'
      ? info.size
      : typeof info.metadata?.size === 'number'
        ? info.metadata.size
        : typeof info.metadata?.contentLength === 'number'
          ? info.metadata.contentLength
          : null
  const actualType =
    info.mimetype ?? info.metadata?.mimetype ?? info.metadata?.contentType ?? null

  if (actualSize !== null && actualSize !== expected.sizeBytes) {
    throw new Error('Uploaded clip size does not match the signed request.')
  }

  if (actualType && actualType !== expected.contentType) {
    throw new Error('Uploaded clip content type does not match the signed request.')
  }
}

function clipPayload(input: PrepareClipInput) {
  return {
    position: input.position,
    cell_id: input.cellId,
    content_type: input.contentType,
    recorder_mime_type: input.recorderMimeType,
    codec: codecFromMimeType(input.recorderMimeType),
    size_bytes: input.sizeBytes,
    duration_ms: Math.round(input.durationMs),
    width: input.width ?? null,
    height: input.height ?? null,
    orientation: input.orientation ?? null,
    poster_content_type: input.posterContentType,
    poster_size_bytes: input.posterSizeBytes,
    poster_width: input.posterWidth ?? null,
    poster_height: input.posterHeight ?? null,
  }
}

function clipDescriptionPayload(input: PresignedClipUploadRequest) {
  return { description: input.clipDescription?.trim() || null }
}

function guestClipDescriptionPayload(input: PresignedClipUploadRequest) {
  return { clip_description: input.clipDescription?.trim() || null }
}

export async function prepareClipUpload(params: {
  input: PresignedClipUploadRequest
  user: User | null
  guestSessionId: string
}): Promise<PresignedClipUploadResponse> {
  assertSupportedClipContentType(params.input.contentType)
  assertSupportedPosterContentType(params.input.posterContentType)

  const admin = createAdminClient()
  const clipId = crypto.randomUUID()
  const clipExt = clipExtFromContentType(params.input.contentType)
  const posterExt = posterExtFromContentType(params.input.posterContentType)
  const ownerKind: ClipOwnerKind = params.user ? 'user' : 'guest'
  let clipPath: string
  let posterPath: string

  if (params.user) {
    const boardId = await ensureUserBoard(admin, params.user.id, params.input)
    clipPath = userClipPath({
      userId: params.user.id,
      boardId,
      position: params.input.position,
      id: clipId,
      ext: clipExt,
    })
    posterPath = userPosterPath({
      userId: params.user.id,
      boardId,
      position: params.input.position,
      id: clipId,
      ext: posterExt,
    })

    const insertPayload = {
      id: clipId,
      user_id: params.user.id,
      board_id: boardId,
      storage_path: clipPath,
      poster_storage_path: posterPath,
      source: 'authenticated',
      ...clipPayload(params.input),
      ...clipDescriptionPayload(params.input),
    }
    let { error: insertError } = await admin
      .from('clips')
      .insert(insertPayload)

    if (insertError && isMissingColumnError(insertError, ['description'])) {
      ;({ error: insertError } = await admin
        .from('clips')
        .insert({
        id: clipId,
        user_id: params.user.id,
        board_id: boardId,
        storage_path: clipPath,
        poster_storage_path: posterPath,
        source: 'authenticated',
        ...clipPayload(params.input),
        }))
    }

    if (insertError) throw insertError
  } else {
    clipPath = guestClipPath({
      guestSessionId: params.guestSessionId,
      clientBoardSessionId: params.input.clientBoardSessionId,
      position: params.input.position,
      id: clipId,
      ext: clipExt,
    })
    posterPath = guestPosterPath({
      guestSessionId: params.guestSessionId,
      clientBoardSessionId: params.input.clientBoardSessionId,
      position: params.input.position,
      id: clipId,
      ext: posterExt,
    })

    const legacyInsertPayload = {
      id: clipId,
      guest_session_id: params.guestSessionId,
      client_board_session_id: params.input.clientBoardSessionId,
      mode: params.input.mode,
      nickname: params.input.nickname,
      free_position: params.input.freePosition,
      cell_ids: params.input.cellIds,
      storage_path: clipPath,
      poster_storage_path: posterPath,
      ...clipPayload(params.input),
    }
    const metadataInsertPayload = {
      id: clipId,
      guest_session_id: params.guestSessionId,
      client_board_session_id: params.input.clientBoardSessionId,
      mode: params.input.mode,
      nickname: params.input.nickname,
      board_kind: params.input.boardKind ?? 'mission',
      title: params.input.title ?? params.input.nickname,
      description: params.input.description ?? null,
      free_position: params.input.freePosition,
      cell_ids: params.input.cellIds,
      mission_snapshots: params.input.missionSnapshots ?? [],
      storage_path: clipPath,
      poster_storage_path: posterPath,
      ...clipPayload(params.input),
    }
    const insertPayload = {
      ...metadataInsertPayload,
      ...guestClipDescriptionPayload(params.input),
    }
    const legacyInsertPayloadWithDescription = {
      ...legacyInsertPayload,
      ...guestClipDescriptionPayload(params.input),
    }
    let { error: insertError } = await admin
      .from('guest_clip_uploads')
      .insert(insertPayload)

    if (
      insertError &&
      isMissingColumnError(insertError, GUEST_CLIP_BOARD_METADATA_COLUMNS)
    ) {
      ;({ error: insertError } = await admin
        .from('guest_clip_uploads')
        .insert(legacyInsertPayloadWithDescription))
    }

    if (
      insertError &&
      isMissingColumnError(insertError, CLIP_DESCRIPTION_COLUMNS)
    ) {
      ;({ error: insertError } = await admin
        .from('guest_clip_uploads')
        .insert(metadataInsertPayload))
    }

    if (
      insertError &&
      isMissingColumnError(insertError, GUEST_CLIP_BOARD_METADATA_COLUMNS)
    ) {
      ;({ error: insertError } = await admin
        .from('guest_clip_uploads')
        .insert(legacyInsertPayload))
    }

    if (insertError) throw insertError
  }

  const clipUpload = await createSignedUpload(admin, clipPath)
  const posterUpload = await createSignedUpload(admin, posterPath)

  return {
    clipId,
    ownerKind,
    clip: {
      path: clipPath,
      uploadUrl: clipUpload.signedUrl,
      token: clipUpload.token,
    },
    poster: {
      path: posterPath,
      uploadUrl: posterUpload.signedUrl,
      token: posterUpload.token,
    },
    expiresAt: signedUrlExpiresAt(SIGNED_UPLOAD_EXPIRES_SECONDS),
  }
}

async function upsertBoardCellForClip(admin: SupabaseClient, clip: ClipRow) {
  const markedAt = new Date().toISOString()
  await admin
    .from('board_cells')
    .upsert(
      {
        board_id: clip.board_id,
        position: clip.position,
        cell_id: clip.cell_id,
        clip_id: clip.id,
        marked_at: markedAt,
        completed_at: markedAt,
        completion_type: 'clip',
      },
      { onConflict: 'board_id,position' },
    )
    .throwOnError()
}

async function createClipPreviewPayload(params: {
  admin: SupabaseClient
  clipId: string
  ownerKind: ClipOwnerKind
  clipPath: string
  posterPath: string
  durationMs: number
  description?: string | null
  requestedClipId?: string
  requestedOwnerKind?: ClipOwnerKind
}): Promise<ConfirmClipUploadResponse> {
  const [clipUrl, posterUrl] = await Promise.all([
    createSignedUrl(params.admin, params.clipPath),
    createSignedUrl(params.admin, params.posterPath),
  ])

  return {
    clipId: params.clipId,
    ownerKind: params.ownerKind,
    clipUrl: clipUrl.signedUrl,
    clipUrlExpiresAt: clipUrl.expiresAt,
    posterUrl: posterUrl.signedUrl,
    posterUrlExpiresAt: posterUrl.expiresAt,
    durationMs: params.durationMs,
    description: params.description?.trim() || undefined,
    requestedClipId: params.requestedClipId,
    requestedOwnerKind: params.requestedOwnerKind,
  }
}

async function verifyClipAndPoster(admin: SupabaseClient, row: {
  storage_path: string
  poster_storage_path: string | null
  content_type: string
  size_bytes: number
  poster_content_type: string | null
  poster_size_bytes: number | null
}) {
  if (!row.poster_storage_path || !row.poster_content_type || !row.poster_size_bytes) {
    throw new Error('Clip poster metadata is missing.')
  }

  await assertStoredObjectMatches(admin, row.storage_path, {
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
  })
  await assertStoredObjectMatches(admin, row.poster_storage_path, {
    contentType: row.poster_content_type,
    sizeBytes: row.poster_size_bytes,
  })
}

export async function confirmClipUpload(params: {
  clipId: string
  ownerKind: ClipOwnerKind
  user: User | null
  guestSessionId: string | null
}): Promise<ConfirmClipUploadResponse> {
  const admin = createAdminClient()
  const now = new Date().toISOString()

  if (params.ownerKind === 'user') {
    if (!params.user) throw new Error('Authentication required.')

    const { data: clip, error } = await admin
      .from('clips')
      .select('*')
      .eq('id', params.clipId)
      .eq('user_id', params.user.id)
      .is('deleted_at', null)
      .maybeSingle<ClipRow>()

    if (error) throw error
    if (!clip) throw new Error('Clip not found.')

    await verifyClipAndPoster(admin, clip)
    await admin
      .from('clips')
      .update({
        uploaded_at: now,
        recorded_at: now,
        poster_uploaded_at: now,
      })
      .eq('id', params.clipId)
      .throwOnError()
    await upsertBoardCellForClip(admin, clip)

    return createClipPreviewPayload({
      admin,
      clipId: clip.id,
      ownerKind: 'user',
      clipPath: clip.storage_path,
      posterPath: clip.poster_storage_path!,
      durationMs: clip.duration_ms,
      description: clip.description,
    })
  }

  if (!params.guestSessionId) throw new Error('Guest session required.')

  const { data: upload, error } = await admin
    .from('guest_clip_uploads')
    .select('*')
    .eq('id', params.clipId)
    .eq('guest_session_id', params.guestSessionId)
    .is('deleted_at', null)
    .maybeSingle<GuestClipUploadRow>()

  if (error) throw error
  if (!upload) throw new Error('Clip not found.')
  if (new Date(upload.expires_at).getTime() <= Date.now()) {
    throw new Error('Guest clip expired.')
  }

  await verifyClipAndPoster(admin, upload)
  await admin
    .from('guest_clip_uploads')
    .update({
      upload_status: 'uploaded',
      uploaded_at: now,
      poster_uploaded_at: now,
    })
    .eq('id', params.clipId)
    .throwOnError()

  return createClipPreviewPayload({
    admin,
    clipId: upload.id,
    ownerKind: 'guest',
    clipPath: upload.storage_path,
    posterPath: upload.poster_storage_path!,
    durationMs: upload.duration_ms,
    description: upload.clip_description,
  })
}

async function resolvePromotedGuestClip(params: {
  admin: SupabaseClient
  userId: string
  guestClipId: string
}): Promise<ClipRow | null> {
  const { data: promoted, error: promotedError } = await params.admin
    .from('guest_clip_uploads')
    .select('promoted_clip_id, promoted_user_id')
    .eq('id', params.guestClipId)
    .eq('promoted_user_id', params.userId)
    .not('promoted_clip_id', 'is', null)
    .maybeSingle<{ promoted_clip_id: string | null }>()

  if (promotedError) throw promotedError
  if (!promoted?.promoted_clip_id) return null

  const { data: clip, error: clipError } = await params.admin
    .from('clips')
    .select('*')
    .eq('id', promoted.promoted_clip_id)
    .eq('user_id', params.userId)
    .not('uploaded_at', 'is', null)
    .is('deleted_at', null)
    .maybeSingle<ClipRow>()

  if (clipError) throw clipError
  return clip ?? null
}

export async function createClipPreviewUrls(params: {
  clips: Array<{ clipId: string; ownerKind: ClipOwnerKind }>
  user: User | null
  guestSessionId: string | null
}): Promise<ConfirmClipUploadResponse[]> {
  const admin = createAdminClient()
  const result: ConfirmClipUploadResponse[] = []

  for (const clipRef of params.clips) {
    let payload: ConfirmClipUploadResponse | null = null

    if (clipRef.ownerKind === 'user') {
      if (!params.user) continue
      const { data } = await admin
        .from('clips')
        .select('*')
        .eq('id', clipRef.clipId)
        .eq('user_id', params.user.id)
        .not('uploaded_at', 'is', null)
        .is('deleted_at', null)
        .maybeSingle<ClipRow>()

      if (data?.poster_storage_path) {
        payload = await createClipPreviewPayload({
          admin,
          clipId: data.id,
          ownerKind: 'user',
          clipPath: data.storage_path,
          posterPath: data.poster_storage_path,
          durationMs: data.duration_ms,
          description: data.description,
          requestedClipId: clipRef.clipId,
          requestedOwnerKind: clipRef.ownerKind,
        })
      }
    } else if (params.guestSessionId) {
      const { data } = await admin
        .from('guest_clip_uploads')
        .select('*')
        .eq('id', clipRef.clipId)
        .eq('guest_session_id', params.guestSessionId)
        .eq('upload_status', 'uploaded')
        .is('deleted_at', null)
        .maybeSingle<GuestClipUploadRow>()

      if (data?.poster_storage_path) {
        payload = await createClipPreviewPayload({
          admin,
          clipId: data.id,
          ownerKind: 'guest',
          clipPath: data.storage_path,
          posterPath: data.poster_storage_path,
          durationMs: data.duration_ms,
          description: data.clip_description,
          requestedClipId: clipRef.clipId,
          requestedOwnerKind: clipRef.ownerKind,
        })
      }
    } else if (params.user) {
      const promoted = await resolvePromotedGuestClip({
        admin,
        userId: params.user.id,
        guestClipId: clipRef.clipId,
      })
      if (promoted?.poster_storage_path) {
        payload = await createClipPreviewPayload({
          admin,
          clipId: promoted.id,
          ownerKind: 'user',
          clipPath: promoted.storage_path,
          posterPath: promoted.poster_storage_path,
          durationMs: promoted.duration_ms,
          description: promoted.description,
          requestedClipId: clipRef.clipId,
          requestedOwnerKind: clipRef.ownerKind,
        })
      }
    }

    if (payload) result.push(payload)
  }

  return result
}

export async function deleteClip(params: {
  clipId: string
  ownerKind: ClipOwnerKind
  user: User | null
  guestSessionId: string | null
}): Promise<void> {
  const admin = createAdminClient()
  const now = new Date().toISOString()
  let paths: string[] = []

  if (params.ownerKind === 'user') {
    if (!params.user) return
    const { data: clip, error } = await admin
      .from('clips')
      .select('*')
      .eq('id', params.clipId)
      .eq('user_id', params.user.id)
      .is('deleted_at', null)
      .maybeSingle<ClipRow>()

    if (error) throw error
    if (!clip) return
    paths = [clip.storage_path, clip.poster_storage_path].filter(
      (path): path is string => Boolean(path),
    )

    await admin
      .from('board_cells')
      .update({
        clip_id: null,
        marked_at: null,
        completed_at: null,
        completion_type: null,
      })
      .eq('clip_id', params.clipId)
      .throwOnError()
    await admin
      .from('clips')
      .update({ deleted_at: now })
      .eq('id', params.clipId)
      .throwOnError()
  } else {
    if (!params.guestSessionId) return
    const { data: upload, error } = await admin
      .from('guest_clip_uploads')
      .select('*')
      .eq('id', params.clipId)
      .eq('guest_session_id', params.guestSessionId)
      .is('deleted_at', null)
      .maybeSingle<GuestClipUploadRow>()

    if (error) throw error
    if (!upload) return
    paths = [upload.storage_path, upload.poster_storage_path].filter(
      (path): path is string => Boolean(path),
    )

    await admin
      .from('guest_clip_uploads')
      .update({ upload_status: 'deleted', deleted_at: now })
      .eq('id', params.clipId)
      .throwOnError()
  }

  if (paths.length) {
    await admin.storage.from(CLIP_BUCKET).remove(paths)
  }
}

export async function updateClipDescription(params: {
  clipId: string
  ownerKind: ClipOwnerKind
  description: string | undefined
  boardSnapshot?: {
    boardKind: BoardKind
    title: string
    description?: string
    freePosition: number
    cellIds: string[]
    missionSnapshots: MissionSnapshot[]
  }
  user: User | null
  guestSessionId: string | null
}): Promise<void> {
  const admin = createAdminClient()
  const description = params.description?.trim() || null

  if (params.ownerKind === 'user') {
    if (!params.user) return
    const { error } = await admin
      .from('clips')
      .update({ description })
      .eq('id', params.clipId)
      .eq('user_id', params.user.id)
      .is('deleted_at', null)

    if (error && isMissingColumnError(error, ['description'])) return
    if (error) throw error
    return
  }

  if (!params.guestSessionId) return
  const { data: upload, error: uploadError } = await admin
    .from('guest_clip_uploads')
    .select('client_board_session_id')
    .eq('id', params.clipId)
    .eq('guest_session_id', params.guestSessionId)
    .is('deleted_at', null)
    .maybeSingle<{ client_board_session_id: string }>()

  if (uploadError) throw uploadError
  if (!upload) return

  const { error } = await admin
    .from('guest_clip_uploads')
    .update({ clip_description: description })
    .eq('id', params.clipId)
    .eq('guest_session_id', params.guestSessionId)
    .is('deleted_at', null)

  if (error && !isMissingColumnError(error, ['clip_description'])) {
    throw error
  }

  if (!params.boardSnapshot) return

  const { error: boardUpdateError } = await admin
    .from('guest_clip_uploads')
    .update({
      board_kind: params.boardSnapshot.boardKind,
      title: params.boardSnapshot.title,
      description: params.boardSnapshot.description ?? null,
      free_position: params.boardSnapshot.freePosition,
      cell_ids: params.boardSnapshot.cellIds,
      mission_snapshots: params.boardSnapshot.missionSnapshots,
    })
    .eq('guest_session_id', params.guestSessionId)
    .eq('client_board_session_id', upload.client_board_session_id)
    .is('deleted_at', null)

  if (
    boardUpdateError &&
    isMissingColumnError(boardUpdateError, GUEST_CLIP_BOARD_METADATA_COLUMNS)
  ) {
    return
  }
  if (boardUpdateError) throw boardUpdateError
}

export async function promoteGuestClipsForUser(params: {
  userId: string
  guestSessionId: string | null
}) {
  if (!params.guestSessionId) return { promoted: 0, clips: [] }

  const admin = createAdminClient()
  const { data: uploads, error } = await admin
    .from('guest_clip_uploads')
    .select('*')
    .eq('guest_session_id', params.guestSessionId)
    .eq('upload_status', 'uploaded')
    .is('deleted_at', null)
    .returns<GuestClipUploadRow[]>()

  if (error) throw error
  if (!uploads?.length) return { promoted: 0, clips: [] }

  let promoted = 0
  const clips = []
  const now = new Date().toISOString()

  for (const upload of uploads) {
    if (!upload.poster_storage_path || upload.promoted_clip_id) continue

    const boardId = await ensureUserBoard(admin, params.userId, {
      clientBoardSessionId: upload.client_board_session_id,
      mode: upload.mode,
      boardKind: upload.board_kind ?? 'mission',
      nickname: upload.nickname,
      title: upload.title ?? upload.nickname,
      description: upload.description ?? undefined,
      freePosition: upload.free_position,
      cellIds: upload.cell_ids,
      missionSnapshots: upload.mission_snapshots ?? [],
    })

    const clipExt = clipExtFromContentType(upload.content_type)
    const posterExt = posterExtFromContentType(upload.poster_content_type ?? 'image/jpeg')
    const clipPath = userClipPath({
      userId: params.userId,
      boardId,
      position: upload.position,
      id: upload.id,
      ext: clipExt,
    })
    const posterPath = userPosterPath({
      userId: params.userId,
      boardId,
      position: upload.position,
      id: upload.id,
      ext: posterExt,
    })

    const clipCopy = await admin.storage
      .from(CLIP_BUCKET)
      .copy(upload.storage_path, clipPath)
    if (clipCopy.error) throw clipCopy.error
    const posterCopy = await admin.storage
      .from(CLIP_BUCKET)
      .copy(upload.poster_storage_path, posterPath)
    if (posterCopy.error) throw posterCopy.error

    const promotedClipBasePayload = {
      id: upload.id,
      user_id: params.userId,
      board_id: boardId,
      cell_id: upload.cell_id,
      position: upload.position,
      storage_path: clipPath,
      poster_storage_path: posterPath,
      content_type: upload.content_type,
      recorder_mime_type: upload.recorder_mime_type,
      codec: upload.codec,
      size_bytes: upload.size_bytes,
      duration_ms: upload.duration_ms,
      width: upload.width,
      height: upload.height,
      orientation: upload.orientation,
      poster_content_type: upload.poster_content_type,
      poster_size_bytes: upload.poster_size_bytes,
      poster_width: upload.poster_width,
      poster_height: upload.poster_height,
      uploaded_at: now,
      poster_uploaded_at: now,
      recorded_at: now,
      source: 'guest_promoted',
    }
    const promotedClipPayload = {
      ...promotedClipBasePayload,
      description: upload.clip_description ?? null,
    }
    let { error: clipInsertError } = await admin
      .from('clips')
      .insert(promotedClipPayload)

    if (clipInsertError && isMissingColumnError(clipInsertError, ['description'])) {
      ;({ error: clipInsertError } = await admin
        .from('clips')
        .insert(promotedClipBasePayload))
    }

    if (clipInsertError) throw clipInsertError

    await admin
      .from('board_cells')
      .upsert(
        {
          board_id: boardId,
          position: upload.position,
          cell_id: upload.cell_id,
          clip_id: upload.id,
          marked_at: now,
          completed_at: now,
          completion_type: 'clip',
        },
        { onConflict: 'board_id,position' },
      )
      .throwOnError()

    await admin
      .from('guest_clip_uploads')
      .update({
        upload_status: 'promoted',
        promoted_user_id: params.userId,
        promoted_clip_id: upload.id,
        promoted_at: now,
      })
      .eq('id', upload.id)
      .throwOnError()

    promoted += 1
    clips.push({ guestClipId: upload.id, userClipId: upload.id })
  }

  return { promoted, clips }
}

export async function cleanupExpiredGuestClips(limit = 100) {
  const admin = createAdminClient()
  const { data: uploads, error } = await admin
    .from('guest_clip_uploads')
    .select('*')
    .lte('expires_at', new Date().toISOString())
    .in('upload_status', ['presigned', 'uploaded', 'failed'])
    .limit(limit)
    .returns<GuestClipUploadRow[]>()

  if (error) throw error
  if (!uploads?.length) return { deleted: 0 }

  const paths = uploads.flatMap((upload) =>
    [upload.storage_path, upload.poster_storage_path].filter(
      (path): path is string => Boolean(path),
    ),
  )

  if (paths.length) await admin.storage.from(CLIP_BUCKET).remove(paths)

  await admin
    .from('guest_clip_uploads')
    .update({
      upload_status: 'expired',
      deleted_at: new Date().toISOString(),
    })
    .in('id', uploads.map((upload) => upload.id))
    .throwOnError()

  return { deleted: uploads.length }
}

export function guestCookieOptions() {
  return {
    httpOnly: true,
    maxAge: GUEST_SESSION_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  }
}
