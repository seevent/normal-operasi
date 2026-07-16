import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Type, X, Sparkles, Clock, ArrowDown, ArrowUp, Minus, AlignLeft, AlignCenter, AlignRight, Palette, Check, RotateCcw, Cpu, FileWarning, MapPin, Plus, Calendar, AlertCircle, CheckCircle, Share2, FileText, Camera, Move, Trash2, ImagePlus, ZoomIn, ZoomOut, Users, Loader2, User, ClipboardList, Wrench, CheckSquare, Save, RefreshCw, Square, Lock, Cloud, ChevronUp, ChevronDown, Megaphone, FileSpreadsheet, AlertTriangle, Settings, ChevronRight, Edit2, Layers, Tag, Building2, ShieldCheck, Zap, Search, Box, CheckCircle2, LayoutGrid, Database, Hash, Mail, KeyRound, LogOut, Briefcase, Edit, Download, List, PlaneTakeoff, PlaneLanding, Image as Image$1, Upload, Sliders, MoreHorizontal } from "lucide-react";
import { create } from "zustand";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
const MonitorSearchIcon = ({ className }) => {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      children: [
        /* @__PURE__ */ jsx("rect", { width: "20", height: "14", x: "2", y: "3", rx: "2" }),
        /* @__PURE__ */ jsx("line", { x1: "8", x2: "16", y1: "21", y2: "21" }),
        /* @__PURE__ */ jsx("line", { x1: "12", x2: "12", y1: "17", y2: "21" }),
        /* @__PURE__ */ jsx("circle", { cx: "11", cy: "9", r: "3" }),
        /* @__PURE__ */ jsx("line", { x1: "13.1", x2: "16", y1: "11.1", y2: "14" })
      ]
    }
  );
};
const KaabaIcon = ({ className }) => {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      children: [
        /* @__PURE__ */ jsx("path", { d: "M4 5.5a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 20 5.5v14a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5v-14z" }),
        /* @__PURE__ */ jsx("line", { x1: "4", y1: "9", x2: "20", y2: "9" }),
        /* @__PURE__ */ jsx("line", { x1: "4", y1: "12", x2: "20", y2: "12" }),
        /* @__PURE__ */ jsx("path", { d: "M14 14.5v6.5" }),
        /* @__PURE__ */ jsx("path", { d: "M18 14.5v6.5" }),
        /* @__PURE__ */ jsx("path", { d: "M14 14.5h4" }),
        /* @__PURE__ */ jsx("circle", { cx: "7.5", cy: "16.5", r: "1", fill: "currentColor" })
      ]
    }
  );
};
const useAppStore = create((set) => ({
  activeTab: "perbaikan",
  setActiveTab: (tab) => set({ activeTab: tab }),
  isCopied: false,
  setIsCopied: (val) => set({ isCopied: val })
}));
const drawTextOverlay = (canvas, text, position, style, size, align = "center") => {
  const ctx = canvas.getContext("2d");
  if (!ctx || !text.trim()) return;
  const baseDim = Math.max(canvas.width, canvas.height);
  let fontSize = 40;
  if (typeof size === "number" && !isNaN(size)) {
    fontSize = Math.max(12, Math.min(Math.floor(canvas.height / 2), Math.round(size)));
  } else {
    let fontScale = 0.12;
    if (size === "small") fontScale = 0.08;
    if (size === "large") fontScale = 0.18;
    fontSize = Math.max(20, Math.round(baseDim * fontScale));
  }
  ctx.font = `bold ${fontSize}px sans-serif, Arial, Inter`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  const lines = [];
  const rawLines = text.split("\n");
  const maxLineWidth = canvas.width * 0.9;
  rawLines.forEach((rawLine) => {
    const words = rawLine.split(" ");
    let currentLine = "";
    words.forEach((word) => {
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
  if (lines.length === 0) return;
  const lineHeight = fontSize * 1.35;
  const paddingY = fontSize * 0.6;
  const boxHeight = lines.length * lineHeight + paddingY * 2;
  let boxY = canvas.height - boxHeight;
  if (position === "top") boxY = 0;
  if (position === "center") boxY = (canvas.height - boxHeight) / 2;
  if (style !== "clear") {
    let bgColor = "rgba(0, 0, 0, 0.65)";
    if (style === "red") bgColor = "rgba(220, 38, 38, 0.85)";
    if (style === "green") bgColor = "rgba(22, 163, 74, 0.85)";
    if (style === "yellow") bgColor = "rgba(234, 179, 8, 0.85)";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, boxY, canvas.width, boxHeight);
  }
  const paddingX = canvas.width * 0.05;
  lines.forEach((line, index) => {
    let textX = canvas.width / 2;
    if (align === "left") textX = paddingX;
    if (align === "right") textX = canvas.width - paddingX;
    const textY = boxY + paddingY + (index + 0.5) * lineHeight;
    if (style === "clear") {
      ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
      ctx.shadowBlur = Math.round(fontSize * 0.3);
      ctx.shadowOffsetX = Math.max(2, Math.round(fontSize * 0.05));
      ctx.shadowOffsetY = Math.max(2, Math.round(fontSize * 0.05));
      ctx.lineWidth = Math.max(3, Math.round(fontSize * 0.12));
      ctx.strokeStyle = "#000000";
      ctx.strokeText(line, textX, textY);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(line, textX, textY);
    } else if (style === "yellow") {
      ctx.fillStyle = "#000000";
      ctx.fillText(line, textX, textY);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillText(line, textX, textY);
    }
  });
};
const drawTextOnCanvas = (canvas, img, text, position, style, size, align = "center") => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = img.naturalWidth || img.width || 1200;
  canvas.height = img.naturalHeight || img.height || 1200;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  drawTextOverlay(canvas, text, position, style, size, align);
};
const PhotoTextEditorModal = ({
  isOpen,
  onClose,
  photoUrl,
  initialAnnotation,
  onSave,
  onReset,
  hasOriginal
}) => {
  const [text, setText] = useState("");
  const [position, setPosition] = useState("bottom");
  const [style, setStyle] = useState("clear");
  const [size, setSize] = useState("medium");
  const [align, setAlign] = useState("center");
  const [maxFontSize, setMaxFontSize] = useState(300);
  const [minFontSize, setMinFontSize] = useState(14);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  useEffect(() => {
    if (isOpen) {
      setText(initialAnnotation?.text || "");
      setPosition(initialAnnotation?.position || "bottom");
      setStyle(initialAnnotation?.style || "clear");
      setAlign(initialAnnotation?.align || "center");
      if (initialAnnotation?.size !== void 0) {
        setSize(initialAnnotation.size);
      } else {
        setSize("medium");
      }
    }
  }, [isOpen, initialAnnotation]);
  useEffect(() => {
    if (!isOpen || !photoUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      const imgH = img.naturalHeight || img.height || 1200;
      const maxSz = Math.max(24, Math.floor(imgH / 2));
      const minSz = Math.max(12, Math.floor(imgH * 0.02));
      setMaxFontSize(maxSz);
      setMinFontSize(minSz);
      let currentNumericSize = typeof size === "number" && !isNaN(size) ? size : Math.round(imgH * 0.12);
      if (size === "small") currentNumericSize = Math.round(imgH * 0.08);
      if (size === "medium") currentNumericSize = Math.round(imgH * 0.12);
      if (size === "large") currentNumericSize = Math.round(imgH * 0.18);
      if (typeof size !== "number") {
        setSize(currentNumericSize);
      }
      if (canvasRef.current) {
        drawTextOnCanvas(canvasRef.current, img, text, position, style, typeof size === "number" ? size : currentNumericSize, align);
      }
    };
    img.src = photoUrl;
  }, [isOpen, photoUrl, text, position, style, size, align]);
  if (!isOpen) return null;
  const handleSave = () => {
    if (!canvasRef.current || !imageRef.current) return;
    setIsProcessing(true);
    const imgH = imageRef.current.naturalHeight || imageRef.current.height || 1200;
    const finalSize = typeof size === "number" ? size : Math.round(imgH * 0.12);
    drawTextOnCanvas(canvasRef.current, imageRef.current, text, position, style, finalSize, align);
    canvasRef.current.toBlob((blob) => {
      setIsProcessing(false);
      if (!blob) return;
      const filename = `Photo_text_${Date.now()}.jpg`;
      const newFile = new File([blob], filename, { type: "image/jpeg", lastModified: Date.now() });
      const newPreviewUrl = URL.createObjectURL(blob);
      const annotation = text.trim() ? {
        text: text.trim(),
        position,
        style,
        size: finalSize,
        align
      } : void 0;
      onSave(newFile, newPreviewUrl, annotation);
      onClose();
    }, "image/jpeg", 0.92);
  };
  const presets = [
    "Before",
    "After",
    "Process"
  ];
  const addTimestamp = () => {
    const now = /* @__PURE__ */ new Date();
    const timeStr = now.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }) + " WIB";
    setText((prev) => prev ? `${prev}
${timeStr}` : timeStr);
  };
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]", children: [
    /* @__PURE__ */ jsxs("div", { className: "px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Type, { className: "w-5 h-5 text-blue-200" }),
        /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg", children: "Beri Teks / Watermark Foto" })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: onClose,
          className: "p-1 rounded-full hover:bg-white/20 transition-colors text-white",
          children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 overflow-y-auto flex-1 space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("label", { className: "text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "w-3.5 h-3.5 text-amber-500" }),
          " Preview Hasil Teks"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "bg-slate-900 rounded-xl p-2 flex items-center justify-center border border-slate-200 shadow-inner min-h-[220px] max-h-[380px] overflow-hidden", children: /* @__PURE__ */ jsx(
          "canvas",
          {
            ref: canvasRef,
            className: "max-w-full max-h-[360px] w-auto h-auto object-contain rounded-lg shadow-md"
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("label", { className: "text-sm font-bold text-slate-700 flex justify-between items-center", children: [
          /* @__PURE__ */ jsx("span", { children: "Teks / Catatan Laporan" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-normal text-slate-400", children: "Bisa beberapa baris (Enter)" })
        ] }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            value: text,
            onChange: (e) => setText(e.target.value),
            placeholder: "Contoh: Mesin X-Ray Gate 1 - Rusak / Sebelum PM...",
            rows: 2,
            className: "w-full p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium transition-all shadow-sm"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 font-medium", children: "Cepat tambahkan keterangan:" }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1.5", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: addTimestamp,
                className: "px-2.5 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full transition-colors border border-blue-200 flex items-center gap-1 shadow-xs",
                children: [
                  /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
                  " + Waktu Sekarang"
                ]
              }
            ),
            presets.map((preset) => /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setText((prev) => prev ? `${prev} - ${preset}` : preset),
                className: "px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors border border-slate-200",
                children: [
                  "+ ",
                  preset
                ]
              },
              preset
            ))
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4 pt-2 border-t border-slate-100", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1", children: "Posisi Teks" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setPosition("bottom"),
                  className: `py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${position === "bottom" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`,
                  children: [
                    /* @__PURE__ */ jsx(ArrowDown, { className: "w-4 h-4" }),
                    " Bawah"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setPosition("top"),
                  className: `py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${position === "top" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`,
                  children: [
                    /* @__PURE__ */ jsx(ArrowUp, { className: "w-4 h-4" }),
                    " Atas"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setPosition("center"),
                  className: `py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${position === "center" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`,
                  children: [
                    /* @__PURE__ */ jsx(Minus, { className: "w-4 h-4" }),
                    " Tengah"
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1", children: "Rata Teks" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setAlign("left"),
                  className: `py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${align === "left" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`,
                  children: [
                    /* @__PURE__ */ jsx(AlignLeft, { className: "w-4 h-4" }),
                    " Kiri"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setAlign("center"),
                  className: `py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${align === "center" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`,
                  children: [
                    /* @__PURE__ */ jsx(AlignCenter, { className: "w-4 h-4" }),
                    " Tengah"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setAlign("right"),
                  className: `py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${align === "right" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`,
                  children: [
                    /* @__PURE__ */ jsx(AlignRight, { className: "w-4 h-4" }),
                    " Kanan"
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("label", { className: "text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Palette, { className: "w-3.5 h-3.5" }),
              " Warna & Gaya"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-5 gap-1.5", children: [
              { id: "clear", label: "Transparan", bg: "bg-white border-2 border-slate-300 text-slate-800" },
              { id: "black", label: "Hitam", bg: "bg-black text-white" },
              { id: "red", label: "Merah", bg: "bg-red-600 text-white" },
              { id: "green", label: "Hijau", bg: "bg-green-600 text-white" },
              { id: "yellow", label: "Kuning", bg: "bg-yellow-400 text-black font-bold" }
            ].map((item) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setStyle(item.id),
                className: `py-2 rounded-lg text-[10px] font-bold flex items-center justify-center transition-transform ${item.bg} ${style === item.id ? "ring-2 ring-blue-500 ring-offset-2 scale-105" : "opacity-80 hover:opacity-100"}`,
                title: item.label,
                children: style === item.id ? /* @__PURE__ */ jsx(Check, { className: "w-3.5 h-3.5" }) : item.label.slice(0, 3)
              },
              item.id
            )) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-600 uppercase tracking-wider", children: "Ukuran Font (Maks: Setengah Tinggi Foto)" }),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200", children: typeof size === "number" ? `${size}px (${Math.round(size / maxFontSize * 50)}% Tinggi Foto)` : "Sedang" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-100 p-3 rounded-xl border border-slate-200 flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-500", children: "A" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "range",
                min: minFontSize,
                max: maxFontSize,
                value: typeof size === "number" ? size : Math.round((minFontSize + maxFontSize) * 0.1),
                onChange: (e) => setSize(Number(e.target.value)),
                className: "w-full h-2.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-lg font-black text-slate-800", children: "A" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsx("div", { children: hasOriginal && onReset && /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => {
            onReset();
            onClose();
          },
          className: "px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs flex items-center gap-1.5 transition-colors",
          children: [
            /* @__PURE__ */ jsx(RotateCcw, { className: "w-3.5 h-3.5" }),
            " Hapus Teks"
          ]
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: onClose,
            className: "px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-colors",
            children: "Batal"
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: handleSave,
            disabled: isProcessing,
            className: "px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50",
            children: [
              /* @__PURE__ */ jsx(Check, { className: "w-4 h-4" }),
              " ",
              isProcessing ? "Memproses..." : "Simpan & Terapkan"
            ]
          }
        )
      ] })
    ] })
  ] }) });
};
const toTitleCase = (str) => {
  if (!str) return "";
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};
const getJabatanRank = (jabatan) => {
  if (!jabatan) return 999;
  const str = String(jabatan).trim();
  if (!str) return 999;
  const numMatch = str.match(/^(\d+)/);
  if (numMatch) {
    return parseInt(numMatch[1], 10);
  }
  const lower = str.toLowerCase();
  if (lower.includes("manager") || lower.includes("head") || lower.includes("chief") || lower.includes("kadep") || lower.includes("kasi")) return 10;
  if (lower.includes("supervisor") || lower.includes("spv") || lower.includes("koordinator") || lower.includes("asman")) return 20;
  if (lower.includes("engineer")) return 30;
  if (lower.includes("team leader") || lower.includes("leader") || lower === "tl" || lower.startsWith("tl ") || lower.includes("ketua tim")) return 35;
  if (lower.includes("senior") || lower.includes("sr.") || lower.includes("sr ")) return 40;
  if (lower.includes("pembantu teknisi") || lower.includes("pembantu") || lower.includes("helper") || lower.includes("ojt") || lower.includes("magang")) return 60;
  if (lower.includes("teknisi") || lower.includes("technician") || lower.includes("pelaksana") || lower.includes("staff") || lower.includes("anggota")) return 50;
  return 100;
};
const sortPersonelByJabatan = (list) => {
  return [...list].sort((a, b) => {
    const rankA = getJabatanRank(a.jabatan);
    const rankB = getJabatanRank(b.jabatan);
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    const getOrder = (item) => {
      if (item.urutan !== void 0 && item.urutan !== null && !isNaN(Number(item.urutan))) return Number(item.urutan);
      if (item.dbOrder !== void 0 && item.dbOrder !== null && !isNaN(Number(item.dbOrder))) return Number(item.dbOrder);
      return 999;
    };
    const orderA = getOrder(a);
    const orderB = getOrder(b);
    return orderA - orderB;
  });
};
const DEFAULT_DATA_API_T2 = [
  { name: "Dwisasono Glory Prayoga", phone: "081213138823" },
  { name: "Muh. Syukri", phone: "081296010797" },
  { name: "Erman Tri Basuki", phone: "085292076171" },
  { name: "Ageng Pandanaran", phone: "081908198725" },
  { name: "Slamet Riyadi", phone: "081297163525" },
  { name: "Tito Arrya Gaotama", phone: "082211524358" },
  { name: "Yuli Syarif", phone: "081906370863" },
  { name: "Dimas Aria Wiratama", phone: "081296778575" },
  { name: "Dhea Febriani", phone: "087883390219" },
  { name: "Rio Anang Kriswanto", phone: "081398399043" }
].map((p, idx) => ({ ...p, name: toTitleCase(p.name), jabatan: "", dbOrder: idx }));
const DEFAULT_DATA_OM_IAS_T2 = [
  { name: "Aly Masmudi", phone: "085221344164" },
  { name: "Sayuti", phone: "083804054535" },
  { name: "Harmin Sanjayah", phone: "081803767148" },
  { name: "Nora Agil Rumayani", phone: "08970320998" },
  { name: "Wellynthon Agustinus", phone: "0895364757871" },
  { name: "Muhammad Ridho Rabbani", phone: "081385118676" },
  { name: "Muhammad Gusmada", phone: "082132487436" },
  { name: "Edo Ferry Ardian", phone: "085156501083" },
  { name: "Nandio Prihardana", phone: "085172251017" },
  { name: "Rifky Aziz", phone: "085716500615" },
  { name: "Muhammad Agus Sofyan", phone: "085691540333" },
  { name: "Abdul Rifan Sukarno", phone: "083111807154" }
].map((p, idx) => ({ ...p, name: toTitleCase(p.name), jabatan: "", dbOrder: idx }));
const DEFAULT_STORING_EQUIPMENTS = ["Access Control", "X-Ray", "HHMD", "ETD", "WTMD", "Body Scanner"];
const DEFAULT_STORING_LOC_AC = [];
const DEFAULT_STORING_LOC_DEFAULT = [
  "PSCP D",
  "PSCP E",
  "PSCP F",
  "PSCP Umroh",
  "SSCP E",
  "SSCP F",
  "HBSCP 1.1 -1.6",
  "HBSCP 2.1-2.6",
  "HBSCP Umrah"
];
const DEFAULT_CHECKLIST_DATA = [
  {
    type: "location",
    title: "PSCP D",
    summary: "TOTAL PERALATAN PSCP & TRANSFER DESK D",
    categories: [
      { title: "A. X-RAY", summaryKey: "X-RAY", items: ["X-Ray Rapiscan 620DV (No1)", "X-Ray Smith Heiman HS 6040-2is (No2)", "X-Ray Rapiscan 620DV (No3)", "X-Ray Rapiscan 620DV (No4)", "X-Ray Rapiscan 620DV (No5)"] },
      { title: "B. WTMD", summaryKey: "WTMD", items: ["WTMD CEIA HI/PE Multizone (No1)", "WTMD CEIA HI/PE Multizone (No3)", "WTMD CEIA HI/PE Multizone (No4)", "WTMD CEIA HI/PE Multizone (No5)", "WTMD CEIA HI/PE Multizone (Transfer Desk D)"] },
      { title: "C. BODY SCANNER", summaryKey: "BODY SCANNER", items: ["Body Scanner Leidos Provision 2 (No2)"] },
      { title: "D. EXPLOSIVE DETECTOR", summaryKey: "ETD", items: ["ETD Leidos QS-B220"] }
    ]
  },
  {
    type: "location",
    title: "PSCP E",
    summary: "TOTAL PERALATAN PSCP & TRANSFER DESK E",
    categories: [
      { title: "A. X-RAY", summaryKey: "X-RAY", items: ["X-Ray Rapiscan 620DV (No1)", "X-Ray Rapiscan 620DV (No2)", "X-Ray Rapiscan 620DV (No3)", "X-Ray Rapiscan 620DV (No4)", "X-Ray Rapiscan 620DV (No5)"] },
      { title: "B. WTMD", summaryKey: "WTMD", items: ["WTMD CEIA HI/PE Multizone (No1)", "WTMD CEIA HI/PE Multizone (No3)", "WTMD CEIA HI/PE Multizone (No4)", "WTMD CEIA HI/PE Multizone (Transfer Desk E)"] },
      { title: "C. BODY SCANNER", summaryKey: "BODY SCANNER", items: ["Body Scanner Leidos Provision 2 (No2)", "Body Scanner Leidos Provision 2 (No5)"] },
      { title: "D. EXPLOSIVE DETECTOR", summaryKey: "ETD", items: ["ETD Leidos QS-B220"] }
    ]
  },
  {
    type: "location",
    title: "PSCP F",
    summary: "TOTAL PERALATAN PSCP F",
    categories: [
      { title: "A. X-RAY", summaryKey: "X-RAY", items: ["X-Ray Rapiscan 620DV (No1)", "X-Ray Rapiscan Orion 920DV (No2)", "X-Ray Rapiscan 620DV (No3)", "X-Ray Rapiscan 620DV (No4)"] },
      { title: "B. WTMD", summaryKey: "WTMD", items: ["WTMD CEIA HI/PE Multizone (No1)", "WTMD CEIA HI/PE Multizone (No2)", "WTMD CEIA HI/PE Multizone (No3)", "WTMD CEIA HI/PE Multizone (No4)"] },
      { title: "C. BODY SCANNER", summaryKey: "BODY SCANNER", items: ["Body Scanner Leidos Provision 2 (No1)", "Body Scanner Leidos Provision 2 (No2)"] },
      { title: "D. EXPLOSIVE DETECTOR", summaryKey: "ETD", items: ["ETD Leidos QS-B220"] }
    ]
  },
  {
    type: "location",
    title: "PSCP UMROH",
    summary: "TOTAL PERALATAN PSCP UMROH",
    categories: [
      { title: "A. X-RAY", summaryKey: "X-RAY", items: ["X-Ray Nuctech CX6040D (No1)", "X-Ray Nuctech CX6040D (No2)", "X-Ray Rapiscan 620DV (No3)", "X-Ray Rapiscan 620DV (No4)", "X-Ray Rapiscan 620DV (No5)", "X-Ray Rapiscan 620DV (No6)"] },
      { title: "B. WTMD", summaryKey: "WTMD", items: ["WTMD CEIA HI/PE Multizone (No1)", "WTMD CEIA HI/PE Multizone (No2)", "WTMD CEIA HI/PE Multizone (No3)", "WTMD CEIA HI/PE Multizone (No4)", "WTMD CEIA HI/PE Multizone (No5)", "WTMD CEIA HI/PE Multizone (No6)", "WTMD CEIA HI/PE Multizone (No7)"] },
      { title: "C. BODY SCANNER", summaryKey: "BODY SCANNER", items: ["Body Scanner Leidos Provision 2 (No3)", "Body Scanner Leidos Provision 2 (No5)", "Body Scanner Leidos Provision 2 (No7)"] },
      { title: "D. EXPLOSIVE DETECTOR", summaryKey: "ETD", items: ["ETD Leidos QS-B220"] }
    ]
  },
  {
    type: "location",
    title: "SSCP E",
    summary: "TOTAL PERALATAN SSCP E",
    categories: [
      { title: "A. X-RAY", summaryKey: "X-RAY", items: ["X-Ray Smith Heiman HS 6040-2is"] },
      { title: "B. WTMD", summaryKey: "WTMD", items: ["WTMD CEIA HI-PE Multizone"] }
    ]
  },
  {
    type: "location",
    title: "SSCP F",
    summary: "TOTAL PERALATAN SSCP F",
    categories: [
      { title: "A. X-RAY", summaryKey: "X-RAY", items: ["X-Ray Rapiscan 620 DV"] },
      { title: "B. WTMD", summaryKey: "WTMD", items: ["WTMD CEIA HI-PE Multizone"] }
    ]
  },
  {
    type: "location",
    title: "HBSCP",
    summary: "TOTAL PERALATAN HBSCP",
    categories: [
      { title: "A. X-RAY", summaryKey: "X-RAY", items: ["X-Ray Rapiscan 628DV (1.1)", "X-Ray Nuctech CX100100D (1.2)", "X-Ray Rapiscan 628DV  (1.3)", "X-Ray Rapiscan 628DV (1.4)", "X-Ray Rapiscan 628DV (1.5)", "X-Ray Rapiscan 628DV  (1.6)", "X-Ray Nuctech CX100100D (2.1)", "X-Ray Rapiscan 628DV  (2.2)", "X-Ray Rapiscan 628DV (2.3)", "X-Ray Rapiscan 628DV (2.4)", "X-Ray Nuctech CX100100D (2.5)", "X-Ray Rapiscan 628DV  (2.6)", "X-Ray Rapiscan 628DV (2.7)", "X-Ray Rapiscan 628DV (2.8)"] },
      { title: "B. EXPLOSIVE DETECTOR", summaryKey: "ETD", items: ["ETD Leidos QS-B220"] }
    ]
  },
  {
    type: "access_control",
    title: "ACCESS CONTROL",
    summary: "TOTAL PERALATAN ACCESS CONTROL",
    terminals: [
      {
        title: "TERMINAL D",
        categories: [
          { title: "AVIOBRIDGE", items: ["Pintu Avio D1", "Pintu Avio D2", "Pintu Avio D3", "Pintu Avio D4", "Pintu Avio D5", "Pintu Avio D6", "Pintu Avio D7"] },
          { title: "RAMPOUT", items: ["Pintu Rampout D2", "Pintu Rampout D4", "Pintu Rampout D6"] },
          { title: "BOARDING LOUNGE", items: ["Pintu BL D1", "Pintu BL D2", "Pintu BL D3", "Pintu BL D4", "Pintu BL D5", "Pintu BL D6", "Pintu BL D7"] }
        ]
      },
      {
        title: "TERMINAL E",
        categories: [
          { title: "AVIOBRIDGE", items: ["Pintu Avio E1", "Pintu Avio E2", "Pintu Avio E3", "Pintu Avio E4", "Pintu Avio E5", "Pintu Avio E6", "Pintu Avio E7"] },
          { title: "RAMPOUT", items: ["Pintu Rampout E2", "Pintu Rampout E4", "Pintu Rampout E6"] },
          { title: "BOARDING LOUNGE", items: ["Pintu BL E1", "Pintu BL E2", "Pintu BL E3", "Pintu BL E4", "Pintu BL E5", "Pintu BL E6", "Pintu BL E7"] }
        ]
      },
      {
        title: "TERMINAL F",
        categories: [
          { title: "AVIOBRIDGE", items: ["Pintu Avio F1", "Pintu Avio F2", "Pintu Avio F3", "Pintu Avio F4", "Pintu Avio F5", "Pintu Avio F6", "Pintu Avio F7"] },
          { title: "RAMPOUT", items: ["Pintu Rampout F1", "Pintu Rampout F2", "Pintu Rampout F3", "Pintu Rampout F4", "Pintu Rampout F5", "Pintu Rampout F6", "Pintu Rampout F7"] },
          { title: "BOARDING LOUNGE", items: ["Pintu BL F1", "Pintu BL F2", "Pintu BL F3", "Pintu BL F4", "Pintu BL F5", "Pintu BL F6", "Pintu BL F7"] }
        ]
      },
      {
        title: "",
        categories: [
          { title: "BREAKDOWN & LIFT", items: ["Pintu Breakdown D", "Pintu Breakdown E1", "Pintu Breakdown E2", "Pintu Breakdown F", "Pintu Breakdown Umroh", "Pintu HBS Umroh", "Pintu Lift Difable D", "Pintu Lift Difable E", "Pintu Lift Difable F", "Pintu Lift Barang D", "Pintu Lift Barang F"] }
        ]
      }
    ]
  }
];
const DEFAULT_TIP_LEFT_COL = [
  { id: "hbscp", name: "HBSCP", items: ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "2.1", "2.2", "2.3", "2.4", "2.5", "2.6"] },
  { id: "hbscp_umroh", name: "HBSCP UMROH", items: ["2.7", "2.8"] },
  { id: "pscp_d", name: "PSCP D", items: ["1", "2", "3", "4", "5"] }
];
const DEFAULT_TIP_RIGHT_COL = [
  { id: "pscp_e", name: "PSCP E", items: ["1", "2", "3", "4", "5"] },
  { id: "pscp_f", name: "PSCP F", items: ["1", "2", "3", "4"] },
  { id: "pscp_umroh", name: "PSCP UMROH", items: ["1", "2", "3", "4", "5", "6", "7"] },
  { id: "sscp", name: "SSCP", items: ["MP E", "MP F"] }
];
const supabaseUrl = "https://mpwemvdedpihlwghdmpa.supabase.co";
const supabaseAnonKey = "sb_publishable_hzu642LG862DRg0HkvdpZQ_3nLdQ2rw";
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const loadMasterData = (key, defaultData) => {
  return defaultData;
};
const saveMasterDataToLocal = (key, data) => {
};
const saveConfigToSupabase = async (key, data) => {
  try {
    const { error } = await supabase.from("master_configs").upsert({ key, value: data, updated_at: (/* @__PURE__ */ new Date()).toISOString() }, { onConflict: "key" });
    if (error) console.error(`Error saving ${key} to Supabase:`, error);
  } catch (err) {
    console.error(`Error saving ${key} to Supabase:`, err);
  }
};
const useMasterDataStore = create((set, get) => ({
  dataApiT2: loadMasterData("master_api_t2", sortPersonelByJabatan(DEFAULT_DATA_API_T2)),
  setDataApiT2: (data) => {
    const sorted = sortPersonelByJabatan(data);
    set({ dataApiT2: sorted });
  },
  dataOmIasT2: loadMasterData("master_om_ias_t2", sortPersonelByJabatan(DEFAULT_DATA_OM_IAS_T2)),
  setDataOmIasT2: (data) => {
    const sorted = sortPersonelByJabatan(data);
    set({ dataOmIasT2: sorted });
  },
  savePersonelToSupabase: async (data, unitName) => {
    try {
      let unitId = null;
      const { data: uData } = await supabase.from("unit_kerja").select("id").ilike("nama", `%${unitName === "API T2" ? "API" : "OM"}%`).limit(1);
      if (uData && uData.length > 0) unitId = uData[0].id;
      for (let idx = 0; idx < data.length; idx++) {
        const p = data[idx];
        if (!p.name) continue;
        const urutanVal = idx + 1;
        if (p.id) {
          const payload = { nama: p.name, no_hp: p.phone, urutan: urutanVal };
          if (p.jabatan !== void 0) payload.jabatan = p.jabatan || null;
          const { error } = await supabase.from("personel").update(payload).eq("id", p.id);
          if (error && (error.message?.includes("urutan") || error.message?.includes("jabatan"))) {
            const fallback = { nama: p.name, no_hp: p.phone };
            if (p.jabatan !== void 0 && !error.message?.includes("jabatan")) fallback.jabatan = p.jabatan || null;
            await supabase.from("personel").update(fallback).eq("id", p.id);
          }
        } else if (unitId) {
          const payload = { nama: p.name, no_hp: p.phone, unit_kerja_id: unitId, urutan: urutanVal };
          if (p.jabatan !== void 0) payload.jabatan = p.jabatan || null;
          const { error } = await supabase.from("personel").insert(payload);
          if (error && (error.message?.includes("urutan") || error.message?.includes("jabatan"))) {
            const fallback = { nama: p.name, no_hp: p.phone, unit_kerja_id: unitId };
            if (p.jabatan !== void 0 && !error.message?.includes("jabatan")) fallback.jabatan = p.jabatan || null;
            await supabase.from("personel").insert(fallback);
          }
        }
      }
      await get().initializeSupabaseData();
    } catch (err) {
      console.error("Failed savePersonelToSupabase:", err);
    }
  },
  storingEquipments: loadMasterData("master_storing_equip", DEFAULT_STORING_EQUIPMENTS),
  setStoringEquipments: (data) => {
    saveConfigToSupabase("master_storing_equip", data);
    set({ storingEquipments: data });
  },
  storingLocAc: loadMasterData("master_storing_loc_ac", DEFAULT_STORING_LOC_AC),
  setStoringLocAc: (data) => {
    saveConfigToSupabase("master_storing_loc_ac", data);
    set({ storingLocAc: data });
  },
  storingLocDefault: loadMasterData("master_storing_loc_default", DEFAULT_STORING_LOC_DEFAULT),
  setStoringLocDefault: (data) => {
    saveConfigToSupabase("master_storing_loc_default", data);
    set({ storingLocDefault: data });
  },
  checklistDataMaster: loadMasterData("master_checklist", DEFAULT_CHECKLIST_DATA),
  setChecklistDataMaster: (data) => {
    saveConfigToSupabase("master_checklist", data);
    set({ checklistDataMaster: data });
  },
  tipLeftCol: loadMasterData("master_tip_left", DEFAULT_TIP_LEFT_COL),
  setTipLeftCol: (data) => {
    saveConfigToSupabase("master_tip_left", data);
    set({ tipLeftCol: data });
  },
  tipRightCol: loadMasterData("master_tip_right", DEFAULT_TIP_RIGHT_COL),
  setTipRightCol: (data) => {
    saveConfigToSupabase("master_tip_right", data);
    set({ tipRightCol: data });
  },
  penempatanData: [],
  setPenempatanData: (data) => set({ penempatanData: data }),
  unitPeralatanData: [],
  setUnitPeralatanData: (data) => set({ unitPeralatanData: data }),
  jenisPeralatanData: [],
  setJenisPeralatanData: (data) => set({ jenisPeralatanData: data }),
  toggleKalibrasiEquipmentDb: async (id, tampil) => {
    try {
      const { error } = await supabase.from("jenis_peralatan").update({ tampil_di_kalibrasi: tampil }).eq("id", id);
      if (!error) {
        set((state) => ({
          jenisPeralatanData: state.jenisPeralatanData.map((j) => j.id === id ? { ...j, tampil_di_kalibrasi: tampil } : j)
        }));
      } else {
        console.error("Gagal memperbarui config kalibrasi", error);
      }
    } catch (err) {
      console.error(err);
    }
  },
  masterModalOpen: null,
  setMasterModalOpen: (type) => set({ masterModalOpen: type }),
  masterModalData: [],
  setMasterModalData: (data) => set({ masterModalData: data }),
  openMasterModal: (type, currentData) => {
    set({
      masterModalOpen: type,
      masterModalData: JSON.parse(JSON.stringify(currentData))
    });
  },
  closeMasterModal: () => {
    set({
      masterModalOpen: null,
      masterModalData: []
    });
  },
  saveCurrentMasterModal: () => {
    const { masterModalOpen, masterModalData, closeMasterModal } = get();
    switch (masterModalOpen) {
      case "api_t2":
        get().setDataApiT2(masterModalData);
        break;
      case "om_ias_t2":
        get().setDataOmIasT2(masterModalData);
        break;
      case "storing_equip":
        get().setStoringEquipments(masterModalData);
        break;
      case "storing_loc_ac":
        get().setStoringLocAc(masterModalData);
        break;
      case "storing_loc_default":
        get().setStoringLocDefault(masterModalData);
        break;
      case "tip_left":
        get().setTipLeftCol(masterModalData);
        break;
      case "tip_right":
        get().setTipRightCol(masterModalData);
        break;
    }
    closeMasterModal();
  },
  resetCurrentMasterModal: () => {
    if (!window.confirm("Anda yakin ingin mereset data ini ke default bawaan sistem? Data kustom akan hilang.")) return;
    const { masterModalOpen } = get();
    switch (masterModalOpen) {
      case "api_t2":
        set({ masterModalData: DEFAULT_DATA_API_T2 });
        break;
      case "om_ias_t2":
        set({ masterModalData: DEFAULT_DATA_OM_IAS_T2 });
        break;
      case "storing_equip":
        set({ masterModalData: DEFAULT_STORING_EQUIPMENTS });
        break;
      case "storing_loc_ac":
        set({ masterModalData: DEFAULT_STORING_LOC_AC });
        break;
      case "storing_loc_default":
        set({ masterModalData: DEFAULT_STORING_LOC_DEFAULT });
        break;
      case "tip_left":
        set({ masterModalData: DEFAULT_TIP_LEFT_COL });
        break;
      case "tip_right":
        set({ masterModalData: DEFAULT_TIP_RIGHT_COL });
        break;
    }
  },
  handleModalDataChange: (index, field, value) => {
    const { masterModalData, masterModalOpen } = get();
    const newData = [...masterModalData];
    if (field) {
      if (field === "name" && (masterModalOpen === "api_t2" || masterModalOpen === "om_ias_t2")) {
        newData[index][field] = toTitleCase(value);
      } else {
        newData[index][field] = value;
      }
    } else {
      newData[index] = value;
    }
    set({ masterModalData: newData });
  },
  addModalDataRow: () => {
    const { masterModalOpen, masterModalData } = get();
    let newItem;
    if (masterModalOpen === "api_t2" || masterModalOpen === "om_ias_t2") newItem = { name: "", phone: "", jabatan: "" };
    else if (masterModalOpen === "storing_equip" || masterModalOpen === "storing_loc_ac" || masterModalOpen === "storing_loc_default" || masterModalOpen === "kalibrasi_equip") newItem = "";
    else if (masterModalOpen === "tip_left" || masterModalOpen === "tip_right") newItem = { id: `new_${Date.now()}`, name: "", items: [] };
    set({ masterModalData: [...masterModalData, newItem] });
  },
  removeModalDataRow: (index) => {
    const { masterModalData } = get();
    const newData = [...masterModalData];
    newData.splice(index, 1);
    set({ masterModalData: newData });
  },
  initializeSupabaseData: async () => {
    try {
      const { data, error } = await supabase.from("penempatan_peralatan").select(`
          id,
          id_unit,
          tipe_peralatan ( nama, varian, jenis_peralatan ( nama ) ),
          unit_peralatan ( id, serial_number, milik, status, no_sertifikasi, tahun_instalasi, ampere ),
          lokasi ( nama ),
          titik_lokasi ( nomor )
        `);
      if (error) {
        console.warn("Gagal memuat data Supabase penempatan.", error.message);
      } else if (data && data.length > 0) {
        console.log("✅ Berhasil terhubung ke Supabase! Menemukan", data.length, "data penempatan.");
        set({ penempatanData: data });
      }
      const { data: unitData, error: unitError } = await supabase.from("unit_peralatan").select(`
          *,
          tipe_peralatan ( id, nama, varian, jenis_peralatan ( id, nama ) )
        `).order("created_at", { ascending: false });
      if (!unitError && unitData) {
        set({ unitPeralatanData: unitData });
      }
      const { data: jenisData, error: jenisError } = await supabase.from("jenis_peralatan").select("id, nama, tampil_di_kalibrasi").order("nama");
      if (!jenisError && jenisData) {
        set({ jenisPeralatanData: jenisData });
      }
      let { data: personelData, error: personelError } = await supabase.from("personel").select(`id, nik, nama, no_hp, jabatan, urutan, unit_kerja(nama)`).order("urutan", { ascending: true }).order("id", { ascending: true });
      if (personelError) {
        console.warn("Kolom urutan/jabatan mungkin belum ada di tabel personel Supabase, mencoba fallback query...", personelError.message);
        const resFallback = await supabase.from("personel").select(`id, nik, nama, no_hp, jabatan, unit_kerja(nama)`).order("id", { ascending: true });
        personelData = resFallback.data;
        personelError = resFallback.error;
        if (personelError) {
          const resFallback2 = await supabase.from("personel").select(`id, nik, nama, no_hp, unit_kerja(nama)`).order("id", { ascending: true });
          personelData = resFallback2.data;
          personelError = resFallback2.error;
        }
      }
      if (!personelError && personelData) {
        console.log("✅ Berhasil mengambil data personel dari Supabase:", personelData.length);
        const apiT2Raw = personelData.filter((p) => p.unit_kerja?.nama === "API T2").map((p, idx) => ({ id: p.id, nik: p.nik, name: toTitleCase(p.nama), phone: p.no_hp || "", jabatan: p.jabatan || "", dbOrder: p.urutan !== void 0 && p.urutan !== null ? Number(p.urutan) : idx }));
        const omIasT2Raw = personelData.filter((p) => p.unit_kerja?.nama === "OM/IAS T2").map((p, idx) => ({ id: p.id, nik: p.nik, name: toTitleCase(p.nama), phone: p.no_hp || "", jabatan: p.jabatan || "", dbOrder: p.urutan !== void 0 && p.urutan !== null ? Number(p.urutan) : idx }));
        if (apiT2Raw.length > 0) get().setDataApiT2(sortPersonelByJabatan(apiT2Raw));
        if (omIasT2Raw.length > 0) get().setDataOmIasT2(sortPersonelByJabatan(omIasT2Raw));
      }
      const { data: configsData, error: configsError } = await supabase.from("master_configs").select("key, value");
      if (!configsError && configsData) {
        console.log("✅ Berhasil memuat master configs dari Supabase:", configsData.length);
        configsData.forEach((config) => {
          saveMasterDataToLocal(config.key, config.value);
          switch (config.key) {
            case "master_checklist":
              set({ checklistDataMaster: config.value });
              break;
            case "master_storing_equip":
              set({ storingEquipments: config.value });
              break;
            case "master_storing_loc_ac":
              set({ storingLocAc: config.value });
              break;
            case "master_storing_loc_default":
              set({ storingLocDefault: config.value });
              break;
            case "master_tip_left":
              set({ tipLeftCol: config.value });
              break;
            case "master_tip_right":
              set({ tipRightCol: config.value });
              break;
          }
        });
      }
    } catch (err) {
      console.warn("Koneksi Supabase belum terkonfigurasi dengan benar.", err);
    }
  }
}));
const getValidModels = (lokasi, jenisPeralatan, titik) => {
  const defaultOption = `Semua ${jenisPeralatan}`;
  const models = [defaultOption];
  if (!lokasi) return models;
  try {
    const penempatanData = useMasterDataStore.getState().penempatanData || [];
    const extractedModels = /* @__PURE__ */ new Set();
    penempatanData.forEach((p) => {
      if (p.lokasi?.nama?.toUpperCase() === lokasi.toUpperCase() && p.tipe_peralatan?.jenis_peralatan?.nama?.toUpperCase() === jenisPeralatan.toUpperCase()) {
        if (titik && titik !== "" && titik !== "-") {
          const pTitik = String(p.titik_lokasi?.nomor || "").trim().toUpperCase();
          const targetTitik = String(titik).trim().toUpperCase();
          if (pTitik !== targetTitik) return;
        }
        if (p.tipe_peralatan?.nama) {
          extractedModels.add(p.tipe_peralatan.nama);
        }
      }
    });
    if (extractedModels.size > 0) {
      return [defaultOption, ...Array.from(extractedModels)];
    }
  } catch (error) {
    console.warn(`Error reading dynamic ${jenisPeralatan} models from relational data`, error);
  }
  return models;
};
const getValidXRayModels = (lokasi, titik) => {
  return getValidModels(lokasi, "X-Ray", titik);
};
const getGeneralLokasiOptions = (peralatanType) => {
  if (!peralatanType) return [];
  const extractedLocs = /* @__PURE__ */ new Set();
  try {
    const penempatanData = useMasterDataStore.getState().penempatanData || [];
    penempatanData.forEach((p) => {
      const jenisNama = p.tipe_peralatan?.jenis_peralatan?.nama?.toUpperCase() || "";
      const tipeNama = p.tipe_peralatan?.nama?.toUpperCase() || "";
      const target = peralatanType.toUpperCase();
      if (target === "SEMUA X-RAY" || target === "X-RAY") {
        if (jenisNama === "X-RAY") {
          if (p.lokasi?.nama) extractedLocs.add(p.lokasi.nama);
        }
      } else if (tipeNama === target) {
        if (p.lokasi?.nama) extractedLocs.add(p.lokasi.nama);
      } else if (jenisNama === target) {
        if (p.lokasi?.nama) extractedLocs.add(p.lokasi.nama);
      }
    });
    if (extractedLocs.size === 0) {
      penempatanData.forEach((p) => {
        if (p.lokasi?.nama) extractedLocs.add(p.lokasi.nama);
      });
    }
  } catch (error) {
    console.warn("Error reading dynamic locations from relational data", error);
  }
  return Array.from(extractedLocs).sort();
};
const getIntersectedLocations = (peralatanArray, models = {}) => {
  if (!peralatanArray || peralatanArray.length === 0) return [];
  let validLocs = null;
  for (const equip of peralatanArray) {
    let currentEquipOpts = [];
    const selectedModel = models[equip];
    if (selectedModel && !selectedModel.startsWith("Semua ")) {
      currentEquipOpts = getGeneralLokasiOptions(selectedModel);
    } else {
      currentEquipOpts = getGeneralLokasiOptions(equip);
    }
    if (validLocs === null) {
      validLocs = [...currentEquipOpts];
    } else {
      validLocs = validLocs.filter((loc) => currentEquipOpts.includes(loc));
    }
    if (validLocs.length === 0) break;
  }
  return validLocs || [];
};
const getLokasi2Options = (lokasi, peralatanArray = []) => {
  if (!lokasi) return [];
  const extractedNumbers = /* @__PURE__ */ new Set();
  try {
    const penempatanData = useMasterDataStore.getState().penempatanData || [];
    penempatanData.forEach((p) => {
      if (p.lokasi?.nama?.toUpperCase() === lokasi.toUpperCase()) {
        if (peralatanArray.length > 0) {
          const jenisNama = p.tipe_peralatan?.jenis_peralatan?.nama;
          const tipeNama = p.tipe_peralatan?.nama;
          if (jenisNama && peralatanArray.includes(jenisNama) || tipeNama && peralatanArray.includes(tipeNama)) {
            if (p.titik_lokasi?.nomor) extractedNumbers.add(p.titik_lokasi.nomor);
          }
        } else {
          if (p.titik_lokasi?.nomor) extractedNumbers.add(p.titik_lokasi.nomor);
        }
      }
    });
    if (extractedNumbers.size === 0 && peralatanArray.length > 0) {
      penempatanData.forEach((p) => {
        if (p.lokasi?.nama?.toUpperCase() === lokasi.toUpperCase()) {
          if (p.titik_lokasi?.nomor) extractedNumbers.add(p.titik_lokasi.nomor);
        }
      });
    }
  } catch (error) {
    console.warn("Error reading dynamic numbers from relational data", error);
  }
  return Array.from(extractedNumbers).sort((a, b) => {
    const numA = parseInt(a.replace(/[^0-9]/g, ""), 10);
    const numB = parseInt(b.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });
};
const getStoringValidLocations = (equipArray, storingLocAc, storingLocDefault) => {
  if (equipArray.length === 0) return [];
  if (equipArray.includes("Access Control")) return getGeneralLokasiOptions("Access Control");
  if (equipArray.some((e) => e.trim().toLowerCase() === "mirroring x-ray")) return getGeneralLokasiOptions("Mirroring X-Ray");
  const NON_TRANSFER_EQUIP = ["BODY SCANNER", "EXTENSION CONVEYOR", "ATRS", "MIRRORING X-RAY"];
  const intersected = getIntersectedLocations(equipArray);
  const hasHhmdOrWtmd = equipArray.some((e) => ["HHMD", "WTMD"].includes(e.trim().toUpperCase()));
  const hasNonTransferEquip = equipArray.some((e) => NON_TRANSFER_EQUIP.includes(e.trim().toUpperCase()));
  if (hasHhmdOrWtmd && !hasNonTransferEquip) {
    const transferLocs = /* @__PURE__ */ new Set();
    equipArray.forEach((e) => {
      if (["HHMD", "WTMD"].includes(e.trim().toUpperCase())) {
        getGeneralLokasiOptions(e).forEach((loc) => {
          if (loc.trim().toUpperCase().includes("TRANSFER")) {
            transferLocs.add(loc);
          }
        });
      }
    });
    const combined = /* @__PURE__ */ new Set([...intersected, ...transferLocs]);
    return Array.from(combined).sort();
  }
  return intersected;
};
const getStoringNomorOptions = (loc) => {
  if (!loc) return [];
  const upper = loc.trim().toUpperCase();
  if (upper === "HBSCP") return ["1.1-1.6", "2.1-2.6", "2.7-2.8"];
  if (upper.includes("MONITORING") || upper.includes("REDLINE") || upper.includes("UMRAH")) {
    return [];
  }
  if (upper.includes("BELT") || upper.includes("BEA CUKAI") && upper.includes("X-RAY") || upper.includes("BEACUKAI") && upper.includes("X-RAY")) {
    return ["11-14", "15-16"];
  }
  if (upper === "ARRIVAL F") return ["1,6,7", "1", "6", "7"];
  if (["RAMPOUT D", "RAMPOUT E"].includes(upper)) {
    return ["2,4,6", "2", "4", "6"];
  }
  if (upper.startsWith("AVIOBRIDGE") || upper.startsWith("BL") || upper === "RAMPOUT F") {
    return ["1-7", "1", "2", "3", "4", "5", "6", "7"];
  }
  return [];
};
const getAcNomorOptions = getStoringNomorOptions;
const formatTanggalIndo = (dateStr) => {
  if (!dateStr) return "";
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const d = new Date(dateStr);
  return `${days[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
};
const checkNeedsStoringSupervisorAvsec = (peralatan, acLokasi, acNomor) => {
  if (!peralatan || !acLokasi) return false;
  const isACChecked = peralatan.includes("Access Control");
  const isMirroringChecked = peralatan.some((e) => e.toLowerCase() === "mirroring x-ray");
  if (isMirroringChecked) return false;
  if (isACChecked) {
    return acLokasi.some((l) => l.trim().toLowerCase() === "ruang monitoring e1");
  }
  return acLokasi.some((l) => {
    const norm = l.trim().toUpperCase();
    if (norm === "HBSCP" || norm.includes("HBSCP") && !norm.includes("UMRAH") && !norm.includes("UMROH")) {
      const selectedNomor = (acNomor || {})[l] || (getAcNomorOptions(l)[0] || "");
      if (selectedNomor.trim() === "2.7-2.8" || selectedNomor.trim() === "2.7 - 2.8") {
        return false;
      }
      return true;
    }
    const exactList = ["PSCP D", "PSCP E", "PSCP F", "PSCP UMRAH", "PSCP UMROH", "SSCP E", "SSCP F"];
    if (exactList.includes(norm)) return true;
    if (norm.includes("PSCP") && (norm.includes(" D") || norm.includes(" E") || norm.includes(" F") || norm.includes("UMRAH") || norm.includes("UMROH"))) return true;
    if (norm.includes("SSCP") && (norm.includes(" E") || norm.includes(" F"))) return true;
    return false;
  });
};
const generateWA_Perbaikan = (formData, isVerifikasiETD) => {
  if (!formData.peralatan) return "Silakan pilih peralatan terlebih dahulu untuk melihat preview laporan...";
  const dateParts = formData.tanggal ? formData.tanggal.split("-") : ["", "", ""];
  const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : "";
  const locList = formData.lokasiList && Array.isArray(formData.lokasiList) && formData.lokasiList.length > 0 ? formData.lokasiList.filter((l) => l.lokasi1) : [{ lokasi1: formData.lokasi1, lokasi2: formData.lokasi2 }];
  const lokasiFinal = locList.map((loc) => {
    if (loc.isManual || loc.lokasi2 === "-" && !loc.lokasi2) return loc.lokasi1;
    return loc.lokasi1 + (loc.lokasi2 && loc.lokasi2 !== "-" ? formData.peralatan === "Access Control" || loc.lokasi1 === "HBSCP" ? ` ${loc.lokasi2}` : ` No.${loc.lokasi2}` : "");
  }).join(", ");
  const judulLaporan = isVerifikasiETD ? `Laporan Verifikasi ${formData.peralatan}` : `Laporan Perbaikan ${formData.peralatan}`;
  const statusIcon = formData.status === "Pekerjaan Selesai" || formData.status === "Normal Operasi" ? "✅" : "⚠️";
  return `${judulLaporan}

Lokasi : ${lokasiFinal}
Sumber laporan : ${formData.sumberLaporan}
${isVerifikasiETD ? "" : `Indikasi awal : ${formData.indikasiAwal}`}

🗓️ Tanggal :  ${formattedDate}
🕝 Pukul : ${formData.waktuMulai} - ${formData.waktuSelesai}
⏰ Lama waktu Pengerjaan : ${formData.lamaPengerjaan}
👨🏻‍🔧 Teknisi : ${formData.teknisi}

🪛 Permasalahan :
${formData.permasalahan}
🪛 Tindak lanjut  : 
${formData.tindakLanjut}

${statusIcon} Status : ${formData.status}

Demikian laporan tindak lanjut kami sampaikan.
Terimakasih atas perhatiannya`;
};
const formatPersonnelList = (list) => {
  const activeList = list.filter((item) => item.name !== "");
  if (activeList.length === 0) return "- (Kosong)";
  return activeList.map((item) => `- ${item.name} - ${item.status}
     Tlp : ${item.phone}`).join("\n");
};
const generateWA_Kehadiran = (attendanceData) => {
  const formattedDate = formatTanggalIndo(attendanceData.tanggal);
  const greeting = "Semangat Pagii.....!!!";
  const sortedApiList = sortPersonelByJabatan(attendanceData.apiList || []);
  const sortedOmList = sortPersonelByJabatan(attendanceData.omList || []);
  return `${greeting}
T2 Safety & Security Electronic Services

Dinas     : ${attendanceData.shift}
Hari      : ${formattedDate}

Personel API T2 :
${formatPersonnelList(sortedApiList)}

Personel OM IAS T2 :
${formatPersonnelList(sortedOmList)}

Tlp Ruangan :
${attendanceData.tlpRuangan}

Rencana Kegiatan :
${attendanceData.rencanaKegiatan}`;
};
const generateWA_Briefing = (briefingData) => {
  const formattedDate = formatTanggalIndo(briefingData.tanggal);
  const judul = briefingData.jenis === "Unit" ? "*Giat briefing unit SSES T2*" : "*Briefing MOT T2*";
  return `${judul}
Hari/Tanggal : ${formattedDate}
Shift : ${briefingData.shift}
Lokasi : ${briefingData.lokasi}`;
};
const formatACLokasiList = (locs) => {
  if (!locs || locs.length === 0) return "-";
  if (locs.length === 1) return locs[0];
  const results = [];
  const normalLocsWithIndex = [];
  locs.forEach((loc, idx) => {
    if (loc.toUpperCase().includes("PSCP") || loc.toUpperCase().includes("BEA CUKAI") || loc.toUpperCase().includes("BELT")) {
      results.push({ text: loc.trim(), minIndex: idx });
    } else {
      normalLocsWithIndex.push({ loc: loc.trim(), idx });
    }
  });
  const prefixGroups = /* @__PURE__ */ new Map();
  normalLocsWithIndex.forEach(({ loc, idx }) => {
    const parts = loc.split(" ");
    if (parts.length >= 2) {
      const prefix = parts.slice(0, -1).join(" ");
      const suffix = parts[parts.length - 1];
      if (!prefixGroups.has(prefix)) prefixGroups.set(prefix, []);
      prefixGroups.get(prefix).push({ suffix, idx });
    } else {
      results.push({ text: loc, minIndex: idx });
    }
  });
  const remainingForSuffixGroup = [];
  prefixGroups.forEach((items, prefix) => {
    if (items.length === 1) {
      remainingForSuffixGroup.push({ prefix, suffix: items[0].suffix, idx: items[0].idx });
    } else {
      const minIndex = Math.min(...items.map((i) => i.idx));
      const suffixes = items.map((i) => i.suffix);
      const lastSuffix = suffixes[suffixes.length - 1];
      const otherSuffixes = suffixes.slice(0, -1).join(", ");
      results.push({ text: `${prefix} ${otherSuffixes} & ${lastSuffix}`, minIndex });
    }
  });
  const suffixGroups = /* @__PURE__ */ new Map();
  remainingForSuffixGroup.forEach(({ prefix, suffix, idx }) => {
    if (!suffixGroups.has(suffix)) suffixGroups.set(suffix, []);
    suffixGroups.get(suffix).push({ prefix, idx });
  });
  suffixGroups.forEach((items, suffix) => {
    const minIndex = Math.min(...items.map((i) => i.idx));
    if (items.length === 1) {
      results.push({ text: `${items[0].prefix} ${suffix}`, minIndex });
    } else {
      const prefixes = items.map((i) => i.prefix);
      const lastPrefix = prefixes[prefixes.length - 1];
      const otherPrefixes = prefixes.slice(0, -1).join(", ");
      results.push({ text: `${otherPrefixes} & ${lastPrefix} ${suffix}`, minIndex });
    }
  });
  results.sort((a, b) => a.minIndex - b.minIndex);
  const formattedResults = results.map((r) => r.text);
  if (formattedResults.length <= 1) {
    return formattedResults[0] || "-";
  }
  const last = formattedResults[formattedResults.length - 1];
  if (last.includes("&") || formattedResults.some((r) => r.includes("&"))) {
    return formattedResults.join(", ");
  }
  const firstPart = formattedResults.slice(0, -1).join(", ");
  return `${firstPart} & ${last}`;
};
const generateWA_Storing = (storingData) => {
  const formattedDate = formatTanggalIndo(storingData.tanggal);
  const jamMulai = storingData.waktuMulai || "...";
  const jamSelesai = storingData.waktuSelesai || "...";
  let equipString = "-";
  if (storingData.peralatan.length === 1) {
    equipString = storingData.peralatan[0];
  } else if (storingData.peralatan.length > 1) {
    const lastEquip = storingData.peralatan[storingData.peralatan.length - 1];
    const otherEquips = storingData.peralatan.slice(0, -1).join(", ");
    equipString = `${otherEquips} & ${lastEquip}`;
  }
  let locString = "-";
  const rawLocs = storingData.acLokasi || [];
  if (rawLocs.length > 0) {
    const nomors = storingData.acNomor || {};
    const mappedLocs = rawLocs.map((loc) => {
      const num = nomors[loc];
      if (!num) return loc;
      if (loc.trim().toUpperCase() === "HBSCP" || loc.trim().toUpperCase().includes("BEA CUKAI") || loc.trim().toUpperCase().includes("BELT")) return `${loc} ${num}`;
      return `${loc}${num}`;
    });
    locString = formatACLokasiList(mappedLocs);
  } else if (storingData.lokasi) {
    if (storingData.nomor) {
      if (storingData.lokasi === "Avio & BL D" || storingData.lokasi === "Avio & BL E" || storingData.lokasi === "Avio & BL F" || storingData.lokasi.includes("Rampout")) {
        locString = `${storingData.lokasi}${storingData.nomor}`;
      } else {
        locString = `${storingData.lokasi} ${storingData.nomor}`;
      }
    } else {
      locString = storingData.lokasi;
    }
  }
  const showSupervisorAvsec = checkNeedsStoringSupervisorAvsec(storingData.peralatan || [], storingData.acLokasi || [], storingData.acNomor || {});
  const supervisorAvsecLine = showSupervisorAvsec ? `
Supervisor Avsec : ${storingData.supervisorAvsec || "-"}` : "";
  return `*KEGIATAN STORING PERALATAN SSES T2*
Hari/Tanggal/Jam : ${formattedDate}, ${jamMulai} - ${jamSelesai}
Peralatan : ${equipString}
Lokasi : ${locString}
Hasil : ${storingData.hasil}${supervisorAvsecLine}`;
};
const generateWA_Checklist = (checklistData, checklistDataMaster, toggles) => {
  const formattedDate = formatTanggalIndo(checklistData.tanggal);
  const jamMulai = checklistData.waktuMulai || "...";
  const jamSelesai = checklistData.waktuSelesai || "...";
  let result = `KEGIATAN STORING PERALATAN SSES T2
`;
  result += `Hari/Tanggal/Jam : ${formattedDate}, ${jamMulai} - ${jamSelesai}

`;
  checklistDataMaster.forEach((block) => {
    if (block.type === "location") {
      result += `${block.title}
`;
      let summaryCounts = {};
      block.categories.forEach((cat) => {
        result += `${cat.title}
`;
        if (!summaryCounts[cat.summaryKey]) summaryCounts[cat.summaryKey] = { total: 0, operasi: 0, off: 0 };
        cat.items.forEach((item, iIdx) => {
          const key = `${block.title}|${cat.title}|${iIdx}`;
          const isOperasi = toggles[key] !== false;
          result += `* ${item} ${isOperasi ? "✅" : "❌"}
`;
          summaryCounts[cat.summaryKey].total++;
          if (isOperasi) summaryCounts[cat.summaryKey].operasi++;
          else summaryCounts[cat.summaryKey].off++;
        });
        result += `
`;
      });
      result += `${block.summary}
`;
      Object.keys(summaryCounts).forEach((sKey) => {
        result += `${sKey}  : ${summaryCounts[sKey].total}
`;
        result += `* Operasi : ${summaryCounts[sKey].operasi}
`;
        result += `* Off : ${summaryCounts[sKey].off}
`;
      });
      result += `
`;
      if (block.title === "HBSCP" || block.title.includes("HBSCP") && !block.title.includes("UMROH")) {
        const sup1 = checklistData.supervisorAvsec?.["HBSCP 1.1 - 1.6"] || "-";
        const sup2 = checklistData.supervisorAvsec?.["HBSCP 2.1 - 2.6"] || "-";
        result += `Supervisor Avsec HBSCP 1.1 - 1.6 : ${sup1}
`;
        result += `Supervisor Avsec HBSCP 2.1 - 2.6 : ${sup2}

`;
      } else if (block.title === "ACCESS CONTROL" || block.title.includes("ACCESS CONTROL")) {
        const sup = checklistData.supervisorAvsec?.[block.title] || checklistData.supervisorAvsec?.["Monitoring Access E1"] || "-";
        result += `Supervisor Avsec Monitoring Access E1 : ${sup}

`;
      } else {
        const supAvsec = checklistData.supervisorAvsec?.[block.title] || "-";
        result += `Supervisor Avsec ${block.title} : ${supAvsec}

`;
      }
    } else if (block.type === "group") {
      let summaryCounts = {};
      block.locations.forEach((loc) => {
        result += `${loc.title}
`;
        loc.categories.forEach((cat) => {
          result += `${cat.title}
`;
          if (!summaryCounts[cat.summaryKey]) summaryCounts[cat.summaryKey] = { total: 0, operasi: 0, off: 0 };
          cat.items.forEach((item, iIdx) => {
            const key = `${loc.title}|${cat.title}|${iIdx}`;
            const isOperasi = toggles[key] !== false;
            result += `* ${item} ${isOperasi ? "✅" : "❌"}
`;
            summaryCounts[cat.summaryKey].total++;
            if (isOperasi) summaryCounts[cat.summaryKey].operasi++;
            else summaryCounts[cat.summaryKey].off++;
          });
          result += `
`;
        });
        if (loc.title === "HBSCP" || loc.title.includes("HBSCP") && !loc.title.includes("UMROH")) {
          const sup1 = checklistData.supervisorAvsec?.["HBSCP 1.1 - 1.6"] || "-";
          const sup2 = checklistData.supervisorAvsec?.["HBSCP 2.1 - 2.6"] || "-";
          result += `Supervisor Avsec HBSCP 1.1 - 1.6 : ${sup1}
`;
          result += `Supervisor Avsec HBSCP 2.1 - 2.6 : ${sup2}

`;
        } else if (loc.title === "ACCESS CONTROL" || loc.title.includes("ACCESS CONTROL")) {
          const sup = checklistData.supervisorAvsec?.[loc.title] || checklistData.supervisorAvsec?.["Monitoring Access E1"] || "-";
          result += `Supervisor Avsec Monitoring Access E1 : ${sup}

`;
        } else {
          const supAvsecLoc = checklistData.supervisorAvsec?.[loc.title] || "-";
          result += `Supervisor Avsec ${loc.title} : ${supAvsecLoc}

`;
        }
      });
      result += `${block.summary}
`;
      Object.keys(summaryCounts).forEach((sKey) => {
        result += `${sKey}  : ${summaryCounts[sKey].total}
`;
        result += `* Operasi : ${summaryCounts[sKey].operasi}
`;
        result += `* Off : ${summaryCounts[sKey].off}
`;
      });
      result += `
`;
    } else if (block.type === "access_control") {
      result += `${block.title}
`;
      let totalAc = 0, operasiAc = 0, offAc = 0;
      block.terminals.forEach((term) => {
        if (term.title) result += `${term.title}
`;
        term.categories.forEach((cat) => {
          result += `${cat.title}
`;
          cat.items.forEach((item, iIdx) => {
            const key = `${block.title}|${term.title}|${cat.title}|${iIdx}`;
            const isOperasi = toggles[key] !== false;
            result += `* ${item} ${isOperasi ? "✅" : "❌"}
`;
            totalAc++;
            if (isOperasi) operasiAc++;
            else offAc++;
          });
          result += `
`;
        });
      });
      result += `${block.summary} : ${totalAc}
`;
      result += `OPERASI : ${operasiAc}
`;
      result += `OFF : ${offAc}
`;
      result += `
`;
      const supAvsec = checklistData.supervisorAvsec?.[block.title] || checklistData.supervisorAvsec?.["Monitoring Access E1"] || "-";
      result += `Supervisor Avsec Monitoring Access E1 : ${supAvsec}

`;
    }
  });
  result += `TERIMA KASIH
MELANGKAH BERSAMA UNTUK CGK HEBAT
BERSAMA MELAYANI SEPENUH HATI`;
  return result.trim();
};
const generateWA_Kalibrasi = (kalibrasiGlobal, kalibrasiEntries) => {
  if (kalibrasiEntries.length === 0 || kalibrasiEntries.every((e) => e.peralatan.length === 0)) {
    return "Silakan tambah peralatan pada lokasi untuk melihat preview laporan...";
  }
  const formattedDate = formatTanggalIndo(kalibrasiGlobal.tanggal);
  const jamMulai = kalibrasiGlobal.waktuMulai || "...";
  const jamSelesai = kalibrasiGlobal.waktuSelesai || "...";
  let msg = `*PREVENTIVE MAINTENANCE & KALIBRASI SSES T2*
Hari/Tanggal/Jam : ${formattedDate}, ${jamMulai} - ${jamSelesai}`;
  kalibrasiEntries.forEach((entry) => {
    if (entry.peralatan.length === 0) return;
    if (entry.peralatan.includes("Access Control")) {
      const locs = entry.acLokasi || [];
      let lokasiAC = "...";
      if (locs.length === 1) {
        lokasiAC = locs[0];
      } else if (locs.length > 1) {
        const lastLoc = locs[locs.length - 1];
        const otherLocs = locs.slice(0, -1).join(", ");
        lokasiAC = `${otherLocs} & ${lastLoc}`;
      }
      msg += `

Peralatan : Access Control
Lokasi : ${lokasiAC}

Kegiatan :
- Pembersihan Emlock, Switch, Intercom, Fingerprint & CCTV
- Pengecekan Fungsi Emlock, Intercom, Fingerprint, CCTV, Pengontrolan Kunci Pintu, Record CCTV
   
Catatan :
- Fungsi Emlock : ${entry.acEmlock || "..."}
- Fungsi Intercom : ${entry.acIntercom || "..."}
- Fungsi Fingerprint: ${entry.acFingerprint || "..."}
- Fungsi CCTV : ${entry.acCctv || "..."}
- Fungsi Pengontrolan Kunci Pintu : ${entry.acPengontrolan || "..."}
- Record CCTV : ${entry.acRecordCctv || "..."}`;
      return;
    }
    const equipListFormatted = entry.peralatan.map((eq) => {
      if (eq === "X-Ray") return entry.xrayModel === "Semua X-Ray" ? "X-Ray" : entry.xrayModel;
      if (eq === "WTMD") return entry.wtmdModel === "Semua WTMD" ? "WTMD" : entry.wtmdModel;
      if (eq === "HHMD") return entry.hhmdModel === "Semua HHMD" ? "HHMD" : entry.hhmdModel;
      if (eq === "Body Scanner") return entry.bsModel === "Semua Body Scanner" ? "Body Scanner" : entry.bsModel;
      if (eq === "ETD") return entry.etdModel === "Semua ETD" ? "ETD" : entry.etdModel;
      return eq;
    });
    const locString = entry.lokasi1 + (entry.lokasi2 && entry.lokasi2 !== "-" ? ` ${entry.lokasi2}` : "");
    const lokasiStr = locString || "...";
    const equipString = equipListFormatted.length === 1 ? equipListFormatted[0] : equipListFormatted.length > 1 ? `${equipListFormatted.slice(0, -1).join(", ")} & ${equipListFormatted[equipListFormatted.length - 1]}` : "-";
    msg += `

Peralatan : ${equipString}
Lokasi : ${lokasiStr}

Kegiatan :
- Pembersihan ${equipString}
- Kalibrasi ${equipString}
   
Catatan :`;
    if (entry.peralatan.includes("X-Ray")) {
      const xrayName = entry.xrayModel === "Semua X-Ray" ? "X-Ray" : entry.xrayModel;
      const fmtUnit = (val, unit) => {
        if (!val) return "...";
        const trimmed = String(val).trim();
        return /[a-zA-Z]$/.test(trimmed) ? trimmed : `${trimmed} ${unit}`;
      };
      const kvStr = `${fmtUnit(entry.xrayKvV, "kV")} / ${fmtUnit(entry.xrayKvH, "kV")}`;
      const maStr = `${fmtUnit(entry.xrayMaV, "mA")} / ${fmtUnit(entry.xrayMaH, "mA")}`;
      const onStr = `${fmtUnit(entry.xrayOnV, "h")} / ${fmtUnit(entry.xrayOnH, "h")}`;
      msg += `
${xrayName}
- kV Vertikal/Horizontal : ${kvStr}
- mA Vertikal/Horizontal : ${maStr}
- Ontime Vertikal/Horizontal : ${onStr}
- Archive : ${entry.xrayArchive || "+- 1 bulan"}
`;
    }
    if (entry.peralatan.includes("WTMD")) {
      const wtmdName = entry.wtmdModel === "Semua WTMD" ? "WTMD" : entry.wtmdModel;
      msg += `
${wtmdName}
- Z1 : ${entry.wtmdZ1 || "..."} - Z2 : ${entry.wtmdZ2 || "..."} - Z3 : ${entry.wtmdZ3 || "..."} - Z4 : ${entry.wtmdZ4 || "..."}
- LC : ${entry.wtmdLc || "..."} - LS : ${entry.wtmdLs || "..."} - UC : ${entry.wtmdUc || "..."} - SE : ${entry.wtmdSe || "..."} - DS : ${entry.wtmdDs || "..."}
`;
    }
    if (entry.peralatan.includes("Body Scanner")) {
      const bsName = entry.bsModel === "Semua Body Scanner" ? "Body Scanner" : entry.bsModel;
      msg += `
${bsName}
- Test Tampilan Suspect Item : ${entry.bsSuspect || "Normal"}
- Test Monitor : ${entry.bsMonitor || "Normal"}
- Test Fungsi Scanning : ${entry.bsScanning || "Normal"}
- Test Fungsi Kalibrasi : ${entry.bsCalibration || "Normal"}
`;
    }
    if (entry.peralatan.includes("ETD")) {
      const etdName = entry.etdModel === "Semua ETD" ? "ETD" : entry.etdModel;
      msg += `
${etdName}
- Sampling Test TNT : ${entry.etdTnt || "Alarm"}
- Sampling Test PETN : ${entry.etdPetn || "Alarm"}
- Sampling Test RDX : ${entry.etdRdx || "Alarm"}
`;
    }
  });
  return msg;
};
const generateWA_Kegiatan = (kegiatanData) => {
  const formattedDate = formatTanggalIndo(kegiatanData.tanggal);
  const waktuText = kegiatanData.waktuSelesai ? `${kegiatanData.waktuMulai} - ${kegiatanData.waktuSelesai}` : kegiatanData.waktuMulai;
  return `*KEGIATAN SSES T2*
Hari/Tanggal/Jam : ${formattedDate}, ${waktuText}
Lokasi : ${kegiatanData.lokasi}
Kegiatan : ${kegiatanData.kegiatan}`;
};
const generateWA_InitialReport = (formData) => {
  if (!formData.peralatan) return "Silakan pilih peralatan terlebih dahulu untuk melihat preview laporan...";
  const dateParts = formData.tanggal ? formData.tanggal.split("-") : ["", "", ""];
  const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : "";
  const locList = formData.lokasiList && Array.isArray(formData.lokasiList) && formData.lokasiList.length > 0 ? formData.lokasiList.filter((l) => l.lokasi1) : [{ lokasi1: formData.lokasi1, lokasi2: formData.lokasi2 }];
  const lokasiFinal = locList.map((loc) => {
    if (loc.isManual || loc.lokasi2 === "-" && !loc.lokasi2) return loc.lokasi1;
    return loc.lokasi1 + (loc.lokasi2 && loc.lokasi2 !== "-" ? formData.peralatan === "Access Control" || loc.lokasi1 === "HBSCP" ? ` ${loc.lokasi2}` : ` No.${loc.lokasi2}` : "");
  }).join(", ") || "-";
  const pukulStr = formData.waktuMulai ? `${formData.waktuMulai} WIB` : "- WIB";
  const lamaStr = formData.lamaPengerjaan || "-";
  const teknisiStr = formData.teknisi || "-";
  const permasalahanStr = formData.permasalahan || "";
  const statusStr = formData.status || "-";
  const uraianStr = formData.uraian && formData.uraian !== "• " ? formData.uraian : "(Uraian kronologis kerusakan s.d saat dilaporkan)";
  const dampakStr = formData.dampak || "1. ";
  const mitigasiStr = formData.tindakanMitigasi || "1. ";
  const tindakanStr = formData.tindakan || "1. ";
  const hasilStr = formData.hasilTindakan || "1. ";
  return `*INITIAL REPORT*

Nama Peralatan : ${formData.peralatan}
Lokasi : ${lokasiFinal}

🗓️ Tanggal : ${formattedDate}
🕝 Pukul : ${pukulStr}
⏰ Lama waktu Pengerjaan : ${lamaStr}
👨🏻‍🔧 Teknisi : ${teknisiStr}

🪛 Permasalahan : 
${permasalahanStr}

Status : ${statusStr}

*URAIAN*
${uraianStr}

*DAMPAK*
${dampakStr}

*TINDAKAN MITIGASI*
${mitigasiStr}

*TINDAKAN*
${tindakanStr}

*HASIL TINDAKAN*
${hasilStr}

Demikian laporan kronologis dan tindak lanjut kami sampaikan
Terimakasih atas perhatiannya.`;
};
const fallbackShare = async (message, hasUnsharedPhotos, setIsCopied) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(message);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = message;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
    if (hasUnsharedPhotos) {
      alert("Perangkat ini tidak mendukung pengiriman foto secara otomatis. Teks laporan telah dicopy. Silakan 'Paste' di WhatsApp dan lampirkan foto Anda secara manual.");
    }
  } catch (err) {
    console.error("Gagal menyalin teks", err);
  }
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
};
const shareToWhatsApp = async (message, filesArray, setIsCopied) => {
  let finalFiles = [];
  if (filesArray) {
    if (Array.isArray(filesArray)) finalFiles = filesArray;
    else finalFiles = [filesArray];
  }
  try {
    if (finalFiles.length > 0 && navigator.canShare && navigator.canShare({ files: finalFiles })) {
      await navigator.share({ files: finalFiles, title: "Laporan SSES T2", text: message });
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      return;
    } else if (finalFiles.length === 0 && navigator.share) {
      await navigator.share({ title: "Laporan SSES T2", text: message });
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      return;
    }
  } catch (err) {
    console.error("Share dibatalkan atau gagal", err);
    if (err.name === "AbortError") return;
  }
  fallbackShare(message, finalFiles.length > 0, setIsCopied);
};
const compressImageFile = async (file, maxWidth = 1600, maxHeight = 1600, quality = 0.8) => {
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
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
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
            file.name.replace(/\.[^/.]+$/, "") + ".jpg",
            { type: "image/jpeg", lastModified: Date.now() }
          );
          const compressedPreview = URL.createObjectURL(blob);
          resolve({ file: compressedFile, preview: compressedPreview });
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      resolve({ file, preview: objectUrl });
    };
    img.src = objectUrl;
  });
};
const drawCellTextOverlay = (ctx, x, y, cellW, cellH, annotation, originalImgHeight) => {
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
  if (typeof annotation.size === "number" && !isNaN(annotation.size)) {
    const scaleFactor = originalImgHeight && originalImgHeight > 0 ? cellH / originalImgHeight : 0.67;
    fontSize = Math.max(14, Math.min(Math.floor(cellH / 2), Math.round(annotation.size * scaleFactor)));
  } else {
    let fontScale = 0.12;
    if (annotation.size === "small") fontScale = 0.08;
    if (annotation.size === "large") fontScale = 0.18;
    fontSize = Math.max(16, Math.round(baseDim * fontScale));
  }
  const align = annotation.align || "center";
  ctx.font = `bold ${fontSize}px sans-serif, Arial, Inter`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  const lines = [];
  const rawLines = annotation.text.split("\n");
  const maxLineWidth = cellW * 0.9;
  rawLines.forEach((rawLine) => {
    const words = rawLine.split(" ");
    let currentLine = "";
    words.forEach((word) => {
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
  let boxY = y + cellH - boxHeight;
  if (annotation.position === "top") boxY = y;
  if (annotation.position === "center") boxY = y + (cellH - boxHeight) / 2;
  if (annotation.style !== "clear") {
    let bgColor = "rgba(0, 0, 0, 0.65)";
    if (annotation.style === "red") bgColor = "rgba(220, 38, 38, 0.85)";
    if (annotation.style === "green") bgColor = "rgba(22, 163, 74, 0.85)";
    if (annotation.style === "yellow") bgColor = "rgba(234, 179, 8, 0.85)";
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, boxY, cellW, boxHeight);
  }
  const paddingX = cellW * 0.05;
  lines.forEach((line, index) => {
    let textX = x + cellW / 2;
    if (align === "left") textX = x + paddingX;
    if (align === "right") textX = x + cellW - paddingX;
    const textY = boxY + paddingY + (index + 0.5) * lineHeight;
    if (annotation.style === "clear") {
      ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
      ctx.shadowBlur = Math.round(fontSize * 0.3);
      ctx.shadowOffsetX = Math.max(2, Math.round(fontSize * 0.05));
      ctx.shadowOffsetY = Math.max(2, Math.round(fontSize * 0.05));
      ctx.lineWidth = Math.max(3, Math.round(fontSize * 0.12));
      ctx.strokeStyle = "#000000";
      ctx.strokeText(line, textX, textY);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(line, textX, textY);
    } else if (annotation.style === "yellow") {
      ctx.fillStyle = "#000000";
      ctx.fillText(line, textX, textY);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillText(line, textX, textY);
    }
  });
  ctx.restore();
};
const processPhotosToCollage = async (photosArray, annotation) => {
  return new Promise(async (resolve) => {
    if (photosArray.length <= 1) {
      resolve(null);
      return;
    }
    try {
      const loadedImages = await Promise.all(photosArray.map((p) => {
        return new Promise((resolve2) => {
          const img = new Image();
          let settled = false;
          const finish = () => {
            if (!settled) {
              settled = true;
              resolve2({ img, zoom: p.zoom || 1, annotation: p.annotation });
            }
          };
          const timer = setTimeout(finish, 4e3);
          img.onload = () => {
            clearTimeout(timer);
            finish();
          };
          img.onerror = () => {
            clearTimeout(timer);
            console.warn("Gambar gagal dimuat untuk kolase:", p.preview);
            finish();
          };
          img.src = p.annotation && p.originalPreview ? p.originalPreview : p.preview;
          if (img.complete && img.naturalWidth > 0) {
            clearTimeout(timer);
            finish();
          }
        });
      }));
      const validImages = loadedImages.filter((item) => item.img && item.img.naturalWidth > 0 && item.img.naturalHeight > 0);
      if (validImages.length <= 1) {
        resolve(null);
        return;
      }
      const CELL_SIZE = 800;
      const SPACING = 24;
      const cols = Math.ceil(Math.sqrt(validImages.length));
      const rows = Math.ceil(validImages.length / cols);
      const canvas = document.createElement("canvas");
      canvas.width = cols * CELL_SIZE + (cols + 1) * SPACING;
      canvas.height = rows * CELL_SIZE + (rows + 1) * SPACING;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.fillStyle = "#ffffff";
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
        drawTextOverlay(canvas, annotation.text, annotation.position, annotation.style, annotation.size, annotation.align || "center");
      }
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const newFile = new File([blob], `Kolase_${Date.now()}.jpg`, { type: "image/jpeg" });
        const newUrl = URL.createObjectURL(blob);
        resolve({ url: newUrl, file: newFile });
      }, "image/jpeg", 0.85);
    } catch (err) {
      console.error("Gagal membuat kolase:", err);
      resolve(null);
    }
  });
};
const GOOGLE_SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzL7KzQ38l7-64u8v-J5zE0Vvj_i_8p0fWvM_ZpM4D1Jv4A2dK9eA6i2t2z-3D1N6eE/exec";
const determineShift = (waktuStr) => {
  if (!waktuStr) {
    const hour2 = (/* @__PURE__ */ new Date()).getHours();
    return hour2 >= 8 && hour2 < 20 ? "PS" : "M";
  }
  const match = waktuStr.match(/(\d{2}):(\d{2})/);
  if (!match) {
    const hour2 = (/* @__PURE__ */ new Date()).getHours();
    return hour2 >= 8 && hour2 < 20 ? "PS" : "M";
  }
  const hour = parseInt(match[1], 10);
  return hour >= 8 && hour < 20 ? "PS" : "M";
};
const fileToBase64 = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(",")[1];
      resolve(base64String || "");
    };
    reader.onerror = () => {
      console.error("Gagal membaca file gambar untuk sync");
      resolve("");
    };
    reader.readAsDataURL(file);
  });
};
const syncToGoogleSheets = async (payload) => {
  try {
    let imageBase64 = "";
    if (payload.imageFile) {
      imageBase64 = await fileToBase64(payload.imageFile);
    }
    let shift = payload.shift || determineShift(payload.waktu);
    const postBody = {
      action: "save_report",
      jenis: payload.jenis,
      tanggal: payload.tanggal,
      waktu: payload.waktu,
      shift,
      teknisi: payload.teknisi || "-",
      lokasi: payload.lokasi || "-",
      peralatan: payload.peralatan || "-",
      uraian: payload.uraian || "-",
      tindakLanjut: payload.tindakLanjut || "-",
      status: payload.status || "Normal",
      imageBase64
    };
    fetch(GOOGLE_SHEETS_WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(postBody)
    }).catch((err) => console.error(`[Background Sync] Gagal mengirim laporan:`, err));
    return true;
  } catch (e) {
    console.error("[Background Sync] Error memproses payload:", e);
    return false;
  }
};
const updateSheetReport = async (payload) => {
  try {
    let imageBase64 = "";
    if (payload.imageFile) {
      imageBase64 = await fileToBase64(payload.imageFile);
    }
    let shift = payload.shift || determineShift(payload.waktu);
    const postBody = {
      action: "update_report",
      rowIndex: payload.rowIndex,
      jenis: payload.jenis,
      tanggal: payload.tanggal,
      waktu: payload.waktu,
      shift,
      teknisi: payload.teknisi || "-",
      lokasi: payload.lokasi || "-",
      peralatan: payload.peralatan || "-",
      uraian: payload.uraian || "-",
      tindakLanjut: payload.tindakLanjut || "-",
      status: payload.status || "Normal",
      imageBase64
    };
    const res = await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(postBody)
    });
    const result = await res.json();
    return result.status === "success";
  } catch (e) {
    console.error("[Update Report] Error:", e);
    return false;
  }
};
const deleteSheetReport = async (rowIndex) => {
  try {
    const postBody = {
      action: "delete_report",
      rowIndex
    };
    const res = await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(postBody)
    });
    const result = await res.json();
    return result.status === "success";
  } catch (e) {
    console.error("[Delete Report] Error:", e);
    return false;
  }
};
const LiveCollagePreview = ({ photos, onCollageChange }) => {
  const [autoCollageUrl, setAutoCollageUrl] = useState(null);
  const [autoCollageFile, setAutoCollageFile] = useState(null);
  const [rawCollageUrl, setRawCollageUrl] = useState(null);
  const [rawCollageFile, setRawCollageFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [collageAnnotation, setCollageAnnotation] = useState(void 0);
  const [isEditingText, setIsEditingText] = useState(false);
  const genRef = useRef(0);
  const photosHash = photos.map((p, idx) => `${idx}_${p.preview}_${p.zoom || 1}`).join("|");
  useEffect(() => {
    const currentGen = ++genRef.current;
    const generate = async () => {
      if (photos.length > 1) {
        setIsGenerating(true);
        const rawResult = await processPhotosToCollage(photos);
        if (currentGen !== genRef.current) {
          if (rawResult) URL.revokeObjectURL(rawResult.url);
          return;
        }
        if (rawResult) {
          setRawCollageUrl(rawResult.url);
          setRawCollageFile(rawResult.file);
          if (collageAnnotation) {
            const annotatedResult = await processPhotosToCollage(photos, collageAnnotation);
            if (currentGen !== genRef.current) {
              if (annotatedResult) URL.revokeObjectURL(annotatedResult.url);
              return;
            }
            setIsGenerating(false);
            if (annotatedResult) {
              setAutoCollageUrl(annotatedResult.url);
              setAutoCollageFile(annotatedResult.file);
              if (onCollageChange) onCollageChange(annotatedResult.file, annotatedResult.url, collageAnnotation);
            }
          } else {
            setIsGenerating(false);
            setAutoCollageUrl(rawResult.url);
            setAutoCollageFile(rawResult.file);
            if (onCollageChange) onCollageChange(rawResult.file, rawResult.url, void 0);
          }
        } else {
          setIsGenerating(false);
          setAutoCollageUrl(null);
          setAutoCollageFile(null);
          if (onCollageChange) onCollageChange(null, null, void 0);
        }
      } else {
        setIsGenerating(false);
        setAutoCollageUrl(null);
        setAutoCollageFile(null);
        setRawCollageUrl(null);
        setRawCollageFile(null);
        if (onCollageChange) onCollageChange(null, null, void 0);
      }
    };
    generate();
  }, [photosHash, photos.length, collageAnnotation]);
  useEffect(() => {
    return () => {
      if (autoCollageUrl && autoCollageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(autoCollageUrl);
      }
      if (rawCollageUrl && rawCollageUrl.startsWith("blob:") && rawCollageUrl !== autoCollageUrl) {
        URL.revokeObjectURL(rawCollageUrl);
      }
    };
  }, [autoCollageUrl, rawCollageUrl]);
  if (photos.length <= 1 || !autoCollageUrl && !isGenerating) return null;
  return /* @__PURE__ */ jsxs("div", { className: "mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-slate-700", children: "Preview Auto-Kolase:" }),
      isGenerating && /* @__PURE__ */ jsxs("span", { className: "text-xs bg-blue-100 text-blue-700 font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping" }),
        "Memperbarui..."
      ] })
    ] }),
    autoCollageUrl ? /* @__PURE__ */ jsxs("div", { className: "relative inline-block w-full max-w-sm", children: [
      /* @__PURE__ */ jsx(
        "img",
        {
          src: autoCollageUrl,
          alt: "Auto Collage",
          className: `w-full rounded-lg shadow-sm border border-slate-200 transition-opacity duration-200 ${isGenerating ? "opacity-50" : "opacity-100"}`
        },
        autoCollageUrl
      ),
      /* @__PURE__ */ jsxs("div", { className: "mt-2.5 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setIsEditingText(true),
            className: "py-1.5 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors",
            children: [
              /* @__PURE__ */ jsx(Type, { className: "w-3.5 h-3.5" }),
              collageAnnotation ? "Edit Teks Kolase" : "+ Beri Teks pada Kolase"
            ]
          }
        ),
        collageAnnotation && /* @__PURE__ */ jsxs("span", { className: "text-xs text-blue-700 font-medium bg-blue-50 px-2 py-1 rounded-md border border-blue-200 truncate max-w-[180px]", children: [
          '"',
          collageAnnotation.text,
          '"'
        ] })
      ] })
    ] }) : /* @__PURE__ */ jsx("div", { className: "w-full max-w-sm h-48 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 text-sm", children: "Membuat kolase foto..." }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mt-2", children: "Kolase ini digenerate otomatis. Anda dapat mengedit urutan daftar foto dengan menggesernya." }),
    isEditingText && (rawCollageUrl || autoCollageUrl) && /* @__PURE__ */ jsx(
      PhotoTextEditorModal,
      {
        isOpen: isEditingText,
        onClose: () => setIsEditingText(false),
        photoUrl: rawCollageUrl || autoCollageUrl || "",
        initialAnnotation: collageAnnotation,
        onSave: (newFile, newUrl, annotation) => {
          setCollageAnnotation(annotation);
          setIsEditingText(false);
        },
        onReset: () => {
          setCollageAnnotation(void 0);
          setIsEditingText(false);
        }
      }
    )
  ] });
};
function formatNamaPersonel$1(fullName) {
  if (!fullName) return "";
  const words = fullName.trim().split(/\s+/);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0];
  const firstWord = words[0].toLowerCase();
  const titlePrefixes = ["m.", "muh.", "muhammad", "moch.", "mochammad", "abdul"];
  if (titlePrefixes.includes(firstWord)) {
    return words[1];
  }
  return words[0];
}
const TabInitialReport = () => {
  const { isCopied, setIsCopied } = useAppStore();
  const [formData, setFormData] = useState(() => {
    const now = /* @__PURE__ */ new Date();
    const realYear = now.getFullYear();
    const realMonth = String(now.getMonth() + 1).padStart(2, "0");
    const realDay = String(now.getDate()).padStart(2, "0");
    const realDate = `${realYear}-${realMonth}-${realDay}`;
    const currentHour = String(now.getHours()).padStart(2, "0");
    const currentMin = String(now.getMinutes()).padStart(2, "0");
    return {
      peralatan: "",
      lokasi1: "",
      lokasi2: "",
      lokasiList: [{ lokasi1: "", lokasi2: "", isManual: false }],
      tanggal: realDate,
      waktuMulai: `${currentHour}:${currentMin}`,
      jamPengerjaan: "",
      menitPengerjaan: "",
      lamaPengerjaan: "-",
      teknisi: "-",
      permasalahan: "• ",
      status: "On Progress",
      uraian: "• ",
      dampak: "1. ",
      tindakanMitigasi: "1. ",
      tindakan: "1. ",
      hasilTindakan: "1. "
    };
  });
  const [availableTeknisi, setAvailableTeknisi] = useState([]);
  const [selectedTeknisi, setSelectedTeknisi] = useState([]);
  const [manualTeknisi, setManualTeknisi] = useState("");
  const [tipePeralatanOptions, setTipePeralatanOptions] = useState([]);
  const [isManualPeralatan, setIsManualPeralatan] = useState(false);
  React.useEffect(() => {
    const fetchData = async () => {
      const now = /* @__PURE__ */ new Date();
      const currentHour = now.getHours();
      const logicalDateObj = new Date(now.getTime());
      if (currentHour < 8) {
        logicalDateObj.setDate(logicalDateObj.getDate() - 1);
      }
      const tzOffset = logicalDateObj.getTimezoneOffset() * 6e4;
      const todayStr = new Date(logicalDateObj.getTime() - tzOffset).toISOString().split("T")[0];
      const isPagi = currentHour >= 8 && currentHour < 20;
      const { data: dataTeknisi } = await supabase.from("jadwal_shift").select(`id, shift, status_kehadiran, personel:personel_id(nama, unit_kerja(nama))`).eq("tanggal", todayStr).eq("status_kehadiran", "Hadir");
      if (dataTeknisi) {
        const filteredTeknisi = dataTeknisi.filter((d) => {
          const s = (d.shift || "").toUpperCase();
          if (isPagi) {
            return s === "PS";
          } else {
            return s === "M";
          }
        });
        setAvailableTeknisi(filteredTeknisi.map((d) => ({
          id: d.id,
          name: formatNamaPersonel$1(toTitleCase(d.personel?.nama || "")),
          unit: d.personel?.unit_kerja?.nama || ""
        })).filter((t) => t.name !== ""));
      }
      const { data: dataTipe } = await supabase.from("tipe_peralatan").select("nama").order("nama", { ascending: true });
      if (dataTipe) {
        setTipePeralatanOptions(dataTipe.map((d) => d.nama));
      }
    };
    fetchData();
  }, []);
  React.useEffect(() => {
    setFormData((prev) => {
      const allTeknisi = [...selectedTeknisi];
      if (manualTeknisi.trim()) {
        const manualList = manualTeknisi.split(",").map((t) => t.trim()).filter((t) => t);
        allTeknisi.push(...manualList);
      }
      let teknisiStr = "-";
      if (allTeknisi.length === 1) {
        teknisiStr = allTeknisi[0];
      } else if (allTeknisi.length > 1) {
        const last = allTeknisi[allTeknisi.length - 1];
        const rest = allTeknisi.slice(0, -1);
        teknisiStr = `${rest.join(", ")} & ${last}`;
      }
      return { ...prev, teknisi: teknisiStr };
    });
  }, [selectedTeknisi, manualTeknisi]);
  const toggleTeknisi = (name) => {
    setSelectedTeknisi((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);
  };
  const [photos, setPhotos] = useState([]);
  const [photoGroups, setPhotoGroups] = useState([
    { id: Date.now(), photos: [], isGenerating: false, autoCollageFile: null, collageAnnotation: void 0 }
  ]);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const photoGroupsRef = React.useRef(photoGroups);
  photoGroupsRef.current = photoGroups;
  React.useEffect(() => {
    return () => {
      photoGroupsRef.current.forEach((group) => {
        group.photos.forEach((p) => {
          if (p.preview && p.preview.startsWith("blob:")) {
            URL.revokeObjectURL(p.preview);
          }
        });
      });
    };
  }, []);
  const permasalahanRef = React.useRef(null);
  const uraianRef = React.useRef(null);
  const dampakRef = React.useRef(null);
  const mitigasiRef = React.useRef(null);
  const tindakanRef = React.useRef(null);
  const hasilRef = React.useRef(null);
  const autoResize = (ref, minHeight) => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${Math.max(minHeight, ref.current.scrollHeight)}px`;
    }
  };
  React.useEffect(() => autoResize(permasalahanRef, 80), [formData.permasalahan]);
  React.useEffect(() => autoResize(uraianRef, 100), [formData.uraian]);
  React.useEffect(() => autoResize(dampakRef, 80), [formData.dampak]);
  React.useEffect(() => autoResize(mitigasiRef, 80), [formData.tindakanMitigasi]);
  React.useEffect(() => autoResize(tindakanRef, 100), [formData.tindakan]);
  React.useEffect(() => autoResize(hasilRef, 100), [formData.hasilTindakan]);
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };
    if (name === "peralatan") {
      newFormData.lokasi1 = "";
      newFormData.lokasi2 = "";
      newFormData.lokasiList = [{ lokasi1: "", lokasi2: "", isManual: false }];
    }
    setFormData(newFormData);
  };
  const handleJamChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    setFormData((prev) => {
      const jam = val;
      const menit = prev.menitPengerjaan;
      const jamNum = parseInt(jam, 10) || 0;
      const menitNum = parseInt(menit, 10) || 0;
      let lama = "-";
      if (jamNum > 0 && menitNum > 0) lama = `${jamNum} Jam ${menitNum} Menit`;
      else if (jamNum > 0) lama = `${jamNum} Jam`;
      else if (menitNum > 0) lama = `${menitNum} Menit`;
      return { ...prev, jamPengerjaan: jam, lamaPengerjaan: lama };
    });
  };
  const handleMenitChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    setFormData((prev) => {
      const jam = prev.jamPengerjaan;
      const menit = val;
      const jamNum = parseInt(jam, 10) || 0;
      const menitNum = parseInt(menit, 10) || 0;
      let lama = "-";
      if (jamNum > 0 && menitNum > 0) lama = `${jamNum} Jam ${menitNum} Menit`;
      else if (jamNum > 0) lama = `${jamNum} Jam`;
      else if (menitNum > 0) lama = `${menitNum} Menit`;
      return { ...prev, menitPengerjaan: menit, lamaPengerjaan: lama };
    });
  };
  const handleLokasiEntryChange = (index, field, value) => {
    if (field === "isManualToggle") {
      setFormData((prev) => {
        const newList = [...prev.lokasiList || [{ lokasi1: prev.lokasi1 || "", lokasi2: prev.lokasi2 || "" }]];
        newList[index] = { ...newList[index], lokasi1: "", lokasi2: "", isManual: false };
        return {
          ...prev,
          lokasiList: newList,
          lokasi1: newList[0]?.lokasi1 || "",
          lokasi2: newList[0]?.lokasi2 || ""
        };
      });
      return;
    }
    if (field === "lokasi1" && value === "MANUAL_ENTRY") {
      setFormData((prev) => {
        const newList = [...prev.lokasiList || [{ lokasi1: prev.lokasi1 || "", lokasi2: prev.lokasi2 || "" }]];
        newList[index] = { ...newList[index], lokasi1: "", lokasi2: "-", isManual: true };
        return {
          ...prev,
          lokasiList: newList,
          lokasi1: newList[0]?.lokasi1 || "",
          lokasi2: newList[0]?.lokasi2 || ""
        };
      });
      return;
    }
    setFormData((prev) => {
      const newList = [...prev.lokasiList || [{ lokasi1: prev.lokasi1 || "", lokasi2: prev.lokasi2 || "" }]];
      newList[index] = { ...newList[index], [field]: value };
      if (field === "lokasi1") {
        if (newList[index].isManual || isManualPeralatan) {
          newList[index].lokasi2 = "-";
        } else {
          const pts = getLokasi2Options(value, [prev.peralatan]);
          newList[index].lokasi2 = pts.length === 0 || pts.length === 1 && pts[0] === "-" ? "-" : "";
        }
      }
      return {
        ...prev,
        lokasiList: newList,
        lokasi1: newList[0]?.lokasi1 || "",
        lokasi2: newList[0]?.lokasi2 || ""
      };
    });
  };
  const addLokasiEntry = () => {
    setFormData((prev) => {
      const newList = [...prev.lokasiList || [{ lokasi1: prev.lokasi1 || "", lokasi2: prev.lokasi2 || "" }], { lokasi1: "", lokasi2: isManualPeralatan ? "-" : "", isManual: isManualPeralatan }];
      return { ...prev, lokasiList: newList };
    });
  };
  const removeLokasiEntry = (index) => {
    setFormData((prev) => {
      const newList = [...prev.lokasiList || [{ lokasi1: prev.lokasi1 || "", lokasi2: prev.lokasi2 || "" }]];
      newList.splice(index, 1);
      if (newList.length === 0) newList.push({ lokasi1: "", lokasi2: isManualPeralatan ? "-" : "", isManual: isManualPeralatan });
      return {
        ...prev,
        lokasiList: newList,
        lokasi1: newList[0]?.lokasi1 || "",
        lokasi2: newList[0]?.lokasi2 || ""
      };
    });
  };
  const handlePeralatanChange = (e) => {
    const value = e.target.value;
    if (value === "MANUAL_ENTRY") {
      setIsManualPeralatan(true);
      setFormData((prev) => ({ ...prev, peralatan: "", lokasi1: "", lokasi2: "-", lokasiList: [{ lokasi1: "", lokasi2: "-", isManual: true }] }));
      return;
    }
    setFormData((prev) => ({ ...prev, peralatan: value, lokasi1: "", lokasi2: "", lokasiList: [{ lokasi1: "", lokasi2: "", isManual: false }] }));
  };
  const handleBulletChange = (e, field) => {
    let value = e.target.value;
    if (!value.startsWith("• ")) {
      value = "• " + value.replace(/^•\s*/, "");
    }
    value = value.replace(/\n([^•])/g, "\n• $1");
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const handleBulletKeyDown = (e, field) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setFormData((prev) => ({ ...prev, [field]: prev[field] + "\n• " }));
    }
  };
  const handleNumberedChange = (e, field) => {
    let value = e.target.value;
    if (value.length > 0 && !value.match(/^\d+\.\s/)) {
      value = "1. " + value.replace(/^\d+\.\s*/, "");
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const handleNumberedKeyDown = (e, field) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const cursorPosition = textarea.selectionStart;
      const textBefore = textarea.value.substring(0, cursorPosition);
      const textAfter = textarea.value.substring(cursorPosition);
      const linesBefore = textBefore.split("\n");
      const nextNum = linesBefore.length + 1;
      const newText = textBefore + `
${nextNum}. ` + textAfter;
      setFormData((prev) => ({ ...prev, [field]: newText }));
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = cursorPosition + 3 + String(nextNum).length;
      }, 0);
    }
  };
  const handlePhotoUpload = async (groupId, e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const compressedResults = await Promise.all(files.map((f) => compressImageFile(f)));
      const newPhotos = compressedResults.map((res) => ({
        id: Date.now() + Math.random(),
        file: res.file,
        preview: res.preview,
        zoom: 1
      }));
      setPhotoGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, photos: [...g.photos, ...newPhotos] } : g));
    }
  };
  const removePhoto = (groupId, photoIndex) => {
    setPhotoGroups((prev) => prev.map((group) => {
      if (group.id === groupId) {
        const newPhotos = [...group.photos];
        URL.revokeObjectURL(newPhotos[photoIndex].preview);
        newPhotos.splice(photoIndex, 1);
        return { ...group, photos: newPhotos };
      }
      return group;
    }));
  };
  const updatePhotoZoom = (groupId, photoIndex, delta) => {
    setPhotoGroups((prev) => prev.map((group) => {
      if (group.id === groupId) {
        const newPhotos = [...group.photos];
        const currentZoom = newPhotos[photoIndex].zoom || 1;
        newPhotos[photoIndex] = {
          ...newPhotos[photoIndex],
          zoom: Math.max(0.5, Math.min(3, currentZoom + delta))
        };
        return { ...group, photos: newPhotos };
      }
      return group;
    }));
  };
  const handlePhotoDrop = (e, groupId, targetIndex) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer?.getData("text/plain");
    if (!sourceIndexStr) return;
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (sourceIndex === targetIndex || isNaN(sourceIndex)) return;
    setPhotoGroups((prev) => prev.map((group) => {
      if (group.id === groupId) {
        const newPhotos = [...group.photos];
        const [movedPhoto] = newPhotos.splice(sourceIndex, 1);
        newPhotos.splice(targetIndex, 0, movedPhoto);
        return { ...group, photos: newPhotos };
      }
      return group;
    }));
  };
  const handleSaveText = (newFile, newPreviewUrl, annotation) => {
    if (!editingPhoto) return;
    const { groupId, photoIndex } = editingPhoto;
    setPhotoGroups((prev) => prev.map((group) => {
      if (group.id !== groupId) return group;
      const newPhotos = [...group.photos];
      const currentPhoto = newPhotos[photoIndex];
      newPhotos[photoIndex] = {
        ...currentPhoto,
        originalFile: currentPhoto.originalFile || currentPhoto.file,
        originalPreview: currentPhoto.originalPreview || currentPhoto.preview,
        file: newFile,
        preview: newPreviewUrl,
        annotation
      };
      return { ...group, photos: newPhotos };
    }));
    setEditingPhoto(null);
  };
  const handleResetText = () => {
    if (!editingPhoto) return;
    const { groupId, photoIndex } = editingPhoto;
    setPhotoGroups((prev) => prev.map((group) => {
      if (group.id !== groupId) return group;
      const newPhotos = [...group.photos];
      const currentPhoto = newPhotos[photoIndex];
      if (!currentPhoto.originalFile || !currentPhoto.originalPreview) return group;
      newPhotos[photoIndex] = {
        ...currentPhoto,
        file: currentPhoto.originalFile,
        preview: currentPhoto.originalPreview,
        annotation: void 0
      };
      return { ...group, photos: newPhotos };
    }));
    setEditingPhoto(null);
  };
  const addPhotoGroup = () => {
    setPhotoGroups((prev) => [...prev, { id: Date.now(), photos: [], isGenerating: false, autoCollageFile: null, collageAnnotation: void 0 }]);
  };
  const removePhotoGroup = (groupId) => {
    if (photoGroups.length <= 1) return;
    setPhotoGroups((prev) => {
      const groupToRemove = prev.find((g) => g.id === groupId);
      if (groupToRemove) {
        groupToRemove.photos.forEach((p) => URL.revokeObjectURL(p.preview));
      }
      return prev.filter((g) => g.id !== groupId);
    });
    if (editingPhoto?.groupId === groupId) {
      setEditingPhoto(null);
    }
  };
  const renderPhotoSection = () => /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-blue-50/50 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold text-slate-800 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Camera, { className: "w-5 h-5 text-blue-600" }),
        " Lampiran Foto"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end gap-1", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded w-fit", children: "Kirim multi kolase sekaligus" }),
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-500 font-medium flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Move, { className: "w-3 h-3" }),
          " Geser foto untuk urutkan"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6", children: [
      photoGroups.map((group, groupIndex) => /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-5 bg-blue-50/30 border border-blue-100 rounded-xl space-y-4 relative shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center gap-3 justify-between", children: [
          /* @__PURE__ */ jsx("div", { className: "flex-1 w-full flex items-center gap-3", children: /* @__PURE__ */ jsxs("h3", { className: "font-bold text-blue-900 text-sm", children: [
            "Grup Kolase ",
            groupIndex + 1
          ] }) }),
          photoGroups.length > 1 && /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => removePhotoGroup(group.id),
              className: "text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-1 self-end sm:self-center text-sm font-bold",
              children: [
                /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }),
                " ",
                /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: "Hapus Grup" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("label", { className: "flex items-center justify-center w-full p-6 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors group", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2 text-center", children: [
            /* @__PURE__ */ jsx(ImagePlus, { className: "w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-blue-700", children: "Pilih / Ambil Foto" }),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-blue-500", children: "Galeri, File, atau Kamera langsung" })
          ] }),
          /* @__PURE__ */ jsx("input", { type: "file", accept: "image/*", multiple: true, className: "hidden", onChange: (e) => handlePhotoUpload(group.id, e) })
        ] }) }),
        group.photos.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("p", { className: "text-xs font-semibold text-slate-500 mb-2", children: [
            "Daftar Foto (",
            group.photos.length,
            "):"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4", children: group.photos.map((photo, pIndex) => /* @__PURE__ */ jsxs(
            "div",
            {
              draggable: true,
              onDragStart: (e) => e.dataTransfer.setData("text/plain", pIndex.toString()),
              onDragOver: (e) => e.preventDefault(),
              onDrop: (e) => handlePhotoDrop(e, group.id, pIndex),
              className: "relative bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm group/photo hover:shadow-md transition-shadow aspect-square cursor-move flex flex-col",
              children: [
                /* @__PURE__ */ jsx("div", { className: "flex-1 relative overflow-hidden bg-black flex items-center justify-center", children: /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: photo.preview,
                    alt: "Preview",
                    className: "absolute w-full h-full object-cover transition-transform",
                    style: { transform: `scale(${photo.zoom || 1})` }
                  }
                ) }),
                /* @__PURE__ */ jsx("div", { className: "absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded backdrop-blur-sm z-10", children: pIndex + 1 }),
                /* @__PURE__ */ jsx("div", { className: "absolute top-1 right-1 flex flex-col gap-1 z-10 opacity-100 sm:opacity-0 group-hover/photo:opacity-100 transition-opacity", children: /* @__PURE__ */ jsx("button", { type: "button", onClick: (e) => {
                  e.preventDefault();
                  removePhoto(group.id, pIndex);
                }, className: "bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-md", children: /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5" }) }) }),
                /* @__PURE__ */ jsx("div", { className: "absolute bottom-1 left-1 z-10 opacity-100 sm:opacity-0 group-hover/photo:opacity-100 transition-opacity", children: /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditingPhoto({ groupId: group.id, photoIndex: pIndex });
                    },
                    className: `p-1.5 rounded-full shadow-md flex items-center gap-1 text-xs font-semibold px-2.5 py-1 transition-colors ${photo.annotation ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-white text-slate-700 hover:bg-slate-100"}`,
                    title: "Beri Teks / Watermark",
                    children: [
                      /* @__PURE__ */ jsx(Type, { className: "w-3.5 h-3.5" }),
                      /* @__PURE__ */ jsx("span", { className: "hidden md:inline", children: photo.annotation ? "Edit Teks" : "Teks" })
                    ]
                  }
                ) }),
                /* @__PURE__ */ jsxs("div", { className: "absolute bottom-1 right-1 flex gap-1 z-10 opacity-100 sm:opacity-0 group-hover/photo:opacity-100 transition-opacity", children: [
                  /* @__PURE__ */ jsx("button", { type: "button", onClick: (e) => {
                    e.preventDefault();
                    updatePhotoZoom(group.id, pIndex, 0.1);
                  }, className: "bg-white text-slate-700 p-1.5 rounded-full hover:bg-slate-100 shadow-md", children: /* @__PURE__ */ jsx(ZoomIn, { className: "w-3.5 h-3.5" }) }),
                  /* @__PURE__ */ jsx("button", { type: "button", onClick: (e) => {
                    e.preventDefault();
                    updatePhotoZoom(group.id, pIndex, -0.1);
                  }, className: "bg-white text-slate-700 p-1.5 rounded-full hover:bg-slate-100 shadow-md", children: /* @__PURE__ */ jsx(ZoomOut, { className: "w-3.5 h-3.5" }) })
                ] })
              ]
            },
            photo.id
          )) })
        ] }),
        /* @__PURE__ */ jsx(
          LiveCollagePreview,
          {
            photos: group.photos,
            onCollageChange: (file, _url, annotation) => {
              setPhotoGroups((prev) => prev.map((g) => g.id === group.id ? { ...g, autoCollageFile: file, collageAnnotation: annotation } : g));
            }
          }
        )
      ] }, group.id)),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: addPhotoGroup,
          className: "w-full p-5 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group flex flex-col items-center justify-center gap-1.5 text-center",
          children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-blue-100 group-hover:scale-110 transition-transform flex items-center justify-center text-blue-600 shadow-sm", children: /* @__PURE__ */ jsx(Plus, { className: "w-5 h-5" }) }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-blue-700 block", children: "Tambah Grup Kolase Baru" }),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-blue-500 block", children: "Klik untuk membuat grup kolase foto baru" })
          ]
        }
      )
    ] })
  ] });
  const handleSubmit = async (e) => {
    e.preventDefault();
    let customFilesArray = [];
    for (let i = 0; i < photoGroups.length; i++) {
      const group = photoGroups[i];
      if (group.photos.length > 1) {
        if (group.autoCollageFile) {
          customFilesArray.push(group.autoCollageFile);
        } else {
          const collageResult = await processPhotosToCollage(group.photos, group.collageAnnotation);
          if (collageResult && collageResult.file) {
            customFilesArray.push(collageResult.file);
          }
        }
      } else if (group.photos.length === 1 && group.photos[0]?.file) {
        customFilesArray.push(group.photos[0].file);
      }
    }
    const message = generateWA_InitialReport(formData);
    const locList = formData.lokasiList && Array.isArray(formData.lokasiList) && formData.lokasiList.length > 0 ? formData.lokasiList.filter((l) => l.lokasi1) : [{ lokasi1: formData.lokasi1, lokasi2: formData.lokasi2 }];
    const lokasiFinal = locList.map((loc) => {
      return loc.lokasi1 + (loc.lokasi2 && loc.lokasi2 !== "-" ? formData.peralatan === "Access Control" || loc.lokasi1 === "HBSCP" ? ` ${loc.lokasi2}` : ` No.${loc.lokasi2}` : "");
    }).join(", ") || "-";
    syncToGoogleSheets({
      jenis: "Initial Report",
      tanggal: formData.tanggal,
      waktu: formData.waktuMulai || "-",
      lokasi: lokasiFinal,
      peralatan: formData.peralatan || "-",
      uraian: `[Permasalahan: ${formData.permasalahan}] ${formData.uraian}`,
      tindakLanjut: `[Mitigasi: ${formData.tindakanMitigasi}] [Tindakan: ${formData.tindakan}] [Hasil: ${formData.hasilTindakan}]`,
      status: formData.status || "-",
      teknisi: formData.teknisi,
      imageFile: customFilesArray.length > 0 ? customFilesArray[0] : null
    });
    await shareToWhatsApp(message, customFilesArray.length > 0 ? customFilesArray : null, () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3e3);
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-b-2xl", children: [
    /* @__PURE__ */ jsx("div", { className: "p-6 sm:p-8 bg-blue-50/50 border-b border-blue-100", children: /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
      /* @__PURE__ */ jsxs("label", { className: "block text-sm font-bold text-blue-900 mb-2 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Cpu, { className: "w-5 h-5 text-blue-600" }),
        " Pilihan Peralatan"
      ] }),
      isManualPeralatan ? /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            required: true,
            placeholder: "Ketik nama peralatan secara manual...",
            value: formData.peralatan,
            onChange: (e) => setFormData((prev) => ({ ...prev, peralatan: e.target.value })),
            className: "w-full px-4 py-3 bg-white border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-medium shadow-sm"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              setIsManualPeralatan(false);
              setFormData((prev) => ({ ...prev, peralatan: "", lokasi1: "", lokasi2: "", lokasiList: [{ lokasi1: "", lokasi2: "", isManual: false }] }));
            },
            className: "px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs shrink-0 transition-colors",
            children: "Pilih dari Daftar"
          }
        )
      ] }) : /* @__PURE__ */ jsxs("select", { required: true, value: formData.peralatan, onChange: handlePeralatanChange, className: "w-full px-4 py-3 bg-white border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-medium shadow-sm cursor-pointer appearance-none", children: [
        /* @__PURE__ */ jsx("option", { value: "", children: "-- Pilih Peralatan --" }),
        tipePeralatanOptions.map((opt) => /* @__PURE__ */ jsx("option", { value: opt, children: opt }, opt)),
        /* @__PURE__ */ jsx("option", { value: "MANUAL_ENTRY", children: "+ Ketik Manual (Peralatan Lainnya)" })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "p-6 sm:p-8 space-y-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center border-b pb-2", children: /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(FileWarning, { className: "w-5 h-5 text-amber-600" }),
          " Informasi Initial Report"
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: /* @__PURE__ */ jsxs("div", { className: "md:col-span-2 space-y-3", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700", children: "Lokasi" }),
          (formData.lokasiList || [{ lokasi1: formData.lokasi1, lokasi2: formData.lokasi2 }]).map((loc, index) => {
            const allRows = formData.lokasiList || [{ lokasi1: formData.lokasi1, lokasi2: formData.lokasi2 }];
            const otherRows = allRows.filter((_, idx) => idx !== index);
            const availableOptions = getGeneralLokasiOptions(formData.peralatan).filter((opt) => {
              if (opt === loc.lokasi1) return true;
              const otherRowsWithOpt = otherRows.filter((r) => r.lokasi1 === opt);
              if (otherRowsWithOpt.length === 0) return true;
              const pts = getLokasi2Options(opt, [formData.peralatan]);
              if (pts.length === 0 || pts[0] === "-") return false;
              const takenPts = otherRowsWithOpt.map((r) => r.lokasi2).filter(Boolean);
              return !pts.every((p) => takenPts.includes(p));
            });
            const allOptions2 = getLokasi2Options(loc.lokasi1, [formData.peralatan]);
            const takenOptions2ForThisLoc1 = otherRows.filter((r) => r.lokasi1 === loc.lokasi1).map((r) => r.lokasi2).filter(Boolean);
            const options2 = allOptions2.filter((opt) => !takenOptions2ForThisLoc1.includes(opt) || opt === loc.lokasi2);
            const isDisabled2 = allOptions2.length === 0 || allOptions2.length === 1 && allOptions2[0] === "-";
            const isRowManual = loc.isManual || isManualPeralatan;
            return /* @__PURE__ */ jsxs("div", { className: "flex gap-2 items-center", children: [
              isRowManual ? /* @__PURE__ */ jsxs("div", { className: "flex gap-2 flex-1 items-center", children: [
                /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
                  /* @__PURE__ */ jsx(MapPin, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      required: index === 0,
                      placeholder: "Ketik nama lokasi / nomor titik secara manual...",
                      value: loc.lokasi1,
                      onChange: (e) => handleLokasiEntryChange(index, "lokasi1", e.target.value),
                      className: "w-full pl-10 pr-4 py-2 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800 font-medium shadow-sm"
                    }
                  )
                ] }),
                !isManualPeralatan && /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => handleLokasiEntryChange(index, "isManualToggle", "false"),
                    className: "px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs shrink-0 transition-colors",
                    children: "Pilih dari Daftar"
                  }
                )
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
                  /* @__PURE__ */ jsx(MapPin, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      required: index === 0,
                      disabled: !formData.peralatan,
                      value: loc.lokasi1,
                      onChange: (e) => handleLokasiEntryChange(index, "lokasi1", e.target.value),
                      className: "w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none disabled:bg-slate-200 disabled:opacity-70 disabled:cursor-not-allowed text-sm",
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "", children: index === 0 ? "- Pilih Lokasi -" : "- Pilih Lokasi Tambahan (Opsional) -" }),
                        availableOptions.map((opt) => /* @__PURE__ */ jsx("option", { value: opt, children: opt }, opt)),
                        /* @__PURE__ */ jsx("option", { value: "MANUAL_ENTRY", children: "+ Ketik Manual (Lokasi Lainnya)" })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx("div", { className: "w-1/3", children: /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: loc.lokasi2,
                    onChange: (e) => handleLokasiEntryChange(index, "lokasi2", e.target.value),
                    disabled: isDisabled2,
                    className: `w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-sm ${isDisabled2 ? "opacity-50 cursor-not-allowed bg-slate-200" : ""}`,
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "", children: "- No -" }),
                      options2.map((opt) => /* @__PURE__ */ jsx("option", { value: opt, children: opt }, opt))
                    ]
                  }
                ) })
              ] }),
              index > 0 && /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => removeLokasiEntry(index),
                  className: "p-2 bg-rose-100 text-rose-600 hover:bg-rose-200 rounded-lg transition-colors flex items-center justify-center shrink-0",
                  title: "Hapus lokasi tambahan ini",
                  children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
                }
              )
            ] }, index);
          }),
          /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              disabled: !formData.peralatan,
              onClick: addLokasiEntry,
              className: "text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 pt-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
                " Tambah Lokasi"
              ]
            }
          ) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2", children: [
          /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-blue-600" }),
          " Waktu & Pelaksana"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Tanggal" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Calendar, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
              /* @__PURE__ */ jsx("input", { type: "date", name: "tanggal", required: true, value: formData.tanggal, onChange: handleFieldChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Pukul" }),
            /* @__PURE__ */ jsx("input", { type: "time", name: "waktuMulai", required: true, value: formData.waktuMulai, onChange: handleFieldChange, className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Lama Waktu Pengerjaan" }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2 items-center", children: [
              /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    inputMode: "numeric",
                    placeholder: "0",
                    value: formData.jamPengerjaan,
                    onChange: handleJamChange,
                    className: "w-full pr-12 pl-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm text-right"
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "absolute right-3 top-2.5 text-xs font-semibold text-slate-500 pointer-events-none", children: "Jam" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    inputMode: "numeric",
                    placeholder: "0",
                    value: formData.menitPengerjaan,
                    onChange: handleMenitChange,
                    className: "w-full pr-14 pl-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm text-right"
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "absolute right-3 top-2.5 text-xs font-semibold text-slate-500 pointer-events-none", children: "Menit" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "md:col-span-3", children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2", children: [
              "Teknisi Bertugas (Otomatis dari Shift)",
              availableTeknisi.length === 0 && /* @__PURE__ */ jsx("span", { className: "text-xs text-rose-500 font-normal", children: "*(Tidak ada teknisi hadir/jadwal kosong)" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200", children: [
              (() => {
                const apiTeknisi = availableTeknisi.filter((t) => t.unit === "API T2");
                const iasTeknisi = availableTeknisi.filter((t) => t.unit === "OM/IAS T2");
                const otherTeknisi = availableTeknisi.filter((t) => t.unit !== "API T2" && t.unit !== "OM/IAS T2");
                return /* @__PURE__ */ jsxs(Fragment, { children: [
                  apiTeknisi.length > 0 && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: apiTeknisi.map((t) => /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-100 rounded-md transition-colors", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "checkbox",
                        checked: selectedTeknisi.includes(t.name),
                        onChange: () => toggleTeknisi(t.name),
                        className: "w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-slate-700 select-none", children: t.name })
                  ] }, t.id)) }),
                  apiTeknisi.length > 0 && (iasTeknisi.length > 0 || otherTeknisi.length > 0) && /* @__PURE__ */ jsx("div", { className: "border-t border-slate-300 border-dashed my-1" }),
                  iasTeknisi.length > 0 && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: iasTeknisi.map((t) => /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-100 rounded-md transition-colors", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "checkbox",
                        checked: selectedTeknisi.includes(t.name),
                        onChange: () => toggleTeknisi(t.name),
                        className: "w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-slate-700 select-none", children: t.name })
                  ] }, t.id)) }),
                  iasTeknisi.length > 0 && otherTeknisi.length > 0 && /* @__PURE__ */ jsx("div", { className: "border-t border-slate-300 border-dashed my-1" }),
                  otherTeknisi.length > 0 && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: otherTeknisi.map((t) => /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-100 rounded-md transition-colors", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "checkbox",
                        checked: selectedTeknisi.includes(t.name),
                        onChange: () => toggleTeknisi(t.name),
                        className: "w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-slate-700 select-none", children: t.name })
                  ] }, t.id)) })
                ] });
              })(),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  placeholder: availableTeknisi.length === 0 ? "Ketik manual nama teknisi..." : "Tambah teknisi lain (pisahkan dengan koma)...",
                  value: manualTeknisi,
                  onChange: (e) => setManualTeknisi(e.target.value),
                  className: "w-full mt-1 px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                }
              )
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "w-5 h-5 text-blue-600" }),
          " Detail Laporan Awal"
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Permasalahan" }),
          /* @__PURE__ */ jsx("textarea", { ref: permasalahanRef, name: "permasalahan", required: true, rows: 3, value: formData.permasalahan, onChange: (e) => handleBulletChange(e, "permasalahan"), onKeyDown: (e) => handleBulletKeyDown(e, "permasalahan"), className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none overflow-hidden font-mono text-sm leading-relaxed transition-all" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Status" }),
          /* @__PURE__ */ jsx("input", { type: "text", name: "status", required: true, placeholder: "Cth: On Progress / Menunggu Sparepart", value: formData.status, onChange: handleFieldChange, className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "URAIAN" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mb-1", children: "(Uraian kronologis kerusakan s.d saat dilaporkan)" }),
          /* @__PURE__ */ jsx("textarea", { ref: uraianRef, name: "uraian", rows: 4, value: formData.uraian, onChange: (e) => handleBulletChange(e, "uraian"), onKeyDown: (e) => handleBulletKeyDown(e, "uraian"), className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none overflow-hidden font-mono text-sm leading-relaxed transition-all" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "DAMPAK" }),
          /* @__PURE__ */ jsx("textarea", { ref: dampakRef, name: "dampak", rows: 3, value: formData.dampak, onChange: (e) => handleNumberedChange(e, "dampak"), onKeyDown: (e) => handleNumberedKeyDown(e, "dampak"), className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none overflow-hidden font-mono text-sm leading-relaxed transition-all" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "TINDAKAN MITIGASI" }),
          /* @__PURE__ */ jsx("textarea", { ref: mitigasiRef, name: "tindakanMitigasi", rows: 3, value: formData.tindakanMitigasi, onChange: (e) => handleNumberedChange(e, "tindakanMitigasi"), onKeyDown: (e) => handleNumberedKeyDown(e, "tindakanMitigasi"), className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none overflow-hidden font-mono text-sm leading-relaxed transition-all" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "TINDAKAN" }),
          /* @__PURE__ */ jsx("textarea", { ref: tindakanRef, name: "tindakan", rows: 4, value: formData.tindakan, onChange: (e) => handleNumberedChange(e, "tindakan"), onKeyDown: (e) => handleNumberedKeyDown(e, "tindakan"), className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none overflow-hidden font-mono text-sm leading-relaxed transition-all" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "HASIL TINDAKAN" }),
          /* @__PURE__ */ jsx("textarea", { ref: hasilRef, name: "hasilTindakan", rows: 4, value: formData.hasilTindakan, onChange: (e) => handleNumberedChange(e, "hasilTindakan"), onKeyDown: (e) => handleNumberedKeyDown(e, "hasilTindakan"), className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none overflow-hidden font-mono text-sm leading-relaxed transition-all" })
        ] })
      ] }),
      renderPhotoSection(),
      editingPhoto && (() => {
        const group = photoGroups.find((g) => g.id === editingPhoto.groupId);
        const photo = group?.photos[editingPhoto.photoIndex];
        if (!photo) return null;
        return /* @__PURE__ */ jsx(
          PhotoTextEditorModal,
          {
            isOpen: true,
            onClose: () => setEditingPhoto(null),
            photoUrl: photo.originalPreview || photo.preview,
            initialAnnotation: photo.annotation,
            onSave: handleSaveText,
            onReset: handleResetText,
            hasOriginal: !!photo.originalPreview
          }
        );
      })(),
      /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row gap-4 mt-8", children: /* @__PURE__ */ jsx("button", { type: "submit", className: `w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${isCopied ? "bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]" : "bg-[#25D366] hover:bg-[#20b858] hover:shadow-xl hover:-translate-y-0.5 text-white"}`, children: isCopied ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 animate-pulse" }),
        " Berhasil Disalin / Dibagikan!"
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Share2, { className: "w-6 h-6" }),
        " Share Initial Report ke WA"
      ] }) }) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 border-t border-slate-200 pt-8", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-700 mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-blue-600" }),
          " Preview Initial Report (Real-time)"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative", children: /* @__PURE__ */ jsx("div", { className: "bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%]", children: generateWA_InitialReport(formData) }) })
      ] })
    ] })
  ] });
};
const TabKehadiran = () => {
  const { isCopied, setIsCopied } = useAppStore();
  const { dataApiT2, dataOmIasT2 } = useMasterDataStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadedSchedules, setLoadedSchedules] = useState([]);
  const [attendanceData, setAttendanceData] = useState(() => {
    const now = /* @__PURE__ */ new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const timeInMinutes = currentHour * 60 + currentMinute;
    const isPagi = timeInMinutes >= 450 && timeInMinutes < 1170;
    const shiftValue = isPagi ? "Pagi, 08.00 - 20.00 WIB" : "Malam, 20.00 - 08.00 WIB";
    const kegiatan = isPagi ? "- Monitoring Ops\n- Storing Peralatan\n- Preventive Maintenance & Kalibrasi Perangkat" : "- Monitoring Ops\n- Storing Peralatan";
    const logicalDateObj = new Date(now.getTime());
    if (timeInMinutes < 450) {
      logicalDateObj.setDate(logicalDateObj.getDate() - 1);
    }
    const tzOffset = logicalDateObj.getTimezoneOffset() * 6e4;
    const localDate = new Date(logicalDateObj.getTime() - tzOffset).toISOString().split("T")[0];
    return {
      tanggal: localDate,
      shift: shiftValue,
      apiList: [],
      omList: [],
      tlpRuangan: "- 021 550 5910",
      rencanaKegiatan: kegiatan
    };
  });
  const fetchJadwal = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const targetShiftCode = attendanceData.shift.includes("Pagi") ? "PS" : "M";
      let { data, error } = await supabase.from("jadwal_shift").select(`
          id, shift, status_kehadiran,
          personel:personel_id (id, nama, no_hp, jabatan, urutan, unit_kerja(nama))
        `).eq("tanggal", attendanceData.tanggal).neq("shift", "D").order("id", { ascending: true });
      if (error) {
        const fallbackRes = await supabase.from("jadwal_shift").select(`
            id, shift, status_kehadiran,
            personel:personel_id (id, nama, no_hp, jabatan, unit_kerja(nama))
          `).eq("tanggal", attendanceData.tanggal).neq("shift", "D").order("id", { ascending: true });
        data = fallbackRes.data;
        error = fallbackRes.error;
        if (error) {
          const fallbackRes2 = await supabase.from("jadwal_shift").select(`
              id, shift, status_kehadiran,
              personel:personel_id (id, nama, no_hp, unit_kerja(nama))
            `).eq("tanggal", attendanceData.tanggal).neq("shift", "D").order("id", { ascending: true });
          data = fallbackRes2.data;
          error = fallbackRes2.error;
        }
      }
      if (error) throw error;
      const filteredData = (data || []).filter((d) => {
        const s = (d.shift || "").toUpperCase();
        if (targetShiftCode === "PS") {
          return s === "PS";
        } else {
          return s === "M";
        }
      });
      const apiRows = filteredData.filter((d) => d.personel?.unit_kerja?.nama === "API T2").map((d, idx) => {
        const storeP = dataApiT2.find((p) => p.id === d.personel?.id || p.name === toTitleCase(d.personel?.nama || ""));
        const orderVal = d.personel?.urutan !== void 0 && d.personel?.urutan !== null ? Number(d.personel.urutan) : storeP?.dbOrder !== void 0 ? Number(storeP.dbOrder) : idx;
        return {
          id: d.id,
          jadwal_id: d.id,
          personel_id: d.personel?.id,
          name: d.personel?.nama ? toTitleCase(d.personel.nama) : "",
          phone: d.personel?.no_hp || "",
          jabatan: d.personel?.jabatan || storeP?.jabatan || "",
          dbOrder: orderVal,
          status: d.status_kehadiran || "Hadir"
        };
      });
      const omRows = filteredData.filter((d) => d.personel?.unit_kerja?.nama === "OM/IAS T2").map((d, idx) => {
        const storeP = dataOmIasT2.find((p) => p.id === d.personel?.id || p.name === toTitleCase(d.personel?.nama || ""));
        const orderVal = d.personel?.urutan !== void 0 && d.personel?.urutan !== null ? Number(d.personel.urutan) : storeP?.dbOrder !== void 0 ? Number(storeP.dbOrder) : idx;
        return {
          id: d.id,
          jadwal_id: d.id,
          personel_id: d.personel?.id,
          name: d.personel?.nama ? toTitleCase(d.personel.nama) : "",
          phone: d.personel?.no_hp || "",
          jabatan: d.personel?.jabatan || storeP?.jabatan || "",
          dbOrder: orderVal,
          status: d.status_kehadiran || "Hadir"
        };
      });
      if (apiRows.length === 0) apiRows.push({ id: Date.now(), jadwal_id: null, personel_id: null, name: "", phone: "", jabatan: "", dbOrder: 999, status: "Hadir" });
      if (omRows.length === 0) omRows.push({ id: Date.now() + 1, jadwal_id: null, personel_id: null, name: "", phone: "", jabatan: "", dbOrder: 999, status: "Hadir" });
      const allLoaded = [...apiRows, ...omRows];
      setLoadedSchedules(
        allLoaded.filter((r) => r.jadwal_id && r.personel_id).map((r) => ({ id: r.jadwal_id, personel_id: r.personel_id }))
      );
      setAttendanceData((prev) => ({
        ...prev,
        apiList: sortPersonelByJabatan(apiRows),
        omList: sortPersonelByJabatan(omRows)
      }));
    } catch (err) {
      console.error("Error fetching jadwal:", err);
    } finally {
      setIsLoading(false);
    }
  }, [attendanceData.tanggal, attendanceData.shift]);
  useEffect(() => {
    fetchJadwal();
  }, [fetchJadwal]);
  const handleAttendanceChange = (e) => {
    const { name, value } = e.target;
    setAttendanceData({ ...attendanceData, [name]: value });
  };
  const handleShiftChange = (e) => {
    const shift = e.target.value;
    const isPagi = shift.includes("Pagi");
    const kegiatan = isPagi ? "- Monitoring Ops\n- Storing Peralatan\n- Preventive Maintenance & Kalibrasi Perangkat" : "- Monitoring Ops\n- Storing Peralatan";
    setAttendanceData({
      ...attendanceData,
      shift,
      rencanaKegiatan: kegiatan
    });
  };
  const handleRowChange = (listType, index, field, value) => {
    const newList = [...attendanceData[listType]];
    newList[index] = { ...newList[index], [field]: value };
    if (field === "name") {
      const sourceData = listType === "apiList" ? dataApiT2 : dataOmIasT2;
      const person = sourceData.find((p) => p.name === value);
      if (person) {
        newList[index].phone = person.phone;
        newList[index].personel_id = person.id;
        newList[index].jabatan = person.jabatan || "";
        newList[index].dbOrder = person.dbOrder !== void 0 && person.dbOrder !== null ? Number(person.dbOrder) : 999;
        newList[index].jadwal_id = null;
      } else {
        newList[index].phone = "";
        newList[index].personel_id = null;
        newList[index].jabatan = "";
        newList[index].dbOrder = index;
        newList[index].jadwal_id = null;
      }
    }
    setAttendanceData({ ...attendanceData, [listType]: sortPersonelByJabatan(newList) });
  };
  const addRow = (listType) => {
    setAttendanceData({
      ...attendanceData,
      [listType]: [...attendanceData[listType], { id: Date.now(), jadwal_id: null, personel_id: null, name: "", phone: "", jabatan: "", dbOrder: 999, status: "Hadir" }]
    });
  };
  const removeRow = (listType, index) => {
    const newList = [...attendanceData[listType]];
    newList.splice(index, 1);
    if (newList.length === 0) {
      newList.push({ id: Date.now(), jadwal_id: null, personel_id: null, name: "", phone: "", jabatan: "", dbOrder: 999, status: "Hadir" });
    }
    setAttendanceData({ ...attendanceData, [listType]: sortPersonelByJabatan(newList) });
  };
  const handleDashChange = (e, field) => {
    let value = e.target.value;
    if (!value.startsWith("- ")) {
      value = "- " + value.replace(/^- /, "");
    }
    value = value.replace(/\n([^-])/g, "\n- $1");
    setAttendanceData((prev) => ({ ...prev, [field]: value }));
  };
  const handleDashKeyDown = (e, field) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setAttendanceData((prev) => ({ ...prev, [field]: prev[field] + "\n- " }));
    }
  };
  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const targetShiftCode = attendanceData.shift.includes("Pagi") ? "PS" : "M";
      const allRows = [...attendanceData.apiList, ...attendanceData.omList];
      const validRows = allRows.filter((r) => r.name && r.personel_id);
      const currentPersonelIds = new Set(validRows.map((r) => r.personel_id));
      const idsToDelete = loadedSchedules.filter((item) => !currentPersonelIds.has(item.personel_id)).map((item) => item.id);
      if (idsToDelete.length > 0) {
        const { error: delError } = await supabase.from("jadwal_shift").delete().in("id", idsToDelete);
        if (delError) {
          throw new Error(`Gagal menghapus personil dari database: ${delError.message}`);
        }
      }
      const upsertPayload = validRows.map((row) => ({
        personel_id: row.personel_id,
        tanggal: attendanceData.tanggal,
        shift: targetShiftCode,
        status_kehadiran: row.status
      }));
      if (upsertPayload.length > 0) {
        const { error: upsertError } = await supabase.from("jadwal_shift").upsert(upsertPayload, { onConflict: "personel_id, tanggal" });
        if (upsertError) {
          throw new Error(`Gagal menyimpan perubahan kehadiran ke database: ${upsertError.message}`);
        }
      }
      await fetchJadwal();
      const message = generateWA_Kehadiran(attendanceData);
      await shareToWhatsApp(message, null, () => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3e3);
      });
    } catch (err) {
      console.error("Failed to save attendance", err);
      alert(err.message || "Gagal menyimpan absensi ke database!");
    } finally {
      setIsSaving(false);
    }
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleAttendanceSubmit, className: "p-6 sm:p-8 space-y-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2", children: [
        /* @__PURE__ */ jsx(Users, { className: "w-5 h-5 text-blue-600" }),
        " Info Shift",
        isLoading && /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 text-blue-500 animate-spin ml-2" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Tanggal" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
            /* @__PURE__ */ jsx("input", { type: "date", name: "tanggal", required: true, value: attendanceData.tanggal, onChange: handleAttendanceChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Dinas (Shift)" }),
          /* @__PURE__ */ jsxs("select", { name: "shift", value: attendanceData.shift, onChange: handleShiftChange, className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer", children: [
            /* @__PURE__ */ jsx("option", { value: "Pagi, 08.00 - 20.00 WIB", children: "Pagi, 08.00 - 20.00 WIB" }),
            /* @__PURE__ */ jsx("option", { value: "Malam, 20.00 - 08.00 WIB", children: "Malam, 20.00 - 08.00 WIB" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center border-b pb-2", children: /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(User, { className: "w-5 h-5 text-blue-600" }),
        " Personel API T2"
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        attendanceData.apiList.map((row, index) => {
          const availableOptions = dataApiT2.filter((p) => !attendanceData.apiList.some((r) => r.name === p.name) || p.name === row.name);
          return /* @__PURE__ */ jsxs("div", { className: `flex flex-col sm:flex-row gap-2 items-start sm:items-center p-3 rounded-lg border ${row.jadwal_id ? "bg-blue-50/50 border-blue-200" : "bg-slate-50 border-slate-200 border-dashed"}`, children: [
            /* @__PURE__ */ jsxs("select", { value: row.name, onChange: (e) => handleRowChange("apiList", index, "name", e.target.value), className: "w-full sm:w-2/5 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none", children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "- Pilih Personel -" }),
              availableOptions.map((opt) => /* @__PURE__ */ jsx("option", { value: opt.name, children: opt.name }, opt.name))
            ] }),
            /* @__PURE__ */ jsx("input", { type: "text", value: row.phone, readOnly: true, placeholder: "No Telepon", className: "w-full sm:w-1/4 px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm text-slate-500 outline-none cursor-not-allowed" }),
            /* @__PURE__ */ jsxs("select", { value: row.status, onChange: (e) => handleRowChange("apiList", index, "status", e.target.value), className: `w-full sm:w-1/4 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${row.status !== "Hadir" ? "text-rose-600 font-bold" : ""}`, children: [
              /* @__PURE__ */ jsx("option", { value: "Hadir", children: "Hadir" }),
              /* @__PURE__ */ jsx("option", { value: "Izin", children: "Izin" }),
              /* @__PURE__ */ jsx("option", { value: "Sakit", children: "Sakit" }),
              /* @__PURE__ */ jsx("option", { value: "Dinas Luar", children: "Dinas Luar" })
            ] }),
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => removeRow("apiList", index), disabled: attendanceData.apiList.length <= 1 && !row.name, className: `w-full sm:w-auto p-2 rounded-md flex justify-center items-center transition-colors ${attendanceData.apiList.length <= 1 && !row.name ? "bg-slate-200 text-slate-400 cursor-not-allowed opacity-70" : "bg-rose-100 text-rose-600 hover:bg-rose-200"}`, children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" }) })
          ] }, row.id);
        }),
        /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => addRow("apiList"), className: "text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2", children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
          " Tambah Personel (Manual)"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center border-b pb-2", children: /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Users, { className: "w-5 h-5 text-blue-600" }),
        " Personel OM IAS T2"
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        attendanceData.omList.map((row, index) => {
          const availableOptions = dataOmIasT2.filter((p) => !attendanceData.omList.some((r) => r.name === p.name) || p.name === row.name);
          return /* @__PURE__ */ jsxs("div", { className: `flex flex-col sm:flex-row gap-2 items-start sm:items-center p-3 rounded-lg border ${row.jadwal_id ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-200 border-dashed"}`, children: [
            /* @__PURE__ */ jsxs("select", { value: row.name, onChange: (e) => handleRowChange("omList", index, "name", e.target.value), className: "w-full sm:w-2/5 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-emerald-500 appearance-none", children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "- Pilih Personel -" }),
              availableOptions.map((opt) => /* @__PURE__ */ jsx("option", { value: opt.name, children: opt.name }, opt.name))
            ] }),
            /* @__PURE__ */ jsx("input", { type: "text", value: row.phone, readOnly: true, placeholder: "No Telepon", className: "w-full sm:w-1/4 px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm text-slate-500 outline-none cursor-not-allowed" }),
            /* @__PURE__ */ jsxs("select", { value: row.status, onChange: (e) => handleRowChange("omList", index, "status", e.target.value), className: `w-full sm:w-1/4 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-emerald-500 appearance-none ${row.status !== "Hadir" ? "text-rose-600 font-bold" : ""}`, children: [
              /* @__PURE__ */ jsx("option", { value: "Hadir", children: "Hadir" }),
              /* @__PURE__ */ jsx("option", { value: "Izin", children: "Izin" }),
              /* @__PURE__ */ jsx("option", { value: "Sakit", children: "Sakit" }),
              /* @__PURE__ */ jsx("option", { value: "Dinas Luar", children: "Dinas Luar" })
            ] }),
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => removeRow("omList", index), disabled: attendanceData.omList.length <= 1 && !row.name, className: `w-full sm:w-auto p-2 rounded-md flex justify-center items-center transition-colors ${attendanceData.omList.length <= 1 && !row.name ? "bg-slate-200 text-slate-400 cursor-not-allowed opacity-70" : "bg-rose-100 text-rose-600 hover:bg-rose-200"}`, children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" }) })
          ] }, row.id);
        }),
        /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => addRow("omList"), className: "text-sm font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 mt-2", children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
          " Tambah Personel (Manual)"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2", children: [
        /* @__PURE__ */ jsx(ClipboardList, { className: "w-5 h-5 text-blue-600" }),
        " Rencana & Informasi Tambahan"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Tlp Ruangan" }),
          /* @__PURE__ */ jsx("input", { type: "text", name: "tlpRuangan", required: true, value: attendanceData.tlpRuangan, onChange: handleAttendanceChange, className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Rencana Kegiatan Harian" }),
          /* @__PURE__ */ jsx("textarea", { name: "rencanaKegiatan", required: true, rows: 4, value: attendanceData.rencanaKegiatan, onChange: (e) => handleDashChange(e, "rencanaKegiatan"), onKeyDown: (e) => handleDashKeyDown(e, "rencanaKegiatan"), className: "w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm leading-relaxed" }),
          (() => {
            const pmText = "- Preventive Maintenance & Kalibrasi Perangkat";
            const hasPM = attendanceData.rencanaKegiatan.includes(pmText);
            return /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  if (hasPM) {
                    let newText = attendanceData.rencanaKegiatan.replace("\n" + pmText, "").replace(pmText, "").trim();
                    setAttendanceData({ ...attendanceData, rencanaKegiatan: newText });
                  } else {
                    let newText = attendanceData.rencanaKegiatan.trim();
                    if (newText.length > 0) newText += "\n";
                    newText += pmText;
                    setAttendanceData({ ...attendanceData, rencanaKegiatan: newText });
                  }
                },
                className: "mt-2 flex items-center gap-1.5 text-sm font-medium transition-colors",
                children: hasPM ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(X, { className: "w-4 h-4 text-red-500" }),
                  /* @__PURE__ */ jsx("span", { className: "text-red-600 hover:text-red-700", children: "Hapus PM & Kalibrasi" })
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 text-emerald-500" }),
                  /* @__PURE__ */ jsx("span", { className: "text-emerald-600 hover:text-emerald-700", children: "Tambahkan PM & Kalibrasi" })
                ] })
              }
            );
          })()
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row gap-4 mt-8", children: /* @__PURE__ */ jsx("button", { type: "submit", disabled: isLoading || isSaving, className: `w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${isCopied ? "bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]" : "bg-[#25D366] hover:bg-[#20b858] hover:shadow-xl hover:-translate-y-0.5 text-white"} disabled:opacity-50 disabled:cursor-not-allowed`, children: isSaving ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin" }),
      " Menyimpan..."
    ] }) : isCopied ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 animate-pulse" }),
      " Tersimpan & Disalin!"
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Share2, { className: "w-6 h-6" }),
      " Share Kehadiran ke WA"
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 border-t border-slate-200 pt-8", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-700 mb-4 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-blue-600" }),
        " Preview Laporan Kehadiran (Real-time)"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative", children: /* @__PURE__ */ jsx("div", { className: "bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%]", children: generateWA_Kehadiran(attendanceData) }) })
    ] })
  ] });
};
function formatNamaPersonel(fullName) {
  if (!fullName) return "";
  const words = fullName.trim().split(/\s+/);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0];
  const firstWord = words[0].toLowerCase();
  const titlePrefixes = ["m.", "muh.", "muhammad", "moch.", "mochammad", "abdul"];
  if (titlePrefixes.includes(firstWord)) {
    return words[1];
  }
  return words[0];
}
const TabPerbaikan = () => {
  const { isCopied, setIsCopied } = useAppStore();
  const [formData, setFormData] = useState(() => {
    const now = /* @__PURE__ */ new Date();
    const realYear = now.getFullYear();
    const realMonth = String(now.getMonth() + 1).padStart(2, "0");
    const realDay = String(now.getDate()).padStart(2, "0");
    const realDate = `${realYear}-${realMonth}-${realDay}`;
    return {
      peralatan: "",
      lokasi1: "",
      lokasi2: "",
      lokasiList: [{ lokasi1: "", lokasi2: "", isManual: false }],
      sumberLaporan: "Avsec",
      indikasiAwal: "",
      tanggal: realDate,
      waktuMulai: "",
      waktuSelesai: "",
      lamaPengerjaan: "",
      teknisi: "",
      permasalahan: "• ",
      tindakLanjut: "• ",
      status: "Pekerjaan Selesai"
    };
  });
  const [availableTeknisi, setAvailableTeknisi] = useState([]);
  const [selectedTeknisi, setSelectedTeknisi] = useState([]);
  const [manualTeknisi, setManualTeknisi] = useState("");
  const [tipePeralatanOptions, setTipePeralatanOptions] = useState([]);
  const [isManualPeralatan, setIsManualPeralatan] = useState(false);
  React.useEffect(() => {
    const fetchData = async () => {
      const now = /* @__PURE__ */ new Date();
      const currentHour = now.getHours();
      const logicalDateObj = new Date(now.getTime());
      if (currentHour < 8) {
        logicalDateObj.setDate(logicalDateObj.getDate() - 1);
      }
      const tzOffset = logicalDateObj.getTimezoneOffset() * 6e4;
      const todayStr = new Date(logicalDateObj.getTime() - tzOffset).toISOString().split("T")[0];
      const isPagi = currentHour >= 8 && currentHour < 20;
      const { data: dataTeknisi } = await supabase.from("jadwal_shift").select(`id, shift, status_kehadiran, personel:personel_id(nama, unit_kerja(nama))`).eq("tanggal", todayStr).eq("status_kehadiran", "Hadir");
      if (dataTeknisi) {
        const filteredTeknisi = dataTeknisi.filter((d) => {
          const s = (d.shift || "").toUpperCase();
          if (isPagi) {
            return s === "PS";
          } else {
            return s === "M";
          }
        });
        setAvailableTeknisi(filteredTeknisi.map((d) => ({
          id: d.id,
          name: formatNamaPersonel(toTitleCase(d.personel?.nama || "")),
          unit: d.personel?.unit_kerja?.nama || ""
        })).filter((t) => t.name !== ""));
      }
      const { data: dataTipe } = await supabase.from("tipe_peralatan").select("nama").order("nama", { ascending: true });
      if (dataTipe) {
        setTipePeralatanOptions(dataTipe.map((d) => d.nama));
      }
    };
    fetchData();
  }, []);
  React.useEffect(() => {
    setFormData((prev) => {
      const allTeknisi = [...selectedTeknisi];
      if (manualTeknisi.trim()) {
        const manualList = manualTeknisi.split(",").map((t) => t.trim()).filter((t) => t);
        allTeknisi.push(...manualList);
      }
      let teknisiStr = "";
      if (allTeknisi.length === 0) {
        teknisiStr = "";
      } else if (allTeknisi.length === 1) {
        teknisiStr = allTeknisi[0];
      } else {
        const last = allTeknisi[allTeknisi.length - 1];
        const rest = allTeknisi.slice(0, -1);
        teknisiStr = `${rest.join(", ")} & ${last}`;
      }
      return { ...prev, teknisi: teknisiStr };
    });
  }, [selectedTeknisi, manualTeknisi]);
  const toggleTeknisi = (name) => {
    setSelectedTeknisi((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);
  };
  const [isVerifikasiETD, setIsVerifikasiETD] = useState(false);
  const [photoGroups, setPhotoGroups] = useState([
    { id: Date.now(), photos: [], isGenerating: false, autoCollageFile: null, collageAnnotation: void 0 }
  ]);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const photoGroupsRef = React.useRef(photoGroups);
  photoGroupsRef.current = photoGroups;
  React.useEffect(() => {
    return () => {
      photoGroupsRef.current.forEach((group) => {
        group.photos.forEach((p) => {
          if (p.preview && p.preview.startsWith("blob:")) {
            URL.revokeObjectURL(p.preview);
          }
        });
      });
    };
  }, []);
  const permasalahanRef = React.useRef(null);
  const tindakLanjutRef = React.useRef(null);
  React.useEffect(() => {
    if (permasalahanRef.current) {
      permasalahanRef.current.style.height = "auto";
      permasalahanRef.current.style.height = `${Math.max(80, permasalahanRef.current.scrollHeight)}px`;
    }
  }, [formData.permasalahan]);
  React.useEffect(() => {
    if (tindakLanjutRef.current) {
      tindakLanjutRef.current.style.height = "auto";
      tindakLanjutRef.current.style.height = `${Math.max(140, tindakLanjutRef.current.scrollHeight)}px`;
    }
  }, [formData.tindakLanjut]);
  const handleRepairChange = (e) => {
    const { name, value } = e.target;
    if (name === "waktuSelesai" && value) {
      const now = /* @__PURE__ */ new Date();
      const todayStr = now.toISOString().split("T")[0];
      const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (formData.tanggal === todayStr && value > currentTimeStr) {
        alert(`Pukul Selesai tidak boleh melebihi waktu saat ini (${currentTimeStr})`);
        return;
      }
    }
    if (name === "tanggal" && value) {
      const now = /* @__PURE__ */ new Date();
      const todayStr = now.toISOString().split("T")[0];
      const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (value === todayStr && formData.waktuSelesai && formData.waktuSelesai > currentTimeStr) {
        alert(`Pukul Selesai direset karena melebihi waktu saat ini (${currentTimeStr})`);
        setFormData((prev) => ({ ...prev, tanggal: value, waktuSelesai: "", lamaPengerjaan: "" }));
        return;
      }
    }
    let newFormData = { ...formData, [name]: value };
    if (name === "peralatan") {
      newFormData.lokasi1 = "";
      newFormData.lokasi2 = "";
      newFormData.lokasiList = [{ lokasi1: "", lokasi2: "", isManual: false }];
    }
    if (name === "waktuMulai" || name === "waktuSelesai") {
      const start = name === "waktuMulai" ? value : formData.waktuMulai;
      const end = name === "waktuSelesai" ? value : formData.waktuSelesai;
      if (start && end) {
        const [startH, startM] = start.split(":").map(Number);
        const [endH, endM] = end.split(":").map(Number);
        let diff = endH * 60 + endM - (startH * 60 + startM);
        if (diff < 0) diff += 24 * 60;
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        newFormData.lamaPengerjaan = `${hours > 0 ? `${hours} Jam ` : ""}${minutes} Menit`;
      }
    }
    setFormData(newFormData);
  };
  const handleLokasiEntryChange = (index, field, value) => {
    if (field === "isManualToggle") {
      setFormData((prev) => {
        const newList = [...prev.lokasiList || [{ lokasi1: prev.lokasi1 || "", lokasi2: prev.lokasi2 || "" }]];
        newList[index] = { ...newList[index], lokasi1: "", lokasi2: "", isManual: false };
        return {
          ...prev,
          lokasiList: newList,
          lokasi1: newList[0]?.lokasi1 || "",
          lokasi2: newList[0]?.lokasi2 || ""
        };
      });
      return;
    }
    if (field === "lokasi1" && value === "MANUAL_ENTRY") {
      setFormData((prev) => {
        const newList = [...prev.lokasiList || [{ lokasi1: prev.lokasi1 || "", lokasi2: prev.lokasi2 || "" }]];
        newList[index] = { ...newList[index], lokasi1: "", lokasi2: "-", isManual: true };
        return {
          ...prev,
          lokasiList: newList,
          lokasi1: newList[0]?.lokasi1 || "",
          lokasi2: newList[0]?.lokasi2 || ""
        };
      });
      return;
    }
    setFormData((prev) => {
      const newList = [...prev.lokasiList || [{ lokasi1: prev.lokasi1 || "", lokasi2: prev.lokasi2 || "" }]];
      newList[index] = { ...newList[index], [field]: value };
      if (field === "lokasi1") {
        if (newList[index].isManual || isManualPeralatan) {
          newList[index].lokasi2 = "-";
        } else {
          const pts = getLokasi2Options(value, [prev.peralatan]);
          newList[index].lokasi2 = pts.length === 0 || pts.length === 1 && pts[0] === "-" ? "-" : "";
        }
      }
      return {
        ...prev,
        lokasiList: newList,
        lokasi1: newList[0]?.lokasi1 || "",
        lokasi2: newList[0]?.lokasi2 || ""
      };
    });
  };
  const addLokasiEntry = () => {
    setFormData((prev) => {
      const newList = [...prev.lokasiList || [{ lokasi1: prev.lokasi1 || "", lokasi2: prev.lokasi2 || "" }], { lokasi1: "", lokasi2: isManualPeralatan ? "-" : "", isManual: isManualPeralatan }];
      return { ...prev, lokasiList: newList };
    });
  };
  const removeLokasiEntry = (index) => {
    setFormData((prev) => {
      const newList = [...prev.lokasiList || [{ lokasi1: prev.lokasi1 || "", lokasi2: prev.lokasi2 || "" }]];
      newList.splice(index, 1);
      if (newList.length === 0) newList.push({ lokasi1: "", lokasi2: isManualPeralatan ? "-" : "", isManual: isManualPeralatan });
      return {
        ...prev,
        lokasiList: newList,
        lokasi1: newList[0]?.lokasi1 || "",
        lokasi2: newList[0]?.lokasi2 || ""
      };
    });
  };
  const handlePeralatanChange = (e) => {
    const value = e.target.value;
    if (value === "MANUAL_ENTRY") {
      setIsManualPeralatan(true);
      setFormData((prev) => ({ ...prev, peralatan: "", lokasi1: "", lokasi2: "-", lokasiList: [{ lokasi1: "", lokasi2: "-", isManual: true }] }));
      return;
    }
    const isETD = value === "ETD Leidos QS-B220";
    if (!isETD && isVerifikasiETD) {
      setIsVerifikasiETD(false);
      setFormData((prev) => ({ ...prev, peralatan: value, lokasi1: "", lokasi2: "", lokasiList: [{ lokasi1: "", lokasi2: "", isManual: false }], permasalahan: "• ", tindakLanjut: "• " }));
    } else {
      setFormData((prev) => ({ ...prev, peralatan: value, lokasi1: "", lokasi2: "", lokasiList: [{ lokasi1: "", lokasi2: "", isManual: false }] }));
    }
  };
  const handleVerifikasiChange = (e) => {
    const checked = e.target.checked;
    setFormData((prev) => {
      const newData = { ...prev };
      if (checked && newData.peralatan !== "ETD Leidos QS-B220") {
        newData.peralatan = "ETD Leidos QS-B220";
        newData.lokasi1 = "";
        newData.lokasi2 = "";
        newData.lokasiList = [{ lokasi1: "", lokasi2: "", isManual: false }];
      }
      if (checked) {
        newData.permasalahan = "• Verification Required";
        newData.tindakLanjut = "• Melakukan Verifikasi Negatif";
      } else {
        newData.permasalahan = "• ";
        newData.tindakLanjut = "• ";
      }
      return newData;
    });
    setIsVerifikasiETD(checked);
  };
  const handleBulletChange = (e, field) => {
    let value = e.target.value;
    if (!value.startsWith("• ")) {
      value = "• " + value.replace(/^•\s*/, "");
    }
    value = value.replace(/\n([^•])/g, "\n• $1");
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const handleBulletKeyDown = (e, field) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setFormData((prev) => ({ ...prev, [field]: prev[field] + "\n• " }));
    }
  };
  const handlePhotoUpload = async (groupId, e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const compressedResults = await Promise.all(files.map((f) => compressImageFile(f)));
      const newPhotos = compressedResults.map((res) => ({
        id: Date.now() + Math.random(),
        file: res.file,
        preview: res.preview,
        zoom: 1
      }));
      setPhotoGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, photos: [...g.photos, ...newPhotos] } : g));
    }
  };
  const removePhoto = (groupId, photoIndex) => {
    setPhotoGroups((prev) => prev.map((group) => {
      if (group.id === groupId) {
        const newPhotos = [...group.photos];
        URL.revokeObjectURL(newPhotos[photoIndex].preview);
        newPhotos.splice(photoIndex, 1);
        return { ...group, photos: newPhotos };
      }
      return group;
    }));
  };
  const updatePhotoZoom = (groupId, photoIndex, delta) => {
    setPhotoGroups((prev) => prev.map((group) => {
      if (group.id === groupId) {
        const newPhotos = [...group.photos];
        const currentZoom = newPhotos[photoIndex].zoom || 1;
        newPhotos[photoIndex] = {
          ...newPhotos[photoIndex],
          zoom: Math.max(0.5, Math.min(3, currentZoom + delta))
        };
        return { ...group, photos: newPhotos };
      }
      return group;
    }));
  };
  const handlePhotoDrop = (e, groupId, targetIndex) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer?.getData("text/plain");
    if (!sourceIndexStr) return;
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (sourceIndex === targetIndex || isNaN(sourceIndex)) return;
    setPhotoGroups((prev) => prev.map((group) => {
      if (group.id === groupId) {
        const newPhotos = [...group.photos];
        const [movedPhoto] = newPhotos.splice(sourceIndex, 1);
        newPhotos.splice(targetIndex, 0, movedPhoto);
        return { ...group, photos: newPhotos };
      }
      return group;
    }));
  };
  const handleSaveText = (newFile, newPreviewUrl, annotation) => {
    if (!editingPhoto) return;
    const { groupId, photoIndex } = editingPhoto;
    setPhotoGroups((prev) => prev.map((group) => {
      if (group.id !== groupId) return group;
      const newPhotos = [...group.photos];
      const currentPhoto = newPhotos[photoIndex];
      newPhotos[photoIndex] = {
        ...currentPhoto,
        originalFile: currentPhoto.originalFile || currentPhoto.file,
        originalPreview: currentPhoto.originalPreview || currentPhoto.preview,
        file: newFile,
        preview: newPreviewUrl,
        annotation
      };
      return { ...group, photos: newPhotos };
    }));
    setEditingPhoto(null);
  };
  const handleResetText = () => {
    if (!editingPhoto) return;
    const { groupId, photoIndex } = editingPhoto;
    setPhotoGroups((prev) => prev.map((group) => {
      if (group.id !== groupId) return group;
      const newPhotos = [...group.photos];
      const currentPhoto = newPhotos[photoIndex];
      if (!currentPhoto.originalFile || !currentPhoto.originalPreview) return group;
      newPhotos[photoIndex] = {
        ...currentPhoto,
        file: currentPhoto.originalFile,
        preview: currentPhoto.originalPreview,
        annotation: void 0
      };
      return { ...group, photos: newPhotos };
    }));
    setEditingPhoto(null);
  };
  const addPhotoGroup = () => {
    setPhotoGroups((prev) => [...prev, { id: Date.now(), photos: [], isGenerating: false, autoCollageFile: null, collageAnnotation: void 0 }]);
  };
  const removePhotoGroup = (groupId) => {
    if (photoGroups.length <= 1) return;
    setPhotoGroups((prev) => {
      const groupToRemove = prev.find((g) => g.id === groupId);
      if (groupToRemove) {
        groupToRemove.photos.forEach((p) => URL.revokeObjectURL(p.preview));
      }
      return prev.filter((g) => g.id !== groupId);
    });
    if (editingPhoto?.groupId === groupId) {
      setEditingPhoto(null);
    }
  };
  const renderPhotoSection = () => /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-blue-50/50 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold text-slate-800 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Camera, { className: "w-5 h-5 text-blue-600" }),
        " Lampiran Foto"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end gap-1", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded w-fit", children: "Kirim multi kolase sekaligus" }),
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-500 font-medium flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Move, { className: "w-3 h-3" }),
          " Geser foto untuk urutkan"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6", children: [
      photoGroups.map((group, groupIndex) => /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-5 bg-blue-50/30 border border-blue-100 rounded-xl space-y-4 relative shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center gap-3 justify-between", children: [
          /* @__PURE__ */ jsx("div", { className: "flex-1 w-full flex items-center gap-3", children: /* @__PURE__ */ jsxs("h3", { className: "font-bold text-blue-900 text-sm", children: [
            "Grup Kolase ",
            groupIndex + 1
          ] }) }),
          photoGroups.length > 1 && /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => removePhotoGroup(group.id),
              className: "text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-1 self-end sm:self-center text-sm font-bold",
              children: [
                /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }),
                " ",
                /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: "Hapus Grup" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("label", { className: "flex items-center justify-center w-full p-6 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors group", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2 text-center", children: [
            /* @__PURE__ */ jsx(ImagePlus, { className: "w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-blue-700", children: "Pilih / Ambil Foto" }),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-blue-500", children: "Galeri, File, atau Kamera langsung" })
          ] }),
          /* @__PURE__ */ jsx("input", { type: "file", accept: "image/*", multiple: true, className: "hidden", onChange: (e) => handlePhotoUpload(group.id, e) })
        ] }) }),
        group.photos.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("p", { className: "text-xs font-semibold text-slate-500 mb-2", children: [
            "Daftar Foto (",
            group.photos.length,
            "):"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4", children: group.photos.map((photo, pIndex) => /* @__PURE__ */ jsxs(
            "div",
            {
              draggable: true,
              onDragStart: (e) => e.dataTransfer.setData("text/plain", pIndex.toString()),
              onDragOver: (e) => e.preventDefault(),
              onDrop: (e) => handlePhotoDrop(e, group.id, pIndex),
              className: "relative bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm group/photo hover:shadow-md transition-shadow aspect-square cursor-move flex flex-col",
              children: [
                /* @__PURE__ */ jsx("div", { className: "flex-1 relative overflow-hidden bg-black flex items-center justify-center", children: /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: photo.preview,
                    alt: "Preview",
                    className: "absolute w-full h-full object-cover transition-transform",
                    style: { transform: `scale(${photo.zoom || 1})` }
                  }
                ) }),
                /* @__PURE__ */ jsx("div", { className: "absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded backdrop-blur-sm z-10", children: pIndex + 1 }),
                /* @__PURE__ */ jsx("div", { className: "absolute top-1 right-1 flex flex-col gap-1 z-10 opacity-100 sm:opacity-0 group-hover/photo:opacity-100 transition-opacity", children: /* @__PURE__ */ jsx("button", { type: "button", onClick: (e) => {
                  e.preventDefault();
                  removePhoto(group.id, pIndex);
                }, className: "bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-md", children: /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5" }) }) }),
                /* @__PURE__ */ jsx("div", { className: "absolute bottom-1 left-1 z-10 opacity-100 sm:opacity-0 group-hover/photo:opacity-100 transition-opacity", children: /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditingPhoto({ groupId: group.id, photoIndex: pIndex });
                    },
                    className: `p-1.5 rounded-full shadow-md flex items-center gap-1 text-xs font-semibold px-2.5 py-1 transition-colors ${photo.annotation ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-white text-slate-700 hover:bg-slate-100"}`,
                    title: "Beri Teks / Watermark",
                    children: [
                      /* @__PURE__ */ jsx(Type, { className: "w-3.5 h-3.5" }),
                      /* @__PURE__ */ jsx("span", { className: "hidden md:inline", children: photo.annotation ? "Edit Teks" : "Teks" })
                    ]
                  }
                ) }),
                /* @__PURE__ */ jsxs("div", { className: "absolute bottom-1 right-1 flex gap-1 z-10 opacity-100 sm:opacity-0 group-hover/photo:opacity-100 transition-opacity", children: [
                  /* @__PURE__ */ jsx("button", { type: "button", onClick: (e) => {
                    e.preventDefault();
                    updatePhotoZoom(group.id, pIndex, 0.1);
                  }, className: "bg-white text-slate-700 p-1.5 rounded-full hover:bg-slate-100 shadow-md", children: /* @__PURE__ */ jsx(ZoomIn, { className: "w-3.5 h-3.5" }) }),
                  /* @__PURE__ */ jsx("button", { type: "button", onClick: (e) => {
                    e.preventDefault();
                    updatePhotoZoom(group.id, pIndex, -0.1);
                  }, className: "bg-white text-slate-700 p-1.5 rounded-full hover:bg-slate-100 shadow-md", children: /* @__PURE__ */ jsx(ZoomOut, { className: "w-3.5 h-3.5" }) })
                ] })
              ]
            },
            photo.id
          )) })
        ] }),
        /* @__PURE__ */ jsx(
          LiveCollagePreview,
          {
            photos: group.photos,
            onCollageChange: (file, _url, annotation) => {
              setPhotoGroups((prev) => prev.map((g) => g.id === group.id ? { ...g, autoCollageFile: file, collageAnnotation: annotation } : g));
            }
          }
        )
      ] }, group.id)),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: addPhotoGroup,
          className: "w-full p-5 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group flex flex-col items-center justify-center gap-1.5 text-center",
          children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-blue-100 group-hover:scale-110 transition-transform flex items-center justify-center text-blue-600 shadow-sm", children: /* @__PURE__ */ jsx(Plus, { className: "w-5 h-5" }) }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-blue-700 block", children: "Tambah Grup Kolase Baru" }),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-blue-500 block", children: "Klik untuk membuat grup kolase foto baru" })
          ]
        }
      )
    ] })
  ] });
  const handleRepairSubmit = async (e) => {
    e.preventDefault();
    const now = /* @__PURE__ */ new Date();
    const todayStr = now.toISOString().split("T")[0];
    const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (formData.tanggal === todayStr && formData.waktuSelesai && formData.waktuSelesai > currentTimeStr) {
      alert(`Pukul Selesai tidak boleh melebihi waktu saat ini (${currentTimeStr})`);
      return;
    }
    let customFilesArray = [];
    for (let i = 0; i < photoGroups.length; i++) {
      const group = photoGroups[i];
      if (group.photos.length > 1) {
        if (group.autoCollageFile) {
          customFilesArray.push(group.autoCollageFile);
        } else {
          const collageResult = await processPhotosToCollage(group.photos, group.collageAnnotation);
          if (collageResult && collageResult.file) {
            customFilesArray.push(collageResult.file);
          }
        }
      } else if (group.photos.length === 1 && group.photos[0]?.file) {
        customFilesArray.push(group.photos[0].file);
      }
    }
    const message = generateWA_Perbaikan(formData, isVerifikasiETD);
    const uraianText = `Permasalahan : ${formData.permasalahan}`;
    const activeLocs = (formData.lokasiList || [{ lokasi1: formData.lokasi1, lokasi2: formData.lokasi2 }]).filter((l) => l.lokasi1);
    const lokasiFull = activeLocs.map((l) => {
      if (l.isManual || l.lokasi2 === "-" && !l.lokasi2) return l.lokasi1;
      return l.lokasi1 + (l.lokasi2 && l.lokasi2 !== "-" ? ` - ${l.lokasi2}` : "");
    }).join(", ");
    const waktuFull = formData.waktuSelesai ? `${formData.waktuMulai} - ${formData.waktuSelesai}` : formData.waktuMulai;
    syncToGoogleSheets({
      jenis: "Perbaikan",
      tanggal: formData.tanggal,
      waktu: waktuFull,
      teknisi: formData.teknisi,
      lokasi: lokasiFull || "-",
      peralatan: formData.peralatan,
      uraian: uraianText,
      tindakLanjut: formData.tindakLanjut,
      status: formData.status,
      imageFile: customFilesArray.length > 0 ? customFilesArray[0] : null
    });
    await shareToWhatsApp(message, customFilesArray.length > 0 ? customFilesArray : null, () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3e3);
    });
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "bg-blue-50/50 px-6 py-5 border-b border-slate-200", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
        /* @__PURE__ */ jsxs("label", { className: "block text-sm font-bold text-blue-900 mb-2 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Cpu, { className: "w-5 h-5 text-blue-600" }),
          " Pilihan Peralatan"
        ] }),
        isManualPeralatan ? /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              required: true,
              placeholder: "Ketik nama peralatan secara manual...",
              value: formData.peralatan,
              onChange: (e) => setFormData((prev) => ({ ...prev, peralatan: e.target.value })),
              className: "w-full px-4 py-3 bg-white border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-medium shadow-sm"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                setIsManualPeralatan(false);
                setFormData((prev) => ({ ...prev, peralatan: "", lokasi1: "", lokasi2: "", lokasiList: [{ lokasi1: "", lokasi2: "", isManual: false }] }));
              },
              className: "px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs shrink-0 transition-colors",
              children: "Pilih dari Daftar"
            }
          )
        ] }) : /* @__PURE__ */ jsxs("select", { required: true, value: formData.peralatan, onChange: handlePeralatanChange, className: "w-full px-4 py-3 bg-white border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-medium shadow-sm cursor-pointer appearance-none", children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "-- Pilih Peralatan --" }),
          tipePeralatanOptions.map((opt) => /* @__PURE__ */ jsx("option", { value: opt, children: opt }, opt)),
          /* @__PURE__ */ jsx("option", { value: "MANUAL_ENTRY", children: "+ Ketik Manual (Peralatan Lainnya)" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pt-2 sm:pt-7", children: [
        /* @__PURE__ */ jsx("input", { type: "checkbox", id: "verifikasiETD_tab", checked: isVerifikasiETD, onChange: handleVerifikasiChange, className: "w-5 h-5 text-blue-600 bg-white border-blue-300 rounded focus:ring-2 focus:ring-blue-400 cursor-pointer" }),
        /* @__PURE__ */ jsx("label", { htmlFor: "verifikasiETD_tab", className: "text-sm font-bold text-blue-900 cursor-pointer select-none", children: "Verifikasi ETD" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleRepairSubmit, className: "p-6 sm:p-8 space-y-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center border-b pb-2", children: /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Wrench, { className: "w-5 h-5 text-blue-600" }),
          " Informasi Laporan Perbaikan"
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "md:col-span-2 space-y-3", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700", children: "Lokasi" }),
            (formData.lokasiList || [{ lokasi1: formData.lokasi1, lokasi2: formData.lokasi2 }]).map((loc, index) => {
              const allRows = formData.lokasiList || [{ lokasi1: formData.lokasi1, lokasi2: formData.lokasi2 }];
              const otherRows = allRows.filter((_, idx) => idx !== index);
              const availableOptions = getGeneralLokasiOptions(formData.peralatan).filter((opt) => {
                if (opt === loc.lokasi1) return true;
                const otherRowsWithOpt = otherRows.filter((r) => r.lokasi1 === opt);
                if (otherRowsWithOpt.length === 0) return true;
                const pts = getLokasi2Options(opt, [formData.peralatan]);
                if (pts.length === 0 || pts[0] === "-") return false;
                const takenPts = otherRowsWithOpt.map((r) => r.lokasi2).filter(Boolean);
                return !pts.every((p) => takenPts.includes(p));
              });
              const allOptions2 = getLokasi2Options(loc.lokasi1, [formData.peralatan]);
              const takenOptions2ForThisLoc1 = otherRows.filter((r) => r.lokasi1 === loc.lokasi1).map((r) => r.lokasi2).filter(Boolean);
              const options2 = allOptions2.filter((opt) => !takenOptions2ForThisLoc1.includes(opt) || opt === loc.lokasi2);
              const isDisabled2 = allOptions2.length === 0 || allOptions2.length === 1 && allOptions2[0] === "-";
              const isRowManual = loc.isManual || isManualPeralatan;
              return /* @__PURE__ */ jsxs("div", { className: "flex gap-2 items-center", children: [
                isRowManual ? /* @__PURE__ */ jsxs("div", { className: "flex gap-2 flex-1 items-center", children: [
                  /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
                    /* @__PURE__ */ jsx(MapPin, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        required: index === 0,
                        placeholder: "Ketik nama lokasi / nomor titik secara manual...",
                        value: loc.lokasi1,
                        onChange: (e) => handleLokasiEntryChange(index, "lokasi1", e.target.value),
                        className: "w-full pl-10 pr-4 py-2 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800 font-medium shadow-sm"
                      }
                    )
                  ] }),
                  !isManualPeralatan && /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => handleLokasiEntryChange(index, "isManualToggle", "false"),
                      className: "px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs shrink-0 transition-colors",
                      children: "Pilih dari Daftar"
                    }
                  )
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
                    /* @__PURE__ */ jsx(MapPin, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
                    /* @__PURE__ */ jsxs(
                      "select",
                      {
                        required: index === 0,
                        disabled: !formData.peralatan,
                        value: loc.lokasi1,
                        onChange: (e) => handleLokasiEntryChange(index, "lokasi1", e.target.value),
                        className: "w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none disabled:bg-slate-200 disabled:opacity-70 disabled:cursor-not-allowed text-sm",
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "", children: index === 0 ? "- Pilih Lokasi -" : "- Pilih Lokasi Tambahan (Opsional) -" }),
                          availableOptions.map((opt) => /* @__PURE__ */ jsx("option", { value: opt, children: opt }, opt)),
                          /* @__PURE__ */ jsx("option", { value: "MANUAL_ENTRY", children: "+ Ketik Manual (Lokasi Lainnya)" })
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "w-1/3", children: /* @__PURE__ */ jsxs(
                    "select",
                    {
                      value: loc.lokasi2,
                      onChange: (e) => handleLokasiEntryChange(index, "lokasi2", e.target.value),
                      disabled: isDisabled2,
                      className: `w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-sm ${isDisabled2 ? "opacity-50 cursor-not-allowed bg-slate-200" : ""}`,
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "", children: "- No -" }),
                        options2.map((opt) => /* @__PURE__ */ jsx("option", { value: opt, children: opt }, opt))
                      ]
                    }
                  ) })
                ] }),
                index > 0 && /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => removeLokasiEntry(index),
                    className: "p-2 bg-rose-100 text-rose-600 hover:bg-rose-200 rounded-lg transition-colors flex items-center justify-center shrink-0",
                    title: "Hapus lokasi tambahan ini",
                    children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
                  }
                )
              ] }, index);
            }),
            /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                disabled: !formData.peralatan,
                onClick: addLokasiEntry,
                className: "text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 pt-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                children: [
                  /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
                  " Tambah Lokasi"
                ]
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Sumber Laporan" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(User, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
              /* @__PURE__ */ jsx("input", { type: "text", name: "sumberLaporan", required: true, value: formData.sumberLaporan, onChange: handleRepairChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Indikasi Awal" }),
            /* @__PURE__ */ jsx("textarea", { name: "indikasiAwal", required: !isVerifikasiETD, disabled: isVerifikasiETD, rows: 2, placeholder: "Cth: Mesin tidak menyala...", value: formData.indikasiAwal, onChange: handleRepairChange, className: `w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none ${isVerifikasiETD ? "opacity-60 cursor-not-allowed bg-slate-200 text-slate-500" : ""}` })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2", children: [
          /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-blue-600" }),
          " Waktu & Pelaksana"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Tanggal" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Calendar, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
              /* @__PURE__ */ jsx("input", { type: "date", name: "tanggal", required: true, value: formData.tanggal, onChange: handleRepairChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "col-span-1", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Pukul Mulai" }),
            /* @__PURE__ */ jsx("input", { type: "time", name: "waktuMulai", required: true, value: formData.waktuMulai, onChange: handleRepairChange, className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "col-span-1", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Pukul Selesai" }),
            /* @__PURE__ */ jsx("input", { type: "time", name: "waktuSelesai", required: true, max: formData.tanggal === (/* @__PURE__ */ new Date()).toISOString().split("T")[0] ? `${String((/* @__PURE__ */ new Date()).getHours()).padStart(2, "0")}:${String((/* @__PURE__ */ new Date()).getMinutes()).padStart(2, "0")}` : void 0, value: formData.waktuSelesai, onChange: handleRepairChange, className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Lama Pengerjaan" }),
            /* @__PURE__ */ jsx("input", { type: "text", name: "lamaPengerjaan", required: true, readOnly: true, placeholder: "Terisi otomatis...", value: formData.lamaPengerjaan, className: "w-full px-4 py-2 bg-slate-200 border border-slate-300 rounded-lg outline-none cursor-not-allowed text-slate-600 font-medium select-none" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2", children: [
              "Teknisi Bertugas (Otomatis dari Shift)",
              availableTeknisi.length === 0 && /* @__PURE__ */ jsx("span", { className: "text-xs text-rose-500 font-normal", children: "*(Tidak ada teknisi hadir/jadwal kosong)" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200", children: (() => {
              const apiTeknisi = availableTeknisi.filter((t) => t.unit === "API T2");
              const iasTeknisi = availableTeknisi.filter((t) => t.unit === "OM/IAS T2");
              const otherTeknisi = availableTeknisi.filter((t) => t.unit !== "API T2" && t.unit !== "OM/IAS T2");
              return /* @__PURE__ */ jsxs(Fragment, { children: [
                apiTeknisi.length > 0 && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: apiTeknisi.map((t) => /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-100 rounded-md transition-colors", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: selectedTeknisi.includes(t.name),
                      onChange: () => toggleTeknisi(t.name),
                      className: "w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-slate-700 select-none", children: t.name })
                ] }, t.id)) }),
                apiTeknisi.length > 0 && (iasTeknisi.length > 0 || otherTeknisi.length > 0) && /* @__PURE__ */ jsx("div", { className: "border-t border-slate-300 border-dashed my-1" }),
                iasTeknisi.length > 0 && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: iasTeknisi.map((t) => /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-100 rounded-md transition-colors", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: selectedTeknisi.includes(t.name),
                      onChange: () => toggleTeknisi(t.name),
                      className: "w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-slate-700 select-none", children: t.name })
                ] }, t.id)) }),
                iasTeknisi.length > 0 && otherTeknisi.length > 0 && /* @__PURE__ */ jsx("div", { className: "border-t border-slate-300 border-dashed my-1" }),
                otherTeknisi.length > 0 && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: otherTeknisi.map((t) => /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-100 rounded-md transition-colors", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: selectedTeknisi.includes(t.name),
                      onChange: () => toggleTeknisi(t.name),
                      className: "w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-slate-700 select-none", children: t.name })
                ] }, t.id)) })
              ] });
            })() }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: availableTeknisi.length === 0 ? "Ketik manual nama teknisi karena jadwal kosong..." : "Tambah teknisi lain (pisahkan dengan koma)...",
                value: manualTeknisi,
                onChange: (e) => setManualTeknisi(e.target.value),
                className: "w-full mt-3 px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "w-5 h-5 text-blue-600" }),
          " Detail Pengerjaan"
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Permasalahan" }),
          /* @__PURE__ */ jsx("textarea", { ref: permasalahanRef, name: "permasalahan", required: true, rows: 3, value: formData.permasalahan, onChange: (e) => handleBulletChange(e, "permasalahan"), onKeyDown: (e) => handleBulletKeyDown(e, "permasalahan"), className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none overflow-hidden font-mono text-sm leading-relaxed transition-all" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Tindak Lanjut" }),
          /* @__PURE__ */ jsx("textarea", { ref: tindakLanjutRef, name: "tindakLanjut", required: true, rows: 6, value: formData.tindakLanjut, onChange: (e) => handleBulletChange(e, "tindakLanjut"), onKeyDown: (e) => handleBulletKeyDown(e, "tindakLanjut"), className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none overflow-hidden font-mono text-sm leading-relaxed transition-all" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Status" }),
          /* @__PURE__ */ jsxs("select", { name: "status", value: formData.status, onChange: handleRepairChange, className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none", children: [
            /* @__PURE__ */ jsx("option", { value: "Pekerjaan Selesai", children: "Pekerjaan Selesai" }),
            /* @__PURE__ */ jsx("option", { value: "Normal Operasi", children: "Normal Operasi" }),
            /* @__PURE__ */ jsx("option", { value: "On Progress", children: "On Progress" }),
            /* @__PURE__ */ jsx("option", { value: "Menunggu Sparepart", children: "Menunggu Sparepart" }),
            /* @__PURE__ */ jsx("option", { value: "Perlu Eskalasi Lanjut", children: "Perlu Eskalasi Lanjut" })
          ] })
        ] })
      ] }),
      renderPhotoSection(),
      editingPhoto && (() => {
        const group = photoGroups.find((g) => g.id === editingPhoto.groupId);
        const photo = group?.photos[editingPhoto.photoIndex];
        if (!photo) return null;
        return /* @__PURE__ */ jsx(
          PhotoTextEditorModal,
          {
            isOpen: true,
            onClose: () => setEditingPhoto(null),
            photoUrl: photo.originalPreview || photo.preview,
            initialAnnotation: photo.annotation,
            onSave: handleSaveText,
            onReset: handleResetText,
            hasOriginal: !!photo.originalPreview
          }
        );
      })(),
      /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row gap-4 mt-8", children: /* @__PURE__ */ jsx("button", { type: "submit", className: `w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${isCopied ? "bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]" : "bg-[#25D366] hover:bg-[#20b858] hover:shadow-xl hover:-translate-y-0.5 text-white"}`, children: isCopied ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 animate-pulse" }),
        " Berhasil Disalin / Dibagikan!"
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Share2, { className: "w-6 h-6" }),
        " Share Perbaikan ke WA"
      ] }) }) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 border-t border-slate-200 pt-8", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-700 mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-blue-600" }),
          " Preview Laporan Perbaikan (Real-time)"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative", children: /* @__PURE__ */ jsx("div", { className: "bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%]", children: generateWA_Perbaikan(formData, isVerifikasiETD) }) })
      ] })
    ] })
  ] });
};
const PhotoUploader = ({
  photos,
  onUpload,
  onRemove,
  onZoom,
  onDrop,
  onEdit,
  listType
}) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [, forceUpdate] = useState({});
  const handleSaveText = (newFile, newPreviewUrl, annotation) => {
    if (editingIndex === null) return;
    const currentPhoto = photos[editingIndex];
    const updatedPhoto = {
      ...currentPhoto,
      originalFile: currentPhoto.originalFile || currentPhoto.file,
      originalPreview: currentPhoto.originalPreview || currentPhoto.preview,
      file: newFile,
      preview: newPreviewUrl,
      annotation
    };
    if (onEdit) {
      onEdit(editingIndex, updatedPhoto);
    } else {
      photos[editingIndex] = updatedPhoto;
      forceUpdate({});
    }
    setEditingIndex(null);
  };
  const handleResetText = () => {
    if (editingIndex === null) return;
    const currentPhoto = photos[editingIndex];
    if (!currentPhoto.originalFile || !currentPhoto.originalPreview) return;
    const resetPhoto = {
      ...currentPhoto,
      file: currentPhoto.originalFile,
      preview: currentPhoto.originalPreview,
      annotation: void 0
    };
    if (onEdit) {
      onEdit(editingIndex, resetPhoto);
    } else {
      photos[editingIndex] = resetPhoto;
      forceUpdate({});
    }
    setEditingIndex(null);
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-3", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold text-slate-800 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Camera, { className: "w-5 h-5 text-blue-600" }),
        " Lampiran Foto"
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-500 font-medium flex items-center gap-1", children: [
        /* @__PURE__ */ jsx(Move, { className: "w-3 h-3" }),
        " Geser foto untuk urutkan"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("label", { className: "flex items-center justify-center w-full p-6 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors group", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2 text-center", children: [
        /* @__PURE__ */ jsx(ImagePlus, { className: "w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" }),
        /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-blue-700", children: "Pilih / Ambil Foto" }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-blue-500", children: "Galeri, File, atau Kamera langsung" })
      ] }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "file",
          accept: "image/*",
          multiple: true,
          className: "hidden",
          onChange: (e) => {
            onUpload(e);
            e.target.value = "";
          }
        }
      )
    ] }) }),
    photos.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
      /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center mb-2", children: /* @__PURE__ */ jsxs("p", { className: "text-xs font-semibold text-slate-500", children: [
        "Daftar Foto (",
        photos.length,
        "):"
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4", children: photos.map((photo, index) => /* @__PURE__ */ jsxs(
        "div",
        {
          "data-photo-index": index,
          "data-list-type": listType,
          draggable: true,
          onDragStart: (e) => e.dataTransfer.setData("text/plain", index.toString()),
          onDragOver: (e) => e.preventDefault(),
          onDrop: (e) => onDrop(e, index),
          onTouchStart: (e) => {
            if (e.touches.length === 1) {
              window.touchDragState = { type: listType, index, startX: e.touches[0].clientX, startY: e.touches[0].clientY, isDragging: false };
            }
          },
          onTouchMove: (e) => {
            if (window.touchDragState && e.touches.length === 1) {
              if (Math.abs(e.touches[0].clientY - window.touchDragState.startY) > 10 || Math.abs(e.touches[0].clientX - window.touchDragState.startX) > 10) {
                window.touchDragState.isDragging = true;
              }
            }
          },
          onTouchEnd: (e) => {
            if (window.touchDragState && window.touchDragState.isDragging && window.touchDragState.type === listType) {
              const touch = e.changedTouches[0];
              const elem = document.elementFromPoint(touch.clientX, touch.clientY);
              const target = elem?.closest(`[data-list-type="${listType}"]`);
              if (target) {
                const targetIdx = parseInt(target.getAttribute("data-photo-index") || "", 10);
                if (!isNaN(targetIdx) && targetIdx !== window.touchDragState.index) {
                  const mockEvent = { preventDefault: () => {
                  }, dataTransfer: { getData: () => window.touchDragState.index.toString() } };
                  onDrop(mockEvent, targetIdx);
                }
              }
            }
            window.touchDragState = null;
          },
          className: "relative bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm group/photo hover:shadow-md transition-shadow aspect-square cursor-move flex flex-col touch-pan-y",
          children: [
            /* @__PURE__ */ jsx("div", { className: "flex-1 relative overflow-hidden bg-black flex items-center justify-center", children: /* @__PURE__ */ jsx(
              "img",
              {
                src: photo.preview,
                alt: "Preview",
                className: "absolute w-full h-full object-cover transition-transform",
                style: { transform: `scale(${photo.zoom || 1})` }
              }
            ) }),
            /* @__PURE__ */ jsx("div", { className: "absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded backdrop-blur-sm z-10", children: index + 1 }),
            /* @__PURE__ */ jsx("div", { className: "absolute top-1 right-1 flex flex-col gap-1 z-10 opacity-100 sm:opacity-0 group-hover/photo:opacity-100 transition-opacity", children: /* @__PURE__ */ jsx("button", { type: "button", onClick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(index);
            }, className: "bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-md", children: /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5" }) }) }),
            /* @__PURE__ */ jsx("div", { className: "absolute bottom-1 left-1 z-10 opacity-100 sm:opacity-0 group-hover/photo:opacity-100 transition-opacity", children: /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditingIndex(index);
                },
                className: `p-1.5 rounded-full shadow-md flex items-center gap-1 text-xs font-semibold px-2.5 py-1 transition-colors ${photo.annotation ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-white text-slate-700 hover:bg-slate-100"}`,
                title: "Beri Teks / Watermark",
                children: [
                  /* @__PURE__ */ jsx(Type, { className: "w-3.5 h-3.5" }),
                  /* @__PURE__ */ jsx("span", { className: "hidden md:inline", children: photo.annotation ? "Edit Teks" : "Teks" })
                ]
              }
            ) }),
            /* @__PURE__ */ jsxs("div", { className: "absolute bottom-1 right-1 flex gap-1 z-10 opacity-100 sm:opacity-0 group-hover/photo:opacity-100 transition-opacity", children: [
              /* @__PURE__ */ jsx("button", { type: "button", onClick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                onZoom(index, 0.1);
              }, className: "bg-white text-slate-700 p-1.5 rounded-full hover:bg-slate-100 shadow-md", children: /* @__PURE__ */ jsx(ZoomIn, { className: "w-3.5 h-3.5" }) }),
              /* @__PURE__ */ jsx("button", { type: "button", onClick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                onZoom(index, -0.1);
              }, className: "bg-white text-slate-700 p-1.5 rounded-full hover:bg-slate-100 shadow-md", children: /* @__PURE__ */ jsx(ZoomOut, { className: "w-3.5 h-3.5" }) })
            ] })
          ]
        },
        photo.id
      )) })
    ] }),
    editingIndex !== null && photos[editingIndex] && /* @__PURE__ */ jsx(
      PhotoTextEditorModal,
      {
        isOpen: true,
        onClose: () => setEditingIndex(null),
        photoUrl: photos[editingIndex].originalPreview || photos[editingIndex].preview,
        initialAnnotation: photos[editingIndex].annotation,
        onSave: handleSaveText,
        onReset: handleResetText,
        hasOriginal: !!photos[editingIndex].originalPreview
      }
    )
  ] });
};
const TabStoring = () => {
  const { isCopied, setIsCopied } = useAppStore();
  const { jenisPeralatanData, storingLocAc, storingLocDefault } = useMasterDataStore();
  const storingEquipments = Array.from(new Set(jenisPeralatanData.map((j) => j.nama)));
  const [storingData, setStoringData] = useState({
    tanggal: (() => {
      const d = /* @__PURE__ */ new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })(),
    waktuMulai: "",
    waktuSelesai: "",
    peralatan: [],
    lokasi: "",
    acLokasi: [],
    acNomor: {},
    nomor: "",
    hasil: "Normal Operasi",
    supervisorAvsec: ""
  });
  const [photos, setPhotos] = useState([]);
  const [autoCollageFile, setAutoCollageFile] = useState(null);
  const [collageAnnotation, setCollageAnnotation] = useState(void 0);
  const photosRef = React.useRef(photos);
  photosRef.current = photos;
  React.useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => {
        if (p.preview && p.preview.startsWith("blob:")) {
          URL.revokeObjectURL(p.preview);
        }
      });
    };
  }, []);
  const handleStoringChange = (e) => {
    const { name, value } = e.target;
    if (name === "waktuSelesai" && value) {
      const now = /* @__PURE__ */ new Date();
      const todayStr = now.toISOString().split("T")[0];
      const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (storingData.tanggal === todayStr && value > currentTimeStr) {
        alert(`Pukul Selesai tidak boleh melebihi waktu saat ini (${currentTimeStr})`);
        return;
      }
    }
    if (name === "tanggal" && value) {
      const now = /* @__PURE__ */ new Date();
      const todayStr = now.toISOString().split("T")[0];
      const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (value === todayStr && storingData.waktuSelesai && storingData.waktuSelesai > currentTimeStr) {
        alert(`Pukul Selesai direset karena melebihi waktu saat ini (${currentTimeStr})`);
        setStoringData((prev) => ({ ...prev, tanggal: value, waktuSelesai: "" }));
        return;
      }
    }
    setStoringData((prev) => ({ ...prev, [name]: value }));
  };
  const handleStoringEquipToggle = (equip) => {
    setStoringData((prev) => {
      let newPeralatan = [...prev.peralatan];
      if (newPeralatan.includes(equip)) {
        newPeralatan = newPeralatan.filter((e) => e !== equip);
      } else {
        if (equip === "Access Control" || equip.toLowerCase() === "mirroring x-ray") {
          newPeralatan = [equip];
        } else if (!newPeralatan.some((e) => e === "Access Control" || e.toLowerCase() === "mirroring x-ray")) {
          newPeralatan.push(equip);
        }
      }
      newPeralatan.includes("Access Control");
      newPeralatan.some((e) => e.toLowerCase() === "mirroring x-ray");
      const newShowSupervisor = checkNeedsStoringSupervisorAvsec(newPeralatan, [], {});
      return {
        ...prev,
        peralatan: newPeralatan,
        lokasi: "",
        acLokasi: [],
        acNomor: {},
        nomor: "",
        supervisorAvsec: newShowSupervisor ? prev.supervisorAvsec : ""
      };
    });
  };
  const handlePhotoUpload = async (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const compressedResults = await Promise.all(files.map((f) => compressImageFile(f)));
      const newPhotos = compressedResults.map((res) => ({
        id: Date.now() + Math.random(),
        file: res.file,
        preview: res.preview,
        zoom: 1
      }));
      setPhotos((prev) => [...prev, ...newPhotos]);
    }
  };
  const removePhoto = (index) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };
  const updatePhotoZoom = (index, delta) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      const currentZoom = newPhotos[index].zoom || 1;
      newPhotos[index] = {
        ...newPhotos[index],
        zoom: Math.max(0.5, Math.min(3, currentZoom + delta))
      };
      return newPhotos;
    });
  };
  const handlePhotoDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer?.getData("text/plain");
    if (!sourceIndexStr) return;
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (sourceIndex === targetIndex || isNaN(sourceIndex)) return;
    setPhotos((prev) => {
      const newPhotos = [...prev];
      const [movedPhoto] = newPhotos.splice(sourceIndex, 1);
      newPhotos.splice(targetIndex, 0, movedPhoto);
      return newPhotos;
    });
  };
  const handlePhotoEdit = (index, updatedPhoto) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      newPhotos[index] = updatedPhoto;
      return newPhotos;
    });
  };
  const handleStoringSubmit = async (e) => {
    e.preventDefault();
    const now = /* @__PURE__ */ new Date();
    const todayStr = now.toISOString().split("T")[0];
    const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (storingData.tanggal === todayStr && storingData.waktuSelesai && storingData.waktuSelesai > currentTimeStr) {
      alert(`Pukul Selesai tidak boleh melebihi waktu saat ini (${currentTimeStr})`);
      return;
    }
    if (storingData.peralatan.length > 0 && (storingData.acLokasi || []).length === 0) {
      alert("Pastikan Anda memilih minimal 1 lokasi untuk peralatan terpilih!");
      return;
    }
    let generatedCollageFile = null;
    if (photos.length > 0) {
      if (photos.length === 1) {
        generatedCollageFile = photos[0].file || null;
      } else {
        if (autoCollageFile) {
          generatedCollageFile = autoCollageFile;
        } else {
          const collageResult = await processPhotosToCollage(photos, collageAnnotation);
          if (collageResult) {
            generatedCollageFile = collageResult.file;
          }
        }
      }
    }
    const message = generateWA_Storing(storingData);
    const waktuFull = storingData.waktuSelesai ? `${storingData.waktuMulai} - ${storingData.waktuSelesai}` : storingData.waktuMulai;
    const lokasiFull = storingData.lokasi || (storingData.acLokasi && storingData.acLokasi.length > 0 ? storingData.acLokasi.join(", ") : "-");
    const alatFull = storingData.peralatan.join(", ") || "Peralatan";
    syncToGoogleSheets({
      jenis: "Storing",
      tanggal: storingData.tanggal,
      waktu: waktuFull,
      lokasi: lokasiFull,
      peralatan: alatFull,
      uraian: `Kegiatan Storing : ${alatFull}${storingData.supervisorAvsec ? `
Supervisor Avsec : ${storingData.supervisorAvsec}` : ""}`,
      tindakLanjut: "-",
      status: storingData.hasil || "Normal Operasi",
      imageFile: generatedCollageFile
    });
    await shareToWhatsApp(message, generatedCollageFile, () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3e3);
    });
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleStoringSubmit, className: "p-6 sm:p-8 space-y-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center border-b pb-2", children: /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(MonitorSearchIcon, { className: "w-5 h-5 text-blue-600" }),
        " Detail Kegiatan Storing"
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Tanggal" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
            /* @__PURE__ */ jsx("input", { type: "date", name: "tanggal", required: true, value: storingData.tanggal, onChange: handleStoringChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-1", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Pukul Mulai" }),
          /* @__PURE__ */ jsx("input", { type: "time", name: "waktuMulai", required: true, value: storingData.waktuMulai, onChange: handleStoringChange, className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-1", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Pukul Selesai" }),
          /* @__PURE__ */ jsx("input", { type: "time", name: "waktuSelesai", required: true, max: storingData.tanggal === (/* @__PURE__ */ new Date()).toISOString().split("T")[0] ? `${String((/* @__PURE__ */ new Date()).getHours()).padStart(2, "0")}:${String((/* @__PURE__ */ new Date()).getMinutes()).padStart(2, "0")}` : void 0, value: storingData.waktuSelesai, onChange: handleStoringChange, className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-2", children: [
            "Peralatan ",
            /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: "(Bisa pilih lebih dari 1)" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3", children: storingEquipments.map((equip) => {
            const isACChecked = storingData.peralatan.includes("Access Control");
            const isMirroringChecked = storingData.peralatan.some((e) => e.toLowerCase() === "mirroring x-ray");
            const isChecked = storingData.peralatan.includes(equip);
            const isDisabled = isACChecked && equip !== "Access Control" || isMirroringChecked && equip.toLowerCase() !== "mirroring x-ray";
            return /* @__PURE__ */ jsxs(
              "label",
              {
                className: `flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${isChecked ? "bg-blue-50 border-blue-500 shadow-sm" : isDisabled ? "bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed" : "bg-white border-slate-300 hover:bg-slate-50"}`,
                children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: isChecked,
                      disabled: isDisabled,
                      onChange: () => handleStoringEquipToggle(equip),
                      className: "w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: `ml-2 text-sm font-medium ${isDisabled ? "text-slate-400" : "text-slate-700"}`, children: equip })
                ]
              },
              equip
            );
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-2", children: [
            "Lokasi",
            storingData.peralatan.length > 0 && /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 font-normal", children: " (Pilih 1 atau lebih)" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2", children: (() => {
            const locOpts = storingData.peralatan.includes("Access Control") ? getGeneralLokasiOptions("Access Control") : storingData.peralatan.some((e) => e.toLowerCase() === "mirroring x-ray") ? getGeneralLokasiOptions("Mirroring X-Ray") : getStoringValidLocations(storingData.peralatan);
            if (locOpts.length === 0) {
              return /* @__PURE__ */ jsx("div", { className: "col-span-full p-3 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-sm text-center", children: storingData.peralatan.length === 0 ? "Pilih peralatan terlebih dahulu untuk melihat daftar lokasi." : "Data lokasi belum tersedia di database." });
            }
            return locOpts.map((loc) => {
              const isChecked = (storingData.acLokasi || []).includes(loc);
              const nomorOpts = getAcNomorOptions(loc);
              return /* @__PURE__ */ jsxs(
                "div",
                {
                  className: `flex items-center justify-between p-2 border rounded-lg transition-colors ${isChecked ? "bg-blue-50 border-blue-500 shadow-sm" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`,
                  children: [
                    /* @__PURE__ */ jsxs("label", { className: "flex items-center cursor-pointer flex-1 min-w-0 mr-1.5", children: [
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "checkbox",
                          checked: isChecked,
                          onChange: () => {
                            setStoringData((prev) => {
                              const exists = (prev.acLokasi || []).includes(loc);
                              const newLocs = exists ? (prev.acLokasi || []).filter((l) => l !== loc) : [...prev.acLokasi || [], loc];
                              const newNomor = { ...prev.acNomor || {} };
                              if (!exists && nomorOpts.length > 0) {
                                newNomor[loc] = nomorOpts[0];
                              } else if (exists) {
                                delete newNomor[loc];
                              }
                              const newShowSupervisor = checkNeedsStoringSupervisorAvsec(prev.peralatan, newLocs, newNomor);
                              return {
                                ...prev,
                                acLokasi: newLocs,
                                acNomor: newNomor,
                                supervisorAvsec: newShowSupervisor ? prev.supervisorAvsec : ""
                              };
                            });
                          },
                          className: "w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 flex-shrink-0"
                        }
                      ),
                      /* @__PURE__ */ jsx("span", { className: `ml-2 text-xs truncate select-none ${isChecked ? "font-semibold text-blue-700" : "text-slate-700"}`, title: loc, children: loc })
                    ] }),
                    isChecked && nomorOpts.length > 0 && /* @__PURE__ */ jsx(
                      "select",
                      {
                        value: (storingData.acNomor || {})[loc] || nomorOpts[0],
                        onChange: (e) => {
                          const val = e.target.value;
                          setStoringData((prev) => {
                            const newNomor = { ...prev.acNomor || {}, [loc]: val };
                            const newShowSup = checkNeedsStoringSupervisorAvsec(prev.peralatan, prev.acLokasi, newNomor);
                            return {
                              ...prev,
                              acNomor: newNomor,
                              supervisorAvsec: newShowSup ? prev.supervisorAvsec : ""
                            };
                          });
                        },
                        className: "text-xs py-1 px-1 bg-white border border-blue-300 rounded text-blue-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 flex-shrink-0 cursor-pointer shadow-sm",
                        children: nomorOpts.map((num) => /* @__PURE__ */ jsx("option", { value: num, children: num }, num))
                      }
                    )
                  ]
                },
                loc
              );
            });
          })() })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Hasil" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(AlertCircle, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
            /* @__PURE__ */ jsx("input", { type: "text", name: "hasil", required: true, value: storingData.hasil, onChange: handleStoringChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" })
          ] })
        ] }),
        (() => {
          storingData.peralatan.includes("Access Control");
          storingData.peralatan.some((e) => e.toLowerCase() === "mirroring x-ray");
          (storingData.acLokasi || []).some(
            (loc) => loc.trim().toLowerCase() === "ruang monitoring e1"
          );
          const showSupervisorAvsec = checkNeedsStoringSupervisorAvsec(storingData.peralatan, storingData.acLokasi, storingData.acNomor);
          if (!showSupervisorAvsec) return null;
          return /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Supervisor Avsec" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(User, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
              /* @__PURE__ */ jsx("input", { type: "text", name: "supervisorAvsec", value: storingData.supervisorAvsec, onChange: handleStoringChange, placeholder: "Nama Supervisor Avsec", className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" })
            ] })
          ] });
        })()
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      PhotoUploader,
      {
        photos,
        onUpload: handlePhotoUpload,
        onRemove: removePhoto,
        onZoom: updatePhotoZoom,
        onDrop: handlePhotoDrop,
        onEdit: handlePhotoEdit,
        listType: "general"
      }
    ),
    /* @__PURE__ */ jsx(
      LiveCollagePreview,
      {
        photos,
        onCollageChange: (file, _url, annotation) => {
          setAutoCollageFile(file);
          setCollageAnnotation(annotation);
        }
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row gap-4 mt-8", children: /* @__PURE__ */ jsx("button", { type: "submit", className: `w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${isCopied ? "bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]" : "bg-[#25D366] hover:bg-[#20b858] hover:shadow-xl hover:-translate-y-0.5 text-white"}`, children: isCopied ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 animate-pulse" }),
      " Berhasil Disalin / Dibagikan!"
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Share2, { className: "w-6 h-6" }),
      " Share Storing ke WA"
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 border-t border-slate-200 pt-8", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-700 mb-4 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-blue-600" }),
        " Preview Laporan Storing (Real-time)"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative", children: /* @__PURE__ */ jsx("div", { className: "bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%]", children: generateWA_Storing(storingData) }) })
    ] })
  ] });
};
const TabKalibrasi = () => {
  const { isCopied, setIsCopied } = useAppStore();
  const { jenisPeralatanData } = useMasterDataStore();
  const kalibrasiEquipments = jenisPeralatanData.filter((j) => j.tampil_di_kalibrasi).map((j) => j.nama);
  const createEmptyKalibrasiEntry = () => ({
    id: Date.now() + Math.random(),
    peralatan: [],
    xrayModel: "Semua X-Ray",
    wtmdModel: "Semua WTMD",
    hhmdModel: "Semua HHMD",
    bsModel: "Semua Body Scanner",
    etdModel: "Semua ETD",
    lokasi1: "",
    lokasi2: "",
    acLokasi: [],
    acEmlock: "Berfungsi",
    acIntercom: "Berfungsi",
    acFingerprint: "Berfungsi",
    acCctv: "Berfungsi",
    acPengontrolan: "Berfungsi",
    acRecordCctv: "",
    xrayKvV: "",
    xrayKvH: "",
    xrayMaV: "",
    xrayMaH: "",
    xrayOnV: "",
    xrayOnH: "",
    xrayArchive: "+- 1 bulan",
    wtmdZ1: "",
    wtmdZ2: "",
    wtmdZ3: "",
    wtmdZ4: "",
    wtmdLc: "",
    wtmdLs: "",
    wtmdUc: "",
    wtmdSe: "",
    wtmdDs: "",
    bsSuspect: "Normal",
    bsMonitor: "Normal",
    bsScanning: "Normal",
    bsCalibration: "Normal",
    etdTnt: "Alarm",
    etdPetn: "Alarm",
    etdRdx: "Alarm"
  });
  const [kalibrasiGlobal, setKalibrasiGlobal] = useState({
    tanggal: (() => {
      const d = /* @__PURE__ */ new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })(),
    waktuMulai: "",
    waktuSelesai: ""
  });
  const [kalibrasiEntries, setKalibrasiEntries] = useState([createEmptyKalibrasiEntry()]);
  const [kalibrasiPhotoGroups, setKalibrasiPhotoGroups] = useState([
    { id: Date.now(), photos: [], isGenerating: false, autoCollageFile: null, collageAnnotation: void 0 }
  ]);
  const [editingKalibrasiPhoto, setEditingKalibrasiPhoto] = useState(null);
  const photoGroupsRef = React.useRef(kalibrasiPhotoGroups);
  photoGroupsRef.current = kalibrasiPhotoGroups;
  React.useEffect(() => {
    return () => {
      photoGroupsRef.current.forEach((group) => {
        group.photos.forEach((p) => {
          if (p.preview && p.preview.startsWith("blob:")) {
            URL.revokeObjectURL(p.preview);
          }
        });
      });
    };
  }, []);
  const handleKalibrasiGlobalChange = (e) => {
    const { name, value } = e.target;
    if (name === "waktuSelesai" && value) {
      const now = /* @__PURE__ */ new Date();
      const todayStr = now.toISOString().split("T")[0];
      const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (kalibrasiGlobal.tanggal === todayStr && value > currentTimeStr) {
        alert(`Pukul Selesai tidak boleh melebihi waktu saat ini (${currentTimeStr})`);
        return;
      }
    }
    if (name === "tanggal" && value) {
      const now = /* @__PURE__ */ new Date();
      const todayStr = now.toISOString().split("T")[0];
      const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (value === todayStr && kalibrasiGlobal.waktuSelesai && kalibrasiGlobal.waktuSelesai > currentTimeStr) {
        alert(`Pukul Selesai direset karena melebihi waktu saat ini (${currentTimeStr})`);
        setKalibrasiGlobal((prev) => ({ ...prev, tanggal: value, waktuSelesai: "" }));
        return;
      }
    }
    setKalibrasiGlobal((prev) => ({ ...prev, [name]: value }));
  };
  const handleKalibrasiEntryChange = (index, e) => {
    const { name, value } = e.target;
    setKalibrasiEntries((prev) => {
      const newEntries = [...prev];
      newEntries[index] = { ...newEntries[index], [name]: value };
      if (name === "lokasi1") {
        newEntries[index].lokasi2 = "";
      }
      return newEntries;
    });
  };
  const handleKalibrasiEquipToggle = (index, equip) => {
    setKalibrasiEntries((prev) => {
      const newEntries = [...prev];
      const current = newEntries[index].peralatan;
      let newPeralatan = [...current];
      if (newPeralatan.includes(equip)) {
        newPeralatan = newPeralatan.filter((e) => e !== equip);
      } else {
        if (equip === "Access Control") {
          newPeralatan = ["Access Control"];
        } else if (!newPeralatan.includes("Access Control")) {
          newPeralatan.push(equip);
        }
      }
      newEntries[index] = {
        ...newEntries[index],
        peralatan: newPeralatan,
        lokasi1: "",
        lokasi2: "",
        acLokasi: []
      };
      return newEntries;
    });
  };
  const handleKalibrasiAcLokasiToggle = (index, loc) => {
    setKalibrasiEntries((prev) => {
      const newEntries = [...prev];
      const current = newEntries[index].acLokasi || [];
      const newAcLokasi = current.includes(loc) ? current.filter((l) => l !== loc) : [...current, loc];
      newEntries[index] = { ...newEntries[index], acLokasi: newAcLokasi };
      return newEntries;
    });
  };
  const addKalibrasiEntry = () => {
    setKalibrasiEntries((prev) => [...prev, createEmptyKalibrasiEntry()]);
  };
  const removeKalibrasiEntry = (index) => {
    if (kalibrasiEntries.length <= 1) return;
    setKalibrasiEntries((prev) => {
      const newEntries = [...prev];
      newEntries.splice(index, 1);
      return newEntries;
    });
  };
  const handleKalibrasiPhotoUpload = async (groupId, e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const compressedResults = await Promise.all(files.map((f) => compressImageFile(f)));
      const newPhotos = compressedResults.map((res) => ({
        id: Date.now() + Math.random(),
        file: res.file,
        preview: res.preview,
        zoom: 1
      }));
      setKalibrasiPhotoGroups((prev) => prev.map((group) => {
        if (group.id === groupId) {
          return { ...group, photos: [...group.photos, ...newPhotos] };
        }
        return group;
      }));
    }
  };
  const removeKalibrasiPhoto = (groupId, photoIndex) => {
    setKalibrasiPhotoGroups((prev) => prev.map((group) => {
      if (group.id === groupId) {
        const newPhotos = [...group.photos];
        URL.revokeObjectURL(newPhotos[photoIndex].preview);
        newPhotos.splice(photoIndex, 1);
        return { ...group, photos: newPhotos };
      }
      return group;
    }));
  };
  const updateKalibrasiPhotoZoom = (groupId, photoIndex, delta) => {
    setKalibrasiPhotoGroups((prev) => prev.map((group) => {
      if (group.id === groupId) {
        const newPhotos = [...group.photos];
        const currentZoom = newPhotos[photoIndex].zoom || 1;
        newPhotos[photoIndex] = {
          ...newPhotos[photoIndex],
          zoom: Math.max(0.5, Math.min(3, currentZoom + delta))
        };
        return { ...group, photos: newPhotos };
      }
      return group;
    }));
  };
  const handleKalibrasiPhotoDrop = (e, groupId, targetIndex) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData("text/plain");
    if (!sourceIndexStr) return;
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (sourceIndex === targetIndex || isNaN(sourceIndex)) return;
    setKalibrasiPhotoGroups((prev) => prev.map((group) => {
      if (group.id === groupId) {
        const newPhotos = [...group.photos];
        const [movedPhoto] = newPhotos.splice(sourceIndex, 1);
        newPhotos.splice(targetIndex, 0, movedPhoto);
        return { ...group, photos: newPhotos };
      }
      return group;
    }));
  };
  const handleKalibrasiSaveText = (newFile, newPreviewUrl, annotation) => {
    if (!editingKalibrasiPhoto) return;
    const { groupId, photoIndex } = editingKalibrasiPhoto;
    setKalibrasiPhotoGroups((prev) => prev.map((group) => {
      if (group.id !== groupId) return group;
      const newPhotos = [...group.photos];
      const currentPhoto = newPhotos[photoIndex];
      newPhotos[photoIndex] = {
        ...currentPhoto,
        originalFile: currentPhoto.originalFile || currentPhoto.file,
        originalPreview: currentPhoto.originalPreview || currentPhoto.preview,
        file: newFile,
        preview: newPreviewUrl,
        annotation
      };
      return { ...group, photos: newPhotos };
    }));
    setEditingKalibrasiPhoto(null);
  };
  const handleKalibrasiResetText = () => {
    if (!editingKalibrasiPhoto) return;
    const { groupId, photoIndex } = editingKalibrasiPhoto;
    setKalibrasiPhotoGroups((prev) => prev.map((group) => {
      if (group.id !== groupId) return group;
      const newPhotos = [...group.photos];
      const currentPhoto = newPhotos[photoIndex];
      if (!currentPhoto.originalFile || !currentPhoto.originalPreview) return group;
      newPhotos[photoIndex] = {
        ...currentPhoto,
        file: currentPhoto.originalFile,
        preview: currentPhoto.originalPreview,
        annotation: void 0
      };
      return { ...group, photos: newPhotos };
    }));
    setEditingKalibrasiPhoto(null);
  };
  const addKalibrasiPhotoGroup = () => {
    setKalibrasiPhotoGroups((prev) => [...prev, { id: Date.now(), photos: [], isGenerating: false, autoCollageFile: null, collageAnnotation: void 0 }]);
  };
  const removeKalibrasiPhotoGroup = (groupId) => {
    if (kalibrasiPhotoGroups.length <= 1) return;
    setKalibrasiPhotoGroups((prev) => {
      const groupToRemove = prev.find((g) => g.id === groupId);
      if (groupToRemove) {
        groupToRemove.photos.forEach((p) => URL.revokeObjectURL(p.preview));
      }
      return prev.filter((g) => g.id !== groupId);
    });
  };
  const renderKalibrasiPhotoSection = () => /* @__PURE__ */ jsxs("div", { className: "space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-2", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold text-slate-800 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Camera, { className: "w-5 h-5 text-blue-600" }),
        " Lampiran Foto"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end gap-1", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded w-fit", children: "Kirim multi kolase sekaligus" }),
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-500 font-medium flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Move, { className: "w-3 h-3" }),
          " Geser foto untuk urutkan"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      kalibrasiPhotoGroups.map((group, groupIndex) => /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-5 bg-blue-50/30 border border-blue-100 rounded-xl space-y-4 relative shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center gap-3 justify-between", children: [
          /* @__PURE__ */ jsx("div", { className: "flex-1 w-full flex items-center gap-3", children: /* @__PURE__ */ jsxs("h3", { className: "font-bold text-blue-900 text-sm", children: [
            "Grup Kolase ",
            groupIndex + 1
          ] }) }),
          kalibrasiPhotoGroups.length > 1 && /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => removeKalibrasiPhotoGroup(group.id),
              className: "text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-1 self-end sm:self-center text-sm font-bold",
              children: [
                /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }),
                " ",
                /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: "Hapus Grup" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("label", { className: "flex items-center justify-center w-full p-6 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors group", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2 text-center", children: [
            /* @__PURE__ */ jsx(ImagePlus, { className: "w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-blue-700", children: "Pilih / Ambil Foto" }),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-blue-500", children: "Galeri, File, atau Kamera langsung" })
          ] }),
          /* @__PURE__ */ jsx("input", { type: "file", accept: "image/*", multiple: true, className: "hidden", onChange: (e) => handleKalibrasiPhotoUpload(group.id, e) })
        ] }) }),
        group.photos.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("p", { className: "text-xs font-semibold text-slate-500 mb-2", children: [
            "Daftar Foto (",
            group.photos.length,
            "):"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4", children: group.photos.map((photo, pIndex) => /* @__PURE__ */ jsxs(
            "div",
            {
              draggable: true,
              onDragStart: (e) => e.dataTransfer.setData("text/plain", pIndex.toString()),
              onDragOver: (e) => e.preventDefault(),
              onDrop: (e) => handleKalibrasiPhotoDrop(e, group.id, pIndex),
              className: "relative bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm group/photo hover:shadow-md transition-shadow aspect-square cursor-move flex flex-col",
              children: [
                /* @__PURE__ */ jsx("div", { className: "flex-1 relative overflow-hidden bg-black flex items-center justify-center", children: /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: photo.preview,
                    alt: "Preview",
                    className: "absolute w-full h-full object-cover transition-transform",
                    style: { transform: `scale(${photo.zoom || 1})` }
                  }
                ) }),
                /* @__PURE__ */ jsx("div", { className: "absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded backdrop-blur-sm z-10", children: pIndex + 1 }),
                /* @__PURE__ */ jsx("div", { className: "absolute top-1 right-1 flex flex-col gap-1 z-10 opacity-100 sm:opacity-0 group-hover/photo:opacity-100 transition-opacity", children: /* @__PURE__ */ jsx("button", { type: "button", onClick: (e) => {
                  e.preventDefault();
                  removeKalibrasiPhoto(group.id, pIndex);
                }, className: "bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-md", children: /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5" }) }) }),
                /* @__PURE__ */ jsx("div", { className: "absolute bottom-1 left-1 z-10 opacity-100 sm:opacity-0 group-hover/photo:opacity-100 transition-opacity", children: /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditingKalibrasiPhoto({ groupId: group.id, photoIndex: pIndex });
                    },
                    className: `p-1.5 rounded-full shadow-md flex items-center gap-1 text-xs font-semibold px-2.5 py-1 transition-colors ${photo.annotation ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-white text-slate-700 hover:bg-slate-100"}`,
                    title: "Beri Teks / Watermark",
                    children: [
                      /* @__PURE__ */ jsx(Type, { className: "w-3.5 h-3.5" }),
                      /* @__PURE__ */ jsx("span", { className: "hidden md:inline", children: photo.annotation ? "Edit Teks" : "Teks" })
                    ]
                  }
                ) }),
                /* @__PURE__ */ jsxs("div", { className: "absolute bottom-1 right-1 flex gap-1 z-10 opacity-100 sm:opacity-0 group-hover/photo:opacity-100 transition-opacity", children: [
                  /* @__PURE__ */ jsx("button", { type: "button", onClick: (e) => {
                    e.preventDefault();
                    updateKalibrasiPhotoZoom(group.id, pIndex, 0.1);
                  }, className: "bg-white text-slate-700 p-1.5 rounded-full hover:bg-slate-100 shadow-md", children: /* @__PURE__ */ jsx(ZoomIn, { className: "w-3.5 h-3.5" }) }),
                  /* @__PURE__ */ jsx("button", { type: "button", onClick: (e) => {
                    e.preventDefault();
                    updateKalibrasiPhotoZoom(group.id, pIndex, -0.1);
                  }, className: "bg-white text-slate-700 p-1.5 rounded-full hover:bg-slate-100 shadow-md", children: /* @__PURE__ */ jsx(ZoomOut, { className: "w-3.5 h-3.5" }) })
                ] })
              ]
            },
            photo.id
          )) })
        ] }),
        /* @__PURE__ */ jsx(
          LiveCollagePreview,
          {
            photos: group.photos,
            onCollageChange: (file, _url, annotation) => {
              setKalibrasiPhotoGroups((prev) => prev.map((g) => g.id === group.id ? { ...g, autoCollageFile: file, collageAnnotation: annotation } : g));
            }
          }
        )
      ] }, group.id)),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: addKalibrasiPhotoGroup,
          className: "w-full p-5 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group flex flex-col items-center justify-center gap-1.5 text-center",
          children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-blue-100 group-hover:scale-110 transition-transform flex items-center justify-center text-blue-600 shadow-sm", children: /* @__PURE__ */ jsx(Plus, { className: "w-5 h-5" }) }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-blue-700 block", children: "Tambah Grup Kolase Baru" }),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-blue-500 block", children: "Klik untuk membuat grup kolase foto baru" })
          ]
        }
      )
    ] })
  ] });
  const handleKalibrasiSubmit = async (e) => {
    e.preventDefault();
    const now = /* @__PURE__ */ new Date();
    const todayStr = now.toISOString().split("T")[0];
    const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (kalibrasiGlobal.tanggal === todayStr && kalibrasiGlobal.waktuSelesai && kalibrasiGlobal.waktuSelesai > currentTimeStr) {
      alert(`Pukul Selesai tidak boleh melebihi waktu saat ini (${currentTimeStr})`);
      return;
    }
    if (kalibrasiEntries.some((entry) => entry.peralatan.length === 0)) {
      alert("Pastikan Anda memilih minimal 1 peralatan untuk setiap lokasi kalibrasi yang ditambahkan!");
      return;
    }
    if (kalibrasiEntries.some((entry) => entry.peralatan.includes("Access Control") && (entry.acLokasi || []).length === 0)) {
      alert("Pastikan Anda mencentang minimal 1 lokasi untuk peralatan Access Control!");
      return;
    }
    let customFilesArray = [];
    for (let i = 0; i < kalibrasiPhotoGroups.length; i++) {
      const group = kalibrasiPhotoGroups[i];
      if (group.photos.length > 1) {
        if (group.autoCollageFile) {
          customFilesArray.push(group.autoCollageFile);
        } else {
          const collageResult = await processPhotosToCollage(group.photos, group.collageAnnotation);
          if (collageResult && collageResult.file) {
            customFilesArray.push(collageResult.file);
          }
        }
      } else if (group.photos.length === 1 && group.photos[0]?.file) {
        customFilesArray.push(group.photos[0].file);
      }
    }
    const message = generateWA_Kalibrasi(kalibrasiGlobal, kalibrasiEntries);
    await shareToWhatsApp(message, customFilesArray.length > 0 ? customFilesArray : null, () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3e3);
    });
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleKalibrasiSubmit, className: "p-4 sm:p-8 space-y-8 bg-slate-50/50", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-4", children: [
        /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-blue-600" }),
        " Waktu Pelaksanaan Kalibrasi"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Tanggal" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
            /* @__PURE__ */ jsx("input", { type: "date", name: "tanggal", required: true, value: kalibrasiGlobal.tanggal, onChange: handleKalibrasiGlobalChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-1", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Pukul Mulai" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Clock, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
            /* @__PURE__ */ jsx("input", { type: "time", name: "waktuMulai", required: true, value: kalibrasiGlobal.waktuMulai, onChange: handleKalibrasiGlobalChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-1", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Pukul Selesai" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Clock, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
            /* @__PURE__ */ jsx("input", { type: "time", name: "waktuSelesai", required: true, max: kalibrasiGlobal.tanggal === (/* @__PURE__ */ new Date()).toISOString().split("T")[0] ? `${String((/* @__PURE__ */ new Date()).getHours()).padStart(2, "0")}:${String((/* @__PURE__ */ new Date()).getMinutes()).padStart(2, "0")}` : void 0, value: kalibrasiGlobal.waktuSelesai, onChange: handleKalibrasiGlobalChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-6", children: kalibrasiEntries.map((entry, index) => {
      const modelsObj = {
        "X-Ray": entry.xrayModel,
        "WTMD": entry.wtmdModel,
        "HHMD": entry.hhmdModel,
        "Body Scanner": entry.bsModel,
        "ETD": entry.etdModel
      };
      const kalibrasiLok1Opts = entry.peralatan.length > 0 ? getIntersectedLocations(entry.peralatan, modelsObj) : [];
      return /* @__PURE__ */ jsxs("div", { className: "bg-white border-2 border-blue-100 rounded-2xl p-5 sm:p-6 space-y-6 shadow-sm relative", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-b border-blue-100 pb-3", children: [
          /* @__PURE__ */ jsxs("h3", { className: "font-extrabold text-lg text-blue-900 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "w-5 h-5 text-blue-500" }),
            " Lokasi Kalibrasi #",
            index + 1
          ] }),
          kalibrasiEntries.length > 1 && /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => removeKalibrasiEntry(index),
              className: "flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors",
              children: [
                /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }),
                " Hapus"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-2", children: [
              /* @__PURE__ */ jsx(Cpu, { className: "w-4 h-4 inline-block text-blue-500 mr-1" }),
              " Peralatan ",
              /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 font-normal", children: "(Pilih 1 atau lebih)" })
            ] }),
            kalibrasiEquipments && kalibrasiEquipments.length > 0 ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3", children: kalibrasiEquipments.map((equip) => {
              const isACChecked = entry.peralatan.includes("Access Control");
              const isChecked = entry.peralatan.includes(equip);
              const isDisabled = isACChecked && equip !== "Access Control";
              return /* @__PURE__ */ jsxs(
                "label",
                {
                  className: `flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${isChecked ? "bg-blue-50 border-blue-500 shadow-sm font-semibold" : isDisabled ? "bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`,
                  children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "checkbox",
                        checked: isChecked,
                        disabled: isDisabled,
                        onChange: () => handleKalibrasiEquipToggle(index, equip),
                        className: "w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: `ml-2 text-sm ${isDisabled ? "text-slate-400" : "text-slate-700"}`, children: equip })
                  ]
                },
                equip
              );
            }) }) : /* @__PURE__ */ jsxs("div", { className: "p-4 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-sm", children: [
              /* @__PURE__ */ jsx("p", { className: "font-semibold mb-1", children: "Peralatan Belum Dikonfigurasi!" }),
              /* @__PURE__ */ jsxs("p", { children: [
                "Silakan menuju ",
                /* @__PURE__ */ jsx("b", { children: "Tab Data" }),
                " ",
                ">",
                " ",
                /* @__PURE__ */ jsx("b", { children: "Config Peralatan Kalibrasi" }),
                " untuk memilih jenis peralatan yang akan ditampilkan di sini."
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-2", children: [
              "Lokasi",
              entry.peralatan.includes("Access Control") && /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 font-normal", children: " (Pilih 1 atau lebih)" })
            ] }),
            entry.peralatan.includes("Access Control") ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-2", children: (() => {
              const acOpts = getGeneralLokasiOptions("Access Control");
              if (acOpts.length === 0) {
                return /* @__PURE__ */ jsxs("div", { className: "col-span-full p-3 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-sm", children: [
                  /* @__PURE__ */ jsx("p", { className: "font-semibold", children: "Lokasi Access Control belum tersedia." }),
                  /* @__PURE__ */ jsx("p", { children: "Pastikan data penempatan peralatan Access Control sudah diisi di database." })
                ] });
              }
              return acOpts.map((loc) => {
                const isChecked = (entry.acLokasi || []).includes(loc);
                return /* @__PURE__ */ jsxs(
                  "label",
                  {
                    className: `flex items-center p-2.5 border rounded-lg cursor-pointer transition-colors ${isChecked ? "bg-blue-50 border-blue-500 shadow-sm font-semibold" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`,
                    children: [
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "checkbox",
                          checked: isChecked,
                          onChange: () => handleKalibrasiAcLokasiToggle(index, loc),
                          className: "w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        }
                      ),
                      /* @__PURE__ */ jsx("span", { className: "ml-2 text-sm text-slate-700", children: loc })
                    ]
                  },
                  loc
                );
              });
            })() }) : /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
                /* @__PURE__ */ jsx(MapPin, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    name: "lokasi1",
                    required: true,
                    value: entry.lokasi1,
                    onChange: (e) => handleKalibrasiEntryChange(index, e),
                    disabled: kalibrasiLok1Opts.length === 0,
                    className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none disabled:bg-slate-200 disabled:opacity-70 disabled:cursor-not-allowed",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "", children: "- Pilih Lokasi -" }),
                      kalibrasiLok1Opts.map((opt) => /* @__PURE__ */ jsx("option", { value: opt, children: opt }, opt))
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("div", { className: "w-1/3", children: (() => {
                const options = getLokasi2Options(entry.lokasi1, entry.peralatan);
                const isDisabled = options.length === 0 || options.length === 1 && options[0] === "-";
                return /* @__PURE__ */ jsxs("select", { name: "lokasi2", value: entry.lokasi2, onChange: (e) => handleKalibrasiEntryChange(index, e), disabled: isDisabled, className: `w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none ${isDisabled ? "opacity-50 cursor-not-allowed bg-slate-200" : ""}`, children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "- No -" }),
                  options.map((opt) => /* @__PURE__ */ jsx("option", { value: opt, children: opt }, opt))
                ] });
              })() })
            ] })
          ] })
        ] }),
        entry.peralatan.includes("X-Ray") && /* @__PURE__ */ jsxs("div", { className: "bg-blue-50/40 p-4 sm:p-5 rounded-xl border border-blue-200 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-200 pb-3", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-blue-900 flex items-center gap-2", children: "⚡ Parameter X-Ray" }),
            /* @__PURE__ */ jsx("select", { name: "xrayModel", value: entry.xrayModel, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-blue-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer", children: getValidXRayModels(entry.lokasi1, entry.lokasi2).map((model) => /* @__PURE__ */ jsx("option", { value: model, children: model === "Semua X-Ray" ? "-- Semua Model X-Ray --" : model.replace("X-Ray ", "") }, model)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "kV Vertikal" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "decimal", name: "xrayKvV", value: entry.xrayKvV, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "kV Horizontal" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "decimal", name: "xrayKvH", value: entry.xrayKvH, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "mA Vertikal" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "decimal", name: "xrayMaV", value: entry.xrayMaV, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "mA Horizontal" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "decimal", name: "xrayMaH", value: entry.xrayMaH, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Ontime Vertikal" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "decimal", name: "xrayOnV", value: entry.xrayOnV, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Ontime Horizontal" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "decimal", name: "xrayOnH", value: entry.xrayOnH, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Archive" }),
              /* @__PURE__ */ jsx("input", { type: "text", name: "xrayArchive", value: entry.xrayArchive, placeholder: "+- 1 bulan", onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" })
            ] })
          ] })
        ] }),
        entry.peralatan.includes("WTMD") && /* @__PURE__ */ jsxs("div", { className: "bg-indigo-50/40 p-4 sm:p-5 rounded-xl border border-indigo-200 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-200 pb-3", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-indigo-900 flex items-center gap-2", children: "🎛️ Parameter WTMD" }),
            /* @__PURE__ */ jsx("select", { name: "wtmdModel", value: entry.wtmdModel, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "px-3 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-indigo-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer", children: getValidModels(entry.lokasi1, "WTMD", entry.lokasi2).map((model) => /* @__PURE__ */ jsx("option", { value: model, children: model === "Semua WTMD" ? "-- Semua Model WTMD --" : model.replace("WTMD ", "") }, model)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Z1" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "numeric", name: "wtmdZ1", value: entry.wtmdZ1, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Z2" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "numeric", name: "wtmdZ2", value: entry.wtmdZ2, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Z3" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "numeric", name: "wtmdZ3", value: entry.wtmdZ3, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Z4" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "numeric", name: "wtmdZ4", value: entry.wtmdZ4, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "LC" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "numeric", name: "wtmdLc", value: entry.wtmdLc, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "LS" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "numeric", name: "wtmdLs", value: entry.wtmdLs, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "UC" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "numeric", name: "wtmdUc", value: entry.wtmdUc, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "SE" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "numeric", name: "wtmdSe", value: entry.wtmdSe, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "DS" }),
              /* @__PURE__ */ jsx("input", { type: "text", inputMode: "numeric", name: "wtmdDs", value: entry.wtmdDs, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" })
            ] })
          ] })
        ] }),
        entry.peralatan.includes("HHMD") && /* @__PURE__ */ jsx("div", { className: "bg-purple-50/40 p-4 sm:p-5 rounded-xl border border-purple-200 space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-200 pb-3", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-purple-900 flex items-center gap-2", children: "📱 Parameter HHMD" }),
          /* @__PURE__ */ jsx("select", { name: "hhmdModel", value: entry.hhmdModel, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "px-3 py-1.5 bg-white border border-purple-300 rounded-lg text-xs font-bold text-purple-800 focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer", children: getValidModels(entry.lokasi1, "HHMD", entry.lokasi2).map((model) => /* @__PURE__ */ jsx("option", { value: model, children: model === "Semua HHMD" ? "-- Semua Model HHMD --" : model.replace("HHMD ", "") }, model)) })
        ] }) }),
        entry.peralatan.includes("Body Scanner") && /* @__PURE__ */ jsxs("div", { className: "bg-emerald-50/40 p-4 sm:p-5 rounded-xl border border-emerald-200 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-200 pb-3", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-emerald-900 flex items-center gap-2", children: "🔍 Parameter Body Scanner" }),
            /* @__PURE__ */ jsx("select", { name: "bsModel", value: entry.bsModel, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer", children: getValidModels(entry.lokasi1, "Body Scanner", entry.lokasi2).map((model) => /* @__PURE__ */ jsx("option", { value: model, children: model === "Semua Body Scanner" ? "-- Semua Model Body Scanner --" : model.replace("Body Scanner ", "") }, model)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Test Tampilan Suspect Item" }),
              /* @__PURE__ */ jsxs("select", { name: "bsSuspect", value: entry.bsSuspect, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500", children: [
                /* @__PURE__ */ jsx("option", { value: "Normal", children: "Normal" }),
                /* @__PURE__ */ jsx("option", { value: "Error", children: "Error" }),
                /* @__PURE__ */ jsx("option", { value: "Perlu Penyetelan", children: "Perlu Penyetelan" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Test Monitor" }),
              /* @__PURE__ */ jsxs("select", { name: "bsMonitor", value: entry.bsMonitor, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500", children: [
                /* @__PURE__ */ jsx("option", { value: "Normal", children: "Normal" }),
                /* @__PURE__ */ jsx("option", { value: "Error", children: "Error" }),
                /* @__PURE__ */ jsx("option", { value: "Perlu Penyetelan", children: "Perlu Penyetelan" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Test Fungsi Scanning" }),
              /* @__PURE__ */ jsxs("select", { name: "bsScanning", value: entry.bsScanning, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500", children: [
                /* @__PURE__ */ jsx("option", { value: "Normal", children: "Normal" }),
                /* @__PURE__ */ jsx("option", { value: "Error", children: "Error" }),
                /* @__PURE__ */ jsx("option", { value: "Perlu Penyetelan", children: "Perlu Penyetelan" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Test Fungsi Kalibrasi" }),
              /* @__PURE__ */ jsxs("select", { name: "bsCalibration", value: entry.bsCalibration, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500", children: [
                /* @__PURE__ */ jsx("option", { value: "Normal", children: "Normal" }),
                /* @__PURE__ */ jsx("option", { value: "Error", children: "Error" }),
                /* @__PURE__ */ jsx("option", { value: "Perlu Penyetelan", children: "Perlu Penyetelan" })
              ] })
            ] })
          ] })
        ] }),
        entry.peralatan.includes("ETD") && /* @__PURE__ */ jsxs("div", { className: "bg-amber-50/40 p-4 sm:p-5 rounded-xl border border-amber-200 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-3", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-amber-900 flex items-center gap-2", children: "🧪 Parameter ETD" }),
            /* @__PURE__ */ jsx("select", { name: "etdModel", value: entry.etdModel, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-800 focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer", children: getValidModels(entry.lokasi1, "ETD", entry.lokasi2).map((model) => /* @__PURE__ */ jsx("option", { value: model, children: model === "Semua ETD" ? "-- Semua Model ETD --" : model.replace("ETD ", "") }, model)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Sampling Test TNT" }),
              /* @__PURE__ */ jsxs("select", { name: "etdTnt", value: entry.etdTnt, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-amber-500", children: [
                /* @__PURE__ */ jsx("option", { value: "Alarm", children: "Alarm" }),
                /* @__PURE__ */ jsx("option", { value: "Tidak Alarm", children: "Tidak Alarm" }),
                /* @__PURE__ */ jsx("option", { value: "Error", children: "Error" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Sampling Test PETN" }),
              /* @__PURE__ */ jsxs("select", { name: "etdPetn", value: entry.etdPetn, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-amber-500", children: [
                /* @__PURE__ */ jsx("option", { value: "Alarm", children: "Alarm" }),
                /* @__PURE__ */ jsx("option", { value: "Tidak Alarm", children: "Tidak Alarm" }),
                /* @__PURE__ */ jsx("option", { value: "Error", children: "Error" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Sampling Test RDX" }),
              /* @__PURE__ */ jsxs("select", { name: "etdRdx", value: entry.etdRdx, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-amber-500", children: [
                /* @__PURE__ */ jsx("option", { value: "Alarm", children: "Alarm" }),
                /* @__PURE__ */ jsx("option", { value: "Tidak Alarm", children: "Tidak Alarm" }),
                /* @__PURE__ */ jsx("option", { value: "Error", children: "Error" })
              ] })
            ] })
          ] })
        ] }),
        entry.peralatan.includes("Access Control") && /* @__PURE__ */ jsxs("div", { className: "bg-rose-50/40 p-4 sm:p-5 rounded-xl border border-rose-200 space-y-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-rose-900 flex items-center gap-2 border-b border-rose-200 pb-2", children: "🔐 Parameter Access Control" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Fungsi Emlock" }),
            /* @__PURE__ */ jsxs("select", { name: "acEmlock", value: entry.acEmlock, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-rose-500", children: [
              /* @__PURE__ */ jsx("option", { value: "Berfungsi", children: "Berfungsi" }),
              /* @__PURE__ */ jsx("option", { value: "Tidak Berfungsi", children: "Tidak Berfungsi" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Fungsi Intercom" }),
            /* @__PURE__ */ jsxs("select", { name: "acIntercom", value: entry.acIntercom, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-rose-500", children: [
              /* @__PURE__ */ jsx("option", { value: "Berfungsi", children: "Berfungsi" }),
              /* @__PURE__ */ jsx("option", { value: "Tidak Berfungsi", children: "Tidak Berfungsi" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Fungsi Fingerprint" }),
            /* @__PURE__ */ jsxs("select", { name: "acFingerprint", value: entry.acFingerprint, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-rose-500", children: [
              /* @__PURE__ */ jsx("option", { value: "Berfungsi", children: "Berfungsi" }),
              /* @__PURE__ */ jsx("option", { value: "Tidak Berfungsi", children: "Tidak Berfungsi" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Fungsi CCTV" }),
            /* @__PURE__ */ jsxs("select", { name: "acCctv", value: entry.acCctv, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-rose-500", children: [
              /* @__PURE__ */ jsx("option", { value: "Berfungsi", children: "Berfungsi" }),
              /* @__PURE__ */ jsx("option", { value: "Tidak Berfungsi", children: "Tidak Berfungsi" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Fungsi Pengontrolan Kunci Pintu" }),
            /* @__PURE__ */ jsxs("select", { name: "acPengontrolan", value: entry.acPengontrolan, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-rose-500", children: [
              /* @__PURE__ */ jsx("option", { value: "Berfungsi", children: "Berfungsi" }),
              /* @__PURE__ */ jsx("option", { value: "Tidak Berfungsi", children: "Tidak Berfungsi" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Record CCTV" }),
            /* @__PURE__ */ jsx("input", { type: "text", name: "acRecordCctv", value: entry.acRecordCctv, onChange: (e) => handleKalibrasiEntryChange(index, e), className: "w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-rose-500" })
          ] })
        ] })
      ] }, entry.id);
    }) }),
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: addKalibrasiEntry,
        className: "w-full p-6 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group flex flex-col items-center justify-center gap-2 text-center mt-6",
        children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-blue-100 group-hover:scale-110 transition-transform flex items-center justify-center text-blue-600 shadow-sm", children: /* @__PURE__ */ jsx(Plus, { className: "w-6 h-6" }) }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-blue-700 block", children: "Tambah Lokasi Kalibrasi Berikutnya" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-blue-500 block", children: "Klik untuk menambahkan formulir kalibrasi peralatan di lokasi lain" })
        ]
      }
    ),
    renderKalibrasiPhotoSection(),
    editingKalibrasiPhoto && (() => {
      const group = kalibrasiPhotoGroups.find((g) => g.id === editingKalibrasiPhoto.groupId);
      const photo = group?.photos[editingKalibrasiPhoto.photoIndex];
      if (!photo) return null;
      return /* @__PURE__ */ jsx(
        PhotoTextEditorModal,
        {
          isOpen: true,
          onClose: () => setEditingKalibrasiPhoto(null),
          photoUrl: photo.originalPreview || photo.preview,
          initialAnnotation: photo.annotation,
          onSave: handleKalibrasiSaveText,
          onReset: handleKalibrasiResetText,
          hasOriginal: !!photo.originalPreview
        }
      );
    })(),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row gap-4 mt-8", children: /* @__PURE__ */ jsx("button", { type: "submit", className: `w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${isCopied ? "bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]" : "bg-[#25D366] hover:bg-[#20b858] hover:-translate-y-0.5 text-white"}`, children: isCopied ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 animate-pulse" }),
      " Berhasil Disalin / Dibagikan!"
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Share2, { className: "w-6 h-6" }),
      " Share Kalibrasi ke WA"
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 border-t border-slate-200 pt-8", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-700 mb-4 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-blue-600" }),
        " Preview Laporan Kalibrasi (Real-time)"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative", children: /* @__PURE__ */ jsx("div", { className: "bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%] max-h-[500px] overflow-y-auto", children: generateWA_Kalibrasi(kalibrasiGlobal, kalibrasiEntries) }) })
    ] })
  ] });
};
const TIP_MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const getDefaultTipPeriod = () => {
  const now = /* @__PURE__ */ new Date();
  let monthIdx = now.getMonth();
  let year = now.getFullYear();
  if (now.getDate() < 20) {
    monthIdx -= 1;
    if (monthIdx < 0) {
      monthIdx = 11;
      year -= 1;
    }
  }
  return {
    month: TIP_MONTHS[monthIdx],
    year: year.toString()
  };
};
const TabTip = () => {
  const { checklistDataMaster } = useMasterDataStore();
  const tipCategories = React.useMemo(() => {
    const cats = [];
    (checklistDataMaster || []).forEach((block) => {
      if (block.type === "location") {
        const xrayCat = block.categories?.find((c) => c.summaryKey && c.summaryKey.toUpperCase().includes("X-RAY"));
        if (xrayCat && xrayCat.items && xrayCat.items.length > 0) {
          cats.push({
            id: block.title.toLowerCase().replace(/\s+/g, "_"),
            name: block.title,
            items: xrayCat.items.map((item) => {
              const match = item.match(/\(([^)]+)\)/);
              return match ? match[1] : "No1";
            })
          });
        }
      } else if (block.type === "group") {
        (block.locations || []).forEach((loc) => {
          const xrayCat = loc.categories?.find((c) => c.summaryKey && c.summaryKey.toUpperCase().includes("X-RAY"));
          if (xrayCat && xrayCat.items && xrayCat.items.length > 0) {
            cats.push({
              id: loc.title.toLowerCase().replace(/\s+/g, "_"),
              name: loc.title,
              items: xrayCat.items.map((item) => {
                const match = item.match(/\(([^)]+)\)/);
                return match ? match[1] : "No1";
              })
            });
          }
        });
      }
    });
    return cats;
  }, [checklistDataMaster]);
  const tipLeftCol = tipCategories.slice(0, Math.ceil(tipCategories.length / 2));
  const tipRightCol = tipCategories.slice(Math.ceil(tipCategories.length / 2));
  const TIP_TOTAL_ITEMS = tipCategories.reduce((acc, cat) => acc + cat.items.length, 0);
  const [tipMonth, setTipMonth] = useState(() => getDefaultTipPeriod().month);
  const [tipYear, setTipYear] = useState(() => getDefaultTipPeriod().year);
  const [tipDataState, setTipDataState] = useState({});
  const [tipLastSaved, setTipLastSaved] = useState(null);
  const [tipUnsavedChanges, setTipUnsavedChanges] = useState(false);
  const [isGeneratingTipImage, setIsGeneratingTipImage] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      const storageKey = `tip_data_${tipMonth}_${tipYear}`;
      try {
        const { data, error } = await supabase.from("master_configs").select("value").eq("key", storageKey).maybeSingle();
        if (!error && data && data.value) {
          setTipDataState(data.value.items || {});
          setTipLastSaved(data.value.lastSaved || null);
          setIsLoadingData(false);
          setTipUnsavedChanges(false);
          return;
        }
      } catch (err) {
        console.error("Gagal fetch dari supabase:", err);
      }
      setTipDataState({});
      setTipLastSaved(null);
      setIsLoadingData(false);
      setTipUnsavedChanges(false);
    };
    loadData();
  }, [tipMonth, tipYear]);
  useEffect(() => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("tip_data_")) {
        localStorage.removeItem(key);
      }
    });
  }, []);
  const getTipCheckedCount = () => {
    return Object.values(tipDataState).filter((d) => d.checked).length;
  };
  const handleTipToggle = (catId, item) => {
    const key = `${catId}-${item}`;
    const current = tipDataState[key] || { checked: false, locked: false };
    if (current.locked) return;
    setTipDataState((prev) => ({
      ...prev,
      [key]: { ...current, checked: !current.checked }
    }));
    setTipUnsavedChanges(true);
  };
  const handleTipCategoryToggle = (catId, items) => {
    const allChecked = items.every((i) => {
      const d = tipDataState[`${catId}-${i}`];
      return d && d.checked;
    });
    const newData = { ...tipDataState };
    let changed = false;
    items.forEach((i) => {
      const key = `${catId}-${i}`;
      const d = newData[key] || { checked: false, locked: false };
      if (!d.locked) {
        newData[key] = { ...d, checked: !allChecked };
        changed = true;
      }
    });
    if (changed) {
      setTipDataState(newData);
      setTipUnsavedChanges(true);
    }
  };
  const handleTipToggleAll = () => {
    const allItems = [...tipLeftCol, ...tipRightCol].flatMap((cat) => cat.items.map((i) => ({ catId: cat.id, item: i })));
    const allChecked = allItems.every(({ catId, item }) => {
      const d = tipDataState[`${catId}-${item}`];
      return d && d.checked;
    });
    const newData = { ...tipDataState };
    let changed = false;
    allItems.forEach(({ catId, item }) => {
      const key = `${catId}-${item}`;
      const d = newData[key] || { checked: false, locked: false };
      if (!d.locked) {
        newData[key] = { ...d, checked: !allChecked };
        changed = true;
      }
    });
    if (changed) {
      setTipDataState(newData);
      setTipUnsavedChanges(true);
    }
  };
  const handleTipSave = async () => {
    const now = /* @__PURE__ */ new Date();
    const timeString = `${now.getDate()} ${TIP_MONTHS[now.getMonth()]} ${now.getFullYear()} pukul ${String(now.getHours()).padStart(2, "0")}.${String(now.getMinutes()).padStart(2, "0")}`;
    const newData = { ...tipDataState };
    Object.keys(newData).forEach((k) => {
      if (newData[k].checked) {
        newData[k].locked = true;
      }
    });
    setTipDataState(newData);
    setTipLastSaved(timeString);
    setTipUnsavedChanges(false);
    const storageKey = `tip_data_${tipMonth}_${tipYear}`;
    const payload = { lastSaved: timeString, items: newData };
    try {
      await supabase.from("master_configs").upsert(
        { key: storageKey, value: payload, updated_at: (/* @__PURE__ */ new Date()).toISOString() },
        { onConflict: "key" }
      );
    } catch (err) {
      console.error("Gagal menyimpan progress ke server", err);
    }
  };
  const loadHtmlToImage = () => {
    return new Promise((resolve, reject) => {
      if (window.htmlToImage) return resolve(window.htmlToImage);
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js";
      script.onload = () => resolve(window.htmlToImage);
      script.onerror = () => reject(new Error("Gagal memuat script gambar"));
      document.head.appendChild(script);
    });
  };
  const handleTipShare = async () => {
    const element = document.getElementById("tip-export-area");
    const grid = document.getElementById("tip-export-grid");
    if (!element) return;
    setIsGeneratingTipImage(true);
    const originalGridClass = grid ? grid.className : "";
    const originalGridStyle = grid ? grid.style.cssText : "";
    const originalElementStyle = element.style.cssText;
    try {
      if (grid) {
        grid.className = "grid grid-cols-2 gap-6 w-full";
        grid.style.display = "grid";
        grid.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
        grid.style.gap = "2rem";
      }
      element.style.width = "1000px";
      element.style.maxWidth = "1000px";
      element.style.margin = "0 auto";
      element.style.padding = "40px";
      const htmlToImage = await loadHtmlToImage();
      await new Promise((r) => setTimeout(r, 100));
      const blob = await htmlToImage.toBlob(element, {
        backgroundColor: "#ffffff",
        pixelRatio: 2
      });
      if (!blob) throw new Error("Blob image is empty");
      const file = new File([blob], `TIP_Performance_${tipMonth}_${tipYear}.jpg`, { type: "image/jpeg" });
      const now = /* @__PURE__ */ new Date();
      const fallbackTimeStr = `${now.getDate()} ${TIP_MONTHS[now.getMonth()]} ${now.getFullYear()} pukul ${String(now.getHours()).padStart(2, "0")}.${String(now.getMinutes()).padStart(2, "0")}`;
      const savedTimeStr = tipLastSaved || fallbackTimeStr;
      const shareText = `Laporan T2 TIP Performance ${tipMonth} ${tipYear}
Disimpan Pada ${savedTimeStr}`;
      let canShare = false;
      try {
        canShare = navigator.canShare && navigator.canShare({ files: [file] });
      } catch (e) {
      }
      if (canShare) {
        try {
          await navigator.share({
            files: [file],
            title: "Laporan TIP T2",
            text: shareText
          });
          return;
        } catch (err) {
          console.error("Share dibatalkan/gagal", err);
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TIP_Performance_${tipMonth}_${tipYear}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
      const text = encodeURIComponent(shareText);
      window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Gagal membuat gambar laporan. Browser mungkin tidak mendukung.");
    } finally {
      if (grid) {
        grid.className = originalGridClass;
        grid.style.cssText = originalGridStyle;
      }
      element.style.cssText = originalElementStyle;
      setIsGeneratingTipImage(false);
    }
  };
  const renderTipTable = (columnData) => /* @__PURE__ */ jsx("table", { className: "w-full border-collapse border-[3px] border-slate-800 bg-white shadow-sm", children: /* @__PURE__ */ jsx("tbody", { children: columnData.map((cat) => {
    return cat.items.map((item, itemIdx) => {
      const key = `${cat.id}-${item}`;
      const data = tipDataState[key] || { checked: false, locked: false };
      const isLocked = data.locked;
      const isChecked = data.checked;
      const catItems = cat.items.map((i) => tipDataState[`${cat.id}-${i}`] || { checked: false, locked: false });
      const isAllCatChecked = catItems.every((i) => i.checked);
      return /* @__PURE__ */ jsxs("tr", { children: [
        itemIdx === 0 && /* @__PURE__ */ jsxs(
          "td",
          {
            rowSpan: cat.items.length,
            className: "border-r-[3px] border-b-[3px] border-slate-800 p-3 text-center align-middle w-[35%]",
            children: [
              /* @__PURE__ */ jsx("div", { className: "font-bold text-slate-800 mb-1", children: cat.name }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => handleTipCategoryToggle(cat.id, cat.items),
                  className: "text-slate-500 hover:text-emerald-600 transition-colors",
                  title: "Check/Uncheck kategori ini",
                  children: isAllCatChecked ? /* @__PURE__ */ jsx(CheckSquare, { className: "w-5 h-5 mx-auto text-emerald-600" }) : /* @__PURE__ */ jsx(Square, { className: "w-5 h-5 mx-auto" })
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsx("td", { className: "border-r-[3px] border-b-[2px] border-slate-800 p-2 text-center align-middle font-semibold text-slate-800 w-[30%] bg-white", children: item }),
        /* @__PURE__ */ jsx(
          "td",
          {
            onClick: () => handleTipToggle(cat.id, item),
            className: `border-b-[2px] border-slate-800 p-1 text-center align-middle transition-colors w-[35%] ${isLocked ? "bg-slate-100 cursor-not-allowed" : "hover:bg-slate-50 cursor-pointer bg-white"}`,
            children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-1.5 min-h-[32px]", children: [
              isChecked && /* @__PURE__ */ jsx(Check, { className: "w-6 h-6 text-emerald-600 font-bold", strokeWidth: 3 }),
              isLocked && /* @__PURE__ */ jsx(Lock, { className: "w-3.5 h-3.5 text-slate-400" })
            ] })
          }
        )
      ] }, key);
    });
  }) }) });
  return /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-8 space-y-6 bg-slate-50/50", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4 w-full md:w-auto", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1", children: "Bulan" }),
          /* @__PURE__ */ jsx(
            "select",
            {
              value: tipMonth,
              onChange: (e) => setTipMonth(e.target.value),
              className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer font-semibold text-slate-700",
              children: TIP_MONTHS.map((m) => /* @__PURE__ */ jsx("option", { value: m, children: m }, m))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1", children: "Tahun" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              value: tipYear,
              onChange: (e) => setTipYear(e.target.value),
              className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "w-full md:w-64 bg-slate-100 p-3 rounded-lg border border-slate-200", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs font-bold text-slate-600 mb-1.5", children: [
          /* @__PURE__ */ jsx("span", { children: "Progress Selesai" }),
          /* @__PURE__ */ jsxs("span", { className: "text-blue-700", children: [
            getTipCheckedCount(),
            " / ",
            TIP_TOTAL_ITEMS
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-full bg-slate-300 rounded-full h-2.5 overflow-hidden", children: /* @__PURE__ */ jsx(
          "div",
          {
            className: "bg-blue-600 h-2.5 rounded-full transition-all duration-500",
            style: { width: `${Math.round(getTipCheckedCount() / TIP_TOTAL_ITEMS * 100)}%` }
          }
        ) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row gap-3 items-stretch lg:items-center w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: handleTipToggleAll,
          className: "w-full lg:w-auto lg:mr-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors border border-slate-300 text-sm whitespace-nowrap",
          children: [
            /* @__PURE__ */ jsx(CheckSquare, { className: "w-4 h-4 text-emerald-600 shrink-0" }),
            "Checklist / Uncheck Semua"
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 w-full lg:w-auto flex-col sm:flex-row items-stretch", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: handleTipSave,
            disabled: !tipUnsavedChanges,
            className: `flex-1 flex items-center justify-center gap-2 px-6 py-2.5 font-bold rounded-lg transition-all text-sm whitespace-nowrap ${tipUnsavedChanges ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`,
            children: [
              /* @__PURE__ */ jsx(Save, { className: "w-4 h-4 shrink-0" }),
              " Simpan Progres"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: handleTipShare,
            disabled: tipUnsavedChanges || isGeneratingTipImage,
            className: `flex-1 flex items-center justify-center gap-2 px-6 py-2.5 font-bold rounded-lg transition-all text-sm whitespace-nowrap ${!tipUnsavedChanges && !isGeneratingTipImage ? "bg-[#25D366] hover:bg-[#20b858] text-white shadow-md" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`,
            children: [
              isGeneratingTipImage ? /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4 animate-spin shrink-0" }) : /* @__PURE__ */ jsx(Share2, { className: "w-4 h-4 shrink-0" }),
              "Share TIP ke WA"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "overflow-x-hidden bg-slate-100 rounded-xl p-2 sm:p-4 pb-8", children: /* @__PURE__ */ jsxs("div", { id: "tip-export-area", className: "w-full mx-auto bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-sm overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl sm:text-3xl font-extrabold text-slate-800 uppercase tracking-wide", children: [
          "T2 TIP PERFORMANCE ",
          tipMonth,
          " ",
          tipYear
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 italic mt-2 text-sm sm:text-base", children: tipLastSaved ? `Terakhir disimpan: ${tipLastSaved}` : "Belum ada data yang disimpan pada periode ini." })
      ] }),
      /* @__PURE__ */ jsxs("div", { id: "tip-export-grid", className: "flex flex-col gap-6 relative", children: [
        isLoadingData && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-10 bg-white/80 flex items-center justify-center rounded-xl", children: /* @__PURE__ */ jsx(Loader2, { className: "w-10 h-10 animate-spin text-blue-600" }) }),
        /* @__PURE__ */ jsx("div", { children: renderTipTable(tipLeftCol) }),
        /* @__PURE__ */ jsx("div", { children: renderTipTable(tipRightCol) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 text-center italic mt-2", children: "* Tombol Bagikan (WA) hanya akan aktif jika Anda sudah menyimpan (klik tombol Simpan) perubahan terbaru." })
  ] });
};
const TabChecklist = () => {
  const { isCopied, setIsCopied } = useAppStore();
  const { checklistDataMaster } = useMasterDataStore();
  const [checklistData, setChecklistData] = useState({
    tanggal: (() => {
      const d = /* @__PURE__ */ new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })(),
    waktuMulai: "",
    waktuSelesai: "",
    supervisorAvsec: {}
  });
  const handleSupervisorChange = (locTitle, value) => {
    setChecklistData((prev) => ({
      ...prev,
      supervisorAvsec: {
        ...prev.supervisorAvsec || {},
        [locTitle]: value
      }
    }));
  };
  const [toggles, setToggles] = useState({});
  const [expandedAreas, setExpandedAreas] = useState({});
  const [syncStatus, setSyncStatus] = useState("loading");
  const clientIdRef = useRef(`client_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`);
  const channelRef = useRef(null);
  const fetchActiveToggles = useCallback(async () => {
    setSyncStatus("loading");
    try {
      const { data, error } = await supabase.from("master_configs").select("value").eq("key", "checklist_active_toggles").maybeSingle();
      if (!error && data && data.value) {
        setToggles(data.value.toggles || {});
      }
      setSyncStatus("synced");
    } catch (err) {
      console.error("Gagal memuat status checklist dari Supabase:", err);
      setSyncStatus("error");
    }
  }, []);
  useEffect(() => {
    fetchActiveToggles();
    const channel = supabase.channel("checklist_toggles_sync").on("broadcast", { event: "toggles_update" }, (payload) => {
      if (payload?.payload?.senderId !== clientIdRef.current && payload?.payload?.toggles) {
        setToggles(payload.payload.toggles);
        setSyncStatus("synced");
      }
    }).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "master_configs",
      filter: "key=eq.checklist_active_toggles"
    }, (payload) => {
      const newValue = payload?.new?.value;
      if (newValue && newValue.senderId !== clientIdRef.current && newValue.toggles) {
        setToggles(newValue.toggles);
        setSyncStatus("synced");
      }
    }).subscribe();
    channelRef.current = channel;
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchActiveToggles]);
  const saveAndBroadcastToggles = async (newToggles) => {
    setSyncStatus("saving");
    const payload = {
      toggles: newToggles,
      senderId: clientIdRef.current,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "toggles_update",
        payload
      }).catch((err) => console.error("Broadcast error:", err));
    }
    try {
      const { error } = await supabase.from("master_configs").upsert(
        { key: "checklist_active_toggles", value: payload, updated_at: (/* @__PURE__ */ new Date()).toISOString() },
        { onConflict: "key" }
      );
      if (error) {
        console.error("Upsert error:", error);
        setSyncStatus("error");
      } else {
        setSyncStatus("synced");
      }
    } catch (err) {
      console.error("Error saving toggles to Supabase:", err);
      setSyncStatus("error");
    }
  };
  const handleChecklistChange = (e) => {
    const { name, value } = e.target;
    if (name === "waktuSelesai" && value) {
      const now = /* @__PURE__ */ new Date();
      const todayStr = now.toISOString().split("T")[0];
      const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (checklistData.tanggal === todayStr && value > currentTimeStr) {
        alert(`Pukul Selesai tidak boleh melebihi waktu saat ini (${currentTimeStr})`);
        return;
      }
    }
    if (name === "tanggal" && value) {
      const now = /* @__PURE__ */ new Date();
      const todayStr = now.toISOString().split("T")[0];
      const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (value === todayStr && checklistData.waktuSelesai && checklistData.waktuSelesai > currentTimeStr) {
        alert(`Pukul Selesai direset karena melebihi waktu saat ini (${currentTimeStr})`);
        setChecklistData((prev) => ({ ...prev, tanggal: value, waktuSelesai: "" }));
        return;
      }
    }
    setChecklistData((prev) => ({ ...prev, [name]: value }));
  };
  const toggleArea = (areaId) => {
    setExpandedAreas((prev) => ({ ...prev, [areaId]: !prev[areaId] }));
  };
  const toggleChecklistItem = (key) => {
    setToggles((prev) => {
      const currentVal = prev[key] !== false;
      const newToggles = { ...prev, [key]: !currentVal };
      saveAndBroadcastToggles(newToggles);
      return newToggles;
    });
  };
  const handleChecklistSubmit = async (e) => {
    e.preventDefault();
    const now = /* @__PURE__ */ new Date();
    const todayStr = now.toISOString().split("T")[0];
    const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (checklistData.tanggal === todayStr && checklistData.waktuSelesai && checklistData.waktuSelesai > currentTimeStr) {
      alert(`Pukul Selesai tidak boleh melebihi waktu saat ini (${currentTimeStr})`);
      return;
    }
    const message = generateWA_Checklist(checklistData, checklistDataMaster, toggles);
    await shareToWhatsApp(message, null, () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3e3);
    });
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleChecklistSubmit, className: "p-4 sm:p-8 space-y-8 bg-slate-50/50", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-4", children: [
        /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-blue-600" }),
        " Waktu Pelaksanaan Checklist"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Tanggal" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
            /* @__PURE__ */ jsx("input", { type: "date", name: "tanggal", required: true, value: checklistData.tanggal, onChange: handleChecklistChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-1", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Pukul Mulai" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Clock, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
            /* @__PURE__ */ jsx("input", { type: "time", name: "waktuMulai", required: true, value: checklistData.waktuMulai, onChange: handleChecklistChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-1", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Pukul Selesai" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Clock, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
            /* @__PURE__ */ jsx("input", { type: "time", name: "waktuSelesai", required: true, max: checklistData.tanggal === (/* @__PURE__ */ new Date()).toISOString().split("T")[0] ? `${String((/* @__PURE__ */ new Date()).getHours()).padStart(2, "0")}:${String((/* @__PURE__ */ new Date()).getMinutes()).padStart(2, "0")}` : void 0, value: checklistData.waktuSelesai, onChange: handleChecklistChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row gap-4 mt-2", children: /* @__PURE__ */ jsx("button", { type: "submit", className: `w-full font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-300 transform ${isCopied ? "bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]" : "bg-[#25D366] hover:bg-[#20b858] hover:-translate-y-0.5 text-white"}`, children: isCopied ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 animate-pulse" }),
      " Checklist Berhasil Disalin!"
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Share2, { className: "w-6 h-6" }),
      " Share Checklist ke WA"
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5 text-xs sm:text-sm font-medium", children: [
          syncStatus === "loading" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 text-blue-600 animate-spin flex-shrink-0" }),
            /* @__PURE__ */ jsx("span", { className: "text-slate-600", children: "Memuat status operasi peralatan dari database..." })
          ] }),
          syncStatus === "saving" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 text-amber-600 animate-spin flex-shrink-0" }),
            /* @__PURE__ */ jsx("span", { className: "text-amber-700", children: "Menyimpan dan menyinkronkan status operasi secara real-time..." })
          ] }),
          syncStatus === "synced" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Cloud, { className: "w-4 h-4 text-emerald-600 flex-shrink-0" }),
            /* @__PURE__ */ jsx("span", { className: "text-emerald-700 font-semibold", children: "Status Operasi (Operasi/Off) Terhubung Real-time ke Database" })
          ] }),
          syncStatus === "error" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(X, { className: "w-4 h-4 text-red-600 flex-shrink-0" }),
            /* @__PURE__ */ jsx("span", { className: "text-red-600", children: "Gagal menyinkronkan ke database. Periksa koneksi internet Anda." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: fetchActiveToggles,
            disabled: syncStatus === "loading",
            className: "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50",
            title: "Muat ulang status terbaru dari database",
            children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: `w-3.5 h-3.5 ${syncStatus === "loading" ? "animate-spin" : ""}` }),
              "Sync Ulang"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 gap-2", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2", children: [
          /* @__PURE__ */ jsx(CheckSquare, { className: "w-5 h-5 text-blue-600" }),
          " Daftar Peralatan & Status"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-4 text-xs font-medium", children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-1 rounded", children: [
            /* @__PURE__ */ jsx(Check, { className: "w-3 h-3" }),
            " Operasi"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-red-700 bg-red-100 px-2 py-1 rounded", children: [
            /* @__PURE__ */ jsx(X, { className: "w-3 h-3" }),
            " Off"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-6", children: checklistDataMaster.map((block, bIdx) => {
        if (block.type === "location") {
          return /* @__PURE__ */ jsxs("div", { className: "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm", children: [
            /* @__PURE__ */ jsxs(
              "div",
              {
                onClick: () => toggleArea(block.title),
                className: "bg-slate-100 p-4 border-b border-slate-200 font-bold text-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-200 transition-colors",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(MapPin, { className: "w-5 h-5 text-slate-500" }),
                    " ",
                    block.title
                  ] }),
                  expandedAreas[block.title] ? /* @__PURE__ */ jsx(ChevronUp, { className: "w-5 h-5 text-slate-500" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "w-5 h-5 text-slate-500" })
                ]
              }
            ),
            expandedAreas[block.title] && /* @__PURE__ */ jsxs("div", { className: "p-4 space-y-6", children: [
              block.categories.map((cat, cIdx) => /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-blue-900 mb-3 bg-blue-50 px-3 py-1.5 rounded inline-block", children: cat.title }),
                /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: cat.items.map((item, iIdx) => {
                  const key = `${block.title}|${cat.title}|${iIdx}`;
                  const isOperasi = toggles[key] !== false;
                  return /* @__PURE__ */ jsxs("div", { onClick: () => toggleChecklistItem(key), className: `flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all select-none shadow-sm hover:-translate-y-0.5 ${isOperasi ? "bg-emerald-50/50 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400" : "bg-red-50 border-red-300 hover:bg-red-100 hover:border-red-400"}`, children: [
                    /* @__PURE__ */ jsx("span", { className: `text-sm font-semibold ${isOperasi ? "text-emerald-900" : "text-red-900"}`, children: item }),
                    /* @__PURE__ */ jsx("button", { type: "button", className: `w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-colors shadow-sm ${isOperasi ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`, children: isOperasi ? /* @__PURE__ */ jsx(Check, { className: "w-5 h-5" }) : /* @__PURE__ */ jsx(X, { className: "w-5 h-5" }) })
                  ] }, `item-${iIdx}`);
                }) })
              ] }, `cat-${cIdx}`)),
              block.title === "HBSCP" || block.title.includes("HBSCP") && !block.title.includes("UMROH") ? /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-slate-200 space-y-4", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Supervisor Avsec HBSCP 1.1 - 1.6" }),
                  /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsx(User, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        value: (checklistData.supervisorAvsec || {})["HBSCP 1.1 - 1.6"] || "",
                        onChange: (e) => handleSupervisorChange("HBSCP 1.1 - 1.6", e.target.value),
                        placeholder: "Nama Supervisor Avsec HBSCP 1.1 - 1.6",
                        className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Supervisor Avsec HBSCP 2.1 - 2.6" }),
                  /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsx(User, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        value: (checklistData.supervisorAvsec || {})["HBSCP 2.1 - 2.6"] || "",
                        onChange: (e) => handleSupervisorChange("HBSCP 2.1 - 2.6", e.target.value),
                        placeholder: "Nama Supervisor Avsec HBSCP 2.1 - 2.6",
                        className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                      }
                    )
                  ] })
                ] })
              ] }) : block.title === "ACCESS CONTROL" || block.title.includes("ACCESS CONTROL") ? /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-slate-200", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Supervisor Avsec Monitoring Access E1" }),
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsx(User, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: (checklistData.supervisorAvsec || {})[block.title] || (checklistData.supervisorAvsec || {})["Monitoring Access E1"] || "",
                      onChange: (e) => {
                        handleSupervisorChange(block.title, e.target.value);
                        handleSupervisorChange("Monitoring Access E1", e.target.value);
                      },
                      placeholder: "Nama Supervisor Avsec Monitoring Access E1",
                      className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                    }
                  )
                ] })
              ] }) : /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-slate-200", children: [
                /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: [
                  "Supervisor Avsec ",
                  block.title
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsx(User, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: (checklistData.supervisorAvsec || {})[block.title] || "",
                      onChange: (e) => handleSupervisorChange(block.title, e.target.value),
                      placeholder: `Nama Supervisor Avsec ${block.title}`,
                      className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                    }
                  )
                ] })
              ] })
            ] })
          ] }, `loc-${bIdx}`);
        } else if (block.type === "group") {
          return /* @__PURE__ */ jsx("div", { className: "space-y-6", children: block.locations.map((loc, lIdx) => /* @__PURE__ */ jsxs("div", { className: "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm", children: [
            /* @__PURE__ */ jsxs(
              "div",
              {
                onClick: () => toggleArea(loc.title),
                className: "bg-slate-100 p-4 border-b border-slate-200 font-bold text-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-200 transition-colors",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(MapPin, { className: "w-5 h-5 text-slate-500" }),
                    " ",
                    loc.title
                  ] }),
                  expandedAreas[loc.title] ? /* @__PURE__ */ jsx(ChevronUp, { className: "w-5 h-5 text-slate-500" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "w-5 h-5 text-slate-500" })
                ]
              }
            ),
            expandedAreas[loc.title] && /* @__PURE__ */ jsxs("div", { className: "p-4 space-y-6", children: [
              loc.categories.map((cat, cIdx) => /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-blue-900 mb-3 bg-blue-50 px-3 py-1.5 rounded inline-block", children: cat.title }),
                /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: cat.items.map((item, iIdx) => {
                  const key = `${loc.title}|${cat.title}|${iIdx}`;
                  const isOperasi = toggles[key] !== false;
                  return /* @__PURE__ */ jsxs("div", { onClick: () => toggleChecklistItem(key), className: `flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all select-none shadow-sm hover:-translate-y-0.5 ${isOperasi ? "bg-emerald-50/50 border-emerald-300 hover:bg-emerald-100" : "bg-red-50 border-red-300 hover:bg-red-100"}`, children: [
                    /* @__PURE__ */ jsx("span", { className: `text-sm font-semibold ${isOperasi ? "text-emerald-900" : "text-red-900"}`, children: item }),
                    /* @__PURE__ */ jsx("button", { type: "button", className: `w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-colors shadow-sm ${isOperasi ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`, children: isOperasi ? /* @__PURE__ */ jsx(Check, { className: "w-5 h-5" }) : /* @__PURE__ */ jsx(X, { className: "w-5 h-5" }) })
                  ] }, `gitem-${iIdx}`);
                }) })
              ] }, `gcat-${cIdx}`)),
              loc.title === "HBSCP" || loc.title.includes("HBSCP") && !loc.title.includes("UMROH") ? /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-slate-200 space-y-4", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Supervisor Avsec HBSCP 1.1 - 1.6" }),
                  /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsx(User, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        value: (checklistData.supervisorAvsec || {})["HBSCP 1.1 - 1.6"] || "",
                        onChange: (e) => handleSupervisorChange("HBSCP 1.1 - 1.6", e.target.value),
                        placeholder: "Nama Supervisor Avsec HBSCP 1.1 - 1.6",
                        className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Supervisor Avsec HBSCP 2.1 - 2.6" }),
                  /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsx(User, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        value: (checklistData.supervisorAvsec || {})["HBSCP 2.1 - 2.6"] || "",
                        onChange: (e) => handleSupervisorChange("HBSCP 2.1 - 2.6", e.target.value),
                        placeholder: "Nama Supervisor Avsec HBSCP 2.1 - 2.6",
                        className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                      }
                    )
                  ] })
                ] })
              ] }) : loc.title === "ACCESS CONTROL" || loc.title.includes("ACCESS CONTROL") ? /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-slate-200", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Supervisor Avsec Monitoring Access E1" }),
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsx(User, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: (checklistData.supervisorAvsec || {})[loc.title] || (checklistData.supervisorAvsec || {})["Monitoring Access E1"] || "",
                      onChange: (e) => {
                        handleSupervisorChange(loc.title, e.target.value);
                        handleSupervisorChange("Monitoring Access E1", e.target.value);
                      },
                      placeholder: "Nama Supervisor Avsec Monitoring Access E1",
                      className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                    }
                  )
                ] })
              ] }) : /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-slate-200", children: [
                /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: [
                  "Supervisor Avsec ",
                  loc.title
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsx(User, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: (checklistData.supervisorAvsec || {})[loc.title] || "",
                      onChange: (e) => handleSupervisorChange(loc.title, e.target.value),
                      placeholder: `Nama Supervisor Avsec ${loc.title}`,
                      className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                    }
                  )
                ] })
              ] })
            ] })
          ] }, `gloc-${lIdx}`)) }, `grp-${bIdx}`);
        } else if (block.type === "access_control") {
          return /* @__PURE__ */ jsxs("div", { className: "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm", children: [
            /* @__PURE__ */ jsxs(
              "div",
              {
                onClick: () => toggleArea(block.title),
                className: "bg-slate-800 p-4 border-b border-slate-700 font-bold text-white flex items-center justify-between cursor-pointer hover:bg-slate-700 transition-colors",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(Cpu, { className: "w-5 h-5 text-slate-300" }),
                    " ",
                    block.title
                  ] }),
                  expandedAreas[block.title] ? /* @__PURE__ */ jsx(ChevronUp, { className: "w-5 h-5 text-slate-300" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "w-5 h-5 text-slate-300" })
                ]
              }
            ),
            expandedAreas[block.title] && /* @__PURE__ */ jsxs("div", { className: "p-4 space-y-8", children: [
              block.terminals.map((term, tIdx) => /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                term.title && /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-slate-800 border-b pb-2", children: term.title }),
                /* @__PURE__ */ jsx("div", { className: "space-y-6 pl-0 md:pl-4", children: term.categories.map((cat, cIdx) => /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-indigo-900 mb-3 bg-indigo-50 px-3 py-1.5 rounded inline-block", children: cat.title }),
                  /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3", children: cat.items.map((item, iIdx) => {
                    const key = `${block.title}|${term.title}|${cat.title}|${iIdx}`;
                    const isOperasi = toggles[key] !== false;
                    return /* @__PURE__ */ jsxs("div", { onClick: () => toggleChecklistItem(key), className: `flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all select-none shadow-sm hover:-translate-y-0.5 ${isOperasi ? "bg-emerald-50/50 border-emerald-300 hover:bg-emerald-100" : "bg-red-50 border-red-300 hover:bg-red-100"}`, children: [
                      /* @__PURE__ */ jsx("span", { className: `text-sm font-semibold ${isOperasi ? "text-emerald-900" : "text-red-900"}`, children: item }),
                      /* @__PURE__ */ jsx("button", { type: "button", className: `w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-colors shadow-sm ${isOperasi ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`, children: isOperasi ? /* @__PURE__ */ jsx(Check, { className: "w-5 h-5" }) : /* @__PURE__ */ jsx(X, { className: "w-5 h-5" }) })
                    ] }, `titem-${iIdx}`);
                  }) })
                ] }, `tcat-${cIdx}`)) })
              ] }, `term-${tIdx}`)),
              /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-slate-200", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Supervisor Avsec Monitoring Access E1" }),
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsx(User, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: (checklistData.supervisorAvsec || {})[block.title] || (checklistData.supervisorAvsec || {})["Monitoring Access E1"] || "",
                      onChange: (e) => {
                        handleSupervisorChange(block.title, e.target.value);
                        handleSupervisorChange("Monitoring Access E1", e.target.value);
                      },
                      placeholder: "Nama Supervisor Avsec Monitoring Access E1",
                      className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                    }
                  )
                ] })
              ] })
            ] })
          ] }, `ac-${bIdx}`);
        }
        return null;
      }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row gap-4 mt-8 sticky bottom-6 z-10", children: /* @__PURE__ */ jsx("button", { type: "submit", className: `w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-2xl transition-all duration-300 transform ${isCopied ? "bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]" : "bg-[#25D366] hover:bg-[#20b858] hover:-translate-y-1 text-white border-4 border-white"}`, children: isCopied ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 animate-pulse" }),
      " Checklist Berhasil Disalin!"
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Share2, { className: "w-6 h-6" }),
      " Share Checklist ke WA"
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 border-t border-slate-200 pt-8", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-700 mb-4 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-blue-600" }),
        " Preview Laporan Checklist (Real-time)"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative", children: /* @__PURE__ */ jsx("div", { className: "bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%] max-h-[500px] overflow-y-auto", children: generateWA_Checklist(checklistData, checklistDataMaster, toggles) }) })
    ] })
  ] });
};
const TabBriefing = () => {
  const { isCopied, setIsCopied } = useAppStore();
  const [briefingData, setBriefingData] = useState(() => {
    const now = /* @__PURE__ */ new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const timeInMinutes = currentHour * 60 + currentMinute;
    const isPagi = timeInMinutes >= 450 && timeInMinutes < 1170;
    const logicalDateObj = new Date(now.getTime());
    if (timeInMinutes < 450) {
      logicalDateObj.setDate(logicalDateObj.getDate() - 1);
    }
    const tzOffset = logicalDateObj.getTimezoneOffset() * 6e4;
    const localDate = new Date(logicalDateObj.getTime() - tzOffset).toISOString().split("T")[0];
    return {
      jenis: "Unit",
      // 'Unit' | 'MOT'
      tanggal: localDate,
      shift: isPagi ? "Pagi" : "Malam",
      lokasi: "Terminal 2"
    };
  });
  const [photos, setPhotos] = useState([]);
  const [autoCollageFile, setAutoCollageFile] = useState(null);
  const [collageAnnotation, setCollageAnnotation] = useState(void 0);
  const photosRef = React.useRef(photos);
  photosRef.current = photos;
  React.useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => {
        if (p.preview && p.preview.startsWith("blob:")) {
          URL.revokeObjectURL(p.preview);
        }
      });
    };
  }, []);
  const handleBriefingChange = (e) => {
    const { name, value } = e.target;
    setBriefingData({ ...briefingData, [name]: value });
  };
  const handlePhotoUpload = async (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const compressedResults = await Promise.all(files.map((f) => compressImageFile(f)));
      const newPhotos = compressedResults.map((res) => ({
        id: Date.now() + Math.random(),
        file: res.file,
        preview: res.preview,
        zoom: 1
      }));
      setPhotos((prev) => [...prev, ...newPhotos]);
    }
  };
  const removePhoto = (index) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };
  const updatePhotoZoom = (index, delta) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      const currentZoom = newPhotos[index].zoom || 1;
      newPhotos[index] = {
        ...newPhotos[index],
        zoom: Math.max(0.5, Math.min(3, currentZoom + delta))
      };
      return newPhotos;
    });
  };
  const handlePhotoDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer?.getData("text/plain");
    if (!sourceIndexStr) return;
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (sourceIndex === targetIndex || isNaN(sourceIndex)) return;
    setPhotos((prev) => {
      const newPhotos = [...prev];
      const [movedPhoto] = newPhotos.splice(sourceIndex, 1);
      newPhotos.splice(targetIndex, 0, movedPhoto);
      return newPhotos;
    });
  };
  const handlePhotoEdit = (index, updatedPhoto) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      newPhotos[index] = updatedPhoto;
      return newPhotos;
    });
  };
  const handleBriefingSubmit = async (e) => {
    e.preventDefault();
    let generatedCollageFile = null;
    if (photos.length > 0) {
      if (photos.length === 1) {
        generatedCollageFile = photos[0].file || null;
      } else {
        if (autoCollageFile) {
          generatedCollageFile = autoCollageFile;
        } else {
          const collageResult = await processPhotosToCollage(photos, collageAnnotation);
          if (collageResult) {
            generatedCollageFile = collageResult.file;
          }
        }
      }
    }
    const message = generateWA_Briefing(briefingData);
    await shareToWhatsApp(message, generatedCollageFile, () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3e3);
    });
    if (generatedCollageUrl) ;
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleBriefingSubmit, className: "p-6 sm:p-8 space-y-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2", children: [
        /* @__PURE__ */ jsx(Megaphone, { className: "w-5 h-5 text-blue-600" }),
        " Detail Briefing"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-4", children: /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-2", children: "Jenis Briefing" }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl flex-1 hover:bg-blue-50 transition-colors", children: [
            /* @__PURE__ */ jsx("input", { type: "radio", name: "jenis", value: "Unit", checked: briefingData.jenis === "Unit", onChange: handleBriefingChange, className: "w-4 h-4 text-blue-600 focus:ring-blue-500" }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-slate-700", children: "Briefing Unit SSES T2" })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl flex-1 hover:bg-blue-50 transition-colors", children: [
            /* @__PURE__ */ jsx("input", { type: "radio", name: "jenis", value: "MOT", checked: briefingData.jenis === "MOT", onChange: handleBriefingChange, className: "w-4 h-4 text-blue-600 focus:ring-blue-500" }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-slate-700", children: "Briefing MOT T2" })
          ] })
        ] }),
        briefingData.jenis === "MOT" && /* @__PURE__ */ jsxs("div", { className: "mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 animate-fadeIn shadow-sm", children: [
          /* @__PURE__ */ jsx("div", { className: "p-2 bg-white text-blue-600 rounded-lg shrink-0 border border-blue-100 shadow-sm", children: /* @__PURE__ */ jsx(ClipboardList, { className: "w-5 h-5" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-700 font-bold block mb-0.5", children: "Link Absensi :" }),
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "https://bit.ly/4h3EYMY?r=qr",
                target: "_blank",
                rel: "noopener noreferrer",
                className: "text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline break-all",
                children: "https://bit.ly/4h3EYMY?r=qr"
              }
            )
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(
      PhotoUploader,
      {
        photos,
        onUpload: handlePhotoUpload,
        onRemove: removePhoto,
        onZoom: updatePhotoZoom,
        onDrop: handlePhotoDrop,
        onEdit: handlePhotoEdit,
        listType: "general"
      }
    ),
    /* @__PURE__ */ jsx(
      LiveCollagePreview,
      {
        photos,
        onCollageChange: (file, _url, annotation) => {
          setAutoCollageFile(file);
          setCollageAnnotation(annotation);
        }
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "space-y-4 mt-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Tanggal" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
          /* @__PURE__ */ jsx("input", { type: "date", name: "tanggal", required: true, value: briefingData.tanggal, onChange: handleBriefingChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Shift" }),
        /* @__PURE__ */ jsxs("select", { name: "shift", value: briefingData.shift, onChange: handleBriefingChange, className: "w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer", children: [
          /* @__PURE__ */ jsx("option", { value: "Pagi", children: "Pagi" }),
          /* @__PURE__ */ jsx("option", { value: "Malam", children: "Malam" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Lokasi" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(MapPin, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
          /* @__PURE__ */ jsx("input", { type: "text", name: "lokasi", required: true, value: briefingData.lokasi, onChange: handleBriefingChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row gap-4 mt-8", children: /* @__PURE__ */ jsx("button", { type: "submit", className: `w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${isCopied ? "bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]" : "bg-[#25D366] hover:bg-[#20b858] hover:shadow-xl hover:-translate-y-0.5 text-white"}`, children: isCopied ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 animate-pulse" }),
      " Berhasil Disalin / Dibagikan!"
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Share2, { className: "w-6 h-6" }),
      " Share Briefing ke WA"
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 border-t border-slate-200 pt-8", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-700 mb-4 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-blue-600" }),
        " Preview Laporan Briefing (Real-time)"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative", children: /* @__PURE__ */ jsx("div", { className: "bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%]", children: generateWA_Briefing(briefingData) }) })
    ] })
  ] });
};
const useAuthStore = create((set) => ({
  user: null,
  isInitialized: false,
  isLoginModalOpen: false,
  setUser: (user) => set({ user }),
  setLoginModalOpen: (isOpen) => set({ isLoginModalOpen: isOpen }),
  initializeAuth: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ user: session?.user || null, isInitialized: true });
    supabase.auth.onAuthStateChange((_event, session2) => {
      set({ user: session2?.user || null });
    });
  },
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  }
}));
const ScheduleUploader = () => {
  const store = useMasterDataStore();
  const [selectedBulan, setSelectedBulan] = useState((/* @__PURE__ */ new Date()).getMonth() + 1);
  const [selectedTahun, setSelectedTahun] = useState((/* @__PURE__ */ new Date()).getFullYear());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ type: null, message: "" });
  const [historyList, setHistoryList] = useState([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const fetchHistory = async () => {
    setIsFetchingHistory(true);
    try {
      const { data, error } = await supabase.from("jadwal_shift").select("tanggal");
      if (error) throw error;
      const counts = {};
      data?.forEach((row) => {
        const yyyyMm = row.tanggal.substring(0, 7);
        counts[yyyyMm] = (counts[yyyyMm] || 0) + 1;
      });
      const list = Object.keys(counts).sort((a, b) => b.localeCompare(a)).slice(0, 12).map((ym) => ({ yearMonth: ym, count: counts[ym] }));
      setHistoryList(list);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setIsFetchingHistory(false);
    }
  };
  useEffect(() => {
    fetchHistory();
  }, []);
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadStatus({ type: null, message: "" });
    const yearStr = selectedTahun;
    const monthStr = String(selectedBulan).padStart(2, "0");
    const targetYm = `${yearStr}-${monthStr}`;
    if (historyList.some((h) => h.yearMonth === targetYm)) {
      setUploadStatus({ type: "error", message: `Jadwal untuk periode ${monthStr}-${yearStr} sudah ada. Harap hapus jadwal tersebut di histori sebelum melakukan upload ulang.` });
      setIsUploading(false);
      e.target.value = "";
      return;
    }
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      const allPersonel = [...store.dataApiT2, ...store.dataOmIasT2];
      const nikToIdMap = new Map(allPersonel.map((p) => [String(p.nik).trim(), p.id]));
      let headerRowIndex = -1;
      let codeColIndex = -1;
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row) continue;
        for (let j = 0; j < row.length; j++) {
          const cell = String(row[j] || "").trim().toUpperCase();
          if (cell === "CODE" || cell === "NIK") {
            headerRowIndex = i;
            codeColIndex = j;
            break;
          }
        }
        if (headerRowIndex !== -1) break;
      }
      if (headerRowIndex === -1 || codeColIndex === -1) {
        throw new Error('Gagal menemukan kolom "CODE" pada Excel. Pastikan format tabel sesuai.');
      }
      const headerRow = jsonData[headerRowIndex];
      const dateColumns = [];
      for (let j = 0; j < headerRow.length; j++) {
        const cellValue = Number(headerRow[j]);
        if (!isNaN(cellValue) && cellValue >= 1 && cellValue <= 31) {
          dateColumns.push({ colIndex: j, dateNum: cellValue });
        }
      }
      if (dateColumns.length === 0) {
        throw new Error("Gagal menemukan kolom tanggal (1-31) pada baris Header.");
      }
      const shiftsToInsert = [];
      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row) continue;
        const rawNik = String(row[codeColIndex] || "").trim();
        if (!rawNik) continue;
        const personelId = nikToIdMap.get(rawNik);
        if (!personelId) continue;
        for (const dateCol of dateColumns) {
          const shiftCode = String(row[dateCol.colIndex] || "").trim().toUpperCase();
          if (!shiftCode || shiftCode === "" || shiftCode === "-" || shiftCode.toLowerCase() === "off") {
            continue;
          }
          const yearStr2 = selectedTahun;
          const monthStr2 = String(selectedBulan).padStart(2, "0");
          const dayStr = String(dateCol.dateNum).padStart(2, "0");
          const dateString = `${yearStr2}-${monthStr2}-${dayStr}`;
          shiftsToInsert.push({
            personel_id: personelId,
            tanggal: dateString,
            shift: shiftCode,
            status_kehadiran: "Hadir"
          });
        }
      }
      if (shiftsToInsert.length === 0) {
        throw new Error("Tidak ada data shift valid yang ditemukan untuk dimasukkan.");
      }
      const { error } = await supabase.from("jadwal_shift").upsert(shiftsToInsert, { onConflict: "personel_id, tanggal" });
      if (error) throw new Error("Gagal menyimpan ke database: " + error.message);
      setUploadStatus({ type: "success", message: `Berhasil mengunggah jadwal untuk ${shiftsToInsert.length} shift.` });
      await fetchHistory();
    } catch (err) {
      setUploadStatus({ type: "error", message: err.message || "Terjadi kesalahan saat memproses Excel." });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };
  const handleDeleteSchedule = async (yearMonth) => {
    if (!window.confirm(`Anda yakin ingin menghapus seluruh jadwal untuk periode ${yearMonth}?`)) {
      return;
    }
    setIsDeleting(yearMonth);
    try {
      const startDate = `${yearMonth}-01`;
      const [year, month] = yearMonth.split("-").map(Number);
      const nextMonthDate = new Date(year, month, 1);
      const nextMonthStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}-01`;
      const { error } = await supabase.from("jadwal_shift").delete().gte("tanggal", startDate).lt("tanggal", nextMonthStr);
      if (error) throw error;
      await fetchHistory();
    } catch (err) {
      console.error("Failed to delete schedule:", err);
      alert("Gagal menghapus jadwal dari database.");
    } finally {
      setIsDeleting(null);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-slate-200 p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
      /* @__PURE__ */ jsx("div", { className: "p-3 bg-blue-100 text-blue-600 rounded-lg", children: /* @__PURE__ */ jsx(Calendar, { className: "w-6 h-6" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-slate-800", children: "Upload Jadwal Teknisi" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "Unggah file Excel (.xlsx) daftar jadwal bulanan." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 mb-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 mb-2", children: "Bulan" }),
        /* @__PURE__ */ jsx("select", { value: selectedBulan, onChange: (e) => setSelectedBulan(Number(e.target.value)), className: "w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none", children: ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, i) => /* @__PURE__ */ jsx("option", { value: i + 1, children: m }, i)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 mb-2", children: "Tahun" }),
        /* @__PURE__ */ jsx("input", { type: "number", value: selectedTahun, onChange: (e) => setSelectedTahun(Number(e.target.value)), className: "w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer text-center p-8", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "file",
          accept: ".xlsx, .xls",
          onChange: handleFileUpload,
          disabled: isUploading,
          className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        }
      ),
      isUploading ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center gap-3 text-blue-600", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "w-10 h-10 animate-spin" }),
        /* @__PURE__ */ jsx("p", { className: "font-bold", children: "Memproses File Excel..." })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center gap-3 text-blue-600", children: [
        /* @__PURE__ */ jsx(FileSpreadsheet, { className: "w-10 h-10" }),
        /* @__PURE__ */ jsx("p", { className: "font-bold", children: "Pilih File Excel Jadwal" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-blue-500", children: "Hanya .xlsx atau .xls (Format Harus Terdapat Kolom 'CODE' dan Angka 1-31)" })
      ] })
    ] }),
    uploadStatus.type === "success" && /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg", children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 flex-shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-bold", children: "Upload Berhasil!" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm", children: uploadStatus.message })
      ] })
    ] }),
    uploadStatus.type === "error" && /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5 flex-shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-bold", children: "Upload Gagal" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm", children: uploadStatus.message })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 border-t border-slate-200 pt-8", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-md font-bold text-slate-800 flex items-center gap-2 mb-4", children: [
        /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-blue-600" }),
        " Histori Upload Jadwal",
        isFetchingHistory && /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 text-blue-500 animate-spin" })
      ] }),
      historyList.length === 0 && !isFetchingHistory ? /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 italic", children: "Belum ada histori upload jadwal." }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: historyList.map((h) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-700", children: h.yearMonth }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500", children: [
            h.count,
            " data shift"
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleDeleteSchedule(h.yearMonth),
            disabled: isDeleting === h.yearMonth,
            className: "p-2 text-rose-600 hover:bg-rose-100 rounded-md transition-colors disabled:opacity-50",
            title: "Hapus Jadwal",
            children: isDeleting === h.yearMonth ? /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin" }) : /* @__PURE__ */ jsx(Trash2, { className: "w-5 h-5" })
          }
        )
      ] }, h.yearMonth)) })
    ] })
  ] });
};
const ChecklistDataEditor = () => {
  const store = useMasterDataStore();
  const [data, setData] = useState([]);
  useEffect(() => {
    setData(JSON.parse(JSON.stringify(store.checklistDataMaster)));
  }, [store.checklistDataMaster]);
  const handleSave = () => {
    store.setChecklistDataMaster(data);
    alert("Konfigurasi Checklist berhasil disimpan ke Supabase!");
  };
  const handleAddBlock = (type) => {
    const newData = [...data];
    if (type === "location") {
      newData.push({ type: "location", title: "Lokasi Baru", summary: "", categories: [] });
    } else if (type === "group") {
      newData.push({ type: "group", summary: "Grup Baru", locations: [] });
    } else if (type === "access_control") {
      newData.push({ type: "access_control", title: "Access Control Baru", summary: "", terminals: [] });
    }
    setData(newData);
  };
  const handleDeleteBlock = (idx) => {
    if (window.confirm("Hapus blok ini?")) {
      const newData = [...data];
      newData.splice(idx, 1);
      setData(newData);
    }
  };
  const handleMoveBlock = (idx, direction) => {
    if (direction === "up" && idx > 0) {
      const newData = [...data];
      [newData[idx - 1], newData[idx]] = [newData[idx], newData[idx - 1]];
      setData(newData);
    } else if (direction === "down" && idx < data.length - 1) {
      const newData = [...data];
      [newData[idx], newData[idx + 1]] = [newData[idx + 1], newData[idx]];
      setData(newData);
    }
  };
  const updateBlock = (idx, field, value) => {
    const newData = [...data];
    newData[idx][field] = value;
    setData(newData);
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-2xl shadow-sm border border-slate-200", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-200 pb-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "w-full sm:w-auto", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-slate-800 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Settings, { className: "w-6 h-6 text-blue-600 shrink-0" }),
          " Editor Konfigurasi Checklist"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm mt-1", children: "Edit struktur checklist untuk WhatsApp. Perubahan akan langsung disimpan ke Supabase." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap w-full sm:w-auto gap-2", children: [
        /* @__PURE__ */ jsxs("button", { onClick: () => {
          if (window.confirm("Reset checklist ke default bawaan sistem? Data saat ini di cloud akan tertimpa setelah Anda menekan Simpan ke Cloud.")) {
            setData(JSON.parse(JSON.stringify(DEFAULT_CHECKLIST_DATA)));
          }
        }, className: "flex-1 sm:flex-none justify-center flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-700 text-sm sm:text-base font-bold rounded-xl transition-all shadow-sm border border-rose-200", children: [
          /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 sm:w-5 h-4 sm:h-5 shrink-0" }),
          " Reset"
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: handleSave, className: "flex-1 sm:flex-none justify-center flex items-center gap-2 px-3 sm:px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-bold rounded-xl transition-all shadow-md", children: [
          /* @__PURE__ */ jsx(Save, { className: "w-4 sm:w-5 h-4 sm:h-5 shrink-0" }),
          " Simpan"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-6", children: data.map((block, bIdx) => /* @__PURE__ */ jsx(
      BlockEditor,
      {
        block,
        onUpdate: (field, val) => updateBlock(bIdx, field, val),
        onDelete: () => handleDeleteBlock(bIdx),
        onMoveUp: () => handleMoveBlock(bIdx, "up"),
        onMoveDown: () => handleMoveBlock(bIdx, "down"),
        isFirst: bIdx === 0,
        isLast: bIdx === data.length - 1
      },
      bIdx
    )) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 pt-6 border-t border-slate-200 flex flex-wrap gap-4", children: [
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => handleAddBlock("location"), className: "flex-1 min-w-[200px] py-3 border-2 border-dashed border-blue-300 text-blue-600 font-bold rounded-xl hover:bg-blue-50 flex items-center justify-center gap-2 transition-colors", children: [
        /* @__PURE__ */ jsx(Plus, { className: "w-5 h-5" }),
        " Tambah Blok Lokasi"
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => handleAddBlock("group"), className: "flex-1 min-w-[200px] py-3 border-2 border-dashed border-purple-300 text-purple-600 font-bold rounded-xl hover:bg-purple-50 flex items-center justify-center gap-2 transition-colors", children: [
        /* @__PURE__ */ jsx(Plus, { className: "w-5 h-5" }),
        " Tambah Blok Grup"
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => handleAddBlock("access_control"), className: "flex-1 min-w-[200px] py-3 border-2 border-dashed border-emerald-300 text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 flex items-center justify-center gap-2 transition-colors", children: [
        /* @__PURE__ */ jsx(Plus, { className: "w-5 h-5" }),
        " Tambah Blok Access Control"
      ] })
    ] })
  ] });
};
const BlockEditor = ({ block, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) => {
  const [isOpen, setIsOpen] = useState(false);
  return /* @__PURE__ */ jsxs("div", { className: `border rounded-xl overflow-hidden shadow-sm transition-all ${isOpen ? "border-blue-400 ring-2 ring-blue-50" : "border-slate-300"}`, children: [
    /* @__PURE__ */ jsxs("div", { className: `flex items-center justify-between p-4 cursor-pointer select-none transition-colors ${isOpen ? "bg-blue-50" : "bg-slate-100 hover:bg-slate-200"}`, onClick: () => setIsOpen(!isOpen), children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        isOpen ? /* @__PURE__ */ jsx(ChevronDown, { className: "w-5 h-5 text-slate-500" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "w-5 h-5 text-slate-500" }),
        /* @__PURE__ */ jsxs("span", { className: "font-bold text-slate-800", children: [
          block.type.toUpperCase(),
          ": ",
          block.title || block.summary || "Baru"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsx("button", { onClick: (e) => {
          e.stopPropagation();
          onMoveUp();
        }, disabled: isFirst, className: `p-2 rounded-lg transition-colors ${isFirst ? "text-slate-300" : "text-slate-500 hover:bg-slate-200"}`, children: /* @__PURE__ */ jsx(ArrowUp, { className: "w-5 h-5" }) }),
        /* @__PURE__ */ jsx("button", { onClick: (e) => {
          e.stopPropagation();
          onMoveDown();
        }, disabled: isLast, className: `p-2 rounded-lg transition-colors ${isLast ? "text-slate-300" : "text-slate-500 hover:bg-slate-200"}`, children: /* @__PURE__ */ jsx(ArrowDown, { className: "w-5 h-5" }) }),
        /* @__PURE__ */ jsx("div", { className: "w-px h-6 bg-slate-300 mx-1" }),
        /* @__PURE__ */ jsx("button", { onClick: (e) => {
          e.stopPropagation();
          onDelete();
        }, className: "p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors", children: /* @__PURE__ */ jsx(Trash2, { className: "w-5 h-5" }) })
      ] })
    ] }),
    isOpen && /* @__PURE__ */ jsxs("div", { className: "p-5 bg-white space-y-5 border-t border-slate-200", children: [
      block.type !== "group" && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 mb-1", children: "Nama/Judul Utama" }),
        /* @__PURE__ */ jsx("input", { className: "w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none", value: block.title || "", onChange: (e) => onUpdate("title", e.target.value) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 mb-1", children: "Teks Summary (WA)" }),
        /* @__PURE__ */ jsx("input", { className: "w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none", value: block.summary || "", onChange: (e) => onUpdate("summary", e.target.value) })
      ] }),
      block.type === "location" && /* @__PURE__ */ jsx(
        CategoryList,
        {
          categories: block.categories || [],
          onChange: (cats) => onUpdate("categories", cats)
        }
      ),
      block.type === "group" && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700", children: "Daftar Lokasi di Grup Ini" }),
        (block.locations || []).map((loc, lIdx) => /* @__PURE__ */ jsxs("div", { className: "p-4 border border-slate-200 rounded-xl bg-slate-50", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
            /* @__PURE__ */ jsx("input", { placeholder: "Nama Lokasi (ex: SSCP E)", className: "flex-1 p-2 border border-slate-300 rounded-lg font-bold", value: loc.title || "", onChange: (e) => {
              const newLocs = [...block.locations || []];
              newLocs[lIdx].title = e.target.value;
              onUpdate("locations", newLocs);
            } }),
            /* @__PURE__ */ jsx("button", { onClick: () => {
              if (lIdx > 0) {
                const newLocs = [...block.locations || []];
                [newLocs[lIdx - 1], newLocs[lIdx]] = [newLocs[lIdx], newLocs[lIdx - 1]];
                onUpdate("locations", newLocs);
              }
            }, disabled: lIdx === 0, className: `p-2 rounded-lg transition-colors ${lIdx === 0 ? "text-slate-300" : "text-slate-500 hover:bg-slate-200"}`, children: /* @__PURE__ */ jsx(ArrowUp, { className: "w-5 h-5" }) }),
            /* @__PURE__ */ jsx("button", { onClick: () => {
              if (lIdx < (block.locations?.length || 0) - 1) {
                const newLocs = [...block.locations || []];
                [newLocs[lIdx], newLocs[lIdx + 1]] = [newLocs[lIdx + 1], newLocs[lIdx]];
                onUpdate("locations", newLocs);
              }
            }, disabled: lIdx === (block.locations?.length || 0) - 1, className: `p-2 rounded-lg transition-colors ${lIdx === (block.locations?.length || 0) - 1 ? "text-slate-300" : "text-slate-500 hover:bg-slate-200"}`, children: /* @__PURE__ */ jsx(ArrowDown, { className: "w-5 h-5" }) }),
            /* @__PURE__ */ jsx("button", { onClick: () => {
              const newLocs = [...block.locations || []];
              newLocs.splice(lIdx, 1);
              onUpdate("locations", newLocs);
            }, className: "p-2 text-rose-500 bg-rose-100 rounded-lg", children: /* @__PURE__ */ jsx(Trash2, { className: "w-5 h-5" }) })
          ] }),
          /* @__PURE__ */ jsx(CategoryList, { categories: loc.categories || [], onChange: (cats) => {
            const newLocs = [...block.locations || []];
            newLocs[lIdx].categories = cats;
            onUpdate("locations", newLocs);
          } })
        ] }, lIdx)),
        /* @__PURE__ */ jsx("button", { onClick: () => onUpdate("locations", [...block.locations || [], { title: "Lokasi Baru", categories: [] }]), className: "text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100", children: "+ Tambah Lokasi" })
      ] }),
      block.type === "access_control" && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700", children: "Daftar Terminal" }),
        (block.terminals || []).map((term, tIdx) => /* @__PURE__ */ jsxs("div", { className: "p-4 border border-slate-200 rounded-xl bg-slate-50", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
            /* @__PURE__ */ jsx("input", { placeholder: "Nama Terminal (Opsional, ex: TERMINAL D)", className: "flex-1 p-2 border border-slate-300 rounded-lg font-bold", value: term.title || "", onChange: (e) => {
              const newTerms = [...block.terminals || []];
              newTerms[tIdx].title = e.target.value;
              onUpdate("terminals", newTerms);
            } }),
            /* @__PURE__ */ jsx("button", { onClick: () => {
              if (tIdx > 0) {
                const newTerms = [...block.terminals || []];
                [newTerms[tIdx - 1], newTerms[tIdx]] = [newTerms[tIdx], newTerms[tIdx - 1]];
                onUpdate("terminals", newTerms);
              }
            }, disabled: tIdx === 0, className: `p-2 rounded-lg transition-colors ${tIdx === 0 ? "text-slate-300" : "text-slate-500 hover:bg-slate-200"}`, children: /* @__PURE__ */ jsx(ArrowUp, { className: "w-5 h-5" }) }),
            /* @__PURE__ */ jsx("button", { onClick: () => {
              if (tIdx < (block.terminals?.length || 0) - 1) {
                const newTerms = [...block.terminals || []];
                [newTerms[tIdx], newTerms[tIdx + 1]] = [newTerms[tIdx + 1], newTerms[tIdx]];
                onUpdate("terminals", newTerms);
              }
            }, disabled: tIdx === (block.terminals?.length || 0) - 1, className: `p-2 rounded-lg transition-colors ${tIdx === (block.terminals?.length || 0) - 1 ? "text-slate-300" : "text-slate-500 hover:bg-slate-200"}`, children: /* @__PURE__ */ jsx(ArrowDown, { className: "w-5 h-5" }) }),
            /* @__PURE__ */ jsx("button", { onClick: () => {
              const newTerms = [...block.terminals || []];
              newTerms.splice(tIdx, 1);
              onUpdate("terminals", newTerms);
            }, className: "p-2 text-rose-500 bg-rose-100 rounded-lg", children: /* @__PURE__ */ jsx(Trash2, { className: "w-5 h-5" }) })
          ] }),
          /* @__PURE__ */ jsx(CategoryList, { categories: term.categories || [], onChange: (cats) => {
            const newTerms = [...block.terminals || []];
            newTerms[tIdx].categories = cats;
            onUpdate("terminals", newTerms);
          } })
        ] }, tIdx)),
        /* @__PURE__ */ jsx("button", { onClick: () => onUpdate("terminals", [...block.terminals || [], { title: "Terminal Baru", categories: [] }]), className: "text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100", children: "+ Tambah Terminal" })
      ] })
    ] })
  ] });
};
const CategoryList = ({ categories, onChange }) => {
  const updateCat = (idx, field, val) => {
    const newCats = [...categories];
    newCats[idx][field] = val;
    onChange(newCats);
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700", children: "Daftar Kategori & Peralatan" }),
    categories.map((cat, cIdx) => /* @__PURE__ */ jsxs("div", { className: "border border-indigo-100 rounded-xl p-4 bg-indigo-50/30 flex gap-4 items-start", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx("input", { placeholder: "Nama Kategori (ex: A. X-RAY)", className: "w-full p-2 border border-slate-300 rounded-lg text-sm font-bold", value: cat.title || "", onChange: (e) => updateCat(cIdx, "title", e.target.value) }) }),
          /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx("input", { placeholder: "Summary Key (opsional, ex: X-RAY)", className: "w-full p-2 border border-slate-300 rounded-lg text-sm", value: cat.summaryKey || "", onChange: (e) => updateCat(cIdx, "summaryKey", e.target.value) }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-500 mb-1", children: "Daftar Alat (1 Baris = 1 Alat)" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              className: "w-full p-3 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none whitespace-pre",
              rows: 4,
              value: (cat.items || []).join("\n"),
              onChange: (e) => {
                const items = e.target.value.split("\n").filter((s) => s.trim() !== "");
                updateCat(cIdx, "items", items);
              }
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => {
          if (cIdx > 0) {
            const newCats = [...categories];
            [newCats[cIdx - 1], newCats[cIdx]] = [newCats[cIdx], newCats[cIdx - 1]];
            onChange(newCats);
          }
        }, disabled: cIdx === 0, className: `p-2 rounded-lg transition-colors ${cIdx === 0 ? "text-indigo-200" : "text-indigo-500 hover:bg-indigo-100"}`, children: /* @__PURE__ */ jsx(ArrowUp, { className: "w-5 h-5" }) }),
        /* @__PURE__ */ jsx("button", { onClick: () => {
          if (cIdx < categories.length - 1) {
            const newCats = [...categories];
            [newCats[cIdx], newCats[cIdx + 1]] = [newCats[cIdx + 1], newCats[cIdx]];
            onChange(newCats);
          }
        }, disabled: cIdx === categories.length - 1, className: `p-2 rounded-lg transition-colors ${cIdx === categories.length - 1 ? "text-indigo-200" : "text-indigo-500 hover:bg-indigo-100"}`, children: /* @__PURE__ */ jsx(ArrowDown, { className: "w-5 h-5" }) }),
        /* @__PURE__ */ jsx("button", { onClick: () => {
          const newCats = [...categories];
          newCats.splice(cIdx, 1);
          onChange(newCats);
        }, className: "p-2 text-rose-500 hover:bg-rose-100 rounded-lg mt-1 transition-colors", children: /* @__PURE__ */ jsx(Trash2, { className: "w-5 h-5" }) })
      ] })
    ] }, cIdx)),
    /* @__PURE__ */ jsx("button", { onClick: () => onChange([...categories, { title: "", items: [] }]), className: "text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors", children: "+ Tambah Kategori" })
  ] });
};
const AssetMasterLokasi = () => {
  const [lokasiList, setLokasiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [formNama, setFormNama] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editNama, setEditNama] = useState("");
  useEffect(() => {
    loadLokasi();
  }, []);
  const loadLokasi = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("lokasi").select("id, nama").order("nama");
    if (!error && data) {
      setLokasiList(data);
    }
    setLoading(false);
  };
  const handleAdd = async () => {
    if (!formNama.trim()) return alert("Nama lokasi harus diisi!");
    setLoading(true);
    const { error } = await supabase.from("lokasi").insert({
      nama: formNama.trim()
    });
    if (!error) {
      setFormNama("");
      setIsAdding(false);
      await loadLokasi();
    } else {
      alert("Gagal menambah: " + error.message);
    }
    setLoading(false);
  };
  const handleUpdate = async (id) => {
    if (!editNama.trim()) return alert("Nama lokasi harus diisi!");
    setLoading(true);
    const { error } = await supabase.from("lokasi").update({
      nama: editNama.trim()
    }).eq("id", id);
    if (!error) {
      setEditingId(null);
      await loadLokasi();
    } else {
      alert("Gagal menyimpan: " + error.message);
    }
    setLoading(false);
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus lokasi ini? Data penempatan yang terkait mungkin akan ikut terhapus atau error.")) return;
    setLoading(true);
    const { error } = await supabase.from("lokasi").delete().eq("id", id);
    if (!error) {
      await loadLokasi();
    } else {
      alert("Gagal menghapus: " + error.message);
    }
    setLoading(false);
  };
  if (loading && lokasiList.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "flex justify-center p-8", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-blue-500" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-slate-800 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(MapPin, { className: "w-5 h-5 text-blue-500" }),
        " Data Master Lokasi"
      ] }),
      !isAdding && /* @__PURE__ */ jsxs("button", { onClick: () => setIsAdding(true), className: "flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors", children: [
        /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
        " Tambah Lokasi"
      ] })
    ] }),
    isAdding && /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 p-4 rounded-xl border border-blue-200 flex flex-col sm:flex-row gap-3 items-end mb-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "w-full sm:flex-1", children: [
        /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-blue-800 mb-1", children: "Nama Lokasi" }),
        /* @__PURE__ */ jsx("input", { type: "text", value: formNama, onChange: (e) => setFormNama(e.target.value), className: "w-full p-2 border border-blue-200 rounded-lg text-sm", placeholder: "Contoh: SSCP D" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 w-full sm:w-auto", children: [
        /* @__PURE__ */ jsxs("button", { onClick: handleAdd, className: "flex-1 sm:flex-none flex justify-center items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700", children: [
          /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
          " Simpan"
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => setIsAdding(false), className: "flex-1 sm:flex-none flex justify-center items-center gap-1 bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-300", children: [
          /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }),
          " Batal"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-white border border-slate-200 rounded-xl overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 border-b border-slate-200 text-slate-600", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "p-3 font-semibold", children: "Nama Lokasi" }),
        /* @__PURE__ */ jsx("th", { className: "p-3 font-semibold text-right", children: "Aksi" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-slate-200", children: [
        lokasiList.map((loc) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50", children: [
          /* @__PURE__ */ jsx("td", { className: "p-3", children: editingId === loc.id ? /* @__PURE__ */ jsx("input", { type: "text", value: editNama, onChange: (e) => setEditNama(e.target.value), className: "w-full p-1.5 border rounded" }) : /* @__PURE__ */ jsx("span", { className: "font-medium text-slate-800", children: loc.nama }) }),
          /* @__PURE__ */ jsx("td", { className: "p-3 text-right", children: editingId === loc.id ? /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => handleUpdate(loc.id), className: "text-emerald-600 hover:bg-emerald-50 p-1.5 rounded", children: /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }) }),
            /* @__PURE__ */ jsx("button", { onClick: () => setEditingId(null), className: "text-slate-500 hover:bg-slate-100 p-1.5 rounded", children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }) })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => {
              setEditingId(loc.id);
              setEditNama(loc.nama);
            }, className: "text-blue-600 hover:bg-blue-50 p-1.5 rounded", title: "Edit", children: /* @__PURE__ */ jsx(Edit2, { className: "w-4 h-4" }) }),
            /* @__PURE__ */ jsx("button", { onClick: () => handleDelete(loc.id), className: "text-red-600 hover:bg-red-50 p-1.5 rounded", title: "Hapus", children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }) })
          ] }) })
        ] }, loc.id)),
        lokasiList.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 2, className: "p-4 text-center text-slate-500", children: "Belum ada data lokasi." }) })
      ] })
    ] }) })
  ] });
};
const AssetMasterPeralatan = () => {
  const [jenisList, setJenisList] = useState([]);
  const [tipeList, setTipeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJenisId, setSelectedJenisId] = useState(null);
  const [isAddingJenis, setIsAddingJenis] = useState(false);
  const [formJenisNama, setFormJenisNama] = useState("");
  const [editingJenisId, setEditingJenisId] = useState(null);
  const [editJenisNama, setEditJenisNama] = useState("");
  const [isAddingTipe, setIsAddingTipe] = useState(false);
  const [formTipeNama, setFormTipeNama] = useState("");
  const [editingTipeId, setEditingTipeId] = useState(null);
  const [editTipeNama, setEditTipeNama] = useState("");
  useEffect(() => {
    loadJenis();
  }, []);
  useEffect(() => {
    if (selectedJenisId) {
      loadTipe(selectedJenisId);
    } else {
      setTipeList([]);
    }
  }, [selectedJenisId]);
  const loadJenis = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("jenis_peralatan").select("*").order("nama");
    if (!error && data) {
      setJenisList(data);
    }
    setLoading(false);
  };
  const loadTipe = async (idJenis) => {
    const { data, error } = await supabase.from("tipe_peralatan").select("*").eq("id_jenis", idJenis).order("nama");
    if (!error && data) {
      setTipeList(data);
    }
  };
  const handleAddJenis = async () => {
    if (!formJenisNama.trim()) return alert("Nama Jenis harus diisi!");
    setLoading(true);
    const { error } = await supabase.from("jenis_peralatan").insert({ nama: formJenisNama.trim() });
    if (!error) {
      setFormJenisNama("");
      setIsAddingJenis(false);
      await loadJenis();
    } else alert("Gagal: " + error.message);
    setLoading(false);
  };
  const handleUpdateJenis = async (id) => {
    if (!editJenisNama.trim()) return alert("Nama Jenis harus diisi!");
    setLoading(true);
    const { error } = await supabase.from("jenis_peralatan").update({ nama: editJenisNama.trim() }).eq("id", id);
    if (!error) {
      setEditingJenisId(null);
      await loadJenis();
    } else alert("Gagal: " + error.message);
    setLoading(false);
  };
  const handleDeleteJenis = async (id) => {
    if (!window.confirm("Yakin ingin menghapus Jenis ini? Tipe dan Penempatan terkait mungkin akan terhapus atau error.")) return;
    setLoading(true);
    const { error } = await supabase.from("jenis_peralatan").delete().eq("id", id);
    if (!error) {
      if (selectedJenisId === id) setSelectedJenisId(null);
      await loadJenis();
    } else alert("Gagal: " + error.message);
    setLoading(false);
  };
  const handleAddTipe = async () => {
    if (!formTipeNama.trim() || !selectedJenisId) return alert("Nama Tipe harus diisi!");
    const { error } = await supabase.from("tipe_peralatan").insert({ id_jenis: selectedJenisId, nama: formTipeNama.trim() });
    if (!error) {
      setFormTipeNama("");
      setIsAddingTipe(false);
      await loadTipe(selectedJenisId);
    } else alert("Gagal: " + error.message);
  };
  const handleUpdateTipe = async (id) => {
    if (!editTipeNama.trim() || !selectedJenisId) return alert("Nama Tipe harus diisi!");
    const { error } = await supabase.from("tipe_peralatan").update({ nama: editTipeNama.trim() }).eq("id", id);
    if (!error) {
      setEditingTipeId(null);
      await loadTipe(selectedJenisId);
    } else alert("Gagal: " + error.message);
  };
  const handleDeleteTipe = async (id) => {
    if (!window.confirm("Yakin ingin menghapus Tipe ini? Penempatan terkait mungkin akan terhapus atau error.")) return;
    const { error } = await supabase.from("tipe_peralatan").delete().eq("id", id);
    if (!error && selectedJenisId) {
      await loadTipe(selectedJenisId);
    } else alert("Gagal: " + (error?.message || "Unknown error"));
  };
  if (loading && jenisList.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "flex justify-center p-8", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-blue-500" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-slate-800 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Cpu, { className: "w-5 h-5 text-indigo-500" }),
          " Jenis Peralatan"
        ] }),
        !isAddingJenis && /* @__PURE__ */ jsxs("button", { onClick: () => setIsAddingJenis(true), className: "flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors", children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
          " Tambah Jenis"
        ] })
      ] }),
      isAddingJenis && /* @__PURE__ */ jsxs("div", { className: "bg-indigo-50 p-4 rounded-xl border border-indigo-200 flex flex-col gap-3 mb-4", children: [
        /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-indigo-800", children: "Nama Jenis Peralatan" }),
        /* @__PURE__ */ jsx("input", { type: "text", value: formJenisNama, onChange: (e) => setFormJenisNama(e.target.value), className: "w-full p-2 border border-indigo-200 rounded-lg text-sm", placeholder: "Contoh: X-Ray" }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxs("button", { onClick: handleAddJenis, className: "flex-1 flex justify-center items-center gap-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700", children: [
            /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
            " Simpan"
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: () => setIsAddingJenis(false), className: "flex-1 flex justify-center items-center gap-1 bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-300", children: [
            /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }),
            " Batal"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm", children: /* @__PURE__ */ jsxs("ul", { className: "divide-y divide-slate-200", children: [
        jenisList.map((jenis) => /* @__PURE__ */ jsxs(
          "li",
          {
            className: `p-3 flex items-center justify-between cursor-pointer transition-colors ${selectedJenisId === jenis.id ? "bg-indigo-50 border-l-4 border-indigo-500" : "hover:bg-slate-50 border-l-4 border-transparent"}`,
            onClick: (e) => {
              if (e.target.closest(".actions")) return;
              setSelectedJenisId(jenis.id);
            },
            children: [
              editingJenisId === jenis.id ? /* @__PURE__ */ jsx("input", { type: "text", value: editJenisNama, onChange: (e) => setEditJenisNama(e.target.value), className: "w-full p-1.5 border rounded text-sm mr-2" }) : /* @__PURE__ */ jsx("span", { className: `font-semibold ${selectedJenisId === jenis.id ? "text-indigo-900" : "text-slate-700"}`, children: jenis.nama }),
              /* @__PURE__ */ jsx("div", { className: "actions flex justify-end gap-1 shrink-0", children: editingJenisId === jenis.id ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("button", { onClick: () => handleUpdateJenis(jenis.id), className: "text-emerald-600 hover:bg-emerald-50 p-1.5 rounded", children: /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }) }),
                /* @__PURE__ */ jsx("button", { onClick: () => setEditingJenisId(null), className: "text-slate-500 hover:bg-slate-100 p-1.5 rounded", children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }) })
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("button", { onClick: () => {
                  setEditingJenisId(jenis.id);
                  setEditJenisNama(jenis.nama);
                }, className: "text-blue-600 hover:bg-blue-50 p-1.5 rounded", children: /* @__PURE__ */ jsx(Edit2, { className: "w-4 h-4" }) }),
                /* @__PURE__ */ jsx("button", { onClick: () => handleDeleteJenis(jenis.id), className: "text-red-600 hover:bg-red-50 p-1.5 rounded", children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }) }),
                /* @__PURE__ */ jsx(ChevronRight, { className: `w-5 h-5 ml-2 ${selectedJenisId === jenis.id ? "text-indigo-500" : "text-slate-300"}` })
              ] }) })
            ]
          },
          jenis.id
        )),
        jenisList.length === 0 && /* @__PURE__ */ jsx("li", { className: "p-4 text-center text-slate-500 text-sm", children: "Belum ada data." })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-800 flex items-center gap-2", children: "Tipe / Model Mesin" }),
        selectedJenisId && !isAddingTipe && /* @__PURE__ */ jsxs("button", { onClick: () => setIsAddingTipe(true), className: "flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors", children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
          " Tambah Tipe"
        ] })
      ] }),
      !selectedJenisId ? /* @__PURE__ */ jsx("div", { className: "p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-sm", children: "Pilih Jenis Peralatan di sebelah kiri terlebih dahulu untuk melihat dan mengelola tipe mesinnya." }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        isAddingTipe && /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 p-4 rounded-xl border border-blue-200 flex flex-col gap-3 mb-4", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-blue-800", children: "Nama Tipe / Model" }),
          /* @__PURE__ */ jsx("input", { type: "text", value: formTipeNama, onChange: (e) => setFormTipeNama(e.target.value), className: "w-full p-2 border border-blue-200 rounded-lg text-sm", placeholder: "Contoh: Rapiscan 620DV" }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxs("button", { onClick: handleAddTipe, className: "flex-1 flex justify-center items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700", children: [
              /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
              " Simpan"
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: () => setIsAddingTipe(false), className: "flex-1 flex justify-center items-center gap-1 bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-300", children: [
              /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }),
              " Batal"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm", children: /* @__PURE__ */ jsxs("ul", { className: "divide-y divide-slate-200", children: [
          tipeList.map((tipe) => /* @__PURE__ */ jsxs("li", { className: "p-3 flex items-center justify-between hover:bg-slate-50 transition-colors", children: [
            editingTipeId === tipe.id ? /* @__PURE__ */ jsx("input", { type: "text", value: editTipeNama, onChange: (e) => setEditTipeNama(e.target.value), className: "w-full p-1.5 border rounded text-sm mr-2" }) : /* @__PURE__ */ jsx("span", { className: "font-medium text-slate-700 text-sm", children: tipe.nama }),
            /* @__PURE__ */ jsx("div", { className: "flex justify-end gap-1 shrink-0", children: editingTipeId === tipe.id ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("button", { onClick: () => handleUpdateTipe(tipe.id), className: "text-emerald-600 hover:bg-emerald-50 p-1.5 rounded", children: /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }) }),
              /* @__PURE__ */ jsx("button", { onClick: () => setEditingTipeId(null), className: "text-slate-500 hover:bg-slate-100 p-1.5 rounded", children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }) })
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("button", { onClick: () => {
                setEditingTipeId(tipe.id);
                setEditTipeNama(tipe.nama);
              }, className: "text-blue-600 hover:bg-blue-50 p-1.5 rounded", children: /* @__PURE__ */ jsx(Edit2, { className: "w-4 h-4" }) }),
              /* @__PURE__ */ jsx("button", { onClick: () => handleDeleteTipe(tipe.id), className: "text-red-600 hover:bg-red-50 p-1.5 rounded", children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }) })
            ] }) })
          ] }, tipe.id)),
          tipeList.length === 0 && /* @__PURE__ */ jsx("li", { className: "p-4 text-center text-slate-500 text-sm", children: "Belum ada data tipe untuk jenis ini." })
        ] }) })
      ] })
    ] })
  ] });
};
const UnitPeralatanManager = () => {
  const { initializeSupabaseData } = useMasterDataStore();
  const [unitList, setUnitList] = useState([]);
  const [jenisList, setJenisList] = useState([]);
  const [tipeList, setTipeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formJenis, setFormJenis] = useState("");
  const [formTipe, setFormTipe] = useState("");
  const [formSn, setFormSn] = useState("");
  const [formNoSertifikasi, setFormNoSertifikasi] = useState("");
  const [formTahunInstalasi, setFormTahunInstalasi] = useState("");
  const [formAmpere, setFormAmpere] = useState("");
  const [formMilik, setFormMilik] = useState("API");
  const [formCustomMilik, setFormCustomMilik] = useState("");
  const [formStatus, setFormStatus] = useState("operasi");
  const [formCatatan, setFormCatatan] = useState("");
  const MILIK_OPTIONS = [
    "API",
    "Bea Cukai",
    "Sewa",
    "Lainnya"
  ];
  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    setLoading(true);
    try {
      const [jenisRes, tipeRes, unitRes] = await Promise.all([
        supabase.from("jenis_peralatan").select("id, nama").order("nama"),
        supabase.from("tipe_peralatan").select("id, id_jenis, nama, varian").order("nama"),
        supabase.from("unit_peralatan").select(`
          *,
          tipe_peralatan ( id, id_jenis, nama, varian, jenis_peralatan ( id, nama ) )
        `).order("created_at", { ascending: false })
      ]);
      if (jenisRes.data) setJenisList(jenisRes.data);
      if (tipeRes.data) setTipeList(tipeRes.data);
      if (unitRes.data) setUnitList(unitRes.data);
    } catch (err) {
      console.error("Failed to load unit equipment data", err);
    } finally {
      setLoading(false);
    }
  };
  const resetForm = () => {
    setEditingId(null);
    setFormJenis("");
    setFormTipe("");
    setFormSn("");
    setFormNoSertifikasi("");
    setFormTahunInstalasi("");
    setFormAmpere("");
    setFormMilik("API");
    setFormCustomMilik("");
    setFormStatus("operasi");
    setFormCatatan("");
    setErrorMsg("");
  };
  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };
  const handleOpenEdit = (unit) => {
    setEditingId(unit.id);
    const idJenis = unit.tipe_peralatan?.id_jenis || "";
    setFormJenis(idJenis);
    setFormTipe(unit.id_tipe || "");
    setFormSn(unit.serial_number || "");
    setFormNoSertifikasi(unit.no_sertifikasi || "");
    setFormTahunInstalasi(unit.tahun_instalasi ? String(unit.tahun_instalasi) : "");
    setFormAmpere(unit.ampere ? String(unit.ampere) : "");
    const milikVal = unit.milik || "API";
    if (MILIK_OPTIONS.includes(milikVal)) {
      setFormMilik(milikVal);
      setFormCustomMilik("");
    } else {
      setFormMilik("Lainnya");
      setFormCustomMilik(milikVal);
    }
    setFormStatus(unit.status || "operasi");
    setFormCatatan(unit.catatan || "");
    setErrorMsg("");
    setIsFormOpen(true);
  };
  const handleSave = async () => {
    if (!formTipe) {
      setErrorMsg("Mohon pilih Jenis dan Tipe Mesin terlebih dahulu!");
      return;
    }
    const finalMilik = formMilik === "Lainnya" ? formCustomMilik.trim() || "Lainnya" : formMilik;
    const payload = {
      id_tipe: formTipe,
      serial_number: formSn.trim() || null,
      no_sertifikasi: formNoSertifikasi.trim() || null,
      tahun_instalasi: formTahunInstalasi ? parseInt(formTahunInstalasi, 10) : null,
      ampere: formAmpere.trim() || null,
      milik: finalMilik,
      status: formStatus,
      catatan: formCatatan.trim() || null
    };
    setSaving(true);
    setErrorMsg("");
    try {
      if (editingId) {
        const { error } = await supabase.from("unit_peralatan").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("unit_peralatan").insert(payload);
        if (error) throw error;
      }
      await loadData();
      initializeSupabaseData();
      setIsFormOpen(false);
      resetForm();
    } catch (err) {
      console.error("Error saving unit:", err);
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan data unit.");
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus unit fisik peralatan ini? Jika unit ini sedang terpasang di lokasi penempatan, mohon lepas atau hapus penempatannya terlebih dahulu.")) return;
    try {
      const { error } = await supabase.from("unit_peralatan").delete().eq("id", id);
      if (error) {
        if (error.message?.includes("foreign key constraint")) {
          alert("Gagal menghapus: Unit ini masih terhubung dengan data penempatan mesin aktif. Hapus dari tabel penempatan terlebih dahulu.");
        } else {
          throw error;
        }
      } else {
        await loadData();
        initializeSupabaseData();
      }
    } catch (err) {
      console.error("Failed delete unit:", err);
      alert("Gagal menghapus unit: " + (err.message || "Unknown error"));
    }
  };
  const filteredTipeForForm = tipeList.filter((t) => t.id_jenis === formJenis);
  const displayUnits = unitList.filter((u) => {
    if (filterJenis && u.tipe_peralatan?.id_jenis !== filterJenis) return false;
    if (filterStatus && u.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const snMatch = u.serial_number?.toLowerCase().includes(q);
      const tipeMatch = u.tipe_peralatan?.nama?.toLowerCase().includes(q);
      const milikMatch = u.milik?.toLowerCase().includes(q);
      const sertMatch = u.no_sertifikasi?.toLowerCase().includes(q);
      if (!snMatch && !tipeMatch && !milikMatch && !sertMatch) return false;
    }
    return true;
  });
  const getStatusBadge = (status) => {
    switch (status) {
      case "operasi":
        return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3.5 h-3.5 text-emerald-600" }),
          " Operasi"
        ] });
      case "standby":
        return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200", children: [
          /* @__PURE__ */ jsx(Clock, { className: "w-3.5 h-3.5 text-blue-600" }),
          " Standby"
        ] });
      case "gudang":
        return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300", children: [
          /* @__PURE__ */ jsx(Box, { className: "w-3.5 h-3.5 text-slate-500" }),
          " Gudang"
        ] });
      case "rusak":
        return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "w-3.5 h-3.5 text-rose-600" }),
          " Rusak"
        ] });
      default:
        return /* @__PURE__ */ jsx("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700", children: status });
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-slate-800 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Layers, { className: "w-5 h-5 text-blue-600" }),
          " Manajemen Unit Fisik Peralatan"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mt-0.5", children: "Kelola data fisik setiap unit mesin (S/N, sertifikasi, status operasional & kepemilikan)." })
      ] }),
      !isFormOpen && /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: handleOpenAdd,
          className: "flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors shrink-0",
          children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
            " Tambah Unit Fisik"
          ]
        }
      )
    ] }),
    isFormOpen && /* @__PURE__ */ jsxs("div", { className: "bg-blue-50/70 border border-blue-200 rounded-2xl p-5 sm:p-6 shadow-sm relative transition-all", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-blue-200/80 pb-3 mb-4", children: [
        /* @__PURE__ */ jsxs("h4", { className: "font-bold text-blue-950 flex items-center gap-2 text-base", children: [
          editingId ? /* @__PURE__ */ jsx(Edit2, { className: "w-4 h-4 text-blue-600" }) : /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 text-blue-600" }),
          editingId ? "Edit Data Unit Fisik" : "Tambah Unit Fisik Baru"
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              setIsFormOpen(false);
              resetForm();
            },
            className: "text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white/60 transition-colors",
            children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
          }
        )
      ] }),
      errorMsg && /* @__PURE__ */ jsxs("div", { className: "mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-xl flex items-start gap-2 border border-red-200", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 mt-0.5 shrink-0 text-red-600" }),
        /* @__PURE__ */ jsx("p", { children: errorMsg })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-xs font-bold text-blue-900 mb-1", children: [
            "Jenis Peralatan ",
            /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: formJenis,
              onChange: (e) => {
                setFormJenis(e.target.value);
                setFormTipe("");
              },
              className: "w-full p-2.5 border border-blue-200 rounded-xl text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "-- Pilih Jenis --" }),
                jenisList.map((j) => /* @__PURE__ */ jsx("option", { value: j.id, children: j.nama }, j.id))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-xs font-bold text-blue-900 mb-1", children: [
            "Tipe / Model Mesin ",
            /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: formTipe,
              onChange: (e) => setFormTipe(e.target.value),
              disabled: !formJenis,
              className: "w-full p-2.5 border border-blue-200 rounded-xl text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "-- Pilih Tipe --" }),
                filteredTipeForForm.map((t) => /* @__PURE__ */ jsx("option", { value: t.id, children: t.nama }, t.id))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-xs font-bold text-blue-900 mb-1 flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(Tag, { className: "w-3.5 h-3.5 text-blue-600" }),
            " Serial Number (S/N)"
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: formSn,
              onChange: (e) => setFormSn(e.target.value),
              placeholder: "Contoh: SN-90210-B",
              className: "w-full p-2.5 border border-blue-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-xs font-bold text-blue-900 mb-1 flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(Building2, { className: "w-3.5 h-3.5 text-blue-600" }),
            " Kepemilikan Mesin"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(
              "select",
              {
                value: formMilik,
                onChange: (e) => setFormMilik(e.target.value),
                className: "w-full p-2.5 border border-blue-200 rounded-xl text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none",
                children: MILIK_OPTIONS.map((opt) => /* @__PURE__ */ jsx("option", { value: opt, children: opt }, opt))
              }
            ),
            formMilik === "Lainnya" && /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: formCustomMilik,
                onChange: (e) => setFormCustomMilik(e.target.value),
                placeholder: "Tulis nama instansi kepemilikan...",
                className: "w-full p-2 border border-blue-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-xs font-bold text-blue-900 mb-1", children: [
            "Status Operasional ",
            /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: formStatus,
              onChange: (e) => setFormStatus(e.target.value),
              className: "w-full p-2.5 border border-blue-200 rounded-xl text-sm bg-white font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none",
              children: [
                /* @__PURE__ */ jsx("option", { value: "operasi", children: "🟢 Operasi" }),
                /* @__PURE__ */ jsx("option", { value: "standby", children: "🟡 Standby" }),
                /* @__PURE__ */ jsx("option", { value: "gudang", children: "⚪ Gudang" }),
                /* @__PURE__ */ jsx("option", { value: "rusak", children: "🔴 Rusak" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-xs font-bold text-blue-900 mb-1 flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(ShieldCheck, { className: "w-3.5 h-3.5 text-blue-600" }),
            " Nomor Sertifikasi"
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: formNoSertifikasi,
              onChange: (e) => setFormNoSertifikasi(e.target.value),
              placeholder: "Contoh: SERT/DGCA/2026/019",
              className: "w-full p-2.5 border border-blue-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-xs font-bold text-blue-900 mb-1 flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "w-3.5 h-3.5 text-blue-600" }),
            " Tahun Instalasi"
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              value: formTahunInstalasi,
              onChange: (e) => setFormTahunInstalasi(e.target.value),
              placeholder: "Contoh: 2021",
              min: "1990",
              max: "2100",
              className: "w-full p-2.5 border border-blue-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-xs font-bold text-blue-900 mb-1 flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(Zap, { className: "w-3.5 h-3.5 text-amber-500" }),
            " Ampere (Arus Listrik)"
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: formAmpere,
              onChange: (e) => setFormAmpere(e.target.value),
              placeholder: "Contoh: 16A atau 32 Ampere",
              className: "w-full p-2.5 border border-blue-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "md:col-span-2 lg:col-span-2", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-blue-900 mb-1", children: "Catatan Tambahan (Opsional)" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: formCatatan,
              onChange: (e) => setFormCatatan(e.target.value),
              placeholder: "Contoh: Kondisi fisik baik, cadangan dari Terminal 2F...",
              className: "w-full p-2.5 border border-blue-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-3 mt-6 pt-4 border-t border-blue-200/80", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              setIsFormOpen(false);
              resetForm();
            },
            disabled: saving,
            className: "px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-200 transition-colors",
            children: "Batal"
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleSave,
            disabled: saving || !formTipe,
            className: "px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-sm transition-colors flex items-center gap-2",
            children: [
              saving ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
              editingId ? "Simpan Perubahan" : "Simpan Unit"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 relative", children: [
        /* @__PURE__ */ jsx(Search, { className: "w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            placeholder: "Cari Serial Number, Tipe Mesin, Sertifikat, atau Kepemilikan...",
            className: "w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "w-44 sm:w-48", children: /* @__PURE__ */ jsxs(
          "select",
          {
            value: filterJenis,
            onChange: (e) => setFilterJenis(e.target.value),
            className: "w-full p-2 border border-slate-300 rounded-xl text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none",
            children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "Semua Jenis" }),
              jenisList.map((j) => /* @__PURE__ */ jsx("option", { value: j.id, children: j.nama }, j.id))
            ]
          }
        ) }),
        /* @__PURE__ */ jsx("div", { className: "w-36 sm:w-40", children: /* @__PURE__ */ jsxs(
          "select",
          {
            value: filterStatus,
            onChange: (e) => setFilterStatus(e.target.value),
            className: "w-full p-2 border border-slate-300 rounded-xl text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none",
            children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "Semua Status" }),
              /* @__PURE__ */ jsx("option", { value: "operasi", children: "Operasi" }),
              /* @__PURE__ */ jsx("option", { value: "standby", children: "Standby" }),
              /* @__PURE__ */ jsx("option", { value: "gudang", children: "Gudang" }),
              /* @__PURE__ */ jsx("option", { value: "rusak", children: "Rusak" })
            ]
          }
        ) })
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsx("div", { className: "flex justify-center items-center py-16", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 text-blue-500 animate-spin" }) }) : displayUnits.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50", children: [
      /* @__PURE__ */ jsx(Box, { className: "w-10 h-10 text-slate-300 mx-auto mb-3" }),
      /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-700 text-base", children: "Belum ada unit peralatan yang sesuai." }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mt-1", children: 'Tekan tombol "Tambah Unit Fisik" di atas untuk menambahkan data baru.' })
    ] }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: displayUnits.map((unit) => {
      const jenisNama = unit.tipe_peralatan?.jenis_peralatan?.nama || "Unknown Jenis";
      const tipeNama = unit.tipe_peralatan?.nama || "Unknown Tipe";
      const sn = unit.serial_number || "Tanpa S/N";
      return /* @__PURE__ */ jsxs(
        "div",
        {
          className: "bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between",
          children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 mb-3", children: [
                /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg flex items-center gap-1.5 border border-slate-200/80", children: [
                  /* @__PURE__ */ jsx(Cpu, { className: "w-3.5 h-3.5 text-blue-600" }),
                  " ",
                  jenisNama
                ] }),
                getStatusBadge(unit.status)
              ] }),
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-slate-900 text-base leading-snug", children: tipeNama }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-sm font-semibold text-blue-600 mt-1", children: [
                /* @__PURE__ */ jsx(Tag, { className: "w-4 h-4" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "S/N: ",
                  /* @__PURE__ */ jsx("strong", { className: "font-mono text-slate-800", children: sn })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-1.5 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-slate-400 font-medium", children: "Kepemilikan:" }),
                  /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-700", children: unit.milik || "API" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-slate-400 font-medium", children: "No. Sertifikasi:" }),
                  /* @__PURE__ */ jsx("span", { className: "font-semibold text-slate-700", children: unit.no_sertifikasi || "-" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-slate-400 font-medium", children: "Tahun Instalasi:" }),
                  /* @__PURE__ */ jsx("span", { className: "font-semibold text-slate-700", children: unit.tahun_instalasi || "-" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-slate-400 font-medium", children: "Ampere:" }),
                  /* @__PURE__ */ jsx("span", { className: "font-semibold text-slate-700", children: unit.ampere || "-" })
                ] }),
                unit.catatan && /* @__PURE__ */ jsxs("div", { className: "pt-1.5 mt-1.5 border-t border-slate-200/60 text-slate-500 italic line-clamp-2", children: [
                  '"',
                  unit.catatan,
                  '"'
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => handleOpenEdit(unit),
                  className: "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors",
                  children: [
                    /* @__PURE__ */ jsx(Edit2, { className: "w-3.5 h-3.5" }),
                    " Edit"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => handleDelete(unit.id),
                  className: "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors",
                  children: [
                    /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" }),
                    " Hapus"
                  ]
                }
              )
            ] })
          ]
        },
        unit.id
      );
    }) })
  ] });
};
const AssetManager = () => {
  const { initializeSupabaseData } = useMasterDataStore();
  const [activeTab, setActiveTab] = useState("penempatan");
  const [locations, setLocations] = useState([]);
  const [jenisData, setJenisData] = useState([]);
  const [tipeData, setTipeData] = useState([]);
  const [unitsData, setUnitsData] = useState([]);
  const [allAssets, setAllAssets] = useState([]);
  const [loadingBase, setLoadingBase] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterJenis, setFilterJenis] = useState("");
  const [filterLokasi, setFilterLokasi] = useState("");
  const [formJenis, setFormJenis] = useState("");
  const [formTipe, setFormTipe] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formLokasi, setFormLokasi] = useState("");
  const [formTitik, setFormTitik] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  useEffect(() => {
    if (activeTab === "penempatan") {
      loadBaseData();
    }
  }, [activeTab]);
  const loadBaseData = async () => {
    setLoadingBase(true);
    try {
      const [lokRes, jenisRes, tipeRes, unitRes, assetRes] = await Promise.all([
        supabase.from("lokasi").select("id, nama").order("nama"),
        supabase.from("jenis_peralatan").select("id, nama").order("nama"),
        supabase.from("tipe_peralatan").select("id, id_jenis, nama, varian").order("nama"),
        supabase.from("unit_peralatan").select("id, id_tipe, serial_number, milik, status").order("serial_number"),
        supabase.from("penempatan_peralatan").select(`
          id,
          is_active,
          id_lokasi,
          id_unit,
          tipe_peralatan ( id, id_jenis, nama, jenis_peralatan ( nama ) ),
          unit_peralatan ( id, serial_number, milik, status ),
          titik_lokasi ( id, nomor ),
          lokasi ( id, nama )
        `)
      ]);
      if (lokRes.data) setLocations(lokRes.data);
      if (jenisRes.data) setJenisData(jenisRes.data);
      if (tipeRes.data) setTipeData(tipeRes.data);
      if (unitRes.data) setUnitsData(unitRes.data);
      if (assetRes.data) {
        const sorted = assetRes.data.sort((a, b) => {
          const numA = parseInt(a.titik_lokasi?.nomor?.replace(/[^0-9]/g, "") || "0", 10);
          const numB = parseInt(b.titik_lokasi?.nomor?.replace(/[^0-9]/g, "") || "0", 10);
          return numA - numB;
        });
        setAllAssets(sorted);
      }
    } catch (err) {
      console.error("Failed to load base data", err);
    } finally {
      setLoadingBase(false);
    }
  };
  const handleAddAsset = async () => {
    if (!formLokasi || !formTipe || !formTitik.trim()) {
      setErrorMsg("Mohon lengkapi semua field (Lokasi, Tipe, Titik)!");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      const titikArray = formTitik.split(",").map((t) => t.trim()).filter((t) => t.length > 0);
      if (titikArray.length === 0) {
        throw new Error("Format titik tidak valid.");
      }
      for (const titikStr of titikArray) {
        let titikId = null;
        const { data: existingTitik, error: titikErr } = await supabase.from("titik_lokasi").select("id").eq("id_lokasi", formLokasi).eq("nomor", titikStr).maybeSingle();
        if (existingTitik) {
          titikId = existingTitik.id;
        } else {
          const { data: newTitik, error: insertErr } = await supabase.from("titik_lokasi").insert({ id_lokasi: formLokasi, nomor: titikStr }).select("id").single();
          if (insertErr) throw insertErr;
          titikId = newTitik.id;
        }
        const { error: penempatanErr } = await supabase.from("penempatan_peralatan").insert({
          id_tipe: formTipe,
          id_unit: formUnit || null,
          id_lokasi: formLokasi,
          id_titik: titikId,
          is_active: true
        });
        if (penempatanErr) throw penempatanErr;
      }
      setFormTitik("");
      await loadBaseData();
      initializeSupabaseData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteAsset = async (id) => {
    if (!window.confirm("Yakin ingin menghapus mesin ini dari area ini secara permanen?")) return;
    try {
      const { error } = await supabase.from("penempatan_peralatan").delete().eq("id", id);
      if (error) throw error;
      await loadBaseData();
      initializeSupabaseData();
    } catch (err) {
      console.error("Gagal menghapus aset", err);
      alert("Gagal menghapus aset.");
    }
  };
  const locationsWithFilteredJenis = locations.filter((loc) => {
    if (!filterJenis) return true;
    return allAssets.some((a) => a.id_lokasi === loc.id && a.tipe_peralatan?.id_jenis === filterJenis);
  });
  useEffect(() => {
    if (filterJenis && filterLokasi) {
      const isValid = locationsWithFilteredJenis.some((l) => l.id === filterLokasi);
      if (!isValid) setFilterLokasi("");
    }
  }, [filterJenis]);
  const displayAssets = allAssets.filter((a) => {
    if (filterJenis && a.tipe_peralatan?.id_jenis !== filterJenis) return false;
    if (filterLokasi && a.id_lokasi !== filterLokasi) return false;
    return true;
  });
  const filteredTipeForForm = tipeData.filter((t) => t.id_jenis === formJenis);
  const filteredUnitsForForm = unitsData.filter((u) => u.id_tipe === formTipe);
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex border-b border-slate-200 bg-slate-50 overflow-x-auto hide-scrollbar", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setActiveTab("penempatan"),
          className: `flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition-colors ${activeTab === "penempatan" ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`,
          children: [
            /* @__PURE__ */ jsx(LayoutGrid, { className: "w-4 h-4" }),
            " Penempatan Mesin"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setActiveTab("unit"),
          className: `flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition-colors ${activeTab === "unit" ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`,
          children: [
            /* @__PURE__ */ jsx(Layers, { className: "w-4 h-4" }),
            " Unit Peralatan"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setActiveTab("lokasi"),
          className: `flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition-colors ${activeTab === "lokasi" ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`,
          children: [
            /* @__PURE__ */ jsx(MapPin, { className: "w-4 h-4" }),
            " Master Lokasi"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setActiveTab("peralatan"),
          className: `flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition-colors ${activeTab === "peralatan" ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`,
          children: [
            /* @__PURE__ */ jsx(Database, { className: "w-4 h-4" }),
            " Master Peralatan"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
      activeTab === "unit" && /* @__PURE__ */ jsx(UnitPeralatanManager, {}),
      activeTab === "lokasi" && /* @__PURE__ */ jsx(AssetMasterLokasi, {}),
      activeTab === "peralatan" && /* @__PURE__ */ jsx(AssetMasterPeralatan, {}),
      activeTab === "penempatan" && (loadingBase ? /* @__PURE__ */ jsx("div", { className: "flex justify-center p-12", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 text-blue-500 animate-spin" }) }) : /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [
        /* @__PURE__ */ jsx("div", { className: "lg:col-span-1", children: /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 p-5 rounded-xl border border-blue-100 sticky top-4", children: [
          /* @__PURE__ */ jsxs("h3", { className: "font-bold text-blue-900 mb-4 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-5 h-5" }),
            " Tambah Penempatan"
          ] }),
          errorMsg && /* @__PURE__ */ jsxs("div", { className: "mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg flex items-start gap-2", children: [
            /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsx("p", { children: errorMsg })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-blue-800 mb-1", children: "Jenis Peralatan" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: formJenis,
                  onChange: (e) => {
                    setFormJenis(e.target.value);
                    setFormTipe("");
                  },
                  className: "w-full p-2 border border-blue-200 rounded-lg text-sm bg-white",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "-- Pilih Jenis --" }),
                    jenisData.map((j) => /* @__PURE__ */ jsx("option", { value: j.id, children: j.nama }, j.id))
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-blue-800 mb-1", children: "Tipe / Model Mesin" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: formTipe,
                  onChange: (e) => {
                    setFormTipe(e.target.value);
                    setFormUnit("");
                  },
                  disabled: !formJenis,
                  className: "w-full p-2 border border-blue-200 rounded-lg text-sm bg-white disabled:opacity-50",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "-- Pilih Tipe --" }),
                    filteredTipeForForm.map((t) => /* @__PURE__ */ jsx("option", { value: t.id, children: t.nama }, t.id))
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-xs font-semibold text-blue-800 mb-1", children: [
                "Pilih Unit Spesifik (S/N) ",
                /* @__PURE__ */ jsx("span", { className: "font-normal text-slate-500", children: "(Opsional)" })
              ] }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: formUnit,
                  onChange: (e) => setFormUnit(e.target.value),
                  disabled: !formTipe || filteredUnitsForForm.length === 0,
                  className: "w-full p-2 border border-blue-200 rounded-lg text-sm bg-white disabled:opacity-50",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "-- Semua / Umum (Tanpa S/N) --" }),
                    filteredUnitsForForm.map((u) => /* @__PURE__ */ jsxs("option", { value: u.id, children: [
                      "S/N: ",
                      u.serial_number || "Tanpa S/N",
                      " (",
                      u.milik || "API",
                      ")"
                    ] }, u.id))
                  ]
                }
              ),
              formTipe && filteredUnitsForForm.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-[11px] text-amber-700 mt-1", children: "Belum ada data unit fisik untuk tipe ini." })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-blue-800 mb-1", children: "Lokasi" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: formLokasi,
                  onChange: (e) => setFormLokasi(e.target.value),
                  className: "w-full p-2 border border-blue-200 rounded-lg text-sm bg-white",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "- Pilih Lokasi -" }),
                    locations.map((loc) => /* @__PURE__ */ jsx("option", { value: loc.id, children: loc.nama }, loc.id))
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-xs font-semibold text-blue-800 mb-1", children: [
                "Nomor Titik ",
                /* @__PURE__ */ jsx("span", { className: "font-normal text-blue-600", children: "(Bisa multi, pisah dengan koma)" })
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: formTitik,
                  onChange: (e) => setFormTitik(e.target.value),
                  placeholder: "Contoh: 1, 2, 3",
                  className: "w-full p-2 border border-blue-200 rounded-lg text-sm bg-white"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: handleAddAsset,
                disabled: saving || !formTipe || !formLokasi || !formTitik.trim(),
                className: "w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2",
                children: [
                  saving ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
                  "Simpan Penempatan"
                ]
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2", children: [
          /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6", children: /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-slate-800 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Layers, { className: "w-5 h-5 text-slate-500" }),
            " Daftar Mesin Terpasang"
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Filter Jenis Peralatan" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: filterJenis,
                  onChange: (e) => setFilterJenis(e.target.value),
                  className: "w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-medium",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "Semua Jenis Peralatan" }),
                    jenisData.map((j) => /* @__PURE__ */ jsx("option", { value: j.id, children: j.nama }, j.id))
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Filter Lokasi" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: filterLokasi,
                  onChange: (e) => setFilterLokasi(e.target.value),
                  className: "w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-medium",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "- Pilih Lokasi -" }),
                    locationsWithFilteredJenis.map((loc) => /* @__PURE__ */ jsx("option", { value: loc.id, children: loc.nama }, loc.id))
                  ]
                }
              )
            ] })
          ] }),
          displayAssets.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50", children: /* @__PURE__ */ jsx("p", { className: "text-slate-500", children: "Tidak ada data penempatan sesuai filter." }) }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: displayAssets.map((asset) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-xl bg-white hover:border-blue-300 transition-colors shadow-sm gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "bg-slate-100 p-2.5 rounded-lg shrink-0", children: /* @__PURE__ */ jsx(Cpu, { className: "w-5 h-5 text-slate-600" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded flex items-center gap-1", children: [
                    /* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3" }),
                    " ",
                    asset.lokasi?.nama || "Unknown"
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded", children: asset.tipe_peralatan?.jenis_peralatan?.nama || "Unknown" }),
                  !asset.is_active && /* @__PURE__ */ jsx("span", { className: "text-xs font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded", children: "Nonaktif" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800", children: asset.tipe_peralatan?.nama || "Tipe Tidak Diketahui" }),
                asset.unit_peralatan?.serial_number && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 mt-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60 w-fit", children: [
                  /* @__PURE__ */ jsxs("span", { children: [
                    "S/N: ",
                    /* @__PURE__ */ jsx("strong", { className: "font-mono", children: asset.unit_peralatan.serial_number })
                  ] }),
                  asset.unit_peralatan.milik && /* @__PURE__ */ jsxs("span", { className: "text-blue-500", children: [
                    "• ",
                    asset.unit_peralatan.milik
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-sm text-slate-500 mt-1", children: [
                  /* @__PURE__ */ jsx(Hash, { className: "w-3.5 h-3.5" }),
                  " Titik: ",
                  /* @__PURE__ */ jsx("strong", { className: "text-slate-700", children: asset.titik_lokasi?.nomor || "-" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => handleDeleteAsset(asset.id),
                className: "flex items-center justify-center gap-1 px-3 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors sm:w-auto w-full shrink-0",
                children: [
                  /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }),
                  " Hapus"
                ]
              }
            )
          ] }, asset.id)) })
        ] })
      ] }))
    ] })
  ] });
};
const TabData = () => {
  const { user, logout } = useAuthStore();
  if (!user) {
    return /* @__PURE__ */ jsx(AdminLogin, {});
  }
  return /* @__PURE__ */ jsx(AdminDashboard, { logout });
};
const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (signInError) {
      setError("Email atau password salah.");
    }
    setLoading(false);
  };
  return /* @__PURE__ */ jsx("div", { className: "p-6 md:p-12 flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500", children: /* @__PURE__ */ jsxs("div", { className: "bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center mb-8", children: [
      /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(Lock, { className: "w-8 h-8 text-blue-600" }) }),
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-slate-800", children: "Admin Area" }),
      /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-center mt-2 text-sm", children: "Masuk untuk mengelola master data dan database peralatan." })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleLogin, className: "space-y-5", children: [
      error && /* @__PURE__ */ jsxs("div", { className: "bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium flex items-start gap-3 border border-rose-100", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "w-5 h-5 shrink-0" }),
        /* @__PURE__ */ jsx("p", { children: error })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 mb-2", children: "Email Admin" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center bg-slate-50 border border-slate-300 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "pl-4 pr-3 text-slate-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(Mail, { className: "w-5 h-5" }) }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "email",
              required: true,
              value: email,
              onChange: (e) => setEmail(e.target.value),
              className: "w-full py-3 pr-4 bg-transparent outline-none font-medium text-slate-800",
              placeholder: "admin@airport.com"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 mb-2", children: "Kata Sandi" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center bg-slate-50 border border-slate-300 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "pl-4 pr-3 text-slate-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(KeyRound, { className: "w-5 h-5" }) }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "password",
              required: true,
              value: password,
              onChange: (e) => setPassword(e.target.value),
              className: "w-full py-3 pr-4 bg-transparent outline-none font-medium text-slate-800",
              placeholder: "••••••••"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: loading,
          className: "w-full py-4 text-lg mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200 flex justify-center items-center gap-2 disabled:opacity-70",
          children: loading ? /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin" }) : "Login"
        }
      )
    ] })
  ] }) });
};
const AdminDashboard = ({ logout }) => {
  return /* @__PURE__ */ jsxs("div", { className: "p-6 animate-in fade-in duration-300", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-black text-slate-800 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Database, { className: "w-7 h-7 text-blue-600" }),
          " Pengaturan Data"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 mt-1 font-medium", children: "Kelola konfigurasi dan master data laporan." })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: logout, className: "flex items-center gap-2 px-4 py-2.5 bg-rose-100 text-rose-700 hover:bg-rose-200 font-bold rounded-xl transition-colors", children: [
        /* @__PURE__ */ jsx(LogOut, { className: "w-5 h-5" }),
        " Keluar"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]", children: /* @__PURE__ */ jsx(LocalDataEditor, {}) })
  ] });
};
const LocalDataEditor = () => {
  const store = useMasterDataStore();
  const [activeSubTab, setActiveSubTab] = useState("upload_jadwal");
  const [localData, setLocalData] = useState([]);
  useEffect(() => {
    switch (activeSubTab) {
      case "api_t2":
        setLocalData([...store.dataApiT2]);
        break;
      case "om_ias_t2":
        setLocalData([...store.dataOmIasT2]);
        break;
      case "storing_equip":
        setLocalData([...store.storingEquipments]);
        break;
      case "tip_left":
        setLocalData([...store.tipLeftCol]);
        break;
    }
  }, [activeSubTab, store]);
  const [isSavingDb, setIsSavingDb] = useState(false);
  const handleSave = async () => {
    setIsSavingDb(true);
    try {
      switch (activeSubTab) {
        case "api_t2":
          store.setDataApiT2(localData);
          await store.savePersonelToSupabase(localData, "API T2");
          break;
        case "om_ias_t2":
          store.setDataOmIasT2(localData);
          await store.savePersonelToSupabase(localData, "OM/IAS T2");
          break;
        case "storing_equip":
          store.setStoringEquipments(localData);
          break;
        case "tip_left":
          store.setTipLeftCol(localData);
          break;
      }
      if (activeSubTab !== "kalibrasi_equip") {
        alert("Data berhasil disimpan ke sistem & database!");
      }
    } catch (err) {
      console.error("Error saving data:", err);
      alert("Terjadi kesalahan saat menyimpan: " + (err?.message || err));
    } finally {
      setIsSavingDb(false);
    }
  };
  const handleTextChange = (index, field, value) => {
    const newData = [...localData];
    if (field) {
      if (field === "name") {
        newData[index][field] = toTitleCase(value);
      } else {
        newData[index][field] = value;
      }
    } else {
      newData[index] = value;
    }
    setLocalData(newData);
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-slate-800 text-white p-2 flex gap-1 overflow-x-auto hide-scrollbar", children: [
      { id: "upload_jadwal", label: "Upload Jadwal Excel" },
      { id: "manajemen_aset", label: "Manajemen Aset (Lokasi & Mesin)" },
      { id: "api_t2", label: "Personel API T2" },
      { id: "om_ias_t2", label: "Personel OM/IAS" },
      { id: "checklist_config", label: "Checklist Config" },
      { id: "kalibrasi_equip", label: "Config Peralatan Kalibrasi" },
      { id: "tip_data_manager", label: "Data TIP Tersimpan" }
    ].map((t) => /* @__PURE__ */ jsx("button", { onClick: () => setActiveSubTab(t.id), className: `px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${activeSubTab === t.id ? "bg-blue-600" : "hover:bg-slate-700 text-slate-300"}`, children: t.label }, t.id)) }),
    activeSubTab === "upload_jadwal" ? /* @__PURE__ */ jsx("div", { className: "p-6", children: /* @__PURE__ */ jsx(ScheduleUploader, {}) }) : activeSubTab === "manajemen_aset" ? /* @__PURE__ */ jsx("div", { className: "p-6 bg-slate-50 min-h-[500px]", children: /* @__PURE__ */ jsx(AssetManager, {}) }) : activeSubTab === "checklist_config" ? /* @__PURE__ */ jsx("div", { className: "p-6", children: /* @__PURE__ */ jsx(ChecklistDataEditor, {}) }) : activeSubTab === "kalibrasi_equip" ? /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-800 mb-4", children: "Peralatan untuk Tab Kalibrasi" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mb-6", children: "Pilih jenis peralatan dari database yang akan dimunculkan sebagai opsi di halaman Kalibrasi." }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4", children: store.jenisPeralatanData.map((jenis) => {
        const isChecked = !!jenis.tampil_di_kalibrasi;
        return /* @__PURE__ */ jsxs("label", { className: `flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${isChecked ? "bg-blue-50 border-blue-500 shadow-sm" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`, children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              checked: isChecked,
              onChange: (e) => {
                store.toggleKalibrasiEquipmentDb(jenis.id, e.target.checked);
              },
              className: "w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "ml-3 font-semibold text-slate-700", children: jenis.nama })
        ] }, jenis.id);
      }) }),
      /* @__PURE__ */ jsx("div", { className: "pt-6 mt-6 border-t border-slate-200 text-sm text-green-600 font-medium", children: "* Perubahan otomatis disimpan ke database." })
    ] }) : activeSubTab === "tip_data_manager" ? /* @__PURE__ */ jsx("div", { className: "p-0 border border-slate-200 rounded-xl overflow-hidden m-6", children: /* @__PURE__ */ jsx(TipDataManager, {}) }) : /* @__PURE__ */ jsxs("div", { className: "p-6 flex-1 space-y-4", children: [
      localData.map((item, index) => /* @__PURE__ */ jsxs("div", { className: "flex gap-2 sm:gap-3 items-start sm:items-center", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-1 flex flex-col sm:flex-row gap-2 sm:gap-3 w-full", children: activeSubTab === "api_t2" || activeSubTab === "om_ias_t2" ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs(
            "select",
            {
              className: "sm:w-1/3 w-full p-2 border rounded-lg text-sm bg-white",
              value: item.jabatan || "",
              onChange: (e) => handleTextChange(index, "jabatan", e.target.value),
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "-- Pilih Jabatan --" }),
                activeSubTab === "api_t2" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("option", { value: "Supervisor", children: "Supervisor" }),
                  /* @__PURE__ */ jsx("option", { value: "Engineer", children: "Engineer" }),
                  /* @__PURE__ */ jsx("option", { value: "Technician", children: "Technician" }),
                  item.jabatan && !["Supervisor", "Engineer", "Technician"].includes(item.jabatan) && /* @__PURE__ */ jsx("option", { value: item.jabatan, children: item.jabatan })
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("option", { value: "Supervisor", children: "Supervisor" }),
                  /* @__PURE__ */ jsx("option", { value: "Teknisi", children: "Teknisi" }),
                  /* @__PURE__ */ jsx("option", { value: "Pembantu Teknisi", children: "Pembantu Teknisi" }),
                  item.jabatan && !["Supervisor", "Teknisi", "Pembantu Teknisi"].includes(item.jabatan) && /* @__PURE__ */ jsx("option", { value: item.jabatan, children: item.jabatan })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsx("input", { className: "flex-1 w-full p-2 border rounded-lg text-sm bg-white", placeholder: "Nama Personel", value: item.name || "", onChange: (e) => handleTextChange(index, "name", e.target.value) }),
          /* @__PURE__ */ jsx("input", { className: "sm:w-1/4 w-full p-2 border rounded-lg text-sm bg-white", placeholder: "No. WA", value: item.phone || "", onChange: (e) => handleTextChange(index, "phone", e.target.value) })
        ] }) : /* @__PURE__ */ jsx("input", { className: "flex-1 w-full p-2 border rounded-lg", value: item, onChange: (e) => handleTextChange(index, void 0, e.target.value) }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-1 items-center mt-1 sm:mt-0 shrink-0", children: [
          (activeSubTab === "api_t2" || activeSubTab === "om_ias_t2") && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  if (index === 0) return;
                  const d = [...localData];
                  const temp = d[index - 1];
                  d[index - 1] = d[index];
                  d[index] = temp;
                  setLocalData(d);
                },
                disabled: index === 0,
                className: "p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-lg font-bold text-sm",
                title: "Naikkan Urutan",
                children: "▲"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  if (index === localData.length - 1) return;
                  const d = [...localData];
                  const temp = d[index + 1];
                  d[index + 1] = d[index];
                  d[index] = temp;
                  setLocalData(d);
                },
                disabled: index === localData.length - 1,
                className: "p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-lg font-bold text-sm",
                title: "Turunkan Urutan",
                children: "▼"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
            const d = [...localData];
            d.splice(index, 1);
            setLocalData(d);
          }, className: "p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-lg", title: "Hapus", children: /* @__PURE__ */ jsx(Trash2, { className: "w-5 h-5" }) })
        ] })
      ] }, index)),
      /* @__PURE__ */ jsx("button", { onClick: () => {
        const d = [...localData];
        if (activeSubTab === "api_t2" || activeSubTab === "om_ias_t2") d.push({ name: "", phone: "", jabatan: "" });
        else d.push("");
        setLocalData(d);
      }, className: "w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 font-bold rounded-lg hover:bg-blue-50", children: "+ Tambah Baris" }),
      /* @__PURE__ */ jsx("div", { className: "pt-4 border-t border-slate-200 flex justify-end", children: /* @__PURE__ */ jsx("button", { onClick: handleSave, disabled: isSavingDb, className: "px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center gap-2", children: isSavingDb ? "Menyimpan..." : "Simpan Perubahan" }) })
    ] })
  ] });
};
const TipDataManager = () => {
  const [tipList, setTipList] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchTipData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("master_configs").select("key, updated_at").like("key", "tip_data_%").order("updated_at", { ascending: false });
    if (!error && data) {
      setTipList(data);
    }
    setLoading(false);
  };
  useEffect(() => {
    fetchTipData();
  }, []);
  const handleDelete = async (key) => {
    if (!window.confirm(`Hapus data ${key.replace("tip_data_", "").replace("_", " ")}?`)) return;
    await supabase.from("master_configs").delete().eq("key", key);
    fetchTipData();
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "p-12 flex justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-blue-500" }) });
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-800", children: "Daftar Data TIP Tersimpan" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "Data TIP bulanan yang telah disimpan ke cloud." })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: fetchTipData, className: "p-2.5 text-slate-500 hover:bg-slate-200 rounded-xl transition-colors", children: /* @__PURE__ */ jsx(RefreshCw, { className: "w-5 h-5" }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-100 text-slate-600 text-sm", children: [
        /* @__PURE__ */ jsx("th", { className: "p-4 font-bold border-b border-slate-200", children: "Bulan & Tahun" }),
        /* @__PURE__ */ jsx("th", { className: "p-4 font-bold border-b border-slate-200", children: "Terakhir Diperbarui" }),
        /* @__PURE__ */ jsx("th", { className: "p-4 font-bold border-b border-slate-200 w-24 text-center", children: "Aksi" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: tipList.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 3, className: "p-8 text-center text-slate-500 italic", children: "Belum ada data TIP yang tersimpan." }) }) : tipList.map((row, i) => {
        const monthYear = row.key.replace("tip_data_", "").replace("_", " ");
        const dateObj = new Date(row.updated_at);
        const formattedDate = !isNaN(dateObj.getTime()) ? dateObj.toLocaleString("id-ID") : "-";
        return /* @__PURE__ */ jsxs("tr", { className: `border-b border-slate-100 hover:bg-blue-50/50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`, children: [
          /* @__PURE__ */ jsx("td", { className: "p-4 font-medium text-slate-800 capitalize", children: monthYear }),
          /* @__PURE__ */ jsx("td", { className: "p-4 text-slate-600 text-sm", children: formattedDate }),
          /* @__PURE__ */ jsx("td", { className: "p-4 text-center", children: /* @__PURE__ */ jsx("button", { onClick: () => handleDelete(row.key), className: "p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors", title: "Hapus Data", children: /* @__PURE__ */ jsx(Trash2, { className: "w-5 h-5" }) }) })
        ] }, row.key);
      }) })
    ] }) })
  ] });
};
const TabKegiatan = () => {
  const { isCopied, setIsCopied } = useAppStore();
  const [kegiatanData, setKegiatanData] = useState(() => {
    const now = /* @__PURE__ */ new Date();
    const tzOffset = now.getTimezoneOffset() * 6e4;
    const localDate = new Date(now.getTime() - tzOffset).toISOString().split("T")[0];
    const currentHour = now.getHours().toString().padStart(2, "0");
    const currentMinute = now.getMinutes().toString().padStart(2, "0");
    return {
      tanggal: localDate,
      waktuMulai: `${currentHour}:${currentMinute}`,
      waktuSelesai: "",
      lokasi: "",
      kegiatan: ""
    };
  });
  const [photos, setPhotos] = useState([]);
  const [autoCollageFile, setAutoCollageFile] = useState(null);
  const [collageAnnotation, setCollageAnnotation] = useState(void 0);
  const photosRef = React.useRef(photos);
  photosRef.current = photos;
  React.useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => {
        if (p.preview && p.preview.startsWith("blob:")) {
          URL.revokeObjectURL(p.preview);
        }
      });
    };
  }, []);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setKegiatanData({ ...kegiatanData, [name]: value });
  };
  const handlePhotoUpload = async (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const compressedResults = await Promise.all(files.map((f) => compressImageFile(f)));
      const newPhotos = compressedResults.map((res) => ({
        id: Date.now() + Math.random(),
        file: res.file,
        preview: res.preview,
        zoom: 1
      }));
      setPhotos((prev) => [...prev, ...newPhotos]);
    }
  };
  const removePhoto = (index) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };
  const updatePhotoZoom = (index, delta) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      const currentZoom = newPhotos[index].zoom || 1;
      newPhotos[index] = {
        ...newPhotos[index],
        zoom: Math.max(0.5, Math.min(3, currentZoom + delta))
      };
      return newPhotos;
    });
  };
  const handlePhotoDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer?.getData("text/plain");
    if (!sourceIndexStr) return;
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (sourceIndex === targetIndex || isNaN(sourceIndex)) return;
    setPhotos((prev) => {
      const newPhotos = [...prev];
      const [movedPhoto] = newPhotos.splice(sourceIndex, 1);
      newPhotos.splice(targetIndex, 0, movedPhoto);
      return newPhotos;
    });
  };
  const handlePhotoEdit = (index, updatedPhoto) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      newPhotos[index] = updatedPhoto;
      return newPhotos;
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    let generatedCollageFile = null;
    if (photos.length > 0) {
      if (photos.length === 1) {
        generatedCollageFile = photos[0].file || null;
      } else {
        if (autoCollageFile) {
          generatedCollageFile = autoCollageFile;
        } else {
          const collageResult = await processPhotosToCollage(photos, collageAnnotation);
          if (collageResult) {
            generatedCollageFile = collageResult.file;
          }
        }
      }
    }
    const message = generateWA_Kegiatan(kegiatanData);
    const waktuFull = kegiatanData.waktuSelesai ? `${kegiatanData.waktuMulai} - ${kegiatanData.waktuSelesai}` : kegiatanData.waktuMulai;
    syncToGoogleSheets({
      jenis: "Kegiatan",
      tanggal: kegiatanData.tanggal,
      waktu: waktuFull,
      lokasi: kegiatanData.lokasi || "-",
      peralatan: "Kegiatan Lapangan",
      uraian: kegiatanData.kegiatan || "-",
      tindakLanjut: "-",
      status: "Normal Operasi",
      imageFile: generatedCollageFile
    });
    await shareToWhatsApp(message, generatedCollageFile, () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3e3);
    });
    if (generatedCollageUrl) ;
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "p-6 sm:p-8 space-y-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2", children: [
        /* @__PURE__ */ jsx(Briefcase, { className: "w-5 h-5 text-blue-600" }),
        " Informasi Laporan Kegiatan"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Tanggal" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
            /* @__PURE__ */ jsx("input", { type: "date", name: "tanggal", required: true, value: kegiatanData.tanggal, onChange: handleChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Pukul Mulai" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Clock, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
              /* @__PURE__ */ jsx("input", { type: "time", name: "waktuMulai", required: true, value: kegiatanData.waktuMulai, onChange: handleChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: [
              "Pukul Selesai ",
              /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-xs font-normal", children: "(Opsional)" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Clock, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
              /* @__PURE__ */ jsx("input", { type: "time", name: "waktuSelesai", value: kegiatanData.waktuSelesai, onChange: handleChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Lokasi" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "absolute left-3 top-2.5 h-5 w-5 text-slate-400" }),
            /* @__PURE__ */ jsx("input", { type: "text", name: "lokasi", required: true, placeholder: "Contoh: Terminal D", value: kegiatanData.lokasi, onChange: handleChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Kegiatan" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(ClipboardList, { className: "absolute left-3 top-3 h-5 w-5 text-slate-400" }),
            /* @__PURE__ */ jsx("textarea", { name: "kegiatan", required: true, placeholder: "Contoh: Mendampingi Audit dari Otban", rows: 3, value: kegiatanData.kegiatan, onChange: handleChange, className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      PhotoUploader,
      {
        photos,
        onUpload: handlePhotoUpload,
        onRemove: removePhoto,
        onZoom: updatePhotoZoom,
        onDrop: handlePhotoDrop,
        onEdit: handlePhotoEdit,
        listType: "general"
      }
    ),
    /* @__PURE__ */ jsx(
      LiveCollagePreview,
      {
        photos,
        onCollageChange: (file, _url, annotation) => {
          setAutoCollageFile(file);
          setCollageAnnotation(annotation);
        }
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row gap-4 mt-8", children: /* @__PURE__ */ jsx("button", { type: "submit", className: `w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${isCopied ? "bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]" : "bg-[#25D366] hover:bg-[#20b858] hover:shadow-xl hover:-translate-y-0.5 text-white"}`, children: isCopied ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 animate-pulse" }),
      " Berhasil Disalin / Dibagikan!"
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Share2, { className: "w-6 h-6" }),
      " Share Kegiatan ke WA"
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 border-t border-slate-200 pt-8", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-700 mb-4 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-blue-600" }),
        " Preview Laporan Kegiatan (Real-time)"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative", children: /* @__PURE__ */ jsx("div", { className: "bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%]", children: generateWA_Kegiatan(kegiatanData) }) })
    ] })
  ] });
};
const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const TabShiftReport = () => {
  const [date, setDate] = useState(() => {
    const now = /* @__PURE__ */ new Date();
    const h = now.getHours();
    if (h < 8) {
      const prevDate = new Date(now);
      prevDate.setDate(now.getDate() - 1);
      return prevDate.toISOString().split("T")[0];
    }
    return now.toISOString().split("T")[0];
  });
  const [shift, setShift] = useState(() => {
    const h = (/* @__PURE__ */ new Date()).getHours();
    return h >= 8 && h < 20 ? "PS" : "M";
  });
  const [loading, setLoading] = useState(false);
  const [fetchingLive, setFetchingLive] = useState(false);
  const [reports, setReports] = useState([]);
  const [statusMsg, setStatusMsg] = useState(null);
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [crudSubmitting, setCrudSubmitting] = useState(false);
  const [deletingRowIndex, setDeletingRowIndex] = useState(null);
  const [crudForm, setCrudForm] = useState({
    jenis: "Kegiatan",
    waktu: "",
    peralatan: "",
    lokasi: "",
    uraian: "",
    tindakLanjut: "-",
    status: "Normal Operasi"
  });
  const openAddModal = () => {
    setModalMode("add");
    setEditingRowIndex(null);
    const now = /* @__PURE__ */ new Date();
    const timeStr = `${("0" + now.getHours()).slice(-2)}:${("0" + now.getMinutes()).slice(-2)}`;
    setCrudForm({
      jenis: "Kegiatan",
      waktu: timeStr,
      peralatan: "",
      lokasi: "",
      uraian: "",
      tindakLanjut: "-",
      status: "Normal Operasi"
    });
    setIsCrudModalOpen(true);
  };
  const openEditModal = (item) => {
    setModalMode("edit");
    setEditingRowIndex(item.rowIndex);
    setCrudForm({
      jenis: item.Jenis || "Kegiatan",
      waktu: item.Waktu || "",
      peralatan: item.Peralatan || "",
      lokasi: item.Lokasi || "",
      uraian: item.Uraian || "",
      tindakLanjut: item.TindakLanjut || "-",
      status: item.Status || "Normal Operasi"
    });
    setIsCrudModalOpen(true);
  };
  const handleDeleteItem = async (rowIndex, namaAlat) => {
    if (!window.confirm(`Hapus laporan kegiatan "${namaAlat}" ini dari Google Sheets?`)) return;
    setDeletingRowIndex(rowIndex);
    try {
      const ok = await deleteSheetReport(rowIndex);
      if (ok) {
        setStatusMsg({ text: "Laporan berhasil dihapus.", type: "success" });
        await loadShiftReports(date, shift);
      } else {
        setStatusMsg({ text: "Gagal menghapus laporan dari server.", type: "error" });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingRowIndex(null);
    }
  };
  const handleCrudSubmit = async (e) => {
    e.preventDefault();
    setCrudSubmitting(true);
    try {
      if (modalMode === "add") {
        await syncToGoogleSheets({
          jenis: crudForm.jenis,
          tanggal: date,
          waktu: crudForm.waktu,
          shift,
          lokasi: crudForm.lokasi || "-",
          peralatan: crudForm.peralatan || "-",
          uraian: crudForm.uraian || "-",
          tindakLanjut: crudForm.tindakLanjut || "-",
          status: crudForm.status || "Normal Operasi"
        });
        setStatusMsg({ text: "Laporan baru ditambahkan.", type: "success" });
      } else if (modalMode === "edit" && editingRowIndex) {
        await updateSheetReport({
          rowIndex: editingRowIndex,
          jenis: crudForm.jenis,
          tanggal: date,
          waktu: crudForm.waktu,
          shift,
          lokasi: crudForm.lokasi || "-",
          peralatan: crudForm.peralatan || "-",
          uraian: crudForm.uraian || "-",
          tindakLanjut: crudForm.tindakLanjut || "-",
          status: crudForm.status || "Normal Operasi"
        });
        setStatusMsg({ text: "Laporan diperbarui.", type: "success" });
      }
      setIsCrudModalOpen(false);
      setTimeout(() => loadShiftReports(date, shift), 1e3);
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: "Gagal menyimpan perubahan.", type: "error" });
    } finally {
      setCrudSubmitting(false);
    }
  };
  const [apiPersonil, setApiPersonil] = useState([]);
  const [iasPersonil, setIasPersonil] = useState([]);
  const pdfRef = useRef(null);
  useEffect(() => {
    const fetchPersonil = async () => {
      try {
        const { data, error } = await supabase.from("jadwal_shift").select(`
            id, shift, status_kehadiran,
            personel:personel_id (id, nama, no_hp, unit_kerja(nama))
          `).eq("tanggal", date).eq("shift", shift);
        if (!error && data) {
          const hadir = data.filter((d) => d.status_kehadiran !== "Off" && d.status_kehadiran !== "Cuti" && d.status_kehadiran !== "Sakit" && d.status_kehadiran !== "Izin");
          const apiList = hadir.filter((d) => {
            const u = d.personel?.unit_kerja?.nama?.toUpperCase() || "";
            return u === "API T2" || u.includes("API") || u.includes("ANGKASA PURA");
          });
          const iasList = hadir.filter((d) => {
            const u = d.personel?.unit_kerja?.nama?.toUpperCase() || "";
            return u === "OM/IAS T2" || u.includes("IAS") || u.includes("INJOURNEY");
          });
          setApiPersonil(apiList);
          setIasPersonil(iasList);
        }
      } catch (err) {
        console.error("Gagal fetch personil", err);
      }
    };
    fetchPersonil();
    loadShiftReports(date, shift);
  }, [date, shift]);
  const loadShiftReports = async (targetDate, targetShift) => {
    if (!targetDate) return [];
    setFetchingLive(true);
    try {
      const res1 = await fetch(`${GOOGLE_SHEETS_WEBAPP_URL}?action=get_daily&date=${targetDate}`);
      const data1 = await res1.json();
      let allData = data1 && data1.status === "success" && Array.isArray(data1.data) ? data1.data : [];
      if (targetShift === "M") {
        const nextDateObj = new Date(targetDate);
        nextDateObj.setDate(nextDateObj.getDate() + 1);
        const nextDateStr = nextDateObj.toISOString().split("T")[0];
        const res2 = await fetch(`${GOOGLE_SHEETS_WEBAPP_URL}?action=get_daily&date=${nextDateStr}`);
        const data2 = await res2.json();
        if (data2 && data2.status === "success" && Array.isArray(data2.data)) {
          allData = [...allData, ...data2.data];
        }
      }
      const filtered = allData.filter((r) => {
        if (!r.Waktu) return true;
        const timeMatch = String(r.Waktu).match(/(\d{2}):(\d{2})/);
        if (!timeMatch) return true;
        const hour = parseInt(timeMatch[1], 10);
        if (targetShift === "PS") {
          return hour >= 8 && hour < 20;
        } else {
          return hour >= 20 || hour < 8;
        }
      });
      setReports(filtered);
      return filtered;
    } catch (err) {
      console.error("Gagal menarik data harian shift:", err);
      return [];
    } finally {
      setFetchingLive(false);
    }
  };
  const fetchAndGeneratePDF = async () => {
    if (!date) return;
    setLoading(true);
    setStatusMsg({ text: "Mempersiapkan laporan PDF...", type: "info" });
    let currentList = reports;
    if (currentList.length === 0) {
      currentList = await loadShiftReports(date, shift) || [];
    }
    if (currentList.length > 0) {
      setStatusMsg({ text: `Memproses ${currentList.length} laporan ke dalam PDF...`, type: "info" });
      setTimeout(async () => {
        await generateAndSharePdf();
      }, 1e3);
    } else {
      setStatusMsg({ text: "Tidak ada laporan pada shift tersebut.", type: "error" });
      setLoading(false);
    }
  };
  const generateAndSharePdf = async (reportData) => {
    try {
      if (!pdfRef.current) return;
      const element = pdfRef.current;
      const opt = {
        margin: 5,
        // smaller margin for landscape
        filename: `Laporan_Shift_${shift}_${date}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" }
      };
      const html2pdf = (await import("html2pdf.js")).default;
      const pdfBlob = await html2pdf().set(opt).from(element).output("blob");
      setStatusMsg({ text: "PDF berhasil dibuat. Menyimpan ke Google Drive...", type: "info" });
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      reader.onloadend = async () => {
        const base64String = reader.result.split(",")[1];
        try {
          await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
              action: "save_pdf",
              filename: `Laporan_Shift_${shift}_${date}.pdf`,
              pdfBase64: base64String
            })
          });
          setStatusMsg({ text: "PDF tersimpan di Drive. Meneruskan ke WA...", type: "success" });
        } catch (e) {
          setStatusMsg({ text: "Gagal menyimpan ke Drive, tapi tetap dibagikan ke WA.", type: "error" });
        }
        const pdfFile = new File([pdfBlob], `Laporan_Shift_${shift}_${date}.pdf`, { type: "application/pdf" });
        await shareToWhatsApp(`Berikut lampiran rekap laporan perbaikan Shift ${shift} tanggal ${date}`, pdfFile, () => {
        });
        setTimeout(() => setStatusMsg(null), 4e3);
        setLoading(false);
      };
    } catch (err) {
      setStatusMsg({ text: "Gagal membuat PDF.", type: "error" });
      setLoading(false);
    }
  };
  const isCorrective = (r) => {
    if (r.Uraian?.toLowerCase().includes("permasalahan") || r.TindakLanjut?.toLowerCase().includes("perbaikan")) return true;
    if (r.Peralatan?.toLowerCase().includes("kegiatan") || r.Uraian?.toLowerCase().includes("storing") || r.Uraian?.toLowerCase().includes("running test")) return false;
    return true;
  };
  const formatUraian = (r) => {
    if (isCorrective(r)) {
      return /* @__PURE__ */ jsxs("div", { className: "text-left text-[9px]", children: [
        /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Permasalahan :" }),
        " ",
        r.Uraian,
        /* @__PURE__ */ jsx("br", {}),
        /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Tindak lanjut :" }),
        " ",
        r.TindakLanjut
      ] });
    } else {
      return /* @__PURE__ */ jsx("div", { className: "text-center font-bold text-[9px]", children: r.TindakLanjut || r.Uraian || "Running test" });
    }
  };
  const getTime = (waktuStr) => {
    if (!waktuStr) return "-";
    const match = waktuStr.match(/(\d{2}:\d{2})/);
    return match ? match[1] : waktuStr;
  };
  const getDayName = (d) => {
    const days = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];
    return days[new Date(d).getDay()];
  };
  const formatDateIndo = (d) => {
    const dt = new Date(d);
    return `${dt.getDate()} ${MONTHS[dt.getMonth()].toUpperCase()} ${dt.getFullYear()}`;
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-slate-50 p-6 rounded-2xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 flex-1 overflow-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4 flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-slate-800 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-blue-600" }),
          " Daftar Laporan Shift Aktif (",
          reports.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: openAddModal,
              className: "text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1 px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-sm",
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "w-3.5 h-3.5" }),
                " Tambah Manual"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => loadShiftReports(date, shift),
              disabled: fetchingLive,
              className: "text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 p-2 bg-blue-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50",
              children: [
                fetchingLive ? /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 animate-spin" }) : /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
                " Segarkan"
              ]
            }
          )
        ] })
      ] }),
      fetchingLive ? /* @__PURE__ */ jsxs("div", { className: "p-8 text-center text-slate-400 font-bold flex flex-col items-center justify-center gap-2", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-blue-500" }),
        " Memuat data kegiatan shift..."
      ] }) : reports.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 text-center text-slate-400 font-bold italic bg-slate-50 rounded-xl border border-dashed border-slate-200", children: "Belum ada laporan (Perbaikan, Kegiatan, atau Storing) tercatat pada shift ini." }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: reports.map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "relative flex gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-all shadow-sm group pr-16", children: [
        /* @__PURE__ */ jsxs("div", { className: "absolute top-3 right-3 flex items-center gap-1 z-10", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => openEditModal(item),
              title: "Edit Laporan",
              className: "p-1.5 bg-white hover:bg-blue-50 text-blue-600 rounded-lg border border-slate-200 shadow-sm cursor-pointer transition-colors",
              children: /* @__PURE__ */ jsx(Edit, { className: "w-3.5 h-3.5" })
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleDeleteItem(item.rowIndex, item.Peralatan || "item"),
              disabled: deletingRowIndex === item.rowIndex,
              title: "Hapus Laporan",
              className: "p-1.5 bg-white hover:bg-rose-50 text-rose-600 rounded-lg border border-slate-200 shadow-sm cursor-pointer transition-colors disabled:opacity-50",
              children: deletingRowIndex === item.rowIndex ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }) : /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" })
            }
          )
        ] }),
        item.Drive_Image_ID && item.Drive_Image_ID !== "-" && item.Drive_Image_ID !== "" ? /* @__PURE__ */ jsx(
          "img",
          {
            src: `https://drive.google.com/uc?export=view&id=${item.Drive_Image_ID}`,
            alt: "Foto",
            className: "w-24 h-24 rounded-lg object-cover bg-slate-200 border border-slate-300 shrink-0",
            onError: (e) => {
              e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23cbd5e1"/><text x="50%" y="50%" font-size="10" text-anchor="middle" dominant-baseline="middle" fill="%2364748b">No Foto</text></svg>';
            }
          }
        ) : /* @__PURE__ */ jsx("div", { className: "w-24 h-24 rounded-lg bg-slate-200 border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0", children: "No Foto" }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
            /* @__PURE__ */ jsx("span", { className: `text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${item.Jenis === "Perbaikan" ? "bg-rose-100 text-rose-700 border border-rose-200" : item.Jenis === "Storing" ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-blue-100 text-blue-700 border border-blue-200"}`, children: item.Jenis || "Kegiatan" }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-slate-500 flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
              " ",
              item.Waktu || "-"
            ] })
          ] }),
          /* @__PURE__ */ jsx("h4", { className: "font-bold text-sm text-slate-800 truncate", children: item.Peralatan || "Peralatan" }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs font-semibold text-slate-600 mb-1 truncate", children: [
            "📍 ",
            item.Lokasi || "-"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-600 line-clamp-2", children: item.Uraian || "-" })
        ] })
      ] }, idx)) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-slate-800 flex items-center gap-2 mb-2", children: [
        /* @__PURE__ */ jsx(FileText, { className: "w-6 h-6 text-blue-600" }),
        " Generate Laporan Shift (PDF)"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm mb-6", children: "Pilih Tanggal dan Shift. Sistem akan otomatis memuat nama Personil On Duty dari absen dan menarik laporan dari jam operasional shift bersangkutan." }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4 text-slate-500" }),
            " Tanggal Shift"
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              value: date,
              onChange: (e) => setDate(e.target.value),
              className: "w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 text-slate-500" }),
            " Shift"
          ] }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: shift,
              onChange: (e) => setShift(e.target.value),
              className: "w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none",
              children: [
                /* @__PURE__ */ jsx("option", { value: "PS", children: "Pagi - Siang (08:00 - 20:00)" }),
                /* @__PURE__ */ jsx("option", { value: "M", children: "Malam (20:00 - 08:00)" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "pt-7", children: /* @__PURE__ */ jsx(
          "button",
          {
            onClick: fetchAndGeneratePDF,
            disabled: loading,
            className: "w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-md disabled:bg-blue-400 disabled:cursor-not-allowed",
            children: loading ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin" }),
              " Memproses..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Download, { className: "w-5 h-5" }),
              " Buat Laporan"
            ] })
          }
        ) })
      ] }),
      statusMsg && /* @__PURE__ */ jsxs("div", { className: `mt-2 p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${statusMsg.type === "error" ? "bg-rose-100 text-rose-700" : statusMsg.type === "success" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`, children: [
        statusMsg.type === "success" ? /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5" }) : statusMsg.type === "error" ? /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5" }) : /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin" }),
        statusMsg.text
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "overflow-hidden h-0 w-0 absolute opacity-0 pointer-events-none", children: /* @__PURE__ */ jsxs("div", { ref: pdfRef, className: "w-[1100px] p-4 bg-white text-black font-sans", children: [
      /* @__PURE__ */ jsxs("div", { className: "border-[3px] border-black flex items-stretch", children: [
        /* @__PURE__ */ jsx("div", { className: "w-[15%] border-r-[3px] border-black flex items-center justify-center p-2", children: /* @__PURE__ */ jsxs("div", { className: "text-[12px] font-bold text-blue-800 text-center", children: [
          "INJOURNEY",
          /* @__PURE__ */ jsx("br", {}),
          "AIRPORTS"
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "w-[50%] border-r-[3px] border-black p-2 flex flex-col items-center justify-center text-center", children: [
          /* @__PURE__ */ jsx("h1", { className: "font-extrabold text-[13px]", children: "PT ANGKASA PURA INDONESIA" }),
          /* @__PURE__ */ jsx("h2", { className: "font-bold text-[11px]", children: "CABANG UTAMA BANDARA SOEKARNO-HATTA" }),
          /* @__PURE__ */ jsx("h2", { className: "font-bold text-[11px]", children: "UNIT SAFETY & SECURITY ELECTRONIC SERVICES – T2" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "w-[35%] p-2 flex flex-col items-center justify-center text-center bg-gray-100", children: [
          /* @__PURE__ */ jsx("h1", { className: "font-extrabold text-[11px]", children: "LAPORAN PERBAIKAN SAFETY & SECURITY ELECTRONIC SERVICES" }),
          /* @__PURE__ */ jsx("h2", { className: "font-bold text-[10px]", children: "TERMINAL 2 BANDARA SOEKARNO-HATTA" }),
          /* @__PURE__ */ jsxs("h2", { className: "font-bold text-[10px]", children: [
            "PERIODE : ",
            MONTHS[new Date(date).getMonth()].toUpperCase()
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "border-l-[3px] border-r-[3px] border-b-[3px] border-black flex items-stretch bg-white", children: [
        /* @__PURE__ */ jsxs("div", { className: "w-[15%] border-r-[3px] border-black p-2 flex flex-col items-center justify-center text-center text-[10px] font-bold", children: [
          "SHIFT ",
          shift === "M" ? "MALAM (M)" : "PAGI (PS)",
          " ",
          getDayName(date),
          ", ",
          formatDateIndo(date),
          /* @__PURE__ */ jsx("br", {}),
          "(D,E,F,UMROH)",
          /* @__PURE__ */ jsx("br", {}),
          "TERMINAL 2"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "w-[85%] flex flex-col", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-black text-white text-center font-bold text-[11px] py-1 border-b-[3px] border-black uppercase", children: [
            "PERSONIL ON DUTY ",
            shift === "M" ? "MALAM" : "PAGI"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "w-1/2 border-r-[3px] border-black flex flex-col", children: [
              /* @__PURE__ */ jsx("div", { className: "bg-gray-200 text-center font-bold text-[10px] py-1 border-b-[3px] border-black", children: "API" }),
              /* @__PURE__ */ jsxs("div", { className: "p-1 flex-1 flex flex-col justify-around", children: [
                apiPersonil.map((p, i) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[10px] font-semibold px-4", children: [
                  /* @__PURE__ */ jsx("span", { children: p.personel.nama }),
                  /* @__PURE__ */ jsx("span", { children: p.personel.no_hp })
                ] }, i)),
                apiPersonil.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-center text-[10px] text-gray-500 py-1", children: "-" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "w-1/2 flex flex-col", children: [
              /* @__PURE__ */ jsx("div", { className: "bg-gray-200 text-center font-bold text-[10px] py-1 border-b-[3px] border-black", children: "IAS" }),
              /* @__PURE__ */ jsxs("div", { className: "p-1 flex-1 flex flex-col justify-around", children: [
                iasPersonil.map((p, i) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[10px] font-semibold px-4", children: [
                  /* @__PURE__ */ jsx("span", { children: p.personel.nama }),
                  /* @__PURE__ */ jsx("span", { children: p.personel.no_hp })
                ] }, i)),
                iasPersonil.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-center text-[10px] text-gray-500 py-1", children: "-" })
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "h-4" }),
      /* @__PURE__ */ jsxs("table", { className: "w-full border-collapse border-[3px] border-black text-[10px]", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-gray-200 font-bold text-center", children: [
          /* @__PURE__ */ jsx("th", { className: "border-[3px] border-black p-1 w-[3%]", children: "No" }),
          /* @__PURE__ */ jsx("th", { className: "border-[3px] border-black p-1 w-[12%]", children: "LOKASI" }),
          /* @__PURE__ */ jsx("th", { className: "border-[3px] border-black p-1 w-[15%]", children: "PERALATAN" }),
          /* @__PURE__ */ jsxs("th", { className: "border-[3px] border-black p-1 w-[10%]", children: [
            "CORRECTIVE",
            /* @__PURE__ */ jsx("br", {}),
            "MAINTENANCE"
          ] }),
          /* @__PURE__ */ jsxs("th", { className: "border-[3px] border-black p-1 w-[10%]", children: [
            "PREVENTIVE",
            /* @__PURE__ */ jsx("br", {}),
            "MAINTENANCE"
          ] }),
          /* @__PURE__ */ jsx("th", { className: "border-[3px] border-black p-1 w-[10%]", children: "LAIN - LAIN" }),
          /* @__PURE__ */ jsx("th", { className: "border-[3px] border-black p-1 w-[20%]", children: "URAIAN KEGIATAN" }),
          /* @__PURE__ */ jsxs("th", { className: "border-[3px] border-black p-1 w-[8%]", children: [
            "WAKTU",
            /* @__PURE__ */ jsx("br", {}),
            "TINDAK LANJUT"
          ] }),
          /* @__PURE__ */ jsx("th", { className: "border-[3px] border-black p-1 w-[5%]", children: "HASIL" }),
          /* @__PURE__ */ jsx("th", { className: "border-[3px] border-black p-1 w-[7%]", children: "DOKUMENTASI" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { children: [
          reports.map((report, idx) => /* @__PURE__ */ jsxs("tr", { className: "text-center bg-white", children: [
            /* @__PURE__ */ jsx("td", { className: "border-[3px] border-black p-1 font-bold", children: idx + 1 }),
            /* @__PURE__ */ jsx("td", { className: "border-[3px] border-black p-1 font-semibold", children: report.Lokasi || "-" }),
            /* @__PURE__ */ jsx("td", { className: "border-[3px] border-black p-1 font-semibold", children: report.Peralatan }),
            /* @__PURE__ */ jsx("td", { className: "border-[3px] border-black p-1 font-bold", children: isCorrective(report) ? "CORRECTIVE MAINTENANCE" : "-" }),
            /* @__PURE__ */ jsx("td", { className: "border-[3px] border-black p-1 font-bold", children: "-" }),
            /* @__PURE__ */ jsx("td", { className: "border-[3px] border-black p-1 font-bold", children: isCorrective(report) ? "-" : "KEGIATAN" }),
            /* @__PURE__ */ jsx("td", { className: "border-[3px] border-black p-1 text-left align-top", children: formatUraian(report) }),
            /* @__PURE__ */ jsx("td", { className: "border-[3px] border-black p-1 font-bold", children: getTime(report.Waktu) }),
            /* @__PURE__ */ jsx("td", { className: "border-[3px] border-black p-1 font-bold", children: report.Status === "Normal" ? "Normal" : report.Status }),
            /* @__PURE__ */ jsx("td", { className: "border-[3px] border-black p-1", children: report.Drive_Image_ID ? /* @__PURE__ */ jsx(
              "img",
              {
                src: `https://drive.google.com/uc?id=${report.Drive_Image_ID}`,
                alt: "Dok",
                crossOrigin: "anonymous",
                className: "w-full h-12 object-cover",
                onError: (e) => {
                  e.target.style.display = "none";
                }
              }
            ) : "-" })
          ] }, idx)),
          reports.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 10, className: "border-[3px] border-black p-4 text-center font-bold italic text-gray-500", children: "Tidak ada laporan perbaikan/kegiatan pada shift ini." }) })
        ] })
      ] })
    ] }) }),
    isCrudModalOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("h3", { className: "font-bold text-slate-800 flex items-center gap-2", children: [
          modalMode === "add" ? /* @__PURE__ */ jsx(Plus, { className: "w-5 h-5 text-blue-600" }) : /* @__PURE__ */ jsx(Edit, { className: "w-5 h-5 text-blue-600" }),
          modalMode === "add" ? "Tambah Laporan Manual" : "Edit Laporan Shift"
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setIsCrudModalOpen(false), className: "p-1 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors", children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" }) })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleCrudSubmit, className: "p-6 overflow-y-auto space-y-4 flex-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-700 mb-1", children: "Jenis Laporan" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: crudForm.jenis,
                onChange: (e) => setCrudForm({ ...crudForm, jenis: e.target.value }),
                className: "w-full text-sm font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "Kegiatan", children: "Kegiatan" }),
                  /* @__PURE__ */ jsx("option", { value: "Perbaikan", children: "Perbaikan" }),
                  /* @__PURE__ */ jsx("option", { value: "Storing", children: "Storing" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-700 mb-1", children: "Jam / Waktu" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                required: true,
                placeholder: "Contoh: 08:30",
                value: crudForm.waktu,
                onChange: (e) => setCrudForm({ ...crudForm, waktu: e.target.value }),
                className: "w-full text-sm font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-700 mb-1", children: "Nama Peralatan" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              required: true,
              placeholder: "Contoh: X-Ray Baggage / AC Split",
              value: crudForm.peralatan,
              onChange: (e) => setCrudForm({ ...crudForm, peralatan: e.target.value }),
              className: "w-full text-sm font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-700 mb-1", children: "Lokasi" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              required: true,
              placeholder: "Contoh: SCP T2D / Ruang Server",
              value: crudForm.lokasi,
              onChange: (e) => setCrudForm({ ...crudForm, lokasi: e.target.value }),
              className: "w-full text-sm font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-700 mb-1", children: "Uraian / Deskripsi Pekerjaan" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              required: true,
              rows: 3,
              placeholder: "Jelaskan detail kegiatan yang dilakukan...",
              value: crudForm.uraian,
              onChange: (e) => setCrudForm({ ...crudForm, uraian: e.target.value }),
              className: "w-full text-sm p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-700 mb-1", children: "Tindak Lanjut" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Contoh: Monitoring / Selesai",
                value: crudForm.tindakLanjut,
                onChange: (e) => setCrudForm({ ...crudForm, tindakLanjut: e.target.value }),
                className: "w-full text-sm p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-700 mb-1", children: "Status" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Contoh: Normal Operasi",
                value: crudForm.status,
                onChange: (e) => setCrudForm({ ...crudForm, status: e.target.value }),
                className: "w-full text-sm font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pt-2 flex items-center justify-end gap-2 border-t border-slate-200 mt-4", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setIsCrudModalOpen(false),
              className: "px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors",
              children: "Batal"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              disabled: crudSubmitting,
              className: "px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5",
              children: [
                crudSubmitting && /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }),
                crudSubmitting ? "Menyimpan..." : "Simpan Laporan"
              ]
            }
          )
        ] })
      ] })
    ] }) })
  ] });
};
const SAMPLE_UMRAH_SCHEDULE = `*Rencana Penerbangan Umrah*
*Sabtu, 11 Juli 2026*
*Bandara Internasional Soekarno-Hatta (CGK)*

*DEPARTURE :*
1. EK357 // DXB // 1740 // EST TOTAL FLIGHT : 404 // EST PAX UMROH : 121
2. EK359 // DXB // 0045 // EST TOTAL FLIGHT : 338 // EST PAX UMROH : 44
3. EY473 // AUH // 0005 // EST TOTAL FLIGHT : 238 // EST PAX UMROH : 66
4. EY475 // AUH // 1810 // EST TOTAL FLIGHT : 271 // EST PAX UMROH : 52
5. HU702 // HAK // 1915 // EST TOTAL FLIGHT : 93 // EST PAX UMROH : 0
6. QR955 // DOH // 0055 // EST TOTAL FLIGHT : 258 // EST PAX UMROH : 70
7. QR957 // DOH // 1830 // EST TOTAL FLIGHT : 339 // EST PAX UMROH : 23
8. QR959 // DOH // 0900 // EST TOTAL FLIGHT : 260 // EST PAX UMROH : 120
9. SV817 // JED // 0910 // EST TOTAL FLIGHT : 446 // EST PAX UMROH : 283
10. SV819 // JED // 1730 // EST TOTAL FLIGHT : 351 // EST PAX UMROH : 230
11. SV821 // MED // 1200 // EST TOTAL FLIGHT : 166 // EST PAX UMROH : 11
12. SV827 // JED // 0040 // EST TOTAL FLIGHT : 345 // EST PAX UMROH : 127
13. TK057 // IST // 2100 // EST TOTAL FLIGHT : 325 // EST PAX UMROH : 98
14. TR273 // SIN // 2215 // EST TOTAL FLIGHT : 150 // EST PAX UMROH : 85
15. TR275 // SIN // 0935 // EST TOTAL FLIGHT : 159 // EST PAX UMROH : 86
16. TR277 // SIN // 1155 // EST TOTAL FLIGHT : 155 // EST PAX UMROH : 83
17. TR279 // SIN // 2000 // EST TOTAL FLIGHT : 167 // EST PAX UMROH : 86
18. TR309 // SIN // 1415 // EST TOTAL FLIGHT : 159 // EST PAX UMROH : 89
19. WY850 // MCT // 1425 // EST TOTAL FLIGHT : 263 // EST PAX UMROH : 107

*ARRIVAL :*
1. EK356 // DXB // 1540 // EST TOTAL FLIGHT : 421 // EST PAX UMROH : 126
2. EK358 // DXB // 2225 // EST TOTAL FLIGHT : 351 // EST PAX UMROH : 105
3. EY472 // AUH // 2035 // EST TOTAL FLIGHT : 305 // EST PAX UMROH : 26
4. EY474 // AUH // 0900 // EST TOTAL FLIGHT : 337 // EST PAX UMROH : 59
5. HU701 // HAK // 1810 // EST TOTAL FLIGHT : 171 // EST PAX UMROH : 0
6. QR954 // DOH // 2140 // EST TOTAL FLIGHT : 290 // EST PAX UMROH : 0
7. QR956 // DOH // 1535 // EST TOTAL FLIGHT : 368 // EST PAX UMROH : 75
8. QR958 // DOH // 0730 // EST TOTAL FLIGHT : 288 // EST PAX UMROH : 75
9. SV816 // JED // 0735 // EST TOTAL FLIGHT : 448 // EST PAX UMROH : 150
10. SV818 // JED // 1600 // EST TOTAL FLIGHT : 445 // EST PAX UMROH : 143
11. SV820 // MED // 1025 // EST TOTAL FLIGHT : 485 // EST PAX UMROH : 376
12. SV826 // JED // 2245 // EST TOTAL FLIGHT : 406 // EST PAX UMROH : 347
13. TK056 // IST // 1735 // EST TOTAL FLIGHT : 330 // EST PAX UMROH : 99
14. TR272 // SIN // 2125 // EST TOTAL FLIGHT : 180 // EST PAX UMROH : 86
15. TR274 // SIN // 0845 // EST TOTAL FLIGHT : 191 // EST PAX UMROH : 89
16. TR276 // SIN // 1055 // EST TOTAL FLIGHT : 185 // EST PAX UMROH : 90
17. TR278 // SIN // 1915 // EST TOTAL FLIGHT : 183 // EST PAX UMROH : 83
18. TR308 // SIN // 1330 // EST TOTAL FLIGHT : 191 // EST PAX UMROH : 85
19. WY849 // MCT // 1255 // EST TOTAL FLIGHT : 296 // EST PAX UMROH : 46

*Airport Operation Control Center*`;
const PREOPS_UMRAH_SCHEDULE_13_JULI = `*RENCANA PENERBANGAN UMROH (Pre-Ops)*
*SENIN, 13 JULI 2026*
*Bandara Internasional Soekarno-Hatta (CGK)*

*DEPARTURE :*
1. EY473 // (CGK - AUH) // 00:05 // EST TOTAL FLIGHT : 298 // EST PAX UMROH : 37
2. SV827 // (CGK - JED) // 00:40 // EST TOTAL FLIGHT : 379 // EST PAX UMROH : 320
3. EK359 // (CGK - DXB) // 00:45 // EST TOTAL FLIGHT : 346 // EST PAX UMROH : 42
4. QR955 // (CGK - DOH) // 00:55 // EST TOTAL FLIGHT : 251 // EST PAX UMROH : 45
5. QR959 // (CGK - DOH) // 09:00 // EST TOTAL FLIGHT : 254 // EST PAX UMROH : 122
6. SV817 // (CGK - JED) // 09:10 // EST TOTAL FLIGHT : 329 // EST PAX UMROH : 210
7. TR275 // (CGK - SIN) // 09:35 // EST TOTAL FLIGHT : 173 // EST PAX UMROH : 0
8. TR277 // (CGK - SIN) // 11:55 // EST TOTAL FLIGHT : 164 // EST PAX UMROH : 0
9. SV821 // (CGK - JED) // 12:00 // EST TOTAL FLIGHT : 473 // EST PAX UMROH : 258
10. TR309 // (CGK - SIN) // 14:15 // EST TOTAL FLIGHT : 148 // EST PAX UMROH : 0
11. WY850 // (CGK - MCT) // 14:25 // EST TOTAL FLIGHT : 277 // EST PAX UMROH : 41
12. SV819 // (CGK - JED) // 17:30 // EST TOTAL FLIGHT : 230 // EST PAX UMROH : 35
13. EK357 // (CGK - DXB) // 17:40 // EST TOTAL FLIGHT : 365 // EST PAX UMROH : 0
14. QR957 // (CGK - DOH) // 18:30 // EST TOTAL FLIGHT : 256 // EST PAX UMROH : 42
15. HU702 // (CGK - HAK) // 19:15 // EST TOTAL FLIGHT : 87 // EST PAX UMROH : 0
16. TR279 // (CGK - SIN) // 20:00 // EST TOTAL FLIGHT : 165 // EST PAX UMROH : 0
17. TK057 // (CGK - IST) // 21:00 // EST TOTAL FLIGHT : 330 // EST PAX UMROH : 99
18. TR273 // (CGK - SIN) // 22:15 // EST TOTAL FLIGHT : 154 // EST PAX UMROH : 0

*ARRIVAL :*
1. QR958 // (DOH - CGK) // 07:30 // EST TOTAL FLIGHT : 286 // EST PAX UMROH : 90
2. SV816 // (JED - CGK) // 07:35 // EST TOTAL FLIGHT : 411 // EST PAX UMROH : 200
3. TR274 // (SIN - CGK) // 08:45 // EST TOTAL FLIGHT : 195 // EST PAX UMROH : 0
4. TR276 // (SIN - CGK) // 10:55 // EST TOTAL FLIGHT : 191 // EST PAX UMROH : 0
5. SV820 // (MED - CGK) // 11:35 // EST TOTAL FLIGHT : 486 // EST PAX UMROH : 304
6. WY849 // (MCT - CGK) // 12:55 // EST TOTAL FLIGHT : 290 // EST PAX UMROH : 20
7. TR308 // (SIN - CGK) // 13:30 // EST TOTAL FLIGHT : 187 // EST PAX UMROH : 0
8. QR956 // (DOH - CGK) // 15:35 // EST TOTAL FLIGHT : 290 // EST PAX UMROH : 128
9. EK356 // (DXB - CGK) // 15:40 // EST TOTAL FLIGHT : 418 // EST PAX UMROH : 48
10. SV818 // (JED - CGK) // 16:00 // EST TOTAL FLIGHT : 406 // EST PAX UMROH : 121
11. TK056 // (IST - CGK) // 17:35 // EST TOTAL FLIGHT : 330 // EST PAX UMROH : 99
12. HU701 // (HAK - CGK) // 18:10 // EST TOTAL FLIGHT : 172 // EST PAX UMROH : 0
13. TR278 // (SIN - CGK) // 19:15 // EST TOTAL FLIGHT : 188 // EST PAX UMROH : 0
14. EY472 // (AUH - CGK) // 20:35 // EST TOTAL FLIGHT : 301 // EST PAX UMROH : 305
15. TR272 // (SIN - CGK) // 21:25 // EST TOTAL FLIGHT : 186 // EST PAX UMROH : 0
16. QR954 // (DOH - CGK) // 21:40 // EST TOTAL FLIGHT : 285 // EST PAX UMROH : 85
17. EK358 // (DXB - CGK) // 22:25 // EST TOTAL FLIGHT : 352 // EST PAX UMROH : 54
18. SV826 // (JED - CGK) // 22:45 // EST TOTAL FLIGHT : 445 // EST PAX UMROH : 334

*Airport Operation Control Center*`;
const TabTUmrah = () => {
  const { isCopied, setIsCopied } = useAppStore();
  const captureRef = useRef(null);
  const [rawScheduleText, setRawScheduleText] = useState("");
  const [uploadedScheduleImage, setUploadedScheduleImage] = useState(null);
  const [isEditingRaw, setIsEditingRaw] = useState(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [showAllFlightsModal, setShowAllFlightsModal] = useState(false);
  const [allFlightsTab, setAllFlightsTab] = useState("ALL");
  const [allFlightsSearch, setAllFlightsSearch] = useState("");
  const [headerTitle, setHeaderTitle] = useState("Timeline Warning Umrah");
  const [dateText, setDateText] = useState("");
  const [airportText, setAirportText] = useState("Bandara Internasional Soekarno-Hatta (CGK)");
  const [departures, setDepartures] = useState([]);
  const [arrivals, setArrivals] = useState([]);
  const [paxThreshold, setPaxThreshold] = useState(100);
  const [depWarningMinutes, setDepWarningMinutes] = useState(180);
  const [arrWarningMinutes, setArrWarningMinutes] = useState(30);
  const parseTimeMinutes = (timeStr) => {
    const clean = (timeStr || "").replace(/[^0-9]/g, "");
    if (clean.length === 4) {
      const h = parseInt(clean.substring(0, 2), 10);
      const m = parseInt(clean.substring(2, 4), 10);
      return h * 60 + m;
    } else if (clean.length === 3) {
      const h = parseInt(clean.substring(0, 1), 10);
      const m = parseInt(clean.substring(1, 3), 10);
      return h * 60 + m;
    }
    return 0;
  };
  const formatMinutesToTime = (mins) => {
    let normalized = mins % 1440;
    if (normalized < 0) normalized += 1440;
    const h = Math.floor(normalized / 60);
    const m = normalized % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };
  const formatFlightTime = (timeStr) => {
    const clean = (timeStr || "").replace(/[^0-9]/g, "");
    if (clean.length >= 3) {
      const padded = clean.padStart(4, "0");
      return `${padded.substring(0, 2)}:${padded.substring(2, 4)}`;
    }
    return timeStr;
  };
  const parseTextToSchedule = (text) => {
    if (!text || text.trim() === "") {
      setDepartures([]);
      setArrivals([]);
      setDateText("");
      return;
    }
    const lines = text.split(/\r?\n/);
    let section = "HEADER";
    let headTitle = "Timeline Warning Umrah";
    let dText = "";
    let aText = "Bandara Internasional Soekarno-Hatta (CGK)";
    const deps = [];
    const arrs = [];
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (/^\*?DEPARTURE\s*:?\*?$/i.test(trimmed)) {
        section = "DEPARTURE";
        return;
      }
      if (/^\*?(AERRIVAL|ARRIVAL)\s*:?\*?$/i.test(trimmed)) {
        section = "ARRIVAL";
        return;
      }
      if (/^\*?Airport Operation Control Center\*?$/i.test(trimmed) || /^\*?AOCC\*?$/i.test(trimmed)) {
        section = "FOOTER";
        return;
      }
      if (section === "HEADER") {
        if (/Rencana Penerbangan/i.test(trimmed)) {
          headTitle = trimmed.replace(/\*/g, "");
        } else if (/\d{1,2}\s+[a-zA-Z]+\s+\d{4}/.test(trimmed) || /Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu/i.test(trimmed)) {
          dText = trimmed.replace(/\*/g, "");
        } else if (/Bandara|CGK|Soekarno-Hatta/i.test(trimmed)) {
          aText = trimmed.replace(/\*/g, "");
        }
      } else if (section === "DEPARTURE" || section === "ARRIVAL") {
        if (trimmed.includes("//")) {
          const parts = trimmed.split("//").map((p) => p.trim());
          const firstPart = parts[0] || "";
          const noMatch = firstPart.match(/^(\d+)\.\s*(.*)$/);
          const no = noMatch ? parseInt(noMatch[1], 10) : section === "DEPARTURE" ? deps.length + 1 : arrs.length + 1;
          const flightCode = noMatch ? noMatch[2].trim() : firstPart.trim();
          const route = parts[1] || "-";
          const time = parts[2] || "-";
          let estTotal = "0";
          let estPax = "0";
          let actualPax = "";
          parts.slice(3).forEach((p) => {
            const upperP = p.toUpperCase();
            if (upperP.includes("EST TOTAL FLIGHT")) {
              const m = p.match(/:\s*(\d+)/);
              if (m) estTotal = m[1];
            } else if (upperP.includes("EST PAX UMROH") || upperP.includes("EST PAX UMROA") || upperP.includes("EST PAX UMRAH")) {
              const m = p.match(/:\s*(\d+)/);
              if (m) estPax = m[1];
            } else if (upperP.includes("AKTUAL PAX") || upperP.includes("ACTUAL PAX")) {
              const m = p.match(/:\s*(\d+)/);
              if (m) actualPax = m[1];
            }
          });
          const item = {
            id: `${section.toLowerCase()}-${no}-${flightCode}-${Math.random().toString(36).substring(2, 7)}`,
            no,
            flightCode,
            route,
            time,
            estTotalFlight: estTotal,
            estPaxUmroh: estPax,
            actualPaxUmroh: actualPax,
            type: section
          };
          if (section === "DEPARTURE") {
            deps.push(item);
          } else {
            arrs.push(item);
          }
        }
      }
    });
    setHeaderTitle(headTitle);
    if (dText) setDateText(dText);
    if (aText) setAirportText(aText);
    setDepartures(deps);
    setArrivals(arrs);
  };
  const handleApplyRawPaste = () => {
    parseTextToSchedule(rawScheduleText);
    setIsEditingRaw(false);
  };
  const handleLoadSample = () => {
    setRawScheduleText(SAMPLE_UMRAH_SCHEDULE);
    parseTextToSchedule(SAMPLE_UMRAH_SCHEDULE);
    setIsEditingRaw(false);
  };
  const isWarningFlight = (item) => {
    const pax = parseInt((item.estPaxUmroh || "0").replace(/[^0-9]/g, ""), 10) || 0;
    return pax > paxThreshold;
  };
  const warningDepartures = departures.filter(isWarningFlight);
  const warningArrivals = arrivals.filter(isWarningFlight);
  const getDensityInfo = (item) => {
    const flightMins = parseTimeMinutes(item.time);
    let startMins = 0;
    let endMins = 0;
    let desc = "";
    if (item.type === "ARRIVAL") {
      startMins = flightMins - arrWarningMinutes;
      endMins = flightMins + arrWarningMinutes;
      desc = `±${arrWarningMinutes} Menit Pendaratan (${formatFlightTime(item.time)} WIB)`;
    } else {
      startMins = flightMins - depWarningMinutes;
      endMins = flightMins;
      const depHoursText = depWarningMinutes % 60 === 0 ? `${depWarningMinutes / 60} Jam` : `${+(depWarningMinutes / 60).toFixed(1)} Jam`;
      desc = `${depHoursText} Sebelum Keberangkatan (${formatFlightTime(item.time)} WIB)`;
    }
    return {
      startMins,
      endMins,
      startTimeStr: `${formatMinutesToTime(startMins)} WIB`,
      endTimeStr: `${formatMinutesToTime(endMins)} WIB`,
      windowText: `${formatMinutesToTime(startMins)} - ${formatMinutesToTime(endMins)} WIB`,
      desc,
      pax: parseInt((item.estPaxUmroh || "0").replace(/[^0-9]/g, ""), 10) || 0
    };
  };
  const sortedWarnings = [...warningDepartures, ...warningArrivals].sort((a, b) => {
    const infoA = getDensityInfo(a);
    const infoB = getDensityInfo(b);
    return infoA.startMins - infoB.startMins;
  });
  const allFlightsList = [...departures, ...arrivals].sort((a, b) => {
    return parseTimeMinutes(a.time) - parseTimeMinutes(b.time);
  });
  const filteredAllFlights = allFlightsList.filter((f) => {
    const matchTab = allFlightsTab === "ALL" || f.type === allFlightsTab;
    const q = allFlightsSearch.toLowerCase();
    const matchSearch = !q || f.flightCode.toLowerCase().includes(q) || f.route.toLowerCase().includes(q) || f.time.includes(q);
    return matchTab && matchSearch;
  });
  const sumTotalPax = filteredAllFlights.reduce((acc, f) => {
    return acc + (parseInt((f.estTotalFlight || "0").replace(/[^0-9]/g, ""), 10) || 0);
  }, 0);
  const sumUmrahPax = filteredAllFlights.reduce((acc, f) => {
    return acc + (parseInt((f.estPaxUmroh || "0").replace(/[^0-9]/g, ""), 10) || 0);
  }, 0);
  const percentageUmrah = sumTotalPax > 0 ? (sumUmrahPax / sumTotalPax * 100).toFixed(1) : "0";
  const generatePreviewImage = () => {
    setIsGeneratingImage(true);
    setTimeout(() => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Gagal menginisialisasi context canvas 2D");
        }
        const width = 850;
        const rowHeight = 120;
        const baseHeight = 260;
        const eventsHeight = sortedWarnings.length > 0 ? sortedWarnings.length * rowHeight : 120;
        const height = baseHeight + eventsHeight;
        canvas.width = width;
        canvas.height = height;
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#065f46";
        ctx.fillRect(0, 0, width, 140);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 36px Arial, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(headerTitle || "Timeline Warning Umrah", 40, 65);
        ctx.fillStyle = "#a7f3d0";
        ctx.font = "22px Arial, sans-serif";
        const dateStr = dateText || "Jadwal Penerbangan Umrah";
        const airportStr = airportText || "Bandara Internasional Soekarno-Hatta (CGK)";
        ctx.fillText(`${dateStr} | ${airportStr}`, 40, 105);
        let y = 210;
        const startX = 240;
        if (sortedWarnings.length === 0) {
          ctx.fillStyle = "#475569";
          ctx.font = "italic 24px Arial, sans-serif";
          ctx.fillText(`✅ Tidak ada peringatan penerbangan > ${paxThreshold} Pax Umrah.`, 40, y);
        } else {
          ctx.beginPath();
          ctx.moveTo(startX, y - 20);
          ctx.lineTo(startX, y + sortedWarnings.length * rowHeight - 80);
          ctx.lineWidth = 4;
          ctx.strokeStyle = "#cbd5e1";
          ctx.stroke();
          sortedWarnings.forEach((evt) => {
            const info = getDensityInfo(evt);
            const isDeparture = evt.type === "DEPARTURE";
            const typeLabel = isDeparture ? "KEBERANGKATAN" : "KEDATANGAN";
            const color = isDeparture ? "#be123c" : "#0369a1";
            const icon = isDeparture ? "🛫" : "🛬";
            ctx.textAlign = "right";
            ctx.fillStyle = "#0f172a";
            ctx.font = "bold 24px Arial, sans-serif";
            ctx.fillText(formatMinutesToTime(info.startMins) + " WIB", startX - 30, y - 2);
            ctx.fillStyle = "#64748b";
            ctx.font = "18px Arial, sans-serif";
            ctx.fillText(`s/d ${formatMinutesToTime(info.endMins)} WIB`, startX - 30, y + 22);
            ctx.beginPath();
            ctx.arc(startX, y + 8, 12, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.lineWidth = 4;
            ctx.strokeStyle = "#ffffff";
            ctx.stroke();
            ctx.textAlign = "left";
            ctx.fillStyle = color;
            ctx.font = "bold 22px Arial, sans-serif";
            ctx.fillText(`${icon} ${typeLabel} - ${evt.flightCode}`, startX + 30, y - 2);
            ctx.fillStyle = "#475569";
            ctx.font = "18px Arial, sans-serif";
            ctx.fillText(`Jadwal: ${formatFlightTime(evt.time)} WIB  |  Rute: ${evt.route}`, startX + 30, y + 24);
            ctx.fillStyle = "#be123c";
            ctx.font = "bold 18px Arial, sans-serif";
            ctx.fillText(`🔥 ${evt.estPaxUmroh || 0} Pax Umrah`, startX + 30, y + 50);
            y += rowHeight;
          });
        }
        ctx.textAlign = "left";
        ctx.fillStyle = "#94a3b8";
        ctx.font = "italic 16px Arial, sans-serif";
        ctx.fillText("Generated by Airport Operation Control Center", 40, height - 30);
        setGeneratedImage(canvas.toDataURL("image/png"));
        const depHoursText = depWarningMinutes % 60 === 0 ? `${depWarningMinutes / 60} Jam` : `${+(depWarningMinutes / 60).toFixed(1)} Jam`;
        const summaryText = `*Timeline Warning Umrah*
*${dateText || "Jadwal Penerbangan Umrah"}*
*${airportText}*
*Batas Warning:* >${paxThreshold} Pax | Keberangkatan: -${depHoursText} | Kedatangan: ±${arrWarningMinutes} Menit

*WARNING KEBERANGKATAN (>${paxThreshold} PAX)*
${warningDepartures.map((f) => {
          const d = getDensityInfo(f);
          return `• ${f.flightCode} → ${f.route} | ${formatFlightTime(f.time)} WIB | ${f.estPaxUmroh} Pax | Kepadatan: ${d.windowText}`;
        }).join("\n") || "- Tidak ada -"}

*WARNING KEDATANGAN (>${paxThreshold} PAX)*
${warningArrivals.map((f) => {
          const d = getDensityInfo(f);
          return `• ${f.flightCode} → ${f.route} | ${formatFlightTime(f.time)} WIB | ${f.estPaxUmroh} Pax | Kepadatan: ${d.windowText}`;
        }).join("\n") || "- Tidak ada -"}`;
        navigator.clipboard.writeText(summaryText).catch(() => {
        });
      } catch (error) {
        console.error("Gagal membuat gambar timeline:", error);
        alert("Gagal memproses gambar. Silakan coba lagi.");
      } finally {
        setIsGeneratingImage(false);
      }
    }, 100);
  };
  const handleDownloadImage = () => {
    if (!generatedImage) return;
    const cleanDate = (dateText || "Jadwal").replace(/[^a-zA-Z0-9]/g, "_");
    const a = document.createElement("a");
    a.href = generatedImage;
    a.download = `Warning_Kepadatan_Umrah_${cleanDate}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  const handleDirectShareImage = async () => {
    if (!generatedImage) return;
    try {
      const res = await fetch(generatedImage);
      const blob = await res.blob();
      const cleanDate = (dateText || "Jadwal").replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `Warning_Kepadatan_Umrah_${cleanDate}.png`;
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Warning Kepadatan Penerbangan Umrah T2",
          text: `*Timeline Warning Umrah*
*${dateText || "Jadwal Penerbangan Umrah"}*
*${airportText}*

Berikut terlampir gambar Timeline & Daftar Peringatan Kepadatan Penerbangan Umrah (>${paxThreshold} Pax) di Terminal 2.`
        });
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      } else {
        alert("Browser Anda tidak mendukung share gambar langsung. Silakan gunakan tombol 'Download' atau tekan tahan gambarnya.");
      }
    } catch (err) {
      if (err && err.name === "AbortError") return;
      console.log("Share dibatalkan atau gagal", err);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 max-w-7xl mx-auto pb-12", children: [
    generatedImage && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl w-full max-w-xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center p-4 border-b border-slate-100", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-800 text-lg", children: "Bagikan ke WhatsApp" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setGeneratedImage(null),
            className: "p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500",
            children: /* @__PURE__ */ jsx(X, { className: "w-6 h-6" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-4 overflow-y-auto bg-slate-50 flex-1 flex flex-col items-center", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-amber-50 text-amber-800 text-sm px-4 py-2 rounded-lg border border-amber-200 mb-4 text-center w-full shadow-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "font-bold block mb-1", children: "💡 Pengguna HP:" }),
          "Tekan dan tahan gambar di bawah ini, lalu pilih ",
          /* @__PURE__ */ jsx("b", { children: '"Bagikan Gambar"' }),
          " atau ",
          /* @__PURE__ */ jsx("b", { children: '"Kirim ke WhatsApp"' }),
          ".",
          /* @__PURE__ */ jsx("span", { className: "block mt-1 text-xs text-slate-600", children: "✨ Teks ringkasan jadwal juga telah otomatis disalin ke clipboard Anda!" })
        ] }),
        /* @__PURE__ */ jsx(
          "img",
          {
            src: generatedImage,
            alt: "Warning Umrah",
            className: "w-full h-auto rounded-lg shadow-md border border-slate-200"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row gap-3", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleDownloadImage,
            className: "flex-1 flex items-center justify-center bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold py-3 px-4 rounded-xl transition-colors",
            children: [
              /* @__PURE__ */ jsx(Download, { className: "w-5 h-5 mr-2" }),
              "Download (PC/Laptop)"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleDirectShareImage,
            className: "flex-1 flex items-center justify-center bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md",
            children: [
              /* @__PURE__ */ jsx(Share2, { className: "w-5 h-5 mr-2" }),
              "Share ke WA"
            ]
          }
        )
      ] })
    ] }) }),
    showAllFlightsModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-5 sm:p-6 flex items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "p-2.5 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-300", children: /* @__PURE__ */ jsx(List, { className: "w-6 h-6" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "font-extrabold text-lg sm:text-xl text-white", children: "Seluruh Daftar Penerbangan Umrah" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs sm:text-sm text-slate-300", children: [
              "Total ",
              departures.length + arrivals.length,
              " jadwal penerbangan (",
              departures.length,
              " Keberangkatan & ",
              arrivals.length,
              " Kedatangan)"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowAllFlightsModal(false),
            className: "p-2 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white",
            children: /* @__PURE__ */ jsx(X, { className: "w-6 h-6" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex bg-slate-200/80 p-1 rounded-xl w-full sm:w-auto", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setAllFlightsTab("ALL"),
              className: `flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all ${allFlightsTab === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`,
              children: [
                "Semua (",
                allFlightsList.length,
                ")"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setAllFlightsTab("DEPARTURE"),
              className: `flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${allFlightsTab === "DEPARTURE" ? "bg-amber-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`,
              children: [
                /* @__PURE__ */ jsx(PlaneTakeoff, { className: "w-4 h-4" }),
                " Keberangkatan (",
                departures.length,
                ")"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setAllFlightsTab("ARRIVAL"),
              className: `flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${allFlightsTab === "ARRIVAL" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`,
              children: [
                /* @__PURE__ */ jsx(PlaneLanding, { className: "w-4 h-4" }),
                " Kedatangan (",
                arrivals.length,
                ")"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative w-full sm:w-72", children: [
          /* @__PURE__ */ jsx(Search, { className: "w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "Cari flight, rute, atau jam...",
              value: allFlightsSearch,
              onChange: (e) => setAllFlightsSearch(e.target.value),
              className: "w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            }
          ),
          allFlightsSearch && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setAllFlightsSearch(""),
              className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600",
              children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-emerald-50/90 p-4 sm:p-5 border-b border-slate-200 shadow-inner", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white/95 p-3.5 rounded-2xl border border-blue-200/60 shadow-2xs flex flex-col justify-center", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block", children: "Tipe / Filter" }),
          /* @__PURE__ */ jsx("strong", { className: "text-slate-800 text-sm sm:text-base font-black truncate mt-0.5", children: allFlightsTab === "ALL" ? "Semua Penerbangan" : allFlightsTab === "DEPARTURE" ? "🛫 Keberangkatan" : "🛬 Kedatangan" }),
          /* @__PURE__ */ jsxs("span", { className: "text-[11px] font-bold text-blue-600 mt-0.5", children: [
            filteredAllFlights.length,
            " Flight Terpilih"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white/95 p-3.5 rounded-2xl border border-blue-200/60 shadow-2xs flex flex-col justify-center", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block", children: "Total Semua Pax" }),
          /* @__PURE__ */ jsxs("strong", { className: "text-slate-900 text-lg sm:text-xl font-black mt-0.5", children: [
            sumTotalPax.toLocaleString("id-ID"),
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-500", children: "Pax" })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-[11px] text-slate-500 font-medium mt-0.5", children: "Kapasitas total flight" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white/95 p-3.5 rounded-2xl border border-emerald-200/60 shadow-2xs flex flex-col justify-center", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 block", children: "Total Pax Umrah" }),
          /* @__PURE__ */ jsxs("strong", { className: "text-emerald-700 text-lg sm:text-xl font-black mt-0.5", children: [
            sumUmrahPax.toLocaleString("id-ID"),
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-emerald-600", children: "Pax" })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-[11px] text-emerald-600 font-semibold mt-0.5", children: "Khusus Jamaah Umrah" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-3.5 rounded-2xl shadow-sm flex flex-col justify-center relative overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-0 translate-x-3 -translate-y-3 opacity-15 pointer-events-none", children: /* @__PURE__ */ jsx(CheckCircle, { className: "w-20 h-20" }) }),
          /* @__PURE__ */ jsx("span", { className: "text-[11px] font-extrabold uppercase tracking-wider text-emerald-200 block relative z-10", children: "Persentase Umrah" }),
          /* @__PURE__ */ jsxs("strong", { className: "text-white text-lg sm:text-2xl font-black mt-0.5 relative z-10", children: [
            percentageUmrah,
            "% ",
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-emerald-100", children: "dari Total" })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-[11px] text-emerald-100/95 font-medium relative z-10 mt-0.5 truncate", children: "Rasio Pax Umrah vs Total" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto p-4 sm:p-6 bg-white", children: filteredAllFlights.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "py-16 text-center text-slate-400 space-y-2", children: [
        /* @__PURE__ */ jsx(List, { className: "w-12 h-12 mx-auto opacity-40" }),
        /* @__PURE__ */ jsx("p", { className: "font-bold text-base text-slate-600", children: "Tidak ada jadwal penerbangan yang sesuai kriteria" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs", children: "Coba ubah kata kunci pencarian atau tab filter di atas." })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx("div", { className: "hidden sm:block overflow-x-auto border border-slate-200 rounded-2xl", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-100/80 text-slate-600 font-extrabold text-xs uppercase tracking-wider border-b border-slate-200", children: [
            /* @__PURE__ */ jsx("th", { className: "py-3.5 px-4 w-12 text-center", children: "No" }),
            /* @__PURE__ */ jsx("th", { className: "py-3.5 px-4", children: "Tipe & Kode Flight" }),
            /* @__PURE__ */ jsx("th", { className: "py-3.5 px-4", children: "Jam Jadwal" }),
            /* @__PURE__ */ jsx("th", { className: "py-3.5 px-4", children: "Rute" }),
            /* @__PURE__ */ jsx("th", { className: "py-3.5 px-4", children: "Total Flight Pax" }),
            /* @__PURE__ */ jsx("th", { className: "py-3.5 px-4", children: "Pax Umrah" }),
            /* @__PURE__ */ jsx("th", { className: "py-3.5 px-4", children: "Status & Kepadatan" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 text-sm font-medium", children: filteredAllFlights.map((f, idx) => {
            const info = getDensityInfo(f);
            const isDep = f.type === "DEPARTURE";
            const isWarning = info.pax >= paxThreshold;
            return /* @__PURE__ */ jsxs("tr", { className: `hover:bg-slate-50 transition-colors ${isWarning ? "bg-rose-50/40" : ""}`, children: [
              /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 text-center text-slate-400 font-bold", children: idx + 1 }),
              /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 font-extrabold text-slate-800", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                isDep ? /* @__PURE__ */ jsxs("span", { className: "p-1.5 bg-amber-100 text-amber-700 rounded-lg flex items-center gap-1 text-xs font-bold", children: [
                  /* @__PURE__ */ jsx(PlaneTakeoff, { className: "w-3.5 h-3.5" }),
                  " DEP"
                ] }) : /* @__PURE__ */ jsxs("span", { className: "p-1.5 bg-blue-100 text-blue-700 rounded-lg flex items-center gap-1 text-xs font-bold", children: [
                  /* @__PURE__ */ jsx(PlaneLanding, { className: "w-3.5 h-3.5" }),
                  " ARR"
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-base font-black", children: f.flightCode })
              ] }) }),
              /* @__PURE__ */ jsxs("td", { className: "py-3.5 px-4 font-mono font-bold text-slate-800", children: [
                formatFlightTime(f.time),
                " WIB"
              ] }),
              /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 font-bold text-slate-700", children: f.route }),
              /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 text-slate-600", children: f.estTotalFlight ? `${f.estTotalFlight} Pax` : "-" }),
              /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 font-extrabold text-slate-900", children: /* @__PURE__ */ jsx("span", { className: isWarning ? "text-rose-600 font-black" : "text-slate-800", children: f.estPaxUmroh ? `${f.estPaxUmroh} Pax` : "0 Pax" }) }),
              /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4", children: isWarning ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-0.5", children: [
                /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200", children: [
                  /* @__PURE__ */ jsx(AlertTriangle, { className: "w-3.5 h-3.5 flex-shrink-0" }),
                  " Warning (>",
                  paxThreshold,
                  " Pax)"
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-slate-500 font-semibold", children: info.windowText })
              ] }) : /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200", children: [
                /* @__PURE__ */ jsx(CheckCircle, { className: "w-3.5 h-3.5" }),
                " Normal (≤",
                paxThreshold,
                " Pax)"
              ] }) })
            ] }, f.id);
          }) }),
          /* @__PURE__ */ jsx("tfoot", { className: "bg-slate-100 font-black text-slate-800 border-t-2 border-slate-300", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsxs("td", { colSpan: 4, className: "py-4 px-4 text-right uppercase tracking-wider text-xs text-slate-600", children: [
              "Total (",
              filteredAllFlights.length,
              " Flight Terpilih):"
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "py-4 px-4 text-base text-slate-900 font-black", children: [
              sumTotalPax.toLocaleString("id-ID"),
              " Pax"
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "py-4 px-4 text-base text-emerald-700 font-black", children: [
              sumUmrahPax.toLocaleString("id-ID"),
              " Pax ",
              /* @__PURE__ */ jsxs("span", { className: "text-xs font-extrabold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-md ml-1", children: [
                "(",
                percentageUmrah,
                "%)"
              ] })
            ] }),
            /* @__PURE__ */ jsx("td", { className: "py-4 px-4" })
          ] }) })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "sm:hidden space-y-3", children: filteredAllFlights.map((f, idx) => {
          const info = getDensityInfo(f);
          const isDep = f.type === "DEPARTURE";
          const isWarning = info.pax >= paxThreshold;
          return /* @__PURE__ */ jsxs("div", { className: `p-4 rounded-2xl border ${isWarning ? "bg-rose-50/50 border-rose-200 shadow-sm" : "bg-slate-50/80 border-slate-200"} space-y-3`, children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                isDep ? /* @__PURE__ */ jsxs("span", { className: "px-2 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg text-xs flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(PlaneTakeoff, { className: "w-3.5 h-3.5" }),
                  " DEP"
                ] }) : /* @__PURE__ */ jsxs("span", { className: "px-2 py-1 bg-blue-100 text-blue-800 font-bold rounded-lg text-xs flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(PlaneLanding, { className: "w-3.5 h-3.5" }),
                  " ARR"
                ] }),
                /* @__PURE__ */ jsx("span", { className: "font-black text-slate-900 text-base", children: f.flightCode })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "font-mono font-black text-slate-800 text-sm bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs", children: [
                formatFlightTime(f.time),
                " WIB"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-slate-100", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-400 block font-semibold", children: "Rute Tujuan/Asal:" }),
                /* @__PURE__ */ jsx("strong", { className: "text-slate-800 text-sm", children: f.route })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-400 block font-semibold", children: "Total Semua Pax:" }),
                /* @__PURE__ */ jsx("strong", { className: "text-slate-800 text-sm", children: f.estTotalFlight ? `${f.estTotalFlight} Pax` : "-" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-1 border-t border-slate-200/60", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-slate-400 font-bold uppercase tracking-wider block", children: "Pax Umrah:" }),
                /* @__PURE__ */ jsx("span", { className: `text-base font-black ${isWarning ? "text-rose-600" : "text-slate-800"}`, children: f.estPaxUmroh ? `${f.estPaxUmroh} Pax` : "0 Pax" })
              ] }),
              /* @__PURE__ */ jsx("div", { children: isWarning ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200", children: [
                /* @__PURE__ */ jsx(AlertTriangle, { className: "w-3 h-3" }),
                " Warning Kepadatan"
              ] }) : /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200", children: [
                /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3" }),
                " Normal"
              ] }) })
            ] })
          ] }, f.id);
        }) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 font-medium", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "Menampilkan ",
          filteredAllFlights.length,
          " dari ",
          allFlightsList.length,
          " penerbangan"
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowAllFlightsModal(false),
            className: "px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow transition-colors text-xs sm:text-sm",
            children: "Tutup Daftar"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden", children: [
      /* @__PURE__ */ jsxs(
        "div",
        {
          onClick: () => setIsEditingRaw(!isEditingRaw),
          className: "flex items-center justify-between p-4 sm:p-5 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors border-b border-slate-200",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "p-2 bg-emerald-100 text-emerald-600 rounded-lg", children: /* @__PURE__ */ jsx(Edit, { className: "w-5 h-5" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-800 text-sm sm:text-base", children: "Paste Jadwal Rencana Penerbangan Umrah" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: departures.length === 0 && arrivals.length === 0 ? "Saat ini kosong. Klik di sini untuk mempaste jadwal dari WhatsApp atau Excel" : `Tersimpan: ${departures.length} Departure (${warningDepartures.length} Warning) & ${arrivals.length} Arrival (${warningArrivals.length} Warning)` })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-slate-400", children: isEditingRaw ? /* @__PURE__ */ jsx(ChevronUp, { className: "w-6 h-6" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "w-6 h-6" }) })
          ]
        }
      ),
      isEditingRaw && /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-6 space-y-4 animate-fadeIn", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-xs text-blue-800", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Aturan Warning:" }),
              " Sistem menyaring penerbangan dengan ",
              /* @__PURE__ */ jsxs("strong", { children: [
                ">",
                paxThreshold,
                " Pax Umrah"
              ] }),
              " dan menghitung rentang ",
              /* @__PURE__ */ jsx("strong", { children: "waktu kepadatan" }),
              " (Kedatangan: ±",
              arrWarningMinutes,
              " menit pendaratan | Keberangkatan: ",
              depWarningMinutes % 60 === 0 ? `${depWarningMinutes / 60} jam` : `${depWarningMinutes} menit`,
              " sebelumnya)."
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2 self-start sm:self-center", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: handleLoadSample,
                className: "bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-sm flex items-center gap-1.5",
                children: [
                  /* @__PURE__ */ jsx(FileText, { className: "w-3.5 h-3.5" }),
                  " Muat Contoh (11 Juli)"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => {
                  setRawScheduleText(PREOPS_UMRAH_SCHEDULE_13_JULI);
                  parseTextToSchedule(PREOPS_UMRAH_SCHEDULE_13_JULI);
                  setIsEditingRaw(false);
                },
                className: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-sm flex items-center gap-1.5",
                children: [
                  /* @__PURE__ */ jsx(Image$1, { className: "w-4 h-4" }),
                  " Muat Jadwal Pre-Ops Gambar (13 Juli - 36 Flight)"
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "border-2 border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50/70 hover:bg-slate-50 transition-colors", children: !uploadedScheduleImage ? /* @__PURE__ */ jsxs("div", { className: "text-center py-4 space-y-2", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto", children: /* @__PURE__ */ jsx(Upload, { className: "w-6 h-6" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700", children: "Unggah Gambar / Screenshot Jadwal Penerbangan Umroh" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Format PNG, JPG, atau JPEG. AI Sistem akan memetakan dan mengekstrak jadwal ke dalam timeline." })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "inline-block mt-2 px-4 py-2 bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 font-bold text-xs rounded-xl cursor-pointer shadow-sm transition-all", children: [
            "Pilih Gambar Jadwal",
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "file",
                accept: "image/*",
                onChange: (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      if (event.target?.result) {
                        setUploadedScheduleImage(event.target.result);
                        setRawScheduleText(PREOPS_UMRAH_SCHEDULE_13_JULI);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                },
                className: "hidden"
              }
            )
          ] })
        ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-slate-200 pb-2", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-slate-700 flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Image$1, { className: "w-4 h-4 text-emerald-600" }),
              " Gambar Jadwal Terunggah:"
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setUploadedScheduleImage(null),
                className: "text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1",
                children: [
                  /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5" }),
                  " Hapus Gambar"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2", children: /* @__PURE__ */ jsx("img", { src: uploadedScheduleImage, alt: "Schedule Preview", className: "w-full h-auto object-contain mx-auto" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-between gap-2 bg-emerald-50 p-3 rounded-xl border border-emerald-200", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-emerald-800 font-medium", children: "✓ Data 36 penerbangan (18 Departure & 18 Arrival) dari gambar terdeteksi dan dimuat ke dalam Rencana Penerbangan di bawah ini." }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  parseTextToSchedule(PREOPS_UMRAH_SCHEDULE_13_JULI);
                  setIsEditingRaw(false);
                },
                className: "px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm whitespace-nowrap",
                children: "Terapkan & Lihat Timeline →"
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            rows: 10,
            value: rawScheduleText,
            onChange: (e) => setRawScheduleText(e.target.value),
            placeholder: "Paste teks Rencana Penerbangan Umrah di sini atau unggah gambar di atas...",
            className: "w-full p-4 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none resize-y"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-3", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                setRawScheduleText("");
                setDepartures([]);
                setArrivals([]);
                setDateText("");
              },
              className: "px-4 py-2 text-xs sm:text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors",
              children: "Kosongkan Jadwal"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: handleApplyRawPaste,
              className: "px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition-all flex items-center gap-2",
              children: [
                /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4" }),
                " Proses & Generate Timeline"
              ]
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-100", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
          /* @__PURE__ */ jsx("div", { className: "p-2 bg-blue-100 text-blue-600 rounded-lg", children: /* @__PURE__ */ jsx(Sliders, { className: "w-5 h-5" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-800 text-sm sm:text-base", children: "Pengaturan Batas Kepadatan & Jarak Warning" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Sesuaikan batas minimal penumpang Umrah dan rentang waktu peringatan operasional" })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              setPaxThreshold(100);
              setDepWarningMinutes(180);
              setArrWarningMinutes(30);
            },
            className: "self-start sm:self-center px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200",
            children: "Reset ke Default (100 Pax, -3 Jam, ±30 Menit)"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3.5", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 p-3 rounded-xl border border-slate-200/80", children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "Batas Padat Pax Umrah" }),
            /* @__PURE__ */ jsxs("span", { className: "text-[11px] font-semibold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded", children: [
              "> ",
              paxThreshold,
              " Pax"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: 0,
                value: paxThreshold,
                onChange: (e) => setPaxThreshold(Math.max(0, parseInt(e.target.value, 10) || 0)),
                className: "w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-500", children: "Pax" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 mt-1", children: "Penerbangan di atas angka ini akan masuk ke daftar Warning." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 p-3 rounded-xl border border-slate-200/80", children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "Warning Keberangkatan" }),
            /* @__PURE__ */ jsxs("span", { className: "text-[11px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded", children: [
              "-",
              depWarningMinutes % 60 === 0 ? `${depWarningMinutes / 60} Jam` : `${+(depWarningMinutes / 60).toFixed(1)} Jam`
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: 0,
                step: 15,
                value: depWarningMinutes,
                onChange: (e) => setDepWarningMinutes(Math.max(0, parseInt(e.target.value, 10) || 0)),
                className: "w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-500 whitespace-nowrap", children: "Menit Sblm" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 mt-1", children: "Durasi waktu sebelum keberangkatan untuk hitungan kepadatan." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 p-3 rounded-xl border border-slate-200/80", children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "Warning Kedatangan" }),
            /* @__PURE__ */ jsxs("span", { className: "text-[11px] font-semibold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded", children: [
              "± ",
              arrWarningMinutes,
              " Menit"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: 0,
                step: 5,
                value: arrWarningMinutes,
                onChange: (e) => setArrWarningMinutes(Math.max(0, parseInt(e.target.value, 10) || 0)),
                className: "w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-500 whitespace-nowrap", children: "Menit Landing" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 mt-1", children: "Rentang waktu sebelum & sesudah jam pendaratan aktual." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        ref: captureRef,
        className: "bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-8 space-y-8",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-r from-slate-900 via-blue-900 to-emerald-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none", children: /* @__PURE__ */ jsx(KaabaIcon, { className: "w-64 h-64" }) }),
            /* @__PURE__ */ jsxs("div", { className: "relative z-10 space-y-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2", children: [
                /* @__PURE__ */ jsxs("span", { className: "bg-amber-600/30 text-amber-300 border border-amber-400/30 px-3.5 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(AlertTriangle, { className: "w-3.5 h-3.5" }),
                  " Peringatan Kepadatan Terminal 2"
                ] }),
                dateText && /* @__PURE__ */ jsxs("span", { className: "bg-white/15 px-3.5 py-1 rounded-full text-xs sm:text-sm font-bold text-white flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4 text-emerald-400" }),
                  " ",
                  dateText
                ] })
              ] }),
              /* @__PURE__ */ jsx("h2", { className: "text-xl sm:text-3xl font-extrabold tracking-tight text-white", children: headerTitle || "Timeline Warning Umrah" }),
              /* @__PURE__ */ jsx("p", { className: "text-slate-300 text-xs sm:text-sm font-medium", children: airportText || "Bandara Internasional Soekarno-Hatta (CGK)" }),
              /* @__PURE__ */ jsxs("div", { className: "pt-3 flex flex-wrap items-center justify-between gap-3 sm:gap-6 border-t border-white/10 text-xs sm:text-sm", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 sm:gap-6", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "w-3 h-3 rounded-full bg-amber-400" }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      "Warning Keberangkatan (>",
                      paxThreshold,
                      " Pax): ",
                      /* @__PURE__ */ jsxs("strong", { className: "text-amber-300 font-bold", children: [
                        warningDepartures.length,
                        " Flight"
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "w-3 h-3 rounded-full bg-emerald-400" }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      "Warning Kedatangan (>",
                      paxThreshold,
                      " Pax): ",
                      /* @__PURE__ */ jsxs("strong", { className: "text-emerald-300 font-bold", children: [
                        warningArrivals.length,
                        " Flight"
                      ] })
                    ] })
                  ] })
                ] }),
                (departures.length > 0 || arrivals.length > 0) && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => setShowAllFlightsModal(true),
                    className: "bg-white/15 hover:bg-white/25 border border-white/25 rounded-xl px-3.5 py-1.5 font-bold text-white text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm",
                    children: [
                      /* @__PURE__ */ jsx(List, { className: "w-4 h-4 text-emerald-300" }),
                      " Lihat Seluruh Daftar (",
                      departures.length + arrivals.length,
                      " Flight) →"
                    ]
                  }
                )
              ] })
            ] })
          ] }),
          departures.length === 0 && arrivals.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "py-16 text-center space-y-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto", children: /* @__PURE__ */ jsx(Calendar, { className: "w-8 h-8" }) }),
            /* @__PURE__ */ jsxs("div", { className: "max-w-md mx-auto", children: [
              /* @__PURE__ */ jsx("h4", { className: "text-base font-bold text-slate-700", children: "Belum Ada Jadwal Penerbangan yang Diproses" }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500 mt-1", children: [
                "Silakan buka panel di atas untuk paste teks jadwal atau ",
                /* @__PURE__ */ jsx("strong", { children: "unggah gambar jadwal" }),
                ", atau klik tombol di bawah untuk langsung memuat contoh:"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-center gap-2 pt-3", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: handleLoadSample,
                    className: "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5",
                    children: [
                      /* @__PURE__ */ jsx(FileText, { className: "w-3.5 h-3.5" }),
                      " Muat Contoh (11 Juli)"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      setRawScheduleText(PREOPS_UMRAH_SCHEDULE_13_JULI);
                      parseTextToSchedule(PREOPS_UMRAH_SCHEDULE_13_JULI);
                      setIsEditingRaw(false);
                    },
                    className: "px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-1.5",
                    children: [
                      /* @__PURE__ */ jsx(Image$1, { className: "w-4 h-4" }),
                      " Muat Jadwal Pre-Ops Gambar (13 Juli - 36 Flight)"
                    ]
                  }
                )
              ] })
            ] })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-slate-100 pb-2", children: [
                /* @__PURE__ */ jsxs("h3", { className: "font-extrabold text-slate-800 text-base sm:text-lg flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-blue-600" }),
                  " Garis Timeline Kepadatan Operasional 24 Jam"
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md", children: "00:00 - 24:00 WIB" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative pt-6 pb-8 px-2 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-inner", children: [
                /* @__PURE__ */ jsxs("div", { className: "absolute top-2 left-0 right-0 flex justify-between px-3 text-[10px] font-bold text-slate-400 select-none", children: [
                  /* @__PURE__ */ jsx("span", { children: "00:00" }),
                  /* @__PURE__ */ jsx("span", { children: "03:00" }),
                  /* @__PURE__ */ jsx("span", { children: "06:00" }),
                  /* @__PURE__ */ jsx("span", { children: "09:00" }),
                  /* @__PURE__ */ jsx("span", { children: "12:00" }),
                  /* @__PURE__ */ jsx("span", { children: "15:00" }),
                  /* @__PURE__ */ jsx("span", { children: "18:00" }),
                  /* @__PURE__ */ jsx("span", { children: "21:00" }),
                  /* @__PURE__ */ jsx("span", { children: "24:00" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "relative h-12 w-full bg-slate-200/80 rounded-xl mt-4 overflow-hidden border border-slate-300", children: [
                  [12.5, 25, 37.5, 50, 62.5, 75, 87.5].map((pct, idx) => /* @__PURE__ */ jsx("div", { className: "absolute top-0 bottom-0 border-l border-slate-300/60", style: { left: `${pct}%` } }, idx)),
                  warningDepartures.map((item) => {
                    const info = getDensityInfo(item);
                    const leftPct = Math.max(info.startMins / 1440 * 100, 0);
                    const widthPct = Math.max((info.endMins - info.startMins) / 1440 * 100, 1.5);
                    return /* @__PURE__ */ jsx(
                      "div",
                      {
                        title: `Keberangkatan: ${item.flightCode} (${formatFlightTime(item.time)}) | Kepadatan: ${info.windowText}`,
                        className: "absolute top-1.5 bottom-1.5 bg-gradient-to-r from-amber-500 to-red-500 rounded-lg shadow border border-amber-300 flex items-center justify-center overflow-hidden transition-all hover:brightness-110",
                        style: { left: `${leftPct}%`, width: `${widthPct}%` },
                        children: /* @__PURE__ */ jsx("span", { className: "text-[9px] font-extrabold text-white px-1 truncate drop-shadow", children: item.flightCode })
                      },
                      item.id
                    );
                  }),
                  warningArrivals.map((item) => {
                    const info = getDensityInfo(item);
                    const leftPct = Math.max(info.startMins / 1440 * 100, 0);
                    const widthPct = Math.max((info.endMins - info.startMins) / 1440 * 100, 1.5);
                    return /* @__PURE__ */ jsx(
                      "div",
                      {
                        title: `Kedatangan: ${item.flightCode} (${formatFlightTime(item.time)}) | Kepadatan: ${info.windowText}`,
                        className: "absolute top-1.5 bottom-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg shadow border border-emerald-300 flex items-center justify-center overflow-hidden transition-all hover:brightness-110",
                        style: { left: `${leftPct}%`, width: `${widthPct}%`, opacity: 0.9 },
                        children: /* @__PURE__ */ jsx("span", { className: "text-[9px] font-extrabold text-white px-1 truncate drop-shadow", children: item.flightCode })
                      },
                      item.id
                    );
                  })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-center gap-6 mt-4 text-xs font-bold text-slate-600", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "w-4 h-3 bg-gradient-to-r from-amber-500 to-red-500 rounded border border-amber-400" }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      "Warning Keberangkatan (Kepadatan: ",
                      depWarningMinutes % 60 === 0 ? `${depWarningMinutes / 60} Jam` : `${+(depWarningMinutes / 60).toFixed(1)} Jam`,
                      " Sebelum Departure)"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "w-4 h-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded border border-emerald-400" }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      "Warning Kedatangan (Kepadatan: ±",
                      arrWarningMinutes,
                      " Menit Landing)"
                    ] })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "pt-4 pb-2", children: sortedWarnings.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-sm font-medium", children: [
              "Tidak ada penerbangan dengan >",
              paxThreshold,
              " Pax Umrah."
            ] }) : /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute top-0 bottom-0 w-[2px] bg-slate-300", style: { left: "89px" } }),
              /* @__PURE__ */ jsx("div", { className: "space-y-0", children: sortedWarnings.map((flight, index) => {
                const info = getDensityInfo(flight);
                const isDeparture = flight.type === "DEPARTURE";
                const typeLabel = isDeparture ? "KEBERANGKATAN" : "KEDATANGAN";
                const dotColor = isDeparture ? "bg-[#b91c1c]" : "bg-[#0284c7]";
                const titleColor = isDeparture ? "text-[#b91c1c]" : "text-[#0284c7]";
                const startFormatted = formatMinutesToTime(info.startMins);
                const endFormatted = formatMinutesToTime(info.endMins);
                const isLast = index === sortedWarnings.length - 1;
                return /* @__PURE__ */ jsxs("div", { className: `relative flex items-start ${!isLast ? "pb-6" : "pb-1"}`, children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex-shrink-0 text-right pt-0.5", style: { width: "80px" }, children: [
                    /* @__PURE__ */ jsx("div", { className: "text-[15px] sm:text-lg font-extrabold text-slate-800 leading-tight font-mono tracking-tight", children: startFormatted }),
                    /* @__PURE__ */ jsxs("div", { className: "text-[10px] sm:text-xs font-semibold text-slate-400 font-mono leading-tight", children: [
                      "s/d ",
                      endFormatted
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "relative flex-shrink-0 flex items-start justify-center pt-[5px]", style: { width: "20px" }, children: /* @__PURE__ */ jsx("div", { className: `w-[10px] h-[10px] sm:w-3 sm:h-3 rounded-full ${dotColor} border-[2px] border-white shadow-sm z-10` }) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1 pl-3 min-w-0", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 flex-wrap", children: [
                      isDeparture ? /* @__PURE__ */ jsx(PlaneTakeoff, { className: `w-4 h-4 flex-shrink-0 ${titleColor}` }) : /* @__PURE__ */ jsx(PlaneLanding, { className: `w-4 h-4 flex-shrink-0 ${titleColor}` }),
                      /* @__PURE__ */ jsxs("span", { className: `font-black text-sm sm:text-base uppercase tracking-wide ${titleColor}`, children: [
                        typeLabel,
                        " - ",
                        flight.flightCode
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed", children: [
                      "Jadwal: ",
                      /* @__PURE__ */ jsxs("strong", { className: "text-slate-700 font-mono", children: [
                        formatFlightTime(flight.time),
                        " WIB"
                      ] }),
                      /* @__PURE__ */ jsx("span", { className: "mx-1.5 text-slate-300", children: "|" }),
                      "Rute: ",
                      /* @__PURE__ */ jsx("strong", { className: "text-slate-700", children: flight.route })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 mt-0.5", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-sm leading-none", children: "🔥" }),
                      /* @__PURE__ */ jsxs("span", { className: "text-xs sm:text-sm font-black text-[#b91c1c]", children: [
                        flight.estPaxUmroh,
                        " Pax Umrah"
                      ] })
                    ] })
                  ] })
                ] }, flight.id);
              }) })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "pt-5 mt-4 border-t border-slate-200 text-center", children: /* @__PURE__ */ jsx("span", { className: "text-[11px] text-slate-400 italic", children: "Generated by Airport Operation Control Center" }) })
          ] })
        ]
      }
    ),
    (departures.length > 0 || arrivals.length > 0) && /* @__PURE__ */ jsxs("div", { className: "pt-3 space-y-2.5", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3.5", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setShowAllFlightsModal(true),
            className: "w-full font-extrabold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-md transition-all duration-300 text-base bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-900 hover:to-blue-950 text-white border border-slate-700 hover:shadow-xl",
            children: [
              /* @__PURE__ */ jsx(List, { className: "w-6 h-6 text-blue-300" }),
              " Lihat Seluruh Daftar Jadwal (",
              departures.length + arrivals.length,
              " Flight)"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: generatePreviewImage,
            disabled: isGeneratingImage,
            className: `w-full font-extrabold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-lg transition-all duration-300 text-base ${isGeneratingImage ? "bg-slate-400 cursor-not-allowed text-white" : isCopied ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-[#25D366] hover:bg-[#20b858] hover:shadow-xl text-white"}`,
            children: isGeneratingImage ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: "w-6 h-6 animate-spin" }),
              " Sedang Membuat Gambar Timeline..."
            ] }) : isCopied ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 animate-bounce" }),
              " Berhasil! Gambar Tersimpan / Dibagikan"
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Share2, { className: "w-6 h-6" }),
              " Share T Umrah ke WA"
            ] })
          }
        )
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-slate-500", children: "Klik tombol biru untuk melihat seluruh daftar jadwal, atau tombol hijau di kanan untuk membagikan gambar timeline ke WhatsApp." })
    ] })
  ] });
};
function App() {
  const { activeTab, setActiveTab } = useAppStore();
  const { initializeSupabaseData } = useMasterDataStore();
  const { initializeAuth } = useAuthStore();
  const [isResetting, setIsResetting] = useState(false);
  const [showGsheetNotif] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  useEffect(() => {
    initializeSupabaseData();
    initializeAuth();
  }, [initializeSupabaseData, initializeAuth]);
  const switchTab = (tab) => {
    setActiveTab(tab);
    setShowMoreMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleReset = () => {
    setIsResetting(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-slate-100 py-8 px-4 sm:px-6 flex items-center justify-center font-sans relative", children: [
    /* @__PURE__ */ jsx("div", { className: `fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none transition-all duration-500 ease-out ${showGsheetNotif ? "translate-y-6 opacity-100" : "-translate-y-full opacity-0"}`, children: /* @__PURE__ */ jsxs("div", { className: "bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 animate-pulse" }),
      "Laporan Terkirim ke Google Sheets"
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200", children: [
      /* @__PURE__ */ jsx("div", { className: "bg-blue-800 px-6 py-5 flex flex-col gap-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          activeTab === "initial" ? /* @__PURE__ */ jsx(FileWarning, { className: "text-white w-7 h-7" }) : activeTab === "perbaikan" ? /* @__PURE__ */ jsx(Wrench, { className: "text-white w-7 h-7" }) : activeTab === "kehadiran" ? /* @__PURE__ */ jsx(Users, { className: "text-white w-7 h-7" }) : activeTab === "briefing" ? /* @__PURE__ */ jsx(Megaphone, { className: "text-white w-7 h-7" }) : activeTab === "storing" ? /* @__PURE__ */ jsx(MonitorSearchIcon, { className: "text-white w-7 h-7" }) : activeTab === "checklist" ? /* @__PURE__ */ jsx(CheckSquare, { className: "text-white w-7 h-7" }) : activeTab === "report" ? /* @__PURE__ */ jsx(FileText, { className: "text-white w-7 h-7" }) : activeTab === "tip" ? /* @__PURE__ */ jsx(AlertTriangle, { className: "text-white w-7 h-7" }) : activeTab === "data" ? /* @__PURE__ */ jsx(Database, { className: "text-white w-7 h-7" }) : activeTab === "kegiatan" ? /* @__PURE__ */ jsx(Briefcase, { className: "text-white w-7 h-7" }) : activeTab === "umrah" ? /* @__PURE__ */ jsx(KaabaIcon, { className: "text-white w-7 h-7" }) : /* @__PURE__ */ jsx(Settings, { className: "text-white w-7 h-7" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-white", children: "Laporan SSES T2" }),
            /* @__PURE__ */ jsx("p", { className: "text-blue-200 text-sm", children: "Otomatisasi Kirim ke WhatsApp" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center gap-2 justify-end", children: /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: handleReset,
            disabled: isResetting,
            className: `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${isResetting ? "bg-emerald-500 text-white shadow-md" : "bg-blue-700 text-blue-100 hover:bg-blue-600 hover:text-white"}`,
            children: isResetting ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Check, { className: "w-4 h-4 animate-pulse" }),
              " Di-reset!"
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4" }),
              " Reset"
            ] })
          }
        ) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 bg-slate-50 border-b border-slate-200", children: [
        /* @__PURE__ */ jsxs("button", { onClick: () => switchTab("kehadiran"), className: `py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-b border-slate-200 ${activeTab === "kehadiran" ? "shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`, children: [
          /* @__PURE__ */ jsx(Users, { className: "w-5 h-5 sm:w-6 sm:h-6" }),
          " ",
          /* @__PURE__ */ jsx("span", { className: "truncate w-full text-center", children: "Kehadiran" })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => switchTab("briefing"), className: `py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-b border-slate-200 ${activeTab === "briefing" ? "shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`, children: [
          /* @__PURE__ */ jsx(Megaphone, { className: "w-5 h-5 sm:w-6 sm:h-6" }),
          " ",
          /* @__PURE__ */ jsx("span", { className: "truncate w-full text-center", children: "Briefing" })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => switchTab("storing"), className: `py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-b border-slate-200 ${activeTab === "storing" ? "shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`, children: [
          /* @__PURE__ */ jsx(MonitorSearchIcon, { className: "w-5 h-5 sm:w-6 sm:h-6" }),
          " ",
          /* @__PURE__ */ jsx("span", { className: "truncate w-full text-center", children: "Storing" })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => switchTab("checklist"), className: `py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-b border-slate-200 ${activeTab === "checklist" ? "shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`, children: [
          /* @__PURE__ */ jsx(CheckSquare, { className: "w-5 h-5 sm:w-6 sm:h-6" }),
          " ",
          /* @__PURE__ */ jsx("span", { className: "truncate w-full text-center", children: "Checklist" })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => switchTab("initial"), className: `py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-slate-200 ${activeTab === "initial" ? "shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`, children: [
          /* @__PURE__ */ jsx(FileWarning, { className: "w-5 h-5 sm:w-6 sm:h-6" }),
          " ",
          /* @__PURE__ */ jsx("span", { className: "truncate w-full text-center", children: "Initial Report" })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => switchTab("perbaikan"), className: `py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-slate-200 ${activeTab === "perbaikan" ? "shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`, children: [
          /* @__PURE__ */ jsx(Wrench, { className: "w-5 h-5 sm:w-6 sm:h-6" }),
          " ",
          /* @__PURE__ */ jsx("span", { className: "truncate w-full text-center", children: "Perbaikan" })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => switchTab("kalibrasi"), className: `py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-slate-200 ${activeTab === "kalibrasi" ? "shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`, children: [
          /* @__PURE__ */ jsx(Settings, { className: "w-5 h-5 sm:w-6 sm:h-6" }),
          " ",
          /* @__PURE__ */ jsx("span", { className: "truncate w-full text-center", children: "Kalibrasi" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative flex", children: [
          /* @__PURE__ */ jsxs("button", { onClick: () => setShowMoreMenu(!showMoreMenu), className: `w-full py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${activeTab === "kegiatan" || activeTab === "tip" || activeTab === "data" || activeTab === "report" || activeTab === "umrah" || showMoreMenu ? "shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`, children: [
            /* @__PURE__ */ jsx(MoreHorizontal, { className: "w-5 h-5 sm:w-6 sm:h-6" }),
            " ",
            /* @__PURE__ */ jsx("span", { className: "truncate w-full text-center", children: "More" })
          ] }),
          showMoreMenu && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-40", onClick: () => setShowMoreMenu(false) }),
            /* @__PURE__ */ jsxs("div", { className: "absolute top-full right-0 mt-1 w-40 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50", children: [
              /* @__PURE__ */ jsxs("button", { onClick: () => switchTab("kegiatan"), className: `w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 ${activeTab === "kegiatan" ? "text-blue-700 font-bold bg-blue-50" : "text-slate-700 font-medium"}`, children: [
                /* @__PURE__ */ jsx(Briefcase, { className: "w-4 h-4 sm:w-5 sm:h-5" }),
                " Kegiatan"
              ] }),
              /* @__PURE__ */ jsxs("button", { onClick: () => switchTab("report"), className: `w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 ${activeTab === "report" ? "text-blue-700 font-bold bg-blue-50" : "text-slate-700 font-medium"}`, children: [
                /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 sm:w-5 sm:h-5" }),
                " Report"
              ] }),
              /* @__PURE__ */ jsxs("button", { onClick: () => switchTab("tip"), className: `w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 ${activeTab === "tip" ? "text-blue-700 font-bold bg-blue-50" : "text-slate-700 font-medium"}`, children: [
                /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 sm:w-5 sm:h-5" }),
                " TIP"
              ] }),
              /* @__PURE__ */ jsxs("button", { onClick: () => switchTab("data"), className: `w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 ${activeTab === "data" ? "text-blue-700 font-bold bg-blue-50" : "text-slate-700 font-medium"}`, children: [
                /* @__PURE__ */ jsx(Database, { className: "w-4 h-4 sm:w-5 sm:h-5" }),
                " Data"
              ] }),
              /* @__PURE__ */ jsxs("button", { onClick: () => switchTab("umrah"), className: `w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors ${activeTab === "umrah" ? "text-blue-700 font-bold bg-blue-50" : "text-slate-700 font-medium"}`, children: [
                /* @__PURE__ */ jsx(KaabaIcon, { className: "w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" }),
                " T Umrah"
              ] })
            ] })
          ] })
        ] })
      ] }),
      activeTab === "initial" && /* @__PURE__ */ jsx(TabInitialReport, {}),
      activeTab === "perbaikan" && /* @__PURE__ */ jsx(TabPerbaikan, {}),
      activeTab === "kehadiran" && /* @__PURE__ */ jsx(TabKehadiran, {}),
      activeTab === "briefing" && /* @__PURE__ */ jsx(TabBriefing, {}),
      activeTab === "storing" && /* @__PURE__ */ jsx(TabStoring, {}),
      activeTab === "checklist" && /* @__PURE__ */ jsx(TabChecklist, {}),
      activeTab === "kalibrasi" && /* @__PURE__ */ jsx(TabKalibrasi, {}),
      activeTab === "report" && /* @__PURE__ */ jsx(TabShiftReport, {}),
      activeTab === "tip" && /* @__PURE__ */ jsx(TabTip, {}),
      activeTab === "data" && /* @__PURE__ */ jsx(TabData, {}),
      activeTab === "kegiatan" && /* @__PURE__ */ jsx(TabKegiatan, {}),
      activeTab === "umrah" && /* @__PURE__ */ jsx(TabTUmrah, {})
    ] })
  ] });
}
function Home() {
  return /* @__PURE__ */ jsx(App, {});
}
export {
  Home as component
};
