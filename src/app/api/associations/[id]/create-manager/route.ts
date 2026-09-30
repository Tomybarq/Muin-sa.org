import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { passwordSchema } from "@/lib/zodSchemas";
import { sendWelcomeAccountEmail } from "@/lib/email";
import { logAudit } from "@/lib/auditLogger";
import { decodeId } from "@/lib/idObfuscator";
import { getSession } from "@/lib/auth";

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

    const body = await req.json().catch(() => ({}));
    const { password } = body;

    const association = await prisma.association.findUnique({ where: { id: associationId } });
    if (!association) {
      return NextResponse.json({ error: "الجمعية غير موجودة" }, { status: 404 });
    }

    if (association.managerId) {
      return NextResponse.json({ error: "الجمعية لديها حساب مدير مسبقاً" }, { status: 400 });
    }

    if (!association.email || !association.email.includes("@")) {
      return NextResponse.json(
        { error: "يرجى إضافة بريد إلكتروني صحيح للجمعية أولاً قبل إنشاء حساب المدير" },
        { status: 400 }
      );
    }

    if (!association.manager || !association.manager.trim()) {
      return NextResponse.json(
        { error: "يرجى إدخال اسم مسؤول/مدير الجمعية أولاً في بيانات الجمعية" },
        { status: 400 }
      );
    }

    const cleanEmail = association.email.toLowerCase().trim();

    // Check email uniqueness
    const existingUser = await prisma.user.findFirst({ where: { email: cleanEmail } });
    if (existingUser) {
      return NextResponse.json(
        { error: "البريد الإلكتروني للجمعية مُستخدم بالفعل بحساب آخر" },
        { status: 400 }
      );
    }

    // Optional password validation if provided, else generate random password
    let hashedPassword = "";
    if (password) {
      const parseResult = passwordSchema.safeParse(password);
      if (!parseResult.success) {
        const firstMsg = parseResult.error.issues[0]?.message || "كلمة المرور لا تطابق المعايير المطلوبة";
        return NextResponse.json({ error: firstMsg }, { status: 400 });
      }
      hashedPassword = await bcrypt.hash(password, 10);
    } else {
      const tempRawPassword = crypto.randomBytes(16).toString("hex");
      hashedPassword = await bcrypt.hash(tempRawPassword, 10);
    }

    // Find or create CHARITY_STAFF role
    let role = await prisma.role.findFirst({ where: { name: "CHARITY_STAFF" } });
    if (!role) {
      role = await prisma.role.create({
        data: {
          name: "CHARITY_STAFF",
          nameAr: "مدير الجمعية",
          type: "user",
        },
      });
    }

    // Generate resetToken for set-password invitation link
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 24 * 3600 * 1000);

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        name: association.manager.trim(),
        roleId: role.id,
        associationId,
        status: password ? "active" : "inactive",
        language: "ar",
        resetToken,
        resetTokenExpiry,
      },
    });

    // Link new user as managerId in Association
    await prisma.association.update({
      where: { id: associationId },
      data: { managerId: user.id },
    });

    // Send Welcome / Invitation email to the manager's email
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const setPasswordUrl = `${protocol}://${host}/ar/set-password?token=${resetToken}`;

    const emailResult = await sendWelcomeAccountEmail({
      toEmail: user.email,
      userName: user.name || user.email,
      resetUrl: setPasswordUrl,
      associationName: association.name,
    });

    await logAudit({
      userId: session.userId,
      action: "CREATE",
      screen: "associations",
      details: {
        action: "CREATE_ASSOCIATION_MANAGER",
        managerUserId: user.id,
        email: user.email,
        associationId,
      },
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
      isMock: emailResult.isMock || false,
      message: emailResult.isMock
        ? "تم إنشاء حساب مدير الجمعية وطباعة رابط الدعوة في السيرفر لعدم اكتمال إعدادات البريد"
        : "تم إنشاء حساب مدير الجمعية وإرسال رابط الدعوة لبريده الإلكتروني بنجاح",
    });
  } catch (error) {
    console.error("Failed to create manager user:", error);
    return NextResponse.json({ error: "فشل إنشاء حساب مدير الجمعية" }, { status: 500 });
  }
}
