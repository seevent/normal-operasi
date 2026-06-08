const fs = require('fs');
let lines = fs.readFileSync('src/components/App.tsx', 'utf8').split(/\r?\n/);

const newCode = `  const executeShare = async (message, customFilesArray = null) => {
    let filesArray = [];
    if (customFilesArray !== null) {
      filesArray = customFilesArray;
    } else {
      if (photos.length > 1 && collageFile) filesArray = [collageFile];
      else if (photos.length === 1) filesArray = [photos[0].file];
    }

    try {
      if (filesArray.length > 0 && navigator.canShare && navigator.canShare({ files: filesArray })) {
        await navigator.share({ files: filesArray, title: 'Laporan SSES T2', text: message });
        setIsCopied(true); setTimeout(() => setIsCopied(false), 2500);
        return;
      } else if (filesArray.length === 0 && navigator.share) {
        await navigator.share({ title: 'Laporan SSES T2', text: message });
        setIsCopied(true); setTimeout(() => setIsCopied(false), 2500);
        return;
      }
    } catch (err) {
      console.error("Share dibatalkan atau gagal", err);
      if (err.name === 'AbortError') return;
    }
    
    fallbackShare(message, filesArray.length > 0);
  };`;

lines.splice(1974, 2001 - 1974 + 1, newCode);
fs.writeFileSync('src/components/App.tsx', lines.join('\n'), 'utf8');
console.log('Success updating executeShare');
