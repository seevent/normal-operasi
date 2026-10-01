// src/lib/utils/kehadiranMessage.ts
// Pesan WhatsApp laporan kehadiran (Laporan Dinas).
// Modul murni tanpa akses store/jaringan supaya bisa diuji langsung.

import { formatTanggalIndo } from './dateFormat.ts';
import { sortPersonelByJabatan } from '../data/masterData.ts';
import type { AttendanceRow, KehadiranFormData } from '../types.ts';

const formatPersonnelList = (list: AttendanceRow[]) => {
  const activeList = list.filter(item => item.name !== '');
  if (activeList.length === 0) return "- (Kosong)";
  return activeList.map(item => `- ${item.name} - ${item.status}\n     Tlp : ${item.phone}`).join('\n');
};

export const generateWA_Kehadiran = (attendanceData: KehadiranFormData) => {
  const formattedDate = formatTanggalIndo(attendanceData.tanggal);
  const greeting = 'Semangat Pagii.....!!!';

  const sortedApiList = sortPersonelByJabatan(attendanceData.apiList || []);
  const sortedOmList = sortPersonelByJabatan(attendanceData.omList || []);

  return `${greeting}

*LAPORAN DINAS*
*T2 Safety & Security Electronic Services*

Dinas    : ${attendanceData.shift}
Hari      : ${formattedDate}

*Personel API T2 :*
${formatPersonnelList(sortedApiList)}

*Personel OM IASS T2 :*
${formatPersonnelList(sortedOmList)}

Tlp Ruangan :
${attendanceData.tlpRuangan}

*Rencana Kegiatan :*
${attendanceData.rencanaKegiatan}`;
};
