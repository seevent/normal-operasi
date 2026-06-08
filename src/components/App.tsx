// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Wrench, Clock, MapPin, AlertCircle, FileText, User, Calendar, Cpu, CheckCircle, RefreshCw, Check, Camera, ImagePlus, X, Share2, LayoutGrid, Users, ClipboardList, Plus, Megaphone, Box, Hash, Settings, CheckSquare, AlertTriangle, Save, Trash2, RefreshCcw, Camera as CameraIcon, Move, ChevronDown, ChevronUp, Lock, Square } from 'lucide-react';

declare global {
  interface Window {
    touchDragState: {
      type: string;
      index: number;
      groupId?: number;
      startX: number;
      startY: number;
      isDragging: boolean;
    } | null;
  }
}

// === DATA MASTER PERSONEL ===
const DEFAULT_DATA_API_T2 = [
  { name: "Dwisasono Glory Prayoga", phone: "081213138823" },
  { name: "Muh. Syukri", phone: "081296010797" },
  { name: "Erman Tri Basuki", phone: "085292076171" },
  { name: "Ageng Pandanaran", phone: "081908198725" },
  { name: "Slamet Riyadi", phone: "081297163525" },
  { name: "Tito Arrya Gaotama", phone: "082211524358" },
  { name: "Yuli Syarif", phone: "081906370863" },
  { name: "Dimas Aria Wiratama", phone: "081296778575" },
  { name: "Dhea Febriani", phone: "087883390219" },
  { name: "Rio Anang Kriswanto", phone: "081398399043" }
];

const DEFAULT_DATA_OM_IAS_T2 = [
  { name: "Aly Masmudi", phone: "085221344164" },
  { name: "Sayuti", phone: "083804054535" },
  { name: "Harmin Sanjayah", phone: "081803767148" },
  { name: "Nora Agil Rumayani", phone: "08970320998" },
  { name: "Wellynthon Agustinus", phone: "0895364757871" },
  { name: "Muhammad Ridho Rabbani", phone: "081385118676" },
  { name: "Muhammad Gusmada", phone: "082132487436" },
  { name: "Edo Ferry Ardian", phone: "085156501083" },
  { name: "Nandio Prihardana", phone: "085172251017" },
  { name: "Rifky Aziz", phone: "085716500615" },
  { name: "Muhammad Agus Sofyan", phone: "085691540333" },
  { name: "Abdul Rifan Sukarno", phone: "083111807154" }
];

// === DATA MASTER STORING ===
const DEFAULT_STORING_EQUIPMENTS = ['Access Control', 'X-Ray', 'HHMD', 'ETD', 'WTMD', 'Body Scanner'];
const DEFAULT_STORING_LOC_AC = [
  'Avio & BL D', 'Avio & BL E', 'Avio & BL F', 'Rampout D', 'Rampout E', 
  'Rampout F', 'Breakdown D, E1, E2 & F', 'Breakdown Umroh', 'Ruang Monitoring E1', 
  'Server Access', 'HBSCP Umroh'
];
const DEFAULT_STORING_LOC_DEFAULT = [
  'PSCP D', 'PSCP E', 'PSCP F', 'PSCP Umroh', 'SSCP E', 'SSCP F',
  'HBSCP 1.1 -1.6', 'HBSCP 2.1-2.6', 'HBSCP Umroh'
];

// === DATA CHECKLIST MASTER (PERALATAN) ===
const DEFAULT_CHECKLIST_DATA = [
  {
    type: 'location',
    title: 'PSCP D',
    summary: 'TOTAL PERALATAN PSCP & TRANSFER DESK D',
    categories: [
      { title: 'A. X-RAY', summaryKey: 'X-RAY', items: ['X-Ray Rapiscan 620DV (No1)', 'X-Ray Smith Heiman HS 6040-2is (No2)', 'X-Ray Rapiscan 620DV (No3)', 'X-Ray Rapiscan 620DV (No4)', 'X-Ray Rapiscan 620DV (No5)'] },
      { title: 'B. WTMD', summaryKey: 'WTMD', items: ['WTMD CEIA HI/PE Multizone (No1)', 'WTMD CEIA HI/PE Multizone (No3)', 'WTMD CEIA HI/PE Multizone (No4)', 'WTMD CEIA HI/PE Multizone (No5)', 'WTMD CEIA HI/PE Multizone (Transfer Desk D)'] },
      { title: 'C. BODY SCANNER', summaryKey: 'BODY SCANNER', items: ['Body Scanner Leidos Provision 2 (No2)'] },
      { title: 'D. EXPLOSIVE DETECTOR', summaryKey: 'ETD', items: ['ETD Leidos QS-B220'] }
    ]
  },
  {
    type: 'location',
    title: 'PSCP E',
    summary: 'TOTAL PERALATAN PSCP & TRANSFER DESK E',
    categories: [
      { title: 'A. X-RAY', summaryKey: 'X-RAY', items: ['X-Ray Rapiscan 620DV (No1)', 'X-Ray Rapiscan 620DV (No2)', 'X-Ray Rapiscan 620DV (No3)', 'X-Ray Rapiscan 620DV (No4)', 'X-Ray Rapiscan 620DV (No5)'] },
      { title: 'B. WTMD', summaryKey: 'WTMD', items: ['WTMD CEIA HI/PE Multizone (No1)', 'WTMD CEIA HI/PE Multizone (No3)', 'WTMD CEIA HI/PE Multizone (No4)', 'WTMD CEIA HI/PE Multizone (Transfer Desk E)'] },
      { title: 'C. BODY SCANNER', summaryKey: 'BODY SCANNER', items: ['Body Scanner Leidos Provision 2 (No2)', 'Body Scanner Leidos Provision 2 (No5)'] },
      { title: 'D. EXPLOSIVE DETECTOR', summaryKey: 'ETD', items: ['ETD Leidos QS-B220'] }
    ]
  },
  {
    type: 'location',
    title: 'PSCP F',
    summary: 'TOTAL PERALATAN PSCP F',
    categories: [
      { title: 'A. X-RAY', summaryKey: 'X-RAY', items: ['X-Ray Rapiscan 620DV (No1)', 'X-Ray Rapiscan Orion 920DV (No2)', 'X-Ray Rapiscan 620DV (No3)', 'X-Ray Rapiscan 620DV (No4)'] },
      { title: 'B. WTMD', summaryKey: 'WTMD', items: ['WTMD CEIA HI/PE Multizone (No1)', 'WTMD CEIA HI/PE Multizone (No2)', 'WTMD CEIA HI/PE Multizone (No3)', 'WTMD CEIA HI/PE Multizone (No4)'] },
      { title: 'C. BODY SCANNER', summaryKey: 'BODY SCANNER', items: ['Body Scanner Leidos Provision 2 (No1)', 'Body Scanner Leidos Provision 2 (No2)'] },
      { title: 'D. EXPLOSIVE DETECTOR', summaryKey: 'ETD', items: ['ETD Leidos QS-B220'] }
    ]
  },
  {
    type: 'location',
    title: 'PSCP UMROH',
    summary: 'TOTAL PERALATAN PSCP UMROH',
    categories: [
      { title: 'A. X-RAY', summaryKey: 'X-RAY', items: ['X-Ray Nuctech CX6040D (No1)', 'X-Ray Nuctech CX6040D (No2)', 'X-Ray Rapiscan 620DV (No3)', 'X-Ray Rapiscan 620DV (No4)', 'X-Ray Rapiscan 620DV (No5)', 'X-Ray Rapiscan 620DV (No6)'] },
      { title: 'B. WTMD', summaryKey: 'WTMD', items: ['WTMD CEIA HI/PE Multizone (No1)', 'WTMD CEIA HI/PE Multizone (No2)', 'WTMD CEIA HI/PE Multizone (No3)', 'WTMD CEIA HI/PE Multizone (No4)', 'WTMD CEIA HI/PE Multizone (No5)', 'WTMD CEIA HI/PE Multizone (No6)', 'WTMD CEIA HI/PE Multizone (No7)'] },
      { title: 'C. BODY SCANNER', summaryKey: 'BODY SCANNER', items: ['Body Scanner Leidos Provision 2 (No3)', 'Body Scanner Leidos Provision 2 (No5)', 'Body Scanner Leidos Provision 2 (No7)'] },
      { title: 'D. EXPLOSIVE DETECTOR', summaryKey: 'ETD', items: ['ETD Leidos QS-B220'] }
    ]
  },
  {
    type: 'group',
    summary: 'TOTAL PERALATAN SSCP E & SSCP F',
    locations: [
      {
        title: 'SSCP E',
        categories: [
          { title: 'A. X-RAY', summaryKey: 'X-RAY', items: ['X-Ray Smith Heiman HS 6040-2is'] },
          { title: 'B. WTMD', summaryKey: 'WTMD', items: ['WTMD CEIA HI-PE Multizone'] }
        ]
      },
      {
        title: 'SSCP F',
        categories: [
          { title: 'A. X-RAY', summaryKey: 'X-RAY', items: ['X-Ray Rapiscan 620 DV'] },
          { title: 'B. WTMD', summaryKey: 'WTMD', items: ['WTMD CEIA HI-PE Multizone'] }
        ]
      }
    ]
  },
  {
    type: 'location',
    title: 'HBSCP',
    summary: 'TOTAL PERALATAN HBSCP',
    categories: [
      { title: 'A. X-RAY', summaryKey: 'X-RAY', items: ['X-Ray Rapiscan 628DV (1.1)', 'X-Ray Nuctech CX100100D (1.2)', 'X-Ray Rapiscan 628DV  (1.3)', 'X-Ray Rapiscan 628DV (1.4)', 'X-Ray Rapiscan 628DV (1.5)', 'X-Ray Rapiscan 628DV  (1.6)', 'X-Ray Nuctech CX100100D (2.1)', 'X-Ray Rapiscan 628DV  (2.2)', 'X-Ray Rapiscan 628DV (2.3)', 'X-Ray Rapiscan 628DV (2.4)', 'X-Ray Nuctech CX100100D (2.5)', 'X-Ray Rapiscan 628DV  (2.6)', 'X-Ray Rapiscan 628DV (2.7)', 'X-Ray Rapiscan 628DV (2.8)'] },
      { title: 'B. EXPLOSIVE DETECTOR', summaryKey: 'ETD', items: ['ETD Leidos QS-B220'] }
    ]
  },
  {
    type: 'access_control',
    title: 'ACCESS CONTROL',
    summary: 'TOTAL PERALATAN ACCESS CONTROL',
    terminals: [
      {
        title: 'TERMINAL D',
        categories: [
          { title: 'AVIOBRIDGE', items: ['Pintu Avio D1', 'Pintu Avio D2', 'Pintu Avio D3', 'Pintu Avio D4', 'Pintu Avio D5', 'Pintu Avio D6', 'Pintu Avio D7'] },
          { title: 'RAMPOUT', items: ['Pintu Rampout D2', 'Pintu Rampout D4', 'Pintu Rampout D6'] },
          { title: 'BOARDING LOUNGE', items: ['Pintu BL D1', 'Pintu BL D2', 'Pintu BL D3', 'Pintu BL D4', 'Pintu BL D5', 'Pintu BL D6', 'Pintu BL D7'] }
        ]
      },
      {
        title: 'TERMINAL E',
        categories: [
          { title: 'AVIOBRIDGE', items: ['Pintu Avio E1', 'Pintu Avio E2', 'Pintu Avio E3', 'Pintu Avio E4', 'Pintu Avio E5', 'Pintu Avio E6', 'Pintu Avio E7'] },
          { title: 'RAMPOUT', items: ['Pintu Rampout E2', 'Pintu Rampout E4', 'Pintu Rampout E6'] },
          { title: 'BOARDING LOUNGE', items: ['Pintu BL E1', 'Pintu BL E2', 'Pintu BL E3', 'Pintu BL E4', 'Pintu BL E5', 'Pintu BL E6', 'Pintu BL E7'] }
        ]
      },
      {
        title: 'TERMINAL F',
        categories: [
          { title: 'AVIOBRIDGE', items: ['Pintu Avio F1', 'Pintu Avio F2', 'Pintu Avio F3', 'Pintu Avio F4', 'Pintu Avio F5', 'Pintu Avio F6', 'Pintu Avio F7'] },
          { title: 'RAMPOUT', items: ['Pintu Rampout F1', 'Pintu Rampout F2', 'Pintu Rampout F3', 'Pintu Rampout F4', 'Pintu Rampout F5', 'Pintu Rampout F6', 'Pintu Rampout F7'] },
          { title: 'BOARDING LOUNGE', items: ['Pintu BL F1', 'Pintu BL F2', 'Pintu BL F3', 'Pintu BL F4', 'Pintu BL F5', 'Pintu BL F6', 'Pintu BL F7'] }
        ]
      },
      {
        title: '',
        categories: [
          { title: 'BREAKDOWN & LIFT', items: ['Pintu Breakdown D', 'Pintu Breakdown E1', 'Pintu Breakdown E2', 'Pintu Breakdown F', 'Pintu Breakdown Umroh', 'Pintu HBS Umroh', 'Pintu Lift Difable D', 'Pintu Lift Difable E', 'Pintu Lift Difable F', 'Pintu Lift Barang D', 'Pintu Lift Barang F'] }
        ]
      }
    ]
  }
];

// === DATA MASTER TAB 6 (TIP) ===
const TIP_MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const DEFAULT_TIP_LEFT_COL = [
  { id: 'hbscp', name: 'HBSCP', items: ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6'] },
  { id: 'hbscp_umroh', name: 'HBSCP UMROH', items: ['2.7', '2.8'] },
  { id: 'pscp_d', name: 'PSCP D', items: ['1', '2', '3', '4', '5'] }
];
const DEFAULT_TIP_RIGHT_COL = [
  { id: 'pscp_e', name: 'PSCP E', items: ['1', '2', '3', '4', '5'] },
  { id: 'pscp_f', name: 'PSCP F', items: ['1', '2', '3', '4'] },
  { id: 'pscp_umroh', name: 'PSCP UMROH', items: ['1', '2', '3', '4', '5', '6', '7'] },
  { id: 'sscp', name: 'SSCP', items: ['MP E', 'MP F'] }
];
const TIP_TOTAL_ITEMS = 37;

export default function App() {
  const loadMasterData = (key, defaultData) => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading master data:', e);
    }
    return defaultData;
  };

  const saveMasterData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Master Data States
  const [dataApiT2, setDataApiT2] = useState(() => loadMasterData('master_api_t2', DEFAULT_DATA_API_T2));
  const [dataOmIasT2, setDataOmIasT2] = useState(() => loadMasterData('master_om_ias_t2', DEFAULT_DATA_OM_IAS_T2));
  const [storingEquipments, setStoringEquipments] = useState(() => loadMasterData('master_storing_equip', DEFAULT_STORING_EQUIPMENTS));
  const [storingLocAc, setStoringLocAc] = useState(() => loadMasterData('master_storing_loc_ac', DEFAULT_STORING_LOC_AC));
  const [storingLocDefault, setStoringLocDefault] = useState(() => loadMasterData('master_storing_loc_default', DEFAULT_STORING_LOC_DEFAULT));
  const [checklistDataMaster, setChecklistDataMaster] = useState(() => loadMasterData('master_checklist', DEFAULT_CHECKLIST_DATA));
  const [tipLeftCol, setTipLeftCol] = useState(() => loadMasterData('master_tip_left', DEFAULT_TIP_LEFT_COL));
  const [tipRightCol, setTipRightCol] = useState(() => loadMasterData('master_tip_right', DEFAULT_TIP_RIGHT_COL));

  // === STATE UNTUK MODAL MASTER DATA ===
  const [masterModalOpen, setMasterModalOpen] = useState(null); // 'api_t2', 'om_ias_t2', 'storing_equip', 'storing_loc_ac', 'storing_loc_default', 'tip_left', 'tip_right'
  const [masterModalData, setMasterModalData] = useState([]);
  
  const openMasterModal = (type, currentData) => {
    setMasterModalOpen(type);
    setMasterModalData(JSON.parse(JSON.stringify(currentData))); // deep copy
  };

  const closeMasterModal = () => {
    setMasterModalOpen(null);
    setMasterModalData([]);
  };

  const saveCurrentMasterModal = () => {
    switch (masterModalOpen) {
      case 'api_t2': setDataApiT2(masterModalData); saveMasterData('master_api_t2', masterModalData); break;
      case 'om_ias_t2': setDataOmIasT2(masterModalData); saveMasterData('master_om_ias_t2', masterModalData); break;
      case 'storing_equip': setStoringEquipments(masterModalData); saveMasterData('master_storing_equip', masterModalData); break;
      case 'storing_loc_ac': setStoringLocAc(masterModalData); saveMasterData('master_storing_loc_ac', masterModalData); break;
      case 'storing_loc_default': setStoringLocDefault(masterModalData); saveMasterData('master_storing_loc_default', masterModalData); break;
      case 'tip_left': setTipLeftCol(masterModalData); saveMasterData('master_tip_left', masterModalData); break;
      case 'tip_right': setTipRightCol(masterModalData); saveMasterData('master_tip_right', masterModalData); break;
    }
    closeMasterModal();
  };

  const resetCurrentMasterModal = () => {
    if (!window.confirm('Anda yakin ingin mereset data ini ke default bawaan sistem? Data kustom akan hilang.')) return;
    switch (masterModalOpen) {
      case 'api_t2': setMasterModalData(DEFAULT_DATA_API_T2); break;
      case 'om_ias_t2': setMasterModalData(DEFAULT_DATA_OM_IAS_T2); break;
      case 'storing_equip': setMasterModalData(DEFAULT_STORING_EQUIPMENTS); break;
      case 'storing_loc_ac': setMasterModalData(DEFAULT_STORING_LOC_AC); break;
      case 'storing_loc_default': setMasterModalData(DEFAULT_STORING_LOC_DEFAULT); break;
      case 'tip_left': setMasterModalData(DEFAULT_TIP_LEFT_COL); break;
      case 'tip_right': setMasterModalData(DEFAULT_TIP_RIGHT_COL); break;
    }
  };

  const handleModalDataChange = (index, field, value) => {
    const newData = [...masterModalData];
    if (field) {
      newData[index][field] = value;
    } else {
      newData[index] = value; // for array of strings
    }
    setMasterModalData(newData);
  };

  const addModalDataRow = () => {
    let newItem;
    if (['api_t2', 'om_ias_t2'].includes(masterModalOpen)) newItem = { name: '', phone: '' };
    else if (['storing_equip', 'storing_loc_ac', 'storing_loc_default'].includes(masterModalOpen)) newItem = '';
    else if (['tip_left', 'tip_right'].includes(masterModalOpen)) newItem = { id: `new_${Date.now()}`, name: '', items: [] };
    setMasterModalData([...masterModalData, newItem]);
  };

  const removeModalDataRow = (index) => {
    const newData = [...masterModalData];
    newData.splice(index, 1);
    setMasterModalData(newData);
  };


  // === STATE UNTUK TAB ===
  const [activeTab, setActiveTab] = useState('perbaikan'); // Mengatur default ke 'perbaikan'

  // === STATE UNTUK TAB 1: PERBAIKAN ===
  const [formData, setFormData] = useState({
    peralatan: '', lokasi1: '', lokasi2: '', sumberLaporan: 'Avsec', indikasiAwal: '',
    tanggal: new Date().toISOString().split('T')[0], waktuMulai: '', waktuSelesai: '',
    lamaPengerjaan: '', teknisi: '', permasalahan: '• ', tindakLanjut: '• ', status: 'Pekerjaan Selesai'
  });
  const [isVerifikasiETD, setIsVerifikasiETD] = useState(false);

  // === Fungsi Helper Data Kehadiran ===
  const createEmptyRows = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i + Math.random(), 
      name: '', phone: '', status: 'Hadir'
    }));
  };

  // === STATE UNTUK TAB 2: KEHADIRAN ===
  const [attendanceData, setAttendanceData] = useState(() => {
    const currentHour = new Date().getHours();
    const isPagi = currentHour >= 8 && currentHour < 20;
    const shiftValue = isPagi ? 'Pagi, 08.00 - 20.00 WIB' : 'Malam, 20.00 - 08.00 WIB';
    const rowCount = isPagi ? 4 : 2;
    const kegiatan = isPagi 
      ? '- Monitoring Ops\n- Storing Peralatan\n- Preventive Maintenance & Kalibrasi Perangkat' 
      : '- Monitoring Ops\n- Storing Peralatan';
    
    return {
      tanggal: new Date().toISOString().split('T')[0],
      shift: shiftValue,
      apiList: createEmptyRows(rowCount),
      omList: createEmptyRows(rowCount),
      tlpRuangan: '- 021 550 5910',
      rencanaKegiatan: kegiatan
    };
  });

  // === STATE UNTUK TAB 3: BRIEFING ===
  const [briefingData, setBriefingData] = useState(() => {
    const currentHour = new Date().getHours();
    const isPagi = currentHour >= 8 && currentHour < 20;
    return {
      jenis: 'Unit', // 'Unit' | 'MOT'
      tanggal: new Date().toISOString().split('T')[0],
      shift: isPagi ? 'Pagi' : 'Malam',
      lokasi: 'Terminal 2'
    };
  });

  // === STATE UNTUK TAB 4: STORING ===
  const [storingData, setStoringData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    waktuMulai: '',
    waktuSelesai: '',
    peralatan: [], // Array untuk multi-select
    lokasi: '',
    nomor: '',
    hasil: 'Normal Operasi'
  });

  // === STATE UNTUK TAB: CHECKLIST ===
  const [checklistData, setChecklistData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    waktuMulai: '',
    waktuSelesai: '',
  });
  const [toggles, setToggles] = useState({});
  const [expandedAreas, setExpandedAreas] = useState({});

  const toggleArea = (areaId) => {
    setExpandedAreas(prev => ({ ...prev, [areaId]: !prev[areaId] }));
  };

  // === STATE UNTUK TAB 5: KALIBRASI (MULTI LOKASI) ===
  const createEmptyKalibrasiEntry = () => ({
    id: Date.now() + Math.random(),
    peralatan: [], 
    xrayModel: 'Semua X-Ray', 
    wtmdModel: 'WTMD CEIA',
    bsModel: 'Body Scanner Leidos Provision 2',
    lokasi1: '', lokasi2: '',
    acLokasi: [],
    acEmlock: 'Berfungsi', acIntercom: 'Berfungsi', acFingerprint: 'Berfungsi', acCctv: 'Berfungsi', acPengontrolan: 'Berfungsi', acRecordCctv: '',
    xrayKvV: '', xrayKvH: '', xrayMaV: '', xrayMaH: '', xrayOnV: '', xrayOnH: '', xrayArchive: '',
    wtmdZ1: '', wtmdZ2: '', wtmdZ3: '', wtmdZ4: '', wtmdLc: '', wtmdLs: '', wtmdUc: '', wtmdSe: '', wtmdDs: '',
    bsSuspect: 'Normal', bsMonitor: 'Normal', bsScanning: 'Normal', bsCalibration: 'Normal',
    etdTnt: 'Alarm', etdPetn: 'Alarm', etdRdx: 'Alarm',
  });

  const [kalibrasiGlobal, setKalibrasiGlobal] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    waktuMulai: '',
    waktuSelesai: ''
  });
  const [kalibrasiEntries, setKalibrasiEntries] = useState([createEmptyKalibrasiEntry()]);

  // === STATE UNTUK FOTO KALIBRASI (MULTI KOLASE) ===
  const [kalibrasiPhotoGroups, setKalibrasiPhotoGroups] = useState([
    { id: Date.now(), photos: [], collageUrl: null, collageFile: null, isGenerating: false }
  ]);

  // === STATE UNTUK TAB 6: TIP ===
  const [tipMonth, setTipMonth] = useState(TIP_MONTHS[new Date().getMonth()]);
  const [tipYear, setTipYear] = useState(new Date().getFullYear());
  const [tipDataState, setTipDataState] = useState({});
  const [tipLastSaved, setTipLastSaved] = useState(null);
  const [tipUnsavedChanges, setTipUnsavedChanges] = useState(false);
  const [isGeneratingTipImage, setIsGeneratingTipImage] = useState(false);

  // === STATE UNTUK TAB CAM ===
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [camFacingMode, setCamFacingMode] = useState('environment'); // environment (belakang) / user (depan)
  const [camLocation, setCamLocation] = useState({ lat: null, lng: null, address: 'Mencari lokasi...', error: null });
  const [liveTime, setLiveTime] = useState(new Date());
  const [isFlash, setIsFlash] = useState(false);
  const [camStream, setCamStream] = useState(null);
  const [camError, setCamError] = useState(null);

  // === STATE BERSAMA (SHARED) ===
  const [isCopied, setIsCopied] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [collageUrl, setCollageUrl] = useState(null);
  const [collageFile, setCollageFile] = useState(null);
  const [isGeneratingCollage, setIsGeneratingCollage] = useState(false);

  // === Fungsi Helper Format Tanggal Indo ===
  const formatTanggalIndo = (dateStr) => {
    if (!dateStr) return '';
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const d = new Date(dateStr);
    return `${days[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  // === HELPER: VALID X-RAY MODELS BERDASARKAN LOKASI ===
  const getValidXRayModels = (lokasi) => {
    const allModels = [
      'Semua X-Ray',
      'X-Ray Rapiscan 620DV',
      'X-Ray Rapiscan 628DV',
      'X-Ray Rapiscan Orion 920DV',
      'X-Ray Nuctech CX100100D',
      'X-Ray Nuctech CX6040D',
      'X-Ray Smith Heiman HS 100100-2is',
      'X-Ray Smith Heiman HS 6040-2is'
    ];
    if (!lokasi) return allModels;

    const locUpper = lokasi.toUpperCase();
    const models = ['Semua X-Ray'];

    if (locUpper.includes('PSCP D')) {
      models.push('X-Ray Rapiscan 620DV', 'X-Ray Smith Heiman HS 6040-2is');
    } else if (locUpper.includes('PSCP E')) {
      models.push('X-Ray Rapiscan 620DV');
    } else if (locUpper.includes('PSCP F')) {
      models.push('X-Ray Rapiscan 620DV', 'X-Ray Rapiscan Orion 920DV');
    } else if (locUpper.includes('PSCP UMROH')) {
      models.push('X-Ray Rapiscan 620DV', 'X-Ray Nuctech CX6040D');
    } else if (locUpper.includes('SSCP E')) {
      models.push('X-Ray Smith Heiman HS 6040-2is');
    } else if (locUpper.includes('SSCP F')) {
      models.push('X-Ray Rapiscan 620DV');
    } else if (locUpper.includes('HBSCP') || locUpper.includes('BEA CUKAI')) {
      models.push('X-Ray Rapiscan 628DV', 'X-Ray Nuctech CX100100D', 'X-Ray Smith Heiman HS 100100-2is');
    } else {
      return allModels;
    }
    return models;
  };

  // === LOGIKA LOKASI BERSAMA ===
  const getGeneralLokasiOptions = (peralatanType) => {
    if (!peralatanType) return [];
    if (['ATRS', 'Body Scanner Leidos Provision 2', 'Body Scanner', 'Extension Conveyor'].includes(peralatanType)) {
      return ['PSCP D', 'PSCP E', 'PSCP F', 'PSCP Umroh'];
    } else if (peralatanType === 'Access Control') {
      return [
        'Rampout D', 'Rampout E', 'Rampout F', 'Aviobridge D', 'BL D', 'Aviobridge E', 'BL E', 'Aviobridge F', 'BL F', 'Breakdown D', 
        'Breakdown E1', 'Breakdown E2', 'Breakdown F', 'Breakdown Umroh', 'Ruang Monitoring E1', 'Server Access', 'HBSCP Umroh',
        'Lift D', 'Lift F', 'Lift Difable D', 'Lift Difable E', 'Lift Difable F', 'Mainframe E'
      ];
    } else if (peralatanType.includes('620DV') || peralatanType.includes('920DV') || peralatanType.includes('6040')) {
      return ['PSCP D', 'PSCP E', 'PSCP F', 'PSCP Umroh', 'SSCP E', 'SSCP F'];
    } else if (peralatanType.includes('628DV') || peralatanType.includes('100100')) {
      return ['HBSCP', 'Xray Bea Cukai Conveyor', 'Redline Bea Cukai Arrival F', 'Redline Bea Cukai Arrival Umroh'];
    } else if (peralatanType === 'Semua X-Ray' || peralatanType === 'X-Ray') {
      return ['PSCP D', 'PSCP E', 'PSCP F', 'PSCP Umroh', 'SSCP E', 'SSCP F', 'HBSCP', 'Xray Bea Cukai Conveyor', 'Redline Bea Cukai Arrival F', 'Redline Bea Cukai Arrival Umroh'];
    } else {
      let opts = ['PSCP D', 'PSCP E', 'PSCP F', 'PSCP Umroh', 'SSCP E', 'SSCP F', 'HBSCP'];
      if (peralatanType === 'WTMD' || peralatanType === 'WTMD CEIA') {
        opts = opts.filter(loc => loc !== 'HBSCP');
        opts.push('Transfer Desk D', 'Transfer Desk E');
      } else if (peralatanType === 'HHMD') {
        opts = opts.filter(loc => loc !== 'HBSCP');
        opts.push('Transfer Desk D', 'Transfer Desk E');
      }
      return opts;
    }
  };

  const getIntersectedLocations = (peralatanArray, xrayModelSelected = 'Semua X-Ray') => {
    if (!peralatanArray || peralatanArray.length === 0) return [];
    
    let validLocs = null;
    
    for (const equip of peralatanArray) {
      let currentEquipOpts = [];
      if (equip === 'X-Ray') {
        currentEquipOpts = getGeneralLokasiOptions(xrayModelSelected);
      } else {
        currentEquipOpts = getGeneralLokasiOptions(equip);
      }

      if (validLocs === null) {
        validLocs = [...currentEquipOpts];
      } else {
        validLocs = validLocs.filter(loc => currentEquipOpts.includes(loc));
      }
      
      if (validLocs.length === 0) break; 
    }
    
    return validLocs || [];
  };

  // === LOGIKA TAB CAM ===
  useEffect(() => {
    let timer;
    if (activeTab === 'cam') {
      // 1. Live Clock
      timer = setInterval(() => setLiveTime(new Date()), 1000);
      
      // 2. Get Location & Reverse Geocoding
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            try {
              const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=id`);
              const data = await response.json();
              let addressName = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
              
              if (data && data.address) {
                const city = data.address.city || data.address.town || data.address.county || data.address.region;
                const state = data.address.state || data.address.province;
                if (city && state) {
                  addressName = `${city}, ${state}`;
                }
              }
              setCamLocation({ lat, lng, address: addressName, error: null });
            } catch (e) {
              setCamLocation({ lat, lng, address: `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`, error: null });
            }
          },
          (err) => setCamLocation({ lat: null, lng: null, address: '', error: 'Lokasi tidak diizinkan' }),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        setCamLocation({ lat: null, lng: null, address: '', error: 'Geolocation tidak didukung' });
      }

      // 3. Start Camera
      startCamera();
    } else {
      // Cleanup camera when leaving tab
      stopCamera();
    }

    return () => {
      clearInterval(timer);
      stopCamera();
    };
  }, [activeTab, camFacingMode]);

  const startCamera = async () => {
    stopCamera();
    setCamError(null);
    
    // Pastikan browser mendukung API media devices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("MediaDevices API tidak didukung di browser ini.");
      setCamError("Browser atau perangkat Anda tidak mendukung akses API kamera (Pastikan menggunakan HTTPS).");
      return;
    }

    try {
      // Percobaan Pertama: Membuka kamera dengan setelan spesifik (Depan / Belakang)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: camFacingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      setCamStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.log("Auto-play prevented", e));
      }
    } catch (err) {
      console.warn(`Gagal mencari kamera jenis '${camFacingMode}':`, err);
      
      // Percobaan Kedua (Fallback): Membuka kamera apa pun yang tersedia (Biasanya untuk PC/Laptop)
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false
        });
        setCamStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play().catch(e => console.log("Auto-play prevented", e));
        }
      } catch (fallbackErr) {
        console.error("Gagal total mengakses kamera:", fallbackErr);
        setCamError("Kamera tidak ditemukan atau akses ditolak. Pastikan perangkat memiliki kamera dan telah memberikan izin (Permission) kepada browser.");
      }
    }
  };

  const stopCamera = () => {
    if (camStream) {
      camStream.getTracks().forEach(track => track.stop());
      setCamStream(null);
    }
  };

  const toggleCamera = () => {
    setCamFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Flash effect
    setIsFlash(true);
    setTimeout(() => setIsFlash(false), 150);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to match video source
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    if (camFacingMode === 'user') {
      // Mirror if front camera
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    // === DRAW WATERMARK ===
    const gradient = ctx.createLinearGradient(0, canvas.height - 200, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.5, 'rgba(0,0,0,0.4)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height - 200, canvas.width, 200);

    // Data Real-Time
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const dayStr = now.toLocaleDateString('id-ID', { weekday: 'long' });
    const locStr = camLocation.address || camLocation.error || 'Mencari lokasi...';

    // Koordinat dasar teks watermark
    const startX = Math.max(30, canvas.width * 0.05);
    const bottomY = canvas.height - Math.max(30, canvas.height * 0.05);

    // Menggambar Jam Besar
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'bottom';
    const timeFontSize = Math.floor(canvas.height * 0.12);
    ctx.font = `${timeFontSize}px "Impact", "Arial Black", sans-serif`;
    
    const timeY = bottomY - Math.floor(canvas.height * 0.06);
    ctx.fillText(timeStr, startX, timeY);

    const timeMetrics = ctx.measureText(timeStr);
    const timeWidth = timeMetrics.width;

    // Menggambar Garis Vertical Oranye
    const lineX = startX + timeWidth + 20;
    const lineHeight = timeFontSize * 0.8;
    const lineY = timeY - lineHeight + (timeFontSize * 0.1);
    
    ctx.fillStyle = '#F59E0B'; // Oranye
    ctx.fillRect(lineX, lineY, 6, lineHeight);

    // Menggambar Tanggal & Hari
    const detailStartX = lineX + 25;
    const detailFontSize = Math.floor(timeFontSize * 0.35);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${detailFontSize}px "Arial", sans-serif`;
    
    ctx.fillText(dateStr, detailStartX, lineY + (detailFontSize * 0.8));
    ctx.fillText(dayStr, detailStartX, lineY + lineHeight - (detailFontSize * 0.1));

    // Menggambar Nama Lokasi (Paling Bawah)
    const locFontSize = Math.floor(timeFontSize * 0.35);
    ctx.font = `${locFontSize}px "Arial", sans-serif`;
    ctx.fillText(locStr, startX, bottomY);

    // Save & Trigger Download
    canvas.toBlob((blob) => {
      if (!blob) {
        alert("Gagal memproses gambar. Ukuran kanvas mungkin 0 atau kamera belum siap.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SSES_T2_Cam_${now.getTime()}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.95);
  };

  const lokasi1OptionsPerbaikan = getGeneralLokasiOptions(formData.peralatan);
  
  const getLokasi2Options = (lokasi, peralatanArray = []) => {
    if (!lokasi) return [];
    const locUpper = lokasi.toUpperCase();
    
    // Disable No if Access Control is selected and location contains certain keywords
    if (peralatanArray.includes('Access Control')) {
      if (locUpper.includes('LIFT') || locUpper.includes('MAINFRAME') || locUpper.includes('SERVER') || locUpper.includes('HBSCP') || locUpper.includes('BREAKDOWN') || locUpper.includes('MONITORING')) {
        return [];
      }
    }

    if (locUpper.includes('SSCP')) return [];
    if (locUpper.includes('TRANSFER DESK')) return [];
    if (locUpper === 'PSCP D' || locUpper === 'PSCP E') return ['1', '2', '3', '4', '5'];
    if (locUpper === 'PSCP F') return ['1', '2', '3', '4'];
    if (locUpper === 'PSCP UMROH') return ['1', '2', '3', '4', '5', '6', '7'];
    if (locUpper.includes('BEA CUKAI CONVEYOR')) return ['11', '12', '13', '14', '15', '16', '17', '18'];
    if (locUpper.includes('REDLINE') || locUpper.includes('RED LINE')) return ['1', '2', '3', '4'];
    if (locUpper === 'HBSCP') return ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8'];
    
    return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18'];
  };

  // === LOGIKA TAB 1 (PERBAIKAN) ===
  useEffect(() => {
    if (formData.waktuMulai && formData.waktuSelesai) {
      const start = formData.waktuMulai.split(':').map(Number);
      const end = formData.waktuSelesai.split(':').map(Number);
      let startMins = start[0] * 60 + start[1];
      let endMins = end[0] * 60 + end[1];
      if (endMins < startMins) endMins += 24 * 60; // Lewat tengah malam
      const diffMins = endMins - startMins;
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      let durasi = '';
      if (hours > 0 && mins > 0) durasi = `${hours} Jam ${mins} Menit`;
      else if (hours > 0) durasi = `${hours} Jam`;
      else durasi = `${mins} Menit`;

      setFormData(prev => prev.lamaPengerjaan !== durasi ? { ...prev, lamaPengerjaan: durasi } : prev);
    } else {
      setFormData(prev => prev.lamaPengerjaan !== '' ? { ...prev, lamaPengerjaan: '' } : prev);
    }
  }, [formData.waktuMulai, formData.waktuSelesai]);

  const handleRepairChange = (e) => {
    const { name, value } = e.target;
    if (name === 'lokasi1') {
      const validOptions = getLokasi2Options(value, [formData.peralatan]);
      let newLokasi2 = formData.lokasi2;
      if (validOptions.length === 0 || !validOptions.includes(newLokasi2)) {
        newLokasi2 = '';
      }
      setFormData(prev => ({ ...prev, lokasi1: value, lokasi2: newLokasi2 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePeralatanChange = (e) => {
    const type = e.target.value;
    let newFormData = { ...formData, peralatan: type, lokasi1: '', lokasi2: '' };
    if (type !== 'ETD Leidos QS-B220' && isVerifikasiETD) {
      setIsVerifikasiETD(false);
      if (newFormData.indikasiAwal === '-') newFormData.indikasiAwal = '';
      if (newFormData.permasalahan === '• Verification Required') newFormData.permasalahan = '• ';
      if (newFormData.tindakLanjut === '• Melakukan Verifikasi Negatif') newFormData.tindakLanjut = '• ';
    }
    setFormData(newFormData);
  };

  const handleVerifikasiChange = (e) => {
    const checked = e.target.checked;
    setIsVerifikasiETD(checked);
    if (checked) {
      setFormData(prev => ({
        ...prev, peralatan: 'ETD Leidos QS-B220', lokasi1: '', lokasi2: '', indikasiAwal: '-', 
        permasalahan: '• Verification Required', tindakLanjut: '• Melakukan Verifikasi Negatif'
      }));
    } else {
      setFormData(prev => ({
        ...prev, indikasiAwal: prev.indikasiAwal === '-' ? '' : prev.indikasiAwal,
        permasalahan: prev.permasalahan === '• Verification Required' ? '• ' : prev.permasalahan,
        tindakLanjut: prev.tindakLanjut === '• Melakukan Verifikasi Negatif' ? '• ' : prev.tindakLanjut
      }));
    }
  };

  // === LOGIKA TAB 5 (KALIBRASI MULTI LOKASI) ===
  const handleKalibrasiGlobalChange = (e) => {
    const { name, value } = e.target;
    setKalibrasiGlobal(prev => ({ ...prev, [name]: value }));
  };

  const handleKalibrasiEntryChange = (index, e) => {
    const { name, value } = e.target;
    
    // Restriksi X-Ray Numeric Fields
    const xrayNumericFields = ['xrayKvV', 'xrayKvH', 'xrayMaV', 'xrayMaH', 'xrayOnV', 'xrayOnH'];
    if (xrayNumericFields.includes(name)) {
      if (!/^[0-9.,]*$/.test(value)) return;
    }

    // Restriksi WTMD Numeric Fields
    const wtmdFields = ['wtmdZ1', 'wtmdZ2', 'wtmdZ3', 'wtmdZ4', 'wtmdLc', 'wtmdLs', 'wtmdUc', 'wtmdSe', 'wtmdDs'];
    if (wtmdFields.includes(name)) {
      if (!/^[0-9\-]*$/.test(value)) return;
    }

    setKalibrasiEntries(prev => {
      const newEntries = [...prev];
      if (name === 'lokasi1') {
        const validOptions = getLokasi2Options(value, newEntries[index].peralatan);
        let newLokasi2 = newEntries[index].lokasi2;
        if (validOptions.length === 0 || !validOptions.includes(newLokasi2)) {
          newLokasi2 = '';
        }
        
        // Filter dropdown Model X-Ray agar sesuai dengan lokasi yang baru
        const validModels = getValidXRayModels(value);
        let newXrayModel = newEntries[index].xrayModel;
        if (!validModels.includes(newXrayModel) && newXrayModel !== 'Semua X-Ray') {
          newXrayModel = 'Semua X-Ray';
        }
        
        newEntries[index] = { ...newEntries[index], lokasi1: value, lokasi2: newLokasi2, xrayModel: newXrayModel };
      } else if (name === 'xrayModel') {
        // Ketika model X-Ray berubah, filter ulang irisan lokasinya
        const currentEntry = newEntries[index];
        const newEntryState = { ...currentEntry, [name]: value };
        
        const validLocs = getIntersectedLocations(newEntryState.peralatan, value);
        
        let newLokasi1 = currentEntry.lokasi1;
        let newLokasi2 = currentEntry.lokasi2;
        
        // Reset lokasi jika tidak sesuai dengan irisan alat + model X-ray terbaru
        if (validLocs.length > 0 && !validLocs.includes(newLokasi1)) {
          newLokasi1 = '';
          newLokasi2 = '';
        } else if (validLocs.length === 0) {
          newLokasi1 = '';
          newLokasi2 = '';
        } else {
          const validOptions2 = getLokasi2Options(newLokasi1, newEntryState.peralatan);
          if (validOptions2.length === 0 || !validOptions2.includes(newLokasi2)) {
            newLokasi2 = '';
          }
        }

        newEntries[index] = { ...newEntryState, lokasi1: newLokasi1, lokasi2: newLokasi2 };
      } else {
        newEntries[index] = { ...newEntries[index], [name]: value };
      }
      return newEntries;
    });
  };

  const handleKalibrasiEquipToggle = (index, equip) => {
    setKalibrasiEntries(prev => {
      const newEntries = [...prev];
      let newEquipArray = [...newEntries[index].peralatan];
      
      if (equip === 'Access Control') {
        if (newEquipArray.includes('Access Control')) {
          newEquipArray = [];
        } else {
          newEquipArray = ['Access Control'];
        }
      } else {
        if (newEquipArray.includes('Access Control')) return newEntries; // Block other selections if AC is checked
        
        if (newEquipArray.includes(equip)) {
          newEquipArray = newEquipArray.filter(e => e !== equip);
        } else {
          newEquipArray.push(equip);
        }
      }
      
      const currentEntry = newEntries[index];
      const newEntryState = { ...currentEntry, peralatan: newEquipArray };
      
      // Filter lokasi berdasarkan irisan alat terbaru
      const validLocs = getIntersectedLocations(newEquipArray, currentEntry.xrayModel);
      
      let newLokasi1 = currentEntry.lokasi1;
      let newLokasi2 = currentEntry.lokasi2;
      
      if (validLocs.length > 0 && !validLocs.includes(newLokasi1)) {
        newLokasi1 = '';
        newLokasi2 = '';
      } else if (validLocs.length === 0) {
        newLokasi1 = '';
        newLokasi2 = '';
      } else {
        const validOptions2 = getLokasi2Options(newLokasi1, newEquipArray);
        if (validOptions2.length === 0 || !validOptions2.includes(newLokasi2)) {
          newLokasi2 = '';
        }
      }

      const validModels = getValidXRayModels(newLokasi1);
      let newXrayModel = currentEntry.xrayModel;
      if (!validModels.includes(newXrayModel) && newXrayModel !== 'Semua X-Ray') {
        newXrayModel = 'Semua X-Ray';
      }

      // Access Control memakai checklist lokasi tersendiri; reset bila AC tidak dipilih
      const isAC = newEquipArray.includes('Access Control');
      const newAcLokasi = isAC ? currentEntry.acLokasi : [];
      const newAcEmlock = isAC ? currentEntry.acEmlock : 'Berfungsi';
      const newAcIntercom = isAC ? currentEntry.acIntercom : 'Berfungsi';
      const newAcFingerprint = isAC ? currentEntry.acFingerprint : 'Berfungsi';
      const newAcCctv = isAC ? currentEntry.acCctv : 'Berfungsi';
      const newAcPengontrolan = isAC ? currentEntry.acPengontrolan : 'Berfungsi';
      const newAcRecordCctv = isAC ? currentEntry.acRecordCctv : '';

      newEntries[index] = { ...newEntryState, lokasi1: newLokasi1, lokasi2: newLokasi2, xrayModel: newXrayModel, acLokasi: newAcLokasi, acEmlock: newAcEmlock, acIntercom: newAcIntercom, acFingerprint: newAcFingerprint, acCctv: newAcCctv, acPengontrolan: newAcPengontrolan, acRecordCctv: newAcRecordCctv };
      return newEntries;
    });
  };

  const handleKalibrasiAcLokasiToggle = (index, loc) => {
    setKalibrasiEntries(prev => {
      const newEntries = [...prev];
      const current = newEntries[index].acLokasi || [];
      const newAcLokasi = current.includes(loc)
        ? current.filter(l => l !== loc)
        : [...current, loc];
      newEntries[index] = { ...newEntries[index], acLokasi: newAcLokasi };
      return newEntries;
    });
  };

  const addKalibrasiEntry = () => {
    setKalibrasiEntries(prev => [...prev, createEmptyKalibrasiEntry()]);
  };

  const removeKalibrasiEntry = (index) => {
    if (kalibrasiEntries.length <= 1) return;
    setKalibrasiEntries(prev => {
      const newEntries = [...prev];
      newEntries.splice(index, 1);
      return newEntries;
    });
  };

  const generateKalibrasiMessage = () => {
    if (kalibrasiEntries.length === 0 || kalibrasiEntries.every(e => e.peralatan.length === 0)) {
      return "Silakan tambah peralatan pada lokasi untuk melihat preview laporan...";
    }

    const formattedDate = formatTanggalIndo(kalibrasiGlobal.tanggal);
    const jamMulai = kalibrasiGlobal.waktuMulai || '...';
    const jamSelesai = kalibrasiGlobal.waktuSelesai || '...';

    let msg = `*PREVENTIVE MAINTENANCE & KALIBRASI SSES T2*\nHari/Tanggal/Jam : ${formattedDate}, ${jamMulai} - ${jamSelesai}`;

    kalibrasiEntries.forEach((entry, idx) => {
      if (entry.peralatan.length === 0) return; // Skip if no equipment selected in this entry

      // === ACCESS CONTROL: blok khusus dengan checklist multi-lokasi ===
      if (entry.peralatan.includes('Access Control')) {
        const locs = entry.acLokasi || [];
        let lokasiAC = '...';
        if (locs.length === 1) {
          lokasiAC = locs[0];
        } else if (locs.length > 1) {
          const lastLoc = locs[locs.length - 1];
          const otherLocs = locs.slice(0, -1).join(', ');
          lokasiAC = `${otherLocs} & ${lastLoc}`;
        }

        msg += `\n\nPeralatan : Access Control\nLokasi : ${lokasiAC}\n\nKegiatan :\n- Pembersihan Emlock, Switch, Intercom, Fingerprint & CCTV\n- Pengecekan Fungsi Emlock, Intercom, Fingerprint, CCTV, Pengontrolan Kunci Pintu, Record CCTV\n   \nCatatan :\n- Fungsi Emlock : ${entry.acEmlock || '...'}\n- Fungsi Intercom : ${entry.acIntercom || '...'}\n- Fungsi Fingerprint: ${entry.acFingerprint || '...'}\n- Fungsi CCTV : ${entry.acCctv || '...'}\n- Fungsi Pengontrolan Kunci Pintu : ${entry.acPengontrolan || '...'}\n- Record CCTV : ${entry.acRecordCctv || '...'}`;
        return;
      }

      const equipListFormatted = entry.peralatan.map(eq => {
        if (eq === 'X-Ray') return entry.xrayModel === 'Semua X-Ray' ? 'X-Ray' : entry.xrayModel;
        if (eq === 'WTMD') return entry.wtmdModel;
        if (eq === 'Body Scanner') return entry.bsModel;
        if (eq === 'ETD') return 'ETD Leidos QS-B220';
        return eq;
      });
      
      let equipString = '-';
      if (equipListFormatted.length === 1) {
        equipString = equipListFormatted[0];
      } else if (equipListFormatted.length > 1) {
        const lastEquip = equipListFormatted[equipListFormatted.length - 1];
        const otherEquips = equipListFormatted.slice(0, -1).join(', ');
        equipString = `${otherEquips} & ${lastEquip}`;
      }

      let lokasiFinal = entry.lokasi1 + (entry.lokasi2 ? ` No.${entry.lokasi2}` : '');
      
      msg += `\n\nPeralatan : ${equipString}\nLokasi : ${lokasiFinal}\n\nKegiatan :\n- Pembersihan ${equipString}\n- Kalibrasi ${equipString}\n   \nCatatan :`;

      let catatanBlocks = [];

      if (entry.peralatan.includes('X-Ray')) {
        const xrayName = entry.xrayModel === 'Semua X-Ray' ? 'X-Ray' : entry.xrayModel;
        catatanBlocks.push(`${xrayName}\n- kV Vertikal/Horizontal : ${entry.xrayKvV || '...'} kV/${entry.xrayKvH || '...'} kV\n- mA Vertikal/Horizontal : ${entry.xrayMaV || '...'} mA/ ${entry.xrayMaH || '...'} mA\n- Ontime Vertikal/Horizontal : ${entry.xrayOnV || '...'} h/${entry.xrayOnH || '...'} h\n- Archieve : ${entry.xrayArchive || '...'}`);
      }

      if (entry.peralatan.includes('WTMD')) {
        catatanBlocks.push(`${entry.wtmdModel}\n- Z1 : ${entry.wtmdZ1 || '...'} - Z2 : ${entry.wtmdZ2 || '...'} - Z3 : ${entry.wtmdZ3 || '...'} - Z4 : ${entry.wtmdZ4 || '...'}\n- LC : ${entry.wtmdLc || '...'} - LS : ${entry.wtmdLs || '...'} - UC : ${entry.wtmdUc || '...'} - SE : ${entry.wtmdSe || '...'} - DS : ${entry.wtmdDs || '...'}`);
      }

      if (entry.peralatan.includes('Body Scanner')) {
        catatanBlocks.push(`${entry.bsModel}\n- Test tampilan suspect item di monitor : ${entry.bsSuspect}\n- Test monitor : ${entry.bsMonitor}\n- Test Fungsi Scanning : ${entry.bsScanning}\n- Test Fungsi Kalibrasi : ${entry.bsCalibration}`);
      }

      if (entry.peralatan.includes('ETD')) {
        catatanBlocks.push(`ETD Leidos QS-B220\n- Sampling Test TNT : ${entry.etdTnt}\n- Sampling Test PETN : ${entry.etdPetn}\n- Sampling Test RDX : ${entry.etdRdx}`);
      }

      if (catatanBlocks.length > 0) {
        msg += `\n` + catatanBlocks.join('\n\n');
      }
    });

    return msg;
  };

  const handleKalibrasiSubmit = async (e) => {
    e.preventDefault();
    if (kalibrasiEntries.some(e => e.peralatan.length === 0)) {
      alert("Pastikan Anda memilih minimal 1 peralatan untuk setiap lokasi kalibrasi yang ditambahkan!");
      return;
    }
    if (kalibrasiEntries.some(e => e.peralatan.includes('Access Control') && (e.acLokasi || []).length === 0)) {
      alert("Pastikan Anda mencentang minimal 1 lokasi untuk peralatan Access Control!");
      return;
    }
    
    let customFilesArray = [];
    kalibrasiPhotoGroups.forEach(group => {
      if (group.photos.length > 1 && group.collageFile) {
        customFilesArray.push(group.collageFile);
      } else if (group.photos.length === 1) {
        customFilesArray.push(group.photos[0].file);
      }
    });

    executeShare(generateKalibrasiMessage(), customFilesArray);
  };

  // === HANDLER DRAG & DROP SERTA ZOOM (KALIBRASI) ===
  const handleKalibrasiPhotoDrop = (e, groupId, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    setKalibrasiPhotoGroups(prev => {
      let updatedGroupPhotos = [];
      const nextState = prev.map(group => {
        if (group.id === groupId) {
          const newPhotos = [...group.photos];
          const [moved] = newPhotos.splice(sourceIndex, 1);
          newPhotos.splice(targetIndex, 0, moved);
          updatedGroupPhotos = newPhotos;
          return { ...group, photos: newPhotos };
        }
        return group;
      });
      generateGroupCollage(groupId, updatedGroupPhotos);
      return nextState;
    });
  };

  const updateKalibrasiPhotoZoom = (groupId, photoIndex, delta) => {
    setKalibrasiPhotoGroups(prev => {
      let updatedGroupPhotos = [];
      const nextState = prev.map(group => {
        if (group.id === groupId) {
          const newPhotos = [...group.photos];
          const newZoom = Math.max(0.5, Math.min(3, (newPhotos[photoIndex].zoom || 1) + delta));
          newPhotos[photoIndex] = { ...newPhotos[photoIndex], zoom: newZoom };
          updatedGroupPhotos = newPhotos;
          return { ...group, photos: newPhotos };
        }
        return group;
      });
      generateGroupCollage(groupId, updatedGroupPhotos);
      return nextState;
    });
  };

  // === HANDLER MULTI KOLASE KALIBRASI ===
  const generateGroupCollage = async (groupId, photosArray) => {
    if (photosArray.length <= 1) {
      setKalibrasiPhotoGroups(prev => prev.map(g => {
        if (g.id === groupId) {
          if (g.collageUrl) URL.revokeObjectURL(g.collageUrl);
          return { ...g, collageUrl: null, collageFile: null, isGenerating: false };
        }
        return g;
      }));
      return;
    }

    setKalibrasiPhotoGroups(prev => prev.map(g => g.id === groupId ? { ...g, isGenerating: true } : g));

    try {
      const CELL_SIZE = 800; const SPACING = 24;    
      const cols = Math.ceil(Math.sqrt(photosArray.length)); const rows = Math.ceil(photosArray.length / cols);
      const canvas = document.createElement('canvas');
      canvas.width = cols * CELL_SIZE + (cols + 1) * SPACING; canvas.height = rows * CELL_SIZE + (rows + 1) * SPACING;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const loadedImages = await Promise.all(photosArray.map(p => {
        return new Promise((resolve, reject) => {
          const img = new Image(); 
          img.onload = () => resolve({ img, zoom: p.zoom || 1 }); 
          img.onerror = reject; 
          img.src = p.preview;
        });
      }));
      
      loadedImages.forEach((item, index) => {
        const { img, zoom } = item;
        const col = index % cols; const row = Math.floor(index / cols);
        const x = SPACING + col * (CELL_SIZE + SPACING); const y = SPACING + row * (CELL_SIZE + SPACING);
        
        // Kalkulasi Base Scale + Custom Zoom dengan Center Alignment
        const baseScale = Math.max(CELL_SIZE / img.width, CELL_SIZE / img.height);
        const finalScale = baseScale * zoom;
        const nw = img.width * finalScale; const nh = img.height * finalScale;
        const ox = (CELL_SIZE - nw) / 2; const oy = (CELL_SIZE - nh) / 2;
        
        ctx.save(); ctx.beginPath();
        if (ctx.roundRect) { ctx.roundRect(x, y, CELL_SIZE, CELL_SIZE, 16); } else { ctx.rect(x, y, CELL_SIZE, CELL_SIZE); }
        ctx.clip();
        ctx.drawImage(img, x + ox, y + oy, nw, nh); ctx.restore();
      });
      
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error("Blob hasil kanvas kosong pada generateGroupCollage.");
          setKalibrasiPhotoGroups(prev => prev.map(g => g.id === groupId ? { ...g, isGenerating: false } : g));
          return;
        }
        const newFile = new File([blob], `Kolase_${groupId}_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const newUrl = URL.createObjectURL(blob);
        
        setKalibrasiPhotoGroups(prev => prev.map(g => {
          if (g.id === groupId) {
            if (g.collageUrl) URL.revokeObjectURL(g.collageUrl);
            return { ...g, collageUrl: newUrl, collageFile: newFile, isGenerating: false };
          }
          return g;
        }));
      }, 'image/jpeg', 0.85);
    } catch (err) {
      console.error("Gagal membuat kolase grup:", err);
      setKalibrasiPhotoGroups(prev => prev.map(g => g.id === groupId ? { ...g, isGenerating: false } : g));
    }
  };

  const handleKalibrasiPhotoUpload = (groupId, e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map(file => ({ id: Date.now() + Math.random(), file, preview: URL.createObjectURL(file), zoom: 1 }));

    setKalibrasiPhotoGroups(prev => {
      let updatedGroupPhotos = [];
      const nextState = prev.map(group => {
        if (group.id === groupId) {
          updatedGroupPhotos = [...group.photos, ...newPhotos];
          return { ...group, photos: updatedGroupPhotos };
        }
        return group;
      });
      
      generateGroupCollage(groupId, updatedGroupPhotos);
      return nextState;
    });
    e.target.value = null;
  };

  const removeKalibrasiPhoto = (groupId, photoIndex) => {
    setKalibrasiPhotoGroups(prev => {
      let updatedGroupPhotos = [];
      const nextState = prev.map(group => {
        if (group.id === groupId) {
          const newPhotos = [...group.photos];
          URL.revokeObjectURL(newPhotos[photoIndex].preview);
          newPhotos.splice(photoIndex, 1);
          updatedGroupPhotos = newPhotos;
          return { ...group, photos: newPhotos };
        }
        return group;
      });
      generateGroupCollage(groupId, updatedGroupPhotos);
      return nextState;
    });
  };

  const addKalibrasiPhotoGroup = () => {
    setKalibrasiPhotoGroups(prev => [...prev, { id: Date.now() + Math.random(), photos: [], collageUrl: null, collageFile: null, isGenerating: false }]);
  };

  const removeKalibrasiPhotoGroup = (groupId) => {
    setKalibrasiPhotoGroups(prev => {
      const groupToRemove = prev.find(g => g.id === groupId);
      if (groupToRemove) {
        groupToRemove.photos.forEach(p => URL.revokeObjectURL(p.preview));
        if (groupToRemove.collageUrl) URL.revokeObjectURL(groupToRemove.collageUrl);
      }
      return prev.filter(g => g.id !== groupId);
    });
  };

  // === LOGIKA TAB 6: TIP ===
  useEffect(() => {
    if (activeTab !== 'tip') return;
    const storageKey = `tip_data_${tipMonth}_${tipYear}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTipDataState(parsed.items || {});
        setTipLastSaved(parsed.lastSaved || null);
      } catch (e) {
        console.error("Gagal load data TIP dari storage");
        setTipDataState({}); setTipLastSaved(null);
      }
    } else {
      setTipDataState({}); setTipLastSaved(null);
    }
    setTipUnsavedChanges(false);
  }, [tipMonth, tipYear, activeTab]);

  const getTipCheckedCount = () => {
    return Object.values(tipDataState).filter(d => d.checked).length;
  };

  const handleTipToggle = (catId, item) => {
    const key = `${catId}-${item}`;
    const current = tipDataState[key] || { checked: false, locked: false };
    if (current.locked) return;
    
    setTipDataState(prev => ({
      ...prev,
      [key]: { ...current, checked: !current.checked }
    }));
    setTipUnsavedChanges(true);
  };

  const handleTipCategoryToggle = (catId, items) => {
    const allChecked = items.every(i => {
      const d = tipDataState[`${catId}-${i}`];
      return d && d.checked;
    });
    
    const newData = { ...tipDataState };
    let changed = false;
    items.forEach(i => {
      const key = `${catId}-${i}`;
      const d = newData[key] || { checked: false, locked: false };
      if (!d.locked) {
        newData[key] = { ...d, checked: !allChecked };
        changed = true;
      }
    });
    
    if (changed) {
      setTipDataState(newData);
      setTipUnsavedChanges(true);
    }
  };

  const handleTipToggleAll = () => {
    const allItems = [...tipLeftCol, ...tipRightCol].flatMap(cat => cat.items.map(i => ({ catId: cat.id, item: i })));
    const allChecked = allItems.every(({ catId, item }) => {
      const d = tipDataState[`${catId}-${item}`];
      return d && d.checked;
    });
    
    const newData = { ...tipDataState };
    let changed = false;
    allItems.forEach(({ catId, item }) => {
      const key = `${catId}-${item}`;
      const d = newData[key] || { checked: false, locked: false };
      if (!d.locked) {
        newData[key] = { ...d, checked: !allChecked };
        changed = true;
      }
    });
    
    if (changed) {
      setTipDataState(newData);
      setTipUnsavedChanges(true);
    }
  };

  const handleTipSave = () => {
    const now = new Date();
    const timeString = `${now.getDate()} ${TIP_MONTHS[now.getMonth()]} ${now.getFullYear()} pukul ${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newData = { ...tipDataState };
    Object.keys(newData).forEach(k => {
      if (newData[k].checked) {
        newData[k].locked = true;
      }
    });
    
    setTipDataState(newData);
    setTipLastSaved(timeString);
    setTipUnsavedChanges(false);
    
    const storageKey = `tip_data_${tipMonth}_${tipYear}`;
    localStorage.setItem(storageKey, JSON.stringify({
      lastSaved: timeString,
      items: newData
    }));
  };

  const loadHtmlToImage = () => {
    return new Promise((resolve, reject) => {
      if (window.htmlToImage) return resolve(window.htmlToImage);
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js';
      script.onload = () => resolve(window.htmlToImage);
      script.onerror = () => reject(new Error('Gagal memuat script gambar'));
      document.head.appendChild(script);
    });
  };

  const handleTipShare = async () => {
    const element = document.getElementById('tip-export-area');
    const grid = document.getElementById('tip-export-grid');
    if (!element) return;
    setIsGeneratingTipImage(true);

    const originalGridClass = grid ? grid.className : '';
    const originalGridStyle = grid ? grid.style.cssText : '';
    const originalElementStyle = element.style.cssText;

    try {
      if (grid) {
        grid.className = 'grid grid-cols-2 gap-6 w-full';
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
        grid.style.gap = '2rem';
      }
      
      element.style.width = '1000px';
      element.style.maxWidth = '1000px';
      element.style.margin = '0 auto';
      element.style.padding = '40px';

      const htmlToImage = await loadHtmlToImage();
      await new Promise(r => setTimeout(r, 100)); // biarkan browser me-render UI sesaat

      const blob = await htmlToImage.toBlob(element, { 
        backgroundColor: '#ffffff',
        pixelRatio: 2
      });

      if (!blob) throw new Error('Blob image is empty');

      const file = new File([blob], `TIP_Performance_${tipMonth}_${tipYear}.jpg`, { type: 'image/jpeg' });
      const shareText = `Halo, berikut adalah status laporan TIP Performance bulan ${tipMonth} ${tipYear}.`;
      
      let canShare = false; try { canShare = navigator.canShare && navigator.canShare({ files: [file] }); } catch(e) {} if (canShare) {
        try {
          await navigator.share({
            files: [file],
            title: 'Laporan TIP T2',
            text: shareText
          });
          return;
        } catch (err) {
          console.error('Share dibatalkan/gagal', err);
        }
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TIP_Performance_${tipMonth}_${tipYear}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
      
      const text = encodeURIComponent(shareText + ' (Gambar telah otomatis diunduh)');
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');

    } catch (error) {
      console.error('Error generating image:', error);
      alert('Gagal membuat gambar laporan. Browser mungkin tidak mendukung.');
    } finally {
      if (grid) {
        grid.className = originalGridClass;
        grid.style.cssText = originalGridStyle;
      }
      element.style.cssText = originalElementStyle;
      setIsGeneratingTipImage(false);
    }
  };
  const renderTipTable = (columnData) => (
    <table className="w-full border-collapse border-[3px] border-slate-800 bg-white shadow-sm">
      <tbody>
        {columnData.map((cat, catIdx) => {
          return cat.items.map((item, itemIdx) => {
            const key = `${cat.id}-${item}`;
            const data = tipDataState[key] || { checked: false, locked: false };
            const isLocked = data.locked;
            const isChecked = data.checked;
            
            const catItems = cat.items.map(i => tipDataState[`${cat.id}-${i}`] || { checked: false, locked: false });
            const isAllCatChecked = catItems.every(i => i.checked);
            
            return (
              <tr key={key}>
                {itemIdx === 0 && (
                  <td 
                    rowSpan={cat.items.length} 
                    className="border-r-[3px] border-b-[3px] border-slate-800 p-3 text-center align-middle w-[35%]"
                  >
                    <div className="font-bold text-slate-800 mb-1">{cat.name}</div>
                    <button 
                      type="button" 
                      onClick={() => handleTipCategoryToggle(cat.id, cat.items)}
                      className="text-slate-500 hover:text-emerald-600 transition-colors"
                      title="Check/Uncheck kategori ini"
                    >
                      {isAllCatChecked ? <CheckSquare className="w-5 h-5 mx-auto text-emerald-600" /> : <Square className="w-5 h-5 mx-auto" />}
                    </button>
                  </td>
                )}
                <td className="border-r-[3px] border-b-[2px] border-slate-800 p-2 text-center align-middle font-semibold text-slate-800 w-[30%] bg-white">
                  {item}
                </td>
                <td 
                  onClick={() => handleTipToggle(cat.id, item)}
                  className={`border-b-[2px] border-slate-800 p-1 text-center align-middle transition-colors w-[35%] ${isLocked ? 'bg-slate-100 cursor-not-allowed' : 'hover:bg-slate-50 cursor-pointer bg-white'}`}
                >
                  <div className="flex items-center justify-center gap-1.5 min-h-[32px]">
                    {isChecked && <Check className="w-6 h-6 text-emerald-600 font-bold" strokeWidth={3} />}
                    {isLocked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                </td>
              </tr>
            );
          });
        })}
      </tbody>
    </table>
  );

  // === LOGIKA TAB 2 (KEHADIRAN) ===
  const handleAttendanceChange = (e) => {
    const { name, value } = e.target;
    setAttendanceData(prev => ({ ...prev, [name]: value }));
  };

  const handleShiftChange = (e) => {
    const newShift = e.target.value;
    const isPagi = newShift.includes('Pagi');
    const rowCount = isPagi ? 4 : 2;
    const kegiatan = isPagi 
      ? '- Monitoring Ops\n- Storing Peralatan\n- Preventive Maintenance & Kalibrasi Perangkat' 
      : '- Monitoring Ops\n- Storing Peralatan';

    setAttendanceData(prev => ({
      ...prev, shift: newShift, apiList: createEmptyRows(rowCount), omList: createEmptyRows(rowCount), rencanaKegiatan: kegiatan
    }));
  };

  const handleRowChange = (listName, index, field, value) => {
    setAttendanceData(prev => {
      const newList = [...prev[listName]];
      const row = { ...newList[index] };
      row[field] = value;
      if (field === 'name') {
        const dataSource = listName === 'apiList' ? dataApiT2 : dataOmIasT2;
        const person = dataSource.find(p => p.name === value);
        row.phone = person ? person.phone : '';
      }
      newList[index] = row;
      return { ...prev, [listName]: newList };
    });
  };

  const addRow = (listName) => {
    setAttendanceData(prev => ({
      ...prev, [listName]: [...prev[listName], { id: Date.now(), name: '', phone: '', status: 'Hadir' }]
    }));
  };

  const removeRow = (listName, index) => {
    if (listName === 'apiList' && attendanceData.apiList.length <= 1) return;
    setAttendanceData(prev => {
      const newList = [...prev[listName]];
      newList.splice(index, 1);
      return { ...prev, [listName]: newList };
    });
  };

  // === LOGIKA TAB 3 (BRIEFING) ===
  const handleBriefingChange = (e) => {
    const { name, value } = e.target;
    setBriefingData(prev => ({ ...prev, [name]: value }));
  };

  const generateBriefingMessage = () => {
    const formattedDate = formatTanggalIndo(briefingData.tanggal);
    const judul = briefingData.jenis === 'Unit' ? '*Giat briefing unit SSES T2*' : '*Briefing MOT T2*';
    return `${judul}\nHari/Tanggal : ${formattedDate}\nShift : ${briefingData.shift}\nLokasi : ${briefingData.lokasi}`;
  };

  const handleBriefingSubmit = async (e) => {
    e.preventDefault();
    executeShare(generateBriefingMessage());
  };

  // === LOGIKA TAB 4 (STORING) ===
  const getStoringValidLocations = (equipArray) => {
    if (equipArray.length === 0) return [];
    if (equipArray.includes('Access Control')) return storingLocAc;
    let locs = [...storingLocDefault];
    const isOnlyHHMDWTMD = equipArray.length > 0 && equipArray.every(e => e === 'HHMD' || e === 'WTMD');
    if (isOnlyHHMDWTMD) locs.push('Transfer Desk D', 'Transfer Desk E');
    const isOnlyXRay = equipArray.length === 1 && equipArray[0] === 'X-Ray';
    if (isOnlyXRay) locs.push('Redline Arrival F', 'Redline Arrival Umroh', 'X-Ray Custom Conveyor Kedatangan F', 'X-Ray Custom Conveyor Kedatangan Umroh');
    if (equipArray.includes('Body Scanner')) locs = locs.filter(l => !l.includes('SSCP') && !l.includes('HBSCP'));
    if (equipArray.includes('HHMD') || equipArray.includes('WTMD')) locs = locs.filter(l => !l.includes('HBSCP'));
    return locs;
  };

  const getStoringValidNumbers = (lokasi) => {
    if (!lokasi.includes('Avio') && !lokasi.includes('Rampout')) return [];
    if (lokasi === 'Rampout D' || lokasi === 'Rampout E') return ['2,4,6', '2', '4', '6'];
    if (lokasi === 'Rampout F') return ['1-7', '1', '2', '3', '4', '5', '6', '7'];
    if (lokasi === 'Avio & BL D' || lokasi === 'Avio & BL E' || lokasi === 'Avio & BL F') return ['1-7', '1', '2', '3', '4', '5', '6', '7'];
    return ['1', '2', '3', '4', '5', '6', '7'];
  };

  const handleStoringEquipToggle = (equip) => {
    let newEquipArray = [...storingData.peralatan];
    if (equip === 'Access Control') {
      newEquipArray = newEquipArray.includes('Access Control') ? [] : ['Access Control'];
    } else {
      if (newEquipArray.includes(equip)) newEquipArray = newEquipArray.filter(e => e !== equip);
      else newEquipArray.push(equip);
    }

    const validLocs = getStoringValidLocations(newEquipArray);
    let newLokasi = storingData.lokasi;
    let newNomor = storingData.nomor;

    if (!validLocs.includes(newLokasi)) {
      newLokasi = ''; newNomor = '';
    } else {
      const validNums = getStoringValidNumbers(newLokasi);
      if (!validNums.includes(newNomor)) newNomor = '';
    }

    setStoringData(prev => ({ ...prev, peralatan: newEquipArray, lokasi: newLokasi, nomor: newNomor }));
  };

  const handleStoringChange = (e) => {
    const { name, value } = e.target;
    if (name === 'lokasi') {
      const validNums = getStoringValidNumbers(value);
      let newNomor = storingData.nomor;
      if (!validNums.includes(newNomor)) newNomor = '';
      setStoringData(prev => ({ ...prev, lokasi: value, nomor: newNomor }));
    } else {
      setStoringData(prev => ({ ...prev, [name]: value }));
    }
  };

  const generateStoringMessage = () => {
    const formattedDate = formatTanggalIndo(storingData.tanggal);
    const jamMulai = storingData.waktuMulai || '...';
    const jamSelesai = storingData.waktuSelesai || '...';
    
    let equipString = '-';
    if (storingData.peralatan.length === 1) {
      equipString = storingData.peralatan[0];
    } else if (storingData.peralatan.length > 1) {
      const lastEquip = storingData.peralatan[storingData.peralatan.length - 1];
      const otherEquips = storingData.peralatan.slice(0, -1).join(', ');
      equipString = `${otherEquips} & ${lastEquip}`;
    }

    let locString = '-';
    if (storingData.lokasi) {
      if (storingData.nomor) {
        if (storingData.lokasi === 'Avio & BL D' || storingData.lokasi === 'Avio & BL E' || storingData.lokasi === 'Avio & BL F' || storingData.lokasi.includes('Rampout')) {
          locString = `${storingData.lokasi}${storingData.nomor}`;
        } else {
          locString = `${storingData.lokasi} ${storingData.nomor}`;
        }
      } else {
        locString = storingData.lokasi;
      }
    }
    
    return `*KEGIATAN STORING PERALATAN SSES T2*
Hari/Tanggal/Jam : ${formattedDate}, ${jamMulai} - ${jamSelesai}
Peralatan : ${equipString}
Lokasi : ${locString}
Hasil : ${storingData.hasil}`;
  };

  const handleStoringSubmit = async (e) => {
    e.preventDefault();
    if (storingData.peralatan.length === 0) { alert("Harap centang minimal 1 Peralatan!"); return; }
    if (!storingData.waktuMulai || !storingData.waktuSelesai) { alert("Harap lengkapi Jam Mulai dan Jam Selesai!"); return; }
    if (!storingData.lokasi) { alert("Harap pilih Lokasi!"); return; }
    
    const validNums = getStoringValidNumbers(storingData.lokasi);
    if (validNums.length > 0 && !storingData.nomor) { alert("Harap pilih Nomor Lokasi!"); return; }

    executeShare(generateStoringMessage());
  };

  // === LOGIKA TAB CHECKLIST ===
  const handleChecklistChange = (e) => {
    const { name, value } = e.target;
    setChecklistData(prev => ({ ...prev, [name]: value }));
  };

  const toggleChecklistItem = (key) => {
    setToggles(prev => ({ ...prev, [key]: prev[key] === false ? true : false }));
  };

  const generateChecklistMessage = () => {
    const formattedDate = formatTanggalIndo(checklistData.tanggal);
    const jamMulai = checklistData.waktuMulai || '...';
    const jamSelesai = checklistData.waktuSelesai || '...';
    
    let result = `KEGIATAN STORING PERALATAN SSES T2\n`;
    result += `Hari/Tanggal/Jam : ${formattedDate}, ${jamMulai} - ${jamSelesai}\n\n`;

    checklistDataMaster.forEach((block) => {
      if (block.type === 'location') {
        result += `${block.title}\n`;
        let summaryCounts = {};

        block.categories.forEach((cat) => {
          result += `${cat.title}\n`;
          if (!summaryCounts[cat.summaryKey]) summaryCounts[cat.summaryKey] = { total: 0, operasi: 0, off: 0 };

          cat.items.forEach((item, iIdx) => {
            const key = `${block.title}|${cat.title}|${iIdx}`;
            const isOperasi = toggles[key] !== false; // Default is true (Operasi)
            result += `* ${item} ${isOperasi ? '✅' : '❌'}\n`;
            
            summaryCounts[cat.summaryKey].total++;
            if (isOperasi) summaryCounts[cat.summaryKey].operasi++;
            else summaryCounts[cat.summaryKey].off++;
          });
          result += `\n`; 
        });

        result += `${block.summary}\n`;
        Object.keys(summaryCounts).forEach((sKey) => {
           result += `${sKey}  : ${summaryCounts[sKey].total}\n`;
           result += `* Operasi : ${summaryCounts[sKey].operasi}\n`;
           result += `* Off : ${summaryCounts[sKey].off}\n`;
        });
        result += `\n`;

      } else if (block.type === 'group') {
        let summaryCounts = {};
        
        block.locations.forEach((loc) => {
          result += `${loc.title}\n`;
          loc.categories.forEach((cat) => {
            result += `${cat.title}\n`;
            if (!summaryCounts[cat.summaryKey]) summaryCounts[cat.summaryKey] = { total: 0, operasi: 0, off: 0 };

            cat.items.forEach((item, iIdx) => {
              const key = `${loc.title}|${cat.title}|${iIdx}`;
              const isOperasi = toggles[key] !== false;
              result += `* ${item} ${isOperasi ? '✅' : '❌'}\n`;
              
              summaryCounts[cat.summaryKey].total++;
              if (isOperasi) summaryCounts[cat.summaryKey].operasi++;
              else summaryCounts[cat.summaryKey].off++;
            });
            result += `\n`;
          });
        });

        result += `${block.summary}\n`;
        Object.keys(summaryCounts).forEach((sKey) => {
           result += `${sKey}  : ${summaryCounts[sKey].total}\n`;
           result += `* Operasi : ${summaryCounts[sKey].operasi}\n`;
           result += `* Off : ${summaryCounts[sKey].off}\n`;
        });
        result += `\n`;

      } else if (block.type === 'access_control') {
        result += `${block.title}\n`;
        let totalAc = 0, operasiAc = 0, offAc = 0;

        block.terminals.forEach((term) => {
          if (term.title) result += `${term.title}\n`;
          term.categories.forEach((cat) => {
            result += `${cat.title}\n`;
            cat.items.forEach((item, iIdx) => {
              const key = `${block.title}|${term.title}|${cat.title}|${iIdx}`;
              const isOperasi = toggles[key] !== false;
              result += `* ${item} ${isOperasi ? '✅' : '❌'}\n`;
              
              totalAc++;
              if (isOperasi) operasiAc++;
              else offAc++;
            });
            result += `\n`;
          });
        });

        result += `${block.summary} : ${totalAc}\n`;
        result += `OPERASI : ${operasiAc}\n`;
        result += `OFF : ${offAc}\n\n`;
      }
    });

    result += `TERIMA KASIH\nMELANGKAH BERSAMA UNTUK CGK HEBAT\nBERSAMA MELAYANI SEPENUH HATI`;
    return result.trim();
  };

  const handleChecklistSubmit = async (e) => {
    e.preventDefault();
    executeShare(generateChecklistMessage());
  };

  // === LOGIKA BERSAMA (SHARED) ===
  const handleBulletKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const target = e.target;
      const { selectionStart, selectionEnd, value } = target;
      const newValue = value.substring(0, selectionStart) + '\n• ' + value.substring(selectionEnd);
      if (activeTab === 'kalibrasi') {
        setKalibrasiGlobal(prev => ({ ...prev, [field]: newValue }));
      } else {
        setFormData(prev => ({ ...prev, [field]: newValue }));
      }
      setTimeout(() => { target.selectionStart = target.selectionEnd = selectionStart + 3; }, 0);
    }
  };

  const handleBulletChange = (e, field) => {
    let val = e.target.value;
    if (val === '') val = '• ';
    if (activeTab === 'kalibrasi') {
      setKalibrasiGlobal(prev => ({ ...prev, [field]: val }));
    } else {
      setFormData(prev => ({ ...prev, [field]: val }));
    }
  };

  const handleDashKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const target = e.target;
      const { selectionStart, selectionEnd, value } = target;
      const newValue = value.substring(0, selectionStart) + '\n- ' + value.substring(selectionEnd);
      setAttendanceData(prev => ({ ...prev, [field]: newValue }));
      setTimeout(() => { target.selectionStart = target.selectionEnd = selectionStart + 3; }, 0);
    }
  };

  const handleDashChange = (e, field) => {
    let val = e.target.value;
    if (val === '') val = '- ';
    setAttendanceData(prev => ({ ...prev, [field]: val }));
  };

  const switchTab = (tab) => {
    // If leaving cam tab, the useEffect will handle stopping the stream
    setActiveTab(tab);
    photos.forEach(photo => URL.revokeObjectURL(photo.preview));
    setPhotos([]); setCollageUrl(null); setCollageFile(null); setIsCopied(false);
    
    kalibrasiPhotoGroups.forEach(g => {
      g.photos.forEach(p => URL.revokeObjectURL(p.preview));
      if (g.collageUrl) URL.revokeObjectURL(g.collageUrl);
    });
    setKalibrasiPhotoGroups([{ id: Date.now(), photos: [], collageUrl: null, collageFile: null, isGenerating: false }]);
  };

  const handlePhotoDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    setPhotos(prev => {
      const newPhotos = [...prev];
      const [moved] = newPhotos.splice(sourceIndex, 1);
      newPhotos.splice(targetIndex, 0, moved);
      return newPhotos;
    });
  };

  const updatePhotoZoom = (index, delta) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      const newZoom = Math.max(0.5, Math.min(3, (newPhotos[index].zoom || 1) + delta));
      newPhotos[index] = { ...newPhotos[index], zoom: newZoom };
      return newPhotos;
    });
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map(file => ({ id: Date.now() + Math.random(), file, preview: URL.createObjectURL(file), zoom: 1 }));
    setPhotos(prev => [...prev, ...newPhotos]);
    e.target.value = null; 
  };

  const removePhoto = (index) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  useEffect(() => {
    let isMounted = true;
    const generateCollage = async () => {
      if (photos.length <= 1) {
        setCollageUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
        setCollageFile(null); return;
      }
      setIsGeneratingCollage(true);
      try {
        const CELL_SIZE = 800; const SPACING = 24;    
        const cols = Math.ceil(Math.sqrt(photos.length)); const rows = Math.ceil(photos.length / cols);
        const canvas = document.createElement('canvas');
        canvas.width = cols * CELL_SIZE + (cols + 1) * SPACING; canvas.height = rows * CELL_SIZE + (rows + 1) * SPACING;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const loadedImages = await Promise.all(photos.map(p => {
          return new Promise((resolve, reject) => {
            const img = new Image(); 
            img.onload = () => resolve({ img, zoom: p.zoom || 1 }); 
            img.onerror = reject; 
            img.src = p.preview;
          });
        }));
        
        loadedImages.forEach((item, index) => {
          const { img, zoom } = item;
          const col = index % cols; const row = Math.floor(index / cols);
          const x = SPACING + col * (CELL_SIZE + SPACING); const y = SPACING + row * (CELL_SIZE + SPACING);
          
          // Kalkulasi Base Scale + Custom Zoom dengan Center Alignment
          const baseScale = Math.max(CELL_SIZE / img.width, CELL_SIZE / img.height);
          const finalScale = baseScale * zoom;
          const nw = img.width * finalScale; const nh = img.height * finalScale;
          const ox = (CELL_SIZE - nw) / 2; const oy = (CELL_SIZE - nh) / 2;
          
          ctx.save(); ctx.beginPath();
          if (ctx.roundRect) { ctx.roundRect(x, y, CELL_SIZE, CELL_SIZE, 16); } else { ctx.rect(x, y, CELL_SIZE, CELL_SIZE); }
          ctx.clip();
          ctx.drawImage(img, x + ox, y + oy, nw, nh); ctx.restore();
        });
        
        canvas.toBlob((blob) => {
          if (!isMounted) return;
          if (!blob) {
            console.error("Blob hasil kanvas kosong pada generateCollage.");
            setIsGeneratingCollage(false);
            return;
          }
          const newFile = new File([blob], `Kolase_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setCollageUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob); });
          setCollageFile(newFile); setIsGeneratingCollage(false);
        }, 'image/jpeg', 0.85);
      } catch (err) {
        console.error("Gagal membuat kolase:", err);
        if (isMounted) setIsGeneratingCollage(false);
      }
    };
    generateCollage();
    return () => { isMounted = false; };
  }, [photos]);

  const generateRepairMessage = () => {
    if (!formData.peralatan) return "Silakan pilih peralatan terlebih dahulu untuk melihat preview laporan...";
    const dateParts = formData.tanggal ? formData.tanggal.split('-') : ['','',''];
    const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : '';
    let lokasiFinal = formData.peralatan === 'Access Control' ? formData.lokasi1 + formData.lokasi2 : formData.lokasi1 + (formData.lokasi2 ? ` No.${formData.lokasi2}` : '');
    const judulLaporan = isVerifikasiETD ? `Laporan Verifikasi ${formData.peralatan}` : `Laporan Perbaikan ${formData.peralatan}`;

    return `${judulLaporan}

Lokasi : ${lokasiFinal}
Sumber laporan : ${formData.sumberLaporan}
${isVerifikasiETD ? '' : `Indikasi awal : ${formData.indikasiAwal}`}

🗓️ Tanggal :  ${formattedDate}
🕝 Pukul : ${formData.waktuMulai} - ${formData.waktuSelesai}
⏰ Lama waktu Pengerjaan : ${formData.lamaPengerjaan}
👨🏻‍🔧 Teknisi : ${formData.teknisi}

🪛 Permasalahan :
${formData.permasalahan}
🪛 Tindak lanjut  : 
${formData.tindakLanjut}

✅ Status : ${formData.status}

Demikian laporan tindak lanjut kami sampaikan.
Terimakasih atas perhatiannya`;
  };

  const formatPersonnelList = (list) => {
    const activeList = list.filter(item => item.name !== '');
    if (activeList.length === 0) return "- (Kosong)";
    return activeList.map(item => `- ${item.name} - ${item.status}\n     Tlp : ${item.phone}`).join('\n');
  };

  const generateAttendanceMessage = () => {
    const formattedDate = formatTanggalIndo(attendanceData.tanggal);
    const greeting = 'Semangat Pagii.....!!!';

    return `${greeting}
T2 Safety & Security Electronic Services

Dinas     : ${attendanceData.shift}
Hari      : ${formattedDate}

Personel API T2 :
${formatPersonnelList(attendanceData.apiList)}

Personel OM IAS T2 :
${formatPersonnelList(attendanceData.omList)}

Tlp Ruangan :
${attendanceData.tlpRuangan}

Rencana kegiatan harian :
${attendanceData.rencanaKegiatan}

Terima Kasih !!!`;
  };

  const fallbackShare = async (message, hasUnsharedPhotos) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(message);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = message; document.body.appendChild(textArea); textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsCopied(true); setTimeout(() => setIsCopied(false), 2500);
      if (hasUnsharedPhotos) {
        alert("Perangkat ini tidak mendukung pengiriman foto secara otomatis. Teks laporan telah dicopy. Silakan 'Paste' di WhatsApp dan lampirkan foto Anda secara manual.");
      }
    } catch (err) { 
      console.error("Gagal menyalin teks", err); 
    }
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const executeShare = async (message, customFilesArray = null) => {
    let filesArray = [];
    if (customFilesArray !== null) {
      filesArray = customFilesArray;
    } else {
      if (photos.length > 1 && collageFile) filesArray = [collageFile];
      else if (photos.length === 1) filesArray = [photos[0].file];
    }

    try {
      if (filesArray.length > 0 && navigator.canShare && navigator.canShare({ files: filesArray })) {
        await navigator.share({ files: filesArray, title: 'Laporan SSES T2', text: message });
        setIsCopied(true); setTimeout(() => setIsCopied(false), 2500);
        return;
      } else if (filesArray.length === 0 && navigator.share) {
        await navigator.share({ title: 'Laporan SSES T2', text: message });
        setIsCopied(true); setTimeout(() => setIsCopied(false), 2500);
        return;
      }
    } catch (err) {
      console.error("Share dibatalkan atau gagal", err);
      if (err.name === 'AbortError') return;
    }
    
    fallbackShare(message, filesArray.length > 0);
  };

  const GOOGLE_SHEETS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbz191pL-SZ4Zv7FguTY-AfhyShFau3Gt3G5l2ZQfA7FZV8HLx4X3baJhIh50z30Qbcs/exec';

  const handleRepairSubmit = async (e) => {
    e.preventDefault();
    if (!formData.peralatan) { alert("Harap pilih peralatan terlebih dahulu!"); return; }
    if (photos.length > 1 && isGeneratingCollage) { alert("Kolase foto sedang diproses, mohon tunggu sebentar..."); return; }
    
    // Background sync to Google Sheets
    try {
      let imageBase64 = "";
      if (photos.length > 1 && collageFile) {
        // Kolase sudah dikompres oleh canvas, langsung baca
        imageBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(collageFile);
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
        });
      } else if (photos.length === 1) {
        // Foto tunggal dari kamera bisa sangat besar — resize dulu via canvas
        imageBase64 = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const MAX_DIM = 1200;
            let w = img.width, h = img.height;
            if (w > MAX_DIM || h > MAX_DIM) {
              const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
              w = Math.round(w * ratio);
              h = Math.round(h * ratio);
            }
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.75));
          };
          img.onerror = reject;
          img.src = URL.createObjectURL(photos[0].file);
        });
      }

      const payload = {
        teknisi: formData.teknisi,
        lokasi: formData.lokasi1 + (formData.lokasi2 ? ' - ' + formData.lokasi2 : ''),
        peralatan: formData.peralatan,
        waktu: formData.waktuMulai + ' - ' + formData.waktuSelesai,
        detailPerbaikan: 'Permasalahan : ' + formData.permasalahan + '\n\nTindak lanjut : ' + formData.tindakLanjut,
        status: formData.status,
        imageBase64: imageBase64
      };
      
      fetch(GOOGLE_SHEETS_WEBAPP_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload)
      }).catch(err => console.error("Google Sheets sync error:", err));
    } catch(err) {
      console.error("Payload prep error:", err);
    }

    executeShare(generateRepairMessage());
  };

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    const validApi = attendanceData.apiList.filter(r => r.name !== '');
    if (validApi.length === 0) { alert('Minimal wajib untuk diisi 1 personel API T2'); return; }
    executeShare(generateAttendanceMessage());
  };

  const handleReset = () => {
    if (activeTab === 'perbaikan') {
      setFormData({
        peralatan: '', lokasi1: '', lokasi2: '', sumberLaporan: 'Avsec', indikasiAwal: '',
        tanggal: new Date().toISOString().split('T')[0], waktuMulai: '', waktuSelesai: '',
        lamaPengerjaan: '', teknisi: '', permasalahan: '• ', tindakLanjut: '• ', status: 'Pekerjaan Selesai'
      });
      setIsVerifikasiETD(false);
    } else if (activeTab === 'kehadiran') {
      const currentHour = new Date().getHours();
      const isPagi = currentHour >= 8 && currentHour < 20;
      const shiftValue = isPagi ? 'Pagi, 08.00 - 20.00 WIB' : 'Malam, 20.00 - 08.00 WIB';
      const rowCount = isPagi ? 4 : 2;
      const kegiatan = isPagi 
        ? '- Monitoring Ops\n- Storing Peralatan\n- Preventive Maintenance & Kalibrasi Perangkat' 
        : '- Monitoring Ops\n- Storing Peralatan';

      setAttendanceData({
        tanggal: new Date().toISOString().split('T')[0], shift: shiftValue, apiList: createEmptyRows(rowCount),
        omList: createEmptyRows(rowCount), tlpRuangan: '- 021 550 5910', rencanaKegiatan: kegiatan
      });
    } else if (activeTab === 'briefing') {
      const currentHour = new Date().getHours();
      const isPagi = currentHour >= 8 && currentHour < 20;
      setBriefingData({
        jenis: 'Unit', tanggal: new Date().toISOString().split('T')[0], shift: isPagi ? 'Pagi' : 'Malam', lokasi: 'Terminal 2'
      });
    } else if (activeTab === 'storing') {
      setStoringData({
        tanggal: new Date().toISOString().split('T')[0], waktuMulai: '', waktuSelesai: '',
        peralatan: [], lokasi: '', nomor: '', hasil: 'Normal Operasi'
      });
    } else if (activeTab === 'checklist') {
      setChecklistData({
        tanggal: new Date().toISOString().split('T')[0], 
        waktuMulai: '', 
        waktuSelesai: ''
      });
      setToggles({}); 
      setExpandedAreas({});
    } else if (activeTab === 'kalibrasi') {
      setKalibrasiGlobal({
        tanggal: new Date().toISOString().split('T')[0], waktuMulai: '', waktuSelesai: ''
      });
      setKalibrasiEntries([createEmptyKalibrasiEntry()]);
      
      kalibrasiPhotoGroups.forEach(g => {
        g.photos.forEach(p => URL.revokeObjectURL(p.preview));
        if (g.collageUrl) URL.revokeObjectURL(g.collageUrl);
      });
      setKalibrasiPhotoGroups([{ id: Date.now(), photos: [], collageUrl: null, collageFile: null, isGenerating: false }]);
    }
    
    setIsCopied(false);
    photos.forEach(photo => URL.revokeObjectURL(photo.preview));
    setPhotos([]); setCollageUrl(null); setCollageFile(null);

    setIsResetting(true);
    setTimeout(() => setIsResetting(false), 2000);
  };

  // === RENDER BERSAMA (PHOTO SECTION KECUALI KALIBRASI) ===
  const renderPhotoSection = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 gap-2">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" /> Lampiran Foto
        </h2>
        <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
          <Move className="w-3 h-3" /> Geser foto untuk urutkan
        </span>
      </div>
      <div>
        <label className="flex items-center justify-center w-full p-6 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors group">
          <div className="flex flex-col items-center gap-2 text-center">
            <ImagePlus className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-blue-700">Pilih / Ambil Foto</span>
            <span className="text-xs text-blue-500">Galeri, File, atau Kamera langsung</span>
          </div>
          <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
        </label>
      </div>

      {photos.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-500 mb-2">Foto Terpilih ({photos.length}):</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {photos.map((photo, index) => (
              <div 
                key={photo.id} 
                data-photo-index={index}
                data-list-type="general"
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handlePhotoDrop(e, index)}
                onTouchStart={(e) => {
                  if (e.touches.length === 1) {
                    window.touchDragState = { type: 'general', index: index, startX: e.touches[0].clientX, startY: e.touches[0].clientY, isDragging: false };
                  }
                }}
                onTouchMove={(e) => {
                  if (window.touchDragState && e.touches.length === 1) {
                    if (Math.abs(e.touches[0].clientY - window.touchDragState.startY) > 10 || Math.abs(e.touches[0].clientX - window.touchDragState.startX) > 10) {
                       window.touchDragState.isDragging = true;
                    }
                  }
                }}
                onTouchEnd={(e) => {
                  if (window.touchDragState && window.touchDragState.isDragging && window.touchDragState.type === 'general') {
                    const touch = e.changedTouches[0];
                    const elem = document.elementFromPoint(touch.clientX, touch.clientY);
                    const target = elem?.closest('[data-list-type="general"]');
                    if (target) {
                      const targetIdx = parseInt(target.getAttribute('data-photo-index'), 10);
                      if (!isNaN(targetIdx) && targetIdx !== window.touchDragState.index) {
                        const mockEvent = { preventDefault: () => {}, dataTransfer: { getData: () => window.touchDragState.index.toString() } };
                        handlePhotoDrop(mockEvent, targetIdx);
                      }
                    }
                  }
                  window.touchDragState = null;
                }}
                className="relative group aspect-square rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm bg-slate-100 cursor-move hover:border-blue-400 transition-colors touch-pan-y"
                title="Tahan & Geser untuk mengubah urutan"
              >
                {/* Image Preview with Zoom transform mapping the canvas representation */}
                <div className="w-full h-full flex items-center justify-center bg-slate-800 overflow-hidden">
                  <img 
                    src={photo.preview} 
                    alt={`Preview ${index}`} 
                    className="w-full h-full object-cover transition-transform duration-200" 
                    style={{ transform: `scale(${photo.zoom || 1})` }}
                  />
                </div>

                <button type="button" onClick={() => removePhoto(index)} className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 opacity-90 hover:opacity-100 transition-opacity shadow-md z-10">
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Overlay Zoom Controls */}
                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between items-center bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button type="button" onClick={(e) => { e.stopPropagation(); updatePhotoZoom(index, -0.1); }} className="text-white hover:text-blue-300 font-bold px-2 py-0.5 text-lg leading-none">-</button>
                  <span className="text-white text-[11px] font-medium">{Math.round((photo.zoom || 1) * 100)}%</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); updatePhotoZoom(index, 0.1); }} className="text-white hover:text-blue-300 font-bold px-2 py-0.5 text-lg leading-none">+</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {photos.length > 1 && (
        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-blue-600" /> Kolase Otomatis (Akan dibagikan)
          </p>
          {isGeneratingCollage ? (
            <div className="flex flex-col items-center justify-center p-8 bg-blue-50 rounded-xl border border-blue-100 animate-pulse">
              <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mb-2" />
              <p className="text-sm text-blue-600 font-medium">Memproses kolase...</p>
            </div>
          ) : collageUrl ? (
            <div className="relative rounded-xl overflow-hidden border-4 border-white shadow-md bg-white">
              <img src={collageUrl} alt="Kolase Laporan" className="w-full h-auto rounded-lg" />
            </div>
          ) : null}
        </div>
      )}
      <p className="text-xs text-slate-500 italic mt-4">
        *Catatan: Tombol "Share Perbaikan ke WA" akan mencoba membagikan foto/kolase beserta teks otomatis. Jika browser tidak mendukung, teks akan disalin dan foto dilampirkan manual.
      </p>
    </div>
  );

  // === RENDER KALIBRASI MULTI KOLASE KHUSUS ===
  const renderKalibrasiPhotoSection = () => (
    <div className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-2">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" /> Lampiran Foto
        </h2>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded w-fit">Kirim multi kolase sekaligus</span>
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1"><Move className="w-3 h-3" /> Geser foto untuk urutkan</span>
        </div>
      </div>
      
      <div className="space-y-6">
        {kalibrasiPhotoGroups.map((group, groupIndex) => (
          <div key={group.id} className="p-4 sm:p-5 bg-blue-50/30 border border-blue-100 rounded-xl space-y-4 relative shadow-sm">
            
            {/* Group Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div className="flex-1 w-full">
                <h3 className="font-bold text-blue-900 text-sm">Grup Kolase {groupIndex + 1}</h3>
              </div>
              {kalibrasiPhotoGroups.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeKalibrasiPhotoGroup(group.id)} 
                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-1 self-end sm:self-center text-sm font-bold"
                >
                  <Trash2 className="w-4 h-4" /> <span className="sm:hidden">Hapus Grup</span>
                </button>
              )}
            </div>

            {/* Upload Input */}
            <div>
              <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-blue-300 rounded-xl bg-white hover:bg-blue-50 cursor-pointer transition-colors group">
                <div className="flex items-center gap-3">
                  <Camera className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-blue-700">Tambah Foto ke Kolase Ini</span>
                </div>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleKalibrasiPhotoUpload(group.id, e)} />
              </label>
            </div>

            {/* Photos Preview */}
            {group.photos.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Daftar Foto ({group.photos.length}):</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {group.photos.map((photo, pIndex) => (
                    <div 
                      key={photo.id} 
                      data-kalibrasi-index={pIndex}
                      data-group-id={group.id}
                      data-list-type="kalibrasi"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', pIndex)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleKalibrasiPhotoDrop(e, group.id, pIndex)}
                      onTouchStart={(e) => {
                        if (e.touches.length === 1) {
                          window.touchDragState = { type: 'kalibrasi', index: pIndex, groupId: group.id, startX: e.touches[0].clientX, startY: e.touches[0].clientY, isDragging: false };
                        }
                      }}
                      onTouchMove={(e) => {
                        if (window.touchDragState && e.touches.length === 1) {
                          if (Math.abs(e.touches[0].clientY - window.touchDragState.startY) > 10 || Math.abs(e.touches[0].clientX - window.touchDragState.startX) > 10) {
                             window.touchDragState.isDragging = true;
                          }
                        }
                      }}
                      onTouchEnd={(e) => {
                        if (window.touchDragState && window.touchDragState.isDragging && window.touchDragState.type === 'kalibrasi') {
                          const touch = e.changedTouches[0];
                          const elem = document.elementFromPoint(touch.clientX, touch.clientY);
                          const target = elem?.closest('[data-list-type="kalibrasi"]');
                          if (target) {
                            const targetIdx = parseInt(target.getAttribute('data-kalibrasi-index'), 10);
                            const targetGroup = target.getAttribute('data-group-id');
                            if (targetGroup === window.touchDragState.groupId.toString() && !isNaN(targetIdx) && targetIdx !== window.touchDragState.index) {
                              const mockEvent = { preventDefault: () => {}, dataTransfer: { getData: () => window.touchDragState.index.toString() } };
                              handleKalibrasiPhotoDrop(mockEvent, group.id, targetIdx);
                            }
                          }
                        }
                        window.touchDragState = null;
                      }}
                      className="relative group aspect-square rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm bg-slate-100 cursor-move hover:border-blue-400 transition-colors touch-pan-y"
                      title="Tahan & Geser untuk mengubah urutan"
                    >
                      <div className="w-full h-full flex items-center justify-center bg-slate-800 overflow-hidden">
                        <img 
                          src={photo.preview} 
                          alt={`Preview ${pIndex}`} 
                          className="w-full h-full object-cover transition-transform duration-200" 
                          style={{ transform: `scale(${photo.zoom || 1})` }}
                        />
                      </div>

                      <button type="button" onClick={() => removeKalibrasiPhoto(group.id, pIndex)} className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 opacity-90 hover:opacity-100 transition-opacity shadow-md z-10">
                        <X className="w-3.5 h-3.5" />
                      </button>

                      {/* Overlay Zoom Controls */}
                      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between items-center bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button type="button" onClick={(e) => { e.stopPropagation(); updateKalibrasiPhotoZoom(group.id, pIndex, -0.1); }} className="text-white hover:text-blue-300 font-bold px-2 py-0.5 text-lg leading-none">-</button>
                        <span className="text-white text-[11px] font-medium">{Math.round((photo.zoom || 1) * 100)}%</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); updateKalibrasiPhotoZoom(group.id, pIndex, 0.1); }} className="text-white hover:text-blue-300 font-bold px-2 py-0.5 text-lg leading-none">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collage Preview */}
            {group.photos.length > 1 && (
              <div className="mt-4 border-t border-blue-100 pt-4">
                <p className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-blue-600" /> Hasil Kolase {groupIndex + 1}
                </p>
                {group.isGenerating ? (
                  <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-slate-200 animate-pulse">
                    <RefreshCw className="w-5 h-5 text-blue-500 animate-spin mb-2" />
                    <p className="text-xs text-blue-600 font-medium">Memproses kolase...</p>
                  </div>
                ) : group.collageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-white shadow-sm bg-white max-w-sm mx-auto">
                    <img src={group.collageUrl} alt="Kolase" className="w-full h-auto rounded-lg" />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>

      <button 
        type="button" 
        onClick={addKalibrasiPhotoGroup} 
        className="w-full border-2 border-dashed border-slate-300 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50 hover:border-blue-400 hover:text-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" /> Tambah Kolase Baru (Misal: Untuk Peralatan Lain)
      </button>
      
      <p className="text-xs text-slate-500 italic mt-2 text-center">
        *Grup yang memiliki 2 foto atau lebih akan otomatis digabungkan. Semua kolase akan dikirim bersamaan ke WA.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 flex items-center justify-center font-sans">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* === HEADER BERSAMA === */}
        <div className="bg-blue-800 px-6 py-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {activeTab === 'perbaikan' ? <Wrench className="text-white w-7 h-7" /> : activeTab === 'kehadiran' ? <ClipboardList className="text-white w-7 h-7" /> : activeTab === 'briefing' ? <Megaphone className="text-white w-7 h-7" /> : activeTab === 'storing' ? <Box className="text-white w-7 h-7" /> : activeTab === 'checklist' ? <CheckSquare className="text-white w-7 h-7" /> : activeTab === 'tip' ? <AlertTriangle className="text-white w-7 h-7" /> : <Settings className="text-white w-7 h-7" />}
              <div>
                <h1 className="text-xl font-bold text-white">Laporan SSES T2</h1>
                <p className="text-blue-200 text-sm">Otomatisasi Kirim ke WhatsApp</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              disabled={isResetting}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                isResetting ? 'bg-emerald-500 text-white shadow-md' : 'bg-blue-700 text-blue-100 hover:bg-blue-600 hover:text-white'
              }`}
            >
              {isResetting ? <><Check className="w-4 h-4 animate-pulse" /> Di-reset!</> : <><RefreshCw className="w-4 h-4" /> Reset</>}
            </button>
          </div>
          
          {activeTab === 'perbaikan' && (
            <div className="flex items-center gap-2 border-t border-blue-700 pt-3">
              <input type="checkbox" id="verifikasiETD" checked={isVerifikasiETD} onChange={handleVerifikasiChange} className="w-4 h-4 text-blue-500 bg-white border-none rounded focus:ring-2 focus:ring-blue-400 cursor-pointer" />
              <label htmlFor="verifikasiETD" className="text-sm font-semibold text-blue-100 cursor-pointer select-none">
                Verifikasi ETD
              </label>
            </div>
          )}
        </div>

        {/* === TAB NAVIGATION === */}
        <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-200">
          <button 
            onClick={() => switchTab('perbaikan')} 
            className={`py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-b border-slate-200 ${
              activeTab === 'perbaikan' ? 'shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <Wrench className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="truncate w-full text-center">Perbaikan</span>
          </button>
          <button 
            onClick={() => switchTab('kehadiran')} 
            className={`py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-b border-slate-200 ${
              activeTab === 'kehadiran' ? 'shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <Users className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="truncate w-full text-center">Kehadiran</span>
          </button>
          <button 
            onClick={() => switchTab('briefing')} 
            className={`py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-b border-slate-200 ${
              activeTab === 'briefing' ? 'shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <Megaphone className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="truncate w-full text-center">Briefing</span>
          </button>
          <button 
            onClick={() => switchTab('storing')} 
            className={`py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-b border-slate-200 ${
              activeTab === 'storing' ? 'shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <Box className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="truncate w-full text-center">Storing</span>
          </button>
          
          <button 
            onClick={() => switchTab('checklist')} 
            className={`py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-slate-200 ${
              activeTab === 'checklist' ? 'shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="truncate w-full text-center">Checklist</span>
          </button>
          <button 
            onClick={() => switchTab('kalibrasi')} 
            className={`py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-slate-200 ${
              activeTab === 'kalibrasi' ? 'shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <Settings className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="truncate w-full text-center">Kalibrasi</span>
          </button>
          <button 
            onClick={() => switchTab('tip')} 
            className={`py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-slate-200 ${
              activeTab === 'tip' ? 'shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="truncate w-full text-center">TIP</span>
          </button>
          <button 
            onClick={() => switchTab('cam')} 
            className={`py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
              activeTab === 'cam' ? 'shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <CameraIcon className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="truncate w-full text-center">Cam</span>
          </button>
        </div>

        {}
        {/* ======================================================== */}
        {/* ================= TAB 1: PERBAIKAN ===================== */}
        {/* ======================================================== */}
        {activeTab === 'perbaikan' && (
          <>
            <div className="bg-blue-50/50 px-6 py-5 border-b border-slate-200">
              <label className="block text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-600" /> Pilihan Peralatan
              </label>
              <select required value={formData.peralatan} onChange={handlePeralatanChange} className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-medium shadow-sm cursor-pointer appearance-none">
                <option value="">-- Pilih Peralatan --</option>
                <option value="X-Ray Rapiscan 620DV">X-Ray Rapiscan 620DV</option>
                <option value="X-Ray Rapiscan 628DV">X-Ray Rapiscan 628DV</option>
                <option value="X-Ray Rapiscan Orion 920DV">X-Ray Rapiscan Orion 920DV</option>
                <option value="X-Ray Nuctech CX100100D">X-Ray Nuctech CX100100D</option>
                <option value="X-Ray Nuctech CX6040D">X-Ray Nuctech CX6040D</option>
                <option value="X-Ray Smith Heiman HS 100100-2is">X-Ray Smith Heiman HS 100100-2is</option>
                <option value="X-Ray Smith Heiman HS 6040-2is">X-Ray Smith Heiman HS 6040-2is</option>
                <option value="WTMD CEIA">WTMD CEIA</option>
                <option value="HHMD">HHMD</option>
                <option value="ETD Leidos QS-B220">ETD Leidos QS-B220</option>
                <option value="Body Scanner Leidos Provision 2">Body Scanner Leidos Provision 2</option>
                <option value="Access Control">Access Control</option>
                <option value="ATRS">ATRS</option>
                <option value="Extension Conveyor">Extension Conveyor</option>
              </select>
            </div>

            <form onSubmit={handleRepairSubmit} className="p-6 sm:p-8 space-y-8">
              {/* Form Laporan */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" /> Informasi Laporan
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                        <select name="lokasi1" required value={formData.lokasi1} onChange={handleRepairChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                          <option value="">- Pilih Area -</option>
                          {lokasi1OptionsPerbaikan.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                      <div className="w-1/3">
                        <select name="lokasi2" value={formData.lokasi2} onChange={handleRepairChange} disabled={getLokasi2Options(formData.lokasi1, [formData.peralatan]).length === 0} className={`w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none ${getLokasi2Options(formData.lokasi1, [formData.peralatan]).length === 0 ? 'opacity-50 cursor-not-allowed bg-slate-200' : ''}`}>
                          <option value="">- No -</option>
                          {getLokasi2Options(formData.lokasi1, [formData.peralatan]).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Sumber Laporan</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                      <input type="text" name="sumberLaporan" required value={formData.sumberLaporan} onChange={handleRepairChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Indikasi Awal</label>
                    <textarea name="indikasiAwal" required={!isVerifikasiETD} disabled={isVerifikasiETD} rows="2" placeholder="Cth: Mesin tidak menyala..." value={formData.indikasiAwal} onChange={handleRepairChange} className={`w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none ${isVerifikasiETD ? 'opacity-60 cursor-not-allowed bg-slate-200 text-slate-500' : ''}`}></textarea>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2">
                  <Clock className="w-5 h-5 text-blue-600" /> Waktu & Pelaksana
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                      <input type="date" name="tanggal" required value={formData.tanggal} onChange={handleRepairChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pukul Mulai</label>
                    <input type="time" name="waktuMulai" required value={formData.waktuMulai} onChange={handleRepairChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pukul Selesai</label>
                    <input type="time" name="waktuSelesai" required value={formData.waktuSelesai} onChange={handleRepairChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lama Pengerjaan</label>
                    <input type="text" name="lamaPengerjaan" required readOnly placeholder="Terisi otomatis..." value={formData.lamaPengerjaan} className="w-full px-4 py-2 bg-slate-200 border border-slate-300 rounded-lg outline-none cursor-not-allowed text-slate-600 font-medium select-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Teknisi</label>
                    <input type="text" name="teknisi" required placeholder="Nama Teknisi" value={formData.teknisi} onChange={handleRepairChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" /> Detail Pengerjaan
                </h2>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Permasalahan</label>
                  <textarea name="permasalahan" required rows="3" value={formData.permasalahan} onChange={(e) => handleBulletChange(e, 'permasalahan')} onKeyDown={(e) => handleBulletKeyDown(e, 'permasalahan')} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm leading-relaxed"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tindak Lanjut</label>
                  <textarea name="tindakLanjut" required rows="6" value={formData.tindakLanjut} onChange={(e) => handleBulletChange(e, 'tindakLanjut')} onKeyDown={(e) => handleBulletKeyDown(e, 'tindakLanjut')} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm leading-relaxed"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleRepairChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                    <option value="Pekerjaan Selesai">Pekerjaan Selesai</option>
                    <option value="On Progress">On Progress</option>
                    <option value="Menunggu Sparepart">Menunggu Sparepart</option>
                    <option value="Perlu Eskalasi Lanjut">Perlu Eskalasi Lanjut</option>
                  </select>
                </div>
              </div>

              {renderPhotoSection()}

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button type="submit" className={`w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${isCopied ? 'bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]' : 'bg-[#25D366] hover:bg-[#20b858] hover:shadow-xl hover:-translate-y-0.5 text-white'}`}>
                  {isCopied ? <><CheckCircle className="w-6 h-6 animate-pulse" /> Berhasil Disalin / Dibagikan!</> : <><Share2 className="w-6 h-6" /> Share Perbaikan ke WA</>}
                </button>
              </div>

              <div className="mt-8 border-t border-slate-200 pt-8">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" /> Preview Laporan Perbaikan (Real-time)
                </h3>
                <div className="bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative">
                  <div className="bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%]">
                    {generateRepairMessage()}
                  </div>
                </div>
              </div>
            </form>
          </>
        )}

        {}
        {/* ======================================================== */}
        {/* =============== TAB 2: KEHADIRAN KARYAWAN ============== */}
        {/* ======================================================== */}
        {activeTab === 'kehadiran' && (
          <form onSubmit={handleAttendanceSubmit} className="p-6 sm:p-8 space-y-8">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2">
                <Users className="w-5 h-5 text-blue-600" /> Info Shift
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
                    <div key={row.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                      <select value={row.name} onChange={(e) => handleRowChange('apiList', index, 'name', e.target.value)} className="w-full sm:w-2/5 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                        <option value="">- Pilih Personel -</option>
                        {availableOptions.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
                      </select>
                      <input type="text" value={row.phone} readOnly placeholder="No Telepon" className="w-full sm:w-1/4 px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm text-slate-500 outline-none cursor-not-allowed" />
                      <select value={row.status} onChange={(e) => handleRowChange('apiList', index, 'status', e.target.value)} className="w-full sm:w-1/4 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
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
                  <Plus className="w-4 h-4" /> Tambah Personel API T2
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
                    <div key={row.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                      <select value={row.name} onChange={(e) => handleRowChange('omList', index, 'name', e.target.value)} className="w-full sm:w-2/5 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-emerald-500 appearance-none">
                        <option value="">- Pilih Personel -</option>
                        {availableOptions.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
                      </select>
                      <input type="text" value={row.phone} readOnly placeholder="No Telepon" className="w-full sm:w-1/4 px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm text-slate-500 outline-none cursor-not-allowed" />
                      <select value={row.status} onChange={(e) => handleRowChange('omList', index, 'status', e.target.value)} className="w-full sm:w-1/4 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-emerald-500 appearance-none">
                        <option value="Hadir">Hadir</option>
                        <option value="Izin">Izin</option>
                        <option value="Sakit">Sakit</option>
                        <option value="Dinas Luar">Dinas Luar</option>
                      </select>
                      <button type="button" onClick={() => removeRow('omList', index)} className="w-full sm:w-auto p-2 bg-rose-100 text-rose-600 rounded-md hover:bg-rose-200 flex justify-center items-center transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}
                <button type="button" onClick={() => addRow('omList')} className="text-sm font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 mt-2">
                  <Plus className="w-4 h-4" /> Tambah Personel OM IAS T2
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
                  <textarea name="rencanaKegiatan" required rows="4" value={attendanceData.rencanaKegiatan} onChange={(e) => handleDashChange(e, 'rencanaKegiatan')} onKeyDown={(e) => handleDashKeyDown(e, 'rencanaKegiatan')} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm leading-relaxed"></textarea>
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
              <button type="submit" className={`w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${isCopied ? 'bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]' : 'bg-[#25D366] hover:bg-[#20b858] hover:shadow-xl hover:-translate-y-0.5 text-white'}`}>
                {isCopied ? <><CheckCircle className="w-6 h-6 animate-pulse" /> Berhasil Disalin / Dibagikan!</> : <><Share2 className="w-6 h-6" /> Share Kehadiran ke WA</>}
              </button>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-8">
              <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> Preview Laporan Kehadiran (Real-time)
              </h3>
              <div className="bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative">
                <div className="bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%]">
                  {generateAttendanceMessage()}
                </div>
              </div>
            </div>
          </form>
        )}

        {}
        {/* ======================================================== */}
        {/* ================== TAB 3: BRIEFING ===================== */}
        {/* ======================================================== */}
        {activeTab === 'briefing' && (
          <form onSubmit={handleBriefingSubmit} className="p-6 sm:p-8 space-y-8">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2">
                <Megaphone className="w-5 h-5 text-blue-600" /> Detail Briefing
              </h2>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Jenis Briefing</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl flex-1 hover:bg-blue-50 transition-colors">
                      <input type="radio" name="jenis" value="Unit" checked={briefingData.jenis === 'Unit'} onChange={handleBriefingChange} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm font-semibold text-slate-700">Briefing Unit SSES T2</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl flex-1 hover:bg-blue-50 transition-colors">
                      <input type="radio" name="jenis" value="MOT" checked={briefingData.jenis === 'MOT'} onChange={handleBriefingChange} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm font-semibold text-slate-700">Briefing MOT T2</span>
                    </label>
                  </div>
                  
                  {briefingData.jenis === 'MOT' && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 animate-fadeIn shadow-sm">
                      <div className="p-2 bg-white text-blue-600 rounded-lg shrink-0 border border-blue-100 shadow-sm">
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm text-slate-700 font-bold block mb-0.5">Link Absensi :</span>
                        <a 
                          href="https://bit.ly/4h3EYMY?r=qr" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline break-all"
                        >
                          https://bit.ly/4h3EYMY?r=qr
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {renderPhotoSection()}

            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <input type="date" name="tanggal" required value={briefingData.tanggal} onChange={handleBriefingChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shift</label>
                  <select name="shift" value={briefingData.shift} onChange={handleBriefingChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer">
                    <option value="Pagi">Pagi</option>
                    <option value="Malam">Malam</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <input type="text" name="lokasi" required value={briefingData.lokasi} onChange={handleBriefingChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button type="submit" className={`w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${isCopied ? 'bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]' : 'bg-[#25D366] hover:bg-[#20b858] hover:shadow-xl hover:-translate-y-0.5 text-white'}`}>
                {isCopied ? <><CheckCircle className="w-6 h-6 animate-pulse" /> Berhasil Disalin / Dibagikan!</> : <><Share2 className="w-6 h-6" /> Share Briefing ke WA</>}
              </button>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-8">
              <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> Preview Laporan Briefing (Real-time)
              </h3>
              <div className="bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative">
                <div className="bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%]">
                  {generateBriefingMessage()}
                </div>
              </div>
            </div>
          </form>
        )}

        {}
        {/* ======================================================== */}
        {/* ================== TAB 4: STORING ====================== */}
        {/* ======================================================== */}
        {activeTab === 'storing' && (
          <form onSubmit={handleStoringSubmit} className="p-6 sm:p-8 space-y-8">
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center border-b pb-2">
                  <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Box className="w-5 h-5 text-blue-600" /> Detail Kegiatan Storing
                  </h2>
                </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <input type="date" name="tanggal" required value={storingData.tanggal} onChange={handleStoringChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jam Mulai</label>
                  <input type="time" name="waktuMulai" required value={storingData.waktuMulai} onChange={handleStoringChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jam Selesai</label>
                  <input type="time" name="waktuSelesai" required value={storingData.waktuSelesai} onChange={handleStoringChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Peralatan <span className="text-xs text-slate-400">(Bisa pilih lebih dari 1)</span></label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {storingEquipments.map(equip => {
                      const isACChecked = storingData.peralatan.includes('Access Control');
                      const isChecked = storingData.peralatan.includes(equip);
                      const isDisabled = isACChecked && equip !== 'Access Control';

                      return (
                        <label 
                          key={equip} 
                          className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                            isChecked ? 'bg-blue-50 border-blue-500 shadow-sm' : 
                            isDisabled ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed' : 'bg-white border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => handleStoringEquipToggle(equip)}
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                          />
                          <span className={`ml-2 text-sm font-medium ${isDisabled ? 'text-slate-400' : 'text-slate-700'}`}>
                            {equip}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                      <select 
                        name="lokasi" 
                        required 
                        value={storingData.lokasi} 
                        onChange={handleStoringChange} 
                        disabled={storingData.peralatan.length === 0}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none disabled:bg-slate-200 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <option value="">- Pilih Area -</option>
                        {getStoringValidLocations(storingData.peralatan).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>

                    {storingData.peralatan.includes('Access Control') && (storingData.lokasi.includes('Avio') || storingData.lokasi.includes('Rampout')) && (
                      <div className="w-1/3 relative">
                        <Hash className="absolute left-2.5 top-2.5 h-5 w-5 text-slate-400" />
                        <select 
                          name="nomor" 
                          required 
                          value={storingData.nomor} 
                          onChange={handleStoringChange} 
                          className="w-full pl-9 pr-2 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                        >
                          <option value="">- No -</option>
                          {getStoringValidNumbers(storingData.lokasi).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hasil</label>
                  <div className="relative">
                    <AlertCircle className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <input type="text" name="hasil" required value={storingData.hasil} onChange={handleStoringChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                  </div>
                </div>
              </div>
            </div>

            {renderPhotoSection()}

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button type="submit" className={`w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${isCopied ? 'bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]' : 'bg-[#25D366] hover:bg-[#20b858] hover:shadow-xl hover:-translate-y-0.5 text-white'}`}>
                {isCopied ? <><CheckCircle className="w-6 h-6 animate-pulse" /> Berhasil Disalin / Dibagikan!</> : <><Share2 className="w-6 h-6" /> Share Storing ke WA</>}
              </button>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-8">
              <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> Preview Laporan Storing (Real-time)
              </h3>
              <div className="bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative">
                <div className="bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%]">
                  {generateStoringMessage()}
                </div>
              </div>
            </div>
          </form>
        )}

        {}
        {/* ======================================================== */}
        {/* ================== TAB CHECKLIST ======================= */}
        {/* ======================================================== */}
        {activeTab === 'checklist' && (
          <form onSubmit={handleChecklistSubmit} className="p-4 sm:p-8 space-y-8 bg-slate-50/50">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-4">
                <Clock className="w-5 h-5 text-blue-600" /> Waktu Pelaksanaan Checklist
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <input type="date" name="tanggal" required value={checklistData.tanggal} onChange={handleChecklistChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jam Mulai</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <input type="time" name="waktuMulai" required value={checklistData.waktuMulai} onChange={handleChecklistChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jam Selesai</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <input type="time" name="waktuSelesai" required value={checklistData.waktuSelesai} onChange={handleChecklistChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <button type="submit" className={`w-full font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-300 transform ${isCopied ? 'bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]' : 'bg-[#25D366] hover:bg-[#20b858] hover:-translate-y-0.5 text-white'}`}>
                {isCopied ? <><CheckCircle className="w-6 h-6 animate-pulse" /> Checklist Berhasil Disalin!</> : <><Share2 className="w-6 h-6" /> Share Checklist ke WA</>}
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 gap-2">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2">
                  <CheckSquare className="w-5 h-5 text-blue-600" /> Daftar Peralatan & Status
                </h2>
                <div className="flex gap-4 text-xs font-medium">
                  <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-1 rounded"><Check className="w-3 h-3"/> Operasi</span>
                  <span className="flex items-center gap-1 text-red-700 bg-red-100 px-2 py-1 rounded"><X className="w-3 h-3"/> Off</span>
                </div>
              </div>
              
              <div className="space-y-6">
                {checklistDataMaster.map((block, bIdx) => {
                  if (block.type === 'location') {
                    return (
                      <div key={`loc-${bIdx}`} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div 
                          onClick={() => toggleArea(block.title)}
                          className="bg-slate-100 p-4 border-b border-slate-200 font-bold text-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-200 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-slate-500" /> {block.title}
                          </div>
                          {expandedAreas[block.title] ? <ChevronUp className="w-5 h-5 text-slate-500"/> : <ChevronDown className="w-5 h-5 text-slate-500"/>}
                        </div>
                        {expandedAreas[block.title] && (
                          <div className="p-4 space-y-6">
                            {block.categories.map((cat, cIdx) => (
                              <div key={`cat-${cIdx}`}>
                                <h3 className="text-sm font-bold text-blue-900 mb-3 bg-blue-50 px-3 py-1.5 rounded inline-block">{cat.title}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {cat.items.map((item, iIdx) => {
                                    const key = `${block.title}|${cat.title}|${iIdx}`;
                                    const isOperasi = toggles[key] !== false;
                                    return (
                                      <div key={`item-${iIdx}`} onClick={() => toggleChecklistItem(key)} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all select-none shadow-sm hover:-translate-y-0.5 ${isOperasi ? 'bg-emerald-50/50 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400' : 'bg-red-50 border-red-300 hover:bg-red-100 hover:border-red-400'}`}>
                                        <span className={`text-sm font-semibold ${isOperasi ? 'text-emerald-900' : 'text-red-900'}`}>{item}</span>
                                        <button type="button" className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-colors shadow-sm ${isOperasi ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                          {isOperasi ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  } else if (block.type === 'group') {
                    return (
                      <div key={`grp-${bIdx}`} className="space-y-6">
                        {block.locations.map((loc, lIdx) => (
                          <div key={`gloc-${lIdx}`} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <div 
                              onClick={() => toggleArea(loc.title)}
                              className="bg-slate-100 p-4 border-b border-slate-200 font-bold text-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-200 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-slate-500" /> {loc.title}
                              </div>
                              {expandedAreas[loc.title] ? <ChevronUp className="w-5 h-5 text-slate-500"/> : <ChevronDown className="w-5 h-5 text-slate-500"/>}
                            </div>
                            {expandedAreas[loc.title] && (
                              <div className="p-4 space-y-6">
                                {loc.categories.map((cat, cIdx) => (
                                  <div key={`gcat-${cIdx}`}>
                                    <h3 className="text-sm font-bold text-blue-900 mb-3 bg-blue-50 px-3 py-1.5 rounded inline-block">{cat.title}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {cat.items.map((item, iIdx) => {
                                        const key = `${loc.title}|${cat.title}|${iIdx}`;
                                        const isOperasi = toggles[key] !== false;
                                        return (
                                          <div key={`gitem-${iIdx}`} onClick={() => toggleChecklistItem(key)} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all select-none shadow-sm hover:-translate-y-0.5 ${isOperasi ? 'bg-emerald-50/50 border-emerald-300 hover:bg-emerald-100' : 'bg-red-50 border-red-300 hover:bg-red-100'}`}>
                                            <span className={`text-sm font-semibold ${isOperasi ? 'text-emerald-900' : 'text-red-900'}`}>{item}</span>
                                            <button type="button" className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-colors shadow-sm ${isOperasi ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                              {isOperasi ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  } else if (block.type === 'access_control') {
                    return (
                      <div key={`ac-${bIdx}`} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div 
                          onClick={() => toggleArea(block.title)}
                          className="bg-slate-800 p-4 border-b border-slate-700 font-bold text-white flex items-center justify-between cursor-pointer hover:bg-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Cpu className="w-5 h-5 text-slate-300" /> {block.title}
                          </div>
                          {expandedAreas[block.title] ? <ChevronUp className="w-5 h-5 text-slate-300"/> : <ChevronDown className="w-5 h-5 text-slate-300"/>}
                        </div>
                        {expandedAreas[block.title] && (
                          <div className="p-4 space-y-8">
                            {block.terminals.map((term, tIdx) => (
                              <div key={`term-${tIdx}`} className="space-y-4">
                                {term.title && <h3 className="text-base font-bold text-slate-800 border-b pb-2">{term.title}</h3>}
                                <div className="space-y-6 pl-0 md:pl-4">
                                  {term.categories.map((cat, cIdx) => (
                                    <div key={`tcat-${cIdx}`}>
                                      <h4 className="text-sm font-bold text-indigo-900 mb-3 bg-indigo-50 px-3 py-1.5 rounded inline-block">{cat.title}</h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {cat.items.map((item, iIdx) => {
                                          const key = `${block.title}|${term.title}|${cat.title}|${iIdx}`;
                                          const isOperasi = toggles[key] !== false;
                                          return (
                                            <div key={`titem-${iIdx}`} onClick={() => toggleChecklistItem(key)} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all select-none shadow-sm hover:-translate-y-0.5 ${isOperasi ? 'bg-emerald-50/50 border-emerald-300 hover:bg-emerald-100' : 'bg-red-50 border-red-300 hover:bg-red-100'}`}>
                                              <span className={`text-sm font-semibold ${isOperasi ? 'text-emerald-900' : 'text-red-900'}`}>{item}</span>
                                              <button type="button" className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-colors shadow-sm ${isOperasi ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                                {isOperasi ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8 sticky bottom-6 z-10">
              <button type="submit" className={`w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-2xl transition-all duration-300 transform ${isCopied ? 'bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]' : 'bg-[#25D366] hover:bg-[#20b858] hover:-translate-y-1 text-white border-4 border-white'}`}>
                {isCopied ? <><CheckCircle className="w-6 h-6 animate-pulse" /> Checklist Berhasil Disalin!</> : <><Share2 className="w-6 h-6" /> Share Checklist ke WA</>}
              </button>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-8">
              <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> Preview Laporan Checklist (Real-time)
              </h3>
              <div className="bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative">
                <div className="bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%] max-h-[500px] overflow-y-auto">
                  {generateChecklistMessage()}
                </div>
              </div>
            </div>
          </form>
        )}

        {}
        {/* ======================================================== */}
        {/* ================== TAB 5: KALIBRASI ==================== */}
        {/* ======================================================== */}
        {activeTab === 'kalibrasi' && (
          <form onSubmit={handleKalibrasiSubmit} className="p-4 sm:p-8 space-y-8 bg-slate-50/50">
            
            {/* GLOBAL KALIBRASI SETTINGS */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-4">
                <Clock className="w-5 h-5 text-blue-600" /> Waktu Pelaksanaan Kalibrasi
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <input type="date" name="tanggal" required value={kalibrasiGlobal.tanggal} onChange={handleKalibrasiGlobalChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pukul Mulai</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <input type="time" name="waktuMulai" required value={kalibrasiGlobal.waktuMulai} onChange={handleKalibrasiGlobalChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pukul Selesai</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <input type="time" name="waktuSelesai" required value={kalibrasiGlobal.waktuSelesai} onChange={handleKalibrasiGlobalChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* DYNAMIC ENTRIES LOOP */}
            <div className="space-y-6">
              {kalibrasiEntries.map((entry, index) => {
                const kalibrasiLok1Opts = entry.peralatan.length > 0 
                  ? getIntersectedLocations(entry.peralatan, entry.xrayModel) 
                  : [];

                return (
                  <div key={entry.id} className="bg-white border-2 border-blue-100 rounded-2xl p-5 sm:p-6 space-y-6 shadow-sm relative">
                    <div className="flex justify-between items-center border-b border-blue-100 pb-3">
                      <h3 className="font-extrabold text-lg text-blue-900 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-500" /> Lokasi Kalibrasi #{index + 1}
                      </h3>
                      {kalibrasiEntries.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeKalibrasiEntry(index)} 
                          className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" /> Hapus
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          <Cpu className="w-4 h-4 inline-block text-blue-500 mr-1" /> Peralatan <span className="text-xs text-slate-400 font-normal">(Pilih 1 atau lebih)</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {['X-Ray', 'WTMD', 'Body Scanner', 'HHMD', 'ETD', 'Access Control'].map(equip => {
                            const isACChecked = entry.peralatan.includes('Access Control');
                            const isChecked = entry.peralatan.includes(equip);
                            const isDisabled = isACChecked && equip !== 'Access Control';
                            
                            return (
                              <label 
                                key={equip} 
                                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                                  isChecked ? 'bg-blue-50 border-blue-500 shadow-sm font-semibold' : 
                                  isDisabled ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed' : 
                                  'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  disabled={isDisabled}
                                  onChange={() => handleKalibrasiEquipToggle(index, equip)}
                                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                                />
                                <span className={`ml-2 text-sm ${isDisabled ? 'text-slate-400' : 'text-slate-700'}`}>{equip}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Area / Lokasi{entry.peralatan.includes('Access Control') && <span className="text-xs text-slate-400 font-normal"> (Pilih 1 atau lebih)</span>}</label>
                        {entry.peralatan.includes('Access Control') ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {getGeneralLokasiOptions('Access Control').map(loc => {
                              const isChecked = (entry.acLokasi || []).includes(loc);
                              return (
                                <label
                                  key={loc}
                                  className={`flex items-center p-2.5 border rounded-lg cursor-pointer transition-colors ${
                                    isChecked ? 'bg-blue-50 border-blue-500 shadow-sm font-semibold' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleKalibrasiAcLokasiToggle(index, loc)}
                                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-slate-700">{loc}</span>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                            <select
                              name="lokasi1"
                              required
                              value={entry.lokasi1}
                              onChange={(e) => handleKalibrasiEntryChange(index, e)}
                              disabled={kalibrasiLok1Opts.length === 0}
                              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none disabled:bg-slate-200 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                              <option value="">{kalibrasiLok1Opts.length === 0 ? '- Pilih Peralatan Dulu -' : '- Pilih Area -'}</option>
                              {kalibrasiLok1Opts.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </div>
                          <div className="w-1/3">
                            <select name="lokasi2" value={entry.lokasi2} onChange={(e) => handleKalibrasiEntryChange(index, e)} disabled={getLokasi2Options(entry.lokasi1, entry.peralatan).length === 0} className={`w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none ${getLokasi2Options(entry.lokasi1, entry.peralatan).length === 0 ? 'opacity-50 cursor-not-allowed bg-slate-200' : ''}`}>
                              <option value="">- No -</option>
                              {getLokasi2Options(entry.lokasi1, entry.peralatan).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </div>
                        </div>
                        )}
                      </div>
                    </div>

                    {/* Dynamic Configurations based on selected equipments */}
                    {entry.peralatan.includes('X-Ray') && (
                      <div className="bg-blue-50/40 p-4 sm:p-5 rounded-xl border border-blue-200 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-200 pb-3">
                          <h3 className="font-bold text-blue-900 flex items-center gap-2">
                            ⚡ Parameter X-Ray
                          </h3>
                          <select name="xrayModel" value={entry.xrayModel} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-blue-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
                            {getValidXRayModels(entry.lokasi1).map(model => (
                              <option key={model} value={model}>
                                {model === 'Semua X-Ray' ? '-- Semua Model X-Ray --' : model.replace('X-Ray ', '')}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div><label className="block text-xs font-semibold text-slate-600 mb-1">kV Vertikal</label><input type="text" inputMode="decimal" name="xrayKvV" value={entry.xrayKvV} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" /></div>
                          <div><label className="block text-xs font-semibold text-slate-600 mb-1">kV Horizontal</label><input type="text" inputMode="decimal" name="xrayKvH" value={entry.xrayKvH} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" /></div>
                          <div><label className="block text-xs font-semibold text-slate-600 mb-1">mA Vertikal</label><input type="text" inputMode="decimal" name="xrayMaV" value={entry.xrayMaV} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" /></div>
                          <div><label className="block text-xs font-semibold text-slate-600 mb-1">mA Horizontal</label><input type="text" inputMode="decimal" name="xrayMaH" value={entry.xrayMaH} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" /></div>
                          <div><label className="block text-xs font-semibold text-slate-600 mb-1">Ontime Vertikal</label><input type="text" inputMode="decimal" name="xrayOnV" value={entry.xrayOnV} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" /></div>
                          <div><label className="block text-xs font-semibold text-slate-600 mb-1">Ontime Horizontal</label><input type="text" inputMode="decimal" name="xrayOnH" value={entry.xrayOnH} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" /></div>
                          <div className="col-span-2"><label className="block text-xs font-semibold text-slate-600 mb-1">Archive</label><input type="text" name="xrayArchive" value={entry.xrayArchive} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" /></div>
                        </div>
                      </div>
                    )}

                    {entry.peralatan.includes('WTMD') && (
                      <div className="bg-indigo-50/40 p-4 sm:p-5 rounded-xl border border-indigo-200 space-y-4">
                        <h3 className="font-bold text-indigo-900 flex items-center gap-2 border-b border-indigo-200 pb-2">
                          🎛️ Parameter WTMD (WTMD CEIA)
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                          <div><label className="block text-xs font-semibold text-slate-600 mb-1">Z1</label><input type="text" inputMode="numeric" name="wtmdZ1" value={entry.wtmdZ1} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
                          <div><label className="block text-xs font-semibold text-slate-600 mb-1">Z2</label><input type="text" inputMode="numeric" name="wtmdZ2" value={entry.wtmdZ2} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
                          <div><label className="block text-xs font-semibold text-slate-600 mb-1">Z3</label><input type="text" inputMode="numeric" name="wtmdZ3" value={entry.wtmdZ3} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
                          <div><label className="block text-xs font-semibold text-slate-600 mb-1">Z4</label><input type="text" inputMode="numeric" name="wtmdZ4" value={entry.wtmdZ4} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
                          <div><label className="block text-xs font-semibold text-slate-600 mb-1">LC</label><input type="text" inputMode="numeric" name="wtmdLc" value={entry.wtmdLc} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
                          <div><label className="block text-xs font-semibold text-slate-600 mb-1">LS</label><input type="text" inputMode="numeric" name="wtmdLs" value={entry.wtmdLs} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
                          <div><label className="block text-xs font-semibold text-slate-600 mb-1">UC</label><input type="text" inputMode="numeric" name="wtmdUc" value={entry.wtmdUc} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
                          <div><label className="block text-xs font-semibold text-slate-600 mb-1">SE</label><input type="text" inputMode="numeric" name="wtmdSe" value={entry.wtmdSe} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
                          <div><label className="block text-xs font-semibold text-slate-600 mb-1">DS</label><input type="text" inputMode="numeric" name="wtmdDs" value={entry.wtmdDs} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
                        </div>
                      </div>
                    )}

                    {entry.peralatan.includes('Body Scanner') && (
                      <div className="bg-emerald-50/40 p-4 sm:p-5 rounded-xl border border-emerald-200 space-y-4">
                        <h3 className="font-bold text-emerald-900 flex items-center gap-2 border-b border-emerald-200 pb-2">
                          🔍 Parameter Body Scanner (Leidos Prov 2)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Test Tampilan Suspect Item</label>
                            <select name="bsSuspect" value={entry.bsSuspect} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500">
                              <option value="Normal">Normal</option><option value="Error">Error</option><option value="Perlu Penyetelan">Perlu Penyetelan</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Test Monitor</label>
                            <select name="bsMonitor" value={entry.bsMonitor} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500">
                              <option value="Normal">Normal</option><option value="Error">Error</option><option value="Perlu Penyetelan">Perlu Penyetelan</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Test Fungsi Scanning</label>
                            <select name="bsScanning" value={entry.bsScanning} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500">
                              <option value="Normal">Normal</option><option value="Error">Error</option><option value="Perlu Penyetelan">Perlu Penyetelan</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Test Fungsi Kalibrasi</label>
                            <select name="bsCalibration" value={entry.bsCalibration} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500">
                              <option value="Normal">Normal</option><option value="Error">Error</option><option value="Perlu Penyetelan">Perlu Penyetelan</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {entry.peralatan.includes('ETD') && (
                      <div className="bg-amber-50/40 p-4 sm:p-5 rounded-xl border border-amber-200 space-y-4">
                        <h3 className="font-bold text-amber-900 flex items-center gap-2 border-b border-amber-200 pb-2">
                          🧪 Parameter ETD (Leidos QS-B220)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Sampling Test TNT</label>
                            <select name="etdTnt" value={entry.etdTnt} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-amber-500">
                              <option value="Alarm">Alarm</option><option value="Tidak Alarm">Tidak Alarm</option><option value="Error">Error</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Sampling Test PETN</label>
                            <select name="etdPetn" value={entry.etdPetn} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-amber-500">
                              <option value="Alarm">Alarm</option><option value="Tidak Alarm">Tidak Alarm</option><option value="Error">Error</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Sampling Test RDX</label>
                            <select name="etdRdx" value={entry.etdRdx} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-amber-500">
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
                          <select name="acEmlock" value={entry.acEmlock} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-rose-500">
                            <option value="Berfungsi">Berfungsi</option>
                            <option value="Tidak Berfungsi">Tidak Berfungsi</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Fungsi Intercom</label>
                          <select name="acIntercom" value={entry.acIntercom} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-rose-500">
                            <option value="Berfungsi">Berfungsi</option>
                            <option value="Tidak Berfungsi">Tidak Berfungsi</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Fungsi Fingerprint</label>
                          <select name="acFingerprint" value={entry.acFingerprint} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-rose-500">
                            <option value="Berfungsi">Berfungsi</option>
                            <option value="Tidak Berfungsi">Tidak Berfungsi</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Fungsi CCTV</label>
                          <select name="acCctv" value={entry.acCctv} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-rose-500">
                            <option value="Berfungsi">Berfungsi</option>
                            <option value="Tidak Berfungsi">Tidak Berfungsi</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Fungsi Pengontrolan Kunci Pintu</label>
                          <select name="acPengontrolan" value={entry.acPengontrolan} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-rose-500">
                            <option value="Berfungsi">Berfungsi</option>
                            <option value="Tidak Berfungsi">Tidak Berfungsi</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Record CCTV</label>
                          <input type="text" name="acRecordCctv" value={entry.acRecordCctv} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-rose-500" />
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

            {/* Tombol Tambah Lokasi */}
            <button 
              type="button" 
              onClick={addKalibrasiEntry} 
              className="w-full border-2 border-dashed border-blue-400 text-blue-700 font-bold py-4 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 mt-4"
            >
              <Plus className="w-5 h-5" /> Tambah Lokasi Kalibrasi Berikutnya
            </button>

            {renderKalibrasiPhotoSection()}

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button type="submit" className={`w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${isCopied ? 'bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]' : 'bg-[#25D366] hover:bg-[#20b858] hover:-translate-y-0.5 text-white'}`}>
                {isCopied ? <><CheckCircle className="w-6 h-6 animate-pulse" /> Berhasil Disalin / Dibagikan!</> : <><Share2 className="w-6 h-6" /> Share Kalibrasi ke WA</>}
              </button>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-8">
              <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> Preview Laporan Kalibrasi (Real-time)
              </h3>
              <div className="bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative">
                <div className="bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%] max-h-[500px] overflow-y-auto">
                  {generateKalibrasiMessage()}
                </div>
              </div>
            </div>
          </form>
        )}

        {}
        {/* ======================================================== */}
        {/* ======================= TAB 6: TIP ===================== */}
        {/* ======================================================== */}
        {activeTab === 'tip' && (
          <div className="p-4 sm:p-8 space-y-6 bg-slate-50/50">
            
            {/* Filter Panel */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Bulan</label>
                  <select 
                    value={tipMonth} 
                    onChange={(e) => setTipMonth(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer font-semibold text-slate-700"
                  >
                    {TIP_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tahun</label>
                  <input 
                    type="number" 
                    value={tipYear} 
                    onChange={(e) => setTipYear(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700"
                  />
                </div>
              </div>
              
              <div className="w-full md:w-64 bg-slate-100 p-3 rounded-lg border border-slate-200">
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                  <span>Progress Selesai</span>
                  <span className="text-blue-700">{getTipCheckedCount()} / {TIP_TOTAL_ITEMS}</span>
                </div>
                <div className="w-full bg-slate-300 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.round((getTipCheckedCount() / TIP_TOTAL_ITEMS) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap gap-3 items-center justify-end bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <button 
                type="button"
                onClick={handleTipToggleAll}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors border border-slate-300 text-sm"
              >
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                Checklist / Uncheck Semua
              </button>
              
              <div className="flex gap-3 w-full sm:w-auto">
                <button 
                  type="button"
                  onClick={handleTipSave}
                  disabled={!tipUnsavedChanges}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 font-bold rounded-lg transition-all text-sm ${
                    tipUnsavedChanges 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Save className="w-4 h-4" /> Simpan Progres
                </button>
                
                <button 
                  type="button"
                  onClick={handleTipShare}
                  disabled={tipUnsavedChanges || isGeneratingTipImage}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 font-bold rounded-lg transition-all text-sm ${
                    !tipUnsavedChanges && !isGeneratingTipImage
                      ? 'bg-[#25D366] hover:bg-[#20b858] text-white shadow-md' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isGeneratingTipImage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />} 
                  Share TIP ke WA
                </button>
              </div>
            </div>

            {/* Export Area (Tabel Utama) */}
            <div className="overflow-x-hidden bg-slate-100 rounded-xl p-2 sm:p-4 pb-8">
              <div id="tip-export-area" className="w-full mx-auto bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                
                {/* Header Export */}
                <div className="text-center mb-8">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 uppercase tracking-wide">
                    T2 TIP PERFORMANCE {tipMonth} {tipYear}
                  </h1>
                  <p className="text-slate-500 italic mt-2 text-sm sm:text-base">
                    {tipLastSaved ? `Terakhir disimpan: ${tipLastSaved}` : 'Belum ada data yang disimpan pada periode ini.'}
                  </p>
                </div>

                {/* Tabel Layout: Vertikal di Aplikasi, Bersebelahan saat di-Export */}
                <div id="tip-export-grid" className="flex flex-col gap-6">
                  <div>
                    {renderTipTable(tipLeftCol)}
                  </div>
                  <div>
                    {renderTipTable(tipRightCol)}
                  </div>
                </div>

              </div>
            </div>

            <p className="text-xs text-slate-500 text-center italic mt-2">
              * Tombol Bagikan (WA) hanya akan aktif jika Anda sudah menyimpan (klik tombol Simpan) perubahan terbaru.
            </p>

          </div>
        )}

        {}
        {/* ======================================================== */}
        {/* ======================= TAB CAM ======================== */}
        {/* ======================================================== */}
        {activeTab === 'cam' && (
          <div className="p-4 sm:p-6 space-y-6 bg-slate-900 min-h-[500px] flex flex-col items-center">
            
            <div className="w-full max-w-lg relative bg-black rounded-2xl overflow-hidden aspect-[3/4] shadow-2xl flex items-center justify-center">
              
              {camError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-800 z-20">
                  <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
                  <p className="text-white font-bold mb-2">Akses Kamera Gagal</p>
                  <p className="text-slate-400 text-sm">{camError}</p>
                  <button onClick={startCamera} className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Coba Lagi
                  </button>
                </div>
              ) : (
                <>
                  {/* Live Video Feed */}
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    className={`w-full h-full object-cover transition-transform ${camFacingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                  ></video>

                  {/* Flash Overlay */}
                  {isFlash && (
                    <div className="absolute inset-0 bg-white z-50 opacity-80 animate-pulse"></div>
                  )}

                  {/* Gradient Background (Meningkatkan keterbacaan teks watermark) */}
                  <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none z-10"></div>

                  {/* Overlay Grid Line & Real-time Watermark Preview */}
                  <div className="absolute inset-0 pointer-events-none z-20">
                    <div className="w-full h-full border border-white/20 grid grid-cols-3 grid-rows-3">
                      {[...Array(9)].map((_, i) => <div key={i} className="border border-white/10"></div>)}
                    </div>
                    
                    <div className="absolute bottom-4 left-4 right-4 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] flex flex-col justify-end">
                      <div className="flex items-center gap-3 mb-1.5">
                        {/* Waktu Real-time */}
                        <span className="text-5xl sm:text-6xl font-['Impact'] tracking-wide leading-none">
                          {liveTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')}
                        </span>
                        {/* Garis Pemisah Oranye */}
                        <div className="w-1.5 h-10 sm:h-12 bg-amber-500 rounded-sm"></div>
                        {/* Tanggal & Hari Real-time */}
                        <div className="flex flex-col text-xs sm:text-sm font-sans leading-tight justify-center">
                          <span>{liveTime.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                          <span>{liveTime.toLocaleDateString('id-ID', { weekday: 'long' })}</span>
                        </div>
                      </div>
                      
                      {/* Lokasi */}
                      <p className="text-xs sm:text-sm font-sans truncate pr-20 opacity-90">
                        {camLocation.address || camLocation.error || 'Mencari lokasi akurat...'}
                      </p>
                      
                      {/* Label pojok kanan bawah */}
                      <p className="text-[10px] text-amber-400 absolute bottom-0 right-0 font-sans">Timemark 100% Akurat</p>
                    </div>
                  </div>
                </>
              )}

              {/* Hidden Canvas for saving the image */}
              <canvas ref={canvasRef} className="hidden"></canvas>
            </div>

            {/* Camera Controls */}
            <div className="flex items-center justify-center w-full max-w-lg gap-8 mt-4">
              <button 
                type="button"
                onClick={toggleCamera}
                className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors border border-slate-600"
                title="Tukar Kamera Depan/Belakang"
              >
                <RefreshCcw className="w-6 h-6" />
              </button>
              
              <button 
                type="button"
                onClick={capturePhoto}
                className="w-20 h-20 bg-white border-[6px] border-slate-400 rounded-full flex items-center justify-center hover:bg-slate-200 hover:border-blue-400 hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,255,255,0.4)] active:scale-95"
                title="Ambil & Simpan Foto"
              >
                <div className="w-14 h-14 bg-white border border-slate-200 rounded-full shadow-inner"></div>
              </button>

              <div className="w-[56px] h-[56px]">
                {/* Spacer to balance the toggle button */}
              </div>
            </div>

            <p className="text-slate-400 text-xs text-center mt-6 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Foto akan otomatis memiliki watermark lokasi & waktu, lalu tersimpan ke perangkat Anda.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}