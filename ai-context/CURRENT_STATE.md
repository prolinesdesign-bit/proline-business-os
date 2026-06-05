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
- **Follow-ups module** — CRUD, client-linked, next/last follow-up dates, notes, status (Pending/Contacted/Waiting Client/Closed), filter by status, expandable follow-up history on client cards, WhatsApp integration with 4 message templates (Payment Reminder/Project Update/Meeting Reminder/Custom), auto-generates `wa.me` links
- **Dashboard follow-up widgets** — Follow-ups Due Today (count), Overdue Follow-ups list, Upcoming Follow-ups list
- **Business Analytics module** — 6 metric cards (Total Revenue, Total Expenses, Net Profit, Outstanding Balance, Avg Project Value, Collection Rate), 6 charts (monthly Revenue/Expenses/Profit bar charts, Project Status Distribution pie chart, Revenue by Client horizontal bar chart, Revenue by Project Status bar chart), 4 insight cards (Top Client, Top Project Status, Overdue Projects Count, Pending Collection Amount)
- **Site Visit Tracker module** — Migration `003_site_visits.sql`. CRUD, linked to project/client, visit date, location, lat/lng coordinates, notes, travel cost, status, next action, photo upload to Supabase Storage, photo gallery with preview lightbox, Google Maps navigation button, calendar integration (purple V chips), dashboard widgets (count + upcoming list), project card photo count
- **Proposals module** — Migration `006_proposals.sql`. 4 templates (Architecture Design, 3D Elevation, Interior Design, Consultation). CRUD, client/project select, fee, scope, deliverables, timeline, terms. Status workflow (draft → sent → accepted/rejected). Professional PDF preview with html2canvas + jsPDF download. Nav link and route.
- **Navigation redesign** — Shared `AppLayout` wrapper (`src/components/layout/`) with collapsible sidebar, mobile slide-out drawer, SVG icons for all nav items, active page highlighting (blue-50 bg), breadcrumb trail, floating quick action FAB (New Project/Client/Payment/Expense). Nav bar extracted from 14 pages into a single `NavBar` component. Logout moved to sidebar footer. 

## Not Started

(none)

## Blocked

- `whatsapp` column does not exist in live Supabase `clients` table — needs `ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp text;` run in Supabase SQL Editor
- Supabase Auth email confirmation is ON — turn off in Dashboard for dev, or configure SMTP
- `documents` table and `documents` storage bucket need to be created by running `supabase/migrations/001_documents.sql`
- `follow_ups` table needs `supabase/migrations/002_follow_ups.sql`
- `site_visits` table needs `supabase/migrations/003_site_visits.sql`
- `site_photos` storage bucket needs `supabase/migrations/004_site_visit_photos.sql`
- `site_visits` coordinates columns need `supabase/migrations/005_site_visit_coordinates.sql`
- `proposals` table needs `supabase/migrations/006_proposals.sql`
