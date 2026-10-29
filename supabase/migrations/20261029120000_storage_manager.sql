-- Manajemen penyimpanan laporan (tab Data › Cloudinary CDN › Penyimpanan).
-- Rencana: docs/superpowers/plans/2026-10-29-cloudinary-storage-management.md
--
-- Aturan yang ditetapkan pengguna:
--   * Hapus laporan hanya untuk akun yang login.
--   * Laporan disimpan minimal 12 bulan; hapus per rentang hanya untuk laporan yang lebih tua.
--   * Laporan yang dihapus masuk Sampah 7 hari (bisa dipulihkan), lalu dikosongkan otomatis:
--     baris dihapus permanen, foto/video yang tidak dipakai laporan lain dihapus dari Cloudinary/Storage.

-- ---------------------------------------------------------------------------------------------
-- 1. Hapus hanya untuk akun login (sebelumnya terbuka untuk anon).
-- ---------------------------------------------------------------------------------------------
drop policy if exists laporan_operasional_delete_public on public.laporan_operasional;
create policy laporan_operasional_delete_authenticated on public.laporan_operasional
  for delete to authenticated using (true);

drop policy if exists laporan_checklist_delete_public on public.laporan_checklist;
create policy laporan_checklist_delete_authenticated on public.laporan_checklist
  for delete to authenticated using (true);

-- ---------------------------------------------------------------------------------------------
-- 2. Tabel job, item media, dan Sampah.
-- ---------------------------------------------------------------------------------------------
create table public.storage_cleanup_jobs (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('rentang', 'satuan')),
  range_from date,
  range_to date,
  jenis text[],
  row_count integer not null default 0,
  status text not null default 'sampah'
    check (status in ('sampah', 'dipulihkan', 'mengosongkan', 'sebagian', 'dikosongkan')),
  created_at timestamptz not null default now(),
  created_by uuid,
  created_by_email text,
  purge_after timestamptz not null default now() + interval '7 days',
  restored_at timestamptz,
  purged_at timestamptz,
  media_total integer,
  media_deleted integer,
  media_kept integer,
  media_missing integer,
  media_failed integer
);
comment on table public.storage_cleanup_jobs is
  'Satu baris per penghapusan laporan (per rentang atau satuan dari Shift Report). Ditulis hanya lewat fungsi.';

create table public.laporan_operasional_sampah (like public.laporan_operasional including defaults);
alter table public.laporan_operasional_sampah
  add primary key (id),
  add column deleted_at timestamptz not null default now(),
  add column deleted_by uuid,
  add column deleted_by_email text,
  add column job_id uuid not null references public.storage_cleanup_jobs (id) on delete cascade;
create index laporan_operasional_sampah_job_idx on public.laporan_operasional_sampah (job_id);
comment on table public.laporan_operasional_sampah is
  'Laporan yang dihapus, disimpan 7 hari agar bisa dipulihkan. Ditulis hanya lewat fungsi.';

create table public.storage_cleanup_items (
  job_id uuid not null references public.storage_cleanup_jobs (id) on delete cascade,
  url text not null,
  status text not null default 'menunggu'
    check (status in ('menunggu', 'dihapus', 'dipakai_laporan_lain', 'tidak_ada', 'gagal', 'dilewati')),
  error text,
  updated_at timestamptz not null default now(),
  primary key (job_id, url)
);
comment on table public.storage_cleanup_items is
  'Status penghapusan tiap foto/video milik job pengosongan Sampah.';

alter table public.storage_cleanup_jobs enable row level security;
alter table public.laporan_operasional_sampah enable row level security;
alter table public.storage_cleanup_items enable row level security;

create policy storage_cleanup_jobs_select_authenticated on public.storage_cleanup_jobs
  for select to authenticated using (true);
create policy laporan_operasional_sampah_select_authenticated on public.laporan_operasional_sampah
  for select to authenticated using (true);
create policy storage_cleanup_items_select_authenticated on public.storage_cleanup_items
  for select to authenticated using (true);

-- ---------------------------------------------------------------------------------------------
-- 3. Pembantu.
-- ---------------------------------------------------------------------------------------------

-- Laporan dengan tanggal <= nilai ini sudah boleh dihapus per rentang (lebih tua dari 12 bulan).
create or replace function public.report_retention_cutoff()
returns date
language sql
stable
set search_path = public
as $$
  select ((now() at time zone 'Asia/Jakarta')::date - interval '12 months')::date - 1;
$$;

-- Semua URL media yang masih dirujuk laporan aktif, laporan di Sampah, atau log Preventive.
create or replace function public.referenced_media_urls(p_exclude_job uuid default null)
returns table (url text)
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_array_elements_text(foto_urls) from laporan_operasional where jsonb_typeof(foto_urls) = 'array'
  union
  select jsonb_array_elements_text(foto_urls) from laporan_operasional_sampah
   where jsonb_typeof(foto_urls) = 'array' and (p_exclude_job is null or job_id <> p_exclude_job)
  union
  select secure_url from preventive_photo_log where secure_url is not null;
$$;
revoke all on function public.referenced_media_urls(uuid) from public, anon, authenticated;

create or replace function public.require_login()
returns uuid
language plpgsql
stable
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Hapus laporan hanya untuk akun yang login (masuk lewat tab Data).' using errcode = '42501';
  end if;
  return auth.uid();
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 4. Fungsi untuk akun login (dipanggil dari browser).
-- ---------------------------------------------------------------------------------------------

-- Pratinjau rentang: hanya membaca.
create or replace function public.preview_report_range(p_from date, p_to date, p_jenis text[] default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, storage
as $$
declare
  v_cutoff date := report_retention_cutoff();
  v_result jsonb;
begin
  perform require_login();
  if p_from is null or p_to is null or p_from > p_to then
    raise exception 'Rentang tanggal tidak valid.' using errcode = '22023';
  end if;

  with sel as (
    select * from laporan_operasional
     where tanggal between p_from and p_to and (p_jenis is null or jenis = any (p_jenis))
  ),
  urls as (
    select distinct jsonb_array_elements_text(foto_urls) as url from sel where jsonb_typeof(foto_urls) = 'array'
  ),
  outside as (
    select jsonb_array_elements_text(foto_urls) as url from laporan_operasional
     where jsonb_typeof(foto_urls) = 'array' and id not in (select id from sel)
    union
    select jsonb_array_elements_text(foto_urls) from laporan_operasional_sampah where jsonb_typeof(foto_urls) = 'array'
    union
    select secure_url from preventive_photo_log
  )
  select jsonb_build_object(
    'reports', (select count(*) from sel),
    'per_jenis', coalesce((select jsonb_object_agg(jenis, n) from (select jenis, count(*) n from sel group by jenis) t), '{}'::jsonb),
    'per_bulan', coalesce((select jsonb_object_agg(bulan, n) from (select to_char(tanggal, 'YYYY-MM') bulan, count(*) n from sel group by 1) t), '{}'::jsonb),
    'media', (select count(*) from urls),
    'media_shared', (select count(*) from urls where url in (select url from outside)),
    'media_broken', (select count(*) from urls u
                      where u.url like '%/storage/v1/object/public/dokumentasi/%'
                        and not exists (select 1 from storage.objects o
                                         where o.bucket_id = 'dokumentasi'
                                           and o.name = substring(u.url from '/object/public/dokumentasi/(.*)$'))),
    'retention_cutoff', v_cutoff,
    'retention_ok', p_to <= v_cutoff,
    'oldest_report', (select min(tanggal) from laporan_operasional)
  ) into v_result;
  return v_result;
end;
$$;

create or replace function public.trash_report_range(p_from date, p_to date, p_jenis text[] default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := require_login();
  v_cutoff date := report_retention_cutoff();
  v_job uuid;
  v_count integer;
begin
  if p_from is null or p_to is null or p_from > p_to then
    raise exception 'Rentang tanggal tidak valid.' using errcode = '22023';
  end if;
  if p_to > v_cutoff then
    raise exception 'Laporan disimpan minimal 12 bulan. Rentang paling baru yang boleh dihapus berakhir %.', v_cutoff
      using errcode = '42501';
  end if;

  insert into storage_cleanup_jobs (kind, range_from, range_to, jenis, created_by, created_by_email)
  values ('rentang', p_from, p_to, p_jenis, v_uid, auth.jwt() ->> 'email')
  returning id into v_job;

  with moved as (
    delete from laporan_operasional
     where tanggal between p_from and p_to and (p_jenis is null or jenis = any (p_jenis))
    returning *
  )
  insert into laporan_operasional_sampah
    (id, tanggal, shift, jenis, waktu, lokasi, peralatan, kategori_maintenance, uraian, tindak_lanjut,
     status, teknisi, foto_urls, created_at, deleted_by, deleted_by_email, job_id)
  select id, tanggal, shift, jenis, waktu, lokasi, peralatan, kategori_maintenance, uraian, tindak_lanjut,
         status, teknisi, foto_urls, created_at, v_uid, auth.jwt() ->> 'email', v_job
    from moved;
  get diagnostics v_count = row_count;

  if v_count = 0 then
    raise exception 'Tidak ada laporan pada rentang ini.' using errcode = 'P0002';
  end if;
  update storage_cleanup_jobs set row_count = v_count where id = v_job;
  return v_job;
end;
$$;

-- Hapus satuan dari Shift Report (koreksi kesalahan input): tanpa batas 12 bulan, tetap lewat Sampah.
create or replace function public.trash_report_rows(p_ids uuid[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := require_login();
  v_job uuid;
  v_count integer;
begin
  insert into storage_cleanup_jobs (kind, created_by, created_by_email)
  values ('satuan', v_uid, auth.jwt() ->> 'email')
  returning id into v_job;

  with moved as (
    delete from laporan_operasional where id = any (p_ids) returning *
  )
  insert into laporan_operasional_sampah
    (id, tanggal, shift, jenis, waktu, lokasi, peralatan, kategori_maintenance, uraian, tindak_lanjut,
     status, teknisi, foto_urls, created_at, deleted_by, deleted_by_email, job_id)
  select id, tanggal, shift, jenis, waktu, lokasi, peralatan, kategori_maintenance, uraian, tindak_lanjut,
         status, teknisi, foto_urls, created_at, v_uid, auth.jwt() ->> 'email', v_job
    from moved;
  get diagnostics v_count = row_count;

  if v_count = 0 then
    raise exception 'Laporan tidak ditemukan.' using errcode = 'P0002';
  end if;
  update storage_cleanup_jobs
     set row_count = v_count,
         range_from = (select min(tanggal) from laporan_operasional_sampah where job_id = v_job),
         range_to = (select max(tanggal) from laporan_operasional_sampah where job_id = v_job)
   where id = v_job;
  return v_job;
end;
$$;

create or replace function public.restore_trash_job(p_job uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  perform require_login();
  perform 1 from storage_cleanup_jobs where id = p_job and status = 'sampah' for update;
  if not found then
    raise exception 'Job tidak ada di Sampah (mungkin sudah dikosongkan atau dipulihkan).' using errcode = 'P0002';
  end if;

  with moved as (
    delete from laporan_operasional_sampah where job_id = p_job returning *
  )
  insert into laporan_operasional
    (id, tanggal, shift, jenis, waktu, lokasi, peralatan, kategori_maintenance, uraian, tindak_lanjut,
     status, teknisi, foto_urls, created_at)
  select id, tanggal, shift, jenis, waktu, lokasi, peralatan, kategori_maintenance, uraian, tindak_lanjut,
         status, teknisi, foto_urls, created_at
    from moved;
  get diagnostics v_count = row_count;

  update storage_cleanup_jobs set status = 'dipulihkan', restored_at = now() where id = p_job;
  return v_count;
end;
$$;

-- Ringkasan database untuk panel Penyimpanan.
create or replace function public.report_storage_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform require_login();
  return jsonb_build_object(
    'database_bytes', pg_database_size(current_database()),
    'reports', (select count(*) from laporan_operasional),
    'reports_with_media', (select count(*) from laporan_operasional
                            where jsonb_typeof(foto_urls) = 'array' and jsonb_array_length(foto_urls) > 0),
    'oldest_report', (select min(tanggal) from laporan_operasional),
    'newest_report', (select max(tanggal) from laporan_operasional),
    'per_bulan', coalesce((select jsonb_object_agg(bulan, n) from (
                   select to_char(tanggal, 'YYYY-MM') bulan, count(*) n from laporan_operasional group by 1) t), '{}'::jsonb),
    'retention_cutoff', report_retention_cutoff(),
    'trash_reports', (select count(*) from laporan_operasional_sampah)
  );
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 5. Fungsi untuk server (service_role): pengosongan Sampah setelah 7 hari.
-- ---------------------------------------------------------------------------------------------

-- Hapus baris job secara permanen lalu kembalikan media yang perlu dihapus. Bisa dipanggil ulang:
-- job yang terputus (mengosongkan/sebagian) hanya mengembalikan item yang belum selesai.
create or replace function public.begin_purge_job(p_job uuid)
returns table (url text)
language plpgsql
security definer
set search_path = public, storage
as $$
#variable_conflict use_column
declare
  v_status text;
begin
  select status into v_status from storage_cleanup_jobs where id = p_job for update;
  if v_status is null then
    raise exception 'Job % tidak ada.', p_job using errcode = 'P0002';
  end if;
  if v_status not in ('sampah', 'mengosongkan', 'sebagian') then
    return;
  end if;
  if v_status = 'sampah' and (select purge_after from storage_cleanup_jobs where id = p_job) > now() then
    raise exception 'Job % belum 7 hari di Sampah.', p_job using errcode = '42501';
  end if;

  insert into storage_cleanup_items (job_id, url)
  select distinct p_job, jsonb_array_elements_text(foto_urls)
    from laporan_operasional_sampah where job_id = p_job and jsonb_typeof(foto_urls) = 'array'
  on conflict do nothing;

  delete from laporan_operasional_sampah where job_id = p_job;
  update storage_cleanup_jobs set status = 'mengosongkan' where id = p_job;

  -- Media yang masih dipakai laporan lain tidak boleh dihapus (dicek ulang setiap pemanggilan).
  update storage_cleanup_items i set status = 'dipakai_laporan_lain', updated_at = now()
   where i.job_id = p_job and i.status in ('menunggu', 'gagal')
     and i.url in (select r.url from referenced_media_urls(p_job) r);

  update storage_cleanup_items i set status = 'tidak_ada', updated_at = now()
   where i.job_id = p_job and i.status in ('menunggu', 'gagal')
     and i.url like '%/storage/v1/object/public/dokumentasi/%'
     and not exists (select 1 from storage.objects o
                      where o.bucket_id = 'dokumentasi'
                        and o.name = substring(i.url from '/object/public/dokumentasi/(.*)$'));

  return query
    select i.url from storage_cleanup_items i where i.job_id = p_job and i.status in ('menunggu', 'gagal');
end;
$$;

-- Simpan hasil penghapusan media dan tutup job. p_results: [{"url": "...", "status": "dihapus", "error": null}, ...]
create or replace function public.finish_purge_job(p_job uuid, p_results jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  update storage_cleanup_items i
     set status = r.status, error = r.error, updated_at = now()
    from jsonb_to_recordset(coalesce(p_results, '[]'::jsonb)) as r(url text, status text, error text)
   where i.job_id = p_job and i.url = r.url;

  select case when exists (select 1 from storage_cleanup_items
                            where job_id = p_job and status in ('menunggu', 'gagal'))
              then 'sebagian' else 'dikosongkan' end
    into v_status;

  update storage_cleanup_jobs j set
    status = v_status,
    purged_at = case when v_status = 'dikosongkan' then now() else null end,
    media_total = (select count(*) from storage_cleanup_items where job_id = p_job),
    media_deleted = (select count(*) from storage_cleanup_items where job_id = p_job and status = 'dihapus'),
    media_kept = (select count(*) from storage_cleanup_items where job_id = p_job and status = 'dipakai_laporan_lain'),
    media_missing = (select count(*) from storage_cleanup_items where job_id = p_job and status = 'tidak_ada'),
    media_failed = (select count(*) from storage_cleanup_items where job_id = p_job and status = 'gagal')
   where j.id = p_job;
  return v_status;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 6. Hak eksekusi.
-- ---------------------------------------------------------------------------------------------
revoke all on function public.require_login() from public, anon;
revoke all on function public.preview_report_range(date, date, text[]) from public, anon;
revoke all on function public.trash_report_range(date, date, text[]) from public, anon;
revoke all on function public.trash_report_rows(uuid[]) from public, anon;
revoke all on function public.restore_trash_job(uuid) from public, anon;
revoke all on function public.report_storage_overview() from public, anon;
revoke all on function public.begin_purge_job(uuid) from public, anon, authenticated;
revoke all on function public.finish_purge_job(uuid, jsonb) from public, anon, authenticated;

grant execute on function public.require_login() to authenticated;
grant execute on function public.preview_report_range(date, date, text[]) to authenticated;
grant execute on function public.trash_report_range(date, date, text[]) to authenticated;
grant execute on function public.trash_report_rows(uuid[]) to authenticated;
grant execute on function public.restore_trash_job(uuid) to authenticated;
grant execute on function public.report_storage_overview() to authenticated;
grant execute on function public.begin_purge_job(uuid) to service_role;
grant execute on function public.finish_purge_job(uuid, jsonb) to service_role;
grant execute on function public.referenced_media_urls(uuid) to service_role;
