# AI Agent & Developer Guidelines
## Project SSES T2 Normal Operasi

> Terakhir diselaraskan dengan kode: **1 Oktober 2026**. Baca juga [GEMINI.md](GEMINI.md) (wajib memakai skill `ponytail` saat menulis kode), [architecture.md](architecture.md), [database.md](database.md), dan [prd.md](prd.md).

---

## 1. Peran & Pengantar Agent

Dokumen ini berisi instruksi bagi **AI Coding Assistant** (Claude, Antigravity, Cursor, Copilot, dll.) dan pengembang manusia yang bekerja pada codebase **SSES T2 Normal Operasi**.

---

## 2. Prinsip Utama Pengembangan

### 2.1. Mobile-First
* Aplikasi dipakai teknisi di ponsel; uji pada lebar 375–430px.
* `<input>`, `<select>`, `<textarea>` wajib `font-size: 16px` (cegah auto-zoom iOS Safari).
* Target sentuh minimal **44×44px**.

### 2.2. Isolasi Komponen Tab (`src/components/features/`)
* Setiap tab dari 12 modul punya `Tab<Nama>.tsx` (tab "Report" = `TabShiftReport.tsx`). Jangan menggabungkan logika antar-tab.
* UI reusable → `src/components/shared/`; potongan khusus satu fitur → subfolder fitur (`checklist-editor/`, `personel/`, `shift-report/`, `kalibrasi/`, `ba-serah-terima/`).
* Tab baru: daftarkan di `ALL_TABS` dan render-nya di `App.tsx` (tab ditampilkan 8 per halaman).

### 2.3. Modul Murni untuk Logika (`src/lib/utils/`)
* Logika yang tidak butuh DOM/store/jaringan **ditulis sebagai modul murni** supaya bisa diuji dengan `node --test` (pola: `waGenerator`/`*Message.ts`, `formValidation`, `lokasiFormat`, `kalibrasiParams`, `checklistEditor`, `pmScheduleParser`, `initialReportShortcuts`).
* Impor antar-modul murni memakai ekstensi `.ts` (mis. `import { x } from './lokasiFormat.ts'`) agar bisa dimuat langsung oleh test Node. Jangan impor store/`supabaseClient` dari modul yang ingin diuji murni (lihat `missingFields.ts` sebagai pemisah: logika di `formValidation.ts`, efek DOM/maskot di `missingFields.ts`).
* Tambahkan test di `tests/` untuk perilaku baru (lihat §4).

### 2.3b. Tipe, bukan `any`
* Bentuk data bersama (personel, peralatan/penempatan, data form tiap tab, baris Report, foto, parameter kalibrasi) ada di `src/lib/types.ts`. Pakai/tambah tipe di sana; jangan memakai `any` (lint akan gagal dan CI memblokir).
* Hasil query Supabase dengan relasi to-one yang di-embed terbaca sebagai array oleh klien yang belum bertipe; cast ke tipe domain di batas pembacaan (`as unknown as Tipe`) dengan komentar singkat, jangan menebar cast di komponen.
* Master checklist yang judulnya bisa kosong dinormalkan dengan `toMasterBlocks` (`checklistEditor.ts`) sebelum dirender.

### 2.4. Manajemen State & Data Relasional
* Pakai `useMasterDataStore` untuk lokasi, titik, jenis/tipe/unit peralatan, sparepart, personel, dan pengaturan PM; `useAppStore` untuk tab aktif & maskot; `useAuthStore` untuk sesi admin (`user`, bukan `isAdmin`).
* Filter lokasi pada form baru memakai helper `locationRules.ts` supaya pencocokan peralatan ↔ lokasi ↔ titik konsisten dengan database.
* Menulis konfigurasi: `saveConfigToSupabase(key, value)` (di dalam store) — hasilnya `boolean`; beri tahu pengguna lewat `sayPet` bila gagal.
* Kolom `master_configs` adalah **`key` / `value`** (bukan `config_key`/`config_value`).

### 2.5. Format Pesan WhatsApp
* Pesan dibuat oleh modul murni: `kehadiranMessage`, `briefingMessage`, `perbaikanMessage`, `kegiatanMessage`, `shiftReportMessage`, serta `waGenerator.ts` (Storing, Checklist, Kalibrasi, Initial Report, BA Serah Terima). `waGenerator.ts` meng-*re-export* sebagian dari modul-modul itu.
* **Jangan mengubah judul, emoji, pemisah baris, atau bullet tanpa permintaan eksplisit** — format dibaca pihak lain di grup WA. Judul saat ini: `LAPORAN DINAS`, `GIAT BRIEFING UNIT SSES T2`, `BRIEFING MOT T2`, `KEGIATAN STORING PERALATAN`, `LAPORAN CORRECTIVE MAINTENANCE`, `LAPORAN PREVENTIVE MAINTENANCE & KALIBRASI`. Perubahan format wajib disertai pembaruan test `tests/wa-*.test.mjs`.
* Kalibrasi: parameter X-Ray/WTMD **tanpa nilai bawaan** (hanya `Archive` X-Ray = `+- 1 bulan`); jangan menambah default angka.
* Teks yang terlihat pengguna memakai **IASS** (bukan IAS). Nilai `unit_kerja.nama` di database tetap `OM/IAS T2` — jangan diubah di kode pencocokan.

### 2.6. Penulisan Lokasi
* Selalu `"<Lokasi> <Nomor>"` tanpa "No." (`PSCP D 2`, `HBSCP 2.5`). Gunakan `formatLokasi`, `formatLokasiRows`, `normalizeLokasi` dari `lokasiFormat.ts`; jangan merangkai string lokasi manual di tab/pesan baru.

### 2.7. Validasi Isian Wajib
* Setiap tab yang membagikan laporan memakai pola yang sama: validator di `formValidation.ts` → daftar `MissingField {key, label}` → `reportMissingFields` (maskot menyebut isian, layar bergulir & fokus) → `FieldError` + `FIELD_ERROR_CLASS` untuk tampilan merah.
* Tandai elemen isian dengan `data-field="<key>"` atau `name="<key>"` yang sama dengan `key` validator agar `focusFirstMissing` menemukannya.
* Tab baru atau isian wajib baru → tambah/ubah validator + test di `tests/form-validation.test.mjs`.

### 2.8. Maskot & Notifikasi
* Satu-satunya kanal notifikasi adalah `useAppStore.sayPet(text, tone)` (atau pintasan `sayPet` di luar React). Jangan membuat toast/alert baru. Nada: `info | success | warning | error | cheer`; `error` menetap sampai ditutup.
* Teks maskot ada di `src/lib/data/petMessages.ts` (diuji `tests/pet-messages.test.mjs`). Maskot harus tetap `print:hidden` dan tidak menutupi isian (ia menyingkir saat fokus; gunakan `setBottomInset` bila menambah bilah menempel di dasar layar).

### 2.9. Foto, Canvas & Signature Pad
* Kompres via Canvas sebelum unggah (`compressImageFile`/`cloudinaryService.compressImage`).
* Anotasi memakai Canvas native (`PhotoTextEditorModal.tsx`, `canvasUtils.ts`). **Jangan menambah Konva/react-konva/use-image** — sengaja dihapus dan dijaga `tests/dependencies-cleanliness.test.mjs`.
* `SignaturePad.tsx`: tangani event touch dengan `preventDefault()` agar kanvas tidak men-scroll halaman.

### 2.10. Aturan Shift & Persistensi (`operationalReportService.ts`)
* **Shift PS** 08:00–20:00 WIB; **Shift M** 20:00–08:00 WIB hari berikutnya.
* Default tanggal/shift: `00:00–09:59` → kemarin, M · `10:00–21:59` → hari ini, PS · `22:00–23:59` → hari ini, M.
* Simpan log lewat `saveOperationalLog` dan ringkasan kelaikan lewat `saveChecklistSummary` (upsert `(tanggal, shift)`); mengambil teknisi/personel on-duty lewat `fetchOnDutyPersonnel` — jangan menduplikasi query jadwal di tab.

### 2.11. Cloud Storage Dual-Tier & Instant Web Share
* Foto → `uploadPhotoToCloudinary` (primary Cloudinary, fallback otomatis Supabase Storage `dokumentasi`). `uploadPhotoToGoogleDrive` hanya alias lama; jangan dipakai di kode baru.
* **Dilarang menyimpan Base64** (`data:image/...`) ke Postgres (constraint `chk_foto_urls_no_base64`); simpan URL HTTPS.
* `navigator.share` harus dipanggil **sinkron** dalam user gesture (`shareToWhatsApp`); kompresi, upload, dan penyimpanan Supabase berjalan async di latar belakang, dengan dedup `recentOperationalLogs`, lalu hasil dikabarkan via `sayPet`.

### 2.12. Cetak (`@page`)
* **Report**: A4 Landscape (`margin: 5mm`), lebar `#printable-shift-report` 100%, lembar serviceability terakhir (`.serviceability-page-sheet`, ±520px; jangan menambah `.html2pdf__page-break` pada kontainernya).
* **BA Serah Terima**: A4 Portrait (`margin: 12mm 15mm`).
* **Dilarang** menaruh `@page { size: … }` di `src/styles.css`; letakkan terisolasi di komponen tab masing-masing. Elemen non-dokumen (maskot, tombol) harus `print:hidden`/`data-html2canvas-ignore`.

### 2.13. Keamanan & Data
* Jangan commit `.env*`. Kredensial Supabase hanya lewat `VITE_SUPABASE_*`.
* Tabel `public` memakai RLS; beberapa kebijakan tulis masih terbuka (lihat [database.md §6](database.md#6-catatan-keamanan-rls)). Jangan mengandalkan login tab Data sebagai satu-satunya pengaman bila menambah tabel/fitur sensitif.
* Skema database tidak ada di repo (tanpa berkas migrasi). Perubahan skema harus dicatat di `database.md`.

---

## 3. Direktori Kunci

| Path | Fungsi | Perhatian |
|---|---|---|
| `src/components/App.tsx` | `ALL_TABS`, navigasi 8 tab/halaman, swipe, tombol header, mount maskot | Tab aktif awal `initial`; `data` & `ba_serah_terima` memakai kontainer lebar. |
| `src/components/features/TabShiftReport.tsx` + `shift-report/` | Tab **Report**: preview WA real-time, CRUD log, serviceability, cetak | Komponen terbesar (±1.2 rb baris); ubah dengan hati-hati. |
| `src/components/features/AntigravityPet.tsx` | Maskot X-Ray (aset `public/pet-xray.webp`) | Hanya membaca `useAppStore`. |
| `src/components/features/TabData.tsx` | Login admin + 8 sub-tab | Semua sub-tab di dalam `LocalDataEditor`. |
| `src/lib/services/operationalReportService.ts` | Shift, log operasional, serviceability, on-duty | Sumber tunggal aturan shift. |
| `src/lib/services/cloudinaryService.ts` | Upload foto dual-tier, konfigurasi Cloudinary | |
| `src/lib/services/checklistSyncService.ts` | Sinkron checklist antar-perangkat | Memakai `master_configs`. |
| `src/lib/services/pdfService.ts` · `shareService.ts` | PDF non-blocking · Web Share + fallback | |
| `src/lib/utils/*Message.ts`, `waGenerator.ts` | Format pesan WA | Lihat §2.5. |
| `src/lib/utils/formValidation.ts` · `missingFields.ts` | Validasi isian wajib | Lihat §2.7. |
| `src/lib/utils/lokasiFormat.ts` · `locationRules.ts` | Format lokasi · relasi peralatan↔lokasi | |
| `src/lib/utils/pmScheduleParser.ts` | Parse Excel jadwal PM + Rencana Kegiatan | |
| `src/store/useMasterDataStore.ts` | Master data + konfigurasi Supabase | `master_configs` memakai kolom `key`/`value`. |
| `tests/` | 32 berkas, 133 test | Jalankan `npm test`. |

---

## 4. Checklist Verifikasi Sebelum Menyatakan Selesai

1. **Test**: `npm test` (alias `node --test`) — seluruh 133 test harus lulus. Tambahkan test untuk perilaku baru (modul murni lebih mudah; test struktur komponen di repo membaca source dengan `readFileSync`).
2. **Build**: `npm run build` harus berhasil (CI juga menjalankannya).
3. **Lint**: `npm run lint` harus tetap **bersih** (0 error, 0 peringatan) — CI memblokirnya. Jangan memakai `any`; pakai/tambah tipe di `src/lib/types.ts`. Bila `tsc --noEmit` dijalankan, jangan menambah error baru (kini 1, di `vite.config.ts`).
4. **Mobile layout**: tidak ada overflow horizontal, tombol mudah ditekan, tidak ada auto-zoom iOS.
5. **Ketahanan**: bila Supabase/Cloudinary tidak merespons, aplikasi tetap berjalan dengan data bawaan `masterData.ts` / fallback Supabase Storage dan memberi kabar lewat maskot.
6. **Dokumentasi**: bila perilaku, skema, versi dependensi, atau jumlah test berubah, perbarui `README.md`, `prd.md`, `architecture.md`, `database.md`, dan dokumen ini.
7. **Knowledge graph**: setelah penambahan file/refactor besar, jalankan `graphify update .` (atau `/graphify . --update`) — lihat §5.

---

## 5. Perintah & Tool Helper

| Kebutuhan | Perintah |
|---|---|
| Dev server (HTTPS, port 3000) | `npm run dev` |
| Test | `npm test` |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Tanya graph | `graphify query "<pertanyaan>"` / skill `/graphify query "<pertanyaan>"` |
| Perbarui graph | `graphify update .` atau `/graphify . --update` |

**Knowledge graph (graphify)**: output ada di `graphify-out/` (`graph.json`, `graph.html`, `GRAPH_REPORT.md`), **di-ignore git** — setiap klon/sesi membuatnya sendiri (`pip install graphifyy`). Untuk pertanyaan arsitektur, cek `graphify-out/GRAPH_REPORT.md` / `graphify query` lebih dulu sebelum menelusuri file satu per satu.

**Skill workspace** (`.agents/skills/`): `ponytail` (wajib untuk kode), `graphify`, `brainstorming`, `writing-plans`, `systematic-debugging`, `test-driven-development`, `verification-before-completion`, dan lainnya. Rencana & spesifikasi historis ada di `docs/superpowers/` (lihat README di sana).
