"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileSpreadsheet,
  Building2,
  Activity,
  GraduationCap,
  Calendar,
  Eye,
  Download,
  Settings2,
  RefreshCw,
  RotateCcw,
  Users2,
  X,
  Search,
  GripVertical,
  Check,
  CheckSquare,
  Square
} from "lucide-react";
import { useToast } from "@/lib/ToastContext";
import Select from "@/components/ui/Select";
import {
  HEALTH_OPTIONS,
  EDUCATION_OPTIONS,
  MARITAL_OPTIONS,
  DEPENDENT_RELATIONSHIP_OPTIONS,
  SOCIAL_STATUS_OPTIONS,
  WORK_STATUS_OPTIONS,
  ENVIRONMENT_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  HOUSING_TENURE_OPTIONS,
  CASE_CLASSIFICATION_OPTIONS,
  NEEDS_EXPORT_FIELDS,
  toExportOptions,
} from "@/lib/beneficiaryOptions";

export interface ExportField {
  key: string;
  label: string;
  labelAr: string;
  type?: "text" | "image" | "boolean";
  options?: { value: string; label?: string; labelAr?: string }[];
}

const ALL_BENEFICIARY_REPORT_FIELDS: ExportField[] = [
  // البيانات الأساسية
  { key: "fullName", label: "Full Name", labelAr: "الاسم الكامل" },
  { key: "nationalId", label: "National ID", labelAr: "رقم الهوية / الإقامة" },
  { key: "associationName", label: "Association", labelAr: "الجمعية التابع لها" },
  { key: "age", label: "Calculated Age", labelAr: "العمر (سنوات)" },
  { key: "birthDate", label: "Birth Date", labelAr: "تاريخ الميلاد" },
  { key: "phone", label: "Phone", labelAr: "رقم الجوال" },
  { key: "alternatePhone", label: "Alternate Phone", labelAr: "جوال بديل" },
  { key: "maritalStatus", label: "Marital Status", labelAr: "الحالة الاجتماعية", options: toExportOptions(MARITAL_OPTIONS) },
  { key: "healthStatus", label: "Health Status", labelAr: "الحالة الصحية", options: toExportOptions(HEALTH_OPTIONS) },
  { key: "diseaseType", label: "Disease Type", labelAr: "نوع المرض" },
  { key: "disabilityType", label: "Disability Type", labelAr: "نوع الإعاقة" },
  { key: "educationLevel", label: "Education Level", labelAr: "المستوى التعليمي", options: toExportOptions(EDUCATION_OPTIONS) },
  { key: "totalFamilyMembers", label: "Total Family Members", labelAr: "أفراد الأسرة" },
  { key: "address", label: "National Address", labelAr: "العنوان الوطني" },
  { key: "photoUrl", label: "Beneficiary Photo", labelAr: "صورة المستفيد", type: "image" },
  { key: "researcherOpinion", label: "Researcher Opinion", labelAr: "رأي الباحث في الأسرة" },
  { key: "dependentsOpinion", label: "Researcher Opinion on Dependents", labelAr: "رأي الباحث في التابعين" },

  // التابعين
  { key: "dependents.name", label: "Dependent Name", labelAr: "اسم التابع" },
  { key: "dependents.relationship", label: "Dependent Relationship", labelAr: "صلة القرابة للتابع", options: toExportOptions(DEPENDENT_RELATIONSHIP_OPTIONS) },
  { key: "dependents.birthDate", label: "Dependent Birth Date", labelAr: "تاريخ ميلاد التابع" },
  { key: "dependents.educationLevel", label: "Dependent Education Level", labelAr: "المستوى التعليمي للتابع", options: toExportOptions(EDUCATION_OPTIONS) },
  { key: "dependents.healthStatus", label: "Dependent Health Status", labelAr: "الحالة الصحية للتابع", options: toExportOptions(HEALTH_OPTIONS) },
  { key: "dependents.socialStatus", label: "Dependent Social Status", labelAr: "الحالة الاجتماعية للتابع", options: toExportOptions(SOCIAL_STATUS_OPTIONS) },
  { key: "dependents.workStatus", label: "Dependent Work Status", labelAr: "الحالة العملية للتابع", options: toExportOptions(WORK_STATUS_OPTIONS) },

  // الوضع المالي
  { key: "salaryIncome", label: "Salary Income", labelAr: "راتب وظيفي/تقاعدي" },
  { key: "socialSecurity", label: "Social Security", labelAr: "الضمان الاجتماعي" },
  { key: "citizenAccount", label: "Citizen Account", labelAr: "حساب المواطن" },
  { key: "comprehensiveRehab", label: "Comprehensive Rehab", labelAr: "التأهيل الشامل" },
  { key: "otherAssocSupport", label: "Other Association Support", labelAr: "دعم جمعيات أخرى" },
  { key: "livestockCount", label: "Livestock Count", labelAr: "مواشي (العدد)" },
  { key: "otherAssetTotal", label: "Other Asset Total", labelAr: "إجمالي دخل الأصول" },
  { key: "otherAssetDesc", label: "Other Asset Desc", labelAr: "وصف الأصل الآخر" },
  { key: "totalIncome", label: "Total Income", labelAr: "إجمالي الدخل" },
  { key: "rentAmount", label: "Rent", labelAr: "إيجار المنزل" },
  { key: "electricityBill", label: "Electricity", labelAr: "فاتورة الكهرباء" },
  { key: "waterBill", label: "Water", labelAr: "فاتورة الماء" },
  { key: "internetBill", label: "Internet", labelAr: "فاتورة الإنترنت" },
  { key: "phoneBill", label: "Phone", labelAr: "فاتورة الهاتف" },
  { key: "gasBill", label: "Gas", labelAr: "فاتورة الغاز" },
  { key: "medicalExpenses", label: "Medical", labelAr: "مصاريف طبية" },
  { key: "transportExpenses", label: "Transport", labelAr: "مواصلات" },
  { key: "foodExpenses", label: "Food", labelAr: "مصاريف الأكل" },
  { key: "debtMonthly", label: "Monthly Debt", labelAr: "القسط الشهري" },
  { key: "debtReason", label: "Debt Reason", labelAr: "سبب الدين" },
  { key: "debtPeriod", label: "Debt Period", labelAr: "فترة السداد" },
  { key: "totalExpenses", label: "Total Expenses", labelAr: "إجمالي المصروفات" },
  { key: "netIncome", label: "Net Income", labelAr: "صافي الدخل" },
  { key: "financialOpinion", label: "Financial Opinion", labelAr: "رأي الباحث في الوضع المالي" },

  // السكن والبيئة
  { key: "environmentType", label: "Environment Type", labelAr: "نوع البيئة", options: toExportOptions(ENVIRONMENT_OPTIONS) },
  { key: "housingType", label: "Housing Type", labelAr: "نوع السكن", options: toExportOptions(HOUSING_TYPE_OPTIONS) },
  { key: "housingTenure", label: "Housing Tenure", labelAr: "ملكية السكن", options: toExportOptions(HOUSING_TENURE_OPTIONS) },
  { key: "housingOpinion", label: "Housing Opinion", labelAr: "رأي الباحث في البيئة والسكن" },
  { key: "buildingPhotoUrl", label: "Building Photo", labelAr: "صورة المبنى الخارجية", type: "image" },

  // الاحتياجات
  ...NEEDS_EXPORT_FIELDS,

  // باقات التبرع والخلاصة
  { key: "donationPackages.program", label: "Donation Package Program", labelAr: "برنامج باقة التبرع" },
  { key: "donationPackages.cost", label: "Donation Package Cost", labelAr: "تكلفة باقة التبرع" },
  { key: "finalRecommendation", label: "Final Recommendation", labelAr: "التوصية النهائية" },
  { key: "caseClassification", label: "Case Classification", labelAr: "تصنيف الحالة", options: toExportOptions(CASE_CLASSIFICATION_OPTIONS) },
  { key: "createdAt", label: "Creation Date", labelAr: "تاريخ الإضافة" },
];

const DEFAULT_SELECTED_KEYS = [
  "fullName",
  "nationalId",
  "associationName",
  "age",
  "healthStatus",
  "educationLevel",
  "phone",
];

const AGE_OPTIONS = [
  { value: "all", label: "جميع الفئات العمرية", labelEn: "All Age Categories" },
  { value: "0-18", label: "0 - 18", labelEn: "0 - 18" },
  { value: "19-35", label: "19 - 35", labelEn: "19 - 35" },
  { value: "36-59", label: "36 - 59", labelEn: "36 - 59" },
  { value: "60+", label: "60+", labelEn: "60+" },
];

function getNestedValue(obj: any, path: string): any {
  const parts = path.split(".");
  let val: any = obj;
  for (const part of parts) {
    if (val === null || val === undefined) return "";
    val = val[part];
  }
  return val ?? "";
}

function formatDateString(val: any): string {
  if (typeof val === "string" && (val.includes("T") || val.includes("Z"))) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }
  return String(val);
}

function renderCellText(record: any, field: ExportField, isAr: boolean): string {
  if (field.key.includes(".")) {
    const parts = field.key.split(".");
    const relObj = record[parts[0]];
    if (Array.isArray(relObj)) {
      if (relObj.length === 0) return "-";
      return relObj
        .map((item) => {
          const val = item[parts.slice(1).join(".")];
          if (val === null || val === undefined || val === "") return null;
          if (field.options && Array.isArray(field.options)) {
            const opt = field.options.find((o: any) => o.value === String(val));
            if (opt) return (isAr ? opt.labelAr || opt.label : opt.label || opt.labelAr) || String(val);
          }
          return formatDateString(val);
        })
        .filter(Boolean)
        .join(" | ");
    }
    const val = getNestedValue(record, field.key);
    if (val === null || val === undefined || val === "") return "-";
    if (field.options && Array.isArray(field.options)) {
      const opt = field.options.find((o: any) => o.value === String(val));
      if (opt) return (isAr ? opt.labelAr || opt.label : opt.label || opt.labelAr) || String(val);
    }
    return formatDateString(val);
  }

  const val = record[field.key];
  if (field.type === "boolean" || typeof val === "boolean") {
    return val ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No");
  }

  if (val === null || val === undefined || val === "") return "-";

  if (field.options && Array.isArray(field.options)) {
    const opt = field.options.find((o: any) => o.value === String(val));
    if (opt) return (isAr ? opt.labelAr || opt.label : opt.label || opt.labelAr) || String(val);
  }

  return formatDateString(val);
}

export default function ReportsClient({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const { showToast } = useToast();

  const [associations, setAssociations] = useState<{ id: number; name: string }[]>([]);
  const [selectedAssociation, setSelectedAssociation] = useState<string>("all");
  const [selectedHealthStatus, setSelectedHealthStatus] = useState<string>("all");
  const [selectedEducationLevel, setSelectedEducationLevel] = useState<string>("all");
  const [selectedAgeCategory, setSelectedAgeCategory] = useState<string>("all");

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [hasPreviewed, setHasPreviewed] = useState(false);

  // Field selection state (ordered active keys)
  const [activeFieldKeys, setActiveFieldKeys] = useState<string[]>(DEFAULT_SELECTED_KEYS);
  const [fieldsModalOpen, setFieldsModalOpen] = useState(false);

  // Load saved field config from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("maeen_report_active_fields");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setActiveFieldKeys(parsed);
        }
      }
    } catch {}
  }, []);

  // Fetch associations
  useEffect(() => {
    fetch("/api/associations")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : Array.isArray(data?.associations) ? data.associations : [];
        if (list.length > 0) {
          setAssociations(list.map((a: any) => ({ id: a.id, name: a.name })));
        }
      })
      .catch((err) => console.error("Failed to load associations:", err));
  }, []);

  const associationOptions = [
    { value: "all", label: isAr ? "جميع الجمعيات" : "All Associations" },
    ...associations.map((a) => ({ value: String(a.id), label: a.name })),
  ];

  const healthFilterOptions = [
    { value: "all", label: isAr ? "جميع الحالات الصحية" : "All Health Statuses" },
    ...HEALTH_OPTIONS.map((h) => ({ value: h.value, label: isAr ? h.label : h.labelEn })),
  ];

  const educationFilterOptions = [
    { value: "all", label: isAr ? "جميع المستويات التعليمية" : "All Education Levels" },
    ...EDUCATION_OPTIONS.map((e) => ({ value: e.value, label: isAr ? e.label : e.labelEn })),
  ];

  const activeFields: ExportField[] = activeFieldKeys
    .map((key) => ALL_BENEFICIARY_REPORT_FIELDS.find((f) => f.key === key))
    .filter((f): f is ExportField => !!f);

  const fetchReportRecords = async () => {
    const queryParams = new URLSearchParams({
      associationId: selectedAssociation,
      healthStatus: selectedHealthStatus,
      educationLevel: selectedEducationLevel,
      ageCategory: selectedAgeCategory,
    });

    const res = await fetch(`/api/reports?${queryParams.toString()}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || (isAr ? "فشل جلب بيانات التقرير" : "Failed to fetch report"));
    }
    return data.records || [];
  };

  const handlePreviewClick = async () => {
    setLoading(true);
    try {
      const data = await fetchReportRecords();
      setRecords(data);
      setHasPreviewed(true);
      showToast(
        isAr ? `تم تمكين معاينة التقرير بنجاح (${data.length} مستفيد)` : `Loaded preview (${data.length} items)`,
        "success"
      );
    } catch (err: any) {
      showToast(err.message || (isAr ? "حدث خطأ أثناء المعاينة" : "Error loading report"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedAssociation("all");
    setSelectedHealthStatus("all");
    setSelectedEducationLevel("all");
    setSelectedAgeCategory("all");
    setRecords([]);
    setHasPreviewed(false);
  };

  const handleDirectExportClick = async () => {
    setExporting(true);
    try {
      let dataToExport = records;
      if (!hasPreviewed || dataToExport.length === 0) {
        dataToExport = await fetchReportRecords();
        setRecords(dataToExport);
        setHasPreviewed(true);
      }

      if (dataToExport.length === 0) {
        showToast(isAr ? "لا توجد سجلات لتصديرها" : "No records to export", "info");
        setExporting(false);
        return;
      }

      // Dynamic import of exceljs
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(isAr ? "تقرير المستفيدين" : "Beneficiaries Report");

      // 1. Language-based Sheet Orientation (rightToLeft for ExcelJS)
      (ws as any).views = [{ rightToLeft: isAr }];

      // Headers
      const headerKeys = activeFields.map((f) => f.key);
      const headers = activeFields.map((f) => (isAr ? f.labelAr : f.label));
      ws.addRow(headers);

      // Header styling
      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFF" }, size: 11 };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1E3A8A" } };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };
      headerRow.height = 28;

      const imageTasks: { rowIdx: number; colIdx: number; url: string }[] = [];
      const fieldMap = new Map<string, ExportField>();
      activeFields.forEach((f) => fieldMap.set(f.key, f));

      // 2 & 3. Odoo Relational Row Expansion & Data Rows Construction
      for (let di = 0; di < dataToExport.length; di++) {
        const item = dataToExport[di];

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
          const rowValues: string[] = [];

          for (let ci = 0; ci < headerKeys.length; ci++) {
            const key = headerKeys[ci];
            const field = fieldMap.get(key);
            if (!field) {
              rowValues.push("");
              continue;
            }

            if (field.type === "image") {
              if (lineIdx === 0) {
                const imgUrl = getNestedValue(item, key);
                if (imgUrl) {
                  imageTasks.push({
                    rowIdx: ws.rowCount + 1,
                    colIdx: ci,
                    url: imgUrl,
                  });
                }
              }
              rowValues.push("");
            } else if (key.includes(".")) {
              const parts = key.split(".");
              const relKey = parts[0];
              const arr = item[relKey];

              if (Array.isArray(arr)) {
                const childObj = arr[lineIdx] || null;
                const subKey = parts.slice(1).join(".");
                let val = childObj ? getNestedValue(childObj, subKey) : null;
                let formatted = "";

                if (val != null && val !== "") {
                  if (field.options && Array.isArray(field.options)) {
                    const opt = field.options.find((o: any) => o.value === String(val));
                    formatted = opt ? (isAr ? opt.labelAr || opt.label || String(val) : opt.label || String(val)) : String(val);
                  } else if (typeof val === "boolean" || field.type === "boolean") {
                    formatted = val ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No");
                  } else {
                    formatted = formatDateString(val);
                  }
                } else if (field.type === "boolean") {
                  formatted = isAr ? "لا" : "No";
                }
                rowValues.push(formatted || "-");
              } else {
                if (lineIdx > 0) {
                  rowValues.push("");
                } else {
                  const val = getNestedValue(item, key);
                  let formatted = "";
                  if (val != null && val !== "") {
                    if (field.options && Array.isArray(field.options)) {
                      const opt = field.options.find((o: any) => o.value === String(val));
                      formatted = opt ? (isAr ? opt.labelAr || opt.label || String(val) : opt.label || String(val)) : String(val);
                    } else if (typeof val === "boolean" || field.type === "boolean") {
                      formatted = val ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No");
                    } else {
                      formatted = formatDateString(val);
                    }
                  } else if (field.type === "boolean") {
                    formatted = isAr ? "لا" : "No";
                  }
                  rowValues.push(formatted || "-");
                }
              }
            } else {
              // Non-relational top level field: Only display value on the first row (lineIdx === 0)
              if (lineIdx > 0) {
                rowValues.push("");
              } else {
                const val = item[key];
                let formatted = "";

                if (field.type === "boolean" || typeof val === "boolean") {
                  formatted = val ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No");
                } else if (val != null && val !== "") {
                  if (field.options && Array.isArray(field.options)) {
                    const opt = field.options.find((o: any) => o.value === String(val));
                    formatted = opt ? (isAr ? opt.labelAr || opt.label || String(val) : opt.label || String(val)) : String(val);
                  } else {
                    formatted = formatDateString(val);
                  }
                }
                rowValues.push(formatted || "-");
              }
            }
          }

          const addedRow = ws.addRow(rowValues);
          addedRow.alignment = { vertical: "middle", horizontal: "center" };
        }
      }

      // 4. Embedded Images Processing (Excel Image Objects)
      if (imageTasks.length > 0) {
        await Promise.all(
          imageTasks.map(async (task) => {
            try {
              let fetchUrl = task.url;
              if (fetchUrl.startsWith("/")) {
                fetchUrl = `${window.location.origin}${fetchUrl}`;
              }
              const resp = await fetch(fetchUrl);
              if (!resp.ok) return;
              const buffer = await resp.arrayBuffer();

              const extMatch = task.url.match(/\.(png|jpg|jpeg|gif|webp)$/i);
              let ext = extMatch ? extMatch[1].toLowerCase() : "jpeg";
              if (ext === "jpg") ext = "jpeg";
              if (ext === "webp") ext = "png";

              const imageId = wb.addImage({
                buffer,
                extension: ext as any,
              });

              ws.getRow(task.rowIdx).height = 60;
              ws.addImage(imageId, {
                tl: { col: task.colIdx, row: task.rowIdx - 1 },
                ext: { width: 55, height: 55 },
                editAs: "oneCell",
              });
            } catch (e) {
              console.warn("Failed to embed image in report excel:", task.url, e);
            }
          })
        );
      }

      // Auto Width
      ws.columns.forEach((col) => {
        let maxLen = 12;
        col.eachCell?.({ includeEmpty: true }, (cell) => {
          const len = String(cell.value || "").length;
          if (len > maxLen) maxLen = len;
        });
        col.width = Math.min(maxLen + 4, 40);
      });

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `تقرير_المستفيدين_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(isAr ? "تم تصدير التقرير بنجاح" : "Report exported successfully", "success");
    } catch (err: any) {
      console.error("Export error:", err);
      showToast(err.message || (isAr ? "حدث خطأ أثناء التصدير" : "Export failed"), "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileSpreadsheet className="text-primary dark:text-tertiary" size={24} />
            <span>{isAr ? "شاشة التقارير المخصصة" : "Custom Reports"}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAr
              ? "استخراج وتصفية وتقارير المستفيدين بدقة عالية مع معاينة وتصدير الحقول المختارة فقط."
              : "Filter, preview, and export customized beneficiary reports with selected fields."}
          </p>
        </div>
      </div>

      {/* Filter Options Bar */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <FilterIcon size={15} className="text-primary dark:text-tertiary" />
            <span>{isAr ? "شروط وتصنيفات التقرير" : "Report Filter Criteria"}</span>
          </h2>

          {(selectedAssociation !== "all" || selectedHealthStatus !== "all" || selectedEducationLevel !== "all" || selectedAgeCategory !== "all") && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>{isAr ? "إعادة ضبط الفلاتر" : "Reset Filters"}</span>
            </button>
          )}
        </div>

        {/* Filters Grid with Exact Beneficiary Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Association Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Building2 size={13} className="text-amber-500" />
              <span>{isAr ? "الجمعية" : "Association"}</span>
            </label>
            <Select
              value={selectedAssociation}
              onChange={(val) => setSelectedAssociation(String(val))}
              options={associationOptions}
              placeholder={isAr ? "اختر الجمعية" : "Select Association"}
            />
          </div>

          {/* Health Status Select (Exact Beneficiary HEALTH_OPTIONS) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Activity size={13} className="text-rose-500" />
              <span>{isAr ? "الحالة الصحية" : "Health Status"}</span>
            </label>
            <Select
              value={selectedHealthStatus}
              onChange={(val) => setSelectedHealthStatus(String(val))}
              options={healthFilterOptions}
              placeholder={isAr ? "اختر الحالة الصحية" : "Select Health Status"}
            />
          </div>

          {/* Educational Level Select (Exact Beneficiary EDUCATION_OPTIONS) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <GraduationCap size={13} className="text-blue-500" />
              <span>{isAr ? "المستوى التعليمي" : "Educational Level"}</span>
            </label>
            <Select
              value={selectedEducationLevel}
              onChange={(val) => setSelectedEducationLevel(String(val))}
              options={educationFilterOptions}
              placeholder={isAr ? "اختر المستوى التعليمي" : "Select Education Level"}
            />
          </div>

          {/* Age Category Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar size={13} className="text-emerald-500" />
              <span>{isAr ? "الفئة العمرية" : "Age Category"}</span>
            </label>
            <Select
              value={selectedAgeCategory}
              onChange={(val) => setSelectedAgeCategory(String(val))}
              options={AGE_OPTIONS.map((a) => ({ value: a.value, label: isAr ? a.label : a.labelEn }))}
              placeholder={isAr ? "اختر الفئة العمرية" : "Select Age Category"}
            />
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-center lg:justify-start">
            {hasPreviewed && (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary/10 text-primary dark:text-tertiary font-bold w-full lg:w-auto justify-center border border-primary/20">
                <Users2 size={15} />
                <span>{isAr ? `إجمالي نتائج التقرير: ${records.length} مستفيد` : `Total Found: ${records.length}`}</span>
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
            {/* Custom Field Selection / Order Trigger */}
            <button
              type="button"
              onClick={() => setFieldsModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 whitespace-nowrap"
            >
              <Settings2 size={16} className="text-primary dark:text-tertiary" />
              <span>{isAr ? "تحديد وترتيب حقول المعاينة والتصدير" : "Select & Order Report Fields"}</span>
              <span className="bg-primary/10 text-primary dark:text-tertiary px-1.5 py-0.5 rounded-md text-[11px]">
                {activeFieldKeys.length}
              </span>
            </button>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full sm:w-auto">
              {/* Preview Button */}
              <button
                type="button"
                onClick={handlePreviewClick}
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold bg-primary text-white dark:bg-tertiary rounded-xl hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-primary/20 whitespace-nowrap"
              >
                {loading ? <RefreshCw size={16} className="animate-spin" /> : <Eye size={16} />}
                <span>{isAr ? "معاينة التقرير" : "Preview Report"}</span>
              </button>

              {/* Direct Export Button */}
              <button
                type="button"
                onClick={handleDirectExportClick}
                disabled={exporting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-600/20 whitespace-nowrap"
              >
                {exporting ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                <span>{isAr ? "تصدير التقرير" : "Export Report"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Data Preview Table */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Eye size={16} className="text-primary dark:text-tertiary" />
            <span>{isAr ? "جدول معاينة التقرير" : "Report Data Preview"}</span>
          </h3>
          {hasPreviewed && (
            <span className="text-xs text-slate-400 font-semibold">
              {isAr ? `يعرض ${records.length} سجل | ${activeFields.length} أعمدة` : `Showing ${records.length} items | ${activeFields.length} columns`}
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
            <RefreshCw size={18} className="animate-spin text-primary" />
            <span>{isAr ? "جاري تحميل بيانات التقرير..." : "Generating report preview..."}</span>
          </div>
        ) : !hasPreviewed ? (
          <div className="p-16 text-center space-y-3">
            <FileSpreadsheet size={44} className="mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
              {isAr ? "حدد الشروط والـحقول ثم اضغط على زر (معاينة التقرير) لعرض البيانات هنا" : "Select criteria & fields then click (Preview Report) to display data"}
            </p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            {isAr ? "لا توجد سجلات مطابقة للشروط المحددة" : "No matching records found"}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] scrollbar-thin">
            <table className="w-full text-start text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 uppercase font-bold tracking-wider">
                <tr>
                  {activeFields.map((field) => (
                    <th key={field.key} className="p-3.5 text-start whitespace-nowrap border-e border-slate-200/50 dark:border-slate-800/50">
                      {isAr ? field.labelAr : field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {records.map((record, rIdx) => (
                  <tr key={record.id || rIdx} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                    {activeFields.map((field) => (
                      <td key={field.key} className="p-3.5 whitespace-nowrap border-e border-slate-100 dark:border-slate-800/40 text-slate-800 dark:text-slate-200">
                        {renderCellText(record, field, isAr)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Fields Selection & Ordering Modal */}
      {fieldsModalOpen && (
        <ReportFieldsModal
          isOpen={fieldsModalOpen}
          onClose={() => setFieldsModalOpen(false)}
          allFields={ALL_BENEFICIARY_REPORT_FIELDS}
          activeKeys={activeFieldKeys}
          onSave={(newKeys) => {
            setActiveFieldKeys(newKeys);
            try {
              localStorage.setItem("maeen_report_active_fields", JSON.stringify(newKeys));
            } catch {}
            showToast(isAr ? "تم حفظ الحقول المحددة والترتيب بنجاح" : "Report fields and order saved", "success");
            setFieldsModalOpen(false);
          }}
          isAr={isAr}
        />
      )}
    </div>
  );
}

interface ReportFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allFields: ExportField[];
  activeKeys: string[];
  onSave: (keys: string[]) => void;
  isAr: boolean;
}

function ReportFieldsModal({ isOpen, onClose, allFields, activeKeys, onSave, isAr }: ReportFieldsModalProps) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>(activeKeys);
  const [searchQuery, setSearchQuery] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  const toggleField = (key: string) => {
    if (selectedKeys.includes(key)) {
      setSelectedKeys(selectedKeys.filter((k) => k !== key));
    } else {
      setSelectedKeys([...selectedKeys, key]);
    }
  };

  const selectAll = () => {
    setSelectedKeys(allFields.map((f) => f.key));
  };

  const clearAll = () => {
    setSelectedKeys([]);
  };

  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === targetIdx) return;
    const copy = [...selectedKeys];
    const item = copy.splice(dragIdx, 1)[0];
    copy.splice(targetIdx, 0, item);
    setDragIdx(targetIdx);
    setSelectedKeys(copy);
  };

  const moveItem = (idx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= selectedKeys.length) return;
    const copy = [...selectedKeys];
    const item = copy.splice(idx, 1)[0];
    copy.splice(targetIdx, 0, item);
    setSelectedKeys(copy);
  };

  const filteredAllFields = allFields.filter((f) =>
    (isAr ? f.labelAr : f.label).toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary dark:text-tertiary flex items-center justify-center font-bold">
              <Settings2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? "تحديد وترتيب حقول التقرير (معاينة وتصدير)" : "Select & Order Report Fields"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? "اختر الحقول المطلوب ظهورها في المعاينة والتصدير ورتبها بالسحب والإفلات"
                  : "Choose fields to display in preview & export, reorder via drag and drop"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Bulk Select Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0F172A] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? "بحث في كافة حقول المستفيد..." : "Search beneficiary fields..."}
              className="w-full ps-9 pe-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={selectAll}
              className="px-3 py-1.5 text-xs font-bold text-primary dark:text-tertiary bg-primary/10 hover:bg-primary/20 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckSquare size={14} />
              <span>{isAr ? "اختيار الكل" : "Select All"}</span>
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Square size={14} />
              <span>{isAr ? "إلغاء الكل" : "Clear All"}</span>
            </button>
          </div>
        </div>

        {/* Two Columns Grid: Available Selection & Active Ordering */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 overflow-y-auto flex-1 scrollbar-thin">
          {/* Column 1: All Available Beneficiary Fields */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>{isAr ? "كافة حقول المستفيد المتاحة" : "Available Fields"}</span>
              <span className="text-[11px] text-slate-400 font-semibold">{filteredAllFields.length} حقل</span>
            </h4>
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pe-1 scrollbar-thin">
              {filteredAllFields.map((field) => {
                const isSelected = selectedKeys.includes(field.key);
                return (
                  <button
                    key={field.key}
                    type="button"
                    onClick={() => toggleField(field.key)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-xs text-start font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary/5 dark:bg-tertiary/10 border-primary/30 dark:border-tertiary/30 text-primary dark:text-tertiary"
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                    }`}
                  >
                    <span>{isAr ? field.labelAr : field.label}</span>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-primary text-white border-primary"
                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                      }`}
                    >
                      {isSelected && <Check size={12} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 2: Active Selected & Ordered Fields */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>{isAr ? "الحقول المختارة وترتيب المعاينة والتصدير" : "Selected & Ordered Fields"}</span>
              <span className="text-[11px] text-primary font-bold">{selectedKeys.length} مختار</span>
            </h4>

            {selectedKeys.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400">
                {isAr ? "انقر على الحقول من القائمة اليسرى لاختيارها" : "Click fields from left list to select"}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[380px] overflow-y-auto pe-1 scrollbar-thin">
                {selectedKeys.map((key, idx) => {
                  const field = allFields.find((f) => f.key === key);
                  if (!field) return null;
                  return (
                    <div
                      key={key}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs group"
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical size={14} className="text-slate-400 cursor-grab active:cursor-grabbing" />
                        <span className="w-5 text-center text-[10px] text-slate-400">{idx + 1}</span>
                        <span>{isAr ? field.labelAr : field.label}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveItem(idx, "up")}
                          disabled={idx === 0}
                          className="px-1.5 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-700 rounded disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(idx, "down")}
                          disabled={idx === selectedKeys.length - 1}
                          className="px-1.5 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-700 rounded disabled:opacity-30"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleField(key)}
                          className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-1 rounded-md transition-colors ms-1 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            {isAr ? "إلغاء" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={() => onSave(selectedKeys)}
            className="px-6 py-2 text-xs font-bold bg-primary text-white dark:bg-tertiary rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-md shadow-primary/20"
          >
            {isAr ? "تأكيد وحفظ الترتيب" : "Apply & Save Fields"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}
