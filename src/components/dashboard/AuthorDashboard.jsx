import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
  Lightbulb
} from 'lucide-react';
import AuthorJournalRecommendations from './AuthorJournalRecommendations';

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

const ManuscriptCard = ({ manuscript, journal }) => {
  const config = statusConfig[manuscript.status] || statusConfig.draft;
  const Icon = config.icon;
  
  const daysInReview = manuscript.submission_date 
    ? Math.floor((new Date() - new Date(manuscript.submission_date)) / (1000 * 60 * 60 * 24))
    : 0;

  const completedReviews = manuscript.review_history?.filter(r => r.status === 'completed').length || 0;
  const totalReviews = manuscript.review_history?.length || 0;

  return (
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
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-slate-600">{daysInReview} days in review</span>
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

        <Link to={createPageUrl('ManuscriptDetail') + '?id=' + manuscript.id}>
          <Button variant="outline" size="sm" className="w-full">
            View Details
          </Button>
        </Link>
      </CardContent>
    </Card>
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

  const activeManuscripts = manuscripts.filter(m => !['rejected', 'published'].includes(m.status));
  const completedManuscripts = manuscripts.filter(m => ['rejected', 'published', 'accepted'].includes(m.status));
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
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="active">
              Active ({activeManuscripts.length})
            </TabsTrigger>
            <TabsTrigger value="revision">
              Revisions ({revisionNeeded.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedManuscripts.length})
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

          <TabsContent value="completed" className="space-y-4">
            {completedManuscripts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedManuscripts.map(manuscript => (
                  <ManuscriptCard
                    key={manuscript.id}
                    manuscript={manuscript}
                    journal={journals.find(j => j.id === manuscript.journal_id)}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-2 border-dashed">
                <CardContent className="p-12 text-center">
                  <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No completed manuscripts yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}