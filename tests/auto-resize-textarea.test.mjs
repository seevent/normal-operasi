import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('Rencana Kegiatan Harian tumbuh mengikuti isinya, bukan terkunci pada jumlah baris tetap', () => {
  const tab = read('src/components/features/TabKehadiran.tsx');

  assert.match(tab, /useAutoResizeTextarea\(attendanceData\.rencanaKegiatan\)/);

  const textarea = tab.match(/<textarea[^>]*name="rencanaKegiatan"[\s\S]*?<\/textarea>/)?.[0] ?? '';
  assert.ok(textarea, 'textarea rencanaKegiatan harus ditemukan');
  assert.match(textarea, /ref=\{rencanaKegiatanRef\}/);

  // Sebelumnya rows={4} + resize-none mengunci tinggi pada 4 baris sehingga isi
  // yang lebih panjang hanya bisa digulir di dalam kotak kecil.
  assert.doesNotMatch(textarea, /rows=\{4\}/);
  // Tanpa overflow-hidden, scrollbar sempat berkedip saat tinggi dihitung ulang.
  assert.match(textarea, /overflow-hidden/);
});

test('Hook menghitung border dan menghitung ulang saat lebar layar berubah', () => {
  const hook = read('src/lib/hooks/useAutoResizeTextarea.ts');

  // scrollHeight tidak menghitung border; box-sizing: border-box membuat kotak
  // kurang 2px dan memunculkan scrollbar kecil bila selisih ini diabaikan.
  assert.match(hook, /offsetHeight\s*-\s*el\.clientHeight/);

  // Tinggi harus bisa menyusut, jadi wajib direset ke auto sebelum diukur.
  assert.match(hook, /style\.height\s*=\s*'auto'/);

  // Ponsel diputar / jendela diubah ukurannya mengubah pemenggalan baris.
  assert.match(hook, /addEventListener\('resize'/);
  assert.match(hook, /removeEventListener\('resize'/);
});

test('Initial Report dan Perbaikan memakai hook bersama, bukan salinan manual', () => {
  const initial = read('src/components/features/TabInitialReport.tsx');
  const perbaikan = read('src/components/features/TabPerbaikan.tsx');

  for (const [nama, src] of [['TabInitialReport', initial], ['TabPerbaikan', perbaikan]]) {
    assert.match(src, /from '\.\.\/\.\.\/lib\/hooks\/useAutoResizeTextarea'/, `${nama} harus memakai hook`);
    // Salinan manual membaca scrollHeight tanpa border dan tidak menghitung ulang saat layar diputar.
    assert.doesNotMatch(src, /scrollHeight/, `${nama} tidak boleh mengukur tinggi sendiri lagi`);
    assert.doesNotMatch(src, /const autoResize\b/, `${nama} tidak boleh punya autoResize lokal`);
  }

  // Semua textarea yang dipasangi hook harus menerima ref-nya.
  for (const ref of ['permasalahanRef', 'uraianRef', 'dampakRef', 'mitigasiRef']) {
    assert.match(initial, new RegExp(`ref=\\{${ref}\\}`));
  }
  for (const ref of ['permasalahanRef', 'tindakLanjutRef']) {
    assert.match(perbaikan, new RegExp(`ref=\\{${ref}\\}`));
  }

  // Dua ref ini pernah dideklarasikan tetapi tidak pernah terpasang ke elemen mana pun.
  assert.doesNotMatch(initial, /tindakanRef|hasilRef/);
});
