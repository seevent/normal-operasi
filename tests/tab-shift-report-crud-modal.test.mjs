import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';

test('TabShiftReport: CRUD modal is extracted into ShiftReportCrudModal component', () => {
  const modalPath = new URL('../src/components/features/shift-report/ShiftReportCrudModal.tsx', import.meta.url);
  assert.ok(existsSync(modalPath), 'ShiftReportCrudModal.tsx should exist');

  const modalContent = readFileSync(modalPath, 'utf8');
  assert.match(modalContent, /export const ShiftReportCrudModal/);

  const tabShiftContent = readFileSync(new URL('../src/components/features/TabShiftReport.tsx', import.meta.url), 'utf8');
  assert.match(tabShiftContent, /import.*ShiftReportCrudModal.*from.*ShiftReportCrudModal/);
  assert.match(tabShiftContent, /<ShiftReportCrudModal/);
});
