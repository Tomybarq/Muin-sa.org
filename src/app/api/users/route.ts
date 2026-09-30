import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { logAudit } from "@/lib/auditLogger";


import { checkEmailUniqueness } from "@/lib/checkEmailUniqueness";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.roleType !== "superadmin" && session.roleType !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    const where: any = includeArchived ? {} : { isArchived: false };

    if (session.roleType !== "superadmin") {
      where.role = {
        type: {
          not: "superadmin",
        },
      };
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        role: {
          select: { name: true, nameAr: true, type: true },
        },
        association: {
          select: { id: true, name: true },
        },
        image: {
          select: { id: true },
        },
      },
    });

    const formattedUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      roleId: u.roleId,
      role: u.role,
      status: u.status,
      isArchived: u.isArchived,
      createdAt: u.createdAt,
      associationId: u.associationId,
      association: u.association,
      imageId: u.imageId,
      imageUrl: u.image ? `/api/attachments/${u.image.id}/file` : (u.imageId ? `/api/attachments/${u.imageId}/file` : null),
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.roleType !== "superadmin" && session.roleType !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, roleId, locale = "ar" } = body;

    // Validate name
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "يرجى إدخال الاسم", field: "name" }, { status: 400 });
    }

    // Validate email
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "البريد الإلكتروني غير صالح", field: "email" }, { status: 400 });
    }

    // Check email uniqueness across User, Marketer, Association
    const emailCheck = await checkEmailUniqueness(email, undefined, locale || "ar");
    if (emailCheck.inUse) {
      return NextResponse.json({ error: emailCheck.message, field: "email" }, { status: 400 });
    }

    // Validate roleId - admin roles and data manager allowed
    if (!roleId) {
      return NextResponse.json({ error: "يرجى اختيار نوع المستخدم", field: "roleId" }, { status: 400 });
    }
    const targetRole = await prisma.role.findUnique({ where: { id: parseInt(roleId) } });
    const isAllowedRole = targetRole && (targetRole.type === "admin" || targetRole.type === "user" || targetRole.name === "DATA_MANAGER" || targetRole.nameAr?.includes("مدير البيانات"));
    if (!isAllowedRole || (targetRole.type === "superadmin" && session.roleType !== "superadmin")) {
      return NextResponse.json({ error: "نوع المستخدم غير مسموح به", field: "roleId" }, { status: 400 });
    }

    // Generate temporary hashed password (user will set their own via invitation link)
    const tempRawPassword = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(tempRawPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        roleId: parseInt(roleId),
        status: "inactive",
        language: locale,
      },
      include: {
        role: {
          select: { name: true, nameAr: true, type: true },
        },
        association: {
          select: { id: true, name: true },
        },
        image: {
          select: { id: true },
        },
      },
    });

    await logAudit({
      userId: session.userId,
      action: "CREATE",
      screen: "users",
      details: { targetUserId: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role.name },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        roleId: newUser.roleId,
        role: newUser.role,
        status: newUser.status,
        isArchived: newUser.isArchived,
        createdAt: newUser.createdAt,
        associationId: newUser.associationId,
        association: newUser.association,
        imageId: newUser.imageId,
        imageUrl: newUser.image ? `/api/attachments/${newUser.image.id}/file` : (newUser.imageId ? `/api/attachments/${newUser.imageId}/file` : null),
      },
    });
  } catch (error: any) {
    console.error("POST /api/users error:", error);
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "البريد الإلكتروني مستخدم بالفعل", field: "email" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
