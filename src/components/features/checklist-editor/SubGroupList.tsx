import React from 'react';
import {
  ChecklistSubGroup,
  countItems,
  moveItem,
  newSubGroup,
  removeAt,
  replaceAt,
} from '../../../lib/utils/checklistEditor';
import { useChecklistEditor } from './EditorContext';
import { confirmDelete, nodeDomId } from './helpers';
import { CategoryList } from './CategoryList';
import { ActionBar, AddButton, Chevron, EmptyHint, Field, inputClass } from './ui';

export type SubGroupKind = 'location' | 'terminal';

const COPY: Record<SubGroupKind, { heading: string; single: string; placeholder: string; add: string; tone: 'purple' | 'emerald'; accent: string }> = {
  location: {
    heading: 'Daftar Lokasi di Grup Ini',
    single: 'Lokasi',
    placeholder: 'Cth: SSCP E',
    add: 'Tambah Lokasi',
    tone: 'purple',
    accent: 'border-purple-300',
  },
  terminal: {
    heading: 'Daftar Terminal',
    single: 'Terminal',
    placeholder: 'Opsional, cth: TERMINAL D',
    add: 'Tambah Terminal',
    tone: 'emerald',
    accent: 'border-emerald-300',
  },
};

interface SubGroupCardProps {
  kind: SubGroupKind;
  group: ChecklistSubGroup;
  index: number;
  total: number;
  usesSummaryKey: boolean;
  onChange: (patch: Partial<ChecklistSubGroup>) => void;
  onMove: (direction: 'up' | 'down') => void;
  onRemove: () => void;
}

const SubGroupCard: React.FC<SubGroupCardProps> = ({ kind, group, index, total, usesSummaryKey, onChange, onMove, onRemove }) => {
  const { isOpen, toggle } = useChecklistEditor();
  const copy = COPY[kind];
  const id = group._id ?? String(index);
  const open = isOpen(id);
  const categories = group.categories ?? [];
  const itemCount = countItems(categories);

  const handleRemove = () => {
    const label = group.title || `${copy.single} tanpa nama`;
    if (categories.length === 0 || confirmDelete(`Hapus ${copy.single.toLowerCase()} "${label}" beserta ${categories.length} kategori dan ${itemCount} alat?`)) {
      onRemove();
    }
  };

  return (
    <div id={nodeDomId(id)} className={`rounded-xl border border-slate-200 border-l-4 ${copy.accent} bg-white overflow-hidden`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => toggle(id)}
        className={`w-full flex items-center gap-2 px-3 py-3 text-left transition-colors ${open ? 'bg-slate-100' : 'bg-slate-50 hover:bg-slate-100'}`}
      >
        <span className="text-slate-400">
          <Chevron open={open} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold text-slate-800">{group.title || `${copy.single} tanpa nama`}</span>
          <span className="block text-xs text-slate-500">
            {categories.length} kategori · {itemCount} alat
          </span>
        </span>
      </button>

      {open && (
        <div className="p-3 space-y-4 border-t border-slate-200">
          <Field label={`Nama ${copy.single}`}>
            <input
              className={`${inputClass} font-bold`}
              placeholder={copy.placeholder}
              value={group.title || ''}
              onChange={(e) => onChange({ title: e.target.value })}
            />
          </Field>
          <CategoryList categories={categories} usesSummaryKey={usesSummaryKey} onChange={(next) => onChange({ categories: next })} />
          <ActionBar
            onMoveUp={() => onMove('up')}
            onMoveDown={() => onMove('down')}
            onDelete={handleRemove}
            canMoveUp={index > 0}
            canMoveDown={index < total - 1}
            deleteLabel={`Hapus ${copy.single}`}
          />
        </div>
      )}
    </div>
  );
};

interface SubGroupListProps {
  kind: SubGroupKind;
  groups: ChecklistSubGroup[];
  onChange: (groups: ChecklistSubGroup[]) => void;
  usesSummaryKey: boolean;
}

export const SubGroupList: React.FC<SubGroupListProps> = ({ kind, groups, onChange, usesSummaryKey }) => {
  const { reveal } = useChecklistEditor();
  const copy = COPY[kind];

  const handleAdd = () => {
    const created = newSubGroup(kind);
    onChange([...groups, created]);
    if (created._id) reveal(created._id);
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-bold text-slate-700">
        {copy.heading} <span className="font-medium text-slate-400">({groups.length})</span>
      </h4>
      {groups.length === 0 && <EmptyHint>Belum ada {copy.single.toLowerCase()}.</EmptyHint>}
      {groups.map((group, index) => (
        <SubGroupCard
          key={group._id ?? index}
          kind={kind}
          group={group}
          index={index}
          total={groups.length}
          usesSummaryKey={usesSummaryKey}
          onChange={(patch) => onChange(replaceAt(groups, index, patch))}
          onMove={(direction) => onChange(moveItem(groups, index, direction))}
          onRemove={() => onChange(removeAt(groups, index))}
        />
      ))}
      <AddButton onClick={handleAdd} tone={copy.tone}>
        {copy.add}
      </AddButton>
    </div>
  );
};
