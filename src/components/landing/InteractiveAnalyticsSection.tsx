"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  BarChart2,
  CheckCircle,
  Compass,
  Globe2,
  MapPin,
  PieChart,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export interface InteractiveAnalyticsSectionProps {
  locale: string;
  eyebrow: string;
  title: string;
  desc: string;
  topGovernorates?: Array<{
    nameAr: string;
    nameEn: string;
    count: number;
    pct: number;
  }> | null;
  categoriesDistribution?: Array<{
    nameAr: string;
    nameEn: string;
    count: number;
    pct: number;
    color: string;
  }> | null;
  beneficiariesTotal?: number;
}

export function InteractiveAnalyticsSection({
  locale,
  eyebrow,
  title,
  desc,
  topGovernorates,
  categoriesDistribution,
  beneficiariesTotal,
}: InteractiveAnalyticsSectionProps) {
  const TABS = ["geo", "sectors"] as const;
  type TabType = (typeof TABS)[number];

  // Build available tabs dynamically based on real data
  const hasGeoData = !!(topGovernorates && topGovernorates.length > 0);
  const hasSectorData = !!(categoriesDistribution && categoriesDistribution.length > 0);

  const availableTabs: TabType[] = [];
  if (hasGeoData) availableTabs.push("geo");
  if (hasSectorData) availableTabs.push("sectors");

  const [activeTab, setActiveTab] = useState<TabType>(availableTabs[0] || "geo");

  // Tab auto-switch duration (6 seconds per view)
  const TAB_DURATION_MS = 6000;

  // Uninterrupted smooth auto-switch between tabs
  useEffect(() => {
    if (availableTabs.length <= 1) return;

    const timer = setTimeout(() => {
      setActiveTab((curr) => {
        const currIdx = availableTabs.indexOf(curr);
        const nextIdx = (currIdx + 1) % availableTabs.length;
        return availableTabs[nextIdx];
      });
    }, TAB_DURATION_MS);

    return () => clearTimeout(timer);
  }, [activeTab, availableTabs]);

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
  };

  // If no real data for either tab, hide the entire section
  if (availableTabs.length === 0) return null;

  const isAr = locale === "ar";

  // 1. Regional / Governorate Distribution (Real data only)
  const totalGovBeneficiaries =
    beneficiariesTotal && beneficiariesTotal > 0
      ? beneficiariesTotal
      : topGovernorates
      ? topGovernorates.reduce((sum, g) => sum + g.count, 0)
      : 0;

  const regions = hasGeoData
    ? topGovernorates!.map((g, idx) => {
        const sharePct =
          totalGovBeneficiaries > 0
            ? Math.round((g.count / totalGovBeneficiaries) * 100)
            : g.pct;
        const name = isAr
          ? (g.nameAr.startsWith("منطقة") ? g.nameAr : `منطقة ${g.nameAr}`)
          : `${g.nameEn} Region`;
        const status =
          idx === 0
            ? isAr ? "الأعلى تغطية" : "Highest Reach"
            : isAr ? "نشط وموثق" : "Active & Verified";
        return {
          name,
          share: `${sharePct}%`,
          count: `${g.count.toLocaleString(locale)} ${isAr ? "مستفيد" : "beneficiaries"}`,
          status,
        };
      })
    : [];

  // 2. Sector / Category Breakdown (Real data only)
  const sectorColorPalette = ["bg-emerald-500", "bg-teal-500", "bg-amber-500", "bg-blue-500", "bg-indigo-500", "bg-purple-500"];

  const sectorDistribution = hasSectorData
    ? categoriesDistribution!.map((c, idx) => {
        const name = isAr ? `قطاع الرعاية ال${c.nameAr}` : `${c.nameEn} Welfare`;
        const desc = isAr
          ? `${c.count.toLocaleString(locale)} مستفيد مسجل ومعتمد`
          : `${c.count.toLocaleString(locale)} registered beneficiaries`;
        return {
          name,
          val: `${c.pct}%`,
          color: sectorColorPalette[idx % sectorColorPalette.length],
          desc,
        };
      })
    : [];

  return (
    <section id="analytics" className="relative py-20 bg-slate-50/50 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80 transition-colors overflow-hidden">
      <div className="landing-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text / Info Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--landing-accent,#0A5C4A)]/10 dark:bg-[var(--landing-accent-deep,#2FAB99)]/15 border border-[var(--landing-accent,#0A5C4A)]/20 text-[var(--landing-accent,#0A5C4A)] dark:text-[var(--landing-accent-deep,#2FAB99)] text-xs font-extrabold">
              <Compass className="h-3.5 w-3.5" />
              <span>{eyebrow}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {title}
            </h2>

            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              {desc}
            </p>

            {/* Feature Highlights */}
            <div className="space-y-3 pt-2">
              {[
                { title: isAr ? "مؤشرات تغطية جغرافية حية" : "Real-time geographical reach indicators", desc: isAr ? "قراءة التوزيع السكاني لخدمات الجمعيات" : "Demographic density of social services" },
                { title: isAr ? "تقارير أثر دورية قابلة للتدقيق" : "Auditable periodic impact analytics", desc: isAr ? "جاهزة للاعتماد ورفعها للجهات الإشرافية" : "Ready for regulatory compliance" },
                { title: isAr ? "تحديث تلقائي وفوري للسجلات" : "Instant auto-sync of beneficiary registries", desc: isAr ? "بيانات دقيقة خالية من التكرار والازدواج" : "Zero-redundancy verified datasets" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mt-1">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                      {item.title}
                    </strong>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {item.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Interactive Chart Visual Card */}
          <div className="lg:col-span-7">
            <div className="relative p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden">
              {/* Card Header & Tab Switcher */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[var(--landing-accent,#0A5C4A)]/10 text-[var(--landing-accent,#0A5C4A)] dark:text-[var(--landing-accent-deep,#2FAB99)]">
                    <Globe2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {isAr ? "تحليل الأثر والتغطية الميدانية" : "Impact & Field Coverage Analytics"}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {isAr ? "تحديث فوري ومباشر" : "Real-time stream"}
                    </span>
                  </div>
                </div>

                {/* Tab Switcher — only show if tabs available */}
                {availableTabs.length > 0 && (
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 text-xs">
                    {([
                      { id: "geo" as const, icon: MapPin, label: isAr ? "المناطق" : "Regions" },
                      { id: "sectors" as const, icon: PieChart, label: isAr ? "القطاعات" : "Sectors" },
                    ] as const).filter((tab) => availableTabs.includes(tab.id)).map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-black transition-all ${
                          activeTab === tab.id
                            ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 text-white shadow-md shadow-emerald-950/20 dark:from-emerald-400 dark:via-emerald-300 dark:to-teal-400 dark:text-slate-950 dark:shadow-lg dark:shadow-emerald-400/20 ring-1 ring-white/20 dark:ring-emerald-300/50 scale-[1.02]"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 font-semibold"
                        }`}
                      >
                        <tab.icon className="h-3.5 w-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Full-width Countdown Bar — only if multiple tabs */}
              {availableTabs.length > 1 && (
                <div
                  dir={isAr ? "rtl" : "ltr"}
                  className="relative -mx-6 sm:-mx-8 h-1 bg-slate-100 dark:bg-slate-800/80 overflow-hidden"
                >
                  <div
                    key={activeTab}
                    className="h-full bg-gradient-to-r from-[var(--landing-accent,#0A5C4A)] via-[var(--landing-accent-deep,#2FAB99)] to-emerald-400 dark:from-emerald-400 dark:via-teal-300 dark:to-amber-300 animate-countdown-shrink"
                    style={{ animationDuration: `${TAB_DURATION_MS}ms` }}
                  />
                </div>
              )}

              {/* View 1: Geographic Distribution — only with real data */}
              {activeTab === "geo" && hasGeoData && (
                <div key="geo" className="mt-6 space-y-4 animate-in fade-in duration-300">
                  {regions.map((reg, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-[var(--landing-accent-deep,#2FAB99)] flex-shrink-0" />
                        <div>
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-200 block">
                            {reg.name}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {reg.count}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="w-28 sm:w-36 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--landing-accent,#0A5C4A)] to-[var(--landing-accent-deep,#2FAB99)]"
                            style={{ width: reg.share }}
                          />
                        </div>
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white min-w-[3rem] text-left ltr:text-right">
                          {reg.share}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* View 2: Sectors Breakdown — only with real data */}
              {activeTab === "sectors" && hasSectorData && (
                <div key="sectors" className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-300">
                  {sectorDistribution.map((sec, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {sec.name}
                        </span>
                        <span className="text-sm font-black text-[var(--landing-accent-deep,#2FAB99)]">
                          {sec.val}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div className={`h-full rounded-full ${sec.color}`} style={{ width: sec.val }} />
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        {sec.desc}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
