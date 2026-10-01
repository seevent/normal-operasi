# SSES T2 - Generator Laporan Operasional

Aplikasi web *mobile-first* untuk personel **T2 Safety & Security Electronic Services (SSES T2)** di Bandara Soekarno-Hatta Terminal 2. Aplikasi ini memudahkan pembuatan, pemantauan, dan pengiriman laporan harian melalui WhatsApp dengan **12 tab** terintegrasi, tanda tangan digital, anotasi foto, validasi isian wajib yang seragam, serta sinkronisasi cloud ke **Supabase** dan penyimpanan foto di **Cloudinary** (cadangan: Supabase Storage).

> Status terakhir diperbarui: **1 Oktober 2026** — 133 unit test lulus, `npm run build` berhasil, lint bersih (0 error, 0 peringatan).

---

## 📚 Dokumentasi Proyek

| Dokumen | Isi |
|---|---|
| 📄 **[prd.md](prd.md)** | Spesifikasi produk: visi, persona, 12 tab + maskot, aturan format pesan WhatsApp, validasi isian, NFR, roadmap. |
| 🏗️ **[architecture.md](architecture.md)** | Arsitektur SPA, diagram alur data, stack & versi, state management (Zustand), service layer, pipeline foto & cetak, status keamanan dependensi. |
| 🗄️ **[database.md](database.md)** | Skema tabel Supabase **sesuai database live**, ERD, constraint, kunci `master_configs`, bucket Storage, dan `localStorage`. |
| 🤖 **[agent.md](agent.md)** | Panduan konvensi untuk AI Assistant & pengembang: aturan mobile-first, modul murni, validasi, format WA, checklist verifikasi. |
| 🧭 **[GEMINI.md](GEMINI.md)** | Instruksi workspace (wajib memakai skill `ponytail`). |
| 🎨 **[design-system/](design-system/sses-t2-report/MASTER.md)** | Master design system (hasil generator awal; lihat catatan di berkas tersebut). |
| 📝 **[docs/superpowers/](docs/superpowers/README.md)** | Arsip rencana (*plans*) & spesifikasi (*specs*) historis beserta statusnya. |
| 🕸️ **`graphify-out/`** | Knowledge graph codebase (lokal, tidak di-commit). Lihat bagian [Knowledge Graph](#-knowledge-graph-graphify). |

---

## ✨ Fitur Utama (12 Tab)

Urutan tab mengikuti `ALL_TABS` di `src/components/App.tsx`; navigasi 8 tab per halaman dengan *swipe*. Tab awal saat aplikasi dibuka: **Initial Report**.

| Tab | Fungsi & Deskripsi Utama |
|---|---|
| **Kehadiran** | Laporan dinas personel API T2 & OM IASS T2 dari `jadwal_shift` (filter shift Pagi/Siang vs Malam). *Rencana Kegiatan* terisi otomatis, termasuk jadwal **Preventive Mingguan/Bulanan** dari tabel `jadwal_pm` sesuai pengaturan tampilan PM. Membagikan laporan memicu penyemangat awal shift dari maskot. |
| **Briefing** | Laporan giat briefing unit / MOT (judul WA huruf kapital), daftar sparepart briefing, dan foto dokumentasi. |
| **Storing** | Laporan storing peralatan dengan lokasi relasional; judul WA **KEGIATAN STORING PERALATAN** bercetak tebal. |
| **Checklist** | Checklist status operasi peralatan (konfigurasi dari editor Checklist Config), sinkron antar-perangkat lewat `master_configs`. |
| **Initial Report** | Laporan awal gangguan dengan **shortcut cerdas** permasalahan, mitigasi & dampak sesuai jenis peralatan dan lokasi, serta kolase foto beranotasi teks. |
| **Perbaikan** | Laporan **CORRECTIVE MAINTENANCE**; sumber laporan (Custom/Avsec) terdeteksi otomatis dari lokasi, peralatan, dan teknisi on-duty. |
| **Kalibrasi** | Laporan **PREVENTIVE MAINTENANCE & KALIBRASI** multi-lokasi dengan parameter dinamis (X-Ray, WTMD, Body Scanner, ETD, HHMD, Access Control, Extension Conveyor). Parameter X-Ray & WTMD tanpa nilai bawaan (hanya *Archive* X-Ray = `+- 1 bulan`). |
| **Kegiatan** | Laporan kegiatan harian; dropdown **Peralatan** opsional (bawaan `All Faskampen`). |
| **BA Serah Terima** | Berita Acara serah terima barang: multi-item + serial number, tanda tangan digital 3 pihak, cetak **A4 Portrait**, ekspor PDF, nama lengkap personel; maskot tidak ikut tercetak. |
| **Report** | Laporan harian / *Shift Handover* (komponen `TabShiftReport`): **preview WhatsApp real-time** berformat Closing briefing, personel diurutkan mengikuti jabatan (sama dengan tab Kehadiran), diagram serviceability, CRUD log dengan foto, cetak **A4 Landscape** & PDF. |
| **TIP** | Tracker *Threat Image Projection* bulanan/tahunan, tersimpan di Supabase, ekspor gambar. |
| **Data** | Panel admin (login email + kata sandi Supabase Auth) dengan 8 sub-tab: Upload Jadwal Excel (shift & PM), Sparepart List, Manajemen Aset, **Personel** (API T2 + OM IASS dalam satu tab), Checklist Config (editor terstruktur), Config Peralatan Kalibrasi, Data TIP Tersimpan, Cloudinary CDN. |

Selain tab, ada **maskot AntigravityPet** (mesin X-Ray melayang) yang menjadi kanal notifikasi tunggal.

---

## 🛠️ Stack Teknologi

Versi diambil dari `package.json` / `npm ls` per 1 Oktober 2026.

| Layer | Teknologi / Library | Versi |
|---|---|---|
| **Framework** | TanStack Start + TanStack Router | `1.168.59` / `1.170.40` |
| **Frontend** | React 19 + TypeScript | `19.2.5` / `5.9.3` |
| **Build Tool** | Vite | `7.3.6` |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) | `4.2.2` |
| **Icons** | Lucide React | `0.576.0` |
| **State Management** | Zustand (App, Auth, Master Data) | `5.0.14` |
| **Backend / Cloud DB** | Supabase (PostgreSQL, Auth, Realtime, Storage) | `@supabase/supabase-js 2.108.2` |
| **Cloud Foto** | Cloudinary (Unsigned Preset) + fallback Supabase Storage bucket `dokumentasi` | REST API |
| **Dev Server** | Vite HTTPS via `@vitejs/plugin-basic-ssl` (Web Share & Camera API) | `2.3.0` |
| **PDF & Cetak** | `html2pdf.js` + `html2canvas` + CSS `@page` terisolasi per tab | `0.14.0` / `1.4.1` |
| **Spreadsheet** | SheetJS `xlsx` (jadwal shift & PM) | `0.18.5` |
| **Anotasi Foto & Kolase** | HTML5 Canvas native (`canvasUtils.ts`, `PhotoTextEditorModal.tsx`) — *Konva sudah dihapus* | Native |
| **Tanda Tangan** | HTML5 Canvas (`SignaturePad.tsx`) | Native |
| **Ekspor Gambar TIP** | `html-to-image` dimuat dari cdnjs saat dibutuhkan (bukan dependensi npm) | `1.11.11` |
| **Lint** | ESLint 9 + typescript-eslint + react-hooks | `9.39.x` |
| **Testing** | Node.js Test Runner (`node --test`) — 32 berkas, 133 test | Node 22 |
| **CI** | GitHub Actions (`.github/workflows/ci.yml`: lint, test, build — ketiganya memblokir) | - |
| **Deployment** | Netlify (`netlify.toml`, publish `dist/client`) | - |

---

## 📂 Arsitektur Codebase (`src/`)

```
src/
├── components/
│   ├── App.tsx                       # Layout root: header, 12 tab (8/halaman, swipe), tombol share WA, AntigravityPet
│   ├── features/
│   │   ├── Tab*.tsx                  # 12 tab (Kehadiran, Briefing, Storing, Checklist, InitialReport, Perbaikan,
│   │   │                             #   Kalibrasi, Kegiatan, BASerahTerima, ShiftReport (tab "Report"), Tip, Data)
│   │   ├── AntigravityPet.tsx        # Maskot X-Ray (membaca useAppStore.petMessage)
│   │   ├── AssetManager.tsx · AssetMasterLokasi.tsx · AssetMasterPeralatan.tsx · UnitPeralatanManager.tsx
│   │   ├── SparepartManager.tsx      # CRUD sparepart & toggle sparepart briefing
│   │   ├── ScheduleUploader.tsx · PmScheduleUploader.tsx   # Upload jadwal shift & jadwal PM (Excel)
│   │   ├── ChecklistDataEditor.tsx   # Editor Checklist Config (memakai checklist-editor/)
│   │   ├── CloudinarySettingsPanel.tsx
│   │   ├── ba-serah-terima/          # BADocumentPrint
│   │   ├── checklist-editor/         # BlockCard, CategoryList, SubGroupList, ItemsTextarea, EditorContext, ui
│   │   ├── kalibrasi/                # KalibrasiParameterFields
│   │   ├── personel/                 # PersonelManager, PersonelSection (satu tab Personel)
│   │   └── shift-report/             # ServiceabilityDiagram, ShiftReportCrudModal, ShiftReportPrintDocument
│   └── shared/                       # FieldError, LiveCollagePreview, MonitorSearchIcon,
│                                     #   PhotoTextEditorModal, PhotoUploader, SignaturePad
├── lib/
│   ├── types.ts                      # Tipe domain bersama (personel, peralatan, data form per tab, baris Report, foto)
│   ├── data/                         # constants.ts, masterData.ts (default & hirarki jabatan), petMessages.ts
│   ├── hooks/                        # useAutoResizeTextarea, usePhotoGroups, useTipePeralatanOptions
│   ├── services/                     # checklistSyncService, cloudinaryService, operationalReportService,
│   │                                 #   pdfService, shareService
│   ├── utils/                        # Modul murni (mudah diuji): waGenerator + *Message.ts per tab,
│   │                                 #   formValidation, missingFields, lokasiFormat, locationRules,
│   │                                 #   kalibrasiParams, initialReportShortcuts, pmScheduleParser,
│   │                                 #   checklistEditor, canvasUtils, dateFormat, errorUtils
│   └── supabaseClient.ts
├── store/                            # useAppStore (UI + maskot), useAuthStore, useMasterDataStore
├── routes/                           # __root.tsx, index.tsx
├── router.tsx · routeTree.gen.ts · styles.css
tests/                                # 32 berkas *.test.mjs (node --test)
```

---

## 🚀 Menjalankan Aplikasi Secara Lokal

1. **Install dependensi**: `npm install` (CI memakai `npm ci`, Node 22).
2. **Environment** — buat `.env` di root (jangan di-commit):
   ```env
   VITE_SUPABASE_URL=<your-supabase-url>
   VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   VITE_CLOUDINARY_CLOUD_NAME=<opsional: cloud name>
   VITE_CLOUDINARY_UPLOAD_PRESET=<opsional: unsigned upload preset>
   ```
   Konfigurasi Cloudinary juga bisa diatur admin lewat Data → Cloudinary CDN dan disimpan global di `master_configs`.
3. **Dev server (HTTPS)**: `npm run dev` → `https://localhost:3000` (dan `https://<ip-lan>:3000` untuk uji di ponsel).
4. **Pengujian**: `npm test` (= `node --test`).
5. **Lint**: `npm run lint` — bersih (0 error, 0 peringatan) dan memblokir CI. Cek tipe: `npx tsc --noEmit` (satu error tersisa di `vite.config.ts`, lihat architecture.md §9).
6. **Build**: `npm run build`.

---

## 📦 Build & Deployment

`npm run build` menghasilkan `dist/client` (publish Netlify) dan fungsi SSR. Deploy otomatis lewat Netlify (`netlify.toml`); CI GitHub menjalankan lint, test, dan build pada push ke `main` serta pull request.

---

## 💡 Fitur Unggulan Sistem

- **Validasi isian wajib yang seragam** (`formValidation.ts` + `missingFields.ts` + `FieldError.tsx`): saat tombol bagikan ditekan dengan isian kosong, layar bergulir & fokus ke isian kosong pertama, isian diberi bingkai & tulisan merah, dan maskot menyebut isian apa yang kurang. Berlaku di Kehadiran, Briefing, Checklist, Storing, Kegiatan, BA Serah Terima, Initial Report, Perbaikan, dan Kalibrasi.
- **Standar penulisan lokasi** (`lokasiFormat.ts`): selalu `"<Lokasi> <Nomor>"` tanpa kata "No." (mis. `PSCP D 2`, `HBSCP 2.5`); data lama dinormalkan otomatis.
- **Format WhatsApp resmi per tab**: modul murni `*Message.ts` (Kehadiran "LAPORAN DINAS", Briefing, Perbaikan "LAPORAN CORRECTIVE MAINTENANCE", Kegiatan, Report/Closing briefing) + `waGenerator.ts` (Storing, Checklist, Kalibrasi, Initial Report, BA). Preview WA tab Kalibrasi dan Report mengikuti panjang pesan.
- **Shortcut cerdas Initial Report**: pintasan permasalahan, mitigasi, dan dampak sesuai kombinasi peralatan × lokasi.
- **Serviceability & persistensi**: tab Report menghitung kelaikan peralatan, menyimpan log ke `laporan_operasional` dan ringkasan ke `laporan_checklist` (upsert atomik per `(tanggal, shift)`).
- **Foto dual-tier**: kompresi Canvas (~150–250 KB) → Cloudinary; bila gagal/belum dikonfigurasi → Supabase Storage. Constraint `chk_foto_urls_no_base64` menolak Base64 di database.
- **Tanda tangan digital & PDF**: `SignaturePad.tsx` + `pdfService.ts` (dynamic import `html2pdf.js`), `@page` terisolasi per tab (Report = A4 Landscape, BA = A4 Portrait).
- **Maskot AntigravityPet** (`useAppStore.sayPet`): melaporkan hasil sinkronisasi latar belakang, peralihan penyimpanan foto, isian yang belum lengkap, dan penyemangat awal shift; menyingkir saat isian difokuskan dan bergeser di atas bilah simpan yang menempel (`bottomInset`).
- **Direct WhatsApp Share**: Web Share API dipanggil sinkron (user gesture), upload & simpan Supabase berjalan di latar belakang dengan deduplikasi `recentOperationalLogs`; fallback ke clipboard + `wa.me`.

---

## 🕸️ Knowledge Graph (graphify)

Peta keterkaitan kode dan dokumentasi dibuat dengan skill **graphify** (`.agents/skills/graphify`). Hasilnya ada di `graphify-out/` (`graph.json`, `graph.html`, `GRAPH_REPORT.md`) dan **tidak di-commit** (`.gitignore`). Untuk membuat/memperbarui:

```bash
pip install graphifyy          # sekali saja
graphify update .              # re-ekstraksi kode (AST, tanpa LLM) setelah perubahan
graphify query "bagaimana alur share WA di tab Kalibrasi?"
```

Atau jalankan `/graphify . --update` dari agent. Perbarui graph setelah penambahan file/refactor besar.
