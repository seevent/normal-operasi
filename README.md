# SSES T2 - Generator Laporan

Aplikasi web mobile-first untuk personel **T2 Safety & Security Electronic Services (SSES T2)** di Bandara Soekarno-Hatta Terminal 2. Aplikasi ini memudahkan pembuatan dan pengiriman laporan harian melalui WhatsApp.

## Fitur Utama

| Tab | Fungsi |
|-----|--------|
| **Perbaikan** | Generator laporan perbaikan/verifikasi peralatan keamanan |
| **Kehadiran** | Generator laporan kehadiran shift personel API & OM IAS |
| **Briefing** | Generator laporan giat briefing unit/MOT |
| **Storing** | Generator laporan kegiatan storing peralatan |
| **Checklist** | Checklist status operasi peralatan (toggle per item) |
| **Kalibrasi** | Generator laporan PM & kalibrasi multi-lokasi |
| **TIP** | Tracker TIP Performance bulanan dengan export gambar |
| **Cam** | Kamera dengan watermark otomatis (waktu, tanggal, lokasi GPS) |

## Teknologi

- **Framework**: React 19 + TanStack Start
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Platform**: Netlify (static/SSR)
- **Build**: Vite

## Menjalankan Lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser mobile atau gunakan DevTools mobile simulation.

## Catatan Penggunaan

- Aplikasi dioptimalkan untuk **mobile phone** (touch-friendly, font size 16px mencegah zoom iOS)
- Tab **Cam** memerlukan izin kamera dan lokasi
- Tab **TIP** menyimpan progress ke `localStorage` per bulan/tahun
- Semua laporan dikirim via **Web Share API** (WhatsApp) atau fallback copy teks
- Kolase foto otomatis dibuat via **Canvas API** di browser
