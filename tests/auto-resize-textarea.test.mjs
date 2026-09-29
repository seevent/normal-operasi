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
