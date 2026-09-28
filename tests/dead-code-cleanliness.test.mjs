import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readProjectFile = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('Dead code elimination: GenericCrudTable and masterModal methods are removed', () => {
  const tabData = readProjectFile('src/components/features/TabData.tsx');
  const store = readProjectFile('src/store/useMasterDataStore.ts');

  assert.ok(!tabData.includes('export const GenericCrudTable'), 'GenericCrudTable must be removed from TabData');
  assert.ok(!store.includes('openMasterModal:'), 'openMasterModal must be removed from store');
  assert.ok(!store.includes('masterModalOpen:'), 'masterModalOpen must be removed from store');
  assert.ok(!store.includes('loadMasterData ='), 'dummy loadMasterData must be removed');
});
