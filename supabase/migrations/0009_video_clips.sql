-- Video clip persistence for clip-only walk missions.
-- Keeps legacy photo/no_photo values during the transition.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'clips-private',
  'clips-private',
  false,
  12582912,
  array['video/mp4', 'video/webm', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.clips (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  board_id uuid not null references public.boards(id) on delete cascade,
  position integer not null check (position >= 0 and position < 25),
  cell_id text not null,
  storage_path text not null unique,
  poster_storage_path text,
  content_type text not null,
  recorder_mime_type text not null,
  codec text,
  size_bytes bigint not null,
  duration_ms integer not null check (duration_ms > 0 and duration_ms <= 3500),
  width integer,
  height integer,
  orientation text check (orientation is null or orientation in ('portrait', 'landscape', 'square')),
  poster_content_type text,
  poster_size_bytes bigint,
  poster_width integer,
  poster_height integer,
  poster_uploaded_at timestamptz,
  uploaded_at timestamptz,
  recorded_at timestamptz,
  deleted_at timestamptz,
  source text not null default 'authenticated'
    check (source in ('authenticated', 'guest_promoted'))
);

create table if not exists public.guest_clip_uploads (
  id uuid primary key default uuid_generate_v4(),
  guest_session_id uuid not null,
  client_board_session_id text not null,
  mode board_mode not null,
  nickname text not null,
  free_position integer not null check (free_position >= 0 and free_position < 25),
  cell_ids text[] not null,
  position integer not null check (position >= 0 and position < 25),
  cell_id text not null,
  storage_path text not null unique,
  poster_storage_path text,
  content_type text not null,
  recorder_mime_type text not null,
  codec text,
  size_bytes bigint not null,
  duration_ms integer not null check (duration_ms > 0 and duration_ms <= 3500),
  width integer,
  height integer,
  orientation text check (orientation is null or orientation in ('portrait', 'landscape', 'square')),
  poster_content_type text,
  poster_size_bytes bigint,
  poster_width integer,
  poster_height integer,
  poster_uploaded_at timestamptz,
  upload_status text not null default 'presigned'
    check (upload_status in ('presigned', 'uploaded', 'failed', 'promoted', 'expired', 'deleted')),
  created_at timestamptz not null default now(),
  uploaded_at timestamptz,
  expires_at timestamptz not null default (now() + interval '3 days'),
  promoted_user_id uuid references auth.users(id) on delete set null,
  promoted_clip_id uuid references public.clips(id) on delete set null,
  promoted_at timestamptz,
  deleted_at timestamptz
);

alter table public.board_cells
  add column if not exists clip_id uuid references public.clips(id) on delete set null;

alter table public.board_cells
  drop constraint if exists board_cells_completion_type_check;

alter table public.board_cells
  add constraint board_cells_completion_type_check
  check (completion_type is null or completion_type in ('photo', 'no_photo', 'clip', 'no_media', 'free'));

create index if not exists clips_user_board_idx
  on public.clips(user_id, board_id);

create index if not exists clips_board_position_idx
  on public.clips(board_id, position);

create index if not exists board_cells_clip_id_idx
  on public.board_cells(clip_id);

create index if not exists guest_clip_uploads_guest_session_idx
  on public.guest_clip_uploads(guest_session_id, created_at desc);

create index if not exists guest_clip_uploads_expires_idx
  on public.guest_clip_uploads(expires_at)
  where upload_status in ('presigned', 'uploaded', 'failed');

alter table public.clips enable row level security;
alter table public.guest_clip_uploads enable row level security;

drop policy if exists "clips_select_own" on public.clips;
create policy "clips_select_own" on public.clips
  for select using (auth.uid() = user_id);

drop policy if exists "clips_insert_own" on public.clips;
create policy "clips_insert_own" on public.clips
  for insert with check (auth.uid() = user_id);

drop policy if exists "clips_update_own" on public.clips;
create policy "clips_update_own" on public.clips
  for update using (auth.uid() = user_id);

drop policy if exists "clips_delete_own" on public.clips;
create policy "clips_delete_own" on public.clips
  for delete using (auth.uid() = user_id);

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
  bc.clip_id
from public.shares s
join public.boards b on b.id = s.board_id
left join public.board_cells bc on bc.board_id = b.id
where b.deleted_at is null;

grant select on public.shared_board_view to anon, authenticated;

notify pgrst, 'reload schema';
