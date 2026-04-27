/**
 * Generates consistent AfriSci Nexus Discovery PDF headers
 * Ensures all PDFs have proper domain branding and journal attribution
 */

export const addAfriSciPDFHeader = (doc, journalTitle = "AfriSci Nexus Discovery") => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 5;
  
  // Header background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 18, 'F');
  
  // White text
  doc.setTextColor(255, 255, 255);
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  
  // Logo/branding text
  doc.text('AfriSci Nexus Discovery', margin + 2, 6);
  
  // Journal name on the right
  doc.setFont('times', 'italic');
  doc.setFontSize(8);
  const journalText = journalTitle || "AfriSci Nexus";
  const journalWidth = doc.getTextWidth(journalText);
  doc.text(journalText, pageWidth - margin - 2 - journalWidth, 6);
  
  // Reset text color for content
  doc.setTextColor(0, 0, 0);
};

export const addAfriSciPDFFooter = (doc) => {
  const pageCount = doc.internal.pages.length - 1;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Add footer on each page
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    
    // Center text: page number
    const pageText = `Page ${i} of ${pageCount}`;
    const textWidth = doc.getTextWidth(pageText);
    doc.text(pageText, (pageWidth - textWidth) / 2, pageHeight - 8);
    
    // Right text: domain
    doc.text('https://afriscinexus.com', pageWidth - 10, pageHeight - 8, { align: 'right' });
  }
};

export default {
  addAfriSciPDFHeader,
  addAfriSciPDFFooter
};