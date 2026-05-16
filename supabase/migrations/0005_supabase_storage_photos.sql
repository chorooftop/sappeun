-- Supabase Storage-backed photo persistence.
-- Replaces the earlier R2-oriented photos.r2_key naming with storage_path.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'photos-private',
  'photos-private',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.photos
  rename column r2_key to storage_path;

alter table public.photos
  add column uploaded_at timestamptz,
  add column deleted_at timestamptz,
  add column source text not null default 'authenticated'
    check (source in ('authenticated', 'guest_promoted'));

alter table public.boards
  add column client_session_id text,
  add column nickname text,
  add column free_position integer check (
    free_position is null or (free_position >= 0 and free_position < 25)
  ),
  add column cell_ids text[];

create unique index boards_user_client_session_uidx
  on public.boards(user_id, client_session_id)
  where client_session_id is not null;

create table public.guest_photo_uploads (
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
  content_type text not null,
  size_bytes bigint not null,
  upload_status text not null default 'presigned'
    check (upload_status in ('presigned', 'uploaded', 'promoted', 'expired', 'deleted')),
  created_at timestamptz not null default now(),
  uploaded_at timestamptz,
  expires_at timestamptz not null default (now() + interval '3 days'),
  promoted_user_id uuid references auth.users(id) on delete set null,
  promoted_photo_id uuid references public.photos(id) on delete set null,
  promoted_at timestamptz,
  deleted_at timestamptz
);

create index guest_photo_uploads_guest_session_idx
  on public.guest_photo_uploads(guest_session_id, created_at desc);

create index guest_photo_uploads_expires_idx
  on public.guest_photo_uploads(expires_at)
  where upload_status in ('presigned', 'uploaded');

alter table public.guest_photo_uploads enable row level security;

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
  p.storage_path as photo_storage_path
from public.shares s
join public.boards b on b.id = s.board_id
left join public.board_cells bc on bc.board_id = b.id
left join public.photos p on p.id = bc.photo_id;

grant select on public.shared_board_view to anon, authenticated;
