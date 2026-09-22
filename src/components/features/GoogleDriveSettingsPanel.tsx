import React, { useState } from 'react';
import { Check, CheckCircle, Folder, Settings, RefreshCw, AlertCircle, Copy, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { getGoogleScriptUrl, setGoogleScriptUrl, testGoogleScriptConnection } from '../../lib/services/googleDriveService';

const APPS_SCRIPT_SNIPPET = `var FOLDER_NAME = "SSES_T2_Dokumentasi";

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Google Apps Script SSES T2 aktif dan siap menerima unggahan foto.",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseJson({ status: "error", message: "Data post kosong" });
    }
    var data = JSON.parse(e.postData.contents);
    var base64Data = data.base64;
    var mimeType = data.mimeType || "image/jpeg";
    var fileName = data.fileName || ("DOK_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss") + ".jpg");

    if (base64Data.indexOf(",") > -1) {
      base64Data = base64Data.split(",")[1];
    }

    var folder;
    var folders = DriveApp.getFoldersByName(FOLDER_NAME);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(FOLDER_NAME);
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }

    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType, fileName);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileId = file.getId();
    var directViewUrl = "https://lh3.googleusercontent.com/d/" + fileId;

    return responseJson({
      status: "success",
      url: directViewUrl,
      viewUrl: directViewUrl,
      driveUrl: file.getUrl(),
      fileId: fileId,
      fileName: fileName
    });
  } catch (error) {
    return responseJson({ status: "error", message: error.toString() });
  }
}

function responseJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function testIzinDrive() {
  var folders = DriveApp.getFoldersByName(FOLDER_NAME);
  Logger.log("Izin DriveApp berhasil aktif!");
}`;

export const GoogleDriveSettingsPanel: React.FC = () => {
  const [url, setUrl] = useState(() => getGoogleScriptUrl());
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGoogleScriptUrl(url);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  };

  const handleTestConnection = async () => {
    if (!url.trim()) {
      setTestResult({ success: false, message: 'Masukkan URL Google Apps Script terlebih dahulu.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    const result = await testGoogleScriptConnection(url.trim());
    setTestResult(result);
    setTesting(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_SNIPPET);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="p-3 sm:p-5 md:p-6 bg-slate-50 min-h-[500px]">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-sm">Pengaturan Google Drive Penyimpanan Foto</h3>
          </div>
          <span className="text-[11px] bg-blue-600/60 px-2.5 py-1 rounded-full text-blue-100 font-medium">
            15 GB Gratis
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label htmlFor="google-drive-script-url" className="block text-xs font-bold text-slate-700 mb-1">
              Google Apps Script Web App URL
            </label>
            <div className="flex gap-2">
              <input
                id="google-drive-script-url"
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                  setTestResult(null);
                }}
                className="flex-1 text-xs p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !url.trim()}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-xl border border-slate-300 flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Menguji...' : 'Tes Koneksi'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              URL didapat dari deployment Google Apps Script Anda (akhiran <code>/exec</code>).
            </p>
          </div>

          {testResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              testResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{testResult.success ? 'Koneksi Berhasil' : 'Koneksi Gagal'}</p>
                <p className="text-[11px] mt-0.5">{testResult.message}</p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-2">
            <p className="font-bold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-blue-600" /> Keunggulan Integrasi Google Drive:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[11px] text-blue-800">
              <li>Foto otomatis dikompresi (max 1280px, ~200KB) sebelum diupload sehingga hemat waktu dan kuota.</li>
              <li>Tersimpan di folder Google Drive <b>"SSES_T2_Dokumentasi"</b>.</li>
              <li>Database Supabase 100% terlindungi dari teks Base64 sehingga kuota Free Tier tidak akan penuh.</li>
            </ul>
          </div>

          {/* Bagian Bantuan & Kode Script */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-blue-600" />
                Petunjuk Pembuatan &amp; Kode Google Apps Script
              </span>
              {showCode ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {showCode && (
              <div className="p-4 bg-white border-t border-slate-200 space-y-3 text-xs text-slate-600">
                <ol className="list-decimal pl-5 space-y-1.5 text-[11px] leading-relaxed">
                  <li>Buka <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">script.google.com</a> pada akun Google Drive Anda.</li>
                  <li>Klik <b>Proyek Baru (New Project)</b>, hapus kode lama, lalu tempel kode di bawah ini.</li>
                  <li>Klik <b>Terapkan (Deploy)</b> &gt; <b>Penerapan Baru (New Deployment)</b>.</li>
                  <li>Pilih jenis <b>Aplikasi Web (Web App)</b>.</li>
                  <li>Ubah <b>Yang memiliki akses (Who has access)</b> menjadi <b>"Siapa saja (Anyone)"</b>.</li>
                  <li>Klik <b>Terapkan</b>, izinkan akses (Authorize Access), lalu salin <b>URL Aplikasi Web</b> ke form di atas.</li>
                </ol>

                <div className="relative mt-2">
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[10px] font-mono overflow-x-auto max-h-56 leading-relaxed">
                    {APPS_SCRIPT_SNIPPET}
                  </pre>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="absolute top-2 right-2 px-2.5 py-1 text-[10px] font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-1 shadow"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-slate-200">
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md flex items-center gap-1.5"
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
