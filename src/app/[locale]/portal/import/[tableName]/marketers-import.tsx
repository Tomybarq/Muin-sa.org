"use client";

import React from "react";
import ImportClient from "./ImportClient";
import type { ExportField } from "@/components/ui/ExportModal";

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

export default function MarketersImport({
  locale,
  tableName,
  cities,
  governorates,
}: {
  locale: string;
  tableName: string;
  cities: CityRef[];
  governorates: GovernorateRef[];
}) {
  const isAr = locale === "ar";

  const govFieldKey = isAr ? "governorate.nameAr" : "governorate.name";
  const cityFieldKey = isAr ? "city.nameAr" : "city.name";

  const cityParentValueMap: Record<string, string[]> = {};
  for (const city of cities) {
    const govName = isAr ? city.governorate.nameAr : city.governorate.name;
    const cityName = isAr ? (city.nameAr || city.name) : city.name;
    if (!cityParentValueMap[govName]) cityParentValueMap[govName] = [];
    cityParentValueMap[govName].push(cityName);
  }

  const exportFields: ExportField[] = [
    { key: "id", label: "ID", labelAr: "المعرف" },
    { key: "name", label: "Name", labelAr: "الاسم / الجهة" },
    { key: "type", label: "Type", labelAr: "نوع المسوق" },
    { key: "phone", label: "Phone", labelAr: "رقم الجوال الشخصي" },
    { key: "email", label: "Email", labelAr: "البريد الإلكتروني" },
    { key: "identityType", label: "Identity Type", labelAr: "نوع الهوية" },
    { key: "identityNumber", label: "Identity Number", labelAr: "رقم الهوية" },
    { key: "commercialRegistration", label: "Commercial Registration", labelAr: "رقم السجل التجاري" },
    { key: govFieldKey, label: "Governorate", labelAr: "المنطقة", options: governorates.map((g) => isAr ? g.nameAr : g.name) },
    { key: cityFieldKey, label: "City", labelAr: "المدينة", dependentOn: govFieldKey, parentValueMap: cityParentValueMap },
    { key: "imageUrl", label: "Photo / Logo", labelAr: "صورة المسوق / الشعار", type: "image" },
    { key: "contractAttachmentUrl", label: "Contract", labelAr: "عقد التسويق", type: "image" },
    { key: "createdAt", label: "Created At", labelAr: "تاريخ الإنشاء" },
    { key: "bankAccounts.bankName", label: "Bank Account/Bank Name", labelAr: "اسم البنك/الحساب البنكي" },
    { key: "bankAccounts.accountHolderName", label: "Bank Account/Holder Name", labelAr: "اسم صاحب الحساب/الحساب البنكي" },
    { key: "bankAccounts.accountNumber", label: "Bank Account/Account No", labelAr: "رقم الحساب/الحساب البنكي" },
    { key: "bankAccounts.iban", label: "Bank Account/IBAN", labelAr: "الآيبان/الحساب البنكي" },
  ];

  const onTest = async (rows: Record<string, any>[]) => {
    const errors: { row: number; field: string; message: string }[] = [];
    let hasParent = false;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      const hasPrimary = Boolean(
        row.name ||
        row["الاسم / الجهة"] ||
        row["اسم المسوق"] ||
        row["اسم الجهة"] ||
        row["الاسم"] ||
        row.email ||
        row["البريد الإلكتروني"] ||
        row["البريد الالكتروني"] ||
        row.phone ||
        row["رقم الجوال الشخصي"] ||
        row["رقم الجوال"] ||
        row.identityNumber ||
        row["رقم الهوية"] ||
        row.commercialRegistration ||
        row["رقم السجل التجاري"] ||
        row.id
      );
      const hasBankData = Boolean(
        row["bankAccounts.bankName"] ||
        row["bankAccounts.accountHolderName"] ||
        row["bankAccounts.accountNumber"] ||
        row["bankAccounts.iban"] ||
        row["اسم البنك"] ||
        row["اسم صاحب الحساب"] ||
        row["رقم الحساب"] ||
        row["الآيبان"]
      );

      if (hasPrimary) {
        hasParent = true;
      } else if (hasBankData && hasParent) {
        continue;
      } else if (!hasPrimary) {
        errors.push({ row: rowNum, field: "name", message: isAr ? "اسم المسوق/الجهة مطلوب" : "Marketer Name is required" });
      }
    }

    return { valid: errors.length === 0, errors };
  };

  const onImport = async (rows: Record<string, any>[], fieldFixes: Record<string, "skip" | "create">) => {
    try {
      const res = await fetch("/api/marketers/import", {
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
      tableLabelAr="المسوقين"
      availableFields={exportFields}
      onTest={onTest}
      onImport={onImport}
    />
  );
}
