import React, { useState } from "react";
import { checkPlagiarism } from "@/functions/checkPlagiarism";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, Shield, Loader2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

const riskConfig = {
  low:    { color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: ShieldCheck, bar: "bg-emerald-500", label: "Low Risk" },
  medium: { color: "bg-amber-100 text-amber-700 border-amber-200",   icon: ShieldAlert, bar: "bg-amber-500",   label: "Medium Risk" },
  high:   { color: "bg-red-100 text-red-700 border-red-200",         icon: Shield,      bar: "bg-red-500",     label: "High Risk" },
};

const severityColors = {
  low:    "text-slate-500",
  medium: "text-amber-600",
  high:   "text-red-600",
};

const issueLabels = {
  possible_verbatim:       "Possible Verbatim Copy",
  boilerplate:             "Boilerplate Language",
  style_inconsistency:     "Style Inconsistency",
  self_plagiarism_risk:    "Self-Plagiarism Risk",
};

export default function PlagiarismReport({ manuscript, onReportUpdated }) {
  const report = manuscript.plagiarism_report;
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRescreen = async () => {
    setLoading(true);
    try {
      await checkPlagiarism({ manuscript_id: manuscript.id });
      setError(null);
      if (onReportUpdated) onReportUpdated();
    } catch {
      setError("Plagiarism screening is unavailable (integration credits exhausted). Credits reset on 2026-05-25.");
    }
    setLoading(false);
  };

  if (!report && !loading) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-3 bg-slate-50 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Shield className="w-4 h-4" />
            <span>No plagiarism screen run yet</span>
          </div>
          <Button size="sm" variant="outline" onClick={handleRescreen} disabled={loading}>
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <><RefreshCw className="w-3 h-3 mr-1" /> Screen Now</>}
          </Button>
        </div>
        {error && <p className="text-xs text-amber-600">{error}</p>}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm text-purple-700">
        <Loader2 className="w-4 h-4 animate-spin" />
        Running plagiarism screen…
      </div>
    );
  }

  const cfg = riskConfig[report.risk_level] || riskConfig.low;
  const RiskIcon = cfg.icon;
  const score = Math.min(100, Math.max(0, report.similarity_score || 0));

  return (
    <div className={`rounded-xl border overflow-hidden ${cfg.color}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <RiskIcon className="w-5 h-5" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Plagiarism Screen</span>
              <Badge className={`text-xs border ${cfg.color}`}>{cfg.label}</Badge>
              {report.recommendation === 'reject_submission' && (
                <Badge className="text-xs bg-red-200 text-red-800 border-red-300">Reject Recommended</Badge>
              )}
              {report.recommendation === 'flag_for_review' && (
                <Badge className="text-xs bg-amber-200 text-amber-800 border-amber-300">Flag for Review</Badge>
              )}
              {report.recommendation === 'clear' && (
                <Badge className="text-xs bg-emerald-200 text-emerald-800 border-emerald-300">Clear</Badge>
              )}
            </div>
            <p className="text-xs opacity-70 mt-0.5">
              Screened {report.screened_at ? new Date(report.screened_at).toLocaleDateString() : 'recently'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Score gauge */}
          <div className="text-right">
            <p className="text-2xl font-bold leading-none">{score}%</p>
            <p className="text-xs opacity-70">similarity</p>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={handleRescreen} className="h-7 px-2 opacity-70 hover:opacity-100">
              <RefreshCw className="w-3 h-3" />
            </Button>
            <button onClick={() => setExpanded(e => !e)} className="opacity-70 hover:opacity-100">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Similarity bar */}
      <div className="h-1.5 bg-black/10">
        <div className={`h-full ${cfg.bar} transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="bg-white border-t border-current/10 p-4 space-y-4">
          {/* Summary */}
          {report.summary && (
            <p className="text-sm text-slate-700 leading-relaxed">{report.summary}</p>
          )}

          {/* Flagged sections */}
          {report.flagged_sections && report.flagged_sections.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Flagged Sections ({report.flagged_sections.length})
              </p>
              {report.flagged_sections.map((flag, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {issueLabels[flag.issue_type] || flag.issue_type}
                    </Badge>
                    <span className={`text-xs font-semibold ${severityColors[flag.severity] || ''}`}>
                      {flag.severity} severity
                    </span>
                  </div>
                  {flag.text_excerpt && (
                    <blockquote className="text-xs text-slate-600 italic border-l-2 border-amber-400 pl-2 mb-1">
                      "{flag.text_excerpt}"
                    </blockquote>
                  )}
                  <p className="text-xs text-slate-600">{flag.explanation}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle className="w-4 h-4" />
              No specific sections flagged.
            </div>
          )}
        </div>
      )}
    </div>
  );
}