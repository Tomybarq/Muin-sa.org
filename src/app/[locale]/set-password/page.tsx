"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Lock, ShieldCheck, CheckCircle2, AlertCircle, Eye, EyeOff, Globe, Check, X } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { passwordSchema } from "@/lib/zodSchemas";
import { usePlatformSettings } from "@/components/providers/PlatformSettingsProvider";

export default function SetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || "ar";
  const isAr = locale === "ar";
  const token = searchParams.get("token") || "";

  const platformSettings = usePlatformSettings();
  const logoUrl = platformSettings?.logoUrl;
  const siteName = isAr ? (platformSettings?.siteNameAr || "منصة معين الرقمية") : (platformSettings?.siteName || "Maeen Digital Platform");

  const [loading, setLoading] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(isAr ? "رابط التفعيل غير صحيح أو مفقود" : "Activation token missing");
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch("/api/auth/verify-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();

        if (res.ok && data.valid) {
          setValidToken(true);
          setUserName(data.user.name || data.user.email);
        } else {
          setError(data.message || (isAr ? "انتهت صلاحية هذا الرابط" : "Link expired"));
        }
      } catch (err) {
        setError(isAr ? "فشل التحقق من الرابط" : "Token verification failed");
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token, isAr]);

  const toggleLanguage = () => {
    const nextLocale = locale === "ar" ? "en" : "ar";
    const currentPath = window.location.pathname;
    const search = window.location.search;
    const newPath = currentPath.replace(`/${locale}`, `/${nextLocale}`);
    router.push(`${newPath}${search}`);
  };

  // Password rules evaluation
  const rules = [
    { label: isAr ? "8 أحرف على الأقل" : "At least 8 characters", valid: password.length >= 8 },
    { label: isAr ? "حرف صغير واحد (a-z)" : "One lowercase letter (a-z)", valid: /[a-z]/.test(password) },
    { label: isAr ? "حرف كبير واحد (A-Z)" : "One uppercase letter (A-Z)", valid: /[A-Z]/.test(password) },
    { label: isAr ? "رقم واحد على الأقل (0-9)" : "One number (0-9)", valid: /\d/.test(password) },
    { label: isAr ? "رمز خاص واحد على الأقل (مثل @$!%*?&)" : "One special character (@$!%*?&)", valid: /[^A-Za-z0-9]/.test(password) },
  ];

  const validCount = rules.filter((r) => r.valid).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError(isAr ? "يرجى تعبئة جميع الحقول" : "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError(isAr ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
      return;
    }

    const pwdCheck = passwordSchema.safeParse(password);
    if (!pwdCheck.success) {
      setError(pwdCheck.error.issues[0].message);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || (isAr ? "فشل تفعيل كلمة المرور" : "Failed to set password"));
      } else {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = `/${locale}/portal`;
        }, 1500);
      }
    } catch (err) {
      setError(isAr ? "فشل الاتصال بالخادم" : "Server connection error");
    } finally {
      setSubmitting(false);
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

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center z-10 py-10">
        <div className="w-full max-w-md bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
          {loading ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400">{isAr ? "جاري التحقق من الرابط..." : "Verifying invitation link..."}</p>
            </div>
          ) : success ? (
            <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-300 py-6">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {isAr ? "تم تعيين كلمة المرور وتفعيل الحساب!" : "Password Set & Account Activated!"}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {isAr
                  ? "جاري توجيهك تلقائياً إلى منصة معين..."
                  : "Redirecting you automatically to Maeen Portal..."}
              </p>
            </div>
          ) : !validToken ? (
            <div className="text-center space-y-6 py-6">
              <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-500/30">
                <AlertCircle size={36} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{isAr ? "رابط غير صالح" : "Invalid Link"}</h2>
              <p className="text-xs text-rose-500 dark:text-rose-300">{error}</p>
              <button
                type="button"
                onClick={() => router.push(`/${locale}/login`)}
                className="w-full bg-primary text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer hover:opacity-90"
              >
                {isAr ? "الانتقال لشاشة الدخول" : "Go to Login"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center space-y-2 flex flex-col items-center">
                {/* Unified Logo */}
                <div className="mb-4 animate-fade-in">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white flex items-center justify-center border border-slate-200/80 dark:border-slate-800 shadow-sm p-1 shrink-0">
                    <img src={logoUrl || "/logo.png"} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isAr ? "تعيين كلمة المرور لأول مرة" : "Set Your Password"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr ? `مرحباً بك (${userName})، يرجى إنشاء كلمة مرور جديدة لحسابك.` : `Welcome (${userName}), please create a password for your account.`}
                </p>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs p-3.5 rounded-xl font-medium text-center">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isAr ? "كلمة المرور الجديدة" : "New Password"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary transition pl-10"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isAr ? "تأكيد كلمة المرور" : "Confirm Password"}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary transition pl-10"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Bar & Checklist */}
                {password.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <span>{isAr ? "قوة كلمة المرور:" : "Password Strength:"}</span>
                      <span className={validCount === 5 ? "text-emerald-500" : validCount >= 3 ? "text-amber-500" : "text-rose-500"}>
                        {validCount === 5
                          ? (isAr ? "قوية جداً" : "Strong")
                          : validCount >= 3
                          ? (isAr ? "متوسطة" : "Medium")
                          : (isAr ? "ضعيفة" : "Weak")}
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 transition-all ${validCount >= 1 ? (validCount === 5 ? "bg-emerald-500" : validCount >= 3 ? "bg-amber-500" : "bg-rose-500") : "bg-transparent"}`} />
                      <div className={`h-full flex-1 transition-all ${validCount >= 3 ? (validCount === 5 ? "bg-emerald-500" : "bg-amber-500") : "bg-transparent"}`} />
                      <div className={`h-full flex-1 transition-all ${validCount === 5 ? "bg-emerald-500" : "bg-transparent"}`} />
                    </div>

                    <div className="grid grid-cols-1 gap-1 pt-1 text-[11px]">
                      {rules.map((rule, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          {rule.valid ? (
                            <Check size={12} className="text-emerald-500 shrink-0" />
                          ) : (
                            <X size={12} className="text-slate-400 shrink-0" />
                          )}
                          <span className={rule.valid ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-400"}>
                            {rule.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-primary to-tertiary hover:opacity-95 text-white font-bold py-3.5 rounded-xl text-xs transition shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <span>{isAr ? "جاري الحفظ والتسجيل..." : "Saving & Logging in..."}</span>
                ) : (
                  <span>{isAr ? "حفظ كلمة المرور والدخول للمنصة" : "Set Password & Access Portal"}</span>
                )}
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
