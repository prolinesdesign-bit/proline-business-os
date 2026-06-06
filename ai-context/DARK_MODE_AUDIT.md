# Dark Mode Audit Report

> **Date:** June 6, 2026
> **Scope:** All 37 `.tsx` files in `src/pages/`, `src/components/`, `src/components/ui/`, `src/components/layout/`
> **Method:** Scan for hardcoded Tailwind color classes that lack `dark:` variants

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| 🔴 HIGH | 8 | Backgrounds invisible in dark mode (bg-white, bg-gray-50 as main surfaces) |
| 🟡 MEDIUM | 22 | Poor contrast (text-gray-* on dark bg, colored text on dark bg) |
| 🟢 LOW | 40+ | Cosmetic (borders, hover states, status dots, chart fills) |

---

## 1. Modal & Overlay Backdrops — 16 files, LOW

All modal backdrops use `bg-black/40` or `bg-black/60`. These work in dark mode and do NOT need changes.

✅ **No action needed:** PaymentForm, ExpenseForm, TargetForm, TaskForm, FollowUpForm, SiteVisitForm, ProposalForm, ProposalPreview, ProjectForm, ClientForm, WhatsAppModal, Projects (delete), Tasks (delete), Targets (delete), FollowUps (delete), Documents (preview), SiteVisits (preview)

---

## 2. 🔴 HIGH — Main Surfaces Using `bg-white`

These elements become invisible against a dark `#0f172a` background because they use `bg-white` instead of `bg-card`.

| # | File | Line | Element | Current | Fix |
|---|------|------|---------|---------|-----|
| 1 | `Calendar.tsx` | 260 | Day detail modal content | `bg-white` | `bg-card` |
| 2 | `Documents.tsx` | 265 | Preview modal content | `bg-white` | `bg-card` |
| 3 | `Targets.tsx` | 204 | Delete modal content | `bg-white` | `bg-card` |
| 4 | `AuthCallback.tsx` | 19 | Auth callback card | `bg-white` | `bg-card` |
| 5 | `Login.tsx` | 25 | Login card container | `bg-white` | `bg-card` |
| 6 | `SignUp.tsx` | 42 | Signup card container | `bg-white` | `bg-card` |
| 7 | `ProposalPreview.tsx` | 61 | Toolbar | `bg-white` | `bg-card` |
| 8 | `ProposalPreview.tsx` | 78 | PDF page | `bg-white` | `bg-card` |

---

## 3. 🔴 HIGH — Page Backgrounds Using `bg-gray-50`

These create light gray surfaces that clash with dark mode background.

| # | File | Line | Element | Current | Fix |
|---|------|------|---------|---------|-----|
| 9 | `Login.tsx` | 24 | Page wrapper | `bg-gray-50` | `bg-background` |
| 10 | `SignUp.tsx` | 41 | Page wrapper | `bg-gray-50` | `bg-background` |

---

## 4. 🔴 HIGH — Table Footer / Summary Using Hardcoded Colors

| # | File | Line | Element | Current | Fix |
|---|------|------|---------|---------|-----|
| 11 | `ProjectsOperationsView.tsx` | 192 | Summary footer row | `border-gray-300 bg-gray-50` | `border-border bg-muted` |
| 12 | `ProjectsOperationsView.tsx` | 276 | Mobile summary card | `border-2 border-gray-300` | `border-2 border-border` |

---

## 5. 🟡 MEDIUM — Skeleton Components

| # | File | Line | Element | Current | Fix |
|---|------|------|---------|---------|-----|
| 13 | `Skeleton.tsx` | 8 | Skeleton base | `bg-gray-200` | Add `dark:bg-muted` |
| 14 | `Skeleton.tsx` | 13 | CardSkeleton container | `border-gray-200 bg-white` | `border-border bg-card` |
| 15 | `Skeleton.tsx` | 40 | KPISkeleton container | `border-gray-200 bg-white` | `border-border bg-card` |

---

## 6. 🟡 MEDIUM — Toggle & Filter Buttons

The inactive state uses `bg-white` which disappears in dark mode.

| # | File | Line | Element | Current | Fix |
|---|------|------|---------|---------|-----|
| 16 | `Projects.tsx` | 263 | Mode toggle inactive | `bg-white hover:bg-gray-50` | `bg-card hover:bg-accent` |
| 17 | `Projects.tsx` | 269 | Mode toggle inactive | `bg-white hover:bg-gray-50` | `bg-card hover:bg-accent` |
| 18 | `Projects.tsx` | 275 | Mode toggle inactive | `bg-white hover:bg-gray-50` | `bg-card hover:bg-accent` |
| 19 | `Projects.tsx` | 312 | Period option inactive | `bg-white hover:bg-gray-50` | `bg-card hover:bg-accent` |
| 20 | `Calendar.tsx` | 135 | Mode toggle inactive | `bg-white hover:bg-gray-50` | `bg-card hover:bg-accent` |
| 21 | `Calendar.tsx` | 141 | Mode toggle inactive | `bg-white hover:bg-gray-50` | `bg-card hover:bg-accent` |
| 22 | `ProjectPage.tsx` | 250 | Schedule toggle inactive | `bg-white hover:bg-gray-50` | `bg-card hover:bg-accent` |
| 23 | `ProjectPage.tsx` | 256 | Schedule toggle inactive | `bg-white hover:bg-gray-50` | `bg-card hover:bg-accent` |
| 24 | `FollowUps.tsx` | 109 | Status filter inactive | `bg-gray-100 text-gray-700 hover:bg-gray-200` | `bg-muted text-muted-foreground hover:bg-accent` |

---

## 7. 🟡 MEDIUM — Calendar Grid Cells

The calendar day cells, headers, and non-current month days use hardcoded grays.

| # | File | Line | Element | Current | Fix |
|---|------|------|---------|---------|-----|
| 25 | `Calendar.tsx` | 199 | Calendar header | `border-gray-200 bg-gray-50` | `border-border bg-muted` |
| 26 | `Calendar.tsx` | 205 | Week row | `border-gray-100` | `border-border` |
| 27 | `Calendar.tsx` | 210 | Day cell | `border-gray-100 hover:bg-gray-50` | `border-border hover:bg-accent` |
| 28 | `Calendar.tsx` | 211 | Non-current month | `bg-gray-50/50` | `bg-muted/50` |
| 29 | `Calendar.tsx` | 215 | Day number (current) | `text-gray-900` | `text-foreground` |
| 30 | `Calendar.tsx` | 215 | Day number (other month) | `text-gray-400` | `text-muted-foreground` |
| 31 | `Calendar.tsx` | 235 | "+more" text | `text-gray-400` | `text-muted-foreground` |
| 32 | `ProjectPage.tsx` | 316 | Calendar header | `border-gray-200 bg-gray-50` | `border-border bg-muted` |
| 33 | `ProjectPage.tsx` | 322 | Week row | `border-gray-100` | `border-border` |
| 34 | `ProjectPage.tsx` | 327 | Day cell | `border-gray-100 hover:bg-gray-50` | `border-border hover:bg-accent` |
| 35 | `ProjectPage.tsx` | 328 | Non-current month | `bg-gray-50/50` | `bg-muted/50` |
| 36 | `ProjectPage.tsx` | 332 | Day number (current) | `text-gray-900` | `text-foreground` |
| 37 | `ProjectPage.tsx` | 332 | Day number (other month) | `text-gray-400` | `text-muted-foreground` |
| 38 | `ProjectPage.tsx` | 349 | "+more" text | `text-gray-400` | `text-muted-foreground` |
| 39 | `Projects.tsx` | 365 | Calendar header | `border-gray-200 bg-gray-50` | `border-border bg-muted` |
| 40 | `Projects.tsx` | 371 | Week row | `border-gray-100` | `border-border` |
| 41 | `Projects.tsx` | 376 | Day cell | `border-gray-100 hover:bg-gray-50` | `border-border hover:bg-accent` |
| 42 | `Projects.tsx` | 377 | Non-current month | `bg-gray-50/50` | `bg-muted/50` |
| 43 | `Projects.tsx` | 381 | Day number (current) | `text-gray-900` | `text-foreground` |
| 44 | `Projects.tsx` | 381 | Day number (other month) | `text-gray-400` | `text-muted-foreground` |
| 45 | `Projects.tsx` | 399 | "+more" text | `text-gray-400` | `text-muted-foreground` |

---

## 8. 🟡 MEDIUM — Calendar Detail Modal (Calendar.tsx)

| # | File | Line | Element | Current | Fix |
|---|------|------|---------|---------|-----|
| 46 | `Calendar.tsx` | 265 | Close button | `text-gray-400 hover:text-gray-600` | `text-muted-foreground hover:text-foreground` |
| 47 | `Calendar.tsx` | 272 | Event row | `bg-gray-50` | `bg-muted` |

---

## 9. 🟡 MEDIUM — Calendar Legend (all pages)

| # | File | Line | Element | Current | Fix |
|---|------|------|---------|---------|-----|
| 48 | `Calendar.tsx` | 251 | This Week legend | `border-blue-200` | `dark:border-blue-400/30` |
| 49 | `Projects.tsx` | 408 | Start legend dot | `bg-blue-500` | ✅ Already uses non-bg class dot |
| 50 | `ProjectPage.tsx` | 358-360 | Legend dots | `bg-green-500` etc | ✅ OK, small dots |

---

## 10. 🟡 MEDIUM — Calendar Event Row Backgrounds

Event rows use tinted backgrounds (`bg-red-50`, `bg-purple-50`, `bg-gray-50`, etc.) that don't render in dark mode.

| # | File | Line | Element | Current | Fix |
|---|------|------|---------|---------|-----|
| 51 | `Calendar.tsx` | 171 | Event row | `bg-purple-50` / `bg-red-50` / `bg-gray-50` | `dark:bg-purple-950/30` / `dark:bg-red-950/30` / `dark:bg-muted` |
| 52 | `Calendar.tsx` | 224 | Event badge | `bg-red-100 text-red-700` / `bg-purple-100 text-purple-700` / `bg-blue-50 text-blue-700` | Add `dark:bg-red-950/50 dark:text-red-300` etc |
| 53 | `ProjectPage.tsx` | 291 | Event row | Same pattern | Same fix |
| 54 | `ProjectPage.tsx` | 341 | Event badge | Same pattern | Same fix |
| 55 | `Projects.tsx` | 390 | Event badge | Same pattern | Same fix |

---

## 11. 🟡 MEDIUM — Calendar Day Number / Today Badge

| # | File | Line | Element | Current | Fix |
|---|------|------|---------|---------|-----|
| 56 | `Calendar.tsx` | 215 | Today badge | `bg-blue-600 text-white` | ✅ OK (blue on dark fine) |
| 57 | `Projects.tsx` | 381 | Today badge | `bg-blue-600 text-white` | ✅ OK |
| 58 | `ProjectPage.tsx` | 332 | Today badge | `bg-blue-600 text-white` | ✅ OK |

---

## 12. 🟡 MEDIUM — QuickActions FAB

| # | File | Line | Element | Current | Fix |
|---|------|------|---------|---------|-----|
| 59 | `QuickActions.tsx` | 31 | Action menu item | `bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-blue-600` | `bg-card text-card-foreground ring-1 ring-border hover:bg-accent hover:text-primary` |
| 60 | `QuickActions.tsx` | 43 | FAB open state | `bg-gray-700` | `dark:bg-gray-600` or `bg-muted-foreground` |

---

## 13. 🟡 MEDIUM — Breadcrumbs

| # | File | Line | Element | Current | Fix |
|---|------|------|---------|---------|-----|
| 61 | `Breadcrumbs.tsx` | 9 | Nav text | `text-gray-500` | `text-muted-foreground` |
| 62 | `Breadcrumbs.tsx` | 10 | Home icon | `text-gray-400 hover:text-gray-600` | `text-muted-foreground hover:text-foreground` |
| 63 | `Breadcrumbs.tsx` | 14 | Separator | `text-gray-300` | `text-border` |
| 64 | `Breadcrumbs.tsx` | 22 | Current page | `text-gray-900` | `text-foreground` |
| 65 | `Breadcrumbs.tsx` | 27 | Link hover | `hover:text-gray-700` | `hover:text-foreground` |
| 66 | `Breadcrumbs.tsx` | 31 | Separator | `text-gray-300` | `text-border` |

---

## 14. 🟡 MEDIUM — Status & Priority Badges (Tasks.tsx)

| # | File | Line | Element | Current | Fix |
|---|------|------|---------|---------|-----|
| 67 | `Tasks.tsx` | 15 | Status: todo | `bg-gray-100 text-gray-700` | `bg-muted text-muted-foreground` |
| 68 | `Tasks.tsx` | 16 | Status: in_progress | `bg-blue-100 text-blue-700` | Add `dark:bg-blue-950/50 dark:text-blue-300` |
| 69 | `Tasks.tsx` | 17 | Status: done | `bg-green-100 text-green-700` | Add `dark:bg-green-950/50 dark:text-green-300` |
| 70 | `Tasks.tsx` | 18 | Status: cancelled | `bg-red-100 text-red-700` | Add `dark:bg-red-950/50 dark:text-red-300` |
| 71 | `Tasks.tsx` | 22 | Priority: low | `border-gray-300 text-gray-600` | `border-border text-muted-foreground` |
| 72 | `Tasks.tsx` | 23 | Priority: medium | `border-yellow-300 text-yellow-700` | Add `dark:border-yellow-600 dark:text-yellow-300` |
| 73 | `Tasks.tsx` | 24 | Priority: high | `border-orange-300 text-orange-700` | Add `dark:border-orange-600 dark:text-orange-300` |
| 74 | `Tasks.tsx` | 25 | Priority: urgent | `border-red-300 text-red-700` | Add `dark:border-red-600 dark:text-red-300` |

---

## 15. 🟡 MEDIUM — ClientCard & ProjectCard Hardcoded Colors

| # | File | Line | Element | Current | Fix |
|---|------|------|---------|---------|-----|
| 75 | `ClientCard.tsx` | 36 | Project count | `text-blue-700` | `text-primary` |
| 76 | `ClientCard.tsx` | 40 | Total value | `text-green-700` | Add `dark:text-green-400` |
| 77 | `ProjectCard.tsx` | 70 | Document link | `text-blue-600` | `text-primary` |

---

## 16. 🟡 MEDIUM — Login/SignUp Page Inputs

| # | File | Line | Element | Current | Fix |
|---|------|------|---------|---------|-----|
| 78 | `Login.tsx` | 37 | Input border | `border-gray-300` | `border-input` |
| 79 | `Login.tsx` | 37 | Input focus | `focus:border-blue-500` | `focus:border-ring focus:ring-ring` |
| 80 | `Login.tsx` | 49 | Input border | `border-gray-300` | `border-input` |
| 81 | `Login.tsx` | 49 | Input focus | `focus:border-blue-500` | `focus:border-ring` |
| 82 | `Login.tsx` | 72 | Google button | `border-gray-300 hover:bg-gray-50` | `border-border hover:bg-accent` |
| 83 | `Login.tsx` | 30 | Label | `text-gray-700` | `text-foreground` |
| 84 | `Login.tsx` | 53 | Error | `text-red-600` | `text-destructive` |
| 85 | `Login.tsx` | 66 | "or" text | `text-gray-400` | `text-muted-foreground` |
| 86 | `Login.tsx` | 83 | Bottom text | `text-gray-500` | `text-muted-foreground` |
| 87 | `Login.tsx` | 85 | Sign Up link | `text-blue-600` | `text-primary` |
| 88 | `SignUp.tsx` | 47 | Label | `text-gray-700` | `text-foreground` |
| 89 | `SignUp.tsx` | 54 | Input border | `border-gray-300` | `border-input` |
| 90 | `SignUp.tsx` | 54 | Input focus | `focus:border-blue-500` | `focus:border-ring` |
| 91 | `SignUp.tsx` | 67 | Input border | `border-gray-300` | `border-input` |
| 92 | `SignUp.tsx` | 67 | Input focus | `focus:border-blue-500` | `focus:border-ring` |
| 93 | `SignUp.tsx` | 82 | Bottom text | `text-gray-500` | `text-muted-foreground` |
| 94 | `SignUp.tsx` | 84 | Sign In link | `text-blue-600` | `text-primary` |

---

## 17. 🟡 MEDIUM — Dashboard Widget Backgrounds

| # | File | Line | Element | Current | Fix |
|---|------|------|---------|---------|-----|
| 95 | `Dashboard.tsx` | 202 | Overdue item | `bg-red-50` | Add `dark:bg-red-950/30` |
| 96 | `Dashboard.tsx` | 226 | Upcoming item | `bg-gray-50` | `bg-muted` |
| 97 | `Dashboard.tsx` | 168 | Progress bar track | `bg-gray-100` | `bg-muted` |

---

## 18. 🟡 MEDIUM — Dashboard / Targets Progress Bar Colors

| # | File | Line | Element | Current | Fix |
|---|------|------|---------|---------|-----|
| 98 | `Dashboard.tsx` | 171-174 | Progress fill | `bg-green-500` / `bg-blue-500` / `bg-amber-500` / `bg-orange-500` | ✅ OK (status indicator colors) |
| 99 | `Targets.tsx` | 114 | Progress bar track | `bg-gray-100` | `bg-muted` |
| 100 | `Targets.tsx` | 117-120 | Progress fill | Same as above | ✅ OK |

---

## 19. 🟡 MEDIUM — Dashboard Chart Titles & Values

| # | File | Line | Element | Current | Fix |
|---|------|------|---------|---------|-----|
| 101 | `Dashboard.tsx` | 93 | Chart title | `text-gray-600` | `text-muted-foreground` |
| 102 | `Dashboard.tsx` | 107 | Chart title | `text-gray-600` | `text-muted-foreground` |
| 103 | `Dashboard.tsx` | 121 | Chart title | `text-gray-600` | `text-muted-foreground` |
| 104 | `Dashboard.tsx` | 156 | Revenue value | `text-green-600` | Add `dark:text-green-400` |
| 105 | `Dashboard.tsx` | 160 | Remaining value | `text-amber-600` | Add `dark:text-amber-400` |
| 106 | `Dashboard.tsx` | 164 | Daily needed | `text-orange-600` | Add `dark:text-orange-400` |
| 107 | `Dashboard.tsx` | 192 | Overdue title | `text-red-700` | `text-destructive` |

---

## 20. 🟡 MEDIUM — Analytics Page

| # | File | Line | Element | Current | Fix |
|---|------|------|---------|---------|-----|
| 108 | `Analytics.tsx` | 107 | Chart title | `text-gray-600` | `text-muted-foreground` |
| 109 | `Analytics.tsx` | 121 | Chart title | `text-gray-600` | `text-muted-foreground` |
| 110 | `Analytics.tsx` | 135 | Chart title | `text-gray-600` | `text-muted-foreground` |
| 111 | `Analytics.tsx` | 155 | Chart title | `text-gray-600` | `text-muted-foreground` |
| 112 | `Analytics.tsx` | 184 | Chart title | `text-gray-600` | `text-muted-foreground` |
| 113 | `Analytics.tsx` | 204 | Chart title | `text-gray-600` | `text-muted-foreground` |

---

## 21. 🟡 MEDIUM — BackupRestore Page

| # | File | Line | Element | Current | Fix |
|---|------|------|---------|---------|-----|
| 114 | `BackupRestore.tsx` | 98 | "All Data" title | `text-gray-900` | `text-foreground` |
| 115 | `BackupRestore.tsx` | 109 | Table label | `text-gray-900` | `text-foreground` |
| 116 | `BackupRestore.tsx` | 110 | Table key | `text-gray-400` | `text-muted-foreground` |
| 117 | `BackupRestore.tsx` | 96 | Section border | `border-gray-100` | `border-border` |
| 118 | `BackupRestore.tsx` | 133 | File input | `bg-blue-50 text-blue-700 hover:file:bg-blue-100` | Add `dark:bg-blue-950/30 dark:text-blue-300` |

---

## 22. 🟢 LOW — Status Dot Colors

These are small colored dots used as status indicators. They use `bg-*` colors like `bg-green-500`, `bg-red-500`, etc. These should remain as-is since they convey semantic meaning.

| # | File | Line | Element | Current | Verdict |
|---|------|------|---------|---------|---------|
| 119 | Multiple | STATUS_COLORS | Status dots | `bg-green-500`, `bg-blue-500`, `bg-yellow-500`, `bg-red-500`, `bg-purple-500` | ✅ OK (semantic colors) |
| 120 | Multiple | KPI dots | KPI indicators | `bg-blue-500`, `bg-indigo-500`, etc | ✅ OK (semantic colors) |

---

## 23. 🟢 LOW — Recharts Chart Colors (Dashboard + Analytics)

Recharts `fill` and `stroke` hex values are hardcoded and don't respond to dark mode.

| # | File | Line | Element | Current | Fix |
|---|------|------|---------|---------|-----|
| 121 | `Dashboard.tsx` | 96 | Chart grid | `stroke="#f0f0f0"` | Use CSS variable: dark mode grid should be `#334155` |
| 122 | `Dashboard.tsx` | 100 | Revenue bar | `fill="#3b82f6"` | ✅ OK (brand blue) |
| 123 | `Dashboard.tsx` | 114 | Expenses bar | `fill="#f97316"` | ✅ OK (brand orange) |
| 124 | `Dashboard.tsx` | 128 | Profit bar | `fill="#22c55e"` | ✅ OK (brand green) |
| 125 | `Analytics.tsx` | 110 | Chart grid | `stroke="#f0f0f0"` | Same fix as #121 |
| 126 | `Analytics.tsx` | 114 | Revenue bar | `fill="#3b82f6"` | ✅ OK |
| 127 | `Analytics.tsx` | 128 | Expenses bar | `fill="#f97316"` | ✅ OK |
| 128 | `Analytics.tsx` | 142 | Profit bar | `fill="#22c55e"` | ✅ OK |
| 129 | `Analytics.tsx` | 194 | Client bar | `fill="#8b5cf6"` | ✅ OK |

**Fix for chart grid lines:** Replace `stroke="#f0f0f0"` with a dynamic value from CSS or use `dark:stroke-slate-700` approach.

---

## 24. 🟢 LOW — Miscellaneous

| # | File | Line | Element | Current | Fix |
|---|------|------|---------|---------|-----|
| 130 | `ProposalPreview.tsx` | 76 | PDF preview area | `bg-gray-200` | `bg-muted` |
| 131 | `ProposalPreview.tsx` | 62 | Toolbar title | `text-gray-700` | `text-card-foreground` |
| 132 | `ProposalPreview.tsx` | 80 | Header underline | `border-gray-900` | `border-foreground` |
| 133 | `ProposalPreview.tsx` | 93 | Client info box | `border-gray-300` | `border-border` |
| 134 | `ProposalPreview.tsx` | 132 | Footer | `border-gray-300 text-gray-500` | `border-border text-muted-foreground` |
| 135 | `SiteVisits.tsx` | 193 | Photo thumbnail | `border-gray-200` | `border-border` |
| 136 | `SiteVisits.tsx` | 199 | Photo delete btn | `bg-red-500 text-white` | ✅ OK (semantic) |
| 137 | `Documents.tsx` | 226 | Download btn | `text-green-600` | Add `dark:text-green-400` |
| 138 | `Payments.tsx` | 99 | Total paid | `text-green-600` | Add `dark:text-green-400` |
| 139 | `Payments.tsx` | 103 | Zero balance | `text-green-600` | Add `dark:text-green-400` |
| 140 | `Expenses.tsx` | 101 | Month total | `text-blue-600` | `text-primary` |
| 141 | `Expenses.tsx` | 107 | Year total | `text-green-600` | Add `dark:text-green-400` |
| 142 | `Targets.tsx` | 95 | Current revenue | `text-green-600` | Add `dark:text-green-400` |
| 143 | `Targets.tsx` | 99 | Remaining | `text-amber-600` / `text-green-600` | Add `dark:text-amber-400` / `dark:text-green-400` |
| 144 | `Targets.tsx` | 105 | Daily needed | `text-orange-600` | Add `dark:text-orange-400` |
| 145 | `WhatsAppModal.tsx` | 33 | Phone text | `text-gray-500` | `text-muted-foreground` |
| 146 | `ProposalForm.tsx` | 145 | New client box | `border-blue-200 bg-blue-50` | Add `dark:border-blue-800 dark:bg-blue-950/30` |
| 147 | `ProposalForm.tsx` | 146 | New client title | `text-blue-800` | `text-primary` |
| 148 | `SiteVisitForm.tsx` | 177 | Link text | `text-blue-600` | `text-primary` |
| 149 | `ProtectedRoute.tsx` | 11 | Loading text | `text-gray-500` | `text-muted-foreground` |

---

## 25. 🟢 LOW — Link Colors

Across all pages, links use `text-blue-600`. These should use `text-primary`.

| File | Lines | Current | Fix |
|------|-------|---------|-----|
| `ProjectCard.tsx` | 70 | `text-blue-600` | `text-primary` |
| `ProjectsOperationsView.tsx` | 101, 107, 221, 226 | `text-blue-600` / `hover:text-blue-500` | `text-primary` / `hover:text-primary-hover` |
| `Dashboard.tsx` | 203, 227 | `text-blue-600` | `text-primary` |
| `Documents.tsx` | 253 | `text-blue-600` | `text-primary` |
| `ClientPage.tsx` | 64, 145 | `text-blue-600` | `text-primary` |
| `ProjectPage.tsx` | 164 | `text-blue-600` | `text-primary` |

---

## 26. 🟢 LOW — Login/SignUp Primary Buttons

| # | File | Line | Element | Current | Fix |
|---|------|------|---------|---------|-----|
| 150 | `Login.tsx` | 58 | Sign In | `bg-blue-600 text-white hover:bg-blue-700` | ✅ Already uses Button component with `default` variant |
| 151 | `SignUp.tsx` | 76 | Sign Up | `bg-blue-600 text-white hover:bg-blue-700` | ✅ Already uses Button component with `default` variant |

---

## Consolidated Priority Fix List

### P0 — Broken Surfaces (invisible elements in dark mode)
1. `Calendar.tsx:260` — `bg-white` → `bg-card`
2. `Documents.tsx:265` — `bg-white` → `bg-card`
3. `Targets.tsx:204` — `bg-white` → `bg-card`
4. `Login.tsx:24-25` — `bg-gray-50` / `bg-white` → `bg-background` / `bg-card`
5. `SignUp.tsx:41-42` — `bg-gray-50` / `bg-white` → `bg-background` / `bg-card`
6. `ProjectsOperationsView.tsx:192` — `border-gray-300 bg-gray-50` → `border-border bg-muted`
7. `ProjectsOperationsView.tsx:276` — `border-gray-300` → `border-border`

### P1 — Poor Contrast (unreadable text in dark mode)
1. All toggle/option buttons using `bg-white` → `bg-card`
2. Calendar grid: all `bg-gray-50` → `bg-muted`, `border-gray-100` → `border-border`
3. Breadcrumbs: `text-gray-*` → `text-muted-foreground` / `text-foreground`
4. QuickActions menu: `bg-white text-gray-700 ring-gray-200` → `bg-card ring-border`
5. Login/SignUp inputs: `border-gray-300` → `border-input`
6. Progress bar tracks: `bg-gray-100` → `bg-muted`
7. Skeleton components: `bg-gray-200 border-gray-200 bg-white` → add dark variants

### P2 — Low Contrast (readable but poor)
1. Status badges in Tasks: add `dark:bg-*-950/50 dark:text-*-300` variants
2. Event row backgrounds in Calendar: add `dark:bg-*-950/30` variants
3. Chart titles: `text-gray-600` → `text-muted-foreground`
4. Colored monetary values: add `dark:text-*-400` variants
5. Recharts grid lines: `stroke="#f0f0f0"` → dynamic CSS variable approach
6. ProposalPreview: all `text-gray-*` → semantic tokens (is a PDF render, arguably OK as-is)

### P3 — Nice to Have
1. ClientCard: `text-blue-700` → `text-primary`, `text-green-700` → `dark:text-green-400`
2. All `text-blue-600` links → `text-primary`
3. `bg-black/40` modal backdrops ✅ already work in dark mode (no change needed)
4. `bg-red-500` delete buttons ✅ already work (no change needed)
