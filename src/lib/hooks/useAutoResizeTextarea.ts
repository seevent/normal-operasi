import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

// useLayoutEffect menghitung tinggi sebelum browser menggambar, sehingga kotak
// tidak berkedip. Di server (SSR) efek itu tidak berjalan, jadi jatuh ke useEffect.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Membuat <textarea> tumbuh dan menyusut mengikuti isinya, tanpa scrollbar
 * internal. Pasang `ref` yang dikembalikan pada textarea.
 *
 * Tinggi awal saat kosong mengikuti atribut `rows` pada textarea, yang berlaku
 * sebagai tinggi minimum. Beri `overflow-hidden` pada textarea agar scrollbar
 * tidak sempat berkedip selama tinggi dihitung ulang.
 *
 * @param value Isi textarea; tinggi dihitung ulang setiap nilainya berubah.
 */
export const useAutoResizeTextarea = (value: string) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    // Kembalikan ke tinggi bawaan dulu; tanpa ini kotak hanya bisa membesar.
    el.style.height = 'auto';

    // scrollHeight tidak menghitung border, sedangkan Tailwind memakai
    // box-sizing: border-box. Tanpa selisih ini kotak kurang 2px dan tetap
    // memunculkan scrollbar kecil.
    const borderHeight = el.offsetHeight - el.clientHeight;
    el.style.height = `${el.scrollHeight + borderHeight}px`;
  }, []);

  useIsomorphicLayoutEffect(resize, [value, resize]);

  // Lebar layar berubah (ponsel diputar, jendela diubah ukurannya) sehingga
  // pemenggalan baris berubah walau isinya tetap.
  useEffect(() => {
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [resize]);

  return ref;
};
