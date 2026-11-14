// Tab Data > Peralatan Preventive: daftar peralatan PRIMA (prima_assets) yang dipakai tab Preventive,
// tambah/ubah peralatan, unggah/ganti QR code, dan periksa isi semua QR terhadap database.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Pencil, Plus, QrCode, RefreshCw, ScanLine, Search, Upload, X } from 'lucide-react';
import { ASSET_TYPE_LABEL, PREVENTIVE_ASSET_TYPES } from '../../../lib/data/preventiveTypes';
import type { PreventiveAssetType } from '../../../lib/data/preventiveTypes';
import { fetchPreventiveQrCodes } from '../../../lib/services/preventiveDataService';
import { checkAllQr, fetchAdminAssets, saveAsset, uploadAssetQr } from '../../../lib/services/preventiveAssetAdminService';
import type { AdminAsset, QrCheckResult } from '../../../lib/services/preventiveAssetAdminService';
import { PERIOD_CODES, validateAssetDraft } from '../../../lib/utils/preventiveAssetAdmin';
import type { AssetDraft } from '../../../lib/utils/preventiveAssetAdmin';
import { WAREHOUSE_LOCATION } from '../../../lib/utils/preventiveGrouping';

type StatusFilter = 'all' | 'active' | 'inactive' | 'no_qr';

const typeLabel = (t: string): string => ASSET_TYPE_LABEL[t as PreventiveAssetType] ?? t;
const thumbUrl = (url: string): string => url.replace('/image/upload/', '/image/upload/c_fit,w_160/');
const errorText = (e: unknown): string => (e instanceof Error ? e.message : 'Terjadi kesalahan.');

const EMPTY_DRAFT: AssetDraft = {
  equipmentNumber: '',
  name: '',
  assetType: '',
  locationGroup: '',
  locationOverride: '',
  periods: ['D', 'W', 'M'],
  active: true,
};

const inputClass =
  'w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500';

export const PreventiveAssetManager: React.FC = () => {
  const [assets, setAssets] = useState<AdminAsset[]>([]);
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [editing, setEditing] = useState<{ draft: AssetDraft; isNew: boolean } | null>(null);
  const [busyQr, setBusyQr] = useState<string | null>(null);
  const [rowMessage, setRowMessage] = useState<{ eq: string; ok: boolean; text: string } | null>(null);

  const [checking, setChecking] = useState<{ done: number; total: number } | null>(null);
  const [checkResult, setCheckResult] = useState<QrCheckResult | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setQrError(null);
    const [a, q] = await Promise.allSettled([fetchAdminAssets(), fetchPreventiveQrCodes()]);
    if (a.status === 'fulfilled') setAssets(a.value);
    else setLoadError(errorText(a.reason));
    if (q.status === 'fulfilled') setQrUrls(q.value);
    else setQrError(`Gambar QR tidak dapat dimuat: ${errorText(q.reason)}`);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const active = assets.filter((a) => a.active).length;
    const withImage = assets.filter((a) => qrUrls[a.equipmentNumber]).length;
    const recorded = assets.filter((a) => a.qrTarget).length;
    return { total: assets.length, active, withImage, recorded };
  }, [assets, qrUrls]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((a) => {
      if (typeFilter && a.assetType !== typeFilter) return false;
      if (statusFilter === 'active' && !a.active) return false;
      if (statusFilter === 'inactive' && a.active) return false;
      if (statusFilter === 'no_qr' && qrUrls[a.equipmentNumber] && a.qrTarget) return false;
      if (!q) return true;
      return [a.equipmentNumber, a.name, a.locationGroup, a.locationOverride ?? ''].some((v) => v.toLowerCase().includes(q));
    });
  }, [assets, qrUrls, query, typeFilter, statusFilter]);

  const locationOptions = useMemo(() => [...new Set(assets.map((a) => a.locationGroup))].sort(), [assets]);
  const overrideOptions = useMemo(
    () => [...new Set([WAREHOUSE_LOCATION, ...assets.map((a) => a.locationOverride ?? '').filter(Boolean)])].sort(),
    [assets],
  );

  const onUploadQr = async (asset: AdminAsset, file: File) => {
    setBusyQr(asset.equipmentNumber);
    setRowMessage(null);
    try {
      const target = await uploadAssetQr(asset, file, assets);
      setRowMessage({ eq: asset.equipmentNumber, ok: true, text: `QR tersimpan: ${target}` });
      await load();
    } catch (e) {
      setRowMessage({ eq: asset.equipmentNumber, ok: false, text: errorText(e) });
    } finally {
      setBusyQr(null);
    }
  };

  const onCheckAll = async () => {
    setChecking({ done: 0, total: 0 });
    setCheckResult(null);
    setCheckError(null);
    try {
      const result = await checkAllQr(assets, (done, total) => setChecking({ done, total }));
      setCheckResult(result);
      await load();
    } catch (e) {
      setCheckError(errorText(e));
    } finally {
      setChecking(null);
    }
  };

  const nameOf = (eq: string) => assets.find((a) => a.equipmentNumber === eq)?.name ?? eq;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Peralatan Preventive</h3>
          <p className="text-sm text-slate-500">
            Daftar peralatan PRIMA yang tampil di tab Preventive beserta QR code-nya. Peralatan tidak dihapus, cukup dinonaktifkan.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing({ draft: EMPTY_DRAFT, isNew: true })}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Tambah
          </button>
          <button
            type="button"
            onClick={onCheckAll}
            disabled={loading || checking !== null || assets.length === 0}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            {checking ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ScanLine className="h-4 w-4" aria-hidden="true" />}
            Periksa QR
          </button>
          <button
            type="button"
            onClick={() => void load()}
            aria-label="Muat ulang"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ['Peralatan', stats.total],
          ['Aktif', stats.active],
          ['Gambar QR', stats.withImage],
          ['Isi QR tercatat', stats.recorded],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
            <dt className="text-xs font-semibold text-slate-500">{label}</dt>
            <dd className="text-xl font-bold text-slate-800 tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      {checking && (
        <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          Membaca gambar QR {checking.done}/{checking.total || '…'}
        </p>
      )}
      {checkError && <Notice tone="error">{checkError}</Notice>}
      {checkResult && <CheckReport result={checkResult} nameOf={nameOf} onClose={() => setCheckResult(null)} />}
      {loadError && <Notice tone="error">{loadError}</Notice>}
      {qrError && <Notice tone="warn">{qrError}</Notice>}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
        <label className="relative">
          <span className="sr-only">Cari peralatan</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama, nomor equipment, lokasi" className={`${inputClass} pl-9`} />
        </label>
        <select aria-label="Filter tipe" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={inputClass}>
          <option value="">Semua tipe</option>
          {PREVENTIVE_ASSET_TYPES.map((t) => (
            <option key={t} value={t}>
              {typeLabel(t)}
            </option>
          ))}
        </select>
        <select aria-label="Filter status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className={inputClass}>
          <option value="all">Semua status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
          <option value="no_qr">QR belum lengkap</option>
        </select>
      </div>

      {loading && assets.length === 0 ? (
        <div className="flex justify-center p-10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" aria-hidden="true" />
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-500">
            Menampilkan {visible.length} dari {assets.length} peralatan.
          </p>
          <ul className="space-y-2">
            {visible.map((a) => (
              <AssetRow
                key={a.equipmentNumber}
                asset={a}
                qrUrl={qrUrls[a.equipmentNumber]}
                busy={busyQr === a.equipmentNumber}
                disabled={busyQr !== null || checking !== null}
                message={rowMessage?.eq === a.equipmentNumber ? rowMessage : null}
                onEdit={() =>
                  setEditing({
                    isNew: false,
                    draft: {
                      equipmentNumber: a.equipmentNumber,
                      name: a.name,
                      assetType: a.assetType,
                      locationGroup: a.locationGroup,
                      locationOverride: a.locationOverride ?? '',
                      periods: a.periods,
                      active: a.active,
                    },
                  })
                }
                onUploadQr={(file) => void onUploadQr(a, file)}
              />
            ))}
          </ul>
        </>
      )}

      {editing && (
        <AssetForm
          initial={editing.draft}
          isNew={editing.isNew}
          locationOptions={locationOptions}
          overrideOptions={overrideOptions}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
    </div>
  );
};

const Notice: React.FC<{ tone: 'error' | 'warn'; children: React.ReactNode }> = ({ tone, children }) => (
  <p
    role="alert"
    className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${tone === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}
  >
    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
    <span>{children}</span>
  </p>
);

const AssetRow: React.FC<{
  asset: AdminAsset;
  qrUrl?: string;
  busy: boolean;
  disabled: boolean;
  message: { ok: boolean; text: string } | null;
  onEdit: () => void;
  onUploadQr: (file: File) => void;
}> = ({ asset, qrUrl, busy, disabled, message, onEdit, onUploadQr }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const location = asset.locationOverride ? `${asset.locationOverride} (asal: ${asset.locationGroup})` : asset.locationGroup;
  return (
    <li className={`rounded-xl border bg-white p-3 ${asset.active ? 'border-slate-200' : 'border-slate-200 opacity-70'}`}>
      <div className="flex gap-3">
        <div className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {qrUrl ? (
            <a href={qrUrl} target="_blank" rel="noopener noreferrer" aria-label={`Lihat QR code ${asset.name}`}>
              <img src={thumbUrl(qrUrl)} alt="" loading="lazy" className="h-full w-full object-contain" />
            </a>
          ) : (
            <QrCode className="h-6 w-6 text-slate-300" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug text-slate-800 break-words">{asset.name}</p>
          <p className="font-mono text-xs text-slate-500">{asset.equipmentNumber}</p>
          <p className="mt-0.5 text-xs text-slate-600">
            {typeLabel(asset.assetType)} · {location}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {!asset.active && <Badge tone="slate">Nonaktif</Badge>}
            {!qrUrl && <Badge tone="amber">Gambar QR belum ada</Badge>}
            {qrUrl && !asset.qrTarget && <Badge tone="amber">Isi QR belum diperiksa</Badge>}
            {asset.periods.map((p) => (
              <Badge key={p} tone="blue">
                {p}
              </Badge>
            ))}
          </div>
          {asset.qrTarget && (
            <a
              href={asset.qrTarget}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block truncate text-xs text-blue-700 underline-offset-2 hover:underline"
            >
              {asset.qrTarget}
            </a>
          )}
        </div>
      </div>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" /> Ubah
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 text-sm font-semibold text-blue-800 hover:bg-blue-100 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
          {qrUrl ? 'Ganti QR' : 'Unggah QR'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) onUploadQr(file);
          }}
        />
      </div>
      {message && (
        <p role="status" className={`mt-2 break-all text-xs font-medium ${message.ok ? 'text-green-700' : 'text-red-700'}`}>
          {message.text}
        </p>
      )}
    </li>
  );
};

const BADGE_TONE = {
  slate: 'bg-slate-100 text-slate-700 border-slate-300',
  amber: 'bg-amber-50 text-amber-800 border-amber-300',
  blue: 'bg-blue-50 text-blue-800 border-blue-200',
} as const;

const Badge: React.FC<{ tone: keyof typeof BADGE_TONE; children: React.ReactNode }> = ({ tone, children }) => (
  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${BADGE_TONE[tone]}`}>{children}</span>
);

const CheckReport: React.FC<{ result: QrCheckResult; nameOf: (eq: string) => string; onClose: () => void }> = ({ result, nameOf, onClose }) => {
  const updated = result.toUpdate.length - result.failed.length;
  const problems: [string, string[]][] = [
    ['Belum ada gambar QR', result.noImage],
    ['Gambar ada, QR tidak terbaca', result.unreadable],
    ...result.duplicates.map((d): [string, string[]] => [`QR sama dipakai beberapa peralatan (${d.qrTarget})`, d.equipmentNumbers]),
    ...result.failed.map((f): [string, string[]] => [`Gagal disimpan: ${f.reason}`, [f.equipmentNumber]]),
  ];
  const clean = problems.every(([, eqs]) => eqs.length === 0);
  return (
    <section aria-label="Hasil pemeriksaan QR" className={`rounded-xl border p-3 text-sm ${clean ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-2 font-semibold text-slate-800">
          {clean ? <CheckCircle2 className="h-4 w-4 text-green-700" aria-hidden="true" /> : <AlertTriangle className="h-4 w-4 text-amber-700" aria-hidden="true" />}
          {result.match} cocok · {updated} diperbarui
        </p>
        <button type="button" onClick={onClose} aria-label="Tutup hasil" className="-m-2 inline-flex min-h-11 min-w-11 items-center justify-center text-slate-500">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {problems
        .filter(([, eqs]) => eqs.length > 0)
        .map(([title, eqs]) => (
          <div key={title} className="mt-2">
            <p className="font-semibold text-amber-900 break-all">
              {title}: {eqs.length}
            </p>
            <ul className="ml-4 list-disc text-xs text-slate-700">
              {eqs.map((eq) => (
                <li key={eq}>
                  {nameOf(eq)} <span className="font-mono">({eq})</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </section>
  );
};

const AssetForm: React.FC<{
  initial: AssetDraft;
  isNew: boolean;
  locationOptions: string[];
  overrideOptions: string[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ initial, isNew, locationOptions, overrideOptions, onClose, onSaved }) => {
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof AssetDraft, string>>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const set = <K extends keyof AssetDraft>(k: K, v: AssetDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateAssetDraft(draft);
    if (!v.ok) {
      setErrors(v.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    setSaveError(null);
    try {
      await saveAsset(v.row, isNew);
      onSaved();
    } catch (err) {
      setSaveError(errorText(err));
      setSaving(false);
    }
  };

  const field = (k: keyof AssetDraft, label: string, control: React.ReactNode, hint?: string) => (
    <div>
      <label htmlFor={`pa-${k}`} className="mb-1 block text-sm font-bold text-slate-700">
        {label}
      </label>
      {control}
      {errors[k] ? <p className="mt-1 text-xs font-medium text-red-700">{errors[k]}</p> : hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="pa-title">
      <form onSubmit={onSubmit} className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h4 id="pa-title" className="text-lg font-bold text-slate-800">
            {isNew ? 'Tambah peralatan' : 'Ubah peralatan'}
          </h4>
          <button type="button" onClick={onClose} aria-label="Tutup" className="inline-flex min-h-11 min-w-11 items-center justify-center text-slate-500">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-3">
          {field(
            'equipmentNumber',
            'Nomor equipment',
            <input
              id="pa-equipmentNumber"
              value={draft.equipmentNumber}
              onChange={(e) => set('equipmentNumber', e.target.value)}
              disabled={!isNew}
              placeholder="ESE011000074758"
              autoCapitalize="characters"
              className={`${inputClass} font-mono disabled:bg-slate-100`}
            />,
            isNew ? 'Sama dengan Equipment Number di PRIMA.' : 'Tidak dapat diubah: menjadi kunci foto preventive dan berkas QR.',
          )}
          {field('name', 'Nama peralatan', <input id="pa-name" value={draft.name} onChange={(e) => set('name', e.target.value)} className={inputClass} />)}
          {field(
            'assetType',
            'Tipe',
            <select id="pa-assetType" value={draft.assetType} onChange={(e) => set('assetType', e.target.value)} className={inputClass}>
              <option value="">Pilih tipe</option>
              {PREVENTIVE_ASSET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {typeLabel(t)}
                </option>
              ))}
            </select>,
          )}
          {field(
            'locationGroup',
            'Lokasi',
            <>
              <input id="pa-locationGroup" list="pa-locations" value={draft.locationGroup} onChange={(e) => set('locationGroup', e.target.value)} className={inputClass} />
              <datalist id="pa-locations">
                {locationOptions.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </>,
          )}
          {field(
            'locationOverride',
            'Lokasi pengganti (opsional)',
            <>
              <input id="pa-locationOverride" list="pa-overrides" value={draft.locationOverride} onChange={(e) => set('locationOverride', e.target.value)} className={inputClass} />
              <datalist id="pa-overrides">
                {overrideOptions.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </>,
            `Isi "${WAREHOUSE_LOCATION}" untuk peralatan yang disimpan: tidak dihitung preventif.`,
          )}
          <fieldset>
            <legend className="mb-1 text-sm font-bold text-slate-700">Jadwal PRIMA</legend>
            <div className="flex flex-wrap gap-2">
              {PERIOD_CODES.map((c) => {
                const on = draft.periods.includes(c);
                return (
                  <label key={c} className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-semibold ${on ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-300 text-slate-600'}`}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(e) => set('periods', e.target.checked ? [...draft.periods, c] : draft.periods.filter((p) => p !== c))}
                      className="h-4 w-4"
                    />
                    {c}
                  </label>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-slate-500">D, W, M menentukan tampil di Daily, Weekly, Monthly tab Preventive.</p>
          </fieldset>
          <label className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-300 px-3">
            <input type="checkbox" checked={draft.active} onChange={(e) => set('active', e.target.checked)} className="h-5 w-5" />
            <span className="text-sm font-semibold text-slate-700">Aktif (tampil di tab Preventive)</span>
          </label>
        </div>
        {saveError && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-700">
            {saveError}
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onClose} className="min-h-11 flex-1 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-100">
            Batal
          </button>
          <button type="submit" disabled={saving} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
};
