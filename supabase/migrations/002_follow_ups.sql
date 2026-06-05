-- ============================================================
-- Proline Business OS — Migration 002: Follow-ups
-- ============================================================
-- WHY: The Follow-ups module needs a table to track client
-- follow-up dates, statuses, and notes. No existing table
-- covers client outreach scheduling.
-- ============================================================

create table if not exists follow_ups (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  user_id               uuid not null references auth.users(id) on delete cascade,

  client_id             uuid not null references clients(id) on delete cascade,
  next_follow_up_date   date,
  last_follow_up_date   date,
  notes                 text,
  status                text not null default 'pending'
                        check (status in ('pending', 'contacted', 'waiting_client', 'closed'))
);

create index if not exists idx_follow_ups_user_id on follow_ups(user_id);
create index if not exists idx_follow_ups_client_id on follow_ups(client_id);
create index if not exists idx_follow_ups_next_date on follow_ups(next_follow_up_date);
create index if not exists idx_follow_ups_status on follow_ups(status);

alter table follow_ups enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'follow_ups' and policyname = 'Users can view own follow_ups') then
    create policy "Users can view own follow_ups" on follow_ups for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'follow_ups' and policyname = 'Users can insert own follow_ups') then
    create policy "Users can insert own follow_ups" on follow_ups for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'follow_ups' and policyname = 'Users can update own follow_ups') then
    create policy "Users can update own follow_ups" on follow_ups for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'follow_ups' and policyname = 'Users can delete own follow_ups') then
    create policy "Users can delete own follow_ups" on follow_ups for delete using (auth.uid() = user_id);
  end if;
end $$;

drop trigger if exists trg_follow_ups_updated_at on follow_ups;
create trigger trg_follow_ups_updated_at
  before update on follow_ups
  for each row execute function update_updated_at_column();
