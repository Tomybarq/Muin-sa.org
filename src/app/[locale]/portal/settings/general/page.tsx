"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useToast } from "@/lib/ToastContext";
import { useAuth } from "@/lib/AuthContext";
import { Paintbrush, Image, Eye } from "lucide-react";
import AttachmentField from "@/components/ui/AttachmentField";
import Select from "@/components/ui/Select";

export default function GeneralSettingsPage() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const params = useParams();
  const { showToast } = useToast();
  const currentLocale = (params?.locale as string) || "ar";
  const isAr = currentLocale === "ar";
  const { user } = useAuth();

  const [categories, setCategories] = useState<{ id: number; name: string; nameAr: string | null }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatNameAr, setNewCatNameAr] = useState("");
  const [submittingCat, setSubmittingCat] = useState(false);

  // Platform Settings state
  const [branding, setBranding] = useState({
    logoUrl: "",
    fontFamily: "Cairo",
    primaryColor: "#0A5C4A",
    secondaryColor: "#F9A826",
    tertiaryColor: "#2FAB99",
    siteName: "",
    siteNameAr: "",
    logoId: null as number | null,
    logo: null as any | null,
  });
  const [brandingLoading, setBrandingLoading] = useState(true);
  const [savingBranding, setSavingBranding] = useState(false);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch("/api/association-categories");
      const data = await res.json();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatNameAr.trim()) return;
    setSubmittingCat(true);
    try {
      const res = await fetch("/api/association-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim(), nameAr: newCatNameAr.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(t("categoryAdded"), "success");
        setNewCatName("");
        setNewCatNameAr("");
        fetchCategories();
      } else {
        showToast(data.error || "Failed to add category", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error adding category", "error");
    } finally {
      setSubmittingCat(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm(t("categoryDeleteConfirm"))) return;
    try {
      const res = await fetch(`/api/association-categories/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        showToast(t("categoryDeleted"), "success");
        fetchCategories();
      } else {
        showToast(data.error || t("categoryDeleteError"), "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error deleting category", "error");
    }
  };

  // Platform Settings API
  const fetchBranding = async () => {
    try {
      const res = await fetch("/api/settings/system");
      const data = await res.json();
      if (data.settings) {
        setBranding((prev) => ({ ...prev, ...data.settings }));
      }
    } catch (err) {
      console.error("Failed to load branding settings:", err);
    } finally {
      setBrandingLoading(false);
    }
  };

  const handleSaveBranding = async () => {
    setSavingBranding(true);
    try {
      const res = await fetch("/api/settings/system", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branding),
      });
      if (res.ok) {
        showToast(t("brandingSaved"), "success");
        applyBranding(branding);
      } else {
        showToast(t("brandingSaveError"), "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    } finally {
      setSavingBranding(false);
    }
  };

  const applyBranding = (s: typeof branding) => {
    const root = document.documentElement;
    root.style.setProperty("--color-primary", s.primaryColor);
    root.style.setProperty("--color-secondary", s.secondaryColor);
    root.style.setProperty("--color-tertiary", s.tertiaryColor);
    root.style.setProperty("--font-family", s.fontFamily);
    document.body.style.fontFamily = `${s.fontFamily}, system-ui, -apple-system, sans-serif`;
  };

  const fontOptions = [
    { value: "Cairo", label: "Cairo" },
    { value: "Tajawal", label: "Tajawal" },
    { value: "Almarai", label: "Almarai" },
    { value: "Inter", label: "Inter" },
    { value: "'Plus Jakarta Sans'", label: "Plus Jakarta Sans" },
    { value: "'Noto Sans Arabic'", label: "Noto Sans Arabic" },
    { value: "'Thmanyah Sans'", label: "Thmanyah Sans" },
    { value: "'Thmanyah Serif Display'", label: "Thmanyah Serif Display" },
    { value: "'Thmanyah Serif Text'", label: "Thmanyah Serif Text" },
  ];

  useEffect(() => {
    fetchCategories();
    fetchBranding();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t("subtitle")}
        </p>
      </div>

      {user?.roleType === "superadmin" && (
        <>
          {/* Platform Settings */}
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-tertiary/10 dark:to-secondary/10 flex items-center justify-center">
                <Paintbrush size={16} className="text-primary dark:text-tertiary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t("platformSettingsTitle")}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("platformSettingsSubtitle")}
                </p>
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800/80" />

            {brandingLoading ? (
              <p className="text-sm text-slate-500">{tCommon("loading")}</p>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Site Name (English) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("siteNameEn")}
                    </label>
                    <input
                      type="text"
                      value={branding.siteName}
                      onChange={(e) => setBranding((p) => ({ ...p, siteName: e.target.value }))}
                      placeholder="Moeen Platform"
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/45 dark:focus:ring-tertiary/45 transition-colors"
                    />
                  </div>

                  {/* Site Name (Arabic) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("siteNameAr")}
                    </label>
                    <input
                      type="text"
                      value={branding.siteNameAr}
                      onChange={(e) => setBranding((p) => ({ ...p, siteNameAr: e.target.value }))}
                      placeholder="منصة معين"
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/45 dark:focus:ring-tertiary/45 transition-colors"
                    />
                  </div>

                  {/* Platform Logo */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("logoLabel")}
                    </label>
                    <AttachmentField
                      value={branding.logo}
                      onChange={(file) => {
                        setBranding((p) => ({
                          ...p,
                          logo: file,
                          logoId: file ? file.id : null,
                          logoUrl: file ? file.url : "",
                        }));
                      }}
                      accept="image/*"
                      imageOnly={true}
                      locale={currentLocale}
                    />
                  </div>

                  {/* Font Family */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("fontLabel")}
                    </label>
                    <Select
                      value={branding.fontFamily}
                      onChange={(val) => setBranding((p) => ({ ...p, fontFamily: String(val) }))}
                      options={fontOptions}
                      placeholder={t("selectFontPlaceholder")}
                    />
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5" style={{ fontFamily: branding.fontFamily }}>
                      {t("fontPreviewText")}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Primary Color */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("primaryColor")}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={branding.primaryColor}
                        onChange={(e) => setBranding((p) => ({ ...p, primaryColor: e.target.value }))}
                        className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer bg-transparent p-0.5"
                      />
                      <input
                        type="text"
                        value={branding.primaryColor}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setBranding((p) => ({ ...p, primaryColor: v }));
                        }}
                        className="w-28 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/45 transition-colors uppercase"
                        placeholder="#0A5C4A"
                        maxLength={7}
                      />
                      <div
                        className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 shrink-0"
                        style={{ backgroundColor: branding.primaryColor }}
                      />
                    </div>
                  </div>

                  {/* Secondary / Accent Color */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("accentColor")}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={branding.secondaryColor}
                        onChange={(e) => setBranding((p) => ({ ...p, secondaryColor: e.target.value }))}
                        className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer bg-transparent p-0.5"
                      />
                      <input
                        type="text"
                        value={branding.secondaryColor}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setBranding((p) => ({ ...p, secondaryColor: v }));
                        }}
                        className="w-28 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/45 transition-colors uppercase"
                        placeholder="#F9A826"
                        maxLength={7}
                      />
                      <div
                        className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 shrink-0"
                        style={{ backgroundColor: branding.secondaryColor }}
                      />
                    </div>
                  </div>

                  {/* Tertiary Color (dark mode) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("darkModeColor")}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={branding.tertiaryColor}
                        onChange={(e) => setBranding((p) => ({ ...p, tertiaryColor: e.target.value }))}
                        className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer bg-transparent p-0.5"
                      />
                      <input
                        type="text"
                        value={branding.tertiaryColor}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setBranding((p) => ({ ...p, tertiaryColor: v }));
                        }}
                        className="w-28 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/45 transition-colors uppercase"
                        placeholder="#2FAB99"
                        maxLength={7}
                      />
                      <div
                        className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 shrink-0"
                        style={{ backgroundColor: branding.tertiaryColor }}
                      />
                    </div>
                  </div>
                </div>

                {/* Live Preview */}
                <div className="bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Eye size={14} />
                    <span className="text-xs font-semibold">{t("livePreview")}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      className="px-4 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-opacity hover:opacity-90"
                      style={{ backgroundColor: branding.primaryColor }}
                    >
                      {t("primaryButton")}
                    </button>
                    <button
                      className="px-4 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-opacity hover:opacity-90"
                      style={{ backgroundColor: branding.secondaryColor }}
                    >
                      {t("accentButton")}
                    </button>
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: `${branding.primaryColor}15`, color: branding.primaryColor }}
                    >
                      {t("badge")}
                    </span>
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: `${branding.secondaryColor}15`, color: branding.secondaryColor }}
                    >
                      {t("accentBadge")}
                    </span>
                    {branding.logoUrl ? (
                      <img
                        src={branding.logoUrl}
                        alt="Logo preview"
                        className="w-8 h-8 rounded-lg object-contain border border-slate-200 dark:border-slate-800"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-bold"
                        style={{
                          backgroundColor: `${branding.primaryColor}08`,
                          borderColor: `${branding.primaryColor}20`,
                          color: branding.primaryColor,
                        }}
                      >
                        M
                      </div>
                    )}
                    <span
                      className="text-sm font-semibold"
                      style={{ fontFamily: branding.fontFamily, color: branding.primaryColor }}
                    >
                      {isAr
                        ? (branding.siteNameAr || "منصة معين")
                        : (branding.siteName || "Moeen Platform")}
                    </span>
                  </div>
                </div>

                {/* Save */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveBranding}
                    disabled={savingBranding}
                    className="px-5 py-2 text-sm font-bold text-white rounded-xl shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{ backgroundColor: branding.primaryColor }}
                  >
                    {savingBranding && (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>{savingBranding ? tCommon("loading") : t("saveSettings")}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Categories Management block */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t("categoriesTitle")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t("categoriesSubtitle")}
          </p>
        </div>

        {/* Categories form */}
        <form onSubmit={handleAddCategory} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t("categoryName")}
            </label>
            <input
              type="text"
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="e.g. Charity"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/45 dark:focus:ring-tertiary/45 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t("categoryNameAr")}
            </label>
            <input
              type="text"
              required
              value={newCatNameAr}
              onChange={(e) => setNewCatNameAr(e.target.value)}
              placeholder="مثال: خيرية"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/45 dark:focus:ring-tertiary/45 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={submittingCat}
            className="w-full md:w-auto px-4 py-2 text-sm font-semibold bg-primary dark:bg-tertiary text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submittingCat ? tCommon("loading") : t("addCategory")}
          </button>
        </form>

        <div className="h-px bg-slate-100 dark:bg-slate-800/80" />

        {/* Categories list */}
        <div className="space-y-2">
          {loadingCategories ? (
            <p className="text-sm text-slate-500">{tCommon("loading")}</p>
          ) : categories.length === 0 ? (
            <p className="text-sm text-slate-500">{tCommon("noData")}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                >
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {isAr ? cat.nameAr || cat.name : cat.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-lg transition-colors cursor-pointer"
                    title={tCommon("cancel")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
