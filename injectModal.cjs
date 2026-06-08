const fs = require('fs');
const file = 'src/components/App.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Inject state variables and handlers for the Modal
const stateInjection = `  const [tipRightCol, setTipRightCol] = useState(() => loadMasterData('master_tip_right', DEFAULT_TIP_RIGHT_COL));

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
    else if (['tip_left', 'tip_right'].includes(masterModalOpen)) newItem = { id: \`new_\${Date.now()}\`, name: '', items: [] };
    setMasterModalData([...masterModalData, newItem]);
  };

  const removeModalDataRow = (index) => {
    const newData = [...masterModalData];
    newData.splice(index, 1);
    setMasterModalData(newData);
  };
`;

code = code.replace(/  const \[tipRightCol, setTipRightCol\] = useState\(\(\) => loadMasterData\('master_tip_right', DEFAULT_TIP_RIGHT_COL\)\);/, stateInjection);

// 2. Inject Modal UI at the bottom of the App component
const modalUI = `
        {/* === MODAL PENGELOLAAN DATA MASTER === */}
        {masterModalOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4 transition-all">
            <div className="bg-white w-full max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
              
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-50/50 rounded-t-2xl">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    Kelola Data Master
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Edit, tambah, atau hapus item di sistem</p>
                </div>
                <button onClick={closeMasterModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/30">
                {masterModalData.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start p-3 bg-white border border-slate-200 rounded-xl shadow-sm group">
                    <div className="mt-2 text-slate-400 font-bold text-sm w-6 text-center">{index + 1}.</div>
                    
                    <div className="flex-1 space-y-2">
                      {['api_t2', 'om_ias_t2'].includes(masterModalOpen) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input type="text" placeholder="Nama Personel" value={item.name} onChange={(e) => handleModalDataChange(index, 'name', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                          <input type="tel" placeholder="No HP/WA" value={item.phone} onChange={(e) => handleModalDataChange(index, 'phone', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                      )}
                      
                      {['storing_equip', 'storing_loc_ac', 'storing_loc_default'].includes(masterModalOpen) && (
                        <input type="text" placeholder="Nama Item" value={item} onChange={(e) => handleModalDataChange(index, null, e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      )}

                      {['tip_left', 'tip_right'].includes(masterModalOpen) && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input type="text" placeholder="ID Kategori (huruf kecil tanpa spasi)" value={item.id} onChange={(e) => handleModalDataChange(index, 'id', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" />
                            <input type="text" placeholder="Nama Kategori (Tampil di Layar)" value={item.name} onChange={(e) => handleModalDataChange(index, 'name', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                          </div>
                          <div>
                            <input type="text" placeholder="Item di dalamnya (pisahkan dengan koma)" value={item.items.join(', ')} onChange={(e) => handleModalDataChange(index, 'items', e.target.value.split(',').map(s => s.trim()))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            <p className="text-[10px] text-slate-500 mt-1">Pisahkan tiap item dengan koma (contoh: 1, 2, 3, 4)</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button type="button" onClick={() => removeModalDataRow(index)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors mt-0.5" title="Hapus Item">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                <button type="button" onClick={addModalDataRow} className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" /> Tambah Item Baru
                </button>
              </div>

              <div className="p-4 sm:px-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 sm:rounded-b-2xl">
                <button type="button" onClick={resetCurrentMasterModal} className="w-full sm:w-auto px-4 py-2.5 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Reset ke Default
                </button>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button type="button" onClick={closeMasterModal} className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-center">
                    Batal
                  </button>
                  <button type="button" onClick={saveCurrentMasterModal} className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-md text-center flex justify-center items-center gap-2">
                    <Save className="w-4 h-4" /> Simpan
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
`;

code = code.replace(/      <\/div>\n    <\/div>\n  \);\n}/, modalUI);

fs.writeFileSync(file, code, 'utf8');
console.log('Successfully injected Modal UI and state into App.tsx');
