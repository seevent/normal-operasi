import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { planPersonelSave } from '../src/lib/utils/personelSave.ts';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

const DB = [
  { id: 'a', name: 'Budi', nik: '111', phone: '0811', jabatan: 'Supervisor' },
  { id: 'b', name: 'Sari', nik: '222', phone: '', jabatan: '' },
];
const dbIds = ['a', 'b'];

test('Data bawaan tanpa id tidak pernah menghapus personel di database', () => {
  const bawaan = [{ name: 'Budi', nik: '111' }, { name: 'Sari', nik: '222' }];
  const plan = planPersonelSave(bawaan, bawaan, dbIds);
  assert.deepEqual(plan.deleteIds, []);
  assert.match(plan.errors.join(' '), /belum termuat/);
});

test('Hanya personel yang dibuang dari editor yang dihapus', () => {
  const plan = planPersonelSave([DB[0]], DB, dbIds);
  assert.deepEqual(plan.errors, []);
  assert.deepEqual(plan.deleteIds, ['b']);
  assert.deepEqual(plan.updates.map((u) => u.id), ['a']);
});

test('Personel di database yang tidak tampil di editor tidak ikut terhapus', () => {
  // Mis. ditambahkan admin lain setelah editor ini dibuka.
  const plan = planPersonelSave(DB, DB, [...dbIds, 'c']);
  assert.deepEqual(plan.deleteIds, []);
});

test('Baris yang namanya dikosongkan tidak dianggap dibuang', () => {
  const plan = planPersonelSave([DB[0], { ...DB[1], name: '  ' }], DB, dbIds);
  assert.deepEqual(plan.deleteIds, []);
  assert.deepEqual(plan.updates.map((u) => u.id), ['a']);
});

test('Personel baru masuk ke inserts dengan urutan tampil', () => {
  const plan = planPersonelSave([{ name: 'Rina', nik: '333', phone: '0812' }, ...DB], DB, dbIds);
  assert.deepEqual(plan.errors, []);
  assert.deepEqual(plan.inserts, [{ nama: 'Rina', nik: '333', no_hp: '0812', jabatan: null, urutan: 1 }]);
  assert.deepEqual(plan.updates.map((u) => [u.id, u.payload.urutan]), [['a', 2], ['b', 3]]);
});

test('NIK kosong atau dobel ditolak sebelum menulis ke database', () => {
  const kosong = planPersonelSave([...DB, { name: 'Rina', nik: ' ' }], DB, dbIds);
  assert.match(kosong.errors.join(' '), /NIK wajib diisi untuk: Rina/);
  const dobel = planPersonelSave([...DB, { name: 'Rina', nik: '111' }], DB, dbIds);
  assert.match(dobel.errors.join(' '), /NIK dobel: 111/);
});

test('Unit yang belum punya personel di database boleh disimpan dari nol', () => {
  const plan = planPersonelSave([{ name: 'Rina', nik: '333' }], [], []);
  assert.deepEqual(plan.errors, []);
  assert.equal(plan.inserts.length, 1);
});

test('savePersonelToSupabase memakai kolom unit_id, melempar galat, dan meminta konfirmasi hapus', () => {
  const src = read('src/store/useMasterDataStore.ts');
  assert.doesNotMatch(src, /unit_kerja_id/);
  assert.match(src, /\.eq\('unit_id', unitId\)/);
  assert.match(src, /planPersonelSave\(/);
  assert.match(src, /confirmDelete\(names, count \?\? 0\)/);
  // Hapus dijalankan setelah tambah/ubah.
  assert.ok(src.indexOf(".from('personel').delete()") > src.indexOf('plan.inserts.map('));
});
