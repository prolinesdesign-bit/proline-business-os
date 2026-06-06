# Regression Audit Report

> **Date:** June 6, 2026  
> **Scope:** Phase 1 productization changes against existing v0.9 core modules  
> **Status:** Complete

---

## Summary

| Classification       | Count | Description                                            |
|----------------------|-------|--------------------------------------------------------|
| ✅ SAFE              | 13    | No regression — compatible with existing modules       |
| ⚠️ LOW RISK          | 5     | Cosmetic or minor issues (no functional breakage)      |
| 🔶 NEEDS REFACTOR    | 2     | Code quality issues (missing error handling)           |
| ❌ HIGH RISK         | 1     | Potential DB constraint violation on payment writes    |

---

## 1. API Module Audit

### ✅ payments.ts — HIGH RISK

**Issue:** `createPayment()` and `updatePayment()` omit `status`, `method`, and `currency` fields in the insert/update payload. The `Payment` TypeScript interface declares all three as non-nullable:

```ts
// src/types/index.ts:54-66
currency: string        // NOT nullable
method: 'credit_card' | ...  // NOT nullable
status: 'pending' | ...      // NOT nullable
```

But in `payments.ts:96-105`:
```ts
.insert({
  user_id: user.id,
  project_id: data.project_id,
  client_id: clientId,
  amount: Number(data.amount),
  payment_date: data.payment_date,
  description: data.description || null,
  // ❌ status, method, currency NOT SENT
})
```

**Risk:** If the `payments` table columns `status`, `method`, `currency` are `NOT NULL` without defaults, every `createPayment` call will return a 400 error. Check `schema.sql` to confirm column constraints.

**Requires verification in Supabase Dashboard SQL Editor:**
```sql
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'payments'
  AND column_name IN ('status', 'method', 'currency');
```

**Additionally:** `PaymentFormData` type (`types/index.ts:68-73`) lacks these fields. Should add them or confirm DB has defaults.

---

### ✅ projects.ts — SAFE [v]

### ✅ clients.ts — SAFE [v]

### ✅ targets.ts — SAFE [v]

### ✅ documents.ts — SAFE [v]

### ✅ analytics.ts — SAFE [v]

---

## 2. Page Component Audit

### ⚠️ ProjectPage.tsx — LOW RISK

**Issues found:**
1. **No `.catch()` on fetch promise** (`ProjectPage.tsx:19-24`): If `getProjects()` or `.find()` fails, the error is silently swallowed. Should at minimum log or show a toast.
2. **Fetches all projects then filters client-side** — uses `getProjects('')` and `all.find(x => x.id === id)`. Inefficient for large datasets but not a functional regression.

### ⚠️ ClientPage.tsx — LOW RISK

**Issues found:**
1. **No `.catch()` on fetch promise** (`ClientPage.tsx:23-34`): Same pattern as ProjectPage — silent error swalloing.
2. **Fetches all clients, all projects, all summaries then filters** — inefficient triple fetch. Should use dedicated API for single client with joins.

### ✅ Dashboard — SAFE [v]
Dashboard declutter removed operational widgets (quick actions used to be at bottom, project/client lists removed). No functional regression — all data still accessible through respective pages.

### ✅ Calendar — SAFE [v]
List/Calendar toggle added with no removal of existing functionality.

### ✅ Operations View — SAFE [v]
Spreadsheet-style view added alongside existing Cards view. Toggle preserves access to original card layout. No data mutations changed.

### ✅ Other pages (Payments, Expenses, Targets, Tasks, Documents, FollowUps, Analytics, SiteVisits, Proposals, BackupRestore) — SAFE [v]

---

## 3. UI/Component Audit

### ⚠️ Forms — LOW RISK (cosmetic)

Several form components use `bg-white` instead of the shadcn design system `bg-card` token:

| File                     | Line  | Current       | Should Be      |
|--------------------------|-------|---------------|----------------|
| `PaymentForm.tsx`        | ~30   | `bg-white`    | `bg-card`      |
| `ExpenseForm.tsx`        | ~30   | `bg-white`    | `bg-card`      |
| `TargetForm.tsx`         | ~25   | `bg-white`    | `bg-card`      |

This will cause visual inconsistency when app theme uses non-white card backgrounds.

### ⚠️ Cards — LOW RISK (cosmetic)

`ProjectCard.tsx` and `ClientCard.tsx` use hardcoded Tailwind gray colors (`text-gray-500`, `bg-gray-50`) instead of CSS variable tokens (`text-muted-foreground`, `bg-muted`). This breaks in dark mode.

### ⚠️ ProposalPreview.tsx — LOW RISK (component inconsistency)

Uses native `<button>` elements instead of the `Button` shadcn primitive. No functional impact but inconsistent with design system.

---

## 4. Phase 1 Feature Compatibility Matrix

| Phase 1 Feature         | Existing Module       | Compatibility | Notes                              |
|-------------------------|-----------------------|---------------|------------------------------------|
| Operations View default | Projects              | ✅ Compatible  | Toggle preserved                  |
| Project Page (/project/:id) | Projects          | ✅ Compatible  | New page, no existing routes affected |
| Client Page (/client/:id)   | Clients           | ✅ Compatible  | New page, no existing routes affected |
| Notes preview in Ops View   | Projects           | ✅ Compatible  | Read-only, no mutation           |
| Quick actions always visible | All modules      | ✅ Compatible  | NavBar FAB, no conflicts          |
| Calendar list/calendar toggle | Calendar        | ✅ Compatible  | State toggle preserved            |
| Dashboard declutter     | Dashboard             | ✅ Compatible  | Removed widgets, not data         |

---

## 5. Recommendations (Priority Order)

| Priority | Action                                                        | Risk     | Effort |
|----------|---------------------------------------------------------------|----------|--------|
| P0       | Verify `status`/`method`/`currency` columns in payments table | HIGH     | 5 min  |
| P0       | Add missing fields to `createPayment` / `updatePayment` or confirm DB defaults | HIGH | 30 min |
| P1       | Add `.catch()` clauses to ProjectPage and ClientPage fetches  | LOW      | 10 min |
| P2       | Replace `bg-white` → `bg-card` in PaymentForm, ExpenseForm, TargetForm | LOW | 15 min |
| P2       | Replace hardcoded grays with CSS variable tokens in cards     | LOW      | 20 min |
| P3       | Replace native `<button>` with `Button` component in ProposalPreview | LOW | 10 min |
| P3       | Create API functions `getProjectById(id)` and `getClientById(id)` | LOW   | 30 min |

---

## 6. Verification Commands

```bash
# Build check
npm run build

# Check for unhandled promise rejections in pages
rg "\.then\(" src/pages/ --glob '*.tsx' -A 2 | rg -v "\.catch\("

# Find hardcoded bg-white in form components
rg "bg-white" src/components/ --glob '*.tsx'

# Find native button elements
rg "<button" src/components/ui/ --glob '*.tsx'
```
