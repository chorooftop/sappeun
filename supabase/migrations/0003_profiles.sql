-- User profile metadata for social auth.
-- Auth identity remains in auth.users; app-owned display and onboarding state lives here.

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (
    display_name is null or char_length(display_name) <= 40
  ),
  avatar_url text,
  primary_provider text check (
    primary_provider is null or char_length(primary_provider) <= 64
  ),
  first_login_at timestamptz not null default now(),
  last_seen_at timestamptz,
  first_play_tutorial_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_last_seen_at_idx
  on public.profiles(last_seen_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
