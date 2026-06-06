-- ============================================================
-- Migration 007: Add project_type, location to projects;
--                address, source to clients
-- ============================================================

do $$ begin
  if not exists (select 1 from information_schema.columns where table_name = 'projects' and column_name = 'project_type') then
    alter table projects add column project_type text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'projects' and column_name = 'location') then
    alter table projects add column location text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'projects' and column_name = 'expected_timeline') then
    alter table projects add column expected_timeline text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'projects' and column_name = 'expected_payment_date') then
    alter table projects add column expected_payment_date date;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'projects' and column_name = 'location_url') then
    alter table projects add column location_url text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'projects' and column_name = 'revision_count') then
    alter table projects add column revision_count integer not null default 0;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from information_schema.columns where table_name = 'clients' and column_name = 'address') then
    alter table clients add column address text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'clients' and column_name = 'source') then
    alter table clients add column source text;
  end if;
end $$;
