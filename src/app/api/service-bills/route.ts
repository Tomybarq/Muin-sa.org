import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bills = await prisma.serviceBill.findMany({ orderBy: { id: "asc" } });
  const options = bills.map((b) => ({
    value: b.id.toString(),
    label: b.nameAr,
    labelEn: b.nameEn,
  }));

  return NextResponse.json(options);
}
