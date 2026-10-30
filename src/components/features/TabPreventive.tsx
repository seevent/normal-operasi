import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarClock, Camera, CheckSquare, FolderOpen, Loader2, RefreshCw, Search, X } from 'lucide-react';
import { ASSET_TYPE_LABEL, PERIOD_LABEL, PERIOD_RESET_TEXT, PREVENTIVE_PERIODS } from '../../lib/data/preventiveTypes';
import type { PreventiveAssetType, PreventivePeriod } from '../../lib/data/preventiveTypes';
import { groupAssets, groupAssetsByPlace, isPlaceAssetType, summarize } from '../../lib/utils/preventiveGrouping';
import type { PreventiveAsset, RowStatus, StatusFilter } from '../../lib/utils/preventiveGrouping';
import { nextResetAt } from '../../lib/utils/preventivePeriod';
import { photoDateWarning } from '../../lib/utils/photoExif';
import type { SavedEntry } from '../../lib/utils/preventiveStatus';
import { statusOf, usePreventiveStore } from '../../store/usePreventiveStore';
import { PreventiveGroupCard } from './preventive/PreventiveGroupCard';
import type { CardGroup } from './preventive/PreventiveGroupCard';
import { BulkPhotosSheet, OnePhotoManySheet } from './preventive/PreventiveBulkSheets';
import type { AssetOptionGroup, PhotoMeta } from './preventive/PreventiveBulkSheets';

const FOCUS_REFRESH_MIN_GAP_MS = 20_000;
const POLL_MS = 60_000;
const MAX_TIMEOUT_MS = 2_000_000_000;

const FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: 'all', label: 'Semua' },
  { id: 'belum', label: 'Belum' },
  { id: 'gagal', label: 'Gagal' },
  { id: 'tersimpan', label: 'Tersimpan' },
];

const formatReset = (at: Date): string => {
  const parts = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).formatToParts(at);
  const get = (t: string) => parts.find((x) => x.type === t)?.value ?? '';
  return `${get('weekday')} ${get('day')} ${get('month')}, ${get('hour')}.${get('minute')} WIB`;
};

export const TabPreventive: React.FC = () => {
  const { assets, keys, clockOffsetMs, saved, locals, warnings, loadState, loadError, refresh, upload, retry } = usePreventiveStore();
  const [period, setPeriod] = useState<PreventivePeriod>('DAILY');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [open, setOpen] = useState<Set<string>>(new Set());

  // ---- Muat data & jaga tetap segar ----
  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    let last = Date.now();
    const maybeRefresh = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - last < FOCUS_REFRESH_MIN_GAP_MS) return;
      last = Date.now();
      void refresh();
    };
    const poll = window.setInterval(maybeRefresh, POLL_MS);
    window.addEventListener('focus', maybeRefresh);
    document.addEventListener('visibilitychange', maybeRefresh);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener('focus', maybeRefresh);
      document.removeEventListener('visibilitychange', maybeRefresh);
    };
  }, [refresh]);

  // Tepat setelah reset 07.00 berikutnya, ambil kunci periode baru dari server.
  useEffect(() => {
    if (!keys) return;
    const serverNow = Date.now() + clockOffsetMs;
    const delay = nextResetAt('DAILY', new Date(serverNow)).getTime() - serverNow + 1500;
    const id = window.setTimeout(() => void refresh(), Math.min(Math.max(delay, 1000), MAX_TIMEOUT_MS));
    return () => window.clearTimeout(id);
  }, [keys, clockOffsetMs, refresh]);

  // ---- Turunan data ----
  const state = useMemo(() => ({ keys, saved, locals }), [keys, saved, locals]);
  const makeStatusFor = useCallback((p: PreventivePeriod) => (a: PreventiveAsset): RowStatus => statusOf(state, p, a.equipmentNumber), [state]);

  const summaries = useMemo(
    () => Object.fromEntries(PREVENTIVE_PERIODS.map((p) => [p, summarize(assets, p, makeStatusFor(p))])) as Record<PreventivePeriod, ReturnType<typeof summarize>>,
    [assets, makeStatusFor],
  );
  const summary = summaries[period];

  const typeLabel = (assetType: string) => ASSET_TYPE_LABEL[assetType as PreventiveAssetType] ?? assetType;
  // Access Control System tetap per jenis lalu lokasi; peralatan pemeriksaan per tempat lalu jenis.
  const buildCards = useCallback((query: string, filter: StatusFilter): CardGroup[] => {
    const statusFor = makeStatusFor(period);
    const options = { query, filter };
    const byType = groupAssets(assets.filter((a) => !isPlaceAssetType(a.assetType)), period, statusFor, options);
    const byPlace = groupAssetsByPlace(assets, period, statusFor, options);
    return [
      ...byType.map((g) => ({
        key: g.assetType,
        title: typeLabel(g.assetType),
        total: g.total,
        saved: g.saved,
        sectionKind: 'lokasi' as const,
        sections: g.locations.map((l) => ({ key: l.location, label: l.location, total: l.total, saved: l.saved, assets: l.assets })),
      })),
      ...byPlace.map((p) => ({
        key: `tempat:${p.location}`,
        title: p.location,
        total: p.total,
        saved: p.saved,
        sectionKind: 'jenis' as const,
        sections: p.types.map((t) => ({ key: t.assetType, label: typeLabel(t.assetType), total: t.total, saved: t.saved, assets: t.assets })),
      })),
    ];
  }, [assets, period, makeStatusFor]);
  const groups = useMemo(() => buildCards(query, filter), [buildCards, query, filter]);

  // Semua kartu tanpa pencarian/filter: dasar unggah banyak per kartu dan daftar alat yang dicentang.
  const allCards = useMemo(() => buildCards('', 'all'), [buildCards]);
  const allAssets = useMemo(() => allCards.flatMap((c) => c.sections.flatMap((s) => s.assets)), [allCards]);
  // Unggah banyak per tempat: foto hanya dipasangkan ke peralatan di kartu itu.
  const [bulk, setBulk] = useState<{ cardKey: string; files: File[] } | null>(null);
  const bulkCard = bulk ? allCards.find((c) => c.key === bulk.cardKey) : undefined;
  const bulkGroups = useMemo(
    (): AssetOptionGroup[] => (bulkCard ? bulkCard.sections.map((s) => ({ title: s.label, assets: s.assets })) : []),
    [bulkCard],
  );
  const onBulkPick = useCallback((cardKey: string, files: File[]) => setBulk({ cardKey, files }), []);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [onePhoto, setOnePhoto] = useState<File | null>(null);
  useEffect(() => {
    setSelectMode(false);
    setSelected(new Set());
  }, [period]);
  const toggleSelect = useCallback((a: PreventiveAsset) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(a.equipmentNumber)) next.delete(a.equipmentNumber);
      else next.add(a.equipmentNumber);
      return next;
    });
  }, []);
  const selection = useMemo(() => (selectMode ? { selected, toggle: toggleSelect } : null), [selectMode, selected, toggleSelect]);
  const selectedAssets = useMemo(() => allAssets.filter((a) => selected.has(a.equipmentNumber)), [allAssets, selected]);
  const warningFor = useCallback(
    (meta: PhotoMeta) =>
      keys
        ? photoDateWarning(meta.takenAt, keys[period], nextResetAt(period, new Date(Date.now() + clockOffsetMs)).getTime(), { heic: meta.heic, nameRange: meta.nameRange })
        : null,
    [keys, period, clockOffsetMs],
  );
  const sendPairs = useCallback(
    (pairs: Array<{ asset: PreventiveAsset; file: File }>) => pairs.forEach((p) => void upload(period, p.asset, p.file)),
    [upload, period],
  );

  // Hanya foto milik periode berjalan yang boleh tampil sebagai "Lihat foto".
  const currentSaved = useMemo(() => {
    const out: Record<string, SavedEntry> = {};
    if (!keys) return out;
    for (const [k, v] of Object.entries(saved)) if (v.periodKey === keys[k.slice(0, k.indexOf(':')) as PreventivePeriod]) out[k] = v;
    return out;
  }, [saved, keys]);

  const searching = query.trim() !== '' || filter !== 'all';
  const isOpen = (key: string) => searching || open.has(key);
  const toggle = useCallback((key: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);
  const allOpen = groups.length > 0 && groups.every((g) => isOpen(g.key));

  const onPick = useCallback((a: PreventiveAsset, file: File) => void upload(period, a, file), [upload, period]);
  const onRetry = useCallback((a: PreventiveAsset) => retry(period, a), [retry, period]);
  const statusFor = useMemo(() => makeStatusFor(period), [makeStatusFor, period]);

  const percent = summary.total === 0 ? 0 : Math.round((summary.saved / summary.total) * 100);
  const nextReset = keys ? nextResetAt(period, new Date(Date.now() + clockOffsetMs)) : null;
  const ready = loadState === 'ready' && keys !== null;

  return (
    <div className="p-3 sm:p-5 space-y-3.5">
      {/* Sub tab */}
      <div role="tablist" aria-label="Periode preventive" className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1.5 border border-slate-200">
        {PREVENTIVE_PERIODS.map((p) => {
          const s = summaries[p];
          const active = p === period;
          return (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setPeriod(p)}
              className={`min-h-[52px] rounded-xl px-2 py-1.5 flex flex-col items-center justify-center leading-tight transition-all ${
                active ? 'bg-blue-700 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="text-sm font-extrabold">{PERIOD_LABEL[p]}</span>
              <span className={`text-[11px] font-bold tabular-nums ${active ? 'text-blue-100' : 'text-slate-500'}`}>{ready ? `${s.saved}/${s.total}` : '–'}</span>
            </button>
          );
        })}
      </div>

      {/* Ringkasan */}
      <div className="rounded-2xl border border-slate-300 bg-white p-3.5 space-y-2.5">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-2xl font-black text-slate-900 tabular-nums leading-none">
              {ready ? summary.saved : '–'}
              <span className="text-base font-bold text-slate-500"> / {ready ? summary.total : '–'} tersimpan</span>
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <CalendarClock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{PERIOD_RESET_TEXT[period]}</span>
            </p>
            {nextReset && <p className="text-[11px] text-slate-500 ml-5">Berikutnya: {formatReset(nextReset)}</p>}
          </div>
          <button
            type="button"
            onClick={() => void refresh({ reloadAssets: true })}
            disabled={loadState === 'loading'}
            aria-label="Muat ulang data"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loadState === 'loading' ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>
        <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Progres foto tersimpan">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} />
        </div>
        {ready && (summary.failed > 0 || summary.uploading > 0) && (
          <p className="text-xs font-bold">
            {summary.failed > 0 && <span className="text-red-700">{summary.failed} gagal tersimpan</span>}
            {summary.failed > 0 && summary.uploading > 0 && <span className="text-slate-400"> · </span>}
            {summary.uploading > 0 && <span className="text-blue-700">{summary.uploading} sedang diunggah</span>}
          </p>
        )}
      </div>

      {/* 1 foto untuk beberapa peralatan; unggah banyak foto ada di tiap kartu tempat */}
      <div>
        <button
          type="button"
          disabled={!ready}
          aria-pressed={selectMode}
          onClick={() => {
            setSelectMode((v) => !v);
            setSelected(new Set());
          }}
          className={`min-h-[48px] rounded-xl border-2 text-[13px] font-bold flex items-center justify-center gap-1.5 px-2 disabled:opacity-50 ${
            selectMode ? 'bg-blue-50 border-blue-700 text-blue-900' : 'border-blue-700 text-blue-800 bg-white hover:bg-blue-50'
          } w-full`}
        >
          <CheckSquare className="w-4 h-4 shrink-0" aria-hidden="true" />
          {selectMode ? 'Batal pilih' : '1 foto → beberapa'}
        </button>
      </div>
      {selectMode && (
        <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-900">
          Centang peralatan yang terlihat di satu foto (bisa dari beberapa tempat), lalu ambil atau pilih fotonya di bawah.
        </p>
      )}

      {/* Cari & filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama, nomor, atau lokasi"
            aria-label="Cari peralatan"
            style={{ fontSize: '16px' }}
            className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-white pl-9 pr-11 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Hapus pencarian"
              className="absolute right-0.5 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {FILTERS.map((f) => {
            const count = f.id === 'all' ? summary.total : f.id === 'belum' ? summary.total - summary.saved : f.id === 'gagal' ? summary.failed : summary.saved;
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={active}
                className={`min-h-[48px] rounded-xl border px-1 py-1 flex flex-col items-center justify-center leading-tight transition-colors ${
                  active ? 'bg-blue-700 text-white border-blue-800 shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-bold">{f.label}</span>
                <span className={`text-[11px] font-semibold tabular-nums ${active ? 'text-blue-100' : f.id === 'gagal' && count > 0 ? 'text-red-700' : 'text-slate-500'}`}>{ready ? count : '–'}</span>
              </button>
            );
          })}
        </div>
        {!searching && groups.length > 0 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(allOpen ? new Set() : new Set(groups.map((g) => g.key)))}
              className="min-h-[44px] px-2 text-xs font-bold text-blue-700 hover:text-blue-900"
            >
              {allOpen ? 'Tutup semua' : 'Buka semua'}
            </button>
          </div>
        )}
      </div>

      {/* Status muat */}
      {loadState === 'error' && (
        <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-3.5 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-red-800">{loadError ?? 'Data tidak dapat dimuat.'}</p>
            <button type="button" onClick={() => void refresh({ reloadAssets: true })} className="mt-2 min-h-[44px] rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700">
              Coba lagi
            </button>
          </div>
        </div>
      )}
      {ready && loadError && (
        <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
          Pembaruan terakhir gagal ({loadError}). Status yang tampil mungkin belum terbaru.
        </p>
      )}
      {(loadState === 'loading' || loadState === 'idle') && !ready && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm font-semibold text-slate-600">
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          Memuat daftar peralatan…
        </div>
      )}

      {/* Daftar */}
      {ready && groups.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white py-10 text-center text-sm font-medium text-slate-500">
          {searching ? 'Tidak ada peralatan yang cocok dengan pencarian atau filter ini.' : 'Tidak ada peralatan terjadwal pada periode ini.'}
        </p>
      )}
      {ready && (
        <div className="space-y-2.5">
          {groups.map((g) => (
            <PreventiveGroupCard
              key={`${period}-${g.key}`}
              period={period}
              group={g}
              open={isOpen(g.key)}
              onToggle={toggle}
              statusFor={statusFor}
              saved={currentSaved}
              locals={locals}
              warnings={warnings}
              disabled={!ready}
              onPick={onPick}
              onRetry={onRetry}
              selection={selection}
              onBulkPick={onBulkPick}
            />
          ))}
        </div>
      )}

      {selectMode && (
        <>
          <div className="h-28" aria-hidden="true" />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-slate-300 shadow-[0_-4px_16px_rgba(0,0,0,0.12)] px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto max-w-2xl">
              <p className="text-xs font-bold text-slate-700 mb-2">{selected.size} peralatan dipilih</p>
              <div className="flex gap-2">
                {[
                  { label: 'Ambil 1 foto', icon: <Camera className="w-4 h-4" aria-hidden="true" />, capture: true, className: 'bg-blue-700 text-white' },
                  { label: 'Pilih file', icon: <FolderOpen className="w-4 h-4" aria-hidden="true" />, capture: false, className: 'border border-slate-300 bg-white text-slate-800' },
                ].map((b) => (
                  <label
                    key={b.label}
                    className={`flex-1 min-h-[48px] rounded-xl text-sm font-extrabold flex items-center justify-center gap-1.5 ${b.className} ${
                      selected.size > 0 ? 'cursor-pointer' : 'opacity-50 pointer-events-none'
                    }`}
                  >
                    {b.icon}
                    {b.label}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      {...(b.capture ? { capture: 'environment' as const } : {})}
                      className="hidden"
                      aria-label={`${b.label} untuk ${selected.size} peralatan`}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (file) setOnePhoto(file);
                      }}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {bulk && bulkCard && (
        <BulkPhotosSheet
          title={`Unggah banyak foto · ${bulkCard.title}`}
          files={bulk.files}
          optionGroups={bulkGroups}
          warningFor={warningFor}
          onSend={sendPairs}
          statusFor={statusFor}
          isSaved={(a) => statusFor(a) === 'saved'}
          onRetry={onRetry}
          onClose={() => setBulk(null)}
        />
      )}
      {onePhoto && (
        <OnePhotoManySheet
          file={onePhoto}
          assets={selectedAssets}
          warningFor={warningFor}
          onSend={sendPairs}
          statusFor={statusFor}
          isSaved={(a) => statusFor(a) === 'saved'}
          onRetry={onRetry}
          onClose={() => {
            setOnePhoto(null);
            setSelectMode(false);
            setSelected(new Set());
          }}
        />
      )}
    </div>
  );
};
