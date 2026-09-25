import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readProjectFile = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('Cloudinary settings belong to the admin Data sub-tab', () => {
  const dataTab = readProjectFile('src/components/features/TabData.tsx');
  const settingsPanel = readProjectFile('src/components/features/CloudinarySettingsPanel.tsx');

  assert.match(dataTab, /import \{ CloudinarySettingsPanel \} from '\.\/CloudinarySettingsPanel';/);
  assert.match(dataTab, /\{ id: 'cloudinary', label: 'Cloudinary CDN' \}/);
  assert.match(dataTab, /<CloudinarySettingsPanel\s*\/>/);

  assert.match(settingsPanel, /getCloudinaryConfig/);
  assert.match(settingsPanel, /setCloudinaryConfig/);
  assert.match(settingsPanel, /testCloudinaryConnection/);
  assert.match(settingsPanel, /Cloud Name/);
  assert.match(settingsPanel, /Upload Preset \(Unsigned\)/);
  assert.match(settingsPanel, /Simpan Pengaturan/);
});

test('Operational tabs call uploadPhotoToCloudinary', () => {
  const perbaikan = readProjectFile('src/components/features/TabPerbaikan.tsx');
  const storing = readProjectFile('src/components/features/TabStoring.tsx');
  const kegiatan = readProjectFile('src/components/features/TabKegiatan.tsx');
  const shiftReport = readProjectFile('src/components/features/TabShiftReport.tsx');

  assert.match(perbaikan, /import \{ uploadPhotoToCloudinary \} from '\.\.\/\.\.\/lib\/services\/cloudinaryService'/);
  assert.match(perbaikan, /await uploadPhotoToCloudinary\(/);

  assert.match(storing, /import \{ uploadPhotoToCloudinary \} from '\.\.\/\.\.\/lib\/services\/cloudinaryService'/);
  assert.match(storing, /await uploadPhotoToCloudinary\(/);

  assert.match(kegiatan, /import \{ uploadPhotoToCloudinary \} from '\.\.\/\.\.\/lib\/services\/cloudinaryService'/);
  assert.match(kegiatan, /await uploadPhotoToCloudinary\(/);

  assert.match(shiftReport, /import \{ uploadPhotoToCloudinary \} from '\.\.\/\.\.\/lib\/services\/cloudinaryService'/);
  assert.match(shiftReport, /await uploadPhotoToCloudinary\(/);
});

test('cloudinaryService: unsigned upload URL points to api.cloudinary.com', () => {
  const serviceContent = readProjectFile('src/lib/services/cloudinaryService.ts');
  assert.match(serviceContent, /https:\/\/api\.cloudinary\.com\/v1_1\/\$\{.*\}\/image\/upload/);
  assert.match(serviceContent, /upload_preset/);
  assert.match(serviceContent, /export const uploadPhotoToCloudinary/);
});

test('TabShiftReport: displays Tersimpan di Cloudinary and Buka di Cloudinary in photo viewer modal', () => {
  const shiftReport = readProjectFile('src/components/features/TabShiftReport.tsx');
  assert.match(shiftReport, /Tersimpan di Cloudinary/);
  assert.match(shiftReport, /Buka di Cloudinary/);
  assert.doesNotMatch(shiftReport, /Tersimpan di Google Drive/);
  assert.doesNotMatch(shiftReport, /Buka di Google Drive/);
});
