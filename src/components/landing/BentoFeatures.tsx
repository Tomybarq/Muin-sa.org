"use client";

import {
  Activity,
  ArrowUpLeft,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Layers,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

interface BentoFeaturesProps {
  locale: string;
  copy: {
    bentoEyebrow: string;
    bentoTitle: string;
    bentoDesc: string;
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
  };
}

export function BentoFeatures({ locale, copy }: BentoFeaturesProps) {
  const isAr = locale === "ar";

  return (
    <section id="capabilities" className="relative py-20 overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className="absolute top-1/4 -right-40 w-96 h-96 bg-[var(--landing-accent,#0A5C4A)]/10 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/4 -left-40 w-96 h-96 bg-[var(--landing-accent-deep,#2FAB99)]/10 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="landing-container">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--landing-accent,#0A5C4A)]/10 dark:bg-[var(--landing-accent-deep,#2FAB99)]/15 border border-[var(--landing-accent,#0A5C4A)]/20 text-[var(--landing-accent,#0A5C4A)] dark:text-[var(--landing-accent-deep,#2FAB99)] text-xs font-extrabold mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{copy.bentoEyebrow}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
            {copy.bentoTitle}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            {copy.bentoDesc}
          </p>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Beneficiaries & Records (Col Span 2 on large screens) */}
          <div className="lg:col-span-2 group relative p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-2xl hover:border-[var(--landing-accent,#2FAB99)]/40 transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3.5 rounded-2xl bg-[var(--landing-accent,#0A5C4A)]/10 text-[var(--landing-accent,#0A5C4A)] dark:text-[var(--landing-accent-deep,#2FAB99)]">
                  <Users className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">01</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-3">
                {copy.feature1Title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mb-6">
                {copy.feature1Description}
              </p>
            </div>

            {/* Interactive Simulated Preview inside Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/60 dark:border-slate-800/60 space-y-2.5">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Search className="h-3.5 w-3.5" />
                  <span>{isAr ? "بحث فوري بالهوية أو الاسم أو المدينة..." : "Instant search by ID or name..."}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {isAr ? "تحقق تلقائي" : "Auto Verified"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {isAr ? "أسرة أيتام • الرياض" : "Orphan Family • Riyadh"}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                    {isAr ? "معتمد" : "Approved"}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {isAr ? "دعم علاجي • جدة" : "Medical Aid • Jeddah"}
                  </span>
                  <span className="text-teal-600 dark:text-teal-400 font-bold text-[11px]">
                    {isAr ? "تم الصرف" : "Disbursed"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Live Indicators & Statistics */}
          <div className="group relative p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-2xl hover:border-[var(--landing-accent,#2FAB99)]/40 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Activity className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">02</span>
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">
                {copy.feature2Title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                {copy.feature2Description}
              </p>
            </div>

            {/* Platform Coverage Description */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center gap-2 mb-2 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">{isAr ? "التغطية الجغرافية" : "Geographic Reach"}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {isAr
                  ? "تغطي المنصة جميع مناطق ومحافظات المملكة العربية السعودية"
                  : "The platform covers all regions and governorates across Saudi Arabia"}
              </p>
            </div>
          </div>

          {/* Card 3: Governance & Multi-role Access */}
          <div className="group relative p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-2xl hover:border-[var(--landing-accent,#2FAB99)]/40 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">03</span>
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">
                {copy.feature3Title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                {copy.feature3Description}
              </p>
            </div>

            {/* Multi-role chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: isAr ? "مدير النظام" : "Super Admin", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
                { label: isAr ? "موظف جمعية" : "Charity Staff", color: "bg-teal-500/10 text-teal-700 dark:text-teal-300" },
                { label: isAr ? "مسوق ومؤثر" : "Marketer", color: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
                { label: isAr ? "مستفيد" : "Beneficiary", color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
              ].map((role, i) => (
                <span key={i} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${role.color}`}>
                  {role.label}
                </span>
              ))}
            </div>
          </div>

          {/* Card 4: BI Analytics & Dashboards */}
          <div className="group relative p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-2xl hover:border-[var(--landing-accent,#2FAB99)]/40 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">04</span>
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">
                {copy.feature4Title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                {copy.feature4Description}
              </p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/60 dark:border-slate-800/60 text-xs">
              <Zap className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {isAr ? "تصدير فوري لتقارير الأثر بصيغ PDF و Excel" : "Instant impact export in PDF & Excel formats"}
              </span>
            </div>
          </div>

          {/* Card 5: Smart Excel Sync & Deduplication */}
          <div className="group relative p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-2xl hover:border-[var(--landing-accent,#2FAB99)]/40 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">05</span>
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">
                {copy.feature5Title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                {copy.feature5Description}
              </p>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>{isAr ? "تحقق تلقائي من عدم ازدواجية الهويات" : "Automated national ID deduplication"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>{isAr ? "تضمين وتنزيل الشعارات والصور آلياً" : "Auto media & logo asset packaging"}</span>
              </div>
            </div>
          </div>

          {/* Card 6: Enterprise Security & Audit Logs (Col span 1 or full on wide) */}
          <div className="lg:col-span-3 group relative p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--landing-accent-deep,#2FAB99)]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold mb-4">
                  <Lock className="h-3.5 w-3.5" />
                  <span>{isAr ? "حماية وتدقيق كامل" : "Enterprise Security"}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
                  {copy.feature6Title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {copy.feature6Description}
                </p>
              </div>

              <Link
                href={`/${locale}/login`}
                className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[var(--landing-accent,#0A5C4A)] to-[var(--landing-accent-deep,#2FAB99)] text-white font-extrabold text-sm shadow-lg shadow-emerald-950/40 hover:scale-105 transition-all"
              >
                <span>{isAr ? "دخول لوحة التحكم الآمنة" : "Enter Secure Workspace"}</span>
                {isAr ? <ArrowUpLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
