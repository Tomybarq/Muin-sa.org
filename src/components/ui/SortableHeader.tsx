import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface SortableHeaderProps {
  sortColumn: string | null;
  sortDirection: "asc" | "desc";
  field: string;
  onSort: (field: string) => void;
  children: React.ReactNode;
  className?: string;
}

export default function SortableHeader({
  sortColumn,
  sortDirection,
  field,
  onSort,
  children,
  className = "",
}: SortableHeaderProps) {
  const isActive = sortColumn === field;
  const Icon = isActive
    ? sortDirection === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <th
      onClick={() => onSort(field)}
      className={`cursor-pointer select-none group ${className}`}
    >
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        <span>{children}</span>
        <Icon
          size={12}
          className={`shrink-0 transition-all ${
            isActive
              ? "text-primary dark:text-tertiary opacity-100"
              : "text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100"
          }`}
        />
      </div>
    </th>
  );
}
