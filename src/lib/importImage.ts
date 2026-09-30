import crypto from "crypto";
import prisma from "@/lib/prisma";
import { computeChecksum, compressImage } from "@/lib/attachment";

export async function importImage(
  urlOrBase64: string,
  resModel: string,
  resId?: number
): Promise<number | null> {
  if (!urlOrBase64 || typeof urlOrBase64 !== "string") return null;

  try {
    let buffer: Buffer;
    let mimetype = "application/octet-stream";
    let originalName = "imported_image";

    // 1. Handle base64
    if (urlOrBase64.startsWith("data:image/")) {
      const match = urlOrBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) return null;
      mimetype = match[1];
      buffer = Buffer.from(match[2], "base64");
      originalName = `imported_${Date.now()}.${mimetype.split("/")[1] || "png"}`;
    }
    // 2. Handle local URLs /api/attachments/{id}/file
    else if (urlOrBase64.includes("/api/attachments/") && urlOrBase64.includes("/file")) {
      const parts = urlOrBase64.split("/attachments/");
      if (parts.length < 2) return null;
      const idStr = parts[1].split("/")[0];
      const attachmentId = Number(idStr);
      if (isNaN(attachmentId)) return null;

      const existingAtt = await prisma.attachment.findUnique({
        where: { id: attachmentId },
      });
      if (!existingAtt || !existingAtt.data) return null;

      buffer = Buffer.from(existingAtt.data as any);
      mimetype = existingAtt.mimetype;
      originalName = existingAtt.originalName || existingAtt.name;
    }
    // 3. Handle external HTTP/HTTPS URLs
    else if (urlOrBase64.startsWith("http://") || urlOrBase64.startsWith("https://") || urlOrBase64.startsWith("/")) {
      let absoluteUrl = urlOrBase64;
      if (urlOrBase64.startsWith("/")) {
        // If it is a relative path, assume it is on the same host (but not an attachment endpoint)
        // Wait! If it's a relative path on local host, we need to construct the absolute URL.
        // We will default to localhost if not available, or get from request.
        // Let's check:
        const host = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        absoluteUrl = `${host}${urlOrBase64}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      try {
        const res = await fetch(absoluteUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) {
          console.error(`[importImage] Failed to fetch image: ${absoluteUrl}, HTTP ${res.status}`);
          return null;
        }

        // Limit size to 10MB
        const contentLength = res.headers.get("content-length");
        if (contentLength && Number(contentLength) > 10 * 1024 * 1024) {
          console.error(`[importImage] Image size exceeds 10MB limit: ${absoluteUrl}`);
          return null;
        }

        const arrayBuffer = await res.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);

        if (buffer.length > 10 * 1024 * 1024) {
          console.error(`[importImage] Image size exceeds 10MB limit: ${absoluteUrl}`);
          return null;
        }

        mimetype = res.headers.get("content-type") || "image/png";
        const urlPathname = new URL(absoluteUrl).pathname;
        originalName = urlPathname.split("/").pop() || `imported_${Date.now()}`;
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        console.error(`[importImage] Fetch error for URL ${absoluteUrl}:`, fetchErr);
        return null;
      }
    } else {
      return null;
    }

    // 4. Preprocess/compress the image
    const isImage = mimetype.startsWith("image/") && mimetype !== "image/svg+xml";
    let storeData = buffer;
    let width: number | null = null;
    let height: number | null = null;

    if (isImage) {
      const compressed = await compressImage(buffer, mimetype, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 80,
      });
      storeData = Buffer.from(compressed.data);
      width = compressed.width;
      height = compressed.height;
    }

    // Prefixed checksum to avoid unique constraint violations
    const checksum = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}_${computeChecksum(storeData)}`;

    const attachment = await prisma.attachment.create({
      data: {
        name: originalName,
        originalName,
        mimetype,
        fileSize: storeData.length,
        width,
        height,
        checksum,
        data: storeData as any,
        storage: "db",
        resModel,
        resId,
        resField: resModel === "association" ? "logo" : "photo",
      },
    });

    return attachment.id;
  } catch (err) {
    console.error("[importImage] Error during import:", err);
    return null;
  }
}
