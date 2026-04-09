import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * AISummary — generates a 2-3 sentence plain-language summary of an article.
 * Props:
 *   title    {string}  - manuscript title
 *   abstract {string}  - manuscript abstract
 *   compact  {boolean} - if true, shows a smaller inline style (for cards)
 */
export default function AISummary({ title, abstract, compact = false }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const generate = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (summary) { setExpanded(v => !v); return; }
    setLoading(true);
    setExpanded(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a science communicator. Given the following research article title and abstract, write a concise 2-3 sentence plain-language summary that captures the core findings and methodology. Be factual, clear, and avoid jargon where possible.

Title: ${title}

Abstract: ${abstract}

Respond with only the summary text — no headings, no bullet points.`
    });
    setSummary(result);
    setLoading(false);
  };

  if (compact) {
    return (
      <div className="mt-2">
        {!expanded && !loading && (
          <button
            onClick={generate}
            className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 font-medium"
          >
            <Sparkles className="w-3 h-3" /> AI Summary
          </button>
        )}
        {loading && (
          <div className="space-y-1.5 mt-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        )}
        {summary && expanded && (
          <div className="mt-1.5 p-2 bg-teal-50 border border-teal-100 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1 text-xs font-semibold text-teal-700">
                <Sparkles className="w-3 h-3" /> AI Summary
              </span>
              <button onClick={(e) => { e.preventDefault(); setExpanded(false); }} className="text-teal-400 hover:text-teal-600">
                <ChevronUp className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-teal-900 leading-relaxed">{summary}</p>
          </div>
        )}
      </div>
    );
  }

  // Full (detail page) mode
  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50/40 overflow-hidden">
      <button
        onClick={generate}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-teal-50 transition-colors"
      >
        <span className="flex items-center gap-2 font-semibold text-teal-800">
          <Sparkles className="w-4 h-4 text-teal-500" />
          AI-Generated Summary
        </span>
        {summary
          ? (expanded ? <ChevronUp className="w-4 h-4 text-teal-500" /> : <ChevronDown className="w-4 h-4 text-teal-500" />)
          : <span className="text-xs text-teal-600 font-normal">Click to generate</span>
        }
      </button>

      {(loading || (summary && expanded)) && (
        <div className="px-5 pb-4 border-t border-teal-100">
          {loading ? (
            <div className="space-y-2 pt-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/4" />
              <p className="text-xs text-teal-500 pt-1">Generating summary…</p>
            </div>
          ) : (
            <p className="text-sm text-slate-700 leading-relaxed pt-3">{summary}</p>
          )}
        </div>
      )}
    </div>
  );
}