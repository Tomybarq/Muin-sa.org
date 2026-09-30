"use client";

import React from "react";
import { ChevronDown, LucideIcon } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

interface ListViewsProps<T> {
  renderTableHeader: (items: T[], sortInfo?: {
    sortColumn: string | null;
    sortDirection: "asc" | "desc";
    onSort: (field: string) => void;
  }) => React.ReactNode;
  renderRow: (item: T) => React.ReactNode;
  emptyState?: React.ReactNode;
  emptyTitle: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  currentPageItems: T[];
  groupedItems: Record<string, T[]> | null;
  expandedGroups: Record<string, boolean>;
  toggleGroup: (groupKey: string) => void;
  locale: string;
  sortColumn?: string | null;
  sortDirection?: "asc" | "desc";
  onSort?: (field: string) => void;
}

export default function ListViews<T>({
  renderTableHeader,
  renderRow,
  emptyState,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyAction,
  currentPageItems,
  groupedItems,
  expandedGroups,
  toggleGroup,
  locale,
  sortColumn,
  sortDirection = "asc",
  onSort,
}: ListViewsProps<T>) {
  const renderGroupChevron = (isExpanded: boolean) => {
    const rotation = isExpanded ? "rotate-0" : "-rotate-90";
    return (
      <ChevronDown
        size={16}
        className={`text-slate-500 transition-transform duration-200 ${rotation}`}
      />
    );
  };

  const sortInfo = onSort ? { sortColumn: sortColumn ?? null, sortDirection, onSort } : undefined;

  if (groupedItems) {
    const allItems = Object.values(groupedItems).flat();

    return (
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm max-h-[calc(100vh-290px)] md:max-h-[calc(100vh-240px)] overflow-y-auto">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse min-w-[500px] sm:min-w-0 whitespace-nowrap">
            {renderTableHeader(allItems, sortInfo)}
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm">
              {Object.entries(groupedItems).map(([groupKey, groupItems]) => {
                const isExpanded = expandedGroups[groupKey] === true;
                return (
                  <React.Fragment key={groupKey}>
                    <tr>
                      <td colSpan={99} className="p-0">
                        <button
                          onClick={() => toggleGroup(groupKey)}
                          className="w-full flex items-center justify-between px-4 sm:px-5 py-3 bg-slate-50/80 dark:bg-slate-900/60 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            {renderGroupChevron(isExpanded)}
                            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                              {groupKey}
                            </span>
                            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-slate-800/60 px-2 py-0.5 rounded-full">
                              {groupItems.length}
                            </span>
                          </div>
                        </button>
                      </td>
                    </tr>
                    {isExpanded && groupItems.map(renderRow)}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm max-h-[calc(100vh-290px)] md:max-h-[calc(100vh-240px)] overflow-y-auto">
      {currentPageItems.length === 0 ? (
        emptyState || (
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
          />
        )
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse min-w-[500px] sm:min-w-0 whitespace-nowrap">
            {renderTableHeader(currentPageItems, sortInfo)}
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm">
              {currentPageItems.map(renderRow)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
