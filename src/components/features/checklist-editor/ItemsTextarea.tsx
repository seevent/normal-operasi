import React, { useEffect, useState } from 'react';
import { useAutoResizeTextarea } from '../../../lib/hooks/useAutoResizeTextarea';
import { normalizeItems, parseItems } from '../../../lib/utils/checklistEditor';

interface ItemsTextareaProps {
  items: string[];
  onChange: (items: string[]) => void;
}

/**
 * Satu baris = satu alat.
 *
 * Teks mentah disimpan di state lokal. Editor lama membuang baris kosong pada
 * setiap ketikan lalu menampilkan ulang hasilnya, sehingga baris baru yang baru
 * saja dibuat dengan Enter langsung lenyap dan alat baru tidak bisa diketik.
 * Sekarang baris kosong boleh ada selama mengetik, dan baru dirapikan saat kolom
 * kehilangan fokus.
 */
export const ItemsTextarea: React.FC<ItemsTextareaProps> = ({ items, onChange }) => {
  const joined = items.join('\n');
  const [raw, setRaw] = useState(joined);
  const ref = useAutoResizeTextarea(raw);

  // Ikuti perubahan dari luar (Reset, Batalkan) tanpa menimpa ketikan yang berjalan:
  // selama teks mentah setara dengan daftar dari luar, tidak ada yang perlu diubah.
  useEffect(() => {
    if (parseItems(raw).join('\n') !== joined) setRaw(joined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined]);

  const handleBlur = () => {
    const cleaned = normalizeItems(parseItems(raw));
    setRaw(cleaned.join('\n'));
    if (cleaned.join('\n') !== joined) onChange(cleaned);
  };

  return (
    <div>
      <textarea
        ref={ref}
        rows={3}
        value={raw}
        placeholder={'Satu alat per baris, contoh:\nX-Ray Rapiscan 620DV (No1)\nX-Ray Rapiscan 620DV (No2)'}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        onChange={(e) => {
          setRaw(e.target.value);
          onChange(parseItems(e.target.value));
        }}
        onBlur={handleBlur}
        className="w-full min-w-0 px-3 py-2.5 bg-white border border-slate-300 rounded-lg font-mono text-base sm:text-sm leading-relaxed whitespace-pre-wrap break-words resize-none overflow-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
      />
      <div className="flex items-center justify-between gap-2 mt-1 text-xs text-slate-500">
        <span>Tekan Enter untuk alat baru. Satu baris = satu alat.</span>
        <span className="shrink-0 font-semibold text-indigo-700">{items.length} alat</span>
      </div>
    </div>
  );
};
