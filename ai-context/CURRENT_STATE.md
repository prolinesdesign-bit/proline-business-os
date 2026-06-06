# Current State

## Completed

### Core Platform
- React + Vite + TypeScript project scaffolded
- Tailwind CSS v4 configured
- Git + GitHub repository set up
- Supabase project connected, environment variables configured
- Supabase Auth (email/password, Google OAuth)
- Protected routes with redirect to login
- Session persistence with `onAuthStateChange`

### Design System (shadcn/ui)
- CSS color tokens via Tailwind v4 `@theme`
- UI primitives: Button (8 variants), Card (6 parts), Badge (8 variants), Table (6 parts), Input, Select, Textarea, Label
- `cn()` utility (`tailwind-merge` + `clsx`)
- Design system applied across all pages, forms, cards, display components

### Business Modules
- **Projects module** — CRUD, search, stage dropdown, value, client name, dates, notes, document/site-photo counts, WhatsApp button
- **Client CRM module** — CRUD, search, name, phone, WhatsApp, email, location, notes, project counts, total project value
- **Payments module** — CRUD, linked to projects, per-project summaries (value/total paid/balance due), auto client resolution
- **Expenses module** — CRUD, 9 categories, monthly/yearly totals, category breakdown
- **Targets module** — CRUD, monthly revenue targets, daily needed, progress bar, overdue/missed tracking
- **Tasks module** — CRUD, priority (low/medium/high/urgent), due date, project filter, inline status dropdown
- **Documents module** — Upload (PDF/JPG/PNG/DOCX, 10MB), preview modal, signed URL download, project filter
- **Follow-ups module** — CRUD, client-linked, status workflow, WhatsApp integration with 4 templates
- **Site Visit Tracker** — CRUD, GPS geolocation, photo upload/gallery/lightbox, Google Maps navigation, travel costs
- **Proposals module** — 4 templates, auto-generated proposal number, status workflow, PDF download, WhatsApp share

### Dashboard & Analytics
- **Dashboard** — 8 KPI cards, 3 monthly bar charts, target progress, overdue projects, upcoming due dates. Operational widgets removed (site visits, follow-ups, recent payments/expenses).
- **Calendar** — Month view + List view toggle. List view shows chronological events grouped by date with type badges and color coding.
- **Analytics** — 6 metric cards, 6 charts, 4 insight cards

### Navigation & UX
- **Navigation redesign** — Shared AppLayout with collapsible sidebar, mobile slide-out drawer, SVG icons, breadcrumbs, active page highlighting, quick actions FAB
- **Toast notifications** — `sonner` toasts on all CRUD operations
- **Skeleton loaders** — CardSkeleton, TableSkeleton, KPISkeleton
- **Empty states** — EmptyState component with icon + title + description + CTA
- **Page transitions** — Framer Motion fade + slide
- **Hover states** — Card lift effects across all list pages

### Mobile Improvements
- Increased tap targets (py-3) in NavBar and QuickActions
- Responsive calendar cells on mobile
- Form grids collapse to single column on mobile
- Table pages (Payments, Expenses, Documents) render as mobile card views

### Operations View (Default)
- Dense spreadsheet-like project table with 10 columns (Project, Client, WhatsApp#, Stage, Amount, Advance Paid, Balance, Timeline, Notes, Actions)
- Stage dropdown with 8 project lifecycle stages (Lead → Communicated → Advance Paid → Prelim Model → Discussed → Final Render → Balance Paid → Delivered), inline editable with save-toast
- **Amount** (project.budget) — inline editable number input, auto-saves on blur/Enter
- **Advance Paid** (from payments) — inline editable number input, creates completed payment on save
- **Balance** (computed = Amount − Advance Paid) — read-only display
- **Timeline** (start/end dates) — inline editable date inputs, auto-saves on blur
- **Notes** (project.description) — inline editable text input, auto-saves on blur/Enter
- WhatsApp Number column showing last 10 digits + "Message" button per row
- All inline edits persist immediately to DB; parent state refreshed via `onUpdate` callback (no snap-back)
- WhatsApp: `generateWhatsAppUrl` auto-prepends +91 country code for 10-digit Indian numbers
- Edit/Del buttons always visible (quick actions)
- Cards/Ops/Calendar toggle available

### Operations View Toolbar
- Stage filter dropdown (All Stages + 8 stage options)
- Sort dropdown (Project Name, Client Name, Deadline, Amount) with asc/desc toggle
- Period quick filters: Current Month (default), Last Month, Last 6 Months, This Year, Custom
- Custom date range selector (appears when Custom is selected)
- Period filter scoped to Operations View only — Cards/Calendar always show all projects
- Default: shows only Current Month projects when page opens

### Phase 1 — Productization
- Operations View is now the default project view
- **Project Page** at `/project/:id` — summary cards (Budget, Start, Due), notes display, navigation to related modules
- **Client Page** at `/client/:id` — revenue/outstanding/projects KPIs, project list with links, WhatsApp action
- Project and Client names are clickable links in Operations View and Card views
- Dashboard decluttered to executive overview only

## In Progress
- Productization Phase 2 (Project/Client workspace tabs, activity timeline, client linking) — see `PRODUCTIZATION_PLAN.md`

## Blocked
- `whatsapp` column does not exist in live Supabase `clients` table — run `ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp text;`
- Supabase Auth email confirmation is ON — turn off in Dashboard for dev, or configure SMTP
- All 6 migrations need to be run in Supabase SQL Editor:
  - `001_documents.sql` — documents table + storage bucket
  - `002_follow_ups.sql` — follow_ups table
  - `003_site_visits.sql` — site_visits table
  - `004_site_visit_photos.sql` — site_photos storage bucket
  - `005_site_visit_coordinates.sql` — lat/lng columns
  - `006_proposals.sql` — proposals table
