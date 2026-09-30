"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mail, ArrowRight, CheckCircle2, ShieldCheck, Globe } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { usePlatformSettings } from "@/components/providers/PlatformSettingsProvider";

export default function ForgotPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "ar";
  const isAr = locale === "ar";

  const platformSettings = usePlatformSettings();
  const logoUrl = platformSettings?.logoUrl;
  const siteName = isAr ? (platformSettings?.siteNameAr || "منصة معين الرقمية") : (platformSettings?.siteName || "Maeen Digital Platform");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const toggleLanguage = () => {
    const nextLocale = locale === "ar" ? "en" : "ar";
    const currentPath = window.location.pathname;
    const search = window.location.search;
    const newPath = currentPath.replace(`/${locale}`, `/${nextLocale}`);
    router.push(`${newPath}${search}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !email.includes("@")) {
      setError(isAr ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || (isAr ? "حدث خطأ أثناء إرسال الطلب" : "An error occurred"));
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      setError(isAr ? "فشل الاتصال بالخادم" : "Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden font-cairo dir-rtl transition-colors duration-300">
      {/* Background Decorative Patterns */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-tertiary/10 dark:bg-tertiary/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-center z-10 max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white flex items-center justify-center border border-slate-200/80 dark:border-slate-800 shadow-sm p-1 shrink-0">
            <img src={logoUrl || "/logo.png"} alt={siteName} className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-wide">
            {siteName}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-tertiary bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
            title={isAr ? "Switch to English" : "تغيير اللغة للعربية"}
          >
            <Globe size={14} />
            <span>{isAr ? "English" : "العربية"}</span>
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center z-10 py-10">
        <div className="w-full max-w-md bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
          {submitted ? (
            <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {isAr ? "تم إرسال البريد الإلكتروني بنجاح!" : "Reset Email Sent!"}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                {isAr ? (
                  <>
                    تفقّد صندوق الوارد لبريدك الإلكتروني <strong className="text-slate-900 dark:text-white dir-ltr font-bold inline-block px-1">{email}</strong> واضغط على رابط إعادة تعيين كلمة المرور.
                  </>
                ) : (
                  <>
                    Please check your inbox at <strong className="text-slate-900 dark:text-white font-bold inline-block px-1">{email}</strong> and click the password reset link.
                  </>
                )}
              </p>
              <button
                type="button"
                onClick={() => router.push(`/${locale}/login`)}
                className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <ArrowRight size={16} />
                <span>{isAr ? "العودة لتسجيل الدخول" : "Back to Login"}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center space-y-2 flex flex-col items-center">
                {/* Unified Logo */}
                <div className="mb-4 animate-fade-in">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white flex items-center justify-center border border-slate-200/80 dark:border-slate-800 shadow-sm p-1 shrink-0">
                    <img src={logoUrl || "/logo.png"} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isAr ? "نسيت كلمة المرور؟" : "Forgot Password?"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr
                    ? "أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً لاستعادة كلمة المرور"
                    : "Enter your registered email address to receive a password reset link"}
                </p>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs p-3.5 rounded-xl font-medium text-center">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? "البريد الإلكتروني" : "Email Address"}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@moeen.com"
                  className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary transition"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-tertiary hover:opacity-95 text-white font-bold py-3.5 rounded-xl text-xs transition shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>{isAr ? "جاري الإرسال..." : "Sending..."}</span>
                ) : (
                  <span>{isAr ? "إرسال رابط الاستعادة" : "Send Reset Link"}</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push(`/${locale}/login`)}
                className="w-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold py-2 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowRight size={14} />
                <span>{isAr ? "العودة لصفحة الدخول" : "Back to Login"}</span>
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 dark:text-slate-500 z-10">
        {isAr
          ? `© ${new Date().getFullYear()} منصة معين الرقمية. جميع الحقوق محفوظة.`
          : `© ${new Date().getFullYear()} Maeen Digital Platform. All rights reserved.`}
      </footer>
    </div>
  );
}
