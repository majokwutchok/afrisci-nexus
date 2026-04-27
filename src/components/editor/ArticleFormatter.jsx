import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Heading1, Heading2, Heading3, FileText, Save, Eye,
  Download, Printer, Strikethrough, Quote, Undo, Redo, Loader2, CheckCircle, X
} from "lucide-react";
import { jsPDF } from "jspdf";
import { stampAfriSciNexus } from "@/utils/pdfStamp";

const FONT_SIZES = ["10", "11", "12", "14", "16", "18", "20", "24", "28", "32"];
const FONTS = ["Times New Roman", "Arial", "Helvetica", "Georgia", "Garamond"];

function ToolbarButton({ onClick, title, active, children }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${active ? "bg-slate-300" : ""}`}
    >
      {children}
    </button>
  );
}

function ToolbarSeparator() {
  return <div className="w-px h-5 bg-slate-300 mx-1" />;
}

export default function ArticleFormatter({ manuscripts, journals = [], onRefresh }) {
  const [selectedMs, setSelectedMs] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const editorRef = useRef(null);

  const publishedMs = manuscripts.filter(m =>
    ["accepted", "online_first", "published"].includes(m.status)
  );

  const execCmd = (cmd, value = null) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  const handleSave = async () => {
    if (!selectedMs || !editorRef.current) return;
    setSaving(true);
    const htmlContent = editorRef.current.innerHTML;
    await base44.entities.Manuscript.update(selectedMs.id, {
      formatted_body: htmlContent
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onRefresh();
  };

  const handleExportPDF = () => {
    if (!editorRef.current || !selectedMs) return;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;
    let y = 22; // start below header stamp

    doc.setFont("times", "bold");
    doc.setFontSize(16);
    const titleLines = doc.splitTextToSize(selectedMs.title || "", contentWidth);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 8 + 4;

    if (selectedMs.authors?.length) {
      doc.setFont("times", "italic");
      doc.setFontSize(11);
      const authLine = selectedMs.authors.map(a => a.name).join(", ");
      doc.text(doc.splitTextToSize(authLine, contentWidth), margin, y);
      y += 8;
    }

    if (selectedMs.doi) {
      doc.setFont("times", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 200);
      doc.text(`DOI: https://doi.org/${selectedMs.doi}`, margin, y);
      doc.setTextColor(0, 0, 0);
      y += 7;
    }

    doc.setDrawColor(150);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("Abstract", margin, y);
    y += 6;
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    const abstractLines = doc.splitTextToSize(selectedMs.abstract || "", contentWidth);
    abstractLines.forEach(line => {
      if (y > 270) { doc.addPage(); y = margin; }
      doc.text(line, margin, y);
      y += 6;
    });
    y += 4;

    if (selectedMs.keywords?.length) {
      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.text("Keywords: ", margin, y);
      doc.setFont("times", "italic");
      doc.text(selectedMs.keywords.join(", "), margin + 22, y);
      y += 8;
    }

    doc.setFont("times", "normal");
    doc.setFontSize(11);
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = editorRef.current.innerHTML;
    const text = tempDiv.innerText || tempDiv.textContent || "";
    if (text.trim()) {
      doc.setDrawColor(150);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
      const bodyLines = doc.splitTextToSize(text, contentWidth);
      bodyLines.forEach(line => {
        if (y > 275) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += 6;
      });
    }

    // Stamp every page with AfriSci Nexus branding
    const journal = journals.find(j => j.id === selectedMs.journal_id);
    stampAfriSciNexus(doc, journal?.title || "AfriSci Nexus Discovery");
    const filename = (selectedMs.title || "article").replace(/[^a-z0-9]/gi, "_").substring(0, 50);
    doc.save(`${filename}.pdf`);
  };

  const handlePrint = () => {
    const content = editorRef.current?.innerHTML || "";
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head>
      <title>${selectedMs?.title || "Article"}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; margin: 2.5cm; line-height: 1.6; color: #000; }
        h1 { font-size: 16pt; } h2 { font-size: 14pt; } h3 { font-size: 12pt; }
        @page { margin: 2.5cm; }
      </style></head><body>${content}</body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-5 h-5 text-indigo-500" />
        <h3 className="font-semibold text-slate-800">Article Formatter</h3>
        <Badge className="bg-indigo-100 text-indigo-700">Word-style Editor</Badge>
      </div>

      <Card className="border border-slate-200">
        <CardContent className="p-4">
          <Label className="mb-2 block text-sm font-medium">Select Manuscript to Format</Label>
          <Select
            value={selectedMs?.id || ""}
            onValueChange={(id) => {
              const ms = publishedMs.find(m => m.id === id);
              setSelectedMs(ms || null);
              setTimeout(() => {
                if (editorRef.current && ms) {
                  editorRef.current.innerHTML = ms.formatted_body ||
                    `<h2>${ms.title || ""}</h2><p><em>${ms.authors?.map(a => a.name).join(", ") || ""}</em></p><hr/><h3>Abstract</h3><p>${ms.abstract || ""}</p><h3>Introduction</h3><p>Begin writing the article body here...</p>`;
                }
              }, 50);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose an accepted/published manuscript..." />
            </SelectTrigger>
            <SelectContent>
              {publishedMs.map(ms => (
                <SelectItem key={ms.id} value={ms.id}>
                  <span className="flex items-center gap-2">
                    <Badge className={ms.status === "published" ? "bg-blue-100 text-blue-700 text-xs" : "bg-emerald-100 text-emerald-700 text-xs"}>
                      {ms.status}
                    </Badge>
                    <span className="truncate max-w-xs">{ms.title}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {publishedMs.length === 0 && (
            <p className="text-sm text-slate-400 mt-2">No accepted or published manuscripts yet.</p>
          )}
        </CardContent>
      </Card>

      {selectedMs && (
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm font-semibold text-slate-700 truncate max-w-sm">{selectedMs.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setPreviewOpen(true)}>
                  <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportPDF}>
                  <Download className="w-3.5 h-3.5 mr-1" /> Export PDF
                </Button>
                <Button size="sm" variant="outline" onClick={handlePrint}>
                  <Printer className="w-3.5 h-3.5 mr-1" /> Print
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                  {saved ? "Saved!" : "Save"}
                </Button>
              </div>
            </div>
          </CardHeader>

          <div className="border-t border-b border-slate-200 bg-slate-50 px-3 py-1.5 flex flex-wrap items-center gap-0.5">
            <ToolbarButton onClick={() => execCmd("undo")} title="Undo"><Undo className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton onClick={() => execCmd("redo")} title="Redo"><Redo className="w-4 h-4" /></ToolbarButton>
            <ToolbarSeparator />
            <select className="text-xs border border-slate-200 rounded px-1 py-0.5 bg-white"
              onChange={e => execCmd("fontName", e.target.value)} defaultValue="Times New Roman">
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <select className="text-xs border border-slate-200 rounded px-1 py-0.5 bg-white ml-1"
              onChange={e => execCmd("fontSize", e.target.value)} defaultValue="3">
              {FONT_SIZES.map((s, i) => <option key={s} value={i + 1}>{s}pt</option>)}
            </select>
            <ToolbarSeparator />
            <ToolbarButton onClick={() => execCmd("bold")} title="Bold"><Bold className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton onClick={() => execCmd("italic")} title="Italic"><Italic className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton onClick={() => execCmd("underline")} title="Underline"><Underline className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton onClick={() => execCmd("strikeThrough")} title="Strikethrough"><Strikethrough className="w-4 h-4" /></ToolbarButton>
            <ToolbarSeparator />
            <ToolbarButton onClick={() => execCmd("formatBlock", "h1")} title="Heading 1"><Heading1 className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton onClick={() => execCmd("formatBlock", "h2")} title="Heading 2"><Heading2 className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton onClick={() => execCmd("formatBlock", "h3")} title="Heading 3"><Heading3 className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton onClick={() => execCmd("formatBlock", "p")} title="Normal text"><FileText className="w-4 h-4" /></ToolbarButton>
            <ToolbarSeparator />
            <ToolbarButton onClick={() => execCmd("justifyLeft")} title="Align Left"><AlignLeft className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton onClick={() => execCmd("justifyCenter")} title="Center"><AlignCenter className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton onClick={() => execCmd("justifyRight")} title="Align Right"><AlignRight className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton onClick={() => execCmd("justifyFull")} title="Justify"><AlignJustify className="w-4 h-4" /></ToolbarButton>
            <ToolbarSeparator />
            <ToolbarButton onClick={() => execCmd("insertUnorderedList")} title="Bullet List"><List className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton onClick={() => execCmd("insertOrderedList")} title="Numbered List"><ListOrdered className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton onClick={() => execCmd("formatBlock", "blockquote")} title="Blockquote"><Quote className="w-4 h-4" /></ToolbarButton>
            <ToolbarSeparator />
            <input type="color" title="Text Color" className="w-6 h-6 rounded cursor-pointer border border-slate-200"
              onChange={e => execCmd("foreColor", e.target.value)} />
            <input type="color" title="Highlight Color" className="w-6 h-6 rounded cursor-pointer border border-slate-200 ml-1"
              defaultValue="#ffff00"
              onChange={e => execCmd("hiliteColor", e.target.value)} />
          </div>

          <CardContent className="p-0">
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="min-h-[500px] p-8 focus:outline-none text-slate-900 leading-relaxed"
              style={{
                fontFamily: "Times New Roman, serif",
                fontSize: "12pt",
                lineHeight: "1.8",
                background: "#fff",
              }}
            />
          </CardContent>
        </Card>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Article Preview</DialogTitle>
          </DialogHeader>
          <div
            className="prose max-w-none p-8 bg-white border rounded"
            style={{ fontFamily: "Times New Roman, serif", fontSize: "12pt", lineHeight: "1.8" }}
            dangerouslySetInnerHTML={{ __html: editorRef.current?.innerHTML || "" }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}><X className="w-4 h-4 mr-1" />Close</Button>
            <Button onClick={handleExportPDF}><Download className="w-4 h-4 mr-1" />Export PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}