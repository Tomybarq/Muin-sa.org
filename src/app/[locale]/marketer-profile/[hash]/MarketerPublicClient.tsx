"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Building2,
  MapPin,
  Mail,
  Phone,
  Share2,
  ExternalLink,
  ShieldCheck,
  Award,
  HeartHandshake,
  UserCheck,
  Copy,
  Check,
  MessageSquare,
  Sparkles,
  Globe,
} from "lucide-react";
import { usePathname, useRouter } from "@/i18n/routing";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { usePlatformSettings } from "@/components/providers/PlatformSettingsProvider";

interface AssociationItem {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  phoneNumbers?: string[];
}

interface PublicMarketer {
  hash: string;
  name: string;
  type: string;
  email?: string | null;
  phone?: string | null;
  governorate?: { name: string; nameAr: string } | null;
  city?: { name: string; nameAr: string } | null;
  avatarUrl?: string | null;
  createdAt: string;
  associations: AssociationItem[];
}

interface Props {
  marketer: PublicMarketer;
  locale: string;
  hash: string;
}

const TYPE_LABELS: Record<string, { ar: string; en: string; style: string }> = {
  employee: { ar: "موظف", en: "Employee", style: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  company: { ar: "مؤسسة", en: "Company", style: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  influencer: { ar: "مؤثر", en: "Influencer", style: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  volunteer: { ar: "متطوع", en: "Volunteer", style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
};

export default function MarketerPublicClient({ marketer, locale, hash }: Props) {
  const isAr = locale === "ar";
  const pathname = usePathname();
  const router = useRouter();
  const platformSettings = usePlatformSettings();

  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const typeConfig = TYPE_LABELS[marketer.type] || {
    ar: marketer.type,
    en: marketer.type,
    style: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  };

  const fullLocation = [
    marketer.governorate ? (isAr ? marketer.governorate.nameAr : marketer.governorate.name) : null,
    marketer.city ? (isAr ? marketer.city.nameAr : marketer.city.name) : null,
  ]
    .filter(Boolean)
    .join(" - ");

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(pageUrl || window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: marketer.name,
          text: isAr
            ? `الملف التعريفي المعتمد للمسوق ${marketer.name} عبر ${platformSettings.siteNameAr || "منصة معين"}`
            : `Verified Marketer Profile: ${marketer.name}`,
          url: pageUrl || window.location.href,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const switchLanguage = () => {
    const nextLocale = locale === "ar" ? "en" : "ar";
    router.replace(pathname, { locale: nextLocale });
  };

  const formattedWhatsApp = marketer.phone
    ? marketer.phone.replace(/[^0-9]/g, "")
    : null;

  const siteTitle = isAr
    ? platformSettings.siteNameAr || "منصة معين"
    : platformSettings.siteName || "Moeen Platform";

  const rawFont = platformSettings.fontFamily || "Cairo";
  const cleanFontFamily = rawFont.replace(/['"]/g, "").trim() || "Cairo";

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-[#E2E8F0] antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-300 relative overflow-hidden"
      style={{ fontFamily: `"${cleanFontFamily}", system-ui, -apple-system, sans-serif` }}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Ambient Cinematic Background Glow Spheres & Dot Grid */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Top-Right Glowing Orb */}
        <div className="absolute -top-40 -end-40 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-transparent rounded-full blur-[140px] opacity-85 transition-all duration-700 pointer-events-none" />
        
        {/* Bottom-Left Glowing Orb */}
        <div className="absolute -bottom-40 -start-40 w-[650px] h-[650px] bg-gradient-to-tr from-teal-500/20 via-emerald-600/15 to-transparent rounded-full blur-[150px] opacity-75 transition-all duration-700 pointer-events-none" />

        {/* Center Accent Ambient Glow */}
        <div className="absolute top-1/3 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-emerald-400/5 dark:bg-emerald-400/10 rounded-full blur-[160px] pointer-events-none" />

        {/* Subtle Tech Dot-Grid Pattern Layer with Radial Mask */}
        <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-35 dark:opacity-40 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_35%,#000_50%,transparent_100%)] pointer-events-none" />
      </div>

      {/* Main Content Viewport */}
      <div className="relative z-10">
        {/* Top Navbar Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Dynamic Platform Logo & Site Name */}
          <div className="flex items-center gap-3">
            {!logoError ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white p-1 flex items-center justify-center border border-slate-200/80 dark:border-slate-800 shadow-sm shrink-0">
                <img
                  src={platformSettings.logoUrl || "/logo.png"}
                  alt={siteTitle}
                  onError={() => setLogoError(true)}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 font-extrabold text-base shrink-0">
                {siteTitle.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-wide">
                {siteTitle}
              </span>
              <span className="block text-[10px] font-semibold text-slate-400 -mt-0.5">
                {isAr ? "بوابة المسوقين المعتمدة" : "Verified Marketer Portal"}
              </span>
            </div>
          </div>

          {/* Actions: Theme Toggle, Language Switcher, Share & Copy Link */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <ThemeToggle variant="pill" />

            {/* Language Switcher */}
            <button
              onClick={switchLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all cursor-pointer"
              title={isAr ? "Switch to English" : "التحويل للغة العربية"}
            >
              <Globe size={15} />
              <span className="hidden sm:inline">{locale === "ar" ? "English" : "العربية"}</span>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
            >
              <Share2 size={14} />
              <span className="hidden sm:inline">{isAr ? "مشاركة" : "Share"}</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/50 transition-all cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copied ? (isAr ? "تم النسخ!" : "Copied!") : (isAr ? "نسخ الرابط" : "Copy Link")}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Hero & Profile Header Card */}
        <div className="relative bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden">
          {/* Decorative Cover Gradient */}
          <div className="h-44 sm:h-52 bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
            <div className="absolute top-4 start-4 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20">
              <ShieldCheck size={14} className="text-emerald-300" />
              <span>{isAr ? "مسوق موثّق معتمد" : "Verified Marketer"}</span>
            </div>
          </div>

          {/* Profile Details Container */}
          <div className="px-6 sm:px-8 pb-8 pt-0 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-16 sm:-mt-20 mb-4 text-center sm:text-start">
              {/* Avatar Box */}
              <div className="relative group">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-white dark:bg-[#1E293B] p-1.5 shadow-2xl border-2 border-white dark:border-slate-800 overflow-hidden shrink-0">
                  {marketer.avatarUrl && !imageError ? (
                    <img
                      src={marketer.avatarUrl}
                      alt={marketer.name}
                      onError={() => setImageError(true)}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <div className="w-full h-full rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-3xl sm:text-4xl font-extrabold shadow-inner">
                      {marketer.name ? marketer.name.charAt(0).toUpperCase() : "M"}
                    </div>
                  )}
                </div>
                {/* Verified Check Badge on Avatar */}
                <div className="absolute bottom-1 end-1 bg-emerald-500 text-white rounded-full p-1.5 shadow-lg border-2 border-white dark:border-[#1E293B]">
                  <CheckCircle2 size={16} />
                </div>
              </div>

              {/* Title & Badge */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {marketer.name}
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${typeConfig.style}`}>
                    {isAr ? typeConfig.ar : typeConfig.en}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-1 gap-x-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {fullLocation && (
                    <span className="flex items-center gap-1">
                      <MapPin size={14} className="text-emerald-500" />
                      <span>{fullLocation}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Sparkles size={14} />
                    <span>{isAr ? "حساب نشط بالمنصة" : "Active Verified Status"}</span>
                  </span>
                </div>
              </div>

              {/* Contact Actions */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {formattedWhatsApp && (
                  <a
                    href={`https://wa.me/${formattedWhatsApp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all transform active:scale-95"
                  >
                    <MessageSquare size={16} />
                    <span>{isAr ? "تواصل واتساب" : "WhatsApp"}</span>
                  </a>
                )}
                {marketer.phone && (
                  <a
                    href={`tel:${marketer.phone}`}
                    className="flex items-center justify-center p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all"
                    title={isAr ? "اتصال تلفوني" : "Call"}
                  >
                    <Phone size={18} />
                  </a>
                )}
              </div>
            </div>

            {/* Quick Contact & Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs">
              {marketer.email && (
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Mail size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-semibold">{isAr ? "البريد الإلكتروني" : "Email"}</p>
                    <p className="font-bold text-slate-700 dark:text-slate-200 truncate">{marketer.email}</p>
                  </div>
                </div>
              )}
              {marketer.phone && (
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                    <Phone size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-semibold">{isAr ? "رقم الجوال / التواصل" : "Phone"}</p>
                    <p className="font-bold text-slate-700 dark:text-slate-200 dir-ltr text-end sm:text-start">{marketer.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Associated Charities Section */}
        <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
                <HeartHandshake size={22} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {isAr ? "الجمعيات الخيرية المرتبطة" : "Associated Non-Profits"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr
                    ? "قائمة الجمعيات الأهلية والخيرية المعتمدة التي يمثلها هذا المسوق"
                    : "Official charities represented by this verified marketer"}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
              {marketer.associations.length} {isAr ? "جمعية" : "Charities"}
            </span>
          </div>

          {marketer.associations.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm space-y-2">
              <Building2 size={36} className="mx-auto text-slate-300 dark:text-slate-700" />
              <p>{isAr ? "لا توجد جمعيات مضافة حالياً لهذا المسوق" : "No associations linked yet"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {marketer.associations.map((assoc) => (
                <div
                  key={assoc.id}
                  className="group relative p-5 rounded-2xl bg-slate-50 hover:bg-white dark:bg-slate-900/40 dark:hover:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 transition-all duration-300 hover:shadow-lg hover:border-emerald-500/30 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
                        <Building2 size={20} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {assoc.name}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                          <CheckCircle2 size={12} />
                          <span>{isAr ? "جهة شريكة معتمدة" : "Verified Partner"}</span>
                        </span>
                      </div>
                    </div>

                    {(assoc.phone || (assoc.phoneNumbers && assoc.phoneNumbers.length > 0) || assoc.email) && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-400">
                        {assoc.phone && (
                          <div className="flex items-center gap-2">
                            <Phone size={13} className="text-slate-400" />
                            <span>{assoc.phone}</span>
                          </div>
                        )}
                        {assoc.phoneNumbers && assoc.phoneNumbers.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 text-[11px]">
                            <span className="text-slate-400 font-semibold">{isAr ? "أرقام إضافية:" : "Extra phones:"}</span>
                            {assoc.phoneNumbers.map((ph, idx) => (
                              <span key={idx} className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono">
                                {ph}
                              </span>
                            ))}
                          </div>
                        )}
                        {assoc.email && (
                          <div className="flex items-center gap-2">
                            <Mail size={13} className="text-slate-400" />
                            <span className="truncate">{assoc.email}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px] font-medium">
                      {siteTitle}
                    </span>
                    {assoc.phone && (
                      <a
                        href={`https://wa.me/${assoc.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                      >
                        <span>{isAr ? "تواصل مع الجمعية" : "Contact"}</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verification Guarantee Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-500/20">
          <div className="flex items-center gap-4 text-center sm:text-start">
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <Award size={28} />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-base text-white">
                {isAr ? `حساب موثق وآمن عبر ${siteTitle}` : `Verified Account on ${siteTitle}`}
              </h4>
              <p className="text-xs text-slate-300 max-w-xl">
                {isAr
                  ? "جميع البيانات المعروضة تم التحقق منها رسمياً عبر لوحة تحكم المنصة لضمان النزاهة والموثوقية التامة للجمعيات والمتبرعين."
                  : "All information shown is officially verified through the platform admin portal ensuring standard transparency."}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-6 text-xs text-slate-800 dark:text-slate-300 space-y-1">
          <p>{siteTitle} © {isAr ? "جميع الحقوق محفوظة" : "All Rights Reserved"}</p>
          <p className="text-[10px] text-slate-600 dark:text-slate-400">
            {isAr ? "نظام إدارة المسوقين والجمعيات والمستفيدين" : "Charity Marketers & Beneficiaries Management System"}
          </p>
        </footer>

      </main>
      </div>
    </div>
  );
}
