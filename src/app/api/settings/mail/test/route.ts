import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendTestEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.roleType !== "superadmin" && session.roleType !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const targetEmail = body.targetEmail || session.email;

    if (!targetEmail) {
      return NextResponse.json({ error: "البريد الإلكتروني المستهدف غير محدد" }, { status: 400 });
    }

    const result = await sendTestEmail(targetEmail, {
      smtp: body.smtp,
      port: body.port,
      secure: body.secure,
      user: body.user,
      password: body.password,
      fromEmail: body.fromEmail,
      fromName: body.fromName,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/settings/mail/test error:", error);
    return NextResponse.json({ success: false, message: error?.message || "فشل الاتصال بخادم Smtp" }, { status: 500 });
  }
}
