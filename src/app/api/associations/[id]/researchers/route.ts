import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { socialResearcherSchema } from "@/lib/zodSchemas";
import { sendWelcomeAccountEmail } from "@/lib/email";
import { logAudit } from "@/lib/auditLogger";

import { decodeId } from "@/lib/idObfuscator";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const associationId = decodeId(id);
    if (!associationId) {
      return NextResponse.json({ error: "معرف الجمعية غير صالح" }, { status: 400 });
    }

    // Find role for Social Researcher
    const researcherRole = await prisma.role.findFirst({
      where: { name: "SOCIAL_RESEARCHER" },
    });

    if (!researcherRole) {
      return NextResponse.json({ researchers: [] });
    }

    const researchers = await prisma.user.findMany({
      where: {
        associationId,
        roleId: researcherRole.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        isArchived: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ researchers });
  } catch (error) {
    console.error("GET /api/associations/[id]/researchers error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const associationId = decodeId(id);
    if (!associationId) {
      return NextResponse.json({ error: "معرف الجمعية غير صالح" }, { status: 400 });
    }

    const association = await prisma.association.findUnique({
      where: { id: associationId },
    });

    if (!association) {
      return NextResponse.json({ error: "الجمعية غير موجودة" }, { status: 404 });
    }

    const body = await req.json();
    const parseResult = socialResearcherSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "البيانات غير صحيحة";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email } = parseResult.data;
    const cleanEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مستخدم بالفعل في النظام" },
        { status: 400 }
      );
    }

    // Find or create SOCIAL_RESEARCHER role
    let role = await prisma.role.findFirst({
      where: { name: "SOCIAL_RESEARCHER" },
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          name: "SOCIAL_RESEARCHER",
          nameAr: "باحث اجتماعي",
          type: "user",
        },
      });
    }

    // Generate invitation reset token (valid for 24 hours) & temporary hashed password
    const tempRawPassword = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(tempRawPassword, 10);
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 24 * 3600 * 1000);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        roleId: role.id,
        associationId,
        status: "inactive",
        language: "ar",
        resetToken,
        resetTokenExpiry,
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
      },
    });

    // Build welcome set-password link & send invitation email
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const setPasswordUrl = `${protocol}://${host}/ar/set-password?token=${resetToken}`;

    const emailResult = await sendWelcomeAccountEmail({
      toEmail: newUser.email,
      userName: newUser.name || newUser.email,
      resetUrl: setPasswordUrl,
      associationName: association.name,
    });

    await logAudit({
      userId: session.userId,
      action: "CREATE",
      screen: "associations",
      details: {
        action: "CREATE_SOCIAL_RESEARCHER",
        targetUserId: newUser.id,
        email: newUser.email,
        associationId,
      },
    });

    return NextResponse.json({
      success: true,
      researcher: newUser,
      isMock: emailResult.isMock || false,
      message: emailResult.isMock
        ? "تم إنشاء حساب الباحث، وطباعة رابط التفعيل بالسيرفر لعدم اكتمال إعدادات البريد"
        : "تم إنشاء حساب الباحث وإرسال رابط الدعوة إلى بريده الإلكتروني بنجاح",
    });
  } catch (error) {
    console.error("POST /api/associations/[id]/researchers error:", error);
    return NextResponse.json({ error: "فشل إنشاء حساب الباحث الاجتماعي" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const associationId = decodeId(id);
    if (!associationId) {
      return NextResponse.json({ error: "معرف الجمعية غير صالح" }, { status: 400 });
    }

    const body = await req.json();
    const { researcherId, name, email } = body;

    if (!researcherId || !name) {
      return NextResponse.json({ error: "البيانات المطلوبة غير مكتملة" }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        id: researcherId,
        associationId,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "الباحث الاجتماعي غير موجود" }, { status: 404 });
    }

    const updateData: { name: string; email?: string; resetToken?: string; resetTokenExpiry?: Date } = {
      name: name.trim(),
    };

    let emailChanged = false;

    // Email edit is ONLY allowed if user status is NOT active (i.e. status === 'inactive')
    if (existingUser.status === "inactive" && email && email.toLowerCase().trim() !== existingUser.email) {
      const cleanEmail = email.toLowerCase().trim();
      const duplicateUser = await prisma.user.findFirst({
        where: { email: cleanEmail, NOT: { id: researcherId } },
      });
      if (duplicateUser) {
        return NextResponse.json({ error: "البريد الإلكتروني مستخدم بالفعل في النظام" }, { status: 400 });
      }

      updateData.email = cleanEmail;
      emailChanged = true;

      // Regenerate invitation token for the new email
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 24 * 3600 * 1000);
      updateData.resetToken = resetToken;
      updateData.resetTokenExpiry = resetTokenExpiry;

      const association = await prisma.association.findUnique({
        where: { id: associationId },
      });

      const host = req.headers.get("host") || "localhost:3000";
      const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
      const setPasswordUrl = `${protocol}://${host}/ar/set-password?token=${resetToken}`;

      await sendWelcomeAccountEmail({
        toEmail: cleanEmail,
        userName: updateData.name,
        resetUrl: setPasswordUrl,
        associationName: association?.name || "",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: researcherId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
      },
    });

    await logAudit({
      userId: session.userId,
      action: "UPDATE",
      screen: "associations",
      details: {
        action: "UPDATE_SOCIAL_RESEARCHER",
        targetUserId: updatedUser.id,
        updatedFields: Object.keys(updateData),
        associationId,
      },
    });

    return NextResponse.json({
      success: true,
      researcher: updatedUser,
      message: emailChanged
        ? "تم تحديث بيانات الباحث وإرسال رابط الدعوة الجديد للبريد المعدل"
        : "تم تحديث بيانات الباحث بنجاح",
    });
  } catch (error) {
    console.error("PUT /api/associations/[id]/researchers error:", error);
    return NextResponse.json({ error: "فشل تحديث بيانات الباحث الاجتماعي" }, { status: 500 });
  }
}

