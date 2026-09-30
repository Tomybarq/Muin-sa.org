"use client";

import React, { useState, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eraser,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  isAr?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "اكتب محتوى الحقيبة التسويقية هنا...",
  isAr = true,
}: RichTextEditorProps) {
  const [editorRef, setEditorRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editorRef && editorRef.innerHTML !== value) {
      if (document.activeElement !== editorRef) {
        editorRef.innerHTML = value || "";
      }
    }
  }, [value, editorRef]);

  const handleExec = (e: React.MouseEvent, command: string, val: string | undefined = undefined) => {
    e.preventDefault(); // Prevent editor from losing focus/selection when clicking toolbar buttons
    if (editorRef) {
      editorRef.focus();
    }
    document.execCommand(command, false, val);
    if (editorRef) {
      onChange(editorRef.innerHTML);
    }
  };

  return (
    <div className="w-full border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/60 overflow-hidden transition-all focus-within:ring-2 focus-within:ring-primary/20">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 text-xs select-none">
        <button
          type="button"
          onMouseDown={(e) => handleExec(e, "bold")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
          title={isAr ? "غامق (Bold)" : "Bold"}
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => handleExec(e, "italic")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
          title={isAr ? "مائل (Italic)" : "Italic"}
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => handleExec(e, "underline")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
          title={isAr ? "تحته خط (Underline)" : "Underline"}
        >
          <UnderlineIcon size={15} />
        </button>

        <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

        <button
          type="button"
          onMouseDown={(e) => handleExec(e, "fontSize", "6")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors font-bold text-xs"
          title={isAr ? "تكبير الخط كبير جداً H1" : "Heading 1 Size"}
        >
          H1
        </button>
        <button
          type="button"
          onMouseDown={(e) => handleExec(e, "fontSize", "5")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors font-bold text-xs"
          title={isAr ? "تكبير الخط كبير H2" : "Heading 2 Size"}
        >
          H2
        </button>
        <button
          type="button"
          onMouseDown={(e) => handleExec(e, "fontSize", "4")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors font-bold text-xs"
          title={isAr ? "تكبير الخط متوسط H3" : "Heading 3 Size"}
        >
          H3
        </button>

        <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

        <button
          type="button"
          onMouseDown={(e) => handleExec(e, "justifyRight")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
          title={isAr ? "محاذاة لليمين" : "Align Right"}
        >
          <AlignRight size={15} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => handleExec(e, "justifyCenter")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
          title={isAr ? "محاذاة للوسط" : "Align Center"}
        >
          <AlignCenter size={15} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => handleExec(e, "justifyLeft")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
          title={isAr ? "محاذاة لليسار" : "Align Left"}
        >
          <AlignLeft size={15} />
        </button>

        <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

        <button
          type="button"
          onMouseDown={(e) => handleExec(e, "insertUnorderedList")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
          title={isAr ? "قائمة نقطية" : "Bullet List"}
        >
          <List size={15} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => handleExec(e, "insertOrderedList")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
          title={isAr ? "قائمة رقمية" : "Ordered List"}
        >
          <ListOrdered size={15} />
        </button>

        <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

        <button
          type="button"
          onMouseDown={(e) => handleExec(e, "removeFormat")}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-rose-500 transition-colors"
          title={isAr ? "مسح التنسيق" : "Clear Format"}
        >
          <Eraser size={15} />
        </button>
      </div>

      {/* Editable Container */}
      <div
        ref={(el) => setEditorRef(el)}
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        className="min-h-[220px] max-h-[450px] overflow-y-auto p-4 text-sm text-slate-800 dark:text-slate-100 focus:outline-none leading-relaxed [&_ul]:list-disc [&_ul]:ms-6 [&_ol]:list-decimal [&_ol]:ms-6 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-2 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-1"
        style={{ direction: isAr ? "rtl" : "ltr" }}
        data-placeholder={placeholder}
      />
    </div>
  );
}
