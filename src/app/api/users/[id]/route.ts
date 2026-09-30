import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcrypt";
import { passwordSchema } from "@/lib/zodSchemas";
import { logAudit } from "@/lib/auditLogger";
import { checkEmailUniqueness } from "@/lib/checkEmailUniqueness";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.roleType !== "superadmin" && session.roleType !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid User ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, email, roleId, password } = body;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 1. If target user is superadmin, only superadmin can edit details
    if (targetUser.role.type === "superadmin" && session.roleType !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updateData: { name?: string | null; email?: string; roleId?: number; password?: string } = {};

    if (name !== undefined) {
      updateData.name = name && name.trim() !== "" ? name.trim() : null;
    }

    if (email !== undefined) {
      if (!email || !email.includes("@")) {
        return NextResponse.json({ error: "البريد الإلكتروني غير صالح", field: "email" }, { status: 400 });
      }
      const emailCheck = await checkEmailUniqueness(email, { userId }, body.locale || "ar");
      if (emailCheck.inUse) {
        return NextResponse.json({ error: emailCheck.message, field: "email" }, { status: 400 });
      }
      updateData.email = email;
    }

    if (roleId !== undefined) {
      const targetRoleId = parseInt(roleId);
      const targetRole = await prisma.role.findUnique({
        where: { id: targetRoleId },
      });

      if (!targetRole) {
        return NextResponse.json({ error: "Role not found" }, { status: 404 });
      }

      const isSuperAdmin = session.roleType === "superadmin";
      if (!isSuperAdmin && targetRole.type === "superadmin") {
        return NextResponse.json({ error: "لا يمكنك تعيين دور مدير النظام" }, { status: 403 });
      }

      if (targetRole.type === "superadmin") {
        const count = await prisma.user.count({
          where: {
            roleId: targetRoleId,
            NOT: { id: userId },
          },
        });
        if (count > 0) {
          return NextResponse.json({
            error: "هذا الدور مخصص لمستخدم واحد فقط كحد أقصى",
          }, { status: 400 });
        }
      }
      updateData.roleId = targetRoleId;
    }

    // Password change - only superadmin can change another user's password
    if (password !== undefined && password !== "") {
      if (session.roleType !== "superadmin") {
        return NextResponse.json({ error: "فقط مدير النظام يمكنه تغيير كلمة مرور مستخدم آخر" }, { status: 403 });
      }
      const pwResult = passwordSchema.safeParse(password);
      if (!pwResult.success) {
        return NextResponse.json({
          error: pwResult.error.issues[0]?.message || "كلمة المرور لا تطابق المعايير",
          field: "password",
        }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        role: { select: { name: true, nameAr: true, type: true } },
        association: { select: { id: true, name: true } },
        image: { select: { id: true } },
      },
    });

    await logAudit({
      userId: session.userId,
      action: "UPDATE",
      screen: "users",
      details: { targetUserId: updatedUser.id, name: updatedUser.name, email: updatedUser.email },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        roleId: updatedUser.roleId,
        role: updatedUser.role,
        status: updatedUser.status,
        isArchived: updatedUser.isArchived,
        createdAt: updatedUser.createdAt,
        associationId: updatedUser.associationId,
        association: updatedUser.association,
        imageId: updatedUser.imageId,
        imageUrl: updatedUser.image ? `/api/attachments/${updatedUser.image.id}/file` : (updatedUser.imageId ? `/api/attachments/${updatedUser.imageId}/file` : null),
      },
    });
  } catch (error) {
    console.error("PUT /api/users/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.roleType !== "superadmin" && session.roleType !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid User ID" }, { status: 400 });
    }

    const { isArchived } = await request.json();

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Cannot archive superadmin user
    if (targetUser.role.type === "superadmin") {
      return NextResponse.json({ error: "لا يمكن أرشفة مدير النظام" }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isArchived: !!isArchived },
    });

    await logAudit({
      userId: session.userId,
      action: isArchived ? "ARCHIVE" : "UNARCHIVE",
      screen: "users",
      details: { targetUserId: targetUser.id, name: targetUser.name, email: targetUser.email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/users/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.roleType !== "superadmin" && session.roleType !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid User ID" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Cannot delete superadmin
    if (targetUser.role.type === "superadmin") {
      return NextResponse.json({ error: "لا يمكن حذف مدير النظام" }, { status: 403 });
    }

    // Delete user permissions first
    await prisma.userPermission.deleteMany({ where: { userId } });

    // Unlink from association manager
    await prisma.association.updateMany({
      where: { managerId: userId },
      data: { managerId: null },
    });

    await prisma.user.delete({ where: { id: userId } });

    await logAudit({
      userId: session.userId,
      action: "DELETE",
      screen: "users",
      details: { targetUserId: targetUser.id, name: targetUser.name, email: targetUser.email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
