import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createMissionSnapshot,
  MISSION_CATALOG_VERSION,
} from '@/lib/bingo/missionSnapshot'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  PHOTO_BUCKET,
  SIGNED_PREVIEW_EXPIRES_SECONDS,
  signedUrlExpiresAt as signedPhotoUrlExpiresAt,
  storageErrorMessage,
  type BoardSnapshotInput,
} from '@/lib/storage/photos'
import {
  CLIP_BUCKET,
  SIGNED_PREVIEW_EXPIRES_SECONDS as CLIP_SIGNED_PREVIEW_EXPIRES_SECONDS,
  signedUrlExpiresAt as signedClipUrlExpiresAt,
  storageErrorMessage as clipStorageErrorMessage,
} from '@/lib/storage/clips'
import { isMissingColumnError } from '@/lib/supabase/errors'
import type { BoardKind, BoardMode } from '@/types/bingo'
import type {
  BoardHistoryCell,
  BoardHistoryDetail,
  BoardHistoryItem,
} from '@/types/board-history'
import type { MissionSnapshot } from '@/types/mission'
import type {
  PersistedBoardSessionV2,
  PersistedBoardSessionV3,
  PersistedBoardSessionV4,
} from '@/types/persisted-board'

interface BoardRow {
  id: string
  user_id: string
  mode: BoardMode
  board_kind?: BoardKind | null
  client_session_id: string | null
  nickname: string | null
  title?: string | null
  description?: string | null
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
  clip_id?: string | null
  marked_at: string | null
  completed_at?: string | null
  completion_type?: 'photo' | 'no_photo' | 'clip' | 'no_media' | 'free' | null
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

interface ClipRow {
  id: string
  user_id: string
  board_id: string
  position: number
  cell_id: string
  storage_path: string
  poster_storage_path: string | null
  duration_ms: number
  uploaded_at: string | null
  recorded_at: string | null
  description?: string | null
  deleted_at: string | null
}

const BOARD_CELL_EXTENDED_COLUMNS = [
  'clip_id',
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

const BOARD_METADATA_COLUMNS = [
  'board_kind',
  'title',
  'description',
] as const

const BOARD_HISTORY_FALLBACK_COLUMNS = [
  'deleted_at',
  ...BOARD_METADATA_COLUMNS,
] as const

const BOARD_CELL_EXTENDED_SELECT =
  'board_id, position, cell_id, photo_id, clip_id, marked_at, completed_at, completion_type, mission_label, mission_capture_label, mission_category, mission_snapshot, mission_catalog_version'

const BOARD_CELL_BASE_SELECT =
  'board_id, position, cell_id, photo_id, marked_at'

const PHOTO_HISTORY_SELECT =
  'id, user_id, board_id, position, cell_id, storage_path, uploaded_at, captured_at, deleted_at'

const PHOTO_HISTORY_BASE_SELECT =
  'id, user_id, board_id, position, cell_id, storage_path, uploaded_at, deleted_at'

const CLIP_HISTORY_SELECT =
  'id, user_id, board_id, position, cell_id, storage_path, poster_storage_path, duration_ms, uploaded_at, recorded_at, description, deleted_at'

const CLIP_HISTORY_BASE_SELECT =
  'id, user_id, board_id, position, cell_id, storage_path, poster_storage_path, duration_ms, uploaded_at, recorded_at, deleted_at'

const BOARD_HISTORY_SELECT =
  'id, user_id, mode, board_kind, client_session_id, nickname, title, description, free_position, cell_ids, created_at, updated_at, ended_at, deleted_at'

const BOARD_HISTORY_BASE_SELECT =
  'id, user_id, mode, client_session_id, nickname, free_position, cell_ids, created_at, updated_at, ended_at'

function boardKindFor(input: BoardSnapshotInput | BoardRow): BoardKind {
  const maybeBoardRow = input as Partial<BoardRow>
  const maybeSnapshot = input as Partial<BoardSnapshotInput>
  return maybeSnapshot.boardKind ?? maybeBoardRow.board_kind ?? 'mission'
}

function boardTitleFor(input: BoardSnapshotInput | BoardRow) {
  if (input.title) return input.title
  return input.nickname ?? '산책'
}

function boardDescriptionFor(input: BoardSnapshotInput | BoardRow) {
  return input.description?.trim() || undefined
}

function makeSeedRecipe(input: BoardSnapshotInput) {
  return JSON.stringify({
    version: 4,
    mode: input.mode,
    boardKind: boardKindFor(input),
    nickname: input.nickname,
    title: boardTitleFor(input),
    description: boardDescriptionFor(input),
    clientSessionId: input.clientBoardSessionId,
    freePosition: input.freePosition,
    cellIds: input.cellIds,
    missionSnapshots: input.missionSnapshots ?? [],
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

function missionSnapshotsById(input: BoardSnapshotInput) {
  return new Map((input.missionSnapshots ?? []).map((snapshot) => [snapshot.id, snapshot]))
}

function boardCellSnapshotPayload(
  boardId: string,
  position: number,
  cellId: string,
  missionSnapshot?: MissionSnapshot,
) {
  const mission = missionSnapshot ?? missionSnapshotFor(cellId)

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
  input: Pick<BoardSnapshotInput, 'cellIds' | 'missionSnapshots'>,
) {
  const snapshots = missionSnapshotsById(input as BoardSnapshotInput)
  const rows = input.cellIds.map((cellId, position) =>
    boardCellSnapshotPayload(boardId, position, cellId, snapshots.get(cellId)),
  )

  if (!rows.length) return

  let { error } = await admin
    .from('board_cells')
    .upsert(rows, { onConflict: 'board_id,position' })

  if (error && isMissingColumnError(error, BOARD_CELL_EXTENDED_COLUMNS)) {
    ;({ error } = await admin
      .from('board_cells')
      .upsert(
        input.cellIds.map((cellId, position) =>
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

async function getHistoryClips(
  admin: SupabaseClient,
  userId: string,
  clipIds: readonly string[],
) {
  let { data, error } = await admin
    .from('clips')
    .select(CLIP_HISTORY_SELECT)
    .eq('user_id', userId)
    .in('id', clipIds)
    .not('uploaded_at', 'is', null)
    .is('deleted_at', null)
    .returns<ClipRow[]>()

  if (error && isMissingColumnError(error, ['description'])) {
    ;({ data, error } = await admin
      .from('clips')
      .select(CLIP_HISTORY_BASE_SELECT)
      .eq('user_id', userId)
      .in('id', clipIds)
      .not('uploaded_at', 'is', null)
      .is('deleted_at', null)
      .returns<ClipRow[]>())
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
    const updatePayload = {
      nickname: input.nickname,
      board_kind: boardKindFor(input),
      title: boardTitleFor(input),
      description: boardDescriptionFor(input) ?? null,
      free_position: input.freePosition,
      cell_ids: input.cellIds,
      seed_recipe: makeSeedRecipe(input),
      updated_at: now,
    }
    let { error: updateError } = await admin
      .from('boards')
      .update(updatePayload)
      .eq('id', existing.id)

    if (updateError && isMissingColumnError(updateError, BOARD_METADATA_COLUMNS)) {
      ;({ error: updateError } = await admin
        .from('boards')
        .update({
          nickname: input.nickname,
          free_position: input.freePosition,
          cell_ids: input.cellIds,
          seed_recipe: makeSeedRecipe(input),
          updated_at: now,
        })
        .eq('id', existing.id))
    }

    if (updateError) throw updateError
    await upsertBoardCellSnapshots(admin, existing.id, input)
    await deleteOtherActiveUserBoards(admin, userId, input.clientBoardSessionId)
    return existing.id
  }

  const insertPayload = {
    user_id: userId,
    mode: input.mode,
    board_kind: boardKindFor(input),
    nickname: input.nickname,
    title: boardTitleFor(input),
    description: boardDescriptionFor(input) ?? null,
    client_session_id: input.clientBoardSessionId,
    free_position: input.freePosition,
    cell_ids: input.cellIds,
    seed_recipe: makeSeedRecipe(input),
    updated_at: now,
  }
  let { data: inserted, error: insertError } = await admin
    .from('boards')
    .insert(insertPayload)
    .select('id')
    .single<Pick<BoardRow, 'id'>>()

  if (insertError && isMissingColumnError(insertError, BOARD_METADATA_COLUMNS)) {
    ;({ data: inserted, error: insertError } = await admin
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
      .single<Pick<BoardRow, 'id'>>())
  }

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
        await upsertBoardCellSnapshots(admin, racedExisting.id, input)
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
  if (!inserted) throw new Error('Board insert did not return an id.')
  await upsertBoardCellSnapshots(admin, inserted.id, input)
  await deleteOtherActiveUserBoards(admin, userId, input.clientBoardSessionId)
  return inserted.id
}

export async function ensureUserBoardFromSession(
  userId: string,
  session:
    | PersistedBoardSessionV2
    | PersistedBoardSessionV3
    | PersistedBoardSessionV4,
) {
  const admin = createAdminClient()
  const boardId = await ensureUserBoard(admin, userId, {
    clientBoardSessionId: session.sessionId,
    mode: session.mode,
    boardKind: session.version === 4 ? session.boardKind : 'mission',
    nickname: session.nickname,
    title: session.version === 4 ? session.title : session.nickname,
    description: session.version === 4 ? session.description : undefined,
    freePosition: session.freePosition,
    cellIds: session.cellIds,
    missionSnapshots: session.version === 4 ? session.missionSnapshots : [],
  })

  return { boardId }
}

async function createPhotoPreviewUrl(admin: SupabaseClient, path: string) {
  const { data, error } = await admin.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, SIGNED_PREVIEW_EXPIRES_SECONDS)

  if (error || !data) throw new Error(storageErrorMessage(error))

  return {
    previewUrl: data.signedUrl,
    previewUrlExpiresAt: signedPhotoUrlExpiresAt(SIGNED_PREVIEW_EXPIRES_SECONDS),
  }
}

async function createClipPreviewUrls(
  admin: SupabaseClient,
  clipPath: string,
  posterPath: string,
) {
  const [clipResult, posterResult] = await Promise.all([
    admin.storage
      .from(CLIP_BUCKET)
      .createSignedUrl(clipPath, CLIP_SIGNED_PREVIEW_EXPIRES_SECONDS),
    admin.storage
      .from(CLIP_BUCKET)
      .createSignedUrl(posterPath, CLIP_SIGNED_PREVIEW_EXPIRES_SECONDS),
  ])

  if (clipResult.error || !clipResult.data) {
    throw new Error(clipStorageErrorMessage(clipResult.error))
  }
  if (posterResult.error || !posterResult.data) {
    throw new Error(clipStorageErrorMessage(posterResult.error))
  }

  return {
    clipUrl: clipResult.data.signedUrl,
    clipUrlExpiresAt: signedClipUrlExpiresAt(
      CLIP_SIGNED_PREVIEW_EXPIRES_SECONDS,
    ),
    posterUrl: posterResult.data.signedUrl,
    posterUrlExpiresAt: signedClipUrlExpiresAt(
      CLIP_SIGNED_PREVIEW_EXPIRES_SECONDS,
    ),
  }
}

function boardUpdatedAt(board: BoardRow) {
  return board.updated_at ?? board.created_at
}

function isRestorableBoardMode(mode: BoardMode | undefined): mode is '5x5' | '3x3' {
  return mode === '5x5' || mode === '3x3'
}

function toHistoryItem(
  board: BoardRow,
  cells: readonly BoardCellRow[],
): BoardHistoryItem {
  const completedPositions = new Set<number>()
  let photoCount = 0
  let clipCount = 0

  for (const cell of cells) {
    if (cell.photo_id) photoCount += 1
    if (cell.clip_id) clipCount += 1
    if (cell.clip_id || cell.photo_id || cell.marked_at || cell.completed_at) {
      completedPositions.add(cell.position)
    }
  }

  return {
    id: board.id,
    mode: board.mode,
    boardKind: boardKindFor(board),
    nickname: board.nickname ?? '산책',
    title: boardTitleFor(board),
    description: boardDescriptionFor(board),
    createdAt: board.created_at,
    updatedAt: boardUpdatedAt(board),
    endedAt: board.ended_at,
    photoCount,
    clipCount,
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

  if (boardError && isMissingColumnError(boardError, BOARD_HISTORY_FALLBACK_COLUMNS)) {
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
  clip: BoardHistoryCell['clip'],
): BoardHistoryCell {
  return {
    position: row.position,
    cellId: row.cell_id,
    mission: row.mission_snapshot ?? missionSnapshotFor(row.cell_id),
    markedAt: row.marked_at,
    completedAt: row.completed_at ?? null,
    completionType: row.completion_type ?? null,
    photo,
    clip,
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

  if (boardError && isMissingColumnError(boardError, BOARD_HISTORY_FALLBACK_COLUMNS)) {
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
    await upsertBoardCellSnapshots(admin, board.id, {
      cellIds: board.cell_ids,
      missionSnapshots: [],
    })
    cells = await getBoardCellsForBoard(admin, board.id)
  }

  const photoIds = cells
    .map((cell) => cell.photo_id)
    .filter((photoId): photoId is string => Boolean(photoId))
  const photosById = new Map<string, PhotoRow>()
  const clipIds = cells
    .map((cell) => cell.clip_id)
    .filter((clipId): clipId is string => Boolean(clipId))
  const clipsById = new Map<string, ClipRow>()

  if (photoIds.length) {
    const photos = await getHistoryPhotos(admin, userId, photoIds)
    photos?.forEach((photo) => photosById.set(photo.id, photo))
  }

  if (clipIds.length) {
    const clips = await getHistoryClips(admin, userId, clipIds)
    clips.forEach((clip) => clipsById.set(clip.id, clip))
  }

  const detailCells: BoardHistoryCell[] = []
  for (const cell of cells) {
    let photo: BoardHistoryCell['photo'] = null
    let clip: BoardHistoryCell['clip'] = null
    if (cell.photo_id) {
      const row = photosById.get(cell.photo_id)
      if (row) {
        photo = {
          photoId: row.id,
          uploadedAt: row.uploaded_at,
          capturedAt: row.captured_at ?? row.uploaded_at,
          ...(await createPhotoPreviewUrl(admin, row.storage_path)),
        }
      }
    }
    if (cell.clip_id) {
      const row = clipsById.get(cell.clip_id)
      if (row?.poster_storage_path) {
        clip = {
          clipId: row.id,
          uploadedAt: row.uploaded_at,
          recordedAt: row.recorded_at ?? row.uploaded_at,
          durationMs: row.duration_ms,
          description: row.description ?? undefined,
          ...(await createClipPreviewUrls(
            admin,
            row.storage_path,
            row.poster_storage_path,
          )),
        }
      }
    }
    detailCells.push(detailCellFromRow(cell, photo, clip))
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
      completion_type: params.marked ? 'no_media' : null,
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
        clip_id: null,
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

export async function getLatestUserBoardSession(
  userId: string,
): Promise<PersistedBoardSessionV4 | null> {
  const admin = createAdminClient()
  let { data: board, error: boardError } = await admin
    .from('boards')
    .select(BOARD_HISTORY_SELECT)
    .eq('user_id', userId)
    .is('ended_at', null)
    .is('deleted_at', null)
    .not('client_session_id', 'is', null)
    .not('cell_ids', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle<BoardRow>()

  if (boardError && isMissingColumnError(boardError, BOARD_HISTORY_FALLBACK_COLUMNS)) {
    ;({ data: board, error: boardError } = await admin
      .from('boards')
      .select(BOARD_HISTORY_BASE_SELECT)
      .eq('user_id', userId)
      .is('ended_at', null)
      .not('client_session_id', 'is', null)
      .not('cell_ids', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle<BoardRow>())
  }

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

  const cells = await getBoardCellsForBoard(admin, board.id)
  const clipIds = cells
    .map((cell) => cell.clip_id)
    .filter((clipId): clipId is string => Boolean(clipId))
  const clipsById = new Map<string, ClipRow>()

  if (clipIds.length) {
    const clips = await getHistoryClips(admin, userId, clipIds)
    clips.forEach((clip) => clipsById.set(clip.id, clip))
  }

  const persistedClips: PersistedBoardSessionV3['clips'] = []
  const markedPositions = new Set<number>()
  const snapshotsByPosition = new Map(
    cells.map((cell) => [
      cell.position,
      cell.mission_snapshot ?? missionSnapshotFor(cell.cell_id),
    ]),
  )

  for (const cell of cells) {
    if (cell.marked_at && !cell.clip_id) markedPositions.add(cell.position)
    if (!cell.clip_id) continue

    const clip = clipsById.get(cell.clip_id)
    if (!clip?.poster_storage_path) continue
    const preview = await createClipPreviewUrls(
      admin,
      clip.storage_path,
      clip.poster_storage_path,
    )

    persistedClips.push({
      position: cell.position,
      cellId: cell.cell_id,
      clipId: clip.id,
      ownerKind: 'user',
      clipUrl: preview.clipUrl,
      clipUrlExpiresAt: preview.clipUrlExpiresAt,
      posterUrl: preview.posterUrl,
      posterUrlExpiresAt: preview.posterUrlExpiresAt,
      durationMs: clip.duration_ms,
      description: clip.description ?? undefined,
      uploadStatus: 'uploaded',
    })
  }

  return {
    version: 4,
    boardId: board.id,
    sessionId: board.client_session_id,
    mode: board.mode,
    boardKind: boardKindFor(board),
    nickname: board.nickname,
    title: boardTitleFor(board),
    description: boardDescriptionFor(board),
    createdAt: board.created_at ?? new Date().toISOString(),
    updatedAt: board.updated_at ?? board.created_at ?? new Date().toISOString(),
    freePosition: board.free_position,
    cellIds: board.cell_ids,
    missionSnapshots: board.cell_ids.map((cellId, position) =>
      snapshotsByPosition.get(position) ?? missionSnapshotFor(cellId),
    ),
    markedPositions: Array.from(markedPositions).sort((a, b) => a - b),
    clips: persistedClips,
    endedAt: null,
  }
}

export async function adoptGuestBoardSession(params: {
  userId: string
  session:
    | PersistedBoardSessionV2
    | PersistedBoardSessionV3
    | PersistedBoardSessionV4
}): Promise<
  PersistedBoardSessionV2 | PersistedBoardSessionV3 | PersistedBoardSessionV4
> {
  const admin = createAdminClient()
  const boardId = await ensureUserBoard(admin, params.userId, {
    clientBoardSessionId: params.session.sessionId,
    mode: params.session.mode,
    boardKind: params.session.version === 4 ? params.session.boardKind : 'mission',
    nickname: params.session.nickname,
    title: params.session.version === 4
      ? params.session.title
      : params.session.nickname,
    description: params.session.version === 4
      ? params.session.description
      : undefined,
    freePosition: params.session.freePosition,
    cellIds: params.session.cellIds,
    missionSnapshots: params.session.version === 4
      ? params.session.missionSnapshots
      : [],
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
        completion_type: 'no_media',
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
  const sessionPhotos = params.session.version === 2 ? params.session.photos : []
  for (const photo of sessionPhotos) {
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

  const adoptedClips: PersistedBoardSessionV3['clips'] = []
  const sessionClips =
    params.session.version === 3 || params.session.version === 4
      ? params.session.clips
      : []
  for (const clip of sessionClips) {
    const cellId = params.session.cellIds[clip.position] ?? clip.cellId
    let userClipId: string | null = null

    if (clip.ownerKind === 'user') {
      const { data } = await admin
        .from('clips')
        .select('id')
        .eq('id', clip.clipId)
        .eq('user_id', params.userId)
        .is('deleted_at', null)
        .maybeSingle<{ id: string }>()
      userClipId = data?.id ?? null
    } else {
      const { data } = await admin
        .from('guest_clip_uploads')
        .select('promoted_clip_id')
        .eq('id', clip.clipId)
        .eq('promoted_user_id', params.userId)
        .not('promoted_clip_id', 'is', null)
        .maybeSingle<{ promoted_clip_id: string | null }>()
      userClipId = data?.promoted_clip_id ?? null
    }

    if (!userClipId) continue

    await admin
      .from('board_cells')
      .update({
        cell_id: cellId,
        clip_id: userClipId,
        marked_at: now,
        completed_at: now,
        completion_type: 'clip',
      })
      .eq('board_id', boardId)
      .eq('position', clip.position)
      .throwOnError()

    adoptedClips.push({
      ...clip,
      cellId,
      clipId: userClipId,
      ownerKind: 'user',
    })
  }

  await admin
    .from('boards')
    .update({ updated_at: now })
    .eq('id', boardId)
    .eq('user_id', params.userId)
    .throwOnError()

  if (params.session.version === 3 || params.session.version === 4) {
    return {
      ...params.session,
      boardId,
      clips: adoptedClips,
      updatedAt: now,
    }
  }

  return {
    ...params.session,
    boardId,
    photos: adoptedPhotos,
    updatedAt: now,
  }
}
