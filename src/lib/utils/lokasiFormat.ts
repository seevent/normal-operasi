// src/lib/utils/lokasiFormat.ts
// Standar penulisan lokasi di seluruh aplikasi: "<Lokasi> <Nomor>", tanpa kata "No." dan selalu
// dengan spasi, misalnya "PSCP D 2", "Rampout E 1", "HBSCP 2.5".
// Modul murni tanpa akses store/jaringan supaya bisa diuji langsung.

/** Gabungkan lokasi dan nomor/titiknya. Nomor kosong atau "-" dilewati. */
export const formatLokasi = (lokasi?: string | null, nomor?: string | null): string => {
  const base = String(lokasi ?? '').trim();
  const no = String(nomor ?? '').trim();
  return (no && no !== '-' ? `${base} ${no}` : base).trim();
};

// Awalan lokasi yang diikuti huruf zona lalu nomor tanpa spasi ("Rampout D2", "PSCP E1").
// Hanya awalan ini yang dipecah: nama seperti "Ruang Monitoring E1" atau "Breakdown E1" memang
// memakai "E1" sebagai bagian namanya.
const ZONE_PREFIX = /\b(PSCP|SSCP|Rampout|Aviobridge|Avio\s*&\s*BL|Arrival)\s+([A-Za-z])(?=\d)/gi;

/**
 * Rapikan teks lokasi ke standar, termasuk data lama: "PSCP E No.2" -> "PSCP E 2",
 * "Rampout D2" -> "Rampout D 2". Aman dipanggil berulang dan untuk daftar lokasi.
 */
export const normalizeLokasi = (text?: string | null): string => {
  if (text == null) return '';
  return String(text)
    .replace(/\s*\bNo\.?\s*(?=\d)/gi, ' ')
    .replace(ZONE_PREFIX, '$1 $2 ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+,/g, ',')
    .trim();
};

/** Baris lokasi pada form (lokasi1 + lokasi2); baris manual ditulis apa adanya. */
export const formatLokasiRows = (rows: Array<{ lokasi1?: string; lokasi2?: string; isManual?: boolean }>): string =>
  rows
    .map(row => normalizeLokasi(row.isManual ? row.lokasi1 : formatLokasi(row.lokasi1, row.lokasi2)))
    .filter(Boolean)
    .join(', ');

export const formatACLokasiList = (locs: string[]): string => {
  if (!locs || locs.length === 0) return '-';
  if (locs.length === 1) return locs[0];

  interface FormattedChunk {
    text: string;
    minIndex: number;
  }

  const results: FormattedChunk[] = [];
  const normalLocsWithIndex: { loc: string; idx: number }[] = [];

  locs.forEach((loc, idx) => {
    if (loc.toUpperCase().includes('PSCP') || loc.toUpperCase().includes('BEA CUKAI') || loc.toUpperCase().includes('BELT')) {
      results.push({ text: loc.trim(), minIndex: idx });
    } else {
      normalLocsWithIndex.push({ loc: loc.trim(), idx });
    }
  });

  // Step 1: Group normalLocs by prefix
  const prefixGroups: Map<string, { suffix: string; idx: number }[]> = new Map();
  normalLocsWithIndex.forEach(({ loc, idx }) => {
    const parts = loc.split(' ');
    if (parts.length >= 2) {
      const prefix = parts.slice(0, -1).join(' ');
      const suffix = parts[parts.length - 1];
      if (!prefixGroups.has(prefix)) prefixGroups.set(prefix, []);
      prefixGroups.get(prefix)!.push({ suffix, idx });
    } else {
      results.push({ text: loc, minIndex: idx });
    }
  });

  const remainingForSuffixGroup: { prefix: string; suffix: string; idx: number }[] = [];

  prefixGroups.forEach((items, prefix) => {
    if (items.length === 1) {
      remainingForSuffixGroup.push({ prefix, suffix: items[0].suffix, idx: items[0].idx });
    } else {
      const minIndex = Math.min(...items.map(i => i.idx));
      const suffixes = items.map(i => i.suffix);
      const lastSuffix = suffixes[suffixes.length - 1];
      const otherSuffixes = suffixes.slice(0, -1).join(', ');
      results.push({ text: `${prefix} ${otherSuffixes} & ${lastSuffix}`, minIndex });
    }
  });

  // Step 2: Group remaining by suffix
  const suffixGroups: Map<string, { prefix: string; idx: number }[]> = new Map();
  remainingForSuffixGroup.forEach(({ prefix, suffix, idx }) => {
    if (!suffixGroups.has(suffix)) suffixGroups.set(suffix, []);
    suffixGroups.get(suffix)!.push({ prefix, idx });
  });

  suffixGroups.forEach((items, suffix) => {
    const minIndex = Math.min(...items.map(i => i.idx));
    if (items.length === 1) {
      results.push({ text: `${items[0].prefix} ${suffix}`, minIndex });
    } else {
      const prefixes = items.map(i => i.prefix);
      const lastPrefix = prefixes[prefixes.length - 1];
      const otherPrefixes = prefixes.slice(0, -1).join(', ');
      results.push({ text: `${otherPrefixes} & ${lastPrefix} ${suffix}`, minIndex });
    }
  });

  results.sort((a, b) => a.minIndex - b.minIndex);
  const formattedResults = results.map(r => r.text);

  if (formattedResults.length <= 1) {
    return formattedResults[0] || '-';
  }
  const last = formattedResults[formattedResults.length - 1];
  if (last.includes('&') || formattedResults.some(r => r.includes('&'))) {
    return formattedResults.join(', ');
  }
  const firstPart = formattedResults.slice(0, -1).join(', ');
  return `${firstPart} & ${last}`;
};

/**
 * Lokasi laporan Storing. Lokasi terpilih (beserta nomornya) digabung ringkas oleh
 * formatACLokasiList; bila tidak ada, dipakai satu lokasi tunggal beserta nomornya.
 */
export const formatStoringLokasi = (
  acLokasi: string[] = [],
  acNomor: Record<string, string> = {},
  lokasi = '',
  nomor = ''
): string => {
  if (acLokasi.length > 0) {
    return formatACLokasiList(acLokasi.map(loc => normalizeLokasi(formatLokasi(loc, acNomor[loc]))));
  }
  return lokasi ? normalizeLokasi(formatLokasi(lokasi, nomor)) : '-';
};
