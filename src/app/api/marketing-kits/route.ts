import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const includeArchived = searchParams.get("includeArchived") === "true";

  try {
    const where: any = {};
    if (!includeArchived) {
      where.isArchived = false;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { contentAr: { contains: search, mode: "insensitive" } },
        { contentEn: { contains: search, mode: "insensitive" } },
      ];
    }

    const marketingKits = await prisma.marketingKit.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(marketingKits);
  } catch (error) {
    console.error("GET /api/marketing-kits error:", error);
    return NextResponse.json({ error: "Failed to fetch marketing kits" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.title) {
      return NextResponse.json({ error: "عنوان الحقيبة التسويقية حقل إلزامي" }, { status: 400 });
    }

    const kit = await prisma.marketingKit.create({
      data: {
        title: body.title,
        contentAr: body.contentAr || "",
        contentEn: body.contentEn || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });

    return NextResponse.json(kit, { status: 201 });
  } catch (error) {
    console.error("POST /api/marketing-kits error:", error);
    return NextResponse.json({ error: "Failed to create marketing kit" }, { status: 500 });
  }
}
