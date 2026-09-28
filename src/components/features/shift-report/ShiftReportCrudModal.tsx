// src/components/features/shift-report/ShiftReportCrudModal.tsx
import React from 'react';
import { Plus, Edit, X, Loader2 } from 'lucide-react';
import { isTimeWithinShiftBoundary } from '../../../lib/services/operationalReportService';

export interface ShiftReportCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalMode: 'add' | 'edit';
  crudForm: {
    jenis: 'Kegiatan' | 'Perbaikan' | 'Storing' | 'Kalibrasi';
    waktu: string;
    peralatan: string;
    lokasi: string;
    uraian: string;
    tindakLanjut: string;
    status: string;
  };
  setCrudForm: React.Dispatch<React.SetStateAction<any>>;
  shift: 'PS' | 'M' | 'ALL';
  crudPhotoPreview: string | null;
  setCrudPhotoPreview: (url: string | null) => void;
  setCrudPhotoFile: (file: File | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export const ShiftReportCrudModal: React.FC<ShiftReportCrudModalProps> = ({
  isOpen,
  onClose,
  modalMode,
  crudForm,
  setCrudForm,
  shift,
  crudPhotoPreview,
  setCrudPhotoPreview,
  setCrudPhotoFile,
  onSubmit,
  isSubmitting
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            {modalMode === 'add' ? <Plus className="w-5 h-5 text-blue-600" /> : <Edit className="w-5 h-5 text-blue-600" />}
            {modalMode === 'add' ? 'Tambah Pekerjaan Manual' : 'Edit Pekerjaan Shift'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Pekerjaan</label>
              <select
                value={crudForm.jenis}
                onChange={(e) => setCrudForm({ ...crudForm, jenis: e.target.value as any })}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Kegiatan">Kegiatan</option>
                <option value="Perbaikan">Perbaikan (Corrective)</option>
                <option value="Storing">Storing</option>
                <option value="Kalibrasi">Kalibrasi (Preventive)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jam / Waktu</label>
              <input
                type="text"
                required
                placeholder="Contoh: 08:25 - 08:35"
                value={crudForm.waktu}
                onChange={(e) => setCrudForm({ ...crudForm, waktu: e.target.value })}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
              {!isTimeWithinShiftBoundary(crudForm.waktu, shift) && (
                <p className="text-[10px] text-amber-600 mt-1 font-semibold">
                  ⚠️ Di luar batas shift {shift === 'PS' ? 'PS (s.d. 20:00)' : 'M (s.d. 08:00 pagi)'}.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Peralatan</label>
            <input
              type="text"
              required
              placeholder="Contoh: Access Control / ETD Leidos"
              value={crudForm.peralatan}
              onChange={(e) => setCrudForm({ ...crudForm, peralatan: e.target.value })}
              className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi</label>
            <input
              type="text"
              required
              placeholder="Contoh: Ruang Monitoring E1 / PSCP E No.2"
              value={crudForm.lokasi}
              onChange={(e) => setCrudForm({ ...crudForm, lokasi: e.target.value })}
              className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Uraian / Permasalahan</label>
            <textarea
              required
              rows={3}
              placeholder="Jelaskan detail permasalahan / kegiatan..."
              value={crudForm.uraian}
              onChange={(e) => setCrudForm({ ...crudForm, uraian: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tindak Lanjut</label>
              <input
                type="text"
                placeholder="Contoh: Pembersihan sensor & normal"
                value={crudForm.tindakLanjut}
                onChange={(e) => setCrudForm({ ...crudForm, tindakLanjut: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <input
                type="text"
                placeholder="Contoh: Normal / Normal Operasi"
                value={crudForm.status}
                onChange={(e) => setCrudForm({ ...crudForm, status: e.target.value })}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Foto Dokumentasi</label>
            <div className="flex items-center gap-3">
              {crudPhotoPreview && (
                <img src={crudPhotoPreview} alt="Preview" className="w-14 h-14 rounded-lg object-cover border border-slate-300 shrink-0" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCrudPhotoFile(file);
                    setCrudPhotoPreview(URL.createObjectURL(file));
                  }
                }}
                className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Laporan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
