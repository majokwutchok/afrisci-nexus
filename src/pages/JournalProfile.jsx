import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen, Upload, Globe, Award, CheckCircle, FileText, Users,
  Calendar, Download, Eye, ExternalLink, Mail, ArrowRight,
  TrendingUp, Star, Rss
} from "lucide-react";
import { format } from "date-fns";

const categoryLabels = {
  stem: "STEM",
  medicine_health: "Medicine & Health",
  agriculture_environment: "Agriculture & Environment",
  social_sciences: "Social Sciences",
  law_policy: "Law & Policy",
  arts_humanities: "Arts & Humanities",
  business_economics: "Business & Economics",
  education_pedagogy: "Education & Pedagogy",
  interdisciplinary: "Interdisciplinary",
};

const categoryGradients = {
  stem: "from-blue-900 via-blue-800 to-cyan-900",
  medicine_health: "from-red-900 via-red-800 to-rose-900",
  agriculture_environment: "from-green-900 via-green-800 to-teal-900",
  social_sciences: "from-purple-900 via-purple-800 to-violet-900",
  law_policy: "from-slate-900 via-slate-800 to-gray-900",
  arts_humanities: "from-amber-900 via-amber-800 to-orange-900",
  business_economics: "from-indigo-900 via-indigo-800 to-blue-900",
  education_pedagogy: "from-sky-900 via-sky-800 to-blue-900",
  interdisciplinary: "from-teal-900 via-teal-800 to-cyan-900",
};

function ArticleRow({ manuscript }) {
  return (
    <Link to={createPageUrl(`ManuscriptDetail?id=${manuscript.id}`)}>
      <div className="group flex gap-4 p-4 rounded-xl hover:bg-teal-50 border border-transparent hover:border-teal-200 transition-all duration-200">
        <div className="flex-shrink-0 w-1 bg-teal-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 group-hover:text-teal-800 line-clamp-2 mb-1 transition-colors">
            {manuscript.title}
          </h4>
          <p className="text-sm text-slate-500 line-clamp-2 mb-2">{manuscript.abstract}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {manuscript.authors?.[0]?.name || "Unknown Author"}
              {manuscript.authors?.length > 1 && ` +${manuscript.authors.length - 1}`}
            </span>
            {manuscript.publication_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(manuscript.publication_date), "MMM d, yyyy")}
              </span>
            )}
            {manuscript.doi && (
              <span className="font-mono text-teal-600">DOI: {manuscript.doi}</span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />{manuscript.view_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" />{manuscript.download_count || 0}
            </span>
          </div>
          {manuscript.keywords?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {manuscript.keywords.slice(0, 4).map(kw => (
                <Badge key={kw} variant="secondary" className="text-xs py-0">{kw}</Badge>
              ))}
            </div>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 flex-shrink-0 mt-1 transition-colors" />
      </div>
    </Link>
  );
}

function EditorCard({ editor, isChief = false }) {
  const initials = editor.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "ED";
  return (
    <div className={`flex items-start gap-4 p-5 rounded-xl border transition-all duration-200 hover:shadow-md ${
      isChief
        ? "bg-gradient-to-br from-blue-50 to-teal-50 border-teal-200"
        : "bg-white border-slate-200 hover:border-teal-200"
    }`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
        isChief ? "bg-gradient-to-br from-teal-500 to-teal-700" : "bg-gradient-to-br from-blue-500 to-blue-700"
      }`}>
        {initials}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-semibold text-slate-900">{editor.full_name}</h4>
          {isChief && <Badge className="bg-teal-100 text-teal-800 text-xs">Editor-in-Chief</Badge>}
        </div>
        <p className="text-sm text-slate-600 mt-0.5">{editor.affiliation || "Affiliation not listed"}</p>
        {editor.country && <p className="text-xs text-slate-400 mt-0.5">{editor.country}</p>}
        {editor.research_interests?.length > 0 && (
          <p className="text-xs text-teal-600 mt-1">{editor.research_interests.slice(0, 2).join(", ")}</p>
        )}
      </div>
    </div>
  );
}

export default function JournalProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const journalId = urlParams.get("id");

  const [journal, setJournal] = useState(null);
  const [manuscripts, setManuscripts] = useState([]);
  const [editors, setEditors] = useState([]);
  const [chiefEditor, setChiefEditor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(8);

  useEffect(() => {
    if (journalId) loadData();
  }, [journalId]);

  const loadData = async () => {
    setIsLoading(true);
    const [journalData, manuscriptData, allUsers] = await Promise.all([
      base44.entities.Journal.get(journalId),
      base44.entities.Manuscript.filter({ journal_id: journalId, status: "published" }, "-publication_date", 50),
      base44.entities.User.list("-created_date", 200),
    ]);
    setJournal(journalData);
    setManuscripts(manuscriptData);
    const boardMembers = allUsers.filter(u => u.editor_roles?.includes(journalId));
    const chief = boardMembers.find(u => u.full_name === journalData?.editor_in_chief) || null;
    setChiefEditor(chief);
    setEditors(boardMembers.filter(u => u.id !== chief?.id));
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Skeleton className="h-96 w-full rounded-none" />
        <div className="max-w-6xl mx-auto px-4 py-12 space-y-6">
          <Skeleton className="h-8 w-1/3" />
          <div className="grid md:grid-cols-2 gap-4">
            <Skeleton className="h-32" /><Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!journal) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Journal Not Found</h2>
          <Link to={createPageUrl("Journals")}>
            <Button className="mt-4">Browse All Journals</Button>
          </Link>
        </div>
      </div>
    );
  }

  const gradient = categoryGradients[journal.category] || "from-blue-900 via-blue-800 to-sky-900";
  const totalDownloads = manuscripts.reduce((s, m) => s + (m.download_count || 0), 0);
  const totalViews = manuscripts.reduce((s, m) => s + (m.view_count || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HERO BANNER ── */}
      <div className={`relative bg-gradient-to-r ${gradient} text-white overflow-hidden`}>
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, white 0%, transparent 40%),
                            radial-gradient(circle at 80% 20%, white 0%, transparent 35%),
                            radial-gradient(circle at 60% 80%, white 0%, transparent 30%)`
        }} />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50/10 to-transparent" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">

            {/* Left: Journal info */}
            <div className="flex-1 space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                  {categoryLabels[journal.category]}
                </Badge>
                {journal.is_open_access && (
                  <Badge className="bg-emerald-500/90 text-white flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Open Access
                  </Badge>
                )}
                {journal.status === "active" && (
                  <Badge className="bg-teal-500/90 text-white flex items-center gap-1">
                    <Rss className="w-3 h-3" /> Accepting Submissions
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                {journal.title}
              </h1>

              <p className="text-lg text-white/80 max-w-2xl leading-relaxed">
                {journal.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
                {journal.editor_in_chief && (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    Editor-in-Chief: <span className="text-white font-medium">{journal.editor_in_chief}</span>
                  </span>
                )}
                {journal.issn && (
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    ISSN: <span className="text-white font-mono">{journal.issn}</span>
                  </span>
                )}
                {journal.impact_factor && (
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    Impact Factor: <span className="text-white font-bold">{journal.impact_factor}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Right: CTA block */}
            <div className="lg:flex-shrink-0 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 space-y-3 min-w-[240px]">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-4">Quick Actions</p>
              <Link to={createPageUrl("Submit")}>
                <Button className="w-full bg-teal-500 hover:bg-teal-400 text-white font-semibold shadow-lg">
                  <Upload className="w-4 h-4 mr-2" /> Submit Manuscript
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full border-white/40 text-white hover:bg-white/20 hover:border-white/60"
                onClick={() => window.location.href = `mailto:editorial@afriscinexus.org?subject=Subscription%20Enquiry:%20${encodeURIComponent(journal.title)}`}
              >
                <Mail className="w-4 h-4 mr-2" /> Subscribe to Updates
              </Button>
              <Link to={createPageUrl("Guidelines")}>
                <Button variant="ghost" className="w-full text-white/80 hover:text-white hover:bg-white/10">
                  <BookOpen className="w-4 h-4 mr-2" /> Author Guidelines
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: FileText, label: "Published Articles", value: manuscripts.length },
              { icon: Eye, label: "Total Views", value: totalViews.toLocaleString() },
              { icon: Download, label: "Total Downloads", value: totalDownloads.toLocaleString() },
              { icon: Users, label: "Board Members", value: editors.length + (chiefEditor ? 1 : 0) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
                <Icon className="w-5 h-5 text-white/60 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-white/60 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-14">

        {/* EDITORIAL BOARD */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-teal-600" /> Editorial Board
              </h2>
              <p className="text-slate-500 mt-1">Experts guiding the scientific direction of this journal</p>
            </div>
            <Link to={createPageUrl("Editorial")}>
              <Button variant="outline" size="sm" className="gap-1.5">
                Full Board <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {chiefEditor ? (
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Editor-in-Chief</p>
              <div className="max-w-md">
                <EditorCard editor={chiefEditor} isChief />
              </div>
            </div>
          ) : journal.editor_in_chief ? (
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Editor-in-Chief</p>
              <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-blue-50 to-teal-50 border border-teal-200 rounded-xl max-w-md">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-bold">
                  {journal.editor_in_chief.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">{journal.editor_in_chief}</h4>
                  <Badge className="bg-teal-100 text-teal-800 text-xs mt-1">Editor-in-Chief</Badge>
                </div>
              </div>
            </div>
          ) : null}

          {editors.length > 0 ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Associate Editors</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {editors.map(editor => (
                  <EditorCard key={editor.id} editor={editor} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-200">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">Associate editor details coming soon.</p>
              <Link to={createPageUrl("Editorial")}>
                <Button variant="link" size="sm" className="text-teal-600 mt-1">Apply to join the board →</Button>
              </Link>
            </div>
          )}
        </section>

        <Separator />

        {/* PUBLISHED ARTICLES */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-teal-600" /> Published Articles
              </h2>
              <p className="text-slate-500 mt-1">{manuscripts.length} peer-reviewed articles in this journal</p>
            </div>
            <Link to={createPageUrl(`Publications?journal=${journalId}`)}>
              <Button variant="outline" size="sm" className="gap-1.5">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {manuscripts.length > 0 ? (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
                {manuscripts.slice(0, visibleCount).map(ms => (
                  <ArticleRow key={ms.id} manuscript={ms} />
                ))}
              </div>
              {visibleCount < manuscripts.length && (
                <div className="text-center mt-6">
                  <Button variant="outline" onClick={() => setVisibleCount(v => v + 8)}>
                    Load more articles ({manuscripts.length - visibleCount} remaining)
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700 mb-1">No articles yet</h3>
              <p className="text-slate-500 mb-4">Be the first to publish in this journal.</p>
              <Link to={createPageUrl("Submit")}>
                <Button className="bg-teal-600 hover:bg-teal-700">
                  <Upload className="w-4 h-4 mr-2" /> Submit Manuscript
                </Button>
              </Link>
            </div>
          )}
        </section>

        <Separator />

        {/* SUBMISSION & SUBSCRIPTION CTA BAND */}
        <section>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Submit CTA */}
            <Card className="border-0 bg-gradient-to-br from-teal-600 to-teal-800 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
              <CardContent className="p-8 relative">
                <Upload className="w-10 h-10 mb-4 text-teal-200" />
                <h3 className="text-xl font-bold mb-2">Submit Your Research</h3>
                <p className="text-teal-100 mb-6 text-sm leading-relaxed">
                  Publish in <strong>{journal.title}</strong>. AI-assisted submission, double-blind peer review,
                  and {journal.is_open_access ? "free open access" : "broad distribution"}.
                  {journal.submission_fee === 0 || !journal.submission_fee
                    ? " No submission fee."
                    : ` Submission fee: $${journal.submission_fee} USD.`}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to={createPageUrl("Submit")}>
                    <Button className="bg-white text-teal-800 hover:bg-teal-50 font-semibold">
                      Submit Now <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                  <Link to={createPageUrl("Guidelines")}>
                    <Button variant="ghost" className="text-white hover:bg-white/10">
                      View Guidelines
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Subscribe CTA */}
            <Card className="border-0 bg-gradient-to-br from-blue-900 to-indigo-900 text-white overflow-hidden relative">
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
              <CardContent className="p-8 relative">
                <Rss className="w-10 h-10 mb-4 text-blue-200" />
                <h3 className="text-xl font-bold mb-2">Stay Up to Date</h3>
                <p className="text-blue-100 mb-6 text-sm leading-relaxed">
                  Get notified when new articles are published in <strong>{journal.title}</strong>.
                  Join thousands of researchers following this journal.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    className="bg-white text-blue-900 hover:bg-blue-50 font-semibold"
                    onClick={() => window.location.href = `mailto:editorial@afriscinexus.org?subject=Subscribe:%20${encodeURIComponent(journal.title)}`}
                  >
                    <Mail className="w-4 h-4 mr-2" /> Subscribe by Email
                  </Button>
                  <Link to={createPageUrl("Profile")}>
                    <Button variant="ghost" className="text-white hover:bg-white/10">
                      Manage Alerts
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Journal metadata footer */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          {[
            { icon: Globe, label: "Languages", value: journal.languages?.join(", ") || "English" },
            { icon: Star, label: "Impact Factor", value: journal.impact_factor || "N/A" },
            { icon: TrendingUp, label: "Acceptance Rate", value: "~40%" },
            { icon: Calendar, label: "Avg. Review Time", value: "4–6 weeks" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-slate-500 text-xs">{label}</p>
                <p className="font-semibold text-slate-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}