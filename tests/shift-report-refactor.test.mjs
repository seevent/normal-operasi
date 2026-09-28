import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';

const readProjectFile = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('TabShiftReport modularization: print document and WA generator are decoupled', () => {
  const waGen = readProjectFile('src/lib/utils/waGenerator.ts');
  const tabShift = readProjectFile('src/components/features/TabShiftReport.tsx');

  assert.ok(existsSync(new URL('../src/components/features/shift-report/ShiftReportPrintDocument.tsx', import.meta.url)), 'ShiftReportPrintDocument must exist');
  assert.match(waGen, /export const generateWA_ShiftReport/, 'generateWA_ShiftReport must be exported from waGenerator');
  assert.match(tabShift, /ShiftReportPrintDocument/, 'TabShiftReport must use ShiftReportPrintDocument');
  assert.match(tabShift, /generateWA_ShiftReport/, 'TabShiftReport must use generateWA_ShiftReport');
});
