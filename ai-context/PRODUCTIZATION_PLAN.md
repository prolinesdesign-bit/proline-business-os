# Productization Plan — Phase 2

> Transforming Proline Business OS into a professional architecture-business operating system.
> Combining old-tracker operational speed with modern CRM + financial management.

---

## Gap Analysis

| Requirement | Current State | Gap |
|---|---|---|
| Projects as operations center | Card view + Ops View toggle | Ops View exists but missing: Revision Count, Notes Preview, Followup Status. Not yet the default. |
| Project detail page | None | Need to build full project workspace with tabs |
| Client detail page | None | Need to build full client workspace with tabs |
| Project creation with client linking | Text field for client_name | Needs client_id properly linked, client select/create flow |
| Calendar list/calendar toggle | Month grid view only | Missing list view toggle |
| Global date range filtering | Per-page only | Missing centralized date range context |
| Global search | Per-page search only | Missing cross-entity global search |
| Notes timeline | Single text field on projects | Needs full activity timeline with entry types |
| Dashboard as executive overview | Full dashboard with widgets | Needs decluttering (move operational widgets to Projects) |
| No horizontal scrolling mobile | Partially done | Full audit needed across all pages |
| Pagination | None | All queries unbounded |
| Revision count tracking | None | New field needed |
| Followup status on project rows | None | New column needed |

---

## Phase 1 — Quick Wins (High Impact, Low Risk)

Estimated: 3-5 sessions

### 1.1 Make Operations View the Default

- [x] Operations View component exists (`src/components/projects/ProjectsOperationsView.tsx`)
- [ ] Change default `viewMode` from `'card'` to `'operations'`
- [ ] Add missing columns: Revision Count, Notes Preview, Followup Status
- [ ] Add `revision_count` to Project type (no DB migration needed — store in notes field as structured data, or add column if storage needed)

### 1.2 Add Revision Count Field

- [ ] Add `revision_count` column to `projects` table via migration (`007_revision_count.sql`)
- [ ] Update `Project` and `ProjectFormData` types
- [ ] Add revision increment/decrement button in project form
- [ ] Show count in Operations View

### 1.3 Project Name Links to Project Page

- [ ] Create `src/pages/ProjectPage.tsx` — basic layout with placeholder tabs
- [ ] Add route `/project/:id` to `App.tsx`
- [ ] Make project name clickable in Operations View
- [ ] Make project name clickable in Card view

### 1.4 Client Name Links to Client Page

- [ ] Create `src/pages/ClientPage.tsx` — basic layout with placeholder tabs
- [ ] Add route `/client/:id` to `App.tsx`
- [ ] Make client name clickable in Operations View and ClientCard

### 1.5 Quick Actions Bar in Operations View

- [ ] Add quick action buttons per row: View Project, WhatsApp, Documents, Site Visit, Add Payment
- [ ] Use icon-only buttons for density

### 1.6 Dashboard Declutter

- [ ] Remove operational widgets from Dashboard (Recent Payments, Recent Expenses, Follow-up lists)
- [ ] Keep only: Revenue, Expenses, Profit, Outstanding Balance, Overdue Projects, Due This Week, Followups Due, Target Progress
- [ ] Simplify layout — single-column chart, compact KPI cards

### 1.7 Calendar List View

- [ ] Add list/calendar toggle to Calendar page
- [ ] List view shows chronological events with type badges
- [ ] Color-coding same as calendar

### 1.8 Notes Preview in Operations View

- [ ] Show first 60 chars of notes as preview in table
- [ ] Add hover tooltip for full note

---

## Phase 2 — Project & Client Workspaces (Medium Impact, Moderate Risk)

Estimated: 5-8 sessions

### 2.1 Project Workspace Page

Build full project detail page with tabs:

**Overview Tab:**
- Project name, status badge, client link
- Amount / Paid / Balance summary cards
- Days remaining with color coding
- Quick actions row (Edit, Add Payment, WhatsApp, Add Document, Site Visit)
- Revision count with +/- buttons
- Notes/activity timeline (latest entries)

**Timeline Tab:**
- Chronological view of all project events
- Created date, status changes, payments, site visits, followups
- Filterable by event type

**Payments Tab:**
- Payments table filtered to this project
- Add payment quick button
- Running balance

**Documents Tab:**
- Documents table filtered to this project
- Upload button
- Document count + last uploaded

**Site Visits Tab:**
- Site visits filtered to this project
- Add site visit button
- Photo gallery

**Proposals Tab:**
- Proposals filtered to this project
- Create proposal button

**Expenses Tab:**
- Expenses filtered to this project
- Add expense button

**Notes/Activity Tab:**
- Full activity timeline
- Entry types: General Note, Client Discussion, Revision, Site Visit, Payment, Followup, Internal Note
- Each entry: timestamp, user, optional attachment

**Analytics Tab:**
- Revenue vs expenses for this project
- Payment collection rate
- Outstanding balance

### 2.2 Client Workspace Page

Build full client detail page with tabs:

**Overview Tab:**
- Client name, phone, email, WhatsApp, company
- Total revenue, outstanding balance, project count
- Last interaction date
- Quick actions (WhatsApp, New Project, New Follow-up)

**Projects Tab:**
- All projects for this client
- Project cards with status, amount, balance

**Payments Tab:**
- All payments from this client
- Payment history

**Documents Tab:**
- Documents across all projects for this client

**Followups Tab:**
- Follow-up history
- Add follow-up
- WhatsApp integration

**Notes Tab:**
- Notes specific to client interactions

### 2.3 Project Creation with Client Linking

- [ ] Update ProjectForm to include client select dropdown
- [ ] Dropdown shows existing clients with search
- [ ] "Add New Client" option with inline form
- [ ] Default country code +91 for WhatsApp
- [ ] Auto-link project to selected/created client_id
- [ ] Keep client_name in sync with client table name

### 2.4 Notes System Upgrade

- [ ] Create `project_activity` table via migration
- [ ] Entry types: general_note, client_discussion, revision, site_visit, payment, followup, internal_note
- [ ] API module for CRUD
- [ ] Activity timeline component
- [ ] Replace single notes field with timeline integration
- [ ] Show latest note preview in Operations View

### 2.5 Followup Status on Operations View

- [ ] Fetch latest followup status per project (via client_id)
- [ ] Show as badge in Operations View
- [ ] Color-coded: pending (yellow), contacted (blue), waiting_client (purple), closed (green)

---

## Phase 3 — Power Features (Medium Impact, Higher Risk)

Estimated: 5-8 sessions

### 3.1 Global Search

- [ ] Create search bar component (fixed in AppLayout header)
- [ ] Search across: projects.name, clients.name, clients.phone, clients.whatsapp, projects.description, documents.name
- [ ] Debounced (300ms) with instant results dropdown
- [ ] Results grouped by entity type
- [ ] Click navigates to entity

### 3.2 Global Date Range Filter

- [ ] Create `DateRangeContext` context/provider
- [ ] Add date range selector in AppLayout header
- [ ] Presets: Current Month, Last Month, Last 6 Months, This Year, Custom Range
- [ ] Apply to: Project list, Dashboard, Revenue, Expenses, Analytics, Targets
- [ ] Update all API queries to accept date range params

### 3.3 Pagination

- [ ] Add `.range()` to all list API queries
- [ ] Default page size: 20
- [ ] Add "Load More" or page controls
- [ ] Preserve search + filter state across pagination

### 3.4 Documents Integration

- [ ] Show last uploaded date per project in Operations View
- [ ] Categorize documents by type in project page (Drawings, PDFs, Contracts, BOQ, Site Photos, Renders)
- [ ] Quick upload from project page

### 3.5 Performance Optimization

- [ ] Debounce search inputs (300ms)
- [ ] Memoize expensive computations
- [ ] Lazy-load non-critical components
- [ ] Add `React.memo` on list items
- [ ] Batch Supabase queries with `Promise.all` where possible (already done in most places)

### 3.6 Mobile Final Polish

- [ ] Audit every page for horizontal scroll
- [ ] Ensure Operations View cards are complete on mobile
- [ ] Calendar list view as default on mobile
- [ ] Dashboard single-column on all mobile

---

## Database Migrations Required

| Migration | Table | Change | Phase |
|---|---|---|---|
| `007_revision_count.sql` | projects | ADD COLUMN revision_count integer DEFAULT 0 | Phase 1 |
| `008_project_activity.sql` | project_activity | New table for activity timeline | Phase 2 |

Both migrations are additive — they add new columns/tables without modifying existing ones.

---

## New Files Required

| File | Purpose | Phase |
|---|---|---|
| `src/pages/ProjectPage.tsx` | Project workspace with tabs | Phase 2 |
| `src/pages/ClientPage.tsx` | Client workspace with tabs | Phase 2 |
| `src/components/projects/ProjectActivityTimeline.tsx` | Activity timeline component | Phase 2 |
| `src/components/projects/ProjectPageTabOverview.tsx` | Overview tab | Phase 2 |
| `src/components/projects/ProjectPageTabPayments.tsx` | Payments tab | Phase 2 |
| `src/components/projects/ProjectPageTabDocuments.tsx` | Documents tab | Phase 2 |
| `src/components/projects/ProjectPageTabSiteVisits.tsx` | Site Visits tab | Phase 2 |
| `src/components/projects/ProjectPageTabProposals.tsx` | Proposals tab | Phase 2 |
| `src/components/projects/ProjectPageTabExpenses.tsx` | Expenses tab | Phase 2 |
| `src/components/projects/ProjectPageTabNotes.tsx` | Notes/Activity tab | Phase 2 |
| `src/components/projects/ProjectPageTabAnalytics.tsx` | Analytics tab | Phase 2 |
| `src/components/clients/ClientPageTabOverview.tsx` | Client overview tab | Phase 2 |
| `src/components/clients/ClientPageTabProjects.tsx` | Client projects tab | Phase 2 |
| `src/components/clients/ClientPageTabPayments.tsx` | Client payments tab | Phase 2 |
| `src/components/clients/ClientPageTabDocuments.tsx` | Client documents tab | Phase 2 |
| `src/components/clients/ClientPageTabFollowups.tsx` | Client followups tab | Phase 2 |
| `src/components/clients/ClientPageTabNotes.tsx` | Client notes tab | Phase 2 |
| `src/context/DateRangeContext.tsx` | Global date range filter context | Phase 3 |
| `src/components/GlobalSearch.tsx` | Global search bar | Phase 3 |
| `src/lib/api/projectActivity.ts` | Activity timeline API | Phase 2 |

---

## Files to Modify

| File | Change | Phase |
|---|---|---|
| `src/pages/Projects.tsx` | Default to Operations View | Phase 1 |
| `src/components/projects/ProjectsOperationsView.tsx` | Add revision, notes preview, followup columns; make names clickable | Phase 1 |
| `src/pages/Dashboard.tsx` | Remove operational widgets | Phase 1 |
| `src/pages/Calendar.tsx` | Add list/calendar toggle | Phase 1 |
| `src/components/projects/ProjectForm.tsx` | Client select/create flow | Phase 2 |
| `src/components/projects/ProjectCard.tsx` | Make name clickable | Phase 1 |
| `src/components/clients/ClientCard.tsx` | Make name clickable | Phase 1 |
| `src/lib/api/projects.ts` | Add revision_count to queries | Phase 1 |
| `src/types/index.ts` | Add ProjectActivity types, update Project type | Phase 2 |
| `src/App.tsx` | Add /project/:id and /client/:id routes | Phase 2 |

---

## What Will NOT Change

- No existing working functionality will be removed
- No database schema will be dropped or altered
- No existing API function signatures will change
- Existing Card View will remain available via toggle
- All existing pages (Payments, Expenses, etc.) will remain accessible
- Auth flow unchanged
- RLS policies unchanged

---

## Success Metrics

| Metric | Target |
|---|---|
| Clicks to complete daily project update | ≤3 |
| Project list load time | < 500ms |
| Search results | < 300ms |
| Mobile horizontal scroll | Zero on all pages |
| Operations View density | 20+ projects visible without scroll |
