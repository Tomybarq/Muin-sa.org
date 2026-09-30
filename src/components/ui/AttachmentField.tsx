"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  Download,
  Eye,
  FileIcon,
  ImageIcon,
  Film,
  FileText,
  Pencil,
} from "lucide-react";
import AttachmentPreview from "./AttachmentPreview";
import { formatFileSize, isImage, isVector, isDocument, compressImageClient } from "@/lib/attachment-client";

interface AttachmentData {
  id: number;
  url: string;
  name: string;
  originalName: string;
  mimetype: string;
  fileSize: number;
  width?: number | null;
  height?: number | null;
}

interface AttachmentFieldProps {
  value?: AttachmentData | string | number | null;
  onChange?: (file: AttachmentData | null) => void;
  accept?: string;
  multiple?: boolean;
  readonly?: boolean;
  maxSize?: number;
  locale?: string;
  className?: string;
  label?: string;
  placeholder?: string;
  imageOnly?: boolean;
}

const MIME_TYPES: Record<string, string> = {
  image: "image/*",
  document: ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt",
  vector: "image/svg+xml",
  all: "*/*",
};

export default function AttachmentField({
  value,
  onChange,
  accept,
  multiple: _multiple,
  readonly,
  maxSize = 50,
  locale,
  className = "",
  label,
  placeholder,
  imageOnly,
}: AttachmentFieldProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<AttachmentData | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAr = locale === "ar";

  const resolvedAccept = accept
    ? accept
    : MIME_TYPES[accept || ""] || "image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt";

  const attachment: AttachmentData | null =
    typeof value === "object" && value !== null && "url" in value
      ? (value as AttachmentData)
      : null;

  const handleUpload = useCallback(
    async (file: File) => {
      if (file.size > maxSize * 1024 * 1024) {
        setError(
          isAr
            ? `حجم الملف يتجاوز ${maxSize} ميجابايت`
            : `File size exceeds ${maxSize} MB`
        );
        return;
      }

      if (imageOnly && !isImage(file.type)) {
        setError(
          isAr
            ? "يرجى رفع صورة فقط (JPG, PNG, SVG, WEBP)"
            : "Please upload an image only (JPG, PNG, SVG, WEBP)"
        );
        return;
      }

      setError(null);
      setUploading(true);

      try {
        let uploadFile: File = file;
        if (isImage(file.type)) {
          try {
            const compressed = await compressImageClient(file);
            const baseName = file.name.replace(/\.[^.]+$/, "");
            uploadFile = new File([compressed], `${baseName}.jpg`, { type: "image/jpeg" });
          } catch {
            // fallback to original on compression failure
          }
        }

        const formData = new FormData();
        formData.append("file", uploadFile);

        const res = await fetch("/api/attachments", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const uploaded: AttachmentData = await res.json();
        onChange?.(uploaded);
      } catch (err: any) {
        setError(err.message || (isAr ? "فشل الرفع" : "Upload failed"));
      } finally {
        setUploading(false);
      }
    },
    [maxSize, onChange, isAr]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleUpload]
  );

  const handleRemove = () => {
    onChange?.(null);
    setError(null);
  };

  const openPreview = (file: AttachmentData) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  const fileIcon = (mimetype: string) => {
    if (isImage(mimetype) || isVector(mimetype)) return <ImageIcon size={18} />;
    if (mimetype.startsWith("video")) return <Film size={18} />;
    if (isDocument(mimetype)) return <FileText size={18} />;
    return <FileIcon size={18} />;
  };

  return (
    <>
      <div className={`space-y-2 ${className}`}>
        {label && !imageOnly && (
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}

          <input
            ref={inputRef}
            type="file"
            accept={resolvedAccept}
            onChange={handleFileSelect}
            className="hidden"
          />

        {attachment && imageOnly ? (
          /* Image-only display */
          readonly ? (
            <button
              onClick={() => openPreview(attachment)}
              className="relative block group cursor-pointer"
            >
              <img
                src={attachment.url}
                alt={attachment.originalName}
                className="w-20 h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-all flex items-center justify-center">
                <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ) : (
            <div className="relative group inline-block">
              <img
                src={attachment.url}
                alt={attachment.originalName}
                className="w-20 h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
              />
              <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-between p-1 gap-2">
                <button
                  onClick={() => inputRef.current?.click()}
                  className="p-1.5 bg-white/90 hover:bg-white rounded-lg transition-all cursor-pointer"
                  title={isAr ? "تعديل" : "Replace"}
                >
                  <Pencil size={12} className="text-slate-700" />
                </button>
                <button
                  onClick={handleRemove}
                  className="p-1.5 bg-white/90 hover:bg-white rounded-lg transition-all cursor-pointer"
                  title={isAr ? "حذف" : "Remove"}
                >
                  <X size={12} className="text-rose-700" />
                </button>
              </div>
            </div>
          )
        ) : !attachment && imageOnly ? (
          /* Image-only upload zone */
          readonly ? (
            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/30">
              <ImageIcon size={24} className="text-slate-300 dark:text-slate-600" />
            </div>
          ) : (
            <div
              onClick={() => inputRef.current?.click()}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/30 hover:border-primary dark:hover:border-tertiary hover:bg-primary/5 dark:hover:bg-tertiary/5 transition-all cursor-pointer group"
            >
              <Upload size={20} className="text-slate-400 group-hover:text-primary dark:group-hover:text-tertiary transition-colors" />
            </div>
          )
        ) : attachment && readonly ? (
          /* Read-only display */
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
            {isImage(attachment.mimetype) || isVector(attachment.mimetype) ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={attachment.url}
                alt={attachment.originalName}
                className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                {fileIcon(attachment.mimetype)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {attachment.originalName}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {formatFileSize(attachment.fileSize)}
              </p>
            </div>
            <button
              onClick={() => openPreview(attachment)}
              className="p-2 text-slate-500 hover:text-primary dark:hover:text-tertiary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              title={isAr ? "استعراض" : "Preview"}
            >
              <Eye size={16} />
            </button>
            <a
              href={attachment.url}
              download={attachment.originalName}
              className="p-2 text-slate-500 hover:text-primary dark:hover:text-tertiary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              title={isAr ? "تحميل" : "Download"}
            >
              <Download size={16} />
            </a>
          </div>
        ) : attachment && !readonly ? (
          /* Editable with file selected */
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl group">
            {isImage(attachment.mimetype) || isVector(attachment.mimetype) ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={attachment.url}
                alt={attachment.originalName}
                className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                {fileIcon(attachment.mimetype)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {attachment.originalName}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {formatFileSize(attachment.fileSize)}
              </p>
            </div>
            <button
              onClick={() => openPreview(attachment)}
              className="p-2 text-slate-500 hover:text-primary dark:hover:text-tertiary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100"
              title={isAr ? "استعراض" : "Preview"}
            >
              <Eye size={16} />
            </button>
            <a
              href={attachment.url}
              download={attachment.originalName}
              className="p-2 text-slate-500 hover:text-primary dark:hover:text-tertiary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100"
              title={isAr ? "تحميل" : "Download"}
            >
              <Download size={16} />
            </a>
            <button
              onClick={() => inputRef.current?.click()}
              className="p-2 text-slate-500 hover:text-primary dark:hover:text-tertiary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              title={isAr ? "تعديل" : "Replace"}
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={handleRemove}
              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all cursor-pointer"
              title={isAr ? "حذف" : "Remove"}
            >
              <X size={16} />
            </button>
          </div>
        ) : readonly ? (
          /* Read-only with no file */
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <FileIcon size={18} />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isAr ? "لا يوجد ملف" : "No file"}
            </p>
          </div>
        ) : (
          /* Upload zone */
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
              dragOver
                ? "border-primary dark:border-tertiary bg-primary/5 dark:bg-tertiary/5"
                : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30"
            } ${uploading ? "pointer-events-none opacity-60" : ""}`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isAr ? "جاري الرفع..." : "Uploading..."}
                </span>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <Upload size={20} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {placeholder || (isAr ? "اختر ملفاً أو اسحبه هنا" : "Drop a file or click to browse")}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr
                      ? `الحد الأقصى ${maxSize} ميجابايت`
                      : `Max ${maxSize} MB`}
                    {accept === "image" || !accept
                      ? isAr
                        ? " · الصيغ المدعومة: JPG, PNG, SVG, WEBP"
                        : " · Supported: JPG, PNG, SVG, WEBP"
                      : ""}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {error && (
          <p className="text-[11px] text-rose-500 font-medium">{error}</p>
        )}
      </div>

      <AttachmentPreview
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        file={previewFile}
        isAr={isAr}
      />
    </>
  );
}
