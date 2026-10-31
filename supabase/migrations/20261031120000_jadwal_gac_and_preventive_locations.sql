-- Jadwal General Annual Check (GAC) dan penamaan lokasi PM mengikuti tempat di tab Preventive.
--
-- 1. Tabel jadwal_gac: satu baris per peralatan per tanggal GAC, diisi dari tab Data
--    (Upload Jadwal GAC, sheet "JADWAL GAC"). Dibaca publik oleh Tab Kehadiran (Rencana
--    Kegiatan, semua shift); tulis hanya untuk akun login (tab Data memerlukan login admin).
-- 2. Master lokasi "Red Lane" dengan titik "No.1 Arr F" dan "No.2 Arr Umroh", agar jadwal
--    Redline bea cukai arrival terhubung ke master lokasi.
-- 3. Jadwal PM yang sudah tersimpan (mulai November 2026) dipindah ke nama lokasi baru:
--      HBSCP 2.7/2.8                -> HBSCP Umrah 2.7/2.8
--      X-Ray Conveyor Belt 15/16    -> Breakdown Umrah Belt 15/16
--      Redline Arrival F 1          -> Red Lane No.1 Arr F
--      Redline Arrival Umrah 2      -> Red Lane No.2 Arr Umroh
--      Arrival Hall F               -> Arrival F
--    Pemetaan yang sama ada di src/lib/utils/pmScheduleParser.ts (mapExcelLocationToSupabase).

-- ---------------------------------------------------------------------------------------------
-- 1. Tabel jadwal_gac
-- ---------------------------------------------------------------------------------------------
create table public.jadwal_gac (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  bulan integer not null check (bulan between 1 and 12),
  tahun integer not null,
  lokasi text not null,
  titik text not null default '-',
  jenis text not null,
  tipe text not null,
  id_lokasi uuid references public.lokasi (id) on delete set null,
  id_titik uuid references public.titik_lokasi (id) on delete set null,
  id_tipe uuid references public.tipe_peralatan (id) on delete set null,
  created_at timestamptz default now()
);

create index idx_jadwal_gac_tanggal on public.jadwal_gac (tanggal);
create index idx_jadwal_gac_period on public.jadwal_gac (tahun, bulan);

alter table public.jadwal_gac enable row level security;

create policy jadwal_gac_select_public on public.jadwal_gac
  for select using (true);
create policy jadwal_gac_insert_login on public.jadwal_gac
  for insert to authenticated with check (true);
create policy jadwal_gac_delete_login on public.jadwal_gac
  for delete to authenticated using (true);

-- ---------------------------------------------------------------------------------------------
-- 2. Master lokasi Red Lane
-- ---------------------------------------------------------------------------------------------
insert into public.lokasi (nama) values ('Red Lane')
on conflict (nama) do nothing;

insert into public.titik_lokasi (id_lokasi, nomor)
select l.id, t.nomor
from public.lokasi l
cross join (values ('No.1 Arr F'), ('No.2 Arr Umroh')) as t (nomor)
where l.nama = 'Red Lane'
on conflict (id_lokasi, nomor) do nothing;

-- ---------------------------------------------------------------------------------------------
-- 3. Jadwal PM tersimpan: ganti ke nama lokasi baru (hanya periode mulai November 2026)
-- ---------------------------------------------------------------------------------------------
with peta (lokasi_lama, titik_lama, lokasi_baru, titik_baru) as (
  values
    ('HBSCP', '2.7', 'HBSCP Umrah', '2.7'),
    ('HBSCP', '2.8', 'HBSCP Umrah', '2.8'),
    ('X-Ray Conveyor Belt', '15', 'Breakdown Umrah', 'Belt 15'),
    ('X-Ray Conveyor Belt', '16', 'Breakdown Umrah', 'Belt 16'),
    ('Redline Arrival F', '1', 'Red Lane', 'No.1 Arr F'),
    ('Redline Arrival Umrah', '2', 'Red Lane', 'No.2 Arr Umroh'),
    ('Arrival Hall F', '-', 'Arrival F', '-')
)
update public.jadwal_pm j
set lokasi = p.lokasi_baru,
    titik = p.titik_baru,
    id_lokasi = l.id,
    id_titik = t.id
from peta p
join public.lokasi l on l.nama = p.lokasi_baru
left join public.titik_lokasi t on t.id_lokasi = l.id and t.nomor = p.titik_baru
where j.lokasi = p.lokasi_lama
  and j.titik = p.titik_lama
  and (j.tahun, j.bulan) >= (2026, 11);
