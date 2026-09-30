"use client";

import React, { useState, useRef } from "react";
import { X, Download, ZoomIn, ZoomOut, FileIcon, RotateCcw, ExternalLink } from "lucide-react";
import { formatFileSize, isImage, isVector } from "@/lib/attachment-client";

interface AttachmentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    url: string;
    name: string;
    originalName: string;
    mimetype: string;
    fileSize: number;
    width?: number | null;
    height?: number | null;
  } | null;
  isAr?: boolean;
}

export default function AttachmentPreview({
  isOpen,
  onClose,
  file,
  isAr,
}: AttachmentPreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !file) return null;

  const isImg = isImage(file.mimetype);
  const isVec = isVector(file.mimetype);
  const showZoom = isImg || isVec;
  const isPdf = file.mimetype === "application/pdf" || file.url.toLowerCase().endsWith(".pdf");

  const fitScale = naturalSize && containerRef.current
    ? Math.min(
        (containerRef.current.clientWidth - 64) / naturalSize.w,
        (containerRef.current.clientHeight - 64) / naturalSize.h,
        1
      )
    : 1;

  const displayW = naturalSize ? Math.round(naturalSize.w * zoom * fitScale) : undefined;
  const displayH = naturalSize ? Math.round(naturalSize.h * zoom * fitScale) : undefined;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 flex flex-col"
      onClick={onClose}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-5 py-3 text-white/80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 rounded-lg bg-white/10 text-white/60">
            <FileIcon size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {file.originalName}
            </p>
            <p className="text-[11px] text-white/50">
              {formatFileSize(file.fileSize)}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
          title={isAr ? "إغلاق" : "Close"}
        >
          <X size={22} />
        </button>
      </div>

      {/* Media area */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-8 overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {showZoom ? (
          <img
            src={file.url}
            alt={file.originalName}
            width={displayW}
            height={displayH}
            onLoad={(e) => {
              setImgLoaded(true);
              const img = e.target as HTMLImageElement;
              setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
            }}
            className={`shadow-2xl ${
              imgLoaded ? "opacity-100" : "opacity-0"
            } transition-opacity duration-300 m-auto`}
            draggable={false}
            style={{ maxWidth: "none", maxHeight: "none" }}
          />
        ) : isPdf ? (
          <div className="w-full h-full max-w-5xl max-h-[80vh] bg-white rounded-xl shadow-2xl overflow-hidden relative">
            <iframe
              src={file.url}
              className="w-full h-full border-0"
              title={file.originalName}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 text-white/80">
            <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center">
              <FileIcon size={44} className="text-white/40" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-white">
                {file.originalName}
              </p>
              <p className="text-sm text-white/50 mt-1">
                {formatFileSize(file.fileSize)}
              </p>
            </div>
            <a
              href={file.url}
              download={file.originalName}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer"
            >
              <Download size={16} />
              {isAr ? "تحميل الملف" : "Download File"}
            </a>
          </div>
        )}
      </div>

      {/* Bottom toolbar */}
      {(showZoom || isPdf) && (
        <div
          className="flex items-center justify-center gap-2 px-5 py-3 bg-black/40"
          onClick={(e) => e.stopPropagation()}
        >
          {showZoom && (
            <>
              <button
                onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                title={isAr ? "تصغير" : "Zoom out"}
              >
                <ZoomOut size={18} />
              </button>
              <span className="text-xs font-semibold text-white/60 min-w-[4ch] text-center tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(5, z + 0.25))}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                title={isAr ? "تكبير" : "Zoom in"}
              >
                <ZoomIn size={18} />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                title={isAr ? "إعادة تعيين" : "Reset"}
              >
                <RotateCcw size={16} />
              </button>
              <div className="w-px h-5 bg-white/20 mx-2" />
            </>
          )}
          <a
            href={file.url}
            download={file.originalName}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
            title={isAr ? "تحميل" : "Download"}
          >
            <Download size={18} />
          </a>
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
            title={isAr ? "فتح في نافذة جديدة" : "Open in new tab"}
          >
            <ExternalLink size={18} />
          </a>
        </div>
      )}
    </div>
  );
}
