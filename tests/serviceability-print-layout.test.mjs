import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { layoutServiceabilityPrint } from '../src/lib/utils/serviceabilityPrintLayout.ts';
import { SERVICEABILITY_STYLE, CHART_ANCHOR } from '../src/lib/utils/serviceabilityChart.ts';
import { SHEET_COLUMN_PX } from '../src/lib/utils/shiftReportWorkbook.ts';

const items = [
  { nama: 'XRAY', operasi: 37, rusak: 0, total: 37 },
  { nama: 'WTMD', operasi: 22, rusak: 0, total: 22 },
  { nama: 'HHMD', operasi: 26, rusak: 0, total: 26 },
  { nama: 'BODY SCANNER', operasi: 7, rusak: 0, total: 7 },
  { nama: 'ETD', operasi: 4, rusak: 1, total: 5 },
  { nama: 'ACCESS CONTROL', operasi: 71, rusak: 0, total: 71 },
  { nama: 'CCTV', operasi: 48, rusak: 0, total: 48 },
];
const L = layoutServiceabilityPrint(items);
const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-6, `${msg}: ${a} != ${b}`);

test('tabel PDF: tujuh kolom tanpa judul, urutan & warna isian sama dengan Excel', () => {
  assert.equal(L.table.length, 7 * items.length, 'tidak ada baris header');
  const etd = L.table.slice(4 * 7, 5 * 7);
  assert.deepEqual(etd.map((c) => c.text), ['5', 'ETD', '80%', '4', '20%', '1', '5']);
  assert.deepEqual(etd.map((c) => c.fill), SERVICEABILITY_STYLE.tableFills.map((h) => `#${h}`));
  // Lebar kolom = kolom F-L pada sheet Excel, tinggi baris 18,75 pt
  assert.deepEqual(etd.map((c) => c.w), SHEET_COLUMN_PX.slice(5, 12));
  close(etd[0].h, 18.75 * 96 / 72, 'tinggi baris');
});

test('grafik PDF: ukuran, judul dan area plot sama dengan grafik Excel', () => {
  close(L.chart.w, CHART_ANCHOR.cx / 9525, 'lebar');
  close(L.chart.h, CHART_ANCHOR.cy / 9525, 'tinggi');
  assert.equal(L.chart.title.text, 'TABEL PERFORMA PERALATAN');
  close(L.chart.plot.w, SERVICEABILITY_STYLE.plot.w * L.chart.w, 'lebar plot');
  assert.deepEqual(L.colors, { ops: '#9DC3E6', off: '#FF0000', grid: '#B7B7B7' });
  assert.deepEqual(L.chart.gridlines.map((g) => g.label), ['0%', '10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%', '100%']);
});

test('grafik PDF: batang OPS & OFF berkelompok dengan celah 150%, tinggi sesuai persentase', () => {
  assert.equal(L.chart.bars.length, 2 * items.length);
  const [ops, off] = L.chart.bars.slice(8, 10); // ETD
  assert.equal(ops.fill, '#9DC3E6');
  assert.equal(off.fill, '#FF0000');
  assert.deepEqual([ops.label, off.label], ['80%', '20%']);
  close(ops.h, 0.8 * L.chart.plot.h, 'tinggi OPS');
  close(off.h, 0.2 * L.chart.plot.h, 'tinggi OFF');
  close(off.x, ops.x + ops.w, 'OFF tepat di samping OPS');
  close(ops.w, (L.chart.plot.w / items.length) / 3.5, 'lebar batang (gapWidth 150)');
  assert.equal(L.chart.bars[1].h, 0, 'OFF 0% tanpa batang, hanya label');
  assert.deepEqual(L.chart.categories.map((c) => c.text), items.map((i) => i.nama));
});

test('total 0 tidak membuat NaN', () => {
  const z = layoutServiceabilityPrint([{ nama: 'X', operasi: 0, rusak: 0, total: 0 }]);
  assert.deepEqual(z.table.map((c) => c.text), ['1', 'X', '0%', '0', '0%', '0', '0']);
  assert.ok(z.chart.bars.every((b) => b.h === 0));
});

test('lembar PDF memakai grafik bergaya Excel; warna hex (bukan kelas Tailwind) agar terbaca html2canvas', () => {
  const doc = readFileSync(new URL('../src/components/features/shift-report/ShiftReportPrintDocument.tsx', import.meta.url), 'utf8');
  assert.match(doc, /<ServiceabilityPrintChart items=\{checklistSummary\} \/>/);
  assert.doesNotMatch(doc, /Diagram Serviceability Peralatan|grid-cols-7/, 'diagram lama sudah diganti');
  const chart = readFileSync(new URL('../src/components/features/shift-report/ServiceabilityPrintChart.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(chart, /className=/, 'tanpa kelas Tailwind (oklch)');
});
