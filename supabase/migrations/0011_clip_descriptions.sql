alter table public.clips
  add column if not exists description text;

alter table public.guest_clip_uploads
  add column if not exists clip_description text;

notify pgrst, 'reload schema';
