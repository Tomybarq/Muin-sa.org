import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, signSession, setSessionCookie } from "@/lib/auth";
import bcrypt from "bcrypt";
import { logAudit } from "@/lib/auditLogger";
import { changePasswordSchema, updateProfileSchema } from "@/lib/zodSchemas";

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const parseResult = updateProfileSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message || "بيانات التحديث غير صحيحة", field: firstIssue?.path[0] },
        { status: 400 }
      );
    }

    const { name, imageId } = parseResult.data;

    const updateData: { name: string; imageId?: number | null } = {
      name,
      ...(imageId !== undefined ? { imageId: imageId ? Number(imageId) : null } : {}),
    };

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
      include: {
        image: {
          select: {
            id: true,
            name: true,
            originalName: true,
            mimetype: true,
            fileSize: true,
          },
        },
      },
    });

    await logAudit({
      userId: session.userId,
      action: "UPDATE",
      screen: "settings",
      recordId: session.userId,
      details: {
        name: updatedUser.name,
        imageId: updatedUser.imageId,
      },
    });

    const newSessionPayload = {
      ...session,
      ...(updateData.name !== undefined ? { name: updatedUser.name } : {}),
    };
    const newToken = await signSession(newSessionPayload);
    await setSessionCookie(newToken);

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        imageId: updatedUser.imageId,
        image: updatedUser.image
          ? {
              id: updatedUser.image.id,
              url: `/api/attachments/${updatedUser.image.id}/file`,
              name: updatedUser.image.name,
              originalName: updatedUser.image.originalName,
              mimetype: updatedUser.image.mimetype,
              fileSize: updatedUser.image.fileSize,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error("PUT /api/users/profile error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body || {};

    // Step 1: Verify presence of current password
    if (!currentPassword || typeof currentPassword !== "string" || !currentPassword.trim()) {
      return NextResponse.json(
        { error: "يرجى إدخال كلمة المرور الحالية", field: "currentPassword" },
        { status: 400 }
      );
    }

    // Step 2: Check current password correctness against database BEFORE validating new password
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "كلمة المرور الحالية غير صحيحة", field: "currentPassword" },
        { status: 400 }
      );
    }

    // Step 3: NOW that current password is correct, validate remaining inputs (newPassword & confirmPassword)
    const parseResult = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      const targetField = (firstIssue?.path[0] as string) || "newPassword";
      const message = firstIssue?.message || "كلمة المرور الجديدة لا تطابق المعايير المطلوبة";

      return NextResponse.json(
        { error: message, field: targetField },
        { status: 400 }
      );
    }

    // Step 4: Hash new password and update user record
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: session.userId },
      data: { password: hashedPassword },
    });

    await logAudit({
      userId: session.userId,
      action: "UPDATE",
      screen: "settings",
      recordId: session.userId,
      details: "تحديث كلمة المرور",
    });

    return NextResponse.json({
      success: true,
      message: "تم تغيير كلمة المرور بنجاح",
    });
  } catch (error: any) {
    console.error("PATCH /api/users/profile error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
