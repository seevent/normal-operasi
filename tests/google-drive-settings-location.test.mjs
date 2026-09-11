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
