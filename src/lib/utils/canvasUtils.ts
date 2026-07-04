// src/lib/utils/canvasUtils.ts

export const compressImageFile = async (
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.8
): Promise<{ file: File; preview: string }> => {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth || height > maxHeight) {
        const scale = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ file, preview: objectUrl });
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            resolve({ file, preview: URL.createObjectURL(file) });
            return;
          }
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, '') + '.jpg',
            { type: 'image/jpeg', lastModified: Date.now() }
          );
          const compressedPreview = URL.createObjectURL(blob);
          resolve({ file: compressedFile, preview: compressedPreview });
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      resolve({ file, preview: objectUrl });
    };
    img.src = objectUrl;
  });
};

export const processPhotosToCollage = async (
  photosArray: { preview: string; zoom?: number }[]
): Promise<{ url: string, file: File } | null> => {
  return new Promise(async (resolve) => {
    if (photosArray.length <= 1) {
      resolve(null);
      return;
    }


  try {
    const loadedImages = await Promise.all(photosArray.map(p => {
      return new Promise<{img: HTMLImageElement, zoom: number}>((resolve) => {
        const img = new Image();
        let settled = false;
        const finish = () => {
          if (!settled) {
            settled = true;
            resolve({ img, zoom: p.zoom || 1 });
          }
        };
        const timer = setTimeout(finish, 4000);
        img.onload = () => { clearTimeout(timer); finish(); }; 
        img.onerror = () => {
          clearTimeout(timer);
          console.warn("Gambar gagal dimuat untuk kolase:", p.preview);
          finish();
        }; 
        img.src = p.preview;
        if (img.complete && img.naturalWidth > 0) {
          clearTimeout(timer);
          finish();
        }
      });
    }));
    
    const validImages = loadedImages.filter(item => item.img && item.img.naturalWidth > 0 && item.img.naturalHeight > 0);
    if (validImages.length <= 1) {
      resolve(null);
      return;
    }

    const CELL_SIZE = 800; 
    const SPACING = 24;    
    const cols = Math.ceil(Math.sqrt(validImages.length)); 
    const rows = Math.ceil(validImages.length / cols);
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
    
    validImages.forEach((item, index) => {
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
