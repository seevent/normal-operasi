# Product Requirements Document (PRD)
## Sistem Informasi & Generator Laporan Operasional SSES T2 Bandara Soekarno-Hatta

> Terakhir diselaraskan dengan kode: **1 Oktober 2026**. Dokumen ini menjelaskan *apa* yang dilakukan produk; detail teknis ada di [architecture.md](architecture.md), skema data di [database.md](database.md).

---

## 1. Visi & Ringkasan Produk

Aplikasi **SSES T2 Normal Operasi** adalah aplikasi web *mobile-first* untuk personel **T2 Safety & Security Electronic Services (SSES T2)** di Bandara Soekarno-Hatta Terminal 2. Aplikasi menjadi pusat otomatisasi pelaporan operasional harian: laporan kehadiran/dinas, briefing, storing, checklist, gangguan, perbaikan, kalibrasi/preventive, kegiatan, berita acara serah terima (dengan tanda tangan digital), laporan harian (Report), dan pelacakan TIP — dengan data tersinkron ke **Supabase** dan foto di **Cloudinary** (cadangan Supabase Storage).

Personel menyusun laporan berformat standar dalam hitungan detik dan membagikannya langsung ke WhatsApp lewat **Web Share API**.

---

## 2. Target Pengguna & Persona

| Peran | Deskripsi & Tanggung Jawab |
|---|---|
| **Teknisi API T2** | Pengecekan, perbaikan, kalibrasi/preventive, serah terima barang, dan laporan harian unit API T2. |
| **Teknisi OM / IASS T2** | Teknisi mitra (OM/IAS) yang memelihara dan mengoperasikan peralatan keamanan, serta terlibat serah terima barang. |
| **Team Leader / Supervisor SSES T2** | Mengawasi laporan harian (Report), briefing, Initial Report gangguan, dan tanda tangan BA Serah Terima. |
| **Admin Sistem SSES T2** | Login di tab Data: kelola master lokasi/peralatan/unit, sparepart, personel, jadwal shift & PM (Excel), konfigurasi checklist, peralatan kalibrasi, dan Cloudinary. |

Sebagian besar pengguna menyimpan laporan **sebagai tamu** (tanpa login); hanya tab Data yang meminta login.

---

## 3. Fitur Utama (12 Tab)

Urutan tab di layar: Kehadiran, Briefing, Storing, Checklist, Initial Report, Perbaikan, Kalibrasi, Kegiatan, BA Serah Terima, Report, TIP, Data (8 tab per halaman, geser/swipe untuk halaman kedua). Tab awal saat dibuka: Initial Report.

### 3.1. Kehadiran
* Laporan dinas **API T2** dan **OM IASS T2**, terisi otomatis dari jadwal shift (`jadwal_shift`) sesuai tanggal dan shift; daftar personel diurutkan mengikuti jabatan.
* Status per personel: Hadir, Izin, Sakit, Dinas Luar; nomor telepon personel tampil di pesan.
* **Rencana Kegiatan** terisi otomatis: kegiatan dasar (Monitoring Ops, Storing Peralatan) dan, bila ada jadwal PM hari itu, baris Preventive Maintenance & Kalibrasi dengan format **Preventive Mingguan / Bulanan** dari `jadwal_pm` (disaring pengaturan tampilan PM). Kotak Rencana Kegiatan menyesuaikan tinggi isinya.
* Pesan WA berjudul **LAPORAN DINAS** ("T2 Safety & Security Electronic Services").
* Setelah laporan dibagikan, maskot memberi penyemangat awal shift (Pagi/Siang atau Malam).

### 3.2. Briefing
* Jenis **Unit** (judul WA `GIAT BRIEFING UNIT SSES T2`) atau **MOT** (`BRIEFING MOT T2`) — judul huruf kapital.
* Memuat tanggal, shift, lokasi; untuk briefing Unit, daftar sparepart yang ditandai admin beserta stok; lampiran foto.

### 3.3. Storing
* Laporan storing peralatan dengan pilihan peralatan dan lokasi relasional (daftar lokasi menyesuaikan peralatan); hasil/status storing.
* Judul WA **KEGIATAN STORING PERALATAN** (tebal). Data storing juga disinkronkan ke status checklist (supervisor Avsec per lokasi).

### 3.4. Checklist
* Checklist status operasi peralatan per lokasi/blok, sinkron antar-perangkat secara *realtime* (toggle aktif & data shift lewat `master_configs`).
* Struktur checklist dikelola admin di **Data → Checklist Config** (editor terstruktur: blok lokasi/grup/access control, sub-grup, kategori, item; pencarian, ringkasan statistik, peringatan perubahan belum disimpan).

### 3.5. Initial Report
* Laporan awal indikasi gangguan: peralatan, lokasi (satu atau lebih), waktu, indikasi, permasalahan, mitigasi, dampak.
* **Shortcut cerdas** permasalahan, mitigasi, dan dampak yang menyesuaikan jenis peralatan (X-Ray, Access Control, Body Scanner, ATRS, Mirroring, WTMD, HHMD, dst.) dan lokasi (PSCP, HBSCP, SSCP, Conveyor, Custom, Lift, …).
* Foto dengan kolase multi-layout dan anotasi teks overlay (Canvas) sebelum dibagikan.

### 3.6. Perbaikan
* Judul WA **LAPORAN CORRECTIVE MAINTENANCE** (atau LAPORAN VERIFIKASI untuk verifikasi ETD).
* Sumber laporan (Custom / Avsec) **terdeteksi otomatis** dari lokasi yang dipilih; peralatan dari database relasional (atau ketik manual); teknisi on-duty disarankan otomatis.
* Status akhir: Pekerjaan Selesai, Normal Operasi, On Progress, Menunggu Sparepart. Foto dokumentasi dengan penyimpanan cloud.
* Isian *Permasalahan* dan *Tindak lanjut* membesar mengikuti isi (hook `useAutoResizeTextarea`).

### 3.7. Kalibrasi
* Laporan **PREVENTIVE MAINTENANCE & KALIBRASI** multi-lokasi; jenis peralatan yang muncul diatur admin (`tampil_di_kalibrasi`).
* Parameter dinamis per peralatan: X-Ray (kV, mA, Ontime vertikal/horizontal, Archive), WTMD (zona Z1–Z4 dan LC/LS/UC/SE/DS), Body Scanner, ETD, HHMD, Access Control, **Extension Conveyor**.
* **Parameter X-Ray & WTMD tidak punya nilai bawaan** — hanya *Archive* X-Ray default `+- 1 bulan`; nilai kosong tetap kosong di pesan.
* Preview WA mengikuti panjang pesan; foto diunggah ke cloud dan URL-nya disimpan.

### 3.8. Kegiatan
* Laporan kegiatan harian dengan dropdown **Peralatan opsional** (kosong → `All Faskampen`); bisa ketik manual. Riwayat tersimpan di `laporan_operasional`.

### 3.9. BA Serah Terima
* Berita Acara serah terima barang: Pihak Kesatu (penyerah) dan Pihak Kedua (penerima), multi-item (jumlah, satuan, kondisi, daftar serial number), lampiran foto.
* **Tanda tangan digital** untuk penyerah dan penerima di layar sentuh; nama lengkap personel dipakai di dokumen.
* Dokumen resmi **A4 Portrait**; ekspor PDF non-blocking dan pesan WA. Maskot dan elemen UI tidak ikut tercetak.

### 3.10. Report (laporan harian / Shift Handover)
* Merekap log kegiatan shift dari `laporan_operasional` dan kelaikan peralatan dari `laporan_checklist`; hasil dapat dicetak/PDF dan dibagikan.
* **Preview WhatsApp real-time** berformat *Closing briefing* — personel diurutkan seperti tab Kehadiran; bagian permasalahan tanpa tanda "•"; preview mengikuti panjang pesan.
* **Serviceability**: diagram interaktif denah Terminal 2 (sub-terminal D, E, F), total & off peralatan yang dapat diedit, persentase kelaikan per kategori (X-Ray, WTMD, HHMD, Body Scanner, ETD, Access Control, CCTV), dan lembar terpisah di halaman terakhir.
* **CRUD log** lewat modal dengan lampiran foto langsung. Header cetak memakai logo InJourney Airports.
* Cetak default **A4 Landscape**.

### 3.11. TIP (Threat Image Projection)
* Pencatatan TIP bulanan per unit X-Ray; daftar lokasi/unit dibentuk otomatis dari master checklist (kategori X-Ray), dengan penanda per unit, indikator progres (terisi / total), dan waktu simpan terakhir.
* Data tersimpan di Supabase (`master_configs`, kunci `tip_data_<Bulan>_<Tahun>`); admin dapat meninjau/menghapusnya di Data → Data TIP Tersimpan.
* Ekspor hasil sebagai gambar JPG dan bagikan lewat Web Share API.

### 3.12. Data (panel admin)
Login dengan **email + kata sandi** (Supabase Auth). Delapan sub-tab:
1. **Upload Jadwal Excel** — jadwal shift (`jadwal_shift`, upsert) dan jadwal PM (`jadwal_pm`, per bulan; ada pengaturan kategori/jenis PM yang ditampilkan di Kehadiran).
2. **Sparepart List** — CRUD sparepart dan penandaan sparepart untuk Briefing.
3. **Manajemen Aset (Lokasi & Mesin)** — master lokasi/titik, jenis/tipe peralatan, penempatan, dan unit peralatan (serial number, status operasi/standby/gudang/rusak, kepemilikan).
4. **Personel** — satu tab untuk API T2 dan OM IASS T2: nama, NIK, nomor HP, jabatan, urutan (naik/turun).
5. **Checklist Config** — editor struktur checklist.
6. **Config Peralatan Kalibrasi** — jenis peralatan yang muncul di tab Kalibrasi.
7. **Data TIP Tersimpan** — daftar & hapus data TIP bulanan.
8. **Cloudinary CDN** — cloud name & upload preset (global, tersimpan di `master_configs`).

### 3.13. Maskot AntigravityPet
* Karakter **mesin X-Ray pemindai bagasi** yang melayang (zero-g, glow hangat); dapat digeser dan di-minimize; merespons ketukan dengan kalimat bertema pemindaian bagasi ("Bip bip! Hasil scan: …").
* **Satu-satunya kanal notifikasi** aplikasi (`sayPet`): hasil sinkronisasi latar belakang ke Supabase (kegagalan menetap sampai ditutup), peralihan foto Cloudinary → Supabase Storage, isian wajib yang belum lengkap, dan penyemangat awal shift.
* Menyingkir saat `input`/`select`/`textarea` difokuskan, dan bergeser di atas bilah simpan yang menempel agar tidak menelan ketukan tombol.

---

## 4. Fitur Lintas Tab

1. **Format pesan WhatsApp standar** — setiap tab punya generator murni (`*Message.ts`/`waGenerator.ts`). Format (judul, emoji, pemisah, bullet) mengikuti standar grup operasional dan **tidak boleh diubah tanpa permintaan eksplisit**, karena dibaca pihak lain. Judul yang sudah ditetapkan: LAPORAN DINAS, GIAT BRIEFING UNIT SSES T2, BRIEFING MOT T2, KEGIATAN STORING PERALATAN, LAPORAN CORRECTIVE MAINTENANCE, LAPORAN PREVENTIVE MAINTENANCE & KALIBRASI.
2. **Validasi isian wajib yang seragam** — pada Kehadiran, Briefing, Checklist, Storing, Kegiatan, BA Serah Terima, Initial Report, Perbaikan, dan Kalibrasi: bila ada isian kosong saat membagikan, (a) layar bergulir & fokus ke isian kosong pertama, (b) isian berbingkai merah dengan tulisan merah, (c) maskot menyebut isian yang kurang (diringkas bila lebih dari 5). Isian bernomor/berpoin yang hanya berisi penanda dianggap kosong.
3. **Standar penulisan lokasi** — `"<Lokasi> <Nomor>"` tanpa "No." (mis. `PSCP D 2`, `HBSCP 2.5`); data lama dinormalkan otomatis di semua tab dan pesan.
4. **Istilah tampilan "IASS"** — teks yang terlihat pengguna memakai *IASS* (bukan *IAS*); nilai `unit_kerja.nama` di database tetap `OM/IAS T2`.
5. **Relasi peralatan ↔ lokasi ↔ titik** — dropdown lokasi pada Perbaikan, Initial Report, Storing, dan Kalibrasi disaring oleh jenis peralatan terpilih.
6. **Foto & cloud** — kompresi Canvas (maks. 1280px, ~150–250 KB), unggah ke Cloudinary dengan cadangan otomatis ke Supabase Storage; database hanya menerima URL HTTPS (constraint anti-Base64).
7. **Berbagi WhatsApp instan** — Web Share API dipanggil seketika saat tombol ditekan; unggah dan penyimpanan berjalan di latar belakang dengan deduplikasi; fallback clipboard + `wa.me` dan unduh berkas.
8. **Cetak & PDF** — Report A4 Landscape, BA Serah Terima A4 Portrait; ekspor PDF (`html2pdf.js`) non-blocking.
9. **Aturan shift** — PS (08:00–20:00) dan M (20:00–08:00); default tanggal/shift laporan: 00:00–09:59 → kemarin M; 10:00–21:59 → hari ini PS; 22:00–23:59 → hari ini M.

---

## 5. Kebutuhan Non-Fungsional (NFR)

* **Mobile-first**: dioptimalkan untuk Android/iOS (375–430px); input `font-size ≥ 16px` agar iOS Safari tidak auto-zoom; target sentuh ≥ 44px; navigasi tab dengan swipe.
* **Performa**: Vite 7 + code splitting TanStack; unduhan berat (html2pdf, html-to-image) dimuat saat dibutuhkan.
* **HTTPS**: dev server HTTPS (`@vitejs/plugin-basic-ssl`) agar Web Share dan Camera API berfungsi di ponsel.
* **Ketahanan**: bila Supabase tak terjangkau, aplikasi memakai data bawaan `masterData.ts` dan tidak crash; bila Cloudinary gagal, foto beralih ke Supabase Storage; kegagalan simpan latar belakang dikabarkan maskot. *Draf formulir tidak disimpan ke `localStorage`* — menutup tab sebelum membagikan berarti isian hilang.
* **Keamanan akses**: tab Data memakai Supabase Auth. Tulis ke tabel operasional/konfigurasi saat ini masih terbuka untuk publik pada level RLS (lihat [database.md §6](database.md#6-catatan-keamanan-rls)); `xlsx 0.18.5` memiliki advisory yang diterima secara sadar (lihat architecture.md §9).
* **Kualitas**: 141 unit test (`npm test`), `npm run lint` (0 error/0 peringatan), dan `npm run build` harus lulus sebelum merge; ketiganya memblokir CI. Tipe data bersama ada di `src/lib/types.ts`; kode baru tidak boleh memakai `any`.

---

## 6. Roadmap & Pengembangan Mendatang

Selesai:
* [x] Penyimpanan foto di Cloudinary (migrasi dari Google Drive, September 2026).
* [x] Diagram serviceability interaktif + persistensi cloud; upload foto di modal Report.
* [x] Cetak default A4 Landscape (Report) / Portrait (BA) dengan `@page` terisolasi.
* [x] Maskot sebagai pelapor operasional (notifikasi sinkronisasi, peralihan foto, isian kosong, penyemangat shift).
* [x] Modularisasi tab, perangkat lint/CI, penghapusan dependensi mati (Konva dll.).
* [x] Lint bersih: 2 error, 7 `exhaustive-deps`, variabel tak terpakai, dan 281 `any` diganti tipe domain; lint kini memblokir CI.
* [x] Editor Checklist Config terstruktur; tab Personel tunggal.
* [x] Validasi isian wajib seragam; standar penulisan lokasi; format WA baru (Kehadiran, Report, Kalibrasi, Perbaikan, Briefing, Storing); jadwal Preventive Mingguan/Bulanan.
* [x] Perbaikan simpan personel dari Data → Personel (kolom `unit_id`, NIK wajib/unik, penghapusan terbatas + konfirmasi karena riwayat jadwal ikut terhapus).

Belum dikerjakan / ide:
* [ ] Memperketat RLS Supabase (tulis `master_configs`, `jadwal_*`, `spareparts`, `unit_peralatan` hanya untuk pengguna login).
* [ ] Menambahkan `tsc --noEmit` ke CI (tersisa satu error tipe di `vite.config.ts`: `server.https: true`) dan memberi tipe pada klien Supabase (`Database` dari skema) agar cast `as unknown as` di batas data bisa dihapus.
* [ ] Menyimpan draf formulir sementara agar tahan terhadap tab tertutup.
* [ ] Notifikasi push (PWA Service Worker) untuk jadwal shift.
* [ ] Ekspor otomatis rekap bulanan ke PDF.
* [ ] Mode gelap/terang.
* [ ] Voice-to-text untuk uraian perbaikan.
* [ ] Endpoint MCP untuk pelaporan penuh (rencana ada di `docs/superpowers/plans/2026-09-15-mcp-full-reporting.md`, belum diimplementasikan).
