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
