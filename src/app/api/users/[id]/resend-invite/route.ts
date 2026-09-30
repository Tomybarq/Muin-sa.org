import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import crypto from "crypto";
import { logAudit } from "@/lib/auditLogger";
import { sendWelcomeAccountEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
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
      return NextResponse.json({ error: "معرف المستخدم غير صالح" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: { select: { name: true, type: true } },
        association: { select: { name: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    // Only allow sending invitation to inactive users
    if (user.status === "active") {
      return NextResponse.json({ error: "المستخدم نشط بالفعل ولا يحتاج دعوة" }, { status: 400 });
    }

    if (user.isArchived) {
      return NextResponse.json({ error: "لا يمكن إرسال دعوة لمستخدم مؤرشف" }, { status: 400 });
    }

    // Generate new invitation token (valid for 24 hours)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 24 * 3600 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: { resetToken, resetTokenExpiry },
    });

    // Build set-password URL
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const locale = user.language || "ar";
    const setPasswordUrl = `${protocol}://${host}/${locale}/set-password?token=${resetToken}`;

    // Send welcome/invitation email
    const emailResult = await sendWelcomeAccountEmail({
      toEmail: user.email,
      userName: user.name || user.email,
      resetUrl: setPasswordUrl,
      associationName: user.association?.name,
    });

    if (!emailResult.success && !emailResult.isMock) {
      return NextResponse.json(
        { error: emailResult.error || "فشل إرسال البريد الإلكتروني" },
        { status: 500 }
      );
    }

    await logAudit({
      userId: session.userId,
      action: "SEND_INVITE",
      screen: "users",
      details: {
        targetUserId: user.id,
        email: user.email,
        name: user.name,
        isMock: emailResult.isMock || false,
      },
    });

    return NextResponse.json({
      success: true,
      isMock: emailResult.isMock || false,
      message: emailResult.isMock
        ? "إعدادات البريد غير مكتملة، تم طباعة رابط الدعوة في السيرفر"
        : "تم إرسال الدعوة بنجاح",
    });
  } catch (error: any) {
    console.error("POST /api/users/[id]/resend-invite error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
