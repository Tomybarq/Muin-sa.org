import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [associationsCount, beneficiariesCount, governoratesCount, categoriesCount] =
      await Promise.all([
        prisma.association.count({
          where: { isActive: true, isArchived: false },
        }),
        prisma.beneficiary.count({
          where: { isActive: true, isArchived: false },
        }),
        prisma.governorate.count({
          where: {
            associations: {
              some: { isActive: true, isArchived: false },
            },
          },
        }),
        prisma.associationCategory.count(),
      ]);

    // Optional platform settings for branding
    let branding = null;
    try {
      if (prisma.platformSetting) {
        branding = await prisma.platformSetting.findFirst();
      }
    } catch {
      // Ignore if table does not exist
    }

    // Categories distribution with real beneficiary counts
    let categoriesDistribution: Array<{
      nameAr: string;
      nameEn: string;
      count: number;
      pct: number;
      color: string;
    }> | null = null;

    try {
      const palette = ["#2FAB99", "#0A5C4A", "#F9A826", "#3B82F6", "#8B5CF6", "#EC4899"];
      const rawCategories = await prisma.associationCategory.findMany({
        include: {
          associations: {
            where: { isActive: true, isArchived: false },
            select: {
              id: true,
              _count: {
                select: {
                  beneficiaries: { where: { isActive: true, isArchived: false } },
                },
              },
            },
          },
        },
      });

      const catAgg = rawCategories
        .map((c, idx) => {
          const totalB = c.associations.reduce((sum, a) => sum + a._count.beneficiaries, 0);
          return {
            nameAr: c.nameAr || c.name,
            nameEn: c.name,
            count: totalB,
            color: palette[idx % palette.length],
          };
        })
        .filter((c) => c.count > 0);

      const totalCatBeneficiaries = catAgg.reduce((sum, c) => sum + c.count, 0);
      if (catAgg.length > 0 && totalCatBeneficiaries > 0) {
        categoriesDistribution = catAgg.map((c) => ({
          ...c,
          pct: Math.round((c.count / totalCatBeneficiaries) * 100),
        }));
      }
    } catch (err) {
      console.error("Failed to compute categories distribution:", err);
    }

    // Top Governorates with real counts
    let topGovernorates: Array<{
      nameAr: string;
      nameEn: string;
      count: number;
      pct: number;
    }> | null = null;

    try {
      const rawGovs = await prisma.governorate.findMany({
        include: {
          associations: {
            where: { isActive: true, isArchived: false },
            select: {
              id: true,
              _count: {
                select: {
                  beneficiaries: { where: { isActive: true, isArchived: false } },
                },
              },
            },
          },
        },
      });

      const govAgg = rawGovs
        .map((g) => {
          const totalB = g.associations.reduce((sum, a) => sum + a._count.beneficiaries, 0);
          return {
            nameAr: g.nameAr || g.name,
            nameEn: g.name,
            count: totalB,
          };
        })
        .filter((g) => g.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      if (govAgg.length > 0) {
        const maxGovCount = Math.max(...govAgg.map((g) => g.count), 1);
        topGovernorates = govAgg.map((g) => ({
          ...g,
          pct: Math.max(15, Math.round((g.count / maxGovCount) * 100)),
        }));
      }
    } catch (err) {
      console.error("Failed to compute top governorates:", err);
    }

    // Recent Live Activities from AuditLog
    let recentActivities: Array<{
      actionAr: string;
      actionEn: string;
      orgAr: string;
      orgEn: string;
      timeAr: string;
      timeEn: string;
      type: "create" | "grant" | "report" | "auth";
    }> | null = null;

    try {
      const recentLogs = await prisma.auditLog.findMany({
        where: {
          action: { in: ["CREATE", "UPDATE", "LOGIN", "EXPORT", "IMPORT"] },
          screen: { in: ["beneficiaries", "associations", "marketers", "users", "reports"] },
        },
        take: 4,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            include: { association: true },
          },
        },
      });

      if (recentLogs.length >= 2) {
        const now = new Date();
        recentActivities = recentLogs.map((log) => {
          const diffMs = Math.max(0, now.getTime() - new Date(log.createdAt).getTime());
          const diffMin = Math.floor(diffMs / (1000 * 60));
          const diffHours = Math.floor(diffMin / 60);
          const diffDays = Math.floor(diffHours / 24);

          let timeAr = "الآن";
          let timeEn = "Just now";
          if (diffMin > 0 && diffMin < 60) {
            timeAr = `منذ ${diffMin} دقيقة`;
            timeEn = `${diffMin}m ago`;
          } else if (diffHours >= 1 && diffHours < 24) {
            timeAr = `منذ ${diffHours} ساعة`;
            timeEn = `${diffHours}h ago`;
          } else if (diffDays >= 1) {
            timeAr = `منذ ${diffDays} يوم`;
            timeEn = `${diffDays}d ago`;
          }

          let actionAr = "عملية موثقة في النظام";
          let actionEn = "Verified platform action";
          let type: "create" | "grant" | "report" | "auth" = "create";

          if (log.screen === "beneficiaries") {
            actionAr = "تسجيل واعتماد مستفيد جديد";
            actionEn = "Beneficiary record verified";
            type = "create";
          } else if (log.screen === "associations") {
            actionAr = "اعتماد بيانات جمعية أهلية";
            actionEn = "Charity organization verified";
            type = "grant";
          } else if (log.screen === "reports") {
            actionAr = "تحديث التقارير والإحصائيات";
            actionEn = "Statistical reports updated";
            type = "report";
          } else if (log.screen === "users" || log.screen === "marketers") {
            actionAr = "تحديث صلاحيات وتراخيص الحسابات";
            actionEn = "Account governance updated";
            type = "auth";
          }

          const orgName = log.user?.association?.name || "منصة معين المركزية";

          return {
            actionAr,
            actionEn,
            orgAr: orgName,
            orgEn: log.user?.association?.name || "Moeen Platform Hub",
            timeAr,
            timeEn,
            type,
          };
        });
      }
    } catch (err) {
      console.error("Failed to load recent activities:", err);
    }

    // Monthly Trend (if at least 3 months of historical data exist)
    let trend: Array<{
      labelAr: string;
      labelEn: string;
      value: number;
      count: string;
    }> | null = null;

    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);

      const rawMonthly = await prisma.$queryRaw<Array<{ month_str: string; cnt: number }>>`
        SELECT 
          to_char("createdAt", 'YYYY-MM') as month_str,
          count(*)::int as cnt
        FROM "Beneficiary"
        WHERE "createdAt" >= ${sixMonthsAgo}
          AND "isActive" = true 
          AND "isArchived" = false
        GROUP BY month_str
        ORDER BY month_str ASC;
      `;

      if (rawMonthly && rawMonthly.length >= 3) {
        const maxVal = Math.max(...rawMonthly.map((m) => m.cnt), 1);
        const arMonthNames: Record<string, string> = {
          "01": "يناير",
          "02": "فبراير",
          "03": "مارس",
          "04": "أبريل",
          "05": "مايو",
          "06": "يونيو",
          "07": "يوليو",
          "08": "أغسطس",
          "09": "سبتمبر",
          "10": "أكتوبر",
          "11": "نوفمبر",
          "12": "ديسمبر",
        };
        const enMonthNames: Record<string, string> = {
          "01": "Jan",
          "02": "Feb",
          "03": "Mar",
          "04": "Apr",
          "05": "May",
          "06": "Jun",
          "07": "Jul",
          "08": "Aug",
          "09": "Sep",
          "10": "Oct",
          "11": "Nov",
          "12": "Dec",
        };

        trend = rawMonthly.map((item) => {
          const mPart = item.month_str.split("-")[1] || "01";
          return {
            labelAr: arMonthNames[mPart] || item.month_str,
            labelEn: enMonthNames[mPart] || item.month_str,
            value: Math.max(10, Math.round((item.cnt / maxVal) * 100)),
            count: item.cnt.toLocaleString("en-US"),
          };
        });
      }
    } catch (err) {
      console.error("Failed to compute monthly trend:", err);
    }

    return NextResponse.json({
      associationsCount,
      beneficiariesCount,
      governoratesCount,
      categoriesCount,
      branding: branding
        ? {
            siteNameAr: branding.siteNameAr,
            siteNameEn: branding.siteName,
            primaryColor: branding.primaryColor,
            accentColor: branding.tertiaryColor || branding.secondaryColor,
            fontFamily: branding.fontFamily,
          }
        : null,
      categoriesDistribution,
      topGovernorates,
      recentActivities,
      trend,
    });
  } catch (error: any) {
    console.error("Error in GET /api/public/stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
