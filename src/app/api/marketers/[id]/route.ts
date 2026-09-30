import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/auditLogger";
import { decodeId } from "@/lib/idObfuscator";

import { checkEmailUniqueness } from "@/lib/checkEmailUniqueness";

function parseMarketerId(rawId: string): number | null {
  const decoded = decodeId(rawId);
  if (decoded !== null) return decoded;
  const num = parseInt(rawId, 10);
  return isNaN(num) ? null : num;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const marketerId = parseMarketerId(id);
    if (!marketerId) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const marketer = await prisma.marketer.findUnique({
      where: { id: marketerId },
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
    });

    if (!marketer) {
      return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
    }

    const formatted = {
      ...marketer,
      imageUrl: marketer.image ? `/api/attachments/${marketer.image.id}/file` : null,
      contractUrl: marketer.contractAttachment ? `/api/attachments/${marketer.contractAttachment.id}/file` : null,
    };

    return NextResponse.json({ marketer: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const marketerId = parseMarketerId(id);
    if (!marketerId) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      type,
      email,
      phone,
      identityType,
      identityNumber,
      commercialRegistration,
      governorateId,
      cityId,
      imageId,
      contractAttachmentId,
      isActive,
      isArchived,
      bankAccounts,
      associations,
    } = body;

    if (email !== undefined && email) {
      const emailCheck = await checkEmailUniqueness(email, { marketerId }, body.locale || "ar");
      if (emailCheck.inUse) {
        return NextResponse.json({ error: emailCheck.message }, { status: 400 });
      }
    }

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name.trim();
    if (type) dataToUpdate.type = type;
    if (email !== undefined) dataToUpdate.email = email ? email.toLowerCase().trim() : null;
    if (phone !== undefined) dataToUpdate.phone = phone ? phone.trim() : null;
    if (identityType !== undefined) dataToUpdate.identityType = identityType || null;
    if (identityNumber !== undefined) dataToUpdate.identityNumber = identityNumber ? identityNumber.trim() : null;
    if (commercialRegistration !== undefined) dataToUpdate.commercialRegistration = commercialRegistration ? commercialRegistration.trim() : null;
    if (governorateId !== undefined) dataToUpdate.governorateId = governorateId || null;
    if (cityId !== undefined) dataToUpdate.cityId = cityId || null;
    if (imageId !== undefined) dataToUpdate.imageId = imageId || null;
    if (contractAttachmentId !== undefined) dataToUpdate.contractAttachmentId = contractAttachmentId || null;
    if (typeof isActive === "boolean") dataToUpdate.isActive = isActive;
    if (typeof isArchived === "boolean") dataToUpdate.isArchived = isArchived;

    // Transaction to update marketer and relations
    const marketer = await prisma.$transaction(async (tx) => {
      // Update bank accounts if provided
      if (Array.isArray(bankAccounts)) {
        await tx.marketerBankAccount.deleteMany({ where: { marketerId } });
        if (bankAccounts.length > 0) {
          await tx.marketerBankAccount.createMany({
            data: bankAccounts.map((b: any) => ({
              marketerId,
              bankName: b.bankName,
              accountHolderName: b.accountHolderName,
              accountNumber: b.accountNumber || null,
              iban: b.iban,
            })),
          });
        }
      }

      // Update associations if provided
      if (Array.isArray(associations)) {
        await tx.marketerAssociation.deleteMany({ where: { marketerId } });
        if (associations.length > 0) {
          await tx.marketerAssociation.createMany({
            data: associations.map((a: any) => ({
              marketerId,
              associationId: Number(a.associationId),
              phoneNumbers: Array.isArray(a.phoneNumbers) ? a.phoneNumbers : [],
            })),
          });
        }
      }

      return await tx.marketer.update({
        where: { id: marketerId },
        data: dataToUpdate,
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
      action: "UPDATE",
      screen: "marketers",
      recordId: marketerId,
      details: { name: marketer.name, ...dataToUpdate },
    });

    return NextResponse.json({ marketer: formattedMarketer });
  } catch (err: any) {
    console.error("[MARKETER PUT ERROR]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const marketerId = parseMarketerId(id);
    if (!marketerId) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const { isActive, isArchived } = body;

    const dataToUpdate: { isActive?: boolean; isArchived?: boolean } = {};
    if (typeof isActive === "boolean") dataToUpdate.isActive = isActive;
    if (typeof isArchived === "boolean") dataToUpdate.isArchived = isArchived;

    const marketer = await prisma.marketer.update({
      where: { id: marketerId },
      data: dataToUpdate,
    });

    let actionName = "UPDATE";
    if (typeof isArchived === "boolean") actionName = isArchived ? "ARCHIVE" : "UNARCHIVE";
    else if (typeof isActive === "boolean") actionName = isActive ? "ACTIVATE" : "DEACTIVATE";

    await logAudit({
      userId: session.userId,
      action: actionName,
      screen: "marketers",
      recordId: marketerId,
      details: { name: marketer.name, ...dataToUpdate },
    });

    return NextResponse.json({ marketer });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const marketerId = parseMarketerId(id);
    if (!marketerId) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await logAudit({
      userId: session.userId,
      action: "DELETE",
      screen: "marketers",
      recordId: marketerId,
    });

    await prisma.marketer.delete({ where: { id: marketerId } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
