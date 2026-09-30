"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, Check, X } from "lucide-react";

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  error,
  className = "",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [search, setSearch] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, position: "bottom" as "bottom" | "top" });
  
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Detect mobile device viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 639px)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Lock body scroll when mobile bottom sheet is open
  useEffect(() => {
    if (open && isMobile) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open, isMobile]);

  // Click outside listener for desktop dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        const dropdown = document.getElementById("select-dropdown");
        if (dropdown && dropdown.contains(e.target as Node)) return;
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle scroll or resize for desktop dropdown positioning
  useEffect(() => {
    if (!open || isMobile) return;
    const handleScrollOrResize = (e: Event) => {
      const dd = document.getElementById("select-dropdown");
      if (dd && dd.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open, isMobile]);

  // Calculate position coordinates for desktop dropdown
  useEffect(() => {
    if (open && ref.current) {
      if (!isMobile) {
        const rect = ref.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const position = spaceBelow < 230 && spaceAbove > spaceBelow ? "top" : "bottom";
        setCoords({ top: rect.top, left: rect.left, width: rect.width, position });
      }
      setSearch("");
    }
  }, [open, isMobile]);

  const filtered = useMemo(
    () =>
      search
        ? options.filter((o) =>
            o.label.toLowerCase().includes(search.toLowerCase())
          )
        : options,
    [search, options]
  );

  const selected = options.find((o) => o.value === value);
  const isEmpty = value === 0 || value === "" || value === "0";

  const handleSelectOption = (optValue: string | number) => {
    const nextVal = optValue === value ? "" : optValue;
    onChange(nextVal);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((prev) => !prev);
    } else if (e.key === "Escape") {
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "ArrowDown" && !open) {
      e.preventDefault();
      setOpen(true);
    }
  };

  const base = `relative w-full text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg transition-colors cursor-pointer ${
    error
      ? "border-red-500 dark:border-red-400"
      : "border-slate-200 dark:border-slate-800"
  } ${disabled ? "bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-default" : "text-slate-900 dark:text-white"} ${focused ? "ring-2 ring-primary/20 dark:ring-tertiary/20 border-primary dark:border-tertiary" : ""} ${className}`;

  return (
    <div ref={ref} className={base}>
      <div
        ref={triggerRef}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        className="flex items-center justify-between px-3 py-2 min-h-[42px] sm:min-h-[38px] outline-none rounded-lg"
        onClick={() => !disabled && setOpen(!open)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={(e) => { if (!ref.current?.contains(e.relatedTarget as Node)) setFocused(false); }}
      >
        <span className={isEmpty || !selected ? "text-slate-400 dark:text-slate-500" : "font-medium"}>
          {selected && !isEmpty ? selected.label : placeholder || ""}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </div>

      {open && !disabled && typeof window !== "undefined" && createPortal(
        isMobile ? (
          /* Mobile Bottom Sheet Layout */
          <div
            id="select-dropdown"
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex flex-col justify-end transition-opacity duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div className="bg-white dark:bg-slate-900 w-full rounded-t-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom duration-200">
              {/* Pull handle indicator */}
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 shrink-0" />
              
              {/* Bottom sheet header */}
              <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-base font-semibold text-slate-900 dark:text-white">
                  {placeholder || "اختر من القائمة"}
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-2 -me-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search bar (text-base prevents iOS Safari auto-zoom) */}
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <Search size={18} className="text-slate-400 shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="بحث..."
                    className="w-full bg-transparent text-base text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
                    autoFocus
                  />
                  {search && (
                    <button type="button" onClick={() => setSearch("")} className="text-slate-400 p-1">
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Options list with 44px+ touch targets */}
              <div className="overflow-y-auto flex-1 min-h-[160px] max-h-[50vh] p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.length === 0 ? (
                  <div className="px-4 py-8 text-center text-base text-slate-400 dark:text-slate-500">
                    لا توجد نتائج مطابقة
                  </div>
                ) : (
                  filtered.map((opt) => {
                    const isSelected = opt.value === value;
                    return (
                      <div
                        key={opt.value}
                        onClick={() => handleSelectOption(opt.value)}
                        className={`flex items-center justify-between px-4 py-3.5 min-h-[48px] rounded-xl text-base transition-colors cursor-pointer active:bg-slate-100 dark:active:bg-slate-800 ${
                          isSelected
                            ? "bg-primary/10 dark:bg-tertiary/10 text-primary dark:text-tertiary font-semibold"
                            : "text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-5 h-5 text-primary dark:text-tertiary shrink-0 ms-2" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Desktop Dropdown Popover Layout */
          <div
            id="select-dropdown"
            style={{
              position: "fixed",
              top: coords.position === "bottom" ? `${coords.top + (ref.current?.offsetHeight || 38) + 4}px` : `${coords.top - 4}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxHeight: "240px",
              transform: coords.position === "top" ? "translateY(-100%)" : undefined,
            }}
            className="z-[9999] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden flex flex-col"
          >
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-2">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-md">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث..."
                  className="w-full bg-transparent text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 max-h-[180px] p-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-3 text-sm text-slate-400 dark:text-slate-500 text-center">
                  لا توجد نتائج
                </div>
              ) : (
                filtered.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <div
                      key={opt.value}
                      onClick={() => handleSelectOption(opt.value)}
                      className={`flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/10 dark:bg-tertiary/10 text-primary dark:text-tertiary font-medium"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-primary dark:text-tertiary shrink-0 ms-1.5" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ),
        document.body
      )}
    </div>
  );
}
