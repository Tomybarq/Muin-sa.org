import { z } from "zod";

export type TranslateFn = (key: string) => string;

// Helper function to resolve translation or fallback Arabic message
function tr(t: TranslateFn | undefined, key: string, fallback: string): string {
  if (!t) return fallback;
  try {
    const res = t(key);
    return res || fallback;
  } catch {
    return fallback;
  }
}

// ----------------------------------------------------
// Login Schema
// ----------------------------------------------------
export const createLoginSchema = (t?: TranslateFn) =>
  z.object({
    email: z.string().email({ message: tr(t, "emailInvalid", "البريد الإلكتروني غير صحيح") }),
    password: z.string().min(6, { message: tr(t, "passwordMin6", "كلمة المرور يجب أن تكون 6 أحرف على الأقل") }),
  });

export const loginSchema = createLoginSchema();

// ----------------------------------------------------
// Social Researcher Schema
// ----------------------------------------------------
export const createSocialResearcherSchema = (t?: TranslateFn) =>
  z.object({
    name: z
      .string({ message: tr(t, "socialResearcherNameRequired", "يرجى إدخال اسم الباحث الاجتماعي") })
      .trim()
      .min(1, { message: tr(t, "socialResearcherNameRequired", "يرجى إدخال اسم الباحث الاجتماعي") }),
    email: z
      .string({ message: tr(t, "emailRequired", "يرجى إدخال البريد الإلكتروني") })
      .trim()
      .min(1, { message: tr(t, "emailRequired", "يرجى إدخال البريد الإلكتروني") })
      .email({ message: tr(t, "emailInvalid", "صيغة البريد الإلكتروني غير صحيحة") }),
  });

export const socialResearcherSchema = createSocialResearcherSchema();

// ----------------------------------------------------
// Marketer Bank Account Schema
// ----------------------------------------------------
export const createMarketerBankAccountSchema = (t?: TranslateFn) =>
  z.object({
    bankName: z
      .string({ message: tr(t, "bankNameRequired", "يرجى إدخال اسم البنك / الحساب") })
      .trim()
      .min(1, { message: tr(t, "bankNameRequired", "اسم البنك مطلوب") }),
    accountHolderName: z
      .string({ message: tr(t, "accountHolderRequired", "يرجى إدخال اسم صاحب الحساب") })
      .trim()
      .min(1, { message: tr(t, "accountHolderRequired", "اسم صاحب الحساب مطلوب") }),
    accountNumber: z
      .string({ message: tr(t, "accountNumberRequired", "يرجى إدخال رقم الحساب") })
      .trim()
      .min(1, { message: tr(t, "accountNumberRequired", "رقم الحساب مطلوب") }),
    iban: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val && val.trim() === "" ? null : val))
      .refine((val) => !val || /^SA\d{22}$/i.test(val), {
        message: tr(t, "ibanInvalid", "صيغة الآيبان غير صحيحة، يجب أن تبدأ بـ SA متبوعة بـ 22 رقماً"),
      }),
  });

export const marketerBankAccountSchema = createMarketerBankAccountSchema();

// ----------------------------------------------------
// Marketer Schema
// ----------------------------------------------------
export const createMarketerSchema = (t?: TranslateFn) =>
  z
    .object({
      type: z.enum(["employee", "company", "influencer", "volunteer"], {
        message: tr(t, "marketerTypeRequired", "يرجى اختيار نوع المسوق"),
      }),
      name: z
        .string({ message: tr(t, "marketerNameRequired", "يرجى إدخال الاسم / اسم الجهة") })
        .trim()
        .min(2, { message: tr(t, "marketerNameMin2", "الاسم يجب أن يكون حرفين على الأقل") }),
      email: z
        .string({ message: tr(t, "emailRequired", "يرجى إدخال البريد الإلكتروني") })
        .trim()
        .email({ message: tr(t, "emailInvalid", "صيغة البريد الإلكتروني غير صحيحة") }),
      phone: z
        .string({ message: tr(t, "phoneRequired", "يرجى إدخال رقم الجوال") })
        .trim()
        .regex(/^(5\d{8})$/, {
          message: tr(t, "phoneFormatInvalid", "الرقم يجب أن يبدأ بـ 5 ويتكون من 9 أرقام"),
        }),
      identityType: z.string().optional().nullable(),
      identityNumber: z.string().optional().nullable(),
      commercialRegistration: z.string().optional().nullable(),
      governorateId: z
        .number({ message: tr(t, "selectGovernorate", "يرجى اختيار المنطقة") })
        .min(1, { message: tr(t, "selectGovernorate", "يرجى اختيار المنطقة") }),
      cityId: z
        .number({ message: tr(t, "selectCity", "يرجى اختيار المدينة") })
        .min(1, { message: tr(t, "selectCity", "يرجى اختيار المدينة") }),
      imageId: z.number().optional().nullable(),
      contractAttachmentId: z.number().optional().nullable(),
    })
    .refine(
      (data) => {
        if (data.type !== "company") {
          if (!data.identityType) return false;
        }
        return true;
      },
      {
        message: tr(t, "identityTypeRequired", "يرجى اختيار نوع الهوية للأفراد"),
        path: ["identityType"],
      }
    )
    .refine(
      (data) => {
        if (data.type !== "company") {
          if (!data.identityNumber || data.identityNumber.trim().length < 8) return false;
        }
        return true;
      },
      {
        message: tr(t, "identityNumberRequired", "يرجى إدخال رقم الهوية الصحيح للأفراد"),
        path: ["identityNumber"],
      }
    )
    .refine(
      (data) => {
        if (data.type === "company") {
          if (!data.commercialRegistration || data.commercialRegistration.trim().length < 8) return false;
        }
        return true;
      },
      {
        message: tr(t, "commercialRegistrationRequired", "يرجى إدخال رقم السجل التجاري للمؤسسة"),
        path: ["commercialRegistration"],
      }
    );

export const marketerSchema = createMarketerSchema();

// ----------------------------------------------------
// Password Schemas
// ----------------------------------------------------
export const createPasswordSchema = (t?: TranslateFn) =>
  z
    .string({ message: tr(t, "passwordRequired", "يرجى إدخال كلمة المرور") })
    .min(1, { message: tr(t, "passwordRequired", "يرجى إدخال كلمة المرور") })
    .min(8, { message: tr(t, "passwordMin8", "كلمة المرور يجب أن تكون 8 أحرف على الأقل") })
    .regex(/[a-z]/, {
      message: tr(t, "passwordLowercase", "يجب أن تحتوي كلمة المرور على حرف صغير واحد (a-z) على الأقل"),
    })
    .regex(/[A-Z]/, {
      message: tr(t, "passwordUppercase", "يجب أن تحتوي كلمة المرور على حرف كبير واحد (A-Z) على الأقل"),
    })
    .regex(/\d/, {
      message: tr(t, "passwordDigit", "يجب أن تحتوي كلمة المرور على رقم واحد (0-9) على الأقل"),
    })
    .regex(/[^A-Za-z0-9]/, {
      message: tr(t, "passwordSpecial", "يجب أن تحتوي كلمة المرور على رمز خاص واحد على الأقل (مثل @$!%*?&)"),
    });

export const passwordSchema = createPasswordSchema();

export const createChangePasswordSchema = (t?: TranslateFn) =>
  z
    .object({
      currentPassword: z
        .string()
        .min(1, { message: tr(t, "passwordCurrentRequired", "يرجى إدخال كلمة المرور الحالية") }),
      newPassword: createPasswordSchema(t),
      confirmPassword: z
        .string()
        .min(1, { message: tr(t, "passwordConfirmRequired", "يرجى تأكيد كلمة المرور الجديدة") }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: tr(t, "passwordMismatch", "كلمة المرور الجديدة وتأكيدها غير متطابقتين"),
      path: ["confirmPassword"],
    });

export const changePasswordSchema = createChangePasswordSchema();

// ----------------------------------------------------
// Update Profile Schema
// ----------------------------------------------------
export const createUpdateProfileSchema = (t?: TranslateFn) =>
  z.object({
    name: z
      .string({ message: tr(t, "fullNameRequired", "يرجى إدخال الاسم الكامل") })
      .trim()
      .min(1, { message: tr(t, "fullNameRequired", "يرجى إدخال الاسم الكامل") }),
    imageId: z.number().optional().nullable(),
  });

export const updateProfileSchema = createUpdateProfileSchema();

// ----------------------------------------------------
// Register Schema
// ----------------------------------------------------
export const createRegisterSchema = (t?: TranslateFn) =>
  z
    .object({
      name: z
        .string()
        .min(3, { message: tr(t, "fullNameMin3", "الاسم الكامل يجب أن يكون 3 أحرف على الأقل") }),
      email: z.string().email({ message: tr(t, "emailInvalid", "البريد الإلكتروني غير صحيح") }),
      password: z
        .string()
        .min(8, { message: tr(t, "passwordMin8", "كلمة المرور يجب أن تكون 8 أحرف على الأقل") }),
      confirmPassword: z
        .string()
        .min(1, { message: tr(t, "passwordConfirmRequired", "يرجى تأكيد كلمة المرور") }),
      phone: z
        .string()
        .optional()
        .nullable()
        .transform((val) => (val === "" ? null : val))
        .refine((val) => !val || /^(05\d{8})$/.test(val), {
          message: tr(t, "phoneFormatInvalid", "رقم الهاتف غير صحيح، يجب أن يبدأ بـ 05 ويتكون من 10 أرقام"),
        }),
      nationalId: z
        .string()
        .optional()
        .nullable()
        .transform((val) => (val === "" ? null : val))
        .refine((val) => !val || /^\d{10}$/.test(val), {
          message: tr(t, "nationalIdFormat", "رقم الهوية الوطنية يجب أن يتكون من 10 أرقام"),
        }),
      role: z
        .enum(["SUPER_ADMIN", "CHARITY_STAFF", "MARKETER", "BENEFICIARY", "USER"])
        .default("USER"),
      associationId: z.coerce.number().optional().nullable(),
      marketerId: z.coerce.number().optional().nullable(),
      beneficiaryId: z.coerce.number().optional().nullable(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: tr(t, "passwordMismatch", "كلمة المرور وتأكيدها غير متطابقتين"),
      path: ["confirmPassword"],
    });

export const registerSchema = createRegisterSchema();

// ----------------------------------------------------
// Single Phone Number Validation Schema
// ----------------------------------------------------
export const createPhoneNumberSchema = (t?: TranslateFn) =>
  z
    .string()
    .min(1, { message: tr(t, "phoneRequired", "يرجى إدخال رقم الجوال") })
    .regex(/^(5)\d{8}$/, {
      message: tr(t, "phoneFormatInvalid", "الرقم يجب أن يبدأ بـ 5 ويتكون من 9 أرقام"),
    });

// Association Schema
// ----------------------------------------------------
export const createAssociationSchema = (t?: TranslateFn) =>
  z.object({
    name: z
      .string()
      .min(1, { message: tr(t, "associationNameRequired", "الرجاء إضافة اسم الجمعية") }),
    manager: z
      .string()
      .min(1, { message: tr(t, "managerNameRequired", "الرجاء إضافة اسم المسؤول") }),
    managerId: z.number().optional().nullable(),
    phone: z.string().regex(/^(5\d{8})$/, {
      message: tr(t, "phoneFormatInvalid", "الرقم يجب أن يبدأ بـ 5 ويتكون من 9 أرقام"),
    }),
    email: z.string().email({ message: tr(t, "emailInvalid", "البريد الإلكتروني غير صحيح") }),
    governorateId: z.coerce
      .number({ message: tr(t, "selectGovernorate", "الرجاء اختيار المنطقة") })
      .min(1, { message: tr(t, "selectGovernorate", "الرجاء اختيار المنطقة") }),
    cityId: z.coerce
      .number({ message: tr(t, "selectCity", "الرجاء اختيار المدينة") })
      .min(1, { message: tr(t, "selectCity", "الرجاء إختيار المدينة") }),
    categoryId: z.coerce
      .number({ message: tr(t, "selectCategory", "الرجاء اختيار التصنيف") })
      .min(1, { message: tr(t, "selectCategory", "الرجاء اختيار التصنيف") }),
    donationUrl: z
      .string()
      .url({ message: tr(t, "donationUrlInvalid", "رابط منصة التبرع غير صحيح") })
      .or(z.literal(""))
      .optional()
      .nullable(),
    logoId: z.number().optional().nullable(),
  });

export const associationSchema = createAssociationSchema();

// ----------------------------------------------------
// Dependent Schema
// ----------------------------------------------------
export const createDependentSchema = (t?: TranslateFn) =>
  z.object({
    name: z
      .string()
      .min(1, { message: tr(t, "dependentNameRequired", "الرجاء إضافة اسم التابع") }),
    relationship: z
      .string()
      .min(1, { message: tr(t, "relationshipRequired", "الرجاء إختيار صلة القرابة") }),
    birthDate: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val === "" ? null : val)),
    educationLevel: z
      .string()
      .min(1, { message: tr(t, "educationLevelRequired", "الرجاء إختيار المستوى التعليمي") }),
    healthStatus: z
      .string()
      .min(1, { message: tr(t, "healthStatusRequired", "الرجاء إختيار الحالة الصحية") }),
    socialStatus: z
      .string()
      .min(1, { message: tr(t, "socialStatusRequired", "الرجاء إختيار الحالة الاجتماعية") }),
    workStatus: z
      .string()
      .min(1, { message: tr(t, "workStatusRequired", "الرجاء إختيار الحالة العملية") }),
  });

export const dependentSchema = createDependentSchema();

// ----------------------------------------------------
// Donation Package Schema
// ----------------------------------------------------
export const createDonationPackageSchema = (t?: TranslateFn) =>
  z.object({
    program: z
      .string()
      .min(1, { message: tr(t, "programNameRequired", "الرجاء إضافة اسم البرنامج") }),
    cost: z
      .number({ message: tr(t, "costRequired", "الرجاء إضافة التكلفة") })
      .nonnegative({ message: tr(t, "costNonNegative", "التكلفة يجب أن تكون 0 أو أكثر") }),
  });

export const donationPackageSchema = createDonationPackageSchema();

// ----------------------------------------------------
// Beneficiary Schema
// ----------------------------------------------------
export const createBeneficiarySchema = (t?: TranslateFn) =>
  z
    .object({
      associationId: z.coerce
        .number({ message: tr(t, "selectAssociation", "الرجاء اختيار الجمعية") })
        .min(1, { message: tr(t, "selectAssociation", "الرجاء اختيار الجمعية") }),
      fullName: z
        .string()
        .min(1, { message: tr(t, "beneficiaryFullNameRequired", "الرجاء إضافة الاسم الرباعي") }),
      nationalId: z
        .string()
        .min(1, { message: tr(t, "nationalIdRequired", "الرجاء إضافة رقم الهوية") }),
      birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: tr(t, "birthDateRequired", "الرجاء إضافة تاريخ الميلاد"),
      }),
      maritalStatus: z
        .string()
        .min(1, { message: tr(t, "maritalStatusRequired", "الرجاء إختيار الحالة الاجتماعية") }),
      educationLevel: z
        .string()
        .min(1, { message: tr(t, "educationLevelRequired", "الرجاء إختيار المستوى التعليمي") }),
      healthStatus: z
        .string()
        .min(1, { message: tr(t, "healthStatusRequired", "الرجاء إختيار الحالة الصحية") }),
      diseaseType: z.string().optional().nullable(),
      disabilityType: z.string().optional().nullable(),
      phone: z.string().regex(/^(5\d{8})$/, {
        message: tr(t, "phoneFormatInvalid", "الرقم يجب أن يبدأ بـ 5 ويتكون من 9 أرقام"),
      }),
      alternatePhone: z.string().optional().nullable(),
      totalFamilyMembers: z.number().int().optional().nullable(),
      address: z
        .string()
        .min(3, { message: tr(t, "addressRequired", "الرجاء إضافة العنوان") }),
      photoId: z.number().optional().nullable(),
      addressProofId: z.number().optional().nullable(),
      researcherOpinion: z.string().optional().nullable(),
      dependentsOpinion: z.string().optional().nullable(),
      dependents: z.array(createDependentSchema(t)).optional().default([]),

      // Financial Status
      salaryIncome: z.number().optional().nullable(),
      socialSecurity: z.number().optional().nullable(),
      citizenAccount: z.number().optional().nullable(),
      comprehensiveRehab: z.number().optional().nullable(),
      otherAssocSupport: z.number().optional().nullable(),
      livestockCount: z.number().int().min(0).optional().nullable(),
      otherAssetTotal: z.number().optional().nullable(),
      otherAssetDesc: z.string().optional().nullable(),
      incomeAssets: z.array(z.string()).optional().nullable(),
      totalIncome: z.number().optional().nullable(),

      rentAmount: z.number().optional().nullable(),
      electricityBill: z.number().optional().nullable(),
      waterBill: z.number().optional().nullable(),
      internetBill: z.number().optional().nullable(),
      phoneBill: z.number().optional().nullable(),
      gasBill: z.number().optional().nullable(),
      serviceBills: z.array(z.string()).optional().nullable(),
      medicalExpenses: z.number().optional().nullable(),
      transportExpenses: z.number().optional().nullable(),
      foodExpenses: z.number().optional().nullable(),
      debtMonthly: z.number().optional().nullable(),
      debtReason: z.string().optional().nullable(),
      debtPeriod: z.string().optional().nullable(),
      debtAttachmentId: z.number().optional().nullable(),
      totalExpenses: z.number().optional().nullable(),
      netIncome: z.number().optional().nullable(),
      financialOpinion: z.string().optional().nullable(),

      // الاحتياجات
      needs: z.any().optional().nullable(),
      needsOpinion: z.string().optional().nullable(),

      // باقات التبرع
      donationPackages: z.array(createDonationPackageSchema(t)).optional().default([]),

      // الخلاصة
      finalRecommendation: z.string().optional().nullable(),
      caseClassification: z
        .union([z.string(), z.null(), z.undefined()])
        .refine((val) => val !== null && val !== undefined && String(val).trim().length > 0, {
          message: tr(t, "caseClassificationRequired", "الرجاء إختيار تصنيف الحالة"),
        }),

      // المرفقات والصور الميدانية
      buildingPhotoId: z.number().optional().nullable(),
      fieldPhotos: z
        .array(
          z.object({
            id: z.number().optional(),
            photoType: z.string(),
            attachmentId: z.number(),
            sortOrder: z.number().optional(),
          })
        )
        .optional()
        .default([]),
    })
    .superRefine((data, ctx) => {
      if (
        data.incomeAssets?.includes("1") &&
        (data.livestockCount === null || data.livestockCount === undefined)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["livestockCount"],
          message: tr(t, "livestockCountRequired", "الرجاء إضافة عدد المواشي"),
        });
      }
      if (
        data.incomeAssets?.includes("4") &&
        (!data.otherAssetDesc || data.otherAssetDesc.trim() === "")
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["otherAssetDesc"],
          message: tr(t, "otherAssetDescRequired", "الرجاء إضافة وصف الأصل الآخر"),
        });
      }
      if (
        data.serviceBills?.includes("1") &&
        (data.electricityBill === null || data.electricityBill === undefined)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["electricityBill"],
          message: tr(t, "electricityBillRequired", "الرجاء إضافة قيمة فاتورة الكهرباء"),
        });
      }
      if (
        data.serviceBills?.includes("2") &&
        (data.waterBill === null || data.waterBill === undefined)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["waterBill"],
          message: tr(t, "waterBillRequired", "الرجاء إضافة قيمة فاتورة الماء"),
        });
      }
      if (
        data.serviceBills?.includes("3") &&
        (data.internetBill === null || data.internetBill === undefined)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["internetBill"],
          message: tr(t, "internetBillRequired", "الرجاء إضافة قيمة فاتورة الإنترنت"),
        });
      }
      if (
        data.serviceBills?.includes("4") &&
        (data.phoneBill === null || data.phoneBill === undefined)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phoneBill"],
          message: tr(t, "phoneBillRequired", "الرجاء إضافة قيمة فاتورة الهاتف"),
        });
      }
      if (
        data.serviceBills?.includes("5") &&
        (data.gasBill === null || data.gasBill === undefined)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["gasBill"],
          message: tr(t, "gasBillRequired", "الرجاء إضافة قيمة فاتورة الغاز"),
        });
      }
      if (
        data.debtMonthly &&
        data.debtMonthly > 0 &&
        (!data.debtReason || data.debtReason.trim() === "")
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["debtReason"],
          message: tr(t, "debtReasonRequired", "الرجاء إضافة سبب الدين"),
        });
      }
      if (
        data.debtMonthly &&
        data.debtMonthly > 0 &&
        (!data.debtPeriod || data.debtPeriod.trim() === "")
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["debtPeriod"],
          message: tr(t, "debtPeriodRequired", "الرجاء إضافة فترة السداد"),
        });
      }
      if (data.debtMonthly && data.debtMonthly > 0 && !data.debtAttachmentId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["debtAttachmentId"],
          message: tr(t, "debtAttachmentRequired", "الرجاء إرفاق إثبات الدين"),
        });
      }

      // الاحتياجات — validation مشروط
      const n = data.needs as Record<string, any> | null | undefined;
      if (n) {
        if (n.shelter && !n.shelter_type) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["needs", "shelter_type"],
            message: tr(t, "shelterTypeRequired", "الرجاء اختيار نوع الاحتياج السكني"),
          });
        }
        if (
          n.shelter &&
          n.shelter_type === "renovation" &&
          !n.structural_needed &&
          !n.plumbing_needed &&
          !n.electrical_needed &&
          !n.painting_needed &&
          !n.furniture_needed
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["needs", "shelter_type"],
            message: tr(t, "renovationTypeRequired", "الرجاء اختيار نوع الترميم المطلوب على الأقل"),
          });
        }
        if (
          n.structural_needed &&
          !n.structural_columns &&
          !n.structural_full &&
          !n.structural_roof_insulation &&
          !n.structural_roof_slope
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["needs", "structural_needed"],
            message: tr(t, "structuralRenovationRequired", "الرجاء اختيار نوع الترميم الإنشائي"),
          });
        }
        if (
          n.plumbing_needed &&
          !n.plumbing_general &&
          !n.plumbing_mixers &&
          !n.plumbing_pipes &&
          !n.plumbing_other
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["needs", "plumbing_needed"],
            message: tr(t, "plumbingMaintenanceRequired", "الرجاء اختيار نوع صيانة السباكة"),
          });
        }
        if (
          n.electrical_needed &&
          !n.electrical_general &&
          !n.electrical_wires &&
          !n.electrical_sockets &&
          !n.electrical_other
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["needs", "electrical_needed"],
            message: tr(t, "electricalMaintenanceRequired", "الرجاء اختيار نوع صيانة الكهرباء"),
          });
        }
        if (n.painting_needed && !n.painting_interior && !n.painting_exterior) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["needs", "painting_needed"],
            message: tr(t, "paintingTypeRequired", "الرجاء اختيار نوع الدهانات"),
          });
        }
        if (
          n.furniture_needed &&
          !n.furniture_carpet &&
          !n.furniture_seating &&
          !n.furniture_bedrooms &&
          !n.furniture_closets &&
          !n.furniture_lighting
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["needs", "furniture_needed"],
            message: tr(t, "furnitureTypeRequired", "الرجاء اختيار نوع الأثاث المطلوب"),
          });
        }
        if (
          n.furniture_carpet &&
          (n.furniture_carpet_area === null || n.furniture_carpet_area === undefined)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["needs", "furniture_carpet_area"],
            message: tr(t, "areaRequired", "الرجاء إدخال المساحة"),
          });
        }
        if (
          n.furniture_seating &&
          (n.furniture_seating_area === null || n.furniture_seating_area === undefined)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["needs", "furniture_seating_area"],
            message: tr(t, "areaRequired", "الرجاء إدخال المساحة"),
          });
        }
        if (n.furniture_bedrooms && !n.furniture_beds && !n.furniture_mattresses) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["needs", "furniture_beds"],
            message: tr(t, "bedsCountRequired", "الرجاء إدخال عدد الأسرة أو المراتب"),
          });
        }
        if (
          n.furniture_closets &&
          (n.furniture_closets_count === null || n.furniture_closets_count === undefined)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["needs", "furniture_closets_count"],
            message: tr(t, "countRequired", "الرجاء إدخال العدد"),
          });
        }
        if (
          n.furniture_lighting &&
          (n.furniture_lighting_count === null || n.furniture_lighting_count === undefined)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["needs", "furniture_lighting_count"],
            message: tr(t, "countRequired", "الرجاء إدخال العدد"),
          });
        }
        if (n.financial_support) {
          if (
            n.financial_support_amount === null ||
            n.financial_support_amount === undefined
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["needs", "financial_support_amount"],
              message: tr(t, "monthlyAmountRequired", "الرجاء إدخال المبلغ الشهري"),
            });
          }
          if (!n.financial_support_reason || n.financial_support_reason.trim() === "") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["needs", "financial_support_reason"],
              message: tr(t, "justificationRequired", "الرجاء إدخال المبرر"),
            });
          }
        }
        if (n.food) {
          if (!n.food_basket_size) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["needs", "food_basket_size"],
              message: tr(t, "basketSizeRequired", "الرجاء اختيار حجم السلة"),
            });
          }
          if (!n.food_basket_frequency) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["needs", "food_basket_frequency"],
              message: tr(t, "basketFrequencyRequired", "الرجاء اختيار التكرار"),
            });
          }
          if (
            n.food_basket_frequency === "one_time" &&
            (n.food_basket_count === null || n.food_basket_count === undefined)
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["needs", "food_basket_count"],
              message: tr(t, "basketsCountRequired", "الرجاء إدخال عدد السلال"),
            });
          }
        }
        if (n.bills && !n.bills_electricity && !n.bills_water) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["needs", "bills_electricity"],
            message: tr(t, "billValueRequired", "الرجاء إدخال قيمة الفاتورة"),
          });
        }
        if (n.rent && (n.rent_amount === null || n.rent_amount === undefined)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["needs", "rent_amount"],
            message: tr(t, "amountRequired", "الرجاء إدخال المبلغ المطلوب"),
          });
        }
        if (
          n.appliances &&
          !n.appliance_fridge &&
          !n.appliance_washer &&
          !n.appliance_ac &&
          !n.appliance_oven &&
          !n.appliance_water_heater &&
          !n.appliance_water_filter
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["needs", "appliance_fridge"],
            message: tr(t, "applianceCountRequired", "الرجاء إدخال عدد جهاز واحد على الأقل"),
          });
        }
        if (n.transport) {
          if (!n.transport_owns) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["needs", "transport_owns"],
              message: tr(t, "transportOwnershipRequired", "الرجاء تحديد هل تمتلك الأسرة وسيلة نقل"),
            });
          }
          if (!n.transport_reason || n.transport_reason.trim() === "") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["needs", "transport_reason"],
              message: tr(t, "justificationRequired", "الرجاء إدخال المبرر"),
            });
          }
          if (!n.transport_recommendation) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["needs", "transport_recommendation"],
              message: tr(t, "transportRecommendationRequired", "الرجاء اختيار التوصية"),
            });
          }
          if (
            n.transport_owns === "yes" &&
            (!n.transport_type || n.transport_type.trim() === "")
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["needs", "transport_type"],
              message: tr(t, "transportTypeStateRequired", "الرجاء إدخال النوع والحالة"),
            });
          }
        }
        if (n.medical) {
          if (!n.medical_disease || n.medical_disease.trim() === "") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["needs", "medical_disease"],
              message: tr(t, "medicalDiseaseRequired", "الرجاء إدخال نوع المرض"),
            });
          }
          if (!n.medical_medication && !n.medical_equipment && !n.medical_surgery) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["needs", "medical_medication"],
              message: tr(t, "medicalNeedTypeRequired", "الرجاء اختيار نوع الاحتياج الطبي"),
            });
          }
          if (n.medical_cost === null || n.medical_cost === undefined) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["needs", "medical_cost"],
              message: tr(t, "estimatedCostRequired", "الرجاء إدخال التكلفة المقدرة"),
            });
          }
        }
        if (
          n.tech &&
          !n.tech_desktop &&
          !n.tech_laptop &&
          !n.tech_ipad &&
          !n.tech_internet
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["needs", "tech_desktop"],
            message: tr(t, "techDeviceRequired", "الرجاء اختيار أحد الأجهزة على الأقل"),
          });
        }
        if (n.training) {
          if (!n.training_goal) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["needs", "training_goal"],
              message: tr(t, "goalRequired", "الرجاء اختيار الهدف"),
            });
          }
          if (!n.training_gender) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["needs", "training_gender"],
              message: tr(t, "genderRequired", "الرجاء اختيار الجنس"),
            });
          }
          if (!n.training_age) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["needs", "training_age"],
              message: tr(t, "ageGroupRequired", "الرجاء اختيار الفئة العمرية"),
            });
          }
          if (!n.training_program || n.training_program.trim() === "") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["needs", "training_program"],
              message: tr(t, "programSuggestedRequired", "الرجاء إدخال البرنامج المقترح"),
            });
          }
        }
        if (n.skills && (!n.skills_list || n.skills_list.trim() === "")) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["needs", "skills_list"],
            message: tr(t, "skillsRequired", "الرجاء إدخال المهارات/المهن"),
          });
        }
      }
    });

export const beneficiarySchema = createBeneficiarySchema();

// ----------------------------------------------------
// Marketer Monthly Report Schema (All Fields Required)
// ----------------------------------------------------
export const createMarketerMonthlyReportSchema = (t?: TranslateFn) =>
  z.object({
    description: z
      .string({ message: tr(t, "reportDescriptionRequired", "يرجى كتابة وصف التقرير الشهري") })
      .trim()
      .min(1, { message: tr(t, "reportDescriptionRequired", "وصف التقرير مطلوب") }),
    reportDate: z
      .string({ message: tr(t, "reportDateRequired", "يرجى تحديد تاريخ التقرير الشهري") })
      .trim()
      .min(1, { message: tr(t, "reportDateRequired", "تاريخ التقرير مطلوب") }),
    attachment: z
      .any()
      .refine((val) => val && (val.id || val.data || val.url || val.file), {
        message: tr(t, "reportAttachmentRequired", "يرجى إرفاق ملف الإكسل الخاص بالتقرير الشهري"),
      }),
  });

export const marketerMonthlyReportSchema = createMarketerMonthlyReportSchema();
