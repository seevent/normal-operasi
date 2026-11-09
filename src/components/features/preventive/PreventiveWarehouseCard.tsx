import React from 'react';
import { ChevronDown, QrCode, Warehouse } from 'lucide-react';
import type { PreventiveAsset, WarehouseGroup } from '../../../lib/utils/preventiveGrouping';

interface Props {
  group: WarehouseGroup;
  open: boolean;
  onToggle: () => void;
  typeLabel: (assetType: string) => string;
  /** Nomor equipment → URL gambar QR code di Cloudinary. */
  qrUrls: Record<string, string>;
}

/**
 * Area peralatan di gudang. Warna amber membedakannya dari kartu tempat yang dihitung preventif;
 * tanpa progres dan tanpa tombol foto karena aset gudang tidak dihitung untuk preventif.
 */
export const PreventiveWarehouseCard: React.FC<Props> = ({ group, open, onToggle, typeLabel, qrUrls }) => {
  return (
    <section className="rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="prev-gudang"
        className="w-full min-h-[56px] flex items-center gap-3 px-3.5 py-2.5 text-left bg-amber-100 hover:bg-amber-200/70 transition-colors"
      >
        <Warehouse className="w-5 h-5 text-amber-800 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-extrabold text-amber-950 leading-tight">Gudang</h3>
          <p className="mt-0.5 text-xs font-semibold text-amber-800">Tidak dihitung preventif</p>
        </div>
        <span className="rounded-full border border-amber-400 bg-white px-2 py-0.5 text-xs font-bold tabular-nums text-amber-900 shrink-0">{group.total} unit</span>
        <ChevronDown className={`w-5 h-5 text-amber-700 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div id="prev-gudang" className="border-t border-amber-300">
          {group.types.map((t) => (
            <div key={t.assetType}>
              <div className="flex items-center justify-between gap-2 bg-amber-100/60 px-3.5 py-1.5 border-b border-amber-200">
                <h4 className="text-xs font-extrabold uppercase tracking-wide text-amber-900 truncate">{typeLabel(t.assetType)}</h4>
                <span className="text-[11px] font-bold tabular-nums text-amber-900 shrink-0">{t.assets.length}</span>
              </div>
              <ul>
                {t.assets.map((asset: PreventiveAsset) => (
                  <li key={asset.equipmentNumber} className="px-3.5 py-3 border-t border-amber-200 first:border-t-0">
                    <p className="text-sm font-bold text-slate-900 leading-snug break-words">{asset.name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-mono text-[11px] text-slate-600 tracking-tight">{asset.equipmentNumber}</span>
                      <span className="text-[11px] font-medium text-slate-600">Lokasi PRIMA: {asset.locationGroup}</span>
                      {qrUrls[asset.equipmentNumber] && (
                        <a
                          href={qrUrls[asset.equipmentNumber]}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Lihat QR code ${asset.name}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 underline-offset-2 hover:underline"
                        >
                          <QrCode className="w-3 h-3" aria-hidden="true" />
                          QR code
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
