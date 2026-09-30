"use client";

import React, { createContext, useContext } from "react";
import Select from "@/components/ui/Select";
import { CurrencyField } from "@/components/ui/CurrencyField";

export interface Needs {
  // السكن والترميم
  shelter?: boolean;
  shelter_type?: "new" | "renovation";
  structural_needed?: boolean;
  structural_columns?: boolean;
  structural_full?: boolean;
  structural_roof_insulation?: boolean;
  structural_roof_slope?: boolean;
  plumbing_needed?: boolean;
  plumbing_general?: boolean;
  plumbing_mixers?: boolean;
  plumbing_pipes?: boolean;
  plumbing_other?: string;
  electrical_needed?: boolean;
  electrical_general?: boolean;
  electrical_wires?: boolean;
  electrical_sockets?: boolean;
  electrical_other?: string;
  painting_needed?: boolean;
  painting_interior?: boolean;
  painting_exterior?: boolean;
  furniture_needed?: boolean;
  furniture_carpet?: boolean;
  furniture_carpet_area?: number | null;
  furniture_seating?: boolean;
  furniture_seating_area?: number | null;
  furniture_bedrooms?: boolean;
  furniture_beds?: number | null;
  furniture_mattresses?: number | null;
  furniture_closets?: boolean;
  furniture_closets_count?: number | null;
  furniture_lighting?: boolean;
  furniture_lighting_count?: number | null;

  // كفالة مالية
  financial_support?: boolean;
  financial_support_amount?: number | null;
  financial_support_reason?: string;

  // الغذاء واحتياجات الأطفال
  food?: boolean;
  food_basket_size?: "small" | "medium" | "large";
  food_basket_frequency?: "monthly" | "one_time";
  food_basket_count?: number | null;
  child_milk?: boolean;
  child_hygiene?: boolean;
  child_other?: string;

  // سداد فواتير
  bills?: boolean;
  bills_electricity?: number | null;
  bills_water?: number | null;

  // سداد إيجار
  rent?: boolean;
  rent_amount?: number | null;

  // أجهزة كهربائية
  appliances?: boolean;
  appliance_fridge?: number | null;
  appliance_washer?: number | null;
  appliance_ac?: number | null;
  appliance_oven?: number | null;
  appliance_water_heater?: number | null;
  appliance_water_filter?: number | null;

  // وسيلة نقل
  transport?: boolean;
  transport_owns?: "yes" | "no";
  transport_type?: string;
  transport_reason?: string;
  transport_recommendation?: "small_car" | "family_car" | "school_transport";

  // دعم طبي
  medical?: boolean;
  medical_disease?: string;
  medical_medication?: boolean;
  medical_equipment?: boolean;
  medical_surgery?: boolean;
  medical_cost?: number | null;

  // أجهزة تقنية
  tech?: boolean;
  tech_desktop?: number | null;
  tech_laptop?: number | null;
  tech_ipad?: number | null;
  tech_internet?: boolean;

  // تدريب وتأهيل
  training?: boolean;
  training_goal?: "work" | "skill";
  training_gender?: "male" | "female";
  training_age?: "18-25" | "26-40" | "40+";
  training_program?: string;

  // مهارات
  skills?: boolean;
  skills_list?: string;
  skills_owned?: string;
  skills_needed?: string;

  // رأي الباحث
  researcher_opinion_basic?: string;
  researcher_opinion_dev?: string;
}

const NeedsContext = createContext<{
  needs: Needs;
  update: (key: keyof Needs, value: any) => void;
  isViewOnly: boolean;
  fieldErrors?: Record<string, string>;
  setFieldErrors?: (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  inputCls: (field: string, extra?: string) => string;
} | null>(null);

function ErrMsg({ field }: { field: string }) {
  const ctx = useContext(NeedsContext);
  if (!ctx || !ctx.fieldErrors?.[field]) return null;
  return (
    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1" data-error>
      <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
      {ctx.fieldErrors[field]}
    </p>
  );
}

function CheckboxCard({ checked, onChange, label }: { checked?: boolean; onChange: () => void; label: string }) {
  const ctx = useContext(NeedsContext);
  if (!ctx) return null;
  const { isViewOnly } = ctx;
  return (
    <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${checked ? "bg-violet-50 dark:bg-violet-950/20 border-violet-300 dark:border-violet-700" : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"}`}>
      <input type="checkbox" checked={!!checked} onChange={onChange} disabled={isViewOnly} className="accent-violet-500 w-4 h-4" />
      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
    </label>
  );
}

function NestedCheckbox({ field, label }: { field: keyof Needs; label: string }) {
  const ctx = useContext(NeedsContext);
  if (!ctx) return null;
  const { needs, update, isViewOnly } = ctx;
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={!!needs[field]} onChange={() => {
        const next = !needs[field];
        update(field, next || undefined);
      }} disabled={isViewOnly} className="accent-violet-500 w-3.5 h-3.5" />
      <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
    </label>
  );
}

function NestedText({ field, placeholder }: { field: keyof Needs; placeholder: string }) {
  const ctx = useContext(NeedsContext);
  if (!ctx) return null;
  const { needs, update, isViewOnly, setFieldErrors, inputCls } = ctx;
  const val = needs[field] as string | undefined;
  return (
    <div className="flex flex-col w-full">
      <input
        type="text"
        value={val ?? ""}
        onChange={(e) => { update(field, e.target.value || undefined); setFieldErrors?.((prev) => ({ ...prev, [field]: "" })); }}
        disabled={isViewOnly}
        className={inputCls(field as string)}
        placeholder={placeholder}
      />
      <ErrMsg field={field as string} />
    </div>
  );
}

function NestedNumber({ field, placeholder }: { field: keyof Needs; placeholder: string }) {
  const ctx = useContext(NeedsContext);
  if (!ctx) return null;
  const { needs, update, isViewOnly, setFieldErrors, inputCls } = ctx;
  const val = needs[field] as number | null | undefined;
  return (
    <div className="flex flex-col w-full">
      <input
        type="number"
        min={0}
        value={val ?? ""}
        onChange={(e) => { update(field, e.target.value ? Number(e.target.value) : null); setFieldErrors?.((prev) => ({ ...prev, [field]: "" })); }}
        disabled={isViewOnly}
        className={inputCls(field as string)}
        placeholder={placeholder}
      />
      <ErrMsg field={field as string} />
    </div>
  );
}

interface NeedsSectionProps {
  needs: Needs;
  onChange: (needs: Needs) => void;
  isViewOnly?: boolean;
  locale?: string;
  fieldErrors?: Record<string, string>;
  setFieldErrors?: (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
}

export default function NeedsSection({
  needs,
  onChange,
  isViewOnly = false,
  locale,
  fieldErrors,
  setFieldErrors,
}: NeedsSectionProps) {
  const isAr = locale === "ar";
  const inputDisabled = "w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 cursor-default";

  const inputCls = (field: string, extra = "") => {
    if (isViewOnly) return inputDisabled;
    const isErr = !!fieldErrors?.[field];
    const borderCls = isErr
      ? "border-red-500 focus:ring-red-500/30 dark:border-red-500"
      : "border-slate-200 dark:border-slate-800 focus:ring-primary dark:focus:ring-tertiary";
    return `w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border ${borderCls} rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 transition-colors ${extra}`;
  };

  function update(key: keyof Needs, value: any) {
    onChange({ ...needs, [key]: value });
    setFieldErrors?.((prev) => ({ ...prev, [key as string]: "" }));
  }

  function onCheck(key: keyof Needs, subKeys?: (keyof Needs)[]) {
    const next = !needs[key];
    const patch: Partial<Needs> = { [key]: next };
    if (!next && subKeys) {
      for (const sk of subKeys) {
        (patch as any)[sk] = undefined;
      }
    }
    onChange({ ...needs, ...patch });
    setFieldErrors?.((prev) => {
      const next2 = { ...prev, [key as string]: "" };
      if (!next && subKeys) {
        for (const sk of subKeys) next2[sk as string] = "";
      }
      return next2;
    });
  }

  return (
    <NeedsContext.Provider value={{ needs, update, isViewOnly, fieldErrors, setFieldErrors, inputCls }}>
      <div className="space-y-6">
        {/* ملاحظة */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
            ⚠️ {isAr
              ? "ملاحظة هامة: أي احتياج يتم تحديده يجب إرفاق الإثبات الخاص به مع هذه الاستمارة ليُعتمد وتؤخذ بعين الاعتبار في البيانات"
              : "Important Note: Any identified need must have supporting evidence attached to this form to be approved and taken into consideration in the data"}
          </p>
        </div>

        {/* ============================================ */}
        {/* 1. الاحتياجات الأساسية */}
        {/* ============================================ */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-rose-500 rounded-full" />
          {isAr ? "الاحتياجات الأساسية (الإغاثية، السكنية، والعاجلة)" : "Basic Needs (Relief, Housing, & Urgent)"}
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
          {isAr ? "اختر الاحتياجات التي تحتاجها الأسرة" : "Select the needs the family requires"}
        </p>

        <div className="space-y-4">
          {/* السكن والترميم */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <CheckboxCard checked={needs.shelter} onChange={() => onCheck("shelter", ["shelter_type", "structural_needed", "structural_columns", "structural_full", "structural_roof_insulation", "structural_roof_slope", "plumbing_needed", "plumbing_general", "plumbing_mixers", "plumbing_pipes", "plumbing_other", "electrical_needed", "electrical_general", "electrical_wires", "electrical_sockets", "electrical_other", "painting_needed", "painting_interior", "painting_exterior", "furniture_needed", "furniture_carpet", "furniture_carpet_area", "furniture_seating", "furniture_seating_area", "furniture_bedrooms", "furniture_beds", "furniture_mattresses", "furniture_closets", "furniture_closets_count", "furniture_lighting", "furniture_lighting_count"])} label={isAr ? "توفير سكن أو ترميم وتحسين البيئة السكنية (شامل)" : "Provide housing or renovation & improvement of housing (comprehensive)"} />

            {needs.shelter && (
              <div className="mt-3 space-y-3">
                <div className="w-full">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{isAr ? "نوع الاحتياج" : "Type of need"}</p>
                  <Select value={needs.shelter_type ?? ""} onChange={(v) => { update("shelter_type", v || undefined); setFieldErrors?.((prev) => ({ ...prev, shelter_type: "" })); }} disabled={isViewOnly} options={[{ value: "new", label: isAr ? "توفير سكن جديد" : "New housing" }, { value: "renovation", label: isAr ? "السكن يحتاج إلى ترميم وتحسين" : "Housing needs renovation" }]} placeholder={isAr ? "اختر..." : "Select..."} error={!!fieldErrors?.shelter_type} />
                  <ErrMsg field="shelter_type" />
                </div>

                {(needs.shelter_type === "renovation") && (
                  <div className="space-y-4">
                    {/* الهيكل الإنشائي */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3">
                      <CheckboxCard checked={needs.structural_needed} onChange={() => onCheck("structural_needed", ["structural_columns", "structural_full", "structural_roof_insulation", "structural_roof_slope"])} label={isAr ? "الهيكل الإنشائي والسقف" : "Structural & Roof"} />
                      <ErrMsg field="structural_needed" />
                      {needs.structural_needed && (
                        <div className="flex flex-wrap gap-2">
                          <NestedCheckbox field="structural_columns" label={isAr ? "يحتاج إلى تدعيم في الأعمدة والقواعد" : "Columns & foundations reinforcement"} />
                          <NestedCheckbox field="structural_full" label={isAr ? "ترميم كامل للهيكل الإنشائي" : "Full structural renovation"} />
                          <NestedCheckbox field="structural_roof_insulation" label={isAr ? "السقف يحتاج إلى عزل (مائي/حراري)" : "Roof insulation (water/thermal)"} />
                          <NestedCheckbox field="structural_roof_slope" label={isAr ? "السقف يحتاج إلى صبة ميلان" : "Roof slope casting"} />
                        </div>
                      )}
                    </div>

                    {/* السباكة */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3">
                      <CheckboxCard checked={needs.plumbing_needed} onChange={() => onCheck("plumbing_needed", ["plumbing_general", "plumbing_mixers", "plumbing_pipes", "plumbing_other"])} label={isAr ? "صيانة السباكة" : "Plumbing maintenance"} />
                      <ErrMsg field="plumbing_needed" />
                      {needs.plumbing_needed && (
                        <>
                          <div className="flex flex-wrap gap-2">
                            <NestedCheckbox field="plumbing_general" label={isAr ? "صيانة عامة للسباكة" : "General plumbing maintenance"} />
                            <NestedCheckbox field="plumbing_mixers" label={isAr ? "تغيير الخلاطات" : "Replace mixers"} />
                            <NestedCheckbox field="plumbing_pipes" label={isAr ? "صيانة المواسير والتسريبات" : "Pipe & leak maintenance"} />
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-slate-500 shrink-0">{isAr ? "أخرى:" : "Other:"}</span>
                            <NestedText field="plumbing_other" placeholder={isAr ? "حدد..." : "Specify..."} />
                          </div>
                        </>
                      )}
                    </div>

                    {/* الكهرباء */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3">
                      <CheckboxCard checked={needs.electrical_needed} onChange={() => onCheck("electrical_needed", ["electrical_general", "electrical_wires", "electrical_sockets", "electrical_other"])} label={isAr ? "صيانة الكهرباء" : "Electrical maintenance"} />
                      <ErrMsg field="electrical_needed" />
                      {needs.electrical_needed && (
                        <>
                          <div className="flex flex-wrap gap-2">
                            <NestedCheckbox field="electrical_general" label={isAr ? "صيانة كهربائية عامة" : "General electrical maintenance"} />
                            <NestedCheckbox field="electrical_wires" label={isAr ? "صيانة الأسلاك والعدادات" : "Wires & meters maintenance"} />
                            <NestedCheckbox field="electrical_sockets" label={isAr ? "صيانة الأفياش والإضاءات" : "Sockets & lighting maintenance"} />
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-slate-500 shrink-0">{isAr ? "أخرى:" : "Other:"}</span>
                            <NestedText field="electrical_other" placeholder={isAr ? "حدد..." : "Specify..."} />
                          </div>
                        </>
                      )}
                    </div>

                    {/* الدهانات */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3">
                      <CheckboxCard checked={needs.painting_needed} onChange={() => onCheck("painting_needed", ["painting_interior", "painting_exterior"])} label={isAr ? "الدهانات" : "Painting"} />
                      <ErrMsg field="painting_needed" />
                      {needs.painting_needed && (
                        <div className="flex flex-wrap gap-2">
                          <NestedCheckbox field="painting_interior" label={isAr ? "دهانات داخلية للمنزل" : "Interior painting"} />
                          <NestedCheckbox field="painting_exterior" label={isAr ? "دهانات خارجية للواجهات" : "Exterior painting"} />
                        </div>
                      )}
                    </div>

                    {/* الأثاث والفرش */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3">
                      <CheckboxCard checked={needs.furniture_needed} onChange={() => onCheck("furniture_needed", ["furniture_carpet", "furniture_carpet_area", "furniture_seating", "furniture_seating_area", "furniture_bedrooms", "furniture_beds", "furniture_mattresses", "furniture_closets", "furniture_closets_count", "furniture_lighting", "furniture_lighting_count"])} label={isAr ? "الأثاث والفرش" : "Furniture & Furnishings"} />
                      <ErrMsg field="furniture_needed" />
                      {needs.furniture_needed && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input type="checkbox" checked={!!needs.furniture_carpet} onChange={() => onCheck("furniture_carpet", ["furniture_carpet_area"])} disabled={isViewOnly} className="accent-violet-500 w-4 h-4 rounded" />
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{isAr ? "فرش/موكيت" : "Carpet"}</span>
                            </label>
                            {needs.furniture_carpet && (
                              <div className="pt-1 flex items-center gap-2">
                                <span className="text-[11px] text-slate-500 shrink-0 font-medium">{isAr ? "المساحة:" : "Area:"}</span>
                                <NestedNumber field="furniture_carpet_area" placeholder={isAr ? "م²" : "m²"} />
                              </div>
                            )}
                          </div>

                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input type="checkbox" checked={!!needs.furniture_seating} onChange={() => onCheck("furniture_seating", ["furniture_seating_area"])} disabled={isViewOnly} className="accent-violet-500 w-4 h-4 rounded" />
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{isAr ? "جلسات داخلية" : "Indoor seating"}</span>
                            </label>
                            {needs.furniture_seating && (
                              <div className="pt-1 flex items-center gap-2">
                                <span className="text-[11px] text-slate-500 shrink-0 font-medium">{isAr ? "المساحة:" : "Area:"}</span>
                                <NestedNumber field="furniture_seating_area" placeholder={isAr ? "م²" : "m²"} />
                              </div>
                            )}
                          </div>

                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input type="checkbox" checked={!!needs.furniture_bedrooms} onChange={() => onCheck("furniture_bedrooms", ["furniture_beds", "furniture_mattresses"])} disabled={isViewOnly} className="accent-violet-500 w-4 h-4 rounded" />
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{isAr ? "غرف نوم" : "Bedrooms"}</span>
                            </label>
                            {needs.furniture_bedrooms && (
                              <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] text-slate-500 shrink-0 font-medium">{isAr ? "أسرة:" : "Beds:"}</span>
                                  <NestedNumber field="furniture_beds" placeholder="0" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] text-slate-500 shrink-0 font-medium">{isAr ? "مراتب:" : "Mattresses:"}</span>
                                  <NestedNumber field="furniture_mattresses" placeholder="0" />
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input type="checkbox" checked={!!needs.furniture_closets} onChange={() => onCheck("furniture_closets", ["furniture_closets_count"])} disabled={isViewOnly} className="accent-violet-500 w-4 h-4 rounded" />
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{isAr ? "دواليب ملابس" : "Wardrobes"}</span>
                            </label>
                            {needs.furniture_closets && (
                              <div className="pt-1 flex items-center gap-2">
                                <span className="text-[11px] text-slate-500 shrink-0 font-medium">{isAr ? "العدد:" : "Count:"}</span>
                                <NestedNumber field="furniture_closets_count" placeholder="0" />
                              </div>
                            )}
                          </div>

                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2 sm:col-span-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input type="checkbox" checked={!!needs.furniture_lighting} onChange={() => onCheck("furniture_lighting", ["furniture_lighting_count"])} disabled={isViewOnly} className="accent-violet-500 w-4 h-4 rounded" />
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{isAr ? "نجف وإضاءات" : "Chandeliers & Lighting"}</span>
                            </label>
                            {needs.furniture_lighting && (
                              <div className="pt-1 flex items-center gap-2 w-full">
                                <span className="text-[11px] text-slate-500 shrink-0 font-medium">{isAr ? "العدد:" : "Count:"}</span>
                                <NestedNumber field="furniture_lighting_count" placeholder="0" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* كفالة مالية */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <CheckboxCard checked={needs.financial_support} onChange={() => onCheck("financial_support", ["financial_support_amount", "financial_support_reason"])} label={isAr ? "كفالة مالية للأسرة" : "Financial sponsorship for the family"} />
            {needs.financial_support && (
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{isAr ? "كم المبلغ الذي تحتاجه الأسرة شهرياً؟" : "How much does the family need monthly?"}</p>
                  <CurrencyField label="" value={needs.financial_support_amount ?? null} onChange={(v) => { update("financial_support_amount", v); setFieldErrors?.((prev) => ({ ...prev, financial_support_amount: "" })); }} disabled={isViewOnly} error={!!fieldErrors?.financial_support_amount} />
                  <ErrMsg field="financial_support_amount" />
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{isAr ? "المبرر" : "Justification"}</p>
                  <textarea value={needs.financial_support_reason ?? ""} onChange={(e) => { update("financial_support_reason", e.target.value || undefined); setFieldErrors?.((prev) => ({ ...prev, financial_support_reason: "" })); }} disabled={isViewOnly} className={inputCls("financial_support_reason", "min-h-[60px]")} rows={2} placeholder={isAr ? "اذكر المبرر..." : "State the justification..."} />
                  <ErrMsg field="financial_support_reason" />
                </div>
              </div>
            )}
          </div>

          {/* الغذاء */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <CheckboxCard checked={needs.food} onChange={() => onCheck("food", ["food_basket_size", "food_basket_frequency", "food_basket_count", "child_milk", "child_hygiene", "child_other"])} label={isAr ? "الغذاء واحتياجات الأطفال" : "Food & Children Needs"} />
            {needs.food && (
              <div className="mt-3 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">{isAr ? "السلة الغذائية" : "Food Basket"}</p>
                  <div className={`grid grid-cols-1 ${needs.food_basket_frequency === "one_time" ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3`}>
                    <div>
                      <p className="text-[11px] text-slate-500 mb-1">{isAr ? "حجم السلة" : "Basket size"}</p>
                      <Select value={needs.food_basket_size ?? ""} onChange={(v) => { update("food_basket_size", v || undefined); setFieldErrors?.((prev) => ({ ...prev, food_basket_size: "" })); }} disabled={isViewOnly} options={[{ value: "small", label: isAr ? "صغيرة" : "Small" }, { value: "medium", label: isAr ? "متوسطة" : "Medium" }, { value: "large", label: isAr ? "كبيرة" : "Large" }]} placeholder={isAr ? "اختر..." : "Select..."} error={!!fieldErrors?.food_basket_size} />
                      <ErrMsg field="food_basket_size" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 mb-1">{isAr ? "التكرار" : "Frequency"}</p>
                      <Select value={needs.food_basket_frequency ?? ""} onChange={(v) => { update("food_basket_frequency", v || undefined); setFieldErrors?.((prev) => ({ ...prev, food_basket_frequency: "" })); }} disabled={isViewOnly} options={[{ value: "monthly", label: isAr ? "شهرية" : "Monthly" }, { value: "one_time", label: isAr ? "مقطوعة" : "One-time" }]} placeholder={isAr ? "اختر..." : "Select..."} error={!!fieldErrors?.food_basket_frequency} />
                      <ErrMsg field="food_basket_frequency" />
                    </div>
                    {needs.food_basket_frequency === "one_time" && (
                      <div>
                        <p className="text-[11px] text-slate-500 mb-1">{isAr ? "العدد" : "Count"}</p>
                        <NestedNumber field="food_basket_count" placeholder="0" />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">{isAr ? "احتياجات الأطفال" : "Children Needs"}</p>
                  <div className="flex flex-wrap gap-2">
                    <NestedCheckbox field="child_milk" label={isAr ? "حليب أطفال" : "Baby milk"} />
                    <NestedCheckbox field="child_hygiene" label={isAr ? "أدوات صحية" : "Hygiene products"} />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-500 shrink-0">{isAr ? "أخرى:" : "Other:"}</span>
                    <NestedText field="child_other" placeholder={isAr ? "حدد..." : "Specify..."} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* سداد فواتير */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <CheckboxCard checked={needs.bills} onChange={() => onCheck("bills", ["bills_electricity", "bills_water"])} label={isAr ? "سداد فواتير متعثرة" : "Pay overdue bills"} />
            {needs.bills && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{isAr ? "الكهرباء" : "Electricity"}</p>
                  <CurrencyField label="" value={needs.bills_electricity ?? null} onChange={(v) => { update("bills_electricity", v); setFieldErrors?.((prev) => ({ ...prev, bills_electricity: "" })); }} disabled={isViewOnly} error={!!fieldErrors?.bills_electricity} />
                  <ErrMsg field="bills_electricity" />
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{isAr ? "الماء" : "Water"}</p>
                  <CurrencyField label="" value={needs.bills_water ?? null} onChange={(v) => { update("bills_water", v); setFieldErrors?.((prev) => ({ ...prev, bills_water: "" })); }} disabled={isViewOnly} error={!!fieldErrors?.bills_water} />
                  <ErrMsg field="bills_water" />
                </div>
              </div>
            )}
          </div>

          {/* سداد إيجار */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <CheckboxCard checked={needs.rent} onChange={() => onCheck("rent", ["rent_amount"])} label={isAr ? "سداد الإيجار" : "Pay rent"} />
            {needs.rent && (
              <div className="mt-3 w-full">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{isAr ? "المبلغ المطلوب" : "Amount required"}</p>
                <CurrencyField label="" value={needs.rent_amount ?? null} onChange={(v) => { update("rent_amount", v); setFieldErrors?.((prev) => ({ ...prev, rent_amount: "" })); }} disabled={isViewOnly} error={!!fieldErrors?.rent_amount} />
                <ErrMsg field="rent_amount" />
              </div>
            )}
          </div>

          {/* أجهزة كهربائية */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <CheckboxCard checked={needs.appliances} onChange={() => onCheck("appliances", ["appliance_fridge", "appliance_washer", "appliance_ac", "appliance_oven", "appliance_water_heater", "appliance_water_filter"])} label={isAr ? "توفير أجهزة كهربائية" : "Provide electrical appliances"} />
            {needs.appliances && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {([
                  ["appliance_fridge", isAr ? "ثلاجة" : "Fridge"],
                  ["appliance_washer", isAr ? "غسالة" : "Washer"],
                  ["appliance_ac", isAr ? "مكيفات" : "AC"],
                  ["appliance_oven", isAr ? "فرن" : "Oven"],
                  ["appliance_water_heater", isAr ? "سخان ماء" : "Water heater"],
                  ["appliance_water_filter", isAr ? "تحلية مياه" : "Water filter"],
                ] as const).map(([field, label]) => (
                  <div key={field} className="space-y-1">
                    <p className="text-[11px] text-slate-500">{label}</p>
                    <NestedNumber field={field as keyof Needs} placeholder="0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* وسيلة نقل */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <CheckboxCard checked={needs.transport} onChange={() => onCheck("transport", ["transport_owns", "transport_type", "transport_reason", "transport_recommendation"])} label={isAr ? "توفير وسيلة نقل / المواصلات" : "Provide transportation"} />
            {needs.transport && (
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{isAr ? "الأسرة تمتلك وسيلة نقل؟" : "Does the family own a vehicle?"}</p>
                  <Select value={needs.transport_owns ?? ""} onChange={(v) => { onChange({ ...needs, transport_owns: (v as "yes" | "no") || undefined, transport_type: v !== "yes" ? undefined : needs.transport_type }); setFieldErrors?.((prev) => ({ ...prev, transport_owns: "", transport_type: v !== "yes" ? "" : prev.transport_type })); }} disabled={isViewOnly} options={[{ value: "yes", label: isAr ? "نعم" : "Yes" }, { value: "no", label: isAr ? "لا تمتلك" : "Does not own" }]} placeholder={isAr ? "اختر..." : "Select..."} error={!!fieldErrors?.transport_owns} />
                  <ErrMsg field="transport_owns" />
                </div>
                {needs.transport_owns === "yes" && (
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{isAr ? "النوع/الحالة" : "Type/Condition"}</p>
                    <NestedText field="transport_type" placeholder={isAr ? "حدد النوع والحالة..." : "Specify type & condition..."} />
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{isAr ? "المبرر" : "Justification"}</p>
                  <textarea value={needs.transport_reason ?? ""} onChange={(e) => { update("transport_reason", e.target.value || undefined); setFieldErrors?.((prev) => ({ ...prev, transport_reason: "" })); }} disabled={isViewOnly} className={inputCls("transport_reason", "min-h-[60px]")} rows={2} placeholder={isAr ? "اذكر المبرر..." : "State the justification..."} />
                  <ErrMsg field="transport_reason" />
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{isAr ? "التوصية" : "Recommendation"}</p>
                  <Select value={needs.transport_recommendation ?? ""} onChange={(v) => { update("transport_recommendation", v || undefined); setFieldErrors?.((prev) => ({ ...prev, transport_recommendation: "" })); }} disabled={isViewOnly} options={[{ value: "small_car", label: isAr ? "سيارة صغيرة" : "Small car" }, { value: "family_car", label: isAr ? "سيارة عائلية" : "Family car" }, { value: "school_transport", label: isAr ? "نقل مدرسي" : "School transport" }]} placeholder={isAr ? "اختر..." : "Select..."} error={!!fieldErrors?.transport_recommendation} />
                  <ErrMsg field="transport_recommendation" />
                </div>
              </div>
            )}
          </div>

          {/* دعم طبي */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <CheckboxCard checked={needs.medical} onChange={() => onCheck("medical", ["medical_disease", "medical_medication", "medical_equipment", "medical_surgery", "medical_cost"])} label={isAr ? "الدعم الطبي" : "Medical support"} />
            {needs.medical && (
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{isAr ? "نوع المرض" : "Type of illness"}</p>
                  <NestedText field="medical_disease" placeholder={isAr ? "اذكر نوع المرض..." : "Mention the illness..."} />
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{isAr ? "نوع الاحتياج" : "Type of need"}</p>
                  <div className="flex flex-wrap gap-2">
                    <NestedCheckbox field="medical_medication" label={isAr ? "أدوية دورية" : "Regular medication"} />
                    <NestedCheckbox field="medical_equipment" label={isAr ? "أجهزة طبية" : "Medical equipment"} />
                    <NestedCheckbox field="medical_surgery" label={isAr ? "عمليات جراحية" : "Surgery"} />
                  </div>
                </div>
                <div className="w-full">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{isAr ? "التكلفة المقدرة" : "Estimated cost"}</p>
                  <CurrencyField label="" value={needs.medical_cost ?? null} onChange={(v) => { update("medical_cost", v); setFieldErrors?.((prev) => ({ ...prev, medical_cost: "" })); }} disabled={isViewOnly} error={!!fieldErrors?.medical_cost} />
                  <ErrMsg field="medical_cost" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* رأي الباحث في الاحتياجات الأساسية */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            {isAr ? "رأي الباحث (حول أولويات الاحتياجات الأساسية)" : "Researcher's opinion (on basic needs priorities)"}
          </p>
          <textarea
            value={needs.researcher_opinion_basic ?? ""}
            onChange={(e) => update("researcher_opinion_basic", e.target.value || undefined)}
            disabled={isViewOnly}
            className={inputCls("researcher_opinion_basic", "min-h-[80px]")}
            rows={3}
            placeholder={isAr ? "اكتب رأي الباحث..." : "Write researcher's opinion..."}
          />
        </div>
      </div>

      {/* ============================================ */}
      {/* 2. الاحتياجات غير الأساسية */}
      {/* ============================================ */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
          {isAr ? "الاحتياجات غير الأساسية (التنموية والتمكينية)" : "Non-basic needs (Developmental & Empowering)"}
        </h4>

        <div className="space-y-4 mt-4">
          {/* أجهزة تقنية */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <CheckboxCard checked={needs.tech} onChange={() => onCheck("tech", ["tech_desktop", "tech_laptop", "tech_ipad", "tech_internet"])} label={isAr ? "أجهزة تقنية واتصالات" : "Tech & communication devices"} />
            {needs.tech && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="flex items-end pb-1 sm:col-span-3">
                  <NestedCheckbox field="tech_internet" label={isAr ? "باقة إنترنت" : "Internet package"} />
                </div>
                {([
                  ["tech_desktop", isAr ? "حاسب آلي" : "Desktop"],
                  ["tech_laptop", isAr ? "لابتوب" : "Laptop"],
                  ["tech_ipad", isAr ? "آيباد" : "iPad"],
                ] as const).map(([field, label]) => (
                  <div key={field} className="space-y-1">
                    <p className="text-[11px] text-slate-500">{label}</p>
                    <NestedNumber field={field as keyof Needs} placeholder="0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* تدريب وتأهيل */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <CheckboxCard checked={needs.training} onChange={() => onCheck("training", ["training_goal", "training_gender", "training_age", "training_program"])} label={isAr ? "برامج تدريب وتأهيل" : "Training & qualification programs"} />
            {needs.training && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-[11px] text-slate-500 mb-1">{isAr ? "الهدف" : "Goal"}</p>
                    <Select value={needs.training_goal ?? ""} onChange={(v) => { update("training_goal", v || undefined); setFieldErrors?.((prev) => ({ ...prev, training_goal: "" })); }} disabled={isViewOnly} options={[{ value: "work", label: isAr ? "سوق العمل" : "Job market" }, { value: "skill", label: isAr ? "اكتساب مهارة" : "Skill acquisition" }]} placeholder={isAr ? "اختر..." : "Select..."} error={!!fieldErrors?.training_goal} />
                    <ErrMsg field="training_goal" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 mb-1">{isAr ? "الجنس" : "Gender"}</p>
                    <Select value={needs.training_gender ?? ""} onChange={(v) => { update("training_gender", v || undefined); setFieldErrors?.((prev) => ({ ...prev, training_gender: "" })); }} disabled={isViewOnly} options={[{ value: "male", label: isAr ? "ذكر" : "Male" }, { value: "female", label: isAr ? "أنثى" : "Female" }]} placeholder={isAr ? "اختر..." : "Select..."} error={!!fieldErrors?.training_gender} />
                    <ErrMsg field="training_gender" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 mb-1">{isAr ? "العمر" : "Age"}</p>
                    <Select value={needs.training_age ?? ""} onChange={(v) => { update("training_age", v || undefined); setFieldErrors?.((prev) => ({ ...prev, training_age: "" })); }} disabled={isViewOnly} options={[{ value: "18-25", label: "18-25" }, { value: "26-40", label: "26-40" }, { value: "40+", label: isAr ? "فوق 40" : "40+" }]} placeholder={isAr ? "اختر..." : "Select..."} error={!!fieldErrors?.training_age} />
                    <ErrMsg field="training_age" />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{isAr ? "البرنامج المقترح" : "Suggested program"}</p>
                  <NestedText field="training_program" placeholder={isAr ? "اذكر البرنامج..." : "Mention the program..."} />
                </div>
              </div>
            )}
          </div>

          {/* المهارات */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <CheckboxCard checked={needs.skills} onChange={() => onCheck("skills", ["skills_list", "skills_owned", "skills_needed"])} label={isAr ? "المهارات والمهن التي تتقنها الأسرة" : "Skills & professions the family masters"} />
            {needs.skills && (
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{isAr ? "اذكر المهارات/المهن" : "Mention skills/professions"}</p>
                  <textarea value={needs.skills_list ?? ""} onChange={(e) => { update("skills_list", e.target.value || undefined); setFieldErrors?.((prev) => ({ ...prev, skills_list: "" })); }} disabled={isViewOnly} className={inputCls("skills_list", "min-h-[60px]")} rows={2} placeholder={isAr ? "اذكر المهارات..." : "List skills..."} />
                  <ErrMsg field="skills_list" />
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{isAr ? "الأدوات التي تمتلكها" : "Tools you own"}</p>
                  <textarea value={needs.skills_owned ?? ""} onChange={(e) => update("skills_owned", e.target.value || undefined)} disabled={isViewOnly} className={inputCls("skills_owned", "min-h-[60px]")} rows={2} placeholder={isAr ? "اذكر الأدوات..." : "List tools..."} />
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{isAr ? "الأدوات التي تحتاجها" : "Tools you need"}</p>
                  <textarea value={needs.skills_needed ?? ""} onChange={(e) => update("skills_needed", e.target.value || undefined)} disabled={isViewOnly} className={inputCls("skills_needed", "min-h-[60px]")} rows={2} placeholder={isAr ? "اذكر الأدوات المطلوبة..." : "List needed tools..."} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* رأي الباحث في التمكين */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            {isAr ? "رأي الباحث (حول التمكين والمشاريع)" : "Researcher's opinion (on empowerment & projects)"}
          </p>
          <textarea
            value={needs.researcher_opinion_dev ?? ""}
            onChange={(e) => update("researcher_opinion_dev", e.target.value || undefined)}
            disabled={isViewOnly}
            className={inputCls("researcher_opinion_dev", "min-h-[80px]")}
            rows={3}
            placeholder={isAr ? "اكتب رأي الباحث..." : "Write researcher's opinion..."}
          />
        </div>
      </div>
    </div>
    </NeedsContext.Provider>
  );
}
