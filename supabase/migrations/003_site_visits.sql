-- ============================================================
-- Proline Business OS — Migration 003: Site Visits
-- ============================================================
-- WHY: The Site Visit Tracker needs a table to log site visits
-- with location, cost, status, next action, and optional photos.
-- ============================================================

create table if not exists site_visits (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  user_id       uuid not null references auth.users(id) on delete cascade,

  project_id    uuid references projects(id) on delete set null,
  client_id     uuid references clients(id) on delete set null,
  visit_date    date not null,
  location      text,
  notes         text,
  travel_cost   numeric(12,2) not null default 0,
  site_status   text not null default 'pending'
                check (site_status in ('pending', 'in_progress', 'completed', 'cancelled')),
  next_action   text,
  photo_urls    jsonb not null default '[]'::jsonb
);

create index if not exists idx_site_visits_user_id on site_visits(user_id);
create index if not exists idx_site_visits_project_id on site_visits(project_id);
create index if not exists idx_site_visits_client_id on site_visits(client_id);
create index if not exists idx_site_visits_visit_date on site_visits(visit_date);

alter table site_visits enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'site_visits' and policyname = 'Users can view own site_visits') then
    create policy "Users can view own site_visits" on site_visits for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'site_visits' and policyname = 'Users can insert own site_visits') then
    create policy "Users can insert own site_visits" on site_visits for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'site_visits' and policyname = 'Users can update own site_visits') then
    create policy "Users can update own site_visits" on site_visits for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'site_visits' and policyname = 'Users can delete own site_visits') then
    create policy "Users can delete own site_visits" on site_visits for delete using (auth.uid() = user_id);
  end if;
end $$;

drop trigger if exists trg_site_visits_updated_at on site_visits;
create trigger trg_site_visits_updated_at
  before update on site_visits
  for each row execute function update_updated_at_column();
