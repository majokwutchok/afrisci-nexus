import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { readFileAsDataUrl } from "@/utils/pdfUpload";
import {
  CheckSquare,
  Square,
  Globe,
  Upload,
  Loader2,
  CheckCircle,
  ChevronDown,
  X,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "submitted", label: "Submitted", color: "bg-blue-100 text-blue-800" },
  { value: "under_review", label: "Under Review", color: "bg-yellow-100 text-yellow-800" },
  { value: "revision_requested", label: "Revision Requested", color: "bg-orange-100 text-orange-800" },
  { value: "revised", label: "Revised", color: "bg-purple-100 text-purple-800" },
  { value: "accepted", label: "Accepted", color: "bg-green-100 text-green-800" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
  { value: "online_first", label: "Online First", color: "bg-teal-100 text-teal-800" },
  { value: "published", label: "Published", color: "bg-emerald-100 text-emerald-800" },
];

function UploadPublishButton({ manuscript, onRefresh }) {
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef(null);

  const handle = async (file) => {
    if (!file) return;
    setUploading(true);
    const dataUrl = await readFileAsDataUrl(file);
    const today = new Date().toISOString().split("T")[0];
    const timeline = [
      ...(manuscript.timeline || []),
      { status: "published", date: today, actor: "Editor", comment: "Directly uploaded and published." },
    ];
    await base44.entities.Manuscript.update(manuscript.id, {
      manuscript_file_url: dataUrl,
      status: "published",
      publication_date: today,
      timeline,
    });
    setUploading(false);
    setDone(true);
    onRefresh();
  };

  if (done) return <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Published</span>;

  return (
    <>
      <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => handle(e.target.files[0])} />
      <Button
        size="sm"
        variant="outline"
        className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
      >
        {uploading
          ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Publishing…</>
          : <><Upload className="w-3 h-3 mr-1" />Upload & Publish</>}
      </Button>
    </>
  );
}

export default function BulkManuscriptActions({ manuscripts, onRefresh }) {
  const [selected, setSelected] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState("published");
  const [applying, setApplying] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [result, setResult] = useState(null);

  const filtered = filterStatus === "all"
    ? manuscripts
    : manuscripts.filter(m => m.status === filterStatus);

  const allSelected = filtered.length > 0 && filtered.every(m => selected.has(m.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => { const s = new Set(prev); filtered.forEach(m => s.delete(m.id)); return s; });
    } else {
      setSelected(prev => { const s = new Set(prev); filtered.forEach(m => s.add(m.id)); return s; });
    }
  };

  const toggle = (id) => setSelected(prev => {
    const s = new Set(prev);
    s.has(id) ? s.delete(id) : s.add(id);
    return s;
  });

  const applyBulk = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Change ${selected.size} manuscript(s) to "${bulkStatus}"?`)) return;
    setApplying(true);
    const today = new Date().toISOString().split("T")[0];
    const ids = [...selected];
    await Promise.all(ids.map(id => {
      const ms = manuscripts.find(m => m.id === id);
      const timeline = [...(ms?.timeline || []), {
        status: bulkStatus, date: today, actor: "Bulk Action",
        comment: `Bulk status change to ${bulkStatus}.`
      }];
      const extra = bulkStatus === "published" ? { publication_date: today } : {};
      return base44.entities.Manuscript.update(id, { status: bulkStatus, timeline, ...extra });
    }));
    setResult(`${ids.length} manuscript(s) updated to "${bulkStatus}".`);
    setSelected(new Set());
    setApplying(false);
    onRefresh();
  };

  const statusColor = (s) => STATUS_OPTIONS.find(o => o.value === s)?.color || "bg-slate-100 text-slate-700";

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            Bulk Manuscript Actions
            <Badge className="bg-slate-100 text-slate-700 text-xs">{manuscripts.length} total</Badge>
          </CardTitle>

          {/* Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <select
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setSelected(new Set()); }}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 appearance-none"
              >
                <option value="all">All statuses</option>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-2 text-slate-400 pointer-events-none" />
            </div>

            {/* Bulk change controls */}
            {selected.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600 text-white">{selected.size} selected</Badge>
                <div className="relative">
                  <select
                    value={bulkStatus}
                    onChange={e => setBulkStatus(e.target.value)}
                    className="border border-blue-300 rounded-lg px-3 py-1.5 text-sm pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 appearance-none"
                  >
                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2 top-2 text-slate-400 pointer-events-none" />
                </div>
                <Button size="sm" onClick={applyBulk} disabled={applying}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                  {applying ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Applying…</> : <><Globe className="w-3 h-3 mr-1" />Apply to {selected.size}</>}
                </Button>
                <Button size="sm" variant="ghost" className="text-xs text-slate-500" onClick={() => setSelected(new Set())}>
                  <X className="w-3 h-3 mr-1" />Clear
                </Button>
              </div>
            )}
          </div>
        </div>

        {result && (
          <div className="mt-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" /> {result}
            <button onClick={() => setResult(null)} className="ml-auto text-xs text-slate-400 hover:text-slate-600">✕</button>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No manuscripts match the selected filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-2 w-8">
                    <button onClick={toggleAll} className="text-slate-400 hover:text-blue-600">
                      {allSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-slate-600">Title</th>
                  <th className="text-left py-2 px-2 font-medium text-slate-600 hidden md:table-cell">Authors</th>
                  <th className="text-left py-2 px-2 font-medium text-slate-600">Status</th>
                  <th className="text-left py-2 px-2 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ms => (
                  <tr
                    key={ms.id}
                    className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${selected.has(ms.id) ? "bg-blue-50" : ""}`}
                  >
                    <td className="py-2 px-2">
                      <button onClick={() => toggle(ms.id)} className="text-slate-400 hover:text-blue-600">
                        {selected.has(ms.id)
                          ? <CheckSquare className="w-4 h-4 text-blue-600" />
                          : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="py-2 px-2">
                      <p className="font-medium text-slate-800 line-clamp-1 max-w-xs">{ms.title}</p>
                    </td>
                    <td className="py-2 px-2 hidden md:table-cell text-slate-500 text-xs">
                      {ms.authors?.map(a => a.name).join(", ") || "—"}
                    </td>
                    <td className="py-2 px-2">
                      <Badge className={`text-xs ${statusColor(ms.status)}`}>
                        {ms.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-2 px-2">
                      {ms.status !== "published" && (
                        <UploadPublishButton manuscript={ms} onRefresh={onRefresh} />
                      )}
                      {ms.status === "published" && (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Live
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}