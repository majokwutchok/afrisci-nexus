import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Award,
  Calendar,
  FileText,
  ArrowRight,
  Star
} from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => (
  <Card className={`border-0 shadow-lg bg-gradient-to-br from-${color}-500 to-${color}-600 text-white`}>
    <CardContent className="p-6">
      <Icon className={`w-10 h-10 text-${color}-200 mb-3`} />
      <p className={`text-${color}-100 text-sm`}>{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {subtitle && <p className={`text-${color}-200 text-xs mt-1`}>{subtitle}</p>}
    </CardContent>
  </Card>
);

const PendingReviewCard = ({ manuscript, review, journal }) => {
  const dueDate = new Date(review.review_due_date);
  const daysLeft = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysLeft < 0;
  const isUrgent = daysLeft <= 3 && daysLeft >= 0;

  return (
    <Card className={`hover:shadow-lg transition-shadow ${isOverdue ? 'border-l-4 border-l-red-500' : isUrgent ? 'border-l-4 border-l-orange-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 text-sm line-clamp-2 mb-1">
              {manuscript.title}
            </h4>
            <p className="text-xs text-slate-600">{journal?.title}</p>
          </div>
          <Badge className={`${
            review.status === 'invited' ? 'bg-blue-100 text-blue-800' :
            review.status === 'accepted' ? 'bg-green-100 text-green-800' :
            'bg-slate-100 text-slate-800'
          } border`}>
            {review.status}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-slate-600'}`}>
            <Calendar className="w-3 h-3" />
            {isOverdue ? `Overdue by ${Math.abs(daysLeft)} days` : `Due in ${daysLeft} days`}
          </span>
          <Link to={createPageUrl('ReviewerDashboard')}>
            <Button size="sm" variant={isOverdue || isUrgent ? 'default' : 'outline'}>
              {review.status === 'invited' ? 'Respond' : 'Submit Review'}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ReviewerDashboardSummary() {
  const [user, setUser] = useState(null);
  const [manuscripts, setManuscripts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingInvitations: 0,
    activeReviews: 0,
    completedReviews: 0,
    totalReviews: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [allManuscripts, allJournals] = await Promise.all([
        base44.entities.Manuscript.list(),
        base44.entities.Journal.list()
      ]);

      const reviewerManuscripts = allManuscripts.filter(m => 
        m.review_history?.some(r => r.reviewer_id === currentUser.id)
      );

      setManuscripts(reviewerManuscripts);
      setJournals(allJournals);

      let pendingInvitations = 0;
      let activeReviews = 0;
      let completedReviews = 0;
      let totalReviews = 0;

      reviewerManuscripts.forEach(m => {
        m.review_history?.forEach(r => {
          if (r.reviewer_id === currentUser.id) {
            totalReviews++;
            if (r.status === 'invited') pendingInvitations++;
            else if (r.status === 'accepted') activeReviews++;
            else if (r.status === 'completed') completedReviews++;
          }
        });
      });

      setStats({
        pendingInvitations,
        activeReviews,
        completedReviews,
        totalReviews
      });
    } catch (error) {
      console.error('Error loading reviewer data:', error);
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

  const pendingItems = manuscripts
    .map(m => ({
      manuscript: m,
      review: m.review_history?.find(r => 
        r.reviewer_id === user.id && 
        (r.status === 'invited' || r.status === 'accepted')
      )
    }))
    .filter(item => item.review)
    .sort((a, b) => new Date(a.review.review_due_date) - new Date(b.review.review_due_date));

  const getBadgeLevel = (count) => {
    if (count >= 50) return { level: 'Diamond', color: 'from-cyan-500 to-blue-600', icon: Star };
    if (count >= 25) return { level: 'Gold', color: 'from-yellow-400 to-yellow-600', icon: Award };
    if (count >= 10) return { level: 'Silver', color: 'from-slate-400 to-slate-600', icon: Award };
    return { level: 'Bronze', color: 'from-amber-600 to-amber-800', icon: Award };
  };

  const badge = getBadgeLevel(stats.completedReviews);
  const BadgeIcon = badge.icon;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reviewer Dashboard</h2>
          <p className="text-slate-600 mt-1">Your peer review activity</p>
        </div>
        <Link to={createPageUrl('ReviewerDashboard')}>
          <Button className="bg-teal-600 hover:bg-teal-700">
            Full Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        <StatCard
          icon={Clock}
          title="Pending Invitations"
          value={stats.pendingInvitations}
          subtitle="Awaiting response"
          color="blue"
        />
        <StatCard
          icon={Eye}
          title="Active Reviews"
          value={stats.activeReviews}
          subtitle="In progress"
          color="amber"
        />
        <StatCard
          icon={CheckCircle}
          title="Completed"
          value={stats.completedReviews}
          subtitle="All time"
          color="green"
        />
        <Card className={`border-0 shadow-lg bg-gradient-to-br ${badge.color} text-white`}>
          <CardContent className="p-6">
            <BadgeIcon className="w-10 h-10 text-white/70 mb-3" />
            <p className="text-white/80 text-sm">Reviewer Badge</p>
            <p className="text-3xl font-bold mt-1">{badge.level}</p>
            <p className="text-white/70 text-xs mt-1">Thank you for your service!</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Reviews */}
      {pendingItems.length > 0 ? (
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Pending Reviews ({pendingItems.length})
          </h3>
          <div className="space-y-3">
            {pendingItems.slice(0, 3).map(({ manuscript, review }) => (
              <PendingReviewCard
                key={manuscript.id}
                manuscript={manuscript}
                review={review}
                journal={journals.find(j => j.id === manuscript.journal_id)}
              />
            ))}
          </div>
          {pendingItems.length > 3 && (
            <Link to={createPageUrl('ReviewerDashboard')}>
              <Button variant="outline" className="w-full mt-3">
                View All {pendingItems.length} Pending Reviews
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            You're all caught up! No pending reviews at the moment.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link to={createPageUrl('ReviewGuidelines')}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-100">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Review Guidelines</h4>
                  <p className="text-sm text-slate-600">Best practices for peer review</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl('Profile')}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-100">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Update Expertise</h4>
                  <p className="text-sm text-slate-600">Manage research interests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}