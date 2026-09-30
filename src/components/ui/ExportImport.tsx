"use client";

import React, { useState } from "react";
import { Download } from "lucide-react";
import ExportModal, { ExportField } from "./ExportModal";

interface ExportImportProps {
  tableName: string;
  availableFields: ExportField[];
  selectedIds: number[];
  recordId?: number;
  hasPermission: boolean;
  screenPath: string;
  locale: string;
  allRecords: Record<string, any>[];
}

export default function ExportImport({
  tableName,
  availableFields,
  selectedIds,
  recordId,
  hasPermission,
  screenPath,
  locale,
  allRecords,
}: ExportImportProps) {
  const isAr = locale === "ar";
  const [modalOpen, setModalOpen] = useState(false);

  const ids = recordId ? [recordId] : selectedIds;
  const showExport = hasPermission && ids.length > 0 && availableFields.length > 0;

  if (!showExport) return null;

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        title={isAr ? "تصدير البيانات" : "Export data"}
      >
        <Download size={13} />
      </button>

      <ExportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        tableName={tableName}
        availableFields={availableFields}
        selectedIds={selectedIds}
        recordId={recordId}
        allRecords={allRecords}
        screenPath={screenPath}
        locale={locale}
      />
    </>
  );
}
