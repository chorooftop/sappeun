-- Keep photo uploads pending until Supabase Storage confirms the object exists.

alter table public.boards
  add column if not exists updated_at timestamptz not null default now();

alter table public.photos
  add column if not exists board_id uuid references public.boards(id) on delete cascade,
  add column if not exists position integer check (
    position is null or (position >= 0 and position < 25)
  ),
  add column if not exists cell_id text;

create index if not exists photos_user_board_idx
  on public.photos(user_id, board_id);

create index if not exists boards_user_updated_at_idx
  on public.boards(user_id, updated_at desc);
