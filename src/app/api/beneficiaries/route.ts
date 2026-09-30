import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/auditLogger";
import { getUserDataScope } from "@/lib/dataScoping";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const scope = await getUserDataScope(session.userId);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortDir = searchParams.get("sortDir") || "desc";
    const showArchived = searchParams.get("archived") === "true";
    const statusFilter = searchParams.get("status");

    let where: any = { ...scope.beneficiaryWhere };
    if (showArchived || statusFilter === "archived") {
      where.isArchived = true;
    } else if (statusFilter === "active") {
      where.isArchived = false;
    } else if (statusFilter === "inactive") {
      where.isArchived = false;
      where.isActive = false;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { nationalId: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const beneficiaries = await prisma.beneficiary.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      include: {
        association: { select: { id: true, name: true } },
        photo: { select: { id: true } },
        buildingPhoto: { select: { id: true } },
        dependents: true,
        incomeAssets: { include: { incomeAsset: true } },
        serviceBills: { include: { serviceBill: true } },
        donationPackages: true,
        _count: { select: { dependents: true } },
      },
    });

    return NextResponse.json(
      beneficiaries.map((b) => ({
        ...b,
        photoUrl: b.photo ? `/api/attachments/${b.photo.id}/file` : (b.photoId ? `/api/attachments/${b.photoId}/file` : null),
        buildingPhotoUrl: b.buildingPhoto ? `/api/attachments/${b.buildingPhoto.id}/file` : (b.buildingPhotoId ? `/api/attachments/${b.buildingPhotoId}/file` : null),
        dependentCount: b._count.dependents,
        _count: undefined,
      }))
    );
  } catch (err: any) {
    console.error("[BENEFICIARIES GET ERROR]", err);
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
    if (!body.associationId) {
      return NextResponse.json({ error: "الجمعية حقل إلزامي", field: "associationId" }, { status: 400 });
    }

    const beneficiary = await prisma.beneficiary.create({
      data: {
        associationId: Number(body.associationId),
        fullName: body.fullName,
        nationalId: body.nationalId,
        birthDate: body.birthDate,
        maritalStatus: body.maritalStatus,
        educationLevel: body.educationLevel,
        healthStatus: body.healthStatus,
        diseaseType: body.diseaseType || null,
        disabilityType: body.disabilityType || null,
        phone: body.phone,
        alternatePhone: body.alternatePhone || null,
        totalFamilyMembers: body.totalFamilyMembers ? Number(body.totalFamilyMembers) : null,
        address: body.address,
        photoId: body.photoId ? Number(body.photoId) : null,
        addressProofId: body.addressProofId ? Number(body.addressProofId) : null,
        researcherOpinion: body.researcherOpinion || null,
        dependentsOpinion: body.dependentsOpinion || null,
        dependents: body.dependents?.length ? {
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
        incomeAssets: body.incomeAssets?.length
          ? { create: body.incomeAssets.map((id: string) => ({ incomeAssetId: Number(id) })) }
          : undefined,
        totalIncome: body.totalIncome ?? null,
        rentAmount: body.rentAmount ?? null,
        electricityBill: body.electricityBill ?? null,
        waterBill: body.waterBill ?? null,
        internetBill: body.internetBill ?? null,
        phoneBill: body.phoneBill ?? null,
        gasBill: body.gasBill ?? null,
        serviceBills: body.serviceBills?.length
          ? { create: body.serviceBills.map((id: string) => ({ serviceBillId: Number(id) })) }
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
        donationPackages: body.donationPackages?.length
          ? { create: body.donationPackages.map((d: any) => ({ program: d.program, cost: d.cost })) }
          : undefined,
        finalRecommendation: body.finalRecommendation ?? null,
        caseClassification: body.caseClassification ?? null,
        buildingPhotoId: body.buildingPhotoId ? Number(body.buildingPhotoId) : null,
        fieldPhotos: body.fieldPhotos?.length
          ? { create: body.fieldPhotos.map((fp: any) => ({ photoType: fp.photoType, attachmentId: Number(fp.attachmentId), sortOrder: fp.sortOrder ?? 0 })) }
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

    await logAudit({
      userId: session.userId,
      action: "CREATE",
      screen: "beneficiaries",
      recordId: beneficiary.id,
      details: { fullName: beneficiary.fullName, nationalId: beneficiary.nationalId },
    });

    return NextResponse.json({
      ...beneficiary,
      createdAt: beneficiary.createdAt.toISOString(),
      updatedAt: beneficiary.updatedAt.toISOString(),
      photoUrl: beneficiary.photo ? `/api/attachments/${beneficiary.photo.id}/file` : (beneficiary.photoId ? `/api/attachments/${beneficiary.photoId}/file` : null),
      buildingPhotoUrl: beneficiary.buildingPhoto ? `/api/attachments/${beneficiary.buildingPhoto.id}/file` : (beneficiary.buildingPhotoId ? `/api/attachments/${beneficiary.buildingPhotoId}/file` : null),
      dependentCount: beneficiary._count.dependents,
      _count: undefined,
    }, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "رقم الهوية موجود مسبقاً" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Creation failed" },
      { status: 500 }
    );
  }
}
