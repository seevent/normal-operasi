# SSES T2 - Generator Laporan Operasional

Aplikasi web *mobile-first* untuk personel **T2 Safety & Security Electronic Services (SSES T2)** di Bandara Soekarno-Hatta Terminal 2. Aplikasi ini memudahkan pembuatan, pemantauan, dan pengiriman laporan harian melalui WhatsApp dengan **12 fitur tab** terintegrasi, dukungan tanda tangan digital, anotasi foto, serta sinkronisasi cloud real-time ke **Supabase** dan **Google Sheets**.

---

## 📚 Dokumentasi Proyek

Dokumentasi lengkap mengenai arsitektur, kebutuhan sistem, skema database, dan panduan pengembang AI/Human telah tersedia pada berkas-berkas berikut:

* 📄 **[Product Requirements Document (PRD)](prd.md)**: Spesifikasi produk, visi, daftar 12 fitur tab, target pengguna, dan Kebutuhan Non-Fungsional (NFR).
* 🏗️ **[System Architecture Document](architecture.md)**: Arsitektur SPA, diagram alur data, stack teknologi, state management (Zustand), dan pipeline Canvas Konva / Signature Pad.
* 🗄️ **[Database & Data Schema Specification](database.md)**: Skema tabel Supabase PostgreSQL (termasuk Unit Peralatan, Sparepart, NIK Personel), ERD relasional peralatan-lokasi, dan struktur JSONB `master_configs`.
* 🤖 **[AI Agent & Developer Guidelines](agent.md)**: Panduan konvensi pengkodean, aturan mobile-first, isolasi komponen tab, dan checklist verifikasi untuk AI Assistant.

---

## ✨ Fitur Utama (12 Tab Modul Operasional)

| Tab | Fungsi & Deskripsi Utama |
|---|---|
| **Kehadiran** | Generator laporan kehadiran shift personel API & OM IAS T2, terintegrasi jadwal shift harian dari Supabase dengan filter shift otomatis (Pagi/Malam). |
| **Briefing** | Generator laporan kegiatan briefing operasional shift / MOT (*Manager on Duty*) dengan lampiran foto dokumentasi & integrasi sparepart briefing. |
| **Storing** | Generator laporan penyimpanan/pemindahan peralatan dengan pilihan lokasi relasional terintegrasi. |
| **Checklist** | Checklist status operasi peralatan keamanan dengan toggle status & kustomisasi via Admin. |
| **Initial Report** | Generator laporan awal indikasi gangguan/kerusakan cepat. Dilengkapi **Shortcut Cerdas Mitigasi & Dampak** (otomatis menyesuaikan jenis peralatan: X-Ray, Access Control, ETD, WTMD, HHMD, dll. dan lokasi: PSCP, HBSCP, SSCP, Conveyor, Custom, Lift), serta lampiran kolase foto dengan anotasi teks Konva. |
| **Perbaikan** | Generator laporan perbaikan/verifikasi peralatan. Auto-detect sumber laporan (Custom / Avsec) berdasarkan lokasi titik, relasi jenis & tipe peralatan, serta teknisi bertugas. |
| **Kalibrasi** | Generator laporan PM & kalibrasi multi-lokasi dengan parameter pengujian dinamis (X-Ray, WTMD, Body Scanner, ETD, HHMD, Access Control, serta Extension Conveyor). |
| **Kegiatan** | Generator laporan kegiatan harian personel di lapangan. |
| **BA Serah Terima** | Generator Berita Acara (BA) Serah Terima Barang & Material. Dilengkapi **Digital Signature Canvas (Pad Tanda Tangan)** untuk Pihak 1, Pihak 2, dan Supervisor yang bertugas dinas, multi-item serial number, lampiran foto, serta ekspor format WA & PDF teroptimasi (`pdfService.ts`). |
| **Shift Report** | Rekapitulasi laporan pergantian shift (*Shift Handover Report*). Dilengkapi **Interactive Serviceability Diagram** dengan sinkronisasi koordinat denah Terminal 2 (sub-terminal D, E, F), hitungan total & off peralatan yang dapat diedit, persentase kelaikan dinamis, fitur CRUD entri log dengan **lampiran foto langsung (in-modal upload/edit)**, dan persistensi otomatis ke database (`laporan_operasional`, `laporan_checklist`). |
| **TIP** | Tracker TIP (*Threat Image Projection*) Performance bulanan/tahunan dengan visualisasi skor dan ekspor gambar. Data tersimpan ke Supabase Cloud. |
| **Data** | Panel admin (login required) untuk mengelola master data, penempatan relasional aset, unit peralatan per lokasi, sparepart, konfigurasi Google Drive backup, upload jadwal Excel, dan konfigurasi personel (termasuk NIK). |

---

## 🛠️ Stack Teknologi

| Layer | Teknologi / Library | Versi |
|---|---|---|
| **Framework** | TanStack Start + TanStack Router | `v1.168.22` / `v1.167.41` |
| **Frontend** | React 19 + TypeScript 5 | `19.2.5` / `5.9.3` |
| **Build Tool** | Vite 7 | `7.3.3` |
| **Styling** | Tailwind CSS v4 | `4.2.2` |
| **Icons** | Lucide React | `0.576.0` |
| **State Management** | Zustand (App, Auth, & Master Data Stores) | `5.0.14` |
| **Backend / Cloud DB** | Supabase (PostgreSQL, Auth, Realtime) | `@supabase/supabase-js 2.108.2` |
| **Cloud Storage** | Dual-Tier: Google Drive (Primary via Apps Script) + Supabase Storage (Fail-safe bucket `dokumentasi`) | Hybrid Cloud |
| **Dev Server / SSL** | Vite 7 + `@vitejs/plugin-basic-ssl` (HTTPS untuk Web Share & Camera API) | `7.3.3` |
| **PDF Generation** | `html2pdf.js` + `html2canvas` | `0.14.0` / `1.4.1` |
| **Spreadsheet Import** | SheetJS (`xlsx`) | `0.18.5` |
| **Canvas / Photo Annotation** | Konva + React Konva (`PhotoTextEditorModal.tsx`) | `10.3.0` / `19.2.5` |
| **Digital Signature** | HTML5 Canvas Signature Pad (`SignaturePad.tsx`) | Native Canvas |
| **Testing** | Node.js Test Runner | `node --test` |
| **Deployment** | Netlify | - |

---

## 📂 Arsitektur Codebase (`src/`)

```
src/
├── components/
│   ├── App.tsx                    # Root layout: Header, Navigation 12 tab (pagination & touch swipe), Floating WA share, & AntigravityPet
│   ├── features/                  # Komponen per-fitur (12 Tab Modul, Admin CRUD, Mascot)
│   │   ├── AntigravityPet.tsx     # Floating Chibi Iron Man mascot dengan zero-g physics & operational tips
│   │   ├── GoogleDriveSettingsPanel.tsx # Pengaturan Google Drive Web App endpoint & sync foto
│   │   ├── TabKehadiran.tsx       # Tab laporan kehadiran shift
│   │   ├── TabBriefing.tsx        # Tab laporan briefing operasional
│   │   ├── TabStoring.tsx         # Tab laporan storing peralatan
│   │   ├── TabChecklist.tsx       # Tab checklist status peralatan
│   │   ├── TabInitialReport.tsx   # Tab laporan awal gangguan (Smart Mitigasi & Dampak Shortcuts)
│   │   ├── TabPerbaikan.tsx       # Tab laporan perbaikan (Auto Sumber Laporan Avsec/Custom)
│   │   ├── TabKalibrasi.tsx       # Tab kalibrasi multi-lokasi (termasuk Extension Conveyor)
│   │   ├── TabKegiatan.tsx        # Tab laporan kegiatan harian
│   │   ├── TabBASerahTerima.tsx   # Tab Berita Acara Serah Terima Barang & Tanda Tangan Digital
│   │   ├── TabShiftReport.tsx     # Tab rekapitulasi shift report & diagram serviceability
│   │   ├── TabTip.tsx             # Tab TIP performance tracker & cloud storage
│   │   ├── TabData.tsx            # Panel admin CRUD + Auth login & Google Drive settings
│   │   ├── AssetManager.tsx       # CRUD manajemen penempatan relasional aset
│   │   ├── AssetMasterLokasi.tsx  # CRUD master lokasi & titik
│   │   ├── AssetMasterPeralatan.tsx # CRUD master jenis & tipe peralatan
│   │   ├── UnitPeralatanManager.tsx # CRUD unit peralatan (SN, status operasi, kepemilikan)
│   │   ├── SparepartManager.tsx   # CRUD manajemen stok sparepart & briefing toggle
│   │   ├── ChecklistDataEditor.tsx # Editor konfigurasi checklist
│   │   └── ScheduleUploader.tsx   # Upload & parse jadwal shift dari Excel
│   └── shared/                    # Komponen reusable
│       ├── PhotoUploader.tsx      # Upload, reorder, & manajemen lampiran foto
│       ├── LiveCollagePreview.tsx # Preview live kolase foto multi-layout (Canvas)
│       ├── PhotoTextEditorModal.tsx # Editor teks overlay / anotasi foto (Konva)
│       ├── SignaturePad.tsx       # Komponen tanda tangan digital berbasis canvas
│       └── MonitorSearchIcon.tsx  # Ikon kustom MonitorSearch
├── lib/
│   ├── data/
│   │   ├── masterData.ts          # Fallback master data, hirarki jabatan, & helper formatting
│   │   └── constants.ts           # Key konstanta aplikasi & localStorage
│   ├── services/
│   │   ├── checklistSyncService.ts # Sinkronisasi status checklist ke Supabase
│   │   ├── googleDriveService.ts   # Upload foto ke Google Drive via Google Apps Script Web App
│   │   ├── operationalReportService.ts # Layanan persistensi log kegiatan & checklist summary Supabase
│   │   ├── pdfService.ts          # Layanan ekspor PDF non-blocking via dynamic import
│   │   └── shareService.ts        # Web Share API + fallback clipboard & sanitasi share
│   ├── utils/
│   │   ├── waGenerator.ts         # Generator teks WhatsApp 12 tab (termasuk Extension Conveyor)
│   │   ├── locationRules.ts       # Logika lokasi relasional (Peralatan ↔ Lokasi ↔ Titik)
│   │   └── canvasUtils.ts         # Utility Canvas API & kompresi kolase foto
│   └── supabaseClient.ts          # Inisialisasi Supabase client
├── store/
│   ├── useAppStore.ts             # State global UI
│   ├── useAuthStore.ts            # State autentikasi admin
│   └── useMasterDataStore.ts      # State master data, spareparts, & sync Supabase
├── routes/
│   ├── __root.tsx                 # Root layout: HTML shell & meta viewport
│   └── index.tsx                  # Route "/" → render App component
├── router.tsx                     # Setup TanStack Router
├── routeTree.gen.ts               # Route tree auto-generated oleh TanStack
└── styles.css                     # Tailwind v4 import & zero-g keyframe animation styles
```

---

## 🚀 Menjalankan Aplikasi Secara Lokal

1. **Install Dependensi**:
   ```bash
   npm install
   ```

2. **Jalankan Server Pengembang (HTTPS Enabled)**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di [https://localhost:3000](https://localhost:3000) (dan IP LAN seperti `https://192.168.x.x:3000` via `@vitejs/plugin-basic-ssl`) untuk mendukung pengujian Web Share API dan Camera API langsung dari perangkat seluler.

3. **Jalankan Pengujian (Unit Tests)**:
   ```bash
   node --test
   ```

4. **Konfigurasi Environment Variables (`.env`)**:
   Buat berkas `.env` di root direktori project:
   ```env
   VITE_SUPABASE_URL=<your-supabase-url>
   VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   VITE_GOOGLE_SCRIPT_URL=<optional-google-apps-script-url>
   ```

---

## 📦 Build & Deployment

```bash
npm run build    # Production build Vite
```

Deploy otomatis terkonfigurasi ke **Netlify** via `netlify.toml`.

---

## 💡 Fitur Unggulan Sistem

- **Smart Shortcut Mitigasi & Dampak**: Tab Initial Report secara otomatis menampilkan tombol pintasan tindakan mitigasi dan dampak kerusakan yang relevan berdasarkan kombinasi jenis peralatan (X-Ray, Access Control, ETD, WTMD, HHMD, Mirroring, dll.) dan lokasi spesifik (PSCP, HBSCP, SSCP, Conveyor Belt, Area Custom, Lift, dll.).
- **Interactive Serviceability Diagram & Persistensi Cloud**: Tab Shift Report menampilkan visual matriks kelaikan peralatan per sub-terminal (D, E, F), koordinat diagram yang sinkron, kalkulasi persentase kelaikan dinamis, fitur CRUD log dengan lampiran foto langsung, dan integrasi penyimpanan data log ke tabel Supabase `laporan_operasional` & `laporan_checklist`.
- **Dual-Tier Cloud Photo Storage (Google Drive + Supabase Storage Fallback)**: Unggah foto dokumentasi terkompresi (~150-250 KB via Canvas) langsung ke folder Google Drive (`SSES_T2_Dokumentasi`) via Google Apps Script Web App. Jika akses Google Drive terkendala, sistem otomatis fallback mengunggah ke bucket publik Supabase Storage (`dokumentasi`). Skema PostgreSQL diperkuat dengan constraint `chk_foto_urls_no_base64` sehingga database tetap ramping dan bebas dari string Base64.
- **Tanda Tangan Digital & Ekspor PDF Teroptimasi**: Tab BA Serah Terima memungkinkan pembuatan tanda tangan langsung pada layar sentuh ponsel dan konversi PDF resmi non-blocking via `pdfService.ts`.
- **AntigravityPet Mascot (Chibi Iron Man)**: Maskot interaktif terapung di layar dengan animasi zero-g thruster yang memberikan tips operasional dan status sistem.
- **Relasi Lokasi Relasional**: Pilihan lokasi pada Tab Perbaikan, Initial Report, Storing, dan Kalibrasi otomatis memfilter titik penempatan berdasarkan jenis peralatan yang dipilih.
- **Direct WhatsApp Web Share**: Semua format laporan siap dikirim langsung ke WhatsApp grup operasional melalui **Web Share API** (dengan fallback clipboard & URL link). Sinkronisasi background non-blocking menjaga user gesture tetap aktif saat membagikan laporan.
