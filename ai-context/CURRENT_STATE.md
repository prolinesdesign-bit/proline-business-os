# Current State

## Completed

- React + Vite + TypeScript project scaffolded
- Tailwind CSS v4 configured
- Git + GitHub repository set up
- Supabase project connected
- Environment variables configured
- Supabase Auth (email/password, Google OAuth)
- Protected routes with redirect to login
- Session persistence with `onAuthStateChange`
- **Projects module** — CRUD, search, stage dropdown, value, client name, dates, notes, document count per project, View Documents button
- **Client CRM module** — CRUD, search, name, phone, whatsapp, email, location, notes, project counts, total project value, last updated date
- **Payments module** — CRUD, linked to projects, date, amount, notes, per-project summaries with value / total paid / balance due (calculated dynamically)
- **Expenses module** — CRUD, date, amount, category (Software/Internet/Travel/Site Visit/Printing/Marketing/Salary/Freelancers/Miscellaneous), description, optional linked project, monthly/yearly totals, category breakdown
- **Dashboard** — Home page, KPI cards, monthly Revenue/Expenses/Profit bar charts, Target Progress, Overdue Projects, Upcoming Due Dates, Recent Payments/Expenses widgets
- **Calendar module** — Month view with project start/due dates, color-coded by stage, overdue highlighting, this-week ring, day detail popup
- **Targets module** — CRUD for revenue targets, this-month progress with daily needed amount, progress bar, overdue/missed tracking
- **Tasks module** — CRUD, title, description, priority (low/medium/high/urgent), due date, link to project, inline status dropdown for quick status changes, filter by project ID
- **Documents module** — Upload (PDF/JPG/PNG/DOCX, 10MB limit), preview modal (PDF via iframe, images inline, DOCX shows download prompt), download button via signed URL, delete, link to project, filter by project, Supabase Storage with RLS, document metadata table with migration SQL

- Tagged: `v0.8-documents`

## Not Started

(none)

## Blocked

- `whatsapp` column does not exist in live Supabase `clients` table — needs `ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp text;` run in Supabase SQL Editor
- Supabase Auth email confirmation is ON — turn off in Dashboard for dev, or configure SMTP
- `documents` table and `documents` storage bucket need to be created by running `supabase/migrations/001_documents.sql`
