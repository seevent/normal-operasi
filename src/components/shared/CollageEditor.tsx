import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Rect } from 'react-konva';
import useImage from 'use-image';
import { X, LayoutGrid, Check, RefreshCw } from 'lucide-react';
import { Photo } from './PhotoUploader';

// Custom component to load and render image on Konva
const DraggableImage = ({ 
  photo, 
  isSelected, 
  onSelect, 
  onChange,
  disabled = false
}: { 
  photo: any; 
  isSelected: boolean; 
  onSelect: () => void; 
  onChange: (newAttrs: any) => void;
  disabled?: boolean;
}) => {
  const [img] = useImage(photo.preview);
  const imageRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current && imageRef.current) {
      trRef.current.nodes([imageRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  // Set default dimensions when image loads if not set
  useEffect(() => {
    if (img && photo.width === 0) {
      // Calculate aspect ratio
      const aspectRatio = img.width / img.height;
      const defaultHeight = 300;
      const defaultWidth = defaultHeight * aspectRatio;
      onChange({
        ...photo,
        width: defaultWidth,
        height: defaultHeight,
      });
    }
  }, [img]);

  return (
    <React.Fragment>
      <KonvaImage
        image={img}
        x={photo.x}
        y={photo.y}
        width={photo.width || 300}
        height={photo.height || 300}
        rotation={photo.rotation || 0}
        draggable={!disabled}
        ref={imageRef}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            ...photo,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={() => {
          const node = imageRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          // Reset scale and apply to width/height for standard behavior
          node.scaleX(1);
          node.scaleY(1);
          
          onChange({
            ...photo,
            x: node.x(),
            y: node.y(),
            width: Math.max(50, node.width() * scaleX),
            height: Math.max(50, node.height() * scaleY),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && !disabled && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 50 || newBox.height < 50) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

export const CollageEditor: React.FC<{
  photos: Photo[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (file: File, url: string) => void;
  onSave: (file: File, url: string) => void;
}> = ({ photos, isOpen, onClose, onSave }) => {
  
  const [items, setItems] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [canvasSize, setCanvasSize] = useState({ width: 1080, height: 1080 }); // 1:1 Default
  
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Responsive stage scaling
  const [stageScale, setStageScale] = useState(1);

  // Initialize items when opened
  useEffect(() => {
    if (isOpen && photos.length > 0) {
      // Create initial layout (cascade)
      const newItems = photos.map((p, i) => ({
        ...p,
        uniqueId: p.id.toString(),
        x: 50 + (i * 40),
        y: 50 + (i * 40),
        width: 0, // Will be set when image loads
        height: 0,
        rotation: 0
      }));
      setItems(newItems);
    }
  }, [isOpen, photos]);

  // Adjust scale to fit screen
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;
      const scaleX = containerWidth / canvasSize.width;
      const scaleY = containerHeight / canvasSize.height;
      setStageScale(Math.min(scaleX, scaleY, 1) * 0.9); // 90% of screen
    }
  }, [isOpen, canvasSize]);

  // Recalculate scale on window resize
  useEffect(() => {
    const handleResize = () => {
      if (isOpen && containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;
        const scaleX = containerWidth / canvasSize.width;
        const scaleY = containerHeight / canvasSize.height;
        setStageScale(Math.min(scaleX, scaleY, 1) * 0.9);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, canvasSize]);

  if (!isOpen) return null;

  const handleDeselect = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'bg';
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };

  const bringToFront = () => {
    if (!selectedId) return;
    const itemsCopy = [...items];
    const index = itemsCopy.findIndex(i => i.uniqueId === selectedId);
    if (index !== -1) {
      const [item] = itemsCopy.splice(index, 1);
      itemsCopy.push(item);
      setItems(itemsCopy);
    }
  };

  const autoGrid = () => {
    if (items.length === 0) return;
    
    const SPACING = 20;
    const cols = Math.ceil(Math.sqrt(items.length));
    const rows = Math.ceil(items.length / cols);
    
    const cellW = 400;
    const cellH = 400;
    
    const newWidth = (cols * cellW) + ((cols + 1) * SPACING);
    const newHeight = (rows * cellH) + ((rows + 1) * SPACING);
    
    setCanvasSize({ width: newWidth, height: newHeight });

    const newItems = items.map((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      return {
        ...item,
        x: SPACING + (col * (cellW + SPACING)),
        y: SPACING + (row * (cellH + SPACING)),
        width: cellW,
        height: cellH,
        rotation: 0
      };
    });
    setItems(newItems);
    setSelectedId(null);
  };

  const saveCollage = () => {
    if (!stageRef.current) return;
    // Deselect before saving
    setSelectedId(null);
    
    setTimeout(() => {
      // Get the data URL at full size (pixel ratio 1)
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2, quality: 0.85, mimeType: 'image/jpeg' });
      
      // Convert to file
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `Kolase_Custom_${Date.now()}.jpg`, { type: 'image/jpeg' });
          onSave(file, dataUrl);
        });
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 flex flex-col backdrop-blur-sm">
      {/* Topbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 text-white">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-blue-400" /> Editor Kolase
        </h2>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar Tools */}
        <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col overflow-y-auto hidden md:flex">
          <div className="p-4 space-y-6">
            
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Kanvas & Layout</h3>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setCanvasSize({ width: 1080, height: 1080 })} className={`p-2 text-sm rounded border ${canvasSize.width === 1080 && canvasSize.height === 1080 ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}`}>
                  1:1 Kotak
                </button>
                <button onClick={() => setCanvasSize({ width: 1080, height: 1440 })} className={`p-2 text-sm rounded border ${canvasSize.height === 1440 ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}`}>
                  3:4 Portrait
                </button>
                <button onClick={() => setCanvasSize({ width: 1080, height: 1920 })} className={`p-2 text-sm rounded border ${canvasSize.height === 1920 ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}`}>
                  9:16 Story
                </button>
                <button onClick={() => setCanvasSize({ width: 1440, height: 1080 })} className={`p-2 text-sm rounded border ${canvasSize.width === 1440 ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}`}>
                  4:3 Lanskap
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Background</h3>
              <div className="flex gap-2">
                {['#ffffff', '#000000', '#f1f5f9', '#1e293b', '#3b82f6'].map(color => (
                  <button 
                    key={color} 
                    onClick={() => setBgColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${bgColor === color ? 'border-blue-500 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Tindakan Cepat</h3>
              <button onClick={autoGrid} className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded transition-colors mb-2">
                <LayoutGrid className="w-4 h-4" /> Susun Auto Grid
              </button>
              {selectedId && (
                <button onClick={bringToFront} className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded transition-colors">
                  <RefreshCw className="w-4 h-4" /> Bawa Ke Depan
                </button>
              )}
            </div>
            
          </div>
        </div>

        {/* Canvas Area */}
        <div ref={containerRef} className="flex-1 bg-slate-900 flex items-center justify-center overflow-hidden p-4 relative">
          
          {/* Mobile floating tools */}
          <div className="md:hidden absolute bottom-4 left-4 right-4 flex justify-between gap-2 z-10 bg-slate-800/90 p-2 rounded-xl border border-slate-700 backdrop-blur-md">
            <button onClick={autoGrid} className="flex-1 flex flex-col items-center p-2 text-slate-300 hover:text-white">
              <LayoutGrid className="w-5 h-5 mb-1" />
              <span className="text-[10px]">Auto Grid</span>
            </button>
            <button onClick={() => setCanvasSize(prev => prev.width === 1080 ? {width: 1080, height: 1440} : {width: 1080, height: 1080})} className="flex-1 flex flex-col items-center p-2 text-slate-300 hover:text-white">
              <RefreshCw className="w-5 h-5 mb-1" />
              <span className="text-[10px]">Rasio</span>
            </button>
            {selectedId && (
              <button onClick={bringToFront} className="flex-1 flex flex-col items-center p-2 text-blue-400 hover:text-blue-300">
                <RefreshCw className="w-5 h-5 mb-1" />
                <span className="text-[10px]">Ke Depan</span>
              </button>
            )}
          </div>

          <div style={{ transform: `scale(${stageScale})`, transformOrigin: 'center center' }} className="shadow-2xl">
            <Stage 
              width={canvasSize.width} 
              height={canvasSize.height} 
              onMouseDown={handleDeselect}
              onTouchStart={handleDeselect}
              ref={stageRef}
            >
              <Layer>
                {/* Background */}
                <Rect
                  x={0}
                  y={0}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  fill={bgColor}
                  name="bg"
                />
                
                {/* Images */}
                {items.map((item, i) => (
                  <DraggableImage
                    key={item.uniqueId}
                    photo={item}
                    isSelected={item.uniqueId === selectedId}
                    onSelect={() => setSelectedId(item.uniqueId)}
                    onChange={(newAttrs) => {
                      const newItems = items.slice();
                      newItems[i] = newAttrs;
                      setItems(newItems);
                    }}
                  />
                ))}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-slate-800 border-t border-slate-700 p-4 flex justify-end">
        <button 
          onClick={saveCollage}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5"
        >
          <Check className="w-5 h-5" /> Simpan Kolase
        </button>
      </div>

    </div>
  );
};
