import React, { useState } from 'react';
import { Check, CheckCircle, Cloud, Settings, RefreshCw, AlertCircle, ExternalLink, HelpCircle, ShieldCheck } from 'lucide-react';
import { getCloudinaryConfig, setCloudinaryConfig, testCloudinaryConnection } from '../../lib/services/cloudinaryService';

export const CloudinarySettingsPanel: React.FC = () => {
  const [config, setConfig] = useState(() => getCloudinaryConfig());
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCloudinaryConfig(config.cloudName, config.uploadPreset);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const handleTestConnection = async () => {
    if (!config.cloudName.trim() || !config.uploadPreset.trim()) {
      setTestResult({
        success: false,
        message: 'Mohon isi Cloud Name dan Upload Preset terlebih dahulu.'
      });
      return;
    }
    setTesting(true);
    setTestResult(null);
    const result = await testCloudinaryConnection(config.cloudName, config.uploadPreset);
    setTestResult(result);
    setTesting(false);
  };

  return (
    <section className="p-3 sm:p-5 md:p-6 bg-slate-50 min-h-[500px]">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-sky-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-sky-200" />
            <h3 className="font-bold text-sm">Pengaturan Cloudinary CDN Penyimpanan Foto</h3>
          </div>
          <span className="text-[11px] bg-white/20 px-2.5 py-1 rounded-full text-white font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> 25 GB Gratis / Bulan
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cloudinary-cloud-name" className="block text-xs font-bold text-slate-700 mb-1">
                Cloud Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="cloudinary-cloud-name"
                type="text"
                placeholder="misal: dkj8x9abc"
                value={config.cloudName}
                onChange={(e) => {
                  setConfig((prev) => ({ ...prev, cloudName: e.target.value.trim() }));
                  setTestResult(null);
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono outline-none"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">Ditemukan di Dashboard Cloudinary Anda.</p>
            </div>

            <div>
              <label htmlFor="cloudinary-upload-preset" className="block text-xs font-bold text-slate-700 mb-1">
                Upload Preset (Unsigned) <span className="text-rose-500">*</span>
              </label>
              <input
                id="cloudinary-upload-preset"
                type="text"
                placeholder="misal: sses_reports"
                value={config.uploadPreset}
                onChange={(e) => {
                  setConfig((prev) => ({ ...prev, uploadPreset: e.target.value.trim() }));
                  setTestResult(null);
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono outline-none"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">Mode Unsigned agar browser bisa upload langsung.</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4" />
                  <span>Simpan Pengaturan</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !config.cloudName.trim() || !config.uploadPreset.trim()}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin text-sky-600' : ''}`} />
              <span>{testing ? 'Menguji Upload...' : 'Test Koneksi & Upload'}</span>
            </button>
          </div>

          {/* Test connection result */}
          {testResult && (
            <div
              className={`p-3.5 rounded-lg border text-sm flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              )}
              <div className="flex-1 text-xs sm:text-sm font-medium">{testResult.message}</div>
            </div>
          )}

          {/* Panduan Pembuatan Preset */}
          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              <HelpCircle className="w-4 h-4 text-sky-600" />
              <span>Cara Mendapatkan Cloud Name & Membuat Upload Preset (1 Menit)</span>
            </div>

            <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <li>
                Buka dan login ke{' '}
                <a
                  href="https://console.cloudinary.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-600 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  Cloudinary Console <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                Pada Dashboard utama, salin <strong>Cloud name</strong> Anda dan masukkan ke kolom di atas.
              </li>
              <li>
                Klik menu <strong>Settings (ikon gerigi)</strong> di pojok kiri bawah &rarr; pilih tab <strong>Upload</strong>.
              </li>
              <li>
                Gulir ke bawah ke bagian <strong>Upload presets</strong> &rarr; klik <strong>Add upload preset</strong>.
              </li>
              <li>
                Ubah <strong>Signing Mode</strong> dari <em>Signed</em> menjadi <strong className="text-amber-700 bg-amber-100 px-1 py-0.5 rounded">Unsigned</strong>.
              </li>
              <li>
                Beri nama preset (contoh: <code>sses_reports</code>) atau gunakan nama bawaan yang digenerate.
              </li>
              <li>
                Klik <strong>Save</strong> di pojok kanan atas, lalu salin nama preset tersebut ke form di atas.
              </li>
            </ol>
          </div>
        </form>
      </div>
    </section>
  );
};
