# Hapus Fitur "Uji Share WA" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sub-tab **Uji Share WA** (tab Data) hilang dari aplikasi beserta semua kode yang hanya dipakai olehnya, dan tabel Supabase `share_log` dibersihkan dari baris, kolom, nilai, dan policy yang hanya melayani fitur itu.

**Architecture:** Hapus dari luar ke dalam: UI → service → inti `shareFlow.ts` → skema database. Pencatatan share produksi (`logShare` dari `shareReportWithMedia`, 124 baris `laporan` di DB per 2026-11-15) **tetap jalan**: `share_log` tidak di-drop, hanya bagian uji yang dibuang. Migrasi DB dijalankan **setelah** kode baru ter-deploy di Netlify, agar tab yang masih terbuka dengan JS lama tidak gagal mencatat karena kolom `test` sudah hilang.

**Tech Stack:** React + TanStack Start (Vite), TypeScript, Supabase (Postgres 17, project `mpwemvdedpihlwghdmpa` "SSES T2 Project"), tes `node --test`.

**Spec:** Permintaan pengguna 2026-11-15: "Hapus fitur uji share wa ini, hapus juga tabel atau kolom di supabasenya." Asal-usul fitur: `docs/superpowers/plans/2026-11-10-video-whatsapp-share.md` (dibiarkan sebagai catatan sejarah, tidak diubah).

## Keputusan yang sudah diambil (ubah di sini bila pengguna tidak setuju)

1. **`share_log` dipertahankan, tidak di-drop.** Tabel ini juga dipakai pencatatan share produksi dan `agent.md` menjadikannya dasar keputusan strategi share. Yang dihapus: baris uji, kolom `test`, nilai `'uji'` di cek `kind`, dan policy `share_log_select_login` (satu-satunya pembacanya adalah panel uji; setelah ini data dibaca lewat Supabase dashboard / SQL).
   *Alternatif bila pengguna mau semuanya hilang:* `drop table public.share_log` + hapus `shareLogService.ts` + cabut `log`/`logShareNote` dari `shareService.ts`. Itu rencana lain, tidak dibahas di sini.
2. **Opsi khusus uji di `shareFlow.ts` ikut dihapus** (`ShareKind 'uji'`, field `test`, tipe `VideoChoice` + opsi `video`). Mode `'pisah'` **tetap**, karena itu strategi produksi yang bisa dipilih lewat `SHARE_MODE_BY_PLATFORM` dan punya tes sendiri.
3. File migrasi lama `supabase/migrations/20261110120000_share_log.sql` **tidak** dihapus/diubah (riwayat migrasi hanya boleh ditambah). Perubahan masuk sebagai migrasi baru.

## Global Constraints

- Nama migrasi baru: `supabase/migrations/20261115120000_share_log_hapus_uji.sql`; nama `apply_migration`: `share_log_hapus_uji`.
- Nilai `kind` yang tersisa persis: `'laporan', 'lanjutan', 'catatan'`.
- Catatan (`logShareNote`) yang tersisa persis: `'tautan' | 'disimpan' | 'dilewati'`.
- Komentar & teks baru dalam Bahasa Indonesia, mengikuti gaya file sekitarnya.
- Jangan sentuh `PendingShareBar.tsx`, `SHARE_MODE_BY_PLATFORM`, atau alur `shareReportWithMedia` selain yang disebut di task.
- Baseline tes sebelum mulai (tanpa `node_modules`): 384 tes, 6 gagal di file yang tidak berhubungan (`ba-shift-calculation`, `gac-schedule`, html2canvas, `pm-schedule-kehadiran`, `serviceability-chart`, `shift-report-export`). Jalankan `npm ci` dulu; setelah itu baseline harus diukur ulang dan tidak boleh bertambah gagal.

## Review Focus

1. **Tab lama yang masih terbuka setelah migrasi:** JS lama mengirim `test: null` di setiap insert → PostgREST menolak (`column "test" does not exist`). Share harus tetap jalan (pencatatan tidak ditunggu & tidak melempar). Pencegahan: Task 4 baru boleh dijalankan setelah deploy Netlify berstatus *ready*. Tidak ada service worker di repo, jadi muat ulang halaman sudah cukup.
2. **Pencatatan produksi tidak boleh ikut mati:** baris `laporan`/`lanjutan`/`catatan` tetap masuk, tanpa key `test`. Dipaku oleh tes di Task 2 dan verifikasi SQL di Task 4.
3. **Kiriman lanjutan dari antrean** harus tercatat `kind: 'lanjutan'` (dulu ada cabang `'uji'`). Dipaku oleh tes di Task 2.
4. **Video produksi tetap memakai salinan MP4 bila sudah siap** setelah opsi `video` dihapus. Dipaku oleh tes di Task 2 (separuh `'siap'` dari tes lama dipertahankan).
5. **Insert `kind = 'uji'` ditolak DB** setelah migrasi, dan anon tidak bisa membaca `share_log`. Dipaku oleh verifikasi SQL di Task 4.

---

### Task 1: Cabut UI dan service khusus uji

**Files:**
- Delete: `src/components/features/ShareTestPanel.tsx`
- Modify: `src/components/features/TabData.tsx:11` (import), `:159` (entri `{ id: 'uji_share', label: 'Uji Share WA' }`), `:219-220` (cabang render)
- Modify: `src/lib/services/shareService.ts` — hapus `shareTestReport` (±baris 184-191) dan `VideoChoice` dari import baris 7; `noteHead` memanggil `logShareNote(currentSession.attemptId, note)` tanpa argumen ketiga; komentar `SHARE_MODE_BY_PLATFORM` (baris 101-105) diganti menjadi "Ubah hanya berdasar tabel share_log (baca lewat Supabase dashboard), bukan dugaan: …".
- Modify: `src/lib/services/shareLogService.ts` — hapus `ShareLogRow`, `logShareAnswer`, `fetchShareLog`; `logShareNote(attemptId: string, note: 'tautan' | 'disimpan' | 'dilewati'): void` tanpa parameter `test` dan tanpa key `test` di payload; hapus `test: e.test ?? null` dari `logShare`; perbarui komentar JSDoc yang menyebut "halaman uji".
- Test: `tests/share-flow.test.mjs:239-247`

**Interfaces:**
- Produces: `shareService.ts` tidak lagi mengimpor `VideoChoice`, dan tidak ada pemanggil yang mengoper `kind`, `test`, atau `video` ke `startReportShare` (prasyarat Task 2).

- [ ] **Step 1: Ganti tes "halaman Uji share ada…" (baris 239-247) dengan tes negatif**

```js
test('fitur Uji Share WA sudah dihapus dari aplikasi', () => {
  assert.equal(existsSync(new URL('../src/components/features/ShareTestPanel.tsx', import.meta.url)), false);
  const tabData = read('src/components/features/TabData.tsx');
  assert.doesNotMatch(tabData, /ShareTestPanel|uji_share|Uji Share/);
  const service = read('src/lib/services/shareService.ts');
  assert.doesNotMatch(service, /shareTestReport|VideoChoice/);
  const logSvc = read('src/lib/services/shareLogService.ts');
  assert.doesNotMatch(logSvc, /logShareAnswer|fetchShareLog|ShareLogRow|sampai_ya|sampai_tidak|\btest\b/);
  assert.match(logSvc, /export const logShare =/);
  assert.match(logSvc, /export const logShareNote =/);
});
```
Tambahkan `existsSync` ke import `node:fs` di baris 3.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `node --test tests/share-flow.test.mjs`
Expected: FAIL pada "fitur Uji Share WA sudah dihapus dari aplikasi".

- [ ] **Step 3: Lakukan penghapusan sesuai daftar Files di atas**

- [ ] **Step 4: Pastikan tidak ada sisa referensi**

Run: `grep -rnE "ShareTestPanel|shareTestReport|logShareAnswer|fetchShareLog|ShareLogRow|uji_share|Uji Share" src tests`
Expected: hanya baris di tes negatif Step 1.

- [ ] **Step 5: Jalankan tes share, pastikan lulus**

Run: `node --test tests/share-flow.test.mjs tests/share-batches.test.mjs tests/share-report.test.mjs tests/prep-cache.test.mjs tests/pet-messages.test.mjs`
Expected: semua PASS.

- [ ] **Step 6: Commit**

```bash
git add -A src/components/features/ShareTestPanel.tsx src/components/features/TabData.tsx src/lib/services/shareService.ts src/lib/services/shareLogService.ts tests/share-flow.test.mjs
git commit -m "Hapus sub-tab Uji Share WA beserta service khususnya"
```

---

### Task 2: Sempitkan `shareFlow.ts` ke kebutuhan produksi

**Files:**
- Modify: `src/lib/utils/shareFlow.ts` — `ShareKind = 'laporan' | 'lanjutan'`; hapus `VideoChoice` (baris 17-18); hapus field `test` dari `ShareSession`, `ShareLogEntry`, `StartShareOptions`; hapus `video` dan `kind` dari `StartShareOptions`; `startReportShare` selalu memakai `deps.preparedVideo(file)` untuk video (perilaku `'siap'` yang lama) dan `kind: 'laporan'`; `shareNext` selalu `kind: 'lanjutan'`; hapus `test: session.test` di `attemptShare`.
- Test: `tests/share-flow.test.mjs:122-131` dan tes baru.

**Interfaces:**
- Consumes: Task 1 (tidak ada pemanggil yang memakai `video`/`kind`/`test`).
- Produces: `startReportShare(deps, { message, groups, cheerTab?, mode? })` — signatur final; `ShareLogEntry` tanpa `test`.

- [ ] **Step 1: Ubah tes "video paksa asli / wajib konversi (dipakai halaman uji)" menjadi**

```js
test('video memakai salinan MP4 bila sudah siap, selain itu berkas asli', async () => {
  const asli = vid('IMG_3.MOV');
  const mp4 = vid('IMG_3.mp4', 'video/mp4');
  const b = env({ prepared: new Map([[asli, mp4]]) });
  await startReportShare(b.deps, { message: 'm', groups: [[asli]] });
  assert.deepEqual(names(b.calls.shares[0].files), ['IMG_3.mp4']);
  const c = env({});
  await startReportShare(c.deps, { message: 'm', groups: [[asli]] });
  assert.deepEqual(names(c.calls.shares[0].files), ['IMG_3.MOV']);
});
```

- [ ] **Step 2: Tambah tes kind & bentuk entri log**

```js
test('catatan share: laporan lalu lanjutan, tanpa field uji', async () => {
  const e = env({});
  await startReportShare(e.deps, { message: 'laporan', groups: [[img('k1.jpg')], [img('k2.jpg')]] });
  await shareNext(e.deps);
  assert.deepEqual(e.calls.logs.map((l) => l.kind), ['laporan', 'lanjutan']);
  for (const l of e.calls.logs) assert.equal('test' in l, false);
});
test('shareFlow tidak lagi mengenal mode uji', () => {
  const src = read('src/lib/utils/shareFlow.ts');
  assert.doesNotMatch(src, /'uji'|VideoChoice|\btest\?:/);
});
```
(Sesuaikan nama helper `env`/`img`/`shareNext` dengan yang sudah diimpor di bagian atas file; `shareNext` diekspor dari `shareFlow.ts`.)

- [ ] **Step 3: Jalankan, pastikan tes baru gagal**

Run: `node --test tests/share-flow.test.mjs`
Expected: FAIL pada "shareFlow tidak lagi mengenal mode uji" (dan `'test' in l` bila `test: undefined` masih ditulis).

- [ ] **Step 4: Ubah `shareFlow.ts` sesuai daftar Files**

- [ ] **Step 5: Jalankan seluruh tes dan build**

Run: `npm ci && npm test && npm run build`
Expected: jumlah gagal tidak melebihi baseline yang diukur setelah `npm ci` (lihat Global Constraints); build sukses tanpa galat TypeScript dari `shareFlow`/`shareService`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/utils/shareFlow.ts tests/share-flow.test.mjs
git commit -m "shareFlow: buang opsi khusus halaman uji (kind uji, test, VideoChoice)"
```

---

### Task 3: Migrasi `share_log` + dokumentasi (file saja, belum diterapkan)

**Files:**
- Create: `supabase/migrations/20261115120000_share_log_hapus_uji.sql`
- Modify: `agent.md:54` — ganti "ubah hanya berdasar tabel `share_log` atau sub-tab **Uji Share WA** di tab Data, bukan dugaan" menjadi "ubah hanya berdasar tabel `share_log` (dibaca lewat Supabase dashboard / SQL), bukan dugaan".
- Test: `tests/share-flow.test.mjs`

- [ ] **Step 1: Tes migrasi**

```js
test('migrasi share_log membuang bagian uji', () => {
  const mig = read('supabase/migrations/20261115120000_share_log_hapus_uji.sql');
  assert.match(mig, /delete from public\.share_log where kind = 'uji' or test is not null/);
  assert.match(mig, /check \(kind in \('laporan', 'lanjutan', 'catatan'\)\)/);
  assert.match(mig, /drop column test/);
  assert.match(mig, /drop policy share_log_select_login/);
  assert.doesNotMatch(read('agent.md'), /Uji Share WA/);
});
```

- [ ] **Step 2: Jalankan, pastikan gagal** — `node --test tests/share-flow.test.mjs` → FAIL (file belum ada).

- [ ] **Step 3: Tulis migrasi (isi persis, nama constraint diambil dari DB live)**

```sql
-- Fitur Uji Share WA (tab Data) dihapus. share_log tetap dipakai pencatatan share produksi;
-- yang dibuang hanya baris, kolom, nilai, dan policy baca yang khusus melayani halaman uji.
begin;
delete from public.share_log where kind = 'uji' or test is not null;
alter table public.share_log drop constraint share_log_kind_check;
alter table public.share_log add constraint share_log_kind_check check (kind in ('laporan', 'lanjutan', 'catatan'));
alter table public.share_log drop column test; -- ikut menghapus share_log_test_check
drop policy share_log_select_login on public.share_log;
commit;
```

- [ ] **Step 4: Edit `agent.md`, jalankan tes (`database.md` tidak memuat `share_log`, jadi tidak diubah)** — PASS.

- [ ] **Step 5: Commit & push**

```bash
git add supabase/migrations/20261115120000_share_log_hapus_uji.sql agent.md tests/share-flow.test.mjs
git commit -m "Migrasi share_log: buang baris, kolom, dan policy fitur Uji Share WA"
git push -u origin claude/eager-keller-foijkk
```

---

### Task 4: Deploy, lalu terapkan migrasi ke DB live

Tidak ada kode baru; task ini menunggu keputusan & tindakan yang tidak bisa dibatalkan.

- [ ] **Step 1: Pastikan kode Task 1-3 sudah di branch produksi dan deploy Netlify `normal-operasi` berstatus *ready*.** Cek di HP: tab Data tidak lagi menampilkan "Uji Share WA".

- [ ] **Step 2: Snapshot sebelum hapus (bukti & cadangan 4 baris uji)**

```sql
select kind, count(*), count(test) from public.share_log group by kind order by kind;
select * from public.share_log where kind = 'uji' or test is not null;
```
Expected per 2026-11-15: `catatan 2/2`, `lanjutan 3/0`, `laporan 124/0`, `uji 2/2` (angka laporan bisa sudah bertambah). Simpan output baris uji di catatan PR.

- [ ] **Step 3: Minta konfirmasi eksplisit pengguna**, lalu terapkan via Supabase MCP `apply_migration` (project `mpwemvdedpihlwghdmpa`, name `share_log_hapus_uji`, query = isi file Task 3 tanpa `begin;`/`commit;`, karena `apply_migration` sudah berjalan dalam transaksi).

- [ ] **Step 4: Verifikasi skema**

```sql
select column_name from information_schema.columns where table_schema='public' and table_name='share_log' and column_name='test';
select pg_get_constraintdef(oid) from pg_constraint where conname='share_log_kind_check';
select policyname from pg_policies where tablename='share_log';
select kind, count(*) from public.share_log group by kind order by kind;
```
Expected: kolom `test` tidak ada (0 baris); cek berisi `'laporan','lanjutan','catatan'`; policy hanya `share_log_insert_public`; tidak ada baris `uji`, jumlah `laporan`/`lanjutan` sama dengan Step 2.

- [ ] **Step 5: Verifikasi perilaku** — kirim satu laporan sungguhan (mis. tab Perbaikan + 1 foto) dari HP, lalu:

```sql
select kind, outcome, created_at from public.share_log order by id desc limit 3;
```
Expected: baris `laporan` baru dengan `outcome = 'resolved'` (atau `aborted` bila share dibatalkan). Uji negatif: `insert into public.share_log (attempt_id, kind, outcome) values ('cek','uji','x');` → galat `share_log_kind_check`.

- [ ] **Step 6: Jalankan Supabase advisors** (`get_advisors` security) dan pastikan tidak ada peringatan baru untuk `share_log`.
