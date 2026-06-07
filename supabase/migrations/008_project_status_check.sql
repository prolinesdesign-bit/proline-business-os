-- ============================================================
-- Migration 008: Relax projects.status CHECK constraint to
-- accept all 8 stages used by the Operations View workflow
-- ============================================================

alter table projects drop constraint if exists projects_status_check;

-- Migrate existing rows from old status values to new ones
update projects set status = 'lead' where status = 'active';
update projects set status = 'delivered' where status = 'completed';
update projects set status = 'discussed' where status = 'on_hold';
update projects set status = 'cancelled' where status = 'cancelled';

alter table projects add constraint projects_status_check
  check (status in (
    'lead',
    'communicated',
    'advance_paid',
    'prelim_model',
    'discussed',
    'final_render',
    'balance_paid',
    'delivered',
    'cancelled'
  ));

-- Update the default so new rows without an explicit status get 'lead'
alter table projects alter column status set default 'lead';
