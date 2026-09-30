import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.roleType !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const screens = await prisma.screen.findMany({
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ screens });
  } catch (error) {
    console.error("GET /api/screens error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
