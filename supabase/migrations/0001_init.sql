-- Sappeun core schema
-- boards / board_cells / photos / shares

create extension if not exists "uuid-ossp";

create type board_mode as enum ('5x5', '3x3', 'standard');

create table public.boards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode board_mode not null,
  seed_recipe text not null,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create index boards_user_id_idx on public.boards(user_id);
create index boards_created_at_idx on public.boards(created_at desc);

create table public.photos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  r2_key text not null unique,
  content_type text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now()
);

create index photos_user_id_idx on public.photos(user_id);

create table public.board_cells (
  board_id uuid not null references public.boards(id) on delete cascade,
  position integer not null check (position >= 0 and position < 25),
  cell_id text not null,
  photo_id uuid references public.photos(id) on delete set null,
  marked_at timestamptz,
  primary key (board_id, position)
);

create index board_cells_photo_id_idx on public.board_cells(photo_id);

create table public.shares (
  board_id uuid primary key references public.boards(id) on delete cascade,
  share_code text not null unique,
  created_at timestamptz not null default now()
);

create index shares_share_code_idx on public.shares(share_code);
