-- Row Level Security for sappeun
-- 본인 데이터만 RUD. shares는 share_code로 공개 read.

alter table public.boards enable row level security;
alter table public.board_cells enable row level security;
alter table public.photos enable row level security;
alter table public.shares enable row level security;

-- boards
create policy "boards_select_own" on public.boards
  for select using (auth.uid() = user_id);

create policy "boards_insert_own" on public.boards
  for insert with check (auth.uid() = user_id);

create policy "boards_update_own" on public.boards
  for update using (auth.uid() = user_id);

create policy "boards_delete_own" on public.boards
  for delete using (auth.uid() = user_id);

-- board_cells (보드 owner 기준)
create policy "board_cells_select_own" on public.board_cells
  for select using (
    exists (
      select 1 from public.boards b
      where b.id = board_cells.board_id and b.user_id = auth.uid()
    )
  );

create policy "board_cells_insert_own" on public.board_cells
  for insert with check (
    exists (
      select 1 from public.boards b
      where b.id = board_cells.board_id and b.user_id = auth.uid()
    )
  );

create policy "board_cells_update_own" on public.board_cells
  for update using (
    exists (
      select 1 from public.boards b
      where b.id = board_cells.board_id and b.user_id = auth.uid()
    )
  );

-- photos
create policy "photos_select_own" on public.photos
  for select using (auth.uid() = user_id);

create policy "photos_insert_own" on public.photos
  for insert with check (auth.uid() = user_id);

create policy "photos_delete_own" on public.photos
  for delete using (auth.uid() = user_id);

-- shares: 공개 read (share_code 노출이 인증 토큰 역할)
create policy "shares_public_select" on public.shares
  for select using (true);

create policy "shares_insert_own" on public.shares
  for insert with check (
    exists (
      select 1 from public.boards b
      where b.id = shares.board_id and b.user_id = auth.uid()
    )
  );

create policy "shares_delete_own" on public.shares
  for delete using (
    exists (
      select 1 from public.boards b
      where b.id = shares.board_id and b.user_id = auth.uid()
    )
  );

-- 공유 카드 공개 조회용 view: shares + boards + board_cells + photos
create or replace view public.shared_board_view as
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
  p.r2_key as photo_r2_key
from public.shares s
join public.boards b on b.id = s.board_id
left join public.board_cells bc on bc.board_id = b.id
left join public.photos p on p.id = bc.photo_id;

grant select on public.shared_board_view to anon, authenticated;
