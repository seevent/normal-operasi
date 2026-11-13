-- Kelola peralatan Preventive dari tab Data > Peralatan Preventive (src/components/features/preventive-assets/).
--
-- 1) qr_target: isi QR code peralatan (tautan OPTIMA .../equipment/activity/{uuid}), hasil decode gambar QR di
--    Cloudinary (PRIMA/QR CODE/{TIPE}/{NO}_{Nama}). UNIQUE: satu QR hanya untuk satu peralatan, sehingga QR
--    yang tertukar/terduplikasi ditolak database. Diisi browser setelah gambar QR yang diunggah berhasil di-decode.
-- 2) Pengguna login boleh menambah dan mengubah peralatan (bukan menghapus: riwayat preventive_photo_log
--    memakai nomor equipment; aset dinonaktifkan lewat kolom active). Nomor equipment tidak bisa diubah.

alter table public.prima_assets
  add column if not exists qr_target text;

alter table public.prima_assets
  add constraint prima_assets_qr_target_check check (qr_target is null or qr_target ~ '^https?://\S+$');

create unique index if not exists prima_assets_qr_target_key on public.prima_assets (qr_target);

grant insert (equipment_number, name, asset_type, terminal, location_group, location_override, periods, active, qr_target)
  on public.prima_assets to authenticated;
grant update (name, asset_type, terminal, location_group, location_override, periods, active, qr_target)
  on public.prima_assets to authenticated;

drop policy if exists prima_assets_insert on public.prima_assets;
create policy prima_assets_insert on public.prima_assets
  for insert to authenticated with check (true);

-- qr_target 172 peralatan diisi sekali dari decode seluruh gambar PRIMA/QR CODE (2026-11-13: 172 berkas,
-- 172 aset, cocok 1:1, semua tautan unik). Isi ulang kapan saja lewat tombol "Periksa QR" di tab Data.
