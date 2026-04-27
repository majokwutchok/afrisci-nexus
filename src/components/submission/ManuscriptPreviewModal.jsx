import React from "react";
import { jsPDF } from "jspdf";
import { stampAfriSciNexus } from "@/utils/pdfStamp";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

/**
 * A full-screen preview modal that renders the combined abstract + body
 * in a publication-style layout and allows PDF download.
 *
 * Props:
 *  manuscript: { title, abstract, keywords, authors, body/formatted_body, doi, publication_date }
 *  journal: { title } | null
 *  onClose: () => void
 */
export default function ManuscriptPreviewModal({ manuscript, journal, onClose }) {
  const body = manuscript.body || manuscript.formatted_body || "";

  const renderAuthors = () =>
    (manuscript.authors || [])
      .map(a => `${a.name}${a.affiliation ? ` (${a.affiliation})` : ""}`)
      .join("; ");

  const renderBodyHtml = () => {
    if (!body) return "";
    // Convert markdown-style headings to HTML for preview
    return body
      .replace(/^## (.+)$/gm, "<h3 class='text-base font-bold mt-5 mb-2 text-slate-800'>$1</h3>")
      .replace(/^# (.+)$/gm, "<h2 class='text-lg font-bold mt-6 mb-2 text-slate-900'>$1</h2>")
      .replace(/\n\n/g, "</p><p class='mb-3'>")
      .replace(/\n/g, " ");
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;
    let y = 22;

    // Title
    doc.setFont("times", "bold"); doc.setFontSize(16);
    const titleLines = doc.splitTextToSize(manuscript.title || "", contentWidth);
    doc.text(titleLines, margin, y); y += titleLines.length * 8 + 4;

    // Authors
    if (manuscript.authors?.length) {
      doc.setFont("times", "italic"); doc.setFontSize(11);
      const authLines = doc.splitTextToSize(renderAuthors(), contentWidth);
      authLines.forEach(l => { doc.text(l, margin, y); y += 6; }); y += 2;
    }

    // Journal / DOI
    if (journal?.title) { doc.setFont("times", "normal"); doc.setFontSize(10); doc.text(`Journal: ${journal.title}`, margin, y); y += 6; }
    if (manuscript.doi) { doc.setTextColor(0, 0, 180); doc.text(`DOI: https://doi.org/${manuscript.doi}`, margin, y); doc.setTextColor(0, 0, 0); y += 6; }

    doc.setDrawColor(100); doc.line(margin, y, pageWidth - margin, y); y += 6;

    // Abstract
    doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Abstract", margin, y); y += 6;
    doc.setFont("times", "normal"); doc.setFontSize(11);
    doc.splitTextToSize(manuscript.abstract || "", contentWidth).forEach(l => {
      if (y > 270) { doc.addPage(); y = 22; }
      doc.text(l, margin, y); y += 6;
    }); y += 4;

    // Keywords
    if (manuscript.keywords?.length) {
      doc.setFont("times", "bold"); doc.text("Keywords: ", margin, y);
      doc.setFont("times", "italic"); doc.text(manuscript.keywords.join(", "), margin + 22, y); y += 8;
    }

    // Body
    if (body.trim()) {
      doc.setDrawColor(100); doc.line(margin, y, pageWidth - margin, y); y += 6;
      // Strip markdown headings for PDF text rendering
      const plainBody = body
        .replace(/^#{1,3} (.+)$/gm, (_, t) => `\n${t.toUpperCase()}\n`)
        .replace(/\*\*(.+?)\*\*/g, "$1");
      doc.setFont("times", "normal"); doc.setFontSize(11);
      doc.splitTextToSize(plainBody, contentWidth).forEach(l => {
        if (y > 268) { doc.addPage(); y = 22; }
        doc.text(l, margin, y); y += 6;
      });
    }

    stampAfriSciNexus(doc, journal?.title || "AfriSci Nexus Discovery");
    const fn = (manuscript.title || "manuscript").replace(/[^a-z0-9]/gi, "_").substring(0, 50);
    doc.save(`${fn}_preview.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full relative">
        {/* Header bar */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-indigo-900 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-0.5">Document Preview</p>
            <p className="font-bold text-lg leading-tight line-clamp-1">{manuscript.title || "Untitled Manuscript"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleDownloadPDF} className="bg-teal-500 hover:bg-teal-600 text-white gap-1.5">
              <Download className="w-4 h-4" /> Download PDF
            </Button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* A4-style paper */}
        <div className="p-8 sm:p-14" style={{ fontFamily: "Georgia, 'Times New Roman', serif", lineHeight: 1.8 }}>
          {/* Journal branding */}
          <div className="flex items-center justify-between border-b-2 border-blue-900 pb-3 mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-800">AfriSci Nexus Discovery</p>
              {journal?.title && <p className="text-xs text-slate-500">{journal.title}</p>}
            </div>
            {manuscript.doi && (
              <p className="text-xs font-mono text-blue-700">DOI: {manuscript.doi}</p>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-slate-900 mb-3 leading-tight">{manuscript.title || <span className="text-slate-400 italic">No title</span>}</h1>

          {/* Authors */}
          {manuscript.authors?.length > 0 && (
            <p className="text-sm italic text-slate-600 mb-4">{renderAuthors()}</p>
          )}

          {/* Keywords */}
          {manuscript.keywords?.length > 0 && (
            <p className="text-xs text-slate-500 mb-5">
              <strong>Keywords:</strong> {manuscript.keywords.join(", ")}
            </p>
          )}

          <hr className="border-slate-300 mb-5" />

          {/* Abstract */}
          <div className="mb-6">
            <h2 className="text-base font-bold uppercase tracking-wide text-slate-800 mb-2">Abstract</h2>
            <p className="text-sm text-slate-700 leading-relaxed">{manuscript.abstract || <span className="italic text-slate-400">No abstract provided.</span>}</p>
          </div>

          {/* Body */}
          {body.trim() ? (
            <div>
              <hr className="border-slate-200 mb-5" />
              <div
                className="text-sm text-slate-700 leading-relaxed [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-slate-900 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mt-5 [&_h3]:mb-2 [&_p]:mb-3"
                dangerouslySetInnerHTML={{ __html: `<p class="mb-3">${renderBodyHtml()}</p>` }}
              />
            </div>
          ) : (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 italic">
              No article body provided. Add body content in the "Article Body" step to see the full document preview.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}