# Config TIP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Di tab Data › Config TIP, pengguna mencentang X-Ray (dari master Checklist) yang tampil di tab TIP.

**Architecture:** Fungsi murni menurunkan daftar unit TIP dari master Checklist dan menyaringnya dengan daftar
kunci tersembunyi (`master_tip_hidden` di `master_configs`, dimuat lewat `useMasterDataStore`). Tab TIP dan
komponen Config TIP memakai fungsi yang sama.

**Tech Stack:** React 19 + TypeScript, Zustand (`useMasterDataStore`), Supabase `master_configs`, `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-15-config-tip-design.md`

## Global Constraints

- Kunci unit = `<id lokasi>-<label>`; id lokasi = judul lokasi huruf kecil, spasi → `_`; label = teks dalam kurung, tanpa kurung = `No1` (aturan lama, jangan diubah).
- Kunci konfigurasi: `master_tip_hidden`, nilai: larik string kunci unit yang disembunyikan. Default: `[]` (semua tampil).
- Nama sub-tab: `Config TIP` (menggantikan `Data TIP Tersimpan`); daftar peralatan di atas, daftar data TIP tersimpan di bawah.
- Riwayat `tip_data_<Bulan>_<Tahun>` tidak diubah.

## Review Focus

- Kunci tersembunyi yang unitnya sudah tidak ada di Checklist → diabaikan, ringkasan hanya menghitung unit yang ada (Task 1 test).
- Dua item tanpa kurung di satu lokasi menghasilkan kunci sama → satu baris saja, bukan dua baris dengan kunci kembar (Task 1 test).
- Semua unit disembunyikan → tab TIP menampilkan 0 / 0 tanpa `NaN%` (Task 1 test `tipProgressPercent`).
- Gagal menyimpan di Config TIP → pesan gagal terlihat dan centang kembali ke keadaan tersimpan (Task 3, QA browser).
- Master Checklist rusak/belum termuat (blok tanpa `categories`) → daftar kosong, tidak error (Task 1 test).

---

### Task 1: Fungsi daftar TIP

**Files:**
- Create: `src/lib/utils/tipEquipment.ts`
- Test: `tests/tip-config.test.mjs`

**Interfaces:**
- Produces:
  - `interface TipUnit { key: string; label: string; name: string }`
  - `interface TipLocation { id: string; name: string; units: TipUnit[] }`
  - `buildTipLocations(checklistMaster: unknown): TipLocation[]` — blok `location` dan `group.locations[]`, kategori yang `summaryKey`-nya memuat `X-RAY`; unit berkunci sama dalam satu lokasi hanya sekali.
  - `visibleTipCategories(locations: TipLocation[], hiddenKeys: readonly string[]): { id: string; name: string; items: string[] }[]` — bentuk yang dipakai tab TIP; lokasi tanpa unit tampil dibuang.
  - `countCheckedVisible(tipData: Record<string, { checked?: boolean }>, categories: { id: string; items: string[] }[]): number`
  - `tipProgressPercent(checked: number, total: number): number` — 0 bila total 0.

- [ ] Tes: `buildTipLocations` pada contoh master (PSCP D 2 unit `(No1)`,`(No2)`; group berisi HBSCP `(1.1)`; SSCP E satu item tanpa kurung) menghasilkan kunci `pscp_d-No1`, `pscp_d-No2`, `hbscp-1.1`, `sscp_e-No1` dan nama lengkap item; item kembar tanpa kurung → satu unit; input `null`, `[{type:'location'}]` → `[]`.
- [ ] Tes: `visibleTipCategories(locs, ['pscp_d-No2','tidak-ada'])` → PSCP D hanya `['No1']`; menyembunyikan semua unit sebuah lokasi membuang lokasinya.
- [ ] Tes: `countCheckedVisible` mengabaikan kunci tercentang yang tersembunyi; `tipProgressPercent(0,0) === 0`, `(19,38) === 50`.
- [ ] Jalankan `node --test tests/tip-config.test.mjs` → gagal (modul belum ada); implementasi; jalankan → lulus; commit.

### Task 2: Store + tab TIP

**Files:**
- Modify: `src/store/useMasterDataStore.ts` (tambah `tipHiddenKeys`, `setTipHiddenKeys`, case `master_tip_hidden`; hapus `tipLeftCol`/`tipRightCol`, case `master_tip_left/right`)
- Modify: `src/lib/data/masterData.ts` (hapus `DEFAULT_TIP_LEFT_COL`/`DEFAULT_TIP_RIGHT_COL`)
- Modify: `src/components/features/TabTip.tsx`
- Test: `tests/tip-config.test.mjs`

**Interfaces:**
- Consumes: Task 1.
- Produces: `tipHiddenKeys: string[]`; `setTipHiddenKeys(keys: string[]): Promise<boolean>` (set state lalu `saveConfigToSupabase('master_tip_hidden', keys)`, kembalikan hasil simpan).

- [ ] Tes susunan: `TabTip.tsx` memakai `buildTipLocations`, `visibleTipCategories(…, tipHiddenKeys)`, `countCheckedVisible`, `tipProgressPercent`; store memuat `case 'master_tip_hidden'`; tidak ada lagi `tipLeftCol:`/`DEFAULT_TIP_LEFT_COL` di store/masterData.
- [ ] Ubah TabTip: `tipCategories = visibleTipCategories(buildTipLocations(checklistDataMaster), tipHiddenKeys)`; penghitung, persen, dan "pilih semua" memakai fungsi Task 1.
- [ ] `npm test`, `npx tsc --noEmit -p .` lulus; commit.

### Task 3: Sub-tab Config TIP

**Files:**
- Create: `src/components/features/tip-config/TipEquipmentConfig.tsx`
- Modify: `src/components/features/TabData.tsx` (label `Config TIP`; render `<TipEquipmentConfig />` lalu `<TipDataManager />`)
- Test: `tests/tip-config.test.mjs`

**Interfaces:**
- Consumes: Task 1 `buildTipLocations`; Task 2 `tipHiddenKeys`, `setTipHiddenKeys`.

- [ ] Tes susunan: label `'Config TIP'` ada dan `'Data TIP Tersimpan'` tidak; di cabang `tip_data_manager`, `<TipEquipmentConfig />` muncul sebelum `<TipDataManager />`.
- [ ] Komponen: ringkasan "`x` dari `n` tampil di tab TIP"; per lokasi judul + "`x` dari `n`" + tombol `Semua`/`Kosongkan`; per unit kotak centang (label tebal + nama lengkap). Setiap perubahan: perbarui state lewat `setTipHiddenKeys`, tampilkan `Menyimpan…` → `Tersimpan` / `Gagal menyimpan`; bila gagal, kembalikan ke daftar sebelumnya. Kunci tersembunyi yang tidak dikenal dipertahankan saat menyimpan (tidak dibuang diam-diam).
- [ ] QA browser (server tiruan): sembunyikan BREAKDOWN → tab TIP tanpa BREAKDOWN dan penghitung `/ 38`; centang lagi → kembali; simulasi gagal simpan → pesan gagal dan centang kembali.
- [ ] `npm test`, lint, `tsc`, build lulus; dokumentasi `database.md` (kunci `master_tip_hidden`); commit & push.
