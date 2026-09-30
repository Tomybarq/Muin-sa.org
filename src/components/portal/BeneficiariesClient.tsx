"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { EditButton, BulkActionMenu } from "@/components/ui/ActionButtons";
import SortableHeader from "@/components/ui/SortableHeader";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/lib/ToastContext";
import { Building, User, Phone, Download, Upload, Plus, Check, X, Trash2, ArchiveRestore, Megaphone } from "lucide-react";
import MarketingKitModal from "@/components/portal/MarketingKitModal";
import Notebook from "@/components/ui/Notebook";
import SearchViews, { FilterPreset, GroupByOption } from "./SearchViews";
import ListViews from "./ListViews";
import KanbanViews from "./KanbanViews";
import FormViews from "./FormViews";
import Select from "@/components/ui/Select";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AttachmentField from "@/components/ui/AttachmentField";
import ImageGallery, { type GalleryImage } from "@/components/ui/ImageGallery";
import DatePicker from "@/components/ui/DatePicker";
import Many2ManyTags from "@/components/ui/Many2ManyTags";
import ExportModal, { type ExportField } from "@/components/ui/ExportModal";
import { CurrencyField } from "@/components/ui/CurrencyField";
import { SaudiRiyalIcon } from "@/components/ui/SaudiRiyalIcon";
import { createBeneficiarySchema } from "@/lib/zodSchemas";
import { encodeId, decodeId } from "@/lib/idObfuscator";
import NeedsSection, { type Needs } from "./NeedsSection";
import {
  MARITAL_OPTIONS,
  HEALTH_OPTIONS,
  EDUCATION_OPTIONS,
  DEPENDENT_RELATIONSHIP_OPTIONS,
  SOCIAL_STATUS_OPTIONS,
  WORK_STATUS_OPTIONS,
  ENVIRONMENT_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  HOUSING_TENURE_OPTIONS,
  CASE_CLASSIFICATION_OPTIONS,
  NEEDS_EXPORT_FIELDS,
  toExportOptions,
  fetchCategorySelectOptions,
} from "@/lib/beneficiaryOptions";

function calculateAge(birthDateStr: string | null | undefined): number {
  if (!birthDateStr) return 0;
  const birthDate = new Date(birthDateStr);
  if (isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(age, 0);
}

interface BeneficiaryListItem {
  id: number;
  associationId?: number;
  association?: { id: number; name: string } | null;
  fullName: string;
  nationalId: string;
  birthDate?: string;
  phone: string;
  healthStatus: string;
  maritalStatus: string;
  educationLevel?: string | null;
  caseClassification?: string | null;
  totalIncome?: number | null;
  dependentCount: number;
  photoId?: number | null;
  photoUrl?: string | null;
  createdAt: string;
}

interface BeneficiaryFormData {
  id?: number;
  associationId?: number;
  association?: { id: number; name: string } | null;
  fullName: string;
  nationalId: string;
  birthDate: string;
  maritalStatus: string;
  educationLevel: string;
  healthStatus: string;
  diseaseType: string | null;
  disabilityType: string | null;
  phone: string;
  alternatePhone: string | null;
  totalFamilyMembers: number | null;
  address: string;
  photoId: number | null;
  photo: AttachmentData | null;
  addressProofId: number | null;
  addressProof: AttachmentData | null;
  researcherOpinion: string | null;
  dependentsOpinion: string | null;
  isArchived?: boolean;
}

interface AttachmentData {
  id: number;
  url: string;
  name: string;
  originalName: string;
  mimetype: string;
  fileSize: number;
}

interface DependentFormData {
  id?: number;
  name: string;
  relationship: string;
  birthDate: string | null;
  educationLevel: string;
  healthStatus: string;
  socialStatus: string;
  workStatus: string;
}

interface BeneficiariesClientProps {
  initialBeneficiaries: BeneficiaryListItem[];
  title: string;
  locale: string;
}




export default function BeneficiariesClient({
  initialBeneficiaries,
  title,
  locale,
}: BeneficiariesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAr = locale === "ar";
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const t = useTranslations("beneficiaries");
  const tCommon = useTranslations("common");
  const tVal = useTranslations("validation");
  const path = "/portal/beneficiaries";
  const formRef = useRef<HTMLDivElement>(null);

  const [beneficiaries, setBeneficiaries] = useState(initialBeneficiaries);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [confirmAction, setConfirmAction] = useState<"single-delete" | "bulk-delete" | "single-archive" | "bulk-archive" | "single-unarchive" | "bulk-unarchive" | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [bulkExportOpen, setBulkExportOpen] = useState(false);
  const [marketingKitModalOpen, setMarketingKitModalOpen] = useState(false);

  const rawIdParam = searchParams.get("id");
  const recordId = rawIdParam ? decodeId(rawIdParam) : null;
  const isNew = searchParams.get("new") === "true";
  const formMode: "view" | "create" | "edit" = isNew ? "create" : recordId && searchParams.get("edit") === "true" ? "edit" : recordId ? "view" : "view";
  const currentIndex = recordId ? beneficiaries.findIndex((b) => b.id === recordId) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < beneficiaries.length - 1;

  const [viewRecord, setViewRecord] = useState<BeneficiaryFormData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Dynamic Select Options State
  const [maritalOptions, setMaritalOptions] = useState(MARITAL_OPTIONS);
  const [healthOptions, setHealthOptions] = useState(HEALTH_OPTIONS);
  const [educationOptions, setEducationOptions] = useState(EDUCATION_OPTIONS);
  const [housingTypeOptions, setHousingTypeOptions] = useState(HOUSING_TYPE_OPTIONS);
  const [housingTenureOptions, setHousingTenureOptions] = useState(HOUSING_TENURE_OPTIONS);
  const [environmentOptions, setEnvironmentOptions] = useState(ENVIRONMENT_OPTIONS);
  const [caseClassificationOptions, setCaseClassificationOptions] = useState(CASE_CLASSIFICATION_OPTIONS);

  useEffect(() => {
    fetchCategorySelectOptions("marital_status", MARITAL_OPTIONS).then(setMaritalOptions);
    fetchCategorySelectOptions("health_status", HEALTH_OPTIONS).then(setHealthOptions);
    fetchCategorySelectOptions("education_level", EDUCATION_OPTIONS).then(setEducationOptions);
    fetchCategorySelectOptions("housing_type", HOUSING_TYPE_OPTIONS).then(setHousingTypeOptions);
    fetchCategorySelectOptions("housing_tenure", HOUSING_TENURE_OPTIONS).then(setHousingTenureOptions);
    fetchCategorySelectOptions("environment", ENVIRONMENT_OPTIONS).then(setEnvironmentOptions);
    fetchCategorySelectOptions("case_classification", CASE_CLASSIFICATION_OPTIONS).then(setCaseClassificationOptions);
  }, []);

  const [associationId, setAssociationId] = useState<string>("");
  const [associationsList, setAssociationsList] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetch("/api/associations")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : Array.isArray(data?.associations) ? data.associations : [];
        if (list.length > 0) {
          setAssociationsList(list.map((a: any) => ({ value: String(a.id), label: a.name })));
        }
      })
      .catch(() => {});
  }, []);

  const [fullName, setFullName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [healthStatus, setHealthStatus] = useState("");
  const [diseaseType, setDiseaseType] = useState("");
  const [disabilityType, setDisabilityType] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [totalFamilyMembers, setTotalFamilyMembers] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [photo, setPhoto] = useState<AttachmentData | null>(null);
  const [researcherOpinion, setResearcherOpinion] = useState("");
  const [dependentsOpinion, setDependentsOpinion] = useState("");
  const [addressProof, setAddressProof] = useState<AttachmentData | null>(null);
  const [dependents, setDependents] = useState<DependentFormData[]>([]);

  // Financial Status - Income
  const [salaryIncome, setSalaryIncome] = useState<number | null>(null);
  const [socialSecurity, setSocialSecurity] = useState<number | null>(null);
  const [citizenAccount, setCitizenAccount] = useState<number | null>(null);
  const [comprehensiveRehab, setComprehensiveRehab] = useState<number | null>(null);
  const [otherAssocSupport, setOtherAssocSupport] = useState<number | null>(null);
  const [livestockCount, setLivestockCount] = useState<number | null>(null);
  const [otherAssetTotal, setOtherAssetTotal] = useState<number | null>(null);
  const [otherAssetDesc, setOtherAssetDesc] = useState("");
  const [incomeAssets, setIncomeAssets] = useState<string[]>([]);
  const [incomeAssetOptions, setIncomeAssetOptions] = useState<{ value: string; label: string; labelEn: string }[]>([]);
  const [totalIncome, setTotalIncome] = useState<number | null>(null);

  // Fetch income asset options
  useEffect(() => {
    fetch("/api/income-assets")
      .then((r) => r.json())
      .then((data) => setIncomeAssetOptions(data))
      .catch(() => {});
  }, []);

  // Fetch service bill options
  useEffect(() => {
    fetch("/api/service-bills")
      .then((r) => r.json())
      .then((data) => setServiceBillOptions(data))
      .catch(() => {});
  }, []);

  // Financial Status - Expenses
  const [rentAmount, setRentAmount] = useState<number | null>(null);
  const [electricityBill, setElectricityBill] = useState<number | null>(null);
  const [waterBill, setWaterBill] = useState<number | null>(null);
  const [internetBill, setInternetBill] = useState<number | null>(null);
  const [phoneBill, setPhoneBill] = useState<number | null>(null);
  const [gasBill, setGasBill] = useState<number | null>(null);
  const [medicalExpenses, setMedicalExpenses] = useState<number | null>(null);
  const [transportExpenses, setTransportExpenses] = useState<number | null>(null);
  const [foodExpenses, setFoodExpenses] = useState<number | null>(null);
  const [serviceBills, setServiceBills] = useState<string[]>([]);
  const [serviceBillOptions, setServiceBillOptions] = useState<{ value: string; label: string; labelEn: string }[]>([]);
  const [debtMonthly, setDebtMonthly] = useState<number | null>(null);
  const [debtReason, setDebtReason] = useState("");
  const [debtPeriod, setDebtPeriod] = useState("");
  const [debtAttachment, setDebtAttachment] = useState<AttachmentData | null>(null);
  const [totalExpenses, setTotalExpenses] = useState<number | null>(null);
  const [netIncome, setNetIncome] = useState<number | null>(null);
  const [financialOpinion, setFinancialOpinion] = useState("");

  // Housing / Environment
  const [environmentType, setEnvironmentType] = useState("");
  const [housingType, setHousingType] = useState("");
  const [housingTenure, setHousingTenure] = useState("");
  const [housingOpinion, setHousingOpinion] = useState("");

  // Needs
  const [needs, setNeeds] = useState<Needs>({});
  const [needsOpinion, setNeedsOpinion] = useState("");

  // Donation Packages
  const [donationPackages, setDonationPackages] = useState<{ program: string; cost: number | null }[]>([]);

  // Final Recommendation
  const [finalRecommendation, setFinalRecommendation] = useState("");
  const [caseClassification, setCaseClassification] = useState("");

  // صور ميدانية
  const [buildingPhoto, setBuildingPhoto] = useState<AttachmentData | null>(null);
  const [livingRoomPhotos, setLivingRoomPhotos] = useState<GalleryImage[]>([]);
  const [kitchenPhotos, setKitchenPhotos] = useState<GalleryImage[]>([]);
  const [ceilingPhotos, setCeilingPhotos] = useState<GalleryImage[]>([]);

  const isViewOnly = formMode === "view" || (formMode === "edit" && !hasPermission(path, "edit"));

  const exportFields: ExportField[] = [
    { key: "fullName", label: "Full Name", labelAr: "الاسم الكامل" },
    { key: "association.name", label: "Association", labelAr: "الجمعية" },
    { key: "nationalId", label: "National ID", labelAr: "رقم الهوية" },
    { key: "birthDate", label: "Birth Date", labelAr: "تاريخ الميلاد" },
    { key: "maritalStatus", label: "Marital Status", labelAr: "الحالة الاجتماعية", options: maritalOptions.map((o) => ({ value: o.value, label: o.labelEn, labelAr: o.label })) },
    { key: "educationLevel", label: "Education Level", labelAr: "المستوى التعليمي", options: educationOptions.map((o) => ({ value: o.value, label: o.labelEn, labelAr: o.label })) },
    { key: "healthStatus", label: "Health Status", labelAr: "الحالة الصحية", options: healthOptions.map((o) => ({ value: o.value, label: o.labelEn, labelAr: o.label })) },
    { key: "diseaseType", label: "Disease Type", labelAr: "نوع المرض" },
    { key: "disabilityType", label: "Disability Type", labelAr: "نوع الإعاقة" },
    { key: "phone", label: "Phone", labelAr: "رقم الجوال" },
    { key: "alternatePhone", label: "Alternate Phone", labelAr: "جوال بديل" },
    { key: "totalFamilyMembers", label: "Total Family Members", labelAr: "أفراد الأسرة" },
    { key: "address", label: "National Address", labelAr: "العنوان الوطني" },
    { key: "photoUrl", label: "Beneficiary Photo", labelAr: "صورة المستفيد", type: "image" },
    { key: "buildingPhotoUrl", label: "Building Photo", labelAr: "صورة المبنى الخارجية", type: "image" },
    { key: "researcherOpinion", label: "Researcher Opinion", labelAr: "رأي الباحث" },
    { key: "dependentsOpinion", label: "Researcher Opinion on Dependents", labelAr: "رأي الباحث في التابعين" },
    { key: "createdAt", label: "Created At", labelAr: "تاريخ الإنشاء" },

    // Relational Fields (Odoo Row Expansion)
    { key: "dependents.name", label: "Dependent/Name", labelAr: "اسم/التابع" },
    { key: "dependents.relationship", label: "Dependent/Relationship", labelAr: "صلة القرابة/التابع", options: DEPENDENT_RELATIONSHIP_OPTIONS.map((o) => ({ value: o.value, label: o.labelEn, labelAr: o.label })) },
    { key: "dependents.birthDate", label: "Dependent/Birth Date", labelAr: "تاريخ ميلاد/التابع" },
    { key: "dependents.educationLevel", label: "Dependent/Education Level", labelAr: "المستوى التعليمي/التابع", options: EDUCATION_OPTIONS.map((o) => ({ value: o.value, label: o.labelEn, labelAr: o.label })) },
    { key: "dependents.healthStatus", label: "Dependent/Health Status", labelAr: "الحالة الصحية/التابع", options: HEALTH_OPTIONS.map((o) => ({ value: o.value, label: o.labelEn, labelAr: o.label })) },
    { key: "dependents.socialStatus", label: "Dependent/Social Status", labelAr: "الحالة الاجتماعية/التابع", options: SOCIAL_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.labelEn, labelAr: o.label })) },
    { key: "dependents.workStatus", label: "Dependent/Work Status", labelAr: "الحالة العملية/التابع", options: WORK_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.labelEn, labelAr: o.label })) },

    // Income & Bills
    { key: "salaryIncome", label: "Salary Income", labelAr: "راتب وظيفي/تقاعدي" },
    { key: "socialSecurity", label: "Social Security", labelAr: "الضمان الاجتماعي" },
    { key: "citizenAccount", label: "Citizen Account", labelAr: "حساب المواطن" },
    { key: "comprehensiveRehab", label: "Comprehensive Rehab", labelAr: "التأهيل الشامل" },
    { key: "otherAssocSupport", label: "Other Association Support", labelAr: "دعم جمعيات أخرى" },
    { key: "livestockCount", label: "Livestock Count", labelAr: "مواشي (العدد)" },
    { key: "incomeAssets", label: "Income Assets", labelAr: "الأصول المدرة" },
    { key: "otherAssetTotal", label: "Other Asset Total", labelAr: "إجمالي دخل الأصول" },
    { key: "otherAssetDesc", label: "Other Asset Desc", labelAr: "وصف الأصل الآخر" },
    { key: "totalIncome", label: "Total Income", labelAr: "إجمالي الدخل" },
    { key: "rentAmount", label: "Rent", labelAr: "إيجار المنزل" },
    { key: "electricityBill", label: "Electricity", labelAr: "فاتورة الكهرباء" },
    { key: "waterBill", label: "Water", labelAr: "فاتورة الماء" },
    { key: "internetBill", label: "Internet", labelAr: "فاتورة الإنترنت" },
    { key: "phoneBill", label: "Phone", labelAr: "فاتورة الهاتف" },
    { key: "gasBill", label: "Gas", labelAr: "فاتورة الغاز" },
    { key: "serviceBills", label: "Service Bills", labelAr: "فواتير الخدمات" },
    { key: "medicalExpenses", label: "Medical", labelAr: "مصاريف طبية" },
    { key: "transportExpenses", label: "Transport", labelAr: "مواصلات" },
    { key: "foodExpenses", label: "Food", labelAr: "مصاريف الأكل" },
    { key: "debtMonthly", label: "Monthly Debt", labelAr: "القسط الشهري" },
    { key: "debtReason", label: "Debt Reason", labelAr: "سبب الدين" },
    { key: "debtPeriod", label: "Debt Period", labelAr: "فترة السداد" },
    { key: "totalExpenses", label: "Total Expenses", labelAr: "إجمالي المصروفات" },
    { key: "netIncome", label: "Net Income", labelAr: "صافي الدخل" },
    { key: "financialOpinion", label: "Financial Opinion", labelAr: "رأي الباحث في الوضع المالي" },

    // Housing & Environment
    { key: "environmentType", label: "Environment Type", labelAr: "نوع البيئة", options: environmentOptions.map((o) => ({ value: o.value, label: o.labelEn, labelAr: o.label })) },
    { key: "housingType", label: "Housing Type", labelAr: "نوع السكن", options: housingTypeOptions.map((o) => ({ value: o.value, label: o.labelEn, labelAr: o.label })) },
    { key: "housingTenure", label: "Housing Tenure", labelAr: "حيازة السكن", options: housingTenureOptions.map((o) => ({ value: o.value, label: o.labelEn, labelAr: o.label })) },
    { key: "housingOpinion", label: "Housing Opinion", labelAr: "رأي الباحث في البيئة المحيطة" },

    // Needs & Packages
    ...NEEDS_EXPORT_FIELDS,
    { key: "needsOpinion", label: "Needs Opinion", labelAr: "رأي الباحث في الاحتياجات" },

    // Donation Packages Relational Fields
    { key: "donationPackages.program", label: "Donation Package Program", labelAr: "برنامج باقة التبرع" },
    { key: "donationPackages.cost", label: "Donation Package Cost", labelAr: "تكلفة باقة التبرع" },

    { key: "finalRecommendation", label: "Final Recommendation", labelAr: "التوصية النهائية" },
    { key: "caseClassification", label: "Case Classification", labelAr: "تصنيف الحالة", options: caseClassificationOptions.map((o) => ({ value: o.value, label: o.labelEn, labelAr: o.label })) },
  ];

  const resetForm = useCallback(() => {
    setAssociationId("");
    setFullName("");
    setNationalId("");
    setBirthDate("");
    setMaritalStatus("");
    setEducationLevel("");
    setHealthStatus("");
    setDiseaseType("");
    setDisabilityType("");
    setPhone("");
    setAlternatePhone("");
    setTotalFamilyMembers(null);
    setAddress("");
    setPhoto(null);
    setAddressProof(null);
    setResearcherOpinion("");
    setDependentsOpinion("");
    setDependents([]);
    setSalaryIncome(null);
    setSocialSecurity(null);
    setCitizenAccount(null);
    setComprehensiveRehab(null);
    setOtherAssocSupport(null);
    setLivestockCount(null);
    setOtherAssetTotal(null);
    setOtherAssetDesc("");
    setIncomeAssets([]);
    setTotalIncome(null);
    setRentAmount(null);
    setElectricityBill(null);
    setWaterBill(null);
    setInternetBill(null);
    setPhoneBill(null);
    setGasBill(null);
    setServiceBills([]);
    setMedicalExpenses(null);
    setTransportExpenses(null);
    setFoodExpenses(null);
    setDebtMonthly(null);
    setDebtReason("");
    setDebtPeriod("");
    setDebtAttachment(null);
    setTotalExpenses(null);
    setNetIncome(null);
    setFinancialOpinion("");
    setEnvironmentType("");
    setHousingType("");
    setHousingTenure("");
    setHousingOpinion("");
    setNeeds({});
    setNeedsOpinion("");
    setDonationPackages([]);
    setFinalRecommendation("");
    setCaseClassification("");
    setBuildingPhoto(null);
    setLivingRoomPhotos([]);
    setKitchenPhotos([]);
    setCeilingPhotos([]);
    setFieldErrors({});
  }, []);

  useEffect(() => {
    if (!recordId && !isNew) return;
    setFieldErrors({});
    if (isNew) {
      resetForm();
      return;
    }
    setLoading(true);
    fetch(`/api/beneficiaries/${recordId}`)
      .then((r) => r.json())
      .then((data) => {
        setLoading(false);
        if (data.error) return;
        setViewRecord(data);
        setAssociationId(data.associationId ? String(data.associationId) : "");
        setFullName(data.fullName || "");
        setNationalId(data.nationalId || "");
        setBirthDate(data.birthDate || "");
        setMaritalStatus(data.maritalStatus || "");
        setEducationLevel(data.educationLevel || "");
        setHealthStatus(data.healthStatus || "");
        setDiseaseType(data.diseaseType || "");
        setDisabilityType(data.disabilityType || "");
        setPhone(data.phone || "");
        setAlternatePhone(data.alternatePhone || "");
        setTotalFamilyMembers(data.totalFamilyMembers || null);
        setAddress(data.address || "");
        setPhoto(data.photo || null);
        setAddressProof(data.addressProof || null);
        setResearcherOpinion(data.researcherOpinion || "");
        setDependentsOpinion(data.dependentsOpinion || "");
        setDependents(data.dependents?.map((d: any) => ({
          id: d.id,
          name: d.name,
          relationship: d.relationship,
          birthDate: d.birthDate,
          educationLevel: d.educationLevel,
          healthStatus: d.healthStatus,
          socialStatus: d.socialStatus,
          workStatus: d.workStatus,
        })) || []);
        setSalaryIncome(data.salaryIncome ?? null);
        setSocialSecurity(data.socialSecurity ?? null);
        setCitizenAccount(data.citizenAccount ?? null);
        setComprehensiveRehab(data.comprehensiveRehab ?? null);
        setOtherAssocSupport(data.otherAssocSupport ?? null);
        setLivestockCount(data.livestockCount ?? null);
        setOtherAssetTotal(data.otherAssetTotal ?? null);
        setOtherAssetDesc(data.otherAssetDesc ?? "");
        setIncomeAssets(data.incomeAssets?.map((a: any) => a.incomeAssetId.toString()) ?? []);
        setTotalIncome(data.totalIncome ?? null);
        setRentAmount(data.rentAmount ?? null);
        setElectricityBill(data.electricityBill ?? null);
        setWaterBill(data.waterBill ?? null);
        setInternetBill(data.internetBill ?? null);
        setPhoneBill(data.phoneBill ?? null);
        setGasBill(data.gasBill ?? null);
        setServiceBills(data.serviceBills?.map((a: any) => a.serviceBillId.toString()) ?? []);
        setMedicalExpenses(data.medicalExpenses ?? null);
        setTransportExpenses(data.transportExpenses ?? null);
        setFoodExpenses(data.foodExpenses ?? null);
        setDebtMonthly(data.debtMonthly ?? null);
        setDebtReason(data.debtReason ?? "");
        setDebtPeriod(data.debtPeriod ?? "");
        setDebtAttachment(data.debtAttachment || null);
        setTotalExpenses(data.totalExpenses ?? null);
        setNetIncome(data.netIncome ?? null);
        setFinancialOpinion(data.financialOpinion ?? "");
        setEnvironmentType(data.environmentType ?? "");
        setHousingType(data.housingType ?? "");
        setHousingTenure(data.housingTenure ?? "");
        setHousingOpinion(data.housingOpinion ?? "");
        setNeeds(data.needs ?? {});
        setNeedsOpinion(data.needsOpinion ?? "");
        setDonationPackages(data.donationPackages?.map((d: any) => ({ program: d.program, cost: d.cost })) ?? []);
        setFinalRecommendation(data.finalRecommendation ?? "");
        setCaseClassification(data.caseClassification ?? "");
        setBuildingPhoto(data.buildingPhoto || null);
        const fps: GalleryImage[] = (data.fieldPhotos ?? []).map((fp: any) => ({
          id: fp.id,
          attachmentId: fp.attachmentId,
          attachment: fp.attachment,
          photoType: fp.photoType,
          sortOrder: fp.sortOrder ?? 0,
        }));
        setLivingRoomPhotos(fps.filter((fp) => fp.photoType === "living_room"));
        setKitchenPhotos(fps.filter((fp) => fp.photoType === "kitchen"));
        setCeilingPhotos(fps.filter((fp) => fp.photoType === "ceiling"));
      })
      .catch(() => { setLoading(false); showToast(isAr ? "خطأ في تحميل البيانات" : "Error loading data", "error"); });
  }, [recordId, isNew, resetForm]);

  // Auto-calculate financial totals
  useEffect(() => {
    const inc = (salaryIncome ?? 0) + (socialSecurity ?? 0) + (citizenAccount ?? 0)
      + (comprehensiveRehab ?? 0) + (otherAssocSupport ?? 0) + (otherAssetTotal ?? 0);
    setTotalIncome(inc || null);
    const exp = (rentAmount ?? 0) + (electricityBill ?? 0) + (waterBill ?? 0) + (internetBill ?? 0)
      + (phoneBill ?? 0) + (gasBill ?? 0)
      + (medicalExpenses ?? 0) + (transportExpenses ?? 0) + (foodExpenses ?? 0) + (debtMonthly ?? 0);
    setTotalExpenses(exp || null);
    setNetIncome(inc - exp || null);
  }, [salaryIncome, socialSecurity, citizenAccount, comprehensiveRehab, otherAssocSupport,
    otherAssetTotal, rentAmount, electricityBill, waterBill, internetBill, phoneBill, gasBill,
    medicalExpenses, transportExpenses, foodExpenses, debtMonthly]);

  const handleSave = async () => {
    const payload = {
      associationId: associationId ? Number(associationId) : undefined,
      fullName,
      nationalId,
      birthDate,
      maritalStatus,
      educationLevel,
      healthStatus,
      diseaseType: healthStatus === "sick" ? diseaseType : null,
      disabilityType: healthStatus === "disabled" ? disabilityType : null,
      phone,
      alternatePhone: alternatePhone || null,
      totalFamilyMembers,
      address,
      photoId: photo?.id ?? null,
      addressProofId: addressProof?.id ?? null,
      researcherOpinion: researcherOpinion || null,
      dependentsOpinion: dependentsOpinion || null,
      dependents: dependents.map((d) => ({
        name: d.name,
        relationship: d.relationship,
        birthDate: d.birthDate || null,
        educationLevel: d.educationLevel,
        healthStatus: d.healthStatus,
        socialStatus: d.socialStatus,
        workStatus: d.workStatus,
      })),
      salaryIncome,
      socialSecurity,
      citizenAccount,
      comprehensiveRehab,
      otherAssocSupport,
      livestockCount,
      otherAssetTotal,
      otherAssetDesc: otherAssetDesc || null,
      incomeAssets: incomeAssets.length > 0 ? incomeAssets : null,
      totalIncome,
      rentAmount,
      electricityBill,
      waterBill,
      internetBill,
      phoneBill,
      gasBill,
      serviceBills: serviceBills.length > 0 ? serviceBills : null,
      medicalExpenses,
      transportExpenses,
      foodExpenses,
      debtMonthly,
      debtReason: debtReason || null,
      debtPeriod: debtPeriod || null,
      debtAttachmentId: debtAttachment?.id ?? null,
      totalExpenses,
      netIncome,
      financialOpinion: financialOpinion || null,
      environmentType: environmentType || null,
      housingType: housingType || null,
      housingTenure: housingTenure || null,
      housingOpinion: housingOpinion || null,
      needs,
      needsOpinion: needsOpinion || null,
      donationPackages: donationPackages.map((d) => ({ program: d.program, cost: d.cost })),
      finalRecommendation: finalRecommendation || null,
      caseClassification: caseClassification || null,
      buildingPhotoId: buildingPhoto?.id ?? null,
      fieldPhotos: [
        ...livingRoomPhotos.map((fp, i) => ({ ...fp, sortOrder: i })),
        ...kitchenPhotos.map((fp, i) => ({ ...fp, sortOrder: i })),
        ...ceilingPhotos.map((fp, i) => ({ ...fp, sortOrder: i })),
      ],
    };

    const getPageTitle = (fieldKey: string): string => {
      if (fieldKey.startsWith("dependents")) {
        return isAr ? "التابعين تحت الإعالة" : "Dependents Under Care";
      }
      if (fieldKey.startsWith("donationPackages")) {
        return isAr ? "باقات التبرع" : "Donation Packages";
      }
      if (fieldKey.startsWith("needs") || fieldKey === "needsOpinion") {
        return isAr ? "الاحتياجات" : "Needs";
      }
      if (
        [
          "salaryIncome", "socialSecurity", "citizenAccount", "comprehensiveRehab",
          "otherAssocSupport", "livestockCount", "otherAssetTotal", "otherAssetDesc",
          "incomeAssets", "rentAmount", "electricityBill", "waterBill", "internetBill",
          "phoneBill", "gasBill", "serviceBills", "medicalExpenses", "transportExpenses",
          "foodExpenses", "debtMonthly", "debtReason", "debtPeriod", "debtAttachmentId",
          "financialOpinion"
        ].includes(fieldKey)
      ) {
        return isAr ? "الوضع المالي" : "Financial Status";
      }
      if (
        [
          "environmentType", "housingType", "housingTenure", "housingOpinion",
          "buildingPhotoId", "fieldPhotos"
        ].includes(fieldKey)
      ) {
        return isAr ? "البيئة والسكن" : "Housing & Environment";
      }
      if (["finalRecommendation", "caseClassification"].includes(fieldKey)) {
        return isAr ? "الخلاصة والتوصية" : "Final Recommendation";
      }
      return isAr ? "البيانات الأساسية" : "Basic Data";
    };

    const beneficiarySchema = createBeneficiarySchema(tVal);
    const result = beneficiarySchema.safeParse(payload);
    if (!result.success) {
      const errors: Record<string, string> = {};
      let firstErrorMessage = "";

      for (const issue of result.error.issues) {
        const rootField = String(issue.path[0] || "");
        const pageTitle = getPageTitle(rootField);

        if (issue.path[0] === "dependents") {
          const idx = issue.path[1];
          const field = issue.path[2];
          const depLabel = isAr ? `التابع ${Number(idx) + 1}` : `Dependent ${Number(idx) + 1}`;
          const msg = `${depLabel}: ${issue.message}`;
          errors[`dependents.${String(idx)}.${String(field)}`] = msg;
          if (!firstErrorMessage) {
            firstErrorMessage = `${pageTitle}: ${msg}`;
          }
        } else if (issue.path[0] === "donationPackages") {
          const idx = issue.path[1];
          const field = issue.path[2];
          const msg = isAr ? `برنامج التبرع ${Number(idx) + 1}: ${issue.message}` : `Donation package ${Number(idx) + 1}: ${issue.message}`;
          errors[`donationPackages.${String(idx)}.${String(field)}`] = issue.message;
          if (!firstErrorMessage) {
            firstErrorMessage = `${pageTitle}: ${msg}`;
          }
        } else if (issue.path[0] === "needs") {
          const field = issue.path[1] as string;
          if (!errors[field]) {
            errors[field] = issue.message;
          }
          if (!firstErrorMessage) {
            firstErrorMessage = `${pageTitle}: ${issue.message}`;
          }
        } else {
          const field = issue.path[0] as string;
          if (!errors[field]) {
            errors[field] = issue.message;
          }
          if (!firstErrorMessage) {
            firstErrorMessage = `${pageTitle}: ${issue.message}`;
          }
        }
      }
      setFieldErrors(errors);

      if (firstErrorMessage) {
        showToast(firstErrorMessage, "error");
      } else {
        showToast(isAr ? "يرجى تصحيح الأخطاء" : "Please fix the errors", "error");
      }
      setTimeout(() => {
        const firstError = document.querySelector("[data-error]");
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      const url = recordId ? `/api/beneficiaries/${recordId}` : "/api/beneficiaries";
      const method = recordId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      showToast(isAr ? "تم الحفظ بنجاح" : "Saved successfully", "success");

      if (recordId) {
        setBeneficiaries((prev) =>
          prev.map((b) => (b.id === recordId ? { ...b, ...data } : b))
        );
        setViewRecord(data);
        router.replace(`${pathname}?id=${encodeId(recordId)}`, { scroll: false });
      } else {
        setBeneficiaries((prev) => [data, ...prev]);
        router.replace(`${pathname}?id=${encodeId(data.id)}`, { scroll: false });
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!recordId) return;
    setConfirmAction("single-delete");
  };

  const handleArchive = () => {
    setConfirmAction("single-archive");
  };

  const handleUnarchive = () => {
    setConfirmAction("single-unarchive");
  };

  const handleBulkAction = (action: "delete" | "archive" | "unarchive") => {
    if (action === "delete") {
      setConfirmAction("bulk-delete");
    } else if (action === "archive") {
      setConfirmAction("bulk-archive");
    } else {
      setConfirmAction("bulk-unarchive");
    }
  };

  const executeSingleDelete = async () => {
    setConfirmAction(null);
    if (!recordId) return;
    try {
      const res = await fetch(`/api/beneficiaries/${recordId}`, { method: "DELETE" });
      if (res.ok) {
        showToast(isAr ? "تم حذف المستفيد بنجاح" : "Beneficiary deleted successfully", "success");
        setBeneficiaries((prev) => prev.filter((b) => b.id !== recordId));
        navigateToList();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
    } catch (err: any) {
      showToast(err.message || "Delete failed", "error");
    }
  };

  const executeBulkDelete = async () => {
    setConfirmAction(null);
    let successCount = 0;
    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/beneficiaries/${id}`, { method: "DELETE" });
        if (res.ok) successCount++;
      } catch {}
    }
    setBeneficiaries((prev) => prev.filter((b) => !selectedIds.includes(b.id)));
    setSelectedIds([]);
    showToast(
      isAr
        ? `تم حذف ${successCount} مستفيد بنجاح.`
        : `Successfully deleted ${successCount} beneficiaries.`,
      "success"
    );
  };

  const executeSingleArchive = async () => {
    const targetId = viewRecord?.id;
    setConfirmAction(null);
    if (!targetId) return;

    try {
      const res = await fetch(`/api/beneficiaries/${encodeId(targetId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      });
      if (res.ok) {
        showToast(isAr ? "تم أرشفة المستفيد بنجاح" : "Beneficiary archived successfully", "success");
        setBeneficiaries((prev) =>
          prev.map((b) => (b.id === targetId ? { ...b, isArchived: true } : b))
        );
        setViewRecord((prev) => (prev ? { ...prev, isArchived: true } : null));
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to archive", "error");
      }
    } catch (err) {
      console.error("Archive beneficiary error:", err);
      showToast("Error archiving beneficiary", "error");
    }
  };

  const executeSingleUnarchive = async () => {
    const targetId = viewRecord?.id;
    setConfirmAction(null);
    if (!targetId) return;

    try {
      const res = await fetch(`/api/beneficiaries/${encodeId(targetId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: false }),
      });
      if (res.ok) {
        showToast(isAr ? "تم إلغاء أرشفة المستفيد بنجاح" : "Beneficiary unarchived successfully", "success");
        setBeneficiaries((prev) =>
          prev.map((b) => (b.id === targetId ? { ...b, isArchived: false } : b))
        );
        setViewRecord((prev) => (prev ? { ...prev, isArchived: false } : null));
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to unarchive", "error");
      }
    } catch (err) {
      console.error("Unarchive beneficiary error:", err);
      showToast("Error unarchiving beneficiary", "error");
    }
  };

  const executeBulkArchive = async () => {
    setConfirmAction(null);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/beneficiaries/${encodeId(id)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isArchived: true }),
          })
        )
      );
      showToast(isAr ? "تم أرشفة العناصر المحددة بنجاح" : "Archived selected items successfully", "success");
      setBeneficiaries((prev) =>
        prev.map((b) => (selectedIds.includes(b.id) ? { ...b, isArchived: true } : b))
      );
      setSelectedIds([]);
    } catch (err) {
      console.error("Bulk archive beneficiary error:", err);
      showToast("Error archiving beneficiaries", "error");
    }
  };

  const executeBulkUnarchive = async () => {
    setConfirmAction(null);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/beneficiaries/${encodeId(id)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isArchived: false }),
          })
        )
      );
      showToast(isAr ? "تم إلغاء أرشفة العناصر المحددة بنجاح" : "Unarchived selected items successfully", "success");
      setBeneficiaries((prev) =>
        prev.map((b) => (selectedIds.includes(b.id) ? { ...b, isArchived: false } : b))
      );
      setSelectedIds([]);
    } catch (err) {
      console.error("Bulk unarchive beneficiary error:", err);
      showToast("Error unarchiving beneficiaries", "error");
    }
  };

  const handleAddClick = () => router.push(`${pathname}?new=true`, { scroll: false });
  const handleEditClick = (id: number) => router.push(`${pathname}?id=${encodeId(id)}&edit=true`, { scroll: false });
  const handleRowClick = (id: number) => {
    if (!hasPermission(path, "view")) return;
    router.push(`${pathname}?id=${encodeId(id)}`, { scroll: false });
  };

  const navigateToList = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const navigatePrev = () => {
    if (hasPrev) {
      const prevId = beneficiaries[currentIndex - 1].id;
      router.replace(`${pathname}?id=${encodeId(prevId)}`, { scroll: false });
    }
  };

  const navigateNext = () => {
    if (hasNext) {
      const nextId = beneficiaries[currentIndex + 1].id;
      router.replace(`${pathname}?id=${encodeId(nextId)}`, { scroll: false });
    }
  };

  const handleCancel = () => {
    if (formMode === "edit" && viewRecord) {
      setFullName(viewRecord.fullName);
      setNationalId(viewRecord.nationalId);
      setBirthDate(viewRecord.birthDate);
      setMaritalStatus(viewRecord.maritalStatus);
      setEducationLevel(viewRecord.educationLevel);
      setHealthStatus(viewRecord.healthStatus);
      setDiseaseType(viewRecord.diseaseType || "");
      setDisabilityType(viewRecord.disabilityType || "");
      setPhone(viewRecord.phone);
      setAlternatePhone(viewRecord.alternatePhone || "");
      setTotalFamilyMembers(viewRecord.totalFamilyMembers);
      setAddress(viewRecord.address);
      setPhoto(viewRecord.photo || null);
      setAddressProof(viewRecord.addressProof || null);
      setResearcherOpinion(viewRecord.researcherOpinion || "");
      setDependentsOpinion((viewRecord as any).dependentsOpinion || "");
      setDependents((viewRecord as any).dependents?.map((d: any) => ({
        id: d.id,
        name: d.name,
        relationship: d.relationship,
        birthDate: d.birthDate,
        educationLevel: d.educationLevel,
        healthStatus: d.healthStatus,
        socialStatus: d.socialStatus,
        workStatus: d.workStatus,
      })) || []);
      router.replace(`${pathname}?id=${recordId}`, { scroll: false });
    } else {
      navigateToList();
    }
  };

  const openAddDependent = () => {
    // Validate existing dependents before adding a new one
    if (dependents.length > 0) {
      const emptyIndex = dependents.findIndex(
        (d) => !d.name || !d.relationship || !d.educationLevel || !d.healthStatus || !d.socialStatus || !d.workStatus
      );
      if (emptyIndex !== -1) {
        const target = dependents[emptyIndex];
        const errs: Record<string, string> = {};
        if (!target.name) errs[`dependents.${emptyIndex}.name`] = isAr ? "الرجاء إضافة اسم التابع" : "Name is required";
        if (!target.relationship) errs[`dependents.${emptyIndex}.relationship`] = isAr ? "الرجاء إختيار صلة القرابة" : "Relationship is required";
        if (!target.educationLevel) errs[`dependents.${emptyIndex}.educationLevel`] = isAr ? "الرجاء إختيار المستوى التعليمي" : "Education level is required";
        if (!target.healthStatus) errs[`dependents.${emptyIndex}.healthStatus`] = isAr ? "الرجاء إختيار الحالة الصحية" : "Health status is required";
        if (!target.socialStatus) errs[`dependents.${emptyIndex}.socialStatus`] = isAr ? "الرجاء إختيار الحالة الاجتماعية" : "Social status is required";
        if (!target.workStatus) errs[`dependents.${emptyIndex}.workStatus`] = isAr ? "الرجاء إختيار الحالة العملية" : "Work status is required";
        setFieldErrors((prev) => ({ ...prev, ...errs }));
        const depTabTitle = isAr ? "التابعين تحت الإعالة" : "Dependents Under Care";
        showToast(
          isAr
            ? `${depTabTitle}: يرجى إكمال بيانات التابع الحالي أولاً`
            : `${depTabTitle}: Please complete the current dependent first`,
          "error"
        );
        return;
      }
    }
    setDependents((prev) => [
      { name: "", relationship: "", birthDate: "", educationLevel: "", healthStatus: "", socialStatus: "", workStatus: "" },
      ...prev,
    ]);
  };

  const updateDependentField = (idx: number, field: keyof DependentFormData, value: any) => {
    setDependents((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d))
    );
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[`dependents.${idx}.${field}`];
      return copy;
    });
  };

  const removeDependent = (idx: number) => {
    setDependents((prev) => prev.filter((_, i) => i !== idx));
    setFieldErrors((prev) => {
      const copy = { ...prev };
      Object.keys(copy).forEach((key) => {
        if (key.startsWith("dependents.")) {
          const parts = key.split(".");
          const errIdx = parseInt(parts[1], 10);
          if (errIdx === idx) {
            delete copy[key];
          } else if (errIdx > idx) {
            const field = parts[2];
            copy[`dependents.${errIdx - 1}.${field}`] = copy[key];
            delete copy[key];
          }
        }
      });
      return copy;
    });
  };

  const addDonationPackage = () => {
    if (!isViewOnly) {
      if (donationPackages.length > 0) {
        const last = donationPackages[donationPackages.length - 1];
        const errs: Record<string, string> = {};
        if (!last.program.trim()) errs[`donationPackages.${donationPackages.length - 1}.program`] = isAr ? "الرجاء إضافة اسم البرنامج" : "Program name is required";
        if (last.cost === null || last.cost === undefined) errs[`donationPackages.${donationPackages.length - 1}.cost`] = isAr ? "الرجاء إضافة التكلفة" : "Cost is required";
        if (Object.keys(errs).length > 0) {
          setFieldErrors((prev) => ({ ...prev, ...errs }));
          const pkgTabTitle = isAr ? "باقات التبرع" : "Donation Packages";
          showToast(
            isAr
              ? `${pkgTabTitle}: يرجى إكمال بيانات البرنامج الحالي أولاً`
              : `${pkgTabTitle}: Please complete the current program first`,
            "error"
          );
          return;
        }
      }
      setDonationPackages((prev) => [...prev, { program: "", cost: null }]);
    }
  };

  const updateDonationPackage = (idx: number, field: "program" | "cost", value: any) => {
    setDonationPackages((prev) => prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d)));
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[`donationPackages.${idx}.${field}`];
      return copy;
    });
  };

  const removeDonationPackage = (idx: number) => {
    setDonationPackages((prev) => prev.filter((_, i) => i !== idx));
    setFieldErrors((prev) => {
      const copy = { ...prev };
      Object.keys(copy).forEach((key) => {
        if (key.startsWith("donationPackages.")) {
          const parts = key.split(".");
          const errIdx = parseInt(parts[1], 10);
          if (errIdx === idx) {
            delete copy[key];
          } else if (errIdx > idx) {
            const field = parts[2];
            copy[`donationPackages.${errIdx - 1}.${field}`] = copy[key];
            delete copy[key];
          }
        }
      });
      return copy;
    });
  };

  const [archivedLoaded, setArchivedLoaded] = useState(false);
  const [fetchingArchived, setFetchingArchived] = useState(false);

  const fetchArchivedBeneficiaries = useCallback(async () => {
    if (archivedLoaded || fetchingArchived) return;
    setFetchingArchived(true);
    try {
      const res = await fetch("/api/beneficiaries?archived=true");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setBeneficiaries((prev) => {
            const existingIds = new Set(prev.map((b) => b.id));
            const newArchived = data.filter((b: any) => !existingIds.has(b.id));
            return [...prev, ...newArchived];
          });
        }
        setArchivedLoaded(true);
      }
    } catch (err) {
      console.error("Error fetching archived beneficiaries:", err);
    } finally {
      setFetchingArchived(false);
    }
  }, [archivedLoaded, fetchingArchived]);

  const filterPresets: FilterPreset[] = [
    {
      id: "top-priority",
      label: isAr ? "أولوية قصوى" : "Top Priority",
      filterFunc: (item: any) => {
        const val = item.caseClassification || "";
        return val === "top-priority" || val.includes("قصوى") || val.includes("حرجة") || (item.totalIncome !== null && item.totalIncome !== undefined && item.totalIncome < 2000);
      },
    },
    {
      id: "medium-priority",
      label: isAr ? "أولوية متوسطة" : "Moderate Priority",
      filterFunc: (item: any) => {
        const val = item.caseClassification || "";
        return val === "medium-priority" || val.includes("متوسط") || (item.totalIncome !== null && item.totalIncome !== undefined && item.totalIncome >= 2000 && item.totalIncome < 4000);
      },
    },
    {
      id: "not-eligible",
      label: isAr ? "غير مستحقة" : "Not Eligible",
      filterFunc: (item: any) => {
        const val = item.caseClassification || "";
        return val === "not-eligible" || val.includes("غير") || (item.totalIncome !== null && item.totalIncome !== undefined && item.totalIncome >= 4000);
      },
    },
    {
      id: "archived-items",
      label: isAr ? "عرض المؤرشفين" : "Archived Items",
      filterFunc: (item: any) => {
        if (!archivedLoaded && !fetchingArchived) {
          fetchArchivedBeneficiaries();
        }
        return !!item.isArchived;
      },
    },
    {
      id: "this-month",
      label: tCommon("addedThisMonth"),
      filterFunc: (item: BeneficiaryListItem) => {
        const now = new Date();
        const created = new Date(item.createdAt);
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear() && !(item as any).isArchived;
      },
    },
  ];

  const groupByOptions: GroupByOption[] = [
    {
      id: "association",
      label: isAr ? "الجمعية" : "Association",
      groupByFunc: (item: BeneficiaryListItem) => {
        return item.association?.name || (isAr ? "بدون جمعية" : "Unassigned");
      },
    },
    {
      id: "case-classification",
      label: isAr ? "تصنيف الأولوية" : "Priority Classification",
      groupByFunc: (item: BeneficiaryListItem) => {
        const val = item.caseClassification || "";
        const inc = item.totalIncome;
        if (val === "top-priority" || val.includes("قصوى") || val.includes("حرجة") || (inc !== null && inc !== undefined && inc < 2000)) {
          return isAr ? "أولوية قصوى" : "Top Priority";
        }
        if (val === "medium-priority" || val.includes("متوسط") || (inc !== null && inc !== undefined && inc >= 2000 && inc < 4000)) {
          return isAr ? "أولوية متوسطة" : "Moderate Priority";
        }
        if (val === "not-eligible" || val.includes("غير") || (inc !== null && inc !== undefined && inc >= 4000)) {
          return isAr ? "غير مستحقة" : "Not Eligible";
        }
        return isAr ? "غير محدد" : "Unspecified";
      },
    },
    {
      id: "education-level",
      label: isAr ? "المستوى التعليمي" : "Educational Level",
      groupByFunc: (item: BeneficiaryListItem) => {
        const val = item.educationLevel || "";
        const opt = EDUCATION_OPTIONS.find((o) => o.value === val || o.label === val || o.labelEn === val);
        return opt ? (isAr ? opt.label : opt.labelEn) : (val || (isAr ? "غير محدد" : "Unspecified"));
      },
    },
    {
      id: "creation-month",
      label: tCommon("creationDate"),
      groupByFunc: (item: BeneficiaryListItem) => {
        const d = new Date(item.createdAt);
        return d.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "long" });
      },
    },
  ];

  const healthLabel = (v: string) => {
    const opt = HEALTH_OPTIONS.find((o) => o.value === v);
    return opt ? (isAr ? opt.label : opt.labelEn) : v;
  };

  const maritalLabel = (v: string) => {
    const opt = MARITAL_OPTIONS.find((o) => o.value === v);
    return opt ? (isAr ? opt.label : opt.labelEn) : v;
  };

  const educationLabel = (v?: string | null) => {
    if (!v) return isAr ? "غير محدد" : "Unspecified";
    const opt = EDUCATION_OPTIONS.find((o) => o.value === v || o.label === v || o.labelEn === v);
    return opt ? (isAr ? opt.label : opt.labelEn) : v;
  };

  const cellPad = "p-3 sm:p-4";

  const getPhotoUrl = (ben: BeneficiaryListItem) => {
    if (ben.photoUrl) return ben.photoUrl;
    if ((ben as any).photo?.url) return (ben as any).photo.url;
    if ((ben as any).photoId) return `/api/attachments/${(ben as any).photoId}/file`;
    return null;
  };

  const renderKanbanCard = (item: BeneficiaryListItem) => {
    const canView = hasPermission(path, "view");
    const isSelected = selectedIds.includes(item.id);
    const photoUrl = getPhotoUrl(item);
    return (
      <div
        onClick={() => canView && handleRowClick(item.id)}
        className={`bg-white dark:bg-[#1E293B]/80 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all duration-200 ${
          canView
            ? "hover:shadow-lg hover:border-primary/30 dark:hover:border-tertiary/30 cursor-pointer"
            : ""
        } ${isSelected ? "ring-2 ring-primary dark:ring-tertiary shadow-md" : ""}`}
      >
        <div className="grid grid-cols-4 h-30">
          {/* Avatar / Profile picture */}
          <div className="col-span-1 h-full overflow-hidden">
            {photoUrl ? (
              <img src={photoUrl} alt={item.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-300 dark:text-slate-600">
                <User size={28} />
              </div>
            )}
          </div>

          {/* Content right */}
          <div className="col-span-3 py-3 px-3 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 gap-2 pb-2">
              {/* Name */}
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                {item.fullName}
              </h3>

              {/* Health status badge */}
              <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                item.healthStatus === "healthy"
                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                  : item.healthStatus === "sick"
                  ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400"
                  : "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400"
              }`}>
                {healthLabel(item.healthStatus)}
              </span>
            </div>

            {/* Meta info */}
            <div className="flex justify-between pt-2 items-center text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Building size={12} className="shrink-0 text-slate-400 dark:text-slate-500" />
                  <span className="truncate">{maritalLabel(item.maritalStatus)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Phone size={12} className="shrink-0 text-slate-400 dark:text-slate-500" />
                  <span>{item.phone}</span>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-medium">{item.nationalId}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-semibold">
                  {isAr ? `${item.dependentCount} تابعين` : `${item.dependentCount} deps`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRow = (ben: BeneficiaryListItem) => {
    const photoUrl = getPhotoUrl(ben);
    const cls = (ben.caseClassification || "").trim();
    const inc = ben.totalIncome;

    let priorityBadge = { label: isAr ? "غير محدد" : "Unspecified", cls: "bg-slate-100 dark:bg-slate-800 text-slate-500" };
    if (cls === "top-priority" || cls.includes("قصوى") || cls.includes("حرجة") || (inc !== null && inc !== undefined && inc < 2000)) {
      priorityBadge = { label: isAr ? "أولوية قصوى" : "Top Priority", cls: "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40" };
    } else if (cls === "medium-priority" || cls.includes("متوسط") || (inc !== null && inc !== undefined && inc >= 2000 && inc < 4000)) {
      priorityBadge = { label: isAr ? "أولوية متوسطة" : "Moderate Priority", cls: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/40" };
    } else if (cls === "not-eligible" || cls.includes("غير") || (inc !== null && inc !== undefined && inc >= 4000)) {
      priorityBadge = { label: isAr ? "غير مستحقة" : "Not Eligible", cls: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40" };
    }

    return (
      <tr
        key={ben.id}
        onClick={() => handleRowClick(ben.id)}
        className={`text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-[#1E293B]/20 transition-colors cursor-pointer ${
          selectedIds.includes(ben.id) ? "bg-primary/5 dark:bg-tertiary/5" : ""
        }`}
      >
        <td className={cellPad} onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={selectedIds.includes(ben.id)}
            onChange={(e) => handleSelectRow(ben.id, e.target.checked)}
            className="w-4 h-4 rounded text-primary accent-primary cursor-pointer" />
        </td>
        <td className={`${cellPad} font-medium text-slate-900 dark:text-white`}>
          <div className="flex items-center gap-2.5">
            {photoUrl ? (
              <img src={photoUrl} alt={ben.fullName} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                <User size={16} />
              </div>
            )}
            <span className="font-bold">{ben.fullName}</span>
          </div>
        </td>
        <td className={`${cellPad}`}>
          {ben.association?.name ? (
            <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200/80 dark:border-slate-700/60">
              <Building size={13} className="text-primary dark:text-tertiary shrink-0" />
              {ben.association.name}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 text-xs italic">{isAr ? "بدون جمعية" : "Unassigned"}</span>
          )}
        </td>
        <td className={`${cellPad}`}>{ben.nationalId}</td>
        <td className={`${cellPad}`}>{ben.phone}</td>
        <td className={cellPad}>{maritalLabel(ben.maritalStatus)}</td>
        <td className={`${cellPad} hidden lg:table-cell`}>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            ben.healthStatus === "healthy"
              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
              : ben.healthStatus === "sick"
              ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400"
              : "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400"
          }`}>
            {healthLabel(ben.healthStatus)}
          </span>
        </td>
        <td className={`${cellPad} hidden md:table-cell`}>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {educationLabel(ben.educationLevel)}
          </span>
        </td>
        <td className={`${cellPad}`}>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${priorityBadge.cls}`}>
            {priorityBadge.label}
          </span>
        </td>
        <td className={`${cellPad} text-center font-semibold`}>{ben.dependentCount}</td>
        <td className={`${cellPad} text-center`} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={async () => {
              try {
                const res = await fetch(`/api/beneficiaries/${ben.id}`);
                if (res.ok) {
                  const fullData = await res.json();
                  setViewRecord(fullData);
                } else {
                  setViewRecord(ben as any);
                }
              } catch {
                setViewRecord(ben as any);
              }
              setMarketingKitModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary/10 text-primary dark:text-tertiary rounded-xl hover:bg-primary hover:text-white dark:hover:bg-tertiary dark:hover:text-slate-900 transition-all cursor-pointer shadow-sm"
            title={isAr ? "اصدار الحقيبة التسويقية" : "Generate Marketing Kit"}
          >
            <Megaphone size={14} />
            <span>{isAr ? "الحقيبة التسويقية" : "Marketing Kit"}</span>
          </button>
        </td>
      </tr>
    );
  };

  const handleSelectAll = (items: BeneficiaryListItem[]) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIds(e.target.checked ? items.map((b) => b.id) : []);
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    setSelectedIds((prev) => checked ? [...prev, id] : prev.filter((item) => item !== id));
  };

  const renderTableHeader = (
    visibleItems: BeneficiaryListItem[],
    sortInfo?: { sortColumn: string | null; sortDirection: "asc" | "desc"; onSort: (field: string) => void }
  ) => (
    <thead>
      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1E293B]/50 text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs font-semibold uppercase">
        <th className={`${cellPad} text-start w-12`}>
          <input type="checkbox"
            checked={selectedIds.length === visibleItems.length && visibleItems.length > 0}
            onChange={handleSelectAll(visibleItems)}
            className="w-4 h-4 rounded text-primary accent-primary cursor-pointer" />
        </th>
        <SortableHeader {...sortInfo as any} field="fullName" className={`${cellPad} text-start font-bold`}>
          {isAr ? "الاسم" : "Name"}
        </SortableHeader>
        <SortableHeader {...sortInfo as any} field="association" className={`${cellPad} text-start font-bold`}>
          {isAr ? "الجمعية" : "Association"}
        </SortableHeader>
        <SortableHeader {...sortInfo as any} field="nationalId" className={`${cellPad} text-start font-bold`}>
          {isAr ? "رقم الهوية" : "National ID"}
        </SortableHeader>
        <SortableHeader {...sortInfo as any} field="phone" className={`${cellPad} text-start font-bold`}>
          {isAr ? "الجوال" : "Phone"}
        </SortableHeader>
        <SortableHeader {...sortInfo as any} field="maritalStatus" className={`${cellPad} text-start font-bold`}>
          {isAr ? "الحالة الاجتماعية" : "Marital Status"}
        </SortableHeader>
        <SortableHeader {...sortInfo as any} field="healthStatus" className={`${cellPad} text-start font-bold hidden lg:table-cell`}>
          {isAr ? "الحالة الصحية" : "Health"}
        </SortableHeader>
        <SortableHeader {...sortInfo as any} field="educationLevel" className={`${cellPad} text-start font-bold hidden md:table-cell`}>
          {isAr ? "المستوى التعليمي" : "Education"}
        </SortableHeader>
        <SortableHeader {...sortInfo as any} field="caseClassification" className={`${cellPad} text-start font-bold`}>
          {isAr ? "الأولوية" : "Priority"}
        </SortableHeader>
        <th className={`${cellPad} text-center font-bold`}>{isAr ? "التابعين" : "Deps"}</th>
        <th className={`${cellPad} text-center font-bold`}>{isAr ? "الحقيبة التسويقية" : "Marketing Kit"}</th>
      </tr>
    </thead>
  );

  // Helper for required label with red asterisk
  const reqLabel = (text: string) => (
    <>{text} <span className="text-red-500">*</span></>
  );

  // Form view
  if (recordId || isNew) {
    const inputBase = "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-tertiary transition-colors";
    const inputDisabled = "w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 cursor-default transition-colors";
    const inputCls = (field: string) =>
      fieldErrors[field]
        ? inputBase.replace("border-slate-200 dark:border-slate-800", "border-red-500 dark:border-red-400")
        : inputBase;
    const inputDisabledCls = (field: string) =>
      fieldErrors[field]
        ? inputDisabled.replace("border-slate-200 dark:border-slate-800", "border-red-500 dark:border-red-400")
        : inputDisabled;
    const labelCls = "block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5";
    const errCls = "mt-1 text-xs text-red-500 font-medium flex items-center gap-1";

    const ErrMsg = ({ field }: { field: string }) =>
      fieldErrors[field] ? (
        <p className={errCls} data-error>
          <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
          {fieldErrors[field]}
        </p>
      ) : null;

    return (
      <>
        <FormViews
          mode={formMode}
          screenName={isAr ? "المستفيدين" : "Beneficiaries"}
          recordName={
            formMode === "create"
              ? (isAr ? "مستفيد جديد" : "New Beneficiary")
              : viewRecord?.fullName
          }
          onSave={formMode !== "view" ? handleSave : undefined}
          onCancel={handleCancel}
          onAdd={hasPermission(path, "create") ? () => router.push(`${pathname}?new=true`, { scroll: false }) : undefined}
          onEdit={hasPermission(path, "edit") && formMode === "view" ? () => router.push(`${pathname}?id=${encodeId(recordId)}&edit=true`, { scroll: false }) : undefined}
          onDelete={handleDelete}
          onArchive={handleArchive}
          onUnarchive={handleUnarchive}
          isArchived={viewRecord?.isArchived}
          onClose={navigateToList}
          onNavigatePrev={navigatePrev}
          onNavigateNext={navigateNext}
          hasPrev={hasPrev}
          hasNext={hasNext}
          recordIndex={currentIndex + 1}
          totalRecords={beneficiaries.length}
          submitting={submitting}
          hasCreatePermission={hasPermission(path, "create")}
          hasEditPermission={hasPermission(path, "edit")}
          hasDeletePermission={hasPermission(path, "delete")}
          hasArchivePermission={hasPermission(path, "archive")}
          locale={locale}
          extraActions={[
            ...(formMode === "view" && recordId && hasPermission(path, "create") ? [{
              label: "Import",
              labelAr: "استيراد",
              icon: <Upload size={14} className="text-amber-500" />,
              onClick: () => router.push(`/${locale}/portal/import/beneficiaries`),
            }] : []),
            ...(formMode === "view" && recordId && hasPermission(path, "export") ? [{
              label: "Export",
              labelAr: "تصدير",
              icon: <Download size={14} className="text-violet-500" />,
              onClick: () => setExportModalOpen(true),
            }] : []),
          ]}
          ribbon={viewRecord?.isArchived ? { title: isAr ? "مؤرشف" : "Archived", color: "danger", locale } :
            caseClassification === "top-priority" ? { title: isAr ? "أولوية قصوى" : "Top Priority", color: "success", locale } :
            caseClassification === "medium-priority" ? { title: isAr ? "أولوية متوسطة" : "Moderate Priority", color: "warning", locale } :
            caseClassification === "not-eligible" ? { title: isAr ? "غير مستحقة" : "Not Eligible", color: "danger", locale } :
            undefined}
        >
          <div ref={formRef} className="space-y-6">
            {loading && !isNew ? (
              <div className="animate-pulse space-y-6">
                <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                  <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i}>
                        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                        <div className="h-[38px] bg-slate-200 dark:bg-slate-700 rounded-lg" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                  <div className="flex gap-2 mb-4">
                    <div className="h-8 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                    <div className="h-8 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                    <div className="h-8 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-7 w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />
                    <div className="h-7 w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />
                    <div className="h-7 w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />
                  </div>
                </div>
                <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
              </div>
            ) : (
            <>
            {/* Basic Data Section */}
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <Building size={16} className="text-primary" />
                {isAr ? "البيانات الأساسية لرب الأسرة" : "Head of Family - Basic Data"}
              </h3>

              <div className="mb-4">
                <label className={labelCls}>{isAr ? "صورة المستفيد" : "Beneficiary Photo"}</label>
                <AttachmentField
                  value={photo}
                  onChange={(file) => setPhoto(file)}
                  accept="image/*"
                  readonly={isViewOnly}
                  locale={locale}
                  imageOnly
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>{reqLabel(isAr ? "الاسم الرباعي" : "Full Name")}</label>
                  <input type="text" required value={fullName} onChange={(e) => { setFullName(e.target.value); setFieldErrors((prev) => ({ ...prev, fullName: "" })); }}
                    className={isViewOnly ? inputDisabledCls("fullName") : inputCls("fullName")} placeholder={isAr ? "الاسم الرباعي" : "Full name"} />
                  <ErrMsg field="fullName" />
                </div>

                <div>
                  <label className={labelCls}>{reqLabel(isAr ? "الجمعية" : "Association")}</label>
                  <Select
                    value={associationId}
                    onChange={(v) => { setAssociationId(String(v)); setFieldErrors((prev) => ({ ...prev, associationId: "" })); }}
                    disabled={isViewOnly}
                    error={!!fieldErrors.associationId}
                    options={associationsList}
                    placeholder={isAr ? "اختر الجمعية" : "Select Association"}
                  />
                  <ErrMsg field="associationId" />
                </div>

                <div>
                  <label className={labelCls}>{reqLabel(isAr ? "رقم الهوية / الإقامة" : "National ID / Residency")}</label>
                  <input type="text" required value={nationalId} onChange={(e) => { setNationalId(e.target.value); setFieldErrors((prev) => ({ ...prev, nationalId: "" })); }}
                    className={isViewOnly ? inputDisabledCls("nationalId") : inputCls("nationalId")} placeholder={isAr ? "رقم الهوية / الإقامة" : "National ID / Residency"} />
                  <ErrMsg field="nationalId" />
                </div>

                <div>
                  <DatePicker
                    label={isAr ? "تاريخ الميلاد" : "Birth Date"}
                    value={birthDate}
                    onChange={(val) => { setBirthDate(val); setFieldErrors((prev) => ({ ...prev, birthDate: "" })); }}
                    locale={locale}
                    disabled={isViewOnly}
                    error={fieldErrors.birthDate}
                    required
                    minDate="1900-01-01"
                    maxDate={new Date().toISOString().slice(0, 10)}
                  />
                </div>

                <div>
                  <label className={labelCls}>{isAr ? "العمر" : "Age"}</label>
                  <input
                    type="text"
                    readOnly
                    value={birthDate ? `${calculateAge(birthDate)} ${isAr ? "سنة" : "yrs old"}` : (isAr ? "يرجى تحديد تاريخ الميلاد" : "Select birth date")}
                    className={inputDisabledCls("age")}
                  />
                </div>

                <div>
                  <label className={labelCls}>{reqLabel(isAr ? "الحالة الاجتماعية" : "Marital Status")}</label>
                  <Select value={maritalStatus} onChange={(v) => { setMaritalStatus(String(v)); setFieldErrors((prev) => ({ ...prev, maritalStatus: "" })); }} disabled={isViewOnly}
                    error={!!fieldErrors.maritalStatus}
                    options={maritalOptions.map((o) => ({ value: o.value, label: isAr ? o.label : o.labelEn }))}
                    placeholder={isAr ? "اختر الحالة..." : "Select..."} />
                  <ErrMsg field="maritalStatus" />
                </div>

                <div>
                  <label className={labelCls}>{reqLabel(isAr ? "المستوى التعليمي" : "Education Level")}</label>
                  <Select value={educationLevel} onChange={(v) => { setEducationLevel(String(v)); setFieldErrors((prev) => ({ ...prev, educationLevel: "" })); }} disabled={isViewOnly}
                    error={!!fieldErrors.educationLevel}
                    options={educationOptions.map((o) => ({ value: o.value, label: isAr ? o.label : o.labelEn }))}
                    placeholder={isAr ? "اختر المستوى ..." : "Select..."} />
                  <ErrMsg field="educationLevel" />
                </div>

                <div>
                  <label className={labelCls}>{reqLabel(isAr ? "الحالة الصحية" : "Health Status")}</label>
                  <Select value={healthStatus} onChange={(v) => { setHealthStatus(String(v)); setFieldErrors((prev) => ({ ...prev, healthStatus: "" })); }} disabled={isViewOnly}
                    error={!!fieldErrors.healthStatus}
                    options={healthOptions.map((o) => ({ value: o.value, label: isAr ? o.label : o.labelEn }))}
                    placeholder={isAr ? "اختر الحالة..." : "Select..."} />
                  <ErrMsg field="healthStatus" />
                </div>

                {healthStatus === "sick" && (
                  <div>
                    <label className={labelCls}>{isAr ? "نوع المرض" : "Disease Type"}</label>
                    <input value={diseaseType} onChange={(e) => setDiseaseType(e.target.value)}
                      className={isViewOnly ? inputDisabled : inputBase} placeholder={isAr ? "حدد نوع المرض" : "Specify disease"} />
                  </div>
                )}

                {healthStatus === "disabled" && (
                  <div>
                    <label className={labelCls}>{isAr ? "نوع الإعاقة" : "Disability Type"}</label>
                    <input value={disabilityType} onChange={(e) => setDisabilityType(e.target.value)}
                      className={isViewOnly ? inputDisabled : inputBase} placeholder={isAr ? "حدد نوع الإعاقة" : "Specify disability"} />
                  </div>
                )}

                <div>
                  <label className={labelCls}>{reqLabel(isAr ? "رقم الجوال" : "Mobile Number")}</label>
                  <input type="tel" required value={phone} onChange={(e) => { setPhone(e.target.value); setFieldErrors((prev) => ({ ...prev, phone: "" })); }}
                    className={isViewOnly ? inputDisabledCls("phone") : inputCls("phone")} placeholder="5********" />
                  <ErrMsg field="phone" />
                </div>

                <div>
                  <label className={labelCls}>{isAr ? "جوال بديل" : "Alternate Phone"}</label>
                  <input type="tel" value={alternatePhone} onChange={(e) => setAlternatePhone(e.target.value)}
                    className={isViewOnly ? inputDisabled : inputBase} placeholder="5********" />
                </div>

                <div>
                  <label className={labelCls}>{isAr ? "إجمالي عدد أفراد الأسرة" : "Total Family Members"}</label>
                  <input type="number" value={totalFamilyMembers ?? ""} onChange={(e) => setTotalFamilyMembers(e.target.value ? Number(e.target.value) : null)}
                    className={isViewOnly ? inputDisabled : inputBase} min={1} />
                </div>
                
                <div className={`${healthStatus === "sick" || healthStatus === "disabled" ? "md:col-span-2 lg:col-span-3" : "md:col-span-1 lg:col-span-1"}`}>
                  <label className={labelCls}>{reqLabel(isAr ? "العنوان الوطني (المدينة / الحي / الشارع)" : "National Address")}</label>
                  <input type="text" required value={address} onChange={(e) => { setAddress(e.target.value); setFieldErrors((prev) => ({ ...prev, address: "" })); }}
                    className={isViewOnly ? inputDisabledCls("address") : inputCls("address")} placeholder={isAr ? "المدينة، الحي، الشارع" : "City, district, street"} />
                  <ErrMsg field="address" />
                </div>
              </div>

              <div className="mt-4">
                <label className={labelCls}>{isAr ? "إثبات العنوان الوطني" : "Address Proof"}</label>
                <AttachmentField
                  value={addressProof}
                  onChange={(file) => setAddressProof(file)}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.webp,.svg"
                  readonly={isViewOnly}
                  locale={locale}
                />
              </div>

              <div className="mt-4">
                <label className={labelCls}>{isAr ? "رأي الباحث (حول البيانات الأساسية للأسرة)" : "Researcher Opinion"}</label>
                <textarea 
                  value={researcherOpinion} 
                  onChange={(e) => setResearcherOpinion(e.target.value)}
                  className={`${isViewOnly ? inputDisabled : inputBase} min-h-[80px]`} 
                  placeholder={isAr ? "اكتب رأي الباحث حول البيانات الأساسية للأسرة هنا..." : "Write researcher opinion on basics data of the family here..."}
                  rows={3} />
              </div>
            </div>

            {/* Odoo Pages (Notebook) Tabs */}
            <Notebook
              tabs={[
                {
                  id: "dependents",
                  title: isAr ? "التابعين تحت الإعالة" : "Dependents Under Care",
                  content: (
                    <div className="space-y-4">
                      {/* Add button (only shown when not view only) */}
                      {!isViewOnly && (
                        <div className="flex justify-start">
                          <button
                            type="button"
                            onClick={openAddDependent}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary dark:bg-tertiary text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                          >
                            <Plus size={14} />
                            <span>{isAr ? "إضافة تابع" : "Add Dependent"}</span>
                          </button>
                        </div>
                      )}

                      {/* Dependents Table */}
                      <div className="w-full overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/30">
                        <table className="w-full min-w-[900px] border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1E293B]/50 text-slate-500 dark:text-slate-400 font-semibold">
                              <th className="p-3 text-start">{isAr ? "الاسم" : "Name"}</th>
                              <th className="p-3 text-start">{isAr ? "صلة القرابة" : "Relationship"}</th>
                              <th className="p-3 text-start">{isAr ? "تاريخ الميلاد" : "Birth Date"}</th>
                              <th className="p-3 text-start">{isAr ? "المستوى التعليمي" : "Education"}</th>
                              <th className="p-3 text-start">{isAr ? "الحالة الصحية" : "Health"}</th>
                              <th className="p-3 text-start">{isAr ? "الحالة الاجتماعية" : "Social Status"}</th>
                              <th className="p-3 text-start">{isAr ? "الحالة العملية" : "Work Status"}</th>
                              <th className="p-3 text-center w-16"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {dependents.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="p-6 text-center text-slate-400">
                                  {isAr ? "لا يوجد تابعين مضافين" : "No dependents added yet"}
                                </td>
                              </tr>
                            ) : (
                              dependents.map((dep, idx) => {
                                const hasNameError = !!fieldErrors[`dependents.${idx}.name`];
                                const nameErrorMsg = fieldErrors[`dependents.${idx}.name`];

                                return (
                                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-[#1E293B]/20 transition-colors">
                                    {/* Name Column */}
                                      <td className="p-3 min-w-[160px]">
                                        {isViewOnly ? (
                                          <span className="font-medium text-slate-900 dark:text-white px-2 py-1.5 block">{dep.name || "-"}</span>
                                        ) : (
                                          <div>
                                            <input
                                              type="text"
                                              required
                                              value={dep.name}
                                              onChange={(e) => updateDependentField(idx, "name", e.target.value)}
                                              placeholder={isAr ? "اسم التابع" : "Name"}
                                              className={`w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 transition-colors ${
                                                hasNameError
                                                  ? "border-red-500 dark:border-red-400 ring-1 ring-red-500/20 focus:ring-red-500"
                                                  : "border-slate-200 dark:border-slate-800 focus:ring-primary dark:focus:ring-tertiary"
                                              }`}
                                            />
                                            {hasNameError && (
                                              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                                <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                                                {nameErrorMsg}
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </td>

                                    {/* Relationship Column */}
                                    <td className="p-3 min-w-[150px]">
                                      {isViewOnly ? (
                                        <span className="text-slate-700 dark:text-slate-300 px-2 py-1.5 block">
                                          {isAr
                                            ? DEPENDENT_RELATIONSHIP_OPTIONS.find((o) => o.value === dep.relationship)?.label
                                            : DEPENDENT_RELATIONSHIP_OPTIONS.find((o) => o.value === dep.relationship)?.labelEn || "-"}
                                        </span>
                                      ) : (
                                        <div>
                                          <Select
                                            value={dep.relationship}
                                            onChange={(val) => updateDependentField(idx, "relationship", String(val))}
                                            options={DEPENDENT_RELATIONSHIP_OPTIONS.map((o) => ({
                                              value: o.value,
                                              label: isAr ? o.label : o.labelEn,
                                            }))}
                                            error={!!fieldErrors[`dependents.${idx}.relationship`]}
                                            placeholder={isAr ? "صلة القرابة" : "Relationship"}
                                          />
                                          {!!fieldErrors[`dependents.${idx}.relationship`] && (
                                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                              <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                                              {fieldErrors[`dependents.${idx}.relationship`]}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                    
                                    {/* Birth Date Column */}
                                    <td className="p-3 min-w-[170px]">
                                      {isViewOnly ? (
                                        <span className="text-slate-600 dark:text-slate-400 px-2 py-1.5 block">{dep.birthDate || "-"}</span>
                                      ) : (
                                        <DatePicker
                                          value={dep.birthDate || ""}
                                          onChange={(val) => updateDependentField(idx, "birthDate", val)}
                                          locale={locale}
                                          minDate="1900-01-01"
                                          maxDate={new Date().toISOString().slice(0, 10)}
                                          error={fieldErrors[`dependents.${idx}.birthDate`]}
                                        />
                                      )}
                                    </td>

                                    {/* Education Level Column */}
                                    <td className="p-3 min-w-[150px]">
                                      {isViewOnly ? (
                                        <span className="text-slate-700 dark:text-slate-300 px-2 py-1.5 block">
                                          {isAr
                                            ? EDUCATION_OPTIONS.find((o) => o.value === dep.educationLevel)?.label
                                            : EDUCATION_OPTIONS.find((o) => o.value === dep.educationLevel)?.labelEn || "-"}
                                        </span>
                                      ) : (
                                        <div>
                                          <Select
                                            value={dep.educationLevel}
                                            onChange={(val) => updateDependentField(idx, "educationLevel", String(val))}
                                            options={EDUCATION_OPTIONS.map((o) => ({
                                              value: o.value,
                                              label: isAr ? o.label : o.labelEn,
                                            }))}
                                            error={!!fieldErrors[`dependents.${idx}.educationLevel`]}
                                            placeholder={isAr ? "المستوى" : "Education"}
                                          />
                                          {!!fieldErrors[`dependents.${idx}.educationLevel`] && (
                                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                              <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                                              {fieldErrors[`dependents.${idx}.educationLevel`]}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </td>

                                    {/* Health Status Column */}
                                    <td className="p-3 min-w-[140px]">
                                      {isViewOnly ? (
                                        <span className="text-slate-700 dark:text-slate-300 px-2 py-1.5 block">
                                          {isAr
                                            ? HEALTH_OPTIONS.find((o) => o.value === dep.healthStatus)?.label
                                            : HEALTH_OPTIONS.find((o) => o.value === dep.healthStatus)?.labelEn || "-"}
                                        </span>
                                      ) : (
                                        <div>
                                          <Select
                                            value={dep.healthStatus}
                                            onChange={(val) => updateDependentField(idx, "healthStatus", String(val))}
                                            options={HEALTH_OPTIONS.map((o) => ({
                                              value: o.value,
                                              label: isAr ? o.label : o.labelEn,
                                            }))}
                                            error={!!fieldErrors[`dependents.${idx}.healthStatus`]}
                                            placeholder={isAr ? "الحالة الصحية" : "Health"}
                                          />
                                          {!!fieldErrors[`dependents.${idx}.healthStatus`] && (
                                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                              <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                                              {fieldErrors[`dependents.${idx}.healthStatus`]}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </td>

                                    {/* Social Status Column */}
                                    <td className="p-3 min-w-[140px]">
                                      {isViewOnly ? (
                                        <span className="text-slate-700 dark:text-slate-300 px-2 py-1.5 block">
                                          {isAr
                                            ? SOCIAL_STATUS_OPTIONS.find((o) => o.value === dep.socialStatus)?.label
                                            : SOCIAL_STATUS_OPTIONS.find((o) => o.value === dep.socialStatus)?.labelEn || "-"}
                                        </span>
                                      ) : (
                                        <div>
                                          <Select
                                            value={dep.socialStatus}
                                            onChange={(val) => updateDependentField(idx, "socialStatus", String(val))}
                                            options={SOCIAL_STATUS_OPTIONS.map((o) => ({
                                              value: o.value,
                                              label: isAr ? o.label : o.labelEn,
                                            }))}
                                            error={!!fieldErrors[`dependents.${idx}.socialStatus`]}
                                            placeholder={isAr ? "الحالة الاجتماعية" : "Social Status"}
                                          />
                                          {!!fieldErrors[`dependents.${idx}.socialStatus`] && (
                                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                              <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                                              {fieldErrors[`dependents.${idx}.socialStatus`]}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </td>

                                    {/* Work Status Column */}
                                    <td className="p-3 min-w-[140px]">
                                      {isViewOnly ? (
                                        <span className="text-slate-700 dark:text-slate-300 px-2 py-1.5 block">
                                          {isAr
                                            ? WORK_STATUS_OPTIONS.find((o) => o.value === dep.workStatus)?.label
                                            : WORK_STATUS_OPTIONS.find((o) => o.value === dep.workStatus)?.labelEn || "-"}
                                        </span>
                                      ) : (
                                        <div>
                                          <Select
                                            value={dep.workStatus}
                                            onChange={(val) => updateDependentField(idx, "workStatus", String(val))}
                                            options={WORK_STATUS_OPTIONS.map((o) => ({
                                              value: o.value,
                                              label: isAr ? o.label : o.labelEn,
                                            }))}
                                            error={!!fieldErrors[`dependents.${idx}.workStatus`]}
                                            placeholder={isAr ? "الوضع الوظيفي" : "Work Status"}
                                          />
                                          {!!fieldErrors[`dependents.${idx}.workStatus`] && (
                                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                              <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                                              {fieldErrors[`dependents.${idx}.workStatus`]}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </td>

                                    {/* Actions Column */}
                                    <td className="p-3 text-center w-20">
                                      {!isViewOnly && (
                                        <button
                                          type="button"
                                          onClick={() => removeDependent(idx)}
                                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer transition-colors"
                                          title={isAr ? "حذف" : "Remove"}
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Researcher Opinion (Single block under the table) */}
                      <div className="mt-6 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          {isAr ? "رأي الباحث (حول التابعين وتأثيرهم على حالة الأسرة)" : "Researcher Opinion on Dependents"}
                        </label>
                        <textarea
                          value={dependentsOpinion}
                          onChange={(e) => setDependentsOpinion(e.target.value)}
                          disabled={isViewOnly}
                          className={`${isViewOnly ? inputDisabled : inputBase} min-h-[80px] w-full`}
                          rows={3}
                          placeholder={isAr ? "اكتب رأي الباحث في التابعين هنا..." : "Write researcher opinion on dependents here..."}
                        />
                      </div>
                    </div>
                  )
                },
                {
                  id: "financial",
                  title: isAr ? "الوضع المالي" : "Financial Status",
                  content: (
                    <div className="space-y-6">
                      {/* Income Sources */}
                      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                          {isAr ? "مصادر الدخل" : "Income Sources"}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <CurrencyField disabled={isViewOnly} label={isAr ? "راتب وظيفي/تقاعدي" : "Salary/Pension"} value={salaryIncome} onChange={setSalaryIncome} />
                          <CurrencyField disabled={isViewOnly} label={isAr ? "الضمان الاجتماعي" : "Social Security"} value={socialSecurity} onChange={setSocialSecurity} />
                          <CurrencyField disabled={isViewOnly} label={isAr ? "حساب المواطن" : "Citizen Account"} value={citizenAccount} onChange={setCitizenAccount} />
                          <CurrencyField disabled={isViewOnly} label={isAr ? "التأهيل الشامل" : "Comprehensive Rehab"} value={comprehensiveRehab} onChange={setComprehensiveRehab} />
                          <CurrencyField disabled={isViewOnly} label={isAr ? "دعم جمعيات أخرى" : "Other Assoc. Support"} value={otherAssocSupport} onChange={setOtherAssocSupport} />
                          <Many2ManyTags
                            label={isAr ? "مصادر دخل أخرى (أصول/ممتلكات مدرة)" : "Other Income Assets"}
                            options={incomeAssetOptions}
                            value={incomeAssets}
                            onChange={(ids) => {
                              const removed = incomeAssets.filter((id) => !ids.includes(id));
                              if (removed.includes("1")) setLivestockCount(null);
                              if (removed.includes("4")) setOtherAssetDesc("");
                              if (ids.length === 0) setOtherAssetTotal(null);
                              setIncomeAssets(ids);
                            }}
                            disabled={isViewOnly}
                            placeholder={isAr ? "اختر مصادر دخل..." : "Select sources of income ..."}
                          />
                          {incomeAssets.includes("1") && (
                            <div>
                              <CurrencyField disabled={isViewOnly} label={isAr ? "عدد المواشي" : "Livestock Count"} value={livestockCount} onChange={(v) => { setLivestockCount(v); setFieldErrors((prev) => ({ ...prev, livestockCount: "" })); }} error={!!fieldErrors["livestockCount"]} />
                              <ErrMsg field="livestockCount" />
                            </div>
                          )}
                          {incomeAssets.includes("4") && (
                            <div>
                              <label className={labelCls}>{reqLabel(isAr ? "وصف الأصل الآخر" : "Other Asset Description")}</label>
                              <input type="text" value={otherAssetDesc} onChange={(e) => { setOtherAssetDesc(e.target.value); setFieldErrors((prev) => ({ ...prev, otherAssetDesc: "" })); }} disabled={isViewOnly}
                                className={isViewOnly ? inputDisabledCls("otherAssetDesc") : inputCls("otherAssetDesc")} placeholder={isAr ? "وصف ..." : "Description..."} />
                              <ErrMsg field="otherAssetDesc" />
                            </div>
                          )}
                          {(incomeAssets.includes("1") || incomeAssets.includes("2") || incomeAssets.includes("3") || incomeAssets.includes("4")) && (
                            <CurrencyField disabled={isViewOnly} label={isAr ? "إجمالي دخل هذه الأصول" : "Total Asset Income"} value={otherAssetTotal} onChange={setOtherAssetTotal} />
                          )}
                        </div>
                        <div className="mt-4 p-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                              {isAr ? "إجمالي الدخل" : "Total Income"}
                            </span>
                            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-300">
                              {totalIncome != null ? <span className="inline-flex items-center gap-1">{totalIncome.toLocaleString()} <SaudiRiyalIcon size={16} /></span> : "-"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expenses */}
                      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-5 bg-rose-500 rounded-full" />
                          {isAr ? "الالتزامات والمصروفات" : "Expenses & Liabilities"}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <CurrencyField disabled={isViewOnly} label={isAr ? "إيجار المنزل (الشهري)" : "Rent (Monthly)"} value={rentAmount} onChange={setRentAmount} />
                          <Many2ManyTags
                            label={isAr ? "فواتير الخدمات" : "Service Bills"}
                            options={serviceBillOptions}
                            value={serviceBills}
                            onChange={(ids) => {
                              const removed = serviceBills.filter((id) => !ids.includes(id));
                              if (removed.includes("1")) setElectricityBill(null);
                              if (removed.includes("2")) setWaterBill(null);
                              if (removed.includes("3")) setInternetBill(null);
                              if (removed.includes("4")) setPhoneBill(null);
                              if (removed.includes("5")) setGasBill(null);
                              setServiceBills(ids);
                            }}
                            disabled={isViewOnly}
                            placeholder={isAr ? "اختر فواتير الخدمات..." : "Select service bills ..."}
                          />
                          {serviceBills.includes("1") && (
                            <div>
                              <CurrencyField disabled={isViewOnly} label={isAr ? "فاتورة الكهرباء" : "Electricity"} value={electricityBill}
                                onChange={(v) => { setElectricityBill(v); setFieldErrors((prev) => ({ ...prev, electricityBill: "" })); }}
                                error={!!fieldErrors["electricityBill"]} />
                              <ErrMsg field="electricityBill" />
                            </div>
                          )}
                          {serviceBills.includes("2") && (
                            <div>
                              <CurrencyField disabled={isViewOnly} label={isAr ? "فاتورة الماء" : "Water"} value={waterBill}
                                onChange={(v) => { setWaterBill(v); setFieldErrors((prev) => ({ ...prev, waterBill: "" })); }}
                                error={!!fieldErrors["waterBill"]} />
                              <ErrMsg field="waterBill" />
                            </div>
                          )}
                          {serviceBills.includes("3") && (
                            <div>
                              <CurrencyField disabled={isViewOnly} label={isAr ? "فاتورة الإنترنت" : "Internet"} value={internetBill}
                                onChange={(v) => { setInternetBill(v); setFieldErrors((prev) => ({ ...prev, internetBill: "" })); }}
                                error={!!fieldErrors["internetBill"]} />
                              <ErrMsg field="internetBill" />
                            </div>
                          )}
                          {serviceBills.includes("4") && (
                            <div>
                              <CurrencyField disabled={isViewOnly} label={isAr ? "فاتورة الهاتف" : "Phone"} value={phoneBill}
                                onChange={(v) => { setPhoneBill(v); setFieldErrors((prev) => ({ ...prev, phoneBill: "" })); }}
                                error={!!fieldErrors["phoneBill"]} />
                              <ErrMsg field="phoneBill" />
                            </div>
                          )}
                          {serviceBills.includes("5") && (
                            <div>
                              <CurrencyField disabled={isViewOnly} label={isAr ? "فاتورة الغاز" : "Gas"} value={gasBill}
                                onChange={(v) => { setGasBill(v); setFieldErrors((prev) => ({ ...prev, gasBill: "" })); }}
                                error={!!fieldErrors["gasBill"]} />
                              <ErrMsg field="gasBill" />
                            </div>
                          )}
                          <CurrencyField disabled={isViewOnly} label={isAr ? "مصاريف طبية" : "Medical"} value={medicalExpenses} onChange={setMedicalExpenses} />
                          <CurrencyField disabled={isViewOnly} label={isAr ? "مواصلات ونقل" : "Transport"} value={transportExpenses} onChange={setTransportExpenses} />
                          <CurrencyField disabled={isViewOnly} label={isAr ? "مصاريف الأكل والشرب" : "Food"} value={foodExpenses} onChange={setFoodExpenses} />
                          <CurrencyField disabled={isViewOnly} label={isAr ? "القسط الشهري (ديون)" : "Monthly Debt"} value={debtMonthly} onChange={(v) => { setDebtMonthly(v); setFieldErrors((prev) => ({ ...prev, debtMonthly: "", debtReason: "", debtPeriod: "", debtAttachmentId: "" })); }} />
                        </div>
                        {debtMonthly != null && debtMonthly > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 p-4 bg-amber-50/30 dark:bg-amber-950/5 border border-amber-200 dark:border-amber-900/20 rounded-lg">
                            <div>
                              <label className={labelCls}>{reqLabel(isAr ? "سبب الدين" : "Debt Reason")}</label>
                              <input type="text" value={debtReason} onChange={(e) => { setDebtReason(e.target.value); setFieldErrors((prev) => ({ ...prev, debtReason: "" })); }} disabled={isViewOnly}
                                className={isViewOnly ? inputDisabledCls("debtReason") : inputCls("debtReason")} placeholder={isAr ? "سبب الدين..." : "Debt reason..."} />
                              {!!fieldErrors["debtReason"] && <ErrMsg field="debtReason" />}
                            </div>
                            <div>
                              <label className={labelCls}>{reqLabel(isAr ? "فترة السداد" : "Debt Period")}</label>
                              <input type="text" value={debtPeriod} onChange={(e) => { setDebtPeriod(e.target.value); setFieldErrors((prev) => ({ ...prev, debtPeriod: "" })); }} disabled={isViewOnly}
                                className={isViewOnly ? inputDisabledCls("debtPeriod") : inputCls("debtPeriod")} placeholder={isAr ? "مثلاً: 24 شهر" : "e.g. 24 months"} />
                              {!!fieldErrors["debtPeriod"] && <ErrMsg field="debtPeriod" />}
                            </div>
                            <div>
                              <label className={labelCls}>{reqLabel(isAr ? "إثبات القسط" : "Debt Proof")}</label>
                              <AttachmentField
                                value={debtAttachment}
                                onChange={(file) => { setDebtAttachment(file); setFieldErrors((prev) => ({ ...prev, debtAttachmentId: "" })); }}
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                                readonly={isViewOnly}
                                locale={locale}
                              />
                              {!!fieldErrors["debtAttachmentId"] && <ErrMsg field="debtAttachmentId" />}
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="p-3 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/30 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-rose-700 dark:text-rose-400">
                                {isAr ? "إجمالي المصروفات" : "Total Expenses"}
                              </span>
                              <span className="text-lg font-bold text-rose-600 dark:text-rose-300">
                                {totalExpenses != null ? <span className="inline-flex items-center gap-1">{totalExpenses.toLocaleString()} <SaudiRiyalIcon size={16} /></span> : "-"}
                              </span>
                            </div>
                          </div>
                          <div className={`p-3 rounded-lg border ${netIncome != null && netIncome >= 0 ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/30" : "bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/30"}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {isAr ? "صافي الدخل" : "Net Income"}
                              </span>
                              <span className={`text-lg font-bold ${netIncome != null && netIncome >= 0 ? "text-emerald-600 dark:text-emerald-300" : "text-amber-600 dark:text-amber-300"}`}>
                                {netIncome != null ? <span className="inline-flex items-center gap-1">{netIncome.toLocaleString()} <SaudiRiyalIcon size={16} /></span> : "-"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Financial Opinion */}
                      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-5 bg-blue-500 rounded-full" />
                          {isAr ? "رأي الباحث في الوضع المالي" : "Researcher Financial Opinion"}
                        </h4>
                        <textarea
                          value={financialOpinion}
                          onChange={(e) => setFinancialOpinion(e.target.value)}
                          disabled={isViewOnly}
                          className={`${isViewOnly ? inputDisabled : inputBase} min-h-[80px] w-full`}
                          rows={3}
                          placeholder={isAr ? "اكتب رأي الباحث في الوضع المالي للأسرة..." : "Write researcher opinion on financial status..."}
                        />
                      </div>
                    </div>
                  )
                },
                {
                  id: "housing",
                  title: isAr ? "البيئة والسكن" : "Housing & Environment",
                  content: (
                    <div className="space-y-6">
                      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-5 bg-amber-500 rounded-full" />
                          {isAr ? "نوع البيئة والسكن" : "Environment & Housing Type"}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <Select value={environmentType} onChange={(v) => { setEnvironmentType(String(v)); setFieldErrors((prev) => ({ ...prev, environmentType: "" })); }} disabled={isViewOnly}
                            options={ENVIRONMENT_OPTIONS.map((o) => ({ value: o.value, label: isAr ? o.label : o.labelEn }))}
                            placeholder={isAr ? "اختر نوع البيئة..." : "Select environment type..."}
                            error={!!fieldErrors["environmentType"]}
                          />
                          <Select value={housingType} onChange={(v) => { setHousingType(String(v)); setFieldErrors((prev) => ({ ...prev, housingType: "" })); }} disabled={isViewOnly}
                            options={HOUSING_TYPE_OPTIONS.map((o) => ({ value: o.value, label: isAr ? o.label : o.labelEn }))}
                            placeholder={isAr ? "اختر نوع السكن..." : "Select housing type..."}
                            error={!!fieldErrors["housingType"]}
                          />
                          <Select value={housingTenure} onChange={(v) => { setHousingTenure(String(v)); setFieldErrors((prev) => ({ ...prev, housingTenure: "" })); }} disabled={isViewOnly}
                            options={HOUSING_TENURE_OPTIONS.map((o) => ({ value: o.value, label: isAr ? o.label : o.labelEn }))}
                            placeholder={isAr ? "اختر حيازة السكن..." : "Select housing tenure..."}
                            error={!!fieldErrors["housingTenure"]}
                          />
                        </div>
                      </div>
                      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-5 bg-blue-500 rounded-full" />
                          {isAr ? "رأي الباحث (في البيئة المحيطة، والملاءمة السكنية لعدد الأفراد)" : "Researcher (Environmental & Housing Suitability) Opinion"}
                        </h4>
                        <textarea
                          value={housingOpinion}
                          onChange={(e) => setHousingOpinion(e.target.value)}
                          disabled={isViewOnly}
                          className={`${isViewOnly ? inputDisabled : inputBase} min-h-[80px] w-full`}
                          rows={3}
                          placeholder={isAr ? "اكتب رأي الباحث في البيئة والسكن..." : "Write researcher opinion on housing..."}
                        />
                      </div>
                    </div>
                  )
                },
                {
                  id: "needs",
                  title: isAr ? "الاحتياجات" : "Needs",
                  content: (
                    <NeedsSection
                      needs={needs}
                      onChange={setNeeds}
                      isViewOnly={isViewOnly}
                      locale={locale}
                      fieldErrors={fieldErrors}
                      setFieldErrors={setFieldErrors}
                    />
                  )
                },
                {
                  id: "donation-packages",
                  title: isAr ? "باقات التبرع" : "Donation Packages",
                  content: (
                    <div className="space-y-6">
                      {/* Donation Packages */}
                      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4 mb-4">
                          <p className="text-xs font-medium text-amber-800 dark:text-amber-300 leading-relaxed">
                            {isAr ? "البرامج التي يمكن إدراج الأسرة تحتها لعرضها على المتبرعين:" : "Programs under which the family can be listed to show to donors:"}
                          </p>
                        </div>
                        {!isViewOnly && (
                          <div className="flex justify-start mb-4">
                            <button
                              type="button"
                              onClick={addDonationPackage}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary dark:bg-tertiary text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                            >
                              <Plus size={14} />
                              <span>{isAr ? "إضافة برنامج تبرع" : "Add Donation Program"}</span>
                            </button>
                          </div>
                        )}
                        <div className="w-full overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/30">
                          <table className="w-full min-w-[400px] border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1E293B]/50 text-slate-500 dark:text-slate-400 font-semibold">
                                <th className="p-3 text-start">{isAr ? "البرنامج" : "Program"}</th>
                                <th className="p-3 text-start">{isAr ? "التكلفة" : "Cost"}</th>
                                <th className="p-3 text-center w-16"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                              {donationPackages.length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="p-6 text-center text-slate-400">
                                    {isAr ? "لا يوجد برامج تبرع مضافة" : "No donation programs added yet"}
                                  </td>
                                </tr>
                              ) : (
                                donationPackages.map((pkg, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-[#1E293B]/20 transition-colors">
                                    <td className="p-3 min-w-[180px]">
                                      {isViewOnly ? (
                                        <span className="font-medium text-slate-900 dark:text-white px-2 py-1.5 block">{pkg.program || "-"}</span>
                                      ) : (
                                        <div>
                                          <input
                                            type="text"
                                            value={pkg.program}
                                            onChange={(e) => updateDonationPackage(idx, "program", e.target.value)}
                                            className={`w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 transition-colors ${
                                              fieldErrors[`donationPackages.${idx}.program`]
                                                ? "border-red-500 dark:border-red-400 ring-1 ring-red-500/20 focus:ring-red-500"
                                                : "border-slate-200 dark:border-slate-800 focus:ring-primary dark:focus:ring-tertiary"
                                            }`}
                                            placeholder={isAr ? "اسم البرنامج..." : "Program name..."}
                                          />
                                          <ErrMsg field={`donationPackages.${idx}.program`} />
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-3 min-w-[120px]">
                                      {isViewOnly ? (
                                        <span className="font-medium text-slate-900 dark:text-white px-2 py-1.5 block">{pkg.cost ?? "-"}</span>
                                      ) : (
                                        <div>
                                        <CurrencyField
                                          label=""
                                          value={pkg.cost}
                                          onChange={(v) => updateDonationPackage(idx, "cost", v)}
                                          error={!!fieldErrors[`donationPackages.${idx}.cost`]}
                                        />
                                        <ErrMsg field={`donationPackages.${idx}.cost`} />
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-3 text-center w-16">
                                      {!isViewOnly && (
                                        <button
                                          type="button"
                                          onClick={() => removeDonationPackage(idx)}
                                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer transition-colors"
                                          title={isAr ? "حذف" : "Delete"}
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
                    </div>
                  )
                },
                {
                  id: "field-attachments",
                  title: isAr ? "المرفقات والصور الميدانية" : "Field Attachments",
                  content: (
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-5 bg-amber-500 rounded-full" />
                          {isAr ? "الصور الميدانية" : "Field Photos"}
                        </h4>
                        <div className="space-y-6">
                          <AttachmentField
                            label={isAr ? "صورة خارجية للمبنى" : "External Building Photo"}
                            value={buildingPhoto}
                            onChange={(file) => { setBuildingPhoto(file); setFieldErrors((prev) => ({ ...prev, buildingPhotoId: "" })); }}
                            readonly={isViewOnly}
                            locale={locale}
                            imageOnly
                          />
                          <ImageGallery
                            label={isAr ? "صور المجالس" : "Living Room Photos"}
                            images={livingRoomPhotos}
                            onAdd={(att) => setLivingRoomPhotos((prev) => [...prev, { attachmentId: att.id, attachment: att, photoType: "living_room", sortOrder: prev.length }])}
                            onRemove={(idx) => setLivingRoomPhotos((prev) => prev.filter((_, i) => i !== idx))}
                            readonly={isViewOnly}
                            locale={locale}
                          />
                          <ImageGallery
                            label={isAr ? "صور المطبخ" : "Kitchen Photos"}
                            images={kitchenPhotos}
                            onAdd={(att) => setKitchenPhotos((prev) => [...prev, { attachmentId: att.id, attachment: att, photoType: "kitchen", sortOrder: prev.length }])}
                            onRemove={(idx) => setKitchenPhotos((prev) => prev.filter((_, i) => i !== idx))}
                            readonly={isViewOnly}
                            locale={locale}
                          />
                          <ImageGallery
                            label={isAr ? "صور الأسقف والترميم" : "Ceiling & Renovation Photos"}
                            images={ceilingPhotos}
                            onAdd={(att) => setCeilingPhotos((prev) => [...prev, { attachmentId: att.id, attachment: att, photoType: "ceiling", sortOrder: prev.length }])}
                            onRemove={(idx) => setCeilingPhotos((prev) => prev.filter((_, i) => i !== idx))}
                            readonly={isViewOnly}
                            locale={locale}
                          />
                        </div>
                      </div>
                    </div>
                  )
                },
                {
                  id: "recommendation",
                  title: isAr ? "الخلاصة والتوصية" : "Final Recommendation",
                  content: (
                    <div className="space-y-6">
                      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-5 bg-amber-500 rounded-full" />
                          {reqLabel(isAr ? "تصنيف الحالة" : "Case Classification")}
                        </h4>
                        <Select value={caseClassification} onChange={(v) => { setCaseClassification(String(v)); setFieldErrors((prev) => ({ ...prev, caseClassification: "" })); }} disabled={isViewOnly}
                          options={CASE_CLASSIFICATION_OPTIONS.map((o) => ({ value: o.value, label: isAr ? o.label : o.labelEn }))}
                          placeholder={isAr ? "اختر تصنيف الحالة..." : "Select case classification..."}
                          error={!!fieldErrors["caseClassification"]}
                        />
                        <ErrMsg field="caseClassification" />
                      </div>
                      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-5 bg-blue-500 rounded-full" />
                          {isAr ? "التوصية النهائية" : "Final Recommendation"}
                        </h4>
                        <textarea
                          value={finalRecommendation}
                          onChange={(e) => setFinalRecommendation(e.target.value)}
                          disabled={isViewOnly}
                          className={`${isViewOnly ? inputDisabled : inputBase} min-h-[120px] w-full`}
                          rows={5}
                          placeholder={isAr ? "اكتب التوصية النهائية للباحث الاجتماعي..." : "Write the final recommendation of the social researcher..."}
                        />
                      </div>
                    </div>
                  )
                },
              ]}
            />
          </>
        )}
      </div>
    </FormViews>

        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          tableName="beneficiaries"
          tableLabelAr="المستفيدين"
          availableFields={exportFields}
          selectedIds={recordId ? [recordId] : []}
          recordId={recordId || undefined}
          allRecords={beneficiaries}
          screenPath={path}
          locale={locale}
        />

        <ConfirmDialog
          isOpen={confirmAction !== null}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => {
            if (confirmAction === "single-delete") executeSingleDelete();
            else if (confirmAction === "bulk-delete") executeBulkDelete();
            else if (confirmAction === "single-archive") executeSingleArchive();
            else if (confirmAction === "bulk-archive") executeBulkArchive();
            else if (confirmAction === "single-unarchive") executeSingleUnarchive();
            else if (confirmAction === "bulk-unarchive") executeBulkUnarchive();
          }}
          title={
            confirmAction?.includes("delete")
              ? (isAr ? "حذف المستفيدين" : "Delete beneficiaries")
              : confirmAction?.includes("unarchive")
              ? (isAr ? "إلغاء أرشفة المستفيدين" : "Unarchive beneficiaries")
              : (isAr ? "أرشفة المستفيدين" : "Archive beneficiaries")
          }
          message={
            confirmAction === "bulk-delete"
              ? (isAr ? `هل أنت متأكد من حذف ${selectedIds.length} مستفيد؟` : `Are you sure you want to delete ${selectedIds.length} beneficiaries?`)
              : confirmAction === "bulk-archive"
              ? (isAr ? `هل أنت متأكد من أرشفة ${selectedIds.length} مستفيد؟` : `Are you sure you want to archive ${selectedIds.length} beneficiaries?`)
              : confirmAction === "bulk-unarchive"
              ? (isAr ? `هل أنت متأكد من إلغاء أرشفة ${selectedIds.length} مستفيد؟` : `Are you sure you want to unarchive ${selectedIds.length} beneficiaries?`)
              : confirmAction === "single-archive"
              ? (isAr ? `هل أنت متأكد من أرشفة "${viewRecord?.fullName || ""}"؟` : `Are you sure you want to archive "${viewRecord?.fullName || ""}"?`)
              : confirmAction === "single-unarchive"
              ? (isAr ? `هل أنت متأكد من إلغاء أرشفة "${viewRecord?.fullName || ""}"؟` : `Are you sure you want to unarchive "${viewRecord?.fullName || ""}"?`)
              : (isAr ? `هل أنت متأكد من حذف "${viewRecord?.fullName || ""}"؟` : `Are you sure you want to delete "${viewRecord?.fullName || ""}"?`)
          }
          confirmLabel={
            confirmAction?.includes("delete")
              ? tCommon("delete")
              : confirmAction?.includes("unarchive")
              ? tCommon("unarchive")
              : tCommon("archive")
          }
          cancelLabel={tCommon("cancel")}
        />
      </>
    );
  }

  // List view
  return (
    <>
      <SearchViews
        title={title}
        newButtonLabel={t("addNew")}
        onNewClick={handleAddClick}
        hasCreatePermission={hasPermission(path, "create")}
        bulkActionsNode={
          <BulkActionMenu
            selectedIds={selectedIds}
            onAction={handleBulkAction}
            showDelete={hasPermission(path, "delete")}
            showArchive={hasPermission(path, "archive")}
            hasAddAccess={hasPermission(path, "create")}
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
                onClick: () => router.push(`/${locale}/portal/import/beneficiaries`),
              }] : []),
              ...(hasPermission(path, "export") ? [{
                label: tCommon("export"),
                icon: <Download size={14} className="text-violet-500" />,
                onClick: () => setBulkExportOpen(true),
              }] : []),
            ]}
          />
        }
        items={beneficiaries}
        searchFields={["fullName", "nationalId", "phone"]}
        filterPresets={filterPresets}
        groupByOptions={groupByOptions}
        pageSize={40}
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
              emptyDescription={isAr ? "لم يتم إضافة أي مستفيد بعد" : "No beneficiaries added yet"}
            />
          ) : (
            <ListViews
              renderTableHeader={renderTableHeader}
              renderRow={renderRow}
              emptyTitle={isAr ? "لا يوجد مستفيدون" : "No beneficiaries"}
              emptyDescription={isAr ? "لم يتم إضافة أي مستفيد بعد" : "No beneficiaries added yet"}
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

      <ExportModal
        isOpen={bulkExportOpen}
        onClose={() => setBulkExportOpen(false)}
        tableName="beneficiaries"
        tableLabelAr="المستفيدين"
        availableFields={exportFields}
        selectedIds={selectedIds}
        allRecords={beneficiaries}
        screenPath={path}
        locale={locale}
      />

      <MarketingKitModal
        isOpen={marketingKitModalOpen}
        onClose={() => setMarketingKitModalOpen(false)}
        beneficiary={viewRecord}
        locale={locale}
      />

      <ConfirmDialog
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction === "single-delete") executeSingleDelete();
          else if (confirmAction === "bulk-delete") executeBulkDelete();
          else if (confirmAction === "single-archive") executeSingleArchive();
          else if (confirmAction === "bulk-archive") executeBulkArchive();
          else if (confirmAction === "single-unarchive") executeSingleUnarchive();
          else if (confirmAction === "bulk-unarchive") executeBulkUnarchive();
        }}
        title={
          confirmAction?.includes("delete")
            ? (isAr ? "حذف المستفيدين" : "Delete beneficiaries")
            : confirmAction?.includes("unarchive")
            ? (isAr ? "إلغاء أرشفة المستفيدين" : "Unarchive beneficiaries")
            : (isAr ? "أرشفة المستفيدين" : "Archive beneficiaries")
        }
        message={
          confirmAction === "bulk-delete"
            ? (isAr ? `هل أنت متأكد من حذف ${selectedIds.length} مستفيد؟` : `Are you sure you want to delete ${selectedIds.length} beneficiaries?`)
            : confirmAction === "bulk-archive"
            ? (isAr ? `هل أنت متأكد من أرشفة ${selectedIds.length} مستفيد؟` : `Are you sure you want to archive ${selectedIds.length} beneficiaries?`)
            : confirmAction === "bulk-unarchive"
            ? (isAr ? `هل أنت متأكد من إلغاء أرشفة ${selectedIds.length} مستفيد؟` : `Are you sure you want to unarchive ${selectedIds.length} beneficiaries?`)
            : confirmAction === "single-archive"
            ? (isAr ? `هل أنت متأكد من أرشفة "${viewRecord?.fullName || ""}"؟` : `Are you sure you want to archive "${viewRecord?.fullName || ""}"?`)
            : confirmAction === "single-unarchive"
            ? (isAr ? `هل أنت متأكد من إلغاء أرشفة "${viewRecord?.fullName || ""}"؟` : `Are you sure you want to unarchive "${viewRecord?.fullName || ""}"?`)
            : (isAr ? `هل أنت متأكد من حذف "${viewRecord?.fullName || ""}"؟` : `Are you sure you want to delete "${viewRecord?.fullName || ""}"?`)
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
    </>
  );
}
