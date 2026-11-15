import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  MAX_UNIT_COUNT,
  applyServiceabilityEdit,
  newestSummaryRow,
  parseUnitCount,
  serviceabilityKey,
} from '../src/lib/utils/serviceabilityEdit.ts';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const item = (no, total, rusak) => ({
  no, nama: `ALAT ${no}`, total, rusak, operasi: total - rusak,
  persenOperasi: total ? (total - rusak) / total : 0, persenRusak: total ? rusak / total : 0,
});

test('parseUnitCount: digit apa pun dibaca, karakter lain diabaikan, kosong = null', () => {
  assert.equal(parseUnitCount('40'), 40);
  assert.equal(parseUnitCount('040'), 40);
  assert.equal(parseUnitCount('４０'), 40); // angka lebar penuh
  assert.equal(parseUnitCount('٤٠'), 40); // angka Arab-Indik
  assert.equal(parseUnitCount('४२'), 42); // angka Devanagari
  assert.equal(parseUnitCount(' 3 0 '), 30);
  assert.equal(parseUnitCount('25,'), 25);
  assert.equal(parseUnitCount('-7'), 7);
  assert.equal(parseUnitCount(''), null);
  assert.equal(parseUnitCount('abc'), null);
  assert.equal(parseUnitCount('123456'), MAX_UNIT_COUNT);
});

test('applyServiceabilityEdit: Total dan Off menghitung ulang Normal dan persen, item lain tetap', () => {
  const items = [item(1, 37, 0), item(5, 5, 1)];
  const a = applyServiceabilityEdit(items, 1, 'total', 40);
  assert.deepEqual([a[0].total, a[0].rusak, a[0].operasi], [40, 0, 40]);
  assert.equal(a[1], items[1]);
  const b = applyServiceabilityEdit(a, 1, 'rusak', 2);
  assert.deepEqual([b[0].total, b[0].rusak, b[0].operasi, b[0].persenRusak], [40, 2, 38, 0.05]);
  // Off tidak boleh melebihi Total; Total turun di bawah Off ikut menurunkan Off.
  assert.equal(applyServiceabilityEdit(b, 1, 'rusak', 99)[0].rusak, 40);
  const c = applyServiceabilityEdit(b, 1, 'total', 1);
  assert.deepEqual([c[0].total, c[0].rusak, c[0].operasi], [1, 1, 0]);
  const zero = applyServiceabilityEdit(b, 1, 'total', 0)[0];
  assert.deepEqual([zero.persenOperasi, zero.persenRusak], [0, 0]);
  assert.equal(applyServiceabilityEdit(b, 1, 'total', Number.NaN)[0].total, 0);
});

test('serviceabilityKey: hanya berubah bila angka berubah', () => {
  const items = [item(1, 37, 0)];
  assert.equal(serviceabilityKey(items), serviceabilityKey([{ ...items[0], nama: 'lain' }]));
  assert.notEqual(serviceabilityKey(items), serviceabilityKey(applyServiceabilityEdit(items, 1, 'total', 38)));
});

test('Diagram Serviceability: kolom angka aman untuk iPhone dan simpan tidak pernah diam-diam', () => {
  const diagram = read('src/components/features/shift-report/ServiceabilityDiagram.tsx');
  // Bukan type="number" (perilakunya beda antar-browser), keyboard angka, huruf >= 16px agar iOS tidak zoom.
  assert.doesNotMatch(diagram, /type="number"/);
  assert.match(diagram, /const unitInputProps = \{[\s\S]*?type: 'text',[\s\S]*?inputMode: 'numeric',/);
  assert.equal((diagram.match(/\{\.\.\.unitInputProps\}/g) ?? []).length, 2);
  assert.equal((diagram.match(/text-\[16px\]/g) ?? []).length, 2);
  assert.match(diagram, /type="button"[\s\S]*?onClick=\{handleManualSaveSummary\}/);
  assert.match(diagram, /Belum disimpan/);
  assert.match(diagram, /saveError/);

  const tab = read('src/components/features/TabShiftReport.tsx');
  // Updater state harus murni: tidak ada penjadwalan simpan di dalam setChecklistSummary(prev => ...).
  const updater = tab.match(/setChecklistSummary\(\(?prev\)? =>[\s\S]*?\);/)?.[0] ?? '';
  assert.match(updater, /applyServiceabilityEdit/);
  assert.doesNotMatch(updater, /setTimeout|saveChecklistSummary|setSaveStatus/);
  // Perubahan yang belum tersimpan dikirim saat pindah tab / halaman ditutup.
  assert.match(tab, /pagehide/);

  assert.match(tab, /addEventListener\('pagehide', flushOnExit\)/);
  assert.match(tab, /saveManualChecklistSummaryOnExit\(/);

  const svc = read('src/lib/services/operationalReportService.ts');
  assert.match(svc, /SAVE_TIMEOUT_MS/);
  // Penyimpanan saat halaman ditutup harus keepalive dan memakai upsert yang sama (tanggal, shift).
  const exit = svc.match(/const upsertSummaryOnExit[\s\S]*?\n};/)?.[0] ?? '';
  assert.match(exit, /keepalive: true/);
  assert.match(exit, /on_conflict=tanggal,shift/);
  assert.match(exit, /resolution=merge-duplicates/);
});

test('newestSummaryRow: yang terbaru menang, kosong/rusak diabaikan, tanpa waktu paling lama', () => {
  const row = (tag, at, summary = [item(1, 10, 0)]) => ({ tag, summary, created_at: at });
  assert.equal(newestSummaryRow([row('a', '2026-11-15T01:00:00Z'), row('b', '2026-11-15T02:00:00Z')]).tag, 'b');
  assert.equal(newestSummaryRow([row('b', '2026-11-15T02:00:00Z'), row('a', '2026-11-15T01:00:00Z')]).tag, 'b');
  assert.equal(newestSummaryRow([null, undefined, row('x', '2026-11-15T01:00:00Z', [])]), null);
  assert.equal(newestSummaryRow([row('t', null), row('u', '2026-11-14T00:00:00Z')]).tag, 'u');
  assert.equal(newestSummaryRow([row('t', null)]).tag, 't');
  assert.equal(newestSummaryRow([]), null);
});
