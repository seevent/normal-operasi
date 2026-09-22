import assert from 'node:assert/strict';
import test from 'node:test';

function calculateOperationalShift(targetDateInput, targetTimeInput) {
  const parts = targetDateInput.split('-').map(Number);
  let hour = parseInt((targetTimeInput || '').split(':')[0], 10);
  if (isNaN(hour)) hour = 12;

  const logicalDate = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
  const isPagi = hour >= 8 && hour < 20;
  if (hour < 8) {
    logicalDate.setDate(logicalDate.getDate() - 1);
  }

  const y = logicalDate.getFullYear();
  const m = String(logicalDate.getMonth() + 1).padStart(2, '0');
  const d = String(logicalDate.getDate()).padStart(2, '0');
  const targetDate = `${y}-${m}-${d}`;
  const targetShiftCode = isPagi ? 'PS' : 'M';
  const shiftLabel = isPagi ? 'Shift Pagi/Siang' : 'Shift Malam';

  return { targetDate, targetShiftCode, shiftLabel };
}

test('BA Serah Terima: operational shift boundary logic', () => {
  // Dini hari: 23 Sept 00:28 WIB -> Shift Malam 22 Sept
  const t1 = calculateOperationalShift('2026-09-23', '00:28');
  assert.equal(t1.targetDate, '2026-09-22');
  assert.equal(t1.targetShiftCode, 'M');
  assert.equal(t1.shiftLabel, 'Shift Malam');

  // Akhir shift malam: 23 Sept 07:59 WIB -> Shift Malam 22 Sept
  const t2 = calculateOperationalShift('2026-09-23', '07:59');
  assert.equal(t2.targetDate, '2026-09-22');
  assert.equal(t2.targetShiftCode, 'M');

  // Shift pagi mulai: 23 Sept 08:00 WIB -> Shift Pagi 23 Sept
  const t3 = calculateOperationalShift('2026-09-23', '08:00');
  assert.equal(t3.targetDate, '2026-09-23');
  assert.equal(t3.targetShiftCode, 'PS');
  assert.equal(t3.shiftLabel, 'Shift Pagi/Siang');

  // Shift malam mulai: 23 Sept 20:00 WIB -> Shift Malam 23 Sept
  const t4 = calculateOperationalShift('2026-09-23', '20:00');
  assert.equal(t4.targetDate, '2026-09-23');
  assert.equal(t4.targetShiftCode, 'M');
});

test('BA Serah Terima: only on-duty personnel are displayed in dropdown', async () => {
  const { readFileSync } = await import('node:fs');
  const fileContent = readFileSync(new URL('../src/components/features/TabBASerahTerima.tsx', import.meta.url), 'utf8');

  // Should not contain Personel SSES Lainnya or otherPersonelList
  assert.doesNotMatch(fileContent, /Personel SSES Lainnya/);
  assert.doesNotMatch(fileContent, /otherPersonelList/);
  assert.match(fileContent, /-- Pilih Personel Berdinas --/);
  assert.match(fileContent, /dinasPersonelList\.map/);
});
