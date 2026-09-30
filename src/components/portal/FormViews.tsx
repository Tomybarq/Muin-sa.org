"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Pencil, Settings, Trash2, Archive, ArchiveRestore, ChevronRight, ChevronLeft, ChevronUp, ChevronDown } from "lucide-react";
import Ribbon from "@/components/ui/Ribbon";
import type { RibbonProps } from "@/components/ui/Ribbon";

interface FormViewsProps {
  mode: "view" | "create" | "edit";
  screenName: string;
  recordName?: string;
  children: React.ReactNode;
  onSave?: () => void;
  onCancel?: () => void;
  onAdd?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  isArchived?: boolean;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  recordIndex?: number;
  totalRecords?: number;
  submitting?: boolean;
  hasCreatePermission?: boolean;
  hasEditPermission?: boolean;
  hasDeletePermission?: boolean;
  hasArchivePermission?: boolean;
  extraActions?: { label: string; labelAr: string; icon: React.ReactNode; onClick: () => void; loading?: boolean }[];
  ribbon?: RibbonProps;
  locale: string;
  onClose: () => void;
}

export default function FormViews({
  mode,
  screenName,
  recordName,
  children,
  onSave,
  onCancel,
  onAdd,
  onEdit,
  onDelete,
  onArchive,
  onUnarchive,
  isArchived,
  submitting,
  hasPrev,
  hasNext,
  recordIndex,
  totalRecords,
  onNavigatePrev,
  onNavigateNext,
  hasCreatePermission = true,
  hasEditPermission = true,
  hasDeletePermission = true,
  hasArchivePermission = true,
  extraActions,
  ribbon,
  locale,
  onClose,
}: FormViewsProps) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isAr = locale === "ar";
  const isFormMode = mode === "create" || mode === "edit";
  const isViewMode = mode === "view";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header Bar - outside card */}
      <div className="flex items-start sm:items-center justify-between gap-4 px-1">
        {/* Left: Add/Edit in view mode, Save/Cancel in form mode */}
        <div className="flex items-center gap-2 shrink-0 pt-0.5 flex-wrap">
          {isFormMode ? (
            <>
              <button
                type="button"
                onClick={onCancel}
                className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg sm:rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={submitting}
                className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold bg-primary dark:bg-tertiary text-white rounded-lg md:rounded-xl hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>
                  {submitting
                    ? (isAr ? "جاري الحفظ..." : "Saving...")
                    : (isAr ? "حفظ" : "Save")}
                </span>
              </button>
            </>
          ) : (
            <>
              {hasCreatePermission && (
                <button
                  type="button"
                  onClick={onAdd}
                  className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-primary dark:bg-tertiary hover:opacity-90 text-white font-bold text-xs sm:text-sm rounded-lg sm:rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  <span>{isAr ? "إضافة" : "Add"}</span>
                </button>
              )}
              {hasEditPermission && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-secondary hover:opacity-90 text-white font-bold text-xs sm:text-sm rounded-lg sm:rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Pencil size={16} strokeWidth={2.5} />
                  <span>{isAr ? "تعديل" : "Edit"}</span>
                </button>
              )}
            </>
          )}
          {/* Right: Screen name + Record name + Actions */}
          <div className="flex flex-col min-w-0 w-full sm:w-auto">
            <div>
              <button
                type="button"
                onClick={onClose}
                className="text-sm sm:text-base font-bold text-primary dark:text-tertiary hover:underline truncate cursor-pointer"
              >
                {screenName}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {recordName && (
                <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 truncate">
                  {recordName}
                </span>
              )}
              {isViewMode && (hasArchivePermission || onUnarchive || hasDeletePermission || (extraActions && extraActions.length > 0)) && (
                <div ref={dropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setActionsOpen(!actionsOpen)}
                    className="transition-all cursor-pointer"
                    title={isAr ? "إجراءات" : "Actions"}
                  >
                    <Settings size={18} className="text-primary dark:text-tertiary" />
                  </button>
                  {actionsOpen && (
                    <div className={`absolute start-0 mt-2 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150 ${extraActions ? 'w-48' : 'w-40'}`}>
                      {extraActions?.map((action, i) => (
                        <button
                          key={i}
                          type="button"
                          disabled={action.loading}
                          onClick={() => { action.onClick(); if (!action.loading) setActionsOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-start transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {action.loading ? (
                            <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          ) : action.icon}
                          <span>{isAr ? action.labelAr : action.label}</span>
                        </button>
                      ))}
                      {extraActions && extraActions.length > 0 && (hasArchivePermission || onUnarchive || hasDeletePermission) && (
                        <div className="border-t border-slate-100 dark:border-slate-800 mx-2 my-1" />
                      )}

                      {/* 1. Archive button (when record is active) */}
                      {hasArchivePermission && onArchive && !isArchived && (
                        <button
                          type="button"
                          onClick={() => { onArchive?.(); setActionsOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-start transition-colors cursor-pointer"
                        >
                          <Archive size={14} className="text-slate-400" />
                          <span>{isAr ? "أرشفة" : "Archive"}</span>
                        </button>
                      )}

                      {/* 2. Unarchive button (when record is archived) */}
                      {hasArchivePermission && onUnarchive && isArchived && (
                        <button
                          type="button"
                          onClick={() => { onUnarchive?.(); setActionsOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20 text-start transition-colors cursor-pointer"
                        >
                          <ArchiveRestore size={14} className="text-teal-500" />
                          <span>{isAr ? "إلغاء الأرشفة" : "Unarchive"}</span>
                        </button>
                      )}

                      {/* 3. Delete button */}
                      {hasDeletePermission && onDelete && (
                        <button
                          type="button"
                          onClick={() => { onDelete?.(); setActionsOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-start transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} className="text-rose-400" />
                          <span>{isAr ? "حذف" : "Delete"}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Screen name + Record name + Actions */}
        <div className="flex flex-col items-end min-w-0">
          <div className="flex items-center gap-2">
            {/* Record navigation */}
            {mode !== "create" && (
              <div className="flex items-center gap-1 ms-1">
                <span className="text-base font-semibold text-slate-400 dark:text-slate-500 tabular-nums min-w-[3ch] text-center">
                  {recordIndex}/{totalRecords}
                </span>
                <button
                  type="button"
                  onClick={onNavigatePrev}
                  disabled={!hasPrev}
                  className="p-1 sm:p-2 rounded-lg md:rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-700 shadow-sm"
                  title={isAr ? "السابق" : "Previous"}
                >
                  {isAr ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
                <button
                  type="button"
                  onClick={onNavigateNext}
                  disabled={!hasNext}
                  className="p-1 sm:p-2 rounded-lg md:rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-700 shadow-sm"
                  title={isAr ? "التالي" : "Next"}
                >
                  {isAr ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card with form fields */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden relative">
        {ribbon && <Ribbon {...ribbon} locale={locale} />}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
