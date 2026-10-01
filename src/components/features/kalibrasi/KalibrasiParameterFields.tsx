import React from 'react';
import { AlertCircle } from 'lucide-react';
import { getValidXRayModels, getValidModels } from '../../../lib/utils/locationRules';
import type { KalibrasiEntry } from '../../../lib/types';

interface KalibrasiParameterFieldsProps {
  /** Satu entri kalibrasi (satu lokasi) dari state `kalibrasiEntries`. */
  entry: KalibrasiEntry;
  index: number;
  showErrors: boolean;
  handleKalibrasiEntryChange: (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}

/**
 * Blok parameter kalibrasi yang tampil secara kondisional sesuai jenis peralatan
 * yang dipilih pada entri (Extension Conveyor, X-Ray, WTMD, HHMD, Body Scanner,
 * ETD, dan Access Control).
 */
export const KalibrasiParameterFields: React.FC<KalibrasiParameterFieldsProps> = ({
  entry,
  index,
  showErrors,
  handleKalibrasiEntryChange,
}) => (
  <>
              {/* Dynamic Configurations based on selected equipments */}
              {entry.peralatan.includes('Extension Conveyor') && (
                <div className="bg-teal-50/40 p-4 sm:p-5 rounded-xl border border-teal-200 space-y-4">
                  <h3 className="font-bold text-teal-900 flex items-center gap-2 border-b border-teal-200 pb-3">
                    🔄 Parameter Extension Conveyor
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Gearbox Motor</label>
                      <select 
                        name="ecGearbox" data-field={`kal-${index}-ecGearbox`} 
                        value={entry.ecGearbox || 'Normal'} 
                        onChange={(e) => handleKalibrasiEntryChange(index, e)} 
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Perlu Penyetelan">Perlu Penyetelan</option>
                        <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                        <option value="Error">Error</option>
                        <option value="Rusak">Rusak</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Tension Roller</label>
                      <select 
                        name="ecTension" data-field={`kal-${index}-ecTension`} 
                        value={entry.ecTension || 'Normal'} 
                        onChange={(e) => handleKalibrasiEntryChange(index, e)} 
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Perlu Penyetelan">Perlu Penyetelan</option>
                        <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                        <option value="Error">Error</option>
                        <option value="Rusak">Rusak</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Conveyor Belt</label>
                      <select 
                        name="ecBelt" data-field={`kal-${index}-ecBelt`} 
                        value={entry.ecBelt || 'Normal'} 
                        onChange={(e) => handleKalibrasiEntryChange(index, e)} 
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Perlu Penyetelan">Perlu Penyetelan</option>
                        <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                        <option value="Error">Error</option>
                        <option value="Rusak">Rusak</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {entry.peralatan.includes('X-Ray') && (
                <div className={`bg-blue-50/40 p-4 sm:p-5 rounded-xl border space-y-4 ${
                  showErrors && (!entry.xrayKvV.trim() || !entry.xrayKvH.trim() || !entry.xrayMaV.trim() || !entry.xrayMaH.trim() || !entry.xrayOnV.trim() || !entry.xrayOnH.trim() || !entry.xrayArchive.trim()) ? 'border-red-400 ring-2 ring-red-200' : 'border-blue-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-200 pb-3">
                    <h3 className="font-bold text-blue-900 flex items-center gap-2">
                      ⚡ Parameter X-Ray <span className="text-xs text-rose-500 font-normal">*(Wajib Diisi)*</span>
                    </h3>
                    <select name="xrayModel" data-field={`kal-${index}-xrayModel`} value={entry.xrayModel} onChange={(e) => handleKalibrasiEntryChange(index, e)} disabled={!entry.lokasi1} className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-blue-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-200">
                      {getValidXRayModels(entry.lokasi1, entry.lokasi2).map((model: string) => (
                        <option key={model} value={model}>
                          {model === 'Semua X-Ray' ? '-- Semua Model X-Ray --' : model.replace('X-Ray ', '')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">kV Vertikal</label>
                      <input type="text" inputMode="decimal" required name="xrayKvV" data-field={`kal-${index}-xrayKvV`} value={entry.xrayKvV} onChange={(e) => handleKalibrasiEntryChange(index, e)} className={`w-full px-3 py-1.5 bg-white border rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 ${
                        showErrors && !entry.xrayKvV.trim() ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
                      }`} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">kV Horizontal</label>
                      <input type="text" inputMode="decimal" required name="xrayKvH" data-field={`kal-${index}-xrayKvH`} value={entry.xrayKvH} onChange={(e) => handleKalibrasiEntryChange(index, e)} className={`w-full px-3 py-1.5 bg-white border rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 ${
                        showErrors && !entry.xrayKvH.trim() ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
                      }`} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">mA Vertikal</label>
                      <input type="text" inputMode="decimal" required name="xrayMaV" data-field={`kal-${index}-xrayMaV`} value={entry.xrayMaV} onChange={(e) => handleKalibrasiEntryChange(index, e)} className={`w-full px-3 py-1.5 bg-white border rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 ${
                        showErrors && !entry.xrayMaV.trim() ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
                      }`} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">mA Horizontal</label>
                      <input type="text" inputMode="decimal" required name="xrayMaH" data-field={`kal-${index}-xrayMaH`} value={entry.xrayMaH} onChange={(e) => handleKalibrasiEntryChange(index, e)} className={`w-full px-3 py-1.5 bg-white border rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 ${
                        showErrors && !entry.xrayMaH.trim() ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
                      }`} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Ontime Vertikal</label>
                      <input type="text" inputMode="decimal" required name="xrayOnV" data-field={`kal-${index}-xrayOnV`} value={entry.xrayOnV} onChange={(e) => handleKalibrasiEntryChange(index, e)} className={`w-full px-3 py-1.5 bg-white border rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 ${
                        showErrors && !entry.xrayOnV.trim() ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
                      }`} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Ontime Horizontal</label>
                      <input type="text" inputMode="decimal" required name="xrayOnH" data-field={`kal-${index}-xrayOnH`} value={entry.xrayOnH} onChange={(e) => handleKalibrasiEntryChange(index, e)} className={`w-full px-3 py-1.5 bg-white border rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 ${
                        showErrors && !entry.xrayOnH.trim() ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
                      }`} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Archive</label>
                      <input type="text" required name="xrayArchive" data-field={`kal-${index}-xrayArchive`} value={entry.xrayArchive} placeholder="+- 1 bulan" onChange={(e) => handleKalibrasiEntryChange(index, e)} className={`w-full px-3 py-1.5 bg-white border rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 ${
                        showErrors && !entry.xrayArchive.trim() ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
                      }`} />
                    </div>
                  </div>
                  {showErrors && (!entry.xrayKvV.trim() || !entry.xrayKvH.trim() || !entry.xrayMaV.trim() || !entry.xrayMaH.trim() || !entry.xrayOnV.trim() || !entry.xrayOnH.trim() || !entry.xrayArchive.trim()) && (
                    <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Seluruh parameter X-Ray wajib diisi!
                    </p>
                  )}
                </div>
              )}

              {entry.peralatan.includes('WTMD') && (
                <div className={`bg-indigo-50/40 p-4 sm:p-5 rounded-xl border space-y-4 ${
                  showErrors && (!entry.wtmdZ1.trim() || !entry.wtmdZ2.trim() || !entry.wtmdZ3.trim() || !entry.wtmdZ4.trim() || !entry.wtmdLc.trim() || !entry.wtmdLs.trim() || !entry.wtmdUc.trim() || !entry.wtmdSe.trim() || !entry.wtmdDs.trim()) ? 'border-red-400 ring-2 ring-red-200' : 'border-indigo-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-200 pb-3">
                    <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                      🎛️ Parameter WTMD <span className="text-xs text-rose-500 font-normal">*(Wajib Diisi)*</span>
                    </h3>
                    <select name="wtmdModel" data-field={`kal-${index}-wtmdModel`} value={entry.wtmdModel} onChange={(e) => handleKalibrasiEntryChange(index, e)} disabled={!entry.lokasi1} className="px-3 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-indigo-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-200">
                      {getValidModels(entry.lokasi1, 'WTMD', entry.lokasi2).map((model: string) => (
                        <option key={model} value={model}>
                          {model === 'Semua WTMD' ? '-- Semua Model WTMD --' : model.replace('WTMD ', '')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Z1</label>
                      <input type="text" inputMode="numeric" required name="wtmdZ1" data-field={`kal-${index}-wtmdZ1`} value={entry.wtmdZ1} onChange={(e) => handleKalibrasiEntryChange(index, e)} className={`w-full px-2 py-1 bg-white border rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none ${
                        showErrors && !entry.wtmdZ1.trim() ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
                      }`} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Z2</label>
                      <input type="text" inputMode="numeric" required name="wtmdZ2" data-field={`kal-${index}-wtmdZ2`} value={entry.wtmdZ2} onChange={(e) => handleKalibrasiEntryChange(index, e)} className={`w-full px-2 py-1 bg-white border rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none ${
                        showErrors && !entry.wtmdZ2.trim() ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
                      }`} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Z3</label>
                      <input type="text" inputMode="numeric" required name="wtmdZ3" data-field={`kal-${index}-wtmdZ3`} value={entry.wtmdZ3} onChange={(e) => handleKalibrasiEntryChange(index, e)} className={`w-full px-2 py-1 bg-white border rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none ${
                        showErrors && !entry.wtmdZ3.trim() ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
                      }`} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Z4</label>
                      <input type="text" inputMode="numeric" required name="wtmdZ4" data-field={`kal-${index}-wtmdZ4`} value={entry.wtmdZ4} onChange={(e) => handleKalibrasiEntryChange(index, e)} className={`w-full px-2 py-1 bg-white border rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none ${
                        showErrors && !entry.wtmdZ4.trim() ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
                      }`} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">LC</label>
                      <input type="text" inputMode="numeric" required name="wtmdLc" data-field={`kal-${index}-wtmdLc`} value={entry.wtmdLc} onChange={(e) => handleKalibrasiEntryChange(index, e)} className={`w-full px-2 py-1 bg-white border rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none ${
                        showErrors && !entry.wtmdLc.trim() ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
                      }`} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">LS</label>
                      <input type="text" inputMode="numeric" required name="wtmdLs" data-field={`kal-${index}-wtmdLs`} value={entry.wtmdLs} onChange={(e) => handleKalibrasiEntryChange(index, e)} className={`w-full px-2 py-1 bg-white border rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none ${
                        showErrors && !entry.wtmdLs.trim() ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
                      }`} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">UC</label>
                      <input type="text" inputMode="numeric" required name="wtmdUc" data-field={`kal-${index}-wtmdUc`} value={entry.wtmdUc} onChange={(e) => handleKalibrasiEntryChange(index, e)} className={`w-full px-2 py-1 bg-white border rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none ${
                        showErrors && !entry.wtmdUc.trim() ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
                      }`} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">SE</label>
                      <input type="text" inputMode="numeric" required name="wtmdSe" data-field={`kal-${index}-wtmdSe`} value={entry.wtmdSe} onChange={(e) => handleKalibrasiEntryChange(index, e)} className={`w-full px-2 py-1 bg-white border rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none ${
                        showErrors && !entry.wtmdSe.trim() ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
                      }`} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">DS</label>
                      <input type="text" inputMode="numeric" required name="wtmdDs" data-field={`kal-${index}-wtmdDs`} value={entry.wtmdDs} onChange={(e) => handleKalibrasiEntryChange(index, e)} className={`w-full px-2 py-1 bg-white border rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none ${
                        showErrors && !entry.wtmdDs.trim() ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
                      }`} />
                    </div>
                  </div>
                  {showErrors && (!entry.wtmdZ1.trim() || !entry.wtmdZ2.trim() || !entry.wtmdZ3.trim() || !entry.wtmdZ4.trim() || !entry.wtmdLc.trim() || !entry.wtmdLs.trim() || !entry.wtmdUc.trim() || !entry.wtmdSe.trim() || !entry.wtmdDs.trim()) && (
                    <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Seluruh parameter WTMD wajib diisi!
                    </p>
                  )}
                </div>
              )}

              {entry.peralatan.includes('HHMD') && (
                <div className="bg-purple-50/40 p-4 sm:p-5 rounded-xl border border-purple-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-200 pb-3">
                    <h3 className="font-bold text-purple-900 flex items-center gap-2">
                      📱 Parameter HHMD
                    </h3>
                    <select name="hhmdModel" data-field={`kal-${index}-hhmdModel`} value={entry.hhmdModel} onChange={(e) => handleKalibrasiEntryChange(index, e)} disabled={!entry.lokasi1} className="px-3 py-1.5 bg-white border border-purple-300 rounded-lg text-xs font-bold text-purple-800 focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-200">
                      {getValidModels(entry.lokasi1, 'HHMD', entry.lokasi2).map((model: string) => (
                        <option key={model} value={model}>
                          {model === 'Semua HHMD' ? '-- Semua Model HHMD --' : model.replace('HHMD ', '')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {entry.peralatan.includes('Body Scanner') && (
                <div className="bg-emerald-50/40 p-4 sm:p-5 rounded-xl border border-emerald-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-200 pb-3">
                    <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                      🔍 Parameter Body Scanner
                    </h3>
                    <select name="bsModel" data-field={`kal-${index}-bsModel`} value={entry.bsModel} onChange={(e) => handleKalibrasiEntryChange(index, e)} disabled={!entry.lokasi1} className="px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-200">
                      {getValidModels(entry.lokasi1, 'Body Scanner', entry.lokasi2).map((model: string) => (
                        <option key={model} value={model}>
                          {model === 'Semua Body Scanner' ? '-- Semua Model Body Scanner --' : model.replace('Body Scanner ', '')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Test Tampilan Suspect Item</label>
                      <select name="bsSuspect" data-field={`kal-${index}-bsSuspect`} value={entry.bsSuspect} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500">
                        <option value="Normal">Normal</option><option value="Error">Error</option><option value="Perlu Penyetelan">Perlu Penyetelan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Test Monitor</label>
                      <select name="bsMonitor" data-field={`kal-${index}-bsMonitor`} value={entry.bsMonitor} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500">
                        <option value="Normal">Normal</option><option value="Error">Error</option><option value="Perlu Penyetelan">Perlu Penyetelan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Test Fungsi Scanning</label>
                      <select name="bsScanning" data-field={`kal-${index}-bsScanning`} value={entry.bsScanning} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500">
                        <option value="Normal">Normal</option><option value="Error">Error</option><option value="Perlu Penyetelan">Perlu Penyetelan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Test Fungsi Kalibrasi</label>
                      <select name="bsCalibration" data-field={`kal-${index}-bsCalibration`} value={entry.bsCalibration} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500">
                        <option value="Normal">Normal</option><option value="Error">Error</option><option value="Perlu Penyetelan">Perlu Penyetelan</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {entry.peralatan.includes('ETD') && (
                <div className="bg-amber-50/40 p-4 sm:p-5 rounded-xl border border-amber-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-3">
                    <h3 className="font-bold text-amber-900 flex items-center gap-2">
                      🧪 Parameter ETD
                    </h3>
                    <select name="etdModel" data-field={`kal-${index}-etdModel`} value={entry.etdModel} onChange={(e) => handleKalibrasiEntryChange(index, e)} disabled={!entry.lokasi1} className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-800 focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-200">
                      {getValidModels(entry.lokasi1, 'ETD', entry.lokasi2).map((model: string) => (
                        <option key={model} value={model}>
                          {model === 'Semua ETD' ? '-- Semua Model ETD --' : model.replace('ETD ', '')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Sampling Test TNT</label>
                      <select name="etdTnt" data-field={`kal-${index}-etdTnt`} value={entry.etdTnt} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-amber-500">
                        <option value="Alarm">Alarm</option><option value="Tidak Alarm">Tidak Alarm</option><option value="Error">Error</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Sampling Test PETN</label>
                      <select name="etdPetn" data-field={`kal-${index}-etdPetn`} value={entry.etdPetn} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-amber-500">
                        <option value="Alarm">Alarm</option><option value="Tidak Alarm">Tidak Alarm</option><option value="Error">Error</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Sampling Test RDX</label>
                      <select name="etdRdx" data-field={`kal-${index}-etdRdx`} value={entry.etdRdx} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-amber-500">
                        <option value="Alarm">Alarm</option><option value="Tidak Alarm">Tidak Alarm</option><option value="Error">Error</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {entry.peralatan.includes('Access Control') && (
                <div className="bg-rose-50/40 p-4 sm:p-5 rounded-xl border border-rose-200 space-y-4">
                  <h3 className="font-bold text-rose-900 flex items-center gap-2 border-b border-rose-200 pb-2">
                    🔐 Parameter Access Control
                  </h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Fungsi Emlock</label>
                    <select name="acEmlock" data-field={`kal-${index}-acEmlock`} value={entry.acEmlock} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-rose-500">
                      <option value="Berfungsi">Berfungsi</option>
                      <option value="Tidak Berfungsi">Tidak Berfungsi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Fungsi Intercom</label>
                    <select name="acIntercom" data-field={`kal-${index}-acIntercom`} value={entry.acIntercom} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-rose-500">
                      <option value="Berfungsi">Berfungsi</option>
                      <option value="Tidak Berfungsi">Tidak Berfungsi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Fungsi Fingerprint</label>
                    <select name="acFingerprint" data-field={`kal-${index}-acFingerprint`} value={entry.acFingerprint} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-rose-500">
                      <option value="Berfungsi">Berfungsi</option>
                      <option value="Tidak Berfungsi">Tidak Berfungsi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Fungsi CCTV</label>
                    <select name="acCctv" data-field={`kal-${index}-acCctv`} value={entry.acCctv} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-rose-500">
                      <option value="Berfungsi">Berfungsi</option>
                      <option value="Tidak Berfungsi">Tidak Berfungsi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Fungsi Pengontrolan Kunci Pintu</label>
                    <select name="acPengontrolan" data-field={`kal-${index}-acPengontrolan`} value={entry.acPengontrolan} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-rose-500">
                      <option value="Berfungsi">Berfungsi</option>
                      <option value="Tidak Berfungsi">Tidak Berfungsi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Record CCTV</label>
                    <input type="text" required name="acRecordCctv" data-field={`kal-${index}-acRecordCctv`} value={entry.acRecordCctv} placeholder="+- 1 bulan" onChange={(e) => handleKalibrasiEntryChange(index, e)} className={`w-full px-3 py-1.5 bg-white border rounded text-sm outline-none focus:ring-1 focus:ring-rose-500 ${
                      showErrors && !entry.acRecordCctv.trim() ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
                    }`} />
                    {showErrors && !entry.acRecordCctv.trim() && (
                      <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Record CCTV wajib diisi!
                      </p>
                    )}
                  </div>
                </div>
              )}
  </>
);
