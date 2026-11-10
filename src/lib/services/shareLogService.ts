// src/lib/services/shareLogService.ts
// Catatan hasil setiap share ke WhatsApp (tabel share_log), agar strategi share diputuskan dari data
// perangkat sungguhan, bukan dugaan. Pencatatan tidak pernah ditunggu dan tidak pernah melempar galat:
// share harus tetap jalan walau jaringan atau tabelnya bermasalah. Tidak ada isi laporan yang dicatat.

import { supabase } from '../supabaseClient';
import type { ShareLogEntry } from '../utils/shareFlow';

export interface ShareLogRow {
  id: number;
  created_at: string;
  attempt_id: string;
  kind: string;
  step: number;
  tab: string | null;
  mode: string | null;
  test: string | null;
  photos: number;
  videos: number;
  video_source: string | null;
  bytes: number;
  outcome: string;
  error_name: string | null;
  duration_ms: number | null;
  user_agent: string | null;
}

const insert = (row: Record<string, unknown>): void => {
  try {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : null;
    void supabase
      .from('share_log')
      .insert({ ...row, user_agent: userAgent })
      .then(
        ({ error }) => {
          if (error) console.warn('share_log tidak tercatat:', error.message);
        },
        () => {},
      );
  } catch {
    // Pencatatan bersifat tambahan; kegagalannya tidak boleh mengganggu share.
  }
};

export const logShare = (e: ShareLogEntry): void =>
  insert({
    attempt_id: e.attemptId,
    kind: e.kind,
    step: e.step,
    tab: e.tab ?? null,
    mode: e.mode,
    test: e.test ?? null,
    photos: e.photos,
    videos: e.videos,
    video_source: e.videoSource,
    bytes: e.bytes,
    outcome: e.outcome,
    error_name: e.errorName,
    duration_ms: e.durationMs,
  });

/** Catatan tambahan untuk satu percobaan: jalan cadangan yang dipakai, atau jawaban pengguna di halaman uji. */
export const logShareNote = (attemptId: string, note: 'tautan' | 'disimpan' | 'dilewati' | 'sampai_ya' | 'sampai_tidak', test?: string): void =>
  insert({ attempt_id: attemptId, kind: 'catatan', outcome: note, test: test ?? null });

/** Jawaban "Sampai di WhatsApp?" dari halaman Uji share. */
export const logShareAnswer = (attemptId: string, delivered: boolean, test?: string): void =>
  logShareNote(attemptId, delivered ? 'sampai_ya' : 'sampai_tidak', test);

/** Catatan terbaru untuk halaman Uji share (hanya akun login yang boleh membaca). */
export const fetchShareLog = async (limit = 40): Promise<ShareLogRow[]> => {
  const { data, error } = await supabase.from('share_log').select('*').order('id', { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as ShareLogRow[];
};
