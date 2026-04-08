import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  CheckCircle, XCircle, Upload, Star, Clock, FileText,
  Shield, AlertCircle, Loader2, BookOpen, Calendar
} from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'Awaiting Response', color: 'bg-amber-100 text-amber-800', icon: Clock },
  accepted: { label: 'Accepted', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  declined: { label: 'Declined', color: 'bg-slate-100 text-slate-600', icon: XCircle },
  completed: { label: 'Review Submitted', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

const RECOMMENDATION_OPTIONS = [
  { value: 'accept', label: '✅ Accept' },
  { value: 'minor_revision', label: '🔵 Minor Revision' },
  { value: 'major_revision', label: '🟡 Major Revision' },
  { value: 'reject', label: '❌ Reject' },
];

function StarPicker({ value, onChange, label }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-1 mt-1">
        {[1,2,3,4,5].map(i => (
          <button key={i} type="button" onClick={() => onChange(i)} className="focus:outline-none">
            <Star className={`w-6 h-6 transition-colors ${i <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

function InvitationCard({ invitation, onRespond, onSubmitReview }) {
  const cfg = STATUS_CONFIG[invitation.status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  const isOverdue = invitation.due_date && new Date(invitation.due_date) < new Date() && invitation.status === 'accepted';

  return (
    <Card className={`border-l-4 ${invitation.status === 'pending' ? 'border-l-amber-400' : invitation.status === 'accepted' ? 'border-l-blue-400' : invitation.status === 'completed' ? 'border-l-green-400' : 'border-l-slate-300'} bg-white shadow-sm hover:shadow-md transition-shadow`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-base leading-snug mb-1">{invitation.manuscript_title}</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Invited: {invitation.invitation_date ? new Date(invitation.invitation_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
              {invitation.due_date && <> · <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>Due: {new Date(invitation.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}{isOverdue ? ' ⚠️ Overdue' : ''}</span></>}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
            <Icon className="w-3.5 h-3.5" />{cfg.label}
          </span>
        </div>

        {invitation.custom_message && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-sm text-blue-900 italic">
            "{invitation.custom_message}"
          </div>
        )}

        {invitation.recommendation && (
          <div className="text-sm text-slate-600 mb-3">
            <span className="font-semibold">Your Recommendation:</span> {RECOMMENDATION_OPTIONS.find(r => r.value === invitation.recommendation)?.label}
          </div>
        )}

        <div className="flex gap-2 pt-3 border-t border-slate-100 flex-wrap">
          {invitation.status === 'pending' && (
            <>
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onRespond(invitation, 'accepted')}>
                <CheckCircle className="w-4 h-4 mr-1" /> Accept
              </Button>
              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => onRespond(invitation, 'declined')}>
                <XCircle className="w-4 h-4 mr-1" /> Decline
              </Button>
            </>
          )}
          {invitation.status === 'accepted' && (
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => onSubmitReview(invitation)}>
              <FileText className="w-4 h-4 mr-1" /> Submit Review
            </Button>
          )}
          {invitation.status === 'completed' && (
            <span className="text-sm text-green-700 font-medium flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Review submitted. Thank you!
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DeclineDialog({ invitation, open, onClose, onDeclined }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleDecline = async () => {
    setSaving(true);
    await base44.entities.ReviewInvitation.update(invitation.id, {
      status: 'declined',
      decline_reason: reason,
      response_date: new Date().toISOString().split('T')[0],
    });
    setSaving(false);
    onDeclined();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Decline Review Invitation</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-slate-600">Please provide a reason so the editor can find an alternative reviewer.</p>
          <Textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Conflict of interest, too busy, outside expertise..." />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleDecline} disabled={saving} className="bg-red-600 hover:bg-red-700">
            {saving ? 'Declining...' : 'Confirm Decline'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewSubmitDialog({ invitation, open, onClose, onSubmitted }) {
  const [form, setForm] = useState({
    review_comments: '',
    confidential_comments: '',
    recommendation: '',
    reviewer_self_rating: 0,
  });
  const [reportFile, setReportFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.recommendation) return alert('Please select a recommendation.');
    setSaving(true);
    let report_url = '';
    if (reportFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: reportFile });
      report_url = file_url;
    }
    await base44.entities.ReviewInvitation.update(invitation.id, {
      status: 'completed',
      review_comments: form.review_comments,
      confidential_comments: form.confidential_comments,
      recommendation: form.recommendation,
      reviewer_self_rating: form.reviewer_self_rating,
      review_report_url: report_url,
      response_date: new Date().toISOString().split('T')[0],
    });
    // Update manuscript review_history
    const manuscript = await base44.entities.Manuscript.filter({ id: invitation.manuscript_id });
    if (manuscript[0]) {
      const ms = manuscript[0];
      const updatedHistory = (ms.review_history || []).map(r =>
        r.reviewer_id === invitation.reviewer_profile_id || r.reviewer_name === invitation.reviewer_name
          ? { ...r, status: 'completed', comments: form.review_comments, confidential_comments: form.confidential_comments, recommendation: form.recommendation, date: new Date().toISOString().split('T')[0] }
          : r
      );
      await base44.entities.Manuscript.update(ms.id, { review_history: updatedHistory });
    }
    setSaving(false);
    onSubmitted();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-teal-600" /> Submit Peer Review</DialogTitle>
        </DialogHeader>
        <div className="bg-slate-50 rounded-lg p-3 text-sm mb-2">
          <p className="font-semibold text-slate-800 line-clamp-1">{invitation.manuscript_title}</p>
        </div>
        <div className="space-y-5 py-1">
          <div>
            <Label>Comments to Authors *</Label>
            <Textarea className="mt-1" rows={5} value={form.review_comments} onChange={e => set('review_comments', e.target.value)} placeholder="Provide detailed, constructive comments for the authors. Address novelty, methodology, presentation, and significance..." />
          </div>
          <div>
            <Label>Confidential Comments to Editor <span className="text-slate-400 font-normal">(not shared with authors)</span></Label>
            <Textarea className="mt-1" rows={3} value={form.confidential_comments} onChange={e => set('confidential_comments', e.target.value)} placeholder="Any concerns about plagiarism, ethics, or other matters for the editor's eyes only..." />
          </div>
          <div>
            <Label>Recommendation *</Label>
            <Select value={form.recommendation} onValueChange={v => set('recommendation', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select your recommendation..." /></SelectTrigger>
              <SelectContent>
                {RECOMMENDATION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Upload Review Report <span className="text-slate-400 font-normal">(optional — PDF, DOCX)</span></Label>
            <div className="mt-1 border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-teal-300 transition-colors cursor-pointer" onClick={() => document.getElementById('review-file').click()}>
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">{reportFile ? reportFile.name : 'Click to upload review report'}</p>
              <input id="review-file" type="file" accept=".pdf,.docx,.doc" className="hidden" onChange={e => setReportFile(e.target.files[0])} />
            </div>
          </div>
          <StarPicker label="Your Confidence Level (1 = Low, 5 = Expert)" value={form.reviewer_self_rating} onChange={v => set('reviewer_self_rating', v)} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.recommendation || !form.review_comments} className="bg-teal-600 hover:bg-teal-700">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ReviewerPortal() {
  const [user, setUser] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [decliningInvitation, setDecliningInvitation] = useState(null);
  const [reviewingInvitation, setReviewingInvitation] = useState(null);

  const load = async () => {
    setIsLoading(true);
    const me = await base44.auth.me();
    setUser(me);
    const data = await base44.entities.ReviewInvitation.filter({ reviewer_email: me.email }, '-invitation_date', 50);
    setInvitations(data);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRespond = async (invitation, response) => {
    if (response === 'declined') {
      setDecliningInvitation(invitation);
      return;
    }
    await base44.entities.ReviewInvitation.update(invitation.id, {
      status: 'accepted',
      response_date: new Date().toISOString().split('T')[0],
    });
    load();
  };

  const pending = invitations.filter(i => i.status === 'pending');
  const active = invitations.filter(i => i.status === 'accepted');
  const history = invitations.filter(i => ['completed','declined','expired'].includes(i.status));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-teal-800 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-teal-300" />
            <div>
              <h1 className="text-2xl font-bold">Reviewer Portal</h1>
              <p className="text-blue-200 text-sm">AfriSci Nexus · Secure Peer Review</p>
            </div>
          </div>
          {user && <p className="text-blue-100 mt-3">Welcome, <strong>{user.full_name}</strong></p>}
          <div className="flex gap-6 mt-4 flex-wrap">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{pending.length}</p>
              <p className="text-xs text-blue-200">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{active.length}</p>
              <p className="text-xs text-blue-200">In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{history.filter(i => i.status === 'completed').length}</p>
              <p className="text-xs text-blue-200">Completed</p>
            </div>
          </div>
        </div>

        {/* Pending Invitations */}
        {pending.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" /> Pending Invitations ({pending.length})
            </h2>
            <div className="space-y-4">
              {pending.map(inv => (
                <InvitationCard key={inv.id} invitation={inv} onRespond={handleRespond} onSubmitReview={setReviewingInvitation} />
              ))}
            </div>
          </div>
        )}

        {/* Active Reviews */}
        {active.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" /> Reviews In Progress ({active.length})
            </h2>
            <div className="space-y-4">
              {active.map(inv => (
                <InvitationCard key={inv.id} invitation={inv} onRespond={handleRespond} onSubmitReview={setReviewingInvitation} />
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-slate-400" /> Review History
            </h2>
            <div className="space-y-3">
              {history.map(inv => (
                <InvitationCard key={inv.id} invitation={inv} onRespond={() => {}} onSubmitReview={() => {}} />
              ))}
            </div>
          </div>
        )}

        {invitations.length === 0 && (
          <Card className="bg-white">
            <CardContent className="py-16 text-center text-slate-400">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No review invitations yet.</p>
              <p className="text-sm mt-1">You'll receive invitations from journal editors here.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {decliningInvitation && (
        <DeclineDialog
          invitation={decliningInvitation}
          open={!!decliningInvitation}
          onClose={() => setDecliningInvitation(null)}
          onDeclined={load}
        />
      )}
      {reviewingInvitation && (
        <ReviewSubmitDialog
          invitation={reviewingInvitation}
          open={!!reviewingInvitation}
          onClose={() => setReviewingInvitation(null)}
          onSubmitted={load}
        />
      )}
    </div>
  );
}