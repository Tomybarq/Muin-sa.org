import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { decodeId } from "@/lib/idObfuscator";
import { logAudit } from "@/lib/auditLogger";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const targetId = decodeId(id);
  if (!targetId) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const beneficiary = await prisma.beneficiary.findUnique({
    where: { id: targetId },
    include: { dependents: true, photo: true, addressProof: true, incomeAssets: { include: { incomeAsset: true } }, serviceBills: { include: { serviceBill: true } }, debtAttachment: true, donationPackages: true, buildingPhoto: true, fieldPhotos: { include: { attachment: true }, orderBy: { sortOrder: "asc" } } },
  });

  if (!beneficiary) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { photo, addressProof, debtAttachment, buildingPhoto, fieldPhotos, ...rest } = beneficiary;
  return NextResponse.json({
    ...rest,
    photo: photo
      ? { ...photo, data: undefined, url: `/api/attachments/${photo.id}/file` }
      : null,
    addressProof: addressProof
      ? { ...addressProof, data: undefined, url: `/api/attachments/${addressProof.id}/file` }
      : null,
    debtAttachment: debtAttachment
      ? { ...debtAttachment, data: undefined, url: `/api/attachments/${debtAttachment.id}/file` }
      : null,
    buildingPhoto: buildingPhoto
      ? { ...buildingPhoto, data: undefined, url: `/api/attachments/${buildingPhoto.id}/file` }
      : null,
    fieldPhotos: fieldPhotos.map(fp => ({
      ...fp,
      attachment: { ...fp.attachment, data: undefined, url: `/api/attachments/${fp.attachment.id}/file` },
    })),
  });
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
    const targetId = decodeId(id);
    if (!targetId) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const body = await request.json();
    if (!body.associationId) {
      return NextResponse.json({ error: "الجمعية حقل إلزامي", field: "associationId" }, { status: 400 });
    }

    const beneficiary = await prisma.beneficiary.update({
      where: { id: targetId },
      data: {
        associationId: Number(body.associationId),
        fullName: body.fullName,
        nationalId: body.nationalId,
        birthDate: body.birthDate,
        maritalStatus: body.maritalStatus,
        educationLevel: body.educationLevel,
        healthStatus: body.healthStatus,
        diseaseType: body.diseaseType ?? null,
        disabilityType: body.disabilityType ?? null,
        phone: body.phone,
        alternatePhone: body.alternatePhone ?? null,
        totalFamilyMembers: body.totalFamilyMembers ? Number(body.totalFamilyMembers) : null,
        address: body.address,
        photoId: body.photoId ? Number(body.photoId) : null,
        addressProofId: body.addressProofId ? Number(body.addressProofId) : null,
        researcherOpinion: body.researcherOpinion ?? null,
        dependentsOpinion: body.dependentsOpinion ?? null,
        dependents: body.dependents ? {
          deleteMany: {},
          create: body.dependents.map((d: any) => ({
            name: d.name,
            relationship: d.relationship,
            birthDate: d.birthDate || null,
            educationLevel: d.educationLevel,
            healthStatus: d.healthStatus,
            socialStatus: d.socialStatus,
            workStatus: d.workStatus,
          })),
        } : undefined,
        salaryIncome: body.salaryIncome ?? null,
        socialSecurity: body.socialSecurity ?? null,
        citizenAccount: body.citizenAccount ?? null,
        comprehensiveRehab: body.comprehensiveRehab ?? null,
        otherAssocSupport: body.otherAssocSupport ?? null,
        livestockCount: body.livestockCount ?? null,
        otherAssetTotal: body.otherAssetTotal ?? null,
        otherAssetDesc: body.otherAssetDesc ?? null,
        incomeAssets: body.incomeAssets
          ? { deleteMany: {}, create: body.incomeAssets.map((id: string) => ({ incomeAssetId: Number(id) })) }
          : undefined,
        totalIncome: body.totalIncome ?? null,
        rentAmount: body.rentAmount ?? null,
        electricityBill: body.electricityBill ?? null,
        waterBill: body.waterBill ?? null,
        internetBill: body.internetBill ?? null,
        phoneBill: body.phoneBill ?? null,
        gasBill: body.gasBill ?? null,
        serviceBills: body.serviceBills
          ? { deleteMany: {}, create: body.serviceBills.map((id: string) => ({ serviceBillId: Number(id) })) }
          : undefined,
        medicalExpenses: body.medicalExpenses ?? null,
        transportExpenses: body.transportExpenses ?? null,
        foodExpenses: body.foodExpenses ?? null,
        debtMonthly: body.debtMonthly ?? null,
        debtReason: body.debtReason ?? null,
        debtPeriod: body.debtPeriod ?? null,
        debtAttachmentId: body.debtAttachmentId ? Number(body.debtAttachmentId) : null,
        totalExpenses: body.totalExpenses ?? null,
        netIncome: body.netIncome ?? null,
        financialOpinion: body.financialOpinion ?? null,
        environmentType: body.environmentType ?? null,
        housingType: body.housingType ?? null,
        housingTenure: body.housingTenure ?? null,
        housingOpinion: body.housingOpinion ?? null,
        needs: body.needs ?? undefined,
        needsOpinion: body.needsOpinion ?? null,
        donationPackages: body.donationPackages
          ? { deleteMany: {}, create: body.donationPackages.map((d: any) => ({ program: d.program, cost: d.cost })) }
          : undefined,
        finalRecommendation: body.finalRecommendation ?? null,
        caseClassification: body.caseClassification ?? null,
        buildingPhotoId: body.buildingPhotoId ? Number(body.buildingPhotoId) : null,
        fieldPhotos: body.fieldPhotos
          ? { deleteMany: {}, create: body.fieldPhotos.map((fp: any) => ({ photoType: fp.photoType, attachmentId: Number(fp.attachmentId), sortOrder: fp.sortOrder ?? 0 })) }
          : undefined,
      },
      include: {
        photo: { select: { id: true } },
        buildingPhoto: { select: { id: true } },
        association: { select: { id: true, name: true } },
        dependents: true,
        incomeAssets: { include: { incomeAsset: true } },
        serviceBills: { include: { serviceBill: true } },
        donationPackages: true,
        _count: { select: { dependents: true } },
      },
    });

    return NextResponse.json({
      ...beneficiary,
      createdAt: beneficiary.createdAt.toISOString(),
      updatedAt: beneficiary.updatedAt.toISOString(),
      photoUrl: beneficiary.photo ? `/api/attachments/${beneficiary.photo.id}/file` : (beneficiary.photoId ? `/api/attachments/${beneficiary.photoId}/file` : null),
      buildingPhotoUrl: beneficiary.buildingPhoto ? `/api/attachments/${beneficiary.buildingPhoto.id}/file` : (beneficiary.buildingPhotoId ? `/api/attachments/${beneficiary.buildingPhotoId}/file` : null),
      dependentCount: beneficiary._count.dependents,
      _count: undefined,
    });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "رقم الهوية موجود مسبقاً" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Update failed" },
      { status: 500 }
    );
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
    const targetId = decodeId(id);
    if (!targetId) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await logAudit({
      userId: session.userId,
      action: "DELETE",
      screen: "beneficiaries",
      recordId: targetId,
    });

    await prisma.beneficiary.delete({ where: { id: targetId } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Delete failed" },
      { status: 500 }
    );
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
    const targetId = decodeId(id);
    if (!targetId) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const { isActive, isArchived } = body;

    const dataToUpdate: { isActive?: boolean; isArchived?: boolean } = {};
    if (typeof isActive === "boolean") dataToUpdate.isActive = isActive;
    if (typeof isArchived === "boolean") dataToUpdate.isArchived = isArchived;

    const beneficiary = await prisma.beneficiary.update({
      where: { id: targetId },
      data: dataToUpdate,
    });

    let actionName = "UPDATE";
    if (typeof isArchived === "boolean") actionName = isArchived ? "ARCHIVE" : "UNARCHIVE";
    else if (typeof isActive === "boolean") actionName = isActive ? "ACTIVATE" : "DEACTIVATE";

    await logAudit({
      userId: session.userId,
      action: actionName,
      screen: "beneficiaries",
      recordId: targetId,
      details: { fullName: beneficiary.fullName, nationalId: beneficiary.nationalId, ...dataToUpdate },
    });

    return NextResponse.json({ beneficiary });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Update failed" }, { status: 500 });
  }
}
