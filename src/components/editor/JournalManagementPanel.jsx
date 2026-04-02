import React, { useState } from "react";
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BookOpen, Plus, Edit, Trash2, Settings, FileText, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

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

const JournalForm = ({ journal, isOpen, onClose, onSave, allUsers }) => {
  const [formData, setFormData] = useState(journal || {
    title: "",
    category: "stem",
    description: "",
    editor_in_chief: "",
    issn: "",
    is_open_access: true,
    submission_fee: 0,
    languages: ["english"],
    impact_factor: 0,
    status: "active"
  });

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{journal ? 'Edit Journal' : 'Create New Journal'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Journal Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Journal of African Science"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description & Scope *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the journal's scope, aims, and target audience..."
              rows={4}
              className="mt-2"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editor_in_chief">Editor-in-Chief</Label>
              <Input
                id="editor_in_chief"
                value={formData.editor_in_chief}
                onChange={(e) => setFormData({ ...formData, editor_in_chief: e.target.value })}
                placeholder="Dr. Name"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="issn">ISSN</Label>
              <Input
                id="issn"
                value={formData.issn}
                onChange={(e) => setFormData({ ...formData, issn: e.target.value })}
                placeholder="0000-0000"
                className="mt-2"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="submission_fee">Submission Fee (USD)</Label>
              <Input
                id="submission_fee"
                type="number"
                value={formData.submission_fee}
                onChange={(e) => setFormData({ ...formData, submission_fee: parseFloat(e.target.value) || 0 })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="impact_factor">Impact Factor</Label>
              <Input
                id="impact_factor"
                type="number"
                step="0.1"
                value={formData.impact_factor}
                onChange={(e) => setFormData({ ...formData, impact_factor: parseFloat(e.target.value) || 0 })}
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="open_access"
              checked={formData.is_open_access}
              onCheckedChange={(checked) => setFormData({ ...formData, is_open_access: checked })}
            />
            <Label htmlFor="open_access" className="cursor-pointer">
              Open Access Journal
            </Label>
          </div>

          <div>
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!formData.title || !formData.description}>
            {journal ? 'Update Journal' : 'Create Journal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function JournalManagementPanel({ journals, manuscripts, onRefresh, currentUser }) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingJournal, setEditingJournal] = useState(null);
  const [selectedJournal, setSelectedJournal] = useState(null);

  const handleSaveJournal = async (journalData) => {
    try {
      if (editingJournal) {
        await base44.entities.Journal.update(editingJournal.id, journalData);
      } else {
        await base44.entities.Journal.create(journalData);
      }
      setIsCreating(false);
      setEditingJournal(null);
      onRefresh();
    } catch (error) {
      console.error("Error saving journal:", error);
      alert("Failed to save journal. Please try again.");
    }
  };

  const viewJournalManuscripts = (journal) => {
    setSelectedJournal(journal);
  };

  const journalManuscripts = selectedJournal 
    ? manuscripts.filter(m => m.journal_id === selectedJournal.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Journal List */}
      <Card className="border-0 bg-white/80 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-600" />
              Your Journals
            </CardTitle>
            {currentUser?.role === 'admin' && (
              <Button onClick={() => setIsCreating(true)} className="bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4 mr-2" />
                Create New Journal
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {journals.map(journal => (
              <div key={journal.id} className="p-6 border border-slate-200 rounded-xl bg-white hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900">{journal.title}</h3>
                        <p className="text-sm text-slate-600">{journal.editor_in_chief || 'No editor assigned'}</p>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{journal.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge className="bg-blue-100 text-blue-800">
                        {categoryLabels[journal.category]}
                      </Badge>
                      {journal.is_open_access && (
                        <Badge className="bg-green-100 text-green-800">Open Access</Badge>
                      )}
                      {journal.issn && (
                        <Badge variant="outline">ISSN: {journal.issn}</Badge>
                      )}
                      {journal.impact_factor > 0 && (
                        <Badge variant="outline">IF: {journal.impact_factor}</Badge>
                      )}
                      <Badge variant="outline">
                        {manuscripts.filter(m => m.journal_id === journal.id).length} submissions
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => viewJournalManuscripts(journal)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Manuscripts
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingJournal(journal)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Details
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Journal Manuscripts View */}
      {selectedJournal && (
        <Card className="border-0 bg-white/80 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Manuscripts in {selectedJournal.title}</CardTitle>
              <Button variant="ghost" onClick={() => setSelectedJournal(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {journalManuscripts.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No manuscripts submitted to this journal yet.</p>
            ) : (
              <div className="space-y-3">
                {journalManuscripts.map(ms => (
                  <Link key={ms.id} to={createPageUrl(`ManuscriptDetail?id=${ms.id}`)}>
                    <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{ms.title}</h4>
                          <p className="text-xs text-slate-500 mt-1">
                            By {ms.authors?.map(a => a.name).join(', ') || 'Unknown'}
                          </p>
                        </div>
                        <Badge className={
                          ms.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                          ms.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                          ms.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          ms.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-slate-100 text-slate-800'
                        }>
                          {ms.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Journal Dialog */}
      <JournalForm
        journal={editingJournal}
        isOpen={isCreating || !!editingJournal}
        onClose={() => {
          setIsCreating(false);
          setEditingJournal(null);
        }}
        onSave={handleSaveJournal}
      />
    </div>
  );
}