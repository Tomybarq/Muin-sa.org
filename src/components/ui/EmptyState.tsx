"use client";

import { Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-tertiary/10 dark:from-primary/5 dark:to-tertiary/5 flex items-center justify-center mb-6 ring-1 ring-primary/10 dark:ring-tertiary/10">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/15 to-tertiary/15 dark:from-primary/10 dark:to-tertiary/10 flex items-center justify-center">
          <Icon size={32} className="text-primary dark:text-tertiary stroke-[1.5]" />
        </div>
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-primary dark:bg-tertiary hover:opacity-90 px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-primary/15 dark:shadow-tertiary/15"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
