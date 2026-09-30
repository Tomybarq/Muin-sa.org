"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users2,
  TrendingUp,
  Archive,
  CheckCircle2,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  RefreshCw,
  Filter,
  Briefcase,
  Home,
  HeartPulse,
  Users,
  CreditCard,
  UserCheck,
  Calendar,
  Layers,
  Sparkles,
  UserPlus,
  Compass,
  Award,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Flame,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import Select from "@/components/ui/Select";
import HighchartWrapper from "@/components/ui/HighchartWrapper";
import { encodeId } from "@/lib/idObfuscator";

interface FilterOptions {
  associations: { id: number; name: string }[];
}

interface RecentBeneficiary {
  id: number;
  fullName: string;
  nationalId: string;
  createdAt: string;
  association: { name: string };
}

interface TopMarketer {
  id: number;
  name: string;
  type: string;
  reportsCount: number;
}

interface DashboardStats {
  filterOptions: FilterOptions;
  associations: { total: number; active: number; archived: number };
  beneficiaries: {
    total: number;
    active: number;
    archived: number;
    avgFamilySize: string;
    priorities: { critical: number; high: number; normal: number };
  };
  marketers: { total: number; reportsCount: number };
  recentBeneficiaries: RecentBeneficiary[];
  topMarketers: TopMarketer[];
  charts: {
    categories: { name: string; count: number }[];
    governorates: { name: string; count: number }[];
    healthStatus: { name: string; count: number }[];
    maritalStatus: { name: string; count: number }[];
    housingType: { name: string; count: number }[];
    housingTenure: { name: string; count: number }[];
    educationLevel: { name: string; count: number }[];
    diseaseType: { name: string; count: number }[];
    disabilityType: { name: string; count: number }[];
    cityBreakdown: { name: string; count: number }[];
    topAssociations: { name: string; count: number }[];
    radarMetrics: { subject: string; value: number; fullMark: number }[];
  };
  financial: {
    totalIncomeSum: number;
    totalExpensesSum: number;
    totalRentSum: number;
    totalDebtSum: number;
    avgIncome: number;
    avgExpenses: number;
  };
}

const PALETTE = {
  primary: ["#0A5C4A", "#14B8A6", "#2FAB99", "#0D9488", "#047857"],
  secondary: ["#F9A826", "#F59E0B", "#D97706", "#B45309"],
  accent: ["#6366F1", "#8B5CF6", "#EC4899", "#3B82F6", "#06B6D4"],
  mix: ["#0A5C4A", "#F9A826", "#6366F1", "#EC4899", "#14B8A6", "#8B5CF6", "#F59E0B"],
};

import {
  EDUCATION_OPTIONS,
  HEALTH_OPTIONS,
  MARITAL_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  HOUSING_TENURE_OPTIONS,
} from "@/lib/beneficiaryOptions";

// Helper to look up official translation from beneficiaryOptions
const getOfficialLabel = (value: string, options: { value: string; label: string; labelEn: string }[], locale: string) => {
  const match = options.find((o) => o.value === value || o.label === value || o.labelEn === value);
  if (match) {
    return locale === "ar" ? match.label : match.labelEn;
  }
  return value;
};

import DatePicker from "@/components/ui/DatePicker";

export default function DashboardClient({
  userName,
  locale,
}: {
  userName: string;
  locale: string;
}) {
  const isAr = locale === "ar";
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedAssociation, setSelectedAssociation] = useState<string>("");
  const [timeRange, setTimeRange] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedAssociation) params.set("associationId", selectedAssociation);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (!startDate && !endDate && timeRange && timeRange !== "all") {
        params.set("timeRange", timeRange);
      }

      const res = await fetch(`/api/dashboard/stats?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedAssociation, timeRange, startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleResetFilters = () => {
    setSelectedAssociation("");
    setTimeRange("all");
    setStartDate("");
    setEndDate("");
  };

  // Helper for navigating to screens with active filter
  const navigateToScreen = (path: string, queryKey?: string, queryVal?: string) => {
    const url = new URL(window.location.origin + `/${locale}/portal/${path}`);
    if (queryKey && queryVal) {
      url.searchParams.set(queryKey, queryVal);
    }
    if (selectedAssociation) {
      url.searchParams.set("associationId", selectedAssociation);
    }
    router.push(url.pathname + url.search);
  };

  const translateKey = (key: string, category?: "education" | "health" | "marital" | "housingType" | "housingTenure") => {
    if (category === "education") return getOfficialLabel(key, EDUCATION_OPTIONS, locale);
    if (category === "health") return getOfficialLabel(key, HEALTH_OPTIONS, locale);
    if (category === "marital") return getOfficialLabel(key, MARITAL_OPTIONS, locale);
    if (category === "housingType") return getOfficialLabel(key, HOUSING_TYPE_OPTIONS, locale);
    if (category === "housingTenure") return getOfficialLabel(key, HOUSING_TENURE_OPTIONS, locale);

    // Fallback to checking all official option lists
    let label = getOfficialLabel(key, EDUCATION_OPTIONS, locale);
    if (label !== key) return label;
    label = getOfficialLabel(key, HEALTH_OPTIONS, locale);
    if (label !== key) return label;
    label = getOfficialLabel(key, MARITAL_OPTIONS, locale);
    if (label !== key) return label;
    label = getOfficialLabel(key, HOUSING_TYPE_OPTIONS, locale);
    if (label !== key) return label;
    label = getOfficialLabel(key, HOUSING_TENURE_OPTIONS, locale);
    return label;
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Dynamic Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary via-primary/95 to-tertiary rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-primary/10">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-tertiary/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs text-teal-100 font-medium mb-3">
              <Sparkles size={13} className="text-amber-300 animate-pulse" />
              <span>{isAr ? "لوحة الإحصائيات التفاعلية الشاملة" : "Comprehensive Interactive Analytics"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isAr ? `أهلاً وسهلاً بك، ${userName} 👋` : `Welcome back, ${userName} 👋`}
            </h1>
            <p className="text-teal-50/90 text-xs sm:text-sm max-w-2xl mt-1.5 leading-relaxed">
              {isAr
                ? "نظرة عامة متكاملة ومؤشرات تفاعلية (يمكنك النقر على البطاقات والرسوم للانتقال المباشر للسجلات)."
                : "Interactive operational dashboard (Click on cards and charts to navigate with active filters)."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchStats}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>{isAr ? "تحديث البيانات" : "Refresh"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Header Filter Bar with Date Range Pills */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 text-xs font-bold">
            <Filter size={16} className="text-primary dark:text-tertiary" />
            <span>{isAr ? "فلاتر التخصيص العلوية:" : "Dashboard Filters:"}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            {/* Association Filter */}
            <div className="w-full sm:w-56 shrink-0">
              <Select
                value={selectedAssociation}
                onChange={(val) => setSelectedAssociation(String(val))}
                options={[
                  { value: "", label: isAr ? "جميع الجمعيات الأهلية" : "All Associations" },
                  ...(stats?.filterOptions.associations.map((assoc) => ({
                    value: String(assoc.id),
                    label: assoc.name,
                  })) || []),
                ]}
                placeholder={isAr ? "اختر الجمعية الأهلية" : "Select Association"}
              />
            </div>

            {/* Time Range Pills Bar with Mobile Horizontal Scroll */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 overflow-x-auto max-w-full scrollbar-none touch-pan-x min-w-0 w-full sm:w-auto">
              <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1 shrink-0 whitespace-nowrap">
                <Calendar size={13} />
                {isAr ? "النطاق الزمني:" : "Time Range:"}
              </span>

              {[
                { id: "all", label: isAr ? "جميع الأوقات" : "All Time" },
                { id: "today", label: isAr ? "اليوم" : "Today" },
                { id: "week", label: isAr ? "آخر 7 أيام" : "Last 7 Days" },
                { id: "month", label: isAr ? "هذا الشهر" : "This Month" },
                { id: "custom", label: isAr ? "تاريخ مخصص" : "Custom Date" },
              ].map((pill) => {
                const isActive = timeRange === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => {
                      setTimeRange(pill.id);
                      const now = new Date();
                      const formatDateLocal = (d: Date) => {
                        const year = d.getFullYear();
                        const month = String(d.getMonth() + 1).padStart(2, "0");
                        const day = String(d.getDate()).padStart(2, "0");
                        return `${year}-${month}-${day}`;
                      };

                      if (pill.id === "all") {
                        setStartDate("");
                        setEndDate("");
                      } else if (pill.id === "today") {
                        const todayStr = formatDateLocal(now);
                        setStartDate(todayStr);
                        setEndDate(todayStr);
                      } else if (pill.id === "week") {
                        const sixDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
                        setStartDate(formatDateLocal(sixDaysAgo));
                        setEndDate(formatDateLocal(now));
                      } else if (pill.id === "month") {
                        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                        setStartDate(formatDateLocal(startOfMonth));
                        setEndDate(formatDateLocal(now));
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${isActive
                      ? "bg-primary text-white dark:bg-tertiary shadow-md shadow-primary/20 dark:shadow-tertiary/20 scale-105"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                      }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            {(selectedAssociation || timeRange !== "all" || startDate || endDate) && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold px-2 py-1 transition-colors cursor-pointer shrink-0 self-end sm:self-auto"
              >
                {isAr ? "إعادة ضبط" : "Reset Filters"}
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Range Pickers (Shows when range selected or active) */}
        {(timeRange === "custom") && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-end gap-3 animate-fadeIn">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? "تحديد النطاق المخصص:" : "Select Range:"}
            </span>
            <div className="w-44">
              <DatePicker
                value={startDate}
                onChange={(val) => {
                  setStartDate(val);
                  setTimeRange("custom");
                }}
                placeholder={isAr ? "من تاريخ" : "From Date"}
              />
            </div>
            <span className="text-slate-400 text-xs font-bold font-mono">-</span>
            <div className="w-44">
              <DatePicker
                value={endDate}
                onChange={(val) => {
                  setEndDate(val);
                  setTimeRange("custom");
                }}
                placeholder={isAr ? "إلى تاريخ" : "To Date"}
              />
            </div>
          </div>
        )}
      </div>

      {/* PRIORITY CARDS SECTION (أولوية الاحتياج والتدخل) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Flame size={18} className="text-rose-500 animate-pulse" />
          <h2 className="text-base font-black text-slate-900 dark:text-white">
            {isAr ? "تصنيف وتوزيع أولوية المستفيدين" : "Beneficiary Priority Breakdown Cards"}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Priority Top */}
          {(() => {
            const totalP = (stats?.beneficiaries.priorities.critical || 0) + (stats?.beneficiaries.priorities.high || 0) + (stats?.beneficiaries.priorities.normal || 0);
            const critPct = totalP > 0 ? ((stats?.beneficiaries.priorities.critical || 0) / totalP) * 100 : 0;
            const highPct = totalP > 0 ? ((stats?.beneficiaries.priorities.high || 0) / totalP) * 100 : 0;
            const normPct = totalP > 0 ? ((stats?.beneficiaries.priorities.normal || 0) / totalP) * 100 : 0;

            return (
              <>
                <div
                  onClick={() => navigateToScreen("beneficiaries", "priority", "top-priority")}
                  className="group bg-gradient-to-br from-orange-50 to-amber-100/70 dark:from-amber-950/50 dark:to-slate-900 border border-orange-200 dark:border-orange-900/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white mb-2">
                        <Flame size={10} /> {isAr ? "أولوية قصوى" : "Top Priority"}
                      </span>
                      <h3 className="text-3xl font-black text-orange-700 dark:text-orange-400 group-hover:scale-105 transition-transform origin-right">
                        {stats?.beneficiaries.priorities.critical ?? 0}
                      </h3>
                    </div>
                    {/* Circular Progress Ring */}
                    <div className="relative flex items-center justify-center h-14 w-14 shrink-0">
                      <svg className="circular-progress h-14 w-14 transform -rotate-90">
                        <circle className="text-orange-100 dark:text-orange-950/60" strokeWidth="4" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
                        <circle className="text-orange-500 transition-all duration-1000" strokeWidth="4" strokeDasharray={2 * Math.PI * 22} strokeDashoffset={2 * Math.PI * 22 * (1 - critPct / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
                      </svg>
                      <AlertTriangle className="absolute text-orange-600 dark:text-orange-400 h-5 w-5 group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                  <p className="text-[11px] text-orange-600/90 dark:text-orange-400/90 mt-3 font-medium flex items-center justify-between">
                    <span>{isAr ? "حالات حرجة تتطلب التدخل الفوري" : "Requires immediate assistance"}</span>
                    <ExternalLink size={12} />
                  </p>
                </div>

                {/* Priority Medium */}
                <div
                  onClick={() => navigateToScreen("beneficiaries", "priority", "medium-priority")}
                  className="group bg-gradient-to-br from-amber-50 to-yellow-100/60 dark:from-yellow-950/40 dark:to-slate-900 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white mb-2">
                        <Sparkles size={10} /> {isAr ? "أولوية متوسطة" : "Moderate Priority"}
                      </span>
                      <h3 className="text-3xl font-black text-amber-700 dark:text-amber-400 group-hover:scale-105 transition-transform origin-right">
                        {stats?.beneficiaries.priorities.high ?? 0}
                      </h3>
                    </div>
                    {/* Circular Progress Ring */}
                    <div className="relative flex items-center justify-center h-14 w-14 shrink-0">
                      <svg className="circular-progress h-14 w-14 transform -rotate-90">
                        <circle className="text-amber-100 dark:text-amber-950/60" strokeWidth="4" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
                        <circle className="text-amber-500 transition-all duration-1000" strokeWidth="4" strokeDasharray={2 * Math.PI * 22} strokeDashoffset={2 * Math.PI * 22 * (1 - highPct / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
                      </svg>
                      <Flame className="absolute text-amber-600 dark:text-amber-400 h-5 w-5 group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                  <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-3 font-medium flex items-center justify-between">
                    <span>{isAr ? "أسر ذات دخل محدود وسكن إيجار" : "Limited income families"}</span>
                    <ExternalLink size={12} />
                  </p>
                </div>

                {/* Priority Not Eligible / Normal */}
                <div
                  onClick={() => navigateToScreen("beneficiaries", "priority", "not-eligible")}
                  className="group bg-gradient-to-br from-indigo-50 to-blue-100/70 dark:from-indigo-950/50 dark:to-slate-900 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white mb-2">
                        <CheckCircle size={10} /> {isAr ? "غير مستحقة" : "Not Eligible"}
                      </span>
                      <h3 className="text-3xl font-black text-indigo-700 dark:text-indigo-400 group-hover:scale-105 transition-transform origin-right">
                        {stats?.beneficiaries.priorities.normal ?? 0}
                      </h3>
                    </div>
                    {/* Circular Progress Ring */}
                    <div className="relative flex items-center justify-center h-14 w-14 shrink-0">
                      <svg className="circular-progress h-14 w-14 transform -rotate-90">
                        <circle className="text-indigo-100 dark:text-indigo-950/60" strokeWidth="4" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
                        <circle className="text-indigo-500 transition-all duration-1000" strokeWidth="4" strokeDasharray={2 * Math.PI * 22} strokeDashoffset={2 * Math.PI * 22 * (1 - normPct / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
                      </svg>
                      <CheckCircle2 className="absolute text-indigo-600 dark:text-indigo-400 h-5 w-5 group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                  <p className="text-[11px] text-indigo-600/90 dark:text-indigo-400/90 mt-3 font-medium flex items-center justify-between">
                    <span>{isAr ? "حالات مستقرة ومستوفية للشروط" : "Stable beneficiary cases"}</span>
                    <ExternalLink size={12} />
                  </p>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* KPI Cards Grid - Interactive Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Beneficiaries Card */}
        <div
          onClick={() => navigateToScreen("beneficiaries")}
          className="group bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {isAr ? "إجمالي المستفيدين" : "Total Beneficiaries"}
              </p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1 group-hover:scale-105 transition-transform origin-right">
                {stats?.beneficiaries.total ?? "-"}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:rotate-6 transition-transform">
              <Users2 size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
              <CheckCircle2 size={12} />
              {isAr ? `نشط: ${stats?.beneficiaries.active ?? 0}` : `Active: ${stats?.beneficiaries.active ?? 0}`}
            </span>
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Users size={12} />
              {isAr ? `م. الأسرة: ${stats?.beneficiaries.avgFamilySize || 1}` : `Avg Family: ${stats?.beneficiaries.avgFamilySize || 1}`}
            </span>
          </div>
        </div>

        {/* Total Income Sum Card */}
        <div
          onClick={() => navigateToScreen("beneficiaries")}
          className="group bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {isAr ? "إجمالي دخل المستفيدين" : "Total Beneficiaries Income"}
              </p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 group-hover:scale-105 transition-transform origin-right">
                {(stats?.financial.totalIncomeSum ?? 0).toLocaleString()}{" "}
                <span className="text-xs font-normal text-slate-400">ر.س</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:rotate-6 transition-transform">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>{isAr ? "متوسط الدخل الشهري:" : "Avg Monthly Income:"}</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {(stats?.financial.avgIncome ?? 0).toLocaleString()} ر.س
            </span>
          </div>
        </div>

        {/* Total Associations Card */}
        <div
          onClick={() => navigateToScreen("associations")}
          className="group bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {isAr ? "إجمالي الجمعيات الأهلية" : "Total Associations"}
              </p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1 group-hover:scale-105 transition-transform origin-right">
                {stats?.associations.total ?? "-"}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:rotate-6 transition-transform">
              <Building2 size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
              <CheckCircle2 size={12} />
              {isAr ? `نشطة: ${stats?.associations.active ?? 0}` : `Active: ${stats?.associations.active ?? 0}`}
            </span>
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Archive size={12} />
              {isAr ? `مؤرشفة: ${stats?.associations.archived ?? 0}` : `Archived: ${stats?.associations.archived ?? 0}`}
            </span>
          </div>
        </div>

        {/* Marketers & Reports Card */}
        <div
          onClick={() => navigateToScreen("marketers")}
          className="group bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {isAr ? "إجمالي المسوقين والشركاء" : "Marketers & Partners"}
              </p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1 group-hover:scale-105 transition-transform origin-right">
                {stats?.marketers.total ?? "-"}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:rotate-6 transition-transform">
              <Briefcase size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>{isAr ? "التقارير الشهرية:" : "Monthly Reports:"}</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">
              {stats?.marketers.reportsCount ?? 0} {isAr ? "تقرير" : "reports"}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 3: Priority Summary Widget & Recent 5 Beneficiaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Priority Summary Donut & Guide Card (Match Reference UI) */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {isAr ? "ملخص توزيع الأولوية" : "Priority Distribution Summary"}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  {isAr ? "نسبة توزيع الحالات حسب مستويات التدخل" : "Percentage distribution by priority levels"}
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <PieIcon size={18} />
              </div>
            </div>

            {/* Highcharts Semi-Donut / Donut for Priority Summary */}
            <div className="h-44 w-full my-2 relative">
              {loading || !stats ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">{isAr ? "جاري التحميل..." : "Loading..."}</div>
              ) : (
                <HighchartWrapper
                  options={{
                    chart: { type: "pie", backgroundColor: "transparent" },
                    title: {
                      text: `<b>${stats.beneficiaries.total}</b><br/><span style="font-size:10px;color:#94A3B8">${isAr ? "إجمالي الحالات" : "Total Cases"}</span>`,
                      align: "center",
                      verticalAlign: "middle",
                      y: 10,
                      style: { color: "#FFF", fontSize: "18px", fontWeight: "bold" },
                    },
                    credits: { enabled: false },
                    tooltip: {
                      backgroundColor: "#0F172A",
                      borderColor: "#334155",
                      borderRadius: 12,
                      style: { color: "#FFF", fontSize: "12px" },
                      pointFormat: "<b>{point.y}</b> حالة ({point.percentage:.1f}%)",
                    },
                    plotOptions: {
                      pie: {
                        innerSize: "72%",
                        borderWidth: 0,
                        cursor: "pointer",
                        dataLabels: { enabled: false },
                        showInLegend: false,
                        point: {
                          events: {
                            click: function () {
                              navigateToScreen("beneficiaries", "priority", String((this as any).options?.id || ""));
                            },
                          },
                        },
                      },
                    },
                    series: [
                      {
                        name: isAr ? "الحالات" : "Cases",
                        type: "pie",
                        data: [
                          { id: "top-priority", name: isAr ? "أولوية قصوى" : "Top Priority", y: stats.beneficiaries.priorities.critical || 0, color: "#F97316" },
                          { id: "medium-priority", name: isAr ? "أولوية متوسطة" : "Moderate Priority", y: stats.beneficiaries.priorities.high || 0, color: "#F59E0B" },
                          { id: "not-eligible", name: isAr ? "غير مستحقة" : "Not Eligible", y: stats.beneficiaries.priorities.normal || 0, color: "#6366F1" },
                        ],
                      },
                    ],
                  }}
                />
              )}
            </div>

            {/* Legend Indicators */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? "أولوية قصوى" : "Top Priority"} ({stats ? (stats.beneficiaries.total > 0 ? (((stats.beneficiaries.priorities.critical || 0) / stats.beneficiaries.total) * 100).toFixed(0) : 0) : 0}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? "متوسطة" : "Moderate"} ({stats ? (stats.beneficiaries.total > 0 ? (((stats.beneficiaries.priorities.high || 0) / stats.beneficiaries.total) * 100).toFixed(0) : 0) : 0}%)
                </span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? "غير مستحقة / مستقرة" : "Not Eligible"} ({stats ? (stats.beneficiaries.total > 0 ? (((stats.beneficiaries.priorities.normal || 0) / stats.beneficiaries.total) * 100).toFixed(0) : 0) : 0}%)
                </span>
              </div>
            </div>
          </div>

          {/* Guide Banner matching reference UI */}
          <div className="bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-3.5 space-y-1">
            <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Sparkles size={12} />
              {isAr ? "دليل توجيه الدعم والحالات:" : "Case Routing Guide:"}
            </span>
            <p className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 leading-relaxed font-medium">
              {isAr
                ? "يُفضل تركيز توزيع المساعدات والسلال الغذائية المباشرة على الأسر ذات الأولوية القصوى، وتوجيه أصحاب الدخل المتوسط لبرامج التمكين المهني."
                : "Prioritize direct aid to Top Priority cases, while directing moderate cases to empowerment programs."}
            </p>
          </div>
        </div>

        {/* Recent 5 Beneficiaries List with Direct Click Navigation */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <UserPlus size={18} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? "أحدث 5 حالات مستفيدين تم إضافتهم" : "Recent 5 Beneficiaries Added"}
              </h3>
            </div>
            <button
              onClick={() => navigateToScreen("beneficiaries")}
              className="text-xs text-blue-500 hover:text-blue-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              {isAr ? "عرض الكل" : "View All"} <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {loading || !stats ? (
              <div className="p-4 text-center text-slate-400 text-xs">{isAr ? "جاري التحميل..." : "Loading..."}</div>
            ) : !stats.recentBeneficiaries || stats.recentBeneficiaries.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs">{isAr ? "لا يوجد مستفيدين مضافين مؤخراً" : "No recent beneficiaries"}</div>
            ) : (
              stats.recentBeneficiaries.map((b) => (
                <div
                  key={b.id}
                  onClick={() => navigateToScreen("beneficiaries", "id", encodeId(b.id))}
                  className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-blue-500/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform">
                      {b.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {b.fullName}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{b.association?.name || "الجمعية العامة"}</p>
                    </div>
                  </div>
                  <div className="text-left rtl:text-right flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck size={10} />
                      {new Date(b.createdAt).toLocaleDateString(locale)}
                    </span>
                    <ExternalLink size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Active Marketers List with Direct Click Navigation */}
        <div className="lg:col-span-2 xl:col-span-1 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <Award size={18} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? "أكثر المسوقين والشركاء تفاعلاً" : "Top Active Marketers"}
              </h3>
            </div>
            <button
              onClick={() => navigateToScreen("marketers")}
              className="text-xs text-amber-500 hover:text-amber-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              {isAr ? "عرض الكل" : "View All"} <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {loading || !stats ? (
              <div className="p-4 text-center text-slate-400 text-xs">{isAr ? "جاري التحميل..." : "Loading..."}</div>
            ) : !stats.topMarketers || stats.topMarketers.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs">{isAr ? "لا يوجد مسوقين متاحين" : "No marketers available"}</div>
            ) : (
              stats.topMarketers.map((m, idx) => (
                <div
                  key={m.id}
                  onClick={() => navigateToScreen("marketers", "id", encodeId(m.id))}
                  className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-amber-500/50 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-extrabold text-xs group-hover:scale-110 transition-transform">
                      #{idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {m.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{m.type}</p>
                    </div>
                  </div>
                  <div className="text-left rtl:text-right flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                      {m.reportsCount} {isAr ? "تقرير شهري" : "reports"}
                    </span>
                    <ExternalLink size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: Deep Beneficiary Analytics (Unique Chart Types & Translated Values) */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            {isAr ? "تحليلات وإحصائيات المستفيدين التفصيلية" : "Comprehensive Beneficiary Insights"}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Beneficiaries Health Status (Custom List Cards with Percentage Bars) */}
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
                  <HeartPulse size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? "توزيع المستفيدين حسب الحالة الصحية" : "Health Status Breakdown"}
                </h3>
              </div>
            </div>

            <div className="h-64 flex flex-col justify-center space-y-3.5">
              {loading || !stats ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">{isAr ? "جاري التحميل..." : "Loading..."}</div>
              ) : stats.charts.healthStatus.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">{isAr ? "لا توجد بيانات" : "No data"}</div>
              ) : (
                stats.charts.healthStatus.map((h, idx) => {
                  const label = translateKey(h.name);
                  const total = stats.beneficiaries.total || 1;
                  const pct = Math.round((h.count / total) * 100);
                  const colors = ["bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-blue-500"];
                  const barColor = colors[idx % colors.length];

                  return (
                    <div
                      key={h.name}
                      onClick={() => navigateToScreen("beneficiaries", "healthStatus", label)}
                      className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-rose-500/40 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-700 dark:text-slate-200 group-hover:text-rose-500 transition-colors">
                          {label}
                        </span>
                        <span className="text-slate-900 dark:text-white">
                          {h.count} <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Beneficiaries Marital Status (Highcharts Column Chart) */}
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center">
                  <UserCheck size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? "توزيع المستفيدين حسب الحالة الاجتماعية" : "Marital Status Breakdown"}
                </h3>
              </div>
            </div>

            <div className="h-64 w-full">
              {loading || !stats ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">{isAr ? "جاري التحميل..." : "Loading..."}</div>
              ) : stats.charts.maritalStatus.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">{isAr ? "لا توجد بيانات" : "No data"}</div>
              ) : (
                <HighchartWrapper
                  options={{
                    chart: { type: "column", backgroundColor: "transparent" },
                    title: { text: undefined },
                    credits: { enabled: false },
                    xAxis: {
                      categories: stats.charts.maritalStatus.map((m) => translateKey(m.name)),
                      labels: { style: { color: "#94A3B8", fontSize: "11px", fontWeight: "bold" } },
                    },
                    yAxis: {
                      title: { text: undefined },
                      labels: { style: { color: "#94A3B8", fontSize: "10px" } },
                      gridLineColor: "#334155",
                      gridLineWidth: 0.5,
                    },
                    tooltip: {
                      backgroundColor: "#0F172A",
                      borderColor: "#334155",
                      borderRadius: 12,
                      style: { color: "#FFF", fontSize: "12px" },
                      formatter: function () {
                        return `<b>${this.x}</b>: ${this.y}`;
                      },
                    },
                    plotOptions: {
                      column: {
                        borderRadius: 6,
                        color: "#6366F1",
                        cursor: "pointer",
                        point: {
                          events: {
                            click: function () {
                              navigateToScreen("beneficiaries", "maritalStatus", String(this.category));
                            },
                          },
                        },
                      },
                    },
                    series: [
                      {
                        name: isAr ? "العدد" : "Count",
                        type: "column",
                        data: stats.charts.maritalStatus.map((m) => m.count),
                        showInLegend: false,
                      },
                    ],
                  }}
                />
              )}
            </div>
          </div>

          {/* Multidimensional Radar Chart (Highcharts Polar / SpiderWeb) */}
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-500 flex items-center justify-center">
                  <Compass size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? "مؤشر التوازن والاستقرار متعدد الأبعاد" : "Multidimensional Balance Radar"}
                </h3>
              </div>
            </div>

            <div className="h-64 w-full">
              {loading || !stats ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">{isAr ? "جاري التحميل..." : "Loading..."}</div>
              ) : (
                <HighchartWrapper
                  options={{
                    chart: { polar: true, type: "line", backgroundColor: "transparent" },
                    title: { text: undefined },
                    credits: { enabled: false },
                    pane: { size: "80%" },
                    xAxis: {
                      categories: stats.charts.radarMetrics.map((r) => r.subject),
                      tickmarkPlacement: "on",
                      lineWidth: 0,
                      labels: { style: { color: "#94A3B8", fontSize: "10px", fontWeight: "bold" } },
                    },
                    yAxis: {
                      gridLineInterpolation: "polygon",
                      lineWidth: 0,
                      min: 0,
                      max: 100,
                      labels: { style: { color: "#64748B", fontSize: "9px" } },
                    },
                    tooltip: {
                      backgroundColor: "#0F172A",
                      borderColor: "#334155",
                      borderRadius: 12,
                      style: { color: "#FFF", fontSize: "11px" },
                      shared: true,
                    },
                    series: [
                      {
                        name: isAr ? "المؤشر العام" : "Metric",
                        type: "area",
                        data: stats.charts.radarMetrics.map((r) => r.value),
                        color: "#14B8A6",
                        fillOpacity: 0.35,
                        showInLegend: false,
                      },
                    ],
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Financial Balance & Top Associations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Financial Highcharts Area Chart */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <CreditCard size={18} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? "مقارنة الدخل والمصروفات والالتزامات للأسر" : "Family Financial Balance Overview"}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
            <div>
              <p className="text-[11px] text-slate-400 font-medium">{isAr ? "إجمالي الدخل" : "Income"}</p>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {(stats?.financial.totalIncomeSum ?? 0).toLocaleString()} ر.س
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">{isAr ? "إجمالي المصروفات" : "Expenses"}</p>
              <p className="text-sm font-black text-rose-500 mt-0.5">
                {(stats?.financial.totalExpensesSum ?? 0).toLocaleString()} ر.س
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">{isAr ? "إجمالي الديون/الإيجار" : "Debt/Rent"}</p>
              <p className="text-sm font-black text-amber-500 mt-0.5">
                {((stats?.financial.totalDebtSum ?? 0) + (stats?.financial.totalRentSum ?? 0)).toLocaleString()} ر.س
              </p>
            </div>
          </div>

          <div className="h-56 w-full pt-2">
            {loading || !stats ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">{isAr ? "جاري التحميل..." : "Loading..."}</div>
            ) : (
              <HighchartWrapper
                options={{
                  chart: { type: "area", backgroundColor: "transparent" },
                  title: { text: undefined },
                  credits: { enabled: false },
                  xAxis: {
                    categories: [
                      isAr ? "الدخل" : "Income",
                      isAr ? "المصروفات" : "Expenses",
                      isAr ? "الإيجارات" : "Rent",
                      isAr ? "الديون" : "Debt",
                    ],
                    labels: { style: { color: "#94A3B8", fontSize: "11px", fontWeight: "bold" } },
                  },
                  yAxis: {
                    title: { text: undefined },
                    labels: { style: { color: "#94A3B8", fontSize: "10px" } },
                    gridLineColor: "#334155",
                    gridLineWidth: 0.5,
                  },
                  tooltip: {
                    backgroundColor: "#0F172A",
                    borderColor: "#334155",
                    borderRadius: 12,
                    style: { color: "#FFF", fontSize: "12px" },
                    formatter: function () {
                      return `<b>${this.x}</b>: ${Number(this.y).toLocaleString()} ر.س`;
                    },
                  },
                  series: [
                    {
                      name: isAr ? "المبلغ" : "Amount",
                      type: "area",
                      data: [
                        stats.financial.totalIncomeSum,
                        stats.financial.totalExpensesSum,
                        stats.financial.totalRentSum,
                        stats.financial.totalDebtSum,
                      ],
                      color: "#14B8A6",
                      fillOpacity: 0.25,
                      showInLegend: false,
                    },
                  ],
                }}
              />
            )}
          </div>
        </div>

        {/* Housing Tenure & Type (Highcharts Bar Chart with Click Filter) */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
                <Home size={18} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? "حيازة ونوع السكن للمستفيدين" : "Housing Tenure & Type"}
              </h3>
            </div>
          </div>

          <div className="h-64 w-full">
            {loading || !stats ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">{isAr ? "جاري التحميل..." : "Loading..."}</div>
            ) : stats.charts.housingType.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">{isAr ? "لا توجد بيانات" : "No data"}</div>
            ) : (
              <HighchartWrapper
                options={{
                  chart: { type: "column", backgroundColor: "transparent" },
                  title: { text: undefined },
                  credits: { enabled: false },
                  xAxis: {
                    categories: stats.charts.housingType.map((h) => translateKey(h.name)),
                    labels: { style: { color: "#94A3B8", fontSize: "11px", fontWeight: "bold" } },
                  },
                  yAxis: {
                    title: { text: undefined },
                    labels: { style: { color: "#94A3B8", fontSize: "10px" } },
                    gridLineColor: "#334155",
                    gridLineWidth: 0.5,
                  },
                  tooltip: {
                    backgroundColor: "#0F172A",
                    borderColor: "#334155",
                    borderRadius: 12,
                    style: { color: "#FFF", fontSize: "12px" },
                    formatter: function () {
                      return `<b>${this.x}</b>: ${this.y}`;
                    },
                  },
                  plotOptions: {
                    column: {
                      borderRadius: 6,
                      color: "#F59E0B",
                      cursor: "pointer",
                      point: {
                        events: {
                          click: function () {
                            navigateToScreen("beneficiaries", "housingType", String(this.category));
                          },
                        },
                      },
                    },
                  },
                  series: [
                    {
                      name: isAr ? "العدد" : "Count",
                      type: "column",
                      data: stats.charts.housingType.map((h) => h.count),
                      showInLegend: false,
                    },
                  ],
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: Geographic & Educational Analytics (NEW Highcharts Section) */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            {isAr ? "التوزيع الجغرافي والمستوى التعليمي للمستفيدين" : "Geographic & Education Breakdown"}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* City Distribution Donut Chart */}
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
                  <Building2 size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? "توزيع المستفيدين حسب المدن والمناطق" : "Beneficiaries City Distribution"}
                </h3>
              </div>
            </div>

            <div className="h-64 w-full">
              {loading || !stats ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">{isAr ? "جاري التحميل..." : "Loading..."}</div>
              ) : !stats.charts.cityBreakdown || stats.charts.cityBreakdown.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">{isAr ? "لا توجد بيانات" : "No data"}</div>
              ) : (
                <HighchartWrapper
                  options={{
                    chart: { type: "pie", backgroundColor: "transparent" },
                    title: { text: undefined },
                    credits: { enabled: false },
                    tooltip: {
                      backgroundColor: "#0F172A",
                      borderColor: "#334155",
                      borderRadius: 12,
                      style: { color: "#FFF", fontSize: "12px" },
                      pointFormat: "<b>{point.y}</b> مستفيد ({point.percentage:.1f}%)",
                    },
                    plotOptions: {
                      pie: {
                        innerSize: "60%",
                        borderWidth: 0,
                        cursor: "pointer",
                        dataLabels: {
                          enabled: true,
                          format: "<b>{point.name}</b>: {point.y}",
                          style: { color: "#94A3B8", fontSize: "11px", fontWeight: "bold" },
                        },
                      },
                    },
                    series: [
                      {
                        name: isAr ? "المستفيدين" : "Beneficiaries",
                        type: "pie",
                        data: stats.charts.cityBreakdown.map((c, idx) => ({
                          name: c.name,
                          y: c.count,
                          color: PALETTE.mix[idx % PALETTE.mix.length],
                        })),
                      },
                    ],
                  }}
                />
              )}
            </div>
          </div>

          {/* Education Level Column Chart */}
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-500 flex items-center justify-center">
                  <Award size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? "توزيع المستفيدين حسب المستوى التعليمي" : "Educational Level Breakdown"}
                </h3>
              </div>
            </div>

            <div className="h-64 w-full">
              {loading || !stats ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">{isAr ? "جاري التحميل..." : "Loading..."}</div>
              ) : !stats.charts.educationLevel || stats.charts.educationLevel.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">{isAr ? "لا توجد بيانات" : "No data"}</div>
              ) : (
                <HighchartWrapper
                  options={{
                    chart: { type: "column", backgroundColor: "transparent" },
                    title: { text: undefined },
                    credits: { enabled: false },
                    xAxis: {
                      categories: stats.charts.educationLevel.map((e) => translateKey(e.name, "education")),
                      labels: { style: { color: "#94A3B8", fontSize: "11px", fontWeight: "bold" } },
                    },
                    yAxis: {
                      title: { text: undefined },
                      labels: { style: { color: "#94A3B8", fontSize: "10px" } },
                      gridLineColor: "#334155",
                      gridLineWidth: 0.5,
                    },
                    tooltip: {
                      backgroundColor: "#0F172A",
                      borderColor: "#334155",
                      borderRadius: 12,
                      style: { color: "#FFF", fontSize: "12px" },
                      formatter: function () {
                        return `<b>${this.x}</b>: ${this.y}`;
                      },
                    },
                    plotOptions: {
                      column: {
                        borderRadius: 6,
                        color: "#8B5CF6",
                      },
                    },
                    series: [
                      {
                        name: isAr ? "العدد" : "Count",
                        type: "column",
                        data: stats.charts.educationLevel.map((e) => e.count),
                        showInLegend: false,
                      },
                    ],
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
