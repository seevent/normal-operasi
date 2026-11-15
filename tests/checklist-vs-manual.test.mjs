import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { getChecklistSummaryTarget } from '../src/lib/services/operationalReportService.ts';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const at = (iso) => new Date(iso); // waktu lokal (TZ proses uji)
const local = (y, mo, d, h, mi = 0) => new Date(y, mo - 1, d, h, mi, 0);

test('Kunci simpan Checklist: dinas malam setelah tengah malam = tanggal kemarin, cocok dengan tab Report', () => {
  // 15 Nov 2026
  assert.deepEqual(getChecklistSummaryTarget('2026-11-15', local(2026, 11, 15, 3, 52)), { date: '2026-11-14', shift: 'M' });
  assert.deepEqual(getChecklistSummaryTarget('2026-11-15', local(2026, 11, 15, 7, 59)), { date: '2026-11-14', shift: 'M' });
  assert.deepEqual(getChecklistSummaryTarget('2026-11-15', local(2026, 11, 15, 8, 0)), { date: '2026-11-15', shift: 'PS' });
  assert.deepEqual(getChecklistSummaryTarget('2026-11-15', local(2026, 11, 15, 14, 56)), { date: '2026-11-15', shift: 'PS' });
  assert.deepEqual(getChecklistSummaryTarget('2026-11-15', local(2026, 11, 15, 20, 0)), { date: '2026-11-15', shift: 'M' });
  assert.deepEqual(getChecklistSummaryTarget('2026-11-15', local(2026, 11, 15, 23, 30)), { date: '2026-11-15', shift: 'M' });
  // Awal bulan: kemarin menyeberang bulan.
  assert.deepEqual(getChecklistSummaryTarget('2026-12-01', local(2026, 12, 1, 2, 0)), { date: '2026-11-30', shift: 'M' });
  // Tanggal yang dipilih sendiri (bukan hari ini) dipakai apa adanya; shift tetap dari jam.
  assert.deepEqual(getChecklistSummaryTarget('2026-11-10', local(2026, 11, 15, 3, 0)), { date: '2026-11-10', shift: 'M' });
  assert.deepEqual(getChecklistSummaryTarget('2026-11-10', local(2026, 11, 15, 12, 0)), { date: '2026-11-10', shift: 'PS' });
});

test('Tab Report hanya menulis ke tabel manual; tab Checklist hanya ke tabel Checklist', () => {
  const report = read('src/components/features/TabShiftReport.tsx');
  assert.doesNotMatch(report, /\bsaveChecklistSummary\b/);
  assert.match(report, /saveManualChecklistSummary\(/);
  assert.match(report, /saveManualChecklistSummaryOnExit\(/);

  const checklist = read('src/components/features/TabChecklist.tsx');
  assert.doesNotMatch(checklist, /saveManualChecklistSummary/);
  assert.match(checklist, /getChecklistSummaryTarget\(checklistData\.tanggal\)/);
  assert.match(checklist, /saveChecklistSummary\(target\.date, target\.shift, summaryItems\)/);

  const svc = read('src/lib/services/operationalReportService.ts');
  assert.match(svc, /saveChecklistSummary = [\s\S]*?upsertSummary\('laporan_checklist',/);
  assert.match(svc, /saveManualChecklistSummary = [\s\S]*?upsertSummary\('laporan_checklist_manual',/);
  assert.match(svc, /saveManualChecklistSummaryOnExit[\s\S]*?upsertSummaryOnExit\('laporan_checklist_manual',/);
});

test('Tab Report membaca: edit manual menang untuk tanggal & shift yang sama, lalu data Checklist', () => {
  const svc = read('src/lib/services/operationalReportService.ts');
  const body = svc.match(/export const fetchChecklistSummary[\s\S]*?\n};/)?.[0] ?? '';
  const manualAt = body.indexOf("readRow('laporan_checklist_manual', tanggal, targetShift)");
  const checklistAt = body.indexOf("readRow('laporan_checklist', tanggal, targetShift)");
  assert.ok(manualAt > 0 && checklistAt > manualAt, 'manual dibaca lebih dulu daripada Checklist');
  assert.match(body, /newestSummaryRow\(\[manual, checklist\]\)/);
});

test('Migrasi: tabel manual baru, aditif, kunci (tanggal, shift), RLS seperti laporan_checklist', () => {
  const sql = read('supabase/migrations/20261115150000_laporan_checklist_manual.sql');
  assert.match(sql, /create table public\.laporan_checklist_manual/);
  assert.match(sql, /unique \(tanggal, shift\)/);
  assert.match(sql, /enable row level security/);
  for (const cmd of ['select', 'insert', 'update']) assert.match(sql, new RegExp(`for ${cmd} to anon, authenticated`));
  // Tabel lama tidak disentuh (aplikasi versi lama tetap berjalan).
  assert.doesNotMatch(sql, /alter table public\.laporan_checklist\b(?!_manual)/);
  assert.doesNotMatch(sql, /drop /);
});
