import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/auditLogger";
import { marketerSchema } from "@/lib/zodSchemas";

import { checkEmailUniqueness } from "@/lib/checkEmailUniqueness";

import { getUserDataScope } from "@/lib/dataScoping";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const scope = await getUserDataScope(session.userId);
    const { searchParams } = new URL(req.url);
    const showArchived = searchParams.get("archived") === "true";
    const statusFilter = searchParams.get("status");

    let where: any = { ...scope.marketerWhere };
    if (showArchived || statusFilter === "archived") {
      where.isArchived = true;
    } else if (statusFilter === "active") {
      where.isArchived = false;
    } else if (statusFilter === "inactive") {
      where.isArchived = false;
      where.isActive = false;
    }

    const marketers = await prisma.marketer.findMany({
      where,
      include: {
        governorate: true,
        city: true,
        image: {
          select: { id: true, originalName: true, mimetype: true, fileSize: true },
        },
        contractAttachment: {
          select: { id: true, originalName: true, mimetype: true, fileSize: true },
        },
        bankAccounts: true,
        associations: {
          include: {
            association: {
              select: { id: true, name: true, phone: true, email: true },
            },
          },
        },
        users: {
          select: { id: true, name: true, email: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = marketers.map((m) => ({
      ...m,
      imageUrl: m.image ? `/api/attachments/${m.image.id}/file` : null,
      contractUrl: m.contractAttachment ? `/api/attachments/${m.contractAttachment.id}/file` : null,
      image: m.image
        ? {
            ...m.image,
            name: m.image.originalName,
            url: `/api/attachments/${m.image.id}/file`,
          }
        : null,
      contractAttachment: m.contractAttachment
        ? {
            ...m.contractAttachment,
            name: m.contractAttachment.originalName,
            url: `/api/attachments/${m.contractAttachment.id}/file`,
          }
        : null,
    }));

    return NextResponse.json({ marketers: formatted });
  } catch (err: any) {
    console.error("[MARKETERS GET ERROR]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = marketerSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Validation error";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const val = result.data;

    // Check unique email across User, Marketer, Association
    if (val.email) {
      const emailCheck = await checkEmailUniqueness(val.email, undefined, body.locale || "ar");
      if (emailCheck.inUse) {
        return NextResponse.json({ error: emailCheck.message }, { status: 400 });
      }
    }

    const bankAccounts = body.bankAccounts || [];
    const associations = body.associations || [];

    const marketer = await prisma.marketer.create({
      data: {
        name: val.name.trim(),
        type: val.type,
        email: val.email ? val.email.toLowerCase().trim() : null,
        phone: val.phone ? val.phone.trim() : null,
        identityType: val.identityType || null,
        identityNumber: val.identityNumber ? val.identityNumber.trim() : null,
        commercialRegistration: val.commercialRegistration ? val.commercialRegistration.trim() : null,
        governorateId: val.governorateId || null,
        cityId: val.cityId || null,
        imageId: val.imageId || null,
        contractAttachmentId: val.contractAttachmentId || null,
        bankAccounts: bankAccounts.length > 0 ? {
          create: bankAccounts.map((b: any) => ({
            bankName: b.bankName,
            accountHolderName: b.accountHolderName,
            accountNumber: b.accountNumber || null,
            iban: b.iban,
          })),
        } : undefined,
        associations: associations.length > 0 ? {
          create: associations.map((a: any) => ({
            associationId: Number(a.associationId),
            phoneNumbers: Array.isArray(a.phoneNumbers) ? a.phoneNumbers : [],
          })),
        } : undefined,
      },
      include: {
        governorate: true,
        city: true,
        image: {
          select: { id: true, originalName: true, mimetype: true, fileSize: true },
        },
        contractAttachment: {
          select: { id: true, originalName: true, mimetype: true, fileSize: true },
        },
        bankAccounts: true,
        associations: {
          include: { association: true },
        },
      },
    });

    const formattedMarketer = {
      ...marketer,
      imageUrl: marketer.image ? `/api/attachments/${marketer.image.id}/file` : null,
      contractUrl: marketer.contractAttachment ? `/api/attachments/${marketer.contractAttachment.id}/file` : null,
      contractAttachmentUrl: marketer.contractAttachment ? `/api/attachments/${marketer.contractAttachment.id}/file` : null,
      image: marketer.image
        ? {
            ...marketer.image,
            name: marketer.image.originalName,
            url: `/api/attachments/${marketer.image.id}/file`,
          }
        : null,
      contractAttachment: marketer.contractAttachment
        ? {
            ...marketer.contractAttachment,
            name: marketer.contractAttachment.originalName,
            url: `/api/attachments/${marketer.contractAttachment.id}/file`,
          }
        : null,
    };

    await logAudit({
      userId: session.userId,
      action: "CREATE",
      screen: "marketers",
      recordId: marketer.id,
      details: { name: marketer.name, type: marketer.type },
    });

    return NextResponse.json({ marketer: formattedMarketer }, { status: 201 });
  } catch (err: any) {
    console.error("[MARKETERS POST ERROR]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
