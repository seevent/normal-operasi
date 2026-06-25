// src/lib/data/masterData.ts

export const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

export const DEFAULT_DATA_API_T2 = [
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
].map(p => ({ ...p, name: toTitleCase(p.name) }));

export const DEFAULT_DATA_OM_IAS_T2 = [
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
].map(p => ({ ...p, name: toTitleCase(p.name) }));

export const DEFAULT_STORING_EQUIPMENTS = ['Access Control', 'X-Ray', 'HHMD', 'ETD', 'WTMD', 'Body Scanner'];
export const DEFAULT_STORING_LOC_AC: string[] = [];
export const DEFAULT_STORING_LOC_DEFAULT = [
  'PSCP D', 'PSCP E', 'PSCP F', 'PSCP Umroh', 'SSCP E', 'SSCP F',
  'HBSCP 1.1 -1.6', 'HBSCP 2.1-2.6', 'HBSCP Umrah'
];

export const DEFAULT_CHECKLIST_DATA = [
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
    type: 'location',
    title: 'SSCP E',
    summary: 'TOTAL PERALATAN SSCP E',
    categories: [
      { title: 'A. X-RAY', summaryKey: 'X-RAY', items: ['X-Ray Smith Heiman HS 6040-2is'] },
      { title: 'B. WTMD', summaryKey: 'WTMD', items: ['WTMD CEIA HI-PE Multizone'] }
    ]
  },
  {
    type: 'location',
    title: 'SSCP F',
    summary: 'TOTAL PERALATAN SSCP F',
    categories: [
      { title: 'A. X-RAY', summaryKey: 'X-RAY', items: ['X-Ray Rapiscan 620 DV'] },
      { title: 'B. WTMD', summaryKey: 'WTMD', items: ['WTMD CEIA HI-PE Multizone'] }
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

export const DEFAULT_TIP_LEFT_COL = [
  { id: 'hbscp', name: 'HBSCP', items: ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6'] },
  { id: 'hbscp_umroh', name: 'HBSCP UMROH', items: ['2.7', '2.8'] },
  { id: 'pscp_d', name: 'PSCP D', items: ['1', '2', '3', '4', '5'] }
];
export const DEFAULT_TIP_RIGHT_COL = [
  { id: 'pscp_e', name: 'PSCP E', items: ['1', '2', '3', '4', '5'] },
  { id: 'pscp_f', name: 'PSCP F', items: ['1', '2', '3', '4'] },
  { id: 'pscp_umroh', name: 'PSCP UMROH', items: ['1', '2', '3', '4', '5', '6', '7'] },
  { id: 'sscp', name: 'SSCP', items: ['MP E', 'MP F'] }
];
