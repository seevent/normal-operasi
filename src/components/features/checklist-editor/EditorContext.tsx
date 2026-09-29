import { createContext, useContext } from 'react';

interface ChecklistEditorContextValue {
  isOpen: (id: string) => boolean;
  toggle: (id: string) => void;
  /** Membuka node lalu menggulirnya ke tengah layar setelah dirender. */
  reveal: (id: string) => void;
  /** Pengurutan dimatikan saat pencarian aktif karena daftar yang tampil hanya sebagian. */
  canReorder: boolean;
}

const ChecklistEditorContext = createContext<ChecklistEditorContextValue | null>(null);

export const ChecklistEditorProvider = ChecklistEditorContext.Provider;

export const useChecklistEditor = (): ChecklistEditorContextValue => {
  const value = useContext(ChecklistEditorContext);
  if (!value) throw new Error('useChecklistEditor harus dipakai di dalam ChecklistEditorProvider');
  return value;
};

/** ID elemen DOM untuk sebuah node editor; dipakai untuk menggulir ke node baru. */
export const nodeDomId = (id: string) => `cl-${id}`;
