import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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

const InfoCard = ({ icon: Icon, title, value, color = "teal" }) => (
  <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100/50 p-6 rounded-xl border border-${color}-200`}>
    <div className="flex items-center gap-3 mb-2">
      <Icon className={`w-5 h-5 text-${color}-600`} />
      <span className="text-sm font-medium text-slate-600">{title}</span>
    </div>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
  </div>
);

const ArticleCard = ({ manuscript }) => (
  <Link to={createPageUrl(`ManuscriptDetail?id=${manuscript.id}`)}>
    <div className="p-4 border border-slate-200 rounded-lg hover:border-teal-300 hover:bg-teal-50/30 transition-all duration-200">
      <h4 className="font-semibold text-slate-900 line-clamp-2 mb-2">{manuscript.title}</h4>
      <p className="text-sm text-slate-600 line-clamp-2 mb-3">{manuscript.abstract}</p>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{manuscript.authors?.[0]?.name || 'Unknown Author'}</span>
        <span>{new Date(manuscript.publication_date || manuscript.created_date).toLocaleDateString()}</span>
      </div>
    </div>
  </Link>
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
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Badge className="mb-4 bg-teal-500 text-white">
                {categoryLabels[journal.category]}
              </Badge>
              <h1 className="text-4xl font-bold mb-4">{journal.title}</h1>
              <p className="text-xl text-sky-200 mb-6 max-w-3xl">{journal.description}</p>
              
              <div className="flex flex-wrap gap-4 items-center">
                {journal.is_open_access && (
                  <Badge className="bg-emerald-500 text-white flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Open Access
                  </Badge>
                )}
                {journal.issn && (
                  <Badge variant="outline" className="text-white border-white/50">
                    ISSN: {journal.issn}
                  </Badge>
                )}
                {journal.impact_factor && (
                  <Badge variant="outline" className="text-white border-white/50 flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    Impact Factor: {journal.impact_factor}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="hidden lg:block">
              <Link to={createPageUrl("Submit")}>
                <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-white">
                  <Upload className="w-5 h-5 mr-2" />
                  Submit to This Journal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

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
                          <ArticleCard key={manuscript.id} manuscript={manuscript} />
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