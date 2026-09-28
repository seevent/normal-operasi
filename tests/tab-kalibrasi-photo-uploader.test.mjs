import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

test('TabKalibrasi: uses shared PhotoUploader and cleans up redundant modal code', () => {
  const content = readFileSync(new URL('../src/components/features/TabKalibrasi.tsx', import.meta.url), 'utf8');

  assert.match(content, /import.*PhotoUploader.*from.*PhotoUploader/);
  assert.match(content, /<PhotoUploader/);
  assert.ok(!content.includes('editingKalibrasiPhoto'));
  assert.ok(!content.includes('handleKalibrasiSaveText'));
});
