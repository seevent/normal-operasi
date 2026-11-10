import React, { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { CheckCircle2, FlaskConical, Loader2, RefreshCw, Send, Video, XCircle } from 'lucide-react';
import { shareTestReport } from '../../lib/services/shareService';
import { fetchShareLog, logShareAnswer, type ShareLogRow } from '../../lib/services/shareLogService';
import { getPreparedVideo, getVideoPrepStatus, prefetchVideosForWhatsApp, subscribeVideoPrep } from '../../lib/services/whatsappVideoService';
import type { ShareMode, VideoChoice } from '../../lib/utils/shareFlow';

interface TestMode {
  id: string;
  label: string;
  detail: string;
  mode: ShareMode;
  video: VideoChoice;
  /** Mode ini butuh salinan MP4 hasil konversi yang sudah siap. */
  needsConverted: boolean;
}

/** Tiga cara berbagi yang dibandingkan. A = perilaku kode awal; B/C = perubahan 29–30 Okt 2026. */
const MODES: TestMode[] = [
  { id: 'A', label: 'A · Satu share, video asli', detail: 'Laporan + foto + video apa adanya (cara awal).', mode: 'gabung', video: 'asli', needsConverted: false },
  { id: 'B', label: 'B · Satu share, video MP4', detail: 'Laporan + foto + video hasil konversi Cloudinary.', mode: 'gabung', video: 'siap', needsConverted: true },
  { id: 'C', label: 'C · Video terpisah', detail: 'Laporan + foto dulu, lalu video lewat tombol hijau di bawah layar.', mode: 'pisah', video: 'siap', needsConverted: true },
];

/** Foto contoh kecil dibuat di awal, agar saat tombol uji diketuk share bisa dipanggil seketika. */
const makeSamplePhoto = (): Promise<File | null> =>
  new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve(null);
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('Uji share SSES T2', 120, 250);
    canvas.toBlob((blob) => resolve(blob ? new File([blob], 'uji-share.jpg', { type: 'image/jpeg' }) : null), 'image/jpeg', 0.8);
  });

const device = (ua: string | null): string => {
  if (!ua) return '-';
  const os = /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Macintosh/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : 'Lain';
  const browser = /CriOS|Chrome\//.test(ua) && !/Edg/.test(ua) ? 'Chrome' : /FxiOS|Firefox/.test(ua) ? 'Firefox' : /Edg/.test(ua) ? 'Edge' : /Safari/.test(ua) ? 'Safari' : 'Lain';
  const version = /OS (\d+[_\d]*) like Mac/.exec(ua)?.[1]?.replace(/_/g, '.') ?? /Android (\d+)/.exec(ua)?.[1] ?? '';
  return `${os}${version ? ` ${version}` : ''} · ${browser}`;
};

const OUTCOME_LABEL: Record<string, { text: string; tone: string }> = {
  resolved: { text: 'Menu bagikan selesai', tone: 'text-emerald-700' },
  aborted: { text: 'Dibatalkan', tone: 'text-slate-600' },
  rejected: { text: 'Ditolak peramban', tone: 'text-rose-700' },
  unsupported: { text: 'Tidak didukung', tone: 'text-rose-700' },
  timeout: { text: 'Menggantung > 60 dtk', tone: 'text-amber-700' },
  sampai_ya: { text: 'Sampai di WhatsApp', tone: 'text-emerald-700' },
  sampai_tidak: { text: 'TIDAK sampai', tone: 'text-rose-700' },
  tautan: { text: 'Dikirim sebagai tautan', tone: 'text-sky-700' },
  disimpan: { text: 'Disimpan ke HP', tone: 'text-slate-600' },
  dilewati: { text: 'Dilewati', tone: 'text-slate-600' },
};

const jam = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });

export const ShareTestPanel: React.FC = () => {
  const [video, setVideo] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [withPhoto, setWithPhoto] = useState(true);
  const [last, setLast] = useState<{ attemptId: string; test: string; answered: boolean } | null>(null);
  const [rows, setRows] = useState<ShareLogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prepStatus = useSyncExternalStore(subscribeVideoPrep, () => (video ? getVideoPrepStatus(video) : undefined));
  const converted = video ? getPreparedVideo(video) : undefined;

  useEffect(() => {
    void makeSamplePhoto().then(setPhoto);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fetchShareLog(40));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = (m: TestMode) => {
    if (!video) return;
    const groups = [[...(withPhoto && photo ? [photo] : []), video]];
    const waktu = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    // Tanpa await sebelum share: izin ketukan pengguna harus masih berlaku saat navigator.share dipanggil.
    const pending = shareTestReport({ test: m.id, message: `Uji share SSES T2 · mode ${m.id} · ${waktu}`, groups, mode: m.mode, video: m.video });
    void pending.then(({ attemptId }) => {
      setLast({ attemptId, test: m.id, answered: false });
      window.setTimeout(() => void refresh(), 1500);
    });
  };

  const answer = (delivered: boolean) => {
    if (!last) return;
    logShareAnswer(last.attemptId, delivered, last.test);
    setLast({ ...last, answered: true });
    window.setTimeout(() => void refresh(), 1500);
  };

  return (
    <div className="p-3 sm:p-6 bg-slate-50 min-h-[500px] space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 mb-2">
          <FlaskConical className="w-4 h-4 text-indigo-600" /> Uji share video ke WhatsApp
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed mb-3">
          Dipakai untuk memastikan cara berbagi mana yang benar-benar sampai di WhatsApp pada HP ini. Pilih satu video pendek, jalankan mode A, B,
          dan C satu per satu ke chat uji, lalu jawab apakah videonya sampai. Hasilnya tercatat di bawah.
        </p>

        <label className="flex items-center justify-center gap-2 w-full min-h-[48px] px-4 py-3 border-2 border-dashed border-indigo-300 rounded-xl bg-indigo-50 text-indigo-800 text-sm font-bold cursor-pointer">
          <Video className="w-5 h-5" /> {video ? `Ganti video (${video.name})` : 'Pilih video uji'}
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              setVideo(file);
              setLast(null);
              prefetchVideosForWhatsApp([file]);
            }}
          />
        </label>

        {video && (
          <p className="mt-2 text-xs text-slate-600">
            {(video.size / 1024 / 1024).toFixed(1)} MB · {video.type || 'tipe tidak diketahui'} · salinan MP4:{' '}
            <b>
              {prepStatus === 'ready' && converted
                ? `siap (${(converted.size / 1024 / 1024).toFixed(1)} MB)`
                : prepStatus === 'failed'
                  ? 'gagal dibuat'
                  : prepStatus === 'preparing'
                    ? 'sedang dibuat…'
                    : 'tidak dibuat (peramban tanpa Web Share)'}
            </b>
          </p>
        )}

        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700 min-h-[44px]">
          <input type="checkbox" className="w-5 h-5" checked={withPhoto} onChange={(e) => setWithPhoto(e.target.checked)} />
          Sertakan 1 foto contoh (seperti laporan sungguhan)
        </label>

        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {MODES.map((m) => {
            const disabled = !video || (m.needsConverted && !converted);
            return (
              <button
                key={m.id}
                type="button"
                disabled={disabled}
                onClick={() => run(m)}
                className="min-h-[64px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-left hover:bg-slate-50 disabled:opacity-50"
              >
                <span className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                  <Send className="w-4 h-4 text-green-600 shrink-0" /> {m.label}
                </span>
                <span className="block text-[11px] text-slate-500 mt-0.5">{m.needsConverted && video && !converted ? 'Menunggu salinan MP4 siap.' : m.detail}</span>
              </button>
            );
          })}
        </div>

        {last && !last.answered && (
          <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
            <p className="text-sm font-bold text-amber-900">Mode {last.test}: Sampai di WhatsApp? (videonya tampil dan terkirim di chat)</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => answer(true)} className="flex-1 min-h-[44px] rounded-xl bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Ya, sampai
              </button>
              <button type="button" onClick={() => answer(false)} className="flex-1 min-h-[44px] rounded-xl bg-rose-600 text-white text-sm font-bold flex items-center justify-center gap-1.5">
                <XCircle className="w-4 h-4" /> Tidak
              </button>
            </div>
          </div>
        )}
        {last?.answered && <p className="mt-3 text-xs font-semibold text-emerald-700">Jawaban mode {last.test} tercatat. Lanjutkan mode berikutnya.</p>}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="font-bold text-sm text-slate-800">Catatan share terbaru (semua perangkat)</h3>
          <button type="button" onClick={() => void refresh()} aria-label="Muat ulang catatan" className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-300 text-slate-700">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        </div>
        {error && <p className="text-xs text-rose-700 mb-2">Catatan tidak dapat dimuat: {error}</p>}
        {rows.length === 0 && !error && <p className="text-xs text-slate-500">Belum ada catatan.</p>}
        <ul className="divide-y divide-slate-100">
          {rows.map((r) => {
            const o = OUTCOME_LABEL[r.outcome] ?? { text: r.outcome, tone: 'text-slate-700' };
            return (
              <li key={r.id} className="py-2 text-xs">
                <div className="flex justify-between gap-2">
                  <span className={`font-bold ${o.tone}`}>
                    {o.text}
                    {r.error_name ? ` (${r.error_name})` : ''}
                  </span>
                  <span className="text-slate-500 whitespace-nowrap">{jam(r.created_at)}</span>
                </div>
                <div className="text-slate-600">
                  {r.kind === 'catatan'
                    ? `Catatan${r.test ? ` · uji ${r.test}` : ''}`
                    : `${r.kind === 'uji' ? `Uji ${r.test ?? ''}` : r.tab ?? r.kind} · langkah ${r.step} · ${r.photos} foto, ${r.videos} video${
                        r.video_source ? ` (${r.video_source})` : ''
                      } · ${(r.bytes / 1024 / 1024).toFixed(1)} MB`}
                  {' · '}
                  {device(r.user_agent)}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
