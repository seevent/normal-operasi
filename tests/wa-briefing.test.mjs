import assert from 'node:assert/strict';
import test from 'node:test';
import { generateWA_Briefing } from '../src/lib/utils/briefingMessage.ts';

const data = { jenis: 'Unit', tanggal: '2026-09-30', shift: 'Malam', lokasi: 'Terminal 2' };

test('Giat briefing unit WA cocok dengan contoh format', () => {
  assert.equal(
    generateWA_Briefing(data),
    [
      '*GIAT BRIEFING UNIT SSES T2*',
      'Hari/Tanggal : Rabu, 30 September 2026',
      'Shift : Malam',
      'Lokasi : Terminal 2'
    ].join('\n')
  );
});

test('Giat briefing unit menambahkan daftar stok sparepart bila dipilih', () => {
  const msg = generateWA_Briefing(data, [{ name: 'Fuse 5A', current_stock: 3, unit: 'PCS' }]);
  assert.ok(msg.endsWith('Lokasi : Terminal 2\n\n- Fuse 5A : 3 PCS'));
});

test('Briefing MOT WA cocok dengan contoh format', () => {
  assert.equal(
    generateWA_Briefing({ ...data, jenis: 'MOT' }),
    [
      '*BRIEFING MOT T2*',
      'Hari/Tanggal : Rabu, 30 September 2026',
      'Shift : Malam',
      'Lokasi : Terminal 2'
    ].join('\n')
  );
});
