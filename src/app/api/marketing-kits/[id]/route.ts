import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const kitId = Number(id);

  try {
    const kit = await prisma.marketingKit.findUnique({
      where: { id: kitId },
    });

    if (!kit) {
      return NextResponse.json({ error: "الحقيبة التسويقية غير موجودة" }, { status: 404 });
    }

    return NextResponse.json(kit);
  } catch (error) {
    console.error(`GET /api/marketing-kits/${id} error:`, error);
    return NextResponse.json({ error: "Failed to fetch marketing kit" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const kitId = Number(id);

  try {
    const body = await request.json();
    const kit = await prisma.marketingKit.update({
      where: { id: kitId },
      data: {
        title: body.title,
        contentAr: body.contentAr || "",
        contentEn: body.contentEn || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });

    return NextResponse.json(kit);
  } catch (error) {
    console.error(`PUT /api/marketing-kits/${id} error:`, error);
    return NextResponse.json({ error: "Failed to update marketing kit" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const kitId = Number(id);

  try {
    await prisma.marketingKit.delete({
      where: { id: kitId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/marketing-kits/${id} error:`, error);
    return NextResponse.json({ error: "Failed to delete marketing kit" }, { status: 500 });
  }
}
