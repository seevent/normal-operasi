const fs = require('fs');
let src = fs.readFileSync('src/components/App.tsx', 'utf8');

const oldCode = `  const fallbackShare = (message, hasUnsharedPhotos) => {
    const textArea = document.createElement("textarea");
    textArea.value = message; document.body.appendChild(textArea); textArea.select();
    try {
      document.execCommand('copy');
      setIsCopied(true); setTimeout(() => setIsCopied(false), 2500);
      if (hasUnsharedPhotos) {
        alert("Perangkat ini tidak mendukung pengiriman foto secara otomatis. Teks laporan telah dicopy. Silakan 'Paste' di WhatsApp dan lampirkan foto Anda secara manual.");
      }
    } catch (err) { console.error("Gagal menyalin teks", err); }
    document.body.removeChild(textArea);
    const encodedMessage = encodeURIComponent(message);
    window.open(\`https://wa.me/?text=\${encodedMessage}\`, '_blank');
  };

  const executeShare = async (message, customFilesArray = null) => {
    let filesArray = [];
    if (customFilesArray !== null) {
      filesArray = customFilesArray;
    } else {
      if (photos.length > 1 && collageFile) filesArray = [collageFile];
      else if (photos.length === 1) filesArray = [photos[0].file];
    }

    if (filesArray.length > 0 && navigator.canShare && navigator.canShare({ files: filesArray })) {
      try {
        await navigator.share({ files: filesArray, title: 'Laporan SSES T2', text: message });
        setIsCopied(true); setTimeout(() => setIsCopied(false), 2500);
      } catch (err) {
        console.error("Share dibatalkan atau gagal", err);
        if (err.name !== 'AbortError') fallbackShare(message, true);
      }
    } else {
      fallbackShare(message, filesArray.length > 0);
    }
  };`;

const newCode = `  const fallbackShare = async (message, hasUnsharedPhotos) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(message);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = message; document.body.appendChild(textArea); textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsCopied(true); setTimeout(() => setIsCopied(false), 2500);
      if (hasUnsharedPhotos) {
        alert("Perangkat ini tidak mendukung pengiriman foto secara otomatis. Teks laporan telah dicopy. Silakan 'Paste' di WhatsApp dan lampirkan foto Anda secara manual.");
      }
    } catch (err) { 
      console.error("Gagal menyalin teks", err); 
    }
    const encodedMessage = encodeURIComponent(message);
    window.open(\`https://wa.me/?text=\${encodedMessage}\`, '_blank');
  };

  const executeShare = async (message, customFilesArray = null) => {
    let filesArray = [];
    if (customFilesArray !== null) {
      filesArray = customFilesArray;
    } else {
      if (photos.length > 1 && collageFile) filesArray = [collageFile];
      else if (photos.length === 1) filesArray = [photos[0].file];
    }

    let canShare = false;
    try {
      canShare = navigator.canShare && navigator.canShare({ files: filesArray });
    } catch (e) {
      canShare = false;
    }

    if (filesArray.length > 0 && canShare) {
      try {
        await navigator.share({ files: filesArray, title: 'Laporan SSES T2', text: message });
        setIsCopied(true); setTimeout(() => setIsCopied(false), 2500);
      } catch (err) {
        console.error("Share dibatalkan atau gagal", err);
        if (err.name !== 'AbortError') fallbackShare(message, true);
      }
    } else {
      fallbackShare(message, filesArray.length > 0);
    }
  };`;

if(src.includes(oldCode)) {
  src = src.replace(oldCode, newCode);
  fs.writeFileSync('src/components/App.tsx', src, 'utf8');
  console.log('Success replacing share logic');
} else {
  console.error('Could not find old code in App.tsx');
}
