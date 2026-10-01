// src/lib/utils/kalibrasiParams.ts
// Baris parameter X-Ray dan WTMD pada Catatan laporan Kalibrasi.
// Parameter dibiarkan kosong sampai diisi teknisi; hanya Archive X-Ray yang punya nilai bawaan.
// Modul murni tanpa akses store/jaringan supaya bisa diuji langsung.

export const XRAY_ARCHIVE_DEFAULT = '+- 1 bulan';

// Nilai kosong -> hanya satuannya ("kV"); sudah berakhiran huruf (mis. "Normal", "140 kV") -> apa adanya.
const withUnit = (val: string | undefined, unit: string): string => {
  const trimmed = String(val ?? '').trim();
  if (!trimmed) return unit;
  return /[a-zA-Z]$/.test(trimmed) ? trimmed : `${trimmed} ${unit}`;
};

const pair = (v: string | undefined, h: string | undefined, unit: string) =>
  `${withUnit(v, unit)} / ${withUnit(h, unit)}`;

// Pasangan "Label : nilai" digabung " - "; nilai kosong menyisakan "Label :".
const joinParams = (items: Array<[string, string | undefined]>) =>
  items.map(([label, val]) => `${label} : ${String(val ?? '').trim()}`.trimEnd()).join(' - ');

export const formatXRayParams = (entry: any): string => [
  `- kV Vertikal/Horizontal : ${pair(entry.xrayKvV, entry.xrayKvH, 'kV')}`,
  `- mA Vertikal/Horizontal : ${pair(entry.xrayMaV, entry.xrayMaH, 'mA')}`,
  `- Ontime Vertikal/Horizontal : ${pair(entry.xrayOnV, entry.xrayOnH, 'h')}`,
  `- Archive : ${entry.xrayArchive || XRAY_ARCHIVE_DEFAULT}`
].join('\n');

export const formatWtmdParams = (entry: any): string => [
  `- ${joinParams([['Z1', entry.wtmdZ1], ['Z2', entry.wtmdZ2], ['Z3', entry.wtmdZ3], ['Z4', entry.wtmdZ4]])}`,
  `- ${joinParams([['LC', entry.wtmdLc], ['LS', entry.wtmdLs], ['UC', entry.wtmdUc], ['SE', entry.wtmdSe], ['DS', entry.wtmdDs]])}`
].join('\n');
