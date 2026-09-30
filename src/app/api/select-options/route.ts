import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

function getClient(): PrismaClient {
  if (prisma.selectOption) {
    return prisma as PrismaClient;
  }
  return new PrismaClient();
}

// In-Memory Cache for Select Options (5 minutes TTL)
let cachedGroupedOptions: Record<string, { value: string; label: string; labelEn: string; sortOrder: number }[]> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function fetchAllGroupedSelectOptionsFromDb() {
  const now = Date.now();
  if (cachedGroupedOptions && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedGroupedOptions;
  }

  const db = getClient();
  const allOptions = await db.selectOption.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  const grouped: Record<string, { value: string; label: string; labelEn: string; sortOrder: number }[]> = {};
  for (const opt of allOptions) {
    if (!grouped[opt.category]) {
      grouped[opt.category] = [];
    }
    grouped[opt.category].push({
      value: opt.value,
      label: opt.label,
      labelEn: opt.labelEn,
      sortOrder: opt.sortOrder,
    });
  }

  cachedGroupedOptions = grouped;
  cacheTimestamp = Date.now();
  return grouped;
}

export function invalidateSelectOptionsServerCache() {
  cachedGroupedOptions = null;
  cacheTimestamp = 0;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const grouped = await fetchAllGroupedSelectOptionsFromDb();

    if (category) {
      const options = grouped[category.trim()] || [];
      return NextResponse.json(
        { category, options },
        { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
      );
    }

    return NextResponse.json(
      { options: grouped },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (err: any) {
    console.error("[SELECT OPTIONS GET ERROR]", err);
    return NextResponse.json({ error: err?.message || "Failed to fetch select options" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getClient();
    const body = await req.json();
    const { category, value, label, labelEn, sortOrder } = body;

    if (!category || !value || !label || !labelEn) {
      return NextResponse.json({ error: "Missing required fields: category, value, label, labelEn" }, { status: 400 });
    }

    const option = await db.selectOption.upsert({
      where: {
        category_value: {
          category: category.trim(),
          value: value.trim(),
        },
      },
      update: {
        label: label.trim(),
        labelEn: labelEn.trim(),
        sortOrder: sortOrder || 0,
        isActive: true,
      },
      create: {
        category: category.trim(),
        value: value.trim(),
        label: label.trim(),
        labelEn: labelEn.trim(),
        sortOrder: sortOrder || 0,
        isActive: true,
      },
    });

    invalidateSelectOptionsServerCache();

    return NextResponse.json({ option });
  } catch (err: any) {
    console.error("[SELECT OPTIONS POST ERROR]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
