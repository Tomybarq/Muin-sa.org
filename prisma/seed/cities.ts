import { PrismaClient } from "@prisma/client";

export const cities = [
  // --- منطقة الرياض ---
  { id: 1, name: "Riyadh", nameAr: "الرياض", governorateId: 1 },
  { id: 2, name: "Diriyah", nameAr: "الدرعية", governorateId: 1 },
  { id: 3, name: "Al-Kharj", nameAr: "الخرج", governorateId: 1 },
  { id: 4, name: "Al-Majma'ah", nameAr: "المجمعة", governorateId: 1 },
  { id: 5, name: "Al-Quway'iyah", nameAr: "القويعية", governorateId: 1 },
  { id: 6, name: "Wadi ad-Dawasir", nameAr: "وادي الدواسر", governorateId: 1 },
  { id: 7, name: "Al-Aflaj", nameAr: "الأفلاج", governorateId: 1 },
  { id: 8, name: "Al-Zulfi", nameAr: "الزلفي", governorateId: 1 },
  { id: 9, name: "Shaqra", nameAr: "شقراء", governorateId: 1 },
  { id: 10, name: "Hotat Bani Tamim", nameAr: "حوطة بني تميم", governorateId: 1 },
  { id: 11, name: "Afif", nameAr: "عفيف", governorateId: 1 },
  { id: 12, name: "Al-Sulayyil", nameAr: "السليل", governorateId: 1 },
  { id: 13, name: "Dharuma", nameAr: "ضرما", governorateId: 1 },
  { id: 14, name: "Al-Muzahmiyya", nameAr: "المزاحمية", governorateId: 1 },
  { id: 15, name: "Rimah", nameAr: "رماح", governorateId: 1 },
  { id: 16, name: "Thadiq", nameAr: "ثادق", governorateId: 1 },
  { id: 17, name: "Huraymila", nameAr: "حريملاء", governorateId: 1 },
  { id: 18, name: "Al-Hariq", nameAr: "الحريق", governorateId: 1 },
  { id: 19, name: "Al-Ghat", nameAr: "الغاط", governorateId: 1 },
  { id: 20, name: "Marat", nameAr: "مرات", governorateId: 1 },

  // --- منطقة مكة المكرمة ---
  { id: 21, name: "Mecca", nameAr: "مكة المكرمة", governorateId: 2 },
  { id: 22, name: "Jeddah", nameAr: "جدة", governorateId: 2 },
  { id: 23, name: "Taif", nameAr: "الطائف", governorateId: 2 },
  { id: 24, name: "Al-Qunfudhah", nameAr: "القنفذة", governorateId: 2 },
  { id: 25, name: "Al-Lith", nameAr: "الليث", governorateId: 2 },
  { id: 26, name: "Rabigh", nameAr: "رابغ", governorateId: 2 },
  { id: 27, name: "Khulais", nameAr: "خليص", governorateId: 2 },
  { id: 28, name: "Al-Kamil", nameAr: "الكامل", governorateId: 2 },
  { id: 29, name: "Turbah", nameAr: "تربة", governorateId: 2 },
  { id: 30, name: "Ranyah", nameAr: "رنية", governorateId: 2 },
  { id: 31, name: "Al-Jamum", nameAr: "الجموم", governorateId: 2 },
  { id: 32, name: "Al-Muwayh", nameAr: "المويه", governorateId: 2 },
  { id: 33, name: "Maysan", nameAr: "ميسان", governorateId: 2 },
  { id: 34, name: "Bahrah", nameAr: "بحرة", governorateId: 2 },
  { id: 35, name: "Adham", nameAr: "أضم", governorateId: 2 },

  // --- منطقة المدينة المنورة ---
  { id: 36, name: "Madinah", nameAr: "المدينة المنورة", governorateId: 3 },
  { id: 37, name: "Yanbu", nameAr: "ينبع", governorateId: 3 },
  { id: 38, name: "Badr", nameAr: "بدر", governorateId: 3 },
  { id: 39, name: "Al-Ula", nameAr: "العلا", governorateId: 3 },
  { id: 40, name: "Khaybar", nameAr: "خيبر", governorateId: 3 },
  { id: 41, name: "Al-Hinakiyah", nameAr: "الحناكية", governorateId: 3 },
  { id: 42, name: "Al-Mahd", nameAr: "المهد", governorateId: 3 },
  { id: 43, name: "Al-'Is", nameAr: "العيص", governorateId: 3 },
  { id: 44, name: "Wadi al-Far'", nameAr: "وادي الفرع", governorateId: 3 },

  // --- المنطقة الشرقية ---
  { id: 45, name: "Dammam", nameAr: "الدمام", governorateId: 4 },
  { id: 46, name: "Al-Ahsa", nameAr: "الأحساء", governorateId: 4 },
  { id: 47, name: "Khobar", nameAr: "الخبر", governorateId: 4 },
  { id: 48, name: "Dhahran", nameAr: "الظهران", governorateId: 4 },
  { id: 49, name: "Hafr Al-Batin", nameAr: "حفر الباطن", governorateId: 4 },
  { id: 50, name: "Jubail", nameAr: "الجبيل", governorateId: 4 },
  { id: 51, name: "Qatif", nameAr: "القطيف", governorateId: 4 },
  { id: 52, name: "Ras Tanura", nameAr: "رأس تنورة", governorateId: 4 },
  { id: 53, name: "Abqaiq", nameAr: "بقيق", governorateId: 4 },
  { id: 54, name: "Khafji", nameAr: "الخفجي", governorateId: 4 },
  { id: 55, name: "Nairyah", nameAr: "النعيرية", governorateId: 4 },
  { id: 56, name: "Qaryat al-Ulya", nameAr: "قرية العليا", governorateId: 4 },

  // --- منطقة عسير ---
  { id: 57, name: "Abha", nameAr: "أبها", governorateId: 5 },
  { id: 58, name: "Khamis Mushait", nameAr: "خميس مشيط", governorateId: 5 },
  { id: 59, name: "Muhayil", nameAr: "محايل", governorateId: 5 },
  { id: 60, name: "Sarat Abidah", nameAr: "سراة عبيدة", governorateId: 5 },
  { id: 61, name: "Rijal Alma", nameAr: "رجال ألمع", governorateId: 5 },
  { id: 62, name: "Bisha", nameAr: "بيشة", governorateId: 5 },
  { id: 63, name: "Al-Namas", nameAr: "النماص", governorateId: 5 },
  { id: 64, name: "Ahad Rufaydah", nameAr: "أحد رفيدة", governorateId: 5 },
  { id: 65, name: "Balqarn", nameAr: "بلقرن", governorateId: 5 },
  { id: 66, name: "Tathlith", nameAr: "تثليث", governorateId: 5 },
  { id: 67, name: "Dhahran Al Janub", nameAr: "ظهران الجنوب", governorateId: 5 },
  { id: 68, name: "Tanomah", nameAr: "تنومة", governorateId: 5 },

  // --- منطقة تبوك ---
  { id: 69, name: "Tabuk", nameAr: "تبوك", governorateId: 6 },
  { id: 70, name: "Umluj", nameAr: "أملج", governorateId: 6 },
  { id: 71, name: "Al-Wajh", nameAr: "الوجه", governorateId: 6 },
  { id: 72, name: "Duba", nameAr: "ضباء", governorateId: 6 },
  { id: 73, name: "Tayma", nameAr: "تيماء", governorateId: 6 },
  { id: 74, name: "Haql", nameAr: "حقل", governorateId: 6 },
  { id: 75, name: "Al-Beda'a", nameAr: "البدع", governorateId: 6 },

  // --- منطقة حائل ---
  { id: 76, name: "Hail", nameAr: "حائل", governorateId: 7 },
  { id: 77, name: "Ba'a", nameAr: "بقعاء", governorateId: 7 },
  { id: 78, name: "Al-Ghazalah", nameAr: "الغزالة", governorateId: 7 },
  { id: 79, name: "Al-Shinan", nameAr: "الشنان", governorateId: 7 },
  { id: 80, name: "Al-Hulayfah", nameAr: "الحليفة", governorateId: 7 },

  // --- منطقة الحدود الشمالية ---
  { id: 81, name: "Arar", nameAr: "عرعر", governorateId: 8 },
  { id: 82, name: "Rafha", nameAr: "رفحاء", governorateId: 8 },
  { id: 83, name: "Turaif", nameAr: "طريف", governorateId: 8 },
  { id: 84, name: "Al-Jubeida", nameAr: "الجبيدة", governorateId: 8 },

  // --- منطقة جازان ---
  { id: 85, name: "Jazan", nameAr: "جازان", governorateId: 9 },
  { id: 86, name: "Sabya", nameAr: "صبيا", governorateId: 9 },
  { id: 87, name: "Abu Arish", nameAr: "أبو عريش", governorateId: 9 },
  { id: 88, name: "Samtah", nameAr: "صامطة", governorateId: 9 },
  { id: 89, name: "Al-Harth", nameAr: "الحرث", governorateId: 9 },
  { id: 90, name: "Al-Dayer", nameAr: "الداير", governorateId: 9 },
  { id: 91, name: "Ahad al-Masarihah", nameAr: "أحد المسارحة", governorateId: 9 },
  { id: 92, name: "Al-Edabi", nameAr: "العيدابي", governorateId: 9 },
  { id: 93, name: "Al-Ardah", nameAr: "العارضة", governorateId: 9 },
  { id: 94, name: "Al-Darb", nameAr: "الدرب", governorateId: 9 },
  { id: 95, name: "Beash", nameAr: "بيش", governorateId: 9 },
  { id: 96, name: "Farasan", nameAr: "فرسان", governorateId: 9 },
  { id: 97, name: "Mizhirah", nameAr: "مزهرة", governorateId: 9 },

  // --- منطقة نجران ---
  { id: 98, name: "Najran", nameAr: "نجران", governorateId: 10 },
  { id: 99, name: "Sharurah", nameAr: "شرورة", governorateId: 10 },
  { id: 100, name: "Hubuna", nameAr: "حبونا", governorateId: 10 },
  { id: 101, name: "Badr al-Janub", nameAr: "بدر الجنوب", governorateId: 10 },
  { id: 102, name: "Yadamah", nameAr: "يدمة", governorateId: 10 },
  { id: 103, name: "Thar", nameAr: "ثار", governorateId: 10 },
  { id: 104, name: "Al-Kharkhir", nameAr: "الخرخير", governorateId: 10 },

  // --- منطقة الباحة ---
  { id: 105, name: "Al-Bahah", nameAr: "الباحة", governorateId: 11 },
  { id: 106, name: "Al-Mandag", nameAr: "المندق", governorateId: 11 },
  { id: 107, name: "Baljurashi", nameAr: "بلجرشي", governorateId: 11 },
  { id: 108, name: "Al-Makhwah", nameAr: "المخواة", governorateId: 11 },
  { id: 109, name: "Qilwah", nameAr: "قلوة", governorateId: 11 },
  { id: 110, name: "Al-Aqiq", nameAr: "العقيق", governorateId: 11 },
  { id: 111, name: "Sabt Al Alaya", nameAr: "سبت العلاية", governorateId: 11 },

  // --- منطقة الجوف ---
  { id: 112, name: "Sakakah", nameAr: "سكاكا", governorateId: 12 },
  { id: 113, name: "Qurayyat", nameAr: "القريات", governorateId: 12 },
  { id: 114, name: "Dumat al-Jandal", nameAr: "دومة الجندل", governorateId: 12 },
  { id: 115, name: "Tabarjal", nameAr: "طبرجل", governorateId: 12 },

  // --- منطقة القصيم ---
  { id: 116, name: "Buraydah", nameAr: "بريدة", governorateId: 13 },
  { id: 117, name: "Unaizah", nameAr: "عنيزة", governorateId: 13 },
  { id: 118, name: "Ar Rass", nameAr: "الرس", governorateId: 13 },
  { id: 119, name: "Al-Badayea", nameAr: "البدائع", governorateId: 13 },
  { id: 120, name: "Al-Bukayriyah", nameAr: "البكيرية", governorateId: 13 },
  { id: 121, name: "Al-Midhnab", nameAr: "المذنب", governorateId: 13 },
  { id: 122, name: "Asyah", nameAr: "عيون الجواء", governorateId: 13 },
  { id: 123, name: "Riyadh Al-Khabra", nameAr: "رياض الخبراء", governorateId: 13 },
  { id: 124, name: "Uyun Al-Jiwa", nameAr: "عيون الجواء", governorateId: 13 },
  { id: 125, name: "Al-Sharai'a", nameAr: "الشماسية", governorateId: 13 },
];

export async function seedCities(prisma: PrismaClient) {
  console.log("🏙️ Seeding Cities...");
  for (const c of cities) {
    await prisma.city.upsert({
      where: { id: c.id },
      update: { name: c.name, nameAr: c.nameAr, governorateId: c.governorateId },
      create: { id: c.id, name: c.name, nameAr: c.nameAr, governorateId: c.governorateId },
    });
  }
}
