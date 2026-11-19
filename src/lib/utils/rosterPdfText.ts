// src/lib/utils/rosterPdfText.ts
// Mengambil potongan teks berkoordinat dari PDF memakai modul pdf.js yang diberikan pemanggil.
// Modul pdf.js disuntikkan supaya fungsi yang sama dipakai di browser (dynamic import + worker)
// dan di Node untuk pengujian (legacy build).

import type { PdfTextItem } from './rosterPenugasan.ts';

interface PdfJsLike {
  getDocument: (src: { data: Uint8Array }) => { promise: Promise<PdfDocLike> };
}
interface PdfDocLike {
  numPages: number;
  getPage: (n: number) => Promise<{ getTextContent: () => Promise<{ items: unknown[] }> }>;
  destroy?: () => Promise<void>;
}

export const extractPdfTextItems = async (pdfjs: PdfJsLike, data: Uint8Array): Promise<PdfTextItem[]> => {
  const doc = await pdfjs.getDocument({ data }).promise;
  const out: PdfTextItem[] = [];
  try {
    for (let page = 1; page <= doc.numPages; page++) {
      const content = await (await doc.getPage(page)).getTextContent();
      for (const raw of content.items) {
        const it = raw as { str?: string; transform?: number[]; width?: number };
        if (!it.str || !it.str.trim() || !it.transform) continue;
        out.push({ str: it.str, x: it.transform[4], y: it.transform[5], width: it.width ?? 0, page });
      }
    }
  } finally {
    await doc.destroy?.();
  }
  return out;
};
