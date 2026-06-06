# Changelog

## v1.0 — Productization Phase 1 (Current)

### Phase 1 — Operations Center
- Operations View now the default view on Projects page
- Project names link to `/project/:id` — dedicated Project Page with summary cards and navigation to related modules
- Client names link to `/client/:id` — dedicated Client Page with revenue/outstanding/projects overview and WhatsApp
- Notes preview column in Operations View (truncated 60 chars, tooltip on hover)
- Quick actions always visible (Edit/Del buttons no longer hidden on hover)
- Calendar now has Calendar/List view toggle — list view shows chronological events grouped by date with type badges
- Dashboard decluttered: removed site visits, follow-ups, recent payments, recent expenses widgets. Kept: KPIs, charts, target progress, overdue projects, upcoming due dates.
- Project and Client routes added to App.tsx

## v0.9 — Core Complete
- Shared `AppLayout` with collapsible sidebar, mobile drawer, SVG icons
- Breadcrumbs, active page highlighting, quick actions FAB
- Single `NavBar` component replacing 13 duplicated nav bars

### Design System (shadcn/ui)
- Tailwind v4 CSS variables for color tokens
- UI primitives: Button (8 variants), Card (6 parts), Badge (8 variants), Table, Input, Select, Textarea, Label
- Design system applied across all pages, forms, cards

### UX Improvements
- Toast notifications via `sonner` on all CRUD operations
- Skeleton loaders (CardSkeleton, TableSkeleton, KPISkeleton)
- Empty states (EmptyState component with icon + message + CTA)
- Smooth page transitions via Framer Motion
- Hover states on cards

### Mobile Improvements
- Increased tap targets (py-2.5 → py-3) in NavBar and QuickActions
- Responsive calendar (shrunken cells on mobile)
- Form grids collapse to single column on mobile
- Tables replaced with mobile card views on Payments, Expenses, Documents
- No horizontal scrolling enforced

### Operations View
- Dense spreadsheet-like project table
- Inline stage editing with save-toast
- Amount/Paid/Balance columns from payment summaries
- Days remaining with color coding
- WhatsApp action per row
- Cards/Operations view toggle

### Previous Versions
- **v0.8**: Documents, Tasks, Follow-ups modules
- **v0.7**: Calendar, Targets modules
- **v0.6**: Dashboard, INR currency, audit report
- **v0.5**: Payments, Expenses, Dashboard
- **v0.4**: Client CRM module
- **v0.3**: Projects CRUD module
- **v0.2**: Authentication (email/password, Google OAuth, protected routes)
- **v0.1**: React + Vite + TypeScript + Tailwind scaffold
