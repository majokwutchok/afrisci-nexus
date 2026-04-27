import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  Globe, EyeOff, Edit, Loader2, ExternalLink, AlertTriangle,
  Download, Eye, CheckCircle
} from "lucide-react";
import { jsPDF } from "jspdf";

export default function PublishedArticleManager({ manuscripts, onRefresh }) {
  const [editingMs, setEditingMs] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [unpublishingId, setUnpublishingId] = useState(null);
  const [confirmUnpublish, setConfirmUnpublish] = useState(null);
  const [previewMs, setPreviewMs] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const publishedMs = manuscripts.filter(m => m.status === "published" || m.status === "online_first");

  const handleEdit = (ms) => {
    setEditingMs(ms);
    setEditForm({
      title: ms.title || "",
      abstract: ms.abstract || "",
      keywords: (ms.keywords || []).join(", "),
      doi: ms.doi || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingMs) return;
    setSaving(true);
    await base44.entities.Manuscript.update(editingMs.id, {
      title: editForm.title,
      abstract: editForm.abstract,
      keywords: editForm.keywords.split(",").map(k => k.trim()).filter(Boolean),
      doi: editForm.doi,
    });
    setSaving(false);
    setEditingMs(null);
    onRefresh();
  };

  const handleUnpublish = async (ms) => {
    setUnpublishingId(ms.id);
    const timeline = [...(ms.timeline || []), {
      status: "accepted",
      date: new Date().toISOString().split("T")[0],
      actor: "Editor",
      comment: "Article removed from online publication by editor."
    }];
    await base44.entities.Manuscript.update(ms.id, {
      status: "accepted",
      publication_date: null,
      online_first_date: null,
      timeline
    });
    setUnpublishingId(null);
    setConfirmUnpublish(null);
    onRefresh();
  };

  const handleDownloadPDF = (ms) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    doc.setFont("times", "bold");
    doc.setFontSize(16);
    const titleLines = doc.splitTextToSize(ms.title || "", contentWidth);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 8 + 4;

    if (ms.authors?.length) {
      doc.setFont("times", "italic");
      doc.setFontSize(11);
      const authLine = ms.authors.map(a => `${a.name}${a.affiliation ? ` (${a.affiliation})` : ""}`).join(", ");
      const authLines = doc.splitTextToSize(authLine, contentWidth);
      doc.text(authLines, margin, y);
      y += authLines.length * 6 + 4;
    }

    if (ms.doi) {
      doc.setFont("times", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 180);
      doc.text(`DOI: https://doi.org/${ms.doi}`, margin, y);
      doc.setTextColor(0, 0, 0);
      y += 7;
    }

    if (ms.publication_date) {
      doc.setFontSize(10);
      doc.text(`Published: ${new Date(ms.publication_date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`, margin, y);
      y += 7;
    }

    doc.setDrawColor(100);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("Abstract", margin, y);
    y += 6;

    doc.setFont("times", "normal");
    doc.setFontSize(11);
    const absLines = doc.splitTextToSize(ms.abstract || "", contentWidth);
    absLines.forEach(line => {
      if (y > 270) { doc.addPage(); y = margin; }
      doc.text(line, margin, y);
      y += 6;
    });
    y += 4;

    if (ms.keywords?.length) {
      doc.setFont("times", "bold");
      doc.text("Keywords: ", margin, y);
      doc.setFont("times", "italic");
      doc.text(ms.keywords.join(", "), margin + 22, y);
      y += 8;
    }

    if (ms.formatted_body) {
      doc.setDrawColor(100);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
      const div = document.createElement("div");
      div.innerHTML = ms.formatted_body;
      const bodyText = div.innerText || div.textContent || "";
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      const bodyLines = doc.splitTextToSize(bodyText, contentWidth);
      bodyLines.forEach(line => {
        if (y > 275) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += 6;
      });
    }

    const filename = (ms.title || "article").replace(/[^a-z0-9]/gi, "_").substring(0, 50);
    doc.save(`${filename}.pdf`);
  };

  const handlePreviewPDF = (ms) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (ms.manuscript_file_url) {
      setPreviewUrl(ms.manuscript_file_url);
      setPreviewMs(ms);
      return;
    }
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;
    let y = margin;
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    const titleLines = doc.splitTextToSize(ms.title || "", contentWidth);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 8 + 8;
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    const absLines = doc.splitTextToSize(ms.abstract || "", contentWidth);
    absLines.forEach(line => { doc.text(line, margin, y); y += 6; });
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setPreviewMs(ms);
  };

  if (publishedMs.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Globe className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p>No published articles to manage.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-slate-800">Published Article Manager</h3>
          <Badge className="bg-blue-100 text-blue-700">{publishedMs.length} online</Badge>
        </div>

        {publishedMs.map(ms => (
          <Card key={ms.id} className="border border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge className={ms.status === "published" ? "bg-blue-100 text-blue-700 text-xs" : "bg-teal-100 text-teal-700 text-xs"}>
                      {ms.status === "published" ? <><Globe className="w-3 h-3 inline mr-1" />Published</> : "Online First"}
                    </Badge>
                    {ms.doi && (
                      <a href={`https://doi.org/${ms.doi}`} target="_blank" rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline font-mono flex items-center gap-1">
                        {ms.doi} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {ms.publication_date && (
                      <span className="text-xs text-slate-400">
                        {new Date(ms.publication_date).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-sm text-slate-800 line-clamp-2">{ms.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{ms.authors?.map(a => a.name).join(", ")}</p>
                  {ms.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ms.keywords.slice(0, 4).map(k => (
                        <span key={k} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{k}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => handlePreviewPDF(ms)}>
                    <Eye className="w-3.5 h-3.5 mr-1" /> Preview PDF
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => handleDownloadPDF(ms)}>
                    <Download className="w-3.5 h-3.5 mr-1" /> Download PDF
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs text-indigo-600 border-indigo-200" onClick={() => handleEdit(ms)}>
                    <Edit className="w-3.5 h-3.5 mr-1" /> Edit Article
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs text-red-600 border-red-200"
                    onClick={() => setConfirmUnpublish(ms)}
                    disabled={unpublishingId === ms.id}>
                    {unpublishingId === ms.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><EyeOff className="w-3.5 h-3.5 mr-1" />Remove Online</>}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingMs} onOpenChange={() => setEditingMs(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Edit className="w-5 h-5" /> Edit Published Article</DialogTitle>
            <DialogDescription>Changes will be saved immediately to the database.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Title</Label>
              <Input className="mt-1" value={editForm.title || ""} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <Label>Abstract</Label>
              <Textarea className="mt-1" rows={6} value={editForm.abstract || ""} onChange={e => setEditForm(p => ({ ...p, abstract: e.target.value }))} />
            </div>
            <div>
              <Label>Keywords (comma-separated)</Label>
              <Input className="mt-1" value={editForm.keywords || ""} onChange={e => setEditForm(p => ({ ...p, keywords: e.target.value }))} />
            </div>
            <div>
              <Label>DOI</Label>
              <Input className="mt-1 font-mono text-sm" value={editForm.doi || ""} onChange={e => setEditForm(p => ({ ...p, doi: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingMs(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-1" />Save Changes</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog open={!!previewMs} onOpenChange={() => { setPreviewMs(null); if (previewUrl && !previewUrl.startsWith("http")) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Eye className="w-5 h-5" /> {previewMs?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0" style={{ height: "70vh" }}>
            {previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-full rounded border"
                title="PDF Preview"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setPreviewMs(null); setPreviewUrl(null); }}>Close</Button>
            <Button onClick={() => handleDownloadPDF(previewMs)}><Download className="w-4 h-4 mr-1" />Download</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmUnpublish} onOpenChange={() => setConfirmUnpublish(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="w-5 h-5" /> Remove from Publication</DialogTitle>
            <DialogDescription>
              This will change the article status back to "Accepted" and remove it from public view. The manuscript data is preserved.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-slate-700 font-medium line-clamp-2">{confirmUnpublish?.title}</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmUnpublish(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleUnpublish(confirmUnpublish)} disabled={!!unpublishingId}>
              {unpublishingId ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
              Remove from Online
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}