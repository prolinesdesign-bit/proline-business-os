-- ============================================================
-- Proline Business OS — Schema
-- ============================================================

-- 1. updated_at trigger (shared by all tables)
create extension if not exists "pgcrypto";

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- clients
-- ============================================================
create table clients (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  user_id     uuid not null references auth.users(id) on delete cascade,

  name        text not null,
  email       text,
  phone       text,
  company     text,
  notes       text
);

create index idx_clients_user_id on clients(user_id);

alter table clients enable row level security;

create policy "Users can view own clients"
  on clients for select
  using (auth.uid() = user_id);

create policy "Users can insert own clients"
  on clients for insert
  with check (auth.uid() = user_id);

create policy "Users can update own clients"
  on clients for update
  using (auth.uid() = user_id);

create policy "Users can delete own clients"
  on clients for delete
  using (auth.uid() = user_id);

create trigger trg_clients_updated_at
  before update on clients
  for each row execute function update_updated_at_column();

-- ============================================================
-- projects
-- ============================================================
create table projects (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  user_id     uuid not null references auth.users(id) on delete cascade,

  name        text not null,
  description text,
  status      text not null default 'active'
              check (status in ('active', 'completed', 'on_hold', 'cancelled')),
  client_id   uuid references clients(id) on delete set null,
  start_date  date,
  end_date    date,
  budget      numeric(12, 2)
);

create index idx_projects_user_id on projects(user_id);
create index idx_projects_client_id on projects(client_id);

alter table projects enable row level security;

create policy "Users can view own projects"
  on projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on projects for delete
  using (auth.uid() = user_id);

create trigger trg_projects_updated_at
  before update on projects
  for each row execute function update_updated_at_column();

-- ============================================================
-- tasks
-- ============================================================
create table tasks (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  user_id     uuid not null references auth.users(id) on delete cascade,

  title       text not null,
  description text,
  status      text not null default 'todo'
              check (status in ('todo', 'in_progress', 'done', 'cancelled')),
  priority    text not null default 'medium'
              check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date    date,
  project_id  uuid references projects(id) on delete cascade
);

create index idx_tasks_user_id on tasks(user_id);
create index idx_tasks_project_id on tasks(project_id);

alter table tasks enable row level security;

create policy "Users can view own tasks"
  on tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on tasks for delete
  using (auth.uid() = user_id);

create trigger trg_tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at_column();

-- ============================================================
-- payments
-- ============================================================
create table payments (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  user_id       uuid not null references auth.users(id) on delete cascade,

  client_id     uuid not null references clients(id) on delete cascade,
  project_id    uuid references projects(id) on delete set null,
  amount        numeric(12, 2) not null,
  currency      text not null default 'USD',
  payment_date  date not null default current_date,
  method        text not null default 'bank_transfer'
                check (method in ('credit_card', 'bank_transfer', 'cash', 'paypal', 'stripe', 'other')),
  status        text not null default 'completed'
                check (status in ('pending', 'completed', 'refunded', 'failed')),
  description   text
);

create index idx_payments_user_id on payments(user_id);
create index idx_payments_client_id on payments(client_id);
create index idx_payments_project_id on payments(project_id);

alter table payments enable row level security;

create policy "Users can view own payments"
  on payments for select
  using (auth.uid() = user_id);

create policy "Users can insert own payments"
  on payments for insert
  with check (auth.uid() = user_id);

create policy "Users can update own payments"
  on payments for update
  using (auth.uid() = user_id);

create policy "Users can delete own payments"
  on payments for delete
  using (auth.uid() = user_id);

create trigger trg_payments_updated_at
  before update on payments
  for each row execute function update_updated_at_column();

-- ============================================================
-- expenses
-- ============================================================
create table expenses (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  user_id       uuid not null references auth.users(id) on delete cascade,

  project_id    uuid references projects(id) on delete set null,
  amount        numeric(12, 2) not null,
  currency      text not null default 'USD',
  expense_date  date not null default current_date,
  category      text not null default 'other'
                check (category in ('travel', 'materials', 'software', 'office', 'utilities', 'contractor', 'other')),
  description   text,
  receipt_url   text
);

create index idx_expenses_user_id on expenses(user_id);
create index idx_expenses_project_id on expenses(project_id);

alter table expenses enable row level security;

create policy "Users can view own expenses"
  on expenses for select
  using (auth.uid() = user_id);

create policy "Users can insert own expenses"
  on expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own expenses"
  on expenses for update
  using (auth.uid() = user_id);

create policy "Users can delete own expenses"
  on expenses for delete
  using (auth.uid() = user_id);

create trigger trg_expenses_updated_at
  before update on expenses
  for each row execute function update_updated_at_column();

-- ============================================================
-- targets
-- ============================================================
create table targets (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  user_id       uuid not null references auth.users(id) on delete cascade,

  title         text not null,
  description   text,
  target_type   text not null
                check (target_type in ('revenue', 'leads', 'projects', 'custom')),
  target_value  numeric(12, 2) not null,
  current_value numeric(12, 2) not null default 0,
  start_date    date not null,
  end_date      date not null,
  status        text not null default 'active'
                check (status in ('active', 'achieved', 'missed'))
);

create index idx_targets_user_id on targets(user_id);

alter table targets enable row level security;

create policy "Users can view own targets"
  on targets for select
  using (auth.uid() = user_id);

create policy "Users can insert own targets"
  on targets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own targets"
  on targets for update
  using (auth.uid() = user_id);

create policy "Users can delete own targets"
  on targets for delete
  using (auth.uid() = user_id);

create trigger trg_targets_updated_at
  before update on targets
  for each row execute function update_updated_at_column();
