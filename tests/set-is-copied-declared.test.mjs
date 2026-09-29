import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const featuresDir = new URL('../src/components/features/', import.meta.url).pathname;

const collectTsx = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? collectTsx(full) : full.endsWith('.tsx') ? [full] : [];
  });

// TabShiftReport pernah memanggil setIsCopied tanpa mendeklarasikannya. Callback
// share dipanggil di setiap jalur sukses, jadi ReferenceError-nya tertangkap
// catch dan memicu fallbackShare: petugas mendapat share WhatsApp ganda.
// Vite tidak mengetik-cek saat build, sehingga bug ini lolos tanpa terdeteksi.
test('Setiap komponen yang memanggil setIsCopied() mendeklarasikannya dari useAppStore', () => {
  const offenders = collectTsx(featuresDir).filter((file) => {
    const src = readFileSync(file, 'utf8');
    if (!/\bsetIsCopied\(/.test(src)) return false;
    const declared = /\bsetIsCopied\b[^;\n]*=\s*useAppStore|(?:const|let)\s*\{[^}]*\bsetIsCopied\b[^}]*\}\s*=\s*useAppStore/.test(src);
    return !declared;
  });

  assert.deepEqual(
    offenders.map((f) => f.replace(featuresDir, '')),
    [],
    'File ini memanggil setIsCopied() tanpa mendeklarasikannya'
  );
});
