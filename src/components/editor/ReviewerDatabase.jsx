import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Users, Search, Plus, Mail, Star, Tag, Edit, Send,
  Globe, CheckCircle, Clock, XCircle, Loader2
} from 'lucide-react';

const AVAILABILITY_CONFIG = {
  available: { label: 'Available', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  busy: { label: 'Busy', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  unavailable: { label: 'Unavailable', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const EMPTY_REVIEWER = {
  full_name: '', email: '', affiliation: '', country: '', academic_title: '',
  expertise_tags: [], orcid: '', google_scholar_url: '', bio: '',
  availability: 'available', max_reviews_per_month: 3, notes: '', status: 'active'
};

function StarRating({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3 h-3 ${i <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
      ))}
      <span className="text-xs text-slate-500 ml-1">{value ? value.toFixed(1) : 'N/A'}</span>
    </div>
  );
}

function InviteDialog({ reviewer, manuscripts, journals, open, onClose }) {
  const [manuscriptId, setManuscriptId] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().split('T')[0];
  });
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!manuscriptId) return;
    setSending(true);
    const ms = manuscripts.find(m => m.id === manuscriptId);
    try {
      await base44.entities.ReviewInvitation.create({
        manuscript_id: manuscriptId,
        manuscript_title: ms?.title || '',
        reviewer_email: reviewer.email,
        reviewer_name: reviewer.full_name,
        reviewer_profile_id: reviewer.id,
        invitation_date: new Date().toISOString().split('T')[0],
        due_date: dueDate,
        status: 'pending',
        custom_message: customMessage,
      });
      await base44.integrations.Core.SendEmail({
        to: reviewer.email,
        subject: `Peer Review Invitation: ${ms?.title}`,
        body: `Dear ${reviewer.full_name},

We would like to invite you to review the following manuscript submitted to AfriSci Nexus:

📄 Title: ${ms?.title}
📅 Review Due Date: ${dueDate}

${customMessage ? `Message from the Editor:\n${customMessage}\n\n` : ''}To accept or decline this invitation, please visit your Reviewer Portal:
https://afrisco-nexus.base44.app/ReviewerPortal

Your expertise in ${reviewer.expertise_tags?.join(', ') || 'your field'} makes you an excellent candidate for this review.

Best regards,
AfriSci Nexus Editorial Team`
      });
      setSent(true);
    } catch (e) {
      alert('Failed to send invitation.');
    }
    setSending(false);
  };

  if (sent) return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Invitation Sent!</h3>
          <p className="text-slate-500">An email has been sent to <strong>{reviewer.email}</strong>.</p>
          <Button className="mt-6" onClick={() => { setSent(false); onClose(); }}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Send className="w-5 h-5 text-teal-600" /> Invite Reviewer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm">
            <p className="font-semibold text-slate-800">{reviewer.full_name}</p>
            <p className="text-slate-500">{reviewer.email} · {reviewer.affiliation}</p>
          </div>
          <div>
            <Label className="text-slate-700 font-medium">Select Manuscript *</Label>
            <Select value={manuscriptId} onValueChange={setManuscriptId}>
              <SelectTrigger className="mt-1 bg-white border-slate-300 text-slate-900"><SelectValue placeholder="Choose a manuscript..." /></SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                {manuscripts.filter(m => ['submitted','under_review'].includes(m.status)).map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-700 font-medium">Review Due Date</Label>
            <Input type="date" className="mt-1 bg-white border-slate-300 text-slate-900" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-slate-700 font-medium">Custom Message <span className="text-slate-400 font-normal">(optional)</span></Label>
            <Textarea className="mt-1 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" rows={3} value={customMessage} onChange={e => setCustomMessage(e.target.value)} placeholder="Add a personal note to the reviewer..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!manuscriptId || sending} onClick={handleSend} className="bg-teal-600 hover:bg-teal-700">
            {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : <><Send className="w-4 h-4 mr-2" />Send Invitation</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewerForm({ reviewer, open, onClose, onSaved }) {
  const [form, setForm] = useState(reviewer || EMPTY_REVIEWER);
  const [tagsInput, setTagsInput] = useState((reviewer?.expertise_tags || []).join(', '));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(reviewer || EMPTY_REVIEWER);
    setTagsInput((reviewer?.expertise_tags || []).join(', '));
  }, [reviewer]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, expertise_tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean) };
    if (reviewer?.id) {
      await base44.entities.ReviewerProfile.update(reviewer.id, payload);
    } else {
      await base44.entities.ReviewerProfile.create(payload);
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{reviewer?.id ? 'Edit Reviewer Profile' : 'Add Reviewer to Database'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2 md:col-span-1">
            <Label className="text-slate-700 font-medium">Full Name *</Label>
            <Input className="mt-1 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Dr. Jane Smith" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <Label className="text-slate-700 font-medium">Email *</Label>
            <Input className="mt-1 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="reviewer@university.edu" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <Label className="text-slate-700 font-medium">Academic Title</Label>
            <Input className="mt-1 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" value={form.academic_title} onChange={e => set('academic_title', e.target.value)} placeholder="e.g. Associate Professor" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <Label className="text-slate-700 font-medium">Affiliation</Label>
            <Input className="mt-1 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" value={form.affiliation} onChange={e => set('affiliation', e.target.value)} placeholder="University / Institution" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <Label className="text-slate-700 font-medium">Country</Label>
            <Input className="mt-1 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" value={form.country} onChange={e => set('country', e.target.value)} placeholder="e.g. Kenya" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <Label className="text-slate-700 font-medium">Availability</Label>
            <Select value={form.availability} onValueChange={v => set('availability', v)}>
              <SelectTrigger className="mt-1 bg-white border-slate-300 text-slate-900"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="available">✅ Available</SelectItem>
                <SelectItem value="busy">🟡 Busy</SelectItem>
                <SelectItem value="unavailable">🔴 Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-slate-700 font-medium">Expertise Tags <span className="text-slate-400 font-normal">(comma separated)</span></Label>
            <Input className="mt-1 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="machine learning, climate science, public health, NLP..." />
          </div>
          <div className="col-span-2 md:col-span-1">
            <Label className="text-slate-700 font-medium">ORCID</Label>
            <Input className="mt-1 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" value={form.orcid} onChange={e => set('orcid', e.target.value)} placeholder="0000-0000-0000-0000" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <Label className="text-slate-700 font-medium">Google Scholar URL</Label>
            <Input className="mt-1 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" value={form.google_scholar_url} onChange={e => set('google_scholar_url', e.target.value)} placeholder="https://scholar.google.com/..." />
          </div>
          <div className="col-span-2">
            <Label className="text-slate-700 font-medium">Bio / Research Interests</Label>
            <Textarea className="mt-1 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" rows={2} value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Brief description of research focus..." />
          </div>
          <div className="col-span-2">
            <Label className="text-slate-700 font-medium">Internal Notes <span className="text-slate-400 font-normal">(editors only)</span></Label>
            <Textarea className="mt-1 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Private notes for editorial team..." />
          </div>
          <div className="col-span-2 md:col-span-1">
            <Label className="text-slate-700 font-medium">Max Reviews / Month</Label>
            <Input className="mt-1 bg-white border-slate-300 text-slate-900" type="number" min={1} max={10} value={form.max_reviews_per_month} onChange={e => set('max_reviews_per_month', Number(e.target.value))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={saving || !form.full_name || !form.email} onClick={handleSave} className="bg-teal-600 hover:bg-teal-700">
            {saving ? 'Saving...' : 'Save Reviewer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ReviewerDatabase({ manuscripts, journals }) {
  const [reviewers, setReviewers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('all');
  const [editingReviewer, setEditingReviewer] = useState(null);
  const [invitingReviewer, setInvitingReviewer] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const load = async () => {
    setIsLoading(true);
    const data = await base44.entities.ReviewerProfile.list('-created_date', 200);
    setReviewers(data);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = reviewers.filter(r => {
    const matchSearch = !search ||
      r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.affiliation?.toLowerCase().includes(search.toLowerCase()) ||
      r.expertise_tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchAvail = filterAvailability === 'all' || r.availability === filterAvailability;
    return matchSearch && matchAvail;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Users className="w-5 h-5 text-teal-600" /> Reviewer Database</h2>
          <p className="text-sm text-slate-500 mt-0.5">{reviewers.length} reviewers · {reviewers.filter(r => r.availability === 'available').length} available now</p>
        </div>
        <Button onClick={() => { setEditingReviewer(null); setFormOpen(true); }} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-2" /> Add Reviewer
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input className="pl-9" placeholder="Search by name, email, expertise..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterAvailability} onValueChange={setFilterAvailability}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Availability</SelectItem>
            <SelectItem value="available">✅ Available</SelectItem>
            <SelectItem value="busy">🟡 Busy</SelectItem>
            <SelectItem value="unavailable">🔴 Unavailable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviewer Grid */}
      {isLoading ? (
        <p className="text-center text-slate-400 py-12">Loading reviewer database...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No reviewers found.</p>
          <p className="text-sm mt-1">Add reviewers to build your database.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(r => {
            const avail = AVAILABILITY_CONFIG[r.availability] || AVAILABILITY_CONFIG.available;
            const AvailIcon = avail.icon;
            return (
              <Card key={r.id} className="bg-white border border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">{r.full_name}</h3>
                      <p className="text-xs text-slate-500 truncate">{r.academic_title}{r.academic_title && r.affiliation ? ' · ' : ''}{r.affiliation}</p>
                      {r.country && <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Globe className="w-3 h-3" />{r.country}</p>}
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ml-2 flex-shrink-0 ${avail.color}`}>
                      <AvailIcon className="w-3 h-3" />{avail.label}
                    </span>
                  </div>

                  {r.expertise_tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {r.expertise_tags.slice(0, 4).map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                          <Tag className="w-2.5 h-2.5" />{tag}
                        </span>
                      ))}
                      {r.expertise_tags.length > 4 && <span className="text-xs text-slate-400">+{r.expertise_tags.length - 4} more</span>}
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <StarRating value={r.average_rating} />
                    <span className="text-xs text-slate-400">{r.total_reviews_completed || 0} reviews</span>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <Button size="sm" className="flex-1 bg-teal-600 hover:bg-teal-700 text-xs" onClick={() => setInvitingReviewer(r)}>
                      <Mail className="w-3 h-3 mr-1" /> Invite
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => { setEditingReviewer(r); setFormOpen(true); }}>
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ReviewerForm
        reviewer={editingReviewer}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />

      {invitingReviewer && (
        <InviteDialog
          reviewer={invitingReviewer}
          manuscripts={manuscripts || []}
          journals={journals || []}
          open={!!invitingReviewer}
          onClose={() => setInvitingReviewer(null)}
        />
      )}
    </div>
  );
}