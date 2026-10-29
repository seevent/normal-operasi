// src/lib/utils/prepCache.ts
// Cache pekerjaan latar belakang per objek (mis. konversi video per File) dengan status yang bisa dipantau UI.
// Fungsi murni: tanpa jaringan/DOM, jadi mudah diuji di Node.

export type PrepStatus = 'preparing' | 'ready' | 'failed';

interface Entry<V> {
  status: PrepStatus;
  promise: Promise<V>;
  value?: V;
}

/**
 * Menjalankan `run` sekali per kunci. Panggilan `start` berikutnya memakai hasil yang sama
 * (sedang berjalan atau sudah selesai); kunci yang gagal dijalankan ulang pada `start` berikutnya.
 */
export const createPrepCache = <K extends object, V, C = undefined>(run: (key: K, context: C) => Promise<V>) => {
  const entries = new WeakMap<K, Entry<V>>();
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());

  const start = (key: K, context: C): Promise<V> => {
    const existing = entries.get(key);
    if (existing && existing.status !== 'failed') return existing.promise;

    const entry = { status: 'preparing' } as Entry<V>;
    entry.promise = run(key, context).then(
      (value) => {
        entry.status = 'ready';
        entry.value = value;
        emit();
        return value;
      },
      (err) => {
        entry.status = 'failed';
        emit();
        throw err;
      },
    );
    // Penolakan ditangani pemanggil yang menunggu; cabang ini mencegah peringatan "unhandled rejection".
    entry.promise.catch(() => {});
    entries.set(key, entry);
    emit();
    return entry.promise;
  };

  return {
    start,
    status: (key: K): PrepStatus | undefined => entries.get(key)?.status,
    /** Hasil bila sudah siap; undefined selama masih berjalan atau gagal. */
    value: (key: K): V | undefined => {
      const entry = entries.get(key);
      return entry?.status === 'ready' ? entry.value : undefined;
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};
