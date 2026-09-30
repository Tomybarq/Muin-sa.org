"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Search, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Download, FileDown, Check, Save } from "lucide-react";
import * as XLSX from "xlsx";
import { encodeId } from "@/lib/idObfuscator";

export interface ExportField {
  key: string;
  label: string;
  labelAr: string;
  type?: "text" | "image" | "boolean";
  options?: { value: string; label?: string; labelAr?: string }[] | string[];
  valueMap?: Record<string, { ar: string; en: string } | string>;
  formatter?: (val: any, record: any, isAr: boolean) => string;
  dependentOn?: string;
  parentValueMap?: Record<string, string[]>;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  tableLabelAr?: string;
  availableFields: ExportField[];
  selectedIds: number[];
  recordId?: number;
  allRecords: Record<string, any>[];
  screenPath: string;
  locale: string;
}

function getNestedValue(obj: any, path: string): any {
  const parts = path.split(".");
  let val: any = obj;
  for (const part of parts) {
    if (val === null || val === undefined) return "";
    val = val[part];
  }
  return val ?? "";
}

const ENUM_LABELS_AR: Record<string, string> = {
  // Common System Statuses & Defaults
  true: "نعم",
  false: "لا",
  yes: "نعم",
  no: "لا",
  active: "نشط",
  inactive: "غير نشط",
  pending: "معلق",
  approved: "معتمد",
  rejected: "مرفوض",
  draft: "مسودة",
  published: "منشور",
  enabled: "مفعل",
  disabled: "معطل",
};

export default function ExportModal({
  isOpen,
  onClose,
  tableName,
  tableLabelAr,
  availableFields,
  selectedIds,
  recordId,
  allRecords,
  screenPath,
  locale,
}: ExportModalProps) {
  const isAr = locale === "ar";
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [templates, setTemplates] = useState<{ id: number; name: string; fields: string }[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [newTemplateMode, setNewTemplateMode] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [exporting, setExporting] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const [includeId, setIncludeId] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const rawIds = recordId ? [recordId] : selectedIds && selectedIds.length > 0 ? selectedIds : allRecords.map((r) => r.id);
  const ids = rawIds.filter((id) => typeof id === "number" && !isNaN(id) && id > 0);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setSelectedKeys([]);
      setSearchQuery("");
      setSelectedTemplateId(null);
      setNewTemplateMode(false);
      setNewTemplateName("");
      setTemplateDropdownOpen(false);
    }
  }, [isOpen]);

  // Fetch templates on mount
  useEffect(() => {
    if (!isOpen) return;
    fetch(`/api/export-templates?screen=${encodeURIComponent(screenPath)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTemplates(data);
      })
      .catch(() => {});
  }, [isOpen, screenPath]);

  // Focus input when new template mode activates
  useEffect(() => {
    if (newTemplateMode && inputRef.current) inputRef.current.focus();
  }, [newTemplateMode]);

  // Close template dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (templateRef.current && !templateRef.current.contains(e.target as Node)) {
        setTemplateDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
  const currentTemplate = templates.find((t) => t.id === selectedTemplateId);

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

  const handleLoadTemplate = (template: { id: number; name: string; fields: string }) => {
    try {
      const keys = JSON.parse(template.fields);
      if (Array.isArray(keys)) {
        setSelectedKeys(keys.filter((k: string) => filteredAvailableFields.some((f) => f.key === k)));
      }
    } catch {}
    setSelectedTemplateId(template.id);
    setTemplateDropdownOpen(false);
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) return;
    try {
      const res = await fetch("/api/export-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTemplateName.trim(), screen: screenPath, fields: selectedKeys }),
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates((prev) => [...prev, { id: data.id, name: data.name, fields: data.fields }]);
        setSelectedTemplateId(data.id);
        setNewTemplateMode(false);
        setNewTemplateName("");
      }
    } catch {}
  };

  const handleDeleteTemplate = async (id: number) => {
    try {
      const res = await fetch(`/api/export-templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        if (selectedTemplateId === id) setSelectedTemplateId(null);
      }
    } catch {}
  };

  const handleExport = async () => {
    if (ids.length === 0 || selectedKeys.length === 0) return;
    setExporting(true);
    try {
      const ExcelJS = await import("exceljs");
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(isAr && tableLabelAr ? tableLabelAr : tableName);

      // RTL for Arabic
      if (isAr) {
        ws.views = [{ rightToLeft: true }];
      }

      const idSet = new Set(ids);
      const data = allRecords.filter((r) => idSet.has(r.id));
      const fieldMap = new Map(filteredAvailableFields.map((f) => [f.key, f]));
      const headerKeys = includeId ? ["id", ...selectedKeys] : selectedKeys;

      // Row 1: Localized human-readable headers
      const labels = headerKeys.map((key) => {
        if (key === "id") return isAr ? "المعرف" : "ID";
        const field = fieldMap.get(key);
        return field ? (isAr ? field.labelAr : field.label) : key;
      });

      const headerRow = ws.addRow(labels);
      headerRow.font = { bold: true, size: 11, name: "Calibri" };
      headerRow.alignment = { wrapText: true, vertical: "bottom" };
      headerRow.height = 22;

      // Row 2: Technical field keys (grey) — included when includeId is true for seamless re-importing
      if (includeId) {
        const keyRow = ws.addRow(headerKeys);
        keyRow.font = { color: { argb: "FF808080" }, size: 10, name: "Calibri" };
        keyRow.alignment = { wrapText: true, vertical: "bottom" };
        keyRow.height = 18;
      }

      const colWidths = labels.map((h, i) =>
        Math.min(Math.max(h.length * 1.8, headerKeys[i]?.length * 1.5 || 10, 10), 35)
      );

      // Add reference sheet _refs for Excel dropdown validation
      const refSheet = wb.addWorksheet("_refs");
      refSheet.state = "hidden";
      let refCol = 1;

      const dataStartRow = includeId ? 3 : 2;

      headerKeys.forEach((key, ci) => {
        const field = fieldMap.get(key);
        if (field?.options?.length) {
          const parentKeyIndex = field.dependentOn ? headerKeys.indexOf(field.dependentOn) : -1;
          if (parentKeyIndex >= 0 && field.parentValueMap) {
            // Dependent dropdown formula using OFFSET + MATCH + COUNTIF in Excel
            const parentColLetter = ws.getColumn(parentKeyIndex + 1).letter;
            const refParentCol = refCol;
            const refDepCol = refCol + 1;
            refCol += 2;

            let rowIdx = 1;
            Object.entries(field.parentValueMap).forEach(([parentVal, children]) => {
              children.forEach((childVal) => {
                refSheet.getCell(rowIdx, refParentCol).value = parentVal;
                refSheet.getCell(rowIdx, refDepCol).value = childVal;
                rowIdx++;
              });
            });

            const totalDepRows = rowIdx - 1;

            let refTempP = refParentCol;
            let refLetterP = "";
            while (refTempP > 0) {
              const mod = (refTempP - 1) % 26;
              refLetterP = String.fromCharCode(mod + 65) + refLetterP;
              refTempP = Math.floor((refTempP - mod - 1) / 26);
            }

            let refTempD = refDepCol;
            let refLetterD = "";
            while (refTempD > 0) {
              const mod = (refTempD - 1) % 26;
              refLetterD = String.fromCharCode(mod + 65) + refLetterD;
              refTempD = Math.floor((refTempD - mod - 1) / 26);
            }
            const colLetter = ws.getColumn(ci + 1).letter;
            const parentCell = `$${parentColLetter}${dataStartRow}`;
            const parentRange = `_refs!$${refLetterP}$1:$${refLetterP}$${totalDepRows}`;
            const emptyRange = `_refs!$Z$999:$Z$999`;
            const offsetFormula = `OFFSET(_refs!$${refLetterD}$1, MATCH(${parentCell}, ${parentRange}, 0)-1, 0, COUNTIF(${parentRange}, ${parentCell}), 1)`;
            const safeFormula = `IF(OR(${parentCell}="", ISERROR(MATCH(${parentCell}, ${parentRange}, 0))), ${emptyRange}, ${offsetFormula})`;

            (ws as any).dataValidations.add(`${colLetter}${dataStartRow}:${colLetter}1002`, {
              type: "list",
              formulae: [safeFormula],
              allowBlank: true,
              showErrorMessage: true,
              errorStyle: "stop",
              errorTitle: isAr ? "اختيار غير صحيح" : "Invalid Selection",
              error: isAr ? "الرجاء اختيار مدينة تابعة للمنطقة المحددة" : "Please select a city from the selected governorate",
            });
          } else {
            // Standard independent dropdown list
            field.options.forEach((opt, ri) => {
              const optVal = typeof opt === "string" ? opt : (isAr ? opt.labelAr || opt.label || opt.value : opt.label || opt.value);
              refSheet.getCell(ri + 1, refCol).value = optVal;
            });

            const colLetter = ws.getColumn(ci + 1).letter;
            let refTemp = refCol;
            let refLetter = "";
            while (refTemp > 0) {
              const mod = (refTemp - 1) % 26;
              refLetter = String.fromCharCode(mod + 65) + refLetter;
              refTemp = Math.floor((refTemp - mod - 1) / 26);
            }
            (ws as any).dataValidations.add(`${colLetter}${dataStartRow}:${colLetter}1002`, {
              type: "list",
              formulae: [`_refs!$${refLetter}$1:$${refLetter}$${field.options.length}`],
              allowBlank: true,
              showErrorMessage: true,
              errorStyle: "stop",
              errorTitle: isAr ? "اختيار غير صحيح" : "Invalid Selection",
              error: isAr ? "الرجاء اختيار قيمة من القائمة المنسدلة" : "Please select a value from the dropdown list",
            });
            refCol++;
          }
        } else if (field?.type === "boolean") {
          const boolOpts = isAr ? ["نعم", "لا"] : ["Yes", "No"];
          boolOpts.forEach((opt, ri) => {
            refSheet.getCell(ri + 1, refCol).value = opt;
          });

          const colLetter = ws.getColumn(ci + 1).letter;
          let refTemp = refCol;
          let refLetter = "";
          while (refTemp > 0) {
            const mod = (refTemp - 1) % 26;
            refLetter = String.fromCharCode(mod + 65) + refLetter;
            refTemp = Math.floor((refTemp - mod - 1) / 26);
          }
          (ws as any).dataValidations.add(`${colLetter}${dataStartRow}:${colLetter}1002`, {
            type: "list",
            formulae: [`_refs!$${refLetter}$1:$${refLetter}$2`],
            allowBlank: true,
            showErrorMessage: true,
            errorStyle: "stop",
            errorTitle: isAr ? "اختيار غير صحيح" : "Invalid Selection",
            error: isAr ? "الرجاء اختيار قيمة من القائمة المنسدلة" : "Please select a value from the dropdown list",
          });
          refCol++;
        }
      });

      // Collect image data for each row (field index → fetch promise)
      const imageTasks: { rowIdx: number; colIdx: number; url: string }[] = [];

      for (let di = 0; di < data.length; di++) {
        const item = data[di];

        // Odoo Relational Row Expansion: Check max relational items for this record
        let maxRelationalRows = 1;
        for (const key of headerKeys) {
          if (key.includes(".")) {
            const [relKey] = key.split(".");
            const arr = item[relKey];
            if (Array.isArray(arr) && arr.length > maxRelationalRows) {
              maxRelationalRows = arr.length;
            }
          }
        }

        for (let lineIdx = 0; lineIdx < maxRelationalRows; lineIdx++) {
          const row: string[] = [];
          for (const key of headerKeys) {
            if (key === "id") {
              row.push(lineIdx === 0 ? encodeId(item.id) : "");
              continue;
            }
            const field = fieldMap.get(key);
            if (!field) {
              row.push("");
              continue;
            }
            if (field.type === "image") {
              if (lineIdx === 0 && !includeId) {
                const logoUrl = getNestedValue(item, key);
                if (logoUrl) {
                  imageTasks.push({
                    rowIdx: ws.rowCount + 1,
                    colIdx: headerKeys.indexOf(key),
                    url: logoUrl,
                  });
                }
              }
              row.push("");
            } else if (key.includes(".")) {
              const parts = key.split(".");
              const relKey = parts[0];
              const arr = item[relKey];

              // Check if the top-level relation is an Array (Odoo row expansion)
              if (Array.isArray(arr)) {
                const childObj = arr[lineIdx] || null;
                const subKey = parts.slice(1).join(".");
                let val = childObj ? getNestedValue(childObj, subKey) : null;

                let formatted = "";
                if (val != null && val !== "") {
                  if (field.formatter) {
                    formatted = field.formatter(val, childObj, isAr);
                  } else if (field.valueMap && val in field.valueMap) {
                    const mapped = field.valueMap[val];
                    formatted = typeof mapped === "string" ? mapped : (isAr ? mapped.ar : mapped.en);
                  } else if (field.options && Array.isArray(field.options)) {
                    const opt = field.options.find((o) => (typeof o === "string" ? o === val : o.value === val));
                    if (opt && typeof opt === "object") {
                      formatted = isAr ? (opt.labelAr || opt.label || String(val)) : (opt.label || String(val));
                    } else {
                      formatted = String(val);
                    }
                  } else if (typeof val === "boolean" || field.type === "boolean") {
                    formatted = val ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No");
                  } else if (subKey === "birthDate" || subKey.endsWith("Date")) {
                    formatted = String(val).slice(0, 10);
                  } else {
                    const strVal = String(val).trim();
                    if (isAr && !includeId && ENUM_LABELS_AR[strVal]) {
                      formatted = ENUM_LABELS_AR[strVal];
                    } else {
                      formatted = strVal;
                    }
                  }
                }
                row.push(formatted);
              } else {
                // Non-array nested object (e.g. city.governorate.nameAr, needs.shelter)
                if (lineIdx > 0) {
                  row.push("");
                  continue;
                }
                const val = getNestedValue(item, key);
                let formatted = "";
                if (val != null && val !== "") {
                  if (typeof val === "object") {
                    formatted = JSON.stringify(val);
                  } else if (field.formatter) {
                    formatted = field.formatter(val, item, isAr);
                  } else if (field.valueMap && val in field.valueMap) {
                    const mapped = field.valueMap[val];
                    formatted = typeof mapped === "string" ? mapped : (isAr ? mapped.ar : mapped.en);
                  } else if (field.options && Array.isArray(field.options)) {
                    const opt = field.options.find((o) => (typeof o === "string" ? o === val : o.value === val));
                    if (opt && typeof opt === "object") {
                      formatted = isAr ? (opt.labelAr || opt.label || String(val)) : (opt.label || String(val));
                    } else {
                      formatted = String(val);
                    }
                  } else if (typeof val === "boolean" || field.type === "boolean") {
                    formatted = val ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No");
                  } else if (key.endsWith("Date") || key.endsWith("At")) {
                    formatted = String(val).slice(0, 10);
                  } else {
                    const strVal = String(val).trim();
                    if (isAr && !includeId && ENUM_LABELS_AR[strVal]) {
                      formatted = ENUM_LABELS_AR[strVal];
                    } else {
                      formatted = strVal;
                    }
                  }
                }
                row.push(formatted);
              }
            } else {
              // Scalar parent field
              if (lineIdx > 0) {
                row.push("");
                continue;
              }

              const val = getNestedValue(item, key);
              let formatted = "";

              if (val != null && val !== "") {
                if (field.formatter) {
                  formatted = field.formatter(val, item, isAr);
                } else if (field.valueMap && val in field.valueMap) {
                  const mapped = field.valueMap[val];
                  formatted = typeof mapped === "string" ? mapped : (isAr ? mapped.ar : mapped.en);
                } else if (field.options && Array.isArray(field.options)) {
                  const opt = field.options.find((o) => (typeof o === "string" ? o === val : o.value === val));
                  if (opt && typeof opt === "object") {
                    formatted = isAr ? (opt.labelAr || opt.label || String(val)) : (opt.label || String(val));
                  } else {
                    formatted = String(val);
                  }
                } else if (key === "id" && typeof val === "number") {
                  formatted = encodeId(val);
                } else if (key === "birthDate" || key === "createdAt" || key.endsWith("At") || key.endsWith("Date")) {
                  if (typeof val === "string") {
                    formatted = val.slice(0, 10);
                  } else if (val instanceof Date) {
                    formatted = val.toISOString().slice(0, 10);
                  } else {
                    formatted = String(val).slice(0, 10);
                  }
                } else if (typeof val === "boolean" || field.type === "boolean") {
                  formatted = val ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No");
                } else if (typeof val === "object") {
                  if (Array.isArray(val)) {
                    formatted = val
                      .map((v: any) => {
                        if (typeof v === "object") {
                          if (v.program && v.cost) return `${v.program} (${v.cost})`;
                          if (v.name) return v.name;
                          if (v.incomeAsset?.nameAr) return isAr ? v.incomeAsset.nameAr : v.incomeAsset.nameEn;
                          if (v.serviceBill?.nameAr) return isAr ? v.serviceBill.nameAr : v.serviceBill.nameEn;
                          return JSON.stringify(v);
                        }
                        return String(v);
                      })
                      .join("، ");
                  } else {
                    formatted = Object.entries(val)
                      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
                      .join("؛ ");
                  }
                } else {
                  const strVal = String(val).trim();
                  if (isAr && !includeId && ENUM_LABELS_AR[strVal]) {
                    formatted = ENUM_LABELS_AR[strVal];
                  } else {
                    formatted = strVal;
                  }
                }
              }

              row.push(formatted);
            }
          }

          const dataRow = ws.addRow(row);
          dataRow.alignment = { wrapText: true, vertical: "top" };
          dataRow.height = Math.max(
            20,
            Math.min(
              row.reduce(
                (max, v) => Math.max(max, Math.ceil((v || "").length / 40) * 20),
                20
              ),
              200
            )
          );
        }
      }

      // Set column widths and number formats for date fields
      colWidths.forEach((w, ci) => {
        const col = ws.getColumn(ci + 1);
        col.width = w;
        const key = headerKeys[ci];
        if (key === "birthDate" || key === "createdAt" || key?.endsWith("Date") || key?.endsWith("At")) {
          col.numFmt = "yyyy-mm-dd";
        }
      });

      // Embed images in xlsx (only for normal export; skipped in import mode)
      for (const task of imageTasks) {
        try {
            const url = task.url.startsWith("/") ? `${window.location.origin}${task.url}` : task.url;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            const buf = await blob.arrayBuffer();
            const ext = blob.type === "image/png" ? "png" : blob.type === "image/jpeg" || blob.type === "image/jpg" ? "jpeg" : "png";

            // Get natural dimensions for aspect ratio
            const imgUrl = URL.createObjectURL(blob);
            const img = new Image();
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject();
              img.src = imgUrl;
            });
            URL.revokeObjectURL(imgUrl);

            const maxDim = 80;
            const aspect = img.naturalWidth / img.naturalHeight;
            let w: number, h: number;
            if (aspect >= 1) {
              w = maxDim;
              h = Math.round(maxDim / aspect);
            } else {
              h = maxDim;
              w = Math.round(maxDim * aspect);
            }

            const imageId = wb.addImage({ buffer: buf, extension: ext });
            ws.addImage(imageId, {
              tl: { col: task.colIdx, row: task.rowIdx - 1 },
              ext: { width: w, height: h },
            });

            // Adjust row height to fit image
            const row = ws.getRow(task.rowIdx);
            if (row.height < h + 10) row.height = h + 10;

            // Widen column for images
            if (colWidths[task.colIdx] < 14) colWidths[task.colIdx] = 14;
          } catch {
            // Fallback: write URL as text
            const cell = ws.getCell(task.rowIdx, task.colIdx + 1);
            cell.value = task.url;
          }
      }

      const buf = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
      const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = isAr && tableLabelAr ? tableLabelAr : tableName;
      a.download = `${safeName}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch {}
    setExporting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#0B0F19] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileDown size={20} className="text-primary dark:text-tertiary" />
            {isAr ? "تصدير البيانات" : "Export Data"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={18} />
          </button>
        </div>

        {/* Body: two columns with search/template at top */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden">
          {/* Left column */}
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

          {/* Right column */}
          <div className="flex flex-col overflow-hidden">
            <div className="p-4 pb-3">
              <div className="relative" ref={templateRef}>
                {newTemplateMode ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder={isAr ? "اسم القالب" : "Template name"}
                      className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      onKeyDown={(e) => e.key === "Enter" && handleSaveTemplate()}
                    />
                    <button
                      onClick={handleSaveTemplate}
                      disabled={!newTemplateName.trim()}
                      className="p-1.5 rounded-lg bg-primary/10 dark:bg-tertiary/10 text-primary dark:text-tertiary hover:bg-primary/20 dark:hover:bg-tertiary/20 disabled:opacity-30 transition-all cursor-pointer"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => { setNewTemplateMode(false); setNewTemplateName(""); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setTemplateDropdownOpen(!templateDropdownOpen)}
                      className="flex items-center justify-between w-full text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-primary/30 dark:hover:border-tertiary/30 transition-colors cursor-pointer"
                    >
                      <span className="truncate">{currentTemplate ? currentTemplate.name : (isAr ? "اختيار قالب" : "Select template")}</span>
                      <ChevronDown size={14} className="shrink-0" />
                    </button>
                    {templateDropdownOpen && (
                      <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-10 py-1 max-h-48 overflow-y-auto">
                        {templates.length === 0 && (
                          <div className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500">
                            {isAr ? "لا توجد قوالب محفوظة" : "No saved templates"}
                          </div>
                        )}
                        {templates.map((t) => (
                          <div key={t.id} className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 group">
                            <button
                              onClick={() => handleLoadTemplate(t)}
                              className="flex-1 text-start text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                            >
                              {t.name}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id); }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-red-400 hover:text-red-600 transition-all cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        <div className="border-t border-slate-100 dark:border-slate-800 mx-2" />
                        <button
                          onClick={() => { setNewTemplateMode(true); setTemplateDropdownOpen(false); setNewTemplateName(""); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-primary dark:text-tertiary hover:bg-primary/5 dark:hover:bg-tertiary/5 transition-colors cursor-pointer"
                        >
                          <Save size={12} />
                          {isAr ? "إضافة قالب جديد" : "Add new template"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-0.5">
              <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                {isAr ? "الحقول المحددة للتصدير" : "Selected Fields"}
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
                        <ChevronUp size={11} />
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
          <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
            <span>{isAr ? "النوع: XLSX" : "Format: XLSX"}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeId}
                onChange={(e) => setIncludeId(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-primary focus:ring-primary border-slate-300 dark:border-slate-700 accent-primary dark:accent-tertiary cursor-pointer"
              />
              <span className="text-slate-500 dark:text-slate-400">{isAr ? "ارغب في استيراد البيانات" : "I want to import"}</span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              onClick={handleExport}
              disabled={ids.length === 0 || selectedKeys.length === 0 || exporting}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-primary dark:bg-tertiary text-white rounded-xl hover:opacity-90 disabled:opacity-40 cursor-pointer transition-all"
            >
              <Download size={14} />
              {exporting ? (isAr ? "جاري التصدير..." : "Exporting...") : (isAr ? "تصدير" : "Export")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
