"use client";

import { useState, useEffect } from "react";
import {
  Megaphone,
  X,
  Copy,
  Check,
  Search,
  Sparkles,
  FileText,
  Building2,
  UserCheck,
} from "lucide-react";

interface MarketingKit {
  id: number;
  title: string;
  contentAr: string;
  contentEn: string | null;
}

interface MarketingKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  beneficiary: any;
  locale?: string;
}

export default function MarketingKitModal({
  isOpen,
  onClose,
  beneficiary,
  locale = "ar",
}: MarketingKitModalProps) {
  const isAr = locale === "ar";
  const [kits, setKits] = useState<MarketingKit[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedKitId, setSelectedKitId] = useState<number | null>(null);
  const [mergedHtml, setMergedHtml] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch("/api/marketing-kits")
        .then((res) => (res.ok ? res.json() : []))
        .then((data: MarketingKit[]) => {
          setKits(data);
          if (data.length > 0) {
            setSelectedKitId(data[0].id);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedKitId && beneficiary) {
      const kit = kits.find((k) => k.id === selectedKitId);
      if (kit) {
        let content = (isAr ? kit.contentAr : kit.contentEn || kit.contentAr) || "";

        // Replacement mapping for beneficiary data
        const replacements: Record<string, string> = {
          fullName: beneficiary.fullName || (isAr ? "غير محدد" : "N/A"),
          nationalId: beneficiary.nationalId || (isAr ? "غير محدد" : "N/A"),
          phone: beneficiary.phone || (isAr ? "غير محدد" : "N/A"),
          address: beneficiary.address || (isAr ? "غير محدد" : "N/A"),
          governorate: beneficiary.governorate?.nameAr || beneficiary.governorate?.name || (isAr ? "غير محدد" : "N/A"),
          city: beneficiary.city?.nameAr || beneficiary.city?.name || (isAr ? "غير محدد" : "N/A"),
          totalFamilyMembers: beneficiary.totalFamilyMembers ? String(beneficiary.totalFamilyMembers) : "1",
          maritalStatus: beneficiary.maritalStatus || (isAr ? "غير محدد" : "N/A"),
          educationLevel: beneficiary.educationLevel || (isAr ? "غير محدد" : "N/A"),
          healthStatus: beneficiary.healthStatus || (isAr ? "غير محدد" : "N/A"),
          caseClassification: beneficiary.caseClassification || (isAr ? "غير محدد" : "N/A"),
          totalIncome: beneficiary.totalIncome !== null ? `${beneficiary.totalIncome} ر.س` : "0 ر.س",
          totalExpenses: beneficiary.totalExpenses !== null ? `${beneficiary.totalExpenses} ر.س` : "0 ر.س",
          netIncome: beneficiary.netIncome !== null ? `${beneficiary.netIncome} ر.س` : "0 ر.س",
          associationName: beneficiary.association?.name || (isAr ? "منصة معين الرقمية" : "Maeen Platform"),
          donationPrograms: beneficiary.donationPackages?.map((p: any) => `${p.program} (${p.cost} ر.س)`).join(" ، ") || (isAr ? "حملة عامة" : "General Aid"),
          finalRecommendation: beneficiary.finalRecommendation || (isAr ? "توصية بدعم الحالة وفحص الاحتياجات" : "N/A"),
        };

        // Replace all {{key}} with actual beneficiary values
        Object.entries(replacements).forEach(([key, val]) => {
          const reg = new RegExp(`{{\\s*${key}\\s*}}`, "g");
          content = content.replace(reg, `<strong class="text-primary font-bold px-1 bg-primary/10 rounded">${val}</strong>`);
        });

        setMergedHtml(content);
      }
    }
  }, [selectedKitId, beneficiary, kits, isAr]);

  if (!isOpen || !beneficiary) return null;

  const filteredKits = kits.filter((k) =>
    k.title.toLowerCase().includes(search.toLowerCase())
  );

  const selectedKit = kits.find((k) => k.id === selectedKitId);

  const handleCopyText = () => {
    // Copy plain text stripped of HTML tags
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = mergedHtml;
    const text = tempDiv.innerText || tempDiv.textContent || "";

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary dark:text-tertiary flex items-center justify-center">
              <Megaphone size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isAr ? "إصدار الحقيبة التسويقية للمستفيد" : "Generate Marketing Kit for Beneficiary"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {isAr ? `المستفيد المحدد: ${beneficiary.fullName}` : `Beneficiary: ${beneficiary.fullName}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left / Sidebar Kits List */}
          <div className="space-y-3 md:border-e border-slate-100 dark:border-slate-800 pe-0 md:pe-4">
            <div className="relative">
              <Search size={16} className="absolute top-3 right-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? "ابحث عن حملة..." : "Search kit..."}
                className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">
              {isAr ? "اختر الحقيبة التسويقية:" : "Select Campaign Template:"}
            </label>

            {loading ? (
              <div className="p-4 text-center text-xs text-slate-400">{isAr ? "جاري التحميل..." : "Loading..."}</div>
            ) : filteredKits.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">{isAr ? "لا توجد حقائب متاحة" : "No kits available"}</div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pe-1">
                {filteredKits.map((kit) => (
                  <button
                    key={kit.id}
                    type="button"
                    onClick={() => setSelectedKitId(kit.id)}
                    className={`w-full text-start p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                      selectedKitId === kit.id
                        ? "bg-primary/10 border-primary text-primary dark:text-tertiary font-bold shadow-sm"
                        : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                    }`}
                  >
                    <div className="font-semibold line-clamp-1">{kit.title}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right / Preview Rendered Template */}
          <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedKit ? selectedKit.title : (isAr ? "معاينة الحملة المكتملة" : "Rendered Preview")}
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {isAr ? "تم دمج بيانات المستفيد" : "Beneficiary Data Merged"}
                </span>
              </div>

              {/* Merged Rendered HTML View */}
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 min-h-[260px] max-h-[350px] overflow-y-auto text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                <div dangerouslySetInnerHTML={{ __html: mergedHtml || (isAr ? "اختر حقيبة تسويقية لعرض النص" : "Select a kit to preview content") }} />
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-primary dark:bg-tertiary text-white rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-md shadow-primary/20"
              >
                {copied ? <Check size={16} className="text-white" /> : <Copy size={16} />}
                <span>{copied ? (isAr ? "تم نسخ النص!" : "Copied!") : (isAr ? "نسخ النص التسويقي للحملة" : "Copy Campaign Text")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
