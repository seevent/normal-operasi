# Rencana: lampiran video ikut terkirim ke WhatsApp

Tanggal: 10 Nov 2026. Status: rencana, belum dikerjakan.

**Tujuan:** setiap video yang dilampirkan di tab Kegiatan, Storing, Perbaikan, Kalibrasi,
Initial Report, dan Briefing sampai di WhatsApp, atau pengguna diberi tahu dengan jelas bahwa
belum terkirim dan diberi jalan lain. Tidak boleh ada video yang hilang tanpa pemberitahuan.

## 1. Cara kerja sekarang

Semua tab memakai jalur yang sama, jadi perbaikan cukup di satu tempat.

1. `PhotoUploader` menerima `image/*,video/*`. Video tidak dikompres (`compressImageFile`).
2. Begitu video dipilih, `prefetchVideosForWhatsApp` mengunggahnya ke Cloudinary dan mengunduh
   salinan MP4 H.264/AAC ≤1280 px (`whatsappVideoService.ts`).
3. Saat Kirim, tiap tab menyusun `File[][]` (kolase + video per grup) lalu memanggil
   `shareReportWithMedia` (`shareService.ts`).
4. `planShareItems` (`shareBatches.ts`) menyusun kiriman:
   - Android: satu share berisi laporan + foto + video.
   - iPhone/iPad: share pertama laporan + foto; **tiap video share tersendiri** lewat tombol hijau
     di `PendingShareBar` ("Kirim berikutnya (1 video)").
5. Sisa kiriman baru dimasukkan ke antrean **setelah** `await navigator.share(...)` pertama selesai.

## 2. Bukti yang sudah dikumpulkan (10 Nov 2026)

**Laporan pengguna:** gagal di iPhone dan Android, Safari dan Chrome. Tombol kirim video tidak
muncul. Saat fitur video pertama dibuat, lampiran terkirim dengan baik; rusak setelah beberapa
push ke `main`. Jadi ini **regresi di kode kita**.

| Sumber | Temuan |
|---|---|
| Cloudinary (Search API) | 16 video terunggah sejak 30 Okt: 8 MOV, 8 MP4, 1,4–30 MB. |
| Cloudinary (detail 6 aset: 4 iPhone, 2 Android) | Semua yang diperiksa **sudah H.264 + AAC** saat diunggah. Tidak ada HEVC. Salinan MP4 WhatsApp berhasil dibuat untuk 5 dari 6. |
| Supabase `laporan_operasional` | 9 URL video tersimpan (Storing 5, Perbaikan 4), semua di Cloudinary. |
| Cloudinary | Dua pasang video identik diunggah ulang selang 30–85 detik (8 dan 9 Nov): pengguna mengulang. |
| Riwayat git | Kode awal (sampai 2 Okt, `874e447`): **satu** `navigator.share` berisi laporan + kolase + video asli, langsung saat Kirim ditekan. |

Unggah dan konversi berjalan. Kegagalan ada di langkah share.

### Reproduksi (kode asli tab Kegiatan di Chromium, WhatsApp dan Cloudinary tiruan)

| Skenario | Hasil |
|---|---|
| Android, video sudah "Siap" | Satu share: foto + video MP4 + laporan. Benar. |
| **Android/iPhone, Kirim ditekan sebelum video "Siap"** | **Tidak ada share sama sekali.** Bilah abu-abu "Menyiapkan video (0/1)" tanpa tombol sampai unggah + konversi + unduh selesai. Unggah tidak punya batas waktu. |
| iPhone, video siap, share normal | Share 1: laporan + foto. Tombol "Kirim berikutnya (1 video)" muncul setelah share 1 selesai. |
| **iPhone, promise share 1 tidak pernah selesai** | **Bilah tidak pernah muncul**, video tidak pernah ditawarkan. |

Dua skenario tebal menghasilkan persis gejala yang dilaporkan. Yang pertama berlaku di semua
perangkat dan makin parah di jaringan lambat (video 4–30 MB harus naik dulu).
Yang kedua bergantung pada perilaku iOS yang terdokumentasi (forum Apple thread 662629, bug
WebKit 216913) tetapi belum dipastikan di perangkat pengguna.

## 3. Commit yang merusak

| Commit | Perubahan | Akibat |
|---|---|---|
| `356fde9`, `cac7ccc` (10 Okt) | Media dipecah jadi beberapa kiriman lewat `PendingShareBar` | Kiriman lanjutan baru diantrekan setelah promise share pertama selesai. |
| `469bfaa`, `d44e271` (29 Okt) | Video wajib diunggah ke Cloudinary dan dikonversi dulu | Kirim tidak lagi langsung membuka WhatsApp; menunggu jaringan. Alasannya (rekaman iPhone HEVC ditolak) tidak didukung data: video yang diperiksa sudah H.264. |
| `4a70b7b` (30 Okt) | Di iPhone video selalu jadi kiriman kedua | Video sepenuhnya bergantung pada tombol yang bisa tidak muncul. |

Yang belum diketahui: apakah di iPhone gabungan video + foto + laporan dalam satu share memang
ditolak WhatsApp ("Tidak dapat mengirim pesan"), atau itu akibat `title` yang kini sudah dihapus.
Keduanya diubah bersamaan dan tidak pernah diuji terpisah.

## 4. Rencana

### Fase 1 — Kembalikan perilaku yang dulu berfungsi

- [ ] Kirim ditekan = **satu share saat itu juga**: laporan + foto + video, di semua perangkat,
      seperti kode awal. Tidak pernah menunggu unggah atau konversi.
- [ ] Video memakai salinan MP4 bila sudah "Siap"; bila belum, **video asli** yang dikirim.
- [ ] Unggah video untuk dokumentasi tetap berjalan di latar belakang (tidak menghalangi share).
- [ ] Tombol "WhatsApp gagal? Kirim ulang terpisah" disiapkan **sebelum** share dipanggil, bukan
      setelah promise selesai, supaya selalu tersedia.

### Fase 2 — Pengaman

- [ ] Kiriman lanjutan yang gagal **tetap di antrean** dengan tombol Coba lagi; tidak ada unduhan
      diam-diam dan tidak dibuang.
- [ ] Jalan cadangan: "Kirim tautan video" (URL MP4 Cloudinary sebagai pesan teks) dan
      "Simpan video".
- [ ] Unggah video diberi batas waktu dan status gagal yang jelas di lencana.

### Fase 3 — Ukur di perangkat (bersamaan dengan Fase 1)

- [ ] Tabel `share_log` (insert publik, baca login): waktu, tab, langkah, jumlah foto/video,
      ukuran, video asli atau konversi, hasil (`resolved`/`rejected`/`timeout`), nama error,
      lama, user agent. Tanpa isi laporan.
- [ ] Halaman "Uji share WhatsApp" di tab Data: pilih mode (satu share video asli / satu share
      video konversi / video terpisah), kirim, lalu jawab "Sampai di WhatsApp?". Dijalankan di
      iPhone dan Android, ±10 menit.
- [ ] Bila di iPhone satu share terbukti ditolak WhatsApp, iPhone pindah ke mode yang lolos uji.
      Keputusan dari `share_log`, bukan dugaan.

### Fase 4 — Uji dan dokumentasi

- [ ] Skrip reproduksi di atas dijadikan tes: 6 skenario (Android/iPhone × siap/belum siap ×
      promise selesai/menggantung) harus selalu menghasilkan share yang memuat video atau tombol
      yang terlihat.
- [ ] Tes unit `shareBatches` dan `share-report` diperbarui.
- [ ] `agent.md` §2.7: aturan share video dan hasil uji perangkat.

## 5. Bukti bahwa perbaikan berhasil (bukan dari pembuatnya)

- Video muncul di grup WhatsApp pada ponsel **penerima**, untuk tiap tab, di iPhone dan Android.
- `share_log` selama 7 hari: setiap laporan bervideo punya langkah video berstatus `resolved`,
  dan tidak ada antrean yang ditinggal.
- Kirim dengan video membuka WhatsApp dalam 1 detik walau jaringan lambat (video belum "Siap").
- Tidak ada lagi video kembar yang diunggah ulang dalam hitungan menit di Cloudinary.

## 6. Temuan sampingan (di luar lingkup, perlu keputusan terpisah)

- Tab Kalibrasi tidak menyimpan video ke dokumentasi laporan (hanya foto diunggah saat Kirim).
- Video diunggah saat dipilih, jadi video dari laporan yang batal dikirim tetap tersisa di
  Cloudinary (16 video terunggah, 9 tercatat di laporan; Initial Report dan Briefing memang
  tidak menyimpan lampiran).
- Batas ukuran video Cloudinary paket Free 100 MB; belum ada penjaga ukuran di `PhotoUploader`.
