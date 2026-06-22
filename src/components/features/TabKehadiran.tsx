import React, { useState, useEffect } from 'react';
import { Users, User, Calendar, ClipboardList, Plus, X, Share2, CheckCircle, FileText, Loader2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useMasterDataStore } from '../../store/useMasterDataStore';
import { generateWA_Kehadiran } from '../../lib/utils/waGenerator';
import { shareToWhatsApp } from '../../lib/services/shareService';
import { supabase } from '../../lib/supabaseClient';
import { toTitleCase } from '../../lib/data/masterData';

export const TabKehadiran: React.FC = () => {
  const { isCopied, setIsCopied } = useAppStore();
  const { dataApiT2, dataOmIasT2 } = useMasterDataStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [attendanceData, setAttendanceData] = useState(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const timeInMinutes = currentHour * 60 + currentMinute;
    
    // Shift changes at 07:30 (450 mins) and 19:30 (1170 mins)
    const isPagi = timeInMinutes >= 450 && timeInMinutes < 1170;
    const shiftValue = isPagi ? 'Pagi, 08.00 - 20.00 WIB' : 'Malam, 20.00 - 08.00 WIB';
    const kegiatan = isPagi 
      ? '- Monitoring Ops\n- Storing Peralatan\n- Preventive Maintenance & Kalibrasi Perangkat' 
      : '- Monitoring Ops\n- Storing Peralatan';
    
    const logicalDateObj = new Date(now.getTime());
    if (timeInMinutes < 450) {
      logicalDateObj.setDate(logicalDateObj.getDate() - 1);
    }
    const tzOffset = logicalDateObj.getTimezoneOffset() * 60000;
    const localDate = new Date(logicalDateObj.getTime() - tzOffset).toISOString().split('T')[0];
    
    return {
      tanggal: localDate,
      shift: shiftValue,
      apiList: [] as any[],
      omList: [] as any[],
      tlpRuangan: '- 021 550 5910',
      rencanaKegiatan: kegiatan
    };
  });

  useEffect(() => {
    const fetchJadwal = async () => {
      setIsLoading(true);
      try {
        const targetShiftCode = attendanceData.shift.includes('Pagi') ? 'PS' : 'M';

        const { data, error } = await supabase
          .from('jadwal_shift')
          .select(`
            id, shift, status_kehadiran,
            personel:personel_id (id, nama, no_hp, unit_kerja(nama))
          `)
          .eq('tanggal', attendanceData.tanggal)
          .neq('shift', 'D');

        if (error) throw error;

        const filteredData = ((data as any[]) || []).filter((d: any) => {
          const s = (d.shift || '').toUpperCase();
          if (targetShiftCode === 'PS') {
            return s === 'PS';
          } else {
            return s === 'M';
          }
        });

        const apiRows = filteredData
          .filter((d: any) => d.personel?.unit_kerja?.nama === 'API T2')
          .map(d => ({
            id: d.id,
            jadwal_id: d.id,
            personel_id: d.personel?.id,
            name: d.personel?.nama ? toTitleCase(d.personel.nama) : '',
            phone: d.personel?.no_hp || '',
            status: d.status_kehadiran || 'Hadir'
          }));

        const omRows = filteredData
          .filter((d: any) => d.personel?.unit_kerja?.nama === 'OM/IAS T2')
          .map((d: any) => ({
            id: d.id,
            jadwal_id: d.id,
            personel_id: d.personel?.id,
            name: d.personel?.nama ? toTitleCase(d.personel.nama) : '',
            phone: d.personel?.no_hp || '',
            status: d.status_kehadiran || 'Hadir'
          }));

        if (apiRows.length === 0) apiRows.push({ id: Date.now(), jadwal_id: null, personel_id: null, name: '', phone: '', status: 'Hadir' });
        if (omRows.length === 0) omRows.push({ id: Date.now()+1, jadwal_id: null, personel_id: null, name: '', phone: '', status: 'Hadir' });

        setAttendanceData(prev => ({
          ...prev,
          apiList: apiRows,
          omList: omRows
        }));
      } catch (err) {
        console.error('Error fetching jadwal:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJadwal();
  }, [attendanceData.tanggal, attendanceData.shift]);

  const handleAttendanceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAttendanceData({ ...attendanceData, [name]: value });
  };

  const handleShiftChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const shift = e.target.value;
    const isPagi = shift.includes('Pagi');
    const kegiatan = isPagi 
      ? '- Monitoring Ops\n- Storing Peralatan\n- Preventive Maintenance & Kalibrasi Perangkat' 
      : '- Monitoring Ops\n- Storing Peralatan';

    setAttendanceData({
      ...attendanceData,
      shift,
      rencanaKegiatan: kegiatan
    });
  };

  const handleRowChange = (listType: 'apiList' | 'omList', index: number, field: string, value: string) => {
    const newList = [...attendanceData[listType]];
    newList[index] = { ...newList[index], [field]: value };
    
    if (field === 'name') {
      const sourceData = listType === 'apiList' ? dataApiT2 : dataOmIasT2;
      const person = sourceData.find((p: any) => p.name === value);
      if (person) {
        newList[index].phone = person.phone;
        newList[index].personel_id = person.id;
      } else {
        newList[index].phone = '';
        newList[index].personel_id = null;
      }
    }
    
    setAttendanceData({ ...attendanceData, [listType]: newList });
  };

  const addRow = (listType: 'apiList' | 'omList') => {
    setAttendanceData({
      ...attendanceData,
      [listType]: [...attendanceData[listType], { id: Date.now(), jadwal_id: null, personel_id: null, name: '', phone: '', status: 'Hadir' }]
    });
  };

  const removeRow = (listType: 'apiList' | 'omList', index: number) => {
    const newList = [...attendanceData[listType]];
    newList.splice(index, 1);
    setAttendanceData({ ...attendanceData, [listType]: newList });
  };

  const handleDashChange = (e: React.ChangeEvent<HTMLTextAreaElement>, field: string) => {
    let value = e.target.value;
    if (!value.startsWith('- ')) {
      value = '- ' + value.replace(/^- /, '');
    }
    value = value.replace(/\n([^-])/g, '\n- $1');
    setAttendanceData(prev => ({ ...prev, [field]: value }));
  };

  const handleDashKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setAttendanceData(prev => ({ ...prev, [field]: prev[field as keyof typeof attendanceData] + '\n- ' }));
    }
  };

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const targetShiftCode = attendanceData.shift.includes('Pagi') ? 'PS' : 'M';
      const allRows = [...attendanceData.apiList, ...attendanceData.omList];

      for (const row of allRows) {
        if (!row.name || !row.personel_id) continue;
        
        if (row.jadwal_id) {
          await supabase.from('jadwal_shift')
            .update({ status_kehadiran: row.status })
            .eq('id', row.jadwal_id);
        } else {
          await supabase.from('jadwal_shift').upsert({
            personel_id: row.personel_id,
            tanggal: attendanceData.tanggal,
            shift: targetShiftCode,
            status_kehadiran: row.status
          }, { onConflict: 'personel_id, tanggal' });
        }
      }

      const message = generateWA_Kehadiran(attendanceData);
      await shareToWhatsApp(message, null, () => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
      });
    } catch (err) {
      console.error('Failed to save attendance', err);
      alert('Gagal menyimpan absensi ke database!');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleAttendanceSubmit} className="p-6 sm:p-8 space-y-8">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2">
          <Users className="w-5 h-5 text-blue-600" /> Info Shift
          {isLoading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin ml-2" />}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input type="date" name="tanggal" required value={attendanceData.tanggal} onChange={handleAttendanceChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dinas (Shift)</label>
            <select name="shift" value={attendanceData.shift} onChange={handleShiftChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer">
              <option value="Pagi, 08.00 - 20.00 WIB">Pagi, 08.00 - 20.00 WIB</option>
              <option value="Malam, 20.00 - 08.00 WIB">Malam, 20.00 - 08.00 WIB</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" /> Personel API T2
            </h2>
          </div>
        <div className="space-y-3">
          {attendanceData.apiList.map((row, index) => {
            const availableOptions = dataApiT2.filter(p => !attendanceData.apiList.some(r => r.name === p.name) || p.name === row.name);
            return (
              <div key={row.id} className={`flex flex-col sm:flex-row gap-2 items-start sm:items-center p-3 rounded-lg border ${row.jadwal_id ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-slate-200 border-dashed'}`}>
                <select value={row.name} onChange={(e) => handleRowChange('apiList', index, 'name', e.target.value)} className="w-full sm:w-2/5 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                  <option value="">- Pilih Personel -</option>
                  {availableOptions.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
                </select>
                <input type="text" value={row.phone} readOnly placeholder="No Telepon" className="w-full sm:w-1/4 px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm text-slate-500 outline-none cursor-not-allowed" />
                <select value={row.status} onChange={(e) => handleRowChange('apiList', index, 'status', e.target.value)} className={`w-full sm:w-1/4 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${row.status !== 'Hadir' ? 'text-rose-600 font-bold' : ''}`}>
                  <option value="Hadir">Hadir</option>
                  <option value="Izin">Izin</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Dinas Luar">Dinas Luar</option>
                </select>
                <button type="button" onClick={() => removeRow('apiList', index)} disabled={attendanceData.apiList.length <= 1} className={`w-full sm:w-auto p-2 rounded-md flex justify-center items-center transition-colors ${attendanceData.apiList.length <= 1 ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70' : 'bg-rose-100 text-rose-600 hover:bg-rose-200'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            );
          })}
          <button type="button" onClick={() => addRow('apiList')} className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2">
            <Plus className="w-4 h-4" /> Tambah Personel (Manual)
          </button>
        </div>
      </div>

      <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Personel OM IAS T2
            </h2>
          </div>
        <div className="space-y-3">
          {attendanceData.omList.map((row, index) => {
            const availableOptions = dataOmIasT2.filter(p => !attendanceData.omList.some(r => r.name === p.name) || p.name === row.name);
            return (
              <div key={row.id} className={`flex flex-col sm:flex-row gap-2 items-start sm:items-center p-3 rounded-lg border ${row.jadwal_id ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200 border-dashed'}`}>
                <select value={row.name} onChange={(e) => handleRowChange('omList', index, 'name', e.target.value)} className="w-full sm:w-2/5 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-emerald-500 appearance-none">
                  <option value="">- Pilih Personel -</option>
                  {availableOptions.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
                </select>
                <input type="text" value={row.phone} readOnly placeholder="No Telepon" className="w-full sm:w-1/4 px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm text-slate-500 outline-none cursor-not-allowed" />
                <select value={row.status} onChange={(e) => handleRowChange('omList', index, 'status', e.target.value)} className={`w-full sm:w-1/4 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-emerald-500 appearance-none ${row.status !== 'Hadir' ? 'text-rose-600 font-bold' : ''}`}>
                  <option value="Hadir">Hadir</option>
                  <option value="Izin">Izin</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Dinas Luar">Dinas Luar</option>
                </select>
                <button type="button" onClick={() => removeRow('omList', index)} disabled={attendanceData.omList.length <= 1} className={`w-full sm:w-auto p-2 rounded-md flex justify-center items-center transition-colors ${attendanceData.omList.length <= 1 ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70' : 'bg-rose-100 text-rose-600 hover:bg-rose-200'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            );
          })}
          <button type="button" onClick={() => addRow('omList')} className="text-sm font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 mt-2">
            <Plus className="w-4 h-4" /> Tambah Personel (Manual)
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2">
          <ClipboardList className="w-5 h-5 text-blue-600" /> Rencana & Informasi Tambahan
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tlp Ruangan</label>
            <input type="text" name="tlpRuangan" required value={attendanceData.tlpRuangan} onChange={handleAttendanceChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rencana Kegiatan Harian</label>
            <textarea name="rencanaKegiatan" required rows={4} value={attendanceData.rencanaKegiatan} onChange={(e) => handleDashChange(e, 'rencanaKegiatan')} onKeyDown={(e) => handleDashKeyDown(e, 'rencanaKegiatan')} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm leading-relaxed"></textarea>
            {(() => {
              const pmText = "- Preventive Maintenance & Kalibrasi Perangkat";
              const hasPM = attendanceData.rencanaKegiatan.includes(pmText);
              return (
                <button 
                  type="button" 
                  onClick={() => {
                    if (hasPM) {
                      let newText = attendanceData.rencanaKegiatan.replace('\n' + pmText, '').replace(pmText, '').trim();
                      setAttendanceData({ ...attendanceData, rencanaKegiatan: newText });
                    } else {
                      let newText = attendanceData.rencanaKegiatan.trim();
                      if (newText.length > 0) newText += '\n';
                      newText += pmText;
                      setAttendanceData({ ...attendanceData, rencanaKegiatan: newText });
                    }
                  }}
                  className="mt-2 flex items-center gap-1.5 text-sm font-medium transition-colors"
                >
                  {hasPM ? (
                    <>
                      <X className="w-4 h-4 text-red-500" />
                      <span className="text-red-600 hover:text-red-700">Hapus PM & Kalibrasi</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-600 hover:text-emerald-700">Tambahkan PM & Kalibrasi</span>
                    </>
                  )}
                </button>
              );
            })()}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <button type="submit" disabled={isLoading || isSaving} className={`w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${isCopied ? 'bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]' : 'bg-[#25D366] hover:bg-[#20b858] hover:shadow-xl hover:-translate-y-0.5 text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}>
          {isSaving ? (
            <><Loader2 className="w-6 h-6 animate-spin" /> Menyimpan...</>
          ) : isCopied ? (
            <><CheckCircle className="w-6 h-6 animate-pulse" /> Tersimpan & Disalin!</>
          ) : (
            <><Share2 className="w-6 h-6" /> Share Kehadiran ke WA</>
          )}
        </button>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-8">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" /> Preview Laporan Kehadiran (Real-time)
        </h3>
        <div className="bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative">
          <div className="bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%]">
            {generateWA_Kehadiran(attendanceData)}
          </div>
        </div>
      </div>
    </form>
  );
};
