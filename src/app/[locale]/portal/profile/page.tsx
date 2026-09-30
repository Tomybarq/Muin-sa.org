import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileClient from "@/components/portal/ProfileClient";

export default async function ProfilePage() {
  const t = await getTranslations("profile");
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { role: true, image: true },
  });

  if (!user) {
    redirect("/login");
  }

  const initialUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name,
    roleAr: user.role.nameAr || user.role.name,
    roleType: user.role.type || undefined,
    status: user.status,
    imageAttachment: user.image
      ? {
          id: user.image.id,
          url: `/api/attachments/${user.image.id}/file`,
          name: user.image.name,
          originalName: user.image.originalName,
          mimetype: user.image.mimetype,
          fileSize: user.image.fileSize,
        }
      : null,
  };

  const isArabic = t("title") === "الملف الشخصي";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t("subtitle")}
        </p>
      </div>

      <ProfileClient initialUser={initialUser} isAr={isArabic} />
    </div>
  );
}
