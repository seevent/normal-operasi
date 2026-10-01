> **Status (1 Oktober 2026): selesai.** Dikerjakan pada 28–29 September (modularisasi tab, konsolidasi `PhotoUploader` & pengambilan on-duty, penghapusan kode/dependensi mati termasuk Konva). Hasilnya dijaga oleh `tests/dead-code-cleanliness.test.mjs`, `tests/dependencies-cleanliness.test.mjs`, dan `tests/photo-uploader-consolidation.test.mjs`. Catatan "jangan commit dan deploy" di bawah berlaku saat rencana ini ditulis dan sudah tidak relevan.

# Codebase Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor high-priority architectural debt, eliminate duplicated logic (photo uploader, on-duty shift fetching), remove dead code, and modularize monolithic components without altering user-facing functionality.

**Architecture:** Decompose monolithic component trees into focused subcomponents, consolidate duplicate shift and technician fetching into central operational services, adopt the existing `<PhotoUploader />` component across editing tabs, and prune unreferenced dead code and dependencies.

**Tech Stack:** React 19, TypeScript, TanStack Start, Zustand, Tailwind CSS, Supabase JS, Node.js Test Runner.

## Global Constraints

- **Ponytail Ladder**: YAGNI first, reuse existing codebase helpers, native platform before dependencies, simplest working code.
- **No Functional Regressions**: All operational tabs must retain identical fields, behavior, and formatting.
- **Strict Verification**: Every task must be verified with automated test suites (`node --test tests/*.test.mjs`) and clean build (`npm run build`).
- **No Commit / Deploy**: User explicitly ordered: "Jangan comit dan deploy dulu". Changes remain staged or in working tree until user gives the go-ahead.

---

### Task 1: Eliminate Dead Code & Unused Store State

**Files:**
- Modify: `src/components/features/TabData.tsx:128-232`
- Modify: `src/store/useMasterDataStore.ts:26-32,64-76,243-323`
- Test: `tests/dead-code-cleanliness.test.mjs`

**Interfaces:**
- Consumes: `useMasterDataStore` from `src/store/useMasterDataStore.ts`
- Produces: Cleaner `MasterDataState` interface without orphan modal methods

- [x] **Step 1: Write verification test for removed dead code**

Create `tests/dead-code-cleanliness.test.mjs`:
```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readProjectFile = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('Dead code elimination: GenericCrudTable and masterModal methods are removed', () => {
  const tabData = readProjectFile('src/components/features/TabData.tsx');
  const store = readProjectFile('src/store/useMasterDataStore.ts');

  assert.ok(!tabData.includes('export const GenericCrudTable'), 'GenericCrudTable must be removed from TabData');
  assert.ok(!store.includes('openMasterModal:'), 'openMasterModal must be removed from store');
  assert.ok(!store.includes('masterModalOpen:'), 'masterModalOpen must be removed from store');
  assert.ok(!store.includes('loadMasterData ='), 'dummy loadMasterData must be removed');
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/dead-code-cleanliness.test.mjs`
Expected: FAIL (GenericCrudTable and masterModal still present).

- [x] **Step 3: Remove dead code in TabData.tsx and useMasterDataStore.ts**

1. In `src/components/features/TabData.tsx`: Remove `GenericCrudTable` component (lines 128-232).
2. In `src/store/useMasterDataStore.ts`:
   - Remove `loadMasterData` and `saveMasterDataToLocal` dummy functions.
   - Remove `masterModalOpen`, `setMasterModalOpen`, `masterModalData`, `setMasterModalData`, `openMasterModal`, `closeMasterModal`, `saveCurrentMasterModal`, `resetCurrentMasterModal`, `handleModalDataChange`, `addModalDataRow`, `removeModalDataRow` from interface and state.

- [x] **Step 4: Run test to verify it passes**

Run: `node --test tests/dead-code-cleanliness.test.mjs`
Expected: PASS

- [x] **Step 5: Run existing tests to ensure no regressions**

Run: `node --test tests/*.test.mjs`
Expected: All tests pass.

---

### Task 2: Prune Unused Dependencies in package.json & vite.config.ts

**Files:**
- Modify: `package.json:14,16,19,23,25`
- Modify: `vite.config.ts:23-25`
- Test: `tests/dependencies-cleanliness.test.mjs`

**Interfaces:**
- Consumes: Native 2D Canvas & Zustand
- Produces: Leaner dependency manifest without unused `konva`, `react-konva`, `use-image`, `@tanstack/react-store`, `@tanstack/store`

- [x] **Step 1: Write verification test for pruned dependencies**

Create `tests/dependencies-cleanliness.test.mjs`:
```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('Dependencies audit: unused libraries are removed from package.json and vite.config.ts', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const viteConfig = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8');

  assert.equal(pkg.dependencies['konva'], undefined);
  assert.equal(pkg.dependencies['react-konva'], undefined);
  assert.equal(pkg.dependencies['use-image'], undefined);
  assert.equal(pkg.dependencies['@tanstack/react-store'], undefined);
  assert.equal(pkg.dependencies['@tanstack/store'], undefined);

  assert.ok(!viteConfig.includes("'konva'"));
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/dependencies-cleanliness.test.mjs`
Expected: FAIL (dependencies still present in package.json and vite.config.ts).

- [x] **Step 3: Remove unused dependencies from package.json and vite.config.ts**

1. Remove `konva`, `react-konva`, `use-image`, `@tanstack/react-store`, and `@tanstack/store` from `package.json`.
2. Remove `ssr: { noExternal: ['konva', 'react-konva', 'use-image'] }` from `vite.config.ts`.

- [x] **Step 4: Run test and build verification**

Run: `node --test tests/dependencies-cleanliness.test.mjs`
Run: `npm run build`
Expected: PASS & Vite build finishes cleanly with code 0.

---

### Task 3: Unify Shift Calculation & On-Duty Technician Fetching

**Files:**
- Modify: `src/lib/services/operationalReportService.ts`
- Modify: `src/components/features/TabInitialReport.tsx:58-90`
- Modify: `src/components/features/TabPerbaikan.tsx:40-75`
- Modify: `src/components/features/TabBASerahTerima.tsx:80-116`
- Test: `tests/on-duty-technicians.test.mjs`

**Interfaces:**
- Consumes: Supabase `jadwal_shift`, `formatNamaPersonel`, `toTitleCase`
- Produces: `fetchOnDutyPersonnel(targetDate?: string, targetShift?: 'PS' | 'M'): Promise<{ id: string; name: string; unit: string; jabatan?: string }[]>`

- [x] **Step 1: Write test for fetchOnDutyPersonnel**

Create `tests/on-duty-technicians.test.mjs`:
```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const readProjectFile = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('Centralized on-duty technician service is exported and used across tabs', () => {
  const service = readProjectFile('src/lib/services/operationalReportService.ts');
  const tabInitial = readProjectFile('src/components/features/TabInitialReport.tsx');
  const tabPerbaikan = readProjectFile('src/components/features/TabPerbaikan.tsx');
  const tabBa = readProjectFile('src/components/features/TabBASerahTerima.tsx');

  assert.match(service, /export const fetchOnDutyPersonnel/);
  assert.match(tabInitial, /fetchOnDutyPersonnel/);
  assert.match(tabPerbaikan, /fetchOnDutyPersonnel/);
  assert.match(tabBa, /fetchOnDutyPersonnel/);
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/on-duty-technicians.test.mjs`
Expected: FAIL (`fetchOnDutyPersonnel` not yet implemented).

- [x] **Step 3: Implement fetchOnDutyPersonnel in operationalReportService.ts**

```typescript
export interface OnDutyPersonel {
  id: string;
  name: string;
  unit: string;
  jabatan?: string;
}

export const fetchOnDutyPersonnel = async (
  targetDate?: string,
  targetShift?: 'PS' | 'M'
): Promise<OnDutyPersonel[]> => {
  try {
    const { date: defaultDate, shift: defaultShift } = getOperationalShiftAndDate();
    const queryDate = targetDate || defaultDate;
    const queryShift = targetShift || defaultShift;

    const { data } = await supabase
      .from('jadwal_shift')
      .select('id, shift, status_kehadiran, personel:personel_id(id, nama, jabatan, unit_kerja(nama))')
      .eq('tanggal', queryDate)
      .neq('shift', 'D');

    if (!data) return [];

    return data
      .filter((d: any) => {
        const s = (d.shift || '').toUpperCase();
        const status = (d.status_kehadiran || '').toLowerCase();
        return s === queryShift && status !== 'sakit' && status !== 'cuti' && status !== 'libur';
      })
      .map((d: any) => ({
        id: String(d.id),
        name: formatNamaPersonel(toTitleCase(d.personel?.nama || '')),
        unit: d.personel?.unit_kerja?.nama || 'API T2',
        jabatan: d.personel?.jabatan || ''
      }))
      .filter(p => Boolean(p.name));
  } catch (err) {
    console.error('Error in fetchOnDutyPersonnel:', err);
    return [];
  }
};
```

- [x] **Step 4: Refactor TabInitialReport and TabPerbaikan to use fetchOnDutyPersonnel**

Replace the copy-pasted 35-line `fetchData` logic in both components with a one-line call:
```typescript
const teknisiList = await fetchOnDutyPersonnel();
setAvailableTeknisi(teknisiList);
```

- [x] **Step 5: Run tests and verify**

Run: `node --test tests/on-duty-technicians.test.mjs`
Run: `node --test tests/*.test.mjs`
Expected: PASS

---

### Task 4: Modularize TabShiftReport (Extract Print Document & WhatsApp Generator)

**Files:**
- Create: `src/components/features/shift-report/ShiftReportPrintDocument.tsx`
- Modify: `src/lib/utils/waGenerator.ts`
- Modify: `src/components/features/TabShiftReport.tsx`
- Test: `tests/shift-report-refactor.test.mjs`

**Interfaces:**
- Consumes: `reports: any[]`, `checklistSummary: ChecklistSummaryItem[]`, `date: string`, `shift: string`
- Produces: `generateWA_ShiftReport(reports, checklistSummary, date, shift)` in `waGenerator.ts` and `<ShiftReportPrintDocument />` component

- [x] **Step 1: Write test for modularized Shift Report parts**

Create `tests/shift-report-refactor.test.mjs`:
```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';

const readProjectFile = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('TabShiftReport modularization: print document and WA generator are decoupled', () => {
  const waGen = readProjectFile('src/lib/utils/waGenerator.ts');
  const tabShift = readProjectFile('src/components/features/TabShiftReport.tsx');

  assert.ok(existsSync(new URL('../src/components/features/shift-report/ShiftReportPrintDocument.tsx', import.meta.url)));
  assert.match(waGen, /export const generateWA_ShiftReport/);
  assert.match(tabShift, /ShiftReportPrintDocument/);
  assert.match(tabShift, /generateWA_ShiftReport/);
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/shift-report-refactor.test.mjs`
Expected: FAIL

- [x] **Step 3: Move generateShiftWaSummary to waGenerator.ts**

Export `generateWA_ShiftReport` from `src/lib/utils/waGenerator.ts`.

- [x] **Step 4: Create ShiftReportPrintDocument.tsx and wire in TabShiftReport.tsx**

Move the 500+ lines of printable PDF markup (`#printable-report`) to `ShiftReportPrintDocument.tsx`, keeping `pdfRef` bound to it via `ref` or container wrapper.

- [x] **Step 5: Run tests and verify build**

Run: `node --test tests/shift-report-refactor.test.mjs`
Run: `npm run build`
Expected: PASS

---

### Task 5: Consolidate Photo Upload UI with Shared `<PhotoUploader />`

**Files:**
- Modify: `src/components/features/TabPerbaikan.tsx`
- Modify: `src/components/features/TabInitialReport.tsx`
- Test: `tests/photo-uploader-consolidation.test.mjs`

**Interfaces:**
- Consumes: `<PhotoUploader photos={photos} onUpload={...} onRemove={...} onZoom={...} onDrop={...} onEdit={...} listType="..." />`
- Produces: Uniform photo upload UI across all reporting tabs, eliminating 500+ lines of duplicated thumbnail, zoom, and DnD code

- [x] **Step 1: Write test verifying PhotoUploader usage**

Create `tests/photo-uploader-consolidation.test.mjs`:
```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const readProjectFile = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('Photo uploader consolidation: TabInitialReport and TabPerbaikan use PhotoUploader', () => {
  const tabInitial = readProjectFile('src/components/features/TabInitialReport.tsx');
  const tabPerbaikan = readProjectFile('src/components/features/TabPerbaikan.tsx');

  assert.match(tabInitial, /import.*PhotoUploader.*from.*PhotoUploader/);
  assert.match(tabInitial, /<PhotoUploader/);
  assert.match(tabPerbaikan, /import.*PhotoUploader.*from.*PhotoUploader/);
  assert.match(tabPerbaikan, /<PhotoUploader/);
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/photo-uploader-consolidation.test.mjs`
Expected: FAIL

- [x] **Step 3: Refactor TabPerbaikan.tsx and TabInitialReport.tsx to use PhotoUploader**

Import `PhotoUploader` and replace custom inline JSX grids with `<PhotoUploader />`.

- [x] **Step 4: Run tests and verify build**

Run: `node --test tests/photo-uploader-consolidation.test.mjs`
Run: `node --test tests/*.test.mjs`
Run: `npm run build`
Expected: PASS

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-28-codebase-refactoring.md`.
Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach would you like to take? (Or do you want to review the plan first? Remember: no commit & deploy will happen until you approve.)**
