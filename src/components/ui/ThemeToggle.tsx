"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  variant?: "icon" | "pill";
  className?: string;
}

export default function ThemeToggle({ variant = "icon", className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  if (variant === "pill") {
    return (
      <button
        onClick={toggleTheme}
        className={`
          relative flex items-center w-14 h-7 rounded-full
          transition-all duration-300 ease-out
          ${theme === "dark"
            ? "bg-gradient-to-r from-primary to-tertiary"
            : "bg-gradient-to-r from-amber-300 to-orange-400"
          }
          shadow-inner
          cursor-pointer
          ${className}
        `}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        <span
          className={`
            absolute top-0.5 w-6 h-6 rounded-full
            bg-white shadow-md flex items-center justify-center
            transition-all duration-300 ease-out
            ${theme === "dark" ? "start-[calc(100%-1.625rem)]" : "start-0.5"}
          `}
        >
          {theme === "dark" ? (
            <Moon size={12} className="text-primary" />
          ) : (
            <Sun size={12} className="text-amber-500" />
          )}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2.5 rounded-xl transition-all duration-200
        active:scale-95
        cursor-pointer
        ${theme === "dark"
          ? "bg-gray-800 text-amber-400 hover:bg-gray-700"
          : "bg-slate-200/80 hover:bg-slate-300/80 text-slate-800 hover:text-[#0F172A]"
        }
        ${className}
      `}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={`Current Theme: ${theme}`}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
