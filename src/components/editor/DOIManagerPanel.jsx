import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { assignDOI } from "@/functions/assignDOI";
import { registerCrossrefDOI } from "@/functions/registerCrossrefDOI";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Hash, ExternalLink, Loader2, CheckCircle, AlertTriangle,
  Pencil, X, RefreshCw, Globe
} from "lucide-react";

const ELIGIBLE_STATUSES = ["accepted", "online_first", "published"];

const CROSSREF_STATUS_CONFIG = {
  submitted: { label: "Crossref: Submitted", color: "bg-teal-100 text-teal-700 border-teal-200" },
  registered: { label: "Crossref: Registered", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  pending: { label: "Crossref: Pending", color: "bg-amber-100 text-amber-700 border-amber-200" },
  failed: { label: "Crossref: Failed", color: "bg-red-100 text-red-700 border-red-200" },
};

export default function DOIManagerPanel({ manuscripts, onRefresh }) {
  const [loadingId, setLoadingId] = useState(null);
  const [crossrefLoadingId, setCrossrefLoadingId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [results, setResults] = useState({});

  const eligible = manuscripts.filter(m => ELIGIBLE_STATUSES.includes(m.status));
  const withDOI = eligible.filter(m => m.doi);
  const withoutDOI = eligible.filter(m => !m.doi);
  const needsCrossref = withDOI.filter(m => !m.crossref_status || m.crossref_status === 'pending' || m.crossref_status === 'failed');

  const handleAutoGenerate = async (manuscript) => {
    setLoadingId(manuscript.id);
    setResults(p => ({ ...p, [manuscript.id]: null }));
    try {
      const res = await assignDOI({ manuscript_id: manuscript.id });
      const doi = res?.data?.doi || res?.doi;
      setResults(p => ({ ...p, [manuscript.id]: { doi, success: true, crossref: res?.data?.crossref_registered } }));
      onRefresh();
    } catch (e) {
      setResults(p => ({ ...p, [manuscript.id]: { error: e?.message || "Failed" } }));
    }
    setLoadingId(null);
  };

  const handleBulkGenerate = async () => {
    for (const ms of withoutDOI) {
      await handleAutoGenerate(ms);
      await new Promise(r => setTimeout(r, 500));
    }
  };

  const handleCrossrefRegister = async (manuscript) => {
    setCrossrefLoadingId(manuscript.id);
    try {
      const res = await registerCrossrefDOI({ manuscript_id: manuscript.id });
      setResults(p => ({ ...p, [manuscript.id]: { crossref: res?.data?.success, crossrefBatch: res?.data?.batch_id } }));
      onRefresh();
    } catch (e) {
      setResults(p => ({ ...p, [manuscript.id]: { error: e?.message || "Crossref registration failed" } }));
    }
    setCrossrefLoadingId(null);
  };

  const handleBulkCrossref = async () => {
    for (const ms of needsCrossref) {
      await handleCrossrefRegister(ms);
      await new Promise(r => setTimeout(r, 500));
    }
  };

  const handleSaveManual = async (manuscript) => {
    const doi = editValue.trim();
    if (!doi) return;
    setSavingId(manuscript.id);
    await base44.entities.Manuscript.update(manuscript.id, { doi, crossref_status: 'pending' });
    setSavingId(null);
    setEditId(null);
    setEditValue("");
    onRefresh();
  };

  const statusBadge = (status) => {
    const map = {
      accepted: "bg-emerald-100 text-emerald-700",
      online_first: "bg-teal-100 text-teal-700",
      published: "bg-blue-100 text-blue-700",
    };
    return <Badge className={`text-xs ${map[status] || "bg-slate-100 text-slate-500"}`}>{status.replace("_", " ")}</Badge>;
  };

  const crossrefBadge = (ms) => {
    const cfg = CROSSREF_STATUS_CONFIG[ms.crossref_status];
    if (!cfg) return <Badge className="text-xs bg-slate-100 text-slate-400 border border-slate-200">Crossref: Not Submitted</Badge>;
    return <Badge className={`text-xs border ${cfg.color}`}>{cfg.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center">
            <Hash className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">DOI & Crossref Manager</h2>
            <p className="text-sm text-slate-500">
              {withDOI.length} assigned · {withoutDOI.length} pending · {needsCrossref.length} awaiting Crossref
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {withoutDOI.length > 0 && (
            <Button onClick={handleBulkGenerate} disabled={!!loadingId || !!crossrefLoadingId}
              className="bg-blue-700 hover:bg-blue-800 text-white gap-2 text-sm">
              <Hash className="w-4 h-4" />
              Auto-Generate All ({withoutDOI.length})
            </Button>
          )}
          {needsCrossref.length > 0 && (
            <Button onClick={handleBulkCrossref} disabled={!!loadingId || !!crossrefLoadingId}
              className="bg-teal-600 hover:bg-teal-700 text-white gap-2 text-sm">
              <Globe className="w-4 h-4" />
              Register All with Crossref ({needsCrossref.length})
            </Button>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>Crossref DOI Integration Active</strong> — DOI prefix <code className="bg-blue-100 px-1 rounded">10.67418</code>.
        Metadata is submitted to Crossref automatically when a manuscript is published.
        Format: <code className="bg-blue-100 px-1 rounded">10.67418/afrisci.YEAR.SHORTID</code>.
      </div>

      {eligible.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Hash className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p>No accepted or published manuscripts found.</p>
        </div>
      )}

      {/* Pending DOIs */}
      {withoutDOI.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Awaiting DOI ({withoutDOI.length})
          </h3>
          <div className="space-y-3">
            {withoutDOI.map(ms => (
              <Card key={ms.id} className="border-amber-200 bg-amber-50/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 line-clamp-1">{ms.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{ms.authors?.map(a => a.name).join(", ")}</p>
                      <div className="mt-1">{statusBadge(ms.status)}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {results[ms.id]?.error && (
                        <span className="text-xs text-red-600">{results[ms.id].error}</span>
                      )}
                      {editId !== ms.id && (
                        <>
                          <Button size="sm" onClick={() => handleAutoGenerate(ms)} disabled={!!loadingId}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8">
                            {loadingId === ms.id
                              ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating...</>
                              : <><Hash className="w-3 h-3 mr-1" /> Auto-Generate</>}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setEditId(ms.id); setEditValue(""); }}
                            className="text-xs h-8">
                            <Pencil className="w-3 h-3 mr-1" /> Manual
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {editId === ms.id && (
                    <div className="flex items-center gap-2 mt-3">
                      <Input className="h-8 text-xs font-mono" placeholder="e.g. 10.67418/afrisci.2025.abc12345"
                        value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus />
                      <Button size="sm" onClick={() => handleSaveManual(ms)} disabled={savingId === ms.id}
                        className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                        {savingId === ms.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditId(null)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Assigned DOIs */}
      {withDOI.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            DOI Assigned ({withDOI.length})
          </h3>
          <div className="space-y-2">
            {withDOI.map(ms => (
              <Card key={ms.id} className={`border-emerald-200 ${ms.crossref_status === 'failed' ? 'bg-red-50/20 border-red-200' : 'bg-emerald-50/20'}`}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 line-clamp-1">{ms.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {statusBadge(ms.status)}
                        {crossrefBadge(ms)}
                        <a href={`https://doi.org/${ms.doi}`} target="_blank" rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline font-mono flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          https://doi.org/{ms.doi} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      {ms.crossref_submitted_at && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Submitted to Crossref: {new Date(ms.crossref_submitted_at).toLocaleDateString()}
                          {ms.crossref_submission_id && <span className="ml-2 font-mono">({ms.crossref_submission_id})</span>}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Re-register with Crossref if needed */}
                      {(!ms.crossref_status || ms.crossref_status === 'pending' || ms.crossref_status === 'failed') && (
                        <Button size="sm" onClick={() => handleCrossrefRegister(ms)}
                          disabled={crossrefLoadingId === ms.id}
                          className="h-7 text-xs bg-teal-600 hover:bg-teal-700 text-white gap-1">
                          {crossrefLoadingId === ms.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <><Globe className="w-3 h-3" /> Register Crossref</>}
                        </Button>
                      )}
                      {ms.crossref_status === 'submitted' && (
                        <Button size="sm" variant="outline" onClick={() => handleCrossrefRegister(ms)}
                          disabled={crossrefLoadingId === ms.id}
                          className="h-7 text-xs gap-1">
                          {crossrefLoadingId === ms.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <><RefreshCw className="w-3 h-3" /> Re-submit</>}
                        </Button>
                      )}
                      <button onClick={() => { setEditId(ms.id); setEditValue(ms.doi || ""); }}
                        className="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1 px-2">
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                    </div>
                  </div>

                  {editId === ms.id && (
                    <div className="flex items-center gap-2 mt-2">
                      <Input className="h-7 text-xs font-mono" value={editValue}
                        onChange={e => setEditValue(e.target.value)} autoFocus />
                      <Button size="sm" onClick={() => handleSaveManual(ms)} disabled={savingId === ms.id}
                        className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                        {savingId === ms.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditId(null)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}