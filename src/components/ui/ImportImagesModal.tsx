"use client";

import React, { useState, useRef, useMemo } from "react";
import { X, Upload, Image, FileImage, CheckCircle, XCircle, Loader, AlertCircle } from "lucide-react";
import Select from "@/components/ui/Select";
import type { ExportField } from "@/components/ui/ExportModal";

interface ImportResult {
  fileName: string;
  associationName: string | null;
  status: "matched" | "not_found" | "error";
  error?: string;
}

interface ImportImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  tableName?: string;
  tableLabelAr?: string;
  availableFields?: ExportField[];
  apiEndpoint?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function ImportImagesModal({
  isOpen,
  onClose,
  locale,
  tableName,
  tableLabelAr,
  availableFields,
  apiEndpoint,
}: ImportImagesModalProps) {
  const isAr = locale === "ar";
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [referenceField, setReferenceField] = useState("");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const referenceOptions = useMemo(() => {
    if (availableFields && availableFields.length > 0) {
      const validPrimaryKeys = new Set([
        "name",
        "fullname",
        "email",
        "phone",
        "alternatephone",
        "nationalid",
        "identitynumber",
        "commercialregistration",
        "manager",
      ]);

      const matched = availableFields.filter(
        (f) => (!f.type || f.type !== "image") && !f.key.includes(".") && validPrimaryKeys.has(f.key.toLowerCase())
      );

      if (matched.length > 0) {
        return matched.map((f) => ({
          value: f.key,
          label: isAr ? f.labelAr : f.label,
        }));
      }
    }

    return [
      { value: "name", label: isAr ? "الاسم / الجهة" : "Name" },
      { value: "email", label: isAr ? "البريد الإلكتروني" : "Email" },
      { value: "phone", label: isAr ? "الهاتف / الجوال" : "Phone" },
      { value: "identityNumber", label: isAr ? "رقم الهوية" : "Identity Number" },
      { value: "commercialRegistration", label: isAr ? "السجل التجاري" : "Commercial Reg" },
      { value: "manager", label: isAr ? "المسؤول" : "Manager" },
    ];
  }, [availableFields, isAr]);

  const activeReferenceField = referenceField || (referenceOptions[0]?.value ?? "name");

  const imageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/tiff"]);

  async function handleFilesPick(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setResults(null);
    setSummary(null);
    setError(null);

    const loaded: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!imageTypes.has(file.type)) continue;
      if (file.size > MAX_FILE_SIZE) continue;
      loaded.push(file);
    }
    setFiles(loaded);
  }

  function handlePickClick() {
    inputRef.current?.click();
  }

  if (!isOpen) return null;

  const handleImport = async () => {
    if (files.length === 0) return;
    setImporting(true);
    setError(null);
    setResults(null);
    setSummary(null);

    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }
      formData.append("referenceField", activeReferenceField);
      formData.append("locale", locale);

      const endpoint = apiEndpoint || `/api/${tableName || "associations"}/import-images`;
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.errors?.[0] || (isAr ? "خطأ في الاستيراد" : "Import failed"));

      setResults(data.results);
      setSummary(data.summary);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResults(null);
    setSummary(null);
    setError(null);
    setReferenceField("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const matchedCount = results?.filter((r) => r.status === "matched").length || 0;
  const notFoundCount = results?.filter((r) => r.status === "not_found").length || 0;
  const errorCount = results?.filter((r) => r.status === "error").length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#0B0F19] rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
              <Image size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr
                  ? `استيراد صور ${tableLabelAr || tableName || "الجمعيات"}`
                  : `Import ${tableName || "Association"} Images`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? `رفع الصور لمطابقتها تلقائياً مع بيانات ${tableLabelAr || tableName || "الجمعيات"}`
                  : `Upload images to auto-match with ${tableName || "associations"} records`}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={importing}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* File picker */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFilesPick}
          />
          
          {/* Upload Drop Zone */}
          {!results && (
            <button
              onClick={handlePickClick}
              type="button"
              className="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-400 rounded-2xl p-6 text-center transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-900/30 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 group"
            >
              <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400 group-hover:text-amber-500 transition-colors">
                <Upload size={24} />
                <span className="text-xs font-medium">
                  {isAr ? "اختر الصور" : "Choose images"}
                </span>
                <span className="text-[10px]">
                  {isAr ? "jpg, png, webp — حد أقصى 50MB (اختر ملفات متعددة)" : "jpg, png, webp — max 50MB (select multiple)"}
                </span>
              </div>
            </button>
          )}

          {/* Reference field */}
          {files.length > 0 && !results && (
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                {isAr ? "حقل المطابقة:" : "Match by:"}
              </label>
              <div className="w-56">
                <Select
                  value={activeReferenceField}
                  onChange={(val) => setReferenceField(String(val))}
                  options={referenceOptions}
                />
              </div>
            </div>
          )}

          {/* File list */}
          {files.length > 0 && !results && (
            <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                  <tr>
                    <th className="text-start px-3 py-2 font-semibold text-slate-500">{isAr ? "اسم الملف" : "File Name"}</th>
                    <th className="text-start px-3 py-2 font-semibold text-slate-500">{isAr ? "اسم الجهة المتوقع" : "Expected Name"}</th>
                    <th className="text-start px-3 py-2 font-semibold text-slate-500">{isAr ? "الحجم" : "Size"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {files.map((f, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                        <FileImage size={12} className="inline mr-1 text-slate-400" />
                        {f.name}
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                        {f.name.replace(/\.[^/.]+$/, "")}
                      </td>
                      <td className="px-3 py-2 text-slate-500">{formatSize(f.size)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Results table */}
          {results && results.length > 0 && (
            <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                  <tr>
                    <th className="text-start px-3 py-2 font-semibold text-slate-500">{isAr ? "الملف" : "File"}</th>
                    <th className="text-start px-3 py-2 font-semibold text-slate-500">{isAr ? "الجهة" : "Entity"}</th>
                    <th className="text-start px-3 py-2 font-semibold text-slate-500">{isAr ? "الحالة" : "Status"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {results.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{r.fileName}</td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{r.associationName || "—"}</td>
                      <td className="px-3 py-2">
                        {r.status === "matched" && (
                          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle size={12} /> {isAr ? "تم" : "Done"}
                          </span>
                        )}
                        {r.status === "not_found" && (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <AlertCircle size={12} /> {isAr ? "غير معروف" : "Not found"}
                          </span>
                        )}
                        {r.status === "error" && (
                          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400" title={r.error}>
                            <XCircle size={12} /> {isAr ? "خطأ" : "Error"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-500">
              {files.length > 0 && !results && (
                isAr ? `تم اختيار ${files.length} ملف` : `${files.length} files selected`
              )}
              {summary && (
                <span className={`font-medium ${
                  errorCount > 0 ? "text-red-500" : matchedCount > 0 ? "text-green-500" : "text-amber-500"
                }`}>
                  {summary}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={results ? handleReset : handleClose}
                disabled={importing}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
              >
                {results ? (isAr ? "مسح" : "Clear") : (isAr ? "إلغاء" : "Cancel")}
              </button>
              {!results && (
                <button
                  onClick={handleImport}
                  disabled={files.length === 0 || importing}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 rounded-xl transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5 shadow-sm shadow-amber-500/20"
                >
                  {importing ? (
                    <><Loader size={14} className="animate-spin" /> {isAr ? "جارٍ الاستيراد..." : "Importing..."}</>
                  ) : (
                    <><Upload size={14} /> {isAr ? "استيراد" : "Import"}</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
