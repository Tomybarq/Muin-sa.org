import { getTranslations } from "next-intl/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getUserDataScope } from "@/lib/dataScoping";
import MarketersClient from "@/components/portal/MarketersClient";
import { getCachedGovernorates, getCachedCities } from "@/lib/locationCache";

export default async function MarketersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("marketers");
  const session = await getSession();
  const scope = session ? await getUserDataScope(session.userId) : null;
  const whereMarketer = scope ? { isArchived: false, ...scope.marketerWhere } : { isArchived: false };

  const [marketers, governorates, cities, associations] = await Promise.all([
    prisma.marketer.findMany({
      where: whereMarketer,
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
    }),
    getCachedGovernorates(),
    getCachedCities(),
    prisma.association.findMany({
      where: { isArchived: false },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedMarketers = marketers.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
    imageUrl: m.image ? `/api/attachments/${m.image.id}/file` : null,
    contractUrl: m.contractAttachment ? `/api/attachments/${m.contractAttachment.id}/file` : null,
    contractAttachmentUrl: m.contractAttachment ? `/api/attachments/${m.contractAttachment.id}/file` : null,
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
    bankAccounts: m.bankAccounts.map((b) => ({
      ...b,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    })),
    associations: m.associations.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
    users: m.users.map((u) => ({
      id: u.id,
      name: u.name || "",
      email: u.email,
      status: u.status,
    })),
  }));

  const serializedGovernorates = governorates.map((g) => ({
    id: g.id,
    name: g.name,
    nameAr: g.nameAr,
  }));

  const serializedCities = cities.map((c) => ({
    id: c.id,
    name: c.name,
    nameAr: c.nameAr,
    governorateId: c.governorateId,
  }));

  return (
    <MarketersClient
      initialMarketers={serializedMarketers}
      governorates={serializedGovernorates}
      cities={serializedCities}
      allAssociations={associations}
      title={t("title")}
      emptyMessage={t("empty")}
      nameLabel={t("name")}
      createdAtLabel={t("createdAt")}
      locale={locale}
    />
  );
}
