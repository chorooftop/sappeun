-- Board history, app nickname, and mission snapshots.

alter table public.profiles
  add column if not exists nickname text check (
    nickname is null or char_length(nickname) <= 10
  ),
  add column if not exists nickname_updated_at timestamptz;

update public.profiles
set
  nickname = left(display_name, 10),
  nickname_updated_at = coalesce(updated_at, now())
where nickname is null
  and display_name is not null
  and btrim(display_name) <> '';

alter table public.board_cells
  add column if not exists mission_label text,
  add column if not exists mission_capture_label text,
  add column if not exists mission_category text,
  add column if not exists mission_caption text,
  add column if not exists mission_hint text,
  add column if not exists mission_icon text,
  add column if not exists mission_snapshot jsonb,
  add column if not exists mission_catalog_version text,
  add column if not exists completed_at timestamptz,
  add column if not exists completion_type text check (
    completion_type is null or completion_type in ('photo', 'no_photo', 'free')
  );

alter table public.photos
  add column if not exists captured_at timestamptz,
  add column if not exists mission_snapshot jsonb;

create index if not exists board_cells_completion_idx
  on public.board_cells(board_id, completed_at)
  where completed_at is not null;

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
left join public.photos p on p.id = bc.photo_id;

grant select on public.shared_board_view to anon, authenticated;
