"use client";

import React from "react";
import ImportClient from "./ImportClient";
import type { ExportField } from "@/components/ui/ExportModal";

interface CategoryRef {
  id: number;
  name: string;
  nameAr: string | null;
}

interface CityRef {
  id: number;
  name: string;
  nameAr: string;
  governorateId: number;
  governorate: { id: number; name: string; nameAr: string };
}

interface GovernorateRef {
  id: number;
  name: string;
  nameAr: string;
}

export default function AssociationsImport({
  locale,
  tableName,
  categories,
  cities,
  governorates,
}: {
  locale: string;
  tableName: string;
  categories: CategoryRef[];
  cities: CityRef[];
  governorates: GovernorateRef[];
}) {
  const isAr = locale === "ar";

  const govFieldKey = isAr ? "governorate.nameAr" : "governorate.name";
  const cityFieldKey = isAr ? "city.nameAr" : "city.name";

  // Build city → governorate map for cascading dropdowns
  const cityParentValueMap: Record<string, string[]> = {};
  for (const city of cities) {
    const govName = isAr ? city.governorate.nameAr : city.governorate.name;
    const cityName = isAr ? (city.nameAr || city.name) : city.name;
    if (!cityParentValueMap[govName]) cityParentValueMap[govName] = [];
    cityParentValueMap[govName].push(cityName);
  }

  const exportFields: ExportField[] = [
    { key: "id", label: "ID", labelAr: "المعرف" },
    { key: "name", label: "Name", labelAr: "الاسم" },
    { key: "logoUrl", label: "Logo", labelAr: "الشعار", type: "image" },
    { key: "manager", label: "Manager", labelAr: "المسؤول" },
    { key: "phone", label: "Phone", labelAr: "الهاتف" },
    { key: "email", label: "Email", labelAr: "البريد الإلكتروني" },
    { key: isAr ? "category.nameAr" : "category.name", label: "Category", labelAr: "التصنيف", options: categories.map((c) => isAr ? (c.nameAr || c.name) : c.name) },
    { key: govFieldKey, label: "Governorate", labelAr: "المنطقة", options: governorates.map((g) => isAr ? g.nameAr : g.name) },
    { key: cityFieldKey, label: "City", labelAr: "المدينة", dependentOn: govFieldKey, parentValueMap: cityParentValueMap },
    { key: "donationUrl", label: "Donation URL", labelAr: "رابط التبرع" },
    { key: "createdAt", label: "Created At", labelAr: "تاريخ الإنشاء" },
  ];

  const lookupValue = (row: Record<string, any>, keys: string[]): string | null => {
    for (const k of keys) {
      const v = row[k];
      if (v != null && String(v).trim() !== "") return String(v).trim();
    }
    return null;
  };

  const onTest = async (rows: Record<string, any>[]) => {
    const errors: { row: number; field: string; message: string }[] = [];
    const missingByField: Record<string, Set<string>> = {};

    const addMissing = (field: string, value: string) => {
      if (!missingByField[field]) missingByField[field] = new Set();
      missingByField[field].add(value);
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      if (!row.name || String(row.name).trim() === "") {
        errors.push({ row: rowNum, field: "name", message: isAr ? "الاسم مطلوب" : "Name is required" });
      }
      if (!row.manager || String(row.manager).trim() === "") {
        errors.push({ row: rowNum, field: "manager", message: isAr ? "المسؤول مطلوب" : "Manager is required" });
      }
      if (!row.phone || String(row.phone).trim() === "") {
        errors.push({ row: rowNum, field: "phone", message: isAr ? "الهاتف مطلوب" : "Phone is required" });
      }
      if (!row.email || String(row.email).trim() === "") {
        errors.push({ row: rowNum, field: "email", message: isAr ? "البريد الإلكتروني مطلوب" : "Email is required" });
      }

      const catVal = lookupValue(row, ["category.name", "category.nameAr", "category"]);
      if (catVal) {
        const found = categories.some((c) => c.name === catVal || c.nameAr === catVal);
        if (!found) {
          addMissing("category", catVal);
          errors.push({
            row: rowNum,
            field: "category",
            message: isAr
              ? `التصنيف "${catVal}" غير موجود`
              : `Category "${catVal}" not found`,
          });
        }
      }

      const cityVal = lookupValue(row, ["city.name", "city.nameAr", "city"]);
      if (cityVal) {
        const found = cities.some((c) => c.name === cityVal || c.nameAr === cityVal);
        if (!found) {
          addMissing("city", cityVal);
          errors.push({
            row: rowNum,
            field: "city",
            message: isAr
              ? `المدينة "${cityVal}" غير موجودة`
              : `City "${cityVal}" not found`,
          });
        }
      }

      const govVal = lookupValue(row, ["governorate.name", "governorate.nameAr", "governorate", "city.governorate.name", "city.governorate.nameAr"]);
      if (govVal) {
        const found = governorates.some((g) => g.name === govVal || g.nameAr === govVal);
        if (!found) {
          addMissing("governorate", govVal);
          errors.push({
            row: rowNum,
            field: "governorate",
            message: isAr
              ? `المنطقة "${govVal}" غير موجودة`
              : `Governorate "${govVal}" not found`,
          });
        }
      }
    }

    const fieldKeyMap: Record<string, string> = {
      category: isAr ? "category.nameAr" : "category.name",
      city: isAr ? "city.nameAr" : "city.name",
      governorate: isAr ? "governorate.nameAr" : "governorate.name",
    };

    const referenceErrors = Object.entries(missingByField)
      .filter(([_, vals]) => vals.size > 0)
      .map(([field, vals]) => ({ field, missingValues: [...vals] }));

    const refFields = new Set(Object.keys(fieldKeyMap));
    const remainingErrors = errors.filter((e) => !refFields.has(e.field));

    return { valid: remainingErrors.length === 0, errors: remainingErrors, referenceErrors };
  };

  const onImport = async (rows: Record<string, any>[], fieldFixes: Record<string, "skip" | "create">) => {
    try {
      const res = await fetch("/api/associations/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, locale, fieldFixes }),
      });
      const data = await res.json();
      return data;
    } catch {
      return { success: false, errors: [isAr ? "فشل الاتصال بالخادم" : "Failed to connect to server"] };
    }
  };

  return (
    <ImportClient
      locale={locale}
      tableName={tableName}
      tableLabelAr="الجمعيات"
      availableFields={exportFields}
      onTest={onTest}
      onImport={onImport}
    />
  );
}
