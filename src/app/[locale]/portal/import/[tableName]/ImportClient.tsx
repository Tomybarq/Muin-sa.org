"use client";

import React from "react";
import ImportPage from "@/components/portal/ImportPage";
import type { ExportField } from "@/components/ui/ExportModal";

export type TestResult = { valid: boolean; errors?: { row: number; field: string; message: string }[]; referenceErrors?: { field: string; missingValues: string[] }[] };
export type ImportResult = { success: boolean; errors?: string[] };

interface ImportClientProps {
  locale: string;
  tableName: string;
  tableLabelAr?: string;
  availableFields: ExportField[];
  onTest: (rows: Record<string, any>[]) => Promise<TestResult>;
  onImport: (rows: Record<string, any>[], fieldFixes: Record<string, "skip" | "create">) => Promise<ImportResult>;
}

export default function ImportClient({
  locale,
  tableName,
  tableLabelAr,
  availableFields,
  onTest,
  onImport,
}: ImportClientProps) {
  return (
    <ImportPage
      tableName={tableName}
      tableLabelAr={tableLabelAr}
      availableFields={availableFields}
      locale={locale}
      onTest={onTest}
      onImport={onImport}
      backUrl={`/${locale}/portal/${tableName}`}
    />
  );
}
