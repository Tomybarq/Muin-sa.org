"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter, usePathname, useSearchParams } from "next/navigation";
import { Users, ShieldAlert, Download, Eye, EyeOff, CheckCircle2, ShieldCheck, Mail } from "lucide-react";
import { BulkActionMenu } from "@/components/ui/ActionButtons";
import SortableHeader from "@/components/ui/SortableHeader";
import SearchViews, { FilterPreset, GroupByOption } from "@/components/portal/SearchViews";
import ListViews from "@/components/portal/ListViews";
import FormViews from "@/components/portal/FormViews";
import Select from "@/components/ui/Select";
import UserPermissionsModal from "@/components/portal/UserPermissionsModal";
import TableSkeleton from "@/components/ui/TableSkeleton";
import ExportModal from "@/components/ui/ExportModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/lib/ToastContext";
import { createPasswordSchema } from "@/lib/zodSchemas";
import { encodeId, decodeId } from "@/lib/idObfuscator";
import { z } from "zod";

interface UserRecord {
  id: number;
  email: string;
  name: string | null;
  roleId: number;
  role: { name: string; nameAr?: string | null; type?: string };
  status: string;
  isArchived: boolean;
  createdAt: string;
  associationId: number | null;
  association: { id: number; name: string } | null;
  imageId?: number | null;
  imageUrl?: string | null;
}

interface RoleRecord {
  id: number;
  name: string;
  nameAr?: string | null;
  type?: string;
}

interface ScreenRecord {
  id: number;
  name: string;
  nameAr?: string | null;
  path: string;
}

export default function UsersSettingsPage() {
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const tVal = useTranslations("validation");
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLocale = (params?.locale as string) || "ar";
  const isAr = currentLocale === "ar";
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const path = "/portal/settings/users";

  // List state
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [screens, setScreens] = useState<ScreenRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Form state
  const [formMode, setFormMode] = useState<"view" | "create" | "edit">("view");
  const [viewRecord, setViewRecord] = useState<UserRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendingInvite, setSendingInvite] = useState(false);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formConfirmPassword, setFormConfirmPassword] = useState("");
  const [formRoleId, setFormRoleId] = useState<number>(0);
  const [showFormConfirmPassword, setShowFormConfirmPassword] = useState(false);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | false>>({});

  // User permissions modal
  const [isUserPermsOpen, setIsUserPermsOpen] = useState(false);
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<{ id: number; name: string } | null>(null);

  // Confirm dialog
  const [confirmAction, setConfirmAction] = useState<"single-delete" | "bulk-archive" | "bulk-unarchive" | "single-archive" | "single-unarchive" | null>(null);

  // Export
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // URL params
  const recordId = searchParams.get("id");
  const recordNumericId = recordId ? decodeId(recordId) : null;
  const isNew = searchParams.get("new") === "true";

  const currentIndex = recordNumericId ? users.findIndex((u) => u.id === recordNumericId) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < users.length - 1;

  // --- Data Loading ---
  const loadUsersData = async () => {
    setLoadingUsers(true);
    try {
      const [resActive, resArchived] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/users?archived=true"),
      ]);
      const dataActive = await resActive.json();
      const dataArchived = await resArchived.json();
      const allUsers = [
        ...(dataActive.users || []),
        ...(dataArchived.users || []),
      ];
      const uniqueUsers = Array.from(
        new Map(allUsers.map((u: UserRecord) => [u.id, u])).values()
      );
      setUsers(uniqueUsers as UserRecord[]);
      setArchivedLoaded(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
      setLoading(false);
    }
  };

  const loadRolesAndScreensData = async () => {
    try {
      const [resRoles, resScreens] = await Promise.all([
        fetch("/api/roles"),
        fetch("/api/screens"),
      ]);
      const dataRoles = await resRoles.json();
      const dataScreens = await resScreens.json();
      if (dataRoles.roles) setRoles(dataRoles.roles);
      if (dataScreens.screens) setScreens(dataScreens.screens);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadUsersData();
    loadRolesAndScreensData();
  }, []);

  // --- Load record when URL changes ---
  useEffect(() => {
    if (recordNumericId && !isNew) {
      const record = users.find((u) => u.id === recordNumericId);
      if (record) {
        setViewRecord(record);
        setFormName(record.name || "");
        setFormEmail(record.email);
        setFormRoleId(record.roleId);
        setFormPassword("");
        setFormConfirmPassword("");
        setFormMode("view");
        setLoading(false);
      } else if (!loadingUsers) {
        // Record not found, could be archived - try fetching both active and archived
        Promise.all([
          fetch("/api/users"),
          fetch("/api/users?archived=true"),
        ]).then(async ([resActive, resArchived]) => {
          const dataActive = await resActive.json();
          const dataArchived = await resArchived.json();
          const allUsers = [
            ...(dataActive.users || []),
            ...(dataArchived.users || []),
          ];
          // Deduplicate by id
          const uniqueUsers = Array.from(
            new Map(allUsers.map((u: UserRecord) => [u.id, u])).values()
          );
          setUsers(uniqueUsers as UserRecord[]);
          const found = uniqueUsers.find((u: any) => u.id === recordNumericId);
          if (found) {
            setViewRecord(found as UserRecord);
            setFormName((found as UserRecord).name || "");
            setFormEmail((found as UserRecord).email);
            setFormRoleId((found as UserRecord).roleId);
            setFormPassword("");
            setFormConfirmPassword("");
            setFormMode("view");
          }
          setLoading(false);
        });
      }
    } else if (isNew) {
      setViewRecord(null);
      setFormMode("create");
      setFormName("");
      setFormEmail("");
      setFormPassword("");
      setFormConfirmPassword("");
      setShowFormPassword(false);
      setShowFormConfirmPassword(false);
      // Default to ADMIN role
      const adminRole = roles.find((r) => r.type === "admin");
      setFormRoleId(adminRole?.id || 0);
      setFieldErrors({});
      setLoading(false);
    } else {
      setViewRecord(null);
      setFormMode("view");
      setLoading(false);
    }
  }, [recordNumericId, isNew, users, loadingUsers, roles]);

  // --- Navigation ---
  const navigateToList = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const handleAddClick = () => {
    router.push(pathname + "?new=true", { scroll: false });
  };

  const handleRowClick = (record: UserRecord) => {
    if (!hasPermission(path, "view")) return;
    router.push(pathname + "?id=" + encodeId(record.id), { scroll: false });
  };

  const handleEditMode = () => {
    setFormMode("edit");
  };

  const handleCancel = () => {
    if (formMode === "edit" && viewRecord) {
      setFormName(viewRecord.name || "");
      setFormEmail(viewRecord.email);
      setFormRoleId(viewRecord.roleId);
      setFormPassword("");
      setFormConfirmPassword("");
      setShowFormPassword(false);
      setShowFormConfirmPassword(false);
      setFieldErrors({});
      setFormMode("view");
    } else {
      navigateToList();
    }
  };

  const navigatePrev = () => {
    if (hasPrev) {
      const prevId = users[currentIndex - 1].id;
      router.replace(pathname + "?id=" + encodeId(prevId), { scroll: false });
    }
  };

  const navigateNext = () => {
    if (hasNext) {
      const nextId = users[currentIndex + 1].id;
      router.replace(pathname + "?id=" + encodeId(nextId), { scroll: false });
    }
  };

  // --- Zod Form Schema ---
  const userFormSchema = z.object({
    name: z.string().trim().min(1, { message: t("nameRequired") }),
    email: z.string().trim().min(1, { message: t("invalidEmail") }).email({ message: t("invalidEmail") }),
    roleId: z.number().min(1, { message: t("selectUserTypeError") }),
  });

  // --- CRUD ---
  const handleSave = async () => {
    setFieldErrors({});

    // 1. Zod Validation for basic form fields
    const validationResult = userFormSchema.safeParse({
      name: formName,
      email: formEmail,
      roleId: formRoleId,
    });

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (key && !errors[key]) {
          errors[key] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    // 2. Password Validation (only in edit mode when password is changed by superadmin)
    if (formMode === "edit" && formPassword) {
      const passwordSchema = createPasswordSchema(tVal);
      const pwResult = passwordSchema.safeParse(formPassword);
      if (!pwResult.success) {
        setFieldErrors({ password: pwResult.error.issues[0]?.message || "" });
        return;
      }
      if (formPassword !== formConfirmPassword) {
        setFieldErrors({ confirmPassword: t("passwordMismatch") });
        return;
      }
    }

    setSubmitting(true);
    try {
      if (formMode === "create") {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            email: formEmail,
            roleId: formRoleId,
            locale: currentLocale,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          showToast(t("createSuccess"), "success");
          setUsers((prev) => [...prev, data.user]);
          setViewRecord(data.user);
          setFormMode("view");
          router.replace(pathname + "?id=" + encodeId(data.user.id), { scroll: false });
        } else {
          if (data.field) setFieldErrors({ [data.field]: data.error });
          showToast(data.error || t("createFail"), "error");
        }
      } else if (formMode === "edit" && viewRecord) {
        const body: any = {
          name: formName.trim(),
          email: formEmail,
          roleId: formRoleId,
        };
        if (formPassword) body.password = formPassword;

        const res = await fetch(`/api/users/${viewRecord.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (res.ok) {
          showToast(t("updateSuccess"), "success");
          setUsers((prev) => prev.map((u) => (u.id === viewRecord.id ? data.user : u)));
          setViewRecord(data.user);
          setFormPassword("");
          setFormMode("view");
        } else {
          if (data.field) setFieldErrors({ [data.field]: data.error });
          showToast(data.error || t("updateFail"), "error");
        }
      }
    } catch (err) {
      showToast(t("saveError"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Send/Resend Invitation ---
  const handleSendInvite = async () => {
    if (!viewRecord || sendingInvite) return;
    setSendingInvite(true);
    try {
      const res = await fetch(`/api/users/${viewRecord.id}/resend-invite`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        showToast(t("inviteSentSuccess"), "success");
      } else {
        showToast(data.error || t("inviteSentFail"), "error");
      }
    } catch (err) {
      showToast(t("inviteSentFail"), "error");
    } finally {
      setSendingInvite(false);
    }
  };

  // --- Archive/Unarchive ---
  const handleArchive = () => setConfirmAction("single-archive");
  const handleUnarchive = () => setConfirmAction("single-unarchive");

  const executeSingleArchive = async () => {
    setConfirmAction(null);
    if (!viewRecord) return;
    try {
      const res = await fetch(`/api/users/${viewRecord.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      });
      if (res.ok) {
        showToast(t("archiveSuccess"), "success");
        setUsers((prev) => prev.map((u) => (u.id === viewRecord.id ? { ...u, isArchived: true } : u)));
        setViewRecord((prev) => (prev ? { ...prev, isArchived: true } : null));
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to archive", "error");
      }
    } catch {
      showToast("Error archiving user", "error");
    }
  };

  const executeSingleUnarchive = async () => {
    setConfirmAction(null);
    if (!viewRecord) return;
    try {
      const res = await fetch(`/api/users/${viewRecord.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: false }),
      });
      if (res.ok) {
        showToast(t("unarchiveSuccess"), "success");
        setUsers((prev) => prev.map((u) => (u.id === viewRecord.id ? { ...u, isArchived: false } : u)));
        setViewRecord((prev) => (prev ? { ...prev, isArchived: false } : null));
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to unarchive", "error");
      }
    } catch {
      showToast("Error unarchiving user", "error");
    }
  };

  // --- Bulk Actions (Archive Only) ---
  const [archivedLoaded, setArchivedLoaded] = useState(false);
  const [fetchingArchived, setFetchingArchived] = useState(false);

  const fetchArchivedUsers = useCallback(async () => {
    if (archivedLoaded || fetchingArchived) return;
    setFetchingArchived(true);
    try {
      const res = await fetch("/api/users?archived=true");
      if (res.ok) {
        const data = await res.json();
        if (data.users) {
          setUsers((prev) => {
            const existingIds = new Set(prev.map((u) => u.id));
            const newArchived = data.users.filter((u: UserRecord) => !existingIds.has(u.id));
            return [...prev, ...newArchived];
          });
        }
        setArchivedLoaded(true);
      }
    } catch (err) {
      console.error("Error fetching archived users:", err);
    } finally {
      setFetchingArchived(false);
    }
  }, [archivedLoaded, fetchingArchived]);

  const handleSelectAll = (visibleItems: UserRecord[]) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectable = visibleItems.filter((u) => u.role?.type !== "superadmin");
    if (e.target.checked) {
      setSelectedIds(selectable.map((u) => u.id));
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

  const handleBulkAction = (action: "delete" | "archive" | "unarchive") => {
    if (action === "archive") setConfirmAction("bulk-archive");
    else if (action === "unarchive") setConfirmAction("bulk-unarchive");
  };

  const executeBulkArchive = async () => {
    setConfirmAction(null);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/users/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isArchived: true }),
          })
        )
      );
      showToast(t("bulkArchiveSuccess"), "success");
      setUsers((prev) => prev.map((u) => (selectedIds.includes(u.id) ? { ...u, isArchived: true } : u)));
      setSelectedIds([]);
    } catch {
      showToast("Error archiving users", "error");
    }
  };

  const executeBulkUnarchive = async () => {
    setConfirmAction(null);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/users/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isArchived: false }),
          })
        )
      );
      showToast(t("bulkUnarchiveSuccess"), "success");
      setUsers((prev) => prev.map((u) => (selectedIds.includes(u.id) ? { ...u, isArchived: false } : u)));
      setSelectedIds([]);
    } catch {
      showToast("Error unarchiving users", "error");
    }
  };

  // --- Delete ---
  const handleDelete = () => setConfirmAction("single-delete");
  const executeSingleDelete = async () => {
    setConfirmAction(null);
    if (!viewRecord) return;
    try {
      const res = await fetch(`/api/users/${viewRecord.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast(t("deleteSuccess"), "success");
        setUsers((prev) => prev.filter((u) => u.id !== viewRecord.id));
        navigateToList();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to delete", "error");
      }
    } catch {
      showToast("Error deleting user", "error");
    }
  };

  // --- Filter Presets ---
  const filterPresets: FilterPreset[] = [
    {
      id: "archived-items",
      label: t("showArchived"),
      filterFunc: (item: any) => {
        if (!archivedLoaded && !fetchingArchived) {
          fetchArchivedUsers();
        }
        return !!item.isArchived;
      },
    },
    ...roles.map((r) => ({
      id: `role-${r.id}`,
      label: isAr && r.nameAr ? r.nameAr : r.name,
      filterFunc: (item: UserRecord) => item.roleId === r.id,
    })),
    {
      id: "status-active",
      label: t("active"),
      filterFunc: (item: UserRecord) => item.status === "active",
    },
    {
      id: "status-inactive",
      label: t("inactive"),
      filterFunc: (item: UserRecord) => item.status === "inactive",
    },
  ];

  // --- Group By Options ---
  const groupByOptions: GroupByOption[] = [
    {
      id: "role",
      label: t("userType"),
      groupByFunc: (item: UserRecord) =>
        isAr && item.role?.nameAr ? item.role.nameAr : item.role?.name || "Unknown",
    },
    {
      id: "status",
      label: t("status"),
      groupByFunc: (item: UserRecord) =>
        item.status === "active" ? t("active") : item.status === "inactive" ? t("inactive") : item.status,
    },
  ];

  // --- Export Fields ---
  const exportFields = [
    { key: "name", label: "Name", labelAr: "الاسم" },
    { key: "email", label: "Email", labelAr: "البريد الإلكتروني" },
    { key: isAr ? "role.nameAr" : "role.name", label: "User Type", labelAr: "نوع المستخدم" },
    { key: "status", label: "Status", labelAr: "الحالة" },
  ];

  // --- Password Strength ---
  const pwHasMinLength = formPassword.length >= 8;
  const pwHasUppercase = /[A-Z]/.test(formPassword);
  const pwHasLowercase = /[a-z]/.test(formPassword);
  const pwHasNumber = /\d/.test(formPassword);
  const pwHasSpecial = /[^A-Za-z0-9]/.test(formPassword);
  const pwCriteriaCount = [pwHasMinLength, pwHasUppercase, pwHasLowercase, pwHasNumber, pwHasSpecial].filter(Boolean).length;

  let pwStrengthLabel = t("veryWeak");
  let pwStrengthBg = "bg-rose-500";
  let pwStrengthWidth = "w-1/5";
  if (pwCriteriaCount >= 5) {
    pwStrengthLabel = t("veryStrong");
    pwStrengthBg = "bg-emerald-500";
    pwStrengthWidth = "w-full";
  } else if (pwCriteriaCount >= 3) {
    pwStrengthLabel = t("medium");
    pwStrengthBg = "bg-amber-500";
    pwStrengthWidth = pwCriteriaCount === 3 ? "w-3/5" : "w-4/5";
  } else if (pwCriteriaCount >= 1) {
    pwStrengthLabel = t("weak");
    pwStrengthBg = "bg-rose-500";
    pwStrengthWidth = pwCriteriaCount === 1 ? "w-1/5" : "w-2/5";
  }

  // --- Admin roles only for selection ---
  const creatableRoles = roles.filter(
    (r) => r.type === "admin" || r.name === "DATA_MANAGER" || r.nameAr?.includes("مدير البيانات")
  );

  // --- Table Renderers ---
  const cellPad = "p-3 sm:p-4";

  const renderTableHeader = (
    visibleItems: UserRecord[],
    sortInfo?: { sortColumn: string | null; sortDirection: "asc" | "desc"; onSort: (field: string) => void }
  ) => (
    <thead>
      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1E293B]/50 text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs font-semibold uppercase">
        <th className={`${cellPad} text-start w-12`}>
          <input
            type="checkbox"
            checked={selectedIds.length > 0 && visibleItems.filter((u) => u.role?.type !== "superadmin").every((u) => selectedIds.includes(u.id))}
            onChange={handleSelectAll(visibleItems)}
            className="w-4 h-4 rounded text-primary focus:ring-primary border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 accent-primary dark:accent-tertiary cursor-pointer"
          />
        </th>
        <SortableHeader
          sortColumn={sortInfo?.sortColumn ?? null}
          sortDirection={sortInfo?.sortDirection ?? "asc"}
          field="name"
          onSort={sortInfo?.onSort ?? (() => {})}
          className={`${cellPad} text-start`}
        >
          {t("name")}
        </SortableHeader>
        <SortableHeader
          sortColumn={sortInfo?.sortColumn ?? null}
          sortDirection={sortInfo?.sortDirection ?? "asc"}
          field="email"
          onSort={sortInfo?.onSort ?? (() => {})}
          className={`${cellPad} text-start`}
        >
          {t("email")}
        </SortableHeader>
        <SortableHeader
          sortColumn={sortInfo?.sortColumn ?? null}
          sortDirection={sortInfo?.sortDirection ?? "asc"}
          field="role.name"
          onSort={sortInfo?.onSort ?? (() => {})}
          className={`${cellPad} text-start`}
        >
          {t("userType")}
        </SortableHeader>
        <SortableHeader
          sortColumn={sortInfo?.sortColumn ?? null}
          sortDirection={sortInfo?.sortDirection ?? "asc"}
          field="status"
          onSort={sortInfo?.onSort ?? (() => {})}
          className={`${cellPad} text-start`}
        >
          {t("status")}
        </SortableHeader>
      </tr>
    </thead>
  );

  const renderRow = (u: UserRecord) => (
    <tr
      key={u.id}
      onClick={() => handleRowClick(u)}
      className={`text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-[#1E293B]/20 transition-colors ${
        hasPermission(path, "view") ? "cursor-pointer" : ""
      } ${selectedIds.includes(u.id) ? "bg-primary/5 dark:bg-tertiary/5" : ""}`}
    >
      <td className={`${cellPad} text-start`} onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          disabled={u.role?.type === "superadmin"}
          checked={selectedIds.includes(u.id)}
          onChange={(e) => handleSelectRow(u.id, e.target.checked)}
          className="w-4 h-4 rounded text-primary focus:ring-primary border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 accent-primary dark:accent-tertiary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        />
      </td>
      <td className={`${cellPad} font-medium text-slate-900 dark:text-white text-start text-xs sm:text-sm`}>
        <div className="flex items-center gap-2.5">
          {u.imageUrl ? (
            <img
              src={u.imageUrl}
              alt={u.name || u.email}
              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary dark:bg-tertiary/10 dark:text-tertiary font-bold text-xs flex items-center justify-center border border-primary/20 shrink-0">
              {(u.name || u.email || "U").charAt(0).toUpperCase()}
            </div>
          )}
          <span>{u.name || "-"}</span>
        </div>
      </td>
      <td className={`${cellPad} text-start text-xs sm:text-sm`}>{u.email}</td>
      <td className={`${cellPad} text-start`}>
        <span className="inline-flex items-center text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
          {isAr && u.role?.nameAr ? u.role.nameAr : u.role?.name}
        </span>
      </td>
      <td className={`${cellPad} text-start`}>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${
          u.isArchived
            ? "bg-slate-100 text-slate-500 dark:bg-slate-800/40 dark:text-slate-500"
            : u.status === "inactive"
            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
        }`}>
          {u.isArchived
            ? t("archived")
            : u.status === "active"
            ? t("active")
            : u.status === "inactive"
            ? t("inactive")
            : u.status}
        </span>
      </td>
    </tr>
  );

  // --- Form View Styles ---
  const isViewOnly = formMode === "view";
  const inputBase =
    "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-tertiary transition-colors";
  const inputDisabled =
    "w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 cursor-default transition-colors";

  const inputCls = (field: string) =>
    fieldErrors[field]
      ? inputBase.replace("border-slate-200 dark:border-slate-800", "border-red-500 dark:border-red-400")
      : inputBase;

  // --- Show FormViews ---
  if (recordId || isNew) {
    return (
      <>
      <FormViews
        mode={formMode}
        screenName={t("screenName")}
        recordName={viewRecord?.name || viewRecord?.email}
        onSave={handleSave}
        onCancel={handleCancel}
        onAdd={handleAddClick}
        onEdit={handleEditMode}
        onDelete={undefined}
        onArchive={viewRecord?.role?.type !== "superadmin" ? handleArchive : undefined}
        onUnarchive={viewRecord?.role?.type !== "superadmin" ? handleUnarchive : undefined}
        isArchived={viewRecord?.isArchived}
        onNavigatePrev={navigatePrev}
        onNavigateNext={navigateNext}
        hasPrev={hasPrev}
        hasNext={hasNext}
        recordIndex={currentIndex + 1}
        totalRecords={users.length}
        submitting={submitting}
        hasCreatePermission={hasPermission(path, "create")}
        hasEditPermission={hasPermission(path, "edit")}
        hasDeletePermission={false}
        hasArchivePermission={hasPermission(path, "archive")}
        locale={currentLocale}
        onClose={navigateToList}
        ribbon={viewRecord?.isArchived ? { title: t("archived"), color: "danger", locale: currentLocale } : undefined}
        extraActions={[
          ...(formMode === "view" && viewRecord && user?.roleType === "superadmin" && viewRecord.role?.type !== "superadmin" ? [{
            label: t("customPerms"),
            labelAr: t("customPerms"),
            icon: <ShieldAlert size={14} className="text-amber-500" />,
            onClick: () => {
              setSelectedUserForPerms({ id: viewRecord.id, name: viewRecord.name || viewRecord.email });
              setIsUserPermsOpen(true);
            },
          }] : []),
          ...(formMode === "view" && viewRecord && viewRecord.status === "inactive" && !viewRecord.isArchived ? [{
            label: t("sendInvite"),
            labelAr: t("sendInvite"),
            icon: <Mail size={14} className="text-primary dark:text-tertiary" />,
            onClick: handleSendInvite,
            loading: sendingInvite,
          }] : []),
        ]}
      >
        {loading ? (
          <TableSkeleton rowCount={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* User Profile Banner Header */}
            {viewRecord && (
              <div className="md:col-span-2 flex items-center gap-3.5 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 mb-1">
                {viewRecord.imageUrl ? (
                  <img
                    src={viewRecord.imageUrl}
                    alt={viewRecord.name || viewRecord.email}
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 dark:border-tertiary/20 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary dark:bg-tertiary/10 dark:text-tertiary font-extrabold text-lg flex items-center justify-center border-2 border-primary/20 shrink-0">
                    {(viewRecord.name || viewRecord.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{viewRecord.name || viewRecord.email}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{viewRecord.email}</p>
                </div>
              </div>
            )}
            {/* Name */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t("name")} {!isViewOnly && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => { setFormName(e.target.value); setFieldErrors((p) => ({ ...p, name: false })); }}
                readOnly={isViewOnly}
                className={isViewOnly ? inputDisabled : inputCls("name")}
              />
              {fieldErrors.name && <p className="text-[11px] text-rose-500 font-medium">{fieldErrors.name}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t("email")} {!isViewOnly && <span className="text-red-500">*</span>}
              </label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => { setFormEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: false })); }}
                readOnly={isViewOnly}
                className={isViewOnly ? inputDisabled : inputCls("email")}
              />
              {fieldErrors.email && <p className="text-[11px] text-rose-500 font-medium">{fieldErrors.email}</p>}
            </div>

            {/* Role */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t("userType")} {formMode === "create" && <span className="text-red-500">*</span>}
              </label>
              {formMode === "create" ? (
                <Select
                  value={formRoleId}
                  onChange={(val) => setFormRoleId(Number(val))}
                  options={creatableRoles.map((r) => ({
                    value: r.id,
                    label: isAr && r.nameAr ? r.nameAr : r.name,
                  }))}
                  placeholder={t("selectUserType")}
                  error={!!fieldErrors.roleId}
                />
              ) : (
                <input
                  type="text"
                  readOnly
                  value={
                    viewRecord?.role
                      ? isAr && viewRecord.role.nameAr
                        ? viewRecord.role.nameAr
                        : viewRecord.role.name
                      : ""
                  }
                  className={inputDisabled}
                />
              )}
              {fieldErrors.roleId && <p className="text-[11px] text-rose-500 font-medium">{fieldErrors.roleId}</p>}
            </div>

            {/* Status (view only) */}
            {isViewOnly && viewRecord && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("status")}
                </label>
                <input
                  type="text"
                  readOnly
                  value={
                    viewRecord.isArchived
                      ? t("archived")
                      : viewRecord.status === "active"
                      ? t("active")
                      : viewRecord.status === "inactive"
                      ? t("inactive")
                      : viewRecord.status
                  }
                  className={inputDisabled}
                />
              </div>
            )}

            {/* Association (view only) */}
            {isViewOnly && viewRecord?.association && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("association")}
                </label>
                <input
                  type="text"
                  readOnly
                  value={viewRecord.association.name}
                  className={inputDisabled}
                />
              </div>
            )}
            {/* Invitation Notice in Create Mode */}
            {formMode === "create" && (
              <div className="md:col-span-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-3 my-2">
                <Mail className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" size={20} />
                <div>
                  <strong className="block font-bold text-sm mb-0.5">
                    {isAr ? "إرسال دعوة ترحيبية عبر البريد الإلكتروني" : "Welcome Email Invitation"}
                  </strong>
                  <span className="leading-relaxed">
                    {isAr
                      ? "عند إضافة هذا المستخدم، سيتم إرسال بريد إلكتروني ترحيبي يحتوي على رابط مخصص لتعيين كلمة المرور لأول مرة وتفعيل الحساب."
                      : "Upon creating this account, a welcome email will be sent with a personalized link to set the password and activate the account."}
                  </span>
                </div>
              </div>
            )}

            {/* Password - shown in edit mode only for superadmin */}
            {formMode === "edit" && user?.roleType === "superadmin" && (
              <div className="space-y-1 md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("changePasswordOptional")}
                </label>
                <div className="relative">
                  <input
                    type={showFormPassword ? "text" : "password"}
                    value={formPassword}
                    onChange={(e) => { setFormPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: false })); }}
                    placeholder={t("leaveEmptyToKeep")}
                    className={`${fieldErrors.password
                      ? inputBase.replace("border-slate-200 dark:border-slate-800", "border-red-500 dark:border-red-400")
                      : inputBase
                    } pe-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showFormPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-[11px] text-rose-500 font-medium">{fieldErrors.password}</p>}

                {/* Confirm Password - in edit mode when password is entered */}
                {formPassword && (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t("confirmPassword")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showFormConfirmPassword ? "text" : "password"}
                        value={formConfirmPassword}
                        onChange={(e) => { setFormConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirmPassword: false })); }}
                        className={`${fieldErrors.confirmPassword
                          ? inputBase.replace("border-slate-200 dark:border-slate-800", "border-red-500 dark:border-red-400")
                          : inputBase
                        } pe-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowFormConfirmPassword(!showFormConfirmPassword)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showFormConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && <p className="text-[11px] text-rose-500 font-medium mt-1">{fieldErrors.confirmPassword}</p>}
                  </div>
                )}
                {/* Password Strength Meter */}
                {(formPassword) && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5 mt-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                        <ShieldCheck size={15} className="text-primary dark:text-tertiary" />
                        <span>{t("passwordStrengthTitle")}</span>
                      </div>
                      {formPassword && (
                        <span className={`font-bold text-xs ${
                          pwCriteriaCount >= 5 ? "text-emerald-600 dark:text-emerald-400" :
                          pwCriteriaCount >= 3 ? "text-amber-500" : "text-rose-500"
                        }`}>
                          {pwStrengthLabel}
                        </span>
                      )}
                    </div>
                    {formPassword && (
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${pwStrengthBg} ${pwStrengthWidth}`} />
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                      <div className={`flex items-center gap-1.5 ${pwHasMinLength ? "text-emerald-600 font-bold dark:text-emerald-400" : "text-slate-400"}`}>
                        <CheckCircle2 size={13} /><span>{t("minChars")}</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${pwHasUppercase ? "text-emerald-600 font-bold dark:text-emerald-400" : "text-slate-400"}`}>
                        <CheckCircle2 size={13} /><span>{t("uppercase")}</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${pwHasLowercase ? "text-emerald-600 font-bold dark:text-emerald-400" : "text-slate-400"}`}>
                        <CheckCircle2 size={13} /><span>{t("lowercase")}</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${pwHasNumber ? "text-emerald-600 font-bold dark:text-emerald-400" : "text-slate-400"}`}>
                        <CheckCircle2 size={13} /><span>{t("number")}</span>
                      </div>
                      <div className={`flex items-center gap-1.5 sm:col-span-2 ${pwHasSpecial ? "text-emerald-600 font-bold dark:text-emerald-400" : "text-slate-400"}`}>
                        <CheckCircle2 size={13} /><span>{t("specialChar")}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </FormViews>

      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        tableName="users"
        tableLabelAr="المستخدمين"
        availableFields={exportFields}
        selectedIds={recordNumericId ? [recordNumericId] : []}
        recordId={recordNumericId || undefined}
        allRecords={users}
        screenPath={path}
        locale={currentLocale}
      />

      {isUserPermsOpen && selectedUserForPerms && (
        <UserPermissionsModal
          isOpen={isUserPermsOpen}
          onClose={() => {
            setIsUserPermsOpen(false);
            setSelectedUserForPerms(null);
          }}
          userId={selectedUserForPerms.id}
          userName={selectedUserForPerms.name}
          screens={screens}
          isAr={isAr}
        />
      )}

      <ConfirmDialog
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction === "single-delete") executeSingleDelete();
          else if (confirmAction === "single-archive") executeSingleArchive();
          else if (confirmAction === "single-unarchive") executeSingleUnarchive();
          else if (confirmAction === "bulk-archive") executeBulkArchive();
          else if (confirmAction === "bulk-unarchive") executeBulkUnarchive();
        }}
        title={
          confirmAction?.includes("delete")
            ? t("confirmDelete")
            : confirmAction?.includes("unarchive")
            ? t("confirmUnarchive")
            : t("confirmArchive")
        }
        message={
          confirmAction === "single-delete"
            ? t("confirmDeleteMsg", { name: viewRecord?.name || viewRecord?.email || "" })
            : confirmAction === "single-archive"
            ? t("confirmArchiveMsg", { name: viewRecord?.name || viewRecord?.email || "" })
            : confirmAction === "single-unarchive"
            ? t("confirmUnarchiveMsg", { name: viewRecord?.name || viewRecord?.email || "" })
            : confirmAction === "bulk-archive"
            ? t("confirmBulkArchiveMsg", { count: selectedIds.length })
            : t("confirmBulkUnarchiveMsg", { count: selectedIds.length })
        }
        confirmLabel={
          confirmAction?.includes("delete")
            ? tCommon("delete")
            : confirmAction?.includes("unarchive")
            ? t("cancelArchive")
            : tCommon("archive")
        }
        cancelLabel={tCommon("cancel")}
      />
      </>
    );
  }

  // --- List View ---
  return (
    <div className="space-y-6">
      {loadingUsers ? (
        <TableSkeleton rowCount={4} />
      ) : (
        <SearchViews
          title={t("title")}
          newButtonLabel={t("addUser")}
          onNewClick={handleAddClick}
          hasCreatePermission={hasPermission(path, "create")}
          bulkActionsNode={
            <BulkActionMenu
              selectedIds={selectedIds}
              onAction={handleBulkAction}
              showDelete={false}
              showArchive={hasPermission(path, "archive")}
              showUnarchive={hasPermission(path, "archive")}
              labels={{
                delete: tCommon("delete"),
                archive: tCommon("archive"),
                unarchive: tCommon("unarchive"),
                settings: t("archiveOptions"),
              }}
            />
          }
          items={users}
          searchFields={["name", "email", "role.name", "role.nameAr"]}
          filterPresets={filterPresets}
          groupByOptions={groupByOptions}
          pageSize={40}
          locale={currentLocale}
        >
          {({ currentPageItems, groupedItems, activeGroupBy, expandedGroups, toggleGroup, sortColumn, sortDirection, onSort }) => (
            <ListViews
              renderTableHeader={renderTableHeader}
              renderRow={renderRow}
              emptyIcon={Users}
              emptyTitle={t("emptyTitle")}
              emptyDescription={t("emptyDescription")}
              emptyAction={hasPermission(path, "create") ? {
                label: t("addNewUser"),
                onClick: handleAddClick,
              } : undefined}
              currentPageItems={currentPageItems}
              groupedItems={groupedItems}
              expandedGroups={expandedGroups}
              toggleGroup={toggleGroup}
              locale={currentLocale}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
            />
          )}
        </SearchViews>
      )}

      {/* ConfirmDialog for bulk actions from list view */}
      <ConfirmDialog
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction === "bulk-archive") executeBulkArchive();
          else if (confirmAction === "bulk-unarchive") executeBulkUnarchive();
        }}
        title={
          confirmAction?.includes("unarchive")
            ? t("confirmUnarchive")
            : t("confirmArchive")
        }
        message={
          confirmAction === "bulk-archive"
            ? t("confirmBulkArchiveMsg", { count: selectedIds.length })
            : t("confirmBulkUnarchiveMsg", { count: selectedIds.length })
        }
        confirmLabel={
          confirmAction?.includes("unarchive")
            ? t("cancelArchive")
            : tCommon("archive")
        }
        cancelLabel={tCommon("cancel")}
      />
    </div>
  );
}
