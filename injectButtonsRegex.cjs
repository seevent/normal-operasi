const fs = require('fs');
const file = 'src/components/App.tsx';
let code = fs.readFileSync(file, 'utf8');

// Regex helper to ignore whitespace/newlines differences
function replaceCode(regex, replace) {
  if (regex.test(code)) {
    code = code.replace(regex, replace);
  } else {
    console.warn("Could not find regex:", regex);
  }
}

replaceCode(
  /<h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2">\s*<Wrench className="w-5 h-5 text-blue-600" \/> Detail Peralatan & Waktu\s*<\/h2>/g,
  `<div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-blue-600" /> Detail Peralatan & Waktu
                </h2>
                <button type="button" onClick={() => openMasterModal('storing_equip', storingEquipments)} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors"><Settings className="w-3.5 h-3.5"/> Kelola Peralatan</button>
              </div>`
);

replaceCode(
  /<h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2">\s*<User className="w-5 h-5 text-blue-600" \/> Personel API T2\s*<\/h2>/g,
  `<div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" /> Personel API T2
                </h2>
                <button type="button" onClick={() => openMasterModal('api_t2', dataApiT2)} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors"><Settings className="w-3.5 h-3.5"/> Kelola Personel</button>
              </div>`
);

replaceCode(
  /<h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2">\s*<Users className="w-5 h-5 text-blue-600" \/> Personel OM IAS T2\s*<\/h2>/g,
  `<div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" /> Personel OM IAS T2
                </h2>
                <button type="button" onClick={() => openMasterModal('om_ias_t2', dataOmIasT2)} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors"><Settings className="w-3.5 h-3.5"/> Kelola Personel</button>
              </div>`
);

replaceCode(
  /<h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2">\s*<Box className="w-5 h-5 text-blue-600" \/> Detail Peralatan Storing\s*<\/h2>/g,
  `<div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center border-b pb-2">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Box className="w-5 h-5 text-blue-600" /> Detail Peralatan Storing
                </h2>
                <div className="flex gap-2">
                  <button type="button" onClick={() => openMasterModal('storing_loc_default', storingLocDefault)} className="text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-50 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors"><Settings className="w-3.5 h-3.5"/> Lokasi Default</button>
                  <button type="button" onClick={() => openMasterModal('storing_loc_ac', storingLocAc)} className="text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-50 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors"><Settings className="w-3.5 h-3.5"/> Lokasi AC</button>
                  <button type="button" onClick={() => openMasterModal('storing_equip', storingEquipments)} className="text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-50 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors"><Settings className="w-3.5 h-3.5"/> Peralatan</button>
                </div>
              </div>`
);

replaceCode(
  /<h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-2 mb-4">\s*<CheckSquare className="w-5 h-5 text-blue-600" \/> Pilih Kategori Peralatan\s*<\/h2>/g,
  `<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-2 mb-4 gap-2">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-blue-600" /> Pilih Kategori Peralatan
                </h2>
                <button type="button" onClick={() => window.alert('Catatan: Struktur checklist sangat kompleks dan bertingkat.\\n\\nUntuk mengelola data Peralatan di Checklist ini, Anda dapat merubahnya langsung di Source Code (const DEFAULT_CHECKLIST_DATA). Fitur CRUD Checklist sedang dalam tahap pengembangan.')} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors"><Settings className="w-3.5 h-3.5"/> Info Checklist</button>
              </div>`
);

replaceCode(
  /<div className="flex flex-wrap gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">\s*<button/g,
  `<div className="flex flex-wrap gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => openMasterModal('tip_left', tipLeftCol)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition-colors border border-blue-200 text-sm"
                >
                  <Settings className="w-4 h-4" /> Kelola Kolom Kiri
                </button>
                <button 
                  type="button"
                  onClick={() => openMasterModal('tip_right', tipRightCol)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition-colors border border-blue-200 text-sm"
                >
                  <Settings className="w-4 h-4" /> Kelola Kolom Kanan
                </button>
              </div>
              <button`
);

fs.writeFileSync(file, code, 'utf8');
console.log('Successfully injected CRUD buttons into tabs using Regex');
