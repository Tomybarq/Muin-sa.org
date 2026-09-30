import { SaudiRiyalIcon } from "./SaudiRiyalIcon";

interface CurrencyFieldProps {
  label?: string;
  value: number | null;
  onChange: (v: number | null) => void;
  disabled?: boolean;
  error?: boolean;
}

export function CurrencyField({ label, value, onChange, disabled, error }: CurrencyFieldProps) {
  const finBaseCls = "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-tertiary transition-colors";
  const finDisabledCls = "w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 cursor-default transition-colors";
  const finLabelCls = "block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5";

  function inputCls() {
    if (disabled) return error ? `${finDisabledCls.replace("border-slate-200 dark:border-slate-800", "border-red-500 dark:border-red-400")} pl-8` : `${finDisabledCls} pl-8`;
    if (error) return `${finBaseCls.replace("border-slate-200 dark:border-slate-800", "border-red-500 dark:border-red-400").replace("focus:ring-primary dark:focus:ring-tertiary", "focus:ring-red-500 dark:focus:ring-red-400")} pl-8`;
    return `${finBaseCls} pl-8`;
  }

  return (
    <div>
      {label && <label className={finLabelCls}>{label}</label>}
      <div className="relative">
        <input
          type="number"
          min={0}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          disabled={disabled}
          className={inputCls()}
        />
        <span className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none text-slate-400 dark:text-slate-500">
          <SaudiRiyalIcon size={14} />
        </span>
      </div>
    </div>
  );
}
