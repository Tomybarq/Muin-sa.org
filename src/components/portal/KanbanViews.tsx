"use client";

import React from "react";
import { Building, ChevronDown, ChevronUp } from "lucide-react";
import { GroupByOption } from "./SearchViews";

interface KanbanViewsProps {
  currentPageItems: any[];
  groupedItems: Record<string, any[]> | null;
  activeGroupBy: GroupByOption | null;
  expandedGroups: Record<string, boolean>;
  toggleGroup: (groupKey: string) => void;
  renderCard: (item: any) => React.ReactNode;
  locale: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export default function KanbanViews({
  currentPageItems,
  groupedItems,
  activeGroupBy,
  expandedGroups,
  toggleGroup,
  renderCard,
  locale,
  emptyTitle,
  emptyDescription,
}: KanbanViewsProps) {
  const isAr = locale === "ar";

  if (currentPageItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Building size={48} className="text-slate-200 dark:text-slate-800 mb-4" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          {emptyTitle || (isAr ? "لا توجد عناصر" : "No items")}
        </p>
        {emptyDescription && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{emptyDescription}</p>
        )}
      </div>
    );
  }

  const gridCls = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4";

  if (activeGroupBy && groupedItems) {
    const groupKeys = Object.keys(groupedItems);
    return (
      <div className="max-h-[calc(100vh-290px)] md:max-h-[calc(100vh-240px)] overflow-y-auto p-1 -m-1">
        <div className="space-y-6">
          {groupKeys.map((groupKey) => {
            const items = groupedItems[groupKey];
            const isExpanded = expandedGroups[groupKey] !== false;
            const label = activeGroupBy.groupLabelFunc
              ? activeGroupBy.groupLabelFunc(groupKey, items)
              : `${groupKey} (${items.length})`;

            return (
              <div key={groupKey}>
                <button
                  onClick={() => toggleGroup(groupKey)}
                  className="flex items-center gap-2 w-full text-start px-1 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  <span>{label}</span>
                </button>
                {isExpanded && (
                  <div className={`${gridCls} mt-3`}>
                    {items.map((item: any, i: number) => (
                      <div key={item.id ?? i} className="contents">{renderCard(item)}</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-[calc(100vh-290px)] md:max-h-[calc(100vh-240px)] overflow-y-auto p-1 -m-1">
      <div className={`${gridCls} mt-6`}>
        {currentPageItems.map((item: any, i: number) => (
          <div key={item.id ?? i} className="contents">{renderCard(item)}</div>
        ))}
      </div>
    </div>
  );
}
