import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.roleType !== "superadmin" && session.roleType !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mailSetting = await prisma.mailSetting.findFirst();

    return NextResponse.json({
      setting: mailSetting || {
        smtp: "",
        port: 587,
        secure: false,
        user: "",
        password: "",
        fromEmail: "",
        fromName: "",
      },
    });
  } catch (error) {
    console.error("GET /api/settings/mail error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.roleType !== "superadmin" && session.roleType !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { smtp, port, secure, user, password, fromEmail, fromName } = body;

    const existing = await prisma.mailSetting.findFirst();

    const data = {
      smtp: (smtp || "").trim(),
      port: port ? parseInt(port, 10) : 587,
      secure: !!secure,
      user: (user || "").trim(),
      password: (password || "").trim(),
      fromEmail: (fromEmail || "").trim(),
      fromName: (fromName || "").trim(),
    };

    let updatedSetting;
    if (existing) {
      updatedSetting = await prisma.mailSetting.update({
        where: { id: existing.id },
        data,
      });
    } else {
      updatedSetting = await prisma.mailSetting.create({
        data,
      });
    }

    return NextResponse.json({ success: true, setting: updatedSetting });
  } catch (error) {
    console.error("POST /api/settings/mail error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
