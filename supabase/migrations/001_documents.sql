-- ============================================================
-- Proline Business OS — Migration 001: Documents
-- ============================================================
-- WHY: The Documents module needs a database table for file
-- metadata (name, type, size, storage path, linked project,
-- notes) and a Supabase Storage bucket for the actual files.
-- No existing table covers file uploads.
-- ============================================================

-- 1. Create storage bucket for documents
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760, -- 10 MB limit
  array['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;

-- 2. Create documents metadata table
create table if not exists documents (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  user_id       uuid not null references auth.users(id) on delete cascade,

  project_id    uuid references projects(id) on delete set null,
  name          text not null,
  file_type     text not null,
  file_size     bigint not null,
  storage_path  text not null,
  notes         text
);

create index if not exists idx_documents_user_id on documents(user_id);
create index if not exists idx_documents_project_id on documents(project_id);

-- 3. RLS for documents table
alter table documents enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'documents' and policyname = 'Users can view own documents') then
    create policy "Users can view own documents" on documents for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'documents' and policyname = 'Users can insert own documents') then
    create policy "Users can insert own documents" on documents for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'documents' and policyname = 'Users can update own documents') then
    create policy "Users can update own documents" on documents for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'documents' and policyname = 'Users can delete own documents') then
    create policy "Users can delete own documents" on documents for delete using (auth.uid() = user_id);
  end if;
end $$;

-- 4. updated_at trigger
drop trigger if exists trg_documents_updated_at on documents;
create trigger trg_documents_updated_at
  before update on documents
  for each row execute function update_updated_at_column();

-- 5. RLS for storage bucket
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view own documents in storage' and tablename = 'objects' and schemaname = 'storage') then
    create policy "Users can view own documents in storage"
      on storage.objects for select
      using (auth.uid() = owner);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can upload own documents' and tablename = 'objects' and schemaname = 'storage') then
    create policy "Users can upload own documents"
      on storage.objects for insert
      with check (auth.uid() = owner);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can update own documents in storage' and tablename = 'objects' and schemaname = 'storage') then
    create policy "Users can update own documents in storage"
      on storage.objects for update
      using (auth.uid() = owner);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can delete own documents in storage' and tablename = 'objects' and schemaname = 'storage') then
    create policy "Users can delete own documents in storage"
      on storage.objects for delete
      using (auth.uid() = owner);
  end if;
end $$;
