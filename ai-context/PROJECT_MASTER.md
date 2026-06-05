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
│       └── projects.ts      — Projects CRUD + search
├── types/
│   └── index.ts             — Database model types
├── context/AuthContext.tsx   — Auth provider + hooks
├── components/
│   ├── ProtectedRoute.tsx    — Route guard
│   └── projects/
│       ├── ProjectCard.tsx   — Project display card
│       └── ProjectForm.tsx   — Add/edit project modal
├── pages/
│   ├── Login.tsx
│   ├── SignUp.tsx
│   ├── AuthCallback.tsx
│   └── Projects.tsx          — Projects list + search + CRUD
├── App.tsx                   — Routes
└── main.tsx                  — Entry point
```

## Tags

- `v0.2-auth` — Authentication complete

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

* CRM
* Money Flow
* Dashboard
* Calendar
* Documents
* Site Visits
* AI Insights

## Current Phase

Phase 2: Projects Module

Completed:

* React + Vite
* TypeScript
* Tailwind
* Supabase
* Authentication
* Database Schema
* Projects CRUD

Next:

* CRM (clients)
