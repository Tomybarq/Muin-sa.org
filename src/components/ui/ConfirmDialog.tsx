"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const isDanger = variant === "danger";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#0B0F19] rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDanger ? "bg-red-50 dark:bg-red-950/30 text-red-500" : "bg-amber-50 dark:bg-amber-950/30 text-amber-500"}`}>
            <AlertTriangle size={20} />
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 pt-3 pb-5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex items-center gap-2.5 px-5 pb-5">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
          >
            {cancelLabel || "إلغاء"}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 text-xs font-bold text-white rounded-xl cursor-pointer transition-all disabled:opacity-40 ${isDanger ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"}`}
          >
            {loading ? "..." : (confirmLabel || "تأكيد")}
          </button>
        </div>
      </div>
    </div>
  );
}
