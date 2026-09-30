import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { role: true },
    });

    const userRole = user?.role;
    if (!userRole) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let hasAuditAccess = userRole.type === "superadmin";

    if (!hasAuditAccess) {
      const perm = await prisma.rolePermission.findFirst({
        where: {
          roleId: userRole.id,
          screen: { path: "/portal/settings/audit-logs" },
        },
      });
      if (perm && perm.actions.includes("view")) {
        hasAuditAccess = true;
      }

      const userPerm = await prisma.userPermission.findFirst({
        where: {
          userId: session.userId,
          screen: { path: "/portal/settings/audit-logs" },
        },
      });
      if (userPerm) {
        if (userPerm.actions.includes("view") && !userPerm.deniedActions.includes("view")) {
          hasAuditAccess = true;
        } else if (userPerm.deniedActions.includes("view")) {
          hasAuditAccess = false;
        }
      }
    }

    if (!hasAuditAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const screen = searchParams.get("screen");
    const userIdStr = searchParams.get("userId");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const skip = (page - 1) * limit;

    const isSuperAdminUser = userRole.type === "superadmin";

    const where: any = {};

    // Security Isolation: If the requesting user is NOT a SuperAdmin, exclude SuperAdmin audit logs completely
    if (!isSuperAdminUser) {
      where.user = {
        role: {
          type: {
            not: "superadmin",
          },
        },
      };
    }

    if (action && action !== "all") where.action = action;
    if (screen && screen !== "all") where.screen = screen;
    if (userIdStr && userIdStr !== "all") where.userId = parseInt(userIdStr, 10);

    if (search && search.trim()) {
      const q = search.trim();
      const searchConditions = [
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
        { details: { contains: q, mode: "insensitive" } },
      ];

      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions },
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())) {
          const [y, m, d] = startDate.trim().split("-").map(Number);
          where.createdAt.gte = new Date(y, m - 1, d, 0, 0, 0, 0);
        } else {
          where.createdAt.gte = new Date(startDate);
        }
      }
      if (endDate) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(endDate.trim())) {
          const [y, m, d] = endDate.trim().split("-").map(Number);
          where.createdAt.lte = new Date(y, m - 1, d, 23, 59, 59, 999);
        } else {
          const eDate = new Date(endDate);
          eDate.setHours(23, 59, 59, 999);
          where.createdAt.lte = eDate;
        }
      }
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const statsWhere = { ...where, createdAt: { gte: startOfToday } };

    const [logs, total, todayLogsCount, todayLoginsCount, todayCriticalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: { select: { name: true, type: true } } },
          },
        },
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.count({ where: statsWhere }),
      prisma.auditLog.count({ where: { ...statsWhere, action: "LOGIN" } }),
      prisma.auditLog.count({ where: { ...statsWhere, action: { in: ["DELETE", "ARCHIVE"] } } }),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        todayLogs: todayLogsCount,
        todayLogins: todayLoginsCount,
        todayCritical: todayCriticalCount,
      },
    });
  } catch (error: any) {
    console.error("GET /api/audit-logs error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
