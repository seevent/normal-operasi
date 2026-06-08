const fs = require('fs'); 
const lines = fs.readFileSync('src/components/App.tsx', 'utf8').split('\n'); 
const start = 1324; 
const end = 1400; 
const replacement = `  const loadHtmlToImage = () => {
    return new Promise((resolve, reject) => {
      if (window.htmlToImage) return resolve(window.htmlToImage);
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js';
      script.onload = () => resolve(window.htmlToImage);
      script.onerror = () => reject(new Error('Gagal memuat script gambar'));
      document.head.appendChild(script);
    });
  };

  const handleTipShare = async () => {
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

      const file = new File([blob], \\\`TIP_Performance_\\\${tipMonth}_\\\${tipYear}.jpg\\\`, { type: 'image/jpeg' });
      const shareText = \\\`Halo, berikut adalah status laporan TIP Performance bulan \\\${tipMonth} \\\${tipYear}.\\\`;
      
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
      a.download = \\\`TIP_Performance_\\\${tipMonth}_\\\${tipYear}.jpg\\\`;
      a.click();
      URL.revokeObjectURL(url);
      
      const text = encodeURIComponent(shareText + ' (Gambar telah otomatis diunduh)');
      window.open(\\\`https://api.whatsapp.com/send?text=\\\${text}\\\`, '_blank');

    } catch (error) {
      console.error('Error generating image:', error);
      alert('Gagal membuat gambar laporan. Browser mungkin tidak mendukung.');
    } finally {
      setIsGeneratingTipImage(false);
    }
  };`; 
lines.splice(start, end - start, replacement); 
fs.writeFileSync('src/components/App.tsx', lines.join('\n'), 'utf8');
