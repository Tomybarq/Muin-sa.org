"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { Check, Globe, ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/lib/ToastContext";
import { usePlatformSettings } from "@/components/providers/PlatformSettingsProvider";

export default function LoginPage() {
  const t = useTranslations("login");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const locale = (params?.locale as string) || "ar";

  const platformSettings = usePlatformSettings();
  const logoUrl = platformSettings?.logoUrl;
  const siteName = locale === "ar" ? (platformSettings?.siteNameAr || "منصة معين الرقمية") : (platformSettings?.siteName || "Maeen Digital Platform");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isAr = locale === "ar";

  const hasShownToastRef = useRef(false);

  useEffect(() => {
    const reason = searchParams.get("reason");
    if (reason && !hasShownToastRef.current) {
      hasShownToastRef.current = true;
      if (reason === "archived") {
        showToast(
          isAr
            ? "تم أرشفة أو إيقاف هذا الحساب. يرجى التواصل مع إدارة النظام."
            : "Your account has been archived or suspended. Please contact system admin.",
          "error"
        );
      } else if (reason === "session_expired") {
        showToast(
          isAr ? "انتهت الجلسة. يرجى إعادة تسجيل الدخول." : "Session expired. Please log in again.",
          "info"
        );
      }
    }
  }, [searchParams, isAr, showToast]);

  const toggleLanguage = () => {
    const nextLocale = locale === "ar" ? "en" : "ar";
    router.push(`/${nextLocale}/login`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError(t("errorEmpty"));
      setLoading(false);
      return;
    }

    try {
      const isDark = document.documentElement.classList.contains("dark");
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          language: locale,
          darkMode: isDark,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || t("errorInvalid"));
      } else {
        router.push(`/${locale}/portal`);
        router.refresh();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-[#0B0F19] transition-colors duration-300">
      {/* Brand Promotional Side - Occupying the large empty space */}
      <div className="hidden md:flex md:w-[50%] lg:w-[55%] bg-gradient-to-br from-primary via-primary-dark to-tertiary text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decorative patterns */}
        <div className="absolute top-[-10%] start-[-10%] w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] end-[-10%] w-[400px] h-[400px] rounded-full bg-tertiary/20 blur-3xl pointer-events-none" />
        
        {/* Header Logo */}
        <div className="z-10 animate-fade-in flex items-center gap-3">
          {logoUrl ? (
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white flex items-center justify-center border border-white/20 shadow-md p-1 shrink-0">
              <img src={logoUrl} alt={siteName} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-md shrink-0">
              <ShieldCheck className="text-white font-bold" size={28} />
            </div>
          )}
          <span className="text-xl font-extrabold text-white tracking-wide">{siteName}</span>
        </div>

        {/* Brand Core Promo Message */}
        <div className="max-w-lg my-auto z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight">
              {t("promoTitle")}
            </h1>
            <p className="text-slate-100/80 text-sm leading-relaxed max-w-md">
              {t("promoDesc")}
            </p>
          </div>

          {/* Bullet features */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                <Check size={16} className="text-white" />
              </span>
              <span className="text-xs lg:text-sm font-semibold">{t("promoFeature1")}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                <Check size={16} className="text-white" />
              </span>
              <span className="text-xs lg:text-sm font-semibold">{t("promoFeature2")}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                <Check size={16} className="text-white" />
              </span>
              <span className="text-xs lg:text-sm font-semibold">{t("promoFeature3")}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="z-10 text-xs text-white/80">
          {isAr
            ? `© ${new Date().getFullYear()} منصة معين الرقمية. جميع الحقوق محفوظة.`
            : `© ${new Date().getFullYear()} Maeen Digital Platform. All rights reserved.`}
        </div>
      </div>

      {/* Login Form Column */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative min-h-screen">
        {/* Floating Switchers Header */}
        <div className="absolute top-6 end-6 flex items-center gap-3 z-20">
          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-tertiary bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
            title={isAr ? "Switch to English" : "تغيير اللغة للعربية"}
          >
            <Globe size={14} />
            <span>{isAr ? "English" : "العربية"}</span>
          </button>

          {/* Theme Switcher */}
          <ThemeToggle />
        </div>

        {/* Login Box */}
        <div className="w-full max-w-md bg-white dark:bg-[#0F172A] rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-800/80 p-8 transition-colors">
          <div className="text-center mb-8 flex flex-col items-center">
            {/* Unified Logo */}
            <div className="mb-4 animate-fade-in">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white flex items-center justify-center border border-slate-200/80 dark:border-slate-800 shadow-sm p-1 shrink-0">
                <img src={logoUrl || "/logo.png"} alt="Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1 transition-colors">
              {t("title")}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("subtitle")}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 uppercase tracking-wide">
                {t("email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="example@moeen.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                  {t("password")}
                </label>
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/forgot-password`)}
                  className="text-xs text-primary dark:text-tertiary hover:underline font-semibold cursor-pointer"
                >
                  {isAr ? "نسيت كلمة المرور؟" : "Forgot Password?"}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full ${isAr ? "pl-10 pr-4" : "pr-10 pl-4"} py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
                  style={{ fontFamily: "sans-serif" }}
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 ${isAr ? "left-3" : "right-3"} text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer p-1 rounded-lg`}
                  title={showPassword ? (isAr ? "إخفاء كلمة المرور" : "Hide password") : (isAr ? "إظهار كلمة المرور" : "Show password")}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-tertiary hover:opacity-95 text-white font-semibold text-sm shadow-lg shadow-primary/15 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 transition-all cursor-pointer mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{tCommon("loading")}</span>
                </>
              ) : (
                t("submitBtn")
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
