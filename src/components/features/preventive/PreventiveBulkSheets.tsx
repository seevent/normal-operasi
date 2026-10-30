import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Circle, Loader2, X } from 'lucide-react';
import type { PreventiveAsset, RowStatus } from '../../../lib/utils/preventiveGrouping';
import { defaultAssignment, defaultStartKey, orderPhotos, reassign } from '../../../lib/utils/preventiveBulk';
import { EXIF_READ_BYTES, readExifTakenAt, whatsappNameRange } from '../../../lib/utils/photoExif';
import { isHeicLike } from '../../../lib/utils/preventiveImage';

/** Data foto untuk peringatan tanggal (dibaca dari berkas asli sebelum dikompres). */
export interface PhotoMeta {
  takenAt: number | null;
  nameRange: [number, number] | null;
  heic: boolean;
}

const readPhotoMeta = async (file: File): Promise<PhotoMeta> => {
  const nameRange = whatsappNameRange(file.name ?? '');
  const heic = isHeicLike({ type: file.type, name: file.name ?? '' });
  try {
    return { takenAt: readExifTakenAt(await file.slice(0, EXIF_READ_BYTES).arrayBuffer()), nameRange, heic };
  } catch {
    return { takenAt: null, nameRange, heic };
  }
};

export interface AssetOptionGroup {
  title: string;
  assets: PreventiveAsset[];
}

interface CommonProps {
  statusFor: (asset: PreventiveAsset) => RowStatus;
  isSaved: (asset: PreventiveAsset) => boolean;
  onRetry: (asset: PreventiveAsset) => Promise<boolean>;
  onClose: () => void;
}

const fmtTime = (ms: number | null): string =>
  ms === null
    ? 'waktu foto tidak terbaca'
    : new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).format(ms);

const Sheet: React.FC<{ title: string; subtitle: string; onClose?: () => void; footer: React.ReactNode; children: React.ReactNode }> = ({ title, subtitle, onClose, footer, children }) => (
  <div className="fixed inset-0 z-[60] flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={title}>
    <div className="absolute inset-0 bg-slate-900/50" aria-hidden="true" />
    <div className="relative mx-auto w-full max-w-2xl max-h-[92vh] bg-white rounded-t-3xl flex flex-col shadow-2xl">
      <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-slate-300" aria-hidden="true" />
      <div className="px-4 pt-3 pb-2 border-b border-slate-200 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-extrabold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Tutup" className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 inline-flex items-center justify-center text-slate-500 hover:text-slate-800">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
      <div className="border-t border-slate-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>
    </div>
  </div>
);

const STATUS_VIEW: Record<RowStatus, { label: string; className: string; icon: React.ReactNode }> = {
  idle: { label: 'Menunggu', className: 'bg-slate-100 text-slate-600', icon: <Circle className="w-3.5 h-3.5" aria-hidden="true" /> },
  uploading: { label: 'Mengunggah…', className: 'bg-blue-100 text-blue-800', icon: <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> },
  saved: { label: 'Tersimpan', className: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> },
  failed: { label: 'Gagal', className: 'bg-rose-100 text-rose-800', icon: <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> },
};

/** Progres kirim: status tiap alat diambil langsung dari store, jadi sama dengan yang tampil di daftar. */
const SendProgress: React.FC<CommonProps & { title: string; targets: Array<{ asset: PreventiveAsset; thumb: string }> }> = ({ title, targets, statusFor, onRetry, onClose }) => {
  const statuses = targets.map((t) => statusFor(t.asset));
  const saved = statuses.filter((s) => s === 'saved').length;
  const failed = statuses.filter((s) => s === 'failed').length;
  const uploading = statuses.filter((s) => s === 'uploading' || s === 'idle').length;
  const done = uploading === 0;
  const pct = targets.length === 0 ? 0 : Math.round((saved / targets.length) * 100);
  const failedTargets = targets.filter((_, i) => statuses[i] === 'failed');

  return (
    <Sheet
      title={title}
      subtitle={done ? 'Selesai' : 'Jangan tutup aplikasi sampai selesai'}
      onClose={done ? onClose : undefined}
      footer={
        <div className="flex gap-2">
          {failed > 0 && (
            <button
              type="button"
              disabled={!done}
              onClick={() => failedTargets.forEach((t) => void onRetry(t.asset))}
              className="flex-1 min-h-[48px] rounded-xl border-2 border-rose-600 text-rose-700 text-sm font-extrabold disabled:opacity-50"
            >
              Ulangi yang gagal ({failed})
            </button>
          )}
          <button
            type="button"
            disabled={!done}
            onClick={onClose}
            className="flex-1 min-h-[48px] rounded-xl bg-blue-700 text-white text-sm font-extrabold disabled:bg-slate-200 disabled:text-slate-500"
          >
            {done ? 'Selesai' : 'Mengirim…'}
          </button>
        </div>
      }
    >
      <div className="px-4 pt-3">
        <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
          <span>
            {saved}/{targets.length} tersimpan{failed > 0 ? ` · ${failed} gagal` : ''}
            {uploading > 0 ? ` · ${uploading} diproses` : ''}
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <ul className="mt-2">
        {targets.map((t, i) => {
          const view = STATUS_VIEW[statuses[i]];
          return (
            <li key={t.asset.equipmentNumber} className="flex items-center gap-2.5 px-4 py-2.5 border-b border-slate-100">
              <img src={t.thumb} alt="" className="w-11 h-11 rounded-lg object-cover border border-slate-300 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-slate-900 leading-tight break-words">{t.asset.name}</p>
                <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${view.className}`}>
                  {view.icon}
                  {view.label}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      {failed > 0 && done && (
        <p className="mx-4 my-3 text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
          Foto yang gagal tetap disimpan di HP sampai dikirim ulang. Pesan galatnya tampil di baris peralatan pada daftar.
        </p>
      )}
    </Sheet>
  );
};

/** A: banyak foto, satu foto untuk satu peralatan. */
export const BulkPhotosSheet: React.FC<
  CommonProps & {
    files: File[];
    title: string;
    optionGroups: AssetOptionGroup[];
    warningFor: (meta: PhotoMeta) => string | null;
    onSend: (pairs: Array<{ asset: PreventiveAsset; file: File }>) => void;
  }
> = ({ title, files, optionGroups, warningFor, onSend, statusFor, isSaved, onRetry, onClose }) => {
  const ordered = useMemo(() => optionGroups.flatMap((g) => g.assets), [optionGroups]);
  const byKey = useMemo(() => new Map(ordered.map((a) => [a.equipmentNumber, a])), [ordered]);
  const [photos, setPhotos] = useState<Array<{ file: File; url: string; meta: PhotoMeta }> | null>(null);
  const [assignment, setAssignment] = useState<Array<string | null>>([]);
  const [startKey, setStartKey] = useState<string | null>(null);
  const savedList = () => ordered.map((a) => ({ key: a.equipmentNumber, saved: isSaved(a) }));
  const [sent, setSent] = useState<Array<{ asset: PreventiveAsset; thumb: string }> | null>(null);

  useEffect(() => {
    let alive = true;
    const urls = files.map((f) => URL.createObjectURL(f));
    void Promise.all(files.map(readPhotoMeta)).then((metas) => {
      if (!alive) return;
      const list = orderPhotos(files.map((file, index) => ({ index, file, url: urls[index], meta: metas[index], takenAt: metas[index].takenAt, nameRange: metas[index].nameRange })));
      setPhotos(list.map(({ file, url, meta }) => ({ file, url, meta })));
      const start = defaultStartKey(savedList());
      setStartKey(start);
      setAssignment(defaultAssignment(list.length, savedList(), start));
    });
    return () => {
      alive = false;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
    // Dihitung sekali saat lembar dibuka; status tersimpan dibaca saat itu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  if (sent) return <SendProgress title="Mengirim foto" targets={sent} statusFor={statusFor} isSaved={isSaved} onRetry={onRetry} onClose={onClose} />;

  const pairs = (photos ?? [])
    .map((p, i) => ({ photo: p, asset: assignment[i] ? byKey.get(assignment[i] as string) : undefined }))
    .filter((x): x is { photo: NonNullable<typeof photos>[number]; asset: PreventiveAsset } => !!x.asset);
  const overwrites = pairs.filter((p) => isSaved(p.asset)).length;

  const send = () => {
    onSend(pairs.map((p) => ({ asset: p.asset, file: p.photo.file })));
    setSent(pairs.map((p) => ({ asset: p.asset, thumb: p.photo.url })));
  };

  return (
    <Sheet
      title={title}
      subtitle={photos ? `${photos.length} foto · diurutkan menurut waktu diambil` : 'Membaca foto…'}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 min-h-[48px] rounded-xl border border-slate-300 text-sm font-bold text-slate-700">
            Batal
          </button>
          <button
            type="button"
            onClick={send}
            disabled={pairs.length === 0}
            className="flex-[2] min-h-[48px] rounded-xl bg-blue-700 text-white text-sm font-extrabold disabled:opacity-50"
          >
            Kirim semua ({pairs.length})
          </button>
        </div>
      }
    >
      {!photos ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm font-semibold text-slate-600">
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> Membaca foto…
        </div>
      ) : (
        <>
          <label className="block px-4 py-2.5 bg-blue-50 border-b border-blue-100">
            <span className="text-[11px] font-extrabold text-blue-900">Mulai dari (foto diisi berurutan dari alat ini)</span>
            <select
              value={startKey ?? ''}
              onChange={(e) => {
                const key = e.target.value || null;
                setStartKey(key);
                setAssignment(defaultAssignment(photos.length, savedList(), key));
              }}
              aria-label="Mulai dari peralatan"
              style={{ fontSize: '16px' }}
              className="mt-1 w-full min-h-[44px] rounded-lg border border-blue-300 bg-white px-2 font-semibold text-slate-900"
            >
              {optionGroups.map((g) => (
                <optgroup key={g.title} label={g.title}>
                  {g.assets.map((a) => (
                    <option key={a.equipmentNumber} value={a.equipmentNumber}>
                      {a.name}
                      {isSaved(a) ? ' (tersimpan)' : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          {overwrites > 0 && (
            <p className="px-4 py-2 text-[11px] bg-amber-50 text-amber-900 border-b border-amber-200">
              {overwrites} peralatan sudah tersimpan dan fotonya akan diganti.
            </p>
          )}
          <ul>
            {photos.map((p, i) => {
              const key = assignment[i];
              const asset = key ? byKey.get(key) : undefined;
              const warning = warningFor(p.meta);
              return (
                <li key={p.url} className="flex items-start gap-2.5 px-4 py-2.5 border-b border-slate-100">
                  <img src={p.url} alt={`Foto ${i + 1}`} className="w-16 h-16 rounded-lg object-cover border border-slate-300 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-slate-500">Foto {i + 1} · {fmtTime(p.meta.takenAt ?? p.meta.nameRange?.[0] ?? null)}</p>
                    <select
                      value={key ?? ''}
                      onChange={(e) => setAssignment((prev) => reassign(prev, i, e.target.value || null))}
                      aria-label={`Peralatan untuk foto ${i + 1}`}
                      style={{ fontSize: '16px' }}
                      className={`mt-1 w-full min-h-[44px] rounded-lg border px-2 font-semibold ${asset ? 'border-slate-300 text-slate-900' : 'border-dashed border-slate-400 text-slate-500'}`}
                    >
                      <option value="">— Tanpa peralatan (tidak dikirim) —</option>
                      {optionGroups.map((g) => (
                        <optgroup key={g.title} label={g.title}>
                          {g.assets.map((a) => (
                            <option key={a.equipmentNumber} value={a.equipmentNumber}>
                              {a.name}
                              {isSaved(a) ? ' (ganti)' : ''}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {asset && isSaved(asset) && <p className="mt-1 text-[11px] font-bold text-amber-700">Sudah tersimpan: foto lama diganti</p>}
                    {warning && (
                      <p className="mt-1 flex items-start gap-1 text-[11px] font-semibold text-amber-800 leading-snug">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" aria-hidden="true" />
                        {warning}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="px-4 py-3 text-[11px] text-slate-500">
            Ganti peralatan lewat daftar pilihan. Memilih peralatan yang sudah dipakai foto lain akan menukar keduanya.
          </p>
        </>
      )}
    </Sheet>
  );
};

/** B: satu foto untuk beberapa peralatan yang dicentang. */
export const OnePhotoManySheet: React.FC<
  CommonProps & {
    file: File;
    assets: PreventiveAsset[];
    warningFor: (meta: PhotoMeta) => string | null;
    onSend: (pairs: Array<{ asset: PreventiveAsset; file: File }>) => void;
  }
> = ({ file, assets, warningFor, onSend, statusFor, isSaved, onRetry, onClose }) => {
  // URL dibuat di dalam efek agar pasangan buat/cabut selalu seimbang (aman di StrictMode).
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  const [meta, setMeta] = useState<PhotoMeta | null>(null);
  const [sent, setSent] = useState(false);
  useEffect(() => {
    void readPhotoMeta(file).then(setMeta);
  }, [file]);

  if (sent) {
    return (
      <SendProgress title="Mengirim foto" targets={assets.map((asset) => ({ asset, thumb: url ?? "" }))} statusFor={statusFor} isSaved={isSaved} onRetry={onRetry} onClose={onClose} />
    );
  }
  const warning = meta ? warningFor(meta) : null;
  const overwrites = assets.filter(isSaved).length;

  return (
    <Sheet
      title={`1 foto → ${assets.length} peralatan`}
      subtitle="Setiap peralatan tetap punya catatan bukti PRIMA sendiri"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 min-h-[48px] rounded-xl border border-slate-300 text-sm font-bold text-slate-700">
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onSend(assets.map((asset) => ({ asset, file })));
              setSent(true);
            }}
            className="flex-[2] min-h-[48px] rounded-xl bg-blue-700 text-white text-sm font-extrabold"
          >
            Kirim ke {assets.length} peralatan
          </button>
        </div>
      }
    >
      <div className="p-4">
        {url && <img src={url} alt="Foto yang akan dikirim" className="w-full max-h-72 object-contain rounded-2xl border border-slate-300 bg-slate-50" />}
        <p className="text-[11px] text-slate-500 mt-1.5">{meta ? `Diambil ${fmtTime(meta.takenAt ?? meta.nameRange?.[0] ?? null)}` : 'Membaca foto…'}</p>
        {warning && (
          <p className="mt-1 flex items-start gap-1 text-[11px] font-semibold text-amber-800 leading-snug">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" aria-hidden="true" />
            {warning}
          </p>
        )}
        <p className="mt-3 text-xs font-extrabold text-slate-700">Disimpan sebagai bukti untuk:</p>
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {assets.map((a) => (
            <li key={a.equipmentNumber} className={`text-[11.5px] font-bold rounded-full px-2.5 py-1 border ${isSaved(a) ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-blue-50 text-blue-900 border-blue-200'}`}>
              {a.name}
              {isSaved(a) ? ' (ganti)' : ''}
            </li>
          ))}
        </ul>
        {overwrites > 0 && <p className="mt-2 text-[11px] font-semibold text-amber-800">{overwrites} peralatan sudah tersimpan dan fotonya akan diganti.</p>}
      </div>
    </Sheet>
  );
};
