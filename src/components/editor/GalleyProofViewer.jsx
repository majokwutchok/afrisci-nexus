import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Printer } from "lucide-react";

/**
 * GalleyProofViewer
 * Renders a Nature/Lancet-style academic galley proof in a full-screen overlay.
 * White background, clean serif typography, print-ready layout.
 */
export default function GalleyProofViewer({ proof, manuscript, journal, onClose }) {
  const printRef = useRef(null);

  if (!proof || !manuscript) return null;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    printWindow.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Galley Proof — ${proof.formatted_title || manuscript.title}</title>
  <style>
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Page Setup ── */
    @page { size: A4; margin: 25mm 20mm 25mm 20mm; }
    body {
      background: #fff;
      color: #111;
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.6;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Journal Banner ── */
    .journal-banner {
      border-top: 4px solid #003366;
      border-bottom: 1px solid #ccc;
      padding: 8pt 0 6pt;
      margin-bottom: 18pt;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .journal-name {
      font-size: 9pt;
      font-weight: bold;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #003366;
    }
    .proof-stamp {
      font-size: 8pt;
      color: #888;
      font-style: italic;
    }

    /* ── Title Block ── */
    .title-block { margin-bottom: 14pt; }
    .article-title {
      font-size: 18pt;
      font-weight: bold;
      line-height: 1.25;
      color: #003366;
      margin-bottom: 10pt;
    }
    .authors {
      font-size: 10.5pt;
      color: #222;
      margin-bottom: 6pt;
    }
    .authors sup { font-size: 7pt; color: #555; }
    .affiliations {
      font-size: 8.5pt;
      color: #555;
      font-style: italic;
      line-height: 1.5;
      margin-bottom: 6pt;
    }
    .affiliations sup { font-size: 6.5pt; }
    .corresponding-note {
      font-size: 8.5pt;
      color: #555;
      font-style: italic;
    }

    /* ── Metadata Strip ── */
    .metadata-strip {
      border-top: 1px solid #ccc;
      border-bottom: 1px solid #ccc;
      padding: 6pt 0;
      margin: 12pt 0;
      display: flex;
      gap: 24pt;
      flex-wrap: wrap;
      font-size: 8.5pt;
      color: #444;
    }
    .metadata-item strong { color: #003366; }

    /* ── Two-Column Layout ── */
    .two-col {
      column-count: 2;
      column-gap: 18pt;
      column-rule: 1px solid #ddd;
    }

    /* ── Section Headings ── */
    h2.section-head {
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #003366;
      margin-top: 14pt;
      margin-bottom: 5pt;
      border-bottom: 1px solid #003366;
      padding-bottom: 2pt;
      break-after: avoid;
    }

    /* ── Abstract Box ── */
    .abstract-box {
      background: #f5f7fa;
      border-left: 3px solid #003366;
      padding: 9pt 12pt;
      margin: 12pt 0;
      font-size: 10pt;
      line-height: 1.55;
      color: #222;
    }
    .abstract-label {
      font-size: 9pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #003366;
      margin-bottom: 5pt;
    }

    /* ── Keywords ── */
    .keywords {
      font-size: 9pt;
      color: #444;
      margin-top: 8pt;
    }
    .keywords strong { color: #003366; }

    /* ── Body Text ── */
    p { margin-bottom: 7pt; text-align: justify; }

    /* ── Citation Box ── */
    .citation-box {
      background: #fffbeb;
      border: 1px solid #e6c85c;
      padding: 8pt 10pt;
      font-size: 8.5pt;
      font-style: italic;
      color: #5a4000;
      margin-top: 10pt;
      break-inside: avoid;
    }
    .citation-box strong { font-style: normal; color: #003366; }

    /* ── Editorial Note ── */
    .editorial-note {
      background: #e8f5e9;
      border: 1px solid #a5d6a7;
      padding: 8pt 10pt;
      font-size: 9pt;
      color: #1b5e20;
      margin-top: 10pt;
      break-inside: avoid;
    }
    .editorial-note strong { display: block; margin-bottom: 3pt; color: #1b5e20; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.05em; }

    /* ── Typesetting Notes ── */
    .typesetting-notes {
      background: #fff8e1;
      border: 1px solid #ffe082;
      padding: 8pt 10pt;
      font-size: 8.5pt;
      color: #5a4000;
      margin-top: 10pt;
      break-inside: avoid;
    }
    .typesetting-notes ul { padding-left: 14pt; }
    .typesetting-notes li { margin-bottom: 3pt; }

    /* ── Footer ── */
    .proof-footer {
      border-top: 1px solid #ccc;
      margin-top: 20pt;
      padding-top: 6pt;
      font-size: 7.5pt;
      color: #999;
      display: flex;
      justify-content: space-between;
    }

    /* ── Running Head (print only) ── */
    @media print {
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="journal-banner">
    <div>
      <span class="journal-name">AfriSci Nexus Discovery</span>
      <span style="display:block; font-size:8pt; color:#0d9488; font-weight:bold; letter-spacing:0.05em; text-transform:uppercase;">${journal?.title || ''}</span>
    </div>
    <span class="proof-stamp">PROOF &mdash; Not for citation until published &mdash; ${new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
  </div>

  <div class="title-block">
    <div class="article-title">${proof.formatted_title || manuscript.title}</div>

    ${proof.formatted_authors && proof.formatted_authors.length > 0 ? `
    <div class="authors">
      ${proof.formatted_authors.map((a, i) =>
        `${a.name}<sup>${a.affiliation_number || (i + 1)}${a.is_corresponding ? '*' : ''}</sup>${i < proof.formatted_authors.length - 1 ? ', ' : ''}`
      ).join('')}
    </div>` : `<div class="authors">${(manuscript.authors || []).map(a => a.name).join(', ')}</div>`}

    ${proof.affiliations && proof.affiliations.length > 0 ? `
    <div class="affiliations">
      ${proof.affiliations.map(a => `<sup>${a.number}</sup>&nbsp;${a.text}`).join('<br/>')}
      <br/>* Corresponding author
    </div>` : ''}

    ${proof.running_head ? `<div class="corresponding-note">Running head: ${proof.running_head}</div>` : ''}
  </div>

  <div class="metadata-strip">
    ${proof.received_date ? `<span><strong>Received:</strong> ${proof.received_date}</span>` : ''}
    ${proof.accepted_date ? `<span><strong>Accepted:</strong> ${proof.accepted_date}</span>` : ''}
    ${proof.doi_display ? `<span><strong>DOI:</strong> ${proof.doi_display}</span>` : (manuscript.doi ? `<span><strong>DOI:</strong> ${manuscript.doi}</span>` : '')}
    <span><strong>Published Online First:</strong> ${manuscript.online_first_date || new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
    <span style="color:#c0392b; font-weight: bold;">⚠ PROOF — Not for citation</span>
  </div>

  <!-- Abstract (single column, before body) -->
  <div class="abstract-box">
    <div class="abstract-label">Abstract</div>
    <p style="margin:0;">${proof.formatted_abstract || manuscript.abstract}</p>
  </div>

  ${proof.structured_keywords && proof.structured_keywords.length > 0 ? `
  <div class="keywords">
    <strong>Keywords:</strong> ${proof.structured_keywords.join(' &bull; ')}
  </div>` : (manuscript.keywords && manuscript.keywords.length > 0 ? `
  <div class="keywords">
    <strong>Keywords:</strong> ${manuscript.keywords.join(' &bull; ')}
  </div>` : '')}

  <!-- Body -->
  <div class="two-col" style="margin-top: 16pt;">

    <h2 class="section-head">Introduction</h2>
    <p>This galley proof presents the final typeset version of the manuscript prior to official publication. The text below represents the author-supplied content as submitted and accepted for publication in AfriSci Nexus Discovery. Authors are requested to review this proof carefully and notify the editorial office of any corrections required.</p>
    <p>This document is a proof copy circulated for author review purposes only and should not be cited until the final published version is released with a confirmed volume, issue, and page range.</p>

    <h2 class="section-head">Manuscript Details</h2>
    <p><strong>Title:</strong> ${proof.formatted_title || manuscript.title}</p>
    <p><strong>Language:</strong> ${manuscript.language ? manuscript.language.charAt(0).toUpperCase() + manuscript.language.slice(1) : 'English'}</p>
    <p><strong>Access Type:</strong> ${manuscript.access_type ? manuscript.access_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Open Access'}</p>
    <p><strong>Submission Date:</strong> ${manuscript.submission_date || 'Not recorded'}</p>
    <p><strong>Accepted Date:</strong> ${manuscript.timeline ? (manuscript.timeline.find(t => t.status === 'accepted')?.date || 'Not recorded') : 'Not recorded'}</p>

    <h2 class="section-head">Author Contributions</h2>
    <p>${(manuscript.authors || []).filter(a => a.is_corresponding).map(a =>
      `${a.name} (${a.affiliation || 'corresponding author'}) contributed to study design, data analysis, and manuscript preparation.`
    ).join(' ') || 'Author contributions are available in the full manuscript.'}</p>

    ${proof.publication_note ? `
    <h2 class="section-head">Editorial Note</h2>
    <p>${proof.publication_note}</p>` : ''}

    <h2 class="section-head">Open Access Statement</h2>
    <p>This is an Open Access article distributed under the terms of the Creative Commons Attribution License (CC BY 4.0), which permits unrestricted use, distribution, and reproduction in any medium, provided the original work is properly cited.</p>

    <h2 class="section-head">Citation</h2>
    ${proof.citation_suggestion ? `
    <div class="citation-box">
      <strong>Cite this article as:</strong><br/>
      ${proof.citation_suggestion}
    </div>` : `
    <div class="citation-box">
      <strong>Cite this article as:</strong><br/>
      ${(manuscript.authors || []).map(a => a.name).join(', ')} (${new Date().getFullYear()}). ${manuscript.title}. <em>AfriSci Nexus Discovery</em>.${manuscript.doi ? ` https://doi.org/${manuscript.doi}` : ''}
    </div>`}

    ${proof.formatting_notes && proof.formatting_notes.length > 0 ? `
    <div class="typesetting-notes">
      <strong style="text-transform:uppercase; letter-spacing:0.05em; font-size:8pt; color:#7a5000;">⚠ Typesetting Notes</strong>
      <ul style="margin-top:5pt;">
        ${proof.formatting_notes.map(n => `<li>${n}</li>`).join('')}
      </ul>
    </div>` : ''}
  </div>

  <div class="proof-footer">
    <span>AfriSci Nexus Discovery | www.afriscidiscovery.com${journal?.title ? ' | ' + journal.title : ''}</span>
    <span>${proof.doi_display || (manuscript.doi ? `https://doi.org/${manuscript.doi}` : 'DOI: Pending')}</span>
    <span>© ${new Date().getFullYear()} The Authors | CC BY 4.0</span>
  </div>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 600);
  };

  // Authors string
  const authorsStr = proof.formatted_authors && proof.formatted_authors.length > 0
    ? proof.formatted_authors
    : (manuscript.authors || []).map((a, i) => ({ name: a.name, affiliation_number: i + 1, is_corresponding: a.is_corresponding }));

  return (
    <div className="fixed inset-0 z-50 bg-slate-700/80 backdrop-blur-sm flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-6 bg-blue-900 rounded-sm" />
          <span className="font-semibold text-sm">Galley Proof — AfriSci Nexus Discovery</span>
          <Badge className="bg-amber-500 text-white text-xs">PROOF — Not for citation</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handlePrint}
            className="bg-blue-700 hover:bg-blue-800 text-white gap-2">
            <Printer className="w-4 h-4" /> Print / Save PDF
          </Button>
          <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Document scroll area */}
      <div className="flex-1 overflow-y-auto py-8 px-4 flex justify-center">
        {/* A4-style white document */}
        <div
          ref={printRef}
          className="bg-white text-black w-full max-w-3xl shadow-2xl"
          style={{ fontFamily: "'Times New Roman', Times, serif", minHeight: "1123px", padding: "40px 56px" }}
        >
          {/* ── Journal Banner ── */}
          <div style={{ background: "linear-gradient(90deg, #1e3a8a 0%, #1e40af 100%)", borderBottom: "3px solid #0d9488", paddingBottom: "8px", paddingTop: "8px", paddingLeft: "16px", paddingRight: "16px", marginBottom: "20px", marginLeft: "-56px", marginRight: "-56px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: "bold", letterSpacing: "0.08em", textTransform: "uppercase", color: "#ffffff", fontFamily: "sans-serif" }}>
                AfriSci Nexus Discovery
              </span>
              {journal?.title && (
                <span style={{ display: "block", fontSize: "9px", color: "#5eead4", fontFamily: "sans-serif", marginTop: "1px" }}>
                  {journal.title}
                </span>
              )}
            </div>
            <span style={{ fontSize: "8px", color: "#bae6fd", fontStyle: "italic", fontFamily: "sans-serif" }}>
              PROOF · Not for citation · {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          {/* ── Article Title ── */}
          <h1 style={{ fontSize: "22px", fontWeight: "bold", lineHeight: 1.25, color: "#003366", marginBottom: "14px" }}>
            {proof.formatted_title || manuscript.title}
          </h1>

          {/* ── Authors ── */}
          <p style={{ fontSize: "13px", color: "#222", marginBottom: "8px" }}>
            {authorsStr.map((a, i) => (
              <span key={i}>
                {a.name}<sup style={{ fontSize: "9px", color: "#555" }}>{a.affiliation_number}{a.is_corresponding ? "*" : ""}</sup>
                {i < authorsStr.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>

          {/* ── Affiliations ── */}
          {proof.affiliations && proof.affiliations.length > 0 && (
            <div style={{ fontSize: "11px", color: "#555", fontStyle: "italic", lineHeight: 1.6, marginBottom: "6px" }}>
              {proof.affiliations.map(a => (
                <div key={a.number}>
                  <sup style={{ fontSize: "9px" }}>{a.number}</sup> {a.text}
                </div>
              ))}
              <div style={{ marginTop: "3px" }}>* Corresponding author</div>
            </div>
          )}

          {proof.running_head && (
            <p style={{ fontSize: "10px", color: "#777", fontStyle: "italic", marginBottom: "4px" }}>
              Running head: {proof.running_head}
            </p>
          )}

          {/* ── Metadata strip ── */}
          <div style={{ borderTop: "1px solid #ccc", borderBottom: "1px solid #ccc", padding: "8px 0", margin: "14px 0", display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "11px", color: "#444", fontFamily: "sans-serif" }}>
            {proof.received_date && <span><strong style={{ color: "#003366" }}>Received:</strong> {proof.received_date}</span>}
            {proof.accepted_date && <span><strong style={{ color: "#003366" }}>Accepted:</strong> {proof.accepted_date}</span>}
            {(proof.doi_display || manuscript.doi) && (
              <span>
                <strong style={{ color: "#003366" }}>DOI:</strong>{" "}
                <a href={`https://doi.org/${proof.doi_display || manuscript.doi}`} target="_blank" rel="noreferrer"
                  style={{ color: "#1a56db" }}>
                  {proof.doi_display || manuscript.doi}
                </a>
              </span>
            )}
            <span style={{ color: "#c0392b", fontWeight: "bold" }}>⚠ PROOF</span>
          </div>

          {/* ── Abstract ── */}
          <div style={{ background: "#f5f7fa", borderLeft: "3px solid #003366", padding: "12px 16px", margin: "14px 0" }}>
            <div style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.07em", color: "#003366", marginBottom: "7px", fontFamily: "sans-serif" }}>
              Abstract
            </div>
            <p style={{ fontSize: "12px", lineHeight: 1.6, color: "#222", margin: 0, textAlign: "justify" }}>
              {proof.formatted_abstract || manuscript.abstract}
            </p>
          </div>

          {/* ── Keywords ── */}
          {(proof.structured_keywords?.length > 0 || manuscript.keywords?.length > 0) && (
            <p style={{ fontSize: "11px", color: "#444", marginBottom: "18px" }}>
              <strong style={{ color: "#003366" }}>Keywords:</strong>{" "}
              {(proof.structured_keywords?.length > 0 ? proof.structured_keywords : manuscript.keywords).join(" · ")}
            </p>
          )}

          {/* ── Divider ── */}
          <hr style={{ border: "none", borderTop: "1px solid #ddd", margin: "18px 0" }} />

          {/* ── Body (two-column) ── */}
          <div style={{ columns: "2", columnGap: "28px", columnRule: "1px solid #e0e0e0" }}>

            <SectionHead>Introduction</SectionHead>
            <BodyText>
              This galley proof presents the final typeset version of the accepted manuscript prior to official publication in AfriSci Nexus Discovery. Authors are requested to review this proof carefully and notify the editorial office of any corrections required within 48 hours of receipt.
            </BodyText>
            <BodyText>
              This document should not be cited, quoted, or distributed until the final published version with confirmed volume, issue, and page numbers has been released.
            </BodyText>

            <SectionHead>Manuscript Details</SectionHead>
            <BodyText><strong>Language:</strong> {manuscript.language ? manuscript.language.charAt(0).toUpperCase() + manuscript.language.slice(1) : "English"}</BodyText>
            <BodyText><strong>Access Type:</strong> {manuscript.access_type ? manuscript.access_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Open Access"}</BodyText>
            <BodyText><strong>Submission Date:</strong> {manuscript.submission_date || "Not recorded"}</BodyText>
            <BodyText><strong>Review Type:</strong> {manuscript.review_type ? manuscript.review_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Double Blind"}</BodyText>

            {(manuscript.authors || []).some(a => a.is_corresponding) && (
              <>
                <SectionHead>Corresponding Author</SectionHead>
                {(manuscript.authors || []).filter(a => a.is_corresponding).map((a, i) => (
                  <BodyText key={i}>
                    {a.name}{a.affiliation ? `, ${a.affiliation}` : ""}{a.email ? `. E-mail: ${a.email}` : ""}{a.orcid ? `. ORCID: ${a.orcid}` : ""}
                  </BodyText>
                ))}
              </>
            )}

            {proof.publication_note && (
              <>
                <SectionHead>Editorial Note</SectionHead>
                <BodyText>{proof.publication_note}</BodyText>
              </>
            )}

            <SectionHead>Open Access Statement</SectionHead>
            <BodyText>
              This is an Open Access article distributed under the terms of the Creative Commons Attribution 4.0 International License (CC BY 4.0), which permits unrestricted use, distribution, and reproduction in any medium, provided the original work is properly cited.
            </BodyText>

            <SectionHead>How to Cite</SectionHead>
            <div style={{ background: "#fffbeb", border: "1px solid #e6c85c", padding: "9px 11px", fontSize: "11px", fontStyle: "italic", color: "#5a4000", marginBottom: "10px", breakInside: "avoid" }}>
              <strong style={{ fontStyle: "normal", color: "#003366", display: "block", marginBottom: "3px" }}>Citation:</strong>
              {proof.citation_suggestion
                ? proof.citation_suggestion
                : `${(manuscript.authors || []).map(a => a.name).join(", ")} (${new Date().getFullYear()}). ${manuscript.title}. AfriSci Nexus Discovery.${manuscript.doi ? ` https://doi.org/${manuscript.doi}` : ""}`}
            </div>

            {proof.formatting_notes && proof.formatting_notes.length > 0 && (
              <>
                <SectionHead>Typesetting Notes</SectionHead>
                <div style={{ background: "#fff8e1", border: "1px solid #ffe082", padding: "9px 11px", fontSize: "11px", color: "#5a4000", breakInside: "avoid" }}>
                  <ul style={{ paddingLeft: "16px", margin: 0 }}>
                    {proof.formatting_notes.map((n, i) => (
                      <li key={i} style={{ marginBottom: "3px" }}>{n}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* ── Footer ── */}
          <div style={{ borderTop: "2px solid #0d9488", marginTop: "28px", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#64748b", fontFamily: "sans-serif" }}>
            <span>AfriSci Nexus Discovery{journal?.title ? ` · ${journal.title}` : ""} · www.afriscidiscovery.com</span>
            <span>{proof.doi_display || (manuscript.doi ? `https://doi.org/${manuscript.doi}` : "DOI: Pending")}</span>
            <span>© {new Date().getFullYear()} The Authors | CC BY 4.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Small helper components ── */
function SectionHead({ children }) {
  return (
    <div style={{
      fontSize: "11px",
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      color: "#003366",
      borderBottom: "1px solid #003366",
      paddingBottom: "2px",
      marginTop: "16px",
      marginBottom: "6px",
      fontFamily: "sans-serif"
    }}>
      {children}
    </div>
  );
}

function BodyText({ children }) {
  return (
    <p style={{ fontSize: "12px", lineHeight: 1.65, color: "#222", marginBottom: "7px", textAlign: "justify" }}>
      {children}
    </p>
  );
}