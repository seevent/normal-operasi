import React from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  ChecklistCategory,
  moveItem,
  newCategory,
  removeAt,
  replaceAt,
} from '../../../lib/utils/checklistEditor';
import { useChecklistEditor } from './EditorContext';
import { confirmDelete, nodeDomId } from './helpers';
import { ActionBar, AddButton, Chevron, EmptyHint, Field, inputClass } from './ui';
import { ItemsTextarea } from './ItemsTextarea';

interface CategoryCardProps {
  category: ChecklistCategory;
  index: number;
  total: number;
  /** Blok access control tidak memakai Summary Key, jadi tidak perlu diperingatkan. */
  usesSummaryKey: boolean;
  onChange: (patch: Partial<ChecklistCategory>) => void;
  onMove: (direction: 'up' | 'down') => void;
  onRemove: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, index, total, usesSummaryKey, onChange, onMove, onRemove }) => {
  const { isOpen, toggle } = useChecklistEditor();
  const id = category._id ?? String(index);
  const open = isOpen(id);
  const items = category.items ?? [];
  const missingKey = usesSummaryKey && !(category.summaryKey ?? '').trim();

  const handleRemove = () => {
    if (items.length === 0 || confirmDelete(`Hapus kategori "${category.title || 'tanpa nama'}" beserta ${items.length} alat?`)) {
      onRemove();
    }
  };

  return (
    <div id={nodeDomId(id)} className="rounded-xl border border-indigo-100 bg-white overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => toggle(id)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors ${open ? 'bg-indigo-50' : 'bg-indigo-50/40 hover:bg-indigo-50'}`}
      >
        <span className="text-indigo-400">
          <Chevron open={open} />
        </span>
        <span className="min-w-0 flex-1 truncate font-bold text-slate-800">{category.title || 'Kategori tanpa nama'}</span>
        {missingKey && <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" aria-label="Summary Key kosong" />}
        <span className="shrink-0 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-full px-2 py-0.5">{items.length} alat</span>
      </button>

      {open && (
        <div className="p-3 space-y-3 border-t border-indigo-100">
          <Field label="Nama Kategori">
            <input
              className={`${inputClass} font-bold`}
              placeholder="Cth: A. X-RAY"
              value={category.title || ''}
              onChange={(e) => onChange({ title: e.target.value })}
            />
          </Field>

          {usesSummaryKey && (
            <Field
              label="Summary Key"
              hint={
                missingKey ? (
                  <span className="text-amber-600 font-semibold">
                    Kosong: baris rekap di pesan WhatsApp akan tertulis "undefined". Isi, misalnya X-RAY.
                  </span>
                ) : (
                  'Label rekap di akhir pesan WhatsApp, misalnya X-RAY.'
                )
              }
            >
              <input
                className={`${inputClass} ${missingKey ? 'border-amber-400' : ''}`}
                placeholder="Cth: X-RAY"
                value={category.summaryKey || ''}
                onChange={(e) => onChange({ summaryKey: e.target.value })}
              />
            </Field>
          )}

          <div>
            <span className="block text-sm font-semibold text-slate-700 mb-1">Daftar Alat</span>
            <ItemsTextarea items={items} onChange={(next) => onChange({ items: next })} />
          </div>

          <ActionBar
            onMoveUp={() => onMove('up')}
            onMoveDown={() => onMove('down')}
            onDelete={handleRemove}
            canMoveUp={index > 0}
            canMoveDown={index < total - 1}
            deleteLabel="Hapus"
          />
        </div>
      )}
    </div>
  );
};

interface CategoryListProps {
  categories: ChecklistCategory[];
  onChange: (categories: ChecklistCategory[]) => void;
  usesSummaryKey: boolean;
}

export const CategoryList: React.FC<CategoryListProps> = ({ categories, onChange, usesSummaryKey }) => {
  const { reveal } = useChecklistEditor();

  const handleAdd = () => {
    const created = newCategory();
    onChange([...categories, created]);
    if (created._id) reveal(created._id);
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-bold text-slate-700">
        Kategori &amp; Peralatan <span className="font-medium text-slate-400">({categories.length})</span>
      </h4>
      {categories.length === 0 && <EmptyHint>Belum ada kategori.</EmptyHint>}
      {categories.map((category, index) => (
        <CategoryCard
          key={category._id ?? index}
          category={category}
          index={index}
          total={categories.length}
          usesSummaryKey={usesSummaryKey}
          onChange={(patch) => onChange(replaceAt(categories, index, patch))}
          onMove={(direction) => onChange(moveItem(categories, index, direction))}
          onRemove={() => onChange(removeAt(categories, index))}
        />
      ))}
      <AddButton onClick={handleAdd} tone="indigo">
        Tambah Kategori
      </AddButton>
    </div>
  );
};
