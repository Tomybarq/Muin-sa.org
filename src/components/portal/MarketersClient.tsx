"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { BulkActionMenu } from "@/components/ui/ActionButtons";
import SortableHeader from "@/components/ui/SortableHeader";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Notebook from "@/components/ui/Notebook";
import AttachmentField from "@/components/ui/AttachmentField";
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
import DynamicPhoneNumbersInput from "@/components/ui/DynamicPhoneNumbersInput";
import ExportModal, { type ExportField } from "@/components/ui/ExportModal";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/lib/ToastContext";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { encodeId, decodeId } from "@/lib/idObfuscator";
import { createMarketerSchema, createMarketerBankAccountSchema, createMarketerMonthlyReportSchema } from "@/lib/zodSchemas";
import {
  Users,
  Building,
  Mail,
  Phone,
  CreditCard,
  Building2,
  FileText,
  UserPlus,
  Plus,
  Trash2,
  Check,
  X,
  Download,
  Upload,
  Printer,
  Archive,
  ArchiveRestore,
  Eye,
  Edit3,
  FileSpreadsheet,
  Calendar,
} from "lucide-react";
import SearchViews, { FilterPreset, GroupByOption } from "./SearchViews";
import ListViews from "./ListViews";
import KanbanViews from "./KanbanViews";
import FormViews from "./FormViews";
import ExcelPreviewModal from "@/components/ui/ExcelPreviewModal";
import MarketerQrCodeTab from "./MarketerQrCodeTab";

export interface MarketerBankAccountItem {
  id?: number;
  bankName: string;
  accountHolderName: string;
  accountNumber?: string | null;
  iban: string;
}

export interface MarketerAssociationItem {
  id?: number;
  associationId: number;
  association?: { id: number; name: string };
  phoneNumbers: string[];
}

export interface MarketerMonthlyReportItem {
  id?: number;
  description: string;
  reportDate: string | Date;
  attachmentId?: number | null;
  attachment?: {
    id: number;
    name?: string;
    originalName?: string;
    filename?: string;
    mimetype: string;
    fileSize: number;
    data?: any;
  } | null;
}

export interface MarketerRecord {
  id: number;
  name: string;
  type: string; // employee, company, influencer, volunteer
  isArchived?: boolean;
  archived?: boolean;
  email?: string | null;
  phone?: string | null;
  identityType?: string | null;
  identityNumber?: string | null;
  commercialRegistration?: string | null;
  governorateId?: number | null;
  governorate?: { id: number; name: string; nameAr: string } | null;
  cityId?: number | null;
  city?: { id: number; name: string; nameAr: string } | null;
  imageId?: number | null;
  imageUrl?: string | null;
  image?: any;
  contractAttachmentId?: number | null;
  contractUrl?: string | null;
  contractAttachment?: any;
  isActive?: boolean;
  createdAt: string;
  bankAccounts?: MarketerBankAccountItem[];
  associations?: MarketerAssociationItem[];
  monthlyReports?: MarketerMonthlyReportItem[];
  users?: { id: number; name: string; email: string; status: string }[];
}

interface MarketersClientProps {
  initialMarketers: MarketerRecord[];
  governorates?: { id: number; name: string; nameAr: string }[];
  cities?: { id: number; name: string; nameAr: string; governorateId: number }[];
  allAssociations?: { id: number; name: string }[];
  title: string;
  emptyMessage: string;
  nameLabel: string;
  createdAtLabel: string;
  locale: string;
}

import {
  MARKETER_TYPE_OPTIONS,
  IDENTITY_TYPE_OPTIONS,
  fetchCategorySelectOptions,
} from "@/lib/beneficiaryOptions";

export default function MarketersClient({
  initialMarketers,
  governorates = [],
  cities = [],
  allAssociations = [],
  title,
  emptyMessage,
  nameLabel,
  createdAtLabel,
  locale,
}: MarketersClientProps) {
  const [marketers, setMarketers] = useState<MarketerRecord[]>(initialMarketers);
  const [allGovs, setAllGovs] = useState(governorates);
  const [allCities, setAllCities] = useState(cities);
  const [assocsList, setAssocsList] = useState(allAssociations);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  // Form Mode: "list" | "create" | "view" | "edit"
  const [formMode, setFormMode] = useState<"list" | "create" | "view" | "edit">("list");
  const [viewRecord, setViewRecord] = useState<MarketerRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Dynamic Select Options State
  const [typeOptions, setTypeOptions] = useState(MARKETER_TYPE_OPTIONS);
  const [identityOptions, setIdentityOptions] = useState(IDENTITY_TYPE_OPTIONS);

  useEffect(() => {
    fetchCategorySelectOptions("marketer_type", MARKETER_TYPE_OPTIONS).then(setTypeOptions);
    fetchCategorySelectOptions("identity_type", IDENTITY_TYPE_OPTIONS).then(setIdentityOptions);
  }, []);

  // Form Fields State
  const [type, setType] = useState("employee");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [identityType, setIdentityType] = useState("national_id");
  const [identityNumber, setIdentityNumber] = useState("");
  const [commercialRegistration, setCommercialRegistration] = useState("");
  const [governorateId, setGovernorateId] = useState<number>(0);
  const [cityId, setCityId] = useState<number>(0);
  const [imageFile, setImageFile] = useState<any>(null);
  const [contractFile, setContractFile] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Notebook Pages State
  const [bankAccounts, setBankAccounts] = useState<MarketerBankAccountItem[]>([]);
  const [marketerAssociations, setMarketerAssociations] = useState<MarketerAssociationItem[]>([]);

  // Inline Table Add Row States
  const [showAddBankRow, setShowAddBankRow] = useState(false);
  const [newBank, setNewBank] = useState<MarketerBankAccountItem>({ bankName: "", accountHolderName: "", accountNumber: "", iban: "" });
  const [bankRowError, setBankRowError] = useState<Record<string, string>>({});

  const [showAddAssocRow, setShowAddAssocRow] = useState(false);
  const [newAssoc, setNewAssoc] = useState<{ associationId: number; phoneNumbers: string[] }>({ associationId: 0, phoneNumbers: [] });
  const [assocRowError, setAssocRowError] = useState<string | null>(null);

  // Monthly Reports State & Top Row Form States
  const [monthlyReports, setMonthlyReports] = useState<MarketerMonthlyReportItem[]>([]);
  const [showAddReportRow, setShowAddReportRow] = useState(false);
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  const [newReport, setNewReport] = useState<{ description: string; reportDate: string; attachment: any }>({ description: "", reportDate: "", attachment: null });
  const [reportRowError, setReportRowError] = useState<Record<string, string>>({});
  const [loadingReports, setLoadingReports] = useState(false);
  const [activeNotebookTab, setActiveNotebookTab] = useState<string>("bank-accounts");

  const [previewExcelModal, setPreviewExcelModal] = useState<{
    isOpen: boolean;
    attachmentId?: number | null;
    filename?: string;
    fileUrl?: string;
  }>({ isOpen: false });

  // Export and Bulk Action States
  const [confirmAction, setConfirmAction] = useState<
    "single-delete" | "bulk-delete" | "single-archive" | "bulk-archive" | "single-unarchive" | "bulk-unarchive" | null
  >(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [bulkExportOpen, setBulkExportOpen] = useState(false);

  // Create User Modal State
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const recordId = searchParams.get("id");
  const recordNumericId = recordId ? decodeId(recordId) : null;
  const isNew = searchParams.get("new") === "true";

  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const t = useTranslations("marketers");
  const tCommon = useTranslations("common");
  const tVal = useTranslations("validation");
  const path = "/portal/marketers";
  const isAr = locale === "ar";
  const isViewOnly = formMode === "view";

  const [archivedLoaded, setArchivedLoaded] = useState(false);
  const [fetchingArchived, setFetchingArchived] = useState(false);

  useEffect(() => {
    if (governorates.length === 0) {
      fetch("/api/governorates").then((r) => r.json()).then((d) => setAllGovs(d.governorates || [])).catch(() => {});
    }
    if (cities.length === 0) {
      fetch("/api/cities").then((r) => r.json()).then((d) => setAllCities(d.cities || [])).catch(() => {});
    }
    if (allAssociations.length === 0) {
      fetch("/api/associations").then((r) => r.json()).then((d) => setAssocsList(d.associations || [])).catch(() => {});
    }
  }, [governorates, cities, allAssociations]);

  const filteredCities = allCities.filter((c) => Number(c.governorateId) === Number(governorateId));

  const fetchArchivedMarketers = async () => {
    if (fetchingArchived) return;
    setFetchingArchived(true);
    try {
      const res = await fetch("/api/marketers?archived=true");
      if (res.ok) {
        const data = await res.json();
        if (data.marketers && Array.isArray(data.marketers)) {
          setMarketers((prev) => {
            const incomingMap = new Map<number, any>(data.marketers.map((m: any) => [m.id, m]));
            const updated = prev.map((m) => {
              if (incomingMap.has(m.id)) {
                const inc = incomingMap.get(m.id);
                incomingMap.delete(m.id);
                return { ...m, ...inc };
              }
              return m;
            });
            const newItems = Array.from(incomingMap.values()) as MarketerRecord[];
            return [...updated, ...newItems];
          });
        }
        setArchivedLoaded(true);
      }
    } catch (err) {
      console.error("Error fetching archived marketers:", err);
    } finally {
      setFetchingArchived(false);
    }
  };

  const resetForm = () => {
    setType("employee");
    setName("");
    setEmail("");
    setPhone("");
    setIdentityType("national_id");
    setIdentityNumber("");
    setCommercialRegistration("");
    setGovernorateId(0);
    setCityId(0);
    setImageFile(null);
    setContractFile(null);
    setBankAccounts([]);
    setMarketerAssociations([]);
    setFormErrors({});
    setShowAddAssocRow(false);
    setNewAssoc({ associationId: 0, phoneNumbers: [] });
  };

  const handleAddBankAccount = () => {
    // 1. Validate existing bank accounts before adding a new row
    if (bankAccounts.length > 0) {
      const bankAccountSchema = createMarketerBankAccountSchema(tVal);
      const errs: Record<string, string> = {};
      let hasError = false;

      for (let i = 0; i < bankAccounts.length; i++) {
        const b = bankAccounts[i];
        const bRes = bankAccountSchema.safeParse(b);
        if (!bRes.success) {
          hasError = true;
          bRes.error.issues.forEach((issue) => {
            const fieldName = String(issue.path[0]);
            errs[`bankAccounts.${i}.${fieldName}`] = issue.message;
          });
        }
      }

      if (hasError) {
        setFormErrors((prev) => ({ ...prev, ...errs }));
        showToast(
          isAr
            ? "الحسابات البنكية: يرجى إكمال بيانات الحساب الحالي وتصحيح الأخطاء أولاً"
            : "Bank Accounts: Please complete the current bank account fields first",
          "error"
        );
        return;
      }
    }

    // 2. Add new empty row AT THE TOP (من الأعلى)
    setBankAccounts((prev) => [
      { bankName: "", accountHolderName: "", accountNumber: "", iban: "" },
      ...prev,
    ]);
  };

  const updateBankAccountField = (index: number, field: string, value: string) => {
    setBankAccounts((prev) =>
      prev.map((acc, idx) => (idx === index ? { ...acc, [field]: value } : acc))
    );
    setFormErrors((prev) => ({
      ...prev,
      [`bankAccounts.${index}.${field}`]: "",
    }));
  };

  const removeBankAccountRow = (index: number) => {
    setBankAccounts((prev) => prev.filter((_, idx) => idx !== index));
    setFormErrors((prev) => {
      const nextErrs = { ...prev };
      Object.keys(nextErrs).forEach((key) => {
        if (key.startsWith(`bankAccounts.${index}.`)) {
          delete nextErrs[key];
        }
      });
      return nextErrs;
    });
  };

  const cityParentMap: Record<string, string[]> = {};
  governorates.forEach((g) => {
    const gName = isAr ? g.nameAr : g.name;
    const citiesOfGov = allCities
      .filter((c) => Number(c.governorateId) === Number(g.id))
      .map((c) => (isAr ? c.nameAr : c.name));
    cityParentMap[gName] = citiesOfGov;
  });

  const marketerExportFields: ExportField[] = [
    { key: "name", label: "Name", labelAr: "الاسم / الجهة" },
    { key: "type", label: "Type", labelAr: "نوع المسوق", options: typeOptions.map((o) => ({ value: o.value, label: o.labelEn, labelAr: o.label })) },
    { key: "phone", label: "Phone", labelAr: "رقم الجوال الشخصي" },
    { key: "email", label: "Email", labelAr: "البريد الإلكتروني" },
    { key: "identityType", label: "Identity Type", labelAr: "نوع الهوية", options: identityOptions.map((o) => ({ value: o.value, label: o.labelEn, labelAr: o.label })) },
    { key: "identityNumber", label: "Identity Number", labelAr: "رقم الهوية" },
    { key: "commercialRegistration", label: "Commercial Registration", labelAr: "رقم السجل التجاري" },
    {
      key: isAr ? "governorate.nameAr" : "governorate.name",
      label: "Governorate",
      labelAr: "المنطقة",
      options: governorates.map((g) => ({
        value: isAr ? g.nameAr : g.name,
        label: g.name,
        labelAr: g.nameAr,
      })),
    },
    {
      key: isAr ? "city.nameAr" : "city.name",
      label: "City",
      labelAr: "المدينة",
      options: allCities.map((c) => ({
        value: isAr ? c.nameAr : c.name,
        label: c.name,
        labelAr: c.nameAr,
      })),
      dependentOn: isAr ? "governorate.nameAr" : "governorate.name",
      parentValueMap: cityParentMap,
    },
    { key: "imageUrl", label: "Photo / Logo", labelAr: "صورة المسوق / الشعار", type: "image" },
    { key: "contractAttachmentUrl", label: "Contract", labelAr: "عقد التسويق", type: "image" },
    { key: "createdAt", label: "Created At", labelAr: "تاريخ الإنشاء" },
    { key: "bankAccounts.bankName", label: "Bank Account/Bank Name", labelAr: "اسم البنك/الحساب البنكي" },
    { key: "bankAccounts.accountHolderName", label: "Bank Account/Holder Name", labelAr: "اسم صاحب الحساب/الحساب البنكي" },
    { key: "bankAccounts.accountNumber", label: "Bank Account/Account No", labelAr: "رقم الحساب/الحساب البنكي" },
    { key: "bankAccounts.iban", label: "Bank Account/IBAN", labelAr: "الآيبان/الحساب البنكي" },
  ];

  const populateFormWithRecord = (rec: MarketerRecord) => {
    setType(rec.type || "employee");
    setName(rec.name || "");
    setEmail(rec.email || "");
    setPhone(rec.phone || "");
    setIdentityType(rec.identityType || "national_id");
    setIdentityNumber(rec.identityNumber || "");
    setCommercialRegistration(rec.commercialRegistration || "");
    setGovernorateId(rec.governorateId || (rec.governorate?.id ?? 0));
    setCityId(rec.cityId || (rec.city?.id ?? 0));
    const imgObj = rec.image
      ? {
          ...rec.image,
          name: rec.image.originalName || rec.image.name || "image.png",
          url: rec.image.url || `/api/attachments/${rec.image.id}/file`,
          mimetype: rec.image.mimetype || "image/png",
        }
      : rec.imageId
      ? {
          id: rec.imageId,
          name: "image.png",
          originalName: "image.png",
          url: `/api/attachments/${rec.imageId}/file`,
          mimetype: "image/png",
        }
      : null;

    const contractObj = rec.contractAttachment
      ? {
          ...rec.contractAttachment,
          name: rec.contractAttachment.originalName || rec.contractAttachment.name || "contract.pdf",
          url: rec.contractAttachment.url || `/api/attachments/${rec.contractAttachment.id}/file`,
          mimetype: rec.contractAttachment.mimetype || "application/pdf",
        }
      : rec.contractAttachmentId
      ? {
          id: rec.contractAttachmentId,
          name: "contract.pdf",
          originalName: "contract.pdf",
          url: `/api/attachments/${rec.contractAttachmentId}/file`,
          mimetype: "application/pdf",
        }
      : null;

    setImageFile(imgObj);
    setContractFile(contractObj);
    setBankAccounts(rec.bankAccounts || []);
    setMarketerAssociations(rec.associations || []);
    setMonthlyReports(rec.monthlyReports || []);
    loadMarketerReports(rec.id);
    setFormErrors({});
  };

  useEffect(() => {
    if (recordNumericId && !isNew) {
      const record = marketers.find((m) => m.id === recordNumericId);
      if (record) {
        setViewRecord(record);
        populateFormWithRecord(record);
        setFormMode("view");
      }
    } else if (isNew) {
      setViewRecord(null);
      resetForm();
      setFormMode("create");
    } else {
      setViewRecord(null);
      setFormMode("list");
    }
  }, [recordNumericId, isNew, marketers]);

  const openNewRecordForm = () => {
    router.push(path + "?new=true");
  };

  const openViewEditRecord = (rec: MarketerRecord, mode: "view" | "edit" = "view") => {
    setViewRecord(rec);
    populateFormWithRecord(rec);
    setFormMode(mode);
    router.push(path + "?id=" + encodeId(rec.id));
  };

  const navigateToList = () => {
    setViewRecord(null);
    setFormMode("list");
    router.push(path);
  };

  // Record navigation (pager)
  const currentIndex = recordNumericId ? marketers.findIndex((m) => m.id === recordNumericId) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < marketers.length - 1;

  const navigatePrev = () => {
    if (hasPrev) {
      const prevId = marketers[currentIndex - 1].id;
      router.replace(path + "?id=" + encodeId(prevId), { scroll: false });
    }
  };

  const navigateNext = () => {
    if (hasNext) {
      const nextId = marketers[currentIndex + 1].id;
      router.replace(path + "?id=" + encodeId(nextId), { scroll: false });
    }
  };

  const handleSaveForm = async () => {
    const payload = {
      type,
      name,
      email,
      phone,
      identityType: type === "company" ? null : identityType,
      identityNumber: type === "company" ? null : identityNumber,
      commercialRegistration: type === "company" ? commercialRegistration : null,
      governorateId: Number(governorateId),
      cityId: Number(cityId),
      imageId: imageFile?.id || null,
      contractAttachmentId: contractFile?.id || null,
      bankAccounts,
      associations: marketerAssociations,
    };

    const marketerSchema = createMarketerSchema(tVal);
    const bankAccountSchema = createMarketerBankAccountSchema(tVal);
    const errs: Record<string, string> = {};
    let hasBankErrors = false;

    const validateResult = marketerSchema.safeParse(payload);
    if (!validateResult.success) {
      validateResult.error.issues.forEach((issue) => {
        const fieldName = String(issue.path[0]);
        errs[fieldName] = issue.message;
      });
    }

    bankAccounts.forEach((b, idx) => {
      const bRes = bankAccountSchema.safeParse(b);
      if (!bRes.success) {
        hasBankErrors = true;
        bRes.error.issues.forEach((issue) => {
          const fieldName = String(issue.path[0]);
          errs[`bankAccounts.${idx}.${fieldName}`] = issue.message;
        });
      }
    });

    if (!validateResult.success || hasBankErrors) {
      setFormErrors(errs);
      showToast(isAr ? "يرجى تصحيح الأخطاء بالحقول المطلوبة" : "Please fix errors in required fields", "error");
      return;
    }

    setFormErrors({});
    setSubmitting(true);
    try {
      if (viewRecord && viewRecord.id) {
        // Update existing
        const res = await fetch(`/api/marketers/${viewRecord.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          showToast(isAr ? "تم تحديث بيانات المسوق بنجاح" : "Marketer updated successfully", "success");
          setMarketers((prev) => prev.map((m) => (m.id === viewRecord.id ? { ...m, ...data.marketer } : m)));
          setViewRecord(data.marketer);
          setFormMode("view");
        } else {
          showToast(data.error || (isAr ? "فشل تحديث البيانات" : "Failed to update"), "error");
        }
      } else {
        // Create new
        const res = await fetch("/api/marketers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          showToast(isAr ? "تم إنشاء المسوق بنجاح" : "Marketer created successfully", "success");
          setMarketers((prev) => [data.marketer, ...prev]);
          setViewRecord(data.marketer);
          setFormMode("view");
          router.push(path + "?id=" + encodeId(data.marketer.id));
        } else {
          showToast(data.error || (isAr ? "فشل إنشاء المسوق" : "Failed to create"), "error");
        }
      }
    } catch (err) {
      console.error(err);
      showToast(isAr ? "حدث خطأ في الاتصال بالخادم" : "Server connection error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBankAccountRow = () => {
    const marketerBankAccountSchema = createMarketerBankAccountSchema(tVal);
    const valResult = marketerBankAccountSchema.safeParse(newBank);
    if (!valResult.success) {
      const errs: Record<string, string> = {};
      valResult.error.issues.forEach((issue) => {
        errs[String(issue.path[0])] = issue.message;
      });
      setBankRowError(errs);
      return;
    }
    setBankRowError({});
    setBankAccounts((prev) => [newBank, ...prev]);
    setNewBank({ bankName: "", accountHolderName: "", accountNumber: "", iban: "" });
    setShowAddBankRow(false);
  };

  const handleRemoveBankAccount = (index: number) => {
    setBankAccounts((prev) => prev.filter((_, i) => i !== index));
  };

  const [editingAssocIndex, setEditingAssocIndex] = useState<number | null>(null);

  const handleAddAssociationRow = () => {
    if (!newAssoc.associationId || Number(newAssoc.associationId) === 0) {
      setAssocRowError(isAr ? "يرجى اختيار الجمعية" : "Please select association");
      return;
    }

    const selectedAssocId = Number(newAssoc.associationId);
    const existingIndex = marketerAssociations.findIndex((a) => a.associationId === selectedAssocId);

    if (existingIndex !== -1) {
      const existingItem = marketerAssociations[existingIndex];
      const mergedPhones = Array.from(new Set([...existingItem.phoneNumbers, ...newAssoc.phoneNumbers]));

      setMarketerAssociations((prev) =>
        prev.map((item, i) => (i === existingIndex ? { ...item, phoneNumbers: mergedPhones } : item))
      );
      showToast(
        isAr ? "الجمعية مضافة مسبقاً - تم إلحاق الأرقام للسجل السابق بنجاح" : "Association already linked - merged phone numbers into existing record",
        "info"
      );
      setAssocRowError(null);
      setNewAssoc({ associationId: 0, phoneNumbers: [] });
      setShowAddAssocRow(false);
      return;
    }

    const assocObj = assocsList.find((a) => a.id === selectedAssocId);
    const itemToAdd: MarketerAssociationItem = {
      associationId: selectedAssocId,
      association: assocObj,
      phoneNumbers: newAssoc.phoneNumbers,
    };

    setAssocRowError(null);
    setMarketerAssociations((prev) => [itemToAdd, ...prev]);
    setNewAssoc({ associationId: 0, phoneNumbers: [] });
    setShowAddAssocRow(false);
  };

  const handleRemoveAssociationRow = (index: number) => {
    setMarketerAssociations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveSinglePhoneFromAssociation = (assocIndex: number, phoneIndex: number) => {
    setMarketerAssociations((prev) =>
      prev.map((item, idx) => {
        if (idx !== assocIndex) return item;
        const updatedPhones = item.phoneNumbers.filter((_, pIdx) => pIdx !== phoneIndex);
        return { ...item, phoneNumbers: updatedPhones };
      })
    );
  };

  const loadMarketerReports = async (marketerId: number) => {
    setLoadingReports(true);
    try {
      const encodedId = encodeId(marketerId);
      const res = await fetch(`/api/marketers/${encodedId}/reports`);
      if (res.ok) {
        const data = await res.json();
        setMonthlyReports(data.reports || []);
      }
    } catch (err) {
      console.error("Failed to load marketer reports", err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleStartEditReport = (report: MarketerMonthlyReportItem) => {
    const formattedDate = report.reportDate
      ? new Date(report.reportDate).toISOString().split("T")[0]
      : "";

    setNewReport({
      description: report.description,
      reportDate: formattedDate,
      attachment: report.attachment
        ? {
            id: report.attachment.id,
            name: report.attachment.name || report.attachment.originalName || report.attachment.filename || "monthly_report.xlsx",
            originalName: report.attachment.originalName || report.attachment.name || "monthly_report.xlsx",
            url: `/api/attachments/${report.attachment.id}/file`,
            mimetype: report.attachment.mimetype || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          }
        : null,
    });
    setEditingReportId(report.id || null);
    setShowAddReportRow(true);
    setReportRowError({});
  };

  const handleAddReportRow = async () => {
    const reportSchema = createMarketerMonthlyReportSchema(tVal);
    const valResult = reportSchema.safeParse(newReport);

    if (!valResult.success) {
      const errs: Record<string, string> = {};
      valResult.error.issues.forEach((issue) => {
        errs[String(issue.path[0])] = issue.message;
      });
      setReportRowError(errs);
      return;
    }
    setReportRowError({});

    if (editingReportId) {
      try {
        const res = await fetch(`/api/marketers/reports/${editingReportId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: newReport.description,
            reportDate: newReport.reportDate,
            attachment: newReport.attachment,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          showToast(data.message || (isAr ? "تم تحديث التقرير الشهري بنجاح" : "Report updated"), "success");
          setMonthlyReports((prev) =>
            prev.map((r) => (r.id === editingReportId ? data.report : r))
          );
          setNewReport({ description: "", reportDate: "", attachment: null });
          setEditingReportId(null);
          setShowAddReportRow(false);
        } else {
          showToast(data.error || (isAr ? "حدث خطأ أثناء تحديث التقرير" : "Failed to update report"), "error");
        }
      } catch (err) {
        showToast(isAr ? "حدث خطأ أثناء تحديث التقرير" : "Failed to update report", "error");
      }
      return;
    }

    const targetId = viewRecord?.id || recordNumericId;
    if (targetId) {
      try {
        const encodedId = encodeId(targetId);
        const res = await fetch(`/api/marketers/${encodedId}/reports`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: newReport.description,
            reportDate: newReport.reportDate,
            attachment: newReport.attachment,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          showToast(data.message || (isAr ? "تم إضافة التقرير الشهري بنجاح" : "Report added"), "success");
          setMonthlyReports((prev) => [data.report, ...prev]);
          setNewReport({ description: "", reportDate: "", attachment: null });
          setShowAddReportRow(false);
        } else {
          showToast(data.error || (isAr ? "حدث خطأ أثناء إضافة التقرير" : "Failed to add report"), "error");
        }
      } catch (err) {
        showToast(isAr ? "حدث خطأ أثناء إضافة التقرير" : "Failed to add report", "error");
      }
    } else {
      const draftReport: MarketerMonthlyReportItem = {
        description: newReport.description,
        reportDate: newReport.reportDate,
        attachment: newReport.attachment
          ? {
              id: 0,
              filename: newReport.attachment.filename || "monthly_report.xlsx",
              mimetype: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              fileSize: 0,
              data: newReport.attachment.data,
            }
          : null,
      };
      setMonthlyReports((prev) => [draftReport, ...prev]);
      setNewReport({ description: "", reportDate: "", attachment: null });
      setShowAddReportRow(false);
    }
  };

  const handleDeleteReport = async (reportId?: number, index?: number) => {
    if (reportId) {
      try {
        const res = await fetch(`/api/marketers/reports/${reportId}`, { method: "DELETE" });
        if (res.ok) {
          showToast(isAr ? "تم حذف التقرير بنجاح" : "Report deleted", "success");
          setMonthlyReports((prev) => prev.filter((r) => r.id !== reportId));
        } else {
          showToast(isAr ? "حدث خطأ أثناء حذف التقرير" : "Failed to delete report", "error");
        }
      } catch (err) {
        showToast(isAr ? "حدث خطأ أثناء حذف التقرير" : "Failed to delete report", "error");
      }
    } else if (index !== undefined) {
      setMonthlyReports((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleConfirmCreateUser = async () => {
    if (!viewRecord || !viewRecord.id) return;
    setCreatingUser(true);
    try {
      const res = await fetch(`/api/marketers/${viewRecord.id}/create-user`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || (isAr ? "تم إنشاء حساب المسوق وإرسال رابط التفعيل" : "Marketer user created & invite sent"), "success");
        setShowCreateUserModal(false);
        const userList = viewRecord.users || [];
        setViewRecord({
          ...viewRecord,
          users: [...userList, data.user],
        });
      } else {
        showToast(data.error || (isAr ? "فشل إنشاء الحساب" : "Failed to create user"), "error");
      }
    } catch (err) {
      showToast(isAr ? "حدث خطأ أثناء الإنشاء" : "Error creating user", "error");
    } finally {
      setCreatingUser(false);
    }
  };

  const filterPresets: FilterPreset[] = [
    {
      id: "archived-items",
      label: isAr ? "عرض المؤرشفين" : "Archived Items",
      filterFunc: (item: any) => {
        if (!archivedLoaded && !fetchingArchived) fetchArchivedMarketers();
        return !!item.isArchived;
      },
    },
    ...typeOptions.map((opt) => ({
      id: `type-${opt.value}`,
      label: isAr ? opt.label : opt.labelEn,
      filterFunc: (item: MarketerRecord) => item.type === opt.value && !item.isArchived,
    })),
    {
      id: "this-month",
      label: tCommon("addedThisMonth"),
      filterFunc: (item: MarketerRecord) => {
        const now = new Date();
        const created = new Date(item.createdAt);
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear() && !item.isArchived;
      },
    },
  ];

  const groupByOptions: GroupByOption[] = [
    {
      id: "type",
      label: isAr ? "نوع المسوق" : "Marketer Type",
      groupByFunc: (item: MarketerRecord) => {
        const opt = typeOptions.find((o) => o.value === item.type);
        return isAr ? opt?.label || item.type : opt?.labelEn || item.type;
      },
    },
    {
      id: "governorate",
      label: isAr ? "المنطقة" : "Governorate",
      groupByFunc: (item: MarketerRecord) =>
        isAr ? item.governorate?.nameAr || item.governorate?.name || "غير محدد" : item.governorate?.name || "Unspecified",
    },
    {
      id: "city",
      label: isAr ? "المدينة" : "City",
      groupByFunc: (item: MarketerRecord) =>
        isAr ? item.city?.nameAr || item.city?.name || "غير محدد" : item.city?.name || "Unspecified",
    },
  ];

  const handleSelectAll = (items: MarketerRecord[]) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(items.map((m) => m.id));
    else setSelectedIds([]);
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) setSelectedIds((prev) => [...prev, id]);
    else setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const handleBulkAction = (action: "delete" | "archive" | "unarchive") => {
    if (action === "delete") setConfirmAction("bulk-delete");
    else if (action === "archive") setConfirmAction("bulk-archive");
    else setConfirmAction("bulk-unarchive");
  };

  const executeBulkDelete = async () => {
    setConfirmAction(null);
    try {
      await Promise.all(selectedIds.map((id) => fetch(`/api/marketers/${id}`, { method: "DELETE" })));
      showToast(isAr ? "تم حذف المسوقين المحددين بنجاح" : "Deleted selected items successfully", "success");
      setMarketers((prev) => prev.filter((m) => !selectedIds.includes(m.id)));
      setSelectedIds([]);
    } catch (err) {
      showToast("Error deleting marketers", "error");
    }
  };

  const executeBulkArchive = async () => {
    setConfirmAction(null);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/marketers/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isArchived: true }),
          })
        )
      );
      showToast(isAr ? "تم أرشفة المسوقين المحددين" : "Archived selected items successfully", "success");
      setMarketers((prev) => prev.map((m) => (selectedIds.includes(m.id) ? { ...m, isArchived: true } : m)));
      setSelectedIds([]);
    } catch (err) {
      showToast("Error archiving marketers", "error");
    }
  };

  const executeBulkUnarchive = async () => {
    setConfirmAction(null);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/marketers/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isArchived: false }),
          })
        )
      );
      setSelectedIds([]);
    } catch (err) {
      showToast(isAr ? "حدث خطأ أثناء إلغاء أرشفة المسوقين" : "Error unarchiving marketers", "error");
    }
  };
  const handleArchive = () => {
    setConfirmAction("single-archive");
  };

  const handleUnarchive = () => {
    setConfirmAction("single-unarchive");
  };

  const executeSingleArchive = async () => {
    const targetId = viewRecord?.id;
    setConfirmAction(null);
    if (!targetId) return;

    try {
      const res = await fetch(`/api/marketers/${targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true, isArchived: true }),
      });
      if (res.ok) {
        showToast(isAr ? "تم أرشفة المسوق بنجاح" : "Marketer archived successfully", "success");
        setMarketers((prev) =>
          prev.map((m) => (m.id === targetId ? { ...m, isArchived: true, archived: true } : m))
        );
        setViewRecord((prev) => (prev ? { ...prev, isArchived: true, archived: true } : null));
      } else {
        showToast(isAr ? "حدث خطأ أثناء أرشفة المسوق" : "Failed to archive marketer", "error");
      }
    } catch (err) {
      showToast(isAr ? "حدث خطأ أثناء أرشفة المسوق" : "Failed to archive marketer", "error");
    }
  };

  const executeSingleUnarchive = async () => {
    const targetId = viewRecord?.id;
    setConfirmAction(null);
    if (!targetId) return;

    try {
      const res = await fetch(`/api/marketers/${targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: false, isArchived: false }),
      });
      if (res.ok) {
        showToast(isAr ? "تم إلغاء أرشفة المسوق بنجاح" : "Marketer unarchived successfully", "success");
        setMarketers((prev) =>
          prev.map((m) => (m.id === targetId ? { ...m, isArchived: false, archived: false } : m))
        );
        setViewRecord((prev) => (prev ? { ...prev, isArchived: false, archived: false } : null));
      } else {
        showToast(isAr ? "حدث خطأ أثناء إلغاء أرشفة المسوق" : "Failed to unarchive marketer", "error");
      }
    } catch (err) {
      showToast(isAr ? "حدث خطأ أثناء إلغاء أرشفة المسوق" : "Failed to unarchive marketer", "error");
    }
  };

  const cellPad = "p-3 sm:p-4";

  const renderRow = (marketer: MarketerRecord) => {
    const typeLabel = isAr
      ? MARKETER_TYPE_OPTIONS.find((o) => o.value === marketer.type)?.label || marketer.type
      : MARKETER_TYPE_OPTIONS.find((o) => o.value === marketer.type)?.labelEn || marketer.type;

    return (
      <tr
        key={marketer.id}
        onClick={() => openViewEditRecord(marketer, "view")}
        className={`text-slate-700 dark:text-slate-300 hover:bg-slate-50/70 dark:hover:bg-[#1E293B]/40 transition-colors cursor-pointer ${
          selectedIds.includes(marketer.id) ? "bg-primary/5 dark:bg-tertiary/5" : ""
        }`}
      >
        <td className={cellPad} onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selectedIds.includes(marketer.id)}
            onChange={(e) => handleSelectRow(marketer.id, e.target.checked)}
            className="w-4 h-4 rounded text-primary focus:ring-primary border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 accent-primary dark:accent-tertiary cursor-pointer"
          />
        </td>
        <td className={cellPad}>
          <div className="flex items-center gap-2.5">
            {marketer.imageUrl ? (
              <img src={marketer.imageUrl} alt={marketer.name} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-200/50 dark:border-amber-800/50">
                {marketer.type === "company" ? <Building2 size={15} /> : <Users size={15} />}
              </div>
            )}
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">{marketer.name}</span>
              <span className="text-[11px] text-slate-400 dir-ltr block">{marketer.email || "—"}</span>
            </div>
          </div>
        </td>
        <td className={cellPad}>
          {marketer.associations && marketer.associations.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 max-w-[280px]">
              {marketer.associations.map((item: any, idx: number) => {
                const assocName = item.association?.name || item.name;
                if (!assocName) return null;
                return (
                  <span
                    key={item.associationId || item.id || idx}
                    className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200/80 dark:border-slate-700/60"
                  >
                    <Building size={13} className="text-primary dark:text-tertiary shrink-0" />
                    <span>{assocName}</span>
                  </span>
                );
              })}
            </div>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 text-xs italic">{isAr ? "لا توجد جمعيات" : "No associations"}</span>
          )}
        </td>
        <td className={cellPad}>
          <span className="font-semibold text-slate-800 dark:text-slate-200 dir-ltr inline-block">
            {marketer.phone || "—"}
          </span>
        </td>
        <td className={cellPad}>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
            {typeLabel}
          </span>
        </td>
        <td className={cellPad}>{isAr ? marketer.governorate?.nameAr || marketer.governorate?.name || "—" : marketer.governorate?.name || "—"}</td>
        <td className={cellPad}>{isAr ? marketer.city?.nameAr || marketer.city?.name || "—" : marketer.city?.name || "—"}</td>
      </tr>
    );
  };

  const renderKanbanCard = (marketer: MarketerRecord) => {
    const typeLabel = isAr
      ? typeOptions.find((o) => o.value === marketer.type)?.label || marketer.type
      : typeOptions.find((o) => o.value === marketer.type)?.labelEn || marketer.type;

    const govStr = isAr ? marketer.governorate?.nameAr || marketer.governorate?.name : marketer.governorate?.name;
    const cityStr = isAr ? marketer.city?.nameAr || marketer.city?.name : marketer.city?.name;
    const locationStr = [govStr, cityStr].filter(Boolean).join(" / ") || "—";

    return (
      <div
        key={marketer.id}
        onClick={() => openViewEditRecord(marketer, "view")}
        className={`bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 hover:shadow-lg transition-all cursor-pointer space-y-4 relative group ${
          selectedIds.includes(marketer.id) ? "ring-2 ring-primary dark:ring-tertiary" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {marketer.imageUrl ? (
              <img
                src={marketer.imageUrl}
                alt={marketer.name}
                className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-base border border-amber-200/50 dark:border-amber-800/50">
                {marketer.type === "company" ? <Building2 size={22} /> : <Users size={22} />}
              </div>
            )}
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{marketer.name}</h3>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
                {typeLabel}
              </span>
            </div>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selectedIds.includes(marketer.id)}
              onChange={(e) => handleSelectRow(marketer.id, e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 accent-primary cursor-pointer"
            />
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
          {marketer.phone && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">{isAr ? "رقم الجوال:" : "Phone:"}</span>
              <span className="font-semibold dir-ltr text-slate-700 dark:text-slate-300">{marketer.phone}</span>
            </div>
          )}
          {marketer.email && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">{isAr ? "البريد الإلكتروني:" : "Email:"}</span>
              <span className="font-semibold dir-ltr text-slate-700 dark:text-slate-300 truncate max-w-[160px]">{marketer.email}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">{isAr ? "المنطقة / المدينة:" : "Region / City:"}</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {locationStr}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderTableHeader = (
    visibleItems: MarketerRecord[],
    sortInfo?: { sortColumn: string | null; sortDirection: "asc" | "desc"; onSort: (field: string) => void }
  ) => (
    <thead>
      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1E293B]/50 text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs font-semibold uppercase">
        <th className={`${cellPad} text-start w-12`}>
          <input
            type="checkbox"
            checked={selectedIds.length === visibleItems.length && visibleItems.length > 0}
            onChange={handleSelectAll(visibleItems)}
            className="w-4 h-4 rounded text-primary focus:ring-primary border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 accent-primary dark:accent-tertiary cursor-pointer"
          />
        </th>
        <SortableHeader sortColumn={sortInfo?.sortColumn ?? null} sortDirection={sortInfo?.sortDirection ?? "asc"} field="name" onSort={sortInfo?.onSort ?? (() => {})} className={`${cellPad} text-start font-bold`}>
          {nameLabel}
        </SortableHeader>
        <th className={`${cellPad} text-start font-bold`}>{isAr ? "الجمعيات المرتبطة" : "Associated Charities"}</th>
        <th className={`${cellPad} text-start font-bold`}>{isAr ? "رقم الجوال الشخصي" : "Personal Phone"}</th>
        <th className={`${cellPad} text-start font-bold`}>{isAr ? "نوع المسوق" : "Type"}</th>
        <th className={`${cellPad} text-start font-bold`}>{isAr ? "المنطقة" : "Governorate"}</th>
        <th className={`${cellPad} text-start font-bold`}>{isAr ? "المدينة" : "City"}</th>
      </tr>
    </thead>
  );

  return (
    <>
      {formMode !== "list" ? (
        <FormViews
          mode={formMode}
          screenName={isAr ? "المسوقين" : "Marketers"}
          recordName={viewRecord?.name}
          onSave={handleSaveForm}
          onCancel={() => {
            if (formMode === "edit" && viewRecord) {
              // Return to view mode, re-populate form with original record data
              populateFormWithRecord(viewRecord);
              setFormMode("view");
            } else {
              navigateToList();
            }
          }}
          onAdd={openNewRecordForm}
          onEdit={() => setFormMode("edit")}
          onDelete={async () => {
            if (viewRecord?.id) {
              await fetch(`/api/marketers/${viewRecord.id}`, { method: "DELETE" });
              setMarketers((prev) => prev.filter((m) => m.id !== viewRecord.id));
              showToast(isAr ? "تم حذف المسوق بنجاح" : "Marketer deleted", "success");
              navigateToList();
            }
          }}
          onArchive={handleArchive}
          onUnarchive={handleUnarchive}
          isArchived={viewRecord?.archived || viewRecord?.isArchived}
          hasArchivePermission={hasPermission(path, "archive")}
          ribbon={viewRecord?.archived || viewRecord?.isArchived ? { title: isAr ? "مؤرشف" : "Archived", color: "danger", locale } : undefined}
          submitting={submitting}
          hasCreatePermission={hasPermission(path, "create")}
          hasEditPermission={hasPermission(path, "edit")}
          hasDeletePermission={hasPermission(path, "delete")}
          onNavigatePrev={navigatePrev}
          onNavigateNext={navigateNext}
          hasPrev={hasPrev}
          hasNext={hasNext}
          recordIndex={currentIndex + 1}
          totalRecords={marketers.length}
          locale={locale}
          onClose={navigateToList}
          extraActions={[
            ...(viewRecord?.id ? [{
              label: "Create User",
              labelAr: "إنشاء حساب المسوق وإرسال الدعوة",
              icon: <UserPlus size={14} />,
              onClick: () => setShowCreateUserModal(true),
            }] : []),
            ...(formMode === "view" && recordNumericId && hasPermission(path, "create") ? [{
              label: "Import",
              labelAr: "استيراد",
              icon: <Upload size={14} className="text-amber-500" />,
              onClick: () => router.push(`/${locale}/portal/import/marketers`),
            }] : []),
            ...(formMode === "view" && viewRecord?.id && hasPermission(path, "export") ? [{
              label: "Export",
              labelAr: "تصدير",
              icon: <Download size={14} className="text-violet-500" />,
              onClick: () => setExportModalOpen(true),
            }] : []),
          ]}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
            {/* Photo / Logo Attachment Field */}
            <div className="md:col-span-2 flex flex-col sm:flex-row items-center gap-4 bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
              <div className="shrink-0">
                <AttachmentField
                  value={imageFile}
                  onChange={setImageFile}
                  readonly={isViewOnly}
                  accept="image/*"
                  imageOnly
                  locale={locale}
                />
              </div>
              <div className="space-y-1 text-center sm:text-start">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {type === "company" ? (isAr ? "شعار المؤسسة / الجهة" : "Company Logo") : (isAr ? "صورة المسوق الشخصية" : "Marketer Photo")}
                </h4>
                <p className="text-xs text-slate-400">
                  {isAr ? "انقر على المربع لرفع صورة واضحة بدقة مناسبة (PNG أو JPG)" : "Click the square to upload a clear logo or profile photo (PNG or JPG)"}
                </p>
              </div>
            </div>

            {/* Marketer Type */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? "نوع المسوق" : "Marketer Type"} <span className="text-red-500">*</span>
              </label>
              <Select
                value={type}
                onChange={(val) => {
                  setType(String(val));
                  setFormErrors((prev) => ({ ...prev, type: "" }));
                }}
                options={typeOptions.map((o) => ({ value: o.value, label: isAr ? o.label : o.labelEn }))}
                disabled={isViewOnly}
                error={!!formErrors.type}
              />
              {formErrors.type && (
                <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                  {formErrors.type}
                </p>
              )}
            </div>

            {/* Name / Company Name */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {type === "company" ? (isAr ? "اسم الجهة / المؤسسة" : "Company Name") : (isAr ? "اسم المسوق الكامل" : "Marketer Name")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setFormErrors((prev) => ({ ...prev, name: "" }));
                }}
                disabled={isViewOnly}
                placeholder={type === "company" ? (isAr ? "شركة التسويق المعتمدة" : "Marketing Co.") : (isAr ? "عبد الله أحمد" : "Abdullah Ahmed")}
                className={formErrors.name ? "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-red-500 dark:border-red-400 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors" : "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-tertiary transition-colors"}
              />
              {formErrors.name && (
                <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                  {formErrors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? "البريد الإلكتروني" : "Email Address"} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFormErrors((prev) => ({ ...prev, email: "" }));
                }}
                disabled={isViewOnly}
                placeholder="marketer@moeen.org.sa"
                dir="ltr"
                className={formErrors.email ? "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-red-500 dark:border-red-400 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors" : "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-tertiary transition-colors"}
              />
              {formErrors.email && (
                <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? "رقم الجوال الشخصي" : "Personal Phone"} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setFormErrors((prev) => ({ ...prev, phone: "" }));
                }}
                disabled={isViewOnly}
                placeholder="5********"
                dir="ltr"
                className={formErrors.phone ? "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-red-500 dark:border-red-400 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors" : "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-tertiary transition-colors"}
              />
              {formErrors.phone && (
                <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                  {formErrors.phone}
                </p>
              )}
            </div>

            {/* Identity or Commercial Registration */}
            {type !== "company" ? (
              <>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? "نوع الهوية" : "Identity Type"} <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={identityType}
                    onChange={(val) => {
                      setIdentityType(String(val));
                      setFormErrors((prev) => ({ ...prev, identityType: "" }));
                    }}
                    options={identityOptions.map((o) => ({ value: o.value, label: isAr ? o.label : o.labelEn }))}
                    disabled={isViewOnly}
                    error={!!formErrors.identityType}
                  />
                  {formErrors.identityType && (
                    <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                      {formErrors.identityType}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? "رقم الهوية" : "Identity Number"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={identityNumber}
                    onChange={(e) => {
                      setIdentityNumber(e.target.value);
                      setFormErrors((prev) => ({ ...prev, identityNumber: "" }));
                    }}
                    disabled={isViewOnly}
                    placeholder="10********"
                    dir="ltr"
                    className={formErrors.identityNumber ? "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-red-500 dark:border-red-400 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors" : "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-tertiary transition-colors"}
                  />
                  {formErrors.identityNumber && (
                    <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                      {formErrors.identityNumber}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? "رقم السجل التجاري" : "Commercial Registration"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={commercialRegistration}
                  onChange={(e) => {
                    setCommercialRegistration(e.target.value);
                    setFormErrors((prev) => ({ ...prev, commercialRegistration: "" }));
                  }}
                  disabled={isViewOnly}
                  placeholder="10********"
                  dir="ltr"
                  className={formErrors.commercialRegistration ? "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-red-500 dark:border-red-400 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors" : "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-tertiary transition-colors"}
                />
                {formErrors.commercialRegistration && (
                  <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                    {formErrors.commercialRegistration}
                  </p>
                )}
              </div>
            )}

            {/* Governorate */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? "المنطقة" : "Governorate"} <span className="text-red-500">*</span>
              </label>
              <Select
                value={governorateId}
                onChange={(val) => {
                  setGovernorateId(Number(val));
                  setCityId(0);
                  setFormErrors((prev) => ({ ...prev, governorateId: "" }));
                }}
                options={[
                  { value: 0, label: isAr ? "-- اختر المنطقة --" : "-- Select Governorate --" },
                  ...allGovs.map((g) => ({ value: g.id, label: isAr ? g.nameAr : g.name })),
                ]}
                disabled={isViewOnly}
                error={!!formErrors.governorateId}
              />
              {formErrors.governorateId && (
                <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                  {formErrors.governorateId}
                </p>
              )}
            </div>

            {/* City */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? "المدينة" : "City"} <span className="text-red-500">*</span>
              </label>
              <Select
                value={cityId}
                onChange={(val) => {
                  setCityId(Number(val));
                  setFormErrors((prev) => ({ ...prev, cityId: "" }));
                }}
                options={[
                  { value: 0, label: isAr ? "-- اختر المدينة --" : "-- Select City --" },
                  ...filteredCities.map((c) => ({ value: c.id, label: isAr ? c.nameAr : c.name })),
                ]}
                disabled={isViewOnly || !governorateId}
                error={!!formErrors.cityId}
              />
              {formErrors.cityId && (
                <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                  {formErrors.cityId}
                </p>
              )}
            </div>

            {/* Contract Attachment */}
            <div className="md:col-span-2">
              <AttachmentField
                value={contractFile}
                onChange={setContractFile}
                readonly={isViewOnly}
                label={isAr ? "عقد التسويق (PDF / PNG / JPG)" : "Marketing Contract (PDF / PNG / JPG)"}
                accept=".pdf,image/*"
                locale={locale}
              />
            </div>

            {/* Notebook Pages Component */}
            <div className="md:col-span-2 pt-2">
              <Notebook
                activeTab={activeNotebookTab}
                onTabChange={setActiveNotebookTab}
                tabs={[
                  {
                    id: "bank-accounts",
                    title: isAr ? `الحسابات البنكية (${bankAccounts.length})` : `Bank Accounts (${bankAccounts.length})`,
                    content: (
                      <div className="space-y-4 p-2 sm:p-4">
                        {/* Add Bank Account Row Button */}
                        {!isViewOnly && (
                          <div className="flex justify-start">
                            <button
                              type="button"
                              onClick={handleAddBankAccount}
                              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-primary dark:bg-tertiary text-white rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                            >
                              <Plus size={15} />
                              <span>{isAr ? "إضافة حساب بنكي" : "Add Bank Account"}</span>
                            </button>
                          </div>
                        )}

                        {/* Bank Accounts Table */}
                        <div className="w-full overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/30">
                          <table className="w-full min-w-[700px] border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-bold">
                                <th className="p-3.5 text-start">{isAr ? "اسم البنك / الحساب" : "Bank / Account Name"} <span className="text-red-500">*</span></th>
                                <th className="p-3.5 text-start">{isAr ? "اسم صاحب الحساب" : "Holder Name"} <span className="text-red-500">*</span></th>
                                <th className="p-3.5 text-start">{isAr ? "رقم الحساب" : "Account No"} <span className="text-red-500">*</span></th>
                                <th className="p-3.5 text-start">{isAr ? "رقم الآيبان (اختياري)" : "IBAN (Optional)"}</th>
                                {!isViewOnly && <th className="p-3.5 text-center w-14"></th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {bankAccounts.length === 0 ? (
                                <tr>
                                  <td colSpan={isViewOnly ? 4 : 5} className="py-8 text-center text-xs text-slate-400">
                                    {isAr ? "لا توجد حسابات بنكية مضافة بعد" : "No bank accounts added yet"}
                                  </td>
                                </tr>
                              ) : (
                                bankAccounts.map((b, idx) => {
                                  const errBankName = formErrors[`bankAccounts.${idx}.bankName`];
                                  const errHolderName = formErrors[`bankAccounts.${idx}.accountHolderName`];
                                  const errAccNumber = formErrors[`bankAccounts.${idx}.accountNumber`];
                                  const errIban = formErrors[`bankAccounts.${idx}.iban`];

                                  return (
                                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                                      {/* Bank Name */}
                                      <td className="p-3 min-w-[160px] align-top">
                                        {isViewOnly ? (
                                          <span className="font-bold text-slate-900 dark:text-white px-2 py-1.5 block">{b.bankName || "-"}</span>
                                        ) : (
                                          <div>
                                            <input
                                              type="text"
                                              value={b.bankName}
                                              onChange={(e) => updateBankAccountField(idx, "bankName", e.target.value)}
                                              placeholder={isAr ? "مثال: مصرف الراجحي" : "e.g. Al Rajhi Bank"}
                                              className={`w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white focus:outline-none transition-colors ${
                                                errBankName ? "border-rose-500 ring-1 ring-rose-500/20" : "border-slate-200 dark:border-slate-800 focus:border-primary"
                                              }`}
                                            />
                                            {errBankName && (
                                              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                                                <span className="w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                                                {errBankName}
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </td>

                                      {/* Account Holder Name */}
                                      <td className="p-3 min-w-[160px] align-top">
                                        {isViewOnly ? (
                                          <span className="text-slate-800 dark:text-slate-200 px-2 py-1.5 block">{b.accountHolderName || "-"}</span>
                                        ) : (
                                          <div>
                                            <input
                                              type="text"
                                              value={b.accountHolderName}
                                              onChange={(e) => updateBankAccountField(idx, "accountHolderName", e.target.value)}
                                              placeholder={isAr ? "اسم صاحب الحساب" : "Holder Name"}
                                              className={`w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white focus:outline-none transition-colors ${
                                                errHolderName ? "border-rose-500 ring-1 ring-rose-500/20" : "border-slate-200 dark:border-slate-800 focus:border-primary"
                                              }`}
                                            />
                                            {errHolderName && (
                                              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                                                <span className="w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                                                {errHolderName}
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </td>

                                      {/* Account Number */}
                                      <td className="p-3 min-w-[150px] align-top">
                                        {isViewOnly ? (
                                          <span className="text-slate-800 dark:text-slate-200 px-2 py-1.5 block" dir="ltr">{b.accountNumber || "-"}</span>
                                        ) : (
                                          <div>
                                            <input
                                              type="text"
                                              value={b.accountNumber || ""}
                                              onChange={(e) => updateBankAccountField(idx, "accountNumber", e.target.value)}
                                              placeholder={isAr ? "رقم الحساب" : "Account No"}
                                              dir="ltr"
                                              className={`w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white focus:outline-none transition-colors ${
                                                errAccNumber ? "border-rose-500 ring-1 ring-rose-500/20" : "border-slate-200 dark:border-slate-800 focus:border-primary"
                                              }`}
                                            />
                                            {errAccNumber && (
                                              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                                                <span className="w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                                                {errAccNumber}
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </td>

                                      {/* IBAN */}
                                      <td className="p-3 min-w-[190px] align-top">
                                        {isViewOnly ? (
                                          <span className="uppercase text-slate-800 dark:text-slate-200 px-2 py-1.5 block" dir="ltr">{b.iban || "-"}</span>
                                        ) : (
                                          <div>
                                            <input
                                              type="text"
                                              value={b.iban || ""}
                                              onChange={(e) => updateBankAccountField(idx, "iban", e.target.value.toUpperCase())}
                                              placeholder="SA0000000000000000000000"
                                              dir="ltr"
                                              className={`w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border rounded-xl uppercase text-slate-900 dark:text-white focus:outline-none transition-colors ${
                                                errIban ? "border-rose-500 ring-1 ring-rose-500/20" : "border-slate-200 dark:border-slate-800 focus:border-primary"
                                              }`}
                                            />
                                            {errIban && (
                                              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                                                <span className="w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                                                {errIban}
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </td>

                                      {/* Delete Button */}
                                      {!isViewOnly && (
                                        <td className="p-3 text-center align-middle">
                                          <button
                                            type="button"
                                            onClick={() => removeBankAccountRow(idx)}
                                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                                            title={isAr ? "حذف الحساب البنكي" : "Remove bank account"}
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        </td>
                                      )}
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: "associations",
                    title: isAr ? `الجمعيات (${marketerAssociations.length})` : `Charities (${marketerAssociations.length})`,
                    content: (
                      <div className="space-y-4 p-4">
                        {/* Add Association Button */}
                        {!isViewOnly && (
                          <div className="flex justify-start">
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddAssocRow((prev) => !prev);
                                setAssocRowError(null);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary dark:bg-tertiary text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                            >
                              <Plus size={14} />
                              <span>{isAr ? "ربط جمعية جديدة" : "Link New Association"}</span>
                            </button>
                          </div>
                        )}

                        {/* Association Link Card Form */}
                        {showAddAssocRow && !isViewOnly && (
                          <div className="bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-3 animate-in fade-in duration-150 shadow-xs">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Building2 size={14} className="text-primary dark:text-tertiary" />
                                <span>{isAr ? "ربط الجمعية وتعيين أرقام التواصل:" : "Link Association & Assign Phone Numbers:"}</span>
                              </h5>
                              <button
                                type="button"
                                onClick={() => setShowAddAssocRow(false)}
                                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                              >
                                {isAr ? "إلغاء" : "Cancel"}
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  {isAr ? "الجمعية" : "Association"} <span className="text-red-500">*</span>
                                </label>
                                <Select
                                  value={newAssoc.associationId}
                                  onChange={(val) => setNewAssoc((prev) => ({ ...prev, associationId: Number(val) }))}
                                  options={[
                                    { value: 0, label: isAr ? "-- اختر الجمعية --" : "-- Select Association --" },
                                    ...assocsList
                                      .filter((a) => !marketerAssociations.some((ma) => ma.associationId === a.id))
                                      .map((a) => ({ value: a.id, label: a.name })),
                                  ]}
                                  error={!!assocRowError}
                                />
                                {assocRowError && <p className="text-[10px] text-rose-500 font-medium mt-1">{assocRowError}</p>}
                              </div>

                              <div>
                                <DynamicPhoneNumbersInput
                                  label={isAr ? "أرقام التواصل بالجمعية (إمكانية إضافة أكثر من رقم)" : "Association Contact Phones"}
                                  value={newAssoc.phoneNumbers}
                                  onChange={(phones) => setNewAssoc((prev) => ({ ...prev, phoneNumbers: phones }))}
                                  isAr={isAr}
                                />
                              </div>
                            </div>

                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={handleAddAssociationRow}
                                className="px-4 py-2 text-xs font-bold bg-primary dark:bg-tertiary text-white rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-xs flex items-center gap-1.5"
                              >
                                <Check size={14} />
                                <span>{isAr ? "تأكيد ربط الجمعية" : "Confirm Association Link"}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Associations List Table */}
                        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/30">
                          <table className="w-full text-xs text-start">
                            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                              <tr>
                                <th className="p-3.5 text-start">{isAr ? "اسم الجمعية" : "Association Name"}</th>
                                <th className="p-3.5 text-start">{isAr ? "أرقام التواصل المخصصة" : "Assigned Phone Numbers"}</th>
                                <th className="p-3.5 text-center w-16"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {marketerAssociations.length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="py-6 text-center text-xs text-slate-400">
                                    {isAr ? "لم يتم ربط أي جمعية لهذا المسوق بعد" : "No associations linked yet"}
                                  </td>
                                </tr>
                              ) : (
                                marketerAssociations.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                      <Building size={14} className="text-primary dark:text-tertiary" />
                                      <span>{item.association?.name || assocsList.find((a) => a.id === item.associationId)?.name || "—"}</span>
                                    </td>
                                    <td className="p-3.5">
                                      {editingAssocIndex === idx ? (
                                        <div className="space-y-2 py-1">
                                          <DynamicPhoneNumbersInput
                                            label={isAr ? "تعديل وإضافة أرقام الجوال للجمعية:" : "Edit & Add Phones for Association:"}
                                            value={item.phoneNumbers}
                                            onChange={(updatedPhones) => {
                                              setMarketerAssociations((prev) =>
                                                prev.map((a, i) => (i === idx ? { ...a, phoneNumbers: updatedPhones } : a))
                                              );
                                            }}
                                            isAr={isAr}
                                          />
                                          <div className="flex justify-end pt-1">
                                            <button
                                              type="button"
                                              onClick={() => setEditingAssocIndex(null)}
                                              className="px-3 py-1 text-[11px] font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                                            >
                                              {isAr ? "حفظ الأرقام" : "Save Numbers"}
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex flex-wrap gap-1.5 items-center">
                                            {item.phoneNumbers && item.phoneNumbers.length > 0 ? (
                                              item.phoneNumbers.map((p, pIdx) => (
                                                <span
                                                  key={pIdx}
                                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 rounded-lg text-[11px] dir-ltr"
                                                >
                                                  <Phone size={10} className="text-primary dark:text-tertiary shrink-0" />
                                                  <span>{p}</span>
                                                  {!isViewOnly && (
                                                    <button
                                                      type="button"
                                                      onClick={() => handleRemoveSinglePhoneFromAssociation(idx, pIdx)}
                                                      className="text-slate-400 hover:text-rose-500 transition-colors p-0.5 ms-1 cursor-pointer"
                                                      title={isAr ? "إزالة هذا الرقم" : "Remove this number"}
                                                    >
                                                      <X size={12} />
                                                    </button>
                                                  )}
                                                </span>
                                              ))
                                            ) : (
                                              <span className="text-slate-400 italic text-[11px]">{isAr ? "لا توجد أرقام تواصل" : "No numbers"}</span>
                                            )}
                                          </div>

                                          {!isViewOnly && (
                                            <button
                                              type="button"
                                              onClick={() => setEditingAssocIndex(idx)}
                                              className="px-2.5 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer shrink-0"
                                            >
                                              {isAr ? "+ إضافة/تعديل أرقام" : "+ Edit/Add Numbers"}
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-3.5 text-center">
                                      {!isViewOnly && (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveAssociationRow(idx)}
                                          className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                          title={isAr ? "حذف الجمعية" : "Remove Association"}
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: "monthlyReports",
                    title: isAr ? `التقارير الشهرية (${monthlyReports.length})` : `Monthly Reports (${monthlyReports.length})`,
                    content: (
                      <div className="space-y-4 p-4">
                        {/* Add Report Button */}
                        {!isViewOnly && (
                          <div className="flex justify-start">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingReportId(null);
                                setNewReport({ description: "", reportDate: "", attachment: null });
                                setShowAddReportRow((prev) => !prev);
                                setReportRowError({});
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary dark:bg-tertiary text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                            >
                              <Plus size={14} />
                              <span>{isAr ? "إضافة تقرير شهري" : "Add Monthly Report"}</span>
                            </button>
                          </div>
                        )}

                        {/* Top Inline Form for Adding / Editing Monthly Report */}
                        {showAddReportRow && !isViewOnly && (
                          <div className="bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-4 animate-in fade-in duration-150 shadow-xs">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <FileSpreadsheet size={15} className="text-primary dark:text-tertiary" />
                                <span>
                                  {editingReportId
                                    ? isAr
                                      ? "تعديل التقرير الشهري:"
                                      : "Edit Monthly Report:"
                                    : isAr
                                    ? "إضافة تقرير شهري جديد:"
                                    : "New Monthly Report:"}
                                </span>
                              </h5>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAddReportRow(false);
                                  setEditingReportId(null);
                                  setNewReport({ description: "", reportDate: "", attachment: null });
                                }}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
                              >
                                {isAr ? "إلغاء" : "Cancel"}
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  {isAr ? "وصف التقرير" : "Report Description"} <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={newReport.description}
                                  onChange={(e) => {
                                    setNewReport((prev) => ({ ...prev, description: e.target.value }));
                                    setReportRowError((prev) => ({ ...prev, description: "" }));
                                  }}
                                  placeholder={isAr ? "مثال: تقرير شهر أغسطس 2026" : "e.g. August 2026 Report"}
                                  className={
                                    reportRowError.description
                                      ? "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-red-500 dark:border-red-400 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                                      : "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-tertiary transition-colors"
                                  }
                                />
                                {reportRowError.description && (
                                  <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                                    {reportRowError.description}
                                  </p>
                                )}
                              </div>

                              <div>
                                <DatePicker
                                  value={newReport.reportDate}
                                  onChange={(val) => {
                                    setNewReport((prev) => ({ ...prev, reportDate: val }));
                                    setReportRowError((prev) => ({ ...prev, reportDate: "" }));
                                  }}
                                  label={isAr ? "تاريخ التقرير" : "Report Date"}
                                  required
                                  error={reportRowError.reportDate}
                                  locale={locale}
                                />
                              </div>

                              <div>
                                <AttachmentField
                                  value={newReport.attachment}
                                  onChange={(fileObj) => {
                                    setNewReport((prev) => ({ ...prev, attachment: fileObj }));
                                    setReportRowError((prev) => ({ ...prev, attachment: "" }));
                                  }}
                                  label={isAr ? "مرفق الإكسل (.xlsx, .xls, .csv)" : "Excel Attachment (.xlsx, .xls)"}
                                  accept=".xlsx,.xls,.csv"
                                  locale={locale}
                                />
                                {reportRowError.attachment && (
                                  <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                                    {reportRowError.attachment}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={handleAddReportRow}
                                className="px-4 py-2 text-xs font-bold bg-primary dark:bg-tertiary text-white rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-xs flex items-center gap-1.5"
                              >
                                <Check size={14} />
                                <span>
                                  {editingReportId
                                    ? isAr
                                      ? "تأكيد حفظ التعديلات"
                                      : "Save Changes"
                                    : isAr
                                    ? "تأكيد إضافة التقرير"
                                    : "Confirm Add Report"}
                                </span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Monthly Reports Table */}
                        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/30">
                          <table className="w-full text-xs text-start">
                            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                              <tr>
                                <th className="p-3.5 text-start">{isAr ? "وصف التقرير" : "Description"}</th>
                                <th className="p-3.5 text-start">{isAr ? "تاريخ التقرير / السنة" : "Report Date / Year"}</th>
                                <th className="p-3.5 text-start">{isAr ? "المرفق الإكسل" : "Excel Attachment"}</th>
                                <th className="p-3.5 text-center w-16"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {loadingReports ? (
                                <tr>
                                  <td colSpan={4} className="py-8 text-center text-xs text-slate-400">
                                    {isAr ? "جاري تحميل التقارير..." : "Loading reports..."}
                                  </td>
                                </tr>
                              ) : monthlyReports.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-8 text-center text-xs text-slate-400">
                                    {isAr ? "لا توجد تقارير شهرية مرفوعة لهذا المسوق بعد" : "No monthly reports added yet"}
                                  </td>
                                </tr>
                              ) : (
                                monthlyReports.map((report, rIdx) => {
                                  const rDate = new Date(report.reportDate);
                                  const yearStr = !isNaN(rDate.getTime()) ? rDate.getFullYear() : "—";
                                  const monthName = !isNaN(rDate.getTime())
                                    ? rDate.toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "long", year: "numeric" })
                                    : "—";

                                  return (
                                    <tr key={rIdx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                                      <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <FileSpreadsheet size={15} className="text-primary dark:text-tertiary shrink-0" />
                                        <span>{report.description}</span>
                                      </td>
                                      <td className="p-3.5">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-slate-800 dark:text-slate-200">{monthName}</span>
                                          <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-extrabold border border-amber-200/60 dark:border-amber-800/60">
                                            {yearStr}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="p-3.5">
                                        {report.attachment || report.attachmentId ? (
                                          <div className="flex items-center gap-2">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setPreviewExcelModal({
                                                  isOpen: true,
                                                  attachmentId: report.attachmentId || report.attachment?.id,
                                                  filename: report.attachment?.name || report.attachment?.originalName || report.attachment?.filename || "report.xlsx",
                                                  fileUrl: report.attachment?.data ? (typeof report.attachment.data === "string" ? report.attachment.data : undefined) : undefined,
                                                })
                                              }
                                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
                                            >
                                              <Eye size={12} />
                                              <span>{isAr ? "معاينة الملف" : "Preview"}</span>
                                            </button>

                                            {(report.attachmentId || report.attachment?.id) && (
                                              <a
                                                href={`/api/attachments/${report.attachmentId || report.attachment?.id}/file`}
                                                download={report.attachment?.name || report.attachment?.originalName || report.attachment?.filename || "monthly_report.xlsx"}
                                                className="p-1 text-slate-400 hover:text-primary dark:hover:text-tertiary transition-colors cursor-pointer"
                                                title={isAr ? "تنزيل الملف" : "Download File"}
                                              >
                                                <Download size={14} />
                                              </a>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-slate-400 italic text-[11px]">{isAr ? "بدون مرفق" : "No file"}</span>
                                        )}
                                      </td>
                                      <td className="p-3.5 text-center">
                                        {!isViewOnly && (
                                          <div className="flex items-center justify-center gap-1.5">
                                            <button
                                              type="button"
                                              onClick={() => handleStartEditReport(report)}
                                              className="p-1 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                                              title={isAr ? "تعديل التقرير" : "Edit Report"}
                                            >
                                              <Edit3 size={14} />
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => handleDeleteReport(report.id, rIdx)}
                                              className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                              title={isAr ? "حذف التقرير" : "Delete Report"}
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: "qrCode",
                    title: isAr ? "رمز الاستجابة السريع" : "QR Code",
                    content: (
                      <MarketerQrCodeTab
                        marketerId={viewRecord?.id}
                        marketerName={name || viewRecord?.name || ""}
                        locale={locale}
                      />
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </FormViews>
      ) : (
        <SearchViews
          title={title}
          newButtonLabel={t("addNew")}
          onNewClick={openNewRecordForm}
          hasCreatePermission={hasPermission(path, "create")}
          bulkActionsNode={
            <BulkActionMenu
              selectedIds={selectedIds}
              onAction={handleBulkAction}
              showDelete={hasPermission(path, "delete")}
              showArchive={hasPermission(path, "archive")}
              showUnarchive={hasPermission(path, "archive")}
              labels={{
                delete: tCommon("delete"),
                archive: tCommon("archive"),
                unarchive: tCommon("unarchive"),
                settings: tCommon("settings"),
              }}
              extraActions={[
                ...(hasPermission(path, "create") ? [{
                  label: tCommon("import"),
                  icon: <Upload size={14} className="text-amber-500" />,
                  onClick: () => router.push(`/${locale}/portal/import/marketers`),
                }] : []),
                ...(hasPermission(path, "export") ? [{
                  label: tCommon("export"),
                  icon: <Download size={14} className="text-violet-500" />,
                  onClick: () => setBulkExportOpen(true),
                }] : []),
              ]}
            />
          }
          items={marketers}
          searchFields={["name", "email", "phone", "identityNumber", "commercialRegistration"]}
          filterPresets={filterPresets}
          groupByOptions={groupByOptions}
          pageSize={30}
          locale={locale}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        >
          {({ currentPageItems, groupedItems, activeGroupBy, expandedGroups, toggleGroup, sortColumn, sortDirection, onSort }) =>
            viewMode === "kanban" ? (
              <KanbanViews
                currentPageItems={currentPageItems}
                groupedItems={groupedItems}
                activeGroupBy={activeGroupBy}
                expandedGroups={expandedGroups}
                toggleGroup={toggleGroup}
                renderCard={renderKanbanCard}
                locale={locale}
                emptyTitle={t("emptyTitle")}
                emptyDescription={emptyMessage}
              />
            ) : (
              <ListViews
                renderTableHeader={renderTableHeader}
                renderRow={renderRow}
                emptyTitle={t("emptyTitle")}
                emptyDescription={emptyMessage}
                currentPageItems={currentPageItems}
                groupedItems={groupedItems}
                expandedGroups={expandedGroups}
                toggleGroup={toggleGroup}
                locale={locale}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={onSort}
              />
            )
          }
        </SearchViews>
      )}

      {/* Confirm Dialog for Actions */}
      <ConfirmDialog
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction === "bulk-delete") executeBulkDelete();
          else if (confirmAction === "single-archive") executeSingleArchive();
          else if (confirmAction === "bulk-archive") executeBulkArchive();
          else if (confirmAction === "single-unarchive") executeSingleUnarchive();
          else if (confirmAction === "bulk-unarchive") executeBulkUnarchive();
        }}
        title={
          confirmAction?.includes("delete")
            ? (isAr ? "حذف المسوق" : "Delete Marketer")
            : confirmAction?.includes("unarchive")
            ? (isAr ? "إلغاء أرشفة المسوق" : "Unarchive Marketer")
            : (isAr ? "أرشفة المسوق" : "Archive Marketer")
        }
        message={
          confirmAction === "bulk-delete"
            ? (isAr ? `هل أنت متأكد من حذف ${selectedIds.length} مسوق؟` : `Are you sure you want to delete ${selectedIds.length} marketers?`)
            : confirmAction === "bulk-archive"
            ? (isAr ? `هل أنت متأكد من أرشفة ${selectedIds.length} مسوق؟` : `Are you sure you want to archive ${selectedIds.length} marketers?`)
            : confirmAction === "bulk-unarchive"
            ? (isAr ? `هل أنت متأكد من إلغاء أرشفة ${selectedIds.length} مسوق؟` : `Are you sure you want to unarchive ${selectedIds.length} marketers?`)
            : confirmAction === "single-archive"
            ? (isAr ? `هل أنت متأكد من أرشفة المسوق "${viewRecord?.name}"؟` : `Are you sure you want to archive marketer "${viewRecord?.name}"?`)
            : (isAr ? `هل أنت متأكد من إلغاء أرشفة المسوق "${viewRecord?.name}"؟` : `Are you sure you want to unarchive marketer "${viewRecord?.name}"?`)
        }
        confirmLabel={
          confirmAction?.includes("delete")
            ? tCommon("delete")
            : confirmAction?.includes("unarchive")
            ? (isAr ? "إلغاء الأرشفة" : "Unarchive")
            : tCommon("archive")
        }
        cancelLabel={tCommon("cancel")}
      />

      {/* Create Marketer User Account Modal */}
      {showCreateUserModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowCreateUserModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 text-start"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5 text-primary dark:text-tertiary">
                <UserPlus size={20} />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {isAr ? "تأكيد إنشاء حساب المسوق" : "Confirm Create Marketer User"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateUserModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/40">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">{isAr ? "اسم المسوق/الجهة:" : "Marketer Name:"}</span>
                <span className="font-bold text-slate-900 dark:text-white">{name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/40">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">{isAr ? "البريد الإلكتروني:" : "Email:"}</span>
                <span className="font-bold text-slate-900 dark:text-white dir-ltr">{email}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/40">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">{isAr ? "نوع المسوق:" : "Type:"}</span>
                <span className="font-bold text-primary dark:text-tertiary">
                  {MARKETER_TYPE_OPTIONS.find((o) => o.value === type)?.label || type}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">{isAr ? "حالة الحساب عند الإنشاء:" : "Account Initial Status:"}</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-full font-bold text-[10px]">
                  {isAr ? "غير نشط (بانتظار قبول الدعوة)" : "Inactive"}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {isAr
                ? "سيتم إنشاء حساب للمسوق بحالة غير نشطة وإرسال بريد إلكتروني تفاعلي يحتوي على رابط دعوة آمن لصنع كلمة المرور الخاصة بحسابه."
                : "A new account with inactive status will be created, and an invitation link will be sent to the email address to setup password."}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateUserModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                {tCommon("cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmCreateUser}
                disabled={creatingUser}
                className="px-4 py-2.5 text-xs font-bold bg-primary dark:bg-tertiary text-white rounded-xl hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {creatingUser ? (
                  <span>{isAr ? "جاري إنشاء الحساب وإرسال الدعوة..." : "Creating & Sending Invite..."}</span>
                ) : (
                  <>
                    <Mail size={14} />
                    <span>{isAr ? "تأكيد إنشاء الحساب وإرسال الدعوة" : "Confirm Create Account & Send Invite"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal (Single Record / All List) */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        tableName="marketers"
        tableLabelAr="المسوقين"
        availableFields={marketerExportFields}
        selectedIds={[]}
        recordId={viewRecord?.id}
        allRecords={viewRecord ? [viewRecord] : marketers}
        screenPath={path}
        locale={locale}
      />

      {/* Export Modal (Bulk Selected Records) */}
      <ExportModal
        isOpen={bulkExportOpen}
        onClose={() => setBulkExportOpen(false)}
        tableName="marketers"
        tableLabelAr="المسوقين"
        availableFields={marketerExportFields}
        selectedIds={selectedIds}
        allRecords={marketers}
        screenPath={path}
        locale={locale}
      />

      {/* Excel File Preview Modal */}
      <ExcelPreviewModal
        isOpen={previewExcelModal.isOpen}
        onClose={() => setPreviewExcelModal({ isOpen: false })}
        attachmentId={previewExcelModal.attachmentId}
        filename={previewExcelModal.filename}
        fileUrl={previewExcelModal.fileUrl}
        isAr={isAr}
      />
    </>
  );
}
