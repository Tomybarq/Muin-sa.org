import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

let cachedSettingsResponse: any = null;
let settingsCacheTimestamp = 0;
const SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function invalidateSystemSettingsCache() {
  cachedSettingsResponse = null;
  settingsCacheTimestamp = 0;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = Date.now();
    if (cachedSettingsResponse && now - settingsCacheTimestamp < SETTINGS_CACHE_TTL_MS) {
      return NextResponse.json(cachedSettingsResponse, {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" }
      });
    }

    const setting = await prisma.platformSetting.findFirst({
      include: { logo: true },
    });

    if (!setting) {
      const defaultResp = {
        settings: {
          siteName: "Moeen Platform",
          siteNameAr: "منصة معين",
          logoUrl: "/logo.png",
          fontFamily: "Cairo",
          primaryColor: "#0A5C4A",
          secondaryColor: "#F9A826",
          tertiaryColor: "#2FAB99",
          logo: null,
          logoId: null,
        },
      };
      cachedSettingsResponse = defaultResp;
      settingsCacheTimestamp = Date.now();
      return NextResponse.json(defaultResp);
    }

    const logoUrl = setting.logo
      ? `/api/attachments/${setting.logo.id}/file`
      : "/logo.png";

    const responseData = {
      settings: {
        siteName: setting.siteName,
        siteNameAr: setting.siteNameAr,
        fontFamily: setting.fontFamily,
        primaryColor: setting.primaryColor,
        secondaryColor: setting.secondaryColor,
        tertiaryColor: setting.tertiaryColor,
        logoId: setting.logoId,
        logo: setting.logo
          ? {
              id: setting.logo.id,
              name: setting.logo.name,
              originalName: setting.logo.originalName,
              mimetype: setting.logo.mimetype,
              fileSize: setting.logo.fileSize,
              width: setting.logo.width,
              height: setting.logo.height,
              url: logoUrl,
            }
          : null,
        logoUrl,
      },
    };

    cachedSettingsResponse = responseData;
    settingsCacheTimestamp = Date.now();

    return NextResponse.json(responseData, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" }
    });
  } catch (error) {
    console.error("GET /api/settings/system error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.roleType !== "superadmin" && session.roleType !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const existing = await prisma.platformSetting.findFirst();

    const updateData = {
      siteName: body.siteName !== undefined ? String(body.siteName) : undefined,
      siteNameAr: body.siteNameAr !== undefined ? String(body.siteNameAr) : undefined,
      fontFamily: body.fontFamily !== undefined ? String(body.fontFamily) : undefined,
      primaryColor: body.primaryColor !== undefined ? String(body.primaryColor) : undefined,
      secondaryColor: body.secondaryColor !== undefined ? String(body.secondaryColor) : undefined,
      tertiaryColor: body.tertiaryColor !== undefined ? String(body.tertiaryColor) : undefined,
      logoId: body.logoId !== undefined ? (body.logoId ? Number(body.logoId) : null) : undefined,
    };

    if (existing) {
      await prisma.platformSetting.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      await prisma.platformSetting.create({
        data: {
          siteName: updateData.siteName ?? "Moeen Platform",
          siteNameAr: updateData.siteNameAr ?? "منصة معين",
          fontFamily: updateData.fontFamily ?? "Cairo",
          primaryColor: updateData.primaryColor ?? "#0A5C4A",
          secondaryColor: updateData.secondaryColor ?? "#F9A826",
          tertiaryColor: updateData.tertiaryColor ?? "#2FAB99",
          logoId: updateData.logoId ?? null,
        },
      });
    }

    invalidateSystemSettingsCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/settings/system error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
