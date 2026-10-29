# Manajemen Penyimpanan Laporan: Supabase + Cloudinary (Tab Data › Cloudinary CDN) — Rencana

> **Status:** rencana, belum dikerjakan. Menunggu keputusan pada bagian 7.
> **Untuk pelaksana:** gunakan superpowers:executing-plans atau superpowers:subagent-driven-development. Langkah memakai kotak centang (`- [ ]`).

**Tujuan:** admin dapat (1) melihat pemakaian Cloudinary dan database, (2) memilih **rentang tanggal** laporan, melihat pratinjau apa saja yang akan hilang, mengunduh arsipnya, lalu (3) menghapus **baris laporan di Supabase bersama foto/video yang menyertainya** di Cloudinary dan Supabase Storage, dengan aman, berjejak, dan bisa dibatalkan selama masa tenggang.

**Prinsip:**
- Lihat dulu, arsipkan, baru hapus.
- Baris database dihapus **lebih dulu**, media **sesudahnya**. Kalau proses terputus di tengah, akibat terburuknya media yatim (tidak merusak apa pun dan bisa dibersihkan), bukan laporan dengan foto rusak.
- Media hanya dihapus bila **tidak ada lagi** baris yang merujuknya.

---

## 1. Fakta saat ini (diambil 2026-10-29 dari Cloudinary dan Supabase, bukan perkiraan)

| Hal | Nilai | Artinya |
|---|---|---|
| Cloudinary | Paket **Free**, 1,54 / 25 kredit (6,2%): transformasi 1,08 · bandwidth 0,28 · penyimpanan 0,18 (197 MB) · 827 aset | Belum ada tekanan kuota |
| Sebaran folder Cloudinary | `SSES_T2_Dokumentasi` (akar) **533** · `PRIMA/PREVENTIVE/...` 181 · `Storing` 82 · `Perbaikan` 32 · `Kegiatan` 4 · `Kalibrasi` 4 · sisa uji: `samples/*`, `masih-berapa/evidence`, `.../test` | 533 aset lama ada di akar (sebelum commit `d4b569b`) |
| Batas per berkas (Free) | gambar 10 MB · **video 100 MB** | Video lebih besar ditolak |
| Database | **15 MB** dari 500 MB (Free); `laporan_operasional` hanya **448 kB** | Menghapus baris hampir tidak menghemat apa pun. Penghematan nyata ada di media |
| `laporan_operasional` | 949 baris (Sep 155, **Okt 794**) · 682 berfoto · 692 URL (687 unik) | Laju ±800 laporan/bulan |
| URL dipakai > 1 laporan | **5** | Penghapusan media harus mengecek pemakai lain |
| Tautan ke Supabase Storage | 64, dan **62 di antaranya berkasnya sudah tidak ada** (bucket `dokumentasi` hanya berisi 3 foto) | Sudah ada foto hilang di laporan Sep–Okt. Pratinjau harus menampilkan "tautan rusak" |
| `preventive_photo_log` | 181 baris = 181 aset (bukti PRIMA) | Diperlakukan terpisah, default tidak ikut dihapus |
| Relasi FK ke `laporan_operasional` | tidak ada | Tidak ada tabel lain yang patah karena baris hilang |
| **RLS `laporan_operasional`** | `DELETE`, `UPDATE`, `INSERT`, `SELECT` dibuka untuk **`anon`** | **Siapa pun yang memegang kunci anon (ada di kode aplikasi web) bisa menghapus seluruh laporan sekarang juga.** Lihat Tahap 0 |
| Penghapusan dari aplikasi saat ini | `TabShiftReport.tsx:334` (`delete().eq('id', …)`) dan `:402` (`update`) langsung dari browser; foto di Cloudinary tidak ikut terhapus | Sudah ada jalur hapus tanpa membersihkan media |

**Proyeksi:** dengan laju sekarang, media tumbuh sekitar 2 GB per tahun (±2 kredit), jauh di bawah 25 kredit/bulan. Jadi penghapusan per rentang adalah soal **kebijakan dan kerapian data**, bukan kebutuhan kuota dalam waktu dekat. Pemakai kuota yang paling cepat tumbuh adalah transformasi (konversi video WhatsApp).

## 2. Apa yang akan dilakukan seorang profesional (dan belum diminta)

- **Menutup lubang izin dulu.** Fitur hapus khusus admin tidak ada artinya selama kunci publik bisa menghapus langsung.
- **Kebijakan retensi tertulis.** Laporan operasional bandara bisa terikat kewajiban simpan internal atau audit. Rentang yang boleh dihapus perlu ditetapkan atasan, bukan ditebak di aplikasi. Aplikasi menegakkannya, misalnya dengan "tidak boleh menghapus yang lebih baru dari N hari".
- **Arsip wajib sebelum hapus.** Unduh Excel (fitur ekspor dengan foto tertanam sudah ada) dan/atau ZIP (JSON baris + media asli) untuk rentang itu.
- **Masa tenggang (tempat sampah).** Baris dipindah ke tabel sampah dan bisa dipulihkan selama 7 hari. Media baru dihapus saat sampah dikosongkan.
- **Proses sebagai "job" yang bisa dilanjutkan.** Daftar baris dan media dibekukan saat dimulai. Tiap langkah idempoten, sehingga bila koneksi putus, cukup tekan "Lanjutkan".
- **Rekonsiliasi.** Ukur tautan rusak dan aset yatim sebelum dan sesudah.

## 3. Bahan mentah yang dipakai

- Baris mentah `laporan_operasional` (`id, tanggal, jenis, kategori_maintenance, foto_urls, created_at`) dan `preventive_photo_log`.
- Respons mentah Cloudinary `GET /usage`, `GET /resources/{image|video}` (berisi `bytes`, `public_id`, `created_at`) dan Search API.
- Isi `storage.objects` bucket `dokumentasi`.
- Header laju API Cloudinary (`X-FeatureRateLimit-*`).

## 4. Metode dan alat

- **Server function** TanStack Start dengan pola Preventive: logika di `src/lib/server/storageAdmin.server.ts` (injeksi `env`, `fetch`, `now`; diuji dengan `fetch` palsu), pembungkus di `storageAdmin.functions.ts`. API secret Cloudinary dan service-role Supabase hanya ada di server.
- **Verifikasi admin di server:** token Supabase dari browser dicek dengan `auth.getUser(token)` lalu dicocokkan dengan daftar admin di `master_configs`.
- **RPC Postgres `SECURITY DEFINER`** (hanya `service_role`) untuk memindahkan baris ke sampah, memulihkan, dan mengosongkan, dalam satu transaksi per langkah.
- **Fungsi murni** `mediaRefFromUrl(url)` → `{provider: 'cloudinary'|'supabase', resourceType, publicId | path}` (menangani `%20`, versi `v…`, ekstensi, transformasi), diuji dengan URL nyata dari database.
- **Pencocokan rujukan** dihitung di server saat eksekusi, tidak percaya data dari klien.
- UI di `src/components/features/storage-manager/`, aman untuk lebar 375–430 px, target sentuh ≥ 44 px.

## 5. Desain alur hapus per rentang

```
[Pilih rentang + jenis] → [Pratinjau] → [Unduh arsip] → [Pindah ke Sampah] → (7 hari / manual) → [Kosongkan Sampah]
                                                              │                                      │
                                                     baris pindah tabel,                   1. hapus baris permanen
                                                     media utuh, bisa dipulihkan           2. hapus media yang tak dirujuk lagi
                                                                                           3. catat audit, job selesai
```

**Pratinjau** (server, hanya membaca) menampilkan:
- jumlah laporan per jenis dan per bulan dalam rentang;
- jumlah foto/video dan total ukurannya (byte dari Cloudinary);
- **media dipakai bersama** laporan di luar rentang: tidak akan dihapus, ditampilkan jumlahnya;
- **tautan rusak**: berkas sudah tidak ada, ditampilkan agar tidak dikira kesalahan fitur;
- penjaga kebijakan, misalnya "rentang menyentuh 30 hari terakhir → ditolak" (angka mengikuti keputusan 7.3).

**Pindah ke Sampah** (RPC `trash_reports(job_id)`): baris dipindah ke `laporan_operasional_sampah` (skema sama + `deleted_at`, `deleted_by`, `job_id`) dalam satu transaksi. Pembaca yang ada (Shift Report, Export Excel) tidak perlu diubah, karena baris memang sudah tidak ada di tabel utama.

**Pulihkan** (RPC `restore_reports(job_id)`): pindahkan kembali selama belum dikosongkan.

**Kosongkan Sampah** (job, bisa dilanjutkan):
1. Hapus baris sampah job itu secara permanen.
2. Untuk setiap media milik job: hapus **hanya bila** tidak dirujuk baris mana pun di `laporan_operasional` maupun sampah lain. Cloudinary dihapus per ≤ 100 `public_id` per panggilan; Supabase Storage lewat API Storage.
3. Catat hasil per berkas di `storage_cleanup_jobs` / `storage_cleanup_items`. Kegagalan membuat job berstatus `partial` dan tombol "Lanjutkan" muncul.

**Preventive (`preventive_photo_log`)**: opsi terpisah, default mati. Bila diaktifkan, rentang tidak boleh menyentuh periode berjalan, supaya status "tersimpan" di tab Preventive tidak menunjuk foto yang sudah hilang.

## 6. Bukti bahwa hasilnya benar (selain klaim saya atau Anda)

1. **Uji kering pada data uji:** sisipkan 10 laporan bertanggal `2000-01-01` sampai `2000-01-05` dengan 12 media di `SSES_T2_Dokumentasi/test`. Dua media dirujuk juga oleh laporan di luar rentang dan satu tautan sengaja rusak. Jalankan seluruh alur, lalu periksa lewat kueri terpisah: tepat 10 baris hilang, tepat 10 media hilang (2 media bersama tetap ada), tidak ada baris lain yang berubah.
2. **Hitungan sebelum dan sesudah** di database (SQL) dan Cloudinary (Search API) harus cocok dengan angka pratinjau.
3. **Angka Cloudinary sendiri:** `storage.usage` di `/usage` turun sebesar byte yang dihapus pada pembaruan harian berikutnya.
4. **Latihan pemulihan:** pindahkan ke sampah lalu pulihkan. Laporan muncul lagi di Shift Report dengan foto utuh.
5. **Tes otomatis** (pola `tests/preventive-upload-server.test.mjs`): tolak bukan admin, tolak rentang yang dilarang kebijakan, media bersama tidak dihapus, job `partial` bisa dilanjutkan tanpa menghapus dua kali.
6. **Uji izin:** setelah Tahap 0, `DELETE` memakai kunci anon terhadap `laporan_operasional` harus ditolak.

## 7. Keputusan yang dibutuhkan

1. **Lubang RLS (Tahap 0):** Shift Report saat ini mengedit dan menghapus laporan langsung dari browser. Siapa yang memakai fitur itu: hanya akun login, atau semua petugas tanpa login?
   - Hanya akun login → cukup cabut izin `anon` untuk `DELETE`/`UPDATE`.
   - Semua petugas → hapus/edit di Shift Report dipindah ke server function. Ini perubahan lebih besar.
2. **Siapa boleh memakai fitur hapus per rentang?** Usulan: daftar email admin khusus di `master_configs`.
3. **Kebijakan retensi:** laporan minimal disimpan berapa lama (mis. 12 bulan)? Perlu ditetapkan atasan. Aplikasi akan menolak rentang yang lebih baru.
4. **Masa tenggang sampah:** usulan 7 hari, dikosongkan manual atau otomatis?
5. **Format arsip wajib:** Excel (sudah ada) saja, atau juga ZIP berisi media asli?
6. **Preventive ikut dikelola?** Usulan: tidak di versi pertama.

---

## Tahap 0 — Prasyarat keamanan dan penutup risiko

- [ ] Tes dulu: `DELETE`/`UPDATE` ke `laporan_operasional` dengan kunci anon harus ditolak.
- [ ] Migrasi RLS sesuai keputusan 7.1. Bila Shift Report dipakai tanpa login, buat server function `deleteShiftReportItem`/`updateShiftReportItem` dan ganti panggilan di `TabShiftReport.tsx:334,402`.
- [ ] Hapus di Shift Report juga memindahkan baris ke sampah (bukan hapus permanen), supaya medianya ikut terkelola.
- [ ] Penjaga ukuran video 100 MB di PhotoUploader (lencana "Terlalu besar").
- [ ] Ukur biaya transformasi satu konversi video (usage hari H vs H+1) dan catat di bagian 1.

## Tahap 1 — Pemantau pemakaian (hanya membaca)

**Berkas:** `storageAdmin.server.ts`, `storageAdmin.functions.ts`, `storage-manager/UsageMeter.tsx`, ubah `CloudinarySettingsPanel.tsx` menjadi tab *Pengaturan* | *Penyimpanan*.

- [ ] Tes dulu `requireAdmin`.
- [ ] Kartu Cloudinary (kredit, penyimpanan, bandwidth, transformasi, aset, `last_updated`) dan kartu database (ukuran DB, jumlah laporan per bulan).
- [ ] Peringatan bila kredit ≥ 70% / 90%.

## Tahap 2 — Pratinjau rentang dan peta rujukan (hanya membaca)

**Berkas:** `src/lib/utils/mediaRefs.ts` (murni), `storage-manager/RangePicker.tsx`, `RangePreview.tsx`.

- [ ] Tes dulu `mediaRefFromUrl` dengan URL nyata (Cloudinary image/video, `%20`, Supabase Storage).
- [ ] `previewRange({from, to, jenis[]})`: hitungan per jenis/bulan, media, byte, media bersama, tautan rusak, hasil penjaga kebijakan.
- [ ] Tombol arsip: Excel (pakai ekspor yang ada) dan opsional ZIP. Tombol hapus baru aktif setelah arsip diunduh.

## Tahap 3 — Sampah, pulihkan, kosongkan

**Berkas:** migrasi `<ts>_storage_cleanup.sql` (tabel sampah, `storage_cleanup_jobs`, `storage_cleanup_items`, RPC `trash_reports`, `restore_reports`, `purge_trash_job`), `storage-manager/TrashList.tsx`, `ConfirmDialog.tsx`.

- [ ] Tes dulu untuk semua kasus di bagian 6 butir 5.
- [ ] Konfirmasi dengan mengetik `HAPUS <jumlah laporan>`.
- [ ] Daftar sampah: job, rentang, jumlah, sisa hari, tombol Pulihkan / Kosongkan sekarang.
- [ ] Kosongkan bertahap dengan progres; status `partial` → "Lanjutkan".
- [ ] Uji kering pada data uji tahun 2000 sesuai bagian 6 butir 1, lalu latihan pemulihan (butir 4).

## Tahap 4 — Pembersihan media yatim dan sampah uji

- [ ] Sapu media Cloudinary/Storage yang tidak dirujuk baris mana pun (pratinjau → hapus), termasuk `samples/*`, `masih-berapa/*`, `SSES_T2_Dokumentasi/test`.
- [ ] Laporan "tautan rusak" (saat ini 62) dengan opsi membersihkan URL mati dari `foto_urls`.

## Tahap 5 — Opsional

- [ ] Fungsi terjadwal Netlify: kosongkan sampah otomatis setelah masa tenggang; retensi otomatis (default mati).
- [ ] Preventive ikut dikelola (bila keputusan 7.6 berubah).

---

## Risiko dan cara menutupnya

| Risiko | Penutup |
|---|---|
| Kunci anon bisa menghapus semua laporan | Tahap 0: cabut izin `anon` atau pindahkan ke server function |
| Salah pilih rentang | Pratinjau, arsip wajib, konfirmasi ketik, sampah 7 hari |
| Foto dipakai laporan lain ikut terhapus | Media hanya dihapus bila tidak dirujuk baris mana pun, dicek di server saat eksekusi |
| Proses terputus di tengah | Job bertahap dan idempoten; urutan baris dulu, media belakangan |
| Melanggar kewajiban simpan | Penjaga kebijakan retensi di server |
| Kunci API bocor | Hanya di env server; tes memastikan respons tidak memuat rahasia |
| Batas laju Admin API Cloudinary | Batch ≤ 100, paginasi, baca header laju |
| Hitungan tidak cocok dengan Cloudinary | Rekonsiliasi byte vs `/usage` ditampilkan |
