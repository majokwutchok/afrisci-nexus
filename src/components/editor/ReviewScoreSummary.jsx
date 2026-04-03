import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Users, TrendingUp, AlertTriangle, CheckCircle, RotateCcw, XCircle } from "lucide-react";

const CRITERIA = [
  { key: "originality",  label: "Originality & Novelty",     weight: 0.25 },
  { key: "methodology",  label: "Methodology & Rigor",       weight: 0.30 },
  { key: "clarity",      label: "Clarity & Presentation",    weight: 0.15 },
  { key: "significance", label: "Significance & Impact",     weight: 0.20 },
  { key: "references",   label: "Literature & References",   weight: 0.10 },
];

const REC_CONFIG = {
  accept:          { label: "Accept",          color: "bg-green-100 text-green-800 border-green-200",  icon: CheckCircle,  iconColor: "text-green-600"  },
  minor_revision:  { label: "Minor Revision",  color: "bg-blue-100 text-blue-800 border-blue-200",    icon: RotateCcw,    iconColor: "text-blue-600"   },
  major_revision:  { label: "Major Revision",  color: "bg-orange-100 text-orange-800 border-orange-200", icon: AlertTriangle, iconColor: "text-orange-600" },
  reject:          { label: "Reject",          color: "bg-red-100 text-red-800 border-red-200",        icon: XCircle,      iconColor: "text-red-600"    },
};

function scoreToRecommendation(score) {
  if (score >= 4.2) return "accept";
  if (score >= 3.3) return "minor_revision";
  if (score >= 2.3) return "major_revision";
  return "reject";
}

function weightedScore(ratings) {
  if (!ratings) return null;
  let total = 0, weight = 0;
  CRITERIA.forEach(c => {
    if (ratings[c.key] != null) {
      total += ratings[c.key] * c.weight;
      weight += c.weight;
    }
  });
  return weight > 0 ? total / weight : null;
}

export default function ReviewScoreSummary({ manuscript, onDecisionSuggested }) {
  const completedReviews = useMemo(
    () => (manuscript.review_history || []).filter(r => r.status === "completed"),
    [manuscript]
  );

  const aggregateData = useMemo(() => {
    if (!completedReviews.length) return null;

    // Per-criterion averages
    const criteriaAvg = CRITERIA.map(c => {
      const vals = completedReviews.map(r => r.ratings?.[c.key]).filter(v => v != null);
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      return { ...c, avg };
    });

    // Weighted aggregate
    const scores = completedReviews.map(r => weightedScore(r.ratings)).filter(s => s != null);
    const aggregateScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

    // Recommendation tally
    const recTally = {};
    completedReviews.forEach(r => {
      if (r.recommendation) recTally[r.recommendation] = (recTally[r.recommendation] || 0) + 1;
    });

    const suggestedDecision = aggregateScore != null ? scoreToRecommendation(aggregateScore) : null;

    return { criteriaAvg, aggregateScore, recTally, suggestedDecision, reviewCount: completedReviews.length };
  }, [completedReviews]);

  if (!completedReviews.length) {
    return (
      <Card className="border border-slate-200 bg-slate-50">
        <CardContent className="p-4 text-center text-sm text-slate-500">
          No completed reviews yet — scores will appear here once reviewers submit.
        </CardContent>
      </Card>
    );
  }

  const { criteriaAvg, aggregateScore, recTally, suggestedDecision, reviewCount } = aggregateData;
  const suggestedConfig = suggestedDecision ? REC_CONFIG[suggestedDecision] : null;
  const SuggestedIcon = suggestedConfig?.icon;

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-teal-600" />
          Aggregate Review Score Summary
          <Badge variant="outline" className="ml-auto text-xs flex items-center gap-1">
            <Users className="w-3 h-3" /> {reviewCount} reviewer{reviewCount !== 1 ? "s" : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Overall Aggregate Score */}
        {aggregateScore != null && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <div>
                <p className="text-xs text-teal-700 font-medium">Weighted Aggregate Score</p>
                <p className="text-xs text-slate-500">Across all criteria & reviewers</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-3xl font-extrabold ${
                aggregateScore >= 4 ? "text-green-600" : aggregateScore >= 3 ? "text-amber-600" : "text-red-600"
              }`}>
                {aggregateScore.toFixed(2)}
              </span>
              <span className="text-slate-400 text-sm"> / 5</span>
            </div>
          </div>
        )}

        {/* Per-Criterion Averages */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Criteria Breakdown</p>
          {criteriaAvg.map(c => (
            <div key={c.key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-700 font-medium">{c.label}</span>
                <span className="flex items-center gap-2">
                  <span className="text-slate-400">weight {Math.round(c.weight * 100)}%</span>
                  <span className={`font-bold ${
                    c.avg == null ? "text-slate-400" : c.avg >= 4 ? "text-green-600" : c.avg >= 3 ? "text-amber-600" : "text-red-600"
                  }`}>
                    {c.avg != null ? c.avg.toFixed(1) : "N/A"}
                  </span>
                </span>
              </div>
              <Progress
                value={c.avg != null ? (c.avg / 5) * 100 : 0}
                className="h-1.5"
              />
            </div>
          ))}
        </div>

        {/* Reviewer Recommendations Tally */}
        {Object.keys(recTally).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Reviewer Recommendations</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(recTally).map(([rec, count]) => {
                const cfg = REC_CONFIG[rec];
                if (!cfg) return null;
                const Icon = cfg.icon;
                return (
                  <span key={rec} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
                    <Icon className={`w-3.5 h-3.5 ${cfg.iconColor}`} />
                    {cfg.label} × {count}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Suggested Decision */}
        {suggestedDecision && suggestedConfig && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">System Suggested Decision</p>
            <div className={`flex items-center justify-between p-3 rounded-xl border ${suggestedConfig.color}`}>
              <div className="flex items-center gap-2">
                <SuggestedIcon className={`w-5 h-5 ${suggestedConfig.iconColor}`} />
                <span className="font-bold text-sm">{suggestedConfig.label}</span>
                <span className="text-xs opacity-70">based on aggregate score {aggregateScore?.toFixed(2)}</span>
              </div>
              {onDecisionSuggested && (
                <button
                  onClick={() => onDecisionSuggested(suggestedDecision)}
                  className="text-xs underline font-semibold opacity-80 hover:opacity-100"
                >
                  Apply
                </button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}