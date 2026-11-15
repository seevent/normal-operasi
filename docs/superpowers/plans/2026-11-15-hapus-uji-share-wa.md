# Hapus Fitur "Uji Share WA" dan Pencatatan Share (`share_log`) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sub-tab **Uji Share WA** (tab Data) hilang, seluruh pencatatan share ke WhatsApp dicabut dari kode, dan tabel Supabase `public.share_log` di-drop total.

**Architecture:** Hapus dari luar ke dalam: UI uji → pencatatan di `shareFlow.ts`/`shareService.ts` → file `shareLogService.ts` → tabel. Perilaku share itu sendiri **tidak berubah**: Kirim tetap memanggil `navigator.share` seketika, antrean kiriman lanjutan, kirim ulang terpisah, jalan cadangan (tautan video, simpan berkas, lewati), dan pemakaian salinan MP4 bila sudah siap tetap sama. Satu-satunya bagian "sesi" yang tersisa adalah `attemptId`, karena dipakai sebagai penjaga agar hasil share lama tidak menimpa antrean share yang lebih baru. Tabel di-drop **setelah** kode baru ter-deploy.

**Tech Stack:** React + TanStack Start (Vite), TypeScript, Supabase (Postgres 17, project `mpwemvdedpihlwghdmpa` "SSES T2 Project"), tes `node --test`.

**Spec:** Permintaan pengguna 2026-11-15: "Hapus fitur uji share wa ini, hapus juga tabel atau kolom di supabasenya", lalu dipertegas: "mau tabelnya hilang total sekalian dengan pencatatan share laporan". Asal-usul fitur: `docs/superpowers/plans/2026-11-10-video-whatsapp-share.md` (dibiarkan sebagai catatan sejarah, tidak diubah).

## Keputusan

1. `public.share_log` di-drop (beserta index, policy, constraint, sequence identity-nya). Isi per 2026-11-15: 124 `laporan`, 3 `lanjutan`, 2 `uji`, 2 `catatan`. Sebelum drop, isinya diekspor ke CSV dan diserahkan ke pengguna sebagai cadangan terakhir.
2. Yang dicabut dari `shareFlow.ts`: `ShareLogEntry`, `ShareKind`, `VideoChoice`, dependensi `log`/`now`/`setTimer`, `SHARE_HANG_MS`, `convertedFiles`, `videoSourceOf`, opsi `video`/`kind`/`test`, dan field `kind`/`tab`/`mode`/`step`/`test` di `ShareSession`. Yang **tetap**: `ShareSession = { attemptId: string }`, `deps.newId`, `ShareOutcome`, mode `'gabung' | 'pisah'`, `SHARE_MODE_BY_PLATFORM`.
3. File migrasi lama `supabase/migrations/20261110120000_share_log.sql` tidak dihapus (riwayat migrasi hanya boleh ditambah). Drop masuk sebagai migrasi baru.

## Global Constraints

- Migrasi baru: `supabase/migrations/20261115120000_drop_share_log.sql`; nama `apply_migration`: `drop_share_log`.
- Signatur akhir: `startReportShare(deps, { message, groups, cheerTab?, mode? }): Promise<{ result: StartShareResult }>`.
- Nama variabel `chosen` di `startReportShare` dipertahankan: `tests/share-batches.test.mjs:126` mencocokkan teks `planShareItems(buildShareBatches(chosen), message, mode === 'pisah')`.
- `preparedVideo: getPreparedVideo` di `flowDeps` dipertahankan (`tests/prep-cache.test.mjs:85`).
- Jangan ubah `PendingShareBar.tsx`, `shareToWhatsApp`, `fallbackShare`, `shareBatches.ts`.
- Komentar dalam Bahasa Indonesia, mengikuti gaya file sekitarnya.
- Baseline tes saat ini (tanpa `node_modules`): 384 tes, 6 gagal di file yang tidak berhubungan. Jalankan `npm ci` dulu, ukur ulang baseline, dan jumlah gagal tidak boleh bertambah.

## Review Focus

1. **Share kedua dimulai saat share pertama masih menggantung** (iOS: promise `navigator.share` bisa tidak pernah selesai, lalu pengguna kirim laporan lain): hasil share lama tidak boleh menimpa antrean baru. Penjaga `attemptId` harus tetap ada → tes di Task 2.
2. **Video tetap memakai salinan MP4 bila sudah siap** setelah opsi `video` dihapus, dan berkas asli bila belum → tes di Task 2.
3. **Jalan cadangan di PendingShareBar** (tautan video, simpan berkas, lewati) tetap bekerja setelah `noteHead`/`logShareNote` dicabut → tes wiring di Task 2 + cek manual di Task 4.
4. **Tab lama yang masih terbuka setelah tabel di-drop:** JS lama masih mencoba insert ke `share_log` → galat ditelan (`console.warn`), share tetap jalan. Tidak ada service worker di repo; muat ulang halaman sudah cukup. Tetap: drop setelah deploy *ready* (Task 4).
5. **Tidak ada sisa referensi** ke `share_log`/`shareLogService` di kode, tipe, atau dokumen aktif → grep di Task 2 dan Task 3.

---

### Task 1: Cabut halaman Uji Share WA

**Files:**
- Delete: `src/components/features/ShareTestPanel.tsx`
- Modify: `src/components/features/TabData.tsx` — hapus import baris 11, entri `{ id: 'uji_share', label: 'Uji Share WA' }` baris 159 (perhatikan koma di entri `cloudinary` sebelumnya), cabang render baris 219-220.
- Modify: `src/lib/services/shareService.ts` — hapus `shareTestReport` (±baris 184-191) dan `VideoChoice` dari import baris 7.
- Test: `tests/share-flow.test.mjs:239-247`

**Interfaces:**
- Produces: tidak ada pemanggil `startReportShare` yang mengoper `kind`, `test`, atau `video` (prasyarat Task 2).

- [ ] **Step 1: Ganti tes "halaman Uji share ada di tab Data…" (baris 239-247) dengan**

```js
test('halaman Uji Share WA sudah dihapus', () => {
  assert.equal(existsSync(new URL('../src/components/features/ShareTestPanel.tsx', import.meta.url)), false);
  assert.doesNotMatch(read('src/components/features/TabData.tsx'), /ShareTestPanel|uji_share|Uji Share/);
  assert.doesNotMatch(read('src/lib/services/shareService.ts'), /shareTestReport|VideoChoice/);
});
```
Tambahkan `existsSync` ke import `node:fs` di baris 3.

- [ ] **Step 2: Jalankan, pastikan gagal** — `node --test tests/share-flow.test.mjs` → FAIL pada tes di atas.

- [ ] **Step 3: Lakukan penghapusan sesuai daftar Files.**

- [ ] **Step 4: Jalankan, pastikan lulus** — `node --test tests/share-flow.test.mjs` → PASS.

- [ ] **Step 5: Commit**

```bash
git add -A src/components/features/ShareTestPanel.tsx src/components/features/TabData.tsx src/lib/services/shareService.ts tests/share-flow.test.mjs
git commit -m "Hapus sub-tab Uji Share WA"
```

---

### Task 2: Cabut seluruh pencatatan share dari kode

**Files:**
- Delete: `src/lib/services/shareLogService.ts`
- Modify: `src/lib/utils/shareFlow.ts` — sesuai Keputusan 2. `attemptShare(deps, item)` mengembalikan `{ outcome, errorName }` tanpa mencatat apa pun. `startReportShare` membuat `session = { attemptId: deps.newId() }`, selalu memakai `deps.preparedVideo(file)` untuk video, mengembalikan `{ result }`, dan mempertahankan penjaga `if (deps.getState().session?.attemptId !== session.attemptId) return { result: 'aborted' }`. `shareNext` tidak lagi membuat/menulis `session`. Perbarui komentar kepala file (baris 2-3: "state antrean, log, unduhan" → tanpa "log").
- Modify: `src/lib/services/shareService.ts` — hapus import `shareLogService`; hapus `log`, `now`, `setTimer` dari `flowDeps`; hapus `noteHead` dan ketiga pemanggilnya (`skipPendingShare`, `sendPendingVideoLinks`, `savePendingFiles`); `shareReportWithMedia` membaca `{ result }` seperti sekarang; komentar `currentSession` jadi "Sesi share yang sedang berjalan, untuk mengabaikan hasil share lama yang sudah digantikan."; komentar `SHARE_MODE_BY_PLATFORM` jadi "Ubah hanya berdasar uji nyata di iPhone dan Android, bukan dugaan: lihat docs/superpowers/plans/2026-11-10-video-whatsapp-share.md."
- Test: `tests/share-flow.test.mjs`

**Interfaces:**
- Consumes: Task 1.
- Produces: `ShareFlowDeps` tanpa `log`, `now`, `setTimer`; `ShareSession = { attemptId: string }`; signatur `startReportShare` sesuai Global Constraints.

- [ ] **Step 1: Sesuaikan tes**
  - Helper `env()` (±baris 21-45): hapus `logs`, `timers`, dan dependensi `log`, `now`, `setTimer`; hapus `SHARE_HANG_MS` dari import baris 5.
  - Hapus tes `'log: tiap share dicatat dengan hasil, sumber video, dan tanda menggantung'` (±baris 192-212).
  - Tes wiring baris 223-228: ganti `assert.match(src, /log: logShare/)` dengan `assert.doesNotMatch(src, /shareLogService|logShare|noteHead/)`.
  - Ganti tes `'video paksa asli / wajib konversi (dipakai halaman uji)'` (±baris 122-131) dengan:

```js
test('video memakai salinan MP4 bila sudah siap, selain itu berkas asli', async () => {
  const asli = vid('IMG_3.MOV');
  const mp4 = vid('IMG_3.mp4', 'video/mp4');
  const siap = env({ prepared: new Map([[asli, mp4]]) });
  await startReportShare(siap.deps, { message: 'm', groups: [[asli]] });
  assert.deepEqual(names(siap.calls.shares[0].files), ['IMG_3.mp4']);
  const belum = env({});
  await startReportShare(belum.deps, { message: 'm', groups: [[asli]] });
  assert.deepEqual(names(belum.calls.shares[0].files), ['IMG_3.MOV']);
});
```
  - Tambah:

```js
test('hasil share lama yang baru selesai tidak menimpa antrean share baru', async () => {
  const e = env({});
  let selesaiLama;
  e.deps.nav.share = () => new Promise((r) => { selesaiLama = r; });
  const lama = startReportShare(e.deps, { message: 'lama', groups: [[img('a.jpg')], [img('b.jpg')]] });
  e.deps.nav.share = () => Promise.resolve();
  await startReportShare(e.deps, { message: 'baru', groups: [[img('c.jpg')], [img('d.jpg')]] });
  selesaiLama();
  assert.equal((await lama).result, 'aborted');
  assert.deepEqual(e.state().queue.map((i) => names(i.files)), [['d.jpg']]);
});

test('pencatatan share sudah dicabut seluruhnya', () => {
  assert.equal(existsSync(new URL('../src/lib/services/shareLogService.ts', import.meta.url)), false);
  const flow = read('src/lib/utils/shareFlow.ts');
  assert.doesNotMatch(flow, /ShareLogEntry|SHARE_HANG_MS|setTimer|VideoChoice|'uji'|deps\.log/);
});
```
(Tes penjaga `attemptId` sudah lulus dengan kode sekarang: tujuannya mengunci perilaku itu agar tidak ikut terhapus saat `session` disederhanakan.)

- [ ] **Step 2: Jalankan, pastikan gagal** — `node --test tests/share-flow.test.mjs` → FAIL pada "pencatatan share sudah dicabut seluruhnya" dan tes wiring.

- [ ] **Step 3: Ubah `shareFlow.ts`, `shareService.ts`, hapus `shareLogService.ts` sesuai daftar Files.**

- [ ] **Step 4: Pastikan tidak ada sisa referensi**

Run: `grep -rnE "share_log|shareLogService|logShare|ShareLogEntry|SHARE_HANG_MS|VideoChoice" src tests`
Expected: hanya baris di dalam tes negatif.

- [ ] **Step 5: Jalankan seluruh tes dan build**

Run: `npm ci && npm test && npm run build`
Expected: jumlah gagal ≤ baseline setelah `npm ci`; seluruh `share-*.test.mjs`, `prep-cache.test.mjs`, `pet-messages.test.mjs` PASS; build sukses.

- [ ] **Step 6: Commit**

```bash
git add -A src/lib/utils/shareFlow.ts src/lib/services/shareService.ts src/lib/services/shareLogService.ts tests/share-flow.test.mjs
git commit -m "Cabut pencatatan share ke WhatsApp (share_log) dari kode"
```

---

### Task 3: Migrasi drop tabel + dokumentasi (file saja, belum diterapkan)

**Files:**
- Create: `supabase/migrations/20261115120000_drop_share_log.sql`
- Modify: `agent.md:54` — ganti kalimat "Strategi per platform ada di `SHARE_MODE_BY_PLATFORM`; ubah hanya berdasar tabel `share_log` atau sub-tab **Uji Share WA** di tab Data, bukan dugaan." menjadi "Strategi per platform ada di `SHARE_MODE_BY_PLATFORM`; ubah hanya berdasar uji nyata di iPhone dan Android, bukan dugaan."
- Test: `tests/share-flow.test.mjs`

- [ ] **Step 1: Tes**

```js
test('migrasi menghapus tabel share_log dan dokumen tidak lagi merujuknya', () => {
  const mig = read('supabase/migrations/20261115120000_drop_share_log.sql');
  assert.match(mig, /drop table if exists public\.share_log;/);
  assert.doesNotMatch(read('agent.md'), /share_log|Uji Share WA/);
});
```

- [ ] **Step 2: Jalankan, pastikan gagal** — FAIL (file belum ada).

- [ ] **Step 3: Tulis migrasi (isi persis)**

```sql
-- Fitur Uji Share WA dan pencatatan share ke WhatsApp dihapus (lihat
-- docs/superpowers/plans/2026-11-15-hapus-uji-share-wa.md). Index, policy, dan constraint ikut terhapus.
drop table if exists public.share_log;
```

- [ ] **Step 4: Edit `agent.md`, jalankan tes** — PASS. `database.md`, `README.md`, `architecture.md` tidak memuat `share_log`, jadi tidak diubah.

- [ ] **Step 5: Commit & push**

```bash
git add supabase/migrations/20261115120000_drop_share_log.sql agent.md tests/share-flow.test.mjs
git commit -m "Migrasi: drop tabel share_log"
git push -u origin claude/eager-keller-foijkk
```

---

### Task 4: Deploy, cadangkan, lalu drop tabel di DB live

Tidak ada kode baru; task ini berisi tindakan yang tidak bisa dibatalkan.

- [ ] **Step 1: Kode Task 1-3 sudah di branch produksi dan deploy Netlify `normal-operasi` berstatus *ready*.** Cek di HP: tab Data tidak lagi punya "Uji Share WA"; kirim satu laporan dengan 1 foto + 1 video dan pastikan menu share WhatsApp terbuka seketika serta tombol PendingShareBar (lewati / simpan berkas / tautan video) masih bekerja.

- [ ] **Step 2: Pastikan tidak ada objek lain yang bergantung pada tabel**

```sql
select v.oid::regclass from pg_depend d join pg_rewrite r on r.oid = d.objid join pg_class v on v.oid = r.ev_class
where d.refobjid = 'public.share_log'::regclass and v.oid <> 'public.share_log'::regclass;
select p.proname from pg_proc p where prosrc ilike '%share_log%';
```
Expected: kedua query 0 baris (per 2026-11-15 tidak ada view yang bergantung). Bila ada, berhenti dan laporkan.

- [ ] **Step 3: Cadangan** — `select * from public.share_log order by id;` lalu simpan sebagai CSV di folder scratchpad dan kirim ke pengguna. Catat jumlah baris per `kind`.

- [ ] **Step 4: Minta konfirmasi eksplisit pengguna**, lalu terapkan via Supabase MCP `apply_migration` (project `mpwemvdedpihlwghdmpa`, name `drop_share_log`, query = isi file Task 3).

- [ ] **Step 5: Verifikasi**

```sql
select to_regclass('public.share_log');
select count(*) from pg_policies where tablename = 'share_log';
```
Expected: `null` dan `0`. Jalankan `get_advisors` (security) dan pastikan tidak ada peringatan baru. Muat ulang aplikasi di HP, kirim satu laporan lagi, dan pastikan console tidak menampilkan `share_log tidak tercatat`.
