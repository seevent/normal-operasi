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
* Gambar yang diunggah harus dikompres secara efisien via Canvas API sebelum dikirim ke backend/Google Drive untuk menghemat bandwidth.
* Saat mengubah `PhotoTextEditorModal.tsx`, pastikan posisi koordinat teks overlay diskalakan sesuai rasio asli gambar (`stage.width() / image.width`).
* Pada `SignaturePad.tsx`, pastikan event touch (`onTouchStart`, `onTouchMove`, `onTouchEnd`) ditangani dengan `preventDefault()` agar kanvas tidak menyebabkan scroll halaman saat ditandatangani di ponsel.

---

## 3. Direktori Kunci & File Penting

| Path File | Fungsi Utama | Perhatian Khusus bagi Agent |
|---|---|---|
| [`src/components/App.tsx`](file:///c:/Users/Yuli%20Syarif/normal-operasi/src/components/App.tsx) | Navigation root & tab bar | Menangani navigasi 12 tab, swipe touch, & floating WhatsApp share button. |
| [`src/lib/utils/waGenerator.ts`](file:///c:/Users/Yuli%20Syarif/normal-operasi/src/lib/utils/waGenerator.ts) | Template pesan WA | Memiliki generator khusus per-tab untuk seluruh 12 modul operasional. |
| [`src/lib/utils/locationRules.ts`](file:///c:/Users/Yuli%20Syarif/normal-operasi/src/lib/utils/locationRules.ts) | Helper relasi lokasi & peralatan | Memfilter dropdown lokasi berdasarkan peralatan terpilih. |
| [`src/store/useMasterDataStore.ts`](file:///c:/Users/Yuli%20Syarif/normal-operasi/src/store/useMasterDataStore.ts) | Zustand store master data | Mengelola pencocokan Supabase, spareparts, & local cache. |

---

## 4. Checklist Verifikasi Sebelum Menyelesaikan Tugas

Sebelum Agent menyatakan bahwa suatu perbaikan atau fitur telah selesai, lakukan langkah-langkah verifikasi berikut:

1. **Type Checking & Build Verification**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
   Pastikan tidak ada error TypeScript atau kegagalan bundling Vite.

2. **Mobile Layout Check**:
   Pastikan input teks tidak menyebabkan overflow horizontal dan tombol-tombol mudah ditekan di layar seluler.

3. **Kemampuan Offline / Fallback**:
   Pastikan jika Supabase tidak merespons, aplikasi tetap dapat menggunakan `masterData.ts` / `localStorage` secara aman tanpa crash.

4. **Pembaruan Knowledge Graph (Graphify)**:
   Jika terjadi penambahan file baru atau refactoring arsitektur skala besar, jalankan pembaruan `graphify` agar indeks keterkaitan antar file tetap up-to-date.

---

## 5. Perintah & Tool Helper untuk Agent

* **Menjalankan Dev Server**:
  `npm run dev` (Port default: 3000)
* **Pemeriksaan Knowledge Graph**:
  Gunakan skill `graphify` untuk mengajukan pertanyaan arsitektur codebase atau memperbarui `graphify-out/graph.json`.
