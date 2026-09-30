"use client";

import { ArrowRight, CheckCircle, Compass, LogIn, Network, Sparkles, TrendingUp } from "lucide-react";

interface HowItWorksSectionProps {
  locale: string;
  eyebrow: string;
  title: string;
  desc: string;
  step1: string;
  step2: string;
  step3: string;
}

export function HowItWorksSection({
  locale,
  eyebrow,
  title,
  desc,
  step1,
  step2,
  step3,
}: HowItWorksSectionProps) {
  const isAr = locale === "ar";

  const steps = [
    {
      idx: "01",
      title: isAr ? "تسجيل الدخول والتفعيل" : "Authentication & Workspace",
      desc: step1,
      icon: LogIn,
      details: isAr ? "وصول محمي بنظام الصلاحيات المتعددة" : "Protected multi-role access",
    },
    {
      idx: "02",
      title: isAr ? "ربط وإدارة السجلات" : "Connect & Organize Data",
      desc: step2,
      icon: Network,
      details: isAr ? "استيراد وتصدير فوري بدون تكرار" : "Instant import & zero duplicates",
    },
    {
      idx: "03",
      title: isAr ? "متابعة التقارير والأثر" : "Track & Measure Impact",
      desc: step3,
      icon: TrendingUp,
      details: isAr ? "لوحات معلومات حية ومؤشرات فورية" : "Live dashboards & instant metrics",
    },
  ];

  return (
    <section id="how-it-works" className="relative py-24 overflow-hidden">
      <div className="landing-container">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--landing-accent,#0A5C4A)]/10 dark:bg-[var(--landing-accent-deep,#2FAB99)]/15 border border-[var(--landing-accent,#0A5C4A)]/20 text-[var(--landing-accent,#0A5C4A)] dark:text-[var(--landing-accent-deep,#2FAB99)] text-xs font-extrabold mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{eyebrow}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
            {title}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            {desc}
          </p>
        </div>

        {/* 3 Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line on desktop */}
          <div className="hidden md:block absolute top-1/2 left-16 right-16 h-0.5 bg-gradient-to-r from-[var(--landing-accent,#0A5C4A)]/30 via-[var(--landing-accent-deep,#2FAB99)]/50 to-[var(--landing-accent,#0A5C4A)]/30 -translate-y-12 -z-0" />

          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="group relative p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-2xl hover:border-[var(--landing-accent,#2FAB99)]/40 transition-all duration-300 hover:-translate-y-2 z-10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-4 rounded-2xl bg-[var(--landing-accent,#0A5C4A)]/10 text-[var(--landing-accent,#0A5C4A)] dark:text-[var(--landing-accent-deep,#2FAB99)] transition-transform duration-300 group-hover:scale-110">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-3xl font-black text-slate-300 dark:text-slate-700 group-hover:text-[var(--landing-accent-deep,#2FAB99)] transition-colors">
                      {s.idx}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                    {s.title}
                  </h3>

                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {s.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{s.details}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
