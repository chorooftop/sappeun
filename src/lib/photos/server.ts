import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  GUEST_SESSION_MAX_AGE_SECONDS,
  PHOTO_BUCKET,
  SIGNED_PREVIEW_EXPIRES_SECONDS,
  SIGNED_UPLOAD_EXPIRES_SECONDS,
  extFromContentType,
  guestPhotoPath,
  isSupportedPhotoContentType,
  signedUrlExpiresAt,
  storageErrorMessage,
  userPhotoPath,
  type BoardSnapshotInput,
  type SupportedPhotoContentType,
} from '@/lib/storage/photos'
import type { BoardMode } from '@/types/bingo'
import type { PersistedBoardSessionV2 } from '@/types/persisted-board'
import type { PhotoOwnerKind } from '@/types/photo'

export interface PreparedUpload {
  photoId: string
  ownerKind: PhotoOwnerKind
  path: string
  uploadUrl: string
  token: string
  expiresAt: string
}

export interface ConfirmedUpload {
  photoId: string
  ownerKind: PhotoOwnerKind
  previewUrl: string
  previewUrlExpiresAt: string
  requestedPhotoId?: string
  requestedOwnerKind?: PhotoOwnerKind
}

export interface PromotedGuestPhoto {
  guestPhotoId: string
  userPhotoId: string
  position: number
  cellId: string
  previewUrl: string
  previewUrlExpiresAt: string
}

interface PrepareUploadInput extends BoardSnapshotInput {
  position: number
  cellId: string
  contentType: string
  sizeBytes: number
}

interface GuestUploadRow {
  id: string
  guest_session_id: string
  client_board_session_id: string
  mode: BoardMode
  nickname: string
  free_position: number
  cell_ids: string[]
  position: number
  cell_id: string
  storage_path: string
  content_type: string
  size_bytes: number
  upload_status: 'presigned' | 'uploaded' | 'promoted' | 'expired' | 'deleted'
  expires_at: string
  promoted_user_id: string | null
  promoted_photo_id: string | null
}

interface PhotoRow {
  id: string
  user_id: string
  board_id: string | null
  position: number | null
  cell_id: string | null
  storage_path: string
  content_type: string
  size_bytes: number
  uploaded_at: string | null
  deleted_at: string | null
}

interface BoardRow {
  id: string
  mode?: BoardMode
  client_session_id?: string | null
  nickname?: string | null
  free_position?: number | null
  cell_ids?: string[] | null
  created_at?: string
  updated_at?: string
  ended_at?: string | null
}

interface BoardCellRow {
  board_id: string
  position: number
  cell_id: string
  photo_id: string | null
  marked_at: string | null
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

function makeSeedRecipe(input: BoardSnapshotInput) {
  return JSON.stringify({
    version: 2,
    mode: input.mode,
    nickname: input.nickname,
    clientSessionId: input.clientBoardSessionId,
    freePosition: input.freePosition,
    cellIds: input.cellIds,
  })
}

function assertSupportedContentType(
  contentType: string,
): asserts contentType is SupportedPhotoContentType {
  if (!isSupportedPhotoContentType(contentType)) {
    throw new Error(`Unsupported content type: ${contentType}`)
  }
}

async function ensureUserBoard(
  admin: SupabaseClient,
  userId: string,
  input: BoardSnapshotInput,
): Promise<string> {
  const { data: existing, error: selectError } = await admin
    .from('boards')
    .select('id')
    .eq('user_id', userId)
    .eq('client_session_id', input.clientBoardSessionId)
    .maybeSingle<BoardRow>()

  if (selectError) throw selectError
  if (existing) {
    await admin
      .from('boards')
      .update({
        nickname: input.nickname,
        free_position: input.freePosition,
        cell_ids: input.cellIds,
        seed_recipe: makeSeedRecipe(input),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .throwOnError()
    return existing.id
  }

  const { data: inserted, error: insertError } = await admin
    .from('boards')
    .insert({
      user_id: userId,
      mode: input.mode,
      nickname: input.nickname,
      client_session_id: input.clientBoardSessionId,
        free_position: input.freePosition,
        cell_ids: input.cellIds,
        seed_recipe: makeSeedRecipe(input),
      })
    .select('id')
    .single<BoardRow>()

  if (insertError) throw insertError
  return inserted.id
}

async function createSignedUpload(admin: SupabaseClient, path: string) {
  const { data, error } = await admin.storage
    .from(PHOTO_BUCKET)
    .createSignedUploadUrl(path)

  if (error || !data) {
    throw new Error(storageErrorMessage(error))
  }

  return data
}

export async function preparePhotoUpload(params: {
  input: PrepareUploadInput
  user: User | null
  guestSessionId: string
}): Promise<PreparedUpload> {
  assertSupportedContentType(params.input.contentType)

  const admin = createAdminClient()
  const photoId = crypto.randomUUID()
  const ext = extFromContentType(params.input.contentType)
  const ownerKind: PhotoOwnerKind = params.user ? 'user' : 'guest'
  let path: string

  if (params.user) {
    const boardId = await ensureUserBoard(admin, params.user.id, params.input)
    path = userPhotoPath({
      userId: params.user.id,
      boardId,
      position: params.input.position,
      id: photoId,
      ext,
    })

    await admin
      .from('photos')
      .insert({
        id: photoId,
        user_id: params.user.id,
        board_id: boardId,
        position: params.input.position,
        cell_id: params.input.cellId,
        storage_path: path,
        content_type: params.input.contentType,
        size_bytes: params.input.sizeBytes,
        source: 'authenticated',
      })
      .throwOnError()
  } else {
    path = guestPhotoPath({
      guestSessionId: params.guestSessionId,
      clientBoardSessionId: params.input.clientBoardSessionId,
      position: params.input.position,
      id: photoId,
      ext,
    })

    await admin
      .from('guest_photo_uploads')
      .insert({
        id: photoId,
        guest_session_id: params.guestSessionId,
        client_board_session_id: params.input.clientBoardSessionId,
        mode: params.input.mode,
        nickname: params.input.nickname,
        free_position: params.input.freePosition,
        cell_ids: params.input.cellIds,
        position: params.input.position,
        cell_id: params.input.cellId,
        storage_path: path,
        content_type: params.input.contentType,
        size_bytes: params.input.sizeBytes,
      })
      .throwOnError()
  }

  const signedUpload = await createSignedUpload(admin, path)

  return {
    photoId,
    ownerKind,
    path,
    uploadUrl: signedUpload.signedUrl,
    token: signedUpload.token,
    expiresAt: signedUrlExpiresAt(SIGNED_UPLOAD_EXPIRES_SECONDS),
  }
}

async function createPreviewUrl(admin: SupabaseClient, path: string) {
  const { data, error } = await admin.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, SIGNED_PREVIEW_EXPIRES_SECONDS)

  if (error || !data) {
    throw new Error(storageErrorMessage(error))
  }

  return {
    previewUrl: data.signedUrl,
    previewUrlExpiresAt: signedUrlExpiresAt(SIGNED_PREVIEW_EXPIRES_SECONDS),
  }
}

async function assertStoredObjectMatches(
  admin: SupabaseClient,
  path: string,
  expected: { contentType: string; sizeBytes: number },
) {
  const { data, error } = await admin.storage
    .from(PHOTO_BUCKET)
    .info(path)

  if (error || !data) {
    throw new Error(storageErrorMessage(error))
  }

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
    throw new Error('Uploaded photo size does not match the signed request.')
  }

  if (actualType && actualType !== expected.contentType) {
    throw new Error('Uploaded photo content type does not match the signed request.')
  }
}

async function upsertBoardCellForPhoto(
  admin: SupabaseClient,
  photo: Pick<PhotoRow, 'id' | 'board_id' | 'position' | 'cell_id'>,
) {
  if (
    !photo.board_id ||
    photo.position === null ||
    photo.cell_id === null
  ) {
    throw new Error('Photo is missing board cell metadata.')
  }

  await admin
    .from('board_cells')
    .upsert(
      {
        board_id: photo.board_id,
        position: photo.position,
        cell_id: photo.cell_id,
        photo_id: photo.id,
        marked_at: new Date().toISOString(),
      },
      { onConflict: 'board_id,position' },
    )
    .throwOnError()
}

async function createPhotoPreviewPayload(params: {
  admin: SupabaseClient
  photoId: string
  ownerKind: PhotoOwnerKind
  path: string
  requestedPhotoId?: string
  requestedOwnerKind?: PhotoOwnerKind
}): Promise<ConfirmedUpload> {
  return {
    photoId: params.photoId,
    ownerKind: params.ownerKind,
    requestedPhotoId: params.requestedPhotoId,
    requestedOwnerKind: params.requestedOwnerKind,
    ...(await createPreviewUrl(params.admin, params.path)),
  }
}

async function resolvePromotedGuestPhoto(params: {
  admin: SupabaseClient
  userId: string
  guestPhotoId: string
}): Promise<PhotoRow | null> {
  const { data: promoted, error: promotedError } = await params.admin
    .from('guest_photo_uploads')
    .select(
      'id, guest_session_id, client_board_session_id, mode, nickname, free_position, cell_ids, position, cell_id, storage_path, content_type, size_bytes, upload_status, expires_at, promoted_user_id, promoted_photo_id',
    )
    .eq('id', params.guestPhotoId)
    .eq('promoted_user_id', params.userId)
    .not('promoted_photo_id', 'is', null)
    .maybeSingle<GuestUploadRow>()

  if (promotedError) throw promotedError
  if (!promoted?.promoted_photo_id) return null

  const { data: photo, error: photoError } = await params.admin
    .from('photos')
    .select('id, user_id, board_id, position, cell_id, storage_path, content_type, size_bytes, uploaded_at, deleted_at')
    .eq('id', promoted.promoted_photo_id)
    .eq('user_id', params.userId)
    .not('uploaded_at', 'is', null)
    .is('deleted_at', null)
    .maybeSingle<PhotoRow>()

  if (photoError) throw photoError
  return photo ?? null
}

export async function confirmPhotoUpload(params: {
  photoId: string
  ownerKind: PhotoOwnerKind
  user: User | null
  guestSessionId: string | null
}): Promise<ConfirmedUpload> {
  const admin = createAdminClient()
  let path: string

  if (params.ownerKind === 'user') {
    if (!params.user) throw new Error('Authentication required.')

    const { data: photo, error } = await admin
      .from('photos')
      .select('id, user_id, board_id, position, cell_id, storage_path, content_type, size_bytes, uploaded_at, deleted_at')
      .eq('id', params.photoId)
      .eq('user_id', params.user.id)
      .is('deleted_at', null)
      .maybeSingle<PhotoRow>()

    if (error) throw error
    if (!photo) throw new Error('Photo not found.')
    path = photo.storage_path

    await assertStoredObjectMatches(admin, path, {
      contentType: photo.content_type,
      sizeBytes: photo.size_bytes,
    })

    await admin
      .from('photos')
      .update({ uploaded_at: new Date().toISOString() })
      .eq('id', params.photoId)
      .throwOnError()

    await upsertBoardCellForPhoto(admin, photo)
  } else {
    if (!params.guestSessionId) throw new Error('Guest session required.')

    const { data: upload, error } = await admin
      .from('guest_photo_uploads')
      .select(
        'id, guest_session_id, client_board_session_id, mode, nickname, free_position, cell_ids, position, cell_id, storage_path, content_type, size_bytes, upload_status, expires_at, promoted_user_id, promoted_photo_id',
      )
      .eq('id', params.photoId)
      .eq('guest_session_id', params.guestSessionId)
      .is('deleted_at', null)
      .maybeSingle<GuestUploadRow>()

    if (error) throw error
    if (!upload) throw new Error('Photo not found.')
    if (new Date(upload.expires_at).getTime() <= Date.now()) {
      throw new Error('Guest photo expired.')
    }
    path = upload.storage_path

    await assertStoredObjectMatches(admin, path, {
      contentType: upload.content_type,
      sizeBytes: upload.size_bytes,
    })

    await admin
      .from('guest_photo_uploads')
      .update({
        upload_status: 'uploaded',
        uploaded_at: new Date().toISOString(),
      })
      .eq('id', params.photoId)
      .throwOnError()
  }

  return {
    ...(await createPhotoPreviewPayload({
      admin,
      photoId: params.photoId,
      ownerKind: params.ownerKind,
      path,
    })),
  }
}

export async function createPhotoPreviewUrls(params: {
  photos: Array<{ photoId: string; ownerKind: PhotoOwnerKind }>
  user: User | null
  guestSessionId: string | null
}): Promise<ConfirmedUpload[]> {
  const admin = createAdminClient()
  const result: ConfirmedUpload[] = []

  for (const photoRef of params.photos) {
    let payload: ConfirmedUpload | null = null

    if (photoRef.ownerKind === 'user') {
      if (!params.user) continue
      const { data } = await admin
        .from('photos')
        .select('id, user_id, board_id, position, cell_id, storage_path, content_type, size_bytes, uploaded_at, deleted_at')
        .eq('id', photoRef.photoId)
        .eq('user_id', params.user.id)
        .not('uploaded_at', 'is', null)
        .is('deleted_at', null)
        .maybeSingle<PhotoRow>()

      if (data) {
        payload = await createPhotoPreviewPayload({
          admin,
          photoId: data.id,
          ownerKind: 'user',
          path: data.storage_path,
          requestedPhotoId: photoRef.photoId,
          requestedOwnerKind: photoRef.ownerKind,
        })
      }
    } else {
      if (params.guestSessionId) {
        const { data } = await admin
          .from('guest_photo_uploads')
          .select(
            'id, guest_session_id, client_board_session_id, mode, nickname, free_position, cell_ids, position, cell_id, storage_path, content_type, size_bytes, upload_status, expires_at, promoted_user_id, promoted_photo_id',
          )
          .eq('id', photoRef.photoId)
          .eq('guest_session_id', params.guestSessionId)
          .eq('upload_status', 'uploaded')
          .is('deleted_at', null)
          .maybeSingle<GuestUploadRow>()

        if (data && new Date(data.expires_at).getTime() > Date.now()) {
          payload = await createPhotoPreviewPayload({
            admin,
            photoId: data.id,
            ownerKind: 'guest',
            path: data.storage_path,
            requestedPhotoId: photoRef.photoId,
            requestedOwnerKind: photoRef.ownerKind,
          })
        }
      }

      if (!payload && params.user) {
        const promoted = await resolvePromotedGuestPhoto({
          admin,
          userId: params.user.id,
          guestPhotoId: photoRef.photoId,
        })

        if (promoted) {
          payload = await createPhotoPreviewPayload({
            admin,
            photoId: promoted.id,
            ownerKind: 'user',
            path: promoted.storage_path,
            requestedPhotoId: photoRef.photoId,
            requestedOwnerKind: photoRef.ownerKind,
          })
        }
      }
    }

    if (payload) result.push(payload)
  }

  return result
}

export async function deletePhoto(params: {
  photoId: string
  ownerKind: PhotoOwnerKind
  user: User | null
  guestSessionId: string | null
}) {
  const admin = createAdminClient()
  let path: string | null = null

  if (params.ownerKind === 'user') {
    if (!params.user) throw new Error('Authentication required.')

    const { data: photo, error } = await admin
      .from('photos')
      .select('id, user_id, board_id, position, cell_id, storage_path, content_type, size_bytes, uploaded_at, deleted_at')
      .eq('id', params.photoId)
      .eq('user_id', params.user.id)
      .maybeSingle<PhotoRow>()

    if (error) throw error
    if (!photo) return
    path = photo.storage_path

    await admin
      .from('board_cells')
      .update({ photo_id: null, marked_at: null })
      .eq('photo_id', params.photoId)
      .throwOnError()

    await admin
      .from('photos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.photoId)
      .throwOnError()
  } else {
    if (!params.guestSessionId && params.user) {
      const promoted = await resolvePromotedGuestPhoto({
        admin,
        userId: params.user.id,
        guestPhotoId: params.photoId,
      })

      if (!promoted) return

      await deletePhoto({
        photoId: promoted.id,
        ownerKind: 'user',
        user: params.user,
        guestSessionId: null,
      })
      return
    }

    if (!params.guestSessionId) throw new Error('Guest session required.')

    const { data: upload, error } = await admin
      .from('guest_photo_uploads')
      .select(
        'id, guest_session_id, client_board_session_id, mode, nickname, free_position, cell_ids, position, cell_id, storage_path, content_type, size_bytes, upload_status, expires_at, promoted_user_id, promoted_photo_id',
      )
      .eq('id', params.photoId)
      .eq('guest_session_id', params.guestSessionId)
      .maybeSingle<GuestUploadRow>()

    if (error) throw error
    if (!upload) return
    path = upload.storage_path

    await admin
      .from('guest_photo_uploads')
      .update({
        upload_status: 'deleted',
        deleted_at: new Date().toISOString(),
      })
      .eq('id', params.photoId)
      .throwOnError()
  }

  if (path) {
    await admin.storage.from(PHOTO_BUCKET).remove([path])
  }
}

export async function promoteGuestPhotosForUser(params: {
  userId: string
  guestSessionId: string | null
}) {
  if (!params.guestSessionId) return { promoted: 0, photos: [] }

  const admin = createAdminClient()
  const { data: uploads, error } = await admin
    .from('guest_photo_uploads')
    .select(
      'id, guest_session_id, client_board_session_id, mode, nickname, free_position, cell_ids, position, cell_id, storage_path, content_type, size_bytes, upload_status, expires_at, promoted_user_id, promoted_photo_id',
    )
    .eq('guest_session_id', params.guestSessionId)
    .eq('upload_status', 'uploaded')
    .is('deleted_at', null)
    .returns<GuestUploadRow[]>()

  if (error) throw error
  if (!uploads?.length) return { promoted: 0, photos: [] }

  let promoted = 0
  const photos: PromotedGuestPhoto[] = []
  for (const upload of uploads) {
    if (new Date(upload.expires_at).getTime() <= Date.now()) continue
    if (upload.promoted_photo_id) continue

    const snapshot: BoardSnapshotInput = {
      clientBoardSessionId: upload.client_board_session_id,
      mode: upload.mode,
      nickname: upload.nickname,
      freePosition: upload.free_position,
      cellIds: upload.cell_ids,
    }
    const boardId = await ensureUserBoard(admin, params.userId, snapshot)
    assertSupportedContentType(upload.content_type)
    const photoId = upload.id
    const storagePath = userPhotoPath({
      userId: params.userId,
      boardId,
      position: upload.position,
      id: photoId,
      ext: extFromContentType(upload.content_type),
    })

    const { data: existingPhoto, error: existingPhotoError } = await admin
      .from('photos')
      .select('id, user_id, board_id, position, cell_id, storage_path, content_type, size_bytes, uploaded_at, deleted_at')
      .eq('id', photoId)
      .maybeSingle<PhotoRow>()

    if (existingPhotoError) throw existingPhotoError

    if (!existingPhoto) {
      const { data: destinationExists, error: destinationExistsError } =
        await admin.storage.from(PHOTO_BUCKET).exists(storagePath)

      if (destinationExistsError && destinationExists !== false) {
        throw new Error(storageErrorMessage(destinationExistsError))
      }

      if (!destinationExists) {
        const { error: copyError } = await admin.storage
          .from(PHOTO_BUCKET)
          .copy(upload.storage_path, storagePath)

        if (copyError) throw copyError
      }

      await admin
        .from('photos')
        .insert({
          id: photoId,
          user_id: params.userId,
          board_id: boardId,
          position: upload.position,
          cell_id: upload.cell_id,
          storage_path: storagePath,
          content_type: upload.content_type,
          size_bytes: upload.size_bytes,
          uploaded_at: new Date().toISOString(),
          source: 'guest_promoted',
        })
        .throwOnError()
    }

    await admin
      .from('board_cells')
      .upsert(
        {
          board_id: boardId,
          position: upload.position,
          cell_id: upload.cell_id,
          photo_id: photoId,
          marked_at: new Date().toISOString(),
        },
        { onConflict: 'board_id,position' },
      )
      .throwOnError()

    await admin.storage.from(PHOTO_BUCKET).remove([upload.storage_path])

    await admin
      .from('guest_photo_uploads')
      .update({
        upload_status: 'promoted',
        promoted_user_id: params.userId,
        promoted_photo_id: photoId,
        promoted_at: new Date().toISOString(),
        deleted_at: new Date().toISOString(),
      })
      .eq('id', upload.id)
      .throwOnError()

    photos.push({
      guestPhotoId: upload.id,
      userPhotoId: photoId,
      position: upload.position,
      cellId: upload.cell_id,
      ...(await createPreviewUrl(admin, storagePath)),
    })
    promoted += 1
  }

  return { promoted, photos }
}

export async function cleanupExpiredGuestPhotos(limit = 100) {
  const admin = createAdminClient()
  const { data: uploads, error } = await admin
    .from('guest_photo_uploads')
    .select(
      'id, guest_session_id, client_board_session_id, mode, nickname, free_position, cell_ids, position, cell_id, storage_path, content_type, size_bytes, upload_status, expires_at, promoted_user_id, promoted_photo_id',
    )
    .in('upload_status', ['presigned', 'uploaded'])
    .lt('expires_at', new Date().toISOString())
    .is('deleted_at', null)
    .limit(limit)
    .returns<GuestUploadRow[]>()

  if (error) throw error
  if (!uploads?.length) return { expired: 0 }

  for (const upload of uploads) {
    await admin.storage.from(PHOTO_BUCKET).remove([upload.storage_path])
    await admin
      .from('guest_photo_uploads')
      .update({
        upload_status: 'expired',
        deleted_at: new Date().toISOString(),
      })
      .eq('id', upload.id)
      .throwOnError()
  }

  return { expired: uploads.length }
}

function isRestorableBoardMode(mode: BoardMode | undefined): mode is '5x5' | '3x3' {
  return mode === '5x5' || mode === '3x3'
}

export async function getLatestUserBoardSession(
  userId: string,
): Promise<PersistedBoardSessionV2 | null> {
  const admin = createAdminClient()
  const { data: board, error: boardError } = await admin
    .from('boards')
    .select('id, mode, client_session_id, nickname, free_position, cell_ids, created_at, updated_at, ended_at')
    .eq('user_id', userId)
    .is('ended_at', null)
    .not('client_session_id', 'is', null)
    .not('cell_ids', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle<BoardRow>()

  if (boardError) throw boardError
  if (
    !board ||
    !isRestorableBoardMode(board.mode) ||
    !board.client_session_id ||
    !board.nickname ||
    typeof board.free_position !== 'number' ||
    !board.cell_ids?.length
  ) {
    return null
  }

  const { data: cells, error: cellsError } = await admin
    .from('board_cells')
    .select('board_id, position, cell_id, photo_id, marked_at')
    .eq('board_id', board.id)
    .order('position', { ascending: true })
    .returns<BoardCellRow[]>()

  if (cellsError) throw cellsError

  const photoIds = (cells ?? [])
    .map((cell) => cell.photo_id)
    .filter((photoId): photoId is string => Boolean(photoId))
  const photosById = new Map<string, PhotoRow>()

  if (photoIds.length) {
    const { data: photos, error: photosError } = await admin
      .from('photos')
      .select('id, user_id, board_id, position, cell_id, storage_path, content_type, size_bytes, uploaded_at, deleted_at')
      .eq('user_id', userId)
      .in('id', photoIds)
      .not('uploaded_at', 'is', null)
      .is('deleted_at', null)
      .returns<PhotoRow[]>()

    if (photosError) throw photosError
    photos?.forEach((photo) => photosById.set(photo.id, photo))
  }

  const persistedPhotos = []
  const markedPositions = new Set<number>()

  for (const cell of cells ?? []) {
    if (cell.marked_at) markedPositions.add(cell.position)
    if (!cell.photo_id) continue

    const photo = photosById.get(cell.photo_id)
    if (!photo) continue
    const preview = await createPreviewUrl(admin, photo.storage_path)

    persistedPhotos.push({
      position: cell.position,
      cellId: cell.cell_id,
      photoId: photo.id,
      ownerKind: 'user' as const,
      previewUrl: preview.previewUrl,
      previewUrlExpiresAt: preview.previewUrlExpiresAt,
      uploadStatus: 'uploaded' as const,
    })
  }

  return {
    version: 2,
    sessionId: board.client_session_id,
    mode: board.mode,
    nickname: board.nickname,
    createdAt: board.created_at ?? new Date().toISOString(),
    updatedAt: board.updated_at ?? board.created_at ?? new Date().toISOString(),
    freePosition: board.free_position,
    cellIds: board.cell_ids,
    markedPositions: Array.from(markedPositions).sort((a, b) => a - b),
    photos: persistedPhotos,
    endedAt: null,
  }
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
