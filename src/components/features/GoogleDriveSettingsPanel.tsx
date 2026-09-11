import React, { useState } from 'react';
import { Check, CheckCircle, Folder, Settings } from 'lucide-react';
import { getGoogleScriptUrl, setGoogleScriptUrl } from '../../lib/services/googleDriveService';

export const GoogleDriveSettingsPanel: React.FC = () => {
  const [url, setUrl] = useState(() => getGoogleScriptUrl());
  const [saved, setSaved] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGoogleScriptUrl(url);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };

  return (
    <section className="p-3 sm:p-5 md:p-6 bg-slate-50 min-h-[500px]">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center gap-2">
          <Folder className="w-5 h-5 text-amber-300" />
          <h3 className="font-bold text-sm">Pengaturan Google Drive Penyimpanan Foto</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="google-drive-script-url" className="block text-xs font-bold text-slate-700 mb-1">
              Google Apps Script Web App URL
            </label>
            <input
              id="google-drive-script-url"
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              URL ini didapat dari deployment Google Apps Script Anda (Deploy as Web App).
            </p>
          </div>

          <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-blue-600" /> Status Izin Editor:
            </p>
            <p className="text-[11px] leading-relaxed text-blue-800">
              Folder Google Drive dan semua foto otomatis disetting <b>"Anyone with the link can edit"</b> sehingga semua staf teknisi &amp; pimpinan dapat melihat dan mengedit tanpa halangan akses.
            </p>
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-slate-200">
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              {saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Settings className="w-4 h-4" />}
              <span>{saved ? 'Tersimpan!' : 'Simpan Pengaturan'}</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
