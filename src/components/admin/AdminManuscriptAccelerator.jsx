import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Loader2, CheckCircle, AlertCircle, Zap, FileText, Eye, Send
} from 'lucide-react';

export default function AdminManuscriptAccelerator() {
  const [manuscripts, setManuscripts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedManuscript, setSelectedManuscript] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiReview, setAiReview] = useState('');
  const [adminDecision, setAdminDecision] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadManuscripts();
  }, []);

  const loadManuscripts = async () => {
    setIsLoading(true);
    const allMs = await base44.entities.Manuscript.list('-created_date', 500);
    const pending = allMs.filter(m => ['submitted', 'editor_assigned', 'under_review'].includes(m.status));
    setManuscripts(pending);
    setIsLoading(false);
  };

  const generateAIReview = async (manuscript) => {
    setIsProcessing(true);
    const prompt = `You are a senior peer reviewer. Provide a concise professional review (3-4 sentences) of this manuscript:

Title: ${manuscript.title}
Abstract: ${manuscript.abstract}
Keywords: ${manuscript.keywords?.join(', ')}

Assess: originality, methodology soundness, relevance, and contribution. Be constructive.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          assessment: { type: 'string' },
          recommendation: { type: 'string', enum: ['accept', 'minor_revision', 'major_revision', 'reject'] }
        }
      }
    }).catch(e => {
      console.error('AI review error:', e);
      return null;
    });

    if (result) {
      setAiReview(`Assessment: ${result.assessment}\n\nRecommendation: ${result.recommendation.toUpperCase()}`);
    }
    setIsProcessing(false);
  };

  const handlePublish = async () => {
    if (!selectedManuscript || !adminDecision) {
      alert('Please select a decision (accept/minor/major/reject)');
      return;
    }
    setIsProcessing(true);

    const statusMap = {
      accept: 'accepted',
      minor_revision: 'revision_requested',
      major_revision: 'revision_requested',
      reject: 'rejected'
    };

    const timeline = [
      ...(selectedManuscript.timeline || []),
      {
        status: statusMap[adminDecision],
        date: new Date().toISOString().split('T')[0],
        actor: 'Admin (Chief Editor)',
        comment: adminNotes || `Admin decision: ${adminDecision}`
      }
    ];

    const update = {
      status: statusMap[adminDecision],
      timeline,
      admin_notes: adminNotes
    };

    if (adminDecision === 'accept') {
      update.status = 'accepted';
      update.publication_date = new Date().toISOString().split('T')[0];
    }

    await base44.entities.Manuscript.update(selectedManuscript.id, update);

    setSuccessMessage(`Manuscript ${adminDecision}ed! Author notified.`);
    setSelectedManuscript(null);
    setAdminDecision('');
    setAdminNotes('');
    setAiReview('');
    loadManuscripts();
    setTimeout(() => setSuccessMessage(''), 3000);
    setIsProcessing(false);
  };

  const statusColors = {
    submitted: 'bg-blue-100 text-blue-800',
    editor_assigned: 'bg-purple-100 text-purple-800',
    under_review: 'bg-amber-100 text-amber-800'
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Zap className="w-6 h-6 text-amber-600" />
        <div>
          <h2 className="text-xl font-bold text-slate-900">Manuscript Accelerator</h2>
          <p className="text-sm text-slate-500">Assess & approve manuscripts with AI-assisted reviews. Authors track progress in real-time.</p>
        </div>
      </div>

      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Manuscript List */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900">Pending Manuscripts ({manuscripts.length})</h3>
          {manuscripts.length === 0 ? (
            <Card className="bg-slate-50 text-center py-8">
              <p className="text-slate-500">No pending manuscripts to review.</p>
            </Card>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {manuscripts.map(ms => (
                <Card
                  key={ms.id}
                  className={`cursor-pointer transition-all border-2 ${selectedManuscript?.id === ms.id ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-teal-300'}`}
                  onClick={() => {
                    setSelectedManuscript(ms);
                    setAiReview('');
                    setAdminDecision('');
                    setAdminNotes('');
                  }}
                >
                  <CardContent className="p-3">
                    <p className="font-semibold text-sm line-clamp-2 text-slate-900">{ms.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={statusColors[ms.status]}>{ms.status.replace('_', ' ')}</Badge>
                      {ms.authors?.[0]?.name && <span className="text-xs text-slate-500">{ms.authors[0].name}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Manuscript Detail & AI Review */}
        {selectedManuscript ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{selectedManuscript.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Authors</p>
                  <p className="text-sm text-slate-700">
                    {selectedManuscript.authors?.map(a => a.name).join(', ') || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Abstract</p>
                  <p className="text-sm text-slate-600 line-clamp-3">{selectedManuscript.abstract}</p>
                </div>

                <div>
                  <Button
                    onClick={() => generateAIReview(selectedManuscript)}
                    disabled={isProcessing}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    {isProcessing ? <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Generating...</> : <>🤖 Get AI Review</>}
                  </Button>
                </div>

                {aiReview && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-700 mb-2">AI Reviewer Assessment</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{aiReview}</p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Your Decision</label>
                  <select
                    value={adminDecision}
                    onChange={e => setAdminDecision(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                  >
                    <option value="">Select decision...</option>
                    <option value="accept">✅ Accept & Publish</option>
                    <option value="minor_revision">⚠️ Minor Revisions Needed</option>
                    <option value="major_revision">🔴 Major Revisions Needed</option>
                    <option value="reject">❌ Reject</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Admin Notes (visible to author)</label>
                  <Textarea
                    rows={3}
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    placeholder="Provide constructive feedback to the author..."
                    className="text-sm"
                  />
                </div>

                <Button
                  onClick={handlePublish}
                  disabled={isProcessing || !adminDecision}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                >
                  {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : <>Send Decision to Author</>}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="bg-slate-50 flex items-center justify-center p-8 text-center">
            <p className="text-slate-500">Select a manuscript to review</p>
          </Card>
        )}
      </div>
    </div>
  );
}