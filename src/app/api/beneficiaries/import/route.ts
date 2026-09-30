import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { importImage } from "@/lib/importImage";
import { decodeId } from "@/lib/idObfuscator";

const mapMarital = (v: string): string => {
  const val = String(v).trim().toLowerCase();
  if (["married", "متزوج", "متزوج/ة"].includes(val)) return "married";
  if (["widowed", "أرمل", "أرمل/ة"].includes(val)) return "widowed";
  if (["divorced", "مطلق", "مطلق/ة"].includes(val)) return "divorced";
  if (["abandoned", "مهجور", "مهجور/ة"].includes(val)) return "abandoned";
  if (["single", "أعزب"].includes(val)) return "single";
  return val;
};

const mapHealth = (v: string): string => {
  const val = String(v).trim().toLowerCase();
  if (["healthy", "سليم"].includes(val)) return "healthy";
  if (["disabled", "من ذوي الإعاقة", "معاق"].includes(val)) return "disabled";
  if (["sick", "مريض"].includes(val)) return "sick";
  return val;
};

const mapEducation = (v: string): string => {
  const val = String(v).trim().toLowerCase();
  if (["none", "غير متعلم"].includes(val)) return "none";
  if (["primary", "ابتدائي"].includes(val)) return "primary";
  if (["middle", "متوسط"].includes(val)) return "middle";
  if (["secondary", "high school", "ثانوي"].includes(val)) return "secondary";
  if (["diploma", "دبلوم"].includes(val)) return "diploma";
  if (["bachelor", "بكالوريوس"].includes(val)) return "bachelor";
  if (["master", "ماجستير"].includes(val)) return "master";
  if (["doctorate", "دكتوراه"].includes(val)) return "doctorate";
  return val;
};

const mapRelationship = (v: string): string => {
  const val = String(v).trim().toLowerCase();
  if (["son", "ابن"].includes(val)) return "son";
  if (["daughter", "بنت", "ابنة"].includes(val)) return "daughter";
  if (["wife", "زوجة"].includes(val)) return "wife";
  if (["husband", "زوج"].includes(val)) return "husband";
  if (["mother", "أم"].includes(val)) return "mother";
  if (["father", "أب"].includes(val)) return "father";
  if (["brother", "أخ"].includes(val)) return "brother";
  if (["sister", "أخت"].includes(val)) return "sister";
  if (["grandson", "حفيد"].includes(val)) return "grandson";
  if (["other", "آخر", "أخرى"].includes(val)) return "other";
  return val;
};

const mapWorkStatus = (v: string): string => {
  const val = String(v).trim().toLowerCase();
  if (["student", "طالب"].includes(val)) return "student";
  if (["employee", "يعمل", "موظف"].includes(val)) return "employee";
  if (["unemployed", "عاطل", "لا يعمل"].includes(val)) return "unemployed";
  return val;
};

const mapCaseClassification = (v: string): string => {
  const val = String(v).trim().toLowerCase();
  if (["top-priority", "أولوية قصوى"].includes(val)) return "top-priority";
  if (["medium-priority", "أولوية متوسطة"].includes(val)) return "medium-priority";
  if (["not-eligible", "غير مستحقة"].includes(val)) return "not-eligible";
  return val;
};

const mapSocialStatus = (v: string): string => {
  const val = String(v).trim().toLowerCase();
  if (["orphan", "يتيم"].includes(val)) return "orphan";
  if (["normal", "طبيعي", "سليم", "سليم / طبيعي", "إلخ"].includes(val)) return "normal";
  return mapMarital(v);
};

const mapEnvironmentType = (v: string): string => {
  const val = String(v).trim().toLowerCase();
  if (["city", "مدينة", "حضري (مدينة)"].includes(val)) return "city";
  if (["province", "محافظة"].includes(val)) return "province";
  if (["village", "قرية", "ريفي (قرية)"].includes(val)) return "village";
  if (["desert", "بادية"].includes(val)) return "desert";
  if (["migatory", "هجرة"].includes(val)) return "migatory";
  return val;
};

const mapHousingType = (v: string): string => {
  const val = String(v).trim().toLowerCase();
  if (["apartment", "شقة"].includes(val)) return "apartment";
  if (["villa_floor", "فيلا / دور", "فيلا"].includes(val)) return "villa_floor";
  if (["traditional", "شعبي", "بيت شعبي"].includes(val)) return "traditional";
  if (["annex", "ملحق"].includes(val)) return "annex";
  return val;
};

const mapHousingTenure = (v: string): string => {
  const val = String(v).trim().toLowerCase();
  if (["owned", "ملك"].includes(val)) return "owned";
  if (["rented", "إيجار"].includes(val)) return "rented";
  if (["charity_housing", "وقف خيري", "وقف / خيري", "وقف", "خيري", "وقف/خيري"].includes(val)) return "charity_housing";
  if (["inherited", "ورثة"].includes(val)) return "inherited";
  return val;
};

const parseNeedsValue = (subKey: string, val: any): any => {
  if (val === null || val === undefined || val === "") return undefined;
  const strVal = String(val).trim();
  const lowerVal = strVal.toLowerCase();

  // 1. Dropdown/enum fields — check these BEFORE boolean to prevent "نعم"/"لا" hijacking
  if (subKey === "shelter_type") {
    if (["new", "جديد"].includes(lowerVal)) return "new";
    if (["renovation", "ترميم"].includes(lowerVal)) return "renovation";
    return strVal;
  }
  if (subKey === "food_basket_size") {
    if (["small", "صغيرة"].includes(lowerVal)) return "small";
    if (["medium", "متوسطة"].includes(lowerVal)) return "medium";
    if (["large", "كبيرة"].includes(lowerVal)) return "large";
    return strVal;
  }
  if (subKey === "food_basket_frequency") {
    if (["monthly", "شهري"].includes(lowerVal)) return "monthly";
    if (["one_time", "مرة واحدة"].includes(lowerVal)) return "one_time";
    return strVal;
  }
  if (subKey === "transport_owns") {
    if (["yes", "نعم"].includes(lowerVal)) return "yes";
    if (["no", "لا"].includes(lowerVal)) return "no";
    return strVal;
  }
  if (subKey === "transport_recommendation") {
    if (["small_car", "سيارة صغيرة"].includes(lowerVal)) return "small_car";
    if (["family_car", "سيارة عائلية"].includes(lowerVal)) return "family_car";
    if (["school_transport", "نقل مدرسي"].includes(lowerVal)) return "school_transport";
    return strVal;
  }
  if (subKey === "training_goal") {
    if (["work", "التوظيف"].includes(lowerVal)) return "work";
    if (["skill", "تطوير مهارة"].includes(lowerVal)) return "skill";
    return strVal;
  }
  if (subKey === "training_gender") {
    if (["male", "ذكور"].includes(lowerVal)) return "male";
    if (["female", "إناث"].includes(lowerVal)) return "female";
    return strVal;
  }
  if (subKey === "training_age") {
    if (["18-25", "18-25 سنة"].includes(lowerVal)) return "18-25";
    if (["26-40", "26-40 سنة"].includes(lowerVal)) return "26-40";
    if (["40+", "أكثر من 40 سنة", "40+"].includes(lowerVal)) return "40+";
    return strVal;
  }

  // 2. Text fields — preserve as-is (no boolean/numeric conversion)
  const textFields = [
    "transport_type", "transport_reason",
    "medical_disease", "medical_cost",
    "training_program",
    "skills_list", "skills_owned", "skills_needed",
    "financial_support_reason", "financial_support_amount",
    "child_other", "plumbing_other", "electrical_other",
    "researcher_opinion_basic", "researcher_opinion_dev",
  ];
  if (textFields.includes(subKey)) {
    return strVal;
  }

  // 3. Numeric fields (counts, areas, amounts)
  const numericFields = [
    "furniture_carpet_area", "furniture_seating_area",
    "furniture_beds", "furniture_mattresses",
    "furniture_closets_count", "furniture_lighting_count",
    "appliance_fridge", "appliance_washer", "appliance_ac",
    "appliance_oven", "appliance_water_heater", "appliance_water_filter",
    "food_basket_count",
    "bills_electricity", "bills_water",
    "rent_amount",
    "tech_desktop", "tech_laptop", "tech_ipad",
  ];
  if (numericFields.includes(subKey)) {
    const num = Number(strVal);
    return isNaN(num) ? 0 : num;
  }

  // 4. Boolean fields (everything else — checkboxes)
  if (["نعم", "yes", "true", "1", "y"].includes(lowerVal)) return true;
  if (["لا", "no", "false", "0", "n"].includes(lowerVal)) return false;

  // 5. Fallback: try numeric, then string
  if (/^\d+(\.\d+)?$/.test(lowerVal)) {
    return Number(lowerVal);
  }
  return strVal;
};

const findAssetIds = (str: string, allAssets: any[]): number[] => {
  if (!str) return [];
  const parts = str.split(/[،,;]/).map((s) => s.trim().toLowerCase());
  const ids: number[] = [];
  for (const part of parts) {
    const asset = allAssets.find(
      (a) =>
        (a.name && a.name.toLowerCase() === part) ||
        (a.nameAr && a.nameAr.toLowerCase() === part) ||
        (a.nameEn && a.nameEn.toLowerCase() === part)
    );
    if (asset) ids.push(asset.id);
  }
  return ids;
};

const findBillIds = (str: string, allBills: any[]): number[] => {
  if (!str) return [];
  const parts = str.split(/[،,;]/).map((s) => s.trim().toLowerCase());
  const ids: number[] = [];
  for (const part of parts) {
    const bill = allBills.find(
      (b) =>
        (b.name && b.name.toLowerCase() === part) ||
        (b.nameAr && b.nameAr.toLowerCase() === part) ||
        (b.nameEn && b.nameEn.toLowerCase() === part)
    );
    if (bill) ids.push(bill.id);
  }
  return ids;
};

export async function POST(request: Request) {
  try {
    const { rows, locale } = await request.json();
    const isAr = locale === "ar";

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { success: false, errors: [isAr ? "لا توجد بيانات" : "No data provided"] },
        { status: 400 }
      );
    }

    const results: { row: number; field: string; message: string }[] = [];
    const created: number[] = [];
    const updated: number[] = [];

    // Load static lookups for comma-separated relations
    const allAssets = await prisma.incomeAsset.findMany();
    const allBills = await prisma.serviceBill.findMany();

    // Group rows by primary beneficiary (Odoo Row Expansion support)
    interface BeneficiaryGroup {
      primaryRow: any;
      primaryRowNum: number;
      dependentsRows: any[];
      donationPackagesRows: any[];
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
        currentGroup = {
          primaryRow: row,
          primaryRowNum: rowNum,
          dependentsRows: [],
          donationPackagesRows: []
        };
        groups.push(currentGroup);
      }

      if (currentGroup) {
        // Collect dependents if name is present
        if (row["dependents.name"] && String(row["dependents.name"]).trim() !== "") {
          currentGroup.dependentsRows.push(row);
        }
        // Collect donation packages if program is present
        if (row["donationPackages.program"] && String(row["donationPackages.program"]).trim() !== "") {
          currentGroup.donationPackagesRows.push(row);
        }
      } else {
        results.push({
          row: rowNum,
          field: "fullName",
          message: isAr ? "الاسم الكامل مطلوب لبدء السجل" : "Full Name is required to start a record"
        });
      }
    }

    // Process each beneficiary group
    for (const group of groups) {
      const row = group.primaryRow;
      const rowNum = group.primaryRowNum;

      // Validate required fields on parent row
      if (!row.fullName || String(row.fullName).trim() === "") {
        results.push({ row: rowNum, field: "fullName", message: isAr ? "الاسم الكامل مطلوب" : "Full Name is required" });
        continue;
      }
      if (!row.nationalId || String(row.nationalId).trim() === "") {
        results.push({ row: rowNum, field: "nationalId", message: isAr ? "رقم الهوية مطلوب" : "National ID is required" });
        continue;
      }
      if (!row.birthDate || String(row.birthDate).trim() === "") {
        results.push({ row: rowNum, field: "birthDate", message: isAr ? "تاريخ الميلاد مطلوب" : "Birth Date is required" });
        continue;
      }
      if (!row.maritalStatus || String(row.maritalStatus).trim() === "") {
        results.push({ row: rowNum, field: "maritalStatus", message: isAr ? "الحالة الاجتماعية مطلوبة" : "Marital status is required" });
        continue;
      }
      if (!row.educationLevel || String(row.educationLevel).trim() === "") {
        results.push({ row: rowNum, field: "educationLevel", message: isAr ? "المستوى التعليمي مطلوب" : "Education level is required" });
        continue;
      }
      if (!row.healthStatus || String(row.healthStatus).trim() === "") {
        results.push({ row: rowNum, field: "healthStatus", message: isAr ? "الحالة الصحية مطلوبة" : "Health status is required" });
        continue;
      }
      if (!row.phone || String(row.phone).trim() === "") {
        results.push({ row: rowNum, field: "phone", message: isAr ? "الهاتف مطلوب" : "Phone is required" });
        continue;
      }
      if (!row.address || String(row.address).trim() === "") {
        results.push({ row: rowNum, field: "address", message: isAr ? "العنوان الوطني مطلوب" : "National address is required" });
        continue;
      }

      const nationalIdStr = String(row.nationalId).trim();
      const mappedMarital = mapMarital(row.maritalStatus);
      const mappedEducation = mapEducation(row.educationLevel);
      const mappedHealth = mapHealth(row.healthStatus);

      // Parse nested Needs fields (starting with needs. or needs/)
      const needsObj: any = {};
      for (const [k, v] of Object.entries(row)) {
        if (k.startsWith("needs.") || k.startsWith("needs/")) {
          const subKey = k.slice(6);
          const parsed = parseNeedsValue(subKey, v);
          if (parsed !== undefined) {
            needsObj[subKey] = parsed;
          }
        }
      }

      // Parse comma-separated relations
      const assetIds = findAssetIds(row.incomeAssets || "", allAssets);
      const billIds = findBillIds(row.serviceBills || "", allBills);

      // Map child rows (dependents & donation packages)
      const dependents = group.dependentsRows.map((dRow) => ({
        name: String(dRow["dependents.name"]).trim(),
        relationship: mapRelationship(dRow["dependents.relationship"]),
        birthDate: dRow["dependents.birthDate"] ? String(dRow["dependents.birthDate"]).trim() : null,
        educationLevel: dRow["dependents.educationLevel"] ? mapEducation(dRow["dependents.educationLevel"]) : null,
        healthStatus: dRow["dependents.healthStatus"] ? mapHealth(dRow["dependents.healthStatus"]) : null,
        socialStatus: dRow["dependents.socialStatus"] ? mapSocialStatus(dRow["dependents.socialStatus"]) : null,
        workStatus: dRow["dependents.workStatus"] ? mapWorkStatus(dRow["dependents.workStatus"]) : null,
      }));

      const donationPackages = group.donationPackagesRows.map((dpRow) => ({
        program: String(dpRow["donationPackages.program"]).trim(),
        cost: dpRow["donationPackages.cost"] ? Number(dpRow["donationPackages.cost"]) : 0,
      }));

      try {
        // Resolve images (photo & buildingPhoto)
        let photoId: number | null = null;
        if (row.photoUrl || row.photo) {
          photoId = await importImage(row.photoUrl || row.photo, "beneficiary");
        }
        let buildingPhotoId: number | null = null;
        if (row.buildingPhotoUrl || row.buildingPhoto) {
          buildingPhotoId = await importImage(row.buildingPhotoUrl || row.buildingPhoto, "beneficiary");
        }

        const data: any = {
          fullName: String(row.fullName).trim(),
          nationalId: nationalIdStr,
          birthDate: String(row.birthDate).trim(),
          maritalStatus: mappedMarital,
          educationLevel: mappedEducation,
          healthStatus: mappedHealth,
          diseaseType: row.diseaseType && mappedHealth === "sick" ? String(row.diseaseType).trim() : null,
          disabilityType: row.disabilityType && mappedHealth === "disabled" ? String(row.disabilityType).trim() : null,
          phone: String(row.phone).trim(),
          alternatePhone: row.alternatePhone ? String(row.alternatePhone).trim() : null,
          totalFamilyMembers: row.totalFamilyMembers ? Number(row.totalFamilyMembers) : null,
          address: String(row.address).trim(),
          researcherOpinion: row.researcherOpinion ? String(row.researcherOpinion).trim() : null,
          dependentsOpinion: row.dependentsOpinion ? String(row.dependentsOpinion).trim() : null,
          needs: Object.keys(needsObj).length > 0 ? needsObj : undefined,
          needsOpinion: row.needsOpinion ? String(row.needsOpinion).trim() : null,
          finalRecommendation: row.finalRecommendation ? String(row.finalRecommendation).trim() : null,
          caseClassification: row.caseClassification ? mapCaseClassification(row.caseClassification) : null,

          // Numeric income and bills
          salaryIncome: row.salaryIncome ? Number(row.salaryIncome) : null,
          socialSecurity: row.socialSecurity ? Number(row.socialSecurity) : null,
          citizenAccount: row.citizenAccount ? Number(row.citizenAccount) : null,
          comprehensiveRehab: row.comprehensiveRehab ? Number(row.comprehensiveRehab) : null,
          otherAssocSupport: row.otherAssocSupport ? Number(row.otherAssocSupport) : null,
          livestockCount: row.livestockCount ? Number(row.livestockCount) : null,
          otherAssetTotal: row.otherAssetTotal ? Number(row.otherAssetTotal) : null,
          otherAssetDesc: row.otherAssetDesc ? String(row.otherAssetDesc) : null,
          totalIncome: row.totalIncome ? Number(row.totalIncome) : null,
          rentAmount: row.rentAmount ? Number(row.rentAmount) : null,
          electricityBill: row.electricityBill ? Number(row.electricityBill) : null,
          waterBill: row.waterBill ? Number(row.waterBill) : null,
          internetBill: row.internetBill ? Number(row.internetBill) : null,
          phoneBill: row.phoneBill ? Number(row.phoneBill) : null,
          gasBill: row.gasBill ? Number(row.gasBill) : null,
          medicalExpenses: row.medicalExpenses ? Number(row.medicalExpenses) : null,
          transportExpenses: row.transportExpenses ? Number(row.transportExpenses) : null,
          foodExpenses: row.foodExpenses ? Number(row.foodExpenses) : null,
          debtMonthly: row.debtMonthly ? Number(row.debtMonthly) : null,
          debtReason: row.debtReason ? String(row.debtReason) : null,
          debtPeriod: row.debtPeriod ? String(row.debtPeriod) : null,
          totalExpenses: row.totalExpenses ? Number(row.totalExpenses) : null,
          netIncome: row.netIncome ? Number(row.netIncome) : null,
          financialOpinion: row.financialOpinion ? String(row.financialOpinion) : null,

          // Housing & Environment
          environmentType: row.environmentType ? mapEnvironmentType(row.environmentType) : null,
          housingType: row.housingType ? mapHousingType(row.housingType) : null,
          housingTenure: row.housingTenure ? mapHousingTenure(row.housingTenure) : null,
          housingOpinion: row.housingOpinion ? String(row.housingOpinion) : null,
        };

        if (photoId) data.photoId = photoId;
        if (buildingPhotoId) data.buildingPhotoId = buildingPhotoId;

        // Determine if we update or create
        // Only update when an explicit id is provided in the import file
        let existing = null;
        const targetId = row.id ? decodeId(row.id) : null;
        if (targetId) {
          existing = await prisma.beneficiary.findUnique({ where: { id: targetId } });
        } else {
          // No id provided — check if nationalId already exists to avoid unique constraint error
          const duplicate = await prisma.beneficiary.findUnique({ where: { nationalId: nationalIdStr } });
          if (duplicate) {
            results.push({
              row: rowNum,
              field: "nationalId",
              message: isAr
                ? `رقم الهوية ${nationalIdStr} موجود مسبقاً (معرف السجل: ${duplicate.id}). أضف عمود id لتحديث السجل الحالي.`
                : `National ID ${nationalIdStr} already exists (record id: ${duplicate.id}). Add an id column to update existing records.`,
            });
            continue;
          }
        }

        if (existing) {
          // Delete existing relations and recreate to avoid orphans
          await prisma.$transaction([
            prisma.dependent.deleteMany({ where: { beneficiaryId: existing.id } }),
            prisma.donationPackage.deleteMany({ where: { beneficiaryId: existing.id } }),
            prisma.incomeAssetOnBeneficiary.deleteMany({ where: { beneficiaryId: existing.id } }),
            prisma.serviceBillOnBeneficiary.deleteMany({ where: { beneficiaryId: existing.id } }),
            prisma.beneficiary.update({
              where: { id: existing.id },
              data: {
                ...data,
                dependents: dependents.length > 0 ? { create: dependents } : undefined,
                donationPackages: donationPackages.length > 0 ? { create: donationPackages } : undefined,
                incomeAssets: assetIds.length > 0 ? { create: assetIds.map(id => ({ incomeAssetId: id })) } : undefined,
                serviceBills: billIds.length > 0 ? { create: billIds.map(id => ({ serviceBillId: id })) } : undefined,
              },
            })
          ]);
          updated.push(existing.id);
        } else {
          const createdRecord = await prisma.beneficiary.create({
            data: {
              ...data,
              dependents: dependents.length > 0 ? { create: dependents } : undefined,
              donationPackages: donationPackages.length > 0 ? { create: donationPackages } : undefined,
              incomeAssets: assetIds.length > 0 ? { create: assetIds.map(id => ({ incomeAssetId: id })) } : undefined,
              serviceBills: billIds.length > 0 ? { create: billIds.map(id => ({ serviceBillId: id })) } : undefined,
            },
          });
          created.push(createdRecord.id);
        }
      } catch (err: any) {
        results.push({
          row: rowNum,
          field: "general",
          message: err.message || (isAr ? "خطأ غير معروف أثناء الحفظ" : "Unknown error while saving"),
        });
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
      { success: false, errors: [err.message || "Unknown server error"] },
      { status: 500 }
    );
  }
}
