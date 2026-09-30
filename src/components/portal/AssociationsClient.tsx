"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { BulkActionMenu } from "@/components/ui/ActionButtons";
import SortableHeader from "@/components/ui/SortableHeader";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/lib/ToastContext";
import { Users, ShieldAlert, Download, Eye, EyeOff, CheckCircle2, ShieldCheck, Mail, Building, Building2, Globe, ExternalLink, MapPin, Phone, Upload, ArchiveRestore, UserPlus, UserCheck, Plus, Pencil } from "lucide-react";
import { createAssociationSchema, createPasswordSchema, createSocialResearcherSchema } from "@/lib/zodSchemas";
import SearchViews, { FilterPreset, GroupByOption } from "./SearchViews";
import ListViews from "./ListViews";
import KanbanViews from "./KanbanViews";
import FormViews from "./FormViews";
import Select from "@/components/ui/Select";
import AttachmentField from "@/components/ui/AttachmentField";
import ExportModal from "@/components/ui/ExportModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Notebook from "@/components/ui/Notebook";
import { encodeId, decodeId } from "@/lib/idObfuscator";

interface Association {
  id: number;
  name: string;
  manager: string;
  managerId: number | null;
  managerUser: { id: number; name: string | null; email: string } | null;
  phone: string;
  email: string;
  governorateId: number;
  governorate: { id: number; name: string; nameAr: string };
  cityId: number;
  city: { id: number; name: string; nameAr: string; governorateId: number; governorate: { id: number; name: string; nameAr: string } };
  categoryId: number;
  category: { id: number; name: string; nameAr: string | null };
  donationUrl: string | null;
  logoId: number | null;
  logo: { id: number; originalName: string; mimetype: string; fileSize: number; width: number | null; height: number | null } | null;
  logoUrl: string | null;
  isActive?: boolean;
  isArchived?: boolean;
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
  nameAr: string | null;
}

interface UserSummary {
  id: number;
  name: string | null;
  email: string;
}

interface CityOption {
  id: number;
  name: string;
  nameAr: string;
  governorateId: number;
  governorate: { id: number; name: string; nameAr: string };
}

interface GovernorateOption {
  id: number;
  name: string;
  nameAr: string;
}

interface AssociationsClientProps {
  initialAssociations: Association[];
  categories: Category[];
  cities: CityOption[];
  governorates: GovernorateOption[];
  users: UserSummary[];
  title: string;
  emptyMessage: string;
  locale: string;
}

export default function AssociationsClient({
  initialAssociations,
  categories,
  cities: allCities,
  governorates,
  users,
  title,
  emptyMessage,
  locale,
}: AssociationsClientProps) {
  const t = useTranslations("associations");
  const tCommon = useTranslations("common");
  const tVal = useTranslations("validation");
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [associations, setAssociations] = useState<Association[]>(initialAssociations);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [confirmAction, setConfirmAction] = useState<"single-delete" | "bulk-delete" | "single-archive" | "bulk-archive" | "single-unarchive" | "bulk-unarchive" | null>(null);
  const path = "/portal/associations";
  const isAr = locale === "ar";

  // Form State
  const [formMode, setFormMode] = useState<"view" | "create" | "edit">("view");
  const [viewRecord, setViewRecord] = useState<Association | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateManagerModal, setShowCreateManagerModal] = useState(false);
  const [showManagerPassword, setShowManagerPassword] = useState(false);
  const [managerPasswordError, setManagerPasswordError] = useState<string | null>(null);
  const [managerPassword, setManagerPassword] = useState("");
  const [creatingManager, setCreatingManager] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | false>>({});
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [bulkExportOpen, setBulkExportOpen] = useState(false);
  const redirectGuard = useRef(false);

  // Form Fields
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [manager, setManager] = useState("");
  const [managerId, setManagerId] = useState<number | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cityId, setCityId] = useState<number>(0);
  const [governorateId, setGovernorateId] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<number>(0);
  const [donationUrl, setDonationUrl] = useState("");
  const [logoFile, setLogoFile] = useState<any>(null);

  // Social Researchers State
  const [researchers, setResearchers] = useState<{ id: number; name: string | null; email: string; status: string; createdAt: string }[]>([]);
  const [loadingResearchers, setLoadingResearchers] = useState(false);
  const [resName, setResName] = useState("");
  const [resEmail, setResEmail] = useState("");
  const [resErrors, setResErrors] = useState<{ name?: string; email?: string }>({});
  const [creatingResearcher, setCreatingResearcher] = useState(false);
  const [resendingInviteId, setResendingInviteId] = useState<number | null>(null);
  const [showAddResearcherForm, setShowAddResearcherForm] = useState(false);
  const [editingResearcher, setEditingResearcher] = useState<{ id: number; name: string; email: string; status: string } | null>(null);
  const [editResName, setEditResName] = useState("");
  const [editResEmail, setEditResEmail] = useState("");
  const [editResErrors, setEditResErrors] = useState<{ name?: string; email?: string }>({});
  const [updatingResearcher, setUpdatingResearcher] = useState(false);

  const filteredCities = allCities.filter((c) => Number(c.governorateId) === Number(governorateId));

  const recordId = searchParams.get("id");
  const recordNumericId = recordId ? decodeId(recordId) : null;
  const isNew = searchParams.get("new") === "true";

  const currentIndex = recordNumericId ? associations.findIndex((a) => a.id === recordNumericId) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < associations.length - 1;

  // --- Filter Presets ---
  const [archivedLoaded, setArchivedLoaded] = useState(false);
  const [fetchingArchived, setFetchingArchived] = useState(false);

  const fetchArchivedAssociations = useCallback(async () => {
    if (fetchingArchived) return;
    setFetchingArchived(true);
    try {
      const res = await fetch("/api/associations?archived=true");
      if (res.ok) {
        const data = await res.json();
        if (data.associations && Array.isArray(data.associations)) {
          setAssociations((prev) => {
            const incomingMap = new Map<number, any>(data.associations.map((a: any) => [a.id, a]));
            const updated = prev.map((a) => {
              if (incomingMap.has(a.id)) {
                const inc = incomingMap.get(a.id);
                incomingMap.delete(a.id);
                return { ...a, ...inc };
              }
              return a;
            });
            const newItems = Array.from(incomingMap.values()) as Association[];
            return [...updated, ...newItems];
          });
        }
        setArchivedLoaded(true);
      }
    } catch (err) {
      console.error("Error fetching archived associations:", err);
    } finally {
      setFetchingArchived(false);
    }
  }, [fetchingArchived]);

  const filterPresets: FilterPreset[] = [
    {
      id: "archived-items",
      label: isAr ? "عرض المؤرشفين" : "Archived Items",
      filterFunc: (item: any) => {
        if (!archivedLoaded && !fetchingArchived) {
          fetchArchivedAssociations();
        }
        return !!item.isArchived;
      },
    },
    ...categories.map((cat) => ({
      id: `cat-${cat.id}`,
      label: isAr ? cat.nameAr || cat.name : cat.name,
      filterFunc: (item: Association) => item.categoryId === cat.id,
    })),
  ];

  // --- Group By Options ---
  const groupByOptions: GroupByOption[] = [
    {
      id: "category",
      label: isAr ? "التصنيف" : "Category",
      groupByFunc: (item: Association) =>
        isAr ? item.category.nameAr || item.category.name : item.category.name,
    },
    {
      id: "city",
      label: isAr ? "المدينة" : "City",
      groupByFunc: (item: Association) => isAr ? item.city.nameAr : item.city.name,
    },
  ];

  const cityParentMap: Record<string, string[]> = {};
  governorates.forEach((g) => {
    const gName = isAr ? g.nameAr : g.name;
    const citiesOfGov = allCities
      .filter((c) => Number(c.governorateId) === Number(g.id))
      .map((c) => (isAr ? c.nameAr : c.name));
    cityParentMap[gName] = citiesOfGov;
  });

  const exportFields = [
    { key: "name", label: "Name", labelAr: "الاسم" },
    { key: "logoUrl", label: "Logo", labelAr: "الشعار", type: "image" as const },
    { key: "manager", label: "Manager", labelAr: "المسؤول" },
    { key: "phone", label: "Phone", labelAr: "الهاتف" },
    { key: "email", label: "Email", labelAr: "البريد الإلكتروني" },
    {
      key: isAr ? "category.nameAr" : "category.name",
      label: "Category",
      labelAr: "التصنيف",
      options: categories.map((c) => ({
        value: isAr ? c.nameAr || c.name : c.name,
        label: c.name,
        labelAr: c.nameAr || c.name,
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
    { key: "donationUrl", label: "Donation URL", labelAr: "رابط التبرع" },
    { key: "createdAt", label: "Created At", labelAr: "تاريخ الإنشاء" },
  ];

  // Sync form state with URL params
  useEffect(() => {
    setFieldErrors({});
    // Reset the redirect guard on every effect run so it can re-evaluate
    if (!recordId && !isNew) {
      redirectGuard.current = false;
      setLoading(false);
      return;
    }
    setLoading(true);
    if (recordId) {
      // Guard: user must have "view" permission to open a record
      if (!hasPermission(path, "view")) {
        if (redirectGuard.current) return;
        redirectGuard.current = true;
        showToast(
          isAr
            ? "عذراً، ليس لديك صلاحية الوصول لعرض الجمعية."
            : "Sorry, you do not have permission to access the associations screen.",
          "error"
        );
        router.replace(pathname, { scroll: false });
        return;
      }
      redirectGuard.current = false;
      const targetNumId = decodeId(recordId);
      const assoc = associations.find((a) => a.id === targetNumId);
      if (assoc) {
        setFormMode("view");
        setViewRecord(assoc);
        setEditingId(assoc.id);
        setName(assoc.name);
        setManager(assoc.manager);
        setManagerId(assoc.managerId);
        setPhone(assoc.phone);
        setEmail(assoc.email);
        setCityId(assoc.cityId);
        setGovernorateId(assoc.governorateId || assoc.city.governorateId);
        setCategoryId(assoc.categoryId);
        setDonationUrl(assoc.donationUrl || "");
        setLogoFile(assoc.logo ? { ...assoc.logo, url: assoc.logoUrl!, name: assoc.logo.originalName } : null);
        loadResearchers(assoc.id);
      } else if (!archivedLoaded && !fetchingArchived) {
        fetchArchivedAssociations();
      }
      setLoading(false);
    } else if (isNew) {
      setFormMode("create");
      setViewRecord(null);
      setEditingId(null);
      setName("");
      setManager("");
      setManagerId(null);
      setPhone("");
      setEmail("");
      setGovernorateId(0);
      setCityId(0);
      setCategoryId(0);
      setDonationUrl("");
      setLogoFile(null);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [recordId, isNew]);

  const handleSelectAll = (items: Association[]) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(items.map((a) => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const executeBulkDelete = async () => {
    setConfirmAction(null);
    let successCount = 0;
    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/associations/${id}`, { method: "DELETE" });
        if (res.ok) successCount++;
      } catch (err) {
        console.error(err);
      }
    }

    showToast(
      isAr
        ? `تم حذف ${successCount} جمعية بنجاح.`
        : `Successfully deleted ${successCount} associations.`,
      "success"
    );

    setAssociations((prev) => prev.filter((a) => !selectedIds.includes(a.id)));
    setSelectedIds([]);
  };

  const executeBulkArchive = async () => {
    setConfirmAction(null);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/associations/${encodeId(id)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isArchived: true }),
          })
        )
      );
      showToast(t("bulkArchiveSuccess"), "success");
      setAssociations((prev) =>
        prev.map((a) => (selectedIds.includes(a.id) ? { ...a, isArchived: true } : a))
      );
      setSelectedIds([]);
    } catch (err) {
      console.error("Bulk archive error:", err);
      showToast("Error archiving associations", "error");
    }
  };

  const executeBulkUnarchive = async () => {
    setConfirmAction(null);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/associations/${encodeId(id)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isArchived: false }),
          })
        )
      );
      showToast(isAr ? "تم إلغاء أرشفة الجمعيات المحددة بنجاح" : "Unarchived selected items successfully", "success");
      setAssociations((prev) =>
        prev.map((a) => (selectedIds.includes(a.id) ? { ...a, isArchived: false } : a))
      );
      setSelectedIds([]);
    } catch (err) {
      console.error("Bulk unarchive error:", err);
      showToast("Error unarchiving associations", "error");
    }
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

  const navigateToList = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const handleAddClick = () => {
    router.push(pathname + "?new=true", { scroll: false });
  };

  const handleRowClick = (assoc: Association) => {
    if (!hasPermission(path, "view")) return;
    router.push(pathname + "?id=" + encodeId(assoc.id), { scroll: false });
  };

  const handleEditMode = () => {
    setFormMode("edit");
  };

  const handleCancel = () => {
    if (formMode === "edit" && viewRecord) {
      setName(viewRecord.name);
      setManager(viewRecord.manager);
      setManagerId(viewRecord.managerId);
      setPhone(viewRecord.phone);
      setEmail(viewRecord.email);
      setCityId(viewRecord.cityId);
      setGovernorateId(viewRecord.city.governorateId);
      setCategoryId(viewRecord.categoryId);
      setDonationUrl(viewRecord.donationUrl || "");
      setLogoFile(viewRecord.logo ? { ...viewRecord.logo, url: viewRecord.logoUrl!, name: viewRecord.logo.originalName } : null);
      setFormMode("view");
    } else {
      navigateToList();
    }
  };

  const handleSave = async () => {
    const payload = {
      name: name.trim(),
      manager: manager.trim(),
      managerId: managerId ? Number(managerId) : null,
      phone: phone.trim(),
      email: email.trim(),
      governorateId: Number(governorateId),
      cityId: Number(cityId),
      categoryId: Number(categoryId),
      donationUrl: donationUrl.trim() || "",
      logoId: logoFile?.id || null,
    };

    const associationSchema = createAssociationSchema(tVal);
    const result = associationSchema.safeParse(payload);
    if (!result.success) {
      const errors: Record<string, string | false> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      showToast(t("correctErrors"), "error");
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    const validated = result.data;

    try {
      const url = formMode === "create" ? "/api/associations" : `/api/associations/${editingId}`;
      const method = formMode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...validated,
          donationUrl: validated.donationUrl || null,
          logoId: validated.logoId || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(
          isAr
            ? formMode === "create" ? "تم إضافة الجمعية بنجاح" : "تم تعديل بيانات الجمعية بنجاح"
            : formMode === "create" ? "Association added successfully" : "Association updated successfully",
          "success"
        );

        if (formMode === "create") {
          setAssociations((prev) => [data.association, ...prev]);
          router.replace(pathname + "?id=" + data.association.id, { scroll: false });
        } else {
          setAssociations((prev) =>
            prev.map((a) => (a.id === editingId ? data.association : a))
          );
          setViewRecord(data.association);
          setFormMode("view");
        }
      } else {
        showToast(data.error || t("saveFailed"), "error");
      }
    } catch (err) {
      console.error(err);
      showToast(t("saveError"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!viewRecord) return;
    setConfirmAction("single-delete");
  };

  const executeSingleDelete = async () => {
    setConfirmAction(null);
    if (!viewRecord) return;

    try {
      const res = await fetch(`/api/associations/${viewRecord.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast(t("deleteSuccess"), "success");
        setAssociations((prev) => prev.filter((a) => a.id !== viewRecord.id));
        navigateToList();
      } else {
        const data = await res.json();
        showToast(data.error || t("deleteFailed"), "error");
      }
    } catch (err) {
      console.error(err);
      showToast(t("deleteError"), "error");
    }
  };

  const handleArchive = () => {
    setConfirmAction("single-archive");
  };

  const executeSingleArchive = async () => {
    const targetId = viewRecord?.id || editingId;
    setConfirmAction(null);
    if (!targetId) return;

    try {
      const res = await fetch(`/api/associations/${encodeId(targetId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      });
      if (res.ok) {
        showToast(t("archiveSuccess"), "success");
        setAssociations((prev) =>
          prev.map((a) => (a.id === targetId ? { ...a, isArchived: true } : a))
        );
        setViewRecord((prev) => (prev ? { ...prev, isArchived: true } : null));
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to archive", "error");
      }
    } catch (err) {
      console.error("Archive error:", err);
      showToast("Error archiving association", "error");
    }
  };

  const handleUnarchive = () => {
    setConfirmAction("single-unarchive");
  };

  const executeSingleUnarchive = async () => {
    const targetId = viewRecord?.id || editingId;
    setConfirmAction(null);
    if (!targetId) return;

    try {
      const res = await fetch(`/api/associations/${encodeId(targetId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: false }),
      });
      if (res.ok) {
        showToast(isAr ? "تم إلغاء أرشفة الجمعية بنجاح" : "Unarchived successfully", "success");
        setAssociations((prev) =>
          prev.map((a) => (a.id === targetId ? { ...a, isArchived: false } : a))
        );
        setViewRecord((prev) => (prev ? { ...prev, isArchived: false } : null));
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to unarchive", "error");
      }
    } catch (err) {
      console.error("Unarchive error:", err);
      showToast("Error unarchiving association", "error");
    }
  };

  // Real-time Password Strength for Manager Creation
  const mgrHasMinLength = managerPassword.length >= 8;
  const mgrHasUppercase = /[A-Z]/.test(managerPassword);
  const mgrHasLowercase = /[a-z]/.test(managerPassword);
  const mgrHasNumber = /\d/.test(managerPassword);
  const mgrHasSpecial = /[^A-Za-z0-9]/.test(managerPassword);
  const mgrCriteriaCount = [mgrHasMinLength, mgrHasUppercase, mgrHasLowercase, mgrHasNumber, mgrHasSpecial].filter(Boolean).length;

  let mgrStrengthLabel = isAr ? "ضعيفة جداً" : "Very Weak";
  let mgrStrengthBg = "bg-rose-500";
  let mgrStrengthWidth = "w-1/5";
  if (mgrCriteriaCount >= 5) {
    mgrStrengthLabel = isAr ? "قوية جداً وآمنة" : "Very Strong";
    mgrStrengthBg = "bg-emerald-500";
    mgrStrengthWidth = "w-full";
  } else if (mgrCriteriaCount >= 3) {
    mgrStrengthLabel = isAr ? "متوسطة القوة" : "Medium";
    mgrStrengthBg = "bg-amber-500";
    mgrStrengthWidth = mgrCriteriaCount === 3 ? "w-3/5" : "w-4/5";
  } else if (mgrCriteriaCount >= 1) {
    mgrStrengthLabel = isAr ? "ضعيفة" : "Weak";
    mgrStrengthBg = "bg-rose-500";
    mgrStrengthWidth = mgrCriteriaCount === 1 ? "w-1/5" : "w-2/5";
  }

  const loadResearchers = useCallback(async (assocId: number) => {
    setLoadingResearchers(true);
    try {
      const encodedId = encodeId(assocId);
      const res = await fetch(`/api/associations/${encodedId}/researchers`);
      if (res.ok) {
        const data = await res.json();
        setResearchers(data.researchers || []);
      } else {
        setResearchers([]);
      }
    } catch (err) {
      console.error("Failed to load researchers", err);
      setResearchers([]);
    } finally {
      setLoadingResearchers(false);
    }
  }, []);

  const handleCreateResearcher = async () => {
    setResErrors({});
    const targetId = viewRecord?.id || editingId;
    if (!targetId) return;

    const socialResearcherSchema = createSocialResearcherSchema(tVal);
    const parseResult = socialResearcherSchema.safeParse({
      name: resName,
      email: resEmail,
    });

    if (!parseResult.success) {
      const errors: { name?: string; email?: string } = {};
      parseResult.error.issues.forEach((issue) => {
        const field = issue.path[0] as "name" | "email";
        if (field && !errors[field]) {
          errors[field] = issue.message;
        }
      });
      setResErrors(errors);
      return;
    }

    setCreatingResearcher(true);
    try {
      const encodedId = encodeId(targetId);
      const res = await fetch(`/api/associations/${encodedId}/researchers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: resName, email: resEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(
          data.message || (isAr ? "تم إنشاء حساب الباحث وإرسال الدعوة لبريده الإلكتروني" : "Researcher account created & invite sent"),
          "success"
        );
        setResName("");
        setResEmail("");
        setResErrors({});
        setShowAddResearcherForm(false);
        loadResearchers(targetId);
      } else {
        showToast(data.error || (isAr ? "فشل إنشاء حساب الباحث" : "Failed to create researcher"), "error");
      }
    } catch (err) {
      console.error(err);
      showToast(isAr ? "حدث خطأ أثناء إنشاء حساب الباحث" : "Error creating researcher account", "error");
    } finally {
      setCreatingResearcher(false);
    }
  };

  const handleResendResearcherInvite = async (researcherUserId: number) => {
    setResendingInviteId(researcherUserId);
    try {
      const res = await fetch(`/api/users/${researcherUserId}/resend-invite`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(
          isAr ? "تم إعادة إرسال رابط الدعوة إلى بريد الباحث بنجاح" : "Invitation link resent to researcher email",
          "success"
        );
      } else {
        showToast(data.error || (isAr ? "فشل إرسال الدعوة" : "Failed to send invitation"), "error");
      }
    } catch (err) {
      console.error(err);
      showToast(isAr ? "حدث خطأ أثناء إرسال الدعوة" : "Error resending invitation", "error");
    } finally {
      setResendingInviteId(null);
    }
  };

  const handleOpenEditResearcher = (r: { id: number; name: string | null; email: string; status: string }) => {
    setEditingResearcher({ id: r.id, name: r.name || "", email: r.email, status: r.status });
    setEditResName(r.name || "");
    setEditResEmail(r.email);
    setEditResErrors({});
  };

  const handleUpdateResearcher = async () => {
    const targetId = recordNumericId || editingId || viewRecord?.id;
    if (!editingResearcher || !targetId) return;
    if (!editResName.trim()) {
      setEditResErrors({ name: isAr ? "اسم الباحث مطلوب" : "Name is required" });
      return;
    }
    if (editingResearcher.status === "inactive" && (!editResEmail.trim() || !editResEmail.includes("@"))) {
      setEditResErrors({ email: isAr ? "يرجى إدخال بريد إلكتروني صحيح" : "Valid email required" });
      return;
    }

    setUpdatingResearcher(true);
    try {
      const encodedId = encodeId(targetId);
      const res = await fetch(`/api/associations/${encodedId}/researchers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          researcherId: editingResearcher.id,
          name: editResName.trim(),
          email: editingResearcher.status === "inactive" ? editResEmail.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || (isAr ? "تم تحديث بيانات الباحث بنجاح" : "Researcher updated successfully"), "success");
        setEditingResearcher(null);
        loadResearchers(targetId);
      } else {
        showToast(data.error || (isAr ? "فشل تحديث بيانات الباحث" : "Failed to update researcher"), "error");
      }
    } catch (err) {
      console.error(err);
      showToast(isAr ? "حدث خطأ أثناء تحديث بيانات الباحث" : "Error updating researcher", "error");
    } finally {
      setUpdatingResearcher(false);
    }
  };

  const handleCreateManager = async () => {
    setManagerPasswordError(null);
    if (managerPassword) {
      const passwordSchema = createPasswordSchema(tVal);
      const parseResult = passwordSchema.safeParse(managerPassword);
      if (!parseResult.success) {
        setManagerPasswordError(parseResult.error.issues[0]?.message || (isAr ? "كلمة المرور لا تطابق المعايير" : "Password does not meet criteria"));
        return;
      }
    }

    const targetId = viewRecord?.id || editingId;
    if (!targetId) return;

    setCreatingManager(true);
    try {
      const encodedId = encodeId(targetId);
      const res = await fetch(`/api/associations/${encodedId}/create-manager`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: managerPassword || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(
          data.message || (isAr ? "تم إنشاء حساب مدير الجمعية وإرسال رابط الدعوة بنجاح" : "Manager user created and invite sent"),
          "success"
        );
        setShowCreateManagerModal(false);
        setManagerPassword("");
        setManagerPasswordError(null);
        setShowManagerPassword(false);
        setManagerId(data.user.id);
        setViewRecord((prev) =>
          prev ? { ...prev, managerId: data.user.id, managerUser: { id: data.user.id, name: data.user.name, email: data.user.email } } : null
        );
        setAssociations((prev) =>
          prev.map((a) =>
            a.id === targetId
              ? { ...a, managerId: data.user.id, managerUser: { id: data.user.id, name: data.user.name, email: data.user.email } }
              : a
          )
        );
      } else {
        showToast(data.error || (isAr ? "فشل إنشاء حساب مدير الجمعية" : "Failed to create manager user"), "error");
      }
    } catch (err) {
      console.error(err);
      showToast(isAr ? "حدث خطأ أثناء إنشاء حساب مدير الجمعية" : "An error occurred while creating manager user", "error");
    } finally {
      setCreatingManager(false);
    }
  };

  const navigatePrev = () => {
    if (hasPrev) {
      const prevId = associations[currentIndex - 1].id;
      router.replace(pathname + "?id=" + encodeId(prevId), { scroll: false });
    }
  };

  const navigateNext = () => {
    if (hasNext) {
      const nextId = associations[currentIndex + 1].id;
      router.replace(pathname + "?id=" + encodeId(nextId), { scroll: false });
    }
  };

  const cellPad = "p-3 sm:p-4";

  // --- Kanban card renderer ---
  const renderKanbanCard = (item: Association) => {
    const canView = hasPermission(path, "view");
    const isSelected = selectedIds.includes(item.id);
    return (
      <div
        onClick={() => canView && handleRowClick(item)}
        className={`bg-white dark:bg-[#1E293B]/80 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-shadow duration-200 ${
          canView
            ? "hover:shadow-lg hover:border-primary/30 dark:hover:border-tertiary/30 cursor-pointer"
            : ""
        } ${isSelected ? "ring-2 ring-primary dark:ring-tertiary shadow-md" : ""}`}
      >
        <div className="grid grid-cols-4 h-30">

          {/* Logo fills entire left column */}
          <div className="col-span-1 h-full overflow-hidden">
            {item.logoUrl ? (
              <img
                src={item.logoUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-300 dark:text-slate-600">
                <Building size={28} />
              </div>
            )}
          </div>

          {/* Content right */}
          <div className="col-span-3 py-3 px-3 h-full">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 gap-2 pb-2">
              {/* Name */}
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                {item.name}
              </h3>

              {/* Category badge */}
              <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                {isAr ? item.category.nameAr || item.category.name : item.category.name}
              </span>
            </div>

            {/* Meta info */}
            <div className="flex justify-between pt-3 items-start px-2">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <MapPin size={12} className="shrink-0 text-slate-400 dark:text-slate-500" />
                  <span className="truncate">{isAr ? item.city.nameAr : item.city.name}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <Phone size={12} className="shrink-0 text-slate-400 dark:text-slate-500" />
                  <span>{item.phone}</span>
                </div>
              </div>
              {item.donationUrl && (
                <a
                  href={item.donationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 text-[11px] text-primary dark:text-tertiary hover:underline"
                >
                  <Globe size={12} className="shrink-0" />
                  <span className="truncate">{isAr ? "منصة تبرع" : "Donation"}</span>
                </a>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  };

  // --- Table header renderer ---
  const renderTableHeader = (
    visibleItems: Association[],
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
        <SortableHeader
          sortColumn={sortInfo?.sortColumn ?? null}
          sortDirection={sortInfo?.sortDirection ?? "asc"}
          field="id"
          onSort={sortInfo?.onSort ?? (() => {})}
          className={`${cellPad} text-start font-bold`}
        >
          ID
        </SortableHeader>
        <th className={`${cellPad} text-start font-bold`}>{t("logo")}</th>
        <SortableHeader
          sortColumn={sortInfo?.sortColumn ?? null}
          sortDirection={sortInfo?.sortDirection ?? "asc"}
          field="name"
          onSort={sortInfo?.onSort ?? (() => {})}
          className={`${cellPad} text-start font-bold`}
        >
          {t("name")}
        </SortableHeader>
        <SortableHeader
          sortColumn={sortInfo?.sortColumn ?? null}
          sortDirection={sortInfo?.sortDirection ?? "asc"}
          field="category.name"
          onSort={sortInfo?.onSort ?? (() => {})}
          className={`${cellPad} text-start font-bold`}
        >
          {t("category")}
        </SortableHeader>
        <SortableHeader
          sortColumn={sortInfo?.sortColumn ?? null}
          sortDirection={sortInfo?.sortDirection ?? "asc"}
          field="manager"
          onSort={sortInfo?.onSort ?? (() => {})}
          className={`${cellPad} text-start font-bold`}
        >
          {t("manager")}
        </SortableHeader>
        <th className={`${cellPad} text-start font-bold`}>{t("managerUser")}</th>
        <SortableHeader
          sortColumn={sortInfo?.sortColumn ?? null}
          sortDirection={sortInfo?.sortDirection ?? "asc"}
          field="phone"
          onSort={sortInfo?.onSort ?? (() => {})}
          className={`${cellPad} text-start font-bold`}
        >
          {t("phone")}
        </SortableHeader>
        <SortableHeader
          sortColumn={sortInfo?.sortColumn ?? null}
          sortDirection={sortInfo?.sortDirection ?? "asc"}
          field="email"
          onSort={sortInfo?.onSort ?? (() => {})}
          className={`${cellPad} text-start font-bold`}
        >
          {t("email")}
        </SortableHeader>
        <SortableHeader
          sortColumn={sortInfo?.sortColumn ?? null}
          sortDirection={sortInfo?.sortDirection ?? "asc"}
          field={isAr ? "city.nameAr" : "city.name"}
          onSort={sortInfo?.onSort ?? (() => {})}
          className={`${cellPad} text-start font-bold`}
        >
          {t("city")}
        </SortableHeader>
        <th className={`${cellPad} text-start font-bold text-center`}>{t("visitDonationLabel")}</th>
      </tr>
    </thead>
  );

  // --- Table row renderer ---
  const renderRow = (assoc: Association) => (
    <tr
      key={assoc.id}
      onClick={() => handleRowClick(assoc)}
      className={`text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-[#1E293B]/20 transition-colors ${
        hasPermission(path, "view") ? "cursor-pointer" : ""
      } ${
        selectedIds.includes(assoc.id) ? "bg-primary/5 dark:bg-tertiary/5" : ""
      }`}
    >
      <td className={cellPad} onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selectedIds.includes(assoc.id)}
          onChange={(e) => handleSelectRow(assoc.id, e.target.checked)}
          className="w-4 h-4 rounded text-primary focus:ring-primary border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 accent-primary dark:accent-tertiary cursor-pointer"
        />
      </td>
      <td className={`${cellPad} text-xs`}>{assoc.id}</td>
      <td className={cellPad}>
        {assoc.logoUrl ? (
          <img
            src={assoc.logoUrl}
            alt={assoc.name}
            className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-lg border border-slate-100 dark:border-slate-800"
          />
        ) : (
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center rounded-lg text-slate-400">
            <Building className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )}
      </td>
      <td className={`${cellPad} font-medium text-slate-900 dark:text-white text-xs sm:text-sm`}>{assoc.name}</td>
      <td className={cellPad}>
        <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
          {isAr ? assoc.category.nameAr || assoc.category.name : assoc.category.name}
        </span>
      </td>
      <td className={`${cellPad} text-xs sm:text-sm`}>{assoc.manager}</td>
      <td className={`${cellPad} font-medium text-primary dark:text-tertiary text-xs sm:text-sm`}>
        {assoc.managerUser ? assoc.managerUser.name : (
          <span className="text-slate-400 dark:text-slate-600 text-[10px] sm:text-xs font-normal">{t("noManager")}</span>
        )}
      </td>
      <td className={`${cellPad} text-[11px] sm:text-xs`}>{assoc.phone}</td>
      <td className={`${cellPad} text-[11px] sm:text-xs`}>{assoc.email}</td>
      <td className={`${cellPad} text-xs sm:text-sm`}>{isAr ? assoc.city.nameAr : assoc.city.name}</td>
      <td className={`${cellPad} text-center`}>
        {assoc.donationUrl ? (
          <a
            href={assoc.donationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-xs text-primary dark:text-tertiary hover:underline"
            title={t("visitDonation")}
          >
            <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </a>
        ) : (
          <span className="text-slate-300 dark:text-slate-700">-</span>
        )}
      </td>
    </tr>
  );

  const isViewOnly = formMode === "view";
  const inputBase =
    "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-tertiary transition-colors";
  const inputDisabled =
    "w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 cursor-default transition-colors";

  const inputCls = (field: string) =>
    fieldErrors[field]
      ? inputBase.replace("border-slate-200 dark:border-slate-800", "border-red-500 dark:border-red-400")
      : inputBase;

  const inputDisabledCls = (field: string) =>
    fieldErrors[field]
      ? inputDisabled.replace("border-slate-200 dark:border-slate-800", "border-red-500 dark:border-red-400")
      : inputDisabled;

  // Show form views when URL has id or new param
  if (recordId || isNew) {
    return (
      <>
      <FormViews
        mode={formMode}
        screenName={isAr ? "الجمعيات" : "Associations"}
        recordName={viewRecord?.name}
        onSave={handleSave}
        onCancel={handleCancel}
        onAdd={handleAddClick}
        onEdit={handleEditMode}
        onDelete={handleDelete}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
        isArchived={viewRecord?.isArchived}
        onNavigatePrev={navigatePrev}
        onNavigateNext={navigateNext}
        hasPrev={hasPrev}
        hasNext={hasNext}
        recordIndex={currentIndex + 1}
        totalRecords={associations.length}
        submitting={submitting}
        hasCreatePermission={hasPermission(path, "create")}
        hasEditPermission={hasPermission(path, "edit")}
        hasDeletePermission={hasPermission(path, "delete")}
        hasArchivePermission={hasPermission(path, "archive")}
        locale={locale}
        onClose={navigateToList}
        ribbon={viewRecord?.isArchived ? { title: isAr ? "مؤرشف" : "Archived", color: "danger", locale } : undefined}
        extraActions={[
          ...(formMode === "view" && viewRecord && hasPermission(path, "create") ? [{
            label: "Import",
            labelAr: "استيراد",
            icon: <Upload size={14} className="text-amber-500" />,
            onClick: () => router.push(`/${locale}/portal/import/associations`),
          }] : []),
          ...(formMode === "view" && viewRecord && hasPermission(path, "export") ? [{
            label: "Export",
            labelAr: "تصدير",
            icon: <Download size={14} className="text-violet-500" />,
            onClick: () => setExportModalOpen(true),
          }] : []),
        ]}
      >
        {formMode === "view" && !viewRecord?.managerId && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowCreateManagerModal(true)}
              className="inline-flex items-center gap-1.5 bg-primary dark:bg-tertiary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              {t("createManagerAccount")}
            </button>
            </div>
          )}

        {loading && recordId && !isNew ? (
          <div className="animate-pulse space-y-4">
            <div className="md:col-span-2 flex justify-start">
              <div className="w-32 h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                  <div className="h-[38px] bg-slate-200 dark:bg-slate-700 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Logo */}
          <div className="md:col-span-2 flex justify-start">
            <AttachmentField
              value={logoFile}
              onChange={setLogoFile}
              readonly={isViewOnly}
              accept="image/*"
              imageOnly
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t("name")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => { setName(e.target.value); setFieldErrors((prev) => ({ ...prev, name: false })); }}
              disabled={isViewOnly}
              className={isViewOnly ? inputDisabledCls("name") : inputCls("name")}
            />
            {fieldErrors.name && <span className="text-red-500 text-xs mt-1">{fieldErrors.name}</span>}
          </div>

          {/* Classification Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t("category")} <span className="text-red-500">*</span>
            </label>
            <Select
              value={categoryId}
              onChange={(v) => { setCategoryId(Number(v)); setFieldErrors((prev) => ({ ...prev, categoryId: false })); }}
              disabled={isViewOnly}
              error={!!fieldErrors.categoryId}
              placeholder={t("selectCategory")}
              options={categories.map((cat) => ({ value: cat.id, label: isAr ? cat.nameAr || cat.name : cat.name }))}
            />
            {fieldErrors.categoryId && <span className="text-red-500 text-xs mt-1">{fieldErrors.categoryId}</span>}
          </div>

          {/* Manager Name (Text) - hidden when linked user exists */}
          {!managerId && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t("manager")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={manager}
              onChange={(e) => { setManager(e.target.value); setFieldErrors((prev) => ({ ...prev, manager: false })); }}
              disabled={isViewOnly}
              className={isViewOnly ? inputDisabledCls("manager") : inputCls("manager")}
            />
            {fieldErrors.manager && <span className="text-red-500 text-xs mt-1">{fieldErrors.manager}</span>}
          </div>
          )}

          {/* Manager User (Read-only) - shown when linked user exists */}
          {managerId && viewRecord?.managerUser && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t("managerUser")}
            </label>
            <div className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
              {viewRecord.managerUser.name}
            </div>
          </div>
          )}

          {/* Contact Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t("phone")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setFieldErrors((prev) => ({ ...prev, phone: false })); }}
              disabled={isViewOnly}
              placeholder="e.g. 5********"
              className={isViewOnly ? inputDisabledCls("phone") : inputCls("phone")}
            />
            {fieldErrors.phone && <span className="text-red-500 text-xs mt-1">{fieldErrors.phone}</span>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t("email")} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors((prev) => ({ ...prev, email: false })); }}
              disabled={isViewOnly}
              placeholder="name@charity.org"
              className={isViewOnly ? inputDisabledCls("email") : inputCls("email")}
            />
            {fieldErrors.email && <span className="text-red-500 text-xs mt-1">{fieldErrors.email}</span>}
          </div>

          {/* Governorate + City */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t("governorate")} <span className="text-red-500">*</span>
            </label>
            <Select
              value={governorateId}
              onChange={(v) => {
                const gId = Number(v);
                setGovernorateId(gId);
                setCityId(0);
                setFieldErrors((prev) => ({ ...prev, governorateId: false, cityId: false }));
              }}
              disabled={isViewOnly}
              error={!!fieldErrors.governorateId}
              placeholder={t("selectGovernorate")}
              options={governorates.map((g) => ({ value: g.id, label: isAr ? g.nameAr : g.name }))}
            />
            {fieldErrors.governorateId && <span className="text-red-500 text-xs mt-1">{fieldErrors.governorateId}</span>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t("city")} <span className="text-red-500">*</span>
            </label>
            <Select
              value={cityId}
              onChange={(v) => { setCityId(Number(v)); setFieldErrors((prev) => ({ ...prev, cityId: false })); }}
              disabled={isViewOnly || !governorateId}
              error={!!fieldErrors.cityId}
              placeholder={isAr ? "اختر المدينة..." : "Select city"}
              options={filteredCities.map((c) => ({ value: c.id, label: isAr ? c.nameAr : c.name }))}
            />
            {fieldErrors.cityId && <span className="text-red-500 text-xs mt-1">{fieldErrors.cityId}</span>}
          </div>

          {/* Donation Url */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t("donationUrl")}
            </label>
            <input
              type="url"
              value={donationUrl}
              onChange={(e) => setDonationUrl(e.target.value)}
              disabled={isViewOnly}
              placeholder="https://..."
              className={isViewOnly ? inputDisabled : inputBase}
            />
          </div>

          {/* Standard Odoo Notebook Component */}
          {(recordId || viewRecord) && (
            <div className="md:col-span-2">
              <Notebook
                tabs={[
                  {
                    id: "researchers",
                    title: isAr ? `الباحثون الاجتماعيون (${researchers.length})` : `Social Researchers (${researchers.length})`,
                    content: (
                      <div className="space-y-4 p-4">
                        {/* Header Add Button (Identical pattern to dependents) */}
                        {!isViewOnly && (
                          <div className="flex justify-start">
                            <button
                              type="button"
                              onClick={() => setShowAddResearcherForm((prev) => !prev)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary dark:bg-tertiary text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                            >
                              <Plus size={14} />
                              <span>{isAr ? "إضافة باحث" : "Add Researcher"}</span>
                            </button>
                          </div>
                        )}

                        {/* Inline Researcher Entry Card */}
                        {showAddResearcherForm && !isViewOnly && (
                          <div className="bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-3 animate-in fade-in duration-150 shadow-xs">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <UserPlus size={14} className="text-primary dark:text-tertiary" />
                                <span>{isAr ? "بيانات الباحث الاجتماعي الجديد:" : "New Social Researcher Details:"}</span>
                              </h5>
                              <button
                                type="button"
                                onClick={() => setShowAddResearcherForm(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer font-semibold"
                              >
                                {isAr ? "إلغاء" : "Cancel"}
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                  {isAr ? "اسم الباحث الاجتماعي" : "Researcher Name"} <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={resName}
                                  onChange={(e) => {
                                    setResName(e.target.value);
                                    setResErrors((prev) => ({ ...prev, name: undefined }));
                                  }}
                                  placeholder={isAr ? "مثال: عبد الله أحمد" : "e.g. Abdullah Ahmed"}
                                  className={`w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white focus:outline-none transition-colors ${
                                    resErrors.name ? "border-rose-500" : "border-slate-200 dark:border-slate-800 focus:border-primary"
                                  }`}
                                />
                                {resErrors.name && <p className="text-[10px] text-rose-500 font-medium mt-1">{resErrors.name}</p>}
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                  {isAr ? "البريد الإلكتروني للباحث" : "Researcher Email"} <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="email"
                                  value={resEmail}
                                  onChange={(e) => {
                                    setResEmail(e.target.value);
                                    setResErrors((prev) => ({ ...prev, email: undefined }));
                                  }}
                                  placeholder="researcher@moeen.org.sa"
                                  dir="ltr"
                                  className={`w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white focus:outline-none transition-colors ${
                                    resErrors.email ? "border-rose-500" : "border-slate-200 dark:border-slate-800 focus:border-primary"
                                  }`}
                                />
                                {resErrors.email && <p className="text-[10px] text-rose-500 font-medium mt-1">{resErrors.email}</p>}
                              </div>
                            </div>

                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={handleCreateResearcher}
                                disabled={creatingResearcher}
                                className="bg-primary dark:bg-tertiary hover:opacity-95 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                              >
                                {creatingResearcher ? (
                                  <span>{isAr ? "جاري الإنشاء وإرسال الدعوة..." : "Creating & Sending Invite..."}</span>
                                ) : (
                                  <>
                                    <Mail size={14} />
                                    <span>{isAr ? "إنشاء حساب الباحث وإرسال الدعوة" : "Create Researcher & Send Invite"}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Researchers List Table */}
                        {loadingResearchers ? (
                          <div className="py-6 text-center text-xs text-slate-400">{isAr ? "جاري تحميل قائمة الباحثين..." : "Loading researchers..."}</div>
                        ) : researchers.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                            {isAr ? "لا يوجد باحثين مضافين" : "No researchers added yet"}
                          </div>
                        ) : (
                          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                            <table className="w-full text-xs text-start">
                              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                  <th className="p-3.5 text-start">{isAr ? "اسم الباحث" : "Researcher Name"}</th>
                                  <th className="p-3.5 text-start">{isAr ? "البريد الإلكتروني" : "Email"}</th>
                                  <th className="p-3.5 text-center">{isAr ? "حالة الحساب" : "Status"}</th>
                                  <th className="p-3.5 text-end">{isAr ? "الإجراءات" : "Actions"}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {researchers.map((r) => (
                                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">{r.name || "—"}</td>
                                    <td className="p-3.5 text-slate-600 dark:text-slate-400 dir-ltr text-start text-[11px]">{r.email}</td>
                                    <td className="p-3.5 text-center">
                                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                        r.status === "inactive"
                                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                      }`}>
                                        {r.status === "inactive" ? (isAr ? "غير نشط (بانتظار الدعوة)" : "Inactive") : (isAr ? "نشط" : "Active")}
                                      </span>
                                    </td>
                                    <td className="p-3.5 text-end flex items-center justify-end gap-2.5">
                                      {!isViewOnly && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditResearcher(r)}
                                          className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-tertiary cursor-pointer"
                                          title={isAr ? "تعديل بيانات الباحث" : "Edit Researcher"}
                                        >
                                          <Pencil size={13} />
                                          <span>{isAr ? "تعديل" : "Edit"}</span>
                                        </button>
                                      )}
                                      {r.status === "inactive" && (
                                        <button
                                          type="button"
                                          onClick={() => handleResendResearcherInvite(r.id)}
                                          disabled={resendingInviteId === r.id}
                                          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary dark:text-tertiary hover:underline disabled:opacity-50 cursor-pointer"
                                        >
                                          <Mail size={13} />
                                          <span>{resendingInviteId === r.id ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إعادة إرسال الدعوة" : "Resend Invite")}</span>
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )
                  }
                ]}
              />
            </div>
          )}

          </div>
        )}

          {/* Create Manager Modal */}
          {showCreateManagerModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
              onClick={() => {
                setShowCreateManagerModal(false);
                setManagerPasswordError(null);
                setShowManagerPassword(false);
                setManagerPassword("");
              }}
            >
              <div
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-tertiary/10 text-primary dark:text-tertiary flex items-center justify-center shrink-0">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {isAr ? "إنشاء حساب مدير الجمعية وإرسال الدعوة" : "Create Manager Account & Send Invite"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isAr
                        ? "سيتم استخدام بيانات الجمعية الحالية لإنشاء الحساب وتفعيل البريد"
                        : "Current association details will be used to create account & send invite"}
                    </p>
                  </div>
                </div>

                {/* Account Details Preview Card */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/60 pb-2 flex items-center justify-between">
                    <span>{isAr ? "معاينة بيانات الحساب الذي سيتم إنشاؤه:" : "Account Data Preview:"}</span>
                    <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      {isAr ? "مدير جمعية" : "Manager"}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">{isAr ? "الجمعية:" : "Association:"}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{viewRecord?.name || name || "—"}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">{isAr ? "اسم المسؤول/المدير:" : "Manager Name:"}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{viewRecord?.manager || manager || "—"}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">{isAr ? "البريد الإلكتروني:" : "Email Address:"}</span>
                      <span className="font-bold text-primary dark:text-tertiary dir-ltr">{viewRecord?.email || email || "—"}</span>
                    </div>
                  </div>

                  {(!viewRecord?.email && !email) || (!viewRecord?.manager && !manager) ? (
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs p-2.5 rounded-lg flex items-center gap-2">
                      <ShieldAlert size={14} className="shrink-0" />
                      <span>
                        {isAr
                          ? "تنبيه: يجب إدخال اسم المدير والبريد الإلكتروني للجمعية أولاً لتتمكن من إنشاء الحساب وإرسال الدعوة."
                          : "Notice: Please provide manager name and email address in association details first."}
                      </span>
                    </div>
                  ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] p-2.5 rounded-lg flex items-center gap-2">
                      <Mail size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        {isAr
                          ? "سيصل رابط دعوة وتعيين كلمة المرور مباشرةً إلى البريد أعلاه ليتسنى للمدير تفعيل حسابه."
                          : "An invitation link to set password will be sent directly to the email above."}
                      </span>
                    </div>
                  )}
                </div>

                {/* Password Field (Hidden for now - may be used later) */}
                {/* 
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isAr ? "كلمة المرور (اختياري - يترك فارغاً ليعينها المدير بنفسه عبر رابط الدعوة):" : "Password (Optional):"}
                  </label>
                  <div className="relative">
                    <input
                      type={showManagerPassword ? "text" : "password"}
                      value={managerPassword}
                      onChange={(e) => {
                        setManagerPassword(e.target.value);
                        setManagerPasswordError(null);
                      }}
                      placeholder={isAr ? "اتركه فارغاً لإرسال رابط تفعيل..." : "Leave empty to send invite..."}
                      className={`w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 transition-colors pe-10 ${
                        managerPasswordError
                          ? "border-rose-500 focus:ring-rose-500"
                          : "border-slate-200 dark:border-slate-800 focus:ring-primary dark:focus:ring-tertiary"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowManagerPassword(!showManagerPassword)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showManagerPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {managerPasswordError && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">{managerPasswordError}</p>
                  )}
                </div>
                */}

                {/* Modal Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleCreateManager}
                    disabled={creatingManager || ((!viewRecord?.email && !email) || (!viewRecord?.manager && !manager))}
                    className="flex-1 bg-gradient-to-r from-primary to-tertiary hover:opacity-95 text-white text-xs font-bold px-4 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingManager ? (
                      <span>{isAr ? "جاري الإنشاء وإرسال الدعوة..." : "Creating & Sending Invite..."}</span>
                    ) : (
                      <>
                        <Mail size={15} />
                        <span>{isAr ? "تأكيد إنشاء الحساب وإرسال الدعوة" : "Create Account & Send Invite"}</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateManagerModal(false);
                      setManagerPasswordError(null);
                      setShowManagerPassword(false);
                      setManagerPassword("");
                    }}
                    className="px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    {t("cancel")}
                  </button>
                </div>
              </div>
            </div>
          )}
      </FormViews>

      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        tableName="associations"
        tableLabelAr="الجمعيات"
        availableFields={exportFields}
        selectedIds={recordNumericId ? [recordNumericId] : []}
        recordId={recordNumericId || undefined}
        allRecords={associations}
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
            ? (isAr ? "تأكيد الحذف" : "Confirm Delete")
            : confirmAction?.includes("unarchive")
            ? (isAr ? "تأكيد إلغاء الأرشفة" : "Confirm Unarchive")
            : (isAr ? "تأكيد الأرشفة" : "Confirm Archive")
        }
        message={
          confirmAction === "bulk-delete"
            ? (isAr ? `هل أنت متأكد من رغبتك في حذف ${selectedIds.length} من السجلات المحددة؟` : `Are you sure you want to delete ${selectedIds.length} items?`)
            : confirmAction === "bulk-archive"
            ? (isAr ? `هل أنت متأكد من رغبتك في أرشفة ${selectedIds.length} من السجلات المحددة؟` : `Are you sure you want to archive ${selectedIds.length} items?`)
            : confirmAction === "bulk-unarchive"
            ? (isAr ? `هل أنت متأكد من رغبتك في إلغاء أرشفة ${selectedIds.length} من السجلات المحددة؟` : `Are you sure you want to unarchive ${selectedIds.length} items?`)
            : confirmAction === "single-archive"
            ? (isAr ? `هل أنت متأكد من أرشفة "${viewRecord?.name || ""}"؟` : `Are you sure you want to archive "${viewRecord?.name || ""}"?`)
            : confirmAction === "single-unarchive"
            ? (isAr ? `هل أنت متأكد من إلغاء أرشفة "${viewRecord?.name || ""}"؟` : `Are you sure you want to unarchive "${viewRecord?.name || ""}"?`)
            : (isAr ? `هل أنت متأكد من حذف "${viewRecord?.name || ""}"؟` : `Are you sure you want to delete "${viewRecord?.name || ""}"?`)
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

  // Show list
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
                  onClick: () => router.push(`/${locale}/portal/import/associations`),
                }] : []),
                ...(hasPermission(path, "export") ? [{
                  label: tCommon("export"),
                  icon: <Download size={14} className="text-violet-500" />,
                  onClick: () => setBulkExportOpen(true),
                }] : []),
              ]}
            />
        }
        items={associations}
        searchFields={["name", "manager", "phone", "email"]}
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
      <ExportModal
        isOpen={bulkExportOpen}
        onClose={() => setBulkExportOpen(false)}
        tableName="associations"
        tableLabelAr="الجمعيات"
        availableFields={exportFields}
        selectedIds={selectedIds}
        allRecords={associations}
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
            ? (isAr ? "تأكيد الحذف" : "Confirm Delete")
            : confirmAction?.includes("unarchive")
            ? (isAr ? "تأكيد إلغاء الأرشفة" : "Confirm Unarchive")
            : (isAr ? "تأكيد الأرشفة" : "Confirm Archive")
        }
        message={
          confirmAction === "bulk-delete"
            ? (isAr ? `هل أنت متأكد من رغبتك في حذف ${selectedIds.length} من السجلات المحددة؟` : `Are you sure you want to delete ${selectedIds.length} items?`)
            : confirmAction === "bulk-archive"
            ? (isAr ? `هل أنت متأكد من رغبتك في أرشفة ${selectedIds.length} من السجلات المحددة؟` : `Are you sure you want to archive ${selectedIds.length} items?`)
            : confirmAction === "bulk-unarchive"
            ? (isAr ? `هل أنت متأكد من رغبتك في إلغاء أرشفة ${selectedIds.length} من السجلات المحددة؟` : `Are you sure you want to unarchive ${selectedIds.length} items?`)
            : confirmAction === "single-archive"
            ? (isAr ? `هل أنت متأكد من أرشفة "${viewRecord?.name || ""}"؟` : `Are you sure you want to archive "${viewRecord?.name || ""}"?`)
            : confirmAction === "single-unarchive"
            ? (isAr ? `هل أنت متأكد من إلغاء أرشفة "${viewRecord?.name || ""}"؟` : `Are you sure you want to unarchive "${viewRecord?.name || ""}"?`)
            : (isAr ? `هل أنت متأكد من حذف "${viewRecord?.name || ""}"؟` : `Are you sure you want to delete "${viewRecord?.name || ""}"?`)
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

      {/* Edit Researcher Modal */}
      {editingResearcher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setEditingResearcher(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Pencil size={18} className="text-primary dark:text-tertiary" />
                <span>{isAr ? "تعديل بيانات الباحث الاجتماعي" : "Edit Social Researcher"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingResearcher(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? "اسم الباحث الاجتماعي" : "Researcher Name"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editResName}
                  onChange={(e) => setEditResName(e.target.value)}
                  className={`w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border rounded-xl outline-none text-slate-900 dark:text-white ${
                    editResErrors.name ? "border-red-500" : "border-slate-200 dark:border-slate-700"
                  }`}
                />
                {editResErrors.name && (
                  <p className="mt-1 text-xs text-red-500 font-semibold">{editResErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? "البريد الإلكتروني" : "Email Address"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={editResEmail}
                  disabled={editingResearcher.status === "active"}
                  onChange={(e) => setEditResEmail(e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-xl outline-none ${
                    editingResearcher.status === "active"
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border-slate-200 dark:border-slate-800"
                      : `bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white ${
                          editResErrors.email ? "border-red-500" : "border-slate-200 dark:border-slate-700"
                        }`
                  }`}
                />
                {editingResearcher.status === "active" ? (
                  <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                    {isAr ? "الباحث نشط في النظام، تم قفل تعديل البريد الإلكتروني." : "Researcher is active; email field is locked."}
                  </p>
                ) : (
                  editResErrors.email && (
                    <p className="mt-1 text-xs text-red-500 font-semibold">{editResErrors.email}</p>
                  )
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingResearcher(null)}
                className="px-4 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleUpdateResearcher}
                disabled={updatingResearcher}
                className="px-4 py-2 text-xs font-bold bg-primary dark:bg-tertiary text-white rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {updatingResearcher && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>{updatingResearcher ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ التغييرات" : "Save Changes")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
