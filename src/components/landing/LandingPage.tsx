"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowUpLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Globe,
  Lock,
  Moon,
  Shield,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import { LandingHeader } from "./LandingHeader";
import { TabletShowcase } from "./TabletShowcase";
import { LiveStatsBar } from "./LiveStatsBar";
import { BentoFeatures } from "./BentoFeatures";
import { InteractiveAnalyticsSection } from "./InteractiveAnalyticsSection";
import { PartnerCarousel } from "./PartnerCarousel";
import { HowItWorksSection } from "./HowItWorksSection";
import { TrustBadgesSection } from "./TrustBadgesSection";

export interface LandingCopy {
  navCapabilities: string;
  navHowItWorks: string;
  navAnalytics: string;
  navSecurity: string;
  navLogin: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  microProof: string;
  previewLabel: string;
  previewTitle: string;
  previewUpdated: string;
  previewStatus: string;
  previewAssociation: string;
  previewBeneficiary: string;
  previewRegions: string;
  previewCategories: string;
  partnersKicker: string;
  partnersTitle: string;
  previewAnalytics: string;
  previewTracking: string;
  tabletTabOverview: string;
  tabletTabBeneficiaries: string;
  tabletTabGrowth: string;
  tabletLiveActivity: string;
  tabletRecentAction1: string;
  tabletRecentAction2: string;
  tabletRecentAction3: string;
  bentoEyebrow: string;
  bentoTitle: string;
  bentoDesc: string;
  capabilitiesEyebrow: string;
  capabilitiesTitle: string;
  capabilitiesDescription: string;
  feature1Title: string;
  feature1Description: string;
  feature2Title: string;
  feature2Description: string;
  feature3Title: string;
  feature3Description: string;
  feature4Title: string;
  feature4Description: string;
  feature5Title: string;
  feature5Description: string;
  feature6Title: string;
  feature6Description: string;
  analyticsEyebrow: string;
  analyticsTitle: string;
  analyticsDesc: string;
  trustKicker: string;
  trustTitle: string;
  trust1: string;
  trust2: string;
  trust3: string;
  trust4: string;
  howItWorksEyebrow: string;
  howItWorksTitle: string;
  howItWorksDescription: string;
  step1: string;
  step2: string;
  step3: string;
  bottomCtaTitle: string;
  bottomCtaDescription: string;
  bottomCta: string;
  footer: string;
}

interface LandingPageProps {
  locale: string;
  copy: LandingCopy;
}

interface LiveStats {
  associationsCount: number;
  beneficiariesCount: number;
  governoratesCount: number;
  categoriesCount: number;
  branding?: {
    primaryColor?: string;
    accentColor?: string;
    siteNameAr?: string;
    siteNameEn?: string;
  } | null;
  categoriesDistribution?: Array<{
    nameAr: string;
    nameEn: string;
    count: number;
    pct: number;
    color: string;
  }> | null;
  topGovernorates?: Array<{
    nameAr: string;
    nameEn: string;
    count: number;
    pct: number;
  }> | null;
  recentActivities?: Array<{
    actionAr: string;
    actionEn: string;
    orgAr: string;
    orgEn: string;
    timeAr: string;
    timeEn: string;
    type: "create" | "grant" | "report" | "auth";
  }> | null;
  trend?: Array<{
    labelAr: string;
    labelEn: string;
    value: number;
    count: string;
  }> | null;
}

export function LandingPage({ locale, copy }: LandingPageProps) {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const isAr = locale === "ar";

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/public/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);

          // Apply dynamic branding variables if configured
          if (data.branding?.primaryColor) {
            document.documentElement.style.setProperty(
              "--landing-primary",
              data.branding.primaryColor
            );
          }
          if (data.branding?.accentColor) {
            document.documentElement.style.setProperty(
              "--landing-accent",
              data.branding.accentColor
            );
          }
        }
      } catch (err) {
        console.error("Failed to load live stats:", err);
      }
    }

    loadStats();
  }, []);

  const siteName =
    isAr
      ? stats?.branding?.siteNameAr || "منصة معين"
      : stats?.branding?.siteNameEn || "Moeen Platform";

  const assocVal = stats?.associationsCount ?? 18;
  const benefVal = stats?.beneficiariesCount ?? 14250;
  const govVal = stats?.governoratesCount ?? 13;
  const catVal = stats?.categoriesCount ?? 8;

  return (
    <main className="landing-page min-h-screen transition-colors overflow-x-clip bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* 1. Header / Navbar */}
      <LandingHeader
        locale={locale}
        siteName={siteName}
        copy={{
          navCapabilities: copy.navCapabilities,
          navHowItWorks: copy.navHowItWorks,
          navAnalytics: copy.navAnalytics,
          navSecurity: copy.navSecurity,
          navLogin: copy.navLogin,
        }}
      />

      {/* 2. Hero Section */}
      <section aria-labelledby="landing-hero-title" className="relative pt-12 pb-20 overflow-hidden">
        {/* Background Grid & Ambient Glows */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        <div
          className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-[var(--landing-accent,#0A5C4A)]/15 via-[var(--landing-accent-deep,#2FAB99)]/20 to-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow"
          aria-hidden="true"
        />

        <div className="landing-container relative z-10 text-center space-y-8 max-w-4xl mx-auto">
          {/* Hero Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-md text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-extrabold hover:border-[var(--landing-accent-deep,#2FAB99)]/50 transition-all">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--landing-accent-deep,#2FAB99)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--landing-accent-deep,#2FAB99)]" />
            </span>
            <span>{copy.eyebrow}</span>
          </div>

          {/* Hero Title */}
          <h1
            id="landing-hero-title"
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.12]"
          >
            {isAr ? (
              <>
                إدارة أوضح لبيانات{" "}
                <span className="bg-gradient-to-r from-[var(--landing-accent,#0A5C4A)] via-[var(--landing-accent-deep,#2FAB99)] to-teal-500 bg-clip-text text-transparent">
                  الجمعيات والمستفيدين
                </span>{" "}
                والأثر الميداني
              </>
            ) : (
              <>
                Clearer Management for{" "}
                <span className="bg-gradient-to-r from-[var(--landing-accent,#0A5C4A)] via-[var(--landing-accent-deep,#2FAB99)] to-teal-500 bg-clip-text text-transparent">
                  Non-Profits & Beneficiary
                </span>{" "}
                Impact
              </>
            )}
          </h1>

          {/* Hero Description */}
          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            {copy.description}
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href={`/${locale}/login`}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-[var(--landing-accent,#0A5C4A)] via-[var(--landing-accent-deep,#2FAB99)] to-[var(--landing-accent,#0A5C4A)] bg-size-200 text-white font-extrabold text-base shadow-xl shadow-emerald-950/25 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              <span>{copy.primaryCta}</span>
              {isAr ? <ArrowUpLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
            </Link>

            <a
              href="#capabilities"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-base hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-all"
            >
              <span>{copy.secondaryCta}</span>
              <ChevronDown className="h-4 w-4" />
            </a>
          </div>

          {/* Micro Proof */}
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 pt-2">
            <CheckCircle2 className="h-4 w-4 text-[var(--landing-accent-deep,#2FAB99)]" />
            <span>{copy.microProof}</span>
          </div>
        </div>

        {/* 3. Hero Tablet Showcase Centerpiece */}
        <div className="landing-container mt-12">
          <TabletShowcase
            locale={locale}
            assocCount={assocVal}
            benefCount={benefVal}
            govCount={govVal}
            catCount={catVal}
            categoriesDistribution={stats?.categoriesDistribution}
            topGovernorates={stats?.topGovernorates}
            recentActivities={stats?.recentActivities}
            trend={stats?.trend}
          />
        </div>
      </section>

      {/* 4. Live Statistics Bar */}
      <LiveStatsBar
        locale={locale}
        assocCount={assocVal}
        benefCount={benefVal}
        govCount={govVal}
        catCount={catVal}
      />

      {/* 5. Partner Carousel Section */}
      <PartnerCarousel
        locale={locale}
        kicker={copy.partnersKicker}
        title={copy.partnersTitle}
      />

      {/* 6. Bento Grid Capabilities Section */}
      <BentoFeatures
        locale={locale}
        copy={{
          bentoEyebrow: copy.bentoEyebrow,
          bentoTitle: copy.bentoTitle,
          bentoDesc: copy.bentoDesc,
          feature1Title: copy.feature1Title,
          feature1Description: copy.feature1Description,
          feature2Title: copy.feature2Title,
          feature2Description: copy.feature2Description,
          feature3Title: copy.feature3Title,
          feature3Description: copy.feature3Description,
          feature4Title: copy.feature4Title,
          feature4Description: copy.feature4Description,
          feature5Title: copy.feature5Title,
          feature5Description: copy.feature5Description,
          feature6Title: copy.feature6Title,
          feature6Description: copy.feature6Description,
        }}
      />

      {/* 7. Interactive Analytics & Geo Section */}
      <InteractiveAnalyticsSection
        locale={locale}
        eyebrow={copy.analyticsEyebrow}
        title={copy.analyticsTitle}
        desc={copy.analyticsDesc}
        topGovernorates={stats?.topGovernorates}
        categoriesDistribution={stats?.categoriesDistribution}
        beneficiariesTotal={stats?.beneficiariesCount}
      />

      {/* 8. How It Works Flow */}
      <HowItWorksSection
        locale={locale}
        eyebrow={copy.howItWorksEyebrow}
        title={copy.howItWorksTitle}
        desc={copy.howItWorksDescription}
        step1={copy.step1}
        step2={copy.step2}
        step3={copy.step3}
      />

      {/* 9. Trust & Security Section */}
      <TrustBadgesSection
        locale={locale}
        kicker={copy.trustKicker}
        title={copy.trustTitle}
        trust1={copy.trust1}
        trust2={copy.trust2}
        trust3={copy.trust3}
        trust4={copy.trust4}
      />

      {/* 10. Bottom Conversion CTA Banner */}
      <section
        className="relative py-20 overflow-hidden"
        aria-labelledby="landing-bottom-title"
      >
        <div className="landing-container">
          <div className="relative p-10 sm:p-16 rounded-[36px] bg-gradient-to-br from-slate-900 via-[var(--landing-accent,#0A5C4A)] to-slate-950 text-white shadow-2xl overflow-hidden border border-emerald-500/20">
            {/* Ambient Lights */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--landing-accent-deep,#2FAB99)]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-bold">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{siteName}</span>
                </div>
                <h2
                  id="landing-bottom-title"
                  className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight"
                >
                  {copy.bottomCtaTitle}
                </h2>
                <p className="text-base sm:text-lg text-slate-200 leading-relaxed">
                  {copy.bottomCtaDescription}
                </p>
              </div>

              <Link
                href={`/${locale}/login`}
                className="flex-shrink-0 inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-slate-950 font-black text-base shadow-2xl hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all"
              >
                <span>{copy.bottomCta}</span>
                {isAr ? <ArrowUpLeft className="h-5 w-5 text-[var(--landing-accent,#0A5C4A)]" /> : <ArrowUpRight className="h-5 w-5 text-[var(--landing-accent,#0A5C4A)]" />}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 11. Modern Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-12 transition-colors">
        <div className="landing-container flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-start text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200/80 dark:border-slate-800 p-1.5 shrink-0">
              <Image
                src="/logo.png"
                alt={siteName}
                width={36}
                height={36}
                className="h-full w-full object-contain"
                unoptimized
              />
            </div>
            <div>
              <strong className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                {siteName}
              </strong>
              <p className="text-xs text-slate-500 dark:text-slate-400">{copy.footer}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <a href="#capabilities" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              {copy.navCapabilities}
            </a>
            <a href="#analytics" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              {copy.navAnalytics}
            </a>
            <a href="#how-it-works" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              {copy.navHowItWorks}
            </a>
            <a href="#security" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              {copy.navSecurity}
            </a>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>© {new Date().getFullYear()} {siteName}. {isAr ? "جميع الحقوق محفوظة" : "All rights reserved."}</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
