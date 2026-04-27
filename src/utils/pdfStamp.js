/**
 * Adds the AfriSci Nexus Discovery branding stamp to a jsPDF document.
 * Call this AFTER adding all content. It stamps every page with a header banner
 * and a footer line including the journal name.
 *
 * @param {import('jspdf').jsPDF} doc
 * @param {string} journalTitle - Name of the publishing journal
 */
export function stampAfriSciNexus(doc, journalTitle = "") {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // ── HEADER BANNER ──────────────────────────────────────────────
    // Deep blue background bar
    doc.setFillColor(30, 64, 175); // blue-800
    doc.rect(0, 0, pageWidth, 12, "F");

    // Teal accent stripe
    doc.setFillColor(13, 148, 136); // teal-600
    doc.rect(0, 11, pageWidth, 2, "F");

    // "AfriSci Nexus Discovery" text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("AfriSci Nexus Discovery", 6, 7.5);

    // Globe emoji substitute — small circle icon
    doc.setFillColor(20, 184, 166); // teal-500
    doc.circle(pageWidth - 18, 6, 3, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);
    doc.text("OA", pageWidth - 19.5, 7);

    // Domain label on right
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(186, 230, 253); // light blue
    doc.text("www.afriscidiscovery.com", pageWidth - 6, 7.5, { align: "right" });

    // ── FOOTER ─────────────────────────────────────────────────────
    // Thin teal line above footer
    doc.setDrawColor(13, 148, 136);
    doc.setLineWidth(0.4);
    doc.line(10, pageHeight - 10, pageWidth - 10, pageHeight - 10);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105); // slate-600

    const footerLeft = journalTitle
      ? `Published in: ${journalTitle} | AfriSci Nexus Discovery`
      : "AfriSci Nexus Discovery | Open Access African Research";
    doc.text(footerLeft, 10, pageHeight - 6);

    // Page number on right
    doc.setFont("helvetica", "normal");
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 10, pageHeight - 6, { align: "right" });

    // Reset text color
    doc.setTextColor(0, 0, 0);
  }
}