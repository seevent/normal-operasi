const fs = require('fs');
let src = fs.readFileSync('src/components/App.tsx', 'utf8');

const oldCode = `                      <button 
                        type="button" 
                        onClick={() => {
                          if (hasPM) {
                            let newText = attendanceData.rencanaKegiatan.replace('\\n' + pmText, '').replace(pmText, '').trim();
                            setAttendanceData({ ...attendanceData, rencanaKegiatan: newText });
                          } else {
                            let newText = attendanceData.rencanaKegiatan.trim();
                            if (newText.length > 0) newText += '\\n';
                            newText += pmText;
                            setAttendanceData({ ...attendanceData, rencanaKegiatan: newText });
                          }
                        }}
                        className="mt-2 flex items-center gap-1.5 text-sm font-medium transition-colors"
                      >
                        {hasPM ? (
                          <>
                            <X className="w-4 h-4 text-red-500" />
                            <span className="text-red-600 hover:text-red-700 underline">Hapus PM & Kalibrasi</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 text-emerald-500" />
                            <span className="text-emerald-600 hover:text-emerald-700 underline">Tambahkan PM & Kalibrasi</span>
                          </>
                        )}
                      </button>`;

const newCode = `                      <button 
                        type="button" 
                        onClick={() => {
                          if (hasPM) {
                            let newText = attendanceData.rencanaKegiatan.replace('\\n' + pmText, '').replace(pmText, '').trim();
                            setAttendanceData({ ...attendanceData, rencanaKegiatan: newText });
                          } else {
                            let newText = attendanceData.rencanaKegiatan.trim();
                            if (newText.length > 0) newText += '\\n';
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
                      </button>`;

if (src.includes(oldCode)) {
  src = src.replace(oldCode, newCode);
  fs.writeFileSync('src/components/App.tsx', src, 'utf8');
  console.log('Success removing underline');
} else {
  console.error('Old code not found!');
}
