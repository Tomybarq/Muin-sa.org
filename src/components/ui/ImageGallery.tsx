"use client";

import { useCallback, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { compressImageClient, isImage } from "@/lib/attachment-client";
import AttachmentPreview from "@/components/ui/AttachmentPreview";

export interface GalleryAttachmentData {
  id: number;
  url: string;
  name: string;
  originalName: string;
  mimetype: string;
  fileSize: number;
  width?: number | null;
  height?: number | null;
}

export interface GalleryImage {
  id?: number;
  attachmentId: number;
  attachment: GalleryAttachmentData | null;
  photoType: string;
  sortOrder: number;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  onAdd: (attachment: GalleryAttachmentData) => void;
  onRemove: (index: number) => void;
  onReorder?: (images: GalleryImage[]) => void;
  readonly?: boolean;
  locale?: string;
  label: string;
  maxSize?: number;
}

export default function ImageGallery({
  images,
  onAdd,
  onRemove,
  readonly = false,
  locale,
  label,
  maxSize = 50,
}: ImageGalleryProps) {
  const isAr = locale === "ar";
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const handlePick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";

      if (file.size > maxSize * 1024 * 1024) {
        setError(
          isAr
            ? `حجم الملف يتجاوز ${maxSize} ميجابايت`
            : `File size exceeds ${maxSize} MB`
        );
        return;
      }

      if (!isImage(file.type)) {
        setError(
          isAr
            ? "يرجى رفع صورة فقط (JPG, PNG, SVG, WEBP)"
            : "Please upload an image only (JPG, PNG, SVG, WEBP)"
        );
        return;
      }

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
        const uploaded: GalleryAttachmentData = await res.json();
        onAdd(uploaded);
      } catch (err: any) {
        setError(err.message || (isAr ? "فشل الرفع" : "Upload failed"));
      } finally {
        setUploading(false);
      }
    },
    [maxSize, onAdd, isAr]
  );

  const urls = images.map((img) => img.attachment?.url ?? null);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <div className="flex flex-wrap gap-3">
        {images.map((img, idx) => (
          <div
            key={img.attachmentId}
            className="relative group w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 cursor-pointer shrink-0 ring-0 transition-all hover:ring-2 hover:ring-primary/60 dark:hover:ring-tertiary/60"
            onClick={() => setLightboxIdx(idx)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setLightboxIdx(idx);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={img.attachment?.originalName || `Photo ${idx + 1}`}
          >
            {img.attachment?.url ? (
              <img
                src={img.attachment.url}
                alt={img.attachment.originalName || `Photo ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <Loader2 size={20} className="animate-spin" />
              </div>
            )}

            {readonly ? (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-all flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white opacity-0 group-hover:opacity-100 transition-opacity"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
            ) : (
              <div className="absolute inset-0 bg-black/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-between p-1 gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIdx(idx);
                  }}
                  className="p-1.5 bg-white/90 hover:bg-white rounded-lg transition-all cursor-pointer"
                  title={isAr ? "عرض" : "View"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(idx);
                  }}
                  className="p-1.5 bg-white/90 hover:bg-white rounded-lg transition-all cursor-pointer"
                  title={isAr ? "حذف" : "Delete"}
                >
                  <X size={12} className="text-rose-700" />
                </button>
              </div>
            )}
          </div>
        ))}

        {!readonly && (
          <button
            type="button"
            onClick={handlePick}
            disabled={uploading}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/30 hover:border-primary dark:hover:border-tertiary hover:bg-primary/5 dark:hover:bg-tertiary/5 transition-all shrink-0 text-slate-400 hover:text-primary dark:hover:text-tertiary disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <>
                <span className="text-3xl leading-none font-light">+</span>
                <span className="text-[13px]">{isAr ? "إضافة" : "Add"}</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {lightboxIdx !== null && urls[lightboxIdx] && (
        <>
          <AttachmentPreview
            isOpen={true}
            onClose={() => setLightboxIdx(null)}
            file={images[lightboxIdx].attachment}
            isAr={isAr}
          />

          {lightboxIdx > 0 && (
            <button
              type="button"
              onClick={() => setLightboxIdx(lightboxIdx - 1)}
              className="fixed left-4 top-1/2 -translate-y-1/2 z-[70] w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              aria-label={isAr ? "السابق" : "Previous"}
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {lightboxIdx < urls.length - 1 && (
            <button
              type="button"
              onClick={() => setLightboxIdx(lightboxIdx + 1)}
              className="fixed right-4 top-1/2 -translate-y-1/2 z-[70] w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              aria-label={isAr ? "التالي" : "Next"}
            >
              <ChevronRight size={24} />
            </button>
          )}

          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] text-white/70 text-sm bg-black/40 px-3 py-1 rounded-full">
            {lightboxIdx + 1} / {urls.length}
          </div>
        </>
      )}
    </div>
  );
}
