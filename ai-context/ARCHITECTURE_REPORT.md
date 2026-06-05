# Architecture Report — Proline Business OS

> Generated from full codebase analysis.
> **Stack:** React 19 + TypeScript 5.7 + Vite 6 + Tailwind CSS v4 + Supabase (PostgreSQL + Auth + Storage)
> **Repository:** `https://github.com/prolinesdesign-bit/proline-business-os.git`

---

## 1. Folder Structure

```
proline-v1/
├── .env                          # Supabase credentials (gitignored)
├── .env.example                  # Template for local setup
├── .gitignore
├── eslint.config.js
├── index.html                    # Vite entry HTML
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # Root TS config (references app + node)
├── tsconfig.app.json             # App-level TS config (strict mode)
├── tsconfig.node.json            # Node-level TS config
├── vite.config.ts                # Vite configuration
│
├── ai-context/                   # AI-assisted development context
│   ├── AI_RULES.md
│   ├── CURRENT_STATE.md
│   ├── NEXT_TASK.md
│   └── PROJECT_MASTER.md
│
├── public/
│   └── vite.svg
│
├── supabase/
│   ├── schema.sql                # Core schema (6 tables: clients, projects, tasks, payments, expenses, targets)
│   └── migrations/
│       ├── 001_documents.sql     # Documents table + storage bucket
│       ├── 002_follow_ups.sql    # Follow-ups table
│       ├── 003_site_visits.sql   # Site visits table
│       ├── 004_site_visit_photos.sql  # Site photos storage bucket
│       ├── 005_site_visit_coordinates.sql  # lat/lng columns
│       └── 006_proposals.sql     # Proposals table
│
├── src/
│   ├── main.tsx                  # App entry point
│   ├── App.tsx                   # Route definitions (17 routes)
│   ├── index.css                 # Tailwind base styles
│   ├── vite-env.d.ts
│   │
│   ├── context/
│   │   └── AuthContext.tsx       # Auth provider (signIn, signUp, signOut, Google OAuth, session listener)
│   │
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client init from env vars
│   │   └── api/                  # 14 API modules
│   │       ├── projects.ts       # CRUD + search
│   │       ├── clients.ts        # CRUD + search + project stats
│   │       ├── payments.ts       # CRUD + project summaries + auto client resolution
│   │       ├── expenses.ts       # CRUD + summary + category mapping
│   │       ├── targets.ts        # CRUD + monthly progress
│   │       ├── tasks.ts          # CRUD + status update + project name join
│   │       ├── documents.ts      # Upload/download/delete + signed URLs
│   │       ├── followups.ts      # CRUD + WhatsApp URL generator
│   │       ├── sitevisits.ts     # CRUD + photo upload/delete + signed URLs
│   │       ├── proposals.ts      # CRUD + status workflow + number generation
│   │       ├── analytics.ts      # Financial analytics queries
│   │       ├── dashboard.ts      # Aggregated dashboard data
│   │       ├── calendar.ts       # Merged project dates + site visits
│   │       └── backup.ts         # Export (JSON/CSV/Excel) + Import
│   │
│   ├── types/
│   │   └── index.ts              # All interfaces, form data types, constants (~400 lines)
│   │
│   ├── components/
│   │   ├── ProtectedRoute.tsx    # Auth route guard
│   │   ├── WhatsAppModal.tsx     # WhatsApp message composer with templates
│   │   ├── clients/
│   │   │   ├── ClientCard.tsx    # Client display card with stats
│   │   │   └── ClientForm.tsx    # Add/edit client modal
│   │   ├── projects/
│   │   │   ├── ProjectCard.tsx   # Project display card with doc/photo counts
│   │   │   └── ProjectForm.tsx   # Add/edit project modal
│   │   ├── payments/
│   │   │   └── PaymentForm.tsx   # Add/edit payment modal
│   │   ├── expenses/
│   │   │   └── ExpenseForm.tsx   # Add/edit expense modal
│   │   ├── targets/
│   │   │   └── TargetForm.tsx    # Add/edit target modal
│   │   ├── tasks/
│   │   │   └── TaskForm.tsx      # Add/edit task modal
│   │   ├── followups/
│   │   │   └── FollowUpForm.tsx  # Add/edit follow-up modal
│   │   ├── sitevisits/
│   │   │   └── SiteVisitForm.tsx # Add/edit + geolocation capture
│   │   └── proposals/
│   │       ├── ProposalForm.tsx   # Add/edit + inline client creation
│   │       └── ProposalPreview.tsx # PDF preview + download
│   │
│   └── pages/                    # 17 page components
│       ├── Login.tsx             # Email/password + Google OAuth
│       ├── SignUp.tsx            # Account registration
│       ├── AuthCallback.tsx      # OAuth callback handler
│       ├── Dashboard.tsx         # KPIs, charts, widgets
│       ├── Projects.tsx          # CRUD + search + WhatsApp
│       ├── Clients.tsx           # CRUD + search + follow-up history
│       ├── Payments.tsx          # CRUD + project summaries
│       ├── Expenses.tsx          # CRUD + search + category breakdown
│       ├── Calendar.tsx          # Month view with project/visit events
│       ├── Targets.tsx           # CRUD + monthly progress
│       ├── Tasks.tsx             # CRUD + inline status + project filter
│       ├── Documents.tsx         # Upload, preview, download, filter
│       ├── FollowUps.tsx         # CRUD + status filter + WhatsApp
│       ├── Analytics.tsx         # 6 metrics + 6 charts + 4 insights
│       ├── SiteVisits.tsx        # CRUD + photos + GPS + navigate
│       ├── Proposals.tsx         # CRUD + status workflow + WhatsApp + PDF
│       └── BackupRestore.tsx     # Export all/per-table + import
│
├── backups/                      # (empty — for local backups)
└── dist/                         # Build output
```

---

## 2. Database Tables

The database runs on **Supabase (PostgreSQL 15)** with **Row Level Security** on every table. All user-scoped tables share the same pattern: `id` (UUID), `created_at`, `updated_at`, `user_id` with RLS policies scoped to `auth.uid()`.

### Core Tables (from `schema.sql`)

| Table | Key Columns | Foreign Keys | Indexes |
|-------|-------------|--------------|---------|
| **clients** | `name`, `email`, `phone`, `company`, `whatsapp`, `notes` | `user_id → auth.users` | `idx_clients_user_id` |
| **projects** | `name`, `description`, `status`, `client_name`, `start_date`, `end_date`, `budget` | `user_id → auth.users`, `client_id → clients` (SET NULL) | `idx_projects_user_id`, `idx_projects_client_id` |
| **tasks** | `title`, `description`, `status`, `priority`, `due_date` | `user_id → auth.users`, `project_id → projects` (CASCADE) | `idx_tasks_user_id`, `idx_tasks_project_id` |
| **payments** | `amount`, `currency`, `payment_date`, `method`, `status`, `description` | `user_id → auth.users`, `client_id → clients` (CASCADE), `project_id → projects` (SET NULL) | `idx_payments_user_id`, `idx_payments_client_id`, `idx_payments_project_id` |
| **expenses** | `amount`, `currency`, `expense_date`, `category`, `description`, `receipt_url` | `user_id → auth.users`, `project_id → projects` (SET NULL) | `idx_expenses_user_id`, `idx_expenses_project_id` |
| **targets** | `title`, `description`, `target_type`, `target_value`, `current_value`, `start_date`, `end_date`, `status` | `user_id → auth.users` | `idx_targets_user_id` |

### Migration Tables

| Table | Key Columns | Foreign Keys | Indexes |
|-------|-------------|--------------|---------|
| **documents** | `name`, `file_type`, `file_size`, `storage_path`, `notes` | `user_id → auth.users`, `project_id → projects` (SET NULL) | `idx_documents_user_id`, `idx_documents_project_id` |
| **follow_ups** | `next_follow_up_date`, `last_follow_up_date`, `notes`, `status` | `user_id → auth.users`, `client_id → clients` (CASCADE) | `idx_follow_ups_user_id`, `idx_follow_ups_client_id`, `idx_follow_ups_next_date`, `idx_follow_ups_status` |
| **site_visits** | `visit_date`, `location`, `notes`, `travel_cost`, `site_status`, `next_action`, `photo_urls` (jsonb), `latitude`, `longitude` | `user_id → auth.users`, `project_id → projects` (SET NULL), `client_id → clients` (SET NULL) | `idx_site_visits_user_id`, `idx_site_visits_project_id`, `idx_site_visits_client_id`, `idx_site_visits_visit_date` |
| **proposals** | `template`, `proposal_number`, `fee_amount`, `scope_of_work`, `deliverables`, `timeline`, `terms_conditions`, `status` | `user_id → auth.users`, `client_id → clients` (CASCADE), `project_id → projects` (SET NULL) | `idx_proposals_user_id`, `idx_proposals_client_id`, `idx_proposals_project_id` |

### Storage Buckets

| Bucket | Visibility | Max Size | Allowed Types |
|--------|-----------|----------|---------------|
| `documents` | Private | 10 MB | PDF, JPEG, PNG, DOCX |
| `site_photos` | Private | 10 MB | JPEG, PNG, WebP, GIF |

### Entity Relationships

```
auth.users
  └── clients        (user_id FK)
       ├── projects  (client_id FK, SET NULL)
       │    ├── tasks       (project_id FK, CASCADE)
       │    ├── payments    (project_id FK, SET NULL)
       │    ├── expenses    (project_id FK, SET NULL)
       │    ├── documents   (project_id FK, SET NULL)
       │    ├── site_visits (project_id FK, SET NULL)
       │    └── proposals   (project_id FK, SET NULL)
       ├── payments    (client_id FK, CASCADE)
       ├── follow_ups  (client_id FK, CASCADE)
       ├── site_visits (client_id FK, SET NULL)
       └── proposals   (client_id FK, CASCADE)
```

---

## 3. Features Completed

### Authentication & Security
- Email/password signup and login
- Google OAuth integration
- Session persistence via `onAuthStateChange`
- Protected route guard redirecting to `/login`
- Row Level Security on all 10 tables (SELECT/INSERT/UPDATE/DELETE per user)
- Storage bucket RLS (owner-based and folder-based)

### Core Business Modules

| Module | CRUD | Key Features |
|--------|------|-------------|
| **Projects** | Full | Search, stage dropdown, budget, client linking, document/site-photo counts, WhatsApp button |
| **Clients (CRM)** | Full | Search, phone/WhatsApp/email, company/location, project stats, expandable follow-up history |
| **Payments** | Full | Project-linked, auto client resolution, per-project summaries (value/paid/balance) |
| **Expenses** | Full | 9 categories with display-name mapping, monthly/yearly totals, category breakdown |
| **Targets** | Full | Monthly revenue targets, daily-needed calculation, progress bar, overdue/missed tracking |
| **Tasks** | Full | Priority levels, inline status dropdown, project filter, due dates |
| **Documents** | Create/Read/Delete | Upload (4 types, 10MB), preview modal (PDF iframe, image, DOCX prompt), signed URL download, project filter |
| **Follow-ups** | Full | Status workflow, client history, WhatsApp messaging with 4 templates |
| **Site Visits** | Full | GPS geolocation capture, photo upload (gallery + lightbox), Google Maps navigation, travel costs |
| **Proposals** | Full | 4 templates, auto-generated number, status workflow (draft→sent→accepted/rejected), PDF download (html2canvas+jsPDF), WhatsApp sharing, inline client creation |

### Dashboard & Analytics

| Module | Features |
|--------|----------|
| **Dashboard** | 8 KPI cards, 3 monthly bar charts (Recharts), target progress bar, overdue/upcoming widgets, recent payments/expenses, site visit widgets, follow-up widgets |
| **Calendar** | Month grid, project start/due dates, site visit events, color-coded by status, overdue highlighting, this-week ring, day detail popup |
| **Analytics** | 6 metric cards, 6 charts (monthly revenue/expenses/profit, project status pie, revenue by client/status), 4 insight cards |

### Utility

| Module | Features |
|--------|----------|
| **Backup & Restore** | Export per-table or all data in JSON/CSV/Excel, import from previously exported files |
| **WhatsApp Integration** | Shared modal with 4 message templates, `wa.me` URL generation, phone fallback, proposal-specific messages |

---

## 4. Missing Features

### Critical Gaps
- **No test coverage** — Zero unit, integration, or E2E tests exist
- **No pagination** — All list queries fetch every row without `LIMIT`/`OFFSET`
- **No error boundaries** — A single render crash produces a blank white screen
- **No input validation library** — No Zod, Yup, or any schema validation on form submissions or imports
- **No loading skeletons** — Only simple "Loading..." text placeholders

### Moderate Gaps
- **No notifications system** — No in-app toasts or alerts for success/failure
- **No audit log** — No history of who deleted/created what
- **No search across all modules** — Only Projects, Clients, and Expenses have search
- **No bulk operations** — No batch delete, export selection, or mass status update
- **No dark mode** — Tailwind could support it but no theme toggle
- **No mobile-responsive nav** — Nav bar on small screens overflows rather than collapsing

### Minor Gaps
- **No proposal email sending** — PDF download only, no email delivery
- **No expense receipt upload** — `receipt_url` column exists but no upload UI
- **No multi-currency support** — `currency` column exists but is hardcoded to INR display
- **No export to PDF for reports** — Only CSV/JSON/Excel in backup module
- **No 404 page** — Unknown routes silently redirect to dashboard

---

## 5. Technical Debt

### 5.1 Duplicated Business Logic
- `getTargetProgress()` is defined identically in both **`src/lib/api/dashboard.ts:26-78`** and **`src/lib/api/targets.ts:59-117`**
- `startOfYear()` helper is duplicated in **`src/lib/api/analytics.ts:6-11`** and **`src/lib/api/dashboard.ts:19-24`**
- Monthly chart-building loops (12-month zero arrays + iteration) are duplicated across both analytics and dashboard modules

### 5.2 Widespread Type Unsafety
- **~80+ uses** of `Record<string, unknown>` with manual `as string` / `as number` casts across all API modules (`projects.ts`, `clients.ts`, `payments.ts`, `expenses.ts`, `tasks.ts`, `documents.ts`, `followups.ts`, `sitevisits.ts`, `proposals.ts`, `calendar.ts`, `backup.ts`)
- This bypasses TypeScript entirely — if the DB schema changes, these casts silently produce wrong types at runtime

### 5.3 No Shared Utilities Module
- Date formatting (`formatDate`) is redefined in every page component
- Currency formatting (`₹...`) is redefined in every page component
- No centralized error handling or logging utility

### 5.4 Inconsistent Data Field Mapping
- `Client` interface uses `company` (DB column name) but `ClientFormData` uses `location` — `clients.ts` maps `data.location → company` with a comment explaining the mismatch
- `PaymentFormData` is missing `currency`, `method`, `status` fields that exist in the `Payment` interface
- `ExpenseFormData` is missing `currency`, `receipt_url` fields

### 5.5 Proposal Number Uniqueness Risk
- `generateProposalNumber()` uses `Math.random()` with no collision check — `PRL-2025-1234` could theoretically duplicate

### 5.6 Missing CI/CD Scripts
- `package.json` lacks `test`, `typecheck` (though `build` includes `tsc -b`), `format`, and `precommit` scripts
- No ESLint flat config (the `eslint.config.js` exists but its format is unclear)

### 5.7 No Loading State for Signed URL Generation
- `refreshSitePhotoUrls()` generates new signed URLs on every call with no caching — incurs cost and latency

---

## 6. Security Concerns

### 6.1 Unvalidated Import (HIGH)
- **`src/lib/api/backup.ts:98-134`** — `parseImportFile()` calls `JSON.parse()` on user-uploaded content with no schema validation, no size limits, and no prototype-pollution protection
- CSV parsing uses naive `split(',')` which breaks on quoted commas
- `importTable()` passes parsed rows directly into `.insert()` without field whitelisting — a crafted file could inject unexpected columns

### 6.2 Sensitive Error Leakage (MEDIUM)
- **32+ instances** of `console.error(err)` across the codebase log raw Supabase error objects (`.code`, `.details`, `.hint`) that expose internal schema information

### 6.3 Overly Long-Lived Signed URLs (MEDIUM)
- Site visit photos use **24-hour signed URLs** (`86400` seconds) in `sitevisits.ts:117` vs the 60-second expiry used for documents

### 6.4 Implicit Client Creation (MEDIUM)
- **`src/lib/api/payments.ts:52-88`** (`resolveClientId`) silently creates "Unknown Client" records when a payment references a project with no client — happens without user confirmation

### 6.5 No Rate Limiting on Auth (LOW)
- Login/signup forms have no client-side throttling or exponential backoff

### 6.6 Weak Proposal Number (LOW)
- `Math.random()`-based proposal numbers are predictable

### 6.7 No Input Validation on Search (LOW)
- Search strings pass directly to `.ilike('%...%')` with no minimum length check or debouncing

---

## 7. Suggested Improvements

### Priority 1 — Security & Stability

1. **Secure import/export** (`backup.ts`)
   - Add file size limit (e.g., reject > 10 MB)
   - Use a proper CSV parser (`papaparse`)
   - Validate/sanitize imported fields against a known schema using Zod or manual whitelisting
   - Strip unknown keys from imported rows before insert

2. **Add user-facing error handling**
   - Replace all `console.error(err)` with a toast/notification system (e.g., `react-hot-toast` or a simple state-based notification)
   - Log generic messages to console; show specific messages to users

3. **Add error boundary**
   - Wrap `App` or `ProtectedRoute` with a React error boundary to catch render crashes

4. **Reduce signed URL expiry**
   - Change site photo signed URL from 86400s to 3600s (1 hour) or generate on-demand only

### Priority 2 — Code Quality

5. **Consolidate duplicated logic**
   - Extract `getTargetProgress()`, `startOfYear()`, monthly aggregation into `src/lib/utils.ts`
   - Extract `formatDate` and `fmtCost` into a shared utility

6. **Add Supabase type generation**
   - Run `supabase gen types typescript --linked > src/types/supabase.ts` for typed API responses
   - Eliminate all `Record<string, unknown>` + `as` casts

7. **Add pagination to all list queries**
   - Use `.range()` with configurable page sizes (20-50 default)
   - Add "Load More" or page controls to list pages

### Priority 3 — Testing & CI

8. **Add unit tests**
   - Start with utility functions (date math, number formatting, proposal generation)
   - Add API module tests using Supabase local/mock

9. **Set up CI pipeline**
   - Add `test`, `typecheck`, `format` scripts to `package.json`
   - Configure GitHub Actions for lint → typecheck → build → test

### Priority 4 — Feature Polish

10. **Add loading skeletons** instead of "Loading..." text
11. **Responsive nav collapse** — hamburger menu for mobile viewports
12. **Add `react-hot-toast`** for success/error notifications on all CRUD operations
13. **Fix field naming** — rename `location` to `company` in `ClientFormData` to match DB schema, or add a comment utility mapping
14. **Implement receipt upload** for expenses (`receipt_url` column already exists)
15. **Add email sending** for proposals (integrate with Resend/SendGrid or Supabase Edge Functions)
16. **Add proper 404 page** instead of silent redirect
17. **Add Zod validation** on all form submissions and import data
