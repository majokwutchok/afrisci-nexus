import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AfriSciLogo from '../components/brand/AfriSciLogo';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen, Upload, Globe, Award, CheckCircle, FileText, Users,
  DollarSign, ChevronLeft, ChevronRight, Mail, Building2,
  ExternalLink, Quote, Download, Eye, Info, Microscope
} from 'lucide-react';
import JournalMetrics from '../components/journal/JournalMetrics';
import { jsPDF } from 'jspdf';
import { stampAfriSciNexus } from '@/utils/pdfStamp';
import { trackView } from '@/utils/trackEngagement';

const categoryLabels = {
  stem: "STEM",
  medicine_health: "Medicine & Health",
  agriculture_environment: "Agriculture & Environment",
  social_sciences: "Social Sciences",
  law_policy: "Law & Policy",
  arts_humanities: "Arts & Humanities",
  business_economics: "Business & Economics",
  education_pedagogy: "Education & Pedagogy",
  interdisciplinary: "Interdisciplinary"
};

const coverDesigns = {
  stem: {
    bg: "from-blue-950 via-blue-900 to-cyan-900",
    accent: "#38BDF8",
    accent2: "#0EA5E9",
    pattern: (
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
        <circle cx="80%" cy="30%" r="120" fill="#38BDF8" fillOpacity="0.15"/>
        <circle cx="10%" cy="70%" r="80" fill="#0EA5E9" fillOpacity="0.1"/>
      </svg>
    ),
    icon: "⚛️",
    tagline: "Science · Technology · Engineering · Mathematics"
  },
  medicine_health: {
    bg: "from-red-950 via-rose-900 to-pink-900",
    accent: "#FB7185",
    accent2: "#F43F5E",
    pattern: (
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <circle cx="85%" cy="20%" r="160" fill="#FB7185" fillOpacity="0.2"/>
        <circle cx="15%" cy="80%" r="100" fill="#F43F5E" fillOpacity="0.15"/>
        <path d="M0 50% Q25% 30% 50% 50% T100% 50%" fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.2"/>
      </svg>
    ),
    icon: "🏥",
    tagline: "Medicine · Public Health · Clinical Research"
  },
  agriculture_environment: {
    bg: "from-green-950 via-green-900 to-emerald-900",
    accent: "#34D399",
    accent2: "#10B981",
    pattern: (
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <circle cx="80%" cy="25%" r="140" fill="#34D399" fillOpacity="0.2"/>
        <circle cx="20%" cy="75%" r="90" fill="#10B981" fillOpacity="0.15"/>
        <path d="M0 60 Q200 20 400 60 T800 60" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.15"/>
      </svg>
    ),
    icon: "🌱",
    tagline: "Agriculture · Environment · Sustainability"
  },
  social_sciences: {
    bg: "from-purple-950 via-violet-900 to-purple-900",
    accent: "#A78BFA",
    accent2: "#8B5CF6",
    pattern: (
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <polygon points="90%,10% 100%,35% 75%,35%" fill="#A78BFA" fillOpacity="0.3"/>
        <polygon points="5%,65% 20%,90% 0%,90%" fill="#8B5CF6" fillOpacity="0.25"/>
        <circle cx="50%" cy="50%" r="200" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.2"/>
      </svg>
    ),
    icon: "🌐",
    tagline: "Sociology · Psychology · Political Science · Development"
  },
  law_policy: {
    bg: "from-slate-950 via-slate-900 to-gray-900",
    accent: "#94A3B8",
    accent2: "#64748B",
    pattern: (
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="lines" width="20" height="20" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="20" y2="20" stroke="white" strokeWidth="0.3"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#lines)"/>
        <rect x="70%" y="10%" width="200" height="200" fill="#94A3B8" fillOpacity="0.1" transform="rotate(15,75%,20%)"/>
      </svg>
    ),
    icon: "⚖️",
    tagline: "Law · Policy · Governance · Human Rights"
  },
  arts_humanities: {
    bg: "from-amber-950 via-orange-900 to-amber-900",
    accent: "#FCD34D",
    accent2: "#F59E0B",
    pattern: (
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <circle cx="75%" cy="30%" r="130" fill="#FCD34D" fillOpacity="0.2"/>
        <circle cx="20%" cy="70%" r="80" fill="#F59E0B" fillOpacity="0.2"/>
        <path d="M 0 100 C 200 0, 400 200, 600 100 S 800 0, 1000 100" fill="none" stroke="#FCD34D" strokeWidth="2" strokeOpacity="0.2"/>
      </svg>
    ),
    icon: "🎨",
    tagline: "Literature · History · Philosophy · African Heritage"
  },
  business_economics: {
    bg: "from-indigo-950 via-indigo-900 to-blue-900",
    accent: "#818CF8",
    accent2: "#6366F1",
    pattern: (
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="15" cy="15" r="1.5" fill="white"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#dots)"/>
        <circle cx="80%" cy="25%" r="150" fill="#818CF8" fillOpacity="0.15"/>
      </svg>
    ),
    icon: "📈",
    tagline: "Economics · Finance · Management · Innovation"
  },
  education_pedagogy: {
    bg: "from-sky-950 via-sky-900 to-blue-900",
    accent: "#7DD3FC",
    accent2: "#38BDF8",
    pattern: (
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <rect x="60%" y="5%" width="150" height="150" rx="16" fill="#7DD3FC" fillOpacity="0.15" transform="rotate(25)"/>
        <rect x="5%" y="60%" width="100" height="100" rx="10" fill="#38BDF8" fillOpacity="0.12" transform="rotate(-15)"/>
        <circle cx="50%" cy="50%" r="180" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.15"/>
      </svg>
    ),
    icon: "🎓",
    tagline: "Education · Pedagogy · Teacher Training · Curriculum"
  },
  interdisciplinary: {
    bg: "from-teal-950 via-teal-900 to-cyan-900",
    accent: "#2DD4BF",
    accent2: "#14B8A6",
    pattern: (
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50%" cy="50%" r="250" fill="none" stroke="#2DD4BF" strokeWidth="1" strokeOpacity="0.3"/>
        <circle cx="50%" cy="50%" r="180" fill="none" stroke="#14B8A6" strokeWidth="0.8" strokeOpacity="0.2"/>
        <circle cx="50%" cy="50%" r="120" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.15"/>
        <circle cx="80%" cy="20%" r="80" fill="#2DD4BF" fillOpacity="0.15"/>
      </svg>
    ),
    icon: "🔬",
    tagline: "Cross-disciplinary · Innovation · SDGs · Africa"
  },
};

const InfoCard = ({ icon: Icon, title, value, color = "teal" }) => (
  <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100/50 p-6 rounded-xl border border-${color}-200`}>
    <div className="flex items-center gap-3 mb-2">
      <Icon className={`w-5 h-5 text-${color}-600`} />
      <span className="text-sm font-medium text-slate-600">{title}</span>
    </div>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
  </div>
);

function downloadBibTeX(manuscript, journal) {
  const authors = manuscript.authors?.map(a => a.name).join(" and ") || "";
  const year = manuscript.publication_date ? new Date(manuscript.publication_date).getFullYear() : new Date().getFullYear();
  const key = `${manuscript.authors?.[0]?.name?.split(" ").pop() || "Author"}${year}`;
  const bib = `@article{${key},\n  title={${manuscript.title || ""}},\n  author={${authors}},\n  year={${year}},\n  doi={${manuscript.doi || ""}},\n  journal={${journal?.title || "AfriSci Nexus"}},\n  keywords={${(manuscript.keywords || []).join(", ")}}\n}`;
  const blob = new Blob([bib], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `${key}.bib`; a.click();
  URL.revokeObjectURL(url);
}

function downloadAbstractPDF(manuscript, journal) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 20, pageWidth = doc.internal.pageSize.getWidth(), contentWidth = pageWidth - margin * 2;
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
  if (journal?.title) { doc.setFont("times", "normal"); doc.setFontSize(10); doc.text(`Journal: ${journal.title}`, margin, y); y += 6; }
  if (manuscript.doi) { doc.setTextColor(0, 0, 180); doc.text(`DOI: https://doi.org/${manuscript.doi}`, margin, y); doc.setTextColor(0, 0, 0); y += 6; }
  if (manuscript.publication_date) { doc.text(`Published: ${new Date(manuscript.publication_date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`, margin, y); y += 7; }
  doc.setDrawColor(100); doc.line(margin, y, pageWidth - margin, y); y += 6;
  doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Abstract", margin, y); y += 6;
  doc.setFont("times", "normal"); doc.setFontSize(11);
  doc.splitTextToSize(manuscript.abstract || "", contentWidth).forEach(l => { if (y > 270) { doc.addPage(); y = margin; } doc.text(l, margin, y); y += 6; });
  y += 4;
  if (manuscript.keywords?.length) { doc.setFont("times", "bold"); doc.text("Keywords: ", margin, y); doc.setFont("times", "italic"); doc.text(manuscript.keywords.join(", "), margin + 22, y); y += 8; }
  doc.setFont("times", "italic"); doc.setFontSize(10); doc.setTextColor(100, 100, 100);
  doc.text("For the full article, visit: https://afriscinexus.com or use the DOI link above.", margin, y + 6); doc.setTextColor(0, 0, 0);
  stampAfriSciNexus(doc, journal?.title || "AfriSci Nexus Discovery");
  doc.save(`${(manuscript.title || "abstract").replace(/[^a-z0-9]/gi, "_").substring(0, 50)}_abstract.pdf`);
  trackView(manuscript.id, "pdf_download", manuscript);
}

function downloadFullPDF(manuscript, journal) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 20, pageWidth = doc.internal.pageSize.getWidth(), contentWidth = pageWidth - margin * 2;
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
  if (manuscript.doi) { doc.setFont("times", "normal"); doc.setFontSize(10); doc.setTextColor(0, 0, 180); doc.text(`DOI: https://doi.org/${manuscript.doi}`, margin, y); doc.setTextColor(0, 0, 0); y += 7; }
  if (manuscript.publication_date) { doc.setFontSize(10); doc.text(`Published: ${new Date(manuscript.publication_date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`, margin, y); y += 7; }
  doc.setDrawColor(100); doc.line(margin, y, pageWidth - margin, y); y += 6;
  doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Abstract", margin, y); y += 6;
  doc.setFont("times", "normal"); doc.setFontSize(11);
  doc.splitTextToSize(manuscript.abstract || "", contentWidth).forEach(l => { if (y > 270) { doc.addPage(); y = margin; } doc.text(l, margin, y); y += 6; });
  y += 4;
  if (manuscript.keywords?.length) { doc.setFont("times", "bold"); doc.text("Keywords: ", margin, y); doc.setFont("times", "italic"); doc.text(manuscript.keywords.join(", "), margin + 22, y); y += 8; }
  if (manuscript.formatted_body) {
    doc.setDrawColor(100); doc.line(margin, y, pageWidth - margin, y); y += 6;
    const div = document.createElement("div"); div.innerHTML = manuscript.formatted_body;
    const bodyText = div.innerText || div.textContent || "";
    doc.setFont("times", "normal"); doc.setFontSize(11);
    doc.splitTextToSize(bodyText, contentWidth).forEach(l => { if (y > 268) { doc.addPage(); y = 22; } doc.text(l, margin, y); y += 6; });
  } else {
    doc.setDrawColor(100); doc.line(margin, y, pageWidth - margin, y); y += 8;
    doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Full Article", margin, y); y += 7;
    doc.setFont("times", "normal"); doc.setFontSize(11);
    doc.splitTextToSize(
      "The full text of this article is available online. Please visit the AfriSci Nexus Discovery portal and use the DOI link above to access the complete article.",
      contentWidth
    ).forEach(l => { doc.text(l, margin, y); y += 6; });
    if (manuscript.manuscript_file_url) {
      y += 4;
      doc.setFont("times", "italic"); doc.setFontSize(10); doc.setTextColor(0, 0, 180);
      doc.splitTextToSize(`Direct link: ${manuscript.manuscript_file_url}`, contentWidth).forEach(l => { doc.text(l, margin, y); y += 5; });
      doc.setTextColor(0, 0, 0);
    }
  }
  stampAfriSciNexus(doc, journal?.title || "AfriSci Nexus Discovery");
  doc.save(`${(manuscript.title || "article").replace(/[^a-z0-9]/gi, "_").substring(0, 50)}_full.pdf`);
  trackView(manuscript.id, "pdf_download", manuscript);
}

const ArticleCard = ({ manuscript, journal }) => (
  <div className="p-4 border border-slate-200 rounded-lg hover:border-teal-300 hover:bg-teal-50/30 transition-all duration-200">
    <Link to={createPageUrl(`ManuscriptDetail?id=${manuscript.id}`)}>
      <h4 className="font-semibold text-slate-900 line-clamp-2 mb-2 hover:text-teal-700">{manuscript.title}</h4>
      <p className="text-sm text-slate-600 line-clamp-2 mb-3">{manuscript.abstract}</p>
      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
        <span>{manuscript.authors?.[0]?.name || 'Unknown Author'}</span>
        <span>{new Date(manuscript.publication_date || manuscript.created_date).toLocaleDateString()}</span>
      </div>
    </Link>
    {manuscript.doi && (
      <a
        href={`https://doi.org/${manuscript.doi}`}
        target="_blank"
        rel="noreferrer"
        className="text-xs font-mono text-blue-600 hover:text-blue-800 hover:underline block mb-2 truncate"
      >
        https://doi.org/{manuscript.doi}
      </a>
    )}
    <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
      {manuscript.view_count > 0 && (
        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{manuscript.view_count.toLocaleString()}</span>
      )}
      {manuscript.download_count > 0 && (
        <span className="flex items-center gap-1"><Download className="w-3 h-3" />{manuscript.download_count.toLocaleString()}</span>
      )}
      {manuscript.citation_count > 0 && (
        <span className="flex items-center gap-1"><Quote className="w-3 h-3" />{manuscript.citation_count}</span>
      )}
    </div>
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" className="text-xs border-blue-400 text-blue-700 hover:bg-blue-50"
        onClick={() => downloadAbstractPDF(manuscript, journal)}>
        <Download className="w-3 h-3 mr-1" />Abstract PDF
      </Button>
      <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
        onClick={() => downloadFullPDF(manuscript, journal)}>
        <Download className="w-3 h-3 mr-1" />Full PDF
      </Button>
      <Button size="sm" variant="outline" className="text-xs border-amber-500 text-amber-700 hover:bg-amber-50"
        onClick={() => downloadBibTeX(manuscript, journal)}>
        <Download className="w-3 h-3 mr-1" />BibTeX
      </Button>
    </div>
  </div>
);

const EditorCard = ({ editor }) => (
  <div className="flex items-start gap-4 p-5 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
    <div className="flex-shrink-0">
      {editor.profile_photo_url ? (
        <img src={editor.profile_photo_url} alt={editor.full_name} className="w-14 h-14 rounded-full object-cover" />
      ) : (
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
          {editor.full_name?.charAt(0) || 'E'}
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold text-slate-900">{editor.full_name}</h4>
      {editor.academic_title && <p className="text-xs text-blue-600 font-medium mt-0.5">{editor.academic_title}</p>}
      {editor.affiliation && (
        <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
          <Building2 className="w-3 h-3 flex-shrink-0" /> {editor.affiliation}
        </p>
      )}
      {editor.country && <p className="text-xs text-slate-500 mt-0.5">{editor.country}</p>}
      {editor.research_interests?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {editor.research_interests.slice(0, 3).map(r => (
            <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
          ))}
        </div>
      )}
      {editor.google_scholar_url && (
        <a href={editor.google_scholar_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:underline">
          <ExternalLink className="w-3 h-3" /> Google Scholar
        </a>
      )}
    </div>
  </div>
);

const ARTICLES_PER_PAGE = 10;

export default function JournalDetailPage() {
  const [searchParams] = useSearchParams();
  const journalId = searchParams.get('id');
  
  const [journal, setJournal] = useState(null);
  const [manuscripts, setManuscripts] = useState([]);
  const [allManuscripts, setAllManuscripts] = useState([]);
  const [editors, setEditors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [articlePage, setArticlePage] = useState(1);

  useEffect(() => {
    if (journalId) loadJournalData();
  }, [journalId]);

  const loadJournalData = async () => {
    setIsLoading(true);
    const [allJournalManuscripts, allJournals, approvedEditors] = await Promise.all([
      base44.entities.Manuscript.filter({ journal_id: journalId }, '-publication_date', 500).catch(() => []),
      base44.entities.Journal.list('-created_date', 200).catch(() => []),
      base44.entities.RoleApplication.filter({ role: 'editor', status: 'approved' }).catch(() => [])
    ]);
    const journalData = allJournals.find(j => j.id === journalId);
    const published = allJournalManuscripts.filter(m => m.status === 'published');
    setJournal(journalData);
    setManuscripts(published);
    setAllManuscripts(allJournalManuscripts);
    setEditors(approvedEditors);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!journal) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto text-center py-20">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Journal Not Found</h2>
          <p className="text-slate-600 mb-6">The journal you're looking for doesn't exist.</p>
          <Link to={createPageUrl("Journals")}>
            <Button>Browse All Journals</Button>
          </Link>
        </div>
      </div>
    );
  }

  const publishedCount = manuscripts.length;
  const submissionFee = journal.submission_fee || 0;

  return (
    <div className="bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 min-h-screen">
      {/* Hero Cover */}
      {(() => {
        const cover = coverDesigns[journal.category] || coverDesigns.interdisciplinary;
        return (
          <div className={`relative bg-gradient-to-br ${cover.bg} text-white overflow-hidden`} style={{ minHeight: '480px' }}>
            {/* Unique pattern overlay */}
            {cover.pattern}

            {/* Dark vignette bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/40 to-transparent" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14">

              {/* Brand header row */}
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <AfriSciLogo variant="header" theme="dark" />
                  <div className="h-8 w-px bg-white/20" />
                  <div>
                    <p className="text-xs font-semibold tracking-[0.3em] uppercase text-white/50">Journal of</p>
                    <p className="text-lg font-bold tracking-[0.15em] uppercase" style={{ color: cover.accent }}>AfriSci Nexus Discovery</p>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <Link to={createPageUrl("Submit")}>
                    <Button size="lg" style={{ backgroundColor: cover.accent, color: '#0f172a' }} className="font-bold hover:opacity-90">
                      <Upload className="w-5 h-5 mr-2" />
                      Submit to This Journal
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Discipline icon + category */}
              <div className="flex items-center gap-3 mb-5">
                <span className="text-4xl">{cover.icon}</span>
                <div>
                  <Badge className="text-xs font-semibold tracking-wider uppercase" style={{ backgroundColor: cover.accent + '30', color: cover.accent, border: `1px solid ${cover.accent}50` }}>
                    {categoryLabels[journal.category]}
                  </Badge>
                  <p className="text-xs mt-1" style={{ color: cover.accent + 'cc' }}>{cover.tagline}</p>
                </div>
              </div>

              {/* Journal title — large branded */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-4 drop-shadow-2xl max-w-4xl">
                {journal.title}
              </h1>

              {/* Description */}
              <p className="text-lg text-white/70 max-w-3xl mb-8 leading-relaxed">{journal.description}</p>

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-4">
                {journal.is_open_access && (
                  <Badge className="bg-emerald-500 text-white flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Open Access
                  </Badge>
                )}
                {journal.issn && (
                  <Badge variant="outline" className="text-white border-white/40 font-mono text-xs">
                    ISSN: {journal.issn}
                  </Badge>
                )}
                {journal.impact_factor && (
                  <Badge variant="outline" className="text-white border-white/40 flex items-center gap-1">
                    <Award className="w-4 h-4" /> IF: {journal.impact_factor}
                  </Badge>
                )}
                {journal.editor_in_chief && (
                  <span className="text-sm text-white/60 flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> Editor-in-Chief: <strong className="text-white">{journal.editor_in_chief}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <InfoCard
            icon={FileText}
            title="Published Articles"
            value={publishedCount}
            color="blue"
          />
          <InfoCard
            icon={Users}
            title="Editorial Board"
            value={editors.length}
            color="purple"
          />
          <InfoCard
            icon={DollarSign}
            title="Submission Fee"
            value={submissionFee > 0 ? `$${submissionFee}` : 'Free'}
            color="emerald"
          />
          <InfoCard
            icon={Globe}
            title="Languages"
            value={journal.languages?.length || 1}
            color="orange"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="aims">Aims & Scope</TabsTrigger>
            <TabsTrigger value="submission">Submission</TabsTrigger>
            <TabsTrigger value="editors">Editorial Board</TabsTrigger>
            <TabsTrigger value="articles">Recent Articles</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* About section */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-6 h-6 text-teal-600" />
                  About This Journal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-slate-700 leading-relaxed text-base">{journal.description}</p>

                {journal.aims_and_scope && (
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <h3 className="font-semibold text-slate-900 mb-2">Aims & Scope</h3>
                    <p className="text-slate-700 leading-relaxed text-sm">{journal.aims_and_scope}</p>
                  </div>
                )}

                <div className="grid md:grid-cols-3 gap-4 pt-2">
                  <div className="bg-teal-50 p-4 rounded-xl border border-teal-200">
                    <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-1">Category</p>
                    <p className="font-semibold text-slate-900">{categoryLabels[journal.category]}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Languages</p>
                    <p className="font-semibold text-slate-900">{journal.languages?.join(', ') || 'English'}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Access Type</p>
                    <p className="font-semibold text-slate-900">{journal.is_open_access ? 'Open Access' : 'Subscription'}</p>
                  </div>
                </div>

                {journal.keywords?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {journal.keywords.map(kw => (
                        <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Editor-in-Chief spotlight */}
            {journal.editor_in_chief && (
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-teal-600" />
                    Editorial Leadership
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                      {journal.editor_in_chief.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Editor-in-Chief</p>
                      <p className="text-lg font-bold text-slate-900">{journal.editor_in_chief}</p>
                    </div>
                  </div>
                  {(journal.assistant_editors || []).length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-700 mb-2 text-sm">Associate / Assistant Editors</h4>
                      <div className="grid md:grid-cols-2 gap-2">
                        {journal.assistant_editors.map((name, i) => (
                          <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="w-7 h-7 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">{name.charAt(0)}</div>
                            <span className="text-sm text-slate-700">{name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {journal.is_open_access && (
              <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200">
                <h4 className="font-semibold text-emerald-900 mb-1 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Open Access Journal
                </h4>
                <p className="text-emerald-800 text-sm">All articles are immediately available to read, download, and share — ensuring maximum visibility and impact for your research.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="aims" className="space-y-6">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle>Aims and Scope</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg text-slate-900 mb-3">Research Focus</h3>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    {journal.title} publishes high-quality, peer-reviewed research in {categoryLabels[journal.category].toLowerCase()}. 
                    The journal welcomes original research articles, reviews, case studies, and methodological papers that advance knowledge in the field.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg text-slate-900 mb-3">Subject Areas</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {getCategorySubjects(journal.category).map((subject, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-700">{subject}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Indexing and Abstracting</h4>
                  <p className="text-blue-800 mb-3">
                    This journal is indexed in major academic databases including:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-100 text-blue-800">Google Scholar</Badge>
                    <Badge className="bg-blue-100 text-blue-800">CrossRef</Badge>
                    <Badge className="bg-blue-100 text-blue-800">DOAJ</Badge>
                    <Badge className="bg-blue-100 text-blue-800">African Journals Online</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submission" className="space-y-6">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-6 h-6 text-teal-600" />
                  Submission Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg text-slate-900 mb-3">Manuscript Requirements</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">Manuscripts should be submitted in Microsoft Word (.doc or .docx) or LaTeX format</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">Include a structured abstract (maximum 300 words)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">Provide 4-6 keywords relevant to your research</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">Follow standard formatting with 12pt font, double-spaced, 1-inch margins</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">Include all necessary ethics statements and declarations</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
                  <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Publication Fees
                  </h4>
                  <p className="text-amber-800">
                    {submissionFee > 0 
                      ? `This journal charges a submission fee of $${submissionFee} USD. Fee waivers are available for authors from low-income countries.`
                      : 'This journal does not charge submission or publication fees. All accepted manuscripts are published free of charge.'}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg text-slate-900 mb-3">Review Process</h3>
                  <div className="space-y-3 text-slate-700">
                    <p>All submissions undergo rigorous peer review:</p>
                    <ol className="list-decimal list-inside space-y-2 pl-4">
                      <li>Initial editorial screening (3-5 days)</li>
                      <li>Double-blind peer review by 2-3 experts (2-4 weeks)</li>
                      <li>Editorial decision and author notification (1 week)</li>
                      <li>Revision period if needed (2-4 weeks)</li>
                      <li>Final acceptance and publication preparation (2-3 weeks)</li>
                    </ol>
                    <p className="pt-2">Average time from submission to first decision: <strong>4-6 weeks</strong></p>
                  </div>
                </div>

                <div className="pt-4">
                  <Link to={createPageUrl("Submit")}>
                    <Button className="w-full md:w-auto bg-teal-600 hover:bg-teal-700">
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Your Manuscript
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="editors" className="space-y-6">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-6 h-6 text-teal-600" />
                  Editorial Board
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Editor-in-Chief from Journal record */}
                {journal.editor_in_chief && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
                    <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">Editor-in-Chief</p>
                    <p className="text-lg font-bold text-slate-900">{journal.editor_in_chief}</p>
                  </div>
                )}

                {/* Assistant editors from journal record */}
                {(journal.assistant_editors || []).length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Associate / Assistant Editors</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {journal.assistant_editors.map((name, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{name.charAt(0)}</div>
                          <span className="text-sm font-medium text-slate-700">{name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approved editors from RoleApplication */}
                {editors.length > 0 ? (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-4">Editorial Board Members</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {editors.map(editor => (
                        <EditorCard key={editor.id} editor={editor} />
                      ))}
                    </div>
                  </div>
                ) : (
                  !journal.editor_in_chief && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-600">Editorial board information will be updated soon.</p>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="articles" className="space-y-6">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-6 h-6 text-teal-600" />
                    Published Articles
                    <Badge variant="secondary" className="ml-2">{manuscripts.length}</Badge>
                  </CardTitle>
                  <Link to={createPageUrl("Publications")}>
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {manuscripts.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {manuscripts
                        .slice((articlePage - 1) * ARTICLES_PER_PAGE, articlePage * ARTICLES_PER_PAGE)
                        .map(manuscript => (
                         <ArticleCard key={manuscript.id} manuscript={manuscript} journal={journal} />
                        ))}
                    </div>
                    {/* Pagination */}
                    {manuscripts.length > ARTICLES_PER_PAGE && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
                        <p className="text-sm text-slate-500">
                          Showing {(articlePage - 1) * ARTICLES_PER_PAGE + 1}–{Math.min(articlePage * ARTICLES_PER_PAGE, manuscripts.length)} of {manuscripts.length}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setArticlePage(p => p - 1)} disabled={articlePage === 1}>
                            <ChevronLeft className="w-4 h-4" /> Prev
                          </Button>
                          {Array.from({ length: Math.ceil(manuscripts.length / ARTICLES_PER_PAGE) }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === Math.ceil(manuscripts.length / ARTICLES_PER_PAGE) || Math.abs(p - articlePage) <= 1)
                            .map((p, idx, arr) => (
                              <React.Fragment key={p}>
                                {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-slate-400">…</span>}
                                <Button
                                  variant={p === articlePage ? 'default' : 'outline'}
                                  size="sm"
                                  className="w-9"
                                  onClick={() => setArticlePage(p)}
                                >{p}</Button>
                              </React.Fragment>
                            ))}
                          <Button variant="outline" size="sm" onClick={() => setArticlePage(p => p + 1)} disabled={articlePage === Math.ceil(manuscripts.length / ARTICLES_PER_PAGE)}>
                            Next <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">No published articles yet. Be the first to submit!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            <JournalMetrics
              journal={journal}
              allManuscripts={allManuscripts}
              publishedManuscripts={manuscripts}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Helper function to get subject areas by category
function getCategorySubjects(category) {
  const subjects = {
    stem: [
      "Computer Science & Information Technology",
      "Engineering (Civil, Mechanical, Electrical)",
      "Mathematics & Statistics",
      "Physics & Astronomy",
      "Chemistry & Materials Science",
      "Biotechnology & Life Sciences"
    ],
    medicine_health: [
      "Clinical Medicine & Surgery",
      "Public Health & Epidemiology",
      "Pharmacology & Drug Development",
      "Medical Diagnostics & Imaging",
      "Tropical & Infectious Diseases",
      "Nutrition & Health Sciences"
    ],
    agriculture_environment: [
      "Sustainable Agriculture & Food Security",
      "Climate Change & Environmental Science",
      "Water Resources Management",
      "Biodiversity & Conservation",
      "Soil Science & Agronomy",
      "Forestry & Natural Resources"
    ],
    social_sciences: [
      "Sociology & Anthropology",
      "Psychology & Behavioral Sciences",
      "Political Science & Governance",
      "Development Studies",
      "Gender Studies & Social Policy",
      "Urban Planning & Geography"
    ],
    law_policy: [
      "Constitutional & Human Rights Law",
      "International Law & Relations",
      "Environmental & Resource Law",
      "Commercial & Corporate Law",
      "Public Policy & Administration",
      "Criminal Justice & Criminology"
    ],
    arts_humanities: [
      "Literature & Linguistics",
      "History & Archaeology",
      "Philosophy & Ethics",
      "African Studies & Cultural Heritage",
      "Media & Communication Studies",
      "Performing & Visual Arts"
    ],
    business_economics: [
      "Economics & Development",
      "Finance & Banking",
      "Management & Entrepreneurship",
      "Marketing & Consumer Behavior",
      "Accounting & Auditing",
      "International Business & Trade"
    ],
    education_pedagogy: [
      "Curriculum Development & Assessment",
      "Educational Technology & Innovation",
      "Teacher Training & Professional Development",
      "Early Childhood Education",
      "Higher Education & Adult Learning",
      "Special Education & Inclusive Practices"
    ],
    interdisciplinary: [
      "Sustainable Development Goals (SDGs)",
      "Innovation & Technology Transfer",
      "Digital Transformation",
      "Health Systems & Policy",
      "Climate Action & Resilience",
      "Cross-Cultural Research"
    ]
  };
  
  return subjects[category] || [];
}