"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileDown, ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Loader2, Table, FileSpreadsheet, Plus, Ban, Image } from "lucide-react";
import * as XLSX from "xlsx";
import ExportTemplateModal from "@/components/ui/ExportTemplateModal";
import ImportImagesModal from "@/components/ui/ImportImagesModal";
import type { ExportField } from "@/components/ui/ExportModal";

interface ImportPageProps {
  tableName: string;
  tableLabelAr?: string;
  availableFields: ExportField[];
  locale: string;
  onImport: (rows: Record<string, any>[], fieldFixes: Record<string, "skip" | "create">) => Promise<{ success: boolean; errors?: string[]; created?: number; updated?: number }>;
  onTest: (rows: Record<string, any>[]) => Promise<{ valid: boolean; errors?: { row: number; field: string; message: string }[]; referenceErrors?: { field: string; missingValues: string[] }[] }>;
  backUrl: string;
}

export default function ImportPage({
  tableName,
  tableLabelAr,
  availableFields,
  locale,
  onImport,
  onTest,
  backUrl,
}: ImportPageProps) {
  const isAr = locale === "ar";
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; errors?: { row: number; field: string; message: string }[]; referenceErrors?: { field: string; missingValues: string[] }[] } | null>(null);
  const [importResult, setImportResult] = useState<{ success: boolean; errors?: string[]; created?: number; updated?: number } | null>(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [importImagesModalOpen, setImportImagesModalOpen] = useState(false);
  const [fieldFixes, setFieldFixes] = useState<Record<string, "skip" | "create">>({});



  useEffect(() => {
    if (!importResult || !importResult.success) return;
    const t = setTimeout(() => setImportResult(null), 5000);
    return () => clearTimeout(t);
  }, [importResult]);

  const availableFieldKeys = new Set(availableFields.map((f) => f.key));

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setTestResult(null);
    setImportResult(null);

    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });
      if (rawData.length > 0) {
        const rawHeaders = Object.keys(rawData[0]).filter((k) => !k.startsWith("__EMPTY"));

        // Detect two-row header template (Row 1 = labels, Row 2 = technical keys)
        const isLabelHeader = rawHeaders.some((h) => !availableFieldKeys.has(h));
        if (isLabelHeader && rawData.length >= 2) {
          // Extract technical keys from Row 2 (first data row)
          const newHeaders = rawHeaders.map((h) => String(rawData[0][h] ?? "").trim()).filter(Boolean);
          // Remap data: rows 3+ (index 1+) using new header keys
          const remapped = rawData.slice(1).map((row) => {
            const clean: Record<string, any> = {};
            for (let i = 0; i < newHeaders.length; i++) {
              clean[newHeaders[i]] = row[rawHeaders[i]];
            }
            return clean;
          });
          setParsedHeaders(newHeaders);
          setParsedRows(remapped.filter((r) => Object.values(r).some((v) => v !== "" && v != null)));
        } else {
          // Normal single-row header
          const cleanData = rawData.map((row) => {
            const clean: Record<string, any> = {};
            for (const h of rawHeaders) clean[h] = row[h];
            return clean;
          });
          setParsedHeaders(rawHeaders);
          setParsedRows(cleanData);
        }
      } else {
        setParsedHeaders([]);
        setParsedRows([]);
      }
    } catch {
      setParsedRows([]);
      setParsedHeaders([]);
      setFile(null);
    }
  }, [availableFields]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const dt = new DataTransfer();
    dt.items.add(f);
    if (fileInputRef.current) {
      fileInputRef.current.files = dt.files;
      fileInputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, []);

  const handleTest = async () => {
    if (parsedRows.length === 0) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await onTest(parsedRows);
      setTestResult(result);
      setFieldFixes({});
    } catch {
      setTestResult({ valid: false, errors: [{ row: 0, field: "", message: isAr ? "حدث خطأ أثناء الاختبار" : "An error occurred during testing" }] });
    }
    setTesting(false);
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await onImport(parsedRows, fieldFixes);
      setImportResult(result);
    } catch {
      setImportResult({ success: false, errors: [isAr ? "حدث خطأ أثناء الاستيراد" : "An error occurred during import"] });
    }
    setImporting(false);
  };

  const headerFieldMap = new Map(availableFields.map((f) => [f.key, f]));
  const unresolvedRefs = testResult?.referenceErrors?.filter((ref) => !fieldFixes[ref.field]) ?? [];
  const hasUnresolvedRefs = unresolvedRefs.length > 0;
  const refFieldLabel = (shortKey: string): string => {
    const lookup = shortKey === "governorate" ? "city.governorate." : shortKey === "city" ? "city." : shortKey;
    const field = availableFields.find((f) => f.key.startsWith(lookup));
    return field ? (isAr ? field.labelAr : field.label) : shortKey;
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(backUrl)}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold text-slate-800 dark:text-white">
            {isAr ? `استيراد ${tableLabelAr || tableName}` : `Import ${tableName}`}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportImagesModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-all cursor-pointer shadow-sm"
          >
            <Image size={14} />
            {isAr ? "استيراد صور" : "Import Images"}
          </button>
          <button
            onClick={() => setTemplateModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-primary/10 dark:bg-tertiary/10 text-primary dark:text-tertiary hover:bg-primary/20 dark:hover:bg-tertiary/20 transition-all cursor-pointer"
          >
            <FileDown size={14} />
            {isAr ? "تصدير قالب" : "Export Template"}
          </button>
        </div>
      </div>

      {/* File upload zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          file
            ? "border-primary/40 dark:border-tertiary/40 bg-primary/5 dark:bg-tertiary/5"
            : "border-slate-200 dark:border-slate-700 hover:border-primary/30 dark:hover:border-tertiary/30 bg-slate-50/50 dark:bg-slate-900/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileSpreadsheet size={32} className="text-primary dark:text-tertiary" />
            <div className="text-start">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{file.name}</p>
              <p className="text-xs text-slate-400">
                {parsedRows.length} {isAr ? "صف" : "row"}{!isAr && parsedRows.length !== 1 ? "s" : ""} — {parsedHeaders.length} {isAr ? "عمود" : "column"}{!isAr && parsedHeaders.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); setParsedRows([]); setParsedHeaders([]); setTestResult(null); setImportResult(null); }}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all cursor-pointer"
            >
              <XCircle size={18} />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {isAr ? "اسحب ملف Excel هنا أو اضغط لاختيار ملف" : "Drag & drop an Excel file or click to browse"}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">.xlsx {isAr ? "ملفات" : "files"}</p>
          </div>
        )}
      </div>

      {/* Action buttons - visible only when file is uploaded */}
      {file && parsedRows.length > 0 && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl border-2 border-amber-400 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 disabled:opacity-40 transition-all cursor-pointer"
          >
            {testing ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
            {testing ? (isAr ? "جاري الاختبار..." : "Testing...") : (isAr ? "اختبار" : "Test")}
          </button>
          <button
            onClick={handleImport}
            disabled={importing || !testResult || !testResult.valid || hasUnresolvedRefs}
            className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            title={!testResult ? (isAr ? "يجب اختبار الملف أولاً للتأكد من سلامة البيانات" : "Please test the file first") : undefined}
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {importing ? (isAr ? "جاري الاستيراد..." : "Importing...") : (isAr ? "استيراد" : "Import")}
          </button>
          <button
            onClick={() => { setFile(null); setParsedRows([]); setParsedHeaders([]); setTestResult(null); setImportResult(null); }}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            {isAr ? "تبديل الملف" : "Change File"}
          </button>
          {!testResult && (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
              <AlertTriangle size={13} className="shrink-0" />
              {isAr ? "يجب الضغط على (اختبار) أولاً للتحقق من صحة ومطابقة البيانات قبل الاستيراد" : "Please click (Test) first to validate data before importing"}
            </span>
          )}
        </div>
      )}

      {/* Test result - hidden when only reference errors (shown via separate section) */}
      {testResult && (!testResult.valid || !testResult.referenceErrors?.length) && (
        <div className={`rounded-2xl border p-4 ${
          testResult.valid
            ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
            : "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {testResult.valid ? (
              <CheckCircle2 size={18} className="text-emerald-500" />
            ) : (
              <XCircle size={18} className="text-red-500" />
            )}
            <span className={`text-sm font-bold ${testResult.valid ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
              {testResult.valid
                ? (isAr ? "البيانات صالحة للاستيراد" : "Data is valid for import")
                : (isAr ? "يوجد أخطاء في البيانات" : "Data contains errors")}
            </span>
          </div>
          {testResult.errors && testResult.errors.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {testResult.errors.map((err, i) => (
                <p key={i} className="text-xs text-red-600 dark:text-red-400">
                  {isAr ? `الصف ${err.row}: ${err.field} — ${err.message}` : `Row ${err.row}: ${err.field} — ${err.message}`}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reference field fixes */}
      {testResult?.referenceErrors && testResult.referenceErrors.length > 0 && (
        <div className="bg-white dark:bg-[#0F172A] border border-amber-200 dark:border-amber-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-100 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-400">
              <AlertTriangle size={16} />
              {isAr ? "حقول مرجعية غير موجودة" : "Missing Reference Fields"}
            </div>
          </div>
          <div className="p-4 space-y-3">
            {testResult.referenceErrors.map((ref) => {
              const fieldLabel = refFieldLabel(ref.field);
              return (
                <div key={ref.field} className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {fieldLabel}
                    <span className="text-slate-400 font-normal"> ({isAr ? "القيم المفقودة" : "missing"}: {ref.missingValues.slice(0, 5).map((v) => `"${v}"`).join(", ")}{ref.missingValues.length > 5 ? ` +${ref.missingValues.length - 5}` : ""})</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input
                        type="radio"
                        name={`fix-${ref.field}`}
                        checked={fieldFixes[ref.field] === "skip"}
                        onChange={() => setFieldFixes((prev) => ({ ...prev, [ref.field]: "skip" }))}
                        className="accent-slate-500"
                      />
                      <Ban size={12} />
                      {isAr ? "تجاهل (اترك الخلية فارغة)" : "Skip (leave empty)"}
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 cursor-pointer">
                      <input
                        type="radio"
                        name={`fix-${ref.field}`}
                        checked={fieldFixes[ref.field] === "create"}
                        onChange={() => setFieldFixes((prev) => ({ ...prev, [ref.field]: "create" }))}
                        className="accent-emerald-500"
                      />
                      <Plus size={12} />
                      {isAr ? "إنشاء تلقائي" : "Auto-create"}
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Import result */}
      {importResult && (
        <div className={`rounded-2xl border p-4 ${
          importResult.success
            ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
            : "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {importResult.success ? (
              <CheckCircle2 size={18} className="text-emerald-500" />
            ) : (
              <XCircle size={18} className="text-red-500" />
            )}
            <span className={`text-sm font-bold ${importResult.success ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
              {importResult.success
                ? (isAr
                  ? `تم الاستيراد بنجاح — إنشاء ${importResult.created || 0} تحديث ${importResult.updated || 0}`
                  : `Import completed — ${importResult.created || 0} created, ${importResult.updated || 0} updated`)
                : (isAr ? "فشل الاستيراد" : "Import failed")}
            </span>
          </div>
          {importResult.errors && importResult.errors.length > 0 && (
            <div className="space-y-1">
              {importResult.errors.map((err, i) => (
                <p key={i} className="text-xs text-red-600 dark:text-red-400">{err}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Data preview table */}
      {parsedRows.length > 0 && (
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
              <Table size={14} />
              {isAr ? "معاينة البيانات" : "Data Preview"}
              <span className="text-slate-400 dark:text-slate-500 font-normal">({parsedRows.length} {isAr ? "صف" : "row"}{!isAr && parsedRows.length !== 1 ? "s" : ""})</span>
            </div>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900">
                  <th className="px-3 py-2 text-start font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">#</th>
                  {parsedHeaders.map((h) => (
                    <th key={h} className="px-3 py-2 text-start font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">
                      <span className={headerFieldMap.has(h) ? "text-primary dark:text-tertiary" : "text-red-400"}>
                        {headerFieldMap.get(h) ? (isAr ? headerFieldMap.get(h)!.labelAr : headerFieldMap.get(h)!.label) : h}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedRows.slice(0, 50).map((row, ri) => (
                  <tr key={ri} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 border-b border-slate-50 dark:border-slate-800/30">
                    <td className="px-3 py-1.5 text-slate-400 dark:text-slate-500 font-bold">{ri + 1}</td>
                    {parsedHeaders.map((h) => (
                      <td key={h} className="px-3 py-1.5 text-slate-700 dark:text-slate-300 max-w-[200px] truncate">{String(row[h] ?? "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedRows.length > 50 && (
              <div className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 text-center border-t border-slate-100 dark:border-slate-800">
                {isAr ? `وعرض ${parsedRows.length - 50} صف آخر...` : `And ${parsedRows.length - 50} more rows...`}
              </div>
            )}
          </div>
        </div>
      )}

      <ImportImagesModal
        isOpen={importImagesModalOpen}
        onClose={() => setImportImagesModalOpen(false)}
        locale={locale}
        tableName={tableName}
        tableLabelAr={tableLabelAr}
        availableFields={availableFields}
      />
      <ExportTemplateModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        availableFields={availableFields}
        locale={locale}
        tableName={tableName}
        tableLabelAr={tableLabelAr}
      />
    </div>
  );
}
