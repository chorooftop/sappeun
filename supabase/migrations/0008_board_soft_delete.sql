-- Separate discarded in-progress missions from completed mission history.

alter table public.boards
  add column if not exists deleted_at timestamptz;

drop index if exists public.boards_user_client_session_uidx;

create unique index boards_user_client_session_uidx
  on public.boards(user_id, client_session_id)
  where client_session_id is not null
    and deleted_at is null;

create index if not exists boards_active_user_updated_idx
  on public.boards(user_id, updated_at desc)
  where ended_at is null
    and deleted_at is null
    and client_session_id is not null;

create index if not exists boards_history_user_updated_idx
  on public.boards(user_id, updated_at desc)
  where deleted_at is null
    and client_session_id is not null;

drop view if exists public.shared_board_view;

create view public.shared_board_view as
select
  s.share_code,
  s.created_at as shared_at,
  b.id as board_id,
  b.mode,
  b.created_at as board_created_at,
  b.ended_at as board_ended_at,
  bc.position,
  bc.cell_id,
  bc.marked_at,
  bc.completed_at,
  bc.completion_type,
  bc.mission_label,
  bc.mission_capture_label,
  bc.mission_category,
  bc.mission_snapshot,
  p.storage_path as photo_storage_path
from public.shares s
join public.boards b on b.id = s.board_id
left join public.board_cells bc on bc.board_id = b.id
left join public.photos p on p.id = bc.photo_id
where b.deleted_at is null;

grant select on public.shared_board_view to anon, authenticated;
