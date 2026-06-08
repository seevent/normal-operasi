const fs = require('fs');
let lines = fs.readFileSync('src/components/App.tsx', 'utf8').split('\n');

const targetLabel = 'Rencana Kegiatan Harian</label>';
let targetIdx = -1;
for (let i=0; i<lines.length; i++) {
  if (lines[i].includes(targetLabel)) {
    targetIdx = i;
    break;
  }
}

if (targetIdx !== -1) {
  // textarea is at targetIdx + 1
  const injection = `                  {(() => {
                    const pmText = "- Preventive Maintenance & Kalibrasi Perangkat";
                    const hasPM = attendanceData.rencanaKegiatan.includes(pmText);
                    return (
                      <button 
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
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline transition-colors"
                      >
                        {hasPM ? "Hapus PM & Kalibrasi" : "Tambahkan PM & Kalibrasi"}
                      </button>
                    );
                  })()}`;
  lines.splice(targetIdx + 2, 0, injection);
  fs.writeFileSync('src/components/App.tsx', lines.join('\n'), 'utf8');
  console.log('Success injected toggle button');
} else {
  console.log('Label not found');
}
