const fs = require('fs');
const file = 'src/components/App.tsx';
let code = fs.readFileSync(file, 'utf8');

// We have a broken section. Let's find exactly what is left:
// The code currently looks like this due to the bad replace:
/*
                <option value="X-Ray Rapiscan 620DV">X-Ray Rapiscan 620DV</option>
                <option value="X-Ray Rapiscan 628DV">X-Ray Rapiscan 628DV</option>
                <option value="X-Ray Rapiscan Orion 920DV">X-Ray Rapiscan Orion 920DV</option>
                <option value="X-Ray Nuctech CX100100D">X-Ray Nuctech CX100100D</option>
                          <option value="">- Pilih Area -</option>
                          {lokasi1OptionsPerbaikan.map(opt => <option key={opt} value={opt}>{opt}</option>)}
*/

const badBlock = `<option value="X-Ray Rapiscan Orion 920DV">X-Ray Rapiscan Orion 920DV</option>
                <option value="X-Ray Nuctech CX100100D">X-Ray Nuctech CX100100D</option>
                          <option value="">- Pilih Area -</option>
                          {lokasi1OptionsPerbaikan.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>`;

const goodBlock = `<option value="X-Ray Rapiscan Orion 920DV">X-Ray Rapiscan Orion 920DV</option>
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
                  <button type="button" onClick={() => openMasterModal('storing_equip', storingEquipments)} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors"><Settings className="w-3.5 h-3.5"/> Kelola Peralatan</button>
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
                        </select>`;

// Normalize newlines
const normalizeLineEndings = (str) => str.replace(/\\r\\n/g, '\\n').trim();

const codeNormalized = normalizeLineEndings(code);
const badBlockNormalized = normalizeLineEndings(badBlock);

if (codeNormalized.includes(badBlockNormalized)) {
  const newCode = codeNormalized.replace(badBlockNormalized, normalizeLineEndings(goodBlock));
  fs.writeFileSync(file, newCode, 'utf8');
  console.log('Restoration successful!');
} else {
  console.error('Could not find bad block to restore.');
}
