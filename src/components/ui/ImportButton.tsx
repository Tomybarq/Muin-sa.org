"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

interface ImportButtonProps {
  tableName: string;
  locale: string;
  hasPermission: boolean;
}

export default function ImportButton({
  tableName,
  locale,
  hasPermission,
}: ImportButtonProps) {
  const router = useRouter();
  const isAr = locale === "ar";

  if (!hasPermission) return null;

  return (
    <button
      onClick={() => router.push(`/${locale}/portal/import/${tableName}`)}
      className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
      title={isAr ? "استيراد البيانات" : "Import data"}
    >
      <Upload size={13} />
    </button>
  );
}
