import { PrismaClient } from "@prisma/client";

export const DEFAULT_SELECT_OPTIONS: {
  category: string;
  value: string;
  label: string;
  labelEn: string;
  sortOrder?: number;
}[] = [
  // 1. أنواع المسوقين (Marketer Types)
  { category: "marketer_type", value: "employee", label: "موظف", labelEn: "Employee", sortOrder: 1 },
  { category: "marketer_type", value: "company", label: "مؤسسة", labelEn: "Company", sortOrder: 2 },
  { category: "marketer_type", value: "influencer", label: "مؤثر", labelEn: "Influencer", sortOrder: 3 },
  { category: "marketer_type", value: "volunteer", label: "متطوع", labelEn: "Volunteer", sortOrder: 4 },

  // 2. أنواع الهوية (Identity Types)
  { category: "identity_type", value: "national_id", label: "هوية وطنية", labelEn: "National ID", sortOrder: 1 },
  { category: "identity_type", value: "resident_id", label: "إقامة", labelEn: "Resident ID", sortOrder: 2 },

  // 3. الحالة الاجتماعية (Marital Status)
  { category: "marital_status", value: "married", label: "متزوج/ة", labelEn: "Married", sortOrder: 1 },
  { category: "marital_status", value: "widowed", label: "أرمل/ة", labelEn: "Widowed", sortOrder: 2 },
  { category: "marital_status", value: "divorced", label: "مطلق/ة", labelEn: "Divorced", sortOrder: 3 },
  { category: "marital_status", value: "abandoned", label: "مهجور/ة", labelEn: "Abandoned", sortOrder: 4 },
  { category: "marital_status", value: "single", label: "أعزب", labelEn: "Single", sortOrder: 5 },

  // 4. الحالة الصحية (Health Status)
  { category: "health_status", value: "healthy", label: "سليم", labelEn: "Healthy", sortOrder: 1 },
  { category: "health_status", value: "disabled", label: "من ذوي الإعاقة", labelEn: "Disabled", sortOrder: 2 },
  { category: "health_status", value: "sick", label: "مريض", labelEn: "Sick", sortOrder: 3 },

  // 5. المستوى التعليمي (Education Level)
  { category: "education_level", value: "none", label: "غير متعلم", labelEn: "Uneducated", sortOrder: 1 },
  { category: "education_level", value: "primary", label: "ابتدائي", labelEn: "Primary", sortOrder: 2 },
  { category: "education_level", value: "middle", label: "متوسط", labelEn: "Middle", sortOrder: 3 },
  { category: "education_level", value: "secondary", label: "ثانوي", labelEn: "High School", sortOrder: 4 },
  { category: "education_level", value: "diploma", label: "دبلوم", labelEn: "Diploma", sortOrder: 5 },
  { category: "education_level", value: "bachelor", label: "بكالوريوس", labelEn: "Bachelor", sortOrder: 6 },
  { category: "education_level", value: "master", label: "ماجستير", labelEn: "Master", sortOrder: 7 },
  { category: "education_level", value: "doctorate", label: "دكتوراه", labelEn: "Doctorate", sortOrder: 8 },

  // 6. صلة القرابة للتابعين (Dependent Relationship)
  { category: "dependent_relationship", value: "son", label: "ابن", labelEn: "Son", sortOrder: 1 },
  { category: "dependent_relationship", value: "daughter", label: "بنت", labelEn: "Daughter", sortOrder: 2 },
  { category: "dependent_relationship", value: "wife", label: "زوجة", labelEn: "Wife", sortOrder: 3 },
  { category: "dependent_relationship", value: "husband", label: "زوج", labelEn: "Husband", sortOrder: 4 },
  { category: "dependent_relationship", value: "mother", label: "أم", labelEn: "Mother", sortOrder: 5 },
  { category: "dependent_relationship", value: "father", label: "أب", labelEn: "Father", sortOrder: 6 },
  { category: "dependent_relationship", value: "brother", label: "أخ", labelEn: "Brother", sortOrder: 7 },
  { category: "dependent_relationship", value: "sister", label: "أخت", labelEn: "Sister", sortOrder: 8 },
  { category: "dependent_relationship", value: "grandson", label: "حفيد", labelEn: "Grandson", sortOrder: 9 },
  { category: "dependent_relationship", value: "other", label: "آخر", labelEn: "Other", sortOrder: 10 },

  // 7. الحالة الاجتماعية الإضافية (Social Status)
  { category: "social_status", value: "orphan", label: "يتيم", labelEn: "Orphan", sortOrder: 1 },
  { category: "social_status", value: "normal", label: "إلخ", labelEn: "Normal", sortOrder: 2 },

  // 8. الحالة العملية (Work Status)
  { category: "work_status", value: "student", label: "طالب", labelEn: "Student", sortOrder: 1 },
  { category: "work_status", value: "employee", label: "يعمل", labelEn: "Employee", sortOrder: 2 },
  { category: "work_status", value: "unemployed", label: "عاطل", labelEn: "Unemployed", sortOrder: 3 },

  // 9. بيئة السكن (Environment)
  { category: "environment", value: "city", label: "مدينة", labelEn: "City", sortOrder: 1 },
  { category: "environment", value: "province", label: "محافظة", labelEn: "Province", sortOrder: 2 },
  { category: "environment", value: "village", label: "قرية", labelEn: "Village", sortOrder: 3 },
  { category: "environment", value: "desert", label: "بادية", labelEn: "Desert", sortOrder: 4 },
  { category: "environment", value: "migatory", label: "هجرة", labelEn: "Migatory", sortOrder: 5 },

  // 10. نوع السكن (Housing Type)
  { category: "housing_type", value: "apartment", label: "شقة", labelEn: "Apartment", sortOrder: 1 },
  { category: "housing_type", value: "villa_floor", label: "فيلا / دور", labelEn: "Villa / Floor", sortOrder: 2 },
  { category: "housing_type", value: "traditional", label: "شعبي", labelEn: "Traditional", sortOrder: 3 },
  { category: "housing_type", value: "annex", label: "ملحق", labelEn: "Annex", sortOrder: 4 },

  // 11. ملكية السكن (Housing Tenure)
  { category: "housing_tenure", value: "owned", label: "ملك", labelEn: "Owned", sortOrder: 1 },
  { category: "housing_tenure", value: "rented", label: "إيجار", labelEn: "Rented", sortOrder: 2 },
  { category: "housing_tenure", value: "charity_housing", label: "وقف خيري", labelEn: "Charity Housing", sortOrder: 3 },
  { category: "housing_tenure", value: "inherited", label: "ورثة", labelEn: "Inherited", sortOrder: 4 },

  // 12. تصنيف حالة المستفيد (Case Classification)
  { category: "case_classification", value: "top-priority", label: "أولوية قصوى", labelEn: "Top Priority", sortOrder: 1 },
  { category: "case_classification", value: "medium-priority", label: "أولوية متوسطة", labelEn: "Medium Priority", sortOrder: 2 },
  { category: "case_classification", value: "not-eligible", label: "غير مستحقة", labelEn: "Not Eligible", sortOrder: 3 },

  // 13. نوع السكن المطلوب (Shelter Type)
  { category: "shelter_type", value: "new", label: "جديد", labelEn: "New", sortOrder: 1 },
  { category: "shelter_type", value: "renovation", label: "ترميم", labelEn: "Renovation", sortOrder: 2 },

  // 14. حجم السلة الغذائية (Food Basket Size)
  { category: "food_basket_size", value: "small", label: "صغيرة", labelEn: "Small", sortOrder: 1 },
  { category: "food_basket_size", value: "medium", label: "متوسطة", labelEn: "Medium", sortOrder: 2 },
  { category: "food_basket_size", value: "large", label: "كبيرة", labelEn: "Large", sortOrder: 3 },

  // 15. تكرار السلة الغذائية (Food Basket Frequency)
  { category: "food_basket_freq", value: "monthly", label: "شهري", labelEn: "Monthly", sortOrder: 1 },
  { category: "food_basket_freq", value: "one_time", label: "مرة واحدة", labelEn: "One-time", sortOrder: 2 },

  // 16. امتلاك وسيلة نقل (Transport Owns)
  { category: "transport_owns", value: "yes", label: "نعم", labelEn: "Yes", sortOrder: 1 },
  { category: "transport_owns", value: "no", label: "لا", labelEn: "No", sortOrder: 2 },

  // 17. توصية المركبة (Transport Recommendation)
  { category: "transport_recommendation", value: "small_car", label: "سيارة صغيرة", labelEn: "Small Car", sortOrder: 1 },
  { category: "transport_recommendation", value: "family_car", label: "سيارة عائلية", labelEn: "Family Car", sortOrder: 2 },
  { category: "transport_recommendation", value: "school_transport", label: "نقل مدرسي", labelEn: "School Transport", sortOrder: 3 },

  // 18. هدف التدريب (Training Goal)
  { category: "training_goal", value: "work", label: "التوظيف", labelEn: "Employment", sortOrder: 1 },
  { category: "training_goal", value: "skill", label: "تطوير مهارة", labelEn: "Skill Development", sortOrder: 2 },

  // 19. فئة جنس التدريب (Training Target Gender)
  { category: "training_gender", value: "male", label: "ذكور", labelEn: "Male", sortOrder: 1 },
  { category: "training_gender", value: "female", label: "إناث", labelEn: "Female", sortOrder: 2 },

  // 20. الفئة العمرية للتدريب (Training Target Age)
  { category: "training_age", value: "18-25", label: "18-25 سنة", labelEn: "18-25 Years", sortOrder: 1 },
  { category: "training_age", value: "26-40", label: "26-40 سنة", labelEn: "26-40 Years", sortOrder: 2 },
  { category: "training_age", value: "40+", label: "أكثر من 40 سنة", labelEn: "40+ Years", sortOrder: 3 },
];

export async function seedSelectOptions(prisma: PrismaClient) {
  console.log("📋 Seeding System Select Options...");
  for (const opt of DEFAULT_SELECT_OPTIONS) {
    const existing = await prisma.selectOption.findFirst({
      where: { category: opt.category, value: opt.value },
    });
    if (existing) {
      await prisma.selectOption.update({
        where: { id: existing.id },
        data: {
          label: opt.label,
          labelEn: opt.labelEn,
          sortOrder: opt.sortOrder || 0,
        },
      });
    } else {
      await prisma.selectOption.create({
        data: {
          category: opt.category,
          value: opt.value,
          label: opt.label,
          labelEn: opt.labelEn,
          sortOrder: opt.sortOrder || 0,
        },
      });
    }
  }
  console.log(`✅ Seeded ${DEFAULT_SELECT_OPTIONS.length} select options successfully.`);
}
