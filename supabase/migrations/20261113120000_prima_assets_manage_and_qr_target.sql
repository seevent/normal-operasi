-- Kelola peralatan Preventive dari tab Data > Peralatan Preventive (src/components/features/preventive-assets/).
--
-- 1) qr_target: isi QR code peralatan (tautan OPTIMA .../equipment/activity/{uuid}), hasil decode gambar QR di
--    Cloudinary (PRIMA/QR CODE/{TIPE}/{NO}_{Nama}). UNIQUE: satu QR hanya untuk satu peralatan, sehingga QR
--    yang tertukar/terduplikasi ditolak database. Diisi browser setelah gambar QR yang diunggah berhasil di-decode.
-- 2) updated_at: waktu perubahan terakhir oleh pengguna login, diisi trigger (bukan klien).
--    synced_at tetap berarti "terakhir disalin dari PRIMA".
-- 3) Pengguna login boleh menambah dan mengubah peralatan (bukan menghapus: riwayat preventive_photo_log
--    memakai nomor equipment; aset dinonaktifkan lewat kolom active). Nomor equipment tidak bisa diubah.

alter table public.prima_assets
  add column if not exists qr_target text,
  add column if not exists updated_at timestamptz;

alter table public.prima_assets
  add constraint prima_assets_qr_target_check check (qr_target is null or qr_target ~ '^https?://\S+$');

create unique index if not exists prima_assets_qr_target_key on public.prima_assets (qr_target);

create or replace function public.prima_assets_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Hanya perubahan oleh pengguna login yang dicatat; sinkron PRIMA (service role) tidak mengubah waktu ini.
  if auth.role() = 'authenticated' then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists prima_assets_touch on public.prima_assets;
create trigger prima_assets_touch
  before insert or update on public.prima_assets
  for each row execute function public.prima_assets_touch();

grant insert (equipment_number, name, asset_type, terminal, location_group, location_override, periods, active, qr_target)
  on public.prima_assets to authenticated;
grant update (name, asset_type, terminal, location_group, location_override, periods, active, qr_target)
  on public.prima_assets to authenticated;

drop policy if exists prima_assets_insert on public.prima_assets;
create policy prima_assets_insert on public.prima_assets
  for insert to authenticated with check (true);

-- qr_target 172 peralatan diisi sekali dari decode seluruh gambar PRIMA/QR CODE (2026-11-13: 172 berkas,
-- 172 aset, cocok 1:1, semua tautan unik). Isi ulang kapan saja lewat tombol "Periksa QR" di tab Data.
