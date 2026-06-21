// src/lib/utils/canvasUtils.ts

export const processPhotosToCollage = async (
  photosArray: { preview: string; zoom?: number }[]
): Promise<{ url: string, file: File } | null> => {
  return new Promise(async (resolve) => {
    if (photosArray.length <= 1) {
      resolve(null);
      return;
    }


  try {
    const CELL_SIZE = 800; 
    const SPACING = 24;    
    const cols = Math.ceil(Math.sqrt(photosArray.length)); 
    const rows = Math.ceil(photosArray.length / cols);
    const canvas = document.createElement('canvas');
    canvas.width = cols * CELL_SIZE + (cols + 1) * SPACING; 
    canvas.height = rows * CELL_SIZE + (rows + 1) * SPACING;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(null);
      return;
    }
    ctx.fillStyle = '#ffffff'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const loadedImages = await Promise.all(photosArray.map(p => {
      return new Promise<{img: HTMLImageElement, zoom: number}>((resolve, reject) => {
        const img = new Image(); 
        img.onload = () => resolve({ img, zoom: p.zoom || 1 }); 
        img.onerror = reject; 
        img.src = p.preview;
      });
    }));
    
    loadedImages.forEach((item, index) => {
      const { img, zoom } = item;
      const col = index % cols; 
      const row = Math.floor(index / cols);
      const x = SPACING + col * (CELL_SIZE + SPACING); 
      const y = SPACING + row * (CELL_SIZE + SPACING);
      
      const baseScale = Math.max(CELL_SIZE / img.width, CELL_SIZE / img.height);
      const finalScale = baseScale * zoom;
      const nw = img.width * finalScale; 
      const nh = img.height * finalScale;
      const ox = (CELL_SIZE - nw) / 2; 
      const oy = (CELL_SIZE - nh) / 2;
      
      ctx.save(); 
      ctx.beginPath();
      if (ctx.roundRect) { 
        ctx.roundRect(x, y, CELL_SIZE, CELL_SIZE, 16); 
      } else { 
        ctx.rect(x, y, CELL_SIZE, CELL_SIZE); 
      }
      ctx.clip();
      ctx.drawImage(img, x + ox, y + oy, nw, nh); 
      ctx.restore();
    });
    
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(null);
        return;
      }
      const newFile = new File([blob], `Kolase_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const newUrl = URL.createObjectURL(blob);
      resolve({ url: newUrl, file: newFile });
    }, 'image/jpeg', 0.85);
  } catch (err) {
    console.error("Gagal membuat kolase:", err);
    resolve(null);
  }
  });
};
