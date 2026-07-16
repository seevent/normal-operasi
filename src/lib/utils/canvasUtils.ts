// src/lib/utils/canvasUtils.ts
import { drawTextOverlay } from '../../components/shared/PhotoTextEditorModal';

export const compressImageFile = async (
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.8
): Promise<{ file: File; preview: string }> => {
  if (file.type.startsWith('video/')) {
    return { file, preview: URL.createObjectURL(file) };
  }
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

export const drawCellTextOverlay = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellW: number,
  cellH: number,
  annotation: {
    text: string;
    position: 'top' | 'bottom' | 'center';
    style: 'black' | 'red' | 'green' | 'yellow' | 'clear';
    size: 'small' | 'medium' | 'large' | number;
    align?: 'left' | 'center' | 'right';
  },
  originalImgHeight?: number
) => {
  if (!annotation.text || !annotation.text.trim()) return;

  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, cellW, cellH, 16);
  } else {
    ctx.rect(x, y, cellW, cellH);
  }
  ctx.clip();

  const baseDim = Math.max(cellW, cellH);
  let fontSize = 28;
  if (typeof annotation.size === 'number' && !isNaN(annotation.size)) {
    const scaleFactor = originalImgHeight && originalImgHeight > 0 ? (cellH / originalImgHeight) : 0.67;
    fontSize = Math.max(14, Math.min(Math.floor(cellH / 2), Math.round(annotation.size * scaleFactor)));
  } else {
    let fontScale = 0.12;
    if (annotation.size === 'small') fontScale = 0.08;
    if (annotation.size === 'large') fontScale = 0.18;
    fontSize = Math.max(16, Math.round(baseDim * fontScale));
  }

  const align = annotation.align || 'center';
  ctx.font = `bold ${fontSize}px sans-serif, Arial, Inter`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';

  const lines: string[] = [];
  const rawLines = annotation.text.split('\n');
  const maxLineWidth = cellW * 0.9;

  rawLines.forEach(rawLine => {
    const words = rawLine.split(' ');
    let currentLine = '';
    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > maxLineWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine);
  });

  if (lines.length === 0) {
    ctx.restore();
    return;
  }

  const lineHeight = fontSize * 1.35;
  const paddingY = fontSize * 0.6;
  const boxHeight = lines.length * lineHeight + paddingY * 2;

  let boxY = y + cellH - boxHeight; // bottom
  if (annotation.position === 'top') boxY = y; // top
  if (annotation.position === 'center') boxY = y + (cellH - boxHeight) / 2; // center

  if (annotation.style !== 'clear') {
    let bgColor = 'rgba(0, 0, 0, 0.65)';
    if (annotation.style === 'red') bgColor = 'rgba(220, 38, 38, 0.85)';
    if (annotation.style === 'green') bgColor = 'rgba(22, 163, 74, 0.85)';
    if (annotation.style === 'yellow') bgColor = 'rgba(234, 179, 8, 0.85)';

    ctx.fillStyle = bgColor;
    ctx.fillRect(x, boxY, cellW, boxHeight);
  }

  const paddingX = cellW * 0.05;
  lines.forEach((line, index) => {
    let textX = x + cellW / 2;
    if (align === 'left') textX = x + paddingX;
    if (align === 'right') textX = x + cellW - paddingX;

    const textY = boxY + paddingY + (index + 0.5) * lineHeight;

    if (annotation.style === 'clear') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = Math.round(fontSize * 0.3);
      ctx.shadowOffsetX = Math.max(2, Math.round(fontSize * 0.05));
      ctx.shadowOffsetY = Math.max(2, Math.round(fontSize * 0.05));
      ctx.lineWidth = Math.max(3, Math.round(fontSize * 0.12));
      ctx.strokeStyle = '#000000';
      ctx.strokeText(line, textX, textY);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line, textX, textY);
    } else if (annotation.style === 'yellow') {
      ctx.fillStyle = '#000000';
      ctx.fillText(line, textX, textY);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line, textX, textY);
    }
  });

  ctx.restore();
};

export const processPhotosToCollage = async (
  photosArray: { preview: string; zoom?: number; annotation?: any; originalPreview?: string }[],
  annotation?: {
    text: string;
    position: 'top' | 'bottom' | 'center';
    style: 'black' | 'red' | 'green' | 'yellow' | 'clear';
    size: 'small' | 'medium' | 'large' | number;
    align?: 'left' | 'center' | 'right';
  }
): Promise<{ url: string, file: File } | null> => {
  return new Promise(async (resolve) => {
    const imagePhotos = photosArray.filter((p: any) => !p.file?.type?.startsWith('video/'));
    if (imagePhotos.length <= 1) {
      resolve(null);
      return;
    }

  try {
    const loadedImages = await Promise.all(imagePhotos.map(p => {
      return new Promise<{img: HTMLImageElement, zoom: number, annotation?: any}>((resolve) => {
        const img = new Image();
        let settled = false;
        const finish = () => {
          if (!settled) {
            settled = true;
            resolve({ img, zoom: p.zoom || 1, annotation: p.annotation });
          }
        };
        const timer = setTimeout(finish, 4000);
        img.onload = () => { clearTimeout(timer); finish(); }; 
        img.onerror = () => {
          clearTimeout(timer);
          console.warn("Gambar gagal dimuat untuk kolase:", p.preview);
          finish();
        }; 
        img.src = (p.annotation && p.originalPreview) ? p.originalPreview : p.preview;
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
      const { img, zoom, annotation: itemAnnotation } = item;
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
      
      if (itemAnnotation && itemAnnotation.text && itemAnnotation.text.trim()) {
        drawCellTextOverlay(ctx, x, y, CELL_SIZE, CELL_SIZE, itemAnnotation, img.naturalHeight || img.height);
      }
      
      ctx.restore();
    });
    
    if (annotation && annotation.text && annotation.text.trim()) {
      drawTextOverlay(canvas, annotation.text, annotation.position, annotation.style, annotation.size, annotation.align || 'center');
    }
    
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
