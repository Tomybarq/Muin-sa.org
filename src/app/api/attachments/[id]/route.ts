import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({
    where: { id: Number(id) },
  });

  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const dataBase64 = attachment.data
    ? Buffer.from(attachment.data).toString("base64")
    : null;

  return NextResponse.json({
    id: attachment.id,
    name: attachment.name,
    originalName: attachment.originalName,
    mimetype: attachment.mimetype,
    fileSize: attachment.fileSize,
    width: attachment.width,
    height: attachment.height,
    checksum: attachment.checksum,
    resModel: attachment.resModel,
    resId: attachment.resId,
    resField: attachment.resField,
    createdAt: attachment.createdAt,
    data: dataBase64 ? `data:${attachment.mimetype};base64,${dataBase64}` : null,
    url: `/api/attachments/${attachment.id}/file`,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({
    where: { id: Number(id) },
  });

  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.attachment.delete({ where: { id: Number(id) } });

  return NextResponse.json({ success: true });
}
