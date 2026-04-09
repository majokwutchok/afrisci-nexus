import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { latex_source, manuscript_title } = await req.json();

    if (!latex_source || latex_source.trim().length === 0) {
      return Response.json({ error: 'No LaTeX source provided' }, { status: 400 });
    }

    // Build a minimal valid LaTeX document if only body content provided
    const isFullDocument = latex_source.includes('\\documentclass');
    const fullSource = isFullDocument ? latex_source : `\\documentclass[12pt,a4paper]{article}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{amsmath,amssymb,amsthm}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{hyperref}
\\usepackage{natbib}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\title{${(manuscript_title || 'Manuscript Preview').replace(/[{}\\]/g, '')}}
\\date{\\today}
\\begin{document}
\\maketitle
${latex_source}
\\end{document}`;

    // Use QuickLaTeX API (more reliable than latexonline.cc)
    const quicklatexPayload = new URLSearchParams();
    quicklatexPayload.append('latex', fullSource);
    quicklatexPayload.append('mode', '0'); // 0 = return PDF
    quicklatexPayload.append('out', '1'); // 1 = PNG preview

    let pdfBuffer;
    try {
      const compileResponse = await Promise.race([
        fetch('https://www.quicklatex.com/api/v3/58621cb2c461f8d46a42db995ebf45ad/latex/', {
          method: 'POST',
          body: quicklatexPayload,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Compilation timeout')), 45000))
      ]);

      if (!compileResponse.ok) {
        const errText = await compileResponse.text();
        return Response.json({
          error: 'LaTeX compilation service unavailable',
          details: errText.slice(0, 500),
        }, { status: 503 });
      }

      const contentType = compileResponse.headers.get('content-type') || '';
      if (!contentType.includes('pdf')) {
        const logText = await compileResponse.text();
        return Response.json({
          error: 'Compilation failed — check LaTeX syntax',
          log: logText.slice(0, 2000),
        }, { status: 422 });
      }

      pdfBuffer = await compileResponse.arrayBuffer();
      if (!pdfBuffer || pdfBuffer.byteLength === 0) {
        return Response.json({
          error: 'Compilation produced empty PDF',
          details: 'Your LaTeX may have syntax errors.',
        }, { status: 422 });
      }
    } catch (apiError) {
      // Fallback to latexonline.cc
      console.warn('QuickLaTeX failed, falling back to latexonline.cc');
      const formData = new FormData();
      const blob = new Blob([fullSource], { type: 'text/plain' });
      formData.append('filecontents[]', blob, 'manuscript.tex');
      formData.append('filename[]', 'manuscript.tex');

      const fallbackResponse = await Promise.race([
        fetch('https://latexonline.cc/compile', {
          method: 'POST',
          body: formData,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Fallback timeout')), 40000))
      ]);

      if (!fallbackResponse.ok) {
        return Response.json({
          error: 'Both LaTeX services failed. Please check syntax and try again.',
          details: 'Services: latexonline.cc, quicklatex.com',
        }, { status: 503 });
      }

      pdfBuffer = await fallbackResponse.arrayBuffer();
      if (!pdfBuffer || pdfBuffer.byteLength === 0) {
        return Response.json({
          error: 'Empty PDF from fallback service',
        }, { status: 422 });
      }
    }

    // Convert PDF buffer to base64 safely (handle large files)
    const base64Pdf = Buffer.from(pdfBuffer).toString('base64');

    return Response.json({
      success: true,
      pdf_base64: base64Pdf,
      filename: `${(manuscript_title || 'manuscript').replace(/\s+/g, '_')}_proof.pdf`,
      size_bytes: pdfBuffer.byteLength,
    });

  } catch (error) {
    console.error('LaTeX conversion error:', error);
    return Response.json({
      error: error.message || 'Unexpected error during compilation',
      details: 'Check your LaTeX syntax and try again.'
    }, { status: 500 });
  }
});