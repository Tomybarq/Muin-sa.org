import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getUserDataScope } from "@/lib/dataScoping";

function calculateAge(birthDateStr: string | null | undefined): number {
  if (!birthDateStr) return 0;
  const birthDate = new Date(birthDateStr);
  if (isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(age, 0);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const scope = await getUserDataScope(session.userId);

    const { searchParams } = new URL(req.url);
    const associationId = searchParams.get("associationId");
    const healthStatus = searchParams.get("healthStatus");
    const educationLevel = searchParams.get("educationLevel");
    const ageCategory = searchParams.get("ageCategory");

    const where: any = {
      isArchived: false,
      ...scope.beneficiaryWhere,
    };

    if (associationId && associationId !== "all") {
      where.associationId = Number(associationId);
    }
    if (healthStatus && healthStatus !== "all") {
      where.healthStatus = healthStatus;
    }
    if (educationLevel && educationLevel !== "all") {
      where.educationLevel = educationLevel;
    }

    const beneficiaries = await prisma.beneficiary.findMany({
      where,
      orderBy: { createdAt: "desc" },
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

    let records = beneficiaries.map((b) => {
      const computedAge = calculateAge(b.birthDate);
      return {
        ...b,
        age: computedAge,
        associationName: b.association?.name || "-",
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
        photoUrl: b.photo ? `/api/attachments/${b.photo.id}/file` : (b.photoId ? `/api/attachments/${b.photoId}/file` : null),
        buildingPhotoUrl: b.buildingPhoto ? `/api/attachments/${b.buildingPhoto.id}/file` : (b.buildingPhotoId ? `/api/attachments/${b.buildingPhotoId}/file` : null),
        dependentCount: b._count.dependents,
        _count: undefined,
      };
    });

    if (ageCategory && ageCategory !== "all") {
      if (ageCategory === "0-18") {
        records = records.filter((r) => r.age >= 0 && r.age <= 18);
      } else if (ageCategory === "19-35") {
        records = records.filter((r) => r.age >= 19 && r.age <= 35);
      } else if (ageCategory === "36-59") {
        records = records.filter((r) => r.age >= 36 && r.age <= 59);
      } else if (ageCategory === "60+") {
        records = records.filter((r) => r.age >= 60);
      }
    }

    return NextResponse.json({
      success: true,
      records,
      total: records.length,
    });
  } catch (error: any) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
