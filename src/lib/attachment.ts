import sharp from "sharp";
import crypto from "crypto";
import { execFile } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";

export function computeChecksum(data: Buffer): string {
  const hash = crypto.createHash("sha1").update(data).digest("hex");
  return `${hash}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export async function compressImage(
  data: Buffer,
  _mimetype: string,
  options: CompressOptions = {}
): Promise<{ data: Uint8Array; width: number | null; height: number | null }> {
  try {
    const metadata = await sharp(data).metadata();
    const imgWidth = metadata.width || 0;
    const imgHeight = metadata.height || 0;

    const maxWidth = options.maxWidth || 1920;
    const maxHeight = options.maxHeight || 1920;
    const quality = options.quality ?? 80;

    if (imgWidth <= maxWidth && imgHeight <= maxHeight && quality >= 100) {
      return { data, width: imgWidth, height: imgHeight };
    }

    let img = sharp(data);
    let w = imgWidth;
    let h = imgHeight;

    if (w > maxWidth || h > maxHeight) {
      img = img.resize({
        width: maxWidth,
        height: maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      });
      w = Math.min(w, maxWidth);
      h = Math.min(h, maxHeight);
    }

    const ext = _mimetype.split("/")[1];
    let compressed: Buffer;
    if (ext === "jpeg" || ext === "jpg") {
      compressed = await img.jpeg({ quality }).toBuffer();
    } else if (ext === "png") {
      compressed = await img.png({ quality }).toBuffer();
    } else if (ext === "webp") {
      compressed = await img.webp({ quality }).toBuffer();
    } else {
      compressed = await img.toBuffer();
    }

    return { data: compressed, width: w, height: h };
  } catch (err) {
    console.error("compressImage error, storing original:", err);
    return { data, width: null, height: null };
  }
}

export async function compressPdf(data: Buffer): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "pdf-compress-"));
  const inputPath = path.join(tmpDir, "input.pdf");
  const outputPath = path.join(tmpDir, "output.pdf");

  try {
    await fs.writeFile(inputPath, data);
    await new Promise<void>((resolve, reject) => {
      execFile(
        "gs",
        [
          "-sDEVICE=pdfwrite",
          "-dCompatibilityLevel=1.4",
          "-dPDFSETTINGS=/ebook",
          "-dNOPAUSE",
          "-dQUIET",
          "-dBATCH",
          `-sOutputFile=${outputPath}`,
          inputPath,
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    const compressed = await fs.readFile(outputPath);
    return compressed.length < data.length ? compressed : data;
  } catch (err) {
    console.error("compressPdf error, storing original:", err);
    return data;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
