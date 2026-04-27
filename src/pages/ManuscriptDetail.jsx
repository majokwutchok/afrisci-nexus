import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText,
  BookOpen,
  Calendar,
  Users,
  Download,
  Share2,
  Twitter,
  Linkedin,
  MessageSquare,
  ExternalLink
} from "lucide-react";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import ProgressTracker from "../components/submission/ProgressTracker";
import AISummary from "../components/publication/AISummary";
import InlinePDFViewer from "../components/publication/InlinePDFViewer";
import ScholarMetaTags from "../components/publication/ScholarMetaTags";
import DOIPanel from "../components/publication/DOIPanel";
import CitationTracker from "../components/publication/CitationTracker";
import ArticleEngagementMetrics from "../components/publication/ArticleEngagementMetrics";

const statusColors = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  submitted: "bg-blue-100 text-blue-800 border-blue-200", 
  under_review: "bg-yellow-100 text-yellow-800 border-yellow-200",
  revision_requested: "bg-orange-100 text-orange-800 border-orange-200",
  revised: "bg-purple-100 text-purple-800 border-purple-200",
  accepted: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  published: "bg-emerald-100 text-emerald-800 border-emerald-200"
};

export default function ManuscriptDetail() {
  const [manuscript, setManuscript] = useState(null);
  const [journal, setJournal] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const manuscriptId = urlParams.get('id');
    if (manuscriptId) {
      loadData(manuscriptId);
    } else {
      setError("No manuscript ID provided");
      setIsLoading(false);
    }
  }, []);

  const loadData = async (manuscriptId) => {
    setIsLoading(true);
    setError(null);
    try {
      const msData = await base44.entities.Manuscript.get(manuscriptId);
      setManuscript(msData);

      // Increment view count asynchronously (fire and forget)
      base44.entities.Manuscript.update(manuscriptId, { view_count: (msData.view_count || 0) + 1 }).catch(() => {});

      // Load other data in parallel, with error handling for each
      const [commentsData, userData] = await Promise.all([
        base44.entities.Comment.filter({ manuscript_id: manuscriptId }).catch(() => []),
        base44.auth.me().catch(() => null)
      ]);

      setComments(commentsData);
      setCurrentUser(userData);

      // Load journal data only if journal_id exists and is valid
      if (msData.journal_id) {
        try {
          const journalData = await base44.entities.Journal.get(msData.journal_id);
          setJournal(journalData);
        } catch (journalError) {
          console.error("Error loading journal:", journalError);
          setJournal(null);
        }
      } else {
        setJournal(null);
      }

    } catch (error) {
      console.error("Error loading manuscript details:", error);
      setError("Failed to load manuscript details. Please try again.");
    }
    setIsLoading(false);
  };
  
  const handleCitationAdded = (newCount) => {
    setManuscript(prev => prev ? { ...prev, citation_count: newCount } : prev);
  };

  const handleDOIAssigned = (doi) => {
    setManuscript(prev => prev ? { ...prev, doi } : prev);
  };

  const handlePreviewPDF = () => {
    if (!manuscript?.manuscript_file_url) return;
    window.open(manuscript.manuscript_file_url, '_blank');
    base44.entities.Manuscript.update(manuscript.id, { view_count: (manuscript.view_count || 0) + 1 }).catch(() => {});
  };

  const handleDownloadPDF = () => {
    if (!manuscript?.manuscript_file_url) {
      // Generate a basic PDF from metadata
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const margin = 20;
      const contentWidth = doc.internal.pageSize.getWidth() - margin * 2;
      let y = margin;
      doc.setFont("times", "bold"); doc.setFontSize(16);
      const titleLines = doc.splitTextToSize(manuscript.title || "", contentWidth);
      doc.text(titleLines, margin, y); y += titleLines.length * 8 + 6;
      if (manuscript.authors?.length) {
        doc.setFont("times", "italic"); doc.setFontSize(11);
        const auth = manuscript.authors.map(a => a.name).join(", ");
        doc.text(doc.splitTextToSize(auth, contentWidth), margin, y); y += 8;
      }
      if (manuscript.doi) {
        doc.setFont("times", "normal"); doc.setFontSize(10);
        doc.setTextColor(0, 0, 180);
        doc.text(`DOI: https://doi.org/${manuscript.doi}`, margin, y);
        doc.setTextColor(0, 0, 0); y += 8;
      }
      doc.setDrawColor(150); doc.line(margin, y, doc.internal.pageSize.getWidth() - margin, y); y += 6;
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Abstract", margin, y); y += 6;
      doc.setFont("times", "normal"); doc.setFontSize(11);
      const abs = doc.splitTextToSize(manuscript.abstract || "", contentWidth);
      abs.forEach(l => { if (y > 270) { doc.addPage(); y = margin; } doc.text(l, margin, y); y += 6; });
      if (manuscript.keywords?.length) {
        y += 2; doc.setFont("times", "bold"); doc.text("Keywords: ", margin, y);
        doc.setFont("times", "italic"); doc.text(manuscript.keywords.join(", "), margin + 22, y);
      }
      const fn = (manuscript.title || "article").replace(/[^a-z0-9]/gi, "_").substring(0, 50);
      doc.save(`${fn}.pdf`);
    } else {
      const a = document.createElement("a");
      a.href = manuscript.manuscript_file_url;
      a.download = `${(manuscript.title || "article").replace(/[^a-z0-9]/gi, "_").substring(0, 50)}.pdf`;
      a.target = "_blank";
      a.click();
    }
    base44.entities.Manuscript.update(manuscript.id, { download_count: (manuscript.download_count || 0) + 1 }).catch(() => {});
  };

  const handleDownloadBibTeX = () => {
    const authors = manuscript.authors?.map(a => a.name).join(" and ") || "";
    const year = manuscript.publication_date ? new Date(manuscript.publication_date).getFullYear() : new Date().getFullYear();
    const key = `${manuscript.authors?.[0]?.name?.split(" ").pop() || "Author"}${year}`;
    const bib = `@article{${key},\n  title={${manuscript.title || ""}},\n  author={${authors}},\n  year={${year}},\n  doi={${manuscript.doi || ""}},\n  journal={${journal?.title || "AfriSci Nexus"}},\n  keywords={${(manuscript.keywords || []).join(", ")}}\n}`;
    const blob = new Blob([bib], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${key}.bib`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadRIS = () => {
    const year = manuscript.publication_date ? new Date(manuscript.publication_date).getFullYear() : new Date().getFullYear();
    const authors = manuscript.authors?.map(a => `AU  - ${a.name}`).join("\n") || "";
    const ris = `TY  - JOUR\nTI  - ${manuscript.title || ""}\n${authors}\nPY  - ${year}\nDO  - ${manuscript.doi || ""}\nJO  - ${journal?.title || "AfriSci Nexus"}\nKW  - ${(manuscript.keywords || []).join("\nKW  - ")}\nER  -`;
    const blob = new Blob([ris], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${manuscript.title?.replace(/[^a-z0-9]/gi, "_").substring(0, 40) || "citation"}.ris`; a.click();
    URL.revokeObjectURL(url);
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !currentUser || !manuscript) return;
    
    try {
      await base44.entities.Comment.create({
        manuscript_id: manuscript.id,
        content: newComment,
        author_name: currentUser.full_name
      });
      setNewComment("");
      loadData(manuscript.id);
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  const shareOnTwitter = () => {
    const text = `Check out this article: "${manuscript.title}"`;
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    const url = window.location.href;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };
  
  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="flex gap-4"><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-24" /></div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-12 h-12 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Manuscript</h3>
          <p className="text-slate-600">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!manuscript) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-12 h-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Manuscript Not Found</h3>
          <p className="text-slate-600">The requested manuscript could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <ScholarMetaTags manuscript={manuscript} journal={journal} />
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <Badge className={`${statusColors[manuscript.status]} w-fit mb-4`}>
                  Status: {manuscript.status.replace('_', ' ')}
                </Badge>
                <CardTitle className="text-3xl font-bold text-slate-900">{manuscript.title}</CardTitle>
                <div className="text-sm text-slate-500 flex items-center gap-6 pt-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{journal?.title || 'Journal not available'}</span>
                  </div>
                  {manuscript.submission_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Submitted: {format(new Date(manuscript.submission_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {manuscript.review_type && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{manuscript.review_type.replace('_', ' ')} review</span>
                    </div>
                  )}
                </div>
                {manuscript.doi && (
                  <div className="flex items-center gap-3 pt-3 mt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">DOI</span>
                      <a
                        href={`https://doi.org/${manuscript.doi}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-mono text-blue-700 hover:text-blue-900 hover:underline font-semibold"
                      >
                        {manuscript.doi}
                      </a>
                    </div>
                    {manuscript.publication_date && (
                      <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 font-medium">
                        Published: {new Date(manuscript.publication_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {manuscript.authors && manuscript.authors.length > 0 && (
                  <div>
                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Users className="w-5 h-5"/>Authors</h3>
                    <p className="text-slate-700">
                      {manuscript.authors.map(a => `${a.name} (${a.affiliation || 'N/A'})`).join(', ')}
                    </p>
                  </div>
                )}
                <Separator />
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">Abstract</h3>
                  <p className="text-slate-700 leading-relaxed">{manuscript.abstract}</p>
                  <div className="mt-4">
                    <AISummary title={manuscript.title} abstract={manuscript.abstract} />
                  </div>
                </div>
                {manuscript.keywords && manuscript.keywords.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-bold text-slate-800 mb-2">Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {manuscript.keywords.map(kw => <Badge key={kw} variant="secondary">{kw}</Badge>)}
                      </div>
                    </div>
                  </>
                )}
                <Separator />
                {/* Inline PDF Viewer */}
                {manuscript.manuscript_file_url && (
                  <div>
                    <h3 className="font-bold text-slate-800 mb-3">Read Article</h3>
                    <InlinePDFViewer fileUrl={manuscript.manuscript_file_url} />
                  </div>
                )}
                <Separator />
                <div className="space-y-3">
                  {/* PDF Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {manuscript.manuscript_file_url && (
                      <Button onClick={handlePreviewPDF} variant="outline">
                        <ExternalLink className="w-4 h-4 mr-2"/>Open PDF
                      </Button>
                    )}
                    <Button onClick={handleDownloadPDF}>
                      <Download className="w-4 h-4 mr-2"/>Download PDF
                    </Button>
                  </div>
                  {/* Citation Export */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Export citation:</span>
                    <Button size="sm" variant="outline" className="text-xs" onClick={handleDownloadBibTeX}>
                      BibTeX
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs" onClick={handleDownloadRIS}>
                      RIS / EndNote
                    </Button>
                  </div>
                  {/* Share */}
                  <div className="flex items-center gap-2 pt-1">
                    <Share2 className="w-4 h-4 text-slate-500"/>
                    <span className="text-xs text-slate-500">Share:</span>
                    <Button variant="ghost" size="icon" onClick={shareOnTwitter}><Twitter className="w-5 h-5 text-sky-500"/></Button>
                    <Button variant="ghost" size="icon" onClick={shareOnLinkedIn}><Linkedin className="w-5 h-5 text-blue-700"/></Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            {manuscript.status === 'published' && (
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5"/> Discussion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {comments.map(comment => (
                      <div key={comment.id} className="p-3 bg-slate-50 rounded-lg">
                        <p className="font-bold text-sm text-slate-800">{comment.author_name}</p>
                        <p className="text-slate-700">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                  {currentUser && (
                    <div className="space-y-2">
                      <Textarea 
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <Button onClick={handlePostComment}>Post Comment</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <ProgressTracker
              manuscript={manuscript}
              showReviewDetails={true}
            />
            <DOIPanel
              manuscript={manuscript}
              journal={journal}
              onDOIAssigned={handleDOIAssigned}
            />
            <CitationTracker
              manuscript={manuscript}
              journal={journal}
              onCitationAdded={handleCitationAdded}
            />
            <ArticleEngagementMetrics manuscript={manuscript} />
          </div>
        </div>
      </div>
    </div>
  );
}