import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { readFileAsDataUrl } from "@/utils/pdfUpload";
import {
  CheckSquare, Square, Globe, Upload, Loader2, CheckCircle,
  ChevronDown, X, Edit, Plus, Trash2, FileText, Save,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "submitted",          label: "Submitted",          color: "bg-blue-100 text-blue-800" },
  { value: "under_review",       label: "Under Review",       color: "bg-yellow-100 text-yellow-800" },
  { value: "revision_requested", label: "Revision Requested", color: "bg-orange-100 text-orange-800" },
  { value: "revised",            label: "Revised",            color: "bg-purple-100 text-purple-800" },
  { value: "accepted",           label: "Accepted",           color: "bg-green-100 text-green-800" },
  { value: "rejected",           label: "Rejected",           color: "bg-red-100 text-red-800" },
  { value: "online_first",       label: "Online First",       color: "bg-teal-100 text-teal-800" },
  { value: "published",          label: "Published",          color: "bg-emerald-100 text-emerald-800" },
];

const statusColor = (s) => STATUS_OPTIONS.find(o => o.value === s)?.color || "bg-slate-100 text-slate-700";

// ── Inline Upload & Publish button (no modal needed) ─────────────────────────
function UploadPublishButton({ manuscript, onRefresh }) {
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(manuscript.status === "published");
  const fileRef = useRef(null);

  const handle = async (file) => {
    if (!file) return;
    setUploading(true);
    const dataUrl = await readFileAsDataUrl(file);
    const today = new Date().toISOString().split("T")[0];
    await base44.entities.Manuscript.update(manuscript.id, {
      manuscript_file_url: dataUrl,
      status: "published",
      publication_date: today,
      timeline: [...(manuscript.timeline || []),
        { status: "published", date: today, actor: "Editor", comment: "Directly uploaded and published." }],
    });
    setUploading(false);
    setDone(true);
    onRefresh();
  };

  if (done) return (
    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
      <CheckCircle className="w-3 h-3" /> Published
    </span>
  );

  return (
    <>
      <input ref={fileRef} type="file" accept=".pdf" className="hidden"
        onChange={e => handle(e.target.files[0])} />
      <Button size="sm" variant="outline"
        className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
        disabled={uploading} onClick={() => fileRef.current?.click()}>
        {uploading
          ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Publishing…</>
          : <><Upload className="w-3 h-3 mr-1" />Upload & Publish</>}
      </Button>
    </>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditManuscriptModal({ manuscript, onClose, onSaved }) {
  const [title, setTitle] = useState(manuscript.title || "");
  const [abstract, setAbstract] = useState(manuscript.abstract || "");
  const [authors, setAuthors] = useState(
    manuscript.authors?.length ? manuscript.authors.map(a => ({ ...a })) : [{ name: "", email: "", affiliation: "", orcid: "", is_corresponding: false }]
  );
  const [keywords, setKeywords] = useState(manuscript.keywords || []);
  const [keywordInput, setKeywordInput] = useState("");
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfDone, setPdfDone] = useState(!!manuscript.manuscript_file_url);
  const [saving, setSaving] = useState(false);
  const pdfRef = useRef(null);

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !keywords.includes(kw)) setKeywords(prev => [...prev, kw]);
    setKeywordInput("");
  };
  const removeKeyword = (kw) => setKeywords(prev => prev.filter(k => k !== kw));

  const updateAuthor = (i, field, value) =>
    setAuthors(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a));

  const addAuthor = () =>
    setAuthors(prev => [...prev, { name: "", email: "", affiliation: "", orcid: "", is_corresponding: false }]);

  const removeAuthor = (i) =>
    setAuthors(prev => prev.filter((_, idx) => idx !== i));

  const handlePdf = async (file) => {
    if (!file) return;
    setPdfUploading(true);
    const dataUrl = await readFileAsDataUrl(file);
    await base44.entities.Manuscript.update(manuscript.id, { manuscript_file_url: dataUrl });
    setPdfUploading(false);
    setPdfDone(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Manuscript.update(manuscript.id, {
      title: title.trim(),
      abstract: abstract.trim(),
      authors,
      keywords,
    });
    setSaving(false);
    onSaved();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-blue-600" /> Edit Manuscript
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Title */}
          <div>
            <Label className="text-sm font-semibold text-slate-700">Article Title</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="mt-1 bg-white border-slate-300"
              placeholder="Article title…"
            />
          </div>

          {/* Abstract */}
          <div>
            <Label className="text-sm font-semibold text-slate-700">Abstract</Label>
            <Textarea
              value={abstract}
              onChange={e => setAbstract(e.target.value)}
              rows={4}
              className="mt-1 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
              placeholder="Abstract…"
            />
          </div>

          {/* Authors */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold text-slate-700">Authors</Label>
              <Button size="sm" variant="outline" className="text-xs" onClick={addAuthor}>
                <Plus className="w-3 h-3 mr-1" /> Add Author
              </Button>
            </div>
            <div className="space-y-4">
              {authors.map((author, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Author {i + 1}</span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!author.is_corresponding}
                          onChange={e => updateAuthor(i, "is_corresponding", e.target.checked)}
                          className="rounded"
                        />
                        Corresponding
                      </label>
                      {authors.length > 1 && (
                        <button onClick={() => removeAuthor(i)}
                          className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-slate-600">Full Name *</Label>
                      <Input value={author.name || ""} onChange={e => updateAuthor(i, "name", e.target.value)}
                        className="h-8 text-sm mt-0.5 bg-white border-slate-300" placeholder="Dr. Jane Doe" />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">Email</Label>
                      <Input value={author.email || ""} onChange={e => updateAuthor(i, "email", e.target.value)}
                        className="h-8 text-sm mt-0.5 bg-white border-slate-300" placeholder="jane@university.ac" />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">Affiliation / Institution</Label>
                      <Input value={author.affiliation || ""} onChange={e => updateAuthor(i, "affiliation", e.target.value)}
                        className="h-8 text-sm mt-0.5 bg-white border-slate-300" placeholder="University of Nairobi" />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">Academic Title / Position</Label>
                      <Input value={author.academic_title || ""} onChange={e => updateAuthor(i, "academic_title", e.target.value)}
                        className="h-8 text-sm mt-0.5 bg-white border-slate-300" placeholder="Professor, PhD" />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">ORCID</Label>
                      <Input value={author.orcid || ""} onChange={e => updateAuthor(i, "orcid", e.target.value)}
                        className="h-8 text-sm mt-0.5 bg-white border-slate-300" placeholder="0000-0000-0000-0000" />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">Department</Label>
                      <Input value={author.department || ""} onChange={e => updateAuthor(i, "department", e.target.value)}
                        className="h-8 text-sm mt-0.5 bg-white border-slate-300" placeholder="Dept. of Medicine" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div>
            <Label className="text-sm font-semibold text-slate-700">Keywords</Label>
            <div className="mt-1 flex gap-2">
              <Input
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
                className="bg-white border-slate-300 h-8 text-sm"
                placeholder="Type keyword and press Enter…"
              />
              <Button size="sm" variant="outline" onClick={addKeyword} className="text-xs shrink-0">Add</Button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {keywords.map(kw => (
                  <span key={kw} className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-full px-2.5 py-0.5">
                    {kw}
                    <button onClick={() => removeKeyword(kw)} className="text-blue-400 hover:text-blue-700 leading-none">&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* PDF Upload */}
          <div>
            <Label className="text-sm font-semibold text-slate-700">PDF File</Label>
            <input ref={pdfRef} type="file" accept=".pdf" className="hidden"
              onChange={e => handlePdf(e.target.files[0])} />
            <div className="mt-1 flex items-center gap-3">
              <Button size="sm" variant="outline" className="text-xs text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                disabled={pdfUploading} onClick={() => pdfRef.current?.click()}>
                {pdfUploading
                  ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Reading…</>
                  : <><FileText className="w-3 h-3 mr-1" />{manuscript.manuscript_file_url ? "Replace PDF" : "Upload PDF"}</>}
              </Button>
              {pdfDone && !pdfUploading && (
                <span className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> PDF saved
                </span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2 gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BulkManuscriptActions({ manuscripts, onRefresh }) {
  const [selected, setSelected] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState("published");
  const [applying, setApplying] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [result, setResult] = useState(null);
  const [editingMs, setEditingMs] = useState(null);

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
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
  });

  const applyBulk = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Change ${selected.size} manuscript(s) to "${bulkStatus}"?`)) return;
    setApplying(true);
    const today = new Date().toISOString().split("T")[0];
    await Promise.all([...selected].map(id => {
      const ms = manuscripts.find(m => m.id === id);
      const timeline = [...(ms?.timeline || []),
        { status: bulkStatus, date: today, actor: "Bulk Action", comment: `Bulk status change to ${bulkStatus}.` }];
      return base44.entities.Manuscript.update(id, {
        status: bulkStatus, timeline,
        ...(bulkStatus === "published" ? { publication_date: today } : {}),
      });
    }));
    setResult(`${selected.size} manuscript(s) updated to "${bulkStatus}".`);
    setSelected(new Set());
    setApplying(false);
    onRefresh();
  };

  return (
    <>
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              Manuscript Manager
              <Badge className="bg-slate-100 text-slate-700 text-xs">{manuscripts.length} total</Badge>
            </CardTitle>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Status filter */}
              <div className="relative">
                <select value={filterStatus}
                  onChange={e => { setFilterStatus(e.target.value); setSelected(new Set()); }}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 appearance-none">
                  <option value="all">All statuses</option>
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2 top-2 text-slate-400 pointer-events-none" />
              </div>

              {/* Bulk controls */}
              {selected.size > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-blue-600 text-white">{selected.size} selected</Badge>
                  <div className="relative">
                    <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
                      className="border border-blue-300 rounded-lg px-3 py-1.5 text-sm pr-8 bg-white focus:outline-none appearance-none">
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
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left py-2 px-2 w-8">
                      <button onClick={toggleAll} className="text-slate-400 hover:text-blue-600">
                        {allSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                      </button>
                    </th>
                    <th className="text-left py-2 px-2 font-medium text-slate-600">Title</th>
                    <th className="text-left py-2 px-2 font-medium text-slate-600 hidden lg:table-cell">Authors</th>
                    <th className="text-left py-2 px-2 font-medium text-slate-600">Status</th>
                    <th className="text-left py-2 px-2 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(ms => (
                    <tr key={ms.id}
                      className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${selected.has(ms.id) ? "bg-blue-50" : ""}`}>
                      <td className="py-2 px-2">
                        <button onClick={() => toggle(ms.id)} className="text-slate-400 hover:text-blue-600">
                          {selected.has(ms.id)
                            ? <CheckSquare className="w-4 h-4 text-blue-600" />
                            : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="py-2 px-2 max-w-xs">
                        <p className="font-medium text-slate-800 line-clamp-1">{ms.title}</p>
                      </td>
                      <td className="py-2 px-2 hidden lg:table-cell text-slate-500 text-xs max-w-[200px]">
                        <span className="line-clamp-1">{ms.authors?.map(a => a.name).join(", ") || "—"}</span>
                      </td>
                      <td className="py-2 px-2">
                        <Badge className={`text-xs ${statusColor(ms.status)}`}>
                          {ms.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1 flex-wrap">
                          <Button size="sm" variant="outline"
                            className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                            onClick={() => setEditingMs(ms)}>
                            <Edit className="w-3 h-3 mr-1" />Edit
                          </Button>
                          {ms.status !== "published" && (
                            <UploadPublishButton manuscript={ms} onRefresh={onRefresh} />
                          )}
                          {ms.status === "published" && (
                            <span className="text-xs text-emerald-600 flex items-center gap-1">
                              <Globe className="w-3 h-3" /> Live
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {editingMs && (
        <EditManuscriptModal
          manuscript={editingMs}
          onClose={() => setEditingMs(null)}
          onSaved={() => { setEditingMs(null); onRefresh(); }}
        />
      )}
    </>
  );
}