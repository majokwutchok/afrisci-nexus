import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { assignDOI } from "@/functions/assignDOI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Hash, ExternalLink, Loader2, CheckCircle, AlertTriangle, Pencil, X } from "lucide-react";

const ELIGIBLE_STATUSES = ["accepted", "online_first", "published"];

export default function DOIManagerPanel({ manuscripts, onRefresh }) {
  const [loadingId, setLoadingId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [results, setResults] = useState({}); // { [id]: { doi, error } }

  const eligible = manuscripts.filter(m => ELIGIBLE_STATUSES.includes(m.status));
  const withDOI = eligible.filter(m => m.doi);
  const withoutDOI = eligible.filter(m => !m.doi);

  const handleAutoGenerate = async (manuscript) => {
    setLoadingId(manuscript.id);
    setResults(p => ({ ...p, [manuscript.id]: null }));
    try {
      const res = await assignDOI({ manuscript_id: manuscript.id });
      const doi = res?.data?.doi || res?.doi;
      setResults(p => ({ ...p, [manuscript.id]: { doi, success: true } }));
      onRefresh();
    } catch (e) {
      setResults(p => ({ ...p, [manuscript.id]: { error: e?.message || "Failed" } }));
    }
    setLoadingId(null);
  };

  const handleBulkGenerate = async () => {
    for (const ms of withoutDOI) {
      await handleAutoGenerate(ms);
      await new Promise(r => setTimeout(r, 300));
    }
  };

  const handleSaveManual = async (manuscript) => {
    const doi = editValue.trim();
    if (!doi) return;
    setSavingId(manuscript.id);
    await base44.entities.Manuscript.update(manuscript.id, { doi });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center">
            <Hash className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">DOI Manager</h2>
            <p className="text-sm text-slate-500">
              {withDOI.length} assigned · {withoutDOI.length} pending · {eligible.length} total eligible
            </p>
          </div>
        </div>
        {withoutDOI.length > 0 && (
          <Button
            onClick={handleBulkGenerate}
            disabled={!!loadingId}
            className="bg-blue-700 hover:bg-blue-800 text-white gap-2"
          >
            <Hash className="w-4 h-4" />
            Auto-Generate All Missing DOIs ({withoutDOI.length})
          </Button>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>DOI Prefix: 10.55490</strong> — DOIs are auto-generated in the format{" "}
        <code className="bg-blue-100 px-1 rounded">10.55490/afrisci.YEAR.SHORTID</code> for all accepted, online-first, and published manuscripts.
        The automation also fires automatically when a manuscript is marked as accepted.
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
                      <Input
                        className="h-8 text-xs font-mono"
                        placeholder="e.g. 10.55490/afrisci.2025.abc12345"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        autoFocus
                      />
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
              <Card key={ms.id} className="border-emerald-200 bg-emerald-50/20">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 line-clamp-1">{ms.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {statusBadge(ms.status)}
                        <a href={`https://doi.org/${ms.doi}`} target="_blank" rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline font-mono flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {ms.doi} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={() => { setEditId(ms.id); setEditValue(ms.doi || ""); }}
                      className="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" /> Edit DOI
                    </button>
                  </div>

                  {editId === ms.id && (
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        className="h-7 text-xs font-mono"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        autoFocus
                      />
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