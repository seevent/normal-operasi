import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseRosterCode,
  parseDateLabel,
  resolveTanggal,
  rosterFromPdfItems,
  rosterFromGrid,
  isUnitSsesT2,
  filterRosterSsesT2,
  matchPersonel,
  susunRencanaRoster,
  rencanaKePenugasan,
  penugasanUntukShift,
  STATUS_PENUGASAN_DEFAULT,
} from '../src/lib/utils/rosterPenugasan.ts';

// Koordinat meniru PDF "Roster Bantuan Penanganan Bagasi Umrah SV – AFETS CGK" (halaman 2).
const DATE_LABELS = ['Wed 18/11', 'Thu 19/11', 'Fri 20/11', 'Sat 21/11', 'Sun 22/11', 'Mon 23/11', 'Tue 24/11', 'Wed 25/11', 'Thu 26/11', 'Fri 27/11'];
const DATE_X = [425, 462, 501, 537, 573, 609, 647, 683, 721, 760];
const CODE_X = [431, 468, 505, 542, 579, 616, 653, 689, 726, 763];

const headerItems = (page) => [
  { str: 'ROSTER BANTUAN PENANGANAN BAGASI UMRAH SAUDIA (SV) – AFETS CGK', x: 247, y: 532, width: 330, page },
  { str: 'Jumlah PS (Pagi – Sore)', x: 316, y: 507, width: 80, page },
  ...CODE_X.map((x) => ({ str: '8', x: x + 7, y: 507, width: 4, page })),
  { str: 'No', x: 56, y: 474, width: 8, page },
  { str: 'Nama Personil', x: 107, y: 474, width: 50, page },
  { str: 'Unit Department', x: 227, y: 474, width: 55, page },
  { str: 'Bidang', x: 357, y: 474, width: 25, page },
  { str: 'Tanggal', x: 356, y: 464, width: 30, page },
  ...DATE_LABELS.map((str, i) => ({ str, x: DATE_X[i], y: 464, width: 33, page })),
];

const row = (page, y, no, nama, unit, bidang, codes) => [
  { str: String(no), x: no >= 100 ? 54 : 57, y, width: 8, page },
  { str: nama, x: 72, y, width: 90, page },
  { str: unit, x: 191, y, width: 120, page },
  { str: bidang, x: 316, y, width: 100, page },
  ...Object.entries(codes).map(([day, str]) => ({ str, x: CODE_X[Number(day)], y, width: 22, page })),
];

const pdfItems = () => [
  ...headerItems(1),
  ...row(1, 454, 1, 'AKMAL MAULUDDIN', 'Terminal 2 Building', 'Airport Building Facility Services', { 0: 'PS-T2' }),
  ...headerItems(2),
  ...row(2, 342, 51, 'ABDUL RIFAN SUKARNO', 'T2 Safety & Security Electronic Services', 'Airport Electronic Services', { 3: 'SP-T2', 7: 'SP-T2' }),
  ...row(2, 332, 52, 'ADHIM TRIANO', 'T3 Safety & Security Electronic Services', 'Airport Electronic Services', { 5: 'SP-T3' }),
  ...row(2, 281, 57, 'HARMIN SANJAYAH', 'T2 Safety & Security Electronic Services', 'Airport Electronic Services', { 6: 'SP-T2' }),
  ...row(2, 199, 65, 'RIFKY AZIZ', 'T2 Safety & Security Electronic Services', 'Airport Electronic Services', { 1: 'SP-T2', 9: 'SP-T2' }),
  // Keterangan di bawah tabel, bukan baris data
  { str: 'PS', x: 120, y: 100, width: 10, page: 2 },
  { str: ': Pagi – Sore (08:00 – 20:00)', x: 160, y: 100, width: 90, page: 2 },
];

test('kode roster: SP = shift M, PS = shift PS, terminal ikut terbaca', () => {
  assert.deepEqual(parseRosterCode('SP-T2'), { kode: 'SP-T2', shift: 'M', terminal: 'T2' });
  assert.deepEqual(parseRosterCode(' ps - t3 '), { kode: 'PS-T3', shift: 'PS', terminal: 'T3' });
  assert.deepEqual(parseRosterCode('SP'), { kode: 'SP', shift: 'M', terminal: '' });
  assert.equal(parseRosterCode(''), null);
  assert.equal(parseRosterCode('8'), null);
  assert.equal(parseRosterCode('Hari 1'), null);
});

test('tanggal roster tanpa tahun: tahun dipilih yang cocok dengan nama hari', () => {
  const labels = DATE_LABELS.map(parseDateLabel);
  assert.equal(labels.every(Boolean), true);
  // Tahun acuan 2027 salah, tetapi "Wed 18/11" hanya cocok dengan 2026.
  const { tanggal, peringatan } = resolveTanggal(labels, 2027);
  assert.deepEqual(tanggal, ['2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27']);
  assert.deepEqual(peringatan, []);
});

test('tanggal roster melewati pergantian tahun', () => {
  const { tanggal } = resolveTanggal(['30/12', '31/12', '1/1'].map(parseDateLabel), 2026);
  assert.deepEqual(tanggal, ['2026-12-30', '2026-12-31', '2027-01-01']);
});

test('nama hari yang tidak cocok dengan tahun mana pun menghasilkan peringatan', () => {
  const { peringatan } = resolveTanggal([parseDateLabel('Mon 18/11'), parseDateLabel('Mon 19/11')], 2026);
  assert.equal(peringatan.length, 1);
});

test('PDF: baris, nama, unit dan kode per tanggal terbaca dari koordinat', () => {
  const roster = rosterFromPdfItems(pdfItems(), 2026);
  assert.match(roster.judul, /ROSTER BANTUAN/);
  assert.equal(roster.tanggal.length, 10);
  assert.equal(roster.rows.length, 5);

  const rifky = roster.rows.find((r) => r.nama === 'RIFKY AZIZ');
  assert.equal(rifky.no, 65);
  assert.equal(rifky.unit, 'T2 Safety & Security Electronic Services');
  assert.deepEqual(rifky.cells, [
    { tanggal: '2026-11-19', kode: 'SP-T2', shift: 'M', terminal: 'T2' },
    { tanggal: '2026-11-27', kode: 'SP-T2', shift: 'M', terminal: 'T2' },
  ]);
  assert.equal(roster.rows.find((r) => r.no === 1).cells[0].tanggal, '2026-11-18');
});

test('PDF: nama yang terpecah menjadi dua potongan teks tetap satu nama', () => {
  const items = [
    ...headerItems(1),
    ...row(1, 300, 72, 'MARKOPOLO YOHANNES', 'T3 General Electronic Services', 'Airport Electronic Services', { 9: 'PS-T2' }),
    { str: 'MASYLINO', x: 160, y: 300, width: 28, page: 1 },
    ...row(1, 290, 73, 'AGUS P', 'T1 Mechanical Services', 'Airport Mechanical Services', {}),
  ];
  const roster = rosterFromPdfItems(items, 2026);
  assert.equal(roster.rows[0].nama, 'MARKOPOLO YOHANNES MASYLINO');
  assert.equal(roster.rows[0].unit, 'T3 General Electronic Services');
});

test('PDF: nama dan unit yang tergabung dalam satu potongan teks dipisahkan memakai unit baris lain', () => {
  const items = [
    ...headerItems(1),
    ...row(1, 310, 71, 'DIMAS HABIBUL ULA', 'T2 General Electronic Services', 'Airport Electronic Services', {}),
    ...row(1, 300, 72, 'X', 'T3 General Electronic Services', 'Airport Electronic Services', { 9: 'PS-T2' })
      .filter((it) => it.str !== 'X' && it.str !== 'T3 General Electronic Services'),
    { str: 'MARKOPOLO YOHANNES MASYLINO T3 General Electronic Services', x: 72, y: 300, width: 230, page: 1 },
    ...row(1, 290, 73, 'AGUS P', 'T3 General Electronic Services', 'Airport Mechanical Services', {}),
  ];
  const roster = rosterFromPdfItems(items, 2026);
  const r72 = roster.rows.find((r) => r.no === 72);
  assert.equal(r72.nama, 'MARKOPOLO YOHANNES MASYLINO');
  assert.equal(r72.unit, 'T3 General Electronic Services');
  assert.deepEqual(roster.peringatan, []);
});

test('PDF tanpa baris tanggal → error yang jelas', () => {
  assert.throws(() => rosterFromPdfItems([{ str: 'Dokumen lain', x: 10, y: 10, width: 50, page: 1 }], 2026), /tanggal/i);
});

test('Excel: grid roster dengan tanggal teks maupun serial Excel', () => {
  const grid = [
    ['ROSTER BANTUAN PENANGANAN BAGASI UMRAH SAUDIA (SV) – AFETS CGK'],
    ['No', 'Nama Personil', 'Unit Department', 'Bidang', 'Hari 1', 'Hari 2'],
    [null, null, null, 'Tanggal', 'Wed 18/11', 46345], // 46345 = 19 Nov 2026
    [65, 'RIFKY AZIZ', 'T2 Safety & Security Electronic Services', 'Airport Electronic Services', '', 'SP-T2'],
    [1, 'AKMAL MAULUDDIN', 'Terminal 2 Building', 'Airport Building Facility Services', 'PS-T2', null],
    [],
    ['Keterangan:'],
  ];
  const roster = rosterFromGrid(grid, 2026);
  assert.deepEqual(roster.tanggal, ['2026-11-18', '2026-11-19']);
  assert.equal(roster.rows.length, 2);
  assert.deepEqual(roster.rows[0].cells, [{ tanggal: '2026-11-19', kode: 'SP-T2', shift: 'M', terminal: 'T2' }]);
  assert.match(roster.judul, /ROSTER/);
});

test('saring unit: hanya T2 Safety & Security Electronic Services', () => {
  assert.equal(isUnitSsesT2('T2 Safety & Security Electronic Services'), true);
  assert.equal(isUnitSsesT2('t2  safety and security electronic services'), true);
  assert.equal(isUnitSsesT2('T3 Safety & Security Electronic Services'), false);
  assert.equal(isUnitSsesT2('T2 General Electronic Services'), false);
  const names = filterRosterSsesT2(rosterFromPdfItems(pdfItems(), 2026).rows).map((r) => r.nama);
  assert.deepEqual(names, ['ABDUL RIFAN SUKARNO', 'HARMIN SANJAYAH', 'RIFKY AZIZ']);
});

test('cocokkan nama ke master personel', () => {
  const personel = [
    { id: 'a', nama: 'Rifky Aziz' },
    { id: 'b', nama: 'Abdul Rifan Sukarno' },
    { id: 'c', nama: 'M. Rusdi Hidayat' },
    { id: 'd', nama: 'Muhammad Ridho' },
    { id: 'e', nama: 'Muhammad Ridho Rabbani' },
  ];
  assert.equal(matchPersonel('RIFKY AZIZ', personel)?.id, 'a');
  assert.equal(matchPersonel('Abdul  Rifan Sukarno', personel)?.id, 'b');
  assert.equal(matchPersonel('M RUSDI', personel)?.id, 'c');
  // "Muhammad Ridho" cocok persis dengan d; tidak tertukar dengan e
  assert.equal(matchPersonel('MUHAMMAD RIDHO', personel)?.id, 'd');
  assert.equal(matchPersonel('RIDHO', personel), null);
  assert.equal(matchPersonel('Nama Asing', personel), null);
});

test('label bawaan: Bantuan Umroh SV', () => {
  assert.equal(STATUS_PENUGASAN_DEFAULT, 'Bantuan Umroh SV');
});

test('rencana: dicocokkan dengan jadwal shift tanpa mengubah status', () => {
  const personel = [
    { id: 'p1', nama: 'Rifky Aziz' },
    { id: 'p2', nama: 'Harmin Sanjayah' },
    { id: 'p3', nama: 'Abdul Rifan Sukarno' },
    { id: 'p4', nama: 'Nandio Prihardana' },
  ];
  const cell = (tanggal, kode = 'SP-T2') => ({ tanggal, kode, shift: kode.startsWith('SP') ? 'M' : 'PS', terminal: 'T2' });
  const rows = [
    { no: 65, nama: 'RIFKY AZIZ', unit: 'x', cells: [cell('2026-11-19'), cell('2026-11-27')] },
    { no: 57, nama: 'HARMIN SANJAYAH', unit: 'x', cells: [cell('2026-11-24'), cell('2026-11-20')] },
    { no: 51, nama: 'ABDUL RIFAN SUKARNO', unit: 'x', cells: [cell('2026-11-21')] },
    { no: 62, nama: 'NANDIO PRIHARDANA', unit: 'x', cells: [cell('2026-11-22')] },
    { no: 99, nama: 'ORANG BARU', unit: 'x', cells: [cell('2026-11-23')] },
  ];
  const jadwal = [
    { id: 'j1', personel_id: 'p1', tanggal: '2026-11-19', shift: 'M', status_kehadiran: 'Hadir' },
    { id: 'j2', personel_id: 'p1', tanggal: '2026-11-27', shift: 'M', status_kehadiran: 'Hadir' },
    { id: 'j3', personel_id: 'p2', tanggal: '2026-11-24', shift: 'M', status_kehadiran: null },
    { id: 'j4', personel_id: 'p2', tanggal: '2026-11-20', shift: 'PS', status_kehadiran: 'Hadir' },
    { id: 'j5', personel_id: 'p3', tanggal: '2026-11-21', shift: 'Malam', status_kehadiran: 'Sakit' },
  ];
  // 27/11 sudah tercatat pada upload sebelumnya dengan label yang sama
  const riwayat = [{ id: 'r0', judul: '', label: 'bantuan umroh sv', dari: '2026-11-27', sampai: '2026-11-27', diunggah: '', penugasan: [
    { personelId: 'p1', nama: 'Rifky Aziz', tanggal: '2026-11-27', shift: 'M' },
  ] }];
  const rencana = susunRencanaRoster(rows, personel, jadwal, STATUS_PENUGASAN_DEFAULT, riwayat);
  const aksi = Object.fromEntries(rencana.map((r) => [`${r.nama}|${r.tanggal}`, r.aksi]));

  assert.deepEqual(aksi, {
    'RIFKY AZIZ|2026-11-19': 'sesuai',
    'RIFKY AZIZ|2026-11-27': 'sudah',
    'HARMIN SANJAYAH|2026-11-24': 'sesuai',
    'HARMIN SANJAYAH|2026-11-20': 'beda_shift',
    'ABDUL RIFAN SUKARNO|2026-11-21': 'tidak_hadir',
    'NANDIO PRIHARDANA|2026-11-22': 'di_luar_jadwal',
    'ORANG BARU|2026-11-23': 'tidak_dikenal',
  });
  assert.equal(rencana.find((r) => r.tanggal === '2026-11-20').shiftLama, 'PS');
  assert.deepEqual(rencana.map((r) => r.tanggal), [...rencana.map((r) => r.tanggal)].sort());
});

test('penugasan yang disimpan hanya item terpilih yang boleh disimpan', () => {
  const base = { nama: 'X', kode: 'SP-T2', shift: 'M', terminal: 'T2', shiftLama: 'M', statusLama: 'Hadir' };
  const rencana = [
    { ...base, key: 'k1', namaMaster: 'Rifky Aziz', personelId: 'p1', tanggal: '2026-11-19', aksi: 'sesuai' },
    { ...base, key: 'k2', namaMaster: 'Nandio Prihardana', personelId: 'p2', tanggal: '2026-11-22', aksi: 'di_luar_jadwal' },
    { ...base, key: 'k3', namaMaster: 'A', personelId: 'p3', tanggal: '2026-11-20', aksi: 'sudah' },
    { ...base, key: 'k4', namaMaster: null, personelId: null, tanggal: '2026-11-21', aksi: 'tidak_dikenal' },
    { ...base, key: 'k5', namaMaster: 'B', personelId: 'p5', tanggal: '2026-11-21', aksi: 'sesuai' },
  ];
  assert.deepEqual(rencanaKePenugasan(rencana, new Set(['k1', 'k2', 'k3', 'k4'])), [
    { personelId: 'p1', nama: 'Rifky Aziz', tanggal: '2026-11-19', shift: 'M' },
    { personelId: 'p2', nama: 'Nandio Prihardana', tanggal: '2026-11-22', shift: 'M' },
  ]);
});

test('penugasan per shift untuk Tab Kehadiran: dikelompokkan per label, nama unik dan urut', () => {
  const riwayat = [
    { id: 'r2', judul: '', label: 'Bantuan Umroh SV', dari: '', sampai: '', diunggah: '', penugasan: [
      { personelId: 'p2', nama: 'Rifky Aziz', tanggal: '2026-11-19', shift: 'M' },
      { personelId: 'p9', nama: 'Abdul Rifan Sukarno', tanggal: '2026-11-19', shift: 'M' },
      { personelId: 'p3', nama: 'Harmin Sanjayah', tanggal: '2026-11-19', shift: 'PS' },
    ] },
    { id: 'r1', judul: '', label: 'Bantuan Umroh SV', dari: '', sampai: '', diunggah: '', penugasan: [
      { personelId: 'p2', nama: 'Rifky Aziz', tanggal: '2026-11-19', shift: 'M' },
    ] },
    { id: 'r0', judul: '', label: 'Bantuan Haji', dari: '', sampai: '', diunggah: '', penugasan: [
      { personelId: 'p4', nama: 'Nandio Prihardana', tanggal: '2026-11-19', shift: 'M' },
    ] },
  ];
  assert.deepEqual(penugasanUntukShift(riwayat, '2026-11-19', 'M'), [
    { label: 'Bantuan Umroh SV', nama: ['Abdul Rifan Sukarno', 'Rifky Aziz'] },
    { label: 'Bantuan Haji', nama: ['Nandio Prihardana'] },
  ]);
  assert.deepEqual(penugasanUntukShift(riwayat, '2026-11-20', 'M'), []);
  assert.deepEqual(penugasanUntukShift(null, '2026-11-19', 'M'), []);
});
