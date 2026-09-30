import prisma from "@/lib/prisma";

export async function logAudit({
  userId,
  action,
  screen,
  recordId,
  details,
  ipAddress,
}: {
  userId?: number | null;
  action: string; // LOGIN, LOGOUT, CREATE, UPDATE, DELETE, ARCHIVE, UNARCHIVE
  screen: string;
  recordId?: number | null;
  details?: string | Record<string, unknown> | null;
  ipAddress?: string | null;
}) {
  try {
    const detailsStr =
      typeof details === "object" && details !== null
        ? JSON.stringify(details)
        : details || null;

    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        screen,
        recordId: recordId || null,
        details: detailsStr,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
