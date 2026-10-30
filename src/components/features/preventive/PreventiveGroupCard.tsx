import React from 'react';
import { CheckCircle2, ChevronDown, MapPin, ScanLine } from 'lucide-react';
import type { PreventivePeriod } from '../../../lib/data/preventiveTypes';
import type { PreventiveAsset, RowStatus } from '../../../lib/utils/preventiveGrouping';
import { rowKey } from '../../../lib/utils/preventiveStatus';
import type { LocalEntry, SavedEntry } from '../../../lib/utils/preventiveStatus';
import { PreventiveAssetRow } from './PreventiveAssetRow';

export interface CardSection {
  key: string;
  label: string;
  total: number;
  saved: number;
  assets: PreventiveAsset[];
}

/**
 * Satu kartu yang bisa dibuka/tutup. Access Control System: judul jenis, bagian per lokasi.
 * Peralatan pemeriksaan: judul tempat, bagian per jenis peralatan.
 */
export interface CardGroup {
  key: string;
  title: string;
  total: number;
  saved: number;
  sectionKind: 'lokasi' | 'jenis';
  sections: CardSection[];
}

interface Props {
  period: PreventivePeriod;
  group: CardGroup;
  open: boolean;
  onToggle: (assetType: string) => void;
  statusFor: (asset: PreventiveAsset) => RowStatus;
  saved: Record<string, SavedEntry>;
  locals: Record<string, LocalEntry>;
  warnings: Record<string, string>;
  disabled: boolean;
  onPick: (asset: PreventiveAsset, file: File) => void;
  onRetry: (asset: PreventiveAsset) => Promise<boolean>;
  /** Mode "1 foto → beberapa": alat yang dicentang (kunci = nomor equipment). */
  selection?: { selected: Set<string>; toggle: (asset: PreventiveAsset) => void } | null;
}

const percent = (saved: number, total: number): number => (total === 0 ? 0 : Math.round((saved / total) * 100));

export const PreventiveGroupCard: React.FC<Props> = ({ period, group, open, onToggle, statusFor, saved, locals, warnings, disabled, onPick, onRetry, selection }) => {
  const label = group.title;
  const complete = group.total > 0 && group.saved === group.total;
  const panelId = `prev-${period}-${group.key.replace(/[^A-Za-z0-9]+/g, '-')}`;
  const SectionIcon = group.sectionKind === 'lokasi' ? MapPin : ScanLine;

  return (
    <section className="rounded-2xl border border-slate-300 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(group.key)}
        aria-expanded={open}
        aria-controls={panelId}
        className={`w-full min-h-[56px] flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${complete ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-slate-50 hover:bg-slate-100'}`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">{label}</h3>
            {complete && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-label="Semua tersimpan" />}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-slate-200 overflow-hidden" aria-hidden="true">
              <div className={`h-full rounded-full transition-all ${complete ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${percent(group.saved, group.total)}%` }} />
            </div>
            <span className="text-xs font-bold tabular-nums text-slate-700 shrink-0">
              {group.saved}/{group.total}
            </span>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div id={panelId} className="border-t border-slate-300">
          {group.sections.map((loc) => (
            <div key={loc.key}>
              <div className="flex items-center justify-between gap-2 bg-blue-50/70 px-3.5 py-1.5 border-b border-slate-200">
                <h4 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-blue-900 min-w-0">
                  <SectionIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{loc.label}</span>
                </h4>
                <span className="text-[11px] font-bold tabular-nums text-blue-900 shrink-0">
                  {loc.saved}/{loc.total}
                </span>
              </div>
              <ul>
                {loc.assets.map((asset) => {
                  const k = rowKey(period, asset.equipmentNumber);
                  return (
                    <PreventiveAssetRow
                      key={asset.equipmentNumber}
                      asset={asset}
                      status={statusFor(asset)}
                      error={locals[k]?.error}
                      saved={saved[k]}
                      warning={warnings[k]}
                      disabled={disabled}
                      onPick={onPick}
                      onRetry={onRetry}
                      selectable={!!selection}
                      selected={selection?.selected.has(asset.equipmentNumber)}
                      onToggleSelect={selection?.toggle}
                    />
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
