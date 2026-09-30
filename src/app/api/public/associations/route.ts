import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const associations = await prisma.association.findMany({
      where: {
        isActive: true,
        isArchived: false,
        logoId: { not: null },
      },
      select: {
        id: true,
        name: true,
        logoId: true,
        category: {
          select: {
            nameAr: true,
            name: true,
          },
        },
        city: {
          select: {
            nameAr: true,
            name: true,
          },
        },
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    const formatted = associations.map((assoc) => ({
      id: assoc.id,
      name: assoc.name,
      category: assoc.category?.nameAr || assoc.category?.name || "",
      city: assoc.city?.nameAr || assoc.city?.name || "",
      logoUrl: assoc.logoId ? `/api/attachments/${assoc.logoId}/file` : null,
    }));

    return NextResponse.json({ associations: formatted });
  } catch (error: any) {
    console.error("Error in GET /api/public/associations:", error);
    return NextResponse.json(
      { error: "Failed to fetch public associations" },
      { status: 500 }
    );
  }
}
