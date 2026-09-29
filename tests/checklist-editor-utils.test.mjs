import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assignIds,
  stripIds,
  isChecklistDirty,
  moveItem,
  removeAt,
  replaceAt,
  parseItems,
  normalizeItems,
  countBlock,
  sumStats,
  countMissingSummaryKeys,
  blockTitle,
  blockMatches,
  collectMatchIds,
  collectAllIds,
  newBlock,
  newCategory,
  newSubGroup,
} from '../src/lib/utils/checklistEditor.ts';
import { DEFAULT_CHECKLIST_DATA } from '../src/lib/data/masterData.ts';

const sample = () => [
  {
    type: 'location',
    title: 'PSCP D',
    summary: 'TOTAL PSCP D',
    categories: [
      { title: 'A. X-RAY', summaryKey: 'X-RAY', items: ['X-Ray 1', 'X-Ray 2'] },
      { title: 'B. WTMD', summaryKey: '', items: ['WTMD Ceia'] },
    ],
  },
  {
    type: 'group',
    summary: 'SSCP',
    locations: [{ title: 'SSCP E', categories: [{ title: 'A. X-RAY', summaryKey: 'X-RAY', items: ['X-Ray E'] }] }],
  },
  {
    type: 'access_control',
    title: 'ACCESS CONTROL',
    summary: 'TOTAL AC',
    terminals: [{ title: 'TERMINAL D', categories: [{ title: 'AVIOBRIDGE', items: ['Pintu Avio D1', 'Pintu Avio D2'] }] }],
  },
];

test('assignIds memberi ID unik ke semua level dan stripIds mengembalikan data asli persis', () => {
  const original = sample();
  const withIds = assignIds(original);

  const ids = collectAllIds(withIds);
  assert.equal(new Set(ids).size, ids.length, 'ID harus unik');
  assert.equal(ids.length, 3 + 2 + 1 + 1 + 1 + 1, 'blok + kategori + lokasi + terminal + kategorinya');

  assert.deepEqual(stripIds(withIds), original);
  // Tidak boleh mengubah data sumber
  assert.equal(original[0]._id, undefined);
});

test('assignIds pada data bawaan sistem lalu stripIds tidak mengubah isinya', () => {
  const stripped = stripIds(assignIds(DEFAULT_CHECKLIST_DATA));
  assert.deepEqual(stripped, JSON.parse(JSON.stringify(DEFAULT_CHECKLIST_DATA)));
});

test('isChecklistDirty: bersih tepat setelah dimuat, kotor setelah diubah, bersih lagi setelah dikembalikan', () => {
  const saved = sample();
  const editing = assignIds(saved);
  assert.equal(isChecklistDirty(editing, saved), false);

  editing[0].categories[0].items.push('X-Ray 3');
  assert.equal(isChecklistDirty(editing, saved), true);

  editing[0].categories[0].items.pop();
  assert.equal(isChecklistDirty(editing, saved), false);
});

test('moveItem menukar tetangga, menjaga batas, dan tidak mengubah larik asli', () => {
  const list = ['a', 'b', 'c'];
  assert.deepEqual(moveItem(list, 1, 'up'), ['b', 'a', 'c']);
  assert.deepEqual(moveItem(list, 1, 'down'), ['a', 'c', 'b']);
  assert.deepEqual(moveItem(list, 0, 'up'), ['a', 'b', 'c'], 'elemen pertama tidak bisa naik');
  assert.deepEqual(moveItem(list, 2, 'down'), ['a', 'b', 'c'], 'elemen terakhir tidak bisa turun');
  assert.deepEqual(moveItem(list, 9, 'up'), ['a', 'b', 'c'], 'indeks di luar batas diabaikan');
  assert.deepEqual(list, ['a', 'b', 'c']);
});

test('removeAt dan replaceAt tidak mengubah larik asli', () => {
  const list = [{ n: 1 }, { n: 2 }, { n: 3 }];
  assert.deepEqual(removeAt(list, 1), [{ n: 1 }, { n: 3 }]);
  assert.deepEqual(replaceAt(list, 0, { n: 9 }), [{ n: 9 }, { n: 2 }, { n: 3 }]);
  assert.equal(list.length, 3);
  assert.equal(list[0].n, 1);
});

test('parseItems: baris kosong dibuang tetapi spasi tidak dipotong saat mengetik', () => {
  assert.deepEqual(parseItems('A\n\nB\n   \nC'), ['A', 'B', 'C']);
  assert.deepEqual(parseItems('A\n'), ['A'], 'Enter di akhir tidak menghasilkan item kosong');
  assert.deepEqual(parseItems('Alat dengan spasi '), ['Alat dengan spasi '], 'spasi di ujung dipertahankan selama mengetik');
  assert.deepEqual(parseItems(''), []);
});

test('normalizeItems memotong spasi dan membuang item kosong saat kolom kehilangan fokus', () => {
  assert.deepEqual(normalizeItems(['  A ', '', ' B', '   ']), ['A', 'B']);
});

test('countBlock menghitung sub-grup, kategori, dan alat untuk ketiga jenis blok', () => {
  const [loc, group, ac] = sample();
  assert.deepEqual(countBlock(loc), { subGroups: 0, categories: 2, items: 3 });
  assert.deepEqual(countBlock(group), { subGroups: 1, categories: 1, items: 1 });
  assert.deepEqual(countBlock(ac), { subGroups: 1, categories: 1, items: 2 });
  assert.deepEqual(sumStats(sample()), { blocks: 3, subGroups: 2, categories: 4, items: 6 });
});

test('countBlock cocok dengan ringkasan data bawaan sistem (8 blok, 137 alat)', () => {
  const stats = sumStats(DEFAULT_CHECKLIST_DATA);
  assert.equal(stats.blocks, 8);
  assert.equal(stats.items, 137);
});

test('countMissingSummaryKeys: hanya blok lokasi/grup yang terhitung karena access control tidak memakainya', () => {
  const [loc, group, ac] = sample();
  assert.equal(countMissingSummaryKeys(loc), 1, 'B. WTMD punya Summary Key kosong');
  assert.equal(countMissingSummaryKeys(group), 0);
  // Kategori AVIOBRIDGE tidak punya summaryKey, tetapi generator WA tidak memakainya untuk access control
  assert.equal(countMissingSummaryKeys(ac), 0);
});

test('blockTitle memakai summary untuk grup dan title untuk blok lain, dengan cadangan', () => {
  const [loc, group, ac] = sample();
  assert.equal(blockTitle(loc), 'PSCP D');
  assert.equal(blockTitle(group), 'SSCP');
  assert.equal(blockTitle(ac), 'ACCESS CONTROL');
  assert.equal(blockTitle({ type: 'location' }), 'Tanpa nama');
});

test('blockMatches mencari sampai ke nama alat, tanpa membedakan huruf besar/kecil', () => {
  const [loc, group, ac] = sample();
  assert.equal(blockMatches(loc, ''), true, 'pencarian kosong menampilkan semua');
  assert.equal(blockMatches(loc, 'wtmd ceia'), true, 'cocok pada nama alat');
  assert.equal(blockMatches(group, 'sscp e'), true, 'cocok pada nama lokasi di dalam grup');
  assert.equal(blockMatches(ac, 'avio d2'), true, 'cocok pada alat di dalam terminal');
  assert.equal(blockMatches(ac, 'x-ray'), false);
  assert.equal(blockMatches(loc, '  PSCP  '), true, 'spasi di tepi diabaikan');
});

test('collectMatchIds mengembalikan blok yang cocok beserta induknya, bukan yang tidak cocok', () => {
  const data = assignIds(sample());
  const ids = collectMatchIds(data, 'avio d1');
  assert.ok(ids.includes(data[2]._id), 'blok access control terbuka');
  assert.ok(ids.includes(data[2].terminals[0]._id), 'terminal induknya terbuka');
  assert.ok(ids.includes(data[2].terminals[0].categories[0]._id), 'kategorinya terbuka');
  assert.ok(!ids.includes(data[0]._id), 'blok lain tidak ikut terbuka');
  assert.deepEqual(collectMatchIds(data, ''), []);
});

test('pabrik item baru punya nilai bawaan yang sama dengan editor sebelumnya', () => {
  assert.deepEqual(stripIds([newBlock('location')]), [{ type: 'location', title: 'Lokasi Baru', summary: '', categories: [] }]);
  assert.deepEqual(stripIds([newBlock('group')]), [{ type: 'group', summary: 'Grup Baru', locations: [] }]);
  assert.deepEqual(stripIds([newBlock('access_control')]), [
    { type: 'access_control', title: 'Access Control Baru', summary: '', terminals: [] },
  ]);
  assert.equal(newSubGroup('location').title, 'Lokasi Baru');
  assert.equal(newSubGroup('terminal').title, 'Terminal Baru');
  assert.notEqual(newCategory()._id, newCategory()._id, 'setiap item baru memakai ID berbeda');
});
