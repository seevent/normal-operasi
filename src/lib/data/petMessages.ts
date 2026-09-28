/**
 * Kumpulan kalimat maskot Chibi Iron Man.
 *
 * Dipisah dari komponen agar isinya mudah disunting tanpa menyentuh logika UI,
 * dan agar pemilihan kalimat bisa diuji.
 */

/** Kalimat santai saat maskot diketuk dan tidak ada kabar operasional apa pun. */
export const PET_IDLE_QUOTES = [
  'I am Iron Man! Versi sachet tapi Arc Reactor tetap menyala!',
  'Alat aman, form terisi, hati tenang. Semangat dinas hari ini!',
  'Arc Reactor 100%! Jangan lupa istirahat sejenak & minum air putih ya.',
  'Aku cinta kalian 3000%! Tetap teliti dalam setiap pengecekan.',
  'X-Ray, WTMD, ETD... kalau ada kendala teknis, hadapi dengan kepala dingin!',
  'Laporan sudah dicek kembali? Detail kecil mencegah kendala besar.',
  'Ssst... armor ini anti-stres dan anti-overthinking!',
];

/** Penyemangat khusus saat laporan kehadiran dikirim = shift baru dimulai. */
export const PET_SHIFT_PAGI_CHEERS = [
  'Shift Pagi dimulai! Arc Reactor penuh, semangat juga harus penuh. Selamat bertugas, tim!',
  'Absensi terkirim. Matahari baru, semangat baru — jaga Terminal 2 dengan sepenuh hati!',
  'Suit up! Shift Pagi resmi jalan. Semoga semua peralatan normal operasi sampai serah terima nanti.',
  'Tim Pagi sudah siaga. Teliti di awal, tenang di akhir. Semangat, Sir!',
];

export const PET_SHIFT_MALAM_CHEERS = [
  'Shift Malam dimulai! Saat yang lain istirahat, kalian yang menjaga. Hormat saya, tim!',
  'Absensi terkirim. Malam panjang, tapi Arc Reactor kita tidak pernah padam. Semangat bertugas!',
  'Suit up untuk Shift Malam! Jaga stamina, jaga fokus, jaga Terminal 2. Kalian luar biasa.',
  'Tim Malam sudah siaga. Tetap waspada dan saling jaga sampai pagi menjemput!',
];

/**
 * Memilih penyemangat sesuai shift yang baru dimulai.
 *
 * @param shift Label atau kode shift ("Pagi, 08.00 - 20.00 WIB", "PS", "M", dst).
 * @param pick  Penyeleksi indeks; dapat diisi pada pengujian agar hasilnya pasti.
 */
export const getShiftCheer = (
  shift: string,
  pick: (max: number) => number = (max) => Math.floor(Math.random() * max)
): string => {
  const normalized = (shift || '').trim().toLowerCase();
  const isMalam = normalized.includes('malam') || normalized === 'm';
  const pool = isMalam ? PET_SHIFT_MALAM_CHEERS : PET_SHIFT_PAGI_CHEERS;
  return pool[Math.min(Math.max(pick(pool.length), 0), pool.length - 1)];
};

/**
 * Memilih kalimat santai yang berbeda dari kalimat sebelumnya, agar maskot
 * tidak mengulang kalimat yang sama dua kali berturut-turut.
 */
export const getIdleQuote = (
  previous?: string | null,
  pick: (max: number) => number = (max) => Math.floor(Math.random() * max)
): string => {
  const available = PET_IDLE_QUOTES.filter((q) => q !== previous);
  const pool = available.length > 0 ? available : PET_IDLE_QUOTES;
  return pool[Math.min(Math.max(pick(pool.length), 0), pool.length - 1)];
};

/**
 * Merangkai kalimat maskot dari daftar field yang belum terisi.
 * Mengembalikan `null` bila tidak ada yang kurang.
 */
export const buildMissingFieldsMessage = (missing: string[]): string | null => {
  const items = missing.map((m) => m.trim()).filter(Boolean);
  if (items.length === 0) return null;
  if (items.length === 1) return `Tunggu dulu — ${items[0]} belum diisi.`;
  const last = items[items.length - 1];
  return `Tunggu dulu — ${items.slice(0, -1).join(', ')} dan ${last} belum diisi.`;
};
