-- ============================================================
-- Proline Business OS — Migration 004: Site Visit Photos Storage
-- ============================================================
-- WHY: Site visits can have photos uploaded to a dedicated
-- Supabase Storage bucket. This migration creates the bucket
-- and sets up RLS so users can only access their own photos.
-- ============================================================

-- Create the storage bucket (idempotent)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site_photos',
  'site_photos',
  false,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- RLS: only authenticated users can access their own folder
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'Users can view own site_photos') then
    create policy "Users can view own site_photos"
      on storage.objects for select
      using (bucket_id = 'site_photos' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'Users can upload own site_photos') then
    create policy "Users can upload own site_photos"
      on storage.objects for insert
      with check (bucket_id = 'site_photos' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'Users can delete own site_photos') then
    create policy "Users can delete own site_photos"
      on storage.objects for delete
      using (bucket_id = 'site_photos' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
end $$;
