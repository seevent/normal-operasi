import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { isTidakHadir, validasiLabelPenugasan } from '../src/lib/data/kehadiranStatus.ts';
import { generateWA_Kehadiran } from '../src/lib/utils/kehadiranMessage.ts';

test('status tidak hadir', () => {
  for (const s of ['Sakit', ' izin ', 'CUTI', 'Off', 'libur']) assert.equal(isTidakHadir(s), true, s);
  for (const s of ['Hadir', 'Dinas Luar', 'Bantuan Umrah SV', null, '']) assert.equal(isTidakHadir(s), false, String(s));
});

test('label penugasan tidak boleh kosong, terlalu panjang, atau status bawaan', () => {
  assert.equal(validasiLabelPenugasan('Bantuan Umrah SV'), null);
  assert.ok(validasiLabelPenugasan('  '));
  assert.ok(validasiLabelPenugasan('hadir'));
  assert.ok(validasiLabelPenugasan('Cuti'));
  assert.ok(validasiLabelPenugasan('x'.repeat(31)));
});

const dataKehadiran = (extra = {}) => ({
  tanggal: '2026-11-19',
  shift: 'Malam, 20.00 - 08.00 WIB',
  apiList: [{ name: 'Yuli Syarif', phone: '0811', status: 'Hadir', jabatan: '' }],
  omList: [{ name: 'Rifky Aziz', phone: '085716500615', status: 'Hadir', jabatan: '' }],
  tlpRuangan: '- 021 550 5910',
  rencanaKegiatan: '- Monitoring',
  ...extra,
});

test('pesan WA kehadiran: bagian Bantuan Umroh SV setelah personel OM, status tetap Hadir', () => {
  const msg = generateWA_Kehadiran(dataKehadiran({
    penugasan: [{ label: 'Bantuan Umroh SV', nama: ['Rifky Aziz', 'ABDUL RIFAN SUKARNO'] }],
  }));
  assert.ok(msg.includes(
    '*Personel OM IASS T2 :*\n- Rifky Aziz - Hadir\n     Tlp : 085716500615\n\n' +
    '*Bantuan Umroh SV :*\n- Rifky Aziz\n- Abdul Rifan Sukarno\n\n' +
    'Tlp Ruangan :\n- 021 550 5910',
  ), msg);
});

test('pesan WA kehadiran tanpa penugasan sama persis dengan format lama', () => {
  const lama = generateWA_Kehadiran(dataKehadiran());
  assert.equal(generateWA_Kehadiran(dataKehadiran({ penugasan: [] })), lama);
  assert.ok(lama.includes('- Rifky Aziz - Hadir\n     Tlp : 085716500615\n\nTlp Ruangan :'));
  assert.doesNotMatch(lama, /Bantuan/);
});

test('Tab Kehadiran: dropdown status tetap empat pilihan bawaan', () => {
  const src = readFileSync(new URL('../src/components/features/TabKehadiran.tsx', import.meta.url), 'utf8');
  assert.equal((src.match(/<option value="Dinas Luar">Dinas Luar<\/option>/g) || []).length, 2);
  assert.doesNotMatch(src, /statusOptions/);
});
