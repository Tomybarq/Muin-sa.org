import React from "react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Building2,
  MapPin,
  Mail,
  Phone,
  Share2,
  ExternalLink,
  ShieldCheck,
  Award,
  HeartHandshake,
  UserCheck,
  Copy,
} from "lucide-react";
import MarketerPublicClient from "./MarketerPublicClient";

interface Props {
  params: Promise<{
    locale: string;
    hash: string;
  }>;
}

async function getPublicMarketerData(hash: string, baseUrl: string) {
  try {
    const res = await fetch(`${baseUrl}/api/public/marketers/${hash}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.marketer || null;
  } catch (err) {
    console.error("Error fetching public marketer profile:", err);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, hash } = await params;
  const isAr = locale === "ar";
  
  // Base fallback title
  const siteName = isAr ? "منصة معين" : "Moeen Platform";
  const title = isAr ? `الملف التعريفي للمسوق | ${siteName}` : `Marketer Profile | ${siteName}`;
  const description = isAr
    ? "منصة معين المعتمدة للربط بين المسوقين والجمعيات الخيرية والمستفيدين."
    : "Verified marketer profile on Moeen Platform for charities and donors.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
    },
  };
}

export default async function PublicMarketerPage({ params }: Props) {
  const { locale, hash } = await params;
  const isAr = locale === "ar";

  // Use relative localhost or environment origin for server fetch
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const marketer = await getPublicMarketerData(hash, baseUrl);

  if (!marketer) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex items-center justify-center p-4" dir={isAr ? "rtl" : "ltr"}>
        <div className="max-w-md w-full bg-white dark:bg-[#1E293B] rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center shadow-xl">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            {isAr ? "الملف التعريفي غير متوفر" : "Profile Not Found"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {isAr
              ? "عذراً، هذا الملف التعريفي غير موجود أو قد يكون الحساب غير نشط حالياً."
              : "Sorry, this profile could not be found or is currently inactive."}
          </p>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-lg shadow-emerald-600/20"
          >
            {isAr ? "العودة للرئيسية" : "Back to Home"}
          </Link>
        </div>
      </div>
    );
  }

  return <MarketerPublicClient marketer={marketer} locale={locale} hash={hash} />;
}
