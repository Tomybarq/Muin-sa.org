import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getUserDataScope } from "@/lib/dataScoping";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const scope = await getUserDataScope(session.userId);

    const { searchParams } = new URL(request.url);
    const associationId = searchParams.get("associationId");
    const timeRange = searchParams.get("timeRange"); // "month", "year", "all"
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Date filtering condition
    let dateFilter: any = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
    } else if (timeRange === "today") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      dateFilter = { gte: startOfToday };
    } else if (timeRange === "week") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      dateFilter = { gte: sevenDaysAgo };
    } else if (timeRange === "month") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      dateFilter = { gte: startOfMonth };
    } else if (timeRange === "year") {
      const startOfYear = new Date(new Date().getFullYear(), 0, 1);
      dateFilter = { gte: startOfYear };
    }

    // Association & Beneficiary filter conditions with scope
    const assocWhere = {
      ...scope.assocWhere,
      ...(associationId ? { id: Number(associationId) } : {}),
    };

    const beneficiaryWhere: any = {
      ...scope.beneficiaryWhere,
      ...(associationId ? { associationId: Number(associationId) } : {}),
    };

    if ((startDate || endDate || (timeRange && timeRange !== "all")) && Object.keys(dateFilter).length > 0) {
      beneficiaryWhere.createdAt = dateFilter;
    }

    const marketerWhere: any = {
      ...scope.marketerWhere,
    };

    const [
      associationsList,
      totalAssociations,
      activeAssociations,
      archivedAssociations,
      totalBeneficiaries,
      activeBeneficiaries,
      archivedBeneficiaries,
      totalMarketers,
      totalReports,
      categories,
      governorates,
      beneficiariesList,
      assocBeneficiaryCounts,
      recentBeneficiaries,
      topMarketersList,
    ] = await Promise.all([
      prisma.association.findMany({
        where: scope.assocWhere,
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.association.count({ where: assocWhere }),
      prisma.association.count({ where: { ...assocWhere, isActive: true, isArchived: false } }),
      prisma.association.count({ where: { ...assocWhere, isArchived: true } }),
      prisma.beneficiary.count({ where: beneficiaryWhere }),
      prisma.beneficiary.count({ where: { ...beneficiaryWhere, isActive: true, isArchived: false } }),
      prisma.beneficiary.count({ where: { ...beneficiaryWhere, isArchived: true } }),
      prisma.marketer.count({ where: marketerWhere }),
      prisma.marketerMonthlyReport.count({ where: { marketer: marketerWhere } }),
      prisma.associationCategory.findMany({
        include: { _count: { select: { associations: true } } },
      }),
      prisma.governorate.findMany({
        include: { _count: { select: { associations: true } } },
      }),
      prisma.beneficiary.findMany({
        where: beneficiaryWhere,
        select: {
          healthStatus: true,
          maritalStatus: true,
          housingType: true,
          housingTenure: true,
          educationLevel: true,
          diseaseType: true,
          disabilityType: true,
          totalFamilyMembers: true,
          totalIncome: true,
          totalExpenses: true,
          rentAmount: true,
          socialSecurity: true,
          debtMonthly: true,
          caseClassification: true,
          association: { select: { name: true, city: { select: { nameAr: true, name: true } } } },
        },
      }),
      prisma.association.findMany({
        where: assocWhere,
        select: {
          name: true,
          _count: { select: { beneficiaries: true } },
        },
        take: 5,
        orderBy: { beneficiaries: { _count: "desc" } },
      }),
      prisma.beneficiary.findMany({
        where: beneficiaryWhere,
        select: {
          id: true,
          fullName: true,
          nationalId: true,
          createdAt: true,
          association: { select: { name: true } },
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      prisma.marketer.findMany({
        where: marketerWhere,
        select: {
          id: true,
          name: true,
          type: true,
          _count: { select: { monthlyReports: true } },
        },
        take: 5,
        orderBy: { monthlyReports: { _count: "desc" } },
      }),
    ]);

    // Aggregate beneficiary metrics & priority
    const healthMap: Record<string, number> = {};
    const maritalMap: Record<string, number> = {};
    const housingMap: Record<string, number> = {};
    const tenureMap: Record<string, number> = {};
    const educationMap: Record<string, number> = {};
    const diseaseMap: Record<string, number> = {};
    const disabilityMap: Record<string, number> = {};
    const cityMap: Record<string, number> = {};

    const priorityMap: Record<string, number> = {
      critical: 0,
      high: 0,
      normal: 0,
      unspecified: 0,
    };

    let totalIncomeSum = 0;
    let totalExpensesSum = 0;
    let totalRentSum = 0;
    let totalDebtSum = 0;
    let totalFamilyMembersSum = 0;

    beneficiariesList.forEach((b) => {
      if (b.healthStatus) healthMap[b.healthStatus] = (healthMap[b.healthStatus] || 0) + 1;
      if (b.maritalStatus) maritalMap[b.maritalStatus] = (maritalMap[b.maritalStatus] || 0) + 1;
      if (b.housingType) housingMap[b.housingType] = (housingMap[b.housingType] || 0) + 1;
      if (b.housingTenure) tenureMap[b.housingTenure] = (tenureMap[b.housingTenure] || 0) + 1;
      if (b.educationLevel) educationMap[b.educationLevel] = (educationMap[b.educationLevel] || 0) + 1;
      if (b.diseaseType) diseaseMap[b.diseaseType] = (diseaseMap[b.diseaseType] || 0) + 1;
      if (b.disabilityType) disabilityMap[b.disabilityType] = (disabilityMap[b.disabilityType] || 0) + 1;

      const cityName = b.association?.city?.nameAr || b.association?.city?.name || "غير محدد";
      cityMap[cityName] = (cityMap[cityName] || 0) + 1;

      // Classify priority based on official CASE_CLASSIFICATION_OPTIONS
      const cls = (b.caseClassification || "").trim();
      const inc = b.totalIncome;

      if (cls === "top-priority" || cls.includes("قصوى") || cls.includes("حرجة") || (inc !== null && inc !== undefined && inc < 2000)) {
        priorityMap.critical++;
      } else if (cls === "medium-priority" || cls.includes("متوسط") || (inc !== null && inc !== undefined && inc >= 2000 && inc < 4000)) {
        priorityMap.high++;
      } else if (cls === "not-eligible" || cls.includes("غير") || (inc !== null && inc !== undefined && inc >= 4000)) {
        priorityMap.normal++;
      } else {
        priorityMap.unspecified++;
      }

      totalIncomeSum += b.totalIncome || 0;
      totalExpensesSum += b.totalExpenses || 0;
      totalRentSum += b.rentAmount || 0;
      totalDebtSum += b.debtMonthly || 0;
      totalFamilyMembersSum += b.totalFamilyMembers || 1;
    });

    const totalCount = beneficiariesList.length || 1;
    const avgIncome = Math.round(totalIncomeSum / totalCount);
    const avgExpenses = Math.round(totalExpensesSum / totalCount);
    const avgFamilySize = (totalFamilyMembersSum / totalCount).toFixed(1);

    const categoryStats = categories.map((c) => ({
      name: c.nameAr || c.name,
      count: c._count.associations,
    }));

    const governorateStats = governorates.map((g) => ({
      name: g.nameAr || g.name,
      count: g._count.associations,
    }));

    const topAssociations = assocBeneficiaryCounts.map((a) => ({
      name: a.name,
      count: a._count.beneficiaries,
    }));

    // Radar chart metrics for multidimensional family balance
    const radarMetrics = [
      { subject: "متوسط الدخل", value: Math.min(100, Math.round((avgIncome / 5000) * 100)), fullMark: 100 },
      { subject: "الاستقرار السكني", value: Math.min(100, Math.round(((totalCount - (tenureMap["إيجار"] || 0)) / totalCount) * 100)), fullMark: 100 },
      { subject: "السلامة الصحية", value: Math.min(100, Math.round(((healthMap["سليم"] || 0) / totalCount) * 100)), fullMark: 100 },
      { subject: "حجم الأسرة", value: Math.min(100, Math.round((Number(avgFamilySize) / 10) * 100)), fullMark: 100 },
      { subject: "القدرة المالية", value: Math.min(100, Math.max(10, Math.round(((avgIncome - avgExpenses) / (avgIncome || 1)) * 100))), fullMark: 100 },
    ];

    const topMarketers = topMarketersList.map((m) => ({
      id: m.id,
      name: m.name,
      type: m.type === "company" ? "مؤسسة" : "فرد",
      reportsCount: m._count.monthlyReports,
    }));

    return NextResponse.json({
      filterOptions: {
        associations: associationsList,
      },
      associations: {
        total: totalAssociations,
        active: activeAssociations,
        archived: archivedAssociations,
      },
      beneficiaries: {
        total: totalBeneficiaries,
        active: activeBeneficiaries,
        archived: archivedBeneficiaries,
        avgFamilySize,
        priorities: priorityMap,
      },
      marketers: {
        total: totalMarketers,
        reportsCount: totalReports,
      },
      recentBeneficiaries,
      topMarketers,
      charts: {
        categories: categoryStats,
        governorates: governorateStats,
        healthStatus: Object.entries(healthMap).map(([name, count]) => ({ name, count })),
        maritalStatus: Object.entries(maritalMap).map(([name, count]) => ({ name, count })),
        housingType: Object.entries(housingMap).map(([name, count]) => ({ name, count })),
        housingTenure: Object.entries(tenureMap).map(([name, count]) => ({ name, count })),
        educationLevel: Object.entries(educationMap).map(([name, count]) => ({ name, count })),
        diseaseType: Object.entries(diseaseMap).map(([name, count]) => ({ name, count })),
        disabilityType: Object.entries(disabilityMap).map(([name, count]) => ({ name, count })),
        cityBreakdown: Object.entries(cityMap).map(([name, count]) => ({ name, count })),
        topAssociations,
        radarMetrics,
      },
      financial: {
        totalIncomeSum,
        totalExpensesSum,
        totalRentSum,
        totalDebtSum,
        avgIncome,
        avgExpenses,
      },
    });
  } catch (error: any) {
    console.error("GET /api/dashboard/stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
