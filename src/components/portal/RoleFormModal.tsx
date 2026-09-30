"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Shield } from "lucide-react";

import Select from "@/components/ui/Select";

interface Screen {
  id: number;
  name: string;
  nameAr?: string | null;
  path: string;
}

interface PermissionEntry {
  screenId: number;
  actions: string[];
}

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, nameAr: string, permissions: PermissionEntry[]) => Promise<void>;
  initialData?: {
    id?: number;
    name: string;
    nameAr?: string | null;
    permissions: PermissionEntry[];
  } | null;
  screens: Screen[];
  isAr: boolean;
}

const AVAILABLE_ACTIONS = [
  { value: "view", labelAr: "عرض", labelEn: "View", activeColor: "bg-tertiary/10 text-tertiary border-tertiary/30 dark:bg-tertiary/20" },
  { value: "create", labelAr: "إضافة", labelEn: "Create", activeColor: "bg-primary/10 text-primary border-primary/30 dark:bg-primary/20" },
  { value: "edit", labelAr: "تعديل", labelEn: "Edit", activeColor: "bg-[#F9A826]/10 text-[#F9A826] border-[#F9A826]/30 dark:bg-[#F9A826]/20" },
  { value: "export", labelAr: "تصدير", labelEn: "Export", activeColor: "bg-violet-500/10 text-violet-600 border-violet-500/30 dark:bg-violet-500/20" },
  { value: "delete", labelAr: "حذف", labelEn: "Delete", activeColor: "bg-rose-500/10 text-rose-500 border-rose-500/30 dark:bg-rose-500/20" },
  { value: "archive", labelAr: "أرشفة", labelEn: "Archive", activeColor: "bg-amber-500/10 text-amber-500 border-amber-500/30 dark:bg-amber-500/20" },
];

export default function RoleFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  screens,
  isAr,
}: RoleFormModalProps) {
  const [roleName, setRoleName] = useState("");
  const [roleNameAr, setRoleNameAr] = useState("");
  const [entries, setEntries] = useState<PermissionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize form state
  useEffect(() => {
    if (initialData) {
      setRoleName(initialData.name);
      setRoleNameAr(initialData.nameAr || "");
      setEntries(
        initialData.permissions.map((p) => ({
          screenId: p.screenId,
          actions: p.actions || [],
        }))
      );
    } else {
      setRoleName("");
      setRoleNameAr("");
      setEntries([]);
    }
    setErrorMsg(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddEntry = () => {
    // Find the first screen that isn't already added
    const alreadyAdded = entries.map((e) => e.screenId);
    const available = screens.find((s) => !alreadyAdded.includes(s.id));
    
    if (!available && screens.length > 0) {
      setErrorMsg(
        isAr
          ? "لقد قمت بإضافة جميع الشاشات المتاحة بالفعل"
          : "All available screens have already been added"
      );
      return;
    }

    setEntries((prev) => [
      {
        screenId: available ? available.id : (screens[0]?.id || 0),
        actions: ["view"], // default action
      },
      ...prev,
    ]);
    setErrorMsg(null);
  };

  const handleRemoveEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
    setErrorMsg(null);
  };

  const handleScreenChange = (index: number, screenId: number) => {
    // Check if another row has the same screenId
    const isDuplicate = entries.some((e, i) => i !== index && e.screenId === screenId);
    if (isDuplicate) {
      setErrorMsg(
        isAr
          ? "هذه الشاشة تم تحديدها بالفعل في سطر آخر"
          : "This screen is already selected in another row"
      );
      return;
    }

    setEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, screenId } : entry))
    );
    setErrorMsg(null);
  };

  const handleToggleAction = (index: number, actionValue: string) => {
    setEntries((prev) =>
      prev.map((entry, i) => {
        if (i !== index) return entry;
        const exists = entry.actions.includes(actionValue);

        // Prevent removing "view" if "create" or "edit" are still on
        if (actionValue === "view" && exists) {
          const hasCreateOrEdit = entry.actions.some((a) => a === "create" || a === "edit");
          if (hasCreateOrEdit) return entry;
        }

        const updatedActions = exists
          ? entry.actions.filter((a) => a !== actionValue)
          : [...entry.actions, actionValue];

        // Auto-add "view" when "create" or "edit" is toggled on
        if (!exists && (actionValue === "create" || actionValue === "edit")) {
          if (!updatedActions.includes("view")) {
            updatedActions.push("view");
          }
        }

        return { ...entry, actions: updatedActions };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!roleName.trim()) {
      setErrorMsg(isAr ? "يرجى إدخال اسم الصلاحية باللغة الإنجليزية" : "Please enter role name in English");
      return;
    }

    if (!roleNameAr.trim()) {
      setErrorMsg(isAr ? "يرجى إدخال اسم الصلاحية باللغة العربية" : "Please enter role name in Arabic");
      return;
    }

    // Validate no duplicate screens
    const screenIds = entries.map((e) => e.screenId);
    const uniqueScreenIds = new Set(screenIds);
    if (screenIds.length !== uniqueScreenIds.size) {
      setErrorMsg(
        isAr
          ? "هناك تكرار في الشاشات المحددة"
          : "There are duplicate screens selected"
      );
      return;
    }

    setLoading(true);
    try {
      await onSave(roleName, roleNameAr, entries);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || (isAr ? "حدث خطأ أثناء الحفظ" : "An error occurred while saving"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary dark:bg-tertiary/10 dark:text-tertiary">
              <Shield size={18} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {initialData
                ? isAr
                  ? `تعديل صلاحية: ${initialData.name}`
                  : `Edit Role: ${initialData.name}`
                : isAr
                ? "إنشاء صلاحية جديدة"
                : "Create New Role"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900/50">
              {errorMsg}
            </div>
          )}

          {/* Role Names (English & Arabic) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                {isAr ? "اسم الصلاحية باللغة الإنجليزية" : "Role Name (English)"}
              </label>
              <input
                type="text"
                required
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. MARKETING_DIRECTOR"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary dark:focus:ring-tertiary outline-none text-slate-900 dark:text-white transition-all font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                {isAr ? "اسم الصلاحية باللغة العربية" : "Role Name (Arabic)"}
              </label>
              <input
                type="text"
                required
                value={roleNameAr}
                onChange={(e) => setRoleNameAr(e.target.value)}
                placeholder="مثال: مدير التسويق"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary dark:focus:ring-tertiary outline-none text-slate-900 dark:text-white transition-all font-semibold"
              />
            </div>
          </div>

          {/* Screens (One2Many) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {isAr ? "صلاحيات الشاشات والأزرار" : "Screen & Action Permissions"}
              </span>
              <button
                type="button"
                onClick={handleAddEntry}
                className="flex items-center gap-1 text-[11px] font-bold text-primary dark:text-tertiary hover:opacity-90 bg-primary/5 dark:bg-tertiary/5 px-2.5 py-1.5 rounded-lg border border-primary/10 dark:border-tertiary/10 transition-all cursor-pointer"
              >
                <Plus size={12} />
                {isAr ? "إضافة شاشة" : "Add Screen"}
              </button>
            </div>

            {entries.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/10">
                <Shield className="mx-auto text-slate-300 dark:text-slate-700 mb-2" size={28} />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr
                    ? "لا توجد شاشات مضافة لهذه الصلاحية حالياً. اضغط على زر 'إضافة شاشة' للبدء."
                    : "No screens mapped to this role yet. Click 'Add Screen' to start."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row md:items-center gap-3 p-4 bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/80 rounded-xl"
                  >
                    {/* Screen Selector */}
                    <div className="w-full md:w-1/3 space-y-1">
                      <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                        {isAr ? "الشاشة" : "Screen"}
                      </label>
                      <Select
                        value={entry.screenId}
                        onChange={(val) => handleScreenChange(index, Number(val))}
                        options={screens.map((s) => ({
                          value: s.id,
                          label: isAr && s.nameAr ? s.nameAr : s.name,
                        }))}
                      />
                    </div>

                    {/* Actions Multi-Select (Chips/Blogs) */}
                    <div className="flex-1 space-y-1">
                      <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                        {isAr ? "صلاحيات الأزرار (اضغط للتحديد)" : "Button Actions (Click to toggle)"}
                      </label>
                      <div className="flex flex-wrap gap-1.5 py-0.5">
                        {AVAILABLE_ACTIONS.map((action) => {
                          const isActive = entry.actions.includes(action.value);
                          return (
                            <button
                              key={action.value}
                              type="button"
                              onClick={() => handleToggleAction(index, action.value)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                isActive
                                  ? `${action.activeColor} border-current shadow-sm`
                                  : "bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"
                              }`}
                            >
                              {isAr ? action.labelAr : action.labelEn}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Remove Row Button */}
                    <div className="flex items-end justify-end self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveEntry(index)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                        title={isAr ? "حذف السطر" : "Remove Row"}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer"
          >
            {isAr ? "إلغاء" : "Cancel"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-bold text-white bg-primary hover:opacity-95 rounded-xl transition-all cursor-pointer shadow-md shadow-primary/10 flex items-center gap-1.5"
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : null}
            {isAr ? "حفظ" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
