import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { isTidakHadir, statusOptions, validasiLabelPenugasan } from '../src/lib/data/kehadiranStatus.ts';
import { generateWA_Kehadiran } from '../src/lib/utils/kehadiranMessage.ts';

test('status tidak hadir', () => {
  for (const s of ['Sakit', ' izin ', 'CUTI', 'Off', 'libur']) assert.equal(isTidakHadir(s), true, s);
  for (const s of ['Hadir', 'Dinas Luar', 'Bantuan Umrah SV', null, '']) assert.equal(isTidakHadir(s), false, String(s));
});

test('dropdown status memuat status penugasan dari roster', () => {
  assert.deepEqual(statusOptions('Hadir'), ['Hadir', 'Izin', 'Sakit', 'Dinas Luar']);
  assert.deepEqual(statusOptions('Bantuan Umrah SV'), ['Hadir', 'Izin', 'Sakit', 'Dinas Luar', 'Bantuan Umrah SV']);
  assert.deepEqual(statusOptions('sakit'), ['Hadir', 'Izin', 'Sakit', 'Dinas Luar']);
});

test('label penugasan tidak boleh kosong, terlalu panjang, atau status bawaan', () => {
  assert.equal(validasiLabelPenugasan('Bantuan Umrah SV'), null);
  assert.ok(validasiLabelPenugasan('  '));
  assert.ok(validasiLabelPenugasan('hadir'));
  assert.ok(validasiLabelPenugasan('Cuti'));
  assert.ok(validasiLabelPenugasan('x'.repeat(31)));
});

test('pesan WA kehadiran menampilkan status penugasan tanpa mengubah format', () => {
  const msg = generateWA_Kehadiran({
    tanggal: '2026-11-19',
    shift: 'Malam, 20.00 - 08.00 WIB',
    apiList: [],
    omList: [{ name: 'Rifky Aziz', phone: '085716500615', status: 'Bantuan Umrah SV', jabatan: '' }],
    tlpRuangan: '- 021 550 5910',
    rencanaKegiatan: '- Monitoring',
  });
  assert.match(msg, /\*Personel OM IASS T2 :\*\n- Rifky Aziz - Bantuan Umrah SV\n {5}Tlp : 085716500615/);
});

test('Tab Kehadiran memakai statusOptions untuk kedua daftar personel', () => {
  const src = readFileSync(new URL('../src/components/features/TabKehadiran.tsx', import.meta.url), 'utf8');
  assert.equal((src.match(/statusOptions\(row\.status\)/g) || []).length, 2);
  assert.doesNotMatch(src, /<option value="Dinas Luar">/);
});
