/** Ekstrak pesan error yang aman dari nilai `unknown` hasil `catch`. */
export function getErrorMessage(err: unknown, fallback = 'Terjadi kesalahan'): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return fallback;
}

export function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}
