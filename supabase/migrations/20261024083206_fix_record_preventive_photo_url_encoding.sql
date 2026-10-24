-- Sudah diterapkan ke project Supabase "SSES T2 Project" (versi 20261024083206).
-- Cloudinary menulis spasi pada nama folder sebagai %20 di secure_url (mis. "ETD DESKTOP" -> "ETD%20DESKTOP"),
-- sehingga validasi awalan URL lama selalu menolak (url foto tidak sesuai) dan tab Preventive menampilkan
-- "Foto terunggah tetapi gagal dicatat". Awalan sekarang dibandingkan dengan public_id yang spasinya ditulis %20.
-- Selain itu fungsi tidak berubah; hak EXECUTE tetap hanya untuk service_role.
CREATE OR REPLACE FUNCTION public.record_preventive_photo(p_period text, p_equipment text, p_version bigint, p_secure_url text)
 RETURNS preventive_photo_log
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  c_cloud constant text := 'wha6e7fj';
  v_key date; v_pid text; v_prefix text; v_row public.preventive_photo_log;
begin
  if p_period is null or p_period not in ('DAILY','WEEKLY','MONTHLY') then
    raise exception 'periode tidak valid' using errcode = '22023';
  end if;
  v_key := public.preventive_period_key(p_period);
  v_pid := public.preventive_public_id(p_period, p_equipment, v_key);
  if v_pid is null then
    raise exception 'aset tidak dikenal atau nonaktif' using errcode = 'P0002';
  end if;
  if p_version is null or abs(p_version - extract(epoch from now())::bigint) > 900 then
    raise exception 'versi unggahan tidak wajar' using errcode = '22023';
  end if;
  v_prefix := 'https://res.cloudinary.com/' || c_cloud || '/image/upload/v' || p_version || '/' || replace(v_pid, ' ', '%20') || '.';
  if p_secure_url is null or left(p_secure_url, length(v_prefix)) <> v_prefix
     or substr(p_secure_url, length(v_prefix) + 1) !~ '^[a-z0-9]{2,5}$' then
    raise exception 'url foto tidak sesuai' using errcode = '22023';
  end if;

  insert into public.preventive_photo_log as l (period, equipment_number, period_key, public_id, secure_url, cloudinary_version)
  values (p_period, p_equipment, v_key, v_pid, p_secure_url, p_version)
  on conflict (period, equipment_number, period_key) do update
    set public_id = excluded.public_id, secure_url = excluded.secure_url,
        cloudinary_version = excluded.cloudinary_version, uploaded_at = now()
    where l.cloudinary_version <= excluded.cloudinary_version
  returning * into v_row;

  if v_row.equipment_number is null then
    select * into v_row from public.preventive_photo_log
     where period = p_period and equipment_number = p_equipment and period_key = v_key;
  end if;
  return v_row;
end $function$;
