import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';

test('TabBASerahTerima: print document is decoupled into BADocumentPrint component', () => {
  const printDocPath = new URL('../src/components/features/ba-serah-terima/BADocumentPrint.tsx', import.meta.url);
  assert.ok(existsSync(printDocPath), 'BADocumentPrint.tsx should exist');

  const printDocContent = readFileSync(printDocPath, 'utf8');
  assert.match(printDocContent, /export const BADocumentPrint/);

  const tabBaContent = readFileSync(new URL('../src/components/features/TabBASerahTerima.tsx', import.meta.url), 'utf8');
  assert.match(tabBaContent, /import.*BADocumentPrint.*from.*BADocumentPrint/);
  assert.match(tabBaContent, /<BADocumentPrint/);
});
