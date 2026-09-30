import { PrismaClient } from "@prisma/client";

export const governorates = [
  { id: 1, name: "Riyadh", nameAr: "الرياض" },
  { id: 2, name: "Makkah", nameAr: "مكة المكرمة" },
  { id: 3, name: "Madinah", nameAr: "المدينة المنورة" },
  { id: 4, name: "Eastern Province", nameAr: "الشرقية" },
  { id: 5, name: "Asir", nameAr: "عسير" },
  { id: 6, name: "Tabuk", nameAr: "تبوك" },
  { id: 7, name: "Hail", nameAr: "حائل" },
  { id: 8, name: "Northern Borders", nameAr: "الحدود الشمالية" },
  { id: 9, name: "Jazan", nameAr: "جازان" },
  { id: 10, name: "Najran", nameAr: "نجران" },
  { id: 11, name: "Al-Bahah", nameAr: "الباحة" },
  { id: 12, name: "Al-Jawf", nameAr: "الجوف" },
  { id: 13, name: "Al-Qassim", nameAr: "القصيم" },
];

export async function seedGovernorates(prisma: PrismaClient) {
  console.log("🏛️ Seeding Governorates...");
  for (const g of governorates) {
    await prisma.governorate.upsert({
      where: { id: g.id },
      update: { name: g.name, nameAr: g.nameAr },
      create: { id: g.id, name: g.name, nameAr: g.nameAr },
    });
  }
}
