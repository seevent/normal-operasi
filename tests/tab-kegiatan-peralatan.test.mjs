import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { generateWA_Kegiatan } from '../src/lib/utils/kegiatanMessage.ts';

const base = { tanggal: '2026-09-30', waktuMulai: '09:00', waktuSelesai: '10:00', lokasi: 'Terminal D', kegiatan: 'Mendampingi Audit dari Otban' };

test('Laporan Kegiatan tanpa peralatan tidak mencantumkan baris Peralatan', () => {
  const expected = [
    '*KEGIATAN SSES T2*',
    'Hari/Tanggal/Jam : Rabu, 30 September 2026, 09:00 - 10:00',
    'Lokasi : Terminal D',
    'Kegiatan : Mendampingi Audit dari Otban'
  ].join('\n');
  assert.equal(generateWA_Kegiatan({ ...base, peralatan: '' }), expected);
  assert.equal(generateWA_Kegiatan({ ...base, peralatan: '   ' }), expected);
  assert.equal(generateWA_Kegiatan(base), expected);
});

test('Laporan Kegiatan dengan peralatan mencantumkannya tepat di atas Lokasi', () => {
  assert.equal(
    generateWA_Kegiatan({ ...base, peralatan: 'X-Ray Rapiscan 620DV' }),
    [
      '*KEGIATAN SSES T2*',
      'Hari/Tanggal/Jam : Rabu, 30 September 2026, 09:00 - 10:00',
      'Peralatan : X-Ray Rapiscan 620DV',
      'Lokasi : Terminal D',
      'Kegiatan : Mendampingi Audit dari Otban'
    ].join('\n')
  );
});

test('TabKegiatan: dropdown Peralatan opsional, tidak masuk validasi wajib', () => {
  const tab = readFileSync(new URL('../src/components/features/TabKegiatan.tsx', import.meta.url), 'utf8');
  assert.match(tab, /useTipePeralatanOptions/);
  assert.match(tab, /<select\s+name="peralatan"/);
  const peralatanSelect = tab.match(/<select\s+name="peralatan"[\s\S]*?<\/select>/)?.[0] ?? '';
  assert.doesNotMatch(peralatanSelect, /\brequired\b/);
  assert.match(tab, /Peralatan <span[^>]*>\(Opsional\)/);
  // validasi submit memakai validateKegiatan, yang tidak mensyaratkan peralatan
  assert.match(tab, /validateKegiatan\(kegiatanData\)/);
  // tanpa peralatan, log operasional tetap memakai 'All Faskampen'
  assert.match(tab, /kegiatanData\.peralatan\.trim\(\) \|\| 'All Faskampen'/);
});
