"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";

interface Option {
  value: string;
  label: string;
  labelEn: string;
}

interface Many2ManyTagsProps {
  label: string;
  options: Option[];
  value: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function Many2ManyTags({
  label,
  options,
  value,
  onChange,
  disabled = false,
  placeholder,
}: Many2ManyTagsProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, position: "bottom" as "bottom" | "top" });
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter(
    (o) =>
      o.label.toLowerCase().includes(search.toLowerCase()) ||
      o.labelEn.toLowerCase().includes(search.toLowerCase())
  );

  const allSelected = value.length >= options.length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        const dd = document.getElementById("many2many-dropdown");
        if (dd && dd.contains(e.target as Node)) return;
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleScrollOrResize = (e: Event) => {
      const dd = document.getElementById("many2many-dropdown");
      if (dd && dd.contains(e.target as Node)) return;
      setOpen(false);
    };
    const handleResize = () => setOpen(false);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [open]);

  useEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const position = spaceBelow < 250 && spaceAbove > spaceBelow ? "top" : "bottom";
      setCoords({ top: rect.top, left: rect.left, width: rect.width, position });
      setSearch("");
    }
  }, [open]);

  function toggle(val: string) {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
        {label}
      </label>
      <div
        onClick={() => { if (!disabled) setOpen(!open); }}
        className={`flex flex-wrap items-center gap-1.5 min-h-[38px] px-2 py-1 text-sm rounded-lg border transition-colors ${
          disabled
            ? "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 cursor-default"
            : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-pointer hover:border-primary/50 dark:hover:border-tertiary/50"
        }`}
      >
        {value.map((v) => {
          const opt = options.find((o) => o.value === v);
          if (!opt) return null;
          return (
            <span
              key={v}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-primary/10 dark:bg-tertiary/10 text-primary dark:text-tertiary rounded-md"
            >
              {opt.label}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggle(v); }}
                  className="hover:text-red-500 transition-colors cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </span>
          );
        })}
        {!disabled && !allSelected && value.length === 0 && (
          <span className="text-slate-400 text-xs">{placeholder || "..."}</span>
        )}
      </div>

      {open && !disabled && typeof window !== "undefined" && createPortal(
        <div
          id="many2many-dropdown"
          style={{
            position: "fixed",
            top: coords.position === "bottom" ? `${coords.top + containerRef.current!.offsetHeight + 4}px` : `${coords.top - 4}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            maxHeight: "280px",
          }}
          className="z-[9999] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg flex flex-col"
        >
          <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 rounded-t-lg">
            <div className="flex items-center gap-2 px-3 py-2">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={placeholder || ""}
                className="w-full bg-transparent text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") { setOpen(false); setSearch(""); }
                  if (e.key === "Backspace" && search === "" && value.length > 0) {
                    onChange(value.slice(0, -1));
                  }
                }}
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-slate-400 dark:text-slate-500 text-center">
                No results
              </div>
            ) : (
              filtered.map((o) => {
                const isSelected = value.includes(o.value);
                return (
                  <div
                    key={o.value}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => toggle(o.value)}
                    className={`px-3 py-2 text-sm flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary/5 dark:bg-tertiary/5 text-primary dark:text-tertiary font-medium"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <span>{o.label}</span>
                    {isSelected && <span className="text-primary dark:text-tertiary font-bold">✓</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
