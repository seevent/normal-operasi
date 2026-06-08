const fs = require('fs');
let lines = fs.readFileSync('src/components/App.tsx', 'utf8').split(/\r?\n/);

const newCode = `  const GOOGLE_SHEETS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbz191pL-SZ4Zv7FguTY-AfhyShFau3Gt3G5l2ZQfA7FZV8HLx4X3baJhIh50z30Qbcs/exec';

  const handleRepairSubmit = async (e) => {
    e.preventDefault();
    if (!formData.peralatan) { alert("Harap pilih peralatan terlebih dahulu!"); return; }
    
    // Background sync to Google Sheets
    try {
      const payload = {
        teknisi: formData.teknisi,
        lokasi: formData.lokasi1 + (formData.lokasi2 ? ' - ' + formData.lokasi2 : ''),
        peralatan: formData.peralatan,
        waktuMulai: formData.waktuMulai,
        waktuSelesai: formData.waktuSelesai,
        detailPerbaikan: formData.permasalahan + '\\n\\nTindak Lanjut:\\n' + formData.tindakLanjut
      };
      
      fetch(GOOGLE_SHEETS_WEBAPP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }).catch(err => console.error("Google Sheets sync error:", err));
    } catch(err) {
      console.error("Payload prep error:", err);
    }

    executeShare(generateRepairMessage());
  };`;

lines.splice(2003, 2007 - 2003 + 1, newCode);
fs.writeFileSync('src/components/App.tsx', lines.join('\n'), 'utf8');
console.log('Success integrating Google Sheets');
