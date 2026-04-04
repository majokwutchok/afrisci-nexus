import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, UserCheck, Star, ChevronDown, ChevronUp } from "lucide-react";

/**
 * AIReviewerMatcher
 * Scores all reviewers against a manuscript's abstract + keywords using LLM
 * and returns a ranked shortlist with match rationale.
 */
export default function AIReviewerMatcher({ manuscript, allUsers, onSelectReviewer }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const reviewerProfiles = allUsers
    .filter(u => u.reviewer_status === "active" || u.role === "admin")
    .map(u => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      expertise: u.research_interests || [],
      affiliation: u.affiliation || "",
    }));

  const runMatching = async () => {
    if (reviewerProfiles.length === 0) return;
    setLoading(true);
    setSuggestions(null);

    const prompt = `
You are an academic journal editor. Your task is to match reviewers to a manuscript.

MANUSCRIPT:
Title: ${manuscript.title}
Abstract: ${manuscript.abstract || "(no abstract provided)"}
Keywords: ${(manuscript.keywords || []).join(", ")}

REVIEWER PROFILES:
${reviewerProfiles.map((r, i) => `${i + 1}. Name: ${r.full_name} | Email: ${r.email} | Affiliation: ${r.affiliation} | Expertise: ${r.expertise.join(", ") || "Not specified"}`).join("\n")}

Rank the TOP 5 most suitable reviewers for this manuscript. For each, provide:
- email (exact match from the list above)
- match_score (integer 0-100)
- match_reason (1-2 sentences explaining why they are a good fit based on expertise overlap with the manuscript topic and keywords)
- conflict_risk (low/medium/high - estimate based on overlapping affiliations with any manuscript author)

Return ONLY valid JSON, no explanation.
`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                email: { type: "string" },
                match_score: { type: "number" },
                match_reason: { type: "string" },
                conflict_risk: { type: "string" },
              }
            }
          }
        }
      }
    });

    // Enrich with user profile data
    const enriched = (result.suggestions || []).map(s => {
      const profile = reviewerProfiles.find(r => r.email === s.email);
      return { ...s, full_name: profile?.full_name || s.email };
    });

    setSuggestions(enriched);
    setExpanded(true);
    setLoading(false);
  };

  const riskColor = (risk) => ({
    low: "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-red-100 text-red-700",
  }[risk] || "bg-slate-100 text-slate-600");

  const scoreColor = (score) =>
    score >= 75 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-500";

  return (
    <div className="border border-purple-200 rounded-xl bg-gradient-to-br from-purple-50 to-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-semibold text-purple-900">AI Reviewer Matching</span>
          {suggestions && (
            <Badge className="bg-purple-100 text-purple-700 text-xs">{suggestions.length} matched</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {suggestions && (
            <button onClick={() => setExpanded(e => !e)} className="text-slate-400 hover:text-slate-600">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          <Button
            size="sm"
            onClick={runMatching}
            disabled={loading || reviewerProfiles.length === 0}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-7 px-3"
          >
            {loading
              ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Analyzing...</>
              : <><Sparkles className="w-3 h-3 mr-1" />{suggestions ? "Re-run" : "Find Reviewers"}</>}
          </Button>
        </div>
      </div>

      {reviewerProfiles.length === 0 && (
        <div className="px-4 pb-3 text-xs text-slate-500">No active reviewers found in the system.</div>
      )}

      {expanded && suggestions && suggestions.length > 0 && (
        <div className="border-t border-purple-100 divide-y divide-purple-50">
          {suggestions.map((s, i) => (
            <div key={s.email} className="flex items-start gap-3 px-4 py-3 hover:bg-purple-50/50 transition-colors">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-800">{s.full_name}</span>
                  <span className="text-xs text-slate-500">{s.email}</span>
                  <span className={`text-xs font-bold ${scoreColor(s.match_score)}`}>
                    <Star className="w-3 h-3 inline mr-0.5" />{s.match_score}%
                  </span>
                  {s.conflict_risk && (
                    <Badge className={`text-xs ${riskColor(s.conflict_risk)}`}>
                      {s.conflict_risk} conflict risk
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{s.match_reason}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSelectReviewer(s.email)}
                className="flex-shrink-0 h-7 text-xs border-purple-300 hover:bg-purple-100"
              >
                <UserCheck className="w-3 h-3 mr-1" /> Select
              </Button>
            </div>
          ))}
        </div>
      )}

      {expanded && suggestions && suggestions.length === 0 && (
        <div className="px-4 pb-3 text-xs text-slate-500 border-t border-purple-100 pt-3">
          No strong reviewer matches found. Try adding reviewer profiles with expertise areas.
        </div>
      )}
    </div>
  );
}