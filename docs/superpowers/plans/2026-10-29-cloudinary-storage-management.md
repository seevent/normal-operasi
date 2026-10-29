# Manajemen Penyimpanan Cloudinary (Tab Data › Cloudinary CDN) — Rencana

> **Status:** rencana, belum dikerjakan. Menunggu keputusan pada bagian "Keputusan yang dibutuhkan".
> **Untuk pelaksana:** gunakan superpowers:executing-plans atau superpowers:subagent-driven-development. Langkah memakai kotak centang (`- [ ]`).

**Tujuan:** admin dapat melihat pemakaian Cloudinary, mengetahui foto/video mana yang memakan tempat dan mana yang sudah tidak dipakai laporan mana pun, lalu menghapusnya dengan aman, semuanya dari sub-tab **Cloudinary CDN** di tab Data.

**Prinsip:** lihat dulu, hapus belakangan. Tahap 1–2 hanya membaca. Penghapusan baru ada di Tahap 3 dan tidak pernah menyentuh berkas yang masih dirujuk laporan.

---

## 1. Fakta akun saat ini (diambil 2026-10-29, bukan perkiraan)

Sumber: Cloudinary Admin/Usage API dan database Supabase proyek SSES T2.

| Hal | Nilai | Artinya |
|---|---|---|
| Paket | **Free**, batas 25 kredit/bulan | Kredit dipakai bersama oleh penyimpanan, bandwidth, dan transformasi |
| Kredit terpakai | 1,54 dari 25 (6,2%) | Aman. Tidak ada tekanan mendesak |
| Rincian kredit | **transformasi 1,08** · bandwidth 0,28 · penyimpanan 0,18 | Penyimpanan (197 MB) **bukan** pemakai terbesar; transformasi justru terbesar |
| Jumlah aset | 827 | |
| Sebaran folder | `SSES_T2_Dokumentasi` (akar) **533** · `PRIMA/PREVENTIVE/...` 181 · `Storing` 82 · `Perbaikan` 32 · `Kegiatan` 4 · `Kalibrasi` 4 · sisa: `samples/*`, `masih-berapa/evidence`, `.../test` | 533 aset menumpuk di akar karena dibuat sebelum folder per-jenis ada (commit `d4b569b`) |
| Batas per berkas (Free) | gambar 10 MB · **video 100 MB** | Video > 100 MB gagal diunggah (lihat catatan risiko) |
| Pencarian dengan agregasi | **tidak didukung** paket Free | Hitungan per folder harus dari beberapa kueri, bukan satu agregasi |
| Data usage | diperbarui **harian** (`last_updated` = kemarin) | Penurunan setelah hapus baru terlihat besok |
| `laporan_operasional` | 949 baris · 682 berfoto · **692 URL** · 620 baris ke Cloudinary · **64 baris ke Supabase Storage** (cadangan) | Hapus massal bisa mematahkan foto di laporan lama |
| `preventive_photo_log` | 181 baris = 181 aset | Status "tersimpan" di Preventive bersumber dari tabel ini |

**Dua temuan yang mengubah prioritas:**
1. Karena penyimpanan hanya 0,18 kredit, nilai fitur ini bukan "menghemat kuota" dalam waktu dekat, melainkan **visibilitas dan kerapian** (membuang sampah uji, memahami apa yang menumpuk) serta **mengawasi transformasi**, yang tumbuh paling cepat setelah konversi video untuk WhatsApp dikirim.
2. Pada paket Free, video > 100 MB ditolak Cloudinary. Perbaikan WhatsApp-video belum punya penjaga ukuran, jadi video besar akan jatuh ke jalur cadangan dan dikirim apa adanya (berpotensi gagal lagi di iPhone). Ini harus ditutup dengan batas ukuran + pesan jelas, terlepas dari fitur manajemen.

## 2. Apa yang akan dilakukan seorang profesional (dan belum diminta)

- **Mengukur sebelum membangun.** Catat biaya transformasi satu konversi video (usage sebelum dan sesudah), supaya angka "berapa video per bulan masih aman" nyata.
- **Rekonsiliasi referensi.** Memetakan setiap URL di `laporan_operasional.foto_urls` dan `preventive_photo_log.secure_url` ke `public_id`, lalu menandai tiap aset di Cloudinary sebagai *dipakai* atau *yatim (orphan)*. Tanpa ini penghapusan berbahaya.
- **Penghapusan dua tahap dan berjejak:** pratinjau (dry-run) → konfirmasi eksplisit → eksekusi → catatan audit siapa/kapan/apa.
- **Mengunci akses di server.** Kunci API tidak pernah ke browser; setiap pemanggilan diverifikasi sebagai admin.
- **Menjaga batas laju API.** Admin API paket Free dibatasi per jam (angkanya dibaca dari header respons, tidak ditebak).

## 3. Bahan mentah yang dipakai (bukan ringkasan dashboard)

- Respons mentah `GET /usage`, `GET /resources/{image|video}?prefix=…&max_results=500` (memberi `bytes`, `created_at`, `public_id`, `asset_folder`, `format`) dan Search API.
- Kolom `foto_urls` mentah di `laporan_operasional` dan `secure_url` di `preventive_photo_log`.
- Daftar isi bucket Supabase Storage `dokumentasi` (64 baris laporan merujuknya) untuk fitur cadangan.
- Header laju API Cloudinary (`X-FeatureRateLimit-*`).

## 4. Metode dan alat

- **Server function** TanStack Start dengan pola yang sama seperti Preventive: logika di `*.server.ts` (menerima `env`, `fetch`, `now` lewat injeksi, mudah diuji dengan `fetch` palsu), pembungkus tipis di `*.functions.ts`.
- **Verifikasi admin di server:** token Supabase dari browser dicek ke `auth.getUser(token)` lalu dicocokkan dengan daftar admin; tanpa lolos → 403.
- **Pencocokan URL → public_id** dengan fungsi murni (menangani `%20`, versi `v123…`, ekstensi, dan transformasi di tengah URL), diuji dengan data nyata.
- **Pemblokiran awalan berbahaya:** hanya awalan yang diizinkan (`SSES_T2_Dokumentasi/`, `samples/`, `masih-berapa/`) yang boleh dihapus massal; `PRIMA/PREVENTIVE/` hanya lewat jalur Preventive.
- UI: komponen React di `src/components/features/cloudinary-storage/`, gaya mengikuti panel pengaturan yang ada, aman untuk 375–430 px, target sentuh ≥ 44 px.

## 5. Bukti bahwa hasilnya benar (selain klaim saya atau Anda)

1. **Angka Cloudinary sendiri:** jumlah total `bytes` hasil hitungan kita harus cocok dengan `storage.usage` di `/usage` (197.043.665 B per 28 Okt) dan jumlah aset dengan Media Library/Console. Selisih > 1% = ada bug.
2. **Rekonsiliasi SQL:** setiap URL di tabel harus punya aset di Cloudinary, kecuali yang memang di Supabase Storage. Hasilnya dicocokkan dengan 692 URL dan 181 baris preventive di atas.
3. **Uji pada folder uji:** unggah 3 aset ke `SSES_T2_Dokumentasi/test`, hapus lewat UI, lalu pastikan lewat kueri terpisah (Search API) bahwa hanya 3 itu yang hilang dan tidak ada baris database berubah.
4. **Penurunan pemakaian keesokan harinya:** `storage.usage` turun sebesar byte yang dihapus.
5. **Tes otomatis:** kasus tolak (bukan admin, awalan terlarang, aset masih dirujuk, >100 per panggilan) dan kasus terima, memakai pola `tests/preventive-upload-server.test.mjs`.

## 6. Keputusan yang dibutuhkan sebelum Tahap 3

1. **Siapa boleh menghapus?** Saat ini tab Data menganggap *akun yang sudah login* = admin. Usulan: daftar email admin di `master_configs` (kunci baru), bukan semua akun.
2. **Aset yang masih dipakai laporan:** usulan v1 **tidak boleh dihapus sama sekali** (terkunci). Menghapus plus membersihkan tautannya di laporan ditunda.
3. **Kebijakan simpan:** hapus otomatis setelah N hari? Usulan: **hanya manual** dulu; otomatis (Tahap 4) menunggu alur manual terbukti.
4. **Thumbnail:** tiap thumbnail unik dihitung sebagai transformasi. Usulan: thumbnail hanya dimuat saat baris dibuka, dengan satu ukuran tetap (`f_auto,q_auto,w_160`) agar di-cache.

---

## Tahap 0 — Pengukuran dan penutup risiko (kecil, bisa dikerjakan lebih dulu)

- [ ] Ukur biaya transformasi satu konversi video: catat `/usage` hari-H, konversi 1 video uji, bandingkan `transformations` besok. Tulis hasilnya di bagian 1.
- [ ] Penjaga ukuran video: tolak video > 100 MB dengan pesan jelas di PhotoUploader (lencana "Terlalu besar") alih-alih jatuh ke jalur cadangan diam-diam. Berkas: `src/lib/services/cloudinaryService.ts`, `src/components/shared/PhotoUploader.tsx`. Tes: `tests/whatsapp-video.test.mjs`.

## Tahap 1 — Pemantau pemakaian (hanya membaca)

**Berkas:** `src/lib/server/cloudinaryAdmin.server.ts`, `src/lib/server/cloudinaryAdmin.functions.ts`, `src/components/features/cloudinary-storage/UsageMeter.tsx`, ubah `CloudinarySettingsPanel.tsx` (jadi dua tab: *Pengaturan* | *Penyimpanan*).

- [ ] Tes dulu: `requireAdmin` menolak tanpa/dengan token salah dan akun bukan admin.
- [ ] `getCloudinaryUsage()`: kredit terpakai/batas, penyimpanan, bandwidth, transformasi, jumlah aset, `last_updated`. Tampilkan batang persentase dan teks "diperbarui harian".
- [ ] Peringatan lembut bila kredit ≥ 70% / 90%.

## Tahap 2 — Penjelajah dan pemetaan referensi (hanya membaca)

**Berkas:** `src/lib/utils/cloudinaryReferences.ts` (murni), `src/components/features/cloudinary-storage/FolderTable.tsx`, `AssetList.tsx`.

- [ ] Tes dulu untuk `publicIdFromUrl` dengan URL nyata dari database (spasi `%20`, versi, ekstensi, `/image/` vs `/video/`).
- [ ] `listCloudinaryAssets({prefix})`: paginasi `next_cursor` (≤ 500/halaman), mengembalikan `public_id, bytes, format, created_at, resource_type`.
- [ ] `getReferencedPublicIds()`: baca `laporan_operasional.foto_urls` dan `preventive_photo_log` lewat service role, kembalikan himpunan `public_id`.
- [ ] Tabel per folder: jumlah, total ukuran, tertua, terbaru, **jumlah dipakai / yatim**.
- [ ] Daftar aset dengan penyaring: folder, jenis (foto/video), yatim saja, > X MB, lebih lama dari N hari.
- [ ] Rekonsiliasi otomatis di UI: total byte vs `/usage`; tampilkan peringatan bila selisih > 1%.

## Tahap 3 — Penghapusan aman

**Berkas:** `deleteCloudinaryAssets` di `cloudinaryAdmin.server.ts`, migrasi `supabase/migrations/<ts>_cloudinary_cleanup_log.sql`, `DeleteDialog.tsx`.

- [ ] Tes dulu: tolak awalan terlarang, tolak aset yang dirujuk, tolak > 100 `public_id`/panggilan, terima aset yatim di awalan yang diizinkan.
- [ ] Server menghitung ulang status "dirujuk" saat eksekusi (tidak percaya klien) sebelum menghapus.
- [ ] Dialog dua langkah: ringkasan (jumlah, total byte, 5 contoh) → ketik `HAPUS <jumlah>` → eksekusi bertahap ≤ 100 per panggilan dengan progres dan hasil per berkas.
- [ ] Tabel audit `cloudinary_cleanup_log` (siapa, kapan, `public_id`, byte, hasil); RLS: hanya admin; tulis lewat server.
- [ ] Pembersihan siap-pakai: "Hapus sampah uji" (`samples/*`, `masih-berapa/*`, `SSES_T2_Dokumentasi/test`) sebagai tombol pertama yang paling aman.
- [ ] Uji ujung ke ujung pada folder uji sesuai bagian 5 (butir 3).

## Tahap 4 — Opsional, hanya bila Tahap 3 terbukti

- [ ] Fungsi terjadwal Netlify untuk retensi otomatis (default mati, ambang hari bisa diatur, selalu menulis audit).
- [ ] Jalur cadangan: daftar dan bersihkan bucket Supabase Storage `dokumentasi`.
- [ ] Hapus aset yang dirujuk **plus** bersihkan tautannya di laporan (perlu keputusan terpisah).

---

## Risiko dan cara menutupnya

| Risiko | Penutup |
|---|---|
| Hapus foto yang masih dirujuk laporan → foto rusak di Shift Report/Excel | Server menolak aset yang dirujuk; status dihitung ulang saat eksekusi |
| Akun biasa ikut menghapus | `requireAdmin` + daftar admin eksplisit; tes penolakan |
| Terhapus tanpa jejak | Tabel audit + konfirmasi ketik jumlah |
| Kena batas laju Admin API | Paginasi hemat, cache hasil di UI, baca header laju |
| Thumbnail menggerus kuota transformasi | Dimuat saat baris dibuka, satu ukuran tetap |
| Kunci API bocor | Hanya di env server; tes memastikan respons tidak memuat rahasia |
| Hitungan tidak cocok dengan tagihan Cloudinary | Rekonsiliasi byte vs `/usage` ditampilkan terus-menerus |
