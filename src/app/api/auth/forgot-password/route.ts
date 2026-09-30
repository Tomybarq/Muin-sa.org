import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email, locale = "ar" } = await request.json();
    const isAr = locale === "ar";

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: isAr ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: isAr ? "البريد الإلكتروني غير مسجل في النظام" : "This email address is not registered in the system" },
        { status: 404 }
      );
    }

    if (user.status === "archived" || user.status === "inactive") {
      return NextResponse.json(
        { error: isAr ? "هذا الحساب معطل أو موقوف. يرجى التواصل مع إدارة النظام." : "Account is suspended or inactive." },
        { status: 400 }
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const resetUrl = `${protocol}://${host}/${locale}/reset-password?token=${resetToken}`;

    // Dispatch email asynchronously in background so HTTP response is instant (<50ms)
    sendPasswordResetEmail({
      toEmail: user.email,
      userName: user.name || user.email,
      resetUrl,
    }).catch((err) => {
      console.error("Background reset email dispatch error:", err);
    });

    return NextResponse.json({
      success: true,
      message: isAr ? "تم إرسال رابط إعادة تعيين كلمة المرور بنجاح" : "Reset link sent successfully",
    });
  } catch (error) {
    console.error("POST /api/auth/forgot-password error:", error);
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع أثناء معالجة الطلب" },
      { status: 500 }
    );
  }
}
