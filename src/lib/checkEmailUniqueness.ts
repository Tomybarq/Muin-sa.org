import prisma from "@/lib/prisma";

export interface EmailCheckExclude {
  userId?: number;
  marketerId?: number;
  associationId?: number;
}

export interface EmailCheckResult {
  inUse: boolean;
  usedBy?: "user" | "marketer" | "association";
  message?: string;
}

/**
 * Checks if an email address is already in use across User, Marketer, or Association tables.
 * Supports bilingual responses based on the provided locale ('ar' | 'en').
 */
export async function checkEmailUniqueness(
  email: string | null | undefined,
  exclude?: EmailCheckExclude,
  locale: string = "ar"
): Promise<EmailCheckResult> {
  if (!email) return { inUse: false };
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail) return { inUse: false };

  const isAr = locale !== "en";
  const duplicateMsg = isAr ? "البريد الإلكتروني مستخدم بالفعل" : "Email address is already in use";

  // 1. Check User table
  const existingUser = await prisma.user.findFirst({
    where: {
      email: cleanEmail,
      ...(exclude?.userId ? { NOT: { id: exclude.userId } } : {}),
    },
    select: { id: true },
  });
  if (existingUser) {
    return {
      inUse: true,
      usedBy: "user",
      message: duplicateMsg,
    };
  }

  // 2. Check Marketer table
  const existingMarketer = await prisma.marketer.findFirst({
    where: {
      email: cleanEmail,
      ...(exclude?.marketerId ? { NOT: { id: exclude.marketerId } } : {}),
    },
    select: { id: true },
  });
  if (existingMarketer) {
    return {
      inUse: true,
      usedBy: "marketer",
      message: duplicateMsg,
    };
  }

  // 3. Check Association table
  const existingAssoc = await prisma.association.findFirst({
    where: {
      email: cleanEmail,
      ...(exclude?.associationId ? { NOT: { id: exclude.associationId } } : {}),
    },
    select: { id: true },
  });
  if (existingAssoc) {
    return {
      inUse: true,
      usedBy: "association",
      message: duplicateMsg,
    };
  }

  return { inUse: false };
}
