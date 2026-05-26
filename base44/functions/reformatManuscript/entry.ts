import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { manuscript, journal } = await req.json();

  if (!manuscript?.id) return Response.json({ error: 'manuscript.id is required' }, { status: 400 });

  const isOwner = manuscript.created_by === user.email;
  const isEditorOrAdmin = user.role === 'admin' || (user.editor_roles && user.editor_roles.length > 0);
  if (!isOwner && !isEditorOrAdmin) {
    return Response.json({ error: 'Forbidden: you do not have access to this manuscript' }, { status: 403 });
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 25;
  const contentWidth = pageWidth - margin * 2;

  // Banner
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Reformatted for: ${journal?.title || 'Target Journal'} | AfriSci Nexus`, pageWidth / 2, 20, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  // Title
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(manuscript.title, contentWidth);
  doc.text(titleLines, pageWidth / 2, 30, { align: 'center' });
  let y = 30 + titleLines.length * 8 + 6;

  // Authors
  if (manuscript.authors?.length > 0) {
    doc.setFont('times', 'italic');
    doc.setFontSize(11);
    const authorsStr = manuscript.authors.map(a => a.name).join(', ');
    const authorLines = doc.splitTextToSize(authorsStr, contentWidth);
    doc.text(authorLines, pageWidth / 2, y, { align: 'center' });
    y += authorLines.length * 6 + 4;

    const affiliations = [...new Set(manuscript.authors.map(a => a.affiliation).filter(Boolean))];
    if (affiliations.length > 0) {
      doc.setFontSize(9);
      const affLines = doc.splitTextToSize(affiliations.join('; '), contentWidth);
      doc.text(affLines, pageWidth / 2, y, { align: 'center' });
      y += affLines.length * 5 + 4;
    }

    const corresponding = manuscript.authors.find(a => a.is_corresponding);
    if (corresponding?.email) {
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`*Corresponding author: ${corresponding.email}`, pageWidth / 2, y, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      y += 6;
    }
  }

  // Separator
  doc.setDrawColor(180, 180, 180);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  const addSection = (heading, content) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text(heading, margin, y);
    y += 7;
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(content, contentWidth);
    for (const line of lines) {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(line, margin, y);
      y += 5;
    }
    y += 4;
  };

  // Abstract
  addSection('Abstract', manuscript.abstract || 'No abstract provided.');

  // Keywords
  if (manuscript.keywords?.length > 0) {
    addSection('Keywords', manuscript.keywords.join('; '));
  }

  // Manuscript body sections (template)
  addSection('1. Introduction', 'Please replace this section with the full introduction of your manuscript. Introduce the research problem, state objectives, and provide context for the study within the African research landscape.');

  addSection('2. Materials and Methods', 'Describe your research methodology, study design, data collection procedures, and analysis techniques. Ensure compliance with ethical guidelines applicable in your country and institution.');

  addSection('3. Results', 'Present your findings clearly and objectively. Use tables and figures where appropriate (include as appendices or supplementary files). Quantitative data should include measures of statistical significance.');

  addSection('4. Discussion', 'Interpret your results in light of existing literature. Discuss implications, limitations, and contributions to knowledge within the African context and the broader field.');

  addSection('5. Conclusion', 'Summarise the main findings and their significance. Provide recommendations for future research directions.');

  addSection('Acknowledgements', 'Acknowledge funding sources, institutional support, and contributions that do not qualify for authorship. [Replace with your actual acknowledgements]');

  addSection('Author Contributions', 'List specific contributions of each author (e.g., conceptualization, data collection, writing, review). [Replace with actual contributions]');

  addSection('Conflict of Interest', 'The authors declare no conflict of interest. [Modify if applicable]');

  addSection('References', `References should be formatted in APA 7th Edition style. Examples:
Author, A. A., & Author, B. B. (Year). Title of article. Title of Periodical, volume(issue), page–page. https://doi.org/xxxxx

Author, C. C. (Year). Title of book. Publisher.

[Replace with your actual references]`);

  // Citation suggestion
  if (manuscript.doi || manuscript.publication_date) {
    const year = manuscript.publication_date ? new Date(manuscript.publication_date).getFullYear() : new Date().getFullYear();
    const firstAuthor = manuscript.authors?.[0]?.name?.split(' ').pop() || 'Author';
    const cite = `${firstAuthor} et al. (${year}). ${manuscript.title}. ${journal?.title || 'AfriSci Nexus'}. ${manuscript.doi ? `https://doi.org/${manuscript.doi}` : ''}`;
    addSection('Suggested Citation', cite);
  }

  // Formatting notes
  addSection('Formatting Guidelines', `• Font: 12pt Times New Roman
• Line spacing: Double-spaced
• Margins: 1 inch (25.4mm) on all sides
• Citation style: APA 7th Edition
• File format: PDF + DOCX
• Word limit: ${journal?.category === 'medicine_health' ? '6,000 words (excluding references)' : '8,000 words (excluding references)'}
• Figures/tables: Numbered consecutively, with descriptive captions
• Ethics approval number: Include if applicable`);

  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Reformatted by AfriSci Nexus | ${new Date().toLocaleDateString()}`, margin, 290);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, 290, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }

  const pdfBytes = doc.output('arraybuffer');

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reformatted_${manuscript.title?.slice(0, 30).replace(/\s+/g, '_') || 'manuscript'}.pdf"`
    }
  });
});