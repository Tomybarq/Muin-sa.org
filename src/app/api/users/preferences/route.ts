import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, signSession, setSessionCookie } from "@/lib/auth";

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { language, darkMode } = body;

    const updateData: { language?: string; darkMode?: boolean } = {};
    if (language !== undefined) {
      if (language !== "ar" && language !== "en") {
        return NextResponse.json({ error: "Invalid language" }, { status: 400 });
      }
      updateData.language = language;
    }
    if (darkMode !== undefined) {
      updateData.darkMode = !!darkMode;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
    });

    // Update the session cookie with new values
    const newSessionPayload = {
      ...session,
      ...(language !== undefined ? { language } : {}),
      ...(darkMode !== undefined ? { darkMode } : {}),
    };
    const newToken = await signSession(newSessionPayload);
    await setSessionCookie(newToken);

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("PUT /api/users/preferences error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
