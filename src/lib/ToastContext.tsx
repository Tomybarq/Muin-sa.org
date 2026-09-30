"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    setToasts((prev) => {
      if (prev.some((t) => t.message === message)) return prev;
      const id = Math.random().toString(36).substring(2, 9);
      return [...prev, { id, message, type }];
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Floating Toasts Container */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] flex flex-col gap-3 items-center pointer-events-none w-full max-w-md px-4">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgClasses = {
    success: "bg-emerald-50/95 dark:bg-emerald-950/95 border-emerald-200/50 dark:border-emerald-900/50 text-emerald-850 dark:text-emerald-250",
    error: "bg-rose-50/95 dark:bg-rose-950/95 border-rose-200/50 dark:border-rose-900/50 text-rose-850 dark:text-rose-250",
    info: "bg-sky-50/95 dark:bg-sky-950/95 border-sky-200/50 dark:border-sky-900/50 text-sky-850 dark:text-sky-255",
  };

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  }[toast.type];

  return (
    <div
      className={`
        pointer-events-auto flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-md
        animate-in slide-in-from-top-4 duration-300 w-full max-w-sm
        ${bgClasses[toast.type]}
      `}
    >
      <div className="flex items-center gap-2.5">
        <Icon className="shrink-0 animate-pulse text-current" size={18} />
        <span className="text-xs font-semibold leading-relaxed text-current">{toast.message}</span>
      </div>
      <button
        onClick={onClose}
        className="shrink-0 p-1 hover:opacity-70 rounded-lg transition-opacity cursor-pointer text-current"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
