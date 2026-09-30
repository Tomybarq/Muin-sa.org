import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getUserDataScope } from "@/lib/dataScoping";
import AssociationsClient from "@/components/portal/AssociationsClient";

export default async function AssociationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("associations");
  const session = await getSession();
  const scope = session ? await getUserDataScope(session.userId) : null;
  const whereAssoc = scope ? { isArchived: false, ...scope.assocWhere } : { isArchived: false };

  const [associations, categories, users, cities, governorates] = await Promise.all([
    prisma.association.findMany({
      where: whereAssoc,
      include: {
        category: true,
        governorate: true,
        logo: {
          select: {
            id: true,
            originalName: true,
            mimetype: true,
            fileSize: true,
            width: true,
            height: true,
          },
        },
        city: {
          include: { governorate: true }
        },
        managerUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.associationCategory.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.city.findMany({
      include: { governorate: true },
      orderBy: { nameAr: "asc" },
    }),
    prisma.governorate.findMany({
      orderBy: { id: "asc" },
    }),
  ]);

  // Serialize associations for client component
  const serializedAssociations = associations.map((assoc) => ({
    id: assoc.id,
    name: assoc.name,
    manager: assoc.manager,
    managerId: assoc.managerId,
    managerUser: assoc.managerUser,
    phone: assoc.phone,
    email: assoc.email,
    governorateId: assoc.governorateId,
    governorate: assoc.governorate,
    cityId: assoc.cityId,
    city: assoc.city,
    categoryId: assoc.categoryId,
    category: assoc.category,
    donationUrl: assoc.donationUrl,
    logoId: assoc.logoId,
    logo: assoc.logo,
    logoUrl: assoc.logo ? `/api/attachments/${assoc.logo.id}/file` : null,
    isActive: assoc.isActive,
    isArchived: assoc.isArchived,
    createdAt: assoc.createdAt.toISOString(),
  }));

  const serializedCategories = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    nameAr: cat.nameAr,
  }));

  const serializedUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
  }));

  const serializedCities = cities.map((c) => ({
    id: c.id,
    name: c.name,
    nameAr: c.nameAr,
    governorateId: c.governorateId,
    governorate: c.governorate,
  }));

  const serializedGovernorates = governorates.map((g) => ({
    id: g.id,
    name: g.name,
    nameAr: g.nameAr,
  }));

  return (
    <Suspense fallback={<div className="text-sm text-slate-500 p-4">{locale === "ar" ? "جاري التحميل..." : "Loading..."}</div>}>
      <AssociationsClient
        initialAssociations={serializedAssociations}
        categories={serializedCategories}
        cities={serializedCities}
        governorates={serializedGovernorates}
        users={serializedUsers}
        title={t("title")}
        emptyMessage={t("empty")}
        locale={locale}
      />
    </Suspense>
  );
}
