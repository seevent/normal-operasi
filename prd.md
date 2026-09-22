# Product Requirements Document (PRD)
## Sistem Informasi & Generator Laporan Operasional SSES T2 Bandara Soekarno-Hatta

---

## 1. Visi & Ringkasan Produk

Aplikasi **SSES T2 Normal Operasi** adalah aplikasi web *mobile-first* yang dirancang khusus untuk personel **T2 Safety & Security Electronic Services (SSES T2)** di Bandara Soekarno-Hatta Terminal 2. Aplikasi ini berfungsi sebagai pusat otomatisasi pelaporan operasional harian, pemantauan peralatan keamanan bandara, manajemen jadwal shift, pembuatan Berita Acara Serah Terima Barang dengan tanda tangan digital, pelacakan TIP (*Threat Image Projection*) performance, serta integrasi data real-time dengan **Supabase** dan **Google Sheets API**.

Dengan aplikasi ini, personel teknisi dan supervisor dapat menyusun laporan berformat standar hanya dalam hitungan detik dan mendistribusikannya secara instan melalui **WhatsApp (Web Share API)**.

---

## 2. Target Pengguna & Persona

| Peran Pengguna | Deskripsi & Tanggung Jawab Utama |
|---|---|
| **Teknisi API (Airport Power & Infrastructure)** | Personel yang bertugas melakukan pengecekan, perbaikan, kalibrasi, serah terima barang, dan penyusunan laporan harian unit API T2. |
| **Teknisi OM / IAS (Operation & Maintenance)** | Personel teknisi dari vendor/mitra kerja IAS yang melakukan pemeliharaan, pengoperasian peralatan keamanan, dan serah terima barang. |
| **Team Leader / Supervisor SSES T2** | Mengawasi laporan shift (*Shift Report*), briefing, verifikasi gangguan (*Initial Report*), validasi tanda tangan BA Serah Terima, dan rekapitulasi performa bulanan. |
| **Admin Sistem SSES T2** | Mengelola master data lokasi, peralatan, unit peralatan (SN/status), stok sparepart, penempatan relasional, upload jadwal shift Excel, konfigurasi checklist, serta integrasi Google Sheets. |

---

## 3. Fitur Utama (12 Tab Modul Operasional)

### 3.1. Tab Kehadiran
* **Fungsi**: Generator laporan kehadiran shift personel (API T2 & OM IAS T2).
* **Fitur Utama**:
  * Auto-populate nama personel berdasarkan tanggal dan shift dinas yang aktif (Pagi PS / Malam M) dari database `jadwal_shift`.
  * Status kehadiran (Hadir, Izin, Sakit, Cuti, Off).
  * Format pesan WhatsApp otomatis sesuai standar laporan kehadiran shift.

### 3.2. Tab Briefing
* **Fungsi**: Generator laporan kegiatan briefing operasional shift / MOT (*Manager on Duty*).
* **Fitur Utama**:
  * Pengisian materi briefing, arahan pimpinan, dan daftar peserta briefing.
  * Pilihan sparepart unit yang dibahas dalam briefing.
  * Lampiran foto dokumentasi briefing.

### 3.3. Tab Storing
* **Fungsi**: Generator laporan penyimpanan atau pemindahan (*storing*) peralatan operasional.
* **Fitur Utama**:
  * Pilihan jenis peralatan terintegrasi database `jenis_peralatan`.
  * Filter lokasi relasional berdasarkan `penempatan_peralatan`.
  * Catatan kondisi dan alasan storing.

### 3.4. Tab Checklist
* **Fungsi**: Checklist status kelayakan operasi peralatan keamanan bandara.
* **Fitur Utama**:
  * Toggle status OK / Not OK per item peralatan.
  * Kategori peralatan: X-Ray, WTMD, Body Scanner, ETD, HHMD, Access Control, CCTV, dll.
  * Konfigurasi item checklist dapat disesuaikan secara dinamis via Panel Admin Data.

### 3.5. Tab Initial Report
* **Fungsi**: Generator laporan awal indikasi gangguan atau kerusakan peralatan secara cepat.
* **Fitur Utama**:
  * Input data peralatan, indikasi kerusakan, lokasi titik spesifik, dan tindakan awal.
  * **Shortcut Cerdas Tindakan Mitigasi**: Tombol rekomendasi otomatis berdasarkan jenis peralatan (X-Ray, Access Control, ETD, WTMD, Body Scanner, Mirroring, dll.) dan kondisi lokasi (PSCP, HBSCP, SSCP, Conveyor Belt, Area Custom, Lift, Data Network).
  * **Shortcut Cerdas Dampak Kerusakan**: Tombol rekomendasi otomatis dampak operasional berdasarkan peralatan (X-Ray Cabin/Bagasi, ETD random check/senyawa, Access Control perijinan/pintu, WTMD/HHMD metal detector).
  * **Photo Uploader & Multi-Layout Live Collage**: Unggah hingga 4 foto dengan opsi pengaturan urutan (*drag/move*).
  * **Photo Text Overlay (Anotasi Teks via Konva)**: Menambahkan teks label, panah, atau catatan langsung di atas foto sebelum dibuat kolase.

### 3.6. Tab Perbaikan
* **Fungsi**: Generator laporan kegiatan perbaikan (*troubleshooting*) dan verifikasi peralatan.
* **Fitur Utama**:
  * Auto-detect sumber laporan (Pihak Custom / Pihak Avsec) berdasarkan lokasi titik yang dipilih.
  * Pilihan jenis & tipe peralatan keamanan otomatis dari database relasional.
  * Auto-complete nama teknisi penanggung jawab.
  * Pengisian rincian masalah, penyebab, tindakan perbaikan, dan status akhir (Normal / Monitoring / Pending).
  * Lampiran foto dokumentasi perbaikan dengan kompresi Canvas dan dual-tier cloud storage.

### 3.7. Tab Kalibrasi
* **Fungsi**: Generator laporan Preventative Maintenance (PM) & Kalibrasi peralatan keamanan multi-lokasi.
* **Fitur Utama**:
  * Parameter pengujian dinamis sesuai standar penerbangan (STP test piece untuk X-Ray, test strip ETD, WTMD detection zones, HHMD, Body Scanner, Access Control).
  * Pengujian & parameter khusus **Extension Conveyor** (Forward/Reverse speed, Emergency Stop, Roller Condition, Belt Tracking, Motor Drive).
  * Multi-lokasi pencatatan kalibrasi harian/mingguan.

### 3.8. Tab Kegiatan
* **Fungsi**: Generator laporan kegiatan harian rutin personel di lapangan (non-perbaikan).
* **Fitur Utama**:
  * Pencatatan uraian kegiatan harian, waktu pelaksanaan, dan teknisi yang bertugas.
  * Penyimpanan riwayat log kegiatan ke tabel Supabase `laporan_operasional`.

### 3.9. Tab BA Serah Terima (Berita Acara)
* **Fungsi**: Generator Berita Acara Serah Terima Barang/Material antar unit dan pihak terkait.
* **Fitur Utama**:
  * Input pihak yang menyerahkan (Pihak I) dan pihak yang menerima (Pihak II).
  * Multi-item barang dengan kuantitas, satuan, kondisi barang, dan input daftar Serial Number (SN) dinamis.
  * **Digital Signature Canvas**: Pad tanda tangan digital interaktif untuk Pihak I, Pihak II, dan Supervisor yang bertugas dinas.
  * Lampiran dokumentasi foto serah terima.
  * Ekspor pesan WhatsApp dan unduh format PDF resmi non-blocking via `pdfService.ts`.

### 3.10. Tab Shift Report
* **Fungsi**: Generator rekapitulasi laporan pergantian shift (*Shift Handover Report*) dan pemantauan kelaikan peralatan.
* **Fitur Utama**:
  * **Interactive Serviceability Diagram**: Visualisasi denah matriks kelaikan peralatan keamanan di sub-terminal D, E, dan F Terminal 2 dengan koordinat sinkron.
  * **In-Modal Photo Upload & Viewer**: Modal CRUD untuk menambahkan atau memperbarui entri kegiatan dengan lampiran foto langsung yang diunggah ke Google Drive / Supabase Storage dan ditampilkan pada kartu laporan.
  * **Editable Total & Off Counts**: Fleksibilitas penyesuaian jumlah unit operasi vs rusak secara langsung.
  * **Kalkulasi Kesiapan Real-time**: Indikator persentase kelaikan dinamis per kategori peralatan (X-Ray, WTMD, HHMD, Body Scanner, ETD, Access Control, CCTV).
  * **Sinkronisasi Database Cloud**: Riwayat kegiatan dan rekapitulasi tersimpan otomatis ke `laporan_operasional` (dengan constraint anti-base64) dan `laporan_checklist` (dengan atomic upsert).
  * Catatan penting untuk shift berikutnya.

### 3.11. Tab TIP (Threat Image Projection)
* **Fungsi**: Tracker performa TIP personel aviation security / teknisi bulanan.
* **Fitur Utama**:
  * Pencatatan jumlah hit, miss, false alarm, total projection, dan persentase skor.
  * Grafik/visualisasi indikator pencapaian target.
  * Penyimpanan data historis langsung ke **Supabase Cloud**.
  * Opsi ekspor laporan TIP menjadi gambar (*canvas export*).

### 3.12. Tab Data (Panel Admin)
* **Fungsi**: Panel pengelolaan master data dan konfigurasi sistem (memerlukan autentikasi admin).
* **Fitur Utama**:
  * **Asset Manager**: Manajemen penempatan aset peralatan (relasi Jenis ↔ Tipe ↔ Lokasi ↔ Titik).
  * **Master Lokasi & Peralatan**: CRUD master lokasi, titik lokasi, jenis peralatan, dan tipe peralatan.
  * **Unit Peralatan Manager**: CRUD unit fisik peralatan dengan SN, sertifikasi, tahun instalasi, kapasitas ampere, dan status operasi.
  * **Sparepart Manager**: Manajemen inventaris sparepart dan seleksi item sparepart untuk tab briefing.
  * **Google Drive Settings Panel**: Konfigurasi URL Google Apps Script Web App untuk penyimpanan cloud foto dokumentasi.
  * **Schedule Uploader**: Upload jadwal shift harian dari berkas Excel (`.xlsx`).
  * **Checklist Editor**: Pengaturan parameter checklist operasi.
  * **Personel Editor**: Manajemen data personel teknisi termasuk NIK dan unit kerja.

### 3.13. Maskot Asisten (AntigravityPet)
* **Fungsi**: Widget asisten mengambang interaktif berbasis karakter Chibi Iron Man di layout utama aplikasi.
* **Fitur Utama**:
  * Fisika melayang (zero-gravity float) & animasi partikel thruster.
  * Dialog tips operasional, pengingat keselamatan, dan status kesiapan bandara.
  * Respons interaktif terhadap ketukan/sentuhan pengguna.

---

## 4. Fitur Shared & Utilities

1. **WhatsApp Report Generator (`waGenerator.ts`)**:
   * Mengubah formulir input menjadi format teks WhatsApp yang terstruktur rapi dengan emoji, bullet points, dan monospace header untuk seluruh 12 tab.
   * Tombol **"Kirim ke WhatsApp"** memanfaatkan Web Share API / WhatsApp direct link (`https://api.whatsapp.com/send?text=...`).
2. **Editor Anotasi Foto & Kolase (`PhotoTextEditorModal.tsx` & `LiveCollagePreview.tsx`)**:
   * Pengeditan foto berbasis HTML5 Canvas & Konva.js.
   * Pembuatan kolase foto otomatis (1x1, 2x1, 2x2, grid) untuk efisiensi lampiran laporan di WhatsApp/Drive.
3. **Dual-Tier Photo Cloud Storage (`googleDriveService.ts`)**:
   * Kompresi otomatis berbasis Canvas (JPEG 80%, maks. 1280px, ~150–250 KB).
   * Primary upload ke Google Drive (`SSES_T2_Dokumentasi`) via Google Apps Script Web App.
   * Fail-safe fallback otomatis ke Supabase Storage bucket `dokumentasi` jika Drive offline atau menolak izin akses.
   * Zero-Base64 enforcement: database dilindungi oleh check constraint `chk_foto_urls_no_base64`.
4. **Canvas Signature Pad (`SignaturePad.tsx`)**:
   * Tanda tangan digital interaktif berbasis touch event & mouse event HTML5 Canvas dengan fitur clear dan preview.
5. **Ekspor Dokumentasi Teroptimasi (`pdfService.ts`)**:
   * Ekspor laporan ke PDF (`html2pdf.js`) non-blocking, Excel (`xlsx`), atau gambar PNG (`html2canvas`).

---

## 5. Kebutuhan Non-Fungsional (NFR)

* **Mobile-First UX/UI**: Dioptimalkan untuk perangkat seluler Android dan iOS dengan paginasi dan gesture swipe tab horizontal. Seluruh input teks menggunakan `font-size: 16px` untuk mencegah auto-zoom pada iOS Safari.
* **Performa & Ukuran Bundle**: Menggunakan Vite 7 dengan Code Splitting TanStack Router untuk waktu muat awal < 2 detik pada jaringan 4G.
* **Protokol Aman (HTTPS Local & Production)**: Menggunakan plugin `@vitejs/plugin-basic-ssl` pada environment pengembang lokal untuk memastikan Web Share API dan Camera API berfungsi di browser ponsel.
* **Offline Resilience & Data Persistence**: Menyimpan draf input sementara ke `localStorage` agar tidak hilang jika terjadi kegagalan koneksi.
* **Keamanan Akses**: Tab **Data** dilindungi oleh sistem autentikasi password/pin admin berbasis Zustand & Supabase Auth.
* **Reliabilitas Integrasi**: Dukungan fallback otomatis dari Supabase Cloud ke Local Storage jika terjadi hambatan koneksi backend.

---

## 6. Roadmap & Pengembangan Mendatang

* [x] Integrasi Penyimpanan Cloud Foto Dokumentasi Dual-Tier (Google Drive + Supabase Storage).
* [x] Diagram Serviceability Interaktif & Persistensi Cloud Laporan Operasional.
* [x] In-Modal Photo Upload & Attachment pada Tab Shift Report.
* [ ] Integrasi Notifikasi Push (PWA Service Worker) untuk jadwal shift.
* [ ] Ekspor Otomatis Rekap Bulanan ke Google Drive PDF Folder.
* [ ] Mode Dark Mode / Light Mode switchable.
* [ ] Pengenalan Suara (Voice-to-Text) untuk pengisian uraian perbaikan di lapangan.
