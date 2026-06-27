# AGENTS.md

This document provides an overview of the project structure for AI agents and developers.

## Project Overview

Mobile-first report generator web app for airport security technicians (SSES T2, Soekarno-Hatta Terminal 2). Single-page app with **10 feature tabs** that generate formatted WhatsApp messages.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start + TanStack Router v1 |
| Frontend | React 19 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| State Management | Zustand |
| Backend/Database | Supabase (Auth, PostgreSQL, Realtime) |
| Canvas/Editor | Konva + React Konva (Collage Editor) |
| Spreadsheet | SheetJS (xlsx) |
| Language | TypeScript 5 |
| Deployment | Netlify |

## Directory Structure

```
src/
├── components/
│   ├── App.tsx                    # Root app: tab navigation untuk 10 fitur, layout utama
│   ├── Calculator.tsx             # Kalkulator iOS-style (bonus tool)
│   ├── features/                  # Komponen per-fitur (1 file per tab)
│   │   ├── TabKehadiran.tsx       # Tab laporan kehadiran shift
│   │   ├── TabBriefing.tsx        # Tab laporan briefing
│   │   ├── TabStoring.tsx         # Tab laporan storing
│   │   ├── TabChecklist.tsx       # Tab checklist status peralatan
│   │   ├── TabPerbaikan.tsx       # Tab laporan perbaikan
│   │   ├── TabKalibrasi.tsx       # Tab kalibrasi multi-lokasi
│   │   ├── TabKegiatan.tsx        # Tab laporan kegiatan lapangan
│   │   ├── TabShiftReport.tsx     # Tab rekapitulasi shift report
│   │   ├── TabTip.tsx             # Tab TIP performance tracker
│   │   ├── TabData.tsx            # Panel admin CRUD + login
│   │   ├── AssetManager.tsx       # CRUD manajemen penempatan aset
│   │   ├── AssetMasterLokasi.tsx  # CRUD master lokasi & titik
│   │   ├── AssetMasterPeralatan.tsx # CRUD master jenis & tipe peralatan
│   │   ├── ChecklistDataEditor.tsx # Editor konfigurasi checklist
│   │   └── ScheduleUploader.tsx   # Upload jadwal shift dari Excel
│   └── shared/                    # Komponen reusable (Header, BottomNav, PhotoUploader, CollageEditor)
├── lib/                           # Services (supabaseService, shareService), utils (waGenerator), data
├── store/                         # Zustand stores (useAppStore, useAuthStore, useCameraStore, useMasterDataStore)
├── routes/                        # TanStack Router (__root.tsx, index.tsx)
└── styles.css                     # Tailwind v4 import + global mobile styles
```

## Key Architecture Decisions

- **Modular Components**: Telah direfaktor dari sebelumnya komponen monolitik tunggal menjadi arsitektur modular berbasis direktori `src/components/features/`.
- **Supabase Cloud Backend**: Menggunakan Supabase PostgreSQL untuk menyimpan master data, jadwal shift, personel, penempatan aset relasional, dan riwayat TIP.
- **Relational Location Mapping**: Pilihan lokasi pada Tab Perbaikan, Storing, dan Kalibrasi dimuat secara dinamis berdasarkan jenis/tipe peralatan dari database relasional (`penempatan_peralatan`).
- **Web Share API**: Laporan dikirimkan langsung ke WhatsApp menggunakan `navigator.share()` dengan mekanisme *fallback* ke *clipboard*.
- **Canvas API & Konva**: Editor kolase foto dan pemberian *watermark* kamera diproses murni di sisi klien (*in-browser*).

## Tab Mapping

Aplikasi memiliki 10 tab utama:
1. `kehadiran` → Tab Kehadiran (Laporan kehadiran shift personel)
2. `briefing` → Tab Briefing (Laporan giat briefing unit/MOT)
3. `storing` → Tab Storing (Laporan kegiatan storing peralatan)
4. `checklist` → Tab Checklist (Checklist status operasi peralatan)
5. `perbaikan` → Tab Perbaikan (Laporan perbaikan/verifikasi peralatan)
6. `kalibrasi` → Tab Kalibrasi (Laporan PM & kalibrasi multi-lokasi)
7. `kegiatan` → Tab Kegiatan (Laporan kegiatan harian lapangan)
8. `report` → Tab Shift Report (Rekapitulasi pergantian shift)
9. `tip` → Tab TIP (Tracker TIP bulanan tersimpan ke Supabase)
10. `data` → Tab Data (Panel Admin CRUD master data & upload jadwal)

## Development Commands

```bash
npm install    # Install dependencies
npm run dev    # Start dev server on port 3000
npm run build  # Production build
```
