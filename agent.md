# AI Agent & Developer Guidelines
## Project SSES T2 Normal Operasi

---

## 1. Peran & Pengantar Agent

Dokumen **`agent.md`** ini berisi instruksi khusus, prinsip pengembangan, serta aturan arsitektur bagi **AI Coding Assistant** (seperti Google Antigravity, Claude, Cursor, Copilot, dll.) dan pengembang manusia yang bekerja pada codebase **SSES T2 Normal Operasi**.

---

## 2. Prinsip Utama Pengembangan (Core Rules)

### 2.1. Filosofi Desain Mobile-First
* **Kerapian Layar Seluler**: Aplikasi digunakan langsung di perangkat seluler oleh personel teknisi di lapangan. Semua komponen UI harus diuji pada tampilan seluler (375px - 430px width).
* **Ukuran Font Input (iOS Safari Guard)**: Selalu gunakan `font-size: 16px` (atau `text-base` / `text-sm` dengan override 16px) pada elemen `<input>`, `<select>`, dan `<textarea>`. Ini penting untuk mencegah browser iOS Safari melakukan auto-zoom otomatis saat fokus input.
* **Ukuran Touch Target**: Area sentuh tombol dan elemen interaktif minimal **44px x 44px**.

### 2.2. Isolasi Komponen Tab (`src/components/features/`)
* Setiap tab dari 12 modul utama memiliki file komponen khusus di `src/components/features/Tab<NamaFitur>.tsx`.
* **Jangan menggabungkan logika antar-tab** ke dalam satu file raksasa. Jika terdapat UI reusable (seperti uploader foto, signature pad, modal editor, atau icon), tempatkan di `src/components/shared/`.

### 2.3. Manajemen State Relasional (`useMasterDataStore.ts`)
* Selalu gunakan `useMasterDataStore` untuk mengakses data relasional (Lokasi, Titik, Jenis Peralatan, Tipe Peralatan, Unit Peralatan, Spareparts, Personel, Jadwal Shift).
* Ketika menambahkan filter lokasi pada form baru, selalu manfaatkan helper function dari `src/lib/utils/locationRules.ts` untuk memastikan pencocokan peralatan ↔ lokasi ↔ titik berjalan konsisten dengan database.

### 2.4. Template Generator WhatsApp (`waGenerator.ts`)
* Format pesan WhatsApp yang dihasilkan oleh `waGenerator.ts` mengikuti standar format laporan resmi operasional SSES T2.
* **Aturan Penting**: Jangan mengubah emoji header, pemisah baris, atau penataan bullet point secara acak tanpa permintaan eksplisit dari pengguna, karena format ini di-parse otomatis oleh sistem rekapitulasi eksternal di grup WhatsApp operasional.

### 2.5. Pemrosesan Canvas, Konva Anotasi & Signature Pad (`canvasUtils.ts`, `PhotoTextEditorModal.tsx`, `SignaturePad.tsx`)
* Gambar yang diunggah harus dikompres secara efisien via Canvas API sebelum dikirim ke backend/Cloudinary untuk menghemat bandwidth.
* Saat mengubah `PhotoTextEditorModal.tsx`, pastikan posisi koordinat teks overlay diskalakan sesuai rasio asli gambar (`stage.width() / image.width`).
* Pada `SignaturePad.tsx`, pastikan event touch (`onTouchStart`, `onTouchMove`, `onTouchEnd`) ditangani dengan `preventDefault()` agar kanvas tidak menyebabkan scroll halaman saat ditandatangani di ponsel.

### 2.6. Aturan Shift & Persistensi Operasional (`operationalReportService.ts`)
* **Batas Jam Shift**:
  * **Shift PS (Pagi/Siang)**: Jam dinas 08:00 s.d. 20:00 WIB.
  * **Shift M (Malam)**: Jam dinas 20:00 s.d. 08:00 WIB hari berikutnya.
* **Pergantian Default Tanggal/Shift**:
  * Pukul `00:00 - 09:59`: Tanggal kemarin, Shift M.
  * Pukul `10:00 - 21:59`: Tanggal hari ini, Shift PS.
  * Pukul `22:00 - 23:59`: Tanggal hari ini, Shift M.
* **Persistensi Data**: Selalu gunakan fungsi `saveOperationalLog` dan `saveChecklistSummary` dari `operationalReportService.ts` agar kegiatan dari setiap tab tersinkronisasi ke tabel Supabase `laporan_operasional` & `laporan_checklist`.

### 2.7. Integrasi Cloud Storage Dual-Tier & Instant Web Share (`cloudinaryService.ts`, `operationalReportService.ts`, `pdfService.ts`)
* **Cloudinary Upload (Primary)**: Sistem mengunggah foto ke Cloudinary via Unsigned Upload Preset (kecepatan tinggi ~300-600ms, tanpa cold start, didukung Global CDN).
* **Supabase Storage Fallback**: Jika kredensial Cloudinary belum diatur di `.env` / Admin atau jaringan Cloudinary gagal, `cloudinaryService.ts` secara otomatis mengalihkan penyimpanan ke Supabase Storage bucket `dokumentasi` dan mengembalikan URL HTTPS permanen.
* **Seluruh Tab Operasional Terhubung**: Seluruh formulir yang memuat foto (Initial Report, Perbaikan, Kalibrasi, BA Serah Terima, dan Shift Report) wajib memanggil `uploadPhotoToCloudinary` sebelum menyimpan log kegiatan ke Supabase.
* **Zero Base64 in DB**: Dilarang keras menyimpan string Base64 (`data:image/...`) ke dalam PostgreSQL Supabase karena akan memicu pelanggaran constraint `chk_foto_urls_no_base64` dan membuat kuota database penuh. Selalu gunakan URL HTTPS publik yang dikembalikan dari `uploadPhotoToCloudinary`.
* **Instant Web Share**: Browser modern mewajibkan user gesture aktif untuk `navigator.share`. Panggil `navigator.share` secara sinkron/instan saat tombol ditekan, dan jalankan kompresi foto, upload cloud, serta penulisan Supabase secara asinkron di latar belakang dengan perlindungan deduplikasi `recentOperationalLogs`.

### 2.8. Aturan Cetak (Print Layout) & CSS `@page`
* **Format Cetak Tab Shift Report**: Wajib menggunakan format **A4 Landscape** (`@page { size: landscape; size: A4 landscape; margin: 5mm; }`). Lebar kontainer `#printable-shift-report` harus diatur ke `100%` agar mengisi lembar landscape secara penuh.
* **Lembar Khusus Serviceability (Dedicated Final Page)**: Tabel checklist kesiapan fasilitas dan diagram batang serviceability wajib berada di lembar tersendiri di akhir dokumen (`.serviceability-page-sheet`). Total tinggi vertikal kontainer harus dijaga padat (~520px) agar tidak meluber melewati batas tinggi A4 Landscape (~766px), dan hindari penambahan class `.html2pdf__page-break` pada kontainer agar tidak memicu padding lembaran kosong ekstra di akhir dokumen.
* **Format Cetak Tab BA Serah Terima**: Menggunakan format resmi **A4 Portrait** (`@page { size: portrait; size: A4 portrait; margin: 12mm 15mm; }`).
* **Isolasi Aturan `@page`**: Dilarang menempatkan aturan `@page { size: ...; }` di berkas global `src/styles.css` karena akan menimpa orientasi cetak seluruh tab lain. Selalu letakkan aturan `@page` secara terisolasi di dalam komponen masing-masing tab yang bersangkutan.

---

## 3. Direktori Kunci & File Penting

| Path File | Fungsi Utama | Perhatian Khusus bagi Agent |
|---|---|---|
| [`src/components/App.tsx`](file:///c:/Users/Yuli%20Syarif/normal-operasi/src/components/App.tsx) | Navigation root, tab bar, & mascot | Menangani navigasi 12 tab, swipe touch, floating WA share, dan mount `AntigravityPet`. |
| [`src/components/features/AntigravityPet.tsx`](file:///c:/Users/Yuli%20Syarif/normal-operasi/src/components/features/AntigravityPet.tsx) | Interactive mascot widget | Maskot Chibi Iron Man terapung (zero-g physics & operational tips). |
| [`src/components/features/TabShiftReport.tsx`](file:///c:/Users/Yuli%20Syarif/normal-operasi/src/components/features/TabShiftReport.tsx) | Shift report & serviceability | Interactive Serviceability Diagram (Zone D, E, F), in-modal photo upload/attachment, dan sinkronisasi kelaikan peralatan. |
| [`src/lib/services/operationalReportService.ts`](file:///c:/Users/Yuli%20Syarif/normal-operasi/src/lib/services/operationalReportService.ts) | Layanan persistensi operasional | Menyimpan & memfilter log operasional shift (dengan deduplikasi) dan kelaikan peralatan ke Supabase. |
| [`src/lib/services/cloudinaryService.ts`](file:///c:/Users/Yuli%20Syarif/normal-operasi/src/lib/services/cloudinaryService.ts) | Layanan cloud upload Cloudinary | Mengunggah foto dokumentasi ke Cloudinary via Unsigned Upload Preset. |
| [`src/lib/services/pdfService.ts`](file:///c:/Users/Yuli%20Syarif/normal-operasi/src/lib/services/pdfService.ts) | Layanan ekspor PDF | Ekspor dokumen non-blocking menggunakan dynamic import `html2pdf.js`. |
| [`src/lib/utils/waGenerator.ts`](file:///c:/Users/Yuli%20Syarif/normal-operasi/src/lib/utils/waGenerator.ts) | Template pesan WA | Memiliki generator khusus per-tab untuk seluruh 12 modul operasional. |
| [`src/lib/utils/locationRules.ts`](file:///c:/Users/Yuli%20Syarif/normal-operasi/src/lib/utils/locationRules.ts) | Helper relasi lokasi & peralatan | Memfilter dropdown lokasi berdasarkan peralatan terpilih. |
| [`src/store/useMasterDataStore.ts`](file:///c:/Users/Yuli%20Syarif/normal-operasi/src/store/useMasterDataStore.ts) | Zustand store master data | Mengelola pencocokan Supabase, spareparts, & local cache. |

---

## 4. Checklist Verifikasi Sebelum Menyelesaikan Tugas

Sebelum Agent menyatakan bahwa suatu perbaikan atau fitur telah selesai, lakukan langkah-langkah verifikasi berikut:

1. **Automated Tests Verification**:
   ```bash
   node --test
   ```
   Pastikan seluruh test suite di direktori `tests/` (11 unit tests) lulus tanpa kegagalan assertion.

2. **Build Verification**:
   ```bash
   npm run build
   ```
   Pastikan proses bundling Vite dan TanStack Router berhasil tanpa error.

3. **Mobile Layout Check**:
   Pastikan input teks tidak menyebabkan overflow horizontal dan tombol-tombol mudah ditekan di layar seluler.

4. **Kemampuan Offline / Fallback**:
   Pastikan jika Supabase atau Cloudinary tidak merespons, aplikasi tetap dapat menggunakan `masterData.ts` / `localStorage` secara aman tanpa crash.

5. **Pembaruan Knowledge Graph (Graphify)**:
   Jika terjadi penambahan file baru atau refactoring arsitektur skala besar, jalankan pembaruan `graphify` agar indeks keterkaitan antar file tetap up-to-date.

---

## 5. Perintah & Tool Helper untuk Agent

* **Menjalankan Dev Server**:
  `npm run dev` (Port default: 3000)
* **Menjalankan Pengujian Unit**:
  `node --test`
* **Pemeriksaan Knowledge Graph**:
  Gunakan skill `graphify` untuk mengajukan pertanyaan arsitektur codebase atau memperbarui `graphify-out/graph.json`.
