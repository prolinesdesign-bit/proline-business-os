# Proline V1 — Full Project Audit Report

**Date:** June 2026
**Scope:** All source files in `src/`, config files, schema, and project docs
**Lines audited:** ~2,800 (excluding node_modules)

---

## 1. Duplicate Code

### 1.1 Repeated CRUD page pattern (4 files)
`src/pages/Projects.tsx`, `src/pages/Clients.tsx`, `src/pages/Payments.tsx`, `src/pages/Expenses.tsx`

Each page follows an identical structure:
- `useCallback` wrapping fetch with loading/error state
- `useEffect(() => { fetch() }, [fetch])`
- `handleSave()` with edit-or-create branching
- `handleDelete()` with guard clause
- Delete confirmation modal with identical layout and button styling

**Recommendation:** Extract `useCrud` hook and `ConfirmDeleteModal` component.

### 1.2 Repeated form submit handler (4 form components)
`src/components/clients/ClientForm.tsx`, `src/components/projects/ProjectForm.tsx`, `src/components/payments/PaymentForm.tsx`, `src/components/expenses/ExpenseForm.tsx`

Every form has identical state and handler:
```tsx
const [saving, setSaving] = useState(false)
const [error, setError] = useState<string | null>(null)
async function handleSubmit(e: FormEvent) {
  e.preventDefault()
  setSaving(true)
  setError(null)
  try { await onSave(form) }
  catch (err) { setError(err instanceof Error ? err.message : 'Failed to save ...') }
  finally { setSaving(false) }
}
```

**Recommendation:** Extract `useFormSubmit` hook.

### 1.3 Repeated input/select/textarea styling
The class string `mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none` appears ~30+ times across all form components.

**Recommendation:** Create reusable `Input`, `Select`, `TextArea` components.

### 1.4 Repeated card styling
The pattern `rounded-xl border border-gray-200 bg-white p-4 shadow-sm` appears ~15+ times across `Dashboard.tsx` and card components.

**Recommendation:** Extract a `Card` component.

### 1.5 Repeated currency formatting
The pattern `` ₹{Number(x).toLocaleString()} `` or `` `₹${...toLocaleString()}` `` appears in at least 12 locations across `Dashboard.tsx`, `Payments.tsx`, `Expenses.tsx`, `ClientCard.tsx`, `ProjectCard.tsx`.

**Recommendation:** Create `formatCurrency(n: number): string` utility.

### 1.6 Duplicate date formatting
- `Dashboard.tsx:57` — `formatDate` function using `toLocaleDateString`
- `ClientCard.tsx:12` — inline `new Date(client.updated_at).toLocaleDateString()`

**Recommendation:** Create shared `formatDate` utility.

### 1.7 Duplicate empty-state messages
`Projects.tsx:72-73`, `Clients.tsx:72-73`, `Expenses.tsx:114-115` all use the pattern:
```tsx
search ? 'No X match your search.' : 'No X yet. Click + Add X to get started.'
```

---

## 2. Unused Files

| File | Status |
|------|--------|
| `public/vite.svg` | Default Vite favicon, not referenced in any HTML |
| `src/index.css` | Contains only `@import "tailwindcss"`, minimal but used |

All components in `src/components/` are imported and used. No orphan components.

### Schema with no frontend
| Table | Frontend |
|-------|----------|
| `tasks` | No types, API, page, or route |
| `targets` | No types, API, page, or route |

---

## 3. TypeScript Issues

### 3.1 `Record<string, unknown>` error type assertions
**`src/components/projects/ProjectForm.tsx:54-57`**
```tsx
(err as Record<string, unknown>).code
(err as Record<string, unknown>).message
```
Type-unsafe escape hatch. Should use `PostgrestError` from `@supabase/supabase-js`.

### 3.2 `Record<string, string>` category mappings
**`src/types/index.ts:97-116`**
`CATEGORY_TO_DB` and `DB_TO_CATEGORY` are typed as `Record<string, string>` — should use `Record<ExpenseCategory, string>` for compile-time safety.

### 3.3 `as Project['status']` cast
**`src/components/projects/ProjectForm.tsx:94`**
```tsx
onChange={e => set('status', e.target.value as Project['status'])}
```
Bypasses compile-time validation on select values.

### 3.4 Category type not enforced in API
**`src/lib/api/expenses.ts:6,10`**
```ts
function toDb(category: string): string { ... }
function toDisplay(category: string): string { ... }
```
Should accept `ExpenseCategory` / return DB union type instead of `string`.

### 3.5 `PaymentFormData.project_id` vs `Payment.project_id`
- `PaymentFormData.project_id: string` (required)
- `Payment.project_id: string | null`

Same mismatch exists for `ExpenseFormData.project_id` vs `Expense.project_id`.

### 3.6 `ClientFormData.location` vs `Client.company`
The form type uses `location` but the DB model uses `company`. API manually maps `data.location` → `company`.

---

## 4. Performance Issues

### 4.1 Large bundle: `recharts` fully imported
**`src/pages/Dashboard.tsx:6-8`**
Only `BarChart` is used, but recharts (~500KB+) includes all chart types and tree-shakes poorly.

### 4.2 No code splitting
**`src/App.tsx`**
All page components eagerly imported. No `React.lazy()` usage anywhere. Entire app loaded on first visit.

### 4.3 No pagination on list queries
All list endpoints return ALL rows with no `.range()`:
- `getPayments()`, `getProjects('')`, `getClients('')`, `getExpenses('')`

### 4.4 Dashboard fetches everything
**`src/lib/api/dashboard.ts:30-41`**
Fetches all projects, all completed payments, all expenses — no date filtering at the SQL level.

### 4.5 Expense summary aggregates client-side
**`src/lib/api/expenses.ts:30-70`**
Fetches ALL expenses then filters month/year totals client-side instead of using SQL aggregation.

### 4.6 `daysUntil()` called 3 times per item
**`src/pages/Dashboard.tsx:247-253`**
```tsx
{daysUntil(p.end_date!) === 'Overdue' ? 'text-red-600' :
 daysUntil(p.end_date!).includes('Today') || daysUntil(p.end_date!).includes('Tomorrow') ? ...}
```
Creates 3 `Date` objects per project. Cache result in variable.

### 4.7 Utility functions defined inside component
**`src/pages/Dashboard.tsx:56-67`**
`formatDate()` and `daysUntil()` recreated on every render. Hoist outside component.

---

## 5. Code Quality Issues

### 5.1 CRITICAL: `.env` with live credentials on disk
**`D:\Anti gravity\Proline V1\.env`**
Contains live Supabase URL and anon key. `.gitignore` excludes `.env`, but file exists in working directory.

### 5.2 No error boundaries
Entire app unmounts on render error. Every page should be wrapped in an `ErrorBoundary`.

### 5.3 Inconsistent error handling
4 different patterns across the codebase:
1. `Dashboard.tsx` — `.catch(console.error)` (loses stack context)
2. Most pages — `catch (err) { console.error(err) }`
3. `ExpenseForm.tsx` — logs + sets state
4. `ProjectForm.tsx` — `console.group` + detailed logging

### 5.4 Hardcoded route paths
**`src/pages/Dashboard.tsx:75-78`**
`/projects`, `/clients`, `/payments`, `/expenses` hardcoded. Should use route constants.

### 5.5 Schema defaults 'USD' but app uses INR
**`supabase/schema.sql:171`**
`currency text not null default 'USD'` — frontend shows `₹` everywhere but DB defaults to USD.

### 5.6 `whatsapp` migration guard is dead code
**`supabase/schema.sql:35-39`**
`ALTER TABLE ... ADD COLUMN whatsapp` guard exists, but column is already defined in `CREATE TABLE` above (line 30).

### 5.7 Inconsistent status badge styling
- `Dashboard.tsx:164-169` — inline ternary for status colors
- `ProjectCard.tsx:3-8` — `stageColors` lookup map

Two different approaches for the same mapping.

### 5.8 `AuthCallback` ignores URL fragment
**`src/pages/AuthCallback.tsx`**
Does not handle `type` parameter from URL hash (`#type=signup`, `#type=recovery`).

### 5.9 No ESLint configuration
`package.json` lists `eslint` as devDependency but no `.eslintrc.*` or `eslint.config.*` file found.

---

## 6. Summary of Recommendations

| Severity | Finding | Action |
|----------|---------|--------|
| **CRITICAL** | `.env` with live credentials on disk | Remove, verify `.gitignore` |
| **HIGH** | No error boundaries | Wrap pages in `ErrorBoundary` |
| **HIGH** | No code splitting | `React.lazy()` for all routes |
| **HIGH** | All list queries unbounded | Add `.range()` + `count` |
| **MEDIUM** | `recharts` fully imported | Lazy-load Dashboard or switch libs |
| **MEDIUM** | Dashboard fetches all records | SQL-level date filtering |
| **MEDIUM** | Expense summary client-side aggregation | Move to SQL aggregation |
| **MEDIUM** | Duplicate card/input/button styling | Shared UI component library |
| **MEDIUM** | Duplicate CRUD page pattern | `useCrud` hook + `ConfirmDeleteModal` |
| **MEDIUM** | Duplicate form submit pattern | `useFormSubmit` hook |
| **MEDIUM** | `Record<string, unknown>` type assertions | Use `PostgrestError` |
| **LOW** | `daysUntil()` called 3x per item | Cache result |
| **LOW** | Inline utility functions | Hoist outside component |
| **LOW** | Hardcoded route strings | Route constants file |
| **LOW** | `formatCurrency` repetition | Shared utility |
| **LOW** | `ClientForm.location` vs `Client.company` | Rename for consistency |
| **LOW** | Schema `whatsapp` guard is dead code | Remove guard |
| **LOW** | ProjectForm verbose error logging | Standardize |
| **LOW** | Missing ESLint config | Create flat config |
| **LOW** | `AuthCallback` ignores URL fragment | Handle `type` param |

---

**Assessment:** Early-stage prototype with a solid architectural foundation (React 19 + Vite + Supabase + RLS). Code is well-organized by feature. Main gaps are in production hardening: error boundaries, pagination, code splitting, and extraction of repeated patterns into reusable abstractions.
