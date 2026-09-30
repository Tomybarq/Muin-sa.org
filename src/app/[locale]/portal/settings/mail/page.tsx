"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useToast } from "@/lib/ToastContext";
import { useAuth } from "@/lib/AuthContext";
import { Mail, History, Wifi, CheckCircle2, XCircle, Search, ChevronLeft, ChevronRight, Eye, AlertCircle, RefreshCw } from "lucide-react";
import Select from "@/components/ui/Select";

export default function MailSettingsPage() {
  const tCommon = useTranslations("common");
  const params = useParams();
  const { showToast } = useToast();
  const currentLocale = (params?.locale as string) || "ar";
  const isAr = currentLocale === "ar";
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"mail" | "logs">("mail");

  // Mail Smtp Settings state
  const [mailSmtp, setMailSmtp] = useState("");
  const [mailPort, setMailPort] = useState(587);
  const [mailSecure, setMailSecure] = useState(false);
  const [mailUser, setMailUser] = useState("");
  const [mailPassword, setMailPassword] = useState("");
  const [mailFromEmail, setMailFromEmail] = useState("");
  const [mailFromName, setMailFromName] = useState("");
  const [mailLoading, setMailLoading] = useState(false);
  const [mailSaving, setMailSaving] = useState(false);

  // Test Smtp state
  const [testEmailInput, setTestEmailInput] = useState("");
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Email Logs state
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logSearch, setLogSearch] = useState("");
  const [logStatusFilter, setLogStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedErrorLog, setSelectedErrorLog] = useState<any | null>(null);
  const pageSize = 10;

  // Fetch Mail Settings
  const fetchMailSettings = useCallback(async () => {
    setMailLoading(true);
    try {
      const res = await fetch("/api/settings/mail");
      const data = await res.json();
      if (data.setting) {
        setMailSmtp(data.setting.smtp || "");
        setMailPort(data.setting.port || 587);
        setMailSecure(!!data.setting.secure);
        setMailUser(data.setting.user || "");
        setMailPassword(data.setting.password || "");
        setMailFromEmail(data.setting.fromEmail || "");
        setMailFromName(data.setting.fromName || "");
      }
    } catch (err) {
      console.error("Failed to fetch mail settings:", err);
    } finally {
      setMailLoading(false);
    }
  }, []);

  // Fetch Email Logs
  const fetchEmailLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/settings/mail/logs");
      const data = await res.json();
      if (data.logs) {
        setEmailLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to fetch email logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "mail") {
      fetchMailSettings();
    } else if (activeTab === "logs") {
      fetchEmailLogs();
    }
  }, [activeTab, fetchMailSettings, fetchEmailLogs]);

  // Save Mail Settings
  const handleSaveMail = async (e: React.FormEvent) => {
    e.preventDefault();
    setMailSaving(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtp: mailSmtp,
          port: mailPort,
          secure: mailSecure,
          user: mailUser,
          password: mailPassword,
          fromEmail: mailFromEmail,
          fromName: mailFromName,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(isAr ? "تم حفظ إعدادات خادم البريد (Smtp) بنجاح" : "Mail settings saved successfully", "success");
      } else {
        showToast(data.error || (isAr ? "فشل حفظ إعدادات البريد" : "Failed to save mail settings"), "error");
      }
    } catch (err) {
      showToast(isAr ? "حدث خطأ أثناء الاتصال بالسيرفر" : "Server connection error", "error");
    } finally {
      setMailSaving(false);
    }
  };

  // Test Smtp Connection
  const handleTestMail = async () => {
    setTestingSmtp(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/mail/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEmail: testEmailInput || user?.email,
          smtp: mailSmtp,
          port: mailPort,
          secure: mailSecure,
          user: mailUser,
          password: mailPassword,
          fromEmail: mailFromEmail,
          fromName: mailFromName,
        }),
      });
      const data = await res.json();
      setTestResult({
        success: !!data.success,
        message: data.message || (data.success ? "اتصال Smtp ناجح" : "فشل اتصال Smtp"),
      });
      if (data.success) {
        showToast(isAr ? "نجح اتصال Smtp وتم إرسال الإيميل الفحصي" : "Smtp test successful", "success");
      } else {
        showToast(data.message || (isAr ? "فشل فحص اتصال Smtp" : "Smtp test failed"), "error");
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: isAr ? "حدث خطأ أثناء إجراء الفحص" : "Error testing connection",
      });
    } finally {
      setTestingSmtp(false);
    }
  };

  // Filter Email Logs
  const filteredLogs = emailLogs.filter((log) => {
    const matchesSearch =
      !logSearch ||
      log.toEmail?.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.subject?.toLowerCase().includes(logSearch.toLowerCase());
    const matchesStatus = logStatusFilter === "ALL" || log.status === logStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination Math
  const totalLogs = filteredLogs.length;
  const totalPages = Math.ceil(totalLogs / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-6 dir-rtl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
          {isAr ? "إعدادات البريد الإلكتروني" : "Email Server Settings"}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {isAr
            ? "تكوين إعدادات خادم البريد الصادر Smtp واستعراض سجل الرسائل الصادرة ونتائج الإرسال"
            : "Configure outgoing SMTP mail server and view sent email logs"}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab("mail")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === "mail"
              ? "border-primary text-primary dark:border-tertiary dark:text-tertiary"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Mail size={16} />
          <span>{isAr ? "خادم البريد (Smtp)" : "Outgoing Mail (SMTP)"}</span>
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === "logs"
              ? "border-primary text-primary dark:border-tertiary dark:text-tertiary"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <History size={16} />
          <span>{isAr ? "سجل البريد المرسل" : "Sent Email Logs"}</span>
        </button>
      </div>

      {/* Tab 1: Mail Smtp Settings */}
      {activeTab === "mail" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="text-primary dark:text-tertiary" size={20} />
                <span>{isAr ? "تكوين بيانات اتصال خادم (Smtp)" : "SMTP Configuration"}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isAr
                  ? "تكوين بيانات الاتصال بخادم Smtp لإرسال الإيميلات الترحيبية ورسائل استعادة كلمة المرور"
                  : "Configure SMTP parameters for invitation and password reset emails"}
              </p>
            </div>
          </div>

          {mailLoading ? (
            <p className="text-sm text-slate-500">{tCommon("loading")}</p>
          ) : (
            <form onSubmit={handleSaveMail} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? "عنوان خادم (Smtp)" : "SMTP Host"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={mailSmtp}
                    onChange={(e) => setMailSmtp(e.target.value)}
                    placeholder="smtp.example.com"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? "منفذ الخادم (Port)" : "Port"}
                  </label>
                  <input
                    type="number"
                    value={mailPort}
                    onChange={(e) => setMailPort(parseInt(e.target.value, 10) || 587)}
                    placeholder="587"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? "اسم المستخدم (Smtp User / Email)" : "SMTP User"}
                  </label>
                  <input
                    type="text"
                    value={mailUser}
                    onChange={(e) => setMailUser(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? "كلمة المرور (Smtp Password)" : "SMTP Password"}
                  </label>
                  <input
                    type="password"
                    value={mailPassword}
                    onChange={(e) => setMailPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? "بريد المرسل (From Email)" : "From Email"}
                  </label>
                  <input
                    type="email"
                    value={mailFromEmail}
                    onChange={(e) => setMailFromEmail(e.target.value)}
                    placeholder="no-reply@moeen-platform.com"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? "اسم المرسل (From Name)" : "From Name"}
                  </label>
                  <input
                    type="text"
                    value={mailFromName}
                    onChange={(e) => setMailFromName(e.target.value)}
                    placeholder="منصة معين الرقمية"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="mailSecure"
                  checked={mailSecure}
                  onChange={(e) => setMailSecure(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary cursor-pointer"
                />
                <label htmlFor="mailSecure" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  {isAr ? "استخدام اتصال مشفر (SSL / TLS Secure - Port 465)" : "Use SSL/TLS Secure Connection"}
                </label>
              </div>

              {testResult && (
                <div
                  className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200 ${
                    testResult.success
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {testResult.success ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> : <XCircle size={18} className="text-rose-500 shrink-0" />}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="email"
                    value={testEmailInput}
                    onChange={(e) => setTestEmailInput(e.target.value)}
                    placeholder={user?.email || "test@example.com"}
                    className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none w-48"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={handleTestMail}
                    disabled={testingSmtp || mailSaving}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Wifi size={14} className={testingSmtp ? "animate-pulse text-primary" : "text-slate-500"} />
                    <span>{testingSmtp ? (isAr ? "جاري الفحص..." : "Testing...") : (isAr ? "اختبار الاتصال بالخادم" : "Test Smtp Connection")}</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={mailSaving || testingSmtp}
                  className="bg-primary hover:bg-primary/90 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {mailSaving ? tCommon("loading") : (isAr ? "حفظ إعدادات خادم Smtp" : "Save Smtp Settings")}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tab 2: Email Logs */}
      {activeTab === "logs" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="text-primary dark:text-tertiary" size={20} />
                <span>{isAr ? "سجل البريد المرسل (Email Logs)" : "Sent Email Logs"}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isAr
                  ? "عرض كافة إيميلات الدعوة وإعادة تعيين كلمة المرور والإشعارات الصادرة مع نتائج الفحص والإرسال"
                  : "View all invitation and reset password emails dispatched with execution status"}
              </p>
            </div>

            <button
              type="button"
              onClick={fetchEmailLogs}
              disabled={loadingLogs}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={loadingLogs ? "animate-spin text-primary" : "text-slate-500"} />
              <span>{isAr ? "تحديث السجل" : "Refresh Logs"}</span>
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">{isAr ? "إجمالي الرسائل" : "Total Emails"}</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 block">{emailLogs.length}</span>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">{isAr ? "ناجحة" : "Successful"}</span>
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-300 mt-1 block">
                {emailLogs.filter((l) => l.status === "SUCCESS").length}
              </span>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-center">
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 block">{isAr ? "فاشلة" : "Failed"}</span>
              <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1 block">
                {emailLogs.filter((l) => l.status === "FAILED").length}
              </span>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 block">{isAr ? "وضع التجربة" : "Mock / Test"}</span>
              <span className="text-xl font-extrabold text-amber-600 dark:text-amber-300 mt-1 block">
                {emailLogs.filter((l) => l.status === "MOCK").length}
              </span>
            </div>
          </div>

          {/* Filter & Search Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => { setLogSearch(e.target.value); setCurrentPage(1); }}
                placeholder={isAr ? "بحث بالبريد أو الموضوع..." : "Search email or subject..."}
                className="w-full pr-9 pl-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Custom Platform Select Dropdown */}
            <div className="w-full sm:w-56">
              <Select
                value={logStatusFilter}
                onChange={(val) => { setLogStatusFilter(String(val)); setCurrentPage(1); }}
                options={[
                  { value: "ALL", label: isAr ? "جميع الحالات" : "All Statuses" },
                  { value: "SUCCESS", label: isAr ? "نجاح" : "Success" },
                  { value: "FAILED", label: isAr ? "فشل" : "Failed" },
                  { value: "MOCK", label: isAr ? "تجريبي" : "Mock" },
                ]}
                placeholder={isAr ? "جميع الحالات" : "All Statuses"}
              />
            </div>
          </div>

          {loadingLogs ? (
            <div className="text-center py-12 text-slate-500 text-xs">{tCommon("loading")}</div>
          ) : paginatedLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              {isAr ? "لا توجد سجلات بريد صادرة مطابقة للبحث" : "No email logs found"}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">{isAr ? "بريد المستلم" : "To Email"}</th>
                      <th className="p-3">{isAr ? "موضوع الرسالة" : "Subject"}</th>
                      <th className="p-3">{isAr ? "الحالة" : "Status"}</th>
                      <th className="p-3">{isAr ? "تاريخ الإرسال" : "Sent At"}</th>
                      <th className="p-3 text-center">{isAr ? "التفاصيل" : "Details"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {paginatedLogs.map((log, idx) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-semibold text-slate-400">{startIndex + idx + 1}</td>
                        <td className="p-3 font-medium text-slate-900 dark:text-white dir-ltr text-right">{log.toEmail}</td>
                        <td className="p-3 font-semibold">{log.subject}</td>
                        <td className="p-3">
                          {log.status === "SUCCESS" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 size={12} />
                              {isAr ? "نجح" : "SUCCESS"}
                            </span>
                          ) : log.status === "FAILED" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              <XCircle size={12} />
                              {isAr ? "فشل" : "FAILED"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <AlertCircle size={12} />
                              {isAr ? "تجريبي" : "MOCK"}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500 text-[11px]">
                          {new Date(log.createdAt).toLocaleString(isAr ? "ar-SA" : "en-US")}
                        </td>
                        <td className="p-3 text-center">
                          {log.error ? (
                            <button
                              onClick={() => setSelectedErrorLog(log)}
                              className="text-rose-500 hover:text-rose-600 font-bold underline text-[11px] cursor-pointer inline-flex items-center gap-1"
                            >
                              <Eye size={12} />
                              <span>{isAr ? "عرض الخطأ" : "View Error"}</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Standard Platform Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
                <div>
                  {isAr
                    ? `عرض ${startIndex + 1} - ${Math.min(startIndex + pageSize, totalLogs)} من إجمالي ${totalLogs} سجل`
                    : `Showing ${startIndex + 1} - ${Math.min(startIndex + pageSize, totalLogs)} of ${totalLogs} logs`}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>

                  <span className="px-3 py-1 font-bold text-slate-800 dark:text-white">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error View Modal */}
      {selectedErrorLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{isAr ? "تفاصيل خطأ الإرسال" : "Mail Error Details"}</span>
              </h3>
              <button
                onClick={() => setSelectedErrorLog(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="text-xs space-y-2">
              <div>
                <strong className="block text-slate-700 dark:text-slate-300">{isAr ? "المستلم:" : "To:"}</strong>
                <span className="dir-ltr inline-block text-slate-500">{selectedErrorLog.toEmail}</span>
              </div>
              <div>
                <strong className="block text-slate-700 dark:text-slate-300">{isAr ? "نص الخطأ:" : "Error Message:"}</strong>
                <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-rose-600 dark:text-rose-300 text-[11px] whitespace-pre-wrap mt-1 max-h-48 overflow-y-auto">
                  {selectedErrorLog.error}
                </pre>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedErrorLog(null)}
                className="bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
              >
                {isAr ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
