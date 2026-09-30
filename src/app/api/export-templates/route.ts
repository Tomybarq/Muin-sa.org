import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const screen = searchParams.get("screen");
    if (!screen) return NextResponse.json({ error: "screen query param required" }, { status: 400 });

    const templates = await prisma.exportTemplate.findMany({
      where: { screen, userId: session.userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, fields: true },
    });

    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, screen, fields } = body;

    if (!name || !screen || !fields) {
      return NextResponse.json({ error: "name, screen, and fields are required" }, { status: 400 });
    }

    const template = await prisma.exportTemplate.create({
      data: {
        name,
        screen,
        userId: session.userId,
        fields: JSON.stringify(fields),
      },
    });

    return NextResponse.json({ id: template.id, name: template.name, fields: template.fields }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Template name already exists for this screen" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
