import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, TrendingUp, BookOpen, Calendar, ArrowLeft, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import { stampAfriSciNexus } from "@/utils/pdfStamp";

export default function ResearcherProfile() {
  const [manuscripts, setManuscripts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const authorKey = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return decodeURIComponent(params.get("key") || "");
  }, []);

  useEffect(() => {
    Promise.all([
      base44.entities.Manuscript.filter({ status: "published" }, "-publication_date", 500),
      base44.entities.Journal.list("-created_date", 200),
    ]).then(([ms, j]) => {
      setManuscripts(ms);
      setJournals(j);
      setIsLoading(false);
    });
  }, []);

  const journalMap = useMemo(() => Object.fromEntries(journals.map(j => [j.id, j])), [journals]);

  const { author, articles } = useMemo(() => {
    let authorInfo = null;
    const articles = manuscripts.filter(ms =>
      (ms.authors || []).some(a => {
        const key = a.email || a.name;
        if (key === authorKey) {
          if (!authorInfo) authorInfo = a;
          return true;
        }
        return false;
      })
    );
    return { author: authorInfo, articles };
  }, [manuscripts, authorKey]);

  const totalCitations = articles.reduce((s, m) => s + (m.citation_count || 0), 0);
  const totalDownloads = articles.reduce((s, m) => s + (m.download_count || 0), 0);
  const totalViews = articles.reduce((s, m) => s + (m.view_count || 0), 0);
  const journalsPublished = new Set(articles.map(m => m.journal_id).filter(Boolean));

  const handleDownloadAbstract = (ms) => {
    const journal = journalMap[ms.journal_id];
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin = 20, pageWidth = doc.internal.pageSize.getWidth(), contentWidth = pageWidth - margin * 2;
    let y = 22;
    doc.setFont("times", "bold"); doc.setFontSize(16);
    const titleLines = doc.splitTextToSize(ms.title || "", contentWidth);
    doc.text(titleLines, margin, y); y += titleLines.length * 8 + 4;
    if (ms.authors?.length) {
      doc.setFont("times", "italic"); doc.setFontSize(11);
      const auth = ms.authors.map(a => `${a.name}${a.affiliation ? ` (${a.affiliation})` : ""}`).join(", ");
      doc.splitTextToSize(auth, contentWidth).forEach(l => { doc.text(l, margin, y); y += 6; }); y += 2;
    }
    if (journal?.title) { doc.setFont("times", "normal"); doc.setFontSize(10); doc.text(`Journal: ${journal.title}`, margin, y); y += 6; }
    if (ms.doi) { doc.setTextColor(0, 0, 180); doc.text(`DOI: https://doi.org/${ms.doi}`, margin, y); doc.setTextColor(0, 0, 0); y += 6; }
    doc.setDrawColor(100); doc.line(margin, y, pageWidth - margin, y); y += 6;
    doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Abstract", margin, y); y += 6;
    doc.setFont("times", "normal"); doc.setFontSize(11);
    doc.splitTextToSize(ms.abstract || "", contentWidth).forEach(l => { if (y > 270) { doc.addPage(); y = margin; } doc.text(l, margin, y); y += 6; });
    stampAfriSciNexus(doc, journal?.title || "AfriSci Nexus Discovery");
    doc.save(`${(ms.title || "abstract").replace(/[^a-z0-9]/gi, "_").substring(0, 50)}_abstract.pdf`);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!author) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center py-20">
        <p className="text-slate-600 mb-4">Researcher not found.</p>
        <Link to={createPageUrl("ResearcherDirectory")}>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Directory</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back */}
        <Link to={createPageUrl("ResearcherDirectory")} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Researcher Directory
        </Link>

        {/* Profile Header */}
        <Card className="border-0 bg-gradient-to-br from-blue-700 to-indigo-800 text-white shadow-xl">
          <CardContent className="p-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold flex-shrink-0">
                {author.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">{author.name}</h1>
                {author.affiliation && <p className="text-blue-200 text-lg">{author.affiliation}</p>}
                {author.email && <p className="text-blue-300 text-sm mt-1">{author.email}</p>}
              </div>
            </div>
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[
                { label: "Publications", value: articles.length, icon: FileText },
                { label: "Total Citations", value: totalCitations, icon: TrendingUp },
                { label: "Journals", value: journalsPublished.size, icon: BookOpen },
                { label: "Total Downloads", value: totalDownloads, icon: Download },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white/10 rounded-xl p-4 text-center">
                  <Icon className="w-5 h-5 mx-auto mb-1 text-blue-200" />
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-blue-200">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Published Articles */}
        <Card className="border-0 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Published Articles
              <Badge variant="secondary" className="ml-1">{articles.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {articles.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No published articles found.</p>
            ) : (
              articles.map(ms => {
                const journal = journalMap[ms.journal_id];
                return (
                  <div key={ms.id} className="p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <Link to={createPageUrl(`ManuscriptDetail?id=${ms.id}`)}>
                          <h3 className="font-semibold text-slate-900 hover:text-blue-700 transition-colors line-clamp-2 mb-1">{ms.title}</h3>
                        </Link>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-2">
                          {journal && (
                            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{journal.title}</span>
                          )}
                          {ms.publication_date && (
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(ms.publication_date).toLocaleDateString("en-GB", { year: "numeric", month: "short" })}</span>
                          )}
                          {ms.citation_count > 0 && (
                            <span className="flex items-center gap-1 text-amber-600 font-medium"><TrendingUp className="w-3 h-3" />{ms.citation_count} citation{ms.citation_count !== 1 ? "s" : ""}</span>
                          )}
                          {ms.doi && (
                            <a href={`https://doi.org/${ms.doi}`} target="_blank" rel="noreferrer" className="text-blue-600 font-mono hover:underline">DOI: {ms.doi}</a>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2">{ms.abstract}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Link to={createPageUrl(`ManuscriptDetail?id=${ms.id}`)}>
                        <Button size="sm" variant="outline" className="text-xs">Read Article</Button>
                      </Link>
                      <Button size="sm" variant="outline" className="text-xs border-blue-400 text-blue-700 hover:bg-blue-50" onClick={() => handleDownloadAbstract(ms)}>
                        <Download className="w-3 h-3 mr-1" />Abstract PDF
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}