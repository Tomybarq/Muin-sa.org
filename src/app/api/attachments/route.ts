import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { computeChecksum, compressImage, compressPdf } from "@/lib/attachment";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(new Uint8Array(await file.arrayBuffer()));
    const originalName = file.name;
    const mimetype = file.type || "application/octet-stream";
    const checksum = computeChecksum(buffer);

    const existing = await prisma.attachment.findUnique({ where: { checksum } });
    if (existing) {
      return NextResponse.json({
        id: existing.id,
        name: existing.name,
        originalName: existing.originalName,
        mimetype: existing.mimetype,
        fileSize: existing.fileSize,
        width: existing.width,
        height: existing.height,
        url: `/api/attachments/${existing.id}/file`,
      });
    }

    const MIN_SIZE = 100 * 1024; // skip compression for files < 100KB
    const isImage = mimetype.startsWith("image/") && mimetype !== "image/svg+xml";
    let storeData = buffer;
    let width: number | null = null;
    let height: number | null = null;

    if (buffer.length >= MIN_SIZE && isImage) {
      const compressed = await compressImage(buffer, mimetype, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 80,
      });
      storeData = Buffer.from(compressed.data);
      width = compressed.width;
      height = compressed.height;
    } else if (buffer.length >= MIN_SIZE && mimetype === "application/pdf") {
      storeData = Buffer.from(await compressPdf(buffer));
    }

    const resModel = (formData.get("resModel") as string) || null;
    const resId = formData.get("resId") ? Number(formData.get("resId")) : null;
    const resField = (formData.get("resField") as string) || null;

    const attachment = await prisma.attachment.create({
      data: {
        name: originalName,
        originalName,
        mimetype,
        fileSize: storeData.length,
        width,
        height,
        checksum,
        data: storeData,
        storage: "db",
        resModel,
        resId,
        resField,
      },
    });

    return NextResponse.json({
      id: attachment.id,
      name: attachment.name,
      originalName: attachment.originalName,
      mimetype: attachment.mimetype,
      fileSize: attachment.fileSize,
      width: attachment.width,
      height: attachment.height,
      url: `/api/attachments/${attachment.id}/file`,
    });
  } catch (err) {
    console.error("Upload error:", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const resModel = searchParams.get("resModel");
  const resId = searchParams.get("resId");
  const resField = searchParams.get("resField");

  const where: any = {};
  if (resModel) where.resModel = resModel;
  if (resId) where.resId = Number(resId);
  if (resField) where.resField = resField;

  const attachments = await prisma.attachment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      originalName: true,
      mimetype: true,
      fileSize: true,
      width: true,
      height: true,
      resModel: true,
      resId: true,
      resField: true,
      createdAt: true,
    },
  });

  const items = attachments.map((a) => ({
    ...a,
    url: `/api/attachments/${a.id}/file`,
  }));

  return NextResponse.json(items);
}
