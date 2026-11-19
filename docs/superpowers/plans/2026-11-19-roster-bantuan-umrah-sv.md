# Roster Bantuan Bagasi Umrah SV di Tab Kehadiran — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Status (19 Nov 2026, direvisi):** Rencana label-status di bawah **tidak dipakai**. Atas permintaan pengguna, status kehadiran tetap seperti semula; penugasan roster tampil sebagai bagian tersendiri `*Bantuan Umroh SV :*` + `- Nama Personel` di pesan Laporan Dinas. Roster diunggah lewat *Upload Roster Penugasan* di Data › Upload Jadwal Excel (`RosterPenugasanUploader.tsx`) dan disimpan di `master_configs` (`roster_penugasan_history`); `jadwal_shift` tidak diubah.

**Goal:** Penugasan personel T2 Safety & Security Electronic Services dari "Roster Bantuan Penanganan Bagasi Umrah Saudia (SV) – AFETS CGK" (18–27 Nov 2026) terlihat di tab Kehadiran, di pesan WA Laporan Dinas, dan di Shift Report, tanpa merusak jadwal shift reguler.

**Architecture:** Penugasan disimpan sebagai nilai `status_kehadiran` baru (`Bantuan Umrah SV`) pada baris `jadwal_shift` yang sudah ada. Tidak perlu tabel baru: setiap sel roster jatuh pada shift `M` yang sudah terjadwal (lihat Rekonsiliasi). Daftar status dan aturan "tidak hadir" dipusatkan di satu modul murni yang dipakai tab Kehadiran, Shift Report, dan `fetchOnDutyPersonnel`.

**Tech Stack:** React 19 + TypeScript, Supabase `jadwal_shift`, `node --test`.

**Sumber:** PDF roster (4 halaman, 140 personel). Hanya baris dengan Unit Department `T2 Safety & Security Electronic Services` yang diambil.

---

## Rekonsiliasi roster ↔ `jadwal_shift` (diperiksa 19 Nov 2026 lewat SQL ke project `SSES T2 Project`)

`SP` = Sore–Pagi 20:00–08:00 H+1 = shift `M` aplikasi pada tanggal yang sama. Seluruh personel berada di unit `OM/IAS T2`, jabatan `Pembantu Teknisi`.

| No roster | Personel | Tanggal | Roster | `jadwal_shift` saat ini | Cocok |
|---|---|---|---|---|---|
| 65 | Rifky Aziz | 2026-11-19 (Kam) | SP-T2 | M · Hadir | ✅ |
| 51 | Abdul Rifan Sukarno | 2026-11-21 (Sab) | SP-T2 | M · Hadir | ✅ |
| 62 | Nandio Prihardana | 2026-11-22 (Min) | SP-T2 | M · Hadir | ✅ |
| 57 | Harmin Sanjayah | 2026-11-24 (Sel) | SP-T2 | M · Hadir | ✅ |
| 51 | Abdul Rifan Sukarno | 2026-11-25 (Rab) | SP-T2 | M · Hadir | ✅ |
| 62 | Nandio Prihardana | 2026-11-26 (Kam) | SP-T2 | M · Hadir | ✅ |
| 65 | Rifky Aziz | 2026-11-27 (Jum) | SP-T2 | M · Hadir | ✅ |

Total 7 penugasan, semuanya di T2 shift malam. Tidak ada penugasan PS dan tidak ada yang jatuh di hari libur. Akibatnya kode shift reguler tidak perlu diubah, cukup status kehadirannya.

**Mendesak:** penugasan pertama (Rifky Aziz) jatuh **malam ini, 19/11**. Task 3 (data) bisa dijalankan lebih dulu, terpisah dari rilis kode. Tanpa Task 2, status ini memang belum ada di dropdown, tetapi pesan WA sudah langsung menampilkannya.

## Keputusan (default yang dipakai; ubah sebelum eksekusi bila tidak setuju)

1. **Label status:** `Bantuan Umrah SV`. Baris WA menjadi `- Rifky Aziz - Bantuan Umrah SV`. Ini memakai pola `- Nama - Status` yang sudah ada, jadi format pesan tidak berubah (agent.md §2.4).
2. **Tetap dihitung hadir.** Personel ini tetap dinas dan tetap tampil di daftar OM IASS T2 serta di Shift Report, dengan status penugasannya terlihat. Mereka tidak ditandai merah seperti Izin/Sakit.
3. **Tetap bisa dipilih sebagai teknisi on-duty** (`fetchOnDutyPersonnel`). Ini karena mereka masih bisa ditarik kembali. Bila ingin disembunyikan dari pemilih teknisi, ubah satu baris di Task 4.
4. **Tidak membuat uploader roster sekarang.** Roster tidak memuat NIK, jadi pencocokan hanya bisa lewat nama. Roster ini juga sudah memuat nama ganda (mis. "MUHAMMAD EDO ARDIANSYAH" / "M. EDO ARDIANSYAH", "ARYA P" dua kali). Untuk 7 sel, mengisi data lewat SQL yang diverifikasi lebih aman. Uploader layak dibuat bila roster serupa datang rutin (lihat Di Luar Lingkup).

## Global Constraints

- Nilai status persis: `Bantuan Umrah SV`. Huruf, spasi, dan urutannya harus sama di DB, dropdown, dan tes.
- Format `generateWA_Kehadiran` tidak boleh berubah. Hanya nilai status yang baru.
- Status yang dianggap **tidak hadir** (case-insensitive): `Izin`, `Sakit`, `Off`, `Cuti`, `Libur`. Semua status lain dianggap hadir.
- Migration data hanya mengubah baris `shift = 'M'` dengan status `Hadir`. Baris lain tidak disentuh.

## Review Focus

- Update data yang salah sasaran: SQL harus mengubah **tepat 7** baris. Bila hasilnya bukan 7, transaksi harus gagal (Task 3).
- Ketidakkonsistenan lama: `TabShiftReport` mengecualikan `Izin`, sedangkan `fetchOnDutyPersonnel` tidak. Setelah Task 4 keduanya memakai satu fungsi. Perubahan perilaku untuk `Izin` di pemilih teknisi ini harus disadari reviewer.
- Upload ulang jadwal November (hapus bulan → unggah Excel) mengembalikan semua status ke `Hadir`, sehingga penugasan hilang. Hal ini cukup didokumentasikan, tidak perlu kode (Task 5).
- Pengguna menekan "Share Kehadiran ke WA" setelah mengganti status ke `Hadir` → penugasan memang terhapus. Ini perilaku yang diharapkan, bukan bug.

---

### Task 1: Modul status kehadiran

**Files:**
- Create: `src/lib/data/kehadiranStatus.ts`
- Test: `tests/kehadiran-status.test.mjs`

**Interfaces:**
- `export const STATUS_KEHADIRAN = ['Hadir', 'Izin', 'Sakit', 'Dinas Luar', 'Bantuan Umrah SV'] as const`
- `export const STATUS_BANTUAN_UMRAH = 'Bantuan Umrah SV'`
- `export const isTidakHadir = (status: string | null | undefined): boolean`: true untuk izin/sakit/off/cuti/libur (trim, case-insensitive); `null`/`''` → false (default DB `Hadir`).
- `export const isPenugasan = (status: string | null | undefined): boolean`: true untuk `Dinas Luar` dan `Bantuan Umrah SV`.

- [ ] Tes: `isTidakHadir` → `'Sakit'`, `' izin '`, `'CUTI'`, `'Off'`, `'libur'` true; `'Hadir'`, `'Dinas Luar'`, `'Bantuan Umrah SV'`, `null`, `''` false.
- [ ] Tes: `isPenugasan('Bantuan Umrah SV') === true`, `isPenugasan('Hadir') === false`; `STATUS_KEHADIRAN` memuat `STATUS_BANTUAN_UMRAH`.
- [ ] `node --test tests/kehadiran-status.test.mjs` → gagal → implementasi → lulus → commit.

### Task 2: Tab Kehadiran memakai daftar status

**Files:**
- Modify: `src/components/features/TabKehadiran.tsx` (dua `<select>` status untuk API dan OM; kelas warna)
- Test: `tests/wa-kehadiran.test.mjs` (baru)

- [ ] Ganti 4 `<option>` statis di kedua daftar dengan `STATUS_KEHADIRAN.map(...)`.
- [ ] Warna: `isTidakHadir` → `text-rose-600 font-bold` (seperti sekarang); `isPenugasan` → `text-amber-700 font-semibold`; `Hadir` → normal. Saat ini semua non-Hadir merah, termasuk Dinas Luar.
- [ ] Tes WA: `generateWA_Kehadiran` dengan `omList: [{ name: 'Rifky Aziz', phone: '085716500615', status: 'Bantuan Umrah SV', jabatan: '' }]` menghasilkan baris `- Rifky Aziz - Bantuan Umrah SV\n     Tlp : 085716500615`; heading `*Personel OM IASS T2 :*` tidak berubah.
- [ ] `node --test` → lulus → commit.

### Task 3: Data roster ke `jadwal_shift`

**Files:**
- Create: `supabase/migrations/20261119120000_roster_bantuan_umrah_sv.sql`

```sql
-- Roster Bantuan Penanganan Bagasi Umrah SV – AFETS CGK, 18–27 Nov 2026.
-- Hanya personel unit "T2 Safety & Security Electronic Services"; SP-T2 = shift M.
do $$
declare n int;
begin
  with roster(nama, tanggal) as (values
    ('Rifky Aziz',          date '2026-11-19'),
    ('Abdul Rifan Sukarno', date '2026-11-21'),
    ('Nandio Prihardana',   date '2026-11-22'),
    ('Harmin Sanjayah',     date '2026-11-24'),
    ('Abdul Rifan Sukarno', date '2026-11-25'),
    ('Nandio Prihardana',   date '2026-11-26'),
    ('Rifky Aziz',          date '2026-11-27')
  )
  update jadwal_shift j
     set status_kehadiran = 'Bantuan Umrah SV'
    from roster r
    join personel p on lower(trim(p.nama)) = lower(r.nama)
   where j.personel_id = p.id
     and j.tanggal = r.tanggal
     and j.shift = 'M'
     and coalesce(j.status_kehadiran, 'Hadir') = 'Hadir';
  get diagnostics n = row_count;
  if n <> 7 then
    raise exception 'Roster umrah: diharapkan 7 baris, terubah %', n;
  end if;
end $$;
```

- [ ] Jalankan SELECT pra-cek (join yang sama, tanpa update) → harus 7 baris `M · Hadir`.
- [ ] Terapkan migration ke Supabase (minta persetujuan pengguna karena ini menulis ke data produksi).
- [ ] Pasca-cek: `select p.nama, j.tanggal, j.shift, j.status_kehadiran from jadwal_shift j join personel p on p.id = j.personel_id where j.status_kehadiran = 'Bantuan Umrah SV' order by j.tanggal` → 7 baris yang identik dengan tabel Rekonsiliasi.
- [ ] Commit file migration.

### Task 4: Shift Report & teknisi on-duty memakai aturan yang sama

**Files:**
- Modify: `src/components/features/TabShiftReport.tsx:214` (`hadir = data.filter(d => !isTidakHadir(d.status_kehadiran))`)
- Modify: `src/lib/services/operationalReportService.ts:233-234` (`!isTidakHadir(d.status_kehadiran)`)

- [ ] Ganti kedua filter tersebut. Personel `Bantuan Umrah SV` tetap tampil. `Izin` kini juga dikecualikan dari teknisi on-duty (perbaikan inkonsistensi).
- [ ] Bila Keputusan 3 diubah, tambahkan `&& !isPenugasan(...)` hanya di `operationalReportService.ts`.
- [ ] `node --test` → lulus → commit.

### Task 5: Dokumentasi

- [ ] `database.md` §3.10: tambahkan `Bantuan Umrah SV` ke daftar nilai `status_kehadiran`. Catat bahwa upload ulang jadwal bulanan mereset status ke `Hadir`, sehingga migration Task 3 perlu dijalankan ulang (aman: guard `= 'Hadir'` + cek 7 baris).

### Task 6: Verifikasi akhir

- [ ] `node --test` dan `npm run build` lulus.
- [ ] QA browser 375px: tab Kehadiran, tanggal 2026-11-19, Malam → Rifky Aziz di OM IASS T2 dengan status `Bantuan Umrah SV` (amber), preview WA menampilkan baris yang benar. Tanggal 2026-11-20 Malam → tidak ada status bantuan.
- [ ] Tab Shift Report 2026-11-19 shift M → Rifky Aziz tercantum.
- [ ] Konfirmasi ke pemilik sistem rekap WhatsApp eksternal bahwa nilai status baru tidak membuat parser gagal (agent.md §2.4).

## Di Luar Lingkup

- Personel unit lain di roster (T2 General Electronic, BHS, dll.) dan penugasan T3.
- Uploader roster generik (Excel/PDF) dengan pencocokan nama → NIK. Layak dibuat bila roster bantuan datang rutin. Prasyaratnya: minta file Excel asli roster dan kolom NIK dari AFETS.
