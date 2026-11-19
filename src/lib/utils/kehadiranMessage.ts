// src/lib/utils/kehadiranMessage.ts
// Pesan WhatsApp laporan kehadiran (Laporan Dinas).
// Modul murni tanpa akses store/jaringan supaya bisa diuji langsung.

import { formatTanggalIndo } from './dateFormat.ts';
import { sortPersonelByJabatan, toTitleCase } from '../data/masterData.ts';

const formatPersonnelList = (list: any[]) => {
  const activeList = list.filter(item => item.name !== '');
  if (activeList.length === 0) return "- (Kosong)";
  return activeList.map(item => `- ${item.name} - ${item.status}\n     Tlp : ${item.phone}`).join('\n');
};

/** Bagian penugasan dari roster (mis. "*Bantuan Umroh SV :*"), diakhiri baris kosong; kosong bila tidak ada. */
const formatPenugasan = (penugasan: { label: string; nama: string[] }[] | undefined) =>
  (penugasan || [])
    .filter(g => g.nama.length > 0)
    .map(g => `*${g.label} :*\n${g.nama.map(n => `- ${toTitleCase(n)}`).join('\n')}\n\n`)
    .join('');

export const generateWA_Kehadiran = (attendanceData: any) => {
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

${formatPenugasan(attendanceData.penugasan)}Tlp Ruangan :
${attendanceData.tlpRuangan}

*Rencana Kegiatan :*
${attendanceData.rencanaKegiatan}`;
};
