// src/components/features/shift-report/ServiceabilityPrintChart.tsx
// Tabel & grafik Serviceability pada lembar PDF, digambar sebagai SVG dari tata letak yang sama dengan ekspor
// Excel (warna, lebar kolom, area plot). Warna ditulis sebagai hex agar html2canvas dapat membacanya.
import React from 'react';
import type { ChecklistSummaryItem } from '../../../lib/services/operationalReportService';
import { layoutServiceabilityPrint } from '../../../lib/utils/serviceabilityPrintLayout';

const FONT = 'Calibri, Carlito, "Segoe UI", Arial, sans-serif';
const BORDER = '#000000';
const AXIS = '#868686';
const FRAME = '#BFBFBF';

export const ServiceabilityPrintChart: React.FC<{ items: ChecklistSummaryItem[] }> = ({ items }) => {
  const L = layoutServiceabilityPrint(items);
  const { chart } = L;

  return (
    <svg
      viewBox={`0 0 ${L.width} ${L.height}`}
      width="100%"
      style={{ display: 'block', fontFamily: FONT }}
      role="img"
      aria-label={chart.title.text}
    >
      {/* Tabel tanpa judul: No, Peralatan, % OPS, OPS, % OFF, OFF, Total */}
      {L.table.map((c, i) => (
        <g key={`c${i}`}>
          <rect x={c.x} y={c.y} width={c.w} height={c.h} fill={c.fill} stroke={BORDER} strokeWidth={1} />
          <text x={c.x + c.w / 2} y={c.y + c.h / 2} fontSize={L.fontPx} fill="#000000" textAnchor="middle" dominantBaseline="central">
            {c.text}
          </text>
        </g>
      ))}

      {/* Grafik batang "TABEL PERFORMA PERALATAN" */}
      <rect x={chart.x + 0.5} y={chart.y + 0.5} width={chart.w - 1} height={chart.h - 1} rx={10} fill="#FFFFFF" stroke={FRAME} strokeWidth={1} />
      <text x={chart.title.x} y={chart.title.y} fontSize={L.titleFontPx} fontWeight="bold" fill="#000000">
        {chart.title.text}
      </text>

      {chart.gridlines.map((g, i) => (
        <g key={`g${i}`}>
          <line x1={chart.plot.x} x2={chart.plot.x + chart.plot.w} y1={g.y} y2={g.y} stroke={i === 0 ? AXIS : L.colors.grid} strokeWidth={1} />
          <text x={chart.plot.x - 6} y={g.y} fontSize={L.fontPx} fill="#000000" textAnchor="end" dominantBaseline="central">
            {g.label}
          </text>
        </g>
      ))}
      <line x1={chart.plot.x} x2={chart.plot.x} y1={chart.plot.y} y2={chart.plot.y + chart.plot.h} stroke={AXIS} strokeWidth={1} />

      {chart.bars.map((b, i) => (
        <g key={`b${i}`}>
          {b.h > 0 && <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={b.fill} stroke={BORDER} strokeWidth={1} />}
          <text x={b.labelX} y={b.labelY} fontSize={L.fontPx} fill="#000000" textAnchor="middle">
            {b.label}
          </text>
        </g>
      ))}

      {chart.categories.map((c, i) => (
        <text key={`k${i}`} x={c.x} y={c.y} fontSize={L.fontPx} fill="#000000" textAnchor="middle">
          {c.text}
        </text>
      ))}
    </svg>
  );
};
