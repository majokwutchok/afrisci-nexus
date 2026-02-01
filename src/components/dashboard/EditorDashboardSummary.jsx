import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  BookOpen,
  Eye,
  ArrowRight,
  TrendingUp,
  Calendar
} from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue", trend }) => (
  <Card className={`border-0 shadow-lg bg-gradient-to-br from-${color}-500 to-${color}-600 text-white`}>
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-3">
        <Icon className={`w-10 h-10 text-${color}-200`} />
        {trend && (
          <div className="flex items-center gap-1 text-xs">
            <TrendingUp className="w-3 h-3" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <p className={`text-${color}-100 text-sm`}>{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {subtitle && <p className={`text-${color}-200 text-xs mt-1`}>{subtitle}</p>}
    </CardContent>
  </Card>
);

const UrgentManuscriptCard = ({ manuscript, journal }) => {
  const daysWaiting = manuscript.submission_date 
    ? Math.floor((new Date() - new Date(manuscript.submission_date)) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 text-sm line-clamp-1 mb-1">
              {manuscript.title}
            </h4>
            <p className="text-xs text-slate-600 mb-2">{journal?.title}</p>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-orange-600">
                <Clock className="w-3 h-3" />
                {daysWaiting} days waiting
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <Users className="w-3 h-3" />
                {manuscript.review_history?.length || 0} reviewers
              </span>
            </div>
          </div>
          <Link to={createPageUrl('EditorDashboard')}>
            <Button size="sm" variant="outline">
              Review
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default function EditorDashboardSummary() {
  const [user, setUser] = useState(null);
  const [manuscripts, setManuscripts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    managedJournals: 0,
    newSubmissions: 0,
    underReview: 0,
    pendingDecisions: 0,
    totalManuscripts: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const hasEditorAccess = currentUser.role === 'admin' || (currentUser.editor_roles && currentUser.editor_roles.length > 0);
      
      if (hasEditorAccess) {
        const [allJournals, allManuscripts] = await Promise.all([
          base44.entities.Journal.list(),
          base44.entities.Manuscript.list()
        ]);

        const managedJournals = currentUser.role === 'admin' 
          ? allJournals 
          : allJournals.filter(j => currentUser.editor_roles.includes(j.id));
        
        setJournals(managedJournals);

        const journalIds = managedJournals.map(j => j.id);
        const managedManuscripts = allManuscripts.filter(m => journalIds.includes(m.journal_id));
        setManuscripts(managedManuscripts);

        const completedReviews = managedManuscripts.filter(m => 
          m.review_history?.every(r => r.status === 'completed') && 
          m.review_history?.length > 0 &&
          m.status === 'under_review'
        );

        setStats({
          managedJournals: managedJournals.length,
          newSubmissions: managedManuscripts.filter(m => m.status === 'submitted').length,
          underReview: managedManuscripts.filter(m => m.status === 'under_review').length,
          pendingDecisions: completedReviews.length,
          totalManuscripts: managedManuscripts.length
        });
      }
    } catch (error) {
      console.error('Error loading editor data:', error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const urgentManuscripts = manuscripts
    .filter(m => m.status === 'submitted')
    .sort((a, b) => new Date(a.submission_date || a.created_date) - new Date(b.submission_date || b.created_date))
    .slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Editor Dashboard</h2>
          <p className="text-slate-600 mt-1">Managing {stats.managedJournals} journal{stats.managedJournals !== 1 ? 's' : ''}</p>
        </div>
        <Link to={createPageUrl('EditorDashboard')}>
          <Button className="bg-teal-600 hover:bg-teal-700">
            Full Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        <StatCard
          icon={BookOpen}
          title="Managed Journals"
          value={stats.managedJournals}
          color="blue"
        />
        <StatCard
          icon={FileText}
          title="New Submissions"
          value={stats.newSubmissions}
          subtitle="Awaiting assignment"
          color="purple"
        />
        <StatCard
          icon={Eye}
          title="Under Review"
          value={stats.underReview}
          subtitle="In peer review"
          color="amber"
        />
        <StatCard
          icon={CheckCircle}
          title="Pending Decisions"
          value={stats.pendingDecisions}
          subtitle="Reviews completed"
          color="green"
        />
      </div>

      {/* Urgent Items */}
      {urgentManuscripts.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Needs Immediate Attention
          </h3>
          <div className="space-y-3">
            {urgentManuscripts.map(manuscript => (
              <UrgentManuscriptCard
                key={manuscript.id}
                manuscript={manuscript}
                journal={journals.find(j => j.id === manuscript.journal_id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link to={createPageUrl('EditorDashboard')}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-teal-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-teal-100">
                  <FileText className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Review Submissions</h4>
                  <p className="text-sm text-slate-600">Manage incoming manuscripts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl('EditorDashboard')}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-100">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Manage Journals</h4>
                  <p className="text-sm text-slate-600">Update policies and settings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}