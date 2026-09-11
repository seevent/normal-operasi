# Pemindahan Pengaturan Google Drive ke Tab Data

## Tujuan

Memindahkan pengaturan Google Drive dari tab Report ke sub-tab khusus di tab Data agar konfigurasi administratif terkumpul di satu tempat dan hanya dapat diakses oleh admin yang sudah login.

## Ruang Lingkup

- Menambahkan sub-tab `Google Drive` pada navigasi internal tab Data.
- Menampilkan form pengaturan Google Drive sebagai panel biasa di sub-tab tersebut.
- Mempertahankan nilai konfigurasi lama dan mekanisme penyimpanan yang sudah digunakan oleh `googleDriveService`.
- Menghapus tombol pembuka dan modal pengaturan Google Drive dari tab Report.
- Tidak mengubah proses unggah foto, pembuatan laporan, atau tampilan data laporan.

## Desain Komponen

Pengaturan dipisahkan menjadi komponen `GoogleDriveSettingsPanel`. Komponen ini bertanggung jawab untuk:

- membaca URL aktif melalui `getGoogleScriptUrl`;
- menampilkan dan mengubah URL Google Apps Script Web App;
- menyimpan URL melalui `setGoogleScriptUrl`;
- menampilkan umpan balik singkat setelah penyimpanan berhasil;
- mempertahankan penjelasan tentang akses folder dan foto Google Drive.

`TabData` menambahkan item navigasi sub-tab `Google Drive` dan merender komponen tersebut saat dipilih. Karena seluruh isi `LocalDataEditor` hanya dirender setelah autentikasi admin berhasil, sub-tab baru otomatis mengikuti pembatasan akses yang sama.

`TabShiftReport` tidak lagi memiliki state, handler, tombol, modal, atau import ikon yang khusus untuk pengaturan Google Drive. Integrasi Google Drive untuk membaca foto dan membuka tautan laporan tetap dipertahankan.

## Aliran Data

1. Admin login dan membuka tab Data.
2. Admin memilih sub-tab Google Drive.
3. Komponen membaca URL dari environment atau `localStorage` melalui service yang sudah ada.
4. Admin memperbarui URL dan menekan tombol Simpan Pengaturan.
5. Nilai disimpan dengan key lama sehingga konfigurasi yang sudah ada tetap kompatibel.

## Penanganan Kesalahan

- Validasi bawaan input URL tetap digunakan.
- Penyimpanan lokal bersifat sinkron dan tidak membutuhkan permintaan jaringan.
- Jika URL dikosongkan, konfigurasi lokal dihapus sesuai perilaku service saat ini.
- Nilai environment, bila tersedia, tetap memiliki prioritas seperti sebelumnya.

## Verifikasi

- Pemeriksaan statis memastikan import dan state lama di tab Report sudah bersih.
- Build produksi memastikan TypeScript dan bundling berhasil.
- Pemeriksaan UI memastikan sub-tab Google Drive muncul setelah login admin, form dapat menyimpan nilai, dan tombol pengaturan tidak lagi ada di tab Report.

## Batasan

- Tidak mengubah format URL, API Google Apps Script, atau aturan izin Google Drive.
- Tidak memindahkan fungsi tampilan foto Google Drive dari tab Report.
- Tidak melakukan refactor di luar kode yang langsung terkait pemindahan pengaturan.
