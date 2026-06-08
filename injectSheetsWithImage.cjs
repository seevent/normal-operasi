const fs = require('fs');
let lines = fs.readFileSync('src/components/App.tsx', 'utf8').split(/\r?\n/);

const newCode = `  const handleRepairSubmit = async (e) => {
    e.preventDefault();
    if (!formData.peralatan) { alert("Harap pilih peralatan terlebih dahulu!"); return; }
    
    // Background sync to Google Sheets
    try {
      let imageBase64 = "";
      if (photos.length > 1 && collageFile) {
        imageBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(collageFile);
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
        });
      } else if (photos.length === 1) {
        imageBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(photos[0].file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
        });
      }

      const payload = {
        teknisi: formData.teknisi,
        lokasi: formData.lokasi1 + (formData.lokasi2 ? ' - ' + formData.lokasi2 : ''),
        peralatan: formData.peralatan,
        waktu: formData.waktuMulai + ' - ' + formData.waktuSelesai,
        detailPerbaikan: 'Permasalahan : ' + formData.permasalahan + '\\n\\nTindak lanjut : ' + formData.tindakLanjut,
        status: formData.status,
        imageBase64: imageBase64
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

lines.splice(2005, 2018 - 2005 + 1, newCode);
fs.writeFileSync('src/components/App.tsx', lines.join('\n'), 'utf8');
console.log('Success updating handleRepairSubmit');
