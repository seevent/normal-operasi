import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, Loader2, Plus, Save, Trash2, Undo2 } from 'lucide-react';
import { toTitleCase } from '../../../lib/data/masterData';
import { getErrorMessage } from '../../../lib/utils/errorUtils';
import { sayPet } from '../../../store/useAppStore';
import type { Personel } from '../../../lib/types';

export type PersonelRecord = Personel;

/** Baris editor: `_k` hanya untuk key React dan tidak pernah ikut disimpan. */
interface Row {
  _k: number;
  data: PersonelRecord;
}

export type Accent = 'blue' | 'teal';

export interface PersonelSectionProps {
  title: string;
  subtitle: string;
  accent: Accent;
  jabatanOptions: string[];
  /** Data dari store (sudah terurut menurut jabatan). */
  source: PersonelRecord[];
  /** Menyimpan ke store lalu ke database, mengembalikan data terbaru dari store; melempar bila gagal. */
  onSave: (rows: PersonelRecord[]) => Promise<PersonelRecord[]>;
}

const ACCENT: Record<Accent, { bar: string; badge: string; addBtn: string; head: string }> = {
  blue: {
    bar: 'border-l-blue-500',
    badge: 'bg-blue-100 text-blue-700',
    addBtn: 'border-blue-300 text-blue-600 hover:bg-blue-50',
    head: 'bg-blue-50/60',
  },
  teal: {
    bar: 'border-l-teal-500',
    badge: 'bg-teal-100 text-teal-700',
    addBtn: 'border-teal-300 text-teal-700 hover:bg-teal-50',
    head: 'bg-teal-50/60',
  },
};

const fieldClass =
  'w-full min-w-0 p-2.5 border border-slate-300 rounded-lg text-base sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

let rowKey = 0;
const toRows = (list: PersonelRecord[]): Row[] => list.map((data) => ({ _k: ++rowKey, data: { ...data } }));
const toRecords = (rows: Row[]): PersonelRecord[] => rows.map((r) => r.data);
const sameData = (rows: Row[], source: PersonelRecord[]) => JSON.stringify(toRecords(rows)) === JSON.stringify(source);

export const PersonelSection: React.FC<PersonelSectionProps> = ({
  title,
  subtitle,
  accent,
  jabatanOptions,
  source,
  onSave,
}) => {
  const a = ACCENT[accent];
  const [rows, setRows] = useState<Row[]>(() => toRows(source));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const dirty = !sameData(rows, source);

  // Muat ulang saat data store berubah (mis. sinkron Supabase selesai) — hanya bila editor masih bersih,
  // supaya suntingan yang belum disimpan tidak tertimpa.
  const prevSourceRef = useRef(source);
  useEffect(() => {
    const prev = prevSourceRef.current;
    prevSourceRef.current = source;
    if (prev !== source && sameData(rowsRef.current, prev)) setRows(toRows(source));
  }, [source]);

  const patchRow = (k: number, patch: Partial<PersonelRecord>) =>
    setRows((rs) => rs.map((r) => (r._k === k ? { ...r, data: { ...r.data, ...patch } } : r)));

  const move = (index: number, dir: -1 | 1) =>
    setRows((rs) => {
      const j = index + dir;
      if (j < 0 || j >= rs.length) return rs;
      const next = [...rs];
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });

  const remove = (index: number) => {
    const name = rows[index].data.name?.trim();
    if (name && !window.confirm(`Hapus ${name} dari daftar ${title}?`)) return;
    setRows((rs) => rs.filter((_, i) => i !== index));
  };

  const add = () => setRows((rs) => [...rs, ...toRows([{ name: '', phone: '', jabatan: '', nik: '' }])]);

  const handleSave = async () => {
    setSaving(true);
    try {
      setRows(toRows(await onSave(toRecords(rows))));
      setSavedAt(Date.now());
      sayPet(`Data ${title} tersimpan. Clear!`, 'success');
    } catch (err) {
      console.error('Error saving personel:', err);
      sayPet(`Gagal menyimpan ${title}: ${getErrorMessage(err)}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const status = dirty ? 'Belum disimpan' : savedAt ? 'Tersimpan' : null;

  return (
    <section className={`bg-white rounded-xl border border-slate-200 border-l-4 ${a.bar} shadow-sm overflow-clip`}>
      <header className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-3.5 py-3 border-b border-slate-200 ${a.head}`}>
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.badge}`}>{rows.length} orang</span>
        {status && (
          <span
            className={`ml-auto inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
              dirty ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {!dirty && <CheckCircle2 className="w-3.5 h-3.5" />}
            {status}
          </span>
        )}
        <p className="basis-full text-xs text-slate-500">{subtitle}</p>
      </header>

      <div className="p-2.5 sm:p-4 space-y-2.5">
        {rows.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-6">Belum ada personel. Tambahkan lewat tombol di bawah.</p>
        )}

        {rows.map((row, index) => (
          <div key={row._k} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 sm:grid sm:grid-cols-[1.5rem_minmax(0,2fr)_9.5rem_9rem_10rem_auto] sm:items-center">
            <div className="flex items-center gap-2 sm:contents">
              <span className="text-xs font-bold text-slate-400 w-5 text-center shrink-0 sm:w-auto">{index + 1}</span>
              <input
                className={`${fieldClass} flex-1 font-semibold`}
                placeholder="Nama personel"
                aria-label={`Nama personel ${index + 1}`}
                value={row.data.name || ''}
                onChange={(e) => patchRow(row._k, { name: toTitleCase(e.target.value) })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:contents">
              <select
                className={fieldClass}
                aria-label={`Jabatan ${index + 1}`}
                value={row.data.jabatan || ''}
                onChange={(e) => patchRow(row._k, { jabatan: e.target.value })}
              >
                <option value="">-- Jabatan --</option>
                {jabatanOptions.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
                {row.data.jabatan && !jabatanOptions.includes(row.data.jabatan) && (
                  <option value={row.data.jabatan}>{row.data.jabatan}</option>
                )}
              </select>
              <input
                className={fieldClass}
                placeholder="NIK"
                inputMode="numeric"
                aria-label={`NIK ${index + 1}`}
                value={row.data.nik || ''}
                onChange={(e) => patchRow(row._k, { nik: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-1.5 sm:contents">
              <input
                className={`${fieldClass} flex-1`}
                placeholder="No. WA"
                inputMode="tel"
                aria-label={`No. WA ${index + 1}`}
                value={row.data.phone || ''}
                onChange={(e) => patchRow(row._k, { phone: e.target.value })}
              />
              <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Naikkan urutan ${index + 1}`}
                className="shrink-0 p-2.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 rounded-lg"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === rows.length - 1}
                aria-label={`Turunkan urutan ${index + 1}`}
                className="shrink-0 p-2.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 rounded-lg"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={`Hapus personel ${index + 1}`}
                className="shrink-0 p-2.5 text-rose-500 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={add}
          className={`w-full py-2.5 border-2 border-dashed font-bold text-sm rounded-lg flex items-center justify-center gap-1.5 ${a.addBtn}`}
        >
          <Plus className="w-4 h-4" /> Tambah Personel
        </button>

        <div className="pt-2.5 border-t border-slate-200 flex justify-end gap-2">
          {dirty && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Batalkan semua perubahan yang belum disimpan?')) setRows(toRows(source));
              }}
              className="px-3.5 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5"
            >
              <Undo2 className="w-4 h-4" /> Batalkan
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg flex items-center gap-1.5"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </section>
  );
};
