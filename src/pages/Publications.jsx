import React, { useState, useEffect, useMemo } from 'react';
import PaginationBar from '../components/ui/PaginationBar';
import SEO from '../components/SEO';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, FileText, Download, TrendingUp, Calendar, Users, BookOpen, Eye } from 'lucide-react';
import AISummary from '../components/publication/AISummary';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import { stampAfriSciNexus } from '@/utils/pdfStamp';
import { downloadPDF } from '@/utils/pdfOpen';
import { generateArticleCoverImage } from '@/utils/articleCoverGenerator';
import { trackView } from '@/utils/trackEngagement';
import PDFViewerModal from '@/components/publication/PDFViewerModal';

function buildAbstractPDF(manuscript, journal) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  let y = 22;

  doc.setFont("times", "bold"); doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(manuscript.title || "", contentWidth);
  doc.text(titleLines, margin, y); y += titleLines.length * 8 + 4;

  if (manuscript.authors?.length) {
    doc.setFont("times", "italic"); doc.setFontSize(11);
    const auth = manuscript.authors.map(a => `${a.name}${a.affiliation ? ` (${a.affiliation})` : ""}`).join(", ");
    const authLines = doc.splitTextToSize(auth, contentWidth);
    doc.text(authLines, margin, y); y += authLines.length * 6 + 4;
  }

  if (journal?.title) {
    doc.setFont("times", "normal"); doc.setFontSize(10);
    doc.text(`Journal: ${journal.title}`, margin, y); y += 6;
  }
  if (manuscript.doi) {
    doc.setTextColor(0, 0, 180);
    doc.text(`DOI: https://doi.org/${manuscript.doi}`, margin, y); doc.setTextColor(0, 0, 0); y += 6;
  }
  if (manuscript.publication_date) {
    doc.text(`Published: ${new Date(manuscript.publication_date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`, margin, y); y += 7;
  }

  doc.setDrawColor(100); doc.line(margin, y, pageWidth - margin, y); y += 6;
  doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Abstract", margin, y); y += 6;
  doc.setFont("times", "normal"); doc.setFontSize(11);
  const absLines = doc.splitTextToSize(manuscript.abstract || "", contentWidth);
  absLines.forEach(l => { if (y > 270) { doc.addPage(); y = margin; } doc.text(l, margin, y); y += 6; });
  y += 4;

  if (manuscript.keywords?.length) {
    doc.setFont("times", "bold"); doc.text("Keywords: ", margin, y);
    doc.setFont("times", "italic"); doc.text(manuscript.keywords.join(", "), margin + 22, y); y += 8;
  }

  doc.setFont("times", "italic"); doc.setFontSize(10); doc.setTextColor(100, 100, 100);
  doc.text("For the full article, visit: https://afriscinexus.com or use the DOI link above.", margin, y + 6);
  doc.setTextColor(0, 0, 0);

  stampAfriSciNexus(doc, journal?.title || "AfriSci Nexus Discovery");
  return doc;
}

function buildFullPDF(manuscript, journal) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  let y = 22;

  doc.setFont("times", "bold"); doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(manuscript.title || "", contentWidth);
  doc.text(titleLines, margin, y); y += titleLines.length * 8 + 4;

  if (manuscript.authors?.length) {
    doc.setFont("times", "italic"); doc.setFontSize(11);
    const auth = manuscript.authors.map(a => `${a.name}${a.affiliation ? ` (${a.affiliation})` : ""}`).join(", ");
    const authLines = doc.splitTextToSize(auth, contentWidth);
    doc.text(authLines, margin, y); y += authLines.length * 6 + 4;
  }

  if (manuscript.doi) {
    doc.setFont("times", "normal"); doc.setFontSize(10); doc.setTextColor(0, 0, 180);
    doc.text(`DOI: https://doi.org/${manuscript.doi}`, margin, y); doc.setTextColor(0, 0, 0); y += 7;
  }
  if (manuscript.publication_date) {
    doc.setFontSize(10);
    doc.text(`Published: ${new Date(manuscript.publication_date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`, margin, y); y += 7;
  }

  doc.setDrawColor(100); doc.line(margin, y, pageWidth - margin, y); y += 6;
  doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Abstract", margin, y); y += 6;
  doc.setFont("times", "normal"); doc.setFontSize(11);
  const absLines = doc.splitTextToSize(manuscript.abstract || "", contentWidth);
  absLines.forEach(l => { if (y > 270) { doc.addPage(); y = margin; } doc.text(l, margin, y); y += 6; });
  y += 4;

  if (manuscript.keywords?.length) {
    doc.setFont("times", "bold"); doc.text("Keywords: ", margin, y);
    doc.setFont("times", "italic"); doc.text(manuscript.keywords.join(", "), margin + 22, y); y += 8;
  }

  if (manuscript.formatted_body) {
    doc.setDrawColor(100); doc.line(margin, y, pageWidth - margin, y); y += 6;
    const div = document.createElement("div");
    div.innerHTML = manuscript.formatted_body;
    const bodyText = div.innerText || div.textContent || "";
    doc.setFont("times", "normal"); doc.setFontSize(11);
    const bodyLines = doc.splitTextToSize(bodyText, contentWidth);
    bodyLines.forEach(l => { if (y > 268) { doc.addPage(); y = 22; } doc.text(l, margin, y); y += 6; });
  } else {
    doc.setDrawColor(100); doc.line(margin, y, pageWidth - margin, y); y += 8;
    doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Full Article", margin, y); y += 7;
    doc.setFont("times", "normal"); doc.setFontSize(11);
    const noteLines = doc.splitTextToSize(
      "The full text of this article is available online. Please visit https://afriscinexus.com and use the DOI link above to access the complete article.",
      contentWidth
    );
    noteLines.forEach(l => { doc.text(l, margin, y); y += 6; });
    if (manuscript.manuscript_file_url) {
      y += 4;
      doc.setFont("times", "italic"); doc.setFontSize(10); doc.setTextColor(0, 0, 180);
      const doiLink = manuscript.doi ? `https://doi.org/${manuscript.doi}` : `https://afriscinexus.com/article/${manuscript.id}`;
      const urlLines = doc.splitTextToSize(`Read online: ${doiLink}`, contentWidth);
      urlLines.forEach(l => { doc.text(l, margin, y); y += 5; });
      doc.setTextColor(0, 0, 0);
    }
  }

  stampAfriSciNexus(doc, journal?.title || "AfriSci Nexus Discovery");
  return doc;
}

const PublicationCard = ({ manuscript, journal, onReadFull }) => {
  const fn = (manuscript.title || "article").replace(/[^a-z0-9]/gi, "_").substring(0, 50);

  const [views, setViews] = React.useState(manuscript.view_count || 0);
  const [downloads, setDownloads] = React.useState(manuscript.download_count || 0);
  const [coverImage, setCoverImage] = React.useState(manuscript.cover_image_url);

  React.useEffect(() => {
    if (!coverImage && journal) {
      const generated = generateArticleCoverImage(manuscript, journal);
      setCoverImage(generated);
    }
  }, [manuscript, journal, coverImage]);

  const handleTitleClick = () => {
    setViews(v => v + 1);
    trackView(manuscript.id, "abstract", { ...manuscript, view_count: views });
  };

  const handleAbstractPDF = (e) => {
    e.preventDefault();
    const doc = buildAbstractPDF(manuscript, journal);
    doc.save(`${fn}_abstract.pdf`);
    setDownloads(d => d + 1);
    trackView(manuscript.id, "pdf_download", { ...manuscript, download_count: downloads });
  };

  const handleFullPDF = (e) => {
    e.preventDefault();
    if (manuscript.manuscript_file_url) {
      downloadPDF(manuscript.manuscript_file_url, fn + "_full.pdf");
    } else {
      const doc = buildFullPDF(manuscript, journal);
      doc.save(`${fn}_full.pdf`);
    }
    setDownloads(d => d + 1);
    trackView(manuscript.id, "pdf_download", { ...manuscript, download_count: downloads });
  };

  const handleOpenFullArticle = (e) => {
    e.preventDefault();
    onReadFull(manuscript);
    setViews(v => v + 1);
    trackView(manuscript.id, "full_text", { ...manuscript, view_count: views });
  };

  return (
    <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Link to={createPageUrl(`ManuscriptDetail?id=${manuscript.id}`)} onClick={handleTitleClick}>
              <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight line-clamp-2">
                {manuscript.title}
              </CardTitle>
            </Link>
            <p className="text-sm text-slate-600 font-medium mt-2">
              {manuscript.authors?.map(a => a.name).join(', ') || 'Unknown Authors'}
            </p>
          </div>
          <Badge className="bg-emerald-100 text-emerald-800 flex-shrink-0">Published</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-600 text-sm line-clamp-3">{manuscript.abstract}</p>
        <AISummary title={manuscript.title} abstract={manuscript.abstract} compact />
        
        <div className="flex flex-wrap gap-2">
          {manuscript.keywords?.slice(0, 4).map((keyword) => (
            <Badge key={keyword} variant="outline" className="text-xs">{keyword}</Badge>
          ))}
          {manuscript.keywords?.length > 4 && (
            <Badge variant="outline" className="text-xs text-slate-500">+{manuscript.keywords.length - 4}</Badge>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            <span>{journal?.title || 'Unknown Journal'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{manuscript.publication_date ? format(new Date(manuscript.publication_date), 'MMM yyyy') : 'Recently'}</span>
          </div>
        </div>

        {manuscript.doi && (
          <a
            href={`https://doi.org/${manuscript.doi}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono text-blue-600 hover:text-blue-800 hover:underline truncate block"
          >
            https://doi.org/{manuscript.doi}
          </a>
        )}

        <div className="flex items-center gap-4 text-xs bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
          <div className="flex items-center gap-1 text-slate-600">
            <Eye className="w-3 h-3 text-blue-500" />
            <span className="font-semibold tabular-nums">{views.toLocaleString()}</span>
            <span className="text-slate-400">views</span>
          </div>
          <div className="w-px h-3 bg-slate-200" />
          <div className="flex items-center gap-1 text-slate-600">
            <Download className="w-3 h-3 text-emerald-500" />
            <span className="font-semibold tabular-nums">{downloads.toLocaleString()}</span>
            <span className="text-slate-400">downloads</span>
          </div>
          {manuscript.citation_count > 0 && (
            <>
              <div className="w-px h-3 bg-slate-200" />
              <div className="flex items-center gap-1 text-slate-600">
                <TrendingUp className="w-3 h-3 text-amber-500" />
                <span className="font-semibold tabular-nums">{manuscript.citation_count}</span>
                <span className="text-slate-400">citations</span>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-3">
          {coverImage && (
            <div className="rounded-lg overflow-hidden border border-slate-200">
              <img src={coverImage} alt={manuscript.title} className="w-full h-32 object-cover" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Link to={createPageUrl(`ManuscriptDetail?id=${manuscript.id}`)} className="col-span-2">
              <Button size="sm" variant="outline" className="text-xs w-full">View Details & Share</Button>
            </Link>
            <Button size="sm" variant="outline" className="text-xs border-blue-400 text-blue-700 hover:bg-blue-50" onClick={handleAbstractPDF}>
              <Download className="w-3 h-3 mr-1" />Abstract
            </Button>
            {manuscript.manuscript_file_url ? (
              <>
                <Button size="sm" className="text-xs bg-teal-600 hover:bg-teal-700 text-white" onClick={handleOpenFullArticle}>
                  <FileText className="w-3 h-3 mr-1" />Read Full
                </Button>
                <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white col-span-2" onClick={handleFullPDF}>
                  <Download className="w-3 h-3 mr-1" />Download PDF
                </Button>
              </>
            ) : (
              <div />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PAGE_SIZE = 18;

export default function PublicationsPage() {
  const [manuscripts, setManuscripts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filterJournal, setFilterJournal] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingPdf, setViewingPdf] = useState(null); // { url, title, filename }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [manuscriptData, journalData] = await Promise.all([
        base44.entities.Manuscript.filter({ status: 'published' }, '-publication_date', 500),
        base44.entities.Journal.list('-created_date', 200)
      ]);
      setManuscripts(manuscriptData);
      setJournals(journalData);
    } catch (error) {
      console.error("Error loading publications:", error);
    }
    setIsLoading(false);
  };

  const filteredAndSortedManuscripts = useMemo(() => manuscripts
    .filter(manuscript => {
      const matchesSearch = !searchQuery ||
        manuscript.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manuscript.abstract?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manuscript.authors?.some(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        manuscript.keywords?.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesJournal = filterJournal === 'all' || manuscript.journal_id === filterJournal;
      return matchesSearch && matchesJournal;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent': return new Date(b.publication_date || b.created_date) - new Date(a.publication_date || a.created_date);
        case 'citations': return (b.citation_count || 0) - (a.citation_count || 0);
        case 'views': return (b.view_count || 0) - (a.view_count || 0);
        default: return 0;
      }
    }), [manuscripts, searchQuery, filterJournal, sortBy]);

  const getJournalById = (id) => journals.find(j => j.id === id);

  const totalPages = Math.ceil(filteredAndSortedManuscripts.length / PAGE_SIZE);
  const paginatedManuscripts = filteredAndSortedManuscripts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSearch = (val) => { setSearchQuery(val); setCurrentPage(1); };
  const handleSort = (val) => { setSortBy(val); setCurrentPage(1); };
  const handleJournal = (val) => { setFilterJournal(val); setCurrentPage(1); };

  const handleReadFull = (manuscript) => {
    setViewingPdf({
      url: manuscript.manuscript_file_url,
      title: manuscript.title,
      filename: (manuscript.title || "article").replace(/[^a-z0-9]/gi, "_").substring(0, 50) + "_full.pdf"
    });
  };

  return (
    <div className="px-3 sm:px-6 py-4 sm:py-6 bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100 min-h-screen">
      {viewingPdf && (
        <PDFViewerModal
          url={viewingPdf.url}
          title={viewingPdf.title}
          filename={viewingPdf.filename}
          onClose={() => setViewingPdf(null)}
        />
      )}
      <SEO
        title="Published Research — Peer-Reviewed African Scientific Articles"
        description="Browse thousands of peer-reviewed research articles published in AfriSci Nexus journals. Discover cutting-edge science, medicine, agriculture, and social research from African scholars."
        keywords="African research articles, peer reviewed papers Africa, open access journals Africa, scientific publications Africa, African researchers"
        canonicalPath="/Publications"
        ogType="website"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Published Research — AfriSci Nexus",
          "description": "Browse peer-reviewed African scientific articles",
          "url": "https://afrisco-nexus.base44.app/Publications"
        }}
      />
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Published Research</h1>
          </div>
          <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Explore the latest peer-reviewed scientific articles from across Africa
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          <Card className="border-0 bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg">
            <CardContent className="p-4 sm:p-6 text-center">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-blue-200" />
              <p className="text-2xl sm:text-3xl font-bold mb-0.5">{manuscripts.length}</p>
              <p className="text-xs sm:text-sm text-blue-100">Total Articles</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg">
            <CardContent className="p-4 sm:p-6 text-center">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-emerald-200" />
              <p className="text-2xl sm:text-3xl font-bold mb-0.5">{journals.length}</p>
              <p className="text-xs sm:text-sm text-emerald-100">Journals</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg">
            <CardContent className="p-4 sm:p-6 text-center">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-purple-200" />
              <p className="text-2xl sm:text-3xl font-bold mb-0.5">{[...new Set(manuscripts.flatMap(m => m.authors?.map(a => a.email) || []))].length}</p>
              <p className="text-xs sm:text-sm text-purple-100">Authors</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
            <CardContent className="p-4 sm:p-6 text-center">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-amber-200" />
              <p className="text-2xl sm:text-3xl font-bold mb-0.5">{manuscripts.reduce((sum, m) => sum + (m.citation_count || 0), 0)}</p>
              <p className="text-xs sm:text-sm text-amber-100">Total Citations</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by title, author, keywords..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 py-3 border-slate-200 focus:border-emerald-300 focus:ring-emerald-200 rounded-xl"
                />
              </div>
              <div className="flex gap-3">
                <Select value={sortBy} onValueChange={handleSort}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="citations">Most Cited</SelectItem>
                    <SelectItem value="views">Most Viewed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterJournal} onValueChange={handleJournal}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="All Journals" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Journals</SelectItem>
                    {journals.map((journal) => (
                      <SelectItem key={journal.id} value={journal.id}>{journal.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-slate-600 font-medium">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                Loading publications...
              </span>
            ) : (
              `Showing ${filteredAndSortedManuscripts.length} article${filteredAndSortedManuscripts.length !== 1 ? 's' : ''}`
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <Card key={i} className="border-0 bg-white/80">
                <CardHeader className="pb-4">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : paginatedManuscripts.length > 0 ? (
            paginatedManuscripts.map((manuscript) => (
              <PublicationCard
                key={manuscript.id}
                manuscript={manuscript}
                journal={getJournalById(manuscript.journal_id)}
                onReadFull={handleReadFull}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No articles found</h3>
              <p className="text-slate-600 max-w-md mx-auto">Try adjusting your search criteria or filters to find more articles</p>
            </div>
          )}
        </div>
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={PAGE_SIZE}
          totalItems={filteredAndSortedManuscripts.length}
        />
      </div>
    </div>
  );
}