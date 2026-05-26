import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, BookOpen, FileText, RefreshCw, X, ChevronDown, ChevronUp } from "lucide-react";

const INTEREST_OPTIONS = [
  "Medicine & Health", "Agriculture", "Environmental Science", "STEM",
  "Social Sciences", "Law & Policy", "Arts & Humanities", "Business & Economics",
  "Education", "Biotechnology", "Public Health", "Climate Change",
  "Food Security", "Governance", "Technology", "Engineering"
];

const LS_KEY = "afrisci_reading_history";

export function trackArticleView(articleId, articleTitle) {
  try {
    const data = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    const ids = data.ids || [];
    const titles = data.titles || [];
    if (!ids.includes(articleId)) {
      ids.unshift(articleId);
      titles.unshift(articleTitle);
    }
    data.ids = ids.slice(0, 15);
    data.titles = titles.slice(0, 15);
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {}
}

export function trackSearch(query) {
  if (!query?.trim()) return;
  try {
    const data = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    const searches = data.searches || [];
    if (!searches.includes(query.trim())) searches.unshift(query.trim());
    data.searches = searches.slice(0, 10);
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {}
}

function getLocalHistory() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch { return {}; }
}

export default function AIRecommendations() {
  const [interests, setInterests] = useState([]);
  const [showInterestPicker, setShowInterestPicker] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [journals, setJournals] = useState([]);
  const [articles, setArticles] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [expanded, setExpanded] = useState(true);

  // Load saved interests
  useEffect(() => {
    const saved = localStorage.getItem("afrisci_interests");
    if (saved) setInterests(JSON.parse(saved));
  }, []);

  // Load journals & articles for context
  useEffect(() => {
    Promise.all([
      base44.entities.Journal.filter({ status: "active" }, "-created_date", 20),
      base44.entities.Manuscript.filter({ status: "published" }, "-publication_date", 30),
    ]).then(([j, a]) => {
      setJournals(j);
      setArticles(a);
      setDataLoaded(true);
    }).catch(() => setDataLoaded(true));
  }, []);

  const toggleInterest = (interest) => {
    const next = interests.includes(interest)
      ? interests.filter(i => i !== interest)
      : [...interests, interest];
    setInterests(next);
    localStorage.setItem("afrisci_interests", JSON.stringify(next));
  };

  const generateRecommendations = useCallback(async () => {
    if (!dataLoaded) return;
    setLoading(true);
    setRecommendations(null);

    const history = getLocalHistory();

    // Keyword-based matching — no LLM required
    const userTerms = [
      ...interests,
      ...(history.searches || []),
      ...(history.titles || []).flatMap(t => t.split(' ').filter(w => w.length > 4))
    ].map(s => s.toLowerCase());

    const categoryKeywordMap = {
      stem: ['science', 'technology', 'engineering', 'math', 'physics', 'chemistry', 'biology', 'stem'],
      medicine_health: ['medicine', 'health', 'medical', 'clinical', 'disease', 'patient', 'hospital', 'nutrition', 'public health'],
      agriculture_environment: ['agriculture', 'environment', 'farming', 'crop', 'climate', 'ecology', 'food', 'water', 'soil'],
      social_sciences: ['social', 'society', 'community', 'behaviour', 'culture', 'poverty', 'gender', 'policy'],
      law_policy: ['law', 'policy', 'legal', 'governance', 'rights', 'justice', 'regulation'],
      arts_humanities: ['arts', 'humanities', 'history', 'literature', 'language', 'culture', 'philosophy'],
      business_economics: ['business', 'economics', 'finance', 'trade', 'market', 'entrepreneurship'],
      education_pedagogy: ['education', 'teaching', 'learning', 'school', 'university', 'pedagogy', 'curriculum'],
      interdisciplinary: ['interdisciplinary', 'research', 'african', 'innovation'],
    };

    const scoreJournal = (j) => {
      if (userTerms.length === 0) return 50;
      const catTerms = categoryKeywordMap[j.category] || [];
      const allTerms = [...catTerms, ...(j.keywords || []).map(k => k.toLowerCase()), j.title.toLowerCase()];
      const matches = userTerms.filter(t => allTerms.some(at => at.includes(t) || t.includes(at)));
      return Math.min(100, 30 + matches.length * 15);
    };

    const scoreArticle = (a) => {
      if (userTerms.length === 0) return 50;
      const articleTerms = [
        a.title.toLowerCase(),
        ...(a.keywords || []).map(k => k.toLowerCase()),
        (a.abstract || '').toLowerCase().split(' ').filter(w => w.length > 5)
      ].flat();
      const matches = userTerms.filter(t => articleTerms.some(at => at.includes(t) || t.includes(at)));
      return matches.length;
    };

    const scoredJournals = journals
      .map(j => ({ ...j, score: scoreJournal(j) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const scoredArticles = articles
      .map(a => ({ ...a, score: scoreArticle(a) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    const suggested_searches = interests.slice(0, 3).length > 0
      ? interests.slice(0, 3)
      : ['African research', 'open access', 'peer review'];

    setRecommendations({
      journals: scoredJournals.map(j => ({ title: j.title, reason: `Matches your interest in ${j.category?.replace(/_/g, ' ') || 'research'}.` })),
      articles: scoredArticles.map(a => ({ id: a.id, title: a.title, reason: `Published research that aligns with your selected interests.` })),
      suggested_searches
    });

    setLoading(false);
  }, [dataLoaded, interests, journals, articles]);

  // Auto-generate on load once data is ready
  useEffect(() => {
    if (dataLoaded) generateRecommendations();
  }, [dataLoaded]); // eslint-disable-line

  const journalMap = Object.fromEntries(journals.map(j => [j.title?.toLowerCase(), j]));
  const articleMap = Object.fromEntries(articles.map(a => [a.id, a]));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-teal-100 overflow-hidden">
      {/* Header */}
      <div
        className="px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-white" />
          <h2 className="font-bold text-white text-sm uppercase tracking-wide">AI Recommendations</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-white/20 text-white border-0 text-xs">Personalised</Badge>
          {expanded ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Interest Picker */}
          <div>
            <button
              onClick={() => setShowInterestPicker(v => !v)}
              className="text-xs text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              {interests.length ? `${interests.length} interest(s) selected — edit` : "Select your research interests"}
            </button>
            {showInterestPicker && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {INTEREST_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => toggleInterest(opt)}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      interests.includes(opt)
                        ? "bg-teal-500 text-white border-teal-500"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-teal-400"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
                <Button size="sm" className="text-xs h-6 px-3 bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={() => { setShowInterestPicker(false); generateRecommendations(); }}>
                  Apply & Refresh
                </Button>
              </div>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
              <p className="text-xs text-slate-400 text-center">AI is personalising your feed…</p>
            </div>
          )}

          {/* Results */}
          {!loading && recommendations && (
            <div className="space-y-5">
              {/* Journals */}
              {recommendations.journals?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> Recommended Journals
                  </p>
                  <div className="space-y-2">
                    {recommendations.journals.map((j, i) => {
                      const match = journals.find(jj => jj.title?.toLowerCase().includes(j.title?.toLowerCase().slice(0, 20)));
                      return (
                        <Link key={i} to={match ? createPageUrl(`JournalDetail?id=${match.id}`) : createPageUrl("Journals")}>
                          <div className="p-2.5 rounded-lg border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all cursor-pointer">
                            <p className="text-sm font-semibold text-slate-800 leading-snug">{j.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{j.reason}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Articles */}
              {recommendations.articles?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Recommended Articles
                  </p>
                  <div className="space-y-2">
                    {recommendations.articles.map((a, i) => (
                      <Link key={i} to={createPageUrl(`ManuscriptDetail?id=${a.id}`)}>
                        <div className="p-2.5 rounded-lg border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all cursor-pointer">
                          <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">{a.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{a.reason}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Searches */}
              {recommendations.suggested_searches?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Try Searching</p>
                  <div className="flex flex-wrap gap-1.5">
                    {recommendations.suggested_searches.map((s, i) => (
                      <Link key={i} to={createPageUrl(`Search?q=${encodeURIComponent(s)}`)}>
                        <Badge variant="outline" className="text-xs cursor-pointer hover:bg-teal-50 hover:border-teal-400 transition-colors">
                          🔍 {s}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Refresh */}
              <Button
                variant="ghost"
                size="sm"
                onClick={generateRecommendations}
                className="w-full text-xs text-slate-500 hover:text-teal-600"
              >
                <RefreshCw className="w-3 h-3 mr-1" /> Refresh Recommendations
              </Button>
            </div>
          )}

          {!loading && !recommendations && (
            <div className="text-center py-6 space-y-2">
              <Sparkles className="w-8 h-8 text-slate-200 mx-auto" />
              <p className="text-xs text-slate-400">AI recommendations are temporarily unavailable.</p>
              <Button size="sm" onClick={generateRecommendations} variant="outline" className="text-xs">
                <RefreshCw className="w-3 h-3 mr-1" /> Try Again
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}