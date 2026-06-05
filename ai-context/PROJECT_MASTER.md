# Proline V1 — Project Master

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite 6
- **Styling:** Tailwind CSS v4
- **Auth:** Supabase Auth (email/password, Google OAuth)
- **Database:** Supabase (PostgreSQL)
- **Routing:** react-router-dom v7

## Schema

Six tables: `clients`, `projects`, `tasks`, `payments`, `expenses`, `targets`.

All share `id` (UUID), `created_at`, `updated_at`, `user_id` with RLS scoped to `auth.uid()`.

## Project Structure

```
src/
├── lib/
│   ├── supabase.ts          — Supabase client
│   └── api/
│       ├── projects.ts      — Projects CRUD + search
│       ├── clients.ts       — Clients CRUD + search + project stats
│       ├── payments.ts      — Payments CRUD + project summaries
│       ├── expenses.ts      — Expenses CRUD + summary
│       ├── dashboard.ts     — Dashboard KPIs + charts + widgets
│       ├── calendar.ts      — Calendar events from project dates
│       ├── targets.ts       — Targets CRUD + monthly progress
│       ├── tasks.ts          — Tasks CRUD + status update
│       ├── documents.ts     — Documents upload/download + CRUD
│       ├── followups.ts     — Follow-ups CRUD + WhatsApp URL generation
│       └── analytics.ts     — Business analytics queries
├── types/
│   └── index.ts             — Database model types
├── context/AuthContext.tsx   — Auth provider + hooks
├── components/
│   ├── ProtectedRoute.tsx    — Route guard
│   ├── projects/
│   │   ├── ProjectCard.tsx   — Project display card
│   │   └── ProjectForm.tsx   — Add/edit project modal
│   ├── clients/
│   │   ├── ClientCard.tsx    — Client display card with stats
│   │   └── ClientForm.tsx    — Add/edit client modal
│   ├── payments/
│   │   └── PaymentForm.tsx   — Add/edit payment modal
│   ├── expenses/
│   │   └── ExpenseForm.tsx   — Add/edit expense modal
│   ├── targets/
│   │   └── TargetForm.tsx    — Add/edit target modal
│   ├── tasks/
│   │   └── TaskForm.tsx      — Add/edit task modal
│   └── followups/
│       └── FollowUpForm.tsx   — Add/edit follow-up modal
├── pages/
│   ├── Login.tsx
│   ├── SignUp.tsx
│   ├── AuthCallback.tsx
│   ├── Projects.tsx          — Projects list + search + CRUD
│   ├── Clients.tsx           — Clients list + search + CRUD
│   ├── Dashboard.tsx          — Dashboard KPIs, charts, widgets
│   ├── Calendar.tsx           — Month view with project dates
│   ├── Targets.tsx            — Targets list + monthly progress
│   ├── Tasks.tsx              — Tasks list + status dropdown + CRUD
│   ├── Documents.tsx          — Upload, view, delete documents
│   ├── FollowUps.tsx           — Follow-ups list + WhatsApp + CRUD
│   ├── Analytics.tsx            — Business analytics + charts + insights
│   ├── Payments.tsx          — Payments list + project summaries + CRUD
│   └── Expenses.tsx          — Expenses list + summary + CRUD
├── App.tsx                   — Routes
└── main.tsx                  — Entry point
```

## Tags

- `v0.2-auth` — Authentication complete
- `v0.3-projects` — Projects CRUD
- `v0.4-crm` — Client CRM
- `v0.5-business-core` — Payments, Expenses, Dashboard
- `v0.6-dashboard` — Dashboard, INR currency, audit report
- `v0.7-calendar-targets` — Calendar, Targets
- `v0.8-documents` — Documents, Tasks, Follow-ups

## Git

Remote: `https://github.com/prolinesdesign-bit/proline-business-os.git`

## Purpose

Proline Business OS is a web application for managing:

* Projects
* CRM / Clients
* Payments
* Expenses
* Targets
* Tasks
* Calendar
* Business Analytics

for Proline Architects & Builders.

## Development Rules

* Never modify `schema.sql` unless explicitly requested.
* Never delete working functionality.
* Reuse existing components before creating new ones.
* Keep code modular and maintainable.
* Use Supabase as the single source of truth.
* Use TypeScript types for all database models.
* Update `CURRENT_STATE.md` after major changes.
* Update `NEXT_TASK.md` before ending a development session.
* Prefer extending existing features over rewriting them.

## Future Modules

* Money Flow
* Site Visits
* AI Insights

## Current Phase

Phase 11: Analytics

Completed:

* React + Vite
* TypeScript
* Tailwind
* Supabase
* Authentication
* Database Schema
* Projects CRUD
* Client CRM
* Payments
* Expenses
* Dashboard
* Calendar
* Targets
* Documents
* Tasks
* Follow-ups
* Analytics

Next:

* Task info on ProjectCards
* Polish
* Deploy
