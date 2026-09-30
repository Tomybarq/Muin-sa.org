import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { importImage } from "@/lib/importImage";
import { decodeId } from "@/lib/idObfuscator";
import { checkEmailUniqueness } from "@/lib/checkEmailUniqueness";

export async function POST(request: Request) {
  try {
    const { rows, locale, fieldFixes } = await request.json();
    const isAr = locale === "ar";

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, errors: [isAr ? "لا توجد بيانات" : "No data provided"] }, { status: 400 });
    }

    const results: { row: number; field: string; message: string }[] = [];
    const created: number[] = [];
    const updated: number[] = [];

    // Create missing reference records before processing rows
    if (fieldFixes?.category === "create") {
      const existingCats = await prisma.associationCategory.findMany({ select: { id: true, name: true, nameAr: true } });
      const seen = new Set(existingCats.flatMap((c) => [c.name, c.nameAr].filter(Boolean)));
      let nextId = Math.max(...existingCats.map((c) => c.id), 0) + 1;
      for (const row of rows) {
        const val = String(row["category.name"] || row["category.nameAr"] || row.category || "").trim();
        if (val && !seen.has(val)) {
          await prisma.associationCategory.create({ data: { id: nextId++, name: val, nameAr: val } });
          seen.add(val);
        }
      }
    }

    if (fieldFixes?.governorate === "create") {
      const existingGovs = await prisma.governorate.findMany({ select: { id: true, name: true, nameAr: true } });
      const seen = new Set(existingGovs.flatMap((g) => [g.name, g.nameAr]));
      let nextId = Math.max(...existingGovs.map((g) => g.id), 0) + 1;
      for (const row of rows) {
        const val = String(row["governorate.name"] || row["governorate.nameAr"] || row.governorate || row["city.governorate.name"] || row["city.governorate.nameAr"] || "").trim();
        if (val && !seen.has(val)) {
          await prisma.governorate.create({ data: { id: nextId++, name: val, nameAr: val } });
          seen.add(val);
        }
      }
    }

    if (fieldFixes?.city === "create") {
      const existingCities = await prisma.city.findMany({ select: { id: true, name: true, nameAr: true } });
      const seen = new Set(existingCities.flatMap((c) => [c.name, c.nameAr].filter(Boolean)));
      let nextId = Math.max(...existingCities.map((c) => c.id), 0) + 1;
      for (const row of rows) {
        const cityVal = String(row["city.name"] || row["city.nameAr"] || row.city || "").trim();
        if (!cityVal || seen.has(cityVal)) continue;

        const govVal = String(row["governorate.name"] || row["governorate.nameAr"] || row.governorate || row["city.governorate.name"] || row["city.governorate.nameAr"] || "").trim();
        let gov =
          govVal
            ? await prisma.governorate.findFirst({ where: { OR: [{ name: govVal }, { nameAr: govVal }] } })
            : null;
        if (!gov) gov = await prisma.governorate.findFirst({ orderBy: { id: "asc" } });

        await prisma.city.create({ data: { id: nextId++, name: cityVal, nameAr: cityVal, governorateId: gov?.id || 1 } });
        seen.add(cityVal);
      }
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      // Validate required fields
      if (!row.name || String(row.name).trim() === "") {
        results.push({ row: rowNum, field: "name", message: isAr ? "الاسم مطلوب" : "Name is required" });
        continue;
      }
      if (!row.manager || String(row.manager).trim() === "") {
        results.push({ row: rowNum, field: "manager", message: isAr ? "المسؤول مطلوب" : "Manager is required" });
        continue;
      }
      if (!row.phone || String(row.phone).trim() === "") {
        results.push({ row: rowNum, field: "phone", message: isAr ? "الهاتف مطلوب" : "Phone is required" });
        continue;
      }
      if (!row.email || String(row.email).trim() === "") {
        results.push({ row: rowNum, field: "email", message: isAr ? "البريد الإلكتروني مطلوب" : "Email is required" });
        continue;
      }

      const rawId = row.id;
      const assocIdVal = typeof rawId === "string" ? decodeId(rawId) : typeof rawId === "number" ? rawId : undefined;
      const emailStr = String(row.email).trim();
      const emailCheck = await checkEmailUniqueness(emailStr, { associationId: assocIdVal || undefined });
      if (emailCheck.inUse) {
        results.push({
          row: rowNum,
          field: "email",
          message: emailCheck.message || (isAr ? `البريد الإلكتروني "${emailStr}" مضاف مسبقاً` : `Email "${emailStr}" is already registered`),
        });
        continue;
      }

      // Look up category by name
      let categoryId: number | null = null;
      let catName: string | null = null;
      if (row["category.name"] || row["category.nameAr"] || row.category) {
        catName = String(row["category.name"] || row["category.nameAr"] || row.category).trim();
        const category = await prisma.associationCategory.findFirst({
          where: {
            OR: [
              { name: catName },
              { nameAr: catName },
            ],
          },
        });
        if (category) categoryId = category.id;
      } else {
        const defaultCat = await prisma.associationCategory.findFirst({ orderBy: { id: "asc" } });
        if (defaultCat) categoryId = defaultCat.id;
      }

      // Look up governorate by name
      let governorateId: number | null = null;
      const govVal = String(row["governorate.name"] || row["governorate.nameAr"] || row.governorate || row["city.governorate.name"] || row["city.governorate.nameAr"] || "").trim();
      if (govVal) {
        const gov = await prisma.governorate.findFirst({
          where: { OR: [{ name: govVal }, { nameAr: govVal }] },
        });
        if (gov) governorateId = gov.id;
      }

      // Look up city by name
      let cityId: number | null = null;
      let cityName: string | null = null;
      if (row["city.name"] || row["city.nameAr"] || row.city) {
        cityName = String(row["city.name"] || row["city.nameAr"] || row.city).trim();
        const city = await prisma.city.findFirst({
          where: {
            OR: [
              { name: cityName },
              { nameAr: cityName },
            ],
          },
          include: { governorate: true },
        });
        if (city) {
          cityId = city.id;
          if (!governorateId) governorateId = city.governorateId;
        }
      }

      if (!cityId && fieldFixes?.city === "skip" && govVal) {
        // Look for any city in the same governorate
        const fallbackCity = await prisma.city.findFirst({
          where: {
            governorate: {
              OR: [{ name: govVal }, { nameAr: govVal }],
            },
          },
          orderBy: { id: "asc" },
          select: { id: true, governorateId: true },
        });
        if (fallbackCity) {
          cityId = fallbackCity.id;
          if (!governorateId) governorateId = fallbackCity.governorateId;
        }
      }

      if (!cityId) {
        const defaultCity = await prisma.city.findFirst({ orderBy: { id: "asc" } });
        if (defaultCity) {
          cityId = defaultCity.id;
          if (!governorateId) governorateId = defaultCity.governorateId;
        }
      }

      if (!governorateId) {
        const defaultGov = await prisma.governorate.findFirst({ orderBy: { id: "asc" } });
        if (defaultGov) governorateId = defaultGov.id;
      }

      if (!categoryId) {
        if (fieldFixes?.category === "skip") {
          const fallback = await prisma.associationCategory.findFirst({ orderBy: { id: "asc" } });
          if (fallback) categoryId = fallback.id;
        }
        if (!categoryId) {
          results.push({
            row: rowNum,
            field: "category",
            message: isAr
              ? `التصنيف "${catName || ""}" غير موجود`
              : `Category "${catName || ""}" not found`,
          });
          continue;
        }
      }
      if (!cityId) {
        if (fieldFixes?.city === "skip") {
          const fallback = await prisma.city.findFirst({ orderBy: { id: "asc" } });
          if (fallback) cityId = fallback.id;
        }
        if (!cityId) {
          results.push({
            row: rowNum,
            field: "city",
            message: isAr
              ? `المدينة "${cityName || ""}" غير موجودة`
              : `City "${cityName || ""}" not found`,
          });
          continue;
        }
      }

      try {
        const existingId = row.id ? decodeId(row.id) : null;
        
        let logoId: number | null = null;
        if (row.logoUrl || row.logo) {
          logoId = await importImage(row.logoUrl || row.logo, "association");
        }

        const data: any = {
          name: String(row.name).trim(),
          manager: String(row.manager).trim(),
          phone: String(row.phone).trim(),
          email: String(row.email).trim(),
          governorateId: governorateId || 1,
          categoryId,
          cityId,
          donationUrl: row.donationUrl ? String(row.donationUrl).trim() : null,
        };

        if (logoId) {
          data.logoId = logoId;
        }

        if (existingId && !isNaN(existingId)) {
          const existing = await prisma.association.findUnique({ where: { id: existingId } });
          if (existing) {
            await prisma.association.update({ where: { id: existingId }, data });
            updated.push(existingId);
          } else {
            const assoc = await prisma.association.create({ data });
            created.push(assoc.id);
          }
        } else {
          const assoc = await prisma.association.create({ data });
          created.push(assoc.id);
        }
      } catch (err: any) {
        results.push({ row: rowNum, field: "general", message: err.message || (isAr ? "خطأ غير معروف" : "Unknown error") });
      }
    }

    const summary: string[] = [];
    if (created.length > 0) summary.push(isAr ? `إنشاء ${created.length}` : `${created.length} created`);
    if (updated.length > 0) summary.push(isAr ? `تحديث ${updated.length}` : `${updated.length} updated`);
    if (results.length > 0) summary.push(isAr ? `أخطاء ${results.length}` : `${results.length} errors`);

    return NextResponse.json({
      success: results.length === 0,
      errors: results.length > 0
        ? results.map((r) => `Row ${r.row}: ${r.field} — ${r.message}`)
        : undefined,
      created: created.length,
      updated: updated.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, errors: [err.message || "Unknown error"] },
      { status: 500 }
    );
  }
}
