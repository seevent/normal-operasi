import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, Loader2, ScanLine } from 'lucide-react';
import { useMasterDataStore } from '../../../store/useMasterDataStore';
import { buildTipLocations, type TipLocation } from '../../../lib/utils/tipEquipment';

type SaveState = { status: 'idle' | 'saving' | 'saved' | 'error'; text?: string };

/**
 * Tab Data › Config TIP: centang unit X-Ray (dari kategori X-RAY di Checklist Config) yang tampil di tab TIP.
 * Yang disimpan adalah kunci unit yang DISEMBUNYIKAN, sehingga X-Ray baru di Checklist otomatis ikut tampil.
 */
export const TipEquipmentConfig: React.FC = () => {
  const checklistDataMaster = useMasterDataStore((s) => s.checklistDataMaster);
  const tipHiddenKeys = useMasterDataStore((s) => s.tipHiddenKeys);
  const setTipHiddenKeys = useMasterDataStore((s) => s.setTipHiddenKeys);
  const [save, setSave] = useState<SaveState>({ status: 'idle' });
  const seqRef = useRef(0);
  const savedRef = useRef<string[]>(tipHiddenKeys);
  // Sampai ada simpanan pertama di panel ini, "terakhir tersimpan" mengikuti nilai dari server.
  useEffect(() => {
    if (seqRef.current === 0) savedRef.current = tipHiddenKeys;
  }, [tipHiddenKeys]);

  const locations = useMemo(() => buildTipLocations(checklistDataMaster), [checklistDataMaster]);
  const hidden = useMemo(() => new Set(tipHiddenKeys), [tipHiddenKeys]);
  const totalUnits = locations.reduce((n, loc) => n + loc.units.length, 0);
  const shownUnits = locations.reduce((n, loc) => n + loc.units.filter((u) => !hidden.has(u.key)).length, 0);

  /** Simpan daftar baru; bila gagal, centang kembali ke keadaan yang terakhir tersimpan. */
  const persist = async (next: string[]) => {
    const seq = ++seqRef.current;
    setSave({ status: 'saving' });
    const ok = await setTipHiddenKeys(next);
    if (seq !== seqRef.current) return;
    if (ok) {
      savedRef.current = next;
      setSave({ status: 'saved' });
    } else {
      useMasterDataStore.setState({ tipHiddenKeys: savedRef.current });
      setSave({ status: 'error', text: 'Gagal menyimpan. Centang dikembalikan; periksa koneksi lalu coba lagi.' });
    }
  };

  // Kunci yang tidak dikenal (unit yang sedang tidak ada di Checklist) tetap disimpan apa adanya.
  const setShown = (keys: string[], show: boolean) => {
    const next = new Set(tipHiddenKeys);
    keys.forEach((k) => (show ? next.delete(k) : next.add(k)));
    void persist([...next]);
  };

  const locationButtons = (loc: TipLocation) => {
    const keys = loc.units.map((u) => u.key);
    const shown = keys.filter((k) => !hidden.has(k)).length;
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 tabular-nums">
          {shown} dari {keys.length}
        </span>
        <button
          type="button"
          onClick={() => setShown(keys, true)}
          disabled={shown === keys.length}
          className="min-h-[36px] px-3 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
        >
          Semua
        </button>
        <button
          type="button"
          onClick={() => setShown(keys, false)}
          disabled={shown === 0}
          className="min-h-[36px] px-3 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
        >
          Kosongkan
        </button>
      </div>
    );
  };

  return (
    <div>
      <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-wrap justify-between items-start gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-blue-600" /> Peralatan TIP
          </h3>
          <p className="text-sm text-slate-500">
            Centang X-Ray yang tampil di tab TIP. Daftar diambil dari kategori X-RAY di Checklist Config; X-Ray baru otomatis ikut
            tampil.
          </p>
          <p className="text-sm font-bold text-slate-700 mt-1">
            {shownUnits} dari {totalUnits} tampil di tab TIP
          </p>
        </div>
        <div className="min-h-[28px]" aria-live="polite">
          {save.status === 'saving' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan…
            </span>
          )}
          {save.status === 'saved' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              <CheckCircle className="w-3.5 h-3.5" /> Tersimpan
            </span>
          )}
          {save.status === 'error' && (
            <span role="alert" className="inline-flex text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
              {save.text}
            </span>
          )}
        </div>
      </div>

      {locations.length === 0 ? (
        <p className="p-8 text-center text-slate-500 italic">Belum ada X-Ray di Checklist Config.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {locations.map((loc) => (
            <section key={loc.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h4 className="font-bold text-slate-800">{loc.name}</h4>
                {locationButtons(loc)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                {loc.units.map((unit) => {
                  const shown = !hidden.has(unit.key);
                  return (
                    <label
                      key={unit.key}
                      className={`flex items-center gap-3 min-h-[44px] px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                        shown ? 'border-blue-200 bg-blue-50/60' : 'border-slate-200 bg-white text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={shown}
                        onChange={(e) => setShown([unit.key], e.target.checked)}
                        className="w-5 h-5 accent-blue-600 shrink-0"
                      />
                      <span className="min-w-0">
                        <span className={`block text-sm font-bold ${shown ? 'text-slate-800' : 'text-slate-400'}`}>{unit.label}</span>
                        <span className="block text-xs truncate" title={unit.name}>
                          {unit.name}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
