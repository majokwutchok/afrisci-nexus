import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { jsPDF } from 'jspdf';
import { stampAfriSciNexus } from '@/utils/pdfStamp';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Upload,
  Eye,
  MessageSquare,
  TrendingUp,
  Calendar,
  Edit,
  Sparkles,
  Download,
  Globe,
  Hash,
  Trash2,
  X,
  Loader2
} from 'lucide-react';
import AuthorJournalRecommendations from './AuthorJournalRecommendations';
import PerformanceNotifications from './PerformanceNotifications';

const statusConfig = {
  draft: { color: 'bg-slate-100 text-slate-800 border-slate-300', icon: Edit, label: 'Draft' },
  submitted: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Clock, label: 'Submitted' },
  editor_assigned: { color: 'bg-cyan-100 text-cyan-800 border-cyan-300', icon: User, label: 'Editor Assigned' },
  under_review: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Eye, label: 'Under Review' },
  revision_requested: { color: 'bg-orange-100 text-orange-800 border-orange-300', icon: AlertCircle, label: 'Revision Requested' },
  revised: { color: 'bg-purple-100 text-purple-800 border-purple-300', icon: CheckCircle, label: 'Revised' },
  accepted: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle, label: 'Accepted' },
  rejected: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle, label: 'Rejected' },
  published: { color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle, label: 'Published' }
};

const QuickActionCard = ({ icon: Icon, title, description, action, color = "blue" }) => (
  <Card className={`border-2 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-${color}-50 to-white`}>
    <CardContent className="p-6">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
          <p className="text-sm text-slate-600 mb-3">{description}</p>
          {action}
        </div>
      </div>
    </CardContent>
  </Card>
);

const ManuscriptCard = ({ manuscript, journal, onRefresh }) => {
  const config = statusConfig[manuscript.status] || statusConfig.draft;
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const pdfRef = useRef(null);
  
  const daysInReview = manuscript.submission_date 
    ? Math.floor((new Date() - new Date(manuscript.submission_date)) / (1000 * 60 * 60 * 24))
    : 0;

  const completedReviews = manuscript.review_history?.filter(r => r.status === 'completed').length || 0;
  const totalReviews = manuscript.review_history?.length || 0;
  const isPublished = manuscript.status === 'published';
  const canWithdraw = ['draft', 'submitted', 'revision_requested', 'rejected'].includes(manuscript.status);

  const buildPreviewPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;
    let y = 22; // start below header stamp
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
    doc.setDrawColor(100); doc.line(margin, y, pageWidth - margin, y); y += 6;
    doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Abstract", margin, y); y += 6;
    doc.setFont("times", "normal"); doc.setFontSize(11);
    const absLines = doc.splitTextToSize(manuscript.abstract || "", contentWidth);
    absLines.forEach(l => { if (y > 270) { doc.addPage(); y = margin; } doc.text(l, margin, y); y += 6; });
    if (manuscript.formatted_body) {
      y += 4; doc.setDrawColor(100); doc.line(margin, y, pageWidth - margin, y); y += 6;
      const div = document.createElement("div"); div.innerHTML = manuscript.formatted_body;
      const bodyText = div.innerText || div.textContent || "";
      doc.setFont("times", "normal"); doc.setFontSize(11);
      const bodyLines = doc.splitTextToSize(bodyText, contentWidth);
      bodyLines.forEach(l => { if (y > 268) { doc.addPage(); y = 22; } doc.text(l, margin, y); y += 6; });
    }
    // Stamp every page with AfriSci Nexus branding
    stampAfriSciNexus(doc, journal?.title || "AfriSci Nexus Discovery");
    return doc;
  };

  const handleWithdraw = async (action) => {
    setWithdrawing(true);
    try {
      if (action === 'delete') {
        await base44.entities.Manuscript.delete(manuscript.id);
      } else {
        await base44.entities.Manuscript.update(manuscript.id, { status: 'draft' });
      }
      setWithdrawOpen(false);
      onRefresh();
    } catch (e) { alert('Failed: ' + (e?.message || e)); }
    setWithdrawing(false);
  };

  const handleUploadPDF = async (file) => {
    if (!file) return;
    setPdfUploading(true);
    try {
      let file_url;
      try {
        const result = await base44.integrations.Core.UploadFile({ file });
        file_url = result.file_url;
      } catch {
        // Credits exhausted — create a local object URL as temporary preview
        file_url = URL.createObjectURL(file);
        setPdfUploading(false);
        setShowUrlInput(true);
        alert('Direct upload is unavailable (integration credits exhausted until 2026-07-25). Please paste a public link to your file instead.');
        return;
      }
      await base44.entities.Manuscript.update(manuscript.id, {
        manuscript_file_url: file_url,
        status: manuscript.status === 'draft' ? 'submitted' : manuscript.status
      });
      onRefresh();
    } catch (e) { alert('Upload failed: ' + (e?.message || e)); }
    setPdfUploading(false);
  };

  const handleSaveUrl = async () => {
    if (!manualUrl.trim()) return;
    setPdfUploading(true);
    try {
      await base44.entities.Manuscript.update(manuscript.id, {
        manuscript_file_url: manualUrl.trim(),
        status: manuscript.status === 'draft' ? 'submitted' : manuscript.status
      });
      setShowUrlInput(false);
      setManualUrl('');
      onRefresh();
    } catch (e) { alert('Failed to save URL: ' + (e?.message || e)); }
    setPdfUploading(false);
  };

  const handlePreview = () => {
    if (manuscript.manuscript_file_url) {
      window.open(manuscript.manuscript_file_url, '_blank');
    } else {
      const doc = buildPreviewPDF();
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <CardTitle className="text-base line-clamp-2 mb-2">{manuscript.title}</CardTitle>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <FileText className="w-3 h-3" />
                {journal?.title || 'Unknown Journal'}
              </div>
            </div>
            <Badge className={`${config.color} border`}>
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {manuscript.doi && (
            <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
              <Hash className="w-3 h-3 text-blue-600 flex-shrink-0" />
              <a href={`https://doi.org/${manuscript.doi}`} target="_blank" rel="noreferrer"
                className="text-xs font-mono text-blue-700 hover:underline truncate">
                {manuscript.doi}
              </a>
            </div>
          )}
          {isPublished && manuscript.publication_date && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
              <Globe className="w-3 h-3 flex-shrink-0" />
              Published: {new Date(manuscript.publication_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600">{daysInReview}d submitted</span>
            </div>
            {totalReviews > 0 && (
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-500" />
                <span className="text-slate-600">{completedReviews}/{totalReviews} reviews</span>
              </div>
            )}
          </div>
          {manuscript.status === 'under_review' && totalReviews > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600">Review Progress</span>
                <span className="text-slate-600">{Math.round((completedReviews / totalReviews) * 100)}%</span>
              </div>
              <Progress value={(completedReviews / totalReviews) * 100} className="h-2" />
            </div>
          )}
          {manuscript.status === 'revision_requested' && (
            <Alert className="bg-orange-50 border-orange-200">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 text-sm">
                Revisions requested. Please review feedback and resubmit.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <Link to={createPageUrl('ManuscriptDetail') + '?id=' + manuscript.id} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="w-3 h-3 mr-1" /> View
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handlePreview} title="Preview how it will look when published">
              <FileText className="w-3 h-3 mr-1" /> Preview
            </Button>
            {manuscript.status === 'revision_requested' && (
              <Link to={createPageUrl('Submit')}>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Edit className="w-3 h-3 mr-1" /> Revise
                </Button>
              </Link>
            )}
          </div>

          {/* PDF Upload for quick publish */}
          <div className="pt-1 border-t border-slate-100 space-y-2">
            <input ref={pdfRef} type="file" accept=".pdf,.doc,.docx,.odt,.tex" className="hidden"
              onChange={e => { const f = e.target.files[0]; if (f) handleUploadPDF(f); }} />
            <Button size="sm" variant="outline" className="w-full text-indigo-700 border-indigo-200 hover:bg-indigo-50"
              onClick={() => pdfRef.current?.click()} disabled={pdfUploading}>
              {pdfUploading
                ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Saving...</>
                : <><Upload className="w-3 h-3 mr-1" /> {manuscript.manuscript_file_url ? 'Replace File' : 'Upload File (PDF/Word)'}</>}
            </Button>
            {showUrlInput && (
              <div className="space-y-1">
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                  ⚠ File upload unavailable. Paste a public link (Google Drive, Dropbox, etc.)
                </p>
                <div className="flex gap-1">
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={manualUrl}
                    onChange={e => setManualUrl(e.target.value)}
                    className="flex-1 text-xs border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                  />
                  <Button size="sm" className="text-xs h-7 bg-indigo-600 hover:bg-indigo-700" onClick={handleSaveUrl} disabled={!manualUrl.trim() || pdfUploading}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => { setShowUrlInput(false); setManualUrl(''); }}>
                    ✕
                  </Button>
                </div>
              </div>
            )}
            {!manuscript.manuscript_file_url && !showUrlInput && (
              <p className="text-xs text-slate-400 text-center">PDF, Word, or LaTeX files accepted</p>
            )}
          </div>

          {/* Withdraw/Delete for eligible statuses */}
          {canWithdraw && (
            <Button size="sm" variant="ghost" className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 text-xs"
              onClick={() => setWithdrawOpen(true)}>
              <Trash2 className="w-3 h-3 mr-1" /> Withdraw / Delete
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="bg-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" /> Withdraw or Delete
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">What would you like to do with <strong>{manuscript.title}</strong>?</p>
          <div className="flex flex-col gap-3 mt-2">
            <Button variant="outline" className="text-orange-700 border-orange-300 hover:bg-orange-50 justify-start"
              disabled={withdrawing} onClick={() => handleWithdraw('withdraw')}>
              {withdrawing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <X className="w-4 h-4 mr-2" />}
              Withdraw — revert to Draft
            </Button>
            <Button variant="outline" className="text-red-700 border-red-300 hover:bg-red-50 justify-start"
              disabled={withdrawing} onClick={() => handleWithdraw('delete')}>
              {withdrawing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Permanently delete
            </Button>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="ghost" size="sm" onClick={() => setWithdrawOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default function AuthorDashboard() {
  const [user, setUser] = useState(null);
  const [manuscripts, setManuscripts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    underReview: 0,
    accepted: 0,
    needsRevision: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [userManuscripts, allJournals] = await Promise.all([
        base44.entities.Manuscript.filter({ created_by: currentUser.email }),
        base44.entities.Journal.list()
      ]);

      setManuscripts(userManuscripts);
      setJournals(allJournals);

      setStats({
        total: userManuscripts.length,
        underReview: userManuscripts.filter(m => ['submitted', 'under_review', 'editor_assigned'].includes(m.status)).length,
        accepted: userManuscripts.filter(m => ['accepted', 'published'].includes(m.status)).length,
        needsRevision: userManuscripts.filter(m => m.status === 'revision_requested').length
      });
    } catch (error) {
      console.error('Error loading author data:', error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const activeManuscripts = manuscripts.filter(m => !['rejected', 'published', 'accepted', 'online_first'].includes(m.status));
  const publishedManuscripts = manuscripts.filter(m => ['published', 'accepted', 'online_first'].includes(m.status));
  const completedManuscripts = manuscripts.filter(m => m.status === 'rejected');
  const revisionNeeded = manuscripts.filter(m => m.status === 'revision_requested');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Author Dashboard</h1>
            <p className="text-slate-600 mt-1">Welcome back, {user?.full_name}</p>
          </div>
          <Link to={createPageUrl('Submit')}>
            <Button className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800">
              <Upload className="w-4 h-4 mr-2" />
              New Submission
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Submissions</p>
                  <p className="text-3xl font-bold mt-1">{stats.total}</p>
                </div>
                <FileText className="w-10 h-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">Under Review</p>
                  <p className="text-3xl font-bold mt-1">{stats.underReview}</p>
                </div>
                <Clock className="w-10 h-10 text-amber-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Needs Revision</p>
                  <p className="text-3xl font-bold mt-1">{stats.needsRevision}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Accepted</p>
                  <p className="text-3xl font-bold mt-1">{stats.accepted}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Notifications */}
        <PerformanceNotifications userEmail={user?.email} />

        {/* Recommended Journals Widget */}
        <AuthorJournalRecommendations userProfile={user} />

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <QuickActionCard
              icon={Sparkles}
              title="AI Manuscript Assessment"
              description="Get instant pre-submission feedback"
              color="purple"
              action={
                <Link to={createPageUrl('Submit')}>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    Try AI Assessment
                  </Button>
                </Link>
              }
            />
            <QuickActionCard
              icon={Upload}
              title="Submit New Manuscript"
              description="Start a new submission with AI assistance"
              color="teal"
              action={
                <Link to={createPageUrl('Submit')}>
                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                    Start Submission
                  </Button>
                </Link>
              }
            />
            <QuickActionCard
              icon={User}
              title="Update Profile"
              description="Keep your author profile current"
              color="purple"
              action={
                <Link to={createPageUrl('Profile')}>
                  <Button size="sm" variant="outline">
                    Edit Profile
                  </Button>
                </Link>
              }
            />
            <QuickActionCard
              icon={TrendingUp}
              title="Browse Journals"
              description="Discover journals for your research"
              color="blue"
              action={
                <Link to={createPageUrl('Journals')}>
                  <Button size="sm" variant="outline">
                    Explore Journals
                  </Button>
                </Link>
              }
            />
          </div>
        </div>

        {/* Manuscripts */}
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="active">
              Active ({activeManuscripts.length})
            </TabsTrigger>
            <TabsTrigger value="revision">
              Revisions ({revisionNeeded.length})
            </TabsTrigger>
            <TabsTrigger value="published" className="text-emerald-700">
              Published ({publishedManuscripts.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Rejected ({completedManuscripts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeManuscripts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeManuscripts.map(manuscript => (
                  <ManuscriptCard
                    key={manuscript.id}
                    manuscript={manuscript}
                    journal={journals.find(j => j.id === manuscript.journal_id)}
                    onRefresh={loadData}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-2 border-dashed">
                <CardContent className="p-12 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 mb-4">No active submissions</p>
                  <Link to={createPageUrl('Submit')}>
                    <Button>Submit Your First Manuscript</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="revision" className="space-y-4">
            {revisionNeeded.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {revisionNeeded.map(manuscript => (
                  <ManuscriptCard
                    key={manuscript.id}
                    manuscript={manuscript}
                    journal={journals.find(j => j.id === manuscript.journal_id)}
                    onRefresh={loadData}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-2 border-dashed">
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                  <p className="text-slate-600">No revisions needed</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="published" className="space-y-4">
            {publishedManuscripts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publishedManuscripts.map(manuscript => (
                  <ManuscriptCard
                    key={manuscript.id}
                    manuscript={manuscript}
                    journal={journals.find(j => j.id === manuscript.journal_id)}
                    onRefresh={loadData}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-2 border-dashed">
                <CardContent className="p-12 text-center">
                  <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No published articles yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedManuscripts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedManuscripts.map(manuscript => (
                  <ManuscriptCard
                    key={manuscript.id}
                    manuscript={manuscript}
                    journal={journals.find(j => j.id === manuscript.journal_id)}
                    onRefresh={loadData}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-2 border-dashed">
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No rejected manuscripts</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}