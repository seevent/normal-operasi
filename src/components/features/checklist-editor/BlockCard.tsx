import React from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  BLOCK_TYPE_LABEL,
  ChecklistBlock,
  ChecklistBlockType,
  blockTitle,
  countBlock,
  countMissingSummaryKeys,
} from '../../../lib/utils/checklistEditor';
import { nodeDomId, useChecklistEditor } from './EditorContext';
import { CategoryList } from './CategoryList';
import { SubGroupList } from './SubGroupList';
import { ActionBar, Chevron, confirmDelete, Field, inputClass } from './ui';

const TONE: Record<ChecklistBlockType, { badge: string; open: string; ring: string }> = {
  location: { badge: 'bg-blue-100 text-blue-700', open: 'bg-blue-50', ring: 'border-blue-300' },
  group: { badge: 'bg-purple-100 text-purple-700', open: 'bg-purple-50', ring: 'border-purple-300' },
  access_control: { badge: 'bg-emerald-100 text-emerald-700', open: 'bg-emerald-50', ring: 'border-emerald-300' },
};

const SUB_LABEL: Record<ChecklistBlockType, string> = { location: '', group: 'lokasi', access_control: 'terminal' };

interface BlockCardProps {
  block: ChecklistBlock;
  index: number;
  total: number;
  onChange: (next: ChecklistBlock) => void;
  onMove: (direction: 'up' | 'down') => void;
  onRemove: () => void;
}

export const BlockCard: React.FC<BlockCardProps> = ({ block, index, total, onChange, onMove, onRemove }) => {
  const { isOpen, toggle } = useChecklistEditor();
  const id = block._id ?? String(index);
  const open = isOpen(id);
  const tone = TONE[block.type];
  const stats = countBlock(block);
  const missing = countMissingSummaryKeys(block);
  const patch = (changes: Partial<ChecklistBlock>) => onChange({ ...block, ...changes });
  const usesSummaryKey = block.type !== 'access_control';

  const handleRemove = () => {
    if (confirmDelete(`Hapus blok "${blockTitle(block)}" beserta ${stats.categories} kategori dan ${stats.items} alat di dalamnya?`)) {
      onRemove();
    }
  };

  const counts = [
    SUB_LABEL[block.type] ? `${stats.subGroups} ${SUB_LABEL[block.type]}` : null,
    `${stats.categories} kategori`,
    `${stats.items} alat`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <section id={nodeDomId(id)} className={`rounded-2xl border bg-white overflow-hidden shadow-sm ${open ? tone.ring : 'border-slate-200'}`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => toggle(id)}
        className={`w-full flex items-start gap-2 px-3 py-3 text-left transition-colors ${open ? tone.open : 'bg-white hover:bg-slate-50'}`}
      >
        <span className="text-slate-400 mt-0.5">
          <Chevron open={open} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 min-w-0">
            <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 ${tone.badge}`}>
              {BLOCK_TYPE_LABEL[block.type]}
            </span>
            <span className="min-w-0 truncate font-bold text-slate-800">{blockTitle(block)}</span>
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
            <span>{counts}</span>
            {missing > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" /> {missing} tanpa Summary Key
              </span>
            )}
          </span>
        </span>
      </button>

      {open && (
        <div className="p-3 sm:p-4 space-y-4 border-t border-slate-200">
          {block.type !== 'group' && (
            <Field label="Nama / Judul Utama">
              <input className={inputClass} value={block.title || ''} onChange={(e) => patch({ title: e.target.value })} />
            </Field>
          )}

          <Field label="Teks Summary (WA)" hint="Judul rekap yang tercetak di pesan WhatsApp.">
            <input className={inputClass} value={block.summary || ''} onChange={(e) => patch({ summary: e.target.value })} />
          </Field>

          {block.type === 'location' && (
            <CategoryList categories={block.categories ?? []} usesSummaryKey={usesSummaryKey} onChange={(next) => patch({ categories: next })} />
          )}
          {block.type === 'group' && (
            <SubGroupList kind="location" groups={block.locations ?? []} usesSummaryKey={usesSummaryKey} onChange={(next) => patch({ locations: next })} />
          )}
          {block.type === 'access_control' && (
            <SubGroupList kind="terminal" groups={block.terminals ?? []} usesSummaryKey={usesSummaryKey} onChange={(next) => patch({ terminals: next })} />
          )}

          <div className="border-t border-slate-200 pt-3">
            <ActionBar
              onMoveUp={() => onMove('up')}
              onMoveDown={() => onMove('down')}
              onDelete={handleRemove}
              canMoveUp={index > 0}
              canMoveDown={index < total - 1}
              deleteLabel="Hapus Blok"
            />
          </div>
        </div>
      )}
    </section>
  );
};
