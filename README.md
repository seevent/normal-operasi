# SSES T2 - Generator Laporan Operasional

Aplikasi web *mobile-first* untuk personel **T2 Safety & Security Electronic Services (SSES T2)** di Bandara Soekarno-Hatta Terminal 2. Aplikasi ini memudahkan pembuatan, pemantauan, dan pengiriman laporan harian melalui WhatsApp dengan **11 fitur tab** terintegrasi, dukungan anotasi foto, serta sinkronisasi cloud real-time ke **Supabase** dan **Google Sheets**.

---

## 📚 Dokumentasi Proyek

Dokumentasi lengkap mengenai arsitektur, kebutuhan sistem, skema database, dan panduan pengembang AI/Human telah tersedia pada berkas-berkas berikut:

* 📄 **[Product Requirements Document (PRD)](prd.md)**: Spesifikasi produk, visi, daftar 11 fitur tab, target pengguna, dan Kebutuhan Non-Fungsional (NFR).
* 🏗️ **[System Architecture Document](architecture.md)**: Arsitektur SPA, diagram alur data, stack teknologi, state management (Zustand), dan pipeline Canvas Konva.
* 🗄️ **[Database & Data Schema Specification](database.md)**: Skema tabel Supabase PostgreSQL, ERD relasional peralatan-lokasi, struktur JSONB `master_configs`, dan integrasi `Code.gs` Google Sheets.
* 🤖 **[AI Agent & Developer Guidelines](agent.md)**: Panduan konvensi pengkodean, aturan mobile-first, isolasi komponen tab, dan checklist verifikasi untuk AI Assistant.

---

## ✨ Fitur Utama (11 Tab Modul Operasional)

| Tab | Fungsi & Deskripsi Utama |
|---|---|
| **Kehadiran** | Generator laporan kehadiran shift personel API & OM IAS T2, terintegrasi jadwal shift harian dari Supabase. |
| **Briefing** | Generator laporan kegiatan briefing operasional shift / MOT (*Manager on Duty*). |
| **Storing** | Generator laporan penyimpanan/pemindahan peralatan dengan pilihan lokasi relasional terintegrasi. |
| **Checklist** | Checklist status operasi peralatan keamanan dengan toggle status & kustomisasi via Admin. |
| **Initial Report** | Generator laporan awal indikasi gangguan/kerusakan cepat, lengkap dengan lampiran kolase foto dan anotasi teks overlay. |
| **Perbaikan** | Generator laporan perbaikan/verifikasi peralatan. Pilihan jenis peralatan, lokasi titik, dan teknisi otomatis dari database relasional. |
| **Kalibrasi** | Generator laporan PM & kalibrasi multi-lokasi dengan parameter pengujian dinamis (X-Ray, WTMD, Body Scanner, ETD, HHMD, Access Control). |
| **Kegiatan** | Generator laporan kegiatan harian personel di lapangan. |
| **Shift Report** | Rekapitulasi laporan pergantian shift (*Shift Handover Report*). |
| **TIP** | Tracker TIP (*Threat Image Projection*) Performance bulanan/tahunan dengan visualisasi skor dan ekspor gambar. Data tersimpan ke Supabase Cloud. |
| **Data** | Panel admin (login required) untuk mengelola master data, penempatan relasional aset, upload jadwal Excel, sinkronisasi Google Sheets, dan konfigurasi checklist. |

---

## 🛠️ Stack Teknologi

| Layer | Teknologi / Library |
|---|---|
| **Framework** | TanStack Start + TanStack Router v1 |
| **Frontend** | React 19 + TypeScript 5 |
| **Build Tool** | Vite 7 |
| **Styling** | Tailwind CSS v4 |
| **Icons** | Lucide React |
| **State Management** | Zustand (App, Auth, & Master Data Stores) |
| **Backend / Cloud DB** | Supabase (PostgreSQL, Auth, Realtime) |
| **Spreadsheet Sync** | Google Apps Script (`Code.gs`) & SheetJS (`xlsx`) |
| **Canvas / Photo Annotation** | Konva + React Konva (`PhotoTextEditorModal.tsx`) |
| **Deployment** | Netlify |

---

## 📂 Arsitektur Codebase (`src/`)

```
src/
├── components/
│   ├── App.tsx                    # Root layout: Header, Navigation 11 tab, Floating WA share button
│   ├── features/                  # Komponen per-fitur (11 Tab Modul & Admin CRUD)
│   │   ├── TabKehadiran.tsx       # Tab laporan kehadiran shift
│   │   ├── TabBriefing.tsx        # Tab laporan briefing
│   │   ├── TabStoring.tsx         # Tab laporan storing peralatan
│   │   ├── TabChecklist.tsx       # Tab checklist status peralatan
│   │   ├── TabInitialReport.tsx   # Tab laporan awal indikasi gangguan
│   │   ├── TabPerbaikan.tsx       # Tab laporan perbaikan peralatan
│   │   ├── TabKalibrasi.tsx       # Tab kalibrasi multi-lokasi
│   │   ├── TabKegiatan.tsx        # Tab laporan kegiatan harian
│   │   ├── TabShiftReport.tsx     # Tab rekapitulasi shift report
│   │   ├── TabTip.tsx             # Tab TIP performance tracker & cloud storage
│   │   ├── TabData.tsx            # Panel admin CRUD + Auth login
│   │   ├── AssetManager.tsx       # CRUD manajemen penempatan relasional aset
│   │   ├── AssetMasterLokasi.tsx  # CRUD master lokasi & titik
│   │   ├── AssetMasterPeralatan.tsx # CRUD master jenis & tipe peralatan
│   │   ├── ChecklistDataEditor.tsx # Editor konfigurasi checklist
│   │   └── ScheduleUploader.tsx   # Upload & parse jadwal shift dari Excel
│   └── shared/                    # Komponen reusable
│       ├── PhotoUploader.tsx      # Upload, reorder, & manajemen lampiran foto
│       ├── LiveCollagePreview.tsx # Preview live kolase foto multi-layout (Canvas)
│       ├── PhotoTextEditorModal.tsx # Editor teks overlay / anotasi foto (Konva)
│       └── MonitorSearchIcon.tsx  # Ikon kustom MonitorSearch
├── lib/
│   ├── data/
│   │   ├── masterData.ts          # Fallback master data & helper formatting
│   │   └── constants.ts           # Key konstanta aplikasi & localStorage
│   ├── services/
│   │   ├── shareService.ts        # Web Share API + fallback clipboard
│   │   └── sheetsSyncService.ts   # Sinkronisasi laporan dengan Google Sheets API
│   ├── utils/
│   │   ├── waGenerator.ts         # Generator teks WhatsApp 11 tab
│   │   ├── locationRules.ts       # Logika lokasi relasional (Peralatan ↔ Lokasi ↔ Titik)
│   │   └── canvasUtils.ts         # Utility Canvas API & kompresi kolase foto
│   └── supabaseClient.ts          # Inisialisasi Supabase client
├── store/
│   ├── useAppStore.ts             # State global UI
│   ├── useAuthStore.ts            # State autentikasi admin
│   └── useMasterDataStore.ts      # State master data & sync Supabase
├── routes/
│   ├── __root.tsx                 # Root layout: HTML shell & meta viewport
│   └── index.tsx                  # Route "/" → render App component
├── router.tsx                     # Setup TanStack Router
├── routeTree.gen.ts               # Route tree auto-generated oleh TanStack
└── styles.css                     # Tailwind v4 import & global styles
```

---

## 🚀 Menjalankan Aplikasi Secara Lokal

1. **Install Dependensi**:
   ```bash
   npm install
   ```

2. **Jalankan Server Pengembang**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di [http://localhost:3000](http://localhost:3000).

3. **Konfigurasi Environment Variables (`.env`)**:
   Buat berkas `.env` di root direktori project:
   ```env
   VITE_SUPABASE_URL=<your-supabase-url>
   VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ```

---

## 📦 Build & Deployment

```bash
npm run build    # Production build Vite
```

Deploy otomatis terkonfigurasi ke **Netlify** via `netlify.toml`.

---

## 💡 Catatan Penggunaan & Fitur Unggulan

- **Mobile-First Touch Target**: Desain dioptimalkan untuk ponsel pintar dengan font 16px pada seluruh input untuk mencegah auto-zoom iOS Safari.
- **Anotasi Foto & Kolase Multi-Layout**: Unggah hingga 4 foto, atur urutan dengan geser (*move*), dan tambahkan **Anotasi Teks (Text Overlay)** via Konva canvas sebelum dikonversi menjadi gambar kolase tunggal.
- **Relasi Lokasi Relasional**: Pilihan lokasi pada Tab Perbaikan, Initial Report, Storing, dan Kalibrasi otomatis memfilter titik penempatan berdasarkan jenis peralatan yang dipilih.
- **Direct WhatsApp Web Share**: Semua format laporan siap dikirim langsung ke WhatsApp grup operasional melalui **Web Share API**.
