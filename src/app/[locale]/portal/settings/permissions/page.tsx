"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { AddButton, EditButton } from "@/components/ui/ActionButtons";
import RoleFormModal from "@/components/portal/RoleFormModal";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/lib/ToastContext";

interface RoleRecord {
  id: number;
  name: string;
  nameAr?: string | null;
  type?: string;
  permissions: {
    screenId: number;
    actions: string[];
    screen?: {
      id: number;
      name: string;
      nameAr?: string | null;
      path: string;
    };
  }[];
}

interface ScreenRecord {
  id: number;
  name: string;
  nameAr?: string | null;
  path: string;
}

export default function PermissionsSettingsPage() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const params = useParams();
  const currentLocale = (params?.locale as string) || "ar";
  const isAr = currentLocale === "ar";
  const { user } = useAuth();
  const { showToast } = useToast();

  const isSuperAdmin = user?.roleType === "superadmin";

  useEffect(() => {
    // If not loading and not superadmin, let layout redirect
  }, [user, isSuperAdmin]);

  if (!user || !isSuperAdmin) {
    return null;
  }

  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [screens, setScreens] = useState<ScreenRecord[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);

  const loadRolesAndScreensData = async () => {
    setLoadingRoles(true);
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
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    loadRolesAndScreensData();
  }, []);

  const handleSaveRole = async (name: string, nameAr: string, permissions: { screenId: number; actions: string[] }[]) => {
    try {
      const isEdit = !!editingRole;
      const url = isEdit ? `/api/roles/${editingRole.id}` : "/api/roles";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, nameAr, permissions }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(
          isEdit
            ? isAr
              ? "تم تعديل الصلاحية بنجاح"
              : "Role updated successfully"
            : isAr
            ? "تم إنشاء الصلاحية الجديدة بنجاح"
            : "Role created successfully",
          "success"
        );
        loadRolesAndScreensData();
      } else {
        throw new Error(data.error || "Failed to save role");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to save role", "error");
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {isAr ? "إدارة الصلاحيات" : "Manage Permissions"}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {isAr ? "إدارة وتعديل الصلاحيات المتاحة لكل دور من أدوار المنصة" : "Manage and modify access permissions for each platform role"}
        </p>
        <div className="flex items-center gap-3 mt-4">
          <AddButton
            label={isAr ? "إضافة صلاحية جديدة" : "Add New Role"}
            onClick={() => {
              setEditingRole(null);
              setIsModalOpen(true);
            }}
          />
        </div>
      </div>

      {loadingRoles ? (
        <TableSkeleton rowCount={3} />
      ) : (
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          {roles.length === 0 ? (
            <p className="text-xs text-slate-500">{tCommon("noData")}</p>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className="p-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      {isAr && role.nameAr ? role.nameAr : role.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      ID: {role.id}
                    </span>
                  </div>

                  <div className="h-px bg-slate-200/60 dark:bg-slate-800" />

                  <div className="space-y-2">
                    {role.permissions.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">
                        {isAr ? "لا توجد صلاحيات شاشات محددة" : "No screen permissions assigned"}
                      </p>
                    ) : (
                      role.permissions.map((p) => {
                        const screenObj = p.screen || screens.find((s) => s.id === p.screenId);
                        const screenName = isAr && screenObj?.nameAr ? screenObj.nameAr : (screenObj?.name || `Screen ${p.screenId}`);
                        const screenPath = screenObj?.path || "";
                        return (
                          <div key={p.screenId} className="flex flex-col gap-1.5 p-2 bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-slate-800 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                {screenName}
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {screenPath}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {(!p.actions || p.actions.length === 0) ? (
                                <span className="text-[9px] text-slate-400 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700">
                                  {isAr ? "لا يوجد أزرار" : "No buttons"}
                                </span>
                              ) : (
                                p.actions.map((act) => {
                                  let color = "bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-800 dark:text-slate-400";
                                  let label = act;
                                  if (act === "view") {
                                    color = "bg-tertiary/10 text-tertiary border-tertiary/20";
                                    label = isAr ? "عرض" : "View";
                                  } else if (act === "create") {
                                    color = "bg-primary/10 text-primary border-primary/20";
                                    label = isAr ? "إضافة" : "Create";
                                  } else if (act === "edit") {
                                    color = "bg-[#F9A826]/10 text-[#F9A826] border-[#F9A826]/20";
                                    label = isAr ? "تعديل" : "Edit";
                                  } else if (act === "delete") {
                                    color = "bg-rose-500/10 text-rose-500 border-rose-500/20";
                                    label = isAr ? "حذف" : "Delete";
                                  } else if (act === "archive") {
                                    color = "bg-amber-500/10 text-amber-500 border-amber-500/20";
                                    label = isAr ? "أرشفة" : "Archive";
                                  }
                                  return (
                                    <span key={act} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${color}`}>
                                      {label}
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  {role.type === "superadmin" ? (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1.5 rounded-lg border border-rose-100 dark:border-rose-900/30 flex items-center gap-1">
                      <Lock size={10} />
                      {isAr ? "صلاحيات النظام كاملة (غير قابلة للتعديل)" : "Full System Perms (Locked)"}
                    </span>
                  ) : (
                    <div className="flex-1" />
                  )}
                  {role.type !== "superadmin" && (
                    <EditButton
                      label={isAr ? "تعديل الصلاحيات" : "Edit Permissions"}
                      onClick={() => {
                        setEditingRole(role);
                        setIsModalOpen(true);
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

      <RoleFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRole(null);
        }}
        onSave={handleSaveRole}
        initialData={editingRole}
        screens={screens}
        isAr={isAr}
      />
    </div>
  );
}
