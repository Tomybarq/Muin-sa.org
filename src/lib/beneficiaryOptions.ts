export interface SelectOptionItem {
  value: string;
  label: string;
  labelEn: string;
  sortOrder?: number;
}

export const MARITAL_OPTIONS: SelectOptionItem[] = [
  { value: "married", label: "متزوج/ة", labelEn: "Married" },
  { value: "widowed", label: "أرمل/ة", labelEn: "Widowed" },
  { value: "divorced", label: "مطلق/ة", labelEn: "Divorced" },
  { value: "abandoned", label: "مهجور/ة", labelEn: "Abandoned" },
  { value: "single", label: "أعزب", labelEn: "Single" },
];

export const HEALTH_OPTIONS: SelectOptionItem[] = [
  { value: "healthy", label: "سليم", labelEn: "Healthy" },
  { value: "disabled", label: "من ذوي الإعاقة", labelEn: "Disabled" },
  { value: "sick", label: "مريض", labelEn: "Sick" },
];

export const EDUCATION_OPTIONS: SelectOptionItem[] = [
  { value: "none", label: "غير متعلم", labelEn: "Uneducated" },
  { value: "primary", label: "ابتدائي", labelEn: "Primary" },
  { value: "middle", label: "متوسط", labelEn: "Middle" },
  { value: "secondary", label: "ثانوي", labelEn: "High School" },
  { value: "diploma", label: "دبلوم", labelEn: "Diploma" },
  { value: "bachelor", label: "بكالوريوس", labelEn: "Bachelor" },
  { value: "master", label: "ماجستير", labelEn: "Master" },
  { value: "doctorate", label: "دكتوراه", labelEn: "Doctorate" },
];

export const DEPENDENT_RELATIONSHIP_OPTIONS: SelectOptionItem[] = [
  { value: "son", label: "ابن", labelEn: "Son" },
  { value: "daughter", label: "بنت", labelEn: "Daughter" },
  { value: "wife", label: "زوجة", labelEn: "Wife" },
  { value: "husband", label: "زوج", labelEn: "Husband" },
  { value: "mother", label: "أم", labelEn: "Mother" },
  { value: "father", label: "أب", labelEn: "Father" },
  { value: "brother", label: "أخ", labelEn: "Brother" },
  { value: "sister", label: "أخت", labelEn: "Sister" },
  { value: "grandson", label: "حفيد", labelEn: "Grandson" },
  { value: "other", label: "آخر", labelEn: "Other" },
];

export const SOCIAL_STATUS_OPTIONS: SelectOptionItem[] = [
  { value: "orphan", label: "يتيم", labelEn: "Orphan" },
  { value: "normal", label: "إلخ", labelEn: "Normal" },
];

export const WORK_STATUS_OPTIONS: SelectOptionItem[] = [
  { value: "student", label: "طالب", labelEn: "Student" },
  { value: "employee", label: "يعمل", labelEn: "Employee" },
  { value: "unemployed", label: "عاطل", labelEn: "Unemployed" },
];

export const ENVIRONMENT_OPTIONS: SelectOptionItem[] = [
  { value: "city", label: "مدينة", labelEn: "City" },
  { value: "province", label: "محافظة", labelEn: "Province" },
  { value: "village", label: "قرية", labelEn: "Village" },
  { value: "desert", label: "بادية", labelEn: "Desert" },
  { value: "migatory", label: "هجرة", labelEn: "Migatory" },
];

export const HOUSING_TYPE_OPTIONS: SelectOptionItem[] = [
  { value: "apartment", label: "شقة", labelEn: "Apartment" },
  { value: "villa_floor", label: "فيلا / دور", labelEn: "Villa / Floor" },
  { value: "traditional", label: "شعبي", labelEn: "Traditional" },
  { value: "annex", label: "ملحق", labelEn: "Annex" },
];

export const HOUSING_TENURE_OPTIONS: SelectOptionItem[] = [
  { value: "owned", label: "ملك", labelEn: "Owned" },
  { value: "rented", label: "إيجار", labelEn: "Rented" },
  { value: "charity_housing", label: "وقف خيري", labelEn: "Charity Housing" },
  { value: "inherited", label: "ورثة", labelEn: "Inherited" },
];

export const CASE_CLASSIFICATION_OPTIONS: SelectOptionItem[] = [
  { value: "top-priority", label: "أولوية قصوى", labelEn: "Top Priority" },
  { value: "medium-priority", label: "أولوية متوسطة", labelEn: "Medium Priority" },
  { value: "not-eligible", label: "غير مستحقة", labelEn: "Not Eligible" },
];

export const SHELTER_TYPE_OPTIONS: SelectOptionItem[] = [
  { value: "new", label: "جديد", labelEn: "New" },
  { value: "renovation", label: "ترميم", labelEn: "Renovation" },
];

export const FOOD_BASKET_SIZE_OPTIONS: SelectOptionItem[] = [
  { value: "small", label: "صغيرة", labelEn: "Small" },
  { value: "medium", label: "متوسطة", labelEn: "Medium" },
  { value: "large", label: "كبيرة", labelEn: "Large" },
];

export const FOOD_BASKET_FREQ_OPTIONS: SelectOptionItem[] = [
  { value: "monthly", label: "شهري", labelEn: "Monthly" },
  { value: "one_time", label: "مرة واحدة", labelEn: "One-time" },
];

export const TRANSPORT_OWNS_OPTIONS: SelectOptionItem[] = [
  { value: "yes", label: "نعم", labelEn: "Yes" },
  { value: "no", label: "لا", labelEn: "No" },
];

export const TRANSPORT_RECOMMENDATION_OPTIONS: SelectOptionItem[] = [
  { value: "small_car", label: "سيارة صغيرة", labelEn: "Small Car" },
  { value: "family_car", label: "سيارة عائلية", labelEn: "Family Car" },
  { value: "school_transport", label: "نقل مدرسي", labelEn: "School Transport" },
];

export const TRAINING_GOAL_OPTIONS: SelectOptionItem[] = [
  { value: "work", label: "التوظيف", labelEn: "Employment" },
  { value: "skill", label: "تطوير مهارة", labelEn: "Skill Development" },
];

export const TRAINING_GENDER_OPTIONS: SelectOptionItem[] = [
  { value: "male", label: "ذكور", labelEn: "Male" },
  { value: "female", label: "إناث", labelEn: "Female" },
];

export const TRAINING_AGE_OPTIONS: SelectOptionItem[] = [
  { value: "18-25", label: "18-25 سنة", labelEn: "18-25 Years" },
  { value: "26-40", label: "26-40 سنة", labelEn: "26-40 Years" },
  { value: "40+", label: "أكثر من 40 سنة", labelEn: "40+ Years" },
];

export const MARKETER_TYPE_OPTIONS: SelectOptionItem[] = [
  { value: "employee", label: "موظف", labelEn: "Employee" },
  { value: "company", label: "مؤسسة", labelEn: "Company" },
  { value: "influencer", label: "مؤثر", labelEn: "Influencer" },
  { value: "volunteer", label: "متطوع", labelEn: "Volunteer" },
];

export const IDENTITY_TYPE_OPTIONS: SelectOptionItem[] = [
  { value: "national_id", label: "هوية وطنية", labelEn: "National ID" },
  { value: "resident_id", label: "إقامة", labelEn: "Resident ID" },
];

export function toExportOptions(options: { value: string; label: string; labelEn: string }[]) {
  return options.map((o) => ({ value: o.value, label: o.labelEn, labelAr: o.label }));
}

let selectOptionsPromise: Promise<Record<string, SelectOptionItem[]>> | null = null;
let selectOptionsCacheTime = 0;
const CLIENT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function fetchAllSelectOptionsGrouped(): Promise<Record<string, SelectOptionItem[]>> {
  const now = Date.now();
  if (selectOptionsPromise && now - selectOptionsCacheTime < CLIENT_CACHE_TTL_MS) {
    return selectOptionsPromise;
  }

  selectOptionsPromise = (async () => {
    try {
      const res = await fetch("/api/select-options");
      if (!res.ok) return {};
      const data = await res.json();
      selectOptionsCacheTime = Date.now();
      return data.options || {};
    } catch (err) {
      return {};
    }
  })();

  return selectOptionsPromise;
}

/**
 * Client helper to fetch dynamic select options for a category with fallback.
 * Uses batched single request and in-memory cache.
 */
export async function fetchCategorySelectOptions(
  category: string,
  fallback: SelectOptionItem[]
): Promise<SelectOptionItem[]> {
  try {
    const allGrouped = await fetchAllSelectOptionsGrouped();
    const catOptions = allGrouped[category.trim()];
    if (Array.isArray(catOptions) && catOptions.length > 0) {
      return catOptions;
    }
    return fallback;
  } catch (err) {
    return fallback;
  }
}

export const NEEDS_EXPORT_FIELDS = [
  // 1. السكن والترميم
  { key: "needs.shelter", label: "Needs/Shelter Required", labelAr: "الاحتياج للسكن/الترميم", type: "boolean" as const },
  { key: "needs.shelter_type", label: "Needs/Shelter Type", labelAr: "نوع السكن المطلوب", options: toExportOptions(SHELTER_TYPE_OPTIONS) },
  { key: "needs.structural_needed", label: "Needs/Structural Needed", labelAr: "احتياج إنشائي", type: "boolean" as const },
  { key: "needs.structural_columns", label: "Needs/Structural Columns", labelAr: "ترميم أعمدة", type: "boolean" as const },
  { key: "needs.structural_full", label: "Needs/Structural Full", labelAr: "ترميم كامل", type: "boolean" as const },
  { key: "needs.structural_roof_insulation", label: "Needs/Roof Insulation", labelAr: "عزل أسطح", type: "boolean" as const },
  { key: "needs.structural_roof_slope", label: "Needs/Roof Slope", labelAr: "ميول أسطح", type: "boolean" as const },
  { key: "needs.plumbing_needed", label: "Needs/Plumbing Needed", labelAr: "احتياج سباكة", type: "boolean" as const },
  { key: "needs.plumbing_general", label: "Needs/Plumbing General", labelAr: "سباكة عامة", type: "boolean" as const },
  { key: "needs.plumbing_mixers", label: "Needs/Plumbing Mixers", labelAr: "خلاطات سباكة", type: "boolean" as const },
  { key: "needs.plumbing_pipes", label: "Needs/Plumbing Pipes", labelAr: "مواسير وخطوط سباكة", type: "boolean" as const },
  { key: "needs.plumbing_other", label: "Needs/Plumbing Other", labelAr: "سباكة أخرى" },
  { key: "needs.electrical_needed", label: "Needs/Electrical Needed", labelAr: "احتياج كهرباء", type: "boolean" as const },
  { key: "needs.electrical_general", label: "Needs/Electrical General", labelAr: "كهرباء عامة", type: "boolean" as const },
  { key: "needs.electrical_wires", label: "Needs/Electrical Wires", labelAr: "تمديد أسلاك كهربائية", type: "boolean" as const },
  { key: "needs.electrical_sockets", label: "Needs/Electrical Sockets", labelAr: "مفاتيح وأفياش كهربائية", type: "boolean" as const },
  { key: "needs.electrical_other", label: "Needs/Electrical Other", labelAr: "كهرباء أخرى" },
  { key: "needs.painting_needed", label: "Needs/Painting Needed", labelAr: "احتياج دهان", type: "boolean" as const },
  { key: "needs.painting_interior", label: "Needs/Painting Interior", labelAr: "دهان داخلي", type: "boolean" as const },
  { key: "needs.painting_exterior", label: "Needs/Painting Exterior", labelAr: "دهان خارجي", type: "boolean" as const },
  { key: "needs.furniture_needed", label: "Needs/Furniture Needed", labelAr: "احتياج أثاث", type: "boolean" as const },
  { key: "needs.furniture_carpet", label: "Needs/Carpet", labelAr: "موكيت/سجاد", type: "boolean" as const },
  { key: "needs.furniture_carpet_area", label: "Needs/Carpet Area (m²)", labelAr: "مساحة السجاد (م²)" },
  { key: "needs.furniture_seating", label: "Needs/Seating", labelAr: "جلسات/كنب", type: "boolean" as const },
  { key: "needs.furniture_seating_area", label: "Needs/Seating Area (m²)", labelAr: "مساحة الجلسات (م²)" },
  { key: "needs.furniture_bedrooms", label: "Needs/Bedrooms", labelAr: "غرف نوم", type: "boolean" as const },
  { key: "needs.furniture_beds", label: "Needs/Beds Count", labelAr: "عدد الأسرة" },
  { key: "needs.furniture_mattresses", label: "Needs/Mattresses Count", labelAr: "عدد المراتب" },
  { key: "needs.furniture_closets", label: "Needs/Closets", labelAr: "دولاب ملابس", type: "boolean" as const },
  { key: "needs.furniture_closets_count", label: "Needs/Closets Count", labelAr: "عدد الدواليب" },
  { key: "needs.furniture_lighting", label: "Needs/Lighting", labelAr: "إضاءة وتجهيزات", type: "boolean" as const },
  { key: "needs.furniture_lighting_count", label: "Needs/Lighting Count", labelAr: "عدد الإضاءات" },

  // 2. كفالة مالية
  { key: "needs.financial_support", label: "Needs/Financial Support Needed", labelAr: "الاحتياج لكفالة مالية", type: "boolean" as const },
  { key: "needs.financial_support_amount", label: "Needs/Financial Support Amount", labelAr: "مبلغ الكفالة المطلوبة" },
  { key: "needs.financial_support_reason", label: "Needs/Financial Support Reason", labelAr: "سبب طلب الكفالة" },

  // 3. الغذاء وااحتياجات الأطفال
  { key: "needs.food", label: "Needs/Food & Child Supplies Needed", labelAr: "الاحتياج للغذاء واحتياجات الأطفال", type: "boolean" as const },
  { key: "needs.food_basket_size", label: "Needs/Food Basket Size", labelAr: "حجم السلة الغذائية", options: toExportOptions(FOOD_BASKET_SIZE_OPTIONS) },
  { key: "needs.food_basket_frequency", label: "Needs/Food Basket Frequency", labelAr: "تكرار السلة الغذائية", options: toExportOptions(FOOD_BASKET_FREQ_OPTIONS) },
  { key: "needs.food_basket_count", label: "Needs/Food Basket Count", labelAr: "عدد السلال الغذائية" },
  { key: "needs.child_milk", label: "Needs/Child Milk", labelAr: "حليب أطفال", type: "boolean" as const },
  { key: "needs.child_hygiene", label: "Needs/Child Hygiene", labelAr: "مستلزمات نظافة أطفال", type: "boolean" as const },
  { key: "needs.child_other", label: "Needs/Child Other Supplies", labelAr: "مستلزمات أطفال أخرى" },

  // 4. سداد فواتير
  { key: "needs.bills", label: "Needs/Bills Payment Needed", labelAr: "الاحتياج لسداد الفواتير", type: "boolean" as const },
  { key: "needs.bills_electricity", label: "Needs/Electricity Bill Amount", labelAr: "مبلغ فاتورة الكهرباء" },
  { key: "needs.bills_water", label: "Needs/Water Bill Amount", labelAr: "مبلغ فاتورة الماء" },

  // 5. سداد إيجار
  { key: "needs.rent", label: "Needs/Rent Payment Needed", labelAr: "الاحتياج لسداد الإيجار", type: "boolean" as const },
  { key: "needs.rent_amount", label: "Needs/Rent Amount Needed", labelAr: "مبلغ الإيجار المطلوب" },

  // 6. أجهزة كهربائية
  { key: "needs.appliances", label: "Needs/Appliances Needed", labelAr: "الاحتياج لأجهزة كهربائية", type: "boolean" as const },
  { key: "needs.appliance_fridge", label: "Needs/Fridge Count", labelAr: "ثلاجة (العدد)" },
  { key: "needs.appliance_washer", label: "Needs/Washer Count", labelAr: "غسالة (العدد)" },
  { key: "needs.appliance_ac", label: "Needs/AC Count", labelAr: "مكيف (العدد)" },
  { key: "needs.appliance_oven", label: "Needs/Oven Count", labelAr: "فرن (العدد)" },
  { key: "needs.appliance_water_heater", label: "Needs/Water Heater Count", labelAr: "سخان ماء (العدد)" },
  { key: "needs.appliance_water_filter", label: "Needs/Water Filter Count", labelAr: "برادة/فلتر ماء (العدد)" },

  // 7. وسيلة نقل
  { key: "needs.transport", label: "Needs/Transport Needed", labelAr: "الاحتياج لوسيلة نقل", type: "boolean" as const },
  { key: "needs.transport_owns", label: "Needs/Owns Transport Vehicle", labelAr: "يمتلك وسيلة نقل", options: toExportOptions(TRANSPORT_OWNS_OPTIONS) },
  { key: "needs.transport_type", label: "Needs/Current Transport Vehicle Type", labelAr: "نوع المركبة الحالية" },
  { key: "needs.transport_reason", label: "Needs/Transport Request Reason", labelAr: "سبب طلب وسيلة النقل" },
  { key: "needs.transport_recommendation", label: "Needs/Transport Vehicle Recommendation", labelAr: "توصية الباحث للمركبة", options: toExportOptions(TRANSPORT_RECOMMENDATION_OPTIONS) },

  // 8. دعم طبي
  { key: "needs.medical", label: "Needs/Medical Support Needed", labelAr: "الاحتياج لدعم طبي", type: "boolean" as const },
  { key: "needs.medical_disease", label: "Needs/Medical Condition", labelAr: "المرض أو الحالة الصحية" },
  { key: "needs.medical_medication", label: "Needs/Medication & Supplies", labelAr: "أدوية ومستلزمات طبية", type: "boolean" as const },
  { key: "needs.medical_equipment", label: "Needs/Medical Equipment", labelAr: "أجهزة واحتياجات طبية", type: "boolean" as const },
  { key: "needs.medical_surgery", label: "Needs/Surgical Operation", labelAr: "عمليات جراحية", type: "boolean" as const },
  { key: "needs.medical_cost", label: "Needs/Medical Cost", labelAr: "التكلفة المالية للتأمين/العلاج" },

  // 9. أجهزة تقنية
  { key: "needs.tech", label: "Needs/Tech Devices Needed", labelAr: "الاحتياج لأجهزة تقنية", type: "boolean" as const },
  { key: "needs.tech_desktop", label: "Needs/Desktop Count", labelAr: "كمبيوتر مكتبي (العدد)" },
  { key: "needs.tech_laptop", label: "Needs/Laptop Count", labelAr: "لابتوب (العدد)" },
  { key: "needs.tech_ipad", label: "Needs/Tablet Count", labelAr: "آيباد/تابلت (العدد)" },
  { key: "needs.tech_internet", label: "Needs/Internet Subscription", labelAr: "اشتراك إنترنت", type: "boolean" as const },

  // 10. تدريب وتأهيل
  { key: "needs.training", label: "Needs/Training Needed", labelAr: "الاحتياج لتدريب وتأهيل", type: "boolean" as const },
  { key: "needs.training_goal", label: "Needs/Training Goal", labelAr: "هدف التدريب", options: toExportOptions(TRAINING_GOAL_OPTIONS) },
  { key: "needs.training_gender", label: "Needs/Training Target Gender", labelAr: "الفئة المستهدفة للتدريب", options: toExportOptions(TRAINING_GENDER_OPTIONS) },
  { key: "needs.training_age", label: "Needs/Training Target Age", labelAr: "الفئة العمرية للتدريب", options: toExportOptions(TRAINING_AGE_OPTIONS) },
  { key: "needs.training_program", label: "Needs/Recommended Training Program", labelAr: "اسم البرنامج التدريبي" },

  // 11. مهارات
  { key: "needs.skills", label: "Needs/Skills Needed", labelAr: "الاحتياج لتطوير مهارات", type: "boolean" as const },
  { key: "needs.skills_list", label: "Needs/Current Skills", labelAr: "المهارات الحالية" },
  { key: "needs.skills_owned", label: "Needs/Owned Skills", labelAr: "المهارات التي يمتلكها المستفيد/التابعون" },
  { key: "needs.skills_needed", label: "Needs/Required Skills", labelAr: "المهارات المطلوب اكتسابها" },

  // 12. آراء الباحث في الاحتياجات
  { key: "needs.researcher_opinion_basic", label: "Needs/Basic Needs Researcher Opinion", labelAr: "رأي الباحث في الاحتياجات الأساسية" },
  { key: "needs.researcher_opinion_dev", label: "Needs/Developmental Needs Researcher Opinion", labelAr: "رأي الباحث في الاحتياجات التطويرية" },
];
