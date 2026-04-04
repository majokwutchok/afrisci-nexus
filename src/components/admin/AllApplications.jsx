import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, Check, X, AlertCircle, User, Eye, Edit3, 
  FileText, ExternalLink, ChevronDown, ChevronUp, Clock, Filter
} from 'lucide-react';

const ROLE_CONFIG = {
  author: { label: 'Author', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', badgeBg: 'bg-emerald-500', icon: '✍️' },
  reviewer: { label: 'Reviewer', color: 'bg-blue-100 text-blue-800 border-blue-200', badgeBg: 'bg-blue-500', icon: '🔍' },
  editor: { label: 'Editor', color: 'bg-amber-100 text-amber-800 border-amber-200', badgeBg: 'bg-amber-500', icon: '📋' },
};

function ApplicationCard({ app, isProcessing, onApprove, onDecline }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = ROLE_CONFIG[app.role] || ROLE_CONFIG.author;

  return (
    <div className="border border-slate-200 rounded-xl bg-white hover:shadow-md transition-shadow">
      {/* Header row */}
      <div className="flex items-start gap-4 p-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border ${cfg.color}`}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h4 className="font-semibold text-slate-900">{app.full_name}</h4>
            <Badge className={`${cfg.color} border text-xs font-semibold`}>{cfg.label}</Badge>
            {app.academic_title && <span className="text-xs text-slate-500">{app.academic_title}</span>}
          </div>
          <p className="text-sm text-slate-600">{app.affiliation}{app.country ? ` · ${app.country}` : ''}</p>
          <p className="text-xs text-slate-400 mt-0.5">{app.applicant_email}</p>
          {app.research_interests?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {app.research_interests.slice(0, 4).map(i => (
                <Badge key={i} variant="outline" className="text-xs px-1.5 py-0">{i}</Badge>
              ))}
              {app.research_interests.length > 4 && <Badge variant="outline" className="text-xs">+{app.research_interests.length - 4}</Badge>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setExpanded(v => !v)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <Button onClick={onApprove} disabled={isProcessing} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5 mr-1" />Approve</>}
          </Button>
          <Button onClick={onDecline} disabled={isProcessing} size="sm" variant="destructive">
            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><X className="w-3.5 h-3.5 mr-1" />Decline</>}
          </Button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
          {app.motivation && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Motivation</p>
              <p className="text-sm text-slate-700 leading-relaxed">{app.motivation}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            {app.cv_url && (
              <a href={app.cv_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                <FileText className="w-3.5 h-3.5" /> View CV
              </a>
            )}
            {app.credentials_url && (
              <a href={app.credentials_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 font-medium bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100">
                <ExternalLink className="w-3.5 h-3.5" /> Credentials
              </a>
            )}
            {app.google_scholar_url && (
              <a href={app.google_scholar_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100">
                <ExternalLink className="w-3.5 h-3.5" /> Google Scholar
              </a>
            )}
            {app.orcid && (
              <span className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                ORCID: {app.orcid}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">Applied: {new Date(app.created_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      )}
    </div>
  );
}

function ReviewedCard({ app, status }) {
  const cfg = ROLE_CONFIG[app.role] || ROLE_CONFIG.author;
  const isApproved = status === 'approved';
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${isApproved ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${cfg.color} border`}>{cfg.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-900">{app.full_name}</span>
          <Badge className={`${cfg.color} border text-xs`}>{cfg.label}</Badge>
        </div>
        <p className="text-sm text-slate-600">{app.affiliation}{app.country ? ` · ${app.country}` : ''}</p>
        <p className="text-xs text-slate-500">{app.applicant_email}</p>
      </div>
      <Badge className={isApproved ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}>
        {isApproved ? '✓ Approved' : '✗ Declined'}
      </Badge>
    </div>
  );
}

export default function AllApplications() {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');

  const loadApplications = async () => {
    setIsLoading(true);
    const apps = await base44.entities.RoleApplication.list('-created_date', 500);
    setApplications(apps);
    setIsLoading(false);
  };

  useEffect(() => { loadApplications(); }, []);

  const handleDecision = async (app, decision) => {
    setProcessingId(app.id);
    await base44.entities.RoleApplication.update(app.id, {
      status: decision,
      reviewed_date: new Date().toISOString().split('T')[0],
    });

    // Send email notification
    const isApproved = decision === 'approved';
    const roleLabel = ROLE_CONFIG[app.role]?.label || app.role;
    await base44.integrations.Core.SendEmail({
      to: app.applicant_email,
      subject: `${isApproved ? '🎉 Congratulations!' : 'Application Update'} — ${roleLabel} Application — AfriSci Nexus`,
      body: isApproved
        ? `Dear ${app.full_name},\n\nCongratulations! Your application to join AfriSci Nexus as a ${roleLabel} has been approved by our Chief Editor.\n\nYou now have access to your ${roleLabel} dashboard. Welcome to the AfriSci Nexus community!\n\nBest regards,\nMajok Wutchok\nChief Editor, AfriSci Nexus`
        : `Dear ${app.full_name},\n\nThank you for your interest in joining AfriSci Nexus as a ${roleLabel}. After careful review by our editorial team, we are unable to approve your application at this time.\n\nYou are welcome to update your profile and reapply in the future. If you have questions, please contact us.\n\nBest regards,\nMajok Wutchok\nChief Editor, AfriSci Nexus`,
    });

    setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: decision } : a));
    setProcessingId(null);
  };

  const pending = applications.filter(a => a.status === 'pending' || a.status === 'under_review');
  const approved = applications.filter(a => a.status === 'approved');
  const declined = applications.filter(a => a.status === 'rejected');

  const filterByRole = (list) => roleFilter === 'all' ? list : list.filter(a => a.role === roleFilter);

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chief Editor banner */}
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          MW
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">Majok Wutchok</span>
            <Badge className="bg-amber-500 text-white text-xs">Chief Editor</Badge>
          </div>
          <p className="text-sm text-slate-600">All applications are reviewed under the authority of the Chief Editor. Approval/decline emails are sent automatically on your behalf.</p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Role Applications</CardTitle>
              <p className="text-sm text-slate-500 mt-0.5">{pending.length} pending · {approved.length} approved · {declined.length} declined</p>
            </div>
            {/* Role filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              {['all', 'author', 'reviewer', 'editor'].map(r => (
                <button key={r} onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors capitalize ${roleFilter === r ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
                  {r === 'all' ? 'All Roles' : `${ROLE_CONFIG[r]?.icon} ${ROLE_CONFIG[r]?.label}s`}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs defaultValue="pending" className="space-y-5">
            <TabsList className="grid w-full max-w-sm grid-cols-3">
              <TabsTrigger value="pending">
                <Clock className="w-3.5 h-3.5 mr-1" /> Pending ({filterByRole(pending).length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                <Check className="w-3.5 h-3.5 mr-1" /> Approved ({filterByRole(approved).length})
              </TabsTrigger>
              <TabsTrigger value="declined">
                <X className="w-3.5 h-3.5 mr-1" /> Declined ({filterByRole(declined).length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-3">
              {filterByRole(pending).length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No pending applications</p>
                  <p className="text-sm mt-1">New applications from authors, reviewers and editors will appear here.</p>
                </div>
              ) : filterByRole(pending).map(app => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  isProcessing={processingId === app.id}
                  onApprove={() => handleDecision(app, 'approved')}
                  onDecline={() => handleDecision(app, 'rejected')}
                />
              ))}
            </TabsContent>

            <TabsContent value="approved" className="space-y-3">
              {filterByRole(approved).length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>No approved applications yet</p>
                </div>
              ) : filterByRole(approved).map(app => <ReviewedCard key={app.id} app={app} status="approved" />)}
            </TabsContent>

            <TabsContent value="declined" className="space-y-3">
              {filterByRole(declined).length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>No declined applications yet</p>
                </div>
              ) : filterByRole(declined).map(app => <ReviewedCard key={app.id} app={app} status="rejected" />)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}