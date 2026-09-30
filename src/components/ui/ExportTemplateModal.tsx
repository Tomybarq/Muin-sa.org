"use client";

import React, { useState } from "react";
import { X, Search, Plus, GripVertical, ChevronDown, Download, FileDown, Check, Save } from "lucide-react";
import type { ExportField } from "./ExportModal";

interface ExportTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableFields: ExportField[];
  locale: string;
  tableName: string;
  tableLabelAr?: string;
}

export default function ExportTemplateModal({
  isOpen,
  onClose,
  availableFields,
  locale,
  tableName,
  tableLabelAr,
}: ExportTemplateModalProps) {
  const isAr = locale === "ar";
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [exporting, setExporting] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  const isNonImageAttachment = (f: ExportField) => {
    const fType = f.type as string | undefined;
    if (fType === "image") return false;
    const k = f.key.toLowerCase();
    return k.endsWith("proof") || k.endsWith("proofid") || k.includes("attachment") || k.includes("file");
  };

  const filteredAvailableFields = availableFields.filter((f) => !isNonImageAttachment(f));

  const availableKeys = filteredAvailableFields
    .map((f) => f.key)
    .filter((key) => !selectedKeys.includes(key))
    .filter((key) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const field = filteredAvailableFields.find((f) => f.key === key);
      if (!field) return true;
      return field.label.toLowerCase().includes(q) || field.labelAr.toLowerCase().includes(q);
    });

  const addField = (key: string) => setSelectedKeys((prev) => [...prev, key]);
  const removeField = (key: string) => setSelectedKeys((prev) => prev.filter((k) => k !== key));

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setSelectedKeys((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(dragIdx, 1);
      copy.splice(idx, 0, moved);
      return copy;
    });
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  const handleExportTemplate = async () => {
    if (selectedKeys.length === 0) return;
    setExporting(true);
    try {
      const ExcelJS = await import("exceljs");
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(isAr && tableLabelAr ? tableLabelAr : "Template");

      // RTL for Arabic
      if (isAr) {
        ws.views = [{ rightToLeft: true }];
      }

      // Hidden reference sheet for dropdown options
      const refSheet = wb.addWorksheet("_refs");
      refSheet.state = "hidden";

      // Row 1: User-friendly labels (locale-aware)
      const labels = selectedKeys.map((key) => {
        const field = availableFields.find((f) => f.key === key);
        return field ? (isAr ? field.labelAr : field.label) : key;
      });
      const labelRow = ws.addRow(labels);
      labelRow.font = { bold: true, size: 11, name: "Calibri" };
      labelRow.alignment = { wrapText: true, vertical: "bottom" };
      labelRow.height = 22;

      // Row 2: Technical field keys (grey) — used by import
      const keyRow = ws.addRow(selectedKeys);
      keyRow.font = { color: { argb: "FF808080" }, size: 10, name: "Calibri" };
      keyRow.alignment = { wrapText: true, vertical: "bottom" };
      keyRow.height = 18;

      const isDateField = (key: string) => {
        const k = key.toLowerCase();
        return k.endsWith("at") || k.includes("date");
      };

      let refCol = 1;

      // Track which ref columns belong to which field for dependent lookups
      const fieldRefCol: Record<string, number> = {};

      // First pass: write regular options to ref sheet, record refCol per field
      for (let ci = 0; ci < selectedKeys.length; ci++) {
        const key = selectedKeys[ci];
        const field = availableFields.find((f) => f.key === key);
        const col = ws.getColumn(ci + 1);
        const colLetter = col.letter;

        // Column width based on label + key
        const maxLen = Math.max(labels[ci]?.length || 0, key.length);
        col.width = Math.min(Math.max(maxLen * 2.2, 14), 45);

        // Date formatting & validation
        if (isDateField(key)) {
          col.numFmt = "yyyy-mm-dd";
          const range = `${colLetter}3:${colLetter}1002`;
          (ws as any).dataValidations.add(range, {
            type: "date",
            operator: "greaterThanOrEqual",
            formulae: ["1900-01-01"],
            allowBlank: true,
            showErrorMessage: true,
            errorStyle: "stop",
            errorTitle: isAr ? "تنسيق غير صحيح" : "Invalid Format",
            error: isAr
              ? "الرجاء إدخال تاريخ صحيح بصيغة YYYY-MM-DD"
              : "Please enter a valid date (YYYY-MM-DD)",
          });
        }

        // Dropdown validation for fields with options
        if (field?.options?.length) {
          // Write options to ref sheet
          field.options.forEach((opt, ri) => {
            const optVal = typeof opt === "string" ? opt : (opt.labelAr || opt.label || opt.value);
            refSheet.getCell(ri + 1, refCol).value = optVal;
          });

          const refLetter = String.fromCharCode(64 + refCol);
          const range = `${colLetter}3:${colLetter}1002`;
          (ws as any).dataValidations.add(range, {
            type: "list",
            formulae: [`_refs!$${refLetter}$1:$${refLetter}$${field.options.length}`],
            allowBlank: true,
            showErrorMessage: true,
            errorStyle: "stop",
            errorTitle: isAr ? "اختيار غير صحيح" : "Invalid Selection",
            error: isAr
              ? "الرجاء اختيار قيمة من القائمة. الإدخال اليدوي غير مسموح."
              : "Please select a value from the list. Manual entry is not allowed.",
          });

          fieldRefCol[key] = refCol;
          refCol++;
        } else if (field?.type === "boolean") {
          const boolOpts = isAr ? ["نعم", "لا"] : ["Yes", "No"];
          boolOpts.forEach((opt, ri) => {
            refSheet.getCell(ri + 1, refCol).value = opt;
          });

          const refLetter = String.fromCharCode(64 + refCol);
          const range = `${colLetter}3:${colLetter}1002`;
          (ws as any).dataValidations.add(range, {
            type: "list",
            formulae: [`_refs!$${refLetter}$1:$${refLetter}$2`],
            allowBlank: true,
            showErrorMessage: true,
            errorStyle: "stop",
            errorTitle: isAr ? "اختيار غير صحيح" : "Invalid Selection",
            error: isAr
              ? "الرجاء اختيار قيمة من القائمة. الإدخال اليدوي غير مسموح."
              : "Please select a value from the list. Manual entry is not allowed.",
          });

          fieldRefCol[key] = refCol;
          refCol++;
        }
      }

      // Second pass: dependent (cascading) dropdowns
      for (let ci = 0; ci < selectedKeys.length; ci++) {
        const key = selectedKeys[ci];
        const field = availableFields.find((f) => f.key === key);
        const col = ws.getColumn(ci + 1);
        const colLetter = col.letter;

        if (!field?.dependentOn || !field.parentValueMap) continue;

        const parentIdx = selectedKeys.indexOf(field.dependentOn);
        if (parentIdx === -1) continue;

        const parentColLetter = ws.getColumn(parentIdx + 1).letter;

        // Write city data and named ranges on the SAME sheet (hidden columns)
        // INDIRECT in data validation does not reliably resolve named ranges on other sheets
        let govIdx = 0;
        for (const [govName, cities] of Object.entries(field.parentValueMap)) {
          const safeName = govName.replace(/[\s-]/g, "");
          // City data goes after all selected columns, starting row 3 (after headers)
          const cityColIndex = selectedKeys.length + 1 + govIdx;
          const cityColLetter = ws.getColumn(cityColIndex).letter;

          cities.forEach((city, ri) => {
            ws.getCell(ri + 3, cityColIndex).value = city;
          });
          ws.getColumn(cityColIndex).hidden = true;

          // Named range on the same sheet
          const sheetName = ws.name;
          wb.definedNames.add(
            `'${sheetName}'!\$${cityColLetter}\$3:\$${cityColLetter}\$${cities.length + 2}`,
            `_city${safeName}`
          );

          govIdx++;
        }

        // Data validation: INDIRECT with SUBSTITUTE + IF to avoid #REF! when empty
        const range = `${colLetter}3:${colLetter}1002`;
        (ws as any).dataValidations.add(range, {
          type: "list",
          formulae: [`IF(${parentColLetter}3="","",INDIRECT("_city"&SUBSTITUTE(SUBSTITUTE(${parentColLetter}3," ",""),"-","")))`],
          allowBlank: true,
          showErrorMessage: true,
          errorStyle: "stop",
          errorTitle: isAr ? "اختيار غير صحيح" : "Invalid Selection",
          error: isAr
            ? "الرجاء اختيار المنطقة أولاً ثم المدينة من القائمة"
            : "Please select a governorate first, then choose a city",
        });
      }

      const buf = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
      const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${isAr ? "قالب" : "Template"}-${isAr && tableLabelAr ? tableLabelAr : tableName}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch {}
    setExporting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#0B0F19] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileDown size={20} className="text-primary dark:text-tertiary" />
            {isAr ? "تصدير القالب" : "Export Template"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={18} />
          </button>
        </div>

        {/* Body: two columns */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden">
          {/* Left column - Available fields */}
          <div className="flex flex-col border-e border-slate-100 dark:border-slate-800/50 overflow-hidden">
            <div className="p-4 pb-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? "بحث في الحقول المتاحة..." : "Search available fields..."}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-0.5">
              <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 px-2">
                {isAr ? "الحقول المتاحة" : "Available Fields"}
              </div>
              {availableKeys.length === 0 && (
                <div className="text-xs text-slate-400 dark:text-slate-500 px-2 py-4 text-center">
                  {isAr ? "لا توجد حقول متاحة" : "No available fields"}
                </div>
              )}
              {availableKeys.map((key) => {
                const field = availableFields.find((f) => f.key === key)!;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 group transition-colors"
                  >
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {isAr ? field.labelAr : field.label}
                    </span>
                    <button
                      onClick={() => addField(key)}
                      className="md:opacity-0 md:group-hover:opacity-100 max-md:opacity-100 p-1 hover:bg-primary/10 dark:hover:bg-tertiary/10 rounded-lg text-primary dark:text-tertiary transition-all cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column - Selected fields */}
          <div className="flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-0.5 pt-4">
              <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                {isAr ? "الحقول المحددة للقالب" : "Selected Fields"}
                <span className="ml-1.5 text-primary dark:text-tertiary">({selectedKeys.length})</span>
              </div>
              {selectedKeys.length === 0 && (
                <div className="text-xs text-slate-400 dark:text-slate-500 px-2 py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                  {isAr ? "اختر الحقول من اليسار" : "Choose fields from the left"}
                </div>
              )}
              {selectedKeys.map((key, idx) => {
                const field = availableFields.find((f) => f.key === key);
                return (
                  <div
                    key={key}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all ${
                      dragIdx === idx
                        ? "border-primary/40 dark:border-tertiary/40 bg-primary/5 dark:bg-tertiary/5 shadow-sm"
                        : "border-transparent bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    } group cursor-grab active:cursor-grabbing`}
                  >
                    <GripVertical size={13} className="text-slate-300 dark:text-slate-600 shrink-0 cursor-grab" />
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-4 shrink-0">{idx + 1}.</span>
                    <span className="flex-1 text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                      {isAr && field ? field.labelAr : field?.label || key}
                    </span>
                    <button
                      onClick={() => removeField(key)}
                      className="md:opacity-0 md:group-hover:opacity-100 max-md:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-red-400 hover:text-red-600 transition-all cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => {
                          if (idx === 0) return;
                          setSelectedKeys((prev) => {
                            const copy = [...prev];
                            [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
                            return copy;
                          });
                        }}
                        disabled={idx === 0}
                        className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 disabled:opacity-20 transition-all cursor-pointer"
                      >
                        <ChevronDown size={11} className="rotate-180" />
                      </button>
                      <button
                        onClick={() => {
                          if (idx === selectedKeys.length - 1) return;
                          setSelectedKeys((prev) => {
                            const copy = [...prev];
                            [copy[idx], copy[idx + 1]] = [copy[idx + 1], copy[idx]];
                            return copy;
                          });
                        }}
                        disabled={idx === selectedKeys.length - 1}
                        className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 disabled:opacity-20 transition-all cursor-pointer"
                      >
                        <ChevronDown size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {isAr ? "النوع: XLSX — صفان (تسمية + مفتاح) مع قائمة منسدلة للتصنيف والمنطقة" : "Format: XLSX — 2-row header (label + key) with dropdowns for category & governorate"}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              onClick={handleExportTemplate}
              disabled={selectedKeys.length === 0 || exporting}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-primary dark:bg-tertiary text-white rounded-xl hover:opacity-90 disabled:opacity-40 cursor-pointer transition-all"
            >
              <Download size={14} />
              {exporting ? (isAr ? "جاري التحميل..." : "Downloading...") : (isAr ? "تحميل القالب" : "Download Template")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
