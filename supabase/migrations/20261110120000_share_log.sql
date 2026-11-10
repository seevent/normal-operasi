-- Catatan hasil share ke WhatsApp dari perangkat sungguhan (lihat src/lib/services/shareLogService.ts).
-- Tiap baris = satu panggilan navigator.share (kind laporan/lanjutan/uji) atau satu catatan tambahan
-- (kind 'catatan': jalan cadangan yang dipakai, atau jawaban "Sampai di WhatsApp?" di halaman Uji share).
-- Tidak memuat isi laporan. Tulis: siapa saja yang memakai aplikasi (teknisi tidak login). Baca: akun login.
create table public.share_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  attempt_id text not null check (char_length(attempt_id) <= 64),
  kind text not null check (kind in ('laporan', 'lanjutan', 'uji', 'catatan')),
  step smallint not null default 1,
  tab text check (char_length(tab) <= 32),
  mode text check (mode in ('gabung', 'pisah')),
  test text check (char_length(test) <= 40),
  photos smallint not null default 0,
  videos smallint not null default 0,
  video_source text check (video_source in ('asli', 'konversi', 'campur')),
  bytes bigint not null default 0,
  outcome text not null check (char_length(outcome) <= 24),
  error_name text check (char_length(error_name) <= 60),
  duration_ms integer,
  user_agent text check (char_length(user_agent) <= 300)
);

create index idx_share_log_created_at on public.share_log (created_at desc);
create index idx_share_log_attempt on public.share_log (attempt_id);

alter table public.share_log enable row level security;

create policy share_log_insert_public on public.share_log
  for insert to anon, authenticated with check (true);
create policy share_log_select_login on public.share_log
  for select to authenticated using (true);
