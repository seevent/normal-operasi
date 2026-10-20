import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { isStartAfterEnd, buildTimeRangeMessage } from '../src/lib/utils/timeRange.ts';

test('mulai lebih awal atau sama dengan selesai: sah', () => {
  assert.equal(isStartAfterEnd('08:00', '10:30'), false);
  assert.equal(isStartAfterEnd('09:15', '09:15'), false);
  assert.equal(isStartAfterEnd('00:00', '23:59'), false);
});

test('mulai melebihi selesai: tidak sah', () => {
  assert.equal(isStartAfterEnd('14:00', '13:59'), true);
  assert.equal(isStartAfterEnd('10:00', '08:30'), true);
  assert.equal(isStartAfterEnd('19:59', '08:00'), true);
});

test('Shift Malam yang melewati tengah malam tetap sah', () => {
  assert.equal(isStartAfterEnd('20:00', '07:59'), false);
  assert.equal(isStartAfterEnd('23:30', '00:30'), false);
  // di luar jendela Shift Malam tetap salah
  assert.equal(isStartAfterEnd('20:00', '08:00'), true);
  assert.equal(isStartAfterEnd('19:00', '02:00'), true);
});

test('isian kosong atau tidak terbaca belum dibandingkan', () => {
  assert.equal(isStartAfterEnd('', '08:00'), false);
  assert.equal(isStartAfterEnd('08:00', ''), false);
  assert.equal(isStartAfterEnd(undefined, undefined), false);
  assert.equal(isStartAfterEnd('abc', '08:00'), false);
});

test('menerima pemisah titik dan jam satu digit', () => {
  assert.equal(isStartAfterEnd('9.30', '08:00'), true);
  assert.equal(isStartAfterEnd('8:00', '9.30'), false);
});

test('buildTimeRangeMessage menyebut kedua pukul', () => {
  const msg = buildTimeRangeMessage('14:00', '13:00');
  assert.match(msg, /14:00/);
  assert.match(msg, /13:00/);
  assert.match(msg, /melebihi/);
});

test('Tab dengan pukul mulai dan selesai memperingatkan saat diubah dan memblokir saat dibagikan', () => {
  const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
  for (const f of ['TabChecklist', 'TabStoring', 'TabKegiatan', 'TabKalibrasi', 'TabPerbaikan']) {
    const src = read(`src/components/features/${f}.tsx`);
    assert.match(src, /warnTimeRange\(/, `${f} harus memperingatkan saat pukul diubah`);
    assert.match(src, /if \(reportTimeRangeError\(/, `${f} harus memblokir pembagian bila pukul terbalik`);
  }
});
