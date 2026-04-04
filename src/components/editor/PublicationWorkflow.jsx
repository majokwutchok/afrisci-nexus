import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { generateGalleyProof } from "@/functions/generateGalleyProof";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle, FileText, Loader2, Sparkles, ChevronRight, AlertTriangle, BookOpen, Clock, Download } from "lucide-react";

const REVIEW_ACCEPT_STATUSES = ["accept", "minor_revision"];

function getWorkflowStatus(manuscript) {
  const reviews = manuscript.review_history || [];
  const completed = reviews.filter(r => r.status === "completed");
  const accepted = completed.filter(r => REVIEW_ACCEPT_STATUSES.includes(r.recommendation));
  const total = reviews.length;
  const hasEnoughReviews = completed.length >= 2;
  const majorityAccepted = accepted.length > 0 && accepted.length >= completed.length * 0.5;
  const readyForPublication = hasEnoughReviews && majorityAccepted &&
    ["under_review", "revised", "editor_assigned"].includes(manuscript.status);

  return { completed: completed.length, accepted: accepted.length, total, readyForPublication };
}

function GalleyProofView({ proof, manuscriptTitle, onClose }) {
  const handlePrint = () => window.print();

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      {/* Header block */}
      <div className="border-2 border-slate-200 rounded-xl p-6 bg-slate-50">
        <div className="text-center space-y-3">
          <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold">AfriSci Nexus — Galley Proof</p>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">{proof.formatted_title || manuscriptTitle}</h2>
          {proof.running_head && (
            <p className="text-xs text-slate-400 italic">Running head: {proof.running_head}</p>
          )}

          {/* Authors */}
          {proof.formatted_authors && proof.formatted_authors.length > 0 && (
            <div className="text-sm text-slate-700">
              {proof.formatted_authors.map((a, i) => (
                <span key={i}>
                  {a.name}<sup>{a.affiliation_number}{a.is_corresponding ? "*" : ""}</sup>
                  {i < proof.formatted_authors.length - 1 ? ", " : ""}
                </span>
              ))}
            </div>
          )}

          {/* Affiliations */}
          {proof.affiliations && proof.affiliations.length > 0 && (
            <div className="text-xs text-slate-500 space-y-0.5">
              {proof.affiliations.map(a => (
                <p key={a.number}><sup>{a.number}</sup> {a.text}</p>
              ))}
              <p className="italic">* Corresponding Author</p>
            </div>
          )}
        </div>
      </div>

      {/* Metadata strip */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {proof.doi_display && (
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="font-semibold text-blue-700 mb-1">DOI</p>
            <p className="text-blue-600">{proof.doi_display}</p>
          </div>
        )}
        {proof.received_date && (
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="font-semibold text-slate-600 mb-1">Received</p>
            <p>{proof.received_date}</p>
          </div>
        )}
        {proof.accepted_date && (
          <div className="bg-emerald-50 rounded-lg p-3">
            <p className="font-semibold text-emerald-700 mb-1">Accepted</p>
            <p>{proof.accepted_date}</p>
          </div>
        )}
        {proof.citation_suggestion && (
          <div className="bg-amber-50 rounded-lg p-3 col-span-2">
            <p className="font-semibold text-amber-700 mb-1">Cite as</p>
            <p className="italic text-amber-800">{proof.citation_suggestion}</p>
          </div>
        )}
      </div>

      {/* Abstract */}
      {proof.formatted_abstract && (
        <div className="border-l-4 border-teal-400 pl-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Abstract</p>
          <p className="text-sm text-slate-700 leading-relaxed">{proof.formatted_abstract}</p>
        </div>
      )}

      {/* Keywords */}
      {proof.structured_keywords && proof.structured_keywords.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Keywords</p>
          <div className="flex flex-wrap gap-2">
            {proof.structured_keywords.map(k => (
              <Badge key={k} variant="outline" className="text-xs">{k}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Publication note */}
      {proof.publication_note && (
        <div className="bg-teal-50 rounded-lg p-4 border border-teal-100">
          <p className="text-xs font-semibold text-teal-700 mb-1">Editorial Note</p>
          <p className="text-sm text-teal-800">{proof.publication_note}</p>
        </div>
      )}

      {/* Typesetting notes */}
      {proof.formatting_notes && proof.formatting_notes.length > 0 && (
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
          <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Typesetting Notes
          </p>
          <ul className="space-y-1">
            {proof.formatting_notes.map((n, i) => (
              <li key={i} className="text-xs text-amber-800 flex gap-2"><span>•</span><span>{n}</span></li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t">
        <Button size="sm" onClick={handlePrint} className="bg-teal-600 hover:bg-teal-700 text-white">
          <Download className="w-4 h-4 mr-2" /> Print / Save PDF
        </Button>
        <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

export default function PublicationWorkflow({ manuscripts, onRefresh }) {
  const [loadingId, setLoadingId] = useState(null);
  const [transitioningId, setTransitioningId] = useState(null);
  const [proofDialog, setProofDialog] = useState(null); // { manuscript, proof }

  // Filter to manuscripts that are review-complete or ready
  const workflowManuscripts = manuscripts.filter(m =>
    ["under_review", "revised", "editor_assigned", "online_first", "accepted"].includes(m.status)
  );

  const handleAutoTransition = async (manuscript) => {
    setTransitioningId(manuscript.id);
    const today = new Date().toISOString().split('T')[0];
    const timeline = [...(manuscript.timeline || []), {
      status: 'accepted',
      date: today,
      actor: 'Workflow Engine',
      comment: 'Auto-transitioned: All peer reviews accepted. Ready for publication.'
    }];
    await base44.entities.Manuscript.update(manuscript.id, { status: 'accepted', timeline });
    onRefresh();
    setTransitioningId(null);
  };

  const handleGenerateProof = async (manuscript) => {
    setLoadingId(manuscript.id);
    const res = await generateGalleyProof({ manuscript_id: manuscript.id });
    setLoadingId(null);
    if (res.data?.proof) {
      setProofDialog({ manuscript, proof: res.data.proof });
    }
  };

  if (workflowManuscripts.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p>No manuscripts are currently in the publication workflow.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <h3 className="font-semibold text-slate-800">Publication Workflow Engine</h3>
        <Badge className="bg-purple-100 text-purple-700">{workflowManuscripts.length} manuscripts</Badge>
      </div>

      {workflowManuscripts.map(ms => {
        const wf = getWorkflowStatus(ms);
        const isOnlineFirst = ms.status === "online_first";
        const isAccepted = ms.status === "accepted";

        return (
          <Card key={ms.id} className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-800 line-clamp-1">{ms.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {ms.authors?.map(a => a.name).join(", ")}
                  </p>

                  {/* Workflow progress */}
                  <div className="flex items-center gap-4 mt-3">
                    {/* Step 1 */}
                    <div className="flex items-center gap-1 text-xs">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${wf.completed >= 1 ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                      <span className={wf.completed >= 1 ? 'text-emerald-600' : 'text-slate-400'}>
                        {wf.completed}/{Math.max(wf.total, 2)} Reviews
                      </span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    {/* Step 2 */}
                    <div className="flex items-center gap-1 text-xs">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${wf.readyForPublication || isAccepted || isOnlineFirst ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                      <span className={wf.readyForPublication || isAccepted || isOnlineFirst ? 'text-emerald-600' : 'text-slate-400'}>
                        Ready for Publication
                      </span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    {/* Step 3 */}
                    <div className="flex items-center gap-1 text-xs">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isOnlineFirst ? 'bg-teal-500' : 'bg-slate-200'}`}>
                        <FileText className="w-3 h-3 text-white" />
                      </div>
                      <span className={isOnlineFirst ? 'text-teal-600' : 'text-slate-400'}>Galley Proof</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {wf.readyForPublication && !isAccepted && !isOnlineFirst && (
                    <Button
                      size="sm"
                      onClick={() => handleAutoTransition(ms)}
                      disabled={transitioningId === ms.id}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    >
                      {transitioningId === ms.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <><CheckCircle className="w-3 h-3 mr-1" /> Accept & Publish</>}
                    </Button>
                  )}

                  {(isAccepted || isOnlineFirst) && (
                    <Button
                      size="sm"
                      onClick={() => handleGenerateProof(ms)}
                      disabled={loadingId === ms.id}
                      className="bg-teal-600 hover:bg-teal-700 text-white text-xs"
                    >
                      {loadingId === ms.id
                        ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating...</>
                        : <><Sparkles className="w-3 h-3 mr-1" /> Generate Galley Proof</>}
                    </Button>
                  )}

                  <Badge className={
                    isOnlineFirst ? "bg-teal-100 text-teal-700 text-xs" :
                    isAccepted ? "bg-emerald-100 text-emerald-700 text-xs" :
                    wf.readyForPublication ? "bg-amber-100 text-amber-700 text-xs" :
                    "bg-slate-100 text-slate-500 text-xs"
                  }>
                    {isOnlineFirst ? "Online First" :
                     isAccepted ? "Accepted" :
                     wf.readyForPublication ? "Ready to Accept" :
                     <><Clock className="w-3 h-3 inline mr-1" />In Review</>}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Galley Proof Dialog */}
      <Dialog open={!!proofDialog} onOpenChange={() => setProofDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" /> Galley Proof
            </DialogTitle>
            <DialogDescription>
              Publication-ready proof for: {proofDialog?.manuscript?.title}
            </DialogDescription>
          </DialogHeader>
          {proofDialog && (
            <GalleyProofView
              proof={proofDialog.proof}
              manuscriptTitle={proofDialog.manuscript.title}
              onClose={() => setProofDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}