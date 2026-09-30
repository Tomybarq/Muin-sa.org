"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  History,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Search,
  Eye,
  X,
  Building2,
  Users2,
  TrendingUp,
  Lock,
  Settings as SettingsIcon,
  Download,
  Copy,
  Check,
  Layers,
  FileText,
  Calendar,
  AlertTriangle,
  Activity,
  SlidersHorizontal,
  RotateCcw
} from "lucide-react";
import { useToast } from "@/lib/ToastContext";
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";

interface AuditLogItem {
  id: number;
  userId: number | null;
  user?: { id: number; name: string; email: string } | null;
  action: string;
  screen: string;
  recordId: number | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

interface AuditStats {
  todayLogs: number;
  todayLogins: number;
  todayCritical: number;
}

const keyTranslationMap: Record<string, { ar: string; en: string }> = {
  fullName: { ar: "الاسم الكامل", en: "Full Name" },
  name: { ar: "الاسم / العنوان", en: "Name / Title" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  role: { ar: "الدور الوظيفي", en: "Role" },
  phone: { ar: "رقم الجوال", en: "Phone" },
  isArchived: { ar: "حالة الأرشفة", en: "Archived State" },
  isActive: { ar: "حالة التفعيل", en: "Active State" },
  nationalId: { ar: "رقم الهوية", en: "National ID" },
  manager: { ar: "المدير المسؤول", en: "Manager" },
  categoryId: { ar: "التصنيف", en: "Category ID" },
  cityId: { ar: "المدينة", en: "City ID" },
};

type DatePreset = "all" | "today" | "week" | "month" | "custom";

export default function AuditLogsPage() {
  const t = useTranslations("common");
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const isAr = locale === "ar";
  const { showToast } = useToast();

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [stats, setStats] = useState<AuditStats>({ todayLogs: 0, todayLogins: 0, todayCritical: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [screenFilter, setScreenFilter] = useState("all");

  // Date Filters
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination & Page Size
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Inspection Drawer State
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [copied, setCopied] = useState(false);

  const actionOptions = [
    { value: "all", label: isAr ? "جميع العمليات" : "All Actions" },
    { value: "LOGIN", label: isAr ? "تسجيل الدخول" : "Login" },
    { value: "LOGOUT", label: isAr ? "تسجيل الخروج" : "Logout" },
    { value: "CREATE", label: isAr ? "إنشاء سجل" : "Create" },
    { value: "UPDATE", label: isAr ? "تعديل سجل" : "Update" },
    { value: "ARCHIVE", label: isAr ? "أرشفة" : "Archive" },
    { value: "UNARCHIVE", label: isAr ? "إلغاء أرشفة" : "Unarchive" },
    { value: "DELETE", label: isAr ? "حذف" : "Delete" },
  ];

  const screenOptions = [
    { value: "all", label: isAr ? "جميع الشاشات" : "All Screens" },
    { value: "auth", label: isAr ? "تسجيل الدخول" : "Auth" },
    { value: "associations", label: isAr ? "الجمعيات" : "Associations" },
    { value: "beneficiaries", label: isAr ? "المستفيدين" : "Beneficiaries" },
    { value: "marketers", label: isAr ? "المسوقين" : "Marketers" },
    { value: "settings", label: isAr ? "الإعدادات" : "Settings" },
  ];

  const limitOptions = [
    { value: 15, label: isAr ? "15 سجل لكل صفحة" : "15 per page" },
    { value: 30, label: isAr ? "30 سجل لكل صفحة" : "30 per page" },
    { value: 50, label: isAr ? "50 سجل لكل صفحة" : "50 per page" },
    { value: 100, label: isAr ? "100 سجل لكل صفحة" : "100 per page" },
  ];

  const formatDateLocal = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper for setting date preset ranges
  const applyDatePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    setPage(1);
    const now = new Date();

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      const todayStr = formatDateLocal(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "week") {
      // Subtract 6 days to include today as the 7th day (e.g., July 18 to July 24 = 7 days)
      const sixDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      setStartDate(formatDateLocal(sixDaysAgo));
      setEndDate(formatDateLocal(now));
    } else if (preset === "month") {
      // Start from day 1 of current month in local timezone (e.g., July 1st)
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(formatDateLocal(startOfMonth));
      setEndDate(formatDateLocal(now));
    }
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (actionFilter !== "all") queryParams.set("action", actionFilter);
      if (screenFilter !== "all") queryParams.set("screen", screenFilter);
      if (searchQuery.trim()) queryParams.set("search", searchQuery.trim());
      if (startDate) queryParams.set("startDate", startDate);
      if (endDate) queryParams.set("endDate", endDate);

      const res = await fetch(`/api/audit-logs?${queryParams.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, actionFilter, screenFilter, searchQuery, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [page, limit, actionFilter, screenFilter, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setActionFilter("all");
    setScreenFilter("all");
    setDatePreset("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const getActionBadge = (action: string) => {
    switch (action.toUpperCase()) {
      case "LOGIN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {isAr ? "تسجيل دخول" : "Login"}
          </span>
        );
      case "LOGOUT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {isAr ? "تسجيل خروج" : "Logout"}
          </span>
        );
      case "CREATE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {isAr ? "إنشاء" : "Create"}
          </span>
        );
      case "UPDATE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {isAr ? "تعديل" : "Update"}
          </span>
        );
      case "ARCHIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            {isAr ? "أرشفة" : "Archive"}
          </span>
        );
      case "UNARCHIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            {isAr ? "إلغاء أرشفة" : "Unarchive"}
          </span>
        );
      case "DELETE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {isAr ? "حذف" : "Delete"}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {action}
          </span>
        );
    }
  };

  const getScreenBadge = (screen: string) => {
    switch (screen.toLowerCase()) {
      case "auth":
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <Lock size={13} className="text-slate-400" />
            <span>{isAr ? "تسجيل الدخول" : "Auth"}</span>
          </span>
        );
      case "associations":
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <Building2 size={13} className="text-amber-500" />
            <span>{isAr ? "الجمعيات" : "Associations"}</span>
          </span>
        );
      case "beneficiaries":
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <Users2 size={13} className="text-emerald-500" />
            <span>{isAr ? "المستفيدين" : "Beneficiaries"}</span>
          </span>
        );
      case "marketers":
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <TrendingUp size={13} className="text-blue-500" />
            <span>{isAr ? "المسوقين" : "Marketers"}</span>
          </span>
        );
      case "settings":
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <SettingsIcon size={13} className="text-indigo-500" />
            <span>{isAr ? "إعدادات المنصة" : "Settings"}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <Layers size={13} className="text-slate-400" />
            <span>{screen}</span>
          </span>
        );
    }
  };

  const extractSubject = (log: AuditLogItem) => {
    if (log.screen === "auth" || log.action === "LOGIN" || log.action === "LOGOUT") {
      return isAr ? "جلسة مستخدم" : "User Session";
    }
    if (!log.details) {
      return log.recordId ? `#${log.recordId}` : "-";
    }
    try {
      const parsed = JSON.parse(log.details);
      const name = parsed.name || parsed.fullName || parsed.title;
      if (name) return String(name);
      if (log.recordId) return `#${log.recordId}`;
    } catch {}
    return log.recordId ? `#${log.recordId}` : "-";
  };

  const handleCopyDetails = (detailsStr: string | null) => {
    if (!detailsStr) return;
    try {
      const parsed = JSON.parse(detailsStr);
      navigator.clipboard.writeText(JSON.stringify(parsed, null, 2));
      setCopied(true);
      showToast(isAr ? "تم نسخ التفاصيل بنجاح" : "Details copied successfully", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      navigator.clipboard.writeText(detailsStr);
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) {
      showToast(isAr ? "لا توجد سجلات للتصدير" : "No logs to export", "error");
      return;
    }
    const headers = [
      isAr ? "المعرف" : "ID",
      isAr ? "التاريخ والوقت" : "Timestamp",
      isAr ? "المستخدم" : "User",
      isAr ? "نوع العملية" : "Action",
      isAr ? "الشاشة" : "Screen",
      isAr ? "السجل المتأثر" : "Subject",
      isAr ? "التفاصيل" : "Details"
    ];
    const rows = logs.map((l) => [
      l.id,
      new Date(l.createdAt).toLocaleString(isAr ? "ar-SA" : "en-US"),
      l.user ? l.user.name || l.user.email : "-",
      l.action,
      l.screen,
      extractSubject(l),
      l.details || "-",
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(isAr ? "تم تصدير سجل الأنشطة بنجاح" : "Audit logs exported successfully", "success");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <ShieldCheck className="text-primary dark:text-tertiary" size={22} />
            <span>{isAr ? "سجل الأنشطة والتدقيق" : "Audit Logs"}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAr
              ? "متابعة دقيقة ومستمرة لجميع عمليات الأرشفة، الإنشاء والتعديل والتسجيل في المنصة."
              : "Track all data modifications, creations, archiving, and system logins across the platform."}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="hidden items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shadow-sm cursor-pointer"
          >
            <Download size={14} className="text-violet-500" />
            <span>{isAr ? "تصدير السجل" : "Export Logs"}</span>
          </button>
          <button
            onClick={fetchLogs}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>{isAr ? "تحديث" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Total Logs */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold">{isAr ? "أنشطة اليوم" : "Today's Activities"}</span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {stats.todayLogs}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Activity size={20} />
          </div>
        </div>

        {/* Today's Logins */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold">{isAr ? "تسجيلات الدخول اليوم" : "Logins Today"}</span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.todayLogins}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Lock size={20} />
          </div>
        </div>

        {/* Critical Actions (Delete/Archive) */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold">{isAr ? "العمليات الحساسة (حذف/أرشفة)" : "Critical Actions"}</span>
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              {stats.todayCritical}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
        </div>

        {/* Filtered Results Total */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold">{isAr ? "إجمالي نتائج البحث" : "Filtered Total"}</span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {total}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <FileText size={20} />
          </div>
        </div>
      </div>

      {/* Date Presets & Filter Bar */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
        {/* Quick Date Range Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none whitespace-nowrap -mx-1 px-1">
            <span className="text-xs font-semibold text-slate-500 me-2 flex items-center gap-1 shrink-0">
              <Calendar size={14} />
              <span>{isAr ? "النطاق الزمني:" : "Time Range:"}</span>
            </span>

            <button
              type="button"
              onClick={() => applyDatePreset("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                datePreset === "all"
                  ? "bg-primary text-white dark:bg-tertiary shadow-sm shadow-primary/20 scale-105"
                  : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {isAr ? "جميع الأوقات" : "All Time"}
            </button>

            <button
              type="button"
              onClick={() => applyDatePreset("today")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                datePreset === "today"
                  ? "bg-primary text-white dark:bg-tertiary shadow-sm shadow-primary/20 scale-105"
                  : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {isAr ? "اليوم" : "Today"}
            </button>

            <button
              type="button"
              onClick={() => applyDatePreset("week")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                datePreset === "week"
                  ? "bg-primary text-white dark:bg-tertiary shadow-sm shadow-primary/20 scale-105"
                  : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {isAr ? "آخر 7 أيام" : "Last 7 Days"}
            </button>

            <button
              type="button"
              onClick={() => applyDatePreset("month")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                datePreset === "month"
                  ? "bg-primary text-white dark:bg-tertiary shadow-sm shadow-primary/20 scale-105"
                  : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {isAr ? "هذا الشهر" : "This Month"}
            </button>

            <button
              type="button"
              onClick={() => setDatePreset("custom")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                datePreset === "custom"
                  ? "bg-primary text-white dark:bg-tertiary shadow-sm shadow-primary/20 scale-105"
                  : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {isAr ? "تاريخ مخصص" : "Custom Range"}
            </button>
          </div>

          {(actionFilter !== "all" || screenFilter !== "all" || searchQuery || startDate || endDate) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 sm:border-0 transition-all cursor-pointer shrink-0 w-full sm:w-auto"
            >
              <RotateCcw size={13} />
              <span>{isAr ? "إعادة ضبط الفلاتر" : "Reset Filters"}</span>
            </button>
          )}
        </div>

        {/* Custom Date Picker Inputs (Visible if custom selected) */}
        {datePreset === "custom" && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="w-full sm:w-56">
              <DatePicker
                value={startDate}
                onChange={(val) => {
                  setStartDate(val);
                  setPage(1);
                }}
                label={isAr ? "من تاريخ" : "From Date"}
                placeholder={isAr ? "اختر تاريخ البداية" : "Select start date"}
                locale={locale}
              />
            </div>

            <div className="w-full sm:w-56">
              <DatePicker
                value={endDate}
                onChange={(val) => {
                  setEndDate(val);
                  setPage(1);
                }}
                label={isAr ? "إلى تاريخ" : "To Date"}
                placeholder={isAr ? "اختر تاريخ النهاية" : "Select end date"}
                locale={locale}
              />
            </div>
          </div>
        )}

        {/* Search & Select Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-0">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? "ابحث بالاسم أو البريد أو تفاصيل السجل..." : "Search user, email or details..."}
              className="w-full ps-9 pe-3 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full sm:w-auto">
            {/* Custom Platform Select for Action Filter */}
            <div className="w-full sm:w-44">
              <Select
                value={actionFilter}
                onChange={(val) => {
                  setActionFilter(String(val));
                  setPage(1);
                }}
                options={actionOptions}
                placeholder={isAr ? "جميع العمليات" : "All Actions"}
              />
            </div>

            {/* Custom Platform Select for Screen Filter */}
            <div className="w-full sm:w-44">
              <Select
                value={screenFilter}
                onChange={(val) => {
                  setScreenFilter(String(val));
                  setPage(1);
                }}
                options={screenOptions}
                placeholder={isAr ? "جميع الشاشات" : "All Screens"}
              />
            </div>

            {/* Custom Select for Page Limit */}
            <div className="w-full sm:w-44">
              <Select
                value={limit}
                onChange={(val) => {
                  setLimit(Number(val));
                  setPage(1);
                }}
                options={limitOptions}
                placeholder={isAr ? "عدد السجلات" : "Items per page"}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Uncluttered Table */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">{t("loading")}</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <History size={36} className="mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              {isAr ? "لا توجد سجلات مطابقة للفلتر المحدد" : "No audit log entries found"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold tracking-wider">
                <tr>
                  <th className="p-4 text-start">{isAr ? "التاريخ والوقت" : "Date & Time"}</th>
                  <th className="p-4 text-start">{isAr ? "المستخدم" : "User"}</th>
                  <th className="p-4 text-start">{isAr ? "نوع العملية" : "Action"}</th>
                  <th className="p-4 text-start">{isAr ? "الشاشة / القسم" : "Screen"}</th>
                  <th className="p-4 text-start">{isAr ? "السجل المتأثر" : "Subject"}</th>
                  <th className="p-4 text-center">{isAr ? "المعاينة" : "Inspect"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {logs.map((log) => {
                  const subject = extractSubject(log);
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors cursor-pointer group"
                    >
                      {/* Date & Time */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {new Date(log.createdAt).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                          {new Date(log.createdAt).toLocaleTimeString(isAr ? "ar-SA" : "en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* User */}
                      <td className="p-4">
                        {log.user ? (
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary dark:text-tertiary flex items-center justify-center font-bold text-xs shrink-0">
                              {log.user.name?.charAt(0) || <User size={14} />}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white truncate">
                                {log.user.name || log.user.email}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">{log.user.email}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="p-4 whitespace-nowrap">{getActionBadge(log.action)}</td>

                      {/* Screen */}
                      <td className="p-4 whitespace-nowrap">{getScreenBadge(log.screen)}</td>

                      {/* Affected Subject */}
                      <td className="p-4">
                        <span className="font-bold text-slate-800 dark:text-slate-200 max-w-[180px] truncate block" title={subject}>
                          {subject}
                        </span>
                      </td>

                      {/* Action Button */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="p-1.5 text-slate-400 hover:text-primary dark:hover:text-tertiary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                          title={isAr ? "معاينة التغييرات بالكامل" : "Inspect full details"}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              {isAr ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                {isAr ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                {isAr ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Inspection Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setSelectedLog(null)}
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-md bg-white dark:bg-[#0F172A] border-s border-slate-200 dark:border-slate-800 shadow-2xl z-10 flex flex-col h-full animate-in slide-in-from-end duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center gap-2.5">
                <FileText className="text-primary dark:text-tertiary" size={20} />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? "تفاصيل نشاط السجل" : "Log Entry Details"}
                </h2>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Action & Date Header */}
              <div className="bg-slate-50 dark:bg-slate-900/70 rounded-xl p-4 border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">{isAr ? "نوع العملية" : "Action Type"}</span>
                  {getActionBadge(selectedLog.action)}
                </div>
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span className="text-slate-500 font-semibold">{isAr ? "التاريخ والوقت" : "Timestamp"}</span>
                  <div className="text-end">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(selectedLog.createdAt).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                      {new Date(selectedLog.createdAt).toLocaleTimeString(isAr ? "ar-SA" : "en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
                {selectedLog.ipAddress && (
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500 font-semibold">{isAr ? "عنوان IP" : "IP Address"}</span>
                    <span className="font-sans font-semibold text-slate-800 dark:text-slate-200 text-xs">{selectedLog.ipAddress}</span>
                  </div>
                )}
              </div>

              {/* User Card */}
              <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <User size={14} className="text-primary dark:text-tertiary" />
                  <span>{isAr ? "منفذ العملية" : "Performed By"}</span>
                </h3>
                {selectedLog.user ? (
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary dark:text-tertiary flex items-center justify-center font-bold text-sm">
                      {selectedLog.user.name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">{selectedLog.user.name || "-"}</div>
                      <div className="text-[11px] text-slate-400 font-sans">{selectedLog.user.email}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 italic text-[11px]">{isAr ? "مستخدم غائب أو محذوف" : "User unknown"}</div>
                )}
              </div>

              {/* Affected Target Entity Card */}
              <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers size={14} className="text-amber-500" />
                  <span>{isAr ? "الشاشة والسجل المتأثر" : "Module & Target Record"}</span>
                </h3>
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{isAr ? "القسم / الشاشة" : "Screen Module"}</span>
                    <div>{getScreenBadge(selectedLog.screen)}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{isAr ? "السجل المتأثر" : "Target Subject"}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{extractSubject(selectedLog)}</span>
                  </div>
                </div>
              </div>

              {/* Details & Changes Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText size={14} className="text-blue-500" />
                    <span>{isAr ? "تفاصيل وقيم السجل" : "Record Details Breakdown"}</span>
                  </h3>
                  {selectedLog.details && (
                    <button
                      onClick={() => handleCopyDetails(selectedLog.details)}
                      className="inline-flex items-center gap-1 text-[11px] text-primary dark:text-tertiary hover:underline font-semibold cursor-pointer"
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copied ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ التفاصيل" : "Copy")}</span>
                    </button>
                  )}
                </div>

                {!selectedLog.details ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl text-center text-slate-400 italic">
                    {isAr ? "لا توجد تفاصيل إضافية مسجلة" : "No additional details logged"}
                  </div>
                ) : (() => {
                  try {
                    const parsed = JSON.parse(selectedLog.details);
                    const entries = Object.entries(parsed);
                    if (entries.length === 0) return <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl text-center text-slate-400">{isAr ? "لا توجد تفاصيل" : "Empty details"}</div>;

                    return (
                      <div className="space-y-2">
                        {entries.map(([key, val]) => {
                          const label = keyTranslationMap[key] ? (isAr ? keyTranslationMap[key].ar : keyTranslationMap[key].en) : key;
                          let valueStr = String(val);
                          if (val === true) valueStr = isAr ? "نعم" : "True";
                          if (val === false) valueStr = isAr ? "لا" : "False";

                          return (
                            <div key={key} className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3">
                              <span className="text-slate-500 font-semibold text-[11px]">{label}</span>
                              <span className="font-sans text-slate-900 dark:text-white font-bold text-[11px] bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 max-w-[200px] truncate" title={valueStr}>
                                {valueStr}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  } catch {
                    return (
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl font-sans text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 break-all">
                        {selectedLog.details}
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
