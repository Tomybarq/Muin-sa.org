"use client";

import React from "react";

interface TableSkeletonProps {
  rowCount?: number;
}

export default function TableSkeleton({ rowCount = 4 }: TableSkeletonProps) {
  return (
    <div className="w-full border border-slate-100 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-white dark:bg-[#0F172A] shadow-sm animate-pulse">
      {/* Table Header skeleton */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#1E293B]/50 p-4">
        <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-800 mx-2" />
        <div className="flex-1 grid grid-cols-4 gap-4">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
        </div>
      </div>
      {/* Table Rows skeleton */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
        {Array.from({ length: rowCount }).map((_, rIdx) => (
          <div key={rIdx} className="flex items-center p-5 gap-4">
            {/* Checkbox placeholder */}
            <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-800 mx-2" />
            
            {/* Columns placeholders */}
            <div className="flex-1 grid grid-cols-4 gap-4 items-center">
              {/* Name */}
              <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
              {/* Email */}
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-4/5" />
              {/* Role */}
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-20" />
              {/* Status */}
              <div className="h-5 bg-slate-100 dark:bg-slate-700 rounded-full w-12" />
            </div>
            {/* Actions placeholder */}
            <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
