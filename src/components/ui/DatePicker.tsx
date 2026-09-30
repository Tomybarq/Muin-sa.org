"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  locale?: string;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
}

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_AR = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function DatePicker({
  value,
  onChange,
  label,
  placeholder,
  error,
  locale = "ar",
  minDate,
  maxDate,
  disabled,
  required,
  name,
  id,
}: DatePickerProps) {
  const isAr = locale === "ar";
  const months = isAr ? MONTHS_AR : MONTHS_EN;
  const dayLabels = isAr ? DAYS_AR : DAYS_EN;

  const today = new Date();
  const parsedValue = value ? new Date(value) : null;

  const [isOpen, setIsOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [view, setView] = useState<"days" | "months" | "years">("days");
  const [viewYear, setViewYear] = useState(parsedValue?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsedValue?.getMonth() ?? today.getMonth());
  const [yearRangeStart, setYearRangeStart] = useState(Math.floor(today.getFullYear() / 20) * 20);
  const [openUp, setOpenUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (parsedValue) {
      setViewYear(parsedValue.getFullYear());
      setViewMonth(parsedValue.getMonth());
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        const el = document.getElementById("datepicker-popup");
        if (el && el.contains(e.target as Node)) return;
        setIsOpen(false);
        setView("days");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setView("days");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const minDateObj = minDate ? new Date(minDate) : null;
  const maxDateObj = maxDate ? new Date(maxDate) : null;

  const normalize = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const isDateDisabled = (year: number, month: number, day: number) => {
    const date = normalize(new Date(year, month, day));
    if (minDateObj && date < normalize(minDateObj)) return true;
    if (maxDateObj && date > normalize(maxDateObj)) return true;
    return false;
  };

  const isMonthDisabled = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    if (minDateObj && normalize(lastDay) < normalize(minDateObj)) return true;
    if (maxDateObj && normalize(firstDay) > normalize(maxDateObj)) return true;
    return false;
  };

  const isYearDisabled = (year: number) => {
    const firstDay = new Date(year, 0, 1);
    const lastDay = new Date(year, 11, 31);
    if (minDateObj && normalize(lastDay) < normalize(minDateObj)) return true;
    if (maxDateObj && normalize(firstDay) > normalize(maxDateObj)) return true;
    return false;
  };

  const lastDayOfPrevMonth = new Date(viewYear, viewMonth, 0);
  const isPrevDisabled = minDateObj ? normalize(lastDayOfPrevMonth) < normalize(minDateObj) : false;
  const firstDayOfNextMonth = new Date(viewYear, viewMonth + 1, 1);
  const isNextDisabled = maxDateObj ? normalize(firstDayOfNextMonth) > normalize(maxDateObj) : false;

  const isTodayDisabled = !!(
    (minDateObj && normalize(today) < normalize(minDateObj)) ||
    (maxDateObj && normalize(today) > normalize(maxDateObj))
  );

  const isPrevNavigationDisabled = () => {
    if (view === "days") return isPrevDisabled;
    if (view === "months") return isYearDisabled(viewYear - 1);
    if (view === "years") return isYearDisabled(yearRangeStart - 1);
    return false;
  };

  const isNextNavigationDisabled = () => {
    if (view === "days") return isNextDisabled;
    if (view === "months") return isYearDisabled(viewYear + 1);
    if (view === "years") return isYearDisabled(yearRangeStart + 20);
    return false;
  };

  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, bottom: 0 });

  useEffect(() => {
    if (!isOpen) return;
    const handleScrollOrResize = (e: Event) => {
      const popup = document.getElementById("datepicker-popup");
      if (popup && popup.contains(e.target as Node)) return;
      setIsOpen(false);
    };
    const handleResize = () => setIsOpen(false);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  const handleOpenToggle = () => {
    if (disabled) return;
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const popupWidth = 270;
      const popupHeight = 340;

      // Vertical position check (up or down)
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUpwards = spaceBelow < popupHeight && spaceAbove > spaceBelow;
      setOpenUp(openUpwards);

      // Horizontal position check (left or right alignment to prevent overflow)
      let calculatedLeft = rect.left;
      if (isAr) {
        // In RTL, align right edge of popup with right edge of trigger element if fits, else keep inside screen
        const idealRight = rect.right;
        if (idealRight - popupWidth < 10) {
          calculatedLeft = 10;
        } else {
          calculatedLeft = idealRight - popupWidth;
        }
      } else {
        // In LTR, check if overflowing right edge
        if (calculatedLeft + popupWidth > window.innerWidth - 10) {
          calculatedLeft = window.innerWidth - popupWidth - 10;
        }
      }

      setCoords({
        top: rect.top,
        left: Math.max(10, calculatedLeft),
        width: rect.width,
        bottom: rect.bottom,
      });
    }
    setIsOpen(!isOpen);
  };

  const handleSelectDay = (day: number) => {
    if (isDateDisabled(viewYear, viewMonth, day)) return;
    onChange(toDateStr(viewYear, viewMonth, day));
    setIsOpen(false);
    setView("days");
  };

  const handleSelectMonth = (month: number) => {
    setViewMonth(month);
    setView("days");
  };

  const handleSelectYear = (year: number) => {
    setViewYear(year);
    setView("months");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const handleToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTodayDisabled) return;
    onChange(toDateStr(today.getFullYear(), today.getMonth(), today.getDate()));
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setIsOpen(false);
    setView("days");
  };

  const handlePrev = () => {
    if (view === "days") {
      if (isPrevDisabled) return;
      if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
      else { setViewMonth((m) => m - 1); }
    } else if (view === "months") {
      if (isYearDisabled(viewYear - 1)) return;
      setViewYear((y) => y - 1);
    } else if (view === "years") {
      if (isYearDisabled(yearRangeStart - 1)) return;
      setYearRangeStart((s) => s - 20);
    }
  };

  const handleNext = () => {
    if (view === "days") {
      if (isNextDisabled) return;
      if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
      else { setViewMonth((m) => m + 1); }
    } else if (view === "months") {
      if (isYearDisabled(viewYear + 1)) return;
      setViewYear((y) => y + 1);
    } else if (view === "years") {
      if (isYearDisabled(yearRangeStart + 20)) return;
      setYearRangeStart((s) => s + 20);
    }
  };

  const formatDisplay = () => {
    if (!parsedValue) return "";
    const d = parsedValue.getDate();
    const m = months[parsedValue.getMonth()];
    const y = parsedValue.getFullYear();
    return `${d} ${m} ${y}`;
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const isSelected = (day: number) =>
    parsedValue &&
    viewYear === parsedValue.getFullYear() &&
    viewMonth === parsedValue.getMonth() &&
    day === parsedValue.getDate();

  const isTodayDay = (day: number) =>
    viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();

  const years: number[] = [];
  for (let y = yearRangeStart; y < yearRangeStart + 20; y++) years.push(y);

  const headerLabel =
    view === "days" ? `${months[viewMonth]} ${viewYear}` :
    view === "months" ? `${viewYear}` :
    `${yearRangeStart} - ${yearRangeStart + 19}`;

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
          {label}
          {required && <span className="text-red-500 ms-1">*</span>}
        </label>
      )}

      <div className="relative">
        <div
          onClick={handleOpenToggle}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleOpenToggle();
            } else if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
          onFocus={() => setFocused(true)}
          onBlur={(e) => { if (!containerRef.current?.contains(e.relatedTarget as Node)) setFocused(false); }}
          className={`
            relative flex items-center w-full px-3 py-2 text-sm cursor-pointer select-none
            bg-slate-50 dark:bg-slate-900
            border rounded-lg transition-all outline-none
            ${error
              ? "border-red-400 ring-2 ring-red-400/20"
              : isOpen
                ? "border-primary dark:border-tertiary ring-2 ring-primary/20 dark:ring-tertiary/20"
                : focused
                  ? "border-primary dark:border-tertiary ring-2 ring-primary/20 dark:ring-tertiary/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
            }
            ${disabled ? "opacity-60 cursor-not-allowed" : ""}
          `}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={label || placeholder || "Date picker"}
          aria-expanded={isOpen}
        >
          <Calendar size={16} className="shrink-0 text-slate-400 ml-2" />
          <span className={`block truncate flex-1 ${value ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>
            {value ? formatDisplay() : (placeholder || (isAr ? "اختر التاريخ" : "Select date"))}
          </span>
          {value && (
            <button type="button" onClick={handleClear}
              className="p-0.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {isOpen && typeof window !== "undefined" && createPortal(
        <div
          id="datepicker-popup"
          style={{
            position: "fixed",
            top: openUp ? `${coords.top - 344}px` : `${coords.bottom + 6}px`,
            left: `${coords.left}px`,
          }}
          className="z-[9999] w-[270px] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fadeIn"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-primary to-secondary dark:from-tertiary dark:to-primary text-white">
            <button type="button" onClick={handlePrev} disabled={isPrevNavigationDisabled()}
              className={`p-1 rounded-lg hover:bg-white/20 transition-all ${isPrevNavigationDisabled() ? "opacity-30 cursor-not-allowed" : ""}`}>
              {isAr ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <button type="button" onClick={() => {
              if (view === "days") {
                setView("months");
              } else if (view === "months") {
                setYearRangeStart(Math.floor(viewYear / 20) * 20);
                setView("years");
              } else {
                setView("days");
              }
            }}
              className="text-xs font-bold hover:bg-white/20 px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
              {headerLabel}
            </button>
            <button type="button" onClick={handleNext} disabled={isNextNavigationDisabled()}
              className={`p-1 rounded-lg hover:bg-white/20 transition-all ${isNextNavigationDisabled() ? "opacity-30 cursor-not-allowed" : ""}`}>
              {isAr ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>

          {/* Days view */}
          {view === "days" && (
            <>
              <div className="grid grid-cols-7 gap-0.5 px-3 pt-3 pb-1">
                {dayLabels.map((d) => (
                  <div key={d} className="text-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5 px-3 pb-2">
                {calendarDays.map((day, idx) =>
                  day === null ? (
                    <div key={`e-${idx}`} />
                  ) : (
                    <button
                      key={day}
                      type="button"
                      disabled={isDateDisabled(viewYear, viewMonth, day)}
                      onClick={() => handleSelectDay(day)}
                      className={`
                        w-full aspect-square flex items-center justify-center text-xs rounded-lg font-medium transition-all
                        ${isSelected(day)
                          ? "bg-gradient-to-br from-primary to-secondary text-white shadow-md shadow-primary/20 scale-105"
                          : isTodayDay(day)
                            ? "bg-primary/10 dark:bg-tertiary/10 text-primary dark:text-tertiary font-bold ring-1 ring-primary/30 dark:ring-tertiary/30"
                            : isDateDisabled(viewYear, viewMonth, day)
                              ? "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-tertiary"
                        }
                      `}
                    >
                      {day}
                    </button>
                  )
                )}
              </div>
            </>
          )}

          {/* Months view */}
          {view === "months" && (
            <div className="grid grid-cols-3 gap-2 p-3">
              {months.map((m, idx) => {
                const disabled = isMonthDisabled(viewYear, idx);
                return (
                  <button key={m} type="button" disabled={disabled} onClick={() => handleSelectMonth(idx)}
                    className={`
                      py-3 px-2 rounded-xl text-xs font-medium transition-all
                      ${viewMonth === idx
                        ? "bg-gradient-to-br from-primary to-secondary text-white shadow-md"
                        : disabled
                          ? "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }
                    `}>
                    {m}
                  </button>
                );
              })}
            </div>
          )}

          {/* Years view */}
          {view === "years" && (
            <div className="grid grid-cols-4 gap-2 p-3">
              {years.map((y) => {
                const disabled = isYearDisabled(y);
                return (
                  <button key={y} type="button" disabled={disabled} onClick={() => handleSelectYear(y)}
                    className={`
                      py-2.5 rounded-xl text-xs font-medium transition-all
                      ${viewYear === y
                        ? "bg-gradient-to-br from-primary to-secondary text-white shadow-md"
                        : disabled
                          ? "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                          : y === today.getFullYear()
                            ? "text-primary dark:text-tertiary font-bold bg-primary/10 dark:bg-tertiary/10"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }
                    `}>
                    {y}
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer - Today button */}
          <div className="px-3 pb-3">
            <button type="button" onClick={handleToday} disabled={isTodayDisabled}
              className={`w-full py-2 text-xs font-semibold rounded-lg transition-all ${
                isTodayDisabled
                  ? "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                  : "text-primary dark:text-tertiary hover:bg-primary/5 dark:hover:bg-tertiary/5"
              }`}>
              {isAr ? "اليوم" : "Today"}
            </button>
          </div>
        </div>,
        document.body
      )}

      {name && (
        <input type="hidden" name={name} id={id || name} value={value || ""} />
      )}

      {error && (
        <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
