import { jsxs, jsx } from "react/jsx-runtime";
import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Rect, Image, Transformer } from "react-konva";
import useImage from "use-image";
import { LayoutGrid, X, RefreshCw, Check } from "lucide-react";
const DraggableImage = ({
  photo,
  isSelected,
  onSelect,
  onChange,
  disabled = false
}) => {
  const [img] = useImage(photo.preview);
  const imageRef = useRef(null);
  const trRef = useRef(null);
  useEffect(() => {
    if (isSelected && trRef.current && imageRef.current) {
      trRef.current.nodes([imageRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);
  useEffect(() => {
    if (img && photo.width === 0) {
      const aspectRatio = img.width / img.height;
      const defaultHeight = 300;
      const defaultWidth = defaultHeight * aspectRatio;
      onChange({
        ...photo,
        width: defaultWidth,
        height: defaultHeight
      });
    }
  }, [img]);
  return /* @__PURE__ */ jsxs(React.Fragment, { children: [
    /* @__PURE__ */ jsx(
      Image,
      {
        image: img,
        x: photo.x,
        y: photo.y,
        width: photo.width || 300,
        height: photo.height || 300,
        rotation: photo.rotation || 0,
        draggable: !disabled,
        ref: imageRef,
        onClick: onSelect,
        onTap: onSelect,
        onDragEnd: (e) => {
          onChange({
            ...photo,
            x: e.target.x(),
            y: e.target.y()
          });
        },
        onTransformEnd: () => {
          const node = imageRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...photo,
            x: node.x(),
            y: node.y(),
            width: Math.max(50, node.width() * scaleX),
            height: Math.max(50, node.height() * scaleY),
            rotation: node.rotation()
          });
        }
      }
    ),
    isSelected && !disabled && /* @__PURE__ */ jsx(
      Transformer,
      {
        ref: trRef,
        boundBoxFunc: (oldBox, newBox) => {
          if (newBox.width < 50 || newBox.height < 50) {
            return oldBox;
          }
          return newBox;
        }
      }
    )
  ] });
};
const CollageEditor = ({ photos, isOpen, onClose, onSave }) => {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [canvasSize, setCanvasSize] = useState({ width: 1080, height: 1080 });
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [stageScale, setStageScale] = useState(1);
  useEffect(() => {
    if (isOpen && photos.length > 0) {
      const newItems = photos.map((p, i) => ({
        ...p,
        uniqueId: p.id.toString(),
        x: 50 + i * 40,
        y: 50 + i * 40,
        width: 0,
        // Will be set when image loads
        height: 0,
        rotation: 0
      }));
      setItems(newItems);
    }
  }, [isOpen, photos]);
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;
      const scaleX = containerWidth / canvasSize.width;
      const scaleY = containerHeight / canvasSize.height;
      setStageScale(Math.min(scaleX, scaleY, 1) * 0.9);
    }
  }, [isOpen, canvasSize]);
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
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, canvasSize]);
  if (!isOpen) return null;
  const handleDeselect = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === "bg";
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };
  const bringToFront = () => {
    if (!selectedId) return;
    const itemsCopy = [...items];
    const index = itemsCopy.findIndex((i) => i.uniqueId === selectedId);
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
    const newWidth = cols * cellW + (cols + 1) * SPACING;
    const newHeight = rows * cellH + (rows + 1) * SPACING;
    setCanvasSize({ width: newWidth, height: newHeight });
    const newItems = items.map((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      return {
        ...item,
        x: SPACING + col * (cellW + SPACING),
        y: SPACING + row * (cellH + SPACING),
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
    setSelectedId(null);
    setTimeout(() => {
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2, quality: 0.85, mimeType: "image/jpeg" });
      fetch(dataUrl).then((res) => res.blob()).then((blob) => {
        const file = new File([blob], `Kolase_Custom_${Date.now()}.jpg`, { type: "image/jpeg" });
        onSave(file, dataUrl);
      });
    }, 100);
  };
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[100] bg-slate-900/95 flex flex-col backdrop-blur-sm", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 text-white", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(LayoutGrid, { className: "w-5 h-5 text-blue-400" }),
        " Editor Kolase"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsx("button", { onClick: onClose, className: "p-2 hover:bg-slate-700 rounded-full transition-colors", children: /* @__PURE__ */ jsx(X, { className: "w-6 h-6" }) }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "w-64 bg-slate-800 border-r border-slate-700 flex flex-col overflow-y-auto hidden md:flex", children: /* @__PURE__ */ jsxs("div", { className: "p-4 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-3", children: "Kanvas & Layout" }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => setCanvasSize({ width: 1080, height: 1080 }), className: `p-2 text-sm rounded border ${canvasSize.width === 1080 && canvasSize.height === 1080 ? "bg-blue-600/20 border-blue-500 text-blue-400" : "border-slate-600 text-slate-300 hover:bg-slate-700"}`, children: "1:1 Kotak" }),
            /* @__PURE__ */ jsx("button", { onClick: () => setCanvasSize({ width: 1080, height: 1440 }), className: `p-2 text-sm rounded border ${canvasSize.height === 1440 ? "bg-blue-600/20 border-blue-500 text-blue-400" : "border-slate-600 text-slate-300 hover:bg-slate-700"}`, children: "3:4 Portrait" }),
            /* @__PURE__ */ jsx("button", { onClick: () => setCanvasSize({ width: 1080, height: 1920 }), className: `p-2 text-sm rounded border ${canvasSize.height === 1920 ? "bg-blue-600/20 border-blue-500 text-blue-400" : "border-slate-600 text-slate-300 hover:bg-slate-700"}`, children: "9:16 Story" }),
            /* @__PURE__ */ jsx("button", { onClick: () => setCanvasSize({ width: 1440, height: 1080 }), className: `p-2 text-sm rounded border ${canvasSize.width === 1440 ? "bg-blue-600/20 border-blue-500 text-blue-400" : "border-slate-600 text-slate-300 hover:bg-slate-700"}`, children: "4:3 Lanskap" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-3", children: "Background" }),
          /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: ["#ffffff", "#000000", "#f1f5f9", "#1e293b", "#3b82f6"].map((color) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setBgColor(color),
              className: `w-8 h-8 rounded-full border-2 ${bgColor === color ? "border-blue-500 scale-110" : "border-transparent"}`,
              style: { backgroundColor: color }
            },
            color
          )) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-3", children: "Tindakan Cepat" }),
          /* @__PURE__ */ jsxs("button", { onClick: autoGrid, className: "w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded transition-colors mb-2", children: [
            /* @__PURE__ */ jsx(LayoutGrid, { className: "w-4 h-4" }),
            " Susun Auto Grid"
          ] }),
          selectedId && /* @__PURE__ */ jsxs("button", { onClick: bringToFront, className: "w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded transition-colors", children: [
            /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4" }),
            " Bawa Ke Depan"
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { ref: containerRef, className: "flex-1 bg-slate-900 flex items-center justify-center overflow-hidden p-4 relative", children: [
        /* @__PURE__ */ jsxs("div", { className: "md:hidden absolute bottom-4 left-4 right-4 flex justify-between gap-2 z-10 bg-slate-800/90 p-2 rounded-xl border border-slate-700 backdrop-blur-md", children: [
          /* @__PURE__ */ jsxs("button", { onClick: autoGrid, className: "flex-1 flex flex-col items-center p-2 text-slate-300 hover:text-white", children: [
            /* @__PURE__ */ jsx(LayoutGrid, { className: "w-5 h-5 mb-1" }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px]", children: "Auto Grid" })
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: () => setCanvasSize((prev) => prev.width === 1080 ? { width: 1080, height: 1440 } : { width: 1080, height: 1080 }), className: "flex-1 flex flex-col items-center p-2 text-slate-300 hover:text-white", children: [
            /* @__PURE__ */ jsx(RefreshCw, { className: "w-5 h-5 mb-1" }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px]", children: "Rasio" })
          ] }),
          selectedId && /* @__PURE__ */ jsxs("button", { onClick: bringToFront, className: "flex-1 flex flex-col items-center p-2 text-blue-400 hover:text-blue-300", children: [
            /* @__PURE__ */ jsx(RefreshCw, { className: "w-5 h-5 mb-1" }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px]", children: "Ke Depan" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { transform: `scale(${stageScale})`, transformOrigin: "center center" }, className: "shadow-2xl", children: /* @__PURE__ */ jsx(
          Stage,
          {
            width: canvasSize.width,
            height: canvasSize.height,
            onMouseDown: handleDeselect,
            onTouchStart: handleDeselect,
            ref: stageRef,
            children: /* @__PURE__ */ jsxs(Layer, { children: [
              /* @__PURE__ */ jsx(
                Rect,
                {
                  x: 0,
                  y: 0,
                  width: canvasSize.width,
                  height: canvasSize.height,
                  fill: bgColor,
                  name: "bg"
                }
              ),
              items.map((item, i) => /* @__PURE__ */ jsx(
                DraggableImage,
                {
                  photo: item,
                  isSelected: item.uniqueId === selectedId,
                  onSelect: () => setSelectedId(item.uniqueId),
                  onChange: (newAttrs) => {
                    const newItems = items.slice();
                    newItems[i] = newAttrs;
                    setItems(newItems);
                  }
                },
                item.uniqueId
              ))
            ] })
          }
        ) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-slate-800 border-t border-slate-700 p-4 flex justify-end", children: /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: saveCollage,
        className: "bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5",
        children: [
          /* @__PURE__ */ jsx(Check, { className: "w-5 h-5" }),
          " Simpan Kolase"
        ]
      }
    ) })
  ] });
};
export {
  CollageEditor
};
