import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { passwordSchema } from "@/lib/zodSchemas";
import { signSession, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { token, password, confirmPassword } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "رمز التحقق مفقود" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "كلمتا المرور غير متطابقتين" }, { status: 400 });
    }

    // Validate password schema
    const pwdVal = passwordSchema.safeParse(password);
    if (!pwdVal.success) {
      return NextResponse.json({ error: pwdVal.error.issues[0].message }, { status: 400 });
    }

    // Find user by resetToken
    const user = await prisma.user.findFirst({
      where: { resetToken: token },
      include: { role: true, image: true },
    });

    if (!user || !user.resetTokenExpiry) {
      return NextResponse.json({ error: "رمز التفعيل/الاستعادة غير صالح أو تم استخدامه مسبقاً" }, { status: 400 });
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

    // Auto-login: Sign JWT session & set httpOnly session cookie
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
      message: "تم تعيين كلمة المرور بنجاح وتسجيل دخولك تلقائياً",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("POST /api/auth/set-password error:", error);
    return NextResponse.json({ error: "حدث خطأ غير متوقع أثناء حفظ كلمة المرور" }, { status: 500 });
  }
}
