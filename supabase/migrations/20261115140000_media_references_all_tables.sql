-- Pemeriksaan "foto masih dipakai" mencakup semua tabel yang menyimpan URL media.
--
-- Sebelumnya referenced_media_urls() (dipakai pengosongan Sampah) dan pratinjau rentang hanya melihat
-- laporan_operasional, laporan_operasional_sampah, dan preventive_photo_log. Kolom
-- stock_mutations.evidence_urls dan unit_peralatan.foto_url juga menyimpan URL foto sehingga foto di sana
-- bisa ikut terhapus saat sebuah laporan dikosongkan bila URL-nya sama. Keduanya kini ikut dihitung.
--
-- Bila tabel lain yang menyimpan URL media ditambahkan nanti, tambahkan juga di fungsi ini.

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
  select secure_url from preventive_photo_log where secure_url is not null
  union
  select unnest(evidence_urls) from stock_mutations where evidence_urls is not null
  union
  select foto_url from unit_peralatan where foto_url is not null and foto_url <> '';
$$;
revoke all on function public.referenced_media_urls(uuid) from public, anon, authenticated;
grant execute on function public.referenced_media_urls(uuid) to service_role;

-- Pratinjau rentang: hitungan "dipakai laporan lain" memakai daftar rujukan yang sama.
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
    union
    select unnest(evidence_urls) from stock_mutations where evidence_urls is not null
    union
    select foto_url from unit_peralatan where foto_url is not null and foto_url <> ''
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
revoke all on function public.preview_report_range(date, date, text[]) from public, anon;
grant execute on function public.preview_report_range(date, date, text[]) to authenticated;
