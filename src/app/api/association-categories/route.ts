import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.associationCategory.findMany({
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("GET /api/association-categories error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.roleType !== "superadmin" && session.roleType !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, nameAr } = await request.json();
    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const existing = await prisma.associationCategory.findUnique({
      where: { name: name.trim() },
    });
    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 400 });
    }

    const category = await prisma.associationCategory.create({
      data: {
        name: name.trim(),
        nameAr: nameAr ? nameAr.trim() : null,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("POST /api/association-categories error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
