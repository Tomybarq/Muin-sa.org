import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { decodeId } from "@/lib/idObfuscator";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params;
    const marketerId = decodeId(hash);

    if (!marketerId) {
      return NextResponse.json({ error: "Invalid hash" }, { status: 400 });
    }

    const marketer = await prisma.marketer.findUnique({
      where: { id: marketerId },
      select: {
        isActive: true,
        isArchived: true,
        image: true,
      },
    });

    if (!marketer || !marketer.isActive || marketer.isArchived || !marketer.image || !marketer.image.data) {
      return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
    }

    const attachment = marketer.image;
    const safeFilename = encodeURIComponent(attachment.originalName);

    return new NextResponse(attachment.data, {
      headers: {
        "Content-Type": attachment.mimetype,
        "Content-Disposition": `inline; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`,
        "Content-Length": String(attachment.fileSize),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err: any) {
    console.error("[PUBLIC AVATAR GET ERROR]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
