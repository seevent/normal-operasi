import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readProjectFile = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

function formatNamaPersonel(fullName) {
  if (!fullName) return '';
  const words = fullName.trim().split(/\s+/);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0];
  
  const firstWord = words[0].toLowerCase();
  const titlePrefixes = ['m.', 'muh.', 'muhammad', 'moch.', 'mochammad', 'abdul'];
  
  if (titlePrefixes.includes(firstWord)) {
    return words[1];
  }
  return words[0];
}

test('formatNamaPersonel: matches initial report format for title prefixes and regular names', () => {
  assert.equal(formatNamaPersonel('Muh. Syukri'), 'Syukri');
  assert.equal(formatNamaPersonel('Muhammad Rizky Pratama'), 'Rizky');
  assert.equal(formatNamaPersonel('M. Syukri'), 'Syukri');
  assert.equal(formatNamaPersonel('Moch. Alif'), 'Alif');
  assert.equal(formatNamaPersonel('Abdul Ghafur'), 'Ghafur');
  assert.equal(formatNamaPersonel('Yuli Syarif'), 'Yuli');
  assert.equal(formatNamaPersonel('Erman Tri Basuki'), 'Erman');
  assert.equal(formatNamaPersonel('Dwisasono Glory Prayoga'), 'Dwisasono');
  assert.equal(formatNamaPersonel('Slamet'), 'Slamet');
  assert.equal(formatNamaPersonel(''), '');
});

test('TabPerbaikan & TabInitialReport: both import and use formatNamaPersonel from masterData', () => {
  const perbaikanContent = readProjectFile('src/components/features/TabPerbaikan.tsx');
  const initialReportContent = readProjectFile('src/components/features/TabInitialReport.tsx');
  const masterDataContent = readProjectFile('src/lib/data/masterData.ts');

  assert.match(masterDataContent, /export function formatNamaPersonel/);
  assert.match(perbaikanContent, /import \{[^}]*formatNamaPersonel[^}]*\} from '\.\.\/\.\.\/lib\/data\/masterData'/);
  assert.match(initialReportContent, /import \{[^}]*formatNamaPersonel[^}]*\} from '\.\.\/\.\.\/lib\/data\/masterData'/);

  // TabPerbaikan should no longer have custom initial formatting like secondWord + thirdInitial
  assert.doesNotMatch(perbaikanContent, /thirdInitial/);
});
