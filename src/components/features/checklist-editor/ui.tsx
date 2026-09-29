import React from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useChecklistEditor } from './EditorContext';

/** 16px di layar kecil agar iOS Safari tidak memperbesar halaman saat kolom difokuskan. */
export const inputClass =
  'w-full min-w-0 px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-base sm:text-sm text-slate-800 ' +
  'placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none';

export const Field: React.FC<{ label: string; hint?: React.ReactNode; children: React.ReactNode }> = ({
  label,
  hint,
  children,
}) => (
  <label className="block min-w-0">
    <span className="block text-sm font-semibold text-slate-700 mb-1">{label}</span>
    {children}
    {hint && <span className="block text-xs text-slate-500 mt-1 leading-snug">{hint}</span>}
  </label>
);

export const Chevron: React.FC<{ open: boolean }> = ({ open }) =>
  open ? <ChevronDown className="w-5 h-5 shrink-0" /> : <ChevronRight className="w-5 h-5 shrink-0" />;

interface ActionBarProps {
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  deleteLabel?: string;
}

const actionButton =
  'inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 rounded-lg text-sm font-semibold ' +
  'transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

/** Naik / Turun / Hapus dalam satu baris di dasar kartu, bukan kolom sempit di sisi kanan. */
export const ActionBar: React.FC<ActionBarProps> = ({
  onMoveUp,
  onMoveDown,
  onDelete,
  canMoveUp,
  canMoveDown,
  deleteLabel = 'Hapus',
}) => {
  const { canReorder } = useChecklistEditor();
  const lockedTitle = canReorder ? undefined : 'Hapus pencarian untuk mengubah urutan';

  return (
    <div className="flex items-center gap-2 pt-1">
      <button
        type="button"
        onClick={onMoveUp}
        disabled={!canReorder || !canMoveUp}
        title={lockedTitle}
        className={`${actionButton} bg-slate-100 text-slate-700 hover:bg-slate-200`}
      >
        <ArrowUp className="w-4 h-4" /> Naik
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={!canReorder || !canMoveDown}
        title={lockedTitle}
        className={`${actionButton} bg-slate-100 text-slate-700 hover:bg-slate-200`}
      >
        <ArrowDown className="w-4 h-4" /> Turun
      </button>
      <div className="flex-1" />
      <button type="button" onClick={onDelete} className={`${actionButton} bg-rose-50 text-rose-600 hover:bg-rose-100`}>
        <Trash2 className="w-4 h-4" /> {deleteLabel}
      </button>
    </div>
  );
};

const addTones = {
  blue: 'border-blue-300 text-blue-600 hover:bg-blue-50',
  purple: 'border-purple-300 text-purple-600 hover:bg-purple-50',
  emerald: 'border-emerald-300 text-emerald-600 hover:bg-emerald-50',
  indigo: 'border-indigo-300 text-indigo-600 hover:bg-indigo-50',
} as const;

export const AddButton: React.FC<{ onClick: () => void; tone: keyof typeof addTones; children: React.ReactNode }> = ({
  onClick,
  tone,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full min-h-[44px] px-3 border-2 border-dashed rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${addTones[tone]}`}
  >
    <Plus className="w-4 h-4 shrink-0" /> {children}
  </button>
);

export const EmptyHint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm text-slate-400 italic px-1 py-2">{children}</p>
);

export const confirmDelete = (message: string): boolean => window.confirm(message);
