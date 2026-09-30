import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ valid: false, message: "رمز التحقق مفقود" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { resetToken: token },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        resetTokenExpiry: true,
      },
    });

    if (!user || !user.resetTokenExpiry) {
      return NextResponse.json({ valid: false, message: "رمز التحقق غير صالح أو غير موجود" }, { status: 400 });
    }

    if (new Date() > user.resetTokenExpiry) {
      return NextResponse.json({ valid: false, message: "انتهت صلاحية رابط التحقق، يرجى طلب رابط جديد" }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("POST /api/auth/verify-token error:", error);
    return NextResponse.json({ valid: false, message: "حدث خطأ في السيرفر أثناء التحقق" }, { status: 500 });
  }
}
