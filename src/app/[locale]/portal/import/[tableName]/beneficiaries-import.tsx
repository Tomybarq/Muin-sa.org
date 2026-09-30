"use client";

import React from "react";
import ImportClient from "./ImportClient";
import type { ExportField } from "@/components/ui/ExportModal";
import {
  MARITAL_OPTIONS,
  HEALTH_OPTIONS,
  EDUCATION_OPTIONS,
  DEPENDENT_RELATIONSHIP_OPTIONS,
  SOCIAL_STATUS_OPTIONS,
  WORK_STATUS_OPTIONS,
  ENVIRONMENT_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  HOUSING_TENURE_OPTIONS,
  CASE_CLASSIFICATION_OPTIONS,
  NEEDS_EXPORT_FIELDS,
  toExportOptions,
} from "@/lib/beneficiaryOptions";

export default function BeneficiariesImport({
  locale,
  tableName,
}: {
  locale: string;
  tableName: string;
}) {
  const isAr = locale === "ar";

  const exportFields: ExportField[] = [
    { key: "id", label: "ID", labelAr: "المعرف" },
    { key: "fullName", label: "Full Name", labelAr: "الاسم الكامل" },
    { key: "nationalId", label: "National ID", labelAr: "رقم الهوية" },
    { key: "birthDate", label: "Birth Date", labelAr: "تاريخ الميلاد (YYYY-MM-DD)" },
    { key: "maritalStatus", label: "Marital Status", labelAr: "الحالة الاجتماعية", options: toExportOptions(MARITAL_OPTIONS) },
    { key: "educationLevel", label: "Education Level", labelAr: "المستوى التعليمي", options: toExportOptions(EDUCATION_OPTIONS) },
    { key: "healthStatus", label: "Health Status", labelAr: "الحالة الصحية", options: toExportOptions(HEALTH_OPTIONS) },
    { key: "diseaseType", label: "Disease Type", labelAr: "نوع المرض" },
    { key: "disabilityType", label: "Disability Type", labelAr: "نوع الإعاقة" },
    { key: "phone", label: "Phone", labelAr: "الهاتف" },
    { key: "alternatePhone", label: "Alternate Phone", labelAr: "الهاتف البديل" },
    { key: "totalFamilyMembers", label: "Total Family Members", labelAr: "عدد أفراد الأسرة" },
    { key: "address", label: "Address", labelAr: "العنوان الوطني" },
    { key: "photoUrl", label: "Beneficiary Photo", labelAr: "صورة المستفيد", type: "image" },
    { key: "buildingPhotoUrl", label: "Building Photo", labelAr: "صورة المبنى الخارجية", type: "image" },
    { key: "researcherOpinion", label: "Researcher Opinion", labelAr: "رأي الباحث" },
    { key: "dependentsOpinion", label: "Researcher Opinion on Dependents", labelAr: "رأي الباحث في التابعين" },
    { key: "caseClassification", label: "Case Classification", labelAr: "تصنيف الحالة", options: toExportOptions(CASE_CLASSIFICATION_OPTIONS) },
    { key: "finalRecommendation", label: "Final Recommendation", labelAr: "التوصية النهائية" },

    // Relational Fields (Odoo Row Expansion)
    { key: "dependents.name", label: "Dependent/Name", labelAr: "اسم/التابع" },
    { key: "dependents.relationship", label: "Dependent/Relationship", labelAr: "صلة القرابة/التابع", options: toExportOptions(DEPENDENT_RELATIONSHIP_OPTIONS) },
    { key: "dependents.birthDate", label: "Dependent/Birth Date", labelAr: "تاريخ ميلاد/التابع" },
    { key: "dependents.educationLevel", label: "Dependent/Education Level", labelAr: "المستوى التعليمي/التابع", options: toExportOptions(EDUCATION_OPTIONS) },
    { key: "dependents.healthStatus", label: "Dependent/Health Status", labelAr: "الحالة الصحية/التابع", options: toExportOptions(HEALTH_OPTIONS) },
    { key: "dependents.socialStatus", label: "Dependent/Social Status", labelAr: "الحالة الاجتماعية/التابع", options: toExportOptions(SOCIAL_STATUS_OPTIONS) },
    { key: "dependents.workStatus", label: "Dependent/Work Status", labelAr: "الحالة العملية/التابع", options: toExportOptions(WORK_STATUS_OPTIONS) },

    // Income & Bills
    { key: "salaryIncome", label: "Salary Income", labelAr: "راتب وظيفي/تقاعدي" },
    { key: "socialSecurity", label: "Social Security", labelAr: "الضمان الاجتماعي" },
    { key: "citizenAccount", label: "Citizen Account", labelAr: "حساب المواطن" },
    { key: "comprehensiveRehab", label: "Comprehensive Rehab", labelAr: "التأهيل الشامل" },
    { key: "otherAssocSupport", label: "Other Association Support", labelAr: "دعم جمعيات أخرى" },
    { key: "livestockCount", label: "Livestock Count", labelAr: "مواشي (العدد)" },
    { key: "incomeAssets", label: "Income Assets", labelAr: "الأصول المدرة" },
    { key: "otherAssetTotal", label: "Other Asset Total", labelAr: "إجمالي دخل الأصول" },
    { key: "otherAssetDesc", label: "Other Asset Desc", labelAr: "وصف الأصل الآخر" },
    { key: "totalIncome", label: "Total Income", labelAr: "إجمالي الدخل" },
    { key: "rentAmount", label: "Rent", labelAr: "إيجار المنزل" },
    { key: "electricityBill", label: "Electricity", labelAr: "فاتورة الكهرباء" },
    { key: "waterBill", label: "Water", labelAr: "فاتورة الماء" },
    { key: "internetBill", label: "Internet", labelAr: "فاتورة الإنترنت" },
    { key: "phoneBill", label: "Phone", labelAr: "فاتورة الهاتف" },
    { key: "gasBill", label: "Gas", labelAr: "فاتورة الغاز" },
    { key: "serviceBills", label: "Service Bills", labelAr: "فواتير الخدمات" },
    { key: "medicalExpenses", label: "Medical", labelAr: "مصاريف طبية" },
    { key: "transportExpenses", label: "Transport", labelAr: "مواصلات" },
    { key: "foodExpenses", label: "Food", labelAr: "مصاريف الأكل" },
    { key: "debtMonthly", label: "Monthly Debt", labelAr: "القسط الشهري" },
    { key: "debtReason", label: "Debt Reason", labelAr: "سبب الدين" },
    { key: "debtPeriod", label: "Debt Period", labelAr: "فترة السداد" },
    { key: "totalExpenses", label: "Total Expenses", labelAr: "إجمالي المصروفات" },
    { key: "netIncome", label: "Net Income", labelAr: "صافي الدخل" },
    { key: "financialOpinion", label: "Financial Opinion", labelAr: "رأي الباحث في الوضع المالي" },

    // Housing & Environment
    { key: "environmentType", label: "Environment Type", labelAr: "نوع البيئة", options: toExportOptions(ENVIRONMENT_OPTIONS) },
    { key: "housingType", label: "Housing Type", labelAr: "نوع السكن", options: toExportOptions(HOUSING_TYPE_OPTIONS) },
    { key: "housingTenure", label: "Housing Tenure", labelAr: "حيازة السكن", options: toExportOptions(HOUSING_TENURE_OPTIONS) },
    { key: "housingOpinion", label: "Housing Opinion", labelAr: "رأي الباحث في البيئة المحيطة" },

    // Needs & Packages
    ...NEEDS_EXPORT_FIELDS,
    { key: "needsOpinion", label: "Needs Opinion", labelAr: "رأي الباحث في الاحتياجات" },

    // Donation Packages Relational Fields
    { key: "donationPackages.program", label: "Donation Package/Program", labelAr: "برنامج/باقة التبرع" },
    { key: "donationPackages.cost", label: "Donation Package/Cost", labelAr: "تكلفة/باقة التبرع" },
    { key: "createdAt", label: "Created At", labelAr: "تاريخ الإنشاء" },
  ];

  const onTest = async (rows: Record<string, any>[]) => {
    const errors: { row: number; field: string; message: string }[] = [];

    const allowedMarital = new Set(
      MARITAL_OPTIONS.flatMap((o) => [o.value, o.label, o.labelEn])
        .filter((s): s is string => typeof s === "string" && Boolean(s))
        .map((s) => s.toLowerCase())
    );
    const allowedEducation = new Set(
      EDUCATION_OPTIONS.flatMap((o) => [o.value, o.label, o.labelEn])
        .filter((s): s is string => typeof s === "string" && Boolean(s))
        .map((s) => s.toLowerCase())
    );
    const allowedHealth = new Set(
      HEALTH_OPTIONS.flatMap((o) => [o.value, o.label, o.labelEn])
        .filter((s): s is string => typeof s === "string" && Boolean(s))
        .map((s) => s.toLowerCase())
    );

    // Group rows by primary beneficiary (Odoo Row Expansion support)
    interface BeneficiaryGroup {
      primaryRow: any;
      primaryRowNum: number;
    }

    const groups: BeneficiaryGroup[] = [];
    let currentGroup: BeneficiaryGroup | null = null;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      const hasPrimaryFields =
        (row.fullName && String(row.fullName).trim() !== "") ||
        (row.nationalId && String(row.nationalId).trim() !== "") ||
        (row.id && String(row.id).trim() !== "");

      if (hasPrimaryFields) {
        currentGroup = { primaryRow: row, primaryRowNum: rowNum };
        groups.push(currentGroup);
      } else if (!currentGroup) {
        errors.push({
          row: rowNum,
          field: "fullName",
          message: isAr ? "الاسم الكامل مطلوب لبدء السجل" : "Full Name is required to start a record",
        });
      }
    }

    for (const group of groups) {
      const row = group.primaryRow;
      const rowNum = group.primaryRowNum;

      if (!row.fullName || String(row.fullName).trim() === "") {
        errors.push({ row: rowNum, field: "fullName", message: isAr ? "الاسم الكامل مطلوب" : "Full Name is required" });
      }
      if (!row.nationalId || String(row.nationalId).trim() === "") {
        errors.push({ row: rowNum, field: "nationalId", message: isAr ? "رقم الهوية مطلوب" : "National ID is required" });
      }
      if (!row.birthDate || String(row.birthDate).trim() === "") {
        errors.push({ row: rowNum, field: "birthDate", message: isAr ? "تاريخ الميلاد مطلوب" : "Birth Date is required" });
      } else {
        const bd = String(row.birthDate).trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(bd)) {
          errors.push({ row: rowNum, field: "birthDate", message: isAr ? "تاريخ الميلاد يجب أن يكون بصيغة YYYY-MM-DD" : "Birth date must be in YYYY-MM-DD format" });
        }
      }
      if (!row.maritalStatus || String(row.maritalStatus).trim() === "") {
        errors.push({ row: rowNum, field: "maritalStatus", message: isAr ? "الحالة الاجتماعية مطلوبة" : "Marital status is required" });
      } else {
        const ms = String(row.maritalStatus).trim().toLowerCase();
        if (!allowedMarital.has(ms)) {
          errors.push({ row: rowNum, field: "maritalStatus", message: isAr ? "الحالة الاجتماعية غير مطابقة للخيارات المتاحة" : "Marital status option is invalid" });
        }
      }
      if (!row.educationLevel || String(row.educationLevel).trim() === "") {
        errors.push({ row: rowNum, field: "educationLevel", message: isAr ? "المستوى التعليمي مطلوب" : "Education level is required" });
      } else {
        const el = String(row.educationLevel).trim().toLowerCase();
        if (!allowedEducation.has(el)) {
          errors.push({ row: rowNum, field: "educationLevel", message: isAr ? "المستوى التعليمي غير مطابق للخيارات المتاحة" : "Education level option is invalid" });
        }
      }
      if (!row.healthStatus || String(row.healthStatus).trim() === "") {
        errors.push({ row: rowNum, field: "healthStatus", message: isAr ? "الحالة الصحية مطلوبة" : "Health status is required" });
      } else {
        const hs = String(row.healthStatus).trim().toLowerCase();
        if (!allowedHealth.has(hs)) {
          errors.push({ row: rowNum, field: "healthStatus", message: isAr ? "الحالة الصحية غير مطابقة للخيارات المتاحة" : "Health status option is invalid" });
        }
      }
      if (!row.phone || String(row.phone).trim() === "") {
        errors.push({ row: rowNum, field: "phone", message: isAr ? "الهاتف مطلوب" : "Phone is required" });
      }
      if (!row.address || String(row.address).trim() === "") {
        errors.push({ row: rowNum, field: "address", message: isAr ? "العنوان الوطني مطلوب" : "National address is required" });
      }
    }

    return { valid: errors.length === 0, errors, referenceErrors: [] };
  };

  const onImport = async (rows: Record<string, any>[], fieldFixes: Record<string, "skip" | "create">) => {
    try {
      const res = await fetch("/api/beneficiaries/import", {
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
      tableLabelAr="المستفيدين"
      availableFields={exportFields}
      onTest={onTest}
      onImport={onImport}
    />
  );
}
