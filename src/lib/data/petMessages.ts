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

/** Tab yang punya penyemangat sendiri saat laporannya dikirim ke WhatsApp (Kehadiran memakai penyemangat shift). */
export type TabCheerKey =
  | 'briefing'
  | 'storing'
  | 'checklist'
  | 'initial'
  | 'perbaikan'
  | 'kalibrasi'
  | 'kegiatan'
  | 'ba_serah_terima'
  | 'report'
  | 'tip';

/** Penyemangat per tab, dikirim maskot setiap laporan tab tersebut dibagikan ke WhatsApp. */
export const PET_TAB_CHEERS: Record<TabCheerKey, string[]> = {
  briefing: [
    'Briefing terkirim! Tim yang tahu arahan akan bekerja dengan tenang. Semangat, Pak Leader!',
    'Bip! Arahan hari ini sudah sampai ke semua orang. Awal yang rapi, hasil akhir pasti mantap!',
    'Briefing selesai, semua siap bergerak. Kompak itu kekuatan terbesar tim SSES T2!',
  ],
  storing: [
    'Laporan storing terkirim! Peralatan boleh istirahat, kamu tetap semangat. Mantap!',
    'Bip! Storing tercatat rapi. Kerja yang teliti hari ini memudahkan tim berikutnya. Semangat!',
    'Satu peralatan sudah aman tercatat. Pelan tapi pasti, kita jaga semua tetap terkendali!',
  ],
  checklist: [
    'Checklist terkirim! Pengecekan teliti seperti ini yang membuat Terminal 2 tetap aman. Hebat!',
    'Bip bip! Semua poin sudah dicek dan dilaporkan. Terima kasih sudah teliti, semangat dinas!',
    'Checklist beres! Detail kecil kamu jaga, hasilnya terasa untuk ribuan penumpang. Keren!',
  ],
  initial: [
    'Laporan awal terkirim! Gerak cepatmu membantu tim menangani gangguan lebih tenang. Semangat!',
    'Bip! Kabar gangguan sudah sampai. Tarik napas, kamu sudah melakukan langkah pertama dengan baik.',
    'Laporan awal selesai. Setiap gangguan pasti ada jalan keluarnya, dan kita hadapi bersama!',
  ],
  perbaikan: [
    'Laporan perbaikan terkirim! Satu masalah selesai, terima kasih sudah turun tangan. Mantap!',
    'Bip bip! Peralatan kembali sehat berkat tanganmu. Lelahmu terbayar, semangat terus!',
    'Perbaikan tercatat rapi. Teknisi hebat itu yang sabar menelusuri sampai tuntas. Salut!',
  ],
  kalibrasi: [
    'Laporan kalibrasi terkirim! Alat yang akurat lahir dari tangan yang teliti. Semangat!',
    'Bip! Kalibrasi dan PM tercatat. Kerja rutin seperti ini yang menjaga scan tetap tajam. Keren!',
    'Satu lokasi sudah terkalibrasi. Tetap fokus dan teliti, hasilnya terasa di setiap pemeriksaan!',
  ],
  kegiatan: [
    'Laporan kegiatan terkirim! Setiap langkah kecil di lapangan berarti besar. Semangat terus!',
    'Bip! Kegiatan hari ini sudah tercatat. Kerja kerasmu terlihat, terima kasih ya!',
    'Kegiatan tercatat rapi. Terus jaga ritme, tim bangga dengan kerja kalian!',
  ],
  ba_serah_terima: [
    'Berita Acara terkirim! Serah terima yang tertib bikin semua pihak tenang. Kerja bagus!',
    'Bip bip! Tanda tangan lengkap, barang tercatat jelas. Rapi dan bertanggung jawab, mantap!',
    'Serah terima selesai! Ketelitianmu menjaga aset tetap aman. Terima kasih, semangat!',
  ],
  report: [
    'Laporan shift terkirim! Terima kasih sudah menjaga Terminal 2 sepanjang dinas. Istirahat yang cukup ya!',
    'Bip! Rekap shift sudah sampai ke tim berikutnya. Kerja kerasmu hari ini luar biasa!',
    'Shift report selesai. Serah terima yang rapi adalah penutup dinas terbaik. Hormat dariku!',
  ],
  tip: [
    'Laporan TIP terkirim! Mata yang waspada membuat penumpang aman. Terus semangat berlatih!',
    'Bip bip! TIP bulan ini tercatat. Konsisten sedikit demi sedikit, hasilnya pasti terasa!',
    'Laporan TIP selesai. Ketajaman kalian adalah garis pertahanan yang paling berharga!',
  ],
};

/**
 * Memilih penyemangat untuk tab yang laporannya baru dibagikan.
 *
 * @param tab  Kunci tab (sama dengan id tab di App.tsx).
 * @param pick Penyeleksi indeks; dapat diisi pada pengujian agar hasilnya pasti.
 */
export const getTabCheer = (
  tab: TabCheerKey,
  pick: (max: number) => number = (max) => Math.floor(Math.random() * max)
): string => {
  const pool = PET_TAB_CHEERS[tab];
  return pool[Math.min(Math.max(pick(pool.length), 0), pool.length - 1)];
};

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
