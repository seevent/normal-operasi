import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronsDownUp,
  ChevronsUpDown,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Settings,
  Undo2,
  X,
} from 'lucide-react';
import { useMasterDataStore } from '../../store/useMasterDataStore';
import { sayPet, useAppStore } from '../../store/useAppStore';
import { DEFAULT_CHECKLIST_DATA } from '../../lib/data/masterData';
import {
  ChecklistBlock,
  ChecklistBlockType,
  assignIds,
  blockMatches,
  collectAllIds,
  collectMatchIds,
  countMissingSummaryKeys,
  isChecklistDirty,
  moveItem,
  newBlock,
  normalizeQuery,
  removeAt,
  stripIds,
  sumStats,
} from '../../lib/utils/checklistEditor';
import { BlockCard } from './checklist-editor/BlockCard';
import { ChecklistEditorProvider, nodeDomId } from './checklist-editor/EditorContext';
import { AddButton, EmptyHint } from './checklist-editor/ui';

const toolButton =
  'inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 rounded-lg text-sm font-semibold transition-colors';

export const ChecklistDataEditor: React.FC = () => {
  const store = useMasterDataStore();
  const saved = store.checklistDataMaster as ChecklistBlock[];

  const [data, setData] = useState<ChecklistBlock[]>(() => assignIds(saved));
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const dataRef = useRef(data);
  dataRef.current = data;
  const saveBarRef = useRef<HTMLDivElement>(null);
  const setBottomInset = useAppStore((s) => s.setBottomInset);

  const savedJson = useMemo(() => JSON.stringify(saved ?? []), [saved]);
  const dirty = useMemo(() => isChecklistDirty(data, saved), [data, saved]);
  const needsSave = dirty || syncFailed;

  // Bilah simpan menempel di dasar layar; beri tahu maskot agar bergeser ke atasnya.
  useEffect(() => {
    setBottomInset(needsSave ? (saveBarRef.current?.offsetHeight ?? 72) + 8 : 0);
    return () => setBottomInset(0);
  }, [needsSave, setBottomInset]);

  // Muat ulang dari store hanya bila pengguna tidak sedang punya perubahan yang
  // belum disimpan; kalau tidak, hasil ketikannya akan tertimpa diam-diam.
  const previousSavedJson = useRef(savedJson);
  useEffect(() => {
    const previous = previousSavedJson.current;
    previousSavedJson.current = savedJson;
    if (previous === savedJson) return;

    const currentJson = JSON.stringify(stripIds(dataRef.current));
    const wasClean = currentJson === previous;
    const alreadyMatches = currentJson === savedJson; // baru saja disimpan dari editor ini
    if (wasClean && !alreadyMatches) setData(assignIds(saved));
  }, [savedJson, saved]);

  // Saat mencari, buka otomatis node yang cocok agar hasilnya langsung terlihat.
  const q = normalizeQuery(query);
  useEffect(() => {
    if (!q) return;
    const matches = collectMatchIds(dataRef.current, q);
    setOpenIds((prev) => new Set([...prev, ...matches]));
  }, [q]);

  const isOpen = useCallback((id: string) => openIds.has(id), [openIds]);
  const toggle = useCallback((id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const reveal = useCallback((id: string) => {
    setOpenIds((prev) => new Set(prev).add(id));
    window.setTimeout(() => {
      document.getElementById(nodeDomId(id))?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  }, []);

  const contextValue = useMemo(() => ({ isOpen, toggle, reveal, canReorder: !q }), [isOpen, toggle, reveal, q]);

  const visible = useMemo(
    () => data.map((block, index) => ({ block, index })).filter(({ block }) => blockMatches(block, q)),
    [data, q]
  );
  const stats = useMemo(() => sumStats(data), [data]);
  const missingKeys = useMemo(() => data.reduce((n, b) => n + countMissingSummaryKeys(b), 0), [data]);

  const handleSave = async () => {
    setSaving(true);
    const ok = await store.setChecklistDataMaster(stripIds(data));
    setSaving(false);
    setSyncFailed(!ok);
    if (ok) {
      setSavedAt(new Date());
      sayPet('Scan selesai, konfigurasi checklist tersimpan ke database. Clear!', 'success');
    } else {
      sayPet(
        'Konfigurasi checklist gagal tersimpan ke database. Perubahan baru ada di perangkat ini, tekan Simpan lagi saat koneksi membaik.',
        'error'
      );
    }
  };

  const handleDiscard = () => {
    if (!window.confirm('Buang semua perubahan yang belum disimpan dan kembali ke versi tersimpan?')) return;
    setData(assignIds(saved));
    setSyncFailed(false);
  };

  const handleReset = () => {
    if (
      window.confirm(
        'Reset checklist ke default bawaan sistem? Perubahan baru tersimpan ke cloud setelah Anda menekan Simpan.'
      )
    ) {
      setData(assignIds(DEFAULT_CHECKLIST_DATA as ChecklistBlock[]));
    }
  };

  const handleAddBlock = (type: ChecklistBlockType) => {
    const created = newBlock(type);
    setData((prev) => [...prev, created]);
    if (created._id) reveal(created._id);
  };

  const statusPill = syncFailed ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-100 rounded-full px-2.5 py-1">
      <AlertTriangle className="w-3.5 h-3.5" /> Belum tersimpan ke cloud
    </span>
  ) : dirty ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 rounded-full px-2.5 py-1">
      <span className="w-2 h-2 rounded-full bg-amber-500" /> Belum disimpan
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full px-2.5 py-1">
      <CheckCircle2 className="w-3.5 h-3.5" /> Tersimpan
      {savedAt && <span className="font-medium">{savedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>}
    </span>
  );

  return (
    <ChecklistEditorProvider value={contextValue}>
      <div className="space-y-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-5 space-y-3">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" /> Konfigurasi Checklist
              </h2>
              {statusPill}
            </div>
            <p className="text-sm text-slate-500 mt-1.5">
              Atur struktur checklist untuk pesan WhatsApp. Perubahan baru tersimpan setelah menekan <b>Simpan</b>.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 text-xs font-semibold text-slate-600">
            <span className="bg-slate-100 rounded-full px-2.5 py-1">{stats.blocks} blok</span>
            <span className="bg-slate-100 rounded-full px-2.5 py-1">{stats.categories} kategori</span>
            <span className="bg-slate-100 rounded-full px-2.5 py-1">{stats.items} alat</span>
          </div>

          {missingKeys > 0 && (
            <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                <b>{missingKeys} kategori</b> belum punya Summary Key. Baris rekapnya akan tertulis "undefined" di pesan
                WhatsApp.
              </span>
            </div>
          )}

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari blok, kategori, alat"
              className="w-full min-w-0 pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Hapus pencarian"
                className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOpenIds(new Set(collectAllIds(data)))}
              className={`${toolButton} bg-slate-100 text-slate-700 hover:bg-slate-200`}
            >
              <ChevronsUpDown className="w-4 h-4" /> Buka semua
            </button>
            <button type="button" onClick={() => setOpenIds(new Set())} className={`${toolButton} bg-slate-100 text-slate-700 hover:bg-slate-200`}>
              <ChevronsDownUp className="w-4 h-4" /> Tutup semua
            </button>
          </div>
        </div>

        {q && (
          <p className="text-sm text-slate-500 px-1">
            Menampilkan <b>{visible.length}</b> dari {data.length} blok untuk "{query.trim()}".
            {visible.length > 0 && ' Urutan tidak bisa diubah selama pencarian.'}
          </p>
        )}

        <div className="space-y-3">
          {visible.map(({ block, index }) => (
            <BlockCard
              key={block._id ?? index}
              block={block}
              index={index}
              total={data.length}
              onChange={(next) => setData((prev) => prev.map((b, i) => (i === index ? next : b)))}
              onMove={(direction) => setData((prev) => moveItem(prev, index, direction))}
              onRemove={() => setData((prev) => removeAt(prev, index))}
            />
          ))}
          {visible.length === 0 && <EmptyHint>{q ? 'Tidak ada yang cocok dengan pencarian.' : 'Belum ada blok checklist.'}</EmptyHint>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <AddButton onClick={() => handleAddBlock('location')} tone="blue">
            Blok Lokasi
          </AddButton>
          <AddButton onClick={() => handleAddBlock('group')} tone="purple">
            Blok Grup
          </AddButton>
          <AddButton onClick={() => handleAddBlock('access_control')} tone="emerald">
            Blok Access Control
          </AddButton>
        </div>

        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg text-sm font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Kembalikan ke bawaan sistem
          </button>
        </div>

        {needsSave && (
          <div ref={saveBarRef} className="sticky bottom-0 z-40 -mx-2 sm:mx-0 bg-white/95 backdrop-blur border-t sm:border sm:rounded-2xl border-slate-200 shadow-[0_-6px_16px_rgba(15,23,42,0.08)] p-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              aria-label={syncFailed ? 'Coba simpan lagi' : 'Simpan perubahan'}
              className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-bold whitespace-nowrap transition-colors"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? 'Menyimpan...' : syncFailed ? 'Simpan ulang' : 'Simpan'}
            </button>
            {dirty && (
              <button
                type="button"
                onClick={handleDiscard}
                disabled={saving}
                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
              >
                <Undo2 className="w-4 h-4" /> Batalkan
              </button>
            )}
          </div>
        )}
      </div>
    </ChecklistEditorProvider>
  );
};
