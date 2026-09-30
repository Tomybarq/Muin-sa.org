import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import AssociationsImport from "./associations-import";
import BeneficiariesImport from "./beneficiaries-import";
import MarketersImport from "./marketers-import";

export default async function ImportPage({
  params,
}: {
  params: Promise<{ locale: string; tableName: string }>;
}) {
  const { locale, tableName } = await params;

  const validTables = ["associations", "beneficiaries", "marketers"];
  if (!validTables.includes(tableName)) {
    notFound();
  }

  if (tableName === "associations") {
    const [categories, cities, governorates] = await Promise.all([
      prisma.associationCategory.findMany({ orderBy: { name: "asc" } }),
      prisma.city.findMany({ include: { governorate: true }, orderBy: { name: "asc" } }),
      prisma.governorate.findMany({ orderBy: { id: "asc" } }),
    ]);

    return (
      <AssociationsImport
        locale={locale}
        tableName={tableName}
        categories={categories.map((c) => ({ id: c.id, name: c.name, nameAr: c.nameAr }))}
        cities={cities.map((c) => ({ id: c.id, name: c.name, nameAr: c.nameAr, governorateId: c.governorateId, governorate: { id: c.governorate.id, name: c.governorate.name, nameAr: c.governorate.nameAr } }))}
        governorates={governorates.map((g) => ({ id: g.id, name: g.name, nameAr: g.nameAr }))}
      />
    );
  }

  if (tableName === "beneficiaries") {
    return (
      <BeneficiariesImport
        locale={locale}
        tableName={tableName}
      />
    );
  }

  if (tableName === "marketers") {
    const [cities, governorates] = await Promise.all([
      prisma.city.findMany({ include: { governorate: true }, orderBy: { name: "asc" } }),
      prisma.governorate.findMany({ orderBy: { id: "asc" } }),
    ]);

    return (
      <MarketersImport
        locale={locale}
        tableName={tableName}
        cities={cities.map((c) => ({ id: c.id, name: c.name, nameAr: c.nameAr, governorateId: c.governorateId, governorate: { id: c.governorate.id, name: c.governorate.name, nameAr: c.governorate.nameAr } }))}
        governorates={governorates.map((g) => ({ id: g.id, name: g.name, nameAr: g.nameAr }))}
      />
    );
  }

  notFound();
}
