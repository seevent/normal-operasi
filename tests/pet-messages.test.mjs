import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PET_IDLE_QUOTES,
  PET_SHIFT_PAGI_CHEERS,
  PET_SHIFT_MALAM_CHEERS,
  getShiftCheer,
  getIdleQuote,
  buildMissingFieldsMessage,
} from '../src/lib/data/petMessages.ts';

test('getShiftCheer: shift pagi dan malam mengambil dari kumpulan yang berbeda', () => {
  const pagi = getShiftCheer('Pagi, 08.00 - 20.00 WIB', () => 0);
  const malam = getShiftCheer('Malam, 20.00 - 08.00 WIB', () => 0);

  assert.ok(PET_SHIFT_PAGI_CHEERS.includes(pagi));
  assert.ok(PET_SHIFT_MALAM_CHEERS.includes(malam));
  assert.notEqual(pagi, malam);
});

test('getShiftCheer: menerima kode shift singkat (PS / M)', () => {
  assert.ok(PET_SHIFT_MALAM_CHEERS.includes(getShiftCheer('M', () => 0)));
  assert.ok(PET_SHIFT_PAGI_CHEERS.includes(getShiftCheer('PS', () => 0)));
});

test('getShiftCheer: shift tak dikenal atau kosong tetap memberi penyemangat (default pagi)', () => {
  for (const input of ['', '   ', 'entah apa']) {
    const cheer = getShiftCheer(input, () => 0);
    assert.ok(PET_SHIFT_PAGI_CHEERS.includes(cheer), `gagal untuk input: "${input}"`);
  }
});

test('getShiftCheer: indeks di luar rentang tetap menghasilkan kalimat valid', () => {
  assert.ok(PET_SHIFT_PAGI_CHEERS.includes(getShiftCheer('Pagi', () => 999)));
  assert.ok(PET_SHIFT_PAGI_CHEERS.includes(getShiftCheer('Pagi', () => -5)));
});

test('getIdleQuote: tidak mengulang kalimat yang barusan tampil', () => {
  const previous = PET_IDLE_QUOTES[0];
  // Penyeleksi selalu memilih indeks 0 dari daftar yang sudah disaring
  assert.notEqual(getIdleQuote(previous, () => 0), previous);
});

test('getIdleQuote: tanpa riwayat tetap mengembalikan kalimat dari daftar', () => {
  assert.ok(PET_IDLE_QUOTES.includes(getIdleQuote(null, () => 0)));
});

test('getIdleQuote: maskot tidak lagi mengklaim status sistem secara palsu', () => {
  // Kalimat "semua sistem optimal" dihapus karena statusnya tidak pernah diperiksa.
  for (const quote of PET_IDLE_QUOTES) {
    assert.doesNotMatch(quote, /sistem operasional SSES T2 dalam kondisi optimal/i);
  }
});

test('buildMissingFieldsMessage: merangkai satu, dua, dan banyak field', () => {
  assert.equal(buildMissingFieldsMessage(['lokasi']), 'Bip bip! Hasil scan: lokasi belum diisi.');
  assert.equal(
    buildMissingFieldsMessage(['lokasi', 'teknisi bertugas']),
    'Bip bip! Hasil scan: lokasi dan teknisi bertugas belum diisi.'
  );
  assert.equal(
    buildMissingFieldsMessage(['peralatan', 'lokasi', 'dampak']),
    'Bip bip! Hasil scan: peralatan, lokasi dan dampak belum diisi.'
  );
});

test('buildMissingFieldsMessage: mengabaikan entri kosong dan mengembalikan null bila lengkap', () => {
  assert.equal(buildMissingFieldsMessage([]), null);
  assert.equal(buildMissingFieldsMessage(['', '   ']), null);
  assert.equal(buildMissingFieldsMessage(['', 'lokasi', '']), 'Bip bip! Hasil scan: lokasi belum diisi.');
});

test('Kegagalan sync latar belakang dilaporkan lewat maskot, tidak hanya console', async () => {
  const { readFileSync } = await import('node:fs');
  const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

  const reportService = read('src/lib/services/operationalReportService.ts');
  const cloudinary = read('src/lib/services/cloudinaryService.ts');

  // Gagal simpan laporan wajib terlihat oleh petugas
  assert.match(reportService, /sayPet\([^)]*gagal tersimpan ke database/i);
  // Peralihan diam-diam ke penyimpanan cadangan wajib diumumkan
  assert.match(cloudinary, /sayPet\([^)]*penyimpanan cadangan/i);
});

test('Tab Kehadiran memberi penyemangat shift setelah laporan dibagikan', async () => {
  const { readFileSync } = await import('node:fs');
  const tab = readFileSync(new URL('../src/components/features/TabKehadiran.tsx', import.meta.url), 'utf8');

  assert.match(tab, /getShiftCheer/);
  assert.match(tab, /sayPet\(getShiftCheer\(attendanceData\.shift\), 'cheer'\)/);
});

test('Maskot menyingkir saat isian sedang difokuskan', async () => {
  const { readFileSync } = await import('node:fs');
  const pet = readFileSync(new URL('../src/components/features/AntigravityPet.tsx', import.meta.url), 'utf8');

  assert.match(pet, /focusin/);
  assert.match(pet, /focusout/);
  assert.match(pet, /INPUT', 'SELECT', 'TEXTAREA/);
  assert.match(pet, /isTyping \? 'opacity-0 pointer-events-none'/);
});

test('Maskot adalah mesin X-Ray: tidak ada lagi sisa persona Iron Man', async () => {
  const { readFileSync } = await import('node:fs');
  const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

  const ironMan = /iron ?man|j\.?a\.?r\.?v\.?i\.?s|arc.?reactor|\barmor\b|\bSir\b|thruster/i;
  const files = [
    'src/lib/data/petMessages.ts',
    'src/components/features/AntigravityPet.tsx',
    'src/lib/services/operationalReportService.ts',
    'src/lib/services/cloudinaryService.ts',
    'src/styles.css',
  ];
  for (const file of files) {
    assert.doesNotMatch(read(file), ironMan, `${file} masih memuat sisa persona Iron Man`);
  }

  // Karakter memakai artwork mesin X-Ray, bukan berkas lama
  const pet = read('src/components/features/AntigravityPet.tsx');
  assert.match(pet, /\/pet-xray\.webp/);
  assert.doesNotMatch(pet, /pet-iron-man/);
});

test('Kalimat maskot berbicara sebagai mesin X-Ray pemindai bagasi', () => {
  const all = [...PET_IDLE_QUOTES, ...PET_SHIFT_PAGI_CHEERS, ...PET_SHIFT_MALAM_CHEERS].join(' ').toLowerCase();
  assert.match(all, /scan|bagasi|konveyor/);
});

test('getTabCheer: setiap tab punya penyemangat sendiri yang valid', async () => {
  const { PET_TAB_CHEERS, getTabCheer } = await import('../src/lib/data/petMessages.ts');
  const keys = Object.keys(PET_TAB_CHEERS);
  assert.deepEqual(
    keys.sort(),
    ['ba_serah_terima', 'briefing', 'checklist', 'initial', 'kalibrasi', 'kegiatan', 'perbaikan', 'report', 'storing', 'tip']
  );
  for (const key of keys) {
    assert.ok(PET_TAB_CHEERS[key].length >= 2, `tab ${key} perlu beberapa variasi kalimat`);
    assert.ok(PET_TAB_CHEERS[key].includes(getTabCheer(key, () => 0)));
    assert.ok(PET_TAB_CHEERS[key].includes(getTabCheer(key, () => 999)));
    assert.ok(PET_TAB_CHEERS[key].includes(getTabCheer(key, () => -3)));
  }
});

test('Setiap tab yang membagikan ke WhatsApp mengirim kunci penyemangat tab-nya', async () => {
  const { readFileSync } = await import('node:fs');
  const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
  const tabs = {
    TabBriefing: 'briefing', TabStoring: 'storing', TabChecklist: 'checklist', TabInitialReport: 'initial',
    TabPerbaikan: 'perbaikan', TabKalibrasi: 'kalibrasi', TabKegiatan: 'kegiatan',
    TabBASerahTerima: 'ba_serah_terima', TabShiftReport: 'report',
  };
  for (const [file, key] of Object.entries(tabs)) {
    const src = read(`src/components/features/${file}.tsx`);
    const calls = src.match(/shareToWhatsApp\(/g) || [];
    const withCheer = src.match(new RegExp(`'${key}'\\);`, 'g')) || [];
    assert.ok(calls.length > 0 && withCheer.length >= calls.length, `${file} harus mengirim '${key}' di setiap shareToWhatsApp`);
  }
  assert.match(read('src/components/features/TabTip.tsx'), /sayPet\(getTabCheer\('tip'\), 'cheer'\)/);
  assert.match(read('src/lib/services/shareService.ts'), /cheerTab/);
});
