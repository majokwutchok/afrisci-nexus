import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { manuscript, journal } = await req.json();

  // Verify the user owns the manuscript or is an editor/admin
  if (!manuscript?.id) return Response.json({ error: 'manuscript.id is required' }, { status: 400 });

  const isOwner = manuscript.created_by === user.email;
  const isEditorOrAdmin = user.role === 'admin' || (user.editor_roles && user.editor_roles.length > 0);
  if (!isOwner && !isEditorOrAdmin) {
    return Response.json({ error: 'Forbidden: you do not have access to this manuscript' }, { status: 403 });
  }

  // Build journal-specific formatting guidelines
  const journalGuidelines = `
    Journal: ${journal?.title || 'Unknown Journal'}
    Category: ${journal?.category || 'General'}
    Languages: ${(journal?.languages || ['english']).join(', ')}
    Open Access: ${journal?.is_open_access ? 'Yes' : 'No'}
  `;

  // Use LLM to produce a formatted version with proper citations, structure and style
  const prompt = `
You are an expert academic manuscript formatter. Reformat the following manuscript according to the target journal's guidelines.

Target Journal Guidelines:
${journalGuidelines}

Manuscript Title: ${manuscript.title}
Abstract: ${manuscript.abstract}
Keywords: ${(manuscript.keywords || []).join(', ')}
Authors: ${(manuscript.authors || []).map(a => `${a.name} (${a.affiliation || ''})`).join('; ')}
Language: ${manuscript.language || 'English'}
Review Type: ${manuscript.review_type || 'double_blind'}

Please produce a complete, reformatted manuscript document with:
1. Proper title page layout (title, authors, affiliations, corresponding author note)
2. Structured abstract (Background, Methods, Results, Conclusions - 250 words max)
3. Keywords section (6-8 keywords)
4. Main body outline with section headings (Introduction, Methods, Results, Discussion, Conclusion)
5. Citation style: APA 7th Edition (most standard for this journal category)
6. Formatting notes: 12pt Times New Roman, double-spaced, 1-inch margins
7. Reference list template with 3 example placeholder references in correct APA format
8. Acknowledgements section placeholder
9. Author contributions statement placeholder
10. Conflict of interest statement placeholder

Format this as a clean, ready-to-use document template.
`;

  const reformattedContent = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });

  // Generate a PDF
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 25;
  const contentWidth = pageWidth - margin * 2;

  // Title
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(manuscript.title, contentWidth);
  doc.text(titleLines, pageWidth / 2, 30, { align: 'center' });

  // Journal banner
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Reformatted for: ${journal?.title || 'Target Journal'} | AfriSci Nexus`, pageWidth / 2, 20, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  let y = 30 + titleLines.length * 8 + 6;

  // Authors
  if (manuscript.authors?.length > 0) {
    doc.setFont('times', 'italic');
    doc.setFontSize(11);
    const authorsStr = manuscript.authors.map(a => a.name).join(', ');
    const authorLines = doc.splitTextToSize(authorsStr, contentWidth);
    doc.text(authorLines, pageWidth / 2, y, { align: 'center' });
    y += authorLines.length * 6 + 4;

    // Affiliations
    doc.setFontSize(9);
    const affiliations = [...new Set(manuscript.authors.map(a => a.affiliation).filter(Boolean))];
    if (affiliations.length > 0) {
      const affLines = doc.splitTextToSize(affiliations.join('; '), contentWidth);
      doc.text(affLines, pageWidth / 2, y, { align: 'center' });
      y += affLines.length * 5 + 4;
    }
  }

  // Separator
  doc.setDrawColor(180, 180, 180);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Render LLM content section by section
  doc.setFont('times', 'normal');
  doc.setFontSize(10);

  const lines = reformattedContent.split('\n');
  for (const line of lines) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      y += 3;
      continue;
    }

    // Headings: lines starting with #, numbers, or ALL CAPS
    if (trimmed.startsWith('#') || /^\d+\./.test(trimmed) || (trimmed === trimmed.toUpperCase() && trimmed.length > 3)) {
      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      const cleaned = trimmed.replace(/^#+\s*/, '');
      doc.text(cleaned, margin, y);
      y += 7;
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
    } else {
      const wrappedLines = doc.splitTextToSize(trimmed, contentWidth);
      doc.text(wrappedLines, margin, y);
      y += wrappedLines.length * 5 + 2;
    }
  }

  // Footer on every page
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