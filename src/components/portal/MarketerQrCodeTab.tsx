"use client";

import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { encodeId } from "@/lib/idObfuscator";
import {
  QrCode as QrCodeIcon,
  Download,
  Copy,
  ExternalLink,
  Check,
  Sparkles,
  ShieldCheck,
  FileImage,
  Share2,
} from "lucide-react";

interface MarketerQrCodeTabProps {
  marketerId?: number | null;
  marketerName?: string;
  locale?: string;
}

export default function MarketerQrCodeTab({
  marketerId,
  marketerName = "",
  locale = "ar",
}: MarketerQrCodeTabProps) {
  const isAr = locale === "ar";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string>("");
  const [encodedHash, setEncodedHash] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    if (!marketerId || marketerId <= 0) {
      setPublicUrl("");
      setEncodedHash("");
      return;
    }

    const hash = encodeId(marketerId);
    setEncodedHash(hash);

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/${locale}/marketer-profile/${hash}`;
    setPublicUrl(url);

    if (canvasRef.current && url) {
      setIsGenerating(true);
      QRCode.toCanvas(
        canvasRef.current,
        url,
        {
          width: 240,
          margin: 2,
          color: {
            dark: "#0F172A",
            light: "#FFFFFF",
          },
          errorCorrectionLevel: "H",
        },
        (err) => {
          setIsGenerating(false);
          if (err) console.error("Failed to generate QR code canvas:", err);
        }
      );
    }
  }, [marketerId, locale]);

  const handleCopyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleDownloadPng = () => {
    if (!canvasRef.current || !encodedHash) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    const safeName = marketerName ? marketerName.replace(/\s+/g, "_") : "marketer";
    link.download = `QR_${safeName}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleDownloadSvg = async () => {
    if (!publicUrl || !encodedHash) return;
    try {
      const svgString = await QRCode.toString(publicUrl, {
        type: "svg",
        margin: 2,
        color: {
          dark: "#0F172A",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "H",
      });
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeName = marketerName ? marketerName.replace(/\s+/g, "_") : "marketer";
      link.download = `QR_${safeName}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate SVG QR code:", err);
    }
  };

  const handlePreviewPublicPage = () => {
    if (publicUrl) {
      window.open(publicUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (!marketerId || marketerId <= 0) {
    return (
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <QrCodeIcon size={30} />
        </div>
        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
          {isAr ? "رمز الاستجابة السريعة (QR Code) غير متوفر بعد" : "QR Code Not Generated Yet"}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          {isAr
            ? "يرجى حفظ بيانات المسوق أولاً لتوليد رمز QR الخاص بالصفحة الخاصة به"
            : "Please save marketer details first to generate the public QR code."}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* QR Canvas Container with Card Styling */}
        <div className="relative group shrink-0">
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 shadow-xl flex flex-col items-center justify-center">
            <canvas ref={canvasRef} className="rounded-xl shadow-inner max-w-[200px] max-h-[200px]" />
          </div>
        </div>

        {/* Instructions and Copy/Action Info */}
        <div className="flex-1 space-y-4 text-center md:text-start">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 mb-2">
              <Sparkles size={14} />
              <span>{isAr ? "رمز استجابة مُميز ومشفّر" : "Encrypted Public QR Code"}</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {isAr ? `رمز QR الخاص بالمسوق: ${marketerName}` : `Marketer QR Code: ${marketerName}`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {isAr
                ? "يمكنك تحميل الرمز وطباعته أو مشاركته مع الزوار والمتبرعين لعرض صفحة المسوق التعريفية المعتمدة مع تشفير آمن للحساب."
                : "Download, print or share this QR code with donors to view the verified marketer public profile page."}
            </p>
          </div>

          {/* Encrypted Link Input Field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
              {isAr ? "رابط الصفحة العامة للمسوق (مُشفر):" : "Public Profile Encrypted URL:"}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 text-xs font-bold bg-primary dark:bg-tertiary text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ" : "Copy")}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
            <button
              type="button"
              onClick={handleDownloadPng}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-sm"
            >
              <Download size={15} />
              <span>{isAr ? "تحميل صورة (PNG)" : "Download PNG"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSvg}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white transition-colors cursor-pointer shadow-sm"
            >
              <FileImage size={15} />
              <span>{isAr ? "تحميل متجهات (SVG)" : "Download SVG"}</span>
            </button>

            <button
              type="button"
              onClick={handlePreviewPublicPage}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ExternalLink size={15} />
              <span>{isAr ? "معاينة الصفحة العامة" : "Preview Page"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
