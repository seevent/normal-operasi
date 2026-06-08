const fs = require('fs');
const file = 'src/components/App.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// Update line 2460 (Perbaikan Tab)
// Original:                 <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2">
//           2461:                   <FileText className="w-5 h-5 text-blue-600" /> Informasi Laporan
//           2462:                 </h2>
lines[2460] = `                <div className="flex justify-between items-center border-b pb-2">
                  <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">`;
lines[2461] = `                    <FileText className="w-5 h-5 text-blue-600" /> Informasi Laporan`;
lines[2462] = `                  </h2>
                  <button type="button" onClick={() => openMasterModal('storing_equip', storingEquipments)} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors"><Settings className="w-3.5 h-3.5"/> Kelola Peralatan</button>
                </div>`;

// Update line 2601 (Kehadiran Tab API T2)
lines[2601] = `                <div className="flex justify-between items-center border-b pb-2">
                  <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">`;
lines[2602] = `                    <User className="w-5 h-5 text-blue-600" /> Personel API T2`;
lines[2603] = `                  </h2>
                  <button type="button" onClick={() => openMasterModal('api_t2', dataApiT2)} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors"><Settings className="w-3.5 h-3.5"/> Kelola Personel</button>
                </div>`;

// Update line 2633 (Kehadiran Tab OM IAS T2)
lines[2633] = `                <div className="flex justify-between items-center border-b pb-2">
                  <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">`;
lines[2634] = `                    <Users className="w-5 h-5 text-blue-600" /> Personel OM IAS T2`;
lines[2635] = `                  </h2>
                  <button type="button" onClick={() => openMasterModal('om_ias_t2', dataOmIasT2)} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors"><Settings className="w-3.5 h-3.5"/> Kelola Personel</button>
                </div>`;

// Update line 2800 (Storing Tab)
lines[2800] = `                <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center border-b pb-2">
                  <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">`;
lines[2801] = `                    <Box className="w-5 h-5 text-blue-600" /> Detail Kegiatan Storing`;
lines[2802] = `                  </h2>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => openMasterModal('storing_loc_default', storingLocDefault)} className="text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-50 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors"><Settings className="w-3.5 h-3.5"/> Lokasi Default</button>
                    <button type="button" onClick={() => openMasterModal('storing_loc_ac', storingLocAc)} className="text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-50 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors"><Settings className="w-3.5 h-3.5"/> Lokasi AC</button>
                    <button type="button" onClick={() => openMasterModal('storing_equip', storingEquipments)} className="text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-50 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors"><Settings className="w-3.5 h-3.5"/> Peralatan</button>
                  </div>
                </div>`;

// Find TIP tab buttons and inject
const tipToggleAllLine = lines.findIndex(l => l.includes('onClick={handleTipToggleAll}'));
if (tipToggleAllLine !== -1) {
  // Found `<button type="button" onClick={handleTipToggleAll}`
  // Let's insert the two tip buttons just before it
  lines.splice(tipToggleAllLine - 2, 0, `              <div className="flex gap-2">
                <button type="button" onClick={() => openMasterModal('tip_left', tipLeftCol)} className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition-colors border border-blue-200 text-sm"><Settings className="w-4 h-4" /> Kelola Kolom Kiri</button>
                <button type="button" onClick={() => openMasterModal('tip_right', tipRightCol)} className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition-colors border border-blue-200 text-sm"><Settings className="w-4 h-4" /> Kelola Kolom Kanan</button>
              </div>`);
}

// Find Checklist Tab header and inject
const checklistHeaderLine = lines.findIndex(l => l.includes('<CheckSquare className="w-5 h-5 text-blue-600" /> Pilih Kategori Peralatan'));
if (checklistHeaderLine !== -1) {
  // Reconstruct lines
  lines[checklistHeaderLine - 1] = `                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-2 mb-4 gap-2">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">`;
  lines[checklistHeaderLine] = `                    <CheckSquare className="w-5 h-5 text-blue-600" /> Pilih Kategori Peralatan`;
  lines[checklistHeaderLine + 1] = `                  </h2>
                  <button type="button" onClick={() => window.alert('Catatan: Struktur checklist sangat kompleks dan bertingkat.\\n\\nUntuk mengelola data Peralatan di Checklist ini, Anda dapat merubahnya langsung di Source Code (const DEFAULT_CHECKLIST_DATA). Fitur CRUD Checklist sedang dalam tahap pengembangan.')} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors"><Settings className="w-3.5 h-3.5"/> Info Checklist</button>
                </div>`;
}

// Find Kalibrasi Tab header and inject
const kalibrasiHeaderLine = lines.findIndex(l => l.includes('<Settings className="w-4 h-4 text-blue-600" /> Data Peralatan'));
if (kalibrasiHeaderLine !== -1) {
  lines[kalibrasiHeaderLine - 1] = `                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">`;
  lines[kalibrasiHeaderLine] = `                        <Settings className="w-4 h-4 text-blue-600" /> Data Peralatan`;
  lines[kalibrasiHeaderLine + 1] = `                      </h3>
                      <button type="button" onClick={() => openMasterModal('storing_equip', storingEquipments)} className="text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-50 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors"><Settings className="w-3.5 h-3.5"/> Kelola</button>
                    </div>`;
}

fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Successfully injected CRUD buttons precisely by line numbers!');
