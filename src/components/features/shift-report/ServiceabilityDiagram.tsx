import React from 'react';
import { BarChart2, CheckCircle, Loader2, Save } from 'lucide-react';

import type { ChecklistSummaryItem } from '../../../lib/services/operationalReportService';

interface ServiceabilityDiagramProps {
  checklistSummary: ChecklistSummaryItem[];
  handleChecklistSummaryChange: (no: number, field: 'total' | 'rusak' | 'operasi', val: number) => void;
  handleManualSaveSummary: () => void;
  saveStatus: string;
}

/**
 * Rekap kesiapan peralatan: diagram batang serviceability per jenis peralatan,
 * lengkap dengan jumlah total/off yang dapat diedit dan kontrol simpan manual
 * ke Supabase.
 */
export const ServiceabilityDiagram: React.FC<ServiceabilityDiagramProps> = ({
  checklistSummary,
  handleChecklistSummaryChange,
  handleManualSaveSummary,
  saveStatus,
}) => (
  <>
      {/* REKAP KESIAPAN PERALATAN (DIAGRAM BATANG SERVICEABILITY) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-600" /> Diagram Serviceability Peralatan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Diagram batang kesiapan operasional per jenis peralatan (Jumlah unit Total dan Off dapat diedit manual)
            </p>
          </div>

          {/* Legend Batang & Kontrol Simpan */}
          <div className="flex items-center gap-2.5 self-stretch sm:self-auto flex-wrap justify-between sm:justify-end">
            {/* Status Simpan Database */}
            {saveStatus === 'saving' && (
              <span className="inline-flex items-center gap-1.5 text-xs text-blue-700 font-semibold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> Menyimpan...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Tersimpan
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="inline-flex items-center gap-1.5 text-xs text-rose-700 font-semibold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                Gagal Simpan
              </span>
            )}

            {/* Legend */}
            <div className="flex items-center gap-3 text-xs font-semibold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-600 inline-block shadow-sm"></span>
                <span className="text-slate-700">Peralatan Normal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-500 inline-block shadow-sm"></span>
                <span className="text-slate-700">Peralatan Off</span>
              </div>
            </div>

            {/* Tombol Simpan Manual */}
            <button
              onClick={handleManualSaveSummary}
              disabled={saveStatus === 'saving'}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-slate-300 rounded-lg shadow-2xs transition-all cursor-pointer"
              title="Simpan data kesiapan peralatan ke database"
            >
              <Save className="w-3.5 h-3.5" />
              Simpan
            </button>
          </div>
        </div>

        {/* Diagram Batang Container */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[840px] pl-11 pr-4 pt-8">
            {/* Area Grafik dengan Garis Referensi Persentase */}
            <div className="relative h-56 border-b-2 border-slate-300 bg-gradient-to-b from-slate-50/60 to-white rounded-t-xl">
              {/* Garis Grid Horizontal Persentase */}
              {[100, 75, 50, 25, 0].map((pct) => (
                <div
                  key={pct}
                  className={`absolute left-0 right-0 pointer-events-none flex items-center ${
                    pct === 0 ? '' : 'border-b border-dashed border-slate-200'
                  }`}
                  style={{ bottom: `${pct}%` }}
                >
                  <span className="absolute -left-10 text-[10px] text-slate-400 font-semibold w-8 text-right -translate-y-1/2 select-none">
                    {pct}%
                  </span>
                </div>
              ))}

              {/* Kelompok Batang Tiap Jenis Peralatan */}
              <div className="absolute inset-0 grid grid-cols-7 gap-2">
                {checklistSummary.map((item) => {
                  const persenNormal = Math.round(item.persenOperasi * 100);
                  const persenOff = Math.round(item.persenRusak * 100);

                  return (
                    <div key={item.no} className="flex justify-center items-end gap-1.5 sm:gap-2 h-full">
                      {/* Batang Normal (Biru) */}
                      <div className="relative flex flex-col items-center justify-end h-full w-7 sm:w-8">
                        <div 
                          style={{ height: persenNormal > 0 ? `${persenNormal}%` : '2px' }}
                          className={`relative w-full rounded-t-md shadow-sm transition-all duration-300 flex items-center justify-center cursor-pointer ${
                            persenNormal > 0 
                              ? 'bg-gradient-to-t from-blue-600 to-blue-500 hover:brightness-110' 
                              : 'bg-slate-200'
                          }`}
                          title={`${item.nama} Normal: ${item.operasi} Unit (${persenNormal}%)`}
                        >
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] sm:text-[11px] font-bold text-blue-700 leading-none whitespace-nowrap">
                            {persenNormal}%
                          </span>
                        </div>
                      </div>

                      {/* Batang Off (Merah) */}
                      <div className="relative flex flex-col items-center justify-end h-full w-7 sm:w-8">
                        <div 
                          style={{ height: persenOff > 0 ? `${persenOff}%` : '2px' }}
                          className={`relative w-full rounded-t-md shadow-sm transition-all duration-300 flex items-center justify-center cursor-pointer ${
                            persenOff > 0 
                              ? 'bg-gradient-to-t from-rose-600 to-red-500 hover:brightness-110' 
                              : 'bg-slate-200'
                          }`}
                          title={`${item.nama} Off: ${item.rusak} Unit (${persenOff}%)`}
                        >
                          <span className={`absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] sm:text-[11px] font-bold leading-none whitespace-nowrap ${persenOff > 0 ? 'text-rose-600 font-extrabold' : 'text-slate-400'}`}>
                            {persenOff}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Label Peralatan & Form Edit Manual Nilai Unit (Total & Off) */}
            <div className="grid grid-cols-7 gap-2 pt-3.5">
              {checklistSummary.map((item) => (
                <div 
                  key={item.no} 
                  className="flex flex-col justify-between bg-slate-50/90 hover:bg-slate-100/90 transition-all p-2 rounded-xl border border-slate-200 shadow-2xs text-center"
                >
                  {/* Nama Peralatan & Status Normal */}
                  <div className="mb-2">
                    <span 
                      className="text-[11px] font-bold text-slate-800 uppercase tracking-tight block truncate" 
                      title={item.nama}
                    >
                      {item.nama}
                    </span>
                    <span className="inline-flex items-center justify-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200/70 mt-1 w-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block"></span>
                      Normal: <strong className="font-bold">{item.operasi}</strong>
                    </span>
                  </div>

                  {/* Input Manual Total & Off */}
                  <div className="space-y-1.5 pt-1.5 border-t border-slate-200/80">
                    {/* Input Total */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-slate-600 select-none">
                        Total:
                      </span>
                      <input 
                        type="number"
                        min="0"
                        value={item.total}
                        onChange={(e) => handleChecklistSummaryChange(item.no, 'total', parseInt(e.target.value, 10))}
                        className="w-11 px-1 py-0.5 text-center text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-2xs"
                        title="Edit jumlah unit Total"
                      />
                    </div>

                    {/* Input Off */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-rose-600 flex items-center gap-0.5 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
                        Off:
                      </span>
                      <input 
                        type="number"
                        min="0"
                        max={item.total}
                        value={item.rusak}
                        onChange={(e) => handleChecklistSummaryChange(item.no, 'rusak', parseInt(e.target.value, 10))}
                        className={`w-11 px-1 py-0.5 text-center text-xs font-bold rounded border focus:ring-1 outline-none transition-all shadow-2xs ${
                          item.rusak > 0 
                            ? 'text-rose-700 border-rose-300 bg-rose-50/60 focus:border-rose-500 focus:ring-rose-500' 
                            : 'text-slate-700 border-slate-300 bg-white focus:border-slate-500 focus:ring-slate-500'
                        }`}
                        title="Edit jumlah unit Off"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  </>
);
