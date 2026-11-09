import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { formatSyncAge, formatSyncTime, lastSyncInfo, SYNC_STALE_DAYS } from '../src/lib/utils/preventiveSync.ts';

const NOW = Date.parse('2026-11-09T01:30:00Z'); // Senin 9 Nov 2026 08.30 WIB

test('lastSyncInfo: waktu sync terbaru dari semua aset', () => {
  const info = lastSyncInfo([
    { syncedAt: '2026-10-20T05:55:27.687802+00:00' },
    { syncedAt: '2026-11-04T03:10:00+00:00' },
    { syncedAt: null },
  ], NOW);
  assert.equal(info.at, Date.parse('2026-11-04T03:10:00Z'));
  assert.equal(info.ageDays, 5, 'hari kalender WIB: 4 Nov -> 9 Nov');
  assert.equal(info.stale, false);
});

test('lastSyncInfo: lebih dari batas hari dianggap basi', () => {
  const info = lastSyncInfo([{ syncedAt: '2026-10-20T05:55:27.687802+00:00' }], NOW);
  assert.equal(info.ageDays, 20);
  assert.equal(info.stale, true);
  assert.ok(SYNC_STALE_DAYS < 20);
});

test('lastSyncInfo: tanpa data sync', () => {
  assert.deepEqual(lastSyncInfo([{ syncedAt: null }, {}], NOW), { at: null, ageDays: null, stale: false });
});

test('format waktu sync dalam WIB dan umur yang mudah dibaca', () => {
  assert.equal(formatSyncTime(Date.parse('2026-10-20T05:55:27Z')), 'Selasa 20 Okt 2026, 12.55 WIB');
  assert.equal(formatSyncAge(0), 'hari ini');
  assert.equal(formatSyncAge(1), 'kemarin');
  assert.equal(formatSyncAge(19), '19 hari lalu');
});

test('data aset memuat synced_at dan tab Preventive menampilkan info sync', () => {
  const svc = readFileSync(new URL('../src/lib/services/preventiveDataService.ts', import.meta.url), 'utf8');
  assert.match(svc, /synced_at/);
  const tab = readFileSync(new URL('../src/components/features/TabPreventive.tsx', import.meta.url), 'utf8');
  assert.match(tab, /lastSyncInfo\(/);
  assert.match(tab, /Sync PRIMA terakhir/);
});
