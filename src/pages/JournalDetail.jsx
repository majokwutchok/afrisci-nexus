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
  BookOpen,
  Upload,
  Globe,
  Award,
  CheckCircle,
  FileText,
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  BarChart3
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
  <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-slate-200">
    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
      {editor.full_name?.charAt(0) || 'E'}
    </div>
    <div>
      <h4 className="font-semibold text-slate-900">{editor.full_name}</h4>
      <p className="text-sm text-slate-600">{editor.affiliation || 'Affiliation not provided'}</p>
      <p className="text-xs text-slate-500 mt-1">{editor.country || 'Country not specified'}</p>
    </div>
  </div>
);

export default function JournalDetailPage() {
  const [searchParams] = useSearchParams();
  const journalId = searchParams.get('id');
  
  const [journal, setJournal] = useState(null);
  const [manuscripts, setManuscripts] = useState([]);
  const [allManuscripts, setAllManuscripts] = useState([]);
  const [editors, setEditors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (journalId) {
      loadJournalData();
    }
  }, [journalId]);

  const loadJournalData = async () => {
    setIsLoading(true);
    try {
      const [journalManuscripts, allJournalManuscripts, allUsers, allJournals] = await Promise.all([
        base44.entities.Manuscript.filter({ journal_id: journalId, status: 'published' }, '-publication_date', 20).catch(() => []),
        base44.entities.Manuscript.filter({ journal_id: journalId }, '-created_date', 500).catch(() => []),
        base44.entities.User.list('-created_date', 200).catch(() => []),
        base44.entities.Journal.list('-created_date', 200).catch(() => [])
      ]);
      const journalData = allJournals.find(j => j.id === journalId);
      setJournal(journalData);
      setManuscripts(journalManuscripts);
      setAllManuscripts(allJournalManuscripts);
      setEditors(allUsers.filter(u => u.editor_roles?.includes(journalId)));
    } catch (error) {
      console.error("Error loading journal data:", error);
    }
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

          <TabsContent value="overview" className="space-y-8">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-teal-600" />
                  About This Journal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg text-slate-900 mb-3">Description</h3>
                  <p className="text-slate-700 leading-relaxed">{journal.description}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-6 border-t">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4 text-teal-600" />
                      Editor-in-Chief
                    </h4>
                    <p className="text-slate-700 font-medium">{journal.editor_in_chief || 'To be announced'}</p>
                    {(journal.assistant_editors || []).length > 0 && (
                      <div className="mt-3">
                        <h5 className="text-sm font-semibold text-slate-600 mb-1">Assistant / Associate Editors</h5>
                        <ul className="space-y-1">
                          {journal.assistant_editors.map((name, i) => (
                            <li key={i} className="text-sm text-slate-700">• {name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-teal-600" />
                      Supported Languages
                    </h4>
                    <p className="text-slate-700">
                      {journal.languages?.join(', ') || 'English'}
                    </p>
                  </div>
                </div>

                {journal.is_open_access && (
                  <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-200">
                    <h4 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Open Access Journal
                    </h4>
                    <p className="text-emerald-800">
                      All articles published in this journal are immediately available to read, download, and share under open access terms, ensuring maximum visibility and impact for your research.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
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
              <CardContent>
                {editors.length > 0 ? (
                  <div className="space-y-4">
                    <div className="mb-6">
                      <h3 className="font-semibold text-lg text-slate-900 mb-2">Editor-in-Chief</h3>
                      <p className="text-slate-700 font-medium">{journal.editor_in_chief || 'To be announced'}</p>
                    </div>
                  {(journal.assistant_editors || []).length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-lg text-slate-900 mb-2">Assistant / Associate Editors</h3>
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
                    
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900 mb-4">Associate Editors</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {editors.map(editor => (
                          <EditorCard key={editor.id} editor={editor} />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">Editorial board information will be updated soon.</p>
                  </div>
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
                    Recent Publications
                  </CardTitle>
                  <Link to={createPageUrl("Publications")}>
                    <Button variant="outline" size="sm">
                      View All Articles
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {manuscripts.length > 0 ? (
                  <div className="space-y-4">
                    {manuscripts.map(manuscript => (
                      <ArticleCard key={manuscript.id} manuscript={manuscript} />
                    ))}
                  </div>
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