# Codebase Hardening and Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the SSES T2 report application to a clean, typed, testable, secure-by-design, maintainable state while aligning all project documentation with the deployed code.

**Architecture:** Preserve the current React/TanStack Start SPA and its operational workflows. Establish strict quality gates first, then introduce typed service boundaries, centralise duplicate report/media workflows, split oversized feature components, move privileged Google Apps Script writes behind a server-side boundary, and publish documentation generated from the resulting architecture.

**Tech Stack:** React 19, TypeScript 5, TanStack Start/Router, Vite, Zustand, Supabase JS, Netlify Functions, Google Apps Script, Vitest, React Testing Library, Playwright, GitHub Actions.

## Global Constraints

- Keep the application mobile-first: every interactive control must remain usable at 375px width, use at least 16px input text, and provide a 44px minimum touch target.
- Preserve all approved WhatsApp report wording, line breaks, emoji, and section order in `src/lib/utils/waGenerator.ts` unless a business owner explicitly approves a format change.
- Do not expose a Google Apps Script write credential in a `VITE_*` variable or browser bundle.
- Treat Supabase Row Level Security as mandatory for every table the browser can read or write.
- Do not add a replacement state-management library; keep Zustand.
- Do not add an abstraction until at least two current callers share the exact lifecycle it will own.
- All new production code must be strict TypeScript; no new `any`, `@ts-ignore`, or `@ts-nocheck`.
- Every task must leave `npm run typecheck`, `npm run test`, and `npm run build` green before its commit.
- Preserve existing user changes in `dist/`; do not stage or modify generated `dist/` files during this work.

---

## Delivery boundaries

This remediation is intentionally split into four independently releasable phases:

1. **Foundation** — reproducible quality gates, linting, tests, types, configuration, and generated documentation baseline.
2. **Frontend core** — shared report submission and media workflows; feature components become focused and testable without changing report output.
3. **Data and integration hardening** — typed Supabase access, conflict-safe realtime state, authenticated server-side Google integration, and resilient failures.
4. **Operations readiness** — accessible mobile verification, CI, deployment checks, and final documentation/architecture refresh.

## Target file structure

| Path | Responsibility |
|---|---|
| `src/lib/config/env.ts` | Validate and expose browser-safe runtime configuration only. |
| `src/lib/supabase/database.types.ts` | Checked-in generated Supabase `Database` type contract. |
| `src/lib/supabase/client.ts` | Typed Supabase client construction and explicit unconfigured state. |
| `src/lib/types/domain.ts` | Stable application domain types: reports, photos, checklist payloads, asset placement, and shifts. |
| `src/lib/services/reportSubmissionService.ts` | One browser workflow for report text, attachment processing, Sheets sync request, and share fallback. |
| `src/lib/services/googleReportsClient.ts` | Browser client for the same-origin Netlify API, never direct Apps Script writes. |
| `netlify/functions/reports.ts` | Server-side validation and proxy to Google Apps Script with secret authentication. |
| `src/lib/media/photoWorkflow.ts` | Compression, attachment classification, collage generation, and object URL cleanup helpers. |
| `src/components/shared/ReportAttachments.tsx` | Reusable attachment editor and live collage UI. |
| `src/components/features/initial-report/`, `perbaikan/`, `kalibrasi/` | Focused form, validation, preview, and submit modules for the three large operational tabs. |
| `src/test/setup.ts` | Browser API mocks shared by unit/component tests. |
| `tests/e2e/` | Mobile Playwright workflows for critical reports. |
| `.github/workflows/quality.yml` | Typecheck, lint, unit tests, build, and E2E gate. |
| `README.md`, `architecture.md`, `database.md`, `prd.md`, `agent.md`, `docs/` | Current operational and developer documentation. |

## Task 1: Establish reproducible quality gates and clear the current TypeScript baseline

**Files:**

- Modify: `package.json`
- Create: `eslint.config.js`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/test/smoke.test.ts`
- Modify: `src/components/features/AssetManager.tsx`
- Modify: `src/components/features/TabInitialReport.tsx`
- Modify: `src/components/features/TabKalibrasi.tsx`
- Modify: `src/components/features/UnitPeralatanManager.tsx`
- Modify: `src/components/shared/LiveCollagePreview.tsx`
- Modify: `src/components/shared/MonitorSearchIcon.tsx`

**Interfaces:**

- Produces scripts: `typecheck`, `lint`, `test`, `test:coverage`, and `test:e2e`.
- Produces a Vitest environment that runs TypeScript and React component tests in `jsdom`.

- [ ] **Step 1: Add the quality dependencies and scripts.**

  Run:

  ```powershell
  npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event playwright
  npm pkg set scripts.typecheck="tsc --noEmit"
  npm pkg set scripts.lint="eslint . --max-warnings 0"
  npm pkg set scripts.test="vitest run"
  npm pkg set scripts.test:coverage="vitest run --coverage"
  npm pkg set scripts.test:e2e="playwright test"
  ```

- [ ] **Step 2: Create the lint and test configuration.**

  `eslint.config.js` must use the flat config format, ignore `dist`, `.tanstack`, `.netlify`, `node_modules`, `routeTree.gen.ts`, and `graphify-out`, enable TypeScript recommended rules, React Hooks rules, and reject `any` in new source files. `vitest.config.ts` must use the React plugin, `environment: 'jsdom'`, `setupFiles: ['./src/test/setup.ts']`, and include `src/**/*.test.{ts,tsx}`.

  `src/test/setup.ts` must import `@testing-library/jest-dom/vitest` and define deterministic mocks for `window.matchMedia`, `window.scrollTo`, `URL.createObjectURL`, and `URL.revokeObjectURL`.

- [ ] **Step 3: Write the initial failing test.**

  `src/test/smoke.test.ts`:

  ```ts
  import { describe, expect, it } from 'vitest'
  import { formatTanggalIndo } from '../lib/utils/locationRules'

  describe('formatTanggalIndo', () => {
    it('formats a calendar date for report output', () => {
      expect(formatTanggalIndo('2026-08-20')).toBe('Kamis, 20 Agustus 2026')
    })
  })
  ```

- [ ] **Step 4: Run the test and record the baseline.**

  Run: `npm run test -- src/test/smoke.test.ts`

  Expected: PASS after the Vitest configuration is complete.

- [ ] **Step 5: Remove every current unused declaration reported by `tsc`.**

  Make the smallest safe changes only:

  - replace `error: titikErr` with `error` and throw it when it exists in `AssetManager.tsx`;
  - remove deprecated unused photo state and unused duration handlers in `TabInitialReport.tsx` only after confirming their JSX has no caller;
  - remove the unused `LayoutGrid` import in `TabKalibrasi.tsx` and `Filter` import in `UnitPeralatanManager.tsx`;
  - remove unused collage file state and unused callback arguments in `LiveCollagePreview.tsx`;
  - remove the unused default React import from `MonitorSearchIcon.tsx`.

- [ ] **Step 6: Verify the baseline.**

  Run:

  ```powershell
  npm run typecheck
  npm run lint
  npm run test
  npm run build
  ```

  Expected: all commands exit with code `0`; `git status --short` shows no modifications under `dist/` created by this task.

- [ ] **Step 7: Commit.**

  ```powershell
  git add package.json package-lock.json eslint.config.js vitest.config.ts src/test src/components/features/AssetManager.tsx src/components/features/TabInitialReport.tsx src/components/features/TabKalibrasi.tsx src/components/features/UnitPeralatanManager.tsx src/components/shared/LiveCollagePreview.tsx src/components/shared/MonitorSearchIcon.tsx
  git commit -m "chore: establish frontend quality gates"
  ```

## Task 2: Define browser configuration and typed domain contracts

**Files:**

- Create: `src/lib/config/env.ts`
- Create: `src/lib/types/domain.ts`
- Create: `src/lib/supabase/database.types.ts`
- Modify: `src/lib/supabaseClient.ts`
- Modify: `src/lib/data/constants.ts`
- Modify: `.env.example`
- Create: `src/lib/config/env.test.ts`

**Interfaces:**

- Produces `getBrowserEnv(): BrowserEnv`.
- Produces `Database`, `ReportKind`, `ReportAttachment`, `ShiftCode`, `ChecklistShiftData`, and `GoogleReportPayload` types.
- Consumes `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_REPORTS_API_BASE_URL` only.

- [ ] **Step 1: Write failing configuration tests.**

  `src/lib/config/env.test.ts` must test a missing optional integration separately from an invalid Supabase pair:

  ```ts
  import { describe, expect, it } from 'vitest'
  import { parseBrowserEnv } from './env'

  describe('parseBrowserEnv', () => {
    it('rejects a partial Supabase configuration', () => {
      expect(() => parseBrowserEnv({ VITE_SUPABASE_URL: 'https://example.supabase.co' }))
        .toThrow('VITE_SUPABASE_ANON_KEY must be set when VITE_SUPABASE_URL is set')
    })

    it('allows a browser without optional reports integration', () => {
      expect(parseBrowserEnv({})).toMatchObject({ supabase: null, reportsApiBaseUrl: '/api' })
    })
  })
  ```

- [ ] **Step 2: Implement `parseBrowserEnv` and `getBrowserEnv`.**

  `parseBrowserEnv` must return:

  ```ts
  export type BrowserEnv = {
    supabase: { url: string; anonKey: string } | null
    reportsApiBaseUrl: string
  }
  ```

  It must reject only a partial Supabase pair, trim trailing slashes from `VITE_REPORTS_API_BASE_URL`, and default that API base to `/api`.

- [ ] **Step 3: Add checked-in database types from the live Supabase schema.**

  Before editing application queries, authenticate the Supabase CLI with an authorised project account and run the following explicit confirmation gate:

  ```powershell
  $projectRef = Read-Host 'Enter the approved Supabase project ref'
  if ($projectRef -notmatch '^[a-z0-9]{20}$') { throw 'Invalid Supabase project ref' }
  npx supabase gen types typescript --project-id $projectRef | Out-File -Encoding utf8 src/lib/supabase/database.types.ts
  ```

  Enter the project reference only after the repository owner confirms the target Supabase project. Commit the generated output unchanged. This is a required authority checkpoint because the repository does not contain a schema migration directory and `database.md` is known to be stale.

- [ ] **Step 4: Implement typed client construction.**

  `src/lib/supabaseClient.ts` must export `supabase: SupabaseClient<Database> | null` and a helper:

  ```ts
  export function requireSupabase(): SupabaseClient<Database> {
    if (!supabase) throw new Error('Supabase is not configured for this deployment')
    return supabase
  }
  ```

  Replace direct imports only in files touched by later tasks; do not mass-edit all features in this task.

- [ ] **Step 5: Remove the hard-coded Apps Script URL from browser constants.**

  Replace `GOOGLE_SHEETS_WEBAPP_URL` with an `API_REPORTS_BASE_URL` value derived from `getBrowserEnv()`. `.env.example` must document only browser-safe values:

  ```dotenv
  VITE_SUPABASE_URL=
  VITE_SUPABASE_ANON_KEY=
  VITE_REPORTS_API_BASE_URL=/api
  ```

- [ ] **Step 6: Verify.**

  Run: `npm run test -- src/lib/config/env.test.ts; npm run typecheck; npm run lint; npm run build`

  Expected: all commands exit with code `0`.

- [ ] **Step 7: Commit.**

  ```powershell
  git add src/lib/config src/lib/types src/lib/supabase src/lib/supabaseClient.ts src/lib/data/constants.ts .env.example
  git commit -m "refactor: add typed runtime configuration"
  ```

## Task 3: Make master-data, location rules, and realtime checklist state reliable

**Files:**

- Modify: `src/store/useMasterDataStore.ts`
- Modify: `src/lib/utils/locationRules.ts`
- Modify: `src/lib/services/checklistSyncService.ts`
- Modify: `src/components/features/TabChecklist.tsx`
- Create: `src/lib/utils/locationRules.test.ts`
- Create: `src/lib/services/checklistSyncService.test.ts`

**Interfaces:**

- Consumes `Database` and domain types from Task 2.
- Produces pure location functions that accept placement rows as arguments rather than reading Zustand internally.
- Produces `mergeChecklistShiftData(current, incoming): ChecklistShiftData`.

- [ ] **Step 1: Write failing pure-location tests.**

  Test three exact cases: an X-Ray model is filtered by location and point; multi-equipment locations use set intersection; HBSCP supervisor mapping distinguishes ranges `1.1-1.6`, `2.1-2.6`, and excludes `2.7-2.8`.

  ```ts
  expect(getChecklistSupervisorKeys(['HBSCP'], { HBSCP: '2.7-2.8' })).toEqual([])
  ```

- [ ] **Step 2: Refactor `locationRules.ts` into pure selectors.**

  Replace hidden store reads with signatures shaped like:

  ```ts
  export function getLocationOptions(placements: AssetPlacement[], equipment: string): string[]
  export function getPointOptions(placements: AssetPlacement[], location: string, equipment: string[]): string[]
  export function getChecklistSupervisorKeys(locations: string[], points: Record<string, string>): string[]
  ```

  Feature components may obtain `penempatanData` from Zustand and pass it explicitly. Keep compatibility wrappers only until all four current callers are migrated, then delete them.

- [ ] **Step 3: Write failing merge tests for concurrent checklist updates.**

  Test that an incoming payload for the same `shiftKey` never clears an existing supervisor value with an empty string and that a newer `updatedAt` wins for the same key.

- [ ] **Step 4: Implement version-aware checklist persistence.**

  Add `updatedAt` comparison and `shiftKey` validation before applying broadcast or Postgres changes. Debounce toggle persistence by 300ms, immediately broadcast optimistic UI state, and surface a retry control when the upsert fails.

- [ ] **Step 5: Replace `any` in `useMasterDataStore`.**

  Type each public state property and query result with Task 2 domain types. Replace sequential personnel writes with one validated bulk upsert and a scoped delete transaction/API operation; do not delete personnel until the submitted unit and IDs have been validated.

- [ ] **Step 6: Add deterministic loading/error states.**

  Add `status: 'idle' | 'loading' | 'ready' | 'error'` and `lastError: string | null` to the master-data store. Components must render available fallback data plus a non-blocking warning when cloud data is unavailable; do not claim offline persistence unless draft persistence is actually implemented.

- [ ] **Step 7: Verify.**

  Run: `npm run test -- src/lib/utils/locationRules.test.ts src/lib/services/checklistSyncService.test.ts; npm run typecheck; npm run lint; npm run build`

  Expected: all commands exit with code `0`; a manual two-browser checklist test keeps both tabs converged after three rapid toggle changes.

- [ ] **Step 8: Commit.**

  ```powershell
  git add src/store/useMasterDataStore.ts src/lib/utils/locationRules.ts src/lib/services/checklistSyncService.ts src/components/features/TabChecklist.tsx src/lib/utils/locationRules.test.ts src/lib/services/checklistSyncService.test.ts
  git commit -m "refactor: harden master data and checklist sync"
  ```

## Task 4: Centralise report attachments and submission without changing report text

**Files:**

- Create: `src/lib/media/photoWorkflow.ts`
- Create: `src/lib/media/photoWorkflow.test.ts`
- Create: `src/lib/services/reportSubmissionService.ts`
- Create: `src/lib/services/reportSubmissionService.test.ts`
- Create: `src/components/shared/ReportAttachments.tsx`
- Modify: `src/lib/utils/canvasUtils.ts`
- Modify: `src/lib/services/shareService.ts`
- Modify: `src/components/features/TabBriefing.tsx`
- Modify: `src/components/features/TabStoring.tsx`
- Modify: `src/components/features/TabKegiatan.tsx`
- Modify: `src/components/features/TabBASerahTerima.tsx`

**Interfaces:**

- Produces `prepareAttachments(photos: ReportPhoto[]): Promise<PreparedAttachments>`.
- Produces `submitReport(input: ReportSubmissionInput): Promise<ReportSubmissionResult>`.
- `ReportSubmissionInput` contains `message`, `attachments`, optional `cloudPayload`, and a required `share` callback.

- [ ] **Step 1: Write attachment tests.**

  Cover these exact outcomes:

  ```ts
  expect(classifyAttachments([])).toEqual({ images: [], videos: [] })
  expect(selectPrimaryImage([oneImage, oneVideo])).toBe(oneImage)
  expect(selectPrimaryImage([oneVideo])).toBeNull()
  ```

- [ ] **Step 2: Implement `photoWorkflow.ts`.**

  Move image compression, image/video classification, collage choice, and object-URL disposal into pure or narrowly browser-bound helpers. Preserve the current rule: one image is shared directly; two or more images become one collage; videos remain separate share attachments.

- [ ] **Step 3: Write report submission tests.**

  Test that a report is shared when cloud sync rejects, a successful cloud sync does not block share, and an `AbortError` from native share does not open WhatsApp fallback.

- [ ] **Step 4: Implement `submitReport`.**

  It must perform `cloudSync` first as a non-blocking attempt, then invoke `shareToWhatsApp`, and return explicit `{ synced: boolean, shared: boolean, syncError?: string }`. It must never report cloud success before the request resolves.

- [ ] **Step 5: Replace repeated simple attachment logic.**

  Migrate Briefing, Storing, Kegiatan, and BA Serah Terima to `ReportAttachments` and `submitReport`. Keep every existing `generateWA_*` call and exact payload field mapping intact. The BA signature remains print-only until the business owner confirms whether signatures must be stored or sent.

- [ ] **Step 6: Verify output compatibility.**

  Add snapshot tests for `generateWA_Briefing`, `generateWA_Storing`, `generateWA_Kegiatan`, and `generateWA_BASerahTerima` using current representative payloads. The snapshots must match the pre-refactor reports byte-for-byte.

- [ ] **Step 7: Verify and commit.**

  Run: `npm run test; npm run typecheck; npm run lint; npm run build`

  Commit:

  ```powershell
  git add src/lib/media src/lib/services/reportSubmissionService.ts src/components/shared/ReportAttachments.tsx src/lib/services/shareService.ts src/lib/utils/canvasUtils.ts src/components/features/TabBriefing.tsx src/components/features/TabStoring.tsx src/components/features/TabKegiatan.tsx src/components/features/TabBASerahTerima.tsx
  git commit -m "refactor: centralize report attachments and sharing"
  ```

## Task 5: Split large operational tabs by responsibility

**Files:**

- Modify: `src/components/features/TabInitialReport.tsx`
- Create: `src/components/features/initial-report/InitialReportForm.tsx`
- Create: `src/components/features/initial-report/useInitialReport.ts`
- Create: `src/components/features/initial-report/initialReportValidation.ts`
- Modify: `src/components/features/TabPerbaikan.tsx`
- Create: `src/components/features/perbaikan/PerbaikanForm.tsx`
- Create: `src/components/features/perbaikan/usePerbaikan.ts`
- Create: `src/components/features/perbaikan/perbaikanValidation.ts`
- Modify: `src/components/features/TabKalibrasi.tsx`
- Create: `src/components/features/kalibrasi/KalibrasiEntryForm.tsx`
- Create: `src/components/features/kalibrasi/useKalibrasi.ts`
- Create: `src/components/features/kalibrasi/kalibrasiValidation.ts`
- Create: `src/components/features/initial-report/initialReportValidation.test.ts`
- Create: `src/components/features/perbaikan/perbaikanValidation.test.ts`
- Create: `src/components/features/kalibrasi/kalibrasiValidation.test.ts`

**Interfaces:**

- Produces `validateInitialReport`, `validatePerbaikan`, and `validateKalibrasi` returning `Record<string, string>` keyed by field path.
- Tab files remain the route-level composition root only; hooks own form state and submit preparation; form components own JSX.

- [ ] **Step 1: Write validation tests before extracting UI.**

  Cover missing equipment/location/technician, malformed bullet placeholders (`'•'`, `'• '`), same-day end-time-in-future rejection, and the ETD-verification exception that omits initial-indication validation.

- [ ] **Step 2: Extract Initial Report state and validation.**

  `useInitialReport.ts` must expose `{ form, errors, setField, setLocations, submit }`. `InitialReportForm.tsx` receives that interface plus typed equipment, technician, and attachment props. Keep manual-location selection and multi-location formatting unchanged.

- [ ] **Step 3: Extract Perbaikan state and validation.**

  Keep automatic `sumberLaporan` selection based on the existing Custom-location rules, duration calculation across midnight, technician selection, and ETD verification behaviour. The final submit path must call Task 4 `submitReport`.

- [ ] **Step 4: Extract Kalibrasi entry state and validation.**

  Keep the mutually exclusive Access Control selection, equipment-specific fields, default `'+- 1 bulan'` archive values, and dynamic model/location selection. Add explicit typed fields for every calibration parameter instead of `any`.

- [ ] **Step 5: Add component tests.**

  Use React Testing Library to verify that each form shows its field error after submit, that a valid minimal payload calls the provided submit handler once, and that selecting Access Control clears incompatible equipment selection.

- [ ] **Step 6: Verify mobile rendering.**

  Use Playwright at `375x812` to open each tab, upload a mock image, add a second location, and ensure no horizontal page overflow.

- [ ] **Step 7: Verify and commit.**

  Run: `npm run test; npm run typecheck; npm run lint; npm run build; npm run test:e2e`

  Commit:

  ```powershell
  git add src/components/features/TabInitialReport.tsx src/components/features/initial-report src/components/features/TabPerbaikan.tsx src/components/features/perbaikan src/components/features/TabKalibrasi.tsx src/components/features/kalibrasi tests/e2e
  git commit -m "refactor: modularize operational report forms"
  ```

## Task 6: Move Google Sheets writes behind an authenticated server boundary

**Files:**

- Create: `netlify/functions/reports.ts`
- Create: `netlify/functions/reports.test.ts`
- Modify: `src/lib/services/sheetsSyncService.ts`
- Create: `src/lib/services/googleReportsClient.ts`
- Modify: `src/components/features/TabShiftReport.tsx`
- Modify: `Code.gs`
- Modify: `netlify.toml`
- Modify: `.env.example`

**Interfaces:**

- Browser calls `POST /api/reports` and `GET /api/reports?date=YYYY-MM-DD`.
- Netlify function validates `GoogleReportPayload`, injects `SSES_GAS_TOKEN`, and forwards to Apps Script.
- Apps Script rejects every request without the matching token in its JSON body.

- [ ] **Step 1: Write function tests.**

  Test that malformed payloads return `400`, a missing server secret returns `503`, and a valid request forwards only whitelisted fields plus `token`.

- [ ] **Step 2: Implement the Netlify reports function.**

  It must accept only `GET` and `POST`, set `Cache-Control: no-store`, validate report action names against `save_report`, `update_report`, `delete_report`, `save_pdf`, and `get_daily`, and return the Apps Script JSON response unchanged on success.

- [ ] **Step 3: Add server-only environment variables.**

  Document these in `.env.example` without values:

  ```dotenv
  GOOGLE_APPS_SCRIPT_URL=
  SSES_GAS_TOKEN=
  ```

  Configure them in Netlify's server-side environment, not in browser-visible build variables.

- [ ] **Step 4: Authenticate Apps Script requests.**

  In `Code.gs`, add `getRequiredToken()` using `PropertiesService.getScriptProperties()`. At the start of `doPost`, compare `data.token` to that value. At the start of `doGet`, compare `e.parameter.token` to that value. Return `{ status: 'error', message: 'Unauthorized' }` before any Sheets or Drive operation on mismatch.

- [ ] **Step 5: Migrate browser services and Shift Report.**

  `sheetsSyncService.ts` must call the same-origin function, await the response for all operations, and return a discriminated success/error result. `TabShiftReport.tsx` must replace raw Apps Script fetches with `googleReportsClient` and refresh the list only after a confirmed CRUD response.

- [ ] **Step 6: Verify integration in a non-production Google Sheet.**

  Create a test report, update it, delete it, generate a PDF, and read a daily report. Confirm direct unauthenticated Apps Script requests are rejected and browser bundles contain neither `SSES_GAS_TOKEN` nor `GOOGLE_APPS_SCRIPT_URL`.

- [ ] **Step 7: Verify and commit.**

  Run: `npm run test; npm run typecheck; npm run lint; npm run build`

  Commit:

  ```powershell
  git add netlify/functions/reports.ts netlify/functions/reports.test.ts src/lib/services/sheetsSyncService.ts src/lib/services/googleReportsClient.ts src/components/features/TabShiftReport.tsx Code.gs netlify.toml .env.example
  git commit -m "feat: secure Google report integration"
  ```

## Task 7: Complete typed admin CRUD and operational safeguards

**Files:**

- Modify: `src/components/features/TabData.tsx`
- Modify: `src/components/features/AssetManager.tsx`
- Modify: `src/components/features/AssetMasterLokasi.tsx`
- Modify: `src/components/features/AssetMasterPeralatan.tsx`
- Modify: `src/components/features/UnitPeralatanManager.tsx`
- Modify: `src/components/features/ScheduleUploader.tsx`
- Modify: `src/components/features/SparepartManager.tsx`
- Create: `src/components/features/ScheduleUploader.test.tsx`
- Create: `src/components/features/AssetManager.test.tsx`

**Interfaces:**

- Admin mutations return `Promise<Result<T>>`, where `Result<T> = { ok: true; data: T } | { ok: false; message: string }`.
- Schedule parser returns `{ rows: ShiftUpsert[]; skipped: ScheduleRowIssue[] }` before database writes.

- [ ] **Step 1: Write parser tests for Excel schedules.**

  Test detection of `CODE` and `NIK`, a matched NIK, an unmatched NIK recorded as a skipped row, an `OFF` cell excluded from upsert, and duplicate `personel_id/tanggal` rows collapsed before submitting.

- [ ] **Step 2: Extract a pure schedule parser.**

  Create `src/lib/services/scheduleParser.ts`; keep XLSX file I/O in `ScheduleUploader.tsx`, but move header discovery and row conversion into the parser. Show skipped personnel count and NIKs in the UI before confirming an upload.

- [ ] **Step 3: Guard destructive admin actions.**

  Replace generic `window.confirm` copy with action-specific confirmation text that states exact impact. For schedule deletion, display the calculated inclusive date range before calling Supabase. After mutation, refresh the affected store slice and show success/failure status.

- [ ] **Step 4: Replace GenericCrudTable or remove it.**

  It is not used by the operational admin dashboard. Remove it if no importer exists; otherwise convert it to accept typed column definitions and mutation callbacks. Do not leave a demo-only CRUD path in production source.

- [ ] **Step 5: Verify and commit.**

  Run: `npm run test; npm run typecheck; npm run lint; npm run build`

  Commit:

  ```powershell
  git add src/components/features/TabData.tsx src/components/features/AssetManager.tsx src/components/features/AssetMasterLokasi.tsx src/components/features/AssetMasterPeralatan.tsx src/components/features/UnitPeralatanManager.tsx src/components/features/ScheduleUploader.tsx src/components/features/SparepartManager.tsx src/lib/services/scheduleParser.ts src/components/features/ScheduleUploader.test.tsx src/components/features/AssetManager.test.tsx
  git commit -m "refactor: harden admin data workflows"
  ```

## Task 8: Add CI, browser checks, and dependency controls

**Files:**

- Create: `.github/workflows/quality.yml`
- Create: `playwright.config.ts`
- Create: `tests/e2e/report-workflows.spec.ts`
- Modify: `package.json`
- Modify: `README.md`

**Interfaces:**

- CI runs install, typecheck, lint, unit tests with coverage, build, and Playwright on every pull request and main-branch push.

- [ ] **Step 1: Configure Playwright for the Vite development server.**

  Configure `baseURL: 'http://127.0.0.1:3000'`, a `webServer` command of `npm run dev`, Chromium mobile viewport `375x812`, and screenshots/videos only on test failure.

- [ ] **Step 2: Write critical E2E workflows.**

  `report-workflows.spec.ts` must cover:

  - opening Initial Report and detecting required-field errors;
  - selecting two attachments and seeing a collage preview;
  - opening Checklist and toggling an item without horizontal overflow;
  - opening Tab Data while unauthenticated and seeing the login form.

- [ ] **Step 3: Add GitHub Actions quality workflow.**

  Use Node 22, `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test:coverage`, `npm run build`, then `npx playwright install --with-deps chromium` and `npm run test:e2e`. Upload the Playwright report as an artifact when a job fails.

- [ ] **Step 4: Add dependency review discipline.**

  Add `npm run deps:check` using `npm outdated --depth=0` for report-only use. Do not add automatic upgrades; dependency changes require a separate PR with typecheck, tests, build, and mobile smoke verification.

- [ ] **Step 5: Verify and commit.**

  Run: `npm run typecheck; npm run lint; npm run test:coverage; npm run build; npm run test:e2e`

  Commit:

  ```powershell
  git add .github/workflows/quality.yml playwright.config.ts tests/e2e package.json package-lock.json README.md
  git commit -m "ci: enforce application quality checks"
  ```

## Task 9: Bring documentation and project metadata up to date

**Files:**

- Modify: `README.md`
- Modify: `architecture.md`
- Modify: `database.md`
- Modify: `prd.md`
- Modify: `agent.md`
- Modify: `design-system/sses-t2-report/MASTER.md`
- Create: `docs/operations/google-integration.md`
- Create: `docs/development/testing.md`
- Create: `docs/development/data-contracts.md`
- Create: `CHANGELOG.md`

**Interfaces:**

- Documentation names the 12 current tabs and their actual persistence/share destinations.
- Database documentation derives from `src/lib/supabase/database.types.ts`, not assumptions.

- [ ] **Step 1: Update product and README documentation from current source.**

  List all 12 tabs, including BA Serah Terima and Shift Report. For every tab, state whether it writes Supabase, calls the reports API, only shares WhatsApp, or exports locally. Remove claims of automatic localStorage draft persistence unless Task 3 explicitly implements it.

- [ ] **Step 2: Rewrite the architecture diagram.**

  The architecture must show the browser calling Supabase directly only for RLS-protected data/auth/realtime and calling Netlify `/api/reports` for Google reporting. It must show Netlify forwarding authenticated requests to Google Apps Script and Apps Script writing to Sheets/Drive.

- [ ] **Step 3: Regenerate the database contract document.**

  Replace `config_key/config_value` with the actual generated `master_configs` column names and document `unit_peralatan`, `spareparts`, and `stock_mutations`, which current source uses but the old document omits. Include RLS policy intent per table: public operational reads only where approved; authenticated admin writes; no unrestricted anonymous destructive mutation.

- [ ] **Step 4: Update developer guidance.**

  `agent.md` must state the exact quality commands, the module boundaries introduced by Tasks 4 and 5, the no-new-`any` rule, environment-variable boundaries, and the requirement to update docs/tests with code changes. Remove stale references to 11 tabs and local cache fallback.

- [ ] **Step 5: Correct design-system metadata.**

  Replace the unrelated “Password Manager” project/category and purple palette guidance with the implemented SSES blue/slate mobile operations UI, or archive the file if it is not an active source of design decisions. Do not retain conflicting visual guidance.

- [ ] **Step 6: Add operational runbooks and changelog.**

  `google-integration.md` documents Apps Script deployment, Script Properties token configuration, Netlify secret configuration, and a safe non-production smoke test. `testing.md` documents local commands and expected results. `data-contracts.md` identifies the generated type source and regeneration command. `CHANGELOG.md` starts with this hardening release and enumerates user-visible changes only.

- [ ] **Step 7: Verify documentation accuracy.**

  Run:

  ```powershell
  rg -n "11 tab|11 fitur|config_key|config_value|localStorage fallback|Password Manager" README.md architecture.md database.md prd.md agent.md design-system docs
  npm run typecheck
  npm run lint
  npm run test
  npm run build
  ```

  Expected: the search returns no stale claims; all quality commands exit with code `0`.

- [ ] **Step 8: Commit.**

  ```powershell
  git add README.md architecture.md database.md prd.md agent.md design-system/sses-t2-report/MASTER.md docs CHANGELOG.md
  git commit -m "docs: align documentation with hardened architecture"
  ```

## Task 10: Final release verification and controlled rollout

**Files:**

- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Create: `docs/operations/release-checklist.md`

**Interfaces:**

- Produces a repeatable release checklist with ownership and rollback steps.

- [ ] **Step 1: Run the complete local quality suite.**

  Run:

  ```powershell
  npm ci
  npm run typecheck
  npm run lint
  npm run test:coverage
  npm run build
  npm run test:e2e
  ```

  Expected: every command exits with code `0`; coverage thresholds configured in Vitest are met.

- [ ] **Step 2: Perform a staging smoke test.**

  Verify admin login, personel schedule upload, location-aware equipment selection, Initial Report sync/share, Storing-to-Checklist supervisor propagation, checklist realtime propagation across two browsers, Shift Report PDF generation, and authenticated Google report CRUD.

- [ ] **Step 3: Verify security boundaries.**

  Inspect the production browser bundle for `SSES_GAS_TOKEN` and `GOOGLE_APPS_SCRIPT_URL`; neither string may exist. Confirm unauthenticated direct Apps Script writes are rejected and an unauthenticated browser cannot perform admin mutations under RLS.

- [ ] **Step 4: Write rollback instructions.**

  `release-checklist.md` must state: deploy rollback via Netlify deploy history; restore prior Apps Script deployment version; restore the preceding Supabase migration only through a reviewed forward migration; never use production table truncation as rollback.

- [ ] **Step 5: Commit.**

  ```powershell
  git add README.md CHANGELOG.md docs/operations/release-checklist.md
  git commit -m "docs: add release verification checklist"
  ```

## Plan self-review

### Coverage

- TypeScript failures, linting, unit tests, E2E tests, CI, and build verification: Tasks 1 and 8.
- Duplicated form, photo, collage, sharing, and submission logic: Tasks 4 and 5.
- Supabase typing, master data, dynamic location rules, checklist realtime, and admin workflow safety: Tasks 2, 3, and 7.
- Google Sheets/Drive exposure and asynchronous reporting reliability: Task 6.
- Documentation drift, stale database schema claims, incorrect tab count, and stale design metadata: Task 9.
- Deployment, security checks, and rollback: Task 10.

### Deliberate authority checkpoints

- Generating the exact Supabase schema types requires the repository owner to confirm the target project reference.
- Deploying the Netlify function, configuring secrets, changing Apps Script properties, and applying RLS policies require access to the corresponding external consoles.
- These checkpoints are not implementation placeholders; they prevent a code change from targeting the wrong cloud project.

### Scope discipline

- The plan does not introduce a new state library, a new UI kit, a database rewrite, or automatic dependency upgrades.
- WhatsApp formatting is protected by compatibility snapshots before report-flow refactors.
- Generated output in `dist/` remains outside remediation commits.
