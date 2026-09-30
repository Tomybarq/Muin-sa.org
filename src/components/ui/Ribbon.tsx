export interface RibbonProps {
  title: string;
  color?: "danger" | "success" | "warning" | "info";
  locale?: string;
}

const colorMap = {
  danger: { bg: "bg-red-500", dark: "bg-red-600", shadow: "shadow-red-500/30" },
  success: { bg: "bg-emerald-500", dark: "bg-emerald-600", shadow: "shadow-emerald-500/30" },
  warning: { bg: "bg-amber-500", dark: "bg-amber-600", shadow: "shadow-amber-500/30" },
  info: { bg: "bg-blue-500", dark: "bg-blue-600", shadow: "shadow-blue-500/30" },
};

export default function Ribbon({ title, color = "danger", locale }: RibbonProps) {
  const { bg } = colorMap[color];
  const isAr = locale === "ar";

  return (
    <div
      className={`absolute ${isAr ? "top-[38px] left-[38px]" : "top-[38px] right-[38px]"} w-48 sm:w-52 ${bg} text-white text-xs sm:text-sm font-bold py-1.5 shadow-md z-10 text-center tracking-wide pointer-events-none select-none flex items-center justify-center`}
      style={{
        transform: isAr ? "translate(-50%, -50%) rotate(-45deg)" : "translate(50%, -50%) rotate(45deg)",
      }}
    >
      {title}
    </div>
  );
}
