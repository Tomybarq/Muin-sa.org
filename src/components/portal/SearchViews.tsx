"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/AuthContext";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  SlidersHorizontal,
  FolderOpen,
  Star,
  Check,
  List,
  Grid,
  ChevronUp,
  Trash2
} from "lucide-react";

export interface FilterPreset {
  id: string;
  label: string;
  filterFunc: (item: any) => boolean;
}

export interface GroupByOption {
  id: string;
  label: string;
  groupByFunc: (item: any) => string;
  groupLabelFunc?: (key: string, items: any[]) => string;
}

interface SearchViewsProps {
  title: string;
  newButtonLabel?: string;
  onNewClick?: () => void;
  hasCreatePermission?: boolean;
  bulkActionsNode?: React.ReactNode;
  items: any[];
  searchFields: string[];
  filterPresets?: FilterPreset[];
  groupByOptions?: GroupByOption[];
  pageSize?: number;
  locale: string;
  viewMode?: "list" | "kanban";
  onViewModeChange?: (mode: "list" | "kanban") => void;
  children: (props: {
    currentPageItems: any[];
    groupedItems: Record<string, any[]> | null;
    activeGroupBy: GroupByOption | null;
    expandedGroups: Record<string, boolean>;
    toggleGroup: (groupKey: string) => void;
    sortColumn: string | null;
    sortDirection: "asc" | "desc";
    onSort: (field: string) => void;
  }) => React.ReactNode;
}

export default function SearchViews({
  title,
  newButtonLabel,
  onNewClick,
  hasCreatePermission = false,
  bulkActionsNode,
  items,
  searchFields,
  filterPresets = [],
  groupByOptions = [],
  pageSize = 40,
  locale,
  viewMode = "list",
  onViewModeChange,
  children,
}: SearchViewsProps) {
  const isAr = locale === "ar";
  const { user } = useAuth();
  const t = useTranslations("controlPanel");

  interface SavedFavorite {
    id: string;
    name: string;
    searchQuery: string;
    activeFilterIds: string[];
    activeGroupById: string | null;
  }

  const [favorites, setFavorites] = useState<SavedFavorite[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [favoriteName, setFavoriteName] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterIds, setActiveFilterIds] = useState<string[]>([]);
  const [activeGroupById, setActiveGroupById] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const storageKey = `maeen_fav_searches_${user?.id || "guest"}_${title}`;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setFavorites(JSON.parse(stored));
      } else {
        setFavorites([]);
      }
    } catch (e) {
      console.error(e);
    }
  }, [user, title, storageKey]);

  const saveFavoritesToStorage = (updated: SavedFavorite[]) => {
    setFavorites(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Read initial URL params for presets / filters
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const priority = params.get("priority");
      const health = params.get("healthStatus");
      const marital = params.get("maritalStatus");
      const housing = params.get("housingType");

      const initialActive: string[] = [];
      if (priority) {
        const found = filterPresets.find((p) => p.id === priority);
        if (found) initialActive.push(found.id);
      }
      if (health) {
        const found = filterPresets.find((p) => p.id.includes(health) || p.label.includes(health));
        if (found) initialActive.push(found.id);
      }
      if (marital) {
        const found = filterPresets.find((p) => p.id.includes(marital) || p.label.includes(marital));
        if (found) initialActive.push(found.id);
      }
      if (housing) {
        const found = filterPresets.find((p) => p.id.includes(housing) || p.label.includes(housing));
        if (found) initialActive.push(found.id);
      }

      if (initialActive.length > 0) {
        setActiveFilterIds(initialActive);
      }
    }
  }, [filterPresets]);

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilterIds, activeGroupById]);

  // Trigger archived items lazy fetch when archived-items filter becomes active
  useEffect(() => {
    if (activeFilterIds.includes("archived-items")) {
      const archivedPreset = filterPresets.find((p) => p.id === "archived-items");
      if (archivedPreset) {
        archivedPreset.filterFunc({ isArchived: true });
      }
    }
  }, [activeFilterIds, filterPresets]);

  const getNestedValue = (obj: any, path: string) => {
    const parts = path.split(".");
    let val: any = obj;
    for (const part of parts) {
      if (val === null || val === undefined) return "";
      val = val[part];
    }
    return val ?? "";
  };

  const onSort = (field: string) => {
    if (sortColumn === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(field);
      setSortDirection("asc");
    }
  };

  // 1. Text Search & Filter Presets Engine
  const isArchivedFilterActive = activeFilterIds.includes("archived-items");

  const filteredItems = items.filter((item) => {
    // Default archiving check: hide archived items unless 'archived-items' filter preset is selected
    if (isArchivedFilterActive) {
      if (!item.isArchived) return false;
    } else {
      if (item.isArchived) return false;
    }

    // Text search check
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = searchFields.some((field) => {
        const parts = field.split(".");
        let val: any = item;
        for (const part of parts) {
          val = val?.[part];
        }
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(query);
      });
      if (!matchesSearch) return false;
    }

    // Preset filters check (AND combination)
    for (const filterId of activeFilterIds) {
      if (filterId === "archived-items") continue; // Handled above
      const preset = filterPresets.find((p) => p.id === filterId);
      if (preset && !preset.filterFunc(item)) {
        return false;
      }
    }

    return true;
  });

  // 1.5. Sort Engine
  const sortedItems = sortColumn
    ? [...filteredItems].sort((a, b) => {
        const valA = String(getNestedValue(a, sortColumn)).toLowerCase();
        const valB = String(getNestedValue(b, sortColumn)).toLowerCase();
        const cmp = valA.localeCompare(valB, isAr ? "ar" : "en", { numeric: true });
        return sortDirection === "asc" ? cmp : -cmp;
      })
    : filteredItems;

  // 2. Pagination calculation
  const totalCount = filteredItems.length;
  const isGrouped = activeGroupById !== null;
  const totalPages = isGrouped ? 1 : Math.ceil(totalCount / pageSize);
  const startIndex = isGrouped ? 0 : (currentPage - 1) * pageSize;
  const endIndex = isGrouped ? totalCount : Math.min(startIndex + pageSize, totalCount);

  const currentPageItems = isGrouped
    ? sortedItems
    : sortedItems.slice(startIndex, endIndex);

  // 3. Grouping calculation
  const activeGroupBy = groupByOptions.find((g) => g.id === activeGroupById) || null;
  let groupedItems: Record<string, any[]> | null = null;

  if (activeGroupBy) {
    groupedItems = {};
    sortedItems.forEach((item) => {
      const key = activeGroupBy.groupByFunc(item) || (isAr ? "غير محدد" : "Unspecified");
      if (!groupedItems![key]) {
        groupedItems![key] = [];
      }
      groupedItems![key].push(item);
    });
  }

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: prev[groupKey] === false ? true : false,
    }));
  };

  const toggleFilter = (filterId: string) => {
    setActiveFilterIds((prev) =>
      prev.includes(filterId) ? prev.filter((id) => id !== filterId) : [...prev, filterId]
    );
  };

  const toggleGroupBy = (groupById: string) => {
    setActiveGroupById((prev) => (prev === groupById ? null : groupById));
    setExpandedGroups({});
  };

  const removeFilterTag = (filterId: string) => {
    setActiveFilterIds((prev) => prev.filter((id) => id !== filterId));
  };

  const removeGroupByTag = () => {
    setActiveGroupById(null);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  return (
    <div className="space-y-4">
      {/* Control bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md">

        {/* Title + New Button */}
        <div className="flex items-center gap-3 shrink-0">
          <h1 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">
            {title}
          </h1>
          {hasCreatePermission && onNewClick && (
            <button
              onClick={onNewClick}
              className="bg-primary hover:opacity-95 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-primary/10 cursor-pointer"
            >
              <Plus size={14} />
              {newButtonLabel || (isAr ? "إضافة" : "Add")}
            </button>
          )}
          {bulkActionsNode}
        </div>

        {/* Search bar with inline tags */}
        <div className="flex-1 max-w-2xl relative" ref={dropdownRef}>
          <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            <Search size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />

            {/* Active tags inside search bar */}
            <div className="flex flex-wrap gap-1.5 items-center mx-2">
              {activeFilterIds.map((filterId) => {
                const preset = filterPresets.find((p) => p.id === filterId);
                if (!preset) return null;
                return (
                  <span
                    key={filterId}
                    className="flex items-center gap-1 bg-primary/10 dark:bg-tertiary/10 text-primary dark:text-tertiary text-[11px] font-bold px-2 py-0.5 rounded-lg border border-primary/20 dark:border-tertiary/20 whitespace-nowrap"
                  >
                    <span>{preset.label}</span>
                    <button
                      onClick={() => removeFilterTag(filterId)}
                      className="hover:bg-primary/20 dark:hover:bg-tertiary/20 rounded-md p-0.5 cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </span>
                );
              })}

              {activeGroupBy && (
                <span className="flex items-center gap-1 bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[11px] font-bold px-2 py-0.5 rounded-lg border border-violet-500/20 whitespace-nowrap">
                  <FolderOpen size={10} />
                  <span>{activeGroupBy.label}</span>
                  <button
                    onClick={removeGroupByTag}
                    className="hover:bg-violet-500/20 rounded-md p-0.5 cursor-pointer"
                  >
                    <X size={10} />
                  </button>
                </span>
              )}
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("search")}
              className="flex-1 bg-transparent border-0 outline-none text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 py-1 min-w-[80px]"
            />

            <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2 shrink-0" />
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer transition-colors shrink-0"
              title={t("options")}
            >
              {isDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Dropdown panel */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/90 rounded-2xl shadow-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Filters */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                  <SlidersHorizontal size={14} className="text-primary" />
                  <span>{t("filters")}</span>
                </div>
                <div className="space-y-1">
                  {filterPresets.map((preset) => {
                    const active = activeFilterIds.includes(preset.id);
                    return (
                      <button
                        key={preset.id}
                        onClick={() => toggleFilter(preset.id)}
                        className={`flex items-center justify-between w-full text-start text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer ${
                          active
                            ? "bg-primary/5 text-primary dark:text-tertiary"
                            : "hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <span>{preset.label}</span>
                        {active && <Check size={14} />}
                      </button>
                    );
                  })}
                  {filterPresets.length === 0 && (
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 py-1">
                      {t("noPresets")}
                    </div>
                  )}
                </div>
              </div>

              {/* Group By */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                  <FolderOpen size={14} className="text-violet-500" />
                  <span>{t("groupBy")}</span>
                </div>
                <div className="space-y-1">
                  {groupByOptions.map((opt) => {
                    const active = activeGroupById === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleGroupBy(opt.id)}
                        className={`flex items-center justify-between w-full text-start text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer ${
                          active
                            ? "bg-violet-500/5 text-violet-600 dark:text-violet-400"
                            : "hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {active && <Check size={14} />}
                      </button>
                    );
                  })}
                  {groupByOptions.length === 0 && (
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 py-1">
                      {t("noGrouping")}
                    </div>
                  )}
                </div>
              </div>

              {/* Favorites */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Star size={14} className="text-amber-500" />
                  <span>{t("favorites")}</span>
                </div>
                <div className="space-y-1">
                  {favorites.map((fav) => {
                    const isActive =
                      searchQuery === fav.searchQuery &&
                      activeFilterIds.length === fav.activeFilterIds.length &&
                      activeFilterIds.every((id) => fav.activeFilterIds.includes(id)) &&
                      activeGroupById === fav.activeGroupById;
                    return (
                      <div
                        key={fav.id}
                        onClick={() => {
                          setSearchQuery(fav.searchQuery);
                          setActiveFilterIds(fav.activeFilterIds);
                          setActiveGroupById(fav.activeGroupById);
                        }}
                        className={`flex items-center justify-between w-full text-start text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer ${
                          isActive
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <span className="truncate pr-2">{fav.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = favorites.filter((f) => f.id !== fav.id);
                            saveFavoritesToStorage(updated);
                          }}
                          className="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors cursor-pointer shrink-0"
                          title={isAr ? "حذف" : "Delete"}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                  {favorites.length === 0 && (
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 py-1.5 px-3">
                      {t("noFavorites")}
                    </div>
                  )}

                  {isSaving ? (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <input
                        type="text"
                        value={favoriteName}
                        onChange={(e) => setFavoriteName(e.target.value)}
                        placeholder={t("enterFavoriteName")}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        maxLength={30}
                      />
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            if (!favoriteName.trim()) return;
                            const newFav: SavedFavorite = {
                              id: String(Date.now()),
                              name: favoriteName.trim(),
                              searchQuery,
                              activeFilterIds,
                              activeGroupById,
                            };
                            saveFavoritesToStorage([...favorites, newFav]);
                            setFavoriteName("");
                            setIsSaving(false);
                          }}
                          className="flex-1 bg-primary text-white text-[10px] font-bold py-1.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          {t("save")}
                        </button>
                        <button
                          onClick={() => {
                            setFavoriteName("");
                            setIsSaving(false);
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          {t("cancel")}
                        </button>
                      </div>
                    </div>
                  ) : favorites.length >= 3 ? (
                    <div className="text-[11px] text-amber-500 font-medium py-1.5 px-3 bg-amber-500/5 dark:bg-amber-500/10 rounded-xl border border-amber-500/10 mt-1">
                      {t("maxFavoritesReached")}
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsSaving(true)}
                      className="flex items-center w-full text-start text-xs font-semibold px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-primary dark:text-tertiary cursor-pointer mt-1"
                    >
                      <Plus size={12} className="me-1.5 shrink-0" />
                      <span>{t("saveCurrentSearch")}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pagination + View Switcher */}
        <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">

          {/* Pagination display */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 tracking-wider tabular-nums">
              {isGrouped ? (
                <span>{t("grouped", { count: totalCount })}</span>
              ) : totalCount === 0 ? (
                "0"
              ) : (
                `${startIndex + 1}-${endIndex} / ${totalCount}`
              )}
            </span>

            {/* Arrow buttons */}
            <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1 || isGrouped}
                className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer border-e border-slate-200 dark:border-slate-800"
              >
                {isAr ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages || isGrouped}
                className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {isAr ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
              </button>
            </div>
          </div>

          {/* View switcher */}
          <div className="hidden sm:flex items-center border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
            <button
              onClick={() => onViewModeChange?.("list")}
              className={`p-1.5 transition-colors cursor-pointer border-e border-slate-200 dark:border-slate-800 ${
                viewMode === "list"
                  ? "bg-slate-100 dark:bg-slate-900 text-primary dark:text-tertiary"
                  : "text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900/50"
              }`}
              title={t("listView")}
            >
              <List size={14} />
            </button>
            <button
              onClick={() => onViewModeChange?.("kanban")}
              className={`p-1.5 transition-colors cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-slate-100 dark:bg-slate-900 text-primary dark:text-tertiary"
                  : "text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900/50"
              }`}
              title={t("kanbanView")}
            >
              <Grid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Render children with processed data */}
      {children({
        currentPageItems,
        groupedItems,
        activeGroupBy,
        expandedGroups,
        toggleGroup,
        sortColumn,
        sortDirection,
        onSort,
      })}
    </div>
  );
}
