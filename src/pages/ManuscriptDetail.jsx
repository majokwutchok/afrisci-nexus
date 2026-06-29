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
  MessageSquare
} from "lucide-react";
import { jsPDF } from "jspdf";
import { stampAfriSciNexus } from "@/utils/pdfStamp";
import { convertToAfriSciURL, getArticleReadOnlineURL } from "@/utils/afrisciLinks";
import { downloadPDF } from "@/utils/pdfOpen";
import PDFViewerModal from "@/components/publication/PDFViewerModal";
import { format } from "date-fns";
import ProgressTracker from "../components/submission/ProgressTracker";
import AISummary from "../components/publication/AISummary";
import InlinePDFViewer from "../components/publication/InlinePDFViewer";
import AnnotatedPDFViewer from "../components/publication/AnnotatedPDFViewer";
import ScholarMetaTags from "../components/publication/ScholarMetaTags";
import DOIPanel from "../components/publication/DOIPanel";
import CitationTracker from "../components/publication/CitationTracker";
import ArticleEngagementMetrics from "../components/publication/ArticleEngagementMetrics";
import ArticleSubscribeWidget from "../components/publication/ArticleSubscribeWidget";
import ArticleSocialSharing from "../components/publication/ArticleSocialSharing";
import SuggestedArticles from "../components/publication/SuggestedArticles";
import NewsletterSignup from "../components/newsletter/NewsletterSignup";
import { generateArticleCoverImage, generateSocialMetadata } from "@/utils/articleCoverGenerator";
import { trackView } from "@/utils/trackEngagement";

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
  const [coverImage, setCoverImage] = useState(null);
  const [pdfOpen, setPdfOpen] = useState(false);

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

      // Track abstract view (increments view_count + writes ReadershipStats)
      trackView(manuscriptId, "abstract", msData);

      // Load other data in parallel, with error handling for each
      const [commentsData, userData] = await Promise.all([
        base44.entities.Comment.filter({ manuscript_id: manuscriptId }).catch(() => []),
        base44.auth.me().catch(() => null)
      ]);

      setComments(commentsData);
      setCurrentUser(userData);

      // Load journal data only if journal_id exists and is valid
      let journalData = null;
      if (msData.journal_id) {
        try {
          journalData = await base44.entities.Journal.get(msData.journal_id);
          setJournal(journalData);
        } catch (journalError) {
          console.error("Error loading journal:", journalError);
          setJournal(null);
        }
      } else {
        setJournal(null);
      }

      // Generate cover image for social media if manuscript is published
      if (msData.status === 'published' && journalData) {
        const generatedCover = generateArticleCoverImage(msData, journalData);
        setCoverImage(generatedCover);

        // Save generated cover to manuscript if not already set
        if (!msData.cover_image_url && typeof generatedCover === 'string') {
          base44.entities.Manuscript.update(manuscriptId, { cover_image_url: generatedCover }).catch(() => {});
        }
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

  const buildPDF = (ms) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;
    let y = 22; // start below header stamp

    // Title
    doc.setFont("times", "bold"); doc.setFontSize(16);
    const titleLines = doc.splitTextToSize(ms.title || "", contentWidth);
    doc.text(titleLines, margin, y); y += titleLines.length * 8 + 4;

    // Authors
    if (ms.authors?.length) {
      doc.setFont("times", "italic"); doc.setFontSize(11);
      const auth = ms.authors.map(a => `${a.name}${a.affiliation ? ` (${a.affiliation})` : ""}`).join(", ");
      const authLines = doc.splitTextToSize(auth, contentWidth);
      doc.text(authLines, margin, y); y += authLines.length * 6 + 4;
    }

    // DOI
    if (ms.doi) {
      doc.setFont("times", "normal"); doc.setFontSize(10); doc.setTextColor(0, 0, 180);
      doc.text(`DOI: https://doi.org/${ms.doi}`, margin, y); doc.setTextColor(0, 0, 0); y += 7;
    }

    // Published date
    if (ms.publication_date) {
      doc.setFontSize(10);
      doc.text(`Published: ${new Date(ms.publication_date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`, margin, y); y += 7;
    }

    // Journal
    if (journal?.title) {
      doc.setFont("times", "normal"); doc.setFontSize(10);
      doc.text(`Journal: ${journal.title}`, margin, y); y += 7;
    }

    doc.setDrawColor(100); doc.line(margin, y, pageWidth - margin, y); y += 6;

    // Abstract
    doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Abstract", margin, y); y += 6;
    doc.setFont("times", "normal"); doc.setFontSize(11);
    const absLines = doc.splitTextToSize(ms.abstract || "", contentWidth);
    absLines.forEach(l => { if (y > 270) { doc.addPage(); y = margin; } doc.text(l, margin, y); y += 6; });
    y += 4;

    // Keywords
    if (ms.keywords?.length) {
      doc.setFont("times", "bold"); doc.text("Keywords: ", margin, y);
      doc.setFont("times", "italic"); doc.text(ms.keywords.join(", "), margin + 22, y); y += 8;
    }

    // Body from formatted_body
    if (ms.formatted_body) {
      doc.setDrawColor(100); doc.line(margin, y, pageWidth - margin, y); y += 6;
      const div = document.createElement("div");
      div.innerHTML = ms.formatted_body;
      const bodyText = div.innerText || div.textContent || "";
      doc.setFont("times", "normal"); doc.setFontSize(11);
      const bodyLines = doc.splitTextToSize(bodyText, contentWidth);
      bodyLines.forEach(l => { if (y > 268) { doc.addPage(); y = 22; } doc.text(l, margin, y); y += 6; });
    } else {
      // No formatted body — include note directing to manuscript file
      doc.setDrawColor(100); doc.line(margin, y, pageWidth - margin, y); y += 8;
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Full Article", margin, y); y += 7;
      doc.setFont("times", "normal"); doc.setFontSize(11);
      const noteLines = doc.splitTextToSize(
        "The full text of this article is available online. Please visit https://afriscinexus.com and use the DOI link above to access the complete article.",
        contentWidth
      );
      noteLines.forEach(l => { doc.text(l, margin, y); y += 6; });
      if (ms.manuscript_file_url) {
        y += 4;
        doc.setFont("times", "italic"); doc.setFontSize(10); doc.setTextColor(0, 0, 180);
        const doiLink = ms.doi ? `https://doi.org/${ms.doi}` : `https://afriscinexus.com/article/${ms.id}`;
        const urlLines = doc.splitTextToSize(`Read online: ${doiLink}`, contentWidth);
        urlLines.forEach(l => { doc.text(l, margin, y); y += 5; });
        doc.setTextColor(0, 0, 0);
      }
    }

    // Stamp every page with AfriSci Nexus branding
    stampAfriSciNexus(doc, journal?.title || "AfriSci Nexus Discovery");
    return doc;
  };

  const handleDownloadAbstractPDF = () => {
    const ms = manuscript;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;
    let y = 22;

    // Title
    doc.setFont("times", "bold"); doc.setFontSize(16);
    const titleLines = doc.splitTextToSize(ms.title || "", contentWidth);
    doc.text(titleLines, margin, y); y += titleLines.length * 8 + 4;

    // Authors
    if (ms.authors?.length) {
      doc.setFont("times", "italic"); doc.setFontSize(11);
      const auth = ms.authors.map(a => `${a.name}${a.affiliation ? ` (${a.affiliation})` : ""}`).join(", ");
      const authLines = doc.splitTextToSize(auth, contentWidth);
      doc.text(authLines, margin, y); y += authLines.length * 6 + 4;
    }

    // DOI
    if (ms.doi) {
      doc.setFont("times", "normal"); doc.setFontSize(10); doc.setTextColor(0, 0, 180);
      doc.text(`DOI: https://doi.org/${ms.doi}`, margin, y); doc.setTextColor(0, 0, 0); y += 7;
    }

    // Published date
    if (ms.publication_date) {
      doc.setFontSize(10);
      doc.text(`Published: ${new Date(ms.publication_date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`, margin, y); y += 7;
    }

    // Journal
    if (journal?.title) {
      doc.setFont("times", "normal"); doc.setFontSize(10);
      doc.text(`Journal: ${journal.title}`, margin, y); y += 7;
    }

    doc.setDrawColor(100); doc.line(margin, y, pageWidth - margin, y); y += 6;

    // Abstract
    doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Abstract", margin, y); y += 6;
    doc.setFont("times", "normal"); doc.setFontSize(11);
    const absLines = doc.splitTextToSize(ms.abstract || "", contentWidth);
    absLines.forEach(l => { if (y > 270) { doc.addPage(); y = margin; } doc.text(l, margin, y); y += 6; });
    y += 4;

    // Keywords
    if (ms.keywords?.length) {
      doc.setFont("times", "bold"); doc.text("Keywords: ", margin, y);
      doc.setFont("times", "italic"); doc.text(ms.keywords.join(", "), margin + 22, y); y += 8;
    }

    // Note about full article
    doc.setFont("times", "italic"); doc.setFontSize(10); doc.setTextColor(100, 100, 100);
    doc.text("For the full article, visit: https://afriscinexus.com or use the DOI link above.", margin, y + 6);
    doc.setTextColor(0, 0, 0);

    stampAfriSciNexus(doc, journal?.title || "AfriSci Nexus Discovery");
    const fn = (ms.title || "abstract").replace(/[^a-z0-9]/gi, "_").substring(0, 50);
    doc.save(`${fn}_abstract.pdf`);
    trackView(ms.id, "pdf_download", ms);
  };

  const handleDownloadFullPDF = () => {
    if (manuscript.manuscript_file_url) {
      const fn = (manuscript.title || "article").replace(/[^a-z0-9]/gi, "_").substring(0, 50) + "_full.pdf";
      downloadPDF(manuscript.manuscript_file_url, fn);
    } else {
      const doc = buildPDF(manuscript);
      const fn = (manuscript.title || "article").replace(/[^a-z0-9]/gi, "_").substring(0, 50);
      doc.save(`${fn}_full.pdf`);
    }
    trackView(manuscript.id, "pdf_download", manuscript);
  };

  const handleOpenFullArticle = () => {
    setPdfOpen(true);
    trackView(manuscript.id, "full_text", manuscript);
  };

  // Keep for backward compat (used in sidebar etc.)
  const handleDownloadPDF = handleDownloadFullPDF;

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

  const getShareableLink = () => {
    // Create shareable link using afriscinexus.com domain
    if (manuscript.doi) {
      return `https://afriscinexus.com/article/${manuscript.doi}`;
    }
    return `https://afriscinexus.com/article/${manuscript.id}`;
  };

  const shareOnTwitter = () => {
    const text = `Check out this article: "${manuscript.title}"`;
    const url = getShareableLink();
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    const url = getShareableLink();
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
    <div className="px-3 sm:px-6 py-4 sm:py-6 bg-slate-50 min-h-screen">
      {pdfOpen && manuscript?.manuscript_file_url && (
        <PDFViewerModal
          url={manuscript.manuscript_file_url}
          title={manuscript.title}
          filename={(manuscript.title || "article").replace(/[^a-z0-9]/gi, "_").substring(0, 50) + "_full.pdf"}
          onClose={() => setPdfOpen(false)}
        />
      )}
      <ScholarMetaTags manuscript={manuscript} journal={journal} coverImage={coverImage || manuscript?.cover_image_url} />
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-8">
            <Card className="bg-white shadow-lg">
              <CardHeader className="px-4 sm:px-6 pb-2 sm:pb-4">
                <Badge className={`${statusColors[manuscript.status]} w-fit mb-3`}>
                  {manuscript.status.replace(/_/g, ' ')}
                </Badge>
                <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 leading-tight">
                  {manuscript.title}
                </CardTitle>
                {/* Meta row — stacks on mobile */}
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-slate-500 pt-2">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="line-clamp-1">{journal?.title || 'Journal not available'}</span>
                  </div>
                  {manuscript.submission_date && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Submitted: {format(new Date(manuscript.submission_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {manuscript.review_type && (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{manuscript.review_type.replace(/_/g, ' ')} review</span>
                    </div>
                  )}
                </div>
                {/* DOI + Published date — wraps on mobile */}
                {manuscript.doi && (
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 pt-3 mt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 min-w-0">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-widest flex-shrink-0">DOI</span>
                      <a
                        href={`https://doi.org/${manuscript.doi}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs sm:text-sm font-mono text-blue-700 hover:text-blue-900 hover:underline font-semibold truncate"
                      >
                        https://doi.org/{manuscript.doi}
                      </a>
                    </div>
                    {manuscript.publication_date && (
                      <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 font-medium self-start">
                        Published: {new Date(manuscript.publication_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                )}
              </CardHeader>

              <CardContent className="px-4 sm:px-6 space-y-5 sm:space-y-6">
                {manuscript.authors && manuscript.authors.length > 0 && (
                  <div>
                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm sm:text-base">
                      <Users className="w-4 h-4"/>Authors
                    </h3>
                    <p className="text-slate-700 text-sm leading-relaxed">
                      {manuscript.authors.map(a => `${a.name}${a.affiliation ? ` (${a.affiliation})` : ''}`).join(', ')}
                    </p>
                  </div>
                )}
                <Separator />
                <div>
                  <h3 className="font-bold text-slate-800 mb-2 text-sm sm:text-base">Abstract</h3>
                  <p className="text-slate-700 leading-relaxed text-sm sm:text-base">{manuscript.abstract}</p>
                  <div className="mt-4">
                    <AISummary title={manuscript.title} abstract={manuscript.abstract} />
                  </div>
                </div>
                {manuscript.keywords && manuscript.keywords.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-bold text-slate-800 mb-2 text-sm sm:text-base">Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {manuscript.keywords.map(kw => <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>)}
                      </div>
                    </div>
                  </>
                )}
                <Separator />

                {/* Full Article Body */}
                {manuscript.formatted_body ? (
                  <div>
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" /> Full Article
                    </h3>
                    <div
                      className="prose max-w-none p-4 sm:p-6 bg-slate-50 rounded-xl border border-slate-200 text-sm sm:text-base overflow-x-auto"
                      style={{ fontFamily: "Times New Roman, serif", lineHeight: "1.8", color: "#1e293b" }}
                      dangerouslySetInnerHTML={{ __html: manuscript.formatted_body }}
                    />
                  </div>
                ) : manuscript.manuscript_file_url ? (
                  <div>
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" /> Read Article
                    </h3>
                    <AnnotatedPDFViewer fileUrl={manuscript.manuscript_file_url} manuscriptId={manuscript.id} />
                  </div>
                ) : null}

                <Separator />

                {/* Action Buttons — full-width stacked on mobile */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
                    <Button onClick={handleDownloadAbstractPDF} variant="outline" className="w-full sm:w-auto border-blue-600 text-blue-700 hover:bg-blue-50 text-sm">
                      <Download className="w-4 h-4 mr-2"/>Abstract PDF
                    </Button>
                    {manuscript.manuscript_file_url && (
                      <>
                        <Button onClick={handleOpenFullArticle} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
                          <FileText className="w-4 h-4 mr-2"/>Read Full Article
                        </Button>
                        <Button onClick={handleDownloadFullPDF} className="w-full sm:w-auto bg-blue-700 hover:bg-blue-800 text-white text-sm">
                          <Download className="w-4 h-4 mr-2"/>Download PDF
                        </Button>
                      </>
                    )}
                  </div>
                  {/* Citation Export */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium w-full sm:w-auto">Export citation:</span>
                    <Button variant="outline" className="flex-1 sm:flex-none border-amber-500 text-amber-700 hover:bg-amber-50 gap-2 text-xs" onClick={handleDownloadBibTeX}>
                      <Download className="w-3.5 h-3.5" />BibTeX
                    </Button>
                    <Button variant="outline" className="flex-1 sm:flex-none border-slate-400 text-slate-700 hover:bg-slate-50 gap-2 text-xs" onClick={handleDownloadRIS}>
                      <Download className="w-3.5 h-3.5" />RIS / EndNote
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

            {/* Suggested Articles */}
            {manuscript.status === 'published' && (
              <SuggestedArticles manuscript={manuscript} journal={journal} />
            )}

            {/* Comments Section */}
            {manuscript.status === 'published' && (
              <Card className="bg-white shadow-lg">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5"/> Discussion
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 space-y-4 sm:space-y-6">
                  <div className="space-y-3">
                    {comments.map(comment => (
                      <div key={comment.id} className="p-3 bg-slate-50 rounded-lg">
                        <p className="font-bold text-sm text-slate-800">{comment.author_name}</p>
                        <p className="text-slate-700 text-sm">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                  {currentUser && (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="text-sm"
                      />
                      <Button onClick={handlePostComment} className="w-full sm:w-auto">Post Comment</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar — appears below main content on mobile */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            <ProgressTracker manuscript={manuscript} showReviewDetails={true} />
            <DOIPanel manuscript={manuscript} journal={journal} onDOIAssigned={handleDOIAssigned} />
            <CitationTracker manuscript={manuscript} journal={journal} onCitationAdded={handleCitationAdded} />
            <ArticleEngagementMetrics manuscript={manuscript} />
            <ArticleSubscribeWidget manuscript={manuscript} />
            <ArticleSocialSharing
              manuscript={manuscript}
              journal={journal}
              coverImage={coverImage || manuscript?.cover_image_url}
            />
            <NewsletterSignup />
          </div>
        </div>
      </div>
    </div>
  );
}