"use client";

import React, { useState } from "react";
import { Plus, Trash2, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { createPhoneNumberSchema } from "@/lib/zodSchemas";

interface DynamicPhoneNumbersInputProps {
  value: string[];
  onChange: (phones: string[]) => void;
  disabled?: boolean;
  isAr?: boolean;
  label?: string;
}

export default function DynamicPhoneNumbersInput({
  value = [],
  onChange,
  disabled = false,
  isAr = true,
  label,
}: DynamicPhoneNumbersInputProps) {
  const tVal = useTranslations("validation");
  const [newPhone, setNewPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const phoneSchema = createPhoneNumberSchema(tVal);

  const handleAdd = () => {
    const trimmed = newPhone.trim();
    if (!trimmed) return;

    const validationResult = phoneSchema.safeParse(trimmed);
    if (!validationResult.success) {
      setErrorMsg(validationResult.error.issues[0]?.message || tVal("phoneFormatInvalid"));
      return;
    }

    if (value.includes(trimmed)) {
      setErrorMsg(isAr ? "رقم الهاتف مضاف مسبقاً" : "Phone number is already added");
      return;
    }

    setErrorMsg(null);
    onChange([...value, trimmed]);
    setNewPhone("");
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}

      {!disabled && (
        <div className="space-y-1">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => {
                  setNewPhone(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                placeholder={isAr ? "أدخل رقم الهاتف واضغط إضافة..." : "Enter phone number and press add..."}
                className={`w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 transition-colors ps-9 ${
                  errorMsg
                    ? "border-red-500 dark:border-red-400 focus:ring-red-500"
                    : "border-slate-200 dark:border-slate-800 focus:ring-primary dark:focus:ring-tertiary"
                } ${newPhone ? "dir-ltr text-left" : "text-start"}`}
              />
              <Phone size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newPhone.trim()}
              className="px-3.5 py-2 text-xs font-bold bg-primary dark:bg-tertiary text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Plus size={14} />
              <span>{isAr ? "إضافة" : "Add"}</span>
            </button>
          </div>

          {errorMsg && (
            <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
              {errorMsg}
            </p>
          )}
        </div>
      )}

      {/* List of Added Numbers */}
      {value.length === 0 ? (
        <p className="text-[11px] text-slate-400 italic">
          {isAr ? "لم يتم إضافة أرقام تواصل بعد." : "No phone numbers added yet."}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2 pt-1">
          {value.map((phoneNum, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              <Phone size={12} className="text-primary dark:text-tertiary shrink-0" />
              <span className="dir-ltr">{phoneNum}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="text-slate-400 hover:text-rose-500 transition-colors p-0.5 ms-1 cursor-pointer"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
