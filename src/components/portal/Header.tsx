"use client";

import { usePathname, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Menu, Globe, User } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useAuth } from "@/lib/AuthContext";
import { usePlatformSettings } from "@/components/providers/PlatformSettingsProvider";
import { useSearchParams } from "next/navigation";

interface HeaderProps {
  locale: string;
  onMenuClick?: () => void;
}

export default function Header({ locale, onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("common");
  const platformSettings = usePlatformSettings();

  const switchLanguage = () => {
    const nextLocale = locale === "ar" ? "en" : "ar";
    const queryStr = searchParams.toString();
    const fullPath = queryStr ? `${pathname}?${queryStr}` : pathname;

    fetch("/api/users/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: nextLocale }),
    })
      .catch((err) => console.error("Failed to sync language preference:", err))
      .finally(() => {
        router.replace(fullPath, { locale: nextLocale });
      });
  };

  const avatarUrl =
    typeof user?.image === "string"
      ? user.image
      : user?.image && typeof user.image === "object" && "url" in (user.image as any)
      ? (user.image as any).url
      : (user as any)?.imageUrl || null;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 transition-all duration-300">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <Menu size={20} />
          </button>
        )}
        <h2 className="text-base font-semibold text-slate-800 dark:text-white">
          {locale === "ar" && platformSettings.siteNameAr
            ? platformSettings.siteNameAr
            : platformSettings.siteName || t("appName")}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <ThemeToggle variant="pill" />

        {/* Language Switcher */}
        <button
          onClick={switchLanguage}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Globe size={16} />
          <span>{locale === "ar" ? "English" : "العربية"}</span>
        </button>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user?.name || "User"}
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={16} />
          )}
        </div>
      </div>
    </header>
  );
}
