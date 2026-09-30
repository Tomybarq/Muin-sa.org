import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { associationSchema } from "@/lib/zodSchemas";

async function hasPermission(userId: number, action: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: {
            where: { screen: { path: "/portal/associations" } },
            include: { screen: true }
          }
        }
      }
    }
  });

  if (!user) return false;
  if (user.role.type === "superadmin") return true;

  const perm = user.role.permissions[0];
  if (!perm) return false;

  return perm.actions.includes(action);
}

import { logAudit } from "@/lib/auditLogger";

import { checkEmailUniqueness } from "@/lib/checkEmailUniqueness";
import { getUserDataScope } from "@/lib/dataScoping";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const scope = await getUserDataScope(session.userId);

    const { searchParams } = new URL(request.url);
    const showArchived = searchParams.get("archived") === "true";
    const statusFilter = searchParams.get("status");

    let whereClause: any = { ...scope.assocWhere };
    if (showArchived || statusFilter === "archived") {
      whereClause.isArchived = true;
    } else if (statusFilter === "active") {
      whereClause.isArchived = false;
    } else if (statusFilter === "inactive") {
      whereClause.isArchived = false;
      whereClause.isActive = false;
    }

    const associations = await prisma.association.findMany({
      where: whereClause,
      include: {
        category: true,
        governorate: true,
        logo: {
          select: {
            id: true,
            originalName: true,
            mimetype: true,
            fileSize: true,
            width: true,
            height: true,
          }
        },
        city: {
          include: { governorate: true }
        },
        managerUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { id: "asc" },
    });

    const items = associations.map((a) => ({
      ...a,
      logoUrl: a.logo ? `/api/attachments/${a.logo.id}/file` : null,
    }));

    return NextResponse.json({ associations: items });
  } catch (error) {
    console.error("GET /api/associations error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await hasPermission(session.userId, "create");
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = associationSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Validation error";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const {
      name,
      manager,
      managerId,
      phone,
      email,
      governorateId,
      cityId,
      categoryId,
      donationUrl,
      logoId
    } = result.data;

    if (email) {
      const emailCheck = await checkEmailUniqueness(email, undefined, body.locale || "ar");
      if (emailCheck.inUse) {
        return NextResponse.json({ error: emailCheck.message }, { status: 400 });
      }
    }

    // Check if category exists
    const categoryExists = await prisma.associationCategory.findUnique({
      where: { id: categoryId }
    });
    if (!categoryExists) {
      return NextResponse.json({ error: "Selected category does not exist" }, { status: 400 });
    }

    // Check if governorate exists
    const governorateExists = await prisma.governorate.findUnique({
      where: { id: governorateId }
    });
    if (!governorateExists) {
      return NextResponse.json({ error: "Selected governorate does not exist" }, { status: 400 });
    }

    // Check if city exists
    const cityExists = await prisma.city.findUnique({
      where: { id: cityId }
    });
    if (!cityExists) {
      return NextResponse.json({ error: "Selected city does not exist" }, { status: 400 });
    }

    // Check manager user
    if (managerId) {
      const userExists = await prisma.user.findUnique({
        where: { id: managerId }
      });
      if (!userExists) {
        return NextResponse.json({ error: "Selected manager user does not exist" }, { status: 400 });
      }
    }

    const association = await prisma.association.create({
      data: {
        name,
        manager,
        managerId: managerId || null,
        phone,
        email,
        governorateId,
        cityId,
        categoryId,
        donationUrl: donationUrl || null,
        logoId: logoId || null
      },
      include: {
        category: true,
        governorate: true,
        logo: {
          select: {
            id: true,
            originalName: true,
            mimetype: true,
            fileSize: true,
            width: true,
            height: true,
          }
        },
        city: {
          include: { governorate: true }
        },
        managerUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    await logAudit({
      userId: session.userId,
      action: "CREATE",
      screen: "associations",
      recordId: association.id,
      details: { name: association.name, email: association.email },
    });

    const { logo, ...rest } = association;
    return NextResponse.json({ association: { ...rest, logoUrl: logo ? `/api/attachments/${logo.id}/file` : null, logo } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/associations error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
