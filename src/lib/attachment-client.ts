export interface AttachmentInfo {
  id: number;
  name: string;
  originalName: string;
  mimetype: string;
  fileSize: number;
  width?: number | null;
  height?: number | null;
  url: string;
  thumbnailUrl?: string;
}

export function isImage(mimetype?: string | null): boolean {
  if (!mimetype || typeof mimetype !== "string") return false;
  return mimetype.startsWith("image/") && mimetype !== "image/svg+xml";
}

export function isVector(mimetype?: string | null): boolean {
  if (!mimetype || typeof mimetype !== "string") return false;
  return mimetype === "image/svg+xml";
}

export function isDocument(mimetype?: string | null): boolean {
  if (!mimetype || typeof mimetype !== "string") return false;
  return [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
  ].includes(mimetype);
}

export function compressImageClient(
  file: File,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas compression failed"));
        }, "image/jpeg", quality);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function getFileIcon(mimetype: string): string {
  if (isImage(mimetype)) return "image";
  if (isVector(mimetype)) return "vector";
  if (isDocument(mimetype)) return "document";
  return "file";
}
