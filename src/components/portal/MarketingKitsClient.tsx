"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import FormViews from "@/components/portal/FormViews";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { useToast } from "@/lib/ToastContext";
import {
  Search,
  Plus,
  Trash2,
  Archive,
  ArchiveRestore,
  Copy,
  Check,
  Megaphone,
  Sparkles,
  Layers,
  FileText,
  User,
  CreditCard,
  Phone,
  MapPin,
  Building,
  Building2,
  Users,
  Heart,
  GraduationCap,
  Activity,
  Flame,
  Banknote,
  TrendingDown,
  Scale,
  Gift,
  ClipboardList,
} from "lucide-react";

interface MarketingKitItem {
  id: number;
  title: string;
  contentAr: string;
  contentEn: string | null;
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export const DYNAMIC_BENEFICIARY_PLACEHOLDERS = [
  { key: "fullName", labelAr: "اسم المستفيد الرباعي", labelEn: "Full Name", icon: <User size={14} className="text-amber-600 dark:text-amber-400" /> },
  { key: "nationalId", labelAr: "رقم الهوية / الإقامة", labelEn: "National ID", icon: <CreditCard size={14} className="text-amber-600 dark:text-amber-400" /> },
  { key: "phone", labelAr: "رقم الهاتف", labelEn: "Phone", icon: <Phone size={14} className="text-amber-600 dark:text-amber-400" /> },
  { key: "address", labelAr: "العنوان والسكن", labelEn: "Address", icon: <MapPin size={14} className="text-amber-600 dark:text-amber-400" /> },
  { key: "governorate", labelAr: "المحافظة / المنطقة", labelEn: "Governorate", icon: <Building size={14} className="text-amber-600 dark:text-amber-400" /> },
  { key: "city", labelAr: "المدينة", labelEn: "City", icon: <Building2 size={14} className="text-amber-600 dark:text-amber-400" /> },
  { key: "totalFamilyMembers", labelAr: "عدد أفراد الأسرة", labelEn: "Family Members Count", icon: <Users size={14} className="text-amber-600 dark:text-amber-400" /> },
  { key: "maritalStatus", labelAr: "الحالة الاجتماعية", labelEn: "Marital Status", icon: <Heart size={14} className="text-amber-600 dark:text-amber-400" /> },
  { key: "educationLevel", labelAr: "المستوى التعليمي", labelEn: "Education Level", icon: <GraduationCap size={14} className="text-amber-600 dark:text-amber-400" /> },
  { key: "healthStatus", labelAr: "الحالة الصحية", labelEn: "Health Status", icon: <Activity size={14} className="text-amber-600 dark:text-amber-400" /> },
  { key: "caseClassification", labelAr: "تصنيف وأولوية الحالة", labelEn: "Priority Classification", icon: <Flame size={14} className="text-amber-600 dark:text-amber-400" /> },
  { key: "totalIncome", labelAr: "إجمالي دخل الأسرة", labelEn: "Total Income", icon: <Banknote size={14} className="text-amber-600 dark:text-amber-400" /> },
  { key: "totalExpenses", labelAr: "إجمالي المصاريف", labelEn: "Total Expenses", icon: <TrendingDown size={14} className="text-amber-600 dark:text-amber-400" /> },
  { key: "netIncome", labelAr: "صافي دخل الفرد", labelEn: "Net Income per Capita", icon: <Scale size={14} className="text-amber-600 dark:text-amber-400" /> },
  { key: "associationName", labelAr: "اسم الجمعية التابع لها", labelEn: "Association Name", icon: <Building size={14} className="text-amber-600 dark:text-amber-400" /> },
  { key: "donationPrograms", labelAr: "برامج وباقات التبرع", labelEn: "Donation Packages", icon: <Gift size={14} className="text-amber-600 dark:text-amber-400" /> },
  { key: "finalRecommendation", labelAr: "توصية الباحث الاجتماعي", labelEn: "Final Recommendation", icon: <ClipboardList size={14} className="text-amber-600 dark:text-amber-400" /> },
];

export default function MarketingKitsClient() {
  const tCommon = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || "ar";
  const isAr = locale === "ar";
  const { showToast } = useToast();

  const [kits, setKits] = useState<MarketingKitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form State
  const recordId = searchParams.get("id") ? Number(searchParams.get("id")) : null;
  const isNew = searchParams.get("new") === "true";
  const isEdit = searchParams.get("edit") === "true";

  const formMode = isNew ? "create" : isEdit ? "edit" : recordId ? "view" : null;

  const [title, setTitle] = useState("");
  const [contentAr, setContentAr] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState("");
  const [contentError, setContentError] = useState("");

  const fetchKits = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/marketing-kits?includeArchived=${showArchived}&search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setKits(data);
      }
    } catch (err) {
      console.error("Failed to fetch marketing kits:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKits();
  }, [search, showArchived]);

  useEffect(() => {
    if (recordId) {
      fetch(`/api/marketing-kits/${recordId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: MarketingKitItem | null) => {
          if (data) {
            setTitle(data.title || "");
            setContentAr(data.contentAr || "");
            setContentEn(data.contentEn || "");
            setIsActive(data.isActive);
            setTitleError("");
            setContentError("");
          }
        });
    } else if (isNew) {
      setTitle("");
      setContentAr("");
      setContentEn("");
      setIsActive(true);
      setTitleError("");
      setContentError("");
    }
  }, [recordId, isNew]);

  const handleSave = async () => {
    let hasError = false;
    if (!title.trim()) {
      setTitleError(isAr ? "الرجاء إدخال عنوان الحقيبة التسويقية" : "Kit title is required");
      hasError = true;
    } else {
      setTitleError("");
    }

    const currentContent = isAr ? contentAr : contentEn;
    if (!currentContent.trim()) {
      setContentError(isAr ? "يرجى إدخال محتوى الحقيبة التسويقية باللغة العربية" : "Please enter marketing kit content in English");
      hasError = true;
    } else {
      setContentError("");
    }

    if (hasError) return;

    setSaving(true);
    try {
      const payload = { title, contentAr, contentEn, isActive };
      let res;
      if (isNew) {
        res = await fetch("/api/marketing-kits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/marketing-kits/${recordId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const savedKit = await res.json();
        showToast(isAr ? "تم حفظ الحقيبة التسويقية بنجاح" : "Marketing Kit saved successfully", "success");
        if (savedKit?.id) {
          router.push(`/${locale}/portal/settings/marketing-kits?id=${savedKit.id}`);
        } else {
          router.push(`/${locale}/portal/settings/marketing-kits`);
        }
        fetchKits();
      } else {
        const err = await res.json();
        showToast(err.error || (isAr ? "فشل الحفظ" : "Failed to save"), "error");
      }
    } catch (err) {
      showToast(isAr ? "حدث خطأ غير متوقع" : "Unexpected error", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (id: number, currentArchivedStatus: boolean) => {
    try {
      const res = await fetch(`/api/marketing-kits/${id}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !currentArchivedStatus }),
      });
      if (res.ok) {
        showToast(
          currentArchivedStatus
            ? (isAr ? "تم إلغاء أرشفة الحقيبة التسويقية" : "Unarchived successfully")
            : (isAr ? "تم أرشفة الحقيبة التسويقية" : "Archived successfully"),
          "success"
        );
        fetchKits();
      }
    } catch {
      showToast(isAr ? "فشل تغيير حالة الأرشفة" : "Failed to change archive status", "error");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(isAr ? "هل أنت متأكد من حذف هذه الحقيبة التسويقية؟" : "Are you sure you want to delete this marketing kit?")) {
      return;
    }
    try {
      const res = await fetch(`/api/marketing-kits/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast(isAr ? "تم حذف الحقيبة التسويقية بنجاح" : "Deleted successfully", "success");
        router.push(`/${locale}/portal/settings/marketing-kits`);
        fetchKits();
      }
    } catch {
      showToast(isAr ? "فشل الحذف" : "Failed to delete", "error");
    }
  };

  const copyPlaceholder = (key: string) => {
    const ph = `{{${key}}}`;
    navigator.clipboard.writeText(ph);
    setCopiedKey(key);
    showToast(isAr ? `تم نسخ الرمز ${ph} بنجاح` : `Copied ${ph} successfully`, "success");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const appendPlaceholderToContent = (key: string) => {
    const ph = `{{${key}}}`;
    if (isAr) {
      setContentAr((prev) => prev + ` ${ph} `);
      setContentError("");
    } else {
      setContentEn((prev) => prev + ` ${ph} `);
      setContentError("");
    }
    showToast(isAr ? `تمت إضافة ${ph} لمحتوى الحملة` : `Added ${ph} to template content`, "info");
  };

  const selectedKit = kits.find((k) => k.id === recordId);
  const currentIndex = recordId ? kits.findIndex((k) => k.id === recordId) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < kits.length - 1;

  const navigatePrev = () => {
    if (hasPrev) {
      const prevId = kits[currentIndex - 1].id;
      router.push(`/${locale}/portal/settings/marketing-kits?id=${prevId}`);
    }
  };

  const navigateNext = () => {
    if (hasNext) {
      const nextId = kits[currentIndex + 1].id;
      router.push(`/${locale}/portal/settings/marketing-kits?id=${nextId}`);
    }
  };

  // Form View Rendering
  if (formMode) {
    const handleClose = () => router.push(`/${locale}/portal/settings/marketing-kits`);

    const activeContent = isAr ? contentAr : contentEn;

    return (
      <FormViews
        mode={formMode}
        screenName={isAr ? "الحقيبة التسويقية" : "Marketing Kit"}
        recordName={formMode === "create" ? (isAr ? "حقيبة تسويقية جديدة" : "New Marketing Kit") : selectedKit?.title || title}
        onSave={formMode !== "view" ? handleSave : undefined}
        onCancel={handleClose}
        onClose={handleClose}
        locale={locale}
        recordIndex={currentIndex >= 0 ? currentIndex + 1 : undefined}
        totalRecords={kits.length}
        onNavigatePrev={navigatePrev}
        onNavigateNext={navigateNext}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onAdd={() => router.push(`/${locale}/portal/settings/marketing-kits?new=true`)}
        onEdit={formMode === "view" ? () => router.push(`/${locale}/portal/settings/marketing-kits?id=${recordId}&edit=true`) : undefined}
        onDelete={formMode !== "create" && recordId ? () => handleDelete(recordId) : undefined}
      >
        <div className="space-y-6">
          {/* Main Info Card */}
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Megaphone size={20} className="text-primary dark:text-tertiary" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? "معلومات الحقيبة التسويقية" : "Marketing Kit Information"}
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <span>{isAr ? "عنوان الحقيبة التسويقية" : "Kit Title"}</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={formMode === "view"}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (e.target.value.trim()) setTitleError("");
                }}
                placeholder={isAr ? "مثال: حملة كفالة أسر الأيتام وسداد الفواتير" : "e.g. Orphan Family Support Campaign"}
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white focus:outline-none transition-all disabled:opacity-60 ${
                  titleError
                    ? "border-red-500 dark:border-red-400 ring-2 ring-red-500/20 focus:ring-red-500"
                    : "border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary"
                }`}
              />
              {titleError && (
                <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                  {titleError}
                </p>
              )}
            </div>
          </div>

          {/* Dynamic Placeholders Picker Bar */}
          {formMode !== "view" && (
            <div className="bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                  <Sparkles size={16} />
                  <span>{isAr ? "الحقول والمتغيرات المتاحة للمستفيد (تستبدل تلقائياً):" : "Available Beneficiary Dynamic Fields (Auto-Replaced):"}</span>
                </div>
                <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-medium">
                  {isAr ? "انقر لإضافة المتغير إلى النص أو انسخ الرمز مباشرة" : "Click to add placeholder or copy tag"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {DYNAMIC_BENEFICIARY_PLACEHOLDERS.map((ph) => (
                  <div
                    key={ph.key}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-slate-800 dark:text-slate-200 shadow-sm hover:border-amber-400 transition-colors"
                  >
                    <span>{ph.icon}</span>
                    <button
                      type="button"
                      onClick={() => appendPlaceholderToContent(ph.key)}
                      className="font-semibold hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer"
                      title={isAr ? "إضافة للنص" : "Insert to content"}
                    >
                      {isAr ? ph.labelAr : ph.labelEn}
                    </button>
                    <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-amber-700 dark:text-amber-300 font-mono">
                      {`{{${ph.key}}}`}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyPlaceholder(ph.key)}
                      className="p-1 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                      title={isAr ? "نسخ الرمز" : "Copy tag"}
                    >
                      {copiedKey === ph.key ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rich Text Editor Section */}
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-primary dark:text-tertiary" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isAr ? "محتوى ونموذج الحملة (باللغة العربية) *" : "Campaign Template Content (in English) *"}
                </h3>
              </div>
            </div>

            {formMode === "view" ? (
              <div
                className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm border border-slate-200 dark:border-slate-800 leading-relaxed text-slate-800 dark:text-slate-200 min-h-[150px]"
                dangerouslySetInnerHTML={{ __html: activeContent || (isAr ? "لا يوجد محتوى" : "No content") }}
              />
            ) : (
              <div>
                <RichTextEditor
                  value={isAr ? contentAr : contentEn}
                  onChange={(val) => {
                    if (isAr) setContentAr(val);
                    else setContentEn(val);
                    if (val.trim()) setContentError("");
                  }}
                  isAr={isAr}
                  placeholder={isAr ? "اكتب محتوى الحقيبة التسويقية باللغة العربية هنا..." : "Write marketing kit content in English here..."}
                />
                {contentError && (
                  <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                    {contentError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </FormViews>
    );
  }

  // ListView Rendering
  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Megaphone className="text-primary dark:text-tertiary" size={22} />
            <span>{isAr ? "الحقيبة التسويقية" : "Marketing Kit"}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {isAr
              ? "إدارة قوالب الحملات التسويقية الجاهزة مع إمكانية الدمج الفوري لبيانات المستفيدين"
              : "Manage marketing campaign templates with beneficiary dynamic placeholders"}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
              showArchived
                ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Archive size={15} />
            <span>{showArchived ? (isAr ? "إخفاء المؤرشفة" : "Hide Archived") : (isAr ? "عرض المؤرشفة" : "Show Archived")}</span>
          </button>

          <button
            type="button"
            onClick={() => router.push(`/${locale}/portal/settings/marketing-kits?new=true`)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-primary dark:bg-tertiary text-white rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-md shadow-primary/20"
          >
            <Plus size={16} />
            <span>{isAr ? "إضافة حقيبة تسويقية" : "Add Marketing Kit"}</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
        <Search size={18} className="text-slate-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isAr ? "ابحث عن حقيبة تسويقية بالاسم أو المحتوى..." : "Search marketing kits by title or content..."}
          className="w-full bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
        />
      </div>

      {/* Grid of Kits */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm font-medium">
          {isAr ? "جاري تحميل الحقائب التسويقية..." : "Loading marketing kits..."}
        </div>
      ) : kits.length === 0 ? (
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Layers size={40} className="mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {isAr ? "لا توجد حقائب تسويقية مضافة" : "No marketing kits found"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {isAr
              ? "قم بإضافة أول حقيبة تسويقية وتجهيز قوالب الحملات الإعلانية مع ربط حقول المستفيد الديناميكية"
              : "Create your first marketing kit template with beneficiary placeholders"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {kits.map((kit) => (
            <div
              key={kit.id}
              onClick={() => router.push(`/${locale}/portal/settings/marketing-kits?id=${kit.id}`)}
              className="group bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary dark:text-tertiary">
                    <Megaphone size={12} /> {isAr ? "حقيبة تسويقية" : "Marketing Kit"}
                  </span>
                  {kit.isArchived && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      {isAr ? "مؤرشفة" : "Archived"}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-tertiary transition-colors">
                  {kit.title}
                </h3>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                <span className="text-[11px] text-slate-400 font-medium">
                  {new Date(kit.createdAt).toLocaleDateString(isAr ? "ar-SA" : "en-US")}
                </span>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => handleArchive(kit.id, kit.isArchived)}
                    className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition-colors cursor-pointer"
                    title={kit.isArchived ? (isAr ? "إلغاء الأرشفة" : "Unarchive") : (isAr ? "أرشفة" : "Archive")}
                  >
                    {kit.isArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(kit.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                    title={isAr ? "حذف" : "Delete"}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
