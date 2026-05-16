-- App-level signup completion and consent history for social auth.

alter table public.profiles
  add column signup_completed_at timestamptz,
  add column onboarding_completed_at timestamptz,
  add column signup_source text check (
    signup_source is null or signup_source in ('signup', 'login_recovery')
  );

create table public.user_consents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null check (
    consent_type in ('terms', 'privacy')
  ),
  version text not null check (char_length(version) <= 40),
  accepted_at timestamptz not null default now(),
  source text not null check (
    source in ('signup', 'login_recovery')
  ),
  created_at timestamptz not null default now(),
  unique (user_id, consent_type, version)
);

create index user_consents_user_id_idx
  on public.user_consents(user_id, accepted_at desc);

alter table public.user_consents enable row level security;

create policy "user_consents_select_own" on public.user_consents
  for select using (auth.uid() = user_id);

create policy "user_consents_insert_own" on public.user_consents
  for insert with check (auth.uid() = user_id);

create or replace function public.require_current_consents_for_signup()
returns trigger
language plpgsql
as $$
begin
  if new.signup_completed_at is not null
    and old.signup_completed_at is null
    and not (
      exists (
        select 1
        from public.user_consents
        where user_id = new.user_id
          and consent_type = 'terms'
          and version = 'terms-2026-05-16'
      )
      and exists (
        select 1
        from public.user_consents
        where user_id = new.user_id
          and consent_type = 'privacy'
          and version = 'privacy-2026-05-16'
      )
    )
  then
    raise exception
      'Current required consent rows are required before completing signup.';
  end if;

  return new;
end;
$$;

create trigger profiles_require_signup_consents
  before update of signup_completed_at on public.profiles
  for each row
  execute function public.require_current_consents_for_signup();
