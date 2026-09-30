import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/auth";
import { logAudit } from "@/lib/auditLogger";

export async function POST() {
  const session = await getSession();
  if (session) {
    await logAudit({
      userId: session.userId,
      action: "LOGOUT",
      screen: "auth",
      details: { email: session.email },
    });
  }
  await clearSession();
  return NextResponse.json({ success: true });
}
