// src/lib/utils/missingFields.ts
// Menanggapi isian wajib yang kosong: maskot menyebut isian apa saja yang kosong, lalu layar
// bergulir dan fokus ke isian kosong pertama (berdasarkan urutan di halaman).

import { sayPet } from '../../store/useAppStore';
import { buildMissingPetMessage, type MissingField } from './formValidation.ts';

const findField = (key: string): HTMLElement | null => {
  const k = CSS.escape(key);
  return document.querySelector<HTMLElement>(`[data-field="${k}"]`) ?? document.querySelector<HTMLElement>(`[name="${k}"]`);
};

const FOCUSABLE = 'input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),button:not([disabled])';

/** Gulir dan fokus ke isian kosong yang paling atas di halaman. Mengembalikan elemen tujuan. */
export const focusFirstMissing = (missing: MissingField[]): HTMLElement | null => {
  const targets = missing.map(m => findField(m.key)).filter((el): el is HTMLElement => !!el);
  if (targets.length === 0) return null;
  targets.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  const target = targets[0];
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const focusable = target.matches(FOCUSABLE) ? target : target.querySelector<HTMLElement>(FOCUSABLE);
  focusable?.focus({ preventScroll: true });
  return target;
};

export const reportMissingFields = (missing: MissingField[]): void => {
  const message = buildMissingPetMessage(missing);
  if (message) sayPet(message, 'warning');
  focusFirstMissing(missing);
};
