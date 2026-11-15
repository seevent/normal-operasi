-- Foto yang dilepas dari laporan saat laporan diedit (mis. foto diganti di menu Report) ikut dihapus.
--
-- Sebelumnya hanya foto milik laporan yang dihapus yang dibersihkan (lewat Sampah, lihat
-- 20261029120000_storage_manager.sql). Foto lama dari laporan yang diedit tetap tersimpan di
-- Cloudinary/Storage tanpa dirujuk laporan mana pun dan tidak pernah dihapus.
--
-- Kini setiap UPDATE foto_urls yang membuang URL mencatat job jenis 'foto_lama' berisi URL itu.
-- Job ini memakai jalur pengosongan yang sama: masuk Sampah 7 hari, lalu dihapus oleh fungsi
-- terjadwal (purge-trash) kecuali foto masih dipakai laporan lain atau log Preventive.
-- Job 'foto_lama' tidak bisa "dipulihkan" karena tidak ada baris laporan yang dipindahkan.

alter table public.storage_cleanup_jobs drop constraint storage_cleanup_jobs_kind_check;
alter table public.storage_cleanup_jobs
  add constraint storage_cleanup_jobs_kind_check check (kind in ('rentang', 'satuan', 'foto_lama'));

create or replace function public.queue_removed_report_media()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_removed text[];
  v_job uuid;
begin
  select array_agg(distinct u) into v_removed
    from jsonb_array_elements_text(case when jsonb_typeof(old.foto_urls) = 'array' then old.foto_urls else '[]'::jsonb end) as u
   where not (case when jsonb_typeof(new.foto_urls) = 'array' then new.foto_urls else '[]'::jsonb end) ? u;

  if coalesce(cardinality(v_removed), 0) = 0 then
    return new;
  end if;

  insert into storage_cleanup_jobs (kind, range_from, range_to, row_count, created_by, created_by_email)
  values ('foto_lama', new.tanggal, new.tanggal, 0, auth.uid(), auth.jwt() ->> 'email')
  returning id into v_job;

  insert into storage_cleanup_items (job_id, url)
  select v_job, u from unnest(v_removed) as u;

  return new;
end;
$$;
revoke all on function public.queue_removed_report_media() from public, anon, authenticated;

create trigger laporan_operasional_queue_removed_media
  after update of foto_urls on public.laporan_operasional
  for each row
  when (old.foto_urls is distinct from new.foto_urls)
  execute function public.queue_removed_report_media();

-- Pulihkan hanya untuk job yang memindahkan laporan ke Sampah.
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
  perform 1 from storage_cleanup_jobs where id = p_job and status = 'sampah' and kind <> 'foto_lama' for update;
  if not found then
    raise exception 'Job tidak ada di Sampah (mungkin sudah dikosongkan, dipulihkan, atau berisi foto lama saja).' using errcode = 'P0002';
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
