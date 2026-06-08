const fs = require('fs');
let src = fs.readFileSync('src/components/App.tsx', 'utf8');

const oldCode = `  const handleRepairSubmit = async (e) => {
    e.preventDefault();
    if (!formData.peralatan) { alert("Harap pilih peralatan terlebih dahulu!"); return; }
    executeShare(generateRepairMessage());
  };`;

const newCode = `  const GOOGLE_SHEETS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbz191pL-SZ4Zv7FguTY-AfhyShFau3Gt3G5l2ZQfA7FZV8HLx4X3baJhIh50z30Qbcs/exec';

  const handleRepairSubmit = async (e) => {
    e.preventDefault();
    if (!formData.peralatan) { alert("Harap pilih peralatan terlebih dahulu!"); return; }
    
    // Send data to Google Sheets in background
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
      console.error("Payload error:", err);
    }

    executeShare(generateRepairMessage());
  };`;

if (src.includes(oldCode)) {
  src = src.replace(oldCode, newCode);
  fs.writeFileSync('src/components/App.tsx', src, 'utf8');
  console.log('Success integrating Google Sheets');
} else {
  console.error('Old code not found!');
}
