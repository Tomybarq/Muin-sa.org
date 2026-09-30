"use client";

import { Building2, Users, MapPin, Layers } from "lucide-react";

interface LiveStatsBarProps {
  locale: string;
  assocCount?: number;
  benefCount?: number;
  govCount?: number;
  catCount?: number;
}

export function LiveStatsBar({
  locale,
  assocCount = 0,
  benefCount = 0,
  govCount = 0,
  catCount = 0,
}: LiveStatsBarProps) {
  const isAr = locale === "ar";

  const allStats = [
    {
      label: isAr ? "جمعية ومؤسسة أهلية" : "Verified Non-Profits",
      sublabel: isAr ? "تعتمد وتدير بياناتها سحابياً" : "Managing data on cloud",
      value: assocCount > 0 ? assocCount.toLocaleString(locale) : null,
      icon: Building2,
      bgLight: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: isAr ? "مستفيد تم توثيق خدمتهم" : "Documented Beneficiaries",
      sublabel: isAr ? "سجلات محققة بالهوية والأثر" : "Verified with verified impact",
      value: benefCount > 0 ? benefCount.toLocaleString(locale) : null,
      icon: Users,
      bgLight: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    },
    {
      label: isAr ? "منطقة ومحافظة مغطاة" : "Regions & Governorates",
      sublabel: isAr ? "تغطية جغرافية شاملة ومترابطة" : "Comprehensive regional reach",
      value: govCount > 0 ? govCount.toLocaleString(locale) : null,
      icon: MapPin,
      bgLight: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      label: isAr ? "مجالات وتصنيفات دعم" : "Support Sectors",
      sublabel: isAr ? "برامج رعاية وإغاثة وتعليم" : "Social, Health & Education",
      value: catCount > 0 ? catCount.toLocaleString(locale) : null,
      icon: Layers,
      bgLight: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
  ];

  // Only show cards with real values
  const stats = allStats.filter((s) => s.value !== null);

  // If no real stats, hide section entirely
  if (stats.length === 0) return null;

  return (
    <section className="relative z-10 py-12 -mt-6">
      <div className="landing-container">
        <div className={`grid gap-4 md:gap-6 ${stats.length >= 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : stats.length >= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 max-w-sm mx-auto'}`}>
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="group relative p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg hover:shadow-xl hover:border-[var(--landing-accent,#2FAB99)]/40 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Top Corner Glow on hover */}
                <div className="absolute top-0 inset-x-0 h-1 rounded-t-3xl bg-gradient-to-r from-transparent via-[var(--landing-accent,#2FAB99)]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-2xl ${stat.bgLight} transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>

                <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  {stat.value}
                </div>

                <div className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                  {stat.label}
                </div>

                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {stat.sublabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
