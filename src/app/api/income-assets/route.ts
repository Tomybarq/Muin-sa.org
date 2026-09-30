import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const assets = await prisma.incomeAsset.findMany({ orderBy: { id: "asc" } });
  const options = assets.map((a) => ({
    value: a.id.toString(),
    label: a.nameAr,
    labelEn: a.nameEn,
  }));

  return NextResponse.json(options);
}
