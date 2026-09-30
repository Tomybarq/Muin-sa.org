"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Building2, MapPin, ShieldCheck, Sparkles, Tag } from "lucide-react";

interface AssociationItem {
  id: number;
  name: string;
  category?: string;
  city?: string;
  logoUrl: string | null;
}

interface PartnerCarouselProps {
  kicker?: string;
  title?: string;
  locale?: string;
}

export function PartnerCarousel({ kicker, title, locale = "ar" }: PartnerCarouselProps) {
  const [associations, setAssociations] = useState<AssociationItem[] | null>(null);
  const isAr = locale === "ar";

  useEffect(() => {
    async function fetchAssociations() {
      try {
        const res = await fetch("/api/public/associations");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.associations) && data.associations.length > 0) {
            setAssociations(data.associations);
          } else {
            setAssociations([]); // No data available
          }
        } else {
          setAssociations([]); // API error
        }
      } catch (err) {
        console.error("Failed to load partner associations:", err);
        setAssociations([]); // Network error
      }
    }

    fetchAssociations();
  }, [isAr]);

  // Still loading or no real data — hide section entirely
  if (associations === null || associations.length === 0) return null;

  const rawList = associations;
  
  // Construct base set with enough items to exceed wide screens
  let baseSet = [...rawList];
  while (baseSet.length < 8) {
    baseSet = [...baseSet, ...rawList];
  }

  // Exactly two identical sets for a 100% seamless mathematical 50% loop
  const carouselItems = [...baseSet, ...baseSet];

  return (
    <section className="relative py-20 bg-slate-50/60 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80 transition-colors overflow-hidden select-none">
      {/* Background Ambient Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[var(--landing-accent-deep,#2FAB99)]/10 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* Static Centered Section Header */}
      <div className="landing-container mb-12 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--landing-accent,#0A5C4A)]/10 dark:bg-[var(--landing-accent-deep,#2FAB99)]/15 text-[var(--landing-accent,#0A5C4A)] dark:text-[var(--landing-accent-deep,#2FAB99)] text-xs font-extrabold mb-3">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{kicker || (isAr ? "شركاء النجاح المعتمدون" : "Certified Partners")}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          {title || (isAr ? "جمعيات ومؤسسات رائدة تعتمد على منصة مَعِين" : "Leading Non-Profits Empowered by Moeen")}
        </h2>
      </div>

      {/* Moving Track - Moving ONLY the cards continuously */}
      <div dir="ltr" className="relative overflow-hidden w-full mask-gradient">
        <div className="flex gap-6 items-stretch animate-infinite-scroll py-4 px-4 w-max">
          {carouselItems.map((assoc, idx) => (
            <div
              key={`${assoc.id}-${idx}`}
              dir={isAr ? "rtl" : "ltr"}
              className="w-[300px] sm:w-[340px] flex-shrink-0 group relative p-5 rounded-3xl bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-2xl hover:border-[var(--landing-accent-deep,#2FAB99)]/50 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden text-right ltr:text-left"
            >
              {/* Internal Top Accent Highlight (Clean & Clipped) */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[var(--landing-accent,#0A5C4A)] via-[var(--landing-accent-deep,#2FAB99)] to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div>
                {/* Header: Crisp Logo Box & Verified Badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  {/* Distinct White Box for high contrast emblem visibility */}
                  <div className="relative w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-200/80 dark:border-slate-700/80 p-1.5 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105">
                    {assoc.logoUrl ? (
                      <Image
                        src={assoc.logoUrl}
                        alt={assoc.name}
                        fill
                        className="object-contain p-1"
                        unoptimized
                      />
                    ) : (
                      <Building2 className="h-7 w-7 text-[var(--landing-accent,#0A5C4A)]" />
                    )}
                  </div>

                  {/* Verification Pill */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{isAr ? "شريك موثق" : "Verified"}</span>
                  </div>
                </div>

                {/* Association Name */}
                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight mb-3 group-hover:text-[var(--landing-accent-deep,#2FAB99)] transition-colors line-clamp-2">
                  {assoc.name}
                </h3>
              </div>

              {/* Tags Row */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                {/* Category */}
                <span className="inline-flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <Tag className="h-3.5 w-3.5 text-[var(--landing-accent-deep,#2FAB99)]" />
                  <span>{assoc.category || (isAr ? "رعاية وتنمية" : "Welfare & Aid")}</span>
                </span>

                {/* City */}
                {assoc.city && (
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-500 dark:text-slate-400">
                    <MapPin className="h-3.5 w-3.5 text-amber-500" />
                    <span>{assoc.city}</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
