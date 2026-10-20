import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
// Komentar boleh menyebut istilah terlarang (menjelaskan kenapa tidak dipakai); yang diuji adalah kodenya.
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

test('tab Preventive terdaftar di App dan ditampilkan saat aktif', () => {
  const app = read('src/components/App.tsx');
  assert.match(app, /id: 'preventive'/);
  assert.match(app, /label: 'Preventive'/);
  assert.match(app, /import \{ TabPreventive \} from '\.\/features\/TabPreventive'/);
  assert.match(app, /activeTab === 'preventive' && <TabPreventive/);
});

test('alur unggah Preventive tidak memakai jalur fallback (Supabase Storage / unsigned preset)', () => {
  const files = ['src/lib/services/preventivePhotoService.ts', 'src/store/usePreventiveStore.ts', 'src/components/features/TabPreventive.tsx'];
  for (const f of files) {
    const src = code(f);
    assert.doesNotMatch(src, /uploadPhotoToCloudinary|uploadPhotoToGoogleDrive|storage\.from\(|localStorage|upload_preset/, f);
  }
});

test('kode klien tidak mengimpor berkas .server dan tidak menyebut rahasia server', () => {
  const clientFiles = [
    'src/lib/services/preventivePhotoService.ts',
    'src/lib/services/preventiveDataService.ts',
    'src/store/usePreventiveStore.ts',
    'src/components/features/TabPreventive.tsx',
    ...readdirSync(new URL('../src/components/features/preventive', import.meta.url)).map((n) => `src/components/features/preventive/${n}`),
  ];
  for (const f of clientFiles) {
    const src = read(f);
    assert.doesNotMatch(src, /\.server(\.ts)?'/, `${f} tidak boleh mengimpor berkas .server`);
    assert.doesNotMatch(src, /API_SECRET|SERVICE_ROLE/, `${f} tidak boleh menyebut rahasia server`);
  }
});

test('rahasia server dibaca tanpa awalan VITE_ (tidak ikut ke bundel browser)', () => {
  const src = read('src/lib/server/preventiveUpload.server.ts');
  assert.doesNotMatch(src, /VITE_CLOUDINARY_API|VITE_SUPABASE_SERVICE|VITE_.*SECRET/);
  assert.match(src, /CLOUDINARY_API_SECRET/);
  assert.match(src, /SUPABASE_SERVICE_ROLE_KEY/);
});

test('input foto memakai kamera belakang dan target sentuh minimal 44px', () => {
  const row = read('src/components/features/preventive/PreventiveAssetRow.tsx');
  assert.match(row, /accept="image\/\*"/);
  assert.match(row, /capture="environment"/);
  assert.match(row, /min-h-\[44px\]/);
  const tab = read('src/components/features/TabPreventive.tsx');
  assert.match(tab, /fontSize: '16px'/);
});
