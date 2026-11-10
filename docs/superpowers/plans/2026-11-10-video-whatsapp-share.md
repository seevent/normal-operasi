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

| Sumber | Temuan |
|---|---|
| Cloudinary (Search API) | 16 video terunggah sejak 30 Okt: 8 MOV, 8 MP4, 1,4–30 MB, semuanya H.264. |
| Cloudinary (detail 3 aset) | Salinan MP4 WhatsApp **berhasil dibuat** untuk ketiganya (0,3–1,6 MB). |
| Supabase `laporan_operasional` | 9 URL video tersimpan (Storing 5, Perbaikan 4), semua di Cloudinary, tidak ada yang jatuh ke cadangan. |
| Cloudinary | Dua pasang video identik diunggah ulang selang 30–85 detik (8 dan 9 Nov). Cocok dengan pengguna mengulang karena video tidak terkirim. |
| Riwayat git | Empat perbaikan sebelumnya (10, 29, 29, 30 Okt) semuanya berdasar dugaan, tanpa catatan hasil di perangkat. |

Kesimpulan: unggah dan konversi **bukan** masalahnya. Kegagalan ada di langkah share.

## 3. Dugaan penyebab (belum dibuktikan di perangkat)

Dua perilaku iOS yang terdokumentasi cocok dengan desain dua-langkah di iPhone:

- **A. Promise share pertama tidak pernah selesai.** Dilaporkan di iOS 14–16
  (forum Apple thread 662629; bug WebKit 216913, dinyatakan diperbaiki 30 Sep 2020 tetapi laporan
  berlanjut sampai Des 2023). Akibat di kode kita: baris setelah `await navigator.share` tidak
  jalan, antrean tidak pernah diisi, **tombol video tidak pernah muncul**.
- **B. Share kedua ditolak** (`NotAllowedError` / `InvalidStateError`). Akibat di kode kita
  (`shareNextPendingBatch`): video **diunduh** sebagai berkas, lalu **dibuang dari antrean**.
  Tidak ada pesan, tidak bisa diulang.

Yang belum diketahui: perangkat mana yang gagal (iPhone/Android, browser, versi iOS), dan apakah
pengguna melihat tombol hijau "Kirim berikutnya (1 video)" atau tidak. Juga belum pernah diuji
apakah penggabungan video + laporan + foto gagal karena `title` (sudah dihapus) atau karena
penggabungannya sendiri; keduanya diubah bersamaan pada 30 Okt.

## 4. Rencana

### Fase 0 — Ukur dulu di perangkat (kecil, 1 deploy)

- [ ] Tabel `share_log` di Supabase (insert publik, baca login): waktu, tab, langkah (1/2/…),
      jumlah foto/video, ukuran, hasil (`resolved`/`rejected`/`timeout`), nama error, lama (ms),
      user agent. Tanpa isi laporan.
- [ ] `shareService` mencatat hasil setiap `navigator.share`, termasuk promise yang menggantung
      (timeout 60 detik, tanpa memengaruhi alur).
- [ ] Halaman "Uji share WhatsApp" di tab Data (khusus login) dengan video contoh 2 detik.
      Matriks 8 sel: {video saja, video+teks, video+foto, video+foto+teks} × {share pertama
      setelah muat ulang, share kedua}. Tiap sel mencatat hasil API dan jawaban pengguna
      "Sampai di WhatsApp? Ya/Tidak".
- [ ] Dijalankan di iPhone yang bermasalah (Safari dan Chrome) dan satu Android. ±10 menit.

### Fase 1 — Perbaikan yang benar apa pun hasil ujinya

- [ ] Antrean diisi **sebelum** `navigator.share` pertama dipanggil, bukan setelah promise selesai
      (menutup penyebab A). Batal (`AbortError`) mengosongkan antrean seperti sekarang.
- [ ] Kiriman yang gagal **tetap di antrean**; tidak ada unduhan diam-diam (menutup penyebab B).
      Bilah menampilkan "Video belum terkirim" dengan tombol Coba lagi.
- [ ] Jalan cadangan bila share berkas tetap ditolak: "Kirim tautan video" (URL MP4 Cloudinary
      sebagai pesan teks) dan "Simpan video" (unduh dengan sengaja).
- [ ] Antrean bertahan bila halaman dimuat ulang (IndexedDB), karena muat ulang adalah satu-satunya
      jalan keluar yang dilaporkan untuk share kedua yang macet di iOS.
- [ ] Bilah lebih jelas: jumlah video yang belum terkirim, dan peringatan bila pengguna pindah tab
      atau menutup aplikasi dengan antrean belum kosong.

### Fase 2 — Pilih strategi iPhone dari hasil matriks

| Hasil uji | Strategi |
|---|---|
| video+foto+teks dalam satu share sampai | Kembali ke **satu share** di iPhone (satu ketukan). |
| Gabungan gagal, share kedua berhasil | Tetap dua langkah, dengan perbaikan Fase 1. |
| Share kedua selalu gagal | Video dikirim **lebih dulu** atau lewat muat ulang otomatis + antrean tersimpan; tautan video sebagai cadangan. |

### Fase 3 — Uji dan dokumentasi

- [ ] Tes unit: antrean terisi sebelum share; kiriman gagal tidak dibuang; promise menggantung
      tidak mengunci antrean; pemulihan antrean setelah muat ulang.
- [ ] `tests/share-report.test.mjs` dan `tests/share-batches.test.mjs` diperbarui.
- [ ] `agent.md` §2.7: aturan share video dan hasil matriks perangkat.

## 5. Bukti bahwa perbaikan berhasil (bukan dari pembuatnya)

- Video muncul di grup WhatsApp pada ponsel **penerima**, untuk tiap tab, di iPhone dan Android.
- `share_log` selama 7 hari: setiap laporan bervideo punya langkah video berstatus `resolved`,
  dan tidak ada antrean yang ditinggal.
- Tidak ada lagi video kembar yang diunggah ulang dalam hitungan menit di Cloudinary.

## 6. Temuan sampingan (di luar lingkup, perlu keputusan terpisah)

- Tab Kalibrasi tidak menyimpan video ke dokumentasi laporan (hanya foto diunggah saat Kirim).
- Video diunggah saat dipilih, jadi video dari laporan yang batal dikirim tetap tersisa di
  Cloudinary (16 video terunggah, 9 tercatat di laporan; Initial Report dan Briefing memang
  tidak menyimpan lampiran).
- Batas ukuran video Cloudinary paket Free 100 MB; belum ada penjaga ukuran di `PhotoUploader`.
