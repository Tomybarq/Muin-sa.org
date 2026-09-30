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
    const referenceField = formData.get("referenceField") as string;
    const locale = formData.get("locale") as string;
    const isAr = locale === "ar";

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, errors: [isAr ? "لا توجد صور" : "No images provided"] },
        { status: 400 }
      );
    }

    if (!referenceField) {
      return NextResponse.json(
        { success: false, errors: [isAr ? "حقل المطابقة مطلوب" : "Reference field is required"] },
        { status: 400 }
      );
    }

    const allowedFields = ["name", "email", "phone", "manager", "managerUser.email"];
    if (!allowedFields.includes(referenceField)) {
      return NextResponse.json(
        { success: false, errors: [isAr ? "حقل مطابقة غير صالح" : "Invalid reference field"] },
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
        if (referenceField === "managerUser.email") {
          where.managerUser = { email: nameWithoutExt };
        } else {
          where[referenceField] = { equals: nameWithoutExt, mode: "insensitive" };
        }

        const association = await prisma.association.findFirst({ where, select: { id: true, name: true } });

        if (!association) {
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
              storage: "db",
              resModel: "association",
              resId: association.id,
              resField: "logo",
            },
          });

          await tx.association.update({
            where: { id: association.id },
            data: { logoId: attachment.id },
          });
        });

        results.push({ fileName: file.name, associationName: association.name, status: "matched" });
        matched++;
      } catch (err: any) {
        results.push({ fileName: file.name, associationName: null, status: "error", error: err.message });
        errors++;
      }
    }

    const summary: string[] = [];
    if (matched > 0) summary.push(isAr ? `تم تحديث ${matched}` : `${matched} updated`);
    if (notFound > 0) summary.push(isAr ? `غير معروف ${notFound}` : `${notFound} not found`);
    if (errors > 0) summary.push(isAr ? `أخطاء ${errors}` : `${errors} errors`);

    return NextResponse.json({
      success: errors === 0,
      results,
      summary: summary.join(", "),
      matched,
      notFound,
      errors,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, errors: [err.message || "Unknown error"] },
      { status: 500 }
    );
  }
}
