import { create } from 'zustand';
import { sayPet } from './useAppStore';
import { fetchPhotoLog, fetchPreventiveAssets, fetchServerClock } from '../lib/services/preventiveDataService';
import { PreventiveUploadError, uploadPreventivePhoto } from '../lib/services/preventivePhotoService';
import type { PreventivePeriod } from '../lib/data/preventiveTypes';
import type { PreventiveAsset, RowStatus } from '../lib/utils/preventiveGrouping';
import { createLimiter } from '../lib/utils/preventiveImage';
import { EXIF_READ_BYTES, photoDateWarning, readExifTakenAt } from '../lib/utils/photoExif';
import { nextResetAt } from '../lib/utils/preventivePeriod';
import { buildSavedMap, deriveStatus, pruneStaleLocals, rowKey } from '../lib/utils/preventiveStatus';
import type { LocalEntry, PeriodKeys, SavedEntry } from '../lib/utils/preventiveStatus';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

interface PreventiveState {
  assets: PreventiveAsset[];
  keys: PeriodKeys | null;
  /** server = perangkat + clockOffsetMs. Dipakai menghitung kapan reset 07.00 berikutnya. */
  clockOffsetMs: number;
  saved: Record<string, SavedEntry>;
  locals: Record<string, LocalEntry>;
  /** Peringatan tanggal foto per baris (tidak memblokir); hanya di memori halaman. */
  warnings: Record<string, string>;
  loadState: LoadState;
  loadError: string | null;

  refresh: (opts?: { reloadAssets?: boolean }) => Promise<void>;
  upload: (period: PreventivePeriod, asset: PreventiveAsset, file: Blob) => Promise<void>;
  /** false bila berkasnya sudah tidak ada di memori (mis. halaman dimuat ulang): UI lalu meminta foto lagi. */
  retry: (period: PreventivePeriod, asset: PreventiveAsset) => Promise<boolean>;
}

/**
 * Berkas yang gagal diunggah disimpan HANYA di memori halaman agar Retry tidak meminta foto lagi.
 * Sengaja tidak disimpan ke localStorage/antrean: tanpa fallback, muat ulang halaman = kembali ke Upload.
 */
const pendingFiles = new Map<string, Blob>();
let refreshInFlight: Promise<void> | null = null;
/** Kompresi foto berat di memori ponsel dan jaringan lapangan tidak stabil: maksimal 2 foto diproses bersamaan. */
const limitUploads = createLimiter(2);

export const statusOf = (s: Pick<PreventiveState, 'keys' | 'saved' | 'locals'>, period: PreventivePeriod, equipmentNumber: string): RowStatus => {
  if (!s.keys) return 'idle';
  const k = rowKey(period, equipmentNumber);
  return deriveStatus(s.locals[k], s.saved[k], s.keys[period]);
};

export const usePreventiveStore = create<PreventiveState>((set, get) => ({
  assets: [],
  keys: null,
  clockOffsetMs: 0,
  saved: {},
  locals: {},
  warnings: {},
  loadState: 'idle',
  loadError: null,

  refresh: async (opts) => {
    if (refreshInFlight) return refreshInFlight;
    const run = async () => {
      if (get().loadState !== 'ready') set({ loadState: 'loading', loadError: null });
      try {
        const needAssets = opts?.reloadAssets || get().assets.length === 0;
        const clock = await fetchServerClock();
        const [rows, assets] = await Promise.all([fetchPhotoLog(clock.keys), needAssets ? fetchPreventiveAssets() : Promise.resolve(get().assets)]);
        const fresh = buildSavedMap(rows, clock.keys);
        set((s) => {
          // Foto yang baru saja tersimpan di perangkat ini mungkin belum terbaca pada pembacaan log di atas.
          const merged = { ...fresh };
          for (const [k, prev] of Object.entries(s.saved)) {
            const period = k.slice(0, k.indexOf(':')) as PreventivePeriod;
            if (prev.periodKey !== clock.keys[period]) continue;
            const cur = merged[k];
            if (!cur || cur.version < prev.version) merged[k] = prev;
          }
          const locals = pruneStaleLocals(s.locals, clock.keys);
          for (const k of [...pendingFiles.keys()]) if (!locals[k]) pendingFiles.delete(k);
          return { assets, keys: clock.keys, clockOffsetMs: clock.offsetMs, saved: merged, locals, loadState: 'ready', loadError: null };
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Data Preventive tidak dapat dimuat.';
        // Data lama tetap ditampilkan bila sudah pernah berhasil dimuat; galat hanya ditandai.
        set((s) => ({ loadState: s.keys ? 'ready' : 'error', loadError: message }));
      }
    };
    refreshInFlight = run().finally(() => {
      refreshInFlight = null;
    });
    return refreshInFlight;
  },

  upload: async (period, asset, file) => {
    const { keys } = get();
    if (!keys) return;
    const k = rowKey(period, asset.equipmentNumber);
    if (get().locals[k]?.status === 'uploading') return;
    const startKey = keys[period];

    pendingFiles.set(k, file);
    set((s) => ({ locals: { ...s.locals, [k]: { status: 'uploading', periodKey: startKey } } }));

    // Hanya peringatan: tanggal EXIF dibaca dari berkas asli sebelum kompresi membuangnya. Gagal membaca tidak menghalangi unggahan.
    let warning: string | null = null;
    try {
      const head = await file.slice(0, EXIF_READ_BYTES).arrayBuffer();
      const nextReset = nextResetAt(period, new Date(Date.now() + get().clockOffsetMs)).getTime();
      warning = photoDateWarning(readExifTakenAt(head), startKey, nextReset);
    } catch {
      warning = null;
    }
    set((s) => {
      const { [k]: _old, ...rest } = s.warnings;
      return { warnings: warning ? { ...rest, [k]: warning } : rest };
    });

    try {
      const result = await limitUploads(() => uploadPreventivePhoto(period, asset.equipmentNumber, file));
      pendingFiles.delete(k);
      set((s) => {
        const { [k]: _done, ...rest } = s.locals;
        return {
          locals: rest,
          saved: {
            ...s.saved,
            [k]: { periodKey: result.periodKey, version: result.version, secureUrl: result.secureUrl, uploadedAt: new Date().toISOString() },
          },
        };
      });
      sayPet(`Foto ${asset.name} tersimpan.`, 'success');
    } catch (e) {
      const base = e instanceof PreventiveUploadError || e instanceof Error ? e.message : 'Foto gagal tersimpan.';
      const hadPhoto = Boolean(get().saved[k]);
      const error = hadPhoto ? `${base} Foto sebelumnya tetap tersimpan.` : base;
      set((s) => ({ locals: { ...s.locals, [k]: { status: 'failed', periodKey: startKey, error } } }));
      sayPet(`Foto ${asset.name} gagal tersimpan. ${error}`, 'error');
    }
  },

  retry: async (period, asset) => {
    const k = rowKey(period, asset.equipmentNumber);
    const file = pendingFiles.get(k);
    if (!file) return false;
    await get().upload(period, asset, file);
    return true;
  },
}));
