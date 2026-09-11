# Google Drive Settings Data Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Google Drive configuration UI from Report into its own admin-only sub-tab inside Data without changing the stored configuration or report behavior.

**Architecture:** Extract the existing modal form into a focused `GoogleDriveSettingsPanel` component. Render that component from a new `google_drive` branch in `TabData`, and remove only the settings-specific state, handler, button, modal, and icon imports from `TabShiftReport`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide React, Vite, Node.js built-in test runner.

## Global Constraints

- The Google Drive settings sub-tab must remain behind the existing Data admin login.
- Reuse `getGoogleScriptUrl()` and `setGoogleScriptUrl()` so the existing `sses_gdrive_script_url` value remains compatible.
- Do not change Google Drive upload, report generation, report photo display, or Drive link behavior.
- Preserve all pre-existing uncommitted work in `package.json`, `TabData.tsx`, `TabShiftReport.tsx`, and other files.
- Do not add a test framework or dependency for this focused UI relocation.

---

## File Structure

- Create `src/components/features/GoogleDriveSettingsPanel.tsx`: owns the URL field, save action, permission explanation, and saved feedback.
- Modify `src/components/features/TabData.tsx`: imports the panel, adds the `Google Drive` sub-tab, and renders it.
- Modify `src/components/features/TabShiftReport.tsx`: removes the old settings trigger and modal while retaining all Drive-backed report features.
- Create `tests/google-drive-settings-location.test.mjs`: source-level regression contract for the UI ownership change, using only Node built-ins.

### Task 1: Add the relocation regression contract

**Files:**

- Create: `tests/google-drive-settings-location.test.mjs`

**Interfaces:**

- Consumes: the source files listed in File Structure.
- Produces: a Node test that fails until the settings panel is owned and rendered by `TabData` and removed from `TabShiftReport`.

- [ ] **Step 1: Write the failing test**

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readProjectFile = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('Google Drive settings belong to the admin-only Data sub-tab', () => {
  const dataTab = readProjectFile('src/components/features/TabData.tsx');
  const reportTab = readProjectFile('src/components/features/TabShiftReport.tsx');
  const settingsPanel = readProjectFile('src/components/features/GoogleDriveSettingsPanel.tsx');

  assert.match(dataTab, /import \{ GoogleDriveSettingsPanel \} from '\.\/GoogleDriveSettingsPanel';/);
  assert.match(dataTab, /\{ id: 'google_drive', label: 'Google Drive' \}/);
  assert.match(dataTab, /activeSubTab === 'google_drive'/);
  assert.match(dataTab, /<GoogleDriveSettingsPanel\s*\/>/);

  assert.doesNotMatch(reportTab, /isDriveModalOpen/);
  assert.doesNotMatch(reportTab, /handleSaveDriveSettings/);
  assert.doesNotMatch(reportTab, /getGoogleScriptUrl|setGoogleScriptUrl/);
  assert.doesNotMatch(reportTab, /title="Konfigurasi Google Drive"/);

  assert.match(settingsPanel, /getGoogleScriptUrl/);
  assert.match(settingsPanel, /setGoogleScriptUrl/);
  assert.match(settingsPanel, /Pengaturan Google Drive Penyimpanan Foto/);
  assert.match(settingsPanel, /Simpan Pengaturan/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/google-drive-settings-location.test.mjs`

Expected: FAIL because `src/components/features/GoogleDriveSettingsPanel.tsx` does not exist yet.

- [ ] **Step 3: Commit the test**

```powershell
git add -- tests/google-drive-settings-location.test.mjs
git commit -m "test: define Google Drive settings ownership"
```

Expected: only the new test file is staged; no pre-existing working-tree changes are included.

### Task 2: Create the focused Google Drive settings panel

**Files:**

- Create: `src/components/features/GoogleDriveSettingsPanel.tsx`

**Interfaces:**

- Consumes: `getGoogleScriptUrl(): string` and `setGoogleScriptUrl(url: string): void` from `src/lib/services/googleDriveService.ts`.
- Produces: `GoogleDriveSettingsPanel: React.FC`, a self-contained settings panel with no props.

- [ ] **Step 1: Implement the minimal panel**

```tsx
import React, { useState } from 'react';
import { Check, CheckCircle, Folder, Settings } from 'lucide-react';
import { getGoogleScriptUrl, setGoogleScriptUrl } from '../../lib/services/googleDriveService';

export const GoogleDriveSettingsPanel: React.FC = () => {
  const [url, setUrl] = useState(() => getGoogleScriptUrl());
  const [saved, setSaved] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGoogleScriptUrl(url);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };

  return (
    <section className="p-3 sm:p-5 md:p-6 bg-slate-50 min-h-[500px]">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center gap-2">
          <Folder className="w-5 h-5 text-amber-300" />
          <h3 className="font-bold text-sm">Pengaturan Google Drive Penyimpanan Foto</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="google-drive-script-url" className="block text-xs font-bold text-slate-700 mb-1">
              Google Apps Script Web App URL
            </label>
            <input
              id="google-drive-script-url"
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              URL ini didapat dari deployment Google Apps Script Anda (Deploy as Web App).
            </p>
          </div>

          <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-blue-600" /> Status Izin Editor:
            </p>
            <p className="text-[11px] leading-relaxed text-blue-800">
              Folder Google Drive dan semua foto otomatis disetting <b>"Anyone with the link can edit"</b> sehingga semua staf teknisi &amp; pimpinan dapat melihat dan mengedit tanpa halangan akses.
            </p>
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-slate-200">
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              {saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Settings className="w-4 h-4" />}
              <span>{saved ? 'Tersimpan!' : 'Simpan Pengaturan'}</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
```

- [ ] **Step 2: Run the contract and confirm the remaining failures**

Run: `node --test tests/google-drive-settings-location.test.mjs`

Expected: FAIL because `TabData` does not yet render the panel and `TabShiftReport` still owns the old settings UI.

- [ ] **Step 3: Commit the focused component**

```powershell
git add -- src/components/features/GoogleDriveSettingsPanel.tsx
git commit -m "feat: add Google Drive settings panel"
```

Expected: only the new panel file is staged.

### Task 3: Move settings ownership from Report to Data

**Files:**

- Modify: `src/components/features/TabData.tsx:1-8,300-365`
- Modify: `src/components/features/TabShiftReport.tsx:3-20,49-52,171-178,510-527,1014-1073`

**Interfaces:**

- Consumes: `GoogleDriveSettingsPanel: React.FC` from Task 2.
- Produces: a `google_drive` Data sub-tab and a Report view with no configuration controls.

- [ ] **Step 1: Wire the panel into Data**

Add the import:

```tsx
import { GoogleDriveSettingsPanel } from './GoogleDriveSettingsPanel';
```

Add this tab entry after `tip_data_manager`:

```tsx
{ id: 'google_drive', label: 'Google Drive' }
```

Add this rendering branch before the final local-data editor fallback:

```tsx
) : activeSubTab === 'google_drive' ? (
  <GoogleDriveSettingsPanel />
) : (
```

The panel remains admin-only because `LocalDataEditor` is rendered only inside the authenticated branch of `TabData`.

- [ ] **Step 2: Remove configuration ownership from Report**

Change the Lucide import so settings-only icons are removed while Report icons remain:

```tsx
import {
  Calendar, FileText, Download, Loader2, CheckCircle, Clock, Plus,
  Edit, Trash2, X, Share2, ExternalLink, Sparkles, Printer
} from 'lucide-react';
```

Delete this service import from Report:

```tsx
import { getGoogleScriptUrl, setGoogleScriptUrl } from '../../lib/services/googleDriveService';
```

Delete the `isDriveModalOpen`, `gdriveUrlInput`, and `gdriveSaved` state declarations; delete `handleSaveDriveSettings`; delete the header button whose title is `Konfigurasi Google Drive`; and delete the complete `GOOGLE DRIVE CONFIG MODAL` conditional block. Retain every other Report state, handler, modal, Google Drive image URL, and external link.

- [ ] **Step 3: Run the relocation contract**

Run: `node --test tests/google-drive-settings-location.test.mjs`

Expected: PASS with one passing test.

- [ ] **Step 4: Run the production build**

Run: `npm run build`

Expected: exit code 0 and a successful Vite production build with no TypeScript or unresolved-import errors.

- [ ] **Step 5: Review and commit only the relocation hunks**

Because both target files contain pre-existing user edits, stage interactively and inspect the staged diff:

```powershell
git add -p -- src/components/features/TabData.tsx src/components/features/TabShiftReport.tsx
git diff --cached --check
git diff --cached -- src/components/features/TabData.tsx src/components/features/TabShiftReport.tsx
git commit -m "feat: move Google Drive settings to Data"
```

Expected: the staged diff contains only the new sub-tab integration and removal of the old Report settings controls. If a hunk mixes pre-existing work with this feature, leave that hunk unstaged and do not commit it.

### Task 4: Verify the admin-only browser flow

**Files:**

- Verify only; no source changes expected.

**Interfaces:**

- Consumes: the completed UI from Task 3.
- Produces: evidence that the user-visible relocation works without changing report behavior.

- [ ] **Step 1: Open the running application and inspect Report**

Navigate to `http://localhost:3000/`, open Report, and verify that the `Google Drive` configuration button is absent while report content and Drive photo links remain available.

- [ ] **Step 2: Inspect the unauthenticated Data state**

Log out if necessary, open Data, and verify that the admin login is shown and the Google Drive settings are not visible.

- [ ] **Step 3: Inspect the authenticated Data state**

Log in with the existing admin flow, verify a `Google Drive` sub-tab is present, open it, and confirm the current saved URL appears in the form.

- [ ] **Step 4: Verify persistence without altering the stored value**

Submit the unchanged URL, confirm the `Tersimpan!` feedback appears, switch to another sub-tab and back, and confirm the same value remains.

- [ ] **Step 5: Run final automated verification**

Run: `node --test tests/google-drive-settings-location.test.mjs`

Expected: PASS.

Run: `npm run build`

Expected: exit code 0.

