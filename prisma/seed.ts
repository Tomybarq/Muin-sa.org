import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { seedGovernorates } from "./seed/governorates";
import { seedCities } from "./seed/cities";
import { seedSelectOptions } from "./seed/selectOptions";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Clean Production Seeding for Moeen Platform...");

  // 0. Seed Select Options, Governorates & Cities
  console.log("📌 Seeding Select Options, Governorates & Cities...");
  await seedSelectOptions(prisma);
  await seedGovernorates(prisma);
  await seedCities(prisma);

  // 1. Seed Association Categories (تصنيفات الجمعيات الأساسية)
  console.log("🏷️ Seeding Association Categories...");
  const catCharity = await prisma.associationCategory.upsert({
    where: { id: 1 },
    update: { name: "Charity", nameAr: "خيرية" },
    create: { id: 1, name: "Charity", nameAr: "خيرية" },
  });

  const catHealth = await prisma.associationCategory.upsert({
    where: { id: 2 },
    update: { name: "Health", nameAr: "صحية" },
    create: { id: 2, name: "Health", nameAr: "صحية" },
  });

  const catSocial = await prisma.associationCategory.upsert({
    where: { id: 3 },
    update: { name: "Social", nameAr: "اجتماعية" },
    create: { id: 3, name: "Social", nameAr: "اجتماعية" },
  });

  const catEco = await prisma.associationCategory.upsert({
    where: { id: 4 },
    update: { name: "Environmental", nameAr: "بيئية" },
    create: { id: 4, name: "Environmental", nameAr: "بيئية" },
  });

  // 2. Seed Income Assets Types (أنواع مصادر الدخل والأصول)
  console.log("💰 Seeding Income Assets Types...");
  const incomeAssetData = [
    { nameAr: "مواشي", nameEn: "Livestock" },
    { nameAr: "مزرعة", nameEn: "Farm" },
    { nameAr: "سيارة (أجرة)", nameEn: "Car (Taxi)" },
    { nameAr: "أخرى", nameEn: "Other" },
  ];
  for (let i = 0; i < incomeAssetData.length; i++) {
    await prisma.incomeAsset.upsert({
      where: { id: i + 1 },
      update: incomeAssetData[i],
      create: { id: i + 1, ...incomeAssetData[i] },
    });
  }

  // 3. Seed Service Bills Types (أنواع فواتير الخدمات)
  console.log("💡 Seeding Service Bills Types...");
  const sbData = [
    { nameAr: "كهرباء", nameEn: "Electricity" },
    { nameAr: "ماء", nameEn: "Water" },
    { nameAr: "إنترنت", nameEn: "Internet" },
    { nameAr: "هاتف", nameEn: "Phone" },
    { nameAr: "غاز", nameEn: "Gas" },
  ];
  for (let i = 0; i < sbData.length; i++) {
    await prisma.serviceBill.upsert({
      where: { id: i + 1 },
      update: sbData[i],
      create: { id: i + 1, ...sbData[i] },
    });
  }

  // 4. Seed Platform Setting (إعدادات المنصة الأساسية)
  console.log("⚙️ Seeding Platform Settings...");
  await prisma.platformSetting.upsert({
    where: { id: 1 },
    update: {
      siteName: "Moeen Platform",
      siteNameAr: "منصة معين",
      fontFamily: "Cairo",
      primaryColor: "#0A5C4A",
      secondaryColor: "#F9A826",
      tertiaryColor: "#2FAB99",
    },
    create: {
      id: 1,
      siteName: "Moeen Platform",
      siteNameAr: "منصة معين",
      fontFamily: "Cairo",
      primaryColor: "#0A5C4A",
      secondaryColor: "#F9A826",
      tertiaryColor: "#2FAB99",
    },
  });

  // 5. Seed Screens (شاشات المنصة)
  console.log("🖥️ Seeding System Screens...");
  const dashboardScreen = await prisma.screen.upsert({
    where: { name: "dashboard" },
    update: { nameAr: "لوحة المعلومات", path: "/portal" },
    create: { name: "dashboard", nameAr: "لوحة المعلومات", path: "/portal" },
  });

  const assocScreen = await prisma.screen.upsert({
    where: { name: "associations" },
    update: { nameAr: "الجمعيات", path: "/portal/associations" },
    create: { name: "associations", nameAr: "الجمعيات", path: "/portal/associations" },
  });

  const benScreen = await prisma.screen.upsert({
    where: { name: "beneficiaries" },
    update: { nameAr: "المستفيدين", path: "/portal/beneficiaries" },
    create: { name: "beneficiaries", nameAr: "المستفيدين", path: "/portal/beneficiaries" },
  });

  const reportsScreen = await prisma.screen.upsert({
    where: { name: "reports" },
    update: { nameAr: "التقارير", path: "/portal/reports" },
    create: { name: "reports", nameAr: "التقارير", path: "/portal/reports" },
  });

  const marketerScreen = await prisma.screen.upsert({
    where: { name: "marketers" },
    update: { nameAr: "المسوقين", path: "/portal/marketers" },
    create: { name: "marketers", nameAr: "المسوقين", path: "/portal/marketers" },
  });

  const settingsGenScreen = await prisma.screen.upsert({
    where: { name: "settings-general" },
    update: { nameAr: "الإعدادات العامة", path: "/portal/settings/general" },
    create: { name: "settings-general", nameAr: "الإعدادات العامة", path: "/portal/settings/general" },
  });

  const settingsMarketingKitScreen = await prisma.screen.upsert({
    where: { name: "settings-marketing-kits" },
    update: { nameAr: "الحقيبة التسويقية", path: "/portal/settings/marketing-kits" },
    create: { name: "settings-marketing-kits", nameAr: "الحقيبة التسويقية", path: "/portal/settings/marketing-kits" },
  });

  const settingsMailScreen = await prisma.screen.upsert({
    where: { name: "settings-mail" },
    update: { nameAr: "إعدادات البريد الإلكتروني", path: "/portal/settings/mail" },
    create: { name: "settings-mail", nameAr: "إعدادات البريد الإلكتروني", path: "/portal/settings/mail" },
  });

  const settingsUsersScreen = await prisma.screen.upsert({
    where: { name: "settings-users" },
    update: { nameAr: "إدارة المستخدمين", path: "/portal/settings/users" },
    create: { name: "settings-users", nameAr: "إدارة المستخدمين", path: "/portal/settings/users" },
  });

  const settingsPermsScreen = await prisma.screen.upsert({
    where: { name: "settings-permissions" },
    update: { nameAr: "إدارة الصلاحيات", path: "/portal/settings/permissions" },
    create: { name: "settings-permissions", nameAr: "إدارة الصلاحيات", path: "/portal/settings/permissions" },
  });

  const settingsAuditLogsScreen = await prisma.screen.upsert({
    where: { name: "settings-audit-logs" },
    update: { nameAr: "سجل الأنشطة والتدقيق", path: "/portal/settings/audit-logs" },
    create: { name: "settings-audit-logs", nameAr: "سجل الأنشطة والتدقيق", path: "/portal/settings/audit-logs" },
  });

  // 6. Seed Roles (أدوار النظام)
  console.log("🔑 Seeding Roles...");
  const roleSuperAdmin = await prisma.role.upsert({
    where: { name: "SUPER_ADMIN" },
    update: { nameAr: "مدير النظام", type: "superadmin" },
    create: { name: "SUPER_ADMIN", nameAr: "مدير النظام", type: "superadmin" },
  });

  const roleAdmin = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: { nameAr: "إداري النظام", type: "admin" },
    create: { name: "ADMIN", nameAr: "إداري النظام", type: "admin" },
  });

  const roleStaff = await prisma.role.upsert({
    where: { name: "CHARITY_STAFF" },
    update: { nameAr: "مدير الجمعية", type: "user" },
    create: { name: "CHARITY_STAFF", nameAr: "مدير الجمعية", type: "user" },
  });

  const roleMarketer = await prisma.role.upsert({
    where: { name: "MARKETER" },
    update: { nameAr: "مسوق", type: "user" },
    create: { name: "MARKETER", nameAr: "مسوق", type: "user" },
  });

  const roleResearcher = await prisma.role.upsert({
    where: { name: "SOCIAL_RESEARCHER" },
    update: { nameAr: "باحث اجتماعي", type: "user" },
    create: { name: "SOCIAL_RESEARCHER", nameAr: "باحث اجتماعي", type: "user" },
  });

  const roleDataManager = await prisma.role.upsert({
    where: { name: "DATA_MANAGER" },
    update: { nameAr: "مدير البيانات", type: "user" },
    create: { name: "DATA_MANAGER", nameAr: "مدير البيانات", type: "user" },
  });

  // 7. Seed Role Permissions (صلاحيات الأدوار الافتراضية)
  console.log("🛡️ Seeding Role Permissions...");
  const defaultActions = ["create", "edit", "delete", "archive", "view"];

  // SUPER_ADMIN gets all screens
  const superAdminScreens = [
    dashboardScreen,
    assocScreen,
    benScreen,
    reportsScreen,
    marketerScreen,
    settingsGenScreen,
    settingsMarketingKitScreen,
    settingsMailScreen,
    settingsUsersScreen,
    settingsPermsScreen,
    settingsAuditLogsScreen,
  ];
  for (const screen of superAdminScreens) {
    await prisma.rolePermission.upsert({
      where: { roleId_screenId: { roleId: roleSuperAdmin.id, screenId: screen.id } },
      update: { actions: defaultActions },
      create: { roleId: roleSuperAdmin.id, screenId: screen.id, actions: defaultActions },
    });
  }

  // CHARITY_STAFF gets dashboard (view), associations (view), reports (view), marketers (view), and beneficiaries (view, create, delete)
  const charityScreens = [
    { screen: dashboardScreen, actions: ["view"] },
    { screen: assocScreen, actions: ["view"] },
    { screen: reportsScreen, actions: ["view"] },
    { screen: marketerScreen, actions: ["view"] },
    { screen: benScreen, actions: ["view", "create", "delete"] },
  ];
  for (const entry of charityScreens) {
    await prisma.rolePermission.upsert({
      where: { roleId_screenId: { roleId: roleStaff.id, screenId: entry.screen.id } },
      update: { actions: entry.actions },
      create: { roleId: roleStaff.id, screenId: entry.screen.id, actions: entry.actions },
    });
  }

  // MARKETER gets dashboard (view) and beneficiaries (view) only
  const marketerScreens = [
    { screen: dashboardScreen, actions: ["view"] },
    { screen: benScreen, actions: ["view"] },
  ];
  for (const entry of marketerScreens) {
    await prisma.rolePermission.upsert({
      where: { roleId_screenId: { roleId: roleMarketer.id, screenId: entry.screen.id } },
      update: { actions: entry.actions },
      create: { roleId: roleMarketer.id, screenId: entry.screen.id, actions: entry.actions },
    });
  }

  // ADMIN gets all screens EXCEPT settings-permissions
  const adminScreens = [
    dashboardScreen,
    assocScreen,
    benScreen,
    reportsScreen,
    marketerScreen,
    settingsGenScreen,
    settingsMarketingKitScreen,
    settingsMailScreen,
    settingsUsersScreen,
    settingsAuditLogsScreen,
  ];
  for (const screen of adminScreens) {
    await prisma.rolePermission.upsert({
      where: { roleId_screenId: { roleId: roleAdmin.id, screenId: screen.id } },
      update: { actions: defaultActions },
      create: { roleId: roleAdmin.id, screenId: screen.id, actions: defaultActions },
    });
  }

  // SOCIAL_RESEARCHER gets dashboard (view), beneficiaries (create, edit, view), reports (view)
  const researcherScreens = [
    { screen: dashboardScreen, actions: ["view"] },
    { screen: benScreen, actions: ["create", "edit", "view"] },
    { screen: reportsScreen, actions: ["view"] },
  ];
  for (const entry of researcherScreens) {
    await prisma.rolePermission.upsert({
      where: { roleId_screenId: { roleId: roleResearcher.id, screenId: entry.screen.id } },
      update: { actions: entry.actions },
      create: { roleId: roleResearcher.id, screenId: entry.screen.id, actions: entry.actions },
    });
  }

  // DATA_MANAGER gets dashboard (view), associations (view), reports (view), marketers (view), beneficiaries (view, delete)
  const dataManagerScreens = [
    { screen: dashboardScreen, actions: ["view"] },
    { screen: assocScreen, actions: ["view"] },
    { screen: reportsScreen, actions: ["view"] },
    { screen: marketerScreen, actions: ["view"] },
    { screen: benScreen, actions: ["view", "delete"] },
  ];
  for (const entry of dataManagerScreens) {
    await prisma.rolePermission.upsert({
      where: { roleId_screenId: { roleId: roleDataManager.id, screenId: entry.screen.id } },
      update: { actions: entry.actions },
      create: { roleId: roleDataManager.id, screenId: entry.screen.id, actions: entry.actions },
    });
  }

  console.log("🚀 Production Infrastructure Seeding Completed Successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
