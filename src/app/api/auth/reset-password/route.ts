import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { passwordSchema } from "@/lib/zodSchemas";
import { signSession, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { token, password, confirmPassword } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "رمز الإعادة مفقود" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "كلمتا المرور غير متطابقتين" }, { status: 400 });
    }

    const pwdVal = passwordSchema.safeParse(password);
    if (!pwdVal.success) {
      return NextResponse.json({ error: pwdVal.error.issues[0].message }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { resetToken: token },
      include: { role: true, image: true },
    });

    if (!user || !user.resetTokenExpiry) {
      return NextResponse.json({ error: "رمز الإعادة غير صالح أو تم استخدامه مسبقاً" }, { status: 400 });
    }

    if (new Date() > user.resetTokenExpiry) {
      return NextResponse.json({ error: "انتهت صلاحية هذا الرابط، يرجى طلب رابط جديد" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        status: "active",
        resetToken: null,
        resetTokenExpiry: null,
      },
      include: { role: true, image: true },
    });

    // Auto-login upon resetting password
    const sessionToken = await signSession({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role.name,
      roleType: updatedUser.role.type,
      language: updatedUser.language || "ar",
      darkMode: updatedUser.darkMode || false,
      image: updatedUser.image ? `/api/attachments/${updatedUser.image.id}/file` : null,
    });

    await setSessionCookie(sessionToken);

    return NextResponse.json({
      success: true,
      message: "تم إعادة تعيين كلمة المرور بنجاح وتسجيل دخولك تلقائياً",
    });
  } catch (error) {
    console.error("POST /api/auth/reset-password error:", error);
    return NextResponse.json({ error: "حدث خطأ غير متوقع أثناء تحديث كلمة المرور" }, { status: 500 });
  }
}
