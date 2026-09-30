"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  User,
  Mail,
  Shield,
  ShieldCheck,
  KeyRound,
  Check,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/lib/ToastContext";
import AttachmentField from "@/components/ui/AttachmentField";
import { createChangePasswordSchema, createUpdateProfileSchema } from "@/lib/zodSchemas";

interface AttachmentData {
  id: number;
  url: string;
  name: string;
  originalName: string;
  mimetype: string;
  fileSize: number;
}

interface ProfileClientProps {
  initialUser: {
    id: number;
    name: string | null;
    email: string;
    role: string;
    roleAr: string;
    roleType?: string;
    status: string;
    imageAttachment?: AttachmentData | null;
  };
  isAr: boolean;
}

export default function ProfileClient({ initialUser, isAr }: ProfileClientProps) {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const tVal = useTranslations("validation");

  const [activeTab, setActiveTab] = useState<"profile" | "password" | "security">("profile");

  // Profile Fields
  const [name, setName] = useState(initialUser.name || "");
  const [email, setEmail] = useState(initialUser.email);
  const [avatarAttachment, setAvatarAttachment] = useState<AttachmentData | null>(
    initialUser.imageAttachment || null
  );

  // Password Change Fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Handle Profile Update (Name, Email, Avatar Attachment)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    const updateProfileSchema = createUpdateProfileSchema(tVal);
    const parseResult = updateProfileSchema.safeParse({
      name: name.trim(),
      imageId: avatarAttachment ? avatarAttachment.id : null,
    });

    if (!parseResult.success) {
      const errors: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        const field = issue.path[0] as string;
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setSavingProfile(true);

    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          imageId: avatarAttachment ? avatarAttachment.id : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isAr ? "فشل تحديث البيانات" : "Failed to update profile"));
      }

      showToast(
        isAr ? "تم تحديث الملف الشخصي بنجاح!" : "Profile updated successfully!",
        "success"
      );

      await refreshUser();
    } catch (err: any) {
      setErrorMsg(err.message || (isAr ? "حدث خطأ أثناء الحفظ" : "Error saving profile"));
      showToast(err.message || (isAr ? "حدث خطأ أثناء الحفظ" : "Error saving profile"), "error");
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Change with Zod Schema Validation and Professional Error Handling
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    // Step 1: Validate with Zod schema on client first for immediate feedback
    const changePasswordSchema = createChangePasswordSchema(tVal);
    const parseResult = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!parseResult.success) {
      const errors: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        const field = (issue.path[0] as string) || "newPassword";
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setSavingPassword(true);

    try {
      // Step 2: Send to server -> server verifies currentPassword with DB FIRST, and then validates newPassword
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.field) {
          setFieldErrors({ [data.field]: data.error });
        }
        throw new Error(data.error || (isAr ? "فشل تغيير كلمة المرور" : "Failed to change password"));
      }

      showToast(
        isAr ? "تم تغيير كلمة المرور بنجاح!" : "Password updated successfully!",
        "success"
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setFieldErrors({});
    } catch (err: any) {
      setErrorMsg(err.message || (isAr ? "حدث خطأ أثناء تغيير كلمة المرور" : "Error changing password"));
    } finally {
      setSavingPassword(false);
    }
  };

  // Real-time Password Strength Calculation
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

  const criteriaCount = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

  let strengthLabel = isAr ? "ضعيفة جداً" : "Very Weak";
  let strengthBgClass = "bg-rose-500";
  let strengthWidthClass = "w-1/5";

  if (criteriaCount >= 5) {
    strengthLabel = isAr ? "قوية جداً وآمنة" : "Very Strong";
    strengthBgClass = "bg-emerald-500";
    strengthWidthClass = "w-full";
  } else if (criteriaCount >= 3) {
    strengthLabel = isAr ? "متوسطة القوة" : "Medium";
    strengthBgClass = "bg-amber-500";
    strengthWidthClass = criteriaCount === 3 ? "w-3/5" : "w-4/5";
  } else if (criteriaCount >= 1) {
    strengthLabel = isAr ? "ضعيفة" : "Weak";
    strengthBgClass = "bg-rose-500";
    strengthWidthClass = criteriaCount === 1 ? "w-1/5" : "w-2/5";
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-sm flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => {
            setActiveTab("profile");
            setErrorMsg(null);
            setFieldErrors({});
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "profile"
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
          }`}
        >
          <User size={15} />
          <span>{isAr ? "البيانات الشخصية" : "Personal Profile"}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("password");
            setErrorMsg(null);
            setFieldErrors({});
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "password"
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
          }`}
        >
          <KeyRound size={15} />
          <span>{isAr ? "تغيير كلمة المرور" : "Change Password"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Avatar & Overview */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
          <div className="space-y-3 w-full flex flex-col items-center">
            <AttachmentField
              value={avatarAttachment}
              onChange={(file) => setAvatarAttachment(file as AttachmentData | null)}
              imageOnly
              accept="image/*"
              maxSize={10}
              locale={isAr ? "ar" : "en"}
            />
          </div>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-4">
            {name || (isAr ? "مستخدم بدون اسم" : "Unnamed User")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 dir-ltr">{email}</p>

          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary dark:text-tertiary border border-primary/20">
            <Shield size={13} />
            <span className="text-[11px] font-bold">
              {isAr ? initialUser.roleAr : initialUser.role}
            </span>
          </div>

          <div className="w-full border-t border-slate-100 dark:border-slate-800/80 mt-6 pt-5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-500">{isAr ? "حالة الحساب" : "Status"}</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {initialUser.status === "active" ? (isAr ? "نشط" : "Active") : initialUser.status}
              </span>
            </div>
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          {errorMsg && (
            <div className="p-3.5 mb-5 text-xs bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: Profile & Email Info */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? "تعديل البيانات الشخصية" : "Personal Information"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isAr
                    ? "يمكنك تعديل اسمك الكامل والبريد الإلكتروني والصورة الشخصية بمرونة."
                    : "Update your full name, email address, and profile avatar."}
                </p>
              </div>

              <form noValidate onSubmit={handleUpdateProfile} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? "الاسم الكامل" : "Full Name"}
                  </label>
                  <div className="relative">
                    <User className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: "" });
                      }}
                      placeholder={isAr ? "أدخل اسمك الكامل" : "Enter your full name"}
                      className={`w-full ps-9 pe-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/45 ${
                        fieldErrors.name
                          ? "border-rose-500 dark:border-rose-500"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    />
                  </div>
                  {fieldErrors.name && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">{fieldErrors.name}</p>
                  )}
                </div>

                {/* Email Address (Editable) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? "البريد الإلكتروني" : "Email Address"}
                  </label>
                  <div className="relative">
                    <Mail className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                      type="email"
                      value={email}
                      disabled
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@domain.com"
                      className="w-full ps-9 pe-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/45"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl transition-all cursor-pointer shadow-md shadow-primary/10 flex items-center gap-2 disabled:opacity-50"
                  >
                    {savingProfile ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                    <span>{isAr ? "حفظ التغييرات" : "Save Changes"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Change Password */}
          {activeTab === "password" && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? "تغيير كلمة المرور" : "Change Password"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isAr
                    ? "اختر كلمة مرور قوية وآمنة تطابق معايير الأمان لحماية حسابك."
                    : "Choose a strong password matching security standards."}
                </p>
              </div>

              <form noValidate onSubmit={handleChangePassword} className="space-y-5">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? "كلمة المرور الحالية" : "Current Password"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        if (fieldErrors.currentPassword) setFieldErrors({ ...fieldErrors, currentPassword: "" });
                      }}
                      placeholder="********"
                      className={`w-full ps-9 pe-10 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/45 ${
                        fieldErrors.currentPassword
                          ? "border-rose-500 dark:border-rose-500"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {fieldErrors.currentPassword && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">{fieldErrors.currentPassword}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isAr ? "كلمة المرور الجديدة" : "New Password"}
                    </label>
                    <div className="relative">
                      <Lock className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (fieldErrors.newPassword) setFieldErrors({ ...fieldErrors, newPassword: "" });
                        }}
                        placeholder="********"
                        className={`w-full ps-9 pe-10 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/45 ${
                          fieldErrors.newPassword
                            ? "border-rose-500 dark:border-rose-500"
                            : "border-slate-200 dark:border-slate-800"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {fieldErrors.newPassword && (
                      <p className="text-[11px] text-rose-500 font-medium mt-1">{fieldErrors.newPassword}</p>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isAr ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}
                    </label>
                    <div className="relative">
                      <Lock className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: "" });
                        }}
                        placeholder="********"
                        className={`w-full ps-9 pe-10 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/45 ${
                          fieldErrors.confirmPassword
                            ? "border-rose-500 dark:border-rose-500"
                            : "border-slate-200 dark:border-slate-800"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="text-[11px] text-rose-500 font-medium mt-1">{fieldErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                {/* Password Strength Guidelines Box & Visual Progress Bar */}
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                      <ShieldCheck size={16} className="text-primary dark:text-tertiary" />
                      <span>{isAr ? "اشتراطات قوة كلمة المرور:" : "Password Strength Guidelines:"}</span>
                    </div>

                    {newPassword && (
                      <span className={`font-bold text-xs ${
                        criteriaCount >= 5 ? "text-emerald-600 dark:text-emerald-400" :
                        criteriaCount >= 3 ? "text-amber-500" : "text-rose-500"
                      }`}>
                        {strengthLabel}
                      </span>
                    )}
                  </div>

                  {newPassword && (
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strengthBgClass} ${strengthWidthClass}`}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div
                      className={`flex items-center gap-1.5 ${
                        hasMinLength
                          ? "text-emerald-600 font-bold dark:text-emerald-400"
                          : "text-slate-400"
                      }`}
                    >
                      <CheckCircle2 size={13} />
                      <span>{isAr ? "8 أحرف على الأقل" : "Min 8 characters"}</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        hasUppercase
                          ? "text-emerald-600 font-bold dark:text-emerald-400"
                          : "text-slate-400"
                      }`}
                    >
                      <CheckCircle2 size={13} />
                      <span>{isAr ? "حرف كبير واحد (A-Z) على الأقل" : "One uppercase letter"}</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        hasLowercase
                          ? "text-emerald-600 font-bold dark:text-emerald-400"
                          : "text-slate-400"
                      }`}
                    >
                      <CheckCircle2 size={13} />
                      <span>{isAr ? "حرف صغير واحد (a-z) على الأقل" : "One lowercase letter"}</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        hasNumber
                          ? "text-emerald-600 font-bold dark:text-emerald-400"
                          : "text-slate-400"
                      }`}
                    >
                      <CheckCircle2 size={13} />
                      <span>{isAr ? "رقم واحد (0-9) على الأقل" : "One number"}</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 sm:col-span-2 ${
                        hasSpecial
                          ? "text-emerald-600 font-bold dark:text-emerald-400"
                          : "text-slate-400"
                      }`}
                    >
                      <CheckCircle2 size={13} />
                      <span>{isAr ? "رمز خاص واحد على الأقل (مثل @$!%*?&)" : "One special character (e.g. @$!%*?&)"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl transition-all cursor-pointer shadow-md shadow-primary/10 flex items-center gap-2 disabled:opacity-50"
                  >
                    {savingPassword ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                    <span>{isAr ? "تحديث كلمة المرور" : "Update Password"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
