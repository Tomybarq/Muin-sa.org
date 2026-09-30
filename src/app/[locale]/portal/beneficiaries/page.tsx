import { getTranslations } from "next-intl/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getUserDataScope } from "@/lib/dataScoping";
import BeneficiariesClient from "@/components/portal/BeneficiariesClient";

export default async function BeneficiariesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("beneficiaries");
  const session = await getSession();
  const scope = session ? await getUserDataScope(session.userId) : null;
  const whereBen = scope ? { isArchived: false, ...scope.beneficiaryWhere } : { isArchived: false };

  const beneficiaries = await prisma.beneficiary.findMany({
    where: whereBen,
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

  const serialized = beneficiaries.map((b) => ({
    ...b,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    photoUrl: b.photo ? `/api/attachments/${b.photo.id}/file` : (b.photoId ? `/api/attachments/${b.photoId}/file` : null),
    buildingPhotoUrl: b.buildingPhoto ? `/api/attachments/${b.buildingPhoto.id}/file` : (b.buildingPhotoId ? `/api/attachments/${b.buildingPhotoId}/file` : null),
    dependentCount: b._count.dependents,
    _count: undefined,
  }));

  return (
    <BeneficiariesClient
      initialBeneficiaries={serialized}
      title={t("title")}
      locale={locale}
    />
  );
}
