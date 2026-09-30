import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
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
    const isArchived = body.isArchived !== undefined ? Boolean(body.isArchived) : true;

    const kit = await prisma.marketingKit.update({
      where: { id: kitId },
      data: { isArchived },
    });

    return NextResponse.json(kit);
  } catch (error) {
    console.error(`PATCH /api/marketing-kits/${id}/archive error:`, error);
    return NextResponse.json({ error: "Failed to archive marketing kit" }, { status: 500 });
  }
}
