import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { importImage } from "@/lib/importImage";
import { decodeId } from "@/lib/idObfuscator";
import { checkEmailUniqueness } from "@/lib/checkEmailUniqueness";

const getVal = (row: Record<string, any>, keys: string[]): string => {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
      return String(row[k]).trim();
    }
  }
  return "";
};

export async function POST(request: NextRequest) {
  try {
    const { rows, locale } = await request.json();
    const isAr = locale === "ar";

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, errors: [isAr ? "لا توجد بيانات" : "No data provided"] }, { status: 400 });
    }

    const results: { row: number; field: string; message: string }[] = [];
    const created: number[] = [];
    const updated: number[] = [];

    // Pre-fetch references
    const [allGovs, allCities] = await Promise.all([
      prisma.governorate.findMany({ select: { id: true, name: true, nameAr: true } }),
      prisma.city.findMany({ select: { id: true, name: true, nameAr: true, governorateId: true } }),
    ]);

    // Group rows by primary marketer (Odoo Row Expansion support)
    interface MarketerGroup {
      primaryRow: any;
      primaryRowNum: number;
      bankAccountsRows: any[];
    }

    const groups: MarketerGroup[] = [];
    let currentGroup: MarketerGroup | null = null;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      const name = getVal(row, ["name", "الاسم / الجهة", "اسم المسوق", "اسم الجهة", "الاسم"]);
      const email = getVal(row, ["email", "البريد الإلكتروني", "البريد الالكتروني"]);
      const phone = getVal(row, ["phone", "رقم الجوال الشخصي", "رقم الجوال", "الجوال", "الهاتف"]);
      const identityNumber = getVal(row, ["identityNumber", "رقم الهوية"]);
      const commercialRegistration = getVal(row, ["commercialRegistration", "رقم السجل التجاري", "السجل التجاري"]);
      const rawId = row.id;

      const hasPrimaryFields = Boolean(name || email || phone || identityNumber || commercialRegistration || rawId);

      if (hasPrimaryFields) {
        currentGroup = {
          primaryRow: row,
          primaryRowNum: rowNum,
          bankAccountsRows: [],
        };
        groups.push(currentGroup);
      }

      if (currentGroup) {
        const bankName = getVal(row, ["bankAccounts.bankName", "اسم البنك", "البنك", "اسم البنك/الحساب البنكي"]);
        const accountHolderName = getVal(row, ["bankAccounts.accountHolderName", "اسم صاحب الحساب", "صاحب الحساب", "اسم صاحب الحساب/الحساب البنكي"]);
        const accountNumber = getVal(row, ["bankAccounts.accountNumber", "رقم الحساب", "رقم الحساب/الحساب البنكي"]);
        const iban = getVal(row, ["bankAccounts.iban", "الآيبان", "الآيبان/الحساب البنكي"]);

        if (bankName || accountHolderName || accountNumber || iban) {
          currentGroup.bankAccountsRows.push({
            bankName,
            accountHolderName,
            accountNumber,
            iban,
          });
        }
      }
    }

    for (const group of groups) {
      const row = group.primaryRow;
      const rowNum = group.primaryRowNum;

      try {
        const rawId = row.id;
        const decodedIdVal = typeof rawId === "string" ? decodeId(rawId) : typeof rawId === "number" ? rawId : null;

        const name = getVal(row, ["name", "الاسم / الجهة", "اسم المسوق", "اسم الجهة", "الاسم"]);
        const email = getVal(row, ["email", "البريد الإلكتروني", "البريد الالكتروني"]);
        const phone = getVal(row, ["phone", "رقم الجوال الشخصي", "رقم الجوال", "الجوال", "الهاتف"]);
        const identityType = getVal(row, ["identityType", "نوع الهوية"]);
        const identityNumber = getVal(row, ["identityNumber", "رقم الهوية"]);
        const commercialRegistration = getVal(row, ["commercialRegistration", "رقم السجل التجاري", "السجل التجاري"]);

        if (!name) {
          results.push({ row: rowNum, field: "name", message: isAr ? "الاسم مطلوب" : "Name is required" });
          continue;
        }

        // Check if email already belongs to another User, Marketer, or Association
        if (email) {
          const emailCheck = await checkEmailUniqueness(email, { marketerId: decodedIdVal || undefined });
          if (emailCheck.inUse) {
            results.push({
              row: rowNum,
              field: "email",
              message: emailCheck.message || (isAr ? `البريد الإلكتروني "${email}" مضاف مسبقاً` : `Email "${email}" is already registered`),
            });
            continue;
          }
        }

        // Location match
        const govVal = getVal(row, ["governorate.nameAr", "governorate.name", "governorate", "المنطقة"]);
        const cityVal = getVal(row, ["city.nameAr", "city.name", "city", "المدينة"]);

        let gov = govVal ? allGovs.find((g) => g.name === govVal || g.nameAr === govVal) : null;
        let city = cityVal ? allCities.find((c) => c.name === cityVal || c.nameAr === cityVal) : null;

        if (!gov && city) {
          gov = allGovs.find((g) => g.id === city?.governorateId) || null;
        }
        if (!gov) gov = allGovs[0];
        if (!city) city = allCities.find((c) => c.governorateId === gov?.id) || allCities[0];

        // Type match
        let typeVal = getVal(row, ["type", "نوع المسوق", "نوع المسوق/الجهة"]).toLowerCase();
        if (typeVal.includes("مؤسسة") || typeVal.includes("company") || typeVal.includes("شركة")) typeVal = "company";
        else if (typeVal.includes("مؤثر") || typeVal.includes("influencer")) typeVal = "influencer";
        else if (typeVal.includes("متطوع") || typeVal.includes("volunteer")) typeVal = "volunteer";
        else typeVal = "employee";

        // Image / Logo handling
        let imageId: number | null = null;
        const imgUrlStr = getVal(row, ["imageUrl", "photoUrl", "logoUrl", "صورة المسوق / الشعار", "صورة المسوق"]);
        if (imgUrlStr) {
          try {
            const att = await importImage(imgUrlStr, `marketer_logo_${rowNum}`);
            if (typeof att === "number") imageId = att;
            else if (att && typeof att === "object" && "id" in att) imageId = (att as any).id;
          } catch (e) {
            console.error(`Image import error row ${rowNum}:`, e);
          }
        }

        // Contract attachment handling
        let contractAttachmentId: number | null = null;
        const contractUrlStr = getVal(row, ["contractUrl", "contractAttachmentUrl", "عقد التسويق", "عقد المسوق", "العقد"]);
        if (contractUrlStr) {
          try {
            const att = await importImage(contractUrlStr, `marketer_contract_${rowNum}`);
            if (typeof att === "number") contractAttachmentId = att;
            else if (att && typeof att === "object" && "id" in att) contractAttachmentId = (att as any).id;
          } catch (e) {
            console.error(`Contract import error row ${rowNum}:`, e);
          }
        }

        const marketerData: any = {
          name,
          type: typeVal,
          email: email || null,
          phone: phone || "0500000000",
          identityType: identityType || "national_id",
          identityNumber: identityNumber || null,
          commercialRegistration: commercialRegistration || null,
          governorateId: gov ? gov.id : 1,
          cityId: city ? city.id : 1,
          ...(imageId ? { imageId } : {}),
          ...(contractAttachmentId ? { contractAttachmentId } : {}),
        };

        let targetMarketerId: number;

        const existingById = decodedIdVal ? await prisma.marketer.findUnique({ where: { id: decodedIdVal } }) : null;

        if (existingById) {
          await prisma.marketer.update({ where: { id: existingById.id }, data: marketerData });
          targetMarketerId = existingById.id;
          updated.push(existingById.id);
        } else {
          const createdMarketer = await prisma.marketer.create({ data: marketerData });
          targetMarketerId = createdMarketer.id;
          created.push(createdMarketer.id);
        }

        // Process all bank accounts in the group (primary + sub-rows)
        if (group.bankAccountsRows.length > 0) {
          if (existingById) {
            await prisma.marketerBankAccount.deleteMany({ where: { marketerId: targetMarketerId } });
          }

          for (const bankRow of group.bankAccountsRows) {
            const bName = bankRow.bankName;
            const bHolder = bankRow.accountHolderName;
            const bAcc = bankRow.accountNumber;
            const bIban = bankRow.iban;

            if (bName || bHolder || bAcc || bIban) {
              await prisma.marketerBankAccount.create({
                data: {
                  marketerId: targetMarketerId,
                  bankName: bName || "البنك الأهلي",
                  accountHolderName: bHolder || name,
                  accountNumber: bAcc || null,
                  iban: bIban || "SA0000000000000000000000",
                },
              });
            }
          }
        }
      } catch (rowErr: any) {
        results.push({ row: rowNum, field: "general", message: rowErr?.message || (isAr ? "حدث خطأ أثناء معالجة السجل" : "Error processing row") });
      }
    }

    const hasErrors = results.length > 0;

    return NextResponse.json({
      success: !hasErrors,
      errors: hasErrors ? results.map((r) => isAr ? `الصف ${r.row}: ${r.message}` : `Row ${r.row}: ${r.message}`) : undefined,
      created: hasErrors ? 0 : created.length,
      updated: hasErrors ? 0 : updated.length,
      createdCount: hasErrors ? 0 : created.length,
      updatedCount: hasErrors ? 0 : updated.length,
    });
  } catch (error: any) {
    console.error("Marketers import handler error:", error);
    return NextResponse.json({ success: false, errors: [error?.message || "Internal server error"] }, { status: 500 });
  }
}
