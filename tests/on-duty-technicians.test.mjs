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
