import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { formatNamaPersonel } from '../src/lib/data/masterData.ts';

const readProjectFile = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

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

test('Format nama personel terpusat di fetchOnDutyPersonnel, bukan diulang per tab', () => {
  const perbaikanContent = readProjectFile('src/components/features/TabPerbaikan.tsx');
  const initialReportContent = readProjectFile('src/components/features/TabInitialReport.tsx');
  const masterDataContent = readProjectFile('src/lib/data/masterData.ts');
  const reportService = readProjectFile('src/lib/services/operationalReportService.ts');

  assert.match(masterDataContent, /export function formatNamaPersonel/);

  // Pemformatan dilakukan sekali di layanan pusat, sehingga tab menerima nama
  // yang sudah rapi dan tidak perlu mengimpor helper-nya sendiri.
  assert.match(reportService, /import \{[^}]*formatNamaPersonel[^}]*\} from '\.\.\/data\/masterData/);
  assert.match(reportService, /name: formatNamaPersonel\(toTitleCase\(/);

  // Kedua tab wajib mengambil daftar teknisi lewat jalur terpusat tersebut.
  assert.match(perbaikanContent, /fetchOnDutyPersonnel/);
  assert.match(initialReportContent, /fetchOnDutyPersonnel/);

  // Tidak boleh ada lagi pemformatan inisial ad-hoc seperti secondWord + thirdInitial
  assert.doesNotMatch(perbaikanContent, /thirdInitial/);
  assert.doesNotMatch(initialReportContent, /thirdInitial/);
});
