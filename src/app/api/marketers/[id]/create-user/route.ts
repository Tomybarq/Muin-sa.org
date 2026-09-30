import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/auditLogger";
import { decodeId } from "@/lib/idObfuscator";
import { sendWelcomeAccountEmail } from "@/lib/email";
import crypto from "crypto";

function parseMarketerId(rawId: string): number | null {
  const decoded = decodeId(rawId);
  if (decoded !== null) return decoded;
  const num = parseInt(rawId, 10);
  return isNaN(num) ? null : num;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const marketerId = parseMarketerId(id);
    if (!marketerId) {
      return NextResponse.json({ error: "Invalid marketer ID" }, { status: 400 });
    }

    const marketer = await prisma.marketer.findUnique({
      where: { id: marketerId },
      include: { users: true },
    });

    if (!marketer) {
      return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
    }

    if (!marketer.email) {
      return NextResponse.json({ error: "يرجى إضافة البريد الإلكتروني للمسوق أولاً حتى تتمكن من إنشاء حساب له" }, { status: 400 });
    }

    // Check if user already exists for this marketer
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { marketerId: marketerId },
          { email: marketer.email.toLowerCase().trim() },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "يوجد حساب مستخدم مرتبط بهذا المسوق أو البريد الإلكتروني بالفعل" },
        { status: 400 }
      );
    }

    // Find role for marketer
    let role = await prisma.role.findFirst({
      where: { name: "MARKETER" },
    });

    if (!role) {
      role = await prisma.role.findFirst();
    }

    if (!role) {
      return NextResponse.json({ error: "لم يتم العثور على دور وظيفي مناسب لحساب المسوق" }, { status: 400 });
    }

    // Generate reset token for invitation
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Dummy password (account is inactive until password setup via invite)
    const dummyPassword = crypto.randomBytes(16).toString("hex");

    const newUser = await prisma.user.create({
      data: {
        name: marketer.name,
        email: marketer.email.toLowerCase().trim(),
        password: dummyPassword,
        status: "inactive",
        roleId: role.id,
        marketerId: marketer.id,
        resetToken,
        resetTokenExpiry: tokenExpiry,
      },
    });

    // Send invitation email
    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const inviteUrl = `${origin}/ar/reset-password?token=${resetToken}`;

    await sendWelcomeAccountEmail({
      toEmail: newUser.email,
      userName: newUser.name || marketer.name,
      resetUrl: inviteUrl,
      associationName: marketer.name,
    });

    await logAudit({
      userId: session.userId,
      action: "CREATE_MARKETER_USER",
      screen: "marketers",
      recordId: marketer.id,
      details: { createdUserId: newUser.id, email: newUser.email },
    });

    return NextResponse.json({
      success: true,
      message: "تم إنشاء حساب المسوق وإرسال رابط الدعوة لتحديد كلمة المرور بنجاح",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        status: newUser.status,
      },
    });
  } catch (err: any) {
    console.error("[CREATE MARKETER USER ERROR]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
