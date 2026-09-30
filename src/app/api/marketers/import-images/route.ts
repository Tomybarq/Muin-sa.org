import crypto from "crypto";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { computeChecksum, compressImage } from "@/lib/attachment";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const referenceField = (formData.get("referenceField") as string) || "name";
    const locale = (formData.get("locale") as string) || "ar";
    const isAr = locale === "ar";

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, errors: [isAr ? "لا توجد صور" : "No images provided"] },
        { status: 400 }
      );
    }

    const results: { fileName: string; associationName: string | null; status: "matched" | "not_found" | "error"; error?: string }[] = [];
    let matched = 0;
    let notFound = 0;
    let errors = 0;

    for (const file of files) {
      try {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "").trim();
        if (!nameWithoutExt) {
          results.push({ fileName: file.name, associationName: null, status: "error", error: "Empty file name" });
          errors++;
          continue;
        }

        const where: any = {};
        if (referenceField === "email") {
          where.email = { equals: nameWithoutExt, mode: "insensitive" };
        } else if (referenceField === "phone") {
          where.phone = { contains: nameWithoutExt };
        } else if (referenceField === "identityNumber") {
          where.identityNumber = { contains: nameWithoutExt };
        } else if (referenceField === "commercialRegistration") {
          where.commercialRegistration = { contains: nameWithoutExt };
        } else {
          where.name = { equals: nameWithoutExt, mode: "insensitive" };
        }

        const marketer = await prisma.marketer.findFirst({ where, select: { id: true, name: true } });

        if (!marketer) {
          results.push({ fileName: file.name, associationName: null, status: "not_found" });
          notFound++;
          continue;
        }

        const buffer = Buffer.from(new Uint8Array(await file.arrayBuffer()));
        const mimetype = file.type || "application/octet-stream";
        const checksum = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}_${computeChecksum(buffer)}`;

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

        await prisma.$transaction(async (tx) => {
          const attachment = await tx.attachment.create({
            data: {
              name: file.name,
              originalName: file.name,
              mimetype,
              fileSize: storeData.length,
              width,
              height,
              checksum,
              data: storeData,
            },
          });

          await tx.marketer.update({
            where: { id: marketer.id },
            data: { imageId: attachment.id },
          });
        });

        results.push({ fileName: file.name, associationName: marketer.name, status: "matched" });
        matched++;
      } catch (err: any) {
        results.push({ fileName: file.name, associationName: null, status: "error", error: err.message });
        errors++;
      }
    }

    const summary = isAr
      ? `تمت معالجة ${files.length} صورة: ${matched} مطابقة، ${notFound} غير معروفة، ${errors} أخطاء`
      : `Processed ${files.length} images: ${matched} matched, ${notFound} not found, ${errors} errors`;

    return NextResponse.json({
      success: true,
      summary,
      results,
    });
  } catch (err: any) {
    console.error("Marketers import-images error:", err);
    return NextResponse.json({ success: false, errors: [err.message || "Server error"] }, { status: 500 });
  }
}
