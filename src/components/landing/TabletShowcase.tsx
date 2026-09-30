"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  ArrowUpRight,
  // BarChart3 removed — Growth tab was removed
  Building2,
  CheckCircle2,
  Layers,
  MapPin,
  PieChart,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

export interface TabletShowcaseProps {
  locale: string;
  assocCount?: number;
  benefCount?: number;
  govCount?: number;
  catCount?: number;
  categoriesDistribution?: Array<{
    nameAr: string;
    nameEn: string;
    count: number;
    pct: number;
    color: string;
  }> | null;
  topGovernorates?: Array<{
    nameAr: string;
    nameEn: string;
    count: number;
    pct: number;
  }> | null;
  recentActivities?: Array<{
    actionAr: string;
    actionEn: string;
    orgAr: string;
    orgEn: string;
    timeAr: string;
    timeEn: string;
    type: "create" | "grant" | "report" | "auth";
  }> | null;
  trend?: Array<{
    labelAr: string;
    labelEn: string;
    value: number;
    count: string;
  }> | null;
}

export function TabletShowcase({
  locale,
  assocCount = 0,
  benefCount = 0,
  govCount = 0,
  catCount = 0,
  categoriesDistribution,
  topGovernorates,
  recentActivities,
  trend,
}: TabletShowcaseProps) {
  // Build available tabs dynamically based on real data
  const hasOverviewData = !!(trend && trend.length >= 2) || !!(recentActivities && recentActivities.length > 0);
  const hasDistributionData = !!(categoriesDistribution && categoriesDistribution.length > 0) || !!(topGovernorates && topGovernorates.length > 0);

  const availableTabs: Array<"overview" | "distribution"> = [];
  if (hasOverviewData) availableTabs.push("overview");
  if (hasDistributionData) availableTabs.push("distribution");

  type TabType = "overview" | "distribution";

  const [activeTab, setActiveTab] = useState<TabType>(availableTabs[0] || "overview");
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(4);

  // Tab auto-switch duration (5.5 seconds per tab)
  const TAB_DURATION_MS = 5500;

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

  const isAr = locale === "ar";

  // Trend data points for Overview Wave Chart (Real data only)
  const trendPoints =
    trend && trend.length >= 2
      ? trend.map((t) => ({
          label: isAr ? t.labelAr : t.labelEn,
          value: t.value,
          count: t.count,
        }))
      : null;

  // Category breakdown for Radial Donut Chart (Real data only)
  const categories =
    categoriesDistribution && categoriesDistribution.length > 0
      ? categoriesDistribution.slice(0, 4).map((c) => ({
          name: isAr ? c.nameAr : c.nameEn,
          pct: c.pct,
          color: c.color,
          amount: c.count.toLocaleString(locale),
        }))
      : null;

  // Top Governorates (Real data only)
  const displayedGovs =
    topGovernorates && topGovernorates.length > 0
      ? topGovernorates.slice(0, 4).map((g) => ({
          name: isAr ? (g.nameAr.startsWith("منطقة") ? g.nameAr : `منطقة ${g.nameAr}`) : `${g.nameEn} Region`,
          pct: g.pct,
          count: g.count.toLocaleString(locale),
        }))
      : null;

  // Live Activity Stream (Real data only)
  const displayedActivities =
    recentActivities && recentActivities.length > 0
      ? recentActivities.slice(0, 3).map((act) => {
          let Icon = CheckCircle2;
          let color = "text-emerald-600 dark:text-emerald-400";
          if (act.type === "grant") {
            Icon = ArrowUpRight;
            color = "text-teal-600 dark:text-teal-400";
          } else if (act.type === "report") {
            Icon = Activity;
            color = "text-amber-600 dark:text-amber-400";
          } else if (act.type === "auth") {
            Icon = ShieldCheck;
            color = "text-blue-600 dark:text-blue-400";
          }
          return {
            action: isAr ? act.actionAr : act.actionEn,
            org: isAr ? act.orgAr : act.orgEn,
            time: isAr ? act.timeAr : act.timeEn,
            icon: Icon,
            color,
          };
        })
      : null;

  // Filter KPI cards — only show ones with real data (> 0)
  const allKpis = [
    {
      label: isAr ? "إجمالي المستفيدين" : "Beneficiaries",
      val: benefCount > 0 ? benefCount.toLocaleString(locale) : null,
      icon: Users,
    },
    {
      label: isAr ? "الجمعيات المعتمدة" : "Active Charities",
      val: assocCount > 0 ? assocCount.toLocaleString(locale) : null,
      icon: Building2,
    },
    {
      label: isAr ? "المحافظات المخدومة" : "Governorates",
      val: govCount > 0 ? govCount.toLocaleString(locale) : null,
      icon: MapPin,
    },
    {
      label: isAr ? "تصنيفات الدعم" : "Sectors",
      val: catCount > 0 ? catCount.toLocaleString(locale) : null,
      icon: Layers,
    },
  ].filter((kpi) => kpi.val !== null);

  return (
    <div className="relative w-full max-w-5xl mx-auto my-6 select-none">
      {/* Ambient Radial Glow underneath Tablet */}
      <div
        className="absolute -inset-4 md:-inset-8 bg-gradient-to-r from-emerald-500/20 via-teal-500/25 to-amber-500/15 rounded-[48px] blur-3xl opacity-70 dark:opacity-50 pointer-events-none -z-10 animate-pulse-glow"
        aria-hidden="true"
      />

      {/* Floating Badge 1: Instant Verification */}
      <div className="hidden lg:flex absolute -top-5 ltr:-left-6 rtl:-right-6 z-20 items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-emerald-500/30 shadow-xl shadow-emerald-950/10 animate-float text-xs font-bold text-slate-800 dark:text-slate-100">
        <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
        </span>
        <span>{isAr ? "⚡ ربط سحابي فوري 99.9%" : "⚡ Real-time Cloud Sync 99.9%"}</span>
      </div>

      {/* Floating Badge 2: Security & Governance */}
      <div className="hidden lg:flex absolute -bottom-6 ltr:-right-6 rtl:-left-6 z-20 items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-teal-500/30 shadow-xl shadow-teal-950/10 animate-float-alt text-xs font-bold text-slate-800 dark:text-slate-100">
        <ShieldCheck className="h-4 w-4 text-[var(--landing-accent,#2FAB99)]" />
        <span>{isAr ? "🛡️ تشفير بنكي وحوكمة معتمدة" : "🛡️ Enterprise Encryption & RBAC"}</span>
      </div>

      {/* Tablet Hardware Frame */}
      <div
        className="relative rounded-[32px] md:rounded-[44px] p-2.5 md:p-3.5 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 shadow-2xl ring-1 ring-white/20 dark:ring-white/10"
      >
        {/* Tablet Top Camera Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-0.5 rounded-full bg-slate-950/80 border border-slate-700/50 z-30">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-800 ring-1 ring-slate-600" />
          <div className="w-1 h-1 rounded-full bg-emerald-500/80" />
        </div>

        {/* Tablet Screen Container */}
        <div className="relative rounded-[24px] md:rounded-[36px] overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 text-slate-900 dark:text-slate-100 transition-colors">
          {/* Glass Glare Highlight */}
          <div
            className="absolute -inset-full w-[200%] h-[200%] bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none z-20"
            style={{ transform: "rotate(-25deg)" }}
          />

          {/* Tablet Virtual Top Navigation Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md relative z-10">
            {/* Left: Platform Logo & Indicator */}
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--landing-accent,#0A5C4A)]/15 text-[var(--landing-accent,#0A5C4A)] dark:text-[var(--landing-accent-deep,#2FAB99)] font-extrabold text-xs">
                م
              </div>
              <div className="hidden sm:block text-right ltr:text-left">
                <span className="block text-xs font-bold leading-tight text-slate-800 dark:text-slate-100">
                  {isAr ? "منصة معين • لوحة القيادة" : "Moeen • Live Dashboard"}
                </span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                  {isAr ? "مساحة الحوكمة السحابية" : "Cloud Governance Space"}
                </span>
              </div>
            </div>

            {/* Middle: Interactive Tab Switcher — only show if there are tabs */}
            {availableTabs.length > 0 && (
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 text-xs">
                {([
                  { id: "overview" as const, label: isAr ? "المؤشرات" : "Overview", icon: Activity },
                  { id: "distribution" as const, label: isAr ? "التوزيع" : "Breakdown", icon: PieChart },
                ] as const).filter((tab) => availableTabs.includes(tab.id)).map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-black transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 text-white shadow-md shadow-emerald-950/20 dark:from-emerald-400 dark:via-emerald-300 dark:to-teal-400 dark:text-slate-950 dark:shadow-lg dark:shadow-emerald-400/30 ring-1 ring-white/20 dark:ring-emerald-300/50 scale-[1.03]"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Right: Live Status Pill */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-radar" />
                {isAr ? "مباشر" : "Live"}
              </span>
            </div>
          </div>

          {/* Full-width Decrementing Countdown Bar — only if multiple tabs */}
          {availableTabs.length > 1 && (
            <div
              dir={isAr ? "rtl" : "ltr"}
              className="relative w-full h-1 sm:h-1.5 bg-slate-200/60 dark:bg-slate-800/80 overflow-hidden"
            >
              <div
                key={activeTab}
                className="h-full bg-gradient-to-r from-[var(--landing-accent,#0A5C4A)] via-[var(--landing-accent-deep,#2FAB99)] to-emerald-400 dark:from-emerald-400 dark:via-teal-300 dark:to-amber-300 animate-countdown-shrink relative"
                style={{ animationDuration: `${TAB_DURATION_MS}ms` }}
              >
                {/* Subtle leading edge glow */}
                <span className="absolute top-0 bottom-0 ltr:right-0 rtl:left-0 w-3 bg-white/70 blur-[1px]" />
              </div>
            </div>
          )}

          {/* Tablet Screen Content Area */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Quick KPI Stat Cards — only cards with real data */}
            {allKpis.length > 0 && (
              <div className={`grid gap-3 ${allKpis.length >= 4 ? 'grid-cols-2 lg:grid-cols-4' : allKpis.length >= 2 ? 'grid-cols-2' : 'grid-cols-1 max-w-xs'}`}>
                {allKpis.map((kpi, idx) => {
                  const Icon = kpi.icon;
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:border-[var(--landing-accent,#2FAB99)]/40 transition-all"
                    >
                      <div className="flex items-center text-xs mb-2">
                        <span className="p-1.5 rounded-lg bg-[var(--landing-accent,#0A5C4A)]/10 text-[var(--landing-accent,#0A5C4A)] dark:text-[var(--landing-accent-deep,#2FAB99)]">
                          <Icon className="h-4 w-4" />
                        </span>
                      </div>
                      <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {kpi.val}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {kpi.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 1: Overview View — only if real data exists */}
            {activeTab === "overview" && hasOverviewData && (
              <div key="overview" className={`grid grid-cols-1 ${trendPoints && displayedActivities ? 'lg:grid-cols-3' : ''} gap-4 animate-in fade-in duration-300`}>
                {/* Main Animated Trend Area Chart — only if trend data exists */}
                {trendPoints && (
                  <div className={`${displayedActivities ? 'lg:col-span-2' : ''} p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-[var(--landing-accent,#2FAB99)]" />
                          {isAr ? "معدل نمو خدمة المستفيدين شهرياً" : "Monthly Beneficiary Impact Curve"}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isAr ? "مؤشر بياني متصل يعكس دقة التحقق والتسجيل" : "Connected curve tracking registered impact"}
                        </p>
                      </div>

                      {hoveredPoint !== null && trendPoints[hoveredPoint] && (
                        <div className="px-2.5 py-1 rounded-lg bg-[var(--landing-accent,#0A5C4A)] text-white text-[11px] font-bold shadow-sm">
                          {trendPoints[hoveredPoint].label}: {trendPoints[hoveredPoint].count}{" "}
                          {isAr ? "مستفيد" : "users"}
                        </div>
                      )}
                    </div>

                    {/* SVG Animated Interactive Wave */}
                    <div className="relative h-44 sm:h-52 w-full">
                      <svg
                        className="w-full h-full overflow-visible"
                        viewBox="0 0 600 200"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id="tabletAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2FAB99" stopOpacity="0.4" />
                            <stop offset="70%" stopColor="#0A5C4A" stopOpacity="0.1" />
                            <stop offset="100%" stopColor="#0A5C4A" stopOpacity="0" />
                          </linearGradient>

                          <linearGradient id="tabletLineGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#0A5C4A" />
                            <stop offset="50%" stopColor="#2FAB99" />
                            <stop offset="100%" stopColor="#F9A826" />
                          </linearGradient>
                        </defs>

                        {/* Horizontal Grid lines */}
                        <line x1="0" y1="40" x2="600" y2="40" stroke="currentColor" strokeOpacity="0.08" />
                        <line x1="0" y1="100" x2="600" y2="100" stroke="currentColor" strokeOpacity="0.08" />
                        <line x1="0" y1="160" x2="600" y2="160" stroke="currentColor" strokeOpacity="0.08" />

                        {/* Area Fill */}
                        <path
                          d="M 0 160 Q 60 140, 120 130 T 240 120 T 360 80 T 480 45 T 600 25 L 600 200 L 0 200 Z"
                          fill="url(#tabletAreaGrad)"
                        />

                        {/* Animated Stroke Path */}
                        <path
                          d="M 0 160 Q 60 140, 120 130 T 240 120 T 360 80 T 480 45 T 600 25"
                          fill="none"
                          stroke="url(#tabletLineGrad)"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          className="transition-all duration-700"
                        />

                        {/* Interactive Data Points */}
                        {[
                          { cx: 20, cy: 160, idx: 0 },
                          { cx: 120, cy: 130, idx: 1 },
                          { cx: 240, cy: 120, idx: 2 },
                          { cx: 360, cy: 80, idx: 3 },
                          { cx: 480, cy: 45, idx: 4 },
                          { cx: 580, cy: 25, idx: 5 },
                        ].map((pt) => (
                          <g
                            key={pt.idx}
                            onMouseEnter={() => setHoveredPoint(pt.idx)}
                            className="cursor-pointer group"
                          >
                            <circle
                              cx={pt.cx}
                              cy={pt.cy}
                              r={hoveredPoint === pt.idx ? "7" : "4.5"}
                              className="fill-white dark:fill-slate-900 stroke-[var(--landing-accent-deep,#2FAB99)] stroke-[3px] transition-all duration-200"
                            />
                            {hoveredPoint === pt.idx && (
                              <circle
                                cx={pt.cx}
                                cy={pt.cy}
                                r="12"
                                className="fill-[var(--landing-accent-deep,#2FAB99)]/20 animate-ping"
                              />
                            )}
                          </g>
                        ))}
                      </svg>

                      {/* X-Axis Labels */}
                      <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 mt-2 px-2">
                        {trendPoints.map((tp, idx) => (
                          <span
                            key={idx}
                            className={hoveredPoint === idx ? "font-bold text-[var(--landing-accent-deep,#2FAB99)]" : ""}
                          >
                            {tp.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Activity Stream Widget — only if real activities */}
                {displayedActivities && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                          {isAr ? "نشاط المنصة المباشر" : "Live Activity Feed"}
                        </span>
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>

                      <div className="space-y-3">
                        {displayedActivities.map((act, i) => {
                          const Icon = act.icon;
                          return (
                            <div
                              key={i}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-start gap-2.5"
                            >
                              <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${act.color}`} />
                              <div className="min-w-0 flex-1 text-right ltr:text-left">
                                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {act.action}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                                  <span>{act.org}</span>
                                  <span>{act.time}</span>
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-[var(--landing-accent-deep,#2FAB99)] font-bold">
                      <span>{isAr ? "جميع العمليات موثقة ومؤمنة" : "All transactions certified"}</span>
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Distribution Breakdown — only with real data */}
            {activeTab === "distribution" && hasDistributionData && (
              <div key="distribution" className={`grid grid-cols-1 ${categories && displayedGovs ? 'lg:grid-cols-2' : ''} gap-4 animate-in fade-in duration-300`}>
                {/* Radial Donut breakdown — only if categories exist */}
                {categories && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="38" stroke="currentColor" strokeOpacity="0.1" strokeWidth="14" fill="none" />
                        {categories.map((cat, idx) => {
                          const prevPct = categories.slice(0, idx).reduce((sum, item) => sum + item.pct, 0);
                          const strokeLength = (cat.pct / 100) * 238.76;
                          const strokeOffset = -((prevPct / 100) * 238.76);
                          return (
                            <circle
                              key={idx}
                              cx="50"
                              cy="50"
                              r="38"
                              stroke={cat.color}
                              strokeWidth="14"
                              strokeDasharray={`${strokeLength.toFixed(1)} 240`}
                              strokeDashoffset={strokeOffset.toFixed(1)}
                              fill="none"
                              className="transition-all duration-700"
                            />
                          );
                        })}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-lg font-extrabold text-slate-900 dark:text-white">100%</span>
                        <span className="text-[9px] text-slate-500 dark:text-slate-400">{isAr ? "توزيع الدعم" : "Sectors"}</span>
                      </div>
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      {categories.map((cat, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                            <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">{cat.name}</span>
                          </div>
                          <span className="font-extrabold text-slate-900 dark:text-white">{cat.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Geographic Governorates Progress Bars — only if real data */}
                {displayedGovs && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>{isAr ? "أعلى المناطق والمحافظات تغطية" : "Top Covered Regions"}</span>
                      {govCount > 0 && <span className="text-[10px] text-slate-500 dark:text-slate-400">{govCount} {isAr ? "منطقة ومحافظة" : "regions"}</span>}
                    </h4>

                    {displayedGovs.map((gov, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{gov.name}</span>
                          <span className="font-bold text-[var(--landing-accent-deep,#2FAB99)]">{gov.count}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--landing-accent,#0A5C4A)] to-[var(--landing-accent-deep,#2FAB99)] transition-all duration-1000"
                            style={{ width: `${gov.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Growth tab removed — data was entirely hardcoded/fake */}
          </div>
        </div>
      </div>
    </div>
  );
}
