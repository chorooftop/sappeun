-- Custom bingo boards store user-authored board and cell copy.

alter table public.boards
  add column if not exists board_kind text not null default 'mission'
    check (board_kind in ('mission', 'custom')),
  add column if not exists title text,
  add column if not exists description text;

alter table public.guest_clip_uploads
  add column if not exists board_kind text not null default 'mission'
    check (board_kind in ('mission', 'custom')),
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists mission_snapshots jsonb;

update public.boards
set title = coalesce(title, nickname, '산책')
where title is null;

update public.guest_clip_uploads
set title = coalesce(title, nickname)
where title is null;

drop view if exists public.shared_board_view;

create view public.shared_board_view as
select
  s.share_code,
  s.created_at as shared_at,
  b.id as board_id,
  b.mode,
  b.board_kind,
  b.title,
  b.description,
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
  bc.clip_id
from public.shares s
join public.boards b on b.id = s.board_id
left join public.board_cells bc on bc.board_id = b.id
where b.deleted_at is null;

grant select on public.shared_board_view to anon, authenticated;

notify pgrst, 'reload schema';
