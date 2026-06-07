# Implementation Plan - Project & Document System Improvements

This plan details fixes for critical data-flow discrepancies, missing UI options in forms, project filtering/linking in Document Upload, and mobile layout issues.

## User Review Required

> [!IMPORTANT]
> The database migrations (`007_project_client_fields.sql`) successfully added columns (`project_type`, `location`, `location_url`, `expected_timeline`, `expected_payment_date`, `revision_count`) to the `projects` table. However, the API layer (`src/lib/api/projects.ts`) and the project editing forms did not read/write these fields. We will update the schema types, API methods, and form elements to support these fields.

## Proposed Changes

### 1. Projects API Layer & Forms

We will update the project API functions to sync all columns to Supabase, update the forms to render inputs for these new columns, and make sure inline updates save to the database.

#### [MODIFY] [projects.ts](file:///d:/Anti%20gravity/Proline%20V1/src/lib/api/projects.ts)
- Update `createProject` to save `project_type`, `location`, `location_url`, `expected_timeline`, `expected_payment_date`, and `revision_count`.
- Update `updateProject` to save `project_type`, `location`, `location_url`, `expected_timeline`, `expected_payment_date`, and `revision_count`.

#### [MODIFY] [ProjectForm.tsx](file:///d:/Anti%20gravity/Proline%20V1/src/components/projects/ProjectForm.tsx)
- Include input controls for:
  - `status` (as a select dropdown matching standard project stages)
  - `start_date` and `end_date` (as HTML date inputs)
  - `project_type`, `location`, `location_url`, `expected_timeline`, `expected_payment_date`
  - `revision_count`
- This ensures creating or editing a project from the modal allows modifying all properties.

#### [MODIFY] [ProjectsOperationsView.tsx](file:///d:/Anti%20gravity/Proline%20V1/src/components/projects/ProjectsOperationsView.tsx)
- Fix `handleRevisionCountBlur` so it calls `saveProject` to update the revision count in Supabase instead of only doing it in memory.

---

### 2. Documents Linking & Page Filters

We will enable URL parameter mapping to documents so clicking "Documents" from a specific project's dashboard pre-selects and filters documents automatically.

#### [MODIFY] [ProjectPage.tsx](file:///d:/Anti%20gravity/Proline%20V1/src/pages/ProjectPage.tsx)
- Change `<Link to={"/documents"}>Documents</Link>` to pass the project ID: `<Link to={"/documents?project_id=" + project.id}>Documents</Link>`.

#### [MODIFY] [Documents.tsx](file:///d:/Anti%20gravity/Proline%20V1/src/pages/Documents.tsx)
- Read the `project_id` query parameter on mount.
- If present, set `filterProject` and `uploadData.project_id` to that ID by default.
- Correct the mobile view (`space-y-3 md:hidden` container):
  - Move it inside the responsive container wrapper `<div className="mx-auto max-w-5xl px-4 py-6">`.
  - Condition its rendering on `!loading` and ensure it responds properly when there are no documents (hides list and shows the empty state).

---

### 3. Backup and Targets Logical Bugs

We will address two logical bugs:
1. **Backup CSV Export**: The "All Data" export does not have a handler for CSV format, resulting in a silent failure or indefinite loading state. We will disable the CSV button for the "All Data" row in the UI.
2. **Targets Current Value**: Targets display `current_value` from a database column which is never populated. We will dynamically compute `current_value` in `getTargets` by filtering completed payments within the target's date range.

#### [MODIFY] [targets.ts](file:///d:/Anti%20gravity/Proline%20V1/src/lib/api/targets.ts)
- Update `getTargets` to load completed payments and compute each target's `current_value` dynamically.

#### [MODIFY] [BackupRestore.tsx](file:///d:/Anti%20gravity/Proline%20V1/src/pages/BackupRestore.tsx)
- Disable the CSV button for the "All Data" row: `disabled={isExporting || (table === 'all' && fmt === 'csv')}`.

## Verification Plan

### Automated Tests
- Build verification using `npx tsc --noEmit`.

### Manual Verification
- **Project Operations**: Verify that updating the revision count inline successfully saves to the database and persists on page reload.
- **Project Creation/Edit**: Verify that editing a project allows modifying status, timelines, type, location, and that they persist.
- **Documents Link**: Click on "Documents" from the Project Workspace page and verify the select options for Uploading and Filtering are pre-selected to that project.
- **Mobile View**: Resize the browser window and verify the mobile layout is aligned with margins, shows loaders, and behaves consistently when empty.
- **Backup UI**: Verify the CSV export button is disabled for "All Data" row.
- **Targets Page**: Verify that historical targets correctly show their dynamic revenue progress based on payments during their target date ranges.
