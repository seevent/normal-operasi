import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('Menu Report: hapus satuan tetap tanpa login tetapi lewat Sampah (bukan delete langsung)', () => {
  const shift = read('src/components/features/TabShiftReport.tsx');
  assert.match(shift, /await trashReportRows\(\[targetItem\.id\]\)/);
  assert.doesNotMatch(shift, /from\('laporan_operasional'\)\.delete\(\)/);
  const sql = read('supabase/migrations/20261029120000_storage_manager.sql');
  assert.match(sql, /grant execute on function public\.trash_report_rows\(uuid\[\]\) to anon, authenticated;/);
  // Izin edit/hapus tabel untuk menu Report tidak diubah oleh migrasi ini.
  assert.doesNotMatch(sql, /drop policy/i);
});

test('Hapus massal per rentang: wajib login, minimal 12 bulan, Sampah 7 hari, pengosongan hanya server', () => {
  const sql = read('supabase/migrations/20261029120000_storage_manager.sql');
  assert.match(sql, /function public\.trash_report_range[\s\S]*?v_uid uuid := require_login\(\);/);
  assert.match(sql, /interval '12 months'/);
  assert.match(sql, /purge_after timestamptz not null default now\(\) \+ interval '7 days'/);
  assert.match(sql, /revoke all on function public\.trash_report_range\(date, date, text\[\]\) from public, anon;/);
  assert.match(sql, /revoke all on function public\.begin_purge_job\(uuid\) from public, anon, authenticated;/);
  assert.match(sql, /grant execute on function public\.begin_purge_job\(uuid\) to service_role;/);
  // Media yang masih dipakai laporan lain tidak dihapus.
  assert.match(sql, /status = 'dipakai_laporan_lain'/);
});

test('Panel Penyimpanan ada di tab Data › Cloudinary CDN; pengosongan terjadwal harian', () => {
  const panel = read('src/components/features/CloudinarySettingsPanel.tsx');
  assert.match(panel, /<StorageManagerPanel \/>/);
  const storage = read('src/components/features/storage-manager/StorageManagerPanel.tsx');
  assert.match(storage, /archivedKey === rangeKey/, 'hapus hanya setelah arsip rentang yang sama diunduh');
  assert.match(storage, /HAPUS \$\{preview\.reports\}/);
  const fn = read('netlify/functions/purge-trash.mts');
  assert.match(fn, /purgeDueTrash/);
  assert.match(fn, /schedule: '17 20 \* \* \*'/);
});
