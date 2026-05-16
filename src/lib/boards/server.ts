import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createMissionSnapshot,
  MISSION_CATALOG_VERSION,
} from '@/lib/bingo/missionSnapshot'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  PHOTO_BUCKET,
  SIGNED_PREVIEW_EXPIRES_SECONDS,
  signedUrlExpiresAt,
  storageErrorMessage,
  type BoardSnapshotInput,
} from '@/lib/storage/photos'
import { isMissingColumnError } from '@/lib/supabase/errors'
import type { BoardMode } from '@/types/bingo'
import type {
  BoardHistoryCell,
  BoardHistoryDetail,
  BoardHistoryItem,
} from '@/types/board-history'
import type { MissionSnapshot } from '@/types/mission'
import type { PersistedBoardSessionV2 } from '@/types/persisted-board'

interface BoardRow {
  id: string
  user_id: string
  mode: BoardMode
  client_session_id: string | null
  nickname: string | null
  free_position: number | null
  cell_ids: string[] | null
  created_at: string
  updated_at: string | null
  ended_at: string | null
  deleted_at?: string | null
}

interface BoardCellRow {
  board_id: string
  position: number
  cell_id: string
  photo_id: string | null
  marked_at: string | null
  completed_at?: string | null
  completion_type?: 'photo' | 'no_photo' | 'free' | null
  mission_label?: string | null
  mission_capture_label?: string | null
  mission_category?: string | null
  mission_snapshot?: MissionSnapshot | null
  mission_catalog_version?: string | null
}

interface PhotoRow {
  id: string
  user_id: string
  board_id: string | null
  position: number | null
  cell_id: string | null
  storage_path: string
  uploaded_at: string | null
  captured_at?: string | null
  deleted_at: string | null
}

const BOARD_CELL_EXTENDED_COLUMNS = [
  'completed_at',
  'completion_type',
  'mission_label',
  'mission_capture_label',
  'mission_category',
  'mission_caption',
  'mission_hint',
  'mission_icon',
  'mission_snapshot',
  'mission_catalog_version',
] as const

const BOARD_CELL_EXTENDED_SELECT =
  'board_id, position, cell_id, photo_id, marked_at, completed_at, completion_type, mission_label, mission_capture_label, mission_category, mission_snapshot, mission_catalog_version'

const BOARD_CELL_BASE_SELECT =
  'board_id, position, cell_id, photo_id, marked_at'

const PHOTO_HISTORY_SELECT =
  'id, user_id, board_id, position, cell_id, storage_path, uploaded_at, captured_at, deleted_at'

const PHOTO_HISTORY_BASE_SELECT =
  'id, user_id, board_id, position, cell_id, storage_path, uploaded_at, deleted_at'

const BOARD_HISTORY_SELECT =
  'id, user_id, mode, client_session_id, nickname, free_position, cell_ids, created_at, updated_at, ended_at, deleted_at'

const BOARD_HISTORY_BASE_SELECT =
  'id, user_id, mode, client_session_id, nickname, free_position, cell_ids, created_at, updated_at, ended_at'

function makeSeedRecipe(input: BoardSnapshotInput) {
  return JSON.stringify({
    version: 3,
    mode: input.mode,
    nickname: input.nickname,
    clientSessionId: input.clientBoardSessionId,
    freePosition: input.freePosition,
    cellIds: input.cellIds,
    missionCatalogVersion: MISSION_CATALOG_VERSION,
  })
}

function fallbackMissionSnapshot(cellId: string): MissionSnapshot {
  return {
    id: cellId,
    category: 'special',
    label: cellId,
    icon: null,
    variant: 'rAdyJ',
  }
}

function missionSnapshotFor(cellId: string) {
  return createMissionSnapshot(cellId) ?? fallbackMissionSnapshot(cellId)
}

function boardCellSnapshotPayload(
  boardId: string,
  position: number,
  cellId: string,
) {
  const mission = missionSnapshotFor(cellId)

  return {
    board_id: boardId,
    position,
    cell_id: cellId,
    mission_label: mission.label,
    mission_capture_label: mission.captureLabel ?? mission.label,
    mission_category: mission.category,
    mission_caption: mission.caption ?? null,
    mission_hint: mission.hint ?? null,
    mission_icon: mission.icon,
    mission_snapshot: mission,
    mission_catalog_version: MISSION_CATALOG_VERSION,
  }
}

function boardCellBasePayload(
  boardId: string,
  position: number,
  cellId: string,
) {
  return {
    board_id: boardId,
    position,
    cell_id: cellId,
  }
}

async function upsertBoardCellSnapshots(
  admin: SupabaseClient,
  boardId: string,
  cellIds: readonly string[],
) {
  const rows = cellIds.map((cellId, position) =>
    boardCellSnapshotPayload(boardId, position, cellId),
  )

  if (!rows.length) return

  let { error } = await admin
    .from('board_cells')
    .upsert(rows, { onConflict: 'board_id,position' })

  if (error && isMissingColumnError(error, BOARD_CELL_EXTENDED_COLUMNS)) {
    ;({ error } = await admin
      .from('board_cells')
      .upsert(
        cellIds.map((cellId, position) =>
          boardCellBasePayload(boardId, position, cellId),
        ),
        { onConflict: 'board_id,position' },
      ))
  }

  if (error) throw error
}

async function getBoardCellsForBoards(
  admin: SupabaseClient,
  boardIds: readonly string[],
) {
  let { data, error } = await admin
    .from('board_cells')
    .select(BOARD_CELL_EXTENDED_SELECT)
    .in('board_id', boardIds)
    .returns<BoardCellRow[]>()

  if (error && isMissingColumnError(error, BOARD_CELL_EXTENDED_COLUMNS)) {
    ;({ data, error } = await admin
      .from('board_cells')
      .select(BOARD_CELL_BASE_SELECT)
      .in('board_id', boardIds)
      .returns<BoardCellRow[]>())
  }

  if (error) throw error
  return data ?? []
}

async function getBoardCellsForBoard(
  admin: SupabaseClient,
  boardId: string,
) {
  let { data, error } = await admin
    .from('board_cells')
    .select(BOARD_CELL_EXTENDED_SELECT)
    .eq('board_id', boardId)
    .order('position', { ascending: true })
    .returns<BoardCellRow[]>()

  if (error && isMissingColumnError(error, BOARD_CELL_EXTENDED_COLUMNS)) {
    ;({ data, error } = await admin
      .from('board_cells')
      .select(BOARD_CELL_BASE_SELECT)
      .eq('board_id', boardId)
      .order('position', { ascending: true })
      .returns<BoardCellRow[]>())
  }

  if (error) throw error
  return data ?? []
}

async function getHistoryPhotos(
  admin: SupabaseClient,
  userId: string,
  photoIds: readonly string[],
) {
  let { data, error } = await admin
    .from('photos')
    .select(PHOTO_HISTORY_SELECT)
    .eq('user_id', userId)
    .in('id', photoIds)
    .not('uploaded_at', 'is', null)
    .is('deleted_at', null)
    .returns<PhotoRow[]>()

  if (error && isMissingColumnError(error, ['captured_at'])) {
    ;({ data, error } = await admin
      .from('photos')
      .select(PHOTO_HISTORY_BASE_SELECT)
      .eq('user_id', userId)
      .in('id', photoIds)
      .not('uploaded_at', 'is', null)
      .is('deleted_at', null)
      .returns<PhotoRow[]>())
  }

  if (error) throw error
  return data ?? []
}

export async function ensureUserBoard(
  admin: SupabaseClient,
  userId: string,
  input: BoardSnapshotInput,
): Promise<string> {
  const now = new Date().toISOString()
  let { data: existing, error: selectError } = await admin
    .from('boards')
    .select('id, deleted_at')
    .eq('user_id', userId)
    .eq('client_session_id', input.clientBoardSessionId)
    .is('deleted_at', null)
    .maybeSingle<Pick<BoardRow, 'id'>>()

  if (selectError && isMissingColumnError(selectError, ['deleted_at'])) {
    ;({ data: existing, error: selectError } = await admin
      .from('boards')
      .select('id')
      .eq('user_id', userId)
      .eq('client_session_id', input.clientBoardSessionId)
      .maybeSingle<Pick<BoardRow, 'id'>>())
  }

  if (selectError) throw selectError

  if (existing) {
    await admin
      .from('boards')
      .update({
        nickname: input.nickname,
        free_position: input.freePosition,
        cell_ids: input.cellIds,
        seed_recipe: makeSeedRecipe(input),
        updated_at: now,
      })
      .eq('id', existing.id)
      .throwOnError()
    await upsertBoardCellSnapshots(admin, existing.id, input.cellIds)
    await deleteOtherActiveUserBoards(admin, userId, input.clientBoardSessionId)
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
      updated_at: now,
    })
    .select('id')
    .single<Pick<BoardRow, 'id'>>()

  if (insertError) {
    if (insertError.code === '23505') {
      const { data: racedExisting, error: racedSelectError } = await admin
        .from('boards')
        .select('id')
        .eq('user_id', userId)
        .eq('client_session_id', input.clientBoardSessionId)
        .maybeSingle<Pick<BoardRow, 'id'>>()

      if (racedSelectError) throw racedSelectError
      if (racedExisting) {
        await upsertBoardCellSnapshots(admin, racedExisting.id, input.cellIds)
        await deleteOtherActiveUserBoards(
          admin,
          userId,
          input.clientBoardSessionId,
        )
        return racedExisting.id
      }
    }
    throw insertError
  }
  await upsertBoardCellSnapshots(admin, inserted.id, input.cellIds)
  await deleteOtherActiveUserBoards(admin, userId, input.clientBoardSessionId)
  return inserted.id
}

export async function ensureUserBoardFromSession(
  userId: string,
  session: PersistedBoardSessionV2,
) {
  const admin = createAdminClient()
  const boardId = await ensureUserBoard(admin, userId, {
    clientBoardSessionId: session.sessionId,
    mode: session.mode,
    nickname: session.nickname,
    freePosition: session.freePosition,
    cellIds: session.cellIds,
  })

  return { boardId }
}

async function createPreviewUrl(admin: SupabaseClient, path: string) {
  const { data, error } = await admin.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, SIGNED_PREVIEW_EXPIRES_SECONDS)

  if (error || !data) throw new Error(storageErrorMessage(error))

  return {
    previewUrl: data.signedUrl,
    previewUrlExpiresAt: signedUrlExpiresAt(SIGNED_PREVIEW_EXPIRES_SECONDS),
  }
}

function boardUpdatedAt(board: BoardRow) {
  return board.updated_at ?? board.created_at
}

function toHistoryItem(
  board: BoardRow,
  cells: readonly BoardCellRow[],
): BoardHistoryItem {
  const completedPositions = new Set<number>()
  let photoCount = 0

  for (const cell of cells) {
    if (cell.photo_id) photoCount += 1
    if (cell.photo_id || cell.marked_at || cell.completed_at) {
      completedPositions.add(cell.position)
    }
  }

  return {
    id: board.id,
    mode: board.mode,
    nickname: board.nickname ?? '산책',
    createdAt: board.created_at,
    updatedAt: boardUpdatedAt(board),
    endedAt: board.ended_at,
    photoCount,
    completedCount: completedPositions.size,
  }
}

export async function listUserBoards(userId: string): Promise<BoardHistoryItem[]> {
  const admin = createAdminClient()
  let { data: boards, error: boardError } = await admin
    .from('boards')
    .select(BOARD_HISTORY_SELECT)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .not('client_session_id', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(50)
    .returns<BoardRow[]>()

  if (boardError && isMissingColumnError(boardError, ['deleted_at'])) {
    ;({ data: boards, error: boardError } = await admin
      .from('boards')
      .select(BOARD_HISTORY_BASE_SELECT)
      .eq('user_id', userId)
      .not('client_session_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(50)
      .returns<BoardRow[]>())
  }

  if (boardError) throw boardError
  if (!boards?.length) return []

  const boardIds = boards.map((board) => board.id)
  const cells = await getBoardCellsForBoards(admin, boardIds)

  const cellsByBoard = new Map<string, BoardCellRow[]>()
  cells.forEach((cell) => {
    const list = cellsByBoard.get(cell.board_id) ?? []
    list.push(cell)
    cellsByBoard.set(cell.board_id, list)
  })

  return boards.map((board) => toHistoryItem(board, cellsByBoard.get(board.id) ?? []))
}

function detailCellFromRow(
  row: BoardCellRow,
  photo: BoardHistoryCell['photo'],
): BoardHistoryCell {
  return {
    position: row.position,
    cellId: row.cell_id,
    mission: row.mission_snapshot ?? missionSnapshotFor(row.cell_id),
    markedAt: row.marked_at,
    completedAt: row.completed_at ?? null,
    completionType: row.completion_type ?? null,
    photo,
  }
}

export async function getUserBoardDetail(
  userId: string,
  boardId: string,
): Promise<BoardHistoryDetail | null> {
  const admin = createAdminClient()
  let { data: board, error: boardError } = await admin
    .from('boards')
    .select(BOARD_HISTORY_SELECT)
    .eq('id', boardId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .maybeSingle<BoardRow>()

  if (boardError && isMissingColumnError(boardError, ['deleted_at'])) {
    ;({ data: board, error: boardError } = await admin
      .from('boards')
      .select(BOARD_HISTORY_BASE_SELECT)
      .eq('id', boardId)
      .eq('user_id', userId)
      .maybeSingle<BoardRow>())
  }

  if (boardError) throw boardError
  if (!board || !board.client_session_id || !board.cell_ids || board.free_position === null) {
    return null
  }

  let cells = await getBoardCellsForBoard(admin, board.id)

  if (!cells.length) {
    await upsertBoardCellSnapshots(admin, board.id, board.cell_ids)
    cells = await getBoardCellsForBoard(admin, board.id)
  }

  const photoIds = cells
    .map((cell) => cell.photo_id)
    .filter((photoId): photoId is string => Boolean(photoId))
  const photosById = new Map<string, PhotoRow>()

  if (photoIds.length) {
    const photos = await getHistoryPhotos(admin, userId, photoIds)
    photos?.forEach((photo) => photosById.set(photo.id, photo))
  }

  const detailCells: BoardHistoryCell[] = []
  for (const cell of cells) {
    let photo: BoardHistoryCell['photo'] = null
    if (cell.photo_id) {
      const row = photosById.get(cell.photo_id)
      if (row) {
        photo = {
          photoId: row.id,
          uploadedAt: row.uploaded_at,
          capturedAt: row.captured_at ?? row.uploaded_at,
          ...(await createPreviewUrl(admin, row.storage_path)),
        }
      }
    }
    detailCells.push(detailCellFromRow(cell, photo))
  }

  const item = toHistoryItem(board, cells)

  return {
    ...item,
    sessionId: board.client_session_id,
    freePosition: board.free_position,
    cellIds: board.cell_ids,
    cells: detailCells,
  }
}

export async function markUserBoardCell(params: {
  userId: string
  boardId: string
  position: number
  cellId: string
  marked: boolean
}) {
  const admin = createAdminClient()
  const completedAt = params.marked ? new Date().toISOString() : null

  const { data: board, error: boardError } = await admin
    .from('boards')
    .select('id')
    .eq('id', params.boardId)
    .eq('user_id', params.userId)
    .maybeSingle<Pick<BoardRow, 'id'>>()

  if (boardError) throw boardError
  if (!board) return

  let { error } = await admin
    .from('board_cells')
    .update({
      cell_id: params.cellId,
      marked_at: completedAt,
      completed_at: completedAt,
      completion_type: params.marked ? 'no_photo' : null,
    })
    .eq('board_id', params.boardId)
    .eq('position', params.position)
    .eq('cell_id', params.cellId)

  if (error && isMissingColumnError(error, BOARD_CELL_EXTENDED_COLUMNS)) {
    ;({ error } = await admin
      .from('board_cells')
      .update({
        cell_id: params.cellId,
        marked_at: completedAt,
      })
      .eq('board_id', params.boardId)
      .eq('position', params.position)
      .eq('cell_id', params.cellId))
  }

  if (error) throw error

  await admin
    .from('boards')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', params.boardId)
    .eq('user_id', params.userId)
    .throwOnError()
}

export async function replaceUserBoardCell(params: {
  userId: string
  boardId: string
  position: number
  cellId: string
}) {
  const admin = createAdminClient()
  const { data: board, error: boardError } = await admin
    .from('boards')
    .select('id')
    .eq('id', params.boardId)
    .eq('user_id', params.userId)
    .maybeSingle<Pick<BoardRow, 'id'>>()

  if (boardError) throw boardError
  if (!board) return

  const payload = boardCellSnapshotPayload(
    params.boardId,
    params.position,
    params.cellId,
  )

  let { error } = await admin
    .from('board_cells')
    .upsert(
      {
        ...payload,
        photo_id: null,
        marked_at: null,
        completed_at: null,
        completion_type: null,
      },
      { onConflict: 'board_id,position' },
    )

  if (error && isMissingColumnError(error, BOARD_CELL_EXTENDED_COLUMNS)) {
    ;({ error } = await admin
      .from('board_cells')
      .upsert(
        {
          ...boardCellBasePayload(
            params.boardId,
            params.position,
            params.cellId,
          ),
          photo_id: null,
          marked_at: null,
        },
        { onConflict: 'board_id,position' },
      ))
  }

  if (error) throw error

  await admin
    .from('boards')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', params.boardId)
    .eq('user_id', params.userId)
    .throwOnError()
}

export async function endUserBoard(userId: string, boardId: string) {
  const now = new Date().toISOString()
  const { data, error } = await createAdminClient()
    .from('boards')
    .update({ ended_at: now, updated_at: now })
    .eq('id', boardId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle<Pick<BoardRow, 'id'>>()

  if (error) throw error
  return Boolean(data)
}

export async function deleteUserBoard(userId: string, boardId: string) {
  const admin = createAdminClient()
  const now = new Date().toISOString()
  let { data, error } = await admin
    .from('boards')
    .update({ deleted_at: now, updated_at: now })
    .eq('id', boardId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle<Pick<BoardRow, 'id'>>()

  if (error && isMissingColumnError(error, ['deleted_at'])) {
    ;({ data, error } = await admin
      .from('boards')
      .delete()
      .eq('id', boardId)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle<Pick<BoardRow, 'id'>>())
  }

  if (error) throw error
  return Boolean(data)
}

async function deleteActiveUserBoardsForClient(
  admin: SupabaseClient,
  userId: string,
  exceptClientSessionId?: string,
) {
  const now = new Date().toISOString()
  let query = admin
    .from('boards')
    .update({ deleted_at: now, updated_at: now })
    .eq('user_id', userId)
    .is('ended_at', null)
    .is('deleted_at', null)
    .not('client_session_id', 'is', null)

  if (exceptClientSessionId) {
    query = query.neq('client_session_id', exceptClientSessionId)
  }

  let { error } = await query

  if (error && isMissingColumnError(error, ['deleted_at'])) {
    let fallbackQuery = admin
      .from('boards')
      .delete()
      .eq('user_id', userId)
      .is('ended_at', null)
      .not('client_session_id', 'is', null)

    if (exceptClientSessionId) {
      fallbackQuery = fallbackQuery.neq(
        'client_session_id',
        exceptClientSessionId,
      )
    }

    ;({ error } = await fallbackQuery)
  }

  if (error) throw error
}

async function deleteOtherActiveUserBoards(
  admin: SupabaseClient,
  userId: string,
  clientSessionId: string,
) {
  await deleteActiveUserBoardsForClient(admin, userId, clientSessionId)
}

export async function deleteActiveUserBoards(userId: string) {
  await deleteActiveUserBoardsForClient(createAdminClient(), userId)
}

export async function adoptGuestBoardSession(params: {
  userId: string
  session: PersistedBoardSessionV2
}): Promise<PersistedBoardSessionV2> {
  const admin = createAdminClient()
  const boardId = await ensureUserBoard(admin, params.userId, {
    clientBoardSessionId: params.session.sessionId,
    mode: params.session.mode,
    nickname: params.session.nickname,
    freePosition: params.session.freePosition,
    cellIds: params.session.cellIds,
  })
  const now = new Date().toISOString()

  for (const position of params.session.markedPositions) {
    const cellId = params.session.cellIds[position]
    if (!cellId) continue
    let { error } = await admin
      .from('board_cells')
      .update({
        marked_at: now,
        completed_at: now,
        completion_type: 'no_photo',
      })
      .eq('board_id', boardId)
      .eq('position', position)
      .eq('cell_id', cellId)

    if (error && isMissingColumnError(error, BOARD_CELL_EXTENDED_COLUMNS)) {
      ;({ error } = await admin
        .from('board_cells')
        .update({ marked_at: now })
        .eq('board_id', boardId)
        .eq('position', position)
        .eq('cell_id', cellId))
    }

    if (error) throw error
  }

  const adoptedPhotos: PersistedBoardSessionV2['photos'] = []
  for (const photo of params.session.photos) {
    const cellId = params.session.cellIds[photo.position] ?? photo.cellId
    let userPhotoId: string | null = null

    if (photo.ownerKind === 'user') {
      const { data } = await admin
        .from('photos')
        .select('id')
        .eq('id', photo.photoId)
        .eq('user_id', params.userId)
        .is('deleted_at', null)
        .maybeSingle<{ id: string }>()
      userPhotoId = data?.id ?? null
    } else {
      const { data } = await admin
        .from('guest_photo_uploads')
        .select('promoted_photo_id')
        .eq('id', photo.photoId)
        .eq('promoted_user_id', params.userId)
        .not('promoted_photo_id', 'is', null)
        .maybeSingle<{ promoted_photo_id: string | null }>()
      userPhotoId = data?.promoted_photo_id ?? null
    }

    if (!userPhotoId) continue

    let { error } = await admin
      .from('board_cells')
      .update({
        cell_id: cellId,
        photo_id: userPhotoId,
        marked_at: now,
        completed_at: now,
        completion_type: 'photo',
      })
      .eq('board_id', boardId)
      .eq('position', photo.position)

    if (error && isMissingColumnError(error, BOARD_CELL_EXTENDED_COLUMNS)) {
      ;({ error } = await admin
        .from('board_cells')
        .update({
          cell_id: cellId,
          photo_id: userPhotoId,
          marked_at: now,
        })
        .eq('board_id', boardId)
        .eq('position', photo.position))
    }

    if (error) throw error

    adoptedPhotos.push({
      ...photo,
      cellId,
      photoId: userPhotoId,
      ownerKind: 'user',
    })
  }

  await admin
    .from('boards')
    .update({ updated_at: now })
    .eq('id', boardId)
    .eq('user_id', params.userId)
    .throwOnError()

  return {
    ...params.session,
    boardId,
    photos: adoptedPhotos,
    updatedAt: now,
  }
}
