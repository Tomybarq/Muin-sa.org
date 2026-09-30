"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/portal/Sidebar";
import Header from "@/components/portal/Header";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AuthProvider, UserInfo } from "@/lib/AuthContext";
import { ToastProvider, useToast } from "@/lib/ToastContext";
import { useTheme } from "@/components/providers/ThemeProvider";

function PortalInnerLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const pathname = usePathname();
  const router = useRouter();
  const tNav = useTranslations("navigation");
  const { showToast } = useToast();

  const { setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const handleAuthFailure = useCallback(() => {
    setUser(null);
    setLoading(false);
    window.location.href = `/${locale}/login?reason=archived`;
  }, [locale]);

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          setUser(data.user);
        }
      } else {
        handleAuthFailure();
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  };

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          if (active) {
            handleAuthFailure();
          }
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (active && data?.user) {
          setUser(data.user);
          setLoading(false);

          // Apply theme preference from database
          if (data.user.darkMode !== undefined) {
            setTheme(data.user.darkMode ? "dark" : "light");
          }

          // Apply language preference redirect if needed
          if (data.user.language && data.user.language !== locale) {
            const cleanPath = pathname.replace(/^\/[a-z]{2}/, "") || "/";
            router.push(`/${data.user.language}${cleanPath}`);
          }
        }
      })
      .catch((err) => {
        console.error("Auth load error:", err);
        if (active) {
          handleAuthFailure();
        }
      });

    return () => {
      active = false;
    };
  }, [locale, router, pathname, setTheme]);

  // Clean pathname for comparison, e.g. "/ar/portal/associations" -> "/portal/associations"
  const cleanPathname = pathname.replace(/^\/[a-z]{2}/, "") || "/";

  const getScreenName = (path: string) => {
    if (path === "/portal") return tNav("dashboard");
    if (path === "/portal/associations") return tNav("associations");
    if (path === "/portal/beneficiaries") return tNav("beneficiaries");
    if (path === "/portal/marketers") return tNav("marketers");
    if (path === "/portal/settings" || path === "/portal/settings/general") return tNav("settings-general");
    if (path === "/portal/settings/users") return tNav("settings-users");
    if (path === "/portal/settings/permissions") return tNav("settings-permissions");
    if (path === "/portal/settings/audit-logs") return tNav("settings-audit-logs");
    return "";
  };

  // Guard logic
  useEffect(() => {
    if (loading || !user) return;

    // Profile page is always allowed
    if (cleanPathname === "/portal/profile") return;

    const allowed = user.allowedScreens || [];
    let checkPath = cleanPathname;

    // Allow import sub-pages for screens the user can access
    const importMatch = checkPath.match(/^\/portal\/import\/(.+)$/);
    if (importMatch) {
      const parentScreen = `/portal/${importMatch[1]}`;
      if (allowed.includes(parentScreen)) return;
    }

    if (checkPath === "/portal/settings") {
      checkPath = "/portal/settings/general";
    }

    // Check if the current page path is permitted
    if (!allowed.includes(checkPath)) {
      const screenName = getScreenName(checkPath);
      const isAr = locale === "ar";
      
      const msg = isAr
        ? `عذراً، ليس لديك صلاحية الوصول لشاشة (${screenName || cleanPathname}).`
        : `Sorry, you do not have permission to access the (${screenName || cleanPathname}) screen.`;

      showToast(msg, "error");

      // Redirect to first allowed screen or profile
      const firstAllowed = allowed.includes("/portal") ? "/portal" : allowed[0] || "/portal/profile";
      router.push(`/${locale}${firstAllowed}`);
    }
  }, [cleanPathname, user, loading, locale, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold animate-pulse">
            {locale === "ar" ? "جاري تحميل المنصة..." : "Loading platform..."}
          </p>
        </div>
      </div>
    );
  }

  // If loading is finished but they are on an unauthorized screen, don't render children
  // (the above redirect useEffect will kick in shortly)
  const allowed = user?.allowedScreens || [];
  const importMatch = cleanPathname.match(/^\/portal\/import\/(.+)$/);
  const isImportAllowed = importMatch ? allowed.includes(`/portal/${importMatch[1]}`) : false;
  const isAuthorized = cleanPathname === "/portal/profile" || isImportAllowed || allowed.includes(cleanPathname);

  return (
    <AuthProvider user={user} loading={loading} refreshUser={refreshUser}>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-[#E2E8F0] flex transition-colors duration-300">

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
          <Sidebar locale={locale} allowedScreens={allowed} externalUser={user} />
        </div>

        {/* Mobile Sidebar overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
          />
        )}

        {/* Mobile Sidebar drawer */}
        <div
          className={`
            lg:hidden fixed top-0 bottom-0 start-0 w-64 z-50 transition-transform duration-300
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"}
          `}
        >
          <Sidebar
            locale={locale}
            onNavigate={() => setSidebarOpen(false)}
            allowedScreens={allowed}
            externalUser={user}
          />
        </div>

        {/* Main content wrapper */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <Header locale={locale} onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-6 overflow-y-auto">
            {isAuthorized ? children : null}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <PortalInnerLayout>{children}</PortalInnerLayout>
    </ToastProvider>
  );
}
