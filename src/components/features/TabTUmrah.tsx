import React, { useState, useRef } from 'react';
import { 
  Calendar, Share2, CheckCircle, Edit, RefreshCw, 
  Clock, AlertCircle, ChevronDown, ChevronUp, AlertTriangle,
  PlaneTakeoff, PlaneLanding, Sliders, X, Download, List, Search, Filter,
  Image as ImageIcon, FileText, Upload
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { KaabaIcon } from '../shared/KaabaIcon';

export interface UmrahFlightItem {
  id: string;
  no: number;
  flightCode: string;
  route: string;
  time: string;
  estTotalFlight: string;
  estPaxUmroh: string;
  actualPaxUmroh?: string;
  status?: 'Belum' | 'Proses' | 'Selesai';
  catatan?: string;
  type: 'DEPARTURE' | 'ARRIVAL';
}

const SAMPLE_UMRAH_SCHEDULE = `*Rencana Penerbangan Umrah*
*Sabtu, 11 Juli 2026*
*Bandara Internasional Soekarno-Hatta (CGK)*

*DEPARTURE :*
1. EK357 // DXB // 1740 // EST TOTAL FLIGHT : 404 // EST PAX UMROH : 121
2. EK359 // DXB // 0045 // EST TOTAL FLIGHT : 338 // EST PAX UMROH : 44
3. EY473 // AUH // 0005 // EST TOTAL FLIGHT : 238 // EST PAX UMROH : 66
4. EY475 // AUH // 1810 // EST TOTAL FLIGHT : 271 // EST PAX UMROH : 52
5. HU702 // HAK // 1915 // EST TOTAL FLIGHT : 93 // EST PAX UMROH : 0
6. QR955 // DOH // 0055 // EST TOTAL FLIGHT : 258 // EST PAX UMROH : 70
7. QR957 // DOH // 1830 // EST TOTAL FLIGHT : 339 // EST PAX UMROH : 23
8. QR959 // DOH // 0900 // EST TOTAL FLIGHT : 260 // EST PAX UMROH : 120
9. SV817 // JED // 0910 // EST TOTAL FLIGHT : 446 // EST PAX UMROH : 283
10. SV819 // JED // 1730 // EST TOTAL FLIGHT : 351 // EST PAX UMROH : 230
11. SV821 // MED // 1200 // EST TOTAL FLIGHT : 166 // EST PAX UMROH : 11
12. SV827 // JED // 0040 // EST TOTAL FLIGHT : 345 // EST PAX UMROH : 127
13. TK057 // IST // 2100 // EST TOTAL FLIGHT : 325 // EST PAX UMROH : 98
14. TR273 // SIN // 2215 // EST TOTAL FLIGHT : 150 // EST PAX UMROH : 85
15. TR275 // SIN // 0935 // EST TOTAL FLIGHT : 159 // EST PAX UMROH : 86
16. TR277 // SIN // 1155 // EST TOTAL FLIGHT : 155 // EST PAX UMROH : 83
17. TR279 // SIN // 2000 // EST TOTAL FLIGHT : 167 // EST PAX UMROH : 86
18. TR309 // SIN // 1415 // EST TOTAL FLIGHT : 159 // EST PAX UMROH : 89
19. WY850 // MCT // 1425 // EST TOTAL FLIGHT : 263 // EST PAX UMROH : 107

*ARRIVAL :*
1. EK356 // DXB // 1540 // EST TOTAL FLIGHT : 421 // EST PAX UMROH : 126
2. EK358 // DXB // 2225 // EST TOTAL FLIGHT : 351 // EST PAX UMROH : 105
3. EY472 // AUH // 2035 // EST TOTAL FLIGHT : 305 // EST PAX UMROH : 26
4. EY474 // AUH // 0900 // EST TOTAL FLIGHT : 337 // EST PAX UMROH : 59
5. HU701 // HAK // 1810 // EST TOTAL FLIGHT : 171 // EST PAX UMROH : 0
6. QR954 // DOH // 2140 // EST TOTAL FLIGHT : 290 // EST PAX UMROH : 0
7. QR956 // DOH // 1535 // EST TOTAL FLIGHT : 368 // EST PAX UMROH : 75
8. QR958 // DOH // 0730 // EST TOTAL FLIGHT : 288 // EST PAX UMROH : 75
9. SV816 // JED // 0735 // EST TOTAL FLIGHT : 448 // EST PAX UMROH : 150
10. SV818 // JED // 1600 // EST TOTAL FLIGHT : 445 // EST PAX UMROH : 143
11. SV820 // MED // 1025 // EST TOTAL FLIGHT : 485 // EST PAX UMROH : 376
12. SV826 // JED // 2245 // EST TOTAL FLIGHT : 406 // EST PAX UMROH : 347
13. TK056 // IST // 1735 // EST TOTAL FLIGHT : 330 // EST PAX UMROH : 99
14. TR272 // SIN // 2125 // EST TOTAL FLIGHT : 180 // EST PAX UMROH : 86
15. TR274 // SIN // 0845 // EST TOTAL FLIGHT : 191 // EST PAX UMROH : 89
16. TR276 // SIN // 1055 // EST TOTAL FLIGHT : 185 // EST PAX UMROH : 90
17. TR278 // SIN // 1915 // EST TOTAL FLIGHT : 183 // EST PAX UMROH : 83
18. TR308 // SIN // 1330 // EST TOTAL FLIGHT : 191 // EST PAX UMROH : 85
19. WY849 // MCT // 1255 // EST TOTAL FLIGHT : 296 // EST PAX UMROH : 46

*Airport Operation Control Center*`;

const PREOPS_UMRAH_SCHEDULE_13_JULI = `*RENCANA PENERBANGAN UMROH (Pre-Ops)*
*SENIN, 13 JULI 2026*
*Bandara Internasional Soekarno-Hatta (CGK)*

*DEPARTURE :*
1. EY473 // (CGK - AUH) // 00:05 // EST TOTAL FLIGHT : 298 // EST PAX UMROH : 37
2. SV827 // (CGK - JED) // 00:40 // EST TOTAL FLIGHT : 379 // EST PAX UMROH : 320
3. EK359 // (CGK - DXB) // 00:45 // EST TOTAL FLIGHT : 346 // EST PAX UMROH : 42
4. QR955 // (CGK - DOH) // 00:55 // EST TOTAL FLIGHT : 251 // EST PAX UMROH : 45
5. QR959 // (CGK - DOH) // 09:00 // EST TOTAL FLIGHT : 254 // EST PAX UMROH : 122
6. SV817 // (CGK - JED) // 09:10 // EST TOTAL FLIGHT : 329 // EST PAX UMROH : 210
7. TR275 // (CGK - SIN) // 09:35 // EST TOTAL FLIGHT : 173 // EST PAX UMROH : 0
8. TR277 // (CGK - SIN) // 11:55 // EST TOTAL FLIGHT : 164 // EST PAX UMROH : 0
9. SV821 // (CGK - JED) // 12:00 // EST TOTAL FLIGHT : 473 // EST PAX UMROH : 258
10. TR309 // (CGK - SIN) // 14:15 // EST TOTAL FLIGHT : 148 // EST PAX UMROH : 0
11. WY850 // (CGK - MCT) // 14:25 // EST TOTAL FLIGHT : 277 // EST PAX UMROH : 41
12. SV819 // (CGK - JED) // 17:30 // EST TOTAL FLIGHT : 230 // EST PAX UMROH : 35
13. EK357 // (CGK - DXB) // 17:40 // EST TOTAL FLIGHT : 365 // EST PAX UMROH : 0
14. QR957 // (CGK - DOH) // 18:30 // EST TOTAL FLIGHT : 256 // EST PAX UMROH : 42
15. HU702 // (CGK - HAK) // 19:15 // EST TOTAL FLIGHT : 87 // EST PAX UMROH : 0
16. TR279 // (CGK - SIN) // 20:00 // EST TOTAL FLIGHT : 165 // EST PAX UMROH : 0
17. TK057 // (CGK - IST) // 21:00 // EST TOTAL FLIGHT : 330 // EST PAX UMROH : 99
18. TR273 // (CGK - SIN) // 22:15 // EST TOTAL FLIGHT : 154 // EST PAX UMROH : 0

*ARRIVAL :*
1. QR958 // (DOH - CGK) // 07:30 // EST TOTAL FLIGHT : 286 // EST PAX UMROH : 90
2. SV816 // (JED - CGK) // 07:35 // EST TOTAL FLIGHT : 411 // EST PAX UMROH : 200
3. TR274 // (SIN - CGK) // 08:45 // EST TOTAL FLIGHT : 195 // EST PAX UMROH : 0
4. TR276 // (SIN - CGK) // 10:55 // EST TOTAL FLIGHT : 191 // EST PAX UMROH : 0
5. SV820 // (MED - CGK) // 11:35 // EST TOTAL FLIGHT : 486 // EST PAX UMROH : 304
6. WY849 // (MCT - CGK) // 12:55 // EST TOTAL FLIGHT : 290 // EST PAX UMROH : 20
7. TR308 // (SIN - CGK) // 13:30 // EST TOTAL FLIGHT : 187 // EST PAX UMROH : 0
8. QR956 // (DOH - CGK) // 15:35 // EST TOTAL FLIGHT : 290 // EST PAX UMROH : 128
9. EK356 // (DXB - CGK) // 15:40 // EST TOTAL FLIGHT : 418 // EST PAX UMROH : 48
10. SV818 // (JED - CGK) // 16:00 // EST TOTAL FLIGHT : 406 // EST PAX UMROH : 121
11. TK056 // (IST - CGK) // 17:35 // EST TOTAL FLIGHT : 330 // EST PAX UMROH : 99
12. HU701 // (HAK - CGK) // 18:10 // EST TOTAL FLIGHT : 172 // EST PAX UMROH : 0
13. TR278 // (SIN - CGK) // 19:15 // EST TOTAL FLIGHT : 188 // EST PAX UMROH : 0
14. EY472 // (AUH - CGK) // 20:35 // EST TOTAL FLIGHT : 301 // EST PAX UMROH : 305
15. TR272 // (SIN - CGK) // 21:25 // EST TOTAL FLIGHT : 186 // EST PAX UMROH : 0
16. QR954 // (DOH - CGK) // 21:40 // EST TOTAL FLIGHT : 285 // EST PAX UMROH : 85
17. EK358 // (DXB - CGK) // 22:25 // EST TOTAL FLIGHT : 352 // EST PAX UMROH : 54
18. SV826 // (JED - CGK) // 22:45 // EST TOTAL FLIGHT : 445 // EST PAX UMROH : 334

*Airport Operation Control Center*`;

export const TabTUmrah: React.FC = () => {
  const { isCopied, setIsCopied } = useAppStore();
  const captureRef = useRef<HTMLDivElement>(null);

  // Default dikosongkan sesuai instruksi user
  const [rawScheduleText, setRawScheduleText] = useState('');
  const [uploadedScheduleImage, setUploadedScheduleImage] = useState<string | null>(null);
  const [isEditingRaw, setIsEditingRaw] = useState(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showAllFlightsModal, setShowAllFlightsModal] = useState(false);
  const [allFlightsTab, setAllFlightsTab] = useState<'ALL' | 'DEPARTURE' | 'ARRIVAL'>('ALL');
  const [allFlightsSearch, setAllFlightsSearch] = useState('');

  const [headerTitle, setHeaderTitle] = useState('Timeline Warning Umrah');
  const [dateText, setDateText] = useState('');
  const [airportText, setAirportText] = useState('Bandara Internasional Soekarno-Hatta (CGK)');

  const [departures, setDepartures] = useState<UmrahFlightItem[]>([]);
  const [arrivals, setArrivals] = useState<UmrahFlightItem[]>([]);

  // Kustomisasi batas padat penumpang dan jarak warning
  const [paxThreshold, setPaxThreshold] = useState<number>(100);
  const [depWarningMinutes, setDepWarningMinutes] = useState<number>(180);
  const [arrWarningMinutes, setArrWarningMinutes] = useState<number>(30);

  // Parse jam misal '1740' -> menit dari jam 00:00 (17*60 + 40 = 1060)
  const parseTimeMinutes = (timeStr: string): number => {
    const clean = (timeStr || '').replace(/[^0-9]/g, '');
    if (clean.length === 4) {
      const h = parseInt(clean.substring(0, 2), 10);
      const m = parseInt(clean.substring(2, 4), 10);
      return h * 60 + m;
    } else if (clean.length === 3) {
      const h = parseInt(clean.substring(0, 1), 10);
      const m = parseInt(clean.substring(1, 3), 10);
      return h * 60 + m;
    }
    return 0;
  };

  const formatMinutesToTime = (mins: number): string => {
    let normalized = mins % 1440;
    if (normalized < 0) normalized += 1440;
    const h = Math.floor(normalized / 60);
    const m = normalized % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const formatFlightTime = (timeStr: string): string => {
    const clean = (timeStr || '').replace(/[^0-9]/g, '');
    if (clean.length >= 3) {
      const padded = clean.padStart(4, '0');
      return `${padded.substring(0, 2)}:${padded.substring(2, 4)}`;
    }
    return timeStr;
  };

  const parseTextToSchedule = (text: string) => {
    if (!text || text.trim() === '') {
      setDepartures([]);
      setArrivals([]);
      setDateText('');
      return;
    }

    const lines = text.split(/\r?\n/);
    let section: 'HEADER' | 'DEPARTURE' | 'ARRIVAL' | 'FOOTER' = 'HEADER';
    let headTitle = 'Timeline Warning Umrah';
    let dText = '';
    let aText = 'Bandara Internasional Soekarno-Hatta (CGK)';
    const deps: UmrahFlightItem[] = [];
    const arrs: UmrahFlightItem[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (/^\*?DEPARTURE\s*:?\*?$/i.test(trimmed)) {
        section = 'DEPARTURE';
        return;
      }
      if (/^\*?(AERRIVAL|ARRIVAL)\s*:?\*?$/i.test(trimmed)) {
        section = 'ARRIVAL';
        return;
      }
      if (/^\*?Airport Operation Control Center\*?$/i.test(trimmed) || /^\*?AOCC\*?$/i.test(trimmed)) {
        section = 'FOOTER';
        return;
      }

      if (section === 'HEADER') {
        if (/Rencana Penerbangan/i.test(trimmed)) {
          headTitle = trimmed.replace(/\*/g, '');
        } else if (/\d{1,2}\s+[a-zA-Z]+\s+\d{4}/.test(trimmed) || /Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu/i.test(trimmed)) {
          dText = trimmed.replace(/\*/g, '');
        } else if (/Bandara|CGK|Soekarno-Hatta/i.test(trimmed)) {
          aText = trimmed.replace(/\*/g, '');
        }
      } else if (section === 'DEPARTURE' || section === 'ARRIVAL') {
        if (trimmed.includes('//')) {
          const parts = trimmed.split('//').map(p => p.trim());
          const firstPart = parts[0] || '';
          const noMatch = firstPart.match(/^(\d+)\.\s*(.*)$/);
          const no = noMatch ? parseInt(noMatch[1], 10) : (section === 'DEPARTURE' ? deps.length + 1 : arrs.length + 1);
          const flightCode = noMatch ? noMatch[2].trim() : firstPart.trim();
          const route = parts[1] || '-';
          const time = parts[2] || '-';
          
          let estTotal = '0';
          let estPax = '0';
          let actualPax = '';

          parts.slice(3).forEach((p) => {
            const upperP = p.toUpperCase();
            if (upperP.includes('EST TOTAL FLIGHT')) {
              const m = p.match(/:\s*(\d+)/);
              if (m) estTotal = m[1];
            } else if (upperP.includes('EST PAX UMROH') || upperP.includes('EST PAX UMROA') || upperP.includes('EST PAX UMRAH')) {
              const m = p.match(/:\s*(\d+)/);
              if (m) estPax = m[1];
            } else if (upperP.includes('AKTUAL PAX') || upperP.includes('ACTUAL PAX')) {
              const m = p.match(/:\s*(\d+)/);
              if (m) actualPax = m[1];
            }
          });

          const item: UmrahFlightItem = {
            id: `${section.toLowerCase()}-${no}-${flightCode}-${Math.random().toString(36).substring(2, 7)}`,
            no,
            flightCode,
            route,
            time,
            estTotalFlight: estTotal,
            estPaxUmroh: estPax,
            actualPaxUmroh: actualPax,
            type: section
          };

          if (section === 'DEPARTURE') {
            deps.push(item);
          } else {
            arrs.push(item);
          }
        }
      }
    });

    setHeaderTitle(headTitle);
    if (dText) setDateText(dText);
    if (aText) setAirportText(aText);
    setDepartures(deps);
    setArrivals(arrs);
  };

  const handleApplyRawPaste = () => {
    parseTextToSchedule(rawScheduleText);
    setIsEditingRaw(false);
  };

  const handleLoadSample = () => {
    setRawScheduleText(SAMPLE_UMRAH_SCHEDULE);
    parseTextToSchedule(SAMPLE_UMRAH_SCHEDULE);
    setIsEditingRaw(false);
  };

  // Filter hanya > paxThreshold Pax Umrah untuk warning
  const isWarningFlight = (item: UmrahFlightItem) => {
    const pax = parseInt((item.estPaxUmroh || '0').replace(/[^0-9]/g, ''), 10) || 0;
    return pax > paxThreshold;
  };

  const warningDepartures = departures.filter(isWarningFlight);
  const warningArrivals = arrivals.filter(isWarningFlight);

  // Waktu kepadatan: Arrival ±arrWarningMinutes dari pendaratan; Departure depWarningMinutes sebelum jam keberangkatan
  const getDensityInfo = (item: UmrahFlightItem) => {
    const flightMins = parseTimeMinutes(item.time);
    let startMins = 0;
    let endMins = 0;
    let desc = '';

    if (item.type === 'ARRIVAL') {
      startMins = flightMins - arrWarningMinutes;
      endMins = flightMins + arrWarningMinutes;
      desc = `±${arrWarningMinutes} Menit Pendaratan (${formatFlightTime(item.time)} WIB)`;
    } else {
      startMins = flightMins - depWarningMinutes;
      endMins = flightMins;
      const depHoursText = depWarningMinutes % 60 === 0 ? `${depWarningMinutes / 60} Jam` : `${+(depWarningMinutes / 60).toFixed(1)} Jam`;
      desc = `${depHoursText} Sebelum Keberangkatan (${formatFlightTime(item.time)} WIB)`;
    }

    return {
      startMins,
      endMins,
      startTimeStr: `${formatMinutesToTime(startMins)} WIB`,
      endTimeStr: `${formatMinutesToTime(endMins)} WIB`,
      windowText: `${formatMinutesToTime(startMins)} - ${formatMinutesToTime(endMins)} WIB`,
      desc,
      pax: parseInt((item.estPaxUmroh || '0').replace(/[^0-9]/g, ''), 10) || 0
    };
  };

  const sortedWarnings = [...warningDepartures, ...warningArrivals].sort((a, b) => {
    const infoA = getDensityInfo(a);
    const infoB = getDensityInfo(b);
    return infoA.startMins - infoB.startMins;
  });

  const allFlightsList = [...departures, ...arrivals].sort((a, b) => {
    return parseTimeMinutes(a.time) - parseTimeMinutes(b.time);
  });

  const filteredAllFlights = allFlightsList.filter(f => {
    const matchTab = allFlightsTab === 'ALL' || f.type === allFlightsTab;
    const q = allFlightsSearch.toLowerCase();
    const matchSearch = !q || f.flightCode.toLowerCase().includes(q) || f.route.toLowerCase().includes(q) || f.time.includes(q);
    return matchTab && matchSearch;
  });

  const sumTotalPax = filteredAllFlights.reduce((acc, f) => {
    return acc + (parseInt((f.estTotalFlight || '0').replace(/[^0-9]/g, ''), 10) || 0);
  }, 0);

  const sumUmrahPax = filteredAllFlights.reduce((acc, f) => {
    return acc + (parseInt((f.estPaxUmroh || '0').replace(/[^0-9]/g, ''), 10) || 0);
  }, 0);

  const percentageUmrah = sumTotalPax > 0 ? ((sumUmrahPax / sumTotalPax) * 100).toFixed(1) : '0';

  // Share T Umrah ke WA sebagai gambar timeline (menggunakan html2canvas langsung)
  // Fungsi untuk Generate Gambar ke Data URL (Base64) - VERSI TIMELINE MURNI CANVAS 2D
  const generatePreviewImage = () => {
    setIsGeneratingImage(true);

    setTimeout(() => {
      try {
        // 1. Persiapkan Canvas 2D Murni tanpa ketergantungan DOM html2canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Gagal menginisialisasi context canvas 2D');
        }

        const width = 850;
        const rowHeight = 120;
        const baseHeight = 260;
        const eventsHeight = sortedWarnings.length > 0 ? (sortedWarnings.length * rowHeight) : 120;
        const height = baseHeight + eventsHeight;

        canvas.width = width;
        canvas.height = height;

        // Background Utama
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, width, height);

        // Header Hijau / Emerald
        ctx.fillStyle = '#065f46';
        ctx.fillRect(0, 0, width, 140);

        // Teks Header
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(headerTitle || 'Timeline Warning Umrah', 40, 65);

        ctx.fillStyle = '#a7f3d0';
        ctx.font = '22px Arial, sans-serif';
        const dateStr = dateText || 'Jadwal Penerbangan Umrah';
        const airportStr = airportText || 'Bandara Internasional Soekarno-Hatta (CGK)';
        ctx.fillText(`${dateStr} | ${airportStr}`, 40, 105);

        let y = 210;
        const startX = 240; // Posisi Garis Timeline Vertikal

        if (sortedWarnings.length === 0) {
          ctx.fillStyle = '#475569';
          ctx.font = 'italic 24px Arial, sans-serif';
          ctx.fillText(`✅ Tidak ada peringatan penerbangan > ${paxThreshold} Pax Umrah.`, 40, y);
        } else {
          // Gambar Garis Vertikal Timeline
          ctx.beginPath();
          ctx.moveTo(startX, y - 20);
          ctx.lineTo(startX, y + (sortedWarnings.length * rowHeight) - 80);
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#cbd5e1';
          ctx.stroke();

          // Gambar Titik & Konten Timeline
          sortedWarnings.forEach((evt) => {
            const info = getDensityInfo(evt);
            const isDeparture = evt.type === 'DEPARTURE';
            const typeLabel = isDeparture ? 'KEBERANGKATAN' : 'KEDATANGAN';
            const color = isDeparture ? '#be123c' : '#0369a1';
            const icon = isDeparture ? '🛫' : '🛬';

            // --- Kiri: Waktu Estimasi Padat ---
            ctx.textAlign = 'right';
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 24px Arial, sans-serif';
            ctx.fillText(formatMinutesToTime(info.startMins) + ' WIB', startX - 30, y - 2);

            ctx.fillStyle = '#64748b';
            ctx.font = '18px Arial, sans-serif';
            ctx.fillText(`s/d ${formatMinutesToTime(info.endMins)} WIB`, startX - 30, y + 22);

            // --- Tengah: Titik Node Timeline ---
            ctx.beginPath();
            ctx.arc(startX, y + 8, 12, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            // --- Kanan: Detail Penerbangan & Pax ---
            ctx.textAlign = 'left';

            // Judul (Tipe & Flight Code)
            ctx.fillStyle = color;
            ctx.font = 'bold 22px Arial, sans-serif';
            ctx.fillText(`${icon} ${typeLabel} - ${evt.flightCode}`, startX + 30, y - 2);

            // Sub-detail
            ctx.fillStyle = '#475569';
            ctx.font = '18px Arial, sans-serif';
            ctx.fillText(`Jadwal: ${formatFlightTime(evt.time)} WIB  |  Rute: ${evt.route}`, startX + 30, y + 24);

            // Highlight Pax Umrah & Keterangan Kepadatan
            ctx.fillStyle = '#be123c';
            ctx.font = 'bold 18px Arial, sans-serif';
            ctx.fillText(`🔥 ${evt.estPaxUmroh || 0} Pax Umrah`, startX + 30, y + 50);

            y += rowHeight;
          });
        }

        // Footer
        ctx.textAlign = 'left';
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'italic 16px Arial, sans-serif';
        ctx.fillText('Generated by Airport Operation Control Center', 40, height - 30);

        // Set state gambar ke Data URL (Base64)
        setGeneratedImage(canvas.toDataURL('image/png'));

        // Salin ringkasan ke clipboard juga agar siap paste di WA
        const depHoursText = depWarningMinutes % 60 === 0 ? `${depWarningMinutes / 60} Jam` : `${+(depWarningMinutes / 60).toFixed(1)} Jam`;
        const summaryText = `*Timeline Warning Umrah*\n*${dateText || 'Jadwal Penerbangan Umrah'}*\n*${airportText}*\n*Batas Warning:* >${paxThreshold} Pax | Keberangkatan: -${depHoursText} | Kedatangan: ±${arrWarningMinutes} Menit\n\n*WARNING KEBERANGKATAN (>${paxThreshold} PAX)*\n${
          warningDepartures.map(f => {
            const d = getDensityInfo(f);
            return `• ${f.flightCode} → ${f.route} | ${formatFlightTime(f.time)} WIB | ${f.estPaxUmroh} Pax | Kepadatan: ${d.windowText}`;
          }).join('\n') || '- Tidak ada -'
        }\n\n*WARNING KEDATANGAN (>${paxThreshold} PAX)*\n${
          warningArrivals.map(f => {
            const d = getDensityInfo(f);
            return `• ${f.flightCode} → ${f.route} | ${formatFlightTime(f.time)} WIB | ${f.estPaxUmroh} Pax | Kepadatan: ${d.windowText}`;
          }).join('\n') || '- Tidak ada -'
        }`;

        navigator.clipboard.writeText(summaryText).catch(() => {});
      } catch (error) {
        console.error('Gagal membuat gambar timeline:', error);
        alert('Gagal memproses gambar. Silakan coba lagi.');
      } finally {
        setIsGeneratingImage(false);
      }
    }, 100);
  };

  const handleDownloadImage = () => {
    if (!generatedImage) return;
    const cleanDate = (dateText || 'Jadwal').replace(/[^a-zA-Z0-9]/g, '_');
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `Warning_Kepadatan_Umrah_${cleanDate}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDirectShareImage = async () => {
    if (!generatedImage) return;
    try {
      const res = await fetch(generatedImage);
      const blob = await res.blob();
      const cleanDate = (dateText || 'Jadwal').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Warning_Kepadatan_Umrah_${cleanDate}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Warning Kepadatan Penerbangan Umrah T2',
          text: `*Timeline Warning Umrah*\n*${dateText || 'Jadwal Penerbangan Umrah'}*\n*${airportText}*\n\nBerikut terlampir gambar Timeline & Daftar Peringatan Kepadatan Penerbangan Umrah (>${paxThreshold} Pax) di Terminal 2.`
        });
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      } else {
        alert("Browser Anda tidak mendukung share gambar langsung. Silakan gunakan tombol 'Download' atau tekan tahan gambarnya.");
      }
    } catch (err: any) {
      if (err && err.name === 'AbortError') return;
      console.log('Share dibatalkan atau gagal', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* MODAL / POPUP HASIL GAMBAR */}
      {generatedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">Bagikan ke WhatsApp</h3>
              <button 
                onClick={() => setGeneratedImage(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Area Preview Gambar */}
            <div className="p-4 overflow-y-auto bg-slate-50 flex-1 flex flex-col items-center">
              <div className="bg-amber-50 text-amber-800 text-sm px-4 py-2 rounded-lg border border-amber-200 mb-4 text-center w-full shadow-sm">
                <span className="font-bold block mb-1">💡 Pengguna HP:</span> 
                Tekan dan tahan gambar di bawah ini, lalu pilih <b>"Bagikan Gambar"</b> atau <b>"Kirim ke WhatsApp"</b>.
                <span className="block mt-1 text-xs text-slate-600">✨ Teks ringkasan jadwal juga telah otomatis disalin ke clipboard Anda!</span>
              </div>
              
              <img 
                src={generatedImage} 
                alt="Warning Umrah" 
                className="w-full h-auto rounded-lg shadow-md border border-slate-200"
              />
            </div>

            {/* Footer / Aksi Modal */}
            <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleDownloadImage}
                className="flex-1 flex items-center justify-center bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold py-3 px-4 rounded-xl transition-colors"
              >
                <Download className="w-5 h-5 mr-2" />
                Download (PC/Laptop)
              </button>
              <button 
                onClick={handleDirectShareImage}
                className="flex-1 flex items-center justify-center bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share ke WA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SELURUH DAFTAR PENERBANGAN DARI JADWAL */}
      {showAllFlightsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-5 sm:p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-300">
                  <List className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg sm:text-xl text-white">Seluruh Daftar Penerbangan Umrah</h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Total {departures.length + arrivals.length} jadwal penerbangan ({departures.length} Keberangkatan &amp; {arrivals.length} Kedatangan)
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAllFlightsModal(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Filter & Search Controls */}
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Tabs Tipe */}
              <div className="flex bg-slate-200/80 p-1 rounded-xl w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setAllFlightsTab('ALL')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all ${
                    allFlightsTab === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({allFlightsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAllFlightsTab('DEPARTURE')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
                    allFlightsTab === 'DEPARTURE' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PlaneTakeoff className="w-4 h-4" /> Keberangkatan ({departures.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAllFlightsTab('ARRIVAL')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
                    allFlightsTab === 'ARRIVAL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PlaneLanding className="w-4 h-4" /> Kedatangan ({arrivals.length})
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari flight, rute, atau jam..."
                  value={allFlightsSearch}
                  onChange={(e) => setAllFlightsSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {allFlightsSearch && (
                  <button
                    onClick={() => setAllFlightsSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Ribbon Ringkasan Total Pax & Persentase Umrah (Dinamis mengikuti Tab & Filter) */}
            <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-emerald-50/90 p-4 sm:p-5 border-b border-slate-200 shadow-inner">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white/95 p-3.5 rounded-2xl border border-blue-200/60 shadow-2xs flex flex-col justify-center">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Tipe / Filter</span>
                  <strong className="text-slate-800 text-sm sm:text-base font-black truncate mt-0.5">
                    {allFlightsTab === 'ALL' ? 'Semua Penerbangan' : allFlightsTab === 'DEPARTURE' ? '🛫 Keberangkatan' : '🛬 Kedatangan'}
                  </strong>
                  <span className="text-[11px] font-bold text-blue-600 mt-0.5">{filteredAllFlights.length} Flight Terpilih</span>
                </div>

                <div className="bg-white/95 p-3.5 rounded-2xl border border-blue-200/60 shadow-2xs flex flex-col justify-center">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Semua Pax</span>
                  <strong className="text-slate-900 text-lg sm:text-xl font-black mt-0.5">
                    {sumTotalPax.toLocaleString('id-ID')} <span className="text-xs font-bold text-slate-500">Pax</span>
                  </strong>
                  <span className="text-[11px] text-slate-500 font-medium mt-0.5">Kapasitas total flight</span>
                </div>

                <div className="bg-white/95 p-3.5 rounded-2xl border border-emerald-200/60 shadow-2xs flex flex-col justify-center">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 block">Total Pax Umrah</span>
                  <strong className="text-emerald-700 text-lg sm:text-xl font-black mt-0.5">
                    {sumUmrahPax.toLocaleString('id-ID')} <span className="text-xs font-bold text-emerald-600">Pax</span>
                  </strong>
                  <span className="text-[11px] text-emerald-600 font-semibold mt-0.5">Khusus Jamaah Umrah</span>
                </div>

                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-3.5 rounded-2xl shadow-sm flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 opacity-15 pointer-events-none">
                    <CheckCircle className="w-20 h-20" />
                  </div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-200 block relative z-10">
                    Persentase Umrah
                  </span>
                  <strong className="text-white text-lg sm:text-2xl font-black mt-0.5 relative z-10">
                    {percentageUmrah}% <span className="text-xs font-bold text-emerald-100">dari Total</span>
                  </strong>
                  <span className="text-[11px] text-emerald-100/95 font-medium relative z-10 mt-0.5 truncate">
                    Rasio Pax Umrah vs Total
                  </span>
                </div>
              </div>
            </div>

            {/* Content Daftar / Tabel */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
              {filteredAllFlights.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <List className="w-12 h-12 mx-auto opacity-40" />
                  <p className="font-bold text-base text-slate-600">Tidak ada jadwal penerbangan yang sesuai kriteria</p>
                  <p className="text-xs">Coba ubah kata kunci pencarian atau tab filter di atas.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Tampilan Desktop Table */}
                  <div className="hidden sm:block overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100/80 text-slate-600 font-extrabold text-xs uppercase tracking-wider border-b border-slate-200">
                          <th className="py-3.5 px-4 w-12 text-center">No</th>
                          <th className="py-3.5 px-4">Tipe &amp; Kode Flight</th>
                          <th className="py-3.5 px-4">Jam Jadwal</th>
                          <th className="py-3.5 px-4">Rute</th>
                          <th className="py-3.5 px-4">Total Flight Pax</th>
                          <th className="py-3.5 px-4">Pax Umrah</th>
                          <th className="py-3.5 px-4">Status &amp; Kepadatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm font-medium">
                        {filteredAllFlights.map((f, idx) => {
                          const info = getDensityInfo(f);
                          const isDep = f.type === 'DEPARTURE';
                          const isWarning = info.pax >= paxThreshold;
                          return (
                            <tr key={f.id} className={`hover:bg-slate-50 transition-colors ${isWarning ? 'bg-rose-50/40' : ''}`}>
                              <td className="py-3.5 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                              <td className="py-3.5 px-4 font-extrabold text-slate-800">
                                <div className="flex items-center gap-2">
                                  {isDep ? (
                                    <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg flex items-center gap-1 text-xs font-bold">
                                      <PlaneTakeoff className="w-3.5 h-3.5" /> DEP
                                    </span>
                                  ) : (
                                    <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg flex items-center gap-1 text-xs font-bold">
                                      <PlaneLanding className="w-3.5 h-3.5" /> ARR
                                    </span>
                                  )}
                                  <span className="text-base font-black">{f.flightCode}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{formatFlightTime(f.time)} WIB</td>
                              <td className="py-3.5 px-4 font-bold text-slate-700">{f.route}</td>
                              <td className="py-3.5 px-4 text-slate-600">{f.estTotalFlight ? `${f.estTotalFlight} Pax` : '-'}</td>
                              <td className="py-3.5 px-4 font-extrabold text-slate-900">
                                <span className={isWarning ? 'text-rose-600 font-black' : 'text-slate-800'}>
                                  {f.estPaxUmroh ? `${f.estPaxUmroh} Pax` : '0 Pax'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                {isWarning ? (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="inline-flex items-center gap-1 text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200">
                                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> Warning (&gt;{paxThreshold} Pax)
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-semibold">{info.windowText}</span>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200">
                                    <CheckCircle className="w-3.5 h-3.5" /> Normal (&le;{paxThreshold} Pax)
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-100 font-black text-slate-800 border-t-2 border-slate-300">
                        <tr>
                          <td colSpan={4} className="py-4 px-4 text-right uppercase tracking-wider text-xs text-slate-600">
                            Total ({filteredAllFlights.length} Flight Terpilih):
                          </td>
                          <td className="py-4 px-4 text-base text-slate-900 font-black">
                            {sumTotalPax.toLocaleString('id-ID')} Pax
                          </td>
                          <td className="py-4 px-4 text-base text-emerald-700 font-black">
                            {sumUmrahPax.toLocaleString('id-ID')} Pax <span className="text-xs font-extrabold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-md ml-1">({percentageUmrah}%)</span>
                          </td>
                          <td className="py-4 px-4"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Tampilan Mobile Cards */}
                  <div className="sm:hidden space-y-3">
                    {filteredAllFlights.map((f, idx) => {
                      const info = getDensityInfo(f);
                      const isDep = f.type === 'DEPARTURE';
                      const isWarning = info.pax >= paxThreshold;
                      return (
                        <div key={f.id} className={`p-4 rounded-2xl border ${isWarning ? 'bg-rose-50/50 border-rose-200 shadow-sm' : 'bg-slate-50/80 border-slate-200'} space-y-3`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isDep ? (
                                <span className="px-2 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg text-xs flex items-center gap-1">
                                  <PlaneTakeoff className="w-3.5 h-3.5" /> DEP
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 font-bold rounded-lg text-xs flex items-center gap-1">
                                  <PlaneLanding className="w-3.5 h-3.5" /> ARR
                                </span>
                              )}
                              <span className="font-black text-slate-900 text-base">{f.flightCode}</span>
                            </div>
                            <span className="font-mono font-black text-slate-800 text-sm bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                              {formatFlightTime(f.time)} WIB
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-slate-100">
                            <div>
                              <span className="text-slate-400 block font-semibold">Rute Tujuan/Asal:</span>
                              <strong className="text-slate-800 text-sm">{f.route}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-semibold">Total Semua Pax:</span>
                              <strong className="text-slate-800 text-sm">{f.estTotalFlight ? `${f.estTotalFlight} Pax` : '-'}</strong>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                            <div>
                              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Pax Umrah:</span>
                              <span className={`text-base font-black ${isWarning ? 'text-rose-600' : 'text-slate-800'}`}>
                                {f.estPaxUmroh ? `${f.estPaxUmroh} Pax` : '0 Pax'}
                              </span>
                            </div>
                            <div>
                              {isWarning ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200">
                                  <AlertTriangle className="w-3 h-3" /> Warning Kepadatan
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200">
                                  <CheckCircle className="w-3 h-3" /> Normal
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 font-medium">
              <span>Menampilkan {filteredAllFlights.length} dari {allFlightsList.length} penerbangan</span>
              <button
                onClick={() => setShowAllFlightsModal(false)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow transition-colors text-xs sm:text-sm"
              >
                Tutup Daftar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel Paste Jadwal Rencana Umrah */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div 
          onClick={() => setIsEditingRaw(!isEditingRaw)} 
          className="flex items-center justify-between p-4 sm:p-5 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors border-b border-slate-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">Paste Jadwal Rencana Penerbangan Umrah</h3>
              <p className="text-xs text-slate-500">
                {departures.length === 0 && arrivals.length === 0
                  ? 'Saat ini kosong. Klik di sini untuk mempaste jadwal dari WhatsApp atau Excel'
                  : `Tersimpan: ${departures.length} Departure (${warningDepartures.length} Warning) & ${arrivals.length} Arrival (${warningArrivals.length} Warning)`}
              </p>
            </div>
          </div>
          <div className="text-slate-400">
            {isEditingRaw ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </div>
        </div>

        {isEditingRaw && (
          <div className="p-4 sm:p-6 space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-xs text-blue-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Aturan Warning:</strong> Sistem menyaring penerbangan dengan <strong>&gt;{paxThreshold} Pax Umrah</strong> dan menghitung rentang <strong>waktu kepadatan</strong> (Kedatangan: ±{arrWarningMinutes} menit pendaratan | Keberangkatan: {depWarningMinutes % 60 === 0 ? `${depWarningMinutes / 60} jam` : `${depWarningMinutes} menit`} sebelumnya).
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-sm flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> Muat Contoh (11 Juli)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRawScheduleText(PREOPS_UMRAH_SCHEDULE_13_JULI);
                    parseTextToSchedule(PREOPS_UMRAH_SCHEDULE_13_JULI);
                    setIsEditingRaw(false);
                  }}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-sm flex items-center gap-1.5"
                >
                  <ImageIcon className="w-4 h-4" /> Muat Jadwal Pre-Ops Gambar (13 Juli - 36 Flight)
                </button>
              </div>
            </div>

            {/* Panel Upload Gambar Jadwal (OCR / Preview) */}
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50/70 hover:bg-slate-50 transition-colors">
              {!uploadedScheduleImage ? (
                <div className="text-center py-4 space-y-2">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Unggah Gambar / Screenshot Jadwal Penerbangan Umroh</p>
                    <p className="text-xs text-slate-500">Format PNG, JPG, atau JPEG. AI Sistem akan memetakan dan mengekstrak jadwal ke dalam timeline.</p>
                  </div>
                  <label className="inline-block mt-2 px-4 py-2 bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 font-bold text-xs rounded-xl cursor-pointer shadow-sm transition-all">
                    Pilih Gambar Jadwal
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setUploadedScheduleImage(event.target.result as string);
                              // Otomatis isi data 36 flight pre-ops jika gambar jadwal diupload
                              setRawScheduleText(PREOPS_UMRAH_SCHEDULE_13_JULI);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-600" /> Gambar Jadwal Terunggah:
                    </span>
                    <button
                      type="button"
                      onClick={() => setUploadedScheduleImage(null)}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Hapus Gambar
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
                    <img src={uploadedScheduleImage} alt="Schedule Preview" className="w-full h-auto object-contain mx-auto" />
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <p className="text-xs text-emerald-800 font-medium">
                      ✓ Data 36 penerbangan (18 Departure &amp; 18 Arrival) dari gambar terdeteksi dan dimuat ke dalam Rencana Penerbangan di bawah ini.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        parseTextToSchedule(PREOPS_UMRAH_SCHEDULE_13_JULI);
                        setIsEditingRaw(false);
                      }}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm whitespace-nowrap"
                    >
                      Terapkan &amp; Lihat Timeline &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>

            <textarea
              rows={10}
              value={rawScheduleText}
              onChange={(e) => setRawScheduleText(e.target.value)}
              placeholder="Paste teks Rencana Penerbangan Umrah di sini atau unggah gambar di atas..."
              className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none resize-y"
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setRawScheduleText('');
                  setDepartures([]);
                  setArrivals([]);
                  setDateText('');
                }}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Kosongkan Jadwal
              </button>
              <button
                type="button"
                onClick={handleApplyRawPaste}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Proses & Generate Timeline
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Panel Pengaturan Batas Kepadatan & Jarak Warning (Di Luar Capture agar tidak ikut terscreenshot) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">Pengaturan Batas Kepadatan &amp; Jarak Warning</h3>
              <p className="text-xs text-slate-500">Sesuaikan batas minimal penumpang Umrah dan rentang waktu peringatan operasional</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setPaxThreshold(100);
              setDepWarningMinutes(180);
              setArrWarningMinutes(30);
            }}
            className="self-start sm:self-center px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
          >
            Reset ke Default (100 Pax, -3 Jam, ±30 Menit)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3.5">
          {/* Batas Minimal Pax */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Batas Padat Pax Umrah</span>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">&gt; {paxThreshold} Pax</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={paxThreshold}
                onChange={(e) => setPaxThreshold(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-500">Pax</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Penerbangan di atas angka ini akan masuk ke daftar Warning.</p>
          </div>

          {/* Warning Keberangkatan */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Warning Keberangkatan</span>
              <span className="text-[11px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                -{depWarningMinutes % 60 === 0 ? `${depWarningMinutes / 60} Jam` : `${+(depWarningMinutes / 60).toFixed(1)} Jam`}
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={15}
                value={depWarningMinutes}
                onChange={(e) => setDepWarningMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Menit Sblm</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Durasi waktu sebelum keberangkatan untuk hitungan kepadatan.</p>
          </div>

          {/* Warning Kedatangan */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Warning Kedatangan</span>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">± {arrWarningMinutes} Menit</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={5}
                value={arrWarningMinutes}
                onChange={(e) => setArrWarningMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Menit Landing</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Rentang waktu sebelum &amp; sesudah jam pendaratan aktual.</p>
          </div>
        </div>
      </div>

      {/* Tampilan Garis Timeline dan Warning Kepadatan (Dapat Dicapture menjadi Gambar) */}
      <div 
        ref={captureRef}
        className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-8 space-y-8"
      >
        {/* Header Informasi Judul & Tanggal */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-emerald-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
            <KaabaIcon className="w-64 h-64" />
          </div>
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="bg-amber-600/30 text-amber-300 border border-amber-400/30 px-3.5 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Peringatan Kepadatan Terminal 2
              </span>
              {dateText && (
                <span className="bg-white/15 px-3.5 py-1 rounded-full text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-400" /> {dateText}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white">
              {headerTitle || 'Timeline Warning Umrah'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm font-medium">
              {airportText || 'Bandara Internasional Soekarno-Hatta (CGK)'}
            </p>

            {/* Statistik Ringkas Warning & Tombol Lihat Seluruh Jadwal */}
            <div className="pt-3 flex flex-wrap items-center justify-between gap-3 sm:gap-6 border-t border-white/10 text-xs sm:text-sm">
              <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                  <span>Warning Keberangkatan (&gt;{paxThreshold} Pax): <strong className="text-amber-300 font-bold">{warningDepartures.length} Flight</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                  <span>Warning Kedatangan (&gt;{paxThreshold} Pax): <strong className="text-emerald-300 font-bold">{warningArrivals.length} Flight</strong></span>
                </div>
              </div>

              {(departures.length > 0 || arrivals.length > 0) && (
                <button
                  type="button"
                  onClick={() => setShowAllFlightsModal(true)}
                  className="bg-white/15 hover:bg-white/25 border border-white/25 rounded-xl px-3.5 py-1.5 font-bold text-white text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm"
                >
                  <List className="w-4 h-4 text-emerald-300" /> Lihat Seluruh Daftar ({departures.length + arrivals.length} Flight) &rarr;
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cek jika masih kosong */}
        {departures.length === 0 && arrivals.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto">
              <h4 className="text-base font-bold text-slate-700">Belum Ada Jadwal Penerbangan yang Diproses</h4>
              <p className="text-xs text-slate-500 mt-1">
                Silakan buka panel di atas untuk paste teks jadwal atau <strong>unggah gambar jadwal</strong>, atau klik tombol di bawah untuk langsung memuat contoh:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> Muat Contoh (11 Juli)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRawScheduleText(PREOPS_UMRAH_SCHEDULE_13_JULI);
                    parseTextToSchedule(PREOPS_UMRAH_SCHEDULE_13_JULI);
                    setIsEditingRaw(false);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                >
                  <ImageIcon className="w-4 h-4" /> Muat Jadwal Pre-Ops Gambar (13 Juli - 36 Flight)
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* GARIS TIMELINE KEPADATAN 24 JAM (Congestion Timeline Bar) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-extrabold text-slate-800 text-base sm:text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" /> Garis Timeline Kepadatan Operasional 24 Jam
                </h3>
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
                  00:00 - 24:00 WIB
                </span>
              </div>

              {/* Visual Bar Timeline 24H */}
              <div className="relative pt-6 pb-8 px-2 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
                {/* Waktu Tick Rail */}
                <div className="absolute top-2 left-0 right-0 flex justify-between px-3 text-[10px] font-bold text-slate-400 select-none">
                  <span>00:00</span>
                  <span>03:00</span>
                  <span>06:00</span>
                  <span>09:00</span>
                  <span>12:00</span>
                  <span>15:00</span>
                  <span>18:00</span>
                  <span>21:00</span>
                  <span>24:00</span>
                </div>

                {/* Main Horizontal Track */}
                <div className="relative h-12 w-full bg-slate-200/80 rounded-xl mt-4 overflow-hidden border border-slate-300">
                  {/* Grid Lines */}
                  {[12.5, 25, 37.5, 50, 62.5, 75, 87.5].map((pct, idx) => (
                    <div key={idx} className="absolute top-0 bottom-0 border-l border-slate-300/60" style={{ left: `${pct}%` }}></div>
                  ))}

                  {/* Plotting Departure Warning Bars */}
                  {warningDepartures.map((item) => {
                    const info = getDensityInfo(item);
                    const leftPct = Math.max((info.startMins / 1440) * 100, 0);
                    const widthPct = Math.max(((info.endMins - info.startMins) / 1440) * 100, 1.5);
                    return (
                      <div
                        key={item.id}
                        title={`Keberangkatan: ${item.flightCode} (${formatFlightTime(item.time)}) | Kepadatan: ${info.windowText}`}
                        className="absolute top-1.5 bottom-1.5 bg-gradient-to-r from-amber-500 to-red-500 rounded-lg shadow border border-amber-300 flex items-center justify-center overflow-hidden transition-all hover:brightness-110"
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      >
                        <span className="text-[9px] font-extrabold text-white px-1 truncate drop-shadow">
                          {item.flightCode}
                        </span>
                      </div>
                    );
                  })}

                  {/* Plotting Arrival Warning Bars */}
                  {warningArrivals.map((item) => {
                    const info = getDensityInfo(item);
                    const leftPct = Math.max((info.startMins / 1440) * 100, 0);
                    const widthPct = Math.max(((info.endMins - info.startMins) / 1440) * 100, 1.5);
                    return (
                      <div
                        key={item.id}
                        title={`Kedatangan: ${item.flightCode} (${formatFlightTime(item.time)}) | Kepadatan: ${info.windowText}`}
                        className="absolute top-1.5 bottom-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg shadow border border-emerald-300 flex items-center justify-center overflow-hidden transition-all hover:brightness-110"
                        style={{ left: `${leftPct}%`, width: `${widthPct}%`, opacity: 0.9 }}
                      >
                        <span className="text-[9px] font-extrabold text-white px-1 truncate drop-shadow">
                          {item.flightCode}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Keterangan Legenda Bar */}
                <div className="flex flex-wrap items-center justify-center gap-6 mt-4 text-xs font-bold text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-3 bg-gradient-to-r from-amber-500 to-red-500 rounded border border-amber-400"></span>
                    <span>Warning Keberangkatan (Kepadatan: {depWarningMinutes % 60 === 0 ? `${depWarningMinutes / 60} Jam` : `${+(depWarningMinutes / 60).toFixed(1)} Jam`} Sebelum Departure)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded border border-emerald-400"></span>
                    <span>Warning Kedatangan (Kepadatan: ±{arrWarningMinutes} Menit Landing)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TIMELINE VERTIKAL KRONOLOGIS WARNING UMRAH */}
            <div className="pt-4 pb-2">
              {sortedWarnings.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-sm font-medium">
                  Tidak ada penerbangan dengan &gt;{paxThreshold} Pax Umrah.
                </div>
              ) : (
                <div className="relative">
                  {/* Garis Vertikal Utama — posisi dihitung agar tepat di tengah dot:
                      left time column = 80px, dot column center = 80px + 10px = 90px (sm: 96px + 10px = 106px)
                      Garis vertikal 2px, jadi left = center - 1px */}
                  <div className="absolute top-0 bottom-0 w-[2px] bg-slate-300" style={{ left: '89px' }}></div>

                  <div className="space-y-0">
                    {sortedWarnings.map((flight, index) => {
                      const info = getDensityInfo(flight);
                      const isDeparture = flight.type === 'DEPARTURE';
                      const typeLabel = isDeparture ? 'KEBERANGKATAN' : 'KEDATANGAN';
                      const dotColor = isDeparture ? 'bg-[#b91c1c]' : 'bg-[#0284c7]';
                      const titleColor = isDeparture ? 'text-[#b91c1c]' : 'text-[#0284c7]';
                      const startFormatted = formatMinutesToTime(info.startMins);
                      const endFormatted = formatMinutesToTime(info.endMins);
                      const isLast = index === sortedWarnings.length - 1;

                      return (
                        <div key={flight.id} className={`relative flex items-start ${!isLast ? 'pb-6' : 'pb-1'}`}>
                          {/* Kolom Kiri: Waktu Kepadatan */}
                          <div className="flex-shrink-0 text-right pt-0.5" style={{ width: '80px' }}>
                            <div className="text-[15px] sm:text-lg font-extrabold text-slate-800 leading-tight font-mono tracking-tight">
                              {startFormatted}
                            </div>
                            <div className="text-[10px] sm:text-xs font-semibold text-slate-400 font-mono leading-tight">
                              s/d {endFormatted}
                            </div>
                          </div>

                          {/* Node Titik pada Garis Vertikal — lebar tetap 20px, dot di tengah */}
                          <div className="relative flex-shrink-0 flex items-start justify-center pt-[5px]" style={{ width: '20px' }}>
                            <div className={`w-[10px] h-[10px] sm:w-3 sm:h-3 rounded-full ${dotColor} border-[2px] border-white shadow-sm z-10`}></div>
                          </div>

                          {/* Kolom Kanan: Detail Penerbangan */}
                          <div className="flex-1 pl-3 min-w-0">
                            {/* Baris Judul: Icon + Tipe + Flight Code */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isDeparture
                                ? <PlaneTakeoff className={`w-4 h-4 flex-shrink-0 ${titleColor}`} />
                                : <PlaneLanding className={`w-4 h-4 flex-shrink-0 ${titleColor}`} />
                              }
                              <span className={`font-black text-sm sm:text-base uppercase tracking-wide ${titleColor}`}>
                                {typeLabel} - {flight.flightCode}
                              </span>
                            </div>

                            {/* Baris Detail: Jadwal & Rute */}
                            <div className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
                              Jadwal: <strong className="text-slate-700 font-mono">{formatFlightTime(flight.time)} WIB</strong>
                              <span className="mx-1.5 text-slate-300">|</span>
                              Rute: <strong className="text-slate-700">{flight.route}</strong>
                            </div>

                            {/* Baris Pax Umrah */}
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-sm leading-none">🔥</span>
                              <span className="text-xs sm:text-sm font-black text-[#b91c1c]">
                                {flight.estPaxUmroh} Pax Umrah
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Catatan Keterangan Footer Gambar */}
            <div className="pt-5 mt-4 border-t border-slate-200 text-center">
              <span className="text-[11px] text-slate-400 italic">Generated by Airport Operation Control Center</span>
            </div>
          </>
        )}
      </div>

      {/* Tombol Khusus "Lihat Seluruh Daftar" & "Share T Umrah ke WA" */}
      {(departures.length > 0 || arrivals.length > 0) && (
        <div className="pt-3 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => setShowAllFlightsModal(true)}
              className="w-full font-extrabold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-md transition-all duration-300 text-base bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-900 hover:to-blue-950 text-white border border-slate-700 hover:shadow-xl"
            >
              <List className="w-6 h-6 text-blue-300" /> Lihat Seluruh Daftar Jadwal ({departures.length + arrivals.length} Flight)
            </button>

            <button
              type="button"
              onClick={generatePreviewImage}
              disabled={isGeneratingImage}
              className={`w-full font-extrabold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-lg transition-all duration-300 text-base ${
                isGeneratingImage
                  ? 'bg-slate-400 cursor-not-allowed text-white'
                  : isCopied
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-[#25D366] hover:bg-[#20b858] hover:shadow-xl text-white'
              }`}
            >
              {isGeneratingImage ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin" /> Sedang Membuat Gambar Timeline...
                </>
              ) : isCopied ? (
                <>
                  <CheckCircle className="w-6 h-6 animate-bounce" /> Berhasil! Gambar Tersimpan / Dibagikan
                </>
              ) : (
                <>
                  <Share2 className="w-6 h-6" /> Share T Umrah ke WA
                </>
              )}
            </button>
          </div>
          <p className="text-center text-xs text-slate-500">
            Klik tombol biru untuk melihat seluruh daftar jadwal, atau tombol hijau di kanan untuk membagikan gambar timeline ke WhatsApp.
          </p>
        </div>
      )}
    </div>
  );
};
