import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
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

  if (!attachment || !attachment.data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const safeFilename = encodeURIComponent(attachment.originalName);

  return new NextResponse(attachment.data, {
    headers: {
      "Content-Type": attachment.mimetype,
      "Content-Disposition": `inline; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`,
      "Content-Length": String(attachment.fileSize),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
