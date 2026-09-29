/**
 * Kumpulan kalimat maskot mesin X-Ray.
 *
 * Persona: mesin X-Ray bagasi yang ramah dan bekerja bersama tim SSES T2.
 * Ia memindai bagasi penumpang, jadi bahasanya berputar di sekitar scan,
 * konveyor, dan hasil pemeriksaan.
 *
 * Dipisah dari komponen agar isinya mudah disunting tanpa menyentuh logika UI,
 * dan agar pemilihan kalimat bisa diuji.
 */

/** Kalimat santai saat maskot diketuk dan tidak ada kabar operasional apa pun. */
export const PET_IDLE_QUOTES = [
  'Bip! Bagasi lewat satu per satu, laporan juga sebaiknya diisi satu per satu. Pelan tapi teliti!',
  'Aku memindai isi tas, kamu memindai kondisi peralatan. Tim yang kompak!',
  'Isi tas bisa kulihat tembus, tapi isi form tetap kamu yang harus teliti ya.',
  'Jangan lupa minum air putih. Mesin saja butuh istirahat, apalagi manusia!',
  'Konveyor lancar, kabel rapi, hati tenang. Semangat dinas hari ini!',
  'Laporan sudah dicek kembali? Detail kecil sering bersembunyi, seperti barang di dasar tas.',
  'Kalau ada kendala teknis, tarik napas dulu. Aku juga ngambek kalau konveyor macet!',
  'Ssst... kalau ada bungkusan hadiah lewat, aku janji tidak akan membocorkan isinya.',
];

/** Penyemangat khusus saat laporan kehadiran dikirim = shift baru dimulai. */
export const PET_SHIFT_PAGI_CHEERS = [
  'Shift Pagi dimulai! Konveyor sudah menyala, semangat juga harus menyala. Selamat bertugas, tim!',
  'Absensi terkirim. Pagi baru, bagasi baru, semangat baru. Jaga Terminal 2 sepenuh hati!',
  'Siap scan! Shift Pagi resmi jalan. Semoga semua peralatan normal operasi sampai serah terima nanti.',
  'Tim Pagi sudah siaga. Teliti di awal, tenang di akhir. Semangat!',
];

export const PET_SHIFT_MALAM_CHEERS = [
  'Shift Malam dimulai! Saat yang lain istirahat, kalian yang menjaga. Hormat dariku, tim!',
  'Absensi terkirim. Malam panjang, tapi lampu scan kita tidak pernah padam. Semangat bertugas!',
  'Siap scan untuk Shift Malam! Jaga stamina, jaga fokus, jaga Terminal 2. Kalian luar biasa.',
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
  if (items.length === 1) return `Bip bip! Hasil scan: ${items[0]} belum diisi.`;
  const last = items[items.length - 1];
  return `Bip bip! Hasil scan: ${items.slice(0, -1).join(', ')} dan ${last} belum diisi.`;
};
