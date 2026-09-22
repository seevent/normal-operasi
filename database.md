# Database & Data Schema Specification
## SSES T2 Generator Laporan Operasional

---

## 1. Ringkasan Arsitektur Data

Aplikasi **SSES T2 Generator Laporan** menerapkan arsitektur data multi-tier:

1. **Cloud Database (Supabase PostgreSQL)**: Menyimpan master data terstruktur, relasi peralatan-lokasi, data personel, jadwal shift, catatan performa TIP, log kegiatan operasional, dan ringkasan kelaikan peralatan.
2. **Cloud Object Storage (Supabase Storage)**: Bucket publik `dokumentasi` sebagai fail-safe secondary storage untuk foto lampiran laporan operasional ketika Google Drive endpoint offline.
3. **Local Storage Fallback**: Menyimpan draf formulir pengguna dan data master lokal di peramban pengguna (*offline resilience*).

---

## 2. Diagram Relasi Entitas (ERD - Supabase PostgreSQL & Storage)

```mermaid
erDiagram
    JENIS_PERALATAN ||--o{ TIPE_PERALATAN : "memiliki"
    LOKASI ||--o{ TITIK_LOKASI : "memiliki"
    
    TIPE_PERALATAN ||--o{ PENEMPATAN_PERALATAN : "ditempatkan di"
    LOKASI ||--o{ PENEMPATAN_PERALATAN : "lokasi penempatan"
    TITIK_LOKASI ||--o{ PENEMPATAN_PERALATAN : "titik penempatan"

    UNIT_KERJA ||--o{ PERSONEL : "mewadahi"
    PERSONEL ||--o{ JADWAL_SHIFT : "memiliki jadwal"

    LAPORAN_OPERASIONAL {
        uuid id PK
        date tanggal
        string shift
        string jenis
        string lokasi
        string peralatan
        string kategori_maintenance
        text uraian
        text tindak_lanjut
        string status
        string teknisi
        jsonb foto_urls "URL HTTPS only (chk_foto_urls_no_base64)"
        timestamp created_at
    }

    LAPORAN_CHECKLIST {
        uuid id PK
        date tanggal "UK (tanggal, shift)"
        string shift "UK (tanggal, shift)"
        jsonb summary
        timestamp created_at
    }

    MASTER_CONFIGS {
        uuid id PK
        string config_key UK
        jsonb config_value
        timestamp updated_at
    }

    STORAGE_BUCKET_DOKUMENTASI {
        string bucket_id "dokumentasi"
        string file_name "{timestamp}_{name}.jpg"
        boolean is_public true
    }

    STORAGE_BUCKET_DOKUMENTASI ||--o{ LAPORAN_OPERASIONAL : "menyimpan foto lampiran"
```

---

## 3. Spesifikasi Skema Tabel PostgreSQL (Supabase)

### 3.1. Tabel `jenis_peralatan`
Menyimpan kategori/jenis umum peralatan keamanan di bandara.

| Nama Kolom | Tipe Data | Kunci | Keterangan |
|---|---|---|---|
| `id` | `UUID` / `BIGINT` | **PK** | Identifier unik jenis peralatan. |
| `nama_jenis` | `VARCHAR(100)` | **NOT NULL** | Nama jenis (misal: X-Ray, WTMD, Body Scanner, ETD, HHMD, Access Control). |
| `deskripsi` | `TEXT` | NULL | Penjelasan tambahan jenis peralatan. |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Waktu pembuatan data. |

---

### 3.2. Tabel `tipe_peralatan`
Menyimpan merk, tipe, atau varian spesifik dari suatu jenis peralatan.

| Nama Kolom | Tipe Data | Kunci | Keterangan |
|---|---|---|---|
| `id` | `UUID` / `BIGINT` | **PK** | Identifier unik tipe peralatan. |
| `id_jenis` | `UUID` / `BIGINT` | **FK** | Referensi ke `jenis_peralatan(id)`. |
| `nama` / `nama_tipe` | `VARCHAR(150)` | **NOT NULL** | Nama merk/tipe (misal: Rapiscan 620DV, Smiths Heimann, Nuctech). |
| `varian` | `VARCHAR(50)` | NULL | Varian peralatan (misal: `Cabin`, `Bagasi`, `Dekstop`, `Portable`). |
| `brand` | `VARCHAR(100)` | NULL | Merk manufaktur. |
| `spesifikasi` | `TEXT` | NULL | Catatan spesifikasi teknis peralatan. |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Waktu pembuatan data. |

---

### 3.3. Tabel `lokasi`
Menyimpan daftar nama lokasi atau area utama di Terminal 2 Bandara Soekarno-Hatta.

| Nama Kolom | Tipe Data | Kunci | Keterangan |
|---|---|---|---|
| `id` | `UUID` / `BIGINT` | **PK** | Identifier unik lokasi. |
| `nama_lokasi` | `VARCHAR(150)` | **NOT NULL** | Nama lokasi (misal: PSCP D, HBSCP E, SSCP F, Umrah, Arrival Hall F). |
| `kode_lokasi` | `VARCHAR(50)` | NULL | Kode singkat area/lokasi. |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Waktu pembuatan data. |

---

### 3.4. Tabel `titik_lokasi`
Menyimpan nomor titik atau gate spesifik dari suatu lokasi area.

| Nama Kolom | Tipe Data | Kunci | Keterangan |
|---|---|---|---|
| `id` | `UUID` / `BIGINT` | **PK** | Identifier unik titik lokasi. |
| `id_lokasi` | `UUID` / `BIGINT` | **FK** | Referensi ke `lokasi(id)`. |
| `nomor_titik` | `VARCHAR(50)` | **NOT NULL** | Nomor titik (misal: Titik 1, Gate 2, Line 3, Pos 5). |
| `keterangan` | `TEXT` | NULL | Catatan khusus posisi titik. |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Waktu pembuatan data. |

---

### 3.5. Tabel Pivot `penempatan_peralatan`
Menghubungkan tipe peralatan dengan lokasi dan titik penempatannya secara relasional dinamis.

| Nama Kolom | Tipe Data | Kunci | Keterangan |
|---|---|---|---|
| `id` | `UUID` / `BIGINT` | **PK** | Identifier unik penempatan. |
| `id_tipe` | `UUID` / `BIGINT` | **FK** | Referensi ke `tipe_peralatan(id)`. |
| `id_lokasi` | `UUID` / `BIGINT` | **FK** | Referensi ke `lokasi(id)`. |
| `id_titik` | `UUID` / `BIGINT` | **FK** | Referensi ke `titik_lokasi(id)`. |
| `status` | `VARCHAR(50)` | DEFAULT `'Aktif'` | Status operasional penempatan (Aktif / Storing / Non-Aktif). |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Waktu pemasangan/pencatatan. |

---

### 3.6. Tabel `unit_peralatan`
Menyimpan inventaris unit fisik peralatan per nomor seri (SN) dan status operasionalnya.

| Nama Kolom | Tipe Data | Kunci | Keterangan |
|---|---|---|---|
| `id` | `UUID` | **PK** | Identifier unik unit peralatan. |
| `id_tipe` | `UUID` / `BIGINT` | **FK** | Referensi ke `tipe_peralatan(id)`. |
| `sn` | `VARCHAR(100)` | NULL | Nomor Seri (*Serial Number*) unit peralatan. |
| `no_sertifikasi` | `VARCHAR(100)` | NULL | Nomor sertifikasi kelaikan operasi. |
| `tahun_instalasi` | `VARCHAR(10)` | NULL | Tahun pemasangan unit di bandara. |
| `ampere` | `VARCHAR(20)` | NULL | Konsumsi/kapasitas daya listrik (Ampere). |
| `milik` | `VARCHAR(50)` | DEFAULT `'API'` | Kepemilikan aset (API / OM / IAS / Custom). |
| `status` | `VARCHAR(50)` | DEFAULT `'operasi'` | Status (operasi / backup / rusak / storing / scrap). |
| `catatan` | `TEXT` | NULL | Catatan riwayat atau kondisi khusus unit. |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Waktu pencatatan unit. |

---

### 3.7. Tabel `spareparts`
Menyimpan inventaris komponen suku cadang dan konfigurasi item pembahasan briefing.

| Nama Kolom | Tipe Data | Kunci | Keterangan |
|---|---|---|---|
| `id` | `UUID` | **PK** | Identifier unik sparepart. |
| `name` | `VARCHAR(150)` | **NOT NULL** | Nama komponen sparepart. |
| `sku` | `VARCHAR(100)` | NULL | Kode part number / SKU inventaris. |
| `id_tipe` | `UUID` / `BIGINT` | **FK** | Kompatibilitas dengan `tipe_peralatan(id)`. |
| `qty` | `INTEGER` | DEFAULT `0` | Jumlah stok tersedia. |
| `satuan` | `VARCHAR(30)` | DEFAULT `'Pcs'` | Satuan barang (Pcs, Set, Roll, Meter, dll.). |
| `lokasi_rak` | `VARCHAR(100)` | NULL | Posisi penyimpanan di gudang/workshop. |
| `in_briefing` | `BOOLEAN` | DEFAULT `false` | Menentukan apakah tampil di tab Briefing Unit. |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Waktu penambahan sparepart. |

---

### 3.8. Tabel `unit_kerja`
Menyimpan daftar unit kerja operasional.

| Nama Kolom | Tipe Data | Kunci | Keterangan |
|---|---|---|---|
| `id` | `UUID` / `BIGINT` | **PK** | Identifier unik unit kerja. |
| `nama_unit` | `VARCHAR(100)` | **NOT NULL** | Nama unit (misal: API T2, OM/IAS T2). |
| `deskripsi` | `TEXT` | NULL | Keterangan tugas unit kerja. |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Waktu pembuatan data. |

---

### 3.9. Tabel `personel`
Menyimpan data anggota personel teknisi SSES T2.

| Nama Kolom | Tipe Data | Kunci | Keterangan |
|---|---|---|---|
| `id` | `UUID` / `BIGINT` | **PK** | Identifier unik personel. |
| `nama` | `VARCHAR(150)` | **NOT NULL** | Nama lengkap personel. |
| `nik` | `VARCHAR(50)` | NULL | Nomor Induk Karyawan / NIK personel. |
| `phone` | `VARCHAR(20)` | NULL | Nomor WhatsApp / kontak. |
| `id_unit` | `UUID` / `BIGINT` | **FK** | Referensi ke `unit_kerja(id)`. |
| `jabatan` | `VARCHAR(100)` | NULL | Jabatan struktural (Manager, Supervisor, Engineer, Team Leader, Teknisi, dll.). |
| `role` | `VARCHAR(50)` | DEFAULT `'Teknisi'`| Peran otorisasi (Teknisi / Leader / Admin). |
| `status` | `VARCHAR(20)` | DEFAULT `'Aktif'` | Status keanggotaan. |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Waktu pendaftaran. |

---

### 3.10. Tabel `jadwal_shift`
Menyimpan alokasi jadwal shift harian personel teknisi yang dapat diunggah dari berkas Excel.

| Nama Kolom | Tipe Data | Kunci | Keterangan |
|---|---|---|---|
| `id` | `UUID` / `BIGINT` | **PK** | Identifier unik jadwal shift. |
| `tanggal` | `DATE` | **NOT NULL** | Tanggal tugas shift (YYYY-MM-DD). |
| `id_personel` | `UUID` / `BIGINT` | **FK** | Referensi ke `personel(id)`. |
| `shift` | `VARCHAR(20)` | **NOT NULL** | Kode shift (PS / Pagi / Siang / M / Malam / Off / Cuti / Special). |
| `status_kehadiran` | `VARCHAR(20)` | DEFAULT `'Hadir'` | Status presensi personel. |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Waktu pencatatan. |

---

### 3.11. Tabel `master_configs` (JSONB)
Menyimpan konfigurasi fleksibel dan data agregat dalam format JSONB.

| Nama Kolom | Tipe Data | Kunci | Keterangan |
|---|---|---|---|
| `id` | `UUID` | **PK** | Identifier unik konfigurasi. |
| `config_key` | `VARCHAR(100)` | **UNIQUE** | Kunci identifikasi unik (misal: `checklist_config`, `storing_config`, `tip_performance_data`). |
| `config_value` | `JSONB` | **NOT NULL** | Payload JSON sesuai jenis `config_key`. |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Waktu pembaruan konfigurasi terakhir. |

---

### 3.12. Tabel `laporan_operasional`
Menyimpan catatan kegiatan operasional harian teknisi (Perbaikan, Storing, Kegiatan, Kalibrasi) untuk sinkronisasi antar-shift dan rekapitulasi Shift Report.

| Nama Kolom | Tipe Data | Kunci / Constraint | Keterangan |
|---|---|---|---|
| `id` | `UUID` / `BIGINT` | **PK** | Identifier unik log kegiatan. |
| `tanggal` | `DATE` / `VARCHAR(10)` | **NOT NULL** | Tanggal operasional log (YYYY-MM-DD). |
| `shift` | `VARCHAR(10)` | **NOT NULL** | Shift dinas log ('PS' / 'M'). |
| `jenis` | `VARCHAR(50)` | **NOT NULL** | Jenis kegiatan ('Perbaikan', 'Storing', 'Kegiatan', 'Kalibrasi'). |
| `waktu` | `VARCHAR(20)` | NULL | Jam pelaksanaan (HH:mm). |
| `lokasi` | `VARCHAR(150)` | NULL | Lokasi pelaksanaan. |
| `peralatan` | `VARCHAR(150)` | NULL | Nama jenis & tipe peralatan terkait. |
| `kategori_maintenance` | `VARCHAR(50)` | DEFAULT `'CORRECTIVE'` | Kategori pemeliharaan ('CORRECTIVE', 'PREVENTIVE', 'STORING', 'KEGIATAN'). |
| `uraian` | `TEXT` | NULL | Deskripsi masalah / uraian kegiatan. |
| `tindak_lanjut` | `TEXT` | NULL | Tindakan penanganan teknis / mitigasi. |
| `status` | `VARCHAR(50)` | DEFAULT `'Normal Operasi'` | Status akhir peralatan / kegiatan. |
| `teknisi` | `VARCHAR(150)` | NULL | Nama teknisi penanggung jawab dinas. |
| `foto_urls` | `JSONB` / `TEXT[]` | **CHECK (`chk_foto_urls_no_base64`)** | Array tautan URL foto HTTPS (Google Drive / Supabase Storage). Check constraint memastikan string Base64 (`data:image`) ditolak. |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Timestamp pembuatan record. |

> **Constraint Khusus**:
> ```sql
> ALTER TABLE laporan_operasional 
> ADD CONSTRAINT chk_foto_urls_no_base64 
> CHECK (foto_urls IS NULL OR foto_urls::text NOT LIKE '%data:image%');
> ```

---

### 3.13. Tabel `laporan_checklist`
Menyimpan rekapitulasi ringkasan kelaikan peralatan (*serviceability summary*) per tanggal dan shift dinas.

| Nama Kolom | Tipe Data | Kunci / Constraint | Keterangan |
|---|---|---|---|
| `id` | `UUID` / `BIGINT` | **PK** | Identifier unik laporan checklist. |
| `tanggal` | `DATE` / `VARCHAR(10)` | **UNIQUE (`tanggal, shift`)** | Tanggal checklist (YYYY-MM-DD). |
| `shift` | `VARCHAR(10)` | **UNIQUE (`tanggal, shift`)** | Shift dinas ('PS' / 'M'). |
| `summary` | `JSONB` | **NOT NULL** | Array objek ringkasan kelaikan (`[{ no, nama, total, operasi, rusak, persenOperasi, persenRusak }]`). |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Waktu penyimpanan record. |

> **Constraint Khusus**:
> ```sql
> ALTER TABLE laporan_checklist 
> ADD CONSTRAINT uq_laporan_checklist_tanggal_shift UNIQUE (tanggal, shift);
> ```
> Memungkinkan operasi **atomic upsert** (`INSERT ... ON CONFLICT (tanggal, shift) DO UPDATE SET summary = EXCLUDED.summary`) dari browser.

---

### 3.14. Supabase Storage Bucket: `dokumentasi`
Bucket penyimpanan objek publik yang digunakan sebagai fail-safe secondary tier penyimpanan foto laporan operasional.

| Parameter | Nilai | Keterangan |
|---|---|---|
| `bucket_id` | `dokumentasi` | Nama unik bucket pada Supabase Storage. |
| `public` | `true` | URL objek dapat diakses secara publik via HTTPS tanpa token jangka pendek. |
| `Format File` | `image/jpeg` | Seluruh foto dikompresi ke JPEG (maks. 1280px, kualitas 80%, ~150–250 KB) sebelum diunggah. |
| `Penamaan Berkas` | `{timestamp}_{filename}.jpg` | Menghindari konflik penamaan file antar-pengguna. |
| `RLS Policy` | `FOR ALL USING (bucket_id = 'dokumentasi')` | Mengizinkan select dan insert publik dari aplikasi frontend mobile. |

---

## 4. Struktur Payload JSONB (`master_configs`)

### 4.1. Payload `checklist_config`
```json
{
  "categories": [
    {
      "name": "X-Ray Security",
      "items": [
        { "id": "chk_xr_1", "label": "Pemeriksaan Power & Indikator LED", "defaultStatus": "OK" },
        { "id": "chk_xr_2", "label": "Pemeriksaan Conveyor Belt & Emergency Stop", "defaultStatus": "OK" }
      ]
    }
  ]
}
```

### 4.2. Payload `tip_performance_data`
```json
{
  "records": [
    {
      "id": "tip_2026_07_001",
      "bulan": "2026-07",
      "personelName": "Budi Santoso",
      "hit": 45,
      "miss": 3,
      "falseAlarm": 1,
      "totalProjection": 49,
      "scorePercentage": 91.8,
      "updatedAt": "2026-07-27T10:00:00Z"
    }
  ]
}
```

---

## 5. Penyimpanan Lokal (`localStorage` Key Schema)

| Key Name | Tipe | Deskripsi |
|---|---|---|
| `sses_admin_auth` | `Boolean` | Flag status login admin pada tab Data. |
| `sses_master_data_cache` | `Object JSON` | Cache offline master data untuk mencegah lag UI jika Supabase slow-response. |
| `sses_active_tab` | `String` | Tab UI aktif yang terakhir dibuka pengguna. |
| `sses_tip_data_draft` | `Object JSON` | Draft sementara pengisian TIP performance. |
| `sses_gdrive_script_url` | `String` | URL endpoint Google Apps Script Web App untuk unggah foto ke Google Drive. |
| `sses_checklist_summary_cache` | `Object JSON` | Cache offline ringkasan kelaikan peralatan per shift. |

