"use client";

import { CheckCircle, Database, FileCheck, KeyRound, Lock, ShieldCheck } from "lucide-react";

interface TrustBadgesProps {
  locale: string;
  kicker: string;
  title: string;
  trust1: string;
  trust2: string;
  trust3: string;
  trust4: string;
}

export function TrustBadgesSection({
  locale,
  kicker,
  title,
  trust1,
  trust2,
  trust3,
  trust4,
}: TrustBadgesProps) {
  const isAr = locale === "ar";

  const trustItems = [
    {
      title: trust1,
      desc: isAr ? "تشفير كامل لكافة البيانات الحساسة وسجلات الهوية" : "End-to-end data encryption for sensitive records",
      icon: Lock,
    },
    {
      title: trust2,
      desc: isAr ? "رصد غير قابل للتعديل لكافة الإجراءات والعمليات" : "Immutable ledger tracking every system action",
      icon: FileCheck,
    },
    {
      title: trust3,
      desc: isAr ? "حفظ سحابي متعدد النطاقات وضمان استرجاع 99.99%" : "Multi-zone cloud replication & 99.99% availability",
      icon: Database,
    },
    {
      title: trust4,
      desc: isAr ? "توزيع الأدوار والصلاحيات بدقة متناهية" : "Granular multi-level role-based authorization",
      icon: KeyRound,
    },
  ];

  return (
    <section id="security" className="relative py-16 bg-slate-900 text-white overflow-hidden">
      {/* Glow aura */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[var(--landing-accent-deep,#2FAB99)]/15 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="landing-container relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold mb-3">
            <ShieldCheck className="h-4 w-4" />
            <span>{kicker}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
            {title}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/50 hover:bg-slate-800 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>{isAr ? "معتمد وموثق" : "Certified Protocol"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
