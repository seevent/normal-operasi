// src/lib/utils/serviceabilityPrintLayout.ts
// Tata letak tabel + grafik Serviceability untuk lembar PDF, dihitung dari ukuran yang sama dengan ekspor
// Excel (lebar kolom F-L, ukuran & area plot grafik, warna) agar PDF tampil seperti Excel. Satuan: piksel
// lembar Excel; komponen PDF menggambarnya sebagai SVG dengan viewBox ini sehingga skalanya ikut lebar halaman.
// Modul murni agar bisa diuji langsung.

import { CHART_ANCHOR, getServiceabilityPlacement, SERVICEABILITY_STYLE as S } from './serviceabilityChart.ts';
import { SHEET_COLUMN_PX } from './shiftReportWorkbook.ts';

const EMU_PER_PX = 9525;
const PX_PER_PT = 96 / 72;
/** Grafik pada berkas acuan mulai satu baris di bawah tabel, bergeser 114301 EMU (12 px). */
const CHART_GAP_PX = 12;

export interface ServiceabilityPrintItem {
  nama: string;
  operasi: number;
  rusak: number;
  total: number;
}

export interface PrintCell { x: number; y: number; w: number; h: number; fill: string; text: string }
export interface PrintBar { x: number; y: number; w: number; h: number; fill: string; label: string; labelX: number; labelY: number }
export interface PrintText { x: number; y: number; text: string }

export interface ServiceabilityPrintLayout {
  width: number;
  height: number;
  fontPx: number;
  titleFontPx: number;
  colors: { ops: string; off: string; grid: string };
  table: PrintCell[];
  chart: {
    x: number; y: number; w: number; h: number;
    title: PrintText;
    plot: { x: number; y: number; w: number; h: number };
    gridlines: Array<{ y: number; label: string }>;
    bars: PrintBar[];
    categories: PrintText[];
  };
}

const pct = (n: number, total: number) => (total > 0 ? n / total : 0);
const pctLabel = (v: number) => `${Math.round(v * 100)}%`;

export const layoutServiceabilityPrint = (items: ServiceabilityPrintItem[]): ServiceabilityPrintLayout => {
  const fontPx = S.fontPt * PX_PER_PT;
  const rowPx = S.tableRowPt * PX_PER_PT;

  // Posisi horizontal relatif terhadap grafik, sama seperti di lembar: grafik di kolom C (+colOff), tabel di kolom F-L.
  const startCol = getServiceabilityPlacement(0, 1).startCol - 1; // indeks 0 kolom "No"
  const sumPx = (from: number, to: number) => SHEET_COLUMN_PX.slice(from, to).reduce((a, b) => a + b, 0);
  const chartLeft = sumPx(0, CHART_ANCHOR.col) + CHART_ANCHOR.colOff / EMU_PER_PX;
  const tableLeft = sumPx(0, startCol) - chartLeft;
  const colWidths = SHEET_COLUMN_PX.slice(startCol, startCol + 7);

  const table: PrintCell[] = [];
  items.forEach((item, i) => {
    const ops = pct(item.operasi, item.total);
    const off = pct(item.rusak, item.total);
    const texts = [String(i + 1), item.nama, pctLabel(ops), String(item.operasi), pctLabel(off), String(item.rusak), String(item.total)];
    let x = tableLeft;
    texts.forEach((text, c) => {
      table.push({ x, y: i * rowPx, w: colWidths[c], h: rowPx, fill: `#${S.tableFills[c]}`, text });
      x += colWidths[c];
    });
  });

  const w = S.chartCx / EMU_PER_PX;
  const h = S.chartCy / EMU_PER_PX;
  const y = items.length * rowPx + CHART_GAP_PX;
  const plot = { x: S.plot.x * w, y: y + S.plot.y * h, w: S.plot.w * w, h: S.plot.h * h };

  // Sumbu 0-100% dengan garis bantu tiap 10%, seperti tampilan grafik Excel.
  const gridlines = Array.from({ length: 11 }, (_, k) => ({ y: plot.y + plot.h * (1 - k / 10), label: `${k * 10}%` }));

  // Batang berkelompok: tiap kategori = 2 batang + celah gapWidth% dari lebar satu batang.
  const slot = plot.w / Math.max(items.length, 1);
  const barW = slot / (2 + S.gapWidth / 100);
  const bars: PrintBar[] = [];
  const categories: PrintText[] = [];
  items.forEach((item, i) => {
    const left = plot.x + slot * i + (slot - 2 * barW) / 2;
    [
      { v: pct(item.operasi, item.total), fill: `#${S.opsColor}` },
      { v: pct(item.rusak, item.total), fill: `#${S.offColor}` },
    ].forEach(({ v, fill }, j) => {
      const bh = Math.min(Math.max(v, 0), 1) * plot.h;
      const bx = left + j * barW;
      const by = plot.y + plot.h - bh;
      bars.push({ x: bx, y: by, w: barW, h: bh, fill, label: pctLabel(v), labelX: bx + barW / 2, labelY: by - 5 });
    });
    categories.push({ x: plot.x + slot * (i + 0.5), y: plot.y + plot.h + fontPx + 4, text: item.nama });
  });

  return {
    width: w,
    height: y + h,
    fontPx,
    titleFontPx: fontPx * 1.2,
    colors: { ops: `#${S.opsColor}`, off: `#${S.offColor}`, grid: `#${S.gridColor}` },
    table,
    chart: {
      x: 0, y, w, h,
      title: { x: S.titleX * w, y: y + S.titleY * h + fontPx * 1.2, text: S.title },
      plot,
      gridlines,
      bars,
      categories,
    },
  };
};
