import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const templateId = parseInt(id, 10);
    if (isNaN(templateId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const template = await prisma.exportTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (template.userId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.exportTemplate.delete({ where: { id: templateId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
