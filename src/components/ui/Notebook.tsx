"use client";

import React, { useState, useRef } from "react";

interface Tab {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface NotebookProps {
  tabs: Tab[];
  defaultTabId?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export default function Notebook({ tabs, defaultTabId, activeTab: controlledActiveTab, onTabChange, className = "" }: NotebookProps) {
  const initialTab = tabs.find((t) => t.id === defaultTabId)?.id || tabs[0]?.id;
  const [internalActiveTab, setInternalActiveTab] = useState(initialTab);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const handleTabClick = (tabId: string) => {
    setInternalActiveTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  return (
    <div className={`w-full mt-6 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm ${className}`}>
      {/* Scrollable Tab Headers */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
        <div 
          ref={containerRef}
          className="flex gap-1 overflow-x-auto scrollbar-none snap-x snap-mandatory px-4 py-2.5 -mb-px"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={`snap-align-none px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-primary dark:bg-tertiary text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40"
                }`}
              >
                {tab.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Content */}
      <div className="p-4 sm:p-5">
        {tabs.map((tab) => {
          if (activeTab !== tab.id) return null;
          return (
            <div key={tab.id} className="animate-in fade-in duration-200">
              {tab.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
