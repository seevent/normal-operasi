-- Hasil edit manual Diagram Serviceability (tab Report) disimpan terpisah dari ringkasan Checklist.
--
-- Aturan: tab Checklist memakai data checklist (laporan_checklist, ditulis saat Checklist dibagikan);
-- tab Report memakai hasil edit manual bila ada (laporan_checklist_manual), kalau belum ada
-- memakai data Checklist untuk tanggal & shift yang sama.
--
-- Sebelumnya keduanya menulis ke laporan_checklist (tanggal, shift) sehingga membagikan Checklist
-- menimpa angka yang sudah diedit manual. Tabel ini baru dan hanya menambah; tabel lama tidak diubah,
-- jadi aplikasi versi lama tetap berjalan sampai versi baru di-deploy.

create table public.laporan_checklist_manual (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  shift character varying not null,
  summary jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  constraint uq_laporan_checklist_manual_tanggal_shift unique (tanggal, shift)
);
comment on table public.laporan_checklist_manual is
  'Hasil edit manual jumlah Total/Off peralatan di Diagram Serviceability (tab Report), satu baris per tanggal & shift.';

alter table public.laporan_checklist_manual enable row level security;

-- Sama seperti laporan_checklist: tab Report dipakai tanpa login.
create policy laporan_checklist_manual_select_public on public.laporan_checklist_manual
  for select to anon, authenticated using (true);
create policy laporan_checklist_manual_insert_public on public.laporan_checklist_manual
  for insert to anon, authenticated with check (true);
create policy laporan_checklist_manual_update_public on public.laporan_checklist_manual
  for update to anon, authenticated using (true) with check (true);
