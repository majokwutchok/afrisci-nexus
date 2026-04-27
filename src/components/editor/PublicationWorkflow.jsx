import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { generateGalleyProof } from "@/functions/generateGalleyProof";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { assignDOI } from "@/functions/assignDOI";
import { CheckCircle, FileText, Loader2, Sparkles, ChevronRight, BookOpen, Clock, Hash, ExternalLink, Pencil } from "lucide-react";
import GalleyProofViewer from "./GalleyProofViewer";

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

export default function PublicationWorkflow({ manuscripts, onRefresh }) {
  const [loadingId, setLoadingId] = useState(null);
  const [transitioningId, setTransitioningId] = useState(null);
  const [proofViewer, setProofViewer] = useState(null); // { manuscript, proof }
  const [doiLoadingId, setDoiLoadingId] = useState(null);
  const [doiEditId, setDoiEditId] = useState(null);
  const [doiInputs, setDoiInputs] = useState({});

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

  const handleGenerateDOI = async (manuscript) => {
    setDoiLoadingId(manuscript.id);
    try {
      await assignDOI({ manuscript_id: manuscript.id });
      onRefresh();
    } catch (e) {
      alert('Failed to generate DOI. ' + (e?.message || ''));
    }
    setDoiLoadingId(null);
  };

  const handleSaveManualDOI = async (manuscript) => {
    const doi = (doiInputs[manuscript.id] || '').trim();
    if (!doi) return;
    await base44.entities.Manuscript.update(manuscript.id, { doi });
    setDoiEditId(null);
    onRefresh();
  };

  const handleGenerateProof = async (manuscript) => {
    setLoadingId(manuscript.id);
    const res = await generateGalleyProof({ manuscript_id: manuscript.id });
    setLoadingId(null);
    if (res.data?.proof) {
      setProofViewer({ manuscript, proof: res.data.proof });
      onRefresh();
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
    <>
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

                    {/* Workflow progress steps */}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1 text-xs">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${wf.completed >= 1 ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                        <span className={wf.completed >= 1 ? 'text-emerald-600' : 'text-slate-400'}>
                          {wf.completed}/{Math.max(wf.total, 2)} Reviews
                        </span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                      <div className="flex items-center gap-1 text-xs">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${wf.readyForPublication || isAccepted || isOnlineFirst ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                        <span className={wf.readyForPublication || isAccepted || isOnlineFirst ? 'text-emerald-600' : 'text-slate-400'}>
                          Ready for Publication
                        </span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                      <div className="flex items-center gap-1 text-xs">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isOnlineFirst ? 'bg-teal-500' : 'bg-slate-200'}`}>
                          <FileText className="w-3 h-3 text-white" />
                        </div>
                        <span className={isOnlineFirst ? 'text-teal-600' : 'text-slate-400'}>Galley Proof</span>
                      </div>
                    </div>
                  </div>

                  {/* Status badge + accept button */}
                  <div className="flex flex-col gap-2 flex-shrink-0 items-end">
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
                    {wf.readyForPublication && !isAccepted && !isOnlineFirst && (
                      <Button size="sm" onClick={() => handleAutoTransition(ms)} disabled={transitioningId === ms.id}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                        {transitioningId === ms.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle className="w-3 h-3 mr-1" />Accept</>}
                      </Button>
                    )}
                  </div>
                </div>

                {/* DOI + Galley Proof row */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-3 flex-wrap">
                    {ms.doi ? (
                      <>
                        <span className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                          <Hash className="w-3 h-3" /> DOI Assigned:
                        </span>
                        <a href={`https://doi.org/${ms.doi}`} target="_blank" rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline font-mono flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                          {ms.doi} <ExternalLink className="w-3 h-3" />
                        </a>
                        <button onClick={() => { setDoiEditId(ms.id); setDoiInputs(p => ({ ...p, [ms.id]: ms.doi })); }}
                          className="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1">
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                      </>
                    ) : (isAccepted || isOnlineFirst) ? (
                      <>
                        <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                          <Hash className="w-3 h-3" /> No DOI yet —
                        </span>
                        {doiEditId !== ms.id && (
                          <Button size="sm" onClick={() => handleGenerateDOI(ms)} disabled={doiLoadingId === ms.id}
                            className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                            {doiLoadingId === ms.id
                              ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating...</>
                              : <><Hash className="w-3 h-3 mr-1" /> Auto-Generate DOI</>}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-500"
                          onClick={() => { setDoiEditId(ms.id); setDoiInputs(p => ({ ...p, [ms.id]: '' })); }}>
                          <Pencil className="w-3 h-3 mr-1" /> Enter manually
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Hash className="w-3 h-3" /> DOI will be assigned when accepted
                      </span>
                    )}
                  </div>

                  {doiEditId === ms.id && (
                    <div className="flex items-center gap-2 mt-2">
                      <Input className="h-7 text-xs font-mono" placeholder="e.g. 10.55490/afrisci.2025.abc12345"
                        value={doiInputs[ms.id] || ''}
                        onChange={e => setDoiInputs(p => ({ ...p, [ms.id]: e.target.value }))}
                      />
                      <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => handleSaveManualDOI(ms)}>Save</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDoiEditId(null)}>✕</Button>
                    </div>
                  )}

                  {(isAccepted || isOnlineFirst) && (
                    <div className="mt-2">
                      <Button size="sm" variant="outline" onClick={() => handleGenerateProof(ms)} disabled={loadingId === ms.id}
                        className="text-xs text-teal-700 border-teal-200 hover:bg-teal-50">
                        {loadingId === ms.id
                          ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating Proof...</>
                          : <><FileText className="w-3 h-3 mr-1" /> Generate Galley Proof</>}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Full-screen galley proof viewer — rendered outside card flow */}
      {proofViewer && (
        <GalleyProofViewer
          proof={proofViewer.proof}
          manuscript={proofViewer.manuscript}
          onClose={() => setProofViewer(null)}
        />
      )}
    </>
  );
}