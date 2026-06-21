import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import React, { useState, useEffect, Suspense, lazy } from "react";
import { Users, Loader2, Calendar, User, X, Plus, ClipboardList, CheckCircle, Share2, FileText, Camera, Move, ImagePlus, Cpu, MapPin, Clock, AlertCircle, Box, Hash, Trash2, LayoutGrid, ZoomIn, ZoomOut, CheckSquare, Save, RefreshCw, Square, Check, Lock, ChevronUp, ChevronDown, Megaphone, FileSpreadsheet, AlertTriangle, Settings, ChevronRight, ArrowUp, ArrowDown, Edit2, Database, Layers, Mail, KeyRound, LogOut, Wrench } from "lucide-react";
import { create } from "zustand";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
const useAppStore = create((set) => ({
  activeTab: "perbaikan",
  setActiveTab: (tab) => set({ activeTab: tab }),
  isCopied: false,
  setIsCopied: (val) => set({ isCopied: val })
}));
const toTitleCase = (str) => {
  if (!str) return "";
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};
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
].map((p) => ({ ...p, name: toTitleCase(p.name) }));
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
].map((p) => ({ ...p, name: toTitleCase(p.name) }));
const DEFAULT_STORING_EQUIPMENTS = ["Access Control", "X-Ray", "HHMD", "ETD", "WTMD", "Body Scanner"];
const DEFAULT_STORING_LOC_AC = [
  "Avio & BL D",
  "Avio & BL E",
  "Avio & BL F",
  "Rampout D",
  "Rampout E",
  "Rampout F",
  "Breakdown D, E1, E2 & F",
  "Breakdown Umrah",
  "Ruang Monitoring E1",
  "Server Access",
  "HBSCP Umrah"
];
const DEFAULT_STORING_LOC_DEFAULT = [
  "PSCP D",
  "PSCP E",
  "PSCP F",
  "PSCP Umroh",
  "SSCP E",
  "SSCP F",
  "HBSCP 1.1 -1.6",
  "HBSCP 2.1-2.6",
  "HBSCP Umrah"
];
const DEFAULT_CHECKLIST_DATA = [
  {
    type: "location",
    title: "PSCP D",
    summary: "TOTAL PERALATAN PSCP & TRANSFER DESK D",
    categories: [
      { title: "A. X-RAY", summaryKey: "X-RAY", items: ["X-Ray Rapiscan 620DV (No1)", "X-Ray Smith Heiman HS 6040-2is (No2)", "X-Ray Rapiscan 620DV (No3)", "X-Ray Rapiscan 620DV (No4)", "X-Ray Rapiscan 620DV (No5)"] },
      { title: "B. WTMD", summaryKey: "WTMD", items: ["WTMD CEIA HI/PE Multizone (No1)", "WTMD CEIA HI/PE Multizone (No3)", "WTMD CEIA HI/PE Multizone (No4)", "WTMD CEIA HI/PE Multizone (No5)", "WTMD CEIA HI/PE Multizone (Transfer Desk D)"] },
      { title: "C. BODY SCANNER", summaryKey: "BODY SCANNER", items: ["Body Scanner Leidos Provision 2 (No2)"] },
      { title: "D. EXPLOSIVE DETECTOR", summaryKey: "ETD", items: ["ETD Leidos QS-B220"] }
    ]
  },
  {
    type: "location",
    title: "PSCP E",
    summary: "TOTAL PERALATAN PSCP & TRANSFER DESK E",
    categories: [
      { title: "A. X-RAY", summaryKey: "X-RAY", items: ["X-Ray Rapiscan 620DV (No1)", "X-Ray Rapiscan 620DV (No2)", "X-Ray Rapiscan 620DV (No3)", "X-Ray Rapiscan 620DV (No4)", "X-Ray Rapiscan 620DV (No5)"] },
      { title: "B. WTMD", summaryKey: "WTMD", items: ["WTMD CEIA HI/PE Multizone (No1)", "WTMD CEIA HI/PE Multizone (No3)", "WTMD CEIA HI/PE Multizone (No4)", "WTMD CEIA HI/PE Multizone (Transfer Desk E)"] },
      { title: "C. BODY SCANNER", summaryKey: "BODY SCANNER", items: ["Body Scanner Leidos Provision 2 (No2)", "Body Scanner Leidos Provision 2 (No5)"] },
      { title: "D. EXPLOSIVE DETECTOR", summaryKey: "ETD", items: ["ETD Leidos QS-B220"] }
    ]
  },
  {
    type: "location",
    title: "PSCP F",
    summary: "TOTAL PERALATAN PSCP F",
    categories: [
      { title: "A. X-RAY", summaryKey: "X-RAY", items: ["X-Ray Rapiscan 620DV (No1)", "X-Ray Rapiscan Orion 920DV (No2)", "X-Ray Rapiscan 620DV (No3)", "X-Ray Rapiscan 620DV (No4)"] },
      { title: "B. WTMD", summaryKey: "WTMD", items: ["WTMD CEIA HI/PE Multizone (No1)", "WTMD CEIA HI/PE Multizone (No2)", "WTMD CEIA HI/PE Multizone (No3)", "WTMD CEIA HI/PE Multizone (No4)"] },
      { title: "C. BODY SCANNER", summaryKey: "BODY SCANNER", items: ["Body Scanner Leidos Provision 2 (No1)", "Body Scanner Leidos Provision 2 (No2)"] },
      { title: "D. EXPLOSIVE DETECTOR", summaryKey: "ETD", items: ["ETD Leidos QS-B220"] }
    ]
  },
  {
    type: "location",
    title: "PSCP UMROH",
    summary: "TOTAL PERALATAN PSCP UMROH",
    categories: [
      { title: "A. X-RAY", summaryKey: "X-RAY", items: ["X-Ray Nuctech CX6040D (No1)", "X-Ray Nuctech CX6040D (No2)", "X-Ray Rapiscan 620DV (No3)", "X-Ray Rapiscan 620DV (No4)", "X-Ray Rapiscan 620DV (No5)", "X-Ray Rapiscan 620DV (No6)"] },
      { title: "B. WTMD", summaryKey: "WTMD", items: ["WTMD CEIA HI/PE Multizone (No1)", "WTMD CEIA HI/PE Multizone (No2)", "WTMD CEIA HI/PE Multizone (No3)", "WTMD CEIA HI/PE Multizone (No4)", "WTMD CEIA HI/PE Multizone (No5)", "WTMD CEIA HI/PE Multizone (No6)", "WTMD CEIA HI/PE Multizone (No7)"] },
      { title: "C. BODY SCANNER", summaryKey: "BODY SCANNER", items: ["Body Scanner Leidos Provision 2 (No3)", "Body Scanner Leidos Provision 2 (No5)", "Body Scanner Leidos Provision 2 (No7)"] },
      { title: "D. EXPLOSIVE DETECTOR", summaryKey: "ETD", items: ["ETD Leidos QS-B220"] }
    ]
  },
  {
    type: "location",
    title: "SSCP E",
    summary: "TOTAL PERALATAN SSCP E",
    categories: [
      { title: "A. X-RAY", summaryKey: "X-RAY", items: ["X-Ray Smith Heiman HS 6040-2is"] },
      { title: "B. WTMD", summaryKey: "WTMD", items: ["WTMD CEIA HI-PE Multizone"] }
    ]
  },
  {
    type: "location",
    title: "SSCP F",
    summary: "TOTAL PERALATAN SSCP F",
    categories: [
      { title: "A. X-RAY", summaryKey: "X-RAY", items: ["X-Ray Rapiscan 620 DV"] },
      { title: "B. WTMD", summaryKey: "WTMD", items: ["WTMD CEIA HI-PE Multizone"] }
    ]
  },
  {
    type: "location",
    title: "HBSCP",
    summary: "TOTAL PERALATAN HBSCP",
    categories: [
      { title: "A. X-RAY", summaryKey: "X-RAY", items: ["X-Ray Rapiscan 628DV (1.1)", "X-Ray Nuctech CX100100D (1.2)", "X-Ray Rapiscan 628DV  (1.3)", "X-Ray Rapiscan 628DV (1.4)", "X-Ray Rapiscan 628DV (1.5)", "X-Ray Rapiscan 628DV  (1.6)", "X-Ray Nuctech CX100100D (2.1)", "X-Ray Rapiscan 628DV  (2.2)", "X-Ray Rapiscan 628DV (2.3)", "X-Ray Rapiscan 628DV (2.4)", "X-Ray Nuctech CX100100D (2.5)", "X-Ray Rapiscan 628DV  (2.6)", "X-Ray Rapiscan 628DV (2.7)", "X-Ray Rapiscan 628DV (2.8)"] },
      { title: "B. EXPLOSIVE DETECTOR", summaryKey: "ETD", items: ["ETD Leidos QS-B220"] }
    ]
  },
  {
    type: "access_control",
    title: "ACCESS CONTROL",
    summary: "TOTAL PERALATAN ACCESS CONTROL",
    terminals: [
      {
        title: "TERMINAL D",
        categories: [
          { title: "AVIOBRIDGE", items: ["Pintu Avio D1", "Pintu Avio D2", "Pintu Avio D3", "Pintu Avio D4", "Pintu Avio D5", "Pintu Avio D6", "Pintu Avio D7"] },
          { title: "RAMPOUT", items: ["Pintu Rampout D2", "Pintu Rampout D4", "Pintu Rampout D6"] },
          { title: "BOARDING LOUNGE", items: ["Pintu BL D1", "Pintu BL D2", "Pintu BL D3", "Pintu BL D4", "Pintu BL D5", "Pintu BL D6", "Pintu BL D7"] }
        ]
      },
      {
        title: "TERMINAL E",
        categories: [
          { title: "AVIOBRIDGE", items: ["Pintu Avio E1", "Pintu Avio E2", "Pintu Avio E3", "Pintu Avio E4", "Pintu Avio E5", "Pintu Avio E6", "Pintu Avio E7"] },
          { title: "RAMPOUT", items: ["Pintu Rampout E2", "Pintu Rampout E4", "Pintu Rampout E6"] },
          { title: "BOARDING LOUNGE", items: ["Pintu BL E1", "Pintu BL E2", "Pintu BL E3", "Pintu BL E4", "Pintu BL E5", "Pintu BL E6", "Pintu BL E7"] }
        ]
      },
      {
        title: "TERMINAL F",
        categories: [
          { title: "AVIOBRIDGE", items: ["Pintu Avio F1", "Pintu Avio F2", "Pintu Avio F3", "Pintu Avio F4", "Pintu Avio F5", "Pintu Avio F6", "Pintu Avio F7"] },
          { title: "RAMPOUT", items: ["Pintu Rampout F1", "Pintu Rampout F2", "Pintu Rampout F3", "Pintu Rampout F4", "Pintu Rampout F5", "Pintu Rampout F6", "Pintu Rampout F7"] },
          { title: "BOARDING LOUNGE", items: ["Pintu BL F1", "Pintu BL F2", "Pintu BL F3", "Pintu BL F4", "Pintu BL F5", "Pintu BL F6", "Pintu BL F7"] }
        ]
      },
      {
        title: "",
        categories: [
          { title: "BREAKDOWN & LIFT", items: ["Pintu Breakdown D", "Pintu Breakdown E1", "Pintu Breakdown E2", "Pintu Breakdown F", "Pintu Breakdown Umroh", "Pintu HBS Umroh", "Pintu Lift Difable D", "Pintu Lift Difable E", "Pintu Lift Difable F", "Pintu Lift Barang D", "Pintu Lift Barang F"] }
        ]
      }
    ]
  }
];
const DEFAULT_TIP_LEFT_COL = [
  { id: "hbscp", name: "HBSCP", items: ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "2.1", "2.2", "2.3", "2.4", "2.5", "2.6"] },
  { id: "hbscp_umroh", name: "HBSCP UMROH", items: ["2.7", "2.8"] },
  { id: "pscp_d", name: "PSCP D", items: ["1", "2", "3", "4", "5"] }
];
const DEFAULT_TIP_RIGHT_COL = [
  { id: "pscp_e", name: "PSCP E", items: ["1", "2", "3", "4", "5"] },
  { id: "pscp_f", name: "PSCP F", items: ["1", "2", "3", "4"] },
  { id: "pscp_umroh", name: "PSCP UMROH", items: ["1", "2", "3", "4", "5", "6", "7"] },
  { id: "sscp", name: "SSCP", items: ["MP E", "MP F"] }
];
const supabaseUrl = "https://mpwemvdedpihlwghdmpa.supabase.co";
const supabaseAnonKey = "sb_publishable_hzu642LG862DRg0HkvdpZQ_3nLdQ2rw";
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const loadMasterData = (key, defaultData) => {
  return defaultData;
};
const saveMasterDataToLocal = (key, data) => {
};
const saveConfigToSupabase = async (key, data) => {
  try {
    const { error } = await supabase.from("master_configs").upsert({ key, value: data, updated_at: (/* @__PURE__ */ new Date()).toISOString() }, { onConflict: "key" });
    if (error) console.error(`Error saving ${key} to Supabase:`, error);
  } catch (err) {
    console.error(`Error saving ${key} to Supabase:`, err);
  }
};
const useMasterDataStore = create((set, get) => ({
  dataApiT2: loadMasterData("master_api_t2", DEFAULT_DATA_API_T2),
  setDataApiT2: (data) => {
    set({ dataApiT2: data });
  },
  dataOmIasT2: loadMasterData("master_om_ias_t2", DEFAULT_DATA_OM_IAS_T2),
  setDataOmIasT2: (data) => {
    set({ dataOmIasT2: data });
  },
  storingEquipments: loadMasterData("master_storing_equip", DEFAULT_STORING_EQUIPMENTS),
  setStoringEquipments: (data) => {
    saveConfigToSupabase("master_storing_equip", data);
    set({ storingEquipments: data });
  },
  storingLocAc: loadMasterData("master_storing_loc_ac", DEFAULT_STORING_LOC_AC),
  setStoringLocAc: (data) => {
    saveConfigToSupabase("master_storing_loc_ac", data);
    set({ storingLocAc: data });
  },
  storingLocDefault: loadMasterData("master_storing_loc_default", DEFAULT_STORING_LOC_DEFAULT),
  setStoringLocDefault: (data) => {
    saveConfigToSupabase("master_storing_loc_default", data);
    set({ storingLocDefault: data });
  },
  checklistDataMaster: loadMasterData("master_checklist", DEFAULT_CHECKLIST_DATA),
  setChecklistDataMaster: (data) => {
    saveConfigToSupabase("master_checklist", data);
    set({ checklistDataMaster: data });
  },
  tipLeftCol: loadMasterData("master_tip_left", DEFAULT_TIP_LEFT_COL),
  setTipLeftCol: (data) => {
    saveConfigToSupabase("master_tip_left", data);
    set({ tipLeftCol: data });
  },
  tipRightCol: loadMasterData("master_tip_right", DEFAULT_TIP_RIGHT_COL),
  setTipRightCol: (data) => {
    saveConfigToSupabase("master_tip_right", data);
    set({ tipRightCol: data });
  },
  penempatanData: [],
  setPenempatanData: (data) => set({ penempatanData: data }),
  jenisPeralatanData: [],
  setJenisPeralatanData: (data) => set({ jenisPeralatanData: data }),
  toggleKalibrasiEquipmentDb: async (id, tampil) => {
    try {
      const { error } = await supabase.from("jenis_peralatan").update({ tampil_di_kalibrasi: tampil }).eq("id", id);
      if (!error) {
        set((state) => ({
          jenisPeralatanData: state.jenisPeralatanData.map((j) => j.id === id ? { ...j, tampil_di_kalibrasi: tampil } : j)
        }));
      } else {
        console.error("Gagal memperbarui config kalibrasi", error);
      }
    } catch (err) {
      console.error(err);
    }
  },
  masterModalOpen: null,
  setMasterModalOpen: (type) => set({ masterModalOpen: type }),
  masterModalData: [],
  setMasterModalData: (data) => set({ masterModalData: data }),
  openMasterModal: (type, currentData) => {
    set({
      masterModalOpen: type,
      masterModalData: JSON.parse(JSON.stringify(currentData))
    });
  },
  closeMasterModal: () => {
    set({
      masterModalOpen: null,
      masterModalData: []
    });
  },
  saveCurrentMasterModal: () => {
    const { masterModalOpen, masterModalData, closeMasterModal } = get();
    switch (masterModalOpen) {
      case "api_t2":
        get().setDataApiT2(masterModalData);
        break;
      case "om_ias_t2":
        get().setDataOmIasT2(masterModalData);
        break;
      case "storing_equip":
        get().setStoringEquipments(masterModalData);
        break;
      case "storing_loc_ac":
        get().setStoringLocAc(masterModalData);
        break;
      case "storing_loc_default":
        get().setStoringLocDefault(masterModalData);
        break;
      case "tip_left":
        get().setTipLeftCol(masterModalData);
        break;
      case "tip_right":
        get().setTipRightCol(masterModalData);
        break;
    }
    closeMasterModal();
  },
  resetCurrentMasterModal: () => {
    if (!window.confirm("Anda yakin ingin mereset data ini ke default bawaan sistem? Data kustom akan hilang.")) return;
    const { masterModalOpen } = get();
    switch (masterModalOpen) {
      case "api_t2":
        set({ masterModalData: DEFAULT_DATA_API_T2 });
        break;
      case "om_ias_t2":
        set({ masterModalData: DEFAULT_DATA_OM_IAS_T2 });
        break;
      case "storing_equip":
        set({ masterModalData: DEFAULT_STORING_EQUIPMENTS });
        break;
      case "storing_loc_ac":
        set({ masterModalData: DEFAULT_STORING_LOC_AC });
        break;
      case "storing_loc_default":
        set({ masterModalData: DEFAULT_STORING_LOC_DEFAULT });
        break;
      case "tip_left":
        set({ masterModalData: DEFAULT_TIP_LEFT_COL });
        break;
      case "tip_right":
        set({ masterModalData: DEFAULT_TIP_RIGHT_COL });
        break;
    }
  },
  handleModalDataChange: (index, field, value) => {
    const { masterModalData, masterModalOpen } = get();
    const newData = [...masterModalData];
    if (field) {
      if (field === "name" && (masterModalOpen === "api_t2" || masterModalOpen === "om_ias_t2")) {
        newData[index][field] = toTitleCase(value);
      } else {
        newData[index][field] = value;
      }
    } else {
      newData[index] = value;
    }
    set({ masterModalData: newData });
  },
  addModalDataRow: () => {
    const { masterModalOpen, masterModalData } = get();
    let newItem;
    if (masterModalOpen === "api_t2" || masterModalOpen === "om_ias_t2") newItem = { name: "", phone: "" };
    else if (masterModalOpen === "storing_equip" || masterModalOpen === "storing_loc_ac" || masterModalOpen === "storing_loc_default" || masterModalOpen === "kalibrasi_equip") newItem = "";
    else if (masterModalOpen === "tip_left" || masterModalOpen === "tip_right") newItem = { id: `new_${Date.now()}`, name: "", items: [] };
    set({ masterModalData: [...masterModalData, newItem] });
  },
  removeModalDataRow: (index) => {
    const { masterModalData } = get();
    const newData = [...masterModalData];
    newData.splice(index, 1);
    set({ masterModalData: newData });
  },
  initializeSupabaseData: async () => {
    try {
      const { data, error } = await supabase.from("penempatan_peralatan").select(`
          id, 
          tipe_peralatan ( nama, varian, jenis_peralatan ( nama ) ),
          lokasi ( nama ),
          titik_lokasi ( nomor )
        `);
      if (error) {
        console.warn("Gagal memuat data Supabase penempatan.", error.message);
      } else if (data && data.length > 0) {
        console.log("✅ Berhasil terhubung ke Supabase! Menemukan", data.length, "data penempatan.");
        set({ penempatanData: data });
      }
      const { data: jenisData, error: jenisError } = await supabase.from("jenis_peralatan").select("id, nama, tampil_di_kalibrasi").order("nama");
      if (!jenisError && jenisData) {
        set({ jenisPeralatanData: jenisData });
      }
      const { data: personelData, error: personelError } = await supabase.from("personel").select(`id, nik, nama, no_hp, unit_kerja(nama)`);
      if (!personelError && personelData) {
        console.log("✅ Berhasil mengambil data personel dari Supabase:", personelData.length);
        const apiT2 = personelData.filter((p) => p.unit_kerja?.nama === "API T2").map((p) => ({ id: p.id, nik: p.nik, name: toTitleCase(p.nama), phone: p.no_hp || "" }));
        const omIasT2 = personelData.filter((p) => p.unit_kerja?.nama === "OM/IAS T2").map((p) => ({ id: p.id, nik: p.nik, name: toTitleCase(p.nama), phone: p.no_hp || "" }));
        if (apiT2.length > 0) get().setDataApiT2(apiT2);
        if (omIasT2.length > 0) get().setDataOmIasT2(omIasT2);
      }
      const { data: configsData, error: configsError } = await supabase.from("master_configs").select("key, value");
      if (!configsError && configsData) {
        console.log("✅ Berhasil memuat master configs dari Supabase:", configsData.length);
        configsData.forEach((config) => {
          saveMasterDataToLocal(config.key, config.value);
          switch (config.key) {
            case "master_checklist":
              set({ checklistDataMaster: config.value });
              break;
            case "master_storing_equip":
              set({ storingEquipments: config.value });
              break;
            case "master_storing_loc_ac":
              set({ storingLocAc: config.value });
              break;
            case "master_storing_loc_default":
              set({ storingLocDefault: config.value });
              break;
            case "master_tip_left":
              set({ tipLeftCol: config.value });
              break;
            case "master_tip_right":
              set({ tipRightCol: config.value });
              break;
          }
        });
      }
    } catch (err) {
      console.warn("Koneksi Supabase belum terkonfigurasi dengan benar.", err);
    }
  }
}));
const getValidModels = (lokasi, jenisPeralatan) => {
  const defaultOption = `Semua ${jenisPeralatan}`;
  const models = [defaultOption];
  if (!lokasi) return models;
  try {
    const penempatanData = useMasterDataStore.getState().penempatanData || [];
    const extractedModels = /* @__PURE__ */ new Set();
    penempatanData.forEach((p) => {
      if (p.lokasi?.nama?.toUpperCase() === lokasi.toUpperCase() && p.tipe_peralatan?.jenis_peralatan?.nama?.toUpperCase() === jenisPeralatan.toUpperCase()) {
        if (p.tipe_peralatan?.nama) {
          extractedModels.add(p.tipe_peralatan.nama);
        }
      }
    });
    if (extractedModels.size > 0) {
      return [defaultOption, ...Array.from(extractedModels)];
    }
  } catch (error) {
    console.warn(`Error reading dynamic ${jenisPeralatan} models from relational data`, error);
  }
  return models;
};
const getValidXRayModels = (lokasi) => {
  return getValidModels(lokasi, "X-Ray");
};
const getGeneralLokasiOptions = (peralatanType) => {
  if (!peralatanType) return [];
  const extractedLocs = /* @__PURE__ */ new Set();
  try {
    const penempatanData = useMasterDataStore.getState().penempatanData || [];
    penempatanData.forEach((p) => {
      const jenisNama = p.tipe_peralatan?.jenis_peralatan?.nama?.toUpperCase() || "";
      const tipeNama = p.tipe_peralatan?.nama?.toUpperCase() || "";
      const target = peralatanType.toUpperCase();
      if (target === "SEMUA X-RAY" || target === "X-RAY") {
        if (jenisNama === "X-RAY") {
          if (p.lokasi?.nama) extractedLocs.add(p.lokasi.nama);
        }
      } else if (tipeNama === target) {
        if (p.lokasi?.nama) extractedLocs.add(p.lokasi.nama);
      } else if (jenisNama === target) {
        if (p.lokasi?.nama) extractedLocs.add(p.lokasi.nama);
      }
    });
  } catch (error) {
    console.warn("Error reading dynamic locations from relational data", error);
  }
  return Array.from(extractedLocs).sort();
};
const getIntersectedLocations = (peralatanArray, models = {}) => {
  if (!peralatanArray || peralatanArray.length === 0) return [];
  let validLocs = null;
  for (const equip of peralatanArray) {
    let currentEquipOpts = [];
    const selectedModel = models[equip];
    if (selectedModel && !selectedModel.startsWith("Semua ")) {
      currentEquipOpts = getGeneralLokasiOptions(selectedModel);
    } else {
      currentEquipOpts = getGeneralLokasiOptions(equip);
    }
    if (validLocs === null) {
      validLocs = [...currentEquipOpts];
    } else {
      validLocs = validLocs.filter((loc) => currentEquipOpts.includes(loc));
    }
    if (validLocs.length === 0) break;
  }
  return validLocs || [];
};
const getLokasi2Options = (lokasi, peralatanArray = []) => {
  if (!lokasi) return [];
  const extractedNumbers = /* @__PURE__ */ new Set();
  try {
    const penempatanData = useMasterDataStore.getState().penempatanData || [];
    penempatanData.forEach((p) => {
      if (p.lokasi?.nama?.toUpperCase() === lokasi.toUpperCase()) {
        if (peralatanArray.length > 0) {
          const jenisNama = p.tipe_peralatan?.jenis_peralatan?.nama;
          const tipeNama = p.tipe_peralatan?.nama;
          if (jenisNama && peralatanArray.includes(jenisNama) || tipeNama && peralatanArray.includes(tipeNama)) {
            if (p.titik_lokasi?.nomor) extractedNumbers.add(p.titik_lokasi.nomor);
          }
        } else {
          if (p.titik_lokasi?.nomor) extractedNumbers.add(p.titik_lokasi.nomor);
        }
      }
    });
  } catch (error) {
    console.warn("Error reading dynamic numbers from relational data", error);
  }
  return Array.from(extractedNumbers).sort((a, b) => {
    const numA = parseInt(a.replace(/[^0-9]/g, ""), 10);
    const numB = parseInt(b.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });
};
const getStoringValidLocations = (equipArray, storingLocAc, storingLocDefault) => {
  if (equipArray.length === 0) return [];
  if (equipArray.includes("Access Control")) return storingLocAc;
  return getIntersectedLocations(equipArray);
};
const getStoringValidNumbers = (lokasi) => {
  if (!lokasi.includes("Avio") && !lokasi.includes("Rampout")) return [];
  if (lokasi === "Rampout D" || lokasi === "Rampout E") return ["2,4,6", "2", "4", "6"];
  if (lokasi === "Rampout F") return ["1-7", "1", "2", "3", "4", "5", "6", "7"];
  if (lokasi === "Avio & BL D" || lokasi === "Avio & BL E" || lokasi === "Avio & BL F") return ["1-7", "1", "2", "3", "4", "5", "6", "7"];
  return ["1", "2", "3", "4", "5", "6", "7"];
};
const formatTanggalIndo = (dateStr) => {
  if (!dateStr) return "";
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const d = new Date(dateStr);
  return `${days[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
};
const generateWA_Perbaikan = (formData, isVerifikasiETD) => {
  if (!formData.peralatan) return "Silakan pilih peralatan terlebih dahulu untuk melihat preview laporan...";
  const dateParts = formData.tanggal ? formData.tanggal.split("-") : ["", "", ""];
  const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : "";
  let lokasiFinal = formData.lokasi1 + (formData.lokasi2 && formData.lokasi2 !== "-" ? formData.peralatan === "Access Control" ? ` ${formData.lokasi2}` : ` No.${formData.lokasi2}` : "");
  const judulLaporan = isVerifikasiETD ? `Laporan Verifikasi ${formData.peralatan}` : `Laporan Perbaikan ${formData.peralatan}`;
  return `${judulLaporan}

Lokasi : ${lokasiFinal}
Sumber laporan : ${formData.sumberLaporan}
${isVerifikasiETD ? "" : `Indikasi awal : ${formData.indikasiAwal}`}

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
  const activeList = list.filter((item) => item.name !== "");
  if (activeList.length === 0) return "- (Kosong)";
  return activeList.map((item) => `- ${item.name} - ${item.status}
     Tlp : ${item.phone}`).join("\n");
};
const generateWA_Kehadiran = (attendanceData) => {
  const formattedDate = formatTanggalIndo(attendanceData.tanggal);
  const greeting = "Semangat Pagii.....!!!";
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

Rencana Kegiatan :
${attendanceData.rencanaKegiatan}`;
};
const generateWA_Briefing = (briefingData) => {
  const formattedDate = formatTanggalIndo(briefingData.tanggal);
  const judul = briefingData.jenis === "Unit" ? "*Giat briefing unit SSES T2*" : "*Briefing MOT T2*";
  return `${judul}
Hari/Tanggal : ${formattedDate}
Shift : ${briefingData.shift}
Lokasi : ${briefingData.lokasi}`;
};
const generateWA_Storing = (storingData) => {
  const formattedDate = formatTanggalIndo(storingData.tanggal);
  const jamMulai = storingData.waktuMulai || "...";
  const jamSelesai = storingData.waktuSelesai || "...";
  let equipString = "-";
  if (storingData.peralatan.length === 1) {
    equipString = storingData.peralatan[0];
  } else if (storingData.peralatan.length > 1) {
    const lastEquip = storingData.peralatan[storingData.peralatan.length - 1];
    const otherEquips = storingData.peralatan.slice(0, -1).join(", ");
    equipString = `${otherEquips} & ${lastEquip}`;
  }
  let locString = "-";
  if (storingData.lokasi) {
    if (storingData.nomor) {
      if (storingData.lokasi === "Avio & BL D" || storingData.lokasi === "Avio & BL E" || storingData.lokasi === "Avio & BL F" || storingData.lokasi.includes("Rampout")) {
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
const generateWA_Checklist = (checklistData, checklistDataMaster, toggles) => {
  const formattedDate = formatTanggalIndo(checklistData.tanggal);
  const jamMulai = checklistData.waktuMulai || "...";
  const jamSelesai = checklistData.waktuSelesai || "...";
  let result = `KEGIATAN STORING PERALATAN SSES T2
`;
  result += `Hari/Tanggal/Jam : ${formattedDate}, ${jamMulai} - ${jamSelesai}

`;
  checklistDataMaster.forEach((block) => {
    if (block.type === "location") {
      result += `${block.title}
`;
      let summaryCounts = {};
      block.categories.forEach((cat) => {
        result += `${cat.title}
`;
        if (!summaryCounts[cat.summaryKey]) summaryCounts[cat.summaryKey] = { total: 0, operasi: 0, off: 0 };
        cat.items.forEach((item, iIdx) => {
          const key = `${block.title}|${cat.title}|${iIdx}`;
          const isOperasi = toggles[key] !== false;
          result += `* ${item} ${isOperasi ? "✅" : "❌"}
`;
          summaryCounts[cat.summaryKey].total++;
          if (isOperasi) summaryCounts[cat.summaryKey].operasi++;
          else summaryCounts[cat.summaryKey].off++;
        });
        result += `
`;
      });
      result += `${block.summary}
`;
      Object.keys(summaryCounts).forEach((sKey) => {
        result += `${sKey}  : ${summaryCounts[sKey].total}
`;
        result += `* Operasi : ${summaryCounts[sKey].operasi}
`;
        result += `* Off : ${summaryCounts[sKey].off}
`;
      });
      result += `
`;
    } else if (block.type === "group") {
      let summaryCounts = {};
      block.locations.forEach((loc) => {
        result += `${loc.title}
`;
        loc.categories.forEach((cat) => {
          result += `${cat.title}
`;
          if (!summaryCounts[cat.summaryKey]) summaryCounts[cat.summaryKey] = { total: 0, operasi: 0, off: 0 };
          cat.items.forEach((item, iIdx) => {
            const key = `${loc.title}|${cat.title}|${iIdx}`;
            const isOperasi = toggles[key] !== false;
            result += `* ${item} ${isOperasi ? "✅" : "❌"}
`;
            summaryCounts[cat.summaryKey].total++;
            if (isOperasi) summaryCounts[cat.summaryKey].operasi++;
            else summaryCounts[cat.summaryKey].off++;
          });
          result += `
`;
        });
      });
      result += `${block.summary}
`;
      Object.keys(summaryCounts).forEach((sKey) => {
        result += `${sKey}  : ${summaryCounts[sKey].total}
`;
        result += `* Operasi : ${summaryCounts[sKey].operasi}
`;
        result += `* Off : ${summaryCounts[sKey].off}
`;
      });
      result += `
`;
    } else if (block.type === "access_control") {
      result += `${block.title}
`;
      let totalAc = 0, operasiAc = 0, offAc = 0;
      block.terminals.forEach((term) => {
        if (term.title) result += `${term.title}
`;
        term.categories.forEach((cat) => {
          result += `${cat.title}
`;
          cat.items.forEach((item, iIdx) => {
            const key = `${block.title}|${term.title}|${cat.title}|${iIdx}`;
            const isOperasi = toggles[key] !== false;
            result += `* ${item} ${isOperasi ? "✅" : "❌"}
`;
            totalAc++;
            if (isOperasi) operasiAc++;
            else offAc++;
          });
          result += `
`;
        });
      });
      result += `${block.summary} : ${totalAc}
`;
      result += `OPERASI : ${operasiAc}
`;
      result += `OFF : ${offAc}

`;
    }
  });
  result += `TERIMA KASIH
MELANGKAH BERSAMA UNTUK CGK HEBAT
BERSAMA MELAYANI SEPENUH HATI`;
  return result.trim();
};
const generateWA_Kalibrasi = (kalibrasiGlobal, kalibrasiEntries) => {
  if (kalibrasiEntries.length === 0 || kalibrasiEntries.every((e) => e.peralatan.length === 0)) {
    return "Silakan tambah peralatan pada lokasi untuk melihat preview laporan...";
  }
  const formattedDate = formatTanggalIndo(kalibrasiGlobal.tanggal);
  const jamMulai = kalibrasiGlobal.waktuMulai || "...";
  const jamSelesai = kalibrasiGlobal.waktuSelesai || "...";
  let msg = `*(Real-time)*
*PREVENTIVE MAINTENANCE & KALIBRASI SSES T2*
Hari/Tanggal/Jam : ${formattedDate}, ${jamMulai} - ${jamSelesai}`;
  kalibrasiEntries.forEach((entry) => {
    if (entry.peralatan.length === 0) return;
    if (entry.peralatan.includes("Access Control")) {
      const locs = entry.acLokasi || [];
      let lokasiAC = "...";
      if (locs.length === 1) {
        lokasiAC = locs[0];
      } else if (locs.length > 1) {
        const lastLoc = locs[locs.length - 1];
        const otherLocs = locs.slice(0, -1).join(", ");
        lokasiAC = `${otherLocs} & ${lastLoc}`;
      }
      msg += `

Peralatan : Access Control
Lokasi : ${lokasiAC}

Kegiatan :
- Pembersihan Emlock, Switch, Intercom, Fingerprint & CCTV
- Pengecekan Fungsi Emlock, Intercom, Fingerprint, CCTV, Pengontrolan Kunci Pintu, Record CCTV
   
Catatan :
- Fungsi Emlock : ${entry.acEmlock || "..."}
- Fungsi Intercom : ${entry.acIntercom || "..."}
- Fungsi Fingerprint: ${entry.acFingerprint || "..."}
- Fungsi CCTV : ${entry.acCctv || "..."}
- Fungsi Pengontrolan Kunci Pintu : ${entry.acPengontrolan || "..."}
- Record CCTV : ${entry.acRecordCctv || "..."}`;
      return;
    }
    const equipListFormatted = entry.peralatan.map((eq) => {
      if (eq === "X-Ray") return entry.xrayModel === "Semua X-Ray" ? "X-Ray" : entry.xrayModel;
      if (eq === "WTMD") return entry.wtmdModel === "Semua WTMD" ? "WTMD" : entry.wtmdModel;
      if (eq === "HHMD") return entry.hhmdModel === "Semua HHMD" ? "HHMD" : entry.hhmdModel;
      if (eq === "Body Scanner") return entry.bsModel === "Semua Body Scanner" ? "Body Scanner" : entry.bsModel;
      if (eq === "ETD") return entry.etdModel === "Semua ETD" ? "ETD" : entry.etdModel;
      return eq;
    });
    const locString = entry.lokasi1 + (entry.lokasi2 && entry.lokasi2 !== "-" ? ` ${entry.lokasi2}` : "");
    const lokasiStr = locString || "...";
    const equipString = equipListFormatted.length === 1 ? equipListFormatted[0] : equipListFormatted.length > 1 ? `${equipListFormatted.slice(0, -1).join(", ")} & ${equipListFormatted[equipListFormatted.length - 1]}` : "-";
    msg += `

Peralatan : ${equipString}
Lokasi : ${lokasiStr}

Kegiatan :
- Pembersihan ${equipString}
- Kalibrasi ${equipString}
   
Catatan :`;
    if (entry.peralatan.includes("X-Ray")) {
      const xrayName = entry.xrayModel === "Semua X-Ray" ? "X-Ray" : entry.xrayModel;
      msg += `
${xrayName}
- kV : ${entry.xrayKvV || "..."} (v) - ${entry.xrayKvH || "..."} (h)
- mA : ${entry.xrayMaV || "..."} (v) - ${entry.xrayMaH || "..."} (h)
- Ontime : ${entry.xrayOnV || "..."} (v) - ${entry.xrayOnH || "..."} (h)
- Archive : ${entry.xrayArchive || "..."}
`;
    }
    if (entry.peralatan.includes("WTMD")) {
      const wtmdName = entry.wtmdModel === "Semua WTMD" ? "WTMD" : entry.wtmdModel;
      msg += `
${wtmdName}
- Z1 : ${entry.wtmdZ1 || "..."} - Z2 : ${entry.wtmdZ2 || "..."} - Z3 : ${entry.wtmdZ3 || "..."} - Z4 : ${entry.wtmdZ4 || "..."}
- LC : ${entry.wtmdLc || "..."} - LS : ${entry.wtmdLs || "..."} - UC : ${entry.wtmdUc || "..."} - SE : ${entry.wtmdSe || "..."} - DS : ${entry.wtmdDs || "..."}
`;
    }
    if (entry.peralatan.includes("Body Scanner")) {
      const bsName = entry.bsModel === "Semua Body Scanner" ? "Body Scanner" : entry.bsModel;
      msg += `
${bsName}
- Test Tampilan Suspect Item : ${entry.bsSuspect || "Normal"}
- Test Monitor : ${entry.bsMonitor || "Normal"}
- Test Fungsi Scanning : ${entry.bsScanning || "Normal"}
- Test Fungsi Kalibrasi : ${entry.bsCalibration || "Normal"}
`;
    }
    if (entry.peralatan.includes("ETD")) {
      const etdName = entry.etdModel === "Semua ETD" ? "ETD" : entry.etdModel;
      msg += `
${etdName}
- Sampling Test TNT : ${entry.etdTnt || "Alarm"}
- Sampling Test PETN : ${entry.etdPetn || "Alarm"}
- Sampling Test RDX : ${entry.etdRdx || "Alarm"}
`;
    }
  });
  return msg;
};
const fallbackShare = async (message, hasUnsharedPhotos, setIsCopied) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(message);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = message;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
    if (hasUnsharedPhotos) {
      alert("Perangkat ini tidak mendukung pengiriman foto secara otomatis. Teks laporan telah dicopy. Silakan 'Paste' di WhatsApp dan lampirkan foto Anda secara manual.");
    }
  } catch (err) {
    console.error("Gagal menyalin teks", err);
  }
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
};
const shareToWhatsApp = async (message, filesArray, setIsCopied) => {
  let finalFiles = [];
  if (filesArray) {
    if (Array.isArray(filesArray)) finalFiles = filesArray;
    else finalFiles = [filesArray];
  }
  try {
    if (finalFiles.length > 0 && navigator.canShare && navigator.canShare({ files: finalFiles })) {
      await navigator.share({ files: finalFiles, title: "Laporan SSES T2", text: message });
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      return;
    } else if (finalFiles.length === 0 && navigator.share) {
      await navigator.share({ title: "Laporan SSES T2", text: message });
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      return;
    }
  } catch (err) {
    console.error("Share dibatalkan atau gagal", err);
    if (err.name === "AbortError") return;
  }
  fallbackShare(message, finalFiles.length > 0, setIsCopied);
};
const TabKehadiran = () => {
  const { isCopied, setIsCopied } = useAppStore();
  const { dataApiT2, dataOmIasT2 } = useMasterDataStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [attendanceData, setAttendanceData] = useState(() => {
    const now = /* @__PURE__ */ new Date();
    const currentHour = now.getHours();
    const isPagi = currentHour >= 8 && currentHour < 20;
    const shiftValue = isPagi ? "Pagi, 08.00 - 20.00 WIB" : "Malam, 20.00 - 08.00 WIB";
    const kegiatan = isPagi ? "- Monitoring Ops\n- Storing Peralatan\n- Preventive Maintenance & Kalibrasi Perangkat" : "- Monitoring Ops\n- Storing Peralatan";
    const logicalDateObj = new Date(now.getTime());
    if (currentHour < 8) {
      logicalDateObj.setDate(logicalDateObj.getDate() - 1);
    }
    const tzOffset = logicalDateObj.getTimezoneOffset() * 6e4;
    const localDate = new Date(logicalDateObj.getTime() - tzOffset).toISOString().split("T")[0];
    return {
      tanggal: localDate,
      shift: shiftValue,
      apiList: [],
      omList: [],
      tlpRuangan: "- 021 550 5910",
      rencanaKegiatan: kegiatan
    };
  });
  useEffect(() => {
    const fetchJadwal = async () => {
      setIsLoading(true);
      try {
        const targetShiftCode = attendanceData.shift.includes("Pagi") ? "PS" : "M";
        const { data, error } = await supabase.from("jadwal_shift").select(`
            id, shift, status_kehadiran,
            personel:personel_id (id, nama, no_hp, unit_kerja(nama))
          `).eq("tanggal", attendanceData.tanggal).neq("shift", "D");
        if (error) throw error;
        const filteredData = (data || []).filter((d) => {
          const s = (d.shift || "").toUpperCase();
          if (targetShiftCode === "PS") {
            return s === "PS";
          } else {
            return s === "M";
          }
        });
        const apiRows = filteredData.filter((d) => d.personel?.unit_kerja?.nama === "API T2").map((d) => ({
          id: d.id,
          jadwal_id: d.id,
          personel_id: d.personel?.id,
          name: d.personel?.nama ? toTitleCase(d.personel.nama) : "",
          phone: d.personel?.no_hp || "",
          status: d.status_kehadiran || "Hadir"
        }));
        const omRows = filteredData.filter((d) => d.personel?.unit_kerja?.nama === "OM/IAS T2").map((d) => ({
          id: d.id,
          jadwal_id: d.id,
          personel_id: d.personel?.id,
          name: d.personel?.nama ? toTitleCase(d.personel.nama) : "",
          phone: d.personel?.no_hp || "",
          status: d.status_kehadiran || "Hadir"
        }));
        if (apiRows.length === 0) apiRows.push({ id: Date.now(), jadwal_id: null, personel_id: null, name: "", phone: "", status: "Hadir" });
        if (omRows.length === 0) omRows.push({ id: Date.now() + 1, jadwal_id: null, personel_id: null, name: "", phone: "", status: "Hadir" });
        setAttendanceData((prev) => ({
          ...prev,
          apiList: apiRows,
          omList: omRows
        }));
      } catch (err) {
        console.error("Error fetching jadwal:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJadwal();
  }, [attendanceData.tanggal, attendanceData.shift]);
  const handleAttendanceChange = (e) => {
    const { name, value } = e.target;
    setAttendanceData({ ...attendanceData, [name]: value });
  };
  const handleShiftChange = (e) => {
    const shift = e.target.value;
    const isPagi = shift.includes("Pagi");
    const kegiatan = isPagi ? "- Monitoring Ops\n- Storing Peralatan\n- Preventive Maintenance & Kalibrasi Perangkat" : "- Monitoring Ops\n- Storing Peralatan";
    setAttendanceData({
      ...attendanceData,
      shift,
      rencanaKegiatan: kegiatan
    });
  };
  const handleRowChange = (listType, index, field, value) => {
    const newList = [...attendanceData[listType]];
    newList[index] = { ...newList[index], [field]: value };
    if (field === "name") {
      const sourceData = listType === "apiList" ? dataApiT2 : dataOmIasT2;
      const person = sourceData.find((p) => p.name === value);
      if (person) {
        newList[index].phone = person.phone;
        newList[index].personel_id = person.id;
      } else {
        newList[index].phone = "";
        newList[index].personel_id = null;
      }
    }
    setAttendanceData({ ...attendanceData, [listType]: newList });
  };
  const addRow = (listType) => {
    setAttendanceData({
      ...attendanceData,
      [listType]: [...attendanceData[listType], { id: Date.now(), jadwal_id: null, personel_id: null, name: "", phone: "", status: "Hadir" }]
    });
  };
  const removeRow = (listType, index) => {
    const newList = [...attendanceData[listType]];
    newList.splice(index, 1);
    setAttendanceData({ ...attendanceData, [listType]: newList });
  };
  const handleDashChange = (e, field) => {
    let value = e.target.value;
    if (!value.startsWith("- ")) {
      value = "- " + value.replace(/^- /, "");
    }
    value = value.replace(/\n([^-])/g, "\n- $1");
    setAttendanceData((prev) => ({ ...prev, [field]: value }));
  };
  const handleDashKeyDown = (e, field) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setAttendanceData((prev) => ({ ...prev, [field]: prev[field] + "\n- " }));
    }
  };
  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const targetShiftCode = attendanceData.shift.includes("Pagi") ? "PS" : "M";
      const allRows = [...attendanceData.apiList, ...attendanceData.omList];
      for (const row of allRows) {
        if (!row.name || !row.personel_id) continue;
        if (row.jadwal_id) {
          await supabase.from("jadwal_shift").update({ status_kehadiran: row.status }).eq("id", row.jadwal_id);
        } else {
          await supabase.from("jadwal_shift").upsert({
            personel_id: row.personel_id,
            tanggal: attendanceData.tanggal,
            shift: targetShiftCode,
            status_kehadiran: row.status
          }, { onConflict: "personel_id, tanggal" });
        }
      }
      const message = generateWA_Kehadiran(attendanceData);
      await shareToWhatsApp(message, null, () => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3e3);
      });
    } catch (err) {
      console.error("Failed to save attendance", err);
      alert("Gagal menyimpan absensi ke database!");
    } finally {
      setIsSaving(false);
    }
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleAttendanceSubmit, className: "p-6 sm:p-8 space-y-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2", children: [
        /* @__PURE__ */ jsx(Users, { className: "w-5 h-5 text-blue-600" }),
        " Info Shift",
        isLoading && /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 text-blue-500 animate-spin ml-2" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Tanggal" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
            /* @__PURE__ */ jsx("input", { type: "date", name: "tanggal", required: true, value: attendanceData.tanggal, onChange: handleAttendanceChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Dinas (Shift)" }),
          /* @__PURE__ */ jsxs("select", { name: "shift", value: attendanceData.shift, onChange: handleShiftChange, className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer", children: [
            /* @__PURE__ */ jsx("option", { value: "Pagi, 08.00 - 20.00 WIB", children: "Pagi, 08.00 - 20.00 WIB" }),
            /* @__PURE__ */ jsx("option", { value: "Malam, 20.00 - 08.00 WIB", children: "Malam, 20.00 - 08.00 WIB" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center border-b pb-2", children: /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(User, { className: "w-5 h-5 text-blue-600" }),
        " Personel API T2"
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        attendanceData.apiList.map((row, index) => {
          const availableOptions = dataApiT2.filter((p) => !attendanceData.apiList.some((r) => r.name === p.name) || p.name === row.name);
          return /* @__PURE__ */ jsxs("div", { className: `flex flex-col sm:flex-row gap-2 items-start sm:items-center p-3 rounded-lg border ${row.jadwal_id ? "bg-blue-50/50 border-blue-200" : "bg-slate-50 border-slate-200 border-dashed"}`, children: [
            /* @__PURE__ */ jsxs("select", { value: row.name, onChange: (e) => handleRowChange("apiList", index, "name", e.target.value), className: "w-full sm:w-2/5 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none", children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "- Pilih Personel -" }),
              availableOptions.map((opt) => /* @__PURE__ */ jsx("option", { value: opt.name, children: opt.name }, opt.name))
            ] }),
            /* @__PURE__ */ jsx("input", { type: "text", value: row.phone, readOnly: true, placeholder: "No Telepon", className: "w-full sm:w-1/4 px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm text-slate-500 outline-none cursor-not-allowed" }),
            /* @__PURE__ */ jsxs("select", { value: row.status, onChange: (e) => handleRowChange("apiList", index, "status", e.target.value), className: `w-full sm:w-1/4 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${row.status !== "Hadir" ? "text-rose-600 font-bold" : ""}`, children: [
              /* @__PURE__ */ jsx("option", { value: "Hadir", children: "Hadir" }),
              /* @__PURE__ */ jsx("option", { value: "Izin", children: "Izin" }),
              /* @__PURE__ */ jsx("option", { value: "Sakit", children: "Sakit" }),
              /* @__PURE__ */ jsx("option", { value: "Dinas Luar", children: "Dinas Luar" })
            ] }),
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => removeRow("apiList", index), disabled: attendanceData.apiList.length <= 1, className: `w-full sm:w-auto p-2 rounded-md flex justify-center items-center transition-colors ${attendanceData.apiList.length <= 1 ? "bg-slate-200 text-slate-400 cursor-not-allowed opacity-70" : "bg-rose-100 text-rose-600 hover:bg-rose-200"}`, children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" }) })
          ] }, row.id);
        }),
        /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => addRow("apiList"), className: "text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2", children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
          " Tambah Personel (Manual)"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center border-b pb-2", children: /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Users, { className: "w-5 h-5 text-blue-600" }),
        " Personel OM IAS T2"
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        attendanceData.omList.map((row, index) => {
          const availableOptions = dataOmIasT2.filter((p) => !attendanceData.omList.some((r) => r.name === p.name) || p.name === row.name);
          return /* @__PURE__ */ jsxs("div", { className: `flex flex-col sm:flex-row gap-2 items-start sm:items-center p-3 rounded-lg border ${row.jadwal_id ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-200 border-dashed"}`, children: [
            /* @__PURE__ */ jsxs("select", { value: row.name, onChange: (e) => handleRowChange("omList", index, "name", e.target.value), className: "w-full sm:w-2/5 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-emerald-500 appearance-none", children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "- Pilih Personel -" }),
              availableOptions.map((opt) => /* @__PURE__ */ jsx("option", { value: opt.name, children: opt.name }, opt.name))
            ] }),
            /* @__PURE__ */ jsx("input", { type: "text", value: row.phone, readOnly: true, placeholder: "No Telepon", className: "w-full sm:w-1/4 px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm text-slate-500 outline-none cursor-not-allowed" }),
            /* @__PURE__ */ jsxs("select", { value: row.status, onChange: (e) => handleRowChange("omList", index, "status", e.target.value), className: `w-full sm:w-1/4 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-emerald-500 appearance-none ${row.status !== "Hadir" ? "text-rose-600 font-bold" : ""}`, children: [
              /* @__PURE__ */ jsx("option", { value: "Hadir", children: "Hadir" }),
              /* @__PURE__ */ jsx("option", { value: "Izin", children: "Izin" }),
              /* @__PURE__ */ jsx("option", { value: "Sakit", children: "Sakit" }),
              /* @__PURE__ */ jsx("option", { value: "Dinas Luar", children: "Dinas Luar" })
            ] }),
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => removeRow("omList", index), disabled: attendanceData.omList.length <= 1, className: `w-full sm:w-auto p-2 rounded-md flex justify-center items-center transition-colors ${attendanceData.omList.length <= 1 ? "bg-slate-200 text-slate-400 cursor-not-allowed opacity-70" : "bg-rose-100 text-rose-600 hover:bg-rose-200"}`, children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" }) })
          ] }, row.id);
        }),
        /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => addRow("omList"), className: "text-sm font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 mt-2", children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
          " Tambah Personel (Manual)"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2", children: [
        /* @__PURE__ */ jsx(ClipboardList, { className: "w-5 h-5 text-blue-600" }),
        " Rencana & Informasi Tambahan"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Tlp Ruangan" }),
          /* @__PURE__ */ jsx("input", { type: "text", name: "tlpRuangan", required: true, value: attendanceData.tlpRuangan, onChange: handleAttendanceChange, className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Rencana Kegiatan Harian" }),
          /* @__PURE__ */ jsx("textarea", { name: "rencanaKegiatan", required: true, rows: 4, value: attendanceData.rencanaKegiatan, onChange: (e) => handleDashChange(e, "rencanaKegiatan"), onKeyDown: (e) => handleDashKeyDown(e, "rencanaKegiatan"), className: "w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm leading-relaxed" }),
          (() => {
            const pmText = "- Preventive Maintenance & Kalibrasi Perangkat";
            const hasPM = attendanceData.rencanaKegiatan.includes(pmText);
            return /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  if (hasPM) {
                    let newText = attendanceData.rencanaKegiatan.replace("\n" + pmText, "").replace(pmText, "").trim();
                    setAttendanceData({ ...attendanceData, rencanaKegiatan: newText });
                  } else {
                    let newText = attendanceData.rencanaKegiatan.trim();
                    if (newText.length > 0) newText += "\n";
                    newText += pmText;
                    setAttendanceData({ ...attendanceData, rencanaKegiatan: newText });
                  }
                },
                className: "mt-2 flex items-center gap-1.5 text-sm font-medium transition-colors",
                children: hasPM ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(X, { className: "w-4 h-4 text-red-500" }),
                  /* @__PURE__ */ jsx("span", { className: "text-red-600 hover:text-red-700", children: "Hapus PM & Kalibrasi" })
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 text-emerald-500" }),
                  /* @__PURE__ */ jsx("span", { className: "text-emerald-600 hover:text-emerald-700", children: "Tambahkan PM & Kalibrasi" })
                ] })
              }
            );
          })()
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row gap-4 mt-8", children: /* @__PURE__ */ jsx("button", { type: "submit", disabled: isLoading || isSaving, className: `w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${isCopied ? "bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]" : "bg-[#25D366] hover:bg-[#20b858] hover:shadow-xl hover:-translate-y-0.5 text-white"} disabled:opacity-50 disabled:cursor-not-allowed`, children: isSaving ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin" }),
      " Menyimpan..."
    ] }) : isCopied ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 animate-pulse" }),
      " Tersimpan & Disalin!"
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Share2, { className: "w-6 h-6" }),
      " Share Kehadiran ke WA"
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 border-t border-slate-200 pt-8", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-700 mb-4 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-blue-600" }),
        " Preview Laporan Kehadiran (Real-time)"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative", children: /* @__PURE__ */ jsx("div", { className: "bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%]", children: generateWA_Kehadiran(attendanceData) }) })
    ] })
  ] });
};
const PhotoUploader = ({
  photos,
  onUpload,
  onRemove,
  onZoom,
  onDrop,
  listType,
  onOpenEditor
}) => {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-3", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Camera, { className: "w-5 h-5 text-blue-600" }),
        " Lampiran Foto"
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-500 font-medium flex items-center gap-1", children: [
        /* @__PURE__ */ jsx(Move, { className: "w-3 h-3" }),
        " Geser foto untuk urutkan"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("label", { className: "flex items-center justify-center w-full p-6 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors group", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2 text-center", children: [
        /* @__PURE__ */ jsx(ImagePlus, { className: "w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" }),
        /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-blue-700", children: "Pilih / Ambil Foto" }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-blue-500", children: "Galeri, File, atau Kamera langsung" })
      ] }),
      /* @__PURE__ */ jsx("input", { type: "file", accept: "image/*", multiple: true, className: "hidden", onChange: onUpload })
    ] }) }),
    photos.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-3", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-xs font-semibold text-slate-500", children: [
          "Foto Terpilih (",
          photos.length,
          "):"
        ] }),
        onOpenEditor && /* @__PURE__ */ jsxs("button", { type: "button", onClick: onOpenEditor, className: "text-sm bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 shadow-sm transition-colors", children: [
          /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ jsx("rect", { width: "7", height: "7", x: "3", y: "3", rx: "1" }),
            /* @__PURE__ */ jsx("rect", { width: "7", height: "7", x: "14", y: "3", rx: "1" }),
            /* @__PURE__ */ jsx("rect", { width: "7", height: "7", x: "14", y: "14", rx: "1" }),
            /* @__PURE__ */ jsx("rect", { width: "7", height: "7", x: "3", y: "14", rx: "1" })
          ] }),
          "Edit Kolase (Pro)"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4", children: photos.map((photo, index) => /* @__PURE__ */ jsxs(
        "div",
        {
          "data-photo-index": index,
          "data-list-type": listType,
          draggable: true,
          onDragStart: (e) => e.dataTransfer.setData("text/plain", index.toString()),
          onDragOver: (e) => e.preventDefault(),
          onDrop: (e) => onDrop(e, index),
          onTouchStart: (e) => {
            if (e.touches.length === 1) {
              window.touchDragState = { type: listType, index, startX: e.touches[0].clientX, startY: e.touches[0].clientY, isDragging: false };
            }
          },
          onTouchMove: (e) => {
            if (window.touchDragState && e.touches.length === 1) {
              if (Math.abs(e.touches[0].clientY - window.touchDragState.startY) > 10 || Math.abs(e.touches[0].clientX - window.touchDragState.startX) > 10) {
                window.touchDragState.isDragging = true;
              }
            }
          },
          onTouchEnd: (e) => {
            if (window.touchDragState && window.touchDragState.isDragging && window.touchDragState.type === listType) {
              const touch = e.changedTouches[0];
              const elem = document.elementFromPoint(touch.clientX, touch.clientY);
              const target = elem?.closest(`[data-list-type="${listType}"]`);
              if (target) {
                const targetIdx = parseInt(target.getAttribute("data-photo-index") || "", 10);
                if (!isNaN(targetIdx) && targetIdx !== window.touchDragState.index) {
                  const mockEvent = { preventDefault: () => {
                  }, dataTransfer: { getData: () => window.touchDragState.index.toString() } };
                  onDrop(mockEvent, targetIdx);
                }
              }
            }
            window.touchDragState = null;
          },
          className: "relative group aspect-square rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm bg-slate-100 cursor-move hover:border-blue-400 transition-colors touch-pan-y",
          title: "Tahan & Geser untuk mengubah urutan",
          children: [
            /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center bg-slate-800 overflow-hidden", children: /* @__PURE__ */ jsx(
              "img",
              {
                src: photo.preview,
                alt: `Preview ${index}`,
                className: "w-full h-full object-cover transition-transform duration-200",
                style: { transform: `scale(${photo.zoom || 1})` }
              }
            ) }),
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onRemove(index), className: "absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 opacity-90 hover:opacity-100 transition-opacity shadow-md z-10", children: /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5" }) }),
            /* @__PURE__ */ jsxs("div", { className: "absolute bottom-1.5 left-1.5 right-1.5 flex justify-between items-center bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10", children: [
              /* @__PURE__ */ jsx("button", { type: "button", onClick: (e) => {
                e.stopPropagation();
                onZoom(index, -0.1);
              }, className: "text-white hover:text-blue-300 font-bold px-2 py-0.5 text-lg leading-none", children: "-" }),
              /* @__PURE__ */ jsxs("span", { className: "text-white text-[11px] font-medium", children: [
                Math.round((photo.zoom || 1) * 100),
                "%"
              ] }),
              /* @__PURE__ */ jsx("button", { type: "button", onClick: (e) => {
                e.stopPropagation();
                onZoom(index, 0.1);
              }, className: "text-white hover:text-blue-300 font-bold px-2 py-0.5 text-lg leading-none", children: "+" })
            ] })
          ]
        },
        photo.id
      )) })
    ] })
  ] });
};
const processPhotosToCollage = async (photosArray) => {
  return new Promise(async (resolve) => {
    if (photosArray.length <= 1) {
      resolve(null);
      return;
    }
    try {
      const CELL_SIZE = 800;
      const SPACING = 24;
      const cols = Math.ceil(Math.sqrt(photosArray.length));
      const rows = Math.ceil(photosArray.length / cols);
      const canvas = document.createElement("canvas");
      canvas.width = cols * CELL_SIZE + (cols + 1) * SPACING;
      canvas.height = rows * CELL_SIZE + (rows + 1) * SPACING;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const loadedImages = await Promise.all(photosArray.map((p) => {
        return new Promise((resolve2, reject) => {
          const img = new Image();
          img.onload = () => resolve2({ img, zoom: p.zoom || 1 });
          img.onerror = reject;
          img.src = p.preview;
        });
      }));
      loadedImages.forEach((item, index) => {
        const { img, zoom } = item;
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = SPACING + col * (CELL_SIZE + SPACING);
        const y = SPACING + row * (CELL_SIZE + SPACING);
        const baseScale = Math.max(CELL_SIZE / img.width, CELL_SIZE / img.height);
        const finalScale = baseScale * zoom;
        const nw = img.width * finalScale;
        const nh = img.height * finalScale;
        const ox = (CELL_SIZE - nw) / 2;
        const oy = (CELL_SIZE - nh) / 2;
        ctx.save();
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, CELL_SIZE, CELL_SIZE, 16);
        } else {
          ctx.rect(x, y, CELL_SIZE, CELL_SIZE);
        }
        ctx.clip();
        ctx.drawImage(img, x + ox, y + oy, nw, nh);
        ctx.restore();
      });
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const newFile = new File([blob], `Kolase_${Date.now()}.jpg`, { type: "image/jpeg" });
        const newUrl = URL.createObjectURL(blob);
        resolve({ url: newUrl, file: newFile });
      }, "image/jpeg", 0.85);
    } catch (err) {
      console.error("Gagal membuat kolase:", err);
      resolve(null);
    }
  });
};
const CollageEditor$3 = lazy(() => import("./CollageEditor-DPFEuQhx.js").then((m) => ({ default: m.CollageEditor })));
const TabPerbaikan = () => {
  const { isCopied, setIsCopied } = useAppStore();
  const [formData, setFormData] = useState(() => {
    const now = /* @__PURE__ */ new Date();
    const currentHour = now.getHours();
    const logicalDateObj = new Date(now.getTime());
    if (currentHour < 8) {
      logicalDateObj.setDate(logicalDateObj.getDate() - 1);
    }
    const tzOffset = logicalDateObj.getTimezoneOffset() * 6e4;
    const localDate = new Date(logicalDateObj.getTime() - tzOffset).toISOString().split("T")[0];
    return {
      peralatan: "",
      lokasi1: "",
      lokasi2: "",
      sumberLaporan: "Avsec",
      indikasiAwal: "",
      tanggal: localDate,
      waktuMulai: "",
      waktuSelesai: "",
      lamaPengerjaan: "",
      teknisi: "",
      permasalahan: "• ",
      tindakLanjut: "• ",
      status: "Pekerjaan Selesai"
    };
  });
  const [availableTeknisi, setAvailableTeknisi] = useState([]);
  const [selectedTeknisi, setSelectedTeknisi] = useState([]);
  const [tipePeralatanOptions, setTipePeralatanOptions] = useState([]);
  React.useEffect(() => {
    const fetchData = async () => {
      const now = /* @__PURE__ */ new Date();
      const currentHour = now.getHours();
      const logicalDateObj = new Date(now.getTime());
      if (currentHour < 8) {
        logicalDateObj.setDate(logicalDateObj.getDate() - 1);
      }
      const tzOffset = logicalDateObj.getTimezoneOffset() * 6e4;
      const todayStr = new Date(logicalDateObj.getTime() - tzOffset).toISOString().split("T")[0];
      const isPagi = currentHour >= 8 && currentHour < 20;
      const { data: dataTeknisi } = await supabase.from("jadwal_shift").select(`id, shift, status_kehadiran, personel:personel_id(nama, unit_kerja(nama))`).eq("tanggal", todayStr).eq("status_kehadiran", "Hadir");
      if (dataTeknisi) {
        const filteredTeknisi = dataTeknisi.filter((d) => {
          const s = (d.shift || "").toUpperCase();
          if (isPagi) {
            return s === "PS";
          } else {
            return s === "M";
          }
        });
        setAvailableTeknisi(filteredTeknisi.map((d) => ({
          id: d.id,
          name: toTitleCase(d.personel?.nama || ""),
          unit: d.personel?.unit_kerja?.nama || ""
        })).filter((t) => t.name !== ""));
      }
      const { data: dataTipe } = await supabase.from("tipe_peralatan").select("nama").order("nama", { ascending: true });
      if (dataTipe) {
        setTipePeralatanOptions(dataTipe.map((d) => d.nama));
      }
    };
    fetchData();
  }, []);
  React.useEffect(() => {
    setFormData((prev) => ({ ...prev, teknisi: selectedTeknisi.join(", ") }));
  }, [selectedTeknisi]);
  const toggleTeknisi = (name) => {
    setSelectedTeknisi((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);
  };
  const [isVerifikasiETD, setIsVerifikasiETD] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [customCollageFile, setCustomCollageFile] = useState(null);
  const [customCollageUrl, setCustomCollageUrl] = useState(null);
  const handleRepairChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };
    if (name === "lokasi1" || name === "peralatan") {
      newFormData.lokasi2 = "";
    }
    if (name === "waktuMulai" || name === "waktuSelesai") {
      const start = name === "waktuMulai" ? value : formData.waktuMulai;
      const end = name === "waktuSelesai" ? value : formData.waktuSelesai;
      if (start && end) {
        const [startH, startM] = start.split(":").map(Number);
        const [endH, endM] = end.split(":").map(Number);
        let diff = endH * 60 + endM - (startH * 60 + startM);
        if (diff < 0) diff += 24 * 60;
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        newFormData.lamaPengerjaan = `${hours > 0 ? `${hours} Jam ` : ""}${minutes} Menit`;
      }
    }
    setFormData(newFormData);
  };
  const handlePeralatanChange = (e) => {
    const value = e.target.value;
    const isETD = value === "ETD Leidos QS-B220";
    if (!isETD && isVerifikasiETD) {
      setIsVerifikasiETD(false);
      setFormData((prev) => ({ ...prev, peralatan: value, lokasi2: "", permasalahan: "• ", tindakLanjut: "• " }));
    } else {
      setFormData((prev) => ({ ...prev, peralatan: value, lokasi2: "" }));
    }
  };
  const handleVerifikasiChange = (e) => {
    const checked = e.target.checked;
    setFormData((prev) => {
      const newData = { ...prev };
      if (checked && newData.peralatan !== "ETD Leidos QS-B220") {
        newData.peralatan = "ETD Leidos QS-B220";
        newData.lokasi2 = "";
      }
      if (checked) {
        newData.permasalahan = "• Verification Required";
        newData.tindakLanjut = "• Melakukan Verifikasi Negatif";
      } else {
        newData.permasalahan = "• ";
        newData.tindakLanjut = "• ";
      }
      return newData;
    });
    setIsVerifikasiETD(checked);
  };
  const handleBulletChange = (e, field) => {
    let value = e.target.value;
    if (!value.startsWith("• ")) {
      value = "• " + value.replace(/^•\s*/, "");
    }
    value = value.replace(/\n([^•])/g, "\n• $1");
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const handleBulletKeyDown = (e, field) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setFormData((prev) => ({ ...prev, [field]: prev[field] + "\n• " }));
    }
  };
  const handlePhotoUpload = (e) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files).map((file) => ({
        id: Date.now() + Math.random(),
        file,
        preview: URL.createObjectURL(file),
        zoom: 1
      }));
      setPhotos((prev) => [...prev, ...newPhotos]);
    }
  };
  const removePhoto = (index) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };
  const updatePhotoZoom = (index, delta) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      const currentZoom = newPhotos[index].zoom || 1;
      newPhotos[index].zoom = Math.max(0.5, Math.min(3, currentZoom + delta));
      return newPhotos;
    });
  };
  const handlePhotoDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer?.getData("text/plain");
    if (!sourceIndexStr) return;
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (sourceIndex === targetIndex || isNaN(sourceIndex)) return;
    setPhotos((prev) => {
      const newPhotos = [...prev];
      const [movedPhoto] = newPhotos.splice(sourceIndex, 1);
      newPhotos.splice(targetIndex, 0, movedPhoto);
      return newPhotos;
    });
  };
  const handleRepairSubmit = async (e) => {
    e.preventDefault();
    let generatedCollageFile = customCollageFile;
    if (photos.length > 0 && !generatedCollageFile) {
      const collageResult = await processPhotosToCollage(photos);
      if (collageResult) {
        collageResult.url;
        const res = await fetch(collageResult.url);
        const blob = await res.blob();
        generatedCollageFile = new File([blob], `Dokumentasi_Perbaikan_${Date.now()}.jpg`, { type: "image/jpeg" });
      }
    }
    const message = generateWA_Perbaikan(formData, isVerifikasiETD);
    await shareToWhatsApp(message, generatedCollageFile, () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3e3);
    });
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "bg-blue-50/50 px-6 py-5 border-b border-slate-200", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
        /* @__PURE__ */ jsxs("label", { className: "block text-sm font-bold text-blue-900 mb-2 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Cpu, { className: "w-5 h-5 text-blue-600" }),
          " Pilihan Peralatan"
        ] }),
        /* @__PURE__ */ jsxs("select", { required: true, value: formData.peralatan, onChange: handlePeralatanChange, className: "w-full px-4 py-3 bg-white border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-medium shadow-sm cursor-pointer appearance-none", children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "-- Pilih Peralatan --" }),
          tipePeralatanOptions.map((opt) => /* @__PURE__ */ jsx("option", { value: opt, children: opt }, opt))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pt-2 sm:pt-7", children: [
        /* @__PURE__ */ jsx("input", { type: "checkbox", id: "verifikasiETD_tab", checked: isVerifikasiETD, onChange: handleVerifikasiChange, className: "w-5 h-5 text-blue-600 bg-white border-blue-300 rounded focus:ring-2 focus:ring-blue-400 cursor-pointer" }),
        /* @__PURE__ */ jsx("label", { htmlFor: "verifikasiETD_tab", className: "text-sm font-bold text-blue-900 cursor-pointer select-none", children: "Verifikasi ETD" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleRepairSubmit, className: "p-6 sm:p-8 space-y-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center border-b pb-2", children: /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-blue-600" }),
          " Informasi Laporan"
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Lokasi" }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
                /* @__PURE__ */ jsx(MapPin, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    name: "lokasi1",
                    required: true,
                    disabled: !formData.peralatan,
                    value: formData.lokasi1,
                    onChange: handleRepairChange,
                    className: "w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none disabled:bg-slate-200 disabled:opacity-70 disabled:cursor-not-allowed",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "", children: "- Pilih Lokasi -" }),
                      getGeneralLokasiOptions(formData.peralatan).map((opt) => /* @__PURE__ */ jsx("option", { value: opt, children: opt }, opt))
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("div", { className: "w-1/3", children: (() => {
                const options = getLokasi2Options(formData.lokasi1, [formData.peralatan]);
                const isDisabled = options.length === 0 || options.length === 1 && options[0] === "-";
                return /* @__PURE__ */ jsxs("select", { name: "lokasi2", value: formData.lokasi2, onChange: handleRepairChange, disabled: isDisabled, className: `w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none ${isDisabled ? "opacity-50 cursor-not-allowed bg-slate-200" : ""}`, children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "- No -" }),
                  options.map((opt) => /* @__PURE__ */ jsx("option", { value: opt, children: opt }, opt))
                ] });
              })() })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Sumber Laporan" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(User, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
              /* @__PURE__ */ jsx("input", { type: "text", name: "sumberLaporan", required: true, value: formData.sumberLaporan, onChange: handleRepairChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Indikasi Awal" }),
            /* @__PURE__ */ jsx("textarea", { name: "indikasiAwal", required: !isVerifikasiETD, disabled: isVerifikasiETD, rows: 2, placeholder: "Cth: Mesin tidak menyala...", value: formData.indikasiAwal, onChange: handleRepairChange, className: `w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none ${isVerifikasiETD ? "opacity-60 cursor-not-allowed bg-slate-200 text-slate-500" : ""}` })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2", children: [
          /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-blue-600" }),
          " Waktu & Pelaksana"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Tanggal" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Calendar, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
              /* @__PURE__ */ jsx("input", { type: "date", name: "tanggal", required: true, value: formData.tanggal, onChange: handleRepairChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "col-span-1", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Pukul Mulai" }),
            /* @__PURE__ */ jsx("input", { type: "time", name: "waktuMulai", required: true, value: formData.waktuMulai, onChange: handleRepairChange, className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "col-span-1", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Pukul Selesai" }),
            /* @__PURE__ */ jsx("input", { type: "time", name: "waktuSelesai", required: true, value: formData.waktuSelesai, onChange: handleRepairChange, className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Lama Pengerjaan" }),
            /* @__PURE__ */ jsx("input", { type: "text", name: "lamaPengerjaan", required: true, readOnly: true, placeholder: "Terisi otomatis...", value: formData.lamaPengerjaan, className: "w-full px-4 py-2 bg-slate-200 border border-slate-300 rounded-lg outline-none cursor-not-allowed text-slate-600 font-medium select-none" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2", children: [
              "Teknisi Bertugas (Otomatis dari Shift)",
              availableTeknisi.length === 0 && /* @__PURE__ */ jsx("span", { className: "text-xs text-rose-500 font-normal", children: "*(Tidak ada teknisi hadir/jadwal kosong)" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200", children: (() => {
              const apiTeknisi = availableTeknisi.filter((t) => t.unit === "API T2");
              const iasTeknisi = availableTeknisi.filter((t) => t.unit === "OM/IAS T2");
              const otherTeknisi = availableTeknisi.filter((t) => t.unit !== "API T2" && t.unit !== "OM/IAS T2");
              return /* @__PURE__ */ jsxs(Fragment, { children: [
                apiTeknisi.length > 0 && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: apiTeknisi.map((t) => /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-100 rounded-md transition-colors", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: selectedTeknisi.includes(t.name),
                      onChange: () => toggleTeknisi(t.name),
                      className: "w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-slate-700 select-none", children: t.name })
                ] }, t.id)) }),
                apiTeknisi.length > 0 && (iasTeknisi.length > 0 || otherTeknisi.length > 0) && /* @__PURE__ */ jsx("div", { className: "border-t border-slate-300 border-dashed my-1" }),
                iasTeknisi.length > 0 && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: iasTeknisi.map((t) => /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-100 rounded-md transition-colors", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: selectedTeknisi.includes(t.name),
                      onChange: () => toggleTeknisi(t.name),
                      className: "w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-slate-700 select-none", children: t.name })
                ] }, t.id)) }),
                iasTeknisi.length > 0 && otherTeknisi.length > 0 && /* @__PURE__ */ jsx("div", { className: "border-t border-slate-300 border-dashed my-1" }),
                otherTeknisi.length > 0 && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: otherTeknisi.map((t) => /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-100 rounded-md transition-colors", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: selectedTeknisi.includes(t.name),
                      onChange: () => toggleTeknisi(t.name),
                      className: "w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-slate-700 select-none", children: t.name })
                ] }, t.id)) })
              ] });
            })() }),
            availableTeknisi.length === 0 && /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                name: "teknisi",
                placeholder: "Ketik manual nama teknisi jika jadwal kosong...",
                value: formData.teknisi,
                onChange: handleRepairChange,
                className: "w-full mt-2 px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "w-5 h-5 text-blue-600" }),
          " Detail Pengerjaan"
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Permasalahan" }),
          /* @__PURE__ */ jsx("textarea", { name: "permasalahan", required: true, rows: 3, value: formData.permasalahan, onChange: (e) => handleBulletChange(e, "permasalahan"), onKeyDown: (e) => handleBulletKeyDown(e, "permasalahan"), className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm leading-relaxed" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Tindak Lanjut" }),
          /* @__PURE__ */ jsx("textarea", { name: "tindakLanjut", required: true, rows: 6, value: formData.tindakLanjut, onChange: (e) => handleBulletChange(e, "tindakLanjut"), onKeyDown: (e) => handleBulletKeyDown(e, "tindakLanjut"), className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm leading-relaxed" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Status" }),
          /* @__PURE__ */ jsxs("select", { name: "status", value: formData.status, onChange: handleRepairChange, className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none", children: [
            /* @__PURE__ */ jsx("option", { value: "Pekerjaan Selesai", children: "Pekerjaan Selesai" }),
            /* @__PURE__ */ jsx("option", { value: "On Progress", children: "On Progress" }),
            /* @__PURE__ */ jsx("option", { value: "Menunggu Sparepart", children: "Menunggu Sparepart" }),
            /* @__PURE__ */ jsx("option", { value: "Perlu Eskalasi Lanjut", children: "Perlu Eskalasi Lanjut" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        PhotoUploader,
        {
          photos,
          onUpload: handlePhotoUpload,
          onRemove: removePhoto,
          onZoom: updatePhotoZoom,
          onDrop: handlePhotoDrop,
          listType: "general",
          onOpenEditor: () => setIsEditorOpen(true)
        }
      ),
      customCollageUrl && /* @__PURE__ */ jsxs("div", { className: "mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-blue-800 mb-2", children: "Preview Kolase Kustom:" }),
        /* @__PURE__ */ jsx("img", { src: customCollageUrl, alt: "Custom Collage", className: "w-full max-w-sm rounded-lg shadow-sm border border-slate-200" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
          setCustomCollageUrl(null);
          setCustomCollageFile(null);
        }, className: "mt-2 text-xs text-red-600 font-semibold hover:text-red-700", children: "Hapus Kolase Kustom" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row gap-4 mt-8", children: /* @__PURE__ */ jsx("button", { type: "submit", className: `w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${isCopied ? "bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]" : "bg-[#25D366] hover:bg-[#20b858] hover:shadow-xl hover:-translate-y-0.5 text-white"}`, children: isCopied ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 animate-pulse" }),
        " Berhasil Disalin / Dibagikan!"
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Share2, { className: "w-6 h-6" }),
        " Share Perbaikan ke WA"
      ] }) }) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 border-t border-slate-200 pt-8", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-700 mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-blue-600" }),
          " Preview Laporan Perbaikan (Real-time)"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative", children: /* @__PURE__ */ jsx("div", { className: "bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%]", children: generateWA_Perbaikan(formData, isVerifikasiETD) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(
      CollageEditor$3,
      {
        photos,
        isOpen: isEditorOpen,
        onClose: () => setIsEditorOpen(false),
        onSave: (file, url) => {
          setCustomCollageFile(file);
          setCustomCollageUrl(url);
          setIsEditorOpen(false);
        }
      }
    ) })
  ] });
};
const CollageEditor$2 = lazy(() => import("./CollageEditor-DPFEuQhx.js").then((m) => ({ default: m.CollageEditor })));
const TabStoring = () => {
  const { isCopied, setIsCopied } = useAppStore();
  const { jenisPeralatanData, storingLocAc, storingLocDefault } = useMasterDataStore();
  const storingEquipments = Array.from(new Set(jenisPeralatanData.map((j) => j.nama)));
  const [storingData, setStoringData] = useState({
    tanggal: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    waktuMulai: "",
    waktuSelesai: "",
    peralatan: [],
    lokasi: "",
    nomor: "",
    hasil: "Normal Operasi"
  });
  const [photos, setPhotos] = useState([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [customCollageFile, setCustomCollageFile] = useState(null);
  const [customCollageUrl, setCustomCollageUrl] = useState(null);
  const handleStoringChange = (e) => {
    const { name, value } = e.target;
    setStoringData((prev) => ({ ...prev, [name]: value }));
  };
  const handleStoringEquipToggle = (equip) => {
    setStoringData((prev) => {
      let newPeralatan = [...prev.peralatan];
      if (newPeralatan.includes(equip)) {
        newPeralatan = newPeralatan.filter((e) => e !== equip);
      } else {
        newPeralatan.push(equip);
      }
      return { ...prev, peralatan: newPeralatan, lokasi: "", nomor: "" };
    });
  };
  const handlePhotoUpload = (e) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files).map((file) => ({
        id: Date.now() + Math.random(),
        file,
        preview: URL.createObjectURL(file),
        zoom: 1
      }));
      setPhotos((prev) => [...prev, ...newPhotos]);
    }
  };
  const removePhoto = (index) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };
  const updatePhotoZoom = (index, delta) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      const currentZoom = newPhotos[index].zoom || 1;
      newPhotos[index].zoom = Math.max(0.5, Math.min(3, currentZoom + delta));
      return newPhotos;
    });
  };
  const handlePhotoDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer?.getData("text/plain");
    if (!sourceIndexStr) return;
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (sourceIndex === targetIndex || isNaN(sourceIndex)) return;
    setPhotos((prev) => {
      const newPhotos = [...prev];
      const [movedPhoto] = newPhotos.splice(sourceIndex, 1);
      newPhotos.splice(targetIndex, 0, movedPhoto);
      return newPhotos;
    });
  };
  const handleStoringSubmit = async (e) => {
    e.preventDefault();
    let generatedCollageFile = customCollageFile;
    if (photos.length > 0 && !generatedCollageFile) {
      const collageResult = await processPhotosToCollage(photos);
      if (collageResult) {
        collageResult.url;
        const res = await fetch(collageResult.url);
        const blob = await res.blob();
        generatedCollageFile = new File([blob], `Dokumentasi_Storing_${Date.now()}.jpg`, { type: "image/jpeg" });
      }
    }
    const message = generateWA_Storing(storingData);
    await shareToWhatsApp(message, generatedCollageFile, () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3e3);
    });
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleStoringSubmit, className: "p-6 sm:p-8 space-y-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center border-b pb-2", children: /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Box, { className: "w-5 h-5 text-blue-600" }),
        " Detail Kegiatan Storing"
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Tanggal" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
            /* @__PURE__ */ jsx("input", { type: "date", name: "tanggal", required: true, value: storingData.tanggal, onChange: handleStoringChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-1", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Pukul Mulai" }),
          /* @__PURE__ */ jsx("input", { type: "time", name: "waktuMulai", required: true, value: storingData.waktuMulai, onChange: handleStoringChange, className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-1", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Pukul Selesai" }),
          /* @__PURE__ */ jsx("input", { type: "time", name: "waktuSelesai", required: true, value: storingData.waktuSelesai, onChange: handleStoringChange, className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-2", children: [
            "Peralatan ",
            /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: "(Bisa pilih lebih dari 1)" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3", children: storingEquipments.map((equip) => {
            const isACChecked = storingData.peralatan.includes("Access Control");
            const isChecked = storingData.peralatan.includes(equip);
            const isDisabled = isACChecked && equip !== "Access Control";
            return /* @__PURE__ */ jsxs(
              "label",
              {
                className: `flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${isChecked ? "bg-blue-50 border-blue-500 shadow-sm" : isDisabled ? "bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed" : "bg-white border-slate-300 hover:bg-slate-50"}`,
                children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: isChecked,
                      disabled: isDisabled,
                      onChange: () => handleStoringEquipToggle(equip),
                      className: "w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: `ml-2 text-sm font-medium ${isDisabled ? "text-slate-400" : "text-slate-700"}`, children: equip })
                ]
              },
              equip
            );
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Lokasi" }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  name: "lokasi",
                  required: true,
                  value: storingData.lokasi,
                  onChange: handleStoringChange,
                  disabled: storingData.peralatan.length === 0,
                  className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none disabled:bg-slate-200 disabled:opacity-70 disabled:cursor-not-allowed",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "- Pilih Lokasi -" }),
                    getStoringValidLocations(storingData.peralatan, storingLocAc).map((opt) => /* @__PURE__ */ jsx("option", { value: opt, children: opt }, opt))
                  ]
                }
              )
            ] }),
            storingData.peralatan.includes("Access Control") && (storingData.lokasi.includes("Avio") || storingData.lokasi.includes("Rampout")) && /* @__PURE__ */ jsxs("div", { className: "w-1/3 relative", children: [
              /* @__PURE__ */ jsx(Hash, { className: "absolute left-2.5 top-2.5 h-5 w-5 text-slate-400" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  name: "nomor",
                  required: true,
                  value: storingData.nomor,
                  onChange: handleStoringChange,
                  className: "w-full pl-9 pr-2 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "- No -" }),
                    getStoringValidNumbers(storingData.lokasi).map((opt) => /* @__PURE__ */ jsx("option", { value: opt, children: opt }, opt))
                  ]
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Hasil" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(AlertCircle, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
            /* @__PURE__ */ jsx("input", { type: "text", name: "hasil", required: true, value: storingData.hasil, onChange: handleStoringChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      PhotoUploader,
      {
        photos,
        onUpload: handlePhotoUpload,
        onRemove: removePhoto,
        onZoom: updatePhotoZoom,
        onDrop: handlePhotoDrop,
        listType: "general",
        onOpenEditor: () => setIsEditorOpen(true)
      }
    ),
    customCollageUrl && /* @__PURE__ */ jsxs("div", { className: "mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-blue-800 mb-2", children: "Preview Kolase Kustom:" }),
      /* @__PURE__ */ jsx("img", { src: customCollageUrl, alt: "Custom Collage", className: "w-full max-w-sm rounded-lg shadow-sm border border-slate-200" }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
        setCustomCollageUrl(null);
        setCustomCollageFile(null);
      }, className: "mt-2 text-xs text-red-600 font-semibold hover:text-red-700", children: "Hapus Kolase Kustom" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row gap-4 mt-8", children: /* @__PURE__ */ jsx("button", { type: "submit", className: `w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${isCopied ? "bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]" : "bg-[#25D366] hover:bg-[#20b858] hover:shadow-xl hover:-translate-y-0.5 text-white"}`, children: isCopied ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 animate-pulse" }),
      " Berhasil Disalin / Dibagikan!"
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Share2, { className: "w-6 h-6" }),
      " Share Storing ke WA"
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 border-t border-slate-200 pt-8", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-700 mb-4 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-blue-600" }),
        " Preview Laporan Storing (Real-time)"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative", children: /* @__PURE__ */ jsx("div", { className: "bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%]", children: generateWA_Storing(storingData) }) })
    ] }),
    /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(
      CollageEditor$2,
      {
        photos,
        isOpen: isEditorOpen,
        onClose: () => setIsEditorOpen(false),
        onSave: (file, url) => {
          setCustomCollageFile(file);
          setCustomCollageUrl(url);
          setIsEditorOpen(false);
        }
      }
    ) })
  ] });
};
const CollageEditor$1 = lazy(() => import("./CollageEditor-DPFEuQhx.js").then((m) => ({ default: m.CollageEditor })));
const TabKalibrasi = () => {
  const { isCopied, setIsCopied } = useAppStore();
  const { jenisPeralatanData } = useMasterDataStore();
  const kalibrasiEquipments = jenisPeralatanData.filter((j) => j.tampil_di_kalibrasi).map((j) => j.nama);
  const createEmptyKalibrasiEntry = () => ({
    id: Date.now() + Math.random(),
    peralatan: [],
    xrayModel: "Semua X-Ray",
    wtmdModel: "Semua WTMD",
    hhmdModel: "Semua HHMD",
    bsModel: "Semua Body Scanner",
    etdModel: "Semua ETD",
    lokasi1: "",
    lokasi2: "",
    acLokasi: [],
    acEmlock: "Berfungsi",
    acIntercom: "Berfungsi",
    acFingerprint: "Berfungsi",
    acCctv: "Berfungsi",
    acPengontrolan: "Berfungsi",
    acRecordCctv: "",
    xrayKvV: "",
    xrayKvH: "",
    xrayMaV: "",
    xrayMaH: "",
    xrayOnV: "",
    xrayOnH: "",
    xrayArchive: "",
    wtmdZ1: "",
    wtmdZ2: "",
    wtmdZ3: "",
    wtmdZ4: "",
    wtmdLc: "",
    wtmdLs: "",
    wtmdUc: "",
    wtmdSe: "",
    wtmdDs: "",
    bsSuspect: "Normal",
    bsMonitor: "Normal",
    bsScanning: "Normal",
    bsCalibration: "Normal",
    etdTnt: "Alarm",
    etdPetn: "Alarm",
    etdRdx: "Alarm"
  });
  const [kalibrasiGlobal, setKalibrasiGlobal] = useState({
    tanggal: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    waktuMulai: "",
    waktuSelesai: ""
  });
  const [kalibrasiEntries, setKalibrasiEntries] = useState([createEmptyKalibrasiEntry()]);
  const [kalibrasiPhotoGroups, setKalibrasiPhotoGroups] = useState([
    { id: Date.now(), photos: [], collageUrl: null, collageFile: null, isGenerating: false }
  ]);
  const [editorGroupId, setEditorGroupId] = useState(null);
  const handleKalibrasiGlobalChange = (e) => {
    const { name, value } = e.target;
    setKalibrasiGlobal((prev) => ({ ...prev, [name]: value }));
  };
  const handleKalibrasiEntryChange = (index, e) => {
    const { name, value } = e.target;
    setKalibrasiEntries((prev) => {
      const newEntries = [...prev];
      newEntries[index] = { ...newEntries[index], [name]: value };
      if (name === "lokasi1") {
        newEntries[index].lokasi2 = "";
      }
      return newEntries;
    });
  };
  const handleKalibrasiEquipToggle = (index, equip) => {
    setKalibrasiEntries((prev) => {
      const newEntries = [...prev];
      const current = newEntries[index].peralatan;
      let newPeralatan = [...current];
      if (newPeralatan.includes(equip)) {
        newPeralatan = newPeralatan.filter((e) => e !== equip);
      } else {
        newPeralatan.push(equip);
      }
      newEntries[index] = {
        ...newEntries[index],
        peralatan: newPeralatan,
        lokasi1: "",
        lokasi2: "",
        acLokasi: []
      };
      return newEntries;
    });
  };
  const handleKalibrasiAcLokasiToggle = (index, loc) => {
    setKalibrasiEntries((prev) => {
      const newEntries = [...prev];
      const current = newEntries[index].acLokasi || [];
      const newAcLokasi = current.includes(loc) ? current.filter((l) => l !== loc) : [...current, loc];
      newEntries[index] = { ...newEntries[index], acLokasi: newAcLokasi };
      return newEntries;
    });
  };
  const addKalibrasiEntry = () => {
    setKalibrasiEntries((prev) => [...prev, createEmptyKalibrasiEntry()]);
  };
  const removeKalibrasiEntry = (index) => {
    if (kalibrasiEntries.length <= 1) return;
    setKalibrasiEntries((prev) => {
      const newEntries = [...prev];
      newEntries.splice(index, 1);
      return newEntries;
    });
  };
  const handleKalibrasiPhotoUpload = (groupId, e) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files).map((file) => ({
        id: Date.now() + Math.random(),
        file,
        preview: URL.createObjectURL(file),
        zoom: 1
      }));
      setKalibrasiPhotoGroups((prev) => prev.map((group) => {
        if (group.id === groupId) {
          return { ...group, photos: [...group.photos, ...newPhotos] };
        }
        return group;
      }));
    }
  };
  const removeKalibrasiPhoto = (groupId, photoIndex) => {
    setKalibrasiPhotoGroups((prev) => prev.map((group) => {
      if (group.id === groupId) {
        const newPhotos = [...group.photos];
        URL.revokeObjectURL(newPhotos[photoIndex].preview);
        newPhotos.splice(photoIndex, 1);
        return { ...group, photos: newPhotos };
      }
      return group;
    }));
  };
  const updateKalibrasiPhotoZoom = (groupId, photoIndex, delta) => {
    setKalibrasiPhotoGroups((prev) => prev.map((group) => {
      if (group.id === groupId) {
        const newPhotos = [...group.photos];
        const currentZoom = newPhotos[photoIndex].zoom || 1;
        newPhotos[photoIndex].zoom = Math.max(0.5, Math.min(3, currentZoom + delta));
        return { ...group, photos: newPhotos };
      }
      return group;
    }));
  };
  const handleKalibrasiPhotoDrop = (e, groupId, targetIndex) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData("text/plain");
    if (!sourceIndexStr) return;
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (sourceIndex === targetIndex || isNaN(sourceIndex)) return;
    setKalibrasiPhotoGroups((prev) => prev.map((group) => {
      if (group.id === groupId) {
        const newPhotos = [...group.photos];
        const [movedPhoto] = newPhotos.splice(sourceIndex, 1);
        newPhotos.splice(targetIndex, 0, movedPhoto);
        return { ...group, photos: newPhotos };
      }
      return group;
    }));
  };
  const addKalibrasiPhotoGroup = () => {
    setKalibrasiPhotoGroups((prev) => [...prev, { id: Date.now(), photos: [], collageUrl: null, collageFile: null, isGenerating: false }]);
  };
  const removeKalibrasiPhotoGroup = (groupId) => {
    if (kalibrasiPhotoGroups.length <= 1) return;
    setKalibrasiPhotoGroups((prev) => {
      const groupToRemove = prev.find((g) => g.id === groupId);
      if (groupToRemove) {
        groupToRemove.photos.forEach((p) => URL.revokeObjectURL(p.preview));
      }
      return prev.filter((g) => g.id !== groupId);
    });
  };
  const renderKalibrasiPhotoSection = () => /* @__PURE__ */ jsxs("div", { className: "space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-2", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Camera, { className: "w-5 h-5 text-blue-600" }),
        " Lampiran Foto"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end gap-1", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded w-fit", children: "Kirim multi kolase sekaligus" }),
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-500 font-medium flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Move, { className: "w-3 h-3" }),
          " Geser foto untuk urutkan"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      kalibrasiPhotoGroups.map((group, groupIndex) => /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-5 bg-blue-50/30 border border-blue-100 rounded-xl space-y-4 relative shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center gap-3 justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1 w-full flex items-center gap-3", children: [
            /* @__PURE__ */ jsxs("h3", { className: "font-bold text-blue-900 text-sm", children: [
              "Grup Kolase ",
              groupIndex + 1
            ] }),
            group.photos.length > 0 && /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setEditorGroupId(group.id),
                className: "text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded-lg font-semibold flex items-center gap-1 shadow-sm transition-colors",
                children: [
                  /* @__PURE__ */ jsx(LayoutGrid, { className: "w-3 h-3" }),
                  " Edit Kolase (Pro)"
                ]
              }
            )
          ] }),
          kalibrasiPhotoGroups.length > 1 && /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => removeKalibrasiPhotoGroup(group.id),
              className: "text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-1 self-end sm:self-center text-sm font-bold",
              children: [
                /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }),
                " ",
                /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: "Hapus Grup" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("label", { className: "flex items-center justify-center w-full p-4 border-2 border-dashed border-blue-300 rounded-xl bg-white hover:bg-blue-50 cursor-pointer transition-colors group", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Camera, { className: "w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-blue-700", children: "Tambah Foto ke Kolase Ini" })
          ] }),
          /* @__PURE__ */ jsx("input", { type: "file", accept: "image/*", multiple: true, className: "hidden", onChange: (e) => handleKalibrasiPhotoUpload(group.id, e) })
        ] }) }),
        group.photos.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("p", { className: "text-xs font-semibold text-slate-500 mb-2", children: [
            "Daftar Foto (",
            group.photos.length,
            "):"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4", children: group.photos.map((photo, pIndex) => /* @__PURE__ */ jsxs(
            "div",
            {
              draggable: true,
              onDragStart: (e) => e.dataTransfer.setData("text/plain", pIndex.toString()),
              onDragOver: (e) => e.preventDefault(),
              onDrop: (e) => handleKalibrasiPhotoDrop(e, group.id, pIndex),
              className: "relative bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm group/photo hover:shadow-md transition-shadow aspect-square cursor-move flex flex-col",
              children: [
                /* @__PURE__ */ jsx("div", { className: "flex-1 relative overflow-hidden bg-black flex items-center justify-center", children: /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: photo.preview,
                    alt: "Preview",
                    className: "absolute w-full h-full object-cover transition-transform",
                    style: { transform: `scale(${photo.zoom || 1})` }
                  }
                ) }),
                /* @__PURE__ */ jsx("div", { className: "absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded backdrop-blur-sm z-10", children: pIndex + 1 }),
                /* @__PURE__ */ jsx("div", { className: "absolute top-1 right-1 flex flex-col gap-1 z-10 opacity-100 sm:opacity-0 group-hover/photo:opacity-100 transition-opacity", children: /* @__PURE__ */ jsx("button", { type: "button", onClick: (e) => {
                  e.preventDefault();
                  removeKalibrasiPhoto(group.id, pIndex);
                }, className: "bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-md", children: /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5" }) }) }),
                /* @__PURE__ */ jsxs("div", { className: "absolute bottom-1 right-1 flex gap-1 z-10 opacity-100 sm:opacity-0 group-hover/photo:opacity-100 transition-opacity", children: [
                  /* @__PURE__ */ jsx("button", { type: "button", onClick: (e) => {
                    e.preventDefault();
                    updateKalibrasiPhotoZoom(group.id, pIndex, 0.1);
                  }, className: "bg-white text-slate-700 p-1.5 rounded-full hover:bg-slate-100 shadow-md", children: /* @__PURE__ */ jsx(ZoomIn, { className: "w-3.5 h-3.5" }) }),
                  /* @__PURE__ */ jsx("button", { type: "button", onClick: (e) => {
                    e.preventDefault();
                    updateKalibrasiPhotoZoom(group.id, pIndex, -0.1);
                  }, className: "bg-white text-slate-700 p-1.5 rounded-full hover:bg-slate-100 shadow-md", children: /* @__PURE__ */ jsx(ZoomOut, { className: "w-3.5 h-3.5" }) })
                ] })
              ]
            },
            photo.id
          )) })
        ] }),
        group.collageUrl && /* @__PURE__ */ jsxs("div", { className: "mt-4 p-4 bg-white rounded-xl border border-blue-200", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-blue-800 mb-2", children: "Preview Kolase Kustom:" }),
          /* @__PURE__ */ jsx("img", { src: group.collageUrl, alt: "Custom Collage", className: "w-full max-w-sm rounded-lg shadow-sm border border-slate-200" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                setKalibrasiPhotoGroups((prev) => prev.map((g) => g.id === group.id ? { ...g, collageUrl: null, collageFile: null } : g));
              },
              className: "mt-2 text-xs text-red-600 font-semibold hover:text-red-700",
              children: "Hapus Kolase Kustom"
            }
          )
        ] })
      ] }, group.id)),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: addKalibrasiPhotoGroup,
          className: "w-full border-2 border-dashed border-blue-400 text-blue-700 font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2",
          children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-5 h-5" }),
            " Tambah Grup Kolase Baru"
          ]
        }
      )
    ] })
  ] });
  const handleKalibrasiSubmit = async (e) => {
    e.preventDefault();
    if (kalibrasiEntries.some((entry) => entry.peralatan.length === 0)) {
      alert("Pastikan Anda memilih minimal 1 peralatan untuk setiap lokasi kalibrasi yang ditambahkan!");
      return;
    }
    if (kalibrasiEntries.some((entry) => entry.peralatan.includes("Access Control") && (entry.acLokasi || []).length === 0)) {
      alert("Pastikan Anda mencentang minimal 1 lokasi untuk peralatan Access Control!");
      return;
    }
    let customFilesArray = [];
    for (let i = 0; i < kalibrasiPhotoGroups.length; i++) {
      const group = kalibrasiPhotoGroups[i];
      if (group.collageFile) {
        customFilesArray.push(group.collageFile);
      } else if (group.photos.length > 1) {
        const collageResult = await processPhotosToCollage(group.photos);
        if (collageResult) {
          const res = await fetch(collageResult.url);
          const blob = await res.blob();
          const file = new File([blob], `Dokumentasi_Kalibrasi_Kolase_${i + 1}_${Date.now()}.jpg`, { type: "image/jpeg" });
          customFilesArray.push(file);
        }
      } else if (group.photos.length === 1) {
        customFilesArray.push(group.photos[0].file);
      }
    }
    const message = generateWA_Kalibrasi(kalibrasiGlobal, kalibrasiEntries);
    await shareToWhatsApp(message, customFilesArray.length > 0 ? customFilesArray : null, () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3e3);
    });
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleKalibrasiSubmit, className: "p-4 sm:p-8 space-y-8 bg-slate-50/50", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-4", children: [
        /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-blue-600" }),
        " Waktu Pelaksanaan Kalibrasi"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Tanggal" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
            /* @__PURE__ */ jsx("input", { type: "date", name: "tanggal", required: true, value: kalibrasiGlobal.tanggal, onChange: handleKalibrasiGlobalChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-1", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Pukul Mulai" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Clock, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
            /* @__PURE__ */ jsx("input", { type: "time", name: "waktuMulai", required: true, value: kalibrasiGlobal.waktuMulai, onChange: handleKalibrasiGlobalChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-1", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Pukul Selesai" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Clock, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
            /* @__PURE__ */ jsx("input", { type: "time", name: "waktuSelesai", required: true, value: kalibrasiGlobal.waktuSelesai, onChange: handleKalibrasiGlobalChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-6", children: kalibrasiEntries.map((entry, index) => {
      const modelsObj = {
        "X-Ray": entry.xrayModel,
        "WTMD": entry.wtmdModel,
        "HHMD": entry.hhmdModel,
        "Body Scanner": entry.bsModel,
        "ETD": entry.etdModel
      };
      const kalibrasiLok1Opts = entry.peralatan.length > 0 ? getIntersectedLocations(entry.peralatan, modelsObj) : [];
      return /* @__PURE__ */ jsxs("div", { className: "bg-white border-2 border-blue-100 rounded-2xl p-5 sm:p-6 space-y-6 shadow-sm relative", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-b border-blue-100 pb-3", children: [
          /* @__PURE__ */ jsxs("h3", { className: "font-extrabold text-lg text-blue-900 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "w-5 h-5 text-blue-500" }),
            " Lokasi Kalibrasi #",
            index + 1
          ] }),
          kalibrasiEntries.length > 1 && /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => removeKalibrasiEntry(index),
              className: "flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors",
              children: [
                /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }),
                " Hapus"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-2", children: [
              /* @__PURE__ */ jsx(Cpu, { className: "w-4 h-4 inline-block text-blue-500 mr-1" }),
              " Peralatan ",
              /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 font-normal", children: "(Pilih 1 atau lebih)" })
            ] }),
            kalibrasiEquipments && kalibrasiEquipments.length > 0 ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3", children: kalibrasiEquipments.map((equip) => {
              const isACChecked = entry.peralatan.includes("Access Control");
              const isChecked = entry.peralatan.includes(equip);
              const isDisabled = isACChecked && equip !== "Access Control";
              return /* @__PURE__ */ jsxs(
                "label",
                {
                  className: `flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${isChecked ? "bg-blue-50 border-blue-500 shadow-sm font-semibold" : isDisabled ? "bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`,
                  children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "checkbox",
                        checked: isChecked,
                        disabled: isDisabled,
                        onChange: () => handleKalibrasiEquipToggle(index, equip),
                        className: "w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: `ml-2 text-sm ${isDisabled ? "text-slate-400" : "text-slate-700"}`, children: equip })
                  ]
                },
                equip
              );
            }) }) : /* @__PURE__ */ jsxs("div", { className: "p-4 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-sm", children: [
              /* @__PURE__ */ jsx("p", { className: "font-semibold mb-1", children: "Peralatan Belum Dikonfigurasi!" }),
              /* @__PURE__ */ jsxs("p", { children: [
                "Silakan menuju ",
                /* @__PURE__ */ jsx("b", { children: "Tab Data" }),
                " ",
                ">",
                " ",
                /* @__PURE__ */ jsx("b", { children: "Config Peralatan Kalibrasi" }),
                " untuk memilih jenis peralatan yang akan ditampilkan di sini."
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-2", children: [
              "Lokasi",
              entry.peralatan.includes("Access Control") && /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 font-normal", children: " (Pilih 1 atau lebih)" })
            ] }),
            entry.peralatan.includes("Access Control") ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-2", children: (() => {
              const acOpts = getGeneralLokasiOptions("Access Control");
              if (acOpts.length === 0) {
                return /* @__PURE__ */ jsxs("div", { className: "col-span-full p-3 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-sm", children: [
                  /* @__PURE__ */ jsx("p", { className: "font-semibold", children: "Lokasi Access Control belum tersedia." }),
                  /* @__PURE__ */ jsx("p", { children: "Pastikan data penempatan peralatan Access Control sudah diisi di database." })
                ] });
              }
              return acOpts.map((loc) => {
                const isChecked = (entry.acLokasi || []).includes(loc);
                return /* @__PURE__ */ jsxs(
                  "label",
                  {
                    className: `flex items-center p-2.5 border rounded-lg cursor-pointer transition-colors ${isChecked ? "bg-blue-50 border-blue-500 shadow-sm font-semibold" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`,
                    children: [
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "checkbox",
                          checked: isChecked,
                          onChange: () => handleKalibrasiAcLokasiToggle(index, loc),
                          className: "w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        }
                      ),
                      /* @__PURE__ */ jsx("span", { className: "ml-2 text-sm text-slate-700", children: loc })
                    ]
                  },
                  loc
                );
              });
            })() }) : /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
                /* @__PURE__ */ jsx(MapPin, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    name: "lokasi1",
                    required: true,
                    value: entry.lokasi1,
                    onChange: (e) => handleKalibrasiEntryChange(index, e),
                    disabled: kalibrasiLok1Opts.length === 0,
                    className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none disabled:bg-slate-200 disabled:opacity-70 disabled:cursor-not-allowed",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "", children: "- Pilih Lokasi -" }),
                      kalibrasiLok1Opts.map((opt) => /* @__PURE__ */ jsx("option", { value: opt, children: opt }, opt))
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("div", { className: "w-1/3", children: (() => {
                const options = getLokasi2Options(entry.lokasi1, entry.peralatan);
                const isDisabled = options.length === 0 || options.length === 1 && options[0] === "-";
                return /* @__PURE__ */ jsxs("select", { name: "lokasi2", value: entry.lokasi2, onChange: (e) => handleKalibrasiEntryChange(index, e), disabled: isDisabled, className: `w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none ${isDisabled ? "opacity-50 cursor-not-allowed bg-slate-200" : ""}`, children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "- No -" }),
                  options.map((opt) => /* @__PURE__ */ jsx("option", { value: opt, children: opt }, opt))
                ] });
              })() })
            ] })
          ] })
        ] }),
        entry.peralatan.includes("X-Ray") && /* @__PURE__ */ jsxs("div", { className: "bg-blue-50/40 p-4 sm:p-5 rounded-xl border border-blue-200 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-200 pb-3", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-blue-900 flex items-center gap-2", children: "⚡ Parameter X-Ray" }),
            /* @__PURE__ */ jsx("select", { name: "xrayModel", value: entry.xrayModel, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-blue-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer", children: getValidXRayModels(entry.lokasi1).map((model) => /* @__PURE__ */ jsx("option", { value: model, children: model === "Semua X-Ray" ? "-- Semua Model X-Ray --" : model.replace("X-Ray ", "") }, model)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "kV Vertikal" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "decimal", name: "xrayKvV", value: entry.xrayKvV, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "kV Horizontal" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "decimal", name: "xrayKvH", value: entry.xrayKvH, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "mA Vertikal" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "decimal", name: "xrayMaV", value: entry.xrayMaV, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "mA Horizontal" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "decimal", name: "xrayMaH", value: entry.xrayMaH, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Ontime Vertikal" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "decimal", name: "xrayOnV", value: entry.xrayOnV, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Ontime Horizontal" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "decimal", name: "xrayOnH", value: entry.xrayOnH, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Archive" }),
              /* @__PURE__ */ jsx("input", { type: "text", name: "xrayArchive", value: entry.xrayArchive, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" })
            ] })
          ] })
        ] }),
        entry.peralatan.includes("WTMD") && /* @__PURE__ */ jsxs("div", { className: "bg-indigo-50/40 p-4 sm:p-5 rounded-xl border border-indigo-200 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-200 pb-3", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-indigo-900 flex items-center gap-2", children: "🎛️ Parameter WTMD" }),
            /* @__PURE__ */ jsx("select", { name: "wtmdModel", value: entry.wtmdModel, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "px-3 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-indigo-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer", children: getValidModels(entry.lokasi1, "WTMD").map((model) => /* @__PURE__ */ jsx("option", { value: model, children: model === "Semua WTMD" ? "-- Semua Model WTMD --" : model.replace("WTMD ", "") }, model)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Z1" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "numeric", name: "wtmdZ1", value: entry.wtmdZ1, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Z2" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "numeric", name: "wtmdZ2", value: entry.wtmdZ2, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Z3" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "numeric", name: "wtmdZ3", value: entry.wtmdZ3, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Z4" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "numeric", name: "wtmdZ4", value: entry.wtmdZ4, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "LC" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "numeric", name: "wtmdLc", value: entry.wtmdLc, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "LS" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "numeric", name: "wtmdLs", value: entry.wtmdLs, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "UC" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "numeric", name: "wtmdUc", value: entry.wtmdUc, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "SE" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "numeric", name: "wtmdSe", value: entry.wtmdSe, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "DS" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "numeric", name: "wtmdDs", value: entry.wtmdDs, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" })
            ] })
          ] })
        ] }),
        entry.peralatan.includes("HHMD") && /* @__PURE__ */ jsx("div", { className: "bg-purple-50/40 p-4 sm:p-5 rounded-xl border border-purple-200 space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-200 pb-3", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-purple-900 flex items-center gap-2", children: "📱 Parameter HHMD" }),
          /* @__PURE__ */ jsx("select", { name: "hhmdModel", value: entry.hhmdModel, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "px-3 py-1.5 bg-white border border-purple-300 rounded-lg text-xs font-bold text-purple-800 focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer", children: getValidModels(entry.lokasi1, "HHMD").map((model) => /* @__PURE__ */ jsx("option", { value: model, children: model === "Semua HHMD" ? "-- Semua Model HHMD --" : model.replace("HHMD ", "") }, model)) })
        ] }) }),
        entry.peralatan.includes("Body Scanner") && /* @__PURE__ */ jsxs("div", { className: "bg-emerald-50/40 p-4 sm:p-5 rounded-xl border border-emerald-200 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-200 pb-3", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-emerald-900 flex items-center gap-2", children: "🔍 Parameter Body Scanner" }),
            /* @__PURE__ */ jsx("select", { name: "bsModel", value: entry.bsModel, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer", children: getValidModels(entry.lokasi1, "Body Scanner").map((model) => /* @__PURE__ */ jsx("option", { value: model, children: model === "Semua Body Scanner" ? "-- Semua Model Body Scanner --" : model.replace("Body Scanner ", "") }, model)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Test Tampilan Suspect Item" }),
              /* @__PURE__ */ jsxs("select", { name: "bsSuspect", value: entry.bsSuspect, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500", children: [
                /* @__PURE__ */ jsx("option", { value: "Normal", children: "Normal" }),
                /* @__PURE__ */ jsx("option", { value: "Error", children: "Error" }),
                /* @__PURE__ */ jsx("option", { value: "Perlu Penyetelan", children: "Perlu Penyetelan" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Test Monitor" }),
              /* @__PURE__ */ jsxs("select", { name: "bsMonitor", value: entry.bsMonitor, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500", children: [
                /* @__PURE__ */ jsx("option", { value: "Normal", children: "Normal" }),
                /* @__PURE__ */ jsx("option", { value: "Error", children: "Error" }),
                /* @__PURE__ */ jsx("option", { value: "Perlu Penyetelan", children: "Perlu Penyetelan" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Test Fungsi Scanning" }),
              /* @__PURE__ */ jsxs("select", { name: "bsScanning", value: entry.bsScanning, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500", children: [
                /* @__PURE__ */ jsx("option", { value: "Normal", children: "Normal" }),
                /* @__PURE__ */ jsx("option", { value: "Error", children: "Error" }),
                /* @__PURE__ */ jsx("option", { value: "Perlu Penyetelan", children: "Perlu Penyetelan" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Test Fungsi Kalibrasi" }),
              /* @__PURE__ */ jsxs("select", { name: "bsCalibration", value: entry.bsCalibration, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500", children: [
                /* @__PURE__ */ jsx("option", { value: "Normal", children: "Normal" }),
                /* @__PURE__ */ jsx("option", { value: "Error", children: "Error" }),
                /* @__PURE__ */ jsx("option", { value: "Perlu Penyetelan", children: "Perlu Penyetelan" })
              ] })
            ] })
          ] })
        ] }),
        entry.peralatan.includes("ETD") && /* @__PURE__ */ jsxs("div", { className: "bg-amber-50/40 p-4 sm:p-5 rounded-xl border border-amber-200 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-3", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-amber-900 flex items-center gap-2", children: "🧪 Parameter ETD" }),
            /* @__PURE__ */ jsx("select", { name: "etdModel", value: entry.etdModel, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-800 focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer", children: getValidModels(entry.lokasi1, "ETD").map((model) => /* @__PURE__ */ jsx("option", { value: model, children: model === "Semua ETD" ? "-- Semua Model ETD --" : model.replace("ETD ", "") }, model)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Sampling Test TNT" }),
              /* @__PURE__ */ jsxs("select", { name: "etdTnt", value: entry.etdTnt, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-amber-500", children: [
                /* @__PURE__ */ jsx("option", { value: "Alarm", children: "Alarm" }),
                /* @__PURE__ */ jsx("option", { value: "Tidak Alarm", children: "Tidak Alarm" }),
                /* @__PURE__ */ jsx("option", { value: "Error", children: "Error" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Sampling Test PETN" }),
              /* @__PURE__ */ jsxs("select", { name: "etdPetn", value: entry.etdPetn, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-amber-500", children: [
                /* @__PURE__ */ jsx("option", { value: "Alarm", children: "Alarm" }),
                /* @__PURE__ */ jsx("option", { value: "Tidak Alarm", children: "Tidak Alarm" }),
                /* @__PURE__ */ jsx("option", { value: "Error", children: "Error" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Sampling Test RDX" }),
              /* @__PURE__ */ jsxs("select", { name: "etdRdx", value: entry.etdRdx, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-amber-500", children: [
                /* @__PURE__ */ jsx("option", { value: "Alarm", children: "Alarm" }),
                /* @__PURE__ */ jsx("option", { value: "Tidak Alarm", children: "Tidak Alarm" }),
                /* @__PURE__ */ jsx("option", { value: "Error", children: "Error" })
              ] })
            ] })
          ] })
        ] }),
        entry.peralatan.includes("Access Control") && /* @__PURE__ */ jsxs("div", { className: "bg-rose-50/40 p-4 sm:p-5 rounded-xl border border-rose-200 space-y-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-rose-900 flex items-center gap-2 border-b border-rose-200 pb-2", children: "🔐 Parameter Access Control" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Fungsi Emlock" }),
            /* @__PURE__ */ jsxs("select", { name: "acEmlock", value: entry.acEmlock, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-rose-500", children: [
              /* @__PURE__ */ jsx("option", { value: "Berfungsi", children: "Berfungsi" }),
              /* @__PURE__ */ jsx("option", { value: "Tidak Berfungsi", children: "Tidak Berfungsi" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Fungsi Intercom" }),
            /* @__PURE__ */ jsxs("select", { name: "acIntercom", value: entry.acIntercom, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-rose-500", children: [
              /* @__PURE__ */ jsx("option", { value: "Berfungsi", children: "Berfungsi" }),
              /* @__PURE__ */ jsx("option", { value: "Tidak Berfungsi", children: "Tidak Berfungsi" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Fungsi Fingerprint" }),
            /* @__PURE__ */ jsxs("select", { name: "acFingerprint", value: entry.acFingerprint, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-rose-500", children: [
              /* @__PURE__ */ jsx("option", { value: "Berfungsi", children: "Berfungsi" }),
              /* @__PURE__ */ jsx("option", { value: "Tidak Berfungsi", children: "Tidak Berfungsi" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Fungsi CCTV" }),
            /* @__PURE__ */ jsxs("select", { name: "acCctv", value: entry.acCctv, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-rose-500", children: [
              /* @__PURE__ */ jsx("option", { value: "Berfungsi", children: "Berfungsi" }),
              /* @__PURE__ */ jsx("option", { value: "Tidak Berfungsi", children: "Tidak Berfungsi" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Fungsi Pengontrolan Kunci Pintu" }),
            /* @__PURE__ */ jsxs("select", { name: "acPengontrolan", value: entry.acPengontrolan, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-rose-500", children: [
              /* @__PURE__ */ jsx("option", { value: "Berfungsi", children: "Berfungsi" }),
              /* @__PURE__ */ jsx("option", { value: "Tidak Berfungsi", children: "Tidak Berfungsi" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Record CCTV" }),
            /* @__PURE__ */ jsx("input", { type: "text", name: "acRecordCctv", value: entry.acRecordCctv, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-rose-500" })
          ] })
        ] })
      ] }, entry.id);
    }) }),
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: addKalibrasiEntry,
        className: "w-full border-2 border-dashed border-blue-400 text-blue-700 font-bold py-4 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 mt-4",
        children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-5 h-5" }),
          " Tambah Lokasi Kalibrasi Berikutnya"
        ]
      }
    ),
    renderKalibrasiPhotoSection(),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row gap-4 mt-8", children: /* @__PURE__ */ jsx("button", { type: "submit", className: `w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${isCopied ? "bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]" : "bg-[#25D366] hover:bg-[#20b858] hover:-translate-y-0.5 text-white"}`, children: isCopied ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 animate-pulse" }),
      " Berhasil Disalin / Dibagikan!"
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Share2, { className: "w-6 h-6" }),
      " Share Kalibrasi ke WA"
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 border-t border-slate-200 pt-8", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-700 mb-4 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-blue-600" }),
        " Preview Laporan Kalibrasi (Real-time)"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative", children: /* @__PURE__ */ jsx("div", { className: "bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%] max-h-[500px] overflow-y-auto", children: generateWA_Kalibrasi(kalibrasiGlobal, kalibrasiEntries) }) })
    ] }),
    editorGroupId !== null && /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(
      CollageEditor$1,
      {
        photos: kalibrasiPhotoGroups.find((g) => g.id === editorGroupId)?.photos || [],
        isOpen: editorGroupId !== null,
        onClose: () => setEditorGroupId(null),
        onSave: (file, url) => {
          setKalibrasiPhotoGroups((prev) => prev.map((g) => g.id === editorGroupId ? { ...g, collageUrl: url, collageFile: file } : g));
          setEditorGroupId(null);
        }
      }
    ) })
  ] });
};
const TIP_MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const TabTip = () => {
  const { checklistDataMaster } = useMasterDataStore();
  const tipCategories = React.useMemo(() => {
    const cats = [];
    (checklistDataMaster || []).forEach((block) => {
      if (block.type === "location") {
        const xrayCat = block.categories?.find((c) => c.summaryKey && c.summaryKey.toUpperCase().includes("X-RAY"));
        if (xrayCat && xrayCat.items && xrayCat.items.length > 0) {
          cats.push({
            id: block.title.toLowerCase().replace(/\s+/g, "_"),
            name: block.title,
            items: xrayCat.items.map((item) => {
              const match = item.match(/\(([^)]+)\)/);
              return match ? match[1] : "No1";
            })
          });
        }
      } else if (block.type === "group") {
        (block.locations || []).forEach((loc) => {
          const xrayCat = loc.categories?.find((c) => c.summaryKey && c.summaryKey.toUpperCase().includes("X-RAY"));
          if (xrayCat && xrayCat.items && xrayCat.items.length > 0) {
            cats.push({
              id: loc.title.toLowerCase().replace(/\s+/g, "_"),
              name: loc.title,
              items: xrayCat.items.map((item) => {
                const match = item.match(/\(([^)]+)\)/);
                return match ? match[1] : "No1";
              })
            });
          }
        });
      }
    });
    return cats;
  }, [checklistDataMaster]);
  const tipLeftCol = tipCategories.slice(0, Math.ceil(tipCategories.length / 2));
  const tipRightCol = tipCategories.slice(Math.ceil(tipCategories.length / 2));
  const TIP_TOTAL_ITEMS = tipCategories.reduce((acc, cat) => acc + cat.items.length, 0);
  const [tipMonth, setTipMonth] = useState(TIP_MONTHS[(/* @__PURE__ */ new Date()).getMonth()]);
  const [tipYear, setTipYear] = useState((/* @__PURE__ */ new Date()).getFullYear().toString());
  const [tipDataState, setTipDataState] = useState({});
  const [tipLastSaved, setTipLastSaved] = useState(null);
  const [tipUnsavedChanges, setTipUnsavedChanges] = useState(false);
  const [isGeneratingTipImage, setIsGeneratingTipImage] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      const storageKey = `tip_data_${tipMonth}_${tipYear}`;
      try {
        const { data, error } = await supabase.from("master_configs").select("value").eq("key", storageKey).maybeSingle();
        if (!error && data && data.value) {
          setTipDataState(data.value.items || {});
          setTipLastSaved(data.value.lastSaved || null);
          setIsLoadingData(false);
          setTipUnsavedChanges(false);
          return;
        }
      } catch (err) {
        console.error("Gagal fetch dari supabase:", err);
      }
      setTipDataState({});
      setTipLastSaved(null);
      setIsLoadingData(false);
      setTipUnsavedChanges(false);
    };
    loadData();
  }, [tipMonth, tipYear]);
  useEffect(() => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("tip_data_")) {
        localStorage.removeItem(key);
      }
    });
  }, []);
  const getTipCheckedCount = () => {
    return Object.values(tipDataState).filter((d) => d.checked).length;
  };
  const handleTipToggle = (catId, item) => {
    const key = `${catId}-${item}`;
    const current = tipDataState[key] || { checked: false, locked: false };
    if (current.locked) return;
    setTipDataState((prev) => ({
      ...prev,
      [key]: { ...current, checked: !current.checked }
    }));
    setTipUnsavedChanges(true);
  };
  const handleTipCategoryToggle = (catId, items) => {
    const allChecked = items.every((i) => {
      const d = tipDataState[`${catId}-${i}`];
      return d && d.checked;
    });
    const newData = { ...tipDataState };
    let changed = false;
    items.forEach((i) => {
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
    const allItems = [...tipLeftCol, ...tipRightCol].flatMap((cat) => cat.items.map((i) => ({ catId: cat.id, item: i })));
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
  const handleTipSave = async () => {
    const now = /* @__PURE__ */ new Date();
    const timeString = `${now.getDate()} ${TIP_MONTHS[now.getMonth()]} ${now.getFullYear()} pukul ${String(now.getHours()).padStart(2, "0")}.${String(now.getMinutes()).padStart(2, "0")}`;
    const newData = { ...tipDataState };
    Object.keys(newData).forEach((k) => {
      if (newData[k].checked) {
        newData[k].locked = true;
      }
    });
    setTipDataState(newData);
    setTipLastSaved(timeString);
    setTipUnsavedChanges(false);
    const storageKey = `tip_data_${tipMonth}_${tipYear}`;
    const payload = { lastSaved: timeString, items: newData };
    try {
      await supabase.from("master_configs").upsert(
        { key: storageKey, value: payload, updated_at: (/* @__PURE__ */ new Date()).toISOString() },
        { onConflict: "key" }
      );
    } catch (err) {
      console.error("Gagal menyimpan progress ke server", err);
    }
  };
  const loadHtmlToImage = () => {
    return new Promise((resolve, reject) => {
      if (window.htmlToImage) return resolve(window.htmlToImage);
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js";
      script.onload = () => resolve(window.htmlToImage);
      script.onerror = () => reject(new Error("Gagal memuat script gambar"));
      document.head.appendChild(script);
    });
  };
  const handleTipShare = async () => {
    const element = document.getElementById("tip-export-area");
    const grid = document.getElementById("tip-export-grid");
    if (!element) return;
    setIsGeneratingTipImage(true);
    const originalGridClass = grid ? grid.className : "";
    const originalGridStyle = grid ? grid.style.cssText : "";
    const originalElementStyle = element.style.cssText;
    try {
      if (grid) {
        grid.className = "grid grid-cols-2 gap-6 w-full";
        grid.style.display = "grid";
        grid.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
        grid.style.gap = "2rem";
      }
      element.style.width = "1000px";
      element.style.maxWidth = "1000px";
      element.style.margin = "0 auto";
      element.style.padding = "40px";
      const htmlToImage = await loadHtmlToImage();
      await new Promise((r) => setTimeout(r, 100));
      const blob = await htmlToImage.toBlob(element, {
        backgroundColor: "#ffffff",
        pixelRatio: 2
      });
      if (!blob) throw new Error("Blob image is empty");
      const file = new File([blob], `TIP_Performance_${tipMonth}_${tipYear}.jpg`, { type: "image/jpeg" });
      const shareText = `Halo, berikut adalah status laporan TIP Performance bulan ${tipMonth} ${tipYear}.`;
      let canShare = false;
      try {
        canShare = navigator.canShare && navigator.canShare({ files: [file] });
      } catch (e) {
      }
      if (canShare) {
        try {
          await navigator.share({
            files: [file],
            title: "Laporan TIP T2",
            text: shareText
          });
          return;
        } catch (err) {
          console.error("Share dibatalkan/gagal", err);
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TIP_Performance_${tipMonth}_${tipYear}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
      const text = encodeURIComponent(shareText + " (Gambar telah otomatis diunduh)");
      window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Gagal membuat gambar laporan. Browser mungkin tidak mendukung.");
    } finally {
      if (grid) {
        grid.className = originalGridClass;
        grid.style.cssText = originalGridStyle;
      }
      element.style.cssText = originalElementStyle;
      setIsGeneratingTipImage(false);
    }
  };
  const renderTipTable = (columnData) => /* @__PURE__ */ jsx("table", { className: "w-full border-collapse border-[3px] border-slate-800 bg-white shadow-sm", children: /* @__PURE__ */ jsx("tbody", { children: columnData.map((cat) => {
    return cat.items.map((item, itemIdx) => {
      const key = `${cat.id}-${item}`;
      const data = tipDataState[key] || { checked: false, locked: false };
      const isLocked = data.locked;
      const isChecked = data.checked;
      const catItems = cat.items.map((i) => tipDataState[`${cat.id}-${i}`] || { checked: false, locked: false });
      const isAllCatChecked = catItems.every((i) => i.checked);
      return /* @__PURE__ */ jsxs("tr", { children: [
        itemIdx === 0 && /* @__PURE__ */ jsxs(
          "td",
          {
            rowSpan: cat.items.length,
            className: "border-r-[3px] border-b-[3px] border-slate-800 p-3 text-center align-middle w-[35%]",
            children: [
              /* @__PURE__ */ jsx("div", { className: "font-bold text-slate-800 mb-1", children: cat.name }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => handleTipCategoryToggle(cat.id, cat.items),
                  className: "text-slate-500 hover:text-emerald-600 transition-colors",
                  title: "Check/Uncheck kategori ini",
                  children: isAllCatChecked ? /* @__PURE__ */ jsx(CheckSquare, { className: "w-5 h-5 mx-auto text-emerald-600" }) : /* @__PURE__ */ jsx(Square, { className: "w-5 h-5 mx-auto" })
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsx("td", { className: "border-r-[3px] border-b-[2px] border-slate-800 p-2 text-center align-middle font-semibold text-slate-800 w-[30%] bg-white", children: item }),
        /* @__PURE__ */ jsx(
          "td",
          {
            onClick: () => handleTipToggle(cat.id, item),
            className: `border-b-[2px] border-slate-800 p-1 text-center align-middle transition-colors w-[35%] ${isLocked ? "bg-slate-100 cursor-not-allowed" : "hover:bg-slate-50 cursor-pointer bg-white"}`,
            children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-1.5 min-h-[32px]", children: [
              isChecked && /* @__PURE__ */ jsx(Check, { className: "w-6 h-6 text-emerald-600 font-bold", strokeWidth: 3 }),
              isLocked && /* @__PURE__ */ jsx(Lock, { className: "w-3.5 h-3.5 text-slate-400" })
            ] })
          }
        )
      ] }, key);
    });
  }) }) });
  return /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-8 space-y-6 bg-slate-50/50", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4 w-full md:w-auto", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1", children: "Bulan" }),
          /* @__PURE__ */ jsx(
            "select",
            {
              value: tipMonth,
              onChange: (e) => setTipMonth(e.target.value),
              className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer font-semibold text-slate-700",
              children: TIP_MONTHS.map((m) => /* @__PURE__ */ jsx("option", { value: m, children: m }, m))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1", children: "Tahun" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              value: tipYear,
              onChange: (e) => setTipYear(e.target.value),
              className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "w-full md:w-64 bg-slate-100 p-3 rounded-lg border border-slate-200", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs font-bold text-slate-600 mb-1.5", children: [
          /* @__PURE__ */ jsx("span", { children: "Progress Selesai" }),
          /* @__PURE__ */ jsxs("span", { className: "text-blue-700", children: [
            getTipCheckedCount(),
            " / ",
            TIP_TOTAL_ITEMS
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-full bg-slate-300 rounded-full h-2.5 overflow-hidden", children: /* @__PURE__ */ jsx(
          "div",
          {
            className: "bg-blue-600 h-2.5 rounded-full transition-all duration-500",
            style: { width: `${Math.round(getTipCheckedCount() / TIP_TOTAL_ITEMS * 100)}%` }
          }
        ) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row gap-3 items-stretch lg:items-center w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: handleTipToggleAll,
          className: "w-full lg:w-auto lg:mr-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors border border-slate-300 text-sm whitespace-nowrap",
          children: [
            /* @__PURE__ */ jsx(CheckSquare, { className: "w-4 h-4 text-emerald-600 shrink-0" }),
            "Checklist / Uncheck Semua"
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 w-full lg:w-auto flex-col sm:flex-row items-stretch", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: handleTipSave,
            disabled: !tipUnsavedChanges,
            className: `flex-1 flex items-center justify-center gap-2 px-6 py-2.5 font-bold rounded-lg transition-all text-sm whitespace-nowrap ${tipUnsavedChanges ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`,
            children: [
              /* @__PURE__ */ jsx(Save, { className: "w-4 h-4 shrink-0" }),
              " Simpan Progres"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: handleTipShare,
            disabled: tipUnsavedChanges || isGeneratingTipImage,
            className: `flex-1 flex items-center justify-center gap-2 px-6 py-2.5 font-bold rounded-lg transition-all text-sm whitespace-nowrap ${!tipUnsavedChanges && !isGeneratingTipImage ? "bg-[#25D366] hover:bg-[#20b858] text-white shadow-md" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`,
            children: [
              isGeneratingTipImage ? /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4 animate-spin shrink-0" }) : /* @__PURE__ */ jsx(Share2, { className: "w-4 h-4 shrink-0" }),
              "Share TIP ke WA"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "overflow-x-hidden bg-slate-100 rounded-xl p-2 sm:p-4 pb-8", children: /* @__PURE__ */ jsxs("div", { id: "tip-export-area", className: "w-full mx-auto bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-sm overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl sm:text-3xl font-extrabold text-slate-800 uppercase tracking-wide", children: [
          "T2 TIP PERFORMANCE ",
          tipMonth,
          " ",
          tipYear
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 italic mt-2 text-sm sm:text-base", children: tipLastSaved ? `Terakhir disimpan: ${tipLastSaved}` : "Belum ada data yang disimpan pada periode ini." })
      ] }),
      /* @__PURE__ */ jsxs("div", { id: "tip-export-grid", className: "flex flex-col gap-6 relative", children: [
        isLoadingData && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-10 bg-white/80 flex items-center justify-center rounded-xl", children: /* @__PURE__ */ jsx(Loader2, { className: "w-10 h-10 animate-spin text-blue-600" }) }),
        /* @__PURE__ */ jsx("div", { children: renderTipTable(tipLeftCol) }),
        /* @__PURE__ */ jsx("div", { children: renderTipTable(tipRightCol) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 text-center italic mt-2", children: "* Tombol Bagikan (WA) hanya akan aktif jika Anda sudah menyimpan (klik tombol Simpan) perubahan terbaru." })
  ] });
};
const TabChecklist = () => {
  const { isCopied, setIsCopied } = useAppStore();
  const { checklistDataMaster } = useMasterDataStore();
  const [checklistData, setChecklistData] = useState({
    tanggal: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    waktuMulai: "",
    waktuSelesai: ""
  });
  const [toggles, setToggles] = useState({});
  const [expandedAreas, setExpandedAreas] = useState({});
  const handleChecklistChange = (e) => {
    const { name, value } = e.target;
    setChecklistData((prev) => ({ ...prev, [name]: value }));
  };
  const toggleArea = (areaId) => {
    setExpandedAreas((prev) => ({ ...prev, [areaId]: !prev[areaId] }));
  };
  const toggleChecklistItem = (key) => {
    setToggles((prev) => ({ ...prev, [key]: prev[key] === false ? true : false }));
  };
  const handleChecklistSubmit = async (e) => {
    e.preventDefault();
    const message = generateWA_Checklist(checklistData, checklistDataMaster, toggles);
    await shareToWhatsApp(message, null, () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3e3);
    });
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleChecklistSubmit, className: "p-4 sm:p-8 space-y-8 bg-slate-50/50", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-4", children: [
        /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-blue-600" }),
        " Waktu Pelaksanaan Checklist"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Tanggal" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
            /* @__PURE__ */ jsx("input", { type: "date", name: "tanggal", required: true, value: checklistData.tanggal, onChange: handleChecklistChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-1", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Pukul Mulai" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Clock, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
            /* @__PURE__ */ jsx("input", { type: "time", name: "waktuMulai", required: true, value: checklistData.waktuMulai, onChange: handleChecklistChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-1", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Pukul Selesai" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Clock, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
            /* @__PURE__ */ jsx("input", { type: "time", name: "waktuSelesai", required: true, value: checklistData.waktuSelesai, onChange: handleChecklistChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row gap-4 mt-2", children: /* @__PURE__ */ jsx("button", { type: "submit", className: `w-full font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-300 transform ${isCopied ? "bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]" : "bg-[#25D366] hover:bg-[#20b858] hover:-translate-y-0.5 text-white"}`, children: isCopied ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 animate-pulse" }),
      " Checklist Berhasil Disalin!"
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Share2, { className: "w-6 h-6" }),
      " Share Checklist ke WA"
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 gap-2", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2", children: [
          /* @__PURE__ */ jsx(CheckSquare, { className: "w-5 h-5 text-blue-600" }),
          " Daftar Peralatan & Status"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-4 text-xs font-medium", children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-1 rounded", children: [
            /* @__PURE__ */ jsx(Check, { className: "w-3 h-3" }),
            " Operasi"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-red-700 bg-red-100 px-2 py-1 rounded", children: [
            /* @__PURE__ */ jsx(X, { className: "w-3 h-3" }),
            " Off"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-6", children: checklistDataMaster.map((block, bIdx) => {
        if (block.type === "location") {
          return /* @__PURE__ */ jsxs("div", { className: "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm", children: [
            /* @__PURE__ */ jsxs(
              "div",
              {
                onClick: () => toggleArea(block.title),
                className: "bg-slate-100 p-4 border-b border-slate-200 font-bold text-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-200 transition-colors",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(MapPin, { className: "w-5 h-5 text-slate-500" }),
                    " ",
                    block.title
                  ] }),
                  expandedAreas[block.title] ? /* @__PURE__ */ jsx(ChevronUp, { className: "w-5 h-5 text-slate-500" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "w-5 h-5 text-slate-500" })
                ]
              }
            ),
            expandedAreas[block.title] && /* @__PURE__ */ jsx("div", { className: "p-4 space-y-6", children: block.categories.map((cat, cIdx) => /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-blue-900 mb-3 bg-blue-50 px-3 py-1.5 rounded inline-block", children: cat.title }),
              /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: cat.items.map((item, iIdx) => {
                const key = `${block.title}|${cat.title}|${iIdx}`;
                const isOperasi = toggles[key] !== false;
                return /* @__PURE__ */ jsxs("div", { onClick: () => toggleChecklistItem(key), className: `flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all select-none shadow-sm hover:-translate-y-0.5 ${isOperasi ? "bg-emerald-50/50 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400" : "bg-red-50 border-red-300 hover:bg-red-100 hover:border-red-400"}`, children: [
                  /* @__PURE__ */ jsx("span", { className: `text-sm font-semibold ${isOperasi ? "text-emerald-900" : "text-red-900"}`, children: item }),
                  /* @__PURE__ */ jsx("button", { type: "button", className: `w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-colors shadow-sm ${isOperasi ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`, children: isOperasi ? /* @__PURE__ */ jsx(Check, { className: "w-5 h-5" }) : /* @__PURE__ */ jsx(X, { className: "w-5 h-5" }) })
                ] }, `item-${iIdx}`);
              }) })
            ] }, `cat-${cIdx}`)) })
          ] }, `loc-${bIdx}`);
        } else if (block.type === "group") {
          return /* @__PURE__ */ jsx("div", { className: "space-y-6", children: block.locations.map((loc, lIdx) => /* @__PURE__ */ jsxs("div", { className: "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm", children: [
            /* @__PURE__ */ jsxs(
              "div",
              {
                onClick: () => toggleArea(loc.title),
                className: "bg-slate-100 p-4 border-b border-slate-200 font-bold text-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-200 transition-colors",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(MapPin, { className: "w-5 h-5 text-slate-500" }),
                    " ",
                    loc.title
                  ] }),
                  expandedAreas[loc.title] ? /* @__PURE__ */ jsx(ChevronUp, { className: "w-5 h-5 text-slate-500" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "w-5 h-5 text-slate-500" })
                ]
              }
            ),
            expandedAreas[loc.title] && /* @__PURE__ */ jsx("div", { className: "p-4 space-y-6", children: loc.categories.map((cat, cIdx) => /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-blue-900 mb-3 bg-blue-50 px-3 py-1.5 rounded inline-block", children: cat.title }),
              /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: cat.items.map((item, iIdx) => {
                const key = `${loc.title}|${cat.title}|${iIdx}`;
                const isOperasi = toggles[key] !== false;
                return /* @__PURE__ */ jsxs("div", { onClick: () => toggleChecklistItem(key), className: `flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all select-none shadow-sm hover:-translate-y-0.5 ${isOperasi ? "bg-emerald-50/50 border-emerald-300 hover:bg-emerald-100" : "bg-red-50 border-red-300 hover:bg-red-100"}`, children: [
                  /* @__PURE__ */ jsx("span", { className: `text-sm font-semibold ${isOperasi ? "text-emerald-900" : "text-red-900"}`, children: item }),
                  /* @__PURE__ */ jsx("button", { type: "button", className: `w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-colors shadow-sm ${isOperasi ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`, children: isOperasi ? /* @__PURE__ */ jsx(Check, { className: "w-5 h-5" }) : /* @__PURE__ */ jsx(X, { className: "w-5 h-5" }) })
                ] }, `gitem-${iIdx}`);
              }) })
            ] }, `gcat-${cIdx}`)) })
          ] }, `gloc-${lIdx}`)) }, `grp-${bIdx}`);
        } else if (block.type === "access_control") {
          return /* @__PURE__ */ jsxs("div", { className: "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm", children: [
            /* @__PURE__ */ jsxs(
              "div",
              {
                onClick: () => toggleArea(block.title),
                className: "bg-slate-800 p-4 border-b border-slate-700 font-bold text-white flex items-center justify-between cursor-pointer hover:bg-slate-700 transition-colors",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(Cpu, { className: "w-5 h-5 text-slate-300" }),
                    " ",
                    block.title
                  ] }),
                  expandedAreas[block.title] ? /* @__PURE__ */ jsx(ChevronUp, { className: "w-5 h-5 text-slate-300" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "w-5 h-5 text-slate-300" })
                ]
              }
            ),
            expandedAreas[block.title] && /* @__PURE__ */ jsx("div", { className: "p-4 space-y-8", children: block.terminals.map((term, tIdx) => /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              term.title && /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-slate-800 border-b pb-2", children: term.title }),
              /* @__PURE__ */ jsx("div", { className: "space-y-6 pl-0 md:pl-4", children: term.categories.map((cat, cIdx) => /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-indigo-900 mb-3 bg-indigo-50 px-3 py-1.5 rounded inline-block", children: cat.title }),
                /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3", children: cat.items.map((item, iIdx) => {
                  const key = `${block.title}|${term.title}|${cat.title}|${iIdx}`;
                  const isOperasi = toggles[key] !== false;
                  return /* @__PURE__ */ jsxs("div", { onClick: () => toggleChecklistItem(key), className: `flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all select-none shadow-sm hover:-translate-y-0.5 ${isOperasi ? "bg-emerald-50/50 border-emerald-300 hover:bg-emerald-100" : "bg-red-50 border-red-300 hover:bg-red-100"}`, children: [
                    /* @__PURE__ */ jsx("span", { className: `text-sm font-semibold ${isOperasi ? "text-emerald-900" : "text-red-900"}`, children: item }),
                    /* @__PURE__ */ jsx("button", { type: "button", className: `w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-colors shadow-sm ${isOperasi ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`, children: isOperasi ? /* @__PURE__ */ jsx(Check, { className: "w-5 h-5" }) : /* @__PURE__ */ jsx(X, { className: "w-5 h-5" }) })
                  ] }, `titem-${iIdx}`);
                }) })
              ] }, `tcat-${cIdx}`)) })
            ] }, `term-${tIdx}`)) })
          ] }, `ac-${bIdx}`);
        }
        return null;
      }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row gap-4 mt-8 sticky bottom-6 z-10", children: /* @__PURE__ */ jsx("button", { type: "submit", className: `w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-2xl transition-all duration-300 transform ${isCopied ? "bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]" : "bg-[#25D366] hover:bg-[#20b858] hover:-translate-y-1 text-white border-4 border-white"}`, children: isCopied ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 animate-pulse" }),
      " Checklist Berhasil Disalin!"
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Share2, { className: "w-6 h-6" }),
      " Share Checklist ke WA"
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 border-t border-slate-200 pt-8", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-700 mb-4 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-blue-600" }),
        " Preview Laporan Checklist (Real-time)"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative", children: /* @__PURE__ */ jsx("div", { className: "bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%] max-h-[500px] overflow-y-auto", children: generateWA_Checklist(checklistData, checklistDataMaster, toggles) }) })
    ] })
  ] });
};
const CollageEditor = lazy(() => import("./CollageEditor-DPFEuQhx.js").then((m) => ({ default: m.CollageEditor })));
const TabBriefing = () => {
  const { isCopied, setIsCopied } = useAppStore();
  const [briefingData, setBriefingData] = useState(() => {
    const currentHour = (/* @__PURE__ */ new Date()).getHours();
    const isPagi = currentHour >= 8 && currentHour < 20;
    return {
      jenis: "Unit",
      // 'Unit' | 'MOT'
      tanggal: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      shift: isPagi ? "Pagi" : "Malam",
      lokasi: "Terminal 2"
    };
  });
  const [photos, setPhotos] = useState([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [customCollageFile, setCustomCollageFile] = useState(null);
  const [customCollageUrl, setCustomCollageUrl] = useState(null);
  const handleBriefingChange = (e) => {
    const { name, value } = e.target;
    setBriefingData({ ...briefingData, [name]: value });
  };
  const handlePhotoUpload = (e) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files).map((file) => ({
        id: Date.now() + Math.random(),
        file,
        preview: URL.createObjectURL(file),
        zoom: 1
      }));
      setPhotos((prev) => [...prev, ...newPhotos]);
    }
  };
  const removePhoto = (index) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };
  const updatePhotoZoom = (index, delta) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      const currentZoom = newPhotos[index].zoom || 1;
      newPhotos[index].zoom = Math.max(0.5, Math.min(3, currentZoom + delta));
      return newPhotos;
    });
  };
  const handlePhotoDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer?.getData("text/plain");
    if (!sourceIndexStr) return;
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (sourceIndex === targetIndex || isNaN(sourceIndex)) return;
    setPhotos((prev) => {
      const newPhotos = [...prev];
      const [movedPhoto] = newPhotos.splice(sourceIndex, 1);
      newPhotos.splice(targetIndex, 0, movedPhoto);
      return newPhotos;
    });
  };
  const handleBriefingSubmit = async (e) => {
    e.preventDefault();
    let generatedCollageFile = customCollageFile;
    if (photos.length > 0 && !generatedCollageFile) {
      const collageResult = await processPhotosToCollage(photos);
      if (collageResult) {
        collageResult.url;
        const res = await fetch(collageResult.url);
        const blob = await res.blob();
        generatedCollageFile = new File([blob], `Dokumentasi_Briefing_${Date.now()}.jpg`, { type: "image/jpeg" });
      }
    }
    const message = generateWA_Briefing(briefingData);
    await shareToWhatsApp(message, generatedCollageFile, () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3e3);
    });
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleBriefingSubmit, className: "p-6 sm:p-8 space-y-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2", children: [
        /* @__PURE__ */ jsx(Megaphone, { className: "w-5 h-5 text-blue-600" }),
        " Detail Briefing"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-4", children: /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-2", children: "Jenis Briefing" }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl flex-1 hover:bg-blue-50 transition-colors", children: [
            /* @__PURE__ */ jsx("input", { type: "radio", name: "jenis", value: "Unit", checked: briefingData.jenis === "Unit", onChange: handleBriefingChange, className: "w-4 h-4 text-blue-600 focus:ring-blue-500" }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-slate-700", children: "Briefing Unit SSES T2" })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl flex-1 hover:bg-blue-50 transition-colors", children: [
            /* @__PURE__ */ jsx("input", { type: "radio", name: "jenis", value: "MOT", checked: briefingData.jenis === "MOT", onChange: handleBriefingChange, className: "w-4 h-4 text-blue-600 focus:ring-blue-500" }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-slate-700", children: "Briefing MOT T2" })
          ] })
        ] }),
        briefingData.jenis === "MOT" && /* @__PURE__ */ jsxs("div", { className: "mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 animate-fadeIn shadow-sm", children: [
          /* @__PURE__ */ jsx("div", { className: "p-2 bg-white text-blue-600 rounded-lg shrink-0 border border-blue-100 shadow-sm", children: /* @__PURE__ */ jsx(ClipboardList, { className: "w-5 h-5" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-700 font-bold block mb-0.5", children: "Link Absensi :" }),
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "https://bit.ly/4h3EYMY?r=qr",
                target: "_blank",
                rel: "noopener noreferrer",
                className: "text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline break-all",
                children: "https://bit.ly/4h3EYMY?r=qr"
              }
            )
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(
      PhotoUploader,
      {
        photos,
        onUpload: handlePhotoUpload,
        onRemove: removePhoto,
        onZoom: updatePhotoZoom,
        onDrop: handlePhotoDrop,
        listType: "general",
        onOpenEditor: () => setIsEditorOpen(true)
      }
    ),
    customCollageUrl && /* @__PURE__ */ jsxs("div", { className: "mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-blue-800 mb-2", children: "Preview Kolase Kustom:" }),
      /* @__PURE__ */ jsx("img", { src: customCollageUrl, alt: "Custom Collage", className: "w-full max-w-sm rounded-lg shadow-sm border border-slate-200" }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
        setCustomCollageUrl(null);
        setCustomCollageFile(null);
      }, className: "mt-2 text-xs text-red-600 font-semibold hover:text-red-700", children: "Hapus Kolase Kustom" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-4 mt-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Tanggal" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
          /* @__PURE__ */ jsx("input", { type: "date", name: "tanggal", required: true, value: briefingData.tanggal, onChange: handleBriefingChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Shift" }),
        /* @__PURE__ */ jsxs("select", { name: "shift", value: briefingData.shift, onChange: handleBriefingChange, className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer", children: [
          /* @__PURE__ */ jsx("option", { value: "Pagi", children: "Pagi" }),
          /* @__PURE__ */ jsx("option", { value: "Malam", children: "Malam" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Lokasi" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(MapPin, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
          /* @__PURE__ */ jsx("input", { type: "text", name: "lokasi", required: true, value: briefingData.lokasi, onChange: handleBriefingChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row gap-4 mt-8", children: /* @__PURE__ */ jsx("button", { type: "submit", className: `w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${isCopied ? "bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]" : "bg-[#25D366] hover:bg-[#20b858] hover:shadow-xl hover:-translate-y-0.5 text-white"}`, children: isCopied ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 animate-pulse" }),
      " Berhasil Disalin / Dibagikan!"
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Share2, { className: "w-6 h-6" }),
      " Share Briefing ke WA"
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 border-t border-slate-200 pt-8", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-700 mb-4 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-blue-600" }),
        " Preview Laporan Briefing (Real-time)"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative", children: /* @__PURE__ */ jsx("div", { className: "bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%]", children: generateWA_Briefing(briefingData) }) })
    ] }),
    /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(
      CollageEditor,
      {
        photos,
        isOpen: isEditorOpen,
        onClose: () => setIsEditorOpen(false),
        onSave: (file, url) => {
          setCustomCollageFile(file);
          setCustomCollageUrl(url);
          setIsEditorOpen(false);
        }
      }
    ) })
  ] });
};
const useAuthStore = create((set) => ({
  user: null,
  isInitialized: false,
  isLoginModalOpen: false,
  setUser: (user) => set({ user }),
  setLoginModalOpen: (isOpen) => set({ isLoginModalOpen: isOpen }),
  initializeAuth: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ user: session?.user || null, isInitialized: true });
    supabase.auth.onAuthStateChange((_event, session2) => {
      set({ user: session2?.user || null });
    });
  },
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  }
}));
const ScheduleUploader = () => {
  const store = useMasterDataStore();
  const [selectedBulan, setSelectedBulan] = useState((/* @__PURE__ */ new Date()).getMonth() + 1);
  const [selectedTahun, setSelectedTahun] = useState((/* @__PURE__ */ new Date()).getFullYear());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ type: null, message: "" });
  const [historyList, setHistoryList] = useState([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const fetchHistory = async () => {
    setIsFetchingHistory(true);
    try {
      const { data, error } = await supabase.from("jadwal_shift").select("tanggal");
      if (error) throw error;
      const counts = {};
      data?.forEach((row) => {
        const yyyyMm = row.tanggal.substring(0, 7);
        counts[yyyyMm] = (counts[yyyyMm] || 0) + 1;
      });
      const list = Object.keys(counts).sort((a, b) => b.localeCompare(a)).slice(0, 12).map((ym) => ({ yearMonth: ym, count: counts[ym] }));
      setHistoryList(list);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setIsFetchingHistory(false);
    }
  };
  useEffect(() => {
    fetchHistory();
  }, []);
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadStatus({ type: null, message: "" });
    const yearStr = selectedTahun;
    const monthStr = String(selectedBulan).padStart(2, "0");
    const targetYm = `${yearStr}-${monthStr}`;
    if (historyList.some((h) => h.yearMonth === targetYm)) {
      setUploadStatus({ type: "error", message: `Jadwal untuk periode ${monthStr}-${yearStr} sudah ada. Harap hapus jadwal tersebut di histori sebelum melakukan upload ulang.` });
      setIsUploading(false);
      e.target.value = "";
      return;
    }
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      const allPersonel = [...store.dataApiT2, ...store.dataOmIasT2];
      const nikToIdMap = new Map(allPersonel.map((p) => [String(p.nik).trim(), p.id]));
      let headerRowIndex = -1;
      let codeColIndex = -1;
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row) continue;
        for (let j = 0; j < row.length; j++) {
          const cell = String(row[j] || "").trim().toUpperCase();
          if (cell === "CODE" || cell === "NIK") {
            headerRowIndex = i;
            codeColIndex = j;
            break;
          }
        }
        if (headerRowIndex !== -1) break;
      }
      if (headerRowIndex === -1 || codeColIndex === -1) {
        throw new Error('Gagal menemukan kolom "CODE" pada Excel. Pastikan format tabel sesuai.');
      }
      const headerRow = jsonData[headerRowIndex];
      const dateColumns = [];
      for (let j = 0; j < headerRow.length; j++) {
        const cellValue = Number(headerRow[j]);
        if (!isNaN(cellValue) && cellValue >= 1 && cellValue <= 31) {
          dateColumns.push({ colIndex: j, dateNum: cellValue });
        }
      }
      if (dateColumns.length === 0) {
        throw new Error("Gagal menemukan kolom tanggal (1-31) pada baris Header.");
      }
      const shiftsToInsert = [];
      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row) continue;
        const rawNik = String(row[codeColIndex] || "").trim();
        if (!rawNik) continue;
        const personelId = nikToIdMap.get(rawNik);
        if (!personelId) continue;
        for (const dateCol of dateColumns) {
          const shiftCode = String(row[dateCol.colIndex] || "").trim().toUpperCase();
          if (!shiftCode || shiftCode === "" || shiftCode === "-" || shiftCode.toLowerCase() === "off") {
            continue;
          }
          const yearStr2 = selectedTahun;
          const monthStr2 = String(selectedBulan).padStart(2, "0");
          const dayStr = String(dateCol.dateNum).padStart(2, "0");
          const dateString = `${yearStr2}-${monthStr2}-${dayStr}`;
          shiftsToInsert.push({
            personel_id: personelId,
            tanggal: dateString,
            shift: shiftCode,
            status_kehadiran: "Hadir"
          });
        }
      }
      if (shiftsToInsert.length === 0) {
        throw new Error("Tidak ada data shift valid yang ditemukan untuk dimasukkan.");
      }
      const { error } = await supabase.from("jadwal_shift").upsert(shiftsToInsert, { onConflict: "personel_id, tanggal" });
      if (error) throw new Error("Gagal menyimpan ke database: " + error.message);
      setUploadStatus({ type: "success", message: `Berhasil mengunggah jadwal untuk ${shiftsToInsert.length} shift.` });
      await fetchHistory();
    } catch (err) {
      setUploadStatus({ type: "error", message: err.message || "Terjadi kesalahan saat memproses Excel." });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };
  const handleDeleteSchedule = async (yearMonth) => {
    if (!window.confirm(`Anda yakin ingin menghapus seluruh jadwal untuk periode ${yearMonth}?`)) {
      return;
    }
    setIsDeleting(yearMonth);
    try {
      const startDate = `${yearMonth}-01`;
      const [year, month] = yearMonth.split("-").map(Number);
      const nextMonthDate = new Date(year, month, 1);
      const nextMonthStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}-01`;
      const { error } = await supabase.from("jadwal_shift").delete().gte("tanggal", startDate).lt("tanggal", nextMonthStr);
      if (error) throw error;
      await fetchHistory();
    } catch (err) {
      console.error("Failed to delete schedule:", err);
      alert("Gagal menghapus jadwal dari database.");
    } finally {
      setIsDeleting(null);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-slate-200 p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
      /* @__PURE__ */ jsx("div", { className: "p-3 bg-blue-100 text-blue-600 rounded-lg", children: /* @__PURE__ */ jsx(Calendar, { className: "w-6 h-6" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-slate-800", children: "Upload Jadwal Teknisi" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "Unggah file Excel (.xlsx) daftar jadwal bulanan." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 mb-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 mb-2", children: "Bulan" }),
        /* @__PURE__ */ jsx("select", { value: selectedBulan, onChange: (e) => setSelectedBulan(Number(e.target.value)), className: "w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none", children: ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, i) => /* @__PURE__ */ jsx("option", { value: i + 1, children: m }, i)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 mb-2", children: "Tahun" }),
        /* @__PURE__ */ jsx("input", { type: "number", value: selectedTahun, onChange: (e) => setSelectedTahun(Number(e.target.value)), className: "w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer text-center p-8", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "file",
          accept: ".xlsx, .xls",
          onChange: handleFileUpload,
          disabled: isUploading,
          className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        }
      ),
      isUploading ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center gap-3 text-blue-600", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "w-10 h-10 animate-spin" }),
        /* @__PURE__ */ jsx("p", { className: "font-bold", children: "Memproses File Excel..." })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center gap-3 text-blue-600", children: [
        /* @__PURE__ */ jsx(FileSpreadsheet, { className: "w-10 h-10" }),
        /* @__PURE__ */ jsx("p", { className: "font-bold", children: "Pilih File Excel Jadwal" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-blue-500", children: "Hanya .xlsx atau .xls (Format Harus Terdapat Kolom 'CODE' dan Angka 1-31)" })
      ] })
    ] }),
    uploadStatus.type === "success" && /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg", children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 flex-shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-bold", children: "Upload Berhasil!" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm", children: uploadStatus.message })
      ] })
    ] }),
    uploadStatus.type === "error" && /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5 flex-shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-bold", children: "Upload Gagal" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm", children: uploadStatus.message })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 border-t border-slate-200 pt-8", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-md font-bold text-slate-800 flex items-center gap-2 mb-4", children: [
        /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-blue-600" }),
        " Histori Upload Jadwal",
        isFetchingHistory && /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 text-blue-500 animate-spin" })
      ] }),
      historyList.length === 0 && !isFetchingHistory ? /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 italic", children: "Belum ada histori upload jadwal." }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: historyList.map((h) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-700", children: h.yearMonth }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500", children: [
            h.count,
            " data shift"
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleDeleteSchedule(h.yearMonth),
            disabled: isDeleting === h.yearMonth,
            className: "p-2 text-rose-600 hover:bg-rose-100 rounded-md transition-colors disabled:opacity-50",
            title: "Hapus Jadwal",
            children: isDeleting === h.yearMonth ? /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin" }) : /* @__PURE__ */ jsx(Trash2, { className: "w-5 h-5" })
          }
        )
      ] }, h.yearMonth)) })
    ] })
  ] });
};
const ChecklistDataEditor = () => {
  const store = useMasterDataStore();
  const [data, setData] = useState([]);
  useEffect(() => {
    setData(JSON.parse(JSON.stringify(store.checklistDataMaster)));
  }, [store.checklistDataMaster]);
  const handleSave = () => {
    store.setChecklistDataMaster(data);
    alert("Konfigurasi Checklist berhasil disimpan ke Supabase!");
  };
  const handleAddBlock = (type) => {
    const newData = [...data];
    if (type === "location") {
      newData.push({ type: "location", title: "Lokasi Baru", summary: "", categories: [] });
    } else if (type === "group") {
      newData.push({ type: "group", summary: "Grup Baru", locations: [] });
    } else if (type === "access_control") {
      newData.push({ type: "access_control", title: "Access Control Baru", summary: "", terminals: [] });
    }
    setData(newData);
  };
  const handleDeleteBlock = (idx) => {
    if (window.confirm("Hapus blok ini?")) {
      const newData = [...data];
      newData.splice(idx, 1);
      setData(newData);
    }
  };
  const handleMoveBlock = (idx, direction) => {
    if (direction === "up" && idx > 0) {
      const newData = [...data];
      [newData[idx - 1], newData[idx]] = [newData[idx], newData[idx - 1]];
      setData(newData);
    } else if (direction === "down" && idx < data.length - 1) {
      const newData = [...data];
      [newData[idx], newData[idx + 1]] = [newData[idx + 1], newData[idx]];
      setData(newData);
    }
  };
  const updateBlock = (idx, field, value) => {
    const newData = [...data];
    newData[idx][field] = value;
    setData(newData);
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-2xl shadow-sm border border-slate-200", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-6 border-b border-slate-200 pb-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-slate-800 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Settings, { className: "w-6 h-6 text-blue-600" }),
          " Editor Konfigurasi Checklist"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm mt-1", children: "Edit struktur checklist untuk WhatsApp. Perubahan akan langsung disimpan ke Supabase." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs("button", { onClick: () => {
          if (window.confirm("Reset checklist ke default bawaan sistem? Data saat ini di cloud akan tertimpa setelah Anda menekan Simpan ke Cloud.")) {
            setData(JSON.parse(JSON.stringify(DEFAULT_CHECKLIST_DATA)));
          }
        }, className: "flex items-center gap-2 px-4 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-xl transition-all shadow-sm border border-rose-200", children: [
          /* @__PURE__ */ jsx(RefreshCw, { className: "w-5 h-5" }),
          " Reset Default"
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: handleSave, className: "flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md", children: [
          /* @__PURE__ */ jsx(Save, { className: "w-5 h-5" }),
          " Simpan ke Cloud"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-6", children: data.map((block, bIdx) => /* @__PURE__ */ jsx(
      BlockEditor,
      {
        block,
        onUpdate: (field, val) => updateBlock(bIdx, field, val),
        onDelete: () => handleDeleteBlock(bIdx),
        onMoveUp: () => handleMoveBlock(bIdx, "up"),
        onMoveDown: () => handleMoveBlock(bIdx, "down"),
        isFirst: bIdx === 0,
        isLast: bIdx === data.length - 1
      },
      bIdx
    )) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 pt-6 border-t border-slate-200 flex flex-wrap gap-4", children: [
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => handleAddBlock("location"), className: "flex-1 min-w-[200px] py-3 border-2 border-dashed border-blue-300 text-blue-600 font-bold rounded-xl hover:bg-blue-50 flex items-center justify-center gap-2 transition-colors", children: [
        /* @__PURE__ */ jsx(Plus, { className: "w-5 h-5" }),
        " Tambah Blok Lokasi"
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => handleAddBlock("group"), className: "flex-1 min-w-[200px] py-3 border-2 border-dashed border-purple-300 text-purple-600 font-bold rounded-xl hover:bg-purple-50 flex items-center justify-center gap-2 transition-colors", children: [
        /* @__PURE__ */ jsx(Plus, { className: "w-5 h-5" }),
        " Tambah Blok Grup"
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => handleAddBlock("access_control"), className: "flex-1 min-w-[200px] py-3 border-2 border-dashed border-emerald-300 text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 flex items-center justify-center gap-2 transition-colors", children: [
        /* @__PURE__ */ jsx(Plus, { className: "w-5 h-5" }),
        " Tambah Blok Access Control"
      ] })
    ] })
  ] });
};
const BlockEditor = ({ block, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) => {
  const [isOpen, setIsOpen] = useState(false);
  return /* @__PURE__ */ jsxs("div", { className: `border rounded-xl overflow-hidden shadow-sm transition-all ${isOpen ? "border-blue-400 ring-2 ring-blue-50" : "border-slate-300"}`, children: [
    /* @__PURE__ */ jsxs("div", { className: `flex items-center justify-between p-4 cursor-pointer select-none transition-colors ${isOpen ? "bg-blue-50" : "bg-slate-100 hover:bg-slate-200"}`, onClick: () => setIsOpen(!isOpen), children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        isOpen ? /* @__PURE__ */ jsx(ChevronDown, { className: "w-5 h-5 text-slate-500" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "w-5 h-5 text-slate-500" }),
        /* @__PURE__ */ jsxs("span", { className: "font-bold text-slate-800", children: [
          block.type.toUpperCase(),
          ": ",
          block.title || block.summary || "Baru"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsx("button", { onClick: (e) => {
          e.stopPropagation();
          onMoveUp();
        }, disabled: isFirst, className: `p-2 rounded-lg transition-colors ${isFirst ? "text-slate-300" : "text-slate-500 hover:bg-slate-200"}`, children: /* @__PURE__ */ jsx(ArrowUp, { className: "w-5 h-5" }) }),
        /* @__PURE__ */ jsx("button", { onClick: (e) => {
          e.stopPropagation();
          onMoveDown();
        }, disabled: isLast, className: `p-2 rounded-lg transition-colors ${isLast ? "text-slate-300" : "text-slate-500 hover:bg-slate-200"}`, children: /* @__PURE__ */ jsx(ArrowDown, { className: "w-5 h-5" }) }),
        /* @__PURE__ */ jsx("div", { className: "w-px h-6 bg-slate-300 mx-1" }),
        /* @__PURE__ */ jsx("button", { onClick: (e) => {
          e.stopPropagation();
          onDelete();
        }, className: "p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors", children: /* @__PURE__ */ jsx(Trash2, { className: "w-5 h-5" }) })
      ] })
    ] }),
    isOpen && /* @__PURE__ */ jsxs("div", { className: "p-5 bg-white space-y-5 border-t border-slate-200", children: [
      block.type !== "group" && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 mb-1", children: "Nama/Judul Utama" }),
        /* @__PURE__ */ jsx("input", { className: "w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none", value: block.title || "", onChange: (e) => onUpdate("title", e.target.value) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 mb-1", children: "Teks Summary (WA)" }),
        /* @__PURE__ */ jsx("input", { className: "w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none", value: block.summary || "", onChange: (e) => onUpdate("summary", e.target.value) })
      ] }),
      block.type === "location" && /* @__PURE__ */ jsx(
        CategoryList,
        {
          categories: block.categories || [],
          onChange: (cats) => onUpdate("categories", cats)
        }
      ),
      block.type === "group" && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700", children: "Daftar Lokasi di Grup Ini" }),
        (block.locations || []).map((loc, lIdx) => /* @__PURE__ */ jsxs("div", { className: "p-4 border border-slate-200 rounded-xl bg-slate-50", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
            /* @__PURE__ */ jsx("input", { placeholder: "Nama Lokasi (ex: SSCP E)", className: "flex-1 p-2 border border-slate-300 rounded-lg font-bold", value: loc.title || "", onChange: (e) => {
              const newLocs = [...block.locations || []];
              newLocs[lIdx].title = e.target.value;
              onUpdate("locations", newLocs);
            } }),
            /* @__PURE__ */ jsx("button", { onClick: () => {
              if (lIdx > 0) {
                const newLocs = [...block.locations || []];
                [newLocs[lIdx - 1], newLocs[lIdx]] = [newLocs[lIdx], newLocs[lIdx - 1]];
                onUpdate("locations", newLocs);
              }
            }, disabled: lIdx === 0, className: `p-2 rounded-lg transition-colors ${lIdx === 0 ? "text-slate-300" : "text-slate-500 hover:bg-slate-200"}`, children: /* @__PURE__ */ jsx(ArrowUp, { className: "w-5 h-5" }) }),
            /* @__PURE__ */ jsx("button", { onClick: () => {
              if (lIdx < (block.locations?.length || 0) - 1) {
                const newLocs = [...block.locations || []];
                [newLocs[lIdx], newLocs[lIdx + 1]] = [newLocs[lIdx + 1], newLocs[lIdx]];
                onUpdate("locations", newLocs);
              }
            }, disabled: lIdx === (block.locations?.length || 0) - 1, className: `p-2 rounded-lg transition-colors ${lIdx === (block.locations?.length || 0) - 1 ? "text-slate-300" : "text-slate-500 hover:bg-slate-200"}`, children: /* @__PURE__ */ jsx(ArrowDown, { className: "w-5 h-5" }) }),
            /* @__PURE__ */ jsx("button", { onClick: () => {
              const newLocs = [...block.locations || []];
              newLocs.splice(lIdx, 1);
              onUpdate("locations", newLocs);
            }, className: "p-2 text-rose-500 bg-rose-100 rounded-lg", children: /* @__PURE__ */ jsx(Trash2, { className: "w-5 h-5" }) })
          ] }),
          /* @__PURE__ */ jsx(CategoryList, { categories: loc.categories || [], onChange: (cats) => {
            const newLocs = [...block.locations || []];
            newLocs[lIdx].categories = cats;
            onUpdate("locations", newLocs);
          } })
        ] }, lIdx)),
        /* @__PURE__ */ jsx("button", { onClick: () => onUpdate("locations", [...block.locations || [], { title: "Lokasi Baru", categories: [] }]), className: "text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100", children: "+ Tambah Lokasi" })
      ] }),
      block.type === "access_control" && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700", children: "Daftar Terminal" }),
        (block.terminals || []).map((term, tIdx) => /* @__PURE__ */ jsxs("div", { className: "p-4 border border-slate-200 rounded-xl bg-slate-50", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
            /* @__PURE__ */ jsx("input", { placeholder: "Nama Terminal (Opsional, ex: TERMINAL D)", className: "flex-1 p-2 border border-slate-300 rounded-lg font-bold", value: term.title || "", onChange: (e) => {
              const newTerms = [...block.terminals || []];
              newTerms[tIdx].title = e.target.value;
              onUpdate("terminals", newTerms);
            } }),
            /* @__PURE__ */ jsx("button", { onClick: () => {
              if (tIdx > 0) {
                const newTerms = [...block.terminals || []];
                [newTerms[tIdx - 1], newTerms[tIdx]] = [newTerms[tIdx], newTerms[tIdx - 1]];
                onUpdate("terminals", newTerms);
              }
            }, disabled: tIdx === 0, className: `p-2 rounded-lg transition-colors ${tIdx === 0 ? "text-slate-300" : "text-slate-500 hover:bg-slate-200"}`, children: /* @__PURE__ */ jsx(ArrowUp, { className: "w-5 h-5" }) }),
            /* @__PURE__ */ jsx("button", { onClick: () => {
              if (tIdx < (block.terminals?.length || 0) - 1) {
                const newTerms = [...block.terminals || []];
                [newTerms[tIdx], newTerms[tIdx + 1]] = [newTerms[tIdx + 1], newTerms[tIdx]];
                onUpdate("terminals", newTerms);
              }
            }, disabled: tIdx === (block.terminals?.length || 0) - 1, className: `p-2 rounded-lg transition-colors ${tIdx === (block.terminals?.length || 0) - 1 ? "text-slate-300" : "text-slate-500 hover:bg-slate-200"}`, children: /* @__PURE__ */ jsx(ArrowDown, { className: "w-5 h-5" }) }),
            /* @__PURE__ */ jsx("button", { onClick: () => {
              const newTerms = [...block.terminals || []];
              newTerms.splice(tIdx, 1);
              onUpdate("terminals", newTerms);
            }, className: "p-2 text-rose-500 bg-rose-100 rounded-lg", children: /* @__PURE__ */ jsx(Trash2, { className: "w-5 h-5" }) })
          ] }),
          /* @__PURE__ */ jsx(CategoryList, { categories: term.categories || [], onChange: (cats) => {
            const newTerms = [...block.terminals || []];
            newTerms[tIdx].categories = cats;
            onUpdate("terminals", newTerms);
          } })
        ] }, tIdx)),
        /* @__PURE__ */ jsx("button", { onClick: () => onUpdate("terminals", [...block.terminals || [], { title: "Terminal Baru", categories: [] }]), className: "text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100", children: "+ Tambah Terminal" })
      ] })
    ] })
  ] });
};
const CategoryList = ({ categories, onChange }) => {
  const updateCat = (idx, field, val) => {
    const newCats = [...categories];
    newCats[idx][field] = val;
    onChange(newCats);
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700", children: "Daftar Kategori & Peralatan" }),
    categories.map((cat, cIdx) => /* @__PURE__ */ jsxs("div", { className: "border border-indigo-100 rounded-xl p-4 bg-indigo-50/30 flex gap-4 items-start", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx("input", { placeholder: "Nama Kategori (ex: A. X-RAY)", className: "w-full p-2 border border-slate-300 rounded-lg text-sm font-bold", value: cat.title || "", onChange: (e) => updateCat(cIdx, "title", e.target.value) }) }),
          /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx("input", { placeholder: "Summary Key (opsional, ex: X-RAY)", className: "w-full p-2 border border-slate-300 rounded-lg text-sm", value: cat.summaryKey || "", onChange: (e) => updateCat(cIdx, "summaryKey", e.target.value) }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-500 mb-1", children: "Daftar Alat (1 Baris = 1 Alat)" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              className: "w-full p-3 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none whitespace-pre",
              rows: 4,
              value: (cat.items || []).join("\n"),
              onChange: (e) => {
                const items = e.target.value.split("\n").filter((s) => s.trim() !== "");
                updateCat(cIdx, "items", items);
              }
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => {
          if (cIdx > 0) {
            const newCats = [...categories];
            [newCats[cIdx - 1], newCats[cIdx]] = [newCats[cIdx], newCats[cIdx - 1]];
            onChange(newCats);
          }
        }, disabled: cIdx === 0, className: `p-2 rounded-lg transition-colors ${cIdx === 0 ? "text-indigo-200" : "text-indigo-500 hover:bg-indigo-100"}`, children: /* @__PURE__ */ jsx(ArrowUp, { className: "w-5 h-5" }) }),
        /* @__PURE__ */ jsx("button", { onClick: () => {
          if (cIdx < categories.length - 1) {
            const newCats = [...categories];
            [newCats[cIdx], newCats[cIdx + 1]] = [newCats[cIdx + 1], newCats[cIdx]];
            onChange(newCats);
          }
        }, disabled: cIdx === categories.length - 1, className: `p-2 rounded-lg transition-colors ${cIdx === categories.length - 1 ? "text-indigo-200" : "text-indigo-500 hover:bg-indigo-100"}`, children: /* @__PURE__ */ jsx(ArrowDown, { className: "w-5 h-5" }) }),
        /* @__PURE__ */ jsx("button", { onClick: () => {
          const newCats = [...categories];
          newCats.splice(cIdx, 1);
          onChange(newCats);
        }, className: "p-2 text-rose-500 hover:bg-rose-100 rounded-lg mt-1 transition-colors", children: /* @__PURE__ */ jsx(Trash2, { className: "w-5 h-5" }) })
      ] })
    ] }, cIdx)),
    /* @__PURE__ */ jsx("button", { onClick: () => onChange([...categories, { title: "", items: [] }]), className: "text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors", children: "+ Tambah Kategori" })
  ] });
};
const AssetMasterLokasi = () => {
  const [lokasiList, setLokasiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [formNama, setFormNama] = useState("");
  const [formKategori, setFormKategori] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editNama, setEditNama] = useState("");
  const [editKategori, setEditKategori] = useState("");
  useEffect(() => {
    loadLokasi();
  }, []);
  const loadLokasi = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("lokasi").select("*").order("nama");
    if (!error && data) {
      setLokasiList(data);
    }
    setLoading(false);
  };
  const handleAdd = async () => {
    if (!formNama.trim()) return alert("Nama lokasi harus diisi!");
    setLoading(true);
    const { error } = await supabase.from("lokasi").insert({
      nama: formNama.trim(),
      kategori: formKategori.trim() || null
    });
    if (!error) {
      setFormNama("");
      setFormKategori("");
      setIsAdding(false);
      await loadLokasi();
    } else {
      alert("Gagal menambah: " + error.message);
    }
    setLoading(false);
  };
  const handleUpdate = async (id) => {
    if (!editNama.trim()) return alert("Nama lokasi harus diisi!");
    setLoading(true);
    const { error } = await supabase.from("lokasi").update({
      nama: editNama.trim(),
      kategori: editKategori.trim() || null
    }).eq("id", id);
    if (!error) {
      setEditingId(null);
      await loadLokasi();
    } else {
      alert("Gagal menyimpan: " + error.message);
    }
    setLoading(false);
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus lokasi ini? Data penempatan yang terkait mungkin akan ikut terhapus atau error.")) return;
    setLoading(true);
    const { error } = await supabase.from("lokasi").delete().eq("id", id);
    if (!error) {
      await loadLokasi();
    } else {
      alert("Gagal menghapus: " + error.message);
    }
    setLoading(false);
  };
  if (loading && lokasiList.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "flex justify-center p-8", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-blue-500" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-slate-800 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(MapPin, { className: "w-5 h-5 text-blue-500" }),
        " Data Master Lokasi"
      ] }),
      !isAdding && /* @__PURE__ */ jsxs("button", { onClick: () => setIsAdding(true), className: "flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors", children: [
        /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
        " Tambah Lokasi"
      ] })
    ] }),
    isAdding && /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 p-4 rounded-xl border border-blue-200 flex flex-col sm:flex-row gap-3 items-end mb-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "w-full sm:flex-1", children: [
        /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-blue-800 mb-1", children: "Nama Lokasi" }),
        /* @__PURE__ */ jsx("input", { type: "text", value: formNama, onChange: (e) => setFormNama(e.target.value), className: "w-full p-2 border border-blue-200 rounded-lg text-sm", placeholder: "Contoh: SSCP D" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "w-full sm:flex-1", children: [
        /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-blue-800 mb-1", children: "Kategori (Opsional)" }),
        /* @__PURE__ */ jsx("input", { type: "text", value: formKategori, onChange: (e) => setFormKategori(e.target.value), className: "w-full p-2 border border-blue-200 rounded-lg text-sm", placeholder: "Contoh: Terminal 2D" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 w-full sm:w-auto", children: [
        /* @__PURE__ */ jsxs("button", { onClick: handleAdd, className: "flex-1 sm:flex-none flex justify-center items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700", children: [
          /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
          " Simpan"
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => setIsAdding(false), className: "flex-1 sm:flex-none flex justify-center items-center gap-1 bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-300", children: [
          /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }),
          " Batal"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-white border border-slate-200 rounded-xl overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 border-b border-slate-200 text-slate-600", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "p-3 font-semibold", children: "Nama Lokasi" }),
        /* @__PURE__ */ jsx("th", { className: "p-3 font-semibold", children: "Kategori" }),
        /* @__PURE__ */ jsx("th", { className: "p-3 font-semibold text-right", children: "Aksi" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-slate-200", children: [
        lokasiList.map((loc) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50", children: [
          /* @__PURE__ */ jsx("td", { className: "p-3", children: editingId === loc.id ? /* @__PURE__ */ jsx("input", { type: "text", value: editNama, onChange: (e) => setEditNama(e.target.value), className: "w-full p-1.5 border rounded" }) : /* @__PURE__ */ jsx("span", { className: "font-medium text-slate-800", children: loc.nama }) }),
          /* @__PURE__ */ jsx("td", { className: "p-3", children: editingId === loc.id ? /* @__PURE__ */ jsx("input", { type: "text", value: editKategori, onChange: (e) => setEditKategori(e.target.value), className: "w-full p-1.5 border rounded" }) : /* @__PURE__ */ jsx("span", { className: "text-slate-600", children: loc.kategori || "-" }) }),
          /* @__PURE__ */ jsx("td", { className: "p-3 text-right", children: editingId === loc.id ? /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => handleUpdate(loc.id), className: "text-emerald-600 hover:bg-emerald-50 p-1.5 rounded", children: /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }) }),
            /* @__PURE__ */ jsx("button", { onClick: () => setEditingId(null), className: "text-slate-500 hover:bg-slate-100 p-1.5 rounded", children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }) })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => {
              setEditingId(loc.id);
              setEditNama(loc.nama);
              setEditKategori(loc.kategori || "");
            }, className: "text-blue-600 hover:bg-blue-50 p-1.5 rounded", title: "Edit", children: /* @__PURE__ */ jsx(Edit2, { className: "w-4 h-4" }) }),
            /* @__PURE__ */ jsx("button", { onClick: () => handleDelete(loc.id), className: "text-red-600 hover:bg-red-50 p-1.5 rounded", title: "Hapus", children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }) })
          ] }) })
        ] }, loc.id)),
        lokasiList.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 3, className: "p-4 text-center text-slate-500", children: "Belum ada data lokasi." }) })
      ] })
    ] }) })
  ] });
};
const AssetMasterPeralatan = () => {
  const [jenisList, setJenisList] = useState([]);
  const [tipeList, setTipeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJenisId, setSelectedJenisId] = useState(null);
  const [isAddingJenis, setIsAddingJenis] = useState(false);
  const [formJenisNama, setFormJenisNama] = useState("");
  const [editingJenisId, setEditingJenisId] = useState(null);
  const [editJenisNama, setEditJenisNama] = useState("");
  const [isAddingTipe, setIsAddingTipe] = useState(false);
  const [formTipeNama, setFormTipeNama] = useState("");
  const [editingTipeId, setEditingTipeId] = useState(null);
  const [editTipeNama, setEditTipeNama] = useState("");
  useEffect(() => {
    loadJenis();
  }, []);
  useEffect(() => {
    if (selectedJenisId) {
      loadTipe(selectedJenisId);
    } else {
      setTipeList([]);
    }
  }, [selectedJenisId]);
  const loadJenis = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("jenis_peralatan").select("*").order("nama");
    if (!error && data) {
      setJenisList(data);
    }
    setLoading(false);
  };
  const loadTipe = async (idJenis) => {
    const { data, error } = await supabase.from("tipe_peralatan").select("*").eq("id_jenis", idJenis).order("nama");
    if (!error && data) {
      setTipeList(data);
    }
  };
  const handleAddJenis = async () => {
    if (!formJenisNama.trim()) return alert("Nama Jenis harus diisi!");
    setLoading(true);
    const { error } = await supabase.from("jenis_peralatan").insert({ nama: formJenisNama.trim() });
    if (!error) {
      setFormJenisNama("");
      setIsAddingJenis(false);
      await loadJenis();
    } else alert("Gagal: " + error.message);
    setLoading(false);
  };
  const handleUpdateJenis = async (id) => {
    if (!editJenisNama.trim()) return alert("Nama Jenis harus diisi!");
    setLoading(true);
    const { error } = await supabase.from("jenis_peralatan").update({ nama: editJenisNama.trim() }).eq("id", id);
    if (!error) {
      setEditingJenisId(null);
      await loadJenis();
    } else alert("Gagal: " + error.message);
    setLoading(false);
  };
  const handleDeleteJenis = async (id) => {
    if (!window.confirm("Yakin ingin menghapus Jenis ini? Tipe dan Penempatan terkait mungkin akan terhapus atau error.")) return;
    setLoading(true);
    const { error } = await supabase.from("jenis_peralatan").delete().eq("id", id);
    if (!error) {
      if (selectedJenisId === id) setSelectedJenisId(null);
      await loadJenis();
    } else alert("Gagal: " + error.message);
    setLoading(false);
  };
  const handleAddTipe = async () => {
    if (!formTipeNama.trim() || !selectedJenisId) return alert("Nama Tipe harus diisi!");
    const { error } = await supabase.from("tipe_peralatan").insert({ id_jenis: selectedJenisId, nama: formTipeNama.trim() });
    if (!error) {
      setFormTipeNama("");
      setIsAddingTipe(false);
      await loadTipe(selectedJenisId);
    } else alert("Gagal: " + error.message);
  };
  const handleUpdateTipe = async (id) => {
    if (!editTipeNama.trim() || !selectedJenisId) return alert("Nama Tipe harus diisi!");
    const { error } = await supabase.from("tipe_peralatan").update({ nama: editTipeNama.trim() }).eq("id", id);
    if (!error) {
      setEditingTipeId(null);
      await loadTipe(selectedJenisId);
    } else alert("Gagal: " + error.message);
  };
  const handleDeleteTipe = async (id) => {
    if (!window.confirm("Yakin ingin menghapus Tipe ini? Penempatan terkait mungkin akan terhapus atau error.")) return;
    const { error } = await supabase.from("tipe_peralatan").delete().eq("id", id);
    if (!error && selectedJenisId) {
      await loadTipe(selectedJenisId);
    } else alert("Gagal: " + (error?.message || "Unknown error"));
  };
  if (loading && jenisList.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "flex justify-center p-8", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-blue-500" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-slate-800 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Cpu, { className: "w-5 h-5 text-indigo-500" }),
          " Jenis Peralatan"
        ] }),
        !isAddingJenis && /* @__PURE__ */ jsxs("button", { onClick: () => setIsAddingJenis(true), className: "flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors", children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
          " Tambah Jenis"
        ] })
      ] }),
      isAddingJenis && /* @__PURE__ */ jsxs("div", { className: "bg-indigo-50 p-4 rounded-xl border border-indigo-200 flex flex-col gap-3 mb-4", children: [
        /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-indigo-800", children: "Nama Jenis Peralatan" }),
        /* @__PURE__ */ jsx("input", { type: "text", value: formJenisNama, onChange: (e) => setFormJenisNama(e.target.value), className: "w-full p-2 border border-indigo-200 rounded-lg text-sm", placeholder: "Contoh: X-Ray" }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxs("button", { onClick: handleAddJenis, className: "flex-1 flex justify-center items-center gap-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700", children: [
            /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
            " Simpan"
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: () => setIsAddingJenis(false), className: "flex-1 flex justify-center items-center gap-1 bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-300", children: [
            /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }),
            " Batal"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm", children: /* @__PURE__ */ jsxs("ul", { className: "divide-y divide-slate-200", children: [
        jenisList.map((jenis) => /* @__PURE__ */ jsxs(
          "li",
          {
            className: `p-3 flex items-center justify-between cursor-pointer transition-colors ${selectedJenisId === jenis.id ? "bg-indigo-50 border-l-4 border-indigo-500" : "hover:bg-slate-50 border-l-4 border-transparent"}`,
            onClick: (e) => {
              if (e.target.closest(".actions")) return;
              setSelectedJenisId(jenis.id);
            },
            children: [
              editingJenisId === jenis.id ? /* @__PURE__ */ jsx("input", { type: "text", value: editJenisNama, onChange: (e) => setEditJenisNama(e.target.value), className: "w-full p-1.5 border rounded text-sm mr-2" }) : /* @__PURE__ */ jsx("span", { className: `font-semibold ${selectedJenisId === jenis.id ? "text-indigo-900" : "text-slate-700"}`, children: jenis.nama }),
              /* @__PURE__ */ jsx("div", { className: "actions flex justify-end gap-1 shrink-0", children: editingJenisId === jenis.id ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("button", { onClick: () => handleUpdateJenis(jenis.id), className: "text-emerald-600 hover:bg-emerald-50 p-1.5 rounded", children: /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }) }),
                /* @__PURE__ */ jsx("button", { onClick: () => setEditingJenisId(null), className: "text-slate-500 hover:bg-slate-100 p-1.5 rounded", children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }) })
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("button", { onClick: () => {
                  setEditingJenisId(jenis.id);
                  setEditJenisNama(jenis.nama);
                }, className: "text-blue-600 hover:bg-blue-50 p-1.5 rounded", children: /* @__PURE__ */ jsx(Edit2, { className: "w-4 h-4" }) }),
                /* @__PURE__ */ jsx("button", { onClick: () => handleDeleteJenis(jenis.id), className: "text-red-600 hover:bg-red-50 p-1.5 rounded", children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }) }),
                /* @__PURE__ */ jsx(ChevronRight, { className: `w-5 h-5 ml-2 ${selectedJenisId === jenis.id ? "text-indigo-500" : "text-slate-300"}` })
              ] }) })
            ]
          },
          jenis.id
        )),
        jenisList.length === 0 && /* @__PURE__ */ jsx("li", { className: "p-4 text-center text-slate-500 text-sm", children: "Belum ada data." })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-800 flex items-center gap-2", children: "Tipe / Model Mesin" }),
        selectedJenisId && !isAddingTipe && /* @__PURE__ */ jsxs("button", { onClick: () => setIsAddingTipe(true), className: "flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors", children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
          " Tambah Tipe"
        ] })
      ] }),
      !selectedJenisId ? /* @__PURE__ */ jsx("div", { className: "p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-sm", children: "Pilih Jenis Peralatan di sebelah kiri terlebih dahulu untuk melihat dan mengelola tipe mesinnya." }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        isAddingTipe && /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 p-4 rounded-xl border border-blue-200 flex flex-col gap-3 mb-4", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-blue-800", children: "Nama Tipe / Model" }),
          /* @__PURE__ */ jsx("input", { type: "text", value: formTipeNama, onChange: (e) => setFormTipeNama(e.target.value), className: "w-full p-2 border border-blue-200 rounded-lg text-sm", placeholder: "Contoh: Rapiscan 620DV" }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxs("button", { onClick: handleAddTipe, className: "flex-1 flex justify-center items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700", children: [
              /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
              " Simpan"
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: () => setIsAddingTipe(false), className: "flex-1 flex justify-center items-center gap-1 bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-300", children: [
              /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }),
              " Batal"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm", children: /* @__PURE__ */ jsxs("ul", { className: "divide-y divide-slate-200", children: [
          tipeList.map((tipe) => /* @__PURE__ */ jsxs("li", { className: "p-3 flex items-center justify-between hover:bg-slate-50 transition-colors", children: [
            editingTipeId === tipe.id ? /* @__PURE__ */ jsx("input", { type: "text", value: editTipeNama, onChange: (e) => setEditTipeNama(e.target.value), className: "w-full p-1.5 border rounded text-sm mr-2" }) : /* @__PURE__ */ jsx("span", { className: "font-medium text-slate-700 text-sm", children: tipe.nama }),
            /* @__PURE__ */ jsx("div", { className: "flex justify-end gap-1 shrink-0", children: editingTipeId === tipe.id ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("button", { onClick: () => handleUpdateTipe(tipe.id), className: "text-emerald-600 hover:bg-emerald-50 p-1.5 rounded", children: /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }) }),
              /* @__PURE__ */ jsx("button", { onClick: () => setEditingTipeId(null), className: "text-slate-500 hover:bg-slate-100 p-1.5 rounded", children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }) })
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("button", { onClick: () => {
                setEditingTipeId(tipe.id);
                setEditTipeNama(tipe.nama);
              }, className: "text-blue-600 hover:bg-blue-50 p-1.5 rounded", children: /* @__PURE__ */ jsx(Edit2, { className: "w-4 h-4" }) }),
              /* @__PURE__ */ jsx("button", { onClick: () => handleDeleteTipe(tipe.id), className: "text-red-600 hover:bg-red-50 p-1.5 rounded", children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }) })
            ] }) })
          ] }, tipe.id)),
          tipeList.length === 0 && /* @__PURE__ */ jsx("li", { className: "p-4 text-center text-slate-500 text-sm", children: "Belum ada data tipe untuk jenis ini." })
        ] }) })
      ] })
    ] })
  ] });
};
const AssetManager = () => {
  const { initializeSupabaseData } = useMasterDataStore();
  const [activeTab, setActiveTab] = useState("penempatan");
  const [locations, setLocations] = useState([]);
  const [jenisData, setJenisData] = useState([]);
  const [tipeData, setTipeData] = useState([]);
  const [allAssets, setAllAssets] = useState([]);
  const [loadingBase, setLoadingBase] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterJenis, setFilterJenis] = useState("");
  const [filterLokasi, setFilterLokasi] = useState("");
  const [formJenis, setFormJenis] = useState("");
  const [formTipe, setFormTipe] = useState("");
  const [formLokasi, setFormLokasi] = useState("");
  const [formTitik, setFormTitik] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  useEffect(() => {
    if (activeTab === "penempatan") {
      loadBaseData();
    }
  }, [activeTab]);
  const loadBaseData = async () => {
    setLoadingBase(true);
    try {
      const [lokRes, jenisRes, tipeRes, assetRes] = await Promise.all([
        supabase.from("lokasi").select("id, nama").order("nama"),
        supabase.from("jenis_peralatan").select("id, nama").order("nama"),
        supabase.from("tipe_peralatan").select("id, id_jenis, nama, varian").order("nama"),
        supabase.from("penempatan_peralatan").select(`
          id,
          is_active,
          id_lokasi,
          tipe_peralatan ( id, id_jenis, nama, jenis_peralatan ( nama ) ),
          titik_lokasi ( id, nomor ),
          lokasi ( id, nama )
        `)
      ]);
      if (lokRes.data) setLocations(lokRes.data);
      if (jenisRes.data) setJenisData(jenisRes.data);
      if (tipeRes.data) setTipeData(tipeRes.data);
      if (assetRes.data) {
        const sorted = assetRes.data.sort((a, b) => {
          const numA = parseInt(a.titik_lokasi?.nomor?.replace(/[^0-9]/g, "") || "0", 10);
          const numB = parseInt(b.titik_lokasi?.nomor?.replace(/[^0-9]/g, "") || "0", 10);
          return numA - numB;
        });
        setAllAssets(sorted);
      }
    } catch (err) {
      console.error("Failed to load base data", err);
    } finally {
      setLoadingBase(false);
    }
  };
  const handleAddAsset = async () => {
    if (!formLokasi || !formTipe || !formTitik.trim()) {
      setErrorMsg("Mohon lengkapi semua field (Lokasi, Tipe, Titik)!");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      const titikArray = formTitik.split(",").map((t) => t.trim()).filter((t) => t.length > 0);
      if (titikArray.length === 0) {
        throw new Error("Format titik tidak valid.");
      }
      for (const titikStr of titikArray) {
        let titikId = null;
        const { data: existingTitik, error: titikErr } = await supabase.from("titik_lokasi").select("id").eq("id_lokasi", formLokasi).eq("nomor", titikStr).maybeSingle();
        if (existingTitik) {
          titikId = existingTitik.id;
        } else {
          const { data: newTitik, error: insertErr } = await supabase.from("titik_lokasi").insert({ id_lokasi: formLokasi, nomor: titikStr }).select("id").single();
          if (insertErr) throw insertErr;
          titikId = newTitik.id;
        }
        const { error: penempatanErr } = await supabase.from("penempatan_peralatan").insert({
          id_tipe: formTipe,
          id_lokasi: formLokasi,
          id_titik: titikId,
          is_active: true
        });
        if (penempatanErr) throw penempatanErr;
      }
      setFormTitik("");
      await loadBaseData();
      initializeSupabaseData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteAsset = async (id) => {
    if (!window.confirm("Yakin ingin menghapus mesin ini dari area ini secara permanen?")) return;
    try {
      const { error } = await supabase.from("penempatan_peralatan").delete().eq("id", id);
      if (error) throw error;
      await loadBaseData();
      initializeSupabaseData();
    } catch (err) {
      console.error("Gagal menghapus aset", err);
      alert("Gagal menghapus aset.");
    }
  };
  const locationsWithFilteredJenis = locations.filter((loc) => {
    if (!filterJenis) return true;
    return allAssets.some((a) => a.id_lokasi === loc.id && a.tipe_peralatan?.id_jenis === filterJenis);
  });
  useEffect(() => {
    if (filterJenis && filterLokasi) {
      const isValid = locationsWithFilteredJenis.some((l) => l.id === filterLokasi);
      if (!isValid) setFilterLokasi("");
    }
  }, [filterJenis]);
  const displayAssets = allAssets.filter((a) => {
    if (filterJenis && a.tipe_peralatan?.id_jenis !== filterJenis) return false;
    if (filterLokasi && a.id_lokasi !== filterLokasi) return false;
    return true;
  });
  const filteredTipeForForm = tipeData.filter((t) => t.id_jenis === formJenis);
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex border-b border-slate-200 bg-slate-50 overflow-x-auto hide-scrollbar", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setActiveTab("penempatan"),
          className: `flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition-colors ${activeTab === "penempatan" ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`,
          children: [
            /* @__PURE__ */ jsx(LayoutGrid, { className: "w-4 h-4" }),
            " Penempatan Mesin"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setActiveTab("lokasi"),
          className: `flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition-colors ${activeTab === "lokasi" ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`,
          children: [
            /* @__PURE__ */ jsx(MapPin, { className: "w-4 h-4" }),
            " Master Lokasi"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setActiveTab("peralatan"),
          className: `flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition-colors ${activeTab === "peralatan" ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`,
          children: [
            /* @__PURE__ */ jsx(Database, { className: "w-4 h-4" }),
            " Master Peralatan"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
      activeTab === "lokasi" && /* @__PURE__ */ jsx(AssetMasterLokasi, {}),
      activeTab === "peralatan" && /* @__PURE__ */ jsx(AssetMasterPeralatan, {}),
      activeTab === "penempatan" && (loadingBase ? /* @__PURE__ */ jsx("div", { className: "flex justify-center p-12", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 text-blue-500 animate-spin" }) }) : /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [
        /* @__PURE__ */ jsx("div", { className: "lg:col-span-1", children: /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 p-5 rounded-xl border border-blue-100 sticky top-4", children: [
          /* @__PURE__ */ jsxs("h3", { className: "font-bold text-blue-900 mb-4 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-5 h-5" }),
            " Tambah Penempatan"
          ] }),
          errorMsg && /* @__PURE__ */ jsxs("div", { className: "mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg flex items-start gap-2", children: [
            /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsx("p", { children: errorMsg })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-blue-800 mb-1", children: "Jenis Peralatan" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: formJenis,
                  onChange: (e) => {
                    setFormJenis(e.target.value);
                    setFormTipe("");
                  },
                  className: "w-full p-2 border border-blue-200 rounded-lg text-sm bg-white",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "-- Pilih Jenis --" }),
                    jenisData.map((j) => /* @__PURE__ */ jsx("option", { value: j.id, children: j.nama }, j.id))
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-blue-800 mb-1", children: "Tipe / Model Mesin" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: formTipe,
                  onChange: (e) => setFormTipe(e.target.value),
                  disabled: !formJenis,
                  className: "w-full p-2 border border-blue-200 rounded-lg text-sm bg-white disabled:opacity-50",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "-- Pilih Tipe --" }),
                    filteredTipeForForm.map((t) => /* @__PURE__ */ jsx("option", { value: t.id, children: t.nama }, t.id))
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-blue-800 mb-1", children: "Lokasi" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: formLokasi,
                  onChange: (e) => setFormLokasi(e.target.value),
                  className: "w-full p-2 border border-blue-200 rounded-lg text-sm bg-white",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "- Pilih Lokasi -" }),
                    locations.map((loc) => /* @__PURE__ */ jsx("option", { value: loc.id, children: loc.nama }, loc.id))
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-xs font-semibold text-blue-800 mb-1", children: [
                "Nomor Titik ",
                /* @__PURE__ */ jsx("span", { className: "font-normal text-blue-600", children: "(Bisa multi, pisah dengan koma)" })
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: formTitik,
                  onChange: (e) => setFormTitik(e.target.value),
                  placeholder: "Contoh: 1, 2, 3",
                  className: "w-full p-2 border border-blue-200 rounded-lg text-sm bg-white"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: handleAddAsset,
                disabled: saving || !formTipe || !formLokasi || !formTitik.trim(),
                className: "w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2",
                children: [
                  saving ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
                  "Simpan Penempatan"
                ]
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2", children: [
          /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6", children: /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-slate-800 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Layers, { className: "w-5 h-5 text-slate-500" }),
            " Daftar Mesin Terpasang"
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Filter Jenis Peralatan" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: filterJenis,
                  onChange: (e) => setFilterJenis(e.target.value),
                  className: "w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-medium",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "Semua Jenis Peralatan" }),
                    jenisData.map((j) => /* @__PURE__ */ jsx("option", { value: j.id, children: j.nama }, j.id))
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Filter Lokasi" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: filterLokasi,
                  onChange: (e) => setFilterLokasi(e.target.value),
                  className: "w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-medium",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "- Pilih Lokasi -" }),
                    locationsWithFilteredJenis.map((loc) => /* @__PURE__ */ jsx("option", { value: loc.id, children: loc.nama }, loc.id))
                  ]
                }
              )
            ] })
          ] }),
          displayAssets.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50", children: /* @__PURE__ */ jsx("p", { className: "text-slate-500", children: "Tidak ada data penempatan sesuai filter." }) }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: displayAssets.map((asset) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-xl bg-white hover:border-blue-300 transition-colors shadow-sm gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "bg-slate-100 p-2.5 rounded-lg shrink-0", children: /* @__PURE__ */ jsx(Cpu, { className: "w-5 h-5 text-slate-600" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded flex items-center gap-1", children: [
                    /* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3" }),
                    " ",
                    asset.lokasi?.nama || "Unknown"
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded", children: asset.tipe_peralatan?.jenis_peralatan?.nama || "Unknown" }),
                  !asset.is_active && /* @__PURE__ */ jsx("span", { className: "text-xs font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded", children: "Nonaktif" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800", children: asset.tipe_peralatan?.nama || "Tipe Tidak Diketahui" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-sm text-slate-500 mt-1", children: [
                  /* @__PURE__ */ jsx(Hash, { className: "w-3.5 h-3.5" }),
                  " Titik: ",
                  /* @__PURE__ */ jsx("strong", { className: "text-slate-700", children: asset.titik_lokasi?.nomor || "-" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => handleDeleteAsset(asset.id),
                className: "flex items-center justify-center gap-1 px-3 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors sm:w-auto w-full shrink-0",
                children: [
                  /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }),
                  " Hapus"
                ]
              }
            )
          ] }, asset.id)) })
        ] })
      ] }))
    ] })
  ] });
};
const TabData = () => {
  const { user, logout } = useAuthStore();
  if (!user) {
    return /* @__PURE__ */ jsx(AdminLogin, {});
  }
  return /* @__PURE__ */ jsx(AdminDashboard, { logout });
};
const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (signInError) {
      setError("Email atau password salah.");
    }
    setLoading(false);
  };
  return /* @__PURE__ */ jsx("div", { className: "p-6 md:p-12 flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500", children: /* @__PURE__ */ jsxs("div", { className: "bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center mb-8", children: [
      /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(Lock, { className: "w-8 h-8 text-blue-600" }) }),
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-slate-800", children: "Admin Area" }),
      /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-center mt-2 text-sm", children: "Masuk untuk mengelola master data dan database peralatan." })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleLogin, className: "space-y-5", children: [
      error && /* @__PURE__ */ jsxs("div", { className: "bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium flex items-start gap-3 border border-rose-100", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "w-5 h-5 shrink-0" }),
        /* @__PURE__ */ jsx("p", { children: error })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 mb-2", children: "Email Admin" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center bg-slate-50 border border-slate-300 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "pl-4 pr-3 text-slate-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(Mail, { className: "w-5 h-5" }) }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "email",
              required: true,
              value: email,
              onChange: (e) => setEmail(e.target.value),
              className: "w-full py-3 pr-4 bg-transparent outline-none font-medium text-slate-800",
              placeholder: "admin@airport.com"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 mb-2", children: "Kata Sandi" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center bg-slate-50 border border-slate-300 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "pl-4 pr-3 text-slate-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(KeyRound, { className: "w-5 h-5" }) }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "password",
              required: true,
              value: password,
              onChange: (e) => setPassword(e.target.value),
              className: "w-full py-3 pr-4 bg-transparent outline-none font-medium text-slate-800",
              placeholder: "••••••••"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: loading,
          className: "w-full py-4 text-lg mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200 flex justify-center items-center gap-2 disabled:opacity-70",
          children: loading ? /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin" }) : "Login"
        }
      )
    ] })
  ] }) });
};
const AdminDashboard = ({ logout }) => {
  return /* @__PURE__ */ jsxs("div", { className: "p-6 animate-in fade-in duration-300", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-black text-slate-800 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Database, { className: "w-7 h-7 text-blue-600" }),
          " Pengaturan Data"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 mt-1 font-medium", children: "Kelola konfigurasi dan master data laporan." })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: logout, className: "flex items-center gap-2 px-4 py-2.5 bg-rose-100 text-rose-700 hover:bg-rose-200 font-bold rounded-xl transition-colors", children: [
        /* @__PURE__ */ jsx(LogOut, { className: "w-5 h-5" }),
        " Keluar"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]", children: /* @__PURE__ */ jsx(LocalDataEditor, {}) })
  ] });
};
const LocalDataEditor = () => {
  const store = useMasterDataStore();
  const [activeSubTab, setActiveSubTab] = useState("upload_jadwal");
  const [localData, setLocalData] = useState([]);
  useEffect(() => {
    switch (activeSubTab) {
      case "api_t2":
        setLocalData([...store.dataApiT2]);
        break;
      case "om_ias_t2":
        setLocalData([...store.dataOmIasT2]);
        break;
      case "storing_equip":
        setLocalData([...store.storingEquipments]);
        break;
      case "tip_left":
        setLocalData([...store.tipLeftCol]);
        break;
    }
  }, [activeSubTab, store]);
  const handleSave = () => {
    switch (activeSubTab) {
      case "api_t2":
        store.setDataApiT2(localData);
        break;
      case "om_ias_t2":
        store.setDataOmIasT2(localData);
        break;
      case "storing_equip":
        store.setStoringEquipments(localData);
        break;
      case "tip_left":
        store.setTipLeftCol(localData);
        break;
    }
    if (activeSubTab !== "kalibrasi_equip") {
      alert("Data Lokal berhasil disimpan!");
    }
  };
  const handleTextChange = (index, field, value) => {
    const newData = [...localData];
    if (field) {
      if (field === "name") {
        newData[index][field] = toTitleCase(value);
      } else {
        newData[index][field] = value;
      }
    } else {
      newData[index] = value;
    }
    setLocalData(newData);
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-slate-800 text-white p-2 flex gap-1 overflow-x-auto hide-scrollbar", children: [
      { id: "upload_jadwal", label: "Upload Jadwal Excel" },
      { id: "manajemen_aset", label: "Manajemen Aset (Lokasi & Mesin)" },
      { id: "api_t2", label: "Personel API T2" },
      { id: "om_ias_t2", label: "Personel OM/IAS" },
      { id: "checklist_config", label: "Checklist Config" },
      { id: "kalibrasi_equip", label: "Config Peralatan Kalibrasi" },
      { id: "tip_data_manager", label: "Data TIP Tersimpan" }
    ].map((t) => /* @__PURE__ */ jsx("button", { onClick: () => setActiveSubTab(t.id), className: `px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${activeSubTab === t.id ? "bg-blue-600" : "hover:bg-slate-700 text-slate-300"}`, children: t.label }, t.id)) }),
    activeSubTab === "upload_jadwal" ? /* @__PURE__ */ jsx("div", { className: "p-6", children: /* @__PURE__ */ jsx(ScheduleUploader, {}) }) : activeSubTab === "manajemen_aset" ? /* @__PURE__ */ jsx("div", { className: "p-6 bg-slate-50 min-h-[500px]", children: /* @__PURE__ */ jsx(AssetManager, {}) }) : activeSubTab === "checklist_config" ? /* @__PURE__ */ jsx("div", { className: "p-6", children: /* @__PURE__ */ jsx(ChecklistDataEditor, {}) }) : activeSubTab === "kalibrasi_equip" ? /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-800 mb-4", children: "Peralatan untuk Tab Kalibrasi" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mb-6", children: "Pilih jenis peralatan dari database yang akan dimunculkan sebagai opsi di halaman Kalibrasi." }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4", children: store.jenisPeralatanData.map((jenis) => {
        const isChecked = !!jenis.tampil_di_kalibrasi;
        return /* @__PURE__ */ jsxs("label", { className: `flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${isChecked ? "bg-blue-50 border-blue-500 shadow-sm" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`, children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              checked: isChecked,
              onChange: (e) => {
                store.toggleKalibrasiEquipmentDb(jenis.id, e.target.checked);
              },
              className: "w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "ml-3 font-semibold text-slate-700", children: jenis.nama })
        ] }, jenis.id);
      }) }),
      /* @__PURE__ */ jsx("div", { className: "pt-6 mt-6 border-t border-slate-200 text-sm text-green-600 font-medium", children: "* Perubahan otomatis disimpan ke database." })
    ] }) : activeSubTab === "tip_data_manager" ? /* @__PURE__ */ jsx("div", { className: "p-0 border border-slate-200 rounded-xl overflow-hidden m-6", children: /* @__PURE__ */ jsx(TipDataManager, {}) }) : /* @__PURE__ */ jsxs("div", { className: "p-6 flex-1 space-y-4", children: [
      localData.map((item, index) => /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
        activeSubTab === "api_t2" || activeSubTab === "om_ias_t2" ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("input", { className: "flex-1 p-2 border rounded-lg", placeholder: "Nama Personel", value: item.name || "", onChange: (e) => handleTextChange(index, "name", e.target.value) }),
          /* @__PURE__ */ jsx("input", { className: "w-1/3 p-2 border rounded-lg", placeholder: "No. WA", value: item.phone || "", onChange: (e) => handleTextChange(index, "phone", e.target.value) })
        ] }) : /* @__PURE__ */ jsx("input", { className: "flex-1 p-2 border rounded-lg", value: item, onChange: (e) => handleTextChange(index, void 0, e.target.value) }),
        /* @__PURE__ */ jsx("button", { onClick: () => {
          const d = [...localData];
          d.splice(index, 1);
          setLocalData(d);
        }, className: "p-2 text-rose-500 bg-rose-50 rounded-lg", children: /* @__PURE__ */ jsx(Trash2, { className: "w-5 h-5" }) })
      ] }, index)),
      /* @__PURE__ */ jsx("button", { onClick: () => {
        const d = [...localData];
        if (activeSubTab === "api_t2" || activeSubTab === "om_ias_t2") d.push({ name: "", phone: "" });
        else d.push("");
        setLocalData(d);
      }, className: "w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 font-bold rounded-lg hover:bg-blue-50", children: "+ Tambah Baris" }),
      /* @__PURE__ */ jsx("div", { className: "pt-4 border-t border-slate-200 flex justify-end", children: /* @__PURE__ */ jsx("button", { onClick: handleSave, className: "px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors", children: "Simpan Perubahan" }) })
    ] })
  ] });
};
const TipDataManager = () => {
  const [tipList, setTipList] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchTipData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("master_configs").select("key, updated_at").like("key", "tip_data_%").order("updated_at", { ascending: false });
    if (!error && data) {
      setTipList(data);
    }
    setLoading(false);
  };
  useEffect(() => {
    fetchTipData();
  }, []);
  const handleDelete = async (key) => {
    if (!window.confirm(`Hapus data ${key.replace("tip_data_", "").replace("_", " ")}?`)) return;
    await supabase.from("master_configs").delete().eq("key", key);
    fetchTipData();
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "p-12 flex justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-blue-500" }) });
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-800", children: "Daftar Data TIP Tersimpan" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "Data TIP bulanan yang telah disimpan ke cloud." })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: fetchTipData, className: "p-2.5 text-slate-500 hover:bg-slate-200 rounded-xl transition-colors", children: /* @__PURE__ */ jsx(RefreshCw, { className: "w-5 h-5" }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-100 text-slate-600 text-sm", children: [
        /* @__PURE__ */ jsx("th", { className: "p-4 font-bold border-b border-slate-200", children: "Bulan & Tahun" }),
        /* @__PURE__ */ jsx("th", { className: "p-4 font-bold border-b border-slate-200", children: "Terakhir Diperbarui" }),
        /* @__PURE__ */ jsx("th", { className: "p-4 font-bold border-b border-slate-200 w-24 text-center", children: "Aksi" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: tipList.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 3, className: "p-8 text-center text-slate-500 italic", children: "Belum ada data TIP yang tersimpan." }) }) : tipList.map((row, i) => {
        const monthYear = row.key.replace("tip_data_", "").replace("_", " ");
        const dateObj = new Date(row.updated_at);
        const formattedDate = !isNaN(dateObj.getTime()) ? dateObj.toLocaleString("id-ID") : "-";
        return /* @__PURE__ */ jsxs("tr", { className: `border-b border-slate-100 hover:bg-blue-50/50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`, children: [
          /* @__PURE__ */ jsx("td", { className: "p-4 font-medium text-slate-800 capitalize", children: monthYear }),
          /* @__PURE__ */ jsx("td", { className: "p-4 text-slate-600 text-sm", children: formattedDate }),
          /* @__PURE__ */ jsx("td", { className: "p-4 text-center", children: /* @__PURE__ */ jsx("button", { onClick: () => handleDelete(row.key), className: "p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors", title: "Hapus Data", children: /* @__PURE__ */ jsx(Trash2, { className: "w-5 h-5" }) }) })
        ] }, row.key);
      }) })
    ] }) })
  ] });
};
function App() {
  const { activeTab, setActiveTab } = useAppStore();
  const { initializeSupabaseData } = useMasterDataStore();
  const { initializeAuth } = useAuthStore();
  const [isResetting, setIsResetting] = useState(false);
  const [showGsheetNotif] = useState(false);
  useEffect(() => {
    initializeSupabaseData();
    initializeAuth();
  }, [initializeSupabaseData, initializeAuth]);
  const switchTab = (tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleReset = () => {
    setIsResetting(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-slate-100 py-8 px-4 sm:px-6 flex items-center justify-center font-sans relative", children: [
    /* @__PURE__ */ jsx("div", { className: `fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none transition-all duration-500 ease-out ${showGsheetNotif ? "translate-y-6 opacity-100" : "-translate-y-full opacity-0"}`, children: /* @__PURE__ */ jsxs("div", { className: "bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 animate-pulse" }),
      "Laporan Terkirim ke Google Sheets"
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200", children: [
      /* @__PURE__ */ jsx("div", { className: "bg-blue-800 px-6 py-5 flex flex-col gap-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          activeTab === "perbaikan" ? /* @__PURE__ */ jsx(Wrench, { className: "text-white w-7 h-7" }) : activeTab === "kehadiran" ? /* @__PURE__ */ jsx(Users, { className: "text-white w-7 h-7" }) : activeTab === "briefing" ? /* @__PURE__ */ jsx(Megaphone, { className: "text-white w-7 h-7" }) : activeTab === "storing" ? /* @__PURE__ */ jsx(Box, { className: "text-white w-7 h-7" }) : activeTab === "checklist" ? /* @__PURE__ */ jsx(CheckSquare, { className: "text-white w-7 h-7" }) : activeTab === "tip" ? /* @__PURE__ */ jsx(AlertTriangle, { className: "text-white w-7 h-7" }) : /* @__PURE__ */ jsx(Settings, { className: "text-white w-7 h-7" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-white", children: "Laporan SSES T2" }),
            /* @__PURE__ */ jsx("p", { className: "text-blue-200 text-sm", children: "Otomatisasi Kirim ke WhatsApp" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center gap-2 justify-end", children: /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: handleReset,
            disabled: isResetting,
            className: `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${isResetting ? "bg-emerald-500 text-white shadow-md" : "bg-blue-700 text-blue-100 hover:bg-blue-600 hover:text-white"}`,
            children: isResetting ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Check, { className: "w-4 h-4 animate-pulse" }),
              " Di-reset!"
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4" }),
              " Reset"
            ] })
          }
        ) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 bg-slate-50 border-b border-slate-200", children: [
        /* @__PURE__ */ jsxs("button", { onClick: () => switchTab("perbaikan"), className: `py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-b border-slate-200 ${activeTab === "perbaikan" ? "shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`, children: [
          /* @__PURE__ */ jsx(Wrench, { className: "w-5 h-5 sm:w-6 sm:h-6" }),
          " ",
          /* @__PURE__ */ jsx("span", { className: "truncate w-full text-center", children: "Perbaikan" })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => switchTab("kehadiran"), className: `py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-b border-slate-200 ${activeTab === "kehadiran" ? "shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`, children: [
          /* @__PURE__ */ jsx(Users, { className: "w-5 h-5 sm:w-6 sm:h-6" }),
          " ",
          /* @__PURE__ */ jsx("span", { className: "truncate w-full text-center", children: "Kehadiran" })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => switchTab("briefing"), className: `py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-b border-slate-200 ${activeTab === "briefing" ? "shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`, children: [
          /* @__PURE__ */ jsx(Megaphone, { className: "w-5 h-5 sm:w-6 sm:h-6" }),
          " ",
          /* @__PURE__ */ jsx("span", { className: "truncate w-full text-center", children: "Briefing" })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => switchTab("storing"), className: `py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-b border-slate-200 ${activeTab === "storing" ? "shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`, children: [
          /* @__PURE__ */ jsx(Box, { className: "w-5 h-5 sm:w-6 sm:h-6" }),
          " ",
          /* @__PURE__ */ jsx("span", { className: "truncate w-full text-center", children: "Storing" })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => switchTab("checklist"), className: `py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-slate-200 ${activeTab === "checklist" ? "shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`, children: [
          /* @__PURE__ */ jsx(CheckSquare, { className: "w-5 h-5 sm:w-6 sm:h-6" }),
          " ",
          /* @__PURE__ */ jsx("span", { className: "truncate w-full text-center", children: "Checklist" })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => switchTab("kalibrasi"), className: `py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-slate-200 ${activeTab === "kalibrasi" ? "shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`, children: [
          /* @__PURE__ */ jsx(Settings, { className: "w-5 h-5 sm:w-6 sm:h-6" }),
          " ",
          /* @__PURE__ */ jsx("span", { className: "truncate w-full text-center", children: "Kalibrasi" })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => switchTab("tip"), className: `py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-slate-200 ${activeTab === "tip" ? "shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`, children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5 sm:w-6 sm:h-6" }),
          " ",
          /* @__PURE__ */ jsx("span", { className: "truncate w-full text-center", children: "TIP" })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => switchTab("data"), className: `py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${activeTab === "data" ? "shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`, children: [
          /* @__PURE__ */ jsx(Database, { className: "w-5 h-5 sm:w-6 sm:h-6" }),
          " ",
          /* @__PURE__ */ jsx("span", { className: "truncate w-full text-center", children: "Data" })
        ] })
      ] }),
      activeTab === "perbaikan" && /* @__PURE__ */ jsx(TabPerbaikan, {}),
      activeTab === "kehadiran" && /* @__PURE__ */ jsx(TabKehadiran, {}),
      activeTab === "briefing" && /* @__PURE__ */ jsx(TabBriefing, {}),
      activeTab === "storing" && /* @__PURE__ */ jsx(TabStoring, {}),
      activeTab === "checklist" && /* @__PURE__ */ jsx(TabChecklist, {}),
      activeTab === "kalibrasi" && /* @__PURE__ */ jsx(TabKalibrasi, {}),
      activeTab === "tip" && /* @__PURE__ */ jsx(TabTip, {}),
      activeTab === "data" && /* @__PURE__ */ jsx(TabData, {})
    ] })
  ] });
}
function Home() {
  return /* @__PURE__ */ jsx(App, {});
}
export {
  Home as component
};
