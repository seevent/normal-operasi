import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('setChecklistDataMaster melaporkan hasil simpan ke cloud (boolean), bukan selalu sukses', () => {
  const src = read('src/store/useMasterDataStore.ts');
  assert.match(src, /saveConfigToSupabase[^\n]*Promise<boolean>/);
  assert.match(src, /setChecklistDataMaster:\s*\(data[^)]*\)\s*=>\s*Promise<boolean>/);
});

test('editor checklist memberi tahu pengguna bila simpan ke cloud gagal', () => {
  const src = read('src/components/features/ChecklistDataEditor.tsx');
  assert.match(src, /syncFailed/);
  assert.match(src, /await\s+[\w.]*setChecklistDataMaster\(/);
});

test('kartu pembungkus memakai overflow-clip agar bilah simpan sticky bisa menempel', () => {
  for (const f of ['src/components/App.tsx', 'src/components/features/TabData.tsx']) {
    assert.match(read(f), /overflow-clip/, `${f} harus memakai overflow-clip`);
  }
});

test('bilah simpan melaporkan tingginya ke maskot lewat bottomInset', () => {
  assert.match(read('src/store/useAppStore.ts'), /setBottomInset/);
  assert.match(read('src/components/features/ChecklistDataEditor.tsx'), /setBottomInset\(/);
  assert.match(read('src/components/features/AntigravityPet.tsx'), /bottomInset/);
});

test('textarea alat menggunakan hook auto-resize dan font 16px di mobile', () => {
  assert.match(read('src/components/features/checklist-editor/ItemsTextarea.tsx'), /useAutoResizeTextarea/);
  assert.match(read('src/components/features/checklist-editor/ui.tsx'), /text-base|text-\[16px\]/);
});
