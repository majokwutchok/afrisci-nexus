import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Edit3, FileText } from "lucide-react";

const SECTIONS = [
  { key: "introduction", label: "Introduction" },
  { key: "methods", label: "Materials & Methods" },
  { key: "results", label: "Results" },
  { key: "discussion", label: "Discussion" },
  { key: "conclusion", label: "Conclusion" },
  { key: "references", label: "References" },
];

/**
 * Props:
 *  value: string (free-form body text)
 *  onChange: (newValue: string) => void
 *  compact: boolean — hides section buttons (for use inside wizard step)
 */
export default function ArticleBodyEditor({ value = "", onChange, compact = false }) {
  const [mode, setMode] = useState("write"); // "write" | "structured"

  const insertSection = (label) => {
    const heading = `\n\n## ${label}\n\n`;
    onChange(value + heading);
  };

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
          <button
            type="button"
            onClick={() => setMode("write")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === "write" ? "bg-white shadow text-blue-700" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Edit3 className="w-3.5 h-3.5" /> Free Write
          </button>
          <button
            type="button"
            onClick={() => setMode("structured")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === "structured" ? "bg-white shadow text-blue-700" : "text-slate-500 hover:text-slate-700"}`}
          >
            <FileText className="w-3.5 h-3.5" /> Structured Sections
          </button>
        </div>
        {!compact && (
          <span className="text-xs text-slate-400">{value.trim().split(/\s+/).filter(Boolean).length} words</span>
        )}
      </div>

      {/* Section insertion buttons (structured mode) */}
      {mode === "structured" && (
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map(s => (
            <button
              key={s.key}
              type="button"
              onClick={() => insertSection(s.label)}
              className="px-3 py-1 text-xs rounded-full border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              + {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Editor textarea */}
      <textarea
        rows={compact ? 10 : 18}
        className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y leading-relaxed"
        placeholder={
          mode === "structured"
            ? "Click a section above to insert a heading, then type your content below it.\n\n## Introduction\n\nYour introduction here...\n\n## Materials & Methods\n\nDescribe your methods..."
            : "Write your full article body here. Include introduction, methods, results, discussion, and conclusions."
        }
        value={value}
        onChange={e => onChange(e.target.value)}
      />

      {/* Word count */}
      <p className="text-xs text-slate-400 text-right">
        {value.trim().split(/\s+/).filter(Boolean).length} words
      </p>
    </div>
  );
}