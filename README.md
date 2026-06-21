# SSES T2 - Generator Laporan

Aplikasi web mobile-first untuk personel **T2 Safety & Security Electronic Services (SSES T2)** di Bandara Soekarno-Hatta Terminal 2. Aplikasi ini memudahkan pembuatan dan pengiriman laporan harian melalui WhatsApp.

## Fitur Utama

| Tab | Fungsi |
|-----|--------|
| **Perbaikan** | Generator laporan perbaikan/verifikasi peralatan keamanan. Pilihan tipe peralatan dan teknisi otomatis dari database. |
| **Kehadiran** | Generator laporan kehadiran shift personel API & OM IAS, terintegrasi jadwal shift dari Supabase. |
| **Briefing** | Generator laporan giat briefing unit/MOT. |
| **Storing** | Generator laporan kegiatan storing peralatan. Pilihan peralatan dari database `jenis_peralatan`, lokasi dari database relasional (`penempatan_peralatan`). |
| **Checklist** | Checklist status operasi peralatan (toggle per item), konfigurasi checklist dapat diedit via Admin. |
| **Kalibrasi** | Generator laporan PM & kalibrasi multi-lokasi. Parameter dinamis per jenis peralatan (X-Ray, WTMD, Body Scanner, ETD, HHMD, Access Control). |
| **TIP** | Tracker TIP Performance bulanan dengan export gambar. Data tersimpan ke Supabase (cloud). |
| **Data** | Panel admin (login required) untuk mengelola master data, upload jadwal Excel, manajemen aset, konfigurasi checklist, peralatan kalibrasi, dan data TIP tersimpan. |

## Teknologi

| Layer | Teknologi |
|-------|-----------|
| **Framework** | TanStack Start + TanStack Router v1 |
| **Frontend** | React 19 |
| **Build** | Vite 7 |
| **Styling** | Tailwind CSS v4 |
| **Icons** | Lucide React |
| **State Management** | Zustand |
| **Backend/Database** | Supabase (Auth, PostgreSQL, Realtime) |
| **Canvas/Editor** | Konva + React Konva (Collage Editor) |
| **Spreadsheet** | SheetJS (xlsx) untuk import jadwal Excel |
| **Deployment** | Netlify |
| **Language** | TypeScript 5 |

## Arsitektur

```
src/
├── components/
│   ├── App.tsx                    # Root app: tab navigation, layout utama
│   ├── Calculator.tsx             # Kalkulator iOS-style (bonus tool)
│   ├── features/                  # Komponen per-fitur (1 file per tab)
│   │   ├── TabPerbaikan.tsx       # Tab laporan perbaikan
│   │   ├── TabKehadiran.tsx       # Tab laporan kehadiran shift
│   │   ├── TabBriefing.tsx        # Tab laporan briefing
│   │   ├── TabStoring.tsx         # Tab laporan storing
│   │   ├── TabChecklist.tsx       # Tab checklist status peralatan
│   │   ├── TabKalibrasi.tsx       # Tab kalibrasi multi-lokasi
│   │   ├── TabTip.tsx             # Tab TIP performance tracker
│   │   ├── TabData.tsx            # Panel admin CRUD + login
│   │   ├── AssetManager.tsx       # CRUD manajemen penempatan aset
│   │   ├── AssetMasterLokasi.tsx  # CRUD master lokasi & titik
│   │   ├── AssetMasterPeralatan.tsx # CRUD master jenis & tipe peralatan
│   │   ├── ChecklistDataEditor.tsx # Editor konfigurasi checklist
│   │   └── ScheduleUploader.tsx   # Upload jadwal shift dari Excel
│   └── shared/                    # Komponen reusable
│       ├── Header.tsx             # Header aplikasi
│       ├── BottomNav.tsx          # Navigasi bawah (tab bar)
│       ├── PhotoUploader.tsx      # Upload & reorder foto
│       └── CollageEditor.tsx      # Editor kolase foto (Konva canvas)
├── lib/
│   ├── data/
│   │   ├── masterData.ts          # Default master data & helper toTitleCase
│   │   └── constants.ts           # Konstanta aplikasi
│   ├── services/
│   │   ├── shareService.ts        # Web Share API + fallback clipboard
│   │   └── supabaseService.ts     # Helper Supabase queries
│   ├── utils/
│   │   ├── waGenerator.ts         # Generator teks WhatsApp semua tab
│   │   ├── locationRules.ts       # Logika lokasi relasional dari database
│   │   └── canvasUtils.ts         # Utility Canvas API (kolase foto)
│   └── supabaseClient.ts          # Inisialisasi Supabase client
├── store/
│   ├── useAppStore.ts             # State global UI (isCopied, etc.)
│   ├── useAuthStore.ts            # State autentikasi admin
│   ├── useCameraStore.ts          # State kamera/watermark
│   └── useMasterDataStore.ts      # State master data + sync Supabase
├── routes/
│   ├── __root.tsx                 # Root layout: HTML shell, meta tags
│   └── index.tsx                  # Route "/" → render App
├── router.tsx                     # Setup TanStack Router
├── routeTree.gen.ts               # Route tree auto-generated oleh TanStack
└── styles.css                     # Tailwind v4 import + global styles
```

## Database (Supabase)

Aplikasi menggunakan database relasional PostgreSQL via Supabase:

| Tabel | Fungsi |
|-------|--------|
| `jenis_peralatan` | Jenis peralatan (X-Ray, WTMD, Body Scanner, dll.) |
| `tipe_peralatan` | Tipe/model spesifik (X-Ray Rapiscan 620DV, dll.) |
| `lokasi` | Daftar area/lokasi (SSCP D, HBSCP E, dll.) |
| `titik_lokasi` | Nomor titik di setiap lokasi |
| `penempatan_peralatan` | Relasi tipe peralatan ↔ lokasi ↔ titik (tabel pivot) |
| `personel` | Data personel (nama, NIK, no HP, unit kerja) |
| `unit_kerja` | Unit kerja (API T2, OM/IAS T2) |
| `jadwal_shift` | Jadwal shift harian personel |
| `master_configs` | Konfigurasi JSONB (checklist, storing, TIP data bulanan) |

## Menjalankan Lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser mobile atau gunakan DevTools mobile simulation.

### Environment Variables

Buat file `.env` di root project:

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

## Build & Deploy

```bash
npm run build    # Production build
```

Deploy otomatis ke Netlify (konfigurasi di `netlify.toml`).

## Catatan Penggunaan

- Aplikasi dioptimalkan untuk **mobile phone** (touch-friendly, font size 16px mencegah zoom iOS)
- Tab **TIP** menyimpan progress ke **Supabase** (cloud) per bulan/tahun
- Tab **Data** memerlukan login admin untuk mengakses pengaturan
- Pilihan lokasi pada Tab Perbaikan, Storing, dan Kalibrasi menggunakan **database relasional** — lokasi muncul berdasarkan peralatan yang dipilih
- Semua laporan dikirim via **Web Share API** (WhatsApp) atau fallback copy teks
- Kolase foto otomatis dibuat via **Canvas API** di browser, dengan opsi editor lanjutan (Konva)
