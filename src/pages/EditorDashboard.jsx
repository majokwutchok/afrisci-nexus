import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Edit, UserPlus, Check, X, Mail, Settings, AlertCircle, BookOpen } from "lucide-react";
import AutomatedReminderSystem from "../components/admin/AutomatedReminderSystem";
import JournalManagementPanel from "../components/editor/JournalManagementPanel";
import AIReviewAnalyzer from "../components/editor/AIReviewAnalyzer";
import ReviewScoreSummary from "../components/editor/ReviewScoreSummary";

// Mock utility functions (in a real app, these would be in a utils folder or separate services)
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const SendEmail = async ({ to, subject, body }) => {
  console.log(`Sending email to: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${body}`);
  return Promise.resolve({ success: true, message: "Email sent (mock)" });
};

const scheduleReminders = async (manuscriptId, reviewerId, inviteDate) => {
  console.log(`Scheduling reminders for manuscript ${manuscriptId}, reviewer ${reviewerId}, invited on ${inviteDate}`);
  return Promise.resolve({ success: true, message: "Reminders scheduled (mock)" });
};

const statusColors = {
  submitted: "bg-blue-100 text-blue-800 border-blue-200",
  under_review: "bg-yellow-100 text-yellow-800 border-yellow-200",
  revision_requested: "bg-orange-100 text-orange-800 border-orange-200",
  accepted: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200"
};

const ManuscriptCard = ({ manuscript, onAssignReviewer, onMakeDecision }) => {
  return (
    <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-bold line-clamp-2">{manuscript.title}</CardTitle>
          <Badge className={statusColors[manuscript.status]}>{manuscript.status.replace('_', ' ')}</Badge>
        </div>
        <p className="text-xs text-slate-500">Submitted: {new Date(manuscript.submission_date || manuscript.created_date).toLocaleDateString()}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600 line-clamp-3">{manuscript.abstract}</p>
        <div className="text-xs">
          <strong>Authors:</strong> {manuscript.authors?.map(a => a.name).join(', ') || 'No authors listed'}
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Button size="sm" variant="outline" onClick={() => onAssignReviewer(manuscript)}>
            <UserPlus className="w-4 h-4 mr-2" /> Assign Reviewer
          </Button>
          <Button size="sm" variant="outline" onClick={() => onMakeDecision(manuscript)}>
            <Edit className="w-4 h-4 mr-2" /> Make Decision
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const JournalPolicyEditor = ({ journal, isOpen, onClose, onSave }) => {
  const [policyData, setPolicyData] = useState({ ...journal });

  useEffect(() => {
    setPolicyData({ ...journal });
  }, [journal]);

  if (!journal) return null;

  const handleSave = () => {
    const updatedFields = {
      description: policyData.description,
      submission_fee: Number(policyData.submission_fee),
    };
    onSave(journal.id, updatedFields);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Journal Policy: {journal.title}</DialogTitle>
          <DialogDescription>
            Update the journal's scope, fees, and other policies.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="description">Journal Scope/Description</Label>
            <Textarea
              id="description"
              value={policyData.description || ""}
              onChange={(e) => setPolicyData(prev => ({ ...prev, description: e.target.value }))}
              rows={5}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="submission_fee">Submission Fee (USD)</Label>
            <Input
              id="submission_fee"
              type="number"
              value={policyData.submission_fee || 0}
              onChange={(e) => setPolicyData(prev => ({ ...prev, submission_fee: e.target.value }))}
              className="mt-2"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Policy</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function EditorDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [editorJournals, setEditorJournals] = useState([]);
  const [manuscripts, setManuscripts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedManuscript, setSelectedManuscript] = useState(null);
  const [reviewerSearch, setReviewerSearch] = useState("");
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      // Check if user has editor roles or is admin
      const hasEditorAccess = user.role === 'admin' || (user.editor_roles && user.editor_roles.length > 0);
      
      if (hasEditorAccess) {
        const [allJournals, allManuscripts, allUsersData] = await Promise.all([
          base44.entities.Journal.list(),
          base44.entities.Manuscript.list(),
          base44.entities.User.list()
        ]);

        // If admin, show all journals; if editor, show only assigned journals
        const journals = user.role === 'admin' 
          ? allJournals 
          : allJournals.filter(j => user.editor_roles.includes(j.id));
        
        setEditorJournals(journals);

        const journalIds = journals.map(j => j.id);
        const managedManuscripts = allManuscripts.filter(m => journalIds.includes(m.journal_id));
        setManuscripts(managedManuscripts);
        setAllUsers(allUsersData);
      } else {
        setError("You don't have editor permissions for any journals.");
      }
    } catch (error) {
      console.error("Error loading editor data:", error);
      setError("Failed to load editor dashboard data.");
    }
    setIsLoading(false);
  };

  const assignReviewer = async (manuscript, reviewerEmail) => {
    const reviewer = allUsers.find(u => u.email === reviewerEmail);
    if (!reviewer) {
      alert("Reviewer with this email not found.");
      return;
    }

    const review = {
      reviewer_id: reviewer.id,
      reviewer_name: manuscript.review_type === 'open_review' ? reviewer.full_name : undefined,
      status: 'invited',
      date: new Date().toISOString().split('T')[0],
      reminder_count: 0,
      review_due_date: addDays(new Date(), 14).toISOString().split('T')[0]
    };

    const updatedHistory = [...(manuscript.review_history || []), review];
    const timeline = [...(manuscript.timeline || []), {
      status: 'under_review',
      date: new Date().toISOString().split('T')[0],
      actor: 'Editor',
      comment: `Reviewer assigned: ${manuscript.review_type === 'open_review' ? reviewer.full_name : 'Anonymous'}`
    }];

    try {
      await base44.entities.Manuscript.update(manuscript.id, {
        review_history: updatedHistory,
        timeline,
        status: 'under_review'
      });

      await scheduleReminders(manuscript.id, reviewer.id, new Date().toISOString().split('T')[0]);

      await SendEmail({
        to: reviewer.email,
        subject: `Invitation to Review: ${manuscript.title}`,
        body: `Dear ${reviewer.full_name},

You have been invited to review the following manuscript:

Title: ${manuscript.title}
Authors: ${manuscript.authors?.map(a => a.name).join(', ') || 'No authors listed'}

Please respond within 3 days to accept or decline this review invitation.

Best regards,
Editorial Team`
      });

      setReviewerSearch("");
      setSelectedManuscript(null);
      loadData();
    } catch (error) {
      console.error("Error assigning reviewer:", error);
      alert("Failed to assign reviewer. Please try again.");
    }
  };

  const handleMakeDecision = async (manuscript, decision) => {
    const timeline = [...(manuscript.timeline || []), {
      status: decision,
      date: new Date().toISOString().split('T')[0],
      actor: 'Editor',
      comment: `Editorial decision: ${decision.replace('_', ' ')}`
    }];

    try {
      await base44.entities.Manuscript.update(manuscript.id, { 
        status: decision,
        timeline
      });
      setSelectedManuscript(null);
      loadData();
    } catch (error) {
      console.error("Error making decision:", error);
      alert("Failed to update manuscript status. Please try again.");
    }
  };

  const handleOpenPolicyEditor = (journal) => {
    setEditingJournal(journal);
    setIsPolicyModalOpen(true);
  };
  
  const handleSavePolicy = async (journalId, updatedData) => {
    try {
      await base44.entities.Journal.update(journalId, updatedData);
      setIsPolicyModalOpen(false);
      setEditingJournal(null);
      loadData();
    } catch (error) {
      console.error("Failed to save journal policy:", error);
      alert("Failed to save policy changes. Please try again.");
    }
  };

  const getManuscriptsByStatus = (status) => manuscripts.filter(m => m.status === status);

  if (isLoading) return <div className="p-6">Loading editor dashboard...</div>;
  
  if (error) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <Card className="border-0 bg-white shadow-lg">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Restricted</h2>
              <p className="text-slate-600">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Editor Dashboard</h1>
          <Badge variant="outline" className="text-sm">
            Managing {editorJournals.length} journal{editorJournals.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <Tabs defaultValue="new_submissions">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="new_submissions">New Submissions</TabsTrigger>
            <TabsTrigger value="under_review">Under Review</TabsTrigger>
            <TabsTrigger value="revisions">Revisions</TabsTrigger>
            <TabsTrigger value="journal_management" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Journals
            </TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
          </TabsList>

          <TabsContent value="new_submissions" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getManuscriptsByStatus('submitted').map(ms => (
                <ManuscriptCard
                  key={ms.id}
                  manuscript={ms}
                  onAssignReviewer={() => setSelectedManuscript(ms)}
                  onMakeDecision={() => setSelectedManuscript(ms)}
                />
              ))}
            </div>
            {getManuscriptsByStatus('submitted').length === 0 && (
              <p className="text-center text-slate-500 py-8">No new submissions to review.</p>
            )}
          </TabsContent>

          <TabsContent value="under_review" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getManuscriptsByStatus('under_review').map(ms => (
                <ManuscriptCard
                  key={ms.id}
                  manuscript={ms}
                  onAssignReviewer={() => setSelectedManuscript(ms)}
                  onMakeDecision={() => setSelectedManuscript(ms)}
                />
              ))}
            </div>
            {getManuscriptsByStatus('under_review').length === 0 && (
              <p className="text-center text-slate-500 py-8">No manuscripts currently under review.</p>
            )}
          </TabsContent>

          <TabsContent value="revisions" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getManuscriptsByStatus('revision_requested').map(ms => (
                <ManuscriptCard
                  key={ms.id}
                  manuscript={ms}
                  onAssignReviewer={() => setSelectedManuscript(ms)}
                  onMakeDecision={() => setSelectedManuscript(ms)}
                />
              ))}
            </div>
            {getManuscriptsByStatus('revision_requested').length === 0 && (
              <p className="text-center text-slate-500 py-8">No manuscripts awaiting revisions.</p>
            )}
          </TabsContent>

          <TabsContent value="reminders" className="mt-6">
            <AutomatedReminderSystem />
          </TabsContent>

          <TabsContent value="journal_management" className="mt-6">
            <JournalManagementPanel 
              journals={editorJournals}
              manuscripts={manuscripts}
              onRefresh={loadData}
              currentUser={currentUser}
            />
          </TabsContent>
        </Tabs>

        <Dialog open={!!selectedManuscript} onOpenChange={() => { setSelectedManuscript(null); setReviewerSearch(""); }}>
          <DialogContent>
            {selectedManuscript && (
              <>
                <DialogHeader>
                  <DialogTitle>Manage Manuscript</DialogTitle>
                  <DialogDescription>
                    {selectedManuscript.title}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Aggregate Score Summary */}
                  <ReviewScoreSummary
                    manuscript={selectedManuscript}
                    onDecisionSuggested={(decision) => handleMakeDecision(selectedManuscript, decision)}
                  />

                  {/* AI Review Analysis */}
                  {selectedManuscript.review_history && selectedManuscript.review_history.some(r => r.status === 'completed') && (
                    <AIReviewAnalyzer 
                      manuscript={selectedManuscript}
                      onDecisionSuggested={(decision) => handleMakeDecision(selectedManuscript, decision)}
                    />
                  )}
                  <div>
                    <Label htmlFor="reviewer-email">Assign Reviewer</Label>
                    <div className="flex gap-2">
                       <Input
                         id="reviewer-email"
                         type="email"
                         placeholder="Enter reviewer email"
                         value={reviewerSearch}
                         onChange={(e) => setReviewerSearch(e.target.value)}
                       />
                       <Button onClick={() => assignReviewer(selectedManuscript, reviewerSearch)}>
                         <Mail className="w-4 h-4 mr-2" /> Invite
                       </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Make Decision</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" className="text-green-600" onClick={() => handleMakeDecision(selectedManuscript, 'accepted')}>
                        <Check className="w-4 h-4 mr-2"/> Accept
                      </Button>
                      <Button variant="outline" className="text-red-600" onClick={() => handleMakeDecision(selectedManuscript, 'rejected')}>
                        <X className="w-4 h-4 mr-2"/> Reject
                      </Button>
                      <Button variant="outline" className="text-orange-600" onClick={() => handleMakeDecision(selectedManuscript, 'revision_requested')}>
                        <Edit className="w-4 h-4 mr-2"/> Request Revision
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => { setSelectedManuscript(null); setReviewerSearch(""); }}>Close</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        <JournalPolicyEditor
          journal={editingJournal}
          isOpen={isPolicyModalOpen}
          onClose={() => setIsPolicyModalOpen(false)}
          onSave={handleSavePolicy}
        />
      </div>
    </div>
  );
}