const fs = require('fs');
let src = fs.readFileSync('src/components/App.tsx', 'utf8');

const oldFunc = `  const handleTipShare = async () => {
    const element = document.getElementById('tip-export-area');
    if (!element) return;
    setIsGeneratingTipImage(true);

    try {
      const clone = element.cloneNode(true);
      const clonedGrid = clone.querySelector('#tip-export-grid');
      
      if (clonedGrid) {
        clonedGrid.className = 'grid grid-cols-2 gap-6 w-full';
        clonedGrid.style.display = 'grid';
        clonedGrid.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
        clonedGrid.style.gap = '2rem';
      }
      
      clone.style.width = '1000px';
      clone.style.maxWidth = '1000px';
      clone.style.margin = '0';
      clone.style.padding = '40px';
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      
      document.body.appendChild(clone);

      const htmlToImage = await loadHtmlToImage();
      const blob = await htmlToImage.toBlob(clone, { 
        backgroundColor: '#ffffff',
        pixelRatio: 2
      });

      document.body.removeChild(clone);

      if (!blob) throw new Error('Blob image is empty');

      const file = new File([blob], \`TIP_Performance_\${tipMonth}_\${tipYear}.jpg\`, { type: 'image/jpeg' });
      const shareText = \`Halo, berikut adalah status laporan TIP Performance bulan \${tipMonth} \${tipYear}.\`;
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Laporan TIP T2',
            text: shareText
          });
          setIsGeneratingTipImage(false);
          return;
        } catch (err) {
          console.error('Share dibatalkan/gagal', err);
        }
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`TIP_Performance_\${tipMonth}_\${tipYear}.jpg\`;
      a.click();
      URL.revokeObjectURL(url);
      
      const text = encodeURIComponent(shareText + ' (Gambar telah otomatis diunduh)');
      window.open(\`https://api.whatsapp.com/send?text=\${text}\`, '_blank');

    } catch (error) {
      console.error('Error generating image:', error);
      alert('Gagal membuat gambar laporan. Browser mungkin tidak mendukung.');
    } finally {
      setIsGeneratingTipImage(false);
    }
  };`;

const newFunc = `  const handleTipShare = async () => {
    const element = document.getElementById('tip-export-area');
    const grid = document.getElementById('tip-export-grid');
    if (!element) return;
    setIsGeneratingTipImage(true);

    const originalGridClass = grid ? grid.className : '';
    const originalGridStyle = grid ? grid.style.cssText : '';
    const originalElementStyle = element.style.cssText;

    try {
      if (grid) {
        grid.className = 'grid grid-cols-2 gap-6 w-full';
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
        grid.style.gap = '2rem';
      }
      
      element.style.width = '1000px';
      element.style.maxWidth = '1000px';
      element.style.margin = '0 auto';
      element.style.padding = '40px';

      const htmlToImage = await loadHtmlToImage();
      await new Promise(r => setTimeout(r, 100)); // biarkan browser me-render UI sesaat

      const blob = await htmlToImage.toBlob(element, { 
        backgroundColor: '#ffffff',
        pixelRatio: 2
      });

      if (!blob) throw new Error('Blob image is empty');

      const file = new File([blob], \`TIP_Performance_\${tipMonth}_\${tipYear}.jpg\`, { type: 'image/jpeg' });
      const shareText = \`Halo, berikut adalah status laporan TIP Performance bulan \${tipMonth} \${tipYear}.\`;
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Laporan TIP T2',
            text: shareText
          });
          return;
        } catch (err) {
          console.error('Share dibatalkan/gagal', err);
        }
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`TIP_Performance_\${tipMonth}_\${tipYear}.jpg\`;
      a.click();
      URL.revokeObjectURL(url);
      
      const text = encodeURIComponent(shareText + ' (Gambar telah otomatis diunduh)');
      window.open(\`https://api.whatsapp.com/send?text=\${text}\`, '_blank');

    } catch (error) {
      console.error('Error generating image:', error);
      alert('Gagal membuat gambar laporan. Browser mungkin tidak mendukung.');
    } finally {
      if (grid) {
        grid.className = originalGridClass;
        grid.style.cssText = originalGridStyle;
      }
      element.style.cssText = originalElementStyle;
      setIsGeneratingTipImage(false);
    }
  };`;

src = src.replace(oldFunc, newFunc);
fs.writeFileSync('src/components/App.tsx', src, 'utf8');
