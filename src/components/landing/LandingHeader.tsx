"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Moon, Sun, ArrowUpLeft, ArrowUpRight } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { usePlatformSettings } from "@/components/providers/PlatformSettingsProvider";

interface LandingHeaderProps {
  locale: string;
  siteName: string;
  copy: {
    navCapabilities: string;
    navHowItWorks: string;
    navAnalytics: string;
    navSecurity: string;
    navLogin: string;
  };
}

export function LandingHeader({ locale, siteName, copy }: LandingHeaderProps) {
  const languageLocale = locale === "ar" ? "en" : "ar";
  const { theme, toggleTheme } = useTheme();
  const settings = usePlatformSettings();
  const isAr = locale === "ar";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const logoSrc = settings?.logoUrl || "/logo.png";

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-lg shadow-slate-950/5 dark:shadow-black/30"
          : "bg-white/50 dark:bg-slate-950/50 backdrop-blur-lg border-b border-slate-200/40 dark:border-slate-800/40"
      }`}
    >
      <div className="landing-container flex h-20 items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent,#0A5C4A)] rounded-2xl group"
        >
          <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-white shadow-md border border-slate-200/80 dark:border-slate-800 p-2 transition-transform duration-300 group-hover:scale-105 shrink-0">
            <Image
              src={logoSrc}
              alt={siteName}
              width={48}
              height={48}
              className="h-full w-full object-contain"
              priority
              unoptimized
            />
          </div>
          <div className="flex flex-col">
            <strong className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
              {siteName}
            </strong>
            <small className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isAr ? "منظومة إدارة وحوكمة الجمعيات" : "Non-Profit Governance System"}
            </small>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600 dark:text-slate-300"
        >
          <a
            className="hover:text-[var(--landing-accent-deep,#2FAB99)] transition-colors"
            href="#capabilities"
          >
            {copy.navCapabilities}
          </a>
          <a
            className="hover:text-[var(--landing-accent-deep,#2FAB99)] transition-colors"
            href="#analytics"
          >
            {copy.navAnalytics}
          </a>
          <a
            className="hover:text-[var(--landing-accent-deep,#2FAB99)] transition-colors"
            href="#how-it-works"
          >
            {copy.navHowItWorks}
          </a>
          <a
            className="hover:text-[var(--landing-accent-deep,#2FAB99)] transition-colors"
            href="#security"
          >
            {copy.navSecurity}
          </a>
        </nav>

        {/* Actions & Utilities */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent,#0A5C4A)]"
            aria-label={theme === "dark" ? "Light Mode" : "Dark Mode"}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400 animate-spin-slow" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" />
            )}
          </button>

          {/* Language Switcher */}
          <Link
            href={`/${languageLocale}`}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-[var(--landing-accent-deep,#2FAB99)] hover:text-slate-900 dark:hover:text-white transition-all"
          >
            {languageLocale === "ar" ? "العربية" : "English"}
          </Link>

          {/* Sign In / Login Button */}
          <Link
            href={`/${locale}/login`}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--landing-accent,#0A5C4A)] to-[var(--landing-accent-deep,#2FAB99)] text-white text-xs sm:text-sm font-extrabold shadow-md shadow-emerald-950/20 hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            <span>{copy.navLogin}</span>
            {isAr ? <ArrowUpLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
          </Link>
        </div>
      </div>
    </header>
  );
}
