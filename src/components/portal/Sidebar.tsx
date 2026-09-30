"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePlatformSettings } from "@/components/providers/PlatformSettingsProvider";
import {
  LayoutDashboard,
  Building2,
  Users2,
  TrendingUp,
  Settings,
  LogOut,
  X,
  ChevronDown,
  FileSpreadsheet,
} from "lucide-react";


interface SidebarProps {
  locale: string;
  onNavigate?: () => void;
  allowedScreens?: string[];
  externalUser?: { name: string | null; email: string; role: string } | null;
}

export default function Sidebar({ locale, onNavigate, allowedScreens = [], externalUser }: SidebarProps) {
  const t = useTranslations("navigation");
  const tCommon = useTranslations("common");
  const platformSettings = usePlatformSettings();
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (pathname.includes("/portal/settings")) {
      setIsSettingsOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (externalUser) {
      setUser({
        name: externalUser.name || "User",
        email: externalUser.email || "",
        role: externalUser.role || "",
      });
      return;
    }

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          const u = data.user;
          setUser({
            name: u.name || "User",
            email: u.email || "",
            role: u.role || "",
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load user info:", err);
      });
  }, [externalUser]);

  const getInitials = (name: string) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
  };

  const navItems = [
    { href: `/${locale}/portal`, icon: LayoutDashboard, label: t("dashboard"), exact: true },
    { href: `/${locale}/portal/associations`, icon: Building2, label: t("associations") },
    { href: `/${locale}/portal/beneficiaries`, icon: Users2, label: t("beneficiaries") },
    { href: `/${locale}/portal/reports`, icon: FileSpreadsheet, label: t("reports") },
    { href: `/${locale}/portal/marketers`, icon: TrendingUp, label: t("marketers") },
  ];

  const settingsSubItems = [
    { href: `/${locale}/portal/settings/general`, label: t("settings-general") },
    { href: `/${locale}/portal/settings/marketing-kits`, label: t("settings-marketing-kits") },
    { href: `/${locale}/portal/settings/mail`, label: t("settings-mail") },
    { href: `/${locale}/portal/settings/users`, label: t("settings-users") },
    { href: `/${locale}/portal/settings/permissions`, label: t("settings-permissions") },
    { href: `/${locale}/portal/settings/audit-logs`, label: t("settings-audit-logs") },
  ];

  const filteredNavItems = allowedScreens.length > 0
    ? navItems.filter((item) => {
        const dbPath = item.href.replace(/^\/[a-z]{2}/, "") || "/";
        return allowedScreens.includes(dbPath);
      })
    : navItems;

  const filteredSubItems = allowedScreens.length > 0
    ? settingsSubItems.filter((item) => {
        const dbPath = item.href.replace(/^\/[a-z]{2}/, "");
        return allowedScreens.includes(dbPath);
      })
    : settingsSubItems;

  const hasAnySettingsAccess = filteredSubItems.length > 0;

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        router.push(`/${locale}/login`);
        router.refresh();
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <aside className="w-full h-full bg-white dark:bg-[#0F172A] border-e border-slate-200 dark:border-slate-800 flex flex-col transition-colors duration-300">
      {/* Brand logo */}
      <div className="p-5 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white border border-slate-100 dark:border-slate-800/80 shadow-sm shrink-0">
            {platformSettings.logoUrl ? (
              <img src={platformSettings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-slate-900 dark:text-white text-sm leading-tight truncate">
              {locale === "ar" && platformSettings.siteNameAr
                ? platformSettings.siteNameAr
                : platformSettings.siteName || tCommon("appName")}
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-[#64748B] mt-0.5 truncate">
              {tCommon("appSubtitle")}
            </p>
          </div>
        </div>
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="mx-4 h-px bg-slate-200 dark:bg-slate-800" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filteredNavItems.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`
                flex items-center gap-3 pe-3 py-2.5 rounded-xl text-[13px] font-semibold
                transition-all duration-300 group
                ${active
                  ? "bg-slate-100 dark:bg-[#1E293B] text-slate-900 dark:text-white border-s-[4px] border-primary dark:border-tertiary ps-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                  : "text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#1E293B] hover:text-slate-900 dark:hover:text-white border-s-[4px] border-transparent ps-[8px]"
                }
              `}
            >
              <Icon
                size={18}
                strokeWidth={active ? 2.2 : 1.8}
                className={active ? "text-primary dark:text-tertiary" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Settings Collapsible Item */}
        {hasAnySettingsAccess && (
          <div className="space-y-1">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`
                w-full flex items-center justify-between pe-3 py-2.5 rounded-xl text-[13px] font-semibold
                transition-all duration-300 cursor-pointer text-start group
                ${pathname.includes("/portal/settings")
                  ? "bg-slate-100 dark:bg-[#1E293B] text-slate-900 dark:text-white border-s-[4px] border-primary dark:border-tertiary ps-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                  : "text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#1E293B] hover:text-slate-900 dark:hover:text-white border-s-[4px] border-transparent ps-[8px]"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <Settings
                  size={18}
                  strokeWidth={pathname.includes("/portal/settings") ? 2.2 : 1.8}
                  className={pathname.includes("/portal/settings") ? "text-primary dark:text-tertiary" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"}
                />
                <span>{t("settings")}</span>
              </div>
              <ChevronDown
                size={14}
                className={`transition-transform duration-350 ${
                  pathname.includes("/portal/settings")
                    ? "text-primary dark:text-tertiary"
                    : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                } ${isSettingsOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Sub-menu items container */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isSettingsOpen ? "max-h-[500px] opacity-100 py-1" : "max-h-0 opacity-0 pointer-events-none"
              }`}
            >
              <div className="ps-5 pe-1 space-y-1 border-s-2 border-slate-100 dark:border-slate-800 ms-[21px] mt-1 mb-1 transition-colors duration-300">
                {filteredSubItems.map((subItem) => {
                  const active = pathname === subItem.href;
                  return (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      onClick={onNavigate}
                      className={`
                        flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group
                        ${active
                          ? "bg-primary/5 dark:bg-tertiary/10 text-primary dark:text-tertiary font-bold shadow-sm border border-primary/15 dark:border-tertiary/15"
                          : "text-slate-500 dark:text-[#94A3B8] hover:bg-slate-50 dark:hover:bg-[#1E293B]/30 hover:text-slate-900 dark:hover:text-white border border-transparent"
                        }
                      `}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                          active
                            ? "bg-primary dark:bg-tertiary scale-125 ring-2 ring-primary/30 dark:ring-tertiary/30"
                            : "bg-slate-300 dark:bg-slate-700 group-hover:bg-slate-400 dark:group-hover:bg-slate-500"
                        }`}
                      />
                      <span>{subItem.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Footer / Themes & User */}
      <div className="p-3 mx-2 mb-2 space-y-2 border-t border-slate-100 dark:border-slate-800">
        {user && (
          <div className="flex items-center justify-between gap-3 px-3 py-3 rounded-xl bg-slate-50 dark:bg-[#1E293B]/70 border border-slate-100 dark:border-[#334155]/50">
            <Link
              href={`/${locale}/portal/profile`}
              onClick={onNavigate}
              className="flex items-center gap-3 flex-1 min-w-0 group/user hover:opacity-80 transition-opacity"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-tertiary flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0">
                {getInitials(user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover/user:text-primary dark:group-hover/user:text-tertiary transition-colors">
                  {user.name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-[#64748B] truncate">
                  {user.email}
                </p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all cursor-pointer shrink-0 z-10"
              title={tCommon("logout")}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
