import React, { useEffect, useMemo, useState } from 'react';
import { Plane, FileUp, Loader2, CheckCircle, AlertTriangle, Clock, Trash2, X, Info } from 'lucide-react';
import {
  filterRosterSsesT2,
  isAksiDapatDiterapkan,
  isAksiDipilihOtomatis,
  susunRencanaRoster,
  STATUS_PENUGASAN_DEFAULT,
  UNIT_SSES_T2,
  type AksiRoster,
  type JadwalRef,
  type PersonelRef,
  type RencanaItem,
  type RiwayatRoster,
  type Roster,
} from '../../lib/utils/rosterPenugasan';
import { validasiLabelPenugasan } from '../../lib/data/kehadiranStatus';
import {
  bacaFileRoster,
  hapusRiwayatRoster,
  muatJadwal,
  muatPersonel,
  muatRiwayatRoster,
  simpanPenugasanRoster,
} from '../../lib/services/rosterPenugasanService';
import { getErrorMessage } from '../../lib/utils/errorUtils';

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const fmtTanggal = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${HARI[dow]}, ${d} ${BULAN[m - 1]} ${y}`;
};
const NAMA_SHIFT: Record<string, string> = { PS: 'Pagi', M: 'Malam' };

const AKSI_TAMPIL: Record<AksiRoster, { label: string; cls: string }> = {
  sesuai: { label: 'Sesuai jadwal', cls: 'bg-emerald-100 text-emerald-800' },
  di_luar_jadwal: { label: 'Di luar jadwal', cls: 'bg-sky-100 text-sky-800' },
  beda_shift: { label: 'Beda shift', cls: 'bg-amber-100 text-amber-800' },
  tidak_hadir: { label: 'Tidak hadir', cls: 'bg-amber-100 text-amber-800' },
  sudah: { label: 'Sudah tercatat', cls: 'bg-slate-200 text-slate-700' },
  tidak_dikenal: { label: 'Nama tidak dikenal', cls: 'bg-rose-100 text-rose-800' },
};

const keteranganAksi = (r: RencanaItem, label: string) => {
  const bagian = `bagian "${label}" Laporan Dinas ${NAMA_SHIFT[r.shift]}`;
  switch (r.aksi) {
    case 'sesuai': return `Jadwal ${r.shiftLama} · ${r.statusLama || 'Hadir'}. Tampil di ${bagian}; status tetap.`;
    case 'di_luar_jadwal': return `Tidak ada jadwal shift pada tanggal ini. Centang bila tetap ingin tampil di ${bagian}.`;
    case 'beda_shift': return `Jadwal reguler shift ${r.shiftLama}, roster shift ${r.shift}. Centang bila tetap ingin tampil di ${bagian}.`;
    case 'tidak_hadir': return `Status kehadiran "${r.statusLama}". Centang bila tetap ingin tampil di ${bagian}.`;
    case 'sudah': return 'Sudah tercatat dari roster sebelumnya.';
    case 'tidak_dikenal': return 'Tidak ditemukan di master personel. Tambahkan di sub-tab Personel bila perlu.';
  }
};

interface Parsed { fileName: string; roster: Roster; personel: PersonelRef[]; jadwal: JadwalRef[] }

/**
 * Upload roster penugasan bantuan (mis. Bagasi Umroh SV – AFETS CGK) apa adanya (PDF/Excel).
 * Hanya personel T2 Safety & Security Electronic Services yang diambil. Penugasan terpilih
 * disimpan di master_configs dan tampil sebagai bagian "*<judul> :*" di Laporan Dinas Tab Kehadiran.
 */
export const RosterPenugasanUploader: React.FC = () => {
  const [label, setLabel] = useState(STATUS_PENUGASAN_DEFAULT);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [isParsing, setIsParsing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [dipilih, setDipilih] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [riwayat, setRiwayat] = useState<RiwayatRoster[]>([]);
  const [isFetchingRiwayat, setIsFetchingRiwayat] = useState(false);
  const [undoingId, setUndoingId] = useState<string | null>(null);

  const labelError = validasiLabelPenugasan(label);
  const labelBersih = label.trim();

  const fetchRiwayat = async () => {
    setIsFetchingRiwayat(true);
    try {
      setRiwayat(await muatRiwayatRoster());
    } catch (err) {
      console.error('Gagal memuat riwayat roster:', err);
    } finally {
      setIsFetchingRiwayat(false);
    }
  };

  useEffect(() => {
    fetchRiwayat();
  }, []);

  const barisSses = useMemo(() => (parsed ? filterRosterSsesT2(parsed.roster.rows) : []), [parsed]);
  const rencana = useMemo(
    () => (parsed ? susunRencanaRoster(barisSses, parsed.personel, parsed.jadwal, labelBersih, riwayat) : []),
    [parsed, barisSses, labelBersih, riwayat],
  );
  const jumlahDipilih = rencana.filter(r => dipilih.has(r.key) && isAksiDapatDiterapkan(r.aksi)).length;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    setStatus({ type: null, message: '' });
    setParsed(null);
    try {
      const roster = await bacaFileRoster(file, tahun);
      const sses = filterRosterSsesT2(roster.rows);
      const tanggal = sses.flatMap(r => r.cells.map(c => c.tanggal)).sort();
      const personel = await muatPersonel();
      const ids = [...new Set(susunRencanaRoster(sses, personel, [], labelBersih).map(r => r.personelId).filter((id): id is string => !!id))];
      const jadwal = tanggal.length > 0 ? await muatJadwal(ids, tanggal[0], tanggal[tanggal.length - 1]) : [];
      const awal = susunRencanaRoster(sses, personel, jadwal, labelBersih, riwayat);
      setDipilih(new Set(awal.filter(r => isAksiDipilihOtomatis(r.aksi)).map(r => r.key)));
      setParsed({ fileName: file.name, roster, personel, jadwal });
    } catch (err) {
      console.error('Roster upload error:', err);
      setStatus({ type: 'error', message: getErrorMessage(err, 'Gagal membaca file roster.') });
    } finally {
      setIsParsing(false);
      e.target.value = '';
    }
  };

  const toggle = (key: string) => {
    setDipilih(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleTerapkan = async () => {
    if (!parsed || labelError || jumlahDipilih === 0) return;
    setIsApplying(true);
    try {
      const n = await simpanPenugasanRoster(rencana, dipilih, labelBersih, parsed.roster.judul);
      setStatus({ type: 'success', message: `${n} penugasan tersimpan. Tampil di Tab Kehadiran sebagai "*${labelBersih} :*" pada tanggal & shift masing-masing.` });
      setParsed(null);
      await fetchRiwayat();
    } catch (err) {
      setStatus({ type: 'error', message: getErrorMessage(err, 'Gagal menyimpan roster.') });
    } finally {
      setIsApplying(false);
    }
  };

  const handleHapus = async (entri: RiwayatRoster) => {
    if (!window.confirm(`Hapus ${entri.penugasan.length} penugasan "${entri.label}" (${fmtTanggal(entri.dari)} – ${fmtTanggal(entri.sampai)}) dari Tab Kehadiran?`)) return;
    setUndoingId(entri.id);
    try {
      await hapusRiwayatRoster(entri.id);
      setStatus({ type: 'success', message: `${entri.penugasan.length} penugasan "${entri.label}" dihapus.` });
      await fetchRiwayat();
    } catch (err) {
      setStatus({ type: 'error', message: getErrorMessage(err, 'Gagal menghapus roster.') });
    } finally {
      setUndoingId(null);
    }
  };

  const roster = parsed?.roster;
  const jumlahOrang = new Set(barisSses.map(r => r.nama)).size;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-amber-100 text-amber-700 rounded-lg">
          <Plane className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Upload Roster Penugasan (Bantuan)</h2>
          <p className="text-sm text-slate-500">
            Unggah roster apa adanya (PDF atau Excel), tidak perlu disaring. Hanya personel <b>{UNIT_SSES_T2}</b> yang
            diambil, lalu tampil sebagai bagian tambahan di Laporan Dinas Tab Kehadiran. Status kehadiran tidak diubah.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Judul bagian penugasan</label>
          <input
            type="text"
            value={label}
            maxLength={30}
            onChange={e => setLabel(e.target.value)}
            className={`w-full p-3 text-base border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none ${labelError ? 'border-rose-400' : 'border-slate-300'}`}
          />
          {labelError
            ? <p className="text-xs text-rose-600 mt-1">{labelError}</p>
            : <p className="text-xs text-slate-500 mt-1">Di WA: "*{labelBersih} :*" lalu "- Nama Personel"</p>}
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Tahun <span className="text-xs font-normal text-slate-400">(acuan bila roster tidak menulis tahun)</span>
          </label>
          <input
            type="number"
            value={tahun}
            onChange={e => setTahun(Number(e.target.value))}
            className="w-full p-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
      </div>

      <div className="relative border-2 border-dashed border-amber-300 rounded-xl bg-amber-50/50 hover:bg-amber-100/50 transition-colors cursor-pointer text-center p-8">
        <input
          type="file"
          accept=".pdf,.xlsx,.xls,application/pdf"
          onChange={handleFile}
          disabled={isParsing || isApplying || !!labelError}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        {isParsing ? (
          <div className="flex flex-col items-center justify-center gap-3 text-amber-700">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="font-bold">Membaca roster & mencocokkan jadwal shift...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 text-amber-800">
            <FileUp className="w-10 h-10 text-amber-600" />
            <p className="font-bold text-base">Pilih File Roster (PDF / Excel)</p>
            <p className="text-xs text-amber-700">
              Format: kolom Nama Personil, Unit Department, dan kolom tanggal (mis. "Wed 18/11") berisi kode PS-T2 / SP-T3.
              SP (Sore–Pagi) = shift Malam, PS (Pagi–Sore) = shift Pagi.
            </p>
          </div>
        )}
      </div>

      {status.type && (
        <div className={`mt-6 flex items-start gap-3 p-4 border rounded-lg ${status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          {status.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <p className="text-sm">{status.message}</p>
        </div>
      )}

      {parsed && roster && (
        <div className="mt-6 border border-amber-200 rounded-xl overflow-hidden">
          <div className="bg-amber-50 p-4 border-b border-amber-200">
            <p className="font-bold text-slate-800 text-sm">{roster.judul || parsed.fileName}</p>
            <p className="text-xs text-slate-600 mt-1">
              {roster.rows.length} baris roster · {roster.tanggal.length} tanggal
              {roster.tanggal.length > 0 && ` (${fmtTanggal(roster.tanggal[0])} – ${fmtTanggal(roster.tanggal[roster.tanggal.length - 1])})`}
              {' · '}{roster.rows.length - barisSses.length} baris unit lain diabaikan
            </p>
            <p className="text-sm font-semibold text-amber-900 mt-2">
              Personel T2 SSES: {jumlahOrang} orang, {rencana.length} penugasan
            </p>
            {roster.peringatan.map(w => (
              <p key={w} className="text-xs text-amber-800 mt-2 flex gap-1.5"><Info className="w-4 h-4 flex-shrink-0" />{w}</p>
            ))}
          </div>

          {rencana.length === 0 ? (
            <p className="p-4 text-sm text-slate-600 italic">Tidak ada penugasan personel {UNIT_SSES_T2} pada roster ini.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {rencana.map(r => {
                const bisa = isAksiDapatDiterapkan(r.aksi);
                const tampil = AKSI_TAMPIL[r.aksi];
                return (
                  <li key={r.key}>
                    <label className={`flex items-start gap-3 p-3 ${bisa ? 'cursor-pointer hover:bg-slate-50' : 'opacity-80'}`}>
                      <span className="flex items-center justify-center w-11 h-11 flex-shrink-0">
                        <input
                          type="checkbox"
                          className="w-5 h-5 accent-amber-600"
                          checked={bisa && dipilih.has(r.key)}
                          disabled={!bisa || isApplying}
                          onChange={() => toggle(r.key)}
                        />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-bold text-slate-800 text-sm">{fmtTanggal(r.tanggal)}</span>
                          <span className="text-xs font-mono text-slate-600">{r.kode} · {NAMA_SHIFT[r.shift]}</span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${tampil.cls}`}>{tampil.label}</span>
                        </span>
                        <span className="block text-sm text-slate-700 mt-0.5 break-words">{r.namaMaster || r.nama}</span>
                        <span className="block text-xs text-slate-500 mt-0.5 break-words">{keteranganAksi(r, labelBersih)}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 border-t border-slate-200">
            <button
              type="button"
              onClick={handleTerapkan}
              disabled={isApplying || jumlahDipilih === 0 || !!labelError}
              className="flex-1 min-h-11 px-4 py-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApplying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              Simpan {jumlahDipilih} penugasan
            </button>
            <button
              type="button"
              onClick={() => setParsed(null)}
              disabled={isApplying}
              className="min-h-11 px-4 py-3 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold flex items-center justify-center gap-2 hover:bg-slate-100 disabled:opacity-50"
            >
              <X className="w-5 h-5" /> Batal
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 border-t border-slate-200 pt-6">
        <h3 className="text-md font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-amber-600" /> Histori Roster Penugasan
          {isFetchingRiwayat && <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />}
        </h3>
        {riwayat.length === 0 && !isFetchingRiwayat ? (
          <p className="text-sm text-slate-500 italic">Belum ada roster penugasan yang disimpan.</p>
        ) : (
          <div className="space-y-3">
            {riwayat.map(e => (
              <div key={e.id} className="flex items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-sm break-words">{e.label}</p>
                  <p className="text-xs text-slate-600">{fmtTanggal(e.dari)} – {fmtTanggal(e.sampai)} · {e.penugasan.length} penugasan</p>
                  <p className="text-xs text-slate-400 break-words">{e.judul}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleHapus(e)}
                  disabled={undoingId === e.id}
                  className="min-w-11 min-h-11 p-2 text-rose-600 hover:bg-rose-100 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
                  title="Hapus roster ini dari Tab Kehadiran"
                >
                  {undoingId === e.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
