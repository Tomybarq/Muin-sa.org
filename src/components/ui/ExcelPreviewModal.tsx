"use client";

import React, { useState, useEffect } from "react";
import { X, Download, FileSpreadsheet, AlertCircle, Loader2 } from "lucide-react";

interface ExcelSheetData {
  name: string;
  rows: string[][];
}

interface ExcelPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachmentId?: number | null;
  filename?: string;
  fileUrl?: string;
  isAr?: boolean;
}

export default function ExcelPreviewModal({
  isOpen,
  onClose,
  attachmentId,
  filename = "monthly_report.xlsx",
  fileUrl,
  isAr = true,
}: ExcelPreviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheets, setSheets] = useState<ExcelSheetData[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSheets([]);
      setError(null);
      return;
    }

    const loadExcelFile = async () => {
      setLoading(true);
      setError(null);

      try {
        let arrayBuffer: ArrayBuffer;
        let finalDownloadUrl = fileUrl || null;

        if (attachmentId) {
          finalDownloadUrl = `/api/attachments/${attachmentId}/file`;
          const res = await fetch(finalDownloadUrl);
          if (!res.ok) throw new Error("تعذر جلب ملف الإكسل");
          arrayBuffer = await res.arrayBuffer();
        } else if (fileUrl) {
          const res = await fetch(fileUrl);
          if (!res.ok) throw new Error("تعذر جلب ملف الإكسل");
          arrayBuffer = await res.arrayBuffer();
        } else {
          throw new Error("لا يوجد معرف أو رابط للمرفق");
        }

        setDownloadUrl(finalDownloadUrl);

        // Dynamically import ExcelJS
        const ExcelJS = await import("exceljs");
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);

        const loadedSheets: ExcelSheetData[] = [];

        workbook.eachSheet((worksheet) => {
          // Skip hidden or very-hidden sheets
          if (worksheet.state === "hidden" || worksheet.state === "veryHidden") return;
          const sheetRows: string[][] = [];
          worksheet.eachRow({ includeEmpty: false }, (row) => {
            const rowValues: string[] = [];
            row.eachCell({ includeEmpty: true }, (cell) => {
              let val = "";
              if (cell.value !== null && cell.value !== undefined) {
                if (typeof cell.value === "object") {
                  if ("result" in cell.value) {
                    val = String(cell.value.result ?? "");
                  } else if ("text" in cell.value) {
                    val = String(cell.value.text ?? "");
                  } else if ("richText" in cell.value && Array.isArray((cell.value as any).richText)) {
                    val = (cell.value as any).richText.map((rt: any) => rt.text).join("");
                  } else {
                    val = String(cell.value);
                  }
                } else {
                  val = String(cell.value);
                }
              }
              rowValues.push(val);
            });
            sheetRows.push(rowValues);
          });

          if (sheetRows.length > 0) {
            loadedSheets.push({
              name: worksheet.name || "Sheet",
              rows: sheetRows,
            });
          }
        });

        if (loadedSheets.length === 0) {
          setError(isAr ? "الملف فارغ أو لا يحتوي على صفوف بيانات" : "Excel file is empty");
        } else {
          setSheets(loadedSheets);
          setActiveSheetIndex(0);
        }
      } catch (err: any) {
        console.error("Excel preview parse error:", err);
        setError(isAr ? "حدث خطأ أثناء قراءة ومعاينة ملف الإكسل" : "Failed to parse Excel file");
      } finally {
        setLoading(false);
      }
    };

    loadExcelFile();
  }, [isOpen, attachmentId, fileUrl, isAr]);

  if (!isOpen) return null;

  const currentSheet = sheets[activeSheetIndex];
  const headers = currentSheet?.rows[0] || [];
  const bodyRows = currentSheet?.rows.slice(1) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden dir-rtl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/50 dark:border-amber-800/50 shadow-xs">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                {isAr ? "معاينة ملف الإكسل" : "Excel File Preview"}
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-sm dir-ltr text-end">{filename}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {downloadUrl && (
              <a
                href={downloadUrl}
                download={filename}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
              >
                <Download size={14} />
                <span>{isAr ? "تنزيل الملف" : "Download"}</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 size={32} className="animate-spin text-primary dark:text-tertiary" />
              <span className="text-xs font-semibold">{isAr ? "جاري قراءة وتحليل بيانات الإكسل..." : "Loading Excel file..."}</span>
            </div>
          )}

          {error && !loading && (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-rose-500">
              <AlertCircle size={36} />
              <span className="text-sm font-bold">{error}</span>
            </div>
          )}

          {!loading && !error && currentSheet && (
            <div className="space-y-4">
              {/* Sheets Tabs if multiple */}
              {sheets.length > 1 && (
                <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-2">
                  {sheets.map((sheet, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => setActiveSheetIndex(sIdx)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                        activeSheetIndex === sIdx
                          ? "bg-primary dark:bg-tertiary text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {sheet.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Data Table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/40">
                <table className="w-full text-xs text-start">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="p-3 text-center w-12 border-e border-slate-200 dark:border-slate-700/60">#</th>
                      {headers.map((h, idx) => (
                        <th key={idx} className="p-3 text-start border-e border-slate-200 dark:border-slate-700/60 last:border-e-0 whitespace-nowrap">
                          {h || `عمود ${idx + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {bodyRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 text-center text-slate-400 font-medium border-e border-slate-200 dark:border-slate-800">
                          {rIdx + 1}
                        </td>
                        {headers.map((_, cIdx) => (
                          <td key={cIdx} className="p-3 text-slate-800 dark:text-slate-200 border-e border-slate-100 dark:border-slate-800/60 last:border-e-0">
                            {row[cIdx] || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end text-xs text-slate-400">
          <span>
            {currentSheet ? `${isAr ? "إجمالي الصفوف:" : "Total Rows:"} ${bodyRows.length + 1}` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
