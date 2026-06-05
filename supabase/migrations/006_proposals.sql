-- ============================================================
-- Proline Business OS — Migration 006: Proposals
-- ============================================================
-- WHY: Architects need to generate professional proposals
-- (Architecture Design, 3D Elevation, Interior Design,
-- Consultation) linked to clients and projects, and export
-- them as PDFs.
-- ============================================================

create table if not exists proposals (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  user_id           uuid not null references auth.users(id) on delete cascade,

  client_id         uuid not null references clients(id) on delete cascade,
  project_id        uuid references projects(id) on delete set null,
  template          text not null check (template in ('architecture', '3d_elevation', 'interior', 'consultation')),
  proposal_number   text not null,
  fee_amount        numeric(12,2) not null default 0,
  scope_of_work     text not null,
  deliverables      text not null,
  timeline          text not null,
  terms_conditions  text not null,
  status            text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'rejected'))
);

create index if not exists idx_proposals_user_id on proposals(user_id);
create index if not exists idx_proposals_client_id on proposals(client_id);
create index if not exists idx_proposals_project_id on proposals(project_id);

alter table proposals enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'proposals' and policyname = 'Users can view own proposals') then
    create policy "Users can view own proposals" on proposals for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'proposals' and policyname = 'Users can insert own proposals') then
    create policy "Users can insert own proposals" on proposals for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'proposals' and policyname = 'Users can update own proposals') then
    create policy "Users can update own proposals" on proposals for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'proposals' and policyname = 'Users can delete own proposals') then
    create policy "Users can delete own proposals" on proposals for delete using (auth.uid() = user_id);
  end if;
end $$;

drop trigger if exists trg_proposals_updated_at on proposals;
create trigger trg_proposals_updated_at
  before update on proposals
  for each row execute function update_updated_at_column();
