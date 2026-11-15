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

test('Panel Penyimpanan ada di tab Data › Storage; pengosongan terjadwal harian', () => {
  const panel = read('src/components/features/CloudinarySettingsPanel.tsx');
  assert.match(panel, /<StorageManagerPanel \/>/);
  const storage = read('src/components/features/storage-manager/StorageManagerPanel.tsx');
  assert.match(storage, /archivedKey === rangeKey/, 'hapus hanya setelah arsip rentang yang sama diunduh');
  // Status penyimpanan Supabase tampil seperti Cloudinary.
  assert.match(storage, /Supabase \(database & storage\)/);
  assert.match(storage, /SUPABASE_FREE_LIMITS\.storageBytes/);
  assert.match(read('supabase/migrations/20261029120000_storage_manager.sql'), /'storage_bytes', \(select coalesce\(sum\(\(metadata ->> 'size'\)::bigint\), 0\) from storage\.objects\)/);
  assert.match(storage, /HAPUS \$\{preview\.reports\}/);
  const fn = read('netlify/functions/purge-trash.mts');
  assert.match(fn, /purgeDueTrash/);
  assert.match(fn, /schedule: '17 20 \* \* \*'/);
});

test('Sampah & riwayat: job yang sudah dihapus permanen tidak ditampilkan lagi', () => {
  const svc = read('src/lib/services/storageManagerService.ts');
  assert.match(svc, /fetchCleanupJobs[\s\S]*?from\('storage_cleanup_jobs'\)[\s\S]*?\.neq\('status', 'dikosongkan'\)[\s\S]*?\.limit\(30\)/);
});

test('Foto yang dilepas saat laporan diedit diantrikan ke Sampah dan tidak bisa dipulihkan', () => {
  const sql = read('supabase/migrations/20261115130000_report_edit_photo_cleanup.sql');
  assert.match(sql, /check \(kind in \('rentang', 'satuan', 'foto_lama'\)\)/);
  assert.match(sql, /after update of foto_urls on public\.laporan_operasional[\s\S]*?execute function public\.queue_removed_report_media\(\)/);
  assert.match(sql, /insert into storage_cleanup_items \(job_id, url\)/);
  assert.match(sql, /status = 'sampah' and kind <> 'foto_lama' for update/);
  const panel = read('src/components/features/storage-manager/StorageManagerPanel.tsx');
  assert.match(panel, /job\.kind !== 'foto_lama' && \(/);
});

test('Pemeriksaan "foto masih dipakai" mencakup semua tabel penyimpan URL media', () => {
  const sql = read('supabase/migrations/20261115140000_media_references_all_tables.sql');
  // Pengosongan Sampah (referenced_media_urls) dan pratinjau rentang memakai daftar rujukan yang sama.
  const refs = sql.match(/function public\.referenced_media_urls[\s\S]*?\$\$;/)?.[0] ?? '';
  const preview = sql.match(/function public\.preview_report_range[\s\S]*?\$\$;/)?.[0] ?? '';
  for (const body of [refs, preview]) {
    assert.match(body, /from laporan_operasional/);
    assert.match(body, /from laporan_operasional_sampah/);
    assert.match(body, /from preventive_photo_log/);
    assert.match(body, /unnest\(evidence_urls\) from stock_mutations/);
    assert.match(body, /select foto_url from unit_peralatan/);
  }
  assert.match(sql, /revoke all on function public\.referenced_media_urls\(uuid\) from public, anon, authenticated;/);
  assert.match(sql, /grant execute on function public\.referenced_media_urls\(uuid\) to service_role;/);
});
